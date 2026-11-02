import pathlib
from urllib.parse import quote
from playwright.sync_api import sync_playwright

BASE = "http://127.0.0.1:5600/"
OUT = pathlib.Path(r"D:\桌面\shixi\hw\campus-smart-agent\shots")
OUT.mkdir(exist_ok=True)

AREA = quote("201 科技图书借阅I室(2楼)")

SHOTS = [
    ("#/work/library", "v3-library"),
    (f"#/work/library/room?area={AREA}&date=2026-11-02&start=18:00&end=20:00", "v3-seat"),
    ("#/work/lab/book?id=1", "v3-lab-book"),
    ("#/work", "v3-hub"),
]

errors = []
with sync_playwright() as p:
    browser = p.chromium.launch(channel="msedge", headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 1000})
    page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
    page.on("pageerror", lambda e: errors.append(str(e)))
    for hash_, name in SHOTS:
        page.goto(BASE + hash_, wait_until="networkidle")
        page.wait_for_timeout(1300)
        page.screenshot(path=str(OUT / f"{name}.png"))
        print("shot:", name)
    # 交互：点一个可选座位，确认底部条激活
    page.goto(BASE + f"#/work/library/room?area={AREA}&date=2026-11-02&start=18:00&end=20:00", wait_until="networkidle")
    page.wait_for_timeout(1200)
    seats = page.locator(".sm-seat.free")
    print("可选座位数:", seats.count())
    busy = page.locator(".sm-seat.busy").count()
    print("已占用座位数:", busy)
    if seats.count():
        seats.first.click()
        page.wait_for_timeout(400)
        print("确认条文案:", page.locator("#seatBarInfo").inner_text()[:80].replace("\n", " / "))
        print("提交按钮可用:", not page.locator("#seatSubmit").is_disabled())
        page.screenshot(path=str(OUT / "v3-seat-picked.png"))
    browser.close()
print("console errors:", errors if errors else "none")