import { api } from "../api.js";
import { esc, modal, toast } from "../ui.js";

function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// 无纸化学生档案演示：虚构学生“陈星宇”，覆盖四条解析通路
// 身份证 PDF = 扫描件（OCR）；高中毕业证 PDF = 文本层；录取通知书 Word = 图片（OCR）；学籍报告 Word = 文本表格
const DEMO_APPS = [
  ["/static/demo/office/archive-id.pdf", "陈星宇-居民身份证（扫描件）.pdf"],
  ["/static/demo/office/archive-diploma.pdf", "陈星宇-高中毕业证书.pdf"],
  ["/static/demo/office/archive-admission.docx", "陈星宇-录取通知书.docx"],
  ["/static/demo/office/archive-enrollment.docx", "陈星宇-学籍在线验证报告.docx"],
];

const RULE_DOC_DEMOS = [
  ["/static/demo/office/archive-notice.docx", "2026级本科新生入学资格复核通知.docx"],
  ["/static/demo/office/archive-policy.pdf", "江苏师范大学学生学籍档案管理办法（节选）.pdf"],
];

async function loadDemoFiles() {
  const out = [];
  for (const [url, name] of DEMO_APPS) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`示例材料加载失败：${name}`);
    const blob = await res.blob();
    out.push(new File([blob], name, { type: blob.type || "application/octet-stream" }));
  }
  return out;
}

function fileBadge(name) {
  const ext = (name.split(".").pop() || "").toLowerCase();
  return `<span class="file-badge fb-${esc(ext)}">${esc(ext || "txt")}</span>`;
}

function fileRow(f, i, onRemove) {
  const ext = (f.name.split(".").pop() || "").toLowerCase();
  const size = f.size > 1024 * 1024 ? `${(f.size / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(f.size / 1024))} KB`;
  return `<div class="app-file">
    ${fileBadge(f.name)}
    <div class="app-file-main" title="${esc(f.name)}"><strong>${esc(f.name)}</strong><span class="muted">${size}</span></div>
    <button class="app-file-act" data-preview="${i}" title="预览">👁</button>
    <button class="app-file-rm" data-rm="${i}" title="移除" data-ext="${esc(ext)}">×</button>
  </div>`;
}

function renderFiles(el, files, onChange) {
  el.innerHTML = files.map((f, i) => fileRow(f, i)).join("");
  el.querySelectorAll("[data-rm]").forEach((btn) => {
    btn.addEventListener("click", () => {
      files.splice(Number(btn.getAttribute("data-rm")), 1);
      renderFiles(el, files, onChange);
      onChange && onChange();
    });
  });
  el.querySelectorAll("[data-preview]").forEach((btn) => {
    btn.addEventListener("click", () => previewFile(files[Number(btn.getAttribute("data-preview"))]));
  });
}

/* ---------------- 文件预览 ---------------- */

function previewFile(file) {
  if (!file) return;
  const ext = (file.name.split(".").pop() || "").toLowerCase();
  if (ext === "pdf") {
    const url = URL.createObjectURL(file);
    modal({
      title: file.name,
      hideOk: true,
      cancelText: "关闭",
      wide: true,
      body: `<iframe class="pv-frame" src="${esc(url)}" title="预览"></iframe>
        <div class="pv-hint muted">PDF 原件预览 · ${Math.max(1, Math.round(file.size / 1024))} KB</div>`,
    });
  } else if (["png", "jpg", "jpeg", "bmp", "webp"].includes(ext)) {
    const url = URL.createObjectURL(file);
    modal({
      title: file.name,
      hideOk: true,
      cancelText: "关闭",
      wide: true,
      body: `<img class="pv-image" src="${esc(url)}" alt="预览">
        <div class="pv-hint muted">图片原件预览</div>`,
    });
  } else if (ext === "docx" || ext === "xlsx") {
    previewOfficeDoc(file);
  } else {
    file.text().then((text) => {
      modal({
        title: file.name,
        hideOk: true,
        cancelText: "关闭",
        wide: true,
        body: `<div class="ex-text">${esc(text.slice(0, 20000))}</div>`,
      });
    });
  }
}

