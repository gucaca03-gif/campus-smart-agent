import { api } from "../api.js";
import { esc, modal, toast, today } from "../ui.js";

const TABS = [
  { key: "today", label: "今日" },
  { key: "plan", label: "计划" },
  { key: "focus", label: "专注" },
  { key: "notes", label: "记录" },
  { key: "review", label: "复盘" },
  { key: "achievements", label: "成就" },
];

const THEME_STYLE = {
  default: null,
  puppy: { paper: "#fff8ec", card: "#fffdfa", ink: "#4a3a2c", accent: "#d99a5e", soft: "#fbe9cf", line: "#f0e2cd" },
  night: { paper: "#1b1f22", card: "#23282c", ink: "#e8e2d8", accent: "#c98d9f", soft: "#3a2c33", line: "#343a3f" },
};

let state = { tab: "today", data: null, notes: [], papers: [], review: null, badges: null, shop: null };
let timer = null;

export async function render(root, ctx) {
  clearInterval(timer);
  state = { tab: (ctx && ctx.params && ctx.params.get("tab")) || "today", data: null, notes: [], papers: [], review: null, badges: null, shop: null };

  const theme = localStorage.getItem("selfTheme") || "default";
  if (THEME_STYLE[theme]) {
    const t = THEME_STYLE[theme];
    const box = document.documentElement;
    box.style.setProperty("--sc-paper", t.paper);
    box.style.setProperty("--sc-card", t.card);
    box.style.setProperty("--sc-ink", t.ink);
    box.style.setProperty("--sc-accent", t.accent);
    box.style.setProperty("--sc-soft", t.soft);
    box.style.setProperty("--sc-line", t.line);
    box.dataset.selfTheme = theme;
  } else {
    ["--sc-paper", "--sc-card", "--sc-ink", "--sc-accent", "--sc-soft", "--sc-line"].forEach((k) =>
      document.documentElement.style.removeProperty(k)
    );
    delete document.documentElement.dataset.selfTheme;
  }

  root.innerHTML = `
    <div class="self-control">
      <div class="page-head">
        <div>
          <div class="page-title">自我控制</div>
          <div class="page-sub">任务、日程、专注、状态、记录、复盘与激励，都在校园门户里完成；搭子、省钱、互助仍在生活通道。</div>
        </div>
        <div class="row">
          <span class="tag tag-blue">${state.data ? "" : "加载中"}</span>
          <button class="btn btn-ghost btn-sm" data-act="goto-self">返回自我管理（健身/计划）</button>
        </div>
      </div>
      <div class="tabs" id="scTabs">
        ${TABS.map((t) => `<a class="tab ${state.tab === t.key ? "active" : ""}" data-tab="${t.key}" href="javascript:void(0)">${t.label}</a>`).join("")}
      </div>
      <div id="scBody"><div class="muted">正在读取…</div></div>
    </div>`;

  root.querySelectorAll("[data-tab]").forEach((el) => {
    el.addEventListener("click", async () => {
      state.tab = el.dataset.tab;
      root.querySelectorAll("[data-tab]").forEach((x) => x.classList.toggle("active", x === el));
      await draw(root);
    });
  });
  root.querySelector('[data-act="goto-self"]').addEventListener("click", () => (location.hash = "#/life/self"));

  await draw(root);
}

async function draw(root) {
  const body = root.querySelector("#scBody");
  body.innerHTML = `<div class="muted">正在读取…</div>`;
  try {
    if (state.tab === "today") await drawToday(root, body);
    else if (state.tab === "plan") await drawPlan(root, body);
    else if (state.tab === "focus") await drawFocus(root, body);
    else if (state.tab === "notes") await drawNotes(root, body);
    else if (state.tab === "review") await drawReview(root, body);
    else await drawAchievements(root, body);
  } catch (e) {
    body.innerHTML = `<div class="card"><div class="card-title">加载失败</div><div class="card-desc">${esc(e.message || "请稍后重试")}</div></div>`;
  }
}

/* ----------------------------- 今日 ----------------------------- */

