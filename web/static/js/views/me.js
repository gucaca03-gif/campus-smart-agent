import { api } from "../api.js";
import { wgs84ToGcj02 } from "../geo.js";
import { esc, money, statusBadge, toast, today } from "../ui.js";

const safe = (r, fb) => (r.status === "fulfilled" ? r.value : fb);

const AVATAR_EMOJI = { 柯基: "🐕", 猫猫: "🐈", 海豚: "🐬", 刺猬: "🦔", 仓鼠: "🐹", 狐狸: "🦊", 鹅: "🦢", 水獭: "🦦" };

function avatarOf(profile) {
  if (profile && profile.avatar) return `<img class="me-avatar" src="/static/img/avatars/${esc(profile.avatar)}" alt="">`;
  return `<span class="me-avatar me-avatar-emoji">${AVATAR_EMOJI[profile && profile.animal_type] || "🎓"}</span>`;
}

/* ================= 我的 · 个人事务中心 ================= */
export async function render(root, ctx) {
  const results = await Promise.allSettled([
    api.get("/me"),
    api.get("/bookings/my"),
    api.get("/buddy/applications"),
    api.get("/repairs/my"),
    api.get("/messages"),
    api.get("/self/pomodoro/stats"),
    api.get("/buddy/profile"),
    api.get("/deal/overview"),
    api.get("/self/control/overview"),
    api.get("/buddy/posts"),

  ]);
  const me = safe(results[0], { name: "师大同学", college: "—", campus: "泉山校区", role: "学生", note: "" });
  const bookings = safe(results[1], []);
  const apps = safe(results[2], []);
  const repairs = safe(results[3], []);
  const messages = safe(results[4], { unread: 0 });
  const pomo = safe(results[5], { minutes: 0, today: 0, count: 0 });
  const buddy = safe(results[6], null);
  const deal = safe(results[7], { plans: [], money: {} });
  const selfOv = safe(results[8], { tasks: [], focus: { minutes: 0, count: 0 } });
  const posts = safe(results[9], []);


  const activeBookings = bookings.filter((b) => ["pending_approval", "confirmed", "checked_in"].includes(b.status));
  const todayBookings = bookings.filter((b) => b.date === today() && ["confirmed", "checked_in"].includes(b.status));
  const pendingApps = apps.filter((a) => a.role === "owner" && a.status === "pending");
  const openRepairs = repairs.filter((r) => !["completed", "closed", "done"].includes(r.status));
  const unread = Number(messages.unread || 0);
  const myPosts = posts.filter((p) => p.user_id === 1);
  const activePlans = (deal.plans || []).filter((p) => ["planned", "cooling"].includes(p.decision_status || "planned"));
  const todayTasks = (selfOv.tasks || []).filter((t) => (t.plan_date || "") === today() && t.status !== "done");
  const focusMinutes = (selfOv.focus && selfOv.focus.minutes) || pomo.minutes || 0;

  const todo = [];
  if (todayBookings.length) {
    const b = todayBookings[0];
    todo.push({ href: "#/me/bookings?filter=active", title: `今天有 ${todayBookings.length} 个预约待使用`, sub: `${esc(b.resource_name)} · ${esc(b.start_at)}–${esc(b.end_at)}`, tone: "blue", go: "查看" });
  }
  if (pendingApps.length) {
    todo.push({ href: "#/life/buddy?tab=mine&sub=apps", title: `${pendingApps.length} 条搭子申请待处理`, sub: "通过后即可开始聊天", tone: "gold", go: "去处理" });
  }
  if (openRepairs.length) {
    todo.push({ href: "#/repair", title: `${openRepairs.length} 个报修正在处理`, sub: esc(openRepairs[0].title || openRepairs[0].location || ""), tone: "green", go: "查看进度" });
  }
  if (unread) {
    todo.push({ href: "msg", title: `${unread} 条未读消息`, sub: "来自预约、搭子与校园通知", tone: "gray", go: "去查看" });
  }

  root.innerHTML = `

    <div class="card me-profile">
      ${avatarOf(buddy)}
      <div class="me-info">
        <div class="me-name">${esc((buddy && buddy.nickname) || me.name)}</div>
        <div class="me-meta">${esc(me.college)} · ${esc(me.campus)} · ${esc(me.role)}</div>
        <div class="me-badges">
          ${buddy && buddy.mbti ? `<span class="tag tag-blue">${esc(buddy.mbti)}</span>` : ""}
          ${buddy && buddy.animal_type ? `<span class="tag">${esc(buddy.animal_type)}型</span>` : ""}
          ${buddy && buddy.place ? `<span class="tag">📍 ${esc(buddy.place)}</span>` : ""}
        </div>
      </div>
      <div class="me-actions">
        <a class="btn btn-ghost btn-sm" href="#/life/buddy?tab=profile">编辑资料</a>
        <a class="btn btn-ghost btn-sm" href="#/me/settings">设置</a>
      </div>
    </div>

    ${todo.length
      ? `<div class="section-title">待处理 <span class="title-hint">${todo.length} 项</span></div>
         <div class="todo-list">
           ${todo.map((t) => `<a class="todo-row tone-${t.tone}" href="${t.href}" ${t.href === "msg" ? 'data-open-msg="1"' : ""}>
             <span class="todo-dot"></span>
             <div class="todo-main"><div class="todo-title">${t.title}</div><div class="todo-sub">${t.sub}</div></div>
             <span class="todo-go">${t.go} ›</span>
           </a>`).join("")}
         </div>`
      : `<div class="section-title">待处理</div>
         <div class="card me-empty"><span class="me-empty-ico">✓</span><div><b>目前没有待处理事项</b><span>预约、搭子申请和报修进度都会出现在这里。</span></div></div>`}

    <div class="section-title">我的服务</div>
    <div class="grid grid-3 me-services">
      <a class="card me-service" href="#/me/bookings">
        <div class="ms-ico ms-blue">📅</div>
        <div class="ms-main"><div class="ms-title">我的预约</div><div class="ms-sub">进行中 ${activeBookings.length} 个</div></div>
        <span class="ms-num">${activeBookings.length}</span>
      </a>
      <a class="card me-service" href="#/life/buddy?tab=mine">
        <div class="ms-ico ms-gold">🤝</div>
        <div class="ms-main"><div class="ms-title">我的搭子</div><div class="ms-sub">发布 ${myPosts.length} · 申请 ${apps.length}</div></div>
        <span class="ms-num">${myPosts.length + apps.length}</span>
      </a>
      <a class="card me-service" href="#/life/deal">
        <div class="ms-ico ms-green">💰</div>
        <div class="ms-main"><div class="ms-title">我的购买计划</div><div class="ms-sub">待决定 ${activePlans.length} 个</div></div>
        <span class="ms-num">${activePlans.length}</span>
      </a>
      <a class="card me-service" href="#/repair">
        <div class="ms-ico ms-cyan">🛠</div>
        <div class="ms-main"><div class="ms-title">我的报修</div><div class="ms-sub">处理中 ${openRepairs.length} 个</div></div>
        <span class="ms-num">${openRepairs.length}</span>
      </a>

      <a class="card me-service" href="#/life/self/control?tab=today">
        <div class="ms-ico ms-blue">📝</div>
        <div class="ms-main"><div class="ms-title">自我管理</div><div class="ms-sub">今日待办 ${todayTasks.length} 项</div></div>
        <span class="ms-go">›</span>
      </a>
    </div>

    <div class="section-title">自我管理摘要</div>
    <div class="card me-self">
      <div class="me-self-stats">
        <div><b>${todayTasks.length}</b><span>今日待办</span></div>
        <div class="me-self-sep"></div>
        <div><b>${focusMinutes}</b><span>今日专注（分钟）</span></div>
      </div>
      <a class="btn btn-primary btn-sm" href="#/life/self/control?tab=today">继续今日计划 →</a>
      <div class="muted me-self-hint">任务编辑、番茄钟与复盘请进入自我管理操作</div>
    </div>

    `;

  root.querySelectorAll("[data-open-msg]").forEach((el) =>
    el.addEventListener("click", (e) => {
      e.preventDefault();
      const btn = document.getElementById("msgBtn");
      if (btn) btn.click();
      else toast("请在顶部消息中心查看", "error");
    })
  );
}

