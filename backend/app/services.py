import json
import math
import os
import re
import urllib.parse
import urllib.request
from datetime import date, datetime, timedelta

from sqlalchemy.orm import Session

from .models import (
    Booking,
    CalendarEvent,
    Campus,
    Place,
    Resource,
    SchoolMetric,
    Slot,
)

WEEKDAY_CN = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"]


def parse_date(value: str | None) -> date:
    if not value:
        return date.today()
    try:
        return datetime.strptime(value, "%Y-%m-%d").date()
    except ValueError:
        return date.today()


def slot_times(resource: Resource, day: date | None = None) -> list[tuple[str, str]]:
    if resource.type == "seat":
        return [
            ("08:00", "10:00"),
            ("10:00", "12:00"),
            ("12:00", "14:00"),
            ("14:00", "16:00"),
            ("16:00", "18:00"),
            ("18:00", "20:00"),
            ("20:00", "22:00"),
        ]
    if resource.type == "classroom":
        if day is not None and day.isoweekday() > 5:
            return [
                ("08:00", "09:40"),
                ("10:10", "11:50"),
                ("14:00", "15:40"),
                ("16:00", "17:40"),
                ("18:30", "20:40"),
            ]
        return [("18:30", "20:40")]
    return [("08:00", "10:00"), ("10:00", "12:00"), ("14:00", "16:00"), ("16:00", "17:10")]


def ensure_slots(db: Session, resource: Resource, day: date) -> list[Slot]:
    existing = (
        db.query(Slot)
        .filter(Slot.resource_id == resource.id, Slot.date == day.isoformat())
        .order_by(Slot.start_at)
        .all()
    )
    if existing:
        return existing

    weekday = day.isoweekday()
    open_days = {int(x) for x in resource.open_days.split(",") if x.strip().isdigit()}
    slots: list[Slot] = []
    for start, end in slot_times(resource, day):
        status = "open"
        if weekday not in open_days:
            status = "closed"
        elif resource.type == "classroom" and weekday <= 5:
            # 演示排课占用：不同教室在不同时段有课，真实数据需教务处导出
            if (resource.id + int(start[:2])) % 4 == 0:
                status = "occupied"
        slot = Slot(
            resource_id=resource.id,
            date=day.isoformat(),
            start_at=start,
            end_at=end,
            capacity=resource.capacity,
            booked=0,
            status=status,
        )
        db.add(slot)
        slots.append(slot)
    db.commit()
    for slot in slots:
        db.refresh(slot)
    return slots


def booking_to_dict(db: Session, booking: Booking) -> dict:
    resource = db.query(Resource).get(booking.resource_id) if hasattr(db, "get") else db.get(Resource, booking.resource_id)
    return {
        "id": booking.id,
        "type": booking.type,
        "resource_id": booking.resource_id,
        "resource_name": resource.name if resource else "资源已下架",
        "room": resource.room if resource else "",
        "date": booking.date,
        "start_at": booking.start_at,
        "end_at": booking.end_at,
        "purpose": booking.purpose,
        "people": booking.people,
        "status": booking.status,
        "code": booking.code,
        "created_at": booking.created_at,
        "checked_at": booking.checked_at,
        "cancelled_at": booking.cancelled_at,
    }


def validate_booking(db: Session, resource: Resource, day: date, start: str, end: str, people: int, user_college: str) -> tuple[bool, str, Slot | None]:
    if resource.status != "open":
        return False, "该资源当前不开放", None
    today = date.today()
    if day < today:
        return False, "不能预约过去的日期", None
    if day > today + timedelta(days=resource.advance_days):
        return False, f"最多可提前 {resource.advance_days} 天预约", None
    weekday = day.isoweekday()
    open_days = {int(x) for x in resource.open_days.split(",") if x.strip().isdigit()}
    if weekday not in open_days:
        return False, "该资源在所选日期不开放（非开放日）", None
    if resource.type == "lab" and weekday > 5:
        return False, "实验室仅工作日开放", None
    slots = ensure_slots(db, resource, day)
    slot = next((s for s in slots if s.start_at == start and s.end_at == end), None)
    if not slot:
        return False, "所选时段不在开放时段内", None
    if slot.status == "occupied":
        return False, "该时段已被排课或临时占用", None
    if slot.status == "closed":
        return False, "该时段不开放", None
    if slot.booked + people > slot.capacity:
        return False, "该时段剩余容量不足", None
    if resource.type == "lab" and resource.audience != "全校" and user_college not in resource.audience:
        return False, f"该实验室仅面向：{resource.audience}", None
    exists = (
        db.query(Booking)
        .filter(
            Booking.resource_id == resource.id,
            Booking.date == day.isoformat(),
            Booking.start_at == start,
            Booking.end_at == end,
            Booking.status.in_(["pending_approval", "confirmed", "checked_in"]),
        )
        .first()
    )
    if exists:
        return False, "该时段已被预约", None
    return True, "", slot


