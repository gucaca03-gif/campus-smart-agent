import { api } from "../api.js";
import { esc, modal, toast } from "../ui.js";

const AVATAR_AI = `<svg viewBox="0 0 64 64" aria-hidden="true">
  <circle cx="32" cy="32" r="31" fill="#eef4ff"/>
  <circle cx="32" cy="32" r="25" fill="#f6c453"/>
  <circle cx="20" cy="20" r="7" fill="#f6c453"/><circle cx="44" cy="20" r="7" fill="#f6c453"/>
  <circle cx="19" cy="43" r="7" fill="#f6c453"/><circle cx="45" cy="43" r="7" fill="#f6c453"/>
  <circle cx="32" cy="31" r="17" fill="#fff6e8"/>
  <ellipse cx="25" cy="29" rx="4.6" ry="4.2" fill="#fff" stroke="#1b4b8f" stroke-width="1.6"/>
  <ellipse cx="39" cy="29" rx="4.6" ry="4.2" fill="#fff" stroke="#1b4b8f" stroke-width="1.6"/>
  <circle cx="25" cy="29.5" r="1.8" fill="#1b2a3f"/><circle cx="39" cy="29.5" r="1.8" fill="#1b2a3f"/>
  <path d="M31 29 h2 M27 21 h10" stroke="#1b4b8f" stroke-width="1.4" stroke-linecap="round"/>
  <path d="M32 33.5 l-2.2 2.6 h4.4 z" fill="#d98f6b"/>
  <path d="M26 39 q6 5 12 0" stroke="#a55a3a" stroke-width="1.8" fill="none" stroke-linecap="round"/>
  <circle cx="21" cy="36" r="2.2" fill="#f7b7a3" opacity=".8"/>
  <circle cx="43" cy="36" r="2.2" fill="#f7b7a3" opacity=".8"/>
</svg>`;

const AVATAR_USER = `<svg viewBox="0 0 64 64" aria-hidden="true">
  <circle cx="32" cy="32" r="31" fill="#1b4b8f"/>
  <circle cx="32" cy="25" r="9.5" fill="#e8f0fb"/>
  <path d="M14 53 c0-10 8-16 18-16 s18 6 18 16" fill="#e8f0fb"/>
  <path d="M20 17 q12-8 24 0" stroke="#d9a441" stroke-width="2.4" fill="none" stroke-linecap="round"/>
  <circle cx="50" cy="16" r="2.2" fill="#d9a441"/>
  <circle cx="13" cy="28" r="1.6" fill="#d9a441" opacity=".8"/>
</svg>`;

const WEATHER_ICONS = {
  "晴": "☀️", "基本晴": "🌤️", "多云": "⛅", "阴": "☁️", "有雾": "🌫️", "霜雾": "🌫️",
  "毛毛雨": "🌦️", "小雨": "🌧️", "中雨": "🌧️", "大雨": "🌧️",
  "阵雨": "🌦️", "强阵雨": "🌧️", "暴雨": "🌧️",
  "小雪": "🌨️", "中雪": "🌨️", "大雪": "❄️", "雪粒": "❄️", "阵雪": "🌨️", "强阵雪": "❄️",
  "雷阵雨": "⛈️", "雷阵雨伴冰雹": "⛈️", "强雷暴伴冰雹": "⛈️",
  "冻雨": "🌧️", "强冻雨": "🌧️", "冻毛毛雨": "🌧️",
};

/* 时间统一按北京时间（Asia/Shanghai）显示：服务端存的是北京时间字符串 */
const BJ_FMT = new Intl.DateTimeFormat("zh-CN", {
  timeZone: "Asia/Shanghai", hour12: false,
  year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
});

function parseBjInstant(value) {
  if (value instanceof Date) return value;
  const raw = String(value || "").trim();
  if (!raw) return new Date();
  if (/Z$|[+-]\d{2}:?\d{2}$/.test(raw)) {
    const d = new Date(raw);
    if (!Number.isNaN(d.getTime())) return d;
  }
  const m = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
  if (m) {
    return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], +(m[4] || 0) - 8, +(m[5] || 0), +(m[6] || 0)));
  }
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

function bjParts(d) {
  const out = {};
  BJ_FMT.formatToParts(parseBjInstant(d)).forEach((p) => {
    if (p.type !== "literal") out[p.type] = p.value;
  });
  return out;
}

