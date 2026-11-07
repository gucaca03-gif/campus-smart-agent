# -*- coding: utf-8 -*-
"""省一省决策助手 · 端到端链路验证（真实 HTTP，非 mock）。

示例：学生想买一副预算 600 元的降噪耳机，已有一副可用耳机，
主要用于图书馆与通勤；比较同款价格、历史变化、证据、同学意见，
设置冷静期并记录最终决定。
"""
import json
import urllib.request

BASE = "http://127.0.0.1:5600"


def call(method, path, body=None, user=1):
    data = json.dumps(body or {}, ensure_ascii=False).encode("utf-8") if method != "GET" else None
    req = urllib.request.Request(BASE + path, data=data, method=method)
    req.add_header("Content-Type", "application/json")
    req.add_header("X-User-Id", str(user))
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            return r.status, json.loads(r.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode("utf-8") or "{}")


def expect(label, cond, extra=""):
    print(("PASS " if cond else "FAIL ") + label + (f"  [{extra}]" if extra else ""))


# 1. 商品（示例：预算 600 元的降噪耳机）
st, r = call("POST", "/api/deal/products", {
    "name": "漫步者 W820NB 双金标降噪耳机", "brand": "漫步者", "category": "耳机",
    "model": "W820NB", "sku": "W820NB-BK", "qty": 1, "condition": "new",
    "platform": "京东", "merchant": "京东自营", "price": 399,
    "specs": {"type": "头戴式", "anc": "主动降噪", "connect": "蓝牙5.3"},
})
expect("创建商品（手动录入）", st == 200 and r["ok"], r.get("message", ""))
pid = r["data"]["id"]

# 2. 三条报价：可比 / 条件价 / 成本不完整
st1, q1 = call("POST", f"/api/deal/products/{pid}/quotes", {
    "platform": "京东", "merchant": "京东自营", "price": 399, "shipping": 0, "qty": 1,
    "stock": "in_stock", "url": "https://item.jd.com/1000.html",
})
st2, q2 = call("POST", f"/api/deal/products/{pid}/quotes", {
    "platform": "淘宝", "merchant": "漫步者官方旗舰店", "price": 379, "coupon": 20,
    "shipping": 8, "conditions": "需学生认证", "stock": "in_stock",
})
st3, q3 = call("POST", f"/api/deal/products/{pid}/quotes", {
    "platform": "拼多多", "merchant": "百亿补贴", "price": 359,
    "cost_complete": False, "stock": "unknown", "note": "运费与资格未知",
})
expect("录入 3 条报价", all(x[0] == 200 for x in [(st1, q1), (st2, q2), (st3, q3)]))

st, r = call("GET", f"/api/deal/products/{pid}/quotes")
comp = r["data"]["comparable"]
cond = r["data"]["conditional"]
expect("可比报价只含无资格限制且成本完整者", len(comp) == 1 and comp[0]["platform"] == "京东",
       f"可比={len(comp)} 条件/不完整={len(cond)}")
expect("条件价被单独标注", any(c["conditional"] for c in r["data"]["all"]))
expect("成本不完整被单独标注", any(not c["cost_complete"] for c in r["data"]["all"]))

# 3. 历史价格（真实快照，刚记录 3 条）
st, h = call("GET", f"/api/deal/products/{pid}/history?days=30")
expect("历史快照来自本系统记录", h["data"]["has_history"] and h["data"]["sample_count"] >= 3,
       f"样本={h['data']['sample_count']}")
expect("同一天采样不输出趋势结论", h["data"]["trend_reliable"] is False, f"distinct_days={h['data']['distinct_days']}")

# 4. 证据（区分类型）
st, e = call("POST", f"/api/deal/products/{pid}/evidence", {
    "type": "campus", "title": "图书馆使用体验：降噪有效但夹耳", "author": "2023级 张同学",
    "conclusion": "图书馆环境下降噪明显，长时间佩戴略有夹耳", "sponsorship": "",
})
expect("记录校园用户经验证据", st == 200)
st, el = call("GET", f"/api/deal/products/{pid}/evidence")
expect("证据保留类型与来源", el["data"][0]["type"] == "campus" and el["data"][0]["author"])

# 5. 购买计划（预算 600，公开讨论，满 3 票结束）
st, r = call("POST", "/api/deal/plans", {
    "product_id": pid, "title": "通勤降噪耳机", "budget": 600, "price": 399,
    "scene": "图书馆自习 + 通勤地铁", "reason": "现有有线耳机通勤不便",
    "urgency": "soon", "frequency": "daily", "existing_items": "已有一副有线耳机",
    "alternative": "先借用室友的蓝牙耳机", "wait_days": 14,
    "visibility": "public", "end_mode": "target_votes", "target_votes": 3,
})
expect("创建购买计划", st == 200 and r["ok"], r.get("message", ""))
plan = r["data"]["id"]

# 6. 私密计划权限（他人不可读）
st, priv = call("POST", "/api/deal/plans", {
    "product_id": pid, "title": "私密测试计划", "budget": 500, "price": 399,
    "visibility": "private",
})
expect("创建私密计划", st == 200)
st2, _ = call("GET", f"/api/deal/plans/{priv['data']['id']}", user=2)
expect("他人访问私密计划被拒绝(403)", st2 == 403, f"http={st2}")

