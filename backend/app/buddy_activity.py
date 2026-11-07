"""找搭子 · 活动匹配与参与。

活动（BuddyPost）状态机：
recruiting 招募中 → stopped 停止招募（成员保留）
                → cancelled 取消（通知成员）
                → finished 结束（进入历史）
申请（BuddyApplication）状态：pending 待处理 → accepted 通过 / rejected 未通过；pending → withdrawn 已撤回。
"""

import json
import random
from datetime import datetime, timedelta

from fastapi import APIRouter, Body, Depends, Header, Query
from sqlalchemy import text
from sqlalchemy.orm import Session

from .db import get_db
from .models import BuddyApplication, BuddyAutoReply, BuddyChat, BuddyPost, BuddyProfile, Message, now_str

router = APIRouter(prefix="/api/buddy", tags=["buddy-activity"])

TYPES = ["自习", "运动", "吃饭", "竞赛", "出游", "其他"]
TYPE_ALIAS = {"学习": "自习", "考研": "自习", "饭搭子": "吃饭", "摄影": "出游", "游戏": "其他", "观展": "出游"}
STATUS_LABEL = {
    "recruiting": "招募中",
    "stopped": "停止招募",
    "cancelled": "已取消",
    "finished": "已结束",
    "removed": "已下架",
}
APPLICATION_LABEL = {
    "pending": "待处理",
    "accepted": "已通过",
    "rejected": "未通过",
    "withdrawn": "已撤回",
}
ANIMAL_EMOJI = {"柯基": "🐕", "猫猫": "🐈", "海豚": "🐬", "刺猬": "🦔", "仓鼠": "🐹", "狐狸": "🦊", "鹅": "🦢", "水獭": "🦦"}


def _now() -> datetime:
    return datetime.now()


def parse_dt(value: str | None) -> datetime | None:
    if not value:
        return None
    raw = str(value).strip().replace("T", " ")
    for fmt in ("%Y-%m-%d %H:%M:%S", "%Y-%m-%d %H:%M", "%Y-%m-%d"):
        try:
            return datetime.strptime(raw, fmt)
        except ValueError:
            continue
    return None


def fmt_dt(value: datetime | None) -> str:
    return value.strftime("%Y-%m-%d %H:%M") if value else ""


def ensure_schema(db: Session) -> None:
    """旧库补活动字段；旧帖子状态 open→recruiting、closed→stopped。"""
    post_cols = [row[1] for row in db.execute(text("PRAGMA table_info(buddy_posts)")).fetchall()]
    post_alters = {
        "start_at": "VARCHAR(32) NOT NULL DEFAULT ''",
        "end_at": "VARCHAR(32) NOT NULL DEFAULT ''",
        "capacity": "INTEGER NOT NULL DEFAULT 4",
        "requirements": "VARCHAR(255) NOT NULL DEFAULT ''",
        "signup_deadline": "VARCHAR(32) NOT NULL DEFAULT ''",
        "cancel_reason": "VARCHAR(255) NOT NULL DEFAULT ''",
        "stopped_at": "VARCHAR(32) NOT NULL DEFAULT ''",
        "cancelled_at": "VARCHAR(32) NOT NULL DEFAULT ''",
        "finished_at": "VARCHAR(32) NOT NULL DEFAULT ''",
    }
    for name, ddl in post_alters.items():
        if name not in post_cols:
            db.execute(text(f"ALTER TABLE buddy_posts ADD COLUMN {name} {ddl}"))

    app_cols = [row[1] for row in db.execute(text("PRAGMA table_info(buddy_applications)")).fetchall()]
    app_alters = {
        "source": "VARCHAR(16) NOT NULL DEFAULT 'apply'",
        "processed_at": "VARCHAR(32) NOT NULL DEFAULT ''",
    }
    for name, ddl in app_alters.items():
        if name not in app_cols:
            db.execute(text(f"ALTER TABLE buddy_applications ADD COLUMN {name} {ddl}"))

    db.execute(text("UPDATE buddy_posts SET status='recruiting' WHERE status='open'"))
    db.execute(text("UPDATE buddy_posts SET status='stopped' WHERE status='closed'"))
    db.execute(text("UPDATE buddy_posts SET type='自习' WHERE type IN ('学习','考研')"))
    db.execute(text("UPDATE buddy_posts SET type='吃饭' WHERE type='饭搭子'"))
    db.execute(text("UPDATE buddy_posts SET type='出游' WHERE type IN ('摄影','观展')"))
    db.execute(text("UPDATE buddy_posts SET type='其他' WHERE type IN ('游戏') OR type NOT IN ('自习','运动','吃饭','竞赛','出游','其他')"))
    db.execute(text("UPDATE buddy_posts SET capacity=4 WHERE capacity IS NULL OR capacity < 2"))
    db.commit()