function fmtTime(value) {
  const p = bjParts(value || new Date());
  return `${p.hour}:${p.minute}`;
}

function bjDayKey(d) {
  const p = bjParts(d);
  return `${p.year}-${p.month}-${p.day}`;
}

/* 日期分组标签：今天 / 昨天 / 11月3日 周二（北京时间） */
function dayLabel(dayDate, now) {
  const base = parseBjInstant(now || new Date());
  const yest = new Date(base.getTime() - 86400000);
  const key = bjDayKey(dayDate);
  if (key === bjDayKey(base)) return "今天";
  if (key === bjDayKey(yest)) return "昨天";
  const p = bjParts(dayDate);
  const wd = ["日", "一", "二", "三", "四", "五", "六"][new Date(Date.UTC(+p.year, +p.month - 1, +p.day)).getUTCDay()];
  return `${Number(p.month)}月${Number(p.day)}日 周${wd}`;
}

function parseDayDate(createdAt, now) {
  return parseBjInstant(createdAt || now);
  return now;
}

function weatherHtml(w) {
  const cur = w.current || {};
  const list = (w.forecast || []).slice(0, 7);
  const rows = list
    .map((d, i) => {
      const label = i === 0 ? "今天" : i === 1 ? "明天" : i === 2 ? "后天" : d.weekday;
      return `<div class="weather-row ${i === 0 ? "today" : ""}">
        <span class="weather-day">${esc(label)}</span>
        <span class="weather-emoji">${WEATHER_ICONS[d.text] || "🌡️"}</span>
        <span class="weather-desc">${esc(d.text)}</span>
        <span class="weather-range">${esc(d.min)}~${esc(d.max)}°C</span>
        <span class="weather-precip">${d.precip != null && d.precip !== "" ? `${esc(d.precip)}%` : ""}</span>
      </div>`;
    })
    .join("");
  return `<div class="weather-card">
    <div class="weather-main">
      <div class="weather-ico">${WEATHER_ICONS[cur.text] || "🌡️"}</div>
      <div>
        <div class="small">${esc(w.city || "徐州")} · 现在</div>
        <div class="weather-temp">${esc(cur.temp)}<span>°C</span></div>
        <div class="muted">${esc(cur.text)} · 体感 ${esc(cur.feels)}°C · 湿度 ${esc(cur.humidity)}%</div>
      </div>
      <span class="tag tag-blue" style="margin-left:auto">${list.length} 天预报</span>
    </div>
    <div class="weather-list">${rows}</div>
    <div class="muted" style="margin-top:6px">数据源：${esc(w.source)}</div>
  </div>`;
}

