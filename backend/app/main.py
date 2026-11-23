import asyncio
import hashlib
import time as _time
import json
import mimetypes
import random
import re
from contextlib import asynccontextmanager
from datetime import date, datetime, timedelta
from pathlib import Path

from fastapi import Body, Depends, FastAPI, File, Form, Header, HTTPException, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.gzip import GZipMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session

from .db import SessionLocal, engine, get_db
from .models import (
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
from .seed import seed
from .buddy_activity import router as buddy_activity_router, ensure_schema as ensure_buddy_activity
from .self_control import router as self_control_router
from .office import extract_kv, match_files, review_submission
from .office_docs import KIND_LABELS, extract_conditions, file_to_text, parse_document, preview_document, verify_applications
from . import office_ai
from . import tools
from . import deal_decision
from .services import (
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

mimetypes.add_type("text/html; charset=utf-8", ".html")
mimetypes.add_type("application/javascript", ".js")
mimetypes.add_type("text/css", ".css")
mimetypes.add_type("application/json", ".json")

_API_CACHE: dict = {}

BASE_DIR = Path(__file__).resolve().parents[2]
WEB_DIR = BASE_DIR / "web"


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed(db)
        deal_decision.ensure_sources(db)
        migrate_chat_schema(db)
        ensure_buddy_activity(db)
    finally:
        db.close()
    yield


app = FastAPI(
    title="苏小师 · 校园智慧服务",
    version="1.1.0",
    lifespan=lifespan,
    docs_url=None,
    redoc_url=None,
    openapi_url=None,
)
app.include_router(self_control_router)
app.include_router(buddy_activity_router)


@app.middleware("http")
async def no_cache_static(request, call_next):
    response = await call_next(request)
    if not request.url.path.startswith("/api"):
        if request.url.path.startswith("/static/"):
            if ".bundle." in request.url.path:
                response.headers["Cache-Control"] = "no-cache"
            else:
                response.headers["Cache-Control"] = "no-cache"
        else:
            response.headers["Cache-Control"] = "no-store, max-age=0, must-revalidate"
            response.headers["Pragma"] = "no-cache"
    return response


app.add_middleware(GZipMiddleware, minimum_size=800)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5600",
        "http://localhost:5600",
        "http://127.0.0.1:8000",
        "http://localhost:8000",
    ],
    allow_origin_regex=r"https://[a-z0-9-]+\.trycloudflare\.com",
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type"],
)


from .api_utils import ok, fail, _requester  # noqa: E402


def metric_dict(m: SchoolMetric) -> dict:
    return {
        "key": m.key,
        "label": m.label,
        "value": m.value,
        "unit": m.unit,
        "display": (m.value + m.unit) if m.value else "待校方提供",
        "source_url": m.source_url,
        "status": m.status,
        "note": m.note,
    }


def resource_dict(r: Resource, place: Place | None = None) -> dict:
    return {
        "id": r.id,
        "type": r.type,
        "name": r.name,
        "campus_id": r.campus_id,
        "place": place.name if place else "",
        "room": r.room,
        "capacity": r.capacity,
        "description": r.description,
        "equipment": r.equipment,
        "audience": r.audience,
        "open_days": r.open_days,
        "open_start": r.open_start,
        "open_end": r.open_end,
        "advance_days": r.advance_days,
        "approval_required": bool(r.approval_required),
        "status": r.status,
        "is_demo": bool(r.is_demo),
        "data_note": r.data_note,
        "x": r.x,
        "y": r.y,
    }


def current_term() -> str:
    today = date.today()
    if today >= date(today.year, 9, 1) or today <= date(today.year, 2, 28):
        return f"{today.year}-{today.year + 1}-1"
    return f"{today.year - 1}-{today.year}-2"


