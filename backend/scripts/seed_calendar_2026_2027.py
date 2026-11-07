# -*- coding: utf-8 -*-
"""按江苏师范大学教务处 2026-2027 学年校历刷新 calendar_events 表。

数据来源（权威）：http://jwc.jsnu.edu.cn/54/06/c10536a414726/page.htm
校历图 OCR 说明原文：
  第一学期：报到 教职工2026-09-05/学生2026-09-06；上课 2026-09-07；
            国庆节放假3天；中秋节放假1天；元旦放假1天；寒假 2027-01-16 至 2027-02-28（2/6 春节）。
  第二学期：报到 教职工2027-02-27/学生2027-02-28；上课 2027-03-01；
            清明节放假1天；国际劳动节放假2天；端午节放假1天；暑假 2027-07-05 至 2027-09-01。
  教学周次由校历表周次列还原：第一学期 19 周（第 19 周 2027-01-11~15），
  第二学期 18 周（第 18 周 2027-06-28~07-02）。

用法：python backend/scripts/seed_calendar_2026_2027.py
"""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.models import Base, CalendarEvent

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "data", "aishida.db")
SOURCE_URL = "http://jwc.jsnu.edu.cn/54/06/c10536a414726/page.htm"

T1 = "2026-2027-1"
T2 = "2026-2027-2"

EVENTS = [
    (T1, "教职工报到", "2026-09-05", "2026-09-05", "registration"),
    (T1, "学生报到/注册", "2026-09-06", "2026-09-06", "registration"),
    (T1, "正式上课（第 1 周）", "2026-09-07", "2026-09-07", "teaching"),
    (T1, "中秋节", "2026-09-25", "2026-09-25", "holiday"),
    (T1, "国庆节", "2026-10-01", "2026-10-03", "holiday"),
    (T1, "元旦", "2027-01-01", "2027-01-01", "holiday"),
    (T1, "寒假（2月6日春节）", "2027-01-16", "2027-02-28", "holiday"),
    (T2, "教职工报到", "2027-02-27", "2027-02-27", "registration"),
    (T2, "学生报到/注册", "2027-02-28", "2027-02-28", "registration"),
    (T2, "正式上课（第 1 周）", "2027-03-01", "2027-03-01", "teaching"),
    (T2, "清明节", "2027-04-05", "2027-04-05", "holiday"),
    (T2, "国际劳动节", "2027-05-01", "2027-05-02", "holiday"),
    (T2, "端午节", "2027-06-09", "2027-06-09", "holiday"),
    (T2, "暑假", "2027-07-05", "2027-09-01", "holiday"),
]

TERM_META = {
    T1: {"label": "2026-2027 学年第一学期", "first_monday": "2026-09-07", "weeks": 19},
    T2: {"label": "2026-2027 学年第二学期", "first_monday": "2027-03-01", "weeks": 18},
}


def main():
    engine = create_engine(f"sqlite:///{DB_PATH}")
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    db = Session()

    db.query(CalendarEvent).filter(CalendarEvent.term.in_([T1, T2])).delete()
    for term, title, start, end, etype in EVENTS:
        db.add(CalendarEvent(
            term=term, title=title, start_date=start, end_date=end,
            type=etype, status="confirmed", source_url=SOURCE_URL,
        ))
    db.commit()

    rows = db.query(CalendarEvent).filter(CalendarEvent.term.in_([T1, T2])).order_by(CalendarEvent.start_date).all()
    print(f"已写入 {len(rows)} 条校历事件：")
    for r in rows:
        print(f"  {r.term} | {r.start_date}~{r.end_date} | {r.type:12s} | {r.title}")
    db.close()


if __name__ == "__main__":
    main()