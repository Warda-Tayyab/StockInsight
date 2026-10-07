/** @module inventory/inventory-management/pages/Products */

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { FaEdit, FaToggleOn, FaToggleOff, FaEye } from "react-icons/fa";
import { HiOutlinePlus, HiOutlineSearch, HiOutlineFilter } from "react-icons/hi";
import { Toaster, toast } from 'react-hot-toast'
import { useNavigate } from "react-router-dom";
import api from "../../../shared/utils/api";
const Products = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);

const [filters, setFilters] = useState({
  category: "",
  status: "",
  setupStatus: "",
  lowStock: false,
  minPrice: "",
  maxPrice: "",
  sortBy: "",
});
const getProductStatusBadge = (status) => {
  if (status === "active") {
    return <span className="badge-success">Active</span>;
  }

  if (status === "inactive") {
    return <span className="badge-neutral">Inactive</span>;
  }

  return null;
};
  const itemsPerPage = 10;
  const token = localStorage.getItem("token");

  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await api.get("/api/categories");
        setCategories(response.data); // assuming response.data is an array of categories
      } catch (error) {
        console.error("Error fetching categories:", error.response?.data || error.message);
      }
    };
  
    fetchCategories();
  }, []);
  // ✅ FETCH PRODUCTS FROM BACKEND
  const fetchProducts = async (overrideFilters = null) => {
    try {
      setLoading(true);
      const activeFilters = overrideFilters || filters;

      let query = "";

      if (searchTerm) {
        query += `search=${searchTerm}&`;
      }

      if (activeFilters.category) {
        query += `categoryId=${activeFilters.category}&`;
      }

      if (activeFilters.status) {
        query += `status=${activeFilters.status}&`;
      }

      if (activeFilters.setupStatus) {
        query += `setupStatus=${activeFilters.setupStatus}&`;
      }

      if (activeFilters.lowStock) {
        query += `lowStock=true&`;
      }

      if (activeFilters.minPrice) {
        query += `minPrice=${activeFilters.minPrice}&`;
      }
      if (activeFilters.sortBy) {
        query += `sortBy=${activeFilters.sortBy}&`;
      }

      if (activeFilters.maxPrice) {
        query += `maxPrice=${activeFilters.maxPrice}&`;
      }

      const response = await api.get(`/api/products?${query}`);
      setProducts(response.data);
    } catch (error) {
      console.error(
        "Error fetching products:",
        error.response?.data || error.message
      );
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchProducts();
  }, [searchTerm]);
  
  // ✅ Pagination Logic
  const totalPages = Math.ceil(products.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProducts = products.slice(
    startIndex,
    startIndex + itemsPerPage
  );
  // ✅ HANDLE TOGGLE PRODUCT
  const handleToggleStatus = async (product) => {
    try {
      const newStatus = product.status === "active" ? "inactive" : "active";
      await api.put(`/api/products/${product._id}`, {
        status: newStatus,
      });
      toast.success(`Product ${newStatus} successfully ✨`);
  
      fetchProducts();
    } catch (error) {
      console.error(error.response?.data || error.message);
    }
  };

  // ✅ HANDLE EDIT — dedicated edit page (not modal)
  const handleEdit = (product) => {
    navigate(`/products/edit/${product._id}`);
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Products</h1>
          <p className="page-subtitle">Manage your product inventory</p>
        </div>

        <Link to="/products/add" className="btn-primary">
          <HiOutlinePlus className="w-4 h-4" />
          Add Product
        </Link>
      </div>

      {products.some((p) => p.setupStatus === 'pending') && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="text-sm text-amber-900">
            <span className="font-semibold">
              {products.filter((p) => p.setupStatus === 'pending').length} product(s)
            </span>{' '}
            need setup after purchase (barcode, category, selling price) before POS.
          </div>
          <button
            type="button"
            className="btn-secondary text-sm shrink-0"
            onClick={() => {
              const next = { ...filters, setupStatus: 'pending' };
              setFilters(next);
              fetchProducts(next);
            }}
          >
            Show pending only
          </button>
        </div>
      )}

      <div className="card-padded">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-slate-700">Search Products</label>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative w-full">
              <HiOutlineSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />

              <input
                type="text"
                placeholder="Search by name or SKU..."
                className="input-field !pl-10"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>

            <button
              onClick={() => setFilterOpen(!filterOpen)}
              className="btn-secondary shrink-0"
            >
              <HiOutlineFilter className="w-4 h-4" />
              Filters
            </button>
          </div>
        </div>

  {/* FILTER PANEL */}
  {filterOpen && (
    <div className="mt-6 border-t pt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* CATEGORY */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-slate-600">
          Category
        </label>
        <select
          className="select-field"
          value={filters.category}
  onChange={(e) => setFilters({ ...filters, category: e.target.value })}
>
  <option value="">All Categories</option>
  {categories.map((cat) => (
    <option key={cat._id} value={cat._id}>{cat.name}</option>
  ))}
</select>
      </div>

      {/* STATUS */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-slate-600">
          Status
        </label>
        <select
          className="select-field"
          value={filters.status}
          onChange={(e) =>
            setFilters({ ...filters, status: e.target.value })
          }
        >
          <option value="">All</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>
     

      {/* SETUP STATUS */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-slate-600">Setup</label>
        <select
          className="select-field"
          value={filters.setupStatus}
          onChange={(e) => setFilters({ ...filters, setupStatus: e.target.value })}
        >
          <option value="">All</option>
          <option value="pending">Needs setup (from purchase)</option>
          <option value="ready">Ready for POS</option>
        </select>
      </div>

      {/* LOW STOCK */}
      <div className="flex items-center gap-2 mt-6">
        <input
          type="checkbox"
          checked={filters.lowStock}
          onChange={(e) =>
            setFilters({ ...filters, lowStock: e.target.checked })
          }
        />
        <label className="text-sm text-slate-700">Low Stock</label>
      </div>

      {/* PRICE RANGE */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-slate-600">
          Min Price
        </label>
        <input
          type="number"
          placeholder="0"
          className="input-field"
          value={filters.minPrice}
          onChange={(e) =>
            setFilters({ ...filters, minPrice: e.target.value })
          }
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-slate-600">
          Max Price
        </label>
        <input
          type="number"
          placeholder="100000"
          className="input-field"
          value={filters.maxPrice}
          onChange={(e) =>
            setFilters({ ...filters, maxPrice: e.target.value })
          }
        />
      </div>
     {/*SORT By*/}
     <div className="flex flex-col gap-1">
  <label className="text-xs font-medium text-slate-600">Sort By</label>
  <select
    className="select-field"
    value={filters.sortBy}
    onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
  >
    <option value="">Default</option>
    <option value="newest">New → Old</option>
    <option value="oldest">Old → New</option>
    <option value="lowToHigh">Price: Low → High</option>
    <option value="highToLow">Price: High → Low</option>
  </select>
</div>
      {/* ACTION BUTTONS */}
      <div className="flex flex-wrap items-end gap-3 md:col-span-3">
      <button
  onClick={() => {
    fetchProducts();
    setFilterOpen(false);
    
  }}
  className="btn-primary flex-1 sm:flex-none"
>
  Apply
</button>

<button
  className="btn-secondary flex-1 sm:flex-none"
  onClick={() => {
    setFilters({
      category: "",
      status: "",
      setupStatus: "",
      lowStock: false,
      minPrice: "",
      maxPrice: "",
      sortBy: "",
    });
    setSearchTerm("");
    fetchProducts();
  }}
>
  Reset
</button>

   

      </div>
    </div>
  )}
</div>

      <div className="table-container overflow-x-auto">
        {loading ? (
          <div className="text-center py-12 text-slate-500 text-sm">
            Loading products...
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>SKU</th>
                <th>Product Name</th>
                <th className="hidden sm:table-cell">Category</th>
                <th>Price</th>
                <th>Status</th>
                <th className="!px-3 sm:!px-4">Actions</th>
              </tr>
            </thead>

            <tbody>
              {paginatedProducts.length > 0 ? (
                paginatedProducts.map((product) => (
                  <tr key={product._id}>
                    <td className="font-semibold text-slate-800">{product.sku}</td>

                    <td>
                      <Link
                        to={`/products/${product._id}`}
                        className="link-primary hover:underline"
                      >
                        {product.name}
                      </Link>
                    </td>

                    <td className="hidden sm:table-cell">{product.categoryId?.name || "-"}</td>

                    <td className="font-medium">
                      Rs.{product.sellingPrice?.toFixed(2)}
                    </td>

                    <td>
                      <div className="flex flex-col gap-1">
                        {getProductStatusBadge(product.status)}
                        {product.setupStatus === 'pending' && (
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 w-fit">
                            Setup pending
                          </span>
                        )}
                      </div>
                    </td>

                    <td>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => navigate(`/products/edit/${product._id}`)}
                          className="btn-icon"
                          title={product.setupStatus === 'pending' ? 'Complete setup' : 'Edit'}
                        >
                          <FaEdit className="w-4 h-4 text-indigo-600" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(product)}
                          className="btn-icon"
                          title="Toggle Status"
                          disabled={product.setupStatus === 'pending'}
                        >
                          {product.status === "active" ? (
                            <FaToggleOn className="w-5 h-5 text-emerald-500" />
                          ) : (
                            <FaToggleOff className="w-5 h-5 text-slate-400" />
                          )}
                        </button>
                        <button
                          onClick={() => navigate(`/products/${product._id}`)}
                          className="btn-icon"
                          title="View"
                        >
                          <FaEye className="w-4 h-4 text-indigo-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center py-12 text-slate-500">
                    No products found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 sm:gap-6 card-padded">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="btn-secondary !py-2 !px-3 text-xs disabled:opacity-50"
          >
            Previous
          </button>

          <span className="text-sm text-slate-600">
            Page {currentPage} of {totalPages}
          </span>

          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="btn-secondary !py-2 !px-3 text-xs disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    
    </div>
  );
};

export default Products;
