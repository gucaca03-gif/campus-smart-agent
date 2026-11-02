import html as html_mod
import json
import re
import sqlite3
import sys
import urllib.request
from pathlib import Path
from urllib.parse import urljoin

DB = Path(__file__).resolve().parents[2] / "data" / "aishida.db"


def fetch(url: str) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})
    raw = urllib.request.urlopen(req, timeout=30).read()
    for enc in ("utf-8", "gb18030"):
        try:
            return raw.decode(enc)
        except UnicodeDecodeError:
            continue
    return raw.decode("utf-8", errors="ignore")


def extract_body(page: str, base_url: str):
    m = re.search(r"""<div[^>]+class=["'][^"']*(?:v_news_content|wp_articlecontent)[^"']*["'][^>]*>""", page, re.S)
    if not m:
        return "", []
    pos = m.end()
    depth = 1
    i = pos
    while i < len(page) and depth > 0:
        nxt_open = page.find("<div", i)
        nxt_close = page.find("</div>", i)
        if nxt_close == -1:
            break
        if nxt_open != -1 and nxt_open < nxt_close:
            depth += 1
            i = nxt_open + 4
        else:
            depth -= 1
            i = nxt_close + 6
    body = page[pos : i - 6] if depth == 0 else page[pos:]
    body = re.sub(r"<script.*?</script>", "", body, flags=re.S | re.I)
    body = re.sub(r"<style.*?</style>", "", body, flags=re.S | re.I)
    images = []
    for tag in re.findall(r"<img[^>]+>", body, flags=re.I):
        src_m = re.search(r"""original-src=["']([^"']+)["']""", tag) or re.search(r"""src=["']([^"']+)["']""", tag)
        if src_m:
            src = src_m.group(1).strip()
            if src and not src.endswith(".gif"):
                images.append(urljoin(base_url, src))
    body = re.sub(r"<img[^>]*>", "", body, flags=re.I)
    body = re.sub(r"</p\s*>", "\n\n", body, flags=re.I)
    body = re.sub(r"<br\s*/?>", "\n", body, flags=re.I)
    body = re.sub(r"<[^>]+>", "", body)
    body = html_mod.unescape(body)
    body = re.sub(r"[ \t　]+", " ", body)
    body = re.sub(r"\n\s*\n+", "\n\n", body)
    return body.strip(), images


def main():
    conn = sqlite3.connect(DB)
    cols = [r[1] for r in conn.execute("PRAGMA table_info(news)")]
    if "content" not in cols:
        conn.execute("ALTER TABLE news ADD COLUMN content TEXT NOT NULL DEFAULT ''")
    if "content_images" not in cols:
        conn.execute("ALTER TABLE news ADD COLUMN content_images TEXT NOT NULL DEFAULT '[]'")
        conn.commit()
    rows = conn.execute(
        "SELECT id, title, source_url, summary FROM news ORDER BY id"
    ).fetchall()
    for nid, title, url, summary in rows:
        content, images = "", []
        if url and "page.htm" in url:
            try:
                content, images = extract_body(fetch(url), url)
            except Exception as e:
                print(f"[{nid}] fetch failed: {e}", file=sys.stderr)
        if not content:
            content = summary
        conn.execute(
            "UPDATE news SET content = ?, content_images = ? WHERE id = ?",
            (content, json.dumps(images, ensure_ascii=False), nid),
        )
        preview = content.replace("\n", " ")[:60]
        print(f"[{nid}] {len(content):>5} chars, {len(images)} imgs | {preview}")
    conn.commit()
    conn.close()


if __name__ == "__main__":
    main()