/** @module pos/context/POSContext - Products, sales, and stock for POS */

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
//import { posProducts } from '../data/posProducts';
import api from '../../shared/utils/api';

const POSContext = createContext(null);
const STOCK_SYNC_INTERVAL_MS = 15000;

const normalizeCode = (v) => String(v || '').trim().toUpperCase();
const normalizeSale = (sale = {}) => ({
  ...sale,
  _id: sale._id || sale.id || `sale-${Date.now()}`,
 // id: sale.id || sale._id || `sale-${Date.now()}`,
  // Invoice id must come from backend sale response
  invoiceId: sale.invoiceId || sale.invoiceNo || sale.invoiceNumber || null,
  createdAt: sale.createdAt || new Date().toISOString(),
  items: Array.isArray(sale.items) ? sale.items : [],
});
const toSafeNumber = (value, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};
const resolveStock = (product) => {
  const candidates = [
    product?.availableStock,
    product?.quantity,
    product?.totalStock,
    product?.stock,
    product?.stockOnHand,
    product?.currentStock,
    product?.inventory?.totalStock,
  ];
  for (const c of candidates) {
    if (c !== undefined && c !== null && c !== '') return toSafeNumber(c, 0);
  }
  return 0;
};

export const POSProvider = ({ children }) => {
  const [todayStats, setTodayStats] = useState({
  totalSales: 0,
  todayReturnAmount: 0,
  transactions: 0
});

 const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  
  
  const fetchProducts = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await api.get('/api/products?posReady=true');
    
      const payload = res.data;
      const data = Array.isArray(payload) ? payload : (Array.isArray(payload?.data) ? payload.data : []);

      const formatted = data.map((p) => {
        // debug log requested: frontend received product object
        //console.log('[POS_STOCK_DEBUG][frontend] received product:', p);
        return {
          id: p._id || p.id,
          name: p.name || 'Unnamed Product',
          sku: normalizeCode(p.sku),
          barcode: normalizeCode(p.barcode || ''),
          price: toSafeNumber(p.sellingPrice ?? p.price, 0),
          image: p.image || null,
          stock: resolveStock(p),
          totalStock: resolveStock(p),
          reorderLevel: toSafeNumber(p.reorderLevel, 0),
          categoryId: p.categoryId?._id || p.categoryId || null,
          category: p.category?.name || p.categoryId?.name || p.category || 'General',
          needsSetup: Boolean(p.needsSetup),
          setupStatus: p.setupStatus || 'ready',
          supplierName: p.supplierName || '',
        };
      });

      setProducts(formatted);
    } catch (err) {
      console.error('Error fetching products', err);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    const syncOnFocus = () => fetchProducts();
    const syncOnVisibility = () => {
      if (document.visibilityState === 'visible') fetchProducts();
    };

    const intervalId = window.setInterval(fetchProducts, STOCK_SYNC_INTERVAL_MS);
    window.addEventListener('focus', syncOnFocus);
    document.addEventListener('visibilitychange', syncOnVisibility);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', syncOnFocus);
      document.removeEventListener('visibilitychange', syncOnVisibility);
    };
  }, [fetchProducts]);
 
   const fetchSales = useCallback(async () => {
  try {
    const token = localStorage.getItem('token');

    const res = await api.get('/api/sales');


    const payload = res.data;
    const salesArray = Array.isArray(payload)
      ? payload
      : (Array.isArray(payload?.sales) ? payload.sales : []);
    setSales(salesArray.map((sale) => normalizeSale(sale)));
  } catch (err) {
    console.error('Error fetching sales', err);
  }
}, []);

useEffect(() => {
  fetchSales();
}, [fetchSales]);
  

  const addSale = useCallback((sale) => {
    
  setSales((prev) => [normalizeSale(sale), ...prev]);
}, []);

const fetchTodayStats = useCallback(async () => {
  try {
    const token = localStorage.getItem('token');

    const res = await api.get('/api/sales/today-stats');
    const data = res.data;
 

    setTodayStats({
      totalSales: data.totalSales || 0,
      todayReturnAmount: data.todayReturnAmount || 0,
      transactions: data.transactions || 0
    });

  } catch (err) {
    console.error('Error fetching today stats', err);
  }
}, []);

useEffect(() => {
  fetchTodayStats();
}, [fetchTodayStats]);

  const value = {
    products,
    sales,
    todayStats,
    fetchTodayStats,
    
    addSale,
    fetchProducts,
    fetchSales,
  };

  return <POSContext.Provider value={value}>{children}</POSContext.Provider>;
};

export const usePOSContext = () => {
  const ctx = useContext(POSContext);
  if (!ctx) throw new Error('usePOSContext must be used within POSProvider');
  return ctx;
};
