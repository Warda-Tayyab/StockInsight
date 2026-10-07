/** @module pos/components/ProductGrid */

import { Plus } from 'lucide-react';

const StockBadge = ({ stock, reorderLevel, needsSetup }) => {
  if (needsSetup) {
    return (
      <span className="px-2 py-0.5 text-xs font-semibold bg-purple-100 text-purple-700 rounded-full">
        Setup
      </span>
    );
  }

  if (stock <= 0) {
    return (
      <span className="px-2 py-0.5 text-xs font-semibold bg-red-100 text-red-700 rounded-full">
        Out
      </span>
    );
  }

  if (stock <= reorderLevel) {
    return (
      <span className="px-2 py-0.5 text-xs font-semibold bg-amber-100 text-amber-700 rounded-full">
        Low
      </span>
    );
  }

  return (
    <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-100 text-emerald-700 rounded-full">
      In
    </span>
  );
};

const ProductGrid = ({ products, searchTerm, onAddToCart }) => {
  const q = searchTerm.trim().toLowerCase();

  const filtered = products.filter((p) => {
    if (!q) return true;
    return (
      (p.name || '').toLowerCase().includes(q) ||
      (p.sku || '').toLowerCase().includes(q) ||
      (p.barcode || '').toLowerCase().includes(q) ||
      (p.category || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="grid grid-cols-1 min-[400px]:grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
      {filtered.map((product) => {
        const stock = Number.isFinite(Number(product.stock)) ? Number(product.stock) : 0;
        const reorderLevel = Number.isFinite(Number(product.reorderLevel)) ? Number(product.reorderLevel) : 0;
        const needsSetup = Boolean(product.needsSetup);
        const canAdd = !needsSetup && stock > 0;

        return (
          <div
          
            key={product.id}
            className="relative card-padded !p-3 sm:!p-4 hover:shadow-card-hover transition-all duration-300 flex flex-col"
          >
            {/* Image */}
            <div className="flex items-center justify-center h-20 sm:h-28">
              {product.image ? (
                <img src={product.image} alt={product.name} className="max-h-20 sm:max-h-24 object-contain" />
              ) : (
                <div className="w-full h-20 sm:h-24 bg-slate-50 border border-slate-100 rounded-md flex items-center justify-center text-slate-300">No image</div>
              )}
            </div>
            <div className="absolute top-2 right-2">
  <StockBadge 
    stock={stock} 
    reorderLevel={reorderLevel}
    needsSetup={needsSetup}
  />
</div>
           
             
          

            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs text-slate-500 m-0 truncate">{product.category || 'General'}</p>
                <h3 className="font-semibold text-slate-900 text-sm leading-5 line-clamp-2 mt-1">
                  {product.name}
                </h3>
              </div>
              
            </div>

            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-lg font-bold text-indigo-600 leading-5">Rs.{Number(product.price || 0).toFixed(2)}</p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Stock: <span className="font-semibold text-slate-700">{stock}</span>
                </p>
              </div>
              <button
                type="button"
                
                onClick={() => onAddToCart(product)}
                disabled={!canAdd}
               
                className="w-full sm:w-auto shrink-0 inline-flex items-center justify-center gap-2 btn-primary !py-2 !px-3 !text-sm disabled:!bg-slate-300 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" />
                {needsSetup ? 'Setup' : 'Add'}
              </button>
            </div>

            {needsSetup && (
              <p className="text-[11px] text-purple-600 mt-2 m-0">
                Complete product setup before selling
              </p>
            )}

            <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-1 gap-1 text-[11px] text-slate-500">
              <div className="flex justify-between gap-2">
                <span className="truncate">SKU</span>
                <span className="font-mono text-slate-700 truncate">{product.sku || '—'}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="truncate">Barcode</span>
                <span className="font-mono text-slate-700 truncate">{product.barcode || product.sku || '—'}</span>
              </div>
            </div>
          </div>
        );
      })}

      {filtered.length === 0 && (
        <div className="col-span-full text-center py-12 text-slate-500 text-sm">
          No products match your search.
        </div>
      )}
    </div>
  );
};

export default ProductGrid;