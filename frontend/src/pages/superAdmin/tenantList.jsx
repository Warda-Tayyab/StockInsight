import { useEffect, useState } from "react";
import axios from "axios";
import { FaEdit, FaTrash, FaSave, FaTimes } from "react-icons/fa";
import "../CSS/tenantList.css";

const tenantList = () => {
  const [tenants, setTenants] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({ name: "" });

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/admin/tenants", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTenants(res.data.tenants);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this tenant?")) return;

    try {
      await axios.delete(`http://localhost:5000/api/admin/tenants/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchTenants();
    } catch (err) {
      console.error(err);
    }
  };

  const handleEdit = (tenant) => {
    setEditingId(tenant._id);
    setEditData({ name: tenant.name });
  };

  const handleUpdate = async (id) => {
    try {
      await axios.put(
        `http://localhost:5000/api/admin/tenants/${id}`,
        editData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setEditingId(null);
      fetchTenants();
    } catch (err) {
      console.error(err);
    }
  };

  // ✅ New: Handle status change
  const handleStatusChange = async (id, status) => {
    try {
      await axios.patch(
        `http://localhost:5000/api/admin/tenants/${id}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchTenants(); // refresh list
    } catch (err) {
      console.error(err);
      alert("Failed to update status");
    }
  };

  return (
    <div className="tenant-container">
      <h2>Tenant Management</h2>

      <table className="tenant-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Owner Name</th>
            <th>Owner Email</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {tenants.map((tenant) => (
            <tr key={tenant._id}>
              <td>
                {editingId === tenant._id ? (
                  <input
                    value={editData.name}
                    onChange={(e) =>
                      setEditData({ ...editData, name: e.target.value })
                    }
                  />
                ) : (
                  tenant.name
                )}
              </td>

              <td>{tenant.ownerUserId?.firstName} {tenant.ownerUserId?.lastName}</td>
              <td>{tenant.ownerUserId?.email}</td>

              {/* ✅ Status dropdown */}
              <td>
                <select
                  value={tenant.status}
                  onChange={(e) =>
                    handleStatusChange(tenant._id, e.target.value)
                  }
                >
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                  <option value="trial">Trial</option>
                </select>
              </td>

              <td>
                {editingId === tenant._id ? (
                  <>
                    <button
                      className="icon-btn edit"
                      onClick={() => handleUpdate(tenant._id)}
                      title="Save"
                    >
                      <FaSave />
                    </button>
                    <button
                      className="icon-btn delete"
                      onClick={() => setEditingId(null)}
                      title="Cancel"
                    >
                      <FaTimes />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      className="icon-btn edit"
                      onClick={() => handleEdit(tenant)}
                      title="Edit"
                    >
                      <FaEdit />
                    </button>
                    <button
                      className="icon-btn delete"
                      onClick={() => handleDelete(tenant._id)}
                      title="Delete"
                    >
                      <FaTrash />
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default tenantList;