def create_booking(db: Session, payload: dict, user_id: int = 1, college: str = "人工智能与计算机学院") -> tuple[dict | None, str]:
    resource = db.get(Resource, payload.get("resource_id"))
    if not resource:
        return None, "资源不存在"
    day = parse_date(payload.get("date"))
    start = payload.get("start_at", "")
    end = payload.get("end_at", "")
    people = max(1, int(payload.get("people") or 1))
    ok, reason, slot = validate_booking(db, resource, day, start, end, people, college)
    if not ok or slot is None:
        return None, reason

    status = "pending_approval" if resource.approval_required else "confirmed"
    booking = Booking(
        user_id=user_id,
        resource_id=resource.id,
        date=day.isoformat(),
        start_at=start,
        end_at=end,
        purpose=payload.get("purpose") or "个人使用",
        people=people,
        status=status,
        type=resource.type,
        idempotency_key=payload.get("idempotency_key") or "",
    )
    db.add(booking)
    slot.booked += people
    db.commit()
    db.refresh(booking)
    booking.code = f"AIS{day.strftime('%Y%m%d')}{booking.id:04d}"
    db.commit()
    db.refresh(booking)
    return booking_to_dict(db, booking), ""


def cancel_booking(db: Session, booking_id: int) -> tuple[bool, str]:
    booking = db.get(Booking, booking_id)
    if not booking:
        return False, "预约不存在"
    if booking.status in ("cancelled", "rejected", "no_show", "completed"):
        return False, "当前状态不可取消"
    resource = db.get(Resource, booking.resource_id)
    slot = (
        db.query(Slot)
        .filter(
            Slot.resource_id == booking.resource_id,
            Slot.date == booking.date,
            Slot.start_at == booking.start_at,
            Slot.end_at == booking.end_at,
        )
        .first()
    )
    if slot:
        slot.booked = max(0, slot.booked - booking.people)
    booking.status = "cancelled"
    booking.cancelled_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    db.commit()
    return True, "已取消预约"


def checkin_booking(db: Session, booking_id: int) -> tuple[bool, str]:
    booking = db.get(Booking, booking_id)
    if not booking:
        return False, "预约不存在"
    if booking.status != "confirmed":
        return False, "仅已确认的预约可签到"
    booking.status = "checked_in"
    booking.checked_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    db.commit()
    return True, "签到成功"


def decide_booking(db: Session, booking_id: int, approve: bool, comment: str = "") -> tuple[bool, str]:
    booking = db.get(Booking, booking_id)
    if not booking:
        return False, "预约不存在"
    if booking.status != "pending_approval":
        return False, "该预约不在待审批状态"
    if approve:
        booking.status = "confirmed"
        db.commit()
        return True, "已通过审批"
    booking.status = "rejected"
    slot = (
        db.query(Slot)
        .filter(
            Slot.resource_id == booking.resource_id,
            Slot.date == booking.date,
            Slot.start_at == booking.start_at,
            Slot.end_at == booking.end_at,
        )
        .first()
    )
    if slot:
        slot.booked = max(0, slot.booked - booking.people)
    db.commit()
    return True, "已拒绝审批"


def haversine(a, b) -> float:
    alat = a.get("lat") if isinstance(a, dict) else a.lat
    alng = a.get("lng") if isinstance(a, dict) else a.lng
    blat = b.get("lat") if isinstance(b, dict) else b.lat
    blng = b.get("lng") if isinstance(b, dict) else b.lng
    radius = 6371000
    phi1, phi2 = math.radians(alat), math.radians(blat)
    dphi = math.radians(blat - alat)
    dlambda = math.radians(blng - alng)
    x = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return 2 * radius * math.asin(math.sqrt(x))


def _bearing_text(olat: float, olng: float, dlat: float, dlng: float) -> str:
    delta_lat = dlat - olat
    delta_lng = dlng - olng
    if abs(delta_lat) < 1e-6 and abs(delta_lng) < 1e-6:
        return "原地"
    ew = ""
    if delta_lng > 0:
        ew = "东"
    elif delta_lng < 0:
        ew = "西"
    ns = ""
    if delta_lat > 0:
        ns = "北"
    elif delta_lat < 0:
        ns = "南"
    return f"{ew}{ns}方向"


