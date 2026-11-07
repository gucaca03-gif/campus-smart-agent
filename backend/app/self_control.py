from datetime import date, datetime, timedelta

from fastapi import APIRouter, Body, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from .db import DATA_DIR, get_db
from . import office_ai
from .models import (
    Pomodoro,
    SelfCheckin,
    SelfNote,
    SelfPaper,
    SelfReview,
    SelfSchedule,
    SelfTask,
    SelfTheme,
    SelfThemeState,
    SelfXp,
)

router = APIRouter(prefix="/api/self/control", tags=["self-control"])

STAGES = ["选题", "实验", "写作", "投稿", "返修", "接收", "搁置"]
THEMES = [
    {"code": "default", "name": "校园蓝", "price": 0, "desc": "校徽蓝，默认主题"},
    {"code": "pink", "name": "粉红甜心", "price": 300, "desc": "粉色 Y2K 复古窗口，全站生效"},
    {"code": "night", "name": "夜读", "price": 500, "desc": "深色低亮，适合夜里改稿，全站生效"},
]
BADGES = [
    {"code": "start", "name": "启程", "category": "坚持", "icon": "rocket", "kind": "permanent",
     "condition": "完成第一次状态打卡", "metric": "checkins", "target": 1, "price": 300},
    {"code": "week", "name": "七日", "category": "坚持", "icon": "flame", "kind": "permanent",
     "condition": "连续 7 天有效", "metric": "streak", "target": 7, "price": 300},
    {"code": "paper", "name": "破题", "category": "科研", "icon": "book", "kind": "permanent",
     "condition": "创建第一篇论文/项目", "metric": "paper_count", "target": 1, "price": 300},
    {"code": "move", "name": "第一推进", "category": "科研", "icon": "arrow", "kind": "permanent",
     "condition": "完成第一个任务", "metric": "done_total", "target": 1, "price": 300},
    {"code": "focus10", "name": "专注者", "category": "专注", "icon": "target", "kind": "permanent",
     "condition": "累计完成 10 次专注", "metric": "focus_count", "target": 10, "price": 300},
    {"code": "reviewer", "name": "复盘达人", "category": "探索", "icon": "moon", "kind": "permanent",
     "condition": "完成一次复盘", "metric": "review_count", "target": 1, "price": 300},
    {"code": "inbox0", "name": "清空收件箱", "category": "工作", "icon": "box", "kind": "permanent",
     "condition": "收件箱任务归零", "metric": "inbox_zero", "target": 1, "price": 300},
    {"code": "early", "name": "早八人", "category": "生活", "icon": "sun", "kind": "permanent",
     "condition": "连续 3 天 6:30 前打卡", "metric": "early_count", "target": 1, "price": 300},
    {"code": "badge_focus", "name": "深度专注", "category": "兑换", "icon": "diamond", "kind": "permanent",
     "condition": "积分兑换获得", "metric": "owned_flag", "target": 1, "price": 300, "legacy_code": "badge_focus"},
    {"code": "badge_scholar", "name": "学者之心", "category": "兑换", "icon": "cap", "kind": "permanent",
     "condition": "积分兑换获得", "metric": "owned_flag", "target": 1, "price": 500, "legacy_code": "badge_scholar"},
    {"code": "monthly_focus", "name": "专注之星", "category": "月度", "icon": "star", "kind": "monthly",
     "condition": "本月专注满 300 分钟", "metric": "month_focus_minutes", "target": 300, "price": 300},
    {"code": "monthly_task", "name": "任务之星", "category": "月度", "icon": "trophy", "kind": "monthly",
     "condition": "本月完成 30 个任务", "metric": "month_done_total", "target": 30, "price": 300},
    {"code": "monthly_review", "name": "复盘之星", "category": "月度", "icon": "calendar", "kind": "monthly",
     "condition": "本月复盘满 15 天", "metric": "month_review_days", "target": 15, "price": 400},
    {"code": "monthly_focus_sessions", "name": "自律之星", "category": "月度", "icon": "crown", "kind": "monthly",
     "condition": "本月完成 15 次自律专注", "metric": "month_focus_sessions", "target": 15, "price": 500},
]


