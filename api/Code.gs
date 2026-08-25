/**
 * EZEE VISION CHAMPUA — optional Google Sheets backend
 *
 * 1. Create a Google Sheet.
 * 2. Extensions → Apps Script.
 * 3. Paste this file.
 * 4. Deploy → New deployment → Web app.
 *    Execute as: Me
 *    Who has access: Anyone
 * 5. Copy the Web App URL.
 *
 * IMPORTANT: the static demo stores data in the browser by default.
 * For production cloud storage, connect this endpoint from app.js and
 * add authentication/rate limiting appropriate for your use case.
 */
const SHEET_NAME = "Responses";

function doGet(){
  const sh=getSheet();
  const values=sh.getDataRange().getValues();
  if(values.length<2)return output([]);
  const headers=values.shift();
  return output(values.map(row=>Object.fromEntries(headers.map((h,i)=>[h,row[i]]))));
}

function doPost(e){
  const data=JSON.parse(e.postData.contents||"{}");
  const sh=getSheet();
  let headers=getHeaders(sh);
  const incoming=Object.keys(data);
  const missing=incoming.filter(k=>!headers.includes(k));
  if(missing.length){
    sh.getRange(1,headers.length+1,1,missing.length).setValues([missing]);
    headers=headers.concat(missing);
  }
  sh.appendRow(headers.map(h=>data[h]??""));
  return output({ok:true});
}

function getSheet(){
  const ss=SpreadsheetApp.getActiveSpreadsheet();
  let sh=ss.getSheetByName(SHEET_NAME);
  if(!sh)sh=ss.insertSheet(SHEET_NAME);
  return sh;
}
function getHeaders(sh){
  const last=sh.getLastColumn();
  if(last===0)return [];
  return sh.getRange(1,1,1,last).getValues()[0].filter(String);
}
function output(data){
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