async function drawToday(root, body) {
  const d = await api.get(`/self/control/overview?day=${today()}`);
  state.data = d;
  const c = d.checkin;
  const next = (d.schedule || []).find((s) => new Date(s.start_at).getTime() > Date.now());
  body.innerHTML = `
    <div class="grid grid-4" style="margin-bottom:16px">
      <div class="stat" style="cursor:pointer" data-act="checkin">
        <div class="stat-num">${c ? c.energy : "—"}<span class="unit">/5</span></div>
        <div class="stat-label">${c ? "今日精力 · 点击修改" : "未打卡 · 点击记录"}</div>
      </div>
      <div class="stat"><div class="stat-num">${d.tasks.length}</div><div class="stat-label">今日待办</div></div>
      <div class="stat"><div class="stat-num">${d.focus.count}<span class="unit">次</span></div><div class="stat-label">今日专注 · ${d.focus.minutes} 分钟</div></div>
      <div class="stat"><div class="stat-num">${d.streak}<span class="unit">天</span></div><div class="stat-label">连续有效日 · 积分 ${d.balance}</div></div>
    </div>

    <div class="card" style="margin-bottom:16px;background:var(--sc-soft,var(--primary-light));border-color:var(--sc-line,var(--border))">
      <div class="spread"><div class="card-title">今日建议</div><span class="tag tag-blue">来自真实数据</span></div>
      <div style="margin-top:8px;color:var(--sc-ink,var(--text-1))">${esc(d.suggestion.text)}</div>
      <div class="muted" style="margin-top:4px">${esc(d.suggestion.action)}</div>
      <div class="muted" style="margin-top:2px;font-size:11px">依据：${esc(d.suggestion.basis)}</div>
    </div>

    <div class="grid grid-2">
      <div class="card">
        <div class="spread">
          <div class="card-title">今日任务</div>
          <button class="btn btn-primary btn-sm" data-act="new-task">新建</button>
        </div>
        ${d.tasks.length ? d.tasks.map((t) => `
          <div class="spread" style="padding:10px 0;border-bottom:1px solid var(--border);align-items:flex-start">
            <div style="display:flex;gap:10px;align-items:flex-start;min-width:0">
              <input type="checkbox" data-act="toggle" data-id="${t.id}" style="margin-top:3px">
              <div style="min-width:0">
                <div style="font-size:13px">${esc(t.title)}</div>
                <div class="muted" style="font-size:11px;margin-top:2px">
                  ${esc(t.priority)} · ${t.estimate_min} 分钟${t.source === "message" ? " · 来自群消息" : ""}
                  ${t.postpone_count > 0 ? ` · 顺延 ${t.postpone_count} 次` : ""}
                </div>
              </div>
            </div>
            <button class="btn btn-ghost btn-sm" data-act="postpone" data-id="${t.id}">顺延</button>
          </div>`).join("") : `<div class="muted" style="margin-top:10px">今天还没有安排任务。</div>`}
        <div class="spread" style="margin-top:10px">
          <span class="muted" style="font-size:12px">收件箱 ${d.inbox} 条${d.inbox ? "待安排" : "，已清空"}</span>
          <a class="btn btn-ghost btn-sm" href="#/life/self/control?tab=plan">完整计划</a>
        </div>
      </div>

      <div class="card">
        <div class="card-title">今日日程</div>
        ${d.schedule.length ? d.schedule.map((s) => `
          <div class="spread" style="padding:9px 0;border-bottom:1px solid var(--border)">
            <div style="display:flex;gap:10px;align-items:center">
              <span style="width:6px;height:6px;border-radius:50%;background:${s.kind === "fixed" ? "var(--primary)" : "var(--accent)"}"></span>
              <div>
                <div style="font-size:13px">${esc(s.title)}</div>
                <div class="muted" style="font-size:11px">${s.kind === "fixed" ? "固定安排" : "弹性安排"}</div>
              </div>
            </div>
            <span class="muted" style="font-size:12px">${esc(fmt(s.start_at))}–${esc(fmt(s.end_at))}</span>
          </div>`).join("") : `<div class="muted" style="margin-top:10px">今天没有固定安排，留白也是一种安排。</div>`}
        ${next ? `<div class="muted" style="margin-top:10px;font-size:12px">下一件事：${esc(fmt(next.start_at))} ${esc(next.title)}</div>` : ""}
      </div>
    </div>

    <div class="grid grid-2" style="margin-top:16px">
      <div class="card">
        <div class="card-title">论文卡点</div>
        ${d.blockers.length ? d.blockers.slice(0, 3).map((p) => `
          <div style="padding:8px 0;border-bottom:1px solid var(--border)">
            <div class="spread"><strong style="font-size:13px">${esc(p.title)}</strong><span class="tag tag-warn">${p.days} 天</span></div>
            <div class="muted" style="font-size:12px;margin-top:2px">${esc(p.blocker)}</div>
            <a style="font-size:12px;color:var(--primary)" href="#/life/self/control?tab=plan">查看下一步 →</a>
          </div>`).join("") : `<div class="muted" style="margin-top:10px">暂无超过 7 天的卡点。</div>`}
      </div>
      <div class="card">
        <div class="card-title">本周</div>
        <div class="spread" style="margin-top:8px"><span class="muted">完成率</span><strong>${d.week.rate}%</strong></div>
        <div class="spread" style="margin-top:6px"><span class="muted">完成 / 计划</span><span>${d.week.done} / ${d.week.total}</span></div>
        <div class="spread" style="margin-top:6px"><span class="muted">累计积分</span><span>${d.xp}</span></div>
        <a class="btn btn-ghost btn-sm" style="margin-top:10px" href="#/life/self/control?tab=review">去复盘</a>
      </div>
    </div>`;

  body.querySelector('[data-act="checkin"]').addEventListener("click", () => checkinModal(root));
  body.querySelectorAll('[data-act="toggle"]').forEach((el) =>
    el.addEventListener("change", async () => {
      await api.patch(`/self/control/tasks/${el.dataset.id}`, { status: "done" });
      toast("完成 1 个任务，+10 积分", "success");
      await draw(root);
    })
  );
  body.querySelectorAll('[data-act="postpone"]').forEach((el) =>
    el.addEventListener("click", async () => {
      const reason = prompt("顺延原因：没时间 / 卡住 / 被打断 / 不想做", "没时间");
      if (reason === null) return;
      await api.patch(`/self/control/tasks/${el.dataset.id}`, {
        status: "postponed", postpone_reason: reason || "没时间", plan_date: addDays(1),
      });
      toast("已顺延到明天");
      await draw(root);
    })
  );
  body.querySelector('[data-act="new-task"]').addEventListener("click", () => taskModal(root));
}

