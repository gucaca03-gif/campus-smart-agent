import { api } from "../api.js";
import { esc, money, statusBadge, toast } from "../ui.js";

export async function render(root, ctx) {
  const [me, bookings, savings, stats, profile] = await Promise.all([
    api.get("/me"),
    api.get("/bookings/my"),
    api.get("/savings/summary"),
    api.get("/self/pomodoro/stats"),
    api.get("/self/fitness/profile"),
  ]);

  root.innerHTML = `
    <div class="page-head"><div><div class="page-title">我的</div><div class="page-sub">演示账号；正式环境需接入学校统一身份认证并按角色授权。</div></div>
      <span class="tag tag-warn">演示账号</span></div>

    <div class="card" style="display:flex;gap:16px;align-items:center;flex-wrap:wrap">
      <div class="avatar" style="width:52px;height:52px;font-size:18px">师</div>
      <div style="flex:1"><div class="card-title">${esc(me.name)}</div>
        <div class="muted">${esc(me.college)} · ${esc(me.campus)} · ${esc(me.role)}</div>
        <div class="muted" style="margin-top:4px">${esc(me.note)}</div></div>
      <div class="row"><a class="btn btn-ghost btn-sm" href="#/assistant">问 AI</a><a class="btn btn-ghost btn-sm" href="#/work">去预约</a></div>
    </div>

    <div class="grid grid-4" style="margin-top:16px">
      <div class="stat"><div class="stat-num">${bookings.length}<span class="unit">条</span></div><div class="stat-label">我的预约</div></div>
      <div class="stat"><div class="stat-num">¥${money(savings.saved)}</div><div class="stat-label">累计节省</div></div>
      <div class="stat"><div class="stat-num">${stats.minutes}<span class="unit">分钟</span></div><div class="stat-label">专注时长</div></div>
      <div class="stat"><div class="stat-num">${profile.consent ? "已授权" : "未授权"}</div><div class="stat-label">健康数据</div></div>
    </div>

    <div class="section-title">我的预约</div>
    <div class="card">
      ${bookings.length
        ? `<div class="table-wrap"><table><thead><tr><th>资源</th><th>日期</th><th>时段</th><th>人数</th><th>状态</th><th>预约号</th><th>操作</th></tr></thead><tbody>
            ${bookings.map((b) => `<tr>
              <td><strong>${esc(b.resource_name)}</strong><div class="muted">${esc(b.room)}</div></td>
              <td>${esc(b.date)}</td><td>${esc(b.start_at)}–${esc(b.end_at)}</td><td>${b.people}</td>
              <td>${statusBadge(b.status)}</td><td class="muted">${esc(b.code || "—")}</td>
              <td><div class="row">
                ${b.status === "confirmed" ? `<button class="btn btn-ghost btn-sm" data-checkin="${b.id}">签到</button>` : ""}
                ${["pending_approval", "confirmed"].includes(b.status) ? `<button class="btn btn-danger btn-sm" data-cancel="${b.id}">取消</button>` : ""}
              </div></td></tr>`).join("")}
          </tbody></table></div>`
        : '<div class="empty"><strong>还没有预约</strong>去实验室、空教室或图书馆看看</div>'}
    </div>

    <div class="section-title">自我管理与自我控制</div>
    <div class="grid grid-2">
      <a class="card" href="#/me/self">
        <div class="spread"><div class="card-title">自我管理</div><span class="tag tag-blue">健康 · 计划</span></div>
        <div class="muted" style="margin-top:6px">健身档案、饮食记录、AI 周计划与学习计划；健康数据需单独授权。</div>
        <div class="small" style="margin-top:8px">进入自我管理 →</div>
      </a>
      <a class="card" href="#/me/control">
        <div class="spread"><div class="card-title">自我控制</div><span class="tag tag-green">任务 · 专注 · 复盘</span></div>
        <div class="muted" style="margin-top:6px">今日任务与日程、消息转待办、专注计时、随记、周复盘、成就与皮肤。</div>
        <div class="small" style="margin-top:8px">进入自我控制 →</div>
      </a>
    </div>

    <div class="section-title">我的记录</div>
    <div class="grid grid-3">
      <a class="card" href="#/life/deal"><div class="card-title">省钱记录</div><div class="muted">已放弃 ${savings.abandoned_count} 次 · 待决定 ${savings.pending_count} 件</div></a>
      <a class="card" href="#/life/buddy"><div class="card-title">我的搭子</div><div class="muted">查看我发布的搭子帖与状态</div></a>
      <a class="card" href="#/me/self"><div class="card-title">健康与计划</div><div class="muted">${profile.consent ? "已授权身体档案" : "尚未授权身体档案"}</div></a>
    </div>

    <div class="card" style="margin-top:16px;border-color:#efd9ae;background:#fffaf0">
      <div class="card-title">数据与隐私</div>
      <div class="card-desc">本演示的健康数据、位置与联系方式均保存在本地 SQLite；正式环境应接入学校统一身份认证、最小化采集、单独授权、支持导出与删除。健康建议不构成医疗诊断。</div>
    </div>`;

  root.querySelectorAll("[data-cancel]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (!confirm("确定取消这条预约？")) return;
      await api.post(`/bookings/${btn.getAttribute("data-cancel")}/cancel`);
      toast("已取消", "success");
      render(root, ctx);
    });
  });
  root.querySelectorAll("[data-checkin]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      await api.post(`/bookings/${btn.getAttribute("data-checkin")}/checkin`);
      toast("签到成功", "success");
      render(root, ctx);
    });
  });
}