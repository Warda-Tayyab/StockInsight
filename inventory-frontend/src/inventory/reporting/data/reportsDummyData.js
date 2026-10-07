/** Static dummy data for frontend-only reports module */

export const salesSummary = {
  totalSales: 328450,
  totalOrders: 892,
  avgOrderValue: 368.22,
  dailyRevenue: 4250,
  weeklyRevenue: 28400,
  monthlyRevenue: 67200,
  growth: '+18.5%',
};

export const salesTrend = [
  { date: 'Jan', revenue: 45000, orders: 120 },
  { date: 'Feb', revenue: 52000, orders: 135 },
  { date: 'Mar', revenue: 48000, orders: 110 },
  { date: 'Apr', revenue: 61000, orders: 145 },
  { date: 'May', revenue: 55000, orders: 130 },
  { date: 'Jun', revenue: 67000, orders: 150 },
];

export const topCustomers = [
  { id: 1, name: 'Metro Retail Co.', orders: 48, totalSpent: 42500 },
  { id: 2, name: 'Green Mart', orders: 36, totalSpent: 31200 },
  { id: 3, name: 'City Pharmacy', orders: 29, totalSpent: 24800 },
  { id: 4, name: 'Walk-in Cash', orders: 412, totalSpent: 18900 },
  { id: 5, name: 'Card Payments', orders: 367, totalSpent: 22100 },
];

export const topSellingProducts = [
  { id: 1, name: 'Washing Powder 2kg', sku: 'WASH-2K', sold: 420, revenue: 18900 },
  { id: 2, name: 'Rice Premium 5kg', sku: 'RICE-5K', sold: 310, revenue: 15500 },
  { id: 3, name: 'Cooking Oil 1L', sku: 'OIL-1L', sold: 285, revenue: 14250 },
  { id: 4, name: 'Milk Pack 1L', sku: 'MLK-1L', sold: 260, revenue: 7800 },
  { id: 5, name: 'Tea Box 500g', sku: 'TEA-500', sold: 198, revenue: 5940 },
];

export const salesTransactions = [
  { id: 'INV-000101', date: '2026-04-22 10:15', customer: 'Metro Retail', items: 5, payment: 'card', total: 1240.5 },
  { id: 'INV-000102', date: '2026-04-22 11:02', customer: 'Walk-in', items: 2, payment: 'cash', total: 89.99 },
  { id: 'INV-000103', date: '2026-04-21 16:40', customer: 'Green Mart', items: 8, payment: 'card', total: 2105 },
  { id: 'INV-000104', date: '2026-04-21 09:20', customer: 'City Pharmacy', items: 3, payment: 'cash', total: 445 },
  { id: 'INV-000105', date: '2026-04-20 14:55', customer: 'Walk-in', items: 1, payment: 'cash', total: 32.5 },
];

export const inventorySummary = {
  inStock: 142,
  lowStock: 18,
  outOfStock: 7,
  totalValue: 485200,
  totalProducts: 167,
};

export const inventoryProducts = [
  { id: 1, name: 'Washing Powder 2kg', sku: 'WASH-2K', category: 'Cleaning', qty: 90, reorder: 20, status: 'in_stock', value: 4500 },
  { id: 2, name: 'Rice Premium 5kg', sku: 'RICE-5K', category: 'Grocery', qty: 45, reorder: 30, status: 'in_stock', value: 6750 },
  { id: 3, name: 'Hand Soap', sku: 'SOAP-H', category: 'Personal Care', qty: 8, reorder: 15, status: 'low_stock', value: 320 },
  { id: 4, name: 'Bleach 500ml', sku: 'BLCH-5', category: 'Cleaning', qty: 0, reorder: 10, status: 'out_of_stock', value: 0 },
  { id: 5, name: 'Sugar 1kg', sku: 'SUG-1K', category: 'Grocery', qty: 120, reorder: 40, status: 'in_stock', value: 3600 },
];

export const warehouseStock = [
  { id: 1, name: 'Main Warehouse', totalQty: 8420, skus: 98, utilization: 78 },
  { id: 2, name: 'North Branch', totalQty: 3210, skus: 54, utilization: 62 },
  { id: 3, name: 'South Depot', totalQty: 1890, skus: 41, utilization: 45 },
];

