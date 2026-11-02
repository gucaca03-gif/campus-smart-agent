import { api } from "./api.js";
import { closeModal, esc, loading, modal, toast } from "./ui.js";
import { render as home } from "./views/home.js";
import { renderAbout, renderFaculty, renderCampus } from "./views/home-detail.js";
import { render as workHome } from "./views/work.js";
import { renderLab } from "./views/work.js";
import { renderLabBook } from "./views/work.js";
import { renderClassroom } from "./views/work.js";
import { renderLibrary } from "./views/work.js";
import { renderResources } from "./views/work.js";
import { renderNews } from "./views/work.js";
import { renderNewsDetail } from "./views/work.js";
import { renderLibraryRoom } from "./views/work.js";
import { render as office } from "./views/office.js";
import { render as lifeHome } from "./views/life.js";
import { renderNav } from "./views/nav.js";
import { renderBuddy } from "./views/life.js";
import { renderDeal } from "./views/life.js";
import { renderHelp } from "./views/life.js";
import { render as selfHome } from "./views/self.js";
import { render as selfControl } from "./views/self-control.js";
import { render as assistant } from "./views/assistant.js";
import { render as me } from "./views/me.js";
import { render as admin } from "./views/admin.js";

const routes = {
  "/home": { title: "首页", crumb: "校情总览", view: home },
  "/home/about": { title: "学校概况", crumb: "首页 / 学校概况", view: renderAbout },
  "/home/faculty": { title: "师资与办学成就", crumb: "首页 / 师资与成就", view: renderFaculty },
  "/home/campus": { title: "校区与 VR", crumb: "首页 / 校区", view: renderCampus },
  "/work": { title: "预约中心", crumb: "实验室 · 教室 · 图书馆 · 资源", view: workHome },
  "/work/lab": { title: "实验室预约", crumb: "预约中心 / 实验室", view: renderLab },
  "/work/lab/book": { title: "实验室预约", crumb: "预约中心 / 实验室 / 选择时段", view: renderLabBook },
  "/work/classroom": { title: "空教室预约", crumb: "预约中心 / 空教室", view: renderClassroom },
  "/work/library": { title: "图书馆预约", crumb: "预约中心 / 图书馆", view: renderLibrary },
  "/work/library/room": { title: "图书馆选座", crumb: "预约中心 / 图书馆选座", view: renderLibraryRoom },
  "/work/resources": { title: "资源平台", crumb: "学校平台与外链", view: renderResources },
  "/resources": { title: "资源平台", crumb: "学校平台与外链", view: renderResources },
  "/work/news": { title: "信息动态", crumb: "师大要闻与通知", view: renderNews },
  "/news/detail": { title: "动态详情", crumb: "信息动态 / 详情", view: renderNewsDetail },
  "/office": { title: "办公服务", crumb: "材料智能审核", view: office },
  "/life": { title: "校园生活", crumb: "导航 · 搭子 · 省钱 · 互助", view: lifeHome },
  "/life/nav": { title: "校园导航", crumb: "校园生活 / 导航", view: renderNav },
  "/life/buddy": { title: "搭子", crumb: "校园生活 / 搭子", view: renderBuddy },
  "/life/deal": { title: "省钱", crumb: "校园生活 / 省钱", view: renderDeal },
  "/life/help": { title: "互帮互助", crumb: "校园生活 / 互助", view: renderHelp },
  "/life/self": { title: "自我管理", crumb: "我的 / 自我管理", view: selfHome },
  "/life/self/control": { title: "自我控制", crumb: "我的 / 自我控制", view: selfControl },
  "/me/self": { title: "自我管理", crumb: "我的 / 自我管理", view: selfHome },
  "/me/control": { title: "自我控制", crumb: "我的 / 自我控制", view: selfControl },
  "/assistant": { title: "AI 助手", crumb: "可溯源 · 可确认 · 可降级", view: assistant },
  "/me": { title: "我的", crumb: "预约 · 记录 · 设置", view: me },
  "/admin": { title: "管理后台", crumb: "资源审批 · 内容管理", view: admin },
};

function parseHash() {
  const raw = (location.hash || "#/home").slice(1);
  const [path, query = ""] = raw.split("?");
  return { path: path || "/home", params: new URLSearchParams(query) };
}

export function navigate(to) {
  if (!to.startsWith("#")) to = `#${to}`;
  location.hash = to;
}

function setActive(path) {
  document.querySelectorAll("[data-route]").forEach((el) => {
    const route = el.getAttribute("data-route").slice(1);
    let active = false;
    if (route === "/home") active = path === "/home" || path.startsWith("/home/");
    else if (route === "/work") active = (path === "/work" || path.startsWith("/work/")) && path !== "/work/news" && path !== "/work/resources";
    else if (route === "/work/news") active = path === "/work/news" || path === "/news/detail";
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

async function renderRoute() {
  const { path, params } = parseHash();
  const route = routes[path] || routes["/home"];
  const view = document.getElementById("view");
  document.title = `${route.title} · 爱师大`;
  setActive(path);
  document.getElementById("mobileDrawer").classList.remove("open");
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
              <div class="spread"><strong>${esc(p.name)}</strong><span class="tag ${p.verified ? "tag-green" : "tag-warn"}">${p.verified ? "已核验" : "待核验"}</span></div>
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
  document.getElementById("mobileDrawer").classList.toggle("open");
});
document.getElementById("searchBtn").addEventListener("click", openSearch);
document.getElementById("searchBtnM").addEventListener("click", openSearch);

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
let booted = false;
function boot() {
  if (booted) return;
  booted = true;
  renderRoute();
}
window.addEventListener("hashchange", renderRoute);
window.addEventListener("DOMContentLoaded", boot);
if (document.readyState !== "loading") boot();