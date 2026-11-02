import { api } from "../api.js";
import { addDays, esc, money, modal, statusBadge, today, toast } from "../ui.js";


export function lifeTabs(active) {
  const items = [
    ["#/life", "概览", "overview"],
    ["#/life/nav", "校园导航", "nav"],
    ["#/life/buddy", "搭子", "buddy"],
    ["#/life/deal", "省钱", "deal"],
    ["#/life/help", "互帮互助", "help"],
  ];
  return `<div class="tabs">${items
    .map(([href, label, key]) => `<a class="tab ${active === key ? "active" : ""}" href="${href}">${label}</a>`)
    .join("")}</div>`;
}

export async function render(root, ctx) {
  const [savings, buddy, errands, meals] = await Promise.all([
    api.get("/savings/summary"),
    api.get("/buddy/posts"),
    api.get("/errands"),
    api.get("/self/fitness/meals").catch(() => []),
  ]);
  root.innerHTML = `${lifeTabs("overview")}
    <div class="page-head"><div><div class="page-title">校园生活</div><div class="page-sub">导航、搭子、省钱与互帮互助。自我管理在“我的”频道。位置与健康数据按最小化原则处理。</div></div>
    <a class="btn btn-primary" href="#/life/nav">开始导航</a></div>
    <div class="grid grid-2">
      <a class="card" href="#/life/nav"><div class="card-title">校园导航</div><div class="card-desc">口语别名 → 标准地点 → 站内路线；不跳转高德。未核验别名会明确标注。</div></a>
      <a class="card" href="#/life/buddy"><div class="card-title">找搭子</div><div class="card-desc">当前 ${buddy.filter((p) => p.status === "open").length} 条开放帖子：学习、运动、摄影、饭搭子、游戏、观展。</div></a>
      <a class="card" href="#/life/deal"><div class="card-title">省钱</div><div class="card-desc">累计节省 ¥${money(savings.saved)}；${savings.abandoned_count} 次放弃购买。只统计“已放弃”，不代表实际现金收入。</div></a>
      <a class="card" href="#/life/help"><div class="card-title">互帮互助</div><div class="card-desc">${errands.filter((e) => e.status === "open").length} 个开放任务：快递代拿、失物招领、校园求助。</div></a>
      <a class="card" href="#/assistant"><div class="card-title">直接问 AI</div><div class="card-desc">“去图书馆怎么走”“明天下午约个 4 人教室”，AI 给候选与路线，确认后才提交。</div></a>
    </div>
    <div class="section-title">今日摘要</div>
    <div class="grid grid-3">
      <div class="stat"><div class="stat-num">${buddy.filter((p) => p.status === "open").length}<span class="unit">条</span></div><div class="stat-label">开放搭子帖</div></div>
      <div class="stat"><div class="stat-num">${errands.filter((e) => e.status === "open").length}<span class="unit">个</span></div><div class="stat-label">待接互助任务</div></div>
      <div class="stat"><div class="stat-num">${meals.length}<span class="unit">餐</span></div><div class="stat-label">今日饮食记录</div></div>
    </div>`;
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
  const types = ["全部", "学习", "运动", "摄影", "饭搭子", "游戏", "观展"];
  let current = "全部";
  let rows = await api.get("/buddy/posts");
  root.innerHTML = `${lifeTabs("buddy")}
    <div class="page-head"><div><div class="page-title">搭子</div><div class="page-sub">支持一句话状态 + 标签 + 时间地点；先发后举报，联系方式默认站内私信。</div></div>
    <button class="btn btn-primary" id="newBuddy">发布搭子</button></div>
    <div class="chips" style="margin-bottom:16px">${types.map((t) => `<button class="chip ${t === "全部" ? "active" : ""}" data-type="${t}">${t}</button>`).join("")}</div>
    <div id="buddyList" class="grid grid-2"></div>`;

  function draw() {
    const filtered = current === "全部" ? rows : rows.filter((p) => p.type === current);
    root.querySelector("#buddyList").innerHTML = filtered.length
      ? filtered
          .map(
            (p) => `<div class="card">
              <div class="spread"><div class="row"><span class="tag tag-blue">${esc(p.type)}</span>${statusBadge(p.status)}</div>
                <span class="muted">${esc(p.created_at)}</span></div>
              <div class="card-title" style="margin-top:8px">${esc(p.title)}</div>
              <div class="card-desc">${esc(p.content)}</div>
              <div class="row" style="margin-top:10px"><span class="tag">${esc(p.time)}</span><span class="tag">${esc(p.place)}</span><span class="tag">${esc(p.campus)}</span></div>
              <div class="resource-foot"><span class="muted">联系方式：${esc(p.contact)}</span>
                <div class="row">${p.status === "open" ? `<button class="btn btn-ghost btn-sm" data-close="${p.id}">关闭</button>` : ""}
                <button class="btn btn-danger btn-sm" data-report="${p.id}">举报</button></div></div>
            </div>`
          )
          .join("")
      : '<div class="empty"><strong>没有匹配的搭子</strong>换个类型或发布一条</div>';
    bind();
  }

  function bind() {
    root.querySelectorAll("[data-close]").forEach((btn) => btn.addEventListener("click", async () => {
      await api.post(`/buddy/posts/${btn.getAttribute("data-close")}/close`);
      toast("已关闭", "success");
      rows = await api.get("/buddy/posts");
      draw();
    }));
    root.querySelectorAll("[data-report]").forEach((btn) => btn.addEventListener("click", async () => {
      await api.post(`/buddy/posts/${btn.getAttribute("data-report")}/report`, {});
      toast("已提交举报，内容下架待复核", "success");
      rows = await api.get("/buddy/posts");
      draw();
    }));
  }

  root.querySelectorAll("[data-type]").forEach((chip) => {
    chip.addEventListener("click", () => {
      root.querySelectorAll("[data-type]").forEach((x) => x.classList.remove("active"));
      chip.classList.add("active");
      current = chip.getAttribute("data-type");
      draw();
    });
  });
  draw();

  root.querySelector("#newBuddy").addEventListener("click", () => {
    modal({
      title: "发布搭子",
      okText: "发布",
      body: `<div class="grid grid-2">
        <div class="field"><label>类型</label><select class="select" name="type">${types.slice(1).map((t) => `<option>${t}</option>`).join("")}</select></div>
        <div class="field"><label>时间</label><input class="input" name="time" placeholder="例如：周三 19:00"></div>
        <div class="field"><label>地点</label><input class="input" name="place" placeholder="例如：图书馆"></div>
        <div class="field"><label>校区</label><input class="input" name="campus" value="泉山校区"></div></div>
        <div class="field" style="margin-top:10px"><label>标题</label><input class="input" name="title" placeholder="一句话说明想找什么搭子"></div>
        <div class="field" style="margin-top:10px"><label>详细说明</label><textarea class="textarea" name="content" placeholder="目的、期望、注意事项"></textarea></div>`,
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
        rows = await api.get("/buddy/posts");
        draw();
      },
    });
  });
}

