"""省一省相关路由（从 main.py 拆出）。"""

import json
import random
import re
from datetime import date, datetime, timedelta

from fastapi import APIRouter, Body, Depends, File, Form, Header, HTTPException, Query, UploadFile
from sqlalchemy import text
from sqlalchemy.orm import Session

from ..db import SessionLocal, get_db
from ..api_utils import ok, fail, _requester
from .. import deal_decision, tools, office_ai

from ..models import (
    Base,
    Booking,
    BuddyPost,
    BuddyProfile,
    BuddyApplication,
    BuddyChat,
    BuddyAutoReply,
    BuddyMatchLog,
    SeatFavorite,
    Supervision,
    CalendarEvent,
    Campus,
    ChatSession,
    ChatMessage,
    DealPost,
    DealVote,
    Errand,
    LostFound,
    Message,
    News,
    OfficeReview,
    Place,
    PlanItem,
    Pomodoro,
    PurchaseIntent,
    Repair,
    Resource,
    ResourceLink,
    SchoolMetric,
    SelfTask,
    StudyPlan,
    # 省一省 · 理性消费决策助手
    DataSource,
    Product,
    Quote,
    PriceSnapshot,
    DealPriceCache,
    PurchasePlan,
    PlanVersion,
    PlanGroup,
    GroupMember,
    PlanVote,
    PlanComment,
    PlanResult,
    PriceAlert,
    AlertLog,
    EvidenceSource,
    PurchaseRecord,
    DealReport,
)

from ..services import (
    WEEKDAY_CN,
    assistant_reply,
    away_booking,
    booking_to_dict,
    build_route,
    cancel_booking,
    checkin_booking,
    create_booking,
    decide_booking,
    ensure_slots,
    expire_seat_bookings,
    release_seat_reservation,
    parse_date,
    resolve_place,
)

from ..buddy_test import (  # noqa: E402
    ANIMAL_QUESTIONS,
    BATTERY_QUESTIONS,
    MBTI_QUESTIONS,
    SURVIVAL_QUESTIONS,
    mbti_compat,
    score_animal,
    score_battery,
    score_mbti,
    score_survival,
    reading_template,
)

router = APIRouter()


_DEAL_CATEGORY_WORDS = {
    "数码": ["数码", "电子", "电脑", "手机", "耳机", "键盘", "鼠标", "显示器", "平板", "相机"],
    "服饰": ["服饰", "服装", "女装", "男装", "针织", "毛衣", "外套", "裤子", "裙子", "鞋"],
    "食品": ["食品", "零食", "饮料", "口味", "净含量", "保质期"],
    "日用品": ["日用品", "日用", "家居", "清洁", "收纳"],
    "学习用品": ["学习用品", "文具", "笔记本", "笔", "书包"],
}

_AI_PRICE_CACHE: dict[str, tuple[float, dict]] = {}

_AI_PRICE_TTL = 600

_AI_PRICE_DEGRADED_UNTIL = 0.0

@router.get("/api/deals")
def deals(exclude: str = "", exclude_voted: int = 0, limit: int = 0, db: Session = Depends(get_db)):
    posts = db.query(DealPost).filter(DealPost.status != "removed").all()
    votes = db.query(DealVote).all()
    excluded = {int(x) for x in str(exclude).split(",") if str(x).strip().isdigit()}
    voted_ids = {v.post_id for v in votes if v.user_id == 1}
    rows = [p for p in posts if p.id not in excluded and (not exclude_voted or p.id not in voted_ids)]
    random.shuffle(rows)
    if limit and limit > 0:
        rows = rows[:limit]
    result = []
    for p in rows:
        post_votes = [v for v in votes if v.post_id == p.id]
        mine = next((v.vote for v in post_votes if v.user_id == 1), "")
        counts = {"buy": 0, "think": 0, "no": 0}
        opinions = []
        for v in post_votes:
            if v.vote in counts:
                counts[v.vote] += 1
            reason = (v.reason or "").strip()
            if reason:
                opinions.append(
                    {
                        "user_id": v.user_id,
                        "label": "我" if v.user_id == 1 else "同学",
                        "vote": v.vote,
                        "reason": reason[:200],
                    }
                )
        result.append(
            {
                "id": p.id,
                "product": p.product,
                "price": p.price_cent / 100,
                "reason": p.reason,
                "category": p.category,
                "status": p.status,
                "votes": counts,
                "my_vote": mine,
                "opinions": opinions,
                "created_at": p.created_at,
            }
        )
    return ok(result)

@router.post("/api/deals")
def add_deal(payload: dict = Body(...), db: Session = Depends(get_db)):
    if not payload.get("product"):
        fail("请填写商品名")
    price = int(float(payload.get("price") or 0) * 100)
    if price < 0:
        fail("价格不能为负")
    post = DealPost(product=payload["product"], price_cent=price, reason=payload.get("reason", ""), category=payload.get("category", "其他"))
    db.add(post)
    db.commit()
    db.refresh(post)
    return ok({"id": post.id}, "已发布")

@router.post("/api/deals/{post_id}/vote")
def vote_deal(post_id: int, payload: dict = Body(...), db: Session = Depends(get_db)):
    vote = payload.get("vote")
    if vote not in ("buy", "think", "no"):
        fail("投票类型不合法")
    reason = str(payload.get("reason") or "").strip()
    if not reason:
        fail("请填写投票理由", "VALIDATION", 400)
    post = db.get(DealPost, post_id)
    if not post:
        fail("帖子不存在", "RESOURCE_NOT_FOUND", 404)
    row = db.query(DealVote).filter(DealVote.post_id == post_id, DealVote.user_id == 1).first()
    if row:
        row.vote = vote
        row.reason = reason[:200]
    else:
        db.add(DealVote(post_id=post_id, user_id=1, vote=vote, reason=reason[:200]))
    db.commit()
    return ok(None, "已记录")

@router.get("/api/purchase-intents")
def intents(db: Session = Depends(get_db)):
    rows = db.query(PurchaseIntent).filter(PurchaseIntent.user_id == 1).order_by(PurchaseIntent.id.desc()).all()
    return ok(
        [{"id": i.id, "name": i.name, "price": i.price_cent / 100, "status": i.status, "created_at": i.created_at, "decided_at": i.decided_at} for i in rows]
    )

@router.post("/api/purchase-intents")
def add_intent(payload: dict = Body(...), db: Session = Depends(get_db)):
    if not payload.get("name"):
        fail("请填写商品名")
    price = int(float(payload.get("price") or 0) * 100)
    row = PurchaseIntent(name=payload["name"], price_cent=price, status="pending")
    db.add(row)
    db.commit()
    db.refresh(row)
    return ok({"id": row.id}, "已记录")

