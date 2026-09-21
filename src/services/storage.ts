import {
  ContractDetails,
  ContractStatus,
  SignatureRecord,
  WitnessRecord,
} from '../types';

let memoryContracts: ContractDetails[] = [];
let isInitialized = false;


/* ==============================================================================
   APPS SCRIPT URL
   ============================================================================== */

function getAppsScriptUrl(): string {
  const url =
    (import.meta as any).env
      ?.VITE_APPS_SCRIPT_URL;

  return typeof url === 'string'
    ? url.trim()
    : '';
}


/* ==============================================================================
   TOKEN GENERATOR
   ============================================================================== */

export function generateSecureToken(
  prefix: 'emp' | 'wrk'
): string {

  const randomBytes =
    new Uint8Array(16);

  crypto.getRandomValues(
    randomBytes
  );

  const hex =
    Array.from(randomBytes)
      .map((b) =>
        b
          .toString(16)
          .padStart(2, '0')
      )
      .join('');

  return `${prefix}_${hex}`;
}


/* ==============================================================================
   GET CONTRACTS FROM GOOGLE SHEETS
   ============================================================================== */

export async function fetchContractsFromDatabase(): Promise<
  ContractDetails[]
> {

  const url =
    getAppsScriptUrl();


  if (!url) {

    console.error(
      'VITE_APPS_SCRIPT_URL is not configured.'
    );

    return memoryContracts;
  }


  try {

    const endpoint =
      url.includes('?')
        ? `${url}&action=getContracts`
        : `${url}?action=getContracts`;


    const response =
      await fetch(endpoint, {
        method: 'GET',
        cache: 'no-store',
      });


    if (!response.ok) {

      throw new Error(
        `Apps Script HTTP ${response.status}`
      );
    }


    const data =
      await response.json();


    if (
      data.success &&
      Array.isArray(data.contracts)
    ) {

      memoryContracts =
        data.contracts;

      isInitialized = true;

      return memoryContracts;
    }


    throw new Error(
      data.error ||
        'Invalid response from Apps Script.'
    );

  } catch (error) {

    console.error(
      'Failed to fetch contracts:',
      error
    );

    return memoryContracts;
  }
}


/* ==============================================================================
   MEMORY CACHE
   ============================================================================== */

export function getStoredContracts(): ContractDetails[] {
  return memoryContracts;
}


/* ==============================================================================
   SAVE CONTRACT
   ============================================================================== */

export async function saveContract(
  updated: ContractDetails
): Promise<ContractDetails> {

  const url =
    getAppsScriptUrl();


  const existing =
    memoryContracts.find(
      (contract) =>
        contract.id === updated.id
    );


  const updatedContract:
    ContractDetails = {

    ...updated,

    employerToken:
      updated.employerToken ||
      existing?.employerToken ||
      generateSecureToken('emp'),

    workerToken:
      updated.workerToken ||
      existing?.workerToken ||
      generateSecureToken('wrk'),

    updatedAt:
      new Date().toISOString(),
  };


  if (!url) {

    throw new Error(
      'VITE_APPS_SCRIPT_URL is not configured.'
    );
  }


  try {

    const response =
      await fetch(url, {

        method: 'POST',

        headers: {
          'Content-Type':
            'text/plain;charset=utf-8',
        },

        body: JSON.stringify({
          action: 'saveContract',
          contract:
            updatedContract,
        }),

      });


    if (!response.ok) {

      throw new Error(
        `Apps Script HTTP ${response.status}`
      );
    }


    const data =
      await response.json();


    if (
      !data.success ||
      !data.contract
    ) {

      throw new Error(
        data.error ||
          'Google Sheets rejected the contract.'
      );
    }


    const savedContract:
      ContractDetails =
      data.contract;


    updateMemoryContract(
      savedContract
    );


    return savedContract;

  } catch (error) {

    console.error(
      'Contract save failed:',
      error
    );

    throw error;
  }
}


/* ==============================================================================
   DELETE CONTRACT
   ============================================================================== */

export async function deleteContract(
  id: string
): Promise<void> {

  const url =
    getAppsScriptUrl();


  if (!url) {

    throw new Error(
      'VITE_APPS_SCRIPT_URL is not configured.'
    );
  }


  try {

    const response =
      await fetch(url, {

        method: 'POST',

        headers: {
          'Content-Type':
            'text/plain;charset=utf-8',
        },

        body: JSON.stringify({
          action:
            'deleteContract',
          id,
        }),

      });


    if (!response.ok) {

      throw new Error(
        `Apps Script HTTP ${response.status}`
      );
    }


    const data =
      await response.json();


    if (!data.success) {

      throw new Error(
        data.error ||
          'Failed to delete contract.'
      );
    }


    memoryContracts =
      memoryContracts.filter(
        (contract) =>
          contract.id !== id
      );

  } catch (error) {

    console.error(
      'Delete contract failed:',
      error
    );

    throw error;
  }
}


