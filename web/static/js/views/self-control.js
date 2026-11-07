import { api } from "../api.js";
import { applyTheme, closeModal, esc, modal, toast, today } from "../ui.js";

const TABS = [
  { key: "today", label: "今日" },
  { key: "plan", label: "计划" },
  { key: "focus", label: "专注" },
  { key: "notes", label: "记录" },

  { key: "achievements", label: "成就" },
];

let state = { tab: "today", data: null, notes: [], papers: [], review: null, badges: null, shop: null };
let timer = null;
let focusPersistStop = null;

window.addEventListener("hashchange", () => {
  if (focusPersistStop) focusPersistStop();
});

export async function render(root, ctx) {
  clearInterval(timer);
  state = { tab: (ctx && ctx.params && ctx.params.get("tab")) || "today", data: null, notes: [], papers: [], review: null, badges: null, shop: null };

  const theme = localStorage.getItem("selfTheme") || "default";
  applyTheme(theme);

  root.innerHTML = `
    <div class="self-control">
      <div class="page-head">
        <div>
          <div class="page-title">Self-Control · 自我控制</div>
          <div class="page-sub">今日、计划、专注、记录与成就，把每天安排明白。</div>
        </div>
        <span class="tag tag-blue">${state.data ? "" : "加载中"}</span>
      </div>
      <div class="tabs" id="scTabs">
        ${TABS.map((t) => `<a class="tab ${state.tab === t.key ? "active" : ""}" data-tab="${t.key}" href="javascript:void(0)">${t.label}</a>`).join("")}
      </div>
      <div id="scBody"><div class="muted">正在读取…</div></div>
    </div>`;

  root.querySelectorAll("[data-tab]").forEach((el) => {
    el.addEventListener("click", async () => {
      if (el.dataset.tab === state.tab) return;
      if (window.__focusGuard) {
        toast("请保持专注，不要随意离开。若要离开，需点击暂停时钟", "error");
        return;
      }
      if (focusPersistStop) focusPersistStop();
      state.tab = el.dataset.tab;
      root.querySelectorAll("[data-tab]").forEach((x) => x.classList.toggle("active", x === el));
      await draw(root);
    });
  });


  root.querySelector("#scBody").addEventListener("change", async (e) => {
    const cb = e.target.closest('input[data-act="task-done"]');
    if (!cb) return;
    const id = cb.dataset.id;
    const done = cb.checked;
    const t = JSON.parse(cb.closest(".task-row")?.querySelector("[data-task]")?.getAttribute("data-task") || "{}");
    try {
      await api.patch(`/self/control/tasks/${id}`, { status: done ? "done" : "planned" });
      if (done) {
        showUndo(`已完成「${t.title || "任务"}」`, async () => {
          await api.patch(`/self/control/tasks/${id}`, { status: "planned" });
          toast("已撤销完成", "success");
          await draw(root);
        });
        await draw(root);
      } else {
        toast("已恢复", "success");
        await draw(root);
      }
    } catch (err) {
      toast(err.message, "error");
    }
  });

  root.querySelector("#scBody").addEventListener("click", async (e) => {
    const el = e.target.closest("[data-act]");
    if (!el) return;
    const act = el.dataset.act;
    if (act === "task-focus") {
      state.focusTask = el.dataset.title || "";
      state.tab = "focus";
      root.querySelectorAll("[data-tab]").forEach((x) => x.classList.toggle("active", x.dataset.tab === "focus"));
      await draw(root);
    } else if (act === "task-more") {
      let t = {};
      try {
        t = JSON.parse(el.getAttribute("data-task") || "{}");
      } catch (err) { /* 忽略 */ }
      openTaskMore(root, t);
    } else if (act === "toggle-overdue") {
      if (!state.data || !state.data.overdue) return;
      state.showOverdue = !state.showOverdue;
      await draw(root);
    } else if (act === "arrange") {
      await api.patch(`/self/control/tasks/${el.dataset.id}`, { status: "planned", plan_date: today() });
      toast("已安排到今天");
      await draw(root);
    }
  });

  if (window.__scSync) {
    window.removeEventListener("self:tasks-updated", window.__scSync);
  }
  window.__scSync = () => {
    if (state.tab === "today" || state.tab === "focus") draw(root);
  };
  window.addEventListener("self:tasks-updated", window.__scSync);

  await draw(root);
}

function showUndo(text, onUndo) {
  const bar = document.createElement("div");
  bar.className = "undo-bar";
  bar.innerHTML = `<span>${esc(text)}</span><button type="button">撤销</button>`;
  document.body.appendChild(bar);
  const timerId = setTimeout(() => bar.remove(), 5000);
  bar.querySelector("button").addEventListener("click", () => {
    clearTimeout(timerId);
    bar.remove();
    onUndo();
  });
}

function openTaskMore(root, t) {
  modal({
    title: "任务操作",
    hideOk: true,
    cancelText: "关闭",
    body: `<div class="task-more">
      <div class="tm-task">${esc(t.title || "")}</div>
      <button class="btn btn-ghost" data-more="tomorrow">改到明天</button>
      <button class="btn btn-ghost" data-more="pick">自选安排日期</button>
      <button class="btn btn-ghost" data-more="inbox">移回收件箱</button>
      <button class="btn btn-danger" data-more="delete">删除任务</button>
      <div class="muted" style="margin-top:10px;font-size:11px">改期只调整「安排日期」，不会改变截止时间；若新日期超过截止时间会先提示。</div>
    </div>`,
  });
  document.querySelectorAll("[data-more]").forEach((btn) =>
    btn.addEventListener("click", async () => {
      const action = btn.dataset.more;
      try {
        if (action === "tomorrow") {
          const d = new Date();
          d.setDate(d.getDate() + 1);
          await patchPlanDate(root, t, d.toISOString().slice(0, 10));
        } else if (action === "pick") {
          const val = prompt("安排日期（YYYY-MM-DD）", t.plan_date || today());
          if (val) await patchPlanDate(root, t, val);
        } else if (action === "inbox") {
          await api.patch(`/self/control/tasks/${t.id}`, { status: "inbox", plan_date: "" });
          document.querySelector(".modal [data-close]")?.click();
          toast("已移回收件箱", "success");
          await draw(root);
        } else if (action === "delete") {
          if (!confirm("确定删除这个任务？")) return;
          await api.patch(`/self/control/tasks/${t.id}`, { status: "deleted" });
          document.querySelector(".modal [data-close]")?.click();
          toast("已删除", "success");
          await draw(root);
        }
      } catch (err) {
        toast(err.message, "error");
      }
    })
  );
}

async function patchPlanDate(root, t, dateStr) {
  if (t.due_at && t.due_at.slice(0, 10) && dateStr > t.due_at.slice(0, 10)) {
    if (!confirm(`新的安排日期 ${dateStr} 已超过截止时间 ${t.due_at}，仍要改期吗？`)) return;
  }
  await api.patch(`/self/control/tasks/${t.id}`, { plan_date: dateStr, status: "planned" });
  document.querySelector(".modal [data-close]")?.click();
  toast(`已改到 ${dateStr}`, "success");
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

    else await drawAchievements(root, body);
  } catch (e) {
    body.innerHTML = `<div class="card"><div class="card-title">加载失败</div><div class="card-desc">${esc(e.message || "请稍后重试")}</div></div>`;
  }
}

/* ----------------------------- 今日 ----------------------------- */