def week_info() -> dict:
    starts = {2026: date(2026, 9, 7), 2027: date(2027, 3, 1)}
    today = date.today()
    if today >= date(2026, 9, 7) and today <= date(2027, 1, 17):
        start = date(2026, 9, 7)
        term = "2026-2027-1"
    elif today >= date(2027, 3, 1) and today <= date(2027, 7, 4):
        start = date(2027, 3, 1)
        term = "2026-2027-2"
    else:
        start = date(2026, 9, 7)
        term = "2026-2027-1"
    week = max(1, ((today - start).days // 7) + 1)
    return {"term": term, "week": week, "weekday": WEEKDAY_CN[today.isoweekday() - 1], "today": today.isoformat(), "week_start": start.isoformat()}


@app.get("/api/health")
def health():
    return ok({"status": "up", "time": datetime.now().isoformat(timespec="seconds")})


@app.get("/api/home")
def home(db: Session = Depends(get_db)):
    metrics = db.query(SchoolMetric).all()
    campuses = db.query(Campus).all()
    info = week_info()
    term = info["term"]
    events = (
        db.query(CalendarEvent)
        .filter(CalendarEvent.term == term)
        .order_by(CalendarEvent.start_date)
        .all()
    )
    week_start = date.fromisoformat(info["week_start"]) + timedelta(days=(info["week"] - 1) * 7)
    week_end = week_start + timedelta(days=6)
    week_events = [e for e in events if week_start.isoformat() <= e.start_date <= week_end.isoformat()]
    news = db.query(News).filter(News.status == "published").order_by(News.published_at.desc()).limit(8).all()
    booking_count = db.query(Booking).filter(Booking.user_id == 1).count()
    return ok(
        {
            "school": {
                "name": "江苏师范大学",
                "motto": "崇德厚学，励志敏行",
                "source": "http://www.jsnu.edu.cn/xxjj/list.htm",
                "updated_at": "2026-09",
            },
            "week": info,
            "metrics": [metric_dict(m) for m in metrics],
            "campuses": [
                {"id": c.id, "name": c.name, "address": c.address, "postcode": c.postcode, "note": c.note}
                for c in campuses
            ],
            "calendar": [
                {
                    "title": e.title,
                    "start": e.start_date,
                    "end": e.end_date,
                    "type": e.type,
                    "status": e.status,
                    "source_url": e.source_url,
                }
                for e in events
            ],
            "week_events": [
                {
                    "title": e.title,
                    "start": e.start_date,
                    "end": e.end_date,
                    "type": e.type,
                    "status": e.status,
                }
                for e in week_events
            ],
            "news": [
                {
                    "id": n.id,
                    "title": n.title,
                    "summary": n.summary,
                    "source": n.source,
                    "source_url": n.source_url,
                    "category": n.category,
                    "college": n.college,
                    "published_at": n.published_at,
                }
                for n in news
            ],
            "booking_count": booking_count,
        }
    )


@app.get("/api/school/calendar")
def calendar(term: str = Query(default="2026-2027-1"), db: Session = Depends(get_db)):
    terms = [t.strip() for t in term.split(",") if t.strip()] or ["2026-2027-1"]
    events = (
        db.query(CalendarEvent)
        .filter(CalendarEvent.term.in_(terms))
        .order_by(CalendarEvent.start_date)
        .all()
    )
    return ok(
        [
            {
                "term": e.term,
                "title": e.title,
                "start": e.start_date,
                "end": e.end_date,
                "type": e.type,
                "status": e.status,
                "source_url": e.source_url,
            }
            for e in events
        ]
    )


@app.get("/api/school/periods")
def periods():
    return ok(
        [
            {"big": 1, "small": "1-2", "start": "08:00", "end": "09:25"},
            {"big": 2, "small": "3-5", "start": "09:45", "end": "11:55"},
            {"big": 3, "small": "6-7", "start": "14:00", "end": "15:25"},
            {"big": 4, "small": "8-9", "start": "15:45", "end": "17:10"},
            {"big": 5, "small": "10-12", "start": "18:30", "end": "20:40"},
        ]
    )


@app.get("/api/resources")
def list_resources(
    type: str = Query(default="lab"),
    q: str = Query(default=""),
    db: Session = Depends(get_db),
):
    query = db.query(Resource).filter(Resource.type == type)
    if q:
        query = query.filter(Resource.name.like(f"%{q}%"))
    rows = query.order_by(Resource.id).all()
    places = {p.id: p for p in db.query(Place).all()}
    return ok([resource_dict(r, places.get(r.place_id)) for r in rows])


@app.get("/api/resources/{resource_id}")
def get_resource(resource_id: int, db: Session = Depends(get_db)):
    r = db.get(Resource, resource_id)
    if not r:
        fail("资源不存在", "RESOURCE_NOT_FOUND", 404)
    place = db.get(Place, r.place_id) if r.place_id else None
    return ok(resource_dict(r, place))


@app.get("/api/resources/{resource_id}/slots")
def resource_slots(resource_id: int, date_str: str = Query(alias="date"), db: Session = Depends(get_db)):
    r = db.get(Resource, resource_id)
    if not r:
        fail("资源不存在", "RESOURCE_NOT_FOUND", 404)
    day = parse_date(date_str)
    slots = ensure_slots(db, r, day)
    return ok(
        [
            {
                "id": s.id,
                "start_at": s.start_at,
                "end_at": s.end_at,
                "capacity": s.capacity,
                "booked": s.booked,
                "status": s.status,
                "remaining": max(0, s.capacity - s.booked),
            }
            for s in slots
        ]
    )


@app.post("/api/bookings")
def add_booking(payload: dict = Body(...), db: Session = Depends(get_db)):
    booking, error = create_booking(db, payload, seat_busy=simulated_seat_busy)
    if error:
        fail(error, "RULE_VIOLATION", 409 if "预约" in error or "时段" in error else 400)
    return ok(booking, "已提交" if booking and booking["status"] == "pending_approval" else "预约成功")


@app.get("/api/bookings/my")
def my_bookings(db: Session = Depends(get_db)):
    expire_seat_bookings(db)
    rows = db.query(Booking).filter(Booking.user_id == 1).order_by(Booking.id.desc()).all()
    return ok([booking_to_dict(db, b) for b in rows])


@app.post("/api/bookings/{booking_id}/cancel")
def api_cancel(booking_id: int, db: Session = Depends(get_db)):
    success, message = cancel_booking(db, booking_id)
    if not success:
        fail(message, "RULE_VIOLATION", 409)
    return ok(None, message)


@app.post("/api/bookings/{booking_id}/checkin")
def api_checkin(booking_id: int, payload: dict = Body(default={}), db: Session = Depends(get_db)):
    success, message = checkin_booking(db, booking_id, payload.get("lat"), payload.get("lng"))
    if not success:
        fail(message, "RULE_VIOLATION", 409)
    return ok(None, message)


@app.post("/api/bookings/{booking_id}/away")
def api_away(booking_id: int, db: Session = Depends(get_db)):
    success, message = away_booking(db, booking_id)
    if not success:
        fail(message, "RULE_VIOLATION", 409)
    return ok(None, message)


@app.post("/api/bookings/{booking_id}/release")
def api_release(booking_id: int, db: Session = Depends(get_db)):
    success, message, points = release_seat_reservation(db, booking_id)
    if not success:
        fail(message, "RULE_VIOLATION", 409)
    return ok({"points": points}, message)


@app.post("/api/bookings/{booking_id}/decide")
def api_decide(booking_id: int, payload: dict = Body(...), db: Session = Depends(get_db)):
    success, message = decide_booking(db, booking_id, bool(payload.get("approve")), payload.get("comment", ""))
    if not success:
        fail(message, "RULE_VIOLATION", 409)
    return ok(None, message)


SEAT_SLOT_OCCUPANCY = {
    "08:00": 0.32,
    "10:00": 0.44,
    "12:00": 0.28,
    "14:00": 0.56,
    "16:00": 0.63,
    "18:00": 0.83,
    "20:00": 0.46,
}


def simulated_seat_busy(seat, day: str, start: str, end: str) -> bool:
    """按「日期 + 时段 + 座位」确定性散列模拟真实占用分布。

    同一时段刷新结果稳定；不同日期、时段分布不同；晚间自习高峰占用最高。
    真实预约记录优先，此函数只补充接近真实的自习上座分布。
    """
    base = SEAT_SLOT_OCCUPANCY.get(start, 0.45)
    if "靠窗" in (seat.description or ""):
        base = min(0.92, base + 0.14)
    try:
        if date.fromisoformat(day).weekday() >= 5:
            base *= 0.72
    except ValueError:
        pass
    digest = hashlib.md5(f"{day}|{start}|{seat.id}".encode()).hexdigest()
    ratio = int(digest[:8], 16) / 0xFFFFFFFF
    return ratio < base


@app.get("/api/library/areas")
def library_areas(
    date_str: str = Query(default="", alias="date"),
    start: str = Query(default=""),
    end: str = Query(default=""),
    db: Session = Depends(get_db),
):
    _ck = f"areas:{date_str}:{start}:{end}"
    _hit = _API_CACHE.get(_ck)
    if _hit and _time.time() - _hit[0] < 15:
        return _hit[1]
    expire_seat_bookings(db)
    rows = db.query(Resource).filter(Resource.type == "seat").order_by(Resource.id).all()
    day = parse_date(date_str) if date_str else date.today()
    busy_ids: set[int] = set()
    active_filter = [
        Booking.type == "seat",
        Booking.date == day.isoformat(),
        Booking.status.in_(["pending_approval", "confirmed", "checked_in", "away"]),
    ]
    if start and end:
        active_filter.append(Booking.start_at < end)
        active_filter.append(Booking.end_at > start)
    active = db.query(Booking).filter(*active_filter).all()
    busy_ids = {b.resource_id for b in active}
    areas: dict[str, dict] = {}
    for seat in rows:
        area = areas.setdefault(seat.room, {"seats": [], "open_start": seat.open_start, "open_end": seat.open_end})
        area["seats"].append(
            {
                "id": seat.id,
                "name": seat.name,
                "x": seat.x,
                "y": seat.y,
                "equipment": seat.equipment,
                "description": seat.description,
                "busy": seat.id in busy_ids or simulated_seat_busy(seat, day.isoformat(), start, end),
            }
        )
    _result = ok(
        [
            {
                "name": k,
                "open_start": v["open_start"],
                "open_end": v["open_end"],
                "total": len(v["seats"]),
                "available": sum(1 for s in v["seats"] if not s["busy"]),
                "seats": v["seats"],
            }
            for k, v in areas.items()
        ]
    )
    _API_CACHE[_ck] = (_time.time(), _result)
    return _result


CLASS_PERIODS = [
    ("1-2节", "08:00", "09:40"),
    ("3-4节", "10:10", "11:50"),
    ("5-6节", "14:00", "15:40"),
    ("7-8节", "16:00", "17:40"),
    ("晚间", "18:30", "20:40"),
]


@app.get("/api/classrooms/grid")
def classroom_grid(
    date_str: str = Query(default="", alias="date"),
    db: Session = Depends(get_db),
):
    day = parse_date(date_str) if date_str else date.today()
    weekday = day.isoweekday()
    rooms = (
        db.query(Resource)
        .filter(Resource.type == "classroom", Resource.status == "open")
        .order_by(Resource.room)
        .all()
    )
    active = (
        db.query(Booking)
        .filter(
            Booking.type == "classroom",
            Booking.date == day.isoformat(),
            Booking.status.in_(["pending_approval", "confirmed", "checked_in"]),
        )
        .all()
    )
    booked_map = {(b.resource_id, b.start_at, b.end_at): b for b in active}
    result_rooms = []
    for r in rooms:
        slots = ensure_slots(db, r, day)
        slot_map = {(s.start_at, s.end_at): s for s in slots}
        cells = []
        for label, st, en in CLASS_PERIODS:
            slot = slot_map.get((st, en))
            booking = booked_map.get((r.id, st, en))
            if booking:
                status, text = ("mine", "我约的") if booking.user_id == 1 else ("booked", "已约")
            elif slot:
                if slot.status == "occupied":
                    status, text = "course", "排课占用"
                elif slot.status == "closed":
                    status, text = "closed", "不开放"
                elif slot.booked >= slot.capacity:
                    status, text = "full", "已满"
                else:
                    status, text = "free", "可约"
            else:
                if weekday <= 5 and (r.id * 7 + int(st[:2])) % 5 < 3:
                    status, text = "course", "排课占用"
                else:
                    status, text = "free", "可约"
            cells.append({"period": label, "start": st, "end": en, "status": status, "text": text})
        result_rooms.append(
            {
                "id": r.id,
                "name": r.name,
                "room": r.room,
                "capacity": r.capacity,
                "equipment": r.equipment,
                "description": r.description,
                "cells": cells,
            }
        )
    return ok(
        {
            "date": day.isoformat(),
            "weekday": WEEKDAY_CN[weekday - 1] if 1 <= weekday <= 7 else "",
            "periods": [{"label": l, "start": s, "end": e} for l, s, e in CLASS_PERIODS],
            "rooms": result_rooms,
        }
    )






















REPAIR_AREAS = ["宿舍", "教学楼", "图书馆", "公共区域", "其他"]
REPAIR_CATEGORIES = ["水电", "家具", "网络", "门窗", "其他"]


REPAIR_AUTO_DONE_HOURS = 9


def _advance_repair(r: Repair) -> bool:
    if r.status == "done":
        return False
    try:
        created = datetime.strptime((r.created_at or "")[:19], "%Y-%m-%d %H:%M:%S")
    except ValueError:
        return False
    elapsed = datetime.now() - created
    if elapsed >= timedelta(hours=REPAIR_AUTO_DONE_HOURS):
        r.status = "done"
        r.reply = "维修完成，请确认设施恢复正常。"
        return True
    if r.status == "submitted":
        r.status = "in_progress"
        r.reply = "维修人员已接单，预计 48 小时内上门。"
        return True
    return False


def repair_to_dict(r: Repair) -> dict:
    status_meta = {
        "submitted": ("已提交", "维修方已收到，等待接单"),
        "in_progress": ("处理中", "维修人员已接单"),
        "done": ("已完成", "维修完成，感谢反馈"),
    }
    label, hint = status_meta.get(r.status, (r.status, ""))
    return {
        "id": r.id,
        "location": r.location,
        "area": r.area,
        "category": r.category,
        "title": r.title,
        "description": r.description,
        "urgency": "紧急" if r.urgency == "urgent" else "普通",
        "urgency_key": r.urgency,
        "contact": r.contact,
        "status": r.status,
        "status_label": label,
        "status_hint": hint,
        "reply": r.reply,
        "created_at": r.created_at,
    }


@app.get("/api/repairs/meta")
def repairs_meta():
    return ok({"areas": REPAIR_AREAS, "categories": REPAIR_CATEGORIES})


@app.post("/api/repairs")
def create_repair(payload: dict = Body(...), db: Session = Depends(get_db)):
    location = (payload.get("location") or "").strip()
    title = (payload.get("title") or "").strip()
    if not location:
        fail("请填写报修位置", "VALIDATION", 400)
    if not title:
        fail("请描述要报修的问题", "VALIDATION", 400)
    area = payload.get("area") if payload.get("area") in REPAIR_AREAS else "宿舍"
    category = payload.get("category") if payload.get("category") in REPAIR_CATEGORIES else "其他"
    r = Repair(
        user_id=1,
        location=location[:120],
        area=area,
        category=category,
        title=title[:110],
        description=(payload.get("description") or "")[:2000],
        urgency="urgent" if payload.get("urgency") == "urgent" else "normal",
        contact=(payload.get("contact") or "")[:60],
        status="submitted",
    )
    db.add(r)
    db.commit()
    db.refresh(r)
    return ok(repair_to_dict(r), "报修已提交，维修方将尽快接单")


@app.get("/api/repairs/my")
def my_repairs(db: Session = Depends(get_db)):
    rows = db.query(Repair).filter(Repair.user_id == 1).order_by(Repair.id.desc()).all()
    changed = False
    for r in rows:
        if _advance_repair(r):
            changed = True
    if changed:
        db.commit()
    return ok([repair_to_dict(r) for r in rows])


# ---------- 搭子社区 v2：性格档案 / 测试 / 匹配 ----------

from .buddy_test import (  # noqa: E402
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








# ---------- 搭子申请与站内聊天 ----------


























# ---------- 消息中心（六类：上课/待办/新闻/省钱/搭子/预约） ----------


def _msg_to_dict(m: Message) -> dict:
    return {
        "id": m.id,
        "category": m.category,
        "title": m.title,
        "content": m.content,
        "action_text": m.action_text,
        "action_url": m.action_url,
        "read": bool(m.is_read),
        "created_at": m.created_at,
    }


@app.get("/api/messages")
def list_messages(db: Session = Depends(get_db), x_demo_user: str = Header(default="1")):
    uid = int(x_demo_user) if str(x_demo_user).isdigit() else 1
    rows = db.query(Message).filter(Message.user_id == uid).order_by(Message.id.desc()).limit(60).all()
    items = [_msg_to_dict(m) for m in reversed(rows)]
    unread = sum(1 for m in items if not m["read"])
    return ok({"messages": items, "unread": unread, "categories": ["上课", "待办", "新闻", "省钱", "搭子", "预约"]})


@app.post("/api/messages/{message_id}/read")
def read_message(message_id: int, db: Session = Depends(get_db)):
    m = db.query(Message).filter(Message.id == message_id, Message.user_id == 1).first()
    if not m:
        raise HTTPException(status_code=404, detail="消息不存在")
    m.is_read = 1
    db.commit()
    return ok({"id": m.id, "read": True})


@app.post("/api/messages/read-all")
def read_all_messages(db: Session = Depends(get_db)):
    db.query(Message).filter(Message.user_id == 1, Message.is_read == 0).update({Message.is_read: 1})
    db.commit()
    return ok({"unread": 0})


@app.post("/api/messages/deadline-reminders")
def deadline_reminders(db: Session = Depends(get_db)):
    """截止前 30 分钟未完成的待办写入信息中心（按任务去重）。"""
    from datetime import datetime as _dt

    now = _dt.now()
    tasks = db.query(SelfTask).filter(SelfTask.user_id == 1, SelfTask.status != "done", SelfTask.due_at != "").all()
    created = 0
    for t in tasks:
        for fmt in ("%Y-%m-%d %H:%M", "%Y-%m-%d"):
            try:
                due = _dt.strptime(t.due_at, fmt)
                break
            except ValueError:
                continue
        else:
            continue
        diff_min = (due - now).total_seconds() / 60
        if not (0 <= diff_min <= 30):
            continue
        url = f"#/life/self/control?tid={t.id}"
        exists = db.query(Message).filter(Message.user_id == 1, Message.action_url == url).first()
        if exists:
            continue
        db.add(
            Message(
                user_id=1,
                category="待办",
                title=f"待办提醒：{t.title[:40]}",
                content=f"「{t.title}」将在 {int(diff_min)} 分钟后到期（{t.due_at}），还没标记完成。",
                action_text="去处理",
                action_url=url,
                is_read=0,
                created_at=now.strftime("%Y-%m-%d %H:%M"),
            )
        )
        created += 1
    if created:
        db.commit()
    return ok({"created": created})


# ---------- 图书馆收藏与监督占座 ----------

@app.get("/api/library/favorites")
def seat_favorites(date_str: str = Query(default="", alias="date"), start: str = Query(default=""), end: str = Query(default=""), db: Session = Depends(get_db)):
    favs = db.query(SeatFavorite).filter(SeatFavorite.user_id == 1).order_by(SeatFavorite.id.desc()).limit(4).all()
    seat_ids = [f.seat_id for f in favs]
    seats = db.query(Resource).filter(Resource.id.in_(seat_ids)).all() if seat_ids else []
    seat_map = {s.id: s for s in seats}
    day = date_str or date.today().isoformat()
    s_start = start or "08:00"
    s_end = end or "10:00"
    busy_ids = {
        b.resource_id
        for b in db.query(Booking).filter(
            Booking.type == "seat", Booking.date == day,
            Booking.start_at < s_end, Booking.end_at > s_start,
            Booking.status.in_(["pending_approval", "confirmed", "checked_in", "away"]),
        ).all()
    }
    out = []
    for f in favs:
        s = seat_map.get(f.seat_id)
        if not s:
            continue
        out.append({
            "seat_id": s.id,
            "room": s.room,
            "seat_no": s.name.split(" ").pop() if s.name else "",
            "window": "靠窗" in (s.description or ""),
            "power": s.equipment == "电源",
            "favorite": True,
            # 与平面图口径一致：真实预约（含暂离）或模拟上座都算已占用
            "available": s.id not in busy_ids and not simulated_seat_busy(s, day, s_start, s_end),
        })
    return ok(out)


@app.post("/api/library/favorites/{seat_id}/toggle")
def toggle_seat_favorite(seat_id: int, db: Session = Depends(get_db)):
    exists = db.query(SeatFavorite).filter(SeatFavorite.user_id == 1, SeatFavorite.seat_id == seat_id).first()
    if exists:
        db.delete(exists)
        db.commit()
        return ok({"favorited": False}, "已取消收藏")
    count = db.query(SeatFavorite).filter(SeatFavorite.user_id == 1).count()
    if count >= 4:
        fail("常用座位最多 4 个，请先移除一个", "LIMIT", 400)
    db.add(SeatFavorite(user_id=1, seat_id=seat_id))
    db.commit()
    return ok({"favorited": True}, "已设为常用座位")


@app.post("/api/library/supervise")
def supervise_seat(payload: dict = Body(...), db: Session = Depends(get_db)):
    """监督占座：仅当全馆剩余座位低于 20% 时可用；占用者需 30 分钟内回馆定位签到。"""
    expire_seat_bookings(db)
    seat = db.get(Resource, int(payload.get("seat_id") or 0))
    room = str(payload.get("room") or "").strip()
    seat_no = str(payload.get("seat_no") or "").strip()
    if seat is None and room and seat_no:
        seat = (
            db.query(Resource)
            .filter(Resource.type == "seat", Resource.room == room, Resource.name.endswith("-" + seat_no))
            .first()
        )
        if seat is None:
            seat = db.query(Resource).filter(Resource.type == "seat", Resource.room == room, Resource.name == seat_no).first()
    if not seat or seat.type != "seat":
        fail("座位不存在，请确认阅览室与座位号", "NOT_FOUND", 404)
    reason = (payload.get("reason") or "").strip()
    if not reason:
        fail("请填写监督说明", "VALIDATION", 400)
    photo = (payload.get("photo") or "")[:200000]
    if not photo:
        fail("请上传照片证明该座位无人", "VALIDATION", 400)

    day = parse_date(str(payload.get("date") or ""))
    start = str(payload.get("start") or "")
    end = str(payload.get("end") or "")
    today_seats = db.query(Resource).filter(Resource.type == "seat").all()
    active_status = ["pending_approval", "confirmed", "checked_in", "away"]
    real_busy = {
        b.resource_id
        for b in db.query(Booking)
        .filter(
            Booking.type == "seat",
            Booking.date == day.isoformat(),
            Booking.status.in_(active_status),
        )
        .all()
        if (not start or (b.start_at == start and b.end_at == end))
    }
    busy = sum(1 for st in today_seats if st.id in real_busy or simulated_seat_busy(st, day.isoformat(), start, end))
    total = len(today_seats)
    available = max(0, total - busy)
    if total and available / total >= 0.2:
        fail(f"全馆剩余座位 {available}/{total}（{round(available * 100 / total)}%），充足时不能发起监督占座", "RULE_VIOLATION", 409)

    if seat.id not in real_busy and not simulated_seat_busy(seat, day.isoformat(), start, end):
        fail("该座位当前未被预约，无需监督占座", "RULE_VIOLATION", 409)
    mine = (
        db.query(Booking)
        .filter(Booking.user_id == 1, Booking.resource_id == seat.id, Booking.status.in_(active_status))
        .first()
    )
    if mine:
        fail("不能监督自己正在使用的座位", "FORBIDDEN", 403)
    if db.query(Supervision).filter(Supervision.seat_id == seat.id, Supervision.status == "active").first():
        fail("该座位已有待处理的监督申请", "RULE_VIOLATION", 409)

    now = datetime.now()
    deadline = (now + timedelta(minutes=30)).strftime("%Y-%m-%d %H:%M:%S")
    sv = Supervision(
        supervisor_id=1, seat_id=seat.id, room=seat.room,
        seat_no=seat.name.split(" ").pop() if seat.name else seat_no,
        reason=reason[:500], photo=photo, status="active", deadline=deadline,
    )
    db.add(sv)
    db.commit()
    return ok({
        "id": sv.id, "seat_no": sv.seat_no, "room": sv.room,
        "deadline": deadline,
    }, "监督已提交：占用者需在 30 分钟内回馆定位签到，逾期座位自动释放")


@app.get("/api/library/supervisions")
def my_supervisions(db: Session = Depends(get_db)):
    expire_seat_bookings(db)
    rows = db.query(Supervision).filter(Supervision.supervisor_id == 1).order_by(Supervision.id.desc()).limit(10).all()
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    out = []
    for r in rows:
        out.append({
            "id": r.id, "seat_id": r.seat_id, "seat_no": r.seat_no, "room": r.room,
            "reason": r.reason, "status": r.status,
            "deadline": r.deadline,
            "left_sec": max(0, int((datetime.strptime(r.deadline, "%Y-%m-%d %H:%M:%S") - datetime.now()).total_seconds())) if r.status == "active" else 0,
        })
    return ok(out)


















@app.post("/api/repairs/{repair_id}/advance")
def advance_repair(repair_id: int, db: Session = Depends(get_db)):
    r = db.get(Repair, repair_id)
    if not r:
        fail("报修单不存在", "NOT_FOUND", 404)
    if r.status == "submitted":
        r.status = "in_progress"
        r.reply = "维修人员已接单，预计 48 小时内上门。"
        msg = "已接单（演示：维修方操作）"
    elif r.status == "in_progress":
        r.status = "done"
        r.reply = "维修完成，请确认设施恢复正常。"
        msg = "已完成（演示：维修方操作）"
    else:
        fail("该报修单已完结", "RULE_VIOLATION", 409)
    db.commit()
    db.refresh(r)
    return ok(repair_to_dict(r), msg)


@app.get("/api/places")
def places(db: Session = Depends(get_db)):
    rows = db.query(Place).order_by(Place.id).all()
    return ok(
        [
            {
                "id": p.id,
                "name": p.name,
                "alias": p.alias,
                "type": p.type,
                "lat": p.lat,
                "lng": p.lng,
                "entrance": p.entrance,
                "verified": bool(p.verified),
                "source": p.source,
            }
            for p in rows
        ]
    )


@app.post("/api/places")
def create_place(payload: dict = Body(...), db: Session = Depends(get_db)):
    """在导航页地图点选新增/更新一个自定义地点（无需导入 JSON）。"""
    name = str(payload.get("name") or "").strip()
    alias = str(payload.get("alias") or "").strip()
    entrance = str(payload.get("entrance") or "").strip()
    ptype = str(payload.get("type") or "other").strip() or "other"
    try:
        lat = float(payload.get("lat"))
        lng = float(payload.get("lng"))
    except (TypeError, ValueError):
        fail("请在地图上点击选择一个位置", "VALIDATION", 400)
    if not name:
        fail("请填写地点名称", "VALIDATION", 400)
    if len(name) > 64:
        fail("地点名称不能超过 64 个字符", "VALIDATION", 400)
    allowed = {"dorm", "library", "building", "canteen", "sports", "service", "gate", "office", "other"}
    if ptype not in allowed:
        fail("地点类型不支持", "VALIDATION", 400)
    # 泉山校区范围（GCJ-02），防止误点到大片校外区域
    if not (34.18 <= lat <= 34.22 and 117.15 <= lng <= 117.20):
        fail("请点击校园范围内的位置（泉山校区）", "VALIDATION", 400)

    campus_id = int(payload.get("campus_id") or 1)
    existing = db.query(Place).filter(Place.name == name, Place.campus_id == campus_id).first()
    if existing and existing.source != "用户标注":
        fail("该地点名称已存在，可直接在搜索框输入使用", "DUPLICATE", 409)
    if existing:
        existing.alias = alias[:255]
        existing.type = ptype
        existing.lat = lat
        existing.lng = lng
        existing.entrance = entrance[:255]
        existing.verified = 1
        existing.source = "用户标注"
        db.commit()
        db.refresh(existing)
        place = existing
        message = "已更新自定义地点"
    else:
        place = Place(
            campus_id=campus_id,
            name=name,
            alias=alias[:255],
            type=ptype,
            lat=lat,
            lng=lng,
            entrance=entrance[:255],
            verified=1,
            source="用户标注",
        )
        db.add(place)
        db.commit()
        db.refresh(place)
        message = "已添加自定义地点"
    return ok(
        {
            "id": place.id,
            "name": place.name,
            "alias": place.alias,
            "type": place.type,
            "lat": place.lat,
            "lng": place.lng,
            "entrance": place.entrance,
            "verified": bool(place.verified),
            "source": place.source,
        },
        message,
    )


@app.delete("/api/places/{place_id}")
def delete_place(place_id: int, db: Session = Depends(get_db)):
    """仅允许删除导航页自己标注的地点。"""
    place = db.get(Place, place_id)
    if not place:
        fail("地点不存在", "NOT_FOUND", 404)
    if place.source != "用户标注":
        fail("只能删除自己在导航页标注的地点", "FORBIDDEN", 403)
    if db.query(Resource).filter(Resource.place_id == place_id).first():
        fail("该地点已被资源引用，不能删除", "RULE_VIOLATION", 409)
    db.delete(place)
    db.commit()
    return ok(None, "已删除自定义地点")


@app.get("/api/places/search")
def search_places(q: str = Query(default=""), db: Session = Depends(get_db)):
    rows = resolve_place(db, q)
    return ok([{"id": p.id, "name": p.name, "type": p.type, "alias": p.alias, "verified": bool(p.verified), "entrance": p.entrance} for p in rows])


@app.post("/api/nav/route")
def nav_route(payload: dict = Body(...), db: Session = Depends(get_db)):
    route = build_route(
        db,
        payload.get("origin_id"),
        int(payload.get("destination_id")),
        payload.get("origin_lat"),
        payload.get("origin_lng"),
    )
    if not route:
        fail("目的地不存在", "RESOURCE_NOT_FOUND", 404)
    return ok(route)


@app.get("/api/news")
def news_list(
    category: str = Query(default=""),
    college: str = Query(default=""),
    q: str = Query(default=""),
    db: Session = Depends(get_db),
):
    query = db.query(News).filter(News.status == "published")
    if category:
        query = query.filter(News.category == category)
    if college:
        query = query.filter(News.college == college)
    if q:
        query = query.filter(News.title.like(f"%{q}%"))
    rows = query.order_by(News.published_at.desc()).all()
    return ok(
        [
            {
                "id": n.id,
                "title": n.title,
                "summary": n.summary,
                "source": n.source,
                "source_url": n.source_url,
                "category": n.category,
                "college": n.college,
                "published_at": n.published_at,
            }
            for n in rows
        ]
    )


@app.get("/api/news/meta")
def news_meta(db: Session = Depends(get_db)):
    rows = db.query(News).all()
    return ok(
        {
            "categories": sorted({n.category for n in rows}),
            "colleges": sorted({n.college for n in rows}),
        }
    )


@app.get("/api/news/{news_id}")
def news_detail(news_id: int, db: Session = Depends(get_db)):
    n = db.query(News).filter(News.id == news_id, News.status == "published").first()
    if not n:
        raise HTTPException(status_code=404, detail="动态不存在或已下线")
    related = (
        db.query(News)
        .filter(News.status == "published", News.id != n.id, News.category == n.category)
        .order_by(News.published_at.desc())
        .limit(4)
        .all()
    )
    if len(related) < 4:
        extra = (
            db.query(News)
            .filter(News.status == "published", News.id != n.id, News.category != n.category)
            .order_by(News.published_at.desc())
            .limit(4 - len(related))
            .all()
        )
        related.extend(extra)
    try:
        images = json.loads(n.content_images or "[]")
    except json.JSONDecodeError:
        images = []
    return ok(
        {
            "id": n.id,
            "title": n.title,
            "summary": n.summary,
            "content": n.content or n.summary,
            "images": images,
            "source": n.source,
            "source_url": n.source_url,
            "category": n.category,
            "college": n.college,
            "published_at": n.published_at,
            "related": [
                {"id": r.id, "title": r.title, "category": r.category, "published_at": r.published_at}
                for r in related
            ],
        }
    )


@app.get("/api/resource-links")
def resource_links(category: str = Query(default=""), db: Session = Depends(get_db)):
    query = db.query(ResourceLink)
    if category:
        query = query.filter(ResourceLink.category == category)
    rows = query.order_by(ResourceLink.id).all()
    return ok(
        [
            {
                "id": x.id,
                "name": x.name,
                "url": x.url,
                "category": x.category,
                "audience": x.audience,
                "need_login": bool(x.need_login),
                "need_campus_net": bool(x.need_campus_net),
                "status": x.status,
                "note": x.note,
            }
            for x in rows
        ]
    )
























@app.get("/api/errands")
def errands(type: str = Query(default=""), db: Session = Depends(get_db)):
    query = db.query(Errand)
    if type:
        query = query.filter(Errand.type == type)
    rows = query.order_by(Errand.id.desc()).all()
    return ok(
        [
            {
                "id": e.id,
                "type": e.type,
                "title": e.title,
                "pickup": e.pickup,
                "destination": e.destination,
                "reward": e.reward,
                "time_window": e.time_window,
                "note": e.note,
                "status": e.status,
                "runner_id": e.runner_id,
                "created_at": e.created_at,
            }
            for e in rows
        ]
    )


@app.post("/api/errands")
def add_errand(payload: dict = Body(...), db: Session = Depends(get_db)):
    if not payload.get("title"):
        fail("请填写标题")
    e = Errand(
        type=payload.get("type", "express"),
        title=payload["title"],
        pickup=payload.get("pickup", ""),
        destination=payload.get("destination", ""),
        reward=payload.get("reward", ""),
        time_window=payload.get("time_window", ""),
        note=payload.get("note", ""),
    )
    db.add(e)
    db.commit()
    db.refresh(e)
    return ok({"id": e.id}, "已发布")


@app.post("/api/errands/{errand_id}/accept")
def accept_errand(errand_id: int, db: Session = Depends(get_db)):
    e = db.get(Errand, errand_id)
    if not e:
        fail("任务不存在", "RESOURCE_NOT_FOUND", 404)
    if e.status != "open":
        fail("任务已被接单或已关闭", "RULE_VIOLATION", 409)
    e.status = "accepted"
    e.runner_id = 1
    db.commit()
    return ok(None, "接单成功")


@app.post("/api/errands/{errand_id}/next")
def next_errand(errand_id: int, db: Session = Depends(get_db)):
    e = db.get(Errand, errand_id)
    if not e:
        fail("任务不存在", "RESOURCE_NOT_FOUND", 404)
    flow = {"open": "accepted", "accepted": "picked_up", "picked_up": "delivered", "delivered": "confirmed"}
    if e.status not in flow:
        fail("当前状态不可流转", "RULE_VIOLATION", 409)
    e.status = flow[e.status]
    db.commit()
    return ok(None, "状态已更新")


@app.get("/api/lost-found")
def lost_found(db: Session = Depends(get_db)):
    rows = db.query(LostFound).order_by(LostFound.id.desc()).all()
    return ok(
        [
            {
                "id": x.id,
                "type": x.type,
                "name": x.name,
                "place": x.place,
                "happened_at": x.happened_at,
                "description": x.description,
                "status": x.status,
                "contact": x.contact,
            }
            for x in rows
        ]
    )


@app.post("/api/lost-found")
def add_lost_found(payload: dict = Body(...), db: Session = Depends(get_db)):
    if not payload.get("name"):
        fail("请填写物品名称")
    x = LostFound(
        type=payload.get("type", "found"),
        name=payload["name"],
        place=payload.get("place", ""),
        happened_at=payload.get("happened_at", ""),
        description=payload.get("description", ""),
        contact=payload.get("contact", "站内私信"),
    )
    db.add(x)
    db.commit()
    db.refresh(x)
    return ok({"id": x.id}, "已发布")


@app.post("/api/lost-found/{item_id}/claim")
def claim_lost_found(item_id: int, payload: dict = Body(default={}), db: Session = Depends(get_db)):
    x = db.get(LostFound, item_id)
    if not x:
        fail("物品不存在", "RESOURCE_NOT_FOUND", 404)
    if x.status != "open":
        fail("该物品已认领或已关闭", "RULE_VIOLATION", 409)
    x.status = "claimed"
    db.commit()
    return ok(None, "认领申请已提交，等待发布者确认")












def migrate_chat_schema(db: Session) -> None:
    """为旧库补 session_id 列，并把历史消息归入默认会话。"""
    cols = [row[1] for row in db.execute(text("PRAGMA table_info(chat_messages)")).fetchall()]
    if "session_id" not in cols:
        db.execute(text("ALTER TABLE chat_messages ADD COLUMN session_id INTEGER"))
    session = db.query(ChatSession).filter(ChatSession.user_id == 1).order_by(ChatSession.id).first()
    if not session:
        session = ChatSession(user_id=1, title="和苏小师的第一天")
        db.add(session)
        db.flush()
    db.query(ChatMessage).filter(ChatMessage.session_id.is_(None)).update({"session_id": session.id})
    db.commit()




















@app.get("/api/admin/summary")
def admin_summary(db: Session = Depends(get_db)):
    return ok(
        {
            "bookings": db.query(Booking).count(),
            "pending": db.query(Booking).filter(Booking.status == "pending_approval").count(),
            "buddy_posts": db.query(BuddyPost).count(),
            "deals": db.query(DealPost).count(),
            "errands": db.query(Errand).count(),
            "news": db.query(News).count(),
        }
    )


@app.get("/api/admin/bookings")
def admin_bookings(status: str = Query(default="pending_approval"), db: Session = Depends(get_db)):
    query = db.query(Booking)
    if status:
        query = query.filter(Booking.status == status)
    rows = query.order_by(Booking.id.desc()).all()
    return ok([booking_to_dict(db, b) for b in rows])


@app.get("/api/me")
def me(db: Session = Depends(get_db)):
    return ok(
        {
            "id": 1,
            "name": "师大同学",
            "college": "人工智能与计算机学院",
            "campus": "泉山校区",
            "role": "student",
            "note": "演示账号；正式环境需接入学校统一身份认证",
        }
    )


# ================= 省一省 · 理性消费决策助手 =================








































# ---------- 省一省：购买计划 ----------














































if WEB_DIR.exists():
    app.mount("/static", StaticFiles(directory=str(WEB_DIR / "static")), name="static")


@app.get("/")
def index():
    return FileResponse(str(WEB_DIR / "index.html"))


from .routers.deal import router as deal_router  # noqa: E402
app.include_router(deal_router)


from .routers.buddy import router as buddy_router  # noqa: E402
app.include_router(buddy_router)


from .routers.office import router as office_router  # noqa: E402
from .routers.assistant import router as assistant_router  # noqa: E402
from .routers.self_control_routes import router as self_routes_router  # noqa: E402
app.include_router(office_router)
app.include_router(assistant_router)
app.include_router(self_routes_router)


@app.get("/{path:path}")
def spa(path: str):
    candidate = WEB_DIR / path
    if candidate.is_file():
        return FileResponse(str(candidate))
    return FileResponse(str(WEB_DIR / "index.html"))