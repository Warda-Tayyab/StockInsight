/** @module inventory/inventory-management/pages/Products */

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { FaEdit, FaTrash } from "react-icons/fa"; // React Icons

const Products = () => {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const itemsPerPage = 10;
  const token = localStorage.getItem("token");

  // ✅ FETCH PRODUCTS FROM BACKEND
  const fetchProducts = async () => {
    try {
      setLoading(true);

      const response = await axios.get(
        `http://localhost:5000/api/products?search=${searchTerm}`,
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

      {/* SEARCH */}
      <div className="bg-white rounded-xl p-6 shadow-md">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-900">
            Search Products
          </label>

          <div className="relative flex items-center">
            <span className="absolute left-4 text-gray-400">🔍</span>

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
        </div>
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
                      <Link
                        to={`/products/edit/${product._id}`}
                        className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                      >
                        <FaEdit className="w-4 h-4 text-blue-600" />
                      </Link>

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
    </div>
  );
};

export default Products;
