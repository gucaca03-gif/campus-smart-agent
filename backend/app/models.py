from datetime import datetime

from sqlalchemy import Column, DateTime, Float, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import declarative_base

Base = declarative_base()


def now_str() -> str:
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(64), unique=True, nullable=False)
    display_name = Column(String(64), nullable=False)
    college = Column(String(64), nullable=False, default="人工智能与计算机学院")
    role = Column(String(16), nullable=False, default="student")


class SchoolMetric(Base):
    __tablename__ = "school_metrics"
    id = Column(Integer, primary_key=True, autoincrement=True)
    key = Column(String(64), unique=True, nullable=False)
    label = Column(String(64), nullable=False)
    value = Column(String(64), nullable=False, default="")
    unit = Column(String(16), nullable=False, default="")
    source_url = Column(String(255), nullable=False, default="")
    status = Column(String(16), nullable=False, default="verified")
    note = Column(String(255), nullable=False, default="")


class Campus(Base):
    __tablename__ = "campuses"
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(32), unique=True, nullable=False)
    address = Column(String(128), nullable=False)
    postcode = Column(String(16), nullable=False, default="")
    lat = Column(Float, nullable=False, default=0)
    lng = Column(Float, nullable=False, default=0)
    note = Column(String(255), nullable=False, default="")


class CalendarEvent(Base):
    __tablename__ = "calendar_events"
    id = Column(Integer, primary_key=True, autoincrement=True)
    term = Column(String(32), nullable=False)
    title = Column(String(128), nullable=False)
    start_date = Column(String(16), nullable=False)
    end_date = Column(String(16), nullable=False, default="")
    type = Column(String(16), nullable=False, default="event")
    status = Column(String(16), nullable=False, default="confirmed")
    source_url = Column(String(255), nullable=False, default="")


class Place(Base):
    __tablename__ = "places"
    id = Column(Integer, primary_key=True, autoincrement=True)
    campus_id = Column(Integer, nullable=False, default=1)
    name = Column(String(64), nullable=False)
    alias = Column(String(255), nullable=False, default="")
    type = Column(String(32), nullable=False, default="building")
    lat = Column(Float, nullable=False, default=0)
    lng = Column(Float, nullable=False, default=0)
    entrance = Column(String(255), nullable=False, default="")
    verified = Column(Integer, nullable=False, default=0)
    source = Column(String(255), nullable=False, default="演示数据")


class Resource(Base):
    __tablename__ = "resources"
    id = Column(Integer, primary_key=True, autoincrement=True)
    type = Column(String(16), nullable=False, index=True)  # lab / classroom / seat
    name = Column(String(128), nullable=False)
    campus_id = Column(Integer, nullable=False, default=1)
    place_id = Column(Integer, nullable=True)
    room = Column(String(64), nullable=False, default="")
    capacity = Column(Integer, nullable=False, default=1)
    description = Column(Text, nullable=False, default="")
    equipment = Column(String(255), nullable=False, default="")
    audience = Column(String(64), nullable=False, default="全校")
    open_days = Column(String(32), nullable=False, default="1,2,3,4,5")
    open_start = Column(String(8), nullable=False, default="08:00")
    open_end = Column(String(8), nullable=False, default="17:10")
    advance_days = Column(Integer, nullable=False, default=7)
    approval_required = Column(Integer, nullable=False, default=1)
    status = Column(String(16), nullable=False, default="open")
    is_demo = Column(Integer, nullable=False, default=1)
    data_note = Column(String(255), nullable=False, default="演示数据，待校方核验")
    x = Column(Float, nullable=False, default=0)
    y = Column(Float, nullable=False, default=0)


class Slot(Base):
    __tablename__ = "slots"
    __table_args__ = (UniqueConstraint("resource_id", "date", "start_at", "end_at", name="uq_slot"),)
    id = Column(Integer, primary_key=True, autoincrement=True)
    resource_id = Column(Integer, nullable=False, index=True)
    date = Column(String(16), nullable=False, index=True)
    start_at = Column(String(8), nullable=False)
    end_at = Column(String(8), nullable=False)
    capacity = Column(Integer, nullable=False, default=1)
    booked = Column(Integer, nullable=False, default=0)
    status = Column(String(16), nullable=False, default="open")  # open / occupied / closed


