import json
import math
import os
import re
import urllib.parse
import urllib.request
import uuid
from datetime import date, datetime, timedelta

from sqlalchemy.orm import Session

from . import tools
from .models import (
    Booking,
    CalendarEvent,
    Campus,
    Place,
    Resource,
    SchoolMetric,
    Slot,
    SelfXp,
    Supervision,
)

SEAT_GEO_RADIUS_M = 500  # 敬文图书馆定位签到允许半径（米）
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
        # 空教室全天 5 节次均可约（工作日晚间/周末不再区分；排课占用见 ensure_slots）
        return [
            ("08:00", "09:40"),
            ("10:10", "11:50"),
            ("14:00", "15:40"),
            ("16:00", "17:40"),
            ("18:30", "20:40"),
        ]
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
        "away_count": int(booking.away_count or 0),
        "away_until": booking.away_until or "",
        "reservation_key": booking.reservation_key or "",
        "points_awarded": int(booking.points_awarded or 0),
        "settle_type": booking.settle_type or "",
        "settled_at": booking.settled_at or "",
    }


def _slots_for_span(db: Session, resource_id: int, date_str: str, start: str, end: str) -> list:
    """返回 [start, end] 区间覆盖的全部时段（支持连续多时段合并预约）。"""
    return (
        db.query(Slot)
        .filter(
            Slot.resource_id == resource_id,
            Slot.date == date_str,
            Slot.start_at >= start,
            Slot.end_at <= end,
        )
        .order_by(Slot.start_at)
        .all()
    )


def _rollback_slots(db: Session, booking: Booking):
    """回滚一条预约占用的全部时段（兼容合并区间预约）。"""
    for slot in _slots_for_span(db, booking.resource_id, booking.date, booking.start_at, booking.end_at):
        slot.booked = max(0, slot.booked - booking.people)


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
    if resource.type == "classroom":
        # 周次制：仅可预约本周；周日 20:00 后解锁下周
        monday = today - timedelta(days=today.weekday())
        sunday = monday + timedelta(days=6)
        next_monday = monday + timedelta(days=7)
        next_sunday = monday + timedelta(days=13)
        unlocked_next = today.isoweekday() == 7 and datetime.now().hour >= 20
        if not ((monday <= day <= sunday) or (unlocked_next and next_monday <= day <= next_sunday)):
            return False, "空教室以周次为单位：仅可预约本周（本周日 20:00 后开放下周）", None
        if day == today:
            try:
                start_dt = datetime.strptime(f"{day.isoformat()} {start}", "%Y-%m-%d %H:%M")
            except (TypeError, ValueError):
                return False, "预约时间格式不正确", None
            if start_dt <= datetime.now():
                return False, "该节次已开始，无法预约，请选择后面的时段", None
    slots = ensure_slots(db, resource, day)
    covered = _slots_for_span(db, resource.id, day.isoformat(), start, end)
    if not covered:
        return False, "所选时段不在开放时段内", None
    for slot in covered:
        if slot.status == "occupied":
            return False, "该时段已被排课或临时占用", None
        if slot.status == "closed":
            return False, "该时段不开放", None
        if slot.booked + people > slot.capacity:
            return False, "该时段剩余容量不足", None
    day_str = day.isoformat()
    overlaps = (
        db.query(Booking)
        .filter(
            Booking.resource_id == resource.id,
            Booking.date == day_str,
            Booking.start_at < end,
            Booking.end_at > start,
            Booking.status.in_(["pending_approval", "confirmed", "checked_in", "away"]),
        )
        .first()
    )
    if overlaps:
        return False, "该时段已被预约", None
    return True, "", covered


