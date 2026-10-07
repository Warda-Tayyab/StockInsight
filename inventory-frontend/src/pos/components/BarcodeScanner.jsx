/** @module pos/components/BarcodeScanner
 *
 * USB barcode scanner integration (keyboard wedge mode).
 *
 * How it works:
 * 1. Scanner acts as a keyboard — characters appear in the focused input.
 * 2. Scanner sends Enter after the barcode.
 * 3. We call the backend API to find the product by barcode.
 * 4. Product is added to cart; input is cleared; focus returns for the next scan.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { ScanBarcode, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { lookupProductByBarcode } from '../services/posService';

const BarcodeScanner = ({ onAddToCart, disabled = false }) => {
  const inputRef = useRef(null);
  const [barcode, setBarcode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Keep focus on the scanner input for continuous scanning
  const focusInput = useCallback(() => {
    if (!disabled) {
      inputRef.current?.focus();
    }
  }, [disabled]);

  useEffect(() => {
    focusInput();
  }, [focusInput]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const code = barcode.trim();
    if (!code || loading || disabled) return;

    setLoading(true);
    setError('');

    try {
      const product = await lookupProductByBarcode(code);

      if (product.needsSetup) {
        const msg = `"${product.name}" needs setup before it can be sold`;
        setError(msg);
        toast.error(msg);
        setBarcode('');
        focusInput();
        return;
      }

      if (product.stock <= 0) {
        const msg = `"${product.name}" is out of stock`;
        setError(msg);
        toast.error(msg);
        setBarcode('');
        focusInput();
        return;
      }

      const added = onAddToCart(product);

      if (added === false) {
        const msg = `Cannot add more "${product.name}" — stock limit reached`;
        setError(msg);
        toast.error(msg);
      } else {
        toast.success(`Added: ${product.name}`);
        setError('');
      }

      setBarcode('');
    } catch (err) {
      const isNotFound = err.response?.status === 404;
      const msg = isNotFound
        ? `No product found for barcode: ${code}`
        : err.response?.data?.message || 'Failed to look up product. Please try again.';

      setError(msg);
      toast.error(msg);
      setBarcode('');
    } finally {
      setLoading(false);
      focusInput();
    }
  };

  return (
    <div
      data-testid="barcode-scanner"
      className="mb-4 card-padded !p-4"
    >
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-2">
        <ScanBarcode className="w-5 h-5 text-indigo-600 shrink-0" aria-hidden />
        <h2 className="text-sm font-semibold text-slate-900 m-0">Barcode Scanner</h2>
        <span className="text-xs text-slate-500 w-full sm:w-auto">Scan or type barcode, then Enter</span>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          placeholder="Scan barcode here..."
          value={barcode}
          onChange={(e) => {
            setBarcode(e.target.value);
            if (error) setError('');
          }}
          disabled={loading || disabled}
          className="input-field flex-1 font-mono disabled:bg-slate-50 disabled:cursor-not-allowed"
          aria-label="Barcode scanner input"
        />
        <button
          type="submit"
          disabled={loading || disabled || !barcode.trim()}
          className="btn-primary disabled:!bg-slate-300 flex items-center justify-center gap-2 w-full sm:w-auto shrink-0"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Looking up...</span>
            </>
          ) : (
            'Add'
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

export default BarcodeScanner;
