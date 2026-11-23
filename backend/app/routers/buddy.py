"""搭子社区相关路由（从 main.py 拆出）。"""

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

def buddy_auto_demo() -> bool:
    """演示开关：默认开启（演示账号自动通过并回应），.env BUDDY_AUTO_DEMO=0 关闭。"""
    return office_ai._cfg("BUDDY_AUTO_DEMO", "1").strip().lower() not in ("0", "false", "off", "no")

@router.post("/api/buddy/apply")
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

@router.get("/api/buddy/applications")
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

@router.post("/api/buddy/applications/{app_id}/accept")
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

@router.post("/api/buddy/applications/{app_id}/cancel")
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

@router.post("/api/buddy/applications/{app_id}/reject")
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

@router.get("/api/buddy/chat/{application_id}")
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

@router.post("/api/buddy/chat/{application_id}")
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

@router.post("/api/buddy/chat/{application_id}/read")
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

@router.get("/api/buddy/nearby")
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

@router.get("/api/buddy/test")
def buddy_test_meta():
    return ok({
        "animal_questions": ANIMAL_QUESTIONS,
        "mbti_questions": MBTI_QUESTIONS,
        "survival_questions": SURVIVAL_QUESTIONS,
        "battery_questions": BATTERY_QUESTIONS,
    })

@router.get("/api/buddy/profile")
def my_buddy_profile(db: Session = Depends(get_db)):
    ensure_buddy_demo(db)
    p = db.query(BuddyProfile).filter(BuddyProfile.user_id == 1).first()
    return ok(profile_to_dict(p) if p else None)

@router.post("/api/buddy/test/submit")
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

@router.post("/api/buddy/profile")
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

@router.get("/api/buddy/matches")
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

@router.post("/api/buddy/profile/visibility")
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

@router.get("/api/buddy/posts")
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

@router.post("/api/buddy/posts")
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

@router.post("/api/buddy/posts/{post_id}/close")
def close_buddy(post_id: int, db: Session = Depends(get_db)):
    post = db.get(BuddyPost, post_id)
    if not post:
        fail("帖子不存在", "RESOURCE_NOT_FOUND", 404)
    post.status = "closed"
    db.commit()
    return ok(None, "已关闭")

@router.post("/api/buddy/posts/{post_id}/report")
def report_buddy(post_id: int, payload: dict = Body(default={}), db: Session = Depends(get_db)):
    post = db.get(BuddyPost, post_id)
    if not post:
        fail("帖子不存在", "RESOURCE_NOT_FOUND", 404)
    post.status = "removed"
    db.commit()
    return ok(None, "已提交举报，内容已下架待管理员复核")