def normalize_type(value: str | None) -> str:
    raw = (value or "自习").strip()
    return TYPE_ALIAS.get(raw, raw if raw in TYPES else "其他")


def _profile(db: Session, user_id: int) -> BuddyProfile | None:
    return db.query(BuddyProfile).filter(BuddyProfile.user_id == user_id).first()


def _accepted(db: Session, post_id: int) -> int:
    return (
        db.query(BuddyApplication)
        .filter(BuddyApplication.post_id == post_id, BuddyApplication.status == "accepted")
        .count()
    )


def _pending(db: Session, post_id: int) -> int:
    return (
        db.query(BuddyApplication)
        .filter(BuddyApplication.post_id == post_id, BuddyApplication.status == "pending")
        .count()
    )


def _my_application(db: Session, post_id: int, user_id: int = 1) -> BuddyApplication | None:
    return (
        db.query(BuddyApplication)
        .filter(BuddyApplication.post_id == post_id, BuddyApplication.user_id == user_id)
        .order_by(BuddyApplication.id.desc())
        .first()
    )


def current_user(x_demo_user: str = Header(default="1")) -> int:
    """演示环境允许通过 X-Demo-User 切换身份，便于验收多用户申请流程；前端默认用户 1。"""
    try:
        value = int(x_demo_user)
        return value if value > 0 else 1
    except (TypeError, ValueError):
        return 1


def effective_status(post: BuddyPost) -> str:
    if post.status in ("recruiting", "stopped"):
        end = parse_dt(post.end_at)
        if end and _now() > end:
            return "finished"
    return post.status


def recommend_reasons(db: Session, post: BuddyPost) -> list[str]:
    reasons = []
    if post.campus == "泉山校区":
        reasons.append("同校区")
    start = parse_dt(post.start_at)
    if start:
        if start.weekday() >= 5 or start.hour >= 18:
            reasons.append("时间合适")
        if start.date() == _now().date():
            reasons.append("今天就开始")
    profile = _profile(db, 1)
    if profile:
        try:
            interests = json.loads(profile.interests or "[]")
        except json.JSONDecodeError:
            interests = []
        keyword = {"自习": "学习", "运动": "运动", "吃饭": "美食", "竞赛": "竞赛", "出游": "摄影"}
        if any(keyword.get(post.type, post.type) in str(x) for x in interests):
            reasons.append("共同兴趣")
    if post.type == "自习":
        reasons.append("都适合安静学习")
    return reasons[:3] or ["近期活动"]