class Booking(Base):
    __tablename__ = "bookings"
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, nullable=False, default=1)
    resource_id = Column(Integer, nullable=False)
    date = Column(String(16), nullable=False)
    start_at = Column(String(8), nullable=False)
    end_at = Column(String(8), nullable=False)
    purpose = Column(String(255), nullable=False, default="")
    people = Column(Integer, nullable=False, default=1)
    status = Column(String(24), nullable=False, default="pending_approval")
    code = Column(String(32), nullable=False, default="")
    idempotency_key = Column(String(64), nullable=False, default="")
    created_at = Column(String(32), nullable=False, default=now_str)
    checked_at = Column(String(32), nullable=False, default="")
    cancelled_at = Column(String(32), nullable=False, default="")
    type = Column(String(16), nullable=False, default="lab")
    away_count = Column(Integer, nullable=False, default=0)  # 本次预约已用暂离次数（上限 2）
    away_until = Column(String(32), nullable=False, default="")  # 暂离保留截止时间
    reservation_key = Column(String(64), nullable=False, default="", index=True)  # 一次多时段预约的组标识
    points_awarded = Column(Integer, nullable=False, default=0)  # 本次预约结算获得的积分
    settle_type = Column(String(24), nullable=False, default="")  # early_release/auto_end/away_timeout/supervised_release
    settled_at = Column(String(32), nullable=False, default="")


class BuddyPost(Base):
    __tablename__ = "buddy_posts"
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, nullable=False, default=1)
    type = Column(String(16), nullable=False)
    title = Column(String(128), nullable=False)
    content = Column(Text, nullable=False, default="")
    time_text = Column(String(64), nullable=False, default="")
    place = Column(String(64), nullable=False, default="")
    campus = Column(String(32), nullable=False, default="泉山校区")
    contact = Column(String(32), nullable=False, default="站内私信")
    status = Column(String(16), nullable=False, default="recruiting")  # recruiting/stopped/cancelled/finished/removed
    start_at = Column(String(32), nullable=False, default="")
    end_at = Column(String(32), nullable=False, default="")
    capacity = Column(Integer, nullable=False, default=4)
    requirements = Column(String(255), nullable=False, default="")
    signup_deadline = Column(String(32), nullable=False, default="")
    cancel_reason = Column(String(255), nullable=False, default="")
    stopped_at = Column(String(32), nullable=False, default="")
    cancelled_at = Column(String(32), nullable=False, default="")
    finished_at = Column(String(32), nullable=False, default="")
    created_at = Column(String(32), nullable=False, default=now_str)


class BuddyProfile(Base):
    __tablename__ = "buddy_profiles"
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, nullable=False, unique=True)
    nickname = Column(String(32), nullable=False, default="师大同学")
    animal_type = Column(String(16), nullable=False, default="")
    mbti = Column(String(8), nullable=False, default="")
    interests = Column(Text, nullable=False, default="[]")
    active_time = Column(String(16), nullable=False, default="夜猫")
    college = Column(String(64), nullable=False, default="")
    visibility = Column(String(16), nullable=False, default="public")
    reading = Column(Text, nullable=False, default="")
    avatar = Column(String(64), nullable=False, default="")
    place = Column(String(64), nullable=False, default="")
    results = Column(Text, nullable=False, default="{}")
    created_at = Column(String(32), nullable=False, default=now_str)
    updated_at = Column(String(32), nullable=False, default=now_str)


class BuddyMatchLog(Base):
    __tablename__ = "buddy_match_logs"
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, nullable=False, default=1)
    matched_user_id = Column(Integer, nullable=False)
    post_id = Column(Integer, nullable=False, default=0)
    score = Column(Integer, nullable=False, default=0)
    reason = Column(Text, nullable=False, default="")
    created_at = Column(String(32), nullable=False, default=now_str)


class DealPost(Base):
    __tablename__ = "deal_posts"
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, nullable=False, default=1)
    product = Column(String(128), nullable=False)
    price_cent = Column(Integer, nullable=False, default=0)
    reason = Column(Text, nullable=False, default="")
    category = Column(String(32), nullable=False, default="其他")
    status = Column(String(16), nullable=False, default="open")
    created_at = Column(String(32), nullable=False, default=now_str)


class DealVote(Base):
    __tablename__ = "deal_votes"
    __table_args__ = (UniqueConstraint("post_id", "user_id", name="uq_deal_vote"),)
    id = Column(Integer, primary_key=True, autoincrement=True)
    post_id = Column(Integer, nullable=False)
    user_id = Column(Integer, nullable=False, default=1)
    vote = Column(String(16), nullable=False, default="think")
    reason = Column(Text, nullable=False, default="")