def _amap_walking(origin_lng: float, origin_lat: float, dest_lng: float, dest_lat: float) -> dict | None:
    """调用高德步行路径规划（需 AMAP_KEY）。失败返回 None。"""
    key = os.getenv("AMAP_KEY", "")
    if not key:
        return None
    url = (
        "https://restapi.amap.com/v3/direction/walking"
        f"?origin={origin_lng:.6f},{origin_lat:.6f}"
        f"&destination={dest_lng:.6f},{dest_lat:.6f}"
        f"&key={key}"
    )
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "aishida/1.0"})
        with urllib.request.urlopen(req, timeout=6) as res:
            data = json.loads(res.read().decode("utf-8"))
        if data.get("status") != "1" or not data.get("route", {}).get("paths"):
            return None
        path = data["route"]["paths"][0]
        points = []
        steps = []
        for step in path.get("steps", []):
            steps.append(step.get("instruction", ""))
            for seg in step.get("polyline", "").split(";"):
                if not seg:
                    continue
                lng_s, lat_s = seg.split(",")
                points.append({"lat": float(lat_s), "lng": float(lng_s)})
        if not points:
            return None
        return {
            "distance_m": int(path.get("distance", 0)),
            "minutes": max(1, round(int(path.get("duration", 0)) / 60)),
            "steps": steps,
            "polyline": points,
        }
    except Exception:
        return None


def build_route(db: Session, origin_id: int | None, destination_id: int, origin_lat: float | None = None, origin_lng: float | None = None) -> dict | None:
    dest = db.get(Place, destination_id)
    if not dest:
        return None
    user_origin = origin_lat is not None and origin_lng is not None
    if user_origin:
        origin = {"id": 0, "name": "我的位置", "lat": float(origin_lat), "lng": float(origin_lng)}
    else:
        op = db.get(Place, origin_id) if origin_id else db.query(Place).filter(Place.name == "东门").first()
        if not op:
            op = db.query(Place).first()
        origin = {"id": op.id, "name": op.name, "lat": op.lat, "lng": op.lng}

    distance = haversine(origin, dest)
    bearing = _bearing_text(origin["lat"], origin["lng"], dest.lat, dest.lng)

    amap = _amap_walking(origin["lng"], origin["lat"], dest.lng, dest.lat)
    if amap:
        route_data = amap
        notice = "步行路线来自高德地图。"
    else:
        route_data = {
            "distance_m": round(distance),
            "minutes": max(1, round(distance / 1.2 / 60)),
            "steps": [
                f"从{origin['name']}出发，向{bearing}步行约 {round(distance)} 米",
                f"目的地在{dest.name}（{dest.entrance or '请从主入口进入'}）",
            ],
            "polyline": [
                {"lat": origin["lat"], "lng": origin["lng"]},
                {"lat": dest.lat, "lng": dest.lng},
            ],
        }
        notice = "当前为直线距离示意；配置高德 Key（AMAP_KEY）后显示真实步行路线。"

    amap_url = (
        f"https://uri.amap.com/navigation"
        f"?from={origin['lng']:.6f},{origin['lat']:.6f},{urllib.parse.quote(origin['name'])}"
        f"&to={dest.lng:.6f},{dest.lat:.6f},{urllib.parse.quote(dest.name)}"
        "&mode=walk&coordinate=gaode&callnative=0"
    )
    return {
        "origin": origin,
        "destination": {"id": dest.id, "name": dest.name, "lat": dest.lat, "lng": dest.lng, "entrance": dest.entrance, "verified": dest.verified},
        "distance_m": route_data["distance_m"],
        "minutes": route_data["minutes"],
        "steps": route_data["steps"],
        "polyline": route_data["polyline"],
        "notice": notice,
        "amap_url": amap_url,
    }


def resolve_place(db: Session, query: str, campus: str | None = None) -> list[Place]:
    q = (query or "").strip()
    if not q:
        return []
    rows = db.query(Place).all()
    exact = []
    fuzzy = []
    for place in rows:
        aliases = [x.strip() for x in place.alias.split(",") if x.strip()]
        if q == place.name or q in aliases:
            exact.append(place)
        elif q in place.name or any(q in a for a in aliases):
            fuzzy.append(place)
    return exact + [p for p in fuzzy if p not in exact]


