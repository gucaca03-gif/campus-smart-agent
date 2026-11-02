import { api } from "../api.js";
import { esc, toast } from "../ui.js";


const SLIDES = [
  { img: "/static/img/slide-1.jpg", caption: "校门 · 泉山校区主入口" },
  { img: "/static/img/slide-2.jpg", caption: "图书馆 · 自习与借阅" },
  { img: "/static/img/slide-3.jpg", caption: "立春 · 校园初绿" },
  { img: "/static/img/slide-4.jpg", caption: "秋分 · 银杏时节" },
  { img: "/static/img/slide-5.jpg", caption: "体育馆 · 校运会主场" },
  { img: "/static/img/slide-6.jpg", caption: "寒露 · 晨光里的校园" },
  { img: "/static/img/slide-7.jpg", caption: "游泳馆 · 体育课与社团" },
  { img: "/static/img/slide-8.jpg", caption: "立秋 · 金色校园" },
];

const NEWS_IMAGES = [
  "/static/img/slide-1.jpg",
  "/static/img/slide-2.jpg",
  "/static/img/slide-5.jpg",
  "/static/img/slide-4.jpg",
  "/static/img/slide-6.jpg",
  "/static/img/slide-3.jpg",
  "/static/img/slide-8.jpg",
  "/static/img/slide-7.jpg",
];

function initSlider(root) {
  if (window.__slideTimer) clearInterval(window.__slideTimer);
  const slides = root.querySelectorAll(".slide");
  const dots = root.querySelectorAll(".slide-dot");
  const caption = root.querySelector("#slideCaption");
  if (!slides.length) return;
  let cur = 0;
  const go = (i) => {
    cur = (i + slides.length) % slides.length;
    slides.forEach((s, k) => s.classList.toggle("active", k === cur));
    dots.forEach((d, k) => d.classList.toggle("active", k === cur));
    if (caption) caption.textContent = SLIDES[cur].caption;
  };
  dots.forEach((d) =>
    d.addEventListener("click", () => {
      go(Number(d.dataset.slide));
      restart();
    })
  );
  root.querySelector(".slide-prev").addEventListener("click", () => {
    go(cur - 1);
    restart();
  });
  root.querySelector(".slide-next").addEventListener("click", () => {
    go(cur + 1);
    restart();
  });
  const restart = () => {
    clearInterval(window.__slideTimer);
    window.__slideTimer = setInterval(() => go(cur + 1), 5500);
  };
  restart();
}

function photoCard(key, title, sub) {
  const grads = {
    gate: "linear-gradient(160deg,#cfe4f8 0%,#9ec3ea 52%,#7aa6d6 100%)",
    library: "linear-gradient(160deg,#dcebe2 0%,#a9c9b8 52%,#7fae98 100%)",
    field: "linear-gradient(160deg,#f7e7c8 0%,#f0cf94 52%,#db9f63 100%)",
    campus: "linear-gradient(160deg,#e4ddf2 0%,#c3b4dd 52%,#a38fc8 100%)",
  };
  return `<div class="photo-card" style="background:${grads[key] || grads.campus}">
    <div class="photo-card-sun"></div>
    <img src="/static/img/campus-${key}.jpg" alt="${esc(title)}" onerror="this.remove()" loading="lazy">
    <div class="photo-overlay">
      <div class="photo-title">${esc(title)}</div>
      <div class="photo-sub">${esc(sub)}</div>
    </div>
  </div>`;
}

function metricMap(metrics) {
  return Object.fromEntries(metrics.map((m) => [m.key, m]));
}

function metricCard(m, accent = false) {
  if (!m || m.status === "pending") return "";
  return `<div class="stat"><div class="stat-num">${esc(m.value)}<span class="unit">${esc(m.unit)}</span></div>
    <div class="stat-label">${esc(m.label)}</div></div>`;
}

function calendarTimeline(events) {
  const sorted = events
    .filter((e) => e.status !== "inferred")
    .sort((a, b) => a.start.localeCompare(b.start));
  return `<div class="timeline">${sorted
    .map(
      (e) => `<div class="timeline-item">
        <div class="timeline-date">${esc(e.start)}${e.end && e.end !== e.start ? ` 至 ${esc(e.end)}` : ""}</div>
        <div class="timeline-title">${esc(e.title)}</div>
      </div>`
    )
    .join("")}</div>`;
}

function dayOf(dateStr) {
  return (dateStr || "").slice(8, 10);
}

function monthOf(dateStr) {
  return (dateStr || "").slice(5, 7) + "月";
}

