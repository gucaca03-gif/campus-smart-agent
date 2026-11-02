import { api } from "../api.js";
import { addDays, esc, statusBadge, today, toast } from "../ui.js";

const NEWS_IMAGES = [
  "/static/img/slide-1.jpg",
  "/static/img/slide-2.jpg",
  "/static/img/slide-5.jpg",
  "/static/img/slide-4.jpg",
  "/static/img/slide-6.jpg",
  "/static/img/slide-3.jpg",
  "/static/img/slide-8.jpg",
  "/static/img/slide-7.jpg",
];

const newsImage = (id) => NEWS_IMAGES[Number(id) % NEWS_IMAGES.length];

/* ================= 预约中心 v2 · 通用组件 ================= */

const WEEK_CN = "日一二三四五六";

function workTabs(active) {
  const items = [
    ["#/work", "预约大厅", "overview"],
    ["#/work/lab", "实验室", "lab"],
    ["#/work/classroom", "空教室", "classroom"],
    ["#/work/library", "图书馆", "library"],
  ];
  return `<div class="tabs">${items
    .map(([href, label, key]) => `<a class="tab ${active === key ? "active" : ""}" href="${href}">${label}</a>`)
    .join("")}</div>`;
}

function bookHero(title, sub, stats = []) {
  return `<div class="detail-hero book-hero">
    <div class="detail-art"><svg viewBox="0 0 200 160" fill="none">
      <rect x="34" y="26" width="104" height="112" rx="12" stroke="#8fdcff" stroke-opacity=".45" stroke-width="1.6"/>
      <rect x="34" y="26" width="104" height="26" rx="12" fill="#8fdcff" opacity=".14"/>
      <path d="M56,16 V34 M116,16 V34" stroke="#eaf7ff" stroke-opacity=".6" stroke-width="3" stroke-linecap="round"/>
      <path d="M48,68 H124 M48,84 H124 M48,100 H96" stroke="#fff" stroke-opacity=".32" stroke-width="4" stroke-linecap="round"/>
      <circle cx="156" cy="116" r="22" stroke="#f0cf94" stroke-opacity=".7" stroke-width="1.6"/>
      <path d="M156,104 V116 L164,121" stroke="#f0cf94" stroke-width="2" stroke-linecap="round"/>
      <circle cx="160" cy="30" r="1.8" fill="#dff2ff" opacity=".6"/>
      <circle cx="178" cy="52" r="1.4" fill="#dff2ff" opacity=".5"/>
    </svg></div>
    <div class="tag">BOOKING</div>
    <h1>${title}</h1>
    <p>${sub}</p>
    ${stats.length ? `<div class="bh-stats">${stats.map(([num, label]) => `<div class="bh-stat"><b>${num}</b><span>${label}</span></div>`).join("")}</div>` : ""}
  </div>`;
}

const ICO_FLASK = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3h6M10 3v5.5L4.8 18a2.4 2.4 0 0 0 2.1 3.6h10.2a2.4 2.4 0 0 0 2.1-3.6L14 8.5V3"/><path d="M7.5 15h9"/></svg>`;
const ICO_GRID = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3.5" y="3.5" width="7" height="7" rx="1.8"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.8"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.8"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.8"/></svg>`;
const ICO_BOOK = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z"/><path d="M4 20.5A2.5 2.5 0 0 1 6.5 18H20"/><path d="M9 7.5h7M9 11h5"/></svg>`;

function dateItems(days, { weekdaysOnly = false } = {}) {
  const arr = [];
  for (let i = 0; i < days; i++) {
    const d = addDays(i);
    const wd = new Date(`${d}T00:00:00`).getDay();
    arr.push({
      date: d,
      day: String(Number(d.slice(8))),
      label: i === 0 ? "今天" : i === 1 ? "明天" : `周${WEEK_CN[wd]}`,
      weekend: wd === 0 || wd === 6,
      disabled: weekdaysOnly && (wd === 0 || wd === 6),
    });
  }
  return arr;
}

function dateStripHTML(items, activeDate) {
  return `<div class="date-strip">${items
    .map(
      (d) => `<button type="button" class="ds-item ${d.date === activeDate ? "active" : ""} ${d.disabled ? "disabled" : ""} ${d.weekend ? "weekend" : ""} ${d.label === "今天" ? "today" : ""}" data-date="${d.date}" ${d.disabled ? "disabled" : ""}>
        <span class="ds-week">${d.label}</span><b class="ds-day">${d.day}</b>
      </button>`
    )
    .join("")}</div>`;
}

function wireDateStrip(root, onPick) {
  root.querySelectorAll(".ds-item:not(.disabled)").forEach((el) =>
    el.addEventListener("click", () => {
      root.querySelectorAll(".ds-item").forEach((x) => x.classList.remove("active"));
      el.classList.add("active");
      onPick(el.dataset.date);
    })
  );
}

function slotName(start) {
  const h = Number(start.slice(0, 2));
  return h < 12 ? "上午场" : h < 18 ? "下午场" : "晚间场";
}

function noticeAcc(rules) {
  return `<div class="card acc">
    <button type="button" class="acc-head"><b>预约须知</b><span class="acc-arrow">▾</span></button>
    <div class="acc-body" hidden><ul>${rules.map((r) => `<li>${r}</li>`).join("")}</ul></div>
  </div>`;
}

function wireAcc(root) {
  root.querySelectorAll(".acc-head").forEach((btn) =>
    btn.addEventListener("click", () => {
      const body = btn.nextElementSibling;
      body.hidden = !body.hidden;
      btn.classList.toggle("open", !body.hidden);
    })
  );
}

function stepperHTML(id, value, min, max) {
  return `<div class="stepper" id="${id}" data-min="${min}" data-max="${max}">
    <button type="button" class="st-btn" data-dir="-1">−</button>
    <span class="st-val">${value}</span>
    <button type="button" class="st-btn" data-dir="1">＋</button>
  </div>`;
}

function wireStepper(root, id) {
  const box = root.querySelector(`#${id}`);
  if (!box) return () => 1;
  box.querySelectorAll(".st-btn").forEach((btn) =>
    btn.addEventListener("click", () => {
      const val = Number(box.querySelector(".st-val").textContent) + Number(btn.dataset.dir);
      if (val >= Number(box.dataset.min) && val <= Number(box.dataset.max)) {
        box.querySelector(".st-val").textContent = String(val);
      }
    })
  );
  return () => Number(box.querySelector(".st-val").textContent);
}

/* ================= 预约大厅 ================= */