class PurchaseIntent(Base):
    __tablename__ = "purchase_intents"
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, nullable=False, default=1)
    name = Column(String(128), nullable=False)
    price_cent = Column(Integer, nullable=False, default=0)
    status = Column(String(16), nullable=False, default="pending")
    created_at = Column(String(32), nullable=False, default=now_str)
    decided_at = Column(String(32), nullable=False, default="")


class Errand(Base):
    __tablename__ = "errands"
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, nullable=False, default=1)
    type = Column(String(16), nullable=False, default="express")  # express / lost / help
    title = Column(String(128), nullable=False)
    pickup = Column(String(128), nullable=False, default="")
    destination = Column(String(128), nullable=False, default="")
    reward = Column(String(32), nullable=False, default="")
    time_window = Column(String(64), nullable=False, default="")
    note = Column(Text, nullable=False, default="")
    status = Column(String(16), nullable=False, default="open")
    runner_id = Column(Integer, nullable=True)
    created_at = Column(String(32), nullable=False, default=now_str)


class LostFound(Base):
    __tablename__ = "lost_found"
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, nullable=False, default=1)
    type = Column(String(16), nullable=False, default="found")  # lost / found
    name = Column(String(128), nullable=False)
    place = Column(String(64), nullable=False, default="")
    happened_at = Column(String(32), nullable=False, default="")
    description = Column(Text, nullable=False, default="")
    contact = Column(String(64), nullable=False, default="站内私信")
    status = Column(String(16), nullable=False, default="open")
    created_at = Column(String(32), nullable=False, default=now_str)


class News(Base):
    __tablename__ = "news"
    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String(200), nullable=False)
    summary = Column(String(300), nullable=False, default="")
    content = Column(Text, nullable=False, default="")
    content_images = Column(Text, nullable=False, default="[]")
    source = Column(String(64), nullable=False, default="江苏师范大学")
    source_url = Column(String(255), nullable=False, default="")
    category = Column(String(32), nullable=False, default="通知公告")
    college = Column(String(64), nullable=False, default="全校")
    published_at = Column(String(16), nullable=False, default="")
    status = Column(String(16), nullable=False, default="published")


class OfficeReview(Base):
    __tablename__ = "office_reviews"
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, nullable=False, default=1)
    applicant_name = Column(String(64), nullable=False, default="")
    student_id = Column(String(32), nullable=False, default="")
    achievement_title = Column(String(200), nullable=False, default="")
    award_type = Column(String(32), nullable=False, default="")
    award_level = Column(String(32), nullable=False, default="")
    award_date = Column(String(16), nullable=False, default="")
    material_name = Column(String(128), nullable=False, default="")
    material_text = Column(Text, nullable=False, default="")
    report = Column(Text, nullable=False, default="{}")
    verdict = Column(String(16), nullable=False, default="warn")
    created_at = Column(String(32), nullable=False, default=now_str)


class Repair(Base):
    __tablename__ = "repairs"
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, nullable=False, default=1)
    location = Column(String(128), nullable=False, default="")
    area = Column(String(32), nullable=False, default="宿舍")
    category = Column(String(32), nullable=False, default="其他")
    title = Column(String(120), nullable=False, default="")
    description = Column(Text, nullable=False, default="")
    urgency = Column(String(16), nullable=False, default="normal")
    contact = Column(String(64), nullable=False, default="")
    status = Column(String(16), nullable=False, default="submitted")
    reply = Column(Text, nullable=False, default="")
    created_at = Column(String(32), nullable=False, default=now_str)


class ResourceLink(Base):
    __tablename__ = "resource_links"
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(128), nullable=False)
    url = Column(String(255), nullable=False)
    category = Column(String(32), nullable=False)
    audience = Column(String(64), nullable=False, default="全校")
    need_login = Column(Integer, nullable=False, default=0)
    need_campus_net = Column(Integer, nullable=False, default=0)
    status = Column(String(16), nullable=False, default="available")
    note = Column(String(255), nullable=False, default="")


class FitnessProfile(Base):
    __tablename__ = "fitness_profiles"
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, unique=True, nullable=False, default=1)
    height_cm = Column(Integer, nullable=False, default=0)
    weight_kg = Column(Float, nullable=False, default=0)
    goal = Column(String(32), nullable=False, default="保持")
    activity = Column(String(32), nullable=False, default="轻度")
    constraints = Column(String(255), nullable=False, default="")
    consent = Column(Integer, nullable=False, default=0)
    updated_at = Column(String(32), nullable=False, default=now_str)


class MealLog(Base):
    __tablename__ = "meal_logs"
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, nullable=False, default=1)
    meal_type = Column(String(16), nullable=False, default="午餐")
    description = Column(String(255), nullable=False)
    calories = Column(Integer, nullable=False, default=0)
    protein = Column(Integer, nullable=False, default=0)
    created_at = Column(String(32), nullable=False, default=now_str)