def create_booking(db: Session, payload: dict, user_id: int = 1, college: str = "人工智能与计算机学院", seat_busy=None) -> tuple[dict | None, str]:
    resource = db.get(Resource, payload.get("resource_id"))
    if not resource:
        return None, "资源不存在"
    day = parse_date(payload.get("date"))
    start = payload.get("start_at", "")
    end = payload.get("end_at", "")
    people = max(1, int(payload.get("people") or 1))
    reservation_key = str(payload.get("reservation_key") or uuid.uuid4().hex)
    ensure_slots(db, resource, day)  # 提交链路兜底：确保该日时段已生成
    ok, reason, covered = validate_booking(db, resource, day, start, end, people, college)
    if not ok or not covered:
        return None, reason

    # 连续性校验：合并预约的时段必须首尾相接且完整覆盖所选区间
    if covered[0].start_at != start or covered[-1].end_at != end:
        return None, "所选时段不连续，请重新选择连续的时段"
    for prev_s, next_s in zip(covered, covered[1:]):
        if prev_s.end_at != next_s.start_at:
            return None, "所选时段必须连续（如 08:00-10:00 与 10:00-12:00 须一起选择）"
    if len(covered) > 3:
        return None, "一次预约最多覆盖 3 个连续时段"
    if resource.type == "seat" and seat_busy:
        for slot in covered:
            if seat_busy(resource, day.isoformat(), slot.start_at, slot.end_at):
                return None, f"{slot.start_at}–{slot.end_at} 该座位已被占用，请重新选座"

    if resource.type == "seat":
        active_seat = ["pending_approval", "confirmed", "checked_in", "away"]
        other_plan = (
            db.query(Booking)
            .filter(
                Booking.user_id == user_id,
                Booking.type == "seat",
                Booking.date == day.isoformat(),
                Booking.reservation_key != reservation_key,
                Booking.status.in_(active_seat),
            )
            .first()
        )
        if other_plan:
            return None, "该日期已有座位预约：每位同学一天只能保留一次选座预约，请先在「我的」中取消原预约"

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
        reservation_key=reservation_key,
    )
    db.add(booking)
    for slot in covered:
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
    if booking.status in ("cancelled", "rejected", "no_show", "completed", "released"):
        return False, "当前状态不可取消"
    if booking.status in ("checked_in", "away"):
        return False, "已签到，无法取消预约"
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    if booking.type == "seat":
        group = _seat_group_all(db, booking, booking.user_id)
        if any(b.status in ("checked_in", "away") for b in group):
            return False, "已签到，无法取消预约"
        active = [b for b in group if b.status in ("pending_approval", "confirmed")]
        if not active:
            return False, "当前状态不可取消"
        for b in active:
            _rollback_slots(db, b)
            b.status = "cancelled"
            b.cancelled_at = now_str
            b.away_until = ""
        _close_supervisions(db, booking.resource_id, "released")
        db.commit()
        return True, "已取消本次座位预约（含全部时段）"
    _rollback_slots(db, booking)
    booking.status = "cancelled"
    booking.cancelled_at = now_str
    db.commit()
    return True, "已取消预约"


def _active_supervisions(db: Session, seat_id: int) -> list:
    return (
        db.query(Supervision)
        .filter(Supervision.seat_id == seat_id, Supervision.status == "active")
        .all()
    )


def _close_supervisions(db: Session, seat_id: int, status: str = "confirmed"):
    for sv in _active_supervisions(db, seat_id):
        sv.status = status


def _release_seat_booking(db: Session, booking: Booking):
    """释放座位：预约置为 released，回滚时段占用，并结束该座位上的监督。"""
    resource = db.get(Resource, booking.resource_id)
    _rollback_slots(db, booking)
    booking.status = "released"
    booking.away_until = ""
    _close_supervisions(db, booking.resource_id, "released")


def _minutes_between(start: str, end: str) -> int:
    try:
        sh, sm = (int(x) for x in start.split(":"))
        eh, em = (int(x) for x in end.split(":"))
        return max(0, (eh * 60 + em) - (sh * 60 + sm))
    except (ValueError, AttributeError):
        return 0


def _seat_group(db: Session, booking: Booking, user_id: int = 1) -> list:
    key = booking.reservation_key or ""
    q = db.query(Booking).filter(
        Booking.user_id == user_id,
        Booking.type == "seat",
        Booking.date == booking.date,
        Booking.status.in_(["confirmed", "checked_in", "away"]),
    )
    if key:
        q = q.filter(Booking.reservation_key == key)
    else:
        q = q.filter(Booking.id == booking.id)
    return q.order_by(Booking.id).all()


def _seat_group_all(db: Session, booking: Booking, user_id: int = 1) -> list:
    """同一预约组的全部记录（不按状态过滤）：多时段预约签到/暂离/签退都以组为单位。"""
    key = booking.reservation_key or ""
    q = db.query(Booking).filter(
        Booking.user_id == user_id,
        Booking.type == "seat",
        Booking.date == booking.date,
    )
    if key:
        q = q.filter(Booking.reservation_key == key)
    else:
        q = q.filter(Booking.id == booking.id)
    return q.order_by(Booking.start_at, Booking.id).all()


