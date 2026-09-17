import React from 'react';
import { ContractDetails } from '../types';
import { MilestoneLogo } from './MilestoneLogo';

interface ContractDocumentProps {
  contract: ContractDetails;
  id?: string;
}

export const ContractDocument: React.FC<ContractDocumentProps> = ({
  contract,
  id = 'printable-contract',
}) => {
  const createdDate = new Date(contract.createdAt || Date.now());
  const day = createdDate.getDate();
  const monthName = createdDate.toLocaleString('en-GB', { month: 'long' });
  const year = createdDate.getFullYear();

  // Parse start date for Section 4: DD / MM / YYYY
  const formatCommenceDate = (dateStr?: string) => {
    if (!dateStr) return '___ / ___ / 20__';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        return `${parts[2]} / ${parts[1]} / ${parts[0]}`;
      }
      const d = new Date(dateStr);
      return `${String(d.getDate()).padStart(2, '0')} / ${String(d.getMonth() + 1).padStart(2, '0')} / ${d.getFullYear()}`;
    } catch {
      return dateStr;
    }
  };

  const formatSignatureDate = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      return `${d.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })}`;
    } catch {
      return isoString;
    }
  };

  // Clean salary string if it already contains UGX
  const cleanSalary = (val: string) => {
    if (!val) return '__________________';
    return val.replace(/^UGX\s*/i, '').trim();
  };

  const cleanServiceFee = (val: string) => {
    if (!val) return '____________';
    return val.replace(/^UGX\s*/i, '').trim();
  };

  return (
    <div
      id={id}
      className="a4-document mx-auto p-6 sm:p-10 md:p-14 font-document text-[14px] sm:text-[15px] text-neutral-950 leading-[1.65] bg-white border border-neutral-300 print:border-none print:p-0 print:m-0 break-words"
    >
      {/* Official Company Letterhead matching reference document */}
      <div className="mb-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2">
          {/* Official Company Logo */}
          <div>
            <MilestoneLogo size="md" showTagline={true} />
          </div>

          {/* Company Contact Details */}
          <div className="text-left sm:text-right text-xs font-sans text-neutral-700 leading-snug">
            <p className="font-semibold text-neutral-900">Agenda - Kyaliwajjala Road Agenda</p>
            <p>Kyaliwajjala - Naalya Rd, Kampala, Uganda</p>
            <p className="text-neutral-800 font-medium mt-0.5">
              Tel: 0701 761271 / +256 (0) 701 761 271
            </p>
          </div>
        </div>

        {/* Company Signature Forest Green Line from uploaded brand image */}
        <div className="h-[3.5px] bg-[#235c27] w-full my-2"></div>

        {/* Reference and Record details */}
        <div className="flex justify-between items-center text-xs font-sans text-neutral-700 pt-1 pb-2">
          <div>
            <span className="font-semibold text-neutral-900">Contract Ref: </span>
            <span className="font-mono font-bold text-[#52247f]">{contract.contractNumber}</span>
          </div>
          <div>
            <span className="font-semibold text-neutral-900">Official Record: </span>
            <span>Agenda, Kyaliwajjala - Naalya Rd, Kampala</span>
          </div>
        </div>
      </div>

      {/* Main Document Title */}
      <div className="text-center my-6">
        <h1 className="text-xl sm:text-2xl font-bold uppercase tracking-wide font-serif underline underline-offset-4 text-neutral-950">
          Employment Contract
        </h1>
      </div>

      {/* Opening Agreement and Parties */}
      <div className="mb-6 text-justify">
        <p className="leading-relaxed">
          This Employment Contract is made this{' '}
          <strong className="underline underline-offset-2">{day}</strong> day of{' '}
          <strong className="underline underline-offset-2">{monthName}</strong> 20
          <strong className="underline underline-offset-2">{String(year).slice(-2)}</strong> between:{' '}
          <span className="font-bold">Employer Name: </span>
          <strong className="underline underline-offset-2">
            {contract.employerName || '__________________________________'}
          </strong>{' '}
          <span className="font-bold">Tel: </span>
          <strong className="underline underline-offset-2">
            {contract.employerPhone || '__________________'}
          </strong>{' '}
          <span className="font-bold">Address: </span>
          <strong className="underline underline-offset-2">
            {contract.employerAddress || '__________________'}
          </strong>{' '}
          <span className="font-bold">AND Domestic Worker: </span>
          <strong className="underline underline-offset-2">
            {contract.workerName || '______________________________'}
          </strong>{' '}
          <span className="font-bold">Age: </span>
          <strong className="underline underline-offset-2">
            {contract.workerAge || '______'}
          </strong>{' '}
          <span className="font-bold">NIN: </span>
          <strong className="underline underline-offset-2 font-mono">
            {contract.workerNIN || '__________________'}
          </strong>{' '}
          <span className="font-bold">Tel: </span>
          <strong className="underline underline-offset-2">
            {contract.workerPhone || '__________'}
          </strong>{' '}
          <span className="font-bold">Address: </span>
          <strong className="underline underline-offset-2">
            {contract.workerAddress || '__________________'}
          </strong>{' '}
          For{' '}
          <strong className="underline underline-offset-2">
            {contract.contractPeriod || contract.contractDuration || '______ week(s)/month(s)/year(s)'}
          </strong>.
        </p>
      </div>

      {/* Contract Sections */}
      <div className="space-y-6 text-justify">
        {/* Section 1: Job Title and Duties */}
        <div>
          <h2 className="font-bold text-base uppercase tracking-wide border-b border-neutral-300 pb-1 mb-2 font-serif text-[#235c27]">
            Section 1: Job Title and Duties
          </h2>
          <p className="mb-2">
            The Domestic Worker is employed as a{' '}
            <strong className="underline underline-offset-2">
              {contract.jobTitle || '____________________________'}
            </strong>{' '}
            to perform the following duties:
          </p>
          <div className="pl-4 italic text-neutral-950 whitespace-pre-line border-l-2 border-[#235c27] py-1">
            {contract.duties || 'Cooking, cleaning, laundry, ironing, and household management.'}
          </div>
        </div>

        {/* Section 2: Service Fees */}
        <div>
          <h2 className="font-bold text-base uppercase tracking-wide border-b border-neutral-300 pb-1 mb-2 font-serif text-[#235c27]">
            Section 2: Service Fees
          </h2>
          <p className="mb-1.5">
            The Employer shall pay Milestone Domestic Services Ltd a nonrefundable service fee of UGX{' '}
            <strong className="underline underline-offset-2">
              {cleanServiceFee(contract.serviceFee)}
            </strong>{' '}
            for recruitment, vetting, and placement of the Worker.
          </p>
          <p className="mb-1.5">
            This fee is payable once at the time of signing the contract.
          </p>
          <p>
            Any additional services (training, retraining, advanced health checks, background checks, or replacement after one month) will attract separate charges as agreed.
          </p>
        </div>

        {/* Section 3: Probation Period */}
        <div>
          <h2 className="font-bold text-base uppercase tracking-wide border-b border-neutral-300 pb-1 mb-2 font-serif text-[#235c27]">
            Section 3: Probation Period
          </h2>
          <p className="mb-1.5">
            The first one (1) month of employment shall be considered probation.
          </p>
          <p className="mb-1.5">
            During probation, either party may terminate the contract with at least five (5) days’ notice and notify the Agency.
          </p>
          <p className="mb-1.5">
            The Worker will be paid for time worked.
          </p>
          <p>
            Milestone Domestic Services Ltd guarantees a onetime replacement within the probation month at no extra cost if the Worker fails to perform as expected or decides to leave.
          </p>
        </div>

        {/* Section 4: Duration of Contract */}
        <div>
          <h2 className="font-bold text-base uppercase tracking-wide border-b border-neutral-300 pb-1 mb-2 font-serif text-[#235c27]">
            Section 4: Duration of Contract
          </h2>
          <p>
            This contract shall commence on{' '}
            <strong className="underline underline-offset-2">
              {formatCommenceDate(contract.startDate)}
            </strong>{' '}
            and remain valid for a period of{' '}
            <strong className="underline underline-offset-2">
              {contract.contractDuration || contract.contractPeriod || '______ months/years'}
            </strong>
            , subject to renewal by agreement of the parties.
          </p>
        </div>

        {/* Section 5: Wages and Benefits */}
        <div>
          <h2 className="font-bold text-base uppercase tracking-wide border-b border-neutral-300 pb-1 mb-2 font-serif text-[#235c27]">
            Section 5: Wages and Benefits
          </h2>
          <p>
            Monthly salary: UGX{' '}
            <strong className="underline underline-offset-2">
              {cleanSalary(contract.salary)}
            </strong>.
          </p>
        </div>

        {/* Section 6: Terms of Payment */}
        <div>
          <h2 className="font-bold text-base uppercase tracking-wide border-b border-neutral-300 pb-1 mb-2 font-serif text-[#235c27]">
            Section 6: Terms of Payment
          </h2>
          <ol className="list-decimal pl-6 space-y-1.5">
            <li>A deduction of UGX 50,000 per month will be applied for the first two (2) months.</li>
            <li>The deducted amount will be withheld and paid in full after the Worker has successfully completed three (3) months of continuous service.</li>
            <li>If the Worker leaves before completing three (3) months, the withheld amount shall not be payable.</li>
            <li>This arrangement is intended to encourage stability and commitment.</li>
          </ol>
        </div>

        {/* Section 7: Notice & Dues */}
        <div>
          <h2 className="font-bold text-base uppercase tracking-wide border-b border-neutral-300 pb-1 mb-2 font-serif text-[#235c27]">
            Section 7: Notice & Dues
          </h2>
          <ol className="list-decimal pl-6 space-y-1.5">
            <li>The Worker shall give a notice of not less than five (5) days to both the Employer and the Agency before leaving employment.</li>
            <li>Upon such notice, the Employer shall prepare to pay all wages for the worked period, including any withheld amounts due.</li>
            <li>If the Employer chooses not to accept the notice and terminates the Worker immediately, the Employer must pay all outstanding salary and withheld payments in full.</li>
            <li>Failure to comply with this clause shall be considered a breach of agreement.</li>
          </ol>
        </div>

        {/* Section 8: Obligations of Worker and Employer */}
        <div>
          <h2 className="font-bold text-base uppercase tracking-wide border-b border-neutral-300 pb-1 mb-2 font-serif text-[#235c27]">
            Section 8: Obligations of Worker and Employer
          </h2>
          <div className="mb-3">
            <p className="font-bold mb-1.5">The Worker shall:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Perform duties faithfully, responsibly, and as agreed.</li>
              <li>Maintain confidentiality and respect the Employer’s household privacy and property.</li>
              <li>Take leave/rest days in consultation with the Employer, considering the Employer’s interests.</li>
            </ul>
          </div>
          <div>
            <p className="font-bold mb-1.5">The Employer shall:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Provide a fair working environment, timely payment, and respect for the Worker’s rights.</li>
              <li>Supply all necessary tools and materials for assigned tasks.</li>
              <li>Ensure the Worker’s safety and protection while on the premises.</li>
              <li>Provide meals and suitable accommodation.</li>
              <li>Any extra benefits are considered gifts, not part of salary.</li>
              <li>Sick leave and treatment arrangements must be discussed between Employer and Worker, with the Agency informed.</li>
            </ul>
          </div>
        </div>

        {/* Section 9: Termination, Dismissal & Resignation */}
        <div>
          <h2 className="font-bold text-base uppercase tracking-wide border-b border-neutral-300 pb-1 mb-2 font-serif text-[#235c27]">
            Section 9: Termination, Dismissal & Resignation
          </h2>
          <p className="mb-2">
            Immediate termination or resignation (no notice) is allowed if there is serious misconduct such as theft, fraud, absconding, drug abuse, drunkenness, sexual/physical/emotional abuse, denial of food, failure to pay wages, or gross negligence.
          </p>
          <ul className="list-disc pl-6 space-y-1.5 mb-3">
            <li>
              <strong>If the Worker is at fault:</strong> The Employer/Household member may end the contract immediately, no pending wages are paid, and misconduct must be reported to Police with Agency support.
            </li>
            <li>
              <strong>If the Employer/Household member is at fault:</strong> The Worker may leave immediately, wages for time worked must be paid, and misconduct may be reported to Police with Agency informed.
            </li>
          </ul>
          <p className="font-bold mb-1">Termination without misconduct:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Employer/Household member must give at least five (5) days’ notice to the Agency.</li>
            <li>Worker must give at least five (5) days’ notice to the Employer/Household member.</li>
            <li>If the Worker leaves without notice, he/she must compensate the Employer/Household member with money equal to the notice period, and pending wages will be paid within two weeks.</li>
          </ul>
        </div>

        {/* Section 10: Misconduct & Liability */}
        <div>
          <h2 className="font-bold text-base uppercase tracking-wide border-b border-neutral-300 pb-1 mb-2 font-serif text-[#235c27]">
            Section 10: Misconduct & Liability
          </h2>
          <p>
            The Agency shall cooperate fully with both the Employer/Household member and the Worker by providing all necessary documentation and Worker details to support reports, investigations, or dispute resolution, but it does not pay or cover losses and is not financially liable for any costs arising from misconduct, dismissal, or resignation.
          </p>
        </div>

        {/* Section 11: Dispute Resolution */}
        <div>
          <h2 className="font-bold text-base uppercase tracking-wide border-b border-neutral-300 pb-1 mb-2 font-serif text-[#235c27]">
            Section 11: Dispute Resolution
          </h2>
          <ol className="list-decimal pl-6 space-y-1.5">
            <li>Disputes shall first be resolved through discussion between Employer and Worker.</li>
            <li>If unresolved, the matter shall be referred to the Agency for mediation.</li>
            <li>Criminal offences shall be reported directly to the Police, with the Agency informed.</li>
          </ol>
        </div>

        {/* Section 12: Employee Declaration */}
        <div className="pt-2">
          <h2 className="font-bold text-base uppercase tracking-wide border-b border-neutral-300 pb-1 mb-2 font-serif text-[#235c27]">
            Section 12: Employee Declaration
          </h2>
          <p className="mb-4 leading-relaxed">
            I, <strong className="underline underline-offset-2">{contract.workerName || '______________________________________'}</strong>, a resident of{' '}
            <strong className="underline underline-offset-2">{contract.workerAddress || '____________________________'}</strong>, aged{' '}
            <strong className="underline underline-offset-2">{contract.workerAge || '______'}</strong> years, of sound mind, have read and agreed to work for Mr./Mrs.{' '}
            <strong className="underline underline-offset-2">{contract.employerName || '______________________________________'}</strong> through Milestone Domestic Services Ltd as a domestic worker in his/her home, performing the agreed duties at the agreed salary plan. I confirm that I have fully understood the terms and conditions of my employment, including my role, responsibilities, payment, notice, misconduct, and dispute resolution clauses. I hereby accept these terms and agree to abide by them.
          </p>

          <div className="pt-2 max-w-md">
            <p className="font-bold mb-1">
              Domestic Worker:{' '}
              <span className="font-normal underline underline-offset-2">
                {contract.workerName || '___________________________'}
              </span>
            </p>
            <div className="flex items-center gap-3 my-2">
              <span className="font-bold">Signature:</span>
              <div className="border-b border-neutral-900 flex-1 min-h-[40px] flex items-center">
                {contract.workerSignature?.signatureDataUrl ? (
                  <img
                    src={contract.workerSignature.signatureDataUrl}
                    alt="Worker Signature"
                    className="max-h-12 max-w-[200px] object-contain"
                  />
                ) : (
                  <span className="text-neutral-400 text-xs italic">__________</span>
                )}
              </div>
            </div>
            <p className="font-bold">
              Date:{' '}
              <span className="font-normal underline underline-offset-2">
                {contract.workerSignature?.signedAt
                  ? formatSignatureDate(contract.workerSignature.signedAt)
                  : '_____________'}
              </span>
            </p>
          </div>
        </div>

        {/* Section 13: Employer Declaration */}
        <div className="pt-2">
          <h2 className="font-bold text-base uppercase tracking-wide border-b border-neutral-300 pb-1 mb-2 font-serif text-[#235c27]">
            Section 13: Employer Declaration
          </h2>
          <p className="mb-4 leading-relaxed">
            The abovementioned worker will be my full responsibility and under my care in my home from the date of placement till the day of termination of either party.
          </p>

          <div className="pt-2 max-w-md">
            <p className="font-bold mb-1">
              Employer Name:{' '}
              <span className="font-normal underline underline-offset-2">
                {contract.employerName || '________________________'}
              </span>
            </p>
            <div className="flex items-center gap-3 my-2">
              <span className="font-bold">Signature:</span>
              <div className="border-b border-neutral-900 flex-1 min-h-[40px] flex items-center">
                {contract.employerSignature?.signatureDataUrl ? (
                  <img
                    src={contract.employerSignature.signatureDataUrl}
                    alt="Employer Signature"
                    className="max-h-12 max-w-[200px] object-contain"
                  />
                ) : (
                  <span className="text-neutral-400 text-xs italic">_________</span>
                )}
              </div>
            </div>
            <p className="font-bold">
              Date:{' '}
              <span className="font-normal underline underline-offset-2">
                {contract.employerSignature?.signedAt
                  ? formatSignatureDate(contract.employerSignature.signedAt)
                  : '_________________'}
              </span>
            </p>
          </div>
        </div>

        {/* Witness (Milestone Domestic Services Ltd) */}
        <div className="pt-4 border-t-2 border-[#235c27]">
          <h2 className="font-bold text-base uppercase tracking-wide mb-3 font-serif text-[#52247f]">
            Witness (Milestone Domestic Services Ltd)
          </h2>

          <div className="pt-1 max-w-md">
            <p className="font-bold mb-1">
              Name:{' '}
              <span className="font-normal underline underline-offset-2">
                {contract.witnessSignature?.representativeName || '___________________________'}
              </span>
            </p>
            <div className="flex items-center gap-3 my-2">
              <span className="font-bold">Signature:</span>
              <div className="border-b border-neutral-900 flex-1 min-h-[40px] flex items-center">
                {contract.witnessSignature?.signatureDataUrl ? (
                  <img
                    src={contract.witnessSignature.signatureDataUrl}
                    alt="Milestone Witness Signature"
                    className="max-h-12 max-w-[200px] object-contain"
                  />
                ) : (
                  <span className="text-neutral-400 text-xs italic">_______________________</span>
                )}
              </div>
            </div>
            <p className="font-bold">
              Date:{' '}
              <span className="font-normal underline underline-offset-2">
                {contract.witnessSignature?.signedAt
                  ? formatSignatureDate(contract.witnessSignature.signedAt)
                  : '_____________'}
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
