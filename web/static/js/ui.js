export function esc(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function money(value) {
  const n = Number(value || 0);
  return n.toLocaleString("zh-CN", { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 });
}

export function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function addDays(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function toast(message, type = "") {
  const root = document.getElementById("toastRoot");
  if (!root) return;
  const kind = type === "success" ? "success" : type === "error" ? "error" : type === "warn" || type === "warning" ? "warn" : "info";
  const icons = { success: "✓", error: "!", warn: "!", info: "i" };
  while (root.children.length >= 3) root.firstElementChild?.remove();
  const el = document.createElement("div");
  el.className = `toast toast-${kind} ${type || kind}`;
  el.setAttribute("role", "status");
  el.innerHTML = `<span class="toast-ico" aria-hidden="true">${icons[kind]}</span>
    <span class="toast-msg">${esc(message)}</span>
    <button class="toast-x" type="button" aria-label="关闭">×</button>
    <i class="toast-bar" aria-hidden="true"></i>`;
  let closed = false;
  const close = () => {
    if (closed) return;
    closed = true;
    el.classList.add("toast-out");
    setTimeout(() => el.remove(), 180);
  };
  el.querySelector(".toast-x").addEventListener("click", close);
  el.addEventListener("click", (e) => {
    if (!e.target.closest(".toast-x")) close();
  });
  root.appendChild(el);
  setTimeout(close, 2600);
}

export function closeModal() {
  const root = document.getElementById("modalRoot");
  root.innerHTML = "";
}

export function modal({ title, body, okText = "确定", cancelText = "取消", onOk, wide = false, hideOk = false }) {
  const root = document.getElementById("modalRoot");
  root.innerHTML = `
    <div class="modal-mask" id="modalMask">
      <div class="modal" style="${wide ? "width:min(880px,100%)" : ""}" role="dialog" aria-modal="true">
        <div class="modal-head">
          <div class="modal-title">${esc(title)}</div>
          <button class="icon-btn" data-close aria-label="关闭">×</button>
        </div>
        <div class="modal-body">${body}</div>
        <div class="modal-foot">
          <button class="btn btn-ghost" data-close>${esc(cancelText)}</button>
          ${hideOk ? "" : `<button class="btn btn-primary" id="modalOk">${esc(okText)}</button>`}
        </div>
      </div>
    </div>`;
  root.querySelectorAll("[data-close]").forEach((btn) => btn.addEventListener("click", closeModal));
  root.querySelector("#modalMask").addEventListener("click", (e) => {
    if (e.target.id === "modalMask") closeModal();
  });
  document.addEventListener("keydown", function onEsc(e) {
    if (e.key === "Escape") {
      closeModal();
      document.removeEventListener("keydown", onEsc);
    }
  });
  const ok = root.querySelector("#modalOk");
  if (ok && onOk) {
    ok.addEventListener("click", async () => {
      try {
        await onOk();
      } catch (e) {
        toast(e.message || "操作失败", "error");
      }
    });
  }
}

export function statusBadge(status) {
  const map = {
    open: ["badge-open", "可预约"],
    confirmed: ["badge-open", "已确认"],
    checked_in: ["badge-open", "已签到"],
    away: ["badge-pending", "暂离中"],
    released: ["badge-open", "已释放"],
    pending_approval: ["badge-pending", "待审批"],
    pending: ["badge-pending", "待决定"],
    occupied: ["badge-occupied", "已占用"],
    closed: ["badge-occupied", "已关闭"],
    cancelled: ["badge-closed", "已取消"],
    rejected: ["badge-closed", "已拒绝"],
    no_show: ["badge-closed", "超时未签到"],
    completed: ["badge-open", "已完成"],
    abandoned: ["badge-open", "已放弃"],
    bought: ["badge-occupied", "已购买"],
    claimed: ["badge-occupied", "已认领"],
    removed: ["badge-closed", "已下架"],
    accepted: ["badge-pending", "已接单"],
    picked_up: ["badge-pending", "已取件"],
    delivered: ["badge-pending", "已送达"],
  };
  const [cls, label] = map[status] || ["badge-occupied", status || "未知"];
  return `<span class="badge ${cls}">${esc(label)}</span>`;
}

export function empty(title, sub = "") {
  return `<div class="empty"><strong>${esc(title)}</strong>${sub ? esc(sub) : ""}</div>`;
}

export function loading(lines = 3) {
  return `<div class="card loading-card">${Array.from({ length: lines })
    .map(() => `<div class="skeleton" style="margin:8px 0"></div>`)
    .join("")}</div>`;
}

export function wire(root, selector, event, handler) {
  root.querySelectorAll(selector).forEach((el) => el.addEventListener(event, handler));
}

export function formValue(root, name) {
  const el = root.querySelector(`[name="${name}"]`);
  return el ? el.value : "";
}

export function debounce(fn, wait = 260) {
  let timer = null;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  };
}

export function sourceNote(data) {
  if (!data) return "";
  return `<div class="muted" style="margin-top:6px">${esc(data)}</div>`;
}
/* ---------------- 全站皮肤主题（苏小师所有界面通用） ---------------- */

export const SITE_THEMES = {
  default: null,
  pink: {
    vars: {
      "--fg-ink": "#5c2b45", "--fg-ink-soft": "#8a4a68",
      "--text-1": "#5c2b45", "--text-2": "#8a4a68", "--text-3": "#b98aa1",
      "--bg": "#fff0f6",
      "--surface": "#fff7fb", "--surface-2": "#ffe9f3", "--surface-3": "#ffdcea",
      "--primary": "#f43f8e", "--primary-2": "#d92b78", "--primary-light": "#ffe1ee",
      "--border": "rgba(244,63,142,.22)", "--border-strong": "rgba(244,63,142,.4)",
      "--fg-glass": "rgba(255,247,251,.88)", "--fg-glass-border": "#ffd6e6",
      "--fg-mesh-blue": "#ffe6f1", "--fg-mesh-peach": "#ffeef6", "--fg-mesh-mint": "#fde9f3",
      "--sc-paper": "#ffeef5", "--sc-card": "#fff7fb", "--sc-ink": "#5c2b45",
      "--sc-accent": "#f43f8e", "--sc-soft": "#ffd9e9", "--sc-line": "#ffc9dc",
    },
  },
  night: {
    vars: {
      "--fg-ink": "#e8e2d8", "--fg-ink-soft": "#b9b3a8",
      "--text-1": "#e8e2d8", "--text-2": "#b9b3a8", "--text-3": "#8b9188",
      "--bg": "#16191c",
      "--surface": "#23282c", "--surface-2": "#2b3136", "--surface-3": "#333a40",
      "--primary": "#c98d9f", "--primary-2": "#b0738a", "--primary-light": "#3a2c33",
      "--border": "rgba(255,255,255,.12)", "--border-strong": "rgba(255,255,255,.22)",
      "--fg-glass": "rgba(35,40,44,.9)", "--fg-glass-border": "rgba(255,255,255,.12)",
      "--fg-mesh-blue": "#1f262c", "--fg-mesh-peach": "#2a2129", "--fg-mesh-mint": "#1e2624",
      "--sc-paper": "#1b1f22", "--sc-card": "#23282c", "--sc-ink": "#e8e2d8",
      "--sc-accent": "#c98d9f", "--sc-soft": "#3a2c33", "--sc-line": "#343a3f",
    },
  },
};

const THEME_KEYS = Object.values(SITE_THEMES)
  .filter(Boolean)
  .reduce((set, t) => { Object.keys(t.vars).forEach((k) => set.add(k)); return set; }, new Set());

export function applyTheme(code) {
  const theme = SITE_THEMES[code] || null;
  const root = document.documentElement;
  if (!theme) {
    THEME_KEYS.forEach((k) => root.style.removeProperty(k));
    delete root.dataset.selfTheme;
    localStorage.setItem("selfTheme", "default");
    return;
  }
  Object.entries(theme.vars).forEach(([k, v]) => root.style.setProperty(k, v));
  root.dataset.selfTheme = code;
  localStorage.setItem("selfTheme", code);
}