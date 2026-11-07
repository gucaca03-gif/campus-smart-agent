import { api } from "../api.js";
import { loadLeaflet } from "../geo.js";
import { addDays, esc, money, modal, statusBadge, today, toast } from "../ui.js";


const ICO_PIN = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11Z"/><circle cx="12" cy="10" r="2.6"/></svg>`;
const ICO_PARTNER = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="9" r="3"/><circle cx="17" cy="10.5" r="2.4"/><path d="M3.5 19.5c.6-2.8 2.7-4.2 5.5-4.2s4.9 1.4 5.5 4.2"/><path d="M15 15.6c2.2.1 3.6 1.3 4 3.4"/></svg>`;
const ICO_BAG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M5 8h14l-1.4 12.2a1.6 1.6 0 0 1-1.6 1.4H8a1.6 1.6 0 0 1-1.6-1.4L5 8Z"/><path d="M8.6 8V6.2a3.4 3.4 0 0 1 6.8 0V8"/></svg>`;
const ICO_FIX = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a4.5 4.5 0 0 0-6 5.6L3 17.6V21h3.4l5.7-5.7a4.5 4.5 0 0 0 5.6-6L14.5 12l-2.5-2.5 2.7-3.2Z"/></svg>`;

function lifeHero(title, sub, stats = []) {
  return `<div class="detail-hero book-hero">
    <div class="detail-art"><svg viewBox="0 0 200 160" fill="none">
      <circle cx="88" cy="84" r="52" stroke="#8fdcff" stroke-opacity=".4" stroke-width="1.6"/>
      <path d="M88 44 V124 M48 84 H128" stroke="#8fdcff" stroke-opacity=".3" stroke-width="1.4"/>
      <path d="M56 66 Q88 44 120 66 M56 102 Q88 124 120 102" stroke="#eaf7ff" stroke-opacity=".4" stroke-width="1.4"/>
      <circle cx="88" cy="84" r="14" fill="#8fdcff" opacity=".2"/>
      <path d="M148 56 l-6 22 22-6" stroke="#f0cf94" stroke-opacity=".75" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="156" cy="118" r="12" stroke="#f0cf94" stroke-opacity=".5" stroke-width="1.6"/>
    </svg></div>
    <div class="tag">CAMPUS LIFE</div>
    <h1>${title}</h1>
    <p>${sub}</p>
    ${stats.length ? `<div class="bh-stats">${stats.map(([num, label]) => `<div class="bh-stat"><b>${num}</b><span>${label}</span></div>`).join("")}</div>` : ""}
  </div>`;
}

function zoneEntry({ href, tone, ico, title, badge, desc, stat, btn }) {
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
  const [savings, buddy, repairs] = await Promise.all([
    api.get("/savings/summary").catch(() => ({ saved: 0 })),
    api.get("/buddy/posts").catch(() => []),
    api.get("/repairs/my").catch(() => []),
  ]);
  const buddyOpen = buddy.filter((p) => p.status === "open").length;
  const repairOpen = repairs.filter((r) => r.status !== "done").length;
  const savedYuan = money(savings.saved || 0);

  root.innerHTML = `
    ${lifeHero("生活区", "出行、社交、消费与报修，校园生活的日常入口。", [
      [buddyOpen, "个进行中搭子"],
      [`¥${savedYuan}`, "累计已省"],
      [repairOpen, "个报修处理中"],
    ])}

    <div class="ze-grid">
      ${zoneEntry({
        href: "#/life/nav", tone: "b", ico: ICO_PIN, title: "校园导航", badge: "真实地图",
        desc: "别名搜索 · 步行路线 · 唤起高德",
        stat: `25 个校园地点 · 支持口语叫法`,
        btn: "带我去",
      })}
      ${zoneEntry({
        href: "#/life/buddy", tone: "o", ico: ICO_PARTNER, title: "找搭子", badge: `${buddyOpen} 进行中`,
        desc: "找活动 · 找搭子 · 站内聊天",
        stat: `按兴趣和空闲时间找搭子`,
        btn: "找搭子",
      })}
      ${zoneEntry({
        href: "#/life/deal", tone: "p", ico: ICO_BAG, title: "省一省", badge: "理性消费",
        desc: "购买计划 · 放弃即省钱，把钱花明白",
        stat: `累计已省 <b>¥${savedYuan}</b>`,
        btn: "去省钱",
      })}
      ${zoneEntry({
        href: "#/repair", tone: "v", ico: ICO_FIX, title: "报修", badge: "",
        desc: "宿舍 · 教学楼 · 公共区域设施问题",
        stat: `一处提交 · 进度全程可查${repairOpen ? ` · <b>${repairOpen}</b> 个处理中` : ""}`,
        btn: "去报修",
      })}
    </div>

`;
}

/* ---------- 导航 ---------- */
function project(places, route) {
  const lngs = places.map((p) => p.lng);
  const lats = places.map((p) => p.lat);
  const minX = Math.min(...lngs), maxX = Math.max(...lngs);
  const minY = Math.min(...lats), maxY = Math.max(...lats);
  const sx = (lng) => 50 + ((lng - minX) / (maxX - minX || 1)) * 700;
  const sy = (lat) => 290 - ((lat - minY) / (maxY - minY || 1)) * 240;
  return { sx, sy, routePoints: route ? route.polyline.map((p) => `${sx(p.lng)},${sy(p.lat)}`).join(" ") : "" };
}