def badge_key(code: str, kind: str) -> str:
    """徽章拥有键：永久徽章 badge:<code>；月度徽章按月重置 badge:<code>:YYYY-MM。"""
    return f"badge:{code}" if kind == "permanent" else f"badge:{code}:{today()[:7]}"


def badge_stats(db: Session, uid: int = 1) -> dict:
    """徽章进度统计：长期指标 + 本月指标（月度徽章每月自动刷新）。"""
    month = today()[:7]
    pomos_month = (db.query(Pomodoro)
                   .filter(Pomodoro.user_id == uid, Pomodoro.status == "done",
                           Pomodoro.started_at.like(month + "%"))
                   .all())
    return {
        "checkins": db.query(SelfCheckin).filter(SelfCheckin.user_id == uid).count(),
        "streak": streak(db, uid),
        "paper_count": db.query(SelfPaper).filter(SelfPaper.user_id == uid).count(),
        "done_total": db.query(SelfTask).filter(SelfTask.user_id == uid, SelfTask.status == "done").count(),
        "focus_count": db.query(Pomodoro).filter(Pomodoro.user_id == uid, Pomodoro.status == "done").count(),
        "review_count": db.query(SelfReview).filter(SelfReview.user_id == uid).count(),
        "inbox_zero": 1 if db.query(SelfTask).filter(SelfTask.user_id == uid,
                                                     SelfTask.status == "inbox").count() == 0 else 0,
        "early_count": 0,
        "owned_flag": 1,
        "month_focus_minutes": sum(int(p.minutes or 0) for p in pomos_month),
        "month_focus_sessions": len(pomos_month),
        "month_done_total": db.query(SelfTask)
        .filter(SelfTask.user_id == uid, SelfTask.status == "done",
                SelfTask.completed_at.like(month + "%")).count(),
        "month_review_days": db.query(SelfReview)
        .filter(SelfReview.user_id == uid, SelfReview.week_start.like(month + "%#d")).count(),
    }


def today() -> str:
    return date.today().isoformat()


def week_start(day: str = "") -> str:
    d = date.fromisoformat(day) if day else date.today()
    return (d - timedelta(days=d.weekday())).isoformat()


def _review_key(rtype: str, ref: str) -> str:
    """复盘存储键：weekly=周一日期 / daily=当天日期#d / monthly=当月一号#m。

    SelfReview 的唯一约束是 (user_id, week_start)，用后缀编码区分类型，
    无需给表加列即可共存。
    """
    if rtype == "daily":
        return (ref or today()) + "#d"
    if rtype == "monthly":
        return (ref or today()[:7] + "-01") + "#m"
    return ref or week_start()


def earned(db: Session, uid: int = 1) -> int:
    return sum(x.xp for x in db.query(SelfXp).filter(SelfXp.user_id == uid).all() if x.xp > 0)


def balance(db: Session, uid: int = 1) -> int:
    return max(0, sum(x.xp for x in db.query(SelfXp).filter(SelfXp.user_id == uid).all()))


def active_theme(db: Session, uid: int = 1) -> str:
    row = db.query(SelfThemeState).filter(SelfThemeState.user_id == uid).first()
    return row.code if row else "default"


def set_active_theme(db: Session, code: str, uid: int = 1):
    row = db.query(SelfThemeState).filter(SelfThemeState.user_id == uid).first()
    if row:
        row.code = code
        row.updated_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    else:
        db.add(SelfThemeState(user_id=uid, code=code))


def award(db: Session, action: str, xp: int, ref_id=None, uid: int = 1):
    db.add(SelfXp(user_id=uid, action=action, xp=xp, ref_id=ref_id))