/* ----------------------------- 计划 ----------------------------- */

async function drawPlan(root, body) {
  const [tasks, papers] = await Promise.all([api.get("/self/control/tasks"), api.get("/self/control/papers")]);
  state.papers = papers;
  const inbox = tasks.filter((t) => t.status === "inbox");
  const planned = tasks.filter((t) => t.status === "planned");
  body.innerHTML = `
    <div class="grid grid-2">
      <div class="card">
        <div class="spread"><div class="card-title">收件箱（${inbox.length}）</div><button class="btn btn-primary btn-sm" data-act="new-task">新建任务</button></div>
        ${inbox.length ? inbox.map((t) => taskRow(t, true)).join("") : `<div class="muted" style="margin-top:10px">收件箱已清空。</div>`}
        <div class="section-title" style="margin-top:16px">已安排</div>
        ${planned.length ? planned.slice(0, 8).map((t) => taskRow(t, false)).join("") : `<div class="muted" style="margin-top:8px">还没有安排到具体日期。</div>`}
      </div>

      <div class="card">
        <div class="spread"><div class="card-title">消息转待办</div><span class="tag tag-blue">粘贴即可</span></div>
        <div class="field" style="margin-top:10px"><label>群消息 / 通知 / 邮件</label>
          <textarea class="input" id="msgText" rows="5" placeholder="例：@我 明天下午 3 点前把组会 PPT 发给老师&#10;下周三前提交实验报告"></textarea>
        </div>
        <div class="row" style="margin-top:8px"><button class="btn btn-primary btn-sm" data-act="parse">解析候选</button></div>
        <div id="msgResult" style="margin-top:10px"></div>
        <div class="muted" style="margin-top:8px;font-size:11px">不读取聊天软件；相对日期按今天解释；低置信默认不勾选。</div>
      </div>
    </div>

    <div class="card" style="margin-top:16px">
      <div class="spread"><div class="card-title">论文与项目</div>
        <button class="btn btn-primary btn-sm" data-act="new-paper">新建</button></div>
      ${papers.length ? papers.map((p) => `
        <div style="padding:10px 0;border-bottom:1px solid var(--border)">
          <div class="spread">
            <strong style="font-size:13px">${esc(p.title)}</strong>
            <span class="tag ${p.days >= 14 ? "tag-warn" : "tag-blue"}">${esc(p.stage)}${p.days ? ` · 卡 ${p.days} 天` : ""}</span>
          </div>
          <div class="muted" style="font-size:12px;margin-top:2px">${esc(p.venue || "未定期刊")} · 截止 ${esc(p.deadline || "未定")}</div>
          <div class="muted" style="font-size:12px;margin-top:2px">卡点：${esc(p.blocker || "无")}</div>
          <div class="row" style="margin-top:6px">
            <button class="btn btn-ghost btn-sm" data-act="paper-next" data-id="${p.id}" data-next="${esc(p.next_action)}">下一步转任务</button>
            <button class="btn btn-ghost btn-sm" data-act="paper-stage" data-id="${p.id}">推进阶段</button>
          </div>
        </div>`).join("") : `<div class="muted" style="margin-top:10px">还没有论文记录。</div>`}
    </div>`;

  body.querySelector('[data-act="new-task"]').addEventListener("click", () => taskModal(root));
  body.querySelectorAll('[data-act="arrange"]').forEach((el) =>
    el.addEventListener("click", async () => {
      await api.patch(`/self/control/tasks/${el.dataset.id}`, { status: "planned", plan_date: today() });
      toast("已安排到今天");
      await draw(root);
    })
  );
  body.querySelector('[data-act="parse"]').addEventListener("click", async () => {
    const text = body.querySelector("#msgText").value.trim();
    if (!text) return toast("先粘贴一段消息");
    try {
      const items = await api.post("/self/control/messages/parse", { text, sent_at: today() });
      body.querySelector("#msgResult").innerHTML = items.length ? `
        <div class="muted" style="font-size:12px;margin-bottom:6px">候选 ${items.length} 条，低置信已取消勾选</div>
        ${items.map((it, i) => `
          <label class="row" style="padding:6px 0;border-bottom:1px solid var(--border);font-size:12px;align-items:flex-start">
            <input type="checkbox" data-msg="${i}" ${it.confidence !== "low" ? "checked" : ""} style="margin-top:3px">
            <span style="flex:1">
              ${esc(it.title)}
              <span class="muted" style="display:block;font-size:11px">${it.due_at || "待确认"} · ${it.confidence} · ${esc(it.snippet).slice(0, 40)}</span>
            </span>
          </label>`).join("")}
        <button class="btn btn-primary btn-sm" style="margin-top:8px" data-act="commit-msg">创建选中的任务</button>` : `<div class="muted">没有识别到待办，换一段消息试试。</div>`;
      body.querySelector('[data-act="commit-msg"]')?.addEventListener("click", async () => {
        const picked = [...body.querySelectorAll("[data-msg]")].filter((x) => x.checked).map((x) => items[Number(x.dataset.msg)]);
        if (!picked.length) return toast("至少选一条");
        const r = await api.post("/self/control/messages/commit", { items: picked });
        toast(`已创建 ${r.created} 个任务`, "success");
        await draw(root);
      });
    } catch (e) {
      toast(e.message || "解析失败");
    }
  });
  body.querySelector('[data-act="new-paper"]').addEventListener("click", () => paperModal(root));
  body.querySelectorAll('[data-act="paper-next"]').forEach((el) =>
    el.addEventListener("click", async () => {
      const next = el.dataset.next;
      if (!next) return toast("这篇还没写下一步");
      await api.post("/self/control/tasks", { title: next, paper_id: Number(el.dataset.id), plan_date: today(), priority: "P0", estimate_min: 45, status: "planned" });
      toast("已转成今天的任务");
      await draw(root);
    })
  );
  body.querySelectorAll('[data-act="paper-stage"]').forEach((el) =>
    el.addEventListener("click", () => stageModal(root, el.dataset.id))
  );
}

