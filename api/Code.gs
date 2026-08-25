/**
 * EZEE VISION CHAMPUA — CENTRAL STORAGE + EMAIL NOTIFICATION
 *
 * Features:
 * - Google Sheets central response storage
 * - Duplicate-student protection
 * - Instant email notification after successful submission
 * - Cloud list / edit / delete for admin
 * - LockService prevents duplicate race conditions
 *
 * SETUP:
 * 1) Create a Google Sheet.
 * 2) Extensions → Apps Script.
 * 3) Paste this file.
 * 4) Set ADMIN_TOKEN to a long random secret.
 * 5) Optional: set NOTIFICATION_EMAIL to your email. If blank, the
 *    script uses the account that deployed the web app (when available).
 * 6) Deploy → New deployment → Web app → Execute as Me → Anyone.
 * 7) Put the Web App URL + ADMIN_TOKEN in assets/config.js.
 */
const SHEET_NAME = "Responses";
const ADMIN_TOKEN = "EVChampua_2026_9X7K_Form_Admin_82Qp";
const NOTIFICATION_EMAIL = "creativesayeedd@gmail.com"; // Optional. Leave blank to use the deploying account.
const DUPLICATE_HOURS = 0; // 0 = never allow the same student twice; change only if needed.

function doPost(e) {
  try {
    const body = JSON.parse((e && e.postData && e.postData.contents) || "{}");
    const action = body.action || "create";
    if (action === "create") return createResponse(body.data || {});
    if (action === "update") return updateResponse(body);
    if (action === "delete") return deleteResponse(body);
    return out({ok:false,error:"unknown_action"});
  } catch (err) {
    return out({ok:false,error:String(err)});
  }
}

function doGet(e) {
  try {
    const action = (e && e.parameter && e.parameter.action) || "list";
    const token = (e && e.parameter && e.parameter.token) || "";
    if (token !== ADMIN_TOKEN) return out({ok:false,error:"unauthorized"});
    if (action === "list") return listResponses();
    if (action === "check") return checkDuplicate(e.parameter.name || "", e.parameter.father || "", e.parameter.mobile || "", e.parameter.email || "");
    return out({ok:false,error:"unknown_action"});
  } catch (err) { return out({ok:false,error:String(err)}); }
}

function createResponse(data) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sh = getSheet();
    const normalized = normalizeData(data);
    const duplicate = findDuplicate(sh, normalized);
    if (duplicate) {
      return out({ok:false,duplicate:true,error:"duplicate_student",existingId:duplicate.id});
    }

    let headers = getHeaders(sh);
    const keys = Object.keys(normalized);
    const missing = keys.filter(k => !headers.includes(k));
    if (missing.length) {
      sh.getRange(1, headers.length + 1, 1, missing.length).setValues([missing]);
      headers = headers.concat(missing);
    }
    sh.appendRow(headers.map(h => normalized[h] ?? ""));

    const emailResult = sendNotification(normalized);
    return out({ok:true,cloud:true,emailSent:emailResult.sent,emailError:emailResult.error || ""});
  } finally {
    lock.releaseLock();
  }
}

function updateResponse(body) {
  if (body.token !== ADMIN_TOKEN) return out({ok:false,error:"unauthorized"});
  const sh = getSheet();
  const values = sh.getDataRange().getValues();
  if (values.length < 2) return out({ok:false,error:"not_found"});
  const headers = values[0];
  const idIdx = headers.indexOf("id");
  if (idIdx < 0) return out({ok:false,error:"id_column_missing"});
  const id = String(body.id || "");
  for (let i=1;i<values.length;i++) {
    if (String(values[i][idIdx]) === id) {
      const current = Object.fromEntries(headers.map((h,j)=>[h,values[i][j]]));
      const next = normalizeData(Object.assign(current, body.data || {}));
      const duplicate = findDuplicate(sh, next, id);
      if (duplicate) return out({ok:false,duplicate:true,error:"duplicate_student",existingId:duplicate.id});
      sh.getRange(i+1,1,1,headers.length).setValues([headers.map(h=>next[h] ?? "")]);
      return out({ok:true,updated:true});
    }
  }
  return out({ok:false,error:"not_found"});
}

function deleteResponse(body) {
  if (body.token !== ADMIN_TOKEN) return out({ok:false,error:"unauthorized"});
  const sh = getSheet(), values = sh.getDataRange().getValues();
  if (values.length < 2) return out({ok:true});
  const headers = values[0], idx = headers.indexOf("id");
  if (idx < 0) return out({ok:false,error:"id_column_missing"});
  for (let i=1;i<values.length;i++) {
    if (String(values[i][idx]) === String(body.id || "")) { sh.deleteRow(i+1); return out({ok:true,deleted:true}); }
  }
  return out({ok:false,error:"not_found"});
}

function listResponses() {
  const sh = getSheet(), values = sh.getDataRange().getValues();
  if (values.length < 2) return out([]);
  const headers = values[0];
  return out(values.slice(1).map(row => Object.fromEntries(headers.map((h,i)=>[h,row[i]]))));
}