async function drawToday(root, body) {
  const [d, allTasks, dailyReview] = await Promise.all([
    api.get(`/self/control/overview?day=${today()}`),
    api.get("/self/control/tasks").catch(() => []),
    api.get(`/self/control/reviews?type=daily&day=${today()}`).catch(() => ({ review: null })),
  ]);
  state.data = d;
  const total = d.tasks.length;
  const doneN = d.done_today ?? d.tasks.filter((t) => t.status === "done").length;
  const rate = total ? Math.round((doneN / total) * 100) : 0;
  const todayXp = d.today_xp ?? 0;

  const now = new Date();
  const WEEK_CN = ["日", "一", "二", "三", "四", "五", "六"];
  const dateLabel = `${now.getFullYear()} 年 ${now.getMonth() + 1} 月 ${now.getDate()} 日 · 星期${WEEK_CN[now.getDay()]}`;
  const in3 = new Date(now);
  in3.setDate(in3.getDate() + 3);
  const in3Str = `${in3.getFullYear()}-${String(in3.getMonth() + 1).padStart(2, "0")}-${String(in3.getDate()).padStart(2, "0")}`;
  const urgent = (allTasks || [])
    .filter((t) => {
      const due = (t.due_at || "").slice(0, 10);
      return due && t.status !== "done" && t.status !== "deleted" && due >= today() && due <= in3Str;
    })
    .sort((a, b) => (a.due_at || "").localeCompare(b.due_at || ""));
  const urgentOf = (t) => {
    const due = (t.due_at || "").slice(0, 10);
    const days = Math.round((new Date(due) - new Date(today())) / 86400000);
    return days <= 0 ? "今天截止" : days === 1 ? "明天截止" : `还有 ${days} 天`;
  };
  const dr = dailyReview?.review;

  const hourOf = (t) => Number((t.due_at || "").slice(11, 13)) || 0;
  const timed = (t) => (t.due_at || "").length >= 13;
  const notDone = (t) => t.status !== "done";
  const G = [
    { key: "morning", label: "上午", items: d.tasks.filter((t) => notDone(t) && timed(t) && hourOf(t) < 12) },
    { key: "afternoon", label: "下午", items: d.tasks.filter((t) => notDone(t) && timed(t) && hourOf(t) >= 12 && hourOf(t) < 18) },
    { key: "evening", label: "晚上", items: d.tasks.filter((t) => notDone(t) && timed(t) && hourOf(t) >= 18) },
    { key: "allday", label: "全天", items: d.tasks.filter((t) => notDone(t) && !timed(t)) },
  ];
  const doneTasks = d.tasks.filter((t) => t.status === "done");
  const next = (d.schedule || []).find((s) => new Date(s.start_at).getTime() > Date.now());

  body.innerHTML = `
    <div class="grid grid-3 sc-stats" style="margin-bottom:16px">
      <div class="card sc-stat">
        <div class="sc-stat-top"><span>今日待办</span><b>${doneN}<i>/${total}</i></b></div>
        <div class="sc-stat-flex">
          <div style="flex:1;min-width:0">
            <div class="sc-progress"><i style="width:${rate}%"></i></div>
            ${d.overdue ? `<div class="sc-stat-sub"><a class="sc-od-link" data-act="toggle-overdue" href="javascript:void(0)" title="查看逾期任务">逾期 ${d.overdue}</a></div>` : ""}
          </div>
        </div>
      </div>
      <div class="card sc-stat">
        <div class="sc-stat-top"><span>专注时间</span><b>${d.focus.count}<i>次</i></b></div>
        <div class="sc-stat-sub">今日累计 ${d.focus.minutes} 分钟</div>
        <button class="btn btn-soft btn-sm" data-jump="focus">去专注</button>
      </div>
      <div class="card sc-stat">
        <div class="sc-stat-top"><span>今日积分</span><b>+${todayXp}</b></div>
        <div class="sc-stat-sub">来自专注 · 任务 · 打卡</div>
        <button class="btn btn-ghost btn-sm" data-act="checkin">${d.checkin ? `已打卡 · 精力 ${d.checkin.energy}` : "精力打卡"}</button>
      </div>
    </div>

    <div class="grid grid-2">
      <div class="card">
        <div class="spread">
          <div class="card-title">今日任务</div>
          <button class="btn btn-primary btn-sm" data-act="new-task">新建</button>
        </div>
        ${d.overdue ? `<button type="button" class="sc-od" data-act="toggle-overdue" title="${state.showOverdue ? "收起逾期任务" : "查看逾期任务"}"><span>⚠ 逾期</span><b>${d.overdue} 个任务待处理</b><em>${state.showOverdue ? "收起 ▴" : "查看 ›"}</em></button>
        ${state.showOverdue && (d.overdue_tasks || []).length ? `<div class="sc-od-list">
          <div class="sc-tl-head"><i class="sc-tl-dot od"></i><b>逾期未完成</b><span>${d.overdue_tasks.length}</span></div>
          ${d.overdue_tasks.map((t) => taskRow(t, true)).join("")}
          ${d.overdue_tasks.length < d.overdue ? `<div class="muted" style="font-size:11px;padding:4px 2px">仅显示最早逾期的 ${d.overdue_tasks.length} 条，其余可在计划页处理。</div>` : ""}
        </div>` : ""}` : ""}
        ${G.filter((g) => g.items.length)
          .map(
            (g) => `<div class="sc-tl-group">
            <div class="sc-tl-head"><i class="sc-tl-dot ${g.key}"></i><b>${g.label}</b><span>${g.items.length}</span></div>
            ${g.items.map((t) => taskRow(t, false)).join("")}
          </div>`
          )
          .join("")}
        ${doneTasks.length
          ? `<div class="sc-tl-group">
              <div class="sc-tl-head"><i class="sc-tl-dot done"></i><b>已完成</b><span>${doneTasks.length}</span></div>
              ${doneTasks.map((t) => taskRow(t, false)).join("")}
            </div>`
          : !G.some((g) => g.items.length)
            ? `<div class="muted" style="margin-top:10px">今天还没有任务，点右上角「新建」开始。</div>`
            : ""}
        <div class="spread" style="margin-top:10px">
          <span class="muted" style="font-size:12px">收件箱 ${d.inbox} 条${d.inbox ? "待安排" : "，已清空"}</span>
          <a class="btn btn-ghost btn-sm" href="#/life/self/control?tab=plan">完整计划</a>
        </div>
      </div>

      <div class="sc-col">
      <div class="card">
        <div class="spread"><div class="card-title">今日日程</div><span class="tag tag-blue sc-date-tag">${dateLabel}</span></div>
        ${d.schedule.length
          ? `<div class="sc-agenda">${d.schedule
              .map(
                (s) => `<div class="sc-agenda-item">
              <div class="sc-agenda-time">${esc(fmt(s.start_at))}</div>
              <i class="sc-agenda-node"></i>
              <div class="sc-agenda-body">
                <b>${esc(s.title)}</b>
                <span>${s.kind === "fixed" ? "固定安排" : "弹性安排"} · ${esc(fmt(s.start_at))} – ${esc(fmt(s.end_at))}</span>
              </div>
            </div>`
              )
              .join("")}</div>`
          : `<div class="muted" style="margin-top:10px">今天没有讲座或会议安排，留白也是一种安排。</div>`}
        ${next ? `<div class="sc-next">下一件事：${esc(fmt(next.start_at))} ${esc(next.title)}</div>` : ""}
        <div class="sc-week">
          <div class="spread"><span class="muted">本周完成率</span><strong>${d.week.rate}%</strong></div>
          <div class="spread"><span class="muted">完成 / 计划</span><span>${d.week.done} / ${d.week.total}</span></div>
          <div class="spread"><span class="muted">连续有效日</span><span>${d.streak} 天</span></div>
          <a class="btn btn-ghost btn-sm" href="#/life/self/control?tab=plan">去计划</a>
        </div>
      </div>

      <div class="card sc-urgent-card">
        <div class="spread">
          <div class="row" style="gap:8px;align-items:center"><i class="sc-urgent-ico">⏱</i><div class="card-title">快截止任务</div></div>
          <span class="tag tag-warn">3 天内</span>
        </div>
        ${urgent.length
          ? urgent.slice(0, 6).map((t) => `
            <div class="sc-urgent-row">
              <span class="sc-urgent-dd ${urgentOf(t) === "今天截止" ? "hot" : ""}">${urgentOf(t)}</span>
              <div class="sc-urgent-main" data-act="task-detail" data-task='${esc(JSON.stringify(t))}' title="点击查看/编辑详情">
                <b>${esc(t.title)}</b>
                <span>截止 ${esc((t.due_at || "").slice(0, 16).replace("T", " "))}${t.plan_date ? ` · 安排 ${esc(t.plan_date)}` : " · 未安排"}</span>
              </div>
              <div class="sc-urgent-acts">
                <button class="btn btn-ghost btn-sm" data-act="task-focus" data-title="${esc(t.title)}">开始专注</button>
                ${t.plan_date !== today() ? `<button class="btn btn-soft btn-sm" data-act="arrange" data-id="${t.id}">排今天</button>` : ""}
              </div>
            </div>`).join("")
          : `<div class="muted" style="margin-top:10px">3 天内没有快截止的任务，节奏很好。</div>`}
        ${urgent.length > 6 ? `<div class="muted" style="font-size:11px;margin-top:6px">还有 ${urgent.length - 6} 条较早的，可在计划页查看。</div>` : ""}
      </div>
      </div>
    </div>

    <div class="card" style="margin-top:16px">
      <div class="spread">
        <div class="card-title">今日复盘</div>
        <span class="tag tag-blue">${dr ? "已保存 · 可修改" : "三问快答 · +10 积分"}</span>
      </div>
      <div class="grid grid-3" style="margin-top:10px">
        <div class="field"><label>今天完成了什么</label><textarea class="input" id="drSum" rows="3" placeholder="完成的任务、推进的进展……">${esc(dr?.summary || "")}</textarea></div>
        <div class="field"><label>哪些卡住了</label><textarea class="input" id="drF1" rows="3" placeholder="卡点、原因、需要谁帮忙……">${esc(dr?.focus1 || "")}</textarea></div>
        <div class="field"><label>明天先做什么</label><textarea class="input" id="drF2" rows="3" placeholder="明早第一件事，30 分钟内能开始的……">${esc(dr?.focus2 || "")}</textarea></div>
      </div>
      <button class="btn btn-primary btn-sm" data-act="save-daily-review" style="margin-top:10px">保存今日复盘</button>
    </div>`;

  body.querySelector('[data-act="checkin"]').addEventListener("click", () => checkinModal(root));
  body.querySelector('[data-act="new-task"]').addEventListener("click", () => taskModal(root));
  body.querySelectorAll("[data-jump]").forEach((el) =>
    el.addEventListener("click", () => {
      const t = el.dataset.jump;
      state.tab = t;
      root.querySelectorAll("[data-tab]").forEach((x) => x.classList.toggle("active", x.dataset.tab === t));
      draw(root);
    })
  );
  bindTaskDetail(body);

  body.querySelector('[data-act="save-daily-review"]').addEventListener("click", async (e) => {
    const btn = e.currentTarget;
    btn.disabled = true;
    try {
      await api.post("/self/control/reviews", {
        type: "daily",
        day: today(),
        summary: body.querySelector("#drSum").value.trim(),
        focus1: body.querySelector("#drF1").value.trim(),
        focus2: body.querySelector("#drF2").value.trim(),
      });
      toast("今日复盘已保存", "success");
      btn.textContent = "已保存 ✓";
    } catch (err) {
      toast(err.message, "error");
      btn.disabled = false;
    }
  });

}