/* ---------- 搭子 ---------- */
export async function renderBuddy(root, ctx) {
  const types = ["全部", "学习", "运动", "摄影", "饭搭子", "游戏", "观展", "考研", "自习"];
  const state = { tab: (ctx && ctx.params && ctx.params.get("tab")) || "discover", rows: [], profile: null, matches: [], nearby: [], applications: [], recOffset: 0, testKind: null, testIdx: 0, testAnswers: [] };
  const meta = await Promise.allSettled([
    api.get("/buddy/posts"),
    api.get("/buddy/profile"),
    api.get("/buddy/matches"),
    api.get("/buddy/test"),
    api.get("/buddy/applications"),
    api.get("/buddy/nearby"),
  ]);
  state.rows = meta[0].status === "fulfilled" ? meta[0].value : [];
  state.profile = meta[1].status === "fulfilled" ? meta[1].value : null;
  state.matches = meta[2].status === "fulfilled" ? meta[2].value : [];
  state.applications = meta[4].status === "fulfilled" ? meta[4].value : [];
  state.nearby = meta[5].status === "fulfilled" ? meta[5].value : [];
  state.questions = meta[3].status === "fulfilled" ? meta[3].value : { animal_questions: [], mbti_questions: [] };

  const hasProfile = state.profile && state.profile.animal_type && state.profile.mbti;

  const modeTitle = state.tab === "test" ? "趣味问答" : state.tab === "profile" ? "我的搭子档案" : "找搭子";

  root.innerHTML = `
    <div class="page-head"><div><div class="page-title">${modeTitle}</div></div>
      <a class="btn btn-ghost btn-sm" href="#/life/buddy">返回找搭子</a></div>
    <div id="buddyBody"></div>`;

  const body = root.querySelector("#buddyBody");

  root.querySelectorAll("[data-bt]").forEach((el) =>
    el.addEventListener("click", () => {
      state.tab = el.dataset.bt;
      root.querySelectorAll("[data-bt]").forEach((x) => x.classList.toggle("on", x.dataset.bt === state.tab));
      draw();
    })
  );

  const avatarHTML = (p, cls = "bd-ava") => {
    const uid = Number((p && p.user_id) || 0);
    const fallback = `avatar-0${(uid % 8) + 1}a.svg`;
    const file = (p && p.avatar) || fallback;
    return `<img class="${cls}" src="/static/img/avatars/${esc(file)}" alt="">`;
  };
  const animalBadge = (p) =>
    p && p.animal_type
      ? `<span class="bd-badge" title="${esc(p.animal_type)}搭子">${{ 柯基: "🐕", 猫猫: "🐈", 海豚: "🐬", 刺猬: "🦔", 仓鼠: "🐹", 狐狸: "🦊", 鹅: "🦢", 水獭: "🦦" }[p.animal_type] || "🐾"} ${esc(p.animal_type)}</span>`
      : "";
  const mbtiBadge = (p) => (p && p.mbti ? `<span class="bd-badge mbti">${esc(p.mbti)}</span>` : "");

  /* ================= 发现 ================= */
  function drawDiscover() {
    const recommend = state.matches.slice(0, 3);
    body.innerHTML = `
      <div class="page-head"><div><div class="page-title">找搭子</div><div class="page-sub">按兴趣和空闲时间找活动、找搭子。</div></div>
        <div class="row">
          <button class="btn btn-ghost" id="chatEntry">💬 申请与聊天</button>
          <button class="btn btn-primary" id="newBuddy">发布搭子</button>
        </div></div>

      <div class="section-title">为你推荐 <span class="title-hint">基于性格档案的匹配</span>
        <button class="title-action" id="refreshRec" type="button">换一批 ↻</button>
      </div>
      <div id="recBox">${recommendHTML()}</div>

      <div class="section-title">附近的同学 <span class="title-hint">摇一摇，抽出今天可能遇到的人</span></div>
      <div class="near-zone">
        <div class="near-map-wrap">
          <div id="nearMap" class="near-map"></div>
          <div class="near-map-tip">地图上的标记是同学常出没的位置</div>
        </div>
        <div class="near-draw">
          <button class="btn btn-primary draw-btn" id="drawBtn" type="button">🎲 摇一摇抽 3 张纸条</button>
          <div id="drawBox" class="draw-box"><div class="muted">点一下，从附近公开档案里抽出今天可能遇到的人</div></div>
        </div>
      </div>

      <div class="section-title">搭子墙</div>
      <div class="chips" style="margin-bottom:14px">${types.map((t) => `<button class="chip ${t === "全部" ? "active" : ""}" data-type="${t}">${t}</button>`).join("")}</div>
      <div id="buddyList" class="grid grid-2"></div>`;

    // 推荐卡片渲染（局部刷新用）
    function recommendHTML() {
      const all = state.matches;
      if (!all.length) {
        return '<div class="card" style="margin-bottom:14px"><a class="lnk" data-bt-jump="test">完成任一性格测试后，这里会出现为你挑选的搭子 →</a></div>';
      }
      const start = state.recOffset % all.length;
      const list = [];
      for (let i = 0; i < Math.min(3, all.length); i += 1) list.push(all[(start + i) % all.length]);
      return `<div class="match-strip">${list
        .map(
          (x) => `<div class="match-card" data-mid="${x.user_id}">
            <div class="mc-top">
              ${avatarHTML(x.profile, "mc-ava")}
              <div class="mc-score">${x.score}<i>%</i></div>
            </div>
            <div class="mc-name">${esc(x.profile.nickname)}<span class="bd-badge mbti">${esc(x.profile.mbti)}</span></div>
            <div class="mc-tags">${esc(x.profile.animal_type || "待测")} · ${esc(x.profile.college)}</div>
            <div class="mc-reason">${esc(x.reason)}</div>
            <div class="mc-foot"><span>${esc(x.post.title)}</span><button class="mc-go" data-go="${x.user_id}">查看 ›</button></div>
          </div>`
        )
        .join("")}</div>`;
    }

    function bindRecommend() {
      body.querySelectorAll("[data-go]").forEach((btn) =>
        btn.addEventListener("click", () => {
          const x = state.matches.find((m) => m.user_id === Number(btn.dataset.go));
          if (x) openPeerCard(x);
        })
      );
      const jump = body.querySelector("[data-bt-jump]");
      if (jump) jump.addEventListener("click", () => { state.tab = "test"; draw(); });
    }

    async function refreshRecommend() {
      const btn = body.querySelector("#refreshRec");
      if (btn) { btn.disabled = true; btn.textContent = "刷新中…"; }
      try {
        state.recOffset += 3;
        state.matches = await api.get(`/buddy/matches?offset=${state.recOffset}`);
        const box = body.querySelector("#recBox");
        if (box) box.innerHTML = recommendHTML();
        bindRecommend();
        const strip = body.querySelector("#recBox .match-strip");
        if (strip) strip.classList.add("rec-fresh");
      } catch (e) {
        toast(e.message, "error");
      } finally {
        const b = body.querySelector("#refreshRec");
        if (b) { b.disabled = false; b.textContent = "换一批 ↻"; }
      }
    }

    // 摇一摇：随机抽 3 位附近同学
    function drawNearby() {
      const pool = [...state.nearby];
      if (!pool.length) { toast("暂时没有公开档案的同学", "error"); return; }
      const picks = [];
      while (picks.length < Math.min(3, pool.length)) {
        picks.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
      }
      const box = body.querySelector("#drawBox");
      box.innerHTML = picks
        .map(
          (x, i) => `<div class="draw-card" style="animation-delay:${(i * 0.12).toFixed(2)}s">
            ${avatarHTML(x.profile, "dc-ava")}
            <div class="dc-main">
              <div class="dc-name">${esc(x.profile.nickname)}<span class="bd-badge mbti">${esc(x.profile.mbti)}</span></div>
              <div class="dc-meta">${esc(x.profile.college)}${x.same_college ? " · 同学院" : ""}</div>
              <div class="dc-place">📍 ${esc(x.place || "泉山校区")}${x.post ? ` · ${esc(x.post.type)}搭子` : ""}</div>
            </div>
            <button class="btn btn-primary btn-sm" data-invite="${x.user_id}">邀请</button>
          </div>`
        )
        .join("");
      box.querySelectorAll("[data-invite]").forEach((b) =>
        b.addEventListener("click", () => {
          const x = state.nearby.find((n) => n.user_id === Number(b.dataset.invite));
          if (x) openPeerCard(x);
        })
      );
    }

    // 附近地图
    async function initNearMap() {
      const el = body.querySelector("#nearMap");
      if (!el) return;
      try {
        const L = await loadLeaflet();
        if (!body.querySelector("#nearMap")) return;
        const map = L.map(el, { zoomControl: false, attributionControl: false }).setView([34.1975, 117.1733], 16);
        L.tileLayer("https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}", {
          subdomains: "1234",
          maxZoom: 19,
        }).addTo(map);
        // 同一地点可能有多位同学，坐标完全相同会互相遮挡：按人数环形散开
        const groups = new Map();
        state.nearby.forEach((x) => {
          if (x.lat == null || x.lng == null) return;
          const key = `${Number(x.lat).toFixed(5)},${Number(x.lng).toFixed(5)}`;
          if (!groups.has(key)) groups.set(key, []);
          groups.get(key).push(x);
        });
        groups.forEach((list) => {
          list.forEach((x, i) => {
            let lat = Number(x.lat);
            let lng = Number(x.lng);
            if (list.length > 1) {
              const angle = (Math.PI * 2 * i) / list.length - Math.PI / 2;
              lat += 0.00022 * Math.sin(angle);
              lng += 0.00030 * Math.cos(angle);
            }
            const icon = L.divIcon({
              className: "",
              html: `<div class="near-pin"><b>${esc(x.profile.nickname)}</b></div>`,
              iconSize: [10, 10],
            });
            L.marker([lat, lng], { icon, zIndexOffset: i * 10 }).addTo(map).on("click", () => openPeerCard(x));
          });
        });
        setTimeout(() => map.invalidateSize(), 250);
      } catch (e) {
        el.innerHTML = '<div class="muted" style="padding:14px">地图组件暂不可用，纸条抽取仍可使用</div>';
      }
    }

    // 匹配卡 / 附近同学：打开对方档案，可直接发起邀请
    function openPeerCard(x) {
      const post = x.post || null;
      const already = post && state.applications.some((a) => a.post_id === post.id && a.role === "applicant");
      modal({
        title: `${x.profile.nickname} 的档案${x.score != null ? ` · 匹配度 ${x.score}%` : ""}`,
        hideOk: true,
        cancelText: "关闭",
        body: `<div class="mc-modal">
          <div class="mc-ava big">${avatarHTML(x.profile, "mc-ava-img")}</div>
          <div class="row" style="justify-content:center;gap:6px">${mbtiBadge(x.profile)}${animalBadge(x.profile)}</div>
          <div class="muted" style="text-align:center">${esc(x.profile.college)} · ${esc(x.profile.active_time)}</div>
          ${x.reason ? `<div class="mc-reason" style="margin-top:10px">${esc(x.reason)}</div>` : ""}
          ${post
            ? `<div class="card" style="margin-top:12px"><span class="tag tag-blue">${esc(post.type)}</span>
                <strong style="margin-left:6px">${esc(post.title)}</strong>
                <div class="muted" style="margin-top:4px">${esc(post.time)} · ${esc(post.place)}</div></div>
              <div class="row" style="margin-top:14px;justify-content:center">
                <button class="btn btn-primary" id="inviteBtn">${already ? "已发出邀请 · 查看聊天" : "发起邀请"}</button>
              </div>`
            : '<div class="muted" style="margin-top:12px;text-align:center">该同学暂未公开搭子帖</div>'}
          <div class="muted" style="margin-top:10px;font-size:11px;text-align:center">邀请会写入站内申请记录，对方通过后即可聊天</div>
        </div>`,
      });
      const b = document.getElementById("inviteBtn");
      if (b && post) {
        b.addEventListener("click", () => {
          if (already) openChatList();
          else openApplyModal(post);
        });
      }
    }

    bindRecommend();
    const refreshBtn = body.querySelector("#refreshRec");
    if (refreshBtn) refreshBtn.addEventListener("click", refreshRecommend);
    const drawBtn = body.querySelector("#drawBtn");
    if (drawBtn) drawBtn.addEventListener("click", drawNearby);
    initNearMap();
    body.querySelectorAll("[data-near]").forEach((card) => {
      const open = () => {
        const x = state.nearby.find((n) => n.user_id === Number(card.dataset.near));
        if (x) openPeerCard(x);
      };
      card.addEventListener("click", open);
      card.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          open();
        }
      });
    });

    // 帖子墙
    const list = body.querySelector("#buddyList");
    let current = "全部";
    const drawWall = () => {
      const filtered = current === "全部" ? state.rows : state.rows.filter((p) => p.type === current);
      list.innerHTML = filtered.length
        ? filtered
            .map(
              (p) => `<div class="card">
                <div class="spread"><div class="row"><span class="tag tag-blue">${esc(p.type)}</span>${statusBadge(p.status)}</div>
                  <span class="muted">${esc(p.created_at)}</span></div>
                <div class="card-title" style="margin-top:8px">${esc(p.title)}</div>
                <div class="card-desc">${esc(p.content)}</div>
                ${p.author ? `<div class="bd-author">${animalBadge(p.author)}${mbtiBadge(p.author)}<span class="muted">${esc(p.author.nickname || "")}</span></div>` : ""}
                <div class="row" style="margin-top:10px"><span class="tag">${esc(p.time)}</span><span class="tag">${esc(p.place)}</span><span class="tag">${esc(p.campus)}</span></div>
                <div class="resource-foot"><span class="muted">联系方式：${esc(p.contact)}</span>
                  <div class="row">
                    ${p.user_id !== 1 && p.status === "open" ? `<button class="btn btn-primary btn-sm" data-apply="${p.id}">申请搭子</button>` : ""}
                    ${p.status === "open" && p.user_id === 1 ? `<button class="btn btn-ghost btn-sm" data-close="${p.id}">关闭</button>` : ""}
                    ${p.status !== "open" ? '<span class="tag">已结束</span>' : ""}
                    <button class="btn btn-danger btn-sm" data-report="${p.id}">举报</button>
                  </div></div>
              </div>`
            )
            .join("")
        : '<div class="empty"><strong>没有匹配的搭子</strong>换个类型或发布一条</div>';
      bindWall();
    };
    const bindWall = () => {
      list.querySelectorAll("[data-close]").forEach((btn) =>
        btn.addEventListener("click", async () => {
          await api.post(`/buddy/posts/${btn.getAttribute("data-close")}/close`);
          toast("已关闭", "success");
          state.rows = await api.get("/buddy/posts");
          drawWall();
        })
      );
      list.querySelectorAll("[data-report]").forEach((btn) =>
        btn.addEventListener("click", async () => {
          await api.post(`/buddy/posts/${btn.getAttribute("data-report")}/report`, {});
          toast("已提交举报，内容下架待复核", "success");
          state.rows = await api.get("/buddy/posts");
          drawWall();
        })
      );
    };
    body.querySelectorAll("[data-type]").forEach((chip) => {
      chip.addEventListener("click", () => {
        body.querySelectorAll("[data-type]").forEach((x) => x.classList.remove("active"));
        chip.classList.add("active");
        current = chip.getAttribute("data-type");
        drawWall();
      });
    });
    drawWall();

    // 申请搭子：写入站内申请记录，成功后直接展示进度列表
    function openApplyModal(post) {
      const pid = Number(post.id);
      const already = state.applications.some((a) => a.post_id === pid && a.role === "applicant");
      if (already) {
        toast("已申请过这个搭子，在「申请与聊天」里查看进度", "success");
        openChatList();
        return;
      }
      modal({
        title: `邀请搭子 · ${post.title}`,
        okText: "发送邀请",
        body: `<div class="muted" style="margin-bottom:8px">${esc(post.time)} · ${esc(post.place)}</div>
          <textarea class="textarea" id="applyMsg" style="min-height:90px" placeholder="打个招呼，说说为什么想加入（会展示给对方）">你好！我也想找${esc(post.type)}搭子，时间刚好合适，一起呀～</textarea>
          <div class="muted" style="margin-top:8px;font-size:11px">发送后会生成一条申请记录，可在「申请与聊天」里查看状态。</div>`,
        onOk: async () => {
          const msg = document.getElementById("applyMsg").value.trim();
          try {
            const r = await api.post("/buddy/apply", { post_id: pid, message: msg || "你好，想和你组个搭子！" });
            toast(r.status === "accepted" ? "邀请已发送，对方已通过，可以开始聊天" : "邀请已发送，等待对方处理", "success");
            await loadApplications();
            refreshChatBadge();
            openChatList();
          } catch (e) {
            toast(e.message, "error");
          }
        },
      });
    }

    body.querySelectorAll("[data-apply]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const post = state.rows.find((x) => x.id === Number(btn.getAttribute("data-apply")));
        if (post) openApplyModal(post);
      });
    });

    // 申请与聊天入口
    body.querySelector("#chatEntry").addEventListener("click", openChatList);

    async function loadApplications() {
      try {
        state.applications = await api.get("/buddy/applications");
        refreshChatBadge();
      } catch (e) { /* 可选数据 */ }
    }
    loadApplications();

    function refreshChatBadge() {
      const entry = body.querySelector("#chatEntry");
      if (!entry) return;
      const unread = state.applications.reduce((n, a) => n + (a.status === "accepted" && a.unread ? 1 : 0), 0);
      const pend = state.applications.filter((a) => a.role === "owner" && a.status === "pending").length;
      entry.innerHTML = `💬 申请与聊天${unread ? ` <span class="bd-badge" style="background:#ff4d5e;color:#fff">${unread} 新消息</span>` : ""}${pend ? ` <span class="bd-badge" style="background:#fff5e6;color:#e0870a">${pend} 待处理</span>` : ""}`;
    }

    function openChatList() {
      const apps = state.applications;
      const mine = apps.filter((a) => a.role === "applicant");
      const received = apps.filter((a) => a.role === "owner");
      const rowHtml = (a) => `<div class="chat-row" data-cid="${a.id}" role="button" tabindex="0">
        <span class="nc-ava">${a.peer_emoji}</span>
        <div class="cr-main">
          <div class="cr-title">${esc(a.post_title)}<span class="tag ${a.status === "accepted" ? "tag-green" : a.status === "pending" ? "tag-gold" : ""}">${esc(a.status_label)}</span></div>
          <div class="muted">${esc(a.peer_nickname)} · ${esc((a.message || "").slice(0, 30))}</div>
        </div>
        ${a.unread && a.status === "accepted" ? '<span class="mc-dot"></span>' : ""}
      </div>`;
      modal({
        title: "申请与聊天",
        hideOk: true,
        cancelText: "关闭",
        wide: true,
        body: `<div class="chat-list-box">
          ${apps.length
            ? `${received.length ? `<div class="chat-sec">收到的申请（处理后才能聊天）</div>${received.map(rowHtml).join("")}` : ""}${mine.length ? `<div class="chat-sec">我发出的</div>${mine.map(rowHtml).join("")}` : ""}`
            : '<div class="mc-empty">还没有申请记录。去搭子墙点「申请搭子」开始吧</div>'}
        </div>`,
      });
      document.querySelectorAll(".chat-row").forEach((el) => {
        el.addEventListener("click", () => {
          const id = Number(el.getAttribute("data-cid"));
          const a = state.applications.find((x) => x.id === id);
          if (!a) return;
          if (a.status === "pending" && a.role === "owner") {
            modal({
              title: "处理申请",
              body: `<div class="muted" style="margin-bottom:8px">${esc(a.peer_nickname)} 想加入「${esc(a.post_title)}」：</div><div class="card" style="padding:10px">${esc(a.message)}</div>`,
              okText: "通过",
              cancelText: "婉拒",
              onOk: async () => {
                await api.post(`/buddy/applications/${id}/accept`);
                toast("已通过，可以开始聊天", "success");
                await loadApplications();
                draw();
                openChatList();
              },
              onCancel: async () => {
                await api.post(`/buddy/applications/${id}/reject`);
                toast("已婉拒");
                await loadApplications();
                draw();
              },
            });
            return;
          }
          if (a.status !== "accepted") {
            toast(a.status_label + "，暂不能聊天", "error");
            return;
          }
          openChatRoom(id, a.peer_nickname, a.peer_emoji);
        });
      });
    }

    function openChatRoom(appId, peerName) {
      modal({
        title: `与 ${peerName} 聊天`,
        hideOk: true,
        cancelText: "关闭",
        wide: true,
        body: `<div class="chat-room">
          <div class="cr-msgs" id="crMsgs"><div class="muted" style="text-align:center">加载中…</div></div>
          <div class="cr-input-row">
            <input class="input" id="crInput" placeholder="输入消息…" autocomplete="off">
            <button class="btn btn-primary btn-sm" id="crSend">发送</button>
          </div>
        </div>`,
      });
      const box = document.getElementById("crMsgs");
      const renderMsgs = (data) => {
        box.innerHTML = data.messages
          .map(
            (m) => `<div class="cr-msg ${m.from_me ? "me" : "peer"}">
              <div class="cr-bubble">${esc(m.content)}</div>
              <span class="cr-time">${esc((m.created_at || "").slice(11, 16))}</span>
            </div>`
          )
          .join("");
        box.scrollTop = box.scrollHeight;
      };
      const load = async () => {
        const data = await api.get(`/buddy/chat/${appId}`);
        renderMsgs(data);
        try {
          await api.post(`/buddy/chat/${appId}/read`);
          await loadApplications();
          refreshChatBadge();
        } catch (e) { /* 已读失败不阻塞聊天 */ }
      };
      load();
      const input = document.getElementById("crInput");
      const send = async () => {
        const content = input.value.trim();
        if (!content) return;
        input.value = "";
        try {
          await api.post(`/buddy/chat/${appId}`, { content });
          await load();
        } catch (e) {
          toast(e.message, "error");
        }
      };
      document.getElementById("crSend").addEventListener("click", send);
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") send();
      });
    }

    const newBtn = body.querySelector("#newBuddy");
    if (newBtn) {
      newBtn.addEventListener("click", () => {
        modal({
          title: "发布搭子",
          okText: "发布",
          body: `<div class="grid grid-2">
            <div class="field"><label>类型</label><select class="select" name="type">${types.slice(1).map((t) => `<option>${t}</option>`).join("")}</select></div>
            <div class="field"><label>时间</label><input class="input" name="time" placeholder="例如：周三 19:00"></div>
            <div class="field"><label>地点</label><input class="input" name="place" placeholder="例如：图书馆"></div>
            <div class="field"><label>校区</label><input class="input" name="campus" value="泉山校区"></div>
            <div class="field" style="grid-column:1/-1"><label>标题</label><input class="input" name="title" placeholder="一句话说明想找什么搭子"></div>
            <div class="field" style="grid-column:1/-1"><label>详细说明</label><textarea class="textarea" name="content" placeholder="目的、期望、注意事项"></textarea></div>`,
          onOk: async () => {
            await api.post("/buddy/posts", {
              type: document.querySelector('[name="type"]').value,
              title: document.querySelector('[name="title"]').value,
              content: document.querySelector('[name="content"]').value,
              time: document.querySelector('[name="time"]').value,
              place: document.querySelector('[name="place"]').value,
              campus: document.querySelector('[name="campus"]').value,
            });
            toast("已发布", "success");
            document.getElementById("modalRoot").innerHTML = "";
            state.rows = await api.get("/buddy/posts");
            drawDiscover();
          },
        });
      });
    }
  }

  /* ================= 性格测试 ================= */
  function drawTest() {
    body.innerHTML = `
      <div class="test-entry-grid">
        <div class="test-entry" id="testAnimal">
          <div class="te-emoji">🧸</div>
          <div class="te-name">校园小动物测试</div>
          <div class="te-desc">10 道情景题 · 2 分钟<br>测测你是柯基、猫猫还是水獭</div>
          <button class="btn btn-primary" data-start="animal">${state.profile && state.profile.animal_type ? "重新测试" : "开始测试"}</button>
        </div>
        <div class="test-entry" id="testMbti">
          <div class="te-emoji">🧠</div>
          <div class="te-name">MBTI 快测</div>
          <div class="te-desc">12 道二选一 · 3 分钟<br>四字母人格 + 维度百分比</div>
          <button class="btn btn-primary" data-start="mbti">${state.profile && state.profile.mbti ? "重新测试" : "开始测试"}</button>
        </div>
        <div class="test-entry" id="testSurvival">
          <div class="te-emoji">🎓</div>
          <div class="te-name">校园生存人格</div>
          <div class="te-desc">8 道情景题 · 1 分钟<br>卷王、养生、社牛还是隐士？</div>
          <button class="btn btn-primary" data-start="survival">${state.profile && state.profile.results && state.profile.results.survival ? "重新测试" : "开始测试"}</button>
        </div>
        <div class="test-entry" id="testBattery">
          <div class="te-emoji">🔋</div>
          <div class="te-name">社交电量测试</div>
          <div class="te-desc">6 道情境题 · 1 分钟<br>看看你的社交电量还剩多少</div>
          <button class="btn btn-primary" data-start="battery">${state.profile && state.profile.results && state.profile.results.battery ? "重新测试" : "开始测试"}</button>
        </div>
      </div>
      <div id="testFlow"></div>`;

    body.querySelectorAll("[data-start]").forEach((btn) =>
      btn.addEventListener("click", () => {
        state.testKind = btn.dataset.start;
        state.testIdx = 0;
        state.testAnswers = [];
        drawQuestion();
      })
    );

    function drawQuestion() {
      const kind = state.testKind;
      const bank = {
        animal: state.questions.animal_questions,
        mbti: state.questions.mbti_questions,
        survival: state.questions.survival_questions,
        battery: state.questions.battery_questions,
      };
      const qs = bank[kind] || [];
      const idx = state.testIdx;
      if (idx >= qs.length) {
        submitTest();
        return;
      }
      const q = qs[idx];
      const isChoice = kind !== "mbti";
      body.querySelector("#testFlow").innerHTML = `
        <div class="card qcard">
          <div class="qprog">${state.testIdx + 1} / ${qs.length}<span class="qdots">${qs.map((_, i) => `<i class="${i <= idx ? "on" : ""}"></i>`).join("")}</span></div>
          <div class="qq">${esc(q.q)}</div>
          <div class="qopts">
            ${isChoice
              ? q.options.map((o, i) => `<button class="qopt" data-i="${i}">${esc(o.t)}</button>`).join("")
              : `<button class="qopt" data-a="a">${esc(q.a)}</button><button class="qopt" data-a="b">${esc(q.b)}</button>`}
          </div>
          <div class="qfoot">${idx > 0 ? '<button class="btn btn-ghost btn-sm" id="qPrev">‹ 上一题</button>' : ""}</div>
        </div>`;
      const picked = state.testAnswers[idx];
      body.querySelectorAll(".qopt").forEach((opt) => {
        const val = isChoice ? Number(opt.dataset.i) : opt.dataset.a;
        if (picked === val) opt.classList.add("picked");
        opt.addEventListener("click", () => {
          state.testAnswers[state.testIdx] = val;
          state.testIdx += 1;
          drawQuestion();
        });
      });
      const prevBtn = body.querySelector("#qPrev");
      if (prevBtn) {
        prevBtn.addEventListener("click", () => {
          if (state.testIdx <= 0) return;
          state.testIdx -= 1;
          drawQuestion();
        });
      }
      body.querySelector(".qcard").scrollIntoView({ behavior: "smooth", block: "start" });
    }

    async function submitTest() {
      body.querySelector("#testFlow").innerHTML = '<div class="card qcard" style="text-align:center"><div class="muted">AI 正在生成你的专属解读…</div></div>';
      try {
        const r = await api.post("/buddy/test/submit", { kind: state.testKind, answers: state.testAnswers });
        state.profile = r;
        drawReading(r);
      } catch (e) {
        toast(e.message, "error");
      }
    }

    function drawReading(r) {
      const res = r.result || {};
      const kind = state.testKind;
      let emoji = "🧠";
      let name = "";
      let label = "";
      let tags = [];
      let desc = "";
      if (kind === "animal") {
        emoji = r.animal_emoji || "🐾";
        name = `${r.animal_type}型`;
        label = res.label || "";
        tags = res.tags || [];
      } else if (kind === "mbti") {
        name = r.mbti || "";
        label = "MBTI 四字母人格";
      } else if (kind === "survival") {
        emoji = res.emoji || "🎓";
        name = res.type || "";
        label = res.label || "";
        tags = res.tags || [];
        desc = res.desc || "";
      } else if (kind === "battery") {
        emoji = res.emoji || "🔋";
        name = res.type || "";
        label = res.label || "";
        tags = res.tags || [];
        desc = res.desc || "";
      }
      body.querySelector("#testFlow").innerHTML = `
        <div class="result-card">
          <div class="rc-emoji">${emoji}</div>
          <div class="rc-name">${esc(name)}</div>
          <div class="rc-label">${esc(label)}</div>
          ${tags.length ? `<div class="rc-tags">${tags.map((t) => `<span>${esc(t)}</span>`).join("")}</div>` : ""}
          ${desc ? `<div class="rc-desc">${esc(desc)}</div>` : ""}
          ${r.reading ? `<div class="rc-reading">${esc(r.reading)}</div>` : ""}
          <button class="btn btn-ghost btn-sm" data-bt="profile">查看我的档案 →</button>
        </div>`;
      body.querySelector('[data-bt="profile"]').addEventListener("click", () => {
        state.tab = "profile";
        draw();
      });
    }
  }

  /* ================= 我的档案 ================= */
  function drawProfile() {
    const p = state.profile || {};
    const avatar = p.avatar || "";
    const results = p.results || {};
    const hasTest = !!(p.animal_type || p.mbti || results.survival || results.battery);
    const AVATARS = [];
    ["01", "02", "03", "04", "05", "06", "07", "08"].forEach((n) => {
      ["a", "b", "c"].forEach((v) => AVATARS.push(`avatar-${n}${v}.svg`));
    });
    const PLACES = ["图书馆", "七食堂", "牛山运动场", "静远楼", "文学院", "21世纪大楼", "校医院", "宿舍"];
    const placeList = Array.from(new Set([p.place || "", ...PLACES].filter(Boolean)));
    const emoji = { 柯基: "🐕", 猫猫: "🐈", 海豚: "🐬", 刺猬: "🦔", 仓鼠: "🐹", 狐狸: "🦊", 鹅: "🦢", 水獭: "🦦" };
    let pickedAvatar = avatar;
    body.innerHTML = `
      <div class="result-card me">
        <div class="rc-emoji">${avatar ? `<img class="rc-avatar" src="/static/img/avatars/${esc(avatar)}" alt="">` : emoji[p.animal_type] || "🐾"}</div>
        <div class="rc-name">${esc(p.nickname || "师大同学")}</div>
        <div class="rc-label">${p.animal_type ? esc(p.animal_type) + "型" : ""}${p.mbti ? " · " + esc(p.mbti) : ""}${results.survival ? " · " + esc(results.survival.type) : ""}${results.battery ? " · 电量 " + esc(results.battery.pct) + "%" : ""}${hasTest ? "" : "基础档案（未做测试）"}</div>
        <div class="rc-tags">
          ${p.place ? `<span>📍 ${esc(p.place)}</span>` : ""}
          ${(p.interests || []).map((t) => `<span>${esc(t)}</span>`).join("")}
        </div>
        ${p.reading ? `<div class="rc-reading">${esc(p.reading)}</div>` : ""}
      </div>

      <div class="card" style="margin-top:14px">
        <div class="spread"><div class="card-title">基础档案</div>
          <span class="muted" style="font-size:11px">头像可自选，不做测试也能出现在附近</span></div>
        <div class="field" style="margin-top:12px"><label>选择头像</label>
          <div class="avatar-picker" id="avatarPicker">
            ${AVATARS.map((a) => `<button type="button" class="av-item ${a === avatar ? "on" : ""}" data-av="${a}"><img src="/static/img/avatars/${a}" alt=""></button>`).join("")}
          </div>
        </div>
        <div class="grid grid-2">
          <div class="field"><label>昵称</label><input class="input" id="pfNick" value="${esc(p.nickname || "")}" placeholder="想让同学怎么称呼你"></div>
          <div class="field"><label>常出没地点</label><select class="select" id="pfPlace">
            ${placeList.map((x) => `<option ${x === (p.place || "") ? "selected" : ""}>${esc(x)}</option>`).join("")}
          </select></div>
          <div class="field"><label>常出没时段</label><select class="select" id="pfTime">
            ${["早鸟", "夜猫", "全天"].map((t) => `<option ${p.active_time === t ? "selected" : ""}>${t}</option>`).join("")}
          </select></div>
          <div class="field"><label>档案可见性</label><select class="select" id="pfVis">
            <option value="public" ${p.visibility === "public" ? "selected" : ""}>公开（出现在推荐与附近）</option>
            <option value="campus" ${p.visibility === "campus" ? "selected" : ""}>仅同校区可见</option>
            <option value="hidden" ${p.visibility === "hidden" ? "selected" : ""}>隐藏（不出现在推荐）</option>
          </select></div>
        </div>
        <button class="btn btn-primary btn-sm" id="pfSaveProfile">保存档案</button>
      </div>

      ${hasTest
        ? `<div class="card" style="margin-top:14px"><div class="card-title">已完成的测试</div>
            <div class="test-done-list">
              <div class="td-row ${results.animal ? "" : "td-empty"}"><span>🧸 小动物</span><b>${results.animal ? esc(results.animal.animal || "") + "型" : "未测试"}</b></div>
              <div class="td-row ${p.mbti ? "" : "td-empty"}"><span>🧠 MBTI</span><b>${p.mbti ? esc(p.mbti) : "未测试"}</b></div>
              <div class="td-row ${results.survival ? "" : "td-empty"}"><span>🎓 生存人格</span><b>${results.survival ? esc(results.survival.type || "") : "未测试"}</b></div>
              <div class="td-row ${results.battery ? "" : "td-empty"}"><span>🔋 社交电量</span><b>${results.battery ? esc(results.battery.pct || 0) + "%" : "未测试"}</b></div>
            </div></div>`
        : `<div class="card" style="margin-top:14px;text-align:center"><div class="card-title">还没有测试结果</div>
            <div class="muted" style="margin-top:6px">四款趣味测试任选其一，能让匹配更准</div>
            <button class="btn btn-ghost btn-sm" style="margin-top:10px" data-bt-jump2="test">去做测试 →</button></div>`}

      <div class="card" style="margin-top:14px;text-align:center">
        <div class="card-title">想换结果？</div>
        <button class="btn btn-ghost btn-sm" style="margin-top:8px" data-bt-jump2="test">↻ 重新测试</button>
      </div>`;

    body.querySelectorAll("#avatarPicker .av-item").forEach((btn) =>
      btn.addEventListener("click", () => {
        body.querySelectorAll("#avatarPicker .av-item").forEach((x) => x.classList.remove("on"));
        btn.classList.add("on");
        pickedAvatar = btn.dataset.av;
      })
    );
    body.querySelectorAll('[data-bt-jump2="test"]').forEach((el) =>
      el.addEventListener("click", () => {
        state.tab = "test";
        root.querySelectorAll("[data-bt]").forEach((x) => x.classList.toggle("on", x.dataset.bt === "test"));
        draw();
      })
    );
    body.querySelector("#pfSaveProfile").addEventListener("click", async () => {
      try {
        state.profile = await api.post("/buddy/profile", {
          nickname: body.querySelector("#pfNick").value.trim() || "师大同学",
          avatar: pickedAvatar,
          place: body.querySelector("#pfPlace").value,
          active_time: body.querySelector("#pfTime").value,
          visibility: body.querySelector("#pfVis").value,
        });
        toast("档案已更新", "success");
        window.dispatchEvent(new CustomEvent("avatar:updated"));
        draw();
      } catch (e) {
        toast(e.message, "error");
      }
    });
  }

  /* ================= 我的搭子 ================= */
  function drawMine() {
    const sub = (ctx && ctx.params && ctx.params.get("sub")) || "posts";
    const myPosts = state.rows.filter((p) => p.user_id === 1);
    const joined = state.applications.filter((a) => a.role === "applicant" && a.status === "accepted");
    body.innerHTML = `
      <div class="page-head"><div><div class="page-title">我的搭子</div><div class="page-sub">我发布的、我参加的，以及全部申请记录。</div></div>
        <button class="btn btn-primary" id="newBuddyMine">发布搭子</button></div>
      <div class="chips" style="margin-bottom:14px">
        <a class="chip ${sub === "posts" ? "active" : ""}" href="#/life/buddy?tab=mine&sub=posts">我发布的 ${myPosts.length}</a>
        <a class="chip ${sub === "joined" ? "active" : ""}" href="#/life/buddy?tab=mine&sub=joined">我参加的 ${joined.length}</a>
        <a class="chip ${sub === "apps" ? "active" : ""}" href="#/life/buddy?tab=mine&sub=apps">申请记录 ${state.applications.length}</a>
      </div>
      <div id="mineBody"></div>`;

    body.querySelector("#newBuddyMine").addEventListener("click", () => {
      state.tab = "discover";
      draw();
      setTimeout(() => {
        const b = body.querySelector("#newBuddy");
        if (b) b.click();
      }, 60);
    });

    const box = body.querySelector("#mineBody");
    if (sub === "posts") {
      box.innerHTML = myPosts.length
        ? `<div class="grid grid-2">${myPosts
            .map(
              (p) => `<div class="card">
                <div class="spread"><span class="tag tag-blue">${esc(p.type)}</span>${statusBadge(p.status)}</div>
                <div class="card-title" style="margin-top:8px">${esc(p.title)}</div>
                <div class="card-desc">${esc(p.content)}</div>
                <div class="row" style="margin-top:10px"><span class="tag">${esc(p.time)}</span><span class="tag">${esc(p.place)}</span></div>
                <div class="row" style="margin-top:10px">
                  ${p.status === "open" ? `<button class="btn btn-ghost btn-sm" data-close-mine="${p.id}">关闭</button>` : '<span class="tag">已结束</span>'}
                </div>
              </div>`
            )
            .join("")}</div>`
        : '<div class="card me-empty"><span class="me-empty-ico">📝</span><div><b>还没有发布过搭子</b><span>点右上角「发布搭子」，说说你想找什么搭子。</span></div></div>';
      box.querySelectorAll("[data-close-mine]").forEach((btn) =>
        btn.addEventListener("click", async () => {
          await api.post(`/buddy/posts/${btn.getAttribute("data-close-mine")}/close`);
          toast("已关闭", "success");
          state.rows = await api.get("/buddy/posts");
          drawMine();
        })
      );
    } else if (sub === "joined") {
      box.innerHTML = joined.length
        ? `<div class="card bk-list">${joined
            .map(
              (a) => `<div class="app-row">
                <span class="nc-ava">${a.peer_emoji}</span>
                <div class="app-main">
                  <div class="app-title">${esc(a.post_title)}<span class="tag tag-green">已通过</span></div>
                  <div class="muted">${esc(a.peer_nickname)} · ${esc(a.post_type || "")}搭子</div>
                </div>
                <button class="btn btn-primary btn-sm" data-app-chat="${a.id}" data-peer="${esc(a.peer_nickname)}">进入聊天</button>
              </div>`
            )
            .join("")}</div>`
        : '<div class="card me-empty"><span class="me-empty-ico">🤝</span><div><b>还没有加入的搭子</b><span>在「发现」里申请并通过后，会出现在这里。</span></div></div>';
      bindChatButtons(box);
    } else {
      const rows = state.applications;
      if (!rows.length) {
        box.innerHTML = '<div class="card me-empty"><span class="me-empty-ico">📨</span><div><b>暂无申请记录</b><span>去「发现」里向感兴趣的同学发出邀请。</span></div></div>';
      } else {
        box.innerHTML = `<div class="card bk-list">${rows
          .map((a) => {
            const acts = [];
            if (a.role === "applicant" && a.status === "pending") acts.push(`<button class="btn btn-ghost btn-sm" data-app-cancel="${a.id}">取消申请</button>`);
            if (a.status === "accepted") acts.push(`<button class="btn btn-primary btn-sm" data-app-chat="${a.id}" data-peer="${esc(a.peer_nickname)}">进入聊天</button>`);
            if (a.role === "owner" && a.status === "pending") {
              acts.push(`<button class="btn btn-primary btn-sm" data-app-accept="${a.id}">通过</button>`);
              acts.push(`<button class="btn btn-ghost btn-sm" data-app-reject="${a.id}">婉拒</button>`);
            }
            if (a.role === "owner" && a.status !== "pending") acts.push('<span class="muted" style="font-size:12px">我收到的申请</span>');
            return `<div class="app-row">
              <span class="nc-ava">${a.peer_emoji}</span>
              <div class="app-main">
                <div class="app-title">${esc(a.post_title)}<span class="tag ${a.status === "accepted" ? "tag-green" : a.status === "pending" ? "tag-gold" : ""}">${esc(a.status_label)}</span></div>
                <div class="muted">${esc(a.peer_nickname)} · ${esc((a.message || "").slice(0, 28))}${a.unread ? ` · ${a.unread} 条新消息` : ""}</div>
              </div>
              <div class="app-actions">${acts.join("")}</div>
            </div>`;
          })
          .join("")}</div>`;
      }
      bindChatButtons(box);
      box.querySelectorAll("[data-app-cancel]").forEach((btn) =>
        btn.addEventListener("click", async () => {
          if (!confirm("确定取消这条申请？")) return;
          try {
            await api.post(`/buddy/applications/${btn.getAttribute("data-app-cancel")}/cancel`);
            toast("已取消申请", "success");
            await loadApplicationsMine();
            drawMine();
          } catch (e) {
            toast(e.message, "error");
          }
        })
      );
      box.querySelectorAll("[data-app-accept]").forEach((btn) =>
        btn.addEventListener("click", async () => {
          await api.post(`/buddy/applications/${btn.getAttribute("data-app-accept")}/accept`);
          toast("已通过，可以开始聊天", "success");
          await loadApplicationsMine();
          drawMine();
        })
      );
      box.querySelectorAll("[data-app-reject]").forEach((btn) =>
        btn.addEventListener("click", async () => {
          await api.post(`/buddy/applications/${btn.getAttribute("data-app-reject")}/reject`);
          toast("已婉拒");
          await loadApplicationsMine();
          drawMine();
        })
      );
    }
  }

  async function loadApplicationsMine() {
    try {
      state.applications = await api.get("/buddy/applications");
    } catch (e) { /* 忽略 */ }
  }

  function bindChatButtons(box) {
    box.querySelectorAll("[data-app-chat]").forEach((btn) =>
      btn.addEventListener("click", () => {
        const id = Number(btn.getAttribute("data-app-chat"));
        const peer = btn.getAttribute("data-peer") || "搭子";
        openMineChat(id, peer);
      })
    );
  }

  function openMineChat(appId, peerName) {
    modal({
      title: `与 ${peerName} 聊天`,
      hideOk: true,
      cancelText: "关闭",
      wide: true,
      body: `<div class="chat-room">
        <div class="cr-msgs" id="mineMsgs"><div class="muted" style="text-align:center">加载中…</div></div>
        <div class="cr-input-row"><input class="input" id="mineInput" placeholder="输入消息…" autocomplete="off">
          <button class="btn btn-primary btn-sm" id="mineSend">发送</button></div>
      </div>`,
    });
    const box = document.getElementById("mineMsgs");
    const input = document.getElementById("mineInput");
    const load = async () => {
      const data = await api.get(`/buddy/chat/${appId}`);
      box.innerHTML = data.messages
        .map(
          (m) => `<div class="cr-msg ${m.from_me ? "me" : "peer"}">
            <div class="cr-bubble">${esc(m.content)}</div>
            <span class="cr-time">${esc((m.created_at || "").slice(11, 16))}</span>
          </div>`
        )
        .join("");
      box.scrollTop = box.scrollHeight;
      try {
        await api.post(`/buddy/chat/${appId}/read`);
        await loadApplicationsMine();
      } catch (e) { /* 忽略 */ }
    };
    load();
    const send = async () => {
      const content = input.value.trim();
      if (!content) return;
      input.value = "";
      try {
        await api.post(`/buddy/chat/${appId}`, { content });
        await load();
      } catch (e) {
        toast(e.message, "error");
      }
    };
    document.getElementById("mineSend").addEventListener("click", send);
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") send();
    });
  }

  function draw() {
    if (state.tab === "test") drawTest();
    else if (state.tab === "profile") drawProfile();
    else if (state.tab === "mine") drawMine();
    else drawDiscover();
  }
  draw();
}