def application_dict(db: Session, row: BuddyApplication, viewer_id: int = 1) -> dict:
    post = db.get(BuddyPost, row.post_id)
    peer_id = row.post_owner_id if row.user_id == viewer_id else row.user_id
    peer = _profile(db, peer_id)
    unread = (
        db.query(BuddyChat)
        .filter(
            BuddyChat.application_id == row.id,
            BuddyChat.from_user_id == peer_id,
            BuddyChat.to_user_id == viewer_id,
            BuddyChat.is_read == 0,
        )
        .count()
    )
    is_owner = row.post_owner_id == viewer_id
    if (row.source or "apply") == "invite":
        direction = "received_invite" if row.user_id == viewer_id else "sent_invite"
    else:
        direction = "received_apply" if is_owner else "sent_apply"
    return {
        "id": row.id,
        "direction": direction,
        "role": "owner" if is_owner else "applicant",
        "post_id": row.post_id,
        "post_title": post.title if post else "（活动已删除）",
        "post_type": post.type if post else "",
        "post_status": effective_status(post) if post else "removed",
        "peer_id": peer_id,
        "peer_nickname": peer.nickname if peer else "师大同学",
        "peer_emoji": ANIMAL_EMOJI.get(peer.animal_type if peer else "", "🐾"),
        "peer_mbti": peer.mbti if peer else "",
        "message": row.message,
        "source": row.source or "apply",
        "status": row.status,
        "status_label": (
            "待你回应" if direction == "received_invite" and row.status == "pending"
            else "等待对方回应" if direction == "sent_invite" and row.status == "pending"
            else APPLICATION_LABEL.get(row.status, row.status)
        ),
        "unread": unread,
        "created_at": row.created_at,
        "processed_at": row.processed_at,
    }


def activity_dict(db: Session, post: BuddyPost) -> dict:
    accepted = _accepted(db, post.id)
    pending = _pending(db, post.id)
    taken = 1 + accepted
    capacity = max(2, post.capacity or 4)
    remaining = max(0, capacity - taken)
    effective = effective_status(post)
    deadline = parse_dt(post.signup_deadline)
    start = parse_dt(post.start_at)
    end = parse_dt(post.end_at)
    mine = _my_application(db, post.id)
    mine_status = mine.status if mine else ""
    is_owner = post.user_id == 1
    can_apply = (
        effective == "recruiting"
        and not is_owner
        and remaining > 0
        and (not deadline or _now() <= deadline)
        and mine_status not in ("pending", "accepted")
    )
    owner = _profile(db, post.user_id)
    return {
        "id": post.id,
        "type": post.type,
        "title": post.title,
        "content": post.content,
        "campus": post.campus,
        "place": post.place,
        "start_at": post.start_at,
        "end_at": post.end_at,
        "time_text": post.time_text,
        "capacity": capacity,
        "taken": taken,
        "remaining": remaining,
        "pending": pending,
        "requirements": post.requirements,
        "signup_deadline": post.signup_deadline,
        "status": post.status,
        "effective_status": effective,
        "status_label": STATUS_LABEL.get(effective, effective),
        "cancel_reason": post.cancel_reason,
        "created_at": post.created_at,
        "owner": {
            "id": post.user_id,
            "nickname": owner.nickname if owner else "师大同学",
            "emoji": ANIMAL_EMOJI.get(owner.animal_type if owner else "", "🐾"),
            "mbti": owner.mbti if owner else "",
            "college": owner.college if owner else "",
        },
        "is_owner": is_owner,
        "need_more": effective == "recruiting" and remaining > 0,
        "can_apply": can_apply,
        "can_invite": bool(is_owner and effective == "recruiting" and remaining > 0),
        "mine": {
            "application_id": mine.id if mine else None,
            "status": mine_status,
            "status_label": APPLICATION_LABEL.get(mine_status, ""),
            "can_withdraw": bool(mine and mine.status == "pending"),
            "can_chat": bool(mine and mine.status == "accepted"),
        },
        "recommend_reasons": recommend_reasons(db, post),
        "time_known": bool(start and end),
    }


def _notify(db: Session, user_id: int, title: str, content: str, url: str) -> None:
    db.add(Message(user_id=user_id, category="搭子", title=title[:128], content=content[:500], action_text="查看活动", action_url=url))


