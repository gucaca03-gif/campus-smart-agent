# -*- coding: utf-8 -*-
"""数据库迁移：为 deal_products 增加备注字段（幂等）。"""
import os
import sqlite3

DB = os.path.join(os.path.dirname(__file__), "..", "..", "data", "aishida.db")


def cols(con, table):
    return {r[1] for r in con.execute(f"PRAGMA table_info({table})").fetchall()}


def main():
    con = sqlite3.connect(DB)
    try:
        if "note" not in cols(con, "deal_products"):
            con.execute("ALTER TABLE deal_products ADD COLUMN note TEXT NOT NULL DEFAULT ''")
        con.commit()
        print("迁移完成：deal_products.note 就绪")
    finally:
        con.close()


if __name__ == "__main__":
    main()