DAILY_XP_CAP = 100  # 每日可获得积分总上限


def award_capped(db: Session, action: str, xp: int, ref_id=None, uid: int = 1, daily_cap: int = 0) -> bool:
    """按日上限发放积分：先校验每日总上限 100，再校验该 action 的 daily_cap。

    返回是否实际发放。xp 为负（扣分）时不设上限。
    """
    if xp > 0:
        today_prefix = today()
        rows = (db.query(SelfXp)
                .filter(SelfXp.user_id == uid, SelfXp.xp > 0)
                .all())
        today_rows = [r for r in rows if (r.created_at or "").startswith(today_prefix)]
        if sum(r.xp for r in today_rows) + xp > DAILY_XP_CAP:
            return False
        if daily_cap > 0:
            gained = sum(r.xp for r in today_rows if r.action == action)
            if gained + xp > daily_cap:
                return False
    award(db, action, xp, ref_id, uid)
    return True


def penalize_once(db: Session, action: str, xp: int, ref_id, uid: int = 1) -> bool:
    """按 ref_id 幂等扣分：同一 ref_id 只扣一次（如逾期任务、超时预约）。"""
    exists = db.query(SelfXp).filter(SelfXp.user_id == uid, SelfXp.action == action,
                                     SelfXp.ref_id == ref_id).first()
    if exists:
        return False
    award(db, action, xp, ref_id, uid)
    return True


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


_SELF_SEED_MARKER = DATA_DIR / ".self_seed_done"
_SELF_XP_MARKER = DATA_DIR / ".self_xp_seeded"


def ensure_seed(db: Session, uid: int = 1):
    if _SELF_SEED_MARKER.exists():
        return
    if db.query(SelfTask).filter(SelfTask.user_id == uid).count() > 0:
        _SELF_SEED_MARKER.write_text("seeded", encoding="utf-8")
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
    _SELF_SEED_MARKER.write_text("seeded", encoding="utf-8")


def ensure_xp(db: Session, uid: int = 1):
    """老库补一次积分：按已有打卡、完成任务与专注记录折算。"""
    if _SELF_XP_MARKER.exists():
        return
    if db.query(SelfXp).filter(SelfXp.user_id == uid).count() > 0:
        _SELF_XP_MARKER.write_text("seeded", encoding="utf-8")
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
    _SELF_XP_MARKER.write_text("seeded", encoding="utf-8")


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
                    SelfTask.status.in_(["planned", "partial", "done"]))
            .order_by(SelfTask.priority, SelfTask.id).all())
    tasks = [task_dict(t) for t in rows]
    done_today = len([x for x in rows if x.status == "done"])
    overdue_q = (db.query(SelfTask)
                 .filter(SelfTask.user_id == uid, SelfTask.status.in_(["planned", "partial"]),
                         SelfTask.plan_date < d, SelfTask.plan_date != ""))
    overdue = overdue_q.count()
    overdue_tasks = [task_dict(t) for t in overdue_q.order_by(SelfTask.plan_date).limit(20).all()]
    overdue_penalized = False
    for t in overdue_tasks:
        if penalize_once(db, "task_overdue", -10, t["id"], uid):
            overdue_penalized = True
    if overdue_penalized:
        db.commit()
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
            "today_xp": db.query(SelfXp).filter(SelfXp.user_id == uid,
                                                SelfXp.created_at.like(d + "%"),
                                                SelfXp.xp > 0).with_entities(
                                                __import__("sqlalchemy").func.coalesce(__import__("sqlalchemy").func.sum(SelfXp.xp), 0)).scalar() or 0,
            "done_today": done_today,
            "overdue": overdue,
            "overdue_tasks": overdue_tasks,
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


