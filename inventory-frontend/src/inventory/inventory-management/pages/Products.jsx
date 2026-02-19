/** @module inventory/inventory-management/pages/Products */

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { FaEdit, FaTrash } from "react-icons/fa"; // React Icons
import InventoryForm from "../components/InventoryForm";

const Products = () => {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [filterOpen, setFilterOpen] = useState(false);

const [filters, setFilters] = useState({
  category: "",
  status: "",
  lowStock: false,
  minPrice: "",
  maxPrice: "",
  sortBy: "",
});

  const itemsPerPage = 10;
  const token = localStorage.getItem("token");

  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get("http://localhost:5000/api/categories", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCategories(response.data); // assuming response.data is an array of categories
      } catch (error) {
        console.error("Error fetching categories:", error.response?.data || error.message);
      }
    };
  
    fetchCategories();
  }, []);
  // ✅ FETCH PRODUCTS FROM BACKEND
  const fetchProducts = async () => {
    try {
      setLoading(true);
  
      let query = "";
  
      // 🔍 search
      if (searchTerm) {
        query += `search=${searchTerm}&`;
      }
  
      // 🎯 category
      if (filters.category) {
        query += `categoryId=${filters.category}&`;
      }
  
      // 📌 status
      if (filters.status) {
        query += `status=${filters.status}&`;
      }
  
      // ⚠ low stock
      if (filters.lowStock) {
        query += `lowStock=true&`;
      }
  
      // 💰 price
      if (filters.minPrice) {
        query += `minPrice=${filters.minPrice}&`;
      }
      if (filters.sortBy) {
        query += `sortBy=${filters.sortBy}&`;
      }
      
      if (filters.maxPrice) {
        query += `maxPrice=${filters.maxPrice}&`;
      }
  
      const response = await axios.get(
        `http://localhost:5000/api/products?${query}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
  
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

  // ✅ Status Badge
  const getStatusBadge = (product) => {
    const isLowStock = product.quantity <= product.reorderLevel;

    if (isLowStock) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          Low Stock
        </span>
      );
    }

    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        In Stock
      </span>
    );
  };

  // ✅ DELETE PRODUCT
  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this product?"
    );
    if (!confirmDelete) return;

    try {
      await axios.delete(`http://localhost:5000/api/products/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      fetchProducts();
    } catch (error) {
      console.error(error.response?.data || error.message);
    }
  };

  // ✅ HANDLE EDIT
  const handleEdit = (product) => {
    setSelectedProduct({
      _id: product._id,
      name: product.name,
      sku: product.sku,
      categoryId: product.categoryId?._id,
      description: product.description || "",
      costPrice: product.costPrice,
      sellingPrice: product.sellingPrice,
      quantity: product.quantity,
      unit: product.unit,
      reorderLevel: product.reorderLevel,
      supplierName: product.supplierName,
      status: product.status,
      image: product.image,
    });
    setEditModalOpen(true);
  };

  // ✅ UPDATE PRODUCT
  const handleUpdate = async (formData) => {
    try {
      await axios.put(
        `http://localhost:5000/api/products/${selectedProduct._id}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setEditModalOpen(false);
      setSelectedProduct(null);
      fetchProducts();
    } catch (error) {
      console.error(error.response?.data || error.message);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* HEADER */}
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">
            Products
          </h1>
          <p className="text-gray-600 text-sm m-0">
            Manage your product inventory
          </p>
        </div>

        <Link
          to="/products/add"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors inline-flex items-center gap-2"
        >
          ➕ Add Product
        </Link>
      </div>
      {/* SEARCH + FILTER */}
<div className="bg-white rounded-xl p-6 shadow-md">
  <div className="flex flex-col gap-2">
    <label className="text-sm font-medium text-gray-900">
      Search Products
    </label>

    <div className="flex items-center gap-3 relative">
      {/* SEARCH INPUT */}
      <div className="relative w-full">
        <span className="absolute inset-y-0 left-4 flex items-center text-gray-400">🔍</span>

        <input
          type="text"
          placeholder="Search by name or SKU..."
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
        />
      </div>

      {/* FILTER BUTTON */}
      <button
  onClick={() => setFilterOpen(!filterOpen)}
  className="border border-gray-200 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition flex items-center"
>
  <span className="mr-2">⚙</span>
  Filters
</button>
    </div>
  </div>

  {/* FILTER PANEL */}
  {filterOpen && (
    <div className="mt-6 border-t pt-6 grid md:grid-cols-3 gap-4">
      {/* CATEGORY */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-600">
          Category
        </label>
        <select
  className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
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
        <label className="text-xs font-medium text-gray-600">
          Status
        </label>
        <select
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
          value={filters.status}
          onChange={(e) =>
            setFilters({ ...filters, status: e.target.value })
          }
        >
          <option value="">All</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="out_of_stock">Out of Stock</option>
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
        <label className="text-sm text-gray-700">Low Stock</label>
      </div>

      {/* PRICE RANGE */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-600">
          Min Price
        </label>
        <input
          type="number"
          placeholder="0"
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
          value={filters.minPrice}
          onChange={(e) =>
            setFilters({ ...filters, minPrice: e.target.value })
          }
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-600">
          Max Price
        </label>
        <input
          type="number"
          placeholder="100000"
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
          value={filters.maxPrice}
          onChange={(e) =>
            setFilters({ ...filters, maxPrice: e.target.value })
          }
        />
      </div>
     {/*SORT By*/}
     <div className="flex flex-col gap-1">
  <label className="text-xs font-medium text-gray-600">Sort By</label>
  <select
    className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
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
      <div className="flex items-end gap-3">
      <button
  onClick={() => {
    fetchProducts();
    setFilterOpen(false);
    
  }}
  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm"
>
  Apply
</button>

<button
  className="border px-4 py-2 rounded-lg text-sm"
  onClick={() => {
    setFilters({
      category: "",
      status: "",
      lowStock: false,
      minPrice: "",
      maxPrice: "",
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

      {/* TABLE */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        {loading ? (
          <div className="text-center py-8 text-gray-500">
            Loading products...
          </div>
        ) : (
          <table className="w-full border-collapse">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  SKU
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Product Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Category
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Quantity
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Price
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {paginatedProducts.length > 0 ? (
                paginatedProducts.map((product) => (
                  <tr
                    key={product._id}
                    className="border-b hover:bg-gray-50 transition"
                  >
                    <td className="px-4 py-4 text-sm font-semibold">
                      {product.sku}
                    </td>

                    <td className="px-4 py-4 text-sm">
                      <Link
                        to={`/products/${product._id}`}
                        className="text-blue-600 hover:underline"
                      >
                        {product.name}
                      </Link>
                    </td>

                    <td className="px-4 py-4 text-sm">
                      {product.categoryId?.name || "-"}
                    </td>

                    <td className="px-4 py-4 text-sm">{product.quantity}</td>

                    <td className="px-4 py-4 text-sm">
                      ${product.sellingPrice?.toFixed(2)}
                    </td>

                    <td className="px-4 py-4 text-sm">{getStatusBadge(product)}</td>

                    <td className="px-4 py-4 text-sm flex gap-2">
                      {/* Edit Icon */}
                      <button
                        onClick={() => handleEdit(product)}
                        className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                      >
                        <FaEdit className="w-4 h-4 text-blue-600" />
                      </button>

                      {/* Delete Icon */}
                      <button
                        onClick={() => handleDelete(product._id)}
                        className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-red-50 transition"
                      >
                        <FaTrash className="w-4 h-4 text-red-600" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="7"
                    className="text-center py-8 text-gray-500"
                  >
                    No products found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* PAGINATION */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-6 p-6 bg-white rounded-xl shadow-md">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="border px-3 py-1.5 rounded-lg text-xs disabled:opacity-50"
          >
            Previous
          </button>

          <span className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </span>

          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="border px-3 py-1.5 rounded-lg text-xs disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      {/* EDIT MODAL */}
      {editModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Edit Product</h2>
              <button
                onClick={() => setEditModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <InventoryForm
              isEdit={true}
              initialData={selectedProduct}
              onSubmit={handleUpdate}
              onCancel={() => setEditModalOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
