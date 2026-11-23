import { api } from "./api.js?v=20261124a";
import { applyTheme, closeModal, esc, loading, modal, toast } from "./ui.js?v=20261124a";
import { render as home } from "./views/home.js?v=20261124a";
import { renderAbout, renderFaculty, renderCampus } from "./views/home-detail.js?v=20261124a";
import { render as workHome } from "./views/work.js?v=20261124a";
import { renderClassroom } from "./views/work.js?v=20261124a";
import { renderLibrary } from "./views/work.js?v=20261124a";
import { renderResources } from "./views/work.js?v=20261124a";
import { renderNews } from "./views/work.js?v=20261124a";
import { renderNewsDetail } from "./views/work.js?v=20261124a";
import { renderLibraryRoom } from "./views/work.js?v=20261124a";
import { render as office } from "./views/office.js?v=20261124a";
import { render as lifeHome } from "./views/life.js?v=20261124a";
import { renderNav } from "./views/nav.js?v=20261124a";
import { renderActivities, renderMyActivities, renderActivityNew, renderActivityDetail } from "./views/buddy-activity.js?v=20261124a";
import { renderBuddyMessages } from "./views/buddy-messages.js?v=20261124a";
import { renderDeal } from "./views/life.js?v=20261124a";
import { renderDealNew, renderDealPlan } from "./views/deal.js?v=20261124a";

import { render as selfControl } from "./views/self-control.js?v=20261124a";
import { render as assistant } from "./views/assistant.js?v=20261124a";
import { render as me, renderBookings, renderSettings } from "./views/me.js?v=20261124a";
import { render as repair } from "./views/repair.js?v=20261124a";
import { render as hub } from "./views/hub.js?v=20261124a";

const routes = {
  "/home": { title: "首页", crumb: "今日工作台", view: home },
  "/hub": { title: "通道", crumb: "全量能力目录", view: hub },
  "/home/about": { title: "学校概况", crumb: "首页 / 学校概况", view: renderAbout },
  "/home/faculty": { title: "师资与办学成就", crumb: "首页 / 师资与成就", view: renderFaculty },
  "/home/campus": { title: "校区与 VR", crumb: "首页 / 校区", view: renderCampus },
  "/work": { title: "工作区", crumb: "预约 · 审批", view: workHome },
  "/work/classroom": { title: "空教室预约", crumb: "工作区 / 空教室", view: renderClassroom },
  "/work/library": { title: "图书馆预约", crumb: "工作区 / 图书馆", view: renderLibrary },
  "/work/library/room": { title: "图书馆选座", crumb: "工作区 / 图书馆选座", view: renderLibraryRoom },
  "/work/resources": { title: "资源平台", crumb: "学校平台与外链", view: renderResources },
  "/resources": { title: "资源平台", crumb: "学校平台与外链", view: renderResources },
  "/work/news": { title: "信息动态", crumb: "师大要闻与通知", view: renderNews },
  "/news/detail": { title: "动态详情", crumb: "信息动态 / 详情", view: renderNewsDetail },
  "/office": { title: "文件识别", crumb: "字段提取 · 核查匹配", view: office },
  "/life": { title: "生活区", crumb: "导航 · 搭子 · 省钱 · 互助", view: lifeHome },
  "/life/nav": { title: "校园导航", crumb: "生活区 / 导航", view: renderNav },
  "/life/buddy": { title: "找搭子", crumb: "生活区 / 找搭子", view: renderActivities },
  "/life/buddy/mine": { title: "我的活动", crumb: "找搭子 / 我的活动", view: renderMyActivities },
  "/life/buddy/messages": { title: "申请与消息", crumb: "找搭子 / 申请与消息", view: renderBuddyMessages },
  "/life/buddy/new": { title: "发布活动", crumb: "找搭子 / 发布活动", view: renderActivityNew },
  "/life/buddy/activity": { title: "活动详情", crumb: "找搭子 / 活动详情", view: renderActivityDetail },
  "/life/deal": { title: "省一省", crumb: "生活区 / 省一省", view: renderDeal },
  "/life/deal/new": { title: "发起购买计划", crumb: "省一省 / 新建计划", view: renderDealNew },
  "/life/deal/plan": { title: "购买计划", crumb: "省一省 / 计划详情", view: renderDealPlan },

  "/life/self": { title: "Self-Control", crumb: "自我控制", view: selfControl },
  "/life/self/control": { title: "Self-Control", crumb: "自我控制", view: selfControl },
  "/me/self": { title: "Self-Control", crumb: "自我控制", view: selfControl },
  "/me/control": { title: "Self-Control", crumb: "自我控制", view: selfControl },
  "/assistant": { title: "苏小师", crumb: "校园助手", view: assistant },
  "/me": { title: "我的", crumb: "个人事务中心", view: me },
  "/me/bookings": { title: "我的预约", crumb: "我的 / 预约", view: renderBookings },
  "/me/settings": { title: "设置", crumb: "我的 / 设置", view: renderSettings },

  "/repair": { title: "报修", crumb: "宿舍 · 设施 · 公共区域", view: repair },
};

