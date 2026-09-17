import React, { useState } from 'react';
import { MilestoneLogo } from './MilestoneLogo';
import { Lock, XCircle } from 'lucide-react';

interface ExpiredLinkViewProps {
  reason?: string;
}

export const ExpiredLinkView: React.FC<ExpiredLinkViewProps> = ({
  reason = 'This digital signing link has expired or has already been completed.',
}) => {
  const [closedNotice, setClosedNotice] = useState(false);

  const handleClose = () => {
    window.close();
    setClosedNotice(true);
  };

  return (
    <div className="min-h-screen bg-neutral-100 flex items-center justify-center p-4 font-sans select-none">
      <div className="bg-white border border-neutral-300 p-8 sm:p-10 max-w-md w-full text-center shadow-sm">
        {/* Milestone Official Header */}
        <div className="flex justify-center mb-4">
          <MilestoneLogo size="sm" showTagline={false} />
        </div>
        <div className="h-[2px] bg-[#235c27] max-w-[120px] mx-auto mb-6"></div>

        <div className="w-12 h-12 rounded-full bg-neutral-100 text-neutral-500 mx-auto mb-4 flex items-center justify-center">
          <Lock className="w-6 h-6 text-neutral-700" />
        </div>

        <h2 className="text-lg font-bold font-serif text-[#52247f] mb-2">
          Signing Link Closed
        </h2>

        <p className="text-xs text-neutral-600 leading-relaxed mb-6">
          {reason} For security and privacy reasons, access to this document is closed.
        </p>

        <div className="space-y-3">
          <button
            type="button"
            onClick={handleClose}
            className="w-full py-2.5 px-4 bg-[#52247f] hover:bg-[#421d66] text-white text-xs font-bold uppercase tracking-wider cursor-pointer shadow-sm transition-colors inline-flex items-center justify-center gap-2"
          >
            <XCircle className="w-4 h-4" />
            <span>Close Window</span>
          </button>

          {closedNotice && (
            <p className="text-xs text-neutral-500 font-medium animate-fade-in">
              You may now safely close this browser window or tab.
            </p>
          )}
        </div>

        <div className="mt-8 pt-5 border-t border-neutral-200 text-xs text-neutral-500">
          <p className="font-semibold text-neutral-700">Milestone Domestic Services Ltd</p>
          <p className="mt-0.5">Agenda, Kyaliwajjala - Naalya Rd, Kampala</p>
          <p className="mt-1">
            Need assistance? Tel:{' '}
            <a href="tel:0701761271" className="font-bold text-[#52247f] hover:underline">
              0701 761271
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};
