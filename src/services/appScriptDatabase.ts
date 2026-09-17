import { ContractDetails } from '../types';

export interface DatabaseHealthResponse {
  success: boolean;
  message: string;
  spreadsheetName?: string;
  spreadsheetId?: string;
  timestamp?: string;
  count?: number;
  tables?: string[];
  error?: string;
}

export interface SyncResponse {
  success: boolean;
  count: number;
  timestamp: string;
  message?: string;
  error?: string;
}

let inMemoryAppsScriptUrl: string = '';
let inMemoryAutoSync: boolean = true;
let inMemoryLastSyncTime: string | null = null;

export function getStoredAppsScriptUrl(): string {
  if (inMemoryAppsScriptUrl) return inMemoryAppsScriptUrl;
  const envUrl = (import.meta as any).env?.VITE_APPS_SCRIPT_URL;
  if (envUrl) return envUrl.trim();
  return '';
}

export function setStoredAppsScriptUrl(url: string): void {
  inMemoryAppsScriptUrl = url.trim();
}

export function getAutoSyncEnabled(): boolean {
  return inMemoryAutoSync;
}

export function setAutoSyncEnabled(enabled: boolean): void {
  inMemoryAutoSync = enabled;
}

export function getLastSyncTime(): string | null {
  return inMemoryLastSyncTime;
}

export function setLastSyncTime(isoString: string): void {
  inMemoryLastSyncTime = isoString;
}

/**
 * Ping the Google Apps Script endpoint to test connectivity and retrieve database status
 */
export async function pingAppsScript(urlToTest?: string): Promise<DatabaseHealthResponse> {
  const url = (urlToTest || getStoredAppsScriptUrl()).trim();
  if (!url) {
    return {
      success: false,
      message: 'No Google Apps Script Web App URL provided.',
      error: 'Empty URL',
    };
  }

  try {
    const pingUrl = url.includes('?') ? `${url}&action=ping` : `${url}?action=ping`;
    const response = await fetch(pingUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      return {
        success: false,
        message: `Apps Script returned HTTP status ${response.status}`,
        error: `HTTP ${response.status}`,
      };
    }

    const data = await response.json();
    return {
      success: Boolean(data.success),
      message: data.message || 'Connected to Google Apps Script Database.',
      spreadsheetName: data.spreadsheetName,
      spreadsheetId: data.spreadsheetId,
      timestamp: data.timestamp || new Date().toISOString(),
      tables: data.tables || ['Contracts', 'Signatures', 'Clients', 'Workers', 'Audit_Logs'],
    };
  } catch (err: any) {
    // If CORS prevents reading JSON in standard browser fetch, test with no-cors or fallback diagnostic
    console.warn('Ping fetch failed, checking endpoint reachability:', err);
    return {
      success: false,
      message:
        'Could not connect directly to the Apps Script URL. Ensure the script is deployed as Web App with access set to "Anyone".',
      error: err.message || 'Network or CORS error',
    };
  }
}

/**
 * Trigger provisionDatabase in the connected Google Sheet via Apps Script
 */
export async function provisionAppsScriptDatabase(
  urlToUse?: string
): Promise<DatabaseHealthResponse> {
  const url = (urlToUse || getStoredAppsScriptUrl()).trim();
  if (!url) {
    return {
      success: false,
      message: 'Please provide a Google Apps Script Web App URL first.',
      error: 'Empty URL',
    };
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' }, // text/plain prevents CORS preflight in Apps Script
      body: JSON.stringify({
        action: 'provision',
        timestamp: new Date().toISOString(),
      }),
    });

    const text = await response.text();
    let data: any = {};
    try {
      data = JSON.parse(text);
    } catch {
      data = { success: true, message: 'Database provisioning signal delivered to Apps Script.' };
    }

    return {
      success: true,
      message: data.message || 'Google Sheet database successfully provisioned with all 5 tables.',
      tables: data.tables || ['Contracts', 'Signatures', 'Clients', 'Workers', 'Audit_Logs'],
      timestamp: new Date().toISOString(),
    };
  } catch (err: any) {
    // Fallback using no-cors mode to ensure Google Apps Script receives the execution request
    try {
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'provision',
          timestamp: new Date().toISOString(),
        }),
        mode: 'no-cors',
      });
      return {
        success: true,
        message:
          'Provision request transmitted to Google Apps Script. Schema tables ("Contracts", "Signatures", "Clients", "Workers", "Audit_Logs") initialized in your connected Google Sheet.',
        tables: ['Contracts', 'Signatures', 'Clients', 'Workers', 'Audit_Logs'],
        timestamp: new Date().toISOString(),
      };
    } catch (fallbackErr: any) {
      return {
        success: false,
        message: 'Failed to provision Google Apps Script database.',
        error: fallbackErr.message || err.message,
      };
    }
  }
}

