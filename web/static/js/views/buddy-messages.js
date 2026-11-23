import { api } from "../api.js";
import { esc, toast } from "../ui.js";

const STATUS = {
  pending: ["badge-pending", "待处理"],
  accepted: ["badge-open", "已通过"],
  rejected: ["badge-closed", "未通过"],
  withdrawn: ["badge-occupied", "已撤回"],
};

function head(active, pending, unread) {
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

function appRow(item, role) {
  const [cls, label] = STATUS[item.status] || ["badge-occupied", item.status];
  const isInvite = item.direction === "received_invite" || item.direction === "sent_invite";
  const kind = isInvite ? "邀请" : "申请";
  const received = role === "received";
  const canHandle = received && item.status === "pending";
  return `<div class="apply-row card">
    <div class="spread">
      <div><strong>${esc(item.post_title)}</strong>
        <div class="muted">${received ? (isInvite ? "邀请你参加" : "申请人") : (isInvite ? "你邀请" : "发起人")}：${esc(item.peer_emoji)} ${esc(item.peer_nickname)}${item.peer_mbti ? ` · ${esc(item.peer_mbti)}` : ""}</div>
      </div>
      <div class="row"><span class="tag ${isInvite ? "tag-gold" : "tag-blue"}">${kind}</span><span class="badge ${cls}">${esc(item.status_label || label)}</span></div>
    </div>
    <div class="apply-msg">${esc(item.message || "（没有留言）")}</div>
    <div class="row" style="margin-top:8px">
      ${canHandle
        ? `<button class="btn btn-primary btn-sm" data-accept="${item.id}">${isInvite ? "接受邀请" : "通过"}</button>
           <button class="btn btn-ghost btn-sm" data-reject="${item.id}">${isInvite ? "婉拒" : "暂不通过"}</button>`
        : ""}
      ${!received && item.status === "accepted" ? `<button class="btn btn-primary btn-sm" data-chat="${item.id}">进入聊天</button>` : ""}
      ${!received && item.status === "pending" && !isInvite ? `<button class="btn btn-danger btn-sm" data-withdraw="${item.id}">撤回申请</button>` : ""}
      ${!received && item.status === "accepted" ? `<button class="btn btn-ghost btn-sm" data-quit="${item.id}">退出活动</button>` : ""}
      <a class="btn btn-ghost btn-sm" href="#/life/buddy/activity?id=${item.post_id}">查看活动</a>
    </div>
  </div>`;
}

export async function renderBuddyMessages(root, ctx) {
  const params = ctx.params;
  let tab = params.get("tab") || "received";
  let chatId = Number(params.get("chat") || 0);
  let data = { received: [], sent: [] };
  let chats = [];
  let chatTimer = null;

  root.innerHTML = `${head("messages", 0, 0)}
    <div class="page-head"><div><div class="page-sub">处理收到的申请、跟踪我发出的申请，并在通过后进入站内聊天。</div></div></div>
    <div class="tabs buddy-subtabs">
      <button class="tab ${tab === "received" ? "active" : ""}" data-msg-tab="received">待我处理</button>
      <button class="tab ${tab === "sent" ? "active" : ""}" data-msg-tab="sent">我发出的</button>
      <button class="tab ${tab === "chat" ? "active" : ""}" data-msg-tab="chat">聊天</button>
    </div>
    <div id="msgBox" class="buddy-msg-layout"></div>`;

  const box = root.querySelector("#msgBox");

  async function loadAll() {
    const [appsRes, chatList] = await Promise.all([
      api.get("/buddy/activity-applications"),
      api.get("/buddy/chats"),
    ]);
    data = appsRes;
    chats = chatList || [];
    const pending = (data.received || []).length;
    const unread = chats.reduce((sum, c) => sum + (c.unread || 0), 0);
    root.querySelector(".buddy-nav").outerHTML = head("messages", pending, unread);
    draw();
  }

  async function draw() {
    if (chatTimer) {
      clearInterval(chatTimer);
      chatTimer = null;
    }
    if (tab === "chat") {
      box.className = "buddy-msg-layout";
      box.innerHTML = `<div class="buddy-chat-list card">
        <div class="card-title">聊天</div>
        ${chats.length
          ? chats
              .map(
                (c) => `<button class="buddy-chat-item ${chatId === c.application_id ? "active" : ""}" data-open-chat="${c.application_id}">
                  <span class="buddy-chat-avatar">${esc(c.peer_emoji)}</span>
                  <span class="buddy-chat-text"><strong>${esc(c.peer_nickname)}</strong><em>${esc(c.post_title)}</em><span>${esc(c.last_message || "开始聊天吧")}</span></span>
                  ${c.unread ? `<span class="buddy-dot">${c.unread}</span>` : ""}
                </button>`
              )
              .join("")
          : '<div class="muted" style="padding:12px">还没有已建立的聊天。申请通过后会出现在这里。</div>'}
      </div>
      <div id="chatPanel" class="buddy-chat-panel">${chatId ? '<div class="muted">加载聊天…</div>' : '<div class="empty"><strong>选择一个聊天</strong>申请通过后即可在这里联系搭子</div>'}</div>`;
      box.querySelectorAll("[data-open-chat]").forEach((btn) => {
        btn.addEventListener("click", () => openChat(Number(btn.getAttribute("data-open-chat"))));
      });
      if (chatId) await openChat(chatId);
      return;
    }

    box.className = "buddy-msg-single";
    const received = data.received || [];
    const sent = data.sent || [];
    if (tab === "received") {
      box.innerHTML = received.length
        ? received.map((x) => appRow(x, "received")).join("")
        : '<div class="empty"><strong>没有待处理的申请</strong>同学申请你的活动后，会出现在这里</div>';
      bindRowActions();
      return;
    }
    box.innerHTML = sent.length
      ? sent.map((x) => appRow(x, "sent")).join("")
      : '<div class="empty"><strong>还没有发出申请</strong>去「找活动」申请一个感兴趣的活动</div>';
    bindRowActions();
  }

  function bindRowActions() {
    box.querySelectorAll("[data-accept]").forEach((btn) =>
      btn.addEventListener("click", async () => {
        try {
          await api.post(`/buddy/applications/${btn.getAttribute("data-accept")}/accept`);
          toast("已通过申请，可以进入聊天了", "success");
          await loadAll();
        } catch (e) {
          toast(e.message, "error");
        }
      })
    );
    box.querySelectorAll("[data-reject]").forEach((btn) =>
      btn.addEventListener("click", async () => {
        try {
          await api.post(`/buddy/applications/${btn.getAttribute("data-reject")}/reject`);
          toast("已标记为未通过", "success");
          await loadAll();
        } catch (e) {
          toast(e.message, "error");
        }
      })
    );
    box.querySelectorAll("[data-withdraw]").forEach((btn) =>
      btn.addEventListener("click", async () => {
        try {
          await api.post(`/buddy/applications/${btn.getAttribute("data-withdraw")}/withdraw`);
          toast("已撤回申请", "success");
          await loadAll();
        } catch (e) {
          toast(e.message, "error");
        }
      })
    );
    box.querySelectorAll("[data-quit]").forEach((btn) =>
      btn.addEventListener("click", async () => {
        if (!confirm("退出活动？名额会释放给其他同学。")) return;
        try {
          await api.post(`/buddy/applications/${btn.getAttribute("data-quit")}/quit`);
          toast("已退出活动", "success");
          await loadAll();
        } catch (e) {
          toast(e.message, "error");
        }
      })
    );
    box.querySelectorAll("[data-chat]").forEach((btn) => btn.addEventListener("click", () => switchToChat(Number(btn.getAttribute("data-chat")))));
  }

  function switchToChat(id) {
    tab = "chat";
    chatId = id;
    root.querySelectorAll("[data-msg-tab]").forEach((x) => x.classList.toggle("active", x.getAttribute("data-msg-tab") === "chat"));
    draw();
  }

  async function openChat(appId) {
    chatId = appId;
    box.querySelectorAll(".buddy-chat-item").forEach((x) => x.classList.toggle("active", Number(x.getAttribute("data-open-chat")) === appId));
    const panel = box.querySelector("#chatPanel");
    if (!panel) return;
    panel.innerHTML = '<div class="muted">加载聊天…</div>';
    try {
      const dataChat = await api.get(`/buddy/chat/${appId}`);
      panel.innerHTML = `<div class="chat-thread-head">
          <div><strong>${esc(dataChat.peer.emoji)} ${esc(dataChat.peer.nickname)}</strong><div class="muted">${esc(dataChat.peer.mbti || "")}</div></div>
          <span class="tag tag-blue">站内聊天</span>
        </div>
        <div class="chat-thread-body" id="threadBody">
          ${dataChat.messages.length
            ? dataChat.messages
                .map((m) => `<div class="thread-msg ${m.from_me ? "me" : "peer"}"><div class="thread-bubble">${esc(m.content)}</div><div class="thread-time">${esc((m.created_at || "").slice(11, 16))}</div></div>`)
                .join("")
            : '<div class="empty"><strong>还没有消息</strong>打个招呼吧</div>'}
        </div>
        <div class="chat-thread-input">
          <input class="input" id="threadInput" placeholder="输入消息，Enter 发送">
          <button class="btn btn-primary" id="threadSend">发送</button>
        </div>`;
      const threadHtml = (messages) =>
        messages.length
          ? messages
              .map((m) => `<div class="thread-msg ${m.from_me ? "me" : "peer"}"><div class="thread-bubble">${esc(m.content)}</div><div class="thread-time">${esc((m.created_at || "").slice(11, 16))}</div></div>`)
              .join("")
          : '<div class="empty"><strong>还没有消息</strong>打个招呼吧</div>';
      const bodyEl = panel.querySelector("#threadBody");
      bodyEl.scrollTop = bodyEl.scrollHeight;
      await api.post(`/buddy/chat/${appId}/read`).catch(() => {});
      const current = chats.find((x) => x.application_id === appId);
      if (current && current.unread) {
        current.unread = 0;
        const pending = (data.received || []).length;
        const unread = chats.reduce((sum, c) => sum + (c.unread || 0), 0);
        const nav = root.querySelector(".buddy-nav");
        if (nav) nav.outerHTML = head("messages", pending, unread);
      }
      const input = panel.querySelector("#threadInput");
      const send = async () => {
        const text = input.value.trim();
        if (!text) return;
        input.value = "";
        try {
          await api.post(`/buddy/chat/${appId}`, { content: text });
          await openChat(appId);
        } catch (e) {
          toast(e.message, "error");
        }
      };
      panel.querySelector("#threadSend").addEventListener("click", send);
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          send();
        }
      });
      // 对方是演示账号：服务端随机 15-60 秒后才落库回复，这里轮询拉取
      if (chatTimer) clearInterval(chatTimer);
      chatTimer = setInterval(async () => {
        const latest = await api.get(`/buddy/chat/${appId}`).catch(() => null);
        if (!latest) return;
        const list = panel.querySelector("#threadBody");
        if (!list) {
          clearInterval(chatTimer);
          chatTimer = null;
          return;
        }
        list.innerHTML = threadHtml(latest.messages || []);
        list.scrollTop = list.scrollHeight;
        await api.post(`/buddy/chat/${appId}/read`).catch(() => {});
      }, 5000);
    } catch (e) {
      panel.innerHTML = `<div class="empty"><strong>聊天加载失败</strong>${esc(e.message)}</div>`;
    }
  }

  root.querySelectorAll("[data-msg-tab]").forEach((tabBtn) => {
    tabBtn.addEventListener("click", () => {
      tab = tabBtn.getAttribute("data-msg-tab");
      root.querySelectorAll("[data-msg-tab]").forEach((x) => x.classList.toggle("active", x === tabBtn));
      if (tab !== "chat") chatId = 0;
      draw();
    });
  });

  await loadAll();
}