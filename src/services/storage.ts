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
 * Google Sheets = source of truth
 * memoryContracts = temporary UI cache
 * ============================================================
 */

let memoryContracts: ContractDetails[] = [];
let isInitialized = false;

/**
 * ============================================================
 * APPS SCRIPT URL
 * ============================================================
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
 * FETCH ALL CONTRACTS
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

    const response = await fetch(endpoint, {
      method: 'GET',
      cache: 'no-store',
    });

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
 * MEMORY CACHE
 * ============================================================
 */

export function getStoredContracts(): ContractDetails[] {
  return memoryContracts;
}

/**
 * ============================================================
 * SAVE CONTRACT
 *
 * This function guarantees that every saved contract has
 * permanent employer and worker tokens.
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

  /**
   * Immediately update local cache.
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

    /**
     * Give Google Sheets the opportunity to become
     * the source of truth.
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

    /**
     * Refresh local cache after deletion.
     */
    await fetchContractsFromDatabase();
  } catch (error) {
    console.error(
      'Failed to delete contract:',
      error
    );
  }
}

/**
 * ============================================================
 * FIND CONTRACT BY TOKEN
 *
 * IMPORTANT:
 * Google Apps Script is checked FIRST.
 *
 * This prevents an old browser cache from deciding whether
 * a signing link is valid.
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

  const url = getAppsScriptUrl();

  if (!url) {
    console.error(
      'VITE_APPS_SCRIPT_URL is not configured.'
    );

    /**
     * Fallback to memory only if the backend URL
     * is not configured.
     */
    const cachedContract =
      memoryContracts.find(
        (contract) =>
          contract.employerToken === token ||
          contract.workerToken === token
      );

    if (!cachedContract) {
      return null;
    }

    return {
      contract: cachedContract,
      role:
        cachedContract.employerToken === token
          ? 'employer'
          : 'worker',
    };
  }

  try {
    const endpoint = url.includes('?')
      ? `${url}&action=getContractByToken&token=${encodeURIComponent(
          token
        )}`
      : `${url}?action=getContractByToken&token=${encodeURIComponent(
          token
        )}`;

    const response = await fetch(endpoint, {
      method: 'GET',
      cache: 'no-store',
    });

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
      /**
       * Store the current database version locally.
       */
      updateMemoryContract(data.contract);

      return {
        contract: data.contract,
        role: data.role,
      };
    }

    /**
     * The backend explicitly says the token does not exist.
     */
    return null;
  } catch (error) {
    console.error(
      'Failed to resolve signing token:',
      error
    );

    /**
     * Only use cache as a fallback when the request itself
     * failed. A backend "not found" response is not treated
     * as a cache hit.
     */
    const cachedContract =
      memoryContracts.find(
        (contract) =>
          contract.employerToken === token ||
          contract.workerToken === token
      );

    if (!cachedContract) {
      return null;
    }

    return {
      contract: cachedContract,
      role:
        cachedContract.employerToken === token
          ? 'employer'
          : 'worker',
    };
  }
}

/**
 * ============================================================
 * EMPLOYER SIGNATURE
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
        role: 'employer',
        signature,
      }),
      mode: 'no-cors',
    });

    const refreshedContracts =
      await fetchContractsFromDatabase();

    const refreshedContract =
      refreshedContracts.find(
        (c) => c.id === contractId
      );

    if (refreshedContract) {
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

  const localUpdated: ContractDetails = {
    ...contract,
    workerSignature: signature,
    status: 'Completed' as ContractStatus,
    updatedAt: new Date().toISOString(),
  };

  updateMemoryContract(localUpdated);

  const url = getAppsScriptUrl();

  if (!url) {
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
        role: 'worker',
        signature,
      }),
      mode: 'no-cors',
    });

    const refreshedContracts =
      await fetchContractsFromDatabase();

    const refreshedContract =
      refreshedContracts.find(
        (c) => c.id === contractId
      );

    if (refreshedContract) {
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
      ? ('Completed' as ContractStatus)
      : contract.status,
    updatedAt: new Date().toISOString(),
  };

  updateMemoryContract(localUpdated);

  const url = getAppsScriptUrl();

  if (!url) {
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

    const refreshedContracts =
      await fetchContractsFromDatabase();

    const refreshedContract =
      refreshedContracts.find(
        (c) => c.id === contractId
      );

    if (refreshedContract) {
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
 * UPDATE MEMORY
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