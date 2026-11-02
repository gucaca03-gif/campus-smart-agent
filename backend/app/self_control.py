from datetime import date, datetime, timedelta

from fastapi import APIRouter, Body, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from .db import get_db
from .models import (
    Pomodoro,
    SelfCheckin,
    SelfNote,
    SelfPaper,
    SelfReview,
    SelfSchedule,
    SelfTask,
    SelfTheme,
    SelfXp,
)

router = APIRouter(prefix="/api/self/control", tags=["self-control"])

STAGES = ["选题", "实验", "写作", "投稿", "返修", "接收", "搁置"]
THEMES = [
    {"code": "default", "name": "校园蓝", "price": 0, "desc": "校徽蓝，默认主题"},
    {"code": "puppy", "name": "小狗奶油", "price": 200, "desc": "奶油黄，专注时小狗陪着你"},
    {"code": "night", "name": "夜读", "price": 500, "desc": "深色低亮，适合夜里改稿"},
]
BADGES = [
    {"code": "start", "name": "启程", "category": "坚持", "condition": "完成第一次状态打卡"},
    {"code": "week", "name": "七日", "category": "坚持", "condition": "连续 7 天有效"},
    {"code": "paper", "name": "破题", "category": "科研", "condition": "创建第一篇论文/项目"},
    {"code": "move", "name": "第一推进", "category": "科研", "condition": "完成第一个任务"},
    {"code": "focus10", "name": "专注者", "category": "专注", "condition": "累计完成 10 次专注"},
    {"code": "reviewer", "name": "复盘达人", "category": "探索", "condition": "完成一次周复盘"},
    {"code": "inbox0", "name": "清空收件箱", "category": "工作", "condition": "收件箱任务归零"},
    {"code": "early", "name": "早八人", "category": "生活", "condition": "连续 3 天 6:30 前打卡"},
]


def today() -> str:
    return date.today().isoformat()


def week_start(day: str = "") -> str:
    d = date.fromisoformat(day) if day else date.today()
    return (d - timedelta(days=d.weekday())).isoformat()


def earned(db: Session, uid: int = 1) -> int:
    return sum(x.xp for x in db.query(SelfXp).filter(SelfXp.user_id == uid).all() if x.xp > 0)


def balance(db: Session, uid: int = 1) -> int:
    return max(0, sum(x.xp for x in db.query(SelfXp).filter(SelfXp.user_id == uid).all()))


def award(db: Session, action: str, xp: int, ref_id=None, uid: int = 1):
    db.add(SelfXp(user_id=uid, action=action, xp=xp, ref_id=ref_id))


def task_dict(t: SelfTask) -> dict:
    return {
        "id": t.id, "title": t.title, "scene": t.scene, "paper_id": t.paper_id,
        "due_at": t.due_at, "estimate_min": t.estimate_min, "priority": t.priority,
        "status": t.status, "next_action": t.next_action, "source": t.source,
        "plan_date": t.plan_date, "postpone_reason": t.postpone_reason,
        "postpone_count": t.postpone_count, "created_at": t.created_at,
        "completed_at": t.completed_at,
    }


def streak(db: Session, uid: int = 1) -> int:
    dates = {r.date for r in db.query(SelfCheckin).filter(SelfCheckin.user_id == uid).all()}
    done = {t.completed_at[:10] for t in db.query(SelfTask).filter(
        SelfTask.user_id == uid, SelfTask.status == "done", SelfTask.completed_at != "").all()}
    valid = dates & done
    if not valid:
        return 0
    cursor = date.today()
    if cursor.isoformat() not in valid:
        cursor -= timedelta(days=1)
    n = 0
    while cursor.isoformat() in valid:
        n += 1
        cursor -= timedelta(days=1)
    return n


