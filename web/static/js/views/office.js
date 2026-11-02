import { api } from "../api.js";
import { esc, modal, toast } from "../ui.js";

// 演示文件：真实格式，覆盖三条解析通路
// patent.pdf = 文本层 PDF（直接解析）；scholarship-cert.pdf = 扫描件（OCR）；scholarship-list.docx = 截图 Word（提取内嵌图片 OCR）
const DEMO_APPS = [
  ["/static/demo/office/patent.pdf", "周天怡-专利受理通知书.pdf"],
  ["/static/demo/office/scholarship-cert.pdf", "2024-2025学年度二等研究生学业奖学金.pdf"],
  ["/static/demo/office/scholarship-list.docx", "2025-2026年度奖学金.docx"],
];

const RULE_DOC_DEMO = ["/static/demo/office/notice.docx", "关于开展2025-2026学年度优秀研究生评选工作的通知.docx"];

async function loadDemoFiles() {
  const out = [];
  for (const [url, name] of DEMO_APPS) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`演示文件加载失败：${name}`);
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
      <div class="tag">OFFICE · AI DOCUMENT</div>
      <h1>办公服务</h1>
      <p>面向申报与审核场景的文档智能处理：自动提取文件里的关键字段与值，或用规则文件批量核查多份文件是否一致。</p>
    </div>
    ${officeTabs("extract")}
    <div id="tabExtract"></div>
    <div id="tabVerify" hidden></div>`;

  const tabExtract = root.querySelector("#tabExtract");
  const tabVerify = root.querySelector("#tabVerify");
  root.querySelectorAll("[data-otab]").forEach((tab) => {
    tab.addEventListener("click", () => {
      root.querySelectorAll("[data-otab]").forEach((x) => x.classList.remove("active"));
      tab.classList.add("active");
      const key = tab.getAttribute("data-otab");
      tabExtract.hidden = key !== "extract";
      tabVerify.hidden = key !== "verify";
      if (key === "verify" && !tabVerify.dataset.inited) {
        tabVerify.dataset.inited = "1";
        renderVerify(tabVerify);
      }
    });
  });
  renderExtract(tabExtract);
}

/* ---------------- Tab 1 · 字段提取 ---------------- */

function renderExtract(box) {
  box.innerHTML = `
    <div class="card">
      <div class="spread"><div class="card-title">上传文件，自动提取关键字段</div><span class="tag tag-blue">PDF / 图片 / docx / xlsx</span></div>
      <div class="card-desc" style="margin-top:4px">扫描件与图片会调用 OCR 识别；文档直接解析文本，再由模型提取重要字段与值。</div>
      <label class="upload-drop" id="exDrop">
        <input type="file" id="exFiles" multiple accept=".pdf,.png,.jpg,.jpeg,.docx,.xlsx,.txt,.md" hidden>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 16V4m0 0l-4 4m4-4l4 4"/><path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/></svg>
        <div class="upload-drop-text">点击选择文件，或拖拽到此处（可多选）</div>
        <div class="muted">支持 PDF / 扫描件 / 图片 / Word / Excel</div>
      </label>
      <div id="exList" style="margin-top:8px"></div>
      <div class="row" style="margin-top:12px">
        <button class="btn btn-primary" id="exRun">开始提取</button>
        <button class="btn btn-ghost" id="exDemo">填入演示文件</button>
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
    btn.textContent = "载入演示文件…";
    try {
      const demo = await loadDemoFiles();
      files.length = 0;
      files.push(...demo);
      renderFiles($("#exList"), files);
      toast("已载入 3 份真实演示文件：专利通知书 PDF（文本层）、奖学金证书 PDF（扫描件）、奖学金名单 Word（截图）", "success");
    } catch (e) {
      toast(e.message, "error");
    } finally {
      btn.disabled = false;
      btn.textContent = "填入演示文件";
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
        <div class="card-desc" style="margin-top:4px">上传评选通知、评选办法、公示名单等，AI 阅读后自动生成核查规则（比对字段与标准值）。</div>
        <label class="upload-drop" id="vfRuleDrop">
          <input type="file" id="vfRule" multiple accept=".docx,.pdf,.png,.jpg,.jpeg,.txt,.md" hidden>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 16V4m0 0l-4 4m4-4l4 4"/><path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/></svg>
          <div class="upload-drop-text">点击选择规则文档，或拖拽到此处</div>
          <div class="muted">如：《优秀研究生评选办法》.pdf · 评选通知.docx</div>
        </label>
        <div id="vfRuleFiles" style="margin-top:8px"></div>
        <div class="row" style="margin-top:10px">
          <button class="btn btn-primary" id="vfBuild">AI 生成核查规则</button>
          <button class="btn btn-ghost btn-sm" id="vfDemo">用演示文档试一试</button>
        </div>
      </div>

      <div class="card">
        <div class="spread"><div class="card-title">AI 生成的核查规则</div><span class="tag tag-gold" id="vfRuleState">待生成</span></div>
        <div class="card-desc" style="margin-top:4px">从规则文档自动抽取比对字段与标准值；可勾选启用、修改标准值后核查。</div>
        <div id="vfRuleView" style="margin-top:10px"><div class="muted">上传规则文档并点击「AI 生成核查规则」后显示</div></div>
      </div>
    </div>

    <div class="card" style="margin-top:14px">
      <div class="spread"><div class="card-title">第 2 步 · 上传待核查文件</div><span class="tag" id="vfCount">0 份</span></div>
      <div class="card-desc" style="margin-top:4px">申请表、证书、名单等（PDF / 图片 / Word），逐份与规则核查；扫描件自动走 OCR。</div>
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
      toast("请先上传规则文档（评选通知 / 办法等）", "error");
      return;
    }
    const btn = $("#vfBuild");
    btn.disabled = true;
    btn.textContent = "AI 阅读文档中…";
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
      btn.textContent = "AI 生成核查规则";
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
      const [url, name] = RULE_DOC_DEMO;
      const res = await fetch(url);
      if (!res.ok) throw new Error("演示规则文档加载失败");
      const blob = await res.blob();
      ruleDocs.length = 0;
      ruleDocs.push(new File([blob], name, { type: blob.type }));
      renderRuleDocs();
      const demo = await loadDemoFiles();
      files.length = 0;
      files.push(...demo);
      $("#vfCount").textContent = `${files.length} 份`;
      renderFiles($("#vfList"), files, () => ($("#vfCount").textContent = `${files.length} 份`));
      toast("已载入评选通知（规则文档）与 3 份真实成果材料，点击「AI 生成核查规则」", "success");
    } catch (e) {
      toast(e.message, "error");
    } finally {
      btn.disabled = false;
      btn.textContent = "用演示文档试一试";
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
    btn.textContent = "核查中（OCR / 模型提取）…";
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