function taskRow(t, arrange) {
  return `<div class="spread" style="padding:8px 0;border-bottom:1px solid var(--border);gap:8px">
    <div style="min-width:0">
      <div style="font-size:13px">${esc(t.title)}</div>
      <div class="muted" style="font-size:11px">${esc(t.priority)} · ${t.estimate_min} 分钟${t.plan_date ? ` · ${esc(t.plan_date)}` : ""}</div>
    </div>
    ${arrange ? `<button class="btn btn-ghost btn-sm" data-act="arrange" data-id="${t.id}">排今天</button>` : ""}
  </div>`;
}

/* ----------------------------- 专注 ----------------------------- */

async function drawFocus(root, body) {
  const d = await api.get(`/self/control/overview?day=${today()}`);
  state.data = d;
  body.innerHTML = `
    <div class="grid grid-2">
      <div class="card" style="text-align:center">
        <div class="card-title">专注计时</div>
        <div style="font-size:52px;font-weight:700;color:var(--sc-accent,var(--primary));letter-spacing:-.03em;margin:14px 0" id="scTimer">25:00</div>
        <div class="field" style="text-align:left"><label>本次任务</label><input class="input" id="scTask" placeholder="例如：补图 3 的误差棒"></div>
        <div class="row" style="justify-content:center;margin-top:10px">
          <button class="btn btn-primary" data-act="start">开始</button>
          <button class="btn btn-ghost" data-act="pause">暂停</button>
          <button class="btn btn-ghost" data-act="finish">完成并记录</button>
        </div>
        <div class="muted" style="margin-top:8px;font-size:11px">切页不会中断；默认不因失焦暂停。</div>
      </div>
      <div class="card">
        <div class="card-title">今日专注</div>
        <div class="stat" style="margin-top:10px"><div class="stat-num">${d.focus.count}<span class="unit">次</span></div><div class="stat-label">${d.focus.minutes} 分钟</div></div>
        <div class="muted" style="margin-top:12px;font-size:12px">完成 1 次专注可记录投入时间；计时结束不自动把任务标为完成。</div>
        <div class="section-title" style="margin-top:16px">今日任务</div>
        ${d.tasks.length ? d.tasks.map((t) => `<div class="spread" style="padding:6px 0"><span style="font-size:12px">${esc(t.title)}</span><span class="muted" style="font-size:11px">${t.estimate_min} 分钟</span></div>`).join("") : `<div class="muted" style="margin-top:8px">今天还没有任务。</div>`}
      </div>
    </div>`;

  let remaining = 25 * 60;
  let running = false;
  let used = 0;
  const timeEl = body.querySelector("#scTimer");
  const paint = () => (timeEl.textContent = `${String(Math.floor(remaining / 60)).padStart(2, "0")}:${String(remaining % 60).padStart(2, "0")}`);
  const tick = () => {
    remaining -= 1;
    used += 1;
    if (remaining <= 0) {
      remaining = 0;
      running = false;
      clearInterval(timer);
      paint();
      toast("专注完成，记得记录", "success");
      return;
    }
    paint();
  };
  body.querySelector('[data-act="start"]').addEventListener("click", () => {
    if (running) return;
    running = true;
    clearInterval(timer);
    timer = setInterval(tick, 1000);
  });
  body.querySelector('[data-act="pause"]').addEventListener("click", () => {
    if (!running) return;
    running = false;
    clearInterval(timer);
    toast("已暂停");
  });
  body.querySelector('[data-act="finish"]').addEventListener("click", async () => {
    running = false;
    clearInterval(timer);
    const minutes = Math.max(1, Math.round(used / 60));
    await api.post("/self/pomodoro", { task: body.querySelector("#scTask").value || "专注", minutes, status: "done" });
    toast(`已记录 ${minutes} 分钟`, "success");
    remaining = 25 * 60;
    used = 0;
    paint();
    await draw(root);
  });
}

