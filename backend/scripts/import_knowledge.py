"""把江师大知识库 PDF 导入 knowledge_chunks。

用法：python backend/scripts/import_knowledge.py <pdf路径> [标题]
"""

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "backend"))

from app.db import SessionLocal, engine  # noqa: E402
from app.knowledge import chunk_text  # noqa: E402
from app.models import Base, KnowledgeChunk  # noqa: E402


def extract_pdf(path: str) -> str:
    from pypdf import PdfReader

    reader = PdfReader(path)
    return "\n".join((p.extract_text() or "") for p in reader.pages)


def main():
    if len(sys.argv) < 2:
        print("用法: python import_knowledge.py <pdf路径> [标题]")
        sys.exit(1)
    pdf = sys.argv[1]
    default_title = Path(pdf).stem
    title = sys.argv[2] if len(sys.argv) > 2 else default_title

    Base.metadata.create_all(bind=engine)
    text = extract_pdf(pdf)
    chunks = chunk_text(text)
    print(f"解析完成：{len(text)} 字 → {len(chunks)} 块")

    db = SessionLocal()
    try:
        db.query(KnowledgeChunk).filter(KnowledgeChunk.source == pdf).delete()
        for i, c in enumerate(chunks):
            db.add(KnowledgeChunk(source=pdf, title=title, chunk_index=i, content=c))
        db.commit()
        total = db.query(KnowledgeChunk).count()
        print(f"已导入 {len(chunks)} 块；知识库共 {total} 块")
        for i, c in enumerate(chunks[:3]):
            print(f"  块{i}: {c[:60]}…")
    finally:
        db.close()


if __name__ == "__main__":
    main()