export async function render(root, ctx) {
  const data = await api.get("/home");
  const m = metricMap(data.metrics);
  const week = data.week;

  const feat = data.news.filter((n) => n.category !== "通知公告");
  const notices = data.news.filter((n) => n.category === "通知公告");
  const headline = feat[0];
  const rest = feat.slice(1, 6);
  const stats = ["campuses", "colleges", "majors", "teachers", "undergrads", "postgrads"]
    .map((k) => m[k])
    .filter((x) => x && x.status !== "pending");

  root.innerHTML = `
    <section class="hero hero-slider" id="homeSlider">
      <div class="slide-track">
        ${SLIDES.map(
          (s, i) => `<div class="slide ${i === 0 ? "active" : ""}" style="background-image:url('${s.img}')"></div>`
        ).join("")}
      </div>
      <div class="slide-scrim"></div>
      <div class="hero-inner">
        <div class="hero-tag"><span>●</span> 江苏师范大学 · 校园智慧服务</div>
        <h1>${esc(data.school.name)}<br>${esc(data.school.motto)}</h1>
        <p>为师大学子准备的智慧服务——校情速览、场馆预约、校园导航、搭子互助，一站完成。</p>
        <div class="hero-meta">
          <span>${esc(week.term)} · 第 ${week.week} 周</span>
          <span>${esc(week.today)} ${esc(week.weekday)}</span>
          <span>${esc(currentCampus())}</span>
        </div>
      </div>
      <div class="slide-caption" id="slideCaption">${esc(SLIDES[0].caption)}</div>
      <button class="slide-arrow slide-prev" aria-label="上一张">‹</button>
      <button class="slide-arrow slide-next" aria-label="下一张">›</button>
      <div class="slide-dots">
        ${SLIDES.map((s, i) => `<button class="slide-dot ${i === 0 ? "active" : ""}" data-slide="${i}" aria-label="第 ${i + 1} 张"></button>`).join("")}
      </div>
    </section>

    <div class="section-title">师大要闻<a class="sec-more" href="#/work/news">更多 ›</a></div>
    <div class="news-layout">
      ${headline ? `<a class="news-feature" href="#/news/detail?id=${headline.id}">
        <img src="${NEWS_IMAGES[headline.id % NEWS_IMAGES.length]}" alt="" loading="lazy" onerror="this.remove()">
        <div class="nf-body">
          <div class="nf-title">${esc(headline.title)}</div>
          <div class="nf-summary">${esc(headline.summary)}</div>
          <div class="nf-meta"><span>${esc(headline.college)}</span><span>${esc(headline.published_at)}</span></div>
        </div>
      </a>` : ""}
      <div class="news-list">
        ${rest
          .map(
            (n) => `<a class="nl-item" href="#/news/detail?id=${n.id}">
              <img class="nl-thumb" src="${NEWS_IMAGES[n.id % NEWS_IMAGES.length]}" alt="" loading="lazy" onerror="this.remove()">
              <div class="nl-main">
                <div class="nl-title">${esc(n.title)}</div>
                <div class="nl-meta"><span class="tag tag-blue">${esc(n.category)}</span><span>${esc(n.college)}</span><span>${esc(n.published_at)}</span></div>
              </div>
            </a>`
          )
          .join("")}
      </div>
    </div>

    <div class="stats-band">
      ${stats
        .map(
          (x) => `<div class="sb-item">
            <div class="sb-num">${esc(x.value)}<span class="unit">${esc(x.unit || "")}</span></div>
            <div class="sb-label">${esc(x.label)}</div>
          </div>`
        )
        .join("")}
    </div>

    <div class="section-title">学校概况</div>
    <div class="card">
      <div class="card-desc" style="line-height:2">
        江苏师范大学（Jiangsu Normal University，JSNU）是江苏省人民政府与教育部共建高校、江苏高水平大学建设高校，省属公办本科。
        学校校训为“崇德厚学，励志敏行”，现有 ${metricCardText(m, "campuses")} 个校区、${metricCardText(m, "colleges")} 个专业学院（部）、${metricCardText(m, "majors")} 个本科招生专业。
        全日制本科生 ${metricCardText(m, "undergrads")} 余人、博士硕士研究生 ${metricCardText(m, "postgrads")} 余人；
        专任教师 ${metricCardText(m, "teachers")} 人，其中高级职称 ${metricCardText(m, "senior")} 人、博士占比 ${metricCardText(m, "phd_ratio")}。
        建校以来累计向社会输送 35 万余名毕业生。
      </div>
    </div>

    <div class="section-title">校园印象</div>
    <div class="grid grid-4">
      ${[
        ["gate", "校门与主楼", "泉山校区主入口方向"],
        ["library", "图书馆", "自习与借阅"],
        ["field", "运动场", "体育课与校运会"],
        ["campus", "四季校园", "春樱、夏荫、秋叶、冬雪"]
      ].map(([k, title, sub]) => `<div class="card" style="padding:0;overflow:hidden">${photoCard(k, title, sub)}</div>`).join("")}
    </div>

    <div class="section-title">师资与办学成就</div>
    <div class="grid grid-3">
      ${metricCard(m.first_class_majors)}
      ${metricCard(m.first_class_courses)}
      ${metricCard(m.teaching_awards)}
      ${metricCard(m.demo_centers)}
      ${metricCard(m.senior)}
      ${metricCard(m.phd_ratio)}
    </div>

    <div class="grid grid-2" style="margin-top:22px">
      <div class="card">
        <div class="spread"><div class="card-title">通知公告</div><a class="small" href="#/work/news">全部 ›</a></div>
        <div style="margin-top:6px">
          ${notices
            .map(
              (n) => `<a class="notice-item" href="#/news/detail?id=${n.id}">
                <div class="ni-title">${esc(n.title)}</div>
                <div class="ni-meta">${esc(n.college)} · ${esc(n.published_at)}</div>
              </a>`
            )
            .join("")}
        </div>
      </div>
      <div class="card">
        <div class="spread"><div class="card-title">校历节点</div><span class="tag tag-gold">第 ${week.week} 周</span></div>
        <div style="margin-top:10px">${calendarTimeline(data.calendar)}</div>
      </div>
    </div>

    <div class="section-title">校区与地址</div>
    <div class="vr-banner" id="vrBanner" role="button" tabindex="0" aria-label="打开 720 度 VR 校园全景">
      <div class="vr-banner-art">
        <svg viewBox="0 0 120 120" fill="none">
          <defs>
            <filter id="vrGlow" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="2.2" result="b"/>
              <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          </defs>
          <g filter="url(#vrGlow)">
            <circle cx="60" cy="60" r="26" stroke="#8fdcff" stroke-width="1.8"/>
            <ellipse cx="60" cy="60" rx="26" ry="10" stroke="#8fdcff" stroke-width="1.1" opacity=".7"/>
            <ellipse cx="60" cy="60" rx="10" ry="26" stroke="#8fdcff" stroke-width="1.1" opacity=".7"/>
            <path d="M40,44 Q60,32 80,44 M40,76 Q60,88 80,76" stroke="#eaf7ff" stroke-width="1" opacity=".55"/>
          </g>
          <g class="vr-orbit">
            <circle cx="60" cy="60" r="40" stroke="#f0cf94" stroke-width="1.1" stroke-dasharray="5 7" opacity=".85"/>
            <circle cx="100" cy="60" r="2.6" fill="#f0cf94"/>
          </g>
          <g class="vr-orbit vr-orbit-rev">
            <circle cx="60" cy="60" r="49" stroke="#8fdcff" stroke-width="1" stroke-dasharray="3 9" opacity=".5"/>
            <circle cx="60" cy="11" r="2" fill="#aee6ff"/>
          </g>
          <circle cx="18" cy="24" r="1.4" fill="#dff2ff" opacity=".8"/>
          <circle cx="102" cy="30" r="1.1" fill="#dff2ff" opacity=".6"/>
          <circle cx="14" cy="92" r="1.2" fill="#dff2ff" opacity=".6"/>
          <circle cx="98" cy="98" r="1.5" fill="#dff2ff" opacity=".75"/>
        </svg>
      </div>
      <div class="vr-banner-main">
        <div class="vr-banner-tag">720° VR 全景</div>
        <div class="vr-banner-title">云游江苏师大</div>
        <div class="vr-banner-sub">泉山 · 云龙 · 奎园 · 潘安湖，四校区沉浸式漫游</div>
      </div>
      <div class="vr-banner-cta"><span class="vr-play">▸</span>进入全景</div>
    </div>
    <div class="grid grid-4">
      ${data.campuses
        .map(
          (c, i) => `<div class="card campus-card" data-idx="${i}" style="cursor:pointer">
            <div class="spread"><div class="card-title">${esc(c.name)}</div><span class="tag tag-blue">${esc(c.postcode)}</span></div>
            <div class="card-desc" style="margin-top:6px">${esc(c.address)}</div>
            <div class="muted" style="margin-top:6px">${esc(c.note)}</div>
          </div>`
        )
        .join("")}
    </div>

    <div class="card" style="margin-top:22px;background:linear-gradient(135deg,#fff,#f7faff)">
      <div class="card-title">问一问 · 爱师大 AI</div>
      <div class="card-desc">课表、预约、导航、校历，直接开口。AI 先给候选，你确认后才提交。</div>
      <form id="homeAsk" class="row" style="margin-top:12px">
        <input class="input" name="q" style="flex:1" placeholder="例如：明天下午帮我约一个 4 人的研讨教室" autocomplete="off">
        <button class="btn btn-primary" type="submit">提问</button>
      </form>
    </div>

    <div class="foot-note">数据来源于江苏师范大学官网公开页面 · 爱师大校园智慧服务</div>`;

  const vrBanner = root.querySelector("#vrBanner");
  const openVr = () => window.open("https://www.720yun.com/t/79ajOzhvkv8", "_blank", "noopener");
  vrBanner.addEventListener("click", openVr);
  vrBanner.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openVr();
    }
  });

  root.querySelectorAll(".campus-card").forEach((el) => {
    el.addEventListener("click", (e) => {
      if (e.target.closest("a")) return;
      ctx.navigate(`/home/campus?c=${el.dataset.idx}`);
    });
  });

  initSlider(root);

  const form = root.querySelector("#homeAsk");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const q = new FormData(form).get("q").toString().trim();
    if (!q) {
      toast("请先输入问题", "error");
      return;
    }
    ctx.navigate(`/assistant?q=${encodeURIComponent(q)}`);
  });
}

function currentCampus() {
  return localStorage.getItem("campus") || "泉山校区";
}

function metricCardText(m, key) {
  const item = m[key];
  if (!item || item.status === "pending" || !item.value) return "待校方提供";
  return item.value;
}