function tlRow(b) {
  const d = b.date || "";
  const day = String(Number(d.slice(8)));
  const label = d === today() ? "今天" : d === addDays(1) ? "明天" : `${Number(d.slice(5, 7))}月`;
  return `<div class="tl-row">
    <div class="tl-date"><b>${day}</b><span>${label}</span></div>
    <div class="tl-main">
      <div class="tl-title">${esc(b.resource_name)}</div>
      <div class="tl-meta">${esc(b.room || "—")} · ${esc(b.start_at)}–${esc(b.end_at)} · ${b.people} 人</div>
    </div>
    <div class="tl-side">${statusBadge(b.status)}</div>
  </div>`;
}

function venueCard({ href, tone, ico, title, stat, desc, rule }) {
  return `<a class="card venue-card vc-${tone}" href="${href}">
    <div class="venue-ico">${ico}</div>
    <div class="venue-body">
      <div class="venue-title">${title}<span class="venue-stat">${stat}</span></div>
      <div class="venue-desc">${desc}</div>
      <div class="venue-rule">${rule}</div>
    </div>
    <span class="venue-arrow">›</span>
  </a>`;
}

export async function render(root, ctx) {
  const [labs, classrooms, areas, bookings] = await Promise.all([
    api.get("/resources?type=lab"),
    api.get("/resources?type=classroom"),
    api.get("/library/areas"),
    api.get("/bookings/my"),
  ]);
  root.style.removeProperty("padding-bottom");
  const todayStr = today();
  const tomorrowStr = addDays(1);
  const upcoming = bookings
    .filter((b) => b.date >= todayStr && !["cancelled", "rejected", "completed", "no_show"].includes(b.status))
    .sort((a, b) => (a.date + a.start_at).localeCompare(b.date + b.start_at));
  const pending = bookings.filter((b) => b.status === "pending_approval").length;
  const seatTotal = areas.reduce((s, a) => s + a.total, 0);
  const seatAvail = areas.reduce((s, a) => s + a.available, 0);

  root.innerHTML = `
    ${workTabs("overview")}
    ${bookHero("预约中心", "实验室、空教室与图书馆座位统一预约，规则透明、状态实时。", [
      [labs.length, "间实验室"],
      [classrooms.length, "间教室"],
      [`${seatAvail}<i>/${seatTotal}</i>`, "今日图书馆可约"],
    ])}

    <div class="section-title">我的近期预约${pending ? ` <span class="tag tag-gold">${pending} 条待审批</span>` : ""}</div>
    <div class="card bk-list">
      ${upcoming.length ? upcoming.slice(0, 5).map(tlRow).join("") : '<div class="bk-empty"><b>近期暂无预约</b><span>从下方三类场景开始，选择日期与时段即可提交。</span></div>'}
      ${upcoming.length ? '<div class="bk-more"><a href="#/me">全部预约记录 ›</a></div>' : ""}
    </div>

    <div class="section-title">按场景预约</div>
    <div class="venue-grid">
      ${venueCard({
        href: "#/work/lab", tone: "blue", ico: ICO_FLASK, title: "实验室预约",
        stat: `${labs.length} 间`,
        desc: "设备清单、面向学院一目了然，选择日期与时段提交。",
        rule: "工作日 08:00–17:10 开放 · 提交后需管理员审批",
      })}
      ${venueCard({
        href: "#/work/classroom", tone: "gold", ico: ICO_GRID, title: "空教室预约",
        stat: `${classrooms.length} 间`,
        desc: "教室 × 节次占用矩阵一图看清，点击空白格子即可预约。",
        rule: "工作日晚间 18:30–20:40 · 周末全天可借",
      })}
      ${venueCard({
        href: "#/work/library", tone: "green", ico: ICO_BOOK, title: "图书馆选座",
        stat: `${seatAvail} 座可约`,
        desc: "按阅览室查看余量，进入平面图挑选靠窗、带电源的座位。",
        rule: "08:00–22:00 开放 · 预约后 15 分钟内签到",
      })}
    </div>

    ${noticeAcc([
      "开放规则：实验室仅工作日开放；空教室工作日提供晚间时段、周末全天；图书馆按开馆时间开放。",
      "审批规则：实验室与教室预约提交后进入待审批状态，管理员通过后生效；图书馆选座即时确认。",
      "签到规则：请在预约开始后 15 分钟内完成签到，超时未签到将自动释放名额。",
      "违约规则：如无法按时使用请提前取消，累计 3 次超时未签到将限制预约 7 天。",
    ])}`;
  wireAcc(root);
}

/* ================= 实验室 · 列表 ================= */

function labRow(r) {
  return `<div class="lab-row" data-book="${r.id}" role="button" tabindex="0">
    <div class="lab-ico">${ICO_FLASK}</div>
    <div class="lab-main">
      <div class="lab-name">${esc(r.name)}${r.is_demo ? '<span class="tag">演示数据</span>' : '<span class="tag tag-green">已核验</span>'}</div>
      <div class="lab-meta">${esc(r.place || "")} ${esc(r.room || "")} · 容量 ${r.capacity} 人</div>
      <div class="lab-tags">
        ${r.equipment ? `<span class="tag">${esc(r.equipment)}</span>` : ""}
        <span class="tag tag-blue">${esc(r.audience)}</span>
        ${r.approval_required ? '<span class="tag tag-gold">需审批</span>' : '<span class="tag tag-green">即时确认</span>'}
      </div>
    </div>
    <span class="lab-go">›</span>
  </div>`;
}

export async function renderLab(root, ctx) {
  const rows = await api.get("/resources?type=lab");
  root.style.removeProperty("padding-bottom");
  root.innerHTML = `${workTabs("lab")}
    ${bookHero("实验室预约", "实验室仅工作日开放，提交后需管理员审批。地点、设备与面向学院以实验室管理处数据为准。", [
      [rows.length, "间实验室"],
      ["08:00–17:10", "工作日开放"],
      ["需审批", "提交后管理员确认"],
    ])}
    <div class="toolbar"><input class="input search-input" id="labSearch" placeholder="搜索实验室名称或设备…">
      <span class="tag tag-warn">演示数据：实验室名称与设备待校方核验</span></div>
    <div id="labList" class="card bk-list">${rows.map(labRow).join("")}</div>
    ${noticeAcc([
      "实验室仅工作日 08:00–17:10 开放，周末与法定节假日不开放。",
      "进入实验室须遵守安全规程，部分设备需持证操作。",
      "预约提交后需管理员审批，审批结果将在消息中心通知。",
    ])}`;

  const list = root.querySelector("#labList");
  function bind() {
    list.querySelectorAll("[data-book]").forEach((el) => {
      el.addEventListener("click", () => {
        location.hash = `#/work/lab/book?id=${el.getAttribute("data-book")}`;
      });
      el.addEventListener("keydown", (e) => {
        if (e.key === "Enter") location.hash = `#/work/lab/book?id=${el.getAttribute("data-book")}`;
      });
    });
  }
  bind();
  wireAcc(root);
  root.querySelector("#labSearch").addEventListener("input", (e) => {
    const q = e.target.value.trim();
    const filtered = rows.filter((r) => r.name.includes(q) || (r.description || "").includes(q));
    list.innerHTML = filtered.length ? filtered.map(labRow).join("") : '<div class="bk-empty"><b>没有匹配的实验室</b><span>换个关键词试试</span></div>';
    bind();
  });
}

