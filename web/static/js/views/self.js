import { api } from "../api.js";
import { esc, modal, toast, today } from "../ui.js";

let pomoTimer = null;

function selfTabs() {
  return `<div class="tabs">
    <a class="tab active" href="#/me/self">自我管理</a>
    <a class="tab" href="#/me/control">自我控制</a>
    <a class="tab" href="#/me">返回我的</a>
  </div>`;
}

export async function render(root, ctx) {
  clearInterval(pomoTimer);
  const [profile, meals, plans, stats] = await Promise.all([
    api.get("/self/fitness/profile"),
    api.get("/self/fitness/meals").catch(() => []),
    api.get("/self/plans"),
    api.get("/self/pomodoro/stats"),
  ]);
  const totalMeals = meals.reduce((sum, m) => sum + m.calories, 0);
  const planItems = plans.flatMap((p) => p.items);
  const doneItems = planItems.filter((i) => i.status === "done").length;

  root.innerHTML = `${selfTabs()}
    <div class="page-head"><div><div class="page-title">自我管理</div><div class="page-sub">番茄钟、健身与饮食、学习计划。健康数据需单独授权，AI 建议不构成医疗诊断。</div></div></div>
    <div class="grid grid-4" style="margin-bottom:16px">
      <div class="stat"><div class="stat-num">${stats.sessions}<span class="unit">次</span></div><div class="stat-label">番茄钟完成</div></div>
      <div class="stat"><div class="stat-num">${stats.minutes}<span class="unit">分钟</span></div><div class="stat-label">累计专注</div></div>
      <div class="stat"><div class="stat-num">${totalMeals}<span class="unit">kcal</span></div><div class="stat-label">今日饮食（估算）</div></div>
      <div class="stat"><div class="stat-num">${doneItems}/${planItems.length}</div><div class="stat-label">计划完成</div></div>
    </div>

    <div class="grid grid-2">
      <div class="card">
        <div class="spread"><div class="card-title">番茄钟</div><span class="tag tag-blue">25 分钟专注</span></div>
        <div style="font-size:44px;font-weight:700;color:var(--primary);letter-spacing:-.03em;margin:12px 0" id="pomoTime">25:00</div>
        <div class="field"><label>本次任务</label><input class="input" id="pomoTask" placeholder="例如：数据结构实验报告"></div>
        <div class="row" style="margin-top:10px">
          <button class="btn btn-primary" id="pomoStart">开始</button>
          <button class="btn btn-ghost" id="pomoPause">暂停</button>
          <button class="btn btn-ghost" id="pomoFinish">完成并记录</button>
        </div>
        <div class="muted" style="margin-top:8px">切到其他页面或标签页会暂停并记录中断，避免“挂机刷时长”。</div>
      </div>

      <div class="card">
        <div class="spread"><div class="card-title">健身档案</div>${profile.consent ? '<span class="tag tag-green">已授权</span>' : '<span class="tag tag-warn">未授权</span>'}</div>
        <div class="grid grid-2" style="margin-top:10px">
          <div class="field"><label>身高（cm）</label><input class="input" id="fHeight" type="number" min="0" value="${profile.height_cm || ""}"></div>
          <div class="field"><label>体重（kg）</label><input class="input" id="fWeight" type="number" min="0" step="0.1" value="${profile.weight_kg || ""}"></div>
          <div class="field"><label>目标</label><select class="select" id="fGoal">${["减脂", "增肌", "保持", "提升体能"].map((x) => `<option ${profile.goal === x ? "selected" : ""}>${x}</option>`).join("")}</select></div>
          <div class="field"><label>活动水平</label><select class="select" id="fActivity">${["久坐", "轻度", "中度", "高强度"].map((x) => `<option ${profile.activity === x ? "selected" : ""}>${x}</option>`).join("")}</select></div>
        </div>
        <div class="field" style="margin-top:10px"><label>健康限制（可不填）</label><input class="input" id="fConstraints" value="${esc(profile.constraints || "")}" placeholder="伤病、过敏、医生建议"></div>
        <label class="row" style="margin-top:10px;font-size:12px;color:var(--text-2)">
          <input type="checkbox" id="fConsent" ${profile.consent ? "checked" : ""}> 我同意将身体信息用于本地饮食分析与健身计划生成，可随时撤回
        </label>
        <div class="muted" style="margin-top:6px">未授权也可以先填写；勾选上方授权并保存后，才能生成 AI 计划与记录饮食。</div>
        <button class="btn btn-primary" id="fSave" style="margin-top:10px">保存档案</button>
      </div>
    </div>

    <div class="grid grid-2" style="margin-top:16px">
      <div class="card">
        <div class="spread"><div class="card-title">饮食记录</div><span class="tag tag-warn">热量为估算值</span></div>
        <div class="toolbar" style="margin-top:10px">
          <select class="select" id="mealType"><option>早餐</option><option selected>午餐</option><option>晚餐</option><option>加餐</option></select>
          <input class="input" id="mealText" placeholder="例如：米饭、鸡胸肉、青菜" style="flex:1">
          <button class="btn btn-primary btn-sm" id="mealAdd">记录</button>
        </div>
        <div id="mealList">${meals.length ? meals.map((m) => `<div class="spread" style="padding:8px 0;border-bottom:1px solid var(--border)"><span>${esc(m.meal_type)} · ${esc(m.description)}</span><span class="muted">${m.calories} kcal</span></div>`).join("") : '<div class="muted" style="margin-top:10px">还没有饮食记录。</div>'}</div>
        <div class="row" style="margin-top:10px"><button class="btn btn-ghost btn-sm" id="mealAnalyze">AI 分析今日饮食</button></div>
        <div id="mealAdvice" style="margin-top:10px"></div>
      </div>

      <div class="card">
        <div class="spread"><div class="card-title">AI 健身计划</div><button class="btn btn-primary btn-sm" id="planGenerate" ${profile.consent ? "" : "disabled"}>生成周计划</button></div>
        <div id="fitnessPlan" style="margin-top:10px">${'<div class="muted">保存并授权身体档案后，可生成一周计划草稿。</div>'}</div>
      </div>
    </div>

    <div class="section-title">学习计划</div>
    <div class="grid grid-2">
      <div class="card">
        <div class="spread"><div class="card-title">我的计划</div><button class="btn btn-ghost btn-sm" id="newPlan">新建计划</button></div>
        ${plans.length
          ? plans.map((p) => `<div style="margin-top:12px"><div class="spread"><strong>${esc(p.title)}</strong><span class="muted">${esc(p.start_date)} 至 ${esc(p.end_date)}</span></div>
              ${p.items.map((i) => `<label class="row" style="margin-top:6px;font-size:12px"><input type="checkbox" data-item="${i.id}" ${i.status === "done" ? "checked" : ""}> <span style="${i.status === "done" ? "text-decoration:line-through;color:var(--text-3)" : ""}">${esc(i.day)} ${esc(i.start_at)} ${esc(i.title)}</span></label>`).join("")}
            </div>`).join("")
          : '<div class="muted" style="margin-top:10px">还没有计划。</div>'}
      </div>
      <div class="card">
        <div class="card-title">使用说明</div>
        <div class="card-desc">番茄钟记录专注时长；健身计划基于身体档案生成草稿；饮食分析只做热量与结构提示，不提供疾病治疗建议。所有健康数据仅本人可见，可随时删除。</div>
        <button class="btn btn-danger btn-sm" id="wipeHealth" style="margin-top:12px">删除我的健康数据</button>
      </div>
    </div>`;

  /* 番茄钟 */
  let remaining = 25 * 60;
  let running = false;
  let interrupted = 0;
  const timeEl = root.querySelector("#pomoTime");
  const drawTime = () => {
    timeEl.textContent = `${String(Math.floor(remaining / 60)).padStart(2, "0")}:${String(remaining % 60).padStart(2, "0")}`;
  };
  const tick = () => {
    remaining -= 1;
    if (remaining <= 0) {
      remaining = 0;
      clearInterval(pomoTimer);
      running = false;
      drawTime();
      toast("专注完成，记得记录", "success");
      return;
    }
    drawTime();
  };
  root.querySelector("#pomoStart").addEventListener("click", () => {
    if (running) return;
    running = true;
    clearInterval(pomoTimer);
    pomoTimer = setInterval(tick, 1000);
  });
  root.querySelector("#pomoPause").addEventListener("click", () => {
    if (!running) return;
    running = false;
    interrupted += 1;
    clearInterval(pomoTimer);
    toast("已暂停");
  });
  root.querySelector("#pomoFinish").addEventListener("click", async () => {
    const used = Math.max(1, Math.round((25 * 60 - remaining) / 60));
    running = false;
    clearInterval(pomoTimer);
    await api.post("/self/pomodoro", { task: root.querySelector("#pomoTask").value || "专注", minutes: used, status: "done" });
    toast(`已记录 ${used} 分钟${interrupted ? `，中断 ${interrupted} 次` : ""}`, "success");
    remaining = 25 * 60;
    drawTime();
  });
  drawTime();

  if (window.__aishidaPomoVisHandler) {
    document.removeEventListener("visibilitychange", window.__aishidaPomoVisHandler);
  }
  window.__aishidaPomoVisHandler = () => {
    if (document.hidden && running) {
      running = false;
      interrupted += 1;
      clearInterval(pomoTimer);
      toast("页面切后台，番茄钟已暂停");
    }
  };
  document.addEventListener("visibilitychange", window.__aishidaPomoVisHandler);

  /* 健身档案 */
  root.querySelector("#fSave").addEventListener("click", async () => {
    try {
      await api.put("/self/fitness/profile", {
        height_cm: Number(root.querySelector("#fHeight").value || 0),
        weight_kg: Number(root.querySelector("#fWeight").value || 0),
        goal: root.querySelector("#fGoal").value,
        activity: root.querySelector("#fActivity").value,
        constraints: root.querySelector("#fConstraints").value,
        consent: root.querySelector("#fConsent").checked,
      });
      toast("健康档案已保存", "success");
      render(root, ctx);
    } catch (e) {
      toast(e.message, "error");
    }
  });

  /* 饮食 */
  root.querySelector("#mealAdd").addEventListener("click", async () => {
    const text = root.querySelector("#mealText").value.trim();
    if (!text) return toast("请填写饮食内容", "error");
    try {
      const res = await api.post("/self/fitness/meals", { meal_type: root.querySelector("#mealType").value, description: text });
      toast(`已记录，估算 ${res.calories} kcal`, "success");
      render(root, ctx);
    } catch (e) {
      toast(e.message, "error");
    }
  });
  root.querySelector("#mealAnalyze").addEventListener("click", async () => {
    try {
      const data = await api.post("/self/fitness/analyze");
      root.querySelector("#mealAdvice").innerHTML = `<div class="draft-card"><div class="card-title">饮食分析（估算）</div>
        ${data.advice.map((a) => `<div class="small" style="margin-top:5px">· ${esc(a)}</div>`).join("")}
        <div class="muted" style="margin-top:8px">${esc(data.disclaimer)}</div></div>`;
    } catch (e) {
      toast(e.message, "error");
    }
  });

  /* 健身计划 */
  root.querySelector("#planGenerate").addEventListener("click", async () => {
    try {
      const data = await api.post("/self/fitness/plan");
      root.querySelector("#fitnessPlan").innerHTML = `<div class="table-wrap"><table><thead><tr><th>日期</th><th>活动</th><th>时长</th></tr></thead><tbody>
        ${data.week.map((d) => `<tr><td>${esc(d.day)}</td><td>${esc(d.activity)}</td><td>${d.minutes} 分钟</td></tr>`).join("")}
      </tbody></table></div><div class="muted" style="margin-top:8px">${esc(data.disclaimer)}</div>`;
    } catch (e) {
      toast(e.message, "error");
    }
  });

  /* 计划 */
  root.querySelectorAll("[data-item]").forEach((box) => {
    box.addEventListener("change", async () => {
      await api.patch(`/self/plan-items/${box.getAttribute("data-item")}`, { status: box.checked ? "done" : "todo" });
      toast("已更新", "success");
    });
  });
  root.querySelector("#newPlan").addEventListener("click", () => {
    modal({
      title: "新建学习计划",
      okText: "创建",
      body: `<div class="grid grid-2">
        <div class="field"><label>计划标题</label><input class="input" name="title" placeholder="例如：期中复习"></div>
        <div class="field"><label>开始日期</label><input class="input" type="date" name="start_date" value="${today()}"></div>
        <div class="field"><label>结束日期</label><input class="input" type="date" name="end_date" value="${today()}"></div>
        <div class="field"><label>第一项任务</label><input class="input" name="item" placeholder="例如：整理错题"></div></div>`,
      onOk: async () => {
        const title = document.querySelector('[name="title"]').value;
        if (!title) throw new Error("请填写计划标题");
        await api.post("/self/plans", {
          title,
          start_date: document.querySelector('[name="start_date"]').value,
          end_date: document.querySelector('[name="end_date"]').value,
          items: [{ title: document.querySelector('[name="item"]').value, day: document.querySelector('[name="start_date"]').value, start_at: "19:00", end_at: "20:00" }],
        });
        toast("已创建", "success");
        document.getElementById("modalRoot").innerHTML = "";
        render(root, ctx);
      },
    });
  });

  root.querySelector("#wipeHealth").addEventListener("click", async () => {
    if (!confirm("删除健康档案与饮食记录？此操作不可恢复。")) return;
    await api.del("/self/fitness");
    toast("健康档案与饮食记录已删除，授权已撤回", "success");
    render(root, ctx);
  });
}