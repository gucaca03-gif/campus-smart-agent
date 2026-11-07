import { api } from "../api.js";
import { wgs84ToGcj02 } from "../geo.js";
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

const LIB_SLOTS = [
  ["08:00", "10:00"],
  ["10:00", "12:00"],
  ["12:00", "14:00"],
  ["14:00", "16:00"],
  ["16:00", "18:00"],
  ["18:00", "20:00"],
  ["20:00", "22:00"],
];

/* 时段集合是否首尾连续（如 08:00-10:00 + 10:00-12:00） */
function slotsAreContiguous(slots) {
  if (slots.length <= 1) return true;
  const sorted = [...slots].sort();
  for (let i = 1; i < sorted.length; i += 1) {
    if (sorted[i].split("-")[0] !== sorted[i - 1].split("-")[1]) return false;
  }
  return true;
}

/* 当天已结束的时段不可再预约 */
function slotIsPast(slot, dateStr) {
  if (dateStr !== today()) return false;
  const end = (slot || "").split("-")[1] || "23:59";
  const [h, m] = end.split(":").map(Number);
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes() >= h * 60 + m;
}

/* 教室节次是否已开始（含已结束），已开始的节次不可预约 */
function periodStarted(start, dateStr) {
  if (dateStr !== today()) return false;
  const [h, m] = (start || "").split(":").map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return false;
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes() >= h * 60 + m;
}

