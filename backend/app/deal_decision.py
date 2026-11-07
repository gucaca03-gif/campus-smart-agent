"""省一省 · 理性消费决策助手核心服务。

设计原则：
- 金额全部使用整数分（避免浮点误差）；
- 价格快照只追加，不覆盖历史；
- 数据源必须显式声明能力，未配置时如实返回 unconfigured；
- 同款匹配分级，替代品不混入同款最低价；
- 条件优惠单独标注，不默认所有人可享；
- 社区投票只产生「社区意见倾向」，绝不自动转成个人决定；
- 结算依赖主键幂等，并发只会成功一次。
"""

import json
import re
import socket
import urllib.parse
from datetime import datetime, timedelta

from sqlalchemy.exc import IntegrityError

from .models import (
    AlertLog,
    DataSource,
    EvidenceSource,
    GroupMember,
    PlanResult,
    PlanVote,
    PriceAlert,
    PriceSnapshot,
    PurchasePlan,
    Quote,
)


def now_str() -> str:
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")


def cents(yuan) -> int:
    try:
        return int(round(float(yuan) * 100))
    except (TypeError, ValueError):
        return 0


def yuan(c: int) -> float:
    return round((c or 0) / 100, 2)


# ---------------------------------------------------------------------------
# 数据源适配器
# ---------------------------------------------------------------------------

class SourceAdapter:
    """统一适配器接口：search / quote / history 能力由 capabilities 声明。"""

    key = "base"
    name = "Base"

    def capabilities(self):
        return {"search": False, "quote": False, "history": False}

    def status(self):
        return "unconfigured"

    def search(self, keyword: str):
        raise NotImplementedError

    def quote(self, url: str):
        raise NotImplementedError

    def history(self, sku: str):
        raise NotImplementedError


class ManualAdapter(SourceAdapter):
    """手动报价：永远可用；历史从系统开始记录用户录入的报价。"""

    key = "manual"
    name = "手动录入（用户提供报价与凭证）"

    def capabilities(self):
        return {"search": False, "quote": True, "history": True}

    def status(self):
        return "enabled"


class NotConfiguredAdapter(SourceAdapter):
    def __init__(self, key, name, caps, reason):
        self.key = key
        self.name = name
        self._caps = caps
        self._reason = reason

    def capabilities(self):
        return self._caps

    def status(self):
        return "unconfigured"

    def reason(self):
        return self._reason


# 现有可接入状态：仅手动录入真实可用。
# 其它平台没有可直接使用的免费官方接口（需授权/联盟资质），如实标记未配置，
# 绝不伪造搜索结果或历史价格。配置密钥后可通过 register_adapter 注册真实适配器。
ADAPTERS = {
    "manual": ManualAdapter(),
    "taobao": NotConfiguredAdapter(
        "taobao", "淘宝/天猫",
        {"search": True, "quote": False, "history": False},
        "需开放平台授权（联盟 API）与 AppKey，当前未配置",
    ),
    "jd": NotConfiguredAdapter(
        "jd", "京东",
        {"search": True, "quote": False, "history": False},
        "需京东联盟 API 权限，当前未配置",
    ),
    "pdd": NotConfiguredAdapter(
        "pdd", "拼多多",
        {"search": False, "quote": False, "history": False},
        "无公开免费接口，需商家授权，当前未配置",
    ),
}


def register_adapter(adapter: SourceAdapter):
    ADAPTERS[adapter.key] = adapter


def source_status() -> list:
    return [
        {
            "key": a.key,
            "name": a.name,
            "status": a.status(),
            "capabilities": a.capabilities(),
            "note": a.reason() if hasattr(a, "reason") else "手动录入，数据来源为本人填写的报价",
        }
        for a in ADAPTERS.values()
    ]


