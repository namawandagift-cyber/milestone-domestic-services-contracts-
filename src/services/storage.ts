import { ContractDetails, ContractStatus, SignatureRecord, WitnessRecord } from '../types';
import { INITIAL_CONTRACTS } from '../data/initialContracts';

// In-memory runtime contract cache (backed strictly by the database server, ZERO localStorage)
let memoryContracts: ContractDetails[] = [...INITIAL_CONTRACTS];
let isInitialized = false;

export function generateSecureToken(prefix: 'emp' | 'wrk'): string {
  const randomBytes = new Uint8Array(8);
  crypto.getRandomValues(randomBytes);
  const hex = Array.from(randomBytes, b => b.toString(16).padStart(2, '0')).join('');
  return `${prefix}_${hex}`;
}

/**
 * Fetch all contracts directly from the backend database server
 */
export async function fetchContractsFromDatabase(): Promise<ContractDetails[]> {
  try {
    const response = await fetch('/api/contracts');
    if (!response.ok) {
      throw new Error(`Database error: ${response.statusText}`);
    }
    const data = await response.json();
    if (Array.isArray(data) && data.length > 0) {
      memoryContracts = data;
      isInitialized = true;
      return data;
    }
    return memoryContracts;
  } catch (err) {
    console.warn('Database fetch error, using local database cache:', err);
    return memoryContracts;
  }
}

/**
 * Get stored contracts from database cache
 */
export function getStoredContracts(): ContractDetails[] {
  // If not yet initialized, trigger initial database fetch in background
  if (!isInitialized) {
    fetchContractsFromDatabase().catch(() => {});
  }
  return memoryContracts;
}

/**
 * Save array of contracts to database
 */
export async function saveContracts(contracts: ContractDetails[]): Promise<void> {
  memoryContracts = contracts;
  // Push each contract to the database
  for (const contract of contracts) {
    try {
      await fetch('/api/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contract),
      });
    } catch (err) {
      console.error('Failed to sync contract to database:', err);
    }
  }
}

export function getContractById(id: string): ContractDetails | undefined {
  return memoryContracts.find(c => c.id === id);
}

export function getContractByToken(
  token: string
): { contract: ContractDetails; role: 'employer' | 'worker' } | null {
  for (const contract of memoryContracts) {
    if (contract.employerToken === token) {
      return { contract, role: 'employer' };
    }
    if (contract.workerToken === token) {
      return { contract, role: 'worker' };
    }
  }
  return null;
}

/**
 * Save / upsert a single contract to the database
 */
export function saveContract(updated: ContractDetails): ContractDetails {
  const index = memoryContracts.findIndex(c => c.id === updated.id);
  const updatedContract: ContractDetails = {
    ...updated,
    updatedAt: new Date().toISOString(),
  };

  if (index >= 0) {
    memoryContracts = [
      ...memoryContracts.slice(0, index),
      updatedContract,
      ...memoryContracts.slice(index + 1),
    ];
  } else {
    memoryContracts = [updatedContract, ...memoryContracts];
  }

  // Persist directly to backend database server
  fetch('/api/contracts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updatedContract),
  }).catch((err) => {
    console.error('Database write error:', err);
  });

  return updatedContract;
}

/**
 * Delete a contract from the database
 */
export function deleteContract(id: string): void {
  memoryContracts = memoryContracts.filter(c => c.id !== id);

  // Send DELETE to backend database server
  fetch(`/api/contracts/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  }).catch((err) => {
    console.error('Database delete error:', err);
  });
}

/**
 * Submit employer signature to the database
 */
export function submitEmployerSignature(
  contractId: string,
  signature: SignatureRecord
): ContractDetails | null {
  const contract = getContractById(contractId);
  if (!contract) return null;

  const nextStatus: ContractStatus = 'Waiting for Worker';
  const updated: ContractDetails = {
    ...contract,
    employerSignature: signature,
    status: nextStatus,
    updatedAt: new Date().toISOString(),
  };

  // Update memory cache
  const index = memoryContracts.findIndex(c => c.id === contractId);
  if (index >= 0) {
    memoryContracts[index] = updated;
  }

  // Persist signature directly to database
  fetch(`/api/contracts/${encodeURIComponent(contractId)}/signature/employer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ signature }),
  }).catch((err) => {
    console.error('Database signature error:', err);
  });

  return updated;
}

/**
 * Submit worker signature to the database
 */
export function submitWorkerSignature(
  contractId: string,
  signature: SignatureRecord
): ContractDetails | null {
  const contract = getContractById(contractId);
  if (!contract) return null;

  const updated: ContractDetails = {
    ...contract,
    workerSignature: signature,
    status: 'Completed',
    updatedAt: new Date().toISOString(),
  };

  // Update memory cache
  const index = memoryContracts.findIndex(c => c.id === contractId);
  if (index >= 0) {
    memoryContracts[index] = updated;
  }

  // Persist signature directly to database
  fetch(`/api/contracts/${encodeURIComponent(contractId)}/signature/worker`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ signature }),
  }).catch((err) => {
    console.error('Database signature error:', err);
  });

  return updated;
}

/**
 * Submit witness signature to the database
 */
export function submitWitnessSignature(
  contractId: string,
  witness: WitnessRecord
): ContractDetails | null {
  const contract = getContractById(contractId);
  if (!contract) return null;

  const isFullySigned = Boolean(contract.employerSignature && contract.workerSignature);
  const updated: ContractDetails = {
    ...contract,
    witnessSignature: witness,
    status: isFullySigned ? 'Completed' : contract.status,
    updatedAt: new Date().toISOString(),
  };

  // Update memory cache
  const index = memoryContracts.findIndex(c => c.id === contractId);
  if (index >= 0) {
    memoryContracts[index] = updated;
  }

  // Persist signature directly to database
  fetch(`/api/contracts/${encodeURIComponent(contractId)}/signature/witness`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ witness }),
  }).catch((err) => {
    console.error('Database signature error:', err);
  });

  return updated;
}
