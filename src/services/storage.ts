import {
  ContractDetails,
  ContractStatus,
  SignatureRecord,
  WitnessRecord,
} from '../types';

/**
 * ============================================================
 * MILESTONE CONTRACT STORAGE
 * Google Apps Script + Google Sheets
 *
 * Google Sheets is the source of truth.
 * The in-memory array is only a temporary UI cache.
 * ============================================================
 */

let memoryContracts: ContractDetails[] = [];
let isInitialized = false;

/**
 * Get the Google Apps Script Web App URL.
 */
function getAppsScriptUrl(): string {
  const url = (import.meta as any).env?.VITE_APPS_SCRIPT_URL;

  return typeof url === 'string' ? url.trim() : '';
}

/**
 * ============================================================
 * SECURE SIGNING TOKEN
 * ============================================================
 */

export function generateSecureToken(
  prefix: 'emp' | 'wrk'
): string {
  const randomBytes = new Uint8Array(16);

  crypto.getRandomValues(randomBytes);

  const hex = Array.from(randomBytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return `${prefix}_${hex}`;
}

/**
 * ============================================================
 * FETCH ALL CONTRACTS FROM GOOGLE SHEETS
 * ============================================================
 */

export async function fetchContractsFromDatabase(): Promise<
  ContractDetails[]
> {
  const url = getAppsScriptUrl();

  if (!url) {
    console.error(
      'VITE_APPS_SCRIPT_URL is not configured.'
    );

    return memoryContracts;
  }

  try {
    const endpoint = url.includes('?')
      ? `${url}&action=getContracts`
      : `${url}?action=getContracts`;

    const response = await fetch(endpoint);

    if (!response.ok) {
      throw new Error(
        `Apps Script HTTP ${response.status}`
      );
    }

    const data = await response.json();

    if (
      data.success &&
      Array.isArray(data.contracts)
    ) {
      memoryContracts = data.contracts;
      isInitialized = true;

      return memoryContracts;
    }

    throw new Error(
      data.error ||
        'Apps Script returned an invalid contracts response.'
    );
  } catch (error) {
    console.error(
      'Failed to fetch contracts from Google Sheets:',
      error
    );

    return memoryContracts;
  }
}

/**
 * ============================================================
 * CURRENT MEMORY CACHE
 * ============================================================
 */

export function getStoredContracts(): ContractDetails[] {
  return memoryContracts;
}

/**
 * ============================================================
 * SAVE CONTRACT
 *
 * Tokens are preserved permanently.
 * Existing tokens are NEVER regenerated.
 * ============================================================
 */

export async function saveContract(
  updated: ContractDetails
): Promise<ContractDetails> {
  const url = getAppsScriptUrl();

  const existing = memoryContracts.find(
    (contract) => contract.id === updated.id
  );

  const updatedContract: ContractDetails = {
    ...updated,

    /*
     * Preserve existing permanent signing tokens.
     */
    employerToken:
      updated.employerToken ||
      existing?.employerToken ||
      generateSecureToken('emp'),

    workerToken:
      updated.workerToken ||
      existing?.workerToken ||
      generateSecureToken('wrk'),

    updatedAt: new Date().toISOString(),
  };

  /*
   * Update local cache immediately.
   */
  updateMemoryContract(updatedContract);

  if (!url) {
    console.error(
      'VITE_APPS_SCRIPT_URL is not configured.'
    );

    return updatedContract;
  }

  try {
    await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type':
          'text/plain;charset=utf-8',
      },
      body: JSON.stringify({
        action: 'saveContract',
        contract: updatedContract,
      }),
      mode: 'no-cors',
    });

    /*
     * Re-fetch from Google Sheets so the UI has
     * the database version.
     */
    const refreshedContracts =
      await fetchContractsFromDatabase();

    const refreshedContract =
      refreshedContracts.find(
        (contract) =>
          contract.id === updatedContract.id
      );

    if (refreshedContract) {
      return refreshedContract;
    }
  } catch (error) {
    console.error(
      'Failed to save contract to Google Sheets:',
      error
    );
  }

  return updatedContract;
}

/**
 * ============================================================
 * DELETE CONTRACT
 * ============================================================
 */

