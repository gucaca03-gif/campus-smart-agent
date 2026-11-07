# -*- coding: utf-8 -*-
"""为 buddy_chats 增加 is_read 列（已读标记）。"""
import sqlite3
from pathlib import Path

DB = Path(__file__).resolve().parents[2] / "data" / "aishida.db"


def main() -> None:
    conn = sqlite3.connect(DB)
    cols = {r[1] for r in conn.execute("PRAGMA table_info(buddy_chats)")}
    if "is_read" in cols:
        print("is_read already exists")
    else:
        conn.execute("ALTER TABLE buddy_chats ADD COLUMN is_read INTEGER NOT NULL DEFAULT 0")
        conn.commit()
        print("added is_read column")
    conn.close()


if __name__ == "__main__":
    main()