def _validate_activity(payload: dict) -> tuple[dict | None, str]:
    title = (payload.get("title") or "").strip()
    if len(title) < 2:
        return None, "标题至少 2 个字"
    if len(title) > 40:
        return None, "标题不超过 40 个字"
    campus = (payload.get("campus") or "").strip()
    place = (payload.get("place") or "").strip()
    if not campus or not place:
        return None, "请填写校区和地点"
    start = parse_dt(payload.get("start_at"))
    end = parse_dt(payload.get("end_at"))
    if not start or not end:
        return None, "请选择开始和结束时间"
    if end <= start:
        return None, "结束时间必须晚于开始时间"
    deadline = parse_dt(payload.get("signup_deadline"))
    if deadline and deadline > start:
        return None, "报名截止时间不能晚于开始时间"
    try:
        capacity = int(payload.get("capacity") or 4)
    except (TypeError, ValueError):
        return None, "人数格式不正确"
    if capacity < 2 or capacity > 50:
        return None, "活动人数需在 2-50 人之间（含发起人）"
    content = (payload.get("content") or "").strip()
    if len(content) < 4:
        return None, "请写一句简短说明"
    return {
        "type": normalize_type(payload.get("type")),
        "title": title,
        "content": content[:500],
        "campus": campus,
        "place": place,
        "start_at": fmt_dt(start),
        "end_at": fmt_dt(end),
        "capacity": capacity,
        "requirements": (payload.get("requirements") or "").strip()[:255],
        "signup_deadline": fmt_dt(deadline),
    }, ""


# ---------- 列表 / 详情 ----------


@router.get("/activities")
def list_activities(
    q: str = Query(default=""),
    type: str = Query(default=""),
    campus: str = Query(default=""),
    time_filter: str = Query(default=""),
    need_more: str = Query(default=""),
    sort: str = Query(default="soon"),
    include_finished: int = Query(default=0),
    exclude: str = Query(default=""),
    limit: int = Query(default=0),
    shuffle: int = Query(default=0),
    db: Session = Depends(get_db),
):
    rows = db.query(BuddyPost).filter(BuddyPost.status != "removed").all()
    excluded = {int(x) for x in str(exclude).split(",") if str(x).strip().isdigit()}
    if excluded:
        rows = [p for p in rows if p.id not in excluded]
    items = []
    for post in rows:
        item = activity_dict(db, post)
        if not include_finished and item["effective_status"] in ("finished", "cancelled"):
            continue
        if type and item["type"] != normalize_type(type):
            continue
        if campus and item["campus"] != campus:
            continue
        if q:
            hay = f"{item['title']} {item['place']} {item['content']} {item['type']}"
            if q not in hay:
                continue
        start = parse_dt(item["start_at"])
        if time_filter == "today" and (not start or start.date() != _now().date()):
            continue
        if time_filter == "week":
            week_end = _now() + timedelta(days=7)
            if not start or not (_now() <= start <= week_end):
                continue
        if need_more in ("1", "true") and not item["need_more"]:
            continue
        items.append(item)

    def sort_key(item):
        start = parse_dt(item["start_at"])
        if sort == "latest":
            return (0, item["created_at"] or "")
        return (
            0 if item["need_more"] else 1,
            start.timestamp() if start else 9_999_999_999,
        )

    items.sort(key=sort_key, reverse=(sort == "latest"))
    if shuffle:
        random.shuffle(items)
    if limit and limit > 0:
        items = items[:limit]
    return ok(items)


@router.get("/activities/mine")
def my_activities(db: Session = Depends(get_db), user_id: int = Depends(current_user)):
    published, joined, finished = [], [], []
    posts = db.query(BuddyPost).filter(BuddyPost.status != "removed").order_by(BuddyPost.id.desc()).all()
    post_map = {p.id: p for p in posts}
    for post in posts:
        item = activity_dict(db, post)
        if post.user_id == user_id:
            if item["effective_status"] in ("finished", "cancelled"):
                finished.append({**item, "relation": "published"})
            else:
                published.append({**item, "relation": "published"})
    apps = (
        db.query(BuddyApplication)
        .filter(BuddyApplication.user_id == user_id, BuddyApplication.status == "accepted")
        .order_by(BuddyApplication.id.desc())
        .all()
    )
    for row in apps:
        post = post_map.get(row.post_id)
        if not post:
            continue
        item = activity_dict(db, post)
        if item["effective_status"] in ("finished", "cancelled"):
            finished.append({**item, "relation": "joined", "application_id": row.id})
        else:
            joined.append({**item, "relation": "joined", "application_id": row.id})
    return ok({"published": published, "joined": joined, "finished": finished})


