/* EZEE VISION CHAMPUA — Public Form Engine v4 */
const KEY="ezee_vision_ultimate_v3";
const defaultState={
 brand:"EZEE VISION CHAMPUA",subtitle:"Student / Enquiry Form",primary:"#0d6efd",
 fields:[
  {id:"fullName",label:"Full Name",type:"text",required:true,placeholder:"Enter your full name",section:"Personal Information"},
  {id:"fatherName",label:"Father's Name",type:"text",required:true,placeholder:"Enter father's name",section:"Personal Information"},
  {id:"mobile",label:"Mobile Number",type:"tel",required:true,placeholder:"Enter 10-digit mobile number",section:"Personal Information"},
  {id:"whatsapp",label:"WhatsApp Number",type:"tel",required:false,placeholder:"Enter WhatsApp number",section:"Personal Information"},
  {id:"email",label:"Email Address",type:"email",required:false,placeholder:"Enter email address",section:"Personal Information"},
  {id:"school",label:"School / Institution",type:"text",required:false,placeholder:"Enter school name",section:"Academic Details"},
  {id:"class",label:"Class",type:"select",required:true,options:["8th","9th","10th","11th","12th","Other"],section:"Academic Details"},
  {id:"course",label:"Course Interested",type:"text",required:true,placeholder:"e.g. CBSE, JEE, NEET",section:"Academic Details"},
  {id:"subjects",label:"Subjects",type:"text",required:false,placeholder:"e.g. Maths, Science",section:"Academic Details"},
  {id:"preferredTime",label:"Preferred Time",type:"select",required:false,options:["Morning","Afternoon","Evening"],section:"Preferences"},
  {id:"source",label:"How did you hear about us?",type:"select",required:false,options:["Direct","WhatsApp","QR Code","Instagram","Friend / Referral","Other"],section:"Preferences"},
  {id:"message",label:"Additional Message",type:"textarea",required:false,placeholder:"Write your enquiry or message",section:"Preferences"}
 ],responses:[],lastSync:""
};
function load(){try{return JSON.parse(localStorage.getItem(KEY))||structuredClone(defaultState)}catch{return structuredClone(defaultState)}}
function save(x){localStorage.setItem(KEY,JSON.stringify(x))}
let state=load(),app=document.getElementById("app");
const API=(window.EV_CONFIG||{}).API_URL||"";
const esc=v=>String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
const norm=v=>String(v??"").trim().toLowerCase().replace(/\s+/g," ");
const digits=v=>String(v??"").replace(/\D/g,"");
const secs=()=>[...new Set(state.fields.map(f=>f.section||"General"))];
function duplicateLocal(data){
 const name=norm(data.fullName),father=norm(data.fatherName),mobile=digits(data.mobile),email=norm(data.email);
 return state.responses.find(r=>{
  if(r.id===data.id)return false;
  const sameMain=norm(r.fullName)===name&&norm(r.fatherName)===father&&digits(r.mobile)===mobile;
  const sameEmail=email&&norm(r.email)===email&&norm(r.fullName)===name&&norm(r.fatherName)===father;
  return sameMain||sameEmail;
 });
}
function fieldHTML(f){
 const star=f.required?'<span class="req">*</span>':"",required=f.required?"required":"";let i;
 if(f.type==="textarea")i=`<textarea name="${esc(f.id)}" rows="4" placeholder="${esc(f.placeholder||"")}" ${required}></textarea>`;
 else if(f.type==="select")i=`<select name="${esc(f.id)}" ${required}><option value="">Select ${esc(f.label)}</option>${(f.options||[]).map(o=>`<option>${esc(o)}</option>`).join("")}</select>`;
 else i=`<input name="${esc(f.id)}" type="${esc(f.type||"text")}" placeholder="${esc(f.placeholder||"")}" ${required}>`;
 return `<div class="field"><label>${esc(f.label)} ${star}</label>${i}</div>`;
}
function render(){
 state=load();const groups=secs();
 app.innerHTML=`<div class="topbar-wrap"><div class="shell topbar"><div class="brand"><img src="assets/logo.png"><div><h1>EZEE VISION <span>CHAMPUA</span></h1><p>${esc(state.subtitle)}</p></div></div><button class="btn share-btn" id="share">↗ &nbsp;Share</button></div></div>
 <main class="shell form-wrap"><div class="card"><p class="step-meta">Step <b id="stepNo">1</b> of ${groups.length+1}</p><div class="progress-line"><i id="bar"></i></div>
 <form id="f">${groups.map((g,ix)=>`<section class="step ${ix===0?"active":""}"><div class="section-head"><div class="section-icon">${g==="Academic Details"?"📚":g==="Preferences"?"🕐":"👤"}</div><div><h2>${esc(g)}</h2><p>Please provide the information below.</p></div></div>${state.fields.filter(x=>x.section===g).map(fieldHTML).join("")}</section>`).join("")}
 <section class="step"><div class="section-head"><div class="section-icon">✓</div><div><h2>Review & Submit</h2><p>Check everything before sending.</p></div></div><div id="review" class="review-grid"></div><div class="duplicate-note">🔒 Each student can submit the form only once using the same student details.</div></section>
 <div class="form-actions"><button type="button" class="btn secondary" id="prev">Previous</button><button type="button" class="btn primary" id="next">Next</button><button type="submit" class="btn success" id="submit" hidden>Submit Response</button></div></form></div><div class="footer">Made with ❤️ by Shahid Sir</div></main><div id="toast" class="toast"></div>`;
 bind(groups.length+1);
}
function bind(){
 let cur=0,steps=[...document.querySelectorAll(".step")],f=document.getElementById("f");
 const prev=document.getElementById("prev"),next=document.getElementById("next"),submit=document.getElementById("submit");
 function show(){steps.forEach((x,i)=>x.classList.toggle("active",i===cur));document.getElementById("stepNo").textContent=cur+1;document.getElementById("bar").style.width=((cur+1)/steps.length*100)+"%";prev.style.visibility=cur?"visible":"hidden";next.hidden=cur===steps.length-1;submit.hidden=cur!==steps.length-1;if(cur===steps.length-1)review();scrollTo({top:0,behavior:"smooth"})}
 function valid(){for(const el of steps[cur].querySelectorAll("input,select,textarea")){if(!el.checkValidity()){el.reportValidity();return false}}return true}
 function review(){const d=Object.fromEntries(new FormData(f));document.getElementById("review").innerHTML=Object.entries(d).map(([k,v])=>`<div class="review-item"><small>${esc(state.fields.find(x=>x.id===k)?.label||k)}</small><b>${esc(v)||"—"}</b></div>`).join("")}
 next.onclick=()=>{if(valid()&&cur<steps.length-1){cur++;show()}};prev.onclick=()=>{if(cur){cur--;show()}};
 f.onsubmit=async e=>{e.preventDefault();if(!valid())return;await submitResponse(Object.fromEntries(new FormData(f)),f,submit)};
 document.getElementById("share").onclick=async()=>{try{if(navigator.share)await navigator.share({title:state.brand,text:"Open EZEE VISION CHAMPUA enquiry form",url:location.href});else{await navigator.clipboard.writeText(location.href);toast("Form link copied")}}catch{}};
 show();
}
async function submitResponse(data,form,button){
 button.disabled=true;button.textContent="Checking…";
 const localDup=duplicateLocal(data);
 if(localDup){showDuplicate(localDup.id);button.disabled=false;button.textContent="Submit Response";return}
 const id=crypto.randomUUID?crypto.randomUUID().slice(0,8).toUpperCase():Date.now().toString(36).toUpperCase();
 const item={id,submittedAt:new Date().toISOString(),syncStatus:API?"pending":"local",...data};
 let cloud=false,emailSent=false,duplicate=false,serverId="";
 if(API){
  try{
   const r=await fetch(API,{method:"POST",redirect:"follow",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify({action:"create",data:item})});
   const result=await r.json();
   if(result.duplicate){duplicate=true;serverId=result.existingId||""}
   else if(result.ok){cloud=true;emailSent=!!result.emailSent}
  }catch{}
 }
 if(duplicate){showDuplicate(serverId);button.disabled=false;button.textContent="Submit Response";return}
 item.syncStatus=cloud?"cloud":"local";item.notificationStatus=cloud?(emailSent?"sent":"not_sent"):"pending_cloud";
 state.responses.unshift(item);save(state);
 form.innerHTML=`<div class="success-screen"><div class="success-icon">✓</div><h2>Response Submitted Successfully</h2><p class="help">Thank you for contacting <b>${esc(state.brand)}</b>.</p><p class="help">Response ID: <b>${esc(id)}</b></p>${cloud?`<p class="cloud-status">☁ Saved to central storage${emailSent?" • 📧 Notification sent":""}</p>`:`<p class="cloud-status off">✓ Saved on this device • Cloud not configured</p>`}<br><br><button type="button" class="btn primary" onclick="location.reload()">Submit Another Response</button></div>`;
}
function showDuplicate(id){
 const msg=id?`This student has already submitted a form. Existing Response ID: ${id}.`:`This student has already submitted a form.`;
 document.querySelectorAll(".step").forEach(x=>x.classList.remove("active"));
 const holder=document.querySelector("#f");holder.innerHTML=`<div class="duplicate-screen"><div class="duplicate-icon">!</div><h2>Form Already Submitted</h2><p>${esc(msg)}</p><p class="help">If the information is incorrect, please contact EZEE VISION CHAMPUA.</p><button type="button" class="btn primary" onclick="location.reload()">Back to Form</button></div>`;
}
function toast(t){const x=document.getElementById("toast");if(!x)return;x.textContent=t;x.classList.add("show");setTimeout(()=>x.classList.remove("show"),1800)}
render();