export async function deleteContract(
  id: string
): Promise<void> {
  const url = getAppsScriptUrl();

  memoryContracts = memoryContracts.filter(
    (contract) => contract.id !== id
  );

  if (!url) {
    console.error(
      'VITE_APPS_SCRIPT_URL is not configured.'
    );

    return;
  }

  try {
    await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type':
          'text/plain;charset=utf-8',
      },
      body: JSON.stringify({
        action: 'deleteContract',
        id,
      }),
      mode: 'no-cors',
    });
  } catch (error) {
    console.error(
      'Failed to delete contract:',
      error
    );
  }
}

/**
 * ============================================================
 * FIND CONTRACT BY SIGNING TOKEN
 *
 * First checks memory.
 * If not found, asks Google Apps Script.
 * ============================================================
 */

export async function getContractByToken(
  token: string
): Promise<{
  contract: ContractDetails;
  role: 'employer' | 'worker';
} | null> {
  if (!token) {
    return null;
  }

  /*
   * First check memory.
   */
  const cachedContract =
    memoryContracts.find(
      (contract) =>
        contract.employerToken === token ||
        contract.workerToken === token
    );

  if (cachedContract) {
    return {
      contract: cachedContract,
      role:
        cachedContract.employerToken === token
          ? 'employer'
          : 'worker',
    };
  }

  /*
   * If not in memory, ask Google Apps Script.
   */
  const url = getAppsScriptUrl();

  if (!url) {
    console.error(
      'VITE_APPS_SCRIPT_URL is not configured.'
    );

    return null;
  }

  try {
    const endpoint = url.includes('?')
      ? `${url}&action=getContractByToken&token=${encodeURIComponent(
          token
        )}`
      : `${url}?action=getContractByToken&token=${encodeURIComponent(
          token
        )}`;

    const response = await fetch(endpoint);

    if (!response.ok) {
      throw new Error(
        `Apps Script HTTP ${response.status}`
      );
    }

    const data = await response.json();

    if (
      data.success &&
      data.contract &&
      (data.role === 'employer' ||
        data.role === 'worker')
    ) {
      /*
       * Put the database contract into memory.
       */
      updateMemoryContract(data.contract);

      return {
        contract: data.contract,
        role: data.role,
      };
    }

    return null;
  } catch (error) {
    console.error(
      'Failed to resolve signing token from Google Apps Script:',
      error
    );

    return null;
  }
}

/**
 * ============================================================
 * EMPLOYER SIGNATURE
 *
 * Saves signature to Apps Script and then fetches
 * the actual updated contract from Google Sheets.
 * ============================================================
 */

export async function submitEmployerSignature(
  contractId: string,
  signature: SignatureRecord
): Promise<ContractDetails | null> {
  const contract = memoryContracts.find(
    (c) => c.id === contractId
  );

  if (!contract) {
    console.error(
      'Contract not found:',
      contractId
    );

    return null;
  }

  /*
   * Temporary local version for immediate UI feedback.
   */
  const localUpdated: ContractDetails = {
    ...contract,

    employerSignature: signature,

    status:
      'Waiting for Worker' as ContractStatus,

    updatedAt: new Date().toISOString(),
  };

  updateMemoryContract(localUpdated);

  const url = getAppsScriptUrl();

  if (!url) {
    console.error(
      'VITE_APPS_SCRIPT_URL is not configured.'
    );

    return localUpdated;
  }

  try {
    /*
     * Send signature to Google Apps Script.
     */
    await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type':
          'text/plain;charset=utf-8',
      },
      body: JSON.stringify({
        action: 'saveSignature',
        contractId,
        role: 'employer',
        signature,
      }),
      mode: 'no-cors',
    });

    /*
     * IMPORTANT:
     *
     * Because the POST uses no-cors, we cannot read
     * the Apps Script response.
     *
     * Therefore, fetch the database again.
     */
    const refreshedContracts =
      await fetchContractsFromDatabase();

    const refreshedContract =
      refreshedContracts.find(
        (c) => c.id === contractId
      );

    if (refreshedContract) {
      updateMemoryContract(
        refreshedContract
      );

      return refreshedContract;
    }

    return localUpdated;
  } catch (error) {
    console.error(
      'Employer signature database error:',
      error
    );

    return localUpdated;
  }
}

