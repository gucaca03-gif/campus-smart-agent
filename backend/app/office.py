import json
import re
from difflib import SequenceMatcher

LEVEL_KEYWORDS = {
    "国家级": ["国家级", "全国", "国赛"],
    "省级": ["省级", "省赛", "江苏省"],
    "市级": ["市级", "市赛", "徐州市"],
    "校级": ["校级", "校赛", "江苏师范大学"],
}
TYPE_KEYWORDS = {
    "论文": ["论文", "期刊", "发表", "SCI", "EI", "CSSCI", "收录"],
    "专利": ["专利", "发明", "实用新型", "授权"],
    "竞赛": ["竞赛", "大赛", "比赛", "一等奖", "二等奖", "三等奖", "金奖", "银奖", "铜奖"],
    "项目": ["项目", "课题", "立项", "结题", "基金"],
}

DATE_PATTERN = re.compile(r"(\d{4})\s*[-年/]\s*(\d{1,2})\s*[-月/]\s*(\d{1,2})\s*日?")


def similarity(a: str, b: str) -> float:
    return SequenceMatcher(None, a, b).ratio()


def extract_dates(text: str) -> list[str]:
    return [f"{y}-{int(m):02d}-{int(d):02d}" for y, m, d in DATE_PATTERN.findall(text)]


def find_keywords(text: str, keywords: list[str]) -> list[str]:
    return [k for k in keywords if k in text]


def review_submission(form: dict, material_text: str) -> dict:
    text = material_text or ""
    checks = []

    name = form.get("applicant_name", "").strip()
    if name:
        hit = name in text
        checks.append(
            {
                "field": "applicant_name",
                "label": "申报人姓名",
                "expect": name,
                "found": name if hit else "",
                "verdict": "pass" if hit else "fail",
                "evidence": f"材料中{'出现' if hit else '未出现'}申报人姓名“{name}”",
            }
        )

    sid = form.get("student_id", "").strip()
    if sid:
        hit = sid in text
        checks.append(
            {
                "field": "student_id",
                "label": "学号/工号",
                "expect": sid,
                "found": sid if hit else "",
                "verdict": "pass" if hit else "warn",
                "evidence": f"材料中{'出现' if hit else '未出现'}号码“{sid}”（部分佐证材料不含学号）",
            }
        )

    title = form.get("achievement_title", "").strip()
    if title:
        if title in text:
            verdict, found, sim = "pass", title, 1.0
        else:
            best, best_sim = "", 0.0
            for seg in re.split(r"[\s，。；、：《》\"'“”\n]+", text):
                if len(seg) >= 4:
                    r = similarity(title, seg)
                    if r > best_sim:
                        best, best_sim = seg, r
            if best_sim >= 0.75:
                verdict, found, sim = "warn", best, best_sim
            else:
                verdict, found, sim = "fail", best, best_sim
        evidence = {
            "pass": "材料中出现完全一致成果名称",
            "warn": f"材料中存在近似表述（相似度 {sim:.0%}），建议人工核对",
            "fail": "材料中未找到与申报成果名称相符的内容",
        }[verdict]
        checks.append(
            {
                "field": "achievement_title",
                "label": "成果名称",
                "expect": title,
                "found": found,
                "verdict": verdict,
                "evidence": evidence,
            }
        )

    award_date = form.get("award_date", "").strip()
    if award_date:
        dates = extract_dates(text)
        hit = award_date in dates
        verdict = "pass" if hit else ("warn" if dates else "fail")
        checks.append(
            {
                "field": "award_date",
                "label": "成果取得日期",
                "expect": award_date,
                "found": "、".join(dates[:4]),
                "verdict": verdict,
                "evidence": (
                    "材料中的日期与申报日期一致"
                    if hit
                    else f"材料中识别到 {len(dates)} 个日期，{'未包含申报日期' if dates else '无法识别日期'}"
                ),
            }
        )

    level = form.get("award_level", "").strip()
    if level and level in LEVEL_KEYWORDS:
        hits = find_keywords(text, LEVEL_KEYWORDS[level])
        other_hits = {
            lv: find_keywords(text, kws) for lv, kws in LEVEL_KEYWORDS.items() if lv != level
        }
        other_flat = [k for v in other_hits.values() for k in v]
        if hits and not other_flat:
            verdict = "pass"
        elif hits and other_flat:
            verdict = "warn"
        elif other_flat:
            verdict = "fail"
        else:
            verdict = "warn"
        checks.append(
            {
                "field": "award_level",
                "label": "成果级别",
                "expect": level,
                "found": "、".join(hits or other_flat) or "未识别",
                "verdict": verdict,
                "evidence": {
                    "pass": f"材料中出现“{'、'.join(hits)}”等 {level} 标识",
                    "warn": f"材料中级别标识不明确（识别到：{'、'.join(hits or other_flat) or '无'}）",
                    "fail": f"材料中出现其他级别标识（{'、'.join(other_flat)}），与申报“{level}”不符",
                }[verdict],
            }
        )

    atype = form.get("award_type", "").strip()
    if atype and atype in TYPE_KEYWORDS:
        hits = find_keywords(text, TYPE_KEYWORDS[atype])
        checks.append(
            {
                "field": "award_type",
                "label": "成果类型",
                "expect": atype,
                "found": "、".join(hits) or "未识别",
                "verdict": "pass" if hits else "warn",
                "evidence": (
                    f"材料中出现“{'、'.join(hits)}”等 {atype} 类关键词"
                    if hits
                    else f"材料中未出现明显 {atype} 类关键词"
                ),
            }
        )

    fails = [c for c in checks if c["verdict"] == "fail"]
    warns = [c for c in checks if c["verdict"] == "warn"]
    if fails:
        verdict, conclusion = "fail", f"发现 {len(fails)} 项不一致，建议退回补充材料"
    elif warns:
        verdict, conclusion = "warn", f"{len(warns)} 项需人工复核，其余自动通过"
    else:
        verdict, conclusion = "pass", "全部字段自动审核通过"
    return {"verdict": verdict, "conclusion": conclusion, "checks": checks}