@router.get("/focus-stats")
def focus_stats(days: int = Query(default=7), db: Session = Depends(get_db)):
    """专注趋势：按任务分类聚合已完成的番茄钟，供饼图与分类时长列表使用。"""
    from datetime import timedelta

    uid = 1
    days = max(1, min(days, 90))
    since = (date.today() - timedelta(days=days - 1)).isoformat()
    pomos = (db.query(Pomodoro)
             .filter(Pomodoro.user_id == uid, Pomodoro.status == "done",
                     Pomodoro.started_at >= since)
             .all())
    buckets = {}
    by_date = {}
    for pm in pomos:
        key = (pm.task or "未分类").strip()[:24] or "未分类"
        if key == "专注":
            key = "临时专注"
        b = buckets.setdefault(key, {"task": key, "minutes": 0, "count": 0})
        b["minutes"] += int(pm.minutes or 0)
        b["count"] += 1
        day_key = str(pm.started_at or "")[:10]
        rec = by_date.setdefault(day_key, {"minutes": 0, "count": 0})
        rec["minutes"] += int(pm.minutes or 0)
        rec["count"] += 1
    daily = []
    for offset in range(days):
        day = date.today() - timedelta(days=days - 1 - offset)
        rec = by_date.get(day.isoformat(), {"minutes": 0, "count": 0})
        daily.append({"date": day.isoformat(), "minutes": rec["minutes"], "count": rec["count"]})
    items = sorted(buckets.values(), key=lambda x: -x["minutes"])
    total_min = sum(x["minutes"] for x in items)
    return {
        "ok": True,
        "data": {
            "days": days,
            "items": items,
            "daily": daily,
            "total_minutes": total_min,
            "total_count": sum(x["count"] for x in items),
        },
    }


@router.get("/tasks")
def list_tasks(status: str = Query(default=""), db: Session = Depends(get_db)):
    q = db.query(SelfTask).filter(SelfTask.user_id == 1)
    if status:
        q = q.filter(SelfTask.status == status)
    else:
        q = q.filter(SelfTask.status != "deleted")
    return {"ok": True, "data": [task_dict(t) for t in q.order_by(SelfTask.id.desc()).limit(200).all()]}


@router.get("/tasks/parse/model")
def parse_model_info():
    """当前 AI 提取使用的模型配置（不含密钥），供界面展示与自检。"""
    return {"ok": True, "data": office_ai.model_info(), "message": ""}


@router.post("/tasks/parse")
def parse_task_from_text(payload: dict = Body(...)):
    """粘贴微信/QQ 通知原文，AI 提取待办字段（不落库，前端确认后走 /tasks 创建）。"""
    text = (payload.get("text") or "").strip()
    if not text:
        raise HTTPException(400, "请粘贴通知原文")
    if len(text) > 4000:
        raise HTTPException(400, "文本过长（上限 4000 字）")
    try:
        parsed = office_ai.llm_parse_task(text, today())
    except office_ai.AiUnavailable as e:
        raise HTTPException(503, str(e))
    if not parsed["title"]:
        raise HTTPException(422, "未能从文本中识别出待办任务，请检查原文")
    return {"ok": True, "data": parsed, "message": "识别完成，可修改后加入待办"}


@router.post("/tasks/parse-multi")
def parse_tasks_multi(payload: dict = Body(...)):
    """聊天记录 → 多条待办解析（办公模块"聊天转待办"，不落库）。"""
    text = (payload.get("text") or "").strip()
    if not text:
        raise HTTPException(400, "请粘贴聊天记录")
    if len(text) > 4000:
        raise HTTPException(400, "文本过长（上限 4000 字）")
    try:
        tasks = office_ai.llm_parse_tasks_multi(text, today())
    except office_ai.AiUnavailable as e:
        raise HTTPException(503, str(e))
    if not tasks:
        raise HTTPException(422, "未能从聊天记录中识别出待办事项")
    return {"ok": True, "data": {"tasks": tasks}, "message": f"识别出 {len(tasks)} 条待办"}


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
        award_capped(db, "task_done", 2, t.id, daily_cap=20)
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
        award_capped(db, "checkin", 5)
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