class StudyPlan(Base):
    __tablename__ = "study_plans"
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, nullable=False, default=1)
    title = Column(String(128), nullable=False)
    start_date = Column(String(16), nullable=False)
    end_date = Column(String(16), nullable=False)
    status = Column(String(16), nullable=False, default="active")


class PlanItem(Base):
    __tablename__ = "plan_items"
    id = Column(Integer, primary_key=True, autoincrement=True)
    plan_id = Column(Integer, nullable=False)
    title = Column(String(128), nullable=False)
    day = Column(String(16), nullable=False, default="")
    start_at = Column(String(8), nullable=False, default="")
    end_at = Column(String(8), nullable=False, default="")
    status = Column(String(16), nullable=False, default="todo")


class Pomodoro(Base):
    __tablename__ = "pomodoros"
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, nullable=False, default=1)
    task = Column(String(128), nullable=False, default="")
    minutes = Column(Integer, nullable=False, default=25)
    started_at = Column(String(32), nullable=False, default=now_str)
    ended_at = Column(String(32), nullable=False, default="")
    status = Column(String(16), nullable=False, default="running")


class ChatSession(Base):
    __tablename__ = "chat_sessions"
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, nullable=False, default=1, index=True)
    title = Column(String(64), nullable=False, default="新对话")
    created_at = Column(String(32), nullable=False, default=now_str)
    updated_at = Column(String(32), nullable=False, default=now_str)


class ChatMessage(Base):
    __tablename__ = "chat_messages"
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, nullable=False, default=1)
    session_id = Column(Integer, nullable=True, index=True)
    role = Column(String(16), nullable=False)
    content = Column(Text, nullable=False)
    meta = Column(Text, nullable=False, default="")
    created_at = Column(String(32), nullable=False, default=now_str)

class SelfTask(Base):
    __tablename__ = "self_tasks"
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, nullable=False, default=1)
    title = Column(String(128), nullable=False)
    scene = Column(String(16), nullable=False, default="work")
    paper_id = Column(Integer, nullable=True)
    due_at = Column(String(16), nullable=False, default="")
    estimate_min = Column(Integer, nullable=False, default=30)
    priority = Column(String(8), nullable=False, default="P1")
    status = Column(String(16), nullable=False, default="inbox")
    next_action = Column(String(255), nullable=False, default="")
    source = Column(String(16), nullable=False, default="manual")
    plan_date = Column(String(16), nullable=False, default="")
    postpone_reason = Column(String(32), nullable=False, default="")
    postpone_count = Column(Integer, nullable=False, default=0)
    created_at = Column(String(32), nullable=False, default=now_str)
    completed_at = Column(String(32), nullable=False, default="")


class SelfSchedule(Base):
    __tablename__ = "self_schedules"
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, nullable=False, default=1)
    task_id = Column(Integer, nullable=True)
    title = Column(String(128), nullable=False)
    start_at = Column(String(32), nullable=False)
    end_at = Column(String(32), nullable=False)
    kind = Column(String(16), nullable=False, default="flexible")
    status = Column(String(16), nullable=False, default="planned")
    created_at = Column(String(32), nullable=False, default=now_str)


class SelfCheckin(Base):
    __tablename__ = "self_checkins"
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, nullable=False, default=1)
    date = Column(String(16), nullable=False)
    sleep_hours = Column(Float, nullable=False, default=7)
    energy = Column(Integer, nullable=False, default=3)
    mood = Column(Integer, nullable=False, default=3)
    note = Column(String(255), nullable=False, default="")
    created_at = Column(String(32), nullable=False, default=now_str)
    __table_args__ = (UniqueConstraint("user_id", "date", name="uq_self_checkin_user_date"),)


class SelfNote(Base):
    __tablename__ = "self_notes"
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, nullable=False, default=1)
    content = Column(Text, nullable=False)
    kind = Column(String(16), nullable=False, default="idea")
    tags = Column(String(128), nullable=False, default="")
    source = Column(String(16), nullable=False, default="quick")
    task_id = Column(Integer, nullable=True)
    created_at = Column(String(32), nullable=False, default=now_str)


class SelfReview(Base):
    __tablename__ = "self_reviews"
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, nullable=False, default=1)
    week_start = Column(String(16), nullable=False)
    summary = Column(Text, nullable=False, default="")
    focus1 = Column(String(255), nullable=False, default="")
    focus2 = Column(String(255), nullable=False, default="")
    focus3 = Column(String(255), nullable=False, default="")
    created_at = Column(String(32), nullable=False, default=now_str)
    __table_args__ = (UniqueConstraint("user_id", "week_start", name="uq_self_review_user_week"),)


