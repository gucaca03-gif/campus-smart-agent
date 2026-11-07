import { api } from "../api.js";
import { esc, modal, toast } from "../ui.js";

export const TYPES = ["全部", "自习", "运动", "吃饭", "竞赛", "出游", "其他"];
export const FILTER_KEY = "buddyActivityFilter";
export const SCROLL_KEY = "buddyActivityScroll";
export const FAV_KEY = "buddyActivityFavorites";

export function timeText(a) {
  if (!a.start_at) return "时间待定";
  const start = String(a.start_at).replace("T", " ");
  const end = String(a.end_at || "").replace("T", " ");
  const startLabel = start.slice(5, 16);
  const endLabel = end ? end.slice(11, 16) : "";
  return `${startLabel}${endLabel ? `—${endLabel}` : ""}`;
}

export function statusBadge(a) {
  const map = {
    recruiting: ["badge-open", "招募中"],
    stopped: ["badge-pending", "停止招募"],
    cancelled: ["badge-closed", "已取消"],
    finished: ["badge-occupied", "已结束"],
    removed: ["badge-closed", "已下架"],
  };
  const [cls, label] = map[a.effective_status] || ["badge-occupied", a.status_label || "未知"];
  return `<span class="badge ${cls}">${esc(label)}</span>`;
}

export function peopleText(a) {
  if (a.effective_status === "cancelled") return `已取消 · 原定 ${a.capacity} 人`;
  if (a.remaining <= 0) return `已参加 ${a.taken}/${a.capacity} 人 · 已满员`;
  return `已参加 ${a.taken}/${a.capacity} 人，还缺 ${a.remaining} 人`;
}

export function isFavorite(id) {
  try {
    return JSON.parse(localStorage.getItem(FAV_KEY) || "[]").includes(Number(id));
  } catch (e) {
    return false;
  }
}

export function toggleFavorite(id) {
  let list = [];
  try {
    list = JSON.parse(localStorage.getItem(FAV_KEY) || "[]");
  } catch (e) {
    list = [];
  }
  const key = Number(id);
  const exists = list.includes(key);
  list = exists ? list.filter((x) => x !== key) : [...list, key];
  localStorage.setItem(FAV_KEY, JSON.stringify(list));
  return !exists;
}

export function primaryAction(a) {
  if (a.is_owner) {
    if (a.effective_status === "recruiting") return { label: "管理活动", kind: "manage" };
    return { label: "查看活动", kind: "detail" };
  }
  if (a.mine.status === "pending") return { label: "查看申请", kind: "viewApply" };
  if (a.mine.status === "accepted") {
    if (a.effective_status === "finished" || a.effective_status === "cancelled") {
      return { label: "查看活动记录", kind: "detail" };
    }
    return { label: "进入聊天", kind: "chat" };
  }
  if (a.mine.status === "rejected") return { label: "查看申请结果", kind: "detail" };
  if (a.mine.status === "withdrawn") return { label: "重新申请", kind: "apply" };
  if (a.effective_status === "cancelled") return { label: "已取消", kind: "disabled" };
  if (a.effective_status === "finished") return { label: "已结束", kind: "disabled" };
  if (a.effective_status === "stopped") return { label: "已停止招募", kind: "disabled" };
  if (a.remaining <= 0) return { label: "已满员", kind: "disabled" };
  return { label: "申请参加", kind: "apply" };
}

export function secondaryAction(a) {
  if (a.is_owner) return { label: "查看申请", kind: "applications" };
  if (a.mine.status === "pending") return { label: "撤回申请", kind: "withdraw" };
  if (a.mine.status === "accepted") return { label: "查看活动", kind: "detail" };
  if (a.mine.status === "rejected") return { label: "浏览其他活动", kind: "browse" };
  if (a.remaining <= 0) return { label: "浏览类似活动", kind: "browse" };
  if (a.effective_status === "cancelled") return { label: "查看说明", kind: "detail" };
  if (a.effective_status === "finished") return { label: "再约一次", kind: "repeat" };
  return { label: isFavorite(a.id) ? "已收藏" : "收藏", kind: "favorite" };
}

