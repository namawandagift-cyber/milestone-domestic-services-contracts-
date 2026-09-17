import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// File-based database storage
const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

interface DatabaseSchema {
  contracts: any[];
  reviews: any[];
  lastSyncedAt?: string;
}

const INITIAL_CONTRACTS = [
  {
    id: 'mds-contract-001',
    contractNumber: 'MDS/2026/0148',
    createdAt: '2026-09-12T09:30:00Z',
    status: 'Waiting for Employer',
    employerName: 'Sarah Namukasa',
    employerPhone: '+256 701 761271',
    employerAddress: 'Agenda, Kyaliwajjala - Naalya Rd, Kampala',
    workerName: 'Florence Nabirye',
    workerAge: '24',
    workerNIN: 'CF99024108KJLA',
    workerPhone: '+256 703 189240',
    workerAddress: 'Kyanja Central, Nakawa Division, Kampala',
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
    employerToken: 'emp_9b4e82cf1a6',
    workerToken: 'wrk_5d3a71fe9c2',
    updatedAt: '2026-09-12T09:30:00Z',
  },
  {
    id: 'mds-contract-002',
    contractNumber: 'MDS/2026/0149',
    createdAt: '2026-09-14T14:15:00Z',
    status: 'Completed',
    employerName: 'Dr. Patrick Mugabe',
    employerPhone: '+256 782 559312',
    employerAddress: 'House 4, Ministers Village, Ntinda, Kampala',
    workerName: 'Prossy Namutebi',
    workerAge: '28',
    workerNIN: 'CF95031209MNPA',
    workerPhone: '+256 754 821903',
    workerAddress: 'Namugongo Parish, Kira Municipality, Wakiso',
    contractPeriod: '1 Year (12 Months)',
    jobTitle: 'Cook & Housekeeper',
    duties: 'Meal preparation, kitchen sanitation, deep house cleaning, and grocery coordination.',
    serviceFee: 'UGX 250,000',
    startDate: '2026-09-20',
    contractDuration: '12 Months (Renewable)',
    salary: 'UGX 400,000 per month',
    probationPeriod: '1 Month (30 Days)',
    paymentDueDate: '1st day of each month',
    noticePeriod: '30 Days written notice',
    employerToken: 'emp_3c7f91ad2b8',
    workerToken: 'wrk_8e2d45cb7f1',
    employerSignature: {
      signedByName: 'Dr. Patrick Mugabe',
      signedAt: '2026-09-15T11:20:00Z',
      signatureDataUrl: '',
    },
    workerSignature: {
      signedByName: 'Prossy Namutebi',
      signedAt: '2026-09-15T16:45:00Z',
      signatureDataUrl: '',
    },
    witnessSignature: {
      representativeName: 'Gift Namaganda',
      representativeTitle: 'Managing Director, Milestone Domestic Services',
      signedAt: '2026-09-16T08:30:00Z',
    },
    updatedAt: '2026-09-16T08:30:00Z',
  },
];

const INITIAL_REVIEWS = [
  {
    id: 'rev-1',
    author: 'Christine Akello (Naalya)',
    rating: 5,
    date: '3 weeks ago',
    content:
      'Milestone Domestic Services made hiring our househelp completely transparent. Having the official contract witnessed and signed with clear terms protected both of us. Highly recommend their vetting!',
    verified: true,
  },
  {
    id: 'rev-2',
    author: 'David Kato (Kyaliwajjala)',
    rating: 5,
    date: '1 month ago',
    content:
      'Very accessible office along Kyaliwajjala - Naalya Road. They took time to understand our family requirements and matched us with a well-trained, polite nanny. The digital contract workflow is so convenient.',
    verified: true,
  },
  {
    id: 'rev-3',
    author: 'Brenda Namusoke (Kira)',
    rating: 5,
    date: '2 months ago',
    content:
      'Professionalizing domestic work in Uganda is long overdue. Milestone does thorough background checks and provides standard employment terms. Outstanding service!',
    verified: true,
  },
];

// Initialize and read/write database
function readDatabase(): DatabaseSchema {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DB_FILE)) {
      const initial: DatabaseSchema = {
        contracts: INITIAL_CONTRACTS,
        reviews: INITIAL_REVIEWS,
      };
      fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf-8');
      return initial;
    }
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return {
      contracts: parsed.contracts || INITIAL_CONTRACTS,
      reviews: parsed.reviews || INITIAL_REVIEWS,
      lastSyncedAt: parsed.lastSyncedAt,
    };
  } catch (err) {
    console.error('Database read error:', err);
    return { contracts: INITIAL_CONTRACTS, reviews: INITIAL_REVIEWS };
  }
}

function writeDatabase(data: DatabaseSchema): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');

    // Async sync to Google Apps Script if URL configured
    triggerAppsScriptSync(data.contracts);
  } catch (err) {
    console.error('Database write error:', err);
  }
}

