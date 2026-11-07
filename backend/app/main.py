import asyncio
import hashlib
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
    title="爱师大 · 校园智慧服务",
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
                response.headers["Cache-Control"] = "public, max-age=31536000, immutable"
            else:
                response.headers["Cache-Control"] = "public, max-age=86400"
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


def ok(data=None, message=""):
    return {"ok": True, "data": data, "message": message}


def fail(message: str, code: str = "BAD_REQUEST", status_code: int = 400):
    raise HTTPException(status_code=status_code, detail={"code": code, "message": message})


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
    return ok(
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


def review_to_dict(r: OfficeReview) -> dict:
    try:
        report = json.loads(r.report or "{}")
    except json.JSONDecodeError:
        report = {}
    return {
        "id": r.id,
        "applicant_name": r.applicant_name,
        "student_id": r.student_id,
        "achievement_title": r.achievement_title,
        "award_type": r.award_type,
        "award_level": r.award_level,
        "award_date": r.award_date,
        "material_name": r.material_name,
        "verdict": r.verdict,
        "report": report,
        "created_at": r.created_at,
    }


@app.post("/api/office/reviews")
def create_office_review(payload: dict = Body(...), db: Session = Depends(get_db)):
    form = {
        "applicant_name": (payload.get("applicant_name") or "").strip(),
        "student_id": (payload.get("student_id") or "").strip(),
        "achievement_title": (payload.get("achievement_title") or "").strip(),
        "award_type": (payload.get("award_type") or "").strip(),
        "award_level": (payload.get("award_level") or "").strip(),
        "award_date": (payload.get("award_date") or "").strip(),
    }
    material_text = (payload.get("material_text") or "").strip()
    if not form["applicant_name"] or not form["achievement_title"]:
        fail("申报人姓名与成果名称不能为空", "VALIDATION", 400)
    if not material_text:
        fail("请上传或粘贴佐证材料内容", "VALIDATION", 400)
    report = review_submission(form, material_text)
    review = OfficeReview(
        user_id=1,
        **form,
        material_name=(payload.get("material_name") or "粘贴文本")[:120],
        material_text=material_text[:8000],
        report=json.dumps(report, ensure_ascii=False),
        verdict=report["verdict"],
    )
    db.add(review)
    db.commit()
    db.refresh(review)
    return ok(review_to_dict(review), "审核完成")


@app.get("/api/office/reviews")
def list_office_reviews(db: Session = Depends(get_db)):
    rows = db.query(OfficeReview).order_by(OfficeReview.id.desc()).limit(50).all()
    return ok([review_to_dict(r) for r in rows])


@app.get("/api/office/reviews/{review_id}")
def get_office_review(review_id: int, db: Session = Depends(get_db)):
    r = db.get(OfficeReview, review_id)
    if not r:
        fail("记录不存在", "NOT_FOUND", 404)
    return ok(review_to_dict(r))


@app.post("/api/office/parse-pack")
async def parse_pack(files: list[UploadFile] = File(...)):
    parsed = []
    notice_text, policy_text, quota_rows = "", "", []
    for f in files:
        data = await f.read()
        if len(data) > 10 * 1024 * 1024:
            fail(f"{f.filename} 超过 10MB 限制", "VALIDATION", 400)
        doc = parse_document(f.filename or "未命名", data)
        parsed.append(
            {
                "name": doc["name"],
                "kind": doc["kind"],
                "kind_label": KIND_LABELS.get(doc["kind"], "文档"),
                "text": doc["text"][:20000],
                "table": doc["table"],
                "preview": doc["text"][:160].replace("\n", " "),
            }
        )
        if doc["kind"] == "notice":
            notice_text += "\n" + doc["text"]
        elif doc["kind"] == "policy":
            policy_text += "\n" + doc["text"]
        elif doc["kind"] == "quota" and doc["table"]:
            quota_rows = doc["table"]
    conditions = extract_conditions(notice_text, policy_text)
    return ok({"files": parsed, "conditions": conditions, "quota_rows": quota_rows})


@app.post("/api/office/verify-pack")
async def verify_pack(
    files: list[UploadFile] = File(...),
    conditions: str = Form(default="[]"),
    quota_rows: str = Form(default="[]"),
):
    try:
        conds = json.loads(conditions)
        quota = json.loads(quota_rows)
    except json.JSONDecodeError:
        fail("条件数据格式错误", "VALIDATION", 400)
    apps = []
    for f in files:
        data = await f.read()
        if len(data) > 10 * 1024 * 1024:
            fail(f"{f.filename} 超过 10MB 限制", "VALIDATION", 400)
        doc = parse_document(f.filename or "未命名", data)
        apps.append({"name": f.filename, "text": doc["text"]})
    if not apps:
        fail("请至少上传一份申请材料", "VALIDATION", 400)
    if len(apps) > 50:
        fail("单次最多核实 50 份申请", "VALIDATION", 400)
    report = verify_applications(conds, quota, apps)
    return ok(report, "核实完成")


@app.post("/api/office/extract-fields")
async def extract_fields(files: list[UploadFile] = File(...)):
    """字段提取：文件（PDF/图片/docx）→ 文本/OCR → LLM 提取关键字段与值。"""
    if not files:
        fail("请至少上传一份文件", "VALIDATION", 400)
    results = []
    for f in files:
        data = await f.read()
        if len(data) > 15 * 1024 * 1024:
            fail(f"{f.filename} 超过 15MB 限制", "VALIDATION", 400)
        try:
            doc = file_to_text(f.filename or "未命名", data)
        except office_ai.AiUnavailable as e:
            fail(str(e), "AI_UNAVAILABLE", 503)
        if not (doc["text"] or "").strip():
            results.append(
                {
                    "name": doc["name"],
                    "source": doc["source"],
                    "text": "",
                    "fields": [],
                    "error": "未能提取到文本（可能是空文件或不可解析的格式）",
                }
            )
            continue
        try:
            fields = office_ai.llm_extract_key_fields(doc["text"])
        except office_ai.AiUnavailable as e:
            fail(str(e), "AI_UNAVAILABLE", 503)
        results.append(
            {
                "name": doc["name"],
                "source": doc["source"],
                "text": doc["text"][:6000],
                "fields": fields,
                "error": "",
            }
        )
    return ok({"files": results}, "提取完成")


@app.post("/api/office/preview")
async def office_preview(file: UploadFile = File(...)):
    """文件预览：pdf/图片返回渲染类型（前端用 blob 原生渲染），docx 返回文本或内嵌图片。"""
    data = await file.read()
    if len(data) > 20 * 1024 * 1024:
        fail("文件超过 20MB，无法预览", "VALIDATION", 400)
    result = preview_document(file.filename or "未命名", data)
    return ok(result)


@app.post("/api/office/build-rule")
async def build_rule(files: list[UploadFile] = File(...)):
    """上传规则文档（Word/PDF/图片等），AI 分析生成核查规则 JSON。"""
    if not files:
        fail("请上传复核通知、档案管理办法、核对表等规则文档", "VALIDATION", 400)
    if len(files) > 10:
        fail("单次最多上传 10 份规则文档", "VALIDATION", 400)
    texts, names, metas = [], [], []
    for f in files:
        data = await f.read()
        if len(data) > 15 * 1024 * 1024:
            fail(f"{f.filename} 超过 15MB 限制", "VALIDATION", 400)
        try:
            doc = file_to_text(f.filename or "未命名", data)
        except office_ai.AiUnavailable as e:
            fail(str(e), "AI_UNAVAILABLE", 503)
        texts.append(doc["text"] or "")
        names.append(doc["name"])
        metas.append({"name": doc["name"], "source": doc["source"], "chars": len(doc["text"] or "")})
    if not any(t.strip() for t in texts):
        fail("未能从文档中提取到文字内容", "VALIDATION", 400)
    try:
        rule = office_ai.llm_build_rule(texts, names)
    except office_ai.AiUnavailable as e:
        fail(str(e), "AI_UNAVAILABLE", 503)
    if not rule.get("labels"):
        fail("未能从文档中识别出可核查字段，请确认文档内容", "AI_NO_RULE", 422)
    return ok({"docs": metas, "rule": rule}, "规则生成完成")


@app.post("/api/office/verify-match")
async def verify_match(
    files: list[UploadFile] = File(...),
    rule_file: UploadFile = File(...),
):
    """文件核查匹配：规则文件（compare_config + anchor）+ 待核查文件。

    流水线：文件 → 文本（PDF 解析 / 扫描件 OCR / 图片 OCR）→ LLM 按规则 labels 提取字段 → 规则匹配。
    """
    rule_raw = await rule_file.read()
    try:
        rule = json.loads(rule_raw.decode("utf-8", errors="ignore"))
    except json.JSONDecodeError:
        fail("规则文件不是合法 JSON", "VALIDATION", 400)
    rules = rule.get("rules") or []
    combinator = (rule.get("combinator") or "and").lower()
    labels = []
    for r in rules:
        for l in r.get("labels", []):
            if l not in labels:
                labels.append(l)
    if not labels:
        fail("规则文件中未定义 labels", "VALIDATION", 400)
    anchor = rule.get("anchor") or {}
    if not isinstance(anchor, dict):
        anchor = {}

    if not files:
        fail("请上传待核查文件", "VALIDATION", 400)
    if len(files) > 20:
        fail("单次最多核查 20 份文件", "VALIDATION", 400)

    sem = asyncio.Semaphore(3)

    async def process_one(f):
        async with sem:
            data = await f.read()
            if len(data) > 15 * 1024 * 1024:
                return {"error": f"{f.filename} 超过 15MB 限制"}
            try:
                doc = await asyncio.to_thread(file_to_text, f.filename or "未命名", data)
            except office_ai.AiUnavailable as e:
                return {"error": str(e), "ai": True}
            extracted = {}
            if (doc["text"] or "").strip():
                try:
                    extracted = await asyncio.to_thread(office_ai.llm_extract_fields, doc["text"], labels)
                except office_ai.AiUnavailable as e:
                    return {"error": str(e), "ai": True}
            return {"name": doc["name"], "source": doc["source"], "text_len": len(doc["text"] or ""), "values": extracted}

    gathered = await asyncio.gather(*(process_one(f) for f in files))
    for g in gathered:
        if isinstance(g, dict) and g.get("error"):
            fail(g["error"], "AI_UNAVAILABLE" if g.get("ai") else "VALIDATION", 503 if g.get("ai") else 400)
    results = gathered

    if not anchor:
        for r in results:
            if any(r["values"].get(l) for l in labels):
                anchor = {l: r["values"].get(l, "") for l in labels}
                break

    def norm(s):
        return re.sub(r"\s+", "", str(s or "")).lower()

    def match_type_of(label):
        for r in rules:
            if label in r.get("labels", []):
                return r.get("match_type", "equal")
        return "equal"

    # 第一遍：字符串级快速判定；字面不相等的收集起来，稍后一次性批量语义判定
    file_checks = []
    all_pending = []
    for r in results:
        checks = []
        for l in labels:
            expected = str(anchor.get(l, "")).strip()
            actual = str(r["values"].get(l, "")).strip()
            if not expected:
                verdict = "skip"
            elif not actual:
                verdict = "missing"
            elif norm(expected) == norm(actual):
                verdict = "pass"
            elif match_type_of(l) == "contains":
                verdict = "pass" if (expected in actual or actual in expected) else "fail"
            else:
                verdict = "semantic"
                all_pending.append({"name": r["name"], "label": l, "expected": expected, "actual": actual})
            checks.append({"label": l, "expected": expected, "actual": actual, "verdict": verdict})
        file_checks.append(checks)

    if all_pending:
        try:
            judged = await asyncio.to_thread(office_ai.llm_judge_values, all_pending)
        except office_ai.AiUnavailable as e:
            fail(str(e), "AI_UNAVAILABLE", 503)
        for r, checks in zip(results, file_checks):
            for c in checks:
                if c["verdict"] == "semantic":
                    j = judged.get(f"{r['name']}||{c['label']}", judged.get(c["label"]))
                    c["verdict"] = j if j in ("pass", "fail") else "fail"

    verdicts = []
    for r, checks in zip(results, file_checks):
        valid = [c for c in checks if c["verdict"] != "skip"]
        fails = [c for c in valid if c["verdict"] == "fail"]
        passes = [c for c in valid if c["verdict"] == "pass"]
        # 判定原则：没有明确的不一致即通过；未提及（missing）不否决，留人工参考
        if combinator == "or":
            passed = bool(passes) or not fails
        else:
            passed = not fails
        verdicts.append(
            {
                "name": r["name"],
                "source": r["source"],
                "checks": checks,
                "passed": passed,
                "pass_count": len(passes),
                "missing_count": len([c for c in valid if c["verdict"] == "missing"]),
                "fail_count": len(fails),
                "total": len(valid),
            }
        )
    passed_n = sum(1 for v in verdicts if v["passed"])
    return ok(
        {
            "labels": labels,
            "combinator": combinator,
            "anchor": anchor,
            "results": verdicts,
            "summary": {
                "total": len(verdicts),
                "passed": passed_n,
                "failed": len(verdicts) - passed_n,
                "rate": round(passed_n / len(verdicts) * 100) if verdicts else 0,
            },
        },
        "核查完成",
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

DEMO_PROFILES = [
    {"user_id": 2, "nickname": "乐乐", "animal_type": "海豚", "mbti": "ENFP",
     "interests": ["运动", "夜跑", "游戏"], "active_time": "夜猫", "college": "计算机学院"},
    {"user_id": 3, "nickname": "小鹿", "animal_type": "猫猫", "mbti": "INTJ",
     "interests": ["考研", "自习", "阅读"], "active_time": "早鸟", "college": "文学院"},
    {"user_id": 4, "nickname": "阿柯", "animal_type": "柯基", "mbti": "ESFP",
     "interests": ["吃饭", "运动", "摄影"], "active_time": "全天", "college": "体育学院"},
    {"user_id": 5, "nickname": "茶狐", "animal_type": "狐狸", "mbti": "INTP",
     "interests": ["自习", "桌游", "科技"], "active_time": "夜猫", "college": "数学学院"},
    {"user_id": 6, "nickname": "獭獭", "animal_type": "水獭", "mbti": "ISTJ",
     "interests": ["观展", "阅读", "历史"], "active_time": "早鸟", "college": "历史文化与旅游学院"},
    {"user_id": 7, "nickname": "小满", "animal_type": "仓鼠", "mbti": "INFP",
     "interests": ["自习", "咖啡", "拍照"], "active_time": "下午", "college": "教育科学学院"},
    {"user_id": 8, "nickname": "阿梨", "animal_type": "柯基", "mbti": "ENFP",
     "interests": ["运动", "音乐", "电影"], "active_time": "晚上", "college": "外国语学院"},
    {"user_id": 9, "nickname": "鹿鸣", "animal_type": "猫猫", "mbti": "INFJ",
     "interests": ["阅读", "写作", "展览"], "active_time": "夜猫", "college": "文学院"},
    {"user_id": 10, "nickname": "一川", "animal_type": "海豚", "mbti": "ESTP",
     "interests": ["跑步", "篮球", "出游"], "active_time": "全天", "college": "体育学院"},
    {"user_id": 11, "nickname": "苏苏", "animal_type": "狐狸", "mbti": "ISFP",
     "interests": ["摄影", "绘画", "看展"], "active_time": "下午", "college": "美术学院"},
    {"user_id": 12, "nickname": "小北", "animal_type": "刺猬", "mbti": "ISTJ",
     "interests": ["自习", "考研", "编程"], "active_time": "上午", "college": "数学学院"},
    {"user_id": 13, "nickname": "阿沐", "animal_type": "水獭", "mbti": "ENTP",
     "interests": ["桌游", "旅行", "美食"], "active_time": "晚上", "college": "商学院"},
    {"user_id": 14, "nickname": "南枝", "animal_type": "鹅", "mbti": "ISFJ",
     "interests": ["博物馆", "读书", "散步"], "active_time": "下午", "college": "历史文化与旅游学院"},
    {"user_id": 15, "nickname": "晚风", "animal_type": "猫猫", "mbti": "ENFJ",
     "interests": ["音乐", "唱歌", "吉他"], "active_time": "夜猫", "college": "音乐学院"},
    {"user_id": 16, "nickname": "青禾", "animal_type": "仓鼠", "mbti": "INTP",
     "interests": ["编程", "自习", "科幻"], "active_time": "晚上", "college": "物理与电子工程学院"},
    {"user_id": 17, "nickname": "迟夏", "animal_type": "海豚", "mbti": "ESFJ",
     "interests": ["英语", "咖啡", "电影"], "active_time": "下午", "college": "外国语学院"},
    {"user_id": 18, "nickname": "木木", "animal_type": "狐狸", "mbti": "ISFP",
     "interests": ["手作", "看展", "散步"], "active_time": "全天", "college": "美术学院"},
]

DEMO_POSTS = [
    {"user_id": 2, "type": "运动", "title": "今晚 21:00 牛山夜跑 5 公里", "content": "配速 6 分左右，跑完一起拉伸。", "time_text": "每天 21:00", "place": "牛山运动场"},
    {"user_id": 3, "type": "考研", "title": "408 数据结构刷题搭子", "content": "每周三、周五图书馆三楼，目标 130+，互相监督。", "time_text": "周三/周五 19:00", "place": "图书馆"},
    {"user_id": 4, "type": "饭搭子", "title": "中午七食堂新窗口拼桌", "content": "人多好拼桌，顺便测评新窗口。", "time_text": "周二 12:00", "place": "七食堂"},
    {"user_id": 5, "type": "自习", "title": "夜猫子自习搭子（21:00 后）", "content": "我习惯晚上学，找个安静的搭子互相占座提醒。", "time_text": "每天 21:00-23:00", "place": "图书馆"},
    {"user_id": 6, "type": "观展", "title": "周末校史馆+艺术展一起看", "content": "慢慢看慢慢聊，顺便拍照。", "time_text": "周日 10:00", "place": "校史馆"},
    {"user_id": 7, "type": "自习", "title": "午后图书馆四楼自习搭子", "content": "互相提醒专注，中间一起去买咖啡。", "time_text": "每天 14:00", "place": "图书馆四楼"},
    {"user_id": 8, "type": "运动", "title": "周三晚操场慢跑", "content": "轻松跑 3 公里，跑完一起拉伸。", "time_text": "周三 19:30", "place": "田径场"},
    {"user_id": 9, "type": "观展", "title": "周五晚校园艺术展", "content": "想找个人一起慢慢看，交流感受。", "time_text": "周五 19:00", "place": "美术馆"},
    {"user_id": 10, "type": "出游", "title": "周末云龙山徒步", "content": "轻装徒步，下午返回，注意防晒。", "time_text": "周六 09:00", "place": "云龙山"},
    {"user_id": 11, "type": "其他", "title": "校园秋景拍照搭子", "content": "互拍人像和风景，手机相机都可以。", "time_text": "周日下午", "place": "泉山校区"},
    {"user_id": 12, "type": "自习", "title": "考研数学早自习", "content": "早上图书馆集合，刷题到中午。", "time_text": "每天 08:00", "place": "图书馆"},
    {"user_id": 13, "type": "饭搭子", "title": "周五晚桌游+夜宵", "content": "玩两局轻松桌游，结束后一起去夜宵。", "time_text": "周五 20:00", "place": "学生活动中心"},
    {"user_id": 14, "type": "出游", "title": "博物馆志愿讲解搭子", "content": "周末去徐州博物馆，顺便练习讲解。", "time_text": "周六 14:00", "place": "徐州博物馆"},
    {"user_id": 15, "type": "其他", "title": "草坪吉他弹唱搭子", "content": "会一点吉他，想找人一起唱歌。", "time_text": "周四 20:00", "place": "音乐厅草坪"},
    {"user_id": 16, "type": "自习", "title": "晚自习代码搭子", "content": "写项目或刷算法都可以，安静互相监督。", "time_text": "每天 19:00", "place": "理科楼"},
    {"user_id": 17, "type": "饭搭子", "title": "英语角后一起吃饭", "content": "练完口语顺路去六食堂。", "time_text": "周二 18:00", "place": "六食堂"},
    {"user_id": 18, "type": "观展", "title": "周末手作市集", "content": "逛市集、做小手工，欢迎一起。", "time_text": "周日 10:00", "place": "创意街区"},
]


def ensure_buddy_demo(db: Session):
    # 演示档案（用户完成测试后会覆盖）
    me = db.query(BuddyProfile).filter(BuddyProfile.user_id == 1).first()
    if not me:
        db.add(BuddyProfile(
            user_id=1, nickname="师大同学", animal_type="猫猫", mbti="INTJ",
            interests=json.dumps(["考研", "自习", "阅读"], ensure_ascii=False),
            active_time="夜猫", college="人工智能与计算机学院", visibility="public",
        ))
        db.commit()
    if db.query(BuddyProfile).filter(BuddyProfile.user_id != 1).count() >= len(DEMO_PROFILES):
        return
    for item in DEMO_PROFILES:
        exists = db.query(BuddyProfile).filter(BuddyProfile.user_id == item["user_id"]).first()
        if exists:
            continue
        db.add(BuddyProfile(
            user_id=item["user_id"], nickname=item["nickname"], animal_type=item["animal_type"],
            mbti=item["mbti"], interests=json.dumps(item["interests"], ensure_ascii=False),
            active_time=item["active_time"], college=item["college"], visibility="public",
        ))
    for item in DEMO_POSTS:
        exists = db.query(BuddyPost).filter(BuddyPost.title == item["title"]).first()
        if exists:
            continue
        db.add(BuddyPost(
            user_id=item["user_id"], type=item["type"], title=item["title"],
            content=item["content"], time_text=item["time_text"], place=item["place"],
            campus="泉山校区", contact="站内私信",
        ))
    db.commit()


def profile_to_dict(p: BuddyProfile) -> dict:
    return {
        "user_id": p.user_id,
        "nickname": p.nickname,
        "animal_type": p.animal_type,
        "animal_emoji": {"柯基": "🐕", "猫猫": "🐈", "海豚": "🐬", "刺猬": "🦔", "仓鼠": "🐹", "狐狸": "🦊", "鹅": "🦢", "水獭": "🦦"}.get(p.animal_type, "🐾"),
        "mbti": p.mbti,
        "interests": json.loads(p.interests or "[]"),
        "active_time": p.active_time,
        "college": p.college,
        "visibility": p.visibility,
        "reading": p.reading,
        "avatar": p.avatar or "",
        "place": p.place or "",
        "results": json.loads(p.results or "{}"),
    }


# ---------- 搭子申请与站内聊天 ----------


def buddy_auto_demo() -> bool:
    """演示开关：默认开启（演示账号自动通过并回应），.env BUDDY_AUTO_DEMO=0 关闭。"""
    return office_ai._cfg("BUDDY_AUTO_DEMO", "1").strip().lower() not in ("0", "false", "off", "no")


@app.post("/api/buddy/apply")
def buddy_apply(payload: dict = Body(...), db: Session = Depends(get_db)):
    post = db.get(BuddyPost, int(payload.get("post_id") or 0))
    if not post or post.status != "open":
        fail("搭子帖不存在或已关闭", "NOT_FOUND", 404)
    if post.user_id == 1:
        fail("不能申请自己的搭子帖", "VALIDATION", 400)
    dup = (
        db.query(BuddyApplication)
        .filter(BuddyApplication.user_id == 1, BuddyApplication.post_id == post.id)
        .first()
    )
    if dup:
        fail("已申请过这个搭子，等待对方处理", "DUPLICATE", 409)
    app_row = BuddyApplication(
        user_id=1,
        post_id=post.id,
        post_owner_id=post.user_id,
        message=(payload.get("message") or "你好，想和你组个搭子！")[:500],
        status="pending",
    )
    db.add(app_row)
    db.commit()
    db.refresh(app_row)
    if post.user_id != 1 and buddy_auto_demo():
        app_row.auto_accept_at = (datetime.now() + timedelta(seconds=20)).strftime("%Y-%m-%d %H:%M:%S")
        db.commit()
    message = "邀请已发送，对方正在查看，稍后刷新即可看到结果" if app_row.auto_accept_at else "邀请已发送，等待对方处理"
    return ok({"id": app_row.id, "status": app_row.status, "post_title": post.title}, message)


def settle_auto_accept(db: Session) -> None:
    """演示模式：申请超过 20 秒仍未处理时，演示账号自动通过并打招呼。"""
    if not buddy_auto_demo():
        return
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    rows = (
        db.query(BuddyApplication)
        .filter(
            BuddyApplication.status == "pending",
            BuddyApplication.auto_accept_at != "",
            BuddyApplication.auto_accept_at <= now_str,
        )
        .all()
    )
    if not rows:
        return
    for r in rows:
        r.status = "accepted"
        post = db.get(BuddyPost, r.post_id)
        if post:
            db.add(
                BuddyChat(
                    application_id=r.id,
                    from_user_id=r.post_owner_id,
                    to_user_id=1,
                    content=f"你好呀！看到你的申请啦，我也正想找{post.type}搭子——{post.time_text}在{post.place}，不见不散！",
                )
            )
    db.commit()


@app.get("/api/buddy/applications")
def my_buddy_applications(db: Session = Depends(get_db)):
    settle_auto_accept(db)
    rows = (
        db.query(BuddyApplication)
        .filter((BuddyApplication.user_id == 1) | (BuddyApplication.post_owner_id == 1))
        .order_by(BuddyApplication.id.desc())
        .all()
    )
    profiles = {p.user_id: p for p in db.query(BuddyProfile).all()}
    out = []
    for r in rows:
        post = db.get(BuddyPost, r.post_id)
        peer_id = r.post_owner_id if r.user_id == 1 else r.user_id
        peer = profiles.get(peer_id)
        unread = (
            db.query(BuddyChat)
            .filter(
                BuddyChat.application_id == r.id,
                BuddyChat.from_user_id == peer_id,
                BuddyChat.to_user_id == 1,
                BuddyChat.is_read == 0,
            )
            .count()
        )
        out.append(
            {
                "id": r.id,
                "role": "owner" if r.post_owner_id == 1 else "applicant",
                "post_id": r.post_id,
                "post_title": post.title if post else "（帖子已删除）",
                "post_type": post.type if post else "",
                "peer_id": peer_id,
                "peer_nickname": peer.nickname if peer else "师大同学",
                "peer_animal": peer.animal_type if peer else "",
                "peer_mbti": peer.mbti if peer else "",
                "peer_emoji": {"柯基": "🐕", "猫猫": "🐈", "海豚": "🐬", "刺猬": "🦔", "仓鼠": "🐹", "狐狸": "🦊", "鹅": "🦢", "水獭": "🦦"}.get(peer.animal_type if peer else "", "🐾"),
                "message": r.message,
                "status": r.status,
                "status_label": {"pending": "等待处理", "accepted": "已通过", "rejected": "已婉拒", "cancelled": "已取消"}.get(r.status, r.status),
                "unread": unread,
                "created_at": r.created_at,
            }
        )
    return ok(out)


@app.post("/api/buddy/applications/{app_id}/accept")
def accept_application(app_id: int, db: Session = Depends(get_db)):
    r = db.get(BuddyApplication, app_id)
    if not r:
        fail("申请不存在", "NOT_FOUND", 404)
    if r.post_owner_id != 1:
        fail("只能处理发给你的申请", "FORBIDDEN", 403)
    r.status = "accepted"
    db.add(BuddyChat(application_id=r.id, from_user_id=1, to_user_id=r.user_id, content="通过啦！具体时间地点可以在这里聊～"))
    db.commit()
    return ok({"id": r.id, "status": r.status}, "已通过申请")


@app.post("/api/buddy/applications/{app_id}/cancel")
def cancel_application(app_id: int, db: Session = Depends(get_db)):
    r = db.get(BuddyApplication, app_id)
    if not r:
        fail("申请不存在", "NOT_FOUND", 404)
    if r.user_id != 1:
        fail("只能取消自己发出的申请", "FORBIDDEN", 403)
    if r.status != "pending":
        fail("只有等待处理中的申请可以取消", "VALIDATION", 400)
    r.status = "cancelled"
    db.commit()
    return ok({"id": r.id, "status": r.status}, "已取消申请")


@app.post("/api/buddy/applications/{app_id}/reject")
def reject_application(app_id: int, db: Session = Depends(get_db)):
    r = db.get(BuddyApplication, app_id)
    if not r:
        fail("申请不存在", "NOT_FOUND", 404)
    if r.post_owner_id != 1:
        fail("只能处理发给你的申请", "FORBIDDEN", 403)
    r.status = "rejected"
    db.commit()
    return ok({"id": r.id, "status": r.status}, "已婉拒")


def _deliver_due_buddy_replies(db: Session, application_id=None) -> int:
    """把到点的演示自动回复落成聊天记录（读取时触发，无需后台调度器）。"""
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    q = db.query(BuddyAutoReply).filter(BuddyAutoReply.due_at <= now)
    if application_id:
        q = q.filter(BuddyAutoReply.application_id == application_id)
    rows = q.all()
    for row in rows:
        db.add(
            BuddyChat(
                application_id=row.application_id,
                from_user_id=row.from_user_id,
                to_user_id=row.to_user_id,
                content=row.content,
                created_at=row.due_at,
            )
        )
        db.delete(row)
    if rows:
        db.commit()
    return len(rows)


@app.get("/api/buddy/chat/{application_id}")
def get_chat(application_id: int, db: Session = Depends(get_db)):
    _deliver_due_buddy_replies(db, application_id)
    r = db.get(BuddyApplication, application_id)
    if not r:
        fail("会话不存在", "NOT_FOUND", 404)
    if r.user_id != 1 and r.post_owner_id != 1:
        fail("无权查看该会话", "FORBIDDEN", 403)
    peer_id = r.post_owner_id if r.user_id == 1 else r.user_id
    peer = db.query(BuddyProfile).filter(BuddyProfile.user_id == peer_id).first()
    rows = (
        db.query(BuddyChat)
        .filter(BuddyChat.application_id == application_id)
        .order_by(BuddyChat.id)
        .all()
    )
    return ok(
        {
            "application_id": application_id,
            "peer": {
                "id": peer_id,
                "nickname": peer.nickname if peer else "师大同学",
                "emoji": {"柯基": "🐕", "猫猫": "🐈", "海豚": "🐬", "刺猬": "🦔", "仓鼠": "🐹", "狐狸": "🦊", "鹅": "🦢", "水獭": "🦦"}.get(peer.animal_type if peer else "", "🐾"),
                "mbti": peer.mbti if peer else "",
            },
            "messages": [
                {
                    "id": c.id,
                    "from_me": c.from_user_id == 1,
                    "content": c.content,
                    "created_at": c.created_at,
                }
                for c in rows
            ],
        }
    )


def _buddy_local_reply(content: str) -> str:
    """本地多样化回复池：AI 不可用时也能保证不重复同一句话。"""
    short = ["收到～", "好呀好呀", "嗯嗯我在的", "在的在的，你说", "看到啦", "好嘞，等一下回你"]
    time = [
        "我时间还挺灵活的，你看几点方便？",
        "晚上七点后我都可以，地点你定",
        "明天下午有空，图书馆或者食堂都行",
        "我一般会早到几分钟，到时候提前说一声",
        "这个时间可以，我记一下",
        "周中稍微忙一点，周末更稳",
    ]
    question = [
        "可以呀，你更想约在图书馆还是食堂？",
        "没问题，我看下日程再和你确认",
        "行，我大概率没问题，晚点给你准信",
        "应该可以，具体几点你定就好",
        "好呀，那到时候提前十分钟碰面？",
        "我先确认一下，尽快回复你",
    ]
    general = [
        "好呀，那我们到时候见",
        "可以可以，听起来不错",
        "没问题，细节我们再对一下",
        "好嘞，我先准备一下",
        "行，我也正想找人一起",
        "收到，期待见面",
        "可以呀，保持联系",
    ]
    text = str(content or "").strip()
    if len(text) <= 4:
        pool = short
    elif any(k in text for k in ["几点", "什么时候", "时间", "周", "明天", "今天", "地点", "哪里", "哪"]):
        pool = time
    elif "?" in text or "？" in text or "吗" in text or "呢" in text:
        pool = question
    else:
        pool = general
    return random.choice(pool)


@app.post("/api/buddy/chat/{application_id}")
def send_chat(application_id: int, payload: dict = Body(...), db: Session = Depends(get_db)):
    r = db.get(BuddyApplication, application_id)
    if not r:
        fail("会话不存在", "NOT_FOUND", 404)
    if r.user_id != 1 and r.post_owner_id != 1:
        fail("无权在该会话发言", "FORBIDDEN", 403)
    content = (payload.get("content") or "").strip()
    if not content:
        fail("消息不能为空", "VALIDATION", 400)
    peer_id = r.post_owner_id if r.user_id == 1 else r.user_id
    db.add(BuddyChat(application_id=application_id, from_user_id=1, to_user_id=peer_id, content=content[:1000]))
    db.commit()
    # 演示模式下对方统一 10 秒后回复；优先让模型生成多样化回复，失败则用本地回复池
    if peer_id != 1 and buddy_auto_demo():
        scheduled_at = datetime.now() + timedelta(seconds=10)
        auto = ""
        try:
            from concurrent.futures import ThreadPoolExecutor

            pool = ThreadPoolExecutor(max_workers=1)
            fut = pool.submit(office_ai.llm_buddy_reply, content)
            auto = (fut.result(timeout=8) or "").strip()
            pool.shutdown(wait=False)
        except Exception:
            auto = ""
        if not auto:
            auto = _buddy_local_reply(content)
        db.add(
            BuddyAutoReply(
                application_id=application_id,
                from_user_id=peer_id,
                to_user_id=1,
                content=auto[:120],
                due_at=scheduled_at.strftime("%Y-%m-%d %H:%M:%S"),
            )
        )
        db.commit()
    count = db.query(BuddyChat).filter(BuddyChat.application_id == application_id).count()
    return ok({"count": count}, "已发送")


@app.post("/api/buddy/chat/{application_id}/read")
def mark_chat_read(application_id: int, db: Session = Depends(get_db)):
    """把发给当前用户（user_id=1）的消息标记为已读，用于清除未读红点。"""
    r = db.get(BuddyApplication, application_id)
    if not r:
        fail("会话不存在", "NOT_FOUND", 404)
    if r.user_id != 1 and r.post_owner_id != 1:
        fail("无权操作该会话", "FORBIDDEN", 403)
    n = (
        db.query(BuddyChat)
        .filter(BuddyChat.application_id == application_id, BuddyChat.to_user_id == 1, BuddyChat.is_read == 0)
        .update({BuddyChat.is_read: 1}, synchronize_session=False)
    )
    db.commit()
    return ok({"read": n}, "已读")


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


@app.get("/api/buddy/nearby")
def buddy_nearby(db: Session = Depends(get_db)):
    """附近的同学：同校区（当前数据均为泉山）+ 公开档案；同学院优先展示。"""
    ensure_buddy_demo(db)
    my = db.query(BuddyProfile).filter(BuddyProfile.user_id == 1).first()
    known = set()
    for chat in db.query(BuddyChat).filter((BuddyChat.from_user_id == 1) | (BuddyChat.to_user_id == 1)).all():
        known.add(chat.to_user_id if chat.from_user_id == 1 else chat.from_user_id)
    for app in db.query(BuddyApplication).filter((BuddyApplication.user_id == 1) | (BuddyApplication.post_owner_id == 1)).all():
        known.add(app.post_owner_id if app.user_id == 1 else app.user_id)
    known.discard(1)
    rows = [
        p
        for p in db.query(BuddyProfile)
        .filter(BuddyProfile.user_id != 1, BuddyProfile.visibility == "public")
        .all()
        if p.user_id not in known
    ]
    out = []
    for p in rows:
        post = (
            db.query(BuddyPost)
            .filter(BuddyPost.user_id == p.user_id, BuddyPost.status.in_(["open", "recruiting"]))
            .order_by(BuddyPost.id.desc())
            .first()
        )
        place_name = p.place or (post.place if post else "") or "泉山校区"
        place_row = None
        if place_name and place_name != "泉山校区":
            place_row = db.query(Place).filter(Place.name.like(f"%{place_name}%")).first()
        out.append({
            "user_id": p.user_id,
            "profile": profile_to_dict(p),
            "post": {"id": post.id, "type": post.type, "title": post.title, "time": post.time_text, "place": post.place} if post else None,
            "same_college": bool(my and my.college and my.college == p.college),
            "place": place_name,
            "lat": place_row.lat if place_row else None,
            "lng": place_row.lng if place_row else None,
        })
    out.sort(key=lambda x: (not x["same_college"], x["user_id"]))
    return ok(out)


@app.get("/api/buddy/test")
def buddy_test_meta():
    return ok({
        "animal_questions": ANIMAL_QUESTIONS,
        "mbti_questions": MBTI_QUESTIONS,
        "survival_questions": SURVIVAL_QUESTIONS,
        "battery_questions": BATTERY_QUESTIONS,
    })


@app.get("/api/buddy/profile")
def my_buddy_profile(db: Session = Depends(get_db)):
    ensure_buddy_demo(db)
    p = db.query(BuddyProfile).filter(BuddyProfile.user_id == 1).first()
    return ok(profile_to_dict(p) if p else None)


@app.post("/api/buddy/test/submit")
def buddy_test_submit(payload: dict = Body(...), db: Session = Depends(get_db)):
    kind = payload.get("kind")
    answers = payload.get("answers") or []
    if kind == "animal":
        result = score_animal(answers)
        digest = f"动物人格：{result['animal']}（{result['label']}），标签：{'、'.join(result['tags'])}"
    elif kind == "mbti":
        result = score_mbti(answers)
        digest = f"MBTI：{result['mbti']}，维度百分比：{result['dims']}"
    elif kind == "survival":
        result = score_survival(answers)
        digest = f"校园生存人格：{result['type']}（{result['label']}），标签：{'、'.join(result['tags'])}"
    elif kind == "battery":
        result = score_battery(answers)
        digest = f"社交电量：{result['type']}，电量 {result['pct']}%"
    else:
        fail("未知测试类型", "VALIDATION", 400)
    # 解读用本地模板即时生成，避免演示时等待模型网关（模型仍用于匹配理由）
    reading = reading_template(kind, result)
    p = db.query(BuddyProfile).filter(BuddyProfile.user_id == 1).first()
    if not p:
        p = BuddyProfile(user_id=1, nickname="师大同学")
        db.add(p)
    if kind == "animal":
        p.animal_type = result["animal"]
    elif kind == "mbti":
        p.mbti = result["mbti"]
    stored = {}
    try:
        stored = json.loads(p.results or "{}")
    except (TypeError, ValueError):
        stored = {}
    stored[kind] = result
    p.results = json.dumps(stored, ensure_ascii=False)
    p.reading = reading
    p.updated_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    db.commit()
    db.refresh(p)
    return ok({**profile_to_dict(p), "result": result}, "测试完成")


@app.post("/api/buddy/profile")
def update_buddy_profile(payload: dict = Body(...), db: Session = Depends(get_db)):
    p = db.query(BuddyProfile).filter(BuddyProfile.user_id == 1).first()
    if not p:
        p = BuddyProfile(user_id=1, nickname="师大同学")
        db.add(p)
    if "nickname" in payload:
        p.nickname = (payload.get("nickname") or "")[:32]
    if "interests" in payload and isinstance(payload.get("interests"), list):
        p.interests = json.dumps(payload["interests"][:8], ensure_ascii=False)
    if payload.get("active_time") in ("早鸟", "夜猫", "全天"):
        p.active_time = payload["active_time"]
    if payload.get("visibility") in ("public", "campus", "hidden"):
        p.visibility = payload["visibility"]
    if "avatar" in payload:
        p.avatar = (payload.get("avatar") or "")[:64]
    if "place" in payload:
        p.place = (payload.get("place") or "")[:64]
    db.commit()
    db.refresh(p)
    return ok(profile_to_dict(p), "已更新")


def compat_score(my_p, other_p, other_post_type: str) -> int:
    """匹配分（本地可解释）：MBTI 相容 40 + 标签重合 25 + 同校区 15 + 时段 20。"""
    if not my_p or not other_p:
        return 60
    score = mbti_compat(my_p.mbti, other_p.mbti) * 0.4
    my_int = set(json.loads(my_p.interests or "[]"))
    other_int = set(json.loads(other_p.interests or "[]"))
    inter = len(my_int & other_int)
    score += min(25, inter * 12 + 5 if inter else 5)
    score += 15  # 演示环境均在泉山校区
    if my_p.active_time == other_p.active_time:
        score += 20
    elif "全天" in (my_p.active_time, other_p.active_time):
        score += 14
    return int(min(100, score))


@app.get("/api/buddy/matches")
def buddy_matches(offset: int = Query(default=0, ge=0), db: Session = Depends(get_db)):
    """匹配推荐。AI 理由按 (user, matched_user, post) 缓存在 buddy_match_logs，避免每次进页重调 LLM。"""
    ensure_buddy_demo(db)
    my_p = db.query(BuddyProfile).filter(BuddyProfile.user_id == 1).first()
    others = db.query(BuddyProfile).filter(BuddyProfile.user_id != 1, BuddyProfile.visibility == "public").all()
    logs = {
        (l.matched_user_id, l.post_id): l
        for l in db.query(BuddyMatchLog).filter(BuddyMatchLog.user_id == 1).all()
    }
    out = []
    for op in others:
        posts = db.query(BuddyPost).filter(BuddyPost.user_id == op.user_id, BuddyPost.status == "open").all()
        if not posts:
            continue
        post = posts[0]
        score = compat_score(my_p, op, post.type)
        shared = {
            "同校区": "泉山校区",
            "时段": my_p.active_time if my_p and my_p.active_time == op.active_time else "",
            "共同兴趣": list(set(json.loads(my_p.interests or "[]")) & set(json.loads(op.interests or "[]"))) if my_p else [],
            "MBTI 组合": f"{my_p.mbti if my_p else ''} × {op.mbti}",
        }
        cached = logs.get((op.user_id, post.id))
        reason = cached.reason if cached and cached.reason else ""
        if not reason:
            try:
                if my_p:
                    reason = office_ai.llm_match_reason(
                        {k: profile_to_dict(my_p)[k] for k in ("animal_type", "mbti", "interests", "active_time")},
                        {k: profile_to_dict(op)[k] for k in ("animal_type", "mbti", "interests", "active_time")},
                        shared,
                    )
            except office_ai.AiUnavailable:
                reason = ""
            if not reason:
                reason = f"MBTI {shared['MBTI 组合']} · 都在泉山校区" + (f" · 都爱{'、'.join(shared['共同兴趣'][:2])}" if shared["共同兴趣"] else "")
            db.add(BuddyMatchLog(user_id=1, matched_user_id=op.user_id, post_id=post.id, score=score, reason=reason))
            db.commit()
        out.append({
            "user_id": op.user_id,
            "profile": profile_to_dict(op),
            "post": {"id": post.id, "type": post.type, "title": post.title, "time": post.time_text, "place": post.place},
            "score": score,
            "reason": reason,
        })
    out.sort(key=lambda x: x["score"], reverse=True)
    rotated = out[offset:] + out[:offset] if out else out
    return ok(rotated[:12])


@app.post("/api/buddy/profile/visibility")
def buddy_visibility(payload: dict = Body(...), db: Session = Depends(get_db)):
    p = db.query(BuddyProfile).filter(BuddyProfile.user_id == 1).first()
    if not p:
        fail("还没有性格档案，请先完成测试", "NOT_FOUND", 404)
    v = payload.get("visibility")
    if v not in ("public", "campus", "hidden"):
        fail("可见性取值不合法", "VALIDATION", 400)
    p.visibility = v
    db.commit()
    return ok({"visibility": v}, "已更新可见性")


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


@app.get("/api/buddy/posts")
def buddy_posts(type: str = Query(default=""), db: Session = Depends(get_db)):
    query = db.query(BuddyPost).filter(BuddyPost.status != "removed")
    if type:
        query = query.filter(BuddyPost.type == type)
    rows = query.order_by(BuddyPost.id.desc()).all()
    profiles = {p.user_id: p for p in db.query(BuddyProfile).all()}
    return ok(
        [
            {
                "id": p.id,
                "type": p.type,
                "title": p.title,
                "content": p.content,
                "time": p.time_text,
                "place": p.place,
                "campus": p.campus,
                "contact": p.contact,
                "status": p.status,
                "created_at": p.created_at,
                "author": (
                    {
                        "nickname": profiles[p.user_id].nickname,
                        "animal_type": profiles[p.user_id].animal_type,
                        "mbti": profiles[p.user_id].mbti,
                        "college": profiles[p.user_id].college,
                    }
                    if p.user_id in profiles and profiles[p.user_id].animal_type
                    else None
                ),
            }
            for p in rows
        ]
    )


@app.post("/api/buddy/posts")
def add_buddy(payload: dict = Body(...), db: Session = Depends(get_db)):
    if not payload.get("title"):
        fail("请填写标题")
    post = BuddyPost(
        type=payload.get("type") or "学习",
        title=payload["title"],
        content=payload.get("content", ""),
        time_text=payload.get("time", ""),
        place=payload.get("place", ""),
        campus=payload.get("campus", "泉山校区"),
    )
    db.add(post)
    db.commit()
    db.refresh(post)
    return ok({"id": post.id}, "已发布")


@app.post("/api/buddy/posts/{post_id}/close")
def close_buddy(post_id: int, db: Session = Depends(get_db)):
    post = db.get(BuddyPost, post_id)
    if not post:
        fail("帖子不存在", "RESOURCE_NOT_FOUND", 404)
    post.status = "closed"
    db.commit()
    return ok(None, "已关闭")


@app.post("/api/buddy/posts/{post_id}/report")
def report_buddy(post_id: int, payload: dict = Body(default={}), db: Session = Depends(get_db)):
    post = db.get(BuddyPost, post_id)
    if not post:
        fail("帖子不存在", "RESOURCE_NOT_FOUND", 404)
    post.status = "removed"
    db.commit()
    return ok(None, "已提交举报，内容已下架待管理员复核")


@app.get("/api/deals")
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


@app.post("/api/deals")
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


@app.post("/api/deals/{post_id}/vote")
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


@app.get("/api/purchase-intents")
def intents(db: Session = Depends(get_db)):
    rows = db.query(PurchaseIntent).filter(PurchaseIntent.user_id == 1).order_by(PurchaseIntent.id.desc()).all()
    return ok(
        [{"id": i.id, "name": i.name, "price": i.price_cent / 100, "status": i.status, "created_at": i.created_at, "decided_at": i.decided_at} for i in rows]
    )


@app.post("/api/purchase-intents")
def add_intent(payload: dict = Body(...), db: Session = Depends(get_db)):
    if not payload.get("name"):
        fail("请填写商品名")
    price = int(float(payload.get("price") or 0) * 100)
    row = PurchaseIntent(name=payload["name"], price_cent=price, status="pending")
    db.add(row)
    db.commit()
    db.refresh(row)
    return ok({"id": row.id}, "已记录")


@app.patch("/api/purchase-intents/{intent_id}")
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


@app.get("/api/savings/summary")
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


@app.get("/api/self/plans")
def plans(db: Session = Depends(get_db)):
    rows = db.query(StudyPlan).filter(StudyPlan.user_id == 1).order_by(StudyPlan.id.desc()).all()
    result = []
    for p in rows:
        items = db.query(PlanItem).filter(PlanItem.plan_id == p.id).order_by(PlanItem.day, PlanItem.start_at).all()
        result.append(
            {
                "id": p.id,
                "title": p.title,
                "start_date": p.start_date,
                "end_date": p.end_date,
                "status": p.status,
                "items": [{"id": i.id, "title": i.title, "day": i.day, "start_at": i.start_at, "end_at": i.end_at, "status": i.status} for i in items],
            }
        )
    return ok(result)


@app.post("/api/self/plans")
def add_plan(payload: dict = Body(...), db: Session = Depends(get_db)):
    if not payload.get("title"):
        fail("请填写计划标题")
    p = StudyPlan(title=payload["title"], start_date=payload.get("start_date", date.today().isoformat()), end_date=payload.get("end_date", date.today().isoformat()))
    db.add(p)
    db.flush()
    for item in payload.get("items", []):
        db.add(PlanItem(plan_id=p.id, title=item.get("title", ""), day=item.get("day", ""), start_at=item.get("start_at", ""), end_at=item.get("end_at", "")))
    db.commit()
    return ok({"id": p.id}, "已创建计划")


@app.patch("/api/self/plan-items/{item_id}")
def update_plan_item(item_id: int, payload: dict = Body(...), db: Session = Depends(get_db)):
    item = db.get(PlanItem, item_id)
    if not item:
        fail("计划项不存在", "RESOURCE_NOT_FOUND", 404)
    if payload.get("status"):
        item.status = payload["status"]
    db.commit()
    return ok(None, "已更新")


@app.get("/api/self/pomodoro/stats")
def pomodoro_stats(db: Session = Depends(get_db)):
    rows = db.query(Pomodoro).filter(Pomodoro.user_id == 1).all()
    done = [p for p in rows if p.status == "done"]
    return ok({"sessions": len(done), "minutes": sum(p.minutes for p in done), "today": date.today().isoformat()})


@app.post("/api/self/pomodoro")
def add_pomodoro(payload: dict = Body(...), db: Session = Depends(get_db)):
    minutes = int(payload.get("minutes") or 25)
    status = payload.get("status", "done")
    p = Pomodoro(task=payload.get("task", "专注"), minutes=minutes, status=status)
    p.started_at = payload.get("started_at") or datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    p.ended_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    db.add(p)
    db.commit()
    if status == "done" and minutes > 20:
        from .self_control import award_capped
        award_capped(db, "focus_done", 2, p.id, daily_cap=10)
        db.commit()
    return ok({"id": p.id}, "已记录")


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


def session_to_dict(db: Session, s: ChatSession) -> dict:
    count = db.query(ChatMessage).filter(ChatMessage.session_id == s.id).count()
    last = (
        db.query(ChatMessage)
        .filter(ChatMessage.session_id == s.id)
        .order_by(ChatMessage.id.desc())
        .first()
    )
    return {
        "id": s.id,
        "title": s.title,
        "created_at": s.created_at,
        "updated_at": s.updated_at,
        "message_count": count,
        "last_message": ((last.content or "")[:42] if last else ""),
    }


@app.get("/api/assistant/tools")
def assistant_tools():
    return ok(
        {
            "builtin": [t["name"] for t in tools.TOOL_SPECS],
            "mcp": tools.mcp_tool_names(),
            "note": "内置通用工具已生效；MCP 工具可通过 backend/mcp_tools.json 登记，未登记时不影响内置能力。",
        }
    )


@app.get("/api/assistant/sessions")
def assistant_sessions(db: Session = Depends(get_db)):
    rows = (
        db.query(ChatSession)
        .filter(ChatSession.user_id == 1)
        .order_by(ChatSession.updated_at.desc(), ChatSession.id.desc())
        .all()
    )
    return ok([session_to_dict(db, s) for s in rows])


@app.post("/api/assistant/sessions")
def create_assistant_session(payload: dict = Body(default={}), db: Session = Depends(get_db)):
    title = (payload.get("title") or "新对话").strip()[:32] or "新对话"
    s = ChatSession(user_id=1, title=title)
    db.add(s)
    db.commit()
    db.refresh(s)
    return ok(session_to_dict(db, s), "已新建对话")


@app.patch("/api/assistant/sessions/{session_id}")
def rename_assistant_session(
    session_id: int, payload: dict = Body(...), db: Session = Depends(get_db)
):
    s = db.get(ChatSession, session_id)
    if not s:
        fail("对话不存在", "RESOURCE_NOT_FOUND", 404)
    title = (payload.get("title") or "").strip()[:32]
    if not title:
        fail("请填写对话名称")
    s.title = title
    s.updated_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    db.commit()
    return ok(session_to_dict(db, s), "已重命名")


@app.delete("/api/assistant/sessions/{session_id}")
def delete_assistant_session(session_id: int, db: Session = Depends(get_db)):
    s = db.get(ChatSession, session_id)
    if not s:
        fail("对话不存在", "RESOURCE_NOT_FOUND", 404)
    db.query(ChatMessage).filter(ChatMessage.session_id == session_id).delete()
    db.delete(s)
    db.commit()
    if db.query(ChatSession).filter(ChatSession.user_id == 1).count() == 0:
        fresh = ChatSession(user_id=1, title="新对话")
        db.add(fresh)
        db.commit()
    return ok(None, "已删除对话")


@app.post("/api/assistant/chat")
def assistant_chat(payload: dict = Body(...), db: Session = Depends(get_db)):
    message = (payload.get("message") or "").strip()
    if not message:
        fail("请输入问题")
    session_id = payload.get("session_id")
    session = db.get(ChatSession, int(session_id)) if session_id else None
    if not session:
        session = (
            db.query(ChatSession)
            .filter(ChatSession.user_id == 1)
            .order_by(ChatSession.updated_at.desc(), ChatSession.id.desc())
            .first()
        )
    if not session:
        session = ChatSession(user_id=1, title="新对话")
        db.add(session)
        db.flush()

    result = assistant_reply(db, message)
    db.add(ChatMessage(user_id=1, session_id=session.id, role="user", content=message))
    db.add(
        ChatMessage(
            user_id=1,
            session_id=session.id,
            role="assistant",
            content=result["reply"],
            meta=json.dumps(result, ensure_ascii=False),
        )
    )
    if session.title in ("新对话", ""):
        session.title = re.sub(r"\s+", " ", message)[:18]
    session.updated_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    db.commit()
    return ok({**result, "session_id": session.id, "session_title": session.title})


@app.get("/api/assistant/messages")
def assistant_messages(
    session_id: int | None = Query(default=None), db: Session = Depends(get_db)
):
    query = db.query(ChatMessage).filter(ChatMessage.user_id == 1)
    if session_id:
        query = query.filter(ChatMessage.session_id == session_id)
    rows = query.order_by(ChatMessage.id).limit(200).all()
    return ok(
        [
            {
                "id": m.id,
                "session_id": m.session_id,
                "role": m.role,
                "content": m.content,
                "meta": m.meta,
                "created_at": m.created_at,
            }
            for m in rows
        ]
    )


@app.delete("/api/assistant/messages")
def clear_messages(
    session_id: int | None = Query(default=None), db: Session = Depends(get_db)
):
    query = db.query(ChatMessage).filter(ChatMessage.user_id == 1)
    if session_id:
        query = query.filter(ChatMessage.session_id == session_id)
    query.delete()
    db.commit()
    return ok(None, "对话已清空")


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


def _requester(x_user_id: str = Header(default="1")) -> int:
    try:
        return max(1, int(x_user_id))
    except (TypeError, ValueError):
        return 1


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


@app.get("/api/deal/sources")
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


_DEAL_CATEGORY_WORDS = {
    "数码": ["数码", "电子", "电脑", "手机", "耳机", "键盘", "鼠标", "显示器", "平板", "相机"],
    "服饰": ["服饰", "服装", "女装", "男装", "针织", "毛衣", "外套", "裤子", "裙子", "鞋"],
    "食品": ["食品", "零食", "饮料", "口味", "净含量", "保质期"],
    "日用品": ["日用品", "日用", "家居", "清洁", "收纳"],
    "学习用品": ["学习用品", "文具", "笔记本", "笔", "书包"],
}


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


_AI_PRICE_CACHE: dict[str, tuple[float, dict]] = {}
_AI_PRICE_TTL = 600
_AI_PRICE_DEGRADED_UNTIL = 0.0


@app.post("/api/deal/ai-price")
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


@app.post("/api/deal/parse-link")
def deal_parse_link(payload: dict = Body(...)):
    url = str(payload.get("url") or "").strip()
    if not url:
        fail("请提供商品链接")
    result = deal_decision.parse_link(url)
    if not result.get("ok"):
        return ok({"recognized": False, "reason": result.get("reason"), "manual_allowed": True})
    return ok({"recognized": True, **result, "manual_allowed": True})


@app.post("/api/deal/products")
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


@app.get("/api/deal/products/{product_id}")
def get_product(product_id: int, db: Session = Depends(get_db), user_id: int = Depends(_requester)):
    p = db.get(Product, product_id)
    if not p:
        fail("商品不存在", "RESOURCE_NOT_FOUND", 404)
    if p.user_id != user_id:
        fail("无权访问该商品", "FORBIDDEN", 403)
    return ok(_product_dict(p))


@app.post("/api/deal/products/{product_id}/quotes")
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


@app.get("/api/deal/products/{product_id}/quotes")
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


@app.get("/api/deal/products/{product_id}/history")
def product_history(product_id: int, quote_id: int = Query(default=0), days: int = Query(default=30), db: Session = Depends(get_db), user_id: int = Depends(_requester)):
    p = db.get(Product, product_id)
    if not p or p.user_id != user_id:
        fail("无权访问该商品历史", "FORBIDDEN", 403)
    days = max(1, min(days, 365))
    return ok(deal_decision.history_stats(db, product_id, quote_id or None, days))


@app.get("/api/deal/products/{product_id}/evidence")
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


@app.post("/api/deal/products/{product_id}/evidence")
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


# ---------- 省一省：购买计划 ----------


@app.post("/api/deal/plans")
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


@app.get("/api/deal/plans")
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


@app.get("/api/deal/plans/{plan_id}")
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


@app.patch("/api/deal/plans/{plan_id}")
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


@app.post("/api/deal/plans/{plan_id}/publish")
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


@app.post("/api/deal/plans/{plan_id}/vote")
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


@app.post("/api/deal/plans/{plan_id}/settle")
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


@app.post("/api/deal/plans/{plan_id}/comments")
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


@app.post("/api/deal/comments/{comment_id}/helpful")
def helpful_comment(comment_id: int, db: Session = Depends(get_db), user_id: int = Depends(_requester)):
    row = db.get(PlanComment, comment_id)
    if not row:
        fail("评论不存在", "RESOURCE_NOT_FOUND", 404)
    row.helpful += 1
    db.commit()
    return ok({"helpful": row.helpful})


@app.post("/api/deal/reports")
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


@app.post("/api/deal/plans/{plan_id}/cooling")
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


@app.post("/api/deal/plans/{plan_id}/decide")
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


@app.post("/api/deal/plans/{plan_id}/alerts")
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


@app.post("/api/deal/plans/{plan_id}/alerts/check")
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


@app.post("/api/deal/plans/{plan_id}/purchase")
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


@app.post("/api/deal/groups")
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


@app.get("/api/deal/groups")
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


@app.post("/api/deal/groups/{group_id}/members")
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


@app.get("/api/deal/discussions")
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


@app.get("/api/deal/summary")
def deal_summary(db: Session = Depends(get_db), user_id: int = Depends(_requester)):
    data = deal_decision.money_summary(db, user_id)
    plans = db.query(PurchasePlan).filter(PurchasePlan.user_id == user_id).all()
    data["plan_count"] = len(plans)
    data["cooling_count"] = len([p for p in plans if p.decision_status == "cooling"])
    data["price_alert_count"] = db.query(PriceAlert).filter(PriceAlert.user_id == user_id, PriceAlert.enabled == 1).count()
    return ok(data)


@app.get("/api/deal/records")
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


@app.get("/api/deal/overview")
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


if WEB_DIR.exists():
    app.mount("/static", StaticFiles(directory=str(WEB_DIR / "static")), name="static")


@app.get("/")
def index():
    return FileResponse(str(WEB_DIR / "index.html"))


@app.get("/{path:path}")
def spa(path: str):
    candidate = WEB_DIR / path
    if candidate.is_file():
        return FileResponse(str(candidate))
    return FileResponse(str(WEB_DIR / "index.html"))