function parseHash() {
  const raw = (location.hash || "#/home").slice(1);
  const [path, query = ""] = raw.split("?");
  return { path: path || "/home", params: new URLSearchParams(query) };
}

export function navigate(to) {
  if (window.__focusGuard) {
    toast("请保持专注，不要随意离开。若要离开，需点击暂停时钟", "error");
    return;
  }
  if (!to.startsWith("#")) to = `#${to}`;
  location.hash = to;
}

function setActive(path) {
  document.querySelectorAll("[data-route]").forEach((el) => {
    const route = el.getAttribute("data-route").slice(1);
    let active = false;
    if (route === "/home") active = path === "/home" || path.startsWith("/home/");
    else if (route === "/work") active = (path === "/work" || path.startsWith("/work/")) && path !== "/work/news" && path !== "/work/resources";
    else if (route === "/assistant") active = path === "/assistant";
    else active = path === route || path.startsWith(route + "/");
    el.classList.toggle("active", active);
  });
}

function errorCard(error) {
  return `<div class="card"><div class="card-title">页面加载失败</div>
    <div class="card-desc">${esc(error.message || "请稍后重试")}</div>
    <div style="margin-top:12px"><button class="btn btn-primary" onclick="location.reload()">重新加载</button></div>
  </div>`;
}

let navStack = [];
let lastHash = location.hash || "#/home";
let suppressPush = false;

async function renderRoute() {
  const { path, params } = parseHash();
  if (!routes[path]) {
    location.replace(location.pathname + location.search + "#/home");
    return;
  }
  const route = routes[path];
  const view = document.getElementById("view");
  document.title = `${route.title} · 苏小师`;
  // 跳转栈：一级页清空栈，二级页压入“来路页”（用于顶栏返回按钮）
  const FIRST_PAGES = ["/home", "/hub", "/assistant", "/me", "/work", "/life", "/resources"];
  if (FIRST_PAGES.includes(path)) navStack = [];
  else if (!suppressPush && lastHash !== location.hash) navStack.push(lastHash);
  suppressPush = false;
  lastHash = location.hash;
  const backBtn = document.getElementById("backBtn");
  if (backBtn) backBtn.hidden = navStack.length === 0;
  setActive(path);
  document.getElementById("sidebar").classList.remove("open");
  view.innerHTML = loading();
  window.scrollTo({ top: 0, behavior: "instant" });
  try {
    await route.view(view, { params, navigate });
  } catch (error) {
    console.error(error);
    view.innerHTML = errorCard(error);
  }
}