async function previewOfficeDoc(file) {
  toast("正在解析文档…");
  try {
    const fd = new FormData();
    fd.append("file", file);
    const data = await api.upload("/office/preview", fd);
    let body;
    if (data.type === "images" && data.images.length) {
      body = `${data.images.map((src) => `<img class="pv-image" src="${esc(src)}" alt="文档图片">`).join("")}
        <div class="pv-hint muted">Word 内嵌图片（截图型文档）· 共 ${data.images.length} 张</div>`;
    } else if (data.type === "text" && (data.text || "").trim()) {
      body = `<div class="ex-text">${esc(data.text)}</div>
        <div class="pv-hint muted">Word 文本内容预览</div>`;
    } else {
      body = '<div class="empty" style="margin:20px 0"><strong>该文档没有可预览的文本或图片</strong></div>';
    }
    modal({ title: file.name, hideOk: true, cancelText: "关闭", wide: true, body });
  } catch (e) {
    toast(e.message, "error");
  }
}


function bindDrop(box, dropSel, inputSel, onFiles) {
  const drop = box.querySelector(dropSel);
  const input = box.querySelector(inputSel);
  if (!drop || !input) return;
  ["dragover", "dragleave", "drop"].forEach((ev) => {
    drop.addEventListener(ev, (e) => {
      e.preventDefault();
      drop.classList.toggle("dragging", ev === "dragover");
    });
  });
  drop.addEventListener("drop", (e) => {
    if (e.dataTransfer.files.length) {
      e.target.querySelector("input").files = e.dataTransfer.files;
      onFiles([...e.dataTransfer.files]);
    }
  });
  input.addEventListener("change", () => {
    if (input.files.length) onFiles([...input.files]);
    input.value = "";
  });
}

function officeTabs(active) {
  const items = [
    ["chat", "聊天转待办"],
    ["extract", "字段提取"],
    ["verify", "文件核查匹配"],
  ];
  return `<div class="tabs">${items
    .map(([key, label]) => `<a class="tab ${active === key ? "active" : ""}" data-otab="${key}">${label}</a>`)
    .join("")}</div>`;
}

export async function render(root, ctx) {
  root.innerHTML = `

    <div class="detail-hero office-hero">
      <div class="tag">OFFICE · DOCUMENT</div>
      <h1>办公服务</h1>
      <p>面向申报与审核场景的文档处理：提取文件里的关键字段，或用规则批量核查多份文件是否一致。</p>
    </div>
    ${officeTabs("chat")}
    <div id="tabExtract" hidden></div>
    <div id="tabVerify" hidden></div>
    <div id="tabChat"></div>`;

  const tabExtract = root.querySelector("#tabExtract");
  const tabVerify = root.querySelector("#tabVerify");
  const tabChat = root.querySelector("#tabChat");

  root.querySelectorAll("[data-otab]").forEach((tab) => {
    tab.addEventListener("click", () => {
      root.querySelectorAll("[data-otab]").forEach((x) => x.classList.remove("active"));
      tab.classList.add("active");
      const key = tab.getAttribute("data-otab");
      tabExtract.hidden = key !== "extract";
      tabVerify.hidden = key !== "verify";
      tabChat.hidden = key !== "chat";
      if (key === "verify" && !tabVerify.dataset.inited) {
        tabVerify.dataset.inited = "1";
        renderVerify(tabVerify);
      }
      if (key === "chat" && !tabChat.dataset.inited) {
        tabChat.dataset.inited = "1";
        renderChatToTask(tabChat);
      }
    });
  });
  renderChatToTask(tabChat);
  tabChat.dataset.inited = "1";
  renderExtract(tabExtract);
}

/* ---------------- Tab 1 · 字段提取 ---------------- */