/* ---------- 省一省 · 理性消费决策助手 ---------- */
export async function renderDeal(root, ctx) {
  const [ov, deals] = await Promise.all([
    api.get("/deal/overview").catch(() => null),
    api.get("/deals?limit=4&exclude_voted=1").catch(() => []),
  ]);
  const money = ov.money;
  const plans = ov.plans || [];
  const discussions = ov.discussions || [];

  const planCard = (p) => `<a class="card deal-plan-card" href="#/life/deal/plan?id=${p.id}">
    <div class="spread"><strong>${esc(p.title || p.product_name)}</strong><span class="tag ${p.decision_status === "cooling" ? "tag-warn" : p.decision_status === "purchased" ? "tag-green" : "tag-blue"}">${DECISION_LABEL[p.decision_status] || p.decision_status}</span></div>
    <div class="muted" style="font-size:11.5px;margin-top:4px">预计 ¥${money0(p.price)} · 预算 ¥${money0(p.budget)} · ${p.visibility === "private" ? "仅自己" : "校园公开"}</div>
    <div class="muted" style="font-size:11px;margin-top:2px">${esc(p.scene || "未填写使用场景")}</div>
  </a>`;

  root.innerHTML = `<div class="page-head"><div>
      <div class="page-title">省一省 · 理性消费决策</div>
      <div class="page-sub">先确认是否需要、是否适合、价格是否合理、哪里更便宜、要不要再等等。系统只给建议，决定由你作出。</div>
    </div><a class="btn btn-primary deal-new-btn" href="#/life/deal/new"><span class="deal-new-ico">＋</span>发起购买计划</a></div>

    <div class="grid grid-3 deal-money" style="margin-bottom:10px">
      <div class="stat"><div class="stat-num">¥${money0(money.planned_total)}</div><div class="stat-label">计划购买总额</div></div>
      <div class="stat"><div class="stat-num">¥${money0(money.deferred_total)}</div><div class="stat-label">已暂缓计划</div></div>
      <div class="stat"><div class="stat-num">¥${money0(money.abandoned_total)}</div><div class="stat-label">已放弃计划</div></div>
    </div>
    <div class="deal-caveat">${esc(money.note)}</div>

    <div class="grid grid-2" style="margin-top:16px">
      <div class="card">
        <div class="spread"><div class="card-title">我的待决策计划</div><span class="tag">${plans.length} 个</span></div>
        ${plans.length
          ? plans.slice(0, 6).map(planCard).join("")
          : `<div class="empty" style="padding:28px 0"><strong>还没有购买计划</strong>
              <div class="muted" style="margin-top:6px">填写商品、预算和用途，系统会帮你比较报价、记录价格变化并整理证据。</div>
              <a class="btn btn-primary btn-sm" href="#/life/deal/new" style="margin-top:12px">发起第一个计划</a></div>`}
      </div>
      <div class="card">
        <div class="spread"><div class="card-title">正在进行的讨论</div><span class="tag tag-blue">社区意见倾向</span></div>
        ${discussions.length
          ? discussions.map((p) => `<a class="deal-discuss-row" href="#/life/deal/plan?id=${p.id}">
              <div class="spread"><strong>${esc(p.title || p.product_name)}</strong><span class="tag tag-blue">${p.end_mode === "target_votes" ? `满 ${p.target_votes} 人` : "按时截止"}</span></div>
              <div class="muted" style="font-size:11.5px">${esc(p.scene || "")}</div>
            </a>`).join("")
          : `<div class="empty" style="padding:28px 0"><strong>暂无公开讨论</strong>
              <div class="muted" style="margin-top:6px">发布校园公开讨论后，同学可以给出支持、斟酌、再等等或不建议购买的意见。</div></div>`}
      </div>
    </div>

    <div class="spread" style="margin-top:22px;margin-bottom:18px;align-items:center">
      <div class="section-title" style="margin:0">大家怎么看</div>
      <button class="btn btn-ghost btn-sm" id="dealRefresh" title="换一批新的帖子">↻ 刷新</button>
    </div>
    <div id="dealList" class="grid grid-2">${deals.length ? deals.map(dealCard).join("") : '<div class="card"><div class="muted">还没有人发布想买的东西。</div></div>'}</div>
    <div class="muted" style="margin-top:12px;font-size:11.5px">投票只作参考，不改变你的个人决策。</div>`;

  const dealListEl = root.querySelector("#dealList");
  const seenPosts = new Set(deals.map((d) => d.id));

  async function fetchBatch(n = 4) {
    let next = await api.get(`/deals?exclude=${[...seenPosts].join(",")}&exclude_voted=1&limit=${n}`);
    let restarted = false;
    if (!next.length && seenPosts.size) {
      seenPosts.clear();
      next = await api.get(`/deals?exclude_voted=1&limit=${n}`);
      restarted = true;
    }
    return { list: next, restarted };
  }

  async function refreshDeals() {
    const btn = root.querySelector("#dealRefresh");
    if (btn) btn.disabled = true;
    try {
      const { list: next, restarted } = await fetchBatch(4);
      if (!next.length) {
        toast("暂时没有新的帖子了，稍后再来看看", "success");
        return;
      }
      dealListEl.innerHTML = next.map(dealCard).join("");
      next.forEach((d) => seenPosts.add(d.id));
      bindVotes();
      toast(restarted ? `已看完全部帖子，重新开始一批（${next.length} 个）` : `已换一批（${next.length} 个新帖子）`, "success");
    } catch (e) {
      toast(e.message || "刷新失败", "error");
    } finally {
      if (btn) btn.disabled = false;
    }
  }
  root.querySelector("#dealRefresh").addEventListener("click", refreshDeals);

  function bindVotes() {
    root.querySelectorAll("[data-vote]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const card = btn.closest(".deal-card");
        card.querySelectorAll("[data-vote]").forEach((x) => x.classList.remove("active"));
        btn.classList.add("active");
        const box = card.querySelector(".vote-reason");
        box.hidden = false;
        box.dataset.vote = btn.getAttribute("data-vote");
        box.querySelector("textarea").focus();
      });
    });
    root.querySelectorAll("[data-vote-cancel]").forEach((btn) =>
      btn.addEventListener("click", () => {
        const card = btn.closest(".deal-card");
        card.querySelector(".vote-reason").hidden = true;
        card.querySelectorAll("[data-vote]").forEach((x) => x.classList.remove("active"));
      })
    );
    root.querySelectorAll("[data-vote-submit]").forEach((btn) =>
      btn.addEventListener("click", async () => {
        const card = btn.closest(".deal-card");
        const box = card.querySelector(".vote-reason");
        const reason = box.querySelector("textarea").value.trim();
        const vote = box.dataset.vote;
        if (!reason) return toast("请填写投票理由", "error");
        try {
          await api.post(`/deals/${card.dataset.post}/vote`, { vote, reason });
          toast("已提交你的意见", "success");
          const all = await api.get("/deals?exclude_voted=0");
          const updated = (all || []).find((d) => String(d.id) === String(card.dataset.post));
          if (updated) card.outerHTML = dealCard(updated);
          bindVotes();
        } catch (e) {
          toast(e.message, "error");
        }
      })
    );
  }
  bindVotes();

}