/* 连续时段集合的合并区间文本（如 08:00–14:00） */
function seatSpanText(slots) {
  const sorted = [...slots].sort();
  return `${sorted[0].split("-")[0]}–${sorted[sorted.length - 1].split("-")[1]}`;
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

const ICO_CAL2 = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="5" width="17" height="15.5" rx="2.4"/><path d="M3.5 10h17M8 3v4M16 3v4"/><path d="M8 14h3M8 17.2h5"/></svg>`;
const ICO_LIB = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M6 11V7a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v4"/><path d="M4 11h16v5H4z"/><path d="M7 16v4M17 16v4"/></svg>`;
const ICO_DOC2 = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M5 4h9l5 5v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4Z"/><path d="M14 4v5h5"/><path d="M8.5 13h7M8.5 16.5h4"/></svg>`;
const ICO_ME2 = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="3.6"/><path d="M4.5 20c1.4-3.6 4-5.2 7.5-5.2s6.1 1.6 7.5 5.2"/></svg>`;

function zeEntry({ href, tone, ico, title, badge, desc, stat, btn }) {
  return `<a class="ze-card" href="${href}">
    <div class="hic ${tone}">${ico}</div>
    <div class="ze-body">
      <div class="ze-name">${title}${badge ? `<span class="hb">${badge}</span>` : ""}</div>
      <div class="ze-desc">${desc}</div>
      <div class="ze-stat">${stat}</div>
    </div>
    <span class="ze-cta">${btn} ›</span>
  </a>`;
}

export async function render(root, ctx) {
  const [classrooms, areas, bookings, self] = await Promise.all([
    api.get("/resources?type=classroom").catch(() => []),
    api.get("/library/areas").catch(() => []),
    api.get("/bookings/my").catch(() => []),
    api.get("/self/control/overview").catch(() => null),
  ]);
  root.style.removeProperty("padding-bottom");
  const todayStr = today();
  const upcoming = bookings
    .filter((b) => b.date >= todayStr && !["cancelled", "rejected", "completed", "no_show"].includes(b.status))
    .sort((a, b) => (a.date + a.start_at).localeCompare(b.date + b.start_at));
  const pending = bookings.filter((b) => b.status === "pending_approval").length;
  const seatAvail = areas.reduce((s, a) => s + a.available, 0);
  const todo = self && Array.isArray(self.tasks) ? self.tasks.length : 0;
  const focusMin = self ? self.focus.minutes : 0;

  root.innerHTML = `
    ${bookHero("工作区", "空教室、图书馆、文件处理与个人事务，各自独立入口。", [
      [classrooms.length, "间教室"],
      [seatAvail, "个空座"],
      [todo, "今日待办"],
    ])}

    <div class="ze-grid">
      ${zeEntry({
        href: "#/work/classroom", tone: "g", ico: ICO_CAL2, title: "空教室预约", badge: `${classrooms.length} 间`,
        desc: "教室 × 节次占用矩阵，工作日晚间与周末可借",
        stat: `提交后需管理员审批 · 18:30–20:40 可约`,
        btn: "去预约",
      })}
      ${zeEntry({
        href: "#/work/library", tone: "b", ico: ICO_LIB, title: "图书馆预约", badge: `${seatAvail} 座可约`,
        desc: "常用座位直达 · 六个阅览室 · 平面图选座",
        stat: `08:00–22:00 · 选座即时确认 · 15 分钟内签到`,
        btn: "去选座",
      })}
      ${zeEntry({
        href: "#/office", tone: "v", ico: ICO_DOC2, title: "文件识别", badge: "",
        desc: "字段提取 · 规则生成 · 批量核查",
        stat: `支持 PDF · 扫描件 · Word · Excel`,
        btn: "去识别",
      })}
      ${zeEntry({
        href: "#/me", tone: "p", ico: ICO_ME2, title: "个人管理", badge: "",
        desc: "预约记录 · 签到 · 待办与专注统计",
        stat: `今日待办 <b>${todo}</b> 项 · 专注 <b>${focusMin}</b> 分钟`,
        btn: "去看看",
      })}
    </div>

    <div class="section-title">我的近期预约${pending ? ` <span class="tag tag-gold">${pending} 条待审批</span>` : ""}</div>
    <div class="card bk-list">
      ${upcoming.length ? upcoming.slice(0, 5).map(tlRow).join("") : '<div class="bk-empty"><b>近期暂无预约</b><span>从上方空教室或图书馆入口开始预约。</span></div>'}
      ${upcoming.length ? '<div class="bk-more"><a href="#/me">全部预约记录 ›</a></div>' : ""}
    </div>`;
}

export async function renderLab(root, ctx) {
  const rows = await api.get("/resources?type=lab");
  root.style.removeProperty("padding-bottom");
  root.innerHTML = `    ${bookHero("实验室预约", "实验室仅工作日开放，提交后需管理员审批。地点、设备与面向学院以实验室管理处数据为准。", [
      [rows.length, "间实验室"],
      ["08:00–17:10", "工作日开放"],
      ["需审批", "提交后管理员确认"],
    ])}
    <div class="toolbar"><input class="input search-input" id="labSearch" placeholder="搜索实验室名称或设备…">
      </div>
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
  const home = await api.get("/home").catch(() => null);
  const weekNum = home && home.week ? home.week.week : 1;
  const termStart = home && home.week && home.week.week_start ? home.week.week_start : today();
  // week_start 是学期第 1 周的周一：本周一 = 学期起点 + (week-1)*7 天
  const monday = new Date(termStart + "T00:00:00");
  monday.setDate(monday.getDate() + (weekNum - 1) * 7);
  const weekMonday = `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, "0")}-${String(monday.getDate()).padStart(2, "0")}`;

  // 周次解锁：本周日 20:00 后解锁下周
  const now = new Date();
  const base = new Date();
  const thisSunday = new Date(base);
  thisSunday.setDate(base.getDate() + ((7 - base.getDay()) % 7));
  const unlockedNext = now.getDay() === 0 && now.getHours() >= 20;
  const weekOptions = [
    { key: "current", label: `第 ${weekNum} 周（本周）`, offset: 0, locked: false },
    { key: "next", label: `第 ${weekNum + 1} 周（下周）`, offset: 7, locked: !unlockedNext },
  ];
  let curWeek = "current";
  let curDate = today();
  let selected = null;

  root.innerHTML = `    ${bookHero("空教室预约", "以周次为单位：本周随时可约，周日 20:00 解锁下周；全天五个节次，提交即确认（无需审批）。", [
      ["周次制", "周日 20:00 解锁下周"],
      ["全天", "节次可约"],
      ["免审批", "提交即确认"],
    ])}
    <div class="week-switch" id="weekSwitch">
      ${weekOptions
        .map(
          (w) => `<button class="week-chip ${w.key === curWeek ? "on" : ""}" data-week="${w.key}" data-offset="${w.offset}" ${w.locked ? 'data-locked="1"' : ""}>
            ${w.label}${w.locked ? ' 🔒' : ""}
          </button>`
        )
        .join("")}
      <span class="week-hint" id="weekHint"></span>
    </div>
    <div class="date-strip" id="dateStrip"></div>
    <div class="legend" style="margin-bottom:10px">
      <span><i class="cell-legend cell-free"></i>可约</span>
      <span><i class="cell-legend cell-occupied"></i>已占用</span>
      <span><i class="cell-legend cell-mine"></i>我约的</span>
      <span><i class="cell-legend cell-full"></i>已满</span>
    </div>
    <div id="gridBox"><div class="muted">加载中…</div></div>
    <div class="grid-bar" id="gridBar" hidden>
      <div class="grid-bar-info" id="gridBarInfo"></div>
      <input class="input" id="gridPurpose" placeholder="预约原因（必填，免审批留痕）" style="width:230px" maxlength="60">
      <span style="font-size:12.5px;color:var(--text-2);white-space:nowrap">预约人数</span>
      <input class="input" type="number" id="gridPeople" min="1" value="4" placeholder="填写人数" style="width:90px">
      <button class="btn btn-primary" id="gridSubmit">提交预约</button>
    </div>`;

  const $ = (sel) => root.querySelector(sel);
  const box = $("#gridBox");
  const bar = $("#gridBar");
  const dateStrip = $("#dateStrip");
  const weekHint = $("#weekHint");
  const PERIODS = ["1-2节", "3-4节", "5-6节", "7-8节", "晚间"];

  function datesOfWeek(offset) {
    const days = [];
    const localISO = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekMonday + "T00:00:00");
      d.setDate(d.getDate() + offset + i);
      const iso = localISO(d);
      days.push({
        iso,
        label: "一二三四五六日"[i],
        isToday: iso === today(),
        past: iso < today(),
      });
    }
    return days;
  }

  function renderDateStrip() {
    const offset = curWeek === "next" ? 7 : 0;
    const days = datesOfWeek(offset);
    dateStrip.innerHTML = days
      .map((d) => {
        const disabled = d.past || (curWeek === "next" && !unlockedNext);
        const sel = d.iso === curDate ? "on" : "";
        return `<button class="date-chip ${sel} ${disabled ? "past" : ""}" data-date="${d.iso}" ${disabled ? "disabled" : ""}>
          <span class="dc-lb">${d.label}</span><span class="dc-dt">${d.iso.slice(5).replace("-", "/")}</span>
          ${d.isToday ? '<span class="dc-today">今天</span>' : ""}
        </button>`;
      })
      .join("");
    dateStrip.querySelectorAll("[data-date]").forEach((chip) =>
      chip.addEventListener("click", () => {
        curDate = chip.getAttribute("data-date");
        renderDateStrip();
        loadGrid();
      })
    );
  }

  async function loadGrid() {
    box.innerHTML = '<div class="muted">加载中…</div>';
    bar.hidden = true;
    selected = null;
    try {
      const data = await api.get(`/classrooms/grid?date=${curDate}`);
      box.innerHTML = `
        <div class="card" style="padding:0;overflow:auto">
          <table class="grid-table">
            <thead><tr><th class="gt-room-col">教室 · ${esc(curDate)}</th>
              ${data.periods.map((p) => `<th>${esc(p.label)}<div class="gt-time">${p.start}–${p.end}</div></th>`).join("")}</tr></thead>
            <tbody>
              ${data.rooms
                .map(
                  (r) => `<tr>
                    <td class="gt-room"><strong>${esc(r.room)}</strong><div class="gt-meta">${r.capacity} 座 · ${esc(r.equipment || "")}</div></td>
                    ${r.cells
                      .map(
                        (c) => {
                          const passed = c.status === "free" && periodStarted(c.start, curDate);
                          const free = c.status === "free" && !passed;
                          const label =
                            passed
                              ? "已过"
                              : c.status === "mine"
                                ? "我约的"
                                : c.status === "course" || c.status === "booked"
                                  ? "已占用"
                                  : c.status === "closed"
                                    ? "不开放"
                                    : c.status === "full"
                                      ? "已满"
                                      : c.text || "可约";
                          const cls =
                            passed ? "past" : c.status === "course" || c.status === "booked" || c.status === "closed" ? "occupied" : c.status;
                          return `<td class="gt-cell cell-${cls}" ${free ? `data-room="${r.id}" data-rname="${esc(r.room)}" data-start="${c.start}" data-end="${c.end}" data-period="${esc(c.period)}"` : ""} title="${esc(r.room)} ${esc(c.period)}：${passed ? "该节次已开始，不可预约" : esc(c.text)}">${label}</td>`;
                        }
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
          $("#gridBarInfo").innerHTML = `已选：<strong>${esc(selected.name)}</strong> · ${esc(curDate)} ${esc(selected.period)}（${selected.start}–${selected.end}）`;
          bar.hidden = false;
        });
      });
    } catch (e) {
      box.innerHTML = `<div class="muted">${esc(e.message)}</div>`;
    }
  }

  // 周次切换
  root.querySelectorAll("[data-week]").forEach((chip) => {
    chip.addEventListener("click", () => {
      if (chip.dataset.locked) {
        const left = unlockedNext ? 0 : Math.ceil((new Date(thisSunday.getFullYear(), thisSunday.getMonth(), thisSunday.getDate(), 20, 0) - now) / 3600000);
        weekHint.textContent = `下周预约将于周日 20:00 开放（约 ${left} 小时后）`;
        setTimeout(() => (weekHint.textContent = ""), 4000);
        return;
      }
      root.querySelectorAll("[data-week]").forEach((x) => x.classList.remove("on"));
      chip.classList.add("on");
      curWeek = chip.dataset.week;
      const offset = curWeek === "next" ? 7 : 0;
      const days = datesOfWeek(offset);
      const t = days.find((d) => d.isToday);
      const nextOk = days.find((d) => !d.past);
      curDate = t ? t.iso : nextOk ? nextOk.iso : days[6].iso;
      renderDateStrip();
      loadGrid();
    });
  });

  $("#gridSubmit").addEventListener("click", async () => {
    if (!selected) return;
    const purposeVal = ($("#gridPurpose").value || "").trim();
    if (!purposeVal) {
      toast("请填写预约原因（免审批，将记录留痕）", "error");
      $("#gridPurpose").focus();
      return;
    }
    const btn = $("#gridSubmit");
    btn.disabled = true;
    try {
      const result = await api.post("/bookings", {
        resource_id: Number(selected.roomId),
        date: curDate,
        start_at: selected.start,
        end_at: selected.end,
        people: Number($("#gridPeople").value || 1),
        purpose: purposeVal,
      });
      toast(result.status === "confirmed" ? "预约成功！" : "已提交", "success");
      await loadGrid();
    } catch (e) {
      toast(e.message, "error");
    } finally {
      btn.disabled = false;
    }
  });

  renderDateStrip();
  await loadGrid();
}
export async function renderLibrary(root, ctx) {
  const dates = dateItems(3);
  let curTab = (ctx && ctx.params && ctx.params.get("tab")) === "checkin" ? "checkin" : "seat";
  let curDate = today();
  let curSlots = [];
  let favs = [];

  root.innerHTML = `
    <div class="lib-tabs">
      <button class="lt-tab ${curTab === "seat" ? "on" : ""}" data-lt="seat">🪑 选座</button>
      <button class="lt-tab ${curTab === "checkin" ? "on" : ""}" data-lt="checkin">📍 定位签到</button>
          </div>
    <div id="libBody"></div>`;

  const libBody = root.querySelector("#libBody");

  root.querySelectorAll("[data-lt]").forEach((el) =>
    el.addEventListener("click", () => {
      curTab = el.dataset.lt;
      root.querySelectorAll("[data-lt]").forEach((x) => x.classList.toggle("on", x.dataset.lt === curTab));
      draw();
    })
  );

  async function loadFavs() {
    if (!curSlots.length) {
      favs = [];
      return;
    }
    try {
      favs = await api.get(`/library/favorites?date=${curDate}&start=${curSlots[0].split("-")[0]}&end=${curSlots[0].split("-")[1]}`);
    } catch (e) {
      favs = [];
    }
  }

  /* ================= 选座页 ================= */
  async function drawSeat() {
    await loadFavs();
    libBody.innerHTML = `
      <div class="fs-box" id="favBox"><div class="muted" style="padding:12px 4px">常用座位加载中…</div></div>
      <div class="section-title">选择日期 <span class="title-hint">仅可预约今天与后两天</span></div>
      <div class="date-strip" id="dateStrip"></div>
      <div class="section-title">选择时段 <span class="title-hint">最多可选 3 个，一次预约</span></div>
      <div class="pill-strip" id="libSlots"></div>
      <div class="section-title">选择阅览室 <span class="title-hint">余量实时更新</span></div>
      <div id="roomList" class="room-list-v2"><div class="muted" style="padding:18px 4px">加载中…</div></div>
      ${noticeAcc([
        "08:00–22:00 开放，开馆前可提前 2 小时预订当日座位。",
        "预约成功后请在 15 分钟内定位签到；每次预约最多 2 次暂离，每次须在 30 分钟内回馆再次定位签到。",
        "全馆余座低于 20% 时，可在「定位签到」页对已预约但无人使用的座位发起监督占座。",
      ])}`;

    const list = root.querySelector("#roomList");
    const favBox = root.querySelector("#favBox");
    const strip = root.querySelector("#dateStrip");
    const slotBox = root.querySelector("#libSlots");

    function renderSlots() {
      slotBox.innerHTML = LIB_SLOTS.map((s) => {
        const slot = s.join("-");
        const past = slotIsPast(slot, curDate);
        return `<button type="button" class="pill ${curSlots.includes(slot) ? "active" : ""} ${past ? "past" : ""}" data-slot="${slot}" ${past ? "disabled" : ""} title="${past ? "该时段已过，无法预约" : ""}">${s[0]}–${s[1]}</button>`;
      }).join("");
      slotBox.querySelectorAll(".pill:not([disabled])").forEach((el) =>
        el.addEventListener("click", async () => {
          const slot = el.dataset.slot;
          const idx = curSlots.indexOf(slot);
          if (idx >= 0) {
            const remain = curSlots.filter((x) => x !== slot);
            if (!slotsAreContiguous(remain)) {
              toast("移除中间时段会断开连续时长，请从两端移除", "error");
              return;
            }
            curSlots.splice(idx, 1);
          } else {
            if (curSlots.length >= 3) {
              toast("一次最多选 3 个时段", "error");
              return;
            }
            if (!slotsAreContiguous([...curSlots, slot])) {
              toast("时段必须连续选择（如 08:00–12:00 一整段）", "error");
              return;
            }
            curSlots.push(slot);
          }
          renderSlots();
          await loadFavs();
          renderFavs();
          loadRooms();
        })
      );
    }

    function renderDateStrip() {
      strip.innerHTML = dates
        .map((d) => {
          const disabled = d.date < today();
          return `<button class="date-chip ${d.date === curDate ? "on" : ""} ${disabled ? "past" : ""}" data-date="${d.date}" ${disabled ? "disabled" : ""}>
            <span class="dc-lb">${d.label}</span><span class="dc-dt">${d.date.slice(5).replace("-", "/")}</span>
            ${d.date === today() ? '<span class="dc-today">今天</span>' : ""}
          </button>`;
        })
        .join("");
      strip.querySelectorAll("[data-date]").forEach((chip) =>
        chip.addEventListener("click", async () => {
          curDate = chip.getAttribute("data-date");
          curSlots = [];
          renderDateStrip();
          renderSlots();
          await loadFavs();
          renderFavs();
          loadRooms();
        })
      );
    }

    function renderFavs() {
      if (!curSlots.length) {
        favBox.innerHTML = `
          <div class="fs-head-row"><b>⭐ 常用座位</b><span>先选择时段后查看可约状态</span></div>
          <div class="fs-empty">当前未选择时段。选择下方时段后，这里会显示常用座位是否可以预约。</div>`;
        return;
      }
      if (!favs.length) {
        favBox.innerHTML = `
          <div class="fs-head-row"><b>⭐ 常用座位</b><span>在平面图上选中座位后可设为常用</span></div>
          <div class="fs-empty">还没有常用座位。选过一次座，下次一键直达老位置。</div>`;
        return;
      }
      favBox.innerHTML = `
        <div class="fs-head-row"><b>⭐ 常用座位</b><span>点击直达选座 · ${curDate}</span></div>
        <div class="fs-grid">
          ${favs
            .map(
              (s) => `<a class="fs-card ${s.available ? "" : "fs-occupied"}" href="#/work/library/room?area=${encodeURIComponent(s.room)}&date=${curDate}&start=${curSlots[0].split("-")[0]}&end=${curSlots[0].split("-")[1]}&seat=${s.seat_id}">
                <div class="fs-head"><span class="fs-room">${esc(s.room.split("(")[0])}</span>
                  <span class="fs-state">${s.available ? "可预约" : "当前时段已占用"}</span></div>
                <div class="fs-seat"><b>${esc(s.seat_no)}</b> 号座位${s.power ? " 🔌" : ""}${s.window ? " 🪟" : ""}</div>
                <div class="fs-meta">${s.available ? "我的常用座位" : "换个时段可能可约"}</div>
              </a>`
            )
            .join("")}
        </div>`;
    }

    async function loadRooms() {
      if (!curSlots.length) {
        list.innerHTML = '<div class="bk-empty"><b>请先选择时段</b><span>选择连续时段后，会显示各阅览室的余量。</span></div>';
        return;
      }
      list.innerHTML = '<div class="muted" style="padding:18px 4px">加载中…</div>';
      try {
        const areaLists = await Promise.all(
          curSlots.map((s) => api.get(`/library/areas?date=${curDate}&start=${s.split("-")[0]}&end=${s.split("-")[1]}`))
        );
        // 多时段聚合：任一时段可约即显示；余量取最小值
        const agg = {};
        areaLists.forEach((areas) =>
          areas.forEach((a) => {
            agg[a.name] = agg[a.name] || { total: a.total, min: a.available };
            agg[a.name].min = Math.min(agg[a.name].min, a.available);
          })
        );
        list.innerHTML = Object.entries(agg)
          .map(([name, info]) => {
            const tight = info.min / info.total < 0.2;
            const slotsQ = curSlots.join(",");
            const href = `#/work/library/room?area=${encodeURIComponent(name)}&date=${curDate}&slots=${slotsQ}`;
            return `<a class="rl-row" href="${href}">
              <div class="rl-main">
                <div class="rl-name">${esc(name)}${tight ? '<span class="tag tag-tight">紧张</span>' : ""}</div>
                <div class="rl-meta">8:00 - 22:00 开馆前可提前 <b>2小时</b> 预订 · 已选 ${curSlots.length} 个时段</div>
              </div>
              <div class="rl-avail ${tight ? "tight" : ""}"><b>${info.min}</b><span>/可选</span></div>
              <span class="rl-go">›</span>
            </a>`;
          })
          .join("");
      } catch (e) {
        list.innerHTML = `<div class="bk-empty"><b>阅览室加载失败</b><span>${esc(e.message)}</span></div>`;
      }
    }

    renderDateStrip();
    renderSlots();
    renderFavs();
    loadRooms();
  }

  /* ================= 定位签到页 ================= */
  function drawCheckin() {
    libBody.innerHTML = `<div class="muted" style="padding:18px 4px">加载中…</div>`;
    loadCheckin();
  }

  function currentLibSlot() {
    const now = new Date();
    const minutes = now.getHours() * 60 + now.getMinutes();
    const hit = LIB_SLOTS.find(([s, e]) => {
      const [sh, sm] = s.split(":").map(Number);
      const [eh, em] = e.split(":").map(Number);
      return minutes >= sh * 60 + sm && minutes < eh * 60 + em;
    });
    return (hit || LIB_SLOTS[0]).join("-");
  }

  function requestGeo() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) return reject(new Error("当前浏览器不支持定位"));
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve(pos.coords),
        (err) =>
          reject(
            new Error(
              err && err.code === 1
                ? "定位权限被拒绝，请在浏览器中允许定位后再签到"
                : "获取定位失败，请检查定位服务"
            )
          ),
        { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
      );
    });
  }

  async function geoCheckin(bookingId, reload) {
    try {
      const coords = await requestGeo();
      const [lng, lat] = wgs84ToGcj02(coords.longitude, coords.latitude);
      await api.post(`/bookings/${bookingId}/checkin`, { lat, lng });
      toast("定位签到成功", "success");
    } catch (e) {
      toast(e.message, "error");
    }
    reload();
  }

  function minutesOf(b) {
    const [sh, sm] = String(b.start_at || "0:0").split(":").map(Number);
    const [eh, em] = String(b.end_at || "0:0").split(":").map(Number);
    return Math.max(0, eh * 60 + em - (sh * 60 + sm));
  }

  async function loadCheckin() {
    const bookings = await api.get("/bookings/my").catch(() => []);
    const todayStr = today();
    const active = ["confirmed", "checked_in", "away"];
    const ended = (b) => {
      const ends = new Date(`${b.date}T${b.end_at || "23:59"}:00`).getTime();
      return Number.isFinite(ends) && Date.now() > ends + 10 * 60 * 1000;
    };
    const mine = bookings
      .filter((b) => b.date >= todayStr && b.type === "seat" && active.includes(b.status) && !ended(b))
      .sort((a, b) => `${a.date} ${a.start_at}`.localeCompare(`${b.date} ${b.start_at}`));
    const history = bookings
      .filter((b) => b.type === "seat" && ["completed", "released", "cancelled", "rejected"].includes(b.status))
      .sort((a, b) => (b.date + b.start_at).localeCompare(a.date + a.start_at))
      .slice(0, 12);
    const supers = await api.get("/library/supervisions").catch(() => []);
    const bySeat = {};
    supers.filter((s) => s.status === "active").forEach((s) => (bySeat[s.seat_id] = s));
    const awayUsed = (room) =>
      bookings
        .filter((x) => x.date === todayStr && x.type === "seat" && x.room === room)
        .reduce((n, x) => n + Number(x.away_count || 0), 0);
    const groupKey = (b) => b.reservation_key || String(b.id);
    const groups = (() => {
      const map = new Map();
      mine.forEach((b) => {
        const key = groupKey(b);
        if (!map.has(key)) {
          map.set(key, { ...b, ids: [b.id], away_count: 0, points_awarded: 0 });
          return;
        }
        const g = map.get(key);
        g.ids.push(b.id);
        if (b.start_at < g.start_at) g.start_at = b.start_at;
        if (b.end_at > g.end_at) g.end_at = b.end_at;
        g.away_count += Number(b.away_count || 0);
        g.points_awarded += Number(b.points_awarded || 0);
        if (b.status === "away") g.status = "away";
        else if (b.status === "checked_in" && g.status !== "away") g.status = "checked_in";
      });
      map.forEach((g) => {
        g.away_count = mine.filter((x) => groupKey(x) === groupKey(g)).reduce((n, x) => n + Number(x.away_count || 0), 0);
        g.points_awarded = mine.filter((x) => groupKey(x) === groupKey(g)).reduce((n, x) => n + Number(x.points_awarded || 0), 0);
      });
      return [...map.values()].sort((a, b) => `${a.date} ${a.start_at}`.localeCompare(`${b.date} ${b.start_at}`));
    })();

    const hm = (d) => `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    const windowOf = (b) => {
      const start = new Date(`${b.date}T${b.start_at}:00`);
      const open = new Date(start.getTime() - 15 * 60 * 1000);
      const close = new Date(start.getTime() + 15 * 60 * 1000);
      const now = Date.now();
      return { open, close, can: now >= open.getTime() && now <= close.getTime(), before: now < open.getTime(), after: now > close.getTime() };
    };
    const historyGroups = [...new Map(history.map((b) => [groupKey(b), b])).values()];

    const historyHtml = () =>
      historyGroups.length
        ? `<div class="hist-grid">${historyGroups
            .map(
              (b) => `<div class="hist-card">
                <div class="hist-top"><b>${esc(b.resource_name)}</b>${statusBadge(b.status)}</div>
                <div class="hist-meta">${esc(b.date)} · ${esc(b.start_at)}–${esc(b.end_at)}</div>
                <div class="hist-room">${esc(b.room || "")}</div>
                ${b.points_awarded ? `<div class="hist-pts">${b.points_awarded > 0 ? "+" : ""}${esc(b.points_awarded)} 积分</div>` : ""}
              </div>`
            )
            .join("")}</div>`
        : '<div class="muted" style="padding:6px 0">还没有历史预约记录。</div>';

    if (!groups.length) {
      libBody.innerHTML = `
        <div class="card ci-empty">
          <div class="ci-emoji">📍</div>
          <div class="ci-title">今天及之后还没有座位预约</div>
          <div class="muted">去「选座」挑一个能让你专注学习的座位吧</div>
          <button class="btn btn-primary" data-goto-seat>去选座</button>
        </div>
        <div class="section-title">我的预约记录 <span class="title-hint">最近 12 条</span></div>
        ${historyHtml()}
        <div class="section-title">监督占座</div>
        <div id="supList"></div>`;
    } else {
      libBody.innerHTML = `
        ${groups
          .map((b) => {
            const st = b.status;
            const sv = bySeat[b.resource_id];
            const left = Math.max(0, 2 - b.away_count);
            const w = windowOf(b);
            const dateTag = b.date === todayStr ? "今天" : b.date.slice(5);
            const beforeMin = Math.max(1, Math.ceil((w.open.getTime() - Date.now()) / 60000));
            const beforeText = beforeMin >= 60 ? `${Math.floor(beforeMin / 60)} 小时 ${beforeMin % 60} 分钟` : `${beforeMin} 分钟`;
            const slotCount = Math.max(1, Math.round(minutesOf(b) / 120));
            let winHint = "";
            if (st === "confirmed") {
              if (w.can) winHint = " · 现在可签到";
              else if (w.before) winHint = ` · 还有 ${beforeText}`;
              else if (w.after) winHint = " · 已过签到时间";
            }
            return `<div class="card ci-card" data-bid="${b.id}">
              <div class="ci-room">${esc(b.resource_name)}<span class="ci-group-count">${slotCount} 个时段</span></div>
              <div class="ci-seat">${esc(b.date)} ${esc(b.start_at)}–${esc(b.end_at)} · ${esc(b.room || "")}</div>
              <div class="ci-window">可签到时间：${dateTag} ${hm(w.open)}–${hm(w.close)}${winHint}</div>
              <div class="ci-status">${statusBadge(st)}${["checked_in", "away"].includes(st) ? `<span class="ci-timer" data-end="${esc(b.end_at)}"></span>` : ""}</div>
              ${st === "checked_in" && !sv ? `<div class="sup-left">本次预约剩余暂离机会：<b>${left}</b> 次</div>` : ""}
              ${st === "away" ? `<div class="sup-timer" data-deadline="${esc(b.away_until)}">暂离倒计时 <b>--:--</b>（超时释放座位）</div>` : ""}
              ${sv ? `<div class="sup-timer" data-deadline="${esc(sv.deadline)}">被监督中：<b>--:--</b> 内回馆定位签到</div>` : ""}
              <div class="ci-actions">
                ${st === "confirmed" ? `<button class="btn btn-primary ci-btn" data-checkin="${b.id}">📍 定位签到</button>` : ""}
                ${st === "confirmed" ? `<button class="btn btn-ghost ci-btn" data-cancel="${b.id}">取消预约</button>` : ""}
                ${st === "away" ? `<button class="btn btn-primary ci-btn" data-checkin="${b.id}">📍 回到座位签到</button>` : ""}
                ${st === "checked_in" && sv ? `<button class="btn btn-primary ci-btn" data-checkin="${b.id}">📍 重新定位签到</button>` : ""}
                ${st === "checked_in" && !sv && left > 0 ? `<button class="btn btn-ghost ci-btn" data-away="${b.id}">🚶 暂离（保留 30 分钟）</button>` : ""}
                ${["checked_in", "away"].includes(st) ? `<button class="btn btn-ghost ci-btn" data-release="${b.id}">🚪 提前离场</button>` : ""}
              </div>
            </div>`;
          })
          .join("")}
        <div class="section-title">我的预约记录 <span class="title-hint">最近 12 条</span></div>
        ${historyHtml()}
        <div class="section-title">监督占座</div>
        <div id="supList"></div>`;
    }

    libBody.querySelector("[data-goto-seat]")?.addEventListener("click", () => {
      curTab = "seat";
      root.querySelectorAll("[data-lt]").forEach((x) => x.classList.toggle("on", x.dataset.lt === "seat"));
      draw();
    });
    libBody.querySelectorAll("[data-checkin]").forEach((btn) =>
      btn.addEventListener("click", () => geoCheckin(btn.dataset.checkin, loadCheckin))
    );
    libBody.querySelectorAll("[data-cancel]").forEach((btn) =>
      btn.addEventListener("click", async () => {
        if (!confirm("确认取消本次预约？取消后座位会释放。")) return;
        try {
          await api.post(`/bookings/${btn.dataset.cancel}/cancel`);
          toast("已取消预约，座位已释放", "success");
        } catch (e) {
          toast(e.message, "error");
        }
        loadCheckin();
      })
    );
    libBody.querySelectorAll("[data-away]").forEach((btn) =>
      btn.addEventListener("click", async () => {
        try {
          await api.post(`/bookings/${btn.dataset.away}/away`);
          toast("已暂离：30 分钟内需回馆再次定位签到", "success");
        } catch (e) {
          toast(e.message, "error");
        }
        loadCheckin();
      })
    );
    libBody.querySelectorAll("[data-release]").forEach((btn) =>
      btn.addEventListener("click", async () => {
        if (!confirm("确认提前释放座位？释放后不可恢复，积分在签到时已发放。")) return;
        try {
          await api.post(`/bookings/${btn.dataset.release}/release`);
          toast("已提前释放座位", "success");
        } catch (e) {
          toast(e.message, "error");
        }
        loadCheckin();
      })
    );
    await renderSupervisions();
    clearInterval(window.__checkinTimer);
    window.__checkinTimer = setInterval(() => {
      const body = document.querySelector("#libBody");
      const on = document.querySelector(".lt-tab.on");
      if (!body || !on || on.dataset.lt !== "checkin") {
        clearInterval(window.__checkinTimer);
        return;
      }
      loadCheckin();
    }, 30000);
  }

  async function renderSupervisions() {
    const box = libBody.querySelector("#supList");
    if (!box) return;
    const slot = currentLibSlot();
    const [start, end] = slot.split("-");
    const [supers, bookings, areas] = await Promise.all([
      api.get("/library/supervisions").catch(() => []),
      api.get("/bookings/my").catch(() => []),
      api.get(`/library/areas?date=${today()}&start=${start}&end=${end}`).catch(() => []),
    ]);
    const total = areas.reduce((n, a) => n + a.total, 0);
    const available = areas.reduce((n, a) => n + a.available, 0);
    const pct = total ? Math.round((available * 100) / total) : 100;
    const allowed = total > 0 && available / total < 0.2;
    const myActive = new Set(
      bookings
        .filter(
          (b) =>
            b.date === today() &&
            b.type === "seat" &&
            ["confirmed", "checked_in", "away"].includes(b.status)
        )
        .map((b) => b.resource_id)
    );
    const candidates = [];
    areas.forEach((a) =>
      (a.seats || []).forEach((s) => {
        if (!s.busy || myActive.has(s.id)) return;
        candidates.push({
          id: s.id,
          room: a.name,
          seat_no: (s.name.split(" ").pop() || "").split("-").pop(),
        });
      })
    );
    const rooms = [...new Set(candidates.map((c) => c.room))];

    const listHtml = supers.length
      ? supers
          .map(
            (s) => `<div class="sup-card">
              <div class="spread"><b>${esc(s.seat_no)} 号 · ${esc(s.room)}</b><span class="tag ${s.status === "active" ? "tag-gold" : s.status === "released" ? "tag-green" : ""}">${s.status === "active" ? "监督中" : s.status === "released" ? "已释放座位" : "对方已回座"}</span></div>
              <div class="muted" style="margin-top:4px;font-size:11.5px">${esc(s.reason)}</div>
              ${s.status === "active" ? `<div class="sup-timer" data-deadline="${esc(s.deadline)}">剩余 <b>--:--</b></div>` : ""}
            </div>`
          )
          .join("")
      : '<div class="muted" style="padding:8px 0">暂无监督记录。</div>';

    const formHtml = `
      <div class="card sup-form-card">
        <div class="spread"><b>发起监督占座</b>
          <span class="tag ${allowed ? "tag-gold" : "tag-green"}">全馆余座 ${available}/${total}（${pct}%）</span></div>
        <div class="muted" style="margin-top:4px;font-size:11.5px">当全馆剩余座位低于 20% 时，可对已预约但无人使用的座位发起监督。不能监督自己的座位。</div>
        ${allowed
          ? `<div class="sup-form-grid" style="margin-top:10px">
              <div class="field"><label>阅览室</label><select class="select" id="supRoom">
                ${rooms.map((r) => `<option value="${esc(r)}">${esc(r)}</option>`).join("")}
              </select></div>
              <div class="field"><label>位置号</label><select class="select" id="supSeat"></select></div>
            </div>
            <div class="field" style="margin-top:8px"><label>监督说明</label><textarea class="input" id="supReason" rows="2" placeholder="例如：该座位已预约，但已超过 40 分钟无人使用"></textarea></div>
            <div class="field" style="margin-top:8px"><label>现场照片</label><input class="input" id="supPhoto" type="file" accept="image/*"></div>
            <div class="muted" style="margin-top:4px;font-size:11px">照片须能看清阅览室与位置号，单张小于 1.5MB。</div>
            <button class="btn btn-primary btn-sm" id="supSubmit" style="margin-top:8px">提交监督占座</button>`
          : '<div class="muted" style="margin-top:8px">当前剩余座位充足，暂不需要监督占座。</div>'}
      </div>`;

    box.innerHTML = formHtml + '<div class="section-title">我的监督记录</div>' + listHtml;

    const seatSel = box.querySelector("#supSeat");
    const roomSel = box.querySelector("#supRoom");
    const fillSeats = () => {
      const room = roomSel.value;
      const opts = candidates.filter((c) => c.room === room);
      seatSel.innerHTML = opts.map((c) => `<option value="${c.id}">${esc(c.seat_no)}</option>`).join("");
    };
    if (allowed) {
      roomSel.addEventListener("change", fillSeats);
      fillSeats();
    }

    box.querySelector("#supSubmit")?.addEventListener("click", async (e) => {
      const btn = e.currentTarget;
      const reason = box.querySelector("#supReason").value.trim();
      const seatId = seatSel.value;
      if (!reason) return toast("请填写监督说明", "error");
      if (!seatId) return toast("请选择被监督的座位", "error");
      const file = box.querySelector("#supPhoto").files[0];
      if (!file) return toast("请上传现场照片", "error");
      if (file.size > 1.5 * 1024 * 1024) return toast("照片请小于 1.5MB", "error");
      btn.disabled = true;
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const c = candidates.find((x) => String(x.id) === String(seatId));
          await api.post("/library/supervise", {
            seat_id: Number(seatId),
            room: c.room,
            seat_no: c.seat_no,
            reason,
            photo: String(reader.result || ""),
            date: today(),
            start,
            end,
          });
          toast("监督已提交：占用者需在 30 分钟内回馆定位签到", "success");
          loadCheckin();
        } catch (err) {
          toast(err.message, "error");
          btn.disabled = false;
        }
      };
      reader.readAsDataURL(file);
    });

    box.querySelectorAll(".sup-timer").forEach((el) => {
      const tick = () => {
        const left = Math.max(0, Math.round((new Date(el.dataset.deadline.replace(" ", "T")) - new Date()) / 1000));
        el.querySelector("b").textContent = `${String(Math.floor(left / 60)).padStart(2, "0")}:${String(left % 60).padStart(2, "0")}`;
      };
      tick();
      setInterval(tick, 1000);
    });
  }

  function draw() {
    if (curTab === "checkin") drawCheckin();
    else drawSeat();
  }
  draw();
}

export async function renderLibraryRoom(root, ctx) {
  const area = ctx.params.get("area") || "";
  const date0 = ctx.params.get("date") || today();
  const start0 = ctx.params.get("start") || "";
  const end0 = ctx.params.get("end") || "";
  const slotsQ = (ctx.params.get("slots") || (start0 && end0 ? `${start0}-${end0}` : "") || "").split(",").filter(Boolean);
  const presetSeat = ctx.params.get("seat") || "";
  let selectedSeat = null;

  root.innerHTML = `
    <div class="page-head">
      <div><div class="page-title">${esc(area)}</div><div class="page-sub">平面图选座 · 一次预约 ${slotsQ.length} 个时段 · 15 分钟内签到</div></div>
      <div class="row">
                <a class="btn btn-ghost btn-sm" href="#/work/library">‹ 返回阅览室</a>
      </div>
    </div>
    <div class="card" style="margin-bottom:10px"><div class="toolbar" style="margin:0">
      <div class="field"><label>日期</label><input class="input" type="date" id="roomDate" value="${date0}" min="${today()}" max="${addDays(2)}"></div>
      <div class="field"><label>时段（可多选，最多 3 个）</label><div class="pill-strip" id="roomSlots"></div></div>
      <button class="btn btn-ghost btn-sm" id="roomRefresh" style="margin-left:auto">↻ 刷新</button>
    </div></div>
    <div class="sm-legend">
      <span><i style="background:#fff;border:1.5px solid #b9c7d9"></i>可选</span>
      <span><i style="background:#1e5eff"></i>已选</span>
      <span><i style="background:#ff6b6b"></i>有人</span>
      <span><i style="background:#e0e0e0"></i>暂离</span>
      <span><i style="background:#ff9f43"></i>监督中</span>
      <span><i style="background:#74c0fc"></i>入口</span>
      <span><i style="background:#e7d8b8"></i>书架</span>
      <span><i style="background:#a5d8ff"></i>窗</span>
      <span><i style="background:#ffd43b"></i>电源</span>
      <span><i style="background:#d8f5a2"></i>绿植</span>
    </div>
    <div id="seatBox"><div class="muted">加载平面图…</div></div>
    <div class="grid-bar" id="seatBar" hidden>
      <div class="grid-bar-info" id="seatBarInfo"></div>
      <button class="btn btn-ghost btn-sm" id="favBtn" hidden>⭐ 设为常用</button>
      <button class="btn btn-primary" id="seatSubmit">确认选座</button>
    </div>`;

  const dateInput = root.querySelector("#roomDate");
  const slotWrap = root.querySelector("#roomSlots");
  const box = root.querySelector("#seatBox");
  const bar = root.querySelector("#seatBar");
  let curSlots = [...slotsQ];

  function renderRoomSlots() {
    slotWrap.innerHTML = LIB_SLOTS.map((s) => {
      const slot = s.join("-");
      const past = slotIsPast(slot, dateInput.value);
      return `<button type="button" class="pill ${curSlots.includes(slot) ? "active" : ""} ${past ? "past" : ""}" data-slot="${slot}" ${past ? "disabled" : ""} title="${past ? "该时段已过，无法预约" : ""}">${s[0]}–${s[1]}</button>`;
    }).join("");
    slotWrap.querySelectorAll(".pill:not([disabled])").forEach((el) =>
      el.addEventListener("click", () => {
        const slot = el.dataset.slot;
        const idx = curSlots.indexOf(slot);
        if (idx >= 0) {
          const remain = curSlots.filter((x) => x !== slot);
          if (!slotsAreContiguous(remain)) {
            toast("移除中间时段会断开连续时长，请从两端移除", "error");
            return;
          }
          curSlots.splice(idx, 1);
        } else {
          if (curSlots.length >= 3) {
            toast("一次最多选 3 个时段", "error");
            return;
          }
          if (!slotsAreContiguous([...curSlots, slot])) {
            toast("时段必须连续选择（如 08:00–12:00 一整段）", "error");
            return;
          }
          curSlots.push(slot);
        }
        renderRoomSlots();
        loadSeats();
      })
    );
  }

  let favIds = new Set();

  async function loadFavIds() {
    try {
      const favs = await api.get(`/library/favorites?date=${dateInput.value}`);
      favIds = new Set(favs.map((f) => f.seat_id));
    } catch (e) {
      favIds = new Set();
    }
  }

  async function loadSeats() {
    selectedSeat = null;
    bar.hidden = true;
    box.style.paddingBottom = "";
    if (!curSlots.length) {
      box.innerHTML = '<div class="bk-empty"><b>请先选择时段</b><span>选择连续时段后再挑选座位。</span></div>';
      return;
    }
    box.innerHTML = '<div class="muted">加载平面图…</div>';
    const slots = curSlots;
    await loadFavIds();
    try {
      const perSlot = await Promise.all(
        slots.map((sl) => {
          const [s0, e0] = sl.split("-");
          return api.get(`/library/areas?date=${dateInput.value}&start=${s0}&end=${e0}`).catch(() => []);
        })
      );
      const areaData = perSlot.map((list) => list.find((a) => a.name === area)).find(Boolean);
      if (!areaData) {
        box.innerHTML = '<div class="empty"><strong>阅览室不存在</strong><a href="#/work/library">返回列表</a></div>';
        return;
      }
      const busyIds = new Set();
      perSlot.forEach((list) => {
        const a = list.find((x) => x.name === area);
        (a?.seats || []).forEach((x) => { if (x.busy) busyIds.add(x.id); });
      });
      const seats = areaData.seats.map((s) => ({ ...s, busy: !!s.busy || busyIds.has(s.id) }));
      const maxX = Math.max(...seats.map((s) => s.x));
      const maxY = Math.max(...seats.map((s) => s.y));
      const cols = maxX + 1;
      const PAD = 0.6;
      const TOP = 1.7;
      const SIDE = 1.5;
      const UNIT = 1;
      const DESK_H = 0.5;
      const CHAIR = 0.68;
      const FOOT = 0.85;
      const RIGHT = 0.55;
      const X = (x) => SIDE + PAD + x * UNIT;
      const Y = (y) => TOP + PAD + y * UNIT;
      const W = SIDE + PAD * 2 + cols * UNIT + RIGHT;
      const H = TOP + PAD * 2 + (maxY + 1) * UNIT + FOOT;
      const ys = [...new Set(seats.map((s) => s.y))].sort((a, b) => a - b);
      const runsOf = (arr) => {
        const out = [];
        let s0 = null;
        let prev = null;
        for (const v of arr) {
          if (s0 === null) {
            s0 = v;
            prev = v;
            continue;
          }
          if (v === prev + 1) {
            prev = v;
            continue;
          }
          out.push([s0, prev]);
          s0 = v;
          prev = v;
        }
        if (s0 !== null) out.push([s0, prev]);
        return out;
      };
      const desks = ys
        .map((y, ri) => {
          const xs = seats.filter((s) => s.y === y).map((s) => s.x).sort((a, b) => a - b);
          return runsOf(xs)
            .map(([a, b], si) => {
              const dx = X(a) - 0.09;
              const dw = (b - a + 1) * UNIT + 0.18;
              return `<rect class="pm-desk" x="${dx.toFixed(2)}" y="${(Y(y) - 0.06).toFixed(2)}" width="${dw.toFixed(2)}" height="${DESK_H}" rx="0.10"/>
                <text class="pm-desk-no" x="${(dx + dw / 2).toFixed(2)}" y="${(Y(y) + DESK_H / 2).toFixed(2)}">${String.fromCharCode(65 + ri)}${si + 1} 桌</text>`;
            })
            .join("");
        })
        .join("");
      const seatMarkup = seats
        .map((s) => {
          const raw = (s.name.split(" ").pop() || "").split("-").pop();
          const m = raw.match(/^([A-Za-z]+)-?(\d+)$/);
          const zone = (m ? m[1] : raw.slice(0, 1)).toUpperCase();
          const num = m ? m[2] : raw.slice(1);
          const st = s.busy ? "busy" : "free";
          const power = !!s.equipment;
          const fav = favIds.has(s.id);
          const cx = X(s.x);
          const cy = Y(s.y) + DESK_H + 0.36;
          return `<g class="pm-seat ${st}" data-seat="${s.id}" data-name="${esc(raw)}" tabindex="${s.busy ? -1 : 0}">
            <rect class="pm-chair" x="${(cx - CHAIR / 2).toFixed(2)}" y="${(cy - CHAIR / 2).toFixed(2)}" width="${CHAIR}" height="${CHAIR}" rx="0.13"/>
            <path class="pm-back" d="M${(cx - 0.17).toFixed(2)} ${(cy - CHAIR / 2 - 0.11).toFixed(2)} h0.34"/>
            <text class="pm-num" x="${cx.toFixed(2)}" y="${cy.toFixed(2)}">${esc(num)}</text>
            ${power ? `<g class="pm-power" transform="translate(${(cx - 0.30).toFixed(2)},${(cy - 0.33).toFixed(2)})"><circle r="0.14"/><path d="M0 -0.075 L0.055 0.01 L-0.01 0.01 L0.045 0.095"/></g>` : ""}
            ${fav ? `<text class="pm-star" x="${(cx + 0.30).toFixed(2)}" y="${(cy + 0.33).toFixed(2)}">★</text>` : ""}
          </g>`;
        })
        .join("");
      const shelfN = Math.max(6, Math.min(12, Math.floor((H - TOP - 1.4) / 1.1)));
      const shelf = `<g class="pm-shelf">
        ${Array.from({ length: shelfN }, (_, i) => `<rect x="0.42" y="${(TOP + 0.4 + i * 1.1).toFixed(2)}" width="0.62" height="0.85" rx="0.05"/>`).join("")}
        <text class="pm-shelf-label" transform="translate(0.26,${(H / 2).toFixed(2)}) rotate(-90)">书架 BOOKSHELF</text>
      </g>`;
      const winN = 3;
      const winH2 = 1.9;
      const winGap = (H - TOP - 1.6 - winN * winH2) / (winN - 1);
      const windows = `<g class="pm-window-group">
        ${Array.from({ length: winN }, (_, i) => {
          const wy = TOP + 0.7 + i * (winH2 + winGap);
          return `<rect class="pm-window-fill" x="${(W - 0.46).toFixed(2)}" y="${wy.toFixed(2)}" width="0.20" height="${winH2.toFixed(2)}" rx="0.03"/>
            <line class="pm-window" x1="${(W - 0.36).toFixed(2)}" y1="${wy.toFixed(2)}" x2="${(W - 0.36).toFixed(2)}" y2="${(wy + winH2).toFixed(2)}"/>`;
        }).join("")}
        <text class="pm-win-label" transform="translate(${(W - 0.62).toFixed(2)},${(H / 2).toFixed(2)}) rotate(-90)">窗 WINDOWS</text>
      </g>`;
      const doorW = 2.2;
      const doorX = W / 2 - doorW / 2;
      const entrance = `<g class="pm-entrance-group">
        <rect class="pm-door-gap" x="${doorX.toFixed(2)}" y="0.02" width="${doorW}" height="0.66"/>
        <path class="pm-door-leaf" d="M${doorX.toFixed(2)} 0.46 L${(doorX + 0.95).toFixed(2)} 1.12"/>
        <path class="pm-door-leaf" d="M${(doorX + doorW).toFixed(2)} 0.46 L${(doorX + doorW - 0.95).toFixed(2)} 1.12"/>
        <text class="pm-entrance" x="${(W / 2).toFixed(2)}" y="1.5">入口 ENTRANCE</text>
      </g>`;
      const service = `<g class="pm-service">
        <rect x="${(W / 2 + doorW / 2 + 0.55).toFixed(2)}" y="0.62" width="2.45" height="0.5" rx="0.08"/>
        <text x="${(W / 2 + doorW / 2 + 1.775).toFixed(2)}" y="0.87">自助借还</text>
      </g>`;
      const plants = [[0.75, 0.85], [W - 0.75, 0.85], [0.75, H - 0.75], [W - 0.75, H - 0.75]]
        .map(([px, py]) => `<circle class="pm-plant" cx="${px.toFixed(2)}" cy="${py.toFixed(2)}" r="0.26"/>`)
        .join("");

      box.innerHTML = `<div class="pm-tools">
          <span class="pm-tools-label">平面示意图</span>
          <button type="button" class="pm-zoom-btn" data-pmzoom="-1" aria-label="缩小">−</button>
          <span class="pm-zoom-val" id="pmZoomVal">100%</span>
          <button type="button" class="pm-zoom-btn" data-pmzoom="1" aria-label="放大">+</button>
          <button type="button" class="pm-zoom-btn pm-zoom-reset" data-pmzoom="0">重置</button>
        </div>
        <div class="pm-wrap"><svg class="pm-plan" viewBox="0 0 ${W.toFixed(2)} ${H.toFixed(2)}" preserveAspectRatio="xMidYMid meet">
          <rect class="pm-floor" x="0" y="0" width="${W.toFixed(2)}" height="${H.toFixed(2)}"/>
          <rect class="pm-wall-outer" x="0.16" y="0.16" width="${(W - 0.32).toFixed(2)}" height="${(H - 0.32).toFixed(2)}" rx="0.20"/>
          <rect class="pm-wall-inner" x="0.34" y="0.34" width="${(W - 0.68).toFixed(2)}" height="${(H - 0.68).toFixed(2)}" rx="0.14"/>
          ${entrance}${windows}${shelf}${service}${desks}${seatMarkup}${plants}
        </svg></div>`;
      let pmZoom = 100;
      const planWrap = box.querySelector(".pm-wrap");
      box.querySelectorAll("[data-pmzoom]").forEach((btn) =>
        btn.addEventListener("click", () => {
          const step = Number(btn.dataset.pmzoom);
          pmZoom = step === 0 ? 100 : Math.max(60, Math.min(300, pmZoom + step * 20));
          planWrap.style.width = `${pmZoom}%`;
          box.querySelector("#pmZoomVal").textContent = `${pmZoom}%`;
        })
      );
      box.querySelectorAll(".pm-seat.free").forEach((el) => {
        el.addEventListener("click", () => {
          box.querySelectorAll(".pm-seat").forEach((x) => x.classList.remove("picked"));
          el.classList.add("picked");
          selectedSeat = { id: el.getAttribute("data-seat"), name: el.getAttribute("data-name") };
          root.querySelector("#seatBarInfo").innerHTML = `已选座位 <b>${esc(selectedSeat.name)}</b><span class="bkb-sub">${esc(dateInput.value)} · ${seatSpanText(curSlots)} 连续 ${curSlots.length} 个时段 · 一次签到</span>`;
          bar.hidden = false;
          box.style.paddingBottom = "88px";
          root.querySelector("#favBtn").hidden = false;
        });
      });
      if (presetSeat) {
        const target = box.querySelector(`.pm-seat.free[data-seat="${CSS.escape(presetSeat)}"]`);
        if (target) {
          target.dispatchEvent(new Event("click"));
          target.scrollIntoView({ behavior: "smooth", block: "center" });
        } else {
          toast("该常用座位在当前时段已被占用，请换个座位或时段", "error");
        }
      }
    } catch (e) {
      box.innerHTML = `<div class="muted">${esc(e.message)}</div>`;
    }
  }

  dateInput.addEventListener("change", async () => {
    curSlots = [];
    renderRoomSlots();
    await loadFavIds();
    await loadSeats();
  });
  renderRoomSlots();
  root.querySelector("#roomRefresh").addEventListener("click", loadSeats);
  root.querySelector("#favBtn").addEventListener("click", async () => {
    if (!selectedSeat) return;
    try {
      const r = await api.post(`/library/favorites/${selectedSeat.id}/toggle`);
      toast(r.favorited ? "⭐ 已设为常用座位" : "已取消收藏", "success");
      await loadFavIds();
      await loadSeats();
    } catch (e) {
      toast(e.message, "error");
    }
  });
  root.querySelector("#seatSubmit").addEventListener("click", async () => {
    if (!selectedSeat) return;
    if (!slotsAreContiguous(curSlots)) {
      toast("时段必须连续，请调整后再提交", "error");
      return;
    }
    const btn = root.querySelector("#seatSubmit");
    btn.disabled = true;
    try {
      const sorted = [...curSlots].sort();
      const start = sorted[0].split("-")[0];
      const end = sorted[sorted.length - 1].split("-")[1];
      await api.post("/bookings", {
        resource_id: Number(selectedSeat.id),
        date: dateInput.value,
        start_at: start,
        end_at: end,
        people: 1,
        purpose: "图书馆自习",
        reservation_key: `lib-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      });
      toast(`已预约 ${start}–${end} 连续时段，正在为你打开签到页`, "success");
      setTimeout(() => {
        location.hash = "#/work/library?tab=checkin";
      }, 600);
    } catch (e) {
      toast(e.message, "error");
    } finally {
      btn.disabled = false;
    }
    await loadSeats();
  });

  await loadFavIds();
  await loadSeats();
}
/* ================= 信息动态 ================= */