class SelfPaper(Base):
    __tablename__ = "self_papers"
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, nullable=False, default=1)
    title = Column(String(160), nullable=False)
    role = Column(String(16), nullable=False, default="一作")
    stage = Column(String(16), nullable=False, default="选题")
    venue = Column(String(64), nullable=False, default="")
    deadline = Column(String(16), nullable=False, default="")
    blocker = Column(String(255), nullable=False, default="")
    blocker_since = Column(String(32), nullable=False, default="")
    next_action = Column(String(255), nullable=False, default="")
    created_at = Column(String(32), nullable=False, default=now_str)


class SelfXp(Base):
    __tablename__ = "self_xp"
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, nullable=False, default=1)
    action = Column(String(32), nullable=False)
    xp = Column(Integer, nullable=False, default=0)
    ref_id = Column(Integer, nullable=True)
    created_at = Column(String(32), nullable=False, default=now_str)


class SelfTheme(Base):
    __tablename__ = "self_themes"
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, nullable=False, default=1)
    code = Column(String(16), nullable=False)
    unlocked_at = Column(String(32), nullable=False, default=now_str)
    __table_args__ = (UniqueConstraint("user_id", "code", name="uq_self_theme_user_code"),)


class SelfThemeState(Base):
    __tablename__ = "self_theme_state"
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, nullable=False, unique=True, default=1)
    code = Column(String(16), nullable=False, default="default")
    updated_at = Column(String(32), nullable=False, default=now_str)


class KnowledgeChunk(Base):
    __tablename__ = "knowledge_chunks"
    id = Column(Integer, primary_key=True, autoincrement=True)
    source = Column(String(128), nullable=False, default="")
    title = Column(String(200), nullable=False, default="")
    chunk_index = Column(Integer, nullable=False, default=0)
    content = Column(Text, nullable=False, default="")
    created_at = Column(String(32), nullable=False, default=now_str)


class BuddyApplication(Base):
    __tablename__ = "buddy_applications"
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, nullable=False, default=1)  # 申请人
    post_id = Column(Integer, nullable=False)
    post_owner_id = Column(Integer, nullable=False)  # 帖子作者
    message = Column(Text, nullable=False, default="")
    status = Column(String(16), nullable=False, default="pending")  # pending/accepted/rejected/withdrawn
    source = Column(String(16), nullable=False, default="apply")  # apply=申请参加 / invite=邀请参加
    auto_accept_at = Column(String(32), nullable=False, default="")
    processed_at = Column(String(32), nullable=False, default="")
    created_at = Column(String(32), nullable=False, default=now_str)


class BuddyChat(Base):
    __tablename__ = "buddy_chats"
    id = Column(Integer, primary_key=True, autoincrement=True)
    application_id = Column(Integer, nullable=False)
    from_user_id = Column(Integer, nullable=False)
    to_user_id = Column(Integer, nullable=False)
    content = Column(Text, nullable=False, default="")
    is_read = Column(Integer, nullable=False, default=0)
    created_at = Column(String(32), nullable=False, default=now_str)


class BuddyAutoReply(Base):
    """演示搭子延迟回复队列：到点后由消息列表接口惰性落成聊天记录。"""
    __tablename__ = "buddy_auto_replies"
    id = Column(Integer, primary_key=True, autoincrement=True)
    application_id = Column(Integer, nullable=False, index=True)
    from_user_id = Column(Integer, nullable=False)
    to_user_id = Column(Integer, nullable=False, default=1)
    content = Column(Text, nullable=False, default="")
    due_at = Column(String(32), nullable=False, default=now_str)
    created_at = Column(String(32), nullable=False, default=now_str)


class SeatFavorite(Base):
    __tablename__ = "seat_favorites"
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, nullable=False, default=1)
    seat_id = Column(Integer, nullable=False)
    created_at = Column(String(32), nullable=False, default=now_str)
    __table_args__ = (UniqueConstraint("user_id", "seat_id", name="uq_seat_fav"),)


