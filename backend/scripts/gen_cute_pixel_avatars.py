# -*- coding: utf-8 -*-
"""生成 24 个原创 Q 版像素头像（24x24 像素，本地 SVG，无外部依赖/版权风险）。

- 8 套马卡龙配色 × 3 种萌系造型 = 24 个
  a = 猫耳 + 圆豆眼
  b = 熊耳 + 开心眯眼
  c = 垂耳兔 + 星星眼
- 文件名沿用 avatar-01a..08c.svg，前端无需改动
- 特征：大头、圆脸、亮眼高光、腮红、小嘴、动物耳、领口配色
"""
from pathlib import Path

OUT = Path(__file__).resolve().parents[2] / "web" / "static" / "img" / "avatars"
OUT.mkdir(parents=True, exist_ok=True)

W = H = 24
SKIN = "#FFDDBF"
SKIN_SHADE = "#F2C39A"
BLUSH = "#FF9FB2"
EYE = "#2E2A33"
MOUTH = "#C25B6B"
WHITE = "#FFFFFF"

# (编号, 背景, 头发主色, 头发高光, 衣服, 点缀)
PALETTES = [
    ("01", "#EAF2FD", "#5B4636", "#7A5F49", "#7FA7E8", "#F2A7C3"),
    ("02", "#E8F7F0", "#6B4F3A", "#8A6A50", "#7ED0B2", "#F2A7C3"),
    ("03", "#FDF1E7", "#8A5A3B", "#A87450", "#F09A5A", "#7FB2E8"),
    ("04", "#F3EEFB", "#5A4A74", "#7A6998", "#B49BE0", "#F2C94C"),
    ("05", "#EDF7E9", "#4C5B3B", "#68784F", "#93C97E", "#F2C94C"),
    ("06", "#FDECEF", "#7A4A4A", "#9A6262", "#F2A0B0", "#F2C94C"),
    ("07", "#ECEDFB", "#3E426B", "#5A5F8C", "#8D93D9", "#F2C94C"),
    ("08", "#E3EDF6", "#5E7287", "#7C90A5", "#BACFE2", "#FF9EB5"),
]

VARIANTS = ["cat", "bear", "bunny"]


def new_grid():
    return [["." for _ in range(W)] for _ in range(H)]


def rect(g, x0, y0, x1, y1, ch):
    for y in range(y0, y1 + 1):
        for x in range(x0, x1 + 1):
            if 0 <= x < W and 0 <= y < H:
                g[y][x] = ch


def px(g, x, y, ch):
    if 0 <= x < W and 0 <= y < H:
        g[y][x] = ch


def draw_ears(g, kind):
    if kind == "cat":
        # 高挑猫耳（带粉色内耳）
        for y, (a, b) in [(0, (8, 10)), (1, (7, 11)), (2, (6, 12))]:
            for x in range(a, b + 1):
                px(g, x, y, "H")
        for x, y in [(9, 1), (10, 1), (9, 2), (10, 2)]:
            px(g, x, y, "A")
        for y, (a, b) in [(0, (13, 15)), (1, (12, 16)), (2, (11, 17))]:
            for x in range(a, b + 1):
                px(g, x, y, "H")
        for x, y in [(13, 1), (14, 1), (13, 2), (14, 2)]:
            px(g, x, y, "A")
    elif kind == "bear":
        # 宽厚熊耳：平顶、加宽
        rect(g, 3, 2, 9, 5, "H")
        rect(g, 14, 2, 20, 5, "H")
        for x, y in [(3, 2), (9, 2), (3, 5), (9, 5), (14, 2), (20, 2), (14, 5), (20, 5)]:
            px(g, x, y, ".")
        rect(g, 5, 3, 7, 4, "A")
        rect(g, 16, 3, 18, 4, "A")
    elif kind == "bunny":
        # 垂耳兔：长耳沿脸侧向下垂，可爱且与猫耳/熊耳明显区分
        rect(g, 2, 3, 5, 11, "H")
        for x, y in [(2, 3), (5, 3), (2, 11), (5, 11)]:
            px(g, x, y, ".")
        rect(g, 3, 4, 4, 10, "A")
        rect(g, 18, 3, 21, 11, "H")
        for x, y in [(18, 3), (21, 3), (18, 11), (21, 11)]:
            px(g, x, y, ".")
        rect(g, 19, 4, 20, 10, "A")