/* ----------------------------- 计划 ----------------------------- */

/* ---------------- 计划：左栏组件（本月计划情况 / 迷你日历 / 月度复盘） ---------------- */

function monthPlanCard(ms) {
  const t = ms?.total || 0;
  const done = ms?.done || 0;
  const ongoing = ms?.ongoing || 0;
  const notStarted = ms?.not_started || 0;
  const rate = ms?.rate || 0;
  const seg = (n) => (t ? `${(n / t) * 100}%` : "0%");
  return `
  <div class="card sc-mp-card">
    <div class="sc-mp-head">
      <b class="sc-mp-num">${t}</b>
      <div class="sc-mp-label">本月计划</div>
      <div class="sc-mp-rate"><strong>${rate}<i>%</i></strong><span>完成率</span></div>
    </div>
    <div class="sc-mp-bar" title="已完成 ${done} · 进行中 ${ongoing} · 未开始 ${notStarted}">
      <i style="width:${seg(done)}" class="done"></i><i style="width:${seg(ongoing)}" class="ing"></i><i style="width:${seg(notStarted)}" class="todo"></i>
    </div>
    <div class="sc-mp-rows">
      <span><i class="sc-mp-dot done"></i>已完成 <b>${done}</b></span>
      <span><i class="sc-mp-dot ing"></i>进行中 <b>${ongoing}</b></span>
      <span><i class="sc-mp-dot todo"></i>未开始 <b>${notStarted}</b></span>
    </div>
  </div>`;
}

function pieSvg(done, total) {
  const d = Math.max(0, Math.min(done, total));
  const pct = total ? d / total : 0;
  const r = 56, sw = 18, circ = 2 * Math.PI * r;
  if (!total) {
    return `<svg viewBox="0 0 150 150" class="sc-pie2" role="img" aria-label="暂无计划">
      <circle cx="75" cy="75" r="${r}" fill="none" stroke="#e2e8f0" stroke-width="${sw}"/>
      <text x="75" y="80" text-anchor="middle" class="sc-pie2-sub">暂无计划</text></svg>`;
  }
  const dash = (circ * pct).toFixed(1);
  return `<svg viewBox="0 0 150 150" class="sc-pie2" role="img" aria-label="完成 ${Math.round(pct * 100)}%">
    <circle cx="75" cy="75" r="${r}" fill="none" stroke="#e2e8f0" stroke-width="${sw}"/>
    <circle cx="75" cy="75" r="${r}" fill="none" stroke="#34d399" stroke-width="${sw}"
      stroke-linecap="round" stroke-dasharray="${dash} ${(circ - Number(dash)).toFixed(1)}" transform="rotate(-90 75 75)"/>
    <text x="75" y="72" text-anchor="middle" class="sc-pie2-num">${Math.round(pct * 100)}%</text>
    <text x="75" y="92" text-anchor="middle" class="sc-pie2-sub">${d}/${total}</text>
  </svg>`;
}

function dailyPieCharts(ms) {
  const series = ms?.series || [];
  const t = today();
  const tRow = series.find((s) => s.date === t) || { total: 0, done: 0 };
  const since = new Date(`${t}T00:00:00`);
  since.setDate(since.getDate() - 6);
  const sinceStr = `${since.getFullYear()}-${String(since.getMonth() + 1).padStart(2, "0")}-${String(since.getDate()).padStart(2, "0")}`;
  const week = series.filter((s) => s.date >= sinceStr && s.date <= t);
  const wTotal = week.reduce((a, s) => a + s.total, 0);
  const wDone = week.reduce((a, s) => a + s.done, 0);
  return `
  <div class="card sc-bc-card">
    <div class="spread">
      <div class="card-title">每日完成情况</div>
      <div class="sc-bc-legend">
        <span><i class="bc-done"></i>已完成</span>
        <span><i class="bc-todo"></i>未完成</span>
      </div>
    </div>
    <div class="sc-pie-pair">
      <div class="sc-pie-item">
        <div class="sc-pie-cap">今日</div>
        ${pieSvg(tRow.done, tRow.total)}
        <div class="sc-pie-foot">今日完成 ${tRow.done}/${tRow.total}</div>
      </div>
      <div class="sc-pie-item">
        <div class="sc-pie-cap">近 7 天</div>
        ${pieSvg(wDone, wTotal)}
        <div class="sc-pie-foot">近 7 天完成 ${wDone}/${wTotal}</div>
      </div>
    </div>
    <div class="muted" style="font-size:11px;margin-top:2px">按「安排日期」统计；绿色为已完成，灰色为未完成。</div>
  </div>`;
}

function monthlyReviewCard(mr) {
  const r = mr?.review;
  const ym = today().slice(0, 7);
  const [y, m] = ym.split("-").map(Number);
  return `
  <div class="card sc-mr-card">
    <div class="spread">
      <div class="card-title">月度工作复盘</div>
      <span class="tag tag-blue">${y} 年 ${m} 月</span>
    </div>
    <div class="field" style="margin-top:10px"><label>本月成果（每行一条）</label>
      <textarea class="input" id="mrSum" rows="4" placeholder="1、&#10;2、&#10;3、">${esc(r?.summary || "")}</textarea></div>
    <div class="field"><label>下月计划（每行一条）</label>
      <textarea class="input" id="mrF1" rows="3" placeholder="1、&#10;2、">${esc(r?.focus1 || "")}</textarea></div>
    <button class="btn btn-primary btn-sm" data-act="save-monthly-review">${r ? "更新月度复盘" : "保存月度复盘（+30 积分）"}</button>
  </div>`;
}

