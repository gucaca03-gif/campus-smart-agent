"""文档 AI 客户端：OCR（多模态）与字段提取（LLM）。

默认接入江苏师范大学大模型广场（OpenAI 兼容网关），
也可通过 .env 的 AI_ENDPOINT / AI_MODEL / AI_API_KEY 切换任意兼容网关。
"""

import base64
import json
import os
import re
import time
from pathlib import Path

import urllib.error
import urllib.request

DEFAULT_ENDPOINT = "https://model.jsnu.edu.cn/v1/chat/completions"
DEFAULT_MODEL = "qwen3.8-27b"
TIMEOUT = 180

_ENV_CACHE: dict | None = None


def _load_env() -> dict:
    global _ENV_CACHE
    if _ENV_CACHE is not None:
        return _ENV_CACHE
    env = {}
    # 优先当前项目 .env，其次 ai-dzpp 的 .env（其 key 可作为兜底）
    candidates = [
        Path(__file__).resolve().parents[2] / ".env",
        Path("D:/桌面/shixi/ai-dzpp/.env"),
    ]
    for path in candidates:
        if path.exists():
            try:
                for line in path.read_text(encoding="utf-8").splitlines():
                    line = line.strip()
                    if not line or line.startswith("#") or "=" not in line:
                        continue
                    k, v = line.split("=", 1)
                    env.setdefault(k.strip(), v.strip())
            except OSError:
                continue
    _ENV_CACHE = env
    return env


def _cfg(key: str, default: str) -> str:
    return os.environ.get(key) or _load_env().get(key) or default


def endpoint() -> str:
    return _cfg("AI_ENDPOINT", _cfg("DASHSCOPE_LLM_ENDPOINT", DEFAULT_ENDPOINT))


def model() -> str:
    return _cfg("AI_MODEL", _cfg("DASHSCOPE_LLM_MODEL", DEFAULT_MODEL))


def ocr_model() -> str:
    return _cfg("AI_OCR_MODEL", model())


def api_key() -> str:
    return _cfg("AI_API_KEY", _cfg("DASHSCOPE_API_KEY", ""))


class AiUnavailable(RuntimeError):
    pass


def _chat(messages: list, model_name: str) -> str:
    key = api_key()
    if not key:
        raise AiUnavailable("未配置 AI_API_KEY，无法调用 OCR / 模型服务")
    last_err: Exception | None = None
    for attempt in range(3):
        req = urllib.request.Request(
            endpoint(),
            data=json.dumps({"model": model_name, "temperature": 0, "messages": messages}).encode("utf-8"),
            headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
            method="POST",
        )
        try:
            with urllib.request.urlopen(req, timeout=TIMEOUT) as resp:
                data = json.loads(resp.read().decode("utf-8"))
            return data["choices"][0]["message"]["content"] or ""
        except urllib.error.HTTPError as e:
            detail = ""
            try:
                detail = json.loads(e.read().decode("utf-8")).get("error", {}).get("message", "")
            except Exception:
                detail = str(e.reason)[:200]
            # 4xx（鉴权/参数问题）不重试；429/5xx 退避后重试
            if e.code < 500 and e.code != 429:
                raise AiUnavailable(f"模型服务返回 {e.code}：{detail}") from e
            last_err = AiUnavailable(f"模型服务返回 {e.code}：{detail}")
        except Exception as e:
            # 网络抖动（连接被关闭等）退避后重试
            last_err = AiUnavailable(f"模型服务调用失败：{e}")
        if attempt < 2:
            time.sleep(2 + attempt * 2)
    raise last_err or AiUnavailable("模型服务调用失败")


def ocr_image(data: bytes, mime: str = "image/png", filename: str = "page.png") -> str:
    """对图片/扫描页做 OCR，返回文本。"""
    b64 = base64.b64encode(data).decode("ascii")
    url = f"data:{mime};base64,{b64}"
    messages = [
        {
            "role": "user",
            "content": [
                {"type": "text", "text": "请识别图片中的所有文字，保留字段名与表格行结构，输出 markdown。不要添加解释。"},
                {"type": "image_url", "image_url": {"url": url}},
            ],
        }
    ]
    return _chat(messages, ocr_model())


