import { api } from "../api.js";
import { esc, toast } from "../ui.js";

const STATUS_CLS = {
  submitted: "tag-gold",
  in_progress: "tag-blue",
  done: "tag-green",
};

const STEP_CLS = {
  submitted: "on",
  in_progress: "half",
  done: "full",
};

function repairCard(r) {
  const step = STEP_CLS[r.status] || "";
  return `<div class="card rp-card" data-state="${r.status === "done" ? "done" : "open"}">
    <div class="spread">
      <div class="row" style="gap:8px;align-items:center">
        <span class="tag">${esc(r.area)}</span>
        <span class="tag">${esc(r.category)}</span>
        ${r.urgency_key === "urgent" ? '<span class="tag tag-red">紧急</span>' : ""}
        <span class="tag ${STATUS_CLS[r.status] || ""}">${esc(r.status_label)}</span>
      </div>
      <span class="muted rp-id">No.${String(r.id).padStart(4, "0")}</span>
    </div>
    <div class="rp-title">${esc(r.title)}</div>
    <div class="muted">${esc(r.location)} · ${esc(r.contact || "未留联系方式")}</div>
    ${r.description ? `<div class="card-desc" style="margin-top:8px">${esc(r.description)}</div>` : ""}
    <div class="rp-steps">
      <span class="rp-step ${step}">提交</span><i></i>
      <span class="rp-step ${r.status === "done" ? "full" : r.status === "in_progress" ? "on" : ""}">处理中</span><i></i>
      <span class="rp-step ${r.status === "done" ? "full" : ""}">完成</span>
    </div>
    ${r.reply ? `<div class="rp-reply">维修方回复：${esc(r.reply)}</div>` : `<div class="muted" style="margin-top:6px;font-size:11.5px">${esc(r.status_hint)}</div>`}

  </div>`;
}

export async function render(root, ctx) {
  const [meta, rows] = await Promise.all([
    api.get("/repairs/meta").catch(() => ({ areas: ["宿舍", "教学楼", "图书馆", "公共区域", "其他"], categories: ["水电", "家具", "网络", "门窗", "其他"] })),
    api.get("/repairs/my").catch(() => []),
  ]);
  const openCount = rows.filter((r) => r.status !== "done").length;

  root.innerHTML = `
    <div class="page-head" style="margin-bottom:10px"><div></div><a class="btn btn-ghost btn-sm" href="#/home">返回首页</a></div>
    <div class="detail-hero repair-hero">
      <div class="detail-art"><svg viewBox="0 0 200 160" fill="none">
        <rect x="46" y="30" width="108" height="104" rx="12" stroke="#8fdcff" stroke-opacity=".45" stroke-width="1.6"/>
        <path d="M72 62 H128 M72 84 H128 M72 106 H104" stroke="#fff" stroke-opacity=".32" stroke-width="4" stroke-linecap="round"/>
        <circle cx="150" cy="118" r="20" stroke="#f0cf94" stroke-opacity=".7" stroke-width="1.6"/>
        <path d="M143 111 l-4 14 14-4 M150 104 a6 6 0 0 1 6 6" stroke="#f0cf94" stroke-width="2" stroke-linecap="round"/>
      </svg></div>
      <div class="tag">REPAIR</div>
      <h1>校园报修</h1>
      <p>宿舍、教学楼与公共区域的设施问题，一处提交、全程可查。水电、家具、网络、门窗都可以报。</p>
      ${rows.length ? `<div class="bh-stats"><div class="bh-stat"><b>${rows.length}</b><span>累计报修</span></div><div class="bh-stat"><b>${openCount}</b><span>处理中</span></div><div class="bh-stat"><b>${rows.length - openCount}</b><span>已完成</span></div></div>` : ""}
    </div>

    <div class="repair-layout">
      <div class="card">
        <div class="card-title">提交报修</div>
        <div class="office-form">
          <div class="grid grid-2">
            <div class="field"><label>报修区域 *</label><select class="select" id="rpArea">
              ${meta.areas.map((a) => `<option>${esc(a)}</option>`).join("")}
            </select></div>
            <div class="field"><label>问题类型 *</label><select class="select" id="rpCategory">
              ${meta.categories.map((c) => `<option>${esc(c)}</option>`).join("")}
            </select></div>
          </div>
          <div class="field"><label>位置 *</label><input class="input" id="rpLocation" placeholder="如：泉山校区 5 号楼 402 / 教学楼 A-201"></div>
          <div class="field"><label>问题描述 *</label><input class="input" id="rpTitle" placeholder="一句话说明问题，如：宿舍灯管不亮"></div>
          <div class="field"><label>详细说明</label><textarea class="textarea" id="rpDesc" style="min-height:88px" placeholder="补充细节，如发生时间、影响范围、是否反复出现……"></textarea></div>
          <div class="grid grid-2">
            <div class="field"><label>紧急程度</label><select class="select" id="rpUrgency">
              <option value="normal">普通（48 小时内处理）</option>
              <option value="urgent">紧急（影响使用/安全）</option>
            </select></div>
            <div class="field"><label>联系方式</label><input class="input" id="rpContact" placeholder="手机号或 QQ，方便维修方联系"></div>
          </div>
          <button class="btn btn-primary" id="rpSubmit">提交报修</button>
        </div>
      </div>

      <div>
        <div class="card">
          <div class="spread"><div class="card-title">我的报修</div>
            <div class="row" style="gap:8px;align-items:center">
              <select class="select" id="rpFilter" style="width:120px">
                <option value="open">处理中</option>
                <option value="done">已完成</option>
              </select>
              <span class="tag">${rows.length} 条</span>
            </div>
          </div>
          <div id="rpList" style="margin-top:8px">
            ${rows.length ? rows.map(repairCard).join("") : '<div class="muted" style="padding:10px 0">暂无报修记录。有问题随时提交，全程可在这里查看进度。</div>'}
          </div>
        </div>
      </div>
    </div>`;

  const $ = (s) => root.querySelector(s);

  const filterSel = $("#rpFilter");
  const applyFilter = () => {
    const want = filterSel ? filterSel.value : "open";
    root.querySelectorAll(".rp-card").forEach((card) => {
      card.hidden = card.getAttribute("data-state") !== want;
    });
  };
  filterSel?.addEventListener("change", applyFilter);
  applyFilter();

  $("#rpSubmit").addEventListener("click", async () => {
    const payload = {
      area: $("#rpArea").value,
      category: $("#rpCategory").value,
      location: $("#rpLocation").value.trim(),
      title: $("#rpTitle").value.trim(),
      description: $("#rpDesc").value.trim(),
      urgency: $("#rpUrgency").value,
      contact: $("#rpContact").value.trim(),
    };
    if (!payload.location) {
      toast("请填写报修位置", "error");
      return;
    }
    if (!payload.title) {
      toast("请描述要报修的问题", "error");
      return;
    }
    const btn = $("#rpSubmit");
    btn.disabled = true;
    btn.textContent = "提交中…";
    try {
      await api.post("/repairs", payload);
      toast("报修已提交，可在右侧查看进度", "success");
      render(root, ctx);
    } catch (e) {
      toast(e.message, "error");
    } finally {
      btn.disabled = false;
      btn.textContent = "提交报修";
    }
  });

  }