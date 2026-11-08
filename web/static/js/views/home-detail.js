import { api } from "../api.js";
import { esc } from "../ui.js";

const SOURCE_NOTE = "数据来自江苏师范大学官网公开页面；官网未给出的数值标注“暂无公开数据”。";

function campusArt() {
  return `<svg viewBox="0 0 320 200" fill="none">
    <circle cx="250" cy="38" r="56" fill="#fff" opacity=".10"/>
    <path d="M40 168h240" stroke="#fff" stroke-opacity=".35" stroke-width="2"/>
    <path d="M70 168V96l50-34 50 34v72" stroke="#fff" stroke-opacity=".55" stroke-width="2.2"/>
    <path d="M120 62l50 34" stroke="#fff" stroke-opacity=".35" stroke-width="2"/>
    <path d="M96 168v-38h48v38" stroke="#fff" stroke-opacity=".45" stroke-width="2"/>
    <path d="M200 168v-52h40v52" stroke="#fff" stroke-opacity=".35" stroke-width="2"/>
    <circle cx="220" cy="100" r="9" stroke="#fff" stroke-opacity=".4" stroke-width="2"/>
  </svg>`;
}

function metric(metrics, key, fallback = "暂无公开数据") {
  const m = (metrics || []).find((x) => x.key === key);
  if (!m || m.status === "pending" || !m.value) return fallback;
  return `${m.value}${m.unit || ""}`;
}

async function loadHome() {
  return api.get("/home");
}

export async function renderAbout(root) {
  const data = await loadHome();
  const m = data.metrics;
  root.innerHTML = `
    <div class="detail-hero">
      <div class="detail-art">${campusArt()}</div>
      <span class="tag">学校概况</span>
      <h1>${esc(data.school.name)}</h1>
      <p>${esc(data.school.motto)}。${SOURCE_NOTE}</p>
      <div class="row" style="margin-top:14px">
        <a class="btn btn-ghost" href="#/home" style="background:rgba(255,255,255,.14);border-color:rgba(255,255,255,.25);color:#fff">返回首页</a>
        <a class="btn btn-ghost" href="#/home/faculty" style="background:rgba(255,255,255,.14);border-color:rgba(255,255,255,.25);color:#fff">看师资与成就</a>
        <a class="btn btn-ghost" href="#/home/campus" style="background:rgba(255,255,255,.14);border-color:rgba(255,255,255,.25);color:#fff">看校区与 VR</a>
      </div>
    </div>

    <div class="grid grid-4">
      <div class="stat"><div class="stat-num">${metric(m, "campuses")}</div><div class="stat-label">校区</div></div>
      <div class="stat"><div class="stat-num">${metric(m, "colleges")}</div><div class="stat-label">专业学院</div></div>
      <div class="stat"><div class="stat-num">${metric(m, "majors")}</div><div class="stat-label">本科招生专业</div></div>
      <div class="stat"><div class="stat-num">${metric(m, "teachers")}</div><div class="stat-label">专任教师</div></div>
    </div>

    <div class="grid grid-2" style="margin-top:16px">
      <div class="card">
        <div class="card-title">办学层次与规模</div>
        <div class="card-desc" style="margin-top:6px">
          学校现有 ${metric(m, "undergrads")} 全日制本科生、${metric(m, "postgrads")} 博士硕士研究生，
          专任教师 ${metric(m, "teachers")}，其中高级职称 ${metric(m, "senior")}，博士占比 ${metric(m, "phd_ratio")}。
        </div>
        <div class="muted" style="margin-top:8px">以上为官网公开口径，不同年份可能略有差异。</div>
      </div>
      <div class="card">
        <div class="card-title">学科与平台</div>
        <div class="card-desc" style="margin-top:6px">
          ${metric(m, "esi_top1")} 个学科进入 ESI 全球前 1%；${metric(m, "demo_centers")} 个国家级实验教学示范中心；
          ${metric(m, "first_class_majors")} 个国家级一流本科专业建设点。
        </div>
        <a class="btn btn-ghost btn-sm" style="margin-top:10px" href="#/home/faculty">查看完整成就</a>
      </div>
    </div>

    <div class="section-title">四校区</div>
    <div class="grid grid-4">
      ${data.campuses.map((c, i) => `
        <a class="card campus-card" href="#/home/campus?c=${i}">
          <div class="spread"><div class="card-title">${esc(c.name)}</div><span class="tag tag-blue">${esc(c.postcode)}</span></div>
          <div class="card-desc">${esc(c.address)}</div>
          <div class="muted" style="margin-top:6px">${esc(c.note || "—")}</div>
        </a>`).join("")}
    </div>

    <div class="card" style="margin-top:16px">
      <div class="card-title">数据口径</div>
      <div class="card-desc">${SOURCE_NOTE} 占地面积官网未公开数值。</div>
      <div class="row" style="margin-top:10px">
        <a class="btn btn-ghost btn-sm" href="${esc(data.school.source)}" target="_blank" rel="noopener">官网来源 ↗</a>
        <a class="btn btn-ghost btn-sm" href="#/work/news">相关动态</a>
      </div>
    </div>`;
}