@router.get("/month-stats")
def month_stats(month: str = Query(default=""), db: Session = Depends(get_db)):
    """本月计划情况 + 每日完成序列（计划页左栏统计与右栏柱形图数据源）。"""
    m = month or today()[:7]
    y, mo = int(m[:4]), int(m[5:7])
    first = f"{m}-01"
    ndays = (date(y + 1, 1, 1) if mo == 12 else date(y, mo + 1, 1)) - date(y, mo, 1)
    ndays = ndays.days
    last = f"{m}-{ndays:02d}"
    rows = (db.query(SelfTask)
            .filter(SelfTask.user_id == 1, SelfTask.status != "deleted",
                    SelfTask.plan_date >= first, SelfTask.plan_date <= last)
            .all())
    d_today = today()
    total = len(rows)
    done = len([x for x in rows if x.status == "done"])
    ongoing = len([x for x in rows if x.status != "done" and x.plan_date <= d_today])
    not_started = len([x for x in rows if x.status != "done" and x.plan_date > d_today])
    series = []
    for i in range(ndays):
        d = f"{m}-{i + 1:02d}"
        day_rows = [x for x in rows if x.plan_date == d]
        series.append({
            "date": d,
            "total": len(day_rows),
            "done": len([x for x in day_rows if x.status == "done"]),
            "overdue": 1 if d < d_today and any(x.status != "done" for x in day_rows) else 0,
        })
    return {"ok": True, "data": {
        "month": m, "days": ndays, "total": total, "done": done,
        "ongoing": ongoing, "not_started": not_started,
        "rate": round(done / total * 100, 1) if total else 0,
        "series": series,
    }}


@router.get("/reviews")
def get_review(week: str = Query(default=""), type: str = Query(default="weekly"),
               day: str = Query(default=""), month: str = Query(default=""),
               db: Session = Depends(get_db)):
    if type in ("daily", "monthly"):
        ref = day if type == "daily" else month
        key = _review_key(type, ref)
        row = db.query(SelfReview).filter(SelfReview.user_id == 1, SelfReview.week_start == key).first()
        return {"ok": True, "data": {
            "type": type,
            "ref": key,
            "review": ({"summary": row.summary, "focus1": row.focus1, "focus2": row.focus2,
                        "focus3": row.focus3} if row else None),
        }}
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
    rtype = payload.get("type") or "weekly"
    if rtype == "daily":
        w = _review_key("daily", payload.get("day") or today())
        xp = 5
    elif rtype == "monthly":
        w = _review_key("monthly", payload.get("month") or today()[:7] + "-01")
        xp = 30
    else:
        w = payload.get("week") or week_start()
        xp = 30
    row = db.query(SelfReview).filter(SelfReview.user_id == 1, SelfReview.week_start == w).first()
    if not row:
        row = SelfReview(user_id=1, week_start=w)
        db.add(row)
        award_capped(db, "daily_review" if rtype == "daily" else "weekly_review", xp, daily_cap=5 if rtype == "daily" else 0)
    row.summary = payload.get("summary") or ""
    row.focus1 = payload.get("focus1") or ""
    row.focus2 = payload.get("focus2") or ""
    row.focus3 = payload.get("focus3") or ""
    db.commit()
    return {"ok": True, "data": {"week": w, "type": rtype}, "message": "复盘已保存"}


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
    award_capped(db, "paper_create", 50)
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
    award_capped(db, "paper_stage", 50, p.id)
    db.commit()
    return {"ok": True, "data": {"id": p.id, "stage": p.stage}, "message": "阶段已更新"}


