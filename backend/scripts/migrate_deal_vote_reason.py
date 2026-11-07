# -*- coding: utf-8 -*-
"""数据库迁移：为 deal_votes 增加理由字段（幂等），并补齐演示他人意见。"""
import os
import sqlite3

DB = os.path.join(os.path.dirname(__file__), "..", "..", "data", "aishida.db")
DEMO_REASONS = {
    1: "机械键盘先看轴体和手感，别只看灯效。",
    2: "已有耳机的话可以再等等，不必为降噪溢价。",
    3: "跑鞋最好线下试穿，不同品牌尺码差很多。",
    4: "宿舍桌面放 27 寸可能太挤，先量一下桌子。",
    5: "胶囊机还要算长期耗材，别只盯着机器价。",
}


def cols(con, table):
    return {r[1] for r in con.execute(f"PRAGMA table_info({table})").fetchall()}


def main():
    con = sqlite3.connect(DB)
    try:
        if "reason" not in cols(con, "deal_votes"):
            con.execute("ALTER TABLE deal_votes ADD COLUMN reason TEXT NOT NULL DEFAULT ''")
        for post_id, reason in DEMO_REASONS.items():
            con.execute(
                "UPDATE deal_votes SET reason=? WHERE post_id=? AND user_id=2 AND reason=''",
                (reason, post_id),
            )
        con.commit()
        print("迁移完成：deal_votes.reason 就绪")
    finally:
        con.close()


if __name__ == "__main__":
    main()
