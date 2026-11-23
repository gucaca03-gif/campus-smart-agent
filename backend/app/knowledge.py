"""江师大知识库：文档切块入库与轻量检索（无需向量库）。

检索策略：中文 2-gram 覆盖率打分，按分数取 top-k。数据量小（单校规章级），
够用且零依赖。
"""

import re

from sqlalchemy.orm import Session

from .models import KnowledgeChunk


def chunk_text(text: str, max_len: int = 620) -> list:
    """按段落聚合切块：优先按空行/章节切，超长再硬切。"""
    text = (text or "").replace("\r\n", "\n").replace("\r", "\n")
    text = re.sub(r"[ \t\u3000]+", " ", text)
    # 章节标记：第X章 / 第X条
    parts = re.split(r"\n(?=第[一二三四五六七八九十百]+[章条])", text)
    chunks = []
    buf = ""
    for seg in parts:
        seg = seg.strip()
        if not seg:
            continue
        if len(buf) + len(seg) <= max_len:
            buf = (buf + "\n" + seg).strip()
        else:
            if buf:
                chunks.append(buf)
            while len(seg) > max_len * 1.6:
                chunks.append(seg[:max_len])
                seg = seg[max_len:]
            buf = seg
    if buf:
        chunks.append(buf)
    return [c for c in chunks if len(c) >= 60]


def _bigrams(text: str) -> set:
    text = re.sub(r"[\s\W]+", "", text or "")
    if len(text) < 2:
        return {text} if text else set()
    return {text[i : i + 2] for i in range(len(text) - 1)}


def _source_weight(chunk) -> float:
    """来源权威加权：校本手册 / 正式办法优先于其他汇编。"""
    src = (chunk.source or "").lower()
    if "研究生手册" in src or "手册" in src:
        return 1.15
    if any(k in src for k in ("办法", "规定", "制度", "通知")):
        return 1.05
    return 1.0


_QUESTION_WORDS = ("怎么", "如何", "请问", "一下", "是什么", "哪些", "吗", "呢")


_STOP_WORDS = (
    "怎么", "如何", "请问", "一下", "是什么", "哪些", "吗", "呢",
    "申请", "条件", "流程", "时间", "地点", "材料", "标准", "程序",
    "办法", "规定", "要求", "可以", "需要", "应该", "有没有",
)


def _topic_term(query: str) -> str:
    """剥离疑问词与泛词，取剩余最长中文片段作为主题词（如“奖学金”“入党”）。"""
    q = query or ""
    for w in _STOP_WORDS:
        q = q.replace(w, "")
    parts = [p for p in re.split(r"[^\u4e00-\u9fa5]+", q) if len(p) >= 2]
    term = max(parts, key=len) if parts else ""
    return term[-4:]


def _normalize_query(query: str) -> str:
    """去掉疑问词，避免稀释 2-gram 覆盖率。"""
    q = (query or "").strip()
    for w in _QUESTION_WORDS:
        q = q.replace(w, "")
    return q.strip() or (query or "").strip()


def search_knowledge(db: Session, query: str, top_k: int = 3) -> list:
    """检索知识块：同源去重 + 相邻条款合并 + 来源加权。

    背景：同一政策在校内手册中按“第 X 条”被切成多块，若直接取 top-3，
    会把不同条款并列给模型，回答就容易出现多个版本。这里同一来源只保留
    一组上下文，并把相邻条款合并，使模型拿到的是完整、单主题的依据。
    """
    q_text = _normalize_query(query)
    q = _bigrams(q_text)
    if not q:
        return []
    term = _topic_term(q_text)
    term_grams = _bigrams(term) if term else set()
    min_overlap = min(2, len(q))

    rows = db.query(KnowledgeChunk).all()
    scored = []
    for r in rows:
        content = (r.content or "").strip()
        if len(content) < 120:
            continue
        c_grams = _bigrams(content)
        if not c_grams:
            continue
        overlap = len(q & c_grams)
        if overlap == 0:
            continue
        t_hit = len(term_grams & c_grams) if term_grams else 0
        term_ok = (not term) or term in content or (
            bool(term_grams) and t_hit >= max(2 if len(term_grams) > 1 else 1, int(len(term_grams) * 0.6))
        )
        if not term_ok:
            continue
        # 主题词完整命中时，允许覆盖率不足 2 个 bigram（如“入党”两字）
        if overlap < min_overlap and not (term and term in content):
            continue
        score = (overlap / len(q)) * _source_weight(r)
        intent_hits = sum(1 for w in ("申请", "条件", "流程", "材料", "标准", "程序", "时间", "地点") if w in query and w in content)
        if intent_hits:
            score *= 1 + 0.10 * intent_hits
        if term and term in content:
            term_freq = content.count(term)
            score *= 1 + 0.30 * min(term_freq, 4)
        elif t_hit:
            score *= 1 + 0.12 * min(t_hit, 3)
        scored.append((score, r))

    if not scored:
        return []
    scored.sort(key=lambda x: x[0], reverse=True)

    picked = []
    used_ids = set()
    picked_sources = set()
    for score, r in scored:
        if len(picked) >= top_k:
            break
        if r.id in used_ids or score < 0.26:
            continue
        if (r.chunk_index or 0) == 0:
            continue
        if r.source in picked_sources:
            continue
        if picked and score < picked[0]["_raw"] * 0.6:
            continue
        if score < 0.6 and not (term and term in (r.content or "")):
            continue
        group = [r]
        used_ids.add(r.id)
        for other_score, other in scored:
            if other.id in used_ids or other.source != r.source:
                continue
            if abs((other.chunk_index or 0) - (r.chunk_index or 0)) > 4:
                continue
            o_content = (other.content or "").strip()
            if (other.chunk_index or 0) == 0 or len(o_content) < 120:
                continue
            o_grams = _bigrams(o_content)
            o_t_hit = len(term_grams & o_grams) if term_grams else 0
            o_ok = (not term) or term in o_content or (
                bool(term_grams) and o_t_hit >= max(2 if len(term_grams) > 1 else 1, int(len(term_grams) * 0.6))
            )
            if not o_ok:
                continue
            if other_score >= score * 0.35 and len(group) < 6:
                group.append(other)
                used_ids.add(other.id)
        group.sort(key=lambda x: x.chunk_index or 0)
        ordered = [r] + [g for g in group if g.id != r.id]
        content = "\n".join(g.content.strip() for g in ordered)
        picked.append(
            {
                "title": r.title,
                "source": r.source,
                "content": content,
                "score": round(score, 3),
                "_raw": score,
                "chunks": len(group),
            }
        )
        picked_sources.add(r.source)
    return picked