@router.get("/achievements")
def achievements(db: Session = Depends(get_db)):
    ensure_xp(db)
    uid = 1
    xp = earned(db, uid)
    st = streak(db, uid)
    stats = badge_stats(db, uid)
    bal = balance(db, uid)
    owned_codes = {t.code for t in db.query(SelfTheme).filter(SelfTheme.user_id == uid).all()}
    badges_out = []
    for b in BADGES:
        cur = stats.get(b["metric"], 0)
        met = cur >= b["target"]
        key = badge_key(b["code"], b["kind"])
        legacy = b.get("legacy_code")
        owned = key in owned_codes or bool(legacy and legacy in owned_codes)
        badges_out.append({
            **b,
            "unlocked": owned,
            "progress": {"cur": min(cur, b["target"]), "target": b["target"], "met": met},
            "owned": owned,
            "affordable": bal >= b["price"],
            "redeemable": met and not owned and bal >= b["price"],
        })
    xp_groups = {
        "library": ("图书馆自习签到", {"seat_checkin", "seat_early_release", "seat_auto_end"}),
        "self": ("自我管理", {"task_done", "daily_review", "focus_done", "checkin", "seed_task", "seed_focus",
                              "seed_checkin", "seed_paper", "seed_xp", "paper_create", "paper_stage", "weekly_review"}),
        "penalty": ("积分扣除", {"no_show_penalty", "task_overdue"}),
        "redeem": ("积分兑换", {"redeem"}),
    }
    rows = db.query(SelfXp).filter(SelfXp.user_id == uid).all()
    breakdown = {key: {"label": label, "xp": 0, "count": 0} for key, (label, _) in xp_groups.items()}
    for row in rows:
        action = row.action or ""
        group = None
        if action.startswith("redeem"):
            group = "redeem"
        else:
            for key, (_, actions) in xp_groups.items():
                if action in actions:
                    group = key
                    break
        if group:
            breakdown[group]["xp"] += int(row.xp or 0)
            breakdown[group]["count"] += 1
    xp_breakdown = [{"group": k, "label": v["label"], "xp": v["xp"], "count": v["count"]}
                    for k, v in breakdown.items() if v["count"] and v["xp"] > 0]
    return {"ok": True, "data": {
        "xp": xp, "level": xp // 100 + 1, "level_progress": xp % 100, "streak": st,
        "xp_breakdown": xp_breakdown,
        "badges": badges_out,
    }}


XP_ACTIONS_META = {
    "task_done": "完成今日计划任务",
    "task_overdue": "任务逾期未完成",
    "daily_review": "完成每日复盘",
    "weekly_review": "完成复盘",
    "focus_done": "完成自律专注（超 20 分钟）",
    "checkin": "每日状态打卡",
    "seat_checkin": "图书馆自习定位签到",
    "seat_early_release": "图书馆自习结算",
    "seat_auto_end": "图书馆自习自动结算",
    "no_show_penalty": "预约超时未签到",
    "manual_grant": "积分赠送",
    "paper_create": "创建论文/项目",
    "paper_stage": "论文阶段推进",
    "seed_task": "初始演示数据",
    "seed_focus": "初始演示数据",
    "seed_checkin": "初始演示数据",
    "seed_paper": "初始演示数据",
    "seed_xp": "初始演示数据",
}

XP_LOG_GROUPS = {
    "library": {"seat_checkin", "seat_early_release", "seat_auto_end"},
    "self": {"task_done", "daily_review", "focus_done", "checkin", "seed_task", "seed_focus",
             "seed_checkin", "seed_paper", "seed_xp", "paper_create", "paper_stage", "weekly_review"},
    "penalty": {"no_show_penalty", "task_overdue"},
    "redeem": None,  # 以 redeem: 开头
}


