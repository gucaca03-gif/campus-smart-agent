"""文件识别与核查路由（从 main.py 拆出）。"""

import asyncio
import json
import random
import re
from datetime import date, datetime, timedelta

from fastapi import APIRouter, Body, Depends, File, Form, Header, HTTPException, Query, UploadFile
from sqlalchemy import text
from sqlalchemy.orm import Session

from ..db import SessionLocal, get_db
from ..api_utils import ok, fail, _requester
from .. import office_ai, tools, deal_decision
from ..cloud import obs
from ..office import extract_kv, match_files, review_submission
from ..office_docs import (
    KIND_LABELS, extract_conditions, file_to_text, parse_document, preview_document, verify_applications,
)

from ..models import (
    Base,
    Booking,
    BuddyPost,
    BuddyProfile,
    BuddyApplication,
    BuddyChat,
    BuddyAutoReply,
    BuddyMatchLog,
    SeatFavorite,
    Supervision,
    CalendarEvent,
    Campus,
    ChatSession,
    ChatMessage,
    DealPost,
    DealVote,
    Errand,
    LostFound,
    Message,
    News,
    OfficeReview,
    Place,
    PlanItem,
    Pomodoro,
    PurchaseIntent,
    Repair,
    Resource,
    ResourceLink,
    SchoolMetric,
    SelfTask,
    StudyPlan,
    # 省一省 · 理性消费决策助手
    DataSource,
    Product,
    Quote,
    PriceSnapshot,
    DealPriceCache,
    PurchasePlan,
    PlanVersion,
    PlanGroup,
    GroupMember,
    PlanVote,
    PlanComment,
    PlanResult,
    PriceAlert,
    AlertLog,
    EvidenceSource,
    PurchaseRecord,
    DealReport,
)

from ..services import (
    WEEKDAY_CN,
    assistant_reply,
    away_booking,
    booking_to_dict,
    build_route,
    cancel_booking,
    checkin_booking,
    create_booking,
    decide_booking,
    ensure_slots,
    expire_seat_bookings,
    release_seat_reservation,
    parse_date,
    resolve_place,
)

from ..buddy_test import (  # noqa: E402
    ANIMAL_QUESTIONS,
    BATTERY_QUESTIONS,
    MBTI_QUESTIONS,
    SURVIVAL_QUESTIONS,
    mbti_compat,
    score_animal,
    score_battery,
    score_mbti,
    score_survival,
    reading_template,
)

router = APIRouter()


def review_to_dict(r: OfficeReview) -> dict:
    try:
        report = json.loads(r.report or "{}")
    except json.JSONDecodeError:
        report = {}
    return {
        "id": r.id,
        "applicant_name": r.applicant_name,
        "student_id": r.student_id,
        "achievement_title": r.achievement_title,
        "award_type": r.award_type,
        "award_level": r.award_level,
        "award_date": r.award_date,
        "material_name": r.material_name,
        "verdict": r.verdict,
        "report": report,
        "created_at": r.created_at,
    }

@router.post("/api/office/reviews")
def create_office_review(payload: dict = Body(...), db: Session = Depends(get_db)):
    form = {
        "applicant_name": (payload.get("applicant_name") or "").strip(),
        "student_id": (payload.get("student_id") or "").strip(),
        "achievement_title": (payload.get("achievement_title") or "").strip(),
        "award_type": (payload.get("award_type") or "").strip(),
        "award_level": (payload.get("award_level") or "").strip(),
        "award_date": (payload.get("award_date") or "").strip(),
    }
    material_text = (payload.get("material_text") or "").strip()
    if not form["applicant_name"] or not form["achievement_title"]:
        fail("申报人姓名与成果名称不能为空", "VALIDATION", 400)
    if not material_text:
        fail("请上传或粘贴佐证材料内容", "VALIDATION", 400)
    report = review_submission(form, material_text)
    review = OfficeReview(
        user_id=1,
        **form,
        material_name=(payload.get("material_name") or "粘贴文本")[:120],
        material_text=material_text[:8000],
        report=json.dumps(report, ensure_ascii=False),
        verdict=report["verdict"],
    )
    db.add(review)
    db.commit()
    db.refresh(review)
    return ok(review_to_dict(review), "审核完成")

