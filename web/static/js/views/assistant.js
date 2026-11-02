import { api } from "../api.js";
import { esc, modal, toast } from "../ui.js";

function traceHtml(trace = []) {
  if (!trace.length) return '<div class="muted">本次没有工具调用。</div>';
  return trace
    .map(
      (t) => `<div class="trace-item ${t.status === "ok" ? "ok" : t.status === "fallback" ? "" : "fail"}">
        <strong>${esc(t.tool)}</strong> · ${esc(t.status)}<br>${esc(t.summary)}</div>`
    )
    .join("");
}

function cardsHtml(cards = []) {
  if (!cards.length) return "";
  return `<div class="grid" style="margin-top:8px">${cards
    .map((c) => {
      if (c.kind === "metric") {
        return `<div class="stat" style="padding:11px"><div class="stat-num" style="font-size:18px">${esc(c.value)}</div><div class="stat-label">${esc(c.label)}</div>${c.status === "pending" ? '<div class="stat-pending">待核验</div>' : ""}</div>`;
      }
      if (c.kind === "campus") {
        return `<div class="card" style="padding:12px"><strong>${esc(c.name)}</strong><div class="muted">${esc(c.address)}</div></div>`;
      }
      if (c.kind === "calendar") {
        return `<div class="card" style="padding:12px"><strong>${esc(c.title)}</strong><div class="muted">${esc(c.start)}${c.end && c.end !== c.start ? ` 至 ${esc(c.end)}` : ""} ${c.status === "inferred" ? "· 待核验" : ""}</div></div>`;
      }
      if (c.kind === "route") {
        return `<div class="card" style="padding:12px"><strong>到 ${esc(c.destination.name)}</strong>
          <div class="muted">约 ${c.distance_m} 米 · ${c.minutes} 分钟</div>
          <div class="muted" style="margin-top:5px">${c.steps.map((s) => esc(s)).join(" → ")}</div>
          <div class="row" style="margin-top:8px">
            <a class="btn btn-ghost btn-sm" href="#/life/nav?to=${c.destination.id}">打开地图</a>
            ${c.amap_url ? `<a class="btn btn-soft btn-sm" href="${esc(c.amap_url)}" target="_blank" rel="noopener">在高德地图中打开 ↗</a>` : ""}
          </div></div>`;
      }
      if (c.kind === "buddy") {
        return `<div class="card" style="padding:12px"><span class="tag tag-blue">${esc(c.type)}</span><strong style="margin-left:6px">${esc(c.title)}</strong><div class="muted">${esc(c.time)} · ${esc(c.place)}</div></div>`;
      }
      if (c.kind === "place") {
        return `<div class="card" style="padding:12px"><strong>${esc(c.name)}</strong><div class="muted">${c.verified ? "已核验" : "待核验"}</div><a class="btn btn-ghost btn-sm" href="#/life/nav?to=${c.id}">选择并导航</a></div>`;
      }
      if (c.resource_id) {
        return `<div class="card" style="padding:12px;border-color:#efd9ae;background:#fffaf0">
          <div class="spread"><div><strong>${esc(c.name)}</strong><div class="muted">${esc(c.room)} · 容量 ${c.capacity} 人</div></div><span class="tag tag-green">可约</span></div>
          <div class="muted" style="margin-top:6px">${esc(c.reason || "")}</div>
          <button class="btn btn-primary btn-sm" style="margin-top:8px" data-ai-book="${c.resource_id}" data-date="${esc(c.date)}" data-start="${esc(c.start_at)}" data-end="${esc(c.end_at)}" data-people="${c.people}" data-name="${esc(c.name)}">确认预约这个</button></div>`;
      }
      return "";
    })
    .join("")}</div>`;
}

