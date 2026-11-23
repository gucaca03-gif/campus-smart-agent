import { api } from "../api.js";
import { closeModal, esc, modal, toast } from "../ui.js";
import { renderBuddy as renderLegacyBuddy } from "./life.js";
import {
  FILTER_KEY,
  SCROLL_KEY,
  TYPES,
  activityCard,
  emptyState,
  openApply,
  runCardAction,
  statusBadge,
  timeText,
} from "./buddy-shared.js";

const DRAFT_KEY = "buddyActivityDraft";

function readFilter() {
  try {
    return { q: "", type: "", campus: "", time_filter: "", need_more: false, sort: "soon", ...JSON.parse(sessionStorage.getItem(FILTER_KEY) || "{}") };
  } catch (e) {
    return { q: "", type: "", campus: "", time_filter: "", need_more: false, sort: "soon" };
  }
}

function saveFilter(filter) {
  sessionStorage.setItem(FILTER_KEY, JSON.stringify(filter));
}

function buddyHead(active, pending, unread) {
  const tabs = [
    ["#/life/buddy", "找活动", "activity", 0],
    ["#/life/buddy/mine", "我的活动", "mine", 0],
    ["#/life/buddy/messages", "申请与消息", "messages", pending + unread],
  ];
  return `<div class="buddy-nav">
    <div class="buddy-nav-tabs">
      ${tabs
        .map(
          ([href, label, key, badge]) => `<a class="buddy-nav-tab ${active === key ? "on" : ""}" href="${href}">${label}${badge ? `<span class="buddy-dot">${badge}</span>` : ""}</a>`
        )
        .join("")}
    </div>
    <div class="buddy-nav-actions">
      <a class="btn btn-ghost btn-sm" href="#/life/buddy?tab=profile">我的搭子档案</a>
      <a class="btn btn-ghost btn-sm" href="#/life/buddy?tab=test">趣味测试</a>
      <a class="btn btn-primary btn-sm" href="#/life/buddy/new">＋ 发布活动</a>
    </div>
  </div>`;
}

async function badgeCounts() {
  try {
    const [appsRes, chats] = await Promise.all([api.get("/buddy/activity-applications"), api.get("/buddy/chats")]);
    const pending = (appsRes.received || []).length;
    const unread = (chats || []).reduce((sum, c) => sum + (c.unread || 0), 0);
    return { pending, unread };
  } catch (e) {
    return { pending: 0, unread: 0 };
  }
}

