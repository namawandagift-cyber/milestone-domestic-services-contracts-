import React, { useRef, useState, useEffect } from 'react';

interface SignaturePadProps {
  title?: string;
  submitLabel?: string;
  signerName: string;
  onSave: (signatureDataUrl: string) => void;
  submitting?: boolean;
  compact?: boolean;
  hideAgreement?: boolean;
  onCancel?: () => void;
}

export const SignaturePad: React.FC<SignaturePadProps> = ({
  title = 'Signature',
  submitLabel = 'Sign & Submit',
  signerName,
  onSave,
  submitting = false,
  compact = false,
  hideAgreement = false,
  onCancel,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [agreedToContract, setAgreedToContract] = useState(false);

  // Setup canvas resolution with resize support
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const setupCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.scale(dpr, dpr);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#0a0a0a';
      ctx.lineWidth = 2.5;
    };

    setupCanvas();
    const animId = requestAnimationFrame(setupCanvas);
    window.addEventListener('resize', setupCanvas);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', setupCanvas);
    };
  }, [compact]);

  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    if ('touches' in e) {
      const touch = e.touches[0];
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };
    } else {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    setHasSignature(false);
  };

  const handleSubmit = () => {
    const requiresAgreement = !hideAgreement && !compact;
    if (!hasSignature || (requiresAgreement && !agreedToContract) || submitting) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL('image/png');
    onSave(dataUrl);
  };

  if (compact) {
    return (
      <div className="w-full">
        {/* Compact Signature Canvas Box */}
        <div className="relative border-2 border-[#235c27] bg-white">
          <canvas
            ref={canvasRef}
            className="w-full h-36 sm:h-40 cursor-crosshair touch-none block bg-white"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />

          {/* Clear Button */}
          <div className="absolute top-2 right-2">
            <button
              type="button"
              onClick={clearCanvas}
              className="text-[11px] font-semibold px-2 py-0.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 border border-neutral-300 cursor-pointer shadow-xs"
            >
              Clear
            </button>
          </div>

          {/* Signature Line Label */}
          {signerName && (
            <div className="absolute bottom-1.5 left-3 text-[10px] text-neutral-400 font-sans pointer-events-none">
              Sign here: {signerName}
            </div>
          )}
        </div>

        {/* Compact Action Buttons */}
        <div className="flex items-center justify-end gap-2 mt-3">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-3.5 py-1.5 text-xs font-semibold border border-neutral-300 text-neutral-700 hover:bg-neutral-50 cursor-pointer"
            >
              Cancel
            </button>
          )}
          <button
            type="button"
            disabled={!hasSignature || submitting}
            onClick={handleSubmit}
            className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors ${
              hasSignature && !submitting
                ? 'bg-[#52247f] text-white hover:bg-[#421d66] cursor-pointer shadow-sm'
                : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
            }`}
          >
            {submitting ? 'Saving...' : submitLabel}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto my-8">
      {/* Clean Heading - No Card */}
      <h3 className="text-xl font-bold text-[#235c27] font-serif mb-1">
        {title}
      </h3>
      <p className="text-sm text-neutral-600 mb-4">
        Please sign below using your finger.
      </p>

      {/* Large Signature Canvas with minimal brand green border */}
      <div className="relative border-2 border-[#235c27] bg-white">
        <canvas
          ref={canvasRef}
          className="w-full h-52 sm:h-60 cursor-crosshair touch-none block bg-white"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />

        {/* Clear Button */}
        <div className="absolute top-2 right-2">
          <button
            type="button"
            onClick={clearCanvas}
            className="text-xs font-semibold px-2.5 py-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 border border-neutral-300 cursor-pointer"
          >
            Clear
          </button>
        </div>

        {/* Signature Line Label */}
        <div className="absolute bottom-2 left-4 text-xs text-neutral-400 font-sans pointer-events-none">
          Sign here: {signerName}
        </div>
      </div>

      {/* Checkbox agreement */}
      <div className="my-4">
        <label className="flex items-center gap-2.5 cursor-pointer text-sm font-medium text-neutral-900">
          <input
            type="checkbox"
            checked={agreedToContract}
            onChange={(e) => setAgreedToContract(e.target.checked)}
            className="h-4 w-4 border-neutral-400 accent-[#235c27] cursor-pointer"
          />
          <span>I have read and agree to this contract.</span>
        </label>
      </div>

      {/* Sign & Submit */}
      <div className="mt-4">
        <button
          type="button"
          disabled={!hasSignature || !agreedToContract || submitting}
          onClick={handleSubmit}
          className={`w-full sm:w-auto px-8 py-3 text-xs font-bold uppercase tracking-wider transition-colors ${
            hasSignature && agreedToContract && !submitting
              ? 'bg-[#52247f] text-white hover:bg-[#421d66] cursor-pointer shadow-sm'
              : 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
          }`}
        >
          {submitting ? 'Submitting...' : submitLabel}
        </button>
      </div>

      {(!hasSignature || !agreedToContract) && (
        <p className="text-xs text-neutral-500 mt-2">
          {!hasSignature
            ? 'Finger signature is required above.'
            : 'Please check the agreement box to proceed.'}
        </p>
      )}
    </div>
  );
};