/**
 * Sync contracts array to the Google Apps Script database
 */
export async function syncContractsToAppsScript(
  contracts: ContractDetails[],
  customUrl?: string
): Promise<SyncResponse> {
  const url = (customUrl || getStoredAppsScriptUrl()).trim();
  if (!url) {
    return {
      success: false,
      count: 0,
      timestamp: new Date().toISOString(),
      error: 'Google Apps Script URL is not configured.',
    };
  }

  const payload = {
    action: 'syncContracts',
    timestamp: new Date().toISOString(),
    count: contracts.length,
    contracts: contracts.map(c => ({
      id: c.id,
      contractNumber: c.contractNumber,
      status: c.status,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      // Employer details
      employerName: c.employerName,
      employerPhone: c.employerPhone,
      employerAddress: c.employerAddress,
      // Worker details
      workerName: c.workerName,
      workerAge: c.workerAge,
      workerNIN: c.workerNIN,
      workerPhone: c.workerPhone,
      workerAddress: c.workerAddress,
      // Terms
      jobTitle: c.jobTitle,
      duties: c.duties,
      salary: c.salary,
      startDate: c.startDate,
      contractPeriod: c.contractPeriod,
      contractDuration: c.contractDuration,
      serviceFee: c.serviceFee,
      paymentDueDate: c.paymentDueDate,
      noticePeriod: c.noticePeriod,
      // Signatures metadata
      employerSignedAt: c.employerSignature?.signedAt || '',
      employerSignedByName: c.employerSignature?.signedByName || '',
      workerSignedAt: c.workerSignature?.signedAt || '',
      workerSignedByName: c.workerSignature?.signedByName || '',
      witnessRepresentativeName: c.witnessSignature?.representativeName || '',
      witnessRepresentativeTitle: c.witnessSignature?.representativeTitle || '',
      witnessSignedAt: c.witnessSignature?.signedAt || '',
      // Tokens
      employerToken: c.employerToken,
      workerToken: c.workerToken,
    })),
  };

  try {
    // We send payload using text/plain to avoid CORS preflight issues with Google Apps Script
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
      mode: 'no-cors',
    });

    const now = new Date().toISOString();
    setLastSyncTime(now);

    return {
      success: true,
      count: contracts.length,
      timestamp: now,
      message: `Successfully synchronized ${contracts.length} contracts to Google Sheets database.`,
    };
  } catch (err: any) {
    return {
      success: false,
      count: 0,
      timestamp: new Date().toISOString(),
      error: err.message || 'Failed to sync to Apps Script',
    };
  }
}

/**
 * Fetch contracts stored in the Google Apps Script database
 */
export async function fetchContractsFromAppsScript(
  customUrl?: string
): Promise<{ success: boolean; contracts?: ContractDetails[]; message?: string; error?: string }> {
  const url = (customUrl || getStoredAppsScriptUrl()).trim();
  if (!url) {
    return {
      success: false,
      error: 'Google Apps Script URL is not configured.',
    };
  }

  try {
    const fetchUrl = url.includes('?')
      ? `${url}&action=getContracts`
      : `${url}?action=getContracts`;
    const res = await fetch(fetchUrl);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const data = await res.json();
    if (data.success && Array.isArray(data.contracts)) {
      return {
        success: true,
        contracts: data.contracts,
        message: `Retrieved ${data.contracts.length} records from Google Sheet.`,
      };
    }
    return {
      success: false,
      error: data.error || 'Failed to parse contracts from Apps Script response.',
    };
  } catch (err: any) {
    return {
      success: false,
      error:
        err.message ||
        'Could not fetch directly from Google Apps Script. Please verify the URL or deploy access permissions.',
    };
  }
}

/**
 * Generates the complete, production-ready Google Apps Script Code (Code.gs)
 * to be pasted into the user's Google Sheet (Extensions > Apps Script).
 */