export async function renderFaculty(root) {
  const data = await loadHome();
  const m = data.metrics;
  const rows = [
    ["专任教师", metric(m, "teachers"), "官网公开口径"],
    ["高级职称教师", metric(m, "senior"), "正高与副高合计"],
    ["博士占比", metric(m, "phd_ratio"), "专任教师中具有博士学位比例"],
    ["国家级一流本科专业", metric(m, "first_class_majors"), "一流本科专业建设点"],
    ["国家级一流本科课程", metric(m, "first_class_courses"), "线上一流、线上线下混合等"],
    ["国家级教学成果奖", metric(m, "teaching_awards"), "高等教育（本科）教学成果"],
    ["国家级实验教学示范中心", metric(m, "demo_centers"), "实验教学平台"],
    ["ESI 全球前 1% 学科", metric(m, "esi_top1"), "按 ESI 最新数据"],
  ];
  root.innerHTML = `
    <div class="detail-hero">
      <div class="detail-art">${campusArt()}</div>
      <span class="tag">师资与办学成就</span>
      <h1>师资队伍与办学成果</h1>
      <p>只展示官网公开、可核对的指标；没有公开来源的排名、头衔与个人信息不在此展示。</p>
    </div>

    <div class="grid grid-3">
      <div class="stat"><div class="stat-num">${metric(m, "teachers")}</div><div class="stat-label">专任教师</div></div>
      <div class="stat"><div class="stat-num">${metric(m, "senior")}</div><div class="stat-label">高级职称</div></div>
      <div class="stat"><div class="stat-num">${metric(m, "phd_ratio")}</div><div class="stat-label">博士占比</div></div>
    </div>

    <div class="card" style="margin-top:16px">
      <div class="card-title">指标明细</div>
      <div class="table-wrap" style="margin-top:10px">
        <table>
          <thead><tr><th>指标</th><th>数值</th><th>口径说明</th></tr></thead>
          <tbody>
            ${rows.map(([k, v, note]) => `<tr><td>${esc(k)}</td><td><strong>${esc(v)}</strong></td><td class="muted">${esc(note)}</td></tr>`).join("")}
          </tbody>
        </table>
      </div>
    </div>

    <div class="grid grid-2" style="margin-top:16px">
      <div class="card">
        <div class="card-title">教学建设</div>
        <div class="card-desc" style="margin-top:6px">
          ${metric(m, "first_class_majors")} 个国家级一流本科专业建设点、${metric(m, "first_class_courses")} 门国家级一流本科课程、
          ${metric(m, "teaching_awards")} 项国家级教学成果奖、${metric(m, "demo_centers")} 个国家级实验教学示范中心。
        </div>
      </div>
      <div class="card">
        <div class="card-title">学科建设</div>
        <div class="card-desc" style="margin-top:6px">${metric(m, "esi_top1")} 个学科进入 ESI 全球前 1%。学科评估、博士点与重点实验室数量以官网公示为准。</div>
      </div>
    </div>

    <div class="card" style="margin-top:16px">
      <div class="card-title">说明</div>
      <div class="card-desc">
        名师风采请前往官网“名师风采”“出彩师大人”等公开栏目。
      </div>
      <div class="row" style="margin-top:10px">
        <a class="btn btn-ghost btn-sm" href="${esc(data.school.source)}" target="_blank" rel="noopener">官网来源 ↗</a>
        <a class="btn btn-ghost btn-sm" href="#/home/about">返回学校概况</a>
      </div>
    </div>`;
}