@router.patch("/api/purchase-intents/{intent_id}")
def update_intent(intent_id: int, payload: dict = Body(...), db: Session = Depends(get_db)):
    row = db.get(PurchaseIntent, intent_id)
    if not row:
        fail("记录不存在", "RESOURCE_NOT_FOUND", 404)
    status = payload.get("status")
    if status not in ("pending", "abandoned", "bought"):
        fail("状态不合法")
    row.status = status
    if status != "pending":
        row.decided_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    db.commit()
    return ok(None, "已更新")

@router.get("/api/savings/summary")
def savings_summary(db: Session = Depends(get_db)):
    rows = db.query(PurchaseIntent).filter(PurchaseIntent.user_id == 1).all()
    abandoned = [i for i in rows if i.status == "abandoned"]
    bought = [i for i in rows if i.status == "bought"]
    return ok(
        {
            "saved": sum(i.price_cent for i in abandoned) / 100,
            "abandoned_count": len(abandoned),
            "bought": sum(i.price_cent for i in bought) / 100,
            "pending_count": len([i for i in rows if i.status == "pending"]),
            "note": "累计省钱仅统计已放弃的购买意向，不代表实际现金收入。",
        }
    )

def _member_group_ids(db: Session, user_id: int) -> set:
    rows = db.query(GroupMember).filter(GroupMember.user_id == user_id, GroupMember.status == "active").all()
    return {r.group_id for r in rows}

def _plan_or_404(db: Session, plan_id: int) -> PurchasePlan:
    plan = db.get(PurchasePlan, plan_id)
    if not plan:
        fail("购买计划不存在", "RESOURCE_NOT_FOUND", 404)
    return plan

def _assert_can_read(db: Session, plan: PurchasePlan, user_id: int):
    if not deal_decision.can_read_plan(db, plan, user_id, _member_group_ids(db, user_id)):
        fail("无权访问该购买计划", "FORBIDDEN", 403)

def _product_dict(p: Product) -> dict:
    import json as _json

    try:
        specs = _json.loads(p.specs or "{}")
    except Exception:
        specs = {}
    return {
        "id": p.id,
        "name": p.name,
        "brand": p.brand,
        "category": p.category,
        "model": p.model,
        "sku": p.sku,
        "specs": specs,
        "qty": p.qty,
        "condition": p.condition,
        "platform": p.platform,
        "merchant": p.merchant,
        "url": p.url,
        "image": p.image,
        "price": deal_decision.yuan(p.price_cent),
        "currency": p.currency,
        "source": p.source,
        "confirmed": bool(p.confirmed),
        "note": p.note or "",
    }

def _plan_dict(plan: PurchasePlan, product=None) -> dict:
    return {
        "id": plan.id,
        "product_id": plan.product_id,
        "product_name": product.name if product else "",
        "title": plan.title,
        "budget": deal_decision.yuan(plan.budget_cent),
        "price": deal_decision.yuan(plan.price_cent),
        "scene": plan.scene,
        "reason": plan.reason,
        "urgency": plan.urgency,
        "frequency": plan.frequency,
        "existing_items": plan.existing_items,
        "alternative": plan.alternative,
        "wait_days": plan.wait_days,
        "visibility": plan.visibility,
        "group_id": plan.group_id,
        "end_mode": plan.end_mode,
        "target_votes": plan.target_votes,
        "deadline": plan.deadline,
        "discuss_status": plan.discuss_status,
        "decision_status": plan.decision_status,
        "decide_reason": plan.decide_reason,
        "cool_until": plan.cool_until,
        "created_at": plan.created_at,
        "updated_at": plan.updated_at,
    }

@router.get("/api/deal/sources")
def deal_sources(db: Session = Depends(get_db)):
    deal_decision.ensure_sources(db)
    rows = db.query(DataSource).order_by(DataSource.id).all()
    return ok(
        [
            {
                "key": r.key,
                "name": r.name,
                "status": r.status,
                "capabilities": __import__("json").loads(r.capabilities or "{}"),
                "note": r.note,
                "updated_at": r.updated_at,
            }
            for r in rows
        ]
    )

def _deal_price_tokens(product: str, category: str, queries) -> list:
    """提取用于过滤无关搜索摘要的商品词，避免 OSA 被当成疾病这类歧义。"""
    tokens = []
    for m in re.findall(r"[一-龥]{2,}", product or ""):
        tokens.append(m)
        if len(m) > 4:
            tokens.append(m[-2:])
    for q in queries or []:
        for m in re.findall(r"[一-龥]{2,}", str(q or "")):
            if len(m) <= 8:
                tokens.append(m)
    for w in _DEAL_CATEGORY_WORDS.get(category, []):
        tokens.append(w)
    # 去掉过于宽泛的词，避免把无关页面也放进来
    stop = {"价格", "多少钱", "查询", "品牌", "推荐", "评测", "正品", "官网"}
    out = []
    for t in tokens:
        if t not in stop and t not in out:
            out.append(t)
    return out[:20]

def _deal_local_price_fallback(product: str, sources: list, category: str = "") -> dict:
    """模型不可用时的快速降级：只从已检索到的公开网页摘要里提取价格数字。

    不调用任何外部服务，立即返回；不伪造精确报价，取不到数字时明确说没有。
    """
    values = []
    for item in sources or []:
        text = (str(item.get("title") or "")) + " " + (str(item.get("snippet") or ""))
        for m in re.finditer(r"(?:¥|￥)\s*(\d{1,6}(?:\.\d{1,2})?)|(\d{1,6}(?:\.\d{1,2})?)\s*元", text):
            raw = m.group(1) or m.group(2)
            try:
                value = float(raw)
            except (TypeError, ValueError):
                continue
            if 1 <= value <= 100000:
                values.append(value)
    if values:
        low, high = min(values), max(values)
        if high == low:
            low = max(1.0, round(low * 0.85))
            high = round(high * 1.15)
        summary = f"在线分析暂不可用，已按公开网页摘要中提到的价格整理出参考区间 ¥{low:g}–¥{high:g}。"
    else:
        low = high = 0.0
        summary = "在线分析暂不可用，公开网页也没有明确价格数字，建议到主流电商按同款比价。"
    return {
        "low": low,
        "high": high,
        "currency": "CNY",
        "summary": summary,
        "recommendation": f"先在 2–3 家主流平台搜索「{product}」同款，核对型号、容量与售后后再决定是否购买。",
        "tips": [
            "优先比较同款同规格的到手价，注意运费与是否需要会员/学生认证",
            "校园学生优惠、以旧换新和平台券可进一步降低实际支出",
            "价格明显低于常见区间时先核实真伪与售后政策",
        ],
        "confidence": "低",
        "sources": sources or [],
        "degraded": True,
    }

