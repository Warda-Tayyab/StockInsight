import { useEffect, useState } from 'react';
import api from '../../../shared/utils/api';
import { useNavigate } from 'react-router-dom';
import { HiOutlineTrendingUp, HiOutlineArrowRight } from 'react-icons/hi';

export default function TopSellingProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const styles = [
    { progress: 'bg-indigo-500' },
    { progress: 'bg-emerald-500' },
    { progress: 'bg-amber-500' },
  ];

  useEffect(() => {
    const fetchTopProducts = async () => {
      try {
        const res = await api.get('/api/dashboard/top-products');

        const formattedProducts = res.data.products.map((product, index) => ({
          ...product,
          ...styles[index % styles.length],
        }));

        setProducts(formattedProducts);
      } catch (error) {
        console.error('Error fetching top products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTopProducts();
  }, []);

  if (loading) {
    return (
      <div className="card-padded">
        <p className="text-slate-500 text-sm">Loading top products...</p>
      </div>
    );
  }

  return (
    <div className="card-padded">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Top Selling Products
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Top 3 best-selling products in this period
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate('/products')}
          className="btn-secondary self-start sm:self-auto"
        >
          View All
          <HiOutlineArrowRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
        {products.map((product) => (
          <div
            key={product.id}
            className="border border-slate-100 rounded-2xl p-5 sm:p-6 min-h-[240px] flex flex-col justify-between
              hover:shadow-card-hover transition-all duration-300 hover:-translate-y-0.5 bg-slate-50/30"
          >
            <div className="flex-1">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-slate-800 text-base sm:text-lg leading-snug">
                  {product.name}
                </h3>

                <span
                  className={`text-xs font-semibold px-2 py-1 rounded-lg flex items-center gap-0.5 shrink-0 ${
                    product.growth.includes('-')
                      ? 'text-red-600 bg-red-50'
                      : 'text-emerald-600 bg-emerald-50'
                  }`}
                >
                  {!product.growth.includes('-') && (
                    <HiOutlineTrendingUp className="w-3 h-3" />
                  )}
                  {product.growth}
                </span>
              </div>

              <p className="text-sm text-slate-500 mt-1">{product.sold} Sold</p>

              <p className="text-xl sm:text-2xl font-bold text-slate-900 mt-2">
                {product.revenue}
              </p>
            </div>

            <div className="mt-5">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                <span>Sales Progress</span>
                <span className="font-medium">{product.percentage}%</span>
              </div>

              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                <div
                  className={`${product.progress} h-2 rounded-full transition-all duration-500`}
                  style={{ width: `${product.percentage}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
