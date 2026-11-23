import os
import sys
import tempfile
from datetime import date, datetime, timedelta

import pytest

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)

from sqlalchemy import create_engine  # noqa: E402
from sqlalchemy.orm import sessionmaker  # noqa: E402

from app import services  # noqa: E402
from app.models import Base, Booking, Resource, SelfXp  # noqa: E402


@pytest.fixture()
def db():
    path = tempfile.mktemp(suffix=".db")
    engine = create_engine(f"sqlite:///{path}")
    Base.metadata.create_all(engine)
    session = sessionmaker(bind=engine)()
    seat = Resource(
        type="seat", name="测试座位", open_days="1,2,3,4,5,6,7",
        advance_days=2, capacity=1, approval_required=0, status="open",
    )
    session.add(seat)
    session.commit()
    yield session, seat
    session.close()
    engine.dispose()
    if os.path.exists(path):
        os.remove(path)


def _tomorrow():
    return (date.today() + timedelta(days=1)).isoformat()


def test_contiguous_span_creates_one_booking(db):
    session, seat = db
    booking, err = services.create_booking(
        session,
        {"resource_id": seat.id, "date": _tomorrow(), "start_at": "08:00", "end_at": "12:00", "people": 1, "purpose": "自习"},
    )
    assert booking is not None, err
    assert booking["start_at"] == "08:00" and booking["end_at"] == "12:00"
    slots = services._slots_for_span(session, seat.id, _tomorrow(), "08:00", "12:00")
    assert len(slots) == 2
    assert all(s.booked == 1 for s in slots)


def test_non_aligned_span_rejected(db):
    session, seat = db
    booking, err = services.create_booking(
        session,
        {"resource_id": seat.id, "date": _tomorrow(), "start_at": "08:00", "end_at": "13:00", "people": 1},
    )
    assert booking is None
    assert "不连续" in err


def test_more_than_three_slots_rejected(db):
    session, seat = db
    booking, err = services.create_booking(
        session,
        {"resource_id": seat.id, "date": _tomorrow(), "start_at": "08:00", "end_at": "16:00", "people": 1},
    )
    assert booking is None
    assert "3 个连续时段" in err


def test_booking_beyond_advance_days_rejected(db):
    session, seat = db
    day3 = (date.today() + timedelta(days=3)).isoformat()
    booking, err = services.create_booking(
        session,
        {"resource_id": seat.id, "date": day3, "start_at": "08:00", "end_at": "10:00", "people": 1},
    )
    assert booking is None
    assert "提前" in err


def test_cancel_rolls_back_all_slots(db):
    session, seat = db
    booking, err = services.create_booking(
        session,
        {"resource_id": seat.id, "date": _tomorrow(), "start_at": "08:00", "end_at": "12:00", "people": 1},
    )
    assert booking is not None, err
    ok, msg = services.cancel_booking(session, booking["id"])
    assert ok, msg
    slots = services._slots_for_span(session, seat.id, _tomorrow(), "08:00", "12:00")
    assert all(s.booked == 0 for s in slots)


def test_unchecked_booking_released_and_penalized(db):
    session, seat = db
    booking, err = services.create_booking(
        session,
        {"resource_id": seat.id, "date": _tomorrow(), "start_at": "08:00", "end_at": "10:00", "people": 1},
    )
    assert booking is not None, err
    row = session.get(Booking, booking["id"])
    row.date = (date.today() - timedelta(days=1)).isoformat()
    row.start_at = "08:00"
    session.commit()

    changed = services.expire_unchecked_bookings(session)
    assert changed >= 1

    row = session.get(Booking, booking["id"])
    assert row.status == "no_show"
    assert row.points_awarded == -50
    penalty = session.query(SelfXp).filter(SelfXp.action == "no_show_penalty").all()
    assert len(penalty) == 1 and penalty[0].xp == -50