class Supervision(Base):
    __tablename__ = "library_supervisions"
    id = Column(Integer, primary_key=True, autoincrement=True)
    supervisor_id = Column(Integer, nullable=False, default=1)
    seat_id = Column(Integer, nullable=False)
    room = Column(String(64), nullable=False, default="")
    seat_no = Column(String(32), nullable=False, default="")
    reason = Column(Text, nullable=False, default="")
    photo = Column(Text, nullable=False, default="")  # base64 缩略图
    status = Column(String(16), nullable=False, default="active")  # active/released/confirmed
    deadline = Column(String(32), nullable=False, default="")
    created_at = Column(String(32), nullable=False, default=now_str)

class Message(Base):
    __tablename__ = "messages"
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, nullable=False, default=1)
    category = Column(String(16), nullable=False, default="新闻")  # 上课/待办/新闻/省钱/搭子/预约
    title = Column(String(128), nullable=False, default="")
    content = Column(Text, nullable=False, default="")
    action_text = Column(String(64), nullable=False, default="")
    action_url = Column(String(255), nullable=False, default="")
    is_read = Column(Integer, nullable=False, default=0)
    created_at = Column(String(32), nullable=False, default=now_str)

# ================= 省一省 · 理性消费决策助手 =================
# 金额统一为整数「分」，币种字段统一存 ISO 代码；时间统一为本地时间字符串。
# 价格快照只追加、不覆盖，保证历史可追溯。


class DataSource(Base):
    __tablename__ = "deal_data_sources"
    id = Column(Integer, primary_key=True, autoincrement=True)
    key = Column(String(32), nullable=False, unique=True)
    name = Column(String(64), nullable=False, default="")
    capabilities = Column(String(255), nullable=False, default="")  # JSON: search/quote/history
    status = Column(String(16), nullable=False, default="unconfigured")  # enabled/unconfigured/disabled
    note = Column(Text, nullable=False, default="")
    updated_at = Column(String(32), nullable=False, default=now_str)


class Product(Base):
    __tablename__ = "deal_products"
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, nullable=False, default=1)
    name = Column(String(128), nullable=False)
    brand = Column(String(64), nullable=False, default="")
    category = Column(String(32), nullable=False, default="其他")
    model = Column(String(64), nullable=False, default="")
    sku = Column(String(64), nullable=False, default="")
    specs = Column(Text, nullable=False, default="{}")  # JSON，键随类别变化
    qty = Column(Integer, nullable=False, default=1)
    condition = Column(String(16), nullable=False, default="new")  # new/used/refurb
    platform = Column(String(32), nullable=False, default="")
    merchant = Column(String(64), nullable=False, default="")
    url = Column(String(512), nullable=False, default="")
    image = Column(String(512), nullable=False, default="")
    price_cent = Column(Integer, nullable=False, default=0)
    currency = Column(String(8), nullable=False, default="CNY")
    source = Column(String(16), nullable=False, default="manual")  # manual/link
    confirmed = Column(Integer, nullable=False, default=0)
    note = Column(Text, nullable=False, default="")
    created_at = Column(String(32), nullable=False, default=now_str)


class Quote(Base):
    __tablename__ = "deal_quotes"
    id = Column(Integer, primary_key=True, autoincrement=True)
    product_id = Column(Integer, nullable=False, index=True)
    source_key = Column(String(32), nullable=False, default="manual")
    platform = Column(String(32), nullable=False, default="")
    merchant = Column(String(64), nullable=False, default="")
    spec = Column(String(128), nullable=False, default="")
    price_cent = Column(Integer, nullable=False, default=0)
    coupon_cent = Column(Integer, nullable=False, default=0)
    shipping_cent = Column(Integer, nullable=False, default=0)
    fee_cent = Column(Integer, nullable=False, default=0)
    qty = Column(Integer, nullable=False, default=1)
    currency = Column(String(8), nullable=False, default="CNY")
    conditions = Column(String(255), nullable=False, default="")  # 会员/新客/学生认证等
    url = Column(String(512), nullable=False, default="")
    stock = Column(String(32), nullable=False, default="unknown")  # in_stock/out_of_stock/unknown
    region = Column(String(32), nullable=False, default="")
    fetched_at = Column(String(32), nullable=False, default=now_str)
    observed_at = Column(String(32), nullable=False, default=now_str)
    cost_complete = Column(Integer, nullable=False, default=1)  # 0=运费/资格未知，成本不完整
    match_level = Column(String(16), nullable=False, default="exact")  # exact/suspect/series/alternative
    match_note = Column(String(128), nullable=False, default="")
    note = Column(Text, nullable=False, default="")