function openSearch() {
  modal({
    title: "搜索校园",
    body: `<div class="field"><label>地点、别名或关键词</label>
      <input class="input" id="globalSearch" placeholder="例如：图书馆、21世纪大楼、一食堂" autofocus></div>
      <div id="searchResults" style="margin-top:14px">${'<div class="muted">输入地点名或别名，支持模糊匹配。</div>'}</div>`,
    hideOk: true,
    cancelText: "关闭",
  });
  const input = document.getElementById("globalSearch");
  const results = document.getElementById("searchResults");
  let timer = null;
  input.addEventListener("input", () => {
    clearTimeout(timer);
    timer = setTimeout(async () => {
      const q = input.value.trim();
      if (!q) return;
      try {
        const rows = await api.get(`/places/search?q=${encodeURIComponent(q)}`);
        if (!rows.length) {
          results.innerHTML = `<div class="muted">没有找到“${esc(q)}”。可以到导航页提交纠错。</div>`;
          return;
        }
        results.innerHTML = rows
          .map(
            (p) => `<div class="card" style="padding:12px;margin-bottom:8px;cursor:pointer" data-place="${p.id}">
              <div class="spread"><strong>${esc(p.name)}</strong></div>
              <div class="muted">${esc(p.alias || "无别名")} · ${esc(p.entrance || "")}</div>
            </div>`
          )
          .join("");
        results.querySelectorAll("[data-place]").forEach((el) => {
          el.addEventListener("click", () => {
            closeModal();
            navigate(`/life/nav?to=${el.getAttribute("data-place")}`);
          });
        });
      } catch (e) {
        results.innerHTML = `<div class="muted">${esc(e.message)}</div>`;
      }
    }, 220);
  });
  setTimeout(() => input.focus(), 80);
}

document.getElementById("menuBtn").addEventListener("click", () => {
  document.getElementById("sidebar").classList.toggle("open");
});
document.getElementById("menuBtnM").addEventListener("click", () => {
  document.getElementById("sidebar").classList.toggle("open");
});
document.getElementById("searchBtn").addEventListener("click", openSearch);

/* ================= 消息中心：红点 + 8 秒弹窗 + 免打扰 + 消息面板 ================= */

const MSG_META = {
  上课: { icon: "📘", cls: "msg-c-course" },
  待办: { icon: "✓", cls: "msg-c-todo" },
  新闻: { icon: "📰", cls: "msg-c-news" },
  省钱: { icon: "💰", cls: "msg-c-save" },
  搭子: { icon: "👥", cls: "msg-c-buddy" },
  预约: { icon: "📅", cls: "msg-c-book" },
};

let msgState = { messages: [], unread: 0, playing: false, categories: [] };


function goToActionUrl(url) {
  if (!url) return;
  if (url.startsWith("#") || url.startsWith("/")) {
    // 本系统链接：走 hash 路由，浏览器后退可回上一页
    location.hash = url.startsWith("#") ? url.slice(1) : url;
  } else {
    window.open(url, "_blank", "noopener");
  }
}

function renderMsgDot() {
  const dot = document.getElementById("msgDot");
  if (!dot) return;
  dot.hidden = msgState.unread === 0;
  dot.textContent = msgState.unread > 99 ? "99+" : String(msgState.unread);
}

async function loadMessages() {
  try {
    const data = await api.get("/messages");
    msgState.messages = data.messages || [];
    msgState.unread = data.unread || 0;
    msgState.categories = data.categories || Object.keys(MSG_META);
    renderMsgDot();
    return data;
  } catch (e) {
    return null;
  }
}

function markRead(id) {
  const m = msgState.messages.find((x) => x.id === id);
  if (m && !m.read) {
    m.read = true;
    msgState.unread = Math.max(0, msgState.unread - 1);
    renderMsgDot();
    api.post(`/messages/${id}/read`).catch(() => {});
  }
}

