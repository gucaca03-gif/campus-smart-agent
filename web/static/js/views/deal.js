import { api } from "../api.js";
import { closeModal, esc, modal, money, toast } from "../ui.js";

const CATEGORIES = ["数码", "服饰", "食品", "日用品", "学习用品", "其他"];
const CONDITION_LABEL = { new: "全新", used: "二手", refurb: "翻新" };
const EVIDENCE_LABEL = {
  official: "厂商官方规格",
  media: "机构/媒体实测",
  campus: "校园用户经验",
  vendor: "商家宣传",
  ai_summary: "AI 基于证据的归纳",
};

let curPlan = null;
const aiPriceCache = new Map();

/* ============================ 新建计划 ============================ */

export async function renderDealNew(root, ctx) {
  let category = "数码";
  let specs = {};
  let imageData = "";

  root.innerHTML = `
    <div class="page-head"><div><div class="page-title">发起购买计划</div>
      <div class="page-sub">先确认商品，再补充预算与用途。</div></div>
      <a class="btn btn-ghost btn-sm" href="#/life/deal">‹ 返回省一省</a></div>

    <div class="card deal-form-card">
      <div class="spread"><div class="card-title">① 商品信息</div><button type="button" class="btn btn-ghost btn-sm" id="dDemo">案例导入</button></div>
      <div class="deal-grid2" style="margin-top:10px">
        <div class="field"><label>商品名称 *</label><input class="input" id="dName" placeholder="例如：索尼无线蓝牙头戴式耳机。（给出的商品名称越具体越好）"></div>
        <div class="field"><label>类别</label><select class="select" id="dCat">${CATEGORIES.map((c) => `<option ${c === category ? "selected" : ""}>${c}</option>`).join("")}</select></div>
        <div class="field"><label>新旧状态</label><select class="select" id="dCond">${Object.entries(CONDITION_LABEL).map(([k, v]) => `<option value="${k}">${v}</option>`).join("")}</select></div>
        <div class="field"><label>购买平台</label><input class="input" id="dPlatform" placeholder="例如：京东"></div>
        <div class="field"><label>数量</label><input class="input" id="dQty" type="number" min="1" value="1"></div>
        <div class="field"><label>关键规格（可选）</label><input class="input" data-spec="spec" placeholder="待确认"></div>
        <div class="field"><label>价格（元）</label><input class="input" id="dPrice" type="number" min="0" step="0.01" placeholder="0.00"></div>
        <div class="field"><label>商品链接（可选）</label><input class="input" id="dUrl" placeholder="https://…"></div>
        <div class="field"><label>商品图片附件（可选）</label><input class="input" id="dImage" type="file" accept="image/*"></div>
        <div class="field"><label>备注（可选）</label><input class="input" id="dNote" placeholder="补充说明，例如颜色、版本或注意事项"></div>
      </div>
      <div class="muted" style="margin-top:8px;font-size:11px">无法确认的字段可留空，保存后显示「待确认」。</div>
    </div>

    <div class="card deal-form-card" style="margin-top:16px">
      <div class="card-title">② 购买计划</div>
      <div class="deal-grid2" style="margin-top:10px">
        <div class="field"><label>预计价格（元）</label><input class="input" id="dPlanPrice" type="number" min="0" step="0.01"></div>
        <div class="field"><label>预算上限（元）</label><input class="input" id="dBudget" type="number" min="0" step="0.01"></div>
        <div class="field "><label>使用场景</label><input class="input" id="dScene" placeholder="描述这件商品的使用场景"></div>
        <div class="field"><label>需求紧急程度</label><select class="select" id="dUrgency">
          <option value="urgent">紧急（现在就要）</option><option value="soon">近期需要</option>
          <option value="normal" selected>一般</option><option value="can_wait">可以等</option></select></div>
        <div class="field"><label>预计使用频率</label><select class="select" id="dFreq">
          <option value="daily" selected>每天</option><option value="weekly">每周</option>
          <option value="monthly">每月</option><option value="seldom">很少</option></select></div>
        <div class="field"><label>可接受等待时间（天）</label><input class="input" id="dWait" type="number" min="0" value="7"></div>
      </div>
      <div class="field" style="margin-top:10px"><label>购买理由</label><textarea class="input" id="dReason" rows="2" placeholder="为什么想买？不用买会怎样？"></textarea></div>
      <div class="field" style="margin-top:10px"><label>已有类似物品</label><input class="input" id="dExisting" placeholder="例如：已有一副有线耳机"></div>
      <div class="field" style="margin-top:10px"><label>替代方案</label><input class="input" id="dAlt" placeholder="例如：先借用室友的、买二手、用学校机房"></div>

      <div class="deal-grid2" style="margin-top:10px">
        <div class="field"><label>可见范围</label><select class="select" id="dVis">
          <option value="private" selected>仅自己查看</option><option value="public">校园公开讨论</option>
        </select></div>
        <div class="field"><label>讨论结束方式</label><select class="select" id="dEndMode">
          <option value="target_votes" selected>按有效投票人数</option><option value="deadline">按截止时间</option></select></div>
        <div class="field" id="dVoteField"><label>目标有效投票人数</label><input class="input" id="dTarget" type="number" min="1" value="5"></div>
        <div class="field" id="dDeadlineField" hidden><label>截止时间</label><input class="input" id="dDeadline" type="datetime-local"></div>
      </div>
      <div class="row" style="margin-top:16px;justify-content:flex-end">
        <button class="btn btn-ghost" id="dCancel">取消</button>
        <button class="btn btn-primary" id="dSubmit">创建计划草稿</button>
      </div>
    </div>`;

  const $ = (s) => root.querySelector(s);
  $("#dDemo").addEventListener("click", () => {
    $("#dName").value = "索尼 WH-1000XM5 头戴式降噪耳机";
    $("#dCat").value = "数码";
    category = "数码";
    specs = {};
    $("#dCond").value = "new";
    $("#dPlatform").value = "京东";
    $("#dQty").value = "1";
    const specEl = root.querySelector('[data-spec="spec"]');
    if (specEl) specEl.value = "黑色 / 蓝牙 5.2 / 主动降噪";
    $("#dPrice").value = "2299";
    $("#dUrl").value = "https://example.com/sony-wh1000xm5";
    $("#dNote").value = "通勤地铁使用，重点关注降噪与续航";
    $("#dPlanPrice").value = "2299";
    $("#dBudget").value = "2500";
    $("#dScene").value = "每日通勤地铁听歌、图书馆专注时降噪";
    $("#dUrgency").value = "soon";
    $("#dFreq").value = "daily";
    $("#dWait").value = "7";
    $("#dReason").value = "现有耳机降噪差，通勤噪音大影响休息与学习效率";
    $("#dExisting").value = "已有一副有线入耳耳机";
    $("#dAlt").value = "先买二手，或等到双十一再买";
    toast("已导入案例，可直接修改后提交", "success");
  });

  $("#dCat").addEventListener("change", (e) => {
    category = e.target.value;
    specs = {};
  });
  $("#dImage").addEventListener("change", (e) => {
    const f = e.target.files[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) return toast("请选择图片文件", "error");
    if (f.size > 1.5 * 1024 * 1024) return toast("图片请小于 1.5MB", "error");
    const reader = new FileReader();
    reader.onload = () => {
      imageData = String(reader.result || "");
      toast("图片已附加（随计划保存）");
    };
    reader.readAsDataURL(f);
  });
  $("#dEndMode").addEventListener("change", (e) => {
    $("#dVoteField").hidden = e.target.value !== "target_votes";
    $("#dDeadlineField").hidden = e.target.value !== "deadline";
  });
  $("#dCancel").addEventListener("click", () => (location.hash = "#/life/deal"));
  $("#dSubmit").addEventListener("click", async () => {
    const name = $("#dName").value.trim();
    if (!name) return toast("请填写商品名称", "error");
    const specInputs = root.querySelectorAll("[data-spec]");
    specInputs.forEach((el) => {
      if (el.value.trim()) specs[el.getAttribute("data-spec")] = el.value.trim();
    });
    try {
      const product = await api.post("/deal/products", {
        name,
        category,
        specs,
        qty: Number($("#dQty").value || 1),
        condition: $("#dCond").value,
        platform: $("#dPlatform").value.trim(),
        url: $("#dUrl").value.trim(),
        image: imageData,
        price: Number($("#dPrice").value || 0),
        source: "manual",
        note: $("#dNote").value.trim(),
        confirmed: true,
      });
      const plan = await api.post("/deal/plans", {
        product_id: product.id,
        title: name,
        budget: Number($("#dBudget").value || 0),
        price: Number($("#dPlanPrice").value || $("#dPrice").value || 0),
        scene: $("#dScene").value.trim(),
        reason: $("#dReason").value.trim(),
        urgency: $("#dUrgency").value,
        frequency: $("#dFreq").value,
        existing_items: $("#dExisting").value.trim(),
        alternative: $("#dAlt").value.trim(),
        wait_days: Number($("#dWait").value || 0),
        visibility: $("#dVis").value,
        end_mode: $("#dEndMode").value,
        target_votes: Number($("#dTarget").value || 1),
        deadline: $("#dDeadline").value ? String($("#dDeadline").value).replace("T", " ") + ":00" : "",
      });
      toast("计划已创建，补充报价与证据后即可发布讨论", "success");
      location.hash = `#/life/deal/plan?id=${plan.id}`;
    } catch (e) {
      toast(e.message, "error");
    }
  });
}

