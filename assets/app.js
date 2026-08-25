/* EZEE VISION CHAMPUA — Public form app */
const EVStore={
 key:"ezee_vision_pro_v1",
 defaults:{
  brand:"EZEE VISION CHAMPUA",subtitle:"Student / Enquiry Form",primary:"#1769e8",
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
  ],
  responses:[], nextId:1, submissions:0
 },
 get(){try{return JSON.parse(localStorage.getItem(this.key))||structuredClone(this.defaults)}catch{return structuredClone(this.defaults)}},
 set(v){localStorage.setItem(this.key,JSON.stringify(v))}
};
let state=EVStore.get();
const app=document.getElementById("app");

function esc(v){return String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
function iconFor(s){return s==="Academic Details"?"📚":s==="Preferences"?"🕐":"👤"}
function sections(fields){return [...new Set(fields.map(f=>f.section||"General"))]}
function renderForm(){
 state=EVStore.get();
 const secs=sections(state.fields), steps=secs.map(sec=>state.fields.filter(f=>f.section===sec));
 app.innerHTML=`<div class="darkbar"><div class="shell topbar"><div class="brand"><img src="assets/logo.png"><div><h1>EZEE VISION <span>CHAMPUA</span></h1><p>${esc(state.subtitle)}</p></div></div><button class="btn ghost" style="color:#fff;border-color:#ffffff44" onclick="shareForm()">↗ Share</button></div></div>
 <main class="shell"><div class="form-wrap"><div class="card">
 <p class="stepsmall">Step <b id="stepNo">1</b> of ${steps.length}</p><div class="progress"><i id="bar"></i></div>
 <form id="publicForm" novalidate>${steps.map((fs,i)=>`<section class="step ${i===0?"active":""}" data-step="${i}"><div class="section-title"><div class="section-icon">${iconFor(fs[0]?.section)}</div><div><h3>${esc(fs[0]?.section||"Form")}</h3><p>Please provide the information below.</p></div></div>${fs.map(fieldHTML).join("")}</section>`).join("")}
 <div id="reviewStep" class="step"><div class="section-title"><div class="section-icon">✅</div><div><h3>Review & Submit</h3><p>Please check your information.</p></div></div><div id="review" class="review-grid"></div><p class="help">By submitting, you agree that EZEE VISION CHAMPUA may use this information to respond to your enquiry.</p></div>
 <div class="form-actions"><button type="button" class="btn secondary" id="prev">Previous</button><button type="button" class="btn primary" id="next">Next</button><button type="submit" class="btn success" id="submit" hidden>Submit Response</button></div></form></div><div class="footer">Made with ❤️ by Shahid Sir</div></div></main><div id="toast" class="toast"></div>`;
 bindForm(steps.length+1);
}
function fieldHTML(f){
 const req=f.required?"required":"", star=f.required?'<span class="req">*</span>':"";
 let input="";
 if(f.type==="textarea") input=`<textarea name="${esc(f.id)}" rows="4" placeholder="${esc(f.placeholder||"")} " ${req}></textarea>`;
 else if(f.type==="select") input=`<select name="${esc(f.id)}" ${req}><option value="">Select ${esc(f.label)}</option>${(f.options||[]).map(o=>`<option>${esc(o)}</option>`).join("")}</select>`;
 else input=`<input name="${esc(f.id)}" type="${esc(f.type||"text")}" placeholder="${esc(f.placeholder||"")}" ${req}>`;
 return `<div class="field"><label>${esc(f.label)} ${star}</label>${input}</div>`;
}
function bindForm(total){
 let cur=0;const sections=[...document.querySelectorAll(".step")], form=document.getElementById("publicForm");
 const prev=document.getElementById("prev"),next=document.getElementById("next"),submit=document.getElementById("submit");
 function show(){
  sections.forEach((s,i)=>s.classList.toggle("active",i===cur));
  document.getElementById("stepNo").textContent=cur+1;document.getElementById("bar").style.width=((cur+1)/sections.length*100)+"%";
  prev.style.visibility=cur===0?"hidden":"visible";next.hidden=cur===sections.length-1;submit.hidden=cur!==sections.length-1;
  if(cur===sections.length-1) buildReview(); window.scrollTo({top:0,behavior:"smooth"});
 }
 function valid(){
  for(const el of sections[cur].querySelectorAll("input,select,textarea")){if(!el.checkValidity()){el.reportValidity();return false}}
  return true;
 }
 next.onclick=()=>{if(valid()&&cur<sections.length-1){cur++;show()}};
 prev.onclick=()=>{if(cur>0){cur--;show()}};
 form.onsubmit=e=>{e.preventDefault();if(!valid())return;saveResponse(Object.fromEntries(new FormData(form)),form)};
 function buildReview(){const box=document.getElementById("review");const data=Object.fromEntries(new FormData(form));box.innerHTML=Object.entries(data).map(([k,v])=>`<div class="review-item"><small>${esc(state.fields.find(f=>f.id===k)?.label||k)}</small><b>${esc(v)||"—"}</b></div>`).join("")}
 show();
}
function saveResponse(data,form){
 state=EVStore.get();const id=Date.now().toString(36).toUpperCase();const item={id,submittedAt:new Date().toISOString(),...data};
 state.responses.unshift(item);state.submissions=(state.submissions||0)+1;EVStore.set(state);
 form.innerHTML=`<div class="success-screen"><div class="success-icon">✓</div><h2>Response Submitted!</h2><p class="hint">Thank you for contacting <b>${esc(state.brand)}</b>.</p><p class="help">Response ID: <b>${esc(id)}</b></p><button type="button" class="btn primary" onclick="location.reload()">Submit Another Response</button></div>`;
}
async function shareForm(){
 const url=location.href;
 try{if(navigator.share)await navigator.share({title:state.brand,text:"Open the EZEE VISION CHAMPUA form",url});else{await navigator.clipboard.writeText(url);alert("Form link copied.")}}catch{}
}
renderForm();