export async function renderActivities(root, ctx) {
  const legacyTab = ctx.params.get("tab");
  if (legacyTab === "test" || legacyTab === "profile") {
    return renderLegacyBuddy(root, ctx);
  }

  let filter = readFilter();
  const { pending, unread } = await badgeCounts();
  let rows = [];

  root.innerHTML = `${buddyHead("activity", pending, unread)}
    <div class="page-head"><div><div class="page-sub">找到时间合适、目标一致的校园伙伴。</div></div></div>
    <div class="buddy-filters card">
      <div class="buddy-search-row">
        <input class="input" id="buddyQ" placeholder="搜索活动标题、地点或关键词" value="${esc(filter.q || "")}">
        <select class="select" id="buddySort">
          <option value="soon" ${filter.sort === "soon" ? "selected" : ""}>近期开始</option>
          <option value="latest" ${filter.sort === "latest" ? "selected" : ""}>最新发布</option>
        </select>
      </div>
      <div class="chips buddy-cats">
        ${TYPES.map((t) => `<button class="chip ${filter.type === t || (t === "全部" && !filter.type) ? "active" : ""}" data-type="${t}">${t}</button>`).join("")}
      </div>
      <div class="buddy-filter-row">
        <select class="select" id="buddyCampus">
          <option value="">全部校区</option>
          ${["泉山校区", "云龙校区", "奎园校区", "潘安湖校区"].map((c) => `<option ${filter.campus === c ? "selected" : ""}>${c}</option>`).join("")}
        </select>
        <select class="select" id="buddyTime">
          <option value="">不限时间</option>
          <option value="today" ${filter.time_filter === "today" ? "selected" : ""}>今天</option>
          <option value="week" ${filter.time_filter === "week" ? "selected" : ""}>本周内</option>
        </select>
        <label class="row buddy-check"><input type="checkbox" id="buddyNeed" ${filter.need_more ? "checked" : ""}> 只看还缺人</label>
        <button class="btn btn-ghost btn-sm" id="buddyClear">清空筛选</button>
        <button class="btn btn-ghost btn-sm" id="buddyDraw">🎲 摇一摇抽纸条</button>
      </div>
      <div id="buddySelected" class="buddy-selected"></div>
    </div>
    <div class="spread" style="margin-top:18px;align-items:center">
      <div class="section-title" style="margin:0">搭子广场</div>
      <button class="btn btn-ghost btn-sm" id="buddyRefresh" title="换一批新的活动">↻ 刷新</button>
    </div>
    <div id="activityList" class="activity-grid"></div>
    <div id="recommendBox"></div>`;

  const list = root.querySelector("#activityList");
  const selected = root.querySelector("#buddySelected");
  const recommendBox = root.querySelector("#recommendBox");

  function filterSummary() {
    const parts = [];
    if (filter.q) parts.push(`搜索：${filter.q}`);
    if (filter.type) parts.push(`分类：${filter.type}`);
    if (filter.campus) parts.push(filter.campus);
    if (filter.time_filter === "today") parts.push("今天");
    if (filter.time_filter === "week") parts.push("本周内");
    if (filter.need_more) parts.push("还缺人");
    return parts;
  }

  function drawSelected() {
    const parts = filterSummary();
    selected.innerHTML = parts.length
      ? `<span class="muted">已选：</span>${parts.map((p) => `<span class="tag">${esc(p)}</span>`).join("")}<button class="buddy-clear-inline" id="buddyClearInline">清空</button>`
      : `<span class="muted">默认按“近期开始且还缺人”排序</span>`;
    const inline = selected.querySelector("#buddyClearInline");
    if (inline) inline.addEventListener("click", clearFilter);
  }

  function applyFilterState() {
    root.querySelector("#buddyQ").value = filter.q || "";
    root.querySelector("#buddySort").value = filter.sort || "soon";
    root.querySelector("#buddyCampus").value = filter.campus || "";
    root.querySelector("#buddyTime").value = filter.time_filter || "";
    root.querySelector("#buddyNeed").checked = Boolean(filter.need_more);
    root.querySelectorAll("[data-type]").forEach((chip) => {
      const t = chip.getAttribute("data-type");
      chip.classList.toggle("active", t === "全部" ? !filter.type : t === filter.type);
    });
    drawSelected();
  }

  let refreshSeen = new Set();

  async function load(focusList = true, opts = {}) {
    saveFilter(filter);
    const query = new URLSearchParams();
    if (opts.exclude) query.set("exclude", opts.exclude);
    if (opts.shuffle) query.set("shuffle", "1");
    query.set("limit", String(opts.limit === undefined ? 6 : opts.limit));
    if (filter.q) query.set("q", filter.q);
    if (filter.type) query.set("type", filter.type);
    if (filter.campus) query.set("campus", filter.campus);
    if (filter.time_filter) query.set("time_filter", filter.time_filter);
    if (filter.need_more) query.set("need_more", "1");
    query.set("sort", filter.sort || "soon");
    try {
      rows = await api.get(`/buddy/activities?${query.toString()}`);
      const grid = list;
      grid.innerHTML = rows.length
        ? rows.map(activityCard).join("")
        : emptyState("没有符合条件的活动", "换个筛选条件，或者自己发布一个活动");
      recommendBox.innerHTML = renderRecommend(rows);
      if (focusList) {
        const saved = Number(sessionStorage.getItem(SCROLL_KEY) || 0);
        if (saved > 0) {
          requestAnimationFrame(() => window.scrollTo({ top: saved, behavior: "instant" }));
          sessionStorage.removeItem(SCROLL_KEY);
        }
      }
    } catch (e) {
      list.innerHTML = emptyState("活动加载失败", e.message);
    }
  }

  function renderRecommend(list) {
    const hot = list
      .filter((a) => !a.is_owner && a.mine.status !== "accepted" && a.effective_status === "recruiting" && a.remaining > 0)
      .filter((a) => a.recommend_reasons.includes("同校区"))
      .slice(0, 3);
    if (!hot.length) return "";
    return `<div class="section-title">为你推荐 <span class="title-hint">按同校区、时间与共同兴趣，不使用虚构匹配度</span></div>
      <div class="activity-grid">${hot.map(activityCard).join("")}</div>`;
  }

  function clearFilter() {
    filter = { q: "", type: "", campus: "", time_filter: "", need_more: false, sort: "soon" };
    applyFilterState();
    load(false);
  }

  root.querySelector("#buddyRefresh").addEventListener("click", async () => {
    const btn = root.querySelector("#buddyRefresh");
    btn.disabled = true;
    try {
      const cur = rows.map((a) => a.id);
      const exclude = [...new Set([...refreshSeen, ...cur])].join(",");
      await load(false, { exclude, shuffle: 1 });
      if (!rows.length) {
        refreshSeen.clear();
        await load(false, { shuffle: 1 });
        if (rows.length) {
          rows.forEach((a) => refreshSeen.add(a.id));
          toast(`已看完全部活动，重新开始一批（${rows.length} 个）`, "success");
        } else {
          toast("暂时没有更多活动了，稍后再来看看", "success");
        }
        return;
      }
      rows.forEach((a) => refreshSeen.add(a.id));
      toast(`已换一批（${rows.length} 个新活动）`, "success");
    } finally {
      btn.disabled = false;
    }
  });

  root.querySelector("#buddyQ").addEventListener("input", (e) => {
    clearTimeout(e.target._timer);
    e.target._timer = setTimeout(() => {
      filter.q = e.target.value.trim();
      load(false);
    }, 280);
  });
  root.querySelector("#buddySort").addEventListener("change", (e) => {
    filter.sort = e.target.value;
    load(false);
  });
  root.querySelector("#buddyCampus").addEventListener("change", (e) => {
    filter.campus = e.target.value;
    applyFilterState();
    load(false);
  });
  root.querySelector("#buddyTime").addEventListener("change", (e) => {
    filter.time_filter = e.target.value;
    applyFilterState();
    load(false);
  });
  root.querySelector("#buddyNeed").addEventListener("change", (e) => {
    filter.need_more = e.target.checked;
    applyFilterState();
    load(false);
  });
  root.querySelector("#buddyClear").addEventListener("click", clearFilter);
  root.querySelectorAll("[data-type]").forEach((chip) => {
    chip.addEventListener("click", () => {
      const t = chip.getAttribute("data-type");
      filter.type = t === "全部" ? "" : t;
      applyFilterState();
      load(false);
    });
  });
  root.querySelector("#buddyDraw").addEventListener("click", () => drawNearby());

  async function drawNearby() {
    try {
      const nearby = await api.get("/buddy/nearby");
      const pool = (nearby || []).filter((x) => x.visible !== false).slice(0, 20);
      if (!pool.length) return toast("暂时没有公开档案的同学", "error");
      const picked = [...pool].sort(() => Math.random() - 0.5).slice(0, 3);
      modal({
        title: "摇一摇 · 今天可能遇到的同学",
        hideOk: true,
        cancelText: "关闭",
        body: `<div class="draw-results">${picked
          .map(
            (x) => `<div class="draw-person" data-peer="${x.user_id}" style="cursor:pointer">
              <div class="draw-emoji">${esc(x.emoji || "🐾")}</div>
              <div style="flex:1"><strong>${esc(x.nickname || "师大同学")}</strong>
              <div class="muted">${esc(x.college || "同校区")} · ${esc(x.active_time || "时间不定")}</div>
              <div class="muted">${esc(x.place || "泉山校区")}</div></div>
              ${x.post ? `<a class="btn btn-primary btn-sm" data-open-post="${x.post.id}">点我交流</a>` : '<span class="muted" style="font-size:11px">暂无公开活动</span>'}
            </div>`
          )
          .join("")}</div><div class="muted" style="margin-top:10px">点开对方的活动即可发起申请，通过后可在「申请与消息」里聊天。</div>`,
      });
      const openPost = (postId) => {
        closeModal();
        location.hash = `#/life/buddy/activity?id=${postId}`;
      };
      document.querySelectorAll("[data-open-post]").forEach((b) =>
        b.addEventListener("click", (e) => {
          e.stopPropagation();
          openPost(b.getAttribute("data-open-post"));
        })
      );
      document.querySelectorAll("[data-peer]").forEach((card) =>
        card.addEventListener("click", () => {
          const link = card.querySelector("[data-open-post]");
          if (link) openPost(link.getAttribute("data-open-post"));
          else toast("该同学暂未公开活动，可在广场看看其他同学", "info");
        })
      );
    } catch (e) {
      toast(e.message, "error");
    }
  }

  root.addEventListener("click", async (e) => {
    const btn = e.target.closest("[data-act]");
    if (!btn) return;
    e.preventDefault();
    e.stopPropagation();
    try {
      await runCardAction(btn.getAttribute("data-act"), Number(btn.getAttribute("data-id")), ctx, () => load(false));
    } catch (err) {
      toast(err.message, "error");
    }
  });

  applyFilterState();
  await load(true);
}