def ensure_seed(db: Session, uid: int = 1):
    if db.query(SelfTask).filter(SelfTask.user_id == uid).count() > 0:
        return
    base = date.today()
    papers = [
        ("多模态对比学习中的负样本选择", "实验", "CVPR 2027", 45, "图 3 的消融实验不显著", 16, "补一组只改温度系数的消融"),
        ("面向长尾分布的自适应重采样", "写作", "NeurIPS 2027", 28, "讨论章节缺少与最新工作的对比", 8, "先补三篇 2026 年的相关工作"),
        ("跨域小样本分割的提示学习", "返修", "ICCV 2027", 12, "审稿人要求补充跨域实验", 3, "在 DomainNet 上补 3 个域的对比"),
    ]
    for title, stage, venue, dd, blocker, days, nxt in papers:
        db.add(SelfPaper(
            user_id=uid, title=title, role="一作", stage=stage, venue=venue,
            deadline=(base + timedelta(days=dd)).isoformat(),
            blocker=blocker,
            blocker_since=(base - timedelta(days=days)).strftime("%Y-%m-%d 09:00:00"),
            next_action=nxt,
        ))
    db.commit()
    paper_id = db.query(SelfPaper).first().id
    energies = [2, 3, 4, 2, 5, 3, 4, 2, 3, 5, 4, 2, 3, 4]
    titles = [("补图 3 的误差棒", "work", 60, "P0"), ("整理组会反馈", "work", 30, "P1"),
              ("阅读对照实验文献", "study", 45, "P1"), ("写讨论第二段", "work", 60, "P0")]
    for i in range(14):
        d = base - timedelta(days=13 - i)
        energy = energies[i]
        db.add(SelfCheckin(user_id=uid, date=d.isoformat(), sleep_hours=6 + (i % 4) * 0.5,
                           energy=energy, mood=min(5, max(1, energy - 1 + (i % 3 == 0))), note=""))
        for k in range(2 if i % 2 else 3):
            title, scene, mins, pri = titles[(i + k) % len(titles)]
            done = k == 0
            db.add(SelfTask(
                user_id=uid, title=title, scene=scene, paper_id=paper_id if k == 0 else None,
                estimate_min=mins, priority=pri,
                status="done" if done else ("postponed" if i % 3 == 0 else "done"),
                plan_date=d.isoformat(), source="message" if k == 1 else "manual",
                postpone_reason="被打断" if (not done and i % 3 == 0) else "",
                created_at=d.strftime("%Y-%m-%d 08:30:00"),
                completed_at=d.strftime("%Y-%m-%d 20:00:00") if done else "",
            ))
        for s in range(1 + i % 3):
            st = d.strftime("%Y-%m-%d") + f" {10 + s * 2:02d}:00:00"
            db.add(Pomodoro(user_id=uid, task="专注", minutes=25, started_at=st,
                            ended_at=d.strftime("%Y-%m-%d") + f" {10 + s * 2:02d}:25:00", status="done"))
    db.add(SelfTask(user_id=uid, title="补一组只改温度系数的消融", scene="work", paper_id=paper_id,
                    due_at=base.isoformat(), estimate_min=60, priority="P0", status="planned",
                    plan_date=base.isoformat(), next_action="先跑通脚本，再看曲线是否分离"))
    db.add(SelfTask(user_id=uid, title="补三篇 2026 年相关工作", scene="study", estimate_min=45,
                    priority="P1", status="planned", plan_date=base.isoformat(), source="message"))
    db.add(SelfTask(user_id=uid, title="整理组会反馈并回复", scene="work", estimate_min=30,
                    priority="P1", status="inbox", source="manual"))
    db.add(SelfSchedule(user_id=uid, title="组会", start_at=base.isoformat() + "T14:00:00",
                        end_at=base.isoformat() + "T15:30:00", kind="fixed", status="confirmed"))
    db.add(SelfSchedule(user_id=uid, title="课程：高级机器学习", start_at=base.isoformat() + "T09:00:00",
                        end_at=base.isoformat() + "T11:00:00", kind="fixed", status="confirmed"))
    db.add(SelfNote(user_id=uid, content="把对比实验拆成两组，先验证采样偏差", kind="idea", tags="实验,想法"))
    db.add(SelfTheme(user_id=uid, code="default"))
    db.commit()


def ensure_xp(db: Session, uid: int = 1):
    """老库补一次积分：按已有打卡、完成任务与专注记录折算。"""
    if db.query(SelfXp).filter(SelfXp.user_id == uid).count() > 0:
        return
    checkins = db.query(SelfCheckin).filter(SelfCheckin.user_id == uid).count()
    done = db.query(SelfTask).filter(SelfTask.user_id == uid, SelfTask.status == "done").count()
    focuses = db.query(Pomodoro).filter(Pomodoro.user_id == uid, Pomodoro.status == "done").count()
    papers = db.query(SelfPaper).filter(SelfPaper.user_id == uid).count()
    if checkins:
        db.add(SelfXp(user_id=uid, action="seed_checkin", xp=checkins * 5))
    if done:
        db.add(SelfXp(user_id=uid, action="seed_task", xp=done * 10))
    if focuses:
        db.add(SelfXp(user_id=uid, action="seed_focus", xp=focuses * 8))
    if papers:
        db.add(SelfXp(user_id=uid, action="seed_paper", xp=papers * 50))
    db.commit()


