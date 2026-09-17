import React, { useState } from 'react';
import { ContractDetails } from '../types';
import { generateSecureToken } from '../services/storage';

interface AdminCreateContractProps {
  initialContract?: ContractDetails | null;
  onSave: (contract: ContractDetails) => void;
  onCancel: () => void;
}

export const AdminCreateContract: React.FC<AdminCreateContractProps> = ({
  initialContract,
  onSave,
  onCancel,
}) => {
  const isEditing = Boolean(initialContract);

  const [formData, setFormData] = useState<Partial<ContractDetails>>(() => {
    if (initialContract) {
      return { ...initialContract };
    }
    const currentYear = new Date().getFullYear();
    const randomSeq = Math.floor(100 + Math.random() * 900);
    return {
      contractNumber: `MDS/${currentYear}/${randomSeq}`,
      status: 'Draft',
      // Employer
      employerName: '',
      employerPhone: '+256 ',
      employerAddress: 'Kampala, Uganda',
      // Domestic Worker
      workerName: '',
      workerAge: '24',
      workerNIN: '',
      workerPhone: '+256 ',
      workerAddress: 'Kampala, Uganda',
      // Employment
      contractPeriod: '1 Year (12 Months)',
      jobTitle: 'Housekeeper & Domestic Assistant',
      duties: 'General household cleaning, washing and pressing of clothes, preparing family meals as instructed, and maintaining hygienic standards within the residence.',
      serviceFee: 'UGX 250,000',
      startDate: new Date().toISOString().split('T')[0],
      contractDuration: '12 Months (Renewable)',
      salary: 'UGX 400,000 per month',
      paymentDueDate: '28th day of each calendar month',
      probationPeriod: '1 Month (30 Days)',
      noticePeriod: '14 Days written notice',
      // Witness
      witnessSignature: {
        representativeName: 'Joanita Margaret Nassanga',
        representativeTitle: 'Placement Officer, Milestone Domestic Services Ltd',
      },
    };
  });

  const [witnessName, setWitnessName] = useState(
    formData.witnessSignature?.representativeName || 'Joanita Margaret Nassanga'
  );
  const [witnessTitle, setWitnessTitle] = useState(
    formData.witnessSignature?.representativeTitle || 'Placement Officer, Milestone Domestic Services Ltd'
  );

  const handleChange = (field: keyof ContractDetails, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const now = new Date().toISOString();
    const contractToSave: ContractDetails = {
      id: initialContract?.id || `mds-contract-${Date.now()}`,
      contractNumber: formData.contractNumber?.trim() || `MDS/${new Date().getFullYear()}/001`,
      createdAt: initialContract?.createdAt || now,
      updatedAt: now,
      status: formData.status || 'Draft',

      // Employer
      employerName: formData.employerName?.trim() || '',
      employerPhone: formData.employerPhone?.trim() || '',
      employerAddress: formData.employerAddress?.trim() || '',

      // Domestic Worker
      workerName: formData.workerName?.trim() || '',
      workerAge: formData.workerAge?.trim() || '',
      workerNIN: formData.workerNIN?.trim() || '',
      workerPhone: formData.workerPhone?.trim() || '',
      workerAddress: formData.workerAddress?.trim() || '',

      // Employment
      contractPeriod: formData.contractPeriod?.trim() || '1 Year (12 Months)',
      jobTitle: formData.jobTitle?.trim() || 'Housekeeper & Domestic Assistant',
      duties: formData.duties?.trim() || '',
      serviceFee: formData.serviceFee?.trim() || 'UGX 250,000',
      startDate: formData.startDate || '',
      contractDuration: formData.contractDuration?.trim() || '12 Months (Renewable)',
      salary: formData.salary?.trim() || 'UGX 400,000 per month',
      paymentDueDate: formData.paymentDueDate?.trim() || '28th day of each calendar month',
      probationPeriod: formData.probationPeriod?.trim() || '1 Month (30 Days)',
      noticePeriod: formData.noticePeriod?.trim() || '14 Days written notice',

      // Signatures
      employerSignature: initialContract?.employerSignature,
      workerSignature: initialContract?.workerSignature,
      witnessSignature: {
        representativeName: witnessName,
        representativeTitle: witnessTitle,
        signatureDataUrl: initialContract?.witnessSignature?.signatureDataUrl,
        signedAt: initialContract?.witnessSignature?.signedAt,
      },

      // Tokens
      employerToken: initialContract?.employerToken || generateSecureToken('emp'),
      workerToken: initialContract?.workerToken || generateSecureToken('wrk'),
    };

    onSave(contractToSave);
  };

  return (
    <div className="bg-white border border-neutral-300 p-4 sm:p-8 md:p-10 max-w-2xl mx-auto">
      <div className="flex items-center justify-between pb-4 border-b border-neutral-300 mb-6">
        <div>
          <h2 className="text-xl font-bold font-serif text-[#52247f]">
            {isEditing ? 'Edit Contract' : 'Create Contract'}
          </h2>
          <p className="text-xs text-neutral-600 mt-0.5">
            Fill the details below to generate the official employment contract.
          </p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="text-xs text-neutral-600 hover:text-neutral-900 underline cursor-pointer"
        >
          Cancel
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 text-sm">
        {/* Contract Reference */}
        <div>
          <label className="block text-xs font-bold text-neutral-800 uppercase tracking-wider mb-1">
            Contract Number
          </label>
          <input
            type="text"
            required
            value={formData.contractNumber || ''}
            onChange={(e) => handleChange('contractNumber', e.target.value)}
            className="w-full sm:w-1/2 px-3 py-2 border border-neutral-300 font-mono text-sm text-neutral-900 outline-none focus:border-neutral-900"
            placeholder="e.g. MDS/2026/0148"
          />
        </div>

        {/* GROUP 1: Employer */}
        <div className="pt-2 border-t border-neutral-200">
          <h3 className="text-base font-bold text-neutral-900 mb-4 font-serif">
            Employer
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Employer Name
              </label>
              <input
                type="text"
                required
                value={formData.employerName || ''}
                onChange={(e) => handleChange('employerName', e.target.value)}
                placeholder="e.g. Sarah Namukasa"
                className="w-full px-3 py-2 border border-neutral-300 text-sm outline-none focus:border-neutral-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Telephone
              </label>
              <input
                type="text"
                required
                value={formData.employerPhone || ''}
                onChange={(e) => handleChange('employerPhone', e.target.value)}
                placeholder="e.g. +256 701 761271"
                className="w-full px-3 py-2 border border-neutral-300 text-sm outline-none focus:border-neutral-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Address
              </label>
              <input
                type="text"
                required
                value={formData.employerAddress || ''}
                onChange={(e) => handleChange('employerAddress', e.target.value)}
                placeholder="e.g. Agenda, Kyaliwajjala - Naalya Rd, Kampala"
                className="w-full px-3 py-2 border border-neutral-300 text-sm outline-none focus:border-neutral-900"
              />
            </div>
          </div>
        </div>

        {/* GROUP 2: Domestic Worker */}
        <div className="pt-4 border-t border-neutral-200">
          <h3 className="text-base font-bold text-neutral-900 mb-4 font-serif">
            Domestic Worker
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                value={formData.workerName || ''}
                onChange={(e) => handleChange('workerName', e.target.value)}
                placeholder="e.g. Florence Nabirye"
                className="w-full px-3 py-2 border border-neutral-300 text-sm outline-none focus:border-neutral-900"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Age
                </label>
                <input
                  type="text"
                  value={formData.workerAge || ''}
                  onChange={(e) => handleChange('workerAge', e.target.value)}
                  placeholder="e.g. 24"
                  className="w-full px-3 py-2 border border-neutral-300 text-sm outline-none focus:border-neutral-900"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  NIN (National Identification Number)
                </label>
                <input
                  type="text"
                  value={formData.workerNIN || ''}
                  onChange={(e) => handleChange('workerNIN', e.target.value)}
                  placeholder="e.g. CF99024108KJLA"
                  className="w-full px-3 py-2 border border-neutral-300 font-mono text-sm outline-none focus:border-neutral-900"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Telephone
              </label>
              <input
                type="text"
                value={formData.workerPhone || ''}
                onChange={(e) => handleChange('workerPhone', e.target.value)}
                placeholder="e.g. +256 703 189240"
                className="w-full px-3 py-2 border border-neutral-300 text-sm outline-none focus:border-neutral-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Address
              </label>
              <input
                type="text"
                value={formData.workerAddress || ''}
                onChange={(e) => handleChange('workerAddress', e.target.value)}
                placeholder="e.g. Kyanja Central, Nakawa Division, Kampala"
                className="w-full px-3 py-2 border border-neutral-300 text-sm outline-none focus:border-neutral-900"
              />
            </div>
          </div>
        </div>

        {/* GROUP 3: Employment */}
        <div className="pt-4 border-t border-neutral-200">
          <h3 className="text-base font-bold text-neutral-900 mb-4 font-serif">
            Employment
          </h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Contract Period
                </label>
                <input
                  type="text"
                  required
                  value={formData.contractPeriod || ''}
                  onChange={(e) => handleChange('contractPeriod', e.target.value)}
                  placeholder="e.g. 1 Year / 12 Months"
                  className="w-full px-3 py-2 border border-neutral-300 text-sm outline-none focus:border-neutral-900"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Job Title
                </label>
                <input
                  type="text"
                  required
                  value={formData.jobTitle || ''}
                  onChange={(e) => handleChange('jobTitle', e.target.value)}
                  placeholder="e.g. Housekeeper / Nanny / Cook"
                  className="w-full px-3 py-2 border border-neutral-300 text-sm outline-none focus:border-neutral-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Duties
              </label>
              <textarea
                rows={3}
                required
                value={formData.duties || ''}
                onChange={(e) => handleChange('duties', e.target.value)}
                placeholder="Cooking, cleaning, laundry, ironing, childcare, and general household maintenance."
                className="w-full px-3 py-2 border border-neutral-300 text-sm outline-none focus:border-neutral-900"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Service Fee
                </label>
                <input
                  type="text"
                  value={formData.serviceFee || ''}
                  onChange={(e) => handleChange('serviceFee', e.target.value)}
                  placeholder="e.g. UGX 250,000"
                  className="w-full px-3 py-2 border border-neutral-300 text-sm outline-none focus:border-neutral-900"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  required
                  value={formData.startDate || ''}
                  onChange={(e) => handleChange('startDate', e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 text-sm outline-none focus:border-neutral-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Contract Duration
                </label>
                <input
                  type="text"
                  required
                  value={formData.contractDuration || ''}
                  onChange={(e) => handleChange('contractDuration', e.target.value)}
                  placeholder="e.g. 12 Months (Renewable)"
                  className="w-full px-3 py-2 border border-neutral-300 text-sm outline-none focus:border-neutral-900"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Monthly Salary
                </label>
                <input
                  type="text"
                  required
                  value={formData.salary || ''}
                  onChange={(e) => handleChange('salary', e.target.value)}
                  placeholder="e.g. UGX 400,000"
                  className="w-full px-3 py-2 border border-neutral-300 text-sm outline-none focus:border-neutral-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Payment Due Date
                </label>
                <input
                  type="text"
                  value={formData.paymentDueDate || ''}
                  onChange={(e) => handleChange('paymentDueDate', e.target.value)}
                  placeholder="e.g. 28th of each month"
                  className="w-full px-3 py-2 border border-neutral-300 text-sm outline-none focus:border-neutral-900"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Probation Period
                </label>
                <input
                  type="text"
                  value={formData.probationPeriod || ''}
                  onChange={(e) => handleChange('probationPeriod', e.target.value)}
                  placeholder="e.g. 1 Month (30 Days)"
                  className="w-full px-3 py-2 border border-neutral-300 text-sm outline-none focus:border-neutral-900"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Notice Period
                </label>
                <input
                  type="text"
                  value={formData.noticePeriod || ''}
                  onChange={(e) => handleChange('noticePeriod', e.target.value)}
                  placeholder="e.g. 14 Days written notice"
                  className="w-full px-3 py-2 border border-neutral-300 text-sm outline-none focus:border-neutral-900"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Milestone Witness Attestation Details */}
        <div className="pt-4 border-t border-neutral-200">
          <h3 className="text-base font-bold text-neutral-900 mb-4 font-serif">
            Milestone Witness
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Representative Witness Name
              </label>
              <input
                type="text"
                value={witnessName}
                onChange={(e) => setWitnessName(e.target.value)}
                placeholder="e.g. Joanita Margaret Nassanga"
                className="w-full px-3 py-2 border border-neutral-300 text-sm outline-none focus:border-neutral-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Title / Designation
              </label>
              <input
                type="text"
                value={witnessTitle}
                onChange={(e) => setWitnessTitle(e.target.value)}
                placeholder="e.g. Placement Officer, Milestone Domestic Services Ltd"
                className="w-full px-3 py-2 border border-neutral-300 text-sm outline-none focus:border-neutral-900"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-6 border-t border-neutral-300 flex items-center justify-between">
          <button
            type="button"
            onClick={onCancel}
            className="text-xs text-neutral-600 hover:text-neutral-900 underline cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="bg-[#52247f] hover:bg-[#421d66] text-white font-semibold text-xs uppercase tracking-wider py-3 px-8 transition-colors cursor-pointer shadow-sm"
          >
            {isEditing ? 'Save Changes' : 'Generate Contract'}
          </button>
        </div>
      </form>
    </div>
  );
};