/* ================= 实验室 · 预约页（博物馆式） ================= */

function slotCard(s, capacity) {
  const closed = s.status === "closed";
  const occupied = s.status === "occupied";
  const full = !closed && !occupied && s.remaining <= 0;
  const open = !closed && !occupied && !full;
  const cls = closed ? "closed" : occupied ? "occupied" : full ? "full" : "open";
  const state = closed ? "不开放" : occupied ? "已占用" : full ? "已约满" : "可预约";
  const used = Math.max(0, capacity - s.remaining);
  const foot = open
    ? `剩余 <b>${s.remaining}</b> 个名额${used > 0 ? ` · 已约 ${used}` : " · 当前无人预约"}`
    : closed
      ? "该时段不开放，请选择其他日期"
      : occupied
        ? "已被教学安排占用"
        : "名额已满，可尝试其他时段";
  return `<div class="slot-card ${cls}" ${open ? `data-start="${s.start_at}" data-end="${s.end_at}" role="button" tabindex="0"` : ""}>
    <span class="sc-rail"></span>
    <div class="sc-inner">
      <div class="sc-top"><span class="sc-name">${slotName(s.start_at)}</span><span class="sc-state"><i></i>${state}</span></div>
      <div class="sc-time">${esc(s.start_at)}<i>–</i>${esc(s.end_at)}</div>
      <div class="sc-foot">${foot}</div>
    </div>
  </div>`;
}

export async function renderLabBook(root, ctx) {
  const id = ctx.params.get("id");
  if (!id) {
    location.hash = "#/work/lab";
    return;
  }
  let resource;
  try {
    resource = await api.get(`/resources/${id}`);
  } catch (e) {
    root.innerHTML = `<div class="empty" style="margin-top:40px"><strong>实验室不存在或已下线</strong>
      <div style="margin-top:10px"><a class="btn btn-ghost btn-sm" href="#/work/lab">‹ 返回实验室列表</a></div></div>`;
    return;
  }
  if (resource.type !== "lab") {
    location.hash = "#/work/lab";
    return;
  }

  const dates = dateItems(14, { weekdaysOnly: true });
  const firstOk = dates.find((d) => !d.disabled);
  let curDate = firstOk ? firstOk.date : today();
  let picked = null;

  root.innerHTML = `
    ${workTabs("lab")}
    <div class="page-head">
      <div><div class="page-title">${esc(resource.name)}</div>
      <div class="page-sub">${esc(resource.place || "")} ${esc(resource.room || "")} · 容量 ${resource.capacity} 人 · ${resource.approval_required ? "提交后需管理员审批" : "提交后即时确认"}</div></div>
      <a class="btn btn-ghost btn-sm" href="#/work/lab">‹ 返回列表</a>
    </div>

    <div class="card bk-venue">
      <div class="bv-ico">${ICO_FLASK}</div>
      <div class="bv-main">
        <div class="bv-name">${esc(resource.name)}</div>
        <div class="bv-meta">${esc(resource.description || "")}${resource.data_note ? `<br>${esc(resource.data_note)}` : ""}</div>
        <div class="bv-tags">
          ${resource.equipment ? `<span class="tag">${esc(resource.equipment)}</span>` : ""}
          <span class="tag tag-blue">面向：${esc(resource.audience)}</span>
          ${resource.approval_required ? '<span class="tag tag-gold">需审批</span>' : '<span class="tag tag-green">即时确认</span>'}
        </div>
      </div>
    </div>

    <div class="section-title">选择日期 <span class="title-hint">实验室仅工作日开放，可提前 ${resource.advance_days} 天</span></div>
    ${dateStripHTML(dates, curDate)}

    <div class="section-title">选择时段 <span class="title-hint">点击时段卡片选中</span></div>
    <div id="slotCards" class="slot-cards"><div class="muted" style="padding:18px 4px">加载中…</div></div>

    <div class="section-title">预约信息</div>
    <div class="card bk-form">
      <div class="bf-row"><span class="bf-label">人数</span>${stepperHTML("bkPeople", Math.min(4, resource.capacity), 1, resource.capacity)}</div>
      <div class="bf-row"><span class="bf-label">用途</span><input class="input" id="bkPurpose" placeholder="例如：课程实验 / 小组讨论 / 竞赛备赛"></div>
    </div>

    ${noticeAcc([
      `开放时间：工作日 08:00–17:10，可提前 ${resource.advance_days} 天预约。`,
      `审批规则：${resource.approval_required ? "提交后进入待审批状态，管理员通过后生效。" : "提交后即时确认，直接占用该时段。"}`,
      "签到规则：请在预约开始后 15 分钟内签到，超时自动释放。",
      "取消规则：如无法按时使用请提前取消，累计 3 次违约将限制预约 7 天。",
    ])}

    <div class="bk-bar" id="bkBar">
      <div class="bkb-info" id="bkbInfo">请选择日期与时段</div>
      <button class="btn btn-primary bkb-btn" id="bkbSubmit" disabled>提交预约</button>
    </div>`;

  root.style.paddingBottom = "110px";
  wireAcc(root);
  const getPeople = wireStepper(root, "bkPeople");
  const slotBox = root.querySelector("#slotCards");
  const info = root.querySelector("#bkbInfo");
  const submit = root.querySelector("#bkbSubmit");

  function updateBar() {
    if (picked) {
      info.innerHTML = `<b>${curDate}</b> ${picked.start}–${picked.end}<span class="bkb-sub">${esc(resource.name)} · ${getPeople()} 人</span>`;
      submit.disabled = false;
    } else {
      info.textContent = "请选择日期与时段";
      submit.disabled = true;
    }
  }

  async function loadSlots() {
    picked = null;
    updateBar();
    slotBox.innerHTML = '<div class="muted" style="padding:18px 4px">加载中…</div>';
    try {
      const slots = await api.get(`/resources/${id}/slots?date=${curDate}`);
      if (!slots.length) {
        slotBox.innerHTML = '<div class="card bk-empty"><b>当日无可约时段</b><span>该日期不开放或时段已全部结束，请换一个日期。</span></div>';
        return;
      }
      slotBox.innerHTML = slots.map((s) => slotCard(s, resource.capacity)).join("");
      slotBox.querySelectorAll(".slot-card.open").forEach((el) => {
        el.addEventListener("click", () => {
          slotBox.querySelectorAll(".slot-card").forEach((x) => x.classList.remove("picked"));
          el.classList.add("picked");
          picked = { start: el.dataset.start, end: el.dataset.end };
          updateBar();
        });
      });
    } catch (e) {
      slotBox.innerHTML = `<div class="card bk-empty"><b>时段加载失败</b><span>${esc(e.message)}</span></div>`;
    }
  }

  wireDateStrip(root, (d) => {
    curDate = d;
    loadSlots();
  });
  submit.addEventListener("click", async () => {
    if (!picked) return;
    submit.disabled = true;
    submit.textContent = "提交中…";
    try {
      const result = await api.post("/bookings", {
        resource_id: Number(id),
        date: curDate,
        start_at: picked.start,
        end_at: picked.end,
        people: getPeople(),
        purpose: root.querySelector("#bkPurpose").value || "个人使用",
      });
      toast(result.status === "pending_approval" ? "已提交审批，等待管理员处理" : "预约成功", "success");
      setTimeout(() => (location.hash = "#/work"), 700);
    } catch (e) {
      toast(e.message, "error");
      submit.disabled = false;
      submit.textContent = "提交预约";
    }
  });
  await loadSlots();
}

