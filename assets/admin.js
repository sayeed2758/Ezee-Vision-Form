/* EZEE VISION CHAMPUA — Admin dashboard */
const KEY="ezee_vision_pro_v1";
const defaultState={brand:"EZEE VISION CHAMPUA",subtitle:"Student / Enquiry Form",primary:"#1769e8",fields:[],responses:[],nextId:1,submissions:0};
function getState(){try{return JSON.parse(localStorage.getItem(KEY))||structuredClone(defaultState)}catch{return structuredClone(defaultState)}}
function setState(v){localStorage.setItem(KEY,JSON.stringify(v))}
function esc(v){return String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
let s=getState(), currentView="dashboard";
const app=document.getElementById("app");
function layout(){
 app.innerHTML=`<div class="admin-layout"><aside class="sidebar"><div class="sidebrand"><img src="../assets/logo.png"><b>EZEE VISION<br>CHAMPUA</b></div><nav class="nav">
 ${nav("dashboard","📊 Dashboard")} ${nav("responses","📥 Responses")} ${nav("builder","🧩 Form Builder")} ${nav("analytics","📈 Analytics")} ${nav("export","📤 Export / Backup")} ${nav("settings","⚙️ Settings")} </nav><div style="margin-top:25px"><button class="navbtn btn ghost" style="width:100%;color:#fff;border-color:#ffffff33" onclick="openPublic()">↗ Open Form</button></div></aside><main class="admin-main"><div id="view"></div></main></div><div id="drawer" class="drawer"></div><div id="toast" class="toast"></div>`;
 renderView();
}
function nav(id,label){return `<button class="${currentView===id?"active":""}" onclick="go('${id}')">${label}</button>`}
function go(v){currentView=v;layout()}
function renderView(){s=getState();const v=document.getElementById("view");({dashboard:dashboard,responses:responses,builder:builder,analytics:analytics,export:exportPage,settings:settings}[currentView]||dashboard)(v)}
function head(title,sub=""){return `<div class="admin-head"><div><h2>${title}</h2><p class="help">${sub}</p></div><div><button class="btn secondary" onclick="refresh()">↻ Refresh</button></div></div>`}
function dashboard(v){
 const today=new Date().toDateString(),todayCount=s.responses.filter(r=>new Date(r.submittedAt).toDateString()===today).length;
 const month=new Date().toISOString().slice(0,7),monthCount=s.responses.filter(r=>String(r.submittedAt).slice(0,7)===month).length;
 v.innerHTML=head("Dashboard","Overview of your form responses")+`<div class="stats"><div class="stat"><small>Total Responses</small><strong>${s.responses.length}</strong></div><div class="stat"><small>Today</small><strong>${todayCount}</strong></div><div class="stat"><small>This Month</small><strong>${monthCount}</strong></div><div class="stat"><small>Form Fields</small><strong>${s.fields.length}</strong></div></div><br><div class="card"><h3>Latest Responses</h3>${miniTable(s.responses.slice(0,8))}</div>`;
}
function miniTable(rows){if(!rows.length)return `<p class="help">No responses yet. Open the form and submit a test response.</p>`;return `<div class="table-wrap"><table class="table"><thead><tr><th>#</th><th>Name</th><th>Mobile</th><th>Date</th><th>Action</th></tr></thead><tbody>${rows.map((r,i)=>`<tr><td>${i+1}</td><td>${esc(r.fullName||r.name||"—")}</td><td>${esc(r.mobile||"—")}</td><td>${new Date(r.submittedAt).toLocaleString()}</td><td><button class="btn secondary" onclick="viewResponse('${r.id}')">View</button></td></tr>`).join("")}</tbody></table></div>`}
function responses(v){
 v.innerHTML=head("Responses","Search, filter, edit, delete and print submissions")+`<div class="card"><div class="toolbar"><input id="search" placeholder="Search name, mobile, email..."><input id="date" type="date"><button class="btn primary" onclick="renderResponseTable()">Search</button><button class="btn secondary" onclick="clearFilters()">Clear</button><button class="btn success" onclick="downloadCSV()">Export CSV</button></div><div id="responseTable"></div></div>`;renderResponseTable();
}
function renderResponseTable(){
 const q=(document.getElementById("search")?.value||"").toLowerCase(),date=document.getElementById("date")?.value||"";
 let rows=s.responses.filter(r=>JSON.stringify(r).toLowerCase().includes(q));if(date)rows=rows.filter(r=>String(r.submittedAt).slice(0,10)===date);
 const box=document.getElementById("responseTable");if(!box)return;
 box.innerHTML=rows.length?`<div class="table-wrap"><table class="table"><thead><tr><th>Response ID</th><th>Name</th><th>Mobile</th><th>Email</th><th>Submitted</th><th>Actions</th></tr></thead><tbody>${rows.map(r=>`<tr><td><span class="pill">${esc(r.id)}</span></td><td>${esc(r.fullName||"—")}</td><td>${esc(r.mobile||"—")}</td><td>${esc(r.email||"—")}</td><td>${new Date(r.submittedAt).toLocaleString()}</td><td><button class="btn secondary" onclick="viewResponse('${r.id}')">View</button> <button class="btn danger" onclick="deleteResponse('${r.id}')">Delete</button></td></tr>`).join("")}</tbody></table></div>`:`<p class="help">No matching responses.</p>`;
}
function clearFilters(){document.getElementById("search").value="";document.getElementById("date").value="";renderResponseTable()}
function viewResponse(id){
 const r=s.responses.find(x=>x.id===id);if(!r)return;
 document.getElementById("drawer").innerHTML=`<div class="drawer-box"><div class="admin-head"><div><h2>Response ${esc(r.id)}</h2><p class="help">${new Date(r.submittedAt).toLocaleString()}</p></div><button class="btn secondary" onclick="closeDrawer()">Close</button></div><div class="response-grid">${Object.entries(r).filter(([k])=>k!=="id"&&k!=="submittedAt").map(([k,v])=>`<div class="response-field"><small>${esc(s.fields.find(f=>f.id===k)?.label||k)}</small><b>${esc(v)||"—"}</b></div>`).join("")}</div><br><button class="btn primary" onclick="printResponse('${r.id}')">🖨 Print</button></div>`;document.getElementById("drawer").classList.add("open")
}
function closeDrawer(){document.getElementById("drawer").classList.remove("open")}
function deleteResponse(id){if(!confirm("Delete this response permanently from this browser?"))return;s.responses=s.responses.filter(r=>r.id!==id);setState(s);toast("Response deleted");renderView()}
function printResponse(id){const r=s.responses.find(x=>x.id===id);const html=`<html><head><title>Response ${id}</title><style>body{font-family:Arial;padding:30px}h1{color:#071936}.row{padding:10px;border-bottom:1px solid #ddd}.row b{display:inline-block;width:200px}</style></head><body><h1>EZEE VISION CHAMPUA</h1><h2>Response ${id}</h2>${Object.entries(r).map(([k,v])=>`<div class="row"><b>${esc(s.fields.find(f=>f.id===k)?.label||k)}</b>${esc(v)}</div>`).join("")}</body></html>`;const w=open("","_blank");w.document.write(html);w.document.close();w.print()}
function builder(v){
 v.innerHTML=head("Form Builder","Change labels, types, sections, required fields and options")+`<div class="card"><div class="toolbar"><button class="btn primary" onclick="addField()">＋ Add Field</button><button class="btn success" onclick="saveBuilder()">Save Form</button><button class="btn secondary" onclick="resetFormConfig()">Reset Default</button></div><div id="builderList">${s.fields.map((f,i)=>fieldEditor(f,i)).join("")}</div></div>`;
}
function fieldEditor(f,i){return `<div class="setting-card" style="margin:10px 0"><div class="toolbar"><b>#${i+1}</b><button class="btn danger" onclick="removeField(${i})">Delete</button></div><div class="settings-grid"><label>Label<input data-f="${i}" data-k="label" value="${esc(f.label)}"></label><label>Section<input data-f="${i}" data-k="section" value="${esc(f.section||"General")}"></label><label>Type<select data-f="${i}" data-k="type"><option ${f.type==="text"?"selected":""}>text</option><option ${f.type==="tel"?"selected":""}>tel</option><option ${f.type==="email"?"selected":""}>email</option><option ${f.type==="select"?"selected":""}>select</option><option ${f.type==="textarea"?"selected":""}>textarea</option></select></label><label>Placeholder<input data-f="${i}" data-k="placeholder" value="${esc(f.placeholder||"")}"></label></div><label class="inline"><input class="switch" type="checkbox" data-f="${i}" data-k="required" ${f.required?"checked":""}> Required field</label><label>Options (for select, comma separated)<input data-f="${i}" data-k="options" value="${esc((f.options||[]).join(", "))}"></label></div>`}
function collectBuilder(){document.querySelectorAll("[data-f]").forEach(el=>{const i=+el.dataset.f,k=el.dataset.k;if(k==="required")s.fields[i][k]=el.checked;else if(k==="options")s.fields[i][k]=el.value.split(",").map(x=>x.trim()).filter(Boolean);else s.fields[i][k]=el.value})}
function saveBuilder(){collectBuilder();setState(s);toast("Form saved");renderView()}
function addField(){s.fields.push({id:"custom_"+Date.now(),label:"New Field",type:"text",required:false,placeholder:"",section:"General"});renderView()}
function removeField(i){if(confirm("Remove this field?")){s.fields.splice(i,1);setState(s);renderView()}}
function resetFormConfig(){if(confirm("Restore the default form fields?")){localStorage.removeItem(KEY);s=getState();renderView()}}
function analytics(v){
 const byDay={};s.responses.forEach(r=>{const d=String(r.submittedAt).slice(0,10);byDay[d]=(byDay[d]||0)+1});const vals=Object.entries(byDay).slice(-14);const max=Math.max(1,...vals.map(x=>x[1]));
 v.innerHTML=head("Analytics","Simple response trends from your stored submissions")+`<div class="card"><h3>Last ${vals.length} days</h3><div class="chart">${vals.map(([d,n])=>`<div class="bar" style="height:${Math.max(5,n/max*90)}%"><span>${n}</span></div>`).join("")}</div><div style="display:flex;justify-content:space-between;color:#667085;font-size:11px">${vals.length?`<span>${vals[0][0]}</span><span>${vals.at(-1)[0]}</span>`:""}</div></div><br><div class="stats"><div class="stat"><small>Total</small><strong>${s.responses.length}</strong></div><div class="stat"><small>Fields</small><strong>${s.fields.length}</strong></div></div>`;
}
function exportPage(v){
 v.innerHTML=head("Export & Backup","Download your responses or create a portable backup")+`<div class="settings-grid"><div class="card"><h3>📤 Export</h3><p class="help">CSV is compatible with Excel and Google Sheets.</p><button class="btn success" onclick="downloadCSV()">Download CSV</button> <button class="btn primary" onclick="downloadJSON()">Download JSON</button></div><div class="card"><h3>💾 Backup</h3><p class="help">Save the complete form configuration and responses.</p><button class="btn primary" onclick="downloadBackup()">Download Backup</button><label class="btn secondary" style="margin-top:10px"><input type="file" accept=".json" hidden onchange="restoreBackup(this.files[0])">Restore Backup</label></div></div>`;
}
function csvEscape(v){return '"'+String(v??"").replace(/"/g,'""')+'"'}
function downloadCSV(){const keys=[...new Set(s.responses.flatMap(r=>Object.keys(r)))];const out=[keys.map(csvEscape).join(","),...s.responses.map(r=>keys.map(k=>csvEscape(r[k])).join(","))].join("\n");download("ezee-vision-responses.csv","text/csv",out)}
function downloadJSON(){download("ezee-vision-responses.json","application/json",JSON.stringify(s.responses,null,2))}
function downloadBackup(){download("ezee-vision-backup.json","application/json",JSON.stringify(s,null,2))}
function download(name,type,text){const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([text],{type}));a.download=name;a.click();URL.revokeObjectURL(a.href)}
function restoreBackup(file){if(!file)return;const r=new FileReader();r.onload=()=>{try{const x=JSON.parse(r.result);if(!x.fields||!x.responses)throw 0;setState(x);s=x;toast("Backup restored");renderView()}catch{alert("Invalid backup file.")}};r.readAsText(file)}
function settings(v){
 v.innerHTML=head("Settings","Branding, security and connection settings")+`<div class="settings-grid"><div class="card"><h3>🎨 Branding</h3><label>Form Subtitle<input id="subtitle" value="${esc(s.subtitle)}"></label><label>Primary Color<input id="primary" type="color" value="${esc(s.primary)}"></label><button class="btn success" onclick="saveSettings()">Save Settings</button></div><div class="card"><h3>🔐 Admin Access</h3><p class="help">This demo dashboard is protected by a browser-local PIN. It is not a server-side security system.</p><button class="btn secondary" onclick="setPin()">Change Admin PIN</button><button class="btn danger" onclick="logout()">Lock Dashboard</button></div><div class="card"><h3>☁️ Google Sheets</h3><p class="help">A ready Apps Script backend is included in the ZIP. Add the Web App URL in the optional sync section of the project when you want cloud storage.</p><button class="btn primary" onclick="alert('See api/Code.gs and README.md in the ZIP for Google Sheets deployment.')">Setup Guide</button></div></div>`;
}
function saveSettings(){s.subtitle=document.getElementById("subtitle").value;s.primary=document.getElementById("primary").value;setState(s);toast("Settings saved")}
function openPublic(){location.href="../index.html"}
function refresh(){s=getState();renderView();toast("Dashboard refreshed")}
function logout(){sessionStorage.removeItem("ezee_admin_ok");location.reload()}
function toast(t){const x=document.getElementById("toast");if(!x)return;x.textContent=t;x.classList.add("show");setTimeout(()=>x.classList.remove("show"),1800)}
function setPin(){const old=prompt("Enter current PIN:");if(old!==(localStorage.getItem("ezee_admin_pin")||"1234"))return alert("Incorrect PIN.");const n=prompt("Enter new 4+ digit PIN:");if(n&&n.length>=4){localStorage.setItem("ezee_admin_pin",n);toast("PIN changed")}}
function login(){
 app.innerHTML=`<div class="modal open"><div class="modal-card"><img class="login-logo" src="../assets/logo.png"><h3 style="text-align:center">Admin Dashboard</h3><p class="help" style="text-align:center">EZEE VISION CHAMPUA</p><label>Admin PIN<input id="pin" type="password" inputmode="numeric" placeholder="Enter PIN"></label><button class="btn primary" style="width:100%" onclick="checkLogin()">Unlock Dashboard</button><p class="help" style="text-align:center">First-use demo PIN: 1234</p></div></div>`;
}
function checkLogin(){const p=document.getElementById("pin").value;if(p===(localStorage.getItem("ezee_admin_pin")||"1234")){sessionStorage.setItem("ezee_admin_ok","1");layout()}else alert("Incorrect PIN.")}
if(sessionStorage.getItem("ezee_admin_ok")==="1")layout();else login();
