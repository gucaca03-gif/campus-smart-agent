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
  const el = document.createElement("div");
  el.className = `toast ${type}`;
  el.textContent = message;
  root.appendChild(el);
  setTimeout(() => el.remove(), 2600);
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
    pending_approval: ["badge-pending", "待审批"],
    pending: ["badge-pending", "待决定"],
    occupied: ["badge-occupied", "已占用"],
    closed: ["badge-occupied", "已关闭"],
    cancelled: ["badge-closed", "已取消"],
    rejected: ["badge-closed", "已拒绝"],
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