def extract_kv(text: str) -> dict:
    """从文本提取键值对：支持 JSON 对象文本、"字段：值" 行。"""
    text = (text or "").strip()
    if text.startswith("{"):
        try:
            obj = json.loads(text)
            return {str(k): str(v) for k, v in obj.items()}
        except (json.JSONDecodeError, TypeError):
            pass
    data = {}
    for line in text.splitlines():
        m = re.match(r"""^\s*["']?([^:：,，"']+?)["']?\s*[:：]\s*["']?(.+?)["']?\s*[,，]?\s*$""", line)
        if m:
            data.setdefault(m.group(1).strip(), m.group(2).strip())
    return data


def match_files(config: dict, anchor: dict, files: list) -> dict:
    """规则驱动的多文件一致性核实（复刻 ai-dzpp compare_config 模式）。"""
    combinator = (config.get("combinator") or "and").lower()
    rules = config.get("rules") or []
    labels: list[str] = []
    for r in rules:
        for l in r.get("labels", []):
            if l not in labels:
                labels.append(l)
    if not labels:
        labels = list(anchor.keys())

    def match_type_of(label: str) -> str:
        for r in rules:
            if label in r.get("labels", []):
                return r.get("match_type", "equal")
        return "equal"

    results = []
    for f in files:
        data = extract_kv(f.get("content", ""))
        checks = []
        for label in labels:
            expected = str(anchor.get(label, "")).strip()
            actual = str(data.get(label, "")).strip()
            if not expected:
                verdict = "skip"
            elif not actual:
                verdict = "missing"
            else:
                mt = match_type_of(label)
                if mt == "contains":
                    hit = expected in actual or actual in expected
                else:
                    hit = re.sub(r"\s+", "", expected).lower() == re.sub(r"\s+", "", actual).lower()
                verdict = "pass" if hit else "fail"
            checks.append({"label": label, "expected": expected, "actual": actual, "verdict": verdict})
        valid = [c for c in checks if c["verdict"] != "skip"]
        passes = [c for c in valid if c["verdict"] == "pass"]
        fails = [c for c in valid if c["verdict"] == "fail"]
        miss = [c for c in valid if c["verdict"] == "missing"]
        if combinator == "or":
            passed = bool(passes)
        else:
            passed = bool(valid) and not fails and not miss
        results.append(
            {
                "file": f.get("name", ""),
                "checks": checks,
                "passed": passed,
                "pass_count": len(passes),
                "total": len(valid),
            }
        )
    total = len(results)
    passed_n = sum(1 for r in results if r["passed"])
    return {
        "labels": labels,
        "combinator": combinator,
        "results": results,
        "summary": {
            "total": total,
            "passed": passed_n,
            "failed": total - passed_n,
            "rate": round(passed_n / total * 100) if total else 0,
        },
    }
