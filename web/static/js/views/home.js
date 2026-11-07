import { api } from "../api.js";
import { esc, money, statusBadge, toast } from "../ui.js";

const SLIDES = [
  { img: "/static/img/slide-1.webp", caption: "校门 · 泉山校区主入口" },
  { img: "/static/img/slide-2.webp", caption: "图书馆 · 自习与借阅" },
  { img: "/static/img/slide-3.webp", caption: "立春 · 校园初绿" },
  { img: "/static/img/slide-4.webp", caption: "秋分 · 银杏时节" },
  { img: "/static/img/slide-5.webp", caption: "体育馆 · 校运会主场" },
  { img: "/static/img/slide-6.webp", caption: "寒露 · 晨光里的校园" },
  { img: "/static/img/slide-7.webp", caption: "游泳馆 · 体育课与社团" },
  { img: "/static/img/slide-8.webp", caption: "立秋 · 金色校园" },
];

const NEWS_IMAGES = [
  "/static/img/slide-1.webp",
  "/static/img/slide-2.webp",
  "/static/img/slide-5.webp",
  "/static/img/slide-4.webp",
  "/static/img/slide-6.webp",
  "/static/img/slide-3.webp",
  "/static/img/slide-8.webp",
  "/static/img/slide-7.webp",
];

const QUICK_CHIPS = [
  ["约个教室", "明天下午帮我约一个 4 人的研讨教室"],
  ["带我去图书馆", "带我去敬文图书馆，顺便看看空座位"],
  ["找人一起自习", "今晚 7 点找一个人一起在图书馆自习"],
  ["看看能省多少", "看看我这个月省了多少，有哪些值得拼单"],
];

function photoCard(key, title, sub) {
  const grads = {
    gate: "linear-gradient(160deg,#cfe4f8 0%,#9ec3ea 52%,#7aa6d6 100%)",
    library: "linear-gradient(160deg,#dcebe2 0%,#a9c9b8 52%,#7fae98 100%)",
    field: "linear-gradient(160deg,#f7e7c8 0%,#f0cf94 52%,#db9f63 100%)",
    campus: "linear-gradient(160deg,#e4ddf2 0%,#c3b4dd 52%,#a38fc8 100%)",
  };
  return `<div class="photo-card" style="background:${grads[key] || grads.campus}">
    <div class="photo-card-sun"></div>
    <img src="/static/img/campus-${key}.jpg" alt="${esc(title)}" onerror="this.remove()" loading="lazy">
    <div class="photo-overlay">
      <div class="photo-title">${esc(title)}</div>
      <div class="photo-sub">${esc(sub)}</div>
    </div>
  </div>`;
}

function metricMap(metrics) {
  return Object.fromEntries(metrics.map((m) => [m.key, m]));
}

function metricCard(m, accent = false) {
  if (!m || m.status === "pending") return "";
  return `<div class="stat"><div class="stat-num">${esc(m.value)}<span class="unit">${esc(m.unit)}</span></div>
    <div class="stat-label">${esc(m.label)}</div></div>`;
}

function calendarTimeline(events) {
  const sorted = events
    .filter((e) => e.status !== "inferred")
    .sort((a, b) => a.start.localeCompare(b.start));
  return `<div class="timeline">${sorted
    .map(
      (e) => `<div class="timeline-item">
        <div class="timeline-date">${esc(e.start)}${e.end && e.end !== e.start ? ` 至 ${esc(e.end)}` : ""}</div>
        <div class="timeline-title">${esc(e.title)}</div>
      </div>`
    )
    .join("")}</div>`;
}

/* ---------------- v2 封面组件 ---------------- */

