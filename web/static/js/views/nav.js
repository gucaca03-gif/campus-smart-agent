import { api } from "../api.js";
import { loadLeaflet, wgs84ToGcj02 } from "../geo.js";
import { esc, toast } from "../ui.js";
import { lifeTabs } from "./life.js";

export async function renderNav(root, ctx) {
  const places = await api.get("/places");
  const preselect = ctx.params.get("to");
  let L = null;
  let map = null;
  let routeLine = null;
  let meMarker = null;
  let myPos = null;
  let dest = null;
  const markers = {};

  root.innerHTML = `${lifeTabs("nav")}
    <div class="page-head"><div><div class="page-title">校园导航</div><div class="page-sub">真实校园地图（高德底图），地点坐标来自 OpenStreetMap 实测。手机上点“定位到我”即可从当前位置规划步行路线。</div></div></div>
    <div class="nav-layout">
      <div class="nav-map-wrap">
        <div id="navMap" class="nav-map"></div>
        <button class="nav-locate-btn" id="locateBtn" title="使用我的位置"><span>◎</span> 定位到我</button>
        <div class="map-attr">© 高德地图 · 地点数据 OpenStreetMap</div>
      </div>
      <aside class="nav-side">
        <div class="card" style="padding:14px">
          <div class="field"><label>目的地</label><input class="input" id="placeSearch" placeholder="搜索地点或别名，如：图书馆、外院、七餐"></div>
          <div id="placeResults" class="muted" style="margin-top:8px">点击地图标记或下方地点设为目的地。</div>
          <div class="field" style="margin-top:10px"><label>起点</label>
            <select class="select" id="originSelect">
              <option value="">东门（默认）</option>
              ${places.map((p) => `<option value="${p.id}">${esc(p.name)}</option>`).join("")}
            </select>
          </div>
          <button class="btn btn-primary" id="routeBtn" style="margin-top:12px;width:100%">规划步行路线</button>
        </div>
        <div class="card" style="padding:14px;flex:1;overflow:auto">
          <div class="card-title">校园地点</div>
          <div id="placeList" class="nav-place-list"></div>
        </div>
        <div id="routeCard"></div>
      </aside>
    </div>`;

  const search = root.querySelector("#placeSearch");
  const results = root.querySelector("#placeResults");
  const originSelect = root.querySelector("#originSelect");
  const routeCard = root.querySelector("#routeCard");

  function pinHtml(p, isDest) {
    return `<div class="nav-pin ${isDest ? "dest" : ""} ${p.verified ? "" : "unverified"}"><span class="nav-dot"></span><span class="nav-label">${esc(p.name)}</span></div>`;
  }

  function drawPlaceList() {
    const list = root.querySelector("#placeList");
    list.innerHTML = places
      .map(
        (p) => `<button class="nav-place-item ${dest && dest.id === p.id ? "active" : ""}" data-pick="${p.id}">
          <span class="nav-place-name">${esc(p.name)}${p.verified ? "" : ' <span class="tag tag-warn">待核验</span>'}</span>
          <span class="muted">${esc(p.entrance || "")}</span>
        </button>`
      )
      .join("");
    list.querySelectorAll("[data-pick]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const p = places.find((x) => String(x.id) === btn.getAttribute("data-pick"));
        if (p) setDest(p, true);
      });
    });
  }

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
    results.innerHTML = `目的地：<strong>${esc(p.name)}</strong>${p.verified ? "" : ' <span class="tag tag-warn">待核验</span>'} · ${esc(p.entrance || "")}`;
    drawPlaceList();
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
    places.forEach((p) => {
      const m = L.marker([p.lat, p.lng], {
        icon: L.divIcon({ html: pinHtml(p, false), className: "nav-pin-box", iconSize: null, iconAnchor: [10, 10] }),
        title: p.name,
      }).addTo(map);
      m.on("click", () => setDest(p, false));
      markers[String(p.id)] = m;
    });
    if (preselect) {
      const p = places.find((x) => String(x.id) === preselect);
      if (p) {
        setDest(p, true);
        setTimeout(() => plan(), 400);
      }
    }
  }

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
            html: '<div class="nav-pin me"><span class="nav-dot"></span><span class="nav-label">我的位置</span></div>',
            className: "nav-pin-box",
            iconSize: null,
            iconAnchor: [10, 10],
          }),
        }).addTo(map);
        map.flyTo([lat, lng], 17, { duration: 0.8 });
        if (!originSelect.querySelector('option[value="me"]')) {
          originSelect.insertAdjacentHTML("afterbegin", '<option value="me">◎ 我的位置（刚定位）</option>');
        }
        originSelect.value = "me";
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
    if (!dest) {
      toast("请先选择目的地（点地图标记或右侧列表）", "error");
      return;
    }
    const originValue = originSelect.value;
    const payload = { destination_id: dest.id };
    if (originValue === "me") {
      if (!myPos) {
        toast("尚未定位，请先点“定位到我”", "error");
        return;
      }
      payload.origin_lat = myPos.lat;
      payload.origin_lng = myPos.lng;
    } else if (originValue) {
      payload.origin_id = Number(originValue);
    }
    try {
      const data = await api.post("/nav/route", payload);
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
      .map((p) => `<button class="chip" data-pick="${p.id}">${esc(p.name)}${p.verified ? "" : "（待核验）"}</button>`)
      .join("");
    results.querySelectorAll("[data-pick]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const p = places.find((x) => String(x.id) === btn.getAttribute("data-pick"));
        if (p) setDest(p, true);
      });
    });
  }

  search.addEventListener("input", () => {
    clearTimeout(search._timer);
    search._timer = setTimeout(doSearch, 260);
  });
  search.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      doSearch();
    }
  });
  root.querySelector("#routeBtn").addEventListener("click", plan);
  root.querySelector("#locateBtn").addEventListener("click", locateMe);

  drawPlaceList();
  await initMap();
}