def _seat_group_key(booking: Booking) -> str:
    return booking.reservation_key or f"id:{booking.id}"


def _seat_checkin_window(booking: Booking):
    """返回 (可签到开始, 可签到截止)：预约开始前 15 分钟 ~ 开始后 15 分钟。"""
    try:
        start_at = datetime.strptime(f"{booking.date} {booking.start_at}", "%Y-%m-%d %H:%M")
    except (TypeError, ValueError):
        return None
    return start_at - timedelta(minutes=15), start_at + timedelta(minutes=15)


def _award_seat_points(db: Session, booking: Booking, xp: int, action: str, settle_type: str):
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    booking.points_awarded = max(0, int(xp))
    booking.settle_type = settle_type
    booking.settled_at = now
    if booking.points_awarded > 0:
        db.add(SelfXp(user_id=booking.user_id, action=action, xp=booking.points_awarded, ref_id=booking.id))


def release_seat_reservation(db: Session, booking_id: int, user_id: int = 1) -> tuple[bool, str, int]:
    """提前离场：按预约组结束本次预约，方案 A 下不再额外发时长积分。"""
    booking = db.get(Booking, booking_id)
    if not booking:
        return False, "预约不存在", 0
    if booking.user_id != user_id:
        return False, "只能释放自己的预约", 0
    if booking.type != "seat":
        return False, "仅图书馆座位支持提前释放", 0
    group = _seat_group_all(db, booking, user_id)
    if not any(b.status in ("checked_in", "away") for b in group):
        return False, "仅已签到或暂离中的座位可提前释放", 0
    for b in group:
        if b.status in ("confirmed", "checked_in", "away"):
            _release_seat_booking(db, b)
    _close_supervisions(db, booking.resource_id, "released")
    db.commit()
    return True, "已提前离场，本次签到积分保留，不再额外加时长积分", 0


def settle_finished_seat_bookings(db: Session) -> int:
    """到点自动完成：座位 / 教室统一处理，且不受日期限制（跨天也结算）。

    修复要点：
    1. 旧实现只处理"当天"的座位记录，导致历史 checked_in 永远停在"进行中"；
    2. 旧实现用 settled_at == "" 过滤，而图书馆签到时已写入 settled_at（积分幂等），
       导致已签到的座位永远不会被判定结束，长期停留在"进行中"；
    3. 保留签到积分，只补写结算状态，绝不覆盖 points_awarded；
    4. 预约结束后 10 分钟内仍允许签退，超过 10 分钟才自动完成。
    """
    now = datetime.now()
    now_str = now.strftime("%Y-%m-%d %H:%M:%S")
    grace = timedelta(minutes=10)
    rows = db.query(Booking).filter(Booking.status.in_(["checked_in", "away"])).all()
    changed = 0
    for b in rows:
        try:
            end_at = datetime.strptime(f"{b.date} {b.end_at}", "%Y-%m-%d %H:%M")
        except ValueError:
            continue
        if end_at + grace > now:
            continue
        b.status = "completed"
        b.away_until = ""
        if not b.settled_at:
            b.settled_at = now_str
        if not b.settle_type:
            b.settle_type = "auto_end"
        changed += 1
    if changed:
        db.commit()
    return changed


NO_SHOW_PENALTY_XP = 50  # 预约超时未签到扣积分