def suggestion(tasks, blockers):
    if blockers:
        b = sorted(blockers, key=lambda x: -x["days"])[0]
        return {"text": f"《{b['title']}》的卡点已停留 {b['days']} 天：{b['blocker']}",
                "action": b["next_action"] or "先把它拆成一个 30 分钟能开始的步骤",
                "basis": "卡点阈值 7 天"}
    if tasks:
        t = tasks[0]
        return {"text": f"今天最值得先动的是「{t['title']}」",
                "action": t["next_action"] or f"预计 {t['estimate_min']} 分钟，先开始一次专注",
                "basis": f"优先级 {t['priority']}"}
    return {"text": "今天还没有安排任务，先写下最重要的一件。",
            "action": "从收件箱挑一条，或粘贴一段群消息",
            "basis": "今日无计划任务"}


@router.get("/overview")
def overview(day: str = Query(default=""), db: Session = Depends(get_db)):
    ensure_seed(db)
    ensure_xp(db)
    d = day or today()
    uid = 1
    checkin = db.query(SelfCheckin).filter(SelfCheckin.user_id == uid, SelfCheckin.date == d).first()
    rows = (db.query(SelfTask)
            .filter(SelfTask.user_id == uid, SelfTask.plan_date == d,
                    SelfTask.status.in_(["planned", "partial"]))
            .order_by(SelfTask.priority, SelfTask.id).all())
    tasks = [task_dict(t) for t in rows]
    inbox = db.query(SelfTask).filter(SelfTask.user_id == uid, SelfTask.status == "inbox").count()
    schedule = (db.query(SelfSchedule)
                .filter(SelfSchedule.user_id == uid, SelfSchedule.start_at.like(d + "%"))
                .order_by(SelfSchedule.start_at).all())
    pomos = (db.query(Pomodoro)
             .filter(Pomodoro.user_id == uid, Pomodoro.started_at.like(d + "%"), Pomodoro.status == "done").all())
    papers = db.query(SelfPaper).filter(SelfPaper.user_id == uid).all()
    blockers = []
    for p in papers:
        if p.blocker_since and p.blocker:
            days = (datetime.now() - datetime.strptime(p.blocker_since[:10], "%Y-%m-%d")).days
            if days >= 7:
                blockers.append({"id": p.id, "title": p.title, "blocker": p.blocker,
                                 "days": days, "next_action": p.next_action})
    w = week_start(d)
    week_rows = (db.query(SelfTask)
                 .filter(SelfTask.user_id == uid, SelfTask.plan_date >= w,
                         SelfTask.plan_date <= (date.fromisoformat(w) + timedelta(days=6)).isoformat())
                 .all())
    total = len(week_rows)
    done = len([x for x in week_rows if x.status == "done"])
    partial = len([x for x in week_rows if x.status == "partial"])
    return {
        "ok": True,
        "data": {
            "date": d,
            "checkin": ({"date": checkin.date, "sleep_hours": checkin.sleep_hours, "energy": checkin.energy,
                         "mood": checkin.mood, "note": checkin.note} if checkin else None),
            "tasks": tasks,
            "inbox": inbox,
            "schedule": [{"id": s.id, "title": s.title, "start_at": s.start_at, "end_at": s.end_at,
                          "kind": s.kind, "status": s.status} for s in schedule],
            "focus": {"count": len(pomos), "minutes": sum(p.minutes for p in pomos)},
            "blockers": blockers,
            "xp": earned(db, uid),
            "balance": balance(db, uid),
            "streak": streak(db, uid),
            "week": {"done": done, "total": total,
                     "rate": round((done + partial * 0.5) / total * 100) if total else 0},
            "suggestion": suggestion(tasks, blockers),
        },
        "message": "",
    }


