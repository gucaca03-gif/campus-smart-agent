"""文档 AI 客户端：OCR（多模态）与字段提取（LLM）。

默认接入江苏师范大学大模型广场（OpenAI 兼容网关），
也可通过 .env 的 AI_ENDPOINT / AI_MODEL / AI_API_KEY 切换任意兼容网关。
"""

import base64
import json
import os
import re
import time
from datetime import date as date_cls
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
    # 只读取本项目 .env，保证整个 campus-smart-agent 文件夹可独立运行
    candidates = [
        Path(__file__).resolve().parents[2] / ".env",
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


def fallback_endpoint() -> str:
    return _cfg("AI_FALLBACK_ENDPOINT", "")


def fallback_model() -> str:
    return _cfg("AI_FALLBACK_MODEL", "")


def fallback_api_key() -> str:
    return _cfg("AI_FALLBACK_API_KEY", "")


def fallback_configured() -> bool:
    """备用网关是否完整配置（endpoint + model + key 齐全）。"""
    return bool(fallback_endpoint() and fallback_model() and fallback_api_key())


def model_info() -> dict:
    """当前生效的模型配置（不含密钥），用于界面展示与自检。"""
    ep = endpoint()
    if "model.jsnu.edu.cn" in ep:
        provider = "江苏师范大学模型广场"
    elif "dashscope" in ep:
        provider = "DashScope 通义千问"
    else:
        provider = "自定义网关"
    fb = fallback_endpoint()
    fb_provider = ""
    if "model.jsnu.edu.cn" in fb:
        fb_provider = "江苏师范大学模型广场"
    elif fb:
        fb_provider = "自定义网关"
    return {
        "endpoint": ep,
        "model": model(),
        "ocr_model": ocr_model(),
        "provider": provider,
        "configured": bool(api_key()),
        "key_length": len(api_key()),
        "fallback": {
            "endpoint": fb,
            "model": fallback_model(),
            "provider": fb_provider,
            "configured": fallback_configured(),
            "key_length": len(fallback_api_key()),
        },
    }


class AiUnavailable(RuntimeError):
    pass

def _int(v, default):
    try:
        return int(v)
    except (TypeError, ValueError):
        return default


def _bool(v):
    return str(v).lower() in ("true", "1", "yes")



def _chat_once(ep: str, key: str, model_name: str, messages: list, timeout: int, retries: int) -> str:
    """对指定网关执行带退避重试的 chat 调用。"""
    last_err: Exception | None = None
    for attempt in range(retries):
        req = urllib.request.Request(
            ep,
            data=json.dumps({"model": model_name, "temperature": 0, "messages": messages}).encode("utf-8"),
            headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
            method="POST",
        )
        try:
            with urllib.request.urlopen(req, timeout=timeout) as resp:
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
        if attempt < retries - 1:
            time.sleep(2 + attempt * 2)
    raise last_err or AiUnavailable("模型服务调用失败")


_MAIN_GATEWAY_DOWN_UNTIL = 0.0


def _chat(messages: list, model_name: str, timeout: int = TIMEOUT, retries: int = 3) -> str:
    """主网关调用；额度不足或不可用时自动切换备用网关（AI_FALLBACK_*）。

    主网关鉴权失败（401/令牌无效）后熔断 5 分钟，期间直接走备用网关，
    避免每个功能都先撞一次无效令牌再切备用。
    """
    global _MAIN_GATEWAY_DOWN_UNTIL
    key = api_key()
    now = time.time()
    if key and now >= _MAIN_GATEWAY_DOWN_UNTIL:
        try:
            # 主网关：单次尝试 + 10 秒上限；限流/挂起时快速切备用，避免页面长时间卡住
            return _chat_once(endpoint(), key, model_name, messages, min(timeout, 10), 1)
        except AiUnavailable as e:
            text = str(e)
            if "401" in text or "无效的令牌" in text:
                _MAIN_GATEWAY_DOWN_UNTIL = time.time() + 300
            if not fallback_configured():
                raise
            print(f"[office_ai] 主网关不可用（{e}），切换备用网关 {fallback_endpoint()}", flush=True)
    elif not key and not fallback_configured():
        raise AiUnavailable("未配置 AI_API_KEY，无法调用 OCR / 模型服务")

    if not fallback_configured():
        raise AiUnavailable("AI 主网关暂不可用，且未配置备用网关")

    # 备用网关：模型名换成备用配置（其多模态模型可同时覆盖 OCR 与文本）
    return _chat_once(fallback_endpoint(), fallback_api_key(), fallback_model(), messages, timeout, retries)


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
        "你是一个办公文档核查规则生成器。用户会上传通知、管理办法、公示名单、录取信息核对表、档案目录等文档，"
        "需要为「学生档案材料、申请材料与佐证材料」自动生成核查规则，用于核对材料信息与文档要求是否一致。\n\n"
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
        "   - 档案/申请类字段：姓名、身份证号、毕业学校、毕业时间、高考考生号、录取学院、录取专业、学号、证书编号等；\n"
        "   - 佐证材料类字段：文档要求“应有科研成果、证书或在竞赛中获奖”时，生成成果类字段（如科研成果、证书、竞赛奖项等），标准值取文档的表述。\n"
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


def llm_personality_reading(kind: str, digest: str, today_iso: str = "") -> str:
    """性格测试专属解读（100 字内，像星座文案但基于真实选择）。"""
    prompt = (
        ("你是校园搭子社区的解读文案助手。用户刚完成" + ("小动物人格测试" if kind == "animal" else "MBTI 快测") + "。\n")
        + f"测试结果：{digest}\n"
        "请写一段 100 字以内的专属解读：像朋友一样口语化、有梗、不说教，"
        "并给 1 条「适合找什么搭子」的建议。直接输出正文，不要标题和解释。"
        + (f"今天是 {today_iso}。" if today_iso else "")
    )
    return (_chat([{"role": "user", "content": prompt}], model(), timeout=4, retries=1) or "").strip()[:400]


def llm_match_reason(my: dict, other: dict, shared: dict) -> str:
    """AI 生成一句搭子匹配理由（60 字内）。"""
    prompt = (
        "你是校园搭子匹配助手。根据双方性格档案生成一句 60 字内的匹配理由，口语化、有梗、具体，"
        "不要空洞形容词。直接输出正文。\n"
        f"我：{json.dumps(my, ensure_ascii=False)}\n"
        f"对方：{json.dumps(other, ensure_ascii=False)}\n"
        f"共同点：{json.dumps(shared, ensure_ascii=False)}"
    )
    return (_chat([{"role": "user", "content": prompt}], model(), timeout=4, retries=1) or "").strip()[:200]


def llm_suxiaoshi(message: str, knowledge: list, context: dict | None = None) -> dict:
    """苏小师对话：结合知识库段落与校园能力，回答并给出可执行动作。

    返回 {reply, action: {type, target, label} | None}。
    action.type ∈ navigate | book_seat | book_classroom | open
    """
    context = context or {}
    kb = ""
    if knowledge:
        kb = "\n\n".join(
            f"【知识库·{k.get('title', '')}】\n{k.get('content', '')[:3000]}" for k in knowledge[:2]
        )
    system = (
        "你是江苏师范大学的百事通「苏小师」，一只住在泉山校区、戴圆框眼镜的小狮子。\n"
        "你不是冷冰冰的客服，而是热心、靠谱、偶尔抖个机灵的学长学姐。\n"
        "回答风格：\n"
        "- 先给结论，再补 1-2 条关键提示；能短就短，别写小作文。\n"
        "- 清晰、有条理，带一点俏皮和温度，可以少量用「～」「✨」「稳了」这类口语，但别油腻。\n"
        "- 不确定就直说「这个我得查查」「我暂时没这资料」，绝不编造制度、日期、价格、预约号。\n"
        "- 用户问天气、时间、常识、计算、翻译、生活建议等通用问题，也要大方回答，不要只聊校园。\n"
        "- 知识库有内容时优先引用，并点明依据；没有就说没有。\n"
        "你能做的事（覆盖工作区与生活区全部功能）：\n"
        "1) 校园导航：根据地点名（支持别名，如静远楼=21世纪大楼=9号楼）给路线，action 用 navigate；\n"
        "2) 图书馆选座/常用座位预约 → action: book_seat；\n"
        "3) 空教室预约（免审批，提交即确认）→ action: book_classroom；\n"
        "4) 文件识别（字段值提取、文件核查匹配、聊天记录转待办）→ action: open，target: '#/office'；\n"
        "5) 个人管理/自我控制（待办清单、专注时钟、记录、复盘、成就与积分）→ action: open，target: '#/me/self'；\n"
        "6) 报修（宿舍/设施/公共区域）→ action: open，target: '#/repair'；\n"
        "7) 找搭子（活动、申请与消息、趣味测试）→ action: open，target: '#/life/buddy'；\n"
        "8) 省一省（拼单/放弃即省钱）→ action: open，target: '#/life/deal'；\n"
        "9) 回答校园制度、流程类问题（优先使用下方知识库内容，不要编造）；\n"
        "10) 查校历、校情。\n"
        "回答知识类问题的硬性要求：\n"
        "- 只给一个版本：先给唯一结论，再给依据（文档名 + 条款号），最后给下一步；\n"
        "- 下方知识库可能包含同一政策的多段条款，必须合并成一条完整答案，严禁逐条罗列或并列多个版本；\n"
        "- 多段内容冲突时，以更具体、更新、更权威的条款为准，并注明出处；\n"
        "- 知识库未写明的部分直接说“手册未写明”，不要推测或补全；\n"
        "- 回答中出现的每一个数字、分数、材料数量与条件，必须逐字来自下方知识库；知识库没有的数量或条件一律不写；\n"
        "- 给出条件或流程时，优先注明条款出处（如“第六条”“第十六条”）；条款号不可见时可只给结论与依据内容，不要因此拒绝回答；\n"
        "- 严禁给出与资料相反的结论：资料中写有“个人申请”就如实说明申请方式，不得声称没有申报通道；\n"
        "用户想执行动作时输出对应 action（open 的 target 必须用上面列出的 # 开头路径）；纯咨询则 action 为 null。\n"
        "示例：\n"
        '用户：今天天气咋样 → {"reply": "徐州今天多云，12~20°C，风不大，带件薄外套就稳了～", "action": null}\n'
        '用户：带我去图书馆 → {"reply": "走起！从东门过去大概 5 分钟，路线给你画好了。", "action": {"type": "navigate", "target": "敬文图书馆", "label": "打开路线"}}\n'
        "只输出 JSON，不要解释：\n"
        '{"reply": "回答（不超过 120 字，可用 1-2 句）", "action": null 或 '
        '{"type": "navigate|book_seat|book_classroom|open", "target": "地点名或#开头的页面路径", "label": "按钮文字"}}\n'
        f"当前信息：{context}\n"
        + (f"\n可用知识库内容：\n{kb}\n" if kb else "")
        + "回答中文。知识库没有的信息就说没有，不要猜。"
    )
    raw = _chat(
        [
            {"role": "system", "content": system},
            {"role": "user", "content": message[:1500]},
        ],
        model(),
    )
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
        obj = {}
    # 模型偶尔直接返回纯文本
    if not obj.get("reply") and raw.strip() and not raw.strip().startswith("{"):
        return {"reply": raw.strip()[:400], "action": None}
    action = obj.get("action")
    if isinstance(action, dict) and action.get("type") in ("navigate", "book_seat", "book_classroom", "open"):
        action = {
            "type": action["type"],
            "target": str(action.get("target") or ""),
            "label": str(action.get("label") or "去看看"),
        }
    else:
        action = None
    return {"reply": str(obj.get("reply") or "").strip()[:400], "action": action}


def llm_buddy_reply(message: str) -> str:
    """为搭子站内聊天生成一句自然、多样化的口语回复（失败时由调用方回退本地模板）。"""
    prompt = (
        "你是江苏师范大学的在读学生，正在和约好的搭子同学站内聊天。\n"
        "对方刚说：" + str(message or "").strip()[:300] + "\n"
        "请只输出一句自然、口语化的中文回复，30 字以内；"
        "不要加引号、不要解释、不要重复对方原话，语气友好但不过度热情，避免每句都用“哈哈”“收到收到”。"
    )
    raw = _chat([{"role": "user", "content": prompt}], model(), timeout=6, retries=1)
    text = re.sub(r"\s+", " ", str(raw or "")).strip()
    text = text.strip('"“”\'')
    return text[:80]


def llm_parse_tasks_multi(text: str, today_iso: str = "") -> list:
    """从聊天记录中解析出多条待办（办公模块"聊天转待办"）。"""
    prompt = (
        "你是校园待办提取助手。用户粘贴了一段微信/QQ聊天记录，可能包含多条待办事项。\n"
        "当前日期是 " + (today_iso or "2026-11-03") + "。请提取其中所有明确的待办，输出 JSON 数组：\n"
        '[{"title": "任务名", "date": "YYYY-MM-DD", "time": "HH:MM 或空", '
        '"place": "地点/平台或空", "estimate_min": 30}]\n'
        "要求：只提取明确指派/承诺的事项；日期只写月日时补全年份；没有时间就留空；不要编造。\n\n"
        f"聊天记录：\n{text[:3000]}"
    )
    raw = _chat([{"role": "user", "content": prompt}], model())
    try:
        arr = json.loads(_strip_fence(raw))
    except json.JSONDecodeError:
        m = re.search(r"\[.*\]", raw, re.S)
        arr = json.loads(m.group(0)) if m else []
    out = []
    for it in arr if isinstance(arr, list) else []:
        if not isinstance(it, dict) or not str(it.get("title") or "").strip():
            continue
        d = str(it.get("date") or "").strip()
        if re.match(r"^\d{4}-\d{2}-\d{2}$", d):
            try:
                _, mm, dd = (int(x) for x in d.split("-"))
                base = date_cls.fromisoformat(today_iso) if today_iso else date_cls.today()
                d = date_cls(base.year, mm, dd).isoformat()
            except (ValueError, TypeError):
                d = ""
        t = str(it.get("time") or "").strip()
        if not re.match(r"^\d{1,2}:\d{2}$", t):
            t = ""
        out.append({
            "title": str(it["title"]).strip()[:120],
            "date": d,
            "time": t,
            "place": str(it.get("place") or "").strip()[:60],
            "estimate_min": _int(it.get("estimate_min"), 30),
        })
    return out


def llm_parse_task(text: str, today_iso: str = "") -> dict:
    """从微信/QQ 粘贴的通知文本中提取待办任务字段。

    返回 {title, date, time, place, submit_via, remind_min, estimate_min, is_today, note}。
    """
    prompt = (
        "你是校园待办提取助手。用户会粘贴微信/QQ群里的通知原文，请提取出其中的待办任务字段。\n"
        "当前日期是 " + (today_iso or "2026-11-03") + "。只输出 JSON，不要解释：\n"
        "{\n"
        '  "title": "任务名（简洁动宾结构，如：提交高数练习作业）",\n'
        '  "date": "YYYY-MM-DD（截止日期；原文只写月日时补全年份，已过期则加一年）",\n'
        '  "time": "HH:MM（截止时刻，24小时制；无则空串）",\n'
        '  "place": "地点或平台（如：学习通/敬文楼305），无则空串",\n'
        '  "submit_via": "提交或完成方式（如：学习通提交），无则空串",\n'
        '  "remind_min": 提前多少分钟提醒（整数，默认30，无明确时间则0）,\n'
        '  "estimate_min": 预计需要分钟数（整数，默认30）,\n'
        '  "is_today": 布尔值，截止日期是否就是今天,\n'
        '  "note": "原文中的其他补充说明（一句话），无则空串"\n'
        "}\n"
        "要求：只提取原文明确出现的信息，不要编造；原文含多个任务时只提取最主要的一个。\n\n"
        f"通知原文：\n{text[:2000]}"
    )
    raw = _chat([{"role": "user", "content": prompt}], model())
    try:
        obj = json.loads(_strip_fence(raw))
    except json.JSONDecodeError:
        m = re.search(r"\{.*\}", raw, re.S)
        obj = json.loads(m.group(0)) if m else {}

    def _int(v, default):
        try:
            return int(v)
        except (TypeError, ValueError):
            return default

    def _bool(v):
        return str(v).lower() in ("true", "1", "yes")

    if not isinstance(obj, dict):
        obj = {}
    title = str(obj.get("title") or "").strip()
    date = str(obj.get("date") or "").strip()
    if not re.match(r"^\d{4}-\d{2}-\d{2}$", date):
        date = ""
    else:
        # 年份校正：模型偶发给错年份（如给去年），按月日归一到当年的最近解释
        try:
            from datetime import date as _date

            _, m, dd = (int(x) for x in date.split("-"))
            base = _date.fromisoformat(today_iso) if today_iso else _date.today()
            date = _date(base.year, m, dd).isoformat()
        except (ValueError, TypeError):
            date = ""
    time = str(obj.get("time") or "").strip()
    if not re.match(r"^\d{1,2}:\d{2}$", time):
        time = ""
    return {
        "title": title[:120],
        "date": date,
        "time": time,
        "place": str(obj.get("place") or "").strip()[:60],
        "submit_via": str(obj.get("submit_via") or "").strip()[:60],
        "remind_min": _int(obj.get("remind_min"), 30),
        "estimate_min": _int(obj.get("estimate_min"), 30),
        "is_today": _bool(obj.get("is_today")) or date == today_iso,
        "note": str(obj.get("note") or "").strip()[:200],
    }


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

def llm_price_advice(product: str, sources: list, category: str = "") -> dict:
    """基于 Bing 搜索摘要 + 模型知识，给出商品大致价格区间和推荐方案。

    返回 {low, high, currency, summary, recommendation, tips(list), confidence}
    仅作参考，不代表实时最低价；无搜索摘要时会明确提示。
    """
    snippet_text = "\n".join(
        f"- {s.get('title', '')}：{s.get('snippet', '')[:180]}（{s.get('url', '')}）"
        for s in (sources or [])[:5]
    ) or "（本次未获取到可用的搜索结果摘要）"
    prompt = (
        "商品：" + str(product or "").strip()[:120] + "\n"
        "商品类别：" + str(category or "未填写")[:32] + "\n"
        "网络搜索摘要：\n" + snippet_text + "\n\n"
        "重要：商品名里的英文缩写很可能是品牌名（例如服饰类的 OSA 可能指品牌 OSA/欧莎），"
        "必须结合商品类别理解，不要把缩写当成疾病、技术或其他无关概念；"
        "与商品类别明显无关的摘要要丢弃。\n"
        "如果搜索摘要为空或与类别不符，明确说“没有检索到与该类别相符的网页”，"
        "只基于同类别商品的常识给出宽泛区间，不要引用无关缩写（如把 OSA 解释成疾病）。"
        "请综合这些摘要（以及你已有的常识）估算该商品目前的**大致价格范围**，"
        "并给出适合校园学生的推荐方案（例如推荐价位、购买时机、替代方案、注意事项）。"
        "要求：\n"
        "1) 不要声称这是实时最低价或全网最低价；摘要可能过期，必须提醒以实际下单页为准；\n"
        "2) 不要编造不存在的型号、参数或精确价格；区间可以宽泛；\n"
        "3) 如果摘要与商品无关或信息不足，要如实说明，不要把无关信息硬套；\n"
        "4) 只输出 JSON，不要解释：\n"
        '{"low": 数字, "high": 数字, "currency": "CNY", '
        '"summary": "一句话结论", "recommendation": "推荐方案，1-2 句", '
        '"tips": "建议1；建议2；建议3", "confidence": "高|中|低"}'
    )
    raw = _chat([{"role": "user", "content": prompt}], model(), timeout=25, retries=1)
    obj = _parse_json_obj(raw)

    def num(value, fallback=0.0):
        m = re.search(r"\d+(?:\.\d+)?", str(value or ""))
        return float(m.group(0)) if m else fallback

    low = num(obj.get("low"), 0.0)
    high = num(obj.get("high"), low)
    if high < low:
        low, high = high, low
    tips = [t.strip() for t in re.split(r"[；;]", str(obj.get("tips") or "")) if t.strip()]
    return {
        "low": low,
        "high": high,
        "currency": str(obj.get("currency") or "CNY")[:8],
        "summary": str(obj.get("summary") or "").strip()[:200],
        "recommendation": str(obj.get("recommendation") or "").strip()[:300],
        "tips": tips[:4],
        "confidence": str(obj.get("confidence") or "中")[:4],
        "sources": sources or [],
    }


def llm_search_queries(product: str, category: str = "") -> list:
    """为商品价格检索生成 2-3 条消歧后的中文搜索词。

    重点解决「OSA针织衫」被搜索引擎理解为睡眠呼吸暂停的问题：
    结合类别补全品牌/用途语境，例如 OSA → OSA欧莎 针织衫 服饰 价格。
    """
    name = str(product or "").strip()[:120]
    cat = str(category or "").strip()[:32]
    if not name:
        return []
    prompt = (
        "商品名：" + name + "\n"
        "类别：" + (cat or "未填写") + "\n"
        "请生成 2-3 条用于中文电商/评测网站查价格的中文搜索词。要求：\n"
        "1) 商品名里的英文缩写要结合类别判断：它更可能是品牌名而不是医学/技术缩写；\n"
        "2) 可补全品牌常见中文名，例如服饰类 OSA 可写成 OSA欧莎；\n"
        "3) 每条包含商品核心词 + 类别语境 + 价格，避免疾病、医疗、无关科技词；\n"
        "4) 不要编造型号或参数。\n"
        "只输出 JSON 数组，不要解释。"
    )
    queries = []
    try:
        raw = _chat([{"role": "user", "content": prompt}], model(), timeout=8, retries=1)
        obj = None
        try:
            obj = json.loads(_strip_fence(raw))
        except json.JSONDecodeError:
            m = re.search(r"\[.*\]", raw, re.S)
            if m:
                try:
                    obj = json.loads(m.group(0))
                except json.JSONDecodeError:
                    obj = None
        if isinstance(obj, list):
            for item in obj:
                q = str(item or "").strip()
                if q and q not in queries:
                    queries.append(q[:80])
    except Exception:
        pass
    fallbacks = [
        (name + " " + cat + " 品牌 价格").strip(),
        name + " 价格 多少钱",
        name + " 评测 推荐",
    ]
    for q in fallbacks:
        if q and q not in queries:
            queries.append(q)
    return queries[:3]
