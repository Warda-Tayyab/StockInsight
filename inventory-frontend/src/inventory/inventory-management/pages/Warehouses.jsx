import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaEdit, FaTrash, FaEye } from "react-icons/fa";
import { HiOutlinePlus } from "react-icons/hi";
import { toast } from "react-hot-toast";
import api from "../../../shared/utils/api";
const Warehouses = () => {
  const navigate = useNavigate();
  const [warehouses, setWarehouses] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [viewWarehouse, setViewWarehouse] = useState(null); // ✅ view modal
  const token = localStorage.getItem("token");
  const itemsPerPage = 10;
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const fetchWarehouses = async () => {
    try {
      setLoading(true);
      let query = searchTerm ? `search=${searchTerm}&` : "";
      if (statusFilter) {
        query += `status=${statusFilter}&`;
      }
      const res = await api.get(`/api/warehouses?${query}`);
      setWarehouses(res.data.data);
    } catch (err) {
      console.error(err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchWarehouses(); }, [searchTerm, statusFilter]);

  const totalPages = Math.ceil(warehouses.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedWarehouses = warehouses.slice(startIndex, startIndex + itemsPerPage);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this warehouse?")) return;
    try {
      await api.delete(`/warehouses/${id}`);
      toast.success("Warehouse deleted successfully ✅");
      fetchWarehouses();
    } catch (err) {
      console.error(err.response?.data || err.message);
      toast.error(err.response?.data?.message || "Delete failed");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Warehouses</h2>
          <p className="text-sm text-slate-500">Manage warehouse locations</p>
        </div>
        <button
          onClick={() => navigate("/settings/warehouses/add")}
          className="btn-primary"
        >
          <HiOutlinePlus className="w-4 h-4" />
          Add Warehouse
        </button>
      </div>

      <div className="card-padded flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <input
          type="text"
          placeholder="Search by name, code, city, contact..."
          className="input-field flex-1"
          value={searchTerm}
          onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
        />

        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
          className="select-field sm:w-48"
        >
    <option value="">All Status</option>
    <option value="active">Active</option>
    <option value="inactive">Inactive</option>
  </select>
</div>

      <div className="table-container overflow-x-auto">
        {loading ? (
          <div className="text-center py-12 text-slate-500 text-sm">Loading warehouses...</div>
        ) : (
          <table className="data-table min-w-[560px] sm:min-w-[720px]">
            <thead>
              <tr>
                <th>Name</th>
                <th>Code</th>
                <th>City</th>
                <th>Manager</th>
                <th>Status</th>
                <th className="px-12 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedWarehouses.length > 0 ? (
                paginatedWarehouses.map((w) => (
                  <tr key={w._id}>
                    <td className="px-4 py-4 text-sm">{w.name}</td>
                    <td className="px-4 py-4 text-sm">{w.code}</td>
                    <td className="px-4 py-4 text-sm">{w.city || "-"}</td>
                    <td className="px-4 py-4 text-sm">{w.contactPerson || "-"}</td>
                    <td className="px-4 py-4 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs ${w.status === "active" ? "bg-green-100 text-green-700" : "bg-slate-200 text-slate-600"}`}>
                        {w.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 flex gap-2">
                      <button onClick={() => navigate(`/settings/warehouses/edit/${w._id}`)} className="p-2 border rounded-lg hover:bg-slate-50">
                        <FaEdit className="text-indigo-600" />
                      </button>
                      <button
                            onClick={() => navigate(`/settings/warehouses/view/${w._id}`)} className="p-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
                  <FaEye className="text-green-600" />
                          </button>                  
  
                 
                      <button onClick={() => handleDelete(w._id)} className="p-2 border rounded-lg hover:bg-red-50">
                        <FaTrash className="text-red-600" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-slate-500">No warehouses found</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>


      {/* PAGINATION */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-6 p-6 card">
          <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="border px-3 py-1.5 rounded-lg text-xs disabled:opacity-50">Previous</button>
          <span className="text-sm text-slate-600">Page {currentPage} of {totalPages}</span>
          <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="border px-3 py-1.5 rounded-lg text-xs disabled:opacity-50">Next</button>
        </div>
      )}
    </div>
  );
};

export default Warehouses;