def ensure_sources(db):
    """首次启动写入数据源状态（真实状态，非演示数据）。"""
    for a in ADAPTERS.values():
        row = db.query(DataSource).filter(DataSource.key == a.key).first()
        if not row:
            db.add(
                DataSource(
                    key=a.key,
                    name=a.name,
                    capabilities=json.dumps(a.capabilities(), ensure_ascii=False),
                    status=a.status(),
                    note=a.reason() if hasattr(a, "reason") else "手动录入，数据来源为本人填写的报价",
                )
            )
    db.commit()


# ---------------------------------------------------------------------------
# 商品链接识别（SSRF 防护）
# ---------------------------------------------------------------------------

# 仅支持被声明过的数据源域名；白名单为空的数据源 = 不支持链接识别。
ALLOWED_HOSTS = {
    "manual": set(),
    "taobao": {"item.taobao.com", "detail.tmall.com", "www.taobao.com"},
    "jd": {"item.jd.com", "item.m.jd.com", "www.jd.com"},
    "pdd": set(),
}

_PRIVATE_NETS = [
    "10.", "127.", "169.254.", "172.16.", "172.17.", "172.18.", "172.19.",
    "172.20.", "172.21.", "172.22.", "172.23.", "172.24.", "172.25.", "172.26.",
    "172.27.", "172.28.", "172.29.", "172.30.", "172.31.", "192.168.", "0.",
    "100.64.", "198.18.", "198.19.",
]


def _is_private_ip(ip: str) -> bool:
    if ip.startswith(("::1", "fc", "fd", "fe80")):
        return True
    return any(ip.startswith(p) for p in _PRIVATE_NETS)


def check_link_allowed(url: str):
    """校验链接可抓取性：https、白名单域名、DNS 解析不得指向内网/本机。"""
    try:
        parsed = urllib.parse.urlparse(url)
    except Exception:
        return False, "链接格式不正确"
    if parsed.scheme not in ("http", "https"):
        return False, "仅支持 http/https 链接"
    host = (parsed.hostname or "").lower()
    if not host:
        return False, "链接缺少域名"
    if host in ("localhost", "metadata.google.internal"):
        return False, "禁止访问本机或云元数据地址"
    allowed = set()
    for hosts in ALLOWED_HOSTS.values():
        allowed |= hosts
    if host not in allowed:
        return False, f"该平台暂未接入链接识别（允许域名：{'、'.join(sorted(allowed)) or '无'}）"
    try:
        infos = socket.getaddrinfo(host, None)
    except socket.gaierror:
        return False, "域名解析失败"
    for info in infos:
        ip = info[4][0]
        if _is_private_ip(ip):
            return False, "域名解析到内网地址，已拒绝"
    return True, ""


def parse_link(url: str) -> dict:
    """链接识别：只做安全校验与平台识别，不抓取正文（避免绕过平台规则）。"""
    ok, reason = check_link_allowed(url)
    if not ok:
        return {"ok": False, "reason": reason}
    host = (urllib.parse.urlparse(url).hostname or "").lower()
    platform = "taobao" if "taobao" in host or "tmall" in host else "jd" if "jd" in host else "manual"
    return {
        "ok": True,
        "platform": platform,
        "note": "已识别链接域名；商品字段仍需你确认或手动补充（不抓取受限制页面正文）",
    }


# ---------------------------------------------------------------------------
# 报价成本与历史
# ---------------------------------------------------------------------------

def base_cost_cent(q: Quote) -> int:
    """可确认的基础到手价：标价 - 优惠券 + 运费 + 其他费用。

    仅当该报价没有资格限制且运费已知时才视为「所有用户可享」。
    有条件的报价单独展示（conditions 非空）。
    """
    return max(0, q.price_cent - q.coupon_cent + q.shipping_cent + q.fee_cent)