const CAMPUS_POS = [
  { x: 150, y: 168, label: "泉山" },
  { x: 236, y: 132, label: "云龙" },
  { x: 214, y: 96, label: "奎园" },
  { x: 270, y: 58, label: "潘安湖" },
];

export async function renderCampus(root, ctx) {
  const data = await loadHome();
  const campuses = data.campuses;
  const idx = Math.max(0, Math.min(campuses.length - 1, Number(ctx?.params?.get("c")) || 0));
  const active = campuses[idx];

  root.innerHTML = `
    <div class="page-head">
      <div>
        <div class="page-title">校区与 VR 全景</div>
        <div class="page-sub">四校区地址来自官网；示意地图只表达相对方位。</div>
      </div>
      <a class="btn btn-ghost btn-sm" href="#/home">返回首页</a>
    </div>

    <div class="row" style="margin-bottom:14px">
      ${campuses.map((c, i) => `<a class="btn ${i === idx ? "btn-primary" : "btn-ghost"} btn-sm" href="#/home/campus?c=${i}">${esc(c.name)}</a>`).join("")}
      <a class="vr-btn" href="https://www.720yun.com/t/79ajOzhvkv8" target="_blank" rel="noopener" style="margin-left:auto">VR 全景 ↗</a>
    </div>

    <div class="grid grid-2">
      <div class="card">
        <div class="spread"><div class="card-title">${esc(active.name)}</div><span class="tag tag-blue">${esc(active.postcode)}</span></div>
        <div class="card-desc" style="margin-top:8px">${esc(active.address)}</div>
        <div class="muted" style="margin-top:6px">${esc(active.note || "—")}</div>
        <div class="row" style="margin-top:12px">
          <a class="btn btn-primary btn-sm" href="#/life/nav?to=${encodeURIComponent(active.name)}">站内导航</a>
          <a class="btn btn-ghost btn-sm" href="https://www.720yun.com/t/79ajOzhvkv8" target="_blank" rel="noopener">打开 VR 全景</a>
        </div>
        <div class="muted" style="margin-top:10px;font-size:11px">VR 全景来自学校公开入口。</div>
      </div>

      <div class="card">
        <div class="spread"><div class="card-title">四校区相对位置</div><span class="tag tag-warn">示意图</span></div>
        <div class="campus-map" style="margin-top:10px">
          <svg viewBox="0 0 320 210">
            <path d="M28 182c40-16 62-38 84-62s48-38 82-44 46-22 62-38" stroke="#cfdced" stroke-width="2" fill="none" stroke-dasharray="5 5"/>
            <path d="M22 150c40 6 70 18 96 34" stroke="#dbe6f4" stroke-width="10" fill="none" stroke-linecap="round"/>
            ${CAMPUS_POS.map((p, i) => `
              <g class="map-pin ${i === idx ? "active" : ""}" data-i="${i}" style="cursor:pointer">
                <circle cx="${p.x}" cy="${p.y}" r="${i === idx ? 7 : 5}"/>
                <text x="${p.x + 10}" y="${p.y + 4}">${esc(campuses[i]?.name?.replace("校区", "") || p.label)}</text>
              </g>`).join("")}
            <text x="24" y="30" style="font-size:10px;fill:#9aa7b8">徐州 · 相对方位示意</text>
          </svg>
        </div>
        <div class="muted" style="margin-top:8px;font-size:11px">点击圆点切换校区；精确路线请用校园导航或地图服务。</div>
      </div>
    </div>

    <div class="card" style="margin-top:16px">
      <div class="card-title">校区差异对使用的影响</div>
      <div class="card-desc" style="margin-top:6px">
        跨校区预约会预留通勤与准备时间；上课时段默认不可排任务；图书馆闭馆与宿舍熄灯只做提示，不强制锁定。
      </div>
      <div class="row" style="margin-top:10px">
        <a class="btn btn-ghost btn-sm" href="#/me/control">去自我控制</a>
      </div>
    </div>`;

  root.querySelectorAll(".map-pin").forEach((el) => {
    el.addEventListener("click", () => {
      location.hash = `#/home/campus?c=${el.getAttribute("data-i")}`;
    });
  });
}