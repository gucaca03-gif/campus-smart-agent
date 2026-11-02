"""重建敬文图书馆自习座位：按真实阅览室平面布局生成坐标与桌组。

布局贴近真实高校图书馆自习区：
- 每张长桌 6 座并排，桌体长边朝通道
- 横向分 2 个岛，左岛靠外墙（临窗），岛间留主通道
- 桌子纵向排列，桌间留通道
- 靠窗座位位于左岛最左列；电源位按真实插座分布间隔设置

坐标单位 = 1 个座位宽，前端按坐标渲染 SVG 平面图。
"""

import math
import sqlite3
from pathlib import Path

DB = Path(__file__).resolve().parents[2] / "data" / "aishida.db"

ROOMS = [
    ("201 科技图书借阅I室(2楼)", "2F1", 48),
    ("202 科技图书借阅II室(2楼)", "2F2", 48),
    ("302 社科图书借阅I室(3楼)", "3F1", 56),
    ("305 社科图书借阅II室(3楼)", "3F2", 64),
    ("402 科技图书借阅III室(4楼)", "4F1", 72),
    ("510 信息共享空间(5楼)", "5F1", 36),
]

PER_TABLE = 6
ISLE_GAP = 2
ROW_GAP = 2


def layout(count: int):
    """生成座位相对坐标（含通道留白），返回 [{x, y, island, col}]。"""
    tables = math.ceil(count / PER_TABLE)
    islands = 2 if tables >= 6 else 1
    per_island = math.ceil(tables / islands)
    seats = []
    for t in range(tables):
        island = min(islands - 1, t // per_island)
        row_in_island = t % per_island
        x0 = island * (PER_TABLE + ISLE_GAP)
        y = row_in_island * (1 + ROW_GAP)
        for c in range(PER_TABLE):
            seats.append({"x": float(x0 + c), "y": float(y), "island": island, "col": c})
    return seats[:count]


def main() -> None:
    conn = sqlite3.connect(DB)
    conn.execute("PRAGMA foreign_keys = OFF")

    old_ids = [r[0] for r in conn.execute("SELECT id FROM resources WHERE type='seat'").fetchall()]
    if old_ids:
        ph = ",".join("?" * len(old_ids))
        conn.execute(f"DELETE FROM slots WHERE resource_id IN ({ph})", old_ids)
        conn.execute(f"DELETE FROM bookings WHERE resource_id IN ({ph})", old_ids)
        conn.execute(f"DELETE FROM resources WHERE id IN ({ph})", old_ids)

    lib_place = conn.execute("SELECT id FROM places WHERE name LIKE '%图书馆%' LIMIT 1").fetchone()
    place_id = lib_place[0] if lib_place else None

    for room, prefix, count in ROOMS:
        seats = layout(count)
        zone_seq = {"A": 0, "B": 0}
        for idx, s in enumerate(seats):
            zone = "A" if s["island"] == 0 else "B"
            zone_seq[zone] += 1
            seq = zone_seq[zone]
            window = s["island"] == 0 and s["col"] == 0
            power = idx % 3 == 0
            kind = "靠窗" if window else ("电源位" if power else "普通")
            conn.execute(
                """INSERT INTO resources
                (type, name, campus_id, place_id, room, capacity, description, equipment,
                 audience, open_days, open_start, open_end, advance_days, approval_required,
                 status, is_demo, data_note, x, y)
                VALUES ('seat', ?, 1, ?, ?, 1, ?, ?, '全校', '1,2,3,4,5,6,7',
                 '08:00', '22:00', 2, 0, 'open', 1,
                 '演示座位布局，按阅览室平面示意生成，待图书馆座位系统授权', ?, ?)""",
                (
                    f"{prefix}-{zone}{seq:02d}",
                    place_id,
                    room,
                    f"{room} 自习座位，{kind}",
                    "电源" if power else "",
                    s["x"],
                    s["y"],
                ),
            )

    conn.commit()
    total = conn.execute("SELECT COUNT(*) FROM resources WHERE type='seat'").fetchone()[0]
    print(f"seats total: {total}")
    for r in conn.execute("SELECT room, COUNT(*) FROM resources WHERE type='seat' GROUP BY room"):
        print(f"  {r[0]}: {r[1]} 座")
    conn.close()


if __name__ == "__main__":
    main()