# 7. 版本记录：修改关键字段
st, r = call("PATCH", f"/api/deal/plans/{plan}", {"price": 379, "reason": "发现淘宝更低"})
expect("修改关键字段成功", st == 200)
st, d = call("GET", f"/api/deal/plans/{plan}")
expect("保留版本记录", len(d["data"]["versions"]) >= 2, f"版本数={len(d['data']['versions'])}")

# 8. 发布 → 发起人不能投票 → 他人投票 → 满 3 票自动结算
st, _ = call("POST", f"/api/deal/plans/{plan}/publish")
expect("发布讨论", st == 200)
st, r = call("POST", f"/api/deal/plans/{plan}/vote", {"choice": "buy"}, user=1)
expect("发起人不能给自己投票(403)", st == 403, f"http={st}")
call("POST", f"/api/deal/plans/{plan}/vote", {"choice": "buy"}, user=2)
st, r = call("POST", f"/api/deal/plans/{plan}/vote", {"choice": "wait"}, user=2)
expect("同一用户改票只保留一份", st == 200 and r["data"]["votes"]["counts"]["buy"] == 0 and r["data"]["votes"]["counts"]["wait"] == 1)
call("POST", f"/api/deal/plans/{plan}/vote", {"choice": "suggest"}, user=3)
st, r = call("POST", f"/api/deal/plans/{plan}/vote", {"choice": "buy"}, user=4)
expect("满目标票数自动结算", st == 200 and r["data"]["discuss_status"] == "ended", f"状态={r['data']['discuss_status']}")
st, r = call("POST", f"/api/deal/plans/{plan}/settle")
expect("重复结算不重复计数", st == 200 and r["data"]["already_settled"] is True)
st, _ = call("POST", f"/api/deal/plans/{plan}/vote", {"choice": "against"}, user=5)
expect("结束后禁止投票", st == 400 or st == 409, f"http={st}")

# 9. 评论/自述经验
st, _ = call("POST", f"/api/deal/plans/{plan}/comments", {"content": "我在图书馆用过，降噪确实够用", "used_it": True}, user=3)
expect("讨论已结束禁止新增评论", st == 400 or st == 409, f"http={st}")

# 10. 冷期 + 决定 + 统计口径
st, r = call("POST", f"/api/deal/plans/{plan}/cooling", {"hours": 24})
expect("进入冷静期", st == 200 and r["data"]["decision_status"] == "cooling")
st, r = call("POST", f"/api/deal/plans/{plan}/decide", {"decision": "deferred", "reason": "再等等，现有耳机还能用"})
expect("记录暂缓决定", st == 200 and r["data"]["decision_status"] == "deferred")
st, s = call("GET", "/api/deal/summary")
m = s["data"]
expect("暂缓金额单独统计、不计入已实现节省", m["deferred_total"] >= 379 and m["price_diff_total"] == 0,
       f"deferred={m['deferred_total']} diff={m['price_diff_total']}")

# 11. 购后记录
st, r = call("POST", f"/api/deal/plans/{plan}/purchase", {
    "channel": "京东自营", "paid": 399, "bought_at": "2026-11-04",
    "spec": "黑色/国行", "experience": "通勤降噪够用", "regret": "no", "recommend": "yes",
})
expect("记录购后信息", st == 200, r.get("message", ""))
st, s = call("GET", "/api/deal/summary")
expect("实际支出与价格差额口径正确", s["data"]["spent_total"] >= 399 and s["data"]["price_diff_total"] >= 0, f"spent={s['data']['spent_total']}")

# 12. 价格提醒（目标价 400 → 触发一次，第二次不重复）
st, a = call("POST", f"/api/deal/plans/{plan}/alerts", {"rule_type": "target_price", "target_price": 400})
expect("创建价格提醒", st == 200)
st, c1 = call("POST", f"/api/deal/plans/{plan}/alerts/check")
st, c2 = call("POST", f"/api/deal/plans/{plan}/alerts/check")
expect("提醒触发一次且不重复", len(c1["data"]["fired"]) == 1 and len(c2["data"]["fired"]) == 0,
       f"first={len(c1['data']['fired'])} second={len(c2['data']['fired'])}")

# 13. 无历史商品不生成曲线
st, p2 = call("POST", "/api/deal/products", {"name": "无历史测试商品", "price": 10})
st, h2 = call("GET", f"/api/deal/products/{p2['data']['id']}/history")
expect("无历史时不生成曲线", h2["data"]["has_history"] is False and h2["data"]["points"] == [])

# 14. SSRF 防护
st, r = call("POST", "/api/deal/parse-link", {"url": "http://127.0.0.1:5600/admin"})
expect("拒绝本机地址", r["data"]["recognized"] is False)
st, r = call("POST", "/api/deal/parse-link", {"url": "http://169.254.169.254/latest/meta-data"})
expect("拒绝云元数据地址", r["data"]["recognized"] is False)
st, r = call("POST", "/api/deal/parse-link", {"url": "https://item.jd.com/1000.html"})
expect("白名单域名识别通过", r["data"]["recognized"] is True)

print("\n完成。")