@router.post("/api/deal/ai-price")
def deal_ai_price(payload: dict = Body(...), db: Session = Depends(get_db)):
    """调用现有 AI 服务，联网检索商品价格区间并给出推荐方案。

    性能要点：
    1. 本地基础查询词与 AI 消歧查询词并行生成，不做串行等待；
    2. 多条 Bing 查询并发执行（tools.search_price_info_multi）；
    3. 同商品结果缓存 10 分钟，切 tab / 重复打开不再重算；
    4. 模型调用超时收紧，避免长时间停在"正在联网检索"。
    """
    from concurrent.futures import ThreadPoolExecutor
    import time as _time
    from . import office_ai, tools

    global _AI_PRICE_DEGRADED_UNTIL

    product = str(payload.get("product") or "").strip()
    category = str(payload.get("category") or "").strip()[:32]
    if not product:
        fail("请输入商品名称")
    if len(product) > 120:
        fail("商品名称过长")

    cache_key = product + "|" + category
    cached = _AI_PRICE_CACHE.get(cache_key)
    if cached and _time.time() - cached[0] < _AI_PRICE_TTL:
        return ok({**cached[1], "cached": True})

    row = db.query(DealPriceCache).filter(DealPriceCache.cache_key == cache_key).first()
    if row:
        try:
            saved = json.loads(row.payload or "")
        except Exception:
            saved = None
        if saved and (saved.get("low") or saved.get("high")):
            _AI_PRICE_CACHE[cache_key] = (_time.time(), saved)
            return ok({**saved, "cached": True})

    ai_down = _time.time() < _AI_PRICE_DEGRADED_UNTIL
    base_queries = list(dict.fromkeys([
        f"{product} 价格",
        f"{product} {category} 价格".strip(),
        f"{product} 评测 价格",
    ]))
    pool = ThreadPoolExecutor(max_workers=2)
    f_queries = None if ai_down else pool.submit(office_ai.llm_search_queries, product, category)
    f_search = pool.submit(tools.search_price_info_multi, base_queries, 8, deadline=12.0)
    raw_sources = f_search.result()
    pool.shutdown(wait=False)

    queries = []
    tokens = _deal_price_tokens(product, category, base_queries)

    def _relevant(items):
        if not tokens:
            return items[:5]
        out, seen = [], set()
        for item in items:
            key = (item.get("url") or "").split("#")[0]
            if not key or key in seen:
                continue
            text = item.get("title", "") + item.get("snippet", "")
            if any(t in text for t in tokens):
                seen.add(key)
                out.append(item)
                if len(out) >= 5:
                    break
        return out

    sources = _relevant(raw_sources)
    if len(sources) < 2 and raw_sources:
        sources = raw_sources[:5]
    if len(sources) < 3 and f_queries is not None:
        # 仅在基础检索不足时才等消歧查询词，避免每条查价都多等一次模型响应
        try:
            queries = f_queries.result(timeout=2.0) or []
        except Exception:
            queries = []
        tokens = _deal_price_tokens(product, category, base_queries + queries)
        extra = [q for q in queries if q not in base_queries][:1]
        if extra:
            sources = _relevant(raw_sources + tools.search_price_info_multi(extra, 8, deadline=10.0))

    if ai_down:
        result = _deal_local_price_fallback(product, sources, category)
        degraded = True
    else:
        # 给模型调用加硬时限：底层连接卡住时直接降级，不能拖住接口
        advice_pool = ThreadPoolExecutor(max_workers=1)
        f_advice = advice_pool.submit(office_ai.llm_price_advice, product, sources, category)
        try:
            result = f_advice.result(timeout=45)
            degraded = False
        except Exception:
            # 模型不可用时立即返回检索结果里的价格参考，不再让页面长时间空等或直接报错
            result = _deal_local_price_fallback(product, sources, category)
            degraded = True
            _AI_PRICE_DEGRADED_UNTIL = _time.time() + 60
        advice_pool.shutdown(wait=False)
    data = {
        "product": product,
        "low": result["low"],
        "high": result["high"],
        "currency": result["currency"],
        "summary": result["summary"],
        "recommendation": result["recommendation"],
        "tips": result["tips"],
        "confidence": result["confidence"],
        "sources": sources,
        "searched": bool(sources),
        "model": office_ai.model(),
        "degraded": degraded,
        "note": "基于公开搜索摘要估算，价格为参考区间；实际价格以下单页为准。"
        if not degraded
        else "在线分析暂不可用，以上为公开网页摘要中的价格参考，请以下单页为准。",
    }
    if data["low"] or data["high"]:
        try:
            blob = json.dumps(data, ensure_ascii=False)
            if row:
                row.payload = blob
                row.updated_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            else:
                db.add(DealPriceCache(cache_key=cache_key, payload=blob))
            db.commit()
        except Exception:
            db.rollback()
    if not degraded:
        _AI_PRICE_CACHE[cache_key] = (_time.time(), data)
    return ok(data)

@router.post("/api/deal/parse-link")
def deal_parse_link(payload: dict = Body(...)):
    url = str(payload.get("url") or "").strip()
    if not url:
        fail("请提供商品链接")
    result = deal_decision.parse_link(url)
    if not result.get("ok"):
        return ok({"recognized": False, "reason": result.get("reason"), "manual_allowed": True})
    return ok({"recognized": True, **result, "manual_allowed": True})

@router.post("/api/deal/products")
def create_product(payload: dict = Body(...), db: Session = Depends(get_db), user_id: int = Depends(_requester)):
    import json as _json

    name = str(payload.get("name") or "").strip()
    if not name:
        fail("请填写商品名称")
    p = Product(
        user_id=user_id,
        name=name,
        brand=str(payload.get("brand") or ""),
        category=str(payload.get("category") or "其他"),
        model=str(payload.get("model") or ""),
        sku=str(payload.get("sku") or ""),
        specs=_json.dumps(payload.get("specs") or {}, ensure_ascii=False),
        qty=max(1, int(payload.get("qty") or 1)),
        condition=str(payload.get("condition") or "new"),
        platform=str(payload.get("platform") or ""),
        merchant=str(payload.get("merchant") or ""),
        url=str(payload.get("url") or ""),
        image=str(payload.get("image") or ""),
        price_cent=deal_decision.cents(payload.get("price")),
        currency=str(payload.get("currency") or "CNY"),
        source=str(payload.get("source") or "manual"),
        confirmed=1 if payload.get("confirmed") else 0,
        note=str(payload.get("note") or ""),
    )
    db.add(p)
    db.commit()
    db.refresh(p)
    return ok(_product_dict(p), "商品已创建")

