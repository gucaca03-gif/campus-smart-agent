import asyncio
import hashlib
import json
import mimetypes
import re
from contextlib import asynccontextmanager
from datetime import date, datetime, timedelta
from pathlib import Path

from fastapi import Body, Depends, FastAPI, File, Form, HTTPException, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session

from .db import SessionLocal, engine, get_db
from .models import (
    Base,
    Booking,
    BuddyPost,
    CalendarEvent,
    Campus,
    ChatMessage,
    DealPost,
    DealVote,
    Errand,
    FitnessProfile,
    LostFound,
    MealLog,
    News,
    OfficeReview,
    Place,
    PlanItem,
    Pomodoro,
    PurchaseIntent,
    Resource,
    ResourceLink,
    SchoolMetric,
    StudyPlan,
)
from .seed import seed
from .self_control import router as self_control_router
from .office import extract_kv, match_files, review_submission
from .office_docs import KIND_LABELS, extract_conditions, file_to_text, parse_document, preview_document, verify_applications
from . import office_ai
from .services import (
    WEEKDAY_CN,
    assistant_reply,
    booking_to_dict,
    build_route,
    cancel_booking,
    checkin_booking,
    create_booking,
    decide_booking,
    ensure_slots,
    parse_date,
    resolve_place,
)

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
    finally:
        db.close()
    yield


app = FastAPI(title="爱师大 · 校园智慧服务", version="1.1.0", lifespan=lifespan)
app.include_router(self_control_router)