def llm_extract_fields(text: str, labels: list) -> dict:
    """按指定 labels 从文本中提取字段值，返回 {label: value}。"""
    label_list = "、".join(labels)
    prompt = (
        f"从下面的文档文本中提取这些字段的值：{label_list}。\n"
        "要求：\n"
        "1. 严格输出 JSON 对象，键为字段名，值为原文中出现的值（字符串）。\n"
        "2. 文中没有的字段，值设为空字符串。\n"
        "3. 不要编造，不要解释，只输出 JSON。\n\n"
        f"文档文本：\n{text[:12000]}"
    )
    raw = _chat([{"role": "user", "content": prompt}], model())
    return _parse_json_obj(raw)


def llm_extract_key_fields(text: str) -> list:
    """自动识别文档中的重要字段与值（无需预设 labels）。"""
    prompt = (
        "请从下面文档文本中提取最重要的关键字段及其值（如编号、名称、日期、单位、人员、金额、奖项等）。\n"
        "要求：\n"
        "1. 输出来 JSON 数组，元素形如 {\"field\": \"字段名\", \"value\": \"值\"}。\n"
        "2. 最多 15 条，按重要程度排序。\n"
        "3. 只提取原文明确出现的值，不要编造，不要解释，只输出 JSON 数组。\n\n"
        f"文档文本：\n{text[:12000]}"
    )
    raw = _chat([{"role": "user", "content": prompt}], model())
    return _parse_json_list(raw)


def llm_build_rule(doc_texts: list, doc_names: list) -> dict:
    """从用户上传的规则文档（评选通知/办法等）中生成核查规则 JSON。

    输出结构与手工规则文件一致：{combinator, anchor, rules:[{tags, match_type, labels}]}。
    """
    parts = []
    for name, text in zip(doc_names, doc_texts):
        if text.strip():
            parts.append(f"【文档：{name}】\n{text[:10000]}")
    combined = "\n\n".join(parts)
    prompt = (
        "你是一个办公文档核查规则生成器。用户会上传评选通知、评选办法、公示名单等文档，"
        "需要为「下级单位提交的申请与佐证材料」自动生成核查规则，用于核对材料与这些文档的要求是否一致。\n\n"
        "请阅读以下文档，找出其中【可以核对的具体字段】和【文档给出的标准值/要求】，生成规则 JSON：\n"
        "{\n"
        '  "combinator": "and 或 or（默认 and）",\n'
        '  "anchor": {"字段名": "标准值或要求（从原文提取，不要编造）"},\n'
        '  "rules": [{"tags": ["文档类别标签"], "match_type": "equal 或 contains", "labels": ["字段名"]}],\n'
        "  \"rule_notes\": [{\"label\": \"字段名\", \"note\": \"该字段在原文中的依据摘要（一句话）\"}]\n"
        "}\n"
        "要求：\n"
        "1. anchor 的键与 rules[0].labels 一致；每个字段的标准值必须是原文出现的表述（如“二、三年级”“前50%”“一等、二等学业奖学金”），没有明确标准值的字段不要生成。\n"
        "2. 生成 4-8 个最有核查价值的字段。注意兼顾两类材料：\n"
        "   - 申请表类字段：姓名、学号、年级、学院、成绩排名、奖学金等级等；\n"
        "   - 佐证材料类字段：文档要求“应有科研成果或在竞赛中获奖”时，生成成果类字段（如科研成果、专利、论文、竞赛奖项、获奖等级等），标准值取文档的表述（如“应有科研成果”）。\n"
        "3. match_type：值必须完全一致的字段用 equal；只要求包含关键表述的字段用 contains。\n"
        "4. rule_notes 里给出每个字段在原文中的依据，方便人工复核。\n"
        "5. 只输出 JSON，不要任何解释。\n\n"
        f"文档内容：\n{combined[:20000]}"
    )
    raw = _chat([{"role": "user", "content": prompt}], model())
    return _parse_json_rule(raw)