const TILE_ICONS = {
  nav: '<svg viewBox="0 0 24 24"><path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11Z"/><circle cx="12" cy="10" r="2.6"/></svg>',
  book: '<svg viewBox="0 0 24 24"><rect x="3.5" y="5" width="17" height="15" rx="2.4"/><path d="M3.5 10h17M8 3v4M16 3v4"/><path d="M8.5 14.5h3"/></svg>',
  partner: '<svg viewBox="0 0 24 24"><circle cx="9" cy="9" r="3"/><circle cx="17" cy="10.5" r="2.4"/><path d="M3.5 19.5c.6-2.8 2.7-4.2 5.5-4.2s4.9 1.4 5.5 4.2"/><path d="M15 15.6c2.2.1 3.6 1.3 4 3.4"/></svg>',
  save: '<svg viewBox="0 0 24 24"><path d="M5 8h14l-1.4 12.2a1.6 1.6 0 0 1-1.6 1.4H8a1.6 1.6 0 0 1-1.6-1.4L5 8Z"/><path d="M8.6 8V6.2a3.4 3.4 0 0 1 6.8 0V8"/></svg>',
  doc: '<svg viewBox="0 0 24 24"><path d="M5 4h9l5 5v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4Z"/><path d="M14 4v5h5"/><path d="M8.5 13h7M8.5 16.5h4"/></svg>',
  me: '<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="3.6"/><path d="M4.5 20c1.4-3.6 4-5.2 7.5-5.2s6.1 1.6 7.5 5.2"/></svg>',
  fix: '<svg viewBox="0 0 24 24"><path d="M14.7 6.3a4.5 4.5 0 0 0-6 5.6L3 17.6V21h3.4l5.7-5.7a4.5 4.5 0 0 0 5.6-6L14.5 12l-2.5-2.5 2.7-3.2Z"/></svg>',
  library: '<svg viewBox="0 0 24 24"><path d="M6 11V7a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v4"/><path d="M4 11h16v5H4z"/><path d="M7 16v4M17 16v4"/><path d="M9.5 7.5h5"/></svg>',
};

/* 个人管理 · 可视化卡片 */
function selfStatTile({ pending, doneToday, focusMin, week }) {
  const total = pending + doneToday;
  const rate = total ? Math.round((doneToday / total) * 100) : 0;
  const CIRC = 2 * Math.PI * 15.9155;
  const days = week.days || [];
  const maxFocus = Math.max(25, ...days.map((d) => d.focus || 0));
  const bars = days
    .map((d) => {
      const f = d.focus || 0;
      const h = f ? Math.max(10, Math.round((f / maxFocus) * 46)) : 3;
      const tip = f
        ? `${d.date.slice(5)} · 专注 ${f} 分钟${d.done ? ` · 完成 ${d.done} 项` : ""}`
        : `${d.date.slice(5)} · 无专注记录`;
      return `<div class="wbar-col" title="${esc(tip)}">
        <i class="wbar${d.is_today ? " today" : ""}${f ? "" : " empty"}" style="height:${h}px"></i>
        <span class="wbar-lb${d.is_today ? " today" : ""}">${esc(d.label)}</span>
      </div>`;
    })
    .join("");

  return `<div class="tile self-stat-tile">
    <div class="top">
      <div class="ic o">${TILE_ICONS.me}</div>
      <div><div class="nm">个人管理</div><div class="sub">任务 · 专注 · 记录</div></div>
      <a class="ai-mini" href="#/assistant?q=看看我今天的安排" title="问苏小师">问</a>
    </div>
    <div class="ss-viz">
      <a class="ss-ring" href="#/life/self/control" title="今日任务完成率 ${rate}%">
        <svg viewBox="0 0 36 36">
          <circle class="ss-ring-bg" cx="18" cy="18" r="15.9155"/>
          <circle class="ss-ring-fg" cx="18" cy="18" r="15.9155" style="stroke-dasharray:${CIRC};stroke-dashoffset:${CIRC * (1 - rate / 100)}"/>
        </svg>
        <b>${rate}<i>%</i></b>
      </a>
      <div class="ss-nums">
        <a href="#/life/self/control"><b>${pending}</b><span>待办</span></a>
        <a href="#/life/self/control?tab=focus"><b>${focusMin}</b><span>专注分</span></a>
      </div>
      ${days.length ? `<div class="ss-week">
        <div class="wbar-row">${bars}</div>
      </div>` : ""}
    </div>
    <div class="acts">
      <a class="go" href="#/life/self/control">去管理 →</a>
    </div>
  </div>`;
}

