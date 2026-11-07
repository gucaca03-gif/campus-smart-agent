# -*- coding: utf-8 -*-
"""生成 16 个像素风头像 SVG（10x10 网格，8 套配色 x 2 种配饰）。"""
from pathlib import Path

OUT = Path(__file__).resolve().parents[2] / "web" / "static" / "img" / "avatars"
OUT.mkdir(parents=True, exist_ok=True)

PALETTES = [
    ("01", "#EAF2FD", "#1B4B8F", "#F3C9A4", "#0E2C58", "#5B8FD9", "#D9A441"),
    ("02", "#E8F7F0", "#166B4A", "#F3C9A4", "#0B3D2B", "#4CAF8C", "#E8A317"),
    ("03", "#FDF3E3", "#B4631E", "#F3C9A4", "#5A2E0C", "#E0A05A", "#2A63B0"),
    ("04", "#F5EDFB", "#6B3FA0", "#F3C9A4", "#3A1F5C", "#A57FD9", "#E36BA1"),
    ("05", "#EAF6E8", "#2F6B33", "#F3C9A4", "#173B1A", "#6FAE73", "#D9A441"),
    ("06", "#FDECEC", "#8E2B2B", "#F3C9A4", "#4A1010", "#D67979", "#2A63B0"),
    ("07", "#EFEDFD", "#3B3F93", "#F3C9A4", "#1F2157", "#7E84D6", "#D9A441"),
    ("08", "#EEF1F4", "#2C3A4A", "#F3C9A4", "#16202B", "#6C819A", "#D9A441"),
]

# 10x10 模板：. 背景  H 头发  S 皮肤  E 眼睛  M 嘴  C 衣领  A 配饰
BASE = [
    "..........",
    "..HHHHHH..",
    ".HHHHHHHH.",
    ".HHSSSSHH.",
    ".HSESSESH.",
    ".HSSMMSSH.",
    ".HHSSSSHH.",
    "..CCCCCC..",
    ".CCCCCCCC.",
    "..........",
]

HAT = [
    "..AAAAAA..",
    "..AAAAAA..",
    ".HHHHHHHH.",
    ".HHSSSSHH.",
    ".HSESSESH.",
    ".HSSMMSSH.",
    ".HHSSSSHH.",
    "..CCCCCC..",
    ".CCCCCCCC.",
    "..........",
]

HEADSET = [
    "..........",
    "..HHHHHH..",
    "AHHHHHHHHA",
    "AHHSSSSHHA",
    "AHSEESEHSA",
    "AHSSMMSSHA",
    ".HHSSSSHH.",
    "..CCCCCC..",
    ".CCCCCCCC.",
    "..........",
]


def color_of(ch: str, pal: dict) -> str | None:
    return {
        ".": None,
        "H": pal["hair"],
        "S": pal["skin"],
        "E": pal["dark"],
        "M": pal["mouth"],
        "C": pal["cloth"],
        "A": pal["accent"],
    }[ch]


def build(grid, pal) -> str:
    rects = []
    for y, row in enumerate(grid):
        x = 0
        while x < len(row):
            ch = row[x]
            if ch == ".":
                x += 1
                continue
            start = x
            while x < len(row) and row[x] == ch:
                x += 1
            color = color_of(ch, pal)
            rects.append(f'<rect x="{start}" y="{y}" width="{x - start}" height="1" fill="{color}"/>')
    return (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10" shape-rendering="crispEdges">'
        f'<rect width="10" height="10" rx="2.4" fill="{pal["bg"]}"/>'
        + "".join(rects)
        + "</svg>"
    )


def main() -> None:
    count = 0
    for idx, (name, bg, hair, skin, dark, cloth, accent) in enumerate(PALETTES):
        pal = {"bg": bg, "hair": hair, "skin": skin, "dark": dark, "cloth": cloth, "accent": accent, "mouth": "#B4675A"}
        for variant, grid in (("a", BASE), ("b", HAT), ("c", HEADSET)):
            (OUT / f"avatar-{name}{variant}.svg").write_text(build(grid, pal), encoding="utf-8")
            count += 1
    print("generated:", count, "->", OUT)


if __name__ == "__main__":
    main()