/* 未读弹窗：每个 8 秒依次弹出；点击已读并打开消息中心；专注屏蔽时不弹 */
function playUnreadPopups() {
  if (msgState.playing) return;
  const fm = window.__focusMode;
  const blocked = fm && fm.active ? fm.blocked : [];
  const queue = msgState.messages.filter((m) => !m.read && !blocked.includes(m.category));
  if (!queue.length) return;
  msgState.playing = true;
  let i = 0;

  const showNext = () => {
    if (i >= queue.length) {
      msgState.playing = false;
      return;
    }
    const m = queue[i++];
    const meta = MSG_META[m.category] || {};
    const el = document.createElement("div");
    el.className = "msg-popup";
    el.innerHTML = `
      <div class="mp-ico ${meta.cls || ""}">${meta.icon || "🔔"}</div>
      <div class="mp-body">
        <div class="mp-head"><span class="mp-cat">${esc(m.category)}</span><span class="mp-time">${esc((m.created_at || "").slice(5, 16))}</span></div>
        <div class="mp-title">${esc(m.title)}</div>
        <div class="mp-content">${esc(m.content)}</div>
        ${m.action_url ? `<span class="mp-action">${esc(m.action_text || "查看")} ›</span>` : ""}
      </div>
      <button class="mp-close" aria-label="关闭">×</button>
      <i class="mp-progress"></i>`;
    document.body.appendChild(el);
    requestAnimationFrame(() => el.classList.add("show"));

    let closed = false;
    const close = (mark) => {
      if (closed) return;
      closed = true;
      if (mark) markRead(m.id);
      el.classList.remove("show");
      setTimeout(() => el.remove(), 260);
      clearTimeout(timer);
      setTimeout(showNext, 350);
    };
    const timer = setTimeout(() => close(false), 8000);
    el.querySelector(".mp-close").addEventListener("click", (e) => {
      e.stopPropagation();
      close(true);
    });
    el.addEventListener("click", () => {
      close(true);
      openMessageCenter();
    });
  };
  setTimeout(showNext, 1200);
}

/* 消息中心面板 */
function openMessageCenter() {
  const rows = msgState.messages;
  const cats = ["全部", ...(msgState.categories || Object.keys(MSG_META))];
  let curCat = "全部";

  modal({
    title: "消息中心",
    hideOk: true,
    cancelText: "关闭",
    wide: true,
    body: `<div class="mc-box">

      <div class="mc-bar">
        <div class="mc-cats" id="mcCats">
          ${cats.map((c) => `<button class="mc-cat ${c === "全部" ? "on" : ""}" data-cat="${esc(c)}">${esc(c)}${c === "全部" && msgState.unread ? ` <i>${msgState.unread}</i>` : ""}</button>`).join("")}
        </div>
        <button class="mc-readall" id="mcReadAll">全部已读</button>
      </div>
      <div class="mc-list" id="mcList"></div>
    </div>`,
  });

  const list = document.getElementById("mcList");
  const renderList = () => {
    const filtered = curCat === "全部" ? rows : rows.filter((m) => m.category === curCat);
    if (!filtered.length) {
      list.innerHTML = '<div class="mc-empty">该分类下暂无消息</div>';
      return;
    }
    list.innerHTML = filtered
      .map((m) => {
        const meta = MSG_META[m.category] || {};
        return `<div class="mc-item ${m.read ? "" : "unread"}" data-mid="${m.id}" role="button" tabindex="0">
          <div class="mp-ico ${meta.cls || ""}">${meta.icon || "🔔"}</div>
          <div class="mc-body">
            <div class="mp-head"><span class="mp-cat">${esc(m.category)}</span><span class="mp-time">${esc((m.created_at || "").slice(5, 16))}</span>${m.read ? "" : '<span class="mc-dot"></span>'}</div>
            <div class="mp-title">${esc(m.title)}</div>
            <div class="mp-content">${esc(m.content)}</div>
            ${m.action_url ? `<span class="mp-action">${esc(m.action_text || "查看")} ›</span>` : ""}
          </div>
        </div>`;
      })
      .join("");
    list.querySelectorAll("[data-mid]").forEach((el) => {
      const open = () => {
        const m = rows.find((x) => x.id === Number(el.getAttribute("data-mid")));
        if (!m) return;
        markRead(m.id);
        el.classList.remove("unread");
        const dot = el.querySelector(".mc-dot");
        if (dot) dot.remove();
        if (m.action_url) {
          closeModal();
          if (m.action_url.startsWith("#")) location.hash = m.action_url.slice(1);
          else window.open(m.action_url, "_blank", "noopener");
        }
      };
      el.addEventListener("click", open);
      el.addEventListener("keydown", (ev) => {
        if (ev.key === "Enter") open();
      });
    });
  };
  renderList();

  document.getElementById("mcCats").addEventListener("click", (e) => {
    const btn = e.target.closest(".mc-cat");
    if (!btn) return;
    document.querySelectorAll(".mc-cat").forEach((x) => x.classList.remove("on"));
    btn.classList.add("on");
    curCat = btn.getAttribute("data-cat");
    renderList();
  });
  document.getElementById("mcReadAll").addEventListener("click", async () => {
    try {
      await api.post("/messages/read-all");
      rows.forEach((m) => (m.read = true));
      msgState.unread = 0;
      renderMsgDot();
      renderList();
      toast("已全部标记为已读", "success");
    } catch (e) {
      toast(e.message, "error");
    }
  });
}

