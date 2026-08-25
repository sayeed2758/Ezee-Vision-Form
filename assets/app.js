const API_URL = ""; // Paste your deployed Google Apps Script Web App URL here.
const form=document.getElementById("enquiryForm"),steps=[...document.querySelectorAll(".step")];
let current=0;
const stepNo=document.getElementById("stepNo"),progress=document.getElementById("progress");
const prev=document.getElementById("prev"),next=document.getElementById("next"),submit=document.getElementById("submit");

function render(){
 steps.forEach((s,i)=>s.classList.toggle("active",i===current));
 stepNo.textContent=current+1; progress.style.width=((current+1)/steps.length*100)+"%";
 prev.style.visibility=current===0?"hidden":"visible";
 next.hidden=current===steps.length-1; submit.hidden=current!==steps.length-1;
 if(current===steps.length-1) buildReview();
 window.scrollTo({top:0,behavior:"smooth"});
}
function validStep(){
 const fields=[...steps[current].querySelectorAll("input,select,textarea")];
 for(const f of fields) if(!f.checkValidity()){f.reportValidity();return false}
 return true;
}
next.onclick=()=>{if(validStep()&&current<steps.length-1){current++;render()}};
prev.onclick=()=>{if(current>0){current--;render()}};

function buildReview(){
 const data=new FormData(form), box=document.getElementById("review");
 box.innerHTML="";
 for(const [key,val] of data.entries()){
   if(!val) continue;
   const row=document.createElement("div"); row.className="review-row";
   row.innerHTML=`<b>${key.replace(/([A-Z])/g," $1")}</b><span>${escapeHtml(val)}</span>`;
   box.appendChild(row);
 }
}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}

form.onsubmit=async e=>{
 e.preventDefault(); if(!validStep()) return;
 submit.disabled=true; submit.textContent="Submitting…";
 const payload=Object.fromEntries(new FormData(form)); payload.submittedAt=new Date().toISOString();
 try{
   if(!API_URL) throw new Error("API URL not configured");
   const res=await fetch(API_URL,{method:"POST",body:JSON.stringify(payload)});
   if(!res.ok) throw new Error("Submission failed");
   form.innerHTML=`<div style="text-align:center;padding:35px 5px"><div style="font-size:55px">🎉</div><h2>Response Submitted Successfully</h2><p class="hint">Thank you for contacting EZEE VISION CHAMPUA.</p><button type="button" onclick="location.reload()" style="border:0;border-radius:10px;padding:12px 20px;background:#0c4fb8;color:white;font-weight:700">Submit Another Response</button></div>`;
 }catch(err){
   alert("Demo form is ready, but the Google Apps Script URL is not configured yet.");
   submit.disabled=false; submit.textContent="Submit Response";
 }
};
render();