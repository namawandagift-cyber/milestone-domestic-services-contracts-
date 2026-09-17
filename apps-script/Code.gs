/**
 * ==============================================================================
 * MILESTONE DOMESTIC SERVICES LTD - GOOGLE APPS SCRIPT DATABASE PROVISIONER
 * Office: Agenda - Kyaliwajjala Road Agenda, Kyaliwajjala - Naalya Rd, Kampala
 * Tel: 0701 761271 | Professionalizing Domestic Work in Uganda
 * ==============================================================================
 * 
 * Deployment:
 * 1. Open target Google Sheet in Google Drive.
 * 2. Extensions > Apps Script.
 * 3. Paste this code into Code.gs.
 * 4. Deploy > New deployment > Web app.
 *    - Execute as: "Me"
 *    - Who has access: "Anyone"
 * 5. Set the generated URL in environment (VITE_APPS_SCRIPT_URL)
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