@router.get("/activities/{activity_id}")
def activity_detail(activity_id: int, db: Session = Depends(get_db)):
    post = db.get(BuddyPost, activity_id)
    if not post or post.status == "removed":
        fail("活动不存在", "RESOURCE_NOT_FOUND", 404)
    item = activity_dict(db, post)
    members = []
    accepted_rows = (
        db.query(BuddyApplication)
        .filter(BuddyApplication.post_id == post.id, BuddyApplication.status == "accepted")
        .all()
    )
    member_ids = [post.user_id] + [r.user_id for r in accepted_rows]
    for uid in member_ids:
        p = _profile(db, uid)
        members.append(
            {
                "id": uid,
                "nickname": p.nickname if p else ("我" if uid == 1 else "师大同学"),
                "emoji": ANIMAL_EMOJI.get(p.animal_type if p else "", "🐾"),
                "is_owner": uid == post.user_id,
            }
        )
    return ok({**item, "members": members})


# ---------- 发布 / 管理 ----------


@router.post("/activities")
def create_activity(payload: dict = Body(...), db: Session = Depends(get_db)):
    data, error = _validate_activity(payload)
    if error:
        fail(error, "VALIDATION", 400)
    post = BuddyPost(
        user_id=1,
        type=data["type"],
        title=data["title"],
        content=data["content"],
        campus=data["campus"],
        place=data["place"],
        start_at=data["start_at"],
        end_at=data["end_at"],
        capacity=data["capacity"],
        requirements=data["requirements"],
        signup_deadline=data["signup_deadline"],
        time_text=f"{data['start_at']}—{data['end_at'].split()[-1]}",
        status="recruiting",
    )
    db.add(post)
    db.commit()
    db.refresh(post)
    return ok(activity_dict(db, post), "活动已发布")


@router.patch("/activities/{activity_id}")
def update_activity(activity_id: int, payload: dict = Body(...), db: Session = Depends(get_db)):
    post = db.get(BuddyPost, activity_id)
    if not post:
        fail("活动不存在", "RESOURCE_NOT_FOUND", 404)
    if post.user_id != 1:
        fail("只能管理自己发布的活动", "FORBIDDEN", 403)
    action = (payload.get("action") or "edit").strip()
    if action == "stop":
        post.status = "stopped"
        post.stopped_at = now_str()
    elif action == "cancel":
        post.status = "cancelled"
        post.cancelled_at = now_str()
        post.cancel_reason = (payload.get("reason") or "发起人取消了活动").strip()[:255]
        rows = db.query(BuddyApplication).filter(BuddyApplication.post_id == post.id, BuddyApplication.status.in_(["pending", "accepted"])).all()
        for row in rows:
            _notify(db, row.user_id, f"活动已取消：{post.title}", post.cancel_reason, f"#/life/buddy/activity?id={post.id}")
            db.add(
                BuddyChat(
                    application_id=row.id,
                    from_user_id=post.user_id,
                    to_user_id=row.user_id,
                    content=f"抱歉，活动「{post.title}」已取消：{post.cancel_reason}",
                )
            )
    elif action == "finish":
        post.status = "finished"
        post.finished_at = now_str()
    elif action == "edit":
        data, error = _validate_activity(payload)
        if error:
            fail(error, "VALIDATION", 400)
        for key, value in data.items():
            setattr(post, key, value)
        post.time_text = f"{data['start_at']}—{data['end_at'].split()[-1]}"
    else:
        fail("未知操作", "VALIDATION", 400)
    db.commit()
    db.refresh(post)
    return ok(activity_dict(db, post), "已更新")