/* 网易云风格轮播 */
function initNxHero(root) {
  const slides = root.querySelectorAll(".nx-slide");
  const dots = root.querySelectorAll(".nx-dot");
  const caption = root.querySelector("#nxCaption");
  if (!slides.length) return;
  if (window.__nxTimer) clearInterval(window.__nxTimer);
  let cur = 0;
  const ensureBg = (el) => {
    if (el && el.dataset.bg && !el.style.backgroundImage) {
      el.style.backgroundImage = `url('${el.dataset.bg}')`;
    }
  };
  const preload = (el) => {
    if (el && el.dataset.bg && !el.style.backgroundImage) {
      const img = new Image();
      img.src = el.dataset.bg;
    }
  };
  const go = (i) => {
    cur = (i + slides.length) % slides.length;
    ensureBg(slides[cur]);
    preload(slides[(cur + 1) % slides.length]);
    slides.forEach((s, k) => s.classList.toggle("active", k === cur));
    dots.forEach((d, k) => d.classList.toggle("active", k === cur));
    if (caption) caption.textContent = SLIDES[cur].caption;
  };
  const restart = () => {
    clearInterval(window.__nxTimer);
    window.__nxTimer = setInterval(() => go(cur + 1), 5200);
  };
  dots.forEach((d) => d.addEventListener("click", () => { go(Number(d.dataset.nx)); restart(); }));
  root.querySelector(".nx-arrow.prev").addEventListener("click", () => { go(cur - 1); restart(); });
  root.querySelector(".nx-arrow.next").addEventListener("click", () => { go(cur + 1); restart(); });
  restart();
}

function tile(key, cls, name, sub, statHtml, goText, goHref) {
  return `<div class="tile">
    <div class="top">
      <div class="ic ${cls}">${TILE_ICONS[key]}</div>
      <div><div class="nm">${esc(name)}</div><div class="sub">${esc(sub)}</div></div>
    </div>
    <div class="stat">${statHtml}</div>
    <div class="acts">
      <a class="go" href="${goHref}">${esc(goText)} →</a>

    </div>
  </div>`;
}

function aptCard(b) {
  const hint = {
    pending_approval: ["审批中，通过后可签到", "查看 →"],
    confirmed: ["到期未签到将自动释放", "签到 →"],
    checked_in: ["使用中 · 到时间请记得释放", "详情 →"],
    completed: ["已完成 · 时长已记录", "再约 →"],
    cancelled: ["已取消", "详情 →"],
    rejected: ["未通过审批", "详情 →"],
    no_show: ["超时未签到已释放", "再约 →"],
  }[b.status] || ["", "详情 →"];
  const dateLabel = b.date === todayStr() ? "今天" : b.date.slice(5).replace("-", "/");
  return `<a class="apt" href="#/me">
    <div class="l1">${esc(b.resource_name)}${statusBadge(b.status)}</div>
    <div class="l2">${dateLabel} ${esc(b.start_at)}-${esc(b.end_at)} · ${b.people} 人</div>
    <div class="l3"><span>${hint[0]}</span><span class="act">${hint[1]}</span></div>
  </a>`;
}

let TODAY_CACHE = "";

function todayStr() {
  if (TODAY_CACHE) return TODAY_CACHE;
  const d = new Date();
  TODAY_CACHE = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return TODAY_CACHE;
}

