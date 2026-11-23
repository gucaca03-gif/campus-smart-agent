"""苏小师助手路由（从 main.py 拆出）。"""

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

@router.get("/api/assistant/tools")
def assistant_tools():
    return ok(
        {
            "builtin": [t["name"] for t in tools.TOOL_SPECS],
            "mcp": tools.mcp_tool_names(),
            "note": "内置通用工具已生效；MCP 工具可通过 backend/mcp_tools.json 登记，未登记时不影响内置能力。",
        }
    )

@router.get("/api/assistant/sessions")
def assistant_sessions(db: Session = Depends(get_db)):
    rows = (
        db.query(ChatSession)
        .filter(ChatSession.user_id == 1)
        .order_by(ChatSession.updated_at.desc(), ChatSession.id.desc())
        .all()
    )
    return ok([session_to_dict(db, s) for s in rows])

@router.post("/api/assistant/sessions")
def create_assistant_session(payload: dict = Body(default={}), db: Session = Depends(get_db)):
    title = (payload.get("title") or "新对话").strip()[:32] or "新对话"
    s = ChatSession(user_id=1, title=title)
    db.add(s)
    db.commit()
    db.refresh(s)
    return ok(session_to_dict(db, s), "已新建对话")

@router.patch("/api/assistant/sessions/{session_id}")
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

@router.delete("/api/assistant/sessions/{session_id}")
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

@router.post("/api/assistant/chat")
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

@router.get("/api/assistant/messages")
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

@router.delete("/api/assistant/messages")
def clear_messages(
    session_id: int | None = Query(default=None), db: Session = Depends(get_db)
):
    query = db.query(ChatMessage).filter(ChatMessage.user_id == 1)
    if session_id:
        query = query.filter(ChatMessage.session_id == session_id)
    query.delete()
    db.commit()
    return ok(None, "对话已清空")

