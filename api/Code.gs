/**
 * EZEE VISION CHAMPUA — Google Sheets Cloud Storage API
 *
 * SETUP:
 * 1) Create a Google Sheet.
 * 2) Extensions → Apps Script.
 * 3) Paste this code.
 * 4) Set ADMIN_TOKEN to a long random secret.
 * 5) Deploy as Web App: Execute as you; Who has access: Anyone.
 * 6) Put the Web App URL + same token in assets/config.js.
 *
 * This gives one central spreadsheet for responses.
 */
const SHEET_NAME = "Responses";
const ADMIN_TOKEN = "CHANGE_THIS_TO_A_LONG_RANDOM_SECRET";

function doPost(e){
  const body=JSON.parse(e.postData.contents||"{}");
  if(body.action==="create"){
    const sh=getSheet(); const d=body.data||{};
    let headers=getHeaders(sh);
    const keys=Object.keys(d);
    const missing=keys.filter(k=>!headers.includes(k));
    if(missing.length){sh.getRange(1,headers.length+1,1,missing.length).setValues([missing]);headers=headers.concat(missing);}
    sh.appendRow(headers.map(h=>d[h]??""));
    return out({ok:true});
  }
  if(body.action==="delete"){
    if(body.token!==ADMIN_TOKEN)return out({ok:false,error:"unauthorized"});
    const sh=getSheet(),values=sh.getDataRange().getValues();
    if(values.length<2)return out({ok:true});
    const headers=values[0],idx=headers.indexOf("id");
    if(idx<0)return out({ok:false,error:"id column missing"});
    for(let i=1;i<values.length;i++)if(String(values[i][idx])===String(body.id)){sh.deleteRow(i+1);break}
    return out({ok:true});
  }
  return out({ok:false,error:"unknown action"});
}
function doGet(e){
  if((e.parameter.token||"")!==ADMIN_TOKEN)return out({ok:false,error:"unauthorized"});
  const sh=getSheet(),values=sh.getDataRange().getValues();
  if(values.length<2)return out([]);
  const headers=values.shift();
  return out(values.map(row=>Object.fromEntries(headers.map((h,i)=>[h,row[i]]))));
}
function getSheet(){const ss=SpreadsheetApp.getActiveSpreadsheet();let sh=ss.getSheetByName(SHEET_NAME);if(!sh)sh=ss.insertSheet(SHEET_NAME);return sh}
function getHeaders(sh){if(sh.getLastColumn()===0)return[];return sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0].filter(String)}
function out(x){return ContentService.createTextOutput(JSON.stringify(x)).setMimeType(ContentService.MimeType.JSON)}