/* ================= 空教室 · 矩阵 ================= */

export async function renderClassroom(root, ctx) {
  const dates = dateItems(14);
  let curDate = today();
  let selected = null;

  root.innerHTML = `${workTabs("classroom")}
    ${bookHero("空教室预约", "教室 × 节次占用矩阵：白色可约，灰色为排课占用或不开放。点击空白格子即可提交预约。", [
      ["晚间 18:30", "工作日可借"],
      ["全天", "周末可借"],
      ["需审批", "提交后管理员确认"],
    ])}

    <div class="section-title">选择日期 <span class="title-hint">可提前 7 天</span></div>
    ${dateStripHTML(dates, curDate)}

    <div class="card legend-card">
      <div class="legend">
        <span><i class="cell-legend cell-free"></i>可约</span>
        <span><i class="cell-legend cell-course"></i>排课占用</span>
        <span><i class="cell-legend cell-booked"></i>已约</span>
        <span><i class="cell-legend cell-closed"></i>不开放</span>
      </div>
      <span class="muted small">提示：点击白色格子选择教室与节次，在底部确认条提交。</span>
    </div>

    <div id="gridBox"><div class="muted" style="padding:18px 4px">加载中…</div></div>

    ${noticeAcc([
      "工作日仅开放晚间时段（18:30–20:40），周末全天可借。",
      "教室借用以不影响教学为前提，排课优先；临时调课可能导致已约教室变更，以教务通知为准。",
      "提交后需管理员审批，使用完毕请恢复桌椅并带走垃圾。",
    ])}

    <div class="bk-bar" id="gridBar" hidden>
      <div class="bkb-info" id="gridBarInfo"></div>
      <input class="input bkb-input" id="gridPurpose" placeholder="用途（如：小组讨论）">
      <button class="btn btn-primary bkb-btn" id="gridSubmit">提交预约</button>
    </div>`;

  root.style.paddingBottom = "110px";
  wireAcc(root);
  const box = root.querySelector("#gridBox");
  const bar = root.querySelector("#gridBar");

  async function loadGrid() {
    box.innerHTML = '<div class="muted" style="padding:18px 4px">加载中…</div>';
    bar.hidden = true;
    selected = null;
    try {
      const data = await api.get(`/classrooms/grid?date=${curDate}`);
      box.innerHTML = `
        <div class="card" style="padding:0;overflow:auto">
          <table class="grid-table">
            <thead><tr><th class="gt-room-col">教室 · ${esc(data.date)} ${esc(data.weekday)}</th>
              ${data.periods.map((p) => `<th>${esc(p.label)}<div class="gt-time">${p.start}–${p.end}</div></th>`).join("")}</tr></thead>
            <tbody>
              ${data.rooms
                .map(
                  (r) => `<tr>
                    <td class="gt-room"><strong>${esc(r.room)}</strong><div class="gt-meta">${r.capacity} 座 · ${esc(r.equipment || "")}</div></td>
                    ${r.cells
                      .map(
                        (c) => `<td class="gt-cell cell-${c.status}" ${c.status === "free" ? `data-room="${r.id}" data-rname="${esc(r.room)}" data-start="${c.start}" data-end="${c.end}" data-period="${esc(c.period)}"` : ""} title="${esc(r.room)} ${esc(c.period)}：${esc(c.text)}">${c.status === "mine" ? "我约的" : c.text}</td>`
                      )
                      .join("")}
                  </tr>`
                )
                .join("")}
            </tbody>
          </table>
        </div>`;
      box.querySelectorAll(".cell-free").forEach((el) => {
        el.addEventListener("click", () => {
          box.querySelectorAll(".cell-free").forEach((x) => x.classList.remove("cell-picked"));
          el.classList.add("cell-picked");
          selected = {
            roomId: el.dataset.room,
            name: el.dataset.rname,
            start: el.dataset.start,
            end: el.dataset.end,
            period: el.dataset.period,
          };
          root.querySelector("#gridBarInfo").innerHTML = `已选：<b>${esc(selected.name)}</b> · ${esc(selected.period)}<span class="bkb-sub">${esc(curDate)} ${selected.start}–${selected.end} · 提交后需审批</span>`;
          bar.hidden = false;
        });
      });
    } catch (e) {
      box.innerHTML = `<div class="card bk-empty"><b>矩阵加载失败</b><span>${esc(e.message)}</span></div>`;
    }
  }

  wireDateStrip(root, (d) => {
    curDate = d;
    loadGrid();
  });
  root.querySelector("#gridSubmit").addEventListener("click", async () => {
    if (!selected) return;
    const btn = root.querySelector("#gridSubmit");
    btn.disabled = true;
    btn.textContent = "提交中…";
    try {
      const result = await api.post("/bookings", {
        resource_id: Number(selected.roomId),
        date: curDate,
        start_at: selected.start,
        end_at: selected.end,
        people: 4,
        purpose: root.querySelector("#gridPurpose").value || "小组学习",
      });
      toast(result.status === "pending_approval" ? "已提交审批，等待管理员处理" : "预约成功", "success");
      await loadGrid();
    } catch (e) {
      toast(e.message, "error");
    } finally {
      btn.disabled = false;
      btn.textContent = "提交预约";
    }
  });
  await loadGrid();
}

/* ================= 图书馆 · 阅览室列表 ================= */