export const lowStockItems = [
  { id: 1, name: 'Hand Soap', sku: 'SOAP-H', current: 8, min: 15, suggested: 25, severity: 'low' },
  { id: 2, name: 'Bleach 500ml', sku: 'BLCH-5', current: 0, min: 10, suggested: 30, severity: 'critical' },
  { id: 3, name: 'Detergent Bar', sku: 'DET-B', current: 5, min: 12, suggested: 20, severity: 'critical' },
  { id: 4, name: 'Shampoo 200ml', sku: 'SHP-2', current: 11, min: 20, suggested: 30, severity: 'low' },
];

export const profitLoss = {
  revenue: 328450,
  cost: 241200,
  grossProfit: 87250,
  writeOffLoss: 3850,
  expiredLoss: 2400,
  salesLoss: 1200,
  totalLoss: 7450,
  netProfit: 79800,
  margin: 24.3,
};

export const profitLossChart = [
  { name: 'Revenue', value: 328450 },
  { name: 'COGS', value: 241200 },
  { name: 'Gross Profit', value: 87250 },
  { name: 'Losses', value: 7450 },
  { name: 'Net Profit', value: 79800 },
];

export const lossBreakdown = [
  { name: 'Damaged / Write-offs', value: 3850, categoryKey: 'write_off' },
  { name: 'Expired Stock', value: 2400, categoryKey: 'expired' },
  { name: 'Below-Cost Sales', value: 1200, categoryKey: 'below_cost_sale' },
];

export const lossProducts = [
  { id: 'wo-1', product: 'Washing Powder 2kg', sku: 'WASH-2K', category: 'Write-Off (Damaged/Defective)', categoryKey: 'write_off', reference: 'RET-000012', date: '2026-04-20 14:30', quantity: 5, unitCost: 450, totalLoss: 2250, reason: 'damaged - Torn packaging during transit', status: 'Damaged' },
  { id: 'exp-1', product: 'Juice 1L Pack', sku: 'JUC-1L', category: 'Expired Stock', categoryKey: 'expired', reference: 'B-2025-112', date: '2026-04-15 00:00', quantity: 12, unitCost: 200, totalLoss: 2400, reason: 'Batch B-2025-112 expired on 2026-03-15', status: 'Expired' },
  { id: 'wo-2', product: 'Hand Soap 250ml', sku: 'SOAP-H', category: 'Write-Off (Damaged/Defective)', categoryKey: 'write_off', reference: 'WO-000045', date: '2026-04-18 10:15', quantity: 8, unitCost: 200, totalLoss: 1600, reason: 'defective - Leaking nozzle', status: 'Defective' },
  { id: 'sale-loss-1', product: 'Sugar 1kg', sku: 'SUG-1K', category: 'Below-Cost Sale', categoryKey: 'below_cost_sale', reference: 'INV-000104', date: '2026-04-17 11:20', quantity: 20, unitCost: 110, salePrice: 50, totalLoss: 1200, reason: 'Sold @ Rs. 50 (Cost Rs. 110)', status: 'Below Cost' },
];

export const monthlyProfit = [
  { month: 'Jan', revenue: 45000, cost: 33000, grossProfit: 12000, loss: 1200, profit: 10800 },
  { month: 'Feb', revenue: 52000, cost: 38000, grossProfit: 14000, loss: 1500, profit: 12500 },
  { month: 'Mar', revenue: 48000, cost: 35500, grossProfit: 12500, loss: 800, profit: 11700 },
  { month: 'Apr', revenue: 61000, cost: 44000, grossProfit: 17000, loss: 1400, profit: 15600 },
  { month: 'May', revenue: 55000, cost: 40200, grossProfit: 14800, loss: 1100, profit: 13700 },
  { month: 'Jun', revenue: 67000, cost: 49100, grossProfit: 17900, loss: 1450, profit: 16450 },
];

export const warehouseTransfers = [
  { id: 1, type: 'stock_in', product: 'Rice Premium 5kg', warehouse: 'Main Warehouse', qty: 200, user: 'Ahmed Khan', date: '2026-04-22 08:00' },
  { id: 2, type: 'stock_out', product: 'Cooking Oil 1L', warehouse: 'North Branch', qty: 50, user: 'Sara Ali', date: '2026-04-21 15:30' },
  { id: 3, type: 'stock_in', product: 'Washing Powder 2kg', warehouse: 'South Depot', qty: 100, user: 'Ahmed Khan', date: '2026-04-20 11:00' },
];