def expire_unchecked_bookings(db: Session) -> int:
    """开始后 15 分钟未签到：非座位逐条处理；座位按预约组处理，整组只扣一次分。

    同时兜底清理历史遗留的未签到记录（日期早已过去的也会被释放）。
    """
    now = datetime.now()
    now_str = now.strftime("%Y-%m-%d %H:%M:%S")
    deadline = timedelta(minutes=15)
    changed = 0

    rows = (
        db.query(Booking)
        .filter(Booking.type != "seat", Booking.status.in_(["confirmed", "pending_approval"]))
        .all()
    )
    for b in rows:
        try:
            start_at = datetime.strptime(f"{b.date} {b.start_at}", "%Y-%m-%d %H:%M")
        except ValueError:
            continue
        if start_at + deadline >= now:
            continue
        if b.settle_type == "no_show":
            continue
        b.status = "no_show"
        b.cancelled_at = now_str
        b.settle_type = "no_show"
        b.settled_at = now_str
        b.points_awarded = -NO_SHOW_PENALTY_XP
        _rollback_slots(db, b)
        db.add(SelfXp(user_id=b.user_id, action="no_show_penalty", xp=-NO_SHOW_PENALTY_XP, ref_id=b.id))
        changed += 1

    seat_rows = (
        db.query(Booking)
        .filter(Booking.type == "seat", Booking.status.in_(["confirmed", "pending_approval"]))
        .all()
    )
    groups = {}
    for b in seat_rows:
        groups.setdefault((b.user_id, _seat_group_key(b)), []).append(b)
    for members in groups.values():
        all_rows = _seat_group_all(db, members[0], members[0].user_id)
        starts = []
        for b in all_rows:
            try:
                starts.append(datetime.strptime(f"{b.date} {b.start_at}", "%Y-%m-%d %H:%M"))
            except ValueError:
                continue
        if not starts or min(starts) + deadline >= now:
            continue
        statuses = {b.status for b in all_rows}
        if statuses & {"checked_in", "away"}:
            # 兼容历史：组内已有人签到，其余同组时段直接补齐为已签到，不再扣分
            for b in all_rows:
                if b.status in ("confirmed", "pending_approval"):
                    b.status = "checked_in"
                    b.checked_at = now_str
                    changed += 1
            continue
        if statuses & {"completed", "released", "cancelled", "rejected"}:
            # 组已被释放或取消，剩余未处理记录不再按未签到扣分
            for b in all_rows:
                if b.status in ("confirmed", "pending_approval"):
                    b.status = "cancelled"
                    b.cancelled_at = now_str
                    _rollback_slots(db, b)
                    changed += 1
            continue
        rep = all_rows[0]
        for b in all_rows:
            if b.status not in ("confirmed", "pending_approval"):
                continue
            b.status = "no_show"
            b.cancelled_at = now_str
            b.settle_type = "no_show"
            b.settled_at = now_str
            b.points_awarded = -NO_SHOW_PENALTY_XP
            b.away_until = ""
            _rollback_slots(db, b)
        _close_supervisions(db, rep.resource_id, "released")
        db.add(SelfXp(user_id=rep.user_id, action="no_show_penalty", xp=-NO_SHOW_PENALTY_XP, ref_id=rep.id))
        changed += 1

    if changed:
        db.commit()
    return changed


def expire_seat_bookings(db: Session) -> int:
    """惰性结算暂离与监督超时（本项目无后台调度器）。"""
    settle_finished_seat_bookings(db)
    changed = expire_unchecked_bookings(db)
    now = datetime.now()
    away_rows = (
        db.query(Booking)
        .filter(Booking.type == "seat", Booking.status == "away", Booking.away_until != "")
        .all()
    )
    seen = set()
    for b in away_rows:
        key = _seat_group_key(b)
        if key in seen:
            continue
        group = _seat_group_all(db, b, b.user_id)
        timed_out = False
        for item in group:
            if item.status == "away" and item.away_until:
                try:
                    if datetime.strptime(item.away_until, "%Y-%m-%d %H:%M:%S") < now:
                        timed_out = True
                        break
                except ValueError:
                    continue
        if timed_out:
            for item in group:
                if item.status in ("confirmed", "checked_in", "away"):
                    _release_seat_booking(db, item)
            changed += 1
        seen.add(key)

    for sv in db.query(Supervision).filter(Supervision.status == "active", Supervision.deadline != "").all():
        try:
            deadline = datetime.strptime(sv.deadline, "%Y-%m-%d %H:%M:%S")
        except ValueError:
            continue
        if deadline < now:
            occupant = (
                db.query(Booking)
                .filter(
                    Booking.resource_id == sv.seat_id,
                    Booking.status.in_(["confirmed", "checked_in", "away"]),
                )
                .order_by(Booking.id.desc())
                .first()
            )
            if occupant:
                for item in _seat_group_all(db, occupant, occupant.user_id):
                    if item.status in ("confirmed", "checked_in", "away"):
                        _release_seat_booking(db, item)
            sv.status = "released"
            changed += 1

    if changed:
        db.commit()
    return changed