const LIB_SLOTS = [
  ["08:00", "10:00"],
  ["10:00", "12:00"],
  ["12:00", "14:00"],
  ["14:00", "16:00"],
  ["16:00", "18:00"],
  ["18:00", "20:00"],
  ["20:00", "22:00"],
];

export async function renderLibrary(root, ctx) {
  const dates = dateItems(3);
  let curDate = today();
  let curSlot = LIB_SLOTS[0];

  root.innerHTML = `${workTabs("library")}
    ${bookHero("图书馆选座", "按日期与时段查看各阅览室余量，进入平面图挑选座位。预约成功后 15 分钟内签到。", [
      ["6 个", "阅览室"],
      ["08:00–22:00", "开馆时间"],
      ["2 小时", "可提前预约"],
    ])}

    <div class="section-title">选择日期 <span class="title-hint">可提前 2 天预订</span></div>
    ${dateStripHTML(dates, curDate)}

    <div class="section-title">选择时段 <span class="title-hint">每段 2 小时</span></div>
    <div class="pill-strip" id="libSlots">
      ${LIB_SLOTS.map((s, i) => `<button type="button" class="pill ${i === 0 ? "active" : ""}" data-slot="${s[0]}-${s[1]}">${s[0]}–${s[1]}</button>`).join("")}
    </div>

    <div class="section-title">选择阅览室</div>
    <div id="roomList" class="card bk-list"><div class="muted" style="padding:18px 4px">加载中…</div></div>

    ${noticeAcc([
      "图书馆 08:00–22:00 开放，开馆前可提前 2 小时预订当日座位。",
      "预约成功后请在 15 分钟内签到（我的 → 预约记录 → 签到），超时自动释放座位。",
      "暂离请使用「暂时离开」功能，累计 60 分钟未回将释放座位；请保持安静并随身携带贵重物品。",
    ])}`;

  root.style.removeProperty("padding-bottom");
  wireAcc(root);
  const list = root.querySelector("#roomList");

  async function loadRooms() {
    const [start, end] = curSlot;
    list.innerHTML = '<div class="muted" style="padding:18px 4px">加载中…</div>';
    try {
      const areas = await api.get(`/library/areas?date=${curDate}&start=${start}&end=${end}`);
      list.innerHTML = areas
        .map((a) => {
          const tight = a.available / a.total < 0.2;
          const href = `#/work/library/room?area=${encodeURIComponent(a.name)}&date=${curDate}&start=${start}&end=${end}`;
          return `<a class="lib-row" href="${href}">
            <div class="lab-ico lib-ico">${ICO_BOOK}</div>
            <div class="lab-main">
              <div class="lab-name">${esc(a.name)}${tight ? '<span class="tag tag-tight">位置紧张</span>' : ""}</div>
              <div class="lab-meta">${a.open_start}–${a.open_end} 开放 · ${curDate} ${start}–${end} · 预约后 15 分钟内签到</div>
            </div>
            <div class="lib-avail ${tight ? "tight" : ""}"><b>${a.available}</b><span>/ ${a.total} 座</span></div>
            <span class="lab-go">›</span>
          </a>`;
        })
        .join("");
    } catch (e) {
      list.innerHTML = `<div class="bk-empty"><b>阅览室加载失败</b><span>${esc(e.message)}</span></div>`;
    }
  }

  wireDateStrip(root, (d) => {
    curDate = d;
    loadRooms();
  });
  root.querySelectorAll("#libSlots .pill").forEach((el) =>
    el.addEventListener("click", () => {
      root.querySelectorAll("#libSlots .pill").forEach((x) => x.classList.remove("active"));
      el.classList.add("active");
      curSlot = el.dataset.slot.split("-");
      loadRooms();
    })
  );
  await loadRooms();
}

/* ================= 图书馆 · SVG 平面图 ================= */

function seatMapSvg(area) {
  const seats = area.seats || [];
  if (!seats.length) return "";
  const OX = 1.9;
  const OY = 1.5;
  const PAD_R = 2.6;
  const PAD_B = 1.7;
  const maxX = Math.max(...seats.map((s) => Number(s.x)));
  const maxY = Math.max(...seats.map((s) => Number(s.y)));
  const W = maxX + OX + PAD_R;
  const H = maxY + OY + PAD_B;
  const X = (s) => Number(s.x) + OX;
  const Y = (s) => Number(s.y) + OY;
  const showNo = maxY <= 17;

  const rowsMap = new Map();
  seats.forEach((s) => {
    const k = String(s.y);
    if (!rowsMap.has(k)) rowsMap.set(k, []);
    rowsMap.get(k).push(s);
  });

  let desks = "";
  rowsMap.forEach((list) => {
    const sorted = [...list].sort((a, b) => Number(a.x) - Number(b.x));
    let start = 0;
    for (let i = 1; i <= sorted.length; i += 1) {
      const broken = i === sorted.length || Number(sorted[i].x) - Number(sorted[i - 1].x) > 1.01;
      if (!broken) continue;
      const group = sorted.slice(start, i);
      const x0 = X(group[0]);
      const w = X(group[group.length - 1]) - x0 + 1;
      desks += `<rect class="sm-desk" x="${(x0 + 0.06).toFixed(2)}" y="${(Y(group[0]) + 0.9).toFixed(2)}" width="${(w - 0.12).toFixed(2)}" height="0.26" rx="0.07"/>`;
      start = i;
    }
  });

  const chairs = seats
    .map((s) => {
      const x = X(s);
      const y = Y(s);
      const busy = !!s.busy;
      const win = String(s.description || "").includes("靠窗");
      const power = s.equipment === "电源";
      const no = String(s.name || "").split("-").pop();
      const kind = [win ? "靠窗" : "", power ? "电源位" : ""].filter(Boolean).join(" · ") || "普通座位";
      return `<g class="sm-seat ${busy ? "busy" : "free"}" data-seat="${s.id}" data-name="${esc(s.name)}" data-kind="${kind}" tabindex="${busy ? -1 : 0}" role="${busy ? "img" : "button"}" aria-label="${esc(s.name)} ${busy ? "已占用" : "可选 " + kind}">
        <rect class="sm-chair" x="${(x + 0.11).toFixed(2)}" y="${(y + 0.10).toFixed(2)}" width="0.78" height="0.56" rx="0.14"/>
        ${showNo ? `<text class="sm-no" x="${(x + 0.5).toFixed(2)}" y="${(y + 0.45).toFixed(2)}">${esc(no)}</text>` : ""}
        ${win ? `<path class="sm-badge sm-win" d="M${(x + 0.14).toFixed(2)} ${(y + 0.36).toFixed(2)} h0.30 v0.22 h-0.30 z"/>` : ""}
        ${power ? `<path class="sm-badge sm-power" d="M${(x + 0.65).toFixed(2)} ${(y + 0.32).toFixed(2)} l-0.11 0.16 h0.07 l-0.05 0.16 0.13 -0.19 h-0.07 z"/>` : ""}
      </g>`;
    })
    .join("");

  let windows = "";
  for (let i = 0; i * 1.35 < maxY + 0.8; i += 1) {
    const y0 = OY + 0.5 + i * 1.35;
    windows += `<path class="sm-window" d="M0.34 ${y0.toFixed(2)} v0.78 M0.56 ${y0.toFixed(2)} v0.78 M0.34 ${y0.toFixed(2)} h0.22 M0.34 ${(y0 + 0.78).toFixed(2)} h0.22"/>`;
  }

  const shelfY = 2.4;
  const shelfH = Math.max(3.2, maxY - 1.2);
  const serviceX = W - 0.42 - 1.35;
  const doorX = OX + maxX / 2 - 0.4;

  return `<svg class="seatmap" viewBox="0 0 ${W.toFixed(2)} ${H.toFixed(2)}" role="img" aria-label="${esc(area.name)} 座位平面示意图">
    <rect class="sm-floor" x="0.42" y="0.42" width="${(W - 0.84).toFixed(2)}" height="${(H - 0.84).toFixed(2)}" rx="0.32"/>
    <text class="sm-zone" x="${(OX + 2.6).toFixed(2)}" y="${(OY - 0.34).toFixed(2)}">A 区 · 临窗</text>
    <text class="sm-zone" x="${(OX + 10.6).toFixed(2)}" y="${(OY - 0.34).toFixed(2)}">B 区</text>
    ${windows}
    <g class="sm-shelf">
      <rect x="${(W - 1.78).toFixed(2)}" y="${shelfY.toFixed(2)}" width="0.86" height="${shelfH.toFixed(2)}" rx="0.1"/>
      <text x="${(W - 1.35).toFixed(2)}" y="${(shelfY + shelfH / 2).toFixed(2)}" transform="rotate(90 ${(W - 1.35).toFixed(2)} ${(shelfY + shelfH / 2).toFixed(2)})">书 架</text>
    </g>
    <g class="sm-service">
      <rect x="${serviceX.toFixed(2)}" y="0.78" width="1.35" height="0.92" rx="0.14"/>
      <text x="${(serviceX + 0.675).toFixed(2)}" y="1.32">服务台</text>
    </g>
    <path class="sm-door" d="M${doorX.toFixed(2)} ${(H - 0.42).toFixed(2)} h1.25"/>
    <path class="sm-door-arc" d="M${(doorX + 1.25).toFixed(2)} ${(H - 0.42).toFixed(2)} a1.25 1.25 0 0 0 -1.25 -1.25"/>
    <text class="sm-door-txt" x="${(doorX + 0.62).toFixed(2)}" y="${(H - 0.02).toFixed(2)}">入口</text>
    ${desks}
    ${chairs}
  </svg>`;
}

