"""导航地点扩充：新增标记点 + 补充别名（泉山校区）。

新增地点的坐标为校区内估计位置（verified=0，source 标注"位置估计，待实测"），
可导航可用，但鼓励用户实测后纠正。别名补充基于常用叫法，供用户整理确认。
"""

import sqlite3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DB = str(ROOT / "data" / "aishida.db")

# 新增地点：(name, alias逗号分隔, lat, lng, type, entrance, note)
NEW_PLACES = [
    (
        "静远楼", "21世纪大楼,9号楼,静远楼,21世纪", 34.198856, 117.183378,
        "building", "面向敬文图书馆一侧", "三名一体：静远楼=21世纪大楼=9号楼（用户确认）；与808工位同点",
    ),
    (
        "体育馆", "体育馆,室内体育馆,球馆", 34.1979, 117.1782,
        "sports", "北门进入后西侧", "校运会与室内球类主场（有实景照片）",
    ),
    (
        "游泳馆", "游泳馆,泳池", 34.1986, 117.1775,
        "sports", "与体育馆相邻", "体育课与游泳社团（有实景照片）",
    ),
    (
        "行政楼", "行政办公楼,办公楼,机关楼", 34.2002, 117.1810,
        "office", "北门附近", "校部机关办公区",
    ),
]

# 现有地点别名补充：name -> 追加别名
ALIAS_APPEND = {
    "敬文图书馆": "自习馆",
    "牛山运动场": "东操场",
    "校医院": "医务室",
}


def main():
    conn = sqlite3.connect(DB)
    cur = conn.cursor()
    added = 0
    for name, alias, lat, lng, ptype, entrance, note in NEW_PLACES:
        row = cur.execute("SELECT id FROM places WHERE name=?", (name,)).fetchone()
        if row:
            cur.execute(
                "UPDATE places SET alias=?, lat=?, lng=?, source=? WHERE id=?",
                (alias, lat, lng, "位置估计，待实测；" + note, row[0]),
            )
            print(f"更新: {name} -> {alias}")
        else:
            cur.execute(
                "INSERT INTO places (campus_id, name, alias, type, lat, lng, entrance,"
                " verified, source) VALUES (1, ?, ?, ?, ?, ?, ?, 0, ?)",
                (name, alias, ptype, lat, lng, entrance, "位置估计，待实测；" + note),
            )
            added += 1
            print(f"新增: {name} -> {alias}")
    for name, extra in ALIAS_APPEND.items():
        row = cur.execute("SELECT id, alias FROM places WHERE name=?", (name,)).fetchone()
        if not row:
            print(f"跳过（未找到）: {name}")
            continue
        existing = set(a.strip() for a in row[1].split(",") if a.strip())
        new_alias = ",".join(sorted(existing | set(extra.split(","))))
        cur.execute("UPDATE places SET alias=? WHERE id=?", (new_alias, row[0]))
        print(f"别名补充: {name} -> {new_alias}")
    conn.commit()
    total = cur.execute("SELECT COUNT(*) FROM places").fetchone()[0]
    print(f"完成：新增 {added} 个，地点总数 {total}")
    conn.close()


if __name__ == "__main__":
    main()