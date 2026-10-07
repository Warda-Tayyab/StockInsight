/** @module inventory/stock-monitoring/pages/LowStock */
import axios from 'axios';
import { useState,useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from "../../../shared/utils/api";
const LowStock = () => {
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const token = localStorage.getItem("token");
  const navigate = useNavigate();
  useEffect(() => {
    fetchLowStock();
    fetchCategories();
  }, []);
  const fetchCategories = async () => {
    try {
      const res = await api.get('/api/categories');
      setCategories(res.data);
    } catch (err) {
      console.error("Category fetch error:", err);
    }
  };
const fetchLowStock = async () => {
  try {
    setLoading(true);

    const res = await api.get( '/api/inventory/low-stock' );

    setLowStockItems(res.data);
  } catch (err) {
    console.error("Low stock fetch error:", err);
  } finally {
    setLoading(false); 
  }
};
const filteredItems =
  filter === 'all'
    ? lowStockItems
    : lowStockItems.filter(item =>
        item.productId?.categoryId?.name?.toLowerCase() === filter.toLowerCase()
      );
    const getStockPercentage = (current, reorder) => {
      if (!reorder || reorder <= 0) return 0;
      const percentage = (current / reorder) * 100;
      return Math.min(Math.round(percentage), 100);
    };

const getStockStatus = (percentage) => {
if (percentage < 50) return 'critical';
if (percentage < 75) return 'warning';
return 'info';
};

  return (
    <div data-testid="low-stock-page" className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Low Stock Items</h1>
          <p className="page-subtitle">Purchased products below reorder level (all locations combined)</p>
        </div>
      </div>

      <div className="card-padded">
        <div className="flex gap-2 flex-wrap">
        <button
  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
    filter === 'all'
      ? 'bg-gradient-to-r from-slate-800 via-indigo-700 to-purple-700 text-white shadow-sm'
      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
  }`}
  onClick={() => setFilter('all')}
>
  All ({lowStockItems.length})
</button>
{categories.map((cat) => (
  <button
    key={cat._id}
    onClick={() => setFilter(cat.name)}
    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
      filter === cat.name
        ? 'bg-gradient-to-r from-slate-800 via-indigo-700 to-purple-700 text-white shadow-sm'
        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
    }`}
  >
    {cat.name} (
      {lowStockItems.filter(
        i => i.productId?.categoryId?.name === cat.name
      ).length}
    )
  </button>
))}
        </div>
      </div>
      {loading ? (
        <div className="text-center py-10 text-slate-500">
          Loading low stock items...
        </div>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map((item) => {
           const currentStock = item.quantity ?? item.availableStock ?? 0;
           const reorder = item.reorderPoint ?? item.productId?.reorderLevel ?? 0;
           const isOutOfStock = item.alertType === 'out-of-stock' || currentStock === 0;

           const percentage = getStockPercentage(currentStock, reorder);
           const status = isOutOfStock ? 'critical' : getStockStatus(percentage);
          return (
            <div key={item._id} className="card-padded flex flex-col gap-4">
              <div className="flex justify-between items-start">
                <div className="flex flex-col gap-1">
                  <h3 className="text-lg font-semibold text-slate-900 m-0"> {item.productId?.name || "No Name"}</h3>
                  <span className="text-xs text-slate-400"> {item.productId?.sku || "No SKU"}</span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    status === 'critical' ? 'bg-red-100 text-red-800' : 
                    status === 'warning' ? 'bg-yellow-100 text-yellow-800' : 
                    'bg-indigo-50 text-indigo-700'
                  }`}>
                      {item.productId?.categoryId?.name || "No Category"}
                  </span>
                  {isOutOfStock && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      Out of Stock
                    </span>
                  )}
                  </div>
                </div>
                <div className="text-xl font-bold text-indigo-600">Rs.{item.productId?.sellingPrice || 0}</div>
              </div>
              
              <div className="grid grid-cols-3 gap-4 p-4 bg-slate-50 rounded-lg">
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-slate-400">Total Stock</span>
                  <span className="text-base font-semibold text-slate-900"> {currentStock}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-slate-400">Reorder Point</span>
                  <span className="text-base font-semibold text-slate-900"> {reorder}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-slate-400 pl-4">Stock Level</span>
                  <span className="text-base font-semibold text-slate-900 pl-4">{percentage}%</span>
                </div>
              </div>

              {item.locations?.length > 0 && (
                <div className="text-xs text-slate-500 bg-slate-50 rounded-lg p-3">
                  <span className="font-semibold text-slate-600">By location: </span>
                  {item.locations.map((loc) => `${loc.name} (${loc.quantity})`).join(' · ')}
                </div>
              )}
              
              <div className="mt-2">
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      status === 'critical' ? 'bg-red-500' : 
                      status === 'warning' ? 'bg-yellow-500' : 
                      'bg-indigo-500'
                    }`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="flex gap-4 pt-4 border-t border-slate-200">
                <button className="btn-primary !py-1.5 !px-3 !text-xs"
                 onClick={() => navigate(`/products/${item.productId?._id}`)}>View Details</button>
              </div>
            </div>
          );
        })}
      
      </div>
      )}

    </div>
  );
};
  
export default LowStock;