export async function renderNews(root, ctx) {
  const meta = await api.get("/news/meta").catch(() => ({ categories: [] }));
  let curCat = ctx.params.get("category") || "";
  let curQ = "";

  root.innerHTML = `
    <div class="detail-hero news-hero">
      <div class="tag">NEWS</div>
      <h1>信息动态</h1>
      <p>师大要闻、学术动态与通知公告，一站式速览校园大小事。</p>
    </div>
    <div class="card news-panel">
      <div class="news-filter">
        <div class="tabs" id="newsTabs"></div>
        <div class="news-filter-right">
          <input class="input" id="newsQ" placeholder="搜索标题关键词…">
        </div>
      </div>
      <div id="newsList" class="news-panel-body"></div>
    </div>`;

  const tabsBox = root.querySelector("#newsTabs");
  const listBox = root.querySelector("#newsList");

  function renderTabs() {
    const cats = [["", "全部"], ...(meta.categories || []).map((c) => [c, c])];
    tabsBox.innerHTML = cats
      .map(([v, label]) => `<a class="tab ${curCat === v ? "active" : ""}" data-cat="${esc(v)}" href="javascript:void(0)">${esc(label)}</a>`)
      .join("");
    tabsBox.querySelectorAll(".tab").forEach((el) =>
      el.addEventListener("click", () => {
        curCat = el.dataset.cat;
        renderTabs();
        loadList();
      })
    );
  }

  async function loadList() {
    const qs = new URLSearchParams();
    if (curCat) qs.set("category", curCat);
    if (curQ) qs.set("q", curQ);
    const rows = await api.get(`/news?${qs}`).catch(() => []);
    if (!rows.length) {
      listBox.innerHTML = `<div class="empty" style="padding:44px 0;text-align:center">暂无符合条件的动态</div>`;
      return;
    }
    const [first, ...rest] = rows;
    listBox.innerHTML = `
      <a class="card nc-feature" href="#/news/detail?id=${first.id}">
        <img src="${newsImage(first.id)}" alt="" style="width:100%;height:230px;object-fit:cover;display:block">
        <div style="padding:16px 18px 18px">
          <div class="nc-tags"><span class="tag tag-blue">${esc(first.category)}</span></div>
          <div style="font-size:17px;font-weight:700;margin-top:8px;line-height:1.55">${esc(first.title)}</div>
          <div class="nc-summary">${esc(first.summary || "")}</div>
          <div class="nc-meta">${esc(first.college)} · ${esc(first.published_at)} · 来源：${esc(first.source || "校方发布")}</div>
        </div>
      </a>
      ${rest
        .map(
          (n) => `<a class="card nc-card" href="#/news/detail?id=${n.id}">
        <img class="nc-thumb" src="${newsImage(n.id)}" alt="">
        <div style="min-width:0">
          <div class="nc-tags"><span class="tag tag-blue">${esc(n.category)}</span></div>
          <div style="font-size:14px;font-weight:600;margin-top:5px;line-height:1.5">${esc(n.title)}</div>
          <div class="nc-summary">${esc(n.summary || "")}</div>
          <div class="nc-meta">${esc(n.college)} · ${esc(n.published_at)}</div>
        </div>
      </a>`
        )
        .join("")}`;
  }

  let qTimer = null;
  root.querySelector("#newsQ").addEventListener("input", (e) => {
    clearTimeout(qTimer);
    qTimer = setTimeout(() => {
      curQ = e.target.value.trim();
      loadList();
    }, 300);
  });

  renderTabs();
  await loadList();
}