/* ---------- 省钱 ---------- */
export async function renderDeal(root, ctx) {
  let [deals, intents, summary] = await Promise.all([
    api.get("/deals"),
    api.get("/purchase-intents"),
    api.get("/savings/summary"),
  ]);
  root.innerHTML = `${lifeTabs("deal")}
    <div class="page-head"><div><div class="page-title">省钱</div><div class="page-sub">社区投票帮判断“要不要买”；个人决策只统计“已放弃”。两者分开，不用别人的票替你做决定。</div></div>
    <button class="btn btn-primary" id="newDeal">发布想买</button></div>
    <div class="grid grid-4" style="margin-bottom:16px">
      <div class="stat"><div class="stat-num">¥${money(summary.saved)}</div><div class="stat-label">累计节省（已放弃）</div></div>
      <div class="stat"><div class="stat-num">${summary.abandoned_count}<span class="unit">次</span></div><div class="stat-label">放弃购买</div></div>
      <div class="stat"><div class="stat-num">${summary.pending_count}<span class="unit">件</span></div><div class="stat-label">待决定</div></div>
      <div class="stat"><div class="stat-num">¥${money(summary.bought)}</div><div class="stat-label">已购买（不计入节省）</div></div>
    </div>
    <div class="grid grid-2">
      <div class="card"><div class="card-title">我的购买决策</div>
        <div id="intentList">${intents.length ? intents.map(intentRow).join("") : '<div class="muted">还没有记录。先记一笔想买的东西。</div>'}</div>
        <button class="btn btn-ghost btn-sm" id="newIntent" style="margin-top:12px">记一笔想买</button>
      </div>
      <div class="card"><div class="card-title">口径说明</div>
        <div class="card-desc">累计省钱 = 当前未删除且状态为“已放弃”的意向金额之和。改价、撤销、删除会同步重算；重复点击不重复累计。该数字不是实际现金收入。</div>
      </div>
    </div>
    <div class="section-title">大家怎么看</div>
    <div id="dealList" class="grid grid-2">${deals.map(dealCard).join("")}</div>`;

  function bindIntents() {
    root.querySelectorAll("[data-intent]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.getAttribute("data-intent");
        const status = btn.getAttribute("data-status");
        await api.patch(`/purchase-intents/${id}`, { status });
        toast("已更新", "success");
        intents = await api.get("/purchase-intents");
        summary = await api.get("/savings/summary");
        renderDeal(root, ctx);
      });
    });
  }
  bindIntents();

  function bindVotes() {
    root.querySelectorAll("[data-vote]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const postId = btn.getAttribute("data-post");
        const vote = btn.getAttribute("data-vote");
        await api.post(`/deals/${postId}/vote`, { vote });
        toast("已记录投票", "success");
        deals = await api.get("/deals");
        root.querySelector("#dealList").innerHTML = deals.map(dealCard).join("");
        bindVotes();
      });
    });
  }
  bindVotes();

  root.querySelector("#newDeal").addEventListener("click", () => openDealModal(async () => {
    deals = await api.get("/deals");
    renderDeal(root, ctx);
  }));
  root.querySelector("#newIntent").addEventListener("click", () => openIntentModal(async () => {
    intents = await api.get("/purchase-intents");
    summary = await api.get("/savings/summary");
    renderDeal(root, ctx);
  }));
}