/* ============================ 计划详情 ============================ */

export async function renderDealPlan(root, ctx) {
  const id = ctx.params.get("id");
  let data;
  try {
    data = await api.get(`/deal/plans/${id}`);
  } catch (e) {
    root.innerHTML = `<div class="card"><div class="card-title">无法打开计划</div>
      <div class="card-desc">${esc(e.message)}</div>
      <a class="btn btn-ghost btn-sm" href="#/life/deal" style="margin-top:10px">‹ 返回省一省</a></div>`;
    return;
  }
  curPlan = data;
  const p = data.plan, prod = data.product || {};
  const canEdit = data.can_edit;
  const canModify = canEdit && ["undecided", "cooling"].includes(p.decision_status);
  const tabs = [
    ["analysis", "分析建议"],
    ["discuss", "讨论"],
    ["decide", "我的决定"],
  ];
  let curTab = ctx.params.get("tab") || "analysis";
  if (!tabs.some(([k]) => k === curTab)) curTab = "analysis";

  root.innerHTML = `
    <div class="page-head"><div>
      <div class="page-title">${esc(p.title || prod.name || "购买计划")}</div>
      <div class="page-sub">${esc(prod.brand || "")} ${esc(prod.model || "")} · ${CONDITION_LABEL[prod.condition] || "状态待确认"} · 数量 ${prod.qty || 1}</div>
    </div><div class="row">
      ${canModify ? `<button class="btn btn-ghost btn-sm" id="dEdit">修改</button>` : ""}
      <a class="btn btn-ghost btn-sm" href="#/life/deal">‹ 返回省一省</a>
    </div></div>

    <div class="grid grid-4" style="margin-bottom:12px">
      <div class="stat"><div class="stat-num">¥${money(p.price)}</div><div class="stat-label">预计价格</div></div>
      <div class="stat"><div class="stat-num">¥${money(p.budget || 0)}</div><div class="stat-label">预算上限（私密）</div></div>
      <div class="stat"><div class="stat-num">${statusChip(p.discuss_status)}</div><div class="stat-label">讨论状态</div></div>
      <div class="stat"><div class="stat-num">${decisionChip(p.decision_status)}</div><div class="stat-label">个人决定</div></div>
    </div>

    <div class="deal-tabs">${tabs.map(([k, label]) => `<button class="deal-tab ${k === curTab ? "on" : ""}" data-dtab="${k}">${label}</button>`).join("")}</div>
    <div id="dealBody"></div>`;

  root.querySelectorAll("[data-dtab]").forEach((btn) =>
    btn.addEventListener("click", () => {
      curTab = btn.dataset.dtab;
      root.querySelectorAll("[data-dtab]").forEach((x) => x.classList.toggle("on", x === btn));
      drawTab(root, curTab, data);
    })
  );
  drawTab(root, curTab, data);
  root.querySelector("#dEdit")?.addEventListener("click", openEditPlan);

  function openEditPlan() {
    const deadlineValue = p.deadline ? String(p.deadline).replace(" ", "T").slice(0, 16) : "";
    const option = (value, label, current) =>
      `<option value="${value}" ${value === current ? "selected" : ""}>${label}</option>`;
    const currentVis = p.visibility === "public" ? "public" : "private";
    const visOptions = [
      option("private", "仅自己查看", currentVis),
      option("public", "校园公开讨论", currentVis),
    ];
    modal({
      title: "修改购买计划",
      wide: true,
      okText: "保存修改",
      body: `
        <div class="deal-grid2">
          <div class="field"><label>计划标题 *</label><input class="input" id="eTitle" value="${esc(p.title || prod.name || "")}"></div>
          <div class="field"><label>预计价格（元）</label><input class="input" id="ePrice" type="number" min="0" step="0.01" value="${Number(p.price || 0)}"></div>
          <div class="field"><label>预算上限（元）</label><input class="input" id="eBudget" type="number" min="0" step="0.01" value="${Number(p.budget || 0)}"></div>
          <div class="field"><label>可接受等待时间（天）</label><input class="input" id="eWait" type="number" min="0" value="${Number(p.wait_days || 0)}"></div>
          <div class="field"><label>需求紧急程度</label><select class="select" id="eUrgency">
            ${option("urgent", "紧急（现在就要）", p.urgency)}
            ${option("soon", "近期需要", p.urgency)}
            ${option("normal", "一般", p.urgency)}
            ${option("can_wait", "可以等", p.urgency)}
          </select></div>
          <div class="field"><label>预计使用频率</label><select class="select" id="eFreq">
            ${option("daily", "每天", p.frequency)}
            ${option("weekly", "每周", p.frequency)}
            ${option("monthly", "每月", p.frequency)}
            ${option("seldom", "很少", p.frequency)}
          </select></div>
        </div>
        <div class="field"><label>使用场景</label><input class="input" id="eScene" value="${esc(p.scene || "")}"></div>
        <div class="field"><label>购买理由</label><textarea class="input" id="eReason" rows="2">${esc(p.reason || "")}</textarea></div>
        <div class="deal-grid2">
          <div class="field"><label>已有类似物品</label><input class="input" id="eExisting" value="${esc(p.existing_items || "")}"></div>
          <div class="field"><label>替代方案</label><input class="input" id="eAlt" value="${esc(p.alternative || "")}"></div>
        </div>
        <div class="deal-grid2">
          <div class="field"><label>可见范围</label><select class="select" id="eVis">${visOptions.join("")}</select></div>
          <div class="field"><label>讨论结束方式</label><select class="select" id="eEndMode">
            ${option("target_votes", "按有效投票人数", p.end_mode)}
            ${option("deadline", "按截止时间", p.end_mode)}
          </select></div>
          <div class="field" id="eVoteField"><label>目标有效投票人数</label><input class="input" id="eTarget" type="number" min="1" value="${Number(p.target_votes || 5)}"></div>
          <div class="field" id="eDeadlineField"><label>截止时间</label><input class="input" id="eDeadline" type="datetime-local" value="${deadlineValue}"></div>
        </div>`,
      onOk: async () => {
        const $id = (id) => document.getElementById(id);
        const title = $id("eTitle").value.trim();
        if (!title) {
          toast("请填写计划标题", "error");
          return;
        }
        const endMode = $id("eEndMode").value;
        const deadline = $id("eDeadline").value
          ? $id("eDeadline").value.replace("T", " ") + ":00"
          : "";
        if (endMode === "deadline" && !deadline) {
          toast("请选择截止时间", "error");
          return;
        }
        await api.patch(`/deal/plans/${p.id}`, {
          title,
          price: Number($id("ePrice").value || 0),
          budget: Number($id("eBudget").value || 0),
          scene: $id("eScene").value.trim(),
          reason: $id("eReason").value.trim(),
          urgency: $id("eUrgency").value,
          frequency: $id("eFreq").value,
          existing_items: $id("eExisting").value.trim(),
          alternative: $id("eAlt").value.trim(),
          wait_days: Number($id("eWait").value || 0),
          visibility: $id("eVis").value,
          end_mode: endMode,
          target_votes: Number($id("eTarget").value || 1),
          deadline,
        });
        aiPriceCache.clear();
        closeModal();
        toast("计划已更新，正在重新查询参考价格", "success");
        await renderDealPlan(root, ctx);
      },
    });
    const $id = (id) => document.getElementById(id);
    const syncEndMode = () => {
      if (!$id("eVoteField") || !$id("eDeadlineField")) return;
      $id("eVoteField").hidden = $id("eEndMode").value !== "target_votes";
      $id("eDeadlineField").hidden = $id("eEndMode").value !== "deadline";
    };
    $id("eEndMode").addEventListener("change", syncEndMode);
    syncEndMode();
  }

  /* 手动添加报价 */
  async function addQuote() {
    const payload = {
      platform: root.querySelector("#qPlatform")?.value.trim() || "",
      merchant: root.querySelector("#qMerchant")?.value.trim() || "",
      spec: root.querySelector("#qSpec")?.value.trim() || "",
      price: Number(root.querySelector("#qPrice")?.value || 0),
      coupon: Number(root.querySelector("#qCoupon")?.value || 0),
      shipping: Number(root.querySelector("#qShipping")?.value || 0),
      fee: Number(root.querySelector("#qFee")?.value || 0),
      qty: Number(root.querySelector("#qQty")?.value || 1),
      conditions: root.querySelector("#qCond")?.value.trim() || "",
      cost_complete: root.querySelector("#qCostKnown")?.checked ?? true,
      match_level: root.querySelector("#qMatch")?.value || "exact",
      stock: root.querySelector("#qStock")?.value || "unknown",
      url: root.querySelector("#qUrl")?.value.trim() || "",
      source_key: "manual",
    };
    if (!payload.price) return toast("请填写标价", "error");
    try {
      await api.post(`/deal/products/${prod.id}/quotes`, payload);
      toast("报价已记录，并写入价格快照", "success");
      data = await api.get(`/deal/plans/${id}`);
      drawTab(root, curTab, data);
    } catch (e) {
      toast(e.message, "error");
    }
  }
  root.__dealAddQuote = addQuote;
}

