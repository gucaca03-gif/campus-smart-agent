# -*- coding: utf-8 -*-
"""数据库迁移：为 bookings 增加暂离字段（幂等）。

执行：python backend/scripts/migrate_seat_away.py
"""
import os
import sqlite3

DB = os.path.join(os.path.dirname(__file__), "..", "..", "data", "aishida.db")


def cols(con, table):
    return {r[1] for r in con.execute(f"PRAGMA table_info({table})").fetchall()}


def main():
    con = sqlite3.connect(DB)
    try:
        existing = cols(con, "bookings")
        if "away_count" not in existing:
            con.execute("ALTER TABLE bookings ADD COLUMN away_count INTEGER NOT NULL DEFAULT 0")
        if "away_until" not in existing:
            con.execute("ALTER TABLE bookings ADD COLUMN away_until VARCHAR(32) NOT NULL DEFAULT ''")
        if "reservation_key" not in existing:
            con.execute("ALTER TABLE bookings ADD COLUMN reservation_key VARCHAR(64) NOT NULL DEFAULT ''")
        if "points_awarded" not in existing:
            con.execute("ALTER TABLE bookings ADD COLUMN points_awarded INTEGER NOT NULL DEFAULT 0")
        if "settle_type" not in existing:
            con.execute("ALTER TABLE bookings ADD COLUMN settle_type VARCHAR(24) NOT NULL DEFAULT ''")
        if "settled_at" not in existing:
            con.execute("ALTER TABLE bookings ADD COLUMN settled_at VARCHAR(32) NOT NULL DEFAULT ''")
        con.execute("CREATE INDEX IF NOT EXISTS ix_bookings_reservation_key ON bookings (reservation_key)")
        con.execute("UPDATE bookings SET reservation_key = 'legacy-' || id WHERE reservation_key = ''")
        con.commit()
        print("迁移完成：bookings.away_count / away_until 就绪")
    finally:
        con.close()


if __name__ == "__main__":
    main()