const DECISION_LABEL = { undecided: "尚未决定", cooling: "冷静期中", purchased: "已购买", deferred: "已暂缓", abandoned: "已放弃" };

function money0(v) {
  const n = Number(v || 0);
  return n % 1 === 0 ? String(n) : n.toFixed(2);
}

function intentRow(i) {
  return `<div class="spread" style="padding:9px 0;border-bottom:1px solid var(--border)">
    <div><strong>${esc(i.name)}</strong><div class="muted">¥${money(i.price)} · ${statusBadge(i.status)}</div></div>
    <div class="row">
      ${i.status !== "abandoned" ? `<button class="btn btn-ghost btn-sm" data-intent="${i.id}" data-status="abandoned">放弃</button>` : `<button class="btn btn-ghost btn-sm" data-intent="${i.id}" data-status="pending">撤销</button>`}
      ${i.status !== "bought" ? `<button class="btn btn-ghost btn-sm" data-intent="${i.id}" data-status="bought">已买</button>` : ""}
    </div></div>`;
}

const VOTE_LABEL = { buy: "值得买", think: "再想想", no: "不买" };

function dealCard(d) {
  const total = d.votes.buy + d.votes.think + d.votes.no;
  const opinions = (d.opinions || []).filter((o) => (o.reason || "").trim());
  return `<div class="card deal-card" data-post="${d.id}">
    <div class="spread"><div class="card-title">${esc(d.product)}</div><span class="tag tag-gold">¥${money(d.price)}</span></div>
    <div class="card-desc">${esc(d.reason)}</div>
    <div class="muted" style="margin-top:6px">分类：${esc(d.category)} · 发布 ${esc(d.created_at)}</div>
    <div class="row" style="margin-top:10px">
      <button class="chip ${d.my_vote === "buy" ? "active" : ""}" data-post="${d.id}" data-vote="buy">值得买 ${d.votes.buy}</button>
      <button class="chip ${d.my_vote === "think" ? "active" : ""}" data-post="${d.id}" data-vote="think">再想想 ${d.votes.think}</button>
      <button class="chip ${d.my_vote === "no" ? "active" : ""}" data-post="${d.id}" data-vote="no">不买 ${d.votes.no}</button>
    </div>
    <div class="vote-reason" hidden>
      <textarea class="input" rows="2" placeholder="请写下你的理由（必填），提交后会展示在下方"></textarea>
      <div class="row" style="justify-content:flex-end;margin-top:8px">
        <button class="btn btn-ghost btn-sm" data-vote-cancel>取消</button>
        <button class="btn btn-primary btn-sm" data-vote-submit>提交意见</button>
      </div>
    </div>
    ${opinions.length
      ? `<div class="deal-opinions">
          <div class="muted" style="font-size:11px">大家给出的意见</div>
          ${opinions
            .map(
              (o) => `<div class="deal-op">
                <span class="deal-op-vote">${esc(VOTE_LABEL[o.vote] || o.vote)}</span>
                <span class="deal-op-text">${esc(o.reason)}</span>
                <em>${esc(o.label || "同学")}</em>
              </div>`
            )
            .join("")}
        </div>`
      : ""}
    <div class="muted" style="margin-top:8px">共 ${total} 人参与投票</div>
  </div>`;
}