@app.middleware("http")
async def no_cache_static(request, call_next):
    response = await call_next(request)
    if not request.url.path.startswith("/api"):
        response.headers["Cache-Control"] = "no-store, max-age=0, must-revalidate"
        response.headers["Pragma"] = "no-cache"
    return response


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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
    events = db.query(CalendarEvent).filter(CalendarEvent.term == term).order_by(CalendarEvent.start_date).all()
    return ok(
        [
            {
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
    booking, error = create_booking(db, payload)
    if error:
        fail(error, "RULE_VIOLATION", 409 if "预约" in error or "时段" in error else 400)
    return ok(booking, "已提交" if booking and booking["status"] == "pending_approval" else "预约成功")


@app.get("/api/bookings/my")
def my_bookings(db: Session = Depends(get_db)):
    rows = db.query(Booking).filter(Booking.user_id == 1).order_by(Booking.id.desc()).all()
    return ok([booking_to_dict(db, b) for b in rows])


@app.post("/api/bookings/{booking_id}/cancel")
def api_cancel(booking_id: int, db: Session = Depends(get_db)):
    success, message = cancel_booking(db, booking_id)
    if not success:
        fail(message, "RULE_VIOLATION", 409)
    return ok(None, message)


@app.post("/api/bookings/{booking_id}/checkin")
def api_checkin(booking_id: int, db: Session = Depends(get_db)):
    success, message = checkin_booking(db, booking_id)
    if not success:
        fail(message, "RULE_VIOLATION", 409)
    return ok(None, message)


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
    "18:00": 0.72,
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
    rows = db.query(Resource).filter(Resource.type == "seat").order_by(Resource.id).all()
    day = parse_date(date_str) if date_str else date.today()
    busy_ids: set[int] = set()
    active_filter = [
        Booking.type == "seat",
        Booking.date == day.isoformat(),
        Booking.status.in_(["pending_approval", "confirmed", "checked_in"]),
    ]
    if start and end:
        active_filter.append(Booking.start_at == start)
        active_filter.append(Booking.end_at == end)
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
                    status, text = "closed", "不开放"
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
        fail("请上传评选通知、评选办法等规则文档", "VALIDATION", 400)
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
        fail("AI 未能从文档中识别出可核查的字段，请确认文档内容", "AI_NO_RULE", 422)
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

    async def process_one(f):
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
def deals(db: Session = Depends(get_db)):
    posts = db.query(DealPost).filter(DealPost.status != "removed").order_by(DealPost.id.desc()).all()
    votes = db.query(DealVote).all()
    result = []
    for p in posts:
        mine = next((v.vote for v in votes if v.post_id == p.id and v.user_id == 1), "")
        counts = {"buy": 0, "think": 0, "no": 0}
        for v in votes:
            if v.post_id == p.id and v.vote in counts:
                counts[v.vote] += 1
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
    post = db.get(DealPost, post_id)
    if not post:
        fail("帖子不存在", "RESOURCE_NOT_FOUND", 404)
    row = db.query(DealVote).filter(DealVote.post_id == post_id, DealVote.user_id == 1).first()
    if row:
        row.vote = vote
    else:
        db.add(DealVote(post_id=post_id, user_id=1, vote=vote))
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


@app.get("/api/self/fitness/profile")
def get_fitness(db: Session = Depends(get_db)):
    p = db.query(FitnessProfile).filter(FitnessProfile.user_id == 1).first()
    if not p:
        return ok({"height_cm": 0, "weight_kg": 0, "goal": "保持", "activity": "轻度", "constraints": "", "consent": False})
    return ok(
        {
            "height_cm": p.height_cm,
            "weight_kg": p.weight_kg,
            "goal": p.goal,
            "activity": p.activity,
            "constraints": p.constraints,
            "consent": bool(p.consent),
            "updated_at": p.updated_at,
        }
    )


@app.put("/api/self/fitness/profile")
def save_fitness(payload: dict = Body(...), db: Session = Depends(get_db)):
    p = db.query(FitnessProfile).filter(FitnessProfile.user_id == 1).first()
    if not p:
        p = FitnessProfile(user_id=1)
        db.add(p)
    p.height_cm = int(payload.get("height_cm") or 0)
    p.weight_kg = float(payload.get("weight_kg") or 0)
    p.goal = payload.get("goal", "保持")
    p.activity = payload.get("activity", "轻度")
    p.constraints = payload.get("constraints", "")
    p.consent = 1 if payload.get("consent") else 0
    p.updated_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    db.commit()
    return ok(None, "已保存健康档案")


@app.get("/api/self/fitness/meals")
def meals(db: Session = Depends(get_db)):
    rows = db.query(MealLog).filter(MealLog.user_id == 1).order_by(MealLog.id.desc()).limit(20).all()
    return ok([{"id": m.id, "meal_type": m.meal_type, "description": m.description, "calories": m.calories, "protein": m.protein, "created_at": m.created_at} for m in rows])


@app.post("/api/self/fitness/meals")
def add_meal(payload: dict = Body(...), db: Session = Depends(get_db)):
    if not payload.get("description"):
        fail("请填写饮食内容")
    profile = db.query(FitnessProfile).filter(FitnessProfile.user_id == 1).first()
    if not profile or not profile.consent:
        fail("请先授权并保存身体档案", "CONSENT_REQUIRED", 403)
    text = payload["description"]
    calories = int(payload.get("calories") or 0)
    if not calories:
        # 轻量演示估算：按常见食物关键词给出粗略值，页面标注为估算
        table = {"米饭": 230, "面": 350, "鸡": 250, "鱼": 200, "奶茶": 350, "咖啡": 120, "包子": 200, "沙拉": 150, "鸡蛋": 80}
        calories = sum(v for k, v in table.items() if k in text) or 300
    m = MealLog(meal_type=payload.get("meal_type", "午餐"), description=text, calories=calories, protein=int(payload.get("protein") or 0))
    db.add(m)
    db.commit()
    return ok({"id": m.id, "calories": calories, "estimated": True}, "已记录（热量为估算值）")


@app.post("/api/self/fitness/analyze")
def analyze_fitness(db: Session = Depends(get_db)):
    profile = db.query(FitnessProfile).filter(FitnessProfile.user_id == 1).first()
    if not profile or not profile.consent:
        fail("请先授权并保存身体档案", "CONSENT_REQUIRED", 403)
    logs = db.query(MealLog).filter(MealLog.user_id == 1).all()
    total = sum(m.calories for m in logs)
    return ok(
        {
            "total_calories": total,
            "meals": len(logs),
            "advice": [
                f"今日已记录 {len(logs)} 餐，估算摄入 {total} kcal。",
                "如果目标是减脂，优先保证蛋白质和蔬菜，减少含糖饮料。",
                "以上为一般性建议，不构成医疗或营养诊断；有基础疾病请咨询医生。",
            ],
            "disclaimer": "AI 建议仅供参考，不替代专业医疗或营养指导。",
        }
    )


@app.post("/api/self/fitness/plan")
def fitness_plan(payload: dict = Body(default={}), db: Session = Depends(get_db)):
    profile = db.query(FitnessProfile).filter(FitnessProfile.user_id == 1).first()
    if not profile or not profile.consent:
        fail("请先授权并保存身体档案", "CONSENT_REQUIRED", 403)
    goal = profile.goal
    days = [
        ("周一", "快走 + 拉伸", 30),
        ("周二", "力量训练（上肢）", 40),
        ("周三", "休息 / 轻松步行", 20),
        ("周四", "力量训练（下肢）", 40),
        ("周五", "慢跑", 30),
        ("周六", "兴趣运动（球类/游泳）", 45),
        ("周日", "休息 + 复盘", 0),
    ]
    return ok(
        {
            "goal": goal,
            "week": [{"day": d, "activity": a, "minutes": m} for d, a, m in days],
            "disclaimer": "AI 生成的健身计划仅供参考，不构成医疗或专业训练指导；如有伤病请先咨询医生。",
        }
    )


@app.delete("/api/self/fitness")
def clear_fitness(db: Session = Depends(get_db)):
    db.query(MealLog).filter(MealLog.user_id == 1).delete()
    db.query(FitnessProfile).filter(FitnessProfile.user_id == 1).delete()
    db.commit()
    return ok(None, "健康档案与饮食记录已删除，授权已撤回")


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
    p = Pomodoro(task=payload.get("task", "专注"), minutes=int(payload.get("minutes") or 25), status=payload.get("status", "done"))
    p.started_at = payload.get("started_at") or datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    p.ended_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    db.add(p)
    db.commit()
    return ok({"id": p.id}, "已记录")


@app.post("/api/assistant/chat")
def assistant_chat(payload: dict = Body(...), db: Session = Depends(get_db)):
    message = (payload.get("message") or "").strip()
    if not message:
        fail("请输入问题")
    result = assistant_reply(db, message)
    db.add(ChatMessage(user_id=1, role="user", content=message))
    db.add(ChatMessage(user_id=1, role="assistant", content=result["reply"], meta=json.dumps(result, ensure_ascii=False)))
    db.commit()
    return ok(result)


@app.get("/api/assistant/messages")
def assistant_messages(db: Session = Depends(get_db)):
    rows = db.query(ChatMessage).filter(ChatMessage.user_id == 1).order_by(ChatMessage.id).limit(50).all()
    return ok([{"id": m.id, "role": m.role, "content": m.content, "meta": m.meta, "created_at": m.created_at} for m in rows])


@app.delete("/api/assistant/messages")
def clear_messages(db: Session = Depends(get_db)):
    db.query(ChatMessage).filter(ChatMessage.user_id == 1).delete()
    db.commit()
    return ok(None, "会话已清空")


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