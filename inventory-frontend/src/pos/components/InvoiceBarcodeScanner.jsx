/** @module pos/components/InvoiceBarcodeScanner
 *
 * USB barcode scanner (keyboard wedge) for receipt invoice lookup on Returns & Exchanges.
 * Scans the barcode printed on the sales receipt (encodes invoice ID) and loads the sale.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { ScanBarcode, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

const InvoiceBarcodeScanner = ({ onInvoiceScanned, disabled = false, loading = false }) => {
  const inputRef = useRef(null);
  const [code, setCode] = useState('');
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');

  const focusInput = useCallback(() => {
    if (!disabled && !loading) {
      inputRef.current?.focus();
    }
  }, [disabled, loading]);

  useEffect(() => {
    focusInput();
  }, [focusInput]);
  useEffect(() => {

    if (!code) return;

    const timer = setTimeout(() => {

        onInvoiceScanned(code.trim());

        setCode("");

    }, 80);

    return () => clearTimeout(timer);

}, [code]);
  const handleSubmit = async (e) => {
    e.preventDefault();

    const invoiceId = code.trim();
    if (!invoiceId || scanning || disabled || loading) return;

    setScanning(true);
    setError('');

    try {
      await onInvoiceScanned(invoiceId);
      setCode('');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Sale not found for this barcode';
      setError(msg);
      toast.error(msg);
      setCode('');
    } finally {
      setScanning(false);
      focusInput();
    }
  };

  const isBusy = scanning || loading;

  return (
    <div data-testid="invoice-barcode-scanner" className="space-y-3">
  
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
      <div className="relative flex-1">
  <ScanBarcode
    className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none"
  />


        <input
          ref={inputRef}
          type="text"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          placeholder="Scan receipt barcode here..."
          value={code}
          onChange={(e) => {
            setCode(e.target.value);
            if (error) setError('');
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
                handleSubmit(e);
            }
        }}
          disabled={isBusy || disabled}
          className="input-field h-11 pl-11 font-mono disabled:bg-slate-50"
          aria-label="Receipt barcode scanner input"
        />
        </div>
      <button
  type="submit"
  disabled={isBusy || disabled || !code.trim()}
  className="btn-primary w-full sm:w-[135px] h-11 shrink-0 flex items-center justify-center gap-2
             disabled:opacity-100
             disabled:!bg-indigo-600
             disabled:!text-white
             disabled:cursor-not-allowed"
>
  {isBusy ? (
    <>
      <Loader2 className="w-4 h-4 animate-spin" />
      <span>Looking up...</span>
    </>
  ) : (
    "Find Sale"
  )}
</button>
      </form>

      {error && (
        <p className="mt-2 text-sm text-red-600 m-0" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

export default InvoiceBarcodeScanner;
