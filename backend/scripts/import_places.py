# -*- coding: utf-8 -*-
"""批量导入校园点位（宿舍楼等）。

用法：
    python backend/scripts/import_places.py --file data/places.json
    python backend/scripts/import_places.py --file data/places.json --dry-run

JSON 支持 {"places": [...]} 或直接数组，字段：
    name, alias, entrance, type, lat, lng, campus_id, source
按 name + campus_id 幂等更新，不会重复插入。
"""
import argparse
import json
import os
import sqlite3

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DB_PATH = os.path.join(ROOT, "data", "aishida.db")


def _num(v):
    try:
        return float(v)
    except (TypeError, ValueError):
        return 0.0


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--file", default="data/places.json", help="JSON 文件路径（相对项目根）")
    parser.add_argument("--dry-run", action="store_true", help="只检查，不写库")
    args = parser.parse_args()

    path = args.file
    if not os.path.isabs(path):
        path = os.path.join(ROOT, path)
    if not os.path.exists(path):
        raise SystemExit(f"找不到文件：{path}")

    with open(path, encoding="utf-8") as f:
        data = json.load(f)
    rows = data if isinstance(data, list) else data.get("places", [])

    conn = sqlite3.connect(DB_PATH, timeout=30)
    added = updated = skipped = 0
    try:
        for item in rows:
            name = str(item.get("name") or "").strip()
            lat, lng = _num(item.get("lat")), _num(item.get("lng"))
            if not name or not lat or not lng:
                skipped += 1
                continue
            campus_id = int(item.get("campus_id") or 1)
            alias = item.get("alias") or ""
            if isinstance(alias, (list, tuple)):
                alias = ",".join(str(x).strip() for x in alias if str(x).strip())
            ptype = item.get("type") or "dorm"
            entrance = item.get("entrance") or ""
            source = item.get("source") or "用户实测"

            row = conn.execute(
                "SELECT id FROM places WHERE name = ? AND campus_id = ?",
                (name, campus_id),
            ).fetchone()
            if row:
                conn.execute(
                    "UPDATE places SET alias=?, type=?, lat=?, lng=?, entrance=?, verified=1, source=? WHERE id=?",
                    (alias, ptype, lat, lng, entrance, source, row[0]),
                )
                updated += 1
            else:
                conn.execute(
                    "INSERT INTO places (campus_id, name, alias, type, lat, lng, entrance, verified, source) "
                    "VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)",
                    (campus_id, name, alias, ptype, lat, lng, entrance, source),
                )
                added += 1

        if args.dry_run:
            conn.rollback()
            print(f"[dry-run] 新增 {added}，更新 {updated}，跳过 {skipped}")
        else:
            conn.commit()
            print(f"导入完成：新增 {added}，更新 {updated}，跳过 {skipped}")
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


if __name__ == "__main__":
    main()