/* ----------------------------- 记录 ----------------------------- */

async function drawNotes(root, body) {
  const notes = await api.get("/self/control/notes");
  state.notes = notes;
  body.innerHTML = `
    <div class="card">
      <div class="spread"><div class="card-title">记一笔</div><span class="tag tag-blue">先保存，后分类</span></div>
      <div class="row" style="margin-top:10px;align-items:flex-start">
        <textarea class="input" id="noteText" rows="3" placeholder="刚想到什么？一句话也行。" style="flex:1"></textarea>
        <input class="input" id="noteTags" placeholder="标签" style="width:140px">
        <button class="btn btn-primary" data-act="save-note">保存</button>
      </div>
    </div>
    <div class="grid grid-2" style="margin-top:16px">
      ${notes.length ? notes.map((n) => `
        <div class="card">
          <div style="font-size:13px;white-space:pre-wrap">${esc(n.content)}</div>
          <div class="row" style="margin-top:8px">
            <span class="muted" style="font-size:11px">${esc(n.created_at.slice(0, 10))}</span>
            ${n.tags ? `<span class="tag tag-blue">${esc(n.tags)}</span>` : ""}
            ${n.task_id ? `<span class="tag tag-green">已转任务</span>` : ""}
          </div>
          ${n.task_id ? "" : `<button class="btn btn-ghost btn-sm" style="margin-top:8px" data-act="note-task" data-id="${n.id}">转为今天的任务</button>`}
        </div>`).join("") : `<div class="card"><div class="muted">还没有记录。想法、心得、截图都可以先扔进来。</div></div>`}
    </div>`;

  body.querySelector('[data-act="save-note"]').addEventListener("click", async () => {
    const content = body.querySelector("#noteText").value.trim();
    if (!content) return toast("写点什么");
    await api.post("/self/control/notes", { content, tags: body.querySelector("#noteTags").value });
    toast("已收进记录箱", "success");
    await draw(root);
  });
  body.querySelectorAll('[data-act="note-task"]').forEach((el) =>
    el.addEventListener("click", async () => {
      await api.post(`/self/control/notes/${el.dataset.id}/task`, {});
      toast("已转为今天的任务", "success");
      await draw(root);
    })
  );
}

/* ----------------------------- 复盘 ----------------------------- */