export function activityCard(a) {
  const primary = primaryAction(a);
  const secondary = secondaryAction(a);
  const reasons = (a.recommend_reasons || []).slice(0, 3);
  return `<article class="activity-card card" data-activity="${a.id}">
    <div class="activity-top">
      <span class="tag tag-blue">${esc(a.type)}</span>
      <span class="tag">${esc(a.campus)}</span>
      ${statusBadge(a)}
      ${a.is_owner ? '<span class="tag tag-gold">我发布的</span>' : ""}
    </div>
    <h3 class="activity-title">${esc(a.title)}</h3>
    <div class="activity-meta">
      <div><span class="ico">🕒</span>${esc(timeText(a))}</div>
      <div><span class="ico">📍</span>${esc(a.place)}</div>
    </div>
    <div class="activity-people">
      <span>${esc(peopleText(a))}</span>
      <span class="activity-bar"><i style="width:${Math.min(100, Math.round((a.taken / Math.max(1, a.capacity)) * 100))}%"></i></span>
    </div>
    <p class="activity-desc">${esc((a.content || "").slice(0, 70))}${(a.content || "").length > 70 ? "…" : ""}</p>
    ${reasons.length ? `<div class="activity-reasons">${reasons.map((r) => `<span>${esc(r)}</span>`).join("")}</div>` : ""}
    <div class="activity-foot">
      <span class="activity-owner"><b class="owner-avatar">${esc(a.owner.emoji)}</b><span>${esc(a.owner.nickname)}</span></span>
      <div class="row">
        <button class="btn btn-ghost btn-sm" data-act="${secondary.kind}" data-id="${a.id}">${esc(secondary.label)}</button>
        <button class="btn ${primary.kind === "disabled" ? "btn-ghost" : "btn-primary"} btn-sm" data-act="${primary.kind}" data-id="${a.id}" ${primary.kind === "disabled" ? "disabled" : ""}>${esc(primary.label)}</button>
      </div>
    </div>
  </article>`;
}

export function openApply(a, onDone) {
  if (!a.can_apply) {
    if (a.remaining <= 0) toast("活动已满员", "error");
    else if (a.effective_status !== "recruiting") toast("活动已停止招募", "error");
    else if (a.mine.status === "pending") toast("已申请，等待发起人处理", "success");
    else toast("当前状态不可申请", "error");
    return;
  }
  modal({
    title: `申请参加「${a.title}」`,
    okText: "发送申请",
    body: `<div class="muted" style="margin-bottom:10px">给发起人留句话，让对方了解你的时间和目标。</div>
      <textarea class="textarea" id="applyMsg" maxlength="300" placeholder="例如：我也在备考六级，时间正好合适，可以一起自习。"></textarea>
      <div class="muted" style="margin-top:8px">不要求填写联系方式；通过后可在站内聊天约细节。</div>`,
    onOk: async () => {
      const message = (document.getElementById("applyMsg").value || "").trim();
      await api.post(`/buddy/activities/${a.id}/apply`, { message });
      toast("申请已发送，等待发起人处理", "success");
      document.getElementById("modalRoot").innerHTML = "";
      onDone && onDone();
    },
  });
}

export async function runCardAction(kind, id, ctx, onDone) {
  if (kind === "disabled") return;
  if (kind === "detail") {
    sessionStorage.setItem(SCROLL_KEY, String(window.scrollY || 0));
    ctx.navigate(`/life/buddy/activity?id=${id}`);
    return;
  }
  if (kind === "manage") {
    ctx.navigate(`/life/buddy/activity?id=${id}`);
    return;
  }
  if (kind === "applications") {
    ctx.navigate(`/life/buddy/messages?tab=received`);
    return;
  }
  if (kind === "chat") {
    const a = await api.get(`/buddy/activities/${id}`);
    if (a.mine && a.mine.application_id) ctx.navigate(`/life/buddy/messages?chat=${a.mine.application_id}`);
    else ctx.navigate(`/life/buddy/messages?tab=chat`);
    return;
  }
  if (kind === "apply") {
    const a = await api.get(`/buddy/activities/${id}`);
    openApply(a, onDone);
    return;
  }
  if (kind === "withdraw") {
    const a = await api.get(`/buddy/activities/${id}`);
    if (!a.mine.application_id) return;
    if (!confirm("撤回这次申请？")) return;
    await api.post(`/buddy/applications/${a.mine.application_id}/withdraw`);
    toast("已撤回申请", "success");
    onDone && onDone();
    return;
  }
  if (kind === "favorite") {
    const on = toggleFavorite(id);
    toast(on ? "已收藏" : "已取消收藏");
    onDone && onDone();
    return;
  }
  if (kind === "browse") {
    const a = await api.get(`/buddy/activities/${id}`);
    sessionStorage.setItem(FILTER_KEY, JSON.stringify({ type: a.type, need_more: true, sort: "soon" }));
    ctx.navigate("/life/buddy");
    return;
  }
  if (kind === "repeat") {
    ctx.navigate("/life/buddy/new");
  }
}

export function emptyState(title, sub = "") {
  return `<div class="empty"><strong>${esc(title)}</strong>${sub ? esc(sub) : ""}</div>`;
}

export function relativeReasons(reasons) {
  return (reasons || []).slice(0, 3).map((r) => `<span>${esc(r)}</span>`).join("");
}