async function drawPlan(root, body) {
  const viewMonth = today().slice(0, 7) + "-01";
  const [tasks, papers, ms, mr] = await Promise.all([
    api.get("/self/control/tasks"),
    api.get("/self/control/papers"),
    api.get(`/self/control/month-stats?month=${today().slice(0, 7)}`).catch(() => null),
    api.get(`/self/control/reviews?type=monthly&month=${viewMonth}`).catch(() => null),
  ]);
  state.papers = papers;
  const inbox = tasks.filter((t) => t.status === "inbox");
  const planned = tasks.filter((t) => t.status === "planned");
  body.innerHTML = `
    <div class="sc-plan-cols">
      <aside class="sc-plan-left">
        ${monthPlanCard(ms)}
        <div class="card">
          <div class="spread"><div class="card-title">待排期事项</div><button class="btn btn-primary btn-sm" data-act="new-task">新建</button></div>
          ${inbox.length
            ? inbox.slice(0, 6).map((t, i) => `
              <div class="sc-inbox-item">
                <span class="sc-inbox-idx">${i + 1}</span>
                <div class="sc-inbox-main" data-act="task-detail" data-task='${esc(JSON.stringify(t))}' title="点击查看/编辑详情">
                  <b>${esc(t.title)}</b>
                  <span>${esc(t.priority || "P1")} · ${t.due_at ? `截止 ${esc(t.due_at.slice(0, 10))}` : "无截止"}${t.source === "message" ? " · 群消息" : ""}</span>
                </div>
                <button class="btn btn-soft btn-sm" data-act="arrange" data-id="${t.id}">排今天</button>
              </div>`).join("") + (inbox.length > 6 ? `<div class="muted" style="font-size:11px;margin-top:6px">还有 ${inbox.length - 6} 条待排期。</div>` : "")
            : `<div class="muted" style="margin-top:10px">收件箱已清空，待排期事项会出现在这里。</div>`}
          ${planned.length ? `<div class="section-title" style="margin-top:14px">已安排（最近 6 条）</div>
            ${planned.slice(0, 6).map((t) => taskRow(t, false)).join("")}` : ""}
        </div>
        ${monthlyReviewCard(mr)}
      </aside>

      <div class="sc-plan-right">
        ${dailyPieCharts(ms)}

        <div class="grid grid-2">
          <div class="card" style="grid-column:1/-1">
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
          </div>
        </div>
      </div>
    </div>`;


  body.querySelector('[data-act="new-task"]').addEventListener("click", () => taskModal(root));
  bindTaskDetail(body);
  body.querySelectorAll('[data-act="arrange"]').forEach((el) =>
    el.addEventListener("click", async () => {
      await api.patch(`/self/control/tasks/${el.dataset.id}`, { status: "planned", plan_date: today() });
      toast("已安排到今天");
      await draw(root);
    })
  );
  body.querySelector('[data-act="save-monthly-review"]')?.addEventListener("click", async (e) => {
    const btn = e.currentTarget;
    btn.disabled = true;
    try {
      await api.post("/self/control/reviews", {
        type: "monthly",
        month: today().slice(0, 7) + "-01",
        summary: body.querySelector("#mrSum").value.trim(),
        focus1: body.querySelector("#mrF1").value.trim(),
      });
      toast("月度复盘已保存", "success");
      btn.textContent = "已保存 ✓";
    } catch (err) {
      toast(err.message, "error");
      btn.disabled = false;
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

function showTaskDetail(t) {
  modal({
    title: "任务详情",
    hideOk: true,
    cancelText: "关闭",
    body: `<div class="task-detail-modal">
      <div class="td-row"><span>任务</span><b>${esc(t.title)}</b></div>
      <div class="td-row"><span>状态</span>${t.status === "done" ? '<span class="tag tag-green">已完成</span>' : t.status === "planned" ? '<span class="tag tag-blue">已安排</span>' : '<span class="tag">收件箱</span>'}</div>
      <div class="td-row"><span>优先级</span>${esc(t.priority || "P1")} · 预计 ${t.estimate_min || 30} 分钟</div>
      ${t.plan_date ? `<div class="td-row"><span>计划日期</span>${esc(t.plan_date)}</div>` : ""}
      ${t.due_at ? `<div class="td-row"><span>截止</span>${esc(t.due_at)}</div>` : ""}
      ${t.next_action ? `<div class="td-row"><span>下一步</span>${esc(t.next_action)}</div>` : ""}
      ${t.source === "message" ? '<div class="td-row"><span>来源</span>群消息</div>' : ""}
      ${t.postpone_count > 0 ? `<div class="td-row"><span>顺延</span>${t.postpone_count} 次</div>` : ""}
    </div>`,
  });
}

function bindTaskDetail(scope) {
  scope.querySelectorAll('[data-act="task-detail"]').forEach((el) =>
    el.addEventListener("click", (e) => {
      if (e.target.closest('input[type="checkbox"], button')) return;
      try {
        showTaskDetail(JSON.parse(el.getAttribute("data-task")));
      } catch (err) { /* 数据损坏时忽略 */ }
    })
  );
}

function taskRow(t, arrange) {
  const done = t.status === "done";
  return `<div class="task-row ${done ? "is-done" : ""}">
    <input type="checkbox" class="task-check" data-act="task-done" data-id="${t.id}" ${done ? "checked" : ""} aria-label="完成任务">
    <div class="task-main" data-act="task-detail" data-task='${esc(JSON.stringify(t))}' title="点击查看/编辑详情">
      <div class="task-title">${esc(t.title)}</div>
      <div class="task-meta">
        ${esc(t.priority || "P1")} · ${t.estimate_min || 30} 分钟
        ${t.plan_date ? ` · 安排 ${esc(t.plan_date)}` : ""}
        ${t.due_at ? ` · 截止 ${esc(t.due_at)}` : ""}
        ${t.source === "message" ? ' · <span class="tag">群消息</span>' : ""}
      </div>
    </div>
    <div class="task-actions">
      ${!done ? `<button class="btn btn-ghost btn-sm" data-act="task-focus" data-title="${esc(t.title)}">开始专注</button>` : ""}
      ${arrange && !done ? `<button class="btn btn-ghost btn-sm" data-act="arrange" data-id="${t.id}">排今天</button>` : ""}
      <button class="btn btn-ghost btn-sm" data-act="task-more" data-task='${esc(JSON.stringify(t))}'>更多</button>
    </div>
  </div>`;
}

/* ----------------------------- 专注 ----------------------------- */

/* ----------------------------- 专注（番茄钟） ----------------------------- */

const FOCUS_CATS = ["上课", "待办", "新闻", "省钱", "搭子", "预约"];

async function drawFocus(root, body) {
  const d = await api.get(`/self/control/overview?day=${today()}`);
  state.data = d;

  let cfg = { focusMin: 25, restMin: 5, rounds: 4, blocked: ["新闻", "省钱", "搭子"] };
  try {
    cfg = { ...cfg, ...JSON.parse(localStorage.getItem("focusCfg") || "{}") };
  } catch (e) { /* 忽略损坏的本地配置 */ }
  const presetTask = state.focusTask || "";
  state.focusTask = "";

  body.innerHTML = `
    <div class="focus-grid">
      <div class="sc-focus-left">
      <div class="card fc-clock-card">
        <div class="spread"><div class="card-title">专注时钟</div><span class="tag tag-blue" id="fcPhaseTag">未开始</span></div>
        <div class="fc-clock-wrap">
          <svg class="fc-ring" viewBox="0 0 200 200">
            <circle class="fc-ring-bg" cx="100" cy="100" r="88"/>
            <circle class="fc-ring-fg" id="fcRing" cx="100" cy="100" r="88"/>
          </svg>
          <div class="fc-clock-center">
            <div class="fc-time" id="fcTime">${String(cfg.focusMin).padStart(2, "0")}:00</div>
            <div class="fc-round" id="fcRound">第 0 / ${cfg.rounds} 轮</div>
          </div>
        </div>
        <div class="field" style="margin-top:14px"><label>本次任务</label>
          <input class="input" id="fcTask" value="${esc(presetTask)}" placeholder="例如：补图 3 的误差棒">
        </div>
        <div class="row fc-actions" style="justify-content:center;margin-top:12px">
          <button class="btn btn-primary" id="fcMainBtn" type="button">开始专注</button>
          <button class="btn btn-ghost" id="fcSubBtn" type="button">调整时长</button>
        </div>
        <div class="muted" style="margin-top:10px;font-size:11px" id="fcHint">专注结束后自动进入休息；屏蔽勾选类别的消息弹窗，红点保留。<br>计时中可先暂停再前往其他页面，返回后会从暂停处继续。</div>
      </div>
      <div id="focusTrend"></div>
      </div>

      <div>
        <div class="card">
          <div class="spread"><div class="card-title">番茄钟设置</div><span class="tag tag-gold">专注 ${cfg.focusMin} · 休息 ${cfg.restMin} · ${cfg.rounds} 轮</span></div>
          <div class="fc-set-row"><label>专注时长</label>
            <div class="fc-chips" id="fcFocusLen">
              ${[15, 25, 45, 60].map((m) => `<button class="fc-chip ${cfg.focusMin === m ? "on" : ""}" data-min="${m}">${m} 分</button>`).join("")}
              <input class="fc-chip-input" id="fcFocusCustom" type="number" min="5" max="180" value="${[15, 25, 45, 60].includes(cfg.focusMin) ? "" : cfg.focusMin}" placeholder="自定义">
            </div>
          </div>
          <div class="fc-set-row"><label>休息时长</label>
            <div class="fc-chips" id="fcRestLen">
              ${[5, 10, 15].map((m) => `<button class="fc-chip ${cfg.restMin === m ? "on" : ""}" data-min="${m}">${m} 分</button>`).join("")}
              <input class="fc-chip-input" id="fcRestCustom" type="number" min="1" max="60" value="${[5, 10, 15].includes(cfg.restMin) ? "" : cfg.restMin}" placeholder="自定义">
            </div>
          </div>
          <div class="fc-set-row"><label>计划轮数</label>
            <div class="fc-chips" id="fcRounds">
              ${[2, 4, 6].map((n) => `<button class="fc-chip ${cfg.rounds === n ? "on" : ""}" data-n="${n}">${n} 轮</button>`).join("")}
              <input class="fc-chip-input" id="fcRoundsCustom" type="number" min="1" max="12" value="${[2, 4, 6].includes(cfg.rounds) ? "" : cfg.rounds}" placeholder="自定义">
            </div>
          </div>
          <div class="fc-set-row" style="align-items:flex-start"><label style="margin-top:6px">屏蔽通知</label>
            <div class="fc-chips" id="fcBlock">
              ${FOCUS_CATS.map((c) => `<button class="fc-chip ${cfg.blocked.includes(c) ? "on" : ""}" data-cat="${c}">${c}</button>`).join("")}
            </div>
          </div>
          <div class="muted" style="margin-top:8px;font-size:11px">屏蔽的类别在专注期间不弹出消息通知（红点仍保留，可在消息中心查看）；未勾选类别照常提醒。</div>
        </div>

        <div class="card" style="margin-top:14px">
          <div class="card-title">今日专注</div>
          <div class="stat" style="margin-top:10px"><div class="stat-num">${d.focus.count}<span class="unit">次</span></div><div class="stat-label">${d.focus.minutes} 分钟</div></div>
          <div class="section-title" style="margin-top:14px">今日任务 · 点击右侧按钮直接专注</div>
          ${d.tasks.length ? d.tasks.map((t) => taskRow(t, false)).join("") : `<div class="muted" style="margin-top:8px">今天还没有任务。</div>`}
        </div>
      </div>
    </div>`;

  let phase = "idle"; // idle | focusing | resting
  let running = false;
  let round = 0;
  let usedSec = 0;
  let totalSec = cfg.focusMin * 60;
  let remaining = totalSec;

  const timeEl = body.querySelector("#fcTime");
  const ringEl = body.querySelector("#fcRing");
  const phaseEl = body.querySelector("#fcPhaseTag");
  const roundEl = body.querySelector("#fcRound");
  const mainBtn = body.querySelector("#fcMainBtn");
  const subBtn = body.querySelector("#fcSubBtn");
  const CIRC = 2 * Math.PI * 88;

  const syncFocusMode = () => {
    window.__focusMode = { active: phase === "focusing", blocked: cfg.blocked };
    window.__focusGuard = phase === "focusing";
  };

  const paint = () => {
    timeEl.textContent = `${String(Math.floor(remaining / 60)).padStart(2, "0")}:${String(remaining % 60).padStart(2, "0")}`;
    const ratio = totalSec ? remaining / totalSec : 0;
    ringEl.style.strokeDashoffset = String(CIRC * (1 - ratio));
    const shownRound = phase === "done" ? cfg.rounds : phase === "idle" ? 0 : round + 1;
    roundEl.textContent = `第 ${shownRound} / ${cfg.rounds} 轮`;
  };

  const setPhase = (p) => {
    phase = p;
    syncFocusMode();
    const labels = { idle: "未开始", focusing: "专注中", paused: "已暂停", resting: "休息中", done: "本组完成" };
    const mains = { idle: "开始专注", focusing: "暂停", paused: "继续专注", resting: "开始下一轮", done: "再来一组" };
    const subs = { idle: "调整时长", focusing: "提前结束", paused: "结束本次", resting: "结束本组", done: "查看记录" };
    phaseEl.textContent = labels[p] || p;
    phaseEl.className = `tag ${p === "focusing" ? "tag-blue" : p === "resting" ? "tag-green" : p === "paused" ? "tag-gold" : p === "done" ? "tag-green" : ""}`;
    mainBtn.textContent = mains[p] || "开始专注";
    subBtn.textContent = subs[p] || "调整时长";
    mainBtn.dataset.phase = p;
    ringEl.classList.toggle("resting", p === "resting");
    document.title = p === "idle" ? "自我控制 · 爱师大" : `${timeEl.textContent} ${labels[p] || ""} · 爱师大`;
  };

  const stopTick = () => {
    clearInterval(timer);
    timer = null;
    running = false;
  };

  const tick = () => {
    remaining -= 1;
    if (phase === "focusing") usedSec += 1;
    if (remaining <= 0) {
      remaining = 0;
      stopTick();
      paint();
      if (phase === "focusing") {
        onFocusDone();
      } else {
        onNextRound();
      }
      return;
    }
    paint();
    if (remaining === 300) toast(phase === "focusing" ? "还剩 5 分钟" : "休息还剩 5 分钟");
  };

  const savePomodoro = async () => {
    const minutes = Math.max(1, Math.round(usedSec / 60));
    const task = body.querySelector("#fcTask").value.trim() || "专注";
    try {
      await api.post("/self/pomodoro", { task, minutes, status: "done" });
      const credit = minutes > 20 ? "已记录，满 20 分钟计入积分" : "未满 20 分钟，本次不计积分";
      toast(`专注完成：${task} · ${minutes} 分钟，${credit}`, "success");
    } catch (e) {
      toast(e.message, "error");
    }
    usedSec = 0;
  };

  const onFocusDone = async () => {
    await savePomodoro();
    if (round >= cfg.rounds) {
      setPhase("done");
      totalSec = remaining = cfg.focusMin * 60;
      paint();
      toast(`全部 ${cfg.rounds} 轮完成，好好休息一下！`, "success");
      return;
    }
    totalSec = remaining = cfg.restMin * 60;
    setPhase("resting");
    paint();
    timer = setInterval(tick, 1000);
    running = true;
    toast("进入休息，站起来喝口水 🥤");
  };

  const onNextRound = () => {
    round += 1;
    if (round >= cfg.rounds) {
      setPhase("done");
      totalSec = remaining = cfg.focusMin * 60;
      round = 0;
      paint();
      toast(`全部 ${cfg.rounds} 轮完成，今天很棒！`, "success");
      return;
    }
    totalSec = remaining = cfg.focusMin * 60;
    setPhase("focusing");
    paint();
    timer = setInterval(tick, 1000);
    running = true;
    toast(`休息结束，开始第 ${round + 1} 轮专注`);
  };

  const startTick = () => {
    stopTick();
    timer = setInterval(tick, 1000);
    running = true;
  };

  const startFocus = () => {
    setPhase("focusing");
    paint();
    startTick();
  };

  mainBtn.addEventListener("click", () => {
    if (phase === "idle" || phase === "done") {
      round = 0;
      usedSec = 0;
      totalSec = remaining = cfg.focusMin * 60;
      startFocus();
    } else if (phase === "focusing") {
      stopTick();
      setPhase("paused");
      toast("已暂停，计时保留");
    } else if (phase === "paused") {
      startFocus();
    } else if (phase === "resting") {
      stopTick();
      onNextRound();
    }
  });

  subBtn.addEventListener("click", async () => {
    if (phase === "idle" || phase === "done") {
      const card = body.querySelector(".fc-set-row");
      if (card) card.scrollIntoView({ behavior: "smooth", block: "center" });
      else toast("在右侧调整专注时长");
    } else if (phase === "focusing" || phase === "paused") {
      stopTick();
      const mins = Math.max(0, Math.round(usedSec / 60));
      localStorage.removeItem("focusRuntime");
      if (mins >= 1) await savePomodoro();
      phase = "idle";
      round = 0;
      usedSec = 0;
      totalSec = remaining = cfg.focusMin * 60;
      setPhase("idle");
      paint();
      toast(mins >= 1 ? `本次已结束，记录 ${mins} 分钟` : "本次已结束", "success");
      document.title = "自我控制 · 爱师大";
    } else if (phase === "resting") {
      stopTick();
      setPhase("done");
      toast("本组结束，休息一下", "success");
    } else if (phase === "done") {
      state.tab = "notes";
      root.querySelectorAll("[data-tab]").forEach((x) => x.classList.toggle("active", x.dataset.tab === "notes"));
      await draw(root);
    }
  });

  // 设置交互
  const bindChips = (wrapSel, key, isRounds) => {
    const wrap = body.querySelector(wrapSel);
    wrap.querySelectorAll(".fc-chip").forEach((chip) => {
      chip.addEventListener("click", () => {
        if (phase === "focusing" || phase === "resting") {
          toast("计时中不可改设置，请先暂停后调整", "error");
          return;
        }
        wrap.querySelectorAll(".fc-chip").forEach((x) => x.classList.remove("on"));
        chip.classList.add("on");
        const input = wrap.querySelector(".fc-chip-input");
        if (input) input.value = "";
        cfg[key] = isRounds ? Number(chip.dataset.n) : Number(chip.dataset.min);
        localStorage.setItem("focusCfg", JSON.stringify(cfg));
        if (key === "focusMin") totalSec = remaining = cfg.focusMin * 60;
        paint();
      });
    });
    const input = wrap.querySelector(".fc-chip-input");
    if (input) {
      input.addEventListener("change", () => {
        if (phase === "focusing" || phase === "resting") {
          toast("计时中不可改设置，请先暂停后调整", "error");
          input.value = "";
          return;
        }
        const v = Number(input.value);
        if (!v || v < 1) return;
        wrap.querySelectorAll(".fc-chip").forEach((x) => x.classList.remove("on"));
        cfg[key] = v;
        localStorage.setItem("focusCfg", JSON.stringify(cfg));
        if (key === "focusMin") totalSec = remaining = cfg.focusMin * 60;
        paint();
      });
    }
  };
  bindChips("#fcFocusLen", "focusMin", false);
  bindChips("#fcRestLen", "restMin", false);
  bindChips("#fcRounds", "rounds", true);

  body.querySelectorAll("#fcBlock .fc-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      const c = chip.dataset.cat;
      if (cfg.blocked.includes(c)) {
        cfg.blocked = cfg.blocked.filter((x) => x !== c);
        chip.classList.remove("on");
      } else {
        cfg.blocked.push(c);
        chip.classList.add("on");
      }
      localStorage.setItem("focusCfg", JSON.stringify(cfg));
      syncFocusMode();
    });
  });

  const persistStop = () => {
    if (remaining > 0 && (phase === "focusing" || phase === "resting" || phase === "paused")) {
      try {
        localStorage.setItem("focusRuntime", JSON.stringify({
          remaining,
          usedSec,
          round,
          totalSec,
          task: body.querySelector("#fcTask")?.value || "",
          savedAt: Date.now(),
        }));
      } catch (e) { /* 忽略本地存储异常 */ }
    }
    stopTick();
    window.__focusMode = null;
    document.title = "自我控制 · 爱师大";
    if (focusPersistStop === persistStop) focusPersistStop = null;
  };
  focusPersistStop = persistStop;

  setPhase("idle");
  paint();
  syncFocusMode();

  try {
    const rawRuntime = localStorage.getItem("focusRuntime");
    if (rawRuntime) {
      const saved = JSON.parse(rawRuntime);
      localStorage.removeItem("focusRuntime");
      if (saved && saved.savedAt && Date.now() - saved.savedAt < 6 * 3600 * 1000 && Number(saved.remaining) > 0) {
        usedSec = Number(saved.usedSec) || 0;
        round = Number(saved.round) || 0;
        totalSec = Number(saved.totalSec) || cfg.focusMin * 60;
        remaining = Number(saved.remaining);
        if (saved.task) body.querySelector("#fcTask").value = saved.task;
        setPhase("paused");
        paint();
        toast("已恢复上次暂停的专注，可点“继续专注”", "success");
      }
    }
  } catch (e) { /* 忽略损坏的本地状态 */ }

  /* ---- 近 7 天专注时间变化折线图（放在左栏底部，与右侧模块底部对齐） ---- */
  try {
    const wrap = document.createElement("div");
    wrap.className = "card sc-focus-trend";
    const stats = await api.get("/self/control/focus-stats?days=7");
    const daily = (stats && stats.daily) || [];
    const totalMin = (stats && stats.total_minutes) || 0;
    const W = 340, H = 180, padL = 34, padR = 14, padT = 18, padB = 30;
    const maxMin = Math.max(30, Math.ceil(Math.max(...daily.map((x) => x.minutes), 0) / 30) * 30);
    const xs = (i) => padL + (i * (W - padL - padR)) / Math.max(1, daily.length - 1);
    const ys = (v) => padT + (1 - v / maxMin) * (H - padT - padB);
    const pts = daily.map((x, i) => `${xs(i).toFixed(1)},${ys(x.minutes).toFixed(1)}`);
    const area = pts.length
      ? `M${pts[0]} L${pts.slice(1).map((p) => p).join(" L")} L${xs(daily.length - 1).toFixed(1)},${(H - padB).toFixed(1)} L${xs(0).toFixed(1)},${(H - padB).toFixed(1)} Z`
      : "";
    const grid = [0, 0.5, 1].map((f) => {
      const y = (padT + f * (H - padT - padB)).toFixed(1);
      return `<line x1="${padL}" y1="${y}" x2="${W - padR}" y2="${y}" stroke="#e2e8f0" stroke-dasharray="3 4"/><text x="${padL - 6}" y="${Number(y) + 4}" text-anchor="end" class="sc-ft-axis">${Math.round(maxMin * (1 - f))}</text>`;
    }).join("");
    const labels = daily.map((x, i) => `<text x="${xs(i).toFixed(1)}" y="${H - 9}" text-anchor="middle" class="sc-ft-axis">${esc((x.date || "").slice(5))}</text>`).join("");
    const dots = daily.map((x, i) => `<circle cx="${xs(i).toFixed(1)}" cy="${ys(x.minutes).toFixed(1)}" r="3.5" class="sc-ft-dot"><title>${esc(x.date)} · ${x.minutes} 分钟 · ${x.count} 次</title></circle>`).join("");
    wrap.innerHTML = `
      <div class="spread"><div class="card-title">近 7 天专注趋势</div>
        <span class="sc-ft-unit">单位：分钟</span></div>
      <svg class="sc-ft-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="近 7 天专注时间变化折线图">
        <defs>
          <linearGradient id="scFtFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#7c3aed" stop-opacity=".28"/>
            <stop offset="100%" stop-color="#7c3aed" stop-opacity="0"/>
          </linearGradient>
        </defs>
        ${grid}
        ${area ? `<path d="${area}" fill="url(#scFtFill)"/>` : ""}
        <path d="M${pts.join(" L")}" fill="none" stroke="#7c3aed" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/>
        ${dots}
        ${labels}
      </svg>
      ${totalMin ? "" : '<div class="muted" style="margin-top:2px;font-size:11px">近 7 天还没有完成专注，开始一次番茄钟后会在这里看到每天的变化。</div>'}`;
    const trendBox = body.querySelector("#focusTrend");
    if (trendBox) trendBox.appendChild(wrap);
  } catch (e) { /* 统计可选 */ }
}


/* ----------------------------- 记录 ----------------------------- */

async function drawNotes(root, body) {
  const notes = await api.get("/self/control/notes");
  state.notes = notes;

  const byMonth = {};
  notes.forEach((n) => {
    const k = (n.created_at || "").slice(0, 7);
    if (!k) return;
    (byMonth[k] = byMonth[k] || []).push(n);
  });
  const months = Object.keys(byMonth).sort().reverse();
  const totalDays = new Set(notes.map((n) => (n.created_at || "").slice(0, 10))).size;

  body.innerHTML = `
    <div class="card" style="margin-bottom:16px">
      <div class="spread">
        <div class="row" style="gap:8px;align-items:center">
          <span class="sc-note-ico">✎</span>
          <div class="card-title">随记</div>
        </div>
        <div class="row">
          <span class="tag tag-blue">与主页随记同步</span>
          <a class="btn btn-ghost btn-sm" href="#/home">回到主页随记 ›</a>
        </div>
      </div>
      <div class="muted" style="margin-top:4px;font-size:11.5px">随时记下想法、日记、读文章时的新点子；主页侧栏「随记」进来就是这里。</div>
      <div class="row" style="margin-top:10px;align-items:flex-start">
        <textarea class="input" id="noteText" rows="3" placeholder="刚想到什么？一句话也行。&#10;例如：读《XXX》第 3 章想到可以用问卷补数据……" style="flex:1"></textarea>
        <div style="display:flex;flex-direction:column;gap:8px">
          <button class="btn btn-primary" data-act="save-note">保存记录</button>
        </div>
      </div>
    </div>

    <div class="card sc-organize" style="margin-bottom:16px">
      <div class="spread">
        <div class="card-title">整理</div>
        <span class="tag">${totalDays} 天 · ${notes.length} 条</span>
      </div>
      ${months.length
        ? months.map((mo, idx) => {
            const list = byMonth[mo];
            const days = new Set(list.map((n) => (n.created_at || "").slice(0, 10))).size;
            return `<details class="sc-org-group" ${idx === 0 ? "open" : ""}>
              <summary>
                <b>${mo.replace("-", " 年 ")} 月</b>
                <span>${list.length} 条 · ${days} 天</span>
                <em>展开 / 收起</em>
              </summary>
              <div class="sc-org-list">
                ${list.slice(0, 6).map((n) => `<div class="sc-org-item">
                  <span class="sc-org-date">${esc((n.created_at || "").slice(5, 10))}</span>
                  <span class="sc-org-text">${esc((n.content || "").slice(0, 60))}</span>
                  ${n.task_id ? `<em class="ok">已转任务</em>` : ""}
                </div>`).join("")}
                ${list.length > 6 ? `<div class="muted" style="font-size:11px;padding:4px 0">还有 ${list.length - 6} 条更早的记录…</div>` : ""}
              </div>
            </details>`;
          }).join("")
        : `<div class="muted" style="margin-top:10px">还没有记录可以整理，先写一条随记吧。</div>`}
    </div>

    <div class="grid grid-2">
      ${notes.length ? notes.map((n) => `
        <div class="card">
          <div style="font-size:13px;white-space:pre-wrap">${esc(n.content)}</div>
          <div class="row" style="margin-top:8px">
            <span class="muted" style="font-size:11px">${esc(n.created_at.slice(0, 10))}</span>
            ${n.task_id ? `<span class="tag tag-green">已转任务</span>` : ""}
          </div>
          ${n.task_id ? "" : `<button class="btn btn-ghost btn-sm" style="margin-top:8px" data-act="note-task" data-id="${n.id}">转为任务</button>`}
        </div>`).join("") : `<div class="card"><div class="muted">还没有记录。想法、心得、日记都可以先扔进来。</div></div>`}
    </div>`;

  body.querySelector('[data-act="save-note"]').addEventListener("click", async () => {
    const content = body.querySelector("#noteText").value.trim();
    if (!content) return toast("写点什么");
    await api.post("/self/control/notes", { content });
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


/* ----------------------------- 成就 ----------------------------- */

/* ---------------- 成就：徽章图案与皮肤预览 ---------------- */

// 徽章图标：Phosphor Icons Fill（MIT），本地内嵌，无外链依赖
const BADGE_IMAGES = {
  rocket: "xiangsufeng_huojian",
  flame: "xiangsufeng_dangao",
  book: "xiangsufeng_shuji",
  arrow: "xiangsufeng_xunzhang",
  target: "xiangsufeng_shouyinji",
  moon: "xiangsufeng_xiangji",
  box: "xiangsufeng_xinfeng",
  sun: "xiangsufeng_laba",
  diamond: "xiangsufeng_dingwei",
  cap: "xiangsufeng_dayinji",
  star: "xiangsufeng_xianhua",
  trophy: "xiangsufeng_liwu",
  calendar: "xiangsufeng_wenjianjia",
  crown: "xiangsufeng_yiwanmian",
};

function badgeImg(icon, cls = "") {
  const file = BADGE_IMAGES[icon] || "xiangsufeng_xunzhang";
  return `<img class="badge-img ${cls}" src="/static/img/badges/${file}.png" alt="" draggable="false">`;
}


function badgeMedal(icon) {
  return `<span class="sc-badge-medal i-${esc(icon)}">${badgeImg(icon, "sc-badge-img")}</span>`;
}

function skinPreview(code) {
  const extra = code === "pink" ? '<span class="sp-deco heart">♥</span>' : "";
  return `<div class="sc-skin-preview p-${esc(code)}">
    <div class="sp-bar"><i></i><i></i><i></i></div>
    <div class="sp-body">
      <div class="sp-card"><b></b><em></em><u></u></div>
      <div class="sp-side"><s></s><s></s><s></s></div>
    </div>
    ${extra}
  </div>`;
}

async function drawAchievements(root, body) {
  const [a, shop] = await Promise.all([api.get("/self/control/achievements"), api.get("/self/control/shop")]);
  state.badges = a;
  state.shop = shop;
  const breakdown = a.xp_breakdown || [];
  const xpNote = breakdown.length
    ? `<div class="card" style="margin-bottom:16px">
      <div class="spread"><div class="card-title">积分构成 · 全站联动</div><span class="muted" style="font-size:12px">点击卡片查看每笔积分的获得时间</span></div>
      <div class="grid grid-4" style="margin-top:12px">
        ${breakdown.map((s) => `
          <div class="sc-xp-item" data-act="xp-log" data-group="${esc(s.group)}" role="button" tabindex="0" title="查看${esc(s.label)}的明细">
            <div class="spread"><strong style="font-size:13px">${esc(s.label)}</strong><b style="font-size:15px;${s.xp < 0 ? "color:var(--danger)" : ""}">${s.xp >= 0 ? "+" : ""}${s.xp}</b></div>
            <div class="muted" style="font-size:11px;margin-top:4px">${s.count} 次记录 · <span class="sc-xp-more">明细 ›</span></div>
          </div>`).join("")}
      </div>
      <div class="muted" style="margin-top:10px;font-size:11px">获得：任务完成 +2（日上限 20）· 图书馆签到 +10 · 每日复盘 +5 · 专注完成 +2（>20 分钟，日上限 10）。扣除：任务逾期 -10 · 预约超时未签到 -50 · 兑换扣积分。修改复盘不重复加积分。</div>
    </div>` : "";

  body.innerHTML = `
    <div class="grid grid-3" style="margin-bottom:16px">
      <div class="stat"><div class="stat-num">Lv.${a.level}</div><div class="stat-label">累计 ${a.xp} 积分 · 距下一级 ${100 - a.level_progress}</div></div>
      <div class="stat"><div class="stat-num">${a.streak}<span class="unit">天</span></div><div class="stat-label">连续有效日</div></div>
      <div class="stat"><div class="stat-num">${shop.balance}</div><div class="stat-label">可用积分（兑换只扣这里）</div></div>
    </div>

    ${xpNote}

    <div class="card sc-badge-card">
      <button type="button" class="sc-badge-head" data-act="toggle-badges" aria-expanded="${state.badgeOpen ? "true" : "false"}">
        <span class="sc-badge-head-medal"><img class="sc-badge-head-img" src="/static/img/badges/xiangsufeng_xunzhang.png" alt=""></span>
        <span class="sc-badge-head-main"><b>徽章</b><i>已收集 ${a.badges.filter((b) => b.owned).length}/${a.badges.length} · 月度徽章每月自动刷新</i></span>
        <em>${state.badgeOpen ? "收起 ▴" : "展开 ▾"}</em>
      </button>
      ${state.badgeOpen
        ? `<div class="sc-badge-wall">
            ${[
              { key: "owned", label: "已获得", items: a.badges.filter((b) => b.owned) },
              { key: "ready", label: "可兑换", items: a.badges.filter((b) => !b.owned && b.progress.met) },
              { key: "todo", label: "未达成", items: a.badges.filter((b) => !b.owned && !b.progress.met) },
            ].filter((g) => g.items.length).map((g) => `<div class="sc-bw-group">
              <div class="sc-bw-head"><b>${g.label}</b><span>${g.items.length}</span></div>
              <div class="sc-bw-grid">
                ${g.items.map((b) => `<button type="button" class="sc-mb ${b.owned ? "owned" : ""} ${b.progress.met && !b.owned ? "ready" : ""}" data-act="badge-detail" data-code="${esc(b.code)}" title="${esc(b.condition)}">
                  <span class="sc-mb-hex i-${esc(b.icon)}">
                    ${badgeImg(b.icon, "sc-mb-img")}
                    ${b.owned ? '<i class="sc-mb-mark ok">✓</i>' : ""}
                  </span>
                  <span class="sc-mb-name">${esc(b.name)}</span>
                  <span class="sc-mb-prog">${b.owned ? "已拥有" : `${b.progress.cur}/${b.progress.target}`}</span>
                </button>`).join("")}
              </div>
            </div>`).join("")}
          </div>`
        : `<div class="sc-badge-strip">
            ${a.badges.filter((b) => b.owned).slice(0, 8).map((b) => `<span class="sc-bs-item i-${esc(b.icon)}" title="${esc(b.name)}">${badgeImg(b.icon, "sc-bs-img")}</span>`).join("") || '<span class="muted" style="font-size:12px">还没有徽章，去完成今日任务或专注一次吧</span>'}
            <span class="muted" style="font-size:11px;margin-left:auto">点击上方展开全部徽章</span>
          </div>`}
    </div>

    <div class="card" style="margin-top:16px">
      <div class="spread"><div class="card-title">皮肤商店</div><span class="muted" style="font-size:12px">可用 ${shop.balance} 积分</span></div>
      <div class="grid grid-2" style="margin-top:12px">
        ${shop.themes.map((t) => `
          <div class="sc-skin-card">
            ${skinPreview(t.code)}
            <div class="spread" style="margin-top:8px"><strong style="font-size:13px">${esc(t.name)}</strong><span class="muted" style="font-size:11px">${t.price ? t.price + " 积分" : "免费"}</span></div>
            <div class="muted" style="font-size:11px;margin-top:2px">${esc(t.desc)}</div>
            <div style="margin-top:8px">
              ${t.unlocked
                ? `<button class="btn btn-ghost btn-sm" data-act="apply-theme" data-code="${t.code}">使用</button>`
                : `<button class="btn btn-primary btn-sm" data-act="redeem" data-code="${t.code}">兑换并使用</button>`}
            </div>
          </div>`).join("")}
      </div>
      <div class="muted" style="margin-top:10px;font-size:11px">获得：任务完成 +2（日上限 20）· 图书馆签到 +10（每天最多一次）· 每日复盘 +5 · 专注完成 +2（>20 分钟，日上限 10），每日总上限 100 积分。没有充值入口。</div>
    </div>`;

  const apply = (code) => {
    applyTheme(code);
    api.post("/self/control/shop/apply", { code }).catch(() => {});
  };
  body.querySelectorAll('[data-act="toggle-badges"]').forEach((el) =>
    el.addEventListener("click", async () => {
      state.badgeOpen = !state.badgeOpen;
      await draw(root);
    })
  );
  body.querySelectorAll('[data-act="badge-detail"]').forEach((el) =>
    el.addEventListener("click", () => {
      const b = ((state.badges && state.badges.badges) || []).find((x) => x.code === el.dataset.code);
      if (b) showBadgeDetail(root, b);
    })
  );
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
        if (!String(el.dataset.code).startsWith("badge_")) apply(el.dataset.code);
        toast(`兑换成功，余额 ${r.balance}`, "success");
        await draw(root);
      } catch (e) {
        toast(e.message || "兑换失败");
      }
    })
  );
  body.querySelectorAll('[data-act="xp-log"]').forEach((el) =>
    el.addEventListener("click", () => {
      const label = el.querySelector("strong")?.textContent?.trim() || "";
      showXpLog(el.dataset.group, label);
    })
  );
}