@router.get("/tasks")
def list_tasks(status: str = Query(default=""), db: Session = Depends(get_db)):
    q = db.query(SelfTask).filter(SelfTask.user_id == 1)
    if status:
        q = q.filter(SelfTask.status == status)
    return {"ok": True, "data": [task_dict(t) for t in q.order_by(SelfTask.id.desc()).limit(200).all()]}


@router.post("/tasks")
def create_task(payload: dict = Body(...), db: Session = Depends(get_db)):
    title = (payload.get("title") or "").strip()
    if not title:
        raise HTTPException(400, "标题不能为空")
    t = SelfTask(
        user_id=1, title=title[:128], scene=payload.get("scene") or "work",
        paper_id=payload.get("paper_id"), due_at=payload.get("due_at") or "",
        estimate_min=int(payload.get("estimate_min") or 30),
        priority=payload.get("priority") or "P1",
        status=payload.get("status") or ("planned" if payload.get("plan_date") else "inbox"),
        next_action=(payload.get("next_action") or "")[:255],
        source=payload.get("source") or "manual",
        plan_date=payload.get("plan_date") or "",
    )
    db.add(t)
    db.commit()
    db.refresh(t)
    return {"ok": True, "data": task_dict(t), "message": "已创建"}


@router.patch("/tasks/{task_id}")
def patch_task(task_id: int, payload: dict = Body(...), db: Session = Depends(get_db)):
    t = db.query(SelfTask).filter(SelfTask.id == task_id, SelfTask.user_id == 1).first()
    if not t:
        raise HTTPException(404, "任务不存在")
    old = t.status
    for key in ["title", "scene", "paper_id", "due_at", "estimate_min", "priority", "status",
                "next_action", "plan_date", "postpone_reason"]:
        if key in payload:
            setattr(t, key, payload[key])
    if payload.get("status") == "done" and old != "done":
        t.completed_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        award(db, "task_done", 15 if t.priority == "P0" else 10, t.id)
    if payload.get("status") and payload.get("status") != "done":
        t.completed_at = ""
    if payload.get("status") == "postponed" and old != "postponed":
        t.postpone_count = (t.postpone_count or 0) + 1
    db.commit()
    db.refresh(t)
    return {"ok": True, "data": task_dict(t), "message": "已更新"}


@router.get("/schedule")
def list_schedule(day: str = Query(default=""), db: Session = Depends(get_db)):
    d = day or today()
    rows = (db.query(SelfSchedule)
            .filter(SelfSchedule.user_id == 1, SelfSchedule.start_at.like(d + "%"))
            .order_by(SelfSchedule.start_at).all())
    return {"ok": True, "data": [{"id": s.id, "title": s.title, "start_at": s.start_at,
                                  "end_at": s.end_at, "kind": s.kind, "status": s.status,
                                  "task_id": s.task_id} for s in rows]}


@router.post("/schedule")
def create_schedule(payload: dict = Body(...), db: Session = Depends(get_db)):
    if not payload.get("title") or not payload.get("start_at") or not payload.get("end_at"):
        raise HTTPException(400, "标题与起止时间必填")
    s = SelfSchedule(user_id=1, task_id=payload.get("task_id"), title=payload["title"][:128],
                     start_at=payload["start_at"], end_at=payload["end_at"],
                     kind=payload.get("kind") or "flexible")
    db.add(s)
    db.commit()
    db.refresh(s)
    return {"ok": True, "data": {"id": s.id}, "message": "已加入日程"}


@router.get("/checkins")
def list_checkins(days: int = Query(default=14), db: Session = Depends(get_db)):
    rows = (db.query(SelfCheckin).filter(SelfCheckin.user_id == 1)
            .order_by(SelfCheckin.date.desc()).limit(days).all())
    return {"ok": True, "data": [{"date": r.date, "sleep_hours": r.sleep_hours, "energy": r.energy,
                                  "mood": r.mood, "note": r.note} for r in rows]}


@router.post("/checkins")
def save_checkin(payload: dict = Body(...), db: Session = Depends(get_db)):
    d = payload.get("date") or today()
    row = db.query(SelfCheckin).filter(SelfCheckin.user_id == 1, SelfCheckin.date == d).first()
    if row:
        row.sleep_hours = float(payload.get("sleep_hours") or row.sleep_hours)
        row.energy = int(payload.get("energy") or row.energy)
        row.mood = int(payload.get("mood") or row.mood)
        row.note = (payload.get("note") or row.note)[:255]
    else:
        row = SelfCheckin(user_id=1, date=d, sleep_hours=float(payload.get("sleep_hours") or 7),
                          energy=int(payload.get("energy") or 3), mood=int(payload.get("mood") or 3),
                          note=(payload.get("note") or "")[:255])
        db.add(row)
        award(db, "checkin", 5)
    db.commit()
    return {"ok": True, "data": {"date": row.date, "energy": row.energy}, "message": "已保存"}