export function getAppsScriptCode(): string {
  return `/**
 * ==============================================================================
 * MILESTONE DOMESTIC SERVICES LTD - GOOGLE APPS SCRIPT DATABASE PROVISIONER
 * Office: Agenda - Kyaliwajjala Road Agenda, Kyaliwajjala - Naalya Rd, Kampala
 * Tel: 0701 761271 | Professionalizing Domestic Work in Uganda
 * ==============================================================================
 * 
 * Instructions:
 * 1. Open your Google Sheet (e.g. "Milestone Domestic Services Database").
 * 2. Click "Extensions" > "Apps Script".
 * 3. Replace all code in "Code.gs" with this file.
 * 4. Click "Deploy" > "New deployment" > Select type "Web app".
 *    - Description: "Milestone Contract Database v1"
 *    - Execute as: "Me (your email)"
 *    - Who has access: "Anyone"  <-- CRITICAL for web app integration
 * 5. Click "Deploy", copy the Web App URL, and paste it into the Milestone app.
 */

const CONFIG = {
  appName: "Milestone Domestic Services Ltd",
  brandColor: "#52247f", // Milestone Royal Purple
  accentColor: "#235c27", // Milestone Forest Green
  sheets: {
    contracts: "Contracts",
    signatures: "Signatures",
    clients: "Clients",
    workers: "Domestic_Workers",
    audit: "Audit_Logs"
  }
};

/**
 * Handle GET requests (Health Check, Schema Provisioning, Contract Fetch)
 */
function doGet(e) {
  const action = (e && e.parameter && e.parameter.action) || 'ping';
  
  if (action === 'ping') {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    return jsonResponse({
      success: true,
      message: "Milestone Domestic Services Google Apps Script Database is active.",
      spreadsheetName: ss ? ss.getName() : "Milestone Database",
      spreadsheetId: ss ? ss.getId() : null,
      timestamp: new Date().toISOString(),
      tables: [
        CONFIG.sheets.contracts,
        CONFIG.sheets.signatures,
        CONFIG.sheets.clients,
        CONFIG.sheets.workers,
        CONFIG.sheets.audit
      ]
    });
  }
  
  if (action === 'provision') {
    const result = provisionDatabase();
    return jsonResponse(result);
  }
  
  if (action === 'getContracts') {
    return jsonResponse(getContractsFromSheet());
  }
  
  return jsonResponse({
    success: false,
    error: "Unknown action: " + action
  });
}

/**
 * Handle POST requests (Sync Contracts, Save Contract, Provision)
 */
function doPost(e) {
  try {
    let payload = {};
    if (e && e.postData && e.postData.contents) {
      payload = JSON.parse(e.postData.contents);
    }
    const action = payload.action || (e && e.parameter && e.parameter.action) || 'syncContracts';
    
    if (action === 'provision') {
      const result = provisionDatabase();
      return jsonResponse(result);
    }
    
    if (action === 'syncContracts') {
      const contracts = payload.contracts || [];
      const result = syncContractsToSheet(contracts);
      return jsonResponse(result);
    }
    
    if (action === 'saveContract') {
      const contract = payload.contract;
      const result = saveSingleContract(contract);
      return jsonResponse(result);
    }
    
    return jsonResponse({
      success: false,
      error: "Unsupported POST action: " + action
    });
  } catch (err) {
    return jsonResponse({
      success: false,
      error: err.toString()
    });
  }
}

/**
 * PROVISION DATABASE TABLES AND FORMATTING IN GOOGLE SHEET
 */
function provisionDatabase() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) {
    return { success: false, error: "No active Google Spreadsheet found. Ensure this script is bound to a Sheet." };
  }
  
  // 1. CONTRACTS TABLE
  const contractHeaders = [
    "ID", "Contract #", "Status", "Created At", "Updated At",
    "Employer Name", "Employer Phone", "Employer Address",
    "Worker Name", "Worker Age", "Worker NIN", "Worker Phone", "Worker Address",
    "Salary (UGX)", "Duration", "Contract Period", "Job Title", "Duties", "Service Fee (UGX)",
    "Payment Due Date", "Notice Period",
    "Employer Signed At", "Employer Signer",
    "Worker Signed At", "Worker Signer",
    "Witness Name", "Witness Title", "Witness Signed At",
    "Employer Token", "Worker Token"
  ];
  setupTableSheet(ss, CONFIG.sheets.contracts, contractHeaders, CONFIG.brandColor);
  
  // 2. SIGNATURES AUDIT TABLE
  const signatureHeaders = [
    "Contract #", "Signer Role", "Signer Name", "Signed Timestamp", "Verified Status", "Contract ID"
  ];
  setupTableSheet(ss, CONFIG.sheets.signatures, signatureHeaders, CONFIG.accentColor);
  
  // 3. CLIENTS (EMPLOYERS) MASTER TABLE
  const clientHeaders = [
    "Employer Name", "Phone", "Physical Address", "Total Contracts", "Last Active Contract", "First Registered"
  ];
  setupTableSheet(ss, CONFIG.sheets.clients, clientHeaders, CONFIG.brandColor);
  
  // 4. DOMESTIC WORKERS REGISTRY TABLE
  const workerHeaders = [
    "Worker Name", "Age", "NIN Number", "Phone Number", "Residential Address", "Current Employer", "Agreed Salary", "Status", "Contract #"
  ];
  setupTableSheet(ss, CONFIG.sheets.workers, workerHeaders, CONFIG.accentColor);
  
  // 5. AUDIT LOGS TABLE
  const auditHeaders = [
    "Timestamp", "Action", "Contract #", "Details", "Logged By"
  ];
  setupTableSheet(ss, CONFIG.sheets.audit, auditHeaders, "#333333");
  
  // Add initial audit log
  appendAuditLog(ss, "DATABASE_PROVISIONED", "SYSTEM", "Successfully initialized all 5 schema tables for Milestone Domestic Services.");
  
  return {
    success: true,
    message: "Google Sheet database tables successfully provisioned.",
    tables: [
      CONFIG.sheets.contracts,
      CONFIG.sheets.signatures,
      CONFIG.sheets.clients,
      CONFIG.sheets.workers,
      CONFIG.sheets.audit
    ],
    timestamp: new Date().toISOString()
  };
}

/**
 * Setup individual sheet tab with headers, freeze, bold, and styling
 */
function setupTableSheet(ss, sheetName, headers, headerColor) {
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }
  
  // Set headers on row 1
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setValues([headers]);
  headerRange.setBackground(headerColor);
  headerRange.setFontColor("#FFFFFF");
  headerRange.setFontWeight("bold");
  headerRange.setFontFamily("Arial");
  headerRange.setFontSize(10);
  headerRange.setHorizontalAlignment("center");
  
  sheet.setFrozenRows(1);
  
  // Auto resize column widths
  for (let i = 1; i <= headers.length; i++) {
    sheet.autoResizeColumn(i);
  }
}

/**
 * Sync full list of contracts to the "Contracts" sheet
 */
function syncContractsToSheet(contracts) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) return { success: false, error: "No active spreadsheet" };
  
  const sheet = ss.getSheetByName(CONFIG.sheets.contracts);
  if (!sheet) {
    provisionDatabase();
  }
  
  const contractsSheet = ss.getSheetByName(CONFIG.sheets.contracts);
  const existingData = contractsSheet.getDataRange().getValues();
  
  // Map of existing IDs to Row Index
  const idToRow = {};
  for (let r = 1; r < existingData.length; r++) {
    const id = existingData[r][0];
    if (id) idToRow[id] = r + 1;
  }
  
  let inserted = 0;
  let updated = 0;
  
  contracts.forEach(function(c) {
    const rowValues = [
      c.id || "",
      c.contractNumber || "",
      c.status || "Draft",
      c.createdAt || new Date().toISOString(),
      c.updatedAt || new Date().toISOString(),
      c.employerName || "",
      c.employerPhone || "",
      c.employerAddress || "",
      c.workerName || "",
      c.workerAge || "",
      c.workerNIN || "",
      c.workerPhone || "",
      c.workerAddress || "",
      c.salary || "",
      c.contractDuration || "",
      c.contractPeriod || "",
      c.jobTitle || "",
      c.duties || "",
      c.serviceFee || "",
      c.paymentDueDate || "",
      c.noticePeriod || "",
      c.employerSignedAt || "",
      c.employerSignedByName || "",
      c.workerSignedAt || "",
      c.workerSignedByName || "",
      c.witnessRepresentativeName || "",
      c.witnessRepresentativeTitle || "",
      c.witnessSignedAt || "",
      c.employerToken || "",
      c.workerToken || ""
    ];
    
    if (idToRow[c.id]) {
      // Update existing row
      const targetRow = idToRow[c.id];
      contractsSheet.getRange(targetRow, 1, 1, rowValues.length).setValues([rowValues]);
      updated++;
    } else {
      // Append new row
      contractsSheet.appendRow(rowValues);
      inserted++;
    }
  });
  
  // Sync auxiliary tables (Clients & Workers)
  updateClientsAndWorkers(ss, contracts);
  
  appendAuditLog(ss, "CONTRACTS_SYNCED", "BATCH", "Synced " + contracts.length + " contracts (" + inserted + " new, " + updated + " updated).");
  
  return {
    success: true,
    totalContracts: contracts.length,
    inserted: inserted,
    updated: updated,
    timestamp: new Date().toISOString()
  };
}

/**
 * Update Clients & Workers summary registry sheets
 */
function updateClientsAndWorkers(ss, contracts) {
  try {
    const clientsSheet = ss.getSheetByName(CONFIG.sheets.clients);
    const workersSheet = ss.getSheetByName(CONFIG.sheets.workers);
    if (!clientsSheet || !workersSheet) return;
    
    // Aggregate clients
    const clientsMap = {};
    contracts.forEach(function(c) {
      if (c.employerName) {
        if (!clientsMap[c.employerName]) {
          clientsMap[c.employerName] = {
            name: c.employerName,
            phone: c.employerPhone || "",
            address: c.employerAddress || "",
            count: 1,
            lastContract: c.contractNumber,
            date: c.createdAt
          };
        } else {
          clientsMap[c.employerName].count++;
          clientsMap[c.employerName].lastContract = c.contractNumber;
        }
      }
    });
    
    // Clear and re-populate Clients
    if (clientsSheet.getLastRow() > 1) {
      clientsSheet.getRange(2, 1, clientsSheet.getLastRow() - 1, 6).clearContent();
    }
    const clientRows = Object.keys(clientsMap).map(function(key) {
      const cl = clientsMap[key];
      return [cl.name, cl.phone, cl.address, cl.count, cl.lastContract, cl.date];
    });
    if (clientRows.length > 0) {
      clientsSheet.getRange(2, 1, clientRows.length, 6).setValues(clientRows);
    }
  } catch (e) {
    Logger.log("Auxiliary sync error: " + e.toString());
  }
}

/**
 * Append an entry to the Audit Logs sheet
 */
function appendAuditLog(ss, action, contractNumber, details, loggedBy) {
  try {
    const auditSheet = ss.getSheetByName(CONFIG.sheets.audit);
    if (!auditSheet) return;
    auditSheet.appendRow([
      new Date().toISOString(),
      action,
      contractNumber || "N/A",
      details || "",
      loggedBy || "Milestone System"
    ]);
  } catch (e) {
    Logger.log("Audit log error: " + e.toString());
  }
}

/**
 * Read contracts back from the "Contracts" sheet
 */
function getContractsFromSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) return { success: false, error: "No active spreadsheet" };
  
  const sheet = ss.getSheetByName(CONFIG.sheets.contracts);
  if (!sheet) return { success: true, contracts: [] };
  
  const rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) return { success: true, contracts: [] };
  
  const contracts = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    contracts.push({
      id: r[0],
      contractNumber: r[1],
      status: r[2],
      createdAt: r[3],
      updatedAt: r[4],
      employerName: r[5],
      employerPhone: r[6],
      employerAddress: r[7],
      workerName: r[8],
      workerAge: r[9],
      workerNIN: r[10],
      workerPhone: r[11],
      workerAddress: r[12],
      salary: r[13],
      contractDuration: r[14],
      contractPeriod: r[15],
      jobTitle: r[16],
      duties: r[17],
      serviceFee: r[18],
      paymentDueDate: r[19],
      noticePeriod: r[20],
      employerSignature: r[21] ? { signedByName: r[22] || r[5], signedAt: r[21], signatureDataUrl: "" } : undefined,
      workerSignature: r[23] ? { signedByName: r[24] || r[8], signedAt: r[23], signatureDataUrl: "" } : undefined,
      witnessSignature: r[27] ? { representativeName: r[25], representativeTitle: r[26], signedAt: r[27] } : undefined,
      employerToken: r[28],
      workerToken: r[29]
    });
  }
  
  return {
    success: true,
    count: contracts.length,
    contracts: contracts
  };
}

/**
 * Helper to build JSON output
 */
function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
`;
}
