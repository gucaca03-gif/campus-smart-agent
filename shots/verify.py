from playwright.sync_api import sync_playwright

BASE = "http://127.0.0.1:5600/"

CHECKS = [
    ("#/work", [".venue-card", ".tl-row", ".acc-head", ".bh-stats"]),
    ("#/work/lab", [".lab-row", ".ds-item", "#labSearch"]),
    ("#/work/lab/book?id=1", [".bk-venue", ".date-strip", ".slot-card", ".bk-bar", ".stepper"]),
    ("#/work/classroom", [".date-strip", ".legend-card", ".grid-table", ".acc-head"]),
    ("#/work/library", [".pill-strip", ".pill.active", ".lib-row", ".lib-avail"]),
]

with sync_playwright() as p:
    browser = p.chromium.launch(channel="msedge", headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 1000})
    all_ok = True
    for hash_, selectors in CHECKS:
        page.goto(BASE + hash_, wait_until="networkidle")
        page.wait_for_timeout(800)
        print(f"--- {hash_} ---")
        for sel in selectors:
            n = page.locator(sel).count()
            mark = "OK " if n > 0 else "MISS"
            if n == 0:
                all_ok = False
            print(f"  {mark} {sel} x{n}")
    # 交互验证：实验室预约页点击日期与时段卡
    page.goto(BASE + "#/work/lab/book?id=1", wait_until="networkidle")
    page.wait_for_timeout(800)
    if page.locator(".slot-card.open").count() > 0:
        page.locator(".slot-card.open").first.click()
        page.wait_for_timeout(300)
        bar_text = page.locator("#bkbInfo").inner_text()
        btn_disabled = page.locator("#bkbSubmit").is_disabled()
        print("--- 交互: 时段选中后底部确认条 ---")
        print(f"  确认条文案: {bar_text[:60]}")
        print(f"  提交按钮状态: {'disabled' if btn_disabled else 'enabled'}")
        if not btn_disabled and bar_text.strip() != "请选择日期与时段":
            print("  OK 选中时段后确认条正常激活")
        else:
            all_ok = False
    # 日期条点击验证
    ds = page.locator(".ds-item:not(.disabled)")
    if ds.count() > 1:
        ds.nth(1).click()
        page.wait_for_timeout(800)
        n2 = page.locator(".slot-card").count()
        print(f"  交互: 切换日期后时段卡数量 = {n2}")
    browser.close()
    print("RESULT:", "ALL OK" if all_ok else "HAS MISSING")