export async function renderNewsDetail(root, ctx) {
  const id = ctx.params.get("id");
  const n = await api.get(`/news/${id}`).catch(() => null);
  if (!n) {
    root.innerHTML = `<div class="card" style="padding:44px;text-align:center;color:var(--text-3)">动态不存在或已下线<a class="small" href="#/work/news" style="display:block;margin-top:12px">‹ 返回信息动态</a></div>`;
    return;
  }
  const paras = String(n.content || "").split(/\n+/).filter(Boolean);
  root.innerHTML = `
    <div class="article-wrap">
      <div class="article-crumb"><a href="#/work/news">信息动态</a><span class="sep">/</span>${esc(n.category)}</div>
      <img class="article-cover" src="${newsImage(n.id)}" alt="">
      <div class="article-head">
        <div class="article-title">${esc(n.title)}</div>
        <div class="article-meta">
          <span class="tag tag-blue">${esc(n.category)}</span>
          <span>${esc(n.college)}</span>
          <span>${esc(n.published_at)}</span>
          <span>来源：${esc(n.source || "校方发布")}</span>
        </div>
      </div>
      <div class="article-body">
        ${paras.map((p) => `<p>${esc(p)}</p>`).join("")}
        ${(n.images || []).length ? `<div class="article-photos">${n.images.map((img) => `<img src="${esc(img)}" alt="">`).join("")}</div>` : ""}
      </div>
      <div class="article-foot">
        ${n.source_url ? `<a class="small" href="${esc(n.source_url)}" target="_blank" rel="noopener">查看原文 ›</a>` : "<span></span>"}
        <a class="small" href="#/work/news">‹ 返回信息动态</a>
      </div>
      ${
        (n.related || []).length
          ? `<div class="section-title" style="margin-top:28px">相关推荐</div>
        <div class="news-list">${n.related
          .map(
            (r) => `<a class="card rl-card" href="#/news/detail?id=${r.id}">
              <div class="rl-title">${esc(r.title)}</div>
              <div class="nc-meta">${esc(r.category)} · ${esc(r.published_at)}</div>
            </a>`
          )
          .join("")}</div>`
          : ""
      }
    </div>`;
}

