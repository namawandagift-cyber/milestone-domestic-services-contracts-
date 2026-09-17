import React from 'react';
import { ContractDetails, ContractStatus } from '../types';

interface AdminContractsListProps {
  contracts: ContractDetails[];
  onCreateClick: () => void;
  onPreviewClick: (contract: ContractDetails) => void;
  onEditClick: (contract: ContractDetails) => void;
  onSendClick: (contract: ContractDetails) => void;
  onDeleteClick: (id: string) => void;
  onDownloadClick: (contract: ContractDetails) => void;
  onViewLocationClick?: () => void;
}

export const AdminContractsList: React.FC<AdminContractsListProps> = ({
  contracts,
  onCreateClick,
  onPreviewClick,
  onEditClick,
  onSendClick,
  onDeleteClick,
  onDownloadClick,
  onViewLocationClick,
}) => {
  const getStatusBadge = (status: ContractStatus) => {
    switch (status) {
      case 'Completed':
        return <span className="font-semibold text-[#235c27]">Completed</span>;
      case 'Waiting for Worker':
        return <span className="font-semibold text-[#52247f]">Waiting for Worker</span>;
      case 'Waiting for Employer':
        return <span className="font-semibold text-amber-800">Waiting for Employer</span>;
      case 'Draft':
      default:
        return <span className="text-neutral-600">Draft</span>;
    }
  };

  return (
    <div className="bg-white border border-neutral-300">
      {/* Header bar */}
      <div className="p-4 sm:p-5 border-b border-neutral-300 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold font-serif text-[#52247f]">Contracts</h2>
          <p className="text-xs text-neutral-600 mt-0.5">
            Official employment contracts drafted for digital signing.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {onViewLocationClick && (
            <button
              onClick={onViewLocationClick}
              className="border border-neutral-300 hover:bg-neutral-50 text-neutral-800 px-3 py-2 text-xs font-semibold transition-colors cursor-pointer"
            >
              Office Map & Photos
            </button>
          )}
          <button
            onClick={onCreateClick}
            className="bg-[#52247f] hover:bg-[#421d66] text-white px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer shadow-sm"
          >
            Create Contract
          </button>
        </div>
      </div>

      {/* Contract Table */}
      {contracts.length === 0 ? (
        <div className="p-12 text-center text-sm">
          <p className="text-neutral-800 font-medium">No contracts created yet.</p>
          <p className="text-neutral-500 text-xs mt-1">
            Click "Create Contract" to generate an official employment contract.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-neutral-100 border-b border-neutral-300 text-xs font-bold uppercase tracking-wider text-neutral-700">
                <th className="py-3 px-4 font-semibold">Contract</th>
                <th className="py-3 px-4 font-semibold">Employer</th>
                <th className="py-3 px-4 font-semibold">Worker</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {contracts.map((contract) => (
                <tr
                  key={contract.id}
                  className="hover:bg-neutral-50 cursor-pointer"
                  onClick={() => onPreviewClick(contract)}
                >
                  <td className="py-3.5 px-4 font-mono font-bold text-neutral-900 whitespace-nowrap">
                    {contract.contractNumber}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-neutral-900">{contract.employerName}</div>
                    <div className="text-xs text-neutral-500">{contract.employerPhone}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-neutral-900">{contract.workerName}</div>
                    <div className="text-xs text-neutral-500">{contract.jobTitle}</div>
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap text-xs">
                    {getStatusBadge(contract.status)}
                  </td>
                  <td
                    className="py-3.5 px-4 text-right whitespace-nowrap"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="inline-flex items-center gap-2 justify-end text-xs">
                      <button
                        onClick={() => onPreviewClick(contract)}
                        className="font-bold text-[#52247f] hover:underline cursor-pointer"
                      >
                        View
                      </button>
                      <span className="text-neutral-300">|</span>
                      <button
                        onClick={() => onEditClick(contract)}
                        className="font-semibold text-neutral-700 hover:underline cursor-pointer"
                      >
                        Edit
                      </button>
                      <span className="text-neutral-300">|</span>
                      <button
                        onClick={() => onSendClick(contract)}
                        className="font-bold text-[#235c27] hover:underline cursor-pointer"
                      >
                        Signing Link
                      </button>
                      <span className="text-neutral-300">|</span>
                      <button
                        onClick={() => onDownloadClick(contract)}
                        className="font-semibold text-[#52247f] hover:underline cursor-pointer"
                      >
                        Download
                      </button>
                      <span className="text-neutral-300">|</span>
                      <button
                        onClick={() => onDeleteClick(contract.id)}
                        className="text-neutral-400 hover:text-red-700 cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