document.getElementById("msgBtn").addEventListener("click", openMessageCenter);
document.getElementById("vrBtn").addEventListener("click", () => {
  window.open("https://www.720yun.com/t/79ajOzhvkv8", "_blank", "noopener");
});

/* 顶栏头像：显示当前用户头像，点击进入「我的」 */
async function refreshHeaderAvatar() {
  const el = document.getElementById("meAvatar");
  if (!el) return;
  try {
    const profile = await api.get("/buddy/profile");
    const file = profile && profile.avatar ? profile.avatar : "";
    if (file) {
      el.innerHTML = `<img src="/static/img/avatars/${esc(file)}" alt="我的头像">`;
    } else {
      el.textContent = "师";
    }
  } catch (e) {
    el.textContent = "师";
  }
}
document.getElementById("meAvatar").addEventListener("click", () => {
  location.hash = "#/me";
});
window.addEventListener("avatar:updated", refreshHeaderAvatar);
refreshHeaderAvatar();

/* ================= 今日任务悬浮球（全局常驻） ================= */

const FAB_CIRC = 2 * Math.PI * 24;

async function refreshTodoFab() {
  const fab = document.getElementById("todoFab");
  const panel = document.getElementById("todoPanel");
  if (!fab || !panel) return;
  try {
    const [overview, allTasks] = await Promise.all([
      api.get("/self/control/overview"),
      api.get("/self/control/tasks"),
    ]);
    const todayStr = new Date().toISOString().slice(0, 10);
    const pending = (overview.tasks || []).filter((t) => ["planned", "partial"].includes(t.status));
    const doneToday = (allTasks || []).filter(
      (t) => t.status === "done" && (t.completed_at || "").slice(0, 10) === todayStr
    );
    const total = pending.length + doneToday.length;
    const rate = total ? Math.round((doneToday.length / total) * 100) : 0;

    const ring = document.getElementById("fabRing");
    if (ring) ring.style.strokeDashoffset = String(FAB_CIRC * (1 - rate / 100));
    const num = document.getElementById("fabNum");
    if (num) num.textContent = total ? `${doneToday.length}/${total}` : "0";
    const pct = document.getElementById("fabPct");
    if (pct) pct.textContent = `${rate}%`;

    const list = document.getElementById("fabList");
    if (!list) return;
    const items = [...pending, ...doneToday];
    list.innerHTML = items.length
      ? items
          .map((t) => {
            const done = t.status === "done";
            const src = t.source === "message" ? '<span class="src">群消息</span>' : "";
            return `<div class="titem ${done ? "done" : ""}" data-fid="${t.id}" role="button" tabindex="0" aria-label="${esc(t.title)} ${done ? "已完成" : "点击完成"}">
              <span class="ck" aria-hidden="true">${done ? "✓" : ""}</span>
              <span class="tt">${esc(t.title)}</span>
              ${src}
              <span class="tm">${t.estimate_min || ""}${t.estimate_min ? " 分" : ""}</span>
            </div>`;
          })
          .join("")
      : '<div class="fab-empty">今天没有待办，去自我控制安排一下</div>';

    list.querySelectorAll("[data-fid]").forEach((el) => {
      const toggle = async () => {
        const id = el.getAttribute("data-fid");
        const item = items.find((x) => String(x.id) === id);
        if (!item || item.status === "done") return;
        el.classList.add("done");
        el.querySelector(".ck").textContent = "✓";
        try {
          const updated = await api.patch(`/self/control/tasks/${id}`, { status: "done" });
          const xp = Number((updated && updated.xp_awarded) || 0);
          toast(xp > 0 ? `任务完成，+${xp} 积分` : "任务完成（今日任务积分已达上限）", "success");
          refreshTodoFab();
          window.dispatchEvent(new CustomEvent("self:tasks-updated"));
        } catch (e) {
          el.classList.remove("done");
          el.querySelector(".ck").textContent = "";
          toast(e.message, "error");
        }
      };
      el.addEventListener("click", toggle);
      el.addEventListener("keydown", (ev) => {
        if (ev.key === "Enter" || ev.key === " ") {
          ev.preventDefault();
          toggle();
        }
      });
    });
  } catch (e) {
    const num = document.getElementById("fabNum");
    if (num) num.textContent = "—";
  }
}

