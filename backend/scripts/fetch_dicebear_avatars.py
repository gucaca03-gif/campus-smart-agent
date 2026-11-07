# -*- coding: utf-8 -*-
"""下载 DiceBear 开源头像：4 种风格样例 + 24 个 pixel-art 正式头像（本地化）。"""
import os
import urllib.request
from pathlib import Path

os.environ["NO_PROXY"] = "*"
os.environ["no_proxy"] = "*"

OUT = Path(__file__).resolve().parents[2] / "web" / "static" / "img" / "avatars"
OUT.mkdir(parents=True, exist_ok=True)

STYLES = ["pixel-art", "adventurer", "bottts", "thumbs", "notionists"]


def fetch(style: str, seed: str, size: int = 128) -> bytes:
    url = f"https://api.dicebear.com/9.x/{style}/svg?seed={seed}&size={size}"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=20) as resp:
        return resp.read()


# 1) 四种风格样例
for style in STYLES:
    try:
        data = fetch(style, f"jsnu-{style}")
        (OUT / f"_preview_{style}.svg").write_bytes(data)
        print(f"preview {style}: {len(data)} bytes")
    except Exception as e:
        print(f"preview {style} FAILED: {e}")

# 2) 正式头像：24 个 pixel-art，覆盖现有文件名
NAMES = [f"avatar-{n}{v}.svg" for n in ["01", "02", "03", "04", "05", "06", "07", "08"] for v in ["a", "b", "c"]]

ok = 0
for i, name in enumerate(NAMES, start=1):
    try:
        data = fetch("pixel-art", f"jsnu-student-{i:02d}")
        (OUT / name).write_bytes(data)
        ok += 1
    except Exception as e:
        print(f"{name} FAILED: {e}")
print(f"pixel-art 头像完成: {ok}/{len(NAMES)}")