@router.delete("/activities/{activity_id}")
def delete_activity(activity_id: int, db: Session = Depends(get_db), user_id: int = Depends(current_user)):
    post = db.get(BuddyPost, activity_id)
    if not post:
        fail("活动不存在", "RESOURCE_NOT_FOUND", 404)
    if post.user_id != user_id:
        fail("只能删除自己发布的活动", "FORBIDDEN", 403)
    apps = db.query(BuddyApplication).filter(BuddyApplication.post_id == post.id).all()
    for row in apps:
        db.query(BuddyChat).filter(BuddyChat.application_id == row.id).delete()
        db.delete(row)
    db.query(Message).filter(Message.category == "搭子", Message.action_url.like(f"%id={post.id}%")).delete()
    db.delete(post)
    db.commit()
    return ok(None, "活动已删除")


# ---------- 申请 / 邀请 ----------


@router.post("/activities/{activity_id}/invite")
def invite_user(activity_id: int, payload: dict = Body(...), db: Session = Depends(get_db), user_id: int = Depends(current_user)):
    post = db.get(BuddyPost, activity_id)
    if not post or post.status == "removed":
        fail("活动不存在", "RESOURCE_NOT_FOUND", 404)
    if post.user_id != user_id:
        fail("只能邀请别人参加自己发布的活动", "FORBIDDEN", 403)
    if post.status != "recruiting" or effective_status(post) != "recruiting":
        fail("活动当前不可邀请", "RULE_VIOLATION", 409)
    target = int(payload.get("user_id") or 0)
    if target <= 0:
        fail("请选择要邀请的同学", "VALIDATION", 400)
    if target == user_id:
        fail("不能邀请自己", "VALIDATION", 400)
    if 1 + _accepted(db, post.id) >= max(2, post.capacity or 4):
        fail("活动已满员", "RULE_VIOLATION", 409)
    exists = (
        db.query(BuddyApplication)
        .filter(
            BuddyApplication.post_id == post.id,
            BuddyApplication.user_id == target,
            BuddyApplication.status.in_(["pending", "accepted"]),
        )
        .first()
    )
    if exists:
        fail("这位同学已经申请或已在活动中", "DUPLICATE", 409)
    row = BuddyApplication(
        user_id=target,
        post_id=post.id,
        post_owner_id=user_id,
        message=(payload.get("message") or "想邀请你一起参加这个活动～")[:500],
        status="pending",
        source="invite",
    )
    db.add(row)
    _notify(db, target, f"收到活动邀请：{post.title}", row.message, f"#/life/buddy/activity?id={post.id}")
    db.commit()
    db.refresh(row)
    return ok({"id": row.id, "status": row.status}, "邀请已发送，等待对方回应")


@router.post("/activities/{activity_id}/apply")
def apply_activity(activity_id: int, payload: dict = Body(default={}), db: Session = Depends(get_db), user_id: int = Depends(current_user)):
    post = db.get(BuddyPost, activity_id)
    if not post or post.status == "removed":
        fail("活动不存在", "RESOURCE_NOT_FOUND", 404)
    if post.user_id == user_id:
        fail("这是你发布的活动，不需要申请", "VALIDATION", 400)
    if post.status != "recruiting":
        fail("活动已停止招募", "RULE_VIOLATION", 409)
    effective = effective_status(post)
    if effective == "finished":
        fail("活动已结束", "RULE_VIOLATION", 409)
    deadline = parse_dt(post.signup_deadline)
    if deadline and _now() > deadline:
        fail("报名已截止", "RULE_VIOLATION", 409)
    if 1 + _accepted(db, post.id) >= max(2, post.capacity or 4):
        fail("活动已满员", "RULE_VIOLATION", 409)
    latest = _my_application(db, post.id, user_id)
    if latest and latest.status in ("pending", "accepted"):
        fail("已申请过该活动，请勿重复提交", "DUPLICATE", 409)
    row = BuddyApplication(
        user_id=user_id,
        post_id=post.id,
        post_owner_id=post.user_id,
        message=(payload.get("message") or "你好，我想参加这个活动～")[:500],
        status="pending",
        source="apply",
    )
    db.add(row)
    _notify(db, post.user_id, f"新的活动申请：{post.title}", row.message, f"#/life/buddy/activity?id={post.id}")
    db.commit()
    db.refresh(row)
    return ok({"id": row.id, "status": row.status}, "申请已发送，等待发起人处理")