/* ================= 图书馆 · 选座 ================= */

export async function renderLibraryRoom(root, ctx) {
  const area = ctx.params.get("area") || "";
  const date0 = ctx.params.get("date") || today();
  const start0 = ctx.params.get("start") || "08:00";
  const end0 = ctx.params.get("end") || "10:00";
  let selectedSeat = null;

  root.innerHTML = `${workTabs("library")}
    <div class="page-head">
      <div>
        <div class="page-title">${esc(area)}</div>
        <div class="page-sub">点击可选座位完成选择，确认后请在 15 分钟内刷卡签到</div>
      </div>
      <a class="btn btn-ghost btn-sm" href="#/work/library">‹ 返回阅览室</a>
    </div>

    <div class="card sm-toolbar">
      <div class="sm-slot-info">
        <span class="sm-slot-date">${esc(date0)}</span>
        <span class="sm-slot-time">${esc(start0)}–${esc(end0)}</span>
        <span class="tag" id="smStat">加载中…</span>
      </div>
      <div class="legend sm-legend">
        <span><i class="sm-swatch free"></i>可约</span>
        <span><i class="sm-swatch busy"></i>已占用</span>
        <span><i class="sm-swatch sel"></i>已选</span>
        <span><i class="sm-ico-legend win"></i>靠窗</span>
        <span><i class="sm-ico-legend power"></i>电源</span>
      </div>
      <button class="btn btn-ghost btn-sm" id="roomRefresh">↻ 刷新余量</button>
    </div>

    <div id="seatBox"><div class="muted" style="padding:22px 4px">正在加载座位平面图…</div></div>

    <div class="bk-bar" id="seatBar" hidden>
      <div class="bkb-info" id="seatBarInfo">请选择座位</div>
      <button class="btn btn-primary bkb-btn" id="seatSubmit" disabled>确认选座</button>
    </div>`;

  root.style.paddingBottom = "150px";
  const box = root.querySelector("#seatBox");
  const bar = root.querySelector("#seatBar");
  const stat = root.querySelector("#smStat");
  const submit = root.querySelector("#seatSubmit");

  async function loadSeats() {
    selectedSeat = null;
    bar.hidden = true;
    submit.disabled = true;
    box.innerHTML = '<div class="muted" style="padding:22px 4px">正在加载座位平面图…</div>';
    try {
      const areas = await api.get(`/library/areas?date=${date0}&start=${start0}&end=${end0}`);
      const areaData = areas.find((a) => a.name === area);
      if (!areaData) {
        box.innerHTML = `<div class="card empty-block">
          <div class="eb-ico">📚</div>
          <b>该阅览室暂未开放选座</b>
          <span>可能正在维护或时段已关闭，可返回列表选择其他阅览室。</span>
          <a class="btn btn-ghost btn-sm" href="#/work/library">返回阅览室列表</a>
        </div>`;
        stat.textContent = "暂无数据";
        return;
      }
      const rate = Math.round((1 - areaData.available / areaData.total) * 100);
      stat.textContent = `可约 ${areaData.available} / ${areaData.total} 座 · 当前上座率 ${rate}%`;
      box.innerHTML = `<div class="card seatmap-card">
        <div class="seatmap-head">
          <div>
            <div class="seatmap-title">${esc(areaData.name)} · 座位平面示意</div>
            <div class="seatmap-sub">左侧临窗区采光较好，中间为主通道，右侧为书架与检索区</div>
          </div>
          <div class="seatmap-count"><b>${areaData.available}</b><span>座可约</span></div>
        </div>
        <div class="seatmap-canvas">${seatMapSvg(areaData)}</div>
        <div class="seatmap-note">平面为示意布局，座位编号与现场标识一致；已占用座位为当前时段已有预约。</div>
      </div>`;
      box.querySelectorAll(".sm-seat.free").forEach((el) => {
        const pick = () => {
          box.querySelectorAll(".sm-seat").forEach((x) => x.classList.remove("picked"));
          el.classList.add("picked");
          selectedSeat = {
            id: el.getAttribute("data-seat"),
            name: el.getAttribute("data-name"),
            kind: el.getAttribute("data-kind"),
          };
          root.querySelector("#seatBarInfo").innerHTML = `已选座位 <b>${esc(selectedSeat.name)}</b><span class="bkb-sub">${esc(date0)} ${esc(start0)}–${esc(end0)} · ${esc(selectedSeat.kind)} · 确认后 15 分钟内签到</span>`;
          bar.hidden = false;
          submit.disabled = false;
        };
        el.addEventListener("click", pick);
        el.addEventListener("keydown", (ev) => {
          if (ev.key === "Enter" || ev.key === " ") {
            ev.preventDefault();
            pick();
          }
        });
      });
    } catch (e) {
      box.innerHTML = `<div class="card empty-block"><div class="eb-ico">⚠️</div><b>座位图加载失败</b><span>${esc(e.message)}</span><button class="btn btn-ghost btn-sm" id="retrySeat">重试</button></div>`;
      const retry = box.querySelector("#retrySeat");
      if (retry) retry.addEventListener("click", loadSeats);
      stat.textContent = "加载失败";
    }
  }

  root.querySelector("#roomRefresh").addEventListener("click", loadSeats);
  submit.addEventListener("click", async () => {
    if (!selectedSeat) return;
    submit.disabled = true;
    submit.textContent = "提交中…";
    try {
      const result = await api.post("/bookings", {
        resource_id: Number(selectedSeat.id),
        date: date0,
        start_at: start0,
        end_at: end0,
        people: 1,
        purpose: "图书馆自习",
      });
      toast(`预约成功：${result.code}，请 15 分钟内签到`, "success");
      await loadSeats();
    } catch (e) {
      toast(e.message, "error");
      submit.disabled = false;
    } finally {
      submit.textContent = "确认选座";
    }
  });
  await loadSeats();
}