@router.get("/api/deal/products/{product_id}")
def get_product(product_id: int, db: Session = Depends(get_db), user_id: int = Depends(_requester)):
    p = db.get(Product, product_id)
    if not p:
        fail("商品不存在", "RESOURCE_NOT_FOUND", 404)
    if p.user_id != user_id:
        fail("无权访问该商品", "FORBIDDEN", 403)
    return ok(_product_dict(p))

@router.post("/api/deal/products/{product_id}/quotes")
def add_quote(product_id: int, payload: dict = Body(...), db: Session = Depends(get_db), user_id: int = Depends(_requester)):
    p = db.get(Product, product_id)
    if not p:
        fail("商品不存在", "RESOURCE_NOT_FOUND", 404)
    if p.user_id != user_id:
        fail("无权为该商品添加报价", "FORBIDDEN", 403)
    level = str(payload.get("match_level") or "exact")
    if level not in ("exact", "suspect", "series", "alternative"):
        fail("匹配级别不合法")
    q = Quote(
        product_id=product_id,
        source_key=str(payload.get("source_key") or "manual"),
        platform=str(payload.get("platform") or ""),
        merchant=str(payload.get("merchant") or ""),
        spec=str(payload.get("spec") or ""),
        price_cent=deal_decision.cents(payload.get("price")),
        coupon_cent=deal_decision.cents(payload.get("coupon")),
        shipping_cent=deal_decision.cents(payload.get("shipping")),
        fee_cent=deal_decision.cents(payload.get("fee")),
        qty=max(1, int(payload.get("qty") or 1)),
        currency=str(payload.get("currency") or "CNY"),
        conditions=str(payload.get("conditions") or ""),
        url=str(payload.get("url") or ""),
        stock=str(payload.get("stock") or "unknown"),
        region=str(payload.get("region") or ""),
        cost_complete=1 if payload.get("cost_complete", True) else 0,
        match_level=str(payload.get("match_level") or "exact"),
        match_note=str(payload.get("match_note") or ""),
        note=str(payload.get("note") or ""),
    )
    db.add(q)
    db.commit()
    db.refresh(q)
    deal_decision.add_snapshot(db, q)
    db.commit()
    return ok(deal_decision.quote_dict(q), "报价已记录，并写入价格快照")

@router.get("/api/deal/products/{product_id}/quotes")
def list_quotes(product_id: int, db: Session = Depends(get_db), user_id: int = Depends(_requester)):
    p = db.get(Product, product_id)
    if not p or p.user_id != user_id:
        fail("无权访问该商品报价", "FORBIDDEN", 403)
    rows, comp = deal_decision.comparable_quotes(db, product_id)
    conditional = [r for r in rows if r.conditions or not r.cost_complete]
    return ok(
        {
            "all": [deal_decision.quote_dict(r) for r in rows],
            "comparable": [deal_decision.quote_dict(r) for r in comp],
            "conditional": [deal_decision.quote_dict(r) for r in conditional],
            "lowest_note": "最低价仅指当前已获取、符合比较条件报价中的最低价，不是全网最低。",
            "sources": deal_decision.source_status(),
        }
    )

@router.get("/api/deal/products/{product_id}/history")
def product_history(product_id: int, quote_id: int = Query(default=0), days: int = Query(default=30), db: Session = Depends(get_db), user_id: int = Depends(_requester)):
    p = db.get(Product, product_id)
    if not p or p.user_id != user_id:
        fail("无权访问该商品历史", "FORBIDDEN", 403)
    days = max(1, min(days, 365))
    return ok(deal_decision.history_stats(db, product_id, quote_id or None, days))

@router.get("/api/deal/products/{product_id}/evidence")
def list_evidence(product_id: int, db: Session = Depends(get_db), user_id: int = Depends(_requester)):
    p = db.get(Product, product_id)
    if not p or p.user_id != user_id:
        fail("无权访问该商品证据", "FORBIDDEN", 403)
    rows = db.query(EvidenceSource).filter(EvidenceSource.product_id == product_id).order_by(EvidenceSource.id.desc()).all()
    return ok(
        [
            {
                "id": r.id,
                "type": r.type,
                "title": r.title,
                "author": r.author,
                "url": r.url,
                "published_at": r.published_at,
                "fetched_at": r.fetched_at,
                "models": r.models,
                "test_conditions": r.test_conditions,
                "conclusion": r.conclusion,
                "sponsorship": r.sponsorship,
                "note": r.note,
            }
            for r in rows
        ]
    )

@router.post("/api/deal/products/{product_id}/evidence")
def add_evidence(product_id: int, payload: dict = Body(...), db: Session = Depends(get_db), user_id: int = Depends(_requester)):
    p = db.get(Product, product_id)
    if not p or p.user_id != user_id:
        fail("无权为该商品添加证据", "FORBIDDEN", 403)
    etype = str(payload.get("type") or "official")
    if etype not in ("official", "media", "campus", "vendor", "ai_summary"):
        fail("证据类型不合法")
    row = EvidenceSource(
        product_id=product_id,
        type=etype,
        title=str(payload.get("title") or "").strip(),
        author=str(payload.get("author") or ""),
        url=str(payload.get("url") or ""),
        published_at=str(payload.get("published_at") or ""),
        models=str(payload.get("models") or ""),
        test_conditions=str(payload.get("test_conditions") or ""),
        conclusion=str(payload.get("conclusion") or ""),
        sponsorship=str(payload.get("sponsorship") or ""),
        note=str(payload.get("note") or ""),
    )
    if not row.title:
        fail("请填写来源标题")
    db.add(row)
    db.commit()
    db.refresh(row)
    return ok({"id": row.id}, "证据已记录")