@router.post("/applications/{app_id}/withdraw")
def withdraw_application(app_id: int, db: Session = Depends(get_db), user_id: int = Depends(current_user)):
    row = db.get(BuddyApplication, app_id)
    if not row:
        fail("申请不存在", "RESOURCE_NOT_FOUND", 404)
    if row.user_id != user_id:
        fail("只能撤回自己的申请", "FORBIDDEN", 403)
    if row.status != "pending":
        fail("当前状态不可撤回", "RULE_VIOLATION", 409)
    row.status = "withdrawn"
    row.processed_at = now_str()
    db.commit()
    return ok(None, "已撤回申请")


@router.post("/applications/{app_id}/quit")
def quit_activity(app_id: int, db: Session = Depends(get_db), user_id: int = Depends(current_user)):
    row = db.get(BuddyApplication, app_id)
    if not row:
        fail("申请不存在", "RESOURCE_NOT_FOUND", 404)
    if row.user_id != user_id:
        fail("只能退出自己参加的活动", "FORBIDDEN", 403)
    if row.status != "accepted":
        fail("当前状态不可退出", "RULE_VIOLATION", 409)
    row.status = "withdrawn"
    row.processed_at = now_str()
    post = db.get(BuddyPost, row.post_id)
    if post:
        _notify(db, post.user_id, f"成员退出了活动：{post.title}", "名额已释放，可以继续招募。", f"#/life/buddy/activity?id={post.id}")
    db.commit()
    return ok(None, "已退出活动，名额已释放")


@router.post("/applications/{app_id}/accept")
def accept_application(app_id: int, db: Session = Depends(get_db), user_id: int = Depends(current_user)):
    row = db.get(BuddyApplication, app_id)
    if not row:
        fail("申请不存在", "RESOURCE_NOT_FOUND", 404)
    is_invitee = (row.source or "apply") == "invite" and row.user_id == user_id
    if not is_invitee and row.post_owner_id != user_id:
        fail("无权处理该申请", "FORBIDDEN", 403)
    if row.status != "pending":
        fail("该申请已处理", "RULE_VIOLATION", 409)
    post = db.get(BuddyPost, row.post_id)
    if not post or post.status != "recruiting":
        fail("活动已停止招募，无法继续通过", "RULE_VIOLATION", 409)
    if 1 + _accepted(db, post.id) >= max(2, post.capacity or 4):
        fail("活动已满员，无法继续通过", "RULE_VIOLATION", 409)
    row.status = "accepted"
    row.processed_at = now_str()
    db.add(BuddyChat(application_id=row.id, from_user_id=user_id, to_user_id=row.user_id, content="通过啦！具体时间地点可以在这里聊～"))
    _notify(db, row.user_id, f"申请已通过：{post.title}", "发起人通过了你的申请，可以进入聊天约细节了。", f"#/life/buddy/activity?id={post.id}")
    db.commit()
    return ok({"id": row.id, "status": row.status}, "已通过申请")