/* ================= 我的预约 · 二级页 ================= */
export async function renderBookings(root, ctx) {
  const filter = (ctx && ctx.params && ctx.params.get("filter")) || "all";
  const rawRows = await api.get("/bookings/my");
  // 多时段座位预约按 reservation_key 合并成一张卡，签到/取消/离场都以预约组为单位
  const rows = (() => {
    const out = [];
    const map = new Map();
    for (const b of rawRows) {
      if (b.type !== "seat" || !b.reservation_key) {
        out.push({ ...b });
        continue;
      }
      const key = b.reservation_key;
      if (!map.has(key)) {
        const g = { ...b };
        map.set(key, g);
        out.push(g);
        continue;
      }
      const g = map.get(key);
      if (b.start_at < g.start_at) g.start_at = b.start_at;
      if (b.end_at > g.end_at) g.end_at = b.end_at;
      g.people = Math.max(Number(g.people || 1), Number(b.people || 1));
      if (["checked_in", "away"].includes(b.status)) g.status = b.status;
      else if (b.status === "confirmed" && !["checked_in", "away"].includes(g.status)) g.status = "confirmed";
      if (!g.code && b.code) g.code = b.code;
    }
    return out;
  })();
  const hm = (d) => `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  const seatWindow = (b) => {
    const start = new Date(`${b.date}T${b.start_at}:00`);
    const open = new Date(start.getTime() - 15 * 60 * 1000);
    const close = new Date(start.getTime() + 15 * 60 * 1000);
    const now = Date.now();
    return { open, close, can: now >= open.getTime() && now <= close.getTime(), before: now < open.getTime(), after: now > close.getTime() };
  };
  const groups = {
    pending: ["pending_approval"],
    upcoming: ["confirmed"],
    active: ["checked_in", "away"],
    done: ["completed", "checked_out", "no_show", "released"],
    cancelled: ["cancelled", "rejected"],
  };
  const labels = { all: "全部", pending: "待审批", upcoming: "待签到", active: "进行中", done: "已结束", cancelled: "已取消" };
  const keys = ["all", "pending", "upcoming", "active", "done", "cancelled"];
  const matchFilter = (b, key) => key === "all" || (groups[key] || []).includes(b.status);
  const list = rows.filter((b) => matchFilter(b, filter));

  const card = (b) => {
    const w = b.type === "seat" ? seatWindow(b) : null;
    const canCheckin = b.type === "seat" ? b.status === "confirmed" && w.can : b.status === "confirmed";
    const canCancel = ["pending_approval", "confirmed"].includes(b.status);
    const canAgain = ["completed", "cancelled", "rejected", "no_show", "released"].includes(b.status);
    const beforeMin = w ? Math.max(1, Math.ceil((w.open.getTime() - Date.now()) / 60000)) : 0;
    const beforeText = beforeMin >= 60 ? `${Math.floor(beforeMin / 60)} 小时 ${beforeMin % 60} 分钟` : `${beforeMin} 分钟`;
    return `<div class="card me-bk-card">
      <div class="me-bk-head">
        <div class="me-bk-main">
          <div class="me-bk-name">${esc(b.resource_name)}</div>
          <div class="me-bk-meta">${esc(b.room || "—")} · ${b.people} 人</div>
        </div>
        ${statusBadge(b.status)}
      </div>
      <div class="me-bk-when no-date">
        <div class="me-bk-time">${esc(b.start_at)}–${esc(b.end_at)}</div>
        ${b.code ? `<div class="me-bk-code">预约号 ${esc(b.code)}</div>` : ""}
      </div>
      ${w && b.status === "confirmed"
        ? `<div class="me-bk-window">可签到：${esc(b.date.slice(5))} ${hm(w.open)}–${hm(w.close)}${w.can ? " · 现在可签到" : w.before ? ` · 还有 ${beforeText}` : " · 已过签到时间"}</div>`
        : ""}
      <div class="me-bk-actions">
        ${canCheckin ? `<button class="btn btn-primary btn-sm" data-checkin="${b.id}" data-type="${esc(b.type)}">${b.type === "seat" ? "📍 定位签到" : "签到"}</button>` : ""}
        ${canCancel ? `<button class="btn btn-ghost btn-sm" data-cancel="${b.id}">取消预约</button>` : ""}
        ${canAgain ? `<button class="btn btn-ghost btn-sm" data-again="${b.id}">再次预约</button>` : ""}
        <button class="btn btn-ghost btn-sm" data-detail="${b.id}">查看详情</button>
      </div>
    </div>`;
  };

  const tomorrow = (() => {
    const d = new Date(today() + "T00:00:00");
    d.setDate(d.getDate() + 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  })();
  const dateLabel = (d) => (d === today() ? `今天 · ${d}` : d === tomorrow ? `明天 · ${d}` : d < today() ? `${d} · 已过` : d);
  const sorted = [...list].sort((a, b) => {
    const ka = `${a.date} ${a.start_at}`;
    const kb = `${b.date} ${b.start_at}`;
    if (["done", "cancelled"].includes(filter)) return kb.localeCompare(ka);
    const pa = a.date < today() ? 1 : 0;
    const pb = b.date < today() ? 1 : 0;
    if (pa !== pb) return pa - pb;
    return pa ? kb.localeCompare(ka) : ka.localeCompare(kb);
  });
  const byDate = new Map();
  sorted.forEach((b) => {
    if (!byDate.has(b.date)) byDate.set(b.date, []);
    byDate.get(b.date).push(b);
  });
  const listHtml = sorted.length
    ? [...byDate.entries()]
        .map(
          ([date, items]) => `<div class="me-bk-date-head"><b>${dateLabel(date)}</b><span>${items.length} 条</span></div>
            <div class="me-bk-grid">${items.map(card).join("")}</div>`
        )
        .join("")
    : '<div class="card me-empty"><span class="me-empty-ico">📭</span><div><b>没有符合条件的预约</b><span>换个筛选条件，或去预约中心新建一个。</span></div></div>';

  root.innerHTML = `
    <div class="page-head"><div><div class="page-title">我的预约</div><div class="page-sub">按状态筛选后，预约会按日期分组显示。</div></div>
      <a class="btn btn-ghost btn-sm" href="#/me">‹ 返回我的</a></div>
    <div class="card me-bk-filter">
      <div class="me-bk-filter-head"><b>按状态筛选</b><span>共 ${rows.length} 条预约</span></div>
      <div class="chips me-bk-chips">
        ${keys.map((k) => `<a class="chip ${k === filter ? "active" : ""}" href="#/me/bookings?filter=${k}">${labels[k]} <span class="chip-num">${rows.filter((b) => matchFilter(b, k)).length}</span></a>`).join("")}
      </div>
    </div>
    ${listHtml}`;

  root.querySelectorAll("[data-cancel]").forEach((btn) =>
    btn.addEventListener("click", async () => {
      if (!confirm("确定取消这条预约？")) return;
      await api.post(`/bookings/${btn.getAttribute("data-cancel")}/cancel`);
      toast("已取消", "success");
      renderBookings(root, ctx);
    })
  );
  root.querySelectorAll("[data-checkin]").forEach((btn) =>
    btn.addEventListener("click", async () => {
      const bid = btn.getAttribute("data-checkin");
      const type = btn.getAttribute("data-type");
      try {
        if (type === "seat") {
          if (!navigator.geolocation) throw new Error("当前浏览器不支持定位");
          const coords = await new Promise((resolve, reject) =>
            navigator.geolocation.getCurrentPosition(
              (pos) => resolve(pos.coords),
              (err) => reject(new Error(err && err.code === 1 ? "定位权限被拒绝，请在浏览器中允许定位" : "获取定位失败，请检查定位服务")),
              { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
            )
          );
          const [lng, lat] = wgs84ToGcj02(coords.longitude, coords.latitude);
          await api.post(`/bookings/${bid}/checkin`, { lat, lng });
        } else {
          await api.post(`/bookings/${bid}/checkin`);
        }
        toast("签到成功", "success");
        renderBookings(root, ctx);
      } catch (e) {
        toast(e.message, "error");
      }
    })
  );
  root.querySelectorAll("[data-again]").forEach((btn) =>
    btn.addEventListener("click", () => (location.hash = "#/work"))
  );
  root.querySelectorAll("[data-detail]").forEach((btn) =>
    btn.addEventListener("click", async () => {
      const b = rows.find((x) => String(x.id) === btn.getAttribute("data-detail"));
      if (!b) return;
      const { modal } = await import("../ui.js");
      modal({
        title: "预约详情",
        hideOk: true,
        cancelText: "关闭",
        body: `<div class="me-bk-detail">
          <div><span>资源</span><b>${esc(b.resource_name)}</b></div>
          <div><span>位置</span><b>${esc(b.room || "—")}</b></div>
          <div><span>日期</span><b>${esc(b.date)}</b></div>
          <div><span>时段</span><b>${esc(b.start_at)}–${esc(b.end_at)}</b></div>
          <div><span>人数</span><b>${b.people}</b></div>
          <div><span>状态</span><b>${esc(b.status_label || b.status)}</b></div>
          <div><span>预约号</span><b>${esc(b.code || "—")}</b></div>
          ${b.purpose ? `<div><span>用途</span><b>${esc(b.purpose)}</b></div>` : ""}
        </div>`,
      });
    })
  );
}

/* ================= 设置 ================= */
export async function renderSettings(root) {
  const [profile, messages] = await Promise.allSettled([api.get("/buddy/profile"), api.get("/messages")]);
  const p = safe(profile, null);
  const m = safe(messages, { unread: 0 });
  root.innerHTML = `
    <div class="page-head"><div><div class="page-title">设置</div><div class="page-sub">资料、通知、隐私与关于系统。</div></div>
      <a class="btn btn-ghost btn-sm" href="#/me">‹ 返回我的</a></div>
    <div class="card me-settings">
      <a class="me-set-row" href="#/life/buddy?tab=profile"><span>个人资料</span><b>${esc((p && p.nickname) || "师大同学")} ›</b></a>
      <a class="me-set-row" href="#/life/buddy?tab=profile"><span>默认校区</span><b>泉山校区 ›</b></a>
      <a class="me-set-row" href="#/life/self/control?tab=today"><span>消息通知</span><b>按消息中心设置 ›</b></a>
      <div class="me-set-row"><span>隐私与授权</span><b>${m.unread || 0} 条未读</b></div>
      <a class="me-set-row" href="#/me/bookings"><span>数据管理</span><b>预约与记录 ›</b></a>
      <div class="me-set-row"><span>关于系统</span><b>爱师大 v2.1</b></div>
    </div>
`;
}