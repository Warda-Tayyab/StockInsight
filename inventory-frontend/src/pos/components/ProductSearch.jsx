/** @module pos/components/ProductSearch */

import { HiOutlineSearch } from 'react-icons/hi';

const ProductSearch = ({ value, onChange, placeholder = 'Search products by name or SKU...' }) => {
  return (
    <div className="relative">
      <HiOutlineSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input-field pl-10"
        aria-label="Search products"
      />
    </div>
  );
};

export default ProductSearch;
