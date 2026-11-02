"""迁移 places 表到 OpenStreetMap 真实坐标（GCJ-02），并更新资源关联。

用法：
    cd campus-smart-agent
    ../campus-smart-service/.venv/Scripts/python.exe backend/scripts/migrate_places_osm.py

自动备份数据库到 data/aishida.db.bak-<时间戳>。
"""

import shutil
import sys
from datetime import datetime
from pathlib import Path

BACKEND = Path(__file__).resolve().parents[1]
ROOT = BACKEND.parent
sys.path.insert(0, str(BACKEND))

from app.coords import wgs84_to_gcj02  # noqa: E402
from app.db import SessionLocal, engine  # noqa: E402
from app.models import Place, Resource  # noqa: E402
from app.seed import PLACES  # noqa: E402

# 旧楼名 -> 新地点名（资源 place_id 映射）
ROOM_BUILDING_MAP = {
    "21世纪大楼": "田家炳工学院",
    "电气学院": "电气工程及自动化学院",
    "教师教育实训中心": "教育科学学院",
    "图书馆": "敬文图书馆",
    "教学楼A": "文学院",
    "教学楼B": "外国语学院",
    "教学楼C": "历史文化与旅游学院",
}

# 旧资源名 -> (新资源名, 新楼名)
RESOURCE_RENAME = {
    "教学楼A-101": ("文学院楼-101", "文学院"),
    "教学楼A-102": ("文学院楼-102", "文学院"),
    "教学楼A-201": ("文学院楼-201", "文学院"),
    "教学楼A-202": ("文学院楼-202", "文学院"),
    "教学楼B-101": ("外语楼-101", "外国语学院"),
    "教学楼B-102": ("外语楼-102", "外国语学院"),
    "教学楼B-201": ("外语楼-201", "外国语学院"),
    "教学楼C-301": ("文旅学院楼-301", "历史文化与旅游学院"),
    "教学楼C-302": ("文旅学院楼-302", "历史文化与旅游学院"),
    "教学楼C-303": ("文旅学院楼-303", "历史文化与旅游学院"),
}


def main() -> None:
    db_path = ROOT / "data" / "aishida.db"
    if not db_path.exists():
        print("数据库不存在，跳过迁移（首次启动 seed 会直接写入新地点）")
        return
    backup = db_path.with_name(f"aishida.db.bak-{datetime.now().strftime('%Y%m%d-%H%M%S')}")
    shutil.copy2(db_path, backup)
    print(f"已备份：{backup.name}")

    db = SessionLocal()
    try:
        db.query(Place).delete()
        for name, alias, typ, lat, lng, entrance, verified in PLACES:
            glng, glat = wgs84_to_gcj02(lng, lat)
            db.add(
                Place(
                    campus_id=1,
                    name=name,
                    alias=alias,
                    type=typ,
                    lat=glat,
                    lng=glng,
                    entrance=entrance,
                    verified=verified,
                    source="OpenStreetMap 实测坐标（GCJ-02）" if verified else "位置推断，待核验",
                )
            )
        db.flush()
        id_by_name = {p.name: p.id for p in db.query(Place).all()}
        print(f"places 重建完成：{len(id_by_name)} 个地点")

        seats = db.query(Resource).filter(Resource.type == "seat").all()
        lib_id = id_by_name.get("敬文图书馆")
        for seat in seats:
            seat.place_id = lib_id
        print(f"座位关联敬文图书馆：{len(seats)} 个")

        labs = db.query(Resource).filter(Resource.type == "lab").all()
        for lab in labs:
            for old, new in ROOM_BUILDING_MAP.items():
                if old in (lab.room or ""):
                    room_no = lab.room.split()[-1] if lab.room else ""
                    lab.room = f"{new} {room_no}"
                    lab.place_id = id_by_name.get(new)
                    break
        print(f"实验室重挂真实楼栋：{len(labs)} 个")

        rooms = db.query(Resource).filter(Resource.type == "classroom").all()
        for room in rooms:
            new_name, building = RESOURCE_RENAME.get(room.name, (room.name, None))
            old_no = room.room.split()[-1] if room.room else ""
            room.name = new_name
            room.room = f"{building} {old_no}"
            room.place_id = id_by_name.get(building)
        print(f"教室重挂真实楼栋：{len(rooms)} 个")

        db.commit()
        print("迁移完成。")
    finally:
        db.close()


if __name__ == "__main__":
    main()