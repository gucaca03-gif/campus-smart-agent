"""自我管理路由（从 main.py 拆出）。"""

import json
import random
import re
from datetime import date, datetime, timedelta

from fastapi import APIRouter, Body, Depends, File, Form, Header, HTTPException, Query, UploadFile
from sqlalchemy import text
from sqlalchemy.orm import Session

from ..db import SessionLocal, get_db
from ..api_utils import ok, fail, _requester
from .. import office_ai, tools, deal_decision

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


@router.get("/api/self/plans")
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

@router.post("/api/self/plans")
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

@router.patch("/api/self/plan-items/{item_id}")
def update_plan_item(item_id: int, payload: dict = Body(...), db: Session = Depends(get_db)):
    item = db.get(PlanItem, item_id)
    if not item:
        fail("计划项不存在", "RESOURCE_NOT_FOUND", 404)
    if payload.get("status"):
        item.status = payload["status"]
    db.commit()
    return ok(None, "已更新")

@router.get("/api/self/pomodoro/stats")
def pomodoro_stats(db: Session = Depends(get_db)):
    rows = db.query(Pomodoro).filter(Pomodoro.user_id == 1).all()
    done = [p for p in rows if p.status == "done"]
    return ok({"sessions": len(done), "minutes": sum(p.minutes for p in done), "today": date.today().isoformat()})

@router.post("/api/self/pomodoro")
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