@router.get("/api/office/reviews")
def list_office_reviews(db: Session = Depends(get_db)):
    rows = db.query(OfficeReview).order_by(OfficeReview.id.desc()).limit(50).all()
    return ok([review_to_dict(r) for r in rows])

@router.get("/api/office/reviews/{review_id}")
def get_office_review(review_id: int, db: Session = Depends(get_db)):
    r = db.get(OfficeReview, review_id)
    if not r:
        fail("记录不存在", "NOT_FOUND", 404)
    return ok(review_to_dict(r))

@router.post("/api/office/parse-pack")
async def parse_pack(files: list[UploadFile] = File(...)):
    parsed = []
    notice_text, policy_text, quota_rows = "", "", []
    for f in files:
        data = await f.read()
        if len(data) > 10 * 1024 * 1024:
            fail(f"{f.filename} 超过 10MB 限制", "VALIDATION", 400)
        doc = parse_document(f.filename or "未命名", data)
        parsed.append(
            {
                "name": doc["name"],
                "kind": doc["kind"],
                "kind_label": KIND_LABELS.get(doc["kind"], "文档"),
                "text": doc["text"][:20000],
                "table": doc["table"],
                "preview": doc["text"][:160].replace("\n", " "),
            }
        )
        if doc["kind"] == "notice":
            notice_text += "\n" + doc["text"]
        elif doc["kind"] == "policy":
            policy_text += "\n" + doc["text"]
        elif doc["kind"] == "quota" and doc["table"]:
            quota_rows = doc["table"]
    conditions = extract_conditions(notice_text, policy_text)
    return ok({"files": parsed, "conditions": conditions, "quota_rows": quota_rows})

@router.post("/api/office/verify-pack")
async def verify_pack(
    files: list[UploadFile] = File(...),
    conditions: str = Form(default="[]"),
    quota_rows: str = Form(default="[]"),
):
    try:
        conds = json.loads(conditions)
        quota = json.loads(quota_rows)
    except json.JSONDecodeError:
        fail("条件数据格式错误", "VALIDATION", 400)
    apps = []
    for f in files:
        data = await f.read()
        if len(data) > 10 * 1024 * 1024:
            fail(f"{f.filename} 超过 10MB 限制", "VALIDATION", 400)
        doc = parse_document(f.filename or "未命名", data)
        apps.append({"name": f.filename, "text": doc["text"]})
    if not apps:
        fail("请至少上传一份申请材料", "VALIDATION", 400)
    if len(apps) > 50:
        fail("单次最多核实 50 份申请", "VALIDATION", 400)
    report = verify_applications(conds, quota, apps)
    return ok(report, "核实完成")

@router.post("/api/office/extract-fields")
async def extract_fields(files: list[UploadFile] = File(...)):
    """字段提取：文件（PDF/图片/docx）→ 文本/OCR → LLM 提取关键字段与值。"""
    if not files:
        fail("请至少上传一份文件", "VALIDATION", 400)
    results = []
    for f in files:
        data = await f.read()
        if len(data) > 15 * 1024 * 1024:
            fail(f"{f.filename} 超过 15MB 限制", "VALIDATION", 400)
        obs_key = ""
        if obs.enabled():
            saved, key_or_msg = obs.put_bytes(f.filename or "未命名", data)
            if saved:
                obs_key = key_or_msg
        try:
            doc = file_to_text(f.filename or "未命名", data)
        except office_ai.AiUnavailable as e:
            fail(str(e), "AI_UNAVAILABLE", 503)
        if not (doc["text"] or "").strip():
            results.append(
                {
                    "name": doc["name"],
                    "source": doc["source"],
                    "text": "",
                    "fields": [],
                    "obs_key": obs_key,
                    "error": "未能提取到文本（可能是空文件或不可解析的格式）",
                }
            )
            continue
        try:
            fields = office_ai.llm_extract_key_fields(doc["text"])
        except office_ai.AiUnavailable as e:
            fail(str(e), "AI_UNAVAILABLE", 503)
        results.append(
            {
                "name": doc["name"],
                "source": doc["source"],
                "text": doc["text"][:6000],
                "fields": fields,
                "obs_key": obs_key,
                "error": "",
            }
        )
    return ok({"files": results, "obs_enabled": obs.enabled()}, "提取完成")