class PriceSnapshot(Base):
    __tablename__ = "deal_price_snapshots"
    id = Column(Integer, primary_key=True, autoincrement=True)
    quote_id = Column(Integer, nullable=False, index=True)
    product_id = Column(Integer, nullable=False, index=True)
    source_key = Column(String(32), nullable=False, default="manual")
    price_cent = Column(Integer, nullable=False, default=0)
    breakdown = Column(String(255), nullable=False, default="")  # JSON
    currency = Column(String(8), nullable=False, default="CNY")
    region = Column(String(32), nullable=False, default="")
    observed_at = Column(String(32), nullable=False, default=now_str)  # 数据源观测时间
    fetched_at = Column(String(32), nullable=False, default=now_str)  # 系统获取时间
    available = Column(Integer, nullable=False, default=1)
    quality = Column(String(16), nullable=False, default="ok")  # ok/suspect/missing
    note = Column(Text, nullable=False, default="")


class DealPriceCache(Base):
    __tablename__ = "deal_price_cache"
    id = Column(Integer, primary_key=True, autoincrement=True)
    cache_key = Column(String(160), nullable=False, unique=True)
    payload = Column(Text, nullable=False, default="")
    created_at = Column(String(32), nullable=False, default=now_str)
    updated_at = Column(String(32), nullable=False, default=now_str)


class PurchasePlan(Base):
    __tablename__ = "deal_plans"
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, nullable=False, default=1, index=True)
    product_id = Column(Integer, nullable=False)
    title = Column(String(128), nullable=False, default="")
    budget_cent = Column(Integer, nullable=False, default=0)
    price_cent = Column(Integer, nullable=False, default=0)  # 预计价格
    scene = Column(String(255), nullable=False, default="")
    reason = Column(Text, nullable=False, default="")
    urgency = Column(String(16), nullable=False, default="normal")  # urgent/soon/normal/can_wait
    frequency = Column(String(16), nullable=False, default="daily")  # daily/weekly/monthly/seldom
    existing_items = Column(Text, nullable=False, default="")
    alternative = Column(Text, nullable=False, default="")
    wait_days = Column(Integer, nullable=False, default=7)
    visibility = Column(String(16), nullable=False, default="private")  # private/group/public
    group_id = Column(Integer, nullable=True)
    end_mode = Column(String(16), nullable=False, default="target_votes")  # target_votes/deadline
    target_votes = Column(Integer, nullable=False, default=5)
    deadline = Column(String(32), nullable=False, default="")
    discuss_status = Column(String(16), nullable=False, default="draft")  # draft/discussing/ended/cancelled
    decision_status = Column(String(16), nullable=False, default="undecided")  # undecided/cooling/purchased/deferred/abandoned
    decide_reason = Column(Text, nullable=False, default="")
    cool_until = Column(String(32), nullable=False, default="")
    created_at = Column(String(32), nullable=False, default=now_str)
    updated_at = Column(String(32), nullable=False, default=now_str)


class PlanVersion(Base):
    __tablename__ = "deal_plan_versions"
    id = Column(Integer, primary_key=True, autoincrement=True)
    plan_id = Column(Integer, nullable=False, index=True)
    version = Column(Integer, nullable=False, default=1)
    snapshot = Column(Text, nullable=False, default="{}")  # JSON 关键字段快照
    changed_fields = Column(String(255), nullable=False, default="")
    created_at = Column(String(32), nullable=False, default=now_str)


class PlanGroup(Base):
    __tablename__ = "deal_groups"
    id = Column(Integer, primary_key=True, autoincrement=True)
    owner_id = Column(Integer, nullable=False, default=1)
    name = Column(String(64), nullable=False)
    visibility = Column(String(16), nullable=False, default="private")  # private/public
    created_at = Column(String(32), nullable=False, default=now_str)


class GroupMember(Base):
    __tablename__ = "deal_group_members"
    __table_args__ = (UniqueConstraint("group_id", "user_id", name="uq_group_member"),)
    id = Column(Integer, primary_key=True, autoincrement=True)
    group_id = Column(Integer, nullable=False, index=True)
    user_id = Column(Integer, nullable=False)
    role = Column(String(16), nullable=False, default="member")  # owner/member
    status = Column(String(16), nullable=False, default="active")  # active/pending
    created_at = Column(String(32), nullable=False, default=now_str)


class PlanVote(Base):
    __tablename__ = "deal_plan_votes"
    __table_args__ = (UniqueConstraint("plan_id", "user_id", name="uq_plan_vote"),)
    id = Column(Integer, primary_key=True, autoincrement=True)
    plan_id = Column(Integer, nullable=False, index=True)
    user_id = Column(Integer, nullable=False)
    choice = Column(String(16), nullable=False)  # buy/suggest/wait/against
    created_at = Column(String(32), nullable=False, default=now_str)