async function drawReview(root, body) {
  const r = await api.get(`/self/control/reviews?week=${weekStart()}`);
  state.review = r;
  const s = r.stats;
  body.innerHTML = `
    <div class="grid grid-4" style="margin-bottom:16px">
      <div class="stat"><div class="stat-num">${s.rate}%</div><div class="stat-label">本周完成率</div></div>
      <div class="stat"><div class="stat-num">${s.done}/${s.total}</div><div class="stat-label">完成 / 计划</div></div>
      <div class="stat"><div class="stat-num">${Object.values(s.reasons || {}).reduce((a, b) => a + b, 0)}</div><div class="stat-label">顺延次数</div></div>
      <div class="stat"><div class="stat-num">${state.data ? state.data.streak : "—"}</div><div class="stat-label">连续有效日</div></div>
    </div>

    <div class="grid grid-2">
      <div class="card">
        <div class="card-title">每日完成率与精力</div>
        <div style="display:flex;align-items:flex-end;gap:8px;height:140px;margin-top:14px">
          ${r.series.map((x) => `
            <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px">
              <div style="width:100%;height:100px;display:flex;align-items:flex-end">
                <div style="width:100%;height:${Math.max(2, x.rate)}%;background:var(--sc-accent,var(--primary));border-radius:6px 6px 0 0;opacity:.85"></div>
              </div>
              <span class="muted" style="font-size:10px">${x.date.slice(5)}</span>
              <span class="muted" style="font-size:10px">${x.energy != null ? "精" + x.energy : "—"}</span>
            </div>`).join("")}
        </div>
      </div>
      <div class="card">
        <div class="card-title">顺延原因</div>
        ${Object.keys(s.reasons || {}).length ? Object.entries(s.reasons).map(([k, v]) => `<div class="spread" style="padding:6px 0"><span>${esc(k)}</span><span class="muted">${v} 次</span></div>`).join("") : `<div class="muted" style="margin-top:8px">本周没有顺延。</div>`}
        <div class="muted" style="margin-top:12px;font-size:11px">完成率按当日计划内任务计算；顺延后原日计未完成。</div>
      </div>
    </div>

    <div class="card" style="margin-top:16px">
      <div class="card-title">下周三个重点</div>
      <div class="field" style="margin-top:10px"><label>重点 1</label><input class="input" id="f1" value="${esc(r.review?.focus1 || "")}" placeholder="要能在 30 分钟内开始"></div>
      <div class="field"><label>重点 2</label><input class="input" id="f2" value="${esc(r.review?.focus2 || "")}"></div>
      <div class="field"><label>重点 3</label><input class="input" id="f3" value="${esc(r.review?.focus3 || "")}"></div>
      <div class="field"><label>一句话总结</label><textarea class="input" id="sum" rows="2">${esc(r.review?.summary || "")}</textarea></div>
      <button class="btn btn-primary" data-act="save-review">保存复盘（+30 积分）</button>
    </div>`;

  body.querySelector('[data-act="save-review"]').addEventListener("click", async () => {
    await api.post("/self/control/reviews", {
      week: weekStart(),
      focus1: body.querySelector("#f1").value,
      focus2: body.querySelector("#f2").value,
      focus3: body.querySelector("#f3").value,
      summary: body.querySelector("#sum").value,
    });
    toast("复盘已保存", "success");
    await draw(root);
  });
}

/* ----------------------------- 成就 ----------------------------- */