@router.post("/api/office/preview")
async def office_preview(file: UploadFile = File(...)):
    """文件预览：pdf/图片返回渲染类型（前端用 blob 原生渲染），docx 返回文本或内嵌图片。"""
    data = await file.read()
    if len(data) > 20 * 1024 * 1024:
        fail("文件超过 20MB，无法预览", "VALIDATION", 400)
    result = preview_document(file.filename or "未命名", data)
    return ok(result)

@router.post("/api/office/build-rule")
async def build_rule(files: list[UploadFile] = File(...)):
    """上传规则文档（Word/PDF/图片等），AI 分析生成核查规则 JSON。"""
    if not files:
        fail("请上传复核通知、档案管理办法、核对表等规则文档", "VALIDATION", 400)
    if len(files) > 10:
        fail("单次最多上传 10 份规则文档", "VALIDATION", 400)
    texts, names, metas = [], [], []
    for f in files:
        data = await f.read()
        if len(data) > 15 * 1024 * 1024:
            fail(f"{f.filename} 超过 15MB 限制", "VALIDATION", 400)
        try:
            doc = file_to_text(f.filename or "未命名", data)
        except office_ai.AiUnavailable as e:
            fail(str(e), "AI_UNAVAILABLE", 503)
        texts.append(doc["text"] or "")
        names.append(doc["name"])
        metas.append({"name": doc["name"], "source": doc["source"], "chars": len(doc["text"] or "")})
    if not any(t.strip() for t in texts):
        fail("未能从文档中提取到文字内容", "VALIDATION", 400)
    try:
        rule = office_ai.llm_build_rule(texts, names)
    except office_ai.AiUnavailable as e:
        fail(str(e), "AI_UNAVAILABLE", 503)
    if not rule.get("labels"):
        fail("未能从文档中识别出可核查字段，请确认文档内容", "AI_NO_RULE", 422)
    return ok({"docs": metas, "rule": rule}, "规则生成完成")

