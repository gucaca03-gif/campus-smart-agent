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


def search_knowledge(db: Session, query: str, top_k: int = 3) -> list:
    """按 2-gram 覆盖率检索知识块，返回 [{title, content, score}]。"""
    q = _bigrams(query)
    if not q:
        return []
    rows = db.query(KnowledgeChunk).all()
    scored = []
    for r in rows:
        grams = _bigrams(r.title + r.content)
        if not grams:
            continue
        overlap = len(q & grams)
        if overlap == 0:
            continue
        score = overlap / len(q)
        scored.append({"title": r.title, "source": r.source, "content": r.content, "score": round(score, 3)})
    scored.sort(key=lambda x: x["score"], reverse=True)
    return [s for s in scored if s["score"] >= 0.18][:top_k]