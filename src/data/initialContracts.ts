import { ContractDetails } from '../types';

export const INITIAL_CONTRACTS: ContractDetails[] = [
  {
    id: 'mds-contract-001',
    contractNumber: 'MDS/2026/0148',
    createdAt: '2026-09-12T09:30:00Z',
    status: 'Waiting for Employer',
    
    // Employer
    employerName: 'Sarah Namukasa',
    employerPhone: '+256 701 761271',
    employerAddress: 'Agenda, Kyaliwajjala - Naalya Rd, Kampala',

    // Domestic Worker
    workerName: 'Florence Nabirye',
    workerAge: '24',
    workerNIN: 'CF99024108KJLA',
    workerPhone: '+256 703 189240',
    workerAddress: 'Kyanja Central, Nakawa Division, Kampala',

    // Employment
    contractPeriod: '1 Year (12 Months)',
    jobTitle: 'Housekeeper & Child Care Assistant',
    duties: 'Cooking, cleaning, laundry, ironing, childcare, and general household maintenance as directed by the Employer.',
    serviceFee: 'UGX 250,000',
    startDate: '2026-10-01',
    contractDuration: '12 Months (Renewable)',
    salary: 'UGX 350,000 per month',
    probationPeriod: '1 Month (30 Days)',
    paymentDueDate: '28th day of each calendar month',
    noticePeriod: '14 Days written notice',

    // Tokens
    employerToken: 'emp_9b4e82cf1a6',
    workerToken: 'wrk_5d3a71fe9c2',

    updatedAt: '2026-09-12T09:30:00Z',
  },
  {
    id: 'mds-contract-002',
    contractNumber: 'MDS/2026/0149',
    createdAt: '2026-09-14T14:15:00Z',
    status: 'Completed',

    // Employer
    employerName: 'Dr. Patrick Mugabe',
    employerPhone: '+256 782 559312',
    employerAddress: 'House 4, Ministers Village, Ntinda, Kampala',

    // Domestic Worker
    workerName: 'Prossy Namutebi',
    workerAge: '28',
    workerNIN: 'CF95031209MNPA',
    workerPhone: '+256 754 821903',
    workerAddress: 'Namugongo Parish, Kira Municipality, Wakiso',

    // Employment
    contractPeriod: '1 Year (12 Months)',
    jobTitle: 'Cook & Housekeeper',
    duties: 'Meal planning and preparation, grocery management, deep kitchen hygiene, daily house cleaning, and laundry.',
    serviceFee: 'UGX 300,000',
    startDate: '2026-09-15',
    contractDuration: '12 Months (Renewable)',
    salary: 'UGX 400,000 per month',
    probationPeriod: '1 Month (30 Days)',
    paymentDueDate: '1st day of subsequent calendar month',
    noticePeriod: '14 Days written notice',

    // Signatures
    employerSignature: {
      signatureDataUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="100"><path d="M 20 60 Q 60 20 100 55 T 180 40 T 260 50" fill="none" stroke="%231e3a8a" stroke-width="3" stroke-linecap="round"/></svg>',
      signedByName: 'Dr. Patrick Mugabe',
      signedAt: '2026-09-14T15:20:00Z',
    },
    workerSignature: {
      signatureDataUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="100"><path d="M 25 70 Q 70 25 120 60 T 200 45 T 275 65" fill="none" stroke="%230f172a" stroke-width="3" stroke-linecap="round"/></svg>',
      signedByName: 'Prossy Namutebi',
      signedAt: '2026-09-14T17:40:00Z',
    },
    witnessSignature: {
      representativeName: 'Joanita Margaret Nassanga',
      representativeTitle: 'Placement Officer, Milestone Domestic Services Ltd',
      signatureDataUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="100"><path d="M 30 50 Q 80 15 140 45 T 220 30 T 270 55" fill="none" stroke="%23047857" stroke-width="3" stroke-linecap="round"/></svg>',
      signedAt: '2026-09-14T18:00:00Z',
    },

    // Tokens
    employerToken: 'emp_2c8f19da4b7',
    workerToken: 'wrk_8e1d53ba0f4',

    updatedAt: '2026-09-14T18:00:00Z',
  }
];