function statusChip(s) {
  const map = { draft: "草稿", discussing: "讨论中", ended: "已结束", cancelled: "已取消" };
  return `<span class="tag ${s === "discussing" ? "tag-blue" : s === "ended" ? "tag-green" : ""}">${map[s] || s}</span>`;
}
function decisionChip(s) {
  const map = { undecided: "尚未决定", cooling: "冷静期中", purchased: "已购买", deferred: "已暂缓", abandoned: "已放弃" };
  return `<span class="tag ${s === "cooling" ? "tag-warn" : s === "purchased" ? "tag-green" : ""}">${map[s] || s}</span>`;
}

function drawTab(root, tab, data) {
  const body = root.querySelector("#dealBody");
  if (!body) return;
  if (tab === "discuss") drawDiscuss(root, body, data);
  else if (tab === "decide") drawDecide(root, body, data);
  else drawAnalysis(root, body, data);
}

/* ---------------- 报价比较 ---------------- */

function drawAnalysis(root, body, data) {
  const prod = data.product || {};
  const adv = data.advice;
  body.innerHTML = `
    <div class="card">
      <div class="spread"><div class="card-title">决策建议</div>
        <span class="tag ${adv ? "tag-blue" : ""}">${adv ? esc(adv.label) : "仅计划创建者可查看建议"}</span></div>
      ${adv
        ? `<div class="deal-advice">
            ${(adv.reasons || []).map((r) => `<div class="deal-advice-row">· ${esc(r)}</div>`).join("")}
            <div class="muted" style="margin-top:10px;font-size:11.5px">${esc(adv.disclaimer)}</div>
          </div>`
        : ""}
    </div>

    <div class="card" style="margin-top:16px">
      <div class="spread"><div class="card-title">参考价格</div><span class="tag tag-blue">苏小师</span></div>
      <div class="muted" style="margin-top:4px;font-size:11.5px">基于公开网页摘要估算，价格为参考区间，以下单页为准。</div>
      <div id="planAiPrice"><div class="muted" style="margin-top:8px">正在查询…</div></div>
    </div>`;

  const productName = [prod.brand, prod.name].filter(Boolean).join(" ") || data.plan.title || "";
  loadPlanAiPrice(body, productName, prod.category || "");
}

