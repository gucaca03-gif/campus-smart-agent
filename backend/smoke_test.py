"""苏小师只读冒烟测试：服务启动后运行，不写入预约数据。"""
import json
import sys
import urllib.parse
import urllib.request

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:5600"


def call(method: str, path: str, body=None):
    data = json.dumps(body, ensure_ascii=False).encode("utf-8") if body is not None else None
    url = BASE + urllib.parse.quote(path, safe="/:?=&")
    req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"}, method=method)
    with urllib.request.urlopen(req, timeout=15) as res:
        return res.status, json.loads(res.read().decode("utf-8"))


def check(name: str, condition: bool, detail: str = ""):
    print(("PASS " if condition else "FAIL ") + name + (f"  {detail}" if detail else ""))
    if not condition:
        raise SystemExit(1)


status, health = call("GET", "/api/health")
check("health", status == 200 and health["data"]["status"] == "up")

status, home = call("GET", "/api/home")
data = home["data"]
check("home.metrics", len(data["metrics"]) >= 10, f"{len(data['metrics'])} metrics")
check("home.area_pending", any(m["key"] == "area" and m["status"] == "pending" for m in data["metrics"]))
check("home.calendar", len(data["calendar"]) >= 5, f"{len(data['calendar'])} events")

status, term2 = call("GET", "/api/school/calendar?term=2026-2027-2")
check("calendar.term2", len(term2["data"]) >= 5, f"{len(term2['data'])} events")

status, places = call("GET", "/api/places/search?q=图书馆")
check("places.alias", len(places["data"]) >= 1)

status, route = call("POST", "/api/nav/route", {"origin_id": 20, "destination_id": places["data"][0]["id"]})
check("route.steps", status == 200 and len(route["data"]["steps"]) == 3)

status, ai_nav = call("POST", "/api/assistant/chat", {"message": "去图书馆怎么走"})
check("ai.nav", "路线" in ai_nav["data"]["reply"] and ai_nav["data"]["cards"][0]["kind"] == "route")

status, ai_book = call("POST", "/api/assistant/chat", {"message": "明天下午帮我约一个 4 人的研讨教室"})
check("ai.booking.candidates", len(ai_book["data"]["cards"]) >= 1)
check("ai.booking.draft", ai_book["data"]["draft"]["type"] == "classroom")

status, savings = call("GET", "/api/savings/summary")
check("savings.scope", savings["data"]["saved"] >= 0 and "仅统计" in savings["data"]["note"])

status, admin = call("GET", "/api/admin/summary")
check("admin.summary", status == 200 and admin["data"]["news"] >= 10)

print("\nALL PASS")