class PlanComment(Base):
    __tablename__ = "deal_plan_comments"
    id = Column(Integer, primary_key=True, autoincrement=True)
    plan_id = Column(Integer, nullable=False, index=True)
    user_id = Column(Integer, nullable=False)
    parent_id = Column(Integer, nullable=True)
    content = Column(Text, nullable=False)
    used_it = Column(Integer, nullable=False, default=0)  # 自述用过（非官方认证）
    evidence_level = Column(String(16), nullable=False, default="self_declared")  # self_declared/verified
    helpful = Column(Integer, nullable=False, default=0)
    created_at = Column(String(32), nullable=False, default=now_str)


class PlanResult(Base):
    __tablename__ = "deal_plan_results"
    plan_id = Column(Integer, primary_key=True)  # 主键即幂等锁：并发结算只会成功一次
    settle_reason = Column(String(32), nullable=False, default="")
    counts = Column(String(255), nullable=False, default="{}")
    total = Column(Integer, nullable=False, default=0)
    tie = Column(Integer, nullable=False, default=0)
    settled_at = Column(String(32), nullable=False, default=now_str)


class PriceAlert(Base):
    __tablename__ = "deal_price_alerts"
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, nullable=False, default=1)
    plan_id = Column(Integer, nullable=False, index=True)
    quote_id = Column(Integer, nullable=True)
    rule_type = Column(String(16), nullable=False, default="target_price")  # target_price/pct_drop/new_low
    target_price_cent = Column(Integer, nullable=False, default=0)
    pct = Column(Integer, nullable=False, default=5)
    reference_price_cent = Column(Integer, nullable=False, default=0)
    enabled = Column(Integer, nullable=False, default=1)
    cooldown_min = Column(Integer, nullable=False, default=1440)
    last_fired_at = Column(String(32), nullable=False, default="")
    created_at = Column(String(32), nullable=False, default=now_str)


class AlertLog(Base):
    __tablename__ = "deal_alert_logs"
    __table_args__ = (UniqueConstraint("alert_id", "dedup_key", name="uq_alert_dedup"),)
    id = Column(Integer, primary_key=True, autoincrement=True)
    alert_id = Column(Integer, nullable=False, index=True)
    price_cent = Column(Integer, nullable=False, default=0)
    dedup_key = Column(String(64), nullable=False, default="")
    fired_at = Column(String(32), nullable=False, default=now_str)


class EvidenceSource(Base):
    __tablename__ = "deal_evidence"
    id = Column(Integer, primary_key=True, autoincrement=True)
    product_id = Column(Integer, nullable=False, index=True)
    type = Column(String(16), nullable=False, default="official")  # official/media/campus/vendor/ai_summary
    title = Column(String(200), nullable=False, default="")
    author = Column(String(128), nullable=False, default="")
    url = Column(String(512), nullable=False, default="")
    published_at = Column(String(32), nullable=False, default="")
    fetched_at = Column(String(32), nullable=False, default=now_str)
    models = Column(String(128), nullable=False, default="")
    test_conditions = Column(Text, nullable=False, default="")
    conclusion = Column(Text, nullable=False, default="")
    sponsorship = Column(String(128), nullable=False, default="")
    note = Column(Text, nullable=False, default="")


class PurchaseRecord(Base):
    __tablename__ = "deal_purchase_records"
    id = Column(Integer, primary_key=True, autoincrement=True)
    plan_id = Column(Integer, nullable=False, unique=True)
    user_id = Column(Integer, nullable=False, default=1)
    channel = Column(String(64), nullable=False, default="")
    spec = Column(String(128), nullable=False, default="")
    paid_cent = Column(Integer, nullable=False, default=0)
    bought_at = Column(String(32), nullable=False, default="")
    receipt = Column(Text, nullable=False, default="")  # 默认私密，不外露
    experience = Column(Text, nullable=False, default="")
    regret = Column(String(16), nullable=False, default="")  # yes/no/mixed
    recommend = Column(String(16), nullable=False, default="")  # yes/no/unknown
    private = Column(Integer, nullable=False, default=1)
    created_at = Column(String(32), nullable=False, default=now_str)


class DealReport(Base):
    __tablename__ = "deal_reports"
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, nullable=False, default=1)
    target_type = Column(String(16), nullable=False, default="comment")  # plan/comment
    target_id = Column(Integer, nullable=False)
    reason = Column(Text, nullable=False, default="")
    status = Column(String(16), nullable=False, default="pending")  # pending/removed/dismissed
    created_at = Column(String(32), nullable=False, default=now_str)