function checkDuplicate(name, father, mobile, email) {
  const sh = getSheet();
  const d = {fullName:name,fatherName:father,mobile:mobile,email:email};
  const found = findDuplicate(sh, normalizeData(d));
  return out(found ? {duplicate:true,existingId:found.id} : {duplicate:false});
}

function findDuplicate(sh, data, ignoreId) {
  const values = sh.getDataRange().getValues();
  if (values.length < 2) return null;
  const headers = values[0];
  const map = {}; headers.forEach((h,i)=>map[h]=i);
  const mobile = norm(data.mobile);
  const email = norm(data.email);
  const name = norm(data.fullName);
  const father = norm(data.fatherName);
  const key = studentKey(name,father,mobile,email);
  for (let i=1;i<values.length;i++) {
    const row = values[i];
    const id = String(row[map.id] || "");
    if (ignoreId && id === String(ignoreId)) continue;
    const existing = {
      id,
      fullName: row[map.fullName] || "",
      fatherName: row[map.fatherName] || "",
      mobile: row[map.mobile] || "",
      email: row[map.email] || ""
    };
    const sameKey = studentKey(norm(existing.fullName),norm(existing.fatherName),norm(existing.mobile),norm(existing.email)) === key;
    const sameMobileStudent = mobile && norm(existing.mobile) === mobile && norm(existing.fullName) === name && norm(existing.fatherName) === father;
    const sameEmailStudent = email && norm(existing.email) === email && norm(existing.fullName) === name && norm(existing.fatherName) === father;
    if (sameKey || sameMobileStudent || sameEmailStudent) return existing;
  }
  return null;
}

function studentKey(name,father,mobile,email) {
  // Mobile is the strongest identifier; name + father prevents a shared-family
  // mobile from blocking a different student.
  if (mobile) return [name,father,mobile].join("|");
  if (email) return [name,father,email].join("|");
  return [name,father].join("|");
}

function normalizeData(data) {
  const x = Object.assign({}, data);
  x.fullName = clean(x.fullName);
  x.fatherName = clean(x.fatherName);
  x.mobile = digits(x.mobile);
  x.whatsapp = digits(x.whatsapp);
  x.email = clean(x.email).toLowerCase();
  x.id = x.id || Utilities.getUuid().slice(0,8).toUpperCase();
  x.submittedAt = x.submittedAt || new Date().toISOString();
  return x;
}
function clean(v){return String(v == null ? "" : v).trim().replace(/\s+/g," ");}
function digits(v){return clean(v).replace(/\D/g,"");}
function norm(v){return clean(v).toLowerCase().replace(/[^a-z0-9@.]+/g,"");}

function sendNotification(d) {
  try {
    const recipient = NOTIFICATION_EMAIL || Session.getEffectiveUser().getEmail();
    if (!recipient) return {sent:false,error:"notification_email_not_configured"};
    const subject = "🔔 New Student Enquiry — " + (d.fullName || "New Response") + " | EZEE VISION CHAMPUA";
    const rows = [
      ["Response ID",d.id], ["Full Name",d.fullName], ["Father's Name",d.fatherName],
      ["Mobile Number",d.mobile], ["WhatsApp Number",d.whatsapp], ["Email Address",d.email],
      ["Class",d.class], ["Course Interested",d.course], ["School / Institution",d.school],
      ["Preferred Time",d.preferredTime], ["Source",d.source], ["Additional Message",d.message]
    ].filter(x => x[1] !== "" && x[1] != null);
    const text = "New form response received.\n\n" + rows.map(x=>x[0]+": "+x[1]).join("\n") + "\n\nSubmitted: " + d.submittedAt;
    const html = '<div style="font-family:Arial,sans-serif;max-width:650px;margin:auto;color:#172033">' +
      '<div style="background:linear-gradient(135deg,#061b3d,#0d55a4);padding:22px;border-radius:14px;color:#fff">' +
      '<h2 style="margin:0">EZEE VISION <span style="color:#f4c542">CHAMPUA</span></h2>' +
      '<p style="margin:6px 0 0">New Student / Enquiry Form Response</p></div>' +
      '<div style="margin-top:15px;border:1px solid #dfe6ef;border-radius:12px;overflow:hidden">' +
      rows.map(x=>'<div style="padding:10px 13px;border-bottom:1px solid #edf1f5"><b>'+escapeHtml(x[0])+'</b><div style="margin-top:3px">'+escapeHtml(String(x[1]))+'</div></div>').join("") +
      '</div><p style="font-size:11px;color:#66758a">Made with ❤️ by Shahid Sir</p></div>';
    MailApp.sendEmail({to:recipient,subject:subject,body:text,htmlBody:html,name:"EZEE VISION CHAMPUA"});
    return {sent:true};
  } catch (err) { return {sent:false,error:String(err)}; }
}
function escapeHtml(v){return String(v).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));}
function getSheet(){const ss=SpreadsheetApp.getActiveSpreadsheet();let sh=ss.getSheetByName(SHEET_NAME);if(!sh)sh=ss.insertSheet(SHEET_NAME);return sh;}
function getHeaders(sh){if(sh.getLastColumn()===0)return [];return sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0].filter(String);}
function out(x){return ContentService.createTextOutput(JSON.stringify(x)).setMimeType(ContentService.MimeType.JSON);}