/* ================= 资源平台 ================= */

export async function renderResources(root, ctx) {
  const rows = await api.get("/resource-links");
  const categories = [...new Set(rows.map((r) => r.category))];
  root.innerHTML = `
    <div class="res-hero">
      <div class="res-hero-art"><svg viewBox="0 0 240 160" fill="none">
        <rect x="24" y="34" width="52" height="74" rx="10" stroke="#8fdcff" stroke-opacity=".45" stroke-width="1.6"/>
        <rect x="88" y="20" width="52" height="102" rx="10" fill="#8fdcff" fill-opacity=".1" stroke="#8fdcff" stroke-opacity=".55" stroke-width="1.6"/>
        <rect x="152" y="48" width="52" height="60" rx="10" stroke="#f0cf94" stroke-opacity=".55" stroke-width="1.6"/>
        <path d="M40,56 H60 M40,72 H60 M104,44 H124 M104,64 H124 M104,84 H124 M168,70 H188 M168,86 H188" stroke="#fff" stroke-opacity=".35" stroke-width="3.4" stroke-linecap="round"/>
      </svg></div>
      <div class="tag">PORTAL</div>
      <h1>资源平台</h1>
      <p>学校已有平台的统一入口——实验教学、AI 平台、图书馆、教务、就业，一处直达。</p>
      <div class="res-search">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.6-3.6"/></svg>
        <input id="resSearch" placeholder="搜索平台名称或用途，如：图书馆、教务…" autocomplete="off">
      </div>
    </div>
    <div class="res-tabs">
      <button class="res-tab active" data-cat="">全部 <span id="resCount">${rows.length}</span></button>
      ${categories.map((c) => `<button class="res-tab" data-cat="${esc(c)}">${esc(c)} <span>${rows.filter((r) => r.category === c).length}</span></button>`).join("")}
    </div>
    <div id="linkList" class="res-grid">${rows.map(resCard).join("")}</div>
    <div id="resEmpty" class="empty" hidden><strong>没有匹配的平台</strong>换个关键词试试</div>`;

  const list = root.querySelector("#linkList");
  const empty = root.querySelector("#resEmpty");
  let cat = "";
  let q = "";

  function refresh() {
    const filtered = rows.filter(
      (r) => (!cat || r.category === cat) && (!q || `${r.name}${r.note || ""}${r.category}`.toLowerCase().includes(q))
    );
    list.innerHTML = filtered.map(resCard).join("");
    empty.hidden = filtered.length > 0;
    root.querySelector("#resCount").textContent = String(filtered.length === rows.length ? rows.length : filtered.length);
  }

  root.querySelectorAll("[data-cat]").forEach((chip) => {
    chip.addEventListener("click", () => {
      root.querySelectorAll("[data-cat]").forEach((x) => x.classList.remove("active"));
      chip.classList.add("active");
      cat = chip.getAttribute("data-cat");
      refresh();
    });
  });
  root.querySelector("#resSearch").addEventListener("input", (e) => {
    q = e.target.value.trim().toLowerCase();
    refresh();
  });
}

const CAT_ICON = {
  实验教学: ["🧪", "ico-indigo"],
  "AI 平台": ["✦", "ico-violet"],
  实践教学: ["🛠", "ico-cyan"],
  图书资源: ["📚", "ico-green"],
  信息服务: ["🌐", "ico-blue"],
  招生就业: ["🎓", "ico-orange"],
  新闻资讯: ["📰", "ico-pink"],
  校园导览: ["🗺", "ico-teal"],
  教务服务: ["📋", "ico-gold"],
};

function resCard(r) {
  const [icon, cls] = CAT_ICON[r.category] || ["▣", "ico-blue"];
  return `<a class="res-card" href="${esc(r.url)}" target="_blank" rel="noopener">
    <div class="res-ico ${cls}">${icon}</div>
    <div class="res-body">
      <div class="res-name">${esc(r.name)}</div>
      <div class="res-note">${esc(r.note || r.audience)}</div>
      <div class="res-flags">
        ${r.need_login ? '<span class="res-flag">需登录</span>' : ""}
        ${r.need_campus_net ? '<span class="res-flag">需校园网</span>' : ""}
        <span class="res-flag res-flag-cat">${esc(r.category)}</span>
      </div>
    </div>
    <span class="res-go">↗</span>
  </a>`;
}

/* ================= 信息动态 ================= */