@router.post("/api/deal/plans")
def create_plan(payload: dict = Body(...), db: Session = Depends(get_db), user_id: int = Depends(_requester)):
    product = db.get(Product, int(payload.get("product_id") or 0))
    if not product:
        fail("请先创建或选择商品")
    if product.user_id != user_id:
        fail("无权使用该商品", "FORBIDDEN", 403)
    visibility = str(payload.get("visibility") or "private")
    if visibility not in ("private", "public"):
        fail("可见范围不合法")
    plan = PurchasePlan(
        user_id=user_id,
        product_id=product.id,
        title=str(payload.get("title") or product.name),
        budget_cent=deal_decision.cents(payload.get("budget")),
        price_cent=deal_decision.cents(payload.get("price")) or product.price_cent,
        scene=str(payload.get("scene") or ""),
        reason=str(payload.get("reason") or ""),
        urgency=str(payload.get("urgency") or "normal"),
        frequency=str(payload.get("frequency") or "daily"),
        existing_items=str(payload.get("existing_items") or ""),
        alternative=str(payload.get("alternative") or ""),
        wait_days=max(0, int(payload.get("wait_days") or 7)),
        visibility=visibility,
        group_id=None,
        end_mode=str(payload.get("end_mode") or "target_votes"),
        target_votes=max(1, int(payload.get("target_votes") or 5)),
        deadline=str(payload.get("deadline") or ""),
        discuss_status="discussing" if visibility == "public" else "draft",
        decision_status="undecided",
    )
    if plan.end_mode not in ("target_votes", "deadline"):
        fail("结束方式不合法")
    if plan.end_mode == "target_votes":
        allowed = 999  # 校园公开：全站可见，不做上限
        if plan.target_votes > allowed:
            fail(f"目标投票人数不能超过有投票权限的其他成员数（当前 {allowed}）")
    db.add(plan)
    db.commit()
    db.refresh(plan)
    db.add(
        PlanVersion(
            plan_id=plan.id,
            version=1,
            snapshot=deal_decision.plan_snapshot(plan, product),
            changed_fields="创建计划",
        )
    )
    db.commit()
    return ok(_plan_dict(plan, product), "计划已创建并开启校园讨论" if visibility == "public" else "计划已创建（草稿）")

@router.get("/api/deal/plans")
def list_plans(
    status: str = Query(default=""),
    visibility: str = Query(default=""),
    page: int = Query(default=1),
    page_size: int = Query(default=20),
    db: Session = Depends(get_db),
    user_id: int = Depends(_requester),
):
    page = max(1, page)
    page_size = max(1, min(page_size, 50))
    q = db.query(PurchasePlan).filter(PurchasePlan.user_id == user_id)
    if status:
        q = q.filter(PurchasePlan.decision_status == status)
    if visibility:
        q = q.filter(PurchasePlan.visibility == visibility)
    total = q.count()
    rows = q.order_by(PurchasePlan.id.desc()).offset((page - 1) * page_size).limit(page_size).all()
    products = {p.id: p for p in db.query(Product).filter(Product.id.in_([r.product_id for r in rows] or [0])).all()}
    return ok({"items": [_plan_dict(r, products.get(r.product_id)) for r in rows], "total": total, "page": page, "page_size": page_size})

@router.get("/api/deal/plans/{plan_id}")
def get_plan(plan_id: int, db: Session = Depends(get_db), user_id: int = Depends(_requester)):
    plan = _plan_or_404(db, plan_id)
    _assert_can_read(db, plan, user_id)
    product = db.get(Product, plan.product_id)
    versions = db.query(PlanVersion).filter(PlanVersion.plan_id == plan.id).order_by(PlanVersion.version.desc()).all()
    _, comp = deal_decision.comparable_quotes(db, plan.product_id)
    stats = deal_decision.history_stats(db, plan.product_id, days=30)
    evidence = db.query(EvidenceSource).filter(EvidenceSource.product_id == plan.product_id).all()
    votes = deal_decision.vote_summary(db, plan)
    is_owner = plan.user_id == user_id
    can_vote = (
        plan.discuss_status == "discussing"
        and not is_owner
        and plan.visibility == "public"
    )
    my_vote = db.query(PlanVote).filter(PlanVote.plan_id == plan.id, PlanVote.user_id == user_id).first()
    comments = db.query(PlanComment).filter(PlanComment.plan_id == plan.id).order_by(PlanComment.id.asc()).all()
    alerts = db.query(PriceAlert).filter(PriceAlert.plan_id == plan.id, PriceAlert.user_id == user_id).all()
    record = db.query(PurchaseRecord).filter(PurchaseRecord.plan_id == plan.id).first()
    advice = (
        deal_decision.decision_advice(db, plan, product, comp, stats, len(evidence))
        if is_owner
        else None
    )
    return ok(
        {
            "plan": _plan_dict(plan, product),
            "product": _product_dict(product) if product else None,
            "can_edit": is_owner,
            "can_vote": can_vote,
            "can_comment": plan.discuss_status == "discussing" and not is_owner and plan.visibility == "public",
            "my_vote": my_vote.choice if my_vote else "",
            "votes": votes,
            "comments": [
                {
                    "id": c.id,
                    "user_id": c.user_id,
                    "parent_id": c.parent_id,
                    "content": c.content,
                    "used_it": bool(c.used_it),
                    "evidence_level": c.evidence_level,
                    "helpful": c.helpful,
                    "created_at": c.created_at,
                }
                for c in comments
            ],
            "versions": [
                {"version": v.version, "changed_fields": v.changed_fields, "created_at": v.created_at}
                for v in versions
            ],
            "quotes": {
                "comparable": [deal_decision.quote_dict(r) for r in comp],
                "lowest_note": "最低价为当前已获取、符合比较条件报价中的最低价，不是全网最低。",
            },
            "history": stats,
            "evidence": [
                {"id": e.id, "type": e.type, "title": e.title, "author": e.author, "url": e.url, "published_at": e.published_at, "conclusion": e.conclusion, "sponsorship": e.sponsorship}
                for e in evidence
            ],
            "advice": advice,
            "alerts": [
                {"id": a.id, "rule_type": a.rule_type, "target_price": deal_decision.yuan(a.target_price_cent), "pct": a.pct, "enabled": bool(a.enabled), "cooldown_min": a.cooldown_min}
                for a in alerts
            ],
            "purchase": (
                {
                    "channel": record.channel,
                    "spec": record.spec,
                    "paid": deal_decision.yuan(record.paid_cent),
                    "bought_at": record.bought_at,
                    "experience": record.experience,
                    "regret": record.regret,
                    "recommend": record.recommend,
                }
                if record
                else None
            ),
        }
    )