def quote_dict(q: Quote, match_level: str = "exact", match_note: str = "") -> dict:
    total = base_cost_cent(q)
    unit = total / q.qty if q.qty else total
    return {
        "id": q.id,
        "product_id": q.product_id,
        "source_key": q.source_key,
        "source_name": ADAPTERS[q.source_key].name if q.source_key in ADAPTERS else q.source_key,
        "platform": q.platform,
        "merchant": q.merchant,
        "spec": q.spec,
        "price": yuan(q.price_cent),
        "coupon": yuan(q.coupon_cent),
        "shipping": yuan(q.shipping_cent),
        "fee": yuan(q.fee_cent),
        "qty": q.qty,
        "currency": q.currency,
        "conditions": q.conditions,
        "conditional": bool(q.conditions),
        "base_total": yuan(total),
        "unit_price": round(unit / 100, 2),
        "cost_complete": bool(q.cost_complete),
        "url": q.url,
        "stock": q.stock,
        "region": q.region,
        "fetched_at": q.fetched_at,
        "note": q.note,
        "match_level": q.match_level or match_level,
        "match_note": q.match_note or match_note,
    }


def comparable_quotes(db, product_id: int, platform_filter: str = ""):
    rows = db.query(Quote).filter(Quote.product_id == product_id).all()
    if platform_filter:
        rows = [r for r in rows if r.platform == platform_filter]
    # 可比较：精确同款 + 成本完整 + 无资格限制 + 有库存或未知（替代品绝不混入最低价）
    comp = [r for r in rows if (r.match_level or "exact") == "exact" and r.cost_complete and not r.conditions and r.stock != "out_of_stock"]
    comp.sort(key=base_cost_cent)
    return rows, comp