def llm_judge_values(pairs: list) -> dict:
    """语义判定：材料中的值是否满足规则标准/要求（支持跨文件批量）。

    pairs: [{"name"?, "label", "expected", "actual"}]
    返回 {f"{name}||{label}": "pass" | "fail"}（无 name 时键为 label）。
    适用于范围型标准值（如"二、三年级""前50%""一、二等"）的包含关系判断。
    """
    if not pairs:
        return {}
    items = "\n".join(
        f'{i + 1}. 文件「{p.get("name", "")}」 字段「{p["label"]}」 标准/要求：{p["expected"]} ｜ 材料中的值：{p["actual"]}'
        for i, p in enumerate(pairs)
    )
    prompt = (
        "你是办公材料核查员。下面每行给出【文件】、【字段】、【规则标准或要求】和【材料中的实际值】。\n"
        "请逐行判断实际值是否满足标准/要求。注意：\n"
        "- 标准可能是范围（如“二、三年级”，则“二年级”满足；“一年级”不满足）\n"
        "- 可能是上限（如“排名前50%”，则“前12%”满足；“前58%”不满足）\n"
        "- 可能是等级集合（如“一、二等”，则“一等”满足；“三等”不满足）\n"
        "- 可能是存在性要求（如“应有科研成果”，则材料值是专利/论文/竞赛获奖即满足；空值不判断）\n"
        "- 也可能是必须一致的值（如姓名、编号）\n"
        "只输出 JSON 数组，元素形如 {\"no\": 行号, \"verdict\": \"pass 或 fail\"}，不要解释。\n\n"
        f"{items}"
    )
    raw = _chat([{"role": "user", "content": prompt}], model())
    try:
        arr = json.loads(_strip_fence(raw))
    except json.JSONDecodeError:
        m = re.search(r"\[.*\]", raw, re.S)
        arr = json.loads(m.group(0)) if m else []
    out = {}
    if isinstance(arr, list):
        by_no = {}
        for it in arr:
            if isinstance(it, dict) and it.get("verdict") in ("pass", "fail"):
                by_no[it.get("no")] = it["verdict"]
        for i, p in enumerate(pairs):
            v = by_no.get(i + 1)
            if v:
                key = f"{p.get('name', '')}||{p['label']}" if p.get("name") else p["label"]
                out[key] = v
    return out


def _parse_json_rule(raw: str) -> dict:
    obj = {}
    try:
        obj = json.loads(_strip_fence(raw))
    except json.JSONDecodeError:
        m = re.search(r"\{.*\}", raw, re.S)
        if m:
            try:
                obj = json.loads(m.group(0))
            except json.JSONDecodeError:
                obj = {}
    if not isinstance(obj, dict):
        return {}
    combinator = str(obj.get("combinator") or "and").lower()
    if combinator not in ("and", "or"):
        combinator = "and"
    anchor_raw = obj.get("anchor")
    anchor = {str(k): str(v) for k, v in anchor_raw.items()} if isinstance(anchor_raw, dict) else {}
    rules_raw = obj.get("rules")
    labels = []
    if isinstance(rules_raw, list):
        for r in rules_raw:
            if isinstance(r, dict) and isinstance(r.get("labels"), list):
                for l in r["labels"]:
                    if str(l).strip() and str(l).strip() not in labels:
                        labels.append(str(l).strip())
    if not labels:
        labels = list(anchor.keys())
    notes_raw = obj.get("rule_notes")
    notes = {}
    if isinstance(notes_raw, list):
        for n in notes_raw:
            if isinstance(n, dict) and n.get("label"):
                notes[str(n["label"])] = str(n.get("note", ""))
    return {"combinator": combinator, "anchor": anchor, "labels": labels, "notes": notes}


def _strip_fence(raw: str) -> str:
    raw = (raw or "").strip()
    raw = re.sub(r"^```(?:json)?\s*", "", raw)
    raw = re.sub(r"\s*```$", "", raw)
    return raw.strip()


def _parse_json_obj(raw: str) -> dict:
    try:
        obj = json.loads(_strip_fence(raw))
        if isinstance(obj, dict):
            return {str(k): ("" if v is None else str(v)) for k, v in obj.items()}
    except json.JSONDecodeError:
        pass
    m = re.search(r"\{.*\}", raw, re.S)
    if m:
        try:
            obj = json.loads(m.group(0))
            if isinstance(obj, dict):
                return {str(k): ("" if v is None else str(v)) for k, v in obj.items()}
        except json.JSONDecodeError:
            pass
    return {}


def _parse_json_list(raw: str) -> list:
    try:
        arr = json.loads(_strip_fence(raw))
        if isinstance(arr, list):
            out = []
            for it in arr:
                if isinstance(it, dict) and it.get("field"):
                    out.append({"field": str(it["field"]), "value": str(it.get("value", ""))})
            return out
    except json.JSONDecodeError:
        pass
    m = re.search(r"\[.*\]", raw, re.S)
    if m:
        try:
            arr = json.loads(m.group(0))
            return [{"field": str(it.get("field", "")), "value": str(it.get("value", ""))} for it in arr if isinstance(it, dict) and it.get("field")]
        except json.JSONDecodeError:
            pass
    return []