@router.patch("/api/deal/plans/{plan_id}")
def update_plan(plan_id: int, payload: dict = Body(...), db: Session = Depends(get_db), user_id: int = Depends(_requester)):
    plan = _plan_or_404(db, plan_id)
    if plan.user_id != user_id:
        fail("只能修改自己的计划", "FORBIDDEN", 403)
    if plan.decision_status in ("purchased", "abandoned"):
        fail("计划已定案，不可修改", "LOCKED", 409)
    key_fields = {
        "title": "title",
        "budget": "budget_cent",
        "price": "price_cent",
        "reason": "reason",
        "scene": "scene",
        "urgency": "urgency",
        "frequency": "frequency",
        "existing_items": "existing_items",
        "alternative": "alternative",
        "wait_days": "wait_days",
        "visibility": "visibility",
        "end_mode": "end_mode",
        "target_votes": "target_votes",
        "deadline": "deadline",
    }
    changed = []
    for k, attr in key_fields.items():
        if k not in payload:
            continue
        v = payload[k]
        if attr in ("budget_cent", "price_cent"):
            v = deal_decision.cents(v)
        elif attr in ("wait_days", "target_votes"):
            v = int(v or 0)
        if getattr(plan, attr) != v:
            changed.append(k)
            setattr(plan, attr, v)
    if "visibility" in payload and payload["visibility"] not in ("private", "public"):
        fail("可见范围不合法")
    if "discuss_status" in payload and payload["discuss_status"] in ("draft", "cancelled"):
        plan.discuss_status = payload["discuss_status"]
        changed.append("discuss_status")
    if not changed:
        return ok(_plan_dict(plan), "无变化")
    plan.updated_at = deal_decision.now_str()
    product = db.get(Product, plan.product_id)
    last = db.query(PlanVersion).filter(PlanVersion.plan_id == plan.id).order_by(PlanVersion.version.desc()).first()
    db.add(
        PlanVersion(
            plan_id=plan.id,
            version=(last.version + 1) if last else 1,
            snapshot=deal_decision.plan_snapshot(plan, product),
            changed_fields="、".join(changed),
        )
    )
    price_product = (
        " ".join(x for x in [getattr(product, "brand", ""), getattr(product, "name", "")] if x)
        if product
        else (plan.title or "")
    )
    price_category = str(getattr(product, "category", "") or "")
    price_key = f"{price_product}|{price_category}"
    _AI_PRICE_CACHE.pop(price_key, None)
    db.query(DealPriceCache).filter(DealPriceCache.cache_key == price_key).delete(synchronize_session=False)
    db.commit()
    return ok(_plan_dict(plan, product), "已更新并保留版本记录")

@router.post("/api/deal/plans/{plan_id}/publish")
def publish_plan(plan_id: int, payload: dict = Body(default={}), db: Session = Depends(get_db), user_id: int = Depends(_requester)):
    plan = _plan_or_404(db, plan_id)
    if plan.user_id != user_id:
        fail("只能发布自己的计划", "FORBIDDEN", 403)
    if plan.discuss_status not in ("draft",):
        fail("当前状态不可发布")
    plan.visibility = "public"
    plan.group_id = None
    plan.discuss_status = "discussing"
    plan.updated_at = deal_decision.now_str()
    db.commit()
    return ok(_plan_dict(plan), "已转为校园公开讨论")

@router.post("/api/deal/plans/{plan_id}/vote")
def vote_plan(plan_id: int, payload: dict = Body(...), db: Session = Depends(get_db), user_id: int = Depends(_requester)):
    plan = _plan_or_404(db, plan_id)
    _assert_can_read(db, plan, user_id)
    if plan.user_id == user_id:
        fail("不能给自己的计划投票", "FORBIDDEN", 403)
    if plan.discuss_status != "discussing":
        fail("讨论已结束，禁止投票")
    choice = str(payload.get("choice") or "")
    if choice not in deal_decision.VOTE_CHOICES:
        fail("投票选项不合法")
    row = db.query(PlanVote).filter(PlanVote.plan_id == plan.id, PlanVote.user_id == user_id).first()
    if row:
        row.choice = choice  # 同一用户只保留一份有效投票，允许结束前修改
        row.created_at = deal_decision.now_str()
    else:
        db.add(PlanVote(plan_id=plan.id, user_id=user_id, choice=choice))
    db.commit()
    db.refresh(plan)
    _, settled = deal_decision.maybe_settle(db, plan)
    db.refresh(plan)
    return ok({"votes": deal_decision.vote_summary(db, plan), "discuss_status": plan.discuss_status}, "已记录")

@router.post("/api/deal/plans/{plan_id}/settle")
def settle_plan_api(plan_id: int, payload: dict = Body(default={}), db: Session = Depends(get_db), user_id: int = Depends(_requester)):
    plan = _plan_or_404(db, plan_id)
    if plan.user_id != user_id:
        fail("只能结束自己的计划", "FORBIDDEN", 403)
    reason = "manual" if plan.end_mode == "target_votes" else "deadline_reached"
    result, created = deal_decision.settle_plan(db, plan, reason)
    return ok(
        {
            "settled": True,
            "already_settled": not created,
            "votes": deal_decision.vote_summary(db, plan),
        },
        "已结算" if created else "此前已结算，未重复结算",
    )

