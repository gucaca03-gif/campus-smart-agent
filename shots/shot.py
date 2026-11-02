import pathlib
from playwright.sync_api import sync_playwright

BASE = "http://127.0.0.1:5600/"
OUT = pathlib.Path(r"D:\桌面\shixi\hw\campus-smart-agent\shots")
OUT.mkdir(exist_ok=True)

SHOTS = [
    ("#/work", "bk-hub"),
    ("#/work/lab", "bk-lab-list"),
    ("#/work/lab/book?id=1", "bk-lab-book"),
    ("#/work/classroom", "bk-classroom"),
    ("#/work/library", "bk-library"),
    ("#/work/library/room?area=一楼阅览室201&date=2026-11-02&start=08:00&end=10:00", "bk-seat"),
]

errors = []

with sync_playwright() as p:
    browser = p.chromium.launch(channel="msedge", headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 1000})
    page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
    page.on("pageerror", lambda e: errors.append(str(e)))
    for hash_, name in SHOTS:
        page.goto(BASE + hash_, wait_until="networkidle")
        page.wait_for_timeout(1200)
        page.screenshot(path=str(OUT / f"{name}.png"))
        print("shot:", name)
    browser.close()

print("console errors:", errors if errors else "none")