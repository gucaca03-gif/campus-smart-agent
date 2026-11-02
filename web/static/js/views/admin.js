import { api } from "../api.js";
import { esc, modal, statusBadge, toast } from "../ui.js";

export async function render(root, ctx) {
  const [summary, pending] = await Promise.all([
    api.get("/admin/summary"),
    api.get("/admin/bookings?status=pending_approval"),
  ]);
  root.innerHTML = `
    <div class="page-head"><div><div class="page-title">管理后台</div><div class="page-sub">资源审批与数据概览。演示后台未接真实鉴权；正式环境需管理员角色与服务端权限校验。</div></div>
      <span class="tag tag-warn">演示后台</span></div>
    <div class="grid grid-6">
      <div class="stat"><div class="stat-num">${summary.bookings}</div><div class="stat-label">预约总数</div></div>
      <div class="stat"><div class="stat-num">${summary.pending}</div><div class="stat-label">待审批</div></div>
      <div class="stat"><div class="stat-num">${summary.buddy_posts}</div><div class="stat-label">搭子帖</div></div>
      <div class="stat"><div class="stat-num">${summary.deals}</div><div class="stat-label">省钱帖</div></div>
      <div class="stat"><div class="stat-num">${summary.errands}</div><div class="stat-label">互助帖</div></div>
      <div class="stat"><div class="stat-num">${summary.news}</div><div class="stat-label">信息动态</div></div>
    </div>

    <div class="section-title">待审批预约</div>
    <div class="card">
      ${pending.length
        ? `<div class="table-wrap"><table><thead><tr><th>资源</th><th>日期/时段</th><th>申请人</th><th>人数</th><th>用途</th><th>操作</th></tr></thead><tbody>
            ${pending.map((b) => `<tr><td><strong>${esc(b.resource_name)}</strong><div class="muted">${esc(b.room)}</div></td>
              <td>${esc(b.date)}<br><span class="muted">${esc(b.start_at)}–${esc(b.end_at)}</span></td>
              <td>师大同学</td><td>${b.people}</td><td>${esc(b.purpose)}</td>
              <td><div class="row"><button class="btn btn-primary btn-sm" data-approve="${b.id}">通过</button><button class="btn btn-danger btn-sm" data-reject="${b.id}">拒绝</button></div></td></tr>`).join("")}
          </tbody></table></div>`
        : '<div class="empty"><strong>没有待审批预约</strong>审批结果会出现在“我的预约”</div>'}
    </div>

    <div class="grid grid-2" style="margin-top:16px">
      <div class="card"><div class="card-title">数据与内容管理</div>
        <div class="card-desc">正式后台应支持：校情/校历版本、实验室/教室/座位与开放规则、信息动态审核与下架、资源共享外链可用性、举报处理、模型/地图配置与审计。</div></div>
      <div class="card"><div class="card-title">权限边界</div>
        <div class="card-desc">演示环境使用固定账号；正式环境必须服务端鉴权，学生不能通过改 URL 或参数获得管理员权限。所有审批、驳回、删除需留操作日志。</div></div>
    </div>`;

  root.querySelectorAll("[data-approve]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      await api.post(`/bookings/${btn.getAttribute("data-approve")}/decide`, { approve: true });
      toast("已通过", "success");
      render(root, ctx);
    });
  });
  root.querySelectorAll("[data-reject]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      modal({
        title: "拒绝预约",
        okText: "确认拒绝",
        body: '<div class="field"><label>原因（可选）</label><textarea class="textarea" id="rejectReason" placeholder="例如：设备维护"></textarea></div>',
        onOk: async () => {
          const reason = document.getElementById("rejectReason").value;
          await api.post(`/bookings/${btn.getAttribute("data-reject")}/decide`, { approve: false, comment: reason });
          toast("已拒绝并释放时段", "success");
          document.getElementById("modalRoot").innerHTML = "";
          render(root, ctx);
        },
      });
    });
  });
}