/**
 * Helpers for RAG retrieval — product/location matching and prioritized context packing.
 */
const Warehouse = require('../models/tenant/Warehouse');

const PRODUCT_QUERY_STOPWORDS = new Set([
  'the', 'and', 'for', 'with', 'kitna', 'hai', 'ka', 'ki', 'ke', 'kya', 'me', 'mere',
  'mera', 'meri', 'is', 'this', 'that', 'my', 'give', 'list', 'all', 'show', 'tell',
  'about', 'batao', 'detail', 'details', 'of', 'in', 'on', 'at', 'se', 'ko', 'ne',
  'mene', 'maine', 'abhi', 'tk', 'tak', 'total', 'amount', 'items', 'item', 'products',
  'product', 'batch', 'batches', 'baches', 'bache', 'stock', 'price', 'kitni', 'kitne', 'how', 'many',
  'much', 'what', 'which', 'please', 'mujhe', 'mujhay', 'dena', 'do', 'de',
]);

/** Match expired / expiring / batch questions (do NOT use \\b after "expir" — breaks "expired"/"expiring"). */
const isExpiryQuestion = (question = '') =>
  /expir|expire|batch|batches|baches|jald\s*expire|khatam\s*hone|shelf\s*life/i.test(
    String(question)
  );

/** Low stock / out of stock / stock-out list questions. */
const isStockAlertQuestion = (question = '') =>
  /out\s*of\s*stock|stock\s*out|stockout|low\s*stock|running\s*low|reorder|kam\s*stock|stock\s*kam|khatam\s*stock|shortage/i.test(
    String(question)
  );

/** Full catalog / "all product names" questions. */
const isProductCatalogQuestion = (question = '') => {
  const q = String(question || '')
    .toLowerCase()
    .replace(/producst|prodcuts|pruducts|proucts/g, 'products')
    .replace(/\s+/g, ' ')
    .trim();
  if (isStockAlertQuestion(q) || isExpiryQuestion(q)) return false;
  return (
    /\b(all\s*products?|saare\s*products?|saray\s*products?|sab\s*products?|sub\s*products?|total\s*products?|products?\s*list|product\s*catalog|product\s*names?|products?\s*ke\s*naam|products?\s*ke\s*name|naam\s*batao|names?\s*batao)\b/i.test(
      q
    ) ||
    (/\b(products?|items?|maal|catalog)\b/i.test(q) &&
      /\b(naam|name|names|list|sab|saare|saray|total|all|kon\s*kon|kis\s*kis)\b/i.test(q))
  );
};

const extractProductNames = (rows = []) => [
  ...new Set(
    (rows || [])
      .map((r) => r?.name || r?.productName || r?.product || r?.sku)
      .filter(Boolean)
      .map((n) => String(n).trim())
      .filter(Boolean)
  ),
];

