/** @module inventory/settings/pages/CategoriesSettings */

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { FiEdit2, FiTrash2, FiPlus, FiCheck, FiX } from 'react-icons/fi';
import api from '../../../shared/utils/api';

const CategoriesSettings = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState('');

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/categories');
      setCategories(Array.isArray(res.data) ? res.data : res.data?.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const createCategory = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return toast.error('Category name is required');
    setCreating(true);
    try {
      await api.post('/api/categories', { name: newName.trim() });
      setNewName('');
      toast.success('Category created');
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Create failed');
    } finally {
      setCreating(false);
    }
  };

  const updateCategory = async () => {
    if (!editName.trim()) return toast.error('Category name is required');
    try {
      await api.put(`/api/categories/${editId}`, { name: editName.trim() });
      setEditId(null);
      setEditName('');
      toast.success('Category updated');
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    }
  };

  const deleteCategory = async (id) => {
    if (!window.confirm('Delete this category?')) return;
    try {
      await api.delete(`/api/categories/${id}`);
      toast.success('Category deleted');
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Categories</h2>
        <p className="text-sm text-slate-500">Manage product categories for your catalog</p>
      </div>

      <form onSubmit={createCategory} className="card-padded flex flex-col sm:flex-row gap-3">
        <input
          className="input-field flex-1"
          placeholder="New category name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
        <button type="submit" disabled={creating} className="btn-primary shrink-0 disabled:opacity-50">
          <FiPlus className="w-4 h-4" />
          {creating ? 'Adding…' : 'Add Category'}
        </button>
      </form>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-slate-500">Loading…</div>
        ) : categories.length === 0 ? (
          <div className="py-16 text-center text-slate-500">No categories yet</div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {categories.map((cat) => (
              <li key={cat._id} className="flex items-center justify-between gap-3 px-4 py-3">
                {editId === cat._id ? (
                  <>
                    <input
                      className="input-field flex-1 !py-2"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      autoFocus
                    />
                    <div className="flex gap-1 shrink-0">
                      <button type="button" onClick={updateCategory} className="btn-icon !text-emerald-600">
                        <FiCheck className="w-4 h-4" />
                      </button>
                      <button type="button" onClick={() => setEditId(null)} className="btn-icon">
                        <FiX className="w-4 h-4" />
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <span className="text-sm font-medium text-slate-800 truncate">{cat.name}</span>
                    <div className="flex gap-1 shrink-0">
                      <button
                        type="button"
                        className="btn-icon"
                        onClick={() => {
                          setEditId(cat._id);
                          setEditName(cat.name);
                        }}
                      >
                        <FiEdit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        className="btn-icon !text-red-500"
                        onClick={() => deleteCategory(cat._id)}
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default CategoriesSettings;