def checkin_booking(db: Session, booking_id: int, lat=None, lng=None, user_id: int = 1) -> tuple[bool, str]:
    """图书馆座位签到：必须开启真实定位且在敬文图书馆范围内。"""
    booking = db.get(Booking, booking_id)
    if not booking:
        return False, "预约不存在"
    if booking.user_id != user_id:
        return False, "只能签到自己的预约"
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    if booking.type == "seat":
        resource = db.get(Resource, booking.resource_id)
        place = db.get(Place, resource.place_id) if resource and resource.place_id else None
        if not place or "敬文图书馆" not in (place.name or ""):
            return False, "仅敬文图书馆的座位支持定位签到"
        if lat is None or lng is None:
            return False, "请开启浏览器定位并允许获取位置后再签到"
        try:
            distance = haversine({"lat": float(lat), "lng": float(lng)}, {"lat": place.lat, "lng": place.lng})
        except (TypeError, ValueError):
            return False, "定位数据无效，请重新获取位置"
        if distance > SEAT_GEO_RADIUS_M:
            return False, f"当前位置距敬文图书馆约 {int(distance)} 米，请到馆后再签到"

        group = _seat_group_all(db, booking, user_id) or [booking]
        statuses = {b.status for b in group}

        if "away" in statuses:
            for b in group:
                if b.status == "away" and b.away_until:
                    try:
                        if datetime.strptime(b.away_until, "%Y-%m-%d %H:%M:%S") < datetime.now():
                            for item in group:
                                if item.status in ("confirmed", "checked_in", "away"):
                                    _release_seat_booking(db, item)
                            db.commit()
                            return False, "已超过 30 分钟暂离时间，座位已自动释放"
                    except ValueError:
                        pass
            _close_supervisions(db, booking.resource_id, "confirmed")
            for b in group:
                if b.status in ("away", "confirmed"):
                    b.status = "checked_in"
                    b.away_until = ""
                    b.checked_at = now_str
            db.commit()
            return True, "已回到座位签到，暂离结束（整组时段）"

        if "checked_in" in statuses:
            for b in group:
                if b.status == "confirmed":
                    b.status = "checked_in"
                    b.checked_at = now_str
            if _active_supervisions(db, booking.resource_id):
                _close_supervisions(db, booking.resource_id, "confirmed")
                for b in group:
                    b.checked_at = now_str
                db.commit()
                return True, "已重新签到，监督占座解除"
            db.commit()
            return False, "该预约已签到"

        if statuses != {"confirmed"}:
            return False, "当前预约状态不可签到"

        window = _seat_checkin_window(group[0])
        if window:
            open_at, close_at = window
            now = datetime.now()
            if now < open_at:
                return False, f"签到未开始：{open_at.strftime('%m-%d %H:%M')} 起可签到（开始前 15 分钟开放）"
            if now > close_at:
                return False, f"已超过签到时间：需在 {close_at.strftime('%m-%d %H:%M')} 前签到，超过将按超时未签到处理"

        _close_supervisions(db, booking.resource_id, "confirmed")
        for b in group:
            b.status = "checked_in"
            b.checked_at = now_str
            b.away_until = ""
            b.settle_type = "checkin"
            b.settled_at = now_str
        rep = group[0]
        gids = [b.id for b in group]
        already = (db.query(SelfXp)
                   .filter(SelfXp.user_id == booking.user_id, SelfXp.action == "seat_checkin",
                           SelfXp.ref_id.in_(gids))
                   .first())
        message = "签到成功（整组时段已签到）"
        if not already:
            from .self_control import award_capped
            gained = award_capped(db, "seat_checkin", 10, rep.id, uid=booking.user_id, daily_cap=10)
            rep.points_awarded = 10 if gained else 0
            message = "签到成功（整组时段已签到），图书馆签到积分 +10" if gained else "签到成功（整组时段已签到），今日签到积分已达上限"
        db.commit()
        return True, message
    # 非座位资源沿用原流程
    if booking.status != "confirmed":
        return False, "仅已确认的预约可签到"
    booking.status = "checked_in"
    booking.checked_at = now_str
    db.commit()
    return True, "签到成功"