@router.get("/notes")
def list_notes(q: str = Query(default=""), db: Session = Depends(get_db)):
    query = db.query(SelfNote).filter(SelfNote.user_id == 1)
    if q:
        query = query.filter(SelfNote.content.like(f"%{q}%"))
    rows = query.order_by(SelfNote.id.desc()).limit(100).all()
    return {"ok": True, "data": [{"id": n.id, "content": n.content, "kind": n.kind, "tags": n.tags,
                                  "source": n.source, "task_id": n.task_id,
                                  "created_at": n.created_at} for n in rows]}


@router.post("/notes")
def create_note(payload: dict = Body(...), db: Session = Depends(get_db)):
    content = (payload.get("content") or "").strip()
    if not content:
        raise HTTPException(400, "内容不能为空")
    n = SelfNote(user_id=1, content=content, kind=payload.get("kind") or "idea",
                 tags=(payload.get("tags") or "")[:128], source="quick")
    db.add(n)
    db.commit()
    db.refresh(n)
    return {"ok": True, "data": {"id": n.id}, "message": "已收进记录箱"}


@router.post("/notes/{note_id}/task")
def note_to_task(note_id: int, payload: dict = Body(default={}), db: Session = Depends(get_db)):
    n = db.query(SelfNote).filter(SelfNote.id == note_id, SelfNote.user_id == 1).first()
    if not n:
        raise HTTPException(404, "记录不存在")
    title = (n.content.split("。")[0].split("\n")[0] or "整理一条随记")[:128]
    t = SelfTask(user_id=1, title=title, scene="work", status="planned",
                 plan_date=payload.get("plan_date") or today(), source="idea", priority="P2")
    db.add(t)
    db.commit()
    db.refresh(t)
    n.task_id = t.id
    db.commit()
    return {"ok": True, "data": {"task_id": t.id}, "message": "已转为今天的任务"}


@router.get("/reviews")
def get_review(week: str = Query(default=""), db: Session = Depends(get_db)):
    w = week or week_start()
    row = db.query(SelfReview).filter(SelfReview.user_id == 1, SelfReview.week_start == w).first()
    rows = (db.query(SelfTask)
            .filter(SelfTask.user_id == 1, SelfTask.plan_date >= w,
                    SelfTask.plan_date <= (date.fromisoformat(w) + timedelta(days=6)).isoformat())
            .all())
    total = len(rows)
    done = len([x for x in rows if x.status == "done"])
    partial = len([x for x in rows if x.status == "partial"])
    reasons = {}
    for x in rows:
        if x.postpone_reason:
            reasons[x.postpone_reason] = reasons.get(x.postpone_reason, 0) + 1
    series = []
    for i in range(7):
        d = (date.fromisoformat(w) + timedelta(days=i)).isoformat()
        day_rows = [x for x in rows if x.plan_date == d]
        c = db.query(SelfCheckin).filter(SelfCheckin.user_id == 1, SelfCheckin.date == d).first()
        series.append({
            "date": d,
            "rate": round((len([x for x in day_rows if x.status == "done"]) +
                           len([x for x in day_rows if x.status == "partial"]) * 0.5) / len(day_rows) * 100) if day_rows else 0,
            "energy": c.energy if c else None,
            "total": len(day_rows),
        })
    return {"ok": True, "data": {
        "week": w,
        "stats": {"total": total, "done": done,
                  "rate": round((done + partial * 0.5) / total * 100) if total else 0,
                  "reasons": reasons},
        "series": series,
        "review": ({"summary": row.summary, "focus1": row.focus1, "focus2": row.focus2,
                    "focus3": row.focus3} if row else None),
    }}