async function drawAchievements(root, body) {
  const [a, shop] = await Promise.all([api.get("/self/control/achievements"), api.get("/self/control/shop")]);
  state.badges = a;
  state.shop = shop;
  body.innerHTML = `
    <div class="grid grid-3" style="margin-bottom:16px">
      <div class="stat"><div class="stat-num">Lv.${a.level}</div><div class="stat-label">累计 ${a.xp} 积分 · 距下一级 ${100 - a.level_progress}</div></div>
      <div class="stat"><div class="stat-num">${a.streak}<span class="unit">天</span></div><div class="stat-label">连续有效日</div></div>
      <div class="stat"><div class="stat-num">${shop.balance}</div><div class="stat-label">可用积分（兑换只扣这里）</div></div>
    </div>

    <div class="card">
      <div class="spread"><div class="card-title">徽章</div><span class="muted" style="font-size:12px">${a.badges.filter((b) => b.unlocked).length}/${a.badges.length} 已解锁</span></div>
      <div class="grid grid-4" style="margin-top:12px">
        ${a.badges.map((b) => `
          <div style="border:1px solid var(--border);border-radius:12px;padding:12px;${b.unlocked ? "" : "opacity:.55"}">
            <div class="spread"><strong style="font-size:13px">${esc(b.name)}</strong><span class="tag ${b.unlocked ? "tag-green" : "tag-warn"}">${b.unlocked ? "已解锁" : b.category}</span></div>
            <div class="muted" style="font-size:11px;margin-top:4px">${esc(b.condition)}</div>
          </div>`).join("")}
      </div>
    </div>

    <div class="card" style="margin-top:16px">
      <div class="spread"><div class="card-title">皮肤商店</div><span class="muted" style="font-size:12px">可用 ${shop.balance} 积分</span></div>
      <div class="grid grid-3" style="margin-top:12px">
        ${shop.themes.map((t) => `
          <div style="border:1px solid var(--border);border-radius:12px;padding:12px">
            <div style="height:44px;border-radius:8px;background:${t.code === "puppy" ? "linear-gradient(120deg,#fdeed3,#fbe3d6,#f8f2e2)" : t.code === "night" ? "linear-gradient(120deg,#2a2026,#252330,#2b2620)" : "linear-gradient(120deg,#e8f0fb,#dbe8fb,#f1f4f8)"}"></div>
            <div class="spread" style="margin-top:8px"><strong style="font-size:13px">${esc(t.name)}</strong><span class="muted" style="font-size:11px">${t.price ? t.price + " 积分" : "免费"}</span></div>
            <div class="muted" style="font-size:11px;margin-top:2px">${esc(t.desc)}</div>
            <div style="margin-top:8px">
              ${t.unlocked
                ? `<button class="btn btn-ghost btn-sm" data-act="apply-theme" data-code="${t.code}">使用</button>`
                : `<button class="btn btn-primary btn-sm" data-act="redeem" data-code="${t.code}">兑换并使用</button>`}
            </div>
          </div>`).join("")}
      </div>
      <div class="muted" style="margin-top:10px;font-size:11px">积分来自真实完成：打卡 +5、任务 +10、专注 +8、周复盘 +30、论文推进 +50；没有充值入口。</div>
    </div>`;

  const apply = (code) => {
    localStorage.setItem("selfTheme", code);
    const t = THEME_STYLE[code];
    if (t) {
      document.documentElement.style.setProperty("--sc-paper", t.paper);
      document.documentElement.style.setProperty("--sc-card", t.card);
      document.documentElement.style.setProperty("--sc-ink", t.ink);
      document.documentElement.style.setProperty("--sc-accent", t.accent);
      document.documentElement.style.setProperty("--sc-soft", t.soft);
      document.documentElement.style.setProperty("--sc-line", t.line);
      document.documentElement.dataset.selfTheme = code;
    } else {
      ["--sc-paper", "--sc-card", "--sc-ink", "--sc-accent", "--sc-soft", "--sc-line"].forEach((k) =>
        document.documentElement.style.removeProperty(k)
      );
      delete document.documentElement.dataset.selfTheme;
    }
  };
  body.querySelectorAll('[data-act="apply-theme"]').forEach((el) =>
    el.addEventListener("click", () => {
      apply(el.dataset.code);
      toast("已切换皮肤");
    })
  );
  body.querySelectorAll('[data-act="redeem"]').forEach((el) =>
    el.addEventListener("click", async () => {
      try {
        const r = await api.post("/self/control/shop/redeem", { code: el.dataset.code });
        apply(el.dataset.code);
        toast(`兑换成功，余额 ${r.balance}`, "success");
        await draw(root);
      } catch (e) {
        toast(e.message || "兑换失败");
      }
    })
  );
}

/* ----------------------------- 弹窗 ----------------------------- */

function checkinModal(root) {
  const c = state.data?.checkin || {};
  modal({
    title: "今天的状态",
    body: `
      <div class="grid grid-2">
        <div class="field"><label>昨夜睡眠（小时）</label><input class="input" id="ckSleep" type="number" step="0.5" value="${c.sleep_hours || 7}"></div>
        <div class="field"><label>精力 1–5</label><select class="select" id="ckEnergy">${[1, 2, 3, 4, 5].map((n) => `<option ${Number(c.energy) === n ? "selected" : ""}>${n}</option>`).join("")}</select></div>
        <div class="field"><label>心情 1–5</label><select class="select" id="ckMood">${[1, 2, 3, 4, 5].map((n) => `<option ${Number(c.mood) === n ? "selected" : ""}>${n}</option>`).join("")}</select></div>
        <div class="field"><label>备注（可选）</label><input class="input" id="ckNote" value="${esc(c.note || "")}"></div>
      </div>`,
    okText: "保存",
    onOk: async () => {
      await api.post("/self/control/checkins", {
        date: today(),
        sleep_hours: Number(document.getElementById("ckSleep").value),
        energy: Number(document.getElementById("ckEnergy").value),
        mood: Number(document.getElementById("ckMood").value),
        note: document.getElementById("ckNote").value,
      });
      toast("已记录，+5 积分", "success");
      await draw(root);
    },
  });
}

function taskModal(root) {
  modal({
    title: "新建任务",
    body: `
      <div class="field"><label>标题（动词开头）</label><input class="input" id="ntTitle" placeholder="例如：补图 3 的误差棒"></div>
      <div class="grid grid-3">
        <div class="field"><label>场景</label><select class="select" id="ntScene"><option value="work">工作</option><option value="study">学习</option><option value="life">生活</option><option value="fitness">健身</option></select></div>
        <div class="field"><label>优先级</label><select class="select" id="ntPriority"><option>P0</option><option selected>P1</option><option>P2</option></select></div>
        <div class="field"><label>预计分钟</label><input class="input" id="ntEstimate" type="number" value="30" min="5" step="5"></div>
      </div>
      <div class="grid grid-2">
        <div class="field"><label>安排日</label><input class="input" id="ntPlan" type="date" value="${today()}"></div>
        <div class="field"><label>截止日（可空）</label><input class="input" id="ntDue" type="date"></div>
      </div>
      <div class="field"><label>下一步动作</label><input class="input" id="ntNext" placeholder="一个 30 分钟内能开始的动作"></div>`,
    okText: "创建",
    onOk: async () => {
      const title = document.getElementById("ntTitle").value.trim();
      if (!title) return toast("标题不能为空");
      await api.post("/self/control/tasks", {
        title,
        scene: document.getElementById("ntScene").value,
        priority: document.getElementById("ntPriority").value,
        estimate_min: Number(document.getElementById("ntEstimate").value),
        plan_date: document.getElementById("ntPlan").value,
        due_at: document.getElementById("ntDue").value,
        next_action: document.getElementById("ntNext").value,
        status: "planned",
      });
      toast("任务已创建", "success");
      await draw(root);
    },
  });
}

function paperModal(root) {
  modal({
    title: "新建论文 / 项目",
    body: `
      <div class="field"><label>标题</label><input class="input" id="npTitle"></div>
      <div class="grid grid-2">
        <div class="field"><label>阶段</label><select class="select" id="npStage">${["选题", "实验", "写作", "投稿", "返修", "接收", "搁置"].map((s) => `<option>${s}</option>`).join("")}</select></div>
        <div class="field"><label>目标期刊</label><input class="input" id="npVenue"></div>
        <div class="field"><label>截稿日</label><input class="input" id="npDeadline" type="date"></div>
        <div class="field"><label>当前卡点</label><input class="input" id="npBlocker"></div>
      </div>
      <div class="field"><label>下一步</label><input class="input" id="npNext"></div>`,
    okText: "创建",
    onOk: async () => {
      const title = document.getElementById("npTitle").value.trim();
      if (!title) return toast("标题必填");
      await api.post("/self/control/papers", {
        title,
        stage: document.getElementById("npStage").value,
        venue: document.getElementById("npVenue").value,
        deadline: document.getElementById("npDeadline").value,
        blocker: document.getElementById("npBlocker").value,
        next_action: document.getElementById("npNext").value,
      });
      toast("已创建，+50 积分", "success");
      await draw(root);
    },
  });
}

function stageModal(root, paperId) {
  const paper = (state.papers || []).find((p) => String(p.id) === String(paperId));
  modal({
    title: "推进阶段",
    body: `
      <div class="field"><label>目标阶段</label><select class="select" id="spStage">${["选题", "实验", "写作", "投稿", "返修", "接收", "搁置"].map((s) => `<option ${paper && paper.stage === s ? "selected" : ""}>${s}</option>`).join("")}</select></div>
      <div class="field"><label>更新卡点（留空表示已解决）</label><input class="input" id="spBlocker" value="${esc(paper?.blocker || "")}"></div>
      <div class="field"><label>下一步</label><input class="input" id="spNext" value="${esc(paper?.next_action || "")}"></div>`,
    okText: "确认推进",
    onOk: async () => {
      await api.post(`/self/control/papers/${paperId}/stage`, {
        stage: document.getElementById("spStage").value,
        blocker: document.getElementById("spBlocker").value,
        next_action: document.getElementById("spNext").value,
      });
      toast("阶段已更新，+50 积分", "success");
      await draw(root);
    },
  });
}

/* ----------------------------- 工具 ----------------------------- */

function fmt(iso) {
  if (!iso) return "";
  const d = new Date(iso.replace(" ", "T"));
  if (isNaN(d.getTime())) return String(iso).slice(11, 16);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function addDays(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function weekStart() {
  const d = new Date();
  const day = d.getDay() === 0 ? 7 : d.getDay();
  d.setDate(d.getDate() - (day - 1));
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}