function openIntentModal(onDone) {
  modal({
    title: "记一笔想买的东西",
    okText: "保存",
    body: `<div class="grid grid-2">
      <div class="field"><label>商品名</label><input class="input" name="name" placeholder="例如：机械键盘"></div>
      <div class="field"><label>价格（元）</label><input class="input" name="price" type="number" min="0" step="0.01"></div></div>`,
    onOk: async () => {
      await api.post("/purchase-intents", {
        name: document.querySelector('[name="name"]').value,
        price: document.querySelector('[name="price"]').value,
      });
      toast("已记录", "success");
      document.getElementById("modalRoot").innerHTML = "";
      onDone();
    },
  });
}

/* ---------- 互帮互助 ---------- */
export async function renderHelp(root, ctx) {
  let tab = "express";
  let [errands, lost] = await Promise.all([api.get("/errands"), api.get("/lost-found")]);
  root.innerHTML = `<div class="page-head"><div><div class="page-title">互帮互助</div><div class="page-sub">快递代拿、失物招领、校园求助。平台不托管资金，联系方式默认站内私信。</div></div>
    <button class="btn btn-primary" id="newHelp">发布</button></div>
    <div class="chips" style="margin-bottom:16px">
      <button class="chip active" data-tab="express">快递代拿</button>
      <button class="chip" data-tab="lost">失物招领</button>
      <button class="chip" data-tab="help">校园求助</button>
    </div>
    <div id="helpBox"></div>`;

  function draw() {
    const box = root.querySelector("#helpBox");
    if (tab === "lost") {
      box.innerHTML = `<div class="grid grid-2">${lost.map((x) => `<div class="card">
        <div class="spread"><div class="row"><span class="tag ${x.type === "lost" ? "tag-warn" : "tag-green"}">${x.type === "lost" ? "丢失" : "拾获"}</span>${statusBadge(x.status)}</div><span class="muted">${esc(x.happened_at)}</span></div>
        <div class="card-title" style="margin-top:8px">${esc(x.name)}</div>
        <div class="card-desc">${esc(x.description)}</div>
        <div class="muted" style="margin-top:6px">地点：${esc(x.place)} · 联系：${esc(x.contact)}</div>
        ${x.status === "open" ? `<button class="btn btn-ghost btn-sm" style="margin-top:8px" data-claim="${x.id}">申请认领</button>` : ""}
      </div>`).join("")}</div>`;
      box.querySelectorAll("[data-claim]").forEach((btn) => btn.addEventListener("click", async () => {
        await api.post(`/lost-found/${btn.getAttribute("data-claim")}/claim`, {});
        toast("认领申请已提交，等待发布者确认", "success");
        lost = await api.get("/lost-found");
        draw();
      }));
      return;
    }
    const rows = errands.filter((e) => e.type === tab);
    box.innerHTML = `<div class="grid grid-2">${rows.length ? rows.map((e) => `<div class="card">
      <div class="spread"><div class="row"><span class="tag tag-blue">${e.type === "express" ? "快递代拿" : "校园求助"}</span>${statusBadge(e.status)}</div><span class="muted">${esc(e.time_window)}</span></div>
      <div class="card-title" style="margin-top:8px">${esc(e.title)}</div>
      <div class="card-desc">${esc(e.note)}</div>
      <div class="muted" style="margin-top:6px">${esc(e.pickup)} → ${esc(e.destination)} · 酬谢：${esc(e.reward)}</div>
      <div class="row" style="margin-top:10px">
        ${e.status === "open" ? `<button class="btn btn-primary btn-sm" data-accept="${e.id}">接单</button>` : ""}
        ${["accepted", "picked_up", "delivered"].includes(e.status) ? `<button class="btn btn-ghost btn-sm" data-next="${e.id}">推进状态</button>` : ""}
      </div></div>`).join("") : '<div class="empty"><strong>暂无任务</strong>发布一个试试</div>'}</div>`;
    box.querySelectorAll("[data-accept]").forEach((btn) => btn.addEventListener("click", async () => {
      await api.post(`/errands/${btn.getAttribute("data-accept")}/accept`);
      toast("接单成功", "success");
      errands = await api.get("/errands");
      draw();
    }));
    box.querySelectorAll("[data-next]").forEach((btn) => btn.addEventListener("click", async () => {
      await api.post(`/errands/${btn.getAttribute("data-next")}/next`);
      toast("状态已更新", "success");
      errands = await api.get("/errands");
      draw();
    }));
  }
  draw();

  root.querySelectorAll("[data-tab]").forEach((chip) => chip.addEventListener("click", () => {
    root.querySelectorAll("[data-tab]").forEach((x) => x.classList.remove("active"));
    chip.classList.add("active");
    tab = chip.getAttribute("data-tab");
    draw();
  }));

  root.querySelector("#newHelp").addEventListener("click", () => {
    modal({
      title: "发布互助",
      okText: "发布",
      body: `<div class="grid grid-2">
        <div class="field"><label>类型</label><select class="select" name="type"><option value="express">快递代拿</option><option value="help">校园求助</option><option value="lost">失物招领</option></select></div>
        <div class="field"><label>标题</label><input class="input" name="title"></div>
        <div class="field"><label>取件/起点</label><input class="input" name="pickup"></div>
        <div class="field"><label>送达/终点</label><input class="input" name="destination"></div>
        <div class="field"><label>时间窗</label><input class="input" name="time_window" placeholder="今天 18:00 前"></div>
        <div class="field"><label>酬谢</label><input class="input" name="reward" placeholder="￥5 / 请喝奶茶"></div></div>
        <div class="field" style="margin-top:10px"><label>说明</label><textarea class="textarea" name="note"></textarea></div>`,
      onOk: async () => {
        const type = document.querySelector('[name="type"]').value;
        if (type === "lost") {
          await api.post("/lost-found", {
            type: "lost",
            name: document.querySelector('[name="title"]').value,
            place: document.querySelector('[name="pickup"]').value,
            description: document.querySelector('[name="note"]').value,
            happened_at: document.querySelector('[name="time_window"]').value,
          });
        } else {
          await api.post("/errands", {
            type,
            title: document.querySelector('[name="title"]').value,
            pickup: document.querySelector('[name="pickup"]').value,
            destination: document.querySelector('[name="destination"]').value,
            time_window: document.querySelector('[name="time_window"]').value,
            reward: document.querySelector('[name="reward"]').value,
            note: document.querySelector('[name="note"]').value,
          });
        }
        toast("已发布", "success");
        document.getElementById("modalRoot").innerHTML = "";
        [errands, lost] = await Promise.all([api.get("/errands"), api.get("/lost-found")]);
        draw();
      },
    });
  });
}