@router.post("/reviews")
def save_review(payload: dict = Body(...), db: Session = Depends(get_db)):
    w = payload.get("week") or week_start()
    row = db.query(SelfReview).filter(SelfReview.user_id == 1, SelfReview.week_start == w).first()
    if not row:
        row = SelfReview(user_id=1, week_start=w)
        db.add(row)
        award(db, "weekly_review", 30)
    row.summary = payload.get("summary") or ""
    row.focus1 = payload.get("focus1") or ""
    row.focus2 = payload.get("focus2") or ""
    row.focus3 = payload.get("focus3") or ""
    db.commit()
    return {"ok": True, "data": {"week": w}, "message": "复盘已保存"}


@router.get("/papers")
def list_papers(db: Session = Depends(get_db)):
    rows = db.query(SelfPaper).filter(SelfPaper.user_id == 1).order_by(SelfPaper.id).all()
    out = []
    for p in rows:
        days = 0
        if p.blocker_since:
            days = (datetime.now() - datetime.strptime(p.blocker_since[:10], "%Y-%m-%d")).days
        out.append({"id": p.id, "title": p.title, "role": p.role, "stage": p.stage,
                    "venue": p.venue, "deadline": p.deadline, "blocker": p.blocker,
                    "next_action": p.next_action, "days": days})
    return {"ok": True, "data": out}


@router.post("/papers")
def create_paper(payload: dict = Body(...), db: Session = Depends(get_db)):
    title = (payload.get("title") or "").strip()
    if not title:
        raise HTTPException(400, "标题必填")
    p = SelfPaper(user_id=1, title=title[:160], role=payload.get("role") or "一作",
                  stage=payload.get("stage") or "选题", venue=payload.get("venue") or "",
                  deadline=payload.get("deadline") or "", blocker=payload.get("blocker") or "",
                  next_action=payload.get("next_action") or "",
                  blocker_since=datetime.now().strftime("%Y-%m-%d %H:%M:%S") if payload.get("blocker") else "")
    db.add(p)
    award(db, "paper_create", 50)
    db.commit()
    db.refresh(p)
    return {"ok": True, "data": {"id": p.id}, "message": "已创建"}


@router.post("/papers/{paper_id}/stage")
def move_paper(paper_id: int, payload: dict = Body(...), db: Session = Depends(get_db)):
    p = db.query(SelfPaper).filter(SelfPaper.id == paper_id, SelfPaper.user_id == 1).first()
    if not p:
        raise HTTPException(404, "论文不存在")
    stage = payload.get("stage") or ""
    if stage not in STAGES:
        raise HTTPException(400, "阶段不合法")
    p.stage = stage
    p.blocker = payload.get("blocker") or ""
    p.next_action = payload.get("next_action") or p.next_action
    p.blocker_since = datetime.now().strftime("%Y-%m-%d %H:%M:%S") if p.blocker else ""
    award(db, "paper_stage", 50, p.id)
    db.commit()
    return {"ok": True, "data": {"id": p.id, "stage": p.stage}, "message": "阶段已更新"}


@router.get("/achievements")
def achievements(db: Session = Depends(get_db)):
    ensure_xp(db)
    uid = 1
    xp = earned(db, uid)
    st = streak(db, uid)
    focus_count = db.query(Pomodoro).filter(Pomodoro.user_id == uid, Pomodoro.status == "done").count()
    paper_count = db.query(SelfPaper).filter(SelfPaper.user_id == uid).count()
    review_count = db.query(SelfReview).filter(SelfReview.user_id == uid).count()
    inbox = db.query(SelfTask).filter(SelfTask.user_id == uid, SelfTask.status == "inbox").count()
    checkins = db.query(SelfCheckin).filter(SelfCheckin.user_id == uid).count()
    done_total = db.query(SelfTask).filter(SelfTask.user_id == uid, SelfTask.status == "done").count()
    unlocked = {
        "start": checkins > 0, "week": st >= 7, "paper": paper_count > 0,
        "move": done_total >= 1, "focus10": focus_count >= 10, "reviewer": review_count > 0,
        "inbox0": inbox == 0, "early": False,
    }
    return {"ok": True, "data": {
        "xp": xp, "level": xp // 100 + 1, "level_progress": xp % 100, "streak": st,
        "badges": [{**b, "unlocked": unlocked.get(b["code"], False)} for b in BADGES],
    }}