function cardsHtml(cards = []) {
  if (!cards.length) return "";
  return `<div class="grid" style="margin-top:8px">${cards
    .map((c) => {
      if (c.kind === "metric") {
        return `<div class="stat" style="padding:11px"><div class="stat-num" style="font-size:18px">${esc(c.value)}</div><div class="stat-label">${esc(c.label)}</div></div>`;
      }
      if (c.kind === "campus") {
        return `<div class="card" style="padding:12px"><strong>${esc(c.name)}</strong><div class="muted">${esc(c.address)}</div></div>`;
      }
      if (c.kind === "calendar") {
        return `<div class="card" style="padding:12px"><strong>${esc(c.title)}</strong><div class="muted">${esc(c.start)}${c.end && c.end !== c.start ? ` 至 ${esc(c.end)}` : ""}</div></div>`;
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
        return `<div class="card" style="padding:12px"><strong>${esc(c.name)}</strong><a class="btn btn-ghost btn-sm" href="#/life/nav?to=${c.id}">选择并导航</a></div>`;
      }
      if (c.kind === "weather") {
        return weatherHtml(c);
      }
      if (c.kind === "action") {
        const OPEN_ALIAS = {
          office: "#/office",
          lab: "#/work/lab",
          self: "#/life/self/control",
          repair: "#/repair",
          buddy: "#/life/buddy",
          deal: "#/life/deal",
          hub: "#/hub",
          home: "#/home",
        };
        const t = String(c.target || "").trim();
        const href =
          c.action_type === "navigate"
            ? `#/life/nav${t ? `?to=${encodeURIComponent(t)}` : ""}`
            : c.action_type === "book_seat"
              ? "#/work/library"
              : c.action_type === "book_classroom"
                ? "#/work/classroom"
                : t.startsWith("#")
                  ? t
                  : OPEN_ALIAS[t.toLowerCase()] || "#/office";
        return `<a class="ai-action" href="${esc(href)}">
          <span class="ai-action-ico">✦</span>
          <span>${esc(c.label || "去看看")}</span>
          <em>›</em>
        </a>`;
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

const WELCOME =
  "嘿，我是苏小师，江师大的百事通小狮子 🦁 校情校历、去哪怎么走、约教室/图书馆、文件识别、待办专注、找搭子、省一省、报修，都能帮你张罗。想办预约的话，我会先给候选，你点头我才提交～";

export async function render(root, ctx) {
  root.innerHTML = `<div class="page-head"><div><div class="page-title">苏小师 · 校园百事通</div><div class="page-sub">校情校历、路线导航、预约办事，也聊天气和日常。多个对话独立保存，随时切回来。</div></div></div>
    <div class="assistant-layout">
      <aside class="chat-sessions">
        <button class="btn btn-primary btn-block" id="newChat">＋ 新对话</button>
        <div class="session-list" id="sessionList"></div>
              </aside>
      <section class="chat-panel">
        <div class="chat-head">
          <div class="row"><span class="ai-name">苏小师</span><span class="tag tag-blue">在线</span></div>
          <span class="muted" id="chatMeta">校园问答</span>
        </div>
        <div class="chat-body" id="chatBody"></div>
        <div class="chat-input-row">
          <textarea class="chat-input" id="chatInput" placeholder="试试：今天天气咋样 / 明天下午帮我约个 4 人研讨室"></textarea>
          <button class="btn btn-primary" id="chatSend">发送</button>
        </div>
      </section>
      <aside class="chat-side">
                <div class="card"><div class="card-title">也可以试试</div>
          <div class="chips" style="margin-top:8px">
            <button class="chip" data-example="今天天气咋样">今天天气</button>
            <button class="chip" data-example="明天下午帮我约一个 4 人的研讨教室">约教室</button>
            <button class="chip" data-example="去图书馆怎么走">去图书馆</button>
            <button class="chip" data-example="2026 年国庆怎么放假">查校历</button>
            <button class="chip" data-example="学校有几个校区">查校情</button>
                      </div>
        </div>
      </aside>
    </div>`;

  const body = root.querySelector("#chatBody");
  const input = root.querySelector("#chatInput");
  const listBox = root.querySelector("#sessionList");
  let sessions = [];
  let currentId = null;
  let sending = false;

  function add(role, text, extraHtml = "", createdAt = "") {
    const now = new Date();
    const dayDate = parseDayDate(createdAt, now);
    const dayKey = bjDayKey(dayDate);
    if (body.dataset.lastDay !== dayKey) {
      const divider = document.createElement("div");
      divider.className = "chat-day-divider";
      divider.textContent = dayLabel(dayDate, now);
      body.appendChild(divider);
      body.dataset.lastDay = dayKey;
    }
    const el = document.createElement("div");
    el.className = `msg ${role}`;
    const name = role === "user" ? "我" : "苏小师";
    const time = fmtTime(createdAt || new Date());
    el.innerHTML = `
      <div class="msg-avatar">${role === "user" ? AVATAR_USER : AVATAR_AI}</div>
      <div class="msg-main">
        <div class="msg-meta"><span>${name}</span>${time ? `<em>${time}</em>` : ""}</div>
        <div class="msg-bubble">${esc(text)}${role === "assistant" ? extraHtml : ""}</div>
      </div>`;
    body.appendChild(el);
    body.scrollTop = body.scrollHeight;
    return el;
  }

  function drawSessions() {
    if (!sessions.length) {
      listBox.innerHTML = '<div class="muted" style="padding:10px">还没有对话</div>';
      return;
    }
    listBox.innerHTML = sessions
      .map(
        (s) => `<div class="session-item ${s.id === currentId ? "active" : ""}" data-session="${s.id}">
          <div class="session-text">
            <div class="session-title">${esc(s.title || "新对话")}</div>
            <div class="session-sub">${s.message_count || 0} 条${s.last_message ? ` · ${esc(s.last_message)}` : ""}</div>
          </div>
          <div class="session-actions">
            <button data-rename="${s.id}" title="重命名">✎</button>
            <button data-del="${s.id}" title="删除">×</button>
          </div>
        </div>`
      )
      .join("");
    listBox.querySelectorAll("[data-session]").forEach((el) => {
      el.addEventListener("click", (e) => {
        if (e.target.closest("[data-rename]") || e.target.closest("[data-del]")) return;
        switchSession(Number(el.getAttribute("data-session")));
      });
    });
    listBox.querySelectorAll("[data-rename]").forEach((btn) => {
      btn.addEventListener("click", () => renameSession(Number(btn.getAttribute("data-rename"))));
    });
    listBox.querySelectorAll("[data-del]").forEach((btn) => {
      btn.addEventListener("click", () => deleteSession(Number(btn.getAttribute("data-del"))));
    });
  }

  async function refreshSessions() {
    sessions = (await api.get("/assistant/sessions")) || [];
    if (!currentId && sessions.length) currentId = sessions[0].id;
    drawSessions();
  }

  async function loadMessages() {
    body.innerHTML = "";
    body.dataset.lastDay = "";
    if (!currentId) {
      add("assistant", WELCOME).dataset.welcome = "1";
      return;
    }
    const rows = (await api.get(`/assistant/messages?session_id=${currentId}`)) || [];
    if (!rows.length) {
      add("assistant", WELCOME).dataset.welcome = "1";
      return;
    }
    rows.forEach((m) => {
      if (m.role === "assistant" && m.meta) {
        try {
          const meta = JSON.parse(m.meta);
          const el = add("assistant", esc(meta.reply || m.content), cardsHtml(meta.cards || []), m.created_at);
          bindBookButtons(el);
          return;
        } catch (e) {
          /* fall through */
        }
      }
      add(m.role === "user" ? "user" : "assistant", m.content, "", m.created_at);
    });
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

  async function switchSession(id) {
    if (id === currentId) return;
    currentId = id;
    drawSessions();
    await loadMessages();
    input.focus();
  }

  async function newSession() {
    const s = await api.post("/assistant/sessions", {});
    currentId = s.id;
    await refreshSessions();
    await loadMessages();
    input.focus();
    toast("开了一个新对话", "success");
  }

  function renameSession(id) {
    const s = sessions.find((x) => x.id === id);
    if (!s) return;
    modal({
      title: "重命名对话",
      okText: "保存",
      body: `<div class="field"><label>对话名称</label><input class="input" id="sessionName" value="${esc(s.title)}" maxlength="32"></div>`,
      onOk: async () => {
        const title = document.getElementById("sessionName").value.trim();
        if (!title) throw new Error("名称不能为空");
        await api.patch(`/assistant/sessions/${id}`, { title });
        document.getElementById("modalRoot").innerHTML = "";
        await refreshSessions();
        toast("已重命名", "success");
      },
    });
  }

  async function deleteSession(id) {
    if (!confirm("删除这个对话？聊天记录会一起清掉。")) return;
    await api.del(`/assistant/sessions/${id}`);
    sessions = [];
    if (id === currentId) currentId = null;
    await refreshSessions();
    await loadMessages();
    toast("对话已删除");
  }

  async function send(text) {
    const message = (text || input.value).trim();
    if (!message || sending) return;
    sending = true;
    root.querySelectorAll('.msg[data-welcome="1"]').forEach((el) => el.remove());
    if (!currentId) await newSession();
    add("user", message);
    input.value = "";
    const thinking = add("assistant", "苏小师搜索中…");
    try {
      const res = await api.post("/assistant/chat", { message, session_id: currentId });
      thinking.remove();
      const el = add("assistant", esc(res.reply), cardsHtml(res.cards), new Date().toISOString());
      bindBookButtons(el);
      if (res.session_id) currentId = res.session_id;
      await refreshSessions();
    } catch (e) {
      thinking.remove();
      add("assistant", `<span style="color:var(--danger)">${esc(e.message)}</span>`);
    } finally {
      sending = false;
    }
  }

  root.querySelector("#chatSend").addEventListener("click", () => send());
  input.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" || e.shiftKey) return;
    if (e.isComposing || e.keyCode === 229) return;
    e.preventDefault();
    send();
  });
  root.querySelectorAll("[data-example]").forEach((chip) => {
    chip.addEventListener("click", () => send(chip.getAttribute("data-example")));
  });
  root.querySelector("#newChat").addEventListener("click", () => newSession());

  await refreshSessions();
  await loadMessages();

  const q = ctx.params.get("q");
  if (q) {
    input.value = q;
    send(q);
  }
}