function newsArt() {
  return `<svg viewBox="0 0 200 160" fill="none">
    <circle cx="150" cy="62" r="48" stroke="#8fdcff" stroke-opacity=".35" stroke-width="1.4"/>
    <circle cx="150" cy="62" r="31" stroke="#eaf7ff" stroke-opacity=".45" stroke-width="1.2"/>
    <circle cx="150" cy="62" r="14" fill="#8fdcff" opacity=".16"/>
    <path d="M18,118 H124 M18,132 H96" stroke="#fff" stroke-opacity=".3" stroke-width="3" stroke-linecap="round"/>
    <circle cx="38" cy="38" r="2" fill="#dff2ff" opacity=".65"/>
    <circle cx="70" cy="24" r="1.4" fill="#dff2ff" opacity=".45"/>
    <circle cx="104" cy="44" r="1.8" fill="#dff2ff" opacity=".55"/>
    <circle cx="176" cy="118" r="1.6" fill="#dff2ff" opacity=".5"/>
  </svg>`;
}

function newsTagClass(c) {
  return c === "学术科研" ? "tag-blue" : c === "校园活动" ? "tag-green" : c === "通知公告" ? "tag-gold" : "";
}

function newsDay(dateStr) {
  return (dateStr || "").slice(8, 10);
}

function newsMonth(dateStr) {
  return (dateStr || "").slice(5, 7) + "月";
}

export async function renderNews(root, ctx) {
  const [rows, meta] = await Promise.all([api.get("/news"), api.get("/news/meta")]);
  let category = "";
  let college = "";
  root.innerHTML = `
    <div class="detail-hero news-hero">
      <div class="detail-art">${newsArt()}</div>
      <div class="tag">JSNU · NEWS</div>
      <h1>信息动态</h1>
      <p>师大要闻、学术科研、校园活动与通知公告，一处尽览。</p>
    </div>
    <div class="card news-filter">
      <div class="chips" id="newsCats">
        <button class="chip active" data-cat="">全部</button>
        ${meta.categories.map((c) => `<button class="chip" data-cat="${esc(c)}">${esc(c)}</button>`).join("")}
      </div>
      <div class="news-filter-right">
        <select class="select" id="newsCollege"><option value="">全部学院</option>${meta.colleges.map((c) => `<option>${esc(c)}</option>`).join("")}</select>
        <input class="input" id="newsSearch" placeholder="搜索标题…">
      </div>
    </div>
    <div id="newsBody"></div>`;

  function renderBody() {
    const q = root.querySelector("#newsSearch").value.trim();
    const filtered = rows.filter((n) => (!category || n.category === category) && (!college || n.college === college) && (!q || n.title.includes(q)));
    const body = root.querySelector("#newsBody");
    if (!filtered.length) {
      body.innerHTML = '<div class="empty"><strong>没有匹配的动态</strong>换个分类或关键词试试</div>';
      return;
    }
    const [head, ...rest] = filtered;
    body.innerHTML = `
      <a class="card news-feature nc-feature" href="#/news/detail?id=${head.id}">
        <img src="${newsImage(head.id)}" alt="" loading="lazy" onerror="this.remove()">
        <div class="nf-body">
          <div class="nf-meta" style="margin:0 0 8px"><span class="tag ${newsTagClass(head.category)}">${esc(head.category)}</span><span>${esc(head.college)} · ${esc(head.published_at)}</span></div>
          <div class="nf-title">${esc(head.title)}</div>
          <div class="nf-summary">${esc(head.summary)}</div>
        </div>
      </a>
      ${rest.length ? `<div class="grid grid-2">${rest.map(newsCardV2).join("")}</div>` : ""}`;
  }

  root.querySelectorAll("#newsCats .chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      root.querySelectorAll("#newsCats .chip").forEach((x) => x.classList.remove("active"));
      chip.classList.add("active");
      category = chip.getAttribute("data-cat");
      renderBody();
    });
  });
  root.querySelector("#newsCollege").addEventListener("change", (e) => { college = e.target.value; renderBody(); });
  root.querySelector("#newsSearch").addEventListener("input", renderBody);
  renderBody();
}

function newsCardV2(n) {
  return `<a class="card nc-card" href="#/news/detail?id=${n.id}">
    <img class="nc-thumb" src="${newsImage(n.id)}" alt="" loading="lazy" onerror="this.remove()">
    <div class="nl-main">
      <div class="nc-tags"><span class="tag ${newsTagClass(n.category)}">${esc(n.category)}</span><span class="tag">${esc(n.college)}</span><span class="muted">${esc(n.published_at)}</span></div>
      <div class="nl-title" style="margin-top:7px">${esc(n.title)}</div>
      <div class="nc-summary">${esc(n.summary)}</div>
      <div class="nc-meta">${esc(n.source)}</div>
    </div>
  </a>`;
}
export async function renderNewsDetail(root, ctx) {
  const id = ctx.params.get("id");
  if (!id) {
    ctx.navigate("/work/news");
    return;
  }
  let n;
  try {
    n = await api.get(`/news/${id}`);
  } catch (e) {
    root.innerHTML = `<div class="empty" style="margin-top:40px"><strong>动态不存在或已下线</strong><div style="margin-top:10px"><a class="btn btn-ghost btn-sm" href="#/work/news">返回信息动态</a></div></div>`;
    return;
  }
  const paras = (n.content || "").split(/\n+/).map((p) => p.trim()).filter(Boolean);
  root.innerHTML = `
    <div class="article-wrap">
      <div class="article-crumb"><a href="#/work/news">信息动态</a><span class="sep">/</span>${esc(n.category)}</div>
      <img class="article-cover" src="${newsImage(n.id)}" alt="" loading="lazy" onerror="this.remove()">
      <div class="article-head">
        <h1 class="article-title">${esc(n.title)}</h1>
        <div class="article-meta">
          <span>来源：${esc(n.source)}</span>
          <span>${esc(n.college)}</span>
          <span>发布时间：${esc(n.published_at)}</span>
          <span class="tag ${newsTagClass(n.category)}">${esc(n.category)}</span>
        </div>
      </div>
      <div class="article-body">
        ${paras.map((p) => `<p>${esc(p)}</p>`).join("")}
        ${n.images.length ? `<div class="article-photos">${n.images.map((src) => `<img src="${esc(src)}" alt="新闻现场图" loading="lazy" onerror="this.remove()">`).join("")}</div>` : ""}
      </div>
      <div class="article-foot">
        <span class="muted">本文转载自${esc(n.source)}公开发布内容，仅作校园信息聚合展示。</span>
        <a class="btn btn-ghost btn-sm" href="#/work/news">‹ 返回信息动态</a>
      </div>
    </div>
    ${n.related.length ? `<div class="section-title">相关阅读</div>
    <div class="grid grid-4">
      ${n.related.map((r) => `<a class="card rl-card" href="#/news/detail?id=${r.id}">
        <div class="rl-title">${esc(r.title)}</div>
        <div class="nc-meta" style="margin-top:8px">${esc(r.category)} · ${esc(r.published_at)}</div>
      </a>`).join("")}
    </div>` : ""}`;
}