function initTodoFab() {
  const fab = document.getElementById("todoFab");
  const panel = document.getElementById("todoPanel");
  if (!fab || !panel) return;
  const closePanel = () => panel.classList.remove("show");
  fab.addEventListener("click", () => {
    const willOpen = !panel.classList.contains("show");
    panel.classList.toggle("show", willOpen);
    if (willOpen) refreshTodoFab();
  });
  document.addEventListener("click", (e) => {
    if (!panel.classList.contains("show")) return;
    if (e.target.closest("#todoFab") || e.target.closest("#todoPanel")) return;
    closePanel();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closePanel();
  });
  const go = document.getElementById("fabGo");
  if (go) go.addEventListener("click", () => { closePanel(); location.hash = "#/life/self/control"; });
  refreshTodoFab();
  window.addEventListener("hashchange", () => { if (panel.classList.contains("show")) refreshTodoFab(); });
}
initTodoFab();

loadMessages().then((data) => {
  if (data && data.unread > 0) playUnreadPopups();
});

/* 截止提醒：截止前 30 分钟未完成的待办写入信息中心（红点+弹窗提醒） */
async function checkDeadlines() {
  const fm = window.__focusMode;
  if (fm && fm.active) return; // 专注中不打扰
  try {
    const res = await api.post("/messages/deadline-reminders");
    if (res && res.created > 0) {
      await loadMessages();
      playUnreadPopups();
    }
  } catch (e) { /* 可选数据 */ }
}
setInterval(checkDeadlines, 60000);
setTimeout(checkDeadlines, 9000);

/* 顶栏返回按钮：二级页显示，点击回上一页 */
function initBackButton() {
  const btn = document.getElementById("backBtn");
  if (!btn) return;
  btn.addEventListener("click", () => {
    if (!navStack.length) {
      location.hash = "#/home";
      return;
    }
    // 返回时跳回栈顶来路，并告知路由不要再把当前页压回栈（否则会来回循环）
    suppressPush = true;
    const target = navStack.pop();
    if (target === location.hash) {
      suppressPush = false;
      return;
    }
    location.hash = target;
  });
  btn.hidden = navStack.length === 0;
}
initBackButton();

function initCampus() {
  const sel = document.getElementById("campusSelect");
  if (!sel) return;
  const saved = localStorage.getItem("campus") || "泉山校区";
  sel.value = saved;
  sel.addEventListener("change", () => {
    localStorage.setItem("campus", sel.value);
    toast(`已切换到 ${sel.value}`);
    renderRoute();
  });
}
initCampus();



applyTheme(localStorage.getItem("selfTheme") || "default");
api.get("/self/control/shop").then((shop) => {
  const active = shop && shop.active;
  if (active && localStorage.getItem("selfTheme") !== active) applyTheme(active);
}).catch(() => {});

let booted = false;
function boot() {
  if (booted) return;
  booted = true;
  renderRoute();
}
document.addEventListener("click", (e) => {
  if (!window.__focusGuard) return;
  const target = e.target.closest('a[href^="#/"], [data-route], #backBtn');
  if (!target) return;
  e.preventDefault();
  e.stopPropagation();
  toast("请保持专注，不要随意离开。若要离开，需点击暂停时钟", "error");
}, true);
window.addEventListener("hashchange", renderRoute);
window.addEventListener("DOMContentLoaded", boot);
if (document.readyState !== "loading") boot();