function intentRow(i) {
  return `<div class="spread" style="padding:9px 0;border-bottom:1px solid var(--border)">
    <div><strong>${esc(i.name)}</strong><div class="muted">¥${money(i.price)} · ${statusBadge(i.status)}</div></div>
    <div class="row">
      ${i.status !== "abandoned" ? `<button class="btn btn-ghost btn-sm" data-intent="${i.id}" data-status="abandoned">放弃</button>` : `<button class="btn btn-ghost btn-sm" data-intent="${i.id}" data-status="pending">撤销</button>`}
      ${i.status !== "bought" ? `<button class="btn btn-ghost btn-sm" data-intent="${i.id}" data-status="bought">已买</button>` : ""}
    </div></div>`;
}

function dealCard(d) {
  const total = d.votes.buy + d.votes.think + d.votes.no || 1;
  return `<div class="card">
    <div class="spread"><div class="card-title">${esc(d.product)}</div><span class="tag tag-gold">¥${money(d.price)}</span></div>
    <div class="card-desc">${esc(d.reason)}</div>
    <div class="muted" style="margin-top:6px">分类：${esc(d.category)} · 发布 ${esc(d.created_at)}</div>
    <div class="row" style="margin-top:10px">
      <button class="chip ${d.my_vote === "buy" ? "active" : ""}" data-post="${d.id}" data-vote="buy">值得买 ${d.votes.buy}</button>
      <button class="chip ${d.my_vote === "think" ? "active" : ""}" data-post="${d.id}" data-vote="think">再想想 ${d.votes.think}</button>
      <button class="chip ${d.my_vote === "no" ? "active" : ""}" data-post="${d.id}" data-vote="no">不买 ${d.votes.no}</button>
    </div>
    <div class="muted" style="margin-top:8px">共 ${total} 票；投票只作参考，不改变你的个人决策。</div>
  </div>`;
}

function openDealModal(onDone) {
  modal({
    title: "发布想买的东西",
    okText: "发布",
    body: `<div class="grid grid-2">
      <div class="field"><label>商品名</label><input class="input" name="product" placeholder="例如：降噪耳机"></div>
      <div class="field"><label>价格（元）</label><input class="input" name="price" type="number" min="0" step="0.01" placeholder="899"></div>
      <div class="field"><label>分类</label><select class="select" name="category"><option>数码</option><option>服饰</option><option>学习</option><option>生活</option><option>娱乐</option><option>其他</option></select></div></div>
      <div class="field" style="margin-top:10px"><label>为什么想买</label><textarea class="textarea" name="reason"></textarea></div>`,
    onOk: async () => {
      await api.post("/deals", {
        product: document.querySelector('[name="product"]').value,
        price: document.querySelector('[name="price"]').value,
        category: document.querySelector('[name="category"]').value,
        reason: document.querySelector('[name="reason"]').value,
      });
      toast("已发布", "success");
      document.getElementById("modalRoot").innerHTML = "";
      onDone();
    },
  });
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
  root.innerHTML = `${lifeTabs("help")}
    <div class="page-head"><div><div class="page-title">互帮互助</div><div class="page-sub">快递代拿、失物招领、校园求助。平台不托管资金，联系方式默认站内私信。</div></div>
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