@router.post("/api/deal/plans/{plan_id}/comments")
def add_comment(plan_id: int, payload: dict = Body(...), db: Session = Depends(get_db), user_id: int = Depends(_requester)):
    plan = _plan_or_404(db, plan_id)
    _assert_can_read(db, plan, user_id)
    if plan.discuss_status != "discussing":
        fail("讨论已结束，禁止新增评论")
    if plan.visibility == "group" and plan.user_id != user_id and plan.group_id not in _member_group_ids(db, user_id):
        fail("无权评论该群组讨论", "FORBIDDEN", 403)
    content = str(payload.get("content") or "").strip()
    if not content:
        fail("评论不能为空")
    if len(content) > 2000:
        fail("评论过长")
    used_it = 1 if payload.get("used_it") else 0
    row = PlanComment(
        plan_id=plan.id,
        user_id=user_id,
        parent_id=int(payload["parent_id"]) if payload.get("parent_id") else None,
        content=content,
        used_it=used_it,
        evidence_level="self_declared",  # 自述用过，非官方认证
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return ok({"id": row.id}, "评论已发布")

@router.post("/api/deal/comments/{comment_id}/helpful")
def helpful_comment(comment_id: int, db: Session = Depends(get_db), user_id: int = Depends(_requester)):
    row = db.get(PlanComment, comment_id)
    if not row:
        fail("评论不存在", "RESOURCE_NOT_FOUND", 404)
    row.helpful += 1
    db.commit()
    return ok({"helpful": row.helpful})

@router.post("/api/deal/reports")
def report_content(payload: dict = Body(...), db: Session = Depends(get_db), user_id: int = Depends(_requester)):
    target_type = str(payload.get("target_type") or "comment")
    if target_type not in ("plan", "comment"):
        fail("举报对象不合法")
    target_id = int(payload.get("target_id") or 0)
    if not target_id:
        fail("缺少举报对象")
    if target_type == "comment" and not db.get(PlanComment, target_id):
        fail("评论不存在", "RESOURCE_NOT_FOUND", 404)
    if target_type == "plan" and not db.get(PurchasePlan, target_id):
        fail("计划不存在", "RESOURCE_NOT_FOUND", 404)
    db.add(DealReport(user_id=user_id, target_type=target_type, target_id=target_id, reason=str(payload.get("reason") or "")))
    db.commit()
    return ok(None, "已提交举报，等待管理员复核")

@router.post("/api/deal/plans/{plan_id}/cooling")
def set_cooling(plan_id: int, payload: dict = Body(...), db: Session = Depends(get_db), user_id: int = Depends(_requester)):
    plan = _plan_or_404(db, plan_id)
    if plan.user_id != user_id:
        fail("只能设置自己的计划", "FORBIDDEN", 403)
    hours = int(payload.get("hours") or 0)
    if hours <= 0 or hours > 24 * 30:
        fail("冷静期需在 1 小时到 30 天之间")
    plan.decision_status = "cooling"
    plan.cool_until = (datetime.now() + timedelta(hours=hours)).strftime("%Y-%m-%d %H:%M:%S")
    plan.updated_at = deal_decision.now_str()
    db.commit()
    return ok(_plan_dict(plan), f"已进入冷静期，{hours} 小时后到期")

@router.post("/api/deal/plans/{plan_id}/decide")
def decide_plan(plan_id: int, payload: dict = Body(...), db: Session = Depends(get_db), user_id: int = Depends(_requester)):
    plan = _plan_or_404(db, plan_id)
    if plan.user_id != user_id:
        fail("只能决定自己的计划", "FORBIDDEN", 403)
    decision = str(payload.get("decision") or "")
    if decision not in ("purchased", "deferred", "abandoned"):
        fail("决定类型不合法")
    plan.decision_status = decision
    plan.decide_reason = str(payload.get("reason") or "")
    plan.updated_at = deal_decision.now_str()
    db.commit()
    return ok(_plan_dict(plan), "已记录最终决定")

@router.post("/api/deal/plans/{plan_id}/alerts")
def create_alert(plan_id: int, payload: dict = Body(...), db: Session = Depends(get_db), user_id: int = Depends(_requester)):
    plan = _plan_or_404(db, plan_id)
    if plan.user_id != user_id:
        fail("只能为自己的计划设置提醒", "FORBIDDEN", 403)
    rule = str(payload.get("rule_type") or "target_price")
    if rule not in ("target_price", "pct_drop", "new_low"):
        fail("提醒规则不合法")
    row = PriceAlert(
        user_id=user_id,
        plan_id=plan.id,
        quote_id=int(payload["quote_id"]) if payload.get("quote_id") else None,
        rule_type=rule,
        target_price_cent=deal_decision.cents(payload.get("target_price")),
        pct=max(1, min(90, int(payload.get("pct") or 5))),
        reference_price_cent=deal_decision.cents(payload.get("reference_price")),
        cooldown_min=max(60, int(payload.get("cooldown_min") or 1440)),
    )
    if rule == "target_price" and row.target_price_cent <= 0:
        fail("请填写目标价格")
    if rule == "pct_drop" and row.reference_price_cent <= 0:
        fail("请填写参考价格")
    db.add(row)
    db.commit()
    db.refresh(row)
    return ok({"id": row.id}, "提醒已创建")

@router.post("/api/deal/plans/{plan_id}/alerts/check")
def check_alert_api(plan_id: int, db: Session = Depends(get_db), user_id: int = Depends(_requester)):
    plan = _plan_or_404(db, plan_id)
    if plan.user_id != user_id:
        fail("只能检查自己的提醒", "FORBIDDEN", 403)
    fired = deal_decision.check_alerts(db, plan.id)
    if fired:
        db.add(
            Message(
                user_id=user_id,
                category="省钱",
                title="价格提醒：已到你的目标价",
                content="；".join([f"当前最低到手价 ¥{f['price']}（规则 {f['rule']}）" for f in fired]),
                action_text="去查看",
                action_url=f"#/life/deal/plan?id={plan.id}",
                is_read=0,
                created_at=deal_decision.now_str(),
            )
        )
        db.commit()
    return ok({"fired": fired}, "已检查提醒" if fired else "未达到提醒条件")

@router.post("/api/deal/plans/{plan_id}/purchase")
def record_purchase(plan_id: int, payload: dict = Body(...), db: Session = Depends(get_db), user_id: int = Depends(_requester)):
    plan = _plan_or_404(db, plan_id)
    if plan.user_id != user_id:
        fail("只能记录自己的购买", "FORBIDDEN", 403)
    if plan.decision_status not in ("purchased", "undecided", "cooling", "deferred", "abandoned"):
        fail("当前状态不需要记录购买")
    if db.query(PurchaseRecord).filter(PurchaseRecord.plan_id == plan.id).first():
        fail("该计划已记录过购买信息")
    record = PurchaseRecord(
        plan_id=plan.id,
        user_id=user_id,
        channel=str(payload.get("channel") or ""),
        spec=str(payload.get("spec") or ""),
        paid_cent=deal_decision.cents(payload.get("paid")),
        bought_at=str(payload.get("bought_at") or ""),
        receipt=str(payload.get("receipt") or ""),
        experience=str(payload.get("experience") or ""),
        regret=str(payload.get("regret") or ""),
        recommend=str(payload.get("recommend") or ""),
        private=1,
    )
    plan.decision_status = "purchased"
    plan.updated_at = deal_decision.now_str()
    db.add(record)
    db.commit()
    return ok({"id": record.id}, "购买记录已保存（订单凭证仅本人可见）")

@router.post("/api/deal/groups")
def create_group(payload: dict = Body(...), db: Session = Depends(get_db), user_id: int = Depends(_requester)):
    name = str(payload.get("name") or "").strip()
    if not name:
        fail("请填写群组名称")
    g = PlanGroup(owner_id=user_id, name=name, visibility=str(payload.get("visibility") or "private"))
    db.add(g)
    db.commit()
    db.refresh(g)
    db.add(GroupMember(group_id=g.id, user_id=user_id, role="owner", status="active"))
    db.commit()
    return ok({"id": g.id, "name": g.name}, "群组已创建")

@router.get("/api/deal/groups")
def list_groups(db: Session = Depends(get_db), user_id: int = Depends(_requester)):
    ids = _member_group_ids(db, user_id)
    rows = db.query(PlanGroup).filter(PlanGroup.id.in_(ids or {0})).all()
    return ok(
        [
            {
                "id": g.id,
                "name": g.name,
                "visibility": g.visibility,
                "member_count": db.query(GroupMember).filter(GroupMember.group_id == g.id, GroupMember.status == "active").count(),
                "is_owner": g.owner_id == user_id,
            }
            for g in rows
        ]
    )

@router.post("/api/deal/groups/{group_id}/members")
def add_member(group_id: int, payload: dict = Body(...), db: Session = Depends(get_db), user_id: int = Depends(_requester)):
    g = db.get(PlanGroup, group_id)
    if not g:
        fail("群组不存在", "RESOURCE_NOT_FOUND", 404)
    if g.owner_id != user_id:
        fail("只有群主可以添加成员", "FORBIDDEN", 403)
    target = int(payload.get("user_id") or 0)
    if not target:
        fail("请提供成员 ID")
    exists = db.query(GroupMember).filter(GroupMember.group_id == group_id, GroupMember.user_id == target).first()
    if exists:
        return ok(None, "该成员已在群组中")
    db.add(GroupMember(group_id=group_id, user_id=target, role="member", status="active"))
    db.commit()
    return ok(None, "成员已加入")

@router.get("/api/deal/discussions")
def list_discussions(page: int = Query(default=1), page_size: int = Query(default=20), db: Session = Depends(get_db), user_id: int = Depends(_requester)):
    page = max(1, page)
    page_size = max(1, min(page_size, 50))
    tokens = _member_group_ids(db, user_id)
    q = db.query(PurchasePlan).filter(
        PurchasePlan.discuss_status == "discussing",
        __import__("sqlalchemy").or_(
            PurchasePlan.visibility == "public",
            __import__("sqlalchemy").and_(PurchasePlan.visibility == "group", PurchasePlan.group_id.in_(tokens or {0})),
        ),
    )
    total = q.count()
    rows = q.order_by(PurchasePlan.updated_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    products = {p.id: p for p in db.query(Product).filter(Product.id.in_([r.product_id for r in rows] or [0])).all()}
    return ok({"items": [_plan_dict(r, products.get(r.product_id)) for r in rows], "total": total, "page": page, "page_size": page_size})

@router.get("/api/deal/summary")
def deal_summary(db: Session = Depends(get_db), user_id: int = Depends(_requester)):
    data = deal_decision.money_summary(db, user_id)
    plans = db.query(PurchasePlan).filter(PurchasePlan.user_id == user_id).all()
    data["plan_count"] = len(plans)
    data["cooling_count"] = len([p for p in plans if p.decision_status == "cooling"])
    data["price_alert_count"] = db.query(PriceAlert).filter(PriceAlert.user_id == user_id, PriceAlert.enabled == 1).count()
    return ok(data)

@router.get("/api/deal/records")
def deal_records(page: int = Query(default=1), page_size: int = Query(default=20), db: Session = Depends(get_db), user_id: int = Depends(_requester)):
    page = max(1, page)
    page_size = max(1, min(page_size, 50))
    q = db.query(PurchaseRecord).filter(PurchaseRecord.user_id == user_id)
    total = q.count()
    rows = q.order_by(PurchaseRecord.id.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return ok(
        {
            "items": [
                {
                    "id": r.id,
                    "plan_id": r.plan_id,
                    "channel": r.channel,
                    "spec": r.spec,
                    "paid": deal_decision.yuan(r.paid_cent),
                    "bought_at": r.bought_at,
                    "experience": r.experience,
                    "regret": r.regret,
                    "recommend": r.recommend,
                    "receipt_saved": bool(r.receipt),
                }
                for r in rows
            ],
            "total": total,
            "page": page,
            "page_size": page_size,
            "note": "订单截图与凭证默认私密，仅本人可见。",
        }
    )

@router.get("/api/deal/overview")
def deal_overview(db: Session = Depends(get_db), user_id: int = Depends(_requester)):
    """省一省首页聚合：金额口径 + 待决策计划 + 讨论 + 提醒 + 近期价格变化（真实快照）。"""
    data = deal_decision.money_summary(db, user_id)
    plans = db.query(PurchasePlan).filter(PurchasePlan.user_id == user_id).order_by(PurchasePlan.id.desc()).limit(10).all()
    products = {p.id: p for p in db.query(Product).filter(Product.id.in_([r.product_id for r in plans] or [0])).all()}
    tokens = _member_group_ids(db, user_id)
    discussions = (
        db.query(PurchasePlan)
        .filter(
            PurchasePlan.discuss_status == "discussing",
            __import__("sqlalchemy").or_(
                PurchasePlan.visibility == "public",
                __import__("sqlalchemy").and_(PurchasePlan.visibility == "group", PurchasePlan.group_id.in_(tokens or {0})),
            ),
        )
        .order_by(PurchasePlan.updated_at.desc())
        .limit(6)
        .all()
    )
    d_products = {p.id: p for p in db.query(Product).filter(Product.id.in_([r.product_id for r in discussions] or [0])).all()}
    alerts = db.query(PriceAlert).filter(PriceAlert.user_id == user_id, PriceAlert.enabled == 1).order_by(PriceAlert.id.desc()).limit(6).all()
    snaps = db.query(PriceSnapshot).filter(PriceSnapshot.product_id.in_([p.product_id for p in plans] or [0])).order_by(PriceSnapshot.id.desc()).limit(120).all()
    recent = [
        {"product_id": s.product_id, "price": deal_decision.yuan(s.price_cent), "fetched_at": s.fetched_at, "source_key": s.source_key}
        for s in snaps
    ]
    return ok(
        {
            "money": data,
            "plans": [_plan_dict(r, products.get(r.product_id)) for r in plans],
            "discussions": [_plan_dict(r, d_products.get(r.product_id)) for r in discussions],
            "alerts": [
                {"id": a.id, "plan_id": a.plan_id, "rule_type": a.rule_type, "target_price": deal_decision.yuan(a.target_price_cent), "pct": a.pct}
                for a in alerts
            ],
            "recent_snapshots": recent[:30],
            "sources": deal_decision.source_status(),
        }
    )