def draw_eyes(g, kind):
    if kind == "bear":
        # 开心眯眼 ^ ^
        for x, y in [(9, 9), (10, 8), (11, 9), (13, 9), (14, 8), (15, 9)]:
            px(g, x, y, "E")
        # 张开的小笑嘴
        for x in (10, 11, 12, 13):
            px(g, x, 12, "M")
        px(g, 11, 13, "P")
        px(g, 12, 13, "P")
    elif kind == "bunny":
        # 星星眼：2x2 大眼 + 双高光
        for x in (9, 10):
            for y in (8, 9):
                px(g, x, y, "E")
        for x in (13, 14):
            for y in (8, 9):
                px(g, x, y, "E")
        px(g, 9, 8, "W")
        px(g, 14, 8, "W")
        px(g, 10, 9, "W")
        px(g, 13, 9, "W")
        # 小圆嘴
        px(g, 11, 12, "M")
        px(g, 12, 12, "M")
        px(g, 11, 13, "P")
    else:
        # 圆豆眼
        for x in (9, 10):
            for y in (8, 9):
                px(g, x, y, "E")
        for x in (13, 14):
            for y in (8, 9):
                px(g, x, y, "E")
        px(g, 9, 8, "W")
        px(g, 14, 8, "W")
        px(g, 11, 11, "M")
        px(g, 12, 11, "M")
        px(g, 11, 12, "P")


def draw_character(kind, pal):
    bg, hair, hi, cloth, accent = pal[1], pal[2], pal[3], pal[4], pal[5]
    g = new_grid()

    # 后发 + 头部
    rect(g, 5, 3, 18, 13, "H")
    for x, y in [(5, 3), (18, 3), (5, 13), (18, 13)]:
        px(g, x, y, ".")
    for x in range(7, 12):
        px(g, x, 4, "h")
    # 脸
    rect(g, 7, 6, 16, 13, "S")
    # 刘海
    for x in range(6, 18):
        px(g, x, 5, "H")
    for x in range(7, 17):
        px(g, x, 6, "H")
    # 两侧鬓发
    for y in range(6, 12):
        px(g, 5, y, "H")
        px(g, 6, y, "H")
        px(g, 17, y, "H")
        px(g, 18, y, "H")
    # 头顶呆毛
    px(g, 12, 2, "H")
    px(g, 13, 2, "H")
    px(g, 13, 3, "H")

    draw_ears(g, kind)

    # 腮红
    for x in (7, 8):
        px(g, x, 10, "P")
    for x in (15, 16):
        px(g, x, 10, "P")

    draw_eyes(g, kind)

    # 下巴阴影
    for x in range(9, 15):
        px(g, x, 13, "s")

    # 脖子
    rect(g, 10, 14, 13, 14, "S")

    # 衣服 / 领口
    rect(g, 5, 15, 18, 20, "C")
    for x, y in [(5, 15), (18, 15), (5, 20), (18, 20)]:
        px(g, x, y, ".")
    rect(g, 9, 15, 14, 15, "A")
    px(g, 11, 16, "A")
    px(g, 12, 16, "A")
    px(g, 11, 17, "A")
    px(g, 12, 17, "A")

    colors = {
        ".": None,
        "H": hair,
        "h": hi,
        "S": SKIN,
        "s": SKIN_SHADE,
        "E": EYE,
        "W": WHITE,
        "P": BLUSH,
        "M": MOUTH,
        "C": cloth,
        "A": accent,
    }
    return g, bg, colors


def grid_to_svg(g, bg, colors):
    parts = [f'<rect width="{W}" height="{H}" rx="6" fill="{bg}"/>']
    parts.append('<path d="M4 3h1v1H4zM3 4h1v1H3zM19 19h1v1h-1zM18 18h1v1h-1z" fill="#fff" opacity=".55"/>')
    rects = []
    for y, row in enumerate(g):
        x = 0
        while x < W:
            ch = row[x]
            if ch == ".":
                x += 1
                continue
            x2 = x
            while x2 + 1 < W and row[x2 + 1] == ch:
                x2 += 1
            fill = colors[ch]
            if fill:
                rects.append(f'<rect x="{x}" y="{y}" width="{x2 - x + 1}" height="1" fill="{fill}"/>')
            x = x2 + 1
    parts.append('<g shape-rendering="crispEdges">' + "".join(rects) + "</g>")
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="128" height="128" shape-rendering="crispEdges">' + "".join(parts) + "</svg>\n"


count = 0
for pal in PALETTES:
    for vi, kind in enumerate(VARIANTS):
        g, bg, colors = draw_character(kind, pal)
        (OUT / f"avatar-{pal[0]}{'abc'[vi]}.svg").write_text(grid_to_svg(g, bg, colors), encoding="utf-8")
        count += 1

print(f"已生成 {count} 个原创像素头像 -> {OUT}")