/* -------------------- 我的活动 -------------------- */

export async function renderMyActivities(root, ctx) {
  let active = "published";
  const { pending, unread } = await badgeCounts();
  root.innerHTML = `${buddyHead("mine", pending, unread)}
    <div class="tabs buddy-subtabs">
      <button class="tab active" data-mine="published">我发布的</button>
      <button class="tab" data-mine="joined">我参加的</button>
      <button class="tab" data-mine="finished">已结束</button>
    </div>
    <div id="mineBox"></div>`;

  const box = root.querySelector("#mineBox");
  let data = { published: [], joined: [], finished: [] };

  function draw() {
    const rows = data[active] || [];
    box.innerHTML = rows.length
      ? `<div class="activity-grid">${rows.map(activityCard).join("")}</div>`
      : emptyState(
          active === "published" ? "还没有发布过活动" : active === "joined" ? "还没有参加活动" : "还没有已结束的活动",
          active === "published" ? "点右上角发布一个活动，等人来申请" : "去「找活动」看看"
        );
  }

  root.querySelectorAll("[data-mine]").forEach((tab) => {
    tab.addEventListener("click", () => {
      active = tab.getAttribute("data-mine");
      root.querySelectorAll("[data-mine]").forEach((x) => x.classList.toggle("active", x === tab));
      draw();
    });
  });

  root.addEventListener("click", async (e) => {
    const btn = e.target.closest("[data-act]");
    if (!btn) return;
    e.preventDefault();
    e.stopPropagation();
    try {
      await runCardAction(btn.getAttribute("data-act"), Number(btn.getAttribute("data-id")), ctx, async () => {
        data = await api.get("/buddy/activities/mine");
        draw();
      });
    } catch (err) {
      toast(err.message, "error");
    }
  });

  try {
    data = await api.get("/buddy/activities/mine");
  } catch (e) {
    box.innerHTML = emptyState("加载失败", e.message);
    return;
  }
  draw();
}

