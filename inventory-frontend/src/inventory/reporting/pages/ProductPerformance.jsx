import { useEffect, useState } from 'react';
import ReportPageLayout from '../components/common/ReportPageLayout';
import FilterBar, { FilterDateRange } from '../components/common/FilterBar';
import ExportButtons from '../components/common/ExportButtons';
import DataTable from '../components/common/DataTable';
import HorizontalBarChart from '../components/charts/HorizontalBarChart';
import { reportService } from '../../../shared/services/reportService';
import { formatMoney } from '../utils/formatMoney';

const ProductPerformance = () => {
  const [range, setRange] = useState('month');
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState(null);
  const [tenant, setTenant] = useState(null);
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await reportService.getProductPerformanceReport({ range });
        setReport(res.data);
        setTenant(res.data.tenant);
      } catch (err) {
        console.error('Product performance report error:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [range]);

  const productPerformance = report?.productPerformance || {};
  const chartData = (productPerformance.bestSelling || []).map((p) => ({
    name: p.name.slice(0, 12),
    sold: p.sold,
  }));

  return (
    <ReportPageLayout
      title="Product Performance"
      description="Best, slow and dead stock analysis"
      tenant={tenant}
      actions={
        <ExportButtons
          filename="product-performance"
          sheets={[
            {
              name: 'Best Selling',
              data: productPerformance.bestSelling || []
            },
            {
              name: 'Most Profitable',
              data: productPerformance.mostProfitable || []
            },
            {
              name: 'Slow Moving',
              data: productPerformance.slowMoving || []
            },
            {
              name: 'Dead Stock',
              data: productPerformance.deadStock || []
            }
          ]}
        />
      }
    >
      <FilterBar>
        <FilterDateRange value={range} onChange={setRange} />
      </FilterBar>

      {loading ? (
        <p className="text-slate-500 text-sm">Loading product performance...</p>
      ) : (
        <>
          <HorizontalBarChart data={chartData} title="Best-selling products" dataKey="sold" />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Best Selling</h3>
              <DataTable
                columns={[
                  { key: 'name', label: 'Product' },
                  { key: 'sold', label: 'Sold', sortable: true },
                  { key: 'revenue', label: 'Revenue', render: (r) => formatMoney(r.revenue) },
                ]}
                rows={productPerformance.bestSelling || []}
                pageSize={5}
              />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Most Profitable</h3>
              <DataTable
                columns={[
                  { key: 'name', label: 'Product' },
                  { key: 'profit', label: 'Profit', render: (r) => formatMoney(r.profit), sortable: true },
                ]}
                rows={productPerformance.mostProfitable || []}
                pageSize={5}
              />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Slow Moving</h3>
              <DataTable
                columns={[
                  { key: 'name', label: 'Product' },
                  { key: 'sold', label: 'Sold' },
                ]}
                rows={productPerformance.slowMoving || []}
                pageSize={5}
              />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Dead Stock</h3>
              <DataTable
                columns={[
                  { key: 'name', label: 'Product' },
                  { key: 'sku', label: 'SKU' },
                ]}
                rows={productPerformance.deadStock || []}
                pageSize={5}
              />
            </div>
          </div>
        </>
      )}
    </ReportPageLayout>
  );
};

export default ProductPerformance;