@router.post("/applications/{app_id}/reject")
def reject_application(app_id: int, db: Session = Depends(get_db), user_id: int = Depends(current_user)):
    row = db.get(BuddyApplication, app_id)
    if not row:
        fail("申请不存在", "RESOURCE_NOT_FOUND", 404)
    is_invitee = (row.source or "apply") == "invite" and row.user_id == user_id
    if not is_invitee and row.post_owner_id != user_id:
        fail("无权处理该申请", "FORBIDDEN", 403)
    if row.status != "pending":
        fail("该申请已处理", "RULE_VIOLATION", 409)
    row.status = "rejected"
    row.processed_at = now_str()
    post = db.get(BuddyPost, row.post_id)
    _notify(db, row.user_id, f"申请未通过：{post.title if post else '活动'}", "发起人暂时没有通过这次申请，可以看看其他活动。", f"#/life/buddy")
    db.commit()
    return ok({"id": row.id, "status": row.status}, "已标记为未通过")


# ---------- 申请与消息 ----------


@router.get("/activity-applications")
def list_applications(role: str = Query(default="all"), db: Session = Depends(get_db), user_id: int = Depends(current_user)):
    rows = (
        db.query(BuddyApplication)
        .filter((BuddyApplication.user_id == user_id) | (BuddyApplication.post_owner_id == user_id))
        .order_by(BuddyApplication.id.desc())
        .all()
    )
    items = [application_dict(db, row, user_id) for row in rows]
    received = [x for x in items if x["direction"] == "received_apply" and x["status"] == "pending"]
    invited = [x for x in items if x["direction"] == "received_invite" and x["status"] == "pending"]
    sent = [x for x in items if x["direction"] in ("sent_apply", "sent_invite")]
    if role == "received":
        return ok(received + invited)
    if role == "invited":
        return ok(invited)
    if role == "sent":
        return ok(sent)
    return ok({"received": received, "invited": invited, "sent": sent})


@router.get("/chats")
def list_chats(db: Session = Depends(get_db), user_id: int = Depends(current_user)):
    # 惰性投递到点的演示自动回复，保证未读数与最后一条消息是最新的
    due = db.query(BuddyAutoReply).filter(BuddyAutoReply.due_at <= now_str()).all()
    for item in due:
        db.add(
            BuddyChat(
                application_id=item.application_id,
                from_user_id=item.from_user_id,
                to_user_id=item.to_user_id,
                content=item.content,
                created_at=item.due_at,
            )
        )
        db.delete(item)
    if due:
        db.commit()
    rows = (
        db.query(BuddyApplication)
        .filter(
            ((BuddyApplication.user_id == user_id) | (BuddyApplication.post_owner_id == user_id)),
            BuddyApplication.status == "accepted",
        )
        .order_by(BuddyApplication.id.desc())
        .all()
    )
    result = []
    for row in rows:
        post = db.get(BuddyPost, row.post_id)
        peer_id = row.post_owner_id if row.user_id == user_id else row.user_id
        peer = _profile(db, peer_id)
        last = (
            db.query(BuddyChat)
            .filter(BuddyChat.application_id == row.id)
            .order_by(BuddyChat.id.desc())
            .first()
        )
        unread = (
            db.query(BuddyChat)
            .filter(
                BuddyChat.application_id == row.id,
                BuddyChat.from_user_id == peer_id,
                BuddyChat.to_user_id == user_id,
                BuddyChat.is_read == 0,
            )
            .count()
        )
        result.append(
            {
                "application_id": row.id,
                "post_id": row.post_id,
                "post_title": post.title if post else "（活动已删除）",
                "post_status": effective_status(post) if post else "removed",
                "peer_id": peer_id,
                "peer_nickname": peer.nickname if peer else "师大同学",
                "peer_emoji": ANIMAL_EMOJI.get(peer.animal_type if peer else "", "🐾"),
                "last_message": last.content if last else "",
                "last_at": last.created_at if last else row.created_at,
                "unread": unread,
            }
        )
    result.sort(key=lambda x: x["last_at"] or "", reverse=True)
    return ok(result)


def fail(message: str, code: str = "BAD_REQUEST", status_code: int = 400):
    from fastapi import HTTPException

    raise HTTPException(status_code=status_code, detail={"code": code, "message": message})


def ok(data=None, message: str = ""):
    return {"ok": True, "data": data, "message": message}