@router.get("/xp-logs")
def xp_logs(group: str = Query(default=""), limit: int = Query(default=50, ge=1, le=200),
            db: Session = Depends(get_db)):
    """积分构成明细：某类积分的每一条获得时间与说明。"""
    uid = 1
    q = db.query(SelfXp).filter(SelfXp.user_id == uid)
    g = (group or "").strip()
    if g:
        if g not in XP_LOG_GROUPS:
            raise HTTPException(404, "未知的积分分组")
        actions = XP_LOG_GROUPS[g]
        if actions is None:
            q = q.filter(SelfXp.action.like("redeem:%"))
        else:
            q = q.filter(SelfXp.action.in_(actions))
    rows = q.order_by(SelfXp.id.desc()).limit(limit).all()
    out = []
    for r in rows:
        meta = XP_ACTIONS_META.get(r.action or "", "")
        note = r.action or ""
        if (r.action or "").startswith("redeem:"):
            meta = "兑换皮肤/徽章"
        out.append({
            "id": r.id,
            "action": r.action,
            "xp": int(r.xp or 0),
            "label": meta or note,
            "time": r.created_at,
            "ref_id": r.ref_id,
        })
    return {"ok": True, "data": {"group": g, "total": len(out), "logs": out}}


@router.get("/shop")
def shop(db: Session = Depends(get_db)):
    ensure_xp(db)
    uid = 1
    owned = {t.code for t in db.query(SelfTheme).filter(SelfTheme.user_id == uid).all()}
    owned.add("default")
    bal = balance(db, uid)
    return {"ok": True, "data": {
        "earned": earned(db, uid), "balance": bal, "active": active_theme(db, uid),
        "themes": [{**t, "unlocked": t["code"] in owned, "affordable": bal >= t["price"]} for t in THEMES],

    }}


@router.post("/shop/redeem")
def redeem(payload: dict = Body(...), db: Session = Depends(get_db)):
    code = payload.get("code") or ""
    theme = next((t for t in THEMES if t["code"] == code), None)
    if theme:
        if db.query(SelfTheme).filter(SelfTheme.user_id == 1, SelfTheme.code == code).first():
            raise HTTPException(400, "已经拥有这款皮肤")
        bal = balance(db)
        if bal < theme["price"]:
            raise HTTPException(400, f"还差 {theme['price'] - bal} 积分")
        db.add(SelfTheme(user_id=1, code=code))
        award(db, f"redeem:{code}", -theme["price"])
        set_active_theme(db, code)
        db.commit()
        return {"ok": True, "data": {"code": code, "balance": balance(db)}, "message": "皮肤兑换成功"}
    badge = next((b for b in BADGES if b["code"] == code), None)
    if not badge:
        raise HTTPException(404, "没有这个商品")
    stats = badge_stats(db, 1)
    if stats.get(badge["metric"], 0) < badge["target"]:
        raise HTTPException(400, f"条件未达成：{badge['condition']}")
    key = badge_key(code, badge["kind"])
    if db.query(SelfTheme).filter(SelfTheme.user_id == 1, SelfTheme.code == key).first():
        raise HTTPException(400, "本期已兑换过这枚徽章")
    bal = balance(db)
    if bal < badge["price"]:
        raise HTTPException(400, f"还差 {badge['price'] - bal} 积分")
    db.add(SelfTheme(user_id=1, code=key))
    award(db, f"redeem:{code}", -badge["price"])
    db.commit()
    return {"ok": True, "data": {"code": code, "badge_key": key, "balance": balance(db)}, "message": "徽章兑换成功"}


@router.post("/shop/apply")
def apply_shop_theme(payload: dict = Body(...), db: Session = Depends(get_db)):
    code = payload.get("code") or "default"
    if code not in {t["code"] for t in THEMES}:
        raise HTTPException(400, "没有这款皮肤")
    if code != "default":
        owned = db.query(SelfTheme).filter(SelfTheme.user_id == 1, SelfTheme.code == code).first()
        if not owned:
            raise HTTPException(400, "还没有拥有这款皮肤")
    set_active_theme(db, code)
    db.commit()
    return {"ok": True, "data": {"code": code}, "message": "已切换皮肤"}


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