// Background sync to Google Apps Script Web App
async function triggerAppsScriptSync(contracts: any[]) {
  const appsScriptUrl = process.env.APPS_SCRIPT_URL || process.env.VITE_APPS_SCRIPT_URL;
  if (!appsScriptUrl) return;

  try {
    const payload = {
      action: 'syncContracts',
      timestamp: new Date().toISOString(),
      contracts,
    };
    await fetch(appsScriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    // Silent non-blocking sync
    console.debug('Background Apps Script sync ping:', err);
  }
}

// ==================== REST API ENDPOINTS ====================

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    database: 'active',
    timestamp: new Date().toISOString(),
  });
});

// GET all contracts
app.get('/api/contracts', (req: Request, res: Response) => {
  const db = readDatabase();
  res.json(db.contracts);
});

// GET contract by ID
app.get('/api/contracts/:id', (req: Request, res: Response) => {
  const db = readDatabase();
  const found = db.contracts.find((c) => c.id === req.params.id);
  if (!found) {
    return res.status(404).json({ error: 'Contract not found' });
  }
  res.json(found);
});

// GET contract by signing token
app.get('/api/contracts/token/:token', (req: Request, res: Response) => {
  const db = readDatabase();
  const token = req.params.token;
  for (const contract of db.contracts) {
    if (contract.employerToken === token) {
      return res.json({ contract, role: 'employer' });
    }
    if (contract.workerToken === token) {
      return res.json({ contract, role: 'worker' });
    }
  }
  return res.status(404).json({ error: 'Invalid or expired signing token' });
});

// POST save / upsert contract
app.post('/api/contracts', (req: Request, res: Response) => {
  const contract = req.body;
  if (!contract || !contract.id) {
    return res.status(400).json({ error: 'Missing contract ID' });
  }

  const db = readDatabase();
  const index = db.contracts.findIndex((c) => c.id === contract.id);
  const updatedContract = {
    ...contract,
    updatedAt: new Date().toISOString(),
  };

  if (index >= 0) {
    db.contracts[index] = updatedContract;
  } else {
    db.contracts.unshift(updatedContract);
  }

  writeDatabase(db);
  res.json({ success: true, contract: updatedContract });
});

// DELETE contract
app.delete('/api/contracts/:id', (req: Request, res: Response) => {
  const db = readDatabase();
  const initialLength = db.contracts.length;
  db.contracts = db.contracts.filter((c) => c.id !== req.params.id);

  if (db.contracts.length === initialLength) {
    return res.status(404).json({ error: 'Contract not found' });
  }

  writeDatabase(db);
  res.json({ success: true, message: 'Contract deleted' });
});

// POST employer signature
app.post('/api/contracts/:id/signature/employer', (req: Request, res: Response) => {
  const { signature } = req.body;
  const db = readDatabase();
  const contract = db.contracts.find((c) => c.id === req.params.id);

  if (!contract) {
    return res.status(404).json({ error: 'Contract not found' });
  }

  contract.employerSignature = signature;
  contract.status = 'Waiting for Worker';
  contract.updatedAt = new Date().toISOString();

  writeDatabase(db);
  res.json({ success: true, contract });
});

// POST worker signature
app.post('/api/contracts/:id/signature/worker', (req: Request, res: Response) => {
  const { signature } = req.body;
  const db = readDatabase();
  const contract = db.contracts.find((c) => c.id === req.params.id);

  if (!contract) {
    return res.status(404).json({ error: 'Contract not found' });
  }

  contract.workerSignature = signature;
  contract.status = 'Completed';
  contract.updatedAt = new Date().toISOString();

  writeDatabase(db);
  res.json({ success: true, contract });
});

// POST witness signature
app.post('/api/contracts/:id/signature/witness', (req: Request, res: Response) => {
  const { witness } = req.body;
  const db = readDatabase();
  const contract = db.contracts.find((c) => c.id === req.params.id);

  if (!contract) {
    return res.status(404).json({ error: 'Contract not found' });
  }

  const isFullySigned = Boolean(contract.employerSignature && contract.workerSignature);
  contract.witnessSignature = witness;
  if (isFullySigned) {
    contract.status = 'Completed';
  }
  contract.updatedAt = new Date().toISOString();

  writeDatabase(db);
  res.json({ success: true, contract });
});

// Reviews API
app.get('/api/reviews', (req: Request, res: Response) => {
  const db = readDatabase();
  res.json(db.reviews);
});

app.post('/api/reviews', (req: Request, res: Response) => {
  const review = req.body;
  if (!review || !review.author || !review.content) {
    return res.status(400).json({ error: 'Invalid review payload' });
  }

  const db = readDatabase();
  const newReview = {
    id: `rev-${Date.now()}`,
    author: review.author,
    rating: Number(review.rating) || 5,
    date: 'Just now',
    content: review.content,
    verified: true,
  };

  db.reviews.unshift(newReview);
  writeDatabase(db);
  res.json({ success: true, review: newReview });
});

// ==================== VITE MIDDLEWARE / STATIC ====================
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