export async function render(root, ctx) {
  const [data, self, allTasks, buddy, savings, bookings, areas, grid, weekly, dealOv] = await Promise.all([
    api.get("/home"),
    api.get("/self/control/overview").catch(() => null),
    api.get("/self/control/tasks").catch(() => []),
    api.get("/buddy/posts").catch(() => []),
    api.get("/savings/summary").catch(() => ({ saved: 0 })),
    api.get("/bookings/my").catch(() => []),
    api.get("/library/areas").catch(() => []),
    api.get(`/classrooms/grid?date=${todayStr()}`).catch(() => null),
    api.get("/self/control/weekly-stats").catch(() => null),
    api.get("/deal/overview").catch(() => null),
  ]);
  const weekStats =
    weekly && Array.isArray(weekly.days) && weekly.days.length
      ? weekly
      : { days: [], focus_total: 0, done_total: 0 };

  const m = metricMap(data.metrics);
  const week = data.week;

  // 四宫格实时数据
  const seatAvail = areas.reduce((s, a) => s + a.available, 0);
  const freeRooms = grid ? grid.rooms.filter((r) => r.cells.some((c) => c.status === "free")).length : 0;
  const buddyOpen = buddy.filter((p) => p.status === "open").length;
  const savedYuan = money(savings.saved || 0);
  const dealPending = dealOv && Array.isArray(dealOv.plans) ? dealOv.plans.length : 0;

  // 自我控制横幅数据
  const today = todayStr();
  const pending = self ? self.tasks.filter((t) => ["planned", "partial"].includes(t.status)).length : 0;
  const doneToday = allTasks.filter(
    (t) => t.status === "done" && (t.completed_at || "").slice(0, 10) === today
  ).length;
  const totalToday = pending + doneToday;
  const focusMin = self ? self.focus.minutes : 0;
  const blockers = self ? self.blockers.length : 0;
  const selfRate = totalToday ? Math.round((doneToday / totalToday) * 100) : 0;

  // 我的预约滑动条（未来优先，含进行中）
  const upcoming = bookings
    .filter((b) => !["cancelled", "rejected", "no_show", "completed"].includes(b.status) || b.date === today)
    .sort((a, b) => (a.date + a.start_at).localeCompare(b.date + b.start_at))
    .slice(0, 8);

  const feat = data.news.filter((n) => n.category !== "通知公告");
  const notices = data.news.filter((n) => n.category === "通知公告");
  const headline = feat[0];
  const rest = feat.slice(1, 6);
  const stats = ["campuses", "colleges", "majors", "teachers", "undergrads", "postgrads"]
    .map((k) => m[k])
    .filter((x) => x && x.status !== "pending");

root.innerHTML = `
    <section class="nx-hero" id="nxHero">
      <div class="nx-track">
        ${SLIDES.map((s, i) => `<div class="nx-slide ${i === 0 ? "active" : ""}" ${i === 0 ? `style="background-image:url('${s.img}')"` : `data-bg="${esc(s.img)}"`}></div>`).join("")}
      </div>
      <div class="nx-shade"></div>
      <div class="nx-info">
        <div class="nx-tag">${esc(week.today)} ${esc(week.weekday)} · 第 ${week.week} 周 · ${esc(currentCampus())}</div>
        <h1 class="nx-title">${esc(data.school.name)}<span>${esc(data.school.motto)}</span></h1>
        <div class="nx-caption" id="nxCaption">${esc(SLIDES[0].caption)}</div>
      </div>
      <div class="nx-dots">
        ${SLIDES.map((s, i) => `<button class="nx-dot ${i === 0 ? "active" : ""}" data-nx="${i}" aria-label="第 ${i + 1} 张"></button>`).join("")}
      </div>
      <button class="nx-arrow prev" aria-label="上一张">‹</button>
      <button class="nx-arrow next" aria-label="下一张">›</button>
    </section>

    <div class="zone">
      <div class="zone-head"><b>工作区</b><small>预约 · 办事 · 个人</small><a class="lnk" href="#/work">进入工作区 →</a></div>
      <div class="tile-grid tile-grid-4">
        ${tile("book", "g", "空教室预约", "教室 × 节次", `今日可约 <b class="g">${freeRooms}</b> 间`,
    "去预约", "#/work/classroom")}
        ${tile("library", "b", "图书馆预约", "常用座位 · 阅览室选座", `当前空座 <b>${seatAvail}</b> 个`,
    "去选座", "#/work/library")}
        ${tile("doc", "v", "文件识别", "字段提取 · 核查匹配", `支持 PDF · 扫描件 · Word`,
    "去识别", "#/office")}
        ${selfStatTile({ pending, doneToday, focusMin, week: weekStats })}
      </div>
    </div>

    <div class="zone">
      <div class="zone-head"><b>生活区</b><small>导航 · 社交 · 省钱 · 报修</small><a class="lnk" href="#/life">进入生活区 →</a></div>
      <div class="tile-grid tile-grid-4">
        ${tile("nav", "c", "校园导航", "真实地图 · 步行路线", `常用 <b>敬文图书馆</b>`,
    "带我去", "#/life/nav")}
        ${tile("partner", "y", "找搭子", "吃饭 · 自习 · 健身 · 考研", `进行中 <b>${buddyOpen}</b>个 · 今晚可约`,
    "找搭子", "#/life/buddy")}
        ${tile("save", "p", "省一省", "三思而后买", `待决策购买计划 <b>${dealPending}</b> 个`,
    "去省钱", "#/life/deal")}
        ${tile("fix", "r", "报修", "宿舍 · 设施 · 公共区域", `一处提交 · 全程可查`,
    "去报修", "#/repair")}
      </div>
    </div>

  `;


  // 网易云风格轮播
  initNxHero(root);

}

function currentCampus() {
  return localStorage.getItem("campus") || "泉山校区";
}

function metricCardText(m, key) {
  const item = m[key];
  if (!item || item.status === "pending" || !item.value) return "暂无公开数据";
  return item.value;
}