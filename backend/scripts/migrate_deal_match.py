# -*- coding: utf-8 -*-
"""数据库迁移：为 deal_quotes 增加同款匹配级别字段（幂等）。

项目无 Alembic；沿用 backend/scripts 下的轻量迁移脚本模式。
执行：python backend/scripts/migrate_deal_match.py
"""
import os
import sqlite3

DB = os.path.join(os.path.dirname(__file__), "..", "..", "data", "aishida.db")


def cols(con, table):
    return {r[1] for r in con.execute(f"PRAGMA table_info({table})").fetchall()}


def main():
    con = sqlite3.connect(DB)
    try:
        existing = cols(con, "deal_quotes")
        if "match_level" not in existing:
            con.execute("ALTER TABLE deal_quotes ADD COLUMN match_level VARCHAR(16) NOT NULL DEFAULT 'exact'")
        if "match_note" not in existing:
            con.execute("ALTER TABLE deal_quotes ADD COLUMN match_note VARCHAR(128) NOT NULL DEFAULT ''")
        con.commit()
        print("迁移完成：deal_quotes.match_level / match_note 就绪")
    finally:
        con.close()


if __name__ == "__main__":
    main()