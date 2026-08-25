/**
 * EZEE VISION CHAMPUA - Google Apps Script backend
 * 1. Create a Google Sheet.
 * 2. Extensions > Apps Script.
 * 3. Paste this code.
 * 4. Change SHEET_NAME if needed.
 * 5. Deploy > New deployment > Web app > Anyone.
 * 6. Put the Web App URL into assets/app.js and admin/index.html.
 */
const SHEET_NAME = "Responses";

function doPost(e) {
  const sheet = getSheet();
  const data = JSON.parse(e.postData.contents || "{}");
  const headers = getHeaders(sheet, data);
  const row = headers.map(h => data[h] ?? "");
  sheet.appendRow(row);
  return json({ok:true});
}

function doGet() {
  const sheet = getSheet();
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return json([]);
  const headers = values.shift();
  return json(values.map(r => Object.fromEntries(headers.map((h,i)=>[h,r[i]]))));
}

function getSheet(){
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);
  return sheet;
}
function getHeaders(sheet,data){
  let headers = sheet.getLastColumn() ? sheet.getRange(1,1,1,sheet.getLastColumn()).getValues()[0] : [];
  const keys = Object.keys(data);
  if (!headers.length || headers[0] === "") { sheet.getRange(1,1,1,keys.length).setValues([keys]); return keys; }
  const missing=keys.filter(k=>!headers.includes(k));
  if(missing.length){sheet.getRange(1,headers.length+1,1,missing.length).setValues([missing]);headers=headers.concat(missing);}
  return headers;
}
function json(obj){return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);}
