import { useState } from "react";
import { FiEdit2, FiTrash2, FiPlus, FiCheck, FiX } from "react-icons/fi";

const CategoryModal = ({
  isOpen,
  onClose,
  categories,
  fetchCategories,
  selectedCategory,
  setSelectedCategory
}) => {
  const [newCategoryName, setNewCategoryName] = useState("");
  const [editCategoryId, setEditCategoryId] = useState(null);
  const [editCategoryName, setEditCategoryName] = useState("");

  if (!isOpen) return null;

  const createCategory = async () => {
    if (!newCategoryName.trim()) return alert("Category name required");

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:5000/api/categories`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name: newCategoryName })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setNewCategoryName("");
      fetchCategories();
      setSelectedCategory(data._id); // auto select
      onClose();
    } catch (err) {
      alert(err.message);
    }
  };

  const updateCategory = async () => {
    if (!editCategoryName.trim()) return alert("Category name required");

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `http://localhost:5000/api/categories/${editCategoryId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ name: editCategoryName })
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setEditCategoryId(null);
      setEditCategoryName("");
      fetchCategories();
    } catch (err) {
      alert(err.message);
    }
  };

  const deleteCategory = async (id) => {
    if (!window.confirm("Delete this category?")) return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `http://localhost:5000/api/categories/${id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      fetchCategories();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-md p-6 rounded-xl shadow-lg">

        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Manage Categories</h2>
          <button onClick={onClose} className="text-gray-500 text-xl">
            ×
          </button>
        </div>

        {/* Add Section */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <FiPlus />
            <span className="text-sm font-medium">Add Category</span>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Category name"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              className="flex-1 px-3 py-2 border rounded-lg"
            />
            <button
              onClick={createCategory}
              className="px-3 py-2 bg-green-600 text-white rounded-lg"
            >
              Add
            </button>
          </div>
        </div>

        {/* Category List */}
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {categories.map((cat) => (
            <div
              key={cat._id}
              className="flex justify-between items-center border px-3 py-2 rounded-lg"
            >
              {editCategoryId === cat._id ? (
                <>
                  <input
                    value={editCategoryName}
                    onChange={(e) => setEditCategoryName(e.target.value)}
                    className="flex-1 px-2 py-1 border rounded-lg"
                  />
                  <div className="flex gap-2 ml-2">
                    <button onClick={updateCategory}>
                      <FiCheck />
                    </button>
                    <button onClick={() => setEditCategoryId(null)}>
                      <FiX />
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <span>{cat.name}</span>
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setEditCategoryId(cat._id);
                        setEditCategoryName(cat.name);
                      }}
                    >
                      <FiEdit2 />
                    </button>
                    <button onClick={() => deleteCategory(cat._id)}>
                      <FiTrash2 />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default CategoryModal;