@router.get("/shop")
def shop(db: Session = Depends(get_db)):
    ensure_xp(db)
    uid = 1
    owned = {t.code for t in db.query(SelfTheme).filter(SelfTheme.user_id == uid).all()}
    owned.add("default")
    bal = balance(db, uid)
    return {"ok": True, "data": {
        "earned": earned(db, uid), "balance": bal,
        "themes": [{**t, "unlocked": t["code"] in owned, "affordable": bal >= t["price"]} for t in THEMES],
    }}


@router.post("/shop/redeem")
def redeem(payload: dict = Body(...), db: Session = Depends(get_db)):
    code = payload.get("code") or ""
    theme = next((t for t in THEMES if t["code"] == code), None)
    if not theme:
        raise HTTPException(404, "没有这款皮肤")
    if db.query(SelfTheme).filter(SelfTheme.user_id == 1, SelfTheme.code == code).first():
        raise HTTPException(400, "已经拥有这款皮肤")
    bal = balance(db)
    if bal < theme["price"]:
        raise HTTPException(400, f"还差 {theme['price'] - bal} 积分")
    db.add(SelfTheme(user_id=1, code=code))
    award(db, f"redeem:{code}", -theme["price"])
    db.commit()
    return {"ok": True, "data": {"code": code, "balance": balance(db)}, "message": "兑换成功"}


@router.post("/messages/parse")
def parse_messages(payload: dict = Body(...), db: Session = Depends(get_db)):
    text = (payload.get("text") or "").strip()
    if len(text) < 4:
        raise HTTPException(400, "消息内容太短")
    if len(text) > 10000:
        raise HTTPException(400, "单次最多 10000 字")
    base = date.fromisoformat((payload.get("sent_at") or today())[:10])
    items = []
    for line in text.split("\n"):
        line = line.strip()
        if not line:
            continue
        due = ""
        if "明天" in line:
            due = (base + timedelta(days=1)).isoformat()
        elif "后天" in line:
            due = (base + timedelta(days=2)).isoformat()
        elif "下周" in line or "本周" in line or "周" in line:
            target = next((i + 1 for i, c in enumerate("一二三四五六日") if f"周{c}" in line), 0)
            if target:
                offset = (target - base.weekday() - 1) % 7
                if "下周" in line:
                    offset += 7
                due = (base + timedelta(days=offset)).isoformat()
        hint = any(k in line for k in ["请", "麻烦", "记得", "提交", "发我", "整理", "准备", "完成", "前", "@"])
        if not hint and not due:
            continue
        title = line.replace("@", "")
        for prefix in ["麻烦", "请", "记得", "大家", "各位"]:
            if title.startswith(prefix):
                title = title[len(prefix):]
        title = title.strip()[:42]
        items.append({
            "title": title,
            "due_at": due,
            "priority": "P0" if due else "P2",
            "confidence": "high" if due and hint else ("medium" if hint else "low"),
            "snippet": line[:120],
        })
    return {"ok": True, "data": items[:12]}


@router.post("/messages/commit")
def commit_messages(payload: dict = Body(...), db: Session = Depends(get_db)):
    items = payload.get("items") or []
    if not items:
        raise HTTPException(400, "没有选中的待办")
    for it in items:
        db.add(SelfTask(
            user_id=1, title=(it.get("title") or "未命名")[:128], scene="work",
            due_at=it.get("due_at") or "",
            estimate_min=int(it.get("estimate_min") or 30),
            priority=it.get("priority") or "P1",
            status="planned" if it.get("plan_date") else "inbox",
            plan_date=it.get("plan_date") or "", source="message",
        ))
    db.commit()
    return {"ok": True, "data": {"created": len(items)}, "message": f"已创建 {len(items)} 个任务"}


@router.get("/week")
def week_view(start: str = Query(default=""), db: Session = Depends(get_db)):
    w = start or week_start()
    days = []
    for i in range(7):
        d = (date.fromisoformat(w) + timedelta(days=i)).isoformat()
        total = db.query(SelfTask).filter(SelfTask.user_id == 1, SelfTask.plan_date == d).count()
        done = db.query(SelfTask).filter(SelfTask.user_id == 1, SelfTask.plan_date == d,
                                         SelfTask.status == "done").count()
        events = db.query(SelfSchedule).filter(SelfSchedule.user_id == 1,
                                               SelfSchedule.start_at.like(d + "%")).count()
        days.append({"date": d, "taskCount": total, "doneCount": done, "scheduleCount": events})
    return {"ok": True, "data": {"start": w, "days": days}}