/* -------------------- 发布活动 -------------------- */

function draftOf() {
  try {
    return JSON.parse(localStorage.getItem(DRAFT_KEY) || "{}");
  } catch (e) {
    return {};
  }
}

function saveDraft(form) {
  const data = {};
  ["type", "title", "campus", "place", "start_at", "end_at", "capacity", "content", "requirements", "signup_deadline"].forEach((k) => {
    const el = form.querySelector(`[name="${k}"]`);
    if (el) data[k] = el.value;
  });
  localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
}

export async function renderActivityNew(root, ctx) {
  const draft = draftOf();
  const now = new Date();
  now.setMinutes(0, 0, 0);
  now.setHours(now.getHours() + 2);
  const pad = (n) => String(n).padStart(2, "0");
  const defaultStart = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:00`;
  root.innerHTML = `<div class="page-head"><div><div class="page-title">发布活动</div><div class="page-sub">写清楚“做什么、什么时候、在哪、几个人”，同学才好判断要不要来。</div></div>
      <a class="btn btn-ghost" href="#/life/buddy">取消</a></div>
    <form class="activity-form card" id="activityForm">
      <div class="grid grid-2">
        <div class="field"><label>活动类型 *</label><select class="select" name="type">${TYPES.slice(1).map((t) => `<option ${draft.type === t ? "selected" : ""}>${t}</option>`).join("")}</select></div>
        <div class="field"><label>活动标题 *</label><input class="input" name="title" maxlength="40" value="${esc(draft.title || "")}" placeholder="例如：今晚图书馆自习，备考英语六级"></div>
        <div class="field"><label>校区 *</label><select class="select" name="campus">${["泉山校区", "云龙校区", "奎园校区", "潘安湖校区"].map((c) => `<option ${draft.campus === c ? "selected" : ""}>${c}</option>`).join("")}</select></div>
        <div class="field"><label>地点 *</label><input class="input" name="place" maxlength="60" value="${esc(draft.place || "")}" placeholder="例如：敬文图书馆三楼"></div>
        <div class="field"><label>开始时间 *</label><input class="input" type="datetime-local" name="start_at" value="${esc(draft.start_at || defaultStart)}"></div>
        <div class="field"><label>结束时间 *</label><input class="input" type="datetime-local" name="end_at" value="${esc(draft.end_at || "")}"></div>
        <div class="field"><label>活动总人数 *（含发起人）</label><input class="input" type="number" name="capacity" min="2" max="50" value="${esc(draft.capacity || 4)}"></div>
        <div class="field"><label>报名截止（可选）</label><input class="input" type="datetime-local" name="signup_deadline" value="${esc(draft.signup_deadline || "")}"></div>
      </div>
      <div class="field" style="margin-top:12px"><label>简短说明 *</label><textarea class="textarea" name="content" maxlength="300" placeholder="例如：希望安静学习，中途可以一起讨论问题。">${esc(draft.content || "")}</textarea></div>
      <div class="field" style="margin-top:12px"><label>参与要求（可选）</label><input class="input" name="requirements" maxlength="120" value="${esc(draft.requirements || "")}" placeholder="例如：自带电脑、需要一定高数基础"></div>
      <div class="buddy-form-tip muted">已参加人数包含发起人和已通过成员；待处理申请不占名额。草稿会自动保存在本机。</div>
      <div class="row" style="margin-top:16px;justify-content:flex-end">
        <button type="button" class="btn btn-ghost" id="draftClear">清空草稿</button>
        <button type="submit" class="btn btn-primary">发布活动</button>
      </div>
    </form>`;

  const form = root.querySelector("#activityForm");
  form.addEventListener("input", () => saveDraft(form));
  root.querySelector("#draftClear").addEventListener("click", () => {
    localStorage.removeItem(DRAFT_KEY);
    toast("草稿已清空");
    renderActivityNew(root, ctx);
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    saveDraft(form);
    const data = Object.fromEntries(new FormData(form).entries());
    if (data.end_at && data.start_at && data.end_at <= data.start_at) return toast("结束时间必须晚于开始时间", "error");
    if (data.signup_deadline && data.start_at && data.signup_deadline > data.start_at) return toast("报名截止时间不能晚于开始时间", "error");
    if (String(data.title || "").trim().length < 2) return toast("标题至少 2 个字", "error");
    if (String(data.content || "").trim().length < 4) return toast("请写一句简短说明", "error");
    try {
      const created = await api.post("/buddy/activities", data);
      localStorage.removeItem(DRAFT_KEY);
      toast("活动已发布", "success");
      ctx.navigate(`/life/buddy/activity?id=${created.id}`);
    } catch (err) {
      toast(err.message, "error");
    }
  });
}

/* -------------------- 活动详情 -------------------- */

export async function renderActivityDetail(root, ctx) {
  const id = Number(ctx.params.get("id") || 0);
  if (!id) return (root.innerHTML = emptyState("活动不存在", "缺少活动编号"));
  let activity;
  try {
    activity = await api.get(`/buddy/activities/${id}`);
  } catch (e) {
    root.innerHTML = emptyState("活动不存在或已下架", e.message);
    return;
  }

  function actionHtml(a) {
    const buttons = [];
    if (a.is_owner) {
      if (a.effective_status === "recruiting") {
        buttons.push({ label: "邀请同学", act: "invite", cls: "btn-primary" });
        buttons.push({ label: "停止招募", act: "stop", cls: "btn-ghost" });
        buttons.push({ label: "取消活动", act: "cancel", cls: "btn-danger" });
        buttons.push({ label: "结束活动", act: "finish", cls: "btn-ghost" });
      }
      buttons.push({ label: "编辑活动", act: "edit", cls: "btn-ghost" });
      buttons.push({ label: "查看申请", act: "applications", cls: "btn-primary" });
      buttons.push({ label: "删除活动", act: "delete", cls: "btn-danger" });
    } else if (a.mine.status === "accepted") {
      buttons.push({ label: "进入聊天", act: "chat", cls: "btn-primary" });
      buttons.push({ label: "退出活动", act: "quit", cls: "btn-ghost" });
    } else if (a.mine.status === "pending") {
      buttons.push({ label: "查看申请", act: "viewApply", cls: "btn-ghost" });
      buttons.push({ label: "撤回申请", act: "withdraw", cls: "btn-danger" });
    } else if (a.can_apply) {
      buttons.push({ label: "申请参加", act: "apply", cls: "btn-primary" });
    }
    if (!a.is_owner) buttons.push({ label: "更多", act: "more", cls: "btn-ghost" });
    return buttons.map((b) => `<button class="btn ${b.cls}" data-detail-act="${b.act}">${b.label}</button>`).join("");
  }

  const cancelled = activity.effective_status === "cancelled";
  root.innerHTML = `<div class="page-head"><div><div class="page-title">活动详情</div><div class="page-sub">${esc(activity.type)} · ${esc(activity.campus)}</div></div>
      <div class="row"><a class="btn btn-ghost btn-sm" href="#/life/buddy/messages?tab=received">申请与消息</a><a class="btn btn-ghost btn-sm" href="#/life/buddy">返回找活动</a></div></div>
    ${cancelled ? `<div class="activity-alert">活动已取消：${esc(activity.cancel_reason || "发起人取消了活动")}</div>` : ""}
    <div class="activity-detail card">
      <div class="activity-top">
        <span class="tag tag-blue">${esc(activity.type)}</span>
        <span class="tag">${esc(activity.campus)}</span>
        ${statusBadge(activity)}
        ${activity.is_owner ? '<span class="tag tag-gold">我发布的</span>' : ""}
      </div>
      <h1 class="activity-detail-title">${esc(activity.title)}</h1>
      <div class="activity-detail-grid">
        <div><span class="muted">时间</span><strong>${esc(timeText(activity))}</strong></div>
        <div><span class="muted">地点</span><strong>${esc(activity.place)}</strong></div>
        <div><span class="muted">人数</span><strong>${esc(peopleText(activity))}</strong></div>
        <div><span class="muted">报名截止</span><strong>${activity.signup_deadline ? esc(String(activity.signup_deadline).replace("T", " ")) : "未设置"}</strong></div>
      </div>
      <div class="activity-section"><div class="muted">活动说明</div><p>${esc(activity.content)}</p></div>
      ${activity.requirements ? `<div class="activity-section"><div class="muted">参与要求</div><p>${esc(activity.requirements)}</p></div>` : ""}
      <div class="activity-section"><div class="muted">发起人</div><p>${esc(activity.owner.emoji)} ${esc(activity.owner.nickname)} ${activity.owner.mbti ? `· ${esc(activity.owner.mbti)}` : ""}</p></div>
      <div class="activity-section"><div class="muted">已参加成员（${activity.members.length}/${activity.capacity}）</div>
        <div class="activity-members">${activity.members.map((m) => `<span class="tag">${esc(m.emoji)} ${esc(m.nickname)}${m.is_owner ? " · 发起人" : ""}</span>`).join("")}</div>
      </div>
      ${activity.pending ? `<div class="muted">还有 ${activity.pending} 条申请待发起人处理。</div>` : ""}
      <div class="activity-actions">${actionHtml(activity)}</div>
    </div>`;

  function openEdit(a) {
    modal({
      title: "编辑活动",
      okText: "保存",
      wide: true,
      body: `<div class="grid grid-2">
        <div class="field"><label>类型</label><select class="select" name="e_type">${TYPES.slice(1).map((t) => `<option ${a.type === t ? "selected" : ""}>${t}</option>`).join("")}</select></div>
        <div class="field"><label>标题</label><input class="input" name="e_title" maxlength="40" value="${esc(a.title)}"></div>
        <div class="field"><label>校区</label><select class="select" name="e_campus">${["泉山校区", "云龙校区", "奎园校区", "潘安湖校区"].map((c) => `<option ${a.campus === c ? "selected" : ""}>${c}</option>`).join("")}</select></div>
        <div class="field"><label>地点</label><input class="input" name="e_place" value="${esc(a.place)}"></div>
        <div class="field"><label>开始时间</label><input class="input" type="datetime-local" name="e_start" value="${esc((a.start_at || "").replace(" ", "T"))}"></div>
        <div class="field"><label>结束时间</label><input class="input" type="datetime-local" name="e_end" value="${esc((a.end_at || "").replace(" ", "T"))}"></div>
        <div class="field"><label>总人数（含发起人）</label><input class="input" type="number" name="e_capacity" min="2" max="50" value="${a.capacity}"></div>
        <div class="field"><label>报名截止</label><input class="input" type="datetime-local" name="e_deadline" value="${esc((a.signup_deadline || "").replace(" ", "T"))}"></div>
      </div>
      <div class="field" style="margin-top:10px"><label>说明</label><textarea class="textarea" name="e_content">${esc(a.content)}</textarea></div>
      <div class="field" style="margin-top:10px"><label>参与要求</label><input class="input" name="e_requirements" value="${esc(a.requirements || "")}"></div>`,
      onOk: async () => {
        const payload = {
          action: "edit",
          type: document.querySelector('[name="e_type"]').value,
          title: document.querySelector('[name="e_title"]').value,
          campus: document.querySelector('[name="e_campus"]').value,
          place: document.querySelector('[name="e_place"]').value,
          start_at: document.querySelector('[name="e_start"]').value,
          end_at: document.querySelector('[name="e_end"]').value,
          capacity: document.querySelector('[name="e_capacity"]').value,
          signup_deadline: document.querySelector('[name="e_deadline"]').value,
          content: document.querySelector('[name="e_content"]').value,
          requirements: document.querySelector('[name="e_requirements"]').value,
        };
        await api.patch(`/buddy/activities/${a.id}`, payload);
        toast("活动已更新", "success");
        document.getElementById("modalRoot").innerHTML = "";
        renderActivityDetail(root, ctx);
      },
    });
  }

  root.querySelectorAll("[data-detail-act]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const act = btn.getAttribute("data-detail-act");
      try {
        if (act === "apply") {
          openApply(activity, () => renderActivityDetail(root, ctx));
        } else if (act === "withdraw") {
          if (!confirm("撤回这次申请？")) return;
          await api.post(`/buddy/applications/${activity.mine.application_id}/withdraw`);
          toast("已撤回申请", "success");
          renderActivityDetail(root, ctx);
        } else if (act === "quit") {
          if (!confirm("退出活动？名额会释放给其他同学。")) return;
          await api.post(`/buddy/applications/${activity.mine.application_id}/quit`);
          toast("已退出活动", "success");
          renderActivityDetail(root, ctx);
        } else if (act === "chat") {
          ctx.navigate(`/life/buddy/messages?chat=${activity.mine.application_id}`);
        } else if (act === "more") {
          modal({
            title: "更多操作",
            hideOk: true,
            cancelText: "关闭",
            body: `<button class="btn btn-danger" id="reportActivity" style="width:100%">举报这个活动</button>
              <div class="muted" style="margin-top:8px">举报后活动会下架并等待管理员复核。</div>`,
          });
          document.getElementById("reportActivity").addEventListener("click", async () => {
            if (!confirm("确认举报这个活动？")) return;
            await api.post(`/buddy/posts/${activity.id}/report`, {});
            toast("已提交举报，活动已下架待复核", "success");
            document.getElementById("modalRoot").innerHTML = "";
            ctx.navigate("/life/buddy");
          });
        } else if (act === "invite") {
          const nearby = await api.get("/buddy/nearby");
          const candidates = (nearby || []).filter((x) => x.user_id !== 1);
          modal({
            title: "邀请同学参加",
            hideOk: true,
            cancelText: "关闭",
            wide: true,
            body: candidates.length
              ? `<div class="invite-list">${candidates
                  .map(
                    (x) => `<div class="invite-row">
                      <span class="draw-emoji">${esc((x.profile && x.profile.animal_emoji) || "🐾")}</span>
                      <div><strong>${esc((x.profile && x.profile.nickname) || "师大同学")}</strong>
                        <div class="muted">${esc((x.profile && x.profile.college) || "")} · ${esc((x.profile && x.profile.active_time) || "")}</div>
                      </div>
                      <button class="btn btn-primary btn-sm" data-invite-user="${x.user_id}">邀请</button>
                    </div>`
                  )
                  .join("")}</div><div class="muted" style="margin-top:10px">邀请会进入对方的「申请与消息」，对方接受后即可聊天。</div>`
              : '<div class="empty"><strong>暂时没有可邀请的同学</strong>对方需要公开搭子档案</div>',
          });
          document.querySelectorAll("[data-invite-user]").forEach((btn) => {
            btn.addEventListener("click", async () => {
              try {
                await api.post(`/buddy/activities/${activity.id}/invite`, { user_id: Number(btn.getAttribute("data-invite-user")) });
                toast("邀请已发送，等待对方回应", "success");
                btn.disabled = true;
                btn.textContent = "已邀请";
              } catch (e) {
                toast(e.message, "error");
              }
            });
          });
        } else if (act === "applications") {
          ctx.navigate("/life/buddy/messages?tab=received");
        } else if (act === "viewApply") {
          modal({
            title: "申请状态",
            hideOk: true,
            cancelText: "关闭",
            body: `<div class="draft-card"><div class="card-title">${esc(activity.title)}</div>
              <div class="small">当前状态：${esc(activity.mine.status_label || "待处理")}</div>
              <div class="muted" style="margin-top:6px">发起人处理后会在这里和「申请与消息」同步。</div></div>`,
          });
        } else if (act === "stop") {
          if (!confirm("停止招募？已通过成员保留，但不再接收新申请。")) return;
          await api.patch(`/buddy/activities/${activity.id}`, { action: "stop" });
          toast("已停止招募", "success");
          renderActivityDetail(root, ctx);
        } else if (act === "finish") {
          if (!confirm("结束活动？活动会进入历史记录。")) return;
          await api.patch(`/buddy/activities/${activity.id}`, { action: "finish" });
          toast("活动已结束", "success");
          renderActivityDetail(root, ctx);
        } else if (act === "cancel") {
          modal({
            title: "取消活动",
            okText: "确认取消",
            body: `<div class="field"><label>取消原因（会通知所有成员）</label><textarea class="textarea" id="cancelReason" placeholder="例如：场地临时调整"></textarea></div>`,
            onOk: async () => {
              const reason = document.getElementById("cancelReason").value.trim();
              await api.patch(`/buddy/activities/${activity.id}`, { action: "cancel", reason });
              toast("活动已取消，成员会收到通知", "success");
              document.getElementById("modalRoot").innerHTML = "";
              renderActivityDetail(root, ctx);
            },
          });
        } else if (act === "edit") {
          openEdit(activity);
        } else if (act === "delete") {
          if (!confirm("删除活动？相关申请和聊天会一起删除，不可恢复。")) return;
          await api.del(`/buddy/activities/${activity.id}`);
          toast("活动已删除", "success");
          ctx.navigate("/life/buddy/mine");
        }
      } catch (e) {
        toast(e.message, "error");
      }
    });
  });
}

function peopleText(a) {
  if (a.effective_status === "cancelled") return `已取消 · 原定 ${a.capacity} 人`;
  if (a.remaining <= 0) return `已参加 ${a.taken}/${a.capacity} 人 · 已满员`;
  return `已参加 ${a.taken}/${a.capacity} 人，还缺 ${a.remaining} 人`;
}