function showBadgeDetail(root, b) {
  const pct = Math.min(100, Math.round((b.progress.cur / Math.max(1, b.progress.target)) * 100));
  const bal = (state.shop && state.shop.balance) || 0;
  const act = b.owned
    ? `<span class="muted">${b.kind === "monthly" ? "本月已兑换，下月自动刷新" : "已永久拥有"}</span>`
    : b.progress.met
      ? (b.affordable
          ? `<button class="btn btn-primary btn-sm" data-act="redeem-modal" data-code="${esc(b.code)}">兑换 · ${b.price} 积分</button>`
          : `<span class="muted">已达成，还差 ${b.price - bal} 积分</span>`)
      : `<span class="muted">达成条件后可用 ${b.price} 积分兑换</span>`;
  modal({
    title: `${b.name} · 徽章详情`,
    hideOk: true,
    cancelText: "关闭",
    body: `<div class="sc-bd">
      <div class="sc-bd-medal i-${esc(b.icon)} ${b.owned ? "owned" : b.progress.met ? "ready" : "unowned"}">${badgeImg(b.icon, "sc-bd-img")}</div>
      <div class="sc-bd-body">
        <div class="sc-bd-tags">
          <span class="tag tag-blue">${b.kind === "monthly" ? "月度徽章 · 每月刷新" : "成就徽章"}</span>
          <span class="tag">${esc(b.category)}</span>
          ${b.owned ? '<span class="tag tag-green">已拥有</span>' : ""}
        </div>
        <div class="sc-bd-cond">条件：${esc(b.condition)}</div>
        <div class="sc-badge-prog"><i style="width:${pct}%"></i></div>
        <div class="sc-badge-prog-text">${b.progress.cur}/${b.progress.target}${b.progress.met ? " · 已达成" : ""}</div>
        <div class="sc-bd-act">${act}</div>
      </div>
    </div>`,
  });
  const btn = document.querySelector('#modalRoot [data-act="redeem-modal"]');
  if (btn) {
    btn.addEventListener("click", async (ev) => {
      const el = ev.currentTarget;
      el.disabled = true;
      try {
        const r = await api.post("/self/control/shop/redeem", { code: el.dataset.code });
        toast(`兑换成功，余额 ${r.balance}`, "success");
        closeModal();
        await draw(root);
      } catch (e) {
        toast(e.message || "兑换失败", "error");
        el.disabled = false;
      }
    });
  }
}