export async function render(root, ctx) {
  const history = await api.get("/assistant/messages");
  root.innerHTML = `<div class="page-head"><div><div class="page-title">AI 助手</div><div class="page-sub">RAG + Agent 演示：校情/校历/资源/路线走结构化查询；预约写操作必须由你确认，模型不会静默下单。</div></div>
    <button class="btn btn-ghost btn-sm" id="clearChat">清空会话</button></div>
    <div class="chat-shell">
      <div class="chat-panel">
        <div class="chat-head"><div class="row"><span class="tag tag-blue">演示模式</span><span class="muted">未接外部模型时使用规则 + 结构化数据</span></div>
          <span class="tag tag-warn">不编造预约号</span></div>
        <div class="chat-body" id="chatBody"></div>
        <div class="chat-input-row">
          <textarea class="chat-input" id="chatInput" placeholder="试试：明天下午帮我约一个 4 人的研讨教室"></textarea>
          <button class="btn btn-primary" id="chatSend">发送</button>
        </div>
      </div>
      <aside class="chat-side">
        <div class="card"><div class="card-title">工具轨迹</div><div id="traceBox" class="muted">发送后显示本次工具调用与结果。</div></div>
        <div class="card"><div class="card-title">能力边界</div><div class="card-desc">校情、校历、资源、路线来自演示库；外部模型、地图、图书馆系统未授权时明确降级。AI 不会直接删除、转账或替你做决定。</div></div>
        <div class="card"><div class="card-title">推荐问法</div>
          <div class="chips" style="margin-top:8px">
            <button class="chip" data-example="明天下午帮我约一个 4 人的研讨教室">约教室</button>
            <button class="chip" data-example="今天下午哪里能约人工智能实验室">约实验室</button>
            <button class="chip" data-example="去图书馆怎么走">去图书馆</button>
            <button class="chip" data-example="2026 年国庆怎么放假">查校历</button>
            <button class="chip" data-example="学校有几个校区">查校情</button>
          </div>
        </div>
      </aside>
    </div>`;

  const body = root.querySelector("#chatBody");
  const input = root.querySelector("#chatInput");
  const traceBox = root.querySelector("#traceBox");
  let sending = false;

  function add(role, text, extraHtml = "") {
    const el = document.createElement("div");
    el.className = `msg ${role}`;
    el.innerHTML = `<div class="msg-avatar">${role === "user" ? "我" : "AI"}</div><div class="msg-bubble">${role === "user" ? esc(text) : `${text}${extraHtml}`}</div>`;
    body.appendChild(el);
    body.scrollTop = body.scrollHeight;
    return el;
  }

  history.forEach((m) => {
    if (m.role === "assistant" && m.meta) {
      try {
        const meta = JSON.parse(m.meta);
        const el = add("assistant", esc(meta.reply || m.content), cardsHtml(meta.cards || []));
        bindBookButtons(el);
        return;
      } catch (e) {
        /* fall through */
      }
    }
    add(m.role === "user" ? "user" : "assistant", m.content);
  });
  if (!history.length) {
    add(
      "assistant",
      "你好，我是爱师大助手。可以帮你查校情/校历、找可约的实验室/教室/座位、规划校园路线、看省钱统计。预约会先给候选，只有你点击确认后才提交。"
    );
  }

  function bindBookButtons(scope) {
    scope.querySelectorAll("[data-ai-book]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const payload = {
          resource_id: Number(btn.getAttribute("data-ai-book")),
          date: btn.getAttribute("data-date"),
          start_at: btn.getAttribute("data-start"),
          end_at: btn.getAttribute("data-end"),
          people: Number(btn.getAttribute("data-people") || 1),
          purpose: "AI 助手推荐",
        };
        modal({
          title: "确认预约",
          okText: "确认提交",
          body: `<div class="draft-card"><div class="card-title">${esc(btn.getAttribute("data-name"))}</div>
            <div class="small">${esc(payload.date)} ${esc(payload.start_at)}–${esc(payload.end_at)} · ${payload.people} 人</div>
            <div class="muted" style="margin-top:6px">提交后按资源规则进入“待审批”或“已确认”；请按时签到，避免违约。</div></div>`,
          onOk: async () => {
            try {
              const result = await api.post("/bookings", payload);
              toast(result.status === "pending_approval" ? `已提交审批：${result.code}` : `预约成功：${result.code}`, "success");
              document.getElementById("modalRoot").innerHTML = "";
              btn.disabled = true;
              btn.textContent = "已提交";
            } catch (e) {
              toast(e.message, "error");
            }
          },
        });
      });
    });
  }

  async function send(text) {
    const message = (text || input.value).trim();
    if (!message || sending) return;
    sending = true;
    add("user", message);
    input.value = "";
    const thinking = add("assistant", '<span class="muted">正在查询…</span>');
    try {
      const res = await api.post("/assistant/chat", { message });
      thinking.remove();
      const el = add("assistant", esc(res.reply), cardsHtml(res.cards));
      bindBookButtons(el);
      traceBox.innerHTML = traceHtml(res.trace);
      if (res.draft && res.draft.type === "place_choice") {
        traceBox.innerHTML += '<div class="muted" style="margin-top:8px">多候选地点：请先选择，不自动猜测。</div>';
      }
    } catch (e) {
      thinking.remove();
      add("assistant", `<span style="color:var(--danger)">${esc(e.message)}</span>`);
      traceBox.innerHTML = `<div class="trace-item fail">assistant · error<br>${esc(e.message)}</div>`;
    } finally {
      sending = false;
    }
  }

  root.querySelector("#chatSend").addEventListener("click", () => send());
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  });
  root.querySelectorAll("[data-example]").forEach((chip) => {
    chip.addEventListener("click", () => send(chip.getAttribute("data-example")));
  });
  root.querySelector("#clearChat").addEventListener("click", async () => {
    await api.del("/assistant/messages");
    body.innerHTML = "";
    add("assistant", "会话已清空。可以继续提问。");
    traceBox.innerHTML = '<div class="muted">发送后显示本次工具调用与结果。</div>';
  });

  const q = ctx.params.get("q");
  if (q) {
    input.value = q;
    send(q);
  }
}