def away_booking(db: Session, booking_id: int, user_id: int = 1) -> tuple[bool, str]:
    """暂离：按预约组保留座位 30 分钟；同一预约最多 2 次暂离机会。"""
    booking = db.get(Booking, booking_id)
    if not booking:
        return False, "预约不存在"
    if booking.user_id != user_id:
        return False, "只能暂离自己的座位"
    if booking.type != "seat":
        return False, "仅图书馆座位支持暂离"
    group = _seat_group_all(db, booking, user_id) or [booking]
    if any(b.status == "away" for b in group):
        return False, "当前已处于暂离状态"
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    for b in group:
        if b.status == "confirmed":
            b.status = "checked_in"
            b.checked_at = now_str
    checked = [b for b in group if b.status == "checked_in"]
    if not checked:
        return False, "仅已签到的座位可暂离"
    used = sum(int(b.away_count or 0) for b in group)
    if used >= 2:
        return False, "本次预约的 2 次暂离机会已用完"
    away_until = (datetime.now() + timedelta(minutes=30)).strftime("%Y-%m-%d %H:%M:%S")
    for b in checked:
        b.status = "away"
        b.away_until = away_until
    group[0].away_count = int(group[0].away_count or 0) + 1
    db.commit()
    remaining = max(0, 2 - used - 1)
    return True, f"已整组暂离：30 分钟内需回到敬文图书馆并再次定位签到，剩余暂离机会 {remaining} 次"


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
    _rollback_slots(db, booking)
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
    from . import office_ai

    key = office_ai._cfg("AMAP_KEY", "")
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
    book_intent = ("常用座位" not in text) and (
        any(k in text for k in ("预约", "约一个", "约个", "教室", "座位"))
        or ("图书馆" in text and any(k in text for k in ("预约", "座位", "约")))
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
            rtype = "classroom"
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
        labels = {"classroom": "空教室", "seat": "图书馆座位"}
        reply = f"我按 {day.isoformat()}（{WEEKDAY_CN[day.isoweekday() - 1]}）{start}-{end}、{people} 人筛选了{labels.get(rtype, '资源')}，推荐前 {len(candidates)} 个："
        return {
            "reply": reply,
            "trace": trace,
            "cards": candidates,
            "draft": {"type": rtype, "date": day.isoformat(), "start_at": start, "end_at": end, "people": people},
        }

    # ===== 通用工具：天气（免 key 实时数据，支持城市与未来 1-7 天）=====
    if any(k in text for k in ("天气", "气温", "温度", "下雨", "几度", "冷不冷", "热不热")):
        try:
            city, _, _ = tools.resolve_city(text)
            days, focus = 3, "today"
            if "明天" in text:
                days, focus = 2, "tomorrow"
            if "后天" in text:
                days, focus = 3, "dayafter"
            if any(k in text for k in ("三天", "3天")):
                days, focus = 3, "range3"
            if any(k in text for k in ("一周", "7天", "七天", "这周", "本周")):
                days, focus = 7, "range7"
            if "周末" in text:
                days, focus = 7, "weekend"
            w = tools.get_weather(days, city)
            if w and w.get("forecast"):
                fc = w["forecast"]
                cur = w["current"]

                def daydetail(item: dict) -> str:
                    precip = item.get("precip")
                    extra = f"，降水概率 {precip}%" if precip not in (None, "") else ""
                    return f"{item['text']}，{item['min']}~{item['max']}°C{extra}"

                def dayline(item: dict) -> str:
                    return f"{item['weekday']} {daydetail(item)}"

                idx = 1 if len(fc) > 1 else 0
                if focus == "today":
                    lines = [
                        f"{city}今天{cur['text']}，{cur['temp']}°C（体感 {cur['feels']}°C），"
                        f"湿度 {cur['humidity']}%，风 {cur['wind']} km/h。"
                    ]
                    lines.append(f"今天白天{daydetail(fc[0])}。")
                    if len(fc) >= 2:
                        lines.append(f"明天 {dayline(fc[1])}。")
                    if len(fc) >= 3:
                        lines.append(f"后天 {dayline(fc[2])}。")
                elif focus == "tomorrow":
                    lines = [f"明天（{fc[idx]['weekday']}）{city}{daydetail(fc[idx])}。"]
                elif focus == "dayafter":
                    idx = 2 if len(fc) > 2 else len(fc) - 1
                    lines = [f"后天（{fc[idx]['weekday']}）{city}{daydetail(fc[idx])}。"]
                elif focus == "weekend":
                    weekend = [d for d in fc if d["weekday"] in ("周六", "周日")][:2]
                    if weekend:
                        lines = ["这周末：" + "；".join(dayline(d) for d in weekend) + "。"]
                    else:
                        lines = [f"未来 7 天里没有完整落在周末的预报，先看今天：{dayline(fc[0])}。"]
                else:
                    head = "未来三天" if focus == "range3" else "未来一周"
                    lines = [f"{city}{head}：" + "；".join(dayline(d) for d in fc[:days]) + "。"]

                # 提示只针对用户问到的日期，避免"后天 0% 降水还让带伞"
                focus_days = fc[:days]
                if focus in ("tomorrow", "dayafter"):
                    focus_days = [fc[idx]]
                elif focus == "weekend":
                    focus_days = [d for d in fc if d["weekday"] in ("周六", "周日")][:2] or fc[:1]
                weather_all = " ".join(d["text"] for d in focus_days)
                if focus == "today":
                    weather_all = cur["text"] + " " + weather_all
                highs = [d["max"] for d in focus_days if d.get("max") is not None]
                lows = [d["min"] for d in focus_days if d.get("min") is not None]
                if any(k in weather_all for k in ("雨", "雪", "雷")):
                    tip = "记得带伞，路上慢点～"
                elif highs and max(highs) >= 30:
                    tip = "有点热，防晒和水别忘了。"
                elif lows and min(lows) <= 5:
                    tip = "早晚凉，外套穿厚一点。"
                else:
                    tip = "天气还算稳，安排出门吧～"
                lines.append(tip)

                trace.append({"tool": "get_weather", "status": "ok", "summary": f"{city} · {days} 天 · {w['source']}"})
                return {
                    "reply": "".join(lines),
                    "trace": trace,
                    "cards": [{"kind": "weather", **w}],
                    "draft": None,
                }
        except Exception:
            pass

    if any(k in text for k in ("校历", "开学", "放假", "考试", "第几周")):
        events = db.query(CalendarEvent).filter(CalendarEvent.term == "2026-2027-1").order_by(CalendarEvent.start_date).all()
        trace.append({"tool": "get_calendar", "status": "ok", "summary": "2026-2027 第一学期"})
        return {
            "reply": "2026-2027 第一学期：9 月 7 日开课；国庆/中秋 10 月 1—8 日连休；期末周在第 18—19 周（待教务核验）；1 月 16 日放寒假。要订票的话，苏小师建议先看校历原文再下手～",
            "trace": trace,
            "cards": [{"kind": "calendar", "title": e.title, "start": e.start_date, "end": e.end_date, "status": e.status} for e in events],
            "draft": None,
        }

    if any(k in text for k in ("学校", "校区", "面积", "师资", "教师", "专业", "排名", "ESI")):
        metrics = db.query(SchoolMetric).all()
        campuses = db.query(Campus).all()
        trace.append({"tool": "get_school_profile", "status": "ok", "summary": "校情指标"})
        return {
            "reply": "江师大现有泉山、云龙、奎园、潘安湖四个校区，20 个专业学院、66 个本科专业，专任教师 1896 人。占地面积官网没公开，我就不编数字啦～想逛哪个校区，我可以直接给你导航。",
            "trace": trace,
            "cards": [
                {"kind": "metric", "label": m.label, "value": (m.value + m.unit) if m.value else "待校方提供", "status": m.status}
                for m in metrics
                if m.key in ("campuses", "colleges", "majors", "teachers", "undergrads", "esi_top1", "area")
            ]
            + [{"kind": "campus", "name": c.name, "address": c.address} for c in campuses],
            "draft": None,
        }

    if any(k in text for k in ("省钱", "想买", "拼单", "购买计划", "冷静期", "预算")):
        from . import deal_decision
        from .models import PurchasePlan

        plans = (
            db.query(PurchasePlan)
            .filter(PurchasePlan.user_id == 1)
            .order_by(PurchasePlan.id.desc())
            .limit(10)
            .all()
        )
        active = [p for p in plans if p.decision_status in ("undecided", "cooling")]
        money = deal_decision.money_summary(db, 1)

        trace.append(
            {
                "tool": "get_deal_overview",
                "status": "ok",
                "summary": f"{len(active)} 个待决策计划 · 计划总额 ¥{money['planned_total']}",
            }
        )
        if active:
            uniq, seen = [], set()
            for p in active:
                key = (p.title, p.price_cent, p.budget_cent)
                if key in seen:
                    continue
                seen.add(key)
                uniq.append(p)
            lines = [f"你目前有 {len(active)} 个待决策购买计划："]
            for p in uniq[:3]:
                state = "冷静期中" if p.decision_status == "cooling" else "尚未决定"
                lines.append(
                    f"· {p.title or ('计划 #' + str(p.id))}：预计 ¥{deal_decision.yuan(p.price_cent)}，"
                    f"预算 ¥{deal_decision.yuan(p.budget_cent)}（{state}）"
                )
            if len(active) > 3:
                lines.append(f"还有 {len(active) - 3} 个没列出来。")
            lines.append(
                f"金额口径：待决策计划共 ¥{money['planned_total']}；已暂缓 ¥{money['deferred_total']}、"
                f"已放弃 ¥{money['abandoned_total']}（这是计划金额，不是实际省下的现金）；"
                f"实际购买支出 ¥{money['spent_total']}。"
            )

            reply = "\n".join(lines)
        else:
            reply = chr(10).join([
                f"你还没有正在决策的购买计划。已暂缓 ¥{money['deferred_total']}、"
                f"已放弃 ¥{money['abandoned_total']}，实际支出 ¥{money['spent_total']}。",
                "给你三个实用建议：",
                "1) 买大件前先在省一省建计划，写清用途、预算上限和替代方案；",
                "2) 至少录 2 条同款可比报价，看到手价，不把条件优惠当人人可享；",
                "3) 设 24–72 小时冷静期，想清楚再决定是否购买。",
            ])
        return {
            "reply": reply,
            "trace": trace,
            "cards": [
                {"kind": "action", "action_type": "open", "target": "#/life/deal", "label": "打开省一省"}
            ],
            "draft": {"type": "open", "target": "#/life/deal"},
        }

    if "搭子" in text:
        from .models import BuddyPost

        posts = db.query(BuddyPost).filter(BuddyPost.status == "open").limit(5).all()
        trace.append({"tool": "search_buddy_posts", "status": "ok", "summary": f"{len(posts)} 条开放帖子"})
        return {
            "reply": "给你翻到这几条还在开放的搭子帖，手慢无～",
            "trace": trace,
            "cards": [{"kind": "buddy", "id": p.id, "type": p.type, "title": p.title, "time": p.time_text, "place": p.place} for p in posts],
            "draft": None,
        }

    # ===== 知识库 + LLM 兜底（苏小师）=====
    try:
        from . import office_ai
        from .knowledge import search_knowledge

        kb = search_knowledge(db, text)
        ctx = {
            "校区": "泉山校区",
            "今日": __import__("datetime").date.today().isoformat(),
            "常用地点": "敬文图书馆、静远楼(21世纪大楼/9号楼)、7号楼、9号楼",
        }
        result = office_ai.llm_suxiaoshi(text, kb, ctx)
        if result.get("reply"):
            trace.append(
                {"tool": "llm_suxiaoshi", "status": "ok", "summary": f"知识库命中 {len(kb)} 段，模型 {office_ai.model()}"}
            )
            cards = []
            action = result.get("action")
            if action:
                cards.append(
                    {
                        "kind": "action",
                        "action_type": action["type"],
                        "target": action.get("target", ""),
                        "label": action.get("label", "去看看"),
                    }
                )
            return {"reply": result["reply"], "trace": trace, "cards": cards, "draft": action}
    except Exception:
        # 模型不可用时退回固定引导，保证可用
        pass

    return {
        "reply": "我可以帮你：① 约空教室/图书馆座位；② 规划校园路线；③ 文件识别（字段提取/核查匹配/聊天转待办）；④ 个人管理（待办/番茄钟/健康）；⑤ 查校历校情、找搭子、拼单省钱、报修。试试说“明天下午帮我约一个 4 人的研讨教室”或“帮我识别文件里的关键字段”。",
        "trace": [{"tool": "intent_router", "status": "fallback", "summary": "未命中具体意图"}],
        "cards": [],
        "draft": None,
    }