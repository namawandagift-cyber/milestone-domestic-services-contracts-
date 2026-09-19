import React, { useState } from 'react';

import {
  ContractDetails,
  SignerRole,
  SignatureRecord,
} from '../types';

import { ContractDocument } from './ContractDocument';
import { SignaturePad } from './SignaturePad';

import {
  submitEmployerSignature,
  submitWorkerSignature,
} from '../services/storage';

import { MilestoneLogo } from './MilestoneLogo';

interface ClientSigningPageProps {
  contract: ContractDetails;
  role: SignerRole;
  onSignatureComplete: (
    updated: ContractDetails
  ) => void;
}

export const ClientSigningPage: React.FC<
  ClientSigningPageProps
> = ({
  contract,
  role,
  onSignatureComplete,
}) => {
  const [submitting, setSubmitting] =
    useState(false);

  const [justSubmitted, setJustSubmitted] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState('');

  const [currentContract, setCurrentContract] =
    useState<ContractDetails>(contract);

  const isEmployer = role === 'employer';

  const signerName = isEmployer
    ? currentContract.employerName
    : currentContract.workerName;

  const alreadySigned = isEmployer
    ? Boolean(currentContract.employerSignature)
    : Boolean(currentContract.workerSignature);

  const waitingOnEmployerFirst =
    !isEmployer &&
    !currentContract.employerSignature;

  /**
   * ============================================================
   * SAVE SIGNATURE
   * ============================================================
   */

  const handleSaveSignature = async (
    signatureDataUrl: string
  ) => {
    if (submitting) return;

    setSubmitting(true);
    setErrorMessage('');

    try {
      const now = new Date().toISOString();

      const signatureRecord: SignatureRecord = {
        signatureDataUrl,
        signedByName: signerName,
        signedAt: now,
      };

      let updated: ContractDetails | null = null;

      if (isEmployer) {
        updated =
          await submitEmployerSignature(
            currentContract.id,
            signatureRecord
          );
      } else {
        updated =
          await submitWorkerSignature(
            currentContract.id,
            signatureRecord
          );
      }

      if (!updated) {
        throw new Error(
          'The signature could not be saved. Please try again.'
        );
      }

      /*
       * The storage functions refresh the contract
       * from Google Sheets after saving.
       *
       * Therefore "updated" is the latest database
       * version, not only the local React version.
       */
      setCurrentContract(updated);

      setJustSubmitted(true);

      /*
       * Send the database-backed contract back to App.tsx.
       */
      onSignatureComplete(updated);
    } catch (error) {
      console.error(
        'Failed to complete signature:',
        error
      );

      setErrorMessage(
        'We could not save your signature. Please check your connection and try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * ============================================================
   * PAGE
   * ============================================================
   */

  return (
    <div className="min-h-screen bg-neutral-100 py-6 sm:py-10 px-3 sm:px-6 font-sans">

      {/* Top Helper */}
      <div className="max-w-3xl mx-auto mb-4 flex items-center justify-between no-print text-xs text-neutral-600">
        <span className="font-medium text-neutral-700">
          Milestone Domestic Services • Digital Signing
        </span>

        <button
          type="button"
          onClick={() => window.close()}
          className="text-neutral-500 hover:text-neutral-900 underline cursor-pointer"
        >
          Close Window
        </button>
      </div>

      {/* Official Header */}
      <div className="max-w-3xl mx-auto mb-6 text-center">

        <div className="flex justify-center mb-3">
          <MilestoneLogo
            size="md"
            showTagline={true}
          />
        </div>

        <div className="h-[2.5px] bg-[#235c27] max-w-sm mx-auto mb-3" />

        <h2 className="text-base sm:text-lg font-bold uppercase tracking-wider text-[#52247f] font-serif">
          Employment Contract
        </h2>

        <p className="text-sm font-medium text-neutral-900 mt-1">
          For:{' '}
          <span className="font-bold underline underline-offset-2">
            {currentContract.workerName}
          </span>
        </p>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="max-w-3xl mx-auto mb-6">
          <div className="p-4 bg-red-50 border border-red-300 text-red-800 text-sm">
            <p className="font-bold mb-1">
              Signature could not be saved
            </p>

            <p>{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Success Message */}
      {justSubmitted && (
        <div className="max-w-3xl mx-auto mb-6 p-5 bg-emerald-50 border border-emerald-400 text-emerald-950 text-sm text-center">

          <p className="font-bold text-base text-[#235c27]">
            Contract signed successfully.
          </p>

          <p className="text-xs text-emerald-800 mt-1 mb-3">
            Thank you,{' '}
            <strong>{signerName}</strong>.
            Your signature has been officially
            recorded.
          </p>

          <button
            type="button"
            onClick={() => window.close()}
            className="px-4 py-2 bg-[#235c27] hover:bg-[#1b481f] text-white text-xs font-bold uppercase tracking-wider cursor-pointer shadow-sm transition-colors"
          >
            Close Window
          </button>

          <p className="text-[11px] text-neutral-500 mt-2">
            You may now safely close this browser
            window or tab.
          </p>
        </div>
      )}

      {/* Already Signed */}
      {alreadySigned && !justSubmitted && (
        <div className="max-w-3xl mx-auto mb-6 p-4 bg-white border border-[#235c27] text-neutral-800 text-sm flex flex-wrap justify-between items-center gap-3">

          <p>
            You have already signed this contract
            as <strong>{signerName}</strong>.
          </p>

          <div className="flex items-center gap-3">

            <button
              type="button"
              onClick={() => window.print()}
              className="text-xs font-semibold underline text-[#52247f] hover:text-[#421d66] cursor-pointer"
            >
              Print / Save Contract
            </button>

            <button
              type="button"
              onClick={() => window.close()}
              className="text-xs font-semibold px-3 py-1.5 border border-neutral-300 hover:bg-neutral-100 cursor-pointer text-neutral-700"
            >
              Close Window
            </button>

          </div>
        </div>
      )}

      {/* Worker Before Employer */}
      {waitingOnEmployerFirst && (
        <div className="max-w-3xl mx-auto mb-6 p-4 bg-amber-50 border border-amber-300 text-amber-900 text-sm">

          <p className="font-bold">
            Awaiting Employer Signature First
          </p>

          <p className="text-xs mt-1">
            The employer (
            {currentContract.employerName}
            ) has not yet signed. You may review the
            contract below. Once the employer signs,
            your signature section will activate.
          </p>

        </div>
      )}

      {/* Complete Contract */}
      <div className="max-w-3xl mx-auto mb-8 flex justify-center">
        <ContractDocument
          contract={currentContract}
          id="client-signing-doc"
        />
      </div>

      {/* Signature Section */}
      <div className="max-w-3xl mx-auto no-print">

        {!alreadySigned &&
        !waitingOnEmployerFirst &&
        !justSubmitted ? (

          <div className="bg-white border border-neutral-300 p-6 sm:p-8">

            <SignaturePad
              title={
                isEmployer
                  ? 'Section 13: Employer Signature'
                  : 'Section 12: Domestic Worker Signature'
              }
              submitLabel={
                submitting
                  ? 'Saving signature…'
                  : 'Sign & Submit'
              }
              signerName={signerName}
              onSave={handleSaveSignature}
              submitting={submitting}
            />

          </div>

        ) : null}

      </div>

      {/* Footer */}
      <div className="max-w-3xl mx-auto mt-10 text-center text-xs text-neutral-600 border-t border-[#235c27] pt-4 no-print">

        <p className="font-bold text-[#52247f]">
          Milestone Domestic Services Ltd
        </p>

        <p className="text-neutral-700">
          Agenda - Kyaliwajjala Road, Kyaliwajjala -
          Naalya Rd, Kampala, Uganda • 0701 761271
        </p>

      </div>

    </div>
  );
};