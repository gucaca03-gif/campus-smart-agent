# -*- coding: utf-8 -*-
"""搭子档案扩展：avatar/place/results + 申请延迟自动通过时间。"""
import sqlite3
from pathlib import Path

DB = Path(__file__).resolve().parents[2] / "data" / "aishida.db"

TARGETS = [
    ("buddy_profiles", "avatar", "TEXT NOT NULL DEFAULT ''"),
    ("buddy_profiles", "place", "TEXT NOT NULL DEFAULT ''"),
    ("buddy_profiles", "results", "TEXT NOT NULL DEFAULT '{}'"),
    ("buddy_applications", "auto_accept_at", "TEXT NOT NULL DEFAULT ''"),
]


def main() -> None:
    conn = sqlite3.connect(DB)
    for table, col, ddl in TARGETS:
        cols = {r[1] for r in conn.execute(f"PRAGMA table_info({table})")}
        if col in cols:
            print(f"{table}.{col} exists")
        else:
            conn.execute(f"ALTER TABLE {table} ADD COLUMN {col} {ddl}")
            print(f"added {table}.{col}")
    conn.commit()
    conn.close()


if __name__ == "__main__":
    main()