/* ================= 资源平台 ================= */

const RES_TONES = ["ico-indigo", "ico-violet", "ico-cyan", "ico-green", "ico-blue", "ico-orange", "ico-pink", "ico-teal", "ico-gold"];
const RES_ICONS = [
  [/教务|课程|考试|成绩|选课/, "📚"],
  [/图书|文献|知网|数据库|论文/, "📖"],
  [/邮箱|邮件/, "📮"],
  [/vpn/i, "🔐"],
  [/一卡通|卡务/, "💳"],
  [/就业|招聘|求职|创业/, "💼"],
  [/研究生/, "🎓"],
  [/财务|缴费|支付/, "💰"],
  [/心理|咨询/, "💛"],
  [/体育|场馆|体测/, "🏸"],
  [/学工|学工系统|奖惩/, "🧑‍🎓"],
  [/网络|上网|校园网/, "🌐"],
];

function resIcon(name) {
  for (const [re, ico] of RES_ICONS) if (re.test(name)) return ico;
  return "🔗";
}

export async function renderResources(root, ctx) {
  const rows = await api.get("/resource-links").catch(() => []);
  const cats = [...new Set(rows.map((r) => r.category).filter(Boolean))];
  let curCat = "";
  let curQ = "";

  root.innerHTML = `
    <div class="res-hero">
      <div class="res-hero-art"><svg viewBox="0 0 200 160" fill="none">
        <rect x="30" y="30" width="60" height="44" rx="9" stroke="#8fdcff" stroke-opacity=".5" stroke-width="1.6"/>
        <rect x="104" y="22" width="60" height="44" rx="9" stroke="#f0cf94" stroke-opacity=".55" stroke-width="1.6"/>
        <rect x="52" y="92" width="60" height="44" rx="9" stroke="#dff2ff" stroke-opacity=".4" stroke-width="1.6"/>
        <path d="M60 52h20M60 62h12M134 42h20M134 52h12M82 112h20M82 122h12" stroke="#fff" stroke-opacity=".35" stroke-width="3" stroke-linecap="round"/>
        <path d="M90 52h14M112 88l10 10" stroke="#8fdcff" stroke-opacity=".45" stroke-width="1.6"/>
        <circle cx="160" cy="118" r="16" stroke="#8fdcff" stroke-opacity=".5" stroke-width="1.6"/>
        <path d="M154 118h12M160 112v12" stroke="#8fdcff" stroke-opacity=".6" stroke-width="1.6" stroke-linecap="round"/>
      </svg></div>
      <h1>资源平台</h1>
      <p>汇聚学校官方系统与常用服务入口，统一认证与校园网要求一目了然，点击即可直达。</p>
      <div class="res-search">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
        <input id="resQ" placeholder="搜索平台名称或说明…">
      </div>
    </div>
    <div class="res-tabs" id="resTabs"></div>
    <div class="res-grid" id="resGrid"></div>`;

  const tabsBox = root.querySelector("#resTabs");
  const gridBox = root.querySelector("#resGrid");

  function renderTabs() {
    const all = [["", "全部"], ...cats.map((c) => [c, c])];
    tabsBox.innerHTML = all
      .map(([v, label]) => {
        const cnt = v ? rows.filter((r) => r.category === v).length : rows.length;
        return `<button type="button" class="res-tab ${curCat === v ? "active" : ""}" data-cat="${esc(v)}">${esc(label)}<span>${cnt}</span></button>`;
      })
      .join("");
    tabsBox.querySelectorAll(".res-tab").forEach((el) =>
      el.addEventListener("click", () => {
        curCat = el.dataset.cat;
        renderTabs();
        renderGrid();
      })
    );
  }

  function renderGrid() {
    const q = curQ.toLowerCase();
    const list = rows.filter(
      (r) => (!curCat || r.category === curCat) && (!q || `${r.name}${r.note || ""}`.toLowerCase().includes(q))
    );
    if (!list.length) {
      gridBox.innerHTML = `<div class="card" style="padding:44px;text-align:center;color:var(--text-3);grid-column:1/-1">暂无匹配的平台入口</div>`;
      return;
    }
    gridBox.innerHTML = list
      .map(
        (r, i) => `<a class="res-card" href="${esc(r.url)}" target="_blank" rel="noopener">
        <div class="res-ico ${RES_TONES[i % RES_TONES.length]}">${resIcon(r.name)}</div>
        <div class="res-body">
          <div class="res-name">${esc(r.name)}</div>
          <div class="res-note">${esc(r.note || "学校官方服务平台")}</div>
          <div class="res-flags">
            ${r.category ? `<span class="res-flag res-flag-cat">${esc(r.category)}</span>` : ""}
            ${r.need_login ? `<span class="res-flag">统一认证</span>` : ""}
            ${r.need_campus_net ? `<span class="res-flag">校园网</span>` : ""}
            ${r.status && r.status !== "online" ? `<span class="res-flag">维护中</span>` : ""}
            ${r.audience ? `<span class="res-flag">${esc(r.audience)}</span>` : ""}
          </div>
        </div>
        <span class="res-go">›</span>
      </a>`
      )
      .join("");
  }

  root.querySelector("#resQ").addEventListener("input", (e) => {
    curQ = e.target.value.trim();
    renderGrid();
  });

  renderTabs();
  renderGrid();
}