export const fastMoving = [
  { name: 'Washing', sold: 420 },
  { name: 'Rice', sold: 310 },
  { name: 'Oil', sold: 285 },
  { name: 'Milk', sold: 260 },
  { name: 'Tea', sold: 198 },
];

export const productPerformance = {
  bestSelling: topSellingProducts,
  slowMoving: [
    { id: 6, name: 'Glass Cleaner', sku: 'GLS-C', sold: 4, revenue: 120, profit: 40 },
    { id: 7, name: 'Air Freshener', sku: 'AIR-F', sold: 7, revenue: 210, profit: 85 },
  ],
  deadStock: [
    { id: 8, name: 'Old Spice Mix', sku: 'OSP-M', sold: 0, revenue: 0, profit: 0 },
    { id: 9, name: 'Seasonal Candle', sku: 'CND-S', sold: 0, revenue: 0, profit: 0 },
  ],
  mostProfitable: [
    { id: 1, name: 'Washing Powder 2kg', profit: 8400 },
    { id: 2, name: 'Cooking Oil 1L', profit: 6200 },
    { id: 3, name: 'Rice Premium 5kg', profit: 5100 },
  ],
};

export const expiryBatches = [
  { id: 1, batch: 'B-2026-041', product: 'Milk Pack 1L', warehouse: 'Main', qty: 48, expiry: '2026-04-28', daysLeft: 6, status: 'critical' },
  { id: 2, batch: 'B-2026-038', product: 'Yogurt 500g', warehouse: 'North', qty: 30, expiry: '2026-05-05', daysLeft: 13, status: 'expiring' },
  { id: 3, batch: 'B-2025-112', product: 'Juice 1L', warehouse: 'Main', qty: 12, expiry: '2026-03-15', daysLeft: -38, status: 'expired' },
  { id: 4, batch: 'B-2026-045', product: 'Cheese Block', warehouse: 'South', qty: 22, expiry: '2026-05-20', daysLeft: 28, status: 'ok' },
];

export const users = [
  { id: 1, name: 'Ahmed Khan', email: 'ahmed@store.com', role: 'owner', status: 'active', lastLogin: '2026-04-22 09:00' },
  { id: 2, name: 'Sara Ali', email: 'sara@store.com', role: 'staff', status: 'active', lastLogin: '2026-04-21 18:30' },
  { id: 3, name: 'Hassan Raza', email: 'hassan@store.com', role: 'manager', status: 'active', lastLogin: '2026-04-20 12:15' },
];

export const activityTimeline = [
  { id: 1, time: '2026-04-22 10:15', user: 'Sara Ali', type: 'sale', action: 'Sale INV-000101', product: 'Washing Powder', qty: 5 },
  { id: 2, time: '2026-04-22 08:00', user: 'Ahmed Khan', type: 'stock_in', action: 'Stock In', product: 'Rice Premium 5kg', qty: 200 },
  { id: 3, time: '2026-04-21 15:30', user: 'Sara Ali', type: 'stock_out', action: 'Stock Out', product: 'Cooking Oil 1L', qty: 50 },
  { id: 4, time: '2026-04-21 09:20', user: 'Hassan Raza', type: 'login', action: 'User login', product: '—', qty: '—' },
];

export const filterOptions = {
  customers: ['All', 'Metro Retail Co.', 'Green Mart', 'City Pharmacy', 'Walk-in'],
  products: ['All', 'Washing Powder 2kg', 'Rice Premium 5kg', 'Cooking Oil 1L'],
  warehouses: ['All', 'Main Warehouse', 'North Branch', 'South Depot'],
  categories: ['All', 'Grocery', 'Cleaning', 'Personal Care'],
};

export const reportNavLinks = [
  { path: '/reports', label: 'Overview', end: true },
  { path: '/reports/sales', label: 'Sales' },
  { path: '/reports/purchasing', label: 'Purchasing' },
  { path: '/reports/inventory', label: 'Inventory' },
  // { path: '/reports/low-stock', label: 'Low Stock' },
  { path: '/reports/profit-loss', label: 'Profit & Loss' },
  { path: '/reports/warehouse', label: 'Locations' },
  { path: '/reports/product-performance', label: 'Products' },
  { path: '/reports/expiry', label: 'Expiry' },
  { path: '/reports/user-activity', label: 'Activity' },
];
