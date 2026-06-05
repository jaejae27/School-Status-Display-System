// Google Apps Script - Code.gs
// This script acts as the backend for the school dashboard.
// It uses a Google Spreadsheet to store your data.

/**
 * Main entry point for the web app.
 */
function doGet() {
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('학교 현황판 시스템')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/**
 * Get or create the spreadsheet for the app.
 * By default, it looks for a sheet named "SchoolDashboard_DB".
 */
function getDb() {
  const SPREADSHEET_NAME = "SchoolDashboard_DB";
  const files = DriveApp.getFilesByName(SPREADSHEET_NAME);
  let ss;
  if (files.hasNext()) {
    ss = SpreadsheetApp.open(files.next());
  } else {
    ss = SpreadsheetApp.create(SPREADSHEET_NAME);
    // Initialize sheets
    ss.insertSheet('Settings').getRange(1, 1, 1, 11).setValues([["schoolName", "schoolVision", "address", "logoUrl", "schoolType", "genderType", "firstPeriodStartTime", "assemblyTime", "phoneNumber", "faxNumber", "currentMonth"]]);
    ss.insertSheet('Classes').getRange(1, 1, 1, 7).setValues([["id", "grade", "classNumber", "homeroomTeacher", "assistantTeacher", "boysCount", "girlsCount"]]);
    ss.insertSheet('Events').getRange(1, 1, 1, 3).setValues([["id", "date", "content"]]);
    ss.insertSheet('Notices').getRange(1, 1, 1, 3).setValues([["id", "content", "createdAt"]]);
    ss.deleteSheet(ss.getSheetByName('Sheet1'));
  }
  return ss;
}

/**
 * DATA API: Get all data for the dashboard.
 */
function getFullData() {
  const ss = getDb();
  return {
    settings: getSheetDataAsObject(ss, 'Settings')[0] || {},
    classes: getSheetDataAsObject(ss, 'Classes'),
    events: getSheetDataAsObject(ss, 'Events'),
    notices: getSheetDataAsObject(ss, 'Notices')
  };
}

function getSheetDataAsObject(ss, sheetName) {
  const sheet = ss.getSheetByName(sheetName);
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  const headers = data[0];
  const rows = data.slice(1);
  return rows.map(row => {
    const obj = {};
    headers.forEach((header, i) => {
      obj[header] = row[i];
    });
    return obj;
  });
}

/**
 * DATA API: Save data.
 */
function saveSettings(data) {
  const ss = getDb();
  const sheet = ss.getSheetByName('Settings');
  const headers = ["schoolName", "schoolVision", "address", "logoUrl", "schoolType", "genderType", "firstPeriodStartTime", "assemblyTime", "phoneNumber", "faxNumber", "currentMonth"];
  const values = headers.map(h => data[h] || "");
  
  sheet.clear();
  sheet.appendRow(headers);
  sheet.appendRow(values);
  return { success: true };
}

function saveClasses(dataList) {
  const ss = getDb();
  const sheet = ss.getSheetByName('Classes');
  const headers = ["id", "grade", "classNumber", "homeroomTeacher", "assistantTeacher", "boysCount", "girlsCount"];
  
  sheet.clear();
  sheet.appendRow(headers);
  dataList.forEach(cls => {
    sheet.appendRow(headers.map(h => cls[h] || ""));
  });
  return { success: true };
}

function saveEvents(dataList) {
  const ss = getDb();
  const sheet = ss.getSheetByName('Events');
  const headers = ["id", "date", "content"];
  
  sheet.clear();
  sheet.appendRow(headers);
  dataList.forEach(item => {
    sheet.appendRow(headers.map(h => item[h] || ""));
  });
  return { success: true };
}

function saveNotices(dataList) {
  const ss = getDb();
  const sheet = ss.getSheetByName('Notices');
  const headers = ["id", "content", "createdAt"];
  
  sheet.clear();
  sheet.appendRow(headers);
  dataList.forEach(item => {
    sheet.appendRow(headers.map(h => item[h] || ""));
  });
  return { success: true };
}