@router.post("/api/office/verify-match")
async def verify_match(
    files: list[UploadFile] = File(...),
    rule_file: UploadFile = File(...),
):
    """文件核查匹配：规则文件（compare_config + anchor）+ 待核查文件。

    流水线：文件 → 文本（PDF 解析 / 扫描件 OCR / 图片 OCR）→ LLM 按规则 labels 提取字段 → 规则匹配。
    """
    rule_raw = await rule_file.read()
    try:
        rule = json.loads(rule_raw.decode("utf-8", errors="ignore"))
    except json.JSONDecodeError:
        fail("规则文件不是合法 JSON", "VALIDATION", 400)
    rules = rule.get("rules") or []
    combinator = (rule.get("combinator") or "and").lower()
    labels = []
    for r in rules:
        for l in r.get("labels", []):
            if l not in labels:
                labels.append(l)
    if not labels:
        fail("规则文件中未定义 labels", "VALIDATION", 400)
    anchor = rule.get("anchor") or {}
    if not isinstance(anchor, dict):
        anchor = {}

    if not files:
        fail("请上传待核查文件", "VALIDATION", 400)
    if len(files) > 20:
        fail("单次最多核查 20 份文件", "VALIDATION", 400)

    sem = asyncio.Semaphore(3)

    async def process_one(f):
        async with sem:
            data = await f.read()
            if len(data) > 15 * 1024 * 1024:
                return {"error": f"{f.filename} 超过 15MB 限制"}
            try:
                doc = await asyncio.to_thread(file_to_text, f.filename or "未命名", data)
            except office_ai.AiUnavailable as e:
                return {"error": str(e), "ai": True}
            extracted = {}
            if (doc["text"] or "").strip():
                try:
                    extracted = await asyncio.to_thread(office_ai.llm_extract_fields, doc["text"], labels)
                except office_ai.AiUnavailable as e:
                    return {"error": str(e), "ai": True}
            return {"name": doc["name"], "source": doc["source"], "text_len": len(doc["text"] or ""), "values": extracted}

    gathered = await asyncio.gather(*(process_one(f) for f in files))
    for g in gathered:
        if isinstance(g, dict) and g.get("error"):
            fail(g["error"], "AI_UNAVAILABLE" if g.get("ai") else "VALIDATION", 503 if g.get("ai") else 400)
    results = gathered

    if not anchor:
        for r in results:
            if any(r["values"].get(l) for l in labels):
                anchor = {l: r["values"].get(l, "") for l in labels}
                break

    def norm(s):
        return re.sub(r"\s+", "", str(s or "")).lower()

    def match_type_of(label):
        for r in rules:
            if label in r.get("labels", []):
                return r.get("match_type", "equal")
        return "equal"

    # 第一遍：字符串级快速判定；字面不相等的收集起来，稍后一次性批量语义判定
    file_checks = []
    all_pending = []
    for r in results:
        checks = []
        for l in labels:
            expected = str(anchor.get(l, "")).strip()
            actual = str(r["values"].get(l, "")).strip()
            if not expected:
                verdict = "skip"
            elif not actual:
                verdict = "missing"
            elif norm(expected) == norm(actual):
                verdict = "pass"
            elif match_type_of(l) == "contains":
                verdict = "pass" if (expected in actual or actual in expected) else "fail"
            else:
                verdict = "semantic"
                all_pending.append({"name": r["name"], "label": l, "expected": expected, "actual": actual})
            checks.append({"label": l, "expected": expected, "actual": actual, "verdict": verdict})
        file_checks.append(checks)

    if all_pending:
        try:
            judged = await asyncio.to_thread(office_ai.llm_judge_values, all_pending)
        except office_ai.AiUnavailable as e:
            fail(str(e), "AI_UNAVAILABLE", 503)
        for r, checks in zip(results, file_checks):
            for c in checks:
                if c["verdict"] == "semantic":
                    j = judged.get(f"{r['name']}||{c['label']}", judged.get(c["label"]))
                    c["verdict"] = j if j in ("pass", "fail") else "fail"

    verdicts = []
    for r, checks in zip(results, file_checks):
        valid = [c for c in checks if c["verdict"] != "skip"]
        fails = [c for c in valid if c["verdict"] == "fail"]
        passes = [c for c in valid if c["verdict"] == "pass"]
        # 判定原则：没有明确的不一致即通过；未提及（missing）不否决，留人工参考
        if combinator == "or":
            passed = bool(passes) or not fails
        else:
            passed = not fails
        verdicts.append(
            {
                "name": r["name"],
                "source": r["source"],
                "checks": checks,
                "passed": passed,
                "pass_count": len(passes),
                "missing_count": len([c for c in valid if c["verdict"] == "missing"]),
                "fail_count": len(fails),
                "total": len(valid),
            }
        )
    passed_n = sum(1 for v in verdicts if v["passed"])
    return ok(
        {
            "labels": labels,
            "combinator": combinator,
            "anchor": anchor,
            "results": verdicts,
            "summary": {
                "total": len(verdicts),
                "passed": passed_n,
                "failed": len(verdicts) - passed_n,
                "rate": round(passed_n / len(verdicts) * 100) if verdicts else 0,
            },
        },
        "核查完成",
    )