async function showXpLog(group, label) {
  let data = null;
  try {
    data = await api.get(`/self/control/xp-logs?group=${encodeURIComponent(group)}&limit=80`);
  } catch (e) {
    toast(e.message || "加载积分明细失败", "error");
    return;
  }
  const logs = (data && data.logs) || [];
  const rows = logs.length
    ? logs.map((l) => {
        const dt = String(l.time || "").replace("T", " ").slice(0, 16);
        const sign = l.xp >= 0 ? "+" : "";
        return `<div class="sc-xp-log-row">
          <span class="sc-xp-log-time">${esc(dt)}</span>
          <span class="sc-xp-log-label">${esc(l.label || l.action || "")}</span>
          <b class="sc-xp-log-xp ${l.xp < 0 ? "neg" : ""}">${sign}${l.xp}</b>
        </div>`;
      }).join("")
    : `<div class="muted" style="padding:12px 0">这一类还没有积分记录。</div>`;
  modal({
    title: `${label || "积分"} · 明细（${logs.length} 条）`,
    hideOk: true,
    cancelText: "关闭",
    body: `<div class="sc-xp-logs">${rows}</div>
      <div class="muted" style="font-size:11px;margin-top:10px">时间为你实际获得/扣除该积分的时刻。</div>`,
  });
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