/**
 * ============================================================
 * WORKER SIGNATURE
 *
 * Saves signature to Apps Script and then fetches
 * the actual updated contract from Google Sheets.
 * ============================================================
 */

export async function submitWorkerSignature(
  contractId: string,
  signature: SignatureRecord
): Promise<ContractDetails | null> {
  const contract = memoryContracts.find(
    (c) => c.id === contractId
  );

  if (!contract) {
    console.error(
      'Contract not found:',
      contractId
    );

    return null;
  }

  /*
   * Temporary local version.
   */
  const localUpdated: ContractDetails = {
    ...contract,

    workerSignature: signature,

    status: 'Completed',

    updatedAt: new Date().toISOString(),
  };

  updateMemoryContract(localUpdated);

  const url = getAppsScriptUrl();

  if (!url) {
    console.error(
      'VITE_APPS_SCRIPT_URL is not configured.'
    );

    return localUpdated;
  }

  try {
    /*
     * Send signature to Google Apps Script.
     */
    await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type':
          'text/plain;charset=utf-8',
      },
      body: JSON.stringify({
        action: 'saveSignature',
        contractId,
        role: 'worker',
        signature,
      }),
      mode: 'no-cors',
    });

    /*
     * Fetch the actual database version.
     */
    const refreshedContracts =
      await fetchContractsFromDatabase();

    const refreshedContract =
      refreshedContracts.find(
        (c) => c.id === contractId
      );

    if (refreshedContract) {
      updateMemoryContract(
        refreshedContract
      );

      return refreshedContract;
    }

    return localUpdated;
  } catch (error) {
    console.error(
      'Worker signature database error:',
      error
    );

    return localUpdated;
  }
}

/**
 * ============================================================
 * WITNESS SIGNATURE
 * ============================================================
 */

export async function submitWitnessSignature(
  contractId: string,
  witness: WitnessRecord
): Promise<ContractDetails | null> {
  const contract = memoryContracts.find(
    (c) => c.id === contractId
  );

  if (!contract) {
    console.error(
      'Contract not found:',
      contractId
    );

    return null;
  }

  const isFullySigned = Boolean(
    contract.employerSignature &&
      contract.workerSignature
  );

  const localUpdated: ContractDetails = {
    ...contract,

    witnessSignature: witness,

    status: isFullySigned
      ? 'Completed'
      : contract.status,

    updatedAt: new Date().toISOString(),
  };

  updateMemoryContract(localUpdated);

  const url = getAppsScriptUrl();

  if (!url) {
    console.error(
      'VITE_APPS_SCRIPT_URL is not configured.'
    );

    return localUpdated;
  }

  try {
    await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type':
          'text/plain;charset=utf-8',
      },
      body: JSON.stringify({
        action: 'saveSignature',
        contractId,
        role: 'witness',
        witness,
      }),
      mode: 'no-cors',
    });

    /*
     * Refresh from Google Sheets.
     */
    const refreshedContracts =
      await fetchContractsFromDatabase();

    const refreshedContract =
      refreshedContracts.find(
        (c) => c.id === contractId
      );

    if (refreshedContract) {
      updateMemoryContract(
        refreshedContract
      );

      return refreshedContract;
    }

    return localUpdated;
  } catch (error) {
    console.error(
      'Witness signature database error:',
      error
    );

    return localUpdated;
  }
}

/**
 * ============================================================
 * UPDATE MEMORY CACHE
 * ============================================================
 */

function updateMemoryContract(
  updated: ContractDetails
): void {
  const index = memoryContracts.findIndex(
    (c) => c.id === updated.id
  );

  if (index >= 0) {
    memoryContracts[index] = updated;
  } else {
    memoryContracts.push(updated);
  }
}

/**
 * ============================================================
 * GET CONTRACT BY ID
 * ============================================================
 */

export function getContractById(
  id: string
): ContractDetails | undefined {
  return memoryContracts.find(
    (contract) => contract.id === id
  );
}

/**
 * ============================================================
 * INITIALIZATION STATUS
 * ============================================================
 */

export function getInitializationStatus(): boolean {
  return isInitialized;
}