async function loadPlanAiPrice(body, productName, category = "") {
  const box = body.querySelector("#planAiPrice");
  if (!box) return;
  if (!productName) {
    box.innerHTML = '<div class="muted" style="margin-top:8px">缺少商品名称，无法查价。</div>';
    return;
  }
  if (aiPriceCache.has(productName)) {
    box.innerHTML = aiPriceHtml(aiPriceCache.get(productName));
    return;
  }
  try {
    box.innerHTML = '<div class="muted" style="margin-top:8px">正在查询（约 20–40 秒）…</div>';
    const slow = setTimeout(() => {
      box.innerHTML = '<div class="muted" style="margin-top:8px">正在查询，网络较慢时会多等一会儿…</div>';
    }, 12000);
    const r = await api.post("/deal/ai-price", { product: productName, category });
    clearTimeout(slow);
    aiPriceCache.set(productName, r);
    box.innerHTML = aiPriceHtml(r);
  } catch (e) {
    box.innerHTML = `<div class="muted" style="margin-top:8px;color:#c0392b">${esc(e.message)}</div>`;
  }
}

function aiPriceHtml(r) {
  const fmt = (v) => {
    const n = Number(v || 0);
    return n % 1 === 0 ? String(n) : n.toFixed(2);
  };
  const range = r.low > 0 || r.high > 0 ? `¥${fmt(r.low)} – ¥${fmt(r.high)}` : "暂未获取到明确区间";
  return `<div class="deal-ai-card">
    <div class="spread"><b>${esc(r.product)}</b><span class="tag ${r.searched ? "tag-blue" : "tag-warn"}">${r.degraded ? "参考价" : r.searched ? "已找到公开信息" : "暂无公开信息"}</span></div>
    <div class="deal-ai-range">${range}</div>
    <div style="font-size:12.5px">${esc(r.summary || "")}</div>
    ${r.recommendation ? `<div class="deal-ai-rec">推荐方案：${esc(r.recommendation)}</div>` : ""}
    ${(r.tips || []).length ? `<ul class="deal-ai-tips">${r.tips.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>` : ""}
    ${(r.sources || []).length
      ? `<div class="deal-ai-sources">${r.sources
          .slice(0, 4)
          .map((s) => `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.title || s.url)}</a>`)
          .join("")}</div>`
      : ""}
    <div class="muted" style="margin-top:7px;font-size:10.5px">${esc(r.note || "")}</div>
  </div>`;
}

/* ---------------- 讨论 ---------------- */

async function drawDiscuss(root, body, data) {
  const p = data.plan;
  const votes = data.votes;
  const canVote = data.can_vote;
  body.innerHTML = `
    <div class="card">
      <div class="spread"><div class="card-title">社区讨论</div>${statusChip(p.discuss_status)}</div>
      <div class="muted" style="margin-top:4px;font-size:11.5px">可见范围：${p.visibility === "private" ? "仅自己" : "校园公开"} · 结束方式：${p.end_mode === "target_votes" ? `满 ${p.target_votes} 人有效投票` : `截止 ${esc(p.deadline || "未设置")}`}</div>
      ${p.visibility === "private"
        ? `<div class="empty" style="padding:24px 0"><strong>这是私密计划</strong><div class="muted">不发起公开讨论也能查看价格参考与建议。需要意见时可发起校园公开讨论。</div></div>`
        : `<div class="deal-votes">
            ${Object.entries(votes.counts).map(([k, v]) => `<div class="deal-vote-opt ${data.my_vote === k ? "mine" : ""}" ${canVote ? `data-vote-choice="${k}"` : ""}>
              <b>${v}</b><span>${esc(votes.labels[k] || k)}</span></div>`).join("")}
          </div>
          <div class="deal-tendency">${esc(votes.tendency)}</div>
          <div class="muted" style="font-size:11px;margin-top:4px">社区意见倾向仅供参考。</div>
          ${p.discuss_status === "discussing" && p.user_id !== undefined ? "" : ""}`}
      ${data.can_edit && p.discuss_status === "draft" ? `<button class="btn btn-primary btn-sm" id="dPublish" style="margin-top:10px">发起讨论</button>` : ""}
      ${data.can_edit && p.discuss_status === "discussing" ? `<button class="btn btn-ghost btn-sm" id="dSettle" style="margin-top:10px">结束讨论并结算</button>` : ""}
    </div>`;

  // 投票
  body.querySelectorAll("[data-vote-choice]").forEach((el) =>
    el.addEventListener("click", async () => {
      try {
        await api.post(`/deal/plans/${p.id}/vote`, { choice: el.dataset.voteChoice });
        toast("已记录你的意见", "success");
        curPlan = await api.get(`/deal/plans/${p.id}`);
        drawDiscuss(root, body, curPlan);
      } catch (e) {
        toast(e.message, "error");
      }
    })
  );
  // 发布 / 结束
  body.querySelector("#dPublish")?.addEventListener("click", async () => {
    try {
      await api.post(`/deal/plans/${p.id}/publish`);
      toast("已转为校园公开讨论", "success");
      curPlan = await api.get(`/deal/plans/${p.id}`);
      drawDiscuss(root, body, curPlan);
    } catch (e) {
      toast(e.message, "error");
    }
  });
  body.querySelector("#dSettle")?.addEventListener("click", async () => {
    try {
      const r = await api.post(`/deal/plans/${p.id}/settle`);
      toast(r.already_settled ? "此前已结算" : "已结算，禁止新增投票", "success");
      curPlan = await api.get(`/deal/plans/${p.id}`);
      drawDiscuss(root, body, curPlan);
    } catch (e) {
      toast(e.message, "error");
    }
  });
  body.querySelectorAll("[data-report]").forEach((el) =>
    el.addEventListener("click", async () => {
      const reason = prompt("请填写举报原因");
      if (!reason) return;
      await api.post("/deal/reports", { target_type: "comment", target_id: Number(el.dataset.report), reason });
      toast("已提交举报", "success");
    })
  );
  body.querySelectorAll("[data-reply]").forEach((el) =>
    el.addEventListener("click", async () => {
      const content = prompt("回复内容");
      if (!content) return;
      await api.post(`/deal/plans/${p.id}/comments`, { content, parent_id: Number(el.dataset.reply) });
      curPlan = await api.get(`/deal/plans/${p.id}`);
      drawDiscuss(root, body, curPlan);
    })
  );
}

/* ---------------- 我的决定 ---------------- */

async function drawDecide(root, body, data) {
  const p = data.plan;
  body.innerHTML = `
    <div class="card">
      <div class="spread"><div class="card-title">冷静期</div>${decisionChip(p.decision_status)}</div>
      <div class="muted" style="margin-top:4px;font-size:11.5px">系统不对购买设置强制拦截；冷静期内可以补充理由、查看价格变化、比较替代品。</div>
      ${p.cool_until ? `<div class="deal-cool">冷静期至：${esc(p.cool_until)}</div>` : ""}
      ${data.can_edit && p.decision_status !== "purchased"
        ? `<div class="row" style="margin-top:10px">
            ${[24, 72, 168].map((h) => `<button class="btn btn-ghost btn-sm deal-cool-btn" data-hours="${h}">冷静 ${h >= 24 ? h / 24 + " 天" : h + " 小时"}</button>`).join("")}
          </div>`
        : ""}
    </div>

    <div class="card" style="margin-top:16px">
      <div class="card-title">记录最终决定</div>
      <div class="muted" style="margin-top:4px;font-size:11.5px">投票结果不会替你做决定；这里记录的是你自己的选择。</div>
      ${data.can_edit && p.decision_status !== "purchased"
        ? `<div class="field" style="margin-top:10px"><label>决定理由</label><textarea class="input" id="dDecideReason" rows="2">${esc(p.decide_reason || "")}</textarea></div>
          <div class="row" style="margin-top:10px">
            <button class="btn btn-primary btn-sm deal-decide" data-decision="purchased">买了</button>
            <button class="btn btn-ghost btn-sm deal-decide" data-decision="deferred">暂缓</button>
            <button class="btn btn-ghost btn-sm deal-decide" data-decision="abandoned">放弃购买</button>
          </div>`
        : `<div class="deal-decision-final">${decisionChip(p.decision_status)} ${p.decide_reason ? "· " + esc(p.decide_reason) : ""}</div>`}
    </div>

    </div>`;

  body.querySelectorAll(".deal-cool-btn").forEach((b) =>
    b.addEventListener("click", async () => {
      try {
        await api.post(`/deal/plans/${p.id}/cooling`, { hours: Number(b.dataset.hours) });
        toast("已进入冷静期", "success");
        curPlan = await api.get(`/deal/plans/${p.id}`);
        drawDecide(root, body, curPlan);
      } catch (e) {
        toast(e.message, "error");
      }
    })
  );
  body.querySelectorAll(".deal-decide").forEach((b) =>
    b.addEventListener("click", async () => {
      try {
        await api.post(`/deal/plans/${p.id}/decide`, {
          decision: b.dataset.decision,
          reason: body.querySelector("#dDecideReason")?.value.trim() || "",
        });
        toast("已记录决定", "success");
        curPlan = await api.get(`/deal/plans/${p.id}`);
        drawDecide(root, body, curPlan);
      } catch (e) {
        toast(e.message, "error");
      }
    })
  );
}
