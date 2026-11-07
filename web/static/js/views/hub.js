import { esc } from "../ui.js";

const GROUPS = [
  {
    title: "校园工作 · 预约",
    items: [

      { name: "空教室预约", badge: "免审批", desc: "周次制占用矩阵，提交即确认", href: "#/work/classroom", icon: "g", svg: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8"/>' },
      { name: "图书馆选座", badge: "即时", desc: "六个阅览室 324 座，选座即确认", href: "#/work/library", icon: "b", svg: '<path d="M6 11V7a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v4"/><path d="M4 11h16v5H4z"/><path d="M7 16v4M17 16v4"/>' },
    ],
  },
  {
    title: "教务与资源",
    items: [
      { name: "信息动态", badge: "", desc: "官网要闻与通知，站内详情阅读", href: "#/work/news", icon: "o", svg: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 9h10M7 13h6"/>' },
      { name: "资源平台", badge: "", desc: "学校已有平台统一入口直达", href: "#/resources", icon: "o", svg: '<path d="M3 7h7l2 2h9v10H3z"/>' },

    ],
  },
  {
    title: "校园生活",
    items: [
      { name: "校园导航", badge: "真实地图", desc: "别名搜索 · 步行路线 · 唤起高德", href: "#/life/nav", icon: "b", svg: '<path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11Z"/><circle cx="12" cy="10" r="2.6"/>' },
      { name: "找搭子", badge: "", desc: "吃饭 · 自习 · 健身 · 考研", href: "#/life/buddy", icon: "o", svg: '<circle cx="9" cy="9" r="3"/><circle cx="17" cy="10.5" r="2.4"/><path d="M3.5 19.5c.6-2.8 2.7-4.2 5.5-4.2s4.9 1.4 5.5 4.2"/><path d="M15 15.6c2.2.1 3.6 1.3 4 3.4"/>' },
      { name: "省一省", badge: "", desc: "拼单墙 · 放弃即省钱", href: "#/life/deal", icon: "p", svg: '<path d="M5 8h14l-1.4 12.2a1.6 1.6 0 0 1-1.6 1.4H8a1.6 1.6 0 0 1-1.6-1.4L5 8Z"/><path d="M8.6 8V6.2a3.4 3.4 0 0 1 6.8 0V8"/>' },

      { name: "报修", badge: "", desc: "宿舍与设施问题，一处提交全程可查", href: "#/repair", icon: "v", svg: '<path d="M14.7 6.3a4.5 4.5 0 0 0-6 5.6L3 17.6V21h3.4l5.7-5.7a4.5 4.5 0 0 0 5.6-6L14.5 12l-2.5-2.5 2.7-3.2Z"/>' },
    ],
  },
  {
    title: "个人与自我",
    items: [
      { name: "个人管理", badge: "", desc: "我的预约、签到、记录与设置", href: "#/me", icon: "b", svg: '<circle cx="12" cy="8" r="3.6"/><path d="M4.5 20c1.4-3.6 4-5.2 7.5-5.2s6.1 1.6 7.5 5.2"/>' },

      { name: "自我控制", badge: "", desc: "任务 · 专注 · 复盘 · 成就", href: "#/life/self/control", icon: "v", svg: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/>' },
    ],
  },
  {
    title: "校园服务",
    items: [
      { name: "苏小师", badge: "全局", desc: "一句话办事", href: "#/assistant", icon: "ai", svg: '<circle cx="12" cy="12" r="3.2"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/>' },
      { name: "文件识别", badge: "", desc: "字段提取 · 规则生成 · 核查匹配", href: "#/office", icon: "b", svg: '<path d="M5 4h9l5 5v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4Z"/><path d="M14 4v5h5"/><path d="M8.5 13h7M8.5 16.5h4"/>' },
    ],
  },
];

function hcard(item) {
  return `<a class="hcard" href="${item.href}">
    <div class="hic ${item.icon}"><svg viewBox="0 0 24 24">${item.svg}</svg></div>
    <div class="hinfo">
      <div class="hn">${esc(item.name)}${item.badge ? `<span class="hb">${esc(item.badge)}</span>` : ""}</div>
      <div class="hd">${esc(item.desc)}</div>
    </div>
    <span class="hgo">›</span>
  </a>`;
}

function groupHtml(g) {
  return `<div class="hub-group">
    <div class="hg-head"><b>${esc(g.title)}</b><span>${g.items.length} 项</span><i></i></div>
    <div class="hub-grid">${g.items.map(hcard).join("")}</div>
  </div>`;
}

export async function render(root, ctx) {
  root.innerHTML = `
    <div id="hubGroups">
      ${GROUPS.map(groupHtml).join("")}
    </div>
`;


}