def history_stats(db, product_id: int, quote_id=None, days: int = 30):
    """真实历史统计；无记录时返回空，不生成曲线。"""
    since = (datetime.now() - timedelta(days=days)).strftime("%Y-%m-%d %H:%M:%S")
    q = db.query(PriceSnapshot).filter(
        PriceSnapshot.product_id == product_id,
        PriceSnapshot.fetched_at >= since,
        PriceSnapshot.quality != "missing",
    )
    if quote_id:
        q = q.filter(PriceSnapshot.quote_id == quote_id)
    rows = q.order_by(PriceSnapshot.fetched_at.asc()).all()
    if not rows:
        return {
            "points": [],
            "sample_count": 0,
            "has_history": False,
            "message": "系统从上线后开始记录价格，暂无更早历史数据；不会生成虚构历史曲线。",
        }
    prices = sorted(r.price_cent for r in rows)
    n = len(prices)
    median = prices[n // 2] if n % 2 else (prices[n // 2 - 1] + prices[n // 2]) // 2
    current = rows[-1].price_cent
    lo, hi = prices[0], prices[-1]
    pos = None
    if hi > lo:
        pos = round((current - lo) / (hi - lo) * 100, 1)
    # 采样不足（<3 个不同日期）时不给趋势结论
    distinct_days = len({r.fetched_at[:10] for r in rows})
    return {
        "points": [
            {
                "price": yuan(r.price_cent),
                "observed_at": r.observed_at,
                "fetched_at": r.fetched_at,
                "source_key": r.source_key,
                "quality": r.quality,
                "available": bool(r.available),
            }
            for r in rows
        ],
        "sample_count": n,
        "distinct_days": distinct_days,
        "has_history": True,
        "min": yuan(lo),
        "max": yuan(hi),
        "median": yuan(median),
        "current": yuan(current),
        "range_start": rows[0].fetched_at[:10],
        "range_end": rows[-1].fetched_at[:10],
        "position_pct": pos if n >= 3 else None,
        "trend_reliable": n >= 3 and distinct_days >= 2,
        "message": "历史最低指本系统已记录范围内的最低价，不代表全网历史最低。"
        if n >= 3
        else "采样点不足，暂不提供趋势与分位结论。",
    }


def add_snapshot(db, quote: Quote, observed_at: str = ""):
    snap = PriceSnapshot(
        quote_id=quote.id,
        product_id=quote.product_id,
        source_key=quote.source_key,
        price_cent=base_cost_cent(quote),
        breakdown=json.dumps(
            {
                "price": quote.price_cent,
                "coupon": quote.coupon_cent,
                "shipping": quote.shipping_cent,
                "fee": quote.fee_cent,
                "qty": quote.qty,
                "conditions": quote.conditions,
            },
            ensure_ascii=False,
        ),
        currency=quote.currency,
        region=quote.region,
        observed_at=observed_at or quote.observed_at or now_str(),
        fetched_at=now_str(),
        available=0 if quote.stock == "out_of_stock" else 1,
        quality="ok" if quote.cost_complete else "suspect",
    )
    db.add(snap)
    return snap


# ---------------------------------------------------------------------------
# 计划状态机与结算
# ---------------------------------------------------------------------------

DISCUSS = {"draft", "discussing", "ended", "cancelled"}
DECISION = {"undecided", "cooling", "purchased", "deferred", "abandoned"}
VOTE_CHOICES = {"buy", "suggest", "wait", "against"}

VOTE_LABELS = {"buy": "支持购买", "suggest": "建议斟酌", "wait": "建议再等等", "against": "不建议购买"}


def can_read_plan(db, plan: PurchasePlan, user_id: int, member_group_ids=None) -> bool:
    if plan.visibility == "private":
        return plan.user_id == user_id
    if plan.visibility == "group":
        if plan.user_id == user_id:
            return True
        return plan.group_id is not None and plan.group_id in (member_group_ids or set())
    return True  # public


def settle_plan(db, plan: PurchasePlan, reason: str):
    """幂等结算：PlanResult 主键为 plan_id，并发只有一次插入成功。"""
    if plan.discuss_status == "ended":
        row = db.get(PlanResult, plan.id)
        return row, False
    votes = db.query(PlanVote).filter(PlanVote.plan_id == plan.id).all()
    counts = {k: 0 for k in VOTE_CHOICES}
    for v in votes:
        if v.choice in counts:
            counts[v.choice] += 1
    total = sum(counts.values())
    top = max(counts.values()) if total else 0
    leaders = [k for k, v in counts.items() if v == top] if total else []
    tie = 1 if total and len(leaders) > 1 else 0
    try:
        result = PlanResult(
            plan_id=plan.id,
            settle_reason=reason,
            counts=json.dumps(counts, ensure_ascii=False),
            total=total,
            tie=tie,
            settled_at=now_str(),
        )
        db.add(result)
        plan.discuss_status = "ended"
        plan.updated_at = now_str()
        db.commit()
        return result, True
    except IntegrityError:
        db.rollback()
        return db.get(PlanResult, plan.id), False


def maybe_settle(db, plan: PurchasePlan):
    """投票后按结束规则自动结算（目标人数或截止时间）。"""
    if plan.discuss_status != "discussing":
        return None, False
    votes = db.query(PlanVote).filter(PlanVote.plan_id == plan.id).count()
    reason = ""
    if plan.end_mode == "target_votes" and plan.target_votes > 0 and votes >= plan.target_votes:
        reason = "target_votes_reached"
    elif plan.deadline and now_str() >= plan.deadline:
        reason = "deadline_reached"
    if not reason:
        return None, False
    return settle_plan(db, plan, reason)


def vote_summary(db, plan: PurchasePlan):
    result = db.get(PlanResult, plan.id)
    votes = db.query(PlanVote).filter(PlanVote.plan_id == plan.id).all()
    counts = {k: 0 for k in VOTE_CHOICES}
    for v in votes:
        if v.choice in counts:
            counts[v.choice] += 1
    total = sum(counts.values())
    top = max(counts.values()) if total else 0
    leaders = [k for k, v in counts.items() if v == top] if total else []
    if total == 0:
        tendency = "暂无投票，无法形成社区意见"
    elif len(leaders) > 1:
        tendency = "平票：社区意见分歧，请结合自身情况判断"
    else:
        tendency = f"社区意见倾向：{VOTE_LABELS.get(leaders[0], leaders[0])}（{top}/{total} 票）"
    return {
        "counts": counts,
        "labels": VOTE_LABELS,
        "total": total,
        "tie": 1 if total and len(leaders) > 1 else 0,
        "tendency": tendency,
        "settled": result is not None,
        "settle_reason": result.settle_reason if result else "",
        "settled_at": result.settled_at if result else "",
    }


def plan_snapshot(plan: PurchasePlan, product) -> str:
    return json.dumps(
        {
            "product": {
                "name": product.name if product else "",
                "brand": product.brand if product else "",
                "model": product.model if product else "",
                "sku": product.sku if product else "",
                "specs": json.loads(product.specs or "{}") if product else {},
                "condition": product.condition if product else "",
                "qty": product.qty if product else 1,
            },
            "budget_cent": plan.budget_cent,
            "price_cent": plan.price_cent,
            "visibility": plan.visibility,
            "target_votes": plan.target_votes,
            "deadline": plan.deadline,
        },
        ensure_ascii=False,
    )


# ---------------------------------------------------------------------------
# 决策建议（可解释，不输出精确概率）
# ---------------------------------------------------------------------------

def decision_advice(db, plan: PurchasePlan, product, comp_quotes, stats, evidence_count: int):
    reasons = []
    gaps = []
    conditions = []
    score = 0

    budget = plan.budget_cent
    expected = plan.price_cent or (product.price_cent if product else 0)
    best = base_cost_cent(comp_quotes[0]) if comp_quotes else 0

    if budget > 0 and expected > budget:
        reasons.append(f"预计价格 ¥{yuan(expected)} 超过预算上限 ¥{yuan(budget)}")
        score -= 2
    elif budget > 0:
        reasons.append(f"预计价格在预算上限 ¥{yuan(budget)} 之内")
        score += 1
    else:
        gaps.append("未填写预算上限，无法判断预算适配")

    if plan.existing_items:
        reasons.append(f"已有类似物品：{plan.existing_items}，请确认是否重复购买")
        score -= 1
    if plan.alternative:
        reasons.append(f"你已有替代方案：{plan.alternative}")
    if plan.urgency == "can_wait":
        reasons.append("需求不急，可以先观望价格")
        conditions.append("若价格降至目标价或出现明确新低，可改变建议")
    elif plan.urgency == "urgent":
        reasons.append("需求紧急，等待成本可能高于价格波动")
        score += 1

    if len(comp_quotes) >= 2:
        reasons.append(f"已获取 {len(comp_quotes)} 条可比报价，最低到手价 ¥{yuan(best)}")
        score += 1
    elif len(comp_quotes) == 1:
        gaps.append("目前只有 1 条可比报价，无法确认是否已是最优渠道")
    else:
        gaps.append("暂无完整可比报价（缺少运费/资格信息或未录入）")

    if stats.get("has_history") and stats.get("position_pct") is not None:
        if stats["position_pct"] <= 25:
            reasons.append(f"当前价格处于已记录区间的低位（{stats['position_pct']}%）")
            score += 1
        elif stats["position_pct"] >= 75:
            reasons.append(f"当前价格处于已记录区间的高位（{stats['position_pct']}%），可考虑等待")
            score -= 1
    else:
        gaps.append("历史价格采样不足，无法判断当前位置")

    if evidence_count == 0:
        gaps.append("暂无可信测评证据，参数结论仅来自商品页")

    tendency = vote_summary(db, plan) if plan.discuss_status != "draft" else None
    if tendency and tendency["total"]:
        reasons.append(tendency["tendency"] + "（仅供参考，不替代你的决定）")

    if score >= 3:
        label = "可以考虑购买"
    elif score <= -2:
        label = "建议暂缓，继续观察"

    else:
        label = "建议比较替代方案后再决定"

    return {
        "label": label,
        "reasons": reasons,
        "used_user_info": {
            "budget": yuan(budget) if budget else None,
            "urgency": plan.urgency,
            "frequency": plan.frequency,
            "existing_items": plan.existing_items or None,
            "alternative": plan.alternative or None,
            "wait_days": plan.wait_days,
        },
        "price_basis": {
            "expected": yuan(expected),
            "best_quote": yuan(best) if best else None,
            "history_position": stats.get("position_pct"),
            "history_scope": f"{stats.get('range_start', '')} ~ {stats.get('range_end', '')}"
            if stats.get("has_history")
            else "",
        },
        "evidence_count": evidence_count,
        "what_would_change": conditions
        + ["预算或需求变化", "出现新的可比报价", "冷静期结束后你重新评估理由"],
        "gaps": gaps,
        "disclaimer": "系统只给建议，购买决定由你作出；本建议不含未经校准的概率或评分。",
    }


# ---------------------------------------------------------------------------
# 价格提醒
# ---------------------------------------------------------------------------

def check_alerts(db, plan_id: int):
    """计算提醒是否触发；同一 (alert, 价格档位) 只发一次，且有冷却时间。"""
    alerts = db.query(PriceAlert).filter(PriceAlert.plan_id == plan_id, PriceAlert.enabled == 1).all()
    plan = db.get(PurchasePlan, plan_id)
    if not plan:
        return []
    fired = []
    _, comp = comparable_quotes(db, plan.product_id)
    if not comp:
        return []
    best = comp[0]
    best_cost = base_cost_cent(best)
    stats = history_stats(db, plan.product_id, days=90)
    for a in alerts:
        if a.last_fired_at:
            last = datetime.strptime(a.last_fired_at, "%Y-%m-%d %H:%M:%S")
            if datetime.now() - last < timedelta(minutes=a.cooldown_min or 0):
                continue
        hit = False
        if a.rule_type == "target_price" and a.target_price_cent > 0:
            hit = best_cost <= a.target_price_cent
        elif a.rule_type == "pct_drop" and a.reference_price_cent > 0:
            hit = best_cost <= a.reference_price_cent * (100 - a.pct) / 100
        elif a.rule_type == "new_low":
            lo = min(
                [r.price_cent for r in db.query(PriceSnapshot).filter(PriceSnapshot.product_id == plan.product_id).all()]
                + [best_cost]
            )
            hit = best_cost <= lo and stats.get("sample_count", 0) >= 2
        if not hit:
            continue
        dedup = f"{a.id}:{best_cost}"
        exists = db.query(AlertLog).filter(AlertLog.alert_id == a.id, AlertLog.dedup_key == dedup).first()
        if exists:
            continue
        try:
            db.add(AlertLog(alert_id=a.id, price_cent=best_cost, dedup_key=dedup, fired_at=now_str()))
            a.last_fired_at = now_str()
            db.commit()
            fired.append({"alert_id": a.id, "price": yuan(best_cost), "rule": a.rule_type})
        except IntegrityError:
            db.rollback()
    return fired


# ---------------------------------------------------------------------------
# 金额统计口径
# ---------------------------------------------------------------------------

def money_summary(db, user_id: int):
    plans = db.query(PurchasePlan).filter(PurchasePlan.user_id == user_id).all()
    planned_total = sum(p.price_cent for p in plans if p.decision_status in ("undecided", "cooling"))
    deferred_total = sum(p.price_cent for p in plans if p.decision_status == "deferred")
    abandoned_total = sum(p.price_cent for p in plans if p.decision_status == "abandoned")
    from .models import PurchaseRecord

    records = db.query(PurchaseRecord).filter(PurchaseRecord.user_id == user_id).all()
    spent_total = sum(r.paid_cent for r in records)
    price_diff = 0
    for r in records:
        plan = db.get(PurchasePlan, r.plan_id)
        if plan and plan.price_cent and r.paid_cent and r.paid_cent <= plan.price_cent:
            price_diff += plan.price_cent - r.paid_cent
    return {
        "planned_total": yuan(planned_total),
        "deferred_total": yuan(deferred_total),
        "abandoned_total": yuan(abandoned_total),
        "spent_total": yuan(spent_total),
        "price_diff_total": yuan(price_diff),
        "note": "暂缓/放弃金额是计划金额，不等于实际省下的现金；价格差额仅在实际支付低于计划预计且有可比口径时计算。",
    }