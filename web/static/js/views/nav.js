import { api } from "../api.js";
import { loadLeaflet, wgs84ToGcj02 } from "../geo.js";
import { esc, toast } from "../ui.js";

const PLACE_META = {
  library: { color: "#1e5eff", icon: "\ud83d\udcda" },
  building: { color: "#7048d8", icon: "\ud83c\udfdb" },
  canteen: { color: "#e88f0a", icon: "\ud83c\udf5c" },
  sports: { color: "#0f9d68", icon: "\u26bd" },
  service: { color: "#e0447c", icon: "\ud83c\udfe5" },
  gate: { color: "#64748b", icon: "\ud83d\udeaa" },
  office: { color: "#0f6f8f", icon: "\ud83c\udfe2" },
  dorm: { color: "#0d9488", icon: "\ud83c\udfe0" },
  other: { color: "#64748b", icon: "\ud83d\udccd" },
};
const PLACE_META_FALLBACK = { color: "#64748b", icon: "\ud83d\udccd" };

function typeMeta(p) {
  return PLACE_META[p.type] || PLACE_META_FALLBACK;
}

function typeSvg(p) {
  return `<span style="font-size:11px;line-height:1">${typeMeta(p).icon}</span>`;
}

export async function renderNav(root, ctx) {
  const places = await api.get("/places");
  const preselect = ctx.params.get("to");
  let L = null;
  let map = null;
  let routeLine = null;
  let meMarker = null;
  let myPos = null;
  let dest = null;
  let origin = null; // {type:"me"} | {type:"place", place}
  let pickMode = "dest";
  let lastRoute = null;
  let markMode = false;
  let markLatLng = null;
  let tempMarker = null;
  const markers = {};

  root.innerHTML = `<div class="page-head"><div><div class="page-title">校园导航</div><div class="page-sub">真实校园地图（高德底图），地点坐标来自 OpenStreetMap 实测。手机上点“定位到我”即可从当前位置规划步行路线。</div></div></div>
    <div class="nav-layout">
      <div class="nav-map-wrap">
        <div id="navMap" class="nav-map"></div>
        <button class="nav-locate-btn" id="locateBtn" title="使用我的位置"><span>◎</span> 定位到我</button>
        <button class="nav-mark-btn" id="markBtn" title="在地图上标记一个新地点"><span>＋</span> 标记地点</button>

        <div class="nav-legend">
          <span class="lg"><i style="background:#1e5eff"></i>图书馆</span>
          <span class="lg"><i style="background:#7048d8"></i>学院楼</span>
          <span class="lg"><i style="background:#e88f0a"></i>食堂</span>
          <span class="lg"><i style="background:#0f9d68"></i>运动场馆</span>
          <span class="lg"><i style="background:#e0447c"></i>服务医疗</span>
          <span class="lg"><i style="background:#0d9488"></i>宿舍</span>
          <span class="lg"><i style="background:#64748b"></i>校门</span>
        </div>
        <div class="map-attr">© 高德地图 · 地点数据 OpenStreetMap</div>
      </div>
      <aside class="nav-side">
        <div class="nav-mark-panel" id="markPanel" hidden>
          <div class="nav-mark-head"><b>标记地点</b><button class="nav-mark-close" id="markClose" type="button" aria-label="关闭">×</button></div>
          <div class="nav-mark-hint" id="markHint">点击地图选择位置，标记可拖动微调</div>
          <div class="nav-mark-coord" id="markCoord">尚未选择位置</div>
          <label class="nav-mark-field"><span>名称</span><input id="markName" maxlength="64" placeholder="例如：34B宿舍楼" autocomplete="off"></label>
          <label class="nav-mark-field"><span>类型</span>
            <select id="markType">
              <option value="dorm">宿舍楼</option>
              <option value="building">教学楼 / 学院楼</option>
              <option value="library">图书馆 / 自习室</option>
              <option value="canteen">食堂</option>
              <option value="sports">运动场馆</option>
              <option value="service">服务设施</option>
              <option value="gate">校门</option>
              <option value="other">其他</option>
            </select>
          </label>
          <label class="nav-mark-field"><span>别名</span><input id="markAlias" maxlength="255" placeholder="可选，多个用逗号分隔" autocomplete="off"></label>
          <label class="nav-mark-field"><span>入口备注</span><input id="markEntrance" maxlength="255" placeholder="可选，例如：东侧门" autocomplete="off"></label>
          <div class="row" style="gap:8px;margin-top:4px">
            <button class="btn btn-primary btn-sm" id="markSave" type="button" disabled>保存地点</button>
            <button class="btn btn-ghost btn-sm" id="markCancel" type="button">取消</button>
          </div>
          <div id="markMine" class="nav-mark-mine"></div>
        </div>
        <div class="card" style="padding:14px">
          <div class="io-box">
            <div class="io-row" id="originRow" title="点击后在下方列表选择出发点，或使用地图上方「定位到我」">
              <span class="io-dot from"></span>
              <input class="io-input" id="originInput" value="我的位置" placeholder="输入起点，如：9号楼" autocomplete="off">
              <button class="io-swap" id="swapBtn" title="交换起点与目的地" disabled>⇅</button>
            </div>
            <div class="io-line"></div>
            <div class="io-row">
              <span class="io-dot to"></span>
              <input class="io-input" id="placeSearch" placeholder="输入目的地或别名，如：9号楼" autocomplete="off">
              <button class="io-locate" id="locateMeBtn" title="定位我的位置">◎</button>
            </div>
            <div class="io-suggest" id="ioSuggest" hidden></div>
          </div>
          <div id="placeResults" class="muted" style="margin:8px 2px">输入起点或目的地名称（支持别名，如 9号楼），从联想中直接选中；也可点地图标记。</div>
          <button class="btn btn-primary" id="routeBtn" style="margin-top:12px;width:100%">规划步行路线</button>
        </div>
        <div id="routeCard"></div>
        <div class="nav-phone-row">
          <button class="nav-phone-btn" id="phoneModeBtn" title="手机导航模式">📱 手机导航模式</button>
          <button class="nav-phone-btn qr" id="phoneQrBtn" title="手机扫码打开本页">扫码手机打开</button>
        </div>
        <div id="navQrBox" class="nav-qr-box" hidden>
          <div id="navQrImg"></div>
          <div class="muted" style="font-size:11px;text-align:center;margin-top:6px">手机连同一 Wi-Fi 扫码打开</div>
        </div>
      </aside>
    </div>
    <div class="nav-phone-overlay" id="phoneOverlay" hidden>
      <div class="phone-frame">
        <div class="phone-notch"></div>
        <div class="phone-screen">
          <div class="pn-head">
            <button class="pn-back" id="pnBack" title="退出">‹</button>
            <b>步行导航</b>
            <button class="pn-refresh" id="pnRefresh" title="刷新路线">↻</button>
          </div>
          <div class="pn-dest">
            <div class="pn-dest-label">目的地</div>
            <div class="pn-dest-name" id="pnDestName">—</div>
          </div>
          <div class="pn-map-visual">
            <div class="pn-pin"><span class="pn-dot"></span></div>
            <div class="pn-path"><i></i></div>
            <div class="pn-meta" id="pnMeta">选择目的地后开始导航</div>
          </div>
          <div class="pn-steps" id="pnSteps"></div>
          <div class="pn-footer">
            <a class="pn-amap" id="pnAmap" href="#" target="_blank" rel="noopener">在高德地图中打开 ↗</a>
            <button class="pn-go" id="pnGo">开始导航</button>
          </div>
        </div>
      </div>
    </div>
  `;

  const search = root.querySelector("#placeSearch");
  const results = root.querySelector("#placeResults");
  const originInput = root.querySelector("#originInput");
  const routeCard = root.querySelector("#routeCard");
  const markBtn = root.querySelector("#markBtn");
  const markPanel = root.querySelector("#markPanel");
  const markHint = root.querySelector("#markHint");
  const markCoord = root.querySelector("#markCoord");
  const markName = root.querySelector("#markName");
  const markType = root.querySelector("#markType");
  const markAlias = root.querySelector("#markAlias");
  const markEntrance = root.querySelector("#markEntrance");
  const markSave = root.querySelector("#markSave");
  const markMine = root.querySelector("#markMine");

  function pinHtml(p, isDest) {
    const stacked = p.name === "808" ? " stacked" : "";
    return `<div class="nav-pin ${isDest ? "dest" : ""}${stacked} ${p.verified ? "" : "unverified"}"><span class="nav-dot"></span><span class="nav-label">${esc(p.name)}</span></div>`;
  }

  function drawPlaceList() {}

  function setDest(p, fly) {
    dest = p;
    Object.entries(markers).forEach(([id, m]) => {
      const place = places.find((x) => String(x.id) === id);
      if (!place) return;
      m.setIcon(
        L.divIcon({
          html: pinHtml(place, place.id === dest.id),
          className: "nav-pin-box",
          iconSize: null,
          iconAnchor: [10, 10],
        })
      );
    });
    if (fly && map) map.flyTo([p.lat, p.lng], 17, { duration: 0.8 });
    results.innerHTML = `目的地：<strong>${esc(p.name)}</strong> · ${esc(p.entrance || "")}`;
    drawPlaceList();
  }

  function setOrigin(p) {
    origin = { type: "place", place: p };
    originInput.value = p.name;
    results.innerHTML = `起点：<strong>${esc(p.name)}</strong> · 目的地：<strong>${esc(dest ? dest.name : "未选择")}</strong>`;
    drawPlaceList();
    const swap = root.querySelector("#swapBtn");
    if (swap) swap.disabled = !(dest && p.id !== dest.id);
  }

  function setOriginMe() {
    if (!myPos) return;
    origin = { type: "me" };
    originInput.value = "我的位置";
    drawPlaceList();
  }

  function pickPlace(p) {
    if (pickMode === "origin") {
      setOrigin(p);
      pickMode = "dest";
    } else {
      setDest(p, true);
    }
  }

  function createPlaceMarker(p) {
    const m = L.marker([p.lat, p.lng], {
      icon: L.divIcon({ html: pinHtml(p, false), className: "nav-pin-box", iconSize: null, iconAnchor: [10, 10] }),
      title: p.name,
    }).addTo(map);
    m.on("click", () => {
      if (markMode) return;
      pickPlace(p);
    });
    markers[String(p.id)] = m;
    return m;
  }

  async function initMap() {
    L = await loadLeaflet();
    map = L.map(root.querySelector("#navMap"), {
      center: [34.2008, 117.1735],
      zoom: 16,
      zoomControl: true,
      attributionControl: false,
    });
    L.tileLayer("https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}", {
      subdomains: ["1", "2", "3", "4"],
      maxZoom: 18,
      minZoom: 14,
    }).addTo(map);
    places.forEach((p) => createPlaceMarker(p));
    map.on("click", (e) => {
      if (!markMode) return;
      setMarkPoint(e.latlng);
    });
    if (preselect) {
      const p =
        places.find((x) => String(x.id) === preselect) ||
        places.find((x) => x.name === preselect) ||
        places.find((x) => String(x.alias || "").split(",").includes(preselect)) ||
        places.find((x) => x.name.includes(preselect) || String(x.alias || "").includes(preselect));
      if (p) {
        setDest(p, true);
        setTimeout(() => plan(), 400);
      }
    }
  }

  function renderMyMarks() {
    if (!markMine) return;
    const mine = places.filter((p) => p.source === "用户标注");
    if (!mine.length) {
      markMine.innerHTML = "";
      return;
    }
    markMine.innerHTML = `<div class="nav-mark-mine-title">我的标注</div>
      ${mine
        .map(
          (p) => `<div class="nav-mark-mine-row"><span class="nav-mark-mine-ico" style="background:${typeMeta(p).color}">${typeSvg(p)}</span><span class="nav-mark-mine-name">${esc(p.name)}</span><button class="nav-mark-del" type="button" data-del-mark="${p.id}" title="删除">×</button></div>`
        )
        .join("")}`;
    markMine.querySelectorAll("[data-del-mark]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.getAttribute("data-del-mark");
        if (!confirm("删除这个自定义地点？")) return;
        try {
          await api.del(`/places/${id}`);
          const idx = places.findIndex((x) => String(x.id) === id);
          if (idx >= 0) places.splice(idx, 1);
          if (markers[id]) {
            markers[id].remove();
            delete markers[id];
          }
          if (dest && String(dest.id) === id) {
            dest = null;
            results.innerHTML = "目的地已删除，请重新选择。";
          }
          renderMyMarks();
          toast("已删除自定义地点", "success");
        } catch (e) {
          toast(e.message, "error");
        }
      });
    });
  }

  function setMarkPoint(latlng, keepHint) {
    markLatLng = { lat: latlng.lat, lng: latlng.lng };
    const icon = L.divIcon({
      html: '<div class="nav-pin-box"><div class="nav-pin dest add"><span class="nav-dot"></span><span class="nav-label">新地点</span></div></div>',
      className: "nav-pin-box",
      iconSize: null,
      iconAnchor: [10, 10],
    });
    if (tempMarker) {
      tempMarker.setLatLng(latlng).setIcon(icon);
    } else {
      tempMarker = L.marker(latlng, { draggable: true, icon, title: "新地点" }).addTo(map);
      tempMarker.on("dragend", () => {
        const ll = tempMarker.getLatLng();
        setMarkPoint(ll, true);
      });
    }
    markCoord.textContent = `已选位置：${Number(latlng.lat).toFixed(6)}, ${Number(latlng.lng).toFixed(6)}`;
    markSave.disabled = false;
    if (!keepHint) markHint.textContent = "位置已选，可拖动标记微调，填写名称后保存";
    markName.focus();
  }

  function setMarkMode(on) {
    markMode = on;
    markBtn.classList.toggle("on", on);
    markPanel.hidden = !on;
    const mapEl = root.querySelector("#navMap");
    if (mapEl) mapEl.classList.toggle("marking", on);
    if (on) {
      markHint.textContent = "点击地图选择位置，标记可拖动微调";
      renderMyMarks();
    } else {
      if (tempMarker) {
        tempMarker.remove();
        tempMarker = null;
      }
      markLatLng = null;
      markCoord.textContent = "尚未选择位置";
      markSave.disabled = true;
      markName.value = "";
      markAlias.value = "";
      markEntrance.value = "";
    }
  }

  async function saveMark() {
    const name = String(markName.value || "").trim();
    if (!markLatLng) {
      toast("请先在地图上点击选择位置", "error");
      return;
    }
    if (!name) {
      toast("请填写地点名称", "error");
      markName.focus();
      return;
    }
    markSave.disabled = true;
    markSave.textContent = "保存中…";
    try {
      const p = await api.post("/places", {
        name,
        alias: String(markAlias.value || "").trim(),
        entrance: String(markEntrance.value || "").trim(),
        type: markType.value,
        lat: markLatLng.lat,
        lng: markLatLng.lng,
      });
      const idx = places.findIndex((x) => String(x.id) === String(p.id));
      if (idx >= 0) places[idx] = p;
      else places.push(p);
      const marker = markers[String(p.id)];
      if (marker) {
        marker.setLatLng([p.lat, p.lng]);
        marker.setIcon(
          L.divIcon({ html: pinHtml(p, false), className: "nav-pin-box", iconSize: null, iconAnchor: [10, 10] })
        );
      } else {
        createPlaceMarker(p);
      }
      setDest(p, true);
      search.value = p.name;
      toast("地点已保存，可直接规划路线", "success");
      setMarkMode(false);
    } catch (e) {
      toast(e.message, "error");
    } finally {
      markSave.textContent = "保存地点";
      markSave.disabled = !markLatLng;
    }
  }

  if (markBtn) markBtn.addEventListener("click", () => setMarkMode(!markMode));
  const markClose = root.querySelector("#markClose");
  const markCancel = root.querySelector("#markCancel");
  if (markClose) markClose.addEventListener("click", () => setMarkMode(false));
  if (markCancel) markCancel.addEventListener("click", () => setMarkMode(false));
  if (markSave) markSave.addEventListener("click", saveMark);

  function locateMe() {
    if (!navigator.geolocation) {
      toast("当前浏览器不支持定位", "error");
      return;
    }
    results.innerHTML = '<span class="muted">正在获取定位…</span>';
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const [lng, lat] = wgs84ToGcj02(pos.coords.longitude, pos.coords.latitude);
        myPos = { lat, lng };
        if (meMarker) meMarker.remove();
        meMarker = L.marker([lat, lng], {
          icon: L.divIcon({
            html: '<div class="nav-pin-box"><div class="nav-pin me"><span class="nav-pin-ico" style="background:linear-gradient(135deg,#17a2ff,#5cc0ff)"></span><span class="nav-label">我的位置</span></div></div>',
            className: "nav-pin-box",
            iconSize: null,
            iconAnchor: [10, 10],
          }),
        }).addTo(map);
        map.flyTo([lat, lng], 17, { duration: 0.8 });
        setOriginMe();
        results.innerHTML = "已定位。选择目的地后点“规划步行路线”。";
        if (dest) plan();
      },
      (err) => {
        const tips = {
          1: "定位权限被拒绝：请在浏览器设置中允许本站使用位置信息",
          2: "暂时获取不到位置，请到空旷处或稍后再试",
          3: "定位超时，请重试",
        };
        results.innerHTML = `<span class="tag tag-warn">定位失败</span> ${tips[err.code] || esc(err.message)}`;
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  }

  async function plan() {
    // 手动输入兜底：未点选候选时按名称/别名精确匹配
    const qDest = String(search.value || "").trim();
    if (qDest && (!dest || qDest !== dest.name)) {
      const qd = qDest.toLowerCase();
      const hit = places.find(
        (p) =>
          p.name.toLowerCase() === qd ||
          String(p.alias || "").toLowerCase().split(",").map((x) => x.trim()).includes(qd)
      );
      if (hit) setDest(hit, true);
    }
    const qOrigin = String(originInput.value || "").trim();
    if (qOrigin && qOrigin !== "我的位置" && (!origin || origin.type !== "place" || origin.place.name !== qOrigin)) {
      const hit = places.find(
        (p) =>
          p.name === qOrigin ||
          String(p.alias || "").split(",").map((x) => x.trim()).includes(qOrigin)
      );
      if (hit) setOrigin(hit);
    }
    if (!dest) {
      toast("请先输入目的地名称并从联想中选择，或点地图标记", "error");
      return;
    }
    const payload = { destination_id: dest.id };
    if (origin && origin.type === "me") {
      if (!myPos) {
        toast("尚未定位成功，请点「定位到我」重试，或点起点框选择出发点", "error");
        return;
      }
      payload.origin_lat = myPos.lat;
      payload.origin_lng = myPos.lng;
    } else if (origin && origin.type === "place") {
      payload.origin_id = origin.place.id;
    } else {
      toast("请先点「定位到我」（起点默认为当前位置），或点起点框选择出发点", "error");
      return;
    }
    try {
      const data = await api.post("/nav/route", payload);
      lastRoute = data;
      if (routeLine) routeLine.remove();
      const latlngs = data.polyline.map((pt) => [pt.lat, pt.lng]);
      routeLine = L.polyline(latlngs, { color: "#1B4B8F", weight: 5, opacity: 0.85, dashArray: "10 7" }).addTo(map);
      map.fitBounds(routeLine.getBounds().pad(0.25));
      routeCard.innerHTML = `<div class="card" style="padding:14px;border-color:#cfdbe8">
        <div class="spread"><div class="card-title">${esc(data.origin.name)} → ${esc(data.destination.name)}</div><span class="tag tag-blue">步行</span></div>
        <div style="font-size:26px;font-weight:700;color:var(--primary);margin:6px 0">${data.minutes}<span style="font-size:12px;color:var(--text-3)"> 分钟</span></div>
        <div class="muted">${data.distance_m} 米</div>
        <div style="margin-top:10px">
          ${data.steps
            .map(
              (stp) => `<div style="padding:4px 0 4px 14px;position:relative;font-size:12px;color:var(--text-2)">
              <span style="position:absolute;left:0;top:9px;width:6px;height:6px;border-radius:50%;background:var(--accent)"></span>${esc(stp)}
            </div>`
            )
            .join("")}
        </div>
        <div class="muted" style="margin-top:8px">${esc(data.notice)}</div>
        <a class="btn btn-soft" style="margin-top:10px" href="${esc(data.amap_url)}" target="_blank" rel="noopener">在高德地图中打开 ↗</a>
      </div>`;
    } catch (e) {
      toast(e.message, "error");
    }
  }

  async function doSearch() {
    const q = search.value.trim();
    if (!q) return;
    const rows = await api.get(`/places/search?q=${encodeURIComponent(q)}`);
    if (!rows.length) {
      results.innerHTML = '<span class="tag tag-warn">未找到</span> 换个叫法试试，或直接点地图上的标记。';
      return;
    }
    results.innerHTML = rows
      .slice(0, 6)
      .map((p) => `<button class="chip nav-chip" data-pick="${p.id}"><span class="nav-place-ico sm" style="background:${typeMeta(p).color}">${typeSvg(p)}</span>${esc(p.name)}</button>`)
      .join("");
    results.querySelectorAll("[data-pick]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const p = places.find((x) => String(x.id) === btn.getAttribute("data-pick"));
        if (p) setDest(p, true);
      });
    });
  }

  search.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (ioSuggest && !ioSuggest.hidden && sugIndex >= 0) return;
      doSearch();
    }
  });
  root.querySelector("#routeBtn").addEventListener("click", plan);
  root.querySelector("#locateBtn").addEventListener("click", locateMe);

  // 起点/目的地交互
  const swapBtn = root.querySelector("#swapBtn");
  if (swapBtn) {
    swapBtn.addEventListener("click", () => {
      if (!dest || !origin || origin.type !== "place") {
        toast("当前起点是「我的位置」，交换无意义", "error");
        return;
      }
      const oldOriginPlace = origin.place;
      setOrigin(dest);
      setDest(oldOriginPlace, false);
    });
  }

  /* ---------- 地点联想：起点与目的地均支持手动输入 ---------- */
  const ioSuggest = root.querySelector("#ioSuggest");
  let sugKind = "dest";
  let sugIndex = -1;

  function matchPlaces(q) {
    const s = String(q || "").trim().toLowerCase();
    if (!s || s === "我的位置") return places.slice(0, 6);
    const scored = places
      .map((p) => {
        const name = String(p.name || "").toLowerCase();
        const aliases = String(p.alias || "").toLowerCase().split(",").map((x) => x.trim()).filter(Boolean);
        const ent = String(p.entrance || "").toLowerCase();
        let score = -1;
        if (name === s || aliases.includes(s)) score = 0;
        else if (name.startsWith(s) || aliases.some((a) => a.startsWith(s))) score = 1;
        else if (name.includes(s) || aliases.some((a) => a.includes(s)) || ent.includes(s)) score = 2;
        return { p, score };
      })
      .filter((x) => x.score >= 0)
      .sort((a, b) => a.score - b.score);
    return scored.slice(0, 8).map((x) => x.p);
  }

  function hideSuggest() {
    if (ioSuggest) ioSuggest.hidden = true;
    sugIndex = -1;
  }

  function chooseSuggest(btn) {
    const key = btn.getAttribute("data-sg");
    if (key === "me") {
      if (!myPos) {
        toast("先点上方「定位到我」获取当前位置，或直接选择具体地点作为起点", "error");
        return;
      }
      setOriginMe();
      results.innerHTML = "起点：<strong>我的位置</strong> · 选择目的地后点「规划步行路线」";
    } else {
      const p = places.find((x) => String(x.id) === key);
      if (!p) return;
      if (sugKind === "origin") {
        setOrigin(p);
        pickMode = "dest";
      } else {
        setDest(p, true);
        search.value = p.name;
      }
    }
    hideSuggest();
  }

  function renderSuggest() {
    if (!ioSuggest) return;
    const input = sugKind === "origin" ? originInput : search;
    const q = String(input.value || "").trim();
    const rows = matchPlaces(q);
    let html = "";
    if (sugKind === "origin") {
      html += `<button type="button" class="io-sg-item" data-sg="me">
        <span class="io-sg-ico me">◎</span>
        <span class="io-sg-main"><b>我的位置</b><i>${myPos ? "使用当前定位作为起点" : "需先点上方「定位到我」"}</i></span></button>`;
    }
    html += rows
      .map(
        (p) => `<button type="button" class="io-sg-item" data-sg="${p.id}">
          <span class="io-sg-ico" style="background:${typeMeta(p).color}">${typeSvg(p)}</span>
          <span class="io-sg-main"><b>${esc(p.name)}</b><i>${esc(p.alias || p.entrance || "")}</i></span>
        </button>`
      )
      .join("");
    if (!rows.length) {
      html += `<div class="io-sg-empty">没有匹配的地点，换个叫法试试（支持别名，如 9号楼 → 静远楼）</div>`;
    }
    ioSuggest.innerHTML = html;
    ioSuggest.hidden = false;
    const items = Array.from(ioSuggest.querySelectorAll("[data-sg]"));
    sugIndex = items.length ? 0 : -1;
    items.forEach((b, i) => b.classList.toggle("active", i === sugIndex));
    items.forEach((btn) => btn.addEventListener("mousedown", (e) => { e.preventDefault(); chooseSuggest(btn); }));
  }

  function bindSuggest(input, kind, isOrigin) {
    input.addEventListener("focus", () => {
      sugKind = kind;
      if (isOrigin && input.value === "我的位置") input.select();
      renderSuggest();
    });
    input.addEventListener("input", () => {
      sugKind = kind;
      renderSuggest();
    });
    input.addEventListener("blur", () => setTimeout(hideSuggest, 150));
    input.addEventListener("keydown", (e) => {
      if (!ioSuggest || ioSuggest.hidden) return;
      const items = Array.from(ioSuggest.querySelectorAll("[data-sg]"));
      if (!items.length) return;
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        sugIndex = (sugIndex + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length;
        items.forEach((b, i) => b.classList.toggle("active", i === sugIndex));
        items[sugIndex].scrollIntoView({ block: "nearest" });
      } else if (e.key === "Enter" && sugIndex >= 0) {
        e.preventDefault();
        chooseSuggest(items[sugIndex]);
      } else if (e.key === "Escape") {
        hideSuggest();
      }
    });
  }
  bindSuggest(originInput, "origin", true);
  bindSuggest(search, "dest", false);

  drawPlaceList();
  await initMap();

  /* ---------- 手机导航模式 + 扫码 ---------- */
  const overlay = root.querySelector("#phoneOverlay");

  function renderPhone() {
    if (!overlay) return;
    const nameEl = root.querySelector("#pnDestName");
    const metaEl = root.querySelector("#pnMeta");
    const stepsEl = root.querySelector("#pnSteps");
    const amapEl = root.querySelector("#pnAmap");
    if (dest) nameEl.textContent = dest.name;
    if (lastRoute) {
      metaEl.innerHTML = `步行 <b>${lastRoute.minutes}</b> 分钟 · <b>${lastRoute.distance_m}</b> 米`;
      stepsEl.innerHTML = lastRoute.steps
        .map((stp) => `<div class="pn-step"><span class="pn-step-dot"></span>${esc(stp)}</div>`)
        .join("");
      amapEl.href = lastRoute.amap_url || "#";
    } else {
      metaEl.textContent = "选择目的地后开始导航";
      stepsEl.innerHTML = "";
    }
  }

  const phoneModeBtn = root.querySelector("#phoneModeBtn");
  if (phoneModeBtn) {
    phoneModeBtn.addEventListener("click", () => {
      renderPhone();
      overlay.hidden = false;
      requestAnimationFrame(() => overlay.classList.add("show"));
    });
  }
  const pnBack = root.querySelector("#pnBack");
  if (pnBack) {
    pnBack.addEventListener("click", () => {
      overlay.classList.remove("show");
      setTimeout(() => (overlay.hidden = true), 240);
    });
  }
  const pnRefresh = root.querySelector("#pnRefresh");
  if (pnRefresh) {
    pnRefresh.addEventListener("click", async () => {
      if (!dest) {
        toast("请先在地图或右侧选择目的地", "error");
        return;
      }
      await plan();
      renderPhone();
    });
  }
  const pnGo = root.querySelector("#pnGo");
  if (pnGo) {
    pnGo.addEventListener("click", () => {
      const amap = root.querySelector("#pnAmap");
      if (amap && amap.href && amap.href !== "#") window.open(amap.href, "_blank", "noopener");
      else toast("还没有路线，先选择目的地", "error");
    });
  }
  const phoneQrBtn = root.querySelector("#phoneQrBtn");
  const qrBox = root.querySelector("#navQrBox");
  if (phoneQrBtn && qrBox) {
    phoneQrBtn.addEventListener("click", () => {
      qrBox.hidden = !qrBox.hidden;
      if (!qrBox.hidden) {
        const img = root.querySelector("#navQrImg");
        img.innerHTML = "";
        if (typeof QRCode === "function") {
          new QRCode(img, { text: window.location.href, width: 168, height: 168, colorDark: "#0b1e3f", colorLight: "#ffffff" });
        } else {
          img.textContent = "二维码组件加载失败";
        }
      }
    });
  }
}