function renderExtract(box) {
  box.innerHTML = `
    <div class="card">
      <div class="spread"><div class="card-title">上传文件，提取关键字段</div><span class="tag tag-blue">PDF / 图片 / docx / xlsx</span></div>
      <div class="card-desc" style="margin-top:4px">支持扫描件、图片、Word 与 Excel。</div>
      <label class="upload-drop" id="exDrop">
        <input type="file" id="exFiles" multiple accept=".pdf,.png,.jpg,.jpeg,.docx,.xlsx,.txt,.md" hidden>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 16V4m0 0l-4 4m4-4l4 4"/><path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/></svg>
        <div class="upload-drop-text">点击选择文件，或拖拽到此处（可多选）</div>
        <div class="muted">支持 PDF / 扫描件 / 图片 / Word / Excel</div>
      </label>
      <div id="exList" style="margin-top:8px"></div>
      <div class="row" style="margin-top:12px">
        <button class="btn btn-primary" id="exRun">开始提取</button>
        <button class="btn btn-ghost" id="exDemo">填入档案示例</button>
      </div>
    </div>
    <div id="exResult" style="margin-top:16px"></div>`;

  const files = [];
  const $ = (s) => box.querySelector(s);
  bindDrop(box, "#exDrop", "#exFiles", (picked) => {
    files.push(...picked);
    renderFiles($("#exList"), files);
  });

  $("#exDemo").addEventListener("click", async () => {
    const btn = $("#exDemo");
    btn.disabled = true;
    btn.textContent = "载入示例材料…";
    try {
      const demo = await loadDemoFiles();
      files.length = 0;
      files.push(...demo);
      renderFiles($("#exList"), files);
      toast("已载入 4 份学生电子档案材料：身份证扫描件 PDF、高中毕业证 PDF、录取通知书图片 Word、学籍在线验证报告 Word", "success");
    } catch (e) {
      toast(e.message, "error");
    } finally {
      btn.disabled = false;
      btn.textContent = "填入示例材料";
    }
  });

  $("#exRun").addEventListener("click", async () => {
    if (!files.length) {
      toast("请先上传文件", "error");
      return;
    }
    const btn = $("#exRun");
    btn.disabled = true;
    btn.textContent = "提取中…";
    try {
      const fd = new FormData();
      files.forEach((f) => fd.append("files", f));
      const data = await api.upload("/office/extract-fields", fd);
      $("#exResult").innerHTML = extractResultHtml(data.files);
      $("#exResult").scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (e) {
      toast(e.message, "error");
    } finally {
      btn.disabled = false;
      btn.textContent = "开始提取";
    }
  });
}

function extractResultHtml(files) {
  return files
    .map(
      (f) => `<div class="card" style="margin-bottom:14px">
        <div class="spread">
          <div class="row" style="gap:8px;align-items:center">
            ${fileBadge(f.name)}
            <strong style="font-size:14px">${esc(f.name)}</strong>
          </div>
          <div class="row" style="gap:6px">
            ${f.source === "ocr" ? '<span class="tag tag-gold">OCR 识别</span>' : ""}
            ${f.source === "native" ? '<span class="tag tag-blue">文本层解析</span>' : ""}
            <span class="tag">${f.fields.length} 个字段</span>
          </div>
        </div>
        ${f.error ? `<div class="muted" style="margin-top:10px">${esc(f.error)}</div>` : ""}
        ${
          f.fields.length
            ? `<div class="table-wrap" style="margin-top:12px"><table>
                <thead><tr><th style="width:34%">字段</th><th>值</th></tr></thead>
                <tbody>${f.fields.map((x) => `<tr><td><strong>${esc(x.field)}</strong></td><td>${esc(x.value) || '<span class="muted">—</span>'}</td></tr>`).join("")}</tbody>
              </table></div>`
            : ""
        }
        ${f.text ? `<details style="margin-top:10px"><summary class="small" style="cursor:pointer">查看识别文本</summary>
          <div class="ex-text">${esc(f.text)}</div></details>` : ""}
      </div>`
    )
    .join("");
}

/* ---------------- Tab 2 · 文件核查匹配 ---------------- */

function renderVerify(box) {
  box.innerHTML = `
    <div class="verify-grid">
      <div class="card">
        <div class="spread"><div class="card-title">第 1 步 · 上传规则文档</div><span class="tag tag-blue">Word / PDF / 图片</span></div>
        <div class="card-desc" style="margin-top:4px">上传入学资格复核通知、录取信息核对表、学籍档案管理办法等，自动生成档案核查字段与标准值。</div>
        <label class="upload-drop" id="vfRuleDrop">
          <input type="file" id="vfRule" multiple accept=".docx,.pdf,.png,.jpg,.jpeg,.txt,.md" hidden>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 16V4m0 0l-4 4m4-4l4 4"/><path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/></svg>
          <div class="upload-drop-text">点击选择规则文档，或拖拽到此处</div>
          <div class="muted">如：《学生学籍档案管理办法》.pdf · 新生入学资格复核通知.docx</div>
        </label>
        <div id="vfRuleFiles" style="margin-top:8px"></div>
        <div class="row" style="margin-top:10px">
          <button class="btn btn-primary" id="vfBuild">生成核查规则</button>
          <button class="btn btn-ghost btn-sm" id="vfDemo">用无纸化档案示例</button>
        </div>
      </div>

      <div class="card">
        <div class="spread"><div class="card-title">核查规则</div><span class="tag tag-gold" id="vfRuleState">待生成</span></div>
        <div class="card-desc" style="margin-top:4px">自动抽取比对字段与标准值；可勾选启用、修改标准值后核查。</div>
        <div id="vfRuleView" style="margin-top:10px"><div class="muted">上传规则文档并点击「生成核查规则」后显示</div></div>
      </div>
    </div>

    <div class="card" style="margin-top:14px">
      <div class="spread"><div class="card-title">第 2 步 · 上传待核查文件</div><span class="tag" id="vfCount">0 份</span></div>
      <div class="card-desc" style="margin-top:4px">身份证、高中毕业证、录取通知书、学籍在线验证报告等（PDF / 图片 / Word），逐份与档案规则核查；扫描件自动走 OCR。</div>
      <label class="upload-drop" id="vfFilesDrop">
        <input type="file" id="vfFiles" multiple accept=".pdf,.png,.jpg,.jpeg,.docx,.xlsx,.txt,.md" hidden>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 16V4m0 0l-4 4m4-4l4 4"/><path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/></svg>
        <div class="upload-drop-text">点击选择文件，或拖拽到此处（可多选）</div>
        <div class="muted">支持 docx / pdf / 图片 / xlsx / txt</div>
      </label>
      <div id="vfList" style="margin-top:8px"></div>
      <div class="row" style="margin-top:12px">
        <select class="select" id="vfCombinator" style="width:auto">
          <option value="and">全部字段满足才通过（AND）</option>
          <option value="or">任一字段满足即通过（OR）</option>
        </select>
        <button class="btn btn-primary" id="vfRun">开始核查</button>
      </div>
    </div>
    <div id="vfResult"></div>`;

  const $ = (s) => box.querySelector(s);
  const ruleDocs = [];
  const files = [];
  let rule = null;

  bindDrop(box, "#vfRuleDrop", "#vfRule", (picked) => {
    ruleDocs.push(...picked);
    renderRuleDocs();
  });
  bindDrop(box, "#vfFilesDrop", "#vfFiles", (picked) => {
    files.push(...picked);
    $("#vfCount").textContent = `${files.length} 份`;
    renderFiles($("#vfList"), files, () => ($("#vfCount").textContent = `${files.length} 份`));
  });

  function renderRuleDocs() {
    $("#vfRuleFiles").innerHTML = ruleDocs
      .map((f, i) => `<div class="app-file">${fileBadge(f.name)}
        <div class="app-file-main" title="${esc(f.name)}"><strong>${esc(f.name)}</strong><span class="muted">规则文档</span></div>
        <button class="app-file-act" data-rpreview="${i}" title="预览">👁</button>
        <button class="app-file-rm" data-rrm="${i}">×</button>
      </div>`)
      .join("");
    $("#vfRuleFiles").querySelectorAll("[data-rrm]").forEach((btn) => {
      btn.addEventListener("click", () => {
        ruleDocs.splice(Number(btn.getAttribute("data-rrm")), 1);
        renderRuleDocs();
      });
    });
    $("#vfRuleFiles").querySelectorAll("[data-rpreview]").forEach((btn) => {
      btn.addEventListener("click", () => previewFile(ruleDocs[Number(btn.getAttribute("data-rpreview"))]));
    });
  }

  async function buildRule() {
    if (!ruleDocs.length) {
      toast("请先上传规则文档（复核通知 / 档案管理办法等）", "error");
      return;
    }
    const btn = $("#vfBuild");
    btn.disabled = true;
    btn.textContent = "正在阅读文档…";
    $("#vfRuleState").textContent = "生成中";
    try {
      const fd = new FormData();
      ruleDocs.forEach((f) => fd.append("files", f));
      const data = await api.upload("/office/build-rule", fd);
      rule = data.rule;
      $("#vfRuleState").textContent = `已生成 ${rule.labels.length} 个字段`;
      renderRule();
      toast("核查规则已生成，可编辑标准值后开始核查", "success");
    } catch (e) {
      $("#vfRuleState").textContent = "生成失败";
      toast(e.message, "error");
    } finally {
      btn.disabled = false;
      btn.textContent = "生成核查规则";
    }
  }

  function renderRule() {
    if (!rule) return;
    $("#vfCombinator").value = rule.combinator || "and";
    $("#vfRuleView").innerHTML = `
      ${rule.docs?.length ? `<div class="muted" style="margin-bottom:8px;font-size:11px">已阅读：${rule.docs.map((d) => esc(d.name)).join("、")}</div>` : ""}
      ${rule.labels
        .map((label, i) => {
          const note = (rule.notes && rule.notes[label]) || "";
          return `<div class="cond-row">
            <label class="cond-check"><input type="checkbox" data-vl="${i}" checked></label>
            <div class="cond-main">
              <div class="cond-label">${esc(label)}</div>
              <input class="input cond-std" data-va="${i}" value="${esc(rule.anchor[label] || "")}" placeholder="标准值（核查基准）">
              ${note ? `<div class="cond-src">${esc(note)}</div>` : ""}
            </div>
          </div>`;
        })
        .join("")}`;
    $("#vfRuleView").querySelectorAll("[data-vl]").forEach((cb) => {
      cb.addEventListener("change", () => {
        const label = rule.labels[Number(cb.getAttribute("data-vl"))];
        rule.anchor[label] = cb.checked ? rule.anchor[label] || "" : "";
        rule.anchor[label + "__disabled"] = cb.checked ? "" : "1";
      });
    });
    $("#vfRuleView").querySelectorAll("[data-va]").forEach((inp) => {
      inp.addEventListener("input", () => {
        rule.anchor[rule.labels[Number(inp.getAttribute("data-va"))]] = inp.value;
      });
    });
  }

  $("#vfBuild").addEventListener("click", buildRule);

  $("#vfDemo").addEventListener("click", async () => {
    const btn = $("#vfDemo");
    btn.disabled = true;
    btn.textContent = "载入中…";
    try {
      ruleDocs.length = 0;
      for (const [url, name] of RULE_DOC_DEMOS) {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`示例规则文档加载失败：${name}`);
        const blob = await res.blob();
        ruleDocs.push(new File([blob], name, { type: blob.type }));
      }
      renderRuleDocs();
      const demo = await loadDemoFiles();
      files.length = 0;
      files.push(...demo);
      $("#vfCount").textContent = `${files.length} 份`;
      renderFiles($("#vfList"), files, () => ($("#vfCount").textContent = `${files.length} 份`));
      toast("已载入复核通知、档案管理办法与 4 份学生档案材料，点击「生成核查规则」", "success");
    } catch (e) {
      toast(e.message, "error");
    } finally {
      btn.disabled = false;
      btn.textContent = "用无纸化档案示例";
    }
  });

  $("#vfRun").addEventListener("click", async () => {
    if (!rule) {
      toast("请先上传规则文档并生成核查规则", "error");
      return;
    }
    if (!files.length) {
      toast("请上传待核查文件", "error");
      return;
    }
    const enabledLabels = [];
    const anchor = {};
    rule.labels.forEach((label, i) => {
      const cb = $("#vfRuleView").querySelector(`[data-vl="${i}"]`);
      if (cb && !cb.checked) return;
      const inp = $("#vfRuleView").querySelector(`[data-va="${i}"]`);
      const val = inp ? inp.value.trim() : String(rule.anchor[label] || "").trim();
      enabledLabels.push(label);
      if (val) anchor[label] = val;
    });
    if (!enabledLabels.length) {
      toast("请至少启用一个核查字段", "error");
      return;
    }
    const ruleFile = new File(
      [
        JSON.stringify({
          combinator: $("#vfCombinator").value,
          anchor,
          rules: [{ tags: ["待核查文件"], match_type: "equal", labels: enabledLabels }],
        }),
      ],
      "rule.json",
      { type: "application/json" }
    );
    const btn = $("#vfRun");
    btn.disabled = true;
    btn.textContent = "正在核查…";
    try {
      const fd = new FormData();
      files.forEach((f) => fd.append("files", f));
      fd.append("rule_file", ruleFile);
      const data = await api.upload("/office/verify-match", fd);
      $("#vfResult").innerHTML = verifyResultHtml(data);
      $("#vfResult").scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (e) {
      toast(e.message, "error");
    } finally {
      btn.disabled = false;
      btn.textContent = "开始核查";
    }
  });
}
function verifyResultHtml(data) {
  const s = data.summary;
  return `
    <div class="rv-banner ${s.failed === 0 ? "rv-pass" : "rv-warn"}">
      <div class="rv-verdict">${s.failed === 0 ? "全部通过" : `${s.passed} / ${s.total} 通过`}</div>
      <div class="rv-conclusion">无明确不一致即通过 · ${s.failed} 份存在不一致项 · ${data.combinator.toUpperCase()} 组合 · 锚定值来自${Object.keys(data.anchor).length ? "规则文档" : "首份文件"}</div>
    </div>
    <div class="card" style="padding:0;overflow:auto">
      <table class="grid-table">
        <thead><tr><th class="gt-room-col">文件</th>
          ${data.labels.map((l) => `<th>${esc(l)}<div class="gt-time">锚定：${esc(data.anchor[l] || "—")}</div></th>`).join("")}
          <th>结论</th></tr></thead>
        <tbody>
          ${data.results
            .map(
              (r) => `<tr>
                <td class="gt-room"><strong>${esc(r.name)}</strong>
                  <div class="gt-meta">${r.source === "ocr" ? "OCR 识别" : "文本层"} · ${r.pass_count} 项一致${r.missing_count ? ` · ${r.missing_count} 项未提及` : ""}${r.fail_count ? ` · ${r.fail_count} 项不一致` : ""}</div></td>
                ${r.checks
                  .map((c) => {
                    if (c.verdict === "pass") return `<td class="gt-cell cell-free" title="${esc(c.actual)}">✓</td>`;
                    if (c.verdict === "fail") return `<td class="gt-cell mt-fail" title="实际：${esc(c.actual)}">✗</td>`;
                    return `<td class="gt-cell cell-course" title="材料中未提及该字段（不影响判定）">—</td>`;
                  })
                  .join("")}
                <td class="gt-cell ${r.passed ? "cell-free" : "mt-fail"}">${r.passed ? "通过" : "不一致"}</td>
              </tr>`
            )
            .join("")}
        </tbody>
      </table>
    </div>
    <div class="muted" style="margin-top:10px;font-size:11.5px">判定原则：未提及（—）不否决，仅提示人工参考；只有明确不一致（✗）才判不通过。</div>`;
}

/* ================= 聊天转待办（批量） ================= */

function renderChatToTask(box) {
  box.innerHTML = `
    <div class="card">
      <div class="spread"><div class="card-title">粘贴聊天记录 → 批量转待办</div><span class="tag tag-blue">微信 / QQ</span></div>
      <div class="card-desc" style="margin-top:4px">把群里老师/同学分派给你的消息整段粘贴进来，AI 自动识别多条待办，勾选后批量加入。</div>
      <div class="ct-split">
        <div class="ct-left">
          <textarea class="textarea" id="ctText" style="min-height:130px;margin-top:0" placeholder="例：@张三 明天下午3点前把组会PPT发我邮箱&#10;@李四 周五之前提交报销单到财务处&#10;周四晚上组会记得准备文献汇报"></textarea>
          <div class="row" style="margin-top:10px">
            <button class="btn btn-primary" id="ctRun">解析</button>
            <button class="btn btn-ghost btn-sm" id="ctDemo">填入示例</button>
          </div>
        </div>
        <div id="ctResult" class="ct-right"><div class="muted" style="font-size:12px;line-height:1.6">解析后的待办会显示在这里</div></div>
      </div>
    </div>`;

  const $ = (sel) => box.querySelector(sel);

  $("#ctDemo").addEventListener("click", () => {
    $("#ctText").value = "@张三 明天下午3点前把组会PPT发我邮箱\n@李四 周五之前提交报销单到财务处\n周四晚上组会记得准备文献汇报";
    toast("已填入示例聊天记录", "success");
  });

  $("#ctRun").addEventListener("click", async () => {
    const text = $("#ctText").value.trim();
    if (!text) {
      toast("请先粘贴聊天记录", "error");
      return;
    }
    const btn = $("#ctRun");
    btn.disabled = true;
    btn.textContent = "正在解析…";
    try {
      const data = await api.post("/self/control/tasks/parse-multi", { text });
      const tasks = data.tasks || [];
      if (!tasks.length) {
        toast("未能识别出待办事项", "error");
        return;
      }
      $("#ctResult").innerHTML = `
        <div class="card">
          <div class="spread"><div class="card-title">识别出 ${tasks.length} 条待办</div><span class="tag tag-green">勾选后批量加入</span></div>
          <div style="margin-top:8px">
            ${tasks
              .map(
                (t, i) => `<label class="ct-row">
                  <input type="checkbox" checked data-i="${i}">
                  <div style="min-width:0;flex:1">
                    <div style="font-size:13px;font-weight:600">${esc(t.title)}</div>
                    <div class="muted" style="font-size:11px">${t.date || "日期未定"}${t.time ? " " + t.time : ""}${t.place ? " · " + esc(t.place) : ""} · 约 ${t.estimate_min} 分钟</div>
                  </div>
                </label>`
              )
              .join("")}
          </div>
          <button class="btn btn-primary btn-sm" id="ctSave" style="margin-top:12px">加入待办（勾选项）</button>
        </div>`;
      $("#ctSave").addEventListener("click", async () => {
        const picked = [...box.querySelectorAll("#ctResult input:checked")].map((c) => tasks[Number(c.dataset.i)]);
        if (!picked.length) {
          toast("请至少勾选一条", "error");
          return;
        }
        const btn2 = $("#ctSave");
        btn2.disabled = true;
        let done = 0;
        for (const t of picked) {
          try {
            await api.post("/self/control/tasks", {
              title: t.title,
              plan_date: t.date || today(),
              due_at: t.time ? `${t.date || today()} ${t.time}` : "",
              estimate_min: t.estimate_min || 30,
              priority: "P1",
              source: "message",
              next_action: t.place || "",
            });
            done += 1;
          } catch (e) { /* 单条失败继续 */ }
        }
        toast(`已加入 ${done} 条待办`, "success");
        $("#ctResult").innerHTML = '<div class="empty"><strong>已全部加入待办</strong>可在「今日」与「计划」中查看</div>';
      });
    } catch (e) {
      toast(e.message, "error");
    } finally {
      btn.disabled = false;
      btn.textContent = "解析";
    }
  });
}
