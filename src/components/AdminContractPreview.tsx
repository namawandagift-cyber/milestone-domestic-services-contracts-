import React, { useState } from 'react';
import { ContractDetails } from '../types';
import { ContractDocument } from './ContractDocument';
import { downloadContractPdf } from '../utils/pdfGenerator';
import { submitWitnessSignature } from '../services/storage';
import { SignaturePad } from './SignaturePad';

interface AdminContractPreviewProps {
  contract: ContractDetails;
  onBack: () => void;
  onEdit: () => void;
  onUpdateContract: (updated: ContractDetails) => void;
  onOpenSigningPage: (token: string) => void;
}

export const AdminContractPreview: React.FC<AdminContractPreviewProps> = ({
  contract,
  onBack,
  onEdit,
  onUpdateContract,
  onOpenSigningPage,
}) => {
  const [showSigningLinkScreen, setShowSigningLinkScreen] = useState(false);
  const [showWitnessModal, setShowWitnessModal] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState<'employer' | 'worker'>(
    contract.employerSignature ? 'worker' : 'employer'
  );

  const [witnessName, setWitnessName] = useState(
    contract.witnessSignature?.representativeName || 'Joanita Margaret Nassanga'
  );
  const [witnessTitle, setWitnessTitle] = useState(
    contract.witnessSignature?.representativeTitle || 'Placement Officer, Milestone Domestic Services Ltd'
  );

  const getBaseUrl = () => {
    return window.location.origin;
  };

  // Generate clean web application URLs (never Apps Script URL)
  const employerSigningUrl = `${getBaseUrl()}?token=${contract.employerToken}`;
  const workerSigningUrl = `${getBaseUrl()}?token=${contract.workerToken}`;

  const currentSigningUrl = selectedRecipient === 'employer' ? employerSigningUrl : workerSigningUrl;
  const currentRecipientName = selectedRecipient === 'employer' ? contract.employerName : contract.workerName;

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      prompt('Copy signing link:', text);
    }
  };

  const handleDownloadPdf = async () => {
    try {
      setIsGeneratingPdf(true);
      await downloadContractPdf('admin-contract-view', contract.contractNumber);
    } catch (err) {
      console.error('PDF error, falling back to browser print:', err);
      window.print();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleWitnessSubmit = (signatureDataUrl: string) => {
    const updated = submitWitnessSignature(contract.id, {
      representativeName: witnessName,
      representativeTitle: witnessTitle,
      signatureDataUrl,
      signedAt: new Date().toISOString(),
    });

    if (updated) {
      onUpdateContract(updated);
      setShowWitnessModal(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Bar Above Document */}
      <div className="bg-white border border-neutral-300 p-4 flex flex-wrap items-center justify-between gap-4 no-print">
        <button
          onClick={onBack}
          className="text-xs font-semibold text-neutral-700 hover:text-neutral-950 underline cursor-pointer"
        >
          ← Back to Contracts
        </button>

        <div className="flex flex-wrap items-center gap-3">
          {/* Milestone Witness Action */}
          {!contract.witnessSignature?.signatureDataUrl ? (
            <button
              onClick={() => setShowWitnessModal(true)}
              className="px-3.5 py-2 text-xs font-semibold bg-[#235c27] hover:bg-[#1b491f] text-white transition-colors cursor-pointer shadow-sm"
            >
              Milestone Witness Sign
            </button>
          ) : (
            <span className="text-xs text-[#235c27] font-semibold border border-[#235c27] bg-green-50 px-2.5 py-1">
              Witnessed ✓
            </span>
          )}

          {/* Simple Action 1: Edit Details */}
          <button
            onClick={onEdit}
            className="px-4 py-2 text-xs font-semibold border border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-800 transition-colors cursor-pointer"
          >
            Edit Details
          </button>

          {/* Simple Action 2: Create Signing Link */}
          <button
            onClick={() => setShowSigningLinkScreen(true)}
            className="px-4 py-2 text-xs font-semibold bg-[#52247f] hover:bg-[#421d66] text-white transition-colors cursor-pointer shadow-sm"
          >
            Create Signing Link
          </button>

          {/* Simple Action 3: Download PDF */}
          <button
            onClick={handleDownloadPdf}
            disabled={isGeneratingPdf}
            className="px-4 py-2 text-xs font-semibold bg-[#235c27] hover:bg-[#1b491f] text-white transition-colors cursor-pointer disabled:bg-neutral-400 shadow-sm"
          >
            {isGeneratingPdf ? 'Generating PDF...' : 'Download PDF'}
          </button>
        </div>
      </div>

      {/* Contract Document: Occupies the main visual space without unnecessary UI */}
      <div className="flex justify-center">
        <ContractDocument contract={contract} id="admin-contract-view" />
      </div>

      {/* 16. THE SIGNING LINK SCREEN (Clean, specific screen matching section 16) */}
      {showSigningLinkScreen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 no-print">
          <div className="bg-white border border-neutral-400 max-w-lg w-full p-6 sm:p-8 text-sm">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold font-serif text-[#52247f]">
                  Contract ready
                </h3>
                <p className="text-sm text-neutral-700 mt-1">
                  {contract.workerName}'s contract is ready for signing.
                </p>
              </div>
              <button
                onClick={() => setShowSigningLinkScreen(false)}
                className="text-neutral-500 hover:text-neutral-900 text-base cursor-pointer p-1"
              >
                ✕
              </button>
            </div>

            {/* Recipient Selection Tab (Employer first, then Worker) */}
            <div className="flex border-b border-neutral-300 my-4 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setSelectedRecipient('employer')}
                className={`py-2 px-4 border-b-2 cursor-pointer transition-colors ${
                  selectedRecipient === 'employer'
                    ? 'border-[#52247f] text-[#52247f] font-bold'
                    : 'border-transparent text-neutral-500 hover:text-neutral-800'
                }`}
              >
                1. Employer ({contract.employerName})
                {contract.employerSignature && ' ✓'}
              </button>
              <button
                type="button"
                onClick={() => setSelectedRecipient('worker')}
                className={`py-2 px-4 border-b-2 cursor-pointer transition-colors ${
                  selectedRecipient === 'worker'
                    ? 'border-[#52247f] text-[#52247f] font-bold'
                    : 'border-transparent text-neutral-500 hover:text-neutral-800'
                }`}
              >
                2. Domestic Worker ({contract.workerName})
                {contract.workerSignature && ' ✓'}
              </button>
            </div>

            <div className="bg-neutral-50 p-4 border border-neutral-200 mb-5">
              <div className="text-xs text-neutral-600 mb-2">
                Signing link for: <strong>{currentRecipientName}</strong>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={currentSigningUrl}
                  className="w-full bg-white border border-neutral-300 px-3 py-2 text-xs font-mono select-all outline-none"
                />
                <button
                  type="button"
                  onClick={() => copyToClipboard(currentSigningUrl)}
                  className="px-4 py-2 bg-[#52247f] hover:bg-[#421d66] text-white text-xs font-semibold uppercase tracking-wider shrink-0 cursor-pointer shadow-sm"
                >
                  {copiedLink ? 'Copied' : 'Copy Signing Link'}
                </button>
              </div>
              <p className="text-xs text-neutral-600 mt-3 italic">
                You can send this link through WhatsApp, SMS or email.
              </p>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-neutral-200 text-xs">
              <button
                type="button"
                onClick={() => {
                  setShowSigningLinkScreen(false);
                  window.open(currentSigningUrl, '_blank');
                }}
                className="text-[#235c27] font-bold hover:underline cursor-pointer inline-flex items-center gap-1"
              >
                <span>Open signing screen in new tab</span>
                <span className="text-sm">↗</span>
              </button>

              <button
                type="button"
                onClick={() => setShowSigningLinkScreen(false)}
                className="px-4 py-2 border border-neutral-300 text-neutral-800 hover:bg-neutral-50 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Compact Witness Signing Modal - Only contains the signing box */}
      {showWitnessModal && (
        <div 
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4 no-print"
          onClick={() => setShowWitnessModal(false)}
        >
          <div 
            className="bg-white border border-neutral-300 shadow-xl max-w-sm sm:max-w-md w-full p-4 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center pb-2 border-b border-neutral-200 mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#52247f]">
                Witness Signature
              </h3>
              <button
                type="button"
                onClick={() => setShowWitnessModal(false)}
                className="text-neutral-400 hover:text-neutral-800 text-base leading-none p-1 cursor-pointer"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <SignaturePad
              compact={true}
              hideAgreement={true}
              submitLabel="Save Signature"
              signerName={witnessName}
              onSave={handleWitnessSubmit}
              onCancel={() => setShowWitnessModal(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};
