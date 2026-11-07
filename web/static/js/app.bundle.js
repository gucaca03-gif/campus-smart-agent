var ps=Object.defineProperty;var us=(e,a,s)=>()=>{if(s)throw s[0];try{return e&&(a=e(e=0)),a}catch(t){throw s=[t],t}};var vs=(e,a)=>{for(var s in a)ps(e,s,{get:a[s],enumerable:!0})};var ta={};vs(ta,{SITE_THEMES:()=>St,addDays:()=>Ue,applyTheme:()=>at,closeModal:()=>Te,debounce:()=>hs,empty:()=>gs,esc:()=>i,formValue:()=>ys,loading:()=>bs,modal:()=>Z,money:()=>Se,sourceNote:()=>$s,statusBadge:()=>$e,toast:()=>v,today:()=>K,wire:()=>fs});function i(e){return String(e??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}function Se(e){let a=Number(e||0);return a.toLocaleString("zh-CN",{minimumFractionDigits:a%1?2:0,maximumFractionDigits:2})}function K(){let e=new Date;return`${e.getFullYear()}-${String(e.getMonth()+1).padStart(2,"0")}-${String(e.getDate()).padStart(2,"0")}`}function Ue(e){let a=new Date;return a.setDate(a.getDate()+e),`${a.getFullYear()}-${String(a.getMonth()+1).padStart(2,"0")}-${String(a.getDate()).padStart(2,"0")}`}function v(e,a=""){let s=document.getElementById("toastRoot");if(!s)return;let t=a==="success"?"success":a==="error"?"error":a==="warn"||a==="warning"?"warn":"info",n={success:"\u2713",error:"!",warn:"!",info:"i"};for(;s.children.length>=3;)s.firstElementChild?.remove();let d=document.createElement("div");d.className=`toast toast-${t} ${a||t}`,d.setAttribute("role","status"),d.innerHTML=`<span class="toast-ico" aria-hidden="true">${n[t]}</span>
    <span class="toast-msg">${i(e)}</span>
    <button class="toast-x" type="button" aria-label="\u5173\u95ED">\xD7</button>
    <i class="toast-bar" aria-hidden="true"></i>`;let l=!1,c=()=>{l||(l=!0,d.classList.add("toast-out"),setTimeout(()=>d.remove(),180))};d.querySelector(".toast-x").addEventListener("click",c),d.addEventListener("click",r=>{r.target.closest(".toast-x")||c()}),s.appendChild(d),setTimeout(c,2600)}function Te(){let e=document.getElementById("modalRoot");e.innerHTML=""}function Z({title:e,body:a,okText:s="\u786E\u5B9A",cancelText:t="\u53D6\u6D88",onOk:n,wide:d=!1,hideOk:l=!1}){let c=document.getElementById("modalRoot");c.innerHTML=`
    <div class="modal-mask" id="modalMask">
      <div class="modal" style="${d?"width:min(880px,100%)":""}" role="dialog" aria-modal="true">
        <div class="modal-head">
          <div class="modal-title">${i(e)}</div>
          <button class="icon-btn" data-close aria-label="\u5173\u95ED">\xD7</button>
        </div>
        <div class="modal-body">${a}</div>
        <div class="modal-foot">
          <button class="btn btn-ghost" data-close>${i(t)}</button>
          ${l?"":`<button class="btn btn-primary" id="modalOk">${i(s)}</button>`}
        </div>
      </div>
    </div>`,c.querySelectorAll("[data-close]").forEach(o=>o.addEventListener("click",Te)),c.querySelector("#modalMask").addEventListener("click",o=>{o.target.id==="modalMask"&&Te()}),document.addEventListener("keydown",function o(h){h.key==="Escape"&&(Te(),document.removeEventListener("keydown",o))});let r=c.querySelector("#modalOk");r&&n&&r.addEventListener("click",async()=>{try{await n()}catch(o){v(o.message||"\u64CD\u4F5C\u5931\u8D25","error")}})}function $e(e){let a={open:["badge-open","\u53EF\u9884\u7EA6"],confirmed:["badge-open","\u5DF2\u786E\u8BA4"],checked_in:["badge-open","\u5DF2\u7B7E\u5230"],away:["badge-pending","\u6682\u79BB\u4E2D"],released:["badge-open","\u5DF2\u91CA\u653E"],pending_approval:["badge-pending","\u5F85\u5BA1\u6279"],pending:["badge-pending","\u5F85\u51B3\u5B9A"],occupied:["badge-occupied","\u5DF2\u5360\u7528"],closed:["badge-occupied","\u5DF2\u5173\u95ED"],cancelled:["badge-closed","\u5DF2\u53D6\u6D88"],rejected:["badge-closed","\u5DF2\u62D2\u7EDD"],no_show:["badge-closed","\u8D85\u65F6\u672A\u7B7E\u5230"],completed:["badge-open","\u5DF2\u5B8C\u6210"],abandoned:["badge-open","\u5DF2\u653E\u5F03"],bought:["badge-occupied","\u5DF2\u8D2D\u4E70"],claimed:["badge-occupied","\u5DF2\u8BA4\u9886"],removed:["badge-closed","\u5DF2\u4E0B\u67B6"],accepted:["badge-pending","\u5DF2\u63A5\u5355"],picked_up:["badge-pending","\u5DF2\u53D6\u4EF6"],delivered:["badge-pending","\u5DF2\u9001\u8FBE"]},[s,t]=a[e]||["badge-occupied",e||"\u672A\u77E5"];return`<span class="badge ${s}">${i(t)}</span>`}function gs(e,a=""){return`<div class="empty"><strong>${i(e)}</strong>${a?i(a):""}</div>`}function bs(e=3){return`<div class="card loading-card">${Array.from({length:e}).map(()=>'<div class="skeleton" style="margin:8px 0"></div>').join("")}</div>`}function fs(e,a,s,t){e.querySelectorAll(a).forEach(n=>n.addEventListener(s,t))}function ys(e,a){let s=e.querySelector(`[name="${a}"]`);return s?s.value:""}function hs(e,a=260){let s=null;return(...t)=>{clearTimeout(s),s=setTimeout(()=>e(...t),a)}}function $s(e){return e?`<div class="muted" style="margin-top:6px">${i(e)}</div>`:""}function at(e){let a=St[e]||null,s=document.documentElement;if(!a){ws.forEach(t=>s.style.removeProperty(t)),delete s.dataset.selfTheme,localStorage.setItem("selfTheme","default");return}Object.entries(a.vars).forEach(([t,n])=>s.style.setProperty(t,n)),s.dataset.selfTheme=e,localStorage.setItem("selfTheme",e)}var St,ws,ve=us(()=>{St={default:null,pink:{vars:{"--fg-ink":"#5c2b45","--fg-ink-soft":"#8a4a68","--text-1":"#5c2b45","--text-2":"#8a4a68","--text-3":"#b98aa1","--bg":"#fff0f6","--surface":"#fff7fb","--surface-2":"#ffe9f3","--surface-3":"#ffdcea","--primary":"#f43f8e","--primary-2":"#d92b78","--primary-light":"#ffe1ee","--border":"rgba(244,63,142,.22)","--border-strong":"rgba(244,63,142,.4)","--fg-glass":"rgba(255,247,251,.88)","--fg-glass-border":"#ffd6e6","--fg-mesh-blue":"#ffe6f1","--fg-mesh-peach":"#ffeef6","--fg-mesh-mint":"#fde9f3","--sc-paper":"#ffeef5","--sc-card":"#fff7fb","--sc-ink":"#5c2b45","--sc-accent":"#f43f8e","--sc-soft":"#ffd9e9","--sc-line":"#ffc9dc"}},night:{vars:{"--fg-ink":"#e8e2d8","--fg-ink-soft":"#b9b3a8","--text-1":"#e8e2d8","--text-2":"#b9b3a8","--text-3":"#8b9188","--bg":"#16191c","--surface":"#23282c","--surface-2":"#2b3136","--surface-3":"#333a40","--primary":"#c98d9f","--primary-2":"#b0738a","--primary-light":"#3a2c33","--border":"rgba(255,255,255,.12)","--border-strong":"rgba(255,255,255,.22)","--fg-glass":"rgba(35,40,44,.9)","--fg-glass-border":"rgba(255,255,255,.12)","--fg-mesh-blue":"#1f262c","--fg-mesh-peach":"#2a2129","--fg-mesh-mint":"#1e2624","--sc-paper":"#1b1f22","--sc-card":"#23282c","--sc-ink":"#e8e2d8","--sc-accent":"#c98d9f","--sc-soft":"#3a2c33","--sc-line":"#343a3f"}}},ws=Object.values(St).filter(Boolean).reduce((e,a)=>(Object.keys(a.vars).forEach(s=>e.add(s)),e),new Set)});async function ze(e,a={}){let s={headers:{"Content-Type":"application/json"},...a};s.body&&typeof s.body!="string"&&(s.body=JSON.stringify(s.body));let t=await fetch(`/api${e}`,s),n=null;try{n=await t.json()}catch{n=null}if(!t.ok){let d=n&&n.detail,l=d&&typeof d=="object"?d.message||"\u8BF7\u6C42\u5931\u8D25":d||`\u8BF7\u6C42\u5931\u8D25\uFF08HTTP ${t.status}\uFF09`,c=new Error(l);throw c.code=d&&d.code,c.status=t.status,c}return n?n.data:null}var ke={get(e){return ze(e)},post(e,a={}){return ze(e,{method:"POST",body:a})},async upload(e,a){let s=await fetch(`/api${e}`,{method:"POST",body:a}),t=await s.json().catch(()=>null);if(!s.ok){let n=t&&t.detail,d=n&&typeof n=="object"?n.message||"\u4E0A\u4F20\u5931\u8D25":n||`\u4E0A\u4F20\u5931\u8D25\uFF08HTTP ${s.status}\uFF09`;throw new Error(d)}return t?t.data:null},put(e,a={}){return ze(e,{method:"PUT",body:a})},patch(e,a={}){return ze(e,{method:"PATCH",body:a})},del(e){return ze(e,{method:"DELETE"})}};function le(e){return String(e??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}function Ee(e,a=""){let s=document.getElementById("toastRoot");if(!s)return;let t=a==="success"?"success":a==="error"?"error":a==="warn"||a==="warning"?"warn":"info",n={success:"\u2713",error:"!",warn:"!",info:"i"};for(;s.children.length>=3;)s.firstElementChild?.remove();let d=document.createElement("div");d.className=`toast toast-${t} ${a||t}`,d.setAttribute("role","status"),d.innerHTML=`<span class="toast-ico" aria-hidden="true">${n[t]}</span>
    <span class="toast-msg">${le(e)}</span>
    <button class="toast-x" type="button" aria-label="\u5173\u95ED">\xD7</button>
    <i class="toast-bar" aria-hidden="true"></i>`;let l=!1,c=()=>{l||(l=!0,d.classList.add("toast-out"),setTimeout(()=>d.remove(),180))};d.querySelector(".toast-x").addEventListener("click",c),d.addEventListener("click",r=>{r.target.closest(".toast-x")||c()}),s.appendChild(d),setTimeout(c,2600)}function De(){let e=document.getElementById("modalRoot");e.innerHTML=""}function kt({title:e,body:a,okText:s="\u786E\u5B9A",cancelText:t="\u53D6\u6D88",onOk:n,wide:d=!1,hideOk:l=!1}){let c=document.getElementById("modalRoot");c.innerHTML=`
    <div class="modal-mask" id="modalMask">
      <div class="modal" style="${d?"width:min(880px,100%)":""}" role="dialog" aria-modal="true">
        <div class="modal-head">
          <div class="modal-title">${le(e)}</div>
          <button class="icon-btn" data-close aria-label="\u5173\u95ED">\xD7</button>
        </div>
        <div class="modal-body">${a}</div>
        <div class="modal-foot">
          <button class="btn btn-ghost" data-close>${le(t)}</button>
          ${l?"":`<button class="btn btn-primary" id="modalOk">${le(s)}</button>`}
        </div>
      </div>
    </div>`,c.querySelectorAll("[data-close]").forEach(o=>o.addEventListener("click",De)),c.querySelector("#modalMask").addEventListener("click",o=>{o.target.id==="modalMask"&&De()}),document.addEventListener("keydown",function o(h){h.key==="Escape"&&(De(),document.removeEventListener("keydown",o))});let r=c.querySelector("#modalOk");r&&n&&r.addEventListener("click",async()=>{try{await n()}catch(o){Ee(o.message||"\u64CD\u4F5C\u5931\u8D25","error")}})}function Xt(e=3){return`<div class="card loading-card">${Array.from({length:e}).map(()=>'<div class="skeleton" style="margin:8px 0"></div>').join("")}</div>`}var ea={default:null,pink:{vars:{"--fg-ink":"#5c2b45","--fg-ink-soft":"#8a4a68","--text-1":"#5c2b45","--text-2":"#8a4a68","--text-3":"#b98aa1","--bg":"#fff0f6","--surface":"#fff7fb","--surface-2":"#ffe9f3","--surface-3":"#ffdcea","--primary":"#f43f8e","--primary-2":"#d92b78","--primary-light":"#ffe1ee","--border":"rgba(244,63,142,.22)","--border-strong":"rgba(244,63,142,.4)","--fg-glass":"rgba(255,247,251,.88)","--fg-glass-border":"#ffd6e6","--fg-mesh-blue":"#ffe6f1","--fg-mesh-peach":"#ffeef6","--fg-mesh-mint":"#fde9f3","--sc-paper":"#ffeef5","--sc-card":"#fff7fb","--sc-ink":"#5c2b45","--sc-accent":"#f43f8e","--sc-soft":"#ffd9e9","--sc-line":"#ffc9dc"}},night:{vars:{"--fg-ink":"#e8e2d8","--fg-ink-soft":"#b9b3a8","--text-1":"#e8e2d8","--text-2":"#b9b3a8","--text-3":"#8b9188","--bg":"#16191c","--surface":"#23282c","--surface-2":"#2b3136","--surface-3":"#333a40","--primary":"#c98d9f","--primary-2":"#b0738a","--primary-light":"#3a2c33","--border":"rgba(255,255,255,.12)","--border-strong":"rgba(255,255,255,.22)","--fg-glass":"rgba(35,40,44,.9)","--fg-glass-border":"rgba(255,255,255,.12)","--fg-mesh-blue":"#1f262c","--fg-mesh-peach":"#2a2129","--fg-mesh-mint":"#1e2624","--sc-paper":"#1b1f22","--sc-card":"#23282c","--sc-ink":"#e8e2d8","--sc-accent":"#c98d9f","--sc-soft":"#3a2c33","--sc-line":"#343a3f"}}},ms=Object.values(ea).filter(Boolean).reduce((e,a)=>(Object.keys(a.vars).forEach(s=>e.add(s)),e),new Set);function xt(e){let a=ea[e]||null,s=document.documentElement;if(!a){ms.forEach(t=>s.style.removeProperty(t)),delete s.dataset.selfTheme,localStorage.setItem("selfTheme","default");return}Object.entries(a.vars).forEach(([t,n])=>s.style.setProperty(t,n)),s.dataset.selfTheme=e,localStorage.setItem("selfTheme",e)}async function Ve(e,a={}){let s={headers:{"Content-Type":"application/json"},...a};s.body&&typeof s.body!="string"&&(s.body=JSON.stringify(s.body));let t=await fetch(`/api${e}`,s),n=null;try{n=await t.json()}catch{n=null}if(!t.ok){let d=n&&n.detail,l=d&&typeof d=="object"?d.message||"\u8BF7\u6C42\u5931\u8D25":d||`\u8BF7\u6C42\u5931\u8D25\uFF08HTTP ${t.status}\uFF09`,c=new Error(l);throw c.code=d&&d.code,c.status=t.status,c}return n?n.data:null}var m={get(e){return Ve(e)},post(e,a={}){return Ve(e,{method:"POST",body:a})},async upload(e,a){let s=await fetch(`/api${e}`,{method:"POST",body:a}),t=await s.json().catch(()=>null);if(!s.ok){let n=t&&t.detail,d=n&&typeof n=="object"?n.message||"\u4E0A\u4F20\u5931\u8D25":n||`\u4E0A\u4F20\u5931\u8D25\uFF08HTTP ${s.status}\uFF09`;throw new Error(d)}return t?t.data:null},put(e,a={}){return Ve(e,{method:"PUT",body:a})},patch(e,a={}){return Ve(e,{method:"PATCH",body:a})},del(e){return Ve(e,{method:"DELETE"})}};ve();var it=[{img:"/static/img/slide-1.webp",caption:"\u6821\u95E8 \xB7 \u6CC9\u5C71\u6821\u533A\u4E3B\u5165\u53E3"},{img:"/static/img/slide-2.webp",caption:"\u56FE\u4E66\u9986 \xB7 \u81EA\u4E60\u4E0E\u501F\u9605"},{img:"/static/img/slide-3.webp",caption:"\u7ACB\u6625 \xB7 \u6821\u56ED\u521D\u7EFF"},{img:"/static/img/slide-4.webp",caption:"\u79CB\u5206 \xB7 \u94F6\u674F\u65F6\u8282"},{img:"/static/img/slide-5.webp",caption:"\u4F53\u80B2\u9986 \xB7 \u6821\u8FD0\u4F1A\u4E3B\u573A"},{img:"/static/img/slide-6.webp",caption:"\u5BD2\u9732 \xB7 \u6668\u5149\u91CC\u7684\u6821\u56ED"},{img:"/static/img/slide-7.webp",caption:"\u6E38\u6CF3\u9986 \xB7 \u4F53\u80B2\u8BFE\u4E0E\u793E\u56E2"},{img:"/static/img/slide-8.webp",caption:"\u7ACB\u79CB \xB7 \u91D1\u8272\u6821\u56ED"}];function ks(e){return Object.fromEntries(e.map(a=>[a.key,a]))}var sa={nav:'<svg viewBox="0 0 24 24"><path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11Z"/><circle cx="12" cy="10" r="2.6"/></svg>',book:'<svg viewBox="0 0 24 24"><rect x="3.5" y="5" width="17" height="15" rx="2.4"/><path d="M3.5 10h17M8 3v4M16 3v4"/><path d="M8.5 14.5h3"/></svg>',partner:'<svg viewBox="0 0 24 24"><circle cx="9" cy="9" r="3"/><circle cx="17" cy="10.5" r="2.4"/><path d="M3.5 19.5c.6-2.8 2.7-4.2 5.5-4.2s4.9 1.4 5.5 4.2"/><path d="M15 15.6c2.2.1 3.6 1.3 4 3.4"/></svg>',save:'<svg viewBox="0 0 24 24"><path d="M5 8h14l-1.4 12.2a1.6 1.6 0 0 1-1.6 1.4H8a1.6 1.6 0 0 1-1.6-1.4L5 8Z"/><path d="M8.6 8V6.2a3.4 3.4 0 0 1 6.8 0V8"/></svg>',doc:'<svg viewBox="0 0 24 24"><path d="M5 4h9l5 5v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4Z"/><path d="M14 4v5h5"/><path d="M8.5 13h7M8.5 16.5h4"/></svg>',me:'<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="3.6"/><path d="M4.5 20c1.4-3.6 4-5.2 7.5-5.2s6.1 1.6 7.5 5.2"/></svg>',fix:'<svg viewBox="0 0 24 24"><path d="M14.7 6.3a4.5 4.5 0 0 0-6 5.6L3 17.6V21h3.4l5.7-5.7a4.5 4.5 0 0 0 5.6-6L14.5 12l-2.5-2.5 2.7-3.2Z"/></svg>',library:'<svg viewBox="0 0 24 24"><path d="M6 11V7a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v4"/><path d="M4 11h16v5H4z"/><path d="M7 16v4M17 16v4"/><path d="M9.5 7.5h5"/></svg>'};function xs({pending:e,doneToday:a,focusMin:s,week:t}){let n=e+a,d=n?Math.round(a/n*100):0,l=2*Math.PI*15.9155,c=t.days||[],r=Math.max(25,...c.map(h=>h.focus||0)),o=c.map(h=>{let _=h.focus||0,E=_?Math.max(10,Math.round(_/r*46)):3,k=_?`${h.date.slice(5)} \xB7 \u4E13\u6CE8 ${_} \u5206\u949F${h.done?` \xB7 \u5B8C\u6210 ${h.done} \u9879`:""}`:`${h.date.slice(5)} \xB7 \u65E0\u4E13\u6CE8\u8BB0\u5F55`;return`<div class="wbar-col" title="${i(k)}">
        <i class="wbar${h.is_today?" today":""}${_?"":" empty"}" style="height:${E}px"></i>
        <span class="wbar-lb${h.is_today?" today":""}">${i(h.label)}</span>
      </div>`}).join("");return`<div class="tile self-stat-tile">
    <div class="top">
      <div class="ic o">${sa.me}</div>
      <div><div class="nm">\u4E2A\u4EBA\u7BA1\u7406</div><div class="sub">\u4EFB\u52A1 \xB7 \u4E13\u6CE8 \xB7 \u8BB0\u5F55</div></div>
      <a class="ai-mini" href="#/assistant?q=\u770B\u770B\u6211\u4ECA\u5929\u7684\u5B89\u6392" title="\u95EE\u82CF\u5C0F\u5E08">\u95EE</a>
    </div>
    <div class="ss-viz">
      <a class="ss-ring" href="#/life/self/control" title="\u4ECA\u65E5\u4EFB\u52A1\u5B8C\u6210\u7387 ${d}%">
        <svg viewBox="0 0 36 36">
          <circle class="ss-ring-bg" cx="18" cy="18" r="15.9155"/>
          <circle class="ss-ring-fg" cx="18" cy="18" r="15.9155" style="stroke-dasharray:${l};stroke-dashoffset:${l*(1-d/100)}"/>
        </svg>
        <b>${d}<i>%</i></b>
      </a>
      <div class="ss-nums">
        <a href="#/life/self/control"><b>${e}</b><span>\u5F85\u529E</span></a>
        <a href="#/life/self/control?tab=focus"><b>${s}</b><span>\u4E13\u6CE8\u5206</span></a>
      </div>
      ${c.length?`<div class="ss-week">
        <div class="wbar-row">${o}</div>
      </div>`:""}
    </div>
    <div class="acts">
      <a class="go" href="#/life/self/control">\u53BB\u7BA1\u7406 \u2192</a>
    </div>
  </div>`}function Ss(e){let a=e.querySelectorAll(".nx-slide"),s=e.querySelectorAll(".nx-dot"),t=e.querySelector("#nxCaption");if(!a.length)return;window.__nxTimer&&clearInterval(window.__nxTimer);let n=0,d=o=>{o&&o.dataset.bg&&!o.style.backgroundImage&&(o.style.backgroundImage=`url('${o.dataset.bg}')`)},l=o=>{if(o&&o.dataset.bg&&!o.style.backgroundImage){let h=new Image;h.src=o.dataset.bg}},c=o=>{n=(o+a.length)%a.length,d(a[n]),l(a[(n+1)%a.length]),a.forEach((h,_)=>h.classList.toggle("active",_===n)),s.forEach((h,_)=>h.classList.toggle("active",_===n)),t&&(t.textContent=it[n].caption)},r=()=>{clearInterval(window.__nxTimer),window.__nxTimer=setInterval(()=>c(n+1),5200)};s.forEach(o=>o.addEventListener("click",()=>{c(Number(o.dataset.nx)),r()})),e.querySelector(".nx-arrow.prev").addEventListener("click",()=>{c(n-1),r()}),e.querySelector(".nx-arrow.next").addEventListener("click",()=>{c(n+1),r()}),r()}function Ce(e,a,s,t,n,d,l){return`<div class="tile">
    <div class="top">
      <div class="ic ${a}">${sa[e]}</div>
      <div><div class="nm">${i(s)}</div><div class="sub">${i(t)}</div></div>
    </div>
    <div class="stat">${n}</div>
    <div class="acts">
      <a class="go" href="${l}">${i(d)} \u2192</a>

    </div>
  </div>`}var st="";function aa(){if(st)return st;let e=new Date;return st=`${e.getFullYear()}-${String(e.getMonth()+1).padStart(2,"0")}-${String(e.getDate()).padStart(2,"0")}`,st}async function ia(e,a){let[s,t,n,d,l,c,r,o,h,_]=await Promise.all([m.get("/home"),m.get("/self/control/overview").catch(()=>null),m.get("/self/control/tasks").catch(()=>[]),m.get("/buddy/posts").catch(()=>[]),m.get("/savings/summary").catch(()=>({saved:0})),m.get("/bookings/my").catch(()=>[]),m.get("/library/areas").catch(()=>[]),m.get(`/classrooms/grid?date=${aa()}`).catch(()=>null),m.get("/self/control/weekly-stats").catch(()=>null),m.get("/deal/overview").catch(()=>null)]),E=h&&Array.isArray(h.days)&&h.days.length?h:{days:[],focus_total:0,done_total:0},k=ks(s.metrics),f=s.week,M=r.reduce(($,B)=>$+B.available,0),q=o?o.rooms.filter($=>$.cells.some(B=>B.status==="free")).length:0,U=d.filter($=>$.status==="open").length,u=Se(l.saved||0),p=_&&Array.isArray(_.plans)?_.plans.length:0,b=aa(),S=t?t.tasks.filter($=>["planned","partial"].includes($.status)).length:0,y=n.filter($=>$.status==="done"&&($.completed_at||"").slice(0,10)===b).length,g=S+y,L=t?t.focus.minutes:0,w=t?t.blockers.length:0,x=g?Math.round(y/g*100):0,N=c.filter($=>!["cancelled","rejected","no_show","completed"].includes($.status)||$.date===b).sort(($,B)=>($.date+$.start_at).localeCompare(B.date+B.start_at)).slice(0,8),H=s.news.filter($=>$.category!=="\u901A\u77E5\u516C\u544A"),D=s.news.filter($=>$.category==="\u901A\u77E5\u516C\u544A"),A=H[0],z=H.slice(1,6),ie=["campuses","colleges","majors","teachers","undergrads","postgrads"].map($=>k[$]).filter($=>$&&$.status!=="pending");e.innerHTML=`
    <section class="nx-hero" id="nxHero">
      <div class="nx-track">
        ${it.map(($,B)=>`<div class="nx-slide ${B===0?"active":""}" ${B===0?`style="background-image:url('${$.img}')"`:`data-bg="${i($.img)}"`}></div>`).join("")}
      </div>
      <div class="nx-shade"></div>
      <div class="nx-info">
        <div class="nx-tag">${i(f.today)} ${i(f.weekday)} \xB7 \u7B2C ${f.week} \u5468 \xB7 ${i(_s())}</div>
        <h1 class="nx-title">${i(s.school.name)}<span>${i(s.school.motto)}</span></h1>
        <div class="nx-caption" id="nxCaption">${i(it[0].caption)}</div>
      </div>
      <div class="nx-dots">
        ${it.map(($,B)=>`<button class="nx-dot ${B===0?"active":""}" data-nx="${B}" aria-label="\u7B2C ${B+1} \u5F20"></button>`).join("")}
      </div>
      <button class="nx-arrow prev" aria-label="\u4E0A\u4E00\u5F20">\u2039</button>
      <button class="nx-arrow next" aria-label="\u4E0B\u4E00\u5F20">\u203A</button>
    </section>

    <div class="zone">
      <div class="zone-head"><b>\u5DE5\u4F5C\u533A</b><small>\u9884\u7EA6 \xB7 \u529E\u4E8B \xB7 \u4E2A\u4EBA</small><a class="lnk" href="#/work">\u8FDB\u5165\u5DE5\u4F5C\u533A \u2192</a></div>
      <div class="tile-grid tile-grid-4">
        ${Ce("book","g","\u7A7A\u6559\u5BA4\u9884\u7EA6","\u6559\u5BA4 \xD7 \u8282\u6B21",`\u4ECA\u65E5\u53EF\u7EA6 <b class="g">${q}</b> \u95F4`,"\u53BB\u9884\u7EA6","#/work/classroom")}
        ${Ce("library","b","\u56FE\u4E66\u9986\u9884\u7EA6","\u5E38\u7528\u5EA7\u4F4D \xB7 \u9605\u89C8\u5BA4\u9009\u5EA7",`\u5F53\u524D\u7A7A\u5EA7 <b>${M}</b> \u4E2A`,"\u53BB\u9009\u5EA7","#/work/library")}
        ${Ce("doc","v","\u6587\u4EF6\u8BC6\u522B","\u5B57\u6BB5\u63D0\u53D6 \xB7 \u6838\u67E5\u5339\u914D","\u652F\u6301 PDF \xB7 \u626B\u63CF\u4EF6 \xB7 Word","\u53BB\u8BC6\u522B","#/office")}
        ${xs({pending:S,doneToday:y,focusMin:L,week:E})}
      </div>
    </div>

    <div class="zone">
      <div class="zone-head"><b>\u751F\u6D3B\u533A</b><small>\u5BFC\u822A \xB7 \u793E\u4EA4 \xB7 \u7701\u94B1 \xB7 \u62A5\u4FEE</small><a class="lnk" href="#/life">\u8FDB\u5165\u751F\u6D3B\u533A \u2192</a></div>
      <div class="tile-grid tile-grid-4">
        ${Ce("nav","c","\u6821\u56ED\u5BFC\u822A","\u771F\u5B9E\u5730\u56FE \xB7 \u6B65\u884C\u8DEF\u7EBF","\u5E38\u7528 <b>\u656C\u6587\u56FE\u4E66\u9986</b>","\u5E26\u6211\u53BB","#/life/nav")}
        ${Ce("partner","y","\u627E\u642D\u5B50","\u5403\u996D \xB7 \u81EA\u4E60 \xB7 \u5065\u8EAB \xB7 \u8003\u7814",`\u8FDB\u884C\u4E2D <b>${U}</b>\u4E2A \xB7 \u4ECA\u665A\u53EF\u7EA6`,"\u627E\u642D\u5B50","#/life/buddy")}
        ${Ce("save","p","\u7701\u4E00\u7701","\u4E09\u601D\u800C\u540E\u4E70",`\u5F85\u51B3\u7B56\u8D2D\u4E70\u8BA1\u5212 <b>${p}</b> \u4E2A`,"\u53BB\u7701\u94B1","#/life/deal")}
        ${Ce("fix","r","\u62A5\u4FEE","\u5BBF\u820D \xB7 \u8BBE\u65BD \xB7 \u516C\u5171\u533A\u57DF","\u4E00\u5904\u63D0\u4EA4 \xB7 \u5168\u7A0B\u53EF\u67E5","\u53BB\u62A5\u4FEE","#/repair")}
      </div>
    </div>

  `,Ss(e)}function _s(){return localStorage.getItem("campus")||"\u6CC9\u5C71\u6821\u533A"}ve();var na="\u6570\u636E\u6765\u81EA\u6C5F\u82CF\u5E08\u8303\u5927\u5B66\u5B98\u7F51\u516C\u5F00\u9875\u9762\uFF1B\u5B98\u7F51\u672A\u7ED9\u51FA\u7684\u6570\u503C\u6807\u6CE8\u201C\u6682\u65E0\u516C\u5F00\u6570\u636E\u201D\u3002";function da(){return`<svg viewBox="0 0 320 200" fill="none">
    <circle cx="250" cy="38" r="56" fill="#fff" opacity=".10"/>
    <path d="M40 168h240" stroke="#fff" stroke-opacity=".35" stroke-width="2"/>
    <path d="M70 168V96l50-34 50 34v72" stroke="#fff" stroke-opacity=".55" stroke-width="2.2"/>
    <path d="M120 62l50 34" stroke="#fff" stroke-opacity=".35" stroke-width="2"/>
    <path d="M96 168v-38h48v38" stroke="#fff" stroke-opacity=".45" stroke-width="2"/>
    <path d="M200 168v-52h40v52" stroke="#fff" stroke-opacity=".35" stroke-width="2"/>
    <circle cx="220" cy="100" r="9" stroke="#fff" stroke-opacity=".4" stroke-width="2"/>
  </svg>`}function ce(e,a,s="\u6682\u65E0\u516C\u5F00\u6570\u636E"){let t=(e||[]).find(n=>n.key===a);return!t||t.status==="pending"||!t.value?s:`${t.value}${t.unit||""}`}async function _t(){return m.get("/home")}async function ca(e){let a=await _t(),s=a.metrics;e.innerHTML=`
    <div class="detail-hero">
      <div class="detail-art">${da()}</div>
      <span class="tag">\u5B66\u6821\u6982\u51B5</span>
      <h1>${i(a.school.name)}</h1>
      <p>${i(a.school.motto)}\u3002${na}</p>
      <div class="row" style="margin-top:14px">
        <a class="btn btn-ghost" href="#/home" style="background:rgba(255,255,255,.14);border-color:rgba(255,255,255,.25);color:#fff">\u8FD4\u56DE\u9996\u9875</a>
        <a class="btn btn-ghost" href="#/home/faculty" style="background:rgba(255,255,255,.14);border-color:rgba(255,255,255,.25);color:#fff">\u770B\u5E08\u8D44\u4E0E\u6210\u5C31</a>
        <a class="btn btn-ghost" href="#/home/campus" style="background:rgba(255,255,255,.14);border-color:rgba(255,255,255,.25);color:#fff">\u770B\u6821\u533A\u4E0E VR</a>
      </div>
    </div>

    <div class="grid grid-4">
      <div class="stat"><div class="stat-num">${ce(s,"campuses")}</div><div class="stat-label">\u6821\u533A</div></div>
      <div class="stat"><div class="stat-num">${ce(s,"colleges")}</div><div class="stat-label">\u4E13\u4E1A\u5B66\u9662</div></div>
      <div class="stat"><div class="stat-num">${ce(s,"majors")}</div><div class="stat-label">\u672C\u79D1\u62DB\u751F\u4E13\u4E1A</div></div>
      <div class="stat"><div class="stat-num">${ce(s,"teachers")}</div><div class="stat-label">\u4E13\u4EFB\u6559\u5E08</div></div>
    </div>

    <div class="grid grid-2" style="margin-top:16px">
      <div class="card">
        <div class="card-title">\u529E\u5B66\u5C42\u6B21\u4E0E\u89C4\u6A21</div>
        <div class="card-desc" style="margin-top:6px">
          \u5B66\u6821\u73B0\u6709 ${ce(s,"undergrads")} \u5168\u65E5\u5236\u672C\u79D1\u751F\u3001${ce(s,"postgrads")} \u535A\u58EB\u7855\u58EB\u7814\u7A76\u751F\uFF0C
          \u4E13\u4EFB\u6559\u5E08 ${ce(s,"teachers")}\uFF0C\u5176\u4E2D\u9AD8\u7EA7\u804C\u79F0 ${ce(s,"senior")}\uFF0C\u535A\u58EB\u5360\u6BD4 ${ce(s,"phd_ratio")}\u3002
        </div>
        <div class="muted" style="margin-top:8px">\u4EE5\u4E0A\u4E3A\u5B98\u7F51\u516C\u5F00\u53E3\u5F84\uFF0C\u4E0D\u540C\u5E74\u4EFD\u53EF\u80FD\u7565\u6709\u5DEE\u5F02\u3002</div>
      </div>
      <div class="card">
        <div class="card-title">\u5B66\u79D1\u4E0E\u5E73\u53F0</div>
        <div class="card-desc" style="margin-top:6px">
          ${ce(s,"esi_top1")} \u4E2A\u5B66\u79D1\u8FDB\u5165 ESI \u5168\u7403\u524D 1%\uFF1B${ce(s,"demo_centers")} \u4E2A\u56FD\u5BB6\u7EA7\u5B9E\u9A8C\u6559\u5B66\u793A\u8303\u4E2D\u5FC3\uFF1B
          ${ce(s,"first_class_majors")} \u4E2A\u56FD\u5BB6\u7EA7\u4E00\u6D41\u672C\u79D1\u4E13\u4E1A\u5EFA\u8BBE\u70B9\u3002
        </div>
        <a class="btn btn-ghost btn-sm" style="margin-top:10px" href="#/home/faculty">\u67E5\u770B\u5B8C\u6574\u6210\u5C31</a>
      </div>
    </div>

    <div class="section-title">\u56DB\u6821\u533A</div>
    <div class="grid grid-4">
      ${a.campuses.map((t,n)=>`
        <a class="card campus-card" href="#/home/campus?c=${n}">
          <div class="spread"><div class="card-title">${i(t.name)}</div><span class="tag tag-blue">${i(t.postcode)}</span></div>
          <div class="card-desc">${i(t.address)}</div>
          <div class="muted" style="margin-top:6px">${i(t.note||"\u2014")}</div>
        </a>`).join("")}
    </div>

    <div class="card" style="margin-top:16px">
      <div class="card-title">\u6570\u636E\u53E3\u5F84</div>
      <div class="card-desc">${na} \u5360\u5730\u9762\u79EF\u5B98\u7F51\u672A\u516C\u5F00\u6570\u503C\u3002</div>
      <div class="row" style="margin-top:10px">
        <a class="btn btn-ghost btn-sm" href="${i(a.school.source)}" target="_blank" rel="noopener">\u5B98\u7F51\u6765\u6E90 \u2197</a>
        <a class="btn btn-ghost btn-sm" href="#/work/news">\u76F8\u5173\u52A8\u6001</a>
      </div>
    </div>`}async function la(e){let a=await _t(),s=a.metrics,t=[["\u4E13\u4EFB\u6559\u5E08",ce(s,"teachers"),"\u5B98\u7F51\u516C\u5F00\u53E3\u5F84"],["\u9AD8\u7EA7\u804C\u79F0\u6559\u5E08",ce(s,"senior"),"\u6B63\u9AD8\u4E0E\u526F\u9AD8\u5408\u8BA1"],["\u535A\u58EB\u5360\u6BD4",ce(s,"phd_ratio"),"\u4E13\u4EFB\u6559\u5E08\u4E2D\u5177\u6709\u535A\u58EB\u5B66\u4F4D\u6BD4\u4F8B"],["\u56FD\u5BB6\u7EA7\u4E00\u6D41\u672C\u79D1\u4E13\u4E1A",ce(s,"first_class_majors"),"\u4E00\u6D41\u672C\u79D1\u4E13\u4E1A\u5EFA\u8BBE\u70B9"],["\u56FD\u5BB6\u7EA7\u4E00\u6D41\u672C\u79D1\u8BFE\u7A0B",ce(s,"first_class_courses"),"\u7EBF\u4E0A\u4E00\u6D41\u3001\u7EBF\u4E0A\u7EBF\u4E0B\u6DF7\u5408\u7B49"],["\u56FD\u5BB6\u7EA7\u6559\u5B66\u6210\u679C\u5956",ce(s,"teaching_awards"),"\u9AD8\u7B49\u6559\u80B2\uFF08\u672C\u79D1\uFF09\u6559\u5B66\u6210\u679C"],["\u56FD\u5BB6\u7EA7\u5B9E\u9A8C\u6559\u5B66\u793A\u8303\u4E2D\u5FC3",ce(s,"demo_centers"),"\u5B9E\u9A8C\u6559\u5B66\u5E73\u53F0"],["ESI \u5168\u7403\u524D 1% \u5B66\u79D1",ce(s,"esi_top1"),"\u6309 ESI \u6700\u65B0\u6570\u636E"]];e.innerHTML=`
    <div class="detail-hero">
      <div class="detail-art">${da()}</div>
      <span class="tag">\u5E08\u8D44\u4E0E\u529E\u5B66\u6210\u5C31</span>
      <h1>\u5E08\u8D44\u961F\u4F0D\u4E0E\u529E\u5B66\u6210\u679C</h1>
      <p>\u53EA\u5C55\u793A\u5B98\u7F51\u516C\u5F00\u3001\u53EF\u6838\u5BF9\u7684\u6307\u6807\uFF1B\u6CA1\u6709\u516C\u5F00\u6765\u6E90\u7684\u6392\u540D\u3001\u5934\u8854\u4E0E\u4E2A\u4EBA\u4FE1\u606F\u4E0D\u5728\u6B64\u5C55\u793A\u3002</p>
    </div>

    <div class="grid grid-3">
      <div class="stat"><div class="stat-num">${ce(s,"teachers")}</div><div class="stat-label">\u4E13\u4EFB\u6559\u5E08</div></div>
      <div class="stat"><div class="stat-num">${ce(s,"senior")}</div><div class="stat-label">\u9AD8\u7EA7\u804C\u79F0</div></div>
      <div class="stat"><div class="stat-num">${ce(s,"phd_ratio")}</div><div class="stat-label">\u535A\u58EB\u5360\u6BD4</div></div>
    </div>

    <div class="card" style="margin-top:16px">
      <div class="card-title">\u6307\u6807\u660E\u7EC6</div>
      <div class="table-wrap" style="margin-top:10px">
        <table>
          <thead><tr><th>\u6307\u6807</th><th>\u6570\u503C</th><th>\u53E3\u5F84\u8BF4\u660E</th></tr></thead>
          <tbody>
            ${t.map(([n,d,l])=>`<tr><td>${i(n)}</td><td><strong>${i(d)}</strong></td><td class="muted">${i(l)}</td></tr>`).join("")}
          </tbody>
        </table>
      </div>
    </div>

    <div class="grid grid-2" style="margin-top:16px">
      <div class="card">
        <div class="card-title">\u6559\u5B66\u5EFA\u8BBE</div>
        <div class="card-desc" style="margin-top:6px">
          ${ce(s,"first_class_majors")} \u4E2A\u56FD\u5BB6\u7EA7\u4E00\u6D41\u672C\u79D1\u4E13\u4E1A\u5EFA\u8BBE\u70B9\u3001${ce(s,"first_class_courses")} \u95E8\u56FD\u5BB6\u7EA7\u4E00\u6D41\u672C\u79D1\u8BFE\u7A0B\u3001
          ${ce(s,"teaching_awards")} \u9879\u56FD\u5BB6\u7EA7\u6559\u5B66\u6210\u679C\u5956\u3001${ce(s,"demo_centers")} \u4E2A\u56FD\u5BB6\u7EA7\u5B9E\u9A8C\u6559\u5B66\u793A\u8303\u4E2D\u5FC3\u3002
        </div>
      </div>
      <div class="card">
        <div class="card-title">\u5B66\u79D1\u5EFA\u8BBE</div>
        <div class="card-desc" style="margin-top:6px">${ce(s,"esi_top1")} \u4E2A\u5B66\u79D1\u8FDB\u5165 ESI \u5168\u7403\u524D 1%\u3002\u5B66\u79D1\u8BC4\u4F30\u3001\u535A\u58EB\u70B9\u4E0E\u91CD\u70B9\u5B9E\u9A8C\u5BA4\u6570\u91CF\u4EE5\u5B98\u7F51\u516C\u793A\u4E3A\u51C6\u3002</div>
      </div>
    </div>

    <div class="card" style="margin-top:16px">
      <div class="card-title">\u8BF4\u660E</div>
      <div class="card-desc">
        \u540D\u5E08\u98CE\u91C7\u8BF7\u524D\u5F80\u5B98\u7F51\u201C\u540D\u5E08\u98CE\u91C7\u201D\u201C\u51FA\u5F69\u5E08\u5927\u4EBA\u201D\u7B49\u516C\u5F00\u680F\u76EE\u3002
      </div>
      <div class="row" style="margin-top:10px">
        <a class="btn btn-ghost btn-sm" href="${i(a.school.source)}" target="_blank" rel="noopener">\u5B98\u7F51\u6765\u6E90 \u2197</a>
        <a class="btn btn-ghost btn-sm" href="#/home/about">\u8FD4\u56DE\u5B66\u6821\u6982\u51B5</a>
      </div>
    </div>`}var Es=[{x:150,y:168,label:"\u6CC9\u5C71"},{x:236,y:132,label:"\u4E91\u9F99"},{x:214,y:96,label:"\u594E\u56ED"},{x:270,y:58,label:"\u6F58\u5B89\u6E56"}];async function ra(e,a){let t=(await _t()).campuses,n=Math.max(0,Math.min(t.length-1,Number(a?.params?.get("c"))||0)),d=t[n];e.innerHTML=`
    <div class="page-head">
      <div>
        <div class="page-title">\u6821\u533A\u4E0E VR \u5168\u666F</div>
        <div class="page-sub">\u56DB\u6821\u533A\u5730\u5740\u6765\u81EA\u5B98\u7F51\uFF1B\u793A\u610F\u5730\u56FE\u53EA\u8868\u8FBE\u76F8\u5BF9\u65B9\u4F4D\u3002</div>
      </div>
      <a class="btn btn-ghost btn-sm" href="#/home">\u8FD4\u56DE\u9996\u9875</a>
    </div>

    <div class="row" style="margin-bottom:14px">
      ${t.map((l,c)=>`<a class="btn ${c===n?"btn-primary":"btn-ghost"} btn-sm" href="#/home/campus?c=${c}">${i(l.name)}</a>`).join("")}
      <a class="vr-btn" href="https://www.720yun.com/t/79ajOzhvkv8" target="_blank" rel="noopener" style="margin-left:auto">VR \u5168\u666F \u2197</a>
    </div>

    <div class="grid grid-2">
      <div class="card">
        <div class="spread"><div class="card-title">${i(d.name)}</div><span class="tag tag-blue">${i(d.postcode)}</span></div>
        <div class="card-desc" style="margin-top:8px">${i(d.address)}</div>
        <div class="muted" style="margin-top:6px">${i(d.note||"\u2014")}</div>
        <div class="row" style="margin-top:12px">
          <a class="btn btn-primary btn-sm" href="#/life/nav?to=${encodeURIComponent(d.name)}">\u7AD9\u5185\u5BFC\u822A</a>
          <a class="btn btn-ghost btn-sm" href="https://www.720yun.com/t/79ajOzhvkv8" target="_blank" rel="noopener">\u6253\u5F00 VR \u5168\u666F</a>
        </div>
        <div class="muted" style="margin-top:10px;font-size:11px">VR \u5168\u666F\u6765\u81EA\u5B66\u6821\u516C\u5F00\u5165\u53E3\u3002</div>
      </div>

      <div class="card">
        <div class="spread"><div class="card-title">\u56DB\u6821\u533A\u76F8\u5BF9\u4F4D\u7F6E</div><span class="tag tag-warn">\u793A\u610F\u56FE</span></div>
        <div class="campus-map" style="margin-top:10px">
          <svg viewBox="0 0 320 210">
            <path d="M28 182c40-16 62-38 84-62s48-38 82-44 46-22 62-38" stroke="#cfdced" stroke-width="2" fill="none" stroke-dasharray="5 5"/>
            <path d="M22 150c40 6 70 18 96 34" stroke="#dbe6f4" stroke-width="10" fill="none" stroke-linecap="round"/>
            ${Es.map((l,c)=>`
              <g class="map-pin ${c===n?"active":""}" data-i="${c}" style="cursor:pointer">
                <circle cx="${l.x}" cy="${l.y}" r="${c===n?7:5}"/>
                <text x="${l.x+10}" y="${l.y+4}">${i(t[c]?.name?.replace("\u6821\u533A","")||l.label)}</text>
              </g>`).join("")}
            <text x="24" y="30" style="font-size:10px;fill:#9aa7b8">\u5F90\u5DDE \xB7 \u76F8\u5BF9\u65B9\u4F4D\u793A\u610F</text>
          </svg>
        </div>
        <div class="muted" style="margin-top:8px;font-size:11px">\u70B9\u51FB\u5706\u70B9\u5207\u6362\u6821\u533A\uFF1B\u7CBE\u786E\u8DEF\u7EBF\u8BF7\u7528\u6821\u56ED\u5BFC\u822A\u6216\u5730\u56FE\u670D\u52A1\u3002</div>
      </div>
    </div>

    <div class="card" style="margin-top:16px">
      <div class="card-title">\u6821\u533A\u5DEE\u5F02\u5BF9\u4F7F\u7528\u7684\u5F71\u54CD</div>
      <div class="card-desc" style="margin-top:6px">
        \u8DE8\u6821\u533A\u9884\u7EA6\u4F1A\u9884\u7559\u901A\u52E4\u4E0E\u51C6\u5907\u65F6\u95F4\uFF1B\u4E0A\u8BFE\u65F6\u6BB5\u9ED8\u8BA4\u4E0D\u53EF\u6392\u4EFB\u52A1\uFF1B\u56FE\u4E66\u9986\u95ED\u9986\u4E0E\u5BBF\u820D\u7184\u706F\u53EA\u505A\u63D0\u793A\uFF0C\u4E0D\u5F3A\u5236\u9501\u5B9A\u3002
      </div>
      <div class="row" style="margin-top:10px">
        <a class="btn btn-ghost btn-sm" href="#/me/control">\u53BB\u81EA\u6211\u63A7\u5236</a>
        <a class="btn btn-ghost btn-sm" href="#/work/lab">\u5B9E\u9A8C\u5BA4\u9884\u7EA6</a>
      </div>
    </div>`,e.querySelectorAll(".map-pin").forEach(l=>{l.addEventListener("click",()=>{location.hash=`#/home/campus?c=${l.getAttribute("data-i")}`})})}var oa=.006693421622965943;function Ls(e,a){return!(e>73.66&&e<135.05&&a>.8293&&a<53.55)}function Ms(e,a){let s=-100+2*e+3*a+.2*a*a+.1*e*a+.2*Math.sqrt(Math.abs(e));return s+=(20*Math.sin(6*e*Math.PI)+20*Math.sin(2*e*Math.PI))*2/3,s+=(20*Math.sin(a*Math.PI)+40*Math.sin(a/3*Math.PI))*2/3,s+=(160*Math.sin(a/12*Math.PI)+320*Math.sin(a*Math.PI/30))*2/3,s}function qs(e,a){let s=300+e+2*a+.1*e*e+.1*e*a+.1*Math.sqrt(Math.abs(e));return s+=(20*Math.sin(6*e*Math.PI)+20*Math.sin(2*e*Math.PI))*2/3,s+=(20*Math.sin(e*Math.PI)+40*Math.sin(e/3*Math.PI))*2/3,s+=(150*Math.sin(e/12*Math.PI)+300*Math.sin(e/30*Math.PI))*2/3,s}function Pe(e,a){if(Ls(e,a))return[e,a];let s=Ms(e-105,a-35),t=qs(e-105,a-35),n=a/180*Math.PI,d=Math.sin(n);d=1-oa*d*d;let l=Math.sqrt(d);return s=s*180/(6378245*(1-oa)/(d*l)*Math.PI),t=t*180/(6378245/l*Math.cos(n)*Math.PI),[e+t,a+s]}var We=null;function Ye(){return window.L?Promise.resolve(window.L):We||(We=new Promise((e,a)=>{let s=document.createElement("link");s.rel="stylesheet",s.href="/static/vendor/leaflet/leaflet.css",document.head.appendChild(s);let t=document.createElement("script");t.src="/static/vendor/leaflet/leaflet.js",t.onload=()=>e(window.L),t.onerror=()=>{We=null,a(new Error("\u5730\u56FE\u7EC4\u4EF6\u52A0\u8F7D\u5931\u8D25\uFF0C\u8BF7\u68C0\u67E5\u7F51\u7EDC\u540E\u91CD\u8BD5"))},document.head.appendChild(t)}),We)}ve();var pa=["/static/img/slide-1.jpg","/static/img/slide-2.jpg","/static/img/slide-5.jpg","/static/img/slide-4.jpg","/static/img/slide-6.jpg","/static/img/slide-3.jpg","/static/img/slide-8.jpg","/static/img/slide-7.jpg"],Et=e=>pa[Number(e)%pa.length],Ts="\u65E5\u4E00\u4E8C\u4E09\u56DB\u4E94\u516D",dt=[["08:00","10:00"],["10:00","12:00"],["12:00","14:00"],["14:00","16:00"],["16:00","18:00"],["18:00","20:00"],["20:00","22:00"]];function Ge(e){if(e.length<=1)return!0;let a=[...e].sort();for(let s=1;s<a.length;s+=1)if(a[s].split("-")[0]!==a[s-1].split("-")[1])return!1;return!0}function va(e,a){if(a!==K())return!1;let s=(e||"").split("-")[1]||"23:59",[t,n]=s.split(":").map(Number),d=new Date;return d.getHours()*60+d.getMinutes()>=t*60+n}function As(e,a){if(a!==K())return!1;let[s,t]=(e||"").split(":").map(Number);if(!Number.isFinite(s)||!Number.isFinite(t))return!1;let n=new Date;return n.getHours()*60+n.getMinutes()>=s*60+t}function js(e){let a=[...e].sort();return`${a[0].split("-")[0]}\u2013${a[a.length-1].split("-")[1]}`}function Lt(e,a,s=[]){return`<div class="detail-hero book-hero">
    <div class="detail-art"><svg viewBox="0 0 200 160" fill="none">
      <rect x="34" y="26" width="104" height="112" rx="12" stroke="#8fdcff" stroke-opacity=".45" stroke-width="1.6"/>
      <rect x="34" y="26" width="104" height="26" rx="12" fill="#8fdcff" opacity=".14"/>
      <path d="M56,16 V34 M116,16 V34" stroke="#eaf7ff" stroke-opacity=".6" stroke-width="3" stroke-linecap="round"/>
      <path d="M48,68 H124 M48,84 H124 M48,100 H96" stroke="#fff" stroke-opacity=".32" stroke-width="4" stroke-linecap="round"/>
      <circle cx="156" cy="116" r="22" stroke="#f0cf94" stroke-opacity=".7" stroke-width="1.6"/>
      <path d="M156,104 V116 L164,121" stroke="#f0cf94" stroke-width="2" stroke-linecap="round"/>
      <circle cx="160" cy="30" r="1.8" fill="#dff2ff" opacity=".6"/>
      <circle cx="178" cy="52" r="1.4" fill="#dff2ff" opacity=".5"/>
    </svg></div>
    <div class="tag">BOOKING</div>
    <h1>${e}</h1>
    <p>${a}</p>
    ${s.length?`<div class="bh-stats">${s.map(([t,n])=>`<div class="bh-stat"><b>${t}</b><span>${n}</span></div>`).join("")}</div>`:""}
  </div>`}var Bs='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3h6M10 3v5.5L4.8 18a2.4 2.4 0 0 0 2.1 3.6h10.2a2.4 2.4 0 0 0 2.1-3.6L14 8.5V3"/><path d="M7.5 15h9"/></svg>';function ma(e,{weekdaysOnly:a=!1}={}){let s=[];for(let t=0;t<e;t++){let n=Ue(t),d=new Date(`${n}T00:00:00`).getDay();s.push({date:n,day:String(Number(n.slice(8))),label:t===0?"\u4ECA\u5929":t===1?"\u660E\u5929":`\u5468${Ts[d]}`,weekend:d===0||d===6,disabled:a&&(d===0||d===6)})}return s}function Cs(e,a){return`<div class="date-strip">${e.map(s=>`<button type="button" class="ds-item ${s.date===a?"active":""} ${s.disabled?"disabled":""} ${s.weekend?"weekend":""} ${s.label==="\u4ECA\u5929"?"today":""}" data-date="${s.date}" ${s.disabled?"disabled":""}>
        <span class="ds-week">${s.label}</span><b class="ds-day">${s.day}</b>
      </button>`).join("")}</div>`}function Hs(e,a){e.querySelectorAll(".ds-item:not(.disabled)").forEach(s=>s.addEventListener("click",()=>{e.querySelectorAll(".ds-item").forEach(t=>t.classList.remove("active")),s.classList.add("active"),a(s.dataset.date)}))}function Is(e){let a=Number(e.slice(0,2));return a<12?"\u4E0A\u5348\u573A":a<18?"\u4E0B\u5348\u573A":"\u665A\u95F4\u573A"}function Mt(e){return`<div class="card acc">
    <button type="button" class="acc-head"><b>\u9884\u7EA6\u987B\u77E5</b><span class="acc-arrow">\u25BE</span></button>
    <div class="acc-body" hidden><ul>${e.map(a=>`<li>${a}</li>`).join("")}</ul></div>
  </div>`}function ga(e){e.querySelectorAll(".acc-head").forEach(a=>a.addEventListener("click",()=>{let s=a.nextElementSibling;s.hidden=!s.hidden,a.classList.toggle("open",!s.hidden)}))}function Ns(e,a,s,t){return`<div class="stepper" id="${e}" data-min="${s}" data-max="${t}">
    <button type="button" class="st-btn" data-dir="-1">\u2212</button>
    <span class="st-val">${a}</span>
    <button type="button" class="st-btn" data-dir="1">\uFF0B</button>
  </div>`}function Ds(e,a){let s=e.querySelector(`#${a}`);return s?(s.querySelectorAll(".st-btn").forEach(t=>t.addEventListener("click",()=>{let n=Number(s.querySelector(".st-val").textContent)+Number(t.dataset.dir);n>=Number(s.dataset.min)&&n<=Number(s.dataset.max)&&(s.querySelector(".st-val").textContent=String(n))})),()=>Number(s.querySelector(".st-val").textContent)):()=>1}function Ps(e){let a=e.date||"",s=String(Number(a.slice(8))),t=a===K()?"\u4ECA\u5929":a===Ue(1)?"\u660E\u5929":`${Number(a.slice(5,7))}\u6708`;return`<div class="tl-row">
    <div class="tl-date"><b>${s}</b><span>${t}</span></div>
    <div class="tl-main">
      <div class="tl-title">${i(e.resource_name)}</div>
      <div class="tl-meta">${i(e.room||"\u2014")} \xB7 ${i(e.start_at)}\u2013${i(e.end_at)} \xB7 ${e.people} \u4EBA</div>
    </div>
    <div class="tl-side">${$e(e.status)}</div>
  </div>`}var Rs='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="5" width="17" height="15.5" rx="2.4"/><path d="M3.5 10h17M8 3v4M16 3v4"/><path d="M8 14h3M8 17.2h5"/></svg>',Fs='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M6 11V7a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v4"/><path d="M4 11h16v5H4z"/><path d="M7 16v4M17 16v4"/></svg>',Os='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M5 4h9l5 5v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4Z"/><path d="M14 4v5h5"/><path d="M8.5 13h7M8.5 16.5h4"/></svg>',zs='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="3.6"/><path d="M4.5 20c1.4-3.6 4-5.2 7.5-5.2s6.1 1.6 7.5 5.2"/></svg>';function nt({href:e,tone:a,ico:s,title:t,badge:n,desc:d,stat:l,btn:c}){return`<a class="ze-card" href="${e}">
    <div class="hic ${a}">${s}</div>
    <div class="ze-body">
      <div class="ze-name">${t}${n?`<span class="hb">${n}</span>`:""}</div>
      <div class="ze-desc">${d}</div>
      <div class="ze-stat">${l}</div>
    </div>
    <span class="ze-cta">${c} \u203A</span>
  </a>`}async function ba(e,a){let[s,t,n,d]=await Promise.all([m.get("/resources?type=classroom").catch(()=>[]),m.get("/library/areas").catch(()=>[]),m.get("/bookings/my").catch(()=>[]),m.get("/self/control/overview").catch(()=>null)]);e.style.removeProperty("padding-bottom");let l=K(),c=n.filter(E=>E.date>=l&&!["cancelled","rejected","completed","no_show"].includes(E.status)).sort((E,k)=>(E.date+E.start_at).localeCompare(k.date+k.start_at)),r=n.filter(E=>E.status==="pending_approval").length,o=t.reduce((E,k)=>E+k.available,0),h=d&&Array.isArray(d.tasks)?d.tasks.length:0,_=d?d.focus.minutes:0;e.innerHTML=`
    ${Lt("\u5DE5\u4F5C\u533A","\u7A7A\u6559\u5BA4\u3001\u56FE\u4E66\u9986\u3001\u6587\u4EF6\u5904\u7406\u4E0E\u4E2A\u4EBA\u4E8B\u52A1\uFF0C\u5404\u81EA\u72EC\u7ACB\u5165\u53E3\u3002",[[s.length,"\u95F4\u6559\u5BA4"],[o,"\u4E2A\u7A7A\u5EA7"],[h,"\u4ECA\u65E5\u5F85\u529E"]])}

    <div class="ze-grid">
      ${nt({href:"#/work/classroom",tone:"g",ico:Rs,title:"\u7A7A\u6559\u5BA4\u9884\u7EA6",badge:`${s.length} \u95F4`,desc:"\u6559\u5BA4 \xD7 \u8282\u6B21\u5360\u7528\u77E9\u9635\uFF0C\u5DE5\u4F5C\u65E5\u665A\u95F4\u4E0E\u5468\u672B\u53EF\u501F",stat:"\u63D0\u4EA4\u540E\u9700\u7BA1\u7406\u5458\u5BA1\u6279 \xB7 18:30\u201320:40 \u53EF\u7EA6",btn:"\u53BB\u9884\u7EA6"})}
      ${nt({href:"#/work/library",tone:"b",ico:Fs,title:"\u56FE\u4E66\u9986\u9884\u7EA6",badge:`${o} \u5EA7\u53EF\u7EA6`,desc:"\u5E38\u7528\u5EA7\u4F4D\u76F4\u8FBE \xB7 \u516D\u4E2A\u9605\u89C8\u5BA4 \xB7 \u5E73\u9762\u56FE\u9009\u5EA7",stat:"08:00\u201322:00 \xB7 \u9009\u5EA7\u5373\u65F6\u786E\u8BA4 \xB7 15 \u5206\u949F\u5185\u7B7E\u5230",btn:"\u53BB\u9009\u5EA7"})}
      ${nt({href:"#/office",tone:"v",ico:Os,title:"\u6587\u4EF6\u8BC6\u522B",badge:"",desc:"\u5B57\u6BB5\u63D0\u53D6 \xB7 \u89C4\u5219\u751F\u6210 \xB7 \u6279\u91CF\u6838\u67E5",stat:"\u652F\u6301 PDF \xB7 \u626B\u63CF\u4EF6 \xB7 Word \xB7 Excel",btn:"\u53BB\u8BC6\u522B"})}
      ${nt({href:"#/me",tone:"p",ico:zs,title:"\u4E2A\u4EBA\u7BA1\u7406",badge:"",desc:"\u9884\u7EA6\u8BB0\u5F55 \xB7 \u7B7E\u5230 \xB7 \u5F85\u529E\u4E0E\u4E13\u6CE8\u7EDF\u8BA1",stat:`\u4ECA\u65E5\u5F85\u529E <b>${h}</b> \u9879 \xB7 \u4E13\u6CE8 <b>${_}</b> \u5206\u949F`,btn:"\u53BB\u770B\u770B"})}
    </div>

    <div class="section-title">\u6211\u7684\u8FD1\u671F\u9884\u7EA6${r?` <span class="tag tag-gold">${r} \u6761\u5F85\u5BA1\u6279</span>`:""}</div>
    <div class="card bk-list">
      ${c.length?c.slice(0,5).map(Ps).join(""):'<div class="bk-empty"><b>\u8FD1\u671F\u6682\u65E0\u9884\u7EA6</b><span>\u4ECE\u4E0A\u65B9\u7A7A\u6559\u5BA4\u6216\u56FE\u4E66\u9986\u5165\u53E3\u5F00\u59CB\u9884\u7EA6\u3002</span></div>'}
      ${c.length?'<div class="bk-more"><a href="#/me">\u5168\u90E8\u9884\u7EA6\u8BB0\u5F55 \u203A</a></div>':""}
    </div>`}async function fa(e,a){let s=await m.get("/resources?type=lab");e.style.removeProperty("padding-bottom"),e.innerHTML=`    ${Lt("\u5B9E\u9A8C\u5BA4\u9884\u7EA6","\u5B9E\u9A8C\u5BA4\u4EC5\u5DE5\u4F5C\u65E5\u5F00\u653E\uFF0C\u63D0\u4EA4\u540E\u9700\u7BA1\u7406\u5458\u5BA1\u6279\u3002\u5730\u70B9\u3001\u8BBE\u5907\u4E0E\u9762\u5411\u5B66\u9662\u4EE5\u5B9E\u9A8C\u5BA4\u7BA1\u7406\u5904\u6570\u636E\u4E3A\u51C6\u3002",[[s.length,"\u95F4\u5B9E\u9A8C\u5BA4"],["08:00\u201317:10","\u5DE5\u4F5C\u65E5\u5F00\u653E"],["\u9700\u5BA1\u6279","\u63D0\u4EA4\u540E\u7BA1\u7406\u5458\u786E\u8BA4"]])}
    <div class="toolbar"><input class="input search-input" id="labSearch" placeholder="\u641C\u7D22\u5B9E\u9A8C\u5BA4\u540D\u79F0\u6216\u8BBE\u5907\u2026">
      </div>
    <div id="labList" class="card bk-list">${s.map(labRow).join("")}</div>
    ${Mt(["\u5B9E\u9A8C\u5BA4\u4EC5\u5DE5\u4F5C\u65E5 08:00\u201317:10 \u5F00\u653E\uFF0C\u5468\u672B\u4E0E\u6CD5\u5B9A\u8282\u5047\u65E5\u4E0D\u5F00\u653E\u3002","\u8FDB\u5165\u5B9E\u9A8C\u5BA4\u987B\u9075\u5B88\u5B89\u5168\u89C4\u7A0B\uFF0C\u90E8\u5206\u8BBE\u5907\u9700\u6301\u8BC1\u64CD\u4F5C\u3002","\u9884\u7EA6\u63D0\u4EA4\u540E\u9700\u7BA1\u7406\u5458\u5BA1\u6279\uFF0C\u5BA1\u6279\u7ED3\u679C\u5C06\u5728\u6D88\u606F\u4E2D\u5FC3\u901A\u77E5\u3002"])}`;let t=e.querySelector("#labList");function n(){t.querySelectorAll("[data-book]").forEach(d=>{d.addEventListener("click",()=>{location.hash=`#/work/lab/book?id=${d.getAttribute("data-book")}`}),d.addEventListener("keydown",l=>{l.key==="Enter"&&(location.hash=`#/work/lab/book?id=${d.getAttribute("data-book")}`)})})}n(),ga(e),e.querySelector("#labSearch").addEventListener("input",d=>{let l=d.target.value.trim(),c=s.filter(r=>r.name.includes(l)||(r.description||"").includes(l));t.innerHTML=c.length?c.map(labRow).join(""):'<div class="bk-empty"><b>\u6CA1\u6709\u5339\u914D\u7684\u5B9E\u9A8C\u5BA4</b><span>\u6362\u4E2A\u5173\u952E\u8BCD\u8BD5\u8BD5</span></div>',n()})}function Vs(e,a){let s=e.status==="closed",t=e.status==="occupied",n=!s&&!t&&e.remaining<=0,d=!s&&!t&&!n,l=s?"closed":t?"occupied":n?"full":"open",c=s?"\u4E0D\u5F00\u653E":t?"\u5DF2\u5360\u7528":n?"\u5DF2\u7EA6\u6EE1":"\u53EF\u9884\u7EA6",r=Math.max(0,a-e.remaining),o=d?`\u5269\u4F59 <b>${e.remaining}</b> \u4E2A\u540D\u989D${r>0?` \xB7 \u5DF2\u7EA6 ${r}`:" \xB7 \u5F53\u524D\u65E0\u4EBA\u9884\u7EA6"}`:s?"\u8BE5\u65F6\u6BB5\u4E0D\u5F00\u653E\uFF0C\u8BF7\u9009\u62E9\u5176\u4ED6\u65E5\u671F":t?"\u5DF2\u88AB\u6559\u5B66\u5B89\u6392\u5360\u7528":"\u540D\u989D\u5DF2\u6EE1\uFF0C\u53EF\u5C1D\u8BD5\u5176\u4ED6\u65F6\u6BB5";return`<div class="slot-card ${l}" ${d?`data-start="${e.start_at}" data-end="${e.end_at}" role="button" tabindex="0"`:""}>
    <span class="sc-rail"></span>
    <div class="sc-inner">
      <div class="sc-top"><span class="sc-name">${Is(e.start_at)}</span><span class="sc-state"><i></i>${c}</span></div>
      <div class="sc-time">${i(e.start_at)}<i>\u2013</i>${i(e.end_at)}</div>
      <div class="sc-foot">${o}</div>
    </div>
  </div>`}async function ya(e,a){let s=a.params.get("id");if(!s){location.hash="#/work/lab";return}let t;try{t=await m.get(`/resources/${s}`)}catch{e.innerHTML=`<div class="empty" style="margin-top:40px"><strong>\u5B9E\u9A8C\u5BA4\u4E0D\u5B58\u5728\u6216\u5DF2\u4E0B\u7EBF</strong>
      <div style="margin-top:10px"><a class="btn btn-ghost btn-sm" href="#/work/lab">\u2039 \u8FD4\u56DE\u5B9E\u9A8C\u5BA4\u5217\u8868</a></div></div>`;return}if(t.type!=="lab"){location.hash="#/work/lab";return}let n=ma(14,{weekdaysOnly:!0}),d=n.find(f=>!f.disabled),l=d?d.date:K(),c=null;e.innerHTML=`
        <div class="page-head">
      <div><div class="page-title">${i(t.name)}</div>
      <div class="page-sub">${i(t.place||"")} ${i(t.room||"")} \xB7 \u5BB9\u91CF ${t.capacity} \u4EBA \xB7 ${t.approval_required?"\u63D0\u4EA4\u540E\u9700\u7BA1\u7406\u5458\u5BA1\u6279":"\u63D0\u4EA4\u540E\u5373\u65F6\u786E\u8BA4"}</div></div>
      <a class="btn btn-ghost btn-sm" href="#/work/lab">\u2039 \u8FD4\u56DE\u5217\u8868</a>
    </div>

    <div class="card bk-venue">
      <div class="bv-ico">${Bs}</div>
      <div class="bv-main">
        <div class="bv-name">${i(t.name)}</div>
        <div class="bv-meta">${i(t.description||"")}${t.data_note?`<br>${i(t.data_note)}`:""}</div>
        <div class="bv-tags">
          ${t.equipment?`<span class="tag">${i(t.equipment)}</span>`:""}
          <span class="tag tag-blue">\u9762\u5411\uFF1A${i(t.audience)}</span>
          ${t.approval_required?'<span class="tag tag-gold">\u9700\u5BA1\u6279</span>':'<span class="tag tag-green">\u5373\u65F6\u786E\u8BA4</span>'}
        </div>
      </div>
    </div>

    <div class="section-title">\u9009\u62E9\u65E5\u671F <span class="title-hint">\u5B9E\u9A8C\u5BA4\u4EC5\u5DE5\u4F5C\u65E5\u5F00\u653E\uFF0C\u53EF\u63D0\u524D ${t.advance_days} \u5929</span></div>
    ${Cs(n,l)}

    <div class="section-title">\u9009\u62E9\u65F6\u6BB5 <span class="title-hint">\u70B9\u51FB\u65F6\u6BB5\u5361\u7247\u9009\u4E2D</span></div>
    <div id="slotCards" class="slot-cards"><div class="muted" style="padding:18px 4px">\u52A0\u8F7D\u4E2D\u2026</div></div>

    <div class="section-title">\u9884\u7EA6\u4FE1\u606F</div>
    <div class="card bk-form">
      <div class="bf-row"><span class="bf-label">\u4EBA\u6570</span>${Ns("bkPeople",Math.min(4,t.capacity),1,t.capacity)}</div>
      <div class="bf-row"><span class="bf-label">\u7528\u9014</span><input class="input" id="bkPurpose" placeholder="\u4F8B\u5982\uFF1A\u8BFE\u7A0B\u5B9E\u9A8C / \u5C0F\u7EC4\u8BA8\u8BBA / \u7ADE\u8D5B\u5907\u8D5B"></div>
    </div>

    ${Mt([`\u5F00\u653E\u65F6\u95F4\uFF1A\u5DE5\u4F5C\u65E5 08:00\u201317:10\uFF0C\u53EF\u63D0\u524D ${t.advance_days} \u5929\u9884\u7EA6\u3002`,`\u5BA1\u6279\u89C4\u5219\uFF1A${t.approval_required?"\u63D0\u4EA4\u540E\u8FDB\u5165\u5F85\u5BA1\u6279\u72B6\u6001\uFF0C\u7BA1\u7406\u5458\u901A\u8FC7\u540E\u751F\u6548\u3002":"\u63D0\u4EA4\u540E\u5373\u65F6\u786E\u8BA4\uFF0C\u76F4\u63A5\u5360\u7528\u8BE5\u65F6\u6BB5\u3002"}`,"\u7B7E\u5230\u89C4\u5219\uFF1A\u8BF7\u5728\u9884\u7EA6\u5F00\u59CB\u540E 15 \u5206\u949F\u5185\u7B7E\u5230\uFF0C\u8D85\u65F6\u81EA\u52A8\u91CA\u653E\u3002","\u53D6\u6D88\u89C4\u5219\uFF1A\u5982\u65E0\u6CD5\u6309\u65F6\u4F7F\u7528\u8BF7\u63D0\u524D\u53D6\u6D88\uFF0C\u7D2F\u8BA1 3 \u6B21\u8FDD\u7EA6\u5C06\u9650\u5236\u9884\u7EA6 7 \u5929\u3002"])}

    <div class="bk-bar" id="bkBar">
      <div class="bkb-info" id="bkbInfo">\u8BF7\u9009\u62E9\u65E5\u671F\u4E0E\u65F6\u6BB5</div>
      <button class="btn btn-primary bkb-btn" id="bkbSubmit" disabled>\u63D0\u4EA4\u9884\u7EA6</button>
    </div>`,e.style.paddingBottom="110px",ga(e);let r=Ds(e,"bkPeople"),o=e.querySelector("#slotCards"),h=e.querySelector("#bkbInfo"),_=e.querySelector("#bkbSubmit");function E(){c?(h.innerHTML=`<b>${l}</b> ${c.start}\u2013${c.end}<span class="bkb-sub">${i(t.name)} \xB7 ${r()} \u4EBA</span>`,_.disabled=!1):(h.textContent="\u8BF7\u9009\u62E9\u65E5\u671F\u4E0E\u65F6\u6BB5",_.disabled=!0)}async function k(){c=null,E(),o.innerHTML='<div class="muted" style="padding:18px 4px">\u52A0\u8F7D\u4E2D\u2026</div>';try{let f=await m.get(`/resources/${s}/slots?date=${l}`);if(!f.length){o.innerHTML='<div class="card bk-empty"><b>\u5F53\u65E5\u65E0\u53EF\u7EA6\u65F6\u6BB5</b><span>\u8BE5\u65E5\u671F\u4E0D\u5F00\u653E\u6216\u65F6\u6BB5\u5DF2\u5168\u90E8\u7ED3\u675F\uFF0C\u8BF7\u6362\u4E00\u4E2A\u65E5\u671F\u3002</span></div>';return}o.innerHTML=f.map(M=>Vs(M,t.capacity)).join(""),o.querySelectorAll(".slot-card.open").forEach(M=>{M.addEventListener("click",()=>{o.querySelectorAll(".slot-card").forEach(q=>q.classList.remove("picked")),M.classList.add("picked"),c={start:M.dataset.start,end:M.dataset.end},E()})})}catch(f){o.innerHTML=`<div class="card bk-empty"><b>\u65F6\u6BB5\u52A0\u8F7D\u5931\u8D25</b><span>${i(f.message)}</span></div>`}}Hs(e,f=>{l=f,k()}),_.addEventListener("click",async()=>{if(c){_.disabled=!0,_.textContent="\u63D0\u4EA4\u4E2D\u2026";try{let f=await m.post("/bookings",{resource_id:Number(s),date:l,start_at:c.start,end_at:c.end,people:r(),purpose:e.querySelector("#bkPurpose").value||"\u4E2A\u4EBA\u4F7F\u7528"});v(f.status==="pending_approval"?"\u5DF2\u63D0\u4EA4\u5BA1\u6279\uFF0C\u7B49\u5F85\u7BA1\u7406\u5458\u5904\u7406":"\u9884\u7EA6\u6210\u529F","success"),setTimeout(()=>location.hash="#/work",700)}catch(f){v(f.message,"error"),_.disabled=!1,_.textContent="\u63D0\u4EA4\u9884\u7EA6"}}}),await k()}async function ha(e,a){let s=await m.get("/home").catch(()=>null),t=s&&s.week?s.week.week:1,n=s&&s.week&&s.week.week_start?s.week.week_start:K(),d=new Date(n+"T00:00:00");d.setDate(d.getDate()+(t-1)*7);let l=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`,c=new Date,r=new Date,o=new Date(r);o.setDate(r.getDate()+(7-r.getDay())%7);let h=c.getDay()===0&&c.getHours()>=20,_=[{key:"current",label:`\u7B2C ${t} \u5468\uFF08\u672C\u5468\uFF09`,offset:0,locked:!1},{key:"next",label:`\u7B2C ${t+1} \u5468\uFF08\u4E0B\u5468\uFF09`,offset:7,locked:!h}],E="current",k=K(),f=null;e.innerHTML=`    ${Lt("\u7A7A\u6559\u5BA4\u9884\u7EA6","\u4EE5\u5468\u6B21\u4E3A\u5355\u4F4D\uFF1A\u672C\u5468\u968F\u65F6\u53EF\u7EA6\uFF0C\u5468\u65E5 20:00 \u89E3\u9501\u4E0B\u5468\uFF1B\u5168\u5929\u4E94\u4E2A\u8282\u6B21\uFF0C\u63D0\u4EA4\u5373\u786E\u8BA4\uFF08\u65E0\u9700\u5BA1\u6279\uFF09\u3002",[["\u5468\u6B21\u5236","\u5468\u65E5 20:00 \u89E3\u9501\u4E0B\u5468"],["\u5168\u5929","\u8282\u6B21\u53EF\u7EA6"],["\u514D\u5BA1\u6279","\u63D0\u4EA4\u5373\u786E\u8BA4"]])}
    <div class="week-switch" id="weekSwitch">
      ${_.map(L=>`<button class="week-chip ${L.key===E?"on":""}" data-week="${L.key}" data-offset="${L.offset}" ${L.locked?'data-locked="1"':""}>
            ${L.label}${L.locked?" \u{1F512}":""}
          </button>`).join("")}
      <span class="week-hint" id="weekHint"></span>
    </div>
    <div class="date-strip" id="dateStrip"></div>
    <div class="legend" style="margin-bottom:10px">
      <span><i class="cell-legend cell-free"></i>\u53EF\u7EA6</span>
      <span><i class="cell-legend cell-occupied"></i>\u5DF2\u5360\u7528</span>
      <span><i class="cell-legend cell-mine"></i>\u6211\u7EA6\u7684</span>
      <span><i class="cell-legend cell-full"></i>\u5DF2\u6EE1</span>
    </div>
    <div id="gridBox"><div class="muted">\u52A0\u8F7D\u4E2D\u2026</div></div>
    <div class="grid-bar" id="gridBar" hidden>
      <div class="grid-bar-info" id="gridBarInfo"></div>
      <input class="input" id="gridPurpose" placeholder="\u9884\u7EA6\u539F\u56E0\uFF08\u5FC5\u586B\uFF0C\u514D\u5BA1\u6279\u7559\u75D5\uFF09" style="width:230px" maxlength="60">
      <span style="font-size:12.5px;color:var(--text-2);white-space:nowrap">\u9884\u7EA6\u4EBA\u6570</span>
      <input class="input" type="number" id="gridPeople" min="1" value="4" placeholder="\u586B\u5199\u4EBA\u6570" style="width:90px">
      <button class="btn btn-primary" id="gridSubmit">\u63D0\u4EA4\u9884\u7EA6</button>
    </div>`;let M=L=>e.querySelector(L),q=M("#gridBox"),U=M("#gridBar"),u=M("#dateStrip"),p=M("#weekHint"),b=["1-2\u8282","3-4\u8282","5-6\u8282","7-8\u8282","\u665A\u95F4"];function S(L){let w=[],x=N=>`${N.getFullYear()}-${String(N.getMonth()+1).padStart(2,"0")}-${String(N.getDate()).padStart(2,"0")}`;for(let N=0;N<7;N++){let H=new Date(l+"T00:00:00");H.setDate(H.getDate()+L+N);let D=x(H);w.push({iso:D,label:"\u4E00\u4E8C\u4E09\u56DB\u4E94\u516D\u65E5"[N],isToday:D===K(),past:D<K()})}return w}function y(){let w=S(E==="next"?7:0);u.innerHTML=w.map(x=>{let N=x.past||E==="next"&&!h;return`<button class="date-chip ${x.iso===k?"on":""} ${N?"past":""}" data-date="${x.iso}" ${N?"disabled":""}>
          <span class="dc-lb">${x.label}</span><span class="dc-dt">${x.iso.slice(5).replace("-","/")}</span>
          ${x.isToday?'<span class="dc-today">\u4ECA\u5929</span>':""}
        </button>`}).join(""),u.querySelectorAll("[data-date]").forEach(x=>x.addEventListener("click",()=>{k=x.getAttribute("data-date"),y(),g()}))}async function g(){q.innerHTML='<div class="muted">\u52A0\u8F7D\u4E2D\u2026</div>',U.hidden=!0,f=null;try{let L=await m.get(`/classrooms/grid?date=${k}`);q.innerHTML=`
        <div class="card" style="padding:0;overflow:auto">
          <table class="grid-table">
            <thead><tr><th class="gt-room-col">\u6559\u5BA4 \xB7 ${i(k)}</th>
              ${L.periods.map(w=>`<th>${i(w.label)}<div class="gt-time">${w.start}\u2013${w.end}</div></th>`).join("")}</tr></thead>
            <tbody>
              ${L.rooms.map(w=>`<tr>
                    <td class="gt-room"><strong>${i(w.room)}</strong><div class="gt-meta">${w.capacity} \u5EA7 \xB7 ${i(w.equipment||"")}</div></td>
                    ${w.cells.map(x=>{let N=x.status==="free"&&As(x.start,k),H=x.status==="free"&&!N,D=N?"\u5DF2\u8FC7":x.status==="mine"?"\u6211\u7EA6\u7684":x.status==="course"||x.status==="booked"?"\u5DF2\u5360\u7528":x.status==="closed"?"\u4E0D\u5F00\u653E":x.status==="full"?"\u5DF2\u6EE1":x.text||"\u53EF\u7EA6";return`<td class="gt-cell cell-${N?"past":x.status==="course"||x.status==="booked"||x.status==="closed"?"occupied":x.status}" ${H?`data-room="${w.id}" data-rname="${i(w.room)}" data-start="${x.start}" data-end="${x.end}" data-period="${i(x.period)}"`:""} title="${i(w.room)} ${i(x.period)}\uFF1A${N?"\u8BE5\u8282\u6B21\u5DF2\u5F00\u59CB\uFF0C\u4E0D\u53EF\u9884\u7EA6":i(x.text)}">${D}</td>`}).join("")}
                  </tr>`).join("")}
            </tbody>
          </table>
        </div>`,q.querySelectorAll(".cell-free").forEach(w=>{w.addEventListener("click",()=>{q.querySelectorAll(".cell-free").forEach(x=>x.classList.remove("cell-picked")),w.classList.add("cell-picked"),f={roomId:w.dataset.room,name:w.dataset.rname,start:w.dataset.start,end:w.dataset.end,period:w.dataset.period},M("#gridBarInfo").innerHTML=`\u5DF2\u9009\uFF1A<strong>${i(f.name)}</strong> \xB7 ${i(k)} ${i(f.period)}\uFF08${f.start}\u2013${f.end}\uFF09`,U.hidden=!1})})}catch(L){q.innerHTML=`<div class="muted">${i(L.message)}</div>`}}e.querySelectorAll("[data-week]").forEach(L=>{L.addEventListener("click",()=>{if(L.dataset.locked){let D=h?0:Math.ceil((new Date(o.getFullYear(),o.getMonth(),o.getDate(),20,0)-c)/36e5);p.textContent=`\u4E0B\u5468\u9884\u7EA6\u5C06\u4E8E\u5468\u65E5 20:00 \u5F00\u653E\uFF08\u7EA6 ${D} \u5C0F\u65F6\u540E\uFF09`,setTimeout(()=>p.textContent="",4e3);return}e.querySelectorAll("[data-week]").forEach(D=>D.classList.remove("on")),L.classList.add("on"),E=L.dataset.week;let x=S(E==="next"?7:0),N=x.find(D=>D.isToday),H=x.find(D=>!D.past);k=N?N.iso:H?H.iso:x[6].iso,y(),g()})}),M("#gridSubmit").addEventListener("click",async()=>{if(!f)return;let L=(M("#gridPurpose").value||"").trim();if(!L){v("\u8BF7\u586B\u5199\u9884\u7EA6\u539F\u56E0\uFF08\u514D\u5BA1\u6279\uFF0C\u5C06\u8BB0\u5F55\u7559\u75D5\uFF09","error"),M("#gridPurpose").focus();return}let w=M("#gridSubmit");w.disabled=!0;try{let x=await m.post("/bookings",{resource_id:Number(f.roomId),date:k,start_at:f.start,end_at:f.end,people:Number(M("#gridPeople").value||1),purpose:L});v(x.status==="confirmed"?"\u9884\u7EA6\u6210\u529F\uFF01":"\u5DF2\u63D0\u4EA4","success"),await g()}catch(x){v(x.message,"error")}finally{w.disabled=!1}}),y(),await g()}async function $a(e,a){let s=ma(3),t=(a&&a.params&&a.params.get("tab"))==="checkin"?"checkin":"seat",n=K(),d=[],l=[];e.innerHTML=`
    <div class="lib-tabs">
      <button class="lt-tab ${t==="seat"?"on":""}" data-lt="seat">\u{1FA91} \u9009\u5EA7</button>
      <button class="lt-tab ${t==="checkin"?"on":""}" data-lt="checkin">\u{1F4CD} \u5B9A\u4F4D\u7B7E\u5230</button>
          </div>
    <div id="libBody"></div>`;let c=e.querySelector("#libBody");e.querySelectorAll("[data-lt]").forEach(u=>u.addEventListener("click",()=>{t=u.dataset.lt,e.querySelectorAll("[data-lt]").forEach(p=>p.classList.toggle("on",p.dataset.lt===t)),U()}));async function r(){if(!d.length){l=[];return}try{l=await m.get(`/library/favorites?date=${n}&start=${d[0].split("-")[0]}&end=${d[0].split("-")[1]}`)}catch{l=[]}}async function o(){await r(),c.innerHTML=`
      <div class="fs-box" id="favBox"><div class="muted" style="padding:12px 4px">\u5E38\u7528\u5EA7\u4F4D\u52A0\u8F7D\u4E2D\u2026</div></div>
      <div class="section-title">\u9009\u62E9\u65E5\u671F <span class="title-hint">\u4EC5\u53EF\u9884\u7EA6\u4ECA\u5929\u4E0E\u540E\u4E24\u5929</span></div>
      <div class="date-strip" id="dateStrip"></div>
      <div class="section-title">\u9009\u62E9\u65F6\u6BB5 <span class="title-hint">\u6700\u591A\u53EF\u9009 3 \u4E2A\uFF0C\u4E00\u6B21\u9884\u7EA6</span></div>
      <div class="pill-strip" id="libSlots"></div>
      <div class="section-title">\u9009\u62E9\u9605\u89C8\u5BA4 <span class="title-hint">\u4F59\u91CF\u5B9E\u65F6\u66F4\u65B0</span></div>
      <div id="roomList" class="room-list-v2"><div class="muted" style="padding:18px 4px">\u52A0\u8F7D\u4E2D\u2026</div></div>
      ${Mt(["08:00\u201322:00 \u5F00\u653E\uFF0C\u5F00\u9986\u524D\u53EF\u63D0\u524D 2 \u5C0F\u65F6\u9884\u8BA2\u5F53\u65E5\u5EA7\u4F4D\u3002","\u9884\u7EA6\u6210\u529F\u540E\u8BF7\u5728 15 \u5206\u949F\u5185\u5B9A\u4F4D\u7B7E\u5230\uFF1B\u6BCF\u6B21\u9884\u7EA6\u6700\u591A 2 \u6B21\u6682\u79BB\uFF0C\u6BCF\u6B21\u987B\u5728 30 \u5206\u949F\u5185\u56DE\u9986\u518D\u6B21\u5B9A\u4F4D\u7B7E\u5230\u3002","\u5168\u9986\u4F59\u5EA7\u4F4E\u4E8E 20% \u65F6\uFF0C\u53EF\u5728\u300C\u5B9A\u4F4D\u7B7E\u5230\u300D\u9875\u5BF9\u5DF2\u9884\u7EA6\u4F46\u65E0\u4EBA\u4F7F\u7528\u7684\u5EA7\u4F4D\u53D1\u8D77\u76D1\u7763\u5360\u5EA7\u3002"])}`;let u=e.querySelector("#roomList"),p=e.querySelector("#favBox"),b=e.querySelector("#dateStrip"),S=e.querySelector("#libSlots");function y(){S.innerHTML=dt.map(x=>{let N=x.join("-"),H=va(N,n);return`<button type="button" class="pill ${d.includes(N)?"active":""} ${H?"past":""}" data-slot="${N}" ${H?"disabled":""} title="${H?"\u8BE5\u65F6\u6BB5\u5DF2\u8FC7\uFF0C\u65E0\u6CD5\u9884\u7EA6":""}">${x[0]}\u2013${x[1]}</button>`}).join(""),S.querySelectorAll(".pill:not([disabled])").forEach(x=>x.addEventListener("click",async()=>{let N=x.dataset.slot,H=d.indexOf(N);if(H>=0){let D=d.filter(A=>A!==N);if(!Ge(D)){v("\u79FB\u9664\u4E2D\u95F4\u65F6\u6BB5\u4F1A\u65AD\u5F00\u8FDE\u7EED\u65F6\u957F\uFF0C\u8BF7\u4ECE\u4E24\u7AEF\u79FB\u9664","error");return}d.splice(H,1)}else{if(d.length>=3){v("\u4E00\u6B21\u6700\u591A\u9009 3 \u4E2A\u65F6\u6BB5","error");return}if(!Ge([...d,N])){v("\u65F6\u6BB5\u5FC5\u987B\u8FDE\u7EED\u9009\u62E9\uFF08\u5982 08:00\u201312:00 \u4E00\u6574\u6BB5\uFF09","error");return}d.push(N)}y(),await r(),L(),w()}))}function g(){b.innerHTML=s.map(x=>{let N=x.date<K();return`<button class="date-chip ${x.date===n?"on":""} ${N?"past":""}" data-date="${x.date}" ${N?"disabled":""}>
            <span class="dc-lb">${x.label}</span><span class="dc-dt">${x.date.slice(5).replace("-","/")}</span>
            ${x.date===K()?'<span class="dc-today">\u4ECA\u5929</span>':""}
          </button>`}).join(""),b.querySelectorAll("[data-date]").forEach(x=>x.addEventListener("click",async()=>{n=x.getAttribute("data-date"),d=[],g(),y(),await r(),L(),w()}))}function L(){if(!d.length){p.innerHTML=`
          <div class="fs-head-row"><b>\u2B50 \u5E38\u7528\u5EA7\u4F4D</b><span>\u5148\u9009\u62E9\u65F6\u6BB5\u540E\u67E5\u770B\u53EF\u7EA6\u72B6\u6001</span></div>
          <div class="fs-empty">\u5F53\u524D\u672A\u9009\u62E9\u65F6\u6BB5\u3002\u9009\u62E9\u4E0B\u65B9\u65F6\u6BB5\u540E\uFF0C\u8FD9\u91CC\u4F1A\u663E\u793A\u5E38\u7528\u5EA7\u4F4D\u662F\u5426\u53EF\u4EE5\u9884\u7EA6\u3002</div>`;return}if(!l.length){p.innerHTML=`
          <div class="fs-head-row"><b>\u2B50 \u5E38\u7528\u5EA7\u4F4D</b><span>\u5728\u5E73\u9762\u56FE\u4E0A\u9009\u4E2D\u5EA7\u4F4D\u540E\u53EF\u8BBE\u4E3A\u5E38\u7528</span></div>
          <div class="fs-empty">\u8FD8\u6CA1\u6709\u5E38\u7528\u5EA7\u4F4D\u3002\u9009\u8FC7\u4E00\u6B21\u5EA7\uFF0C\u4E0B\u6B21\u4E00\u952E\u76F4\u8FBE\u8001\u4F4D\u7F6E\u3002</div>`;return}p.innerHTML=`
        <div class="fs-head-row"><b>\u2B50 \u5E38\u7528\u5EA7\u4F4D</b><span>\u70B9\u51FB\u76F4\u8FBE\u9009\u5EA7 \xB7 ${n}</span></div>
        <div class="fs-grid">
          ${l.map(x=>`<a class="fs-card ${x.available?"":"fs-occupied"}" href="#/work/library/room?area=${encodeURIComponent(x.room)}&date=${n}&start=${d[0].split("-")[0]}&end=${d[0].split("-")[1]}&seat=${x.seat_id}">
                <div class="fs-head"><span class="fs-room">${i(x.room.split("(")[0])}</span>
                  <span class="fs-state">${x.available?"\u53EF\u9884\u7EA6":"\u5F53\u524D\u65F6\u6BB5\u5DF2\u5360\u7528"}</span></div>
                <div class="fs-seat"><b>${i(x.seat_no)}</b> \u53F7\u5EA7\u4F4D${x.power?" \u{1F50C}":""}${x.window?" \u{1FA9F}":""}</div>
                <div class="fs-meta">${x.available?"\u6211\u7684\u5E38\u7528\u5EA7\u4F4D":"\u6362\u4E2A\u65F6\u6BB5\u53EF\u80FD\u53EF\u7EA6"}</div>
              </a>`).join("")}
        </div>`}async function w(){if(!d.length){u.innerHTML='<div class="bk-empty"><b>\u8BF7\u5148\u9009\u62E9\u65F6\u6BB5</b><span>\u9009\u62E9\u8FDE\u7EED\u65F6\u6BB5\u540E\uFF0C\u4F1A\u663E\u793A\u5404\u9605\u89C8\u5BA4\u7684\u4F59\u91CF\u3002</span></div>';return}u.innerHTML='<div class="muted" style="padding:18px 4px">\u52A0\u8F7D\u4E2D\u2026</div>';try{let x=await Promise.all(d.map(H=>m.get(`/library/areas?date=${n}&start=${H.split("-")[0]}&end=${H.split("-")[1]}`))),N={};x.forEach(H=>H.forEach(D=>{N[D.name]=N[D.name]||{total:D.total,min:D.available},N[D.name].min=Math.min(N[D.name].min,D.available)})),u.innerHTML=Object.entries(N).map(([H,D])=>{let A=D.min/D.total<.2,z=d.join(",");return`<a class="rl-row" href="${`#/work/library/room?area=${encodeURIComponent(H)}&date=${n}&slots=${z}`}">
              <div class="rl-main">
                <div class="rl-name">${i(H)}${A?'<span class="tag tag-tight">\u7D27\u5F20</span>':""}</div>
                <div class="rl-meta">8:00 - 22:00 \u5F00\u9986\u524D\u53EF\u63D0\u524D <b>2\u5C0F\u65F6</b> \u9884\u8BA2 \xB7 \u5DF2\u9009 ${d.length} \u4E2A\u65F6\u6BB5</div>
              </div>
              <div class="rl-avail ${A?"tight":""}"><b>${D.min}</b><span>/\u53EF\u9009</span></div>
              <span class="rl-go">\u203A</span>
            </a>`}).join("")}catch(x){u.innerHTML=`<div class="bk-empty"><b>\u9605\u89C8\u5BA4\u52A0\u8F7D\u5931\u8D25</b><span>${i(x.message)}</span></div>`}}g(),y(),L(),w()}function h(){c.innerHTML='<div class="muted" style="padding:18px 4px">\u52A0\u8F7D\u4E2D\u2026</div>',M()}function _(){let u=new Date,p=u.getHours()*60+u.getMinutes();return(dt.find(([S,y])=>{let[g,L]=S.split(":").map(Number),[w,x]=y.split(":").map(Number);return p>=g*60+L&&p<w*60+x})||dt[0]).join("-")}function E(){return new Promise((u,p)=>{if(!navigator.geolocation)return p(new Error("\u5F53\u524D\u6D4F\u89C8\u5668\u4E0D\u652F\u6301\u5B9A\u4F4D"));navigator.geolocation.getCurrentPosition(b=>u(b.coords),b=>p(new Error(b&&b.code===1?"\u5B9A\u4F4D\u6743\u9650\u88AB\u62D2\u7EDD\uFF0C\u8BF7\u5728\u6D4F\u89C8\u5668\u4E2D\u5141\u8BB8\u5B9A\u4F4D\u540E\u518D\u7B7E\u5230":"\u83B7\u53D6\u5B9A\u4F4D\u5931\u8D25\uFF0C\u8BF7\u68C0\u67E5\u5B9A\u4F4D\u670D\u52A1")),{enableHighAccuracy:!0,timeout:12e3,maximumAge:0})})}async function k(u,p){try{let b=await E(),[S,y]=Pe(b.longitude,b.latitude);await m.post(`/bookings/${u}/checkin`,{lat:y,lng:S}),v("\u5B9A\u4F4D\u7B7E\u5230\u6210\u529F","success")}catch(b){v(b.message,"error")}p()}function f(u){let[p,b]=String(u.start_at||"0:0").split(":").map(Number),[S,y]=String(u.end_at||"0:0").split(":").map(Number);return Math.max(0,S*60+y-(p*60+b))}async function M(){let u=await m.get("/bookings/my").catch(()=>[]),p=K(),b=["confirmed","checked_in","away"],S=$=>{let B=new Date(`${$.date}T${$.end_at||"23:59"}:00`).getTime();return Number.isFinite(B)&&Date.now()>B+600*1e3},y=u.filter($=>$.date>=p&&$.type==="seat"&&b.includes($.status)&&!S($)).sort(($,B)=>`${$.date} ${$.start_at}`.localeCompare(`${B.date} ${B.start_at}`)),g=u.filter($=>$.type==="seat"&&["completed","released","cancelled","rejected"].includes($.status)).sort(($,B)=>(B.date+B.start_at).localeCompare($.date+$.start_at)).slice(0,12),L=await m.get("/library/supervisions").catch(()=>[]),w={};L.filter($=>$.status==="active").forEach($=>w[$.seat_id]=$);let x=$=>u.filter(B=>B.date===p&&B.type==="seat"&&B.room===$).reduce((B,V)=>B+Number(V.away_count||0),0),N=$=>$.reservation_key||String($.id),H=(()=>{let $=new Map;return y.forEach(B=>{let V=N(B);if(!$.has(V)){$.set(V,{...B,ids:[B.id],away_count:0,points_awarded:0});return}let Y=$.get(V);Y.ids.push(B.id),B.start_at<Y.start_at&&(Y.start_at=B.start_at),B.end_at>Y.end_at&&(Y.end_at=B.end_at),Y.away_count+=Number(B.away_count||0),Y.points_awarded+=Number(B.points_awarded||0),B.status==="away"?Y.status="away":B.status==="checked_in"&&Y.status!=="away"&&(Y.status="checked_in")}),$.forEach(B=>{B.away_count=y.filter(V=>N(V)===N(B)).reduce((V,Y)=>V+Number(Y.away_count||0),0),B.points_awarded=y.filter(V=>N(V)===N(B)).reduce((V,Y)=>V+Number(Y.points_awarded||0),0)}),[...$.values()].sort((B,V)=>`${B.date} ${B.start_at}`.localeCompare(`${V.date} ${V.start_at}`))})(),D=$=>`${String($.getHours()).padStart(2,"0")}:${String($.getMinutes()).padStart(2,"0")}`,A=$=>{let B=new Date(`${$.date}T${$.start_at}:00`),V=new Date(B.getTime()-900*1e3),Y=new Date(B.getTime()+900*1e3),R=Date.now();return{open:V,close:Y,can:R>=V.getTime()&&R<=Y.getTime(),before:R<V.getTime(),after:R>Y.getTime()}},z=[...new Map(g.map($=>[N($),$])).values()],ie=()=>z.length?`<div class="hist-grid">${z.map($=>`<div class="hist-card">
                <div class="hist-top"><b>${i($.resource_name)}</b>${$e($.status)}</div>
                <div class="hist-meta">${i($.date)} \xB7 ${i($.start_at)}\u2013${i($.end_at)}</div>
                <div class="hist-room">${i($.room||"")}</div>
                ${$.points_awarded?`<div class="hist-pts">${$.points_awarded>0?"+":""}${i($.points_awarded)} \u79EF\u5206</div>`:""}
              </div>`).join("")}</div>`:'<div class="muted" style="padding:6px 0">\u8FD8\u6CA1\u6709\u5386\u53F2\u9884\u7EA6\u8BB0\u5F55\u3002</div>';H.length?c.innerHTML=`
        ${H.map($=>{let B=$.status,V=w[$.resource_id],Y=Math.max(0,2-$.away_count),R=A($),T=$.date===p?"\u4ECA\u5929":$.date.slice(5),j=Math.max(1,Math.ceil((R.open.getTime()-Date.now())/6e4)),G=j>=60?`${Math.floor(j/60)} \u5C0F\u65F6 ${j%60} \u5206\u949F`:`${j} \u5206\u949F`,P=Math.max(1,Math.round(f($)/120)),F="";return B==="confirmed"&&(R.can?F=" \xB7 \u73B0\u5728\u53EF\u7B7E\u5230":R.before?F=` \xB7 \u8FD8\u6709 ${G}`:R.after&&(F=" \xB7 \u5DF2\u8FC7\u7B7E\u5230\u65F6\u95F4")),`<div class="card ci-card" data-bid="${$.id}">
              <div class="ci-room">${i($.resource_name)}<span class="ci-group-count">${P} \u4E2A\u65F6\u6BB5</span></div>
              <div class="ci-seat">${i($.date)} ${i($.start_at)}\u2013${i($.end_at)} \xB7 ${i($.room||"")}</div>
              <div class="ci-window">\u53EF\u7B7E\u5230\u65F6\u95F4\uFF1A${T} ${D(R.open)}\u2013${D(R.close)}${F}</div>
              <div class="ci-status">${$e(B)}${["checked_in","away"].includes(B)?`<span class="ci-timer" data-end="${i($.end_at)}"></span>`:""}</div>
              ${B==="checked_in"&&!V?`<div class="sup-left">\u672C\u6B21\u9884\u7EA6\u5269\u4F59\u6682\u79BB\u673A\u4F1A\uFF1A<b>${Y}</b> \u6B21</div>`:""}
              ${B==="away"?`<div class="sup-timer" data-deadline="${i($.away_until)}">\u6682\u79BB\u5012\u8BA1\u65F6 <b>--:--</b>\uFF08\u8D85\u65F6\u91CA\u653E\u5EA7\u4F4D\uFF09</div>`:""}
              ${V?`<div class="sup-timer" data-deadline="${i(V.deadline)}">\u88AB\u76D1\u7763\u4E2D\uFF1A<b>--:--</b> \u5185\u56DE\u9986\u5B9A\u4F4D\u7B7E\u5230</div>`:""}
              <div class="ci-actions">
                ${B==="confirmed"?`<button class="btn btn-primary ci-btn" data-checkin="${$.id}">\u{1F4CD} \u5B9A\u4F4D\u7B7E\u5230</button>`:""}
                ${B==="confirmed"?`<button class="btn btn-ghost ci-btn" data-cancel="${$.id}">\u53D6\u6D88\u9884\u7EA6</button>`:""}
                ${B==="away"?`<button class="btn btn-primary ci-btn" data-checkin="${$.id}">\u{1F4CD} \u56DE\u5230\u5EA7\u4F4D\u7B7E\u5230</button>`:""}
                ${B==="checked_in"&&V?`<button class="btn btn-primary ci-btn" data-checkin="${$.id}">\u{1F4CD} \u91CD\u65B0\u5B9A\u4F4D\u7B7E\u5230</button>`:""}
                ${B==="checked_in"&&!V&&Y>0?`<button class="btn btn-ghost ci-btn" data-away="${$.id}">\u{1F6B6} \u6682\u79BB\uFF08\u4FDD\u7559 30 \u5206\u949F\uFF09</button>`:""}
                ${["checked_in","away"].includes(B)?`<button class="btn btn-ghost ci-btn" data-release="${$.id}">\u{1F6AA} \u63D0\u524D\u79BB\u573A</button>`:""}
              </div>
            </div>`}).join("")}
        <div class="section-title">\u6211\u7684\u9884\u7EA6\u8BB0\u5F55 <span class="title-hint">\u6700\u8FD1 12 \u6761</span></div>
        ${ie()}
        <div class="section-title">\u76D1\u7763\u5360\u5EA7</div>
        <div id="supList"></div>`:c.innerHTML=`
        <div class="card ci-empty">
          <div class="ci-emoji">\u{1F4CD}</div>
          <div class="ci-title">\u4ECA\u5929\u53CA\u4E4B\u540E\u8FD8\u6CA1\u6709\u5EA7\u4F4D\u9884\u7EA6</div>
          <div class="muted">\u53BB\u300C\u9009\u5EA7\u300D\u6311\u4E00\u4E2A\u80FD\u8BA9\u4F60\u4E13\u6CE8\u5B66\u4E60\u7684\u5EA7\u4F4D\u5427</div>
          <button class="btn btn-primary" data-goto-seat>\u53BB\u9009\u5EA7</button>
        </div>
        <div class="section-title">\u6211\u7684\u9884\u7EA6\u8BB0\u5F55 <span class="title-hint">\u6700\u8FD1 12 \u6761</span></div>
        ${ie()}
        <div class="section-title">\u76D1\u7763\u5360\u5EA7</div>
        <div id="supList"></div>`,c.querySelector("[data-goto-seat]")?.addEventListener("click",()=>{t="seat",e.querySelectorAll("[data-lt]").forEach($=>$.classList.toggle("on",$.dataset.lt==="seat")),U()}),c.querySelectorAll("[data-checkin]").forEach($=>$.addEventListener("click",()=>k($.dataset.checkin,M))),c.querySelectorAll("[data-cancel]").forEach($=>$.addEventListener("click",async()=>{if(confirm("\u786E\u8BA4\u53D6\u6D88\u672C\u6B21\u9884\u7EA6\uFF1F\u53D6\u6D88\u540E\u5EA7\u4F4D\u4F1A\u91CA\u653E\u3002")){try{await m.post(`/bookings/${$.dataset.cancel}/cancel`),v("\u5DF2\u53D6\u6D88\u9884\u7EA6\uFF0C\u5EA7\u4F4D\u5DF2\u91CA\u653E","success")}catch(B){v(B.message,"error")}M()}})),c.querySelectorAll("[data-away]").forEach($=>$.addEventListener("click",async()=>{try{await m.post(`/bookings/${$.dataset.away}/away`),v("\u5DF2\u6682\u79BB\uFF1A30 \u5206\u949F\u5185\u9700\u56DE\u9986\u518D\u6B21\u5B9A\u4F4D\u7B7E\u5230","success")}catch(B){v(B.message,"error")}M()})),c.querySelectorAll("[data-release]").forEach($=>$.addEventListener("click",async()=>{if(confirm("\u786E\u8BA4\u63D0\u524D\u91CA\u653E\u5EA7\u4F4D\uFF1F\u91CA\u653E\u540E\u4E0D\u53EF\u6062\u590D\uFF0C\u79EF\u5206\u5728\u7B7E\u5230\u65F6\u5DF2\u53D1\u653E\u3002")){try{await m.post(`/bookings/${$.dataset.release}/release`),v("\u5DF2\u63D0\u524D\u91CA\u653E\u5EA7\u4F4D","success")}catch(B){v(B.message,"error")}M()}})),await q(),clearInterval(window.__checkinTimer),window.__checkinTimer=setInterval(()=>{let $=document.querySelector("#libBody"),B=document.querySelector(".lt-tab.on");if(!$||!B||B.dataset.lt!=="checkin"){clearInterval(window.__checkinTimer);return}M()},3e4)}async function q(){let u=c.querySelector("#supList");if(!u)return;let p=_(),[b,S]=p.split("-"),[y,g,L]=await Promise.all([m.get("/library/supervisions").catch(()=>[]),m.get("/bookings/my").catch(()=>[]),m.get(`/library/areas?date=${K()}&start=${b}&end=${S}`).catch(()=>[])]),w=L.reduce((R,T)=>R+T.total,0),x=L.reduce((R,T)=>R+T.available,0),N=w?Math.round(x*100/w):100,H=w>0&&x/w<.2,D=new Set(g.filter(R=>R.date===K()&&R.type==="seat"&&["confirmed","checked_in","away"].includes(R.status)).map(R=>R.resource_id)),A=[];L.forEach(R=>(R.seats||[]).forEach(T=>{!T.busy||D.has(T.id)||A.push({id:T.id,room:R.name,seat_no:(T.name.split(" ").pop()||"").split("-").pop()})}));let z=[...new Set(A.map(R=>R.room))],ie=y.length?y.map(R=>`<div class="sup-card">
              <div class="spread"><b>${i(R.seat_no)} \u53F7 \xB7 ${i(R.room)}</b><span class="tag ${R.status==="active"?"tag-gold":R.status==="released"?"tag-green":""}">${R.status==="active"?"\u76D1\u7763\u4E2D":R.status==="released"?"\u5DF2\u91CA\u653E\u5EA7\u4F4D":"\u5BF9\u65B9\u5DF2\u56DE\u5EA7"}</span></div>
              <div class="muted" style="margin-top:4px;font-size:11.5px">${i(R.reason)}</div>
              ${R.status==="active"?`<div class="sup-timer" data-deadline="${i(R.deadline)}">\u5269\u4F59 <b>--:--</b></div>`:""}
            </div>`).join(""):'<div class="muted" style="padding:8px 0">\u6682\u65E0\u76D1\u7763\u8BB0\u5F55\u3002</div>',$=`
      <div class="card sup-form-card">
        <div class="spread"><b>\u53D1\u8D77\u76D1\u7763\u5360\u5EA7</b>
          <span class="tag ${H?"tag-gold":"tag-green"}">\u5168\u9986\u4F59\u5EA7 ${x}/${w}\uFF08${N}%\uFF09</span></div>
        <div class="muted" style="margin-top:4px;font-size:11.5px">\u5F53\u5168\u9986\u5269\u4F59\u5EA7\u4F4D\u4F4E\u4E8E 20% \u65F6\uFF0C\u53EF\u5BF9\u5DF2\u9884\u7EA6\u4F46\u65E0\u4EBA\u4F7F\u7528\u7684\u5EA7\u4F4D\u53D1\u8D77\u76D1\u7763\u3002\u4E0D\u80FD\u76D1\u7763\u81EA\u5DF1\u7684\u5EA7\u4F4D\u3002</div>
        ${H?`<div class="sup-form-grid" style="margin-top:10px">
              <div class="field"><label>\u9605\u89C8\u5BA4</label><select class="select" id="supRoom">
                ${z.map(R=>`<option value="${i(R)}">${i(R)}</option>`).join("")}
              </select></div>
              <div class="field"><label>\u4F4D\u7F6E\u53F7</label><select class="select" id="supSeat"></select></div>
            </div>
            <div class="field" style="margin-top:8px"><label>\u76D1\u7763\u8BF4\u660E</label><textarea class="input" id="supReason" rows="2" placeholder="\u4F8B\u5982\uFF1A\u8BE5\u5EA7\u4F4D\u5DF2\u9884\u7EA6\uFF0C\u4F46\u5DF2\u8D85\u8FC7 40 \u5206\u949F\u65E0\u4EBA\u4F7F\u7528"></textarea></div>
            <div class="field" style="margin-top:8px"><label>\u73B0\u573A\u7167\u7247</label><input class="input" id="supPhoto" type="file" accept="image/*"></div>
            <div class="muted" style="margin-top:4px;font-size:11px">\u7167\u7247\u987B\u80FD\u770B\u6E05\u9605\u89C8\u5BA4\u4E0E\u4F4D\u7F6E\u53F7\uFF0C\u5355\u5F20\u5C0F\u4E8E 1.5MB\u3002</div>
            <button class="btn btn-primary btn-sm" id="supSubmit" style="margin-top:8px">\u63D0\u4EA4\u76D1\u7763\u5360\u5EA7</button>`:'<div class="muted" style="margin-top:8px">\u5F53\u524D\u5269\u4F59\u5EA7\u4F4D\u5145\u8DB3\uFF0C\u6682\u4E0D\u9700\u8981\u76D1\u7763\u5360\u5EA7\u3002</div>'}
      </div>`;u.innerHTML=$+'<div class="section-title">\u6211\u7684\u76D1\u7763\u8BB0\u5F55</div>'+ie;let B=u.querySelector("#supSeat"),V=u.querySelector("#supRoom"),Y=()=>{let R=V.value,T=A.filter(j=>j.room===R);B.innerHTML=T.map(j=>`<option value="${j.id}">${i(j.seat_no)}</option>`).join("")};H&&(V.addEventListener("change",Y),Y()),u.querySelector("#supSubmit")?.addEventListener("click",async R=>{let T=R.currentTarget,j=u.querySelector("#supReason").value.trim(),G=B.value;if(!j)return v("\u8BF7\u586B\u5199\u76D1\u7763\u8BF4\u660E","error");if(!G)return v("\u8BF7\u9009\u62E9\u88AB\u76D1\u7763\u7684\u5EA7\u4F4D","error");let P=u.querySelector("#supPhoto").files[0];if(!P)return v("\u8BF7\u4E0A\u4F20\u73B0\u573A\u7167\u7247","error");if(P.size>1.5*1024*1024)return v("\u7167\u7247\u8BF7\u5C0F\u4E8E 1.5MB","error");T.disabled=!0;let F=new FileReader;F.onload=async()=>{try{let te=A.find(de=>String(de.id)===String(G));await m.post("/library/supervise",{seat_id:Number(G),room:te.room,seat_no:te.seat_no,reason:j,photo:String(F.result||""),date:K(),start:b,end:S}),v("\u76D1\u7763\u5DF2\u63D0\u4EA4\uFF1A\u5360\u7528\u8005\u9700\u5728 30 \u5206\u949F\u5185\u56DE\u9986\u5B9A\u4F4D\u7B7E\u5230","success"),M()}catch(te){v(te.message,"error"),T.disabled=!1}},F.readAsDataURL(P)}),u.querySelectorAll(".sup-timer").forEach(R=>{let T=()=>{let j=Math.max(0,Math.round((new Date(R.dataset.deadline.replace(" ","T"))-new Date)/1e3));R.querySelector("b").textContent=`${String(Math.floor(j/60)).padStart(2,"0")}:${String(j%60).padStart(2,"0")}`};T(),setInterval(T,1e3)})}function U(){t==="checkin"?h():o()}U()}async function wa(e,a){let s=a.params.get("area")||"",t=a.params.get("date")||K(),n=a.params.get("start")||"",d=a.params.get("end")||"",l=(a.params.get("slots")||(n&&d?`${n}-${d}`:"")||"").split(",").filter(Boolean),c=a.params.get("seat")||"",r=null;e.innerHTML=`
    <div class="page-head">
      <div><div class="page-title">${i(s)}</div><div class="page-sub">\u5E73\u9762\u56FE\u9009\u5EA7 \xB7 \u4E00\u6B21\u9884\u7EA6 ${l.length} \u4E2A\u65F6\u6BB5 \xB7 15 \u5206\u949F\u5185\u7B7E\u5230</div></div>
      <div class="row">
                <a class="btn btn-ghost btn-sm" href="#/work/library">\u2039 \u8FD4\u56DE\u9605\u89C8\u5BA4</a>
      </div>
    </div>
    <div class="card" style="margin-bottom:10px"><div class="toolbar" style="margin:0">
      <div class="field"><label>\u65E5\u671F</label><input class="input" type="date" id="roomDate" value="${t}" min="${K()}" max="${Ue(2)}"></div>
      <div class="field"><label>\u65F6\u6BB5\uFF08\u53EF\u591A\u9009\uFF0C\u6700\u591A 3 \u4E2A\uFF09</label><div class="pill-strip" id="roomSlots"></div></div>
      <button class="btn btn-ghost btn-sm" id="roomRefresh" style="margin-left:auto">\u21BB \u5237\u65B0</button>
    </div></div>
    <div class="sm-legend">
      <span><i style="background:#fff;border:1.5px solid #b9c7d9"></i>\u53EF\u9009</span>
      <span><i style="background:#1e5eff"></i>\u5DF2\u9009</span>
      <span><i style="background:#ff6b6b"></i>\u6709\u4EBA</span>
      <span><i style="background:#e0e0e0"></i>\u6682\u79BB</span>
      <span><i style="background:#ff9f43"></i>\u76D1\u7763\u4E2D</span>
      <span><i style="background:#74c0fc"></i>\u5165\u53E3</span>
      <span><i style="background:#e7d8b8"></i>\u4E66\u67B6</span>
      <span><i style="background:#a5d8ff"></i>\u7A97</span>
      <span><i style="background:#ffd43b"></i>\u7535\u6E90</span>
      <span><i style="background:#d8f5a2"></i>\u7EFF\u690D</span>
    </div>
    <div id="seatBox"><div class="muted">\u52A0\u8F7D\u5E73\u9762\u56FE\u2026</div></div>
    <div class="grid-bar" id="seatBar" hidden>
      <div class="grid-bar-info" id="seatBarInfo"></div>
      <button class="btn btn-ghost btn-sm" id="favBtn" hidden>\u2B50 \u8BBE\u4E3A\u5E38\u7528</button>
      <button class="btn btn-primary" id="seatSubmit">\u786E\u8BA4\u9009\u5EA7</button>
    </div>`;let o=e.querySelector("#roomDate"),h=e.querySelector("#roomSlots"),_=e.querySelector("#seatBox"),E=e.querySelector("#seatBar"),k=[...l];function f(){h.innerHTML=dt.map(u=>{let p=u.join("-"),b=va(p,o.value);return`<button type="button" class="pill ${k.includes(p)?"active":""} ${b?"past":""}" data-slot="${p}" ${b?"disabled":""} title="${b?"\u8BE5\u65F6\u6BB5\u5DF2\u8FC7\uFF0C\u65E0\u6CD5\u9884\u7EA6":""}">${u[0]}\u2013${u[1]}</button>`}).join(""),h.querySelectorAll(".pill:not([disabled])").forEach(u=>u.addEventListener("click",()=>{let p=u.dataset.slot,b=k.indexOf(p);if(b>=0){let S=k.filter(y=>y!==p);if(!Ge(S)){v("\u79FB\u9664\u4E2D\u95F4\u65F6\u6BB5\u4F1A\u65AD\u5F00\u8FDE\u7EED\u65F6\u957F\uFF0C\u8BF7\u4ECE\u4E24\u7AEF\u79FB\u9664","error");return}k.splice(b,1)}else{if(k.length>=3){v("\u4E00\u6B21\u6700\u591A\u9009 3 \u4E2A\u65F6\u6BB5","error");return}if(!Ge([...k,p])){v("\u65F6\u6BB5\u5FC5\u987B\u8FDE\u7EED\u9009\u62E9\uFF08\u5982 08:00\u201312:00 \u4E00\u6574\u6BB5\uFF09","error");return}k.push(p)}f(),U()}))}let M=new Set;async function q(){try{let u=await m.get(`/library/favorites?date=${o.value}`);M=new Set(u.map(p=>p.seat_id))}catch{M=new Set}}async function U(){if(r=null,E.hidden=!0,_.style.paddingBottom="",!k.length){_.innerHTML='<div class="bk-empty"><b>\u8BF7\u5148\u9009\u62E9\u65F6\u6BB5</b><span>\u9009\u62E9\u8FDE\u7EED\u65F6\u6BB5\u540E\u518D\u6311\u9009\u5EA7\u4F4D\u3002</span></div>';return}_.innerHTML='<div class="muted">\u52A0\u8F7D\u5E73\u9762\u56FE\u2026</div>';let u=k;await q();try{let p=await Promise.all(u.map(W=>{let[ae,se]=W.split("-");return m.get(`/library/areas?date=${o.value}&start=${ae}&end=${se}`).catch(()=>[])})),b=p.map(W=>W.find(ae=>ae.name===s)).find(Boolean);if(!b){_.innerHTML='<div class="empty"><strong>\u9605\u89C8\u5BA4\u4E0D\u5B58\u5728</strong><a href="#/work/library">\u8FD4\u56DE\u5217\u8868</a></div>';return}let S=new Set;p.forEach(W=>{(W.find(se=>se.name===s)?.seats||[]).forEach(se=>{se.busy&&S.add(se.id)})});let y=b.seats.map(W=>({...W,busy:!!W.busy||S.has(W.id)})),g=Math.max(...y.map(W=>W.x)),L=Math.max(...y.map(W=>W.y)),w=g+1,x=.6,N=1.7,H=1.5,D=1,A=.5,z=.68,ie=.85,$=.55,B=W=>H+x+W*D,V=W=>N+x+W*D,Y=H+x*2+w*D+$,R=N+x*2+(L+1)*D+ie,T=[...new Set(y.map(W=>W.y))].sort((W,ae)=>W-ae),j=W=>{let ae=[],se=null,pe=null;for(let fe of W){if(se===null){se=fe,pe=fe;continue}if(fe===pe+1){pe=fe;continue}ae.push([se,pe]),se=fe,pe=fe}return se!==null&&ae.push([se,pe]),ae},G=T.map((W,ae)=>{let se=y.filter(pe=>pe.y===W).map(pe=>pe.x).sort((pe,fe)=>pe-fe);return j(se).map(([pe,fe],Ne)=>{let je=B(pe)-.09,Be=(fe-pe+1)*D+.18;return`<rect class="pm-desk" x="${je.toFixed(2)}" y="${(V(W)-.06).toFixed(2)}" width="${Be.toFixed(2)}" height="${A}" rx="0.10"/>
                <text class="pm-desk-no" x="${(je+Be/2).toFixed(2)}" y="${(V(W)+A/2).toFixed(2)}">${String.fromCharCode(65+ae)}${Ne+1} \u684C</text>`}).join("")}).join(""),P=y.map(W=>{let ae=(W.name.split(" ").pop()||"").split("-").pop(),se=ae.match(/^([A-Za-z]+)-?(\d+)$/),pe=(se?se[1]:ae.slice(0,1)).toUpperCase(),fe=se?se[2]:ae.slice(1),Ne=W.busy?"busy":"free",je=!!W.equipment,Be=M.has(W.id),qe=B(W.x),xe=V(W.y)+A+.36;return`<g class="pm-seat ${Ne}" data-seat="${W.id}" data-name="${i(ae)}" tabindex="${W.busy?-1:0}">
            <rect class="pm-chair" x="${(qe-z/2).toFixed(2)}" y="${(xe-z/2).toFixed(2)}" width="${z}" height="${z}" rx="0.13"/>
            <path class="pm-back" d="M${(qe-.17).toFixed(2)} ${(xe-z/2-.11).toFixed(2)} h0.34"/>
            <text class="pm-num" x="${qe.toFixed(2)}" y="${xe.toFixed(2)}">${i(fe)}</text>
            ${je?`<g class="pm-power" transform="translate(${(qe-.3).toFixed(2)},${(xe-.33).toFixed(2)})"><circle r="0.14"/><path d="M0 -0.075 L0.055 0.01 L-0.01 0.01 L0.045 0.095"/></g>`:""}
            ${Be?`<text class="pm-star" x="${(qe+.3).toFixed(2)}" y="${(xe+.33).toFixed(2)}">\u2605</text>`:""}
          </g>`}).join(""),F=Math.max(6,Math.min(12,Math.floor((R-N-1.4)/1.1))),te=`<g class="pm-shelf">
        ${Array.from({length:F},(W,ae)=>`<rect x="0.42" y="${(N+.4+ae*1.1).toFixed(2)}" width="0.62" height="0.85" rx="0.05"/>`).join("")}
        <text class="pm-shelf-label" transform="translate(0.26,${(R/2).toFixed(2)}) rotate(-90)">\u4E66\u67B6 BOOKSHELF</text>
      </g>`,de=3,oe=1.9,ue=(R-N-1.6-de*oe)/(de-1),Ae=`<g class="pm-window-group">
        ${Array.from({length:de},(W,ae)=>{let se=N+.7+ae*(oe+ue);return`<rect class="pm-window-fill" x="${(Y-.46).toFixed(2)}" y="${se.toFixed(2)}" width="0.20" height="${oe.toFixed(2)}" rx="0.03"/>
            <line class="pm-window" x1="${(Y-.36).toFixed(2)}" y1="${se.toFixed(2)}" x2="${(Y-.36).toFixed(2)}" y2="${(se+oe).toFixed(2)}"/>`}).join("")}
        <text class="pm-win-label" transform="translate(${(Y-.62).toFixed(2)},${(R/2).toFixed(2)}) rotate(-90)">\u7A97 WINDOWS</text>
      </g>`,be=2.2,X=Y/2-be/2,ge=`<g class="pm-entrance-group">
        <rect class="pm-door-gap" x="${X.toFixed(2)}" y="0.02" width="${be}" height="0.66"/>
        <path class="pm-door-leaf" d="M${X.toFixed(2)} 0.46 L${(X+.95).toFixed(2)} 1.12"/>
        <path class="pm-door-leaf" d="M${(X+be).toFixed(2)} 0.46 L${(X+be-.95).toFixed(2)} 1.12"/>
        <text class="pm-entrance" x="${(Y/2).toFixed(2)}" y="1.5">\u5165\u53E3 ENTRANCE</text>
      </g>`,he=`<g class="pm-service">
        <rect x="${(Y/2+be/2+.55).toFixed(2)}" y="0.62" width="2.45" height="0.5" rx="0.08"/>
        <text x="${(Y/2+be/2+1.775).toFixed(2)}" y="0.87">\u81EA\u52A9\u501F\u8FD8</text>
      </g>`,wt=[[.75,.85],[Y-.75,.85],[.75,R-.75],[Y-.75,R-.75]].map(([W,ae])=>`<circle class="pm-plant" cx="${W.toFixed(2)}" cy="${ae.toFixed(2)}" r="0.26"/>`).join("");_.innerHTML=`<div class="pm-tools">
          <span class="pm-tools-label">\u5E73\u9762\u793A\u610F\u56FE</span>
          <button type="button" class="pm-zoom-btn" data-pmzoom="-1" aria-label="\u7F29\u5C0F">\u2212</button>
          <span class="pm-zoom-val" id="pmZoomVal">100%</span>
          <button type="button" class="pm-zoom-btn" data-pmzoom="1" aria-label="\u653E\u5927">+</button>
          <button type="button" class="pm-zoom-btn pm-zoom-reset" data-pmzoom="0">\u91CD\u7F6E</button>
        </div>
        <div class="pm-wrap"><svg class="pm-plan" viewBox="0 0 ${Y.toFixed(2)} ${R.toFixed(2)}" preserveAspectRatio="xMidYMid meet">
          <rect class="pm-floor" x="0" y="0" width="${Y.toFixed(2)}" height="${R.toFixed(2)}"/>
          <rect class="pm-wall-outer" x="0.16" y="0.16" width="${(Y-.32).toFixed(2)}" height="${(R-.32).toFixed(2)}" rx="0.20"/>
          <rect class="pm-wall-inner" x="0.34" y="0.34" width="${(Y-.68).toFixed(2)}" height="${(R-.68).toFixed(2)}" rx="0.14"/>
          ${ge}${Ae}${te}${he}${G}${P}${wt}
        </svg></div>`;let Me=100,et=_.querySelector(".pm-wrap");if(_.querySelectorAll("[data-pmzoom]").forEach(W=>W.addEventListener("click",()=>{let ae=Number(W.dataset.pmzoom);Me=ae===0?100:Math.max(60,Math.min(300,Me+ae*20)),et.style.width=`${Me}%`,_.querySelector("#pmZoomVal").textContent=`${Me}%`})),_.querySelectorAll(".pm-seat.free").forEach(W=>{W.addEventListener("click",()=>{_.querySelectorAll(".pm-seat").forEach(ae=>ae.classList.remove("picked")),W.classList.add("picked"),r={id:W.getAttribute("data-seat"),name:W.getAttribute("data-name")},e.querySelector("#seatBarInfo").innerHTML=`\u5DF2\u9009\u5EA7\u4F4D <b>${i(r.name)}</b><span class="bkb-sub">${i(o.value)} \xB7 ${js(k)} \u8FDE\u7EED ${k.length} \u4E2A\u65F6\u6BB5 \xB7 \u4E00\u6B21\u7B7E\u5230</span>`,E.hidden=!1,_.style.paddingBottom="88px",e.querySelector("#favBtn").hidden=!1})}),c){let W=_.querySelector(`.pm-seat.free[data-seat="${CSS.escape(c)}"]`);W?(W.dispatchEvent(new Event("click")),W.scrollIntoView({behavior:"smooth",block:"center"})):v("\u8BE5\u5E38\u7528\u5EA7\u4F4D\u5728\u5F53\u524D\u65F6\u6BB5\u5DF2\u88AB\u5360\u7528\uFF0C\u8BF7\u6362\u4E2A\u5EA7\u4F4D\u6216\u65F6\u6BB5","error")}}catch(p){_.innerHTML=`<div class="muted">${i(p.message)}</div>`}}o.addEventListener("change",async()=>{k=[],f(),await q(),await U()}),f(),e.querySelector("#roomRefresh").addEventListener("click",U),e.querySelector("#favBtn").addEventListener("click",async()=>{if(r)try{let u=await m.post(`/library/favorites/${r.id}/toggle`);v(u.favorited?"\u2B50 \u5DF2\u8BBE\u4E3A\u5E38\u7528\u5EA7\u4F4D":"\u5DF2\u53D6\u6D88\u6536\u85CF","success"),await q(),await U()}catch(u){v(u.message,"error")}}),e.querySelector("#seatSubmit").addEventListener("click",async()=>{if(!r)return;if(!Ge(k)){v("\u65F6\u6BB5\u5FC5\u987B\u8FDE\u7EED\uFF0C\u8BF7\u8C03\u6574\u540E\u518D\u63D0\u4EA4","error");return}let u=e.querySelector("#seatSubmit");u.disabled=!0;try{let p=[...k].sort(),b=p[0].split("-")[0],S=p[p.length-1].split("-")[1];await m.post("/bookings",{resource_id:Number(r.id),date:o.value,start_at:b,end_at:S,people:1,purpose:"\u56FE\u4E66\u9986\u81EA\u4E60",reservation_key:`lib-${Date.now()}-${Math.random().toString(36).slice(2,8)}`}),v(`\u5DF2\u9884\u7EA6 ${b}\u2013${S} \u8FDE\u7EED\u65F6\u6BB5\uFF0C\u6B63\u5728\u4E3A\u4F60\u6253\u5F00\u7B7E\u5230\u9875`,"success"),setTimeout(()=>{location.hash="#/work/library?tab=checkin"},600)}catch(p){v(p.message,"error")}finally{u.disabled=!1}await U()}),await q(),await U()}async function ka(e,a){let s=await m.get("/news/meta").catch(()=>({categories:[]})),t=a.params.get("category")||"",n="";e.innerHTML=`
    <div class="detail-hero news-hero">
      <div class="tag">NEWS</div>
      <h1>\u4FE1\u606F\u52A8\u6001</h1>
      <p>\u5E08\u5927\u8981\u95FB\u3001\u5B66\u672F\u52A8\u6001\u4E0E\u901A\u77E5\u516C\u544A\uFF0C\u4E00\u7AD9\u5F0F\u901F\u89C8\u6821\u56ED\u5927\u5C0F\u4E8B\u3002</p>
    </div>
    <div class="card news-panel">
      <div class="news-filter">
        <div class="tabs" id="newsTabs"></div>
        <div class="news-filter-right">
          <input class="input" id="newsQ" placeholder="\u641C\u7D22\u6807\u9898\u5173\u952E\u8BCD\u2026">
        </div>
      </div>
      <div id="newsList" class="news-panel-body"></div>
    </div>`;let d=e.querySelector("#newsTabs"),l=e.querySelector("#newsList");function c(){let h=[["","\u5168\u90E8"],...(s.categories||[]).map(_=>[_,_])];d.innerHTML=h.map(([_,E])=>`<a class="tab ${t===_?"active":""}" data-cat="${i(_)}" href="javascript:void(0)">${i(E)}</a>`).join(""),d.querySelectorAll(".tab").forEach(_=>_.addEventListener("click",()=>{t=_.dataset.cat,c(),r()}))}async function r(){let h=new URLSearchParams;t&&h.set("category",t),n&&h.set("q",n);let _=await m.get(`/news?${h}`).catch(()=>[]);if(!_.length){l.innerHTML='<div class="empty" style="padding:44px 0;text-align:center">\u6682\u65E0\u7B26\u5408\u6761\u4EF6\u7684\u52A8\u6001</div>';return}let[E,...k]=_;l.innerHTML=`
      <a class="card nc-feature" href="#/news/detail?id=${E.id}">
        <img src="${Et(E.id)}" alt="" style="width:100%;height:230px;object-fit:cover;display:block">
        <div style="padding:16px 18px 18px">
          <div class="nc-tags"><span class="tag tag-blue">${i(E.category)}</span></div>
          <div style="font-size:17px;font-weight:700;margin-top:8px;line-height:1.55">${i(E.title)}</div>
          <div class="nc-summary">${i(E.summary||"")}</div>
          <div class="nc-meta">${i(E.college)} \xB7 ${i(E.published_at)} \xB7 \u6765\u6E90\uFF1A${i(E.source||"\u6821\u65B9\u53D1\u5E03")}</div>
        </div>
      </a>
      ${k.map(f=>`<a class="card nc-card" href="#/news/detail?id=${f.id}">
        <img class="nc-thumb" src="${Et(f.id)}" alt="">
        <div style="min-width:0">
          <div class="nc-tags"><span class="tag tag-blue">${i(f.category)}</span></div>
          <div style="font-size:14px;font-weight:600;margin-top:5px;line-height:1.5">${i(f.title)}</div>
          <div class="nc-summary">${i(f.summary||"")}</div>
          <div class="nc-meta">${i(f.college)} \xB7 ${i(f.published_at)}</div>
        </div>
      </a>`).join("")}`}let o=null;e.querySelector("#newsQ").addEventListener("input",h=>{clearTimeout(o),o=setTimeout(()=>{n=h.target.value.trim(),r()},300)}),c(),await r()}async function xa(e,a){let s=a.params.get("id"),t=await m.get(`/news/${s}`).catch(()=>null);if(!t){e.innerHTML='<div class="card" style="padding:44px;text-align:center;color:var(--text-3)">\u52A8\u6001\u4E0D\u5B58\u5728\u6216\u5DF2\u4E0B\u7EBF<a class="small" href="#/work/news" style="display:block;margin-top:12px">\u2039 \u8FD4\u56DE\u4FE1\u606F\u52A8\u6001</a></div>';return}let n=String(t.content||"").split(/\n+/).filter(Boolean);e.innerHTML=`
    <div class="article-wrap">
      <div class="article-crumb"><a href="#/work/news">\u4FE1\u606F\u52A8\u6001</a><span class="sep">/</span>${i(t.category)}</div>
      <img class="article-cover" src="${Et(t.id)}" alt="">
      <div class="article-head">
        <div class="article-title">${i(t.title)}</div>
        <div class="article-meta">
          <span class="tag tag-blue">${i(t.category)}</span>
          <span>${i(t.college)}</span>
          <span>${i(t.published_at)}</span>
          <span>\u6765\u6E90\uFF1A${i(t.source||"\u6821\u65B9\u53D1\u5E03")}</span>
        </div>
      </div>
      <div class="article-body">
        ${n.map(d=>`<p>${i(d)}</p>`).join("")}
        ${(t.images||[]).length?`<div class="article-photos">${t.images.map(d=>`<img src="${i(d)}" alt="">`).join("")}</div>`:""}
      </div>
      <div class="article-foot">
        ${t.source_url?`<a class="small" href="${i(t.source_url)}" target="_blank" rel="noopener">\u67E5\u770B\u539F\u6587 \u203A</a>`:"<span></span>"}
        <a class="small" href="#/work/news">\u2039 \u8FD4\u56DE\u4FE1\u606F\u52A8\u6001</a>
      </div>
      ${(t.related||[]).length?`<div class="section-title" style="margin-top:28px">\u76F8\u5173\u63A8\u8350</div>
        <div class="news-list">${t.related.map(d=>`<a class="card rl-card" href="#/news/detail?id=${d.id}">
              <div class="rl-title">${i(d.title)}</div>
              <div class="nc-meta">${i(d.category)} \xB7 ${i(d.published_at)}</div>
            </a>`).join("")}</div>`:""}
    </div>`}var ua=["ico-indigo","ico-violet","ico-cyan","ico-green","ico-blue","ico-orange","ico-pink","ico-teal","ico-gold"],Us=[[/教务|课程|考试|成绩|选课/,"\u{1F4DA}"],[/图书|文献|知网|数据库|论文/,"\u{1F4D6}"],[/邮箱|邮件/,"\u{1F4EE}"],[/vpn/i,"\u{1F510}"],[/一卡通|卡务/,"\u{1F4B3}"],[/就业|招聘|求职|创业/,"\u{1F4BC}"],[/研究生/,"\u{1F393}"],[/财务|缴费|支付/,"\u{1F4B0}"],[/心理|咨询/,"\u{1F49B}"],[/体育|场馆|体测/,"\u{1F3F8}"],[/学工|学工系统|奖惩/,"\u{1F9D1}\u200D\u{1F393}"],[/网络|上网|校园网/,"\u{1F310}"]];function Ws(e){for(let[a,s]of Us)if(a.test(e))return s;return"\u{1F517}"}async function qt(e,a){let s=await m.get("/resource-links").catch(()=>[]),t=[...new Set(s.map(h=>h.category).filter(Boolean))],n="",d="";e.innerHTML=`
    <div class="res-hero">
      <div class="res-hero-art"><svg viewBox="0 0 200 160" fill="none">
        <rect x="30" y="30" width="60" height="44" rx="9" stroke="#8fdcff" stroke-opacity=".5" stroke-width="1.6"/>
        <rect x="104" y="22" width="60" height="44" rx="9" stroke="#f0cf94" stroke-opacity=".55" stroke-width="1.6"/>
        <rect x="52" y="92" width="60" height="44" rx="9" stroke="#dff2ff" stroke-opacity=".4" stroke-width="1.6"/>
        <path d="M60 52h20M60 62h12M134 42h20M134 52h12M82 112h20M82 122h12" stroke="#fff" stroke-opacity=".35" stroke-width="3" stroke-linecap="round"/>
        <path d="M90 52h14M112 88l10 10" stroke="#8fdcff" stroke-opacity=".45" stroke-width="1.6"/>
        <circle cx="160" cy="118" r="16" stroke="#8fdcff" stroke-opacity=".5" stroke-width="1.6"/>
        <path d="M154 118h12M160 112v12" stroke="#8fdcff" stroke-opacity=".6" stroke-width="1.6" stroke-linecap="round"/>
      </svg></div>
      <h1>\u8D44\u6E90\u5E73\u53F0</h1>
      <p>\u6C47\u805A\u5B66\u6821\u5B98\u65B9\u7CFB\u7EDF\u4E0E\u5E38\u7528\u670D\u52A1\u5165\u53E3\uFF0C\u7EDF\u4E00\u8BA4\u8BC1\u4E0E\u6821\u56ED\u7F51\u8981\u6C42\u4E00\u76EE\u4E86\u7136\uFF0C\u70B9\u51FB\u5373\u53EF\u76F4\u8FBE\u3002</p>
      <div class="res-search">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
        <input id="resQ" placeholder="\u641C\u7D22\u5E73\u53F0\u540D\u79F0\u6216\u8BF4\u660E\u2026">
      </div>
    </div>
    <div class="res-tabs" id="resTabs"></div>
    <div class="res-grid" id="resGrid"></div>`;let l=e.querySelector("#resTabs"),c=e.querySelector("#resGrid");function r(){let h=[["","\u5168\u90E8"],...t.map(_=>[_,_])];l.innerHTML=h.map(([_,E])=>{let k=_?s.filter(f=>f.category===_).length:s.length;return`<button type="button" class="res-tab ${n===_?"active":""}" data-cat="${i(_)}">${i(E)}<span>${k}</span></button>`}).join(""),l.querySelectorAll(".res-tab").forEach(_=>_.addEventListener("click",()=>{n=_.dataset.cat,r(),o()}))}function o(){let h=d.toLowerCase(),_=s.filter(E=>(!n||E.category===n)&&(!h||`${E.name}${E.note||""}`.toLowerCase().includes(h)));if(!_.length){c.innerHTML='<div class="card" style="padding:44px;text-align:center;color:var(--text-3);grid-column:1/-1">\u6682\u65E0\u5339\u914D\u7684\u5E73\u53F0\u5165\u53E3</div>';return}c.innerHTML=_.map((E,k)=>`<a class="res-card" href="${i(E.url)}" target="_blank" rel="noopener">
        <div class="res-ico ${ua[k%ua.length]}">${Ws(E.name)}</div>
        <div class="res-body">
          <div class="res-name">${i(E.name)}</div>
          <div class="res-note">${i(E.note||"\u5B66\u6821\u5B98\u65B9\u670D\u52A1\u5E73\u53F0")}</div>
          <div class="res-flags">
            ${E.category?`<span class="res-flag res-flag-cat">${i(E.category)}</span>`:""}
            ${E.need_login?'<span class="res-flag">\u7EDF\u4E00\u8BA4\u8BC1</span>':""}
            ${E.need_campus_net?'<span class="res-flag">\u6821\u56ED\u7F51</span>':""}
            ${E.status&&E.status!=="online"?'<span class="res-flag">\u7EF4\u62A4\u4E2D</span>':""}
            ${E.audience?`<span class="res-flag">${i(E.audience)}</span>`:""}
          </div>
        </div>
        <span class="res-go">\u203A</span>
      </a>`).join("")}e.querySelector("#resQ").addEventListener("input",h=>{d=h.target.value.trim(),o()}),r(),o()}ve();function Sa(){let e=new Date;return`${e.getFullYear()}-${String(e.getMonth()+1).padStart(2,"0")}-${String(e.getDate()).padStart(2,"0")}`}var Ys=[["/static/demo/office/archive-id.pdf","\u9648\u661F\u5B87-\u5C45\u6C11\u8EAB\u4EFD\u8BC1\uFF08\u626B\u63CF\u4EF6\uFF09.pdf"],["/static/demo/office/archive-diploma.pdf","\u9648\u661F\u5B87-\u9AD8\u4E2D\u6BD5\u4E1A\u8BC1\u4E66.pdf"],["/static/demo/office/archive-admission.docx","\u9648\u661F\u5B87-\u5F55\u53D6\u901A\u77E5\u4E66.docx"],["/static/demo/office/archive-enrollment.docx","\u9648\u661F\u5B87-\u5B66\u7C4D\u5728\u7EBF\u9A8C\u8BC1\u62A5\u544A.docx"]],Gs=[["/static/demo/office/archive-notice.docx","2026\u7EA7\u672C\u79D1\u65B0\u751F\u5165\u5B66\u8D44\u683C\u590D\u6838\u901A\u77E5.docx"],["/static/demo/office/archive-policy.pdf","\u6C5F\u82CF\u5E08\u8303\u5927\u5B66\u5B66\u751F\u5B66\u7C4D\u6863\u6848\u7BA1\u7406\u529E\u6CD5\uFF08\u8282\u9009\uFF09.pdf"]];async function Ea(){let e=[];for(let[a,s]of Ys){let t=await fetch(a);if(!t.ok)throw new Error(`\u793A\u4F8B\u6750\u6599\u52A0\u8F7D\u5931\u8D25\uFF1A${s}`);let n=await t.blob();e.push(new File([n],s,{type:n.type||"application/octet-stream"}))}return e}function At(e){let a=(e.split(".").pop()||"").toLowerCase();return`<span class="file-badge fb-${i(a)}">${i(a||"txt")}</span>`}function Qs(e,a,s){let t=(e.name.split(".").pop()||"").toLowerCase(),n=e.size>1024*1024?`${(e.size/1024/1024).toFixed(1)} MB`:`${Math.max(1,Math.round(e.size/1024))} KB`;return`<div class="app-file">
    ${At(e.name)}
    <div class="app-file-main" title="${i(e.name)}"><strong>${i(e.name)}</strong><span class="muted">${n}</span></div>
    <button class="app-file-act" data-preview="${a}" title="\u9884\u89C8">\u{1F441}</button>
    <button class="app-file-rm" data-rm="${a}" title="\u79FB\u9664" data-ext="${i(t)}">\xD7</button>
  </div>`}function Qe(e,a,s){e.innerHTML=a.map((t,n)=>Qs(t,n)).join(""),e.querySelectorAll("[data-rm]").forEach(t=>{t.addEventListener("click",()=>{a.splice(Number(t.getAttribute("data-rm")),1),Qe(e,a,s),s&&s()})}),e.querySelectorAll("[data-preview]").forEach(t=>{t.addEventListener("click",()=>La(a[Number(t.getAttribute("data-preview"))]))})}function La(e){if(!e)return;let a=(e.name.split(".").pop()||"").toLowerCase();if(a==="pdf"){let s=URL.createObjectURL(e);Z({title:e.name,hideOk:!0,cancelText:"\u5173\u95ED",wide:!0,body:`<iframe class="pv-frame" src="${i(s)}" title="\u9884\u89C8"></iframe>
        <div class="pv-hint muted">PDF \u539F\u4EF6\u9884\u89C8 \xB7 ${Math.max(1,Math.round(e.size/1024))} KB</div>`})}else if(["png","jpg","jpeg","bmp","webp"].includes(a)){let s=URL.createObjectURL(e);Z({title:e.name,hideOk:!0,cancelText:"\u5173\u95ED",wide:!0,body:`<img class="pv-image" src="${i(s)}" alt="\u9884\u89C8">
        <div class="pv-hint muted">\u56FE\u7247\u539F\u4EF6\u9884\u89C8</div>`})}else a==="docx"||a==="xlsx"?Ks(e):e.text().then(s=>{Z({title:e.name,hideOk:!0,cancelText:"\u5173\u95ED",wide:!0,body:`<div class="ex-text">${i(s.slice(0,2e4))}</div>`})})}async function Ks(e){v("\u6B63\u5728\u89E3\u6790\u6587\u6863\u2026");try{let a=new FormData;a.append("file",e);let s=await m.upload("/office/preview",a),t;s.type==="images"&&s.images.length?t=`${s.images.map(n=>`<img class="pv-image" src="${i(n)}" alt="\u6587\u6863\u56FE\u7247">`).join("")}
        <div class="pv-hint muted">Word \u5185\u5D4C\u56FE\u7247\uFF08\u622A\u56FE\u578B\u6587\u6863\uFF09\xB7 \u5171 ${s.images.length} \u5F20</div>`:s.type==="text"&&(s.text||"").trim()?t=`<div class="ex-text">${i(s.text)}</div>
        <div class="pv-hint muted">Word \u6587\u672C\u5185\u5BB9\u9884\u89C8</div>`:t='<div class="empty" style="margin:20px 0"><strong>\u8BE5\u6587\u6863\u6CA1\u6709\u53EF\u9884\u89C8\u7684\u6587\u672C\u6216\u56FE\u7247</strong></div>',Z({title:e.name,hideOk:!0,cancelText:"\u5173\u95ED",wide:!0,body:t})}catch(a){v(a.message,"error")}}function Tt(e,a,s,t){let n=e.querySelector(a),d=e.querySelector(s);!n||!d||(["dragover","dragleave","drop"].forEach(l=>{n.addEventListener(l,c=>{c.preventDefault(),n.classList.toggle("dragging",l==="dragover")})}),n.addEventListener("drop",l=>{l.dataTransfer.files.length&&(l.target.querySelector("input").files=l.dataTransfer.files,t([...l.dataTransfer.files]))}),d.addEventListener("change",()=>{d.files.length&&t([...d.files]),d.value=""}))}function Js(e){return`<div class="tabs">${[["chat","\u804A\u5929\u8F6C\u5F85\u529E"],["extract","\u5B57\u6BB5\u63D0\u53D6"],["verify","\u6587\u4EF6\u6838\u67E5\u5339\u914D"]].map(([s,t])=>`<a class="tab ${e===s?"active":""}" data-otab="${s}">${t}</a>`).join("")}</div>`}async function Ma(e,a){e.innerHTML=`

    <div class="detail-hero office-hero">
      <div class="tag">OFFICE \xB7 DOCUMENT</div>
      <h1>\u529E\u516C\u670D\u52A1</h1>
      <p>\u9762\u5411\u7533\u62A5\u4E0E\u5BA1\u6838\u573A\u666F\u7684\u6587\u6863\u5904\u7406\uFF1A\u63D0\u53D6\u6587\u4EF6\u91CC\u7684\u5173\u952E\u5B57\u6BB5\uFF0C\u6216\u7528\u89C4\u5219\u6279\u91CF\u6838\u67E5\u591A\u4EFD\u6587\u4EF6\u662F\u5426\u4E00\u81F4\u3002</p>
    </div>
    ${Js("chat")}
    <div id="tabExtract" hidden></div>
    <div id="tabVerify" hidden></div>
    <div id="tabChat"></div>`;let s=e.querySelector("#tabExtract"),t=e.querySelector("#tabVerify"),n=e.querySelector("#tabChat");e.querySelectorAll("[data-otab]").forEach(d=>{d.addEventListener("click",()=>{e.querySelectorAll("[data-otab]").forEach(c=>c.classList.remove("active")),d.classList.add("active");let l=d.getAttribute("data-otab");s.hidden=l!=="extract",t.hidden=l!=="verify",n.hidden=l!=="chat",l==="verify"&&!t.dataset.inited&&(t.dataset.inited="1",ei(t)),l==="chat"&&!n.dataset.inited&&(n.dataset.inited="1",_a(n))})}),_a(n),n.dataset.inited="1",Zs(s)}function Zs(e){e.innerHTML=`
    <div class="card">
      <div class="spread"><div class="card-title">\u4E0A\u4F20\u6587\u4EF6\uFF0C\u63D0\u53D6\u5173\u952E\u5B57\u6BB5</div><span class="tag tag-blue">PDF / \u56FE\u7247 / docx / xlsx</span></div>
      <div class="card-desc" style="margin-top:4px">\u652F\u6301\u626B\u63CF\u4EF6\u3001\u56FE\u7247\u3001Word \u4E0E Excel\u3002</div>
      <label class="upload-drop" id="exDrop">
        <input type="file" id="exFiles" multiple accept=".pdf,.png,.jpg,.jpeg,.docx,.xlsx,.txt,.md" hidden>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 16V4m0 0l-4 4m4-4l4 4"/><path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/></svg>
        <div class="upload-drop-text">\u70B9\u51FB\u9009\u62E9\u6587\u4EF6\uFF0C\u6216\u62D6\u62FD\u5230\u6B64\u5904\uFF08\u53EF\u591A\u9009\uFF09</div>
        <div class="muted">\u652F\u6301 PDF / \u626B\u63CF\u4EF6 / \u56FE\u7247 / Word / Excel</div>
      </label>
      <div id="exList" style="margin-top:8px"></div>
      <div class="row" style="margin-top:12px">
        <button class="btn btn-primary" id="exRun">\u5F00\u59CB\u63D0\u53D6</button>
        <button class="btn btn-ghost" id="exDemo">\u586B\u5165\u6863\u6848\u793A\u4F8B</button>
      </div>
    </div>
    <div id="exResult" style="margin-top:16px"></div>`;let a=[],s=t=>e.querySelector(t);Tt(e,"#exDrop","#exFiles",t=>{a.push(...t),Qe(s("#exList"),a)}),s("#exDemo").addEventListener("click",async()=>{let t=s("#exDemo");t.disabled=!0,t.textContent="\u8F7D\u5165\u793A\u4F8B\u6750\u6599\u2026";try{let n=await Ea();a.length=0,a.push(...n),Qe(s("#exList"),a),v("\u5DF2\u8F7D\u5165 4 \u4EFD\u5B66\u751F\u7535\u5B50\u6863\u6848\u6750\u6599\uFF1A\u8EAB\u4EFD\u8BC1\u626B\u63CF\u4EF6 PDF\u3001\u9AD8\u4E2D\u6BD5\u4E1A\u8BC1 PDF\u3001\u5F55\u53D6\u901A\u77E5\u4E66\u56FE\u7247 Word\u3001\u5B66\u7C4D\u5728\u7EBF\u9A8C\u8BC1\u62A5\u544A Word","success")}catch(n){v(n.message,"error")}finally{t.disabled=!1,t.textContent="\u586B\u5165\u793A\u4F8B\u6750\u6599"}}),s("#exRun").addEventListener("click",async()=>{if(!a.length){v("\u8BF7\u5148\u4E0A\u4F20\u6587\u4EF6","error");return}let t=s("#exRun");t.disabled=!0,t.textContent="\u63D0\u53D6\u4E2D\u2026";try{let n=new FormData;a.forEach(l=>n.append("files",l));let d=await m.upload("/office/extract-fields",n);s("#exResult").innerHTML=Xs(d.files),s("#exResult").scrollIntoView({behavior:"smooth",block:"start"})}catch(n){v(n.message,"error")}finally{t.disabled=!1,t.textContent="\u5F00\u59CB\u63D0\u53D6"}})}function Xs(e){return e.map(a=>`<div class="card" style="margin-bottom:14px">
        <div class="spread">
          <div class="row" style="gap:8px;align-items:center">
            ${At(a.name)}
            <strong style="font-size:14px">${i(a.name)}</strong>
          </div>
          <div class="row" style="gap:6px">
            ${a.source==="ocr"?'<span class="tag tag-gold">OCR \u8BC6\u522B</span>':""}
            ${a.source==="native"?'<span class="tag tag-blue">\u6587\u672C\u5C42\u89E3\u6790</span>':""}
            <span class="tag">${a.fields.length} \u4E2A\u5B57\u6BB5</span>
          </div>
        </div>
        ${a.error?`<div class="muted" style="margin-top:10px">${i(a.error)}</div>`:""}
        ${a.fields.length?`<div class="table-wrap" style="margin-top:12px"><table>
                <thead><tr><th style="width:34%">\u5B57\u6BB5</th><th>\u503C</th></tr></thead>
                <tbody>${a.fields.map(s=>`<tr><td><strong>${i(s.field)}</strong></td><td>${i(s.value)||'<span class="muted">\u2014</span>'}</td></tr>`).join("")}</tbody>
              </table></div>`:""}
        ${a.text?`<details style="margin-top:10px"><summary class="small" style="cursor:pointer">\u67E5\u770B\u8BC6\u522B\u6587\u672C</summary>
          <div class="ex-text">${i(a.text)}</div></details>`:""}
      </div>`).join("")}function ei(e){e.innerHTML=`
    <div class="verify-grid">
      <div class="card">
        <div class="spread"><div class="card-title">\u7B2C 1 \u6B65 \xB7 \u4E0A\u4F20\u89C4\u5219\u6587\u6863</div><span class="tag tag-blue">Word / PDF / \u56FE\u7247</span></div>
        <div class="card-desc" style="margin-top:4px">\u4E0A\u4F20\u5165\u5B66\u8D44\u683C\u590D\u6838\u901A\u77E5\u3001\u5F55\u53D6\u4FE1\u606F\u6838\u5BF9\u8868\u3001\u5B66\u7C4D\u6863\u6848\u7BA1\u7406\u529E\u6CD5\u7B49\uFF0C\u81EA\u52A8\u751F\u6210\u6863\u6848\u6838\u67E5\u5B57\u6BB5\u4E0E\u6807\u51C6\u503C\u3002</div>
        <label class="upload-drop" id="vfRuleDrop">
          <input type="file" id="vfRule" multiple accept=".docx,.pdf,.png,.jpg,.jpeg,.txt,.md" hidden>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 16V4m0 0l-4 4m4-4l4 4"/><path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/></svg>
          <div class="upload-drop-text">\u70B9\u51FB\u9009\u62E9\u89C4\u5219\u6587\u6863\uFF0C\u6216\u62D6\u62FD\u5230\u6B64\u5904</div>
          <div class="muted">\u5982\uFF1A\u300A\u5B66\u751F\u5B66\u7C4D\u6863\u6848\u7BA1\u7406\u529E\u6CD5\u300B.pdf \xB7 \u65B0\u751F\u5165\u5B66\u8D44\u683C\u590D\u6838\u901A\u77E5.docx</div>
        </label>
        <div id="vfRuleFiles" style="margin-top:8px"></div>
        <div class="row" style="margin-top:10px">
          <button class="btn btn-primary" id="vfBuild">\u751F\u6210\u6838\u67E5\u89C4\u5219</button>
          <button class="btn btn-ghost btn-sm" id="vfDemo">\u7528\u65E0\u7EB8\u5316\u6863\u6848\u793A\u4F8B</button>
        </div>
      </div>

      <div class="card">
        <div class="spread"><div class="card-title">\u6838\u67E5\u89C4\u5219</div><span class="tag tag-gold" id="vfRuleState">\u5F85\u751F\u6210</span></div>
        <div class="card-desc" style="margin-top:4px">\u81EA\u52A8\u62BD\u53D6\u6BD4\u5BF9\u5B57\u6BB5\u4E0E\u6807\u51C6\u503C\uFF1B\u53EF\u52FE\u9009\u542F\u7528\u3001\u4FEE\u6539\u6807\u51C6\u503C\u540E\u6838\u67E5\u3002</div>
        <div id="vfRuleView" style="margin-top:10px"><div class="muted">\u4E0A\u4F20\u89C4\u5219\u6587\u6863\u5E76\u70B9\u51FB\u300C\u751F\u6210\u6838\u67E5\u89C4\u5219\u300D\u540E\u663E\u793A</div></div>
      </div>
    </div>

    <div class="card" style="margin-top:14px">
      <div class="spread"><div class="card-title">\u7B2C 2 \u6B65 \xB7 \u4E0A\u4F20\u5F85\u6838\u67E5\u6587\u4EF6</div><span class="tag" id="vfCount">0 \u4EFD</span></div>
      <div class="card-desc" style="margin-top:4px">\u8EAB\u4EFD\u8BC1\u3001\u9AD8\u4E2D\u6BD5\u4E1A\u8BC1\u3001\u5F55\u53D6\u901A\u77E5\u4E66\u3001\u5B66\u7C4D\u5728\u7EBF\u9A8C\u8BC1\u62A5\u544A\u7B49\uFF08PDF / \u56FE\u7247 / Word\uFF09\uFF0C\u9010\u4EFD\u4E0E\u6863\u6848\u89C4\u5219\u6838\u67E5\uFF1B\u626B\u63CF\u4EF6\u81EA\u52A8\u8D70 OCR\u3002</div>
      <label class="upload-drop" id="vfFilesDrop">
        <input type="file" id="vfFiles" multiple accept=".pdf,.png,.jpg,.jpeg,.docx,.xlsx,.txt,.md" hidden>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 16V4m0 0l-4 4m4-4l4 4"/><path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/></svg>
        <div class="upload-drop-text">\u70B9\u51FB\u9009\u62E9\u6587\u4EF6\uFF0C\u6216\u62D6\u62FD\u5230\u6B64\u5904\uFF08\u53EF\u591A\u9009\uFF09</div>
        <div class="muted">\u652F\u6301 docx / pdf / \u56FE\u7247 / xlsx / txt</div>
      </label>
      <div id="vfList" style="margin-top:8px"></div>
      <div class="row" style="margin-top:12px">
        <select class="select" id="vfCombinator" style="width:auto">
          <option value="and">\u5168\u90E8\u5B57\u6BB5\u6EE1\u8DB3\u624D\u901A\u8FC7\uFF08AND\uFF09</option>
          <option value="or">\u4EFB\u4E00\u5B57\u6BB5\u6EE1\u8DB3\u5373\u901A\u8FC7\uFF08OR\uFF09</option>
        </select>
        <button class="btn btn-primary" id="vfRun">\u5F00\u59CB\u6838\u67E5</button>
      </div>
    </div>
    <div id="vfResult"></div>`;let a=r=>e.querySelector(r),s=[],t=[],n=null;Tt(e,"#vfRuleDrop","#vfRule",r=>{s.push(...r),d()}),Tt(e,"#vfFilesDrop","#vfFiles",r=>{t.push(...r),a("#vfCount").textContent=`${t.length} \u4EFD`,Qe(a("#vfList"),t,()=>a("#vfCount").textContent=`${t.length} \u4EFD`)});function d(){a("#vfRuleFiles").innerHTML=s.map((r,o)=>`<div class="app-file">${At(r.name)}
        <div class="app-file-main" title="${i(r.name)}"><strong>${i(r.name)}</strong><span class="muted">\u89C4\u5219\u6587\u6863</span></div>
        <button class="app-file-act" data-rpreview="${o}" title="\u9884\u89C8">\u{1F441}</button>
        <button class="app-file-rm" data-rrm="${o}">\xD7</button>
      </div>`).join(""),a("#vfRuleFiles").querySelectorAll("[data-rrm]").forEach(r=>{r.addEventListener("click",()=>{s.splice(Number(r.getAttribute("data-rrm")),1),d()})}),a("#vfRuleFiles").querySelectorAll("[data-rpreview]").forEach(r=>{r.addEventListener("click",()=>La(s[Number(r.getAttribute("data-rpreview"))]))})}async function l(){if(!s.length){v("\u8BF7\u5148\u4E0A\u4F20\u89C4\u5219\u6587\u6863\uFF08\u590D\u6838\u901A\u77E5 / \u6863\u6848\u7BA1\u7406\u529E\u6CD5\u7B49\uFF09","error");return}let r=a("#vfBuild");r.disabled=!0,r.textContent="\u6B63\u5728\u9605\u8BFB\u6587\u6863\u2026",a("#vfRuleState").textContent="\u751F\u6210\u4E2D";try{let o=new FormData;s.forEach(_=>o.append("files",_)),n=(await m.upload("/office/build-rule",o)).rule,a("#vfRuleState").textContent=`\u5DF2\u751F\u6210 ${n.labels.length} \u4E2A\u5B57\u6BB5`,c(),v("\u6838\u67E5\u89C4\u5219\u5DF2\u751F\u6210\uFF0C\u53EF\u7F16\u8F91\u6807\u51C6\u503C\u540E\u5F00\u59CB\u6838\u67E5","success")}catch(o){a("#vfRuleState").textContent="\u751F\u6210\u5931\u8D25",v(o.message,"error")}finally{r.disabled=!1,r.textContent="\u751F\u6210\u6838\u67E5\u89C4\u5219"}}function c(){n&&(a("#vfCombinator").value=n.combinator||"and",a("#vfRuleView").innerHTML=`
      ${n.docs?.length?`<div class="muted" style="margin-bottom:8px;font-size:11px">\u5DF2\u9605\u8BFB\uFF1A${n.docs.map(r=>i(r.name)).join("\u3001")}</div>`:""}
      ${n.labels.map((r,o)=>{let h=n.notes&&n.notes[r]||"";return`<div class="cond-row">
            <label class="cond-check"><input type="checkbox" data-vl="${o}" checked></label>
            <div class="cond-main">
              <div class="cond-label">${i(r)}</div>
              <input class="input cond-std" data-va="${o}" value="${i(n.anchor[r]||"")}" placeholder="\u6807\u51C6\u503C\uFF08\u6838\u67E5\u57FA\u51C6\uFF09">
              ${h?`<div class="cond-src">${i(h)}</div>`:""}
            </div>
          </div>`}).join("")}`,a("#vfRuleView").querySelectorAll("[data-vl]").forEach(r=>{r.addEventListener("change",()=>{let o=n.labels[Number(r.getAttribute("data-vl"))];n.anchor[o]=r.checked&&n.anchor[o]||"",n.anchor[o+"__disabled"]=r.checked?"":"1"})}),a("#vfRuleView").querySelectorAll("[data-va]").forEach(r=>{r.addEventListener("input",()=>{n.anchor[n.labels[Number(r.getAttribute("data-va"))]]=r.value})}))}a("#vfBuild").addEventListener("click",l),a("#vfDemo").addEventListener("click",async()=>{let r=a("#vfDemo");r.disabled=!0,r.textContent="\u8F7D\u5165\u4E2D\u2026";try{s.length=0;for(let[h,_]of Gs){let E=await fetch(h);if(!E.ok)throw new Error(`\u793A\u4F8B\u89C4\u5219\u6587\u6863\u52A0\u8F7D\u5931\u8D25\uFF1A${_}`);let k=await E.blob();s.push(new File([k],_,{type:k.type}))}d();let o=await Ea();t.length=0,t.push(...o),a("#vfCount").textContent=`${t.length} \u4EFD`,Qe(a("#vfList"),t,()=>a("#vfCount").textContent=`${t.length} \u4EFD`),v("\u5DF2\u8F7D\u5165\u590D\u6838\u901A\u77E5\u3001\u6863\u6848\u7BA1\u7406\u529E\u6CD5\u4E0E 4 \u4EFD\u5B66\u751F\u6863\u6848\u6750\u6599\uFF0C\u70B9\u51FB\u300C\u751F\u6210\u6838\u67E5\u89C4\u5219\u300D","success")}catch(o){v(o.message,"error")}finally{r.disabled=!1,r.textContent="\u7528\u65E0\u7EB8\u5316\u6863\u6848\u793A\u4F8B"}}),a("#vfRun").addEventListener("click",async()=>{if(!n){v("\u8BF7\u5148\u4E0A\u4F20\u89C4\u5219\u6587\u6863\u5E76\u751F\u6210\u6838\u67E5\u89C4\u5219","error");return}if(!t.length){v("\u8BF7\u4E0A\u4F20\u5F85\u6838\u67E5\u6587\u4EF6","error");return}let r=[],o={};if(n.labels.forEach((E,k)=>{let f=a("#vfRuleView").querySelector(`[data-vl="${k}"]`);if(f&&!f.checked)return;let M=a("#vfRuleView").querySelector(`[data-va="${k}"]`),q=M?M.value.trim():String(n.anchor[E]||"").trim();r.push(E),q&&(o[E]=q)}),!r.length){v("\u8BF7\u81F3\u5C11\u542F\u7528\u4E00\u4E2A\u6838\u67E5\u5B57\u6BB5","error");return}let h=new File([JSON.stringify({combinator:a("#vfCombinator").value,anchor:o,rules:[{tags:["\u5F85\u6838\u67E5\u6587\u4EF6"],match_type:"equal",labels:r}]})],"rule.json",{type:"application/json"}),_=a("#vfRun");_.disabled=!0,_.textContent="\u6B63\u5728\u6838\u67E5\u2026";try{let E=new FormData;t.forEach(f=>E.append("files",f)),E.append("rule_file",h);let k=await m.upload("/office/verify-match",E);a("#vfResult").innerHTML=ti(k),a("#vfResult").scrollIntoView({behavior:"smooth",block:"start"})}catch(E){v(E.message,"error")}finally{_.disabled=!1,_.textContent="\u5F00\u59CB\u6838\u67E5"}})}function ti(e){let a=e.summary;return`
    <div class="rv-banner ${a.failed===0?"rv-pass":"rv-warn"}">
      <div class="rv-verdict">${a.failed===0?"\u5168\u90E8\u901A\u8FC7":`${a.passed} / ${a.total} \u901A\u8FC7`}</div>
      <div class="rv-conclusion">\u65E0\u660E\u786E\u4E0D\u4E00\u81F4\u5373\u901A\u8FC7 \xB7 ${a.failed} \u4EFD\u5B58\u5728\u4E0D\u4E00\u81F4\u9879 \xB7 ${e.combinator.toUpperCase()} \u7EC4\u5408 \xB7 \u951A\u5B9A\u503C\u6765\u81EA${Object.keys(e.anchor).length?"\u89C4\u5219\u6587\u6863":"\u9996\u4EFD\u6587\u4EF6"}</div>
    </div>
    <div class="card" style="padding:0;overflow:auto">
      <table class="grid-table">
        <thead><tr><th class="gt-room-col">\u6587\u4EF6</th>
          ${e.labels.map(s=>`<th>${i(s)}<div class="gt-time">\u951A\u5B9A\uFF1A${i(e.anchor[s]||"\u2014")}</div></th>`).join("")}
          <th>\u7ED3\u8BBA</th></tr></thead>
        <tbody>
          ${e.results.map(s=>`<tr>
                <td class="gt-room"><strong>${i(s.name)}</strong>
                  <div class="gt-meta">${s.source==="ocr"?"OCR \u8BC6\u522B":"\u6587\u672C\u5C42"} \xB7 ${s.pass_count} \u9879\u4E00\u81F4${s.missing_count?` \xB7 ${s.missing_count} \u9879\u672A\u63D0\u53CA`:""}${s.fail_count?` \xB7 ${s.fail_count} \u9879\u4E0D\u4E00\u81F4`:""}</div></td>
                ${s.checks.map(t=>t.verdict==="pass"?`<td class="gt-cell cell-free" title="${i(t.actual)}">\u2713</td>`:t.verdict==="fail"?`<td class="gt-cell mt-fail" title="\u5B9E\u9645\uFF1A${i(t.actual)}">\u2717</td>`:'<td class="gt-cell cell-course" title="\u6750\u6599\u4E2D\u672A\u63D0\u53CA\u8BE5\u5B57\u6BB5\uFF08\u4E0D\u5F71\u54CD\u5224\u5B9A\uFF09">\u2014</td>').join("")}
                <td class="gt-cell ${s.passed?"cell-free":"mt-fail"}">${s.passed?"\u901A\u8FC7":"\u4E0D\u4E00\u81F4"}</td>
              </tr>`).join("")}
        </tbody>
      </table>
    </div>
    <div class="muted" style="margin-top:10px;font-size:11.5px">\u5224\u5B9A\u539F\u5219\uFF1A\u672A\u63D0\u53CA\uFF08\u2014\uFF09\u4E0D\u5426\u51B3\uFF0C\u4EC5\u63D0\u793A\u4EBA\u5DE5\u53C2\u8003\uFF1B\u53EA\u6709\u660E\u786E\u4E0D\u4E00\u81F4\uFF08\u2717\uFF09\u624D\u5224\u4E0D\u901A\u8FC7\u3002</div>`}function _a(e){e.innerHTML=`
    <div class="card">
      <div class="spread"><div class="card-title">\u7C98\u8D34\u804A\u5929\u8BB0\u5F55 \u2192 \u6279\u91CF\u8F6C\u5F85\u529E</div><span class="tag tag-blue">\u5FAE\u4FE1 / QQ</span></div>
      <div class="card-desc" style="margin-top:4px">\u628A\u7FA4\u91CC\u8001\u5E08/\u540C\u5B66\u5206\u6D3E\u7ED9\u4F60\u7684\u6D88\u606F\u6574\u6BB5\u7C98\u8D34\u8FDB\u6765\uFF0CAI \u81EA\u52A8\u8BC6\u522B\u591A\u6761\u5F85\u529E\uFF0C\u52FE\u9009\u540E\u6279\u91CF\u52A0\u5165\u3002</div>
      <div class="ct-split">
        <div class="ct-left">
          <textarea class="textarea" id="ctText" style="min-height:130px;margin-top:0" placeholder="\u4F8B\uFF1A@\u5F20\u4E09 \u660E\u5929\u4E0B\u53483\u70B9\u524D\u628A\u7EC4\u4F1APPT\u53D1\u6211\u90AE\u7BB1&#10;@\u674E\u56DB \u5468\u4E94\u4E4B\u524D\u63D0\u4EA4\u62A5\u9500\u5355\u5230\u8D22\u52A1\u5904&#10;\u5468\u56DB\u665A\u4E0A\u7EC4\u4F1A\u8BB0\u5F97\u51C6\u5907\u6587\u732E\u6C47\u62A5"></textarea>
          <div class="row" style="margin-top:10px">
            <button class="btn btn-primary" id="ctRun">\u89E3\u6790</button>
            <button class="btn btn-ghost btn-sm" id="ctDemo">\u586B\u5165\u793A\u4F8B</button>
          </div>
        </div>
        <div id="ctResult" class="ct-right"><div class="muted" style="font-size:12px;line-height:1.6">\u89E3\u6790\u540E\u7684\u5F85\u529E\u4F1A\u663E\u793A\u5728\u8FD9\u91CC</div></div>
      </div>
    </div>`;let a=s=>e.querySelector(s);a("#ctDemo").addEventListener("click",()=>{a("#ctText").value=`@\u5F20\u4E09 \u660E\u5929\u4E0B\u53483\u70B9\u524D\u628A\u7EC4\u4F1APPT\u53D1\u6211\u90AE\u7BB1
@\u674E\u56DB \u5468\u4E94\u4E4B\u524D\u63D0\u4EA4\u62A5\u9500\u5355\u5230\u8D22\u52A1\u5904
\u5468\u56DB\u665A\u4E0A\u7EC4\u4F1A\u8BB0\u5F97\u51C6\u5907\u6587\u732E\u6C47\u62A5`,v("\u5DF2\u586B\u5165\u793A\u4F8B\u804A\u5929\u8BB0\u5F55","success")}),a("#ctRun").addEventListener("click",async()=>{let s=a("#ctText").value.trim();if(!s){v("\u8BF7\u5148\u7C98\u8D34\u804A\u5929\u8BB0\u5F55","error");return}let t=a("#ctRun");t.disabled=!0,t.textContent="\u6B63\u5728\u89E3\u6790\u2026";try{let d=(await m.post("/self/control/tasks/parse-multi",{text:s})).tasks||[];if(!d.length){v("\u672A\u80FD\u8BC6\u522B\u51FA\u5F85\u529E\u4E8B\u9879","error");return}a("#ctResult").innerHTML=`
        <div class="card">
          <div class="spread"><div class="card-title">\u8BC6\u522B\u51FA ${d.length} \u6761\u5F85\u529E</div><span class="tag tag-green">\u52FE\u9009\u540E\u6279\u91CF\u52A0\u5165</span></div>
          <div style="margin-top:8px">
            ${d.map((l,c)=>`<label class="ct-row">
                  <input type="checkbox" checked data-i="${c}">
                  <div style="min-width:0;flex:1">
                    <div style="font-size:13px;font-weight:600">${i(l.title)}</div>
                    <div class="muted" style="font-size:11px">${l.date||"\u65E5\u671F\u672A\u5B9A"}${l.time?" "+l.time:""}${l.place?" \xB7 "+i(l.place):""} \xB7 \u7EA6 ${l.estimate_min} \u5206\u949F</div>
                  </div>
                </label>`).join("")}
          </div>
          <button class="btn btn-primary btn-sm" id="ctSave" style="margin-top:12px">\u52A0\u5165\u5F85\u529E\uFF08\u52FE\u9009\u9879\uFF09</button>
        </div>`,a("#ctSave").addEventListener("click",async()=>{let l=[...e.querySelectorAll("#ctResult input:checked")].map(o=>d[Number(o.dataset.i)]);if(!l.length){v("\u8BF7\u81F3\u5C11\u52FE\u9009\u4E00\u6761","error");return}let c=a("#ctSave");c.disabled=!0;let r=0;for(let o of l)try{await m.post("/self/control/tasks",{title:o.title,plan_date:o.date||Sa(),due_at:o.time?`${o.date||Sa()} ${o.time}`:"",estimate_min:o.estimate_min||30,priority:"P1",source:"message",next_action:o.place||""}),r+=1}catch{}v(`\u5DF2\u52A0\u5165 ${r} \u6761\u5F85\u529E`,"success"),a("#ctResult").innerHTML='<div class="empty"><strong>\u5DF2\u5168\u90E8\u52A0\u5165\u5F85\u529E</strong>\u53EF\u5728\u300C\u4ECA\u65E5\u300D\u4E0E\u300C\u8BA1\u5212\u300D\u4E2D\u67E5\u770B</div>'})}catch(n){v(n.message,"error")}finally{t.disabled=!1,t.textContent="\u89E3\u6790"}})}ve();var ai='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11Z"/><circle cx="12" cy="10" r="2.6"/></svg>',si='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="9" r="3"/><circle cx="17" cy="10.5" r="2.4"/><path d="M3.5 19.5c.6-2.8 2.7-4.2 5.5-4.2s4.9 1.4 5.5 4.2"/><path d="M15 15.6c2.2.1 3.6 1.3 4 3.4"/></svg>',ii='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M5 8h14l-1.4 12.2a1.6 1.6 0 0 1-1.6 1.4H8a1.6 1.6 0 0 1-1.6-1.4L5 8Z"/><path d="M8.6 8V6.2a3.4 3.4 0 0 1 6.8 0V8"/></svg>',ni='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a4.5 4.5 0 0 0-6 5.6L3 17.6V21h3.4l5.7-5.7a4.5 4.5 0 0 0 5.6-6L14.5 12l-2.5-2.5 2.7-3.2Z"/></svg>';function di(e,a,s=[]){return`<div class="detail-hero book-hero">
    <div class="detail-art"><svg viewBox="0 0 200 160" fill="none">
      <circle cx="88" cy="84" r="52" stroke="#8fdcff" stroke-opacity=".4" stroke-width="1.6"/>
      <path d="M88 44 V124 M48 84 H128" stroke="#8fdcff" stroke-opacity=".3" stroke-width="1.4"/>
      <path d="M56 66 Q88 44 120 66 M56 102 Q88 124 120 102" stroke="#eaf7ff" stroke-opacity=".4" stroke-width="1.4"/>
      <circle cx="88" cy="84" r="14" fill="#8fdcff" opacity=".2"/>
      <path d="M148 56 l-6 22 22-6" stroke="#f0cf94" stroke-opacity=".75" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="156" cy="118" r="12" stroke="#f0cf94" stroke-opacity=".5" stroke-width="1.6"/>
    </svg></div>
    <div class="tag">CAMPUS LIFE</div>
    <h1>${e}</h1>
    <p>${a}</p>
    ${s.length?`<div class="bh-stats">${s.map(([t,n])=>`<div class="bh-stat"><b>${t}</b><span>${n}</span></div>`).join("")}</div>`:""}
  </div>`}function ct({href:e,tone:a,ico:s,title:t,badge:n,desc:d,stat:l,btn:c}){return`<a class="ze-card" href="${e}">
    <div class="hic ${a}">${s}</div>
    <div class="ze-body">
      <div class="ze-name">${t}${n?`<span class="hb">${n}</span>`:""}</div>
      <div class="ze-desc">${d}</div>
      <div class="ze-stat">${l}</div>
    </div>
    <span class="ze-cta">${c} \u203A</span>
  </a>`}async function qa(e,a){let[s,t,n]=await Promise.all([m.get("/savings/summary").catch(()=>({saved:0})),m.get("/buddy/posts").catch(()=>[]),m.get("/repairs/my").catch(()=>[])]),d=t.filter(r=>r.status==="open").length,l=n.filter(r=>r.status!=="done").length,c=Se(s.saved||0);e.innerHTML=`
    ${di("\u751F\u6D3B\u533A","\u51FA\u884C\u3001\u793E\u4EA4\u3001\u6D88\u8D39\u4E0E\u62A5\u4FEE\uFF0C\u6821\u56ED\u751F\u6D3B\u7684\u65E5\u5E38\u5165\u53E3\u3002",[[d,"\u4E2A\u8FDB\u884C\u4E2D\u642D\u5B50"],[`\xA5${c}`,"\u7D2F\u8BA1\u5DF2\u7701"],[l,"\u4E2A\u62A5\u4FEE\u5904\u7406\u4E2D"]])}

    <div class="ze-grid">
      ${ct({href:"#/life/nav",tone:"b",ico:ai,title:"\u6821\u56ED\u5BFC\u822A",badge:"\u771F\u5B9E\u5730\u56FE",desc:"\u522B\u540D\u641C\u7D22 \xB7 \u6B65\u884C\u8DEF\u7EBF \xB7 \u5524\u8D77\u9AD8\u5FB7",stat:"25 \u4E2A\u6821\u56ED\u5730\u70B9 \xB7 \u652F\u6301\u53E3\u8BED\u53EB\u6CD5",btn:"\u5E26\u6211\u53BB"})}
      ${ct({href:"#/life/buddy",tone:"o",ico:si,title:"\u627E\u642D\u5B50",badge:`${d} \u8FDB\u884C\u4E2D`,desc:"\u627E\u6D3B\u52A8 \xB7 \u627E\u642D\u5B50 \xB7 \u7AD9\u5185\u804A\u5929",stat:"\u6309\u5174\u8DA3\u548C\u7A7A\u95F2\u65F6\u95F4\u627E\u642D\u5B50",btn:"\u627E\u642D\u5B50"})}
      ${ct({href:"#/life/deal",tone:"p",ico:ii,title:"\u7701\u4E00\u7701",badge:"\u7406\u6027\u6D88\u8D39",desc:"\u8D2D\u4E70\u8BA1\u5212 \xB7 \u653E\u5F03\u5373\u7701\u94B1\uFF0C\u628A\u94B1\u82B1\u660E\u767D",stat:`\u7D2F\u8BA1\u5DF2\u7701 <b>\xA5${c}</b>`,btn:"\u53BB\u7701\u94B1"})}
      ${ct({href:"#/repair",tone:"v",ico:ni,title:"\u62A5\u4FEE",badge:"",desc:"\u5BBF\u820D \xB7 \u6559\u5B66\u697C \xB7 \u516C\u5171\u533A\u57DF\u8BBE\u65BD\u95EE\u9898",stat:`\u4E00\u5904\u63D0\u4EA4 \xB7 \u8FDB\u5EA6\u5168\u7A0B\u53EF\u67E5${l?` \xB7 <b>${l}</b> \u4E2A\u5904\u7406\u4E2D`:""}`,btn:"\u53BB\u62A5\u4FEE"})}
    </div>

`}async function Ta(e,a){let[s,t]=await Promise.all([m.get("/deal/overview").catch(()=>null),m.get("/deals?limit=4&exclude_voted=1").catch(()=>[])]),n=s.money,d=s.plans||[],l=s.discussions||[],c=k=>`<a class="card deal-plan-card" href="#/life/deal/plan?id=${k.id}">
    <div class="spread"><strong>${i(k.title||k.product_name)}</strong><span class="tag ${k.decision_status==="cooling"?"tag-warn":k.decision_status==="purchased"?"tag-green":"tag-blue"}">${ci[k.decision_status]||k.decision_status}</span></div>
    <div class="muted" style="font-size:11.5px;margin-top:4px">\u9884\u8BA1 \xA5${Ke(k.price)} \xB7 \u9884\u7B97 \xA5${Ke(k.budget)} \xB7 ${k.visibility==="private"?"\u4EC5\u81EA\u5DF1":"\u6821\u56ED\u516C\u5F00"}</div>
    <div class="muted" style="font-size:11px;margin-top:2px">${i(k.scene||"\u672A\u586B\u5199\u4F7F\u7528\u573A\u666F")}</div>
  </a>`;e.innerHTML=`<div class="page-head"><div>
      <div class="page-title">\u7701\u4E00\u7701 \xB7 \u7406\u6027\u6D88\u8D39\u51B3\u7B56</div>
      <div class="page-sub">\u5148\u786E\u8BA4\u662F\u5426\u9700\u8981\u3001\u662F\u5426\u9002\u5408\u3001\u4EF7\u683C\u662F\u5426\u5408\u7406\u3001\u54EA\u91CC\u66F4\u4FBF\u5B9C\u3001\u8981\u4E0D\u8981\u518D\u7B49\u7B49\u3002\u7CFB\u7EDF\u53EA\u7ED9\u5EFA\u8BAE\uFF0C\u51B3\u5B9A\u7531\u4F60\u4F5C\u51FA\u3002</div>
    </div><a class="btn btn-primary deal-new-btn" href="#/life/deal/new"><span class="deal-new-ico">\uFF0B</span>\u53D1\u8D77\u8D2D\u4E70\u8BA1\u5212</a></div>

    <div class="grid grid-3 deal-money" style="margin-bottom:10px">
      <div class="stat"><div class="stat-num">\xA5${Ke(n.planned_total)}</div><div class="stat-label">\u8BA1\u5212\u8D2D\u4E70\u603B\u989D</div></div>
      <div class="stat"><div class="stat-num">\xA5${Ke(n.deferred_total)}</div><div class="stat-label">\u5DF2\u6682\u7F13\u8BA1\u5212</div></div>
      <div class="stat"><div class="stat-num">\xA5${Ke(n.abandoned_total)}</div><div class="stat-label">\u5DF2\u653E\u5F03\u8BA1\u5212</div></div>
    </div>
    <div class="deal-caveat">${i(n.note)}</div>

    <div class="grid grid-2" style="margin-top:16px">
      <div class="card">
        <div class="spread"><div class="card-title">\u6211\u7684\u5F85\u51B3\u7B56\u8BA1\u5212</div><span class="tag">${d.length} \u4E2A</span></div>
        ${d.length?d.slice(0,6).map(c).join(""):`<div class="empty" style="padding:28px 0"><strong>\u8FD8\u6CA1\u6709\u8D2D\u4E70\u8BA1\u5212</strong>
              <div class="muted" style="margin-top:6px">\u586B\u5199\u5546\u54C1\u3001\u9884\u7B97\u548C\u7528\u9014\uFF0C\u7CFB\u7EDF\u4F1A\u5E2E\u4F60\u6BD4\u8F83\u62A5\u4EF7\u3001\u8BB0\u5F55\u4EF7\u683C\u53D8\u5316\u5E76\u6574\u7406\u8BC1\u636E\u3002</div>
              <a class="btn btn-primary btn-sm" href="#/life/deal/new" style="margin-top:12px">\u53D1\u8D77\u7B2C\u4E00\u4E2A\u8BA1\u5212</a></div>`}
      </div>
      <div class="card">
        <div class="spread"><div class="card-title">\u6B63\u5728\u8FDB\u884C\u7684\u8BA8\u8BBA</div><span class="tag tag-blue">\u793E\u533A\u610F\u89C1\u503E\u5411</span></div>
        ${l.length?l.map(k=>`<a class="deal-discuss-row" href="#/life/deal/plan?id=${k.id}">
              <div class="spread"><strong>${i(k.title||k.product_name)}</strong><span class="tag tag-blue">${k.end_mode==="target_votes"?`\u6EE1 ${k.target_votes} \u4EBA`:"\u6309\u65F6\u622A\u6B62"}</span></div>
              <div class="muted" style="font-size:11.5px">${i(k.scene||"")}</div>
            </a>`).join(""):`<div class="empty" style="padding:28px 0"><strong>\u6682\u65E0\u516C\u5F00\u8BA8\u8BBA</strong>
              <div class="muted" style="margin-top:6px">\u53D1\u5E03\u6821\u56ED\u516C\u5F00\u8BA8\u8BBA\u540E\uFF0C\u540C\u5B66\u53EF\u4EE5\u7ED9\u51FA\u652F\u6301\u3001\u659F\u914C\u3001\u518D\u7B49\u7B49\u6216\u4E0D\u5EFA\u8BAE\u8D2D\u4E70\u7684\u610F\u89C1\u3002</div></div>`}
      </div>
    </div>

    <div class="spread" style="margin-top:22px;margin-bottom:18px;align-items:center">
      <div class="section-title" style="margin:0">\u5927\u5BB6\u600E\u4E48\u770B</div>
      <button class="btn btn-ghost btn-sm" id="dealRefresh" title="\u6362\u4E00\u6279\u65B0\u7684\u5E16\u5B50">\u21BB \u5237\u65B0</button>
    </div>
    <div id="dealList" class="grid grid-2">${t.length?t.map(jt).join(""):'<div class="card"><div class="muted">\u8FD8\u6CA1\u6709\u4EBA\u53D1\u5E03\u60F3\u4E70\u7684\u4E1C\u897F\u3002</div></div>'}</div>
    <div class="muted" style="margin-top:12px;font-size:11.5px">\u6295\u7968\u53EA\u4F5C\u53C2\u8003\uFF0C\u4E0D\u6539\u53D8\u4F60\u7684\u4E2A\u4EBA\u51B3\u7B56\u3002</div>`;let r=e.querySelector("#dealList"),o=new Set(t.map(k=>k.id));async function h(k=4){let f=await m.get(`/deals?exclude=${[...o].join(",")}&exclude_voted=1&limit=${k}`),M=!1;return!f.length&&o.size&&(o.clear(),f=await m.get(`/deals?exclude_voted=1&limit=${k}`),M=!0),{list:f,restarted:M}}async function _(){let k=e.querySelector("#dealRefresh");k&&(k.disabled=!0);try{let{list:f,restarted:M}=await h(4);if(!f.length){v("\u6682\u65F6\u6CA1\u6709\u65B0\u7684\u5E16\u5B50\u4E86\uFF0C\u7A0D\u540E\u518D\u6765\u770B\u770B","success");return}r.innerHTML=f.map(jt).join(""),f.forEach(q=>o.add(q.id)),E(),v(M?`\u5DF2\u770B\u5B8C\u5168\u90E8\u5E16\u5B50\uFF0C\u91CD\u65B0\u5F00\u59CB\u4E00\u6279\uFF08${f.length} \u4E2A\uFF09`:`\u5DF2\u6362\u4E00\u6279\uFF08${f.length} \u4E2A\u65B0\u5E16\u5B50\uFF09`,"success")}catch(f){v(f.message||"\u5237\u65B0\u5931\u8D25","error")}finally{k&&(k.disabled=!1)}}e.querySelector("#dealRefresh").addEventListener("click",_);function E(){e.querySelectorAll("[data-vote]").forEach(k=>{k.addEventListener("click",()=>{let f=k.closest(".deal-card");f.querySelectorAll("[data-vote]").forEach(q=>q.classList.remove("active")),k.classList.add("active");let M=f.querySelector(".vote-reason");M.hidden=!1,M.dataset.vote=k.getAttribute("data-vote"),M.querySelector("textarea").focus()})}),e.querySelectorAll("[data-vote-cancel]").forEach(k=>k.addEventListener("click",()=>{let f=k.closest(".deal-card");f.querySelector(".vote-reason").hidden=!0,f.querySelectorAll("[data-vote]").forEach(M=>M.classList.remove("active"))})),e.querySelectorAll("[data-vote-submit]").forEach(k=>k.addEventListener("click",async()=>{let f=k.closest(".deal-card"),M=f.querySelector(".vote-reason"),q=M.querySelector("textarea").value.trim(),U=M.dataset.vote;if(!q)return v("\u8BF7\u586B\u5199\u6295\u7968\u7406\u7531","error");try{await m.post(`/deals/${f.dataset.post}/vote`,{vote:U,reason:q}),v("\u5DF2\u63D0\u4EA4\u4F60\u7684\u610F\u89C1","success");let p=(await m.get("/deals?exclude_voted=0")||[]).find(b=>String(b.id)===String(f.dataset.post));p&&(f.outerHTML=jt(p)),E()}catch(u){v(u.message,"error")}}))}E()}var ci={undecided:"\u5C1A\u672A\u51B3\u5B9A",cooling:"\u51B7\u9759\u671F\u4E2D",purchased:"\u5DF2\u8D2D\u4E70",deferred:"\u5DF2\u6682\u7F13",abandoned:"\u5DF2\u653E\u5F03"};function Ke(e){let a=Number(e||0);return a%1===0?String(a):a.toFixed(2)}var li={buy:"\u503C\u5F97\u4E70",think:"\u518D\u60F3\u60F3",no:"\u4E0D\u4E70"};function jt(e){let a=e.votes.buy+e.votes.think+e.votes.no,s=(e.opinions||[]).filter(t=>(t.reason||"").trim());return`<div class="card deal-card" data-post="${e.id}">
    <div class="spread"><div class="card-title">${i(e.product)}</div><span class="tag tag-gold">\xA5${Se(e.price)}</span></div>
    <div class="card-desc">${i(e.reason)}</div>
    <div class="muted" style="margin-top:6px">\u5206\u7C7B\uFF1A${i(e.category)} \xB7 \u53D1\u5E03 ${i(e.created_at)}</div>
    <div class="row" style="margin-top:10px">
      <button class="chip ${e.my_vote==="buy"?"active":""}" data-post="${e.id}" data-vote="buy">\u503C\u5F97\u4E70 ${e.votes.buy}</button>
      <button class="chip ${e.my_vote==="think"?"active":""}" data-post="${e.id}" data-vote="think">\u518D\u60F3\u60F3 ${e.votes.think}</button>
      <button class="chip ${e.my_vote==="no"?"active":""}" data-post="${e.id}" data-vote="no">\u4E0D\u4E70 ${e.votes.no}</button>
    </div>
    <div class="vote-reason" hidden>
      <textarea class="input" rows="2" placeholder="\u8BF7\u5199\u4E0B\u4F60\u7684\u7406\u7531\uFF08\u5FC5\u586B\uFF09\uFF0C\u63D0\u4EA4\u540E\u4F1A\u5C55\u793A\u5728\u4E0B\u65B9"></textarea>
      <div class="row" style="justify-content:flex-end;margin-top:8px">
        <button class="btn btn-ghost btn-sm" data-vote-cancel>\u53D6\u6D88</button>
        <button class="btn btn-primary btn-sm" data-vote-submit>\u63D0\u4EA4\u610F\u89C1</button>
      </div>
    </div>
    ${s.length?`<div class="deal-opinions">
          <div class="muted" style="font-size:11px">\u5927\u5BB6\u7ED9\u51FA\u7684\u610F\u89C1</div>
          ${s.map(t=>`<div class="deal-op">
                <span class="deal-op-vote">${i(li[t.vote]||t.vote)}</span>
                <span class="deal-op-text">${i(t.reason)}</span>
                <em>${i(t.label||"\u540C\u5B66")}</em>
              </div>`).join("")}
        </div>`:""}
    <div class="muted" style="margin-top:8px">\u5171 ${a} \u4EBA\u53C2\u4E0E\u6295\u7968</div>
  </div>`}ve();var ri={library:{color:"#1e5eff",icon:"\u{1F4DA}"},building:{color:"#7048d8",icon:"\u{1F3DB}"},canteen:{color:"#e88f0a",icon:"\u{1F35C}"},sports:{color:"#0f9d68",icon:"\u26BD"},service:{color:"#e0447c",icon:"\u{1F3E5}"},gate:{color:"#64748b",icon:"\u{1F6AA}"},office:{color:"#0f6f8f",icon:"\u{1F3E2}"},dorm:{color:"#0d9488",icon:"\u{1F3E0}"},other:{color:"#64748b",icon:"\u{1F4CD}"}},oi={color:"#64748b",icon:"\u{1F4CD}"};function lt(e){return ri[e.type]||oi}function Bt(e){return`<span style="font-size:11px;line-height:1">${lt(e).icon}</span>`}async function Aa(e,a){let s=await m.get("/places"),t=a.params.get("to"),n=null,d=null,l=null,c=null,r=null,o=null,h=null,_="dest",E=null,k=!1,f=null,M=null,q={};e.innerHTML=`<div class="page-head"><div><div class="page-title">\u6821\u56ED\u5BFC\u822A</div><div class="page-sub">\u771F\u5B9E\u6821\u56ED\u5730\u56FE\uFF08\u9AD8\u5FB7\u5E95\u56FE\uFF09\uFF0C\u5730\u70B9\u5750\u6807\u6765\u81EA OpenStreetMap \u5B9E\u6D4B\u3002\u624B\u673A\u4E0A\u70B9\u201C\u5B9A\u4F4D\u5230\u6211\u201D\u5373\u53EF\u4ECE\u5F53\u524D\u4F4D\u7F6E\u89C4\u5212\u6B65\u884C\u8DEF\u7EBF\u3002</div></div></div>
    <div class="nav-layout">
      <div class="nav-map-wrap">
        <div id="navMap" class="nav-map"></div>
        <button class="nav-locate-btn" id="locateBtn" title="\u4F7F\u7528\u6211\u7684\u4F4D\u7F6E"><span>\u25CE</span> \u5B9A\u4F4D\u5230\u6211</button>
        <button class="nav-mark-btn" id="markBtn" title="\u5728\u5730\u56FE\u4E0A\u6807\u8BB0\u4E00\u4E2A\u65B0\u5730\u70B9"><span>\uFF0B</span> \u6807\u8BB0\u5730\u70B9</button>

        <div class="nav-legend">
          <span class="lg"><i style="background:#1e5eff"></i>\u56FE\u4E66\u9986</span>
          <span class="lg"><i style="background:#7048d8"></i>\u5B66\u9662\u697C</span>
          <span class="lg"><i style="background:#e88f0a"></i>\u98DF\u5802</span>
          <span class="lg"><i style="background:#0f9d68"></i>\u8FD0\u52A8\u573A\u9986</span>
          <span class="lg"><i style="background:#e0447c"></i>\u670D\u52A1\u533B\u7597</span>
          <span class="lg"><i style="background:#0d9488"></i>\u5BBF\u820D</span>
          <span class="lg"><i style="background:#64748b"></i>\u6821\u95E8</span>
        </div>
        <div class="map-attr">\xA9 \u9AD8\u5FB7\u5730\u56FE \xB7 \u5730\u70B9\u6570\u636E OpenStreetMap</div>
      </div>
      <aside class="nav-side">
        <div class="nav-mark-panel" id="markPanel" hidden>
          <div class="nav-mark-head"><b>\u6807\u8BB0\u5730\u70B9</b><button class="nav-mark-close" id="markClose" type="button" aria-label="\u5173\u95ED">\xD7</button></div>
          <div class="nav-mark-hint" id="markHint">\u70B9\u51FB\u5730\u56FE\u9009\u62E9\u4F4D\u7F6E\uFF0C\u6807\u8BB0\u53EF\u62D6\u52A8\u5FAE\u8C03</div>
          <div class="nav-mark-coord" id="markCoord">\u5C1A\u672A\u9009\u62E9\u4F4D\u7F6E</div>
          <label class="nav-mark-field"><span>\u540D\u79F0</span><input id="markName" maxlength="64" placeholder="\u4F8B\u5982\uFF1A34B\u5BBF\u820D\u697C" autocomplete="off"></label>
          <label class="nav-mark-field"><span>\u7C7B\u578B</span>
            <select id="markType">
              <option value="dorm">\u5BBF\u820D\u697C</option>
              <option value="building">\u6559\u5B66\u697C / \u5B66\u9662\u697C</option>
              <option value="library">\u56FE\u4E66\u9986 / \u81EA\u4E60\u5BA4</option>
              <option value="canteen">\u98DF\u5802</option>
              <option value="sports">\u8FD0\u52A8\u573A\u9986</option>
              <option value="service">\u670D\u52A1\u8BBE\u65BD</option>
              <option value="gate">\u6821\u95E8</option>
              <option value="other">\u5176\u4ED6</option>
            </select>
          </label>
          <label class="nav-mark-field"><span>\u522B\u540D</span><input id="markAlias" maxlength="255" placeholder="\u53EF\u9009\uFF0C\u591A\u4E2A\u7528\u9017\u53F7\u5206\u9694" autocomplete="off"></label>
          <label class="nav-mark-field"><span>\u5165\u53E3\u5907\u6CE8</span><input id="markEntrance" maxlength="255" placeholder="\u53EF\u9009\uFF0C\u4F8B\u5982\uFF1A\u4E1C\u4FA7\u95E8" autocomplete="off"></label>
          <div class="row" style="gap:8px;margin-top:4px">
            <button class="btn btn-primary btn-sm" id="markSave" type="button" disabled>\u4FDD\u5B58\u5730\u70B9</button>
            <button class="btn btn-ghost btn-sm" id="markCancel" type="button">\u53D6\u6D88</button>
          </div>
          <div id="markMine" class="nav-mark-mine"></div>
        </div>
        <div class="card" style="padding:14px">
          <div class="io-box">
            <div class="io-row" id="originRow" title="\u70B9\u51FB\u540E\u5728\u4E0B\u65B9\u5217\u8868\u9009\u62E9\u51FA\u53D1\u70B9\uFF0C\u6216\u4F7F\u7528\u5730\u56FE\u4E0A\u65B9\u300C\u5B9A\u4F4D\u5230\u6211\u300D">
              <span class="io-dot from"></span>
              <input class="io-input" id="originInput" value="\u6211\u7684\u4F4D\u7F6E" placeholder="\u8F93\u5165\u8D77\u70B9\uFF0C\u5982\uFF1A9\u53F7\u697C" autocomplete="off">
              <button class="io-swap" id="swapBtn" title="\u4EA4\u6362\u8D77\u70B9\u4E0E\u76EE\u7684\u5730" disabled>\u21C5</button>
            </div>
            <div class="io-line"></div>
            <div class="io-row">
              <span class="io-dot to"></span>
              <input class="io-input" id="placeSearch" placeholder="\u8F93\u5165\u76EE\u7684\u5730\u6216\u522B\u540D\uFF0C\u5982\uFF1A9\u53F7\u697C" autocomplete="off">
              <button class="io-locate" id="locateMeBtn" title="\u5B9A\u4F4D\u6211\u7684\u4F4D\u7F6E">\u25CE</button>
            </div>
            <div class="io-suggest" id="ioSuggest" hidden></div>
          </div>
          <div id="placeResults" class="muted" style="margin:8px 2px">\u8F93\u5165\u8D77\u70B9\u6216\u76EE\u7684\u5730\u540D\u79F0\uFF08\u652F\u6301\u522B\u540D\uFF0C\u5982 9\u53F7\u697C\uFF09\uFF0C\u4ECE\u8054\u60F3\u4E2D\u76F4\u63A5\u9009\u4E2D\uFF1B\u4E5F\u53EF\u70B9\u5730\u56FE\u6807\u8BB0\u3002</div>
          <button class="btn btn-primary" id="routeBtn" style="margin-top:12px;width:100%">\u89C4\u5212\u6B65\u884C\u8DEF\u7EBF</button>
        </div>
        <div id="routeCard"></div>
        <div class="nav-phone-row">
          <button class="nav-phone-btn" id="phoneModeBtn" title="\u624B\u673A\u5BFC\u822A\u6A21\u5F0F">\u{1F4F1} \u624B\u673A\u5BFC\u822A\u6A21\u5F0F</button>
          <button class="nav-phone-btn qr" id="phoneQrBtn" title="\u624B\u673A\u626B\u7801\u6253\u5F00\u672C\u9875">\u626B\u7801\u624B\u673A\u6253\u5F00</button>
        </div>
        <div id="navQrBox" class="nav-qr-box" hidden>
          <div id="navQrImg"></div>
          <div class="muted" style="font-size:11px;text-align:center;margin-top:6px">\u624B\u673A\u8FDE\u540C\u4E00 Wi-Fi \u626B\u7801\u6253\u5F00</div>
        </div>
      </aside>
    </div>
    <div class="nav-phone-overlay" id="phoneOverlay" hidden>
      <div class="phone-frame">
        <div class="phone-notch"></div>
        <div class="phone-screen">
          <div class="pn-head">
            <button class="pn-back" id="pnBack" title="\u9000\u51FA">\u2039</button>
            <b>\u6B65\u884C\u5BFC\u822A</b>
            <button class="pn-refresh" id="pnRefresh" title="\u5237\u65B0\u8DEF\u7EBF">\u21BB</button>
          </div>
          <div class="pn-dest">
            <div class="pn-dest-label">\u76EE\u7684\u5730</div>
            <div class="pn-dest-name" id="pnDestName">\u2014</div>
          </div>
          <div class="pn-map-visual">
            <div class="pn-pin"><span class="pn-dot"></span></div>
            <div class="pn-path"><i></i></div>
            <div class="pn-meta" id="pnMeta">\u9009\u62E9\u76EE\u7684\u5730\u540E\u5F00\u59CB\u5BFC\u822A</div>
          </div>
          <div class="pn-steps" id="pnSteps"></div>
          <div class="pn-footer">
            <a class="pn-amap" id="pnAmap" href="#" target="_blank" rel="noopener">\u5728\u9AD8\u5FB7\u5730\u56FE\u4E2D\u6253\u5F00 \u2197</a>
            <button class="pn-go" id="pnGo">\u5F00\u59CB\u5BFC\u822A</button>
          </div>
        </div>
      </div>
    </div>
  `;let U=e.querySelector("#placeSearch"),u=e.querySelector("#placeResults"),p=e.querySelector("#originInput"),b=e.querySelector("#routeCard"),S=e.querySelector("#markBtn"),y=e.querySelector("#markPanel"),g=e.querySelector("#markHint"),L=e.querySelector("#markCoord"),w=e.querySelector("#markName"),x=e.querySelector("#markType"),N=e.querySelector("#markAlias"),H=e.querySelector("#markEntrance"),D=e.querySelector("#markSave"),A=e.querySelector("#markMine");function z(C,I){let Q=C.name==="808"?" stacked":"";return`<div class="nav-pin ${I?"dest":""}${Q} ${C.verified?"":"unverified"}"><span class="nav-dot"></span><span class="nav-label">${i(C.name)}</span></div>`}function ie(){}function $(C,I){o=C,Object.entries(q).forEach(([Q,O])=>{let ee=s.find(ne=>String(ne.id)===Q);ee&&O.setIcon(n.divIcon({html:z(ee,ee.id===o.id),className:"nav-pin-box",iconSize:null,iconAnchor:[10,10]}))}),I&&d&&d.flyTo([C.lat,C.lng],17,{duration:.8}),u.innerHTML=`\u76EE\u7684\u5730\uFF1A<strong>${i(C.name)}</strong> \xB7 ${i(C.entrance||"")}`}function B(C){h={type:"place",place:C},p.value=C.name,u.innerHTML=`\u8D77\u70B9\uFF1A<strong>${i(C.name)}</strong> \xB7 \u76EE\u7684\u5730\uFF1A<strong>${i(o?o.name:"\u672A\u9009\u62E9")}</strong>`;let I=e.querySelector("#swapBtn");I&&(I.disabled=!(o&&C.id!==o.id))}function V(){r&&(h={type:"me"},p.value="\u6211\u7684\u4F4D\u7F6E",void 0)}function Y(C){_==="origin"?(B(C),_="dest"):$(C,!0)}function R(C){let I=n.marker([C.lat,C.lng],{icon:n.divIcon({html:z(C,!1),className:"nav-pin-box",iconSize:null,iconAnchor:[10,10]}),title:C.name}).addTo(d);return I.on("click",()=>{k||Y(C)}),q[String(C.id)]=I,I}async function T(){if(n=await Ye(),d=n.map(e.querySelector("#navMap"),{center:[34.2008,117.1735],zoom:16,zoomControl:!0,attributionControl:!1}),n.tileLayer("https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}",{subdomains:["1","2","3","4"],maxZoom:18,minZoom:14}).addTo(d),s.forEach(C=>R(C)),d.on("click",C=>{k&&G(C.latlng)}),t){let C=s.find(I=>String(I.id)===t)||s.find(I=>I.name===t)||s.find(I=>String(I.alias||"").split(",").includes(t))||s.find(I=>I.name.includes(t)||String(I.alias||"").includes(t));C&&($(C,!0),setTimeout(()=>ue(),400))}}function j(){if(!A)return;let C=s.filter(I=>I.source==="\u7528\u6237\u6807\u6CE8");if(!C.length){A.innerHTML="";return}A.innerHTML=`<div class="nav-mark-mine-title">\u6211\u7684\u6807\u6CE8</div>
      ${C.map(I=>`<div class="nav-mark-mine-row"><span class="nav-mark-mine-ico" style="background:${lt(I).color}">${Bt(I)}</span><span class="nav-mark-mine-name">${i(I.name)}</span><button class="nav-mark-del" type="button" data-del-mark="${I.id}" title="\u5220\u9664">\xD7</button></div>`).join("")}`,A.querySelectorAll("[data-del-mark]").forEach(I=>{I.addEventListener("click",async()=>{let Q=I.getAttribute("data-del-mark");if(confirm("\u5220\u9664\u8FD9\u4E2A\u81EA\u5B9A\u4E49\u5730\u70B9\uFF1F"))try{await m.del(`/places/${Q}`);let O=s.findIndex(ee=>String(ee.id)===Q);O>=0&&s.splice(O,1),q[Q]&&(q[Q].remove(),delete q[Q]),o&&String(o.id)===Q&&(o=null,u.innerHTML="\u76EE\u7684\u5730\u5DF2\u5220\u9664\uFF0C\u8BF7\u91CD\u65B0\u9009\u62E9\u3002"),j(),v("\u5DF2\u5220\u9664\u81EA\u5B9A\u4E49\u5730\u70B9","success")}catch(O){v(O.message,"error")}})})}function G(C,I){f={lat:C.lat,lng:C.lng};let Q=n.divIcon({html:'<div class="nav-pin-box"><div class="nav-pin dest add"><span class="nav-dot"></span><span class="nav-label">\u65B0\u5730\u70B9</span></div></div>',className:"nav-pin-box",iconSize:null,iconAnchor:[10,10]});M?M.setLatLng(C).setIcon(Q):(M=n.marker(C,{draggable:!0,icon:Q,title:"\u65B0\u5730\u70B9"}).addTo(d),M.on("dragend",()=>{let O=M.getLatLng();G(O,!0)})),L.textContent=`\u5DF2\u9009\u4F4D\u7F6E\uFF1A${Number(C.lat).toFixed(6)}, ${Number(C.lng).toFixed(6)}`,D.disabled=!1,I||(g.textContent="\u4F4D\u7F6E\u5DF2\u9009\uFF0C\u53EF\u62D6\u52A8\u6807\u8BB0\u5FAE\u8C03\uFF0C\u586B\u5199\u540D\u79F0\u540E\u4FDD\u5B58"),w.focus()}function P(C){k=C,S.classList.toggle("on",C),y.hidden=!C;let I=e.querySelector("#navMap");I&&I.classList.toggle("marking",C),C?(g.textContent="\u70B9\u51FB\u5730\u56FE\u9009\u62E9\u4F4D\u7F6E\uFF0C\u6807\u8BB0\u53EF\u62D6\u52A8\u5FAE\u8C03",j()):(M&&(M.remove(),M=null),f=null,L.textContent="\u5C1A\u672A\u9009\u62E9\u4F4D\u7F6E",D.disabled=!0,w.value="",N.value="",H.value="")}async function F(){let C=String(w.value||"").trim();if(!f){v("\u8BF7\u5148\u5728\u5730\u56FE\u4E0A\u70B9\u51FB\u9009\u62E9\u4F4D\u7F6E","error");return}if(!C){v("\u8BF7\u586B\u5199\u5730\u70B9\u540D\u79F0","error"),w.focus();return}D.disabled=!0,D.textContent="\u4FDD\u5B58\u4E2D\u2026";try{let I=await m.post("/places",{name:C,alias:String(N.value||"").trim(),entrance:String(H.value||"").trim(),type:x.value,lat:f.lat,lng:f.lng}),Q=s.findIndex(ee=>String(ee.id)===String(I.id));Q>=0?s[Q]=I:s.push(I);let O=q[String(I.id)];O?(O.setLatLng([I.lat,I.lng]),O.setIcon(n.divIcon({html:z(I,!1),className:"nav-pin-box",iconSize:null,iconAnchor:[10,10]}))):R(I),$(I,!0),U.value=I.name,v("\u5730\u70B9\u5DF2\u4FDD\u5B58\uFF0C\u53EF\u76F4\u63A5\u89C4\u5212\u8DEF\u7EBF","success"),P(!1)}catch(I){v(I.message,"error")}finally{D.textContent="\u4FDD\u5B58\u5730\u70B9",D.disabled=!f}}S&&S.addEventListener("click",()=>P(!k));let te=e.querySelector("#markClose"),de=e.querySelector("#markCancel");te&&te.addEventListener("click",()=>P(!1)),de&&de.addEventListener("click",()=>P(!1)),D&&D.addEventListener("click",F);function oe(){if(!navigator.geolocation){v("\u5F53\u524D\u6D4F\u89C8\u5668\u4E0D\u652F\u6301\u5B9A\u4F4D","error");return}u.innerHTML='<span class="muted">\u6B63\u5728\u83B7\u53D6\u5B9A\u4F4D\u2026</span>',navigator.geolocation.getCurrentPosition(C=>{let[I,Q]=Pe(C.coords.longitude,C.coords.latitude);r={lat:Q,lng:I},c&&c.remove(),c=n.marker([Q,I],{icon:n.divIcon({html:'<div class="nav-pin-box"><div class="nav-pin me"><span class="nav-pin-ico" style="background:linear-gradient(135deg,#17a2ff,#5cc0ff)"></span><span class="nav-label">\u6211\u7684\u4F4D\u7F6E</span></div></div>',className:"nav-pin-box",iconSize:null,iconAnchor:[10,10]})}).addTo(d),d.flyTo([Q,I],17,{duration:.8}),V(),u.innerHTML="\u5DF2\u5B9A\u4F4D\u3002\u9009\u62E9\u76EE\u7684\u5730\u540E\u70B9\u201C\u89C4\u5212\u6B65\u884C\u8DEF\u7EBF\u201D\u3002",o&&ue()},C=>{let I={1:"\u5B9A\u4F4D\u6743\u9650\u88AB\u62D2\u7EDD\uFF1A\u8BF7\u5728\u6D4F\u89C8\u5668\u8BBE\u7F6E\u4E2D\u5141\u8BB8\u672C\u7AD9\u4F7F\u7528\u4F4D\u7F6E\u4FE1\u606F",2:"\u6682\u65F6\u83B7\u53D6\u4E0D\u5230\u4F4D\u7F6E\uFF0C\u8BF7\u5230\u7A7A\u65F7\u5904\u6216\u7A0D\u540E\u518D\u8BD5",3:"\u5B9A\u4F4D\u8D85\u65F6\uFF0C\u8BF7\u91CD\u8BD5"};u.innerHTML=`<span class="tag tag-warn">\u5B9A\u4F4D\u5931\u8D25</span> ${I[C.code]||i(C.message)}`},{enableHighAccuracy:!0,timeout:1e4,maximumAge:3e4})}async function ue(){let C=String(U.value||"").trim();if(C&&(!o||C!==o.name)){let O=C.toLowerCase(),ee=s.find(ne=>ne.name.toLowerCase()===O||String(ne.alias||"").toLowerCase().split(",").map(_e=>_e.trim()).includes(O));ee&&$(ee,!0)}let I=String(p.value||"").trim();if(I&&I!=="\u6211\u7684\u4F4D\u7F6E"&&(!h||h.type!=="place"||h.place.name!==I)){let O=s.find(ee=>ee.name===I||String(ee.alias||"").split(",").map(ne=>ne.trim()).includes(I));O&&B(O)}if(!o){v("\u8BF7\u5148\u8F93\u5165\u76EE\u7684\u5730\u540D\u79F0\u5E76\u4ECE\u8054\u60F3\u4E2D\u9009\u62E9\uFF0C\u6216\u70B9\u5730\u56FE\u6807\u8BB0","error");return}let Q={destination_id:o.id};if(h&&h.type==="me"){if(!r){v("\u5C1A\u672A\u5B9A\u4F4D\u6210\u529F\uFF0C\u8BF7\u70B9\u300C\u5B9A\u4F4D\u5230\u6211\u300D\u91CD\u8BD5\uFF0C\u6216\u70B9\u8D77\u70B9\u6846\u9009\u62E9\u51FA\u53D1\u70B9","error");return}Q.origin_lat=r.lat,Q.origin_lng=r.lng}else if(h&&h.type==="place")Q.origin_id=h.place.id;else{v("\u8BF7\u5148\u70B9\u300C\u5B9A\u4F4D\u5230\u6211\u300D\uFF08\u8D77\u70B9\u9ED8\u8BA4\u4E3A\u5F53\u524D\u4F4D\u7F6E\uFF09\uFF0C\u6216\u70B9\u8D77\u70B9\u6846\u9009\u62E9\u51FA\u53D1\u70B9","error");return}try{let O=await m.post("/nav/route",Q);E=O,l&&l.remove();let ee=O.polyline.map(ne=>[ne.lat,ne.lng]);l=n.polyline(ee,{color:"#1B4B8F",weight:5,opacity:.85,dashArray:"10 7"}).addTo(d),d.fitBounds(l.getBounds().pad(.25)),b.innerHTML=`<div class="card" style="padding:14px;border-color:#cfdbe8">
        <div class="spread"><div class="card-title">${i(O.origin.name)} \u2192 ${i(O.destination.name)}</div><span class="tag tag-blue">\u6B65\u884C</span></div>
        <div style="font-size:26px;font-weight:700;color:var(--primary);margin:6px 0">${O.minutes}<span style="font-size:12px;color:var(--text-3)"> \u5206\u949F</span></div>
        <div class="muted">${O.distance_m} \u7C73</div>
        <div style="margin-top:10px">
          ${O.steps.map(ne=>`<div style="padding:4px 0 4px 14px;position:relative;font-size:12px;color:var(--text-2)">
              <span style="position:absolute;left:0;top:9px;width:6px;height:6px;border-radius:50%;background:var(--accent)"></span>${i(ne)}
            </div>`).join("")}
        </div>
        <div class="muted" style="margin-top:8px">${i(O.notice)}</div>
        <a class="btn btn-soft" style="margin-top:10px" href="${i(O.amap_url)}" target="_blank" rel="noopener">\u5728\u9AD8\u5FB7\u5730\u56FE\u4E2D\u6253\u5F00 \u2197</a>
      </div>`}catch(O){v(O.message,"error")}}async function Ae(){let C=U.value.trim();if(!C)return;let I=await m.get(`/places/search?q=${encodeURIComponent(C)}`);if(!I.length){u.innerHTML='<span class="tag tag-warn">\u672A\u627E\u5230</span> \u6362\u4E2A\u53EB\u6CD5\u8BD5\u8BD5\uFF0C\u6216\u76F4\u63A5\u70B9\u5730\u56FE\u4E0A\u7684\u6807\u8BB0\u3002';return}u.innerHTML=I.slice(0,6).map(Q=>`<button class="chip nav-chip" data-pick="${Q.id}"><span class="nav-place-ico sm" style="background:${lt(Q).color}">${Bt(Q)}</span>${i(Q.name)}</button>`).join(""),u.querySelectorAll("[data-pick]").forEach(Q=>{Q.addEventListener("click",()=>{let O=s.find(ee=>String(ee.id)===Q.getAttribute("data-pick"));O&&$(O,!0)})})}U.addEventListener("keydown",C=>{if(C.key==="Enter"){if(C.preventDefault(),X&&!X.hidden&&he>=0)return;Ae()}}),e.querySelector("#routeBtn").addEventListener("click",ue),e.querySelector("#locateBtn").addEventListener("click",oe);let be=e.querySelector("#swapBtn");be&&be.addEventListener("click",()=>{if(!o||!h||h.type!=="place"){v("\u5F53\u524D\u8D77\u70B9\u662F\u300C\u6211\u7684\u4F4D\u7F6E\u300D\uFF0C\u4EA4\u6362\u65E0\u610F\u4E49","error");return}let C=h.place;B(o),$(C,!1)});let X=e.querySelector("#ioSuggest"),ge="dest",he=-1;function wt(C){let I=String(C||"").trim().toLowerCase();return!I||I==="\u6211\u7684\u4F4D\u7F6E"?s.slice(0,6):s.map(O=>{let ee=String(O.name||"").toLowerCase(),ne=String(O.alias||"").toLowerCase().split(",").map(Oe=>Oe.trim()).filter(Boolean),_e=String(O.entrance||"").toLowerCase(),tt=-1;return ee===I||ne.includes(I)?tt=0:ee.startsWith(I)||ne.some(Oe=>Oe.startsWith(I))?tt=1:(ee.includes(I)||ne.some(Oe=>Oe.includes(I))||_e.includes(I))&&(tt=2),{p:O,score:tt}}).filter(O=>O.score>=0).sort((O,ee)=>O.score-ee.score).slice(0,8).map(O=>O.p)}function Me(){X&&(X.hidden=!0),he=-1}function et(C){let I=C.getAttribute("data-sg");if(I==="me"){if(!r){v("\u5148\u70B9\u4E0A\u65B9\u300C\u5B9A\u4F4D\u5230\u6211\u300D\u83B7\u53D6\u5F53\u524D\u4F4D\u7F6E\uFF0C\u6216\u76F4\u63A5\u9009\u62E9\u5177\u4F53\u5730\u70B9\u4F5C\u4E3A\u8D77\u70B9","error");return}V(),u.innerHTML="\u8D77\u70B9\uFF1A<strong>\u6211\u7684\u4F4D\u7F6E</strong> \xB7 \u9009\u62E9\u76EE\u7684\u5730\u540E\u70B9\u300C\u89C4\u5212\u6B65\u884C\u8DEF\u7EBF\u300D"}else{let Q=s.find(O=>String(O.id)===I);if(!Q)return;ge==="origin"?(B(Q),_="dest"):($(Q,!0),U.value=Q.name)}Me()}function W(){if(!X)return;let I=String((ge==="origin"?p:U).value||"").trim(),Q=wt(I),O="";ge==="origin"&&(O+=`<button type="button" class="io-sg-item" data-sg="me">
        <span class="io-sg-ico me">\u25CE</span>
        <span class="io-sg-main"><b>\u6211\u7684\u4F4D\u7F6E</b><i>${r?"\u4F7F\u7528\u5F53\u524D\u5B9A\u4F4D\u4F5C\u4E3A\u8D77\u70B9":"\u9700\u5148\u70B9\u4E0A\u65B9\u300C\u5B9A\u4F4D\u5230\u6211\u300D"}</i></span></button>`),O+=Q.map(ne=>`<button type="button" class="io-sg-item" data-sg="${ne.id}">
          <span class="io-sg-ico" style="background:${lt(ne).color}">${Bt(ne)}</span>
          <span class="io-sg-main"><b>${i(ne.name)}</b><i>${i(ne.alias||ne.entrance||"")}</i></span>
        </button>`).join(""),Q.length||(O+='<div class="io-sg-empty">\u6CA1\u6709\u5339\u914D\u7684\u5730\u70B9\uFF0C\u6362\u4E2A\u53EB\u6CD5\u8BD5\u8BD5\uFF08\u652F\u6301\u522B\u540D\uFF0C\u5982 9\u53F7\u697C \u2192 \u9759\u8FDC\u697C\uFF09</div>'),X.innerHTML=O,X.hidden=!1;let ee=Array.from(X.querySelectorAll("[data-sg]"));he=ee.length?0:-1,ee.forEach((ne,_e)=>ne.classList.toggle("active",_e===he)),ee.forEach(ne=>ne.addEventListener("mousedown",_e=>{_e.preventDefault(),et(ne)}))}function ae(C,I,Q){C.addEventListener("focus",()=>{ge=I,Q&&C.value==="\u6211\u7684\u4F4D\u7F6E"&&C.select(),W()}),C.addEventListener("input",()=>{ge=I,W()}),C.addEventListener("blur",()=>setTimeout(Me,150)),C.addEventListener("keydown",O=>{if(!X||X.hidden)return;let ee=Array.from(X.querySelectorAll("[data-sg]"));ee.length&&(O.key==="ArrowDown"||O.key==="ArrowUp"?(O.preventDefault(),he=(he+(O.key==="ArrowDown"?1:-1)+ee.length)%ee.length,ee.forEach((ne,_e)=>ne.classList.toggle("active",_e===he)),ee[he].scrollIntoView({block:"nearest"})):O.key==="Enter"&&he>=0?(O.preventDefault(),et(ee[he])):O.key==="Escape"&&Me())})}ae(p,"origin",!0),ae(U,"dest",!1),await T();let se=e.querySelector("#phoneOverlay");function pe(){if(!se)return;let C=e.querySelector("#pnDestName"),I=e.querySelector("#pnMeta"),Q=e.querySelector("#pnSteps"),O=e.querySelector("#pnAmap");o&&(C.textContent=o.name),E?(I.innerHTML=`\u6B65\u884C <b>${E.minutes}</b> \u5206\u949F \xB7 <b>${E.distance_m}</b> \u7C73`,Q.innerHTML=E.steps.map(ee=>`<div class="pn-step"><span class="pn-step-dot"></span>${i(ee)}</div>`).join(""),O.href=E.amap_url||"#"):(I.textContent="\u9009\u62E9\u76EE\u7684\u5730\u540E\u5F00\u59CB\u5BFC\u822A",Q.innerHTML="")}let fe=e.querySelector("#phoneModeBtn");fe&&fe.addEventListener("click",()=>{pe(),se.hidden=!1,requestAnimationFrame(()=>se.classList.add("show"))});let Ne=e.querySelector("#pnBack");Ne&&Ne.addEventListener("click",()=>{se.classList.remove("show"),setTimeout(()=>se.hidden=!0,240)});let je=e.querySelector("#pnRefresh");je&&je.addEventListener("click",async()=>{if(!o){v("\u8BF7\u5148\u5728\u5730\u56FE\u6216\u53F3\u4FA7\u9009\u62E9\u76EE\u7684\u5730","error");return}await ue(),pe()});let Be=e.querySelector("#pnGo");Be&&Be.addEventListener("click",()=>{let C=e.querySelector("#pnAmap");C&&C.href&&C.href!=="#"?window.open(C.href,"_blank","noopener"):v("\u8FD8\u6CA1\u6709\u8DEF\u7EBF\uFF0C\u5148\u9009\u62E9\u76EE\u7684\u5730","error")});let qe=e.querySelector("#phoneQrBtn"),xe=e.querySelector("#navQrBox");qe&&xe&&qe.addEventListener("click",()=>{if(xe.hidden=!xe.hidden,!xe.hidden){let C=e.querySelector("#navQrImg");C.innerHTML="",typeof QRCode=="function"?new QRCode(C,{text:window.location.href,width:168,height:168,colorDark:"#0b1e3f",colorLight:"#ffffff"}):C.textContent="\u4E8C\u7EF4\u7801\u7EC4\u4EF6\u52A0\u8F7D\u5931\u8D25"}})}ve();ve();async function ja(e,a){let s=["\u5168\u90E8","\u5B66\u4E60","\u8FD0\u52A8","\u6444\u5F71","\u996D\u642D\u5B50","\u6E38\u620F","\u89C2\u5C55","\u8003\u7814","\u81EA\u4E60"],t={tab:a&&a.params&&a.params.get("tab")||"discover",rows:[],profile:null,matches:[],nearby:[],applications:[],recOffset:0,testKind:null,testIdx:0,testAnswers:[]},n=await Promise.allSettled([m.get("/buddy/posts"),m.get("/buddy/profile"),m.get("/buddy/matches"),m.get("/buddy/test"),m.get("/buddy/applications"),m.get("/buddy/nearby")]);t.rows=n[0].status==="fulfilled"?n[0].value:[],t.profile=n[1].status==="fulfilled"?n[1].value:null,t.matches=n[2].status==="fulfilled"?n[2].value:[],t.applications=n[4].status==="fulfilled"?n[4].value:[],t.nearby=n[5].status==="fulfilled"?n[5].value:[],t.questions=n[3].status==="fulfilled"?n[3].value:{animal_questions:[],mbti_questions:[]};let d=t.profile&&t.profile.animal_type&&t.profile.mbti,l=t.tab==="test"?"\u8DA3\u5473\u95EE\u7B54":t.tab==="profile"?"\u6211\u7684\u642D\u5B50\u6863\u6848":"\u627E\u642D\u5B50";e.innerHTML=`
    <div class="page-head"><div><div class="page-title">${l}</div></div>
      <a class="btn btn-ghost btn-sm" href="#/life/buddy">\u8FD4\u56DE\u627E\u642D\u5B50</a></div>
    <div id="buddyBody"></div>`;let c=e.querySelector("#buddyBody");e.querySelectorAll("[data-bt]").forEach(p=>p.addEventListener("click",()=>{t.tab=p.dataset.bt,e.querySelectorAll("[data-bt]").forEach(b=>b.classList.toggle("on",b.dataset.bt===t.tab)),u()}));let r=(p,b="bd-ava")=>{let y=`avatar-0${Number(p&&p.user_id||0)%8+1}a.svg`,g=p&&p.avatar||y;return`<img class="${b}" src="/static/img/avatars/${i(g)}" alt="">`},o=p=>p&&p.animal_type?`<span class="bd-badge" title="${i(p.animal_type)}\u642D\u5B50">${{\u67EF\u57FA:"\u{1F415}",\u732B\u732B:"\u{1F408}",\u6D77\u8C5A:"\u{1F42C}",\u523A\u732C:"\u{1F994}",\u4ED3\u9F20:"\u{1F439}",\u72D0\u72F8:"\u{1F98A}",\u9E45:"\u{1F9A2}",\u6C34\u736D:"\u{1F9A6}"}[p.animal_type]||"\u{1F43E}"} ${i(p.animal_type)}</span>`:"",h=p=>p&&p.mbti?`<span class="bd-badge mbti">${i(p.mbti)}</span>`:"";function _(){let p=t.matches.slice(0,3);c.innerHTML=`
      <div class="page-head"><div><div class="page-title">\u627E\u642D\u5B50</div><div class="page-sub">\u6309\u5174\u8DA3\u548C\u7A7A\u95F2\u65F6\u95F4\u627E\u6D3B\u52A8\u3001\u627E\u642D\u5B50\u3002</div></div>
        <div class="row">
          <button class="btn btn-ghost" id="chatEntry">\u{1F4AC} \u7533\u8BF7\u4E0E\u804A\u5929</button>
          <button class="btn btn-primary" id="newBuddy">\u53D1\u5E03\u642D\u5B50</button>
        </div></div>

      <div class="section-title">\u4E3A\u4F60\u63A8\u8350 <span class="title-hint">\u57FA\u4E8E\u6027\u683C\u6863\u6848\u7684\u5339\u914D</span>
        <button class="title-action" id="refreshRec" type="button">\u6362\u4E00\u6279 \u21BB</button>
      </div>
      <div id="recBox">${b()}</div>

      <div class="section-title">\u9644\u8FD1\u7684\u540C\u5B66 <span class="title-hint">\u6447\u4E00\u6447\uFF0C\u62BD\u51FA\u4ECA\u5929\u53EF\u80FD\u9047\u5230\u7684\u4EBA</span></div>
      <div class="near-zone">
        <div class="near-map-wrap">
          <div id="nearMap" class="near-map"></div>
          <div class="near-map-tip">\u5730\u56FE\u4E0A\u7684\u6807\u8BB0\u662F\u540C\u5B66\u5E38\u51FA\u6CA1\u7684\u4F4D\u7F6E</div>
        </div>
        <div class="near-draw">
          <button class="btn btn-primary draw-btn" id="drawBtn" type="button">\u{1F3B2} \u6447\u4E00\u6447\u62BD 3 \u5F20\u7EB8\u6761</button>
          <div id="drawBox" class="draw-box"><div class="muted">\u70B9\u4E00\u4E0B\uFF0C\u4ECE\u9644\u8FD1\u516C\u5F00\u6863\u6848\u91CC\u62BD\u51FA\u4ECA\u5929\u53EF\u80FD\u9047\u5230\u7684\u4EBA</div></div>
        </div>
      </div>

      <div class="section-title">\u642D\u5B50\u5899</div>
      <div class="chips" style="margin-bottom:14px">${s.map(T=>`<button class="chip ${T==="\u5168\u90E8"?"active":""}" data-type="${T}">${T}</button>`).join("")}</div>
      <div id="buddyList" class="grid grid-2"></div>`;function b(){let T=t.matches;if(!T.length)return'<div class="card" style="margin-bottom:14px"><a class="lnk" data-bt-jump="test">\u5B8C\u6210\u4EFB\u4E00\u6027\u683C\u6D4B\u8BD5\u540E\uFF0C\u8FD9\u91CC\u4F1A\u51FA\u73B0\u4E3A\u4F60\u6311\u9009\u7684\u642D\u5B50 \u2192</a></div>';let j=t.recOffset%T.length,G=[];for(let P=0;P<Math.min(3,T.length);P+=1)G.push(T[(j+P)%T.length]);return`<div class="match-strip">${G.map(P=>`<div class="match-card" data-mid="${P.user_id}">
            <div class="mc-top">
              ${r(P.profile,"mc-ava")}
              <div class="mc-score">${P.score}<i>%</i></div>
            </div>
            <div class="mc-name">${i(P.profile.nickname)}<span class="bd-badge mbti">${i(P.profile.mbti)}</span></div>
            <div class="mc-tags">${i(P.profile.animal_type||"\u5F85\u6D4B")} \xB7 ${i(P.profile.college)}</div>
            <div class="mc-reason">${i(P.reason)}</div>
            <div class="mc-foot"><span>${i(P.post.title)}</span><button class="mc-go" data-go="${P.user_id}">\u67E5\u770B \u203A</button></div>
          </div>`).join("")}</div>`}function S(){c.querySelectorAll("[data-go]").forEach(j=>j.addEventListener("click",()=>{let G=t.matches.find(P=>P.user_id===Number(j.dataset.go));G&&w(G)}));let T=c.querySelector("[data-bt-jump]");T&&T.addEventListener("click",()=>{t.tab="test",u()})}async function y(){let T=c.querySelector("#refreshRec");T&&(T.disabled=!0,T.textContent="\u5237\u65B0\u4E2D\u2026");try{t.recOffset+=3,t.matches=await m.get(`/buddy/matches?offset=${t.recOffset}`);let j=c.querySelector("#recBox");j&&(j.innerHTML=b()),S();let G=c.querySelector("#recBox .match-strip");G&&G.classList.add("rec-fresh")}catch(j){v(j.message,"error")}finally{let j=c.querySelector("#refreshRec");j&&(j.disabled=!1,j.textContent="\u6362\u4E00\u6279 \u21BB")}}function g(){let T=[...t.nearby];if(!T.length){v("\u6682\u65F6\u6CA1\u6709\u516C\u5F00\u6863\u6848\u7684\u540C\u5B66","error");return}let j=[];for(;j.length<Math.min(3,T.length);)j.push(T.splice(Math.floor(Math.random()*T.length),1)[0]);let G=c.querySelector("#drawBox");G.innerHTML=j.map((P,F)=>`<div class="draw-card" style="animation-delay:${(F*.12).toFixed(2)}s">
            ${r(P.profile,"dc-ava")}
            <div class="dc-main">
              <div class="dc-name">${i(P.profile.nickname)}<span class="bd-badge mbti">${i(P.profile.mbti)}</span></div>
              <div class="dc-meta">${i(P.profile.college)}${P.same_college?" \xB7 \u540C\u5B66\u9662":""}</div>
              <div class="dc-place">\u{1F4CD} ${i(P.place||"\u6CC9\u5C71\u6821\u533A")}${P.post?` \xB7 ${i(P.post.type)}\u642D\u5B50`:""}</div>
            </div>
            <button class="btn btn-primary btn-sm" data-invite="${P.user_id}">\u9080\u8BF7</button>
          </div>`).join(""),G.querySelectorAll("[data-invite]").forEach(P=>P.addEventListener("click",()=>{let F=t.nearby.find(te=>te.user_id===Number(P.dataset.invite));F&&w(F)}))}async function L(){let T=c.querySelector("#nearMap");if(T)try{let j=await Ye();if(!c.querySelector("#nearMap"))return;let G=j.map(T,{zoomControl:!1,attributionControl:!1}).setView([34.1975,117.1733],16);j.tileLayer("https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}",{subdomains:"1234",maxZoom:19}).addTo(G);let P=new Map;t.nearby.forEach(F=>{if(F.lat==null||F.lng==null)return;let te=`${Number(F.lat).toFixed(5)},${Number(F.lng).toFixed(5)}`;P.has(te)||P.set(te,[]),P.get(te).push(F)}),P.forEach(F=>{F.forEach((te,de)=>{let oe=Number(te.lat),ue=Number(te.lng);if(F.length>1){let be=Math.PI*2*de/F.length-Math.PI/2;oe+=22e-5*Math.sin(be),ue+=3e-4*Math.cos(be)}let Ae=j.divIcon({className:"",html:`<div class="near-pin"><b>${i(te.profile.nickname)}</b></div>`,iconSize:[10,10]});j.marker([oe,ue],{icon:Ae,zIndexOffset:de*10}).addTo(G).on("click",()=>w(te))})}),setTimeout(()=>G.invalidateSize(),250)}catch{T.innerHTML='<div class="muted" style="padding:14px">\u5730\u56FE\u7EC4\u4EF6\u6682\u4E0D\u53EF\u7528\uFF0C\u7EB8\u6761\u62BD\u53D6\u4ECD\u53EF\u4F7F\u7528</div>'}}function w(T){let j=T.post||null,G=j&&t.applications.some(F=>F.post_id===j.id&&F.role==="applicant");Z({title:`${T.profile.nickname} \u7684\u6863\u6848${T.score!=null?` \xB7 \u5339\u914D\u5EA6 ${T.score}%`:""}`,hideOk:!0,cancelText:"\u5173\u95ED",body:`<div class="mc-modal">
          <div class="mc-ava big">${r(T.profile,"mc-ava-img")}</div>
          <div class="row" style="justify-content:center;gap:6px">${h(T.profile)}${o(T.profile)}</div>
          <div class="muted" style="text-align:center">${i(T.profile.college)} \xB7 ${i(T.profile.active_time)}</div>
          ${T.reason?`<div class="mc-reason" style="margin-top:10px">${i(T.reason)}</div>`:""}
          ${j?`<div class="card" style="margin-top:12px"><span class="tag tag-blue">${i(j.type)}</span>
                <strong style="margin-left:6px">${i(j.title)}</strong>
                <div class="muted" style="margin-top:4px">${i(j.time)} \xB7 ${i(j.place)}</div></div>
              <div class="row" style="margin-top:14px;justify-content:center">
                <button class="btn btn-primary" id="inviteBtn">${G?"\u5DF2\u53D1\u51FA\u9080\u8BF7 \xB7 \u67E5\u770B\u804A\u5929":"\u53D1\u8D77\u9080\u8BF7"}</button>
              </div>`:'<div class="muted" style="margin-top:12px;text-align:center">\u8BE5\u540C\u5B66\u6682\u672A\u516C\u5F00\u642D\u5B50\u5E16</div>'}
          <div class="muted" style="margin-top:10px;font-size:11px;text-align:center">\u9080\u8BF7\u4F1A\u5199\u5165\u7AD9\u5185\u7533\u8BF7\u8BB0\u5F55\uFF0C\u5BF9\u65B9\u901A\u8FC7\u540E\u5373\u53EF\u804A\u5929</div>
        </div>`});let P=document.getElementById("inviteBtn");P&&j&&P.addEventListener("click",()=>{G?V():ie(j)})}S();let x=c.querySelector("#refreshRec");x&&x.addEventListener("click",y);let N=c.querySelector("#drawBtn");N&&N.addEventListener("click",g),L(),c.querySelectorAll("[data-near]").forEach(T=>{let j=()=>{let G=t.nearby.find(P=>P.user_id===Number(T.dataset.near));G&&w(G)};T.addEventListener("click",j),T.addEventListener("keydown",G=>{(G.key==="Enter"||G.key===" ")&&(G.preventDefault(),j())})});let H=c.querySelector("#buddyList"),D="\u5168\u90E8",A=()=>{let T=D==="\u5168\u90E8"?t.rows:t.rows.filter(j=>j.type===D);H.innerHTML=T.length?T.map(j=>`<div class="card">
                <div class="spread"><div class="row"><span class="tag tag-blue">${i(j.type)}</span>${$e(j.status)}</div>
                  <span class="muted">${i(j.created_at)}</span></div>
                <div class="card-title" style="margin-top:8px">${i(j.title)}</div>
                <div class="card-desc">${i(j.content)}</div>
                ${j.author?`<div class="bd-author">${o(j.author)}${h(j.author)}<span class="muted">${i(j.author.nickname||"")}</span></div>`:""}
                <div class="row" style="margin-top:10px"><span class="tag">${i(j.time)}</span><span class="tag">${i(j.place)}</span><span class="tag">${i(j.campus)}</span></div>
                <div class="resource-foot"><span class="muted">\u8054\u7CFB\u65B9\u5F0F\uFF1A${i(j.contact)}</span>
                  <div class="row">
                    ${j.user_id!==1&&j.status==="open"?`<button class="btn btn-primary btn-sm" data-apply="${j.id}">\u7533\u8BF7\u642D\u5B50</button>`:""}
                    ${j.status==="open"&&j.user_id===1?`<button class="btn btn-ghost btn-sm" data-close="${j.id}">\u5173\u95ED</button>`:""}
                    ${j.status!=="open"?'<span class="tag">\u5DF2\u7ED3\u675F</span>':""}
                    <button class="btn btn-danger btn-sm" data-report="${j.id}">\u4E3E\u62A5</button>
                  </div></div>
              </div>`).join(""):'<div class="empty"><strong>\u6CA1\u6709\u5339\u914D\u7684\u642D\u5B50</strong>\u6362\u4E2A\u7C7B\u578B\u6216\u53D1\u5E03\u4E00\u6761</div>',z()},z=()=>{H.querySelectorAll("[data-close]").forEach(T=>T.addEventListener("click",async()=>{await m.post(`/buddy/posts/${T.getAttribute("data-close")}/close`),v("\u5DF2\u5173\u95ED","success"),t.rows=await m.get("/buddy/posts"),A()})),H.querySelectorAll("[data-report]").forEach(T=>T.addEventListener("click",async()=>{await m.post(`/buddy/posts/${T.getAttribute("data-report")}/report`,{}),v("\u5DF2\u63D0\u4EA4\u4E3E\u62A5\uFF0C\u5185\u5BB9\u4E0B\u67B6\u5F85\u590D\u6838","success"),t.rows=await m.get("/buddy/posts"),A()}))};c.querySelectorAll("[data-type]").forEach(T=>{T.addEventListener("click",()=>{c.querySelectorAll("[data-type]").forEach(j=>j.classList.remove("active")),T.classList.add("active"),D=T.getAttribute("data-type"),A()})}),A();function ie(T){let j=Number(T.id);if(t.applications.some(P=>P.post_id===j&&P.role==="applicant")){v("\u5DF2\u7533\u8BF7\u8FC7\u8FD9\u4E2A\u642D\u5B50\uFF0C\u5728\u300C\u7533\u8BF7\u4E0E\u804A\u5929\u300D\u91CC\u67E5\u770B\u8FDB\u5EA6","success"),V();return}Z({title:`\u9080\u8BF7\u642D\u5B50 \xB7 ${T.title}`,okText:"\u53D1\u9001\u9080\u8BF7",body:`<div class="muted" style="margin-bottom:8px">${i(T.time)} \xB7 ${i(T.place)}</div>
          <textarea class="textarea" id="applyMsg" style="min-height:90px" placeholder="\u6253\u4E2A\u62DB\u547C\uFF0C\u8BF4\u8BF4\u4E3A\u4EC0\u4E48\u60F3\u52A0\u5165\uFF08\u4F1A\u5C55\u793A\u7ED9\u5BF9\u65B9\uFF09">\u4F60\u597D\uFF01\u6211\u4E5F\u60F3\u627E${i(T.type)}\u642D\u5B50\uFF0C\u65F6\u95F4\u521A\u597D\u5408\u9002\uFF0C\u4E00\u8D77\u5440\uFF5E</textarea>
          <div class="muted" style="margin-top:8px;font-size:11px">\u53D1\u9001\u540E\u4F1A\u751F\u6210\u4E00\u6761\u7533\u8BF7\u8BB0\u5F55\uFF0C\u53EF\u5728\u300C\u7533\u8BF7\u4E0E\u804A\u5929\u300D\u91CC\u67E5\u770B\u72B6\u6001\u3002</div>`,onOk:async()=>{let P=document.getElementById("applyMsg").value.trim();try{let F=await m.post("/buddy/apply",{post_id:j,message:P||"\u4F60\u597D\uFF0C\u60F3\u548C\u4F60\u7EC4\u4E2A\u642D\u5B50\uFF01"});v(F.status==="accepted"?"\u9080\u8BF7\u5DF2\u53D1\u9001\uFF0C\u5BF9\u65B9\u5DF2\u901A\u8FC7\uFF0C\u53EF\u4EE5\u5F00\u59CB\u804A\u5929":"\u9080\u8BF7\u5DF2\u53D1\u9001\uFF0C\u7B49\u5F85\u5BF9\u65B9\u5904\u7406","success"),await $(),B(),V()}catch(F){v(F.message,"error")}}})}c.querySelectorAll("[data-apply]").forEach(T=>{T.addEventListener("click",()=>{let j=t.rows.find(G=>G.id===Number(T.getAttribute("data-apply")));j&&ie(j)})}),c.querySelector("#chatEntry").addEventListener("click",V);async function $(){try{t.applications=await m.get("/buddy/applications"),B()}catch{}}$();function B(){let T=c.querySelector("#chatEntry");if(!T)return;let j=t.applications.reduce((P,F)=>P+(F.status==="accepted"&&F.unread?1:0),0),G=t.applications.filter(P=>P.role==="owner"&&P.status==="pending").length;T.innerHTML=`\u{1F4AC} \u7533\u8BF7\u4E0E\u804A\u5929${j?` <span class="bd-badge" style="background:#ff4d5e;color:#fff">${j} \u65B0\u6D88\u606F</span>`:""}${G?` <span class="bd-badge" style="background:#fff5e6;color:#e0870a">${G} \u5F85\u5904\u7406</span>`:""}`}function V(){let T=t.applications,j=T.filter(F=>F.role==="applicant"),G=T.filter(F=>F.role==="owner"),P=F=>`<div class="chat-row" data-cid="${F.id}" role="button" tabindex="0">
        <span class="nc-ava">${F.peer_emoji}</span>
        <div class="cr-main">
          <div class="cr-title">${i(F.post_title)}<span class="tag ${F.status==="accepted"?"tag-green":F.status==="pending"?"tag-gold":""}">${i(F.status_label)}</span></div>
          <div class="muted">${i(F.peer_nickname)} \xB7 ${i((F.message||"").slice(0,30))}</div>
        </div>
        ${F.unread&&F.status==="accepted"?'<span class="mc-dot"></span>':""}
      </div>`;Z({title:"\u7533\u8BF7\u4E0E\u804A\u5929",hideOk:!0,cancelText:"\u5173\u95ED",wide:!0,body:`<div class="chat-list-box">
          ${T.length?`${G.length?`<div class="chat-sec">\u6536\u5230\u7684\u7533\u8BF7\uFF08\u5904\u7406\u540E\u624D\u80FD\u804A\u5929\uFF09</div>${G.map(P).join("")}`:""}${j.length?`<div class="chat-sec">\u6211\u53D1\u51FA\u7684</div>${j.map(P).join("")}`:""}`:'<div class="mc-empty">\u8FD8\u6CA1\u6709\u7533\u8BF7\u8BB0\u5F55\u3002\u53BB\u642D\u5B50\u5899\u70B9\u300C\u7533\u8BF7\u642D\u5B50\u300D\u5F00\u59CB\u5427</div>'}
        </div>`}),document.querySelectorAll(".chat-row").forEach(F=>{F.addEventListener("click",()=>{let te=Number(F.getAttribute("data-cid")),de=t.applications.find(oe=>oe.id===te);if(de){if(de.status==="pending"&&de.role==="owner"){Z({title:"\u5904\u7406\u7533\u8BF7",body:`<div class="muted" style="margin-bottom:8px">${i(de.peer_nickname)} \u60F3\u52A0\u5165\u300C${i(de.post_title)}\u300D\uFF1A</div><div class="card" style="padding:10px">${i(de.message)}</div>`,okText:"\u901A\u8FC7",cancelText:"\u5A49\u62D2",onOk:async()=>{await m.post(`/buddy/applications/${te}/accept`),v("\u5DF2\u901A\u8FC7\uFF0C\u53EF\u4EE5\u5F00\u59CB\u804A\u5929","success"),await $(),u(),V()},onCancel:async()=>{await m.post(`/buddy/applications/${te}/reject`),v("\u5DF2\u5A49\u62D2"),await $(),u()}});return}if(de.status!=="accepted"){v(de.status_label+"\uFF0C\u6682\u4E0D\u80FD\u804A\u5929","error");return}Y(te,de.peer_nickname,de.peer_emoji)}})})}function Y(T,j){Z({title:`\u4E0E ${j} \u804A\u5929`,hideOk:!0,cancelText:"\u5173\u95ED",wide:!0,body:`<div class="chat-room">
          <div class="cr-msgs" id="crMsgs"><div class="muted" style="text-align:center">\u52A0\u8F7D\u4E2D\u2026</div></div>
          <div class="cr-input-row">
            <input class="input" id="crInput" placeholder="\u8F93\u5165\u6D88\u606F\u2026" autocomplete="off">
            <button class="btn btn-primary btn-sm" id="crSend">\u53D1\u9001</button>
          </div>
        </div>`});let G=document.getElementById("crMsgs"),P=oe=>{G.innerHTML=oe.messages.map(ue=>`<div class="cr-msg ${ue.from_me?"me":"peer"}">
              <div class="cr-bubble">${i(ue.content)}</div>
              <span class="cr-time">${i((ue.created_at||"").slice(11,16))}</span>
            </div>`).join(""),G.scrollTop=G.scrollHeight},F=async()=>{let oe=await m.get(`/buddy/chat/${T}`);P(oe);try{await m.post(`/buddy/chat/${T}/read`),await $(),B()}catch{}};F();let te=document.getElementById("crInput"),de=async()=>{let oe=te.value.trim();if(oe){te.value="";try{await m.post(`/buddy/chat/${T}`,{content:oe}),await F()}catch(ue){v(ue.message,"error")}}};document.getElementById("crSend").addEventListener("click",de),te.addEventListener("keydown",oe=>{oe.key==="Enter"&&de()})}let R=c.querySelector("#newBuddy");R&&R.addEventListener("click",()=>{Z({title:"\u53D1\u5E03\u642D\u5B50",okText:"\u53D1\u5E03",body:`<div class="grid grid-2">
            <div class="field"><label>\u7C7B\u578B</label><select class="select" name="type">${s.slice(1).map(T=>`<option>${T}</option>`).join("")}</select></div>
            <div class="field"><label>\u65F6\u95F4</label><input class="input" name="time" placeholder="\u4F8B\u5982\uFF1A\u5468\u4E09 19:00"></div>
            <div class="field"><label>\u5730\u70B9</label><input class="input" name="place" placeholder="\u4F8B\u5982\uFF1A\u56FE\u4E66\u9986"></div>
            <div class="field"><label>\u6821\u533A</label><input class="input" name="campus" value="\u6CC9\u5C71\u6821\u533A"></div>
            <div class="field" style="grid-column:1/-1"><label>\u6807\u9898</label><input class="input" name="title" placeholder="\u4E00\u53E5\u8BDD\u8BF4\u660E\u60F3\u627E\u4EC0\u4E48\u642D\u5B50"></div>
            <div class="field" style="grid-column:1/-1"><label>\u8BE6\u7EC6\u8BF4\u660E</label><textarea class="textarea" name="content" placeholder="\u76EE\u7684\u3001\u671F\u671B\u3001\u6CE8\u610F\u4E8B\u9879"></textarea></div>`,onOk:async()=>{await m.post("/buddy/posts",{type:document.querySelector('[name="type"]').value,title:document.querySelector('[name="title"]').value,content:document.querySelector('[name="content"]').value,time:document.querySelector('[name="time"]').value,place:document.querySelector('[name="place"]').value,campus:document.querySelector('[name="campus"]').value}),v("\u5DF2\u53D1\u5E03","success"),document.getElementById("modalRoot").innerHTML="",t.rows=await m.get("/buddy/posts"),_()}})})}function E(){c.innerHTML=`
      <div class="test-entry-grid">
        <div class="test-entry" id="testAnimal">
          <div class="te-emoji">\u{1F9F8}</div>
          <div class="te-name">\u6821\u56ED\u5C0F\u52A8\u7269\u6D4B\u8BD5</div>
          <div class="te-desc">10 \u9053\u60C5\u666F\u9898 \xB7 2 \u5206\u949F<br>\u6D4B\u6D4B\u4F60\u662F\u67EF\u57FA\u3001\u732B\u732B\u8FD8\u662F\u6C34\u736D</div>
          <button class="btn btn-primary" data-start="animal">${t.profile&&t.profile.animal_type?"\u91CD\u65B0\u6D4B\u8BD5":"\u5F00\u59CB\u6D4B\u8BD5"}</button>
        </div>
        <div class="test-entry" id="testMbti">
          <div class="te-emoji">\u{1F9E0}</div>
          <div class="te-name">MBTI \u5FEB\u6D4B</div>
          <div class="te-desc">12 \u9053\u4E8C\u9009\u4E00 \xB7 3 \u5206\u949F<br>\u56DB\u5B57\u6BCD\u4EBA\u683C + \u7EF4\u5EA6\u767E\u5206\u6BD4</div>
          <button class="btn btn-primary" data-start="mbti">${t.profile&&t.profile.mbti?"\u91CD\u65B0\u6D4B\u8BD5":"\u5F00\u59CB\u6D4B\u8BD5"}</button>
        </div>
        <div class="test-entry" id="testSurvival">
          <div class="te-emoji">\u{1F393}</div>
          <div class="te-name">\u6821\u56ED\u751F\u5B58\u4EBA\u683C</div>
          <div class="te-desc">8 \u9053\u60C5\u666F\u9898 \xB7 1 \u5206\u949F<br>\u5377\u738B\u3001\u517B\u751F\u3001\u793E\u725B\u8FD8\u662F\u9690\u58EB\uFF1F</div>
          <button class="btn btn-primary" data-start="survival">${t.profile&&t.profile.results&&t.profile.results.survival?"\u91CD\u65B0\u6D4B\u8BD5":"\u5F00\u59CB\u6D4B\u8BD5"}</button>
        </div>
        <div class="test-entry" id="testBattery">
          <div class="te-emoji">\u{1F50B}</div>
          <div class="te-name">\u793E\u4EA4\u7535\u91CF\u6D4B\u8BD5</div>
          <div class="te-desc">6 \u9053\u60C5\u5883\u9898 \xB7 1 \u5206\u949F<br>\u770B\u770B\u4F60\u7684\u793E\u4EA4\u7535\u91CF\u8FD8\u5269\u591A\u5C11</div>
          <button class="btn btn-primary" data-start="battery">${t.profile&&t.profile.results&&t.profile.results.battery?"\u91CD\u65B0\u6D4B\u8BD5":"\u5F00\u59CB\u6D4B\u8BD5"}</button>
        </div>
      </div>
      <div id="testFlow"></div>`,c.querySelectorAll("[data-start]").forEach(y=>y.addEventListener("click",()=>{t.testKind=y.dataset.start,t.testIdx=0,t.testAnswers=[],p()}));function p(){let y=t.testKind,L={animal:t.questions.animal_questions,mbti:t.questions.mbti_questions,survival:t.questions.survival_questions,battery:t.questions.battery_questions}[y]||[],w=t.testIdx;if(w>=L.length){b();return}let x=L[w],N=y!=="mbti";c.querySelector("#testFlow").innerHTML=`
        <div class="card qcard">
          <div class="qprog">${t.testIdx+1} / ${L.length}<span class="qdots">${L.map((A,z)=>`<i class="${z<=w?"on":""}"></i>`).join("")}</span></div>
          <div class="qq">${i(x.q)}</div>
          <div class="qopts">
            ${N?x.options.map((A,z)=>`<button class="qopt" data-i="${z}">${i(A.t)}</button>`).join(""):`<button class="qopt" data-a="a">${i(x.a)}</button><button class="qopt" data-a="b">${i(x.b)}</button>`}
          </div>
          <div class="qfoot">${w>0?'<button class="btn btn-ghost btn-sm" id="qPrev">\u2039 \u4E0A\u4E00\u9898</button>':""}</div>
        </div>`;let H=t.testAnswers[w];c.querySelectorAll(".qopt").forEach(A=>{let z=N?Number(A.dataset.i):A.dataset.a;H===z&&A.classList.add("picked"),A.addEventListener("click",()=>{t.testAnswers[t.testIdx]=z,t.testIdx+=1,p()})});let D=c.querySelector("#qPrev");D&&D.addEventListener("click",()=>{t.testIdx<=0||(t.testIdx-=1,p())}),c.querySelector(".qcard").scrollIntoView({behavior:"smooth",block:"start"})}async function b(){c.querySelector("#testFlow").innerHTML='<div class="card qcard" style="text-align:center"><div class="muted">AI \u6B63\u5728\u751F\u6210\u4F60\u7684\u4E13\u5C5E\u89E3\u8BFB\u2026</div></div>';try{let y=await m.post("/buddy/test/submit",{kind:t.testKind,answers:t.testAnswers});t.profile=y,S(y)}catch(y){v(y.message,"error")}}function S(y){let g=y.result||{},L=t.testKind,w="\u{1F9E0}",x="",N="",H=[],D="";L==="animal"?(w=y.animal_emoji||"\u{1F43E}",x=`${y.animal_type}\u578B`,N=g.label||"",H=g.tags||[]):L==="mbti"?(x=y.mbti||"",N="MBTI \u56DB\u5B57\u6BCD\u4EBA\u683C"):L==="survival"?(w=g.emoji||"\u{1F393}",x=g.type||"",N=g.label||"",H=g.tags||[],D=g.desc||""):L==="battery"&&(w=g.emoji||"\u{1F50B}",x=g.type||"",N=g.label||"",H=g.tags||[],D=g.desc||""),c.querySelector("#testFlow").innerHTML=`
        <div class="result-card">
          <div class="rc-emoji">${w}</div>
          <div class="rc-name">${i(x)}</div>
          <div class="rc-label">${i(N)}</div>
          ${H.length?`<div class="rc-tags">${H.map(A=>`<span>${i(A)}</span>`).join("")}</div>`:""}
          ${D?`<div class="rc-desc">${i(D)}</div>`:""}
          ${y.reading?`<div class="rc-reading">${i(y.reading)}</div>`:""}
          <button class="btn btn-ghost btn-sm" data-bt="profile">\u67E5\u770B\u6211\u7684\u6863\u6848 \u2192</button>
        </div>`,c.querySelector('[data-bt="profile"]').addEventListener("click",()=>{t.tab="profile",u()})}}function k(){let p=t.profile||{},b=p.avatar||"",S=p.results||{},y=!!(p.animal_type||p.mbti||S.survival||S.battery),g=[];["01","02","03","04","05","06","07","08"].forEach(H=>{["a","b","c"].forEach(D=>g.push(`avatar-${H}${D}.svg`))});let L=["\u56FE\u4E66\u9986","\u4E03\u98DF\u5802","\u725B\u5C71\u8FD0\u52A8\u573A","\u9759\u8FDC\u697C","\u6587\u5B66\u9662","21\u4E16\u7EAA\u5927\u697C","\u6821\u533B\u9662","\u5BBF\u820D"],w=Array.from(new Set([p.place||"",...L].filter(Boolean))),x={\u67EF\u57FA:"\u{1F415}",\u732B\u732B:"\u{1F408}",\u6D77\u8C5A:"\u{1F42C}",\u523A\u732C:"\u{1F994}",\u4ED3\u9F20:"\u{1F439}",\u72D0\u72F8:"\u{1F98A}",\u9E45:"\u{1F9A2}",\u6C34\u736D:"\u{1F9A6}"},N=b;c.innerHTML=`
      <div class="result-card me">
        <div class="rc-emoji">${b?`<img class="rc-avatar" src="/static/img/avatars/${i(b)}" alt="">`:x[p.animal_type]||"\u{1F43E}"}</div>
        <div class="rc-name">${i(p.nickname||"\u5E08\u5927\u540C\u5B66")}</div>
        <div class="rc-label">${p.animal_type?i(p.animal_type)+"\u578B":""}${p.mbti?" \xB7 "+i(p.mbti):""}${S.survival?" \xB7 "+i(S.survival.type):""}${S.battery?" \xB7 \u7535\u91CF "+i(S.battery.pct)+"%":""}${y?"":"\u57FA\u7840\u6863\u6848\uFF08\u672A\u505A\u6D4B\u8BD5\uFF09"}</div>
        <div class="rc-tags">
          ${p.place?`<span>\u{1F4CD} ${i(p.place)}</span>`:""}
          ${(p.interests||[]).map(H=>`<span>${i(H)}</span>`).join("")}
        </div>
        ${p.reading?`<div class="rc-reading">${i(p.reading)}</div>`:""}
      </div>

      <div class="card" style="margin-top:14px">
        <div class="spread"><div class="card-title">\u57FA\u7840\u6863\u6848</div>
          <span class="muted" style="font-size:11px">\u5934\u50CF\u53EF\u81EA\u9009\uFF0C\u4E0D\u505A\u6D4B\u8BD5\u4E5F\u80FD\u51FA\u73B0\u5728\u9644\u8FD1</span></div>
        <div class="field" style="margin-top:12px"><label>\u9009\u62E9\u5934\u50CF</label>
          <div class="avatar-picker" id="avatarPicker">
            ${g.map(H=>`<button type="button" class="av-item ${H===b?"on":""}" data-av="${H}"><img src="/static/img/avatars/${H}" alt=""></button>`).join("")}
          </div>
        </div>
        <div class="grid grid-2">
          <div class="field"><label>\u6635\u79F0</label><input class="input" id="pfNick" value="${i(p.nickname||"")}" placeholder="\u60F3\u8BA9\u540C\u5B66\u600E\u4E48\u79F0\u547C\u4F60"></div>
          <div class="field"><label>\u5E38\u51FA\u6CA1\u5730\u70B9</label><select class="select" id="pfPlace">
            ${w.map(H=>`<option ${H===(p.place||"")?"selected":""}>${i(H)}</option>`).join("")}
          </select></div>
          <div class="field"><label>\u5E38\u51FA\u6CA1\u65F6\u6BB5</label><select class="select" id="pfTime">
            ${["\u65E9\u9E1F","\u591C\u732B","\u5168\u5929"].map(H=>`<option ${p.active_time===H?"selected":""}>${H}</option>`).join("")}
          </select></div>
          <div class="field"><label>\u6863\u6848\u53EF\u89C1\u6027</label><select class="select" id="pfVis">
            <option value="public" ${p.visibility==="public"?"selected":""}>\u516C\u5F00\uFF08\u51FA\u73B0\u5728\u63A8\u8350\u4E0E\u9644\u8FD1\uFF09</option>
            <option value="campus" ${p.visibility==="campus"?"selected":""}>\u4EC5\u540C\u6821\u533A\u53EF\u89C1</option>
            <option value="hidden" ${p.visibility==="hidden"?"selected":""}>\u9690\u85CF\uFF08\u4E0D\u51FA\u73B0\u5728\u63A8\u8350\uFF09</option>
          </select></div>
        </div>
        <button class="btn btn-primary btn-sm" id="pfSaveProfile">\u4FDD\u5B58\u6863\u6848</button>
      </div>

      ${y?`<div class="card" style="margin-top:14px"><div class="card-title">\u5DF2\u5B8C\u6210\u7684\u6D4B\u8BD5</div>
            <div class="test-done-list">
              <div class="td-row ${S.animal?"":"td-empty"}"><span>\u{1F9F8} \u5C0F\u52A8\u7269</span><b>${S.animal?i(S.animal.animal||"")+"\u578B":"\u672A\u6D4B\u8BD5"}</b></div>
              <div class="td-row ${p.mbti?"":"td-empty"}"><span>\u{1F9E0} MBTI</span><b>${p.mbti?i(p.mbti):"\u672A\u6D4B\u8BD5"}</b></div>
              <div class="td-row ${S.survival?"":"td-empty"}"><span>\u{1F393} \u751F\u5B58\u4EBA\u683C</span><b>${S.survival?i(S.survival.type||""):"\u672A\u6D4B\u8BD5"}</b></div>
              <div class="td-row ${S.battery?"":"td-empty"}"><span>\u{1F50B} \u793E\u4EA4\u7535\u91CF</span><b>${S.battery?i(S.battery.pct||0)+"%":"\u672A\u6D4B\u8BD5"}</b></div>
            </div></div>`:`<div class="card" style="margin-top:14px;text-align:center"><div class="card-title">\u8FD8\u6CA1\u6709\u6D4B\u8BD5\u7ED3\u679C</div>
            <div class="muted" style="margin-top:6px">\u56DB\u6B3E\u8DA3\u5473\u6D4B\u8BD5\u4EFB\u9009\u5176\u4E00\uFF0C\u80FD\u8BA9\u5339\u914D\u66F4\u51C6</div>
            <button class="btn btn-ghost btn-sm" style="margin-top:10px" data-bt-jump2="test">\u53BB\u505A\u6D4B\u8BD5 \u2192</button></div>`}

      <div class="card" style="margin-top:14px;text-align:center">
        <div class="card-title">\u60F3\u6362\u7ED3\u679C\uFF1F</div>
        <button class="btn btn-ghost btn-sm" style="margin-top:8px" data-bt-jump2="test">\u21BB \u91CD\u65B0\u6D4B\u8BD5</button>
      </div>`,c.querySelectorAll("#avatarPicker .av-item").forEach(H=>H.addEventListener("click",()=>{c.querySelectorAll("#avatarPicker .av-item").forEach(D=>D.classList.remove("on")),H.classList.add("on"),N=H.dataset.av})),c.querySelectorAll('[data-bt-jump2="test"]').forEach(H=>H.addEventListener("click",()=>{t.tab="test",e.querySelectorAll("[data-bt]").forEach(D=>D.classList.toggle("on",D.dataset.bt==="test")),u()})),c.querySelector("#pfSaveProfile").addEventListener("click",async()=>{try{t.profile=await m.post("/buddy/profile",{nickname:c.querySelector("#pfNick").value.trim()||"\u5E08\u5927\u540C\u5B66",avatar:N,place:c.querySelector("#pfPlace").value,active_time:c.querySelector("#pfTime").value,visibility:c.querySelector("#pfVis").value}),v("\u6863\u6848\u5DF2\u66F4\u65B0","success"),window.dispatchEvent(new CustomEvent("avatar:updated")),u()}catch(H){v(H.message,"error")}})}function f(){let p=a&&a.params&&a.params.get("sub")||"posts",b=t.rows.filter(g=>g.user_id===1),S=t.applications.filter(g=>g.role==="applicant"&&g.status==="accepted");c.innerHTML=`
      <div class="page-head"><div><div class="page-title">\u6211\u7684\u642D\u5B50</div><div class="page-sub">\u6211\u53D1\u5E03\u7684\u3001\u6211\u53C2\u52A0\u7684\uFF0C\u4EE5\u53CA\u5168\u90E8\u7533\u8BF7\u8BB0\u5F55\u3002</div></div>
        <button class="btn btn-primary" id="newBuddyMine">\u53D1\u5E03\u642D\u5B50</button></div>
      <div class="chips" style="margin-bottom:14px">
        <a class="chip ${p==="posts"?"active":""}" href="#/life/buddy?tab=mine&sub=posts">\u6211\u53D1\u5E03\u7684 ${b.length}</a>
        <a class="chip ${p==="joined"?"active":""}" href="#/life/buddy?tab=mine&sub=joined">\u6211\u53C2\u52A0\u7684 ${S.length}</a>
        <a class="chip ${p==="apps"?"active":""}" href="#/life/buddy?tab=mine&sub=apps">\u7533\u8BF7\u8BB0\u5F55 ${t.applications.length}</a>
      </div>
      <div id="mineBody"></div>`,c.querySelector("#newBuddyMine").addEventListener("click",()=>{t.tab="discover",u(),setTimeout(()=>{let g=c.querySelector("#newBuddy");g&&g.click()},60)});let y=c.querySelector("#mineBody");if(p==="posts")y.innerHTML=b.length?`<div class="grid grid-2">${b.map(g=>`<div class="card">
                <div class="spread"><span class="tag tag-blue">${i(g.type)}</span>${$e(g.status)}</div>
                <div class="card-title" style="margin-top:8px">${i(g.title)}</div>
                <div class="card-desc">${i(g.content)}</div>
                <div class="row" style="margin-top:10px"><span class="tag">${i(g.time)}</span><span class="tag">${i(g.place)}</span></div>
                <div class="row" style="margin-top:10px">
                  ${g.status==="open"?`<button class="btn btn-ghost btn-sm" data-close-mine="${g.id}">\u5173\u95ED</button>`:'<span class="tag">\u5DF2\u7ED3\u675F</span>'}
                </div>
              </div>`).join("")}</div>`:'<div class="card me-empty"><span class="me-empty-ico">\u{1F4DD}</span><div><b>\u8FD8\u6CA1\u6709\u53D1\u5E03\u8FC7\u642D\u5B50</b><span>\u70B9\u53F3\u4E0A\u89D2\u300C\u53D1\u5E03\u642D\u5B50\u300D\uFF0C\u8BF4\u8BF4\u4F60\u60F3\u627E\u4EC0\u4E48\u642D\u5B50\u3002</span></div></div>',y.querySelectorAll("[data-close-mine]").forEach(g=>g.addEventListener("click",async()=>{await m.post(`/buddy/posts/${g.getAttribute("data-close-mine")}/close`),v("\u5DF2\u5173\u95ED","success"),t.rows=await m.get("/buddy/posts"),f()}));else if(p==="joined")y.innerHTML=S.length?`<div class="card bk-list">${S.map(g=>`<div class="app-row">
                <span class="nc-ava">${g.peer_emoji}</span>
                <div class="app-main">
                  <div class="app-title">${i(g.post_title)}<span class="tag tag-green">\u5DF2\u901A\u8FC7</span></div>
                  <div class="muted">${i(g.peer_nickname)} \xB7 ${i(g.post_type||"")}\u642D\u5B50</div>
                </div>
                <button class="btn btn-primary btn-sm" data-app-chat="${g.id}" data-peer="${i(g.peer_nickname)}">\u8FDB\u5165\u804A\u5929</button>
              </div>`).join("")}</div>`:'<div class="card me-empty"><span class="me-empty-ico">\u{1F91D}</span><div><b>\u8FD8\u6CA1\u6709\u52A0\u5165\u7684\u642D\u5B50</b><span>\u5728\u300C\u53D1\u73B0\u300D\u91CC\u7533\u8BF7\u5E76\u901A\u8FC7\u540E\uFF0C\u4F1A\u51FA\u73B0\u5728\u8FD9\u91CC\u3002</span></div></div>',q(y);else{let g=t.applications;g.length?y.innerHTML=`<div class="card bk-list">${g.map(L=>{let w=[];return L.role==="applicant"&&L.status==="pending"&&w.push(`<button class="btn btn-ghost btn-sm" data-app-cancel="${L.id}">\u53D6\u6D88\u7533\u8BF7</button>`),L.status==="accepted"&&w.push(`<button class="btn btn-primary btn-sm" data-app-chat="${L.id}" data-peer="${i(L.peer_nickname)}">\u8FDB\u5165\u804A\u5929</button>`),L.role==="owner"&&L.status==="pending"&&(w.push(`<button class="btn btn-primary btn-sm" data-app-accept="${L.id}">\u901A\u8FC7</button>`),w.push(`<button class="btn btn-ghost btn-sm" data-app-reject="${L.id}">\u5A49\u62D2</button>`)),L.role==="owner"&&L.status!=="pending"&&w.push('<span class="muted" style="font-size:12px">\u6211\u6536\u5230\u7684\u7533\u8BF7</span>'),`<div class="app-row">
              <span class="nc-ava">${L.peer_emoji}</span>
              <div class="app-main">
                <div class="app-title">${i(L.post_title)}<span class="tag ${L.status==="accepted"?"tag-green":L.status==="pending"?"tag-gold":""}">${i(L.status_label)}</span></div>
                <div class="muted">${i(L.peer_nickname)} \xB7 ${i((L.message||"").slice(0,28))}${L.unread?` \xB7 ${L.unread} \u6761\u65B0\u6D88\u606F`:""}</div>
              </div>
              <div class="app-actions">${w.join("")}</div>
            </div>`}).join("")}</div>`:y.innerHTML='<div class="card me-empty"><span class="me-empty-ico">\u{1F4E8}</span><div><b>\u6682\u65E0\u7533\u8BF7\u8BB0\u5F55</b><span>\u53BB\u300C\u53D1\u73B0\u300D\u91CC\u5411\u611F\u5174\u8DA3\u7684\u540C\u5B66\u53D1\u51FA\u9080\u8BF7\u3002</span></div></div>',q(y),y.querySelectorAll("[data-app-cancel]").forEach(L=>L.addEventListener("click",async()=>{if(confirm("\u786E\u5B9A\u53D6\u6D88\u8FD9\u6761\u7533\u8BF7\uFF1F"))try{await m.post(`/buddy/applications/${L.getAttribute("data-app-cancel")}/cancel`),v("\u5DF2\u53D6\u6D88\u7533\u8BF7","success"),await M(),f()}catch(w){v(w.message,"error")}})),y.querySelectorAll("[data-app-accept]").forEach(L=>L.addEventListener("click",async()=>{await m.post(`/buddy/applications/${L.getAttribute("data-app-accept")}/accept`),v("\u5DF2\u901A\u8FC7\uFF0C\u53EF\u4EE5\u5F00\u59CB\u804A\u5929","success"),await M(),f()})),y.querySelectorAll("[data-app-reject]").forEach(L=>L.addEventListener("click",async()=>{await m.post(`/buddy/applications/${L.getAttribute("data-app-reject")}/reject`),v("\u5DF2\u5A49\u62D2"),await M(),f()}))}}async function M(){try{t.applications=await m.get("/buddy/applications")}catch{}}function q(p){p.querySelectorAll("[data-app-chat]").forEach(b=>b.addEventListener("click",()=>{let S=Number(b.getAttribute("data-app-chat")),y=b.getAttribute("data-peer")||"\u642D\u5B50";U(S,y)}))}function U(p,b){Z({title:`\u4E0E ${b} \u804A\u5929`,hideOk:!0,cancelText:"\u5173\u95ED",wide:!0,body:`<div class="chat-room">
        <div class="cr-msgs" id="mineMsgs"><div class="muted" style="text-align:center">\u52A0\u8F7D\u4E2D\u2026</div></div>
        <div class="cr-input-row"><input class="input" id="mineInput" placeholder="\u8F93\u5165\u6D88\u606F\u2026" autocomplete="off">
          <button class="btn btn-primary btn-sm" id="mineSend">\u53D1\u9001</button></div>
      </div>`});let S=document.getElementById("mineMsgs"),y=document.getElementById("mineInput"),g=async()=>{let w=await m.get(`/buddy/chat/${p}`);S.innerHTML=w.messages.map(x=>`<div class="cr-msg ${x.from_me?"me":"peer"}">
            <div class="cr-bubble">${i(x.content)}</div>
            <span class="cr-time">${i((x.created_at||"").slice(11,16))}</span>
          </div>`).join(""),S.scrollTop=S.scrollHeight;try{await m.post(`/buddy/chat/${p}/read`),await M()}catch{}};g();let L=async()=>{let w=y.value.trim();if(w){y.value="";try{await m.post(`/buddy/chat/${p}`,{content:w}),await g()}catch(x){v(x.message,"error")}}};document.getElementById("mineSend").addEventListener("click",L),y.addEventListener("keydown",w=>{w.key==="Enter"&&L()})}function u(){t.tab==="test"?E():t.tab==="profile"?k():t.tab==="mine"?f():_()}u()}ve();var rt=["\u5168\u90E8","\u81EA\u4E60","\u8FD0\u52A8","\u5403\u996D","\u7ADE\u8D5B","\u51FA\u6E38","\u5176\u4ED6"],ot="buddyActivityFilter",pt="buddyActivityScroll",Ct="buddyActivityFavorites";function Ht(e){if(!e.start_at)return"\u65F6\u95F4\u5F85\u5B9A";let a=String(e.start_at).replace("T"," "),s=String(e.end_at||"").replace("T"," "),t=a.slice(5,16),n=s?s.slice(11,16):"";return`${t}${n?`\u2014${n}`:""}`}function It(e){let a={recruiting:["badge-open","\u62DB\u52DF\u4E2D"],stopped:["badge-pending","\u505C\u6B62\u62DB\u52DF"],cancelled:["badge-closed","\u5DF2\u53D6\u6D88"],finished:["badge-occupied","\u5DF2\u7ED3\u675F"],removed:["badge-closed","\u5DF2\u4E0B\u67B6"]},[s,t]=a[e.effective_status]||["badge-occupied",e.status_label||"\u672A\u77E5"];return`<span class="badge ${s}">${i(t)}</span>`}function pi(e){return e.effective_status==="cancelled"?`\u5DF2\u53D6\u6D88 \xB7 \u539F\u5B9A ${e.capacity} \u4EBA`:e.remaining<=0?`\u5DF2\u53C2\u52A0 ${e.taken}/${e.capacity} \u4EBA \xB7 \u5DF2\u6EE1\u5458`:`\u5DF2\u53C2\u52A0 ${e.taken}/${e.capacity} \u4EBA\uFF0C\u8FD8\u7F3A ${e.remaining} \u4EBA`}function ui(e){try{return JSON.parse(localStorage.getItem(Ct)||"[]").includes(Number(e))}catch{return!1}}function vi(e){let a=[];try{a=JSON.parse(localStorage.getItem(Ct)||"[]")}catch{a=[]}let s=Number(e),t=a.includes(s);return a=t?a.filter(n=>n!==s):[...a,s],localStorage.setItem(Ct,JSON.stringify(a)),!t}function mi(e){return e.is_owner?e.effective_status==="recruiting"?{label:"\u7BA1\u7406\u6D3B\u52A8",kind:"manage"}:{label:"\u67E5\u770B\u6D3B\u52A8",kind:"detail"}:e.mine.status==="pending"?{label:"\u67E5\u770B\u7533\u8BF7",kind:"viewApply"}:e.mine.status==="accepted"?e.effective_status==="finished"||e.effective_status==="cancelled"?{label:"\u67E5\u770B\u6D3B\u52A8\u8BB0\u5F55",kind:"detail"}:{label:"\u8FDB\u5165\u804A\u5929",kind:"chat"}:e.mine.status==="rejected"?{label:"\u67E5\u770B\u7533\u8BF7\u7ED3\u679C",kind:"detail"}:e.mine.status==="withdrawn"?{label:"\u91CD\u65B0\u7533\u8BF7",kind:"apply"}:e.effective_status==="cancelled"?{label:"\u5DF2\u53D6\u6D88",kind:"disabled"}:e.effective_status==="finished"?{label:"\u5DF2\u7ED3\u675F",kind:"disabled"}:e.effective_status==="stopped"?{label:"\u5DF2\u505C\u6B62\u62DB\u52DF",kind:"disabled"}:e.remaining<=0?{label:"\u5DF2\u6EE1\u5458",kind:"disabled"}:{label:"\u7533\u8BF7\u53C2\u52A0",kind:"apply"}}function gi(e){return e.is_owner?{label:"\u67E5\u770B\u7533\u8BF7",kind:"applications"}:e.mine.status==="pending"?{label:"\u64A4\u56DE\u7533\u8BF7",kind:"withdraw"}:e.mine.status==="accepted"?{label:"\u67E5\u770B\u6D3B\u52A8",kind:"detail"}:e.mine.status==="rejected"?{label:"\u6D4F\u89C8\u5176\u4ED6\u6D3B\u52A8",kind:"browse"}:e.remaining<=0?{label:"\u6D4F\u89C8\u7C7B\u4F3C\u6D3B\u52A8",kind:"browse"}:e.effective_status==="cancelled"?{label:"\u67E5\u770B\u8BF4\u660E",kind:"detail"}:e.effective_status==="finished"?{label:"\u518D\u7EA6\u4E00\u6B21",kind:"repeat"}:{label:ui(e.id)?"\u5DF2\u6536\u85CF":"\u6536\u85CF",kind:"favorite"}}function ut(e){let a=mi(e),s=gi(e),t=(e.recommend_reasons||[]).slice(0,3);return`<article class="activity-card card" data-activity="${e.id}">
    <div class="activity-top">
      <span class="tag tag-blue">${i(e.type)}</span>
      <span class="tag">${i(e.campus)}</span>
      ${It(e)}
      ${e.is_owner?'<span class="tag tag-gold">\u6211\u53D1\u5E03\u7684</span>':""}
    </div>
    <h3 class="activity-title">${i(e.title)}</h3>
    <div class="activity-meta">
      <div><span class="ico">\u{1F552}</span>${i(Ht(e))}</div>
      <div><span class="ico">\u{1F4CD}</span>${i(e.place)}</div>
    </div>
    <div class="activity-people">
      <span>${i(pi(e))}</span>
      <span class="activity-bar"><i style="width:${Math.min(100,Math.round(e.taken/Math.max(1,e.capacity)*100))}%"></i></span>
    </div>
    <p class="activity-desc">${i((e.content||"").slice(0,70))}${(e.content||"").length>70?"\u2026":""}</p>
    ${t.length?`<div class="activity-reasons">${t.map(n=>`<span>${i(n)}</span>`).join("")}</div>`:""}
    <div class="activity-foot">
      <span class="activity-owner"><b class="owner-avatar">${i(e.owner.emoji)}</b><span>${i(e.owner.nickname)}</span></span>
      <div class="row">
        <button class="btn btn-ghost btn-sm" data-act="${s.kind}" data-id="${e.id}">${i(s.label)}</button>
        <button class="btn ${a.kind==="disabled"?"btn-ghost":"btn-primary"} btn-sm" data-act="${a.kind}" data-id="${e.id}" ${a.kind==="disabled"?"disabled":""}>${i(a.label)}</button>
      </div>
    </div>
  </article>`}function Nt(e,a){if(!e.can_apply){e.remaining<=0?v("\u6D3B\u52A8\u5DF2\u6EE1\u5458","error"):e.effective_status!=="recruiting"?v("\u6D3B\u52A8\u5DF2\u505C\u6B62\u62DB\u52DF","error"):e.mine.status==="pending"?v("\u5DF2\u7533\u8BF7\uFF0C\u7B49\u5F85\u53D1\u8D77\u4EBA\u5904\u7406","success"):v("\u5F53\u524D\u72B6\u6001\u4E0D\u53EF\u7533\u8BF7","error");return}Z({title:`\u7533\u8BF7\u53C2\u52A0\u300C${e.title}\u300D`,okText:"\u53D1\u9001\u7533\u8BF7",body:`<div class="muted" style="margin-bottom:10px">\u7ED9\u53D1\u8D77\u4EBA\u7559\u53E5\u8BDD\uFF0C\u8BA9\u5BF9\u65B9\u4E86\u89E3\u4F60\u7684\u65F6\u95F4\u548C\u76EE\u6807\u3002</div>
      <textarea class="textarea" id="applyMsg" maxlength="300" placeholder="\u4F8B\u5982\uFF1A\u6211\u4E5F\u5728\u5907\u8003\u516D\u7EA7\uFF0C\u65F6\u95F4\u6B63\u597D\u5408\u9002\uFF0C\u53EF\u4EE5\u4E00\u8D77\u81EA\u4E60\u3002"></textarea>
      <div class="muted" style="margin-top:8px">\u4E0D\u8981\u6C42\u586B\u5199\u8054\u7CFB\u65B9\u5F0F\uFF1B\u901A\u8FC7\u540E\u53EF\u5728\u7AD9\u5185\u804A\u5929\u7EA6\u7EC6\u8282\u3002</div>`,onOk:async()=>{let s=(document.getElementById("applyMsg").value||"").trim();await m.post(`/buddy/activities/${e.id}/apply`,{message:s}),v("\u7533\u8BF7\u5DF2\u53D1\u9001\uFF0C\u7B49\u5F85\u53D1\u8D77\u4EBA\u5904\u7406","success"),document.getElementById("modalRoot").innerHTML="",a&&a()}})}async function Dt(e,a,s,t){if(e!=="disabled"){if(e==="detail"){sessionStorage.setItem(pt,String(window.scrollY||0)),s.navigate(`/life/buddy/activity?id=${a}`);return}if(e==="manage"){s.navigate(`/life/buddy/activity?id=${a}`);return}if(e==="applications"){s.navigate("/life/buddy/messages?tab=received");return}if(e==="chat"){let n=await m.get(`/buddy/activities/${a}`);n.mine&&n.mine.application_id?s.navigate(`/life/buddy/messages?chat=${n.mine.application_id}`):s.navigate("/life/buddy/messages?tab=chat");return}if(e==="apply"){let n=await m.get(`/buddy/activities/${a}`);Nt(n,t);return}if(e==="withdraw"){let n=await m.get(`/buddy/activities/${a}`);if(!n.mine.application_id||!confirm("\u64A4\u56DE\u8FD9\u6B21\u7533\u8BF7\uFF1F"))return;await m.post(`/buddy/applications/${n.mine.application_id}/withdraw`),v("\u5DF2\u64A4\u56DE\u7533\u8BF7","success"),t&&t();return}if(e==="favorite"){let n=vi(a);v(n?"\u5DF2\u6536\u85CF":"\u5DF2\u53D6\u6D88\u6536\u85CF"),t&&t();return}if(e==="browse"){let n=await m.get(`/buddy/activities/${a}`);sessionStorage.setItem(ot,JSON.stringify({type:n.type,need_more:!0,sort:"soon"})),s.navigate("/life/buddy");return}e==="repeat"&&s.navigate("/life/buddy/new")}}function He(e,a=""){return`<div class="empty"><strong>${i(e)}</strong>${a?i(a):""}</div>`}var vt="buddyActivityDraft",Pt=new Set;function bi(){try{return{q:"",type:"",campus:"",time_filter:"",need_more:!1,sort:"soon",...JSON.parse(sessionStorage.getItem(ot)||"{}")}}catch{return{q:"",type:"",campus:"",time_filter:"",need_more:!1,sort:"soon"}}}function fi(e){sessionStorage.setItem(ot,JSON.stringify(e))}function Ca(e,a,s){return`<div class="buddy-nav">
    <div class="buddy-nav-tabs">
      ${[["#/life/buddy","\u627E\u6D3B\u52A8","activity",0],["#/life/buddy/mine","\u6211\u7684\u6D3B\u52A8","mine",0],["#/life/buddy/messages","\u7533\u8BF7\u4E0E\u6D88\u606F","messages",a+s]].map(([n,d,l,c])=>`<a class="buddy-nav-tab ${e===l?"on":""}" href="${n}">${d}${c?`<span class="buddy-dot">${c}</span>`:""}</a>`).join("")}
    </div>
    <div class="buddy-nav-actions">
      <a class="btn btn-ghost btn-sm" href="#/life/buddy?tab=profile">\u6211\u7684\u642D\u5B50\u6863\u6848</a>
      <a class="btn btn-ghost btn-sm" href="#/life/buddy?tab=test">\u8DA3\u5473\u95EE\u7B54</a>
    </div>
  </div>`}async function Ha(){try{let[e,a]=await Promise.all([m.get("/buddy/activity-applications"),m.get("/buddy/chats")]),s=(e.received||[]).length,t=(a||[]).reduce((n,d)=>n+(d.unread||0),0);return{pending:s,unread:t}}catch{return{pending:0,unread:0}}}async function Ia(e,a){Pt=new Set;let s=a.params.get("tab");if(s==="test"||s==="profile")return ja(e,a);let t=bi(),{pending:n,unread:d}=await Ha(),l=[];e.innerHTML=`${Ca("activity",n,d)}
    <div class="page-head"><div><div class="page-sub">\u627E\u5230\u65F6\u95F4\u5408\u9002\u3001\u76EE\u6807\u4E00\u81F4\u7684\u6821\u56ED\u4F19\u4F34\u3002</div></div></div>
    <div class="buddy-filters card">
      <div class="buddy-search-row">
        <input class="input" id="buddyQ" placeholder="\u641C\u7D22\u6D3B\u52A8\u6807\u9898\u3001\u5730\u70B9\u6216\u5173\u952E\u8BCD" value="${i(t.q||"")}">
        <select class="select" id="buddySort">
          <option value="soon" ${t.sort==="soon"?"selected":""}>\u8FD1\u671F\u5F00\u59CB</option>
          <option value="latest" ${t.sort==="latest"?"selected":""}>\u6700\u65B0\u53D1\u5E03</option>
        </select>
      </div>
      <div class="chips buddy-cats">
        ${rt.map(u=>`<button class="chip ${t.type===u||u==="\u5168\u90E8"&&!t.type?"active":""}" data-type="${u}">${u}</button>`).join("")}
      </div>
      <div class="buddy-filter-row">
        <select class="select" id="buddyCampus">
          <option value="">\u5168\u90E8\u6821\u533A</option>
          ${["\u6CC9\u5C71\u6821\u533A","\u4E91\u9F99\u6821\u533A","\u594E\u56ED\u6821\u533A","\u6F58\u5B89\u6E56\u6821\u533A"].map(u=>`<option ${t.campus===u?"selected":""}>${u}</option>`).join("")}
        </select>
        <select class="select" id="buddyTime">
          <option value="">\u4E0D\u9650\u65F6\u95F4</option>
          <option value="today" ${t.time_filter==="today"?"selected":""}>\u4ECA\u5929</option>
          <option value="week" ${t.time_filter==="week"?"selected":""}>\u672C\u5468\u5185</option>
        </select>
        <label class="row buddy-check"><input type="checkbox" id="buddyNeed" ${t.need_more?"checked":""}> \u53EA\u770B\u8FD8\u7F3A\u4EBA</label>
        <button class="btn btn-ghost btn-sm" id="buddyClear">\u6E05\u7A7A\u7B5B\u9009</button>
        <button class="btn btn-ghost btn-sm" id="buddyDraw">\u{1F3B2} \u6447\u4E00\u6447\u62BD\u7EB8\u6761</button>
      </div>
      <div id="buddySelected" class="buddy-selected"></div>
    </div>
    <div class="spread" style="margin-top:18px;margin-bottom:18px;align-items:center">
      <div class="section-title" style="margin:0">\u642D\u5B50\u5E7F\u573A</div>
      <button class="btn btn-ghost btn-sm" id="buddyRefresh" title="\u6362\u4E00\u6279\u65B0\u7684\u6D3B\u52A8">\u21BB \u5237\u65B0</button>
    </div>
    <div id="activityList" class="activity-grid"></div>
    <div id="recommendBox"></div>`;let c=e.querySelector("#activityList"),r=e.querySelector("#buddySelected"),o=e.querySelector("#recommendBox");function h(){let u=[];return t.q&&u.push(`\u641C\u7D22\uFF1A${t.q}`),t.type&&u.push(`\u5206\u7C7B\uFF1A${t.type}`),t.campus&&u.push(t.campus),t.time_filter==="today"&&u.push("\u4ECA\u5929"),t.time_filter==="week"&&u.push("\u672C\u5468\u5185"),t.need_more&&u.push("\u8FD8\u7F3A\u4EBA"),u}function _(){let u=h();r.innerHTML=u.length?`<span class="muted">\u5DF2\u9009\uFF1A</span>${u.map(b=>`<span class="tag">${i(b)}</span>`).join("")}<button class="buddy-clear-inline" id="buddyClearInline">\u6E05\u7A7A</button>`:'<span class="muted">\u9ED8\u8BA4\u6309\u201C\u8FD1\u671F\u5F00\u59CB\u4E14\u8FD8\u7F3A\u4EBA\u201D\u6392\u5E8F</span>';let p=r.querySelector("#buddyClearInline");p&&p.addEventListener("click",q)}function E(){e.querySelector("#buddyQ").value=t.q||"",e.querySelector("#buddySort").value=t.sort||"soon",e.querySelector("#buddyCampus").value=t.campus||"",e.querySelector("#buddyTime").value=t.time_filter||"",e.querySelector("#buddyNeed").checked=!!t.need_more,e.querySelectorAll("[data-type]").forEach(u=>{let p=u.getAttribute("data-type");u.classList.toggle("active",p==="\u5168\u90E8"?!t.type:p===t.type)}),_()}let k=new Set;async function f(u=!0,p={}){fi(t);let b=new URLSearchParams;p.exclude&&b.set("exclude",p.exclude),p.shuffle&&b.set("shuffle","1"),b.set("limit",String(p.limit===void 0?6:p.limit)),t.q&&b.set("q",t.q),t.type&&b.set("type",t.type),t.campus&&b.set("campus",t.campus),t.time_filter&&b.set("time_filter",t.time_filter),t.need_more&&b.set("need_more","1"),b.set("sort",t.sort||"soon");try{l=await m.get(`/buddy/activities?${b.toString()}`);let S=c;if(S.innerHTML=l.length?l.map(ut).join(""):He("\u6CA1\u6709\u7B26\u5408\u6761\u4EF6\u7684\u6D3B\u52A8","\u6362\u4E2A\u7B5B\u9009\u6761\u4EF6\uFF0C\u6216\u8005\u81EA\u5DF1\u53D1\u5E03\u4E00\u4E2A\u6D3B\u52A8"),o.innerHTML=M(l),u){let y=Number(sessionStorage.getItem(pt)||0);y>0&&(requestAnimationFrame(()=>window.scrollTo({top:y,behavior:"instant"})),sessionStorage.removeItem(pt))}}catch(S){c.innerHTML=He("\u6D3B\u52A8\u52A0\u8F7D\u5931\u8D25",S.message)}}function M(u){let p=u.filter(b=>!b.is_owner&&b.mine.status!=="accepted"&&b.effective_status==="recruiting"&&b.remaining>0).filter(b=>b.recommend_reasons.includes("\u540C\u6821\u533A")).slice(0,3);return p.length?`<div class="section-title">\u4E3A\u4F60\u63A8\u8350 <span class="title-hint">\u6309\u540C\u6821\u533A\u3001\u65F6\u95F4\u4E0E\u5171\u540C\u5174\u8DA3\u63A8\u8350</span></div>
      <div class="activity-grid">${p.map(ut).join("")}</div>`:""}function q(){t={q:"",type:"",campus:"",time_filter:"",need_more:!1,sort:"soon"},E(),f(!1)}e.querySelector("#buddyRefresh").addEventListener("click",async()=>{let u=e.querySelector("#buddyRefresh");u.disabled=!0;try{let p=l.map(S=>S.id),b=[...new Set([...k,...p])].join(",");if(await f(!1,{exclude:b,shuffle:1}),!l.length){k.clear(),await f(!1,{shuffle:1}),l.length?(l.forEach(S=>k.add(S.id)),v(`\u5DF2\u770B\u5B8C\u5168\u90E8\u6D3B\u52A8\uFF0C\u91CD\u65B0\u5F00\u59CB\u4E00\u6279\uFF08${l.length} \u4E2A\uFF09`,"success")):v("\u6682\u65F6\u6CA1\u6709\u66F4\u591A\u6D3B\u52A8\u4E86\uFF0C\u7A0D\u540E\u518D\u6765\u770B\u770B","success");return}l.forEach(S=>k.add(S.id)),v(`\u5DF2\u6362\u4E00\u6279\uFF08${l.length} \u4E2A\u65B0\u6D3B\u52A8\uFF09`,"success")}finally{u.disabled=!1}}),e.querySelector("#buddyQ").addEventListener("input",u=>{clearTimeout(u.target._timer),u.target._timer=setTimeout(()=>{t.q=u.target.value.trim(),f(!1)},280)}),e.querySelector("#buddySort").addEventListener("change",u=>{t.sort=u.target.value,f(!1)}),e.querySelector("#buddyCampus").addEventListener("change",u=>{t.campus=u.target.value,E(),f(!1)}),e.querySelector("#buddyTime").addEventListener("change",u=>{t.time_filter=u.target.value,E(),f(!1)}),e.querySelector("#buddyNeed").addEventListener("change",u=>{t.need_more=u.target.checked,E(),f(!1)}),e.querySelector("#buddyClear").addEventListener("click",q),e.querySelectorAll("[data-type]").forEach(u=>{u.addEventListener("click",()=>{let p=u.getAttribute("data-type");t.type=p==="\u5168\u90E8"?"":p,E(),f(!1)})}),e.querySelector("#buddyDraw").addEventListener("click",()=>U());async function U(){try{let p=(await m.get("/buddy/nearby")||[]).filter(w=>w.visible!==!1&&!Pt.has(w.user_id)),b=[...new Map(p.map(w=>[w.user_id,w])).values()].slice(0,20);if(!b.length)return v("\u672C\u8F6E\u516C\u5F00\u6863\u6848\u7684\u540C\u5B66\u5DF2\u62BD\u5B8C\uFF0C\u9000\u51FA\u627E\u642D\u5B50\u518D\u8FDB\u5165\u53EF\u91CD\u65B0\u62BD\u53D6","error");let S=[...b].sort(()=>Math.random()-.5).slice(0,3);S.forEach(w=>Pt.add(w.user_id));let y=w=>w&&(w.animal_emoji||{\u67EF\u57FA:"\u{1F415}",\u732B\u732B:"\u{1F408}",\u6D77\u8C5A:"\u{1F42C}",\u523A\u732C:"\u{1F994}",\u4ED3\u9F20:"\u{1F439}",\u72D0\u72F8:"\u{1F98A}",\u9E45:"\u{1F9A2}",\u6C34\u736D:"\u{1F9A6}"}[w.animal_type])||"\u{1F43E}",g=w=>{let x=w.profile||{};Z({title:`${x.nickname||"\u5E08\u5927\u540C\u5B66"} \u7684\u642D\u5B50\u6863\u6848`,hideOk:!0,cancelText:"\u5173\u95ED",body:`<div class="draw-detail">
            <div class="dd-head">
              <span class="dd-emoji">${y(x)}</span>
              <div style="min-width:0">
                <strong>${i(x.nickname||"\u5E08\u5927\u540C\u5B66")}</strong>
                <div class="muted">${i(x.college||"\u540C\u6821\u533A")} \xB7 ${i(x.active_time||"\u65F6\u95F4\u4E0D\u5B9A")}</div>
              </div>
            </div>
            <div class="row" style="gap:6px;margin-top:10px;flex-wrap:wrap">
              ${x.mbti?`<span class="tag tag-blue">${i(x.mbti)}</span>`:""}
              ${x.animal_type?`<span class="tag">${i(x.animal_type)}\u578B</span>`:""}
              ${w.same_college?'<span class="tag tag-green">\u540C\u5B66\u9662</span>':""}
            </div>
            ${(x.interests||[]).length?`<div class="dd-tags">${x.interests.map(H=>`<span>${i(H)}</span>`).join("")}</div>`:""}
            <div class="dd-line">\u{1F4CD} \u5E38\u5728\uFF1A${i(w.place||x.place||"\u6821\u56ED")}</div>
            ${w.post?`<div class="dd-post"><span class="tag tag-blue">${i(w.post.type)}</span><strong>${i(w.post.title)}</strong>
                  <div class="muted">${i(w.post.time)} \xB7 ${i(w.post.place)}</div></div>
                <div class="row" style="justify-content:center;margin-top:14px">
                  <button class="btn btn-primary" id="drawGoActivity" type="button">\u67E5\u770B\u6D3B\u52A8\u5E76\u7533\u8BF7</button>
                </div>`:'<div class="muted" style="margin-top:12px;text-align:center">TA \u6682\u65F6\u6CA1\u6709\u516C\u5F00\u6D3B\u52A8\uFF0C\u53EF\u4EE5\u5728\u642D\u5B50\u5E7F\u573A\u627E\u627E\u540C\u7C7B\u6D3B\u52A8\u3002</div>'}
          </div>`});let N=document.getElementById("drawGoActivity");N&&w.post&&N.addEventListener("click",()=>{document.getElementById("modalRoot").innerHTML="",a.navigate(`/life/buddy/activity?id=${w.post.id}`)})};Z({title:"\u6447\u4E00\u6447 \xB7 \u4ECA\u5929\u53EF\u80FD\u9047\u5230\u7684\u540C\u5B66",hideOk:!0,cancelText:"\u5173\u95ED",body:`<div class="draw-results">${S.map(w=>`<div class="draw-person">
              <div class="draw-emoji">${y(w.profile)}</div>
              <div style="flex:1;min-width:0">
                <strong>${i(w.profile&&w.profile.nickname||"\u5E08\u5927\u540C\u5B66")}</strong>
                <div class="muted">${i(w.profile&&w.profile.college||"\u540C\u6821\u533A")} \xB7 ${i(w.profile&&w.profile.active_time||"\u65F6\u95F4\u4E0D\u5B9A")}</div>
                <div class="muted">\u{1F4CD} ${i(w.place||"\u6CC9\u5C71\u6821\u533A")}${w.post?` \xB7 ${i(w.post.type)}\u642D\u5B50`:""}</div>
                ${w.post?`<div class="muted" style="margin-top:2px">${i(w.post.title)}</div>`:""}
              </div>
              <button class="btn btn-primary btn-sm" data-draw-open="${w.user_id}" type="button">\u67E5\u770B\u6863\u6848</button>
            </div>`).join("")}</div><div class="muted" style="margin-top:10px">\u70B9\u201C\u67E5\u770B\u6863\u6848\u201D\u53EF\u770B\u5BF9\u65B9\u5B8C\u6574\u8D44\u6599\uFF0C\u5E76\u76F4\u63A5\u6253\u5F00 TA \u7684\u6D3B\u52A8\u7533\u8BF7\u53C2\u52A0\u3002</div>
        <div class="row" style="justify-content:center;margin-top:12px">
          <button class="btn btn-ghost btn-sm" id="drawRefresh" type="button">\u5237\u65B0\u4E00\u6279</button>
        </div>`});let L=document.getElementById("drawRefresh");L&&L.addEventListener("click",()=>{document.getElementById("modalRoot").innerHTML="",U()}),document.querySelectorAll("[data-draw-open]").forEach(w=>w.addEventListener("click",()=>{let x=S.find(N=>N.user_id===Number(w.getAttribute("data-draw-open")));x&&(document.getElementById("modalRoot").innerHTML="",g(x))}))}catch(u){v(u.message,"error")}}e.addEventListener("click",async u=>{let p=u.target.closest("[data-act]");if(p){u.preventDefault(),u.stopPropagation();try{await Dt(p.getAttribute("data-act"),Number(p.getAttribute("data-id")),a,()=>f(!1))}catch(b){v(b.message,"error")}}}),E(),await f(!0)}async function Na(e,a){let s="published",{pending:t,unread:n}=await Ha();e.innerHTML=`${Ca("mine",t,n)}
    <div class="spread" style="margin-bottom:14px">
      <div class="tabs buddy-subtabs">
        <button class="tab active" data-mine="published">\u6211\u53D1\u5E03\u7684</button>
        <button class="tab" data-mine="joined">\u6211\u53C2\u52A0\u7684</button>
        <button class="tab" data-mine="finished">\u5DF2\u7ED3\u675F</button>
      </div>
      <a class="btn btn-primary btn-sm" href="#/life/buddy/new">\uFF0B \u53D1\u5E03\u6D3B\u52A8</a>
    </div>
    <div id="mineBox"></div>`;let d=e.querySelector("#mineBox"),l={published:[],joined:[],finished:[]};function c(){let r=l[s]||[];d.innerHTML=r.length?`<div class="activity-grid">${r.map(ut).join("")}</div>`:He(s==="published"?"\u8FD8\u6CA1\u6709\u53D1\u5E03\u8FC7\u6D3B\u52A8":s==="joined"?"\u8FD8\u6CA1\u6709\u53C2\u52A0\u6D3B\u52A8":"\u8FD8\u6CA1\u6709\u5DF2\u7ED3\u675F\u7684\u6D3B\u52A8",s==="published"?"\u70B9\u53F3\u4E0A\u89D2\u53D1\u5E03\u4E00\u4E2A\u6D3B\u52A8\uFF0C\u7B49\u4EBA\u6765\u7533\u8BF7":"\u53BB\u300C\u627E\u6D3B\u52A8\u300D\u770B\u770B")}e.querySelectorAll("[data-mine]").forEach(r=>{r.addEventListener("click",()=>{s=r.getAttribute("data-mine"),e.querySelectorAll("[data-mine]").forEach(o=>o.classList.toggle("active",o===r)),c()})}),e.addEventListener("click",async r=>{let o=r.target.closest("[data-act]");if(o){r.preventDefault(),r.stopPropagation();try{await Dt(o.getAttribute("data-act"),Number(o.getAttribute("data-id")),a,async()=>{l=await m.get("/buddy/activities/mine"),c()})}catch(h){v(h.message,"error")}}});try{l=await m.get("/buddy/activities/mine")}catch(r){d.innerHTML=He("\u52A0\u8F7D\u5931\u8D25",r.message);return}c()}function yi(){try{return JSON.parse(localStorage.getItem(vt)||"{}")}catch{return{}}}function Ba(e){let a={};["type","title","campus","place","start_at","end_at","capacity","content","requirements","signup_deadline"].forEach(s=>{let t=e.querySelector(`[name="${s}"]`);t&&(a[s]=t.value)}),localStorage.setItem(vt,JSON.stringify(a))}async function Rt(e,a){let s=yi(),t=new Date;t.setMinutes(0,0,0),t.setHours(t.getHours()+2);let n=c=>String(c).padStart(2,"0"),d=`${t.getFullYear()}-${n(t.getMonth()+1)}-${n(t.getDate())}T${n(t.getHours())}:00`;e.innerHTML=`<div class="page-head"><div><div class="page-title">\u53D1\u5E03\u6D3B\u52A8</div><div class="page-sub">\u5199\u6E05\u695A\u201C\u505A\u4EC0\u4E48\u3001\u4EC0\u4E48\u65F6\u5019\u3001\u5728\u54EA\u3001\u51E0\u4E2A\u4EBA\u201D\uFF0C\u540C\u5B66\u624D\u597D\u5224\u65AD\u8981\u4E0D\u8981\u6765\u3002</div></div>
      <a class="btn btn-ghost" href="#/life/buddy">\u53D6\u6D88</a></div>
    <form class="activity-form card" id="activityForm">
      <div class="grid grid-2">
        <div class="field"><label>\u6D3B\u52A8\u7C7B\u578B *</label><select class="select" name="type">${rt.slice(1).map(c=>`<option ${s.type===c?"selected":""}>${c}</option>`).join("")}</select></div>
        <div class="field"><label>\u6D3B\u52A8\u6807\u9898 *</label><input class="input" name="title" maxlength="40" value="${i(s.title||"")}" placeholder="\u4F8B\u5982\uFF1A\u4ECA\u665A\u56FE\u4E66\u9986\u81EA\u4E60\uFF0C\u5907\u8003\u82F1\u8BED\u516D\u7EA7"></div>
        <div class="field"><label>\u6821\u533A *</label><select class="select" name="campus">${["\u6CC9\u5C71\u6821\u533A","\u4E91\u9F99\u6821\u533A","\u594E\u56ED\u6821\u533A","\u6F58\u5B89\u6E56\u6821\u533A"].map(c=>`<option ${s.campus===c?"selected":""}>${c}</option>`).join("")}</select></div>
        <div class="field"><label>\u5730\u70B9 *</label><input class="input" name="place" maxlength="60" value="${i(s.place||"")}" placeholder="\u4F8B\u5982\uFF1A\u656C\u6587\u56FE\u4E66\u9986\u4E09\u697C"></div>
        <div class="field"><label>\u5F00\u59CB\u65F6\u95F4 *</label><input class="input" type="datetime-local" name="start_at" value="${i(s.start_at||d)}"></div>
        <div class="field"><label>\u7ED3\u675F\u65F6\u95F4 *</label><input class="input" type="datetime-local" name="end_at" value="${i(s.end_at||"")}"></div>
        <div class="field"><label>\u6D3B\u52A8\u603B\u4EBA\u6570 *\uFF08\u542B\u53D1\u8D77\u4EBA\uFF09</label><input class="input" type="number" name="capacity" min="2" max="50" value="${i(s.capacity||4)}"></div>
        <div class="field"><label>\u62A5\u540D\u622A\u6B62\uFF08\u53EF\u9009\uFF09</label><input class="input" type="datetime-local" name="signup_deadline" value="${i(s.signup_deadline||"")}"></div>
      </div>
      <div class="field" style="margin-top:12px"><label>\u7B80\u77ED\u8BF4\u660E *</label><textarea class="textarea" name="content" maxlength="300" placeholder="\u4F8B\u5982\uFF1A\u5E0C\u671B\u5B89\u9759\u5B66\u4E60\uFF0C\u4E2D\u9014\u53EF\u4EE5\u4E00\u8D77\u8BA8\u8BBA\u95EE\u9898\u3002">${i(s.content||"")}</textarea></div>
      <div class="field" style="margin-top:12px"><label>\u53C2\u4E0E\u8981\u6C42\uFF08\u53EF\u9009\uFF09</label><input class="input" name="requirements" maxlength="120" value="${i(s.requirements||"")}" placeholder="\u4F8B\u5982\uFF1A\u81EA\u5E26\u7535\u8111\u3001\u9700\u8981\u4E00\u5B9A\u9AD8\u6570\u57FA\u7840"></div>
      <div class="buddy-form-tip muted">\u5DF2\u53C2\u52A0\u4EBA\u6570\u5305\u542B\u53D1\u8D77\u4EBA\u548C\u5DF2\u901A\u8FC7\u6210\u5458\uFF1B\u5F85\u5904\u7406\u7533\u8BF7\u4E0D\u5360\u540D\u989D\u3002\u8349\u7A3F\u5DF2\u81EA\u52A8\u4FDD\u5B58\u3002</div>
      <div class="row" style="margin-top:16px;justify-content:flex-end">
        <button type="button" class="btn btn-ghost" id="draftClear">\u6E05\u7A7A\u8349\u7A3F</button>
        <button type="submit" class="btn btn-primary">\u53D1\u5E03\u6D3B\u52A8</button>
      </div>
    </form>`;let l=e.querySelector("#activityForm");l.addEventListener("input",()=>Ba(l)),e.querySelector("#draftClear").addEventListener("click",()=>{localStorage.removeItem(vt),v("\u8349\u7A3F\u5DF2\u6E05\u7A7A"),Rt(e,a)}),l.addEventListener("submit",async c=>{c.preventDefault(),Ba(l);let r=Object.fromEntries(new FormData(l).entries());if(r.end_at&&r.start_at&&r.end_at<=r.start_at)return v("\u7ED3\u675F\u65F6\u95F4\u5FC5\u987B\u665A\u4E8E\u5F00\u59CB\u65F6\u95F4","error");if(r.signup_deadline&&r.start_at&&r.signup_deadline>r.start_at)return v("\u62A5\u540D\u622A\u6B62\u65F6\u95F4\u4E0D\u80FD\u665A\u4E8E\u5F00\u59CB\u65F6\u95F4","error");if(String(r.title||"").trim().length<2)return v("\u6807\u9898\u81F3\u5C11 2 \u4E2A\u5B57","error");if(String(r.content||"").trim().length<4)return v("\u8BF7\u5199\u4E00\u53E5\u7B80\u77ED\u8BF4\u660E","error");try{let o=await m.post("/buddy/activities",r);localStorage.removeItem(vt),v("\u6D3B\u52A8\u5DF2\u53D1\u5E03","success"),a.navigate(`/life/buddy/activity?id=${o.id}`)}catch(o){v(o.message,"error")}})}async function Le(e,a){let s=Number(a.params.get("id")||0);if(!s)return e.innerHTML=He("\u6D3B\u52A8\u4E0D\u5B58\u5728","\u7F3A\u5C11\u6D3B\u52A8\u7F16\u53F7");let t;try{t=await m.get(`/buddy/activities/${s}`)}catch(c){e.innerHTML=He("\u6D3B\u52A8\u4E0D\u5B58\u5728\u6216\u5DF2\u4E0B\u67B6",c.message);return}function n(c){let r=[];return c.is_owner?(c.effective_status==="recruiting"&&(r.push({label:"\u9080\u8BF7\u540C\u5B66",act:"invite",cls:"btn-primary"}),r.push({label:"\u505C\u6B62\u62DB\u52DF",act:"stop",cls:"btn-ghost"}),r.push({label:"\u53D6\u6D88\u6D3B\u52A8",act:"cancel",cls:"btn-danger"}),r.push({label:"\u7ED3\u675F\u6D3B\u52A8",act:"finish",cls:"btn-ghost"})),r.push({label:"\u7F16\u8F91\u6D3B\u52A8",act:"edit",cls:"btn-ghost"}),r.push({label:"\u67E5\u770B\u7533\u8BF7",act:"applications",cls:"btn-primary"}),r.push({label:"\u5220\u9664\u6D3B\u52A8",act:"delete",cls:"btn-danger"})):c.mine.status==="accepted"?(r.push({label:"\u8FDB\u5165\u804A\u5929",act:"chat",cls:"btn-primary"}),r.push({label:"\u9000\u51FA\u6D3B\u52A8",act:"quit",cls:"btn-ghost"})):c.mine.status==="pending"?(r.push({label:"\u67E5\u770B\u7533\u8BF7",act:"viewApply",cls:"btn-ghost"}),r.push({label:"\u64A4\u56DE\u7533\u8BF7",act:"withdraw",cls:"btn-danger"})):c.can_apply&&r.push({label:"\u7533\u8BF7\u53C2\u52A0",act:"apply",cls:"btn-primary"}),c.is_owner||r.push({label:"\u66F4\u591A",act:"more",cls:"btn-ghost"}),r.map(o=>`<button class="btn ${o.cls}" data-detail-act="${o.act}">${o.label}</button>`).join("")}let d=t.effective_status==="cancelled";e.innerHTML=`<div class="page-head"><div><div class="page-title">\u6D3B\u52A8\u8BE6\u60C5</div><div class="page-sub">${i(t.type)} \xB7 ${i(t.campus)}</div></div>
      <div class="row"><a class="btn btn-ghost btn-sm" href="#/life/buddy/messages?tab=received">\u7533\u8BF7\u4E0E\u6D88\u606F</a><a class="btn btn-ghost btn-sm" href="#/life/buddy">\u8FD4\u56DE\u627E\u6D3B\u52A8</a></div></div>
    ${d?`<div class="activity-alert">\u6D3B\u52A8\u5DF2\u53D6\u6D88\uFF1A${i(t.cancel_reason||"\u53D1\u8D77\u4EBA\u53D6\u6D88\u4E86\u6D3B\u52A8")}</div>`:""}
    <div class="activity-detail card">
      <div class="activity-top">
        <span class="tag tag-blue">${i(t.type)}</span>
        <span class="tag">${i(t.campus)}</span>
        ${It(t)}
        ${t.is_owner?'<span class="tag tag-gold">\u6211\u53D1\u5E03\u7684</span>':""}
      </div>
      <h1 class="activity-detail-title">${i(t.title)}</h1>
      <div class="activity-detail-grid">
        <div><span class="muted">\u65F6\u95F4</span><strong>${i(Ht(t))}</strong></div>
        <div><span class="muted">\u5730\u70B9</span><strong>${i(t.place)}</strong></div>
        <div><span class="muted">\u4EBA\u6570</span><strong>${i(hi(t))}</strong></div>
        <div><span class="muted">\u62A5\u540D\u622A\u6B62</span><strong>${t.signup_deadline?i(String(t.signup_deadline).replace("T"," ")):"\u672A\u8BBE\u7F6E"}</strong></div>
      </div>
      <div class="activity-section"><div class="muted">\u6D3B\u52A8\u8BF4\u660E</div><p>${i(t.content)}</p></div>
      ${t.requirements?`<div class="activity-section"><div class="muted">\u53C2\u4E0E\u8981\u6C42</div><p>${i(t.requirements)}</p></div>`:""}
      <div class="activity-section"><div class="muted">\u53D1\u8D77\u4EBA</div><p>${i(t.owner.emoji)} ${i(t.owner.nickname)} ${t.owner.mbti?`\xB7 ${i(t.owner.mbti)}`:""}</p></div>
      <div class="activity-section"><div class="muted">\u5DF2\u53C2\u52A0\u6210\u5458\uFF08${t.members.length}/${t.capacity}\uFF09</div>
        <div class="activity-members">${t.members.map(c=>`<span class="tag">${i(c.emoji)} ${i(c.nickname)}${c.is_owner?" \xB7 \u53D1\u8D77\u4EBA":""}</span>`).join("")}</div>
      </div>
      ${t.pending?`<div class="muted">\u8FD8\u6709 ${t.pending} \u6761\u7533\u8BF7\u5F85\u53D1\u8D77\u4EBA\u5904\u7406\u3002</div>`:""}
      <div class="activity-actions">${n(t)}</div>
    </div>`;function l(c){Z({title:"\u7F16\u8F91\u6D3B\u52A8",okText:"\u4FDD\u5B58",wide:!0,body:`<div class="grid grid-2">
        <div class="field"><label>\u7C7B\u578B</label><select class="select" name="e_type">${rt.slice(1).map(r=>`<option ${c.type===r?"selected":""}>${r}</option>`).join("")}</select></div>
        <div class="field"><label>\u6807\u9898</label><input class="input" name="e_title" maxlength="40" value="${i(c.title)}"></div>
        <div class="field"><label>\u6821\u533A</label><select class="select" name="e_campus">${["\u6CC9\u5C71\u6821\u533A","\u4E91\u9F99\u6821\u533A","\u594E\u56ED\u6821\u533A","\u6F58\u5B89\u6E56\u6821\u533A"].map(r=>`<option ${c.campus===r?"selected":""}>${r}</option>`).join("")}</select></div>
        <div class="field"><label>\u5730\u70B9</label><input class="input" name="e_place" value="${i(c.place)}"></div>
        <div class="field"><label>\u5F00\u59CB\u65F6\u95F4</label><input class="input" type="datetime-local" name="e_start" value="${i((c.start_at||"").replace(" ","T"))}"></div>
        <div class="field"><label>\u7ED3\u675F\u65F6\u95F4</label><input class="input" type="datetime-local" name="e_end" value="${i((c.end_at||"").replace(" ","T"))}"></div>
        <div class="field"><label>\u603B\u4EBA\u6570\uFF08\u542B\u53D1\u8D77\u4EBA\uFF09</label><input class="input" type="number" name="e_capacity" min="2" max="50" value="${c.capacity}"></div>
        <div class="field"><label>\u62A5\u540D\u622A\u6B62</label><input class="input" type="datetime-local" name="e_deadline" value="${i((c.signup_deadline||"").replace(" ","T"))}"></div>
      </div>
      <div class="field" style="margin-top:10px"><label>\u8BF4\u660E</label><textarea class="textarea" name="e_content">${i(c.content)}</textarea></div>
      <div class="field" style="margin-top:10px"><label>\u53C2\u4E0E\u8981\u6C42</label><input class="input" name="e_requirements" value="${i(c.requirements||"")}"></div>`,onOk:async()=>{let r={action:"edit",type:document.querySelector('[name="e_type"]').value,title:document.querySelector('[name="e_title"]').value,campus:document.querySelector('[name="e_campus"]').value,place:document.querySelector('[name="e_place"]').value,start_at:document.querySelector('[name="e_start"]').value,end_at:document.querySelector('[name="e_end"]').value,capacity:document.querySelector('[name="e_capacity"]').value,signup_deadline:document.querySelector('[name="e_deadline"]').value,content:document.querySelector('[name="e_content"]').value,requirements:document.querySelector('[name="e_requirements"]').value};await m.patch(`/buddy/activities/${c.id}`,r),v("\u6D3B\u52A8\u5DF2\u66F4\u65B0","success"),document.getElementById("modalRoot").innerHTML="",Le(e,a)}})}e.querySelectorAll("[data-detail-act]").forEach(c=>{c.addEventListener("click",async()=>{let r=c.getAttribute("data-detail-act");try{if(r==="apply")Nt(t,()=>Le(e,a));else if(r==="withdraw"){if(!confirm("\u64A4\u56DE\u8FD9\u6B21\u7533\u8BF7\uFF1F"))return;await m.post(`/buddy/applications/${t.mine.application_id}/withdraw`),v("\u5DF2\u64A4\u56DE\u7533\u8BF7","success"),Le(e,a)}else if(r==="quit"){if(!confirm("\u9000\u51FA\u6D3B\u52A8\uFF1F\u540D\u989D\u4F1A\u91CA\u653E\u7ED9\u5176\u4ED6\u540C\u5B66\u3002"))return;await m.post(`/buddy/applications/${t.mine.application_id}/quit`),v("\u5DF2\u9000\u51FA\u6D3B\u52A8","success"),Le(e,a)}else if(r==="chat")a.navigate(`/life/buddy/messages?chat=${t.mine.application_id}`);else if(r==="more")Z({title:"\u66F4\u591A\u64CD\u4F5C",hideOk:!0,cancelText:"\u5173\u95ED",body:`<button class="btn btn-danger" id="reportActivity" style="width:100%">\u4E3E\u62A5\u8FD9\u4E2A\u6D3B\u52A8</button>
              <div class="muted" style="margin-top:8px">\u4E3E\u62A5\u540E\u6D3B\u52A8\u4F1A\u4E0B\u67B6\u5E76\u7B49\u5F85\u7BA1\u7406\u5458\u590D\u6838\u3002</div>`}),document.getElementById("reportActivity").addEventListener("click",async()=>{confirm("\u786E\u8BA4\u4E3E\u62A5\u8FD9\u4E2A\u6D3B\u52A8\uFF1F")&&(await m.post(`/buddy/posts/${t.id}/report`,{}),v("\u5DF2\u63D0\u4EA4\u4E3E\u62A5\uFF0C\u6D3B\u52A8\u5DF2\u4E0B\u67B6\u5F85\u590D\u6838","success"),document.getElementById("modalRoot").innerHTML="",a.navigate("/life/buddy"))});else if(r==="invite"){let h=(await m.get("/buddy/nearby")||[]).filter(_=>_.user_id!==1);Z({title:"\u9080\u8BF7\u540C\u5B66\u53C2\u52A0",hideOk:!0,cancelText:"\u5173\u95ED",wide:!0,body:h.length?`<div class="invite-list">${h.map(_=>`<div class="invite-row">
                      <span class="draw-emoji">${i(_.profile&&_.profile.animal_emoji||"\u{1F43E}")}</span>
                      <div><strong>${i(_.profile&&_.profile.nickname||"\u5E08\u5927\u540C\u5B66")}</strong>
                        <div class="muted">${i(_.profile&&_.profile.college||"")} \xB7 ${i(_.profile&&_.profile.active_time||"")}</div>
                      </div>
                      <button class="btn btn-primary btn-sm" data-invite-user="${_.user_id}">\u9080\u8BF7</button>
                    </div>`).join("")}</div><div class="muted" style="margin-top:10px">\u9080\u8BF7\u4F1A\u8FDB\u5165\u5BF9\u65B9\u7684\u300C\u7533\u8BF7\u4E0E\u6D88\u606F\u300D\uFF0C\u5BF9\u65B9\u63A5\u53D7\u540E\u5373\u53EF\u804A\u5929\u3002</div>`:'<div class="empty"><strong>\u6682\u65F6\u6CA1\u6709\u53EF\u9080\u8BF7\u7684\u540C\u5B66</strong>\u5BF9\u65B9\u9700\u8981\u516C\u5F00\u642D\u5B50\u6863\u6848</div>'}),document.querySelectorAll("[data-invite-user]").forEach(_=>{_.addEventListener("click",async()=>{try{await m.post(`/buddy/activities/${t.id}/invite`,{user_id:Number(_.getAttribute("data-invite-user"))}),v("\u9080\u8BF7\u5DF2\u53D1\u9001\uFF0C\u7B49\u5F85\u5BF9\u65B9\u56DE\u5E94","success"),_.disabled=!0,_.textContent="\u5DF2\u9080\u8BF7"}catch(E){v(E.message,"error")}})})}else if(r==="applications")a.navigate("/life/buddy/messages?tab=received");else if(r==="viewApply")Z({title:"\u7533\u8BF7\u72B6\u6001",hideOk:!0,cancelText:"\u5173\u95ED",body:`<div class="draft-card"><div class="card-title">${i(t.title)}</div>
              <div class="small">\u5F53\u524D\u72B6\u6001\uFF1A${i(t.mine.status_label||"\u5F85\u5904\u7406")}</div>
              <div class="muted" style="margin-top:6px">\u53D1\u8D77\u4EBA\u5904\u7406\u540E\u4F1A\u5728\u8FD9\u91CC\u548C\u300C\u7533\u8BF7\u4E0E\u6D88\u606F\u300D\u540C\u6B65\u3002</div></div>`});else if(r==="stop"){if(!confirm("\u505C\u6B62\u62DB\u52DF\uFF1F\u5DF2\u901A\u8FC7\u6210\u5458\u4FDD\u7559\uFF0C\u4F46\u4E0D\u518D\u63A5\u6536\u65B0\u7533\u8BF7\u3002"))return;await m.patch(`/buddy/activities/${t.id}`,{action:"stop"}),v("\u5DF2\u505C\u6B62\u62DB\u52DF","success"),Le(e,a)}else if(r==="finish"){if(!confirm("\u7ED3\u675F\u6D3B\u52A8\uFF1F\u6D3B\u52A8\u4F1A\u8FDB\u5165\u5386\u53F2\u8BB0\u5F55\u3002"))return;await m.patch(`/buddy/activities/${t.id}`,{action:"finish"}),v("\u6D3B\u52A8\u5DF2\u7ED3\u675F","success"),Le(e,a)}else if(r==="cancel")Z({title:"\u53D6\u6D88\u6D3B\u52A8",okText:"\u786E\u8BA4\u53D6\u6D88",body:'<div class="field"><label>\u53D6\u6D88\u539F\u56E0\uFF08\u4F1A\u901A\u77E5\u6240\u6709\u6210\u5458\uFF09</label><textarea class="textarea" id="cancelReason" placeholder="\u4F8B\u5982\uFF1A\u573A\u5730\u4E34\u65F6\u8C03\u6574"></textarea></div>',onOk:async()=>{let o=document.getElementById("cancelReason").value.trim();await m.patch(`/buddy/activities/${t.id}`,{action:"cancel",reason:o}),v("\u6D3B\u52A8\u5DF2\u53D6\u6D88\uFF0C\u6210\u5458\u4F1A\u6536\u5230\u901A\u77E5","success"),document.getElementById("modalRoot").innerHTML="",Le(e,a)}});else if(r==="edit")l(t);else if(r==="delete"){if(!confirm("\u5220\u9664\u6D3B\u52A8\uFF1F\u76F8\u5173\u7533\u8BF7\u548C\u804A\u5929\u4F1A\u4E00\u8D77\u5220\u9664\uFF0C\u4E0D\u53EF\u6062\u590D\u3002"))return;await m.del(`/buddy/activities/${t.id}`),v("\u6D3B\u52A8\u5DF2\u5220\u9664","success"),a.navigate("/life/buddy/mine")}}catch(o){v(o.message,"error")}})})}function hi(e){return e.effective_status==="cancelled"?`\u5DF2\u53D6\u6D88 \xB7 \u539F\u5B9A ${e.capacity} \u4EBA`:e.remaining<=0?`\u5DF2\u53C2\u52A0 ${e.taken}/${e.capacity} \u4EBA \xB7 \u5DF2\u6EE1\u5458`:`\u5DF2\u53C2\u52A0 ${e.taken}/${e.capacity} \u4EBA\uFF0C\u8FD8\u7F3A ${e.remaining} \u4EBA`}ve();var $i={pending:["badge-pending","\u5F85\u5904\u7406"],accepted:["badge-open","\u5DF2\u901A\u8FC7"],rejected:["badge-closed","\u672A\u901A\u8FC7"],withdrawn:["badge-occupied","\u5DF2\u64A4\u56DE"]};function Ft(e,a,s){return`<div class="buddy-nav">
    <div class="buddy-nav-tabs">
      ${[["#/life/buddy","\u627E\u6D3B\u52A8","activity",0],["#/life/buddy/mine","\u6211\u7684\u6D3B\u52A8","mine",0],["#/life/buddy/messages","\u7533\u8BF7\u4E0E\u6D88\u606F","messages",a+s]].map(([n,d,l,c])=>`<a class="buddy-nav-tab ${e===l?"on":""}" href="${n}">${d}${c?`<span class="buddy-dot">${c}</span>`:""}</a>`).join("")}
    </div>
    <div class="buddy-nav-actions">
      <a class="btn btn-ghost btn-sm" href="#/life/buddy?tab=profile">\u6211\u7684\u642D\u5B50\u6863\u6848</a>
      <a class="btn btn-ghost btn-sm" href="#/life/buddy?tab=test">\u8DA3\u5473\u6D4B\u8BD5</a>
      <a class="btn btn-primary btn-sm" href="#/life/buddy/new">\uFF0B \u53D1\u5E03\u6D3B\u52A8</a>
    </div>
  </div>`}function Da(e,a){let[s,t]=$i[e.status]||["badge-occupied",e.status],n=e.direction==="received_invite"||e.direction==="sent_invite",d=n?"\u9080\u8BF7":"\u7533\u8BF7",l=a==="received",c=l&&e.status==="pending";return`<div class="apply-row card">
    <div class="spread">
      <div><strong>${i(e.post_title)}</strong>
        <div class="muted">${l?n?"\u9080\u8BF7\u4F60\u53C2\u52A0":"\u7533\u8BF7\u4EBA":n?"\u4F60\u9080\u8BF7":"\u53D1\u8D77\u4EBA"}\uFF1A${i(e.peer_emoji)} ${i(e.peer_nickname)}${e.peer_mbti?` \xB7 ${i(e.peer_mbti)}`:""}</div>
      </div>
      <div class="row"><span class="tag ${n?"tag-gold":"tag-blue"}">${d}</span><span class="badge ${s}">${i(e.status_label||t)}</span></div>
    </div>
    <div class="apply-msg">${i(e.message||"\uFF08\u6CA1\u6709\u7559\u8A00\uFF09")}</div>
    <div class="row" style="margin-top:8px">
      ${c?`<button class="btn btn-primary btn-sm" data-accept="${e.id}">${n?"\u63A5\u53D7\u9080\u8BF7":"\u901A\u8FC7"}</button>
           <button class="btn btn-ghost btn-sm" data-reject="${e.id}">${n?"\u5A49\u62D2":"\u6682\u4E0D\u901A\u8FC7"}</button>`:""}
      ${!l&&e.status==="accepted"?`<button class="btn btn-primary btn-sm" data-chat="${e.id}">\u8FDB\u5165\u804A\u5929</button>`:""}
      ${!l&&e.status==="pending"&&!n?`<button class="btn btn-danger btn-sm" data-withdraw="${e.id}">\u64A4\u56DE\u7533\u8BF7</button>`:""}
      ${!l&&e.status==="accepted"?`<button class="btn btn-ghost btn-sm" data-quit="${e.id}">\u9000\u51FA\u6D3B\u52A8</button>`:""}
      <a class="btn btn-ghost btn-sm" href="#/life/buddy/activity?id=${e.post_id}">\u67E5\u770B\u6D3B\u52A8</a>
    </div>
  </div>`}async function Pa(e,a){let s=a.params,t=Number(s.get("chat")||0),n=t?"chat":s.get("tab")||"received",d={received:[],sent:[]},l=[],c=null;e.innerHTML=`${Ft("messages",0,0)}
    <div class="page-head"><div><div class="page-sub">\u5904\u7406\u6536\u5230\u7684\u7533\u8BF7\u3001\u8DDF\u8E2A\u6211\u53D1\u51FA\u7684\u7533\u8BF7\uFF0C\u5E76\u5728\u901A\u8FC7\u540E\u8FDB\u5165\u7AD9\u5185\u804A\u5929\u3002</div></div></div>
    <div class="tabs buddy-subtabs">
      <button class="tab ${n==="received"?"active":""}" data-msg-tab="received">\u5F85\u6211\u5904\u7406</button>
      <button class="tab ${n==="sent"?"active":""}" data-msg-tab="sent">\u6211\u53D1\u51FA\u7684</button>
      <button class="tab ${n==="chat"?"active":""}" data-msg-tab="chat">\u804A\u5929</button>
    </div>
    <div id="msgBox" class="buddy-msg-layout"></div>`;let r=e.querySelector("#msgBox");async function o(){let[f,M]=await Promise.all([m.get("/buddy/activity-applications"),m.get("/buddy/chats")]);d=f,l=M||[];let q=(d.received||[]).length,U=l.reduce((u,p)=>u+(p.unread||0),0);e.querySelector(".buddy-nav").outerHTML=Ft("messages",q,U),h()}async function h(){if(c&&(clearInterval(c),c=null),n==="chat"){r.className="buddy-msg-layout",r.innerHTML=`<div class="buddy-chat-list card">
        <div class="card-title">\u804A\u5929</div>
        ${l.length?l.map(q=>`<button class="buddy-chat-item ${t===q.application_id?"active":""}" data-open-chat="${q.application_id}">
                  <span class="buddy-chat-avatar">${i(q.peer_emoji)}</span>
                  <span class="buddy-chat-text"><strong>${i(q.peer_nickname)}</strong><em>${i(q.post_title)}</em><span>${i(q.last_message||"\u5F00\u59CB\u804A\u5929\u5427")}</span></span>
                  ${q.unread?`<span class="buddy-dot">${q.unread}</span>`:""}
                </button>`).join(""):'<div class="muted" style="padding:12px">\u8FD8\u6CA1\u6709\u5DF2\u5EFA\u7ACB\u7684\u804A\u5929\u3002\u7533\u8BF7\u901A\u8FC7\u540E\u4F1A\u51FA\u73B0\u5728\u8FD9\u91CC\u3002</div>'}
      </div>
      <div id="chatPanel" class="buddy-chat-panel">${t?'<div class="muted">\u52A0\u8F7D\u804A\u5929\u2026</div>':'<div class="empty"><strong>\u9009\u62E9\u4E00\u4E2A\u804A\u5929</strong>\u7533\u8BF7\u901A\u8FC7\u540E\u5373\u53EF\u5728\u8FD9\u91CC\u8054\u7CFB\u642D\u5B50</div>'}</div>`,r.querySelectorAll("[data-open-chat]").forEach(q=>{q.addEventListener("click",()=>k(Number(q.getAttribute("data-open-chat"))))}),t&&await k(t);return}r.className="buddy-msg-single";let f=d.received||[],M=d.sent||[];if(n==="received"){r.innerHTML=f.length?f.map(q=>Da(q,"received")).join(""):'<div class="empty"><strong>\u6CA1\u6709\u5F85\u5904\u7406\u7684\u7533\u8BF7</strong>\u540C\u5B66\u7533\u8BF7\u4F60\u7684\u6D3B\u52A8\u540E\uFF0C\u4F1A\u51FA\u73B0\u5728\u8FD9\u91CC</div>',_();return}r.innerHTML=M.length?M.map(q=>Da(q,"sent")).join(""):'<div class="empty"><strong>\u8FD8\u6CA1\u6709\u53D1\u51FA\u7533\u8BF7</strong>\u53BB\u300C\u627E\u6D3B\u52A8\u300D\u7533\u8BF7\u4E00\u4E2A\u611F\u5174\u8DA3\u7684\u6D3B\u52A8</div>',_()}function _(){r.querySelectorAll("[data-accept]").forEach(f=>f.addEventListener("click",async()=>{try{await m.post(`/buddy/applications/${f.getAttribute("data-accept")}/accept`),v("\u5DF2\u901A\u8FC7\u7533\u8BF7\uFF0C\u53EF\u4EE5\u8FDB\u5165\u804A\u5929\u4E86","success"),await o()}catch(M){v(M.message,"error")}})),r.querySelectorAll("[data-reject]").forEach(f=>f.addEventListener("click",async()=>{try{await m.post(`/buddy/applications/${f.getAttribute("data-reject")}/reject`),v("\u5DF2\u6807\u8BB0\u4E3A\u672A\u901A\u8FC7","success"),await o()}catch(M){v(M.message,"error")}})),r.querySelectorAll("[data-withdraw]").forEach(f=>f.addEventListener("click",async()=>{try{await m.post(`/buddy/applications/${f.getAttribute("data-withdraw")}/withdraw`),v("\u5DF2\u64A4\u56DE\u7533\u8BF7","success"),await o()}catch(M){v(M.message,"error")}})),r.querySelectorAll("[data-quit]").forEach(f=>f.addEventListener("click",async()=>{if(confirm("\u9000\u51FA\u6D3B\u52A8\uFF1F\u540D\u989D\u4F1A\u91CA\u653E\u7ED9\u5176\u4ED6\u540C\u5B66\u3002"))try{await m.post(`/buddy/applications/${f.getAttribute("data-quit")}/quit`),v("\u5DF2\u9000\u51FA\u6D3B\u52A8","success"),await o()}catch(M){v(M.message,"error")}})),r.querySelectorAll("[data-chat]").forEach(f=>f.addEventListener("click",()=>E(Number(f.getAttribute("data-chat")))))}function E(f){n="chat",t=f,e.querySelectorAll("[data-msg-tab]").forEach(M=>M.classList.toggle("active",M.getAttribute("data-msg-tab")==="chat")),h()}async function k(f){t=f,r.querySelectorAll(".buddy-chat-item").forEach(q=>q.classList.toggle("active",Number(q.getAttribute("data-open-chat"))===f));let M=r.querySelector("#chatPanel");if(M){M.innerHTML='<div class="muted">\u52A0\u8F7D\u804A\u5929\u2026</div>';try{let q=await m.get(`/buddy/chat/${f}`);M.innerHTML=`<div class="chat-thread-head">
          <div><strong>${i(q.peer.emoji)} ${i(q.peer.nickname)}</strong><div class="muted">${i(q.peer.mbti||"")}</div></div>
          <span class="tag tag-blue">\u7AD9\u5185\u804A\u5929</span>
        </div>
        <div class="chat-thread-body" id="threadBody">
          ${q.messages.length?q.messages.map(y=>`<div class="thread-msg ${y.from_me?"me":"peer"}"><div class="thread-bubble">${i(y.content)}</div><div class="thread-time">${i((y.created_at||"").slice(11,16))}</div></div>`).join(""):'<div class="empty"><strong>\u8FD8\u6CA1\u6709\u6D88\u606F</strong>\u6253\u4E2A\u62DB\u547C\u5427</div>'}
        </div>
        <div class="chat-thread-input">
          <input class="input" id="threadInput" placeholder="\u8F93\u5165\u6D88\u606F\uFF0CEnter \u53D1\u9001">
          <button class="btn btn-primary" id="threadSend">\u53D1\u9001</button>
        </div>`;let U=y=>y.length?y.map(g=>`<div class="thread-msg ${g.from_me?"me":"peer"}"><div class="thread-bubble">${i(g.content)}</div><div class="thread-time">${i((g.created_at||"").slice(11,16))}</div></div>`).join(""):'<div class="empty"><strong>\u8FD8\u6CA1\u6709\u6D88\u606F</strong>\u6253\u4E2A\u62DB\u547C\u5427</div>',u=M.querySelector("#threadBody");u.scrollTop=u.scrollHeight,await m.post(`/buddy/chat/${f}/read`).catch(()=>{});let p=l.find(y=>y.application_id===f);if(p&&p.unread){p.unread=0;let y=(d.received||[]).length,g=l.reduce((w,x)=>w+(x.unread||0),0),L=e.querySelector(".buddy-nav");L&&(L.outerHTML=Ft("messages",y,g))}let b=M.querySelector("#threadInput"),S=async()=>{let y=b.value.trim();if(y){b.value="";try{await m.post(`/buddy/chat/${f}`,{content:y}),await k(f)}catch(g){v(g.message,"error")}}};M.querySelector("#threadSend").addEventListener("click",S),b.addEventListener("keydown",y=>{y.key==="Enter"&&!y.shiftKey&&(y.preventDefault(),S())}),c&&clearInterval(c),c=setInterval(async()=>{let y=await m.get(`/buddy/chat/${f}`).catch(()=>null);if(!y)return;let g=M.querySelector("#threadBody");if(!g){clearInterval(c),c=null;return}g.innerHTML=U(y.messages||[]),g.scrollTop=g.scrollHeight,await m.post(`/buddy/chat/${f}/read`).catch(()=>{})},5e3)}catch(q){M.innerHTML=`<div class="empty"><strong>\u804A\u5929\u52A0\u8F7D\u5931\u8D25</strong>${i(q.message)}</div>`}}}e.querySelectorAll("[data-msg-tab]").forEach(f=>{f.addEventListener("click",()=>{n=f.getAttribute("data-msg-tab"),e.querySelectorAll("[data-msg-tab]").forEach(M=>M.classList.toggle("active",M===f)),n!=="chat"&&(t=0),h()})}),await o()}ve();var wi=["\u6570\u7801","\u670D\u9970","\u98DF\u54C1","\u65E5\u7528\u54C1","\u5B66\u4E60\u7528\u54C1","\u5176\u4ED6"],Fa={new:"\u5168\u65B0",used:"\u4E8C\u624B",refurb:"\u7FFB\u65B0"};var ye=null,mt=new Map;async function Oa(e,a){let s="\u6570\u7801",t={},n="";e.innerHTML=`
    <div class="page-head"><div><div class="page-title">\u53D1\u8D77\u8D2D\u4E70\u8BA1\u5212</div>
      <div class="page-sub">\u5148\u786E\u8BA4\u5546\u54C1\uFF0C\u518D\u8865\u5145\u9884\u7B97\u4E0E\u7528\u9014\u3002</div></div>
      <a class="btn btn-ghost btn-sm" href="#/life/deal">\u2039 \u8FD4\u56DE\u7701\u4E00\u7701</a></div>

    <div class="card deal-form-card">
      <div class="spread"><div class="card-title">\u2460 \u5546\u54C1\u4FE1\u606F</div><button type="button" class="btn btn-ghost btn-sm" id="dDemo">\u6848\u4F8B\u5BFC\u5165</button></div>
      <div class="deal-grid2" style="margin-top:10px">
        <div class="field"><label>\u5546\u54C1\u540D\u79F0 *</label><input class="input" id="dName" placeholder="\u4F8B\u5982\uFF1A\u7D22\u5C3C\u65E0\u7EBF\u84DD\u7259\u5934\u6234\u5F0F\u8033\u673A\u3002\uFF08\u7ED9\u51FA\u7684\u5546\u54C1\u540D\u79F0\u8D8A\u5177\u4F53\u8D8A\u597D\uFF09"></div>
        <div class="field"><label>\u7C7B\u522B</label><select class="select" id="dCat">${wi.map(l=>`<option ${l===s?"selected":""}>${l}</option>`).join("")}</select></div>
        <div class="field"><label>\u65B0\u65E7\u72B6\u6001</label><select class="select" id="dCond">${Object.entries(Fa).map(([l,c])=>`<option value="${l}">${c}</option>`).join("")}</select></div>
        <div class="field"><label>\u8D2D\u4E70\u5E73\u53F0</label><input class="input" id="dPlatform" placeholder="\u4F8B\u5982\uFF1A\u4EAC\u4E1C"></div>
        <div class="field"><label>\u6570\u91CF</label><input class="input" id="dQty" type="number" min="1" value="1"></div>
        <div class="field"><label>\u5173\u952E\u89C4\u683C\uFF08\u53EF\u9009\uFF09</label><input class="input" data-spec="spec" placeholder="\u5F85\u786E\u8BA4"></div>
        <div class="field"><label>\u4EF7\u683C\uFF08\u5143\uFF09</label><input class="input" id="dPrice" type="number" min="0" step="0.01" placeholder="0.00"></div>
        <div class="field"><label>\u5546\u54C1\u94FE\u63A5\uFF08\u53EF\u9009\uFF09</label><input class="input" id="dUrl" placeholder="https://\u2026"></div>
        <div class="field"><label>\u5546\u54C1\u56FE\u7247\u9644\u4EF6\uFF08\u53EF\u9009\uFF09</label><input class="input" id="dImage" type="file" accept="image/*"></div>
        <div class="field"><label>\u5907\u6CE8\uFF08\u53EF\u9009\uFF09</label><input class="input" id="dNote" placeholder="\u8865\u5145\u8BF4\u660E\uFF0C\u4F8B\u5982\u989C\u8272\u3001\u7248\u672C\u6216\u6CE8\u610F\u4E8B\u9879"></div>
      </div>
      <div class="muted" style="margin-top:8px;font-size:11px">\u65E0\u6CD5\u786E\u8BA4\u7684\u5B57\u6BB5\u53EF\u7559\u7A7A\uFF0C\u4FDD\u5B58\u540E\u663E\u793A\u300C\u5F85\u786E\u8BA4\u300D\u3002</div>
    </div>

    <div class="card deal-form-card" style="margin-top:16px">
      <div class="card-title">\u2461 \u8D2D\u4E70\u8BA1\u5212</div>
      <div class="deal-grid2" style="margin-top:10px">
        <div class="field"><label>\u9884\u8BA1\u4EF7\u683C\uFF08\u5143\uFF09</label><input class="input" id="dPlanPrice" type="number" min="0" step="0.01"></div>
        <div class="field"><label>\u9884\u7B97\u4E0A\u9650\uFF08\u5143\uFF09</label><input class="input" id="dBudget" type="number" min="0" step="0.01"></div>
        <div class="field "><label>\u4F7F\u7528\u573A\u666F</label><input class="input" id="dScene" placeholder="\u63CF\u8FF0\u8FD9\u4EF6\u5546\u54C1\u7684\u4F7F\u7528\u573A\u666F"></div>
        <div class="field"><label>\u9700\u6C42\u7D27\u6025\u7A0B\u5EA6</label><select class="select" id="dUrgency">
          <option value="urgent">\u7D27\u6025\uFF08\u73B0\u5728\u5C31\u8981\uFF09</option><option value="soon">\u8FD1\u671F\u9700\u8981</option>
          <option value="normal" selected>\u4E00\u822C</option><option value="can_wait">\u53EF\u4EE5\u7B49</option></select></div>
        <div class="field"><label>\u9884\u8BA1\u4F7F\u7528\u9891\u7387</label><select class="select" id="dFreq">
          <option value="daily" selected>\u6BCF\u5929</option><option value="weekly">\u6BCF\u5468</option>
          <option value="monthly">\u6BCF\u6708</option><option value="seldom">\u5F88\u5C11</option></select></div>
        <div class="field"><label>\u53EF\u63A5\u53D7\u7B49\u5F85\u65F6\u95F4\uFF08\u5929\uFF09</label><input class="input" id="dWait" type="number" min="0" value="7"></div>
      </div>
      <div class="field" style="margin-top:10px"><label>\u8D2D\u4E70\u7406\u7531</label><textarea class="input" id="dReason" rows="2" placeholder="\u4E3A\u4EC0\u4E48\u60F3\u4E70\uFF1F\u4E0D\u7528\u4E70\u4F1A\u600E\u6837\uFF1F"></textarea></div>
      <div class="field" style="margin-top:10px"><label>\u5DF2\u6709\u7C7B\u4F3C\u7269\u54C1</label><input class="input" id="dExisting" placeholder="\u4F8B\u5982\uFF1A\u5DF2\u6709\u4E00\u526F\u6709\u7EBF\u8033\u673A"></div>
      <div class="field" style="margin-top:10px"><label>\u66FF\u4EE3\u65B9\u6848</label><input class="input" id="dAlt" placeholder="\u4F8B\u5982\uFF1A\u5148\u501F\u7528\u5BA4\u53CB\u7684\u3001\u4E70\u4E8C\u624B\u3001\u7528\u5B66\u6821\u673A\u623F"></div>

      <div class="deal-grid2" style="margin-top:10px">
        <div class="field"><label>\u53EF\u89C1\u8303\u56F4</label><select class="select" id="dVis">
          <option value="private" selected>\u4EC5\u81EA\u5DF1\u67E5\u770B</option><option value="public">\u6821\u56ED\u516C\u5F00\u8BA8\u8BBA</option>
        </select></div>
        <div class="field"><label>\u8BA8\u8BBA\u7ED3\u675F\u65B9\u5F0F</label><select class="select" id="dEndMode">
          <option value="target_votes" selected>\u6309\u6709\u6548\u6295\u7968\u4EBA\u6570</option><option value="deadline">\u6309\u622A\u6B62\u65F6\u95F4</option></select></div>
        <div class="field" id="dVoteField"><label>\u76EE\u6807\u6709\u6548\u6295\u7968\u4EBA\u6570</label><input class="input" id="dTarget" type="number" min="1" value="5"></div>
        <div class="field" id="dDeadlineField" hidden><label>\u622A\u6B62\u65F6\u95F4</label><input class="input" id="dDeadline" type="datetime-local"></div>
      </div>
      <div class="row" style="margin-top:16px;justify-content:flex-end">
        <button class="btn btn-ghost" id="dCancel">\u53D6\u6D88</button>
        <button class="btn btn-primary" id="dSubmit">\u521B\u5EFA\u8BA1\u5212\u8349\u7A3F</button>
      </div>
    </div>`;let d=l=>e.querySelector(l);d("#dDemo").addEventListener("click",()=>{d("#dName").value="\u7D22\u5C3C WH-1000XM5 \u5934\u6234\u5F0F\u964D\u566A\u8033\u673A",d("#dCat").value="\u6570\u7801",s="\u6570\u7801",t={},d("#dCond").value="new",d("#dPlatform").value="\u4EAC\u4E1C",d("#dQty").value="1";let l=e.querySelector('[data-spec="spec"]');l&&(l.value="\u9ED1\u8272 / \u84DD\u7259 5.2 / \u4E3B\u52A8\u964D\u566A"),d("#dPrice").value="2299",d("#dUrl").value="https://example.com/sony-wh1000xm5",d("#dNote").value="\u901A\u52E4\u5730\u94C1\u4F7F\u7528\uFF0C\u91CD\u70B9\u5173\u6CE8\u964D\u566A\u4E0E\u7EED\u822A",d("#dPlanPrice").value="2299",d("#dBudget").value="2500",d("#dScene").value="\u6BCF\u65E5\u901A\u52E4\u5730\u94C1\u542C\u6B4C\u3001\u56FE\u4E66\u9986\u4E13\u6CE8\u65F6\u964D\u566A",d("#dUrgency").value="soon",d("#dFreq").value="daily",d("#dWait").value="7",d("#dReason").value="\u73B0\u6709\u8033\u673A\u964D\u566A\u5DEE\uFF0C\u901A\u52E4\u566A\u97F3\u5927\u5F71\u54CD\u4F11\u606F\u4E0E\u5B66\u4E60\u6548\u7387",d("#dExisting").value="\u5DF2\u6709\u4E00\u526F\u6709\u7EBF\u5165\u8033\u8033\u673A",d("#dAlt").value="\u5148\u4E70\u4E8C\u624B\uFF0C\u6216\u7B49\u5230\u53CC\u5341\u4E00\u518D\u4E70",v("\u5DF2\u5BFC\u5165\u6848\u4F8B\uFF0C\u53EF\u76F4\u63A5\u4FEE\u6539\u540E\u63D0\u4EA4","success")}),d("#dCat").addEventListener("change",l=>{s=l.target.value,t={}}),d("#dImage").addEventListener("change",l=>{let c=l.target.files[0];if(!c)return;if(!c.type.startsWith("image/"))return v("\u8BF7\u9009\u62E9\u56FE\u7247\u6587\u4EF6","error");if(c.size>1.5*1024*1024)return v("\u56FE\u7247\u8BF7\u5C0F\u4E8E 1.5MB","error");let r=new FileReader;r.onload=()=>{n=String(r.result||""),v("\u56FE\u7247\u5DF2\u9644\u52A0\uFF08\u968F\u8BA1\u5212\u4FDD\u5B58\uFF09")},r.readAsDataURL(c)}),d("#dEndMode").addEventListener("change",l=>{d("#dVoteField").hidden=l.target.value!=="target_votes",d("#dDeadlineField").hidden=l.target.value!=="deadline"}),d("#dCancel").addEventListener("click",()=>location.hash="#/life/deal"),d("#dSubmit").addEventListener("click",async()=>{let l=d("#dName").value.trim();if(!l)return v("\u8BF7\u586B\u5199\u5546\u54C1\u540D\u79F0","error");e.querySelectorAll("[data-spec]").forEach(r=>{r.value.trim()&&(t[r.getAttribute("data-spec")]=r.value.trim())});try{let r=await m.post("/deal/products",{name:l,category:s,specs:t,qty:Number(d("#dQty").value||1),condition:d("#dCond").value,platform:d("#dPlatform").value.trim(),url:d("#dUrl").value.trim(),image:n,price:Number(d("#dPrice").value||0),source:"manual",note:d("#dNote").value.trim(),confirmed:!0}),o=await m.post("/deal/plans",{product_id:r.id,title:l,budget:Number(d("#dBudget").value||0),price:Number(d("#dPlanPrice").value||d("#dPrice").value||0),scene:d("#dScene").value.trim(),reason:d("#dReason").value.trim(),urgency:d("#dUrgency").value,frequency:d("#dFreq").value,existing_items:d("#dExisting").value.trim(),alternative:d("#dAlt").value.trim(),wait_days:Number(d("#dWait").value||0),visibility:d("#dVis").value,end_mode:d("#dEndMode").value,target_votes:Number(d("#dTarget").value||1),deadline:d("#dDeadline").value?String(d("#dDeadline").value).replace("T"," ")+":00":""});v("\u8BA1\u5212\u5DF2\u521B\u5EFA\uFF0C\u8865\u5145\u62A5\u4EF7\u4E0E\u8BC1\u636E\u540E\u5373\u53EF\u53D1\u5E03\u8BA8\u8BBA","success"),location.hash=`#/life/deal/plan?id=${o.id}`}catch(r){v(r.message,"error")}})}async function Ut(e,a){let s=a.params.get("id"),t;try{t=await m.get(`/deal/plans/${s}`)}catch(E){e.innerHTML=`<div class="card"><div class="card-title">\u65E0\u6CD5\u6253\u5F00\u8BA1\u5212</div>
      <div class="card-desc">${i(E.message)}</div>
      <a class="btn btn-ghost btn-sm" href="#/life/deal" style="margin-top:10px">\u2039 \u8FD4\u56DE\u7701\u4E00\u7701</a></div>`;return}ye=t;let n=t.plan,d=t.product||{},c=t.can_edit&&["undecided","cooling"].includes(n.decision_status),r=[["analysis","\u5206\u6790\u5EFA\u8BAE"],["discuss","\u8BA8\u8BBA"],["decide","\u6211\u7684\u51B3\u5B9A"]],o=a.params.get("tab")||"analysis";r.some(([E])=>E===o)||(o="analysis"),e.innerHTML=`
    <div class="page-head"><div>
      <div class="page-title">${i(n.title||d.name||"\u8D2D\u4E70\u8BA1\u5212")}</div>
      <div class="page-sub">${i(d.brand||"")} ${i(d.model||"")} \xB7 ${Fa[d.condition]||"\u72B6\u6001\u5F85\u786E\u8BA4"} \xB7 \u6570\u91CF ${d.qty||1}</div>
    </div><div class="row">
      ${c?'<button class="btn btn-ghost btn-sm" id="dEdit">\u4FEE\u6539</button>':""}
      <a class="btn btn-ghost btn-sm" href="#/life/deal">\u2039 \u8FD4\u56DE\u7701\u4E00\u7701</a>
    </div></div>

    <div class="grid grid-4" style="margin-bottom:12px">
      <div class="stat"><div class="stat-num">\xA5${Se(n.price)}</div><div class="stat-label">\u9884\u8BA1\u4EF7\u683C</div></div>
      <div class="stat"><div class="stat-num">\xA5${Se(n.budget||0)}</div><div class="stat-label">\u9884\u7B97\u4E0A\u9650\uFF08\u79C1\u5BC6\uFF09</div></div>
      <div class="stat"><div class="stat-num">${za(n.discuss_status)}</div><div class="stat-label">\u8BA8\u8BBA\u72B6\u6001</div></div>
      <div class="stat"><div class="stat-num">${zt(n.decision_status)}</div><div class="stat-label">\u4E2A\u4EBA\u51B3\u5B9A</div></div>
    </div>

    <div class="deal-tabs">${r.map(([E,k])=>`<button class="deal-tab ${E===o?"on":""}" data-dtab="${E}">${k}</button>`).join("")}</div>
    <div id="dealBody"></div>`,e.querySelectorAll("[data-dtab]").forEach(E=>E.addEventListener("click",()=>{o=E.dataset.dtab,e.querySelectorAll("[data-dtab]").forEach(k=>k.classList.toggle("on",k===E)),Ot(e,o,t)})),Ot(e,o,t),e.querySelector("#dEdit")?.addEventListener("click",h);function h(){let E=n.deadline?String(n.deadline).replace(" ","T").slice(0,16):"",k=(u,p,b)=>`<option value="${u}" ${u===b?"selected":""}>${p}</option>`,f=n.visibility==="public"?"public":"private",M=[k("private","\u4EC5\u81EA\u5DF1\u67E5\u770B",f),k("public","\u6821\u56ED\u516C\u5F00\u8BA8\u8BBA",f)];Z({title:"\u4FEE\u6539\u8D2D\u4E70\u8BA1\u5212",wide:!0,okText:"\u4FDD\u5B58\u4FEE\u6539",body:`
        <div class="deal-grid2">
          <div class="field"><label>\u8BA1\u5212\u6807\u9898 *</label><input class="input" id="eTitle" value="${i(n.title||d.name||"")}"></div>
          <div class="field"><label>\u9884\u8BA1\u4EF7\u683C\uFF08\u5143\uFF09</label><input class="input" id="ePrice" type="number" min="0" step="0.01" value="${Number(n.price||0)}"></div>
          <div class="field"><label>\u9884\u7B97\u4E0A\u9650\uFF08\u5143\uFF09</label><input class="input" id="eBudget" type="number" min="0" step="0.01" value="${Number(n.budget||0)}"></div>
          <div class="field"><label>\u53EF\u63A5\u53D7\u7B49\u5F85\u65F6\u95F4\uFF08\u5929\uFF09</label><input class="input" id="eWait" type="number" min="0" value="${Number(n.wait_days||0)}"></div>
          <div class="field"><label>\u9700\u6C42\u7D27\u6025\u7A0B\u5EA6</label><select class="select" id="eUrgency">
            ${k("urgent","\u7D27\u6025\uFF08\u73B0\u5728\u5C31\u8981\uFF09",n.urgency)}
            ${k("soon","\u8FD1\u671F\u9700\u8981",n.urgency)}
            ${k("normal","\u4E00\u822C",n.urgency)}
            ${k("can_wait","\u53EF\u4EE5\u7B49",n.urgency)}
          </select></div>
          <div class="field"><label>\u9884\u8BA1\u4F7F\u7528\u9891\u7387</label><select class="select" id="eFreq">
            ${k("daily","\u6BCF\u5929",n.frequency)}
            ${k("weekly","\u6BCF\u5468",n.frequency)}
            ${k("monthly","\u6BCF\u6708",n.frequency)}
            ${k("seldom","\u5F88\u5C11",n.frequency)}
          </select></div>
        </div>
        <div class="field"><label>\u4F7F\u7528\u573A\u666F</label><input class="input" id="eScene" value="${i(n.scene||"")}"></div>
        <div class="field"><label>\u8D2D\u4E70\u7406\u7531</label><textarea class="input" id="eReason" rows="2">${i(n.reason||"")}</textarea></div>
        <div class="deal-grid2">
          <div class="field"><label>\u5DF2\u6709\u7C7B\u4F3C\u7269\u54C1</label><input class="input" id="eExisting" value="${i(n.existing_items||"")}"></div>
          <div class="field"><label>\u66FF\u4EE3\u65B9\u6848</label><input class="input" id="eAlt" value="${i(n.alternative||"")}"></div>
        </div>
        <div class="deal-grid2">
          <div class="field"><label>\u53EF\u89C1\u8303\u56F4</label><select class="select" id="eVis">${M.join("")}</select></div>
          <div class="field"><label>\u8BA8\u8BBA\u7ED3\u675F\u65B9\u5F0F</label><select class="select" id="eEndMode">
            ${k("target_votes","\u6309\u6709\u6548\u6295\u7968\u4EBA\u6570",n.end_mode)}
            ${k("deadline","\u6309\u622A\u6B62\u65F6\u95F4",n.end_mode)}
          </select></div>
          <div class="field" id="eVoteField"><label>\u76EE\u6807\u6709\u6548\u6295\u7968\u4EBA\u6570</label><input class="input" id="eTarget" type="number" min="1" value="${Number(n.target_votes||5)}"></div>
          <div class="field" id="eDeadlineField"><label>\u622A\u6B62\u65F6\u95F4</label><input class="input" id="eDeadline" type="datetime-local" value="${E}"></div>
        </div>`,onOk:async()=>{let u=y=>document.getElementById(y),p=u("eTitle").value.trim();if(!p){v("\u8BF7\u586B\u5199\u8BA1\u5212\u6807\u9898","error");return}let b=u("eEndMode").value,S=u("eDeadline").value?u("eDeadline").value.replace("T"," ")+":00":"";if(b==="deadline"&&!S){v("\u8BF7\u9009\u62E9\u622A\u6B62\u65F6\u95F4","error");return}await m.patch(`/deal/plans/${n.id}`,{title:p,price:Number(u("ePrice").value||0),budget:Number(u("eBudget").value||0),scene:u("eScene").value.trim(),reason:u("eReason").value.trim(),urgency:u("eUrgency").value,frequency:u("eFreq").value,existing_items:u("eExisting").value.trim(),alternative:u("eAlt").value.trim(),wait_days:Number(u("eWait").value||0),visibility:u("eVis").value,end_mode:b,target_votes:Number(u("eTarget").value||1),deadline:S}),mt.clear(),Te(),v("\u8BA1\u5212\u5DF2\u66F4\u65B0\uFF0C\u6B63\u5728\u91CD\u65B0\u67E5\u8BE2\u53C2\u8003\u4EF7\u683C","success"),await Ut(e,a)}});let q=u=>document.getElementById(u),U=()=>{!q("eVoteField")||!q("eDeadlineField")||(q("eVoteField").hidden=q("eEndMode").value!=="target_votes",q("eDeadlineField").hidden=q("eEndMode").value!=="deadline")};q("eEndMode").addEventListener("change",U),U()}async function _(){let E={platform:e.querySelector("#qPlatform")?.value.trim()||"",merchant:e.querySelector("#qMerchant")?.value.trim()||"",spec:e.querySelector("#qSpec")?.value.trim()||"",price:Number(e.querySelector("#qPrice")?.value||0),coupon:Number(e.querySelector("#qCoupon")?.value||0),shipping:Number(e.querySelector("#qShipping")?.value||0),fee:Number(e.querySelector("#qFee")?.value||0),qty:Number(e.querySelector("#qQty")?.value||1),conditions:e.querySelector("#qCond")?.value.trim()||"",cost_complete:e.querySelector("#qCostKnown")?.checked??!0,match_level:e.querySelector("#qMatch")?.value||"exact",stock:e.querySelector("#qStock")?.value||"unknown",url:e.querySelector("#qUrl")?.value.trim()||"",source_key:"manual"};if(!E.price)return v("\u8BF7\u586B\u5199\u6807\u4EF7","error");try{await m.post(`/deal/products/${d.id}/quotes`,E),v("\u62A5\u4EF7\u5DF2\u8BB0\u5F55\uFF0C\u5E76\u5199\u5165\u4EF7\u683C\u5FEB\u7167","success"),t=await m.get(`/deal/plans/${s}`),Ot(e,o,t)}catch(k){v(k.message,"error")}}e.__dealAddQuote=_}function za(e){return`<span class="tag ${e==="discussing"?"tag-blue":e==="ended"?"tag-green":""}">${{draft:"\u8349\u7A3F",discussing:"\u8BA8\u8BBA\u4E2D",ended:"\u5DF2\u7ED3\u675F",cancelled:"\u5DF2\u53D6\u6D88"}[e]||e}</span>`}function zt(e){return`<span class="tag ${e==="cooling"?"tag-warn":e==="purchased"?"tag-green":""}">${{undecided:"\u5C1A\u672A\u51B3\u5B9A",cooling:"\u51B7\u9759\u671F\u4E2D",purchased:"\u5DF2\u8D2D\u4E70",deferred:"\u5DF2\u6682\u7F13",abandoned:"\u5DF2\u653E\u5F03"}[e]||e}</span>`}function Ot(e,a,s){let t=e.querySelector("#dealBody");t&&(a==="discuss"?Je(e,t,s):a==="decide"?Vt(e,t,s):ki(e,t,s))}function ki(e,a,s){let t=s.product||{},n=s.advice;a.innerHTML=`
    <div class="card">
      <div class="spread"><div class="card-title">\u51B3\u7B56\u5EFA\u8BAE</div>
        <span class="tag ${n?"tag-blue":""}">${n?i(n.label):"\u4EC5\u8BA1\u5212\u521B\u5EFA\u8005\u53EF\u67E5\u770B\u5EFA\u8BAE"}</span></div>
      ${n?`<div class="deal-advice">
            ${(n.reasons||[]).map(l=>`<div class="deal-advice-row">\xB7 ${i(l)}</div>`).join("")}
            <div class="muted" style="margin-top:10px;font-size:11.5px">${i(n.disclaimer)}</div>
          </div>`:""}
    </div>

    <div class="card" style="margin-top:16px">
      <div class="spread"><div class="card-title">\u53C2\u8003\u4EF7\u683C</div><span class="tag tag-blue">\u82CF\u5C0F\u5E08</span></div>
      <div class="muted" style="margin-top:4px;font-size:11.5px">\u57FA\u4E8E\u516C\u5F00\u7F51\u9875\u6458\u8981\u4F30\u7B97\uFF0C\u4EF7\u683C\u4E3A\u53C2\u8003\u533A\u95F4\uFF0C\u4EE5\u4E0B\u5355\u9875\u4E3A\u51C6\u3002</div>
      <div id="planAiPrice"><div class="muted" style="margin-top:8px">\u6B63\u5728\u67E5\u8BE2\u2026</div></div>
    </div>`;let d=[t.brand,t.name].filter(Boolean).join(" ")||s.plan.title||"";xi(a,d,t.category||"")}async function xi(e,a,s=""){let t=e.querySelector("#planAiPrice");if(t){if(!a){t.innerHTML='<div class="muted" style="margin-top:8px">\u7F3A\u5C11\u5546\u54C1\u540D\u79F0\uFF0C\u65E0\u6CD5\u67E5\u4EF7\u3002</div>';return}if(mt.has(a)){t.innerHTML=Ra(mt.get(a));return}try{t.innerHTML='<div class="muted" style="margin-top:8px">\u6B63\u5728\u67E5\u8BE2\uFF08\u7EA6 20\u201340 \u79D2\uFF09\u2026</div>';let n=setTimeout(()=>{t.innerHTML='<div class="muted" style="margin-top:8px">\u6B63\u5728\u67E5\u8BE2\uFF0C\u7F51\u7EDC\u8F83\u6162\u65F6\u4F1A\u591A\u7B49\u4E00\u4F1A\u513F\u2026</div>'},12e3),d=await m.post("/deal/ai-price",{product:a,category:s});clearTimeout(n),mt.set(a,d),t.innerHTML=Ra(d)}catch(n){t.innerHTML=`<div class="muted" style="margin-top:8px;color:#c0392b">${i(n.message)}</div>`}}}function Ra(e){let a=t=>{let n=Number(t||0);return n%1===0?String(n):n.toFixed(2)},s=e.low>0||e.high>0?`\xA5${a(e.low)} \u2013 \xA5${a(e.high)}`:"\u6682\u672A\u83B7\u53D6\u5230\u660E\u786E\u533A\u95F4";return`<div class="deal-ai-card">
    <div class="spread"><b>${i(e.product)}</b><span class="tag ${e.searched?"tag-blue":"tag-warn"}">${e.degraded?"\u53C2\u8003\u4EF7":e.searched?"\u5DF2\u627E\u5230\u516C\u5F00\u4FE1\u606F":"\u6682\u65E0\u516C\u5F00\u4FE1\u606F"}</span></div>
    <div class="deal-ai-range">${s}</div>
    <div style="font-size:12.5px">${i(e.summary||"")}</div>
    ${e.recommendation?`<div class="deal-ai-rec">\u63A8\u8350\u65B9\u6848\uFF1A${i(e.recommendation)}</div>`:""}
    ${(e.tips||[]).length?`<ul class="deal-ai-tips">${e.tips.map(t=>`<li>${i(t)}</li>`).join("")}</ul>`:""}
    ${(e.sources||[]).length?`<div class="deal-ai-sources">${e.sources.slice(0,4).map(t=>`<a href="${i(t.url)}" target="_blank" rel="noopener">${i(t.title||t.url)}</a>`).join("")}</div>`:""}
    <div class="muted" style="margin-top:7px;font-size:10.5px">${i(e.note||"")}</div>
  </div>`}async function Je(e,a,s){let t=s.plan,n=s.votes,d=s.can_vote;a.innerHTML=`
    <div class="card">
      <div class="spread"><div class="card-title">\u793E\u533A\u8BA8\u8BBA</div>${za(t.discuss_status)}</div>
      <div class="muted" style="margin-top:4px;font-size:11.5px">\u53EF\u89C1\u8303\u56F4\uFF1A${t.visibility==="private"?"\u4EC5\u81EA\u5DF1":"\u6821\u56ED\u516C\u5F00"} \xB7 \u7ED3\u675F\u65B9\u5F0F\uFF1A${t.end_mode==="target_votes"?`\u6EE1 ${t.target_votes} \u4EBA\u6709\u6548\u6295\u7968`:`\u622A\u6B62 ${i(t.deadline||"\u672A\u8BBE\u7F6E")}`}</div>
      ${t.visibility==="private"?'<div class="empty" style="padding:24px 0"><strong>\u8FD9\u662F\u79C1\u5BC6\u8BA1\u5212</strong><div class="muted">\u4E0D\u53D1\u8D77\u516C\u5F00\u8BA8\u8BBA\u4E5F\u80FD\u67E5\u770B\u4EF7\u683C\u53C2\u8003\u4E0E\u5EFA\u8BAE\u3002\u9700\u8981\u610F\u89C1\u65F6\u53EF\u53D1\u8D77\u6821\u56ED\u516C\u5F00\u8BA8\u8BBA\u3002</div></div>':`<div class="deal-votes">
            ${Object.entries(n.counts).map(([l,c])=>`<div class="deal-vote-opt ${s.my_vote===l?"mine":""}" ${d?`data-vote-choice="${l}"`:""}>
              <b>${c}</b><span>${i(n.labels[l]||l)}</span></div>`).join("")}
          </div>
          <div class="deal-tendency">${i(n.tendency)}</div>
          <div class="muted" style="font-size:11px;margin-top:4px">\u793E\u533A\u610F\u89C1\u503E\u5411\u4EC5\u4F9B\u53C2\u8003\u3002</div>
          ${t.discuss_status==="discussing"&&t.user_id!==void 0,""}`}
      ${s.can_edit&&t.discuss_status==="draft"?'<button class="btn btn-primary btn-sm" id="dPublish" style="margin-top:10px">\u53D1\u8D77\u8BA8\u8BBA</button>':""}
      ${s.can_edit&&t.discuss_status==="discussing"?'<button class="btn btn-ghost btn-sm" id="dSettle" style="margin-top:10px">\u7ED3\u675F\u8BA8\u8BBA\u5E76\u7ED3\u7B97</button>':""}
    </div>`,a.querySelectorAll("[data-vote-choice]").forEach(l=>l.addEventListener("click",async()=>{try{await m.post(`/deal/plans/${t.id}/vote`,{choice:l.dataset.voteChoice}),v("\u5DF2\u8BB0\u5F55\u4F60\u7684\u610F\u89C1","success"),ye=await m.get(`/deal/plans/${t.id}`),Je(e,a,ye)}catch(c){v(c.message,"error")}})),a.querySelector("#dPublish")?.addEventListener("click",async()=>{try{await m.post(`/deal/plans/${t.id}/publish`),v("\u5DF2\u8F6C\u4E3A\u6821\u56ED\u516C\u5F00\u8BA8\u8BBA","success"),ye=await m.get(`/deal/plans/${t.id}`),Je(e,a,ye)}catch(l){v(l.message,"error")}}),a.querySelector("#dSettle")?.addEventListener("click",async()=>{try{let l=await m.post(`/deal/plans/${t.id}/settle`);v(l.already_settled?"\u6B64\u524D\u5DF2\u7ED3\u7B97":"\u5DF2\u7ED3\u7B97\uFF0C\u7981\u6B62\u65B0\u589E\u6295\u7968","success"),ye=await m.get(`/deal/plans/${t.id}`),Je(e,a,ye)}catch(l){v(l.message,"error")}}),a.querySelectorAll("[data-report]").forEach(l=>l.addEventListener("click",async()=>{let c=prompt("\u8BF7\u586B\u5199\u4E3E\u62A5\u539F\u56E0");c&&(await m.post("/deal/reports",{target_type:"comment",target_id:Number(l.dataset.report),reason:c}),v("\u5DF2\u63D0\u4EA4\u4E3E\u62A5","success"))})),a.querySelectorAll("[data-reply]").forEach(l=>l.addEventListener("click",async()=>{let c=prompt("\u56DE\u590D\u5185\u5BB9");c&&(await m.post(`/deal/plans/${t.id}/comments`,{content:c,parent_id:Number(l.dataset.reply)}),ye=await m.get(`/deal/plans/${t.id}`),Je(e,a,ye))}))}async function Vt(e,a,s){let t=s.plan;a.innerHTML=`
    <div class="card">
      <div class="spread"><div class="card-title">\u51B7\u9759\u671F</div>${zt(t.decision_status)}</div>
      <div class="muted" style="margin-top:4px;font-size:11.5px">\u7CFB\u7EDF\u4E0D\u5BF9\u8D2D\u4E70\u8BBE\u7F6E\u5F3A\u5236\u62E6\u622A\uFF1B\u51B7\u9759\u671F\u5185\u53EF\u4EE5\u8865\u5145\u7406\u7531\u3001\u67E5\u770B\u4EF7\u683C\u53D8\u5316\u3001\u6BD4\u8F83\u66FF\u4EE3\u54C1\u3002</div>
      ${t.cool_until?`<div class="deal-cool">\u51B7\u9759\u671F\u81F3\uFF1A${i(t.cool_until)}</div>`:""}
      ${s.can_edit&&t.decision_status!=="purchased"?`<div class="row" style="margin-top:10px">
            ${[24,72,168].map(n=>`<button class="btn btn-ghost btn-sm deal-cool-btn" data-hours="${n}">\u51B7\u9759 ${n>=24?n/24+" \u5929":n+" \u5C0F\u65F6"}</button>`).join("")}
          </div>`:""}
    </div>

    <div class="card" style="margin-top:16px">
      <div class="card-title">\u8BB0\u5F55\u6700\u7EC8\u51B3\u5B9A</div>
      <div class="muted" style="margin-top:4px;font-size:11.5px">\u6295\u7968\u7ED3\u679C\u4E0D\u4F1A\u66FF\u4F60\u505A\u51B3\u5B9A\uFF1B\u8FD9\u91CC\u8BB0\u5F55\u7684\u662F\u4F60\u81EA\u5DF1\u7684\u9009\u62E9\u3002</div>
      ${s.can_edit&&t.decision_status!=="purchased"?`<div class="field" style="margin-top:10px"><label>\u51B3\u5B9A\u7406\u7531</label><textarea class="input" id="dDecideReason" rows="2">${i(t.decide_reason||"")}</textarea></div>
          <div class="row" style="margin-top:10px">
            <button class="btn btn-primary btn-sm deal-decide" data-decision="purchased">\u4E70\u4E86</button>
            <button class="btn btn-ghost btn-sm deal-decide" data-decision="deferred">\u6682\u7F13</button>
            <button class="btn btn-ghost btn-sm deal-decide" data-decision="abandoned">\u653E\u5F03\u8D2D\u4E70</button>
          </div>`:`<div class="deal-decision-final">${zt(t.decision_status)} ${t.decide_reason?"\xB7 "+i(t.decide_reason):""}</div>`}
    </div>

    </div>`,a.querySelectorAll(".deal-cool-btn").forEach(n=>n.addEventListener("click",async()=>{try{await m.post(`/deal/plans/${t.id}/cooling`,{hours:Number(n.dataset.hours)}),v("\u5DF2\u8FDB\u5165\u51B7\u9759\u671F","success"),ye=await m.get(`/deal/plans/${t.id}`),Vt(e,a,ye)}catch(d){v(d.message,"error")}})),a.querySelectorAll(".deal-decide").forEach(n=>n.addEventListener("click",async()=>{try{await m.post(`/deal/plans/${t.id}/decide`,{decision:n.dataset.decision,reason:a.querySelector("#dDecideReason")?.value.trim()||""}),v("\u5DF2\u8BB0\u5F55\u51B3\u5B9A","success"),ye=await m.get(`/deal/plans/${t.id}`),Vt(e,a,ye)}catch(d){v(d.message,"error")}}))}ve();var Si=[{key:"today",label:"\u4ECA\u65E5"},{key:"plan",label:"\u8BA1\u5212"},{key:"focus",label:"\u4E13\u6CE8"},{key:"notes",label:"\u8BB0\u5F55"},{key:"achievements",label:"\u6210\u5C31"}],J={tab:"today",data:null,notes:[],papers:[],review:null,badges:null,shop:null},Re=null,Ie=null;window.addEventListener("hashchange",()=>{Ie&&Ie()});async function Xe(e,a){clearInterval(Re),J={tab:a&&a.params&&a.params.get("tab")||"today",data:null,notes:[],papers:[],review:null,badges:null,shop:null};let s=localStorage.getItem("selfTheme")||"default";at(s),e.innerHTML=`
    <div class="self-control">
      <div class="page-head">
        <div>
          <div class="page-title">Self-Control \xB7 \u81EA\u6211\u63A7\u5236</div>
          <div class="page-sub">\u4ECA\u65E5\u3001\u8BA1\u5212\u3001\u4E13\u6CE8\u3001\u8BB0\u5F55\u4E0E\u6210\u5C31\uFF0C\u628A\u6BCF\u5929\u5B89\u6392\u660E\u767D\u3002</div>
        </div>
        <span class="tag tag-blue">${J.data?"":"\u52A0\u8F7D\u4E2D"}</span>
      </div>
      <div class="tabs" id="scTabs">
        ${Si.map(t=>`<a class="tab ${J.tab===t.key?"active":""}" data-tab="${t.key}" href="javascript:void(0)">${t.label}</a>`).join("")}
      </div>
      <div id="scBody"><div class="muted">\u6B63\u5728\u8BFB\u53D6\u2026</div></div>
    </div>`,e.querySelectorAll("[data-tab]").forEach(t=>{t.addEventListener("click",async()=>{if(t.dataset.tab!==J.tab){if(window.__focusGuard){v("\u8BF7\u4FDD\u6301\u4E13\u6CE8\uFF0C\u4E0D\u8981\u968F\u610F\u79BB\u5F00\u3002\u82E5\u8981\u79BB\u5F00\uFF0C\u9700\u70B9\u51FB\u6682\u505C\u65F6\u949F","error");return}Ie&&Ie(),J.tab=t.dataset.tab,e.querySelectorAll("[data-tab]").forEach(n=>n.classList.toggle("active",n===t)),await re(e)}})}),e.querySelector("#scBody").addEventListener("change",async t=>{let n=t.target.closest('input[data-act="task-done"]');if(!n)return;let d=n.dataset.id,l=n.checked,c=JSON.parse(n.closest(".task-row")?.querySelector("[data-task]")?.getAttribute("data-task")||"{}");try{await m.patch(`/self/control/tasks/${d}`,{status:l?"done":"planned"}),l?(_i(`\u5DF2\u5B8C\u6210\u300C${c.title||"\u4EFB\u52A1"}\u300D`,async()=>{await m.patch(`/self/control/tasks/${d}`,{status:"planned"}),v("\u5DF2\u64A4\u9500\u5B8C\u6210","success"),await re(e)}),await re(e)):(v("\u5DF2\u6062\u590D","success"),await re(e))}catch(r){v(r.message,"error")}}),e.querySelector("#scBody").addEventListener("click",async t=>{let n=t.target.closest("[data-act]");if(!n)return;let d=n.dataset.act;if(d==="task-focus")J.focusTask=n.dataset.title||"",J.tab="focus",e.querySelectorAll("[data-tab]").forEach(l=>l.classList.toggle("active",l.dataset.tab==="focus")),await re(e);else if(d==="task-more"){let l={};try{l=JSON.parse(n.getAttribute("data-task")||"{}")}catch{}Ei(e,l)}else if(d==="toggle-overdue"){if(!J.data||!J.data.overdue)return;J.showOverdue=!J.showOverdue,await re(e)}else d==="arrange"&&(await m.patch(`/self/control/tasks/${n.dataset.id}`,{status:"planned",plan_date:K()}),v("\u5DF2\u5B89\u6392\u5230\u4ECA\u5929"),await re(e))}),window.__scSync&&window.removeEventListener("self:tasks-updated",window.__scSync),window.__scSync=()=>{(J.tab==="today"||J.tab==="focus")&&re(e)},window.addEventListener("self:tasks-updated",window.__scSync),await re(e)}function _i(e,a){let s=document.createElement("div");s.className="undo-bar",s.innerHTML=`<span>${i(e)}</span><button type="button">\u64A4\u9500</button>`,document.body.appendChild(s);let t=setTimeout(()=>s.remove(),5e3);s.querySelector("button").addEventListener("click",()=>{clearTimeout(t),s.remove(),a()})}function Ei(e,a){Z({title:"\u4EFB\u52A1\u64CD\u4F5C",hideOk:!0,cancelText:"\u5173\u95ED",body:`<div class="task-more">
      <div class="tm-task">${i(a.title||"")}</div>
      <button class="btn btn-ghost" data-more="tomorrow">\u6539\u5230\u660E\u5929</button>
      <button class="btn btn-ghost" data-more="pick">\u81EA\u9009\u5B89\u6392\u65E5\u671F</button>
      <button class="btn btn-ghost" data-more="inbox">\u79FB\u56DE\u6536\u4EF6\u7BB1</button>
      <button class="btn btn-danger" data-more="delete">\u5220\u9664\u4EFB\u52A1</button>
      <div class="muted" style="margin-top:10px;font-size:11px">\u6539\u671F\u53EA\u8C03\u6574\u300C\u5B89\u6392\u65E5\u671F\u300D\uFF0C\u4E0D\u4F1A\u6539\u53D8\u622A\u6B62\u65F6\u95F4\uFF1B\u82E5\u65B0\u65E5\u671F\u8D85\u8FC7\u622A\u6B62\u65F6\u95F4\u4F1A\u5148\u63D0\u793A\u3002</div>
    </div>`}),document.querySelectorAll("[data-more]").forEach(s=>s.addEventListener("click",async()=>{let t=s.dataset.more;try{if(t==="tomorrow"){let n=new Date;n.setDate(n.getDate()+1),await Va(e,a,n.toISOString().slice(0,10))}else if(t==="pick"){let n=prompt("\u5B89\u6392\u65E5\u671F\uFF08YYYY-MM-DD\uFF09",a.plan_date||K());n&&await Va(e,a,n)}else if(t==="inbox")await m.patch(`/self/control/tasks/${a.id}`,{status:"inbox",plan_date:""}),document.querySelector(".modal [data-close]")?.click(),v("\u5DF2\u79FB\u56DE\u6536\u4EF6\u7BB1","success"),await re(e);else if(t==="delete"){if(!confirm("\u786E\u5B9A\u5220\u9664\u8FD9\u4E2A\u4EFB\u52A1\uFF1F"))return;await m.patch(`/self/control/tasks/${a.id}`,{status:"deleted"}),document.querySelector(".modal [data-close]")?.click(),v("\u5DF2\u5220\u9664","success"),await re(e)}}catch(n){v(n.message,"error")}}))}async function Va(e,a,s){a.due_at&&a.due_at.slice(0,10)&&s>a.due_at.slice(0,10)&&!confirm(`\u65B0\u7684\u5B89\u6392\u65E5\u671F ${s} \u5DF2\u8D85\u8FC7\u622A\u6B62\u65F6\u95F4 ${a.due_at}\uFF0C\u4ECD\u8981\u6539\u671F\u5417\uFF1F`)||(await m.patch(`/self/control/tasks/${a.id}`,{plan_date:s,status:"planned"}),document.querySelector(".modal [data-close]")?.click(),v(`\u5DF2\u6539\u5230 ${s}`,"success"),await re(e))}async function re(e){let a=e.querySelector("#scBody");a.innerHTML='<div class="muted">\u6B63\u5728\u8BFB\u53D6\u2026</div>';try{J.tab==="today"?await Li(e,a):J.tab==="plan"?await Ai(e,a):J.tab==="focus"?await Ci(e,a):J.tab==="notes"?await Hi(e,a):await Di(e,a)}catch(s){a.innerHTML=`<div class="card"><div class="card-title">\u52A0\u8F7D\u5931\u8D25</div><div class="card-desc">${i(s.message||"\u8BF7\u7A0D\u540E\u91CD\u8BD5")}</div></div>`}}async function Li(e,a){let[s,t,n]=await Promise.all([m.get(`/self/control/overview?day=${K()}`),m.get("/self/control/tasks").catch(()=>[]),m.get(`/self/control/reviews?type=daily&day=${K()}`).catch(()=>({review:null}))]);J.data=s;let d=s.tasks.length,l=s.done_today??s.tasks.filter(g=>g.status==="done").length,c=d?Math.round(l/d*100):0,r=s.today_xp??0,o=new Date,h=["\u65E5","\u4E00","\u4E8C","\u4E09","\u56DB","\u4E94","\u516D"],_=`${o.getFullYear()} \u5E74 ${o.getMonth()+1} \u6708 ${o.getDate()} \u65E5 \xB7 \u661F\u671F${h[o.getDay()]}`,E=new Date(o);E.setDate(E.getDate()+3);let k=`${E.getFullYear()}-${String(E.getMonth()+1).padStart(2,"0")}-${String(E.getDate()).padStart(2,"0")}`,f=(t||[]).filter(g=>{let L=(g.due_at||"").slice(0,10);return L&&g.status!=="done"&&g.status!=="deleted"&&L>=K()&&L<=k}).sort((g,L)=>(g.due_at||"").localeCompare(L.due_at||"")),M=g=>{let L=(g.due_at||"").slice(0,10),w=Math.round((new Date(L)-new Date(K()))/864e5);return w<=0?"\u4ECA\u5929\u622A\u6B62":w===1?"\u660E\u5929\u622A\u6B62":`\u8FD8\u6709 ${w} \u5929`},q=n?.review,U=g=>Number((g.due_at||"").slice(11,13))||0,u=g=>(g.due_at||"").length>=13,p=g=>g.status!=="done",b=[{key:"morning",label:"\u4E0A\u5348",items:s.tasks.filter(g=>p(g)&&u(g)&&U(g)<12)},{key:"afternoon",label:"\u4E0B\u5348",items:s.tasks.filter(g=>p(g)&&u(g)&&U(g)>=12&&U(g)<18)},{key:"evening",label:"\u665A\u4E0A",items:s.tasks.filter(g=>p(g)&&u(g)&&U(g)>=18)},{key:"allday",label:"\u5168\u5929",items:s.tasks.filter(g=>p(g)&&!u(g))}],S=s.tasks.filter(g=>g.status==="done"),y=(s.schedule||[]).find(g=>new Date(g.start_at).getTime()>Date.now());a.innerHTML=`
    <div class="grid grid-3 sc-stats" style="margin-bottom:16px">
      <div class="card sc-stat">
        <div class="sc-stat-top"><span>\u4ECA\u65E5\u5F85\u529E</span><b>${l}<i>/${d}</i></b></div>
        <div class="sc-stat-flex">
          <div style="flex:1;min-width:0">
            <div class="sc-progress"><i style="width:${c}%"></i></div>
            ${s.overdue?`<div class="sc-stat-sub"><a class="sc-od-link" data-act="toggle-overdue" href="javascript:void(0)" title="\u67E5\u770B\u903E\u671F\u4EFB\u52A1">\u903E\u671F ${s.overdue}</a></div>`:""}
          </div>
        </div>
      </div>
      <div class="card sc-stat">
        <div class="sc-stat-top"><span>\u4E13\u6CE8\u65F6\u95F4</span><b>${s.focus.count}<i>\u6B21</i></b></div>
        <div class="sc-stat-sub">\u4ECA\u65E5\u7D2F\u8BA1 ${s.focus.minutes} \u5206\u949F</div>
        <button class="btn btn-soft btn-sm" data-jump="focus">\u53BB\u4E13\u6CE8</button>
      </div>
      <div class="card sc-stat">
        <div class="sc-stat-top"><span>\u4ECA\u65E5\u79EF\u5206</span><b>+${r}</b></div>
        <div class="sc-stat-sub">\u6765\u81EA\u4E13\u6CE8 \xB7 \u4EFB\u52A1 \xB7 \u6253\u5361</div>
        <button class="btn btn-ghost btn-sm" data-act="checkin">${s.checkin?`\u5DF2\u6253\u5361 \xB7 \u7CBE\u529B ${s.checkin.energy}`:"\u7CBE\u529B\u6253\u5361"}</button>
      </div>
    </div>

    <div class="grid grid-2">
      <div class="card">
        <div class="spread">
          <div class="card-title">\u4ECA\u65E5\u4EFB\u52A1</div>
          <button class="btn btn-primary btn-sm" data-act="new-task">\u65B0\u5EFA</button>
        </div>
        ${s.overdue?`<button type="button" class="sc-od" data-act="toggle-overdue" title="${J.showOverdue?"\u6536\u8D77\u903E\u671F\u4EFB\u52A1":"\u67E5\u770B\u903E\u671F\u4EFB\u52A1"}"><span>\u26A0 \u903E\u671F</span><b>${s.overdue} \u4E2A\u4EFB\u52A1\u5F85\u5904\u7406</b><em>${J.showOverdue?"\u6536\u8D77 \u25B4":"\u67E5\u770B \u203A"}</em></button>
        ${J.showOverdue&&(s.overdue_tasks||[]).length?`<div class="sc-od-list">
          <div class="sc-tl-head"><i class="sc-tl-dot od"></i><b>\u903E\u671F\u672A\u5B8C\u6210</b><span>${s.overdue_tasks.length}</span></div>
          ${s.overdue_tasks.map(g=>Ze(g,!0)).join("")}
          ${s.overdue_tasks.length<s.overdue?`<div class="muted" style="font-size:11px;padding:4px 2px">\u4EC5\u663E\u793A\u6700\u65E9\u903E\u671F\u7684 ${s.overdue_tasks.length} \u6761\uFF0C\u5176\u4F59\u53EF\u5728\u8BA1\u5212\u9875\u5904\u7406\u3002</div>`:""}
        </div>`:""}`:""}
        ${b.filter(g=>g.items.length).map(g=>`<div class="sc-tl-group">
            <div class="sc-tl-head"><i class="sc-tl-dot ${g.key}"></i><b>${g.label}</b><span>${g.items.length}</span></div>
            ${g.items.map(L=>Ze(L,!1)).join("")}
          </div>`).join("")}
        ${S.length?`<div class="sc-tl-group">
              <div class="sc-tl-head"><i class="sc-tl-dot done"></i><b>\u5DF2\u5B8C\u6210</b><span>${S.length}</span></div>
              ${S.map(g=>Ze(g,!1)).join("")}
            </div>`:b.some(g=>g.items.length)?"":'<div class="muted" style="margin-top:10px">\u4ECA\u5929\u8FD8\u6CA1\u6709\u4EFB\u52A1\uFF0C\u70B9\u53F3\u4E0A\u89D2\u300C\u65B0\u5EFA\u300D\u5F00\u59CB\u3002</div>'}
        <div class="spread" style="margin-top:10px">
          <span class="muted" style="font-size:12px">\u6536\u4EF6\u7BB1 ${s.inbox} \u6761${s.inbox?"\u5F85\u5B89\u6392":"\uFF0C\u5DF2\u6E05\u7A7A"}</span>
          <a class="btn btn-ghost btn-sm" href="#/life/self/control?tab=plan">\u5B8C\u6574\u8BA1\u5212</a>
        </div>
      </div>

      <div class="sc-col">
      <div class="card">
        <div class="spread"><div class="card-title">\u4ECA\u65E5\u65E5\u7A0B</div><span class="tag tag-blue sc-date-tag">${_}</span></div>
        ${s.schedule.length?`<div class="sc-agenda">${s.schedule.map(g=>`<div class="sc-agenda-item">
              <div class="sc-agenda-time">${i(gt(g.start_at))}</div>
              <i class="sc-agenda-node"></i>
              <div class="sc-agenda-body">
                <b>${i(g.title)}</b>
                <span>${g.kind==="fixed"?"\u56FA\u5B9A\u5B89\u6392":"\u5F39\u6027\u5B89\u6392"} \xB7 ${i(gt(g.start_at))} \u2013 ${i(gt(g.end_at))}</span>
              </div>
            </div>`).join("")}</div>`:'<div class="muted" style="margin-top:10px">\u4ECA\u5929\u6CA1\u6709\u8BB2\u5EA7\u6216\u4F1A\u8BAE\u5B89\u6392\uFF0C\u7559\u767D\u4E5F\u662F\u4E00\u79CD\u5B89\u6392\u3002</div>'}
        ${y?`<div class="sc-next">\u4E0B\u4E00\u4EF6\u4E8B\uFF1A${i(gt(y.start_at))} ${i(y.title)}</div>`:""}
        <div class="sc-week">
          <div class="spread"><span class="muted">\u672C\u5468\u5B8C\u6210\u7387</span><strong>${s.week.rate}%</strong></div>
          <div class="spread"><span class="muted">\u5B8C\u6210 / \u8BA1\u5212</span><span>${s.week.done} / ${s.week.total}</span></div>
          <div class="spread"><span class="muted">\u8FDE\u7EED\u6709\u6548\u65E5</span><span>${s.streak} \u5929</span></div>
          <a class="btn btn-ghost btn-sm" href="#/life/self/control?tab=plan">\u53BB\u8BA1\u5212</a>
        </div>
      </div>

      <div class="card sc-urgent-card">
        <div class="spread">
          <div class="row" style="gap:8px;align-items:center"><i class="sc-urgent-ico">\u23F1</i><div class="card-title">\u5FEB\u622A\u6B62\u4EFB\u52A1</div></div>
          <span class="tag tag-warn">3 \u5929\u5185</span>
        </div>
        ${f.length?f.slice(0,6).map(g=>`
            <div class="sc-urgent-row">
              <span class="sc-urgent-dd ${M(g)==="\u4ECA\u5929\u622A\u6B62"?"hot":""}">${M(g)}</span>
              <div class="sc-urgent-main" data-act="task-detail" data-task='${i(JSON.stringify(g))}' title="\u70B9\u51FB\u67E5\u770B/\u7F16\u8F91\u8BE6\u60C5">
                <b>${i(g.title)}</b>
                <span>\u622A\u6B62 ${i((g.due_at||"").slice(0,16).replace("T"," "))}${g.plan_date?` \xB7 \u5B89\u6392 ${i(g.plan_date)}`:" \xB7 \u672A\u5B89\u6392"}</span>
              </div>
              <div class="sc-urgent-acts">
                <button class="btn btn-ghost btn-sm" data-act="task-focus" data-title="${i(g.title)}">\u5F00\u59CB\u4E13\u6CE8</button>
                ${g.plan_date!==K()?`<button class="btn btn-soft btn-sm" data-act="arrange" data-id="${g.id}">\u6392\u4ECA\u5929</button>`:""}
              </div>
            </div>`).join(""):'<div class="muted" style="margin-top:10px">3 \u5929\u5185\u6CA1\u6709\u5FEB\u622A\u6B62\u7684\u4EFB\u52A1\uFF0C\u8282\u594F\u5F88\u597D\u3002</div>'}
        ${f.length>6?`<div class="muted" style="font-size:11px;margin-top:6px">\u8FD8\u6709 ${f.length-6} \u6761\u8F83\u65E9\u7684\uFF0C\u53EF\u5728\u8BA1\u5212\u9875\u67E5\u770B\u3002</div>`:""}
      </div>
      </div>
    </div>

    <div class="card" style="margin-top:16px">
      <div class="spread">
        <div class="card-title">\u4ECA\u65E5\u590D\u76D8</div>
        <span class="tag tag-blue">${q?"\u5DF2\u4FDD\u5B58 \xB7 \u53EF\u4FEE\u6539":"\u4E09\u95EE\u5FEB\u7B54 \xB7 +10 \u79EF\u5206"}</span>
      </div>
      <div class="grid grid-3" style="margin-top:10px">
        <div class="field"><label>\u4ECA\u5929\u5B8C\u6210\u4E86\u4EC0\u4E48</label><textarea class="input" id="drSum" rows="3" placeholder="\u5B8C\u6210\u7684\u4EFB\u52A1\u3001\u63A8\u8FDB\u7684\u8FDB\u5C55\u2026\u2026">${i(q?.summary||"")}</textarea></div>
        <div class="field"><label>\u54EA\u4E9B\u5361\u4F4F\u4E86</label><textarea class="input" id="drF1" rows="3" placeholder="\u5361\u70B9\u3001\u539F\u56E0\u3001\u9700\u8981\u8C01\u5E2E\u5FD9\u2026\u2026">${i(q?.focus1||"")}</textarea></div>
        <div class="field"><label>\u660E\u5929\u5148\u505A\u4EC0\u4E48</label><textarea class="input" id="drF2" rows="3" placeholder="\u660E\u65E9\u7B2C\u4E00\u4EF6\u4E8B\uFF0C30 \u5206\u949F\u5185\u80FD\u5F00\u59CB\u7684\u2026\u2026">${i(q?.focus2||"")}</textarea></div>
      </div>
      <button class="btn btn-primary btn-sm" data-act="save-daily-review" style="margin-top:10px">\u4FDD\u5B58\u4ECA\u65E5\u590D\u76D8</button>
    </div>`,a.querySelector('[data-act="checkin"]').addEventListener("click",()=>Fi(e)),a.querySelector('[data-act="new-task"]').addEventListener("click",()=>Ya(e)),a.querySelectorAll("[data-jump]").forEach(g=>g.addEventListener("click",()=>{let L=g.dataset.jump;J.tab=L,e.querySelectorAll("[data-tab]").forEach(w=>w.classList.toggle("active",w.dataset.tab===L)),re(e)})),Wa(a),a.querySelector('[data-act="save-daily-review"]').addEventListener("click",async g=>{let L=g.currentTarget;L.disabled=!0;try{await m.post("/self/control/reviews",{type:"daily",day:K(),summary:a.querySelector("#drSum").value.trim(),focus1:a.querySelector("#drF1").value.trim(),focus2:a.querySelector("#drF2").value.trim()}),v("\u4ECA\u65E5\u590D\u76D8\u5DF2\u4FDD\u5B58","success"),L.textContent="\u5DF2\u4FDD\u5B58 \u2713"}catch(w){v(w.message,"error"),L.disabled=!1}})}function Mi(e){let a=e?.total||0,s=e?.done||0,t=e?.ongoing||0,n=e?.not_started||0,d=e?.rate||0,l=c=>a?`${c/a*100}%`:"0%";return`
  <div class="card sc-mp-card">
    <div class="sc-mp-head">
      <b class="sc-mp-num">${a}</b>
      <div class="sc-mp-label">\u672C\u6708\u8BA1\u5212</div>
      <div class="sc-mp-rate"><strong>${d}<i>%</i></strong><span>\u5B8C\u6210\u7387</span></div>
    </div>
    <div class="sc-mp-bar" title="\u5DF2\u5B8C\u6210 ${s} \xB7 \u8FDB\u884C\u4E2D ${t} \xB7 \u672A\u5F00\u59CB ${n}">
      <i style="width:${l(s)}" class="done"></i><i style="width:${l(t)}" class="ing"></i><i style="width:${l(n)}" class="todo"></i>
    </div>
    <div class="sc-mp-rows">
      <span><i class="sc-mp-dot done"></i>\u5DF2\u5B8C\u6210 <b>${s}</b></span>
      <span><i class="sc-mp-dot ing"></i>\u8FDB\u884C\u4E2D <b>${t}</b></span>
      <span><i class="sc-mp-dot todo"></i>\u672A\u5F00\u59CB <b>${n}</b></span>
    </div>
  </div>`}function Ua(e,a){let s=Math.max(0,Math.min(e,a)),t=a?s/a:0,n=56,d=18,l=2*Math.PI*n;if(!a)return`<svg viewBox="0 0 150 150" class="sc-pie2" role="img" aria-label="\u6682\u65E0\u8BA1\u5212">
      <circle cx="75" cy="75" r="${n}" fill="none" stroke="#e2e8f0" stroke-width="${d}"/>
      <text x="75" y="80" text-anchor="middle" class="sc-pie2-sub">\u6682\u65E0\u8BA1\u5212</text></svg>`;let c=(l*t).toFixed(1);return`<svg viewBox="0 0 150 150" class="sc-pie2" role="img" aria-label="\u5B8C\u6210 ${Math.round(t*100)}%">
    <circle cx="75" cy="75" r="${n}" fill="none" stroke="#e2e8f0" stroke-width="${d}"/>
    <circle cx="75" cy="75" r="${n}" fill="none" stroke="#34d399" stroke-width="${d}"
      stroke-linecap="round" stroke-dasharray="${c} ${(l-Number(c)).toFixed(1)}" transform="rotate(-90 75 75)"/>
    <text x="75" y="72" text-anchor="middle" class="sc-pie2-num">${Math.round(t*100)}%</text>
    <text x="75" y="92" text-anchor="middle" class="sc-pie2-sub">${s}/${a}</text>
  </svg>`}function qi(e){let a=e?.series||[],s=K(),t=a.find(o=>o.date===s)||{total:0,done:0},n=new Date(`${s}T00:00:00`);n.setDate(n.getDate()-6);let d=`${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,"0")}-${String(n.getDate()).padStart(2,"0")}`,l=a.filter(o=>o.date>=d&&o.date<=s),c=l.reduce((o,h)=>o+h.total,0),r=l.reduce((o,h)=>o+h.done,0);return`
  <div class="card sc-bc-card">
    <div class="spread">
      <div class="card-title">\u6BCF\u65E5\u5B8C\u6210\u60C5\u51B5</div>
      <div class="sc-bc-legend">
        <span><i class="bc-done"></i>\u5DF2\u5B8C\u6210</span>
        <span><i class="bc-todo"></i>\u672A\u5B8C\u6210</span>
      </div>
    </div>
    <div class="sc-pie-pair">
      <div class="sc-pie-item">
        <div class="sc-pie-cap">\u4ECA\u65E5</div>
        ${Ua(t.done,t.total)}
        <div class="sc-pie-foot">\u4ECA\u65E5\u5B8C\u6210 ${t.done}/${t.total}</div>
      </div>
      <div class="sc-pie-item">
        <div class="sc-pie-cap">\u8FD1 7 \u5929</div>
        ${Ua(r,c)}
        <div class="sc-pie-foot">\u8FD1 7 \u5929\u5B8C\u6210 ${r}/${c}</div>
      </div>
    </div>
    <div class="muted" style="font-size:11px;margin-top:2px">\u6309\u300C\u5B89\u6392\u65E5\u671F\u300D\u7EDF\u8BA1\uFF1B\u7EFF\u8272\u4E3A\u5DF2\u5B8C\u6210\uFF0C\u7070\u8272\u4E3A\u672A\u5B8C\u6210\u3002</div>
  </div>`}function Ti(e){let a=e?.review,s=K().slice(0,7),[t,n]=s.split("-").map(Number);return`
  <div class="card sc-mr-card">
    <div class="spread">
      <div class="card-title">\u6708\u5EA6\u5DE5\u4F5C\u590D\u76D8</div>
      <span class="tag tag-blue">${t} \u5E74 ${n} \u6708</span>
    </div>
    <div class="field" style="margin-top:10px"><label>\u672C\u6708\u6210\u679C\uFF08\u6BCF\u884C\u4E00\u6761\uFF09</label>
      <textarea class="input" id="mrSum" rows="4" placeholder="1\u3001&#10;2\u3001&#10;3\u3001">${i(a?.summary||"")}</textarea></div>
    <div class="field"><label>\u4E0B\u6708\u8BA1\u5212\uFF08\u6BCF\u884C\u4E00\u6761\uFF09</label>
      <textarea class="input" id="mrF1" rows="3" placeholder="1\u3001&#10;2\u3001">${i(a?.focus1||"")}</textarea></div>
    <button class="btn btn-primary btn-sm" data-act="save-monthly-review">${a?"\u66F4\u65B0\u6708\u5EA6\u590D\u76D8":"\u4FDD\u5B58\u6708\u5EA6\u590D\u76D8\uFF08+30 \u79EF\u5206\uFF09"}</button>
  </div>`}async function Ai(e,a){let s=K().slice(0,7)+"-01",[t,n,d,l]=await Promise.all([m.get("/self/control/tasks"),m.get("/self/control/papers"),m.get(`/self/control/month-stats?month=${K().slice(0,7)}`).catch(()=>null),m.get(`/self/control/reviews?type=monthly&month=${s}`).catch(()=>null)]);J.papers=n;let c=t.filter(o=>o.status==="inbox"),r=t.filter(o=>o.status==="planned");a.innerHTML=`
    <div class="sc-plan-cols">
      <aside class="sc-plan-left">
        ${Mi(d)}
        <div class="card">
          <div class="spread"><div class="card-title">\u5F85\u6392\u671F\u4E8B\u9879</div><button class="btn btn-primary btn-sm" data-act="new-task">\u65B0\u5EFA</button></div>
          ${c.length?c.slice(0,6).map((o,h)=>`
              <div class="sc-inbox-item">
                <span class="sc-inbox-idx">${h+1}</span>
                <div class="sc-inbox-main" data-act="task-detail" data-task='${i(JSON.stringify(o))}' title="\u70B9\u51FB\u67E5\u770B/\u7F16\u8F91\u8BE6\u60C5">
                  <b>${i(o.title)}</b>
                  <span>${i(o.priority||"P1")} \xB7 ${o.due_at?`\u622A\u6B62 ${i(o.due_at.slice(0,10))}`:"\u65E0\u622A\u6B62"}${o.source==="message"?" \xB7 \u7FA4\u6D88\u606F":""}</span>
                </div>
                <button class="btn btn-soft btn-sm" data-act="arrange" data-id="${o.id}">\u6392\u4ECA\u5929</button>
              </div>`).join("")+(c.length>6?`<div class="muted" style="font-size:11px;margin-top:6px">\u8FD8\u6709 ${c.length-6} \u6761\u5F85\u6392\u671F\u3002</div>`:""):'<div class="muted" style="margin-top:10px">\u6536\u4EF6\u7BB1\u5DF2\u6E05\u7A7A\uFF0C\u5F85\u6392\u671F\u4E8B\u9879\u4F1A\u51FA\u73B0\u5728\u8FD9\u91CC\u3002</div>'}
          ${r.length?`<div class="section-title" style="margin-top:14px">\u5DF2\u5B89\u6392\uFF08\u6700\u8FD1 6 \u6761\uFF09</div>
            ${r.slice(0,6).map(o=>Ze(o,!1)).join("")}`:""}
        </div>
        ${Ti(l)}
      </aside>

      <div class="sc-plan-right">
        ${qi(d)}

        <div class="grid grid-2">
          <div class="card" style="grid-column:1/-1">
            <div class="spread"><div class="card-title">\u8BBA\u6587\u4E0E\u9879\u76EE</div>
              <button class="btn btn-primary btn-sm" data-act="new-paper">\u65B0\u5EFA</button></div>
            ${n.length?n.map(o=>`
              <div style="padding:10px 0;border-bottom:1px solid var(--border)">
                <div class="spread">
                  <strong style="font-size:13px">${i(o.title)}</strong>
                  <span class="tag ${o.days>=14?"tag-warn":"tag-blue"}">${i(o.stage)}${o.days?` \xB7 \u5361 ${o.days} \u5929`:""}</span>
                </div>
                <div class="muted" style="font-size:12px;margin-top:2px">${i(o.venue||"\u672A\u5B9A\u671F\u520A")} \xB7 \u622A\u6B62 ${i(o.deadline||"\u672A\u5B9A")}</div>
                <div class="muted" style="font-size:12px;margin-top:2px">\u5361\u70B9\uFF1A${i(o.blocker||"\u65E0")}</div>
                <div class="row" style="margin-top:6px">
                  <button class="btn btn-ghost btn-sm" data-act="paper-next" data-id="${o.id}" data-next="${i(o.next_action)}">\u4E0B\u4E00\u6B65\u8F6C\u4EFB\u52A1</button>
                  <button class="btn btn-ghost btn-sm" data-act="paper-stage" data-id="${o.id}">\u63A8\u8FDB\u9636\u6BB5</button>
                </div>
              </div>`).join(""):'<div class="muted" style="margin-top:10px">\u8FD8\u6CA1\u6709\u8BBA\u6587\u8BB0\u5F55\u3002</div>'}
          </div>
        </div>
      </div>
    </div>`,a.querySelector('[data-act="new-task"]').addEventListener("click",()=>Ya(e)),Wa(a),a.querySelectorAll('[data-act="arrange"]').forEach(o=>o.addEventListener("click",async()=>{await m.patch(`/self/control/tasks/${o.dataset.id}`,{status:"planned",plan_date:K()}),v("\u5DF2\u5B89\u6392\u5230\u4ECA\u5929"),await re(e)})),a.querySelector('[data-act="save-monthly-review"]')?.addEventListener("click",async o=>{let h=o.currentTarget;h.disabled=!0;try{await m.post("/self/control/reviews",{type:"monthly",month:K().slice(0,7)+"-01",summary:a.querySelector("#mrSum").value.trim(),focus1:a.querySelector("#mrF1").value.trim()}),v("\u6708\u5EA6\u590D\u76D8\u5DF2\u4FDD\u5B58","success"),h.textContent="\u5DF2\u4FDD\u5B58 \u2713"}catch(_){v(_.message,"error"),h.disabled=!1}}),a.querySelector('[data-act="new-paper"]').addEventListener("click",()=>Oi(e)),a.querySelectorAll('[data-act="paper-next"]').forEach(o=>o.addEventListener("click",async()=>{let h=o.dataset.next;if(!h)return v("\u8FD9\u7BC7\u8FD8\u6CA1\u5199\u4E0B\u4E00\u6B65");await m.post("/self/control/tasks",{title:h,paper_id:Number(o.dataset.id),plan_date:K(),priority:"P0",estimate_min:45,status:"planned"}),v("\u5DF2\u8F6C\u6210\u4ECA\u5929\u7684\u4EFB\u52A1"),await re(e)})),a.querySelectorAll('[data-act="paper-stage"]').forEach(o=>o.addEventListener("click",()=>zi(e,o.dataset.id)))}function ji(e){Z({title:"\u4EFB\u52A1\u8BE6\u60C5",hideOk:!0,cancelText:"\u5173\u95ED",body:`<div class="task-detail-modal">
      <div class="td-row"><span>\u4EFB\u52A1</span><b>${i(e.title)}</b></div>
      <div class="td-row"><span>\u72B6\u6001</span>${e.status==="done"?'<span class="tag tag-green">\u5DF2\u5B8C\u6210</span>':e.status==="planned"?'<span class="tag tag-blue">\u5DF2\u5B89\u6392</span>':'<span class="tag">\u6536\u4EF6\u7BB1</span>'}</div>
      <div class="td-row"><span>\u4F18\u5148\u7EA7</span>${i(e.priority||"P1")} \xB7 \u9884\u8BA1 ${e.estimate_min||30} \u5206\u949F</div>
      ${e.plan_date?`<div class="td-row"><span>\u8BA1\u5212\u65E5\u671F</span>${i(e.plan_date)}</div>`:""}
      ${e.due_at?`<div class="td-row"><span>\u622A\u6B62</span>${i(e.due_at)}</div>`:""}
      ${e.next_action?`<div class="td-row"><span>\u4E0B\u4E00\u6B65</span>${i(e.next_action)}</div>`:""}
      ${e.source==="message"?'<div class="td-row"><span>\u6765\u6E90</span>\u7FA4\u6D88\u606F</div>':""}
      ${e.postpone_count>0?`<div class="td-row"><span>\u987A\u5EF6</span>${e.postpone_count} \u6B21</div>`:""}
    </div>`})}function Wa(e){e.querySelectorAll('[data-act="task-detail"]').forEach(a=>a.addEventListener("click",s=>{if(!s.target.closest('input[type="checkbox"], button'))try{ji(JSON.parse(a.getAttribute("data-task")))}catch{}}))}function Ze(e,a){let s=e.status==="done";return`<div class="task-row ${s?"is-done":""}">
    <input type="checkbox" class="task-check" data-act="task-done" data-id="${e.id}" ${s?"checked":""} aria-label="\u5B8C\u6210\u4EFB\u52A1">
    <div class="task-main" data-act="task-detail" data-task='${i(JSON.stringify(e))}' title="\u70B9\u51FB\u67E5\u770B/\u7F16\u8F91\u8BE6\u60C5">
      <div class="task-title">${i(e.title)}</div>
      <div class="task-meta">
        ${i(e.priority||"P1")} \xB7 ${e.estimate_min||30} \u5206\u949F
        ${e.plan_date?` \xB7 \u5B89\u6392 ${i(e.plan_date)}`:""}
        ${e.due_at?` \xB7 \u622A\u6B62 ${i(e.due_at)}`:""}
        ${e.source==="message"?' \xB7 <span class="tag">\u7FA4\u6D88\u606F</span>':""}
      </div>
    </div>
    <div class="task-actions">
      ${s?"":`<button class="btn btn-ghost btn-sm" data-act="task-focus" data-title="${i(e.title)}">\u5F00\u59CB\u4E13\u6CE8</button>`}
      ${a&&!s?`<button class="btn btn-ghost btn-sm" data-act="arrange" data-id="${e.id}">\u6392\u4ECA\u5929</button>`:""}
      <button class="btn btn-ghost btn-sm" data-act="task-more" data-task='${i(JSON.stringify(e))}'>\u66F4\u591A</button>
    </div>
  </div>`}var Bi=["\u4E0A\u8BFE","\u5F85\u529E","\u65B0\u95FB","\u7701\u94B1","\u642D\u5B50","\u9884\u7EA6"];async function Ci(e,a){let s=await m.get(`/self/control/overview?day=${K()}`);J.data=s;let t={focusMin:25,restMin:5,rounds:4,blocked:["\u65B0\u95FB","\u7701\u94B1","\u642D\u5B50"]};try{t={...t,...JSON.parse(localStorage.getItem("focusCfg")||"{}")}}catch{}let n=J.focusTask||"";J.focusTask="",a.innerHTML=`
    <div class="focus-grid">
      <div class="sc-focus-left">
      <div class="card fc-clock-card">
        <div class="spread"><div class="card-title">\u4E13\u6CE8\u65F6\u949F</div><span class="tag tag-blue" id="fcPhaseTag">\u672A\u5F00\u59CB</span></div>
        <div class="fc-clock-wrap">
          <svg class="fc-ring" viewBox="0 0 200 200">
            <circle class="fc-ring-bg" cx="100" cy="100" r="88"/>
            <circle class="fc-ring-fg" id="fcRing" cx="100" cy="100" r="88"/>
          </svg>
          <div class="fc-clock-center">
            <div class="fc-time" id="fcTime">${String(t.focusMin).padStart(2,"0")}:00</div>
            <div class="fc-round" id="fcRound">\u7B2C 0 / ${t.rounds} \u8F6E</div>
          </div>
        </div>
        <div class="field" style="margin-top:14px"><label>\u672C\u6B21\u4EFB\u52A1</label>
          <input class="input" id="fcTask" value="${i(n)}" placeholder="\u4F8B\u5982\uFF1A\u8865\u56FE 3 \u7684\u8BEF\u5DEE\u68D2">
        </div>
        <div class="row fc-actions" style="justify-content:center;margin-top:12px">
          <button class="btn btn-primary" id="fcMainBtn" type="button">\u5F00\u59CB\u4E13\u6CE8</button>
          <button class="btn btn-ghost" id="fcSubBtn" type="button">\u8C03\u6574\u65F6\u957F</button>
        </div>
        <div class="muted" style="margin-top:10px;font-size:11px" id="fcHint">\u4E13\u6CE8\u7ED3\u675F\u540E\u81EA\u52A8\u8FDB\u5165\u4F11\u606F\uFF1B\u5C4F\u853D\u52FE\u9009\u7C7B\u522B\u7684\u6D88\u606F\u5F39\u7A97\uFF0C\u7EA2\u70B9\u4FDD\u7559\u3002<br>\u8BA1\u65F6\u4E2D\u53EF\u5148\u6682\u505C\u518D\u524D\u5F80\u5176\u4ED6\u9875\u9762\uFF0C\u8FD4\u56DE\u540E\u4F1A\u4ECE\u6682\u505C\u5904\u7EE7\u7EED\u3002</div>
      </div>
      <div id="focusTrend"></div>
      </div>

      <div>
        <div class="card">
          <div class="spread"><div class="card-title">\u756A\u8304\u949F\u8BBE\u7F6E</div><span class="tag tag-gold">\u4E13\u6CE8 ${t.focusMin} \xB7 \u4F11\u606F ${t.restMin} \xB7 ${t.rounds} \u8F6E</span></div>
          <div class="fc-set-row"><label>\u4E13\u6CE8\u65F6\u957F</label>
            <div class="fc-chips" id="fcFocusLen">
              ${[15,25,45,60].map(A=>`<button class="fc-chip ${t.focusMin===A?"on":""}" data-min="${A}">${A} \u5206</button>`).join("")}
              <input class="fc-chip-input" id="fcFocusCustom" type="number" min="5" max="180" value="${[15,25,45,60].includes(t.focusMin)?"":t.focusMin}" placeholder="\u81EA\u5B9A\u4E49">
            </div>
          </div>
          <div class="fc-set-row"><label>\u4F11\u606F\u65F6\u957F</label>
            <div class="fc-chips" id="fcRestLen">
              ${[5,10,15].map(A=>`<button class="fc-chip ${t.restMin===A?"on":""}" data-min="${A}">${A} \u5206</button>`).join("")}
              <input class="fc-chip-input" id="fcRestCustom" type="number" min="1" max="60" value="${[5,10,15].includes(t.restMin)?"":t.restMin}" placeholder="\u81EA\u5B9A\u4E49">
            </div>
          </div>
          <div class="fc-set-row"><label>\u8BA1\u5212\u8F6E\u6570</label>
            <div class="fc-chips" id="fcRounds">
              ${[2,4,6].map(A=>`<button class="fc-chip ${t.rounds===A?"on":""}" data-n="${A}">${A} \u8F6E</button>`).join("")}
              <input class="fc-chip-input" id="fcRoundsCustom" type="number" min="1" max="12" value="${[2,4,6].includes(t.rounds)?"":t.rounds}" placeholder="\u81EA\u5B9A\u4E49">
            </div>
          </div>
          <div class="fc-set-row" style="align-items:flex-start"><label style="margin-top:6px">\u5C4F\u853D\u901A\u77E5</label>
            <div class="fc-chips" id="fcBlock">
              ${Bi.map(A=>`<button class="fc-chip ${t.blocked.includes(A)?"on":""}" data-cat="${A}">${A}</button>`).join("")}
            </div>
          </div>
          <div class="muted" style="margin-top:8px;font-size:11px">\u5C4F\u853D\u7684\u7C7B\u522B\u5728\u4E13\u6CE8\u671F\u95F4\u4E0D\u5F39\u51FA\u6D88\u606F\u901A\u77E5\uFF08\u7EA2\u70B9\u4ECD\u4FDD\u7559\uFF0C\u53EF\u5728\u6D88\u606F\u4E2D\u5FC3\u67E5\u770B\uFF09\uFF1B\u672A\u52FE\u9009\u7C7B\u522B\u7167\u5E38\u63D0\u9192\u3002</div>
        </div>

        <div class="card" style="margin-top:14px">
          <div class="card-title">\u4ECA\u65E5\u4E13\u6CE8</div>
          <div class="stat" style="margin-top:10px"><div class="stat-num">${s.focus.count}<span class="unit">\u6B21</span></div><div class="stat-label">${s.focus.minutes} \u5206\u949F</div></div>
          <div class="section-title" style="margin-top:14px">\u4ECA\u65E5\u4EFB\u52A1 \xB7 \u70B9\u51FB\u53F3\u4FA7\u6309\u94AE\u76F4\u63A5\u4E13\u6CE8</div>
          ${s.tasks.length?s.tasks.map(A=>Ze(A,!1)).join(""):'<div class="muted" style="margin-top:8px">\u4ECA\u5929\u8FD8\u6CA1\u6709\u4EFB\u52A1\u3002</div>'}
        </div>
      </div>
    </div>`;let d="idle",l=!1,c=0,r=0,o=t.focusMin*60,h=o,_=a.querySelector("#fcTime"),E=a.querySelector("#fcRing"),k=a.querySelector("#fcPhaseTag"),f=a.querySelector("#fcRound"),M=a.querySelector("#fcMainBtn"),q=a.querySelector("#fcSubBtn"),U=2*Math.PI*88,u=()=>{window.__focusMode={active:d==="focusing",blocked:t.blocked},window.__focusGuard=d==="focusing"},p=()=>{_.textContent=`${String(Math.floor(h/60)).padStart(2,"0")}:${String(h%60).padStart(2,"0")}`;let A=o?h/o:0;E.style.strokeDashoffset=String(U*(1-A));let z=d==="done"?t.rounds:d==="idle"?0:c+1;f.textContent=`\u7B2C ${z} / ${t.rounds} \u8F6E`},b=A=>{d=A,u();let z={idle:"\u672A\u5F00\u59CB",focusing:"\u4E13\u6CE8\u4E2D",paused:"\u5DF2\u6682\u505C",resting:"\u4F11\u606F\u4E2D",done:"\u672C\u7EC4\u5B8C\u6210"},ie={idle:"\u5F00\u59CB\u4E13\u6CE8",focusing:"\u6682\u505C",paused:"\u7EE7\u7EED\u4E13\u6CE8",resting:"\u5F00\u59CB\u4E0B\u4E00\u8F6E",done:"\u518D\u6765\u4E00\u7EC4"},$={idle:"\u8C03\u6574\u65F6\u957F",focusing:"\u63D0\u524D\u7ED3\u675F",paused:"\u7ED3\u675F\u672C\u6B21",resting:"\u7ED3\u675F\u672C\u7EC4",done:"\u67E5\u770B\u8BB0\u5F55"};k.textContent=z[A]||A,k.className=`tag ${A==="focusing"?"tag-blue":A==="resting"?"tag-green":A==="paused"?"tag-gold":A==="done"?"tag-green":""}`,M.textContent=ie[A]||"\u5F00\u59CB\u4E13\u6CE8",q.textContent=$[A]||"\u8C03\u6574\u65F6\u957F",M.dataset.phase=A,E.classList.toggle("resting",A==="resting"),document.title=A==="idle"?"\u81EA\u6211\u63A7\u5236 \xB7 \u7231\u5E08\u5927":`${_.textContent} ${z[A]||""} \xB7 \u7231\u5E08\u5927`},S=()=>{clearInterval(Re),Re=null,l=!1},y=()=>{if(h-=1,d==="focusing"&&(r+=1),h<=0){h=0,S(),p(),d==="focusing"?L():w();return}p(),h===300&&v(d==="focusing"?"\u8FD8\u5269 5 \u5206\u949F":"\u4F11\u606F\u8FD8\u5269 5 \u5206\u949F")},g=async()=>{let A=Math.max(1,Math.round(r/60)),z=a.querySelector("#fcTask").value.trim()||"\u4E13\u6CE8";try{await m.post("/self/pomodoro",{task:z,minutes:A,status:"done"});let ie=A>20?"\u5DF2\u8BB0\u5F55\uFF0C\u6EE1 20 \u5206\u949F\u8BA1\u5165\u79EF\u5206":"\u672A\u6EE1 20 \u5206\u949F\uFF0C\u672C\u6B21\u4E0D\u8BA1\u79EF\u5206";v(`\u4E13\u6CE8\u5B8C\u6210\uFF1A${z} \xB7 ${A} \u5206\u949F\uFF0C${ie}`,"success")}catch(ie){v(ie.message,"error")}r=0},L=async()=>{if(await g(),c>=t.rounds){b("done"),o=h=t.focusMin*60,p(),v(`\u5168\u90E8 ${t.rounds} \u8F6E\u5B8C\u6210\uFF0C\u597D\u597D\u4F11\u606F\u4E00\u4E0B\uFF01`,"success");return}o=h=t.restMin*60,b("resting"),p(),Re=setInterval(y,1e3),l=!0,v("\u8FDB\u5165\u4F11\u606F\uFF0C\u7AD9\u8D77\u6765\u559D\u53E3\u6C34 \u{1F964}")},w=()=>{if(c+=1,c>=t.rounds){b("done"),o=h=t.focusMin*60,c=0,p(),v(`\u5168\u90E8 ${t.rounds} \u8F6E\u5B8C\u6210\uFF0C\u4ECA\u5929\u5F88\u68D2\uFF01`,"success");return}o=h=t.focusMin*60,b("focusing"),p(),Re=setInterval(y,1e3),l=!0,v(`\u4F11\u606F\u7ED3\u675F\uFF0C\u5F00\u59CB\u7B2C ${c+1} \u8F6E\u4E13\u6CE8`)},x=()=>{S(),Re=setInterval(y,1e3),l=!0},N=()=>{b("focusing"),p(),x()};M.addEventListener("click",()=>{d==="idle"||d==="done"?(c=0,r=0,o=h=t.focusMin*60,N()):d==="focusing"?(S(),b("paused"),v("\u5DF2\u6682\u505C\uFF0C\u8BA1\u65F6\u4FDD\u7559")):d==="paused"?N():d==="resting"&&(S(),w())}),q.addEventListener("click",async()=>{if(d==="idle"||d==="done"){let A=a.querySelector(".fc-set-row");A?A.scrollIntoView({behavior:"smooth",block:"center"}):v("\u5728\u53F3\u4FA7\u8C03\u6574\u4E13\u6CE8\u65F6\u957F")}else if(d==="focusing"||d==="paused"){S();let A=Math.max(0,Math.round(r/60));localStorage.removeItem("focusRuntime"),A>=1&&await g(),d="idle",c=0,r=0,o=h=t.focusMin*60,b("idle"),p(),v(A>=1?`\u672C\u6B21\u5DF2\u7ED3\u675F\uFF0C\u8BB0\u5F55 ${A} \u5206\u949F`:"\u672C\u6B21\u5DF2\u7ED3\u675F","success"),document.title="\u81EA\u6211\u63A7\u5236 \xB7 \u7231\u5E08\u5927"}else d==="resting"?(S(),b("done"),v("\u672C\u7EC4\u7ED3\u675F\uFF0C\u4F11\u606F\u4E00\u4E0B","success")):d==="done"&&(J.tab="notes",e.querySelectorAll("[data-tab]").forEach(A=>A.classList.toggle("active",A.dataset.tab==="notes")),await re(e))});let H=(A,z,ie)=>{let $=a.querySelector(A);$.querySelectorAll(".fc-chip").forEach(V=>{V.addEventListener("click",()=>{if(d==="focusing"||d==="resting"){v("\u8BA1\u65F6\u4E2D\u4E0D\u53EF\u6539\u8BBE\u7F6E\uFF0C\u8BF7\u5148\u6682\u505C\u540E\u8C03\u6574","error");return}$.querySelectorAll(".fc-chip").forEach(R=>R.classList.remove("on")),V.classList.add("on");let Y=$.querySelector(".fc-chip-input");Y&&(Y.value=""),t[z]=Number(ie?V.dataset.n:V.dataset.min),localStorage.setItem("focusCfg",JSON.stringify(t)),z==="focusMin"&&(o=h=t.focusMin*60),p()})});let B=$.querySelector(".fc-chip-input");B&&B.addEventListener("change",()=>{if(d==="focusing"||d==="resting"){v("\u8BA1\u65F6\u4E2D\u4E0D\u53EF\u6539\u8BBE\u7F6E\uFF0C\u8BF7\u5148\u6682\u505C\u540E\u8C03\u6574","error"),B.value="";return}let V=Number(B.value);!V||V<1||($.querySelectorAll(".fc-chip").forEach(Y=>Y.classList.remove("on")),t[z]=V,localStorage.setItem("focusCfg",JSON.stringify(t)),z==="focusMin"&&(o=h=t.focusMin*60),p())})};H("#fcFocusLen","focusMin",!1),H("#fcRestLen","restMin",!1),H("#fcRounds","rounds",!0),a.querySelectorAll("#fcBlock .fc-chip").forEach(A=>{A.addEventListener("click",()=>{let z=A.dataset.cat;t.blocked.includes(z)?(t.blocked=t.blocked.filter(ie=>ie!==z),A.classList.remove("on")):(t.blocked.push(z),A.classList.add("on")),localStorage.setItem("focusCfg",JSON.stringify(t)),u()})});let D=()=>{if(h>0&&(d==="focusing"||d==="resting"||d==="paused"))try{localStorage.setItem("focusRuntime",JSON.stringify({remaining:h,usedSec:r,round:c,totalSec:o,task:a.querySelector("#fcTask")?.value||"",savedAt:Date.now()}))}catch{}S(),window.__focusMode=null,document.title="\u81EA\u6211\u63A7\u5236 \xB7 \u7231\u5E08\u5927",Ie===D&&(Ie=null)};Ie=D,b("idle"),p(),u();try{let A=localStorage.getItem("focusRuntime");if(A){let z=JSON.parse(A);localStorage.removeItem("focusRuntime"),z&&z.savedAt&&Date.now()-z.savedAt<6*3600*1e3&&Number(z.remaining)>0&&(r=Number(z.usedSec)||0,c=Number(z.round)||0,o=Number(z.totalSec)||t.focusMin*60,h=Number(z.remaining),z.task&&(a.querySelector("#fcTask").value=z.task),b("paused"),p(),v("\u5DF2\u6062\u590D\u4E0A\u6B21\u6682\u505C\u7684\u4E13\u6CE8\uFF0C\u53EF\u70B9\u201C\u7EE7\u7EED\u4E13\u6CE8\u201D","success"))}}catch{}try{let A=document.createElement("div");A.className="card sc-focus-trend";let z=await m.get("/self/control/focus-stats?days=7"),ie=z&&z.daily||[],$=z&&z.total_minutes||0,B=340,V=180,Y=34,R=14,T=18,j=30,G=Math.max(30,Math.ceil(Math.max(...ie.map(X=>X.minutes),0)/30)*30),P=X=>Y+X*(B-Y-R)/Math.max(1,ie.length-1),F=X=>T+(1-X/G)*(V-T-j),te=ie.map((X,ge)=>`${P(ge).toFixed(1)},${F(X.minutes).toFixed(1)}`),de=te.length?`M${te[0]} L${te.slice(1).map(X=>X).join(" L")} L${P(ie.length-1).toFixed(1)},${(V-j).toFixed(1)} L${P(0).toFixed(1)},${(V-j).toFixed(1)} Z`:"",oe=[0,.5,1].map(X=>{let ge=(T+X*(V-T-j)).toFixed(1);return`<line x1="${Y}" y1="${ge}" x2="${B-R}" y2="${ge}" stroke="#e2e8f0" stroke-dasharray="3 4"/><text x="${Y-6}" y="${Number(ge)+4}" text-anchor="end" class="sc-ft-axis">${Math.round(G*(1-X))}</text>`}).join(""),ue=ie.map((X,ge)=>`<text x="${P(ge).toFixed(1)}" y="${V-9}" text-anchor="middle" class="sc-ft-axis">${i((X.date||"").slice(5))}</text>`).join(""),Ae=ie.map((X,ge)=>`<circle cx="${P(ge).toFixed(1)}" cy="${F(X.minutes).toFixed(1)}" r="3.5" class="sc-ft-dot"><title>${i(X.date)} \xB7 ${X.minutes} \u5206\u949F \xB7 ${X.count} \u6B21</title></circle>`).join("");A.innerHTML=`
      <div class="spread"><div class="card-title">\u8FD1 7 \u5929\u4E13\u6CE8\u8D8B\u52BF</div>
        <span class="sc-ft-unit">\u5355\u4F4D\uFF1A\u5206\u949F</span></div>
      <svg class="sc-ft-svg" viewBox="0 0 ${B} ${V}" role="img" aria-label="\u8FD1 7 \u5929\u4E13\u6CE8\u65F6\u95F4\u53D8\u5316\u6298\u7EBF\u56FE">
        <defs>
          <linearGradient id="scFtFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#7c3aed" stop-opacity=".28"/>
            <stop offset="100%" stop-color="#7c3aed" stop-opacity="0"/>
          </linearGradient>
        </defs>
        ${oe}
        ${de?`<path d="${de}" fill="url(#scFtFill)"/>`:""}
        <path d="M${te.join(" L")}" fill="none" stroke="#7c3aed" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/>
        ${Ae}
        ${ue}
      </svg>
      ${$?"":'<div class="muted" style="margin-top:2px;font-size:11px">\u8FD1 7 \u5929\u8FD8\u6CA1\u6709\u5B8C\u6210\u4E13\u6CE8\uFF0C\u5F00\u59CB\u4E00\u6B21\u756A\u8304\u949F\u540E\u4F1A\u5728\u8FD9\u91CC\u770B\u5230\u6BCF\u5929\u7684\u53D8\u5316\u3002</div>'}`;let be=a.querySelector("#focusTrend");be&&be.appendChild(A)}catch{}}async function Hi(e,a){let s=await m.get("/self/control/notes");J.notes=s;let t={};s.forEach(l=>{let c=(l.created_at||"").slice(0,7);c&&(t[c]=t[c]||[]).push(l)});let n=Object.keys(t).sort().reverse(),d=new Set(s.map(l=>(l.created_at||"").slice(0,10))).size;a.innerHTML=`
    <div class="card" style="margin-bottom:16px">
      <div class="spread">
        <div class="row" style="gap:8px;align-items:center">
          <span class="sc-note-ico">\u270E</span>
          <div class="card-title">\u968F\u8BB0</div>
        </div>
        <div class="row">
          <span class="tag tag-blue">\u4E0E\u4E3B\u9875\u968F\u8BB0\u540C\u6B65</span>
          <a class="btn btn-ghost btn-sm" href="#/home">\u56DE\u5230\u4E3B\u9875\u968F\u8BB0 \u203A</a>
        </div>
      </div>
      <div class="muted" style="margin-top:4px;font-size:11.5px">\u968F\u65F6\u8BB0\u4E0B\u60F3\u6CD5\u3001\u65E5\u8BB0\u3001\u8BFB\u6587\u7AE0\u65F6\u7684\u65B0\u70B9\u5B50\uFF1B\u4E3B\u9875\u4FA7\u680F\u300C\u968F\u8BB0\u300D\u8FDB\u6765\u5C31\u662F\u8FD9\u91CC\u3002</div>
      <div class="row" style="margin-top:10px;align-items:flex-start">
        <textarea class="input" id="noteText" rows="3" placeholder="\u521A\u60F3\u5230\u4EC0\u4E48\uFF1F\u4E00\u53E5\u8BDD\u4E5F\u884C\u3002&#10;\u4F8B\u5982\uFF1A\u8BFB\u300AXXX\u300B\u7B2C 3 \u7AE0\u60F3\u5230\u53EF\u4EE5\u7528\u95EE\u5377\u8865\u6570\u636E\u2026\u2026" style="flex:1"></textarea>
        <div style="display:flex;flex-direction:column;gap:8px">
          <button class="btn btn-primary" data-act="save-note">\u4FDD\u5B58\u8BB0\u5F55</button>
        </div>
      </div>
    </div>

    <div class="card sc-organize" style="margin-bottom:16px">
      <div class="spread">
        <div class="card-title">\u6574\u7406</div>
        <span class="tag">${d} \u5929 \xB7 ${s.length} \u6761</span>
      </div>
      ${n.length?n.map((l,c)=>{let r=t[l],o=new Set(r.map(h=>(h.created_at||"").slice(0,10))).size;return`<details class="sc-org-group" ${c===0?"open":""}>
              <summary>
                <b>${l.replace("-"," \u5E74 ")} \u6708</b>
                <span>${r.length} \u6761 \xB7 ${o} \u5929</span>
                <em>\u5C55\u5F00 / \u6536\u8D77</em>
              </summary>
              <div class="sc-org-list">
                ${r.slice(0,6).map(h=>`<div class="sc-org-item">
                  <span class="sc-org-date">${i((h.created_at||"").slice(5,10))}</span>
                  <span class="sc-org-text">${i((h.content||"").slice(0,60))}</span>
                  ${h.task_id?'<em class="ok">\u5DF2\u8F6C\u4EFB\u52A1</em>':""}
                </div>`).join("")}
                ${r.length>6?`<div class="muted" style="font-size:11px;padding:4px 0">\u8FD8\u6709 ${r.length-6} \u6761\u66F4\u65E9\u7684\u8BB0\u5F55\u2026</div>`:""}
              </div>
            </details>`}).join(""):'<div class="muted" style="margin-top:10px">\u8FD8\u6CA1\u6709\u8BB0\u5F55\u53EF\u4EE5\u6574\u7406\uFF0C\u5148\u5199\u4E00\u6761\u968F\u8BB0\u5427\u3002</div>'}
    </div>

    <div class="grid grid-2">
      ${s.length?s.map(l=>`
        <div class="card">
          <div style="font-size:13px;white-space:pre-wrap">${i(l.content)}</div>
          <div class="row" style="margin-top:8px">
            <span class="muted" style="font-size:11px">${i(l.created_at.slice(0,10))}</span>
            ${l.task_id?'<span class="tag tag-green">\u5DF2\u8F6C\u4EFB\u52A1</span>':""}
          </div>
          ${l.task_id?"":`<button class="btn btn-ghost btn-sm" style="margin-top:8px" data-act="note-task" data-id="${l.id}">\u8F6C\u4E3A\u4EFB\u52A1</button>`}
        </div>`).join(""):'<div class="card"><div class="muted">\u8FD8\u6CA1\u6709\u8BB0\u5F55\u3002\u60F3\u6CD5\u3001\u5FC3\u5F97\u3001\u65E5\u8BB0\u90FD\u53EF\u4EE5\u5148\u6254\u8FDB\u6765\u3002</div></div>'}
    </div>`,a.querySelector('[data-act="save-note"]').addEventListener("click",async()=>{let l=a.querySelector("#noteText").value.trim();if(!l)return v("\u5199\u70B9\u4EC0\u4E48");await m.post("/self/control/notes",{content:l}),v("\u5DF2\u6536\u8FDB\u8BB0\u5F55\u7BB1","success"),await re(e)}),a.querySelectorAll('[data-act="note-task"]').forEach(l=>l.addEventListener("click",async()=>{await m.post(`/self/control/notes/${l.dataset.id}/task`,{}),v("\u5DF2\u8F6C\u4E3A\u4ECA\u5929\u7684\u4EFB\u52A1","success"),await re(e)}))}var Ii={rocket:"xiangsufeng_huojian",flame:"xiangsufeng_dangao",book:"xiangsufeng_shuji",arrow:"xiangsufeng_xunzhang",target:"xiangsufeng_shouyinji",moon:"xiangsufeng_xiangji",box:"xiangsufeng_xinfeng",sun:"xiangsufeng_laba",diamond:"xiangsufeng_dingwei",cap:"xiangsufeng_dayinji",star:"xiangsufeng_xianhua",trophy:"xiangsufeng_liwu",calendar:"xiangsufeng_wenjianjia",crown:"xiangsufeng_yiwanmian"};function Wt(e,a=""){let s=Ii[e]||"xiangsufeng_xunzhang";return`<img class="badge-img ${a}" src="/static/img/badges/${s}.png" alt="" draggable="false">`}function Ni(e){let a=e==="pink"?'<span class="sp-deco heart">\u2665</span>':"";return`<div class="sc-skin-preview p-${i(e)}">
    <div class="sp-bar"><i></i><i></i><i></i></div>
    <div class="sp-body">
      <div class="sp-card"><b></b><em></em><u></u></div>
      <div class="sp-side"><s></s><s></s><s></s></div>
    </div>
    ${a}
  </div>`}async function Di(e,a){let[s,t]=await Promise.all([m.get("/self/control/achievements"),m.get("/self/control/shop")]);J.badges=s,J.shop=t;let n=s.xp_breakdown||[],d=n.length?`<div class="card" style="margin-bottom:16px">
      <div class="spread"><div class="card-title">\u79EF\u5206\u6784\u6210 \xB7 \u5168\u7AD9\u8054\u52A8</div><span class="muted" style="font-size:12px">\u70B9\u51FB\u5361\u7247\u67E5\u770B\u6BCF\u7B14\u79EF\u5206\u7684\u83B7\u5F97\u65F6\u95F4</span></div>
      <div class="grid grid-4" style="margin-top:12px">
        ${n.map(c=>`
          <div class="sc-xp-item" data-act="xp-log" data-group="${i(c.group)}" role="button" tabindex="0" title="\u67E5\u770B${i(c.label)}\u7684\u660E\u7EC6">
            <div class="spread"><strong style="font-size:13px">${i(c.label)}</strong><b style="font-size:15px;${c.xp<0?"color:var(--danger)":""}">${c.xp>=0?"+":""}${c.xp}</b></div>
            <div class="muted" style="font-size:11px;margin-top:4px">${c.count} \u6B21\u8BB0\u5F55 \xB7 <span class="sc-xp-more">\u660E\u7EC6 \u203A</span></div>
          </div>`).join("")}
      </div>
      <div class="muted" style="margin-top:10px;font-size:11px">\u83B7\u5F97\uFF1A\u4EFB\u52A1\u5B8C\u6210 +2\uFF08\u65E5\u4E0A\u9650 20\uFF09\xB7 \u56FE\u4E66\u9986\u7B7E\u5230 +10 \xB7 \u6BCF\u65E5\u590D\u76D8 +5 \xB7 \u4E13\u6CE8\u5B8C\u6210 +2\uFF08>20 \u5206\u949F\uFF0C\u65E5\u4E0A\u9650 10\uFF09\u3002\u6263\u9664\uFF1A\u4EFB\u52A1\u903E\u671F -10 \xB7 \u9884\u7EA6\u8D85\u65F6\u672A\u7B7E\u5230 -50 \xB7 \u5151\u6362\u6263\u79EF\u5206\u3002\u4FEE\u6539\u590D\u76D8\u4E0D\u91CD\u590D\u52A0\u79EF\u5206\u3002</div>
    </div>`:"";a.innerHTML=`
    <div class="grid grid-3" style="margin-bottom:16px">
      <div class="stat"><div class="stat-num">Lv.${s.level}</div><div class="stat-label">\u7D2F\u8BA1 ${s.xp} \u79EF\u5206 \xB7 \u8DDD\u4E0B\u4E00\u7EA7 ${100-s.level_progress}</div></div>
      <div class="stat"><div class="stat-num">${s.streak}<span class="unit">\u5929</span></div><div class="stat-label">\u8FDE\u7EED\u6709\u6548\u65E5</div></div>
      <div class="stat"><div class="stat-num">${t.balance}</div><div class="stat-label">\u53EF\u7528\u79EF\u5206\uFF08\u5151\u6362\u53EA\u6263\u8FD9\u91CC\uFF09</div></div>
    </div>

    ${d}

    <div class="card sc-badge-card">
      <button type="button" class="sc-badge-head" data-act="toggle-badges" aria-expanded="${J.badgeOpen?"true":"false"}">
        <span class="sc-badge-head-medal"><img class="sc-badge-head-img" src="/static/img/badges/xiangsufeng_xunzhang.png" alt=""></span>
        <span class="sc-badge-head-main"><b>\u5FBD\u7AE0</b><i>\u5DF2\u6536\u96C6 ${s.badges.filter(c=>c.owned).length}/${s.badges.length} \xB7 \u6708\u5EA6\u5FBD\u7AE0\u6BCF\u6708\u81EA\u52A8\u5237\u65B0</i></span>
        <em>${J.badgeOpen?"\u6536\u8D77 \u25B4":"\u5C55\u5F00 \u25BE"}</em>
      </button>
      ${J.badgeOpen?`<div class="sc-badge-wall">
            ${[{key:"owned",label:"\u5DF2\u83B7\u5F97",items:s.badges.filter(c=>c.owned)},{key:"ready",label:"\u53EF\u5151\u6362",items:s.badges.filter(c=>!c.owned&&c.progress.met)},{key:"todo",label:"\u672A\u8FBE\u6210",items:s.badges.filter(c=>!c.owned&&!c.progress.met)}].filter(c=>c.items.length).map(c=>`<div class="sc-bw-group">
              <div class="sc-bw-head"><b>${c.label}</b><span>${c.items.length}</span></div>
              <div class="sc-bw-grid">
                ${c.items.map(r=>`<button type="button" class="sc-mb ${r.owned?"owned":""} ${r.progress.met&&!r.owned?"ready":""}" data-act="badge-detail" data-code="${i(r.code)}" title="${i(r.condition)}">
                  <span class="sc-mb-hex i-${i(r.icon)}">
                    ${Wt(r.icon,"sc-mb-img")}
                    ${r.owned?'<i class="sc-mb-mark ok">\u2713</i>':""}
                  </span>
                  <span class="sc-mb-name">${i(r.name)}</span>
                  <span class="sc-mb-prog">${r.owned?"\u5DF2\u62E5\u6709":`${r.progress.cur}/${r.progress.target}`}</span>
                </button>`).join("")}
              </div>
            </div>`).join("")}
          </div>`:`<div class="sc-badge-strip">
            ${s.badges.filter(c=>c.owned).slice(0,8).map(c=>`<span class="sc-bs-item i-${i(c.icon)}" title="${i(c.name)}">${Wt(c.icon,"sc-bs-img")}</span>`).join("")||'<span class="muted" style="font-size:12px">\u8FD8\u6CA1\u6709\u5FBD\u7AE0\uFF0C\u53BB\u5B8C\u6210\u4ECA\u65E5\u4EFB\u52A1\u6216\u4E13\u6CE8\u4E00\u6B21\u5427</span>'}
            <span class="muted" style="font-size:11px;margin-left:auto">\u70B9\u51FB\u4E0A\u65B9\u5C55\u5F00\u5168\u90E8\u5FBD\u7AE0</span>
          </div>`}
    </div>

    <div class="card" style="margin-top:16px">
      <div class="spread"><div class="card-title">\u76AE\u80A4\u5546\u5E97</div><span class="muted" style="font-size:12px">\u53EF\u7528 ${t.balance} \u79EF\u5206</span></div>
      <div class="grid grid-2" style="margin-top:12px">
        ${t.themes.map(c=>`
          <div class="sc-skin-card">
            ${Ni(c.code)}
            <div class="spread" style="margin-top:8px"><strong style="font-size:13px">${i(c.name)}</strong><span class="muted" style="font-size:11px">${c.price?c.price+" \u79EF\u5206":"\u514D\u8D39"}</span></div>
            <div class="muted" style="font-size:11px;margin-top:2px">${i(c.desc)}</div>
            <div style="margin-top:8px">
              ${c.unlocked?`<button class="btn btn-ghost btn-sm" data-act="apply-theme" data-code="${c.code}">\u4F7F\u7528</button>`:`<button class="btn btn-primary btn-sm" data-act="redeem" data-code="${c.code}">\u5151\u6362\u5E76\u4F7F\u7528</button>`}
            </div>
          </div>`).join("")}
      </div>
      <div class="muted" style="margin-top:10px;font-size:11px">\u83B7\u5F97\uFF1A\u4EFB\u52A1\u5B8C\u6210 +2\uFF08\u65E5\u4E0A\u9650 20\uFF09\xB7 \u56FE\u4E66\u9986\u7B7E\u5230 +10\uFF08\u6BCF\u5929\u6700\u591A\u4E00\u6B21\uFF09\xB7 \u6BCF\u65E5\u590D\u76D8 +5 \xB7 \u4E13\u6CE8\u5B8C\u6210 +2\uFF08>20 \u5206\u949F\uFF0C\u65E5\u4E0A\u9650 10\uFF09\uFF0C\u6BCF\u65E5\u603B\u4E0A\u9650 100 \u79EF\u5206\u3002\u6CA1\u6709\u5145\u503C\u5165\u53E3\u3002</div>
    </div>`;let l=c=>{at(c),m.post("/self/control/shop/apply",{code:c}).catch(()=>{})};a.querySelectorAll('[data-act="toggle-badges"]').forEach(c=>c.addEventListener("click",async()=>{J.badgeOpen=!J.badgeOpen,await re(e)})),a.querySelectorAll('[data-act="badge-detail"]').forEach(c=>c.addEventListener("click",()=>{let r=(J.badges&&J.badges.badges||[]).find(o=>o.code===c.dataset.code);r&&Pi(e,r)})),a.querySelectorAll('[data-act="apply-theme"]').forEach(c=>c.addEventListener("click",()=>{l(c.dataset.code),v("\u5DF2\u5207\u6362\u76AE\u80A4")})),a.querySelectorAll('[data-act="redeem"]').forEach(c=>c.addEventListener("click",async()=>{try{let r=await m.post("/self/control/shop/redeem",{code:c.dataset.code});String(c.dataset.code).startsWith("badge_")||l(c.dataset.code),v(`\u5151\u6362\u6210\u529F\uFF0C\u4F59\u989D ${r.balance}`,"success"),await re(e)}catch(r){v(r.message||"\u5151\u6362\u5931\u8D25")}})),a.querySelectorAll('[data-act="xp-log"]').forEach(c=>c.addEventListener("click",()=>{let r=c.querySelector("strong")?.textContent?.trim()||"";Ri(c.dataset.group,r)}))}function Pi(e,a){let s=Math.min(100,Math.round(a.progress.cur/Math.max(1,a.progress.target)*100)),t=J.shop&&J.shop.balance||0,n=a.owned?`<span class="muted">${a.kind==="monthly"?"\u672C\u6708\u5DF2\u5151\u6362\uFF0C\u4E0B\u6708\u81EA\u52A8\u5237\u65B0":"\u5DF2\u6C38\u4E45\u62E5\u6709"}</span>`:a.progress.met?a.affordable?`<button class="btn btn-primary btn-sm" data-act="redeem-modal" data-code="${i(a.code)}">\u5151\u6362 \xB7 ${a.price} \u79EF\u5206</button>`:`<span class="muted">\u5DF2\u8FBE\u6210\uFF0C\u8FD8\u5DEE ${a.price-t} \u79EF\u5206</span>`:`<span class="muted">\u8FBE\u6210\u6761\u4EF6\u540E\u53EF\u7528 ${a.price} \u79EF\u5206\u5151\u6362</span>`;Z({title:`${a.name} \xB7 \u5FBD\u7AE0\u8BE6\u60C5`,hideOk:!0,cancelText:"\u5173\u95ED",body:`<div class="sc-bd">
      <div class="sc-bd-medal i-${i(a.icon)} ${a.owned?"owned":a.progress.met?"ready":"unowned"}">${Wt(a.icon,"sc-bd-img")}</div>
      <div class="sc-bd-body">
        <div class="sc-bd-tags">
          <span class="tag tag-blue">${a.kind==="monthly"?"\u6708\u5EA6\u5FBD\u7AE0 \xB7 \u6BCF\u6708\u5237\u65B0":"\u6210\u5C31\u5FBD\u7AE0"}</span>
          <span class="tag">${i(a.category)}</span>
          ${a.owned?'<span class="tag tag-green">\u5DF2\u62E5\u6709</span>':""}
        </div>
        <div class="sc-bd-cond">\u6761\u4EF6\uFF1A${i(a.condition)}</div>
        <div class="sc-badge-prog"><i style="width:${s}%"></i></div>
        <div class="sc-badge-prog-text">${a.progress.cur}/${a.progress.target}${a.progress.met?" \xB7 \u5DF2\u8FBE\u6210":""}</div>
        <div class="sc-bd-act">${n}</div>
      </div>
    </div>`});let d=document.querySelector('#modalRoot [data-act="redeem-modal"]');d&&d.addEventListener("click",async l=>{let c=l.currentTarget;c.disabled=!0;try{let r=await m.post("/self/control/shop/redeem",{code:c.dataset.code});v(`\u5151\u6362\u6210\u529F\uFF0C\u4F59\u989D ${r.balance}`,"success"),Te(),await re(e)}catch(r){v(r.message||"\u5151\u6362\u5931\u8D25","error"),c.disabled=!1}})}async function Ri(e,a){let s=null;try{s=await m.get(`/self/control/xp-logs?group=${encodeURIComponent(e)}&limit=80`)}catch(d){v(d.message||"\u52A0\u8F7D\u79EF\u5206\u660E\u7EC6\u5931\u8D25","error");return}let t=s&&s.logs||[],n=t.length?t.map(d=>{let l=String(d.time||"").replace("T"," ").slice(0,16),c=d.xp>=0?"+":"";return`<div class="sc-xp-log-row">
          <span class="sc-xp-log-time">${i(l)}</span>
          <span class="sc-xp-log-label">${i(d.label||d.action||"")}</span>
          <b class="sc-xp-log-xp ${d.xp<0?"neg":""}">${c}${d.xp}</b>
        </div>`}).join(""):'<div class="muted" style="padding:12px 0">\u8FD9\u4E00\u7C7B\u8FD8\u6CA1\u6709\u79EF\u5206\u8BB0\u5F55\u3002</div>';Z({title:`${a||"\u79EF\u5206"} \xB7 \u660E\u7EC6\uFF08${t.length} \u6761\uFF09`,hideOk:!0,cancelText:"\u5173\u95ED",body:`<div class="sc-xp-logs">${n}</div>
      <div class="muted" style="font-size:11px;margin-top:10px">\u65F6\u95F4\u4E3A\u4F60\u5B9E\u9645\u83B7\u5F97/\u6263\u9664\u8BE5\u79EF\u5206\u7684\u65F6\u523B\u3002</div>`})}function Fi(e){let a=J.data?.checkin||{};Z({title:"\u4ECA\u5929\u7684\u72B6\u6001",body:`
      <div class="grid grid-2">
        <div class="field"><label>\u6628\u591C\u7761\u7720\uFF08\u5C0F\u65F6\uFF09</label><input class="input" id="ckSleep" type="number" step="0.5" value="${a.sleep_hours||7}"></div>
        <div class="field"><label>\u7CBE\u529B 1\u20135</label><select class="select" id="ckEnergy">${[1,2,3,4,5].map(s=>`<option ${Number(a.energy)===s?"selected":""}>${s}</option>`).join("")}</select></div>
        <div class="field"><label>\u5FC3\u60C5 1\u20135</label><select class="select" id="ckMood">${[1,2,3,4,5].map(s=>`<option ${Number(a.mood)===s?"selected":""}>${s}</option>`).join("")}</select></div>
        <div class="field"><label>\u5907\u6CE8\uFF08\u53EF\u9009\uFF09</label><input class="input" id="ckNote" value="${i(a.note||"")}"></div>
      </div>`,okText:"\u4FDD\u5B58",onOk:async()=>{await m.post("/self/control/checkins",{date:K(),sleep_hours:Number(document.getElementById("ckSleep").value),energy:Number(document.getElementById("ckEnergy").value),mood:Number(document.getElementById("ckMood").value),note:document.getElementById("ckNote").value}),v("\u5DF2\u8BB0\u5F55\uFF0C+5 \u79EF\u5206","success"),await re(e)}})}function Ya(e){Z({title:"\u65B0\u5EFA\u4EFB\u52A1",body:`
      <div class="field"><label>\u6807\u9898\uFF08\u52A8\u8BCD\u5F00\u5934\uFF09</label><input class="input" id="ntTitle" placeholder="\u4F8B\u5982\uFF1A\u8865\u56FE 3 \u7684\u8BEF\u5DEE\u68D2"></div>
      <div class="grid grid-3">
        <div class="field"><label>\u573A\u666F</label><select class="select" id="ntScene"><option value="work">\u5DE5\u4F5C</option><option value="study">\u5B66\u4E60</option><option value="life">\u751F\u6D3B</option><option value="fitness">\u5065\u8EAB</option></select></div>
        <div class="field"><label>\u4F18\u5148\u7EA7</label><select class="select" id="ntPriority"><option>P0</option><option selected>P1</option><option>P2</option></select></div>
        <div class="field"><label>\u9884\u8BA1\u5206\u949F</label><input class="input" id="ntEstimate" type="number" value="30" min="5" step="5"></div>
      </div>
      <div class="grid grid-2">
        <div class="field"><label>\u5B89\u6392\u65E5</label><input class="input" id="ntPlan" type="date" value="${K()}"></div>
        <div class="field"><label>\u622A\u6B62\u65E5\uFF08\u53EF\u7A7A\uFF09</label><input class="input" id="ntDue" type="date"></div>
      </div>
      <div class="field"><label>\u4E0B\u4E00\u6B65\u52A8\u4F5C</label><input class="input" id="ntNext" placeholder="\u4E00\u4E2A 30 \u5206\u949F\u5185\u80FD\u5F00\u59CB\u7684\u52A8\u4F5C"></div>`,okText:"\u521B\u5EFA",onOk:async()=>{let a=document.getElementById("ntTitle").value.trim();if(!a)return v("\u6807\u9898\u4E0D\u80FD\u4E3A\u7A7A");await m.post("/self/control/tasks",{title:a,scene:document.getElementById("ntScene").value,priority:document.getElementById("ntPriority").value,estimate_min:Number(document.getElementById("ntEstimate").value),plan_date:document.getElementById("ntPlan").value,due_at:document.getElementById("ntDue").value,next_action:document.getElementById("ntNext").value,status:"planned"}),v("\u4EFB\u52A1\u5DF2\u521B\u5EFA","success"),await re(e)}})}function Oi(e){Z({title:"\u65B0\u5EFA\u8BBA\u6587 / \u9879\u76EE",body:`
      <div class="field"><label>\u6807\u9898</label><input class="input" id="npTitle"></div>
      <div class="grid grid-2">
        <div class="field"><label>\u9636\u6BB5</label><select class="select" id="npStage">${["\u9009\u9898","\u5B9E\u9A8C","\u5199\u4F5C","\u6295\u7A3F","\u8FD4\u4FEE","\u63A5\u6536","\u6401\u7F6E"].map(a=>`<option>${a}</option>`).join("")}</select></div>
        <div class="field"><label>\u76EE\u6807\u671F\u520A</label><input class="input" id="npVenue"></div>
        <div class="field"><label>\u622A\u7A3F\u65E5</label><input class="input" id="npDeadline" type="date"></div>
        <div class="field"><label>\u5F53\u524D\u5361\u70B9</label><input class="input" id="npBlocker"></div>
      </div>
      <div class="field"><label>\u4E0B\u4E00\u6B65</label><input class="input" id="npNext"></div>`,okText:"\u521B\u5EFA",onOk:async()=>{let a=document.getElementById("npTitle").value.trim();if(!a)return v("\u6807\u9898\u5FC5\u586B");await m.post("/self/control/papers",{title:a,stage:document.getElementById("npStage").value,venue:document.getElementById("npVenue").value,deadline:document.getElementById("npDeadline").value,blocker:document.getElementById("npBlocker").value,next_action:document.getElementById("npNext").value}),v("\u5DF2\u521B\u5EFA\uFF0C+50 \u79EF\u5206","success"),await re(e)}})}function zi(e,a){let s=(J.papers||[]).find(t=>String(t.id)===String(a));Z({title:"\u63A8\u8FDB\u9636\u6BB5",body:`
      <div class="field"><label>\u76EE\u6807\u9636\u6BB5</label><select class="select" id="spStage">${["\u9009\u9898","\u5B9E\u9A8C","\u5199\u4F5C","\u6295\u7A3F","\u8FD4\u4FEE","\u63A5\u6536","\u6401\u7F6E"].map(t=>`<option ${s&&s.stage===t?"selected":""}>${t}</option>`).join("")}</select></div>
      <div class="field"><label>\u66F4\u65B0\u5361\u70B9\uFF08\u7559\u7A7A\u8868\u793A\u5DF2\u89E3\u51B3\uFF09</label><input class="input" id="spBlocker" value="${i(s?.blocker||"")}"></div>
      <div class="field"><label>\u4E0B\u4E00\u6B65</label><input class="input" id="spNext" value="${i(s?.next_action||"")}"></div>`,okText:"\u786E\u8BA4\u63A8\u8FDB",onOk:async()=>{await m.post(`/self/control/papers/${a}/stage`,{stage:document.getElementById("spStage").value,blocker:document.getElementById("spBlocker").value,next_action:document.getElementById("spNext").value}),v("\u9636\u6BB5\u5DF2\u66F4\u65B0\uFF0C+50 \u79EF\u5206","success"),await re(e)}})}function gt(e){if(!e)return"";let a=new Date(e.replace(" ","T"));return isNaN(a.getTime())?String(e).slice(11,16):`${String(a.getHours()).padStart(2,"0")}:${String(a.getMinutes()).padStart(2,"0")}`}ve();var Vi=`<svg viewBox="0 0 64 64" aria-hidden="true">
  <circle cx="32" cy="32" r="31" fill="#eef4ff"/>
  <circle cx="32" cy="32" r="25" fill="#f6c453"/>
  <circle cx="20" cy="20" r="7" fill="#f6c453"/><circle cx="44" cy="20" r="7" fill="#f6c453"/>
  <circle cx="19" cy="43" r="7" fill="#f6c453"/><circle cx="45" cy="43" r="7" fill="#f6c453"/>
  <circle cx="32" cy="31" r="17" fill="#fff6e8"/>
  <ellipse cx="25" cy="29" rx="4.6" ry="4.2" fill="#fff" stroke="#1b4b8f" stroke-width="1.6"/>
  <ellipse cx="39" cy="29" rx="4.6" ry="4.2" fill="#fff" stroke="#1b4b8f" stroke-width="1.6"/>
  <circle cx="25" cy="29.5" r="1.8" fill="#1b2a3f"/><circle cx="39" cy="29.5" r="1.8" fill="#1b2a3f"/>
  <path d="M31 29 h2 M27 21 h10" stroke="#1b4b8f" stroke-width="1.4" stroke-linecap="round"/>
  <path d="M32 33.5 l-2.2 2.6 h4.4 z" fill="#d98f6b"/>
  <path d="M26 39 q6 5 12 0" stroke="#a55a3a" stroke-width="1.8" fill="none" stroke-linecap="round"/>
  <circle cx="21" cy="36" r="2.2" fill="#f7b7a3" opacity=".8"/>
  <circle cx="43" cy="36" r="2.2" fill="#f7b7a3" opacity=".8"/>
</svg>`,Ui=`<svg viewBox="0 0 64 64" aria-hidden="true">
  <circle cx="32" cy="32" r="31" fill="#1b4b8f"/>
  <circle cx="32" cy="25" r="9.5" fill="#e8f0fb"/>
  <path d="M14 53 c0-10 8-16 18-16 s18 6 18 16" fill="#e8f0fb"/>
  <path d="M20 17 q12-8 24 0" stroke="#d9a441" stroke-width="2.4" fill="none" stroke-linecap="round"/>
  <circle cx="50" cy="16" r="2.2" fill="#d9a441"/>
  <circle cx="13" cy="28" r="1.6" fill="#d9a441" opacity=".8"/>
</svg>`,Ga={\u6674:"\u2600\uFE0F",\u57FA\u672C\u6674:"\u{1F324}\uFE0F",\u591A\u4E91:"\u26C5",\u9634:"\u2601\uFE0F",\u6709\u96FE:"\u{1F32B}\uFE0F",\u971C\u96FE:"\u{1F32B}\uFE0F",\u6BDB\u6BDB\u96E8:"\u{1F326}\uFE0F",\u5C0F\u96E8:"\u{1F327}\uFE0F",\u4E2D\u96E8:"\u{1F327}\uFE0F",\u5927\u96E8:"\u{1F327}\uFE0F",\u9635\u96E8:"\u{1F326}\uFE0F",\u5F3A\u9635\u96E8:"\u{1F327}\uFE0F",\u66B4\u96E8:"\u{1F327}\uFE0F",\u5C0F\u96EA:"\u{1F328}\uFE0F",\u4E2D\u96EA:"\u{1F328}\uFE0F",\u5927\u96EA:"\u2744\uFE0F",\u96EA\u7C92:"\u2744\uFE0F",\u9635\u96EA:"\u{1F328}\uFE0F",\u5F3A\u9635\u96EA:"\u2744\uFE0F",\u96F7\u9635\u96E8:"\u26C8\uFE0F",\u96F7\u9635\u96E8\u4F34\u51B0\u96F9:"\u26C8\uFE0F",\u5F3A\u96F7\u66B4\u4F34\u51B0\u96F9:"\u26C8\uFE0F",\u51BB\u96E8:"\u{1F327}\uFE0F",\u5F3A\u51BB\u96E8:"\u{1F327}\uFE0F",\u51BB\u6BDB\u6BDB\u96E8:"\u{1F327}\uFE0F"},Wi=new Intl.DateTimeFormat("zh-CN",{timeZone:"Asia/Shanghai",hour12:!1,year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit"});function Yt(e){if(e instanceof Date)return e;let a=String(e||"").trim();if(!a)return new Date;if(/Z$|[+-]\d{2}:?\d{2}$/.test(a)){let n=new Date(a);if(!Number.isNaN(n.getTime()))return n}let s=a.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?/);if(s)return new Date(Date.UTC(+s[1],+s[2]-1,+s[3],+(s[4]||0)-8,+(s[5]||0),+(s[6]||0)));let t=new Date(a);return Number.isNaN(t.getTime())?new Date:t}function Gt(e){let a={};return Wi.formatToParts(Yt(e)).forEach(s=>{s.type!=="literal"&&(a[s.type]=s.value)}),a}function Yi(e){let a=Gt(e||new Date);return`${a.hour}:${a.minute}`}function bt(e){let a=Gt(e);return`${a.year}-${a.month}-${a.day}`}function Gi(e,a){let s=Yt(a||new Date),t=new Date(s.getTime()-864e5),n=bt(e);if(n===bt(s))return"\u4ECA\u5929";if(n===bt(t))return"\u6628\u5929";let d=Gt(e),l=["\u65E5","\u4E00","\u4E8C","\u4E09","\u56DB","\u4E94","\u516D"][new Date(Date.UTC(+d.year,+d.month-1,+d.day)).getUTCDay()];return`${Number(d.month)}\u6708${Number(d.day)}\u65E5 \u5468${l}`}function Qi(e,a){return Yt(e||a)}function Ki(e){let a=e.current||{},s=(e.forecast||[]).slice(0,7),t=s.map((n,d)=>{let l=d===0?"\u4ECA\u5929":d===1?"\u660E\u5929":d===2?"\u540E\u5929":n.weekday;return`<div class="weather-row ${d===0?"today":""}">
        <span class="weather-day">${i(l)}</span>
        <span class="weather-emoji">${Ga[n.text]||"\u{1F321}\uFE0F"}</span>
        <span class="weather-desc">${i(n.text)}</span>
        <span class="weather-range">${i(n.min)}~${i(n.max)}\xB0C</span>
        <span class="weather-precip">${n.precip!=null&&n.precip!==""?`${i(n.precip)}%`:""}</span>
      </div>`}).join("");return`<div class="weather-card">
    <div class="weather-main">
      <div class="weather-ico">${Ga[a.text]||"\u{1F321}\uFE0F"}</div>
      <div>
        <div class="small">${i(e.city||"\u5F90\u5DDE")} \xB7 \u73B0\u5728</div>
        <div class="weather-temp">${i(a.temp)}<span>\xB0C</span></div>
        <div class="muted">${i(a.text)} \xB7 \u4F53\u611F ${i(a.feels)}\xB0C \xB7 \u6E7F\u5EA6 ${i(a.humidity)}%</div>
      </div>
      <span class="tag tag-blue" style="margin-left:auto">${s.length} \u5929\u9884\u62A5</span>
    </div>
    <div class="weather-list">${t}</div>
    <div class="muted" style="margin-top:6px">\u6570\u636E\u6E90\uFF1A${i(e.source)}</div>
  </div>`}function Qa(e=[]){return e.length?`<div class="grid" style="margin-top:8px">${e.map(a=>{if(a.kind==="metric")return`<div class="stat" style="padding:11px"><div class="stat-num" style="font-size:18px">${i(a.value)}</div><div class="stat-label">${i(a.label)}</div></div>`;if(a.kind==="campus")return`<div class="card" style="padding:12px"><strong>${i(a.name)}</strong><div class="muted">${i(a.address)}</div></div>`;if(a.kind==="calendar")return`<div class="card" style="padding:12px"><strong>${i(a.title)}</strong><div class="muted">${i(a.start)}${a.end&&a.end!==a.start?` \u81F3 ${i(a.end)}`:""}</div></div>`;if(a.kind==="route")return`<div class="card" style="padding:12px"><strong>\u5230 ${i(a.destination.name)}</strong>
          <div class="muted">\u7EA6 ${a.distance_m} \u7C73 \xB7 ${a.minutes} \u5206\u949F</div>
          <div class="muted" style="margin-top:5px">${a.steps.map(s=>i(s)).join(" \u2192 ")}</div>
          <div class="row" style="margin-top:8px">
            <a class="btn btn-ghost btn-sm" href="#/life/nav?to=${a.destination.id}">\u6253\u5F00\u5730\u56FE</a>
            ${a.amap_url?`<a class="btn btn-soft btn-sm" href="${i(a.amap_url)}" target="_blank" rel="noopener">\u5728\u9AD8\u5FB7\u5730\u56FE\u4E2D\u6253\u5F00 \u2197</a>`:""}
          </div></div>`;if(a.kind==="buddy")return`<div class="card" style="padding:12px"><span class="tag tag-blue">${i(a.type)}</span><strong style="margin-left:6px">${i(a.title)}</strong><div class="muted">${i(a.time)} \xB7 ${i(a.place)}</div></div>`;if(a.kind==="place")return`<div class="card" style="padding:12px"><strong>${i(a.name)}</strong><a class="btn btn-ghost btn-sm" href="#/life/nav?to=${a.id}">\u9009\u62E9\u5E76\u5BFC\u822A</a></div>`;if(a.kind==="weather")return Ki(a);if(a.kind==="action"){let s={office:"#/office",lab:"#/work/lab",self:"#/life/self/control",repair:"#/repair",buddy:"#/life/buddy",deal:"#/life/deal",hub:"#/hub",home:"#/home"},t=String(a.target||"").trim(),n=a.action_type==="navigate"?`#/life/nav${t?`?to=${encodeURIComponent(t)}`:""}`:a.action_type==="book_seat"?"#/work/library":a.action_type==="book_classroom"?"#/work/classroom":t.startsWith("#")?t:s[t.toLowerCase()]||"#/office";return`<a class="ai-action" href="${i(n)}">
          <span class="ai-action-ico">\u2726</span>
          <span>${i(a.label||"\u53BB\u770B\u770B")}</span>
          <em>\u203A</em>
        </a>`}return a.resource_id?`<div class="card" style="padding:12px;border-color:#efd9ae;background:#fffaf0">
          <div class="spread"><div><strong>${i(a.name)}</strong><div class="muted">${i(a.room)} \xB7 \u5BB9\u91CF ${a.capacity} \u4EBA</div></div><span class="tag tag-green">\u53EF\u7EA6</span></div>
          <div class="muted" style="margin-top:6px">${i(a.reason||"")}</div>
          <button class="btn btn-primary btn-sm" style="margin-top:8px" data-ai-book="${a.resource_id}" data-date="${i(a.date)}" data-start="${i(a.start_at)}" data-end="${i(a.end_at)}" data-people="${a.people}" data-name="${i(a.name)}">\u786E\u8BA4\u9884\u7EA6\u8FD9\u4E2A</button></div>`:""}).join("")}</div>`:""}var Ka="\u563F\uFF0C\u6211\u662F\u82CF\u5C0F\u5E08\uFF0C\u6C5F\u5E08\u5927\u7684\u767E\u4E8B\u901A\u5C0F\u72EE\u5B50 \u{1F981} \u6821\u60C5\u6821\u5386\u3001\u53BB\u54EA\u600E\u4E48\u8D70\u3001\u7EA6\u6559\u5BA4/\u56FE\u4E66\u9986/\u5B9E\u9A8C\u5BA4\u3001\u6587\u4EF6\u8BC6\u522B\u3001\u5F85\u529E\u4E13\u6CE8\u3001\u627E\u642D\u5B50\u3001\u7701\u4E00\u7701\u3001\u62A5\u4FEE\uFF0C\u90FD\u80FD\u5E2E\u4F60\u5F20\u7F57\u3002\u60F3\u529E\u9884\u7EA6\u7684\u8BDD\uFF0C\u6211\u4F1A\u5148\u7ED9\u5019\u9009\uFF0C\u4F60\u70B9\u5934\u6211\u624D\u63D0\u4EA4\uFF5E";async function Ja(e,a){e.innerHTML=`<div class="page-head"><div><div class="page-title">\u82CF\u5C0F\u5E08 \xB7 \u6821\u56ED\u767E\u4E8B\u901A</div><div class="page-sub">\u6821\u60C5\u6821\u5386\u3001\u8DEF\u7EBF\u5BFC\u822A\u3001\u9884\u7EA6\u529E\u4E8B\uFF0C\u4E5F\u804A\u5929\u6C14\u548C\u65E5\u5E38\u3002\u591A\u4E2A\u5BF9\u8BDD\u72EC\u7ACB\u4FDD\u5B58\uFF0C\u968F\u65F6\u5207\u56DE\u6765\u3002</div></div></div>
    <div class="assistant-layout">
      <aside class="chat-sessions">
        <button class="btn btn-primary btn-block" id="newChat">\uFF0B \u65B0\u5BF9\u8BDD</button>
        <div class="session-list" id="sessionList"></div>
              </aside>
      <section class="chat-panel">
        <div class="chat-head">
          <div class="row"><span class="ai-name">\u82CF\u5C0F\u5E08</span><span class="tag tag-blue">\u5728\u7EBF</span></div>
          <span class="muted" id="chatMeta">\u6821\u56ED\u95EE\u7B54</span>
        </div>
        <div class="chat-body" id="chatBody"></div>
        <div class="chat-input-row">
          <textarea class="chat-input" id="chatInput" placeholder="\u8BD5\u8BD5\uFF1A\u4ECA\u5929\u5929\u6C14\u548B\u6837 / \u660E\u5929\u4E0B\u5348\u5E2E\u6211\u7EA6\u4E2A 4 \u4EBA\u7814\u8BA8\u5BA4"></textarea>
          <button class="btn btn-primary" id="chatSend">\u53D1\u9001</button>
        </div>
      </section>
      <aside class="chat-side">
                <div class="card"><div class="card-title">\u4E5F\u53EF\u4EE5\u8BD5\u8BD5</div>
          <div class="chips" style="margin-top:8px">
            <button class="chip" data-example="\u4ECA\u5929\u5929\u6C14\u548B\u6837">\u4ECA\u5929\u5929\u6C14</button>
            <button class="chip" data-example="\u660E\u5929\u4E0B\u5348\u5E2E\u6211\u7EA6\u4E00\u4E2A 4 \u4EBA\u7684\u7814\u8BA8\u6559\u5BA4">\u7EA6\u6559\u5BA4</button>
            <button class="chip" data-example="\u53BB\u56FE\u4E66\u9986\u600E\u4E48\u8D70">\u53BB\u56FE\u4E66\u9986</button>
            <button class="chip" data-example="2026 \u5E74\u56FD\u5E86\u600E\u4E48\u653E\u5047">\u67E5\u6821\u5386</button>
            <button class="chip" data-example="\u5B66\u6821\u6709\u51E0\u4E2A\u6821\u533A">\u67E5\u6821\u60C5</button>
                      </div>
        </div>
      </aside>
    </div>`;let s=e.querySelector("#chatBody"),t=e.querySelector("#chatInput"),n=e.querySelector("#sessionList"),d=[],l=null,c=!1;function r(p,b,S="",y=""){let g=new Date,L=Qi(y,g),w=bt(L);if(s.dataset.lastDay!==w){let D=document.createElement("div");D.className="chat-day-divider",D.textContent=Gi(L,g),s.appendChild(D),s.dataset.lastDay=w}let x=document.createElement("div");x.className=`msg ${p}`;let N=p==="user"?"\u6211":"\u82CF\u5C0F\u5E08",H=Yi(y||new Date);return x.innerHTML=`
      <div class="msg-avatar">${p==="user"?Ui:Vi}</div>
      <div class="msg-main">
        <div class="msg-meta"><span>${N}</span>${H?`<em>${H}</em>`:""}</div>
        <div class="msg-bubble">${i(b)}${p==="assistant"?S:""}</div>
      </div>`,s.appendChild(x),s.scrollTop=s.scrollHeight,x}function o(){if(!d.length){n.innerHTML='<div class="muted" style="padding:10px">\u8FD8\u6CA1\u6709\u5BF9\u8BDD</div>';return}n.innerHTML=d.map(p=>`<div class="session-item ${p.id===l?"active":""}" data-session="${p.id}">
          <div class="session-text">
            <div class="session-title">${i(p.title||"\u65B0\u5BF9\u8BDD")}</div>
            <div class="session-sub">${p.message_count||0} \u6761${p.last_message?` \xB7 ${i(p.last_message)}`:""}</div>
          </div>
          <div class="session-actions">
            <button data-rename="${p.id}" title="\u91CD\u547D\u540D">\u270E</button>
            <button data-del="${p.id}" title="\u5220\u9664">\xD7</button>
          </div>
        </div>`).join(""),n.querySelectorAll("[data-session]").forEach(p=>{p.addEventListener("click",b=>{b.target.closest("[data-rename]")||b.target.closest("[data-del]")||k(Number(p.getAttribute("data-session")))})}),n.querySelectorAll("[data-rename]").forEach(p=>{p.addEventListener("click",()=>M(Number(p.getAttribute("data-rename"))))}),n.querySelectorAll("[data-del]").forEach(p=>{p.addEventListener("click",()=>q(Number(p.getAttribute("data-del"))))})}async function h(){d=await m.get("/assistant/sessions")||[],!l&&d.length&&(l=d[0].id),o()}async function _(){if(s.innerHTML="",s.dataset.lastDay="",!l){r("assistant",Ka).dataset.welcome="1";return}let p=await m.get(`/assistant/messages?session_id=${l}`)||[];if(!p.length){r("assistant",Ka).dataset.welcome="1";return}p.forEach(b=>{if(b.role==="assistant"&&b.meta)try{let S=JSON.parse(b.meta),y=r("assistant",i(S.reply||b.content),Qa(S.cards||[]),b.created_at);E(y);return}catch{}r(b.role==="user"?"user":"assistant",b.content,"",b.created_at)})}function E(p){p.querySelectorAll("[data-ai-book]").forEach(b=>{b.addEventListener("click",()=>{let S={resource_id:Number(b.getAttribute("data-ai-book")),date:b.getAttribute("data-date"),start_at:b.getAttribute("data-start"),end_at:b.getAttribute("data-end"),people:Number(b.getAttribute("data-people")||1),purpose:"AI \u52A9\u624B\u63A8\u8350"};Z({title:"\u786E\u8BA4\u9884\u7EA6",okText:"\u786E\u8BA4\u63D0\u4EA4",body:`<div class="draft-card"><div class="card-title">${i(b.getAttribute("data-name"))}</div>
            <div class="small">${i(S.date)} ${i(S.start_at)}\u2013${i(S.end_at)} \xB7 ${S.people} \u4EBA</div>
            <div class="muted" style="margin-top:6px">\u63D0\u4EA4\u540E\u6309\u8D44\u6E90\u89C4\u5219\u8FDB\u5165\u201C\u5F85\u5BA1\u6279\u201D\u6216\u201C\u5DF2\u786E\u8BA4\u201D\uFF1B\u8BF7\u6309\u65F6\u7B7E\u5230\uFF0C\u907F\u514D\u8FDD\u7EA6\u3002</div></div>`,onOk:async()=>{try{let y=await m.post("/bookings",S);v(y.status==="pending_approval"?`\u5DF2\u63D0\u4EA4\u5BA1\u6279\uFF1A${y.code}`:`\u9884\u7EA6\u6210\u529F\uFF1A${y.code}`,"success"),document.getElementById("modalRoot").innerHTML="",b.disabled=!0,b.textContent="\u5DF2\u63D0\u4EA4"}catch(y){v(y.message,"error")}}})})})}async function k(p){p!==l&&(l=p,o(),await _(),t.focus())}async function f(){l=(await m.post("/assistant/sessions",{})).id,await h(),await _(),t.focus(),v("\u5F00\u4E86\u4E00\u4E2A\u65B0\u5BF9\u8BDD","success")}function M(p){let b=d.find(S=>S.id===p);b&&Z({title:"\u91CD\u547D\u540D\u5BF9\u8BDD",okText:"\u4FDD\u5B58",body:`<div class="field"><label>\u5BF9\u8BDD\u540D\u79F0</label><input class="input" id="sessionName" value="${i(b.title)}" maxlength="32"></div>`,onOk:async()=>{let S=document.getElementById("sessionName").value.trim();if(!S)throw new Error("\u540D\u79F0\u4E0D\u80FD\u4E3A\u7A7A");await m.patch(`/assistant/sessions/${p}`,{title:S}),document.getElementById("modalRoot").innerHTML="",await h(),v("\u5DF2\u91CD\u547D\u540D","success")}})}async function q(p){confirm("\u5220\u9664\u8FD9\u4E2A\u5BF9\u8BDD\uFF1F\u804A\u5929\u8BB0\u5F55\u4F1A\u4E00\u8D77\u6E05\u6389\u3002")&&(await m.del(`/assistant/sessions/${p}`),d=[],p===l&&(l=null),await h(),await _(),v("\u5BF9\u8BDD\u5DF2\u5220\u9664"))}async function U(p){let b=(p||t.value).trim();if(!b||c)return;c=!0,e.querySelectorAll('.msg[data-welcome="1"]').forEach(y=>y.remove()),l||await f(),r("user",b),t.value="";let S=r("assistant","\u82CF\u5C0F\u5E08\u641C\u7D22\u4E2D\u2026");try{let y=await m.post("/assistant/chat",{message:b,session_id:l});S.remove();let g=r("assistant",i(y.reply),Qa(y.cards),new Date().toISOString());E(g),y.session_id&&(l=y.session_id),await h()}catch(y){S.remove(),r("assistant",`<span style="color:var(--danger)">${i(y.message)}</span>`)}finally{c=!1}}e.querySelector("#chatSend").addEventListener("click",()=>U()),t.addEventListener("keydown",p=>{p.key!=="Enter"||p.shiftKey||p.isComposing||p.keyCode===229||(p.preventDefault(),U())}),e.querySelectorAll("[data-example]").forEach(p=>{p.addEventListener("click",()=>U(p.getAttribute("data-example")))}),e.querySelector("#newChat").addEventListener("click",()=>f()),await h(),await _();let u=a.params.get("q");u&&(t.value=u,U(u))}ve();var we=(e,a)=>e.status==="fulfilled"?e.value:a,Ji={\u67EF\u57FA:"\u{1F415}",\u732B\u732B:"\u{1F408}",\u6D77\u8C5A:"\u{1F42C}",\u523A\u732C:"\u{1F994}",\u4ED3\u9F20:"\u{1F439}",\u72D0\u72F8:"\u{1F98A}",\u9E45:"\u{1F9A2}",\u6C34\u736D:"\u{1F9A6}"};function Zi(e){return e&&e.avatar?`<img class="me-avatar" src="/static/img/avatars/${i(e.avatar)}" alt="">`:`<span class="me-avatar me-avatar-emoji">${Ji[e&&e.animal_type]||"\u{1F393}"}</span>`}async function Za(e,a){let s=await Promise.allSettled([m.get("/me"),m.get("/bookings/my"),m.get("/buddy/applications"),m.get("/repairs/my"),m.get("/messages"),m.get("/self/pomodoro/stats"),m.get("/buddy/profile"),m.get("/deal/overview"),m.get("/self/control/overview"),m.get("/buddy/posts")]),t=we(s[0],{name:"\u5E08\u5927\u540C\u5B66",college:"\u2014",campus:"\u6CC9\u5C71\u6821\u533A",role:"\u5B66\u751F",note:""}),n=we(s[1],[]),d=we(s[2],[]),l=we(s[3],[]),c=we(s[4],{unread:0}),r=we(s[5],{minutes:0,today:0,count:0}),o=we(s[6],null),h=we(s[7],{plans:[],money:{}}),_=we(s[8],{tasks:[],focus:{minutes:0,count:0}}),E=we(s[9],[]),k=n.filter(g=>["pending_approval","confirmed","checked_in"].includes(g.status)),f=n.filter(g=>g.date===K()&&["confirmed","checked_in"].includes(g.status)),M=d.filter(g=>g.role==="owner"&&g.status==="pending"),q=l.filter(g=>!["completed","closed","done"].includes(g.status)),U=Number(c.unread||0),u=E.filter(g=>g.user_id===1),p=(h.plans||[]).filter(g=>["planned","cooling"].includes(g.decision_status||"planned")),b=(_.tasks||[]).filter(g=>(g.plan_date||"")===K()&&g.status!=="done"),S=_.focus&&_.focus.minutes||r.minutes||0,y=[];if(f.length){let g=f[0];y.push({href:"#/me/bookings?filter=active",title:`\u4ECA\u5929\u6709 ${f.length} \u4E2A\u9884\u7EA6\u5F85\u4F7F\u7528`,sub:`${i(g.resource_name)} \xB7 ${i(g.start_at)}\u2013${i(g.end_at)}`,tone:"blue",go:"\u67E5\u770B"})}M.length&&y.push({href:"#/life/buddy?tab=mine&sub=apps",title:`${M.length} \u6761\u642D\u5B50\u7533\u8BF7\u5F85\u5904\u7406`,sub:"\u901A\u8FC7\u540E\u5373\u53EF\u5F00\u59CB\u804A\u5929",tone:"gold",go:"\u53BB\u5904\u7406"}),q.length&&y.push({href:"#/repair",title:`${q.length} \u4E2A\u62A5\u4FEE\u6B63\u5728\u5904\u7406`,sub:i(q[0].title||q[0].location||""),tone:"green",go:"\u67E5\u770B\u8FDB\u5EA6"}),U&&y.push({href:"msg",title:`${U} \u6761\u672A\u8BFB\u6D88\u606F`,sub:"\u6765\u81EA\u9884\u7EA6\u3001\u642D\u5B50\u4E0E\u6821\u56ED\u901A\u77E5",tone:"gray",go:"\u53BB\u67E5\u770B"}),e.innerHTML=`

    <div class="card me-profile">
      ${Zi(o)}
      <div class="me-info">
        <div class="me-name">${i(o&&o.nickname||t.name)}</div>
        <div class="me-meta">${i(t.college)} \xB7 ${i(t.campus)} \xB7 ${i(t.role)}</div>
        <div class="me-badges">
          ${o&&o.mbti?`<span class="tag tag-blue">${i(o.mbti)}</span>`:""}
          ${o&&o.animal_type?`<span class="tag">${i(o.animal_type)}\u578B</span>`:""}
          ${o&&o.place?`<span class="tag">\u{1F4CD} ${i(o.place)}</span>`:""}
        </div>
      </div>
      <div class="me-actions">
        <a class="btn btn-ghost btn-sm" href="#/life/buddy?tab=profile">\u7F16\u8F91\u8D44\u6599</a>
        <a class="btn btn-ghost btn-sm" href="#/me/settings">\u8BBE\u7F6E</a>
      </div>
    </div>

    ${y.length?`<div class="section-title">\u5F85\u5904\u7406 <span class="title-hint">${y.length} \u9879</span></div>
         <div class="todo-list">
           ${y.map(g=>`<a class="todo-row tone-${g.tone}" href="${g.href}" ${g.href==="msg"?'data-open-msg="1"':""}>
             <span class="todo-dot"></span>
             <div class="todo-main"><div class="todo-title">${g.title}</div><div class="todo-sub">${g.sub}</div></div>
             <span class="todo-go">${g.go} \u203A</span>
           </a>`).join("")}
         </div>`:`<div class="section-title">\u5F85\u5904\u7406</div>
         <div class="card me-empty"><span class="me-empty-ico">\u2713</span><div><b>\u76EE\u524D\u6CA1\u6709\u5F85\u5904\u7406\u4E8B\u9879</b><span>\u9884\u7EA6\u3001\u642D\u5B50\u7533\u8BF7\u548C\u62A5\u4FEE\u8FDB\u5EA6\u90FD\u4F1A\u51FA\u73B0\u5728\u8FD9\u91CC\u3002</span></div></div>`}

    <div class="section-title">\u6211\u7684\u670D\u52A1</div>
    <div class="grid grid-3 me-services">
      <a class="card me-service" href="#/me/bookings">
        <div class="ms-ico ms-blue">\u{1F4C5}</div>
        <div class="ms-main"><div class="ms-title">\u6211\u7684\u9884\u7EA6</div><div class="ms-sub">\u8FDB\u884C\u4E2D ${k.length} \u4E2A</div></div>
        <span class="ms-num">${k.length}</span>
      </a>
      <a class="card me-service" href="#/life/buddy?tab=mine">
        <div class="ms-ico ms-gold">\u{1F91D}</div>
        <div class="ms-main"><div class="ms-title">\u6211\u7684\u642D\u5B50</div><div class="ms-sub">\u53D1\u5E03 ${u.length} \xB7 \u7533\u8BF7 ${d.length}</div></div>
        <span class="ms-num">${u.length+d.length}</span>
      </a>
      <a class="card me-service" href="#/life/deal">
        <div class="ms-ico ms-green">\u{1F4B0}</div>
        <div class="ms-main"><div class="ms-title">\u6211\u7684\u8D2D\u4E70\u8BA1\u5212</div><div class="ms-sub">\u5F85\u51B3\u5B9A ${p.length} \u4E2A</div></div>
        <span class="ms-num">${p.length}</span>
      </a>
      <a class="card me-service" href="#/repair">
        <div class="ms-ico ms-cyan">\u{1F6E0}</div>
        <div class="ms-main"><div class="ms-title">\u6211\u7684\u62A5\u4FEE</div><div class="ms-sub">\u5904\u7406\u4E2D ${q.length} \u4E2A</div></div>
        <span class="ms-num">${q.length}</span>
      </a>

      <a class="card me-service" href="#/life/self/control?tab=today">
        <div class="ms-ico ms-blue">\u{1F4DD}</div>
        <div class="ms-main"><div class="ms-title">\u81EA\u6211\u7BA1\u7406</div><div class="ms-sub">\u4ECA\u65E5\u5F85\u529E ${b.length} \u9879</div></div>
        <span class="ms-go">\u203A</span>
      </a>
    </div>

    <div class="section-title">\u81EA\u6211\u7BA1\u7406\u6458\u8981</div>
    <div class="card me-self">
      <div class="me-self-stats">
        <div><b>${b.length}</b><span>\u4ECA\u65E5\u5F85\u529E</span></div>
        <div class="me-self-sep"></div>
        <div><b>${S}</b><span>\u4ECA\u65E5\u4E13\u6CE8\uFF08\u5206\u949F\uFF09</span></div>
      </div>
      <a class="btn btn-primary btn-sm" href="#/life/self/control?tab=today">\u7EE7\u7EED\u4ECA\u65E5\u8BA1\u5212 \u2192</a>
      <div class="muted me-self-hint">\u4EFB\u52A1\u7F16\u8F91\u3001\u756A\u8304\u949F\u4E0E\u590D\u76D8\u8BF7\u8FDB\u5165\u81EA\u6211\u7BA1\u7406\u64CD\u4F5C</div>
    </div>

    `,e.querySelectorAll("[data-open-msg]").forEach(g=>g.addEventListener("click",L=>{L.preventDefault();let w=document.getElementById("msgBtn");w?w.click():v("\u8BF7\u5728\u9876\u90E8\u6D88\u606F\u4E2D\u5FC3\u67E5\u770B","error")}))}async function ft(e,a){let s=a&&a.params&&a.params.get("filter")||"all",t=await m.get("/bookings/my"),n=(()=>{let u=[],p=new Map;for(let b of t){if(b.type!=="seat"||!b.reservation_key){u.push({...b});continue}let S=b.reservation_key;if(!p.has(S)){let g={...b};p.set(S,g),u.push(g);continue}let y=p.get(S);b.start_at<y.start_at&&(y.start_at=b.start_at),b.end_at>y.end_at&&(y.end_at=b.end_at),y.people=Math.max(Number(y.people||1),Number(b.people||1)),["checked_in","away"].includes(b.status)?y.status=b.status:b.status==="confirmed"&&!["checked_in","away"].includes(y.status)&&(y.status="confirmed"),!y.code&&b.code&&(y.code=b.code)}return u})(),d=u=>`${String(u.getHours()).padStart(2,"0")}:${String(u.getMinutes()).padStart(2,"0")}`,l=u=>{let p=new Date(`${u.date}T${u.start_at}:00`),b=new Date(p.getTime()-900*1e3),S=new Date(p.getTime()+900*1e3),y=Date.now();return{open:b,close:S,can:y>=b.getTime()&&y<=S.getTime(),before:y<b.getTime(),after:y>S.getTime()}},c={pending:["pending_approval"],upcoming:["confirmed"],active:["checked_in","away"],done:["completed","checked_out","no_show","released"],cancelled:["cancelled","rejected"]},r={all:"\u5168\u90E8",pending:"\u5F85\u5BA1\u6279",upcoming:"\u5F85\u7B7E\u5230",active:"\u8FDB\u884C\u4E2D",done:"\u5DF2\u7ED3\u675F",cancelled:"\u5DF2\u53D6\u6D88"},o=["all","pending","upcoming","active","done","cancelled"],h=(u,p)=>p==="all"||(c[p]||[]).includes(u.status),_=n.filter(u=>h(u,s)),E=u=>{let p=u.type==="seat"?l(u):null,b=u.type==="seat"?u.status==="confirmed"&&p.can:u.status==="confirmed",S=["pending_approval","confirmed"].includes(u.status),y=["completed","cancelled","rejected","no_show","released"].includes(u.status),g=p?Math.max(1,Math.ceil((p.open.getTime()-Date.now())/6e4)):0,L=g>=60?`${Math.floor(g/60)} \u5C0F\u65F6 ${g%60} \u5206\u949F`:`${g} \u5206\u949F`;return`<div class="card me-bk-card">
      <div class="me-bk-head">
        <div class="me-bk-main">
          <div class="me-bk-name">${i(u.resource_name)}</div>
          <div class="me-bk-meta">${i(u.room||"\u2014")} \xB7 ${u.people} \u4EBA</div>
        </div>
        ${$e(u.status)}
      </div>
      <div class="me-bk-when no-date">
        <div class="me-bk-time">${i(u.start_at)}\u2013${i(u.end_at)}</div>
        ${u.code?`<div class="me-bk-code">\u9884\u7EA6\u53F7 ${i(u.code)}</div>`:""}
      </div>
      ${p&&u.status==="confirmed"?`<div class="me-bk-window">\u53EF\u7B7E\u5230\uFF1A${i(u.date.slice(5))} ${d(p.open)}\u2013${d(p.close)}${p.can?" \xB7 \u73B0\u5728\u53EF\u7B7E\u5230":p.before?` \xB7 \u8FD8\u6709 ${L}`:" \xB7 \u5DF2\u8FC7\u7B7E\u5230\u65F6\u95F4"}</div>`:""}
      <div class="me-bk-actions">
        ${b?`<button class="btn btn-primary btn-sm" data-checkin="${u.id}" data-type="${i(u.type)}">${u.type==="seat"?"\u{1F4CD} \u5B9A\u4F4D\u7B7E\u5230":"\u7B7E\u5230"}</button>`:""}
        ${S?`<button class="btn btn-ghost btn-sm" data-cancel="${u.id}">\u53D6\u6D88\u9884\u7EA6</button>`:""}
        ${y?`<button class="btn btn-ghost btn-sm" data-again="${u.id}">\u518D\u6B21\u9884\u7EA6</button>`:""}
        <button class="btn btn-ghost btn-sm" data-detail="${u.id}">\u67E5\u770B\u8BE6\u60C5</button>
      </div>
    </div>`},k=(()=>{let u=new Date(K()+"T00:00:00");return u.setDate(u.getDate()+1),`${u.getFullYear()}-${String(u.getMonth()+1).padStart(2,"0")}-${String(u.getDate()).padStart(2,"0")}`})(),f=u=>u===K()?`\u4ECA\u5929 \xB7 ${u}`:u===k?`\u660E\u5929 \xB7 ${u}`:u<K()?`${u} \xB7 \u5DF2\u8FC7`:u,M=[..._].sort((u,p)=>{let b=`${u.date} ${u.start_at}`,S=`${p.date} ${p.start_at}`;if(["done","cancelled"].includes(s))return S.localeCompare(b);let y=u.date<K()?1:0,g=p.date<K()?1:0;return y!==g?y-g:y?S.localeCompare(b):b.localeCompare(S)}),q=new Map;M.forEach(u=>{q.has(u.date)||q.set(u.date,[]),q.get(u.date).push(u)});let U=M.length?[...q.entries()].map(([u,p])=>`<div class="me-bk-date-head"><b>${f(u)}</b><span>${p.length} \u6761</span></div>
            <div class="me-bk-grid">${p.map(E).join("")}</div>`).join(""):'<div class="card me-empty"><span class="me-empty-ico">\u{1F4ED}</span><div><b>\u6CA1\u6709\u7B26\u5408\u6761\u4EF6\u7684\u9884\u7EA6</b><span>\u6362\u4E2A\u7B5B\u9009\u6761\u4EF6\uFF0C\u6216\u53BB\u9884\u7EA6\u4E2D\u5FC3\u65B0\u5EFA\u4E00\u4E2A\u3002</span></div></div>';e.innerHTML=`
    <div class="page-head"><div><div class="page-title">\u6211\u7684\u9884\u7EA6</div><div class="page-sub">\u6309\u72B6\u6001\u7B5B\u9009\u540E\uFF0C\u9884\u7EA6\u4F1A\u6309\u65E5\u671F\u5206\u7EC4\u663E\u793A\u3002</div></div>
      <a class="btn btn-ghost btn-sm" href="#/me">\u2039 \u8FD4\u56DE\u6211\u7684</a></div>
    <div class="card me-bk-filter">
      <div class="me-bk-filter-head"><b>\u6309\u72B6\u6001\u7B5B\u9009</b><span>\u5171 ${n.length} \u6761\u9884\u7EA6</span></div>
      <div class="chips me-bk-chips">
        ${o.map(u=>`<a class="chip ${u===s?"active":""}" href="#/me/bookings?filter=${u}">${r[u]} <span class="chip-num">${n.filter(p=>h(p,u)).length}</span></a>`).join("")}
      </div>
    </div>
    ${U}`,e.querySelectorAll("[data-cancel]").forEach(u=>u.addEventListener("click",async()=>{confirm("\u786E\u5B9A\u53D6\u6D88\u8FD9\u6761\u9884\u7EA6\uFF1F")&&(await m.post(`/bookings/${u.getAttribute("data-cancel")}/cancel`),v("\u5DF2\u53D6\u6D88","success"),ft(e,a))})),e.querySelectorAll("[data-checkin]").forEach(u=>u.addEventListener("click",async()=>{let p=u.getAttribute("data-checkin"),b=u.getAttribute("data-type");try{if(b==="seat"){if(!navigator.geolocation)throw new Error("\u5F53\u524D\u6D4F\u89C8\u5668\u4E0D\u652F\u6301\u5B9A\u4F4D");let S=await new Promise((L,w)=>navigator.geolocation.getCurrentPosition(x=>L(x.coords),x=>w(new Error(x&&x.code===1?"\u5B9A\u4F4D\u6743\u9650\u88AB\u62D2\u7EDD\uFF0C\u8BF7\u5728\u6D4F\u89C8\u5668\u4E2D\u5141\u8BB8\u5B9A\u4F4D":"\u83B7\u53D6\u5B9A\u4F4D\u5931\u8D25\uFF0C\u8BF7\u68C0\u67E5\u5B9A\u4F4D\u670D\u52A1")),{enableHighAccuracy:!0,timeout:12e3,maximumAge:0})),[y,g]=Pe(S.longitude,S.latitude);await m.post(`/bookings/${p}/checkin`,{lat:g,lng:y})}else await m.post(`/bookings/${p}/checkin`);v("\u7B7E\u5230\u6210\u529F","success"),ft(e,a)}catch(S){v(S.message,"error")}})),e.querySelectorAll("[data-again]").forEach(u=>u.addEventListener("click",()=>location.hash="#/work")),e.querySelectorAll("[data-detail]").forEach(u=>u.addEventListener("click",async()=>{let p=n.find(S=>String(S.id)===u.getAttribute("data-detail"));if(!p)return;let{modal:b}=await Promise.resolve().then(()=>(ve(),ta));b({title:"\u9884\u7EA6\u8BE6\u60C5",hideOk:!0,cancelText:"\u5173\u95ED",body:`<div class="me-bk-detail">
          <div><span>\u8D44\u6E90</span><b>${i(p.resource_name)}</b></div>
          <div><span>\u4F4D\u7F6E</span><b>${i(p.room||"\u2014")}</b></div>
          <div><span>\u65E5\u671F</span><b>${i(p.date)}</b></div>
          <div><span>\u65F6\u6BB5</span><b>${i(p.start_at)}\u2013${i(p.end_at)}</b></div>
          <div><span>\u4EBA\u6570</span><b>${p.people}</b></div>
          <div><span>\u72B6\u6001</span><b>${i(p.status_label||p.status)}</b></div>
          <div><span>\u9884\u7EA6\u53F7</span><b>${i(p.code||"\u2014")}</b></div>
          ${p.purpose?`<div><span>\u7528\u9014</span><b>${i(p.purpose)}</b></div>`:""}
        </div>`})}))}async function Xa(e){let[a,s]=await Promise.allSettled([m.get("/buddy/profile"),m.get("/messages")]),t=we(a,null),n=we(s,{unread:0});e.innerHTML=`
    <div class="page-head"><div><div class="page-title">\u8BBE\u7F6E</div><div class="page-sub">\u8D44\u6599\u3001\u901A\u77E5\u3001\u9690\u79C1\u4E0E\u5173\u4E8E\u7CFB\u7EDF\u3002</div></div>
      <a class="btn btn-ghost btn-sm" href="#/me">\u2039 \u8FD4\u56DE\u6211\u7684</a></div>
    <div class="card me-settings">
      <a class="me-set-row" href="#/life/buddy?tab=profile"><span>\u4E2A\u4EBA\u8D44\u6599</span><b>${i(t&&t.nickname||"\u5E08\u5927\u540C\u5B66")} \u203A</b></a>
      <a class="me-set-row" href="#/life/buddy?tab=profile"><span>\u9ED8\u8BA4\u6821\u533A</span><b>\u6CC9\u5C71\u6821\u533A \u203A</b></a>
      <a class="me-set-row" href="#/life/self/control?tab=today"><span>\u6D88\u606F\u901A\u77E5</span><b>\u6309\u6D88\u606F\u4E2D\u5FC3\u8BBE\u7F6E \u203A</b></a>
      <div class="me-set-row"><span>\u9690\u79C1\u4E0E\u6388\u6743</span><b>${n.unread||0} \u6761\u672A\u8BFB</b></div>
      <a class="me-set-row" href="#/me/bookings"><span>\u6570\u636E\u7BA1\u7406</span><b>\u9884\u7EA6\u4E0E\u8BB0\u5F55 \u203A</b></a>
      <div class="me-set-row"><span>\u5173\u4E8E\u7CFB\u7EDF</span><b>\u7231\u5E08\u5927 v2.1</b></div>
    </div>
`}ve();var Xi={submitted:"tag-gold",in_progress:"tag-blue",done:"tag-green"},en={submitted:"on",in_progress:"half",done:"full"};function tn(e){let a=en[e.status]||"";return`<div class="card rp-card" data-state="${e.status==="done"?"done":"open"}">
    <div class="spread">
      <div class="row" style="gap:8px;align-items:center">
        <span class="tag">${i(e.area)}</span>
        <span class="tag">${i(e.category)}</span>
        ${e.urgency_key==="urgent"?'<span class="tag tag-red">\u7D27\u6025</span>':""}
        <span class="tag ${Xi[e.status]||""}">${i(e.status_label)}</span>
      </div>
      <span class="muted rp-id">No.${String(e.id).padStart(4,"0")}</span>
    </div>
    <div class="rp-title">${i(e.title)}</div>
    <div class="muted">${i(e.location)} \xB7 ${i(e.contact||"\u672A\u7559\u8054\u7CFB\u65B9\u5F0F")}</div>
    ${e.description?`<div class="card-desc" style="margin-top:8px">${i(e.description)}</div>`:""}
    <div class="rp-steps">
      <span class="rp-step ${a}">\u63D0\u4EA4</span><i></i>
      <span class="rp-step ${e.status==="done"?"full":e.status==="in_progress"?"on":""}">\u5904\u7406\u4E2D</span><i></i>
      <span class="rp-step ${e.status==="done"?"full":""}">\u5B8C\u6210</span>
    </div>
    ${e.reply?`<div class="rp-reply">\u7EF4\u4FEE\u65B9\u56DE\u590D\uFF1A${i(e.reply)}</div>`:`<div class="muted" style="margin-top:6px;font-size:11.5px">${i(e.status_hint)}</div>`}

  </div>`}async function Qt(e,a){let[s,t]=await Promise.all([m.get("/repairs/meta").catch(()=>({areas:["\u5BBF\u820D","\u6559\u5B66\u697C","\u56FE\u4E66\u9986","\u516C\u5171\u533A\u57DF","\u5176\u4ED6"],categories:["\u6C34\u7535","\u5BB6\u5177","\u7F51\u7EDC","\u95E8\u7A97","\u5176\u4ED6"]})),m.get("/repairs/my").catch(()=>[])]),n=t.filter(r=>r.status!=="done").length;e.innerHTML=`
    <div class="page-head" style="margin-bottom:10px"><div></div><a class="btn btn-ghost btn-sm" href="#/home">\u8FD4\u56DE\u9996\u9875</a></div>
    <div class="detail-hero repair-hero">
      <div class="detail-art"><svg viewBox="0 0 200 160" fill="none">
        <rect x="46" y="30" width="108" height="104" rx="12" stroke="#8fdcff" stroke-opacity=".45" stroke-width="1.6"/>
        <path d="M72 62 H128 M72 84 H128 M72 106 H104" stroke="#fff" stroke-opacity=".32" stroke-width="4" stroke-linecap="round"/>
        <circle cx="150" cy="118" r="20" stroke="#f0cf94" stroke-opacity=".7" stroke-width="1.6"/>
        <path d="M143 111 l-4 14 14-4 M150 104 a6 6 0 0 1 6 6" stroke="#f0cf94" stroke-width="2" stroke-linecap="round"/>
      </svg></div>
      <div class="tag">REPAIR</div>
      <h1>\u6821\u56ED\u62A5\u4FEE</h1>
      <p>\u5BBF\u820D\u3001\u6559\u5B66\u697C\u4E0E\u516C\u5171\u533A\u57DF\u7684\u8BBE\u65BD\u95EE\u9898\uFF0C\u4E00\u5904\u63D0\u4EA4\u3001\u5168\u7A0B\u53EF\u67E5\u3002\u6C34\u7535\u3001\u5BB6\u5177\u3001\u7F51\u7EDC\u3001\u95E8\u7A97\u90FD\u53EF\u4EE5\u62A5\u3002</p>
      ${t.length?`<div class="bh-stats"><div class="bh-stat"><b>${t.length}</b><span>\u7D2F\u8BA1\u62A5\u4FEE</span></div><div class="bh-stat"><b>${n}</b><span>\u5904\u7406\u4E2D</span></div><div class="bh-stat"><b>${t.length-n}</b><span>\u5DF2\u5B8C\u6210</span></div></div>`:""}
    </div>

    <div class="repair-layout">
      <div class="card">
        <div class="card-title">\u63D0\u4EA4\u62A5\u4FEE</div>
        <div class="office-form">
          <div class="grid grid-2">
            <div class="field"><label>\u62A5\u4FEE\u533A\u57DF *</label><select class="select" id="rpArea">
              ${s.areas.map(r=>`<option>${i(r)}</option>`).join("")}
            </select></div>
            <div class="field"><label>\u95EE\u9898\u7C7B\u578B *</label><select class="select" id="rpCategory">
              ${s.categories.map(r=>`<option>${i(r)}</option>`).join("")}
            </select></div>
          </div>
          <div class="field"><label>\u4F4D\u7F6E *</label><input class="input" id="rpLocation" placeholder="\u5982\uFF1A\u6CC9\u5C71\u6821\u533A 5 \u53F7\u697C 402 / \u6559\u5B66\u697C A-201"></div>
          <div class="field"><label>\u95EE\u9898\u63CF\u8FF0 *</label><input class="input" id="rpTitle" placeholder="\u4E00\u53E5\u8BDD\u8BF4\u660E\u95EE\u9898\uFF0C\u5982\uFF1A\u5BBF\u820D\u706F\u7BA1\u4E0D\u4EAE"></div>
          <div class="field"><label>\u8BE6\u7EC6\u8BF4\u660E</label><textarea class="textarea" id="rpDesc" style="min-height:88px" placeholder="\u8865\u5145\u7EC6\u8282\uFF0C\u5982\u53D1\u751F\u65F6\u95F4\u3001\u5F71\u54CD\u8303\u56F4\u3001\u662F\u5426\u53CD\u590D\u51FA\u73B0\u2026\u2026"></textarea></div>
          <div class="grid grid-2">
            <div class="field"><label>\u7D27\u6025\u7A0B\u5EA6</label><select class="select" id="rpUrgency">
              <option value="normal">\u666E\u901A\uFF0848 \u5C0F\u65F6\u5185\u5904\u7406\uFF09</option>
              <option value="urgent">\u7D27\u6025\uFF08\u5F71\u54CD\u4F7F\u7528/\u5B89\u5168\uFF09</option>
            </select></div>
            <div class="field"><label>\u8054\u7CFB\u65B9\u5F0F</label><input class="input" id="rpContact" placeholder="\u624B\u673A\u53F7\u6216 QQ\uFF0C\u65B9\u4FBF\u7EF4\u4FEE\u65B9\u8054\u7CFB"></div>
          </div>
          <button class="btn btn-primary" id="rpSubmit">\u63D0\u4EA4\u62A5\u4FEE</button>
        </div>
      </div>

      <div>
        <div class="card">
          <div class="spread"><div class="card-title">\u6211\u7684\u62A5\u4FEE</div>
            <div class="row" style="gap:8px;align-items:center">
              <select class="select" id="rpFilter" style="width:120px">
                <option value="open">\u5904\u7406\u4E2D</option>
                <option value="done">\u5DF2\u5B8C\u6210</option>
              </select>
              <span class="tag">${t.length} \u6761</span>
            </div>
          </div>
          <div id="rpList" style="margin-top:8px">
            ${t.length?t.map(tn).join(""):'<div class="muted" style="padding:10px 0">\u6682\u65E0\u62A5\u4FEE\u8BB0\u5F55\u3002\u6709\u95EE\u9898\u968F\u65F6\u63D0\u4EA4\uFF0C\u5168\u7A0B\u53EF\u5728\u8FD9\u91CC\u67E5\u770B\u8FDB\u5EA6\u3002</div>'}
          </div>
        </div>
      </div>
    </div>`;let d=r=>e.querySelector(r),l=d("#rpFilter"),c=()=>{let r=l?l.value:"open";e.querySelectorAll(".rp-card").forEach(o=>{o.hidden=o.getAttribute("data-state")!==r})};l?.addEventListener("change",c),c(),d("#rpSubmit").addEventListener("click",async()=>{let r={area:d("#rpArea").value,category:d("#rpCategory").value,location:d("#rpLocation").value.trim(),title:d("#rpTitle").value.trim(),description:d("#rpDesc").value.trim(),urgency:d("#rpUrgency").value,contact:d("#rpContact").value.trim()};if(!r.location){v("\u8BF7\u586B\u5199\u62A5\u4FEE\u4F4D\u7F6E","error");return}if(!r.title){v("\u8BF7\u63CF\u8FF0\u8981\u62A5\u4FEE\u7684\u95EE\u9898","error");return}let o=d("#rpSubmit");o.disabled=!0,o.textContent="\u63D0\u4EA4\u4E2D\u2026";try{await m.post("/repairs",r),v("\u62A5\u4FEE\u5DF2\u63D0\u4EA4\uFF0C\u53EF\u5728\u53F3\u4FA7\u67E5\u770B\u8FDB\u5EA6","success"),Qt(e,a)}catch(h){v(h.message,"error")}finally{o.disabled=!1,o.textContent="\u63D0\u4EA4\u62A5\u4FEE"}})}ve();var an=[{title:"\u6821\u56ED\u5DE5\u4F5C \xB7 \u9884\u7EA6",items:[{name:"\u7A7A\u6559\u5BA4\u9884\u7EA6",badge:"\u514D\u5BA1\u6279",desc:"\u5468\u6B21\u5236\u5360\u7528\u77E9\u9635\uFF0C\u63D0\u4EA4\u5373\u786E\u8BA4",href:"#/work/classroom",icon:"g",svg:'<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8"/>'},{name:"\u56FE\u4E66\u9986\u9009\u5EA7",badge:"\u5373\u65F6",desc:"\u516D\u4E2A\u9605\u89C8\u5BA4 324 \u5EA7\uFF0C\u9009\u5EA7\u5373\u786E\u8BA4",href:"#/work/library",icon:"b",svg:'<path d="M6 11V7a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v4"/><path d="M4 11h16v5H4z"/><path d="M7 16v4M17 16v4"/>'}]},{title:"\u6559\u52A1\u4E0E\u8D44\u6E90",items:[{name:"\u4FE1\u606F\u52A8\u6001",badge:"",desc:"\u5B98\u7F51\u8981\u95FB\u4E0E\u901A\u77E5\uFF0C\u7AD9\u5185\u8BE6\u60C5\u9605\u8BFB",href:"#/work/news",icon:"o",svg:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 9h10M7 13h6"/>'},{name:"\u8D44\u6E90\u5E73\u53F0",badge:"",desc:"\u5B66\u6821\u5DF2\u6709\u5E73\u53F0\u7EDF\u4E00\u5165\u53E3\u76F4\u8FBE",href:"#/resources",icon:"o",svg:'<path d="M3 7h7l2 2h9v10H3z"/>'}]},{title:"\u6821\u56ED\u751F\u6D3B",items:[{name:"\u6821\u56ED\u5BFC\u822A",badge:"\u771F\u5B9E\u5730\u56FE",desc:"\u522B\u540D\u641C\u7D22 \xB7 \u6B65\u884C\u8DEF\u7EBF \xB7 \u5524\u8D77\u9AD8\u5FB7",href:"#/life/nav",icon:"b",svg:'<path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11Z"/><circle cx="12" cy="10" r="2.6"/>'},{name:"\u627E\u642D\u5B50",badge:"",desc:"\u5403\u996D \xB7 \u81EA\u4E60 \xB7 \u5065\u8EAB \xB7 \u8003\u7814",href:"#/life/buddy",icon:"o",svg:'<circle cx="9" cy="9" r="3"/><circle cx="17" cy="10.5" r="2.4"/><path d="M3.5 19.5c.6-2.8 2.7-4.2 5.5-4.2s4.9 1.4 5.5 4.2"/><path d="M15 15.6c2.2.1 3.6 1.3 4 3.4"/>'},{name:"\u7701\u4E00\u7701",badge:"",desc:"\u62FC\u5355\u5899 \xB7 \u653E\u5F03\u5373\u7701\u94B1",href:"#/life/deal",icon:"p",svg:'<path d="M5 8h14l-1.4 12.2a1.6 1.6 0 0 1-1.6 1.4H8a1.6 1.6 0 0 1-1.6-1.4L5 8Z"/><path d="M8.6 8V6.2a3.4 3.4 0 0 1 6.8 0V8"/>'},{name:"\u62A5\u4FEE",badge:"",desc:"\u5BBF\u820D\u4E0E\u8BBE\u65BD\u95EE\u9898\uFF0C\u4E00\u5904\u63D0\u4EA4\u5168\u7A0B\u53EF\u67E5",href:"#/repair",icon:"v",svg:'<path d="M14.7 6.3a4.5 4.5 0 0 0-6 5.6L3 17.6V21h3.4l5.7-5.7a4.5 4.5 0 0 0 5.6-6L14.5 12l-2.5-2.5 2.7-3.2Z"/>'}]},{title:"\u4E2A\u4EBA\u4E0E\u81EA\u6211",items:[{name:"\u4E2A\u4EBA\u7BA1\u7406",badge:"",desc:"\u6211\u7684\u9884\u7EA6\u3001\u7B7E\u5230\u3001\u8BB0\u5F55\u4E0E\u8BBE\u7F6E",href:"#/me",icon:"b",svg:'<circle cx="12" cy="8" r="3.6"/><path d="M4.5 20c1.4-3.6 4-5.2 7.5-5.2s6.1 1.6 7.5 5.2"/>'},{name:"\u81EA\u6211\u63A7\u5236",badge:"",desc:"\u4EFB\u52A1 \xB7 \u4E13\u6CE8 \xB7 \u590D\u76D8 \xB7 \u6210\u5C31",href:"#/life/self/control",icon:"v",svg:'<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/>'}]},{title:"\u6821\u56ED\u670D\u52A1",items:[{name:"\u82CF\u5C0F\u5E08",badge:"\u5168\u5C40",desc:"\u4E00\u53E5\u8BDD\u529E\u4E8B",href:"#/assistant",icon:"ai",svg:'<circle cx="12" cy="12" r="3.2"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/>'},{name:"\u6587\u4EF6\u8BC6\u522B",badge:"",desc:"\u5B57\u6BB5\u63D0\u53D6 \xB7 \u89C4\u5219\u751F\u6210 \xB7 \u6838\u67E5\u5339\u914D",href:"#/office",icon:"b",svg:'<path d="M5 4h9l5 5v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4Z"/><path d="M14 4v5h5"/><path d="M8.5 13h7M8.5 16.5h4"/>'}]}];function sn(e){return`<a class="hcard" href="${e.href}">
    <div class="hic ${e.icon}"><svg viewBox="0 0 24 24">${e.svg}</svg></div>
    <div class="hinfo">
      <div class="hn">${i(e.name)}${e.badge?`<span class="hb">${i(e.badge)}</span>`:""}</div>
      <div class="hd">${i(e.desc)}</div>
    </div>
    <span class="hgo">\u203A</span>
  </a>`}function nn(e){return`<div class="hub-group">
    <div class="hg-head"><b>${i(e.title)}</b><span>${e.items.length} \u9879</span><i></i></div>
    <div class="hub-grid">${e.items.map(sn).join("")}</div>
  </div>`}async function es(e,a){e.innerHTML=`
    <div id="hubGroups">
      ${an.map(nn).join("")}
    </div>
`}var ts={"/home":{title:"\u9996\u9875",crumb:"\u4ECA\u65E5\u5DE5\u4F5C\u53F0",view:ia},"/hub":{title:"\u901A\u9053",crumb:"\u5168\u91CF\u80FD\u529B\u76EE\u5F55",view:es},"/home/about":{title:"\u5B66\u6821\u6982\u51B5",crumb:"\u9996\u9875 / \u5B66\u6821\u6982\u51B5",view:ca},"/home/faculty":{title:"\u5E08\u8D44\u4E0E\u529E\u5B66\u6210\u5C31",crumb:"\u9996\u9875 / \u5E08\u8D44\u4E0E\u6210\u5C31",view:la},"/home/campus":{title:"\u6821\u533A\u4E0E VR",crumb:"\u9996\u9875 / \u6821\u533A",view:ra},"/work":{title:"\u5DE5\u4F5C\u533A",crumb:"\u9884\u7EA6 \xB7 \u5BA1\u6279",view:ba},"/work/lab":{title:"\u5B9E\u9A8C\u5BA4\u9884\u7EA6",crumb:"\u5DE5\u4F5C\u533A / \u5B9E\u9A8C\u5BA4",view:fa},"/work/lab/book":{title:"\u5B9E\u9A8C\u5BA4\u9884\u7EA6",crumb:"\u5DE5\u4F5C\u533A / \u5B9E\u9A8C\u5BA4 / \u9009\u62E9\u65F6\u6BB5",view:ya},"/work/classroom":{title:"\u7A7A\u6559\u5BA4\u9884\u7EA6",crumb:"\u5DE5\u4F5C\u533A / \u7A7A\u6559\u5BA4",view:ha},"/work/library":{title:"\u56FE\u4E66\u9986\u9884\u7EA6",crumb:"\u5DE5\u4F5C\u533A / \u56FE\u4E66\u9986",view:$a},"/work/library/room":{title:"\u56FE\u4E66\u9986\u9009\u5EA7",crumb:"\u5DE5\u4F5C\u533A / \u56FE\u4E66\u9986\u9009\u5EA7",view:wa},"/work/resources":{title:"\u8D44\u6E90\u5E73\u53F0",crumb:"\u5B66\u6821\u5E73\u53F0\u4E0E\u5916\u94FE",view:qt},"/resources":{title:"\u8D44\u6E90\u5E73\u53F0",crumb:"\u5B66\u6821\u5E73\u53F0\u4E0E\u5916\u94FE",view:qt},"/work/news":{title:"\u4FE1\u606F\u52A8\u6001",crumb:"\u5E08\u5927\u8981\u95FB\u4E0E\u901A\u77E5",view:ka},"/news/detail":{title:"\u52A8\u6001\u8BE6\u60C5",crumb:"\u4FE1\u606F\u52A8\u6001 / \u8BE6\u60C5",view:xa},"/office":{title:"\u6587\u4EF6\u8BC6\u522B",crumb:"\u5B57\u6BB5\u63D0\u53D6 \xB7 \u6838\u67E5\u5339\u914D",view:Ma},"/life":{title:"\u751F\u6D3B\u533A",crumb:"\u5BFC\u822A \xB7 \u642D\u5B50 \xB7 \u7701\u94B1 \xB7 \u4E92\u52A9",view:qa},"/life/nav":{title:"\u6821\u56ED\u5BFC\u822A",crumb:"\u751F\u6D3B\u533A / \u5BFC\u822A",view:Aa},"/life/buddy":{title:"\u627E\u642D\u5B50",crumb:"\u751F\u6D3B\u533A / \u627E\u642D\u5B50",view:Ia},"/life/buddy/mine":{title:"\u6211\u7684\u6D3B\u52A8",crumb:"\u627E\u642D\u5B50 / \u6211\u7684\u6D3B\u52A8",view:Na},"/life/buddy/messages":{title:"\u7533\u8BF7\u4E0E\u6D88\u606F",crumb:"\u627E\u642D\u5B50 / \u7533\u8BF7\u4E0E\u6D88\u606F",view:Pa},"/life/buddy/new":{title:"\u53D1\u5E03\u6D3B\u52A8",crumb:"\u627E\u642D\u5B50 / \u53D1\u5E03\u6D3B\u52A8",view:Rt},"/life/buddy/activity":{title:"\u6D3B\u52A8\u8BE6\u60C5",crumb:"\u627E\u642D\u5B50 / \u6D3B\u52A8\u8BE6\u60C5",view:Le},"/life/deal":{title:"\u7701\u4E00\u7701",crumb:"\u751F\u6D3B\u533A / \u7701\u4E00\u7701",view:Ta},"/life/deal/new":{title:"\u53D1\u8D77\u8D2D\u4E70\u8BA1\u5212",crumb:"\u7701\u4E00\u7701 / \u65B0\u5EFA\u8BA1\u5212",view:Oa},"/life/deal/plan":{title:"\u8D2D\u4E70\u8BA1\u5212",crumb:"\u7701\u4E00\u7701 / \u8BA1\u5212\u8BE6\u60C5",view:Ut},"/life/self":{title:"Self-Control",crumb:"\u81EA\u6211\u63A7\u5236",view:Xe},"/life/self/control":{title:"Self-Control",crumb:"\u81EA\u6211\u63A7\u5236",view:Xe},"/me/self":{title:"Self-Control",crumb:"\u81EA\u6211\u63A7\u5236",view:Xe},"/me/control":{title:"Self-Control",crumb:"\u81EA\u6211\u63A7\u5236",view:Xe},"/assistant":{title:"\u82CF\u5C0F\u5E08",crumb:"\u6821\u56ED\u52A9\u624B",view:Ja},"/me":{title:"\u6211\u7684",crumb:"\u4E2A\u4EBA\u4E8B\u52A1\u4E2D\u5FC3",view:Za},"/me/bookings":{title:"\u6211\u7684\u9884\u7EA6",crumb:"\u6211\u7684 / \u9884\u7EA6",view:ft},"/me/settings":{title:"\u8BBE\u7F6E",crumb:"\u6211\u7684 / \u8BBE\u7F6E",view:Xa},"/repair":{title:"\u62A5\u4FEE",crumb:"\u5BBF\u820D \xB7 \u8BBE\u65BD \xB7 \u516C\u5171\u533A\u57DF",view:Qt}};function dn(){let e=(location.hash||"#/home").slice(1),[a,s=""]=e.split("?");return{path:a||"/home",params:new URLSearchParams(s)}}function ss(e){if(window.__focusGuard){Ee("\u8BF7\u4FDD\u6301\u4E13\u6CE8\uFF0C\u4E0D\u8981\u968F\u610F\u79BB\u5F00\u3002\u82E5\u8981\u79BB\u5F00\uFF0C\u9700\u70B9\u51FB\u6682\u505C\u65F6\u949F","error");return}e.startsWith("#")||(e=`#${e}`),location.hash=e}function cn(e){document.querySelectorAll("[data-route]").forEach(a=>{let s=a.getAttribute("data-route").slice(1),t=!1;s==="/home"?t=e==="/home"||e.startsWith("/home/"):s==="/work"?t=(e==="/work"||e.startsWith("/work/"))&&e!=="/work/news"&&e!=="/work/resources":s==="/assistant"?t=e==="/assistant":t=e===s||e.startsWith(s+"/"),a.classList.toggle("active",t)})}function ln(e){return`<div class="card"><div class="card-title">\u9875\u9762\u52A0\u8F7D\u5931\u8D25</div>
    <div class="card-desc">${le(e.message||"\u8BF7\u7A0D\u540E\u91CD\u8BD5")}</div>
    <div style="margin-top:12px"><button class="btn btn-primary" onclick="location.reload()">\u91CD\u65B0\u52A0\u8F7D</button></div>
  </div>`}var Fe=[],Kt=location.hash||"#/home",ht=!1;async function Jt(){let{path:e,params:a}=dn();if(!ts[e]){location.replace(location.pathname+location.search+"#/home");return}let s=ts[e],t=document.getElementById("view");document.title=`${s.title} \xB7 \u82CF\u5C0F\u5E08`,["/home","/hub","/assistant","/me","/work","/life","/resources","/repair"].includes(e)?Fe=[]:!ht&&Kt!==location.hash&&Fe.push(Kt),ht=!1,Kt=location.hash;let d=document.getElementById("backBtn");d&&(d.hidden=Fe.length===0),cn(e),document.getElementById("sidebar").classList.remove("open"),t.innerHTML=Xt(),window.scrollTo({top:0,behavior:"instant"});try{await s.view(t,{params:a,navigate:ss})}catch(l){console.error(l),t.innerHTML=ln(l)}}function rn(){kt({title:"\u641C\u7D22\u6821\u56ED",body:`<div class="field"><label>\u5730\u70B9\u3001\u522B\u540D\u6216\u5173\u952E\u8BCD</label>
      <input class="input" id="globalSearch" placeholder="\u4F8B\u5982\uFF1A\u56FE\u4E66\u9986\u300121\u4E16\u7EAA\u5927\u697C\u3001\u4E00\u98DF\u5802" autofocus></div>
      <div id="searchResults" style="margin-top:14px"><div class="muted">\u8F93\u5165\u5730\u70B9\u540D\u6216\u522B\u540D\uFF0C\u652F\u6301\u6A21\u7CCA\u5339\u914D\u3002</div></div>`,hideOk:!0,cancelText:"\u5173\u95ED"});let e=document.getElementById("globalSearch"),a=document.getElementById("searchResults"),s=null;e.addEventListener("input",()=>{clearTimeout(s),s=setTimeout(async()=>{let t=e.value.trim();if(t)try{let n=await ke.get(`/places/search?q=${encodeURIComponent(t)}`);if(!n.length){a.innerHTML=`<div class="muted">\u6CA1\u6709\u627E\u5230\u201C${le(t)}\u201D\u3002\u53EF\u4EE5\u5230\u5BFC\u822A\u9875\u63D0\u4EA4\u7EA0\u9519\u3002</div>`;return}a.innerHTML=n.map(d=>`<div class="card" style="padding:12px;margin-bottom:8px;cursor:pointer" data-place="${d.id}">
              <div class="spread"><strong>${le(d.name)}</strong></div>
              <div class="muted">${le(d.alias||"\u65E0\u522B\u540D")} \xB7 ${le(d.entrance||"")}</div>
            </div>`).join(""),a.querySelectorAll("[data-place]").forEach(d=>{d.addEventListener("click",()=>{De(),ss(`/life/nav?to=${d.getAttribute("data-place")}`)})})}catch(n){a.innerHTML=`<div class="muted">${le(n.message)}</div>`}},220)}),setTimeout(()=>e.focus(),80)}document.getElementById("menuBtn").addEventListener("click",()=>{document.getElementById("sidebar").classList.toggle("open")});document.getElementById("menuBtnM").addEventListener("click",()=>{document.getElementById("sidebar").classList.toggle("open")});document.getElementById("searchBtn").addEventListener("click",rn);var $t={\u4E0A\u8BFE:{icon:"\u{1F4D8}",cls:"msg-c-course"},\u5F85\u529E:{icon:"\u2713",cls:"msg-c-todo"},\u65B0\u95FB:{icon:"\u{1F4F0}",cls:"msg-c-news"},\u7701\u94B1:{icon:"\u{1F4B0}",cls:"msg-c-save"},\u642D\u5B50:{icon:"\u{1F465}",cls:"msg-c-buddy"},\u9884\u7EA6:{icon:"\u{1F4C5}",cls:"msg-c-book"}},me={messages:[],unread:0,playing:!1,categories:[]};function Zt(){let e=document.getElementById("msgDot");e&&(e.hidden=me.unread===0,e.textContent=me.unread>99?"99+":String(me.unread))}async function is(){try{let e=await ke.get("/messages");return me.messages=e.messages||[],me.unread=e.unread||0,me.categories=e.categories||Object.keys($t),Zt(),e}catch{return null}}function ns(e){let a=me.messages.find(s=>s.id===e);a&&!a.read&&(a.read=!0,me.unread=Math.max(0,me.unread-1),Zt(),ke.post(`/messages/${e}/read`).catch(()=>{}))}function ds(){if(me.playing)return;let e=window.__focusMode,a=e&&e.active?e.blocked:[],s=me.messages.filter(d=>!d.read&&!a.includes(d.category));if(!s.length)return;me.playing=!0;let t=0,n=()=>{if(t>=s.length){me.playing=!1;return}let d=s[t++],l=$t[d.category]||{},c=document.createElement("div");c.className="msg-popup",c.innerHTML=`
      <div class="mp-ico ${l.cls||""}">${l.icon||"\u{1F514}"}</div>
      <div class="mp-body">
        <div class="mp-head"><span class="mp-cat">${le(d.category)}</span><span class="mp-time">${le((d.created_at||"").slice(5,16))}</span></div>
        <div class="mp-title">${le(d.title)}</div>
        <div class="mp-content">${le(d.content)}</div>
        ${d.action_url?`<span class="mp-action">${le(d.action_text||"\u67E5\u770B")} \u203A</span>`:""}
      </div>
      <button class="mp-close" aria-label="\u5173\u95ED">\xD7</button>
      <i class="mp-progress"></i>`,document.body.appendChild(c),requestAnimationFrame(()=>c.classList.add("show"));let r=!1,o=_=>{r||(r=!0,_&&ns(d.id),c.classList.remove("show"),setTimeout(()=>c.remove(),260),clearTimeout(h),setTimeout(n,350))},h=setTimeout(()=>o(!1),8e3);c.querySelector(".mp-close").addEventListener("click",_=>{_.stopPropagation(),o(!0)}),c.addEventListener("click",()=>{o(!0),cs()})};setTimeout(n,1200)}function cs(){let e=me.messages,a=["\u5168\u90E8",...me.categories||Object.keys($t)],s="\u5168\u90E8";kt({title:"\u6D88\u606F\u4E2D\u5FC3",hideOk:!0,cancelText:"\u5173\u95ED",wide:!0,body:`<div class="mc-box">

      <div class="mc-bar">
        <div class="mc-cats" id="mcCats">
          ${a.map(d=>`<button class="mc-cat ${d==="\u5168\u90E8"?"on":""}" data-cat="${le(d)}">${le(d)}${d==="\u5168\u90E8"&&me.unread?` <i>${me.unread}</i>`:""}</button>`).join("")}
        </div>
        <button class="mc-readall" id="mcReadAll">\u5168\u90E8\u5DF2\u8BFB</button>
      </div>
      <div class="mc-list" id="mcList"></div>
    </div>`});let t=document.getElementById("mcList"),n=()=>{let d=s==="\u5168\u90E8"?e:e.filter(l=>l.category===s);if(!d.length){t.innerHTML='<div class="mc-empty">\u8BE5\u5206\u7C7B\u4E0B\u6682\u65E0\u6D88\u606F</div>';return}t.innerHTML=d.map(l=>{let c=$t[l.category]||{};return`<div class="mc-item ${l.read?"":"unread"}" data-mid="${l.id}" role="button" tabindex="0">
          <div class="mp-ico ${c.cls||""}">${c.icon||"\u{1F514}"}</div>
          <div class="mc-body">
            <div class="mp-head"><span class="mp-cat">${le(l.category)}</span><span class="mp-time">${le((l.created_at||"").slice(5,16))}</span>${l.read?"":'<span class="mc-dot"></span>'}</div>
            <div class="mp-title">${le(l.title)}</div>
            <div class="mp-content">${le(l.content)}</div>
            ${l.action_url?`<span class="mp-action">${le(l.action_text||"\u67E5\u770B")} \u203A</span>`:""}
          </div>
        </div>`}).join(""),t.querySelectorAll("[data-mid]").forEach(l=>{let c=()=>{let r=e.find(h=>h.id===Number(l.getAttribute("data-mid")));if(!r)return;ns(r.id),l.classList.remove("unread");let o=l.querySelector(".mc-dot");o&&o.remove(),r.action_url&&(De(),r.action_url.startsWith("#")?location.hash=r.action_url.slice(1):window.open(r.action_url,"_blank","noopener"))};l.addEventListener("click",c),l.addEventListener("keydown",r=>{r.key==="Enter"&&c()})})};n(),document.getElementById("mcCats").addEventListener("click",d=>{let l=d.target.closest(".mc-cat");l&&(document.querySelectorAll(".mc-cat").forEach(c=>c.classList.remove("on")),l.classList.add("on"),s=l.getAttribute("data-cat"),n())}),document.getElementById("mcReadAll").addEventListener("click",async()=>{try{await ke.post("/messages/read-all"),e.forEach(d=>d.read=!0),me.unread=0,Zt(),n(),Ee("\u5DF2\u5168\u90E8\u6807\u8BB0\u4E3A\u5DF2\u8BFB","success")}catch(d){Ee(d.message,"error")}})}document.getElementById("msgBtn").addEventListener("click",cs);document.getElementById("vrBtn").addEventListener("click",()=>{window.open("https://www.720yun.com/t/79ajOzhvkv8","_blank","noopener")});async function ls(){let e=document.getElementById("meAvatar");if(e)try{let a=await ke.get("/buddy/profile"),s=a&&a.avatar?a.avatar:"";s?e.innerHTML=`<img src="/static/img/avatars/${le(s)}" alt="\u6211\u7684\u5934\u50CF">`:e.textContent="\u5E08"}catch{e.textContent="\u5E08"}}document.getElementById("meAvatar").addEventListener("click",()=>{location.hash="#/me"});window.addEventListener("avatar:updated",ls);ls();var on=2*Math.PI*24;async function yt(){let e=document.getElementById("todoFab"),a=document.getElementById("todoPanel");if(!(!e||!a))try{let[s,t]=await Promise.all([ke.get("/self/control/overview"),ke.get("/self/control/tasks")]),n=new Date().toISOString().slice(0,10),d=(s.tasks||[]).filter(f=>["planned","partial"].includes(f.status)),l=(t||[]).filter(f=>f.status==="done"&&(f.completed_at||"").slice(0,10)===n),c=d.length+l.length,r=c?Math.round(l.length/c*100):0,o=document.getElementById("fabRing");o&&(o.style.strokeDashoffset=String(on*(1-r/100)));let h=document.getElementById("fabNum");h&&(h.textContent=c?`${l.length}/${c}`:"0");let _=document.getElementById("fabPct");_&&(_.textContent=`${r}%`);let E=document.getElementById("fabList");if(!E)return;let k=[...d,...l];E.innerHTML=k.length?k.map(f=>{let M=f.status==="done",q=f.source==="message"?'<span class="src">\u7FA4\u6D88\u606F</span>':"";return`<div class="titem ${M?"done":""}" data-fid="${f.id}" role="button" tabindex="0" aria-label="${le(f.title)} ${M?"\u5DF2\u5B8C\u6210":"\u70B9\u51FB\u5B8C\u6210"}">
              <span class="ck" aria-hidden="true">${M?"\u2713":""}</span>
              <span class="tt">${le(f.title)}</span>
              ${q}
              <span class="tm">${f.estimate_min||""}${f.estimate_min?" \u5206":""}</span>
            </div>`}).join(""):'<div class="fab-empty">\u4ECA\u5929\u6CA1\u6709\u5F85\u529E\uFF0C\u53BB\u81EA\u6211\u63A7\u5236\u5B89\u6392\u4E00\u4E0B</div>',E.querySelectorAll("[data-fid]").forEach(f=>{let M=async()=>{let q=f.getAttribute("data-fid"),U=k.find(u=>String(u.id)===q);if(!(!U||U.status==="done")){f.classList.add("done"),f.querySelector(".ck").textContent="\u2713";try{await ke.patch(`/self/control/tasks/${q}`,{status:"done"}),Ee("\u4EFB\u52A1\u5B8C\u6210\uFF0C+10 \u79EF\u5206","success"),yt(),window.dispatchEvent(new CustomEvent("self:tasks-updated"))}catch(u){f.classList.remove("done"),f.querySelector(".ck").textContent="",Ee(u.message,"error")}}};f.addEventListener("click",M),f.addEventListener("keydown",q=>{(q.key==="Enter"||q.key===" ")&&(q.preventDefault(),M())})})}catch{let t=document.getElementById("fabNum");t&&(t.textContent="\u2014")}}function pn(){let e=document.getElementById("todoFab"),a=document.getElementById("todoPanel");if(!e||!a)return;let s=()=>a.classList.remove("show");e.addEventListener("click",()=>{let n=!a.classList.contains("show");a.classList.toggle("show",n),n&&yt()}),document.addEventListener("click",n=>{a.classList.contains("show")&&(n.target.closest("#todoFab")||n.target.closest("#todoPanel")||s())}),document.addEventListener("keydown",n=>{n.key==="Escape"&&s()});let t=document.getElementById("fabGo");t&&t.addEventListener("click",()=>{s(),location.hash="#/life/self/control"}),yt(),window.addEventListener("hashchange",()=>{a.classList.contains("show")&&yt()})}pn();is().then(e=>{e&&e.unread>0&&ds()});async function rs(){let e=window.__focusMode;if(!(e&&e.active))try{let a=await ke.post("/messages/deadline-reminders");a&&a.created>0&&(await is(),ds())}catch{}}setInterval(rs,6e4);setTimeout(rs,9e3);function un(){let e=document.getElementById("backBtn");e&&(e.addEventListener("click",()=>{if(!Fe.length){location.hash="#/home";return}ht=!0;let a=Fe.pop();if(a===location.hash){ht=!1;return}location.hash=a}),e.hidden=Fe.length===0)}un();function vn(){let e=document.getElementById("campusSelect");if(!e)return;let a=localStorage.getItem("campus")||"\u6CC9\u5C71\u6821\u533A";e.value=a,e.addEventListener("change",()=>{localStorage.setItem("campus",e.value),Ee(`\u5DF2\u5207\u6362\u5230 ${e.value}`),Jt()})}vn();xt(localStorage.getItem("selfTheme")||"default");ke.get("/self/control/shop").then(e=>{let a=e&&e.active;a&&localStorage.getItem("selfTheme")!==a&&xt(a)}).catch(()=>{});var as=!1;function os(){as||(as=!0,Jt())}document.addEventListener("click",e=>{!window.__focusGuard||!e.target.closest('a[href^="#/"], [data-route], #backBtn')||(e.preventDefault(),e.stopPropagation(),Ee("\u8BF7\u4FDD\u6301\u4E13\u6CE8\uFF0C\u4E0D\u8981\u968F\u610F\u79BB\u5F00\u3002\u82E5\u8981\u79BB\u5F00\uFF0C\u9700\u70B9\u51FB\u6682\u505C\u65F6\u949F","error"))},!0);window.addEventListener("hashchange",Jt);window.addEventListener("DOMContentLoaded",os);document.readyState!=="loading"&&os();export{ss as navigate};