const normalizeQueryForProductMatch = (question = '') =>
  String(question)
    .toLowerCase()
    .replace(/give me|list of|all the|show me|tell me|batao|detail(s)?|about/gi, ' ')
    .replace(/\b(batch|batches|baches|bache|product|products|stock|price|kitna|kitni|kitne)\b/gi, ' ')
    .replace(/[^\w\s\u0600-\u06FF]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const escapeRegex = (str) => String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const scoreProductMatch = (product, rawQuery, normalizedQuery) => {
  const name = String(product.name || '').toLowerCase().trim();
  const sku = String(product.sku || '').toLowerCase().trim();
  const barcode = String(product.barcode || '').toLowerCase().trim();
  if (!name) return 0;

  if (sku && new RegExp(`\\b${escapeRegex(sku)}\\b`, 'i').test(rawQuery)) return 100;
  if (barcode && rawQuery.includes(barcode)) return 95;
  if (name.length >= 3 && rawQuery.includes(name)) return 90;
  if (name.length >= 3 && normalizedQuery.includes(name)) return 88;

  const words = name.split(/\s+/).filter((w) => w.length >= 2 && !PRODUCT_QUERY_STOPWORDS.has(w));
  if (!words.length) return 0;

  const hitWords = words.filter((w) => normalizedQuery.includes(w) || rawQuery.includes(w));
  if (hitWords.length === words.length) return 70 + words.length;
  if (hitWords.length >= 2 && hitWords.length >= Math.ceil(words.length * 0.6)) {
    return 50 + hitWords.length;
  }
  if (hitWords.some((w) => w.length >= 3)) {
    return 60;
  }
  return 0;
};

const findMatchedLocations = async (tenantId, question = '') => {
  const q = String(question).toLowerCase();
  const warehouses = await Warehouse.find({ tenantId, isDeleted: false, status: 'active' })
    .select('name code locationType')
    .lean();

  const matches = [];
  for (const w of warehouses) {
    const name = String(w.name || '').toLowerCase().trim();
    const code = String(w.code || '').toLowerCase().trim();
    if (name.length >= 3 && q.includes(name)) matches.push(w);
    else if (code && code.length >= 2 && q.includes(code)) matches.push(w);
  }

  const asksWarehouse =
    /\b(warehouse|godown|godam|store|location|branch)\b/i.test(q) ||
    /\b(godam|godown)\b/i.test(q);

  if (!matches.length && asksWarehouse) {
    const warehouseType = warehouses.filter((w) => w.locationType === 'warehouse');
    if (warehouseType.length === 1) matches.push(warehouseType[0]);
  }

  return matches;
};

const pickLocationEntry = (locationBreakdown, location) => {
  const id = String(location._id || location.id || '');
  const name = String(location.name || '').toLowerCase();
  return (locationBreakdown || []).find(
    (row) =>
      String(row.locationId) === id ||
      String(row.name || '').toLowerCase() === name ||
      String(row.destination || '').toLowerCase().includes(name)
  );
};

const buildFocusedLocationContext = (locationBreakdown, matchedLocations = []) => {
  if (!matchedLocations.length) return null;
  const focused = matchedLocations
    .map((loc) => {
      const entry = pickLocationEntry(locationBreakdown, loc);
      if (!entry) return null;
      return {
        name: loc.name,
        code: loc.code,
        locationType: loc.locationType,
        lowStockCount: entry.lowStockCount,
        outOfStockCount: entry.outOfStockCount,
        expiredProductCount: entry.expiredProductCount,
        expiringSoonProductCount: entry.expiringSoonProductCount,
        lowStockProducts: entry.lowStock || [],
        outOfStockProducts: entry.outOfStock || [],
        expiredProducts: entry.expired || [],
        expiringSoonProducts: entry.expiringSoon || [],
      };
    })
    .filter(Boolean);
  return focused.length ? focused : null;
};

const buildWarehouseAggregate = (locationBreakdown = []) => {
  const warehouses = locationBreakdown.filter((l) => l.locationType === 'warehouse');
  if (!warehouses.length) return null;
  return {
    warehouseCount: warehouses.length,
    totalLowStockProducts: warehouses.reduce((s, l) => s + (l.lowStockCount || 0), 0),
    totalOutOfStockProducts: warehouses.reduce((s, l) => s + (l.outOfStockCount || 0), 0),
    totalExpiredProducts: warehouses.reduce((s, l) => s + (l.expiredProductCount || 0), 0),
    totalExpiringSoonProducts: warehouses.reduce((s, l) => s + (l.expiringSoonProductCount || 0), 0),
    byWarehouse: warehouses.map((l) => ({
      name: l.destination || l.name,
      lowStock: l.lowStockCount,
      outOfStock: l.outOfStockCount,
      expired: l.expiredProductCount,
      expiringSoon: l.expiringSoonProductCount,
    })),
  };
};

const trimTopicPayload = (topic, data) => {
  if (!data || typeof data !== 'object') return data;
  const copy = { ...data };

  if (topic === 'products' && Array.isArray(copy.products)) {
    copy.products = copy.products.slice(0, 35).map((p) => ({
      name: p.name,
      sku: p.sku,
      category: p.category,
      stock: p.stock,
      price: p.sellingPrice ? `Rs ${p.sellingPrice}` : undefined,
      status: p.status,
      supplier: p.supplier || p.supplierName,
    }));
  } else {
    const listKeys = [
      'lowStock', 'outOfStock', 'expiredBatches', 'expiringSoonBatches',
      'recentSales', 'recentPurchaseOrders', 'recentGoodsReceipts', 'products',
      'vendors', 'supplierNames', 'recentTransfers', 'recentWriteOffs', 'recentRecords',
      'returnedProductsList', 'soldProductsList', 'vendorReturnedProducts', 'topSellingProducts',
      'writeOffProductsList', 'outOfStockProductsList', 'customerReturnedProductsList'
    ];
    for (const key of listKeys) {
      if (Array.isArray(copy[key]) && copy[key].length > 15) {
        copy[key] = copy[key].slice(0, 15);
        copy[`${key}Note`] = 'truncated to top 15';
      }
    }
  }

  if (topic === 'overview' && copy.financials) {
    return {
      source: copy.source,
      answerKey: copy.answerKey,
      financials: copy.financials,
      inventory: copy.inventory,
      expiry: copy.expiry,
    };
  }
  return copy;
};

/**
 * Pack context with critical facts first so truncation never drops answerKey / matched products / catalog / topics.
 */
const shrinkTopicPayloadFurther = (topic, data, targetChars) => {
  if (!data || typeof data !== 'object') return data;
  const copy = JSON.parse(JSON.stringify(data));
  const listKeys = [
    'lowStock', 'outOfStock', 'expiredBatches', 'expiringSoonBatches',
    'recentSales', 'recentPurchaseOrders', 'recentGoodsReceipts', 'products',
    'vendors', 'recentTransfers', 'recentWriteOffs', 'recentRecords', 'counters',
    'sessions', 'recentQueries', 'recentNotifications', 'categories', 'warehouses',
    'byLocation', 'alerts', 'soldProductsList', 'returnedProductsList', 'vendorReturnedProducts'
  ];
  for (const limit of [8, 5, 3, 2]) {
    if (JSON.stringify(copy).length <= targetChars) break;
    for (const key of listKeys) {
      if (Array.isArray(copy[key]) && copy[key].length > limit) {
        copy[key] = copy[key].slice(0, limit);
        copy[`${key}Note`] = `trimmed to top ${limit} for budget`;
      }
    }
  }
  return copy;
};

/**
 * Pack context with topics FIRST so topic-specific queries always receive full data.
 */
const findMatchedVendors = async (tenantId, question = '') => {
  const q = String(question).toLowerCase();
  const VendorModel = require('../models/tenant/Vendor');
  const vendors = await VendorModel.find({ tenantId }).lean();
  const matches = [];
  for (const v of vendors) {
    const name = String(v.name || '').toLowerCase().trim();
    const code = String(v.code || '').toLowerCase().trim();
    if (name.length >= 3 && q.includes(name)) {
      matches.push({
        name: v.name.trim(),
        code: v.code || '—',
        contactPerson: v.contactPerson || '—',
        phone: v.phone || '—',
        email: v.email || '—',
        address: v.address || '—',
        city: v.city || '—',
        status: v.status || 'active',
      });
    } else if (code && code.length >= 2 && q.includes(code)) {
      matches.push({
        name: v.name.trim(),
        code: v.code || '—',
        contactPerson: v.contactPerson || '—',
        phone: v.phone || '—',
        email: v.email || '—',
        address: v.address || '—',
        city: v.city || '—',
        status: v.status || 'active',
      });
    }
  }
  return matches;
};

const serializeRagContext = (context, maxChars = 14000, question = '') => {
  const q = String(question || '').toLowerCase();
  const wantsPerformance =
    /\b(best\s*sell|top\s*sell|most\s*profit|profitable|slow\s*mov|dead\s*stock|behtareen|zyada\s*bech|munafa\s*wali)\b/i.test(q);
  const wantsExpiry = isExpiryQuestion(q);
  const wantsStockAlert = isStockAlertQuestion(q);
  const wantsCatalog = isProductCatalogQuestion(q);

  const performance = context.reports?.productPerformance || context.productPerformanceLists || {};
  const productPerformanceLists = wantsPerformance
    ? {
        bestSelling: performance.bestSelling || [],
        mostProfitable: performance.mostProfitable || [],
        slowMoving: performance.slowMoving || [],
        deadStock: (performance.deadStock || []).slice(0, 20),
        deadStockCount: performance.deadStockCount,
        note: 'Use FULL lists for best-selling / most profitable / dead stock.',
      }
    : undefined;

  const expiryFocus = context.expiryFocus || (wantsExpiry ? context.reports?.expiry : undefined);
  const lowStockTopic = context.topics?.lowStock || {};
  const outOfStockRows =
    lowStockTopic.outOfStock ||
    lowStockTopic.outOfStockProductsList ||
    [];
  const lowStockRows = lowStockTopic.lowStock || [];

  // Prefer location-breakdown name rows when topics were trimmed
  const locationOutOfStock = [];
  const locationLowStock = [];
  (context.reports?.locationBreakdown || []).forEach((loc) => {
    (loc.outOfStock || loc.outOfStockProducts || []).forEach((r) => locationOutOfStock.push(r));
    (loc.lowStock || loc.lowStockProducts || []).forEach((r) => locationLowStock.push(r));
  });

  const outOfStockProductNames = wantsStockAlert
    ? extractProductNames([...outOfStockRows, ...locationOutOfStock])
    : undefined;
  const lowStockProductNames = wantsStockAlert
    ? extractProductNames([...lowStockRows, ...locationLowStock])
    : undefined;

  const cleanReports = context.reports
    ? {
        period: context.reports.period,
        answerKey: context.reports.answerKey,
        financials: wantsExpiry || wantsStockAlert || wantsCatalog ? undefined : context.reports.financials,
        inventory: wantsExpiry || wantsCatalog ? undefined : context.reports.inventory,
        productPerformance: wantsPerformance ? productPerformanceLists : undefined,
        locationBreakdown:
          wantsExpiry || wantsCatalog
            ? undefined
            : wantsStockAlert
              ? (context.reports.locationBreakdown || []).map((l) => ({
                  destination: l.destination,
                  locationType: l.locationType,
                  lowStockCount: l.lowStockCount,
                  outOfStockCount: l.outOfStockCount,
                  lowStockProducts: extractProductNames(l.lowStock || l.lowStockProducts || []),
                  outOfStockProducts: extractProductNames(l.outOfStock || l.outOfStockProducts || []),
                }))
              : context.reports.locationBreakdown,
        lossBreakdown: wantsExpiry || wantsStockAlert || wantsCatalog ? undefined : context.reports.lossBreakdown,
        todayLoss: wantsExpiry || wantsStockAlert || wantsCatalog ? undefined : context.reports.todayLoss,
      }
    : undefined;

  const skipMatchedProducts =
    wantsPerformance ||
    wantsExpiry ||
    wantsStockAlert ||
    wantsCatalog ||
    /\b(all\s*products|saare\s*products|products\s*list)\b/i.test(q);

  const catalogNames = wantsCatalog
    ? extractProductNames([
        ...(context.productCatalog || []),
        ...(context.topics?.products?.products || []),
      ])
    : undefined;

  const priority = {
    // Plain name lists FIRST so truncation never drops product names
    allProductNames:
      wantsCatalog && catalogNames?.length
        ? catalogNames
        : undefined,
    allProductCount: wantsCatalog
      ? catalogNames?.length ||
        context.topics?.products?.summary?.active ||
        context.answerKey?.activeProducts ||
        undefined
      : undefined,
    catalogNote: wantsCatalog
      ? 'List EVERY name in allProductNames. NEVER say remaining names are unavailable if allProductNames has items. If truncatedNote exists, say you listed the included names and state the count.'
      : undefined,
    outOfStockProductNames:
      wantsStockAlert && outOfStockProductNames?.length
        ? outOfStockProductNames
        : undefined,
    lowStockProductNames:
      wantsStockAlert && lowStockProductNames?.length
        ? lowStockProductNames
        : undefined,
    inventoryLists: wantsStockAlert
      ? {
          outOfStock: (outOfStockRows.length ? outOfStockRows : locationOutOfStock).slice(0, 40),
          lowStock: (lowStockRows.length ? lowStockRows : locationLowStock).slice(0, 40),
          note: 'List EVERY name from outOfStockProductNames / lowStockProductNames. NEVER say names unavailable if these arrays have items.',
        }
      : undefined,
    expiredProductNames: wantsExpiry
      ? [
          ...new Set(
            (expiryFocus?.expiredBatches || [])
              .map((r) => r.name || r.productName || r.product)
              .filter(Boolean)
          ),
        ]
      : undefined,
    expiringSoonProductNames: wantsExpiry
      ? [
          ...new Set(
            (expiryFocus?.expiringSoonBatches || [])
              .map((r) => r.name || r.productName || r.product)
              .filter(Boolean)
          ),
        ]
      : undefined,
    answerKey: context.answerKey,
    expiryFocus: wantsExpiry ? expiryFocus : undefined,
    productPerformanceLists,
    matchedProducts: skipMatchedProducts
      ? undefined
      : context.matchedProducts?.length
        ? context.matchedProducts
        : undefined,
    matchedVendors: context.matchedVendors?.length ? context.matchedVendors : undefined,
    topics: {},
    productCatalog:
      !wantsExpiry && !wantsStockAlert && !wantsCatalog && context.productCatalog?.length
        ? context.productCatalog.slice(0, 20)
        : wantsCatalog
          ? (context.productCatalog || []).map((p) => ({
              name: p.name,
              sku: p.sku,
              price: p.price || p.sellingPrice,
            }))
          : undefined,
    purchaseSummary:
      wantsExpiry || wantsStockAlert || wantsCatalog
        ? undefined
        : context.purchaseSummary || undefined,
    focusedLocation: context.focusedLocation || undefined,
    warehouseSummary: wantsCatalog ? undefined : context.warehouseSummary || undefined,
    reports: cleanReports,
  };

  for (const [topic, data] of Object.entries(context.topics || {})) {
    if (wantsExpiry && topic !== 'batches' && topic !== 'warehouses') continue;
    if (wantsStockAlert && topic !== 'lowStock' && topic !== 'warehouses') continue;
    if (wantsCatalog && topic !== 'products') continue;
    let trimmed = trimTopicPayload(topic, data);
    if (wantsCatalog && topic === 'products' && data) {
      trimmed = {
        source: data.source,
        summary: data.summary,
        products: (data.products || []).map((p) => ({
          name: p.name,
          sku: p.sku,
          category: p.category,
          stock: p.stock,
          price: p.sellingPrice || p.price,
          status: p.status,
        })),
      };
    }
    if (wantsStockAlert && topic === 'lowStock' && data) {
      trimmed = {
        source: data.source,
        scope: data.scope,
        summary: data.summary,
        outOfStock: (data.outOfStock || data.outOfStockProductsList || []).slice(0, 40),
        outOfStockProductsList: (data.outOfStockProductsList || data.outOfStock || []).slice(0, 40),
        lowStock: (data.lowStock || []).slice(0, 40),
        locations: data.locations,
      };
    }
    if (wantsExpiry && topic === 'batches' && data) {
      trimmed = {
        source: data.source,
        summary: {
          expiredProductCount: data.summary?.expiredProductCount,
          expiringSoonProductCount: data.summary?.expiringSoonProductCount,
          expiredBatchCount: data.summary?.expiredBatchCount,
          expiringSoonBatchCount: data.summary?.expiringSoonBatchCount,
          storeTotals: data.summary?.storeTotals || data.storeTotals,
          warehouseTotals: data.summary?.warehouseTotals || data.warehouseTotals,
        },
        storeTotals: data.storeTotals,
        warehouseTotals: data.warehouseTotals,
        byLocation: (data.byLocation || data.locationExpiryBreakdown || []).map((l) => ({
          destination: l.destination,
          locationType: l.locationType,
          expiredProductCount: l.expiredProductCount,
          expiringSoonProductCount: l.expiringSoonProductCount,
          expiredProducts: (l.expired || l.expiredProducts || []).map((r) => ({
            name: r.name || r.productName || r.product,
            sku: r.sku,
            batchNumber: r.batchNumber,
            remainingQty: r.remainingQty,
            expiryDate: r.expiryDate,
            daysLeft: r.daysLeft,
          })),
          expiringSoonProducts: (l.expiringSoon || l.expiringSoonProducts || []).map((r) => ({
            name: r.name || r.productName || r.product,
            sku: r.sku,
            batchNumber: r.batchNumber,
            remainingQty: r.remainingQty,
            expiryDate: r.expiryDate,
            daysLeft: r.daysLeft,
          })),
        })),
        expiringSoonBatches: (data.expiringSoonBatches || []).slice(0, 50),
        expiredBatches: (data.expiredBatches || []).slice(0, 50),
      };
    }
    priority.topics[topic] = trimmed;
  }

  let text = JSON.stringify(priority);
  // Prefer keeping name lists; drop heavy sections first
  if (text.length > maxChars && priority.reports?.financials) {
    delete priority.reports.financials;
    text = JSON.stringify(priority);
  }
  if (text.length > maxChars && priority.reports?.lossBreakdown) {
    delete priority.reports.lossBreakdown;
    text = JSON.stringify(priority);
  }
  if (text.length > maxChars && priority.productCatalog?.length && !wantsCatalog) {
    delete priority.productCatalog;
    text = JSON.stringify(priority);
  }
  if (text.length > maxChars && priority.topics?.products?.products?.length > 80) {
    priority.topics.products.products = priority.topics.products.products.slice(0, 80);
    priority.topics.products.truncatedNote = 'Listed first 80 products with details; allProductNames still has full names when present.';
    text = JSON.stringify(priority);
  }
  if (text.length > maxChars && !wantsExpiry && !wantsPerformance && !wantsStockAlert && !wantsCatalog) {
    text = text.slice(0, maxChars) + '…[truncated]';
  } else if (text.length > maxChars) {
    const keepTopics = {};
    if (priority.topics.batches) keepTopics.batches = priority.topics.batches;
    if (priority.topics.lowStock) keepTopics.lowStock = priority.topics.lowStock;
    if (priority.topics.products) keepTopics.products = priority.topics.products;
    if (priority.topics.deadStock) keepTopics.deadStock = priority.topics.deadStock;
    priority.topics = keepTopics;
    // Keep plain name arrays; slim detail lists if needed
    if (priority.allProductNames?.length > 120) {
      priority.allProductNames = priority.allProductNames.slice(0, 120);
      priority.catalogNote =
        'Listed first 120 product names in allProductNames. State the count and list these names — do NOT say names are unavailable.';
    }
    text = JSON.stringify(priority);
    if (text.length > maxChars) text = text.slice(0, maxChars) + '…[truncated]';
  }
  return text;
};

module.exports = {
  normalizeQueryForProductMatch,
  scoreProductMatch,
  findMatchedLocations,
  findMatchedVendors,
  buildFocusedLocationContext,
  buildWarehouseAggregate,
  serializeRagContext,
  isExpiryQuestion,
  isStockAlertQuestion,
  isProductCatalogQuestion,
  PRODUCT_QUERY_STOPWORDS,
};