def _date_from_text(text: str) -> date:
    today = date.today()
    if "后天" in text:
        return today + timedelta(days=2)
    if "明天" in text:
        return today + timedelta(days=1)
    if "今天" in text or "今日" in text:
        return today
    for idx, cn in enumerate(WEEKDAY_CN):
        if cn in text or f"周{idx + 1}" in text:
            delta = (idx + 1 - today.isoweekday()) % 7
            return today + timedelta(days=delta if delta else 7)
    match = re.search(r"(\d{1,2})月(\d{1,2})日", text)
    if match:
        try:
            return date(today.year, int(match.group(1)), int(match.group(2)))
        except ValueError:
            pass
    return today + timedelta(days=1)


def _time_from_text(text: str, resource_type: str) -> tuple[str, str]:
    if resource_type == "classroom":
        return "18:30", "20:40"
    hour = None
    match = re.search(r"(\d{1,2})\s*点", text)
    if match:
        hour = int(match.group(1))
    if "下午" in text and hour and hour < 12:
        hour += 12
    if "晚上" in text and hour and hour < 12:
        hour += 12
    if hour is None:
        hour = 14 if "下午" in text else (19 if "晚上" in text else 9)
    if resource_type == "seat":
        start = max(8, min(20, (hour // 2) * 2))
        return f"{start:02d}:00", f"{start + 2:02d}:00"
    if hour < 10:
        return "08:00", "10:00"
    if hour < 12:
        return "10:00", "12:00"
    if hour < 16:
        return "14:00", "16:00"
    return "16:00", "17:10"


def assistant_reply(db: Session, message: str) -> dict:
    text = message or ""
    trace = []
    cards: list[dict] = []

    nav_intent = any(k in text for k in ("怎么走", "导航", "路线", "在哪")) or (
        text.strip().startswith("去") and not any(k in text for k in ("预约", "约一个", "约个", "座位"))
    )
    book_intent = any(k in text for k in ("预约", "约一个", "约个", "实验室", "教室", "座位")) or (
        "图书馆" in text and any(k in text for k in ("预约", "座位", "约"))
    )

    if nav_intent and not book_intent:
        cleaned = re.sub(r"(我要|我想|请问|怎么走|在哪里|在哪|导航到|去)", "", text).strip("，。 ")
        places = resolve_place(db, cleaned)
        trace.append({"tool": "resolve_place", "status": "ok" if places else "no_results", "summary": cleaned})
        if not places:
            return {
                "reply": f"没有找到“{cleaned}”对应的已核验地点。可以换成正式楼名，或先在导航页提交别名纠错。",
                "trace": trace,
                "cards": [],
                "draft": None,
            }
        if len(places) > 1 and places[0].name != cleaned:
            options = [{"id": p.id, "name": p.name, "type": p.type, "verified": p.verified} for p in places[:4]]
            return {
                "reply": f"“{cleaned}”匹配到多个地点，请选择一个再规划路线：",
                "trace": trace,
                "cards": [{"kind": "place", **o} for o in options],
                "draft": {"type": "place_choice", "query": cleaned},
            }
        route = build_route(db, None, places[0].id)
        trace.append({"tool": "plan_route", "status": "ok", "summary": f"{route['distance_m']} 米 · {route['minutes']} 分钟"})
        return {"reply": f"已为你规划到{places[0].name}的步行路线：约 {route['distance_m']} 米，{route['minutes']} 分钟。", "trace": trace, "cards": [{"kind": "route", **route}], "draft": None}

    if book_intent:
        if "座位" in text or "图书馆" in text:
            rtype = "seat"
        elif "教室" in text:
            rtype = "classroom"
        else:
            rtype = "lab"
        day = _date_from_text(text)
        people_match = re.search(r"(\d{1,2})\s*人", text)
        people = int(people_match.group(1)) if people_match else (1 if rtype == "seat" else 4)
        start, end = _time_from_text(text, rtype)
        trace.append({"tool": "list_resources", "status": "ok", "summary": f"{rtype} · {day.isoformat()} · {start}-{end}"})
        query = db.query(Resource).filter(Resource.type == rtype, Resource.status == "open")
        if rtype == "seat":
            query = query.filter(Resource.room.like("%A 区%"))
        resources = query.limit(40).all()
        candidates = []
        for res in resources:
            from .services import validate_booking  # local import avoids cycle at module load

            ok, reason, slot = validate_booking(db, res, day, start, end, people, "人工智能与计算机学院")
            if ok:
                candidates.append(
                    {
                        "resource_id": res.id,
                        "name": res.name,
                        "room": res.room,
                        "capacity": res.capacity,
                        "equipment": res.equipment,
                        "description": res.description,
                        "date": day.isoformat(),
                        "start_at": start,
                        "end_at": end,
                        "people": people,
                        "reason": f"容量 {res.capacity} 人，满足 {people} 人；{res.room}；时段可约",
                    }
                )
            if len(candidates) >= 3:
                break
        if not candidates:
            return {
                "reply": f"{day.isoformat()} {start}-{end} 没有找到满足条件的{rtype}。可以换一个时段、减少人数，或换到其他楼栋。",
                "trace": trace,
                "cards": [],
                "draft": None,
            }
        trace.append({"tool": "check_availability", "status": "ok", "summary": f"找到 {len(candidates)} 个候选"})
        labels = {"lab": "实验室", "classroom": "空教室", "seat": "图书馆座位"}
        reply = f"我按 {day.isoformat()}（{WEEKDAY_CN[day.isoweekday() - 1]}）{start}-{end}、{people} 人筛选了{labels[rtype]}，推荐前 {len(candidates)} 个："
        return {
            "reply": reply,
            "trace": trace,
            "cards": candidates,
            "draft": {"type": rtype, "date": day.isoformat(), "start_at": start, "end_at": end, "people": people},
        }

    if any(k in text for k in ("校历", "开学", "放假", "考试", "第几周")):
        events = db.query(CalendarEvent).filter(CalendarEvent.term == "2026-2027-1").order_by(CalendarEvent.start_date).all()
        trace.append({"tool": "get_calendar", "status": "ok", "summary": "2026-2027 第一学期"})
        return {
            "reply": "2026-2027 学年第一学期：9 月 7 日正式上课；国庆/中秋 10 月 1—8 日；第 18—19 周为期末考试周（待核验）；1 月 16 日起放寒假。",
            "trace": trace,
            "cards": [{"kind": "calendar", "title": e.title, "start": e.start_date, "end": e.end_date, "status": e.status} for e in events],
            "draft": None,
        }

    if any(k in text for k in ("学校", "校区", "面积", "师资", "教师", "专业", "排名", "ESI")):
        metrics = db.query(SchoolMetric).all()
        campuses = db.query(Campus).all()
        trace.append({"tool": "get_school_profile", "status": "ok", "summary": "校情指标"})
        return {
            "reply": "江苏师范大学现有泉山、云龙、奎园、潘安湖四个校区，20 个专业学院，66 个本科招生专业，专任教师 1896 人。官网公开简介未给出占地面积，页面会标注“待校方提供”，不显示猜测值。",
            "trace": trace,
            "cards": [
                {"kind": "metric", "label": m.label, "value": (m.value + m.unit) if m.value else "待校方提供", "status": m.status}
                for m in metrics
                if m.key in ("campuses", "colleges", "majors", "teachers", "undergrads", "esi_top1", "area")
            ]
            + [{"kind": "campus", "name": c.name, "address": c.address} for c in campuses],
            "draft": None,
        }

    if "省钱" in text or "想买" in text:
        from .models import PurchaseIntent

        intents = db.query(PurchaseIntent).filter(PurchaseIntent.user_id == 1).all()
        saved = sum(i.price_cent for i in intents if i.status == "abandoned") / 100
        trace.append({"tool": "get_saving_summary", "status": "ok", "summary": f"累计节省 {saved:.0f} 元"})
        return {"reply": f"你当前累计节省 ¥{saved:.0f}（仅统计“已放弃”的购买意向，不代表实际现金收入）。", "trace": trace, "cards": [], "draft": None}

    if "搭子" in text:
        from .models import BuddyPost

        posts = db.query(BuddyPost).filter(BuddyPost.status == "open").limit(5).all()
        trace.append({"tool": "search_buddy_posts", "status": "ok", "summary": f"{len(posts)} 条开放帖子"})
        return {
            "reply": "当前有这些开放中的搭子帖：",
            "trace": trace,
            "cards": [{"kind": "buddy", "id": p.id, "type": p.type, "title": p.title, "time": p.time_text, "place": p.place} for p in posts],
            "draft": None,
        }

    return {
        "reply": "我可以帮你：① 查实验室/空教室/图书馆座位并生成预约草稿；② 规划校园路线；③ 查校历、校情和省钱统计；④ 找搭子。试试说“明天下午帮我约一个 4 人的研讨教室”或“去图书馆怎么走”。",
        "trace": [{"tool": "intent_router", "status": "fallback", "summary": "未命中具体意图"}],
        "cards": [],
        "draft": None,
    }