export type ContractStatus =
  | 'Draft'
  | 'Waiting for Employer'
  | 'Waiting for Worker'
  | 'Completed';

export interface SignatureRecord {
  signatureDataUrl: string;
  signedByName: string;
  signedAt: string;
}

export interface WitnessRecord {
  representativeName: string;
  representativeTitle: string;
  signatureDataUrl?: string;
  signedAt?: string;
}

export interface ContractDetails {
  id: string;
  contractNumber: string;
  createdAt: string;
  status: ContractStatus;

  // Employer Information
  employerName: string;
  employerPhone: string;
  employerAddress: string;

  // Domestic Worker Information
  workerName: string;
  workerAge: string;
  workerNIN: string;
  workerPhone: string;
  workerAddress: string;

  // Employment Terms & Clauses
  contractPeriod: string; // e.g. "12 Months (1 Year)"
  jobTitle: string;
  duties: string;
  serviceFee: string;
  startDate: string;
  contractDuration: string;
  salary: string;
  probationPeriod?: string;
  paymentDueDate?: string;
  noticePeriod?: string;

  // Signatures
  employerSignature?: SignatureRecord;
  workerSignature?: SignatureRecord;
  witnessSignature?: WitnessRecord;

  // Secure tokens for signing links
  employerToken: string;
  workerToken: string;

  // Sync / storage timestamp
  updatedAt: string;
}

export type SignerRole = 'employer' | 'worker';

export interface BusinessReview {
  id: string;
  author: string;
  rating: number;
  date: string;
  content: string;
  verified?: boolean;
}