/* ==============================================================================
   FIND CONTRACT BY SIGNING TOKEN
   ============================================================================== */

export async function getContractByToken(
  token: string
): Promise<{
  contract: ContractDetails;
  role: 'employer' | 'worker';
} | null> {

  if (!token) {
    return null;
  }


  const url =
    getAppsScriptUrl();


  if (!url) {

    console.error(
      'VITE_APPS_SCRIPT_URL is not configured.'
    );

    return null;
  }


  try {

    const endpoint =
      url.includes('?')
        ? `${url}&action=getContractByToken&token=${encodeURIComponent(token)}`
        : `${url}?action=getContractByToken&token=${encodeURIComponent(token)}`;


    const response =
      await fetch(endpoint, {
        method: 'GET',
        cache: 'no-store',
      });


    if (!response.ok) {

      throw new Error(
        `Apps Script HTTP ${response.status}`
      );
    }


    const data =
      await response.json();


    if (
      data.success &&
      data.contract &&
      (
        data.role === 'employer' ||
        data.role === 'worker'
      )
    ) {

      updateMemoryContract(
        data.contract
      );


      return {
        contract:
          data.contract,

        role:
          data.role,
      };
    }


    return null;

  } catch (error) {

    console.error(
      'Failed to resolve signing token:',
      error
    );

    return null;
  }
}


/* ==============================================================================
   EMPLOYER SIGNATURE
   ============================================================================== */

export async function submitEmployerSignature(
  contractId: string,
  signature: SignatureRecord
): Promise<ContractDetails | null> {

  return saveSignatureToDatabase(
    contractId,
    'employer',
    signature
  );
}


/* ==============================================================================
   WORKER SIGNATURE
   ============================================================================== */

export async function submitWorkerSignature(
  contractId: string,
  signature: SignatureRecord
): Promise<ContractDetails | null> {

  return saveSignatureToDatabase(
    contractId,
    'worker',
    signature
  );
}


/* ==============================================================================
   WITNESS SIGNATURE
   ============================================================================== */

export async function submitWitnessSignature(
  contractId: string,
  witness: WitnessRecord
): Promise<ContractDetails | null> {

  const url =
    getAppsScriptUrl();


  if (!url) {

    throw new Error(
      'VITE_APPS_SCRIPT_URL is not configured.'
    );
  }


  try {

    const response =
      await fetch(url, {

        method: 'POST',

        headers: {
          'Content-Type':
            'text/plain;charset=utf-8',
        },

        body: JSON.stringify({
          action:
            'saveSignature',

          contractId,

          role:
            'witness',

          witness,
        }),

      });


    if (!response.ok) {

      throw new Error(
        `Apps Script HTTP ${response.status}`
      );
    }


    const data =
      await response.json();


    if (
      !data.success ||
      !data.contract
    ) {

      throw new Error(
        data.error ||
          'Witness signature was not saved.'
      );
    }


    updateMemoryContract(
      data.contract
    );


    return data.contract;

  } catch (error) {

    console.error(
      'Witness signature failed:',
      error
    );

    throw error;
  }
}


/* ==============================================================================
   GENERIC SIGNATURE SAVE
   ============================================================================== */

async function saveSignatureToDatabase(
  contractId: string,
  role: 'employer' | 'worker',
  signature: SignatureRecord
): Promise<ContractDetails | null> {

  const url =
    getAppsScriptUrl();


  if (!url) {

    throw new Error(
      'VITE_APPS_SCRIPT_URL is not configured.'
    );
  }


  try {

    const response =
      await fetch(url, {

        method: 'POST',

        headers: {
          'Content-Type':
            'text/plain;charset=utf-8',
        },

        body: JSON.stringify({
          action:
            'saveSignature',

          contractId,

          role,

          signature,
        }),

      });


    if (!response.ok) {

      throw new Error(
        `Apps Script HTTP ${response.status}`
      );
    }


    const data =
      await response.json();


    if (
      !data.success ||
      !data.contract
    ) {

      throw new Error(
        data.error ||
          'Signature was not saved.'
      );
    }


    updateMemoryContract(
      data.contract
    );


    return data.contract;

  } catch (error) {

    console.error(
      `${role} signature failed:`,
      error
    );

    throw error;
  }
}


/* ==============================================================================
   UPDATE MEMORY CACHE
   ============================================================================== */

function updateMemoryContract(
  updated: ContractDetails
): void {

  const index =
    memoryContracts.findIndex(
      (contract) =>
        contract.id === updated.id
    );


  if (index >= 0) {

    memoryContracts[index] =
      updated;

  } else {

    memoryContracts.push(
      updated
    );
  }
}


/* ==============================================================================
   GET CONTRACT BY ID
   ============================================================================== */

export function getContractById(
  id: string
): ContractDetails | undefined {

  return memoryContracts.find(
    (contract) =>
      contract.id === id
  );
}


/* ==============================================================================
   INITIALIZATION STATUS
   ============================================================================== */

export function getInitializationStatus(): boolean {
  return isInitialized;
}