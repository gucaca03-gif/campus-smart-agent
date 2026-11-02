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
    status = Column(String(16), nullable=False, default="open")
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


class ChatMessage(Base):
    __tablename__ = "chat_messages"
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, nullable=False, default=1)
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
