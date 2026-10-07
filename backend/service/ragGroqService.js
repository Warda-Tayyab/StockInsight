require('../config/env');

const Groq = require('groq-sdk');

/**
 * Groq retired llama-3.1-8b-instant and llama-3.3-70b-versatile on 16 Aug 2026.
 * Official replacements: openai/gpt-oss-20b and openai/gpt-oss-120b / qwen/qwen3.6-27b
 * Override with GROQ_CHAT_MODEL / GROQ_INSIGHTS_MODEL if needed.
 */
const DEFAULT_CHAT_MODELS = [
  'openai/gpt-oss-20b',
  'qwen/qwen3.8-27b',
  'openai/gpt-oss-120b',
];

const parseModelList = (value, fallback) => {
  const fromEnv = String(value || '')
    .split(',')
    .map((m) => m.trim())
    .filter(Boolean);
  return fromEnv.length ? fromEnv : fallback;
};

const CHAT_MODELS = parseModelList(process.env.GROQ_CHAT_MODEL, DEFAULT_CHAT_MODELS);
const INSIGHTS_MODELS = parseModelList(process.env.GROQ_INSIGHTS_MODEL, DEFAULT_CHAT_MODELS);
const TITLE_MODELS = parseModelList(process.env.GROQ_TITLE_MODEL, ['qwen/qwen3.6-27b', 'openai/gpt-oss-20b']);

/** Keep requests under typical Groq free-tier TPM (~6000) */
const GROQ_SAFE_INPUT_CHARS = 12000; // ~3.5k tokens headroom under 6k with output
const MAX_INSIGHTS_CONTEXT_CHARS = 3500;
const MAX_STORE_CONTEXT_CHARS = 5500;
const MAX_WEB_CONTEXT_CHARS = 1200;
const MAX_HISTORY_TURNS = 3;
const MAX_HISTORY_MSG_CHARS = 400;
const MAX_OUTPUT_TOKENS = 1400;
const MAX_INSIGHTS_OUTPUT_TOKENS = 2500;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const truncateText = (text, max) => {
  const value = String(text || '');
  return value.length <= max ? value : `${value.slice(0, max)}…`;
};

/** Rough char→token estimate (JSON / mixed languages ≈ 3.2 chars/token) */
const estimateTokens = (text) => Math.ceil(String(text || '').length / 3.2);

const getGroqClient = () => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('GROQ_API_KEY is not configured in .env');
  }
  return new Groq({
    apiKey,
    timeout: 60000,
    maxRetries: 2,
  });
};

const isTransientGroqError = (err) => {
  const msg = String(err?.message || '').toLowerCase();
  const cause = String(err?.cause?.code || err?.cause?.message || err?.cause || '').toLowerCase();
  return (
    msg.includes('connection') ||
    msg.includes('timeout') ||
    msg.includes('timed out') ||
    msg.includes('fetch failed') ||
    msg.includes('network') ||
    msg.includes('econnreset') ||
    msg.includes('etimedout') ||
    msg.includes('socket') ||
    cause.includes('econnreset') ||
    cause.includes('etimedout') ||
    cause.includes('fetch failed') ||
    cause.includes('und_err')
  );
};

const isTokenLimitError = (err) => {
  const msg = String(err?.message || '').toLowerCase();
  const code = String(err?.error?.code || err?.code || '').toLowerCase();
  return (
    code === 'rate_limit_exceeded' ||
    msg.includes('rate_limit') ||
    msg.includes('request too large') ||
    msg.includes('tokens per minute') ||
    msg.includes('tpm') ||
    err?.status === 413 ||
    err?.status === 429
  );
};

const isModelNotFoundError = (err) => {
  const msg = String(err?.message || '').toLowerCase();
  const code = String(err?.error?.code || err?.code || '').toLowerCase();
  return (
    err?.status === 404 ||
    code === 'model_not_found' ||
    code === 'model_decommissioned' ||
    msg.includes('does not exist') ||
    msg.includes('model_not_found') ||
    msg.includes('decommissioned')
  );
};

const groqCreateOptions = (model, extra = {}) => {
  const options = { model, ...extra };
  if (options.reasoning_effort && !['low', 'medium', 'high'].includes(options.reasoning_effort)) {
    delete options.reasoning_effort;
  }
  return options;
};

const stripModelReasoning = (text) => {
  let result = String(text || '');
  result = result.replace(/[\s\S]*?<\/think>/gi, '');
  result = result.replace(/<redacted_thinking[\s\S]*?<\/redacted_thinking>/gi, '');
  result = result.replace(/<think[\s\S]*$/gi, '');
  result = result.replace(/Here'?s a thinking process:[\s\S]*/gi, '');
  return result.replace(/^\s*Title:\s*/i, '').trim();
};

const sanitizeAssistantText = (text) => stripModelReasoning(String(text || '').trim());

const isValidTitle = (title) => {
  if (!title || title.length < 2 || title.length > 80) return false;
  if (/<think|redacted_thinking|thinking process/i.test(title)) return false;
  if (/^[\s<]/.test(title)) return false;
  return true;
};

const buildRuleBasedTitle = (message) => {
  const q = String(message || '').trim();
  const lower = q.toLowerCase();
  const rules = [
    [/low stock|stock kam/i, 'Low stock products'],
    [/expir|expire/i, 'Expired products'],
    [/dead stock/i, 'Dead stock'],
    [/loss|nuksan/i, 'Loss inquiry'],
    [/profit|munafa|p&l/i, 'Profit & loss'],
    [/sales|farokht/i, 'Sales summary'],
    [/purchase|grn|kharid/i, 'Purchasing'],
    [/transfer/i, 'Stock transfer'],
    [/vendor|supplier/i, 'Vendors'],
    [/batch/i, 'Batch tracking'],
  ];
  for (const [pattern, title] of rules) if (pattern.test(lower)) return title;
  const words = q.split(/\s+/).slice(0, 6).join(' ');
  return words.length <= 48 ? words || 'New Chat' : `${words.slice(0, 45)}...`;
};

const extractMessageText = (completion) => {
  const message = completion?.choices?.[0]?.message || {};
  const content = message.content;
  if (typeof content === 'string' && content.trim()) return content.trim();
  if (Array.isArray(content)) {
    const joined = content
      .map((part) => (typeof part === 'string' ? part : part?.text || ''))
      .join('')
      .trim();
    if (joined) return joined;
  }
  return '';
};

const SYSTEM_PROMPT = `You are StockInsight AI — a helpful inventory assistant for a multi-tenant stock management system.

You may be given store data (from this shop's own database) and/or general web information, depending on the question. Treat whatever you're given simply as things you know — the way a knowledgeable store manager would just "know" both their own stock and general market facts.

LANGUAGE RULES (very important):
- Understand questions in English, Urdu (اردو), and Roman Urdu/Urdu written in English letters (e.g. "stock kam hai?", "sales kitni hui?", "kaun se products low hain?").
- ALWAYS reply in the SAME language/style the user used. If they ask in Roman Urdu, answer in Roman Urdu. If English, answer in English. If Urdu script, answer in Urdu script.
- Keep product names, SKUs, numbers, and currency (Rs) exactly as given in the store data.

CONVERSATION RULES (ChatGPT-style memory):
- This is a multi-turn chat in ONE continuous thread. Earlier user/assistant messages are part of the same conversation.
- Resolve short follow-ups and pronouns from earlier turns (e.g. "uski quantity?", "aur price?", "woh product", "upar wali sale", "oper tm ne jo bataya").
- If the user clearly continues the previous topic, stay on that same product/sale/warehouse unless they switch topics.
- Do not ask the user to repeat details that were already given earlier in this chat, unless the store data no longer covers them.

ANSWER RULES:
- If the store data includes a "matchedProducts" section AND the user clearly named that product, use matchedProducts for that product. For GLOBAL list questions (best selling, most profitable, all expiring soon, all products), IGNORE matchedProducts and use the full lists below instead.
- "productPerformanceLists" (and reports.productPerformance) has COMPLETE ranked lists:
  * bestSelling — top products by quantity sold (name, sku, sold, revenue, profit)
  * mostProfitable — top products by profit (name, sku, sold, revenue, profit)
  * slowMoving — lowest sellers with sales > 0
  * deadStock — purchased products with zero sales in the period
  When asked for best-selling or most profitable products, list from these arrays. NEVER say the list is unavailable if the array has items. NEVER answer with a single unmatched product that has Rs 0 profit if a ranked list exists.
- For expiring soon / expired batch lists: ALWAYS use top-level "expiryFocus" first (then topics.batches). It has:
  * counts — expiredProducts, expiringSoonProducts, warehouseExpiredProducts, warehouseExpiringSoonProducts, storeExpiredProducts, storeExpiringSoonProducts
  * storeTotals / warehouseTotals — location-type totals
  * byLocation — each warehouse/store with expiredProducts and expiringSoonProducts name lists
  * expiredBatches / expiringSoonBatches — FULL lists with name, batchNumber, destination, remainingQty, expiryDate, daysLeft
  Answer with: (1) warehouse vs store counts, (2) every product/batch name. NEVER say names unavailable if expiryFocus lists have items. Do not stop after one item.
- Check the "topics" section in the data thoroughly for domain-specific queries:
  * For return product questions ("return products", "wapsi products", "returned items", "customer return", "vendor return", "kitni products return", "return cost"): Check 'topics.returnExchanges' — list items from 'customerReturnedProductsList' and 'vendorReturnedProducts' with product names, quantities, refund/credit amounts, and reasons.
  * For sales product questions ("sales products", "beche gaye products", "sales items", "kon se products sell hue"): Check 'topics.sales' — list items from 'soldProductsList' and 'topSellingProducts' with product names, quantity sold, and revenue.
  * For catalog / product list questions ("products list", "saare products", "all products", "total products ke naam", "product names"): Check top-level allProductNames FIRST, then topics.products.products / productCatalog — list EVERY name in allProductNames. NEVER say remaining names are unavailable if allProductNames has items. If allProductCount is larger than the listed array, list every name present and state the count honestly.
  * For vendor / supplier questions ("vendors", "suppliers", "supplier names", "kitne suppliers"): Check 'topics.vendors.supplierNames' or 'topics.vendors.vendors' — list ONLY the exact registered vendor names from topics.vendors (e.g. Mirab, Warda, usman). NEVER count or list unregistered free-text supplier names from products (like Alfalah or Nestle) if they are not in topics.vendors.vendors.
  * For purchase / GRN questions ("purchases", "grn", "goods receipts", "purchase items"): Check 'topics.purchasing' — list orders, GRNs, and purchase items.
  * For write off / damaged product questions ("write off", "write off products", "write off list", "damaged products", "kharab maal", "zaya"): Check 'topics.writeOffs.writeOffProductsList' and 'topics.writeOffs.recentWriteOffs' — list the written off product names (e.g. Body Lotion 200ml), quantities, conditions, and line values.
  * For stock out / out of stock questions ("out of stock", "stock out", "stockout", "khatam stock", "out of stock products ke name"): Check top-level outOfStockProductNames AND inventoryLists.outOfStock AND topics.lowStock.outOfStock — list EVERY product name. NEVER say names unavailable if outOfStockProductNames or inventoryLists.outOfStock has items. Counts alone are not enough — always list the names.
  * For low stock questions ("low stock", "kam stock", "low stock products ke name"): Check top-level lowStockProductNames AND inventoryLists.lowStock AND topics.lowStock.lowStock — list EVERY product name. NEVER say names unavailable if those arrays have items.
  * For expired product questions ("expired products ke name btao", "expired products"): Check top-level expiredProductNames AND expiryFocus.expiredBatches — list EVERY product name. NEVER say names unavailable if expiredProductNames or expiryFocus.expiredBatches has items. Counts alone are not enough — always list the names.
  * For expiring soon product questions ("expiring soon products ke name btao"): Check top-level expiringSoonProductNames AND expiryFocus.expiringSoonBatches — list EVERY product name. NEVER say names unavailable if those arrays have items.
  * For store vs warehouse expired/expiring counts: use expiryFocus.counts / storeTotals / warehouseTotals AND list names from expiryFocus.byLocation.
  * For batch questions ("baches", "batch", "sugar baches", "batch list", "sugar batch"): Check 'matchedProducts' (activeBatches) or 'topics.batches.allActiveBatches' — list each batch with batchNumber, product name, remaining quantity, warehouse/location name, expiry date, days left, and status.
  * For location-wise expired questions ("warehouse me expired", "store me expired", "city me expired", "godam me expired"): Check 'reports.answerKey' (warehouseExpiredProducts, storeExpiredProducts) or 'reports.locationBreakdown' / 'topics.batches.byLocation' / 'topics.batches.warehouseTotals' and 'topics.batches.storeTotals'. State exact counts for Warehouse vs Store (City Mart) and list product names, quantities, and locations.
  * For location-wise expiring soon questions ("warehouse me expiring soon", "store me expiring soon", "city me expiring soon"): Check 'reports.answerKey' (warehouseExpiringSoonProducts, storeExpiringSoonProducts) or 'reports.locationBreakdown' / 'topics.batches.byLocation' / 'topics.batches.warehouseTotals' and 'topics.batches.storeTotals'. State exact counts for Warehouse vs Store (City Mart) and list product names, quantities, and days left.
  * For tax questions ("tax", "tax rate", "tax percent", "tax label", "tax kitna hai", "tax gathered", "tax collected", "kitna tax gather", "tax collection"): Check 'reports.answerKey.totalTaxGathered' and 'topics.tax.summary' — report tax rate (e.g. 8%), tax label (e.g. Tax), and total tax gathered/collected from sales (e.g. Rs 24,895).
  * For supplier / vendor contact questions ("supplier number", "supplier phone", "vendor number", "supplier contact", "vendor phone"): Check 'topics.vendors.vendors' — list supplier name, contact person, phone number, email, address, and city.
  * For warehouse / store contact questions ("warehouse number", "warehouse phone", "store number", "godam phone", "warehouse contact"): Check 'topics.warehouses.warehouses' — list warehouse/store name, contact person, phone number, email, address, city, and manager.
  * For coupon questions ("coupon", "coupons", "promo code", "code"): Check 'topics.coupons.coupons' — list active coupon codes (e.g. SAVE), discount values (e.g. Rs 500), min order amount, max uses, used count, and validity dates.
  * For discount questions ("discount", "discounts", "store discount", "sale discount", "offer"): Check 'topics.discounts.discounts' — list active discount names (e.g. summer sale), discount values (e.g. 10%), scope, applicable products, and validity dates.
- For supplier/vendor list or contact questions, list ONLY vendor names and details directly from topics.vendors.vendors / topics.vendors.supplierNames (e.g. Mirab, Warda, usman) — NEVER count or list free-text product supplier names (like Alfalah or Nestle) if they are not in topics.vendors.vendors.
- For warehouse/store contact questions ("warehouse phone", "store number", "godam contact"), list warehouse/store name, phone number, email, contact person, address, and city directly from topics.warehouses.warehouses — NEVER say warehouse contact is unavailable if topics.warehouses exists.
- For batch questions about a named product, list from matchedProducts.activeBatches (batchNumber, warehouse, remainingQty, expiryDate, daysLeft, status).
- For purchase questions ("kitni items purchase ki", "total purchase amount"), use purchaseSummary or answerKey.totalItemsPurchased, answerKey.netPurchases, answerKey.grnCount — NEVER say item count is unavailable if these fields exist.
- For warehouse/location questions, use focusedLocation (specific warehouse) or warehouseSummary / reports.locationBreakdown — NEVER say warehouse low stock is unavailable if these exist.
- The top-level "answerKey" object has the canonical counts for low stock, out of stock, expired, expiring soon, sales, purchases, profit, loss.
- Just answer the question directly and naturally, like ChatGPT would — start with the answer, not with a description of where it came from.
- Never invent products, quantities, sales, dates, or figures that aren't in what you were given (or clearly established earlier in this chat).
- Never say phrases like "according to internal data", "according to external data", "based on the provided context/data", "internal inventory data shows", "external web data shows", "from the database", etc. Just state the fact.
- If you were given both store facts and general/market info and both matter, blend them into normal prose (e.g. mention the store numbers, then naturally add relevant market context in the next sentence) — without labeling which part came from which source.
- Be accurate, concise, and to the point — no filler or long introductions.
- Use bullet points or numbered lists when listing multiple items.
- If something wasn't given to you in any field or topic and is 0/empty, state clearly (e.g. "Abhi tak koi return record nahi hua hai" or "Abhi tak koi product sell nahi hua") instead of generic missing text.
- Do not mention JSON, databases, APIs, Tavily, Groq, "context", or any internal source names — speak naturally as yourself.
- Currency for store data is Pakistani Rupees (Rs).

EXPIRY SYSTEM METRICS RULES:
- Expired products: use reports.answerKey.expiredProducts (unique products with remaining stock past expiry — NOT batch count).
- Expiring soon: use reports.answerKey.expiringSoonProducts (within next 6 months, remaining stock > 0).
- Location-wise Expiry Breakdown:
  * Warehouse/Godown Expired Products Count = reports.answerKey.warehouseExpiredProducts (or topics.batches.warehouseTotals.expiredProductCount)
  * Store/City Mart Expired Products Count = reports.answerKey.storeExpiredProducts (or topics.batches.storeTotals.expiredProductCount)
  * Warehouse/Godown Expiring Soon Products Count = reports.answerKey.warehouseExpiringSoonProducts (or topics.batches.warehouseTotals.expiringSoonProductCount)
  * Store/City Mart Expiring Soon Products Count = reports.answerKey.storeExpiringSoonProducts (or topics.batches.storeTotals.expiringSoonProductCount)
- Financial Amounts for Expiry: Check 'topics.batches.summary' or 'topics.batches.storeTotals' and 'topics.batches.warehouseTotals':
  * Global Total Expired Amount = topics.batches.summary.expiredTotalCostValue (or expiredTotalSellingValue).
  * Global Total Expiring Soon Amount = topics.batches.summary.expiringSoonTotalCostValue (or expiringSoonTotalSellingValue).
  * Store Expired & Expiring Soon Amount = topics.batches.summary.storeTotals (expiredCostValue, expiringSoonCostValue).
  * Warehouse/Godown Expired & Expiring Soon Amount = topics.batches.summary.warehouseTotals (expiredCostValue, expiringSoonCostValue).
- When asked location-wise (warehouse/store/godown), use topics.batches.locationExpiryBreakdown or reports.locationBreakdown — each location entry provides expiredProductCount, expiringSoonProductCount, expiredCostValue, expiringSoonCostValue, and product/batch lists.
- Product Batch Details: Every product in topics.products.products or matchedProducts has an 'activeBatches' list containing batchNumber, warehouse location, remainingQty, expiryDate, daysLeft, and status (Expired / Expiring Soon / Valid).
- ALWAYS distinguish ALREADY EXPIRED vs EXPIRING SOON.

STOCK ALERT RULES (critical — match Reports dashboard):
- Low stock count = reports.answerKey.lowStockProducts ONLY (purchased products, per location, qty ≤ reorder level).
- Out of stock = reports.answerKey.outOfStockProducts — a SEPARATE count. NEVER add low stock + out of stock together unless the user explicitly asks for both.
- If user asks "kitne products low stock hain?" give ONLY the low stock number, not out-of-stock.
- When user asks for names ("naam", "name", "list", "batao"), ALWAYS list from outOfStockProductNames / lowStockProductNames / inventoryLists. NEVER reply that names are unavailable when those arrays are non-empty.

PROFIT & LOSS RULES:
- Net Sales, COGS, Gross Profit, Operating Loss, Net Profit, Net Purchases come from reports.financials / reports.answerKey — same formulas as Reports module.
- "Aaj kitna loss" / today's loss = reports.answerKey.todayLoss (write-offs + purchase return shortfall in TODAY's period). Do NOT confuse with expired stock snapshot or operating loss unless user asks for full P&L.
- Operating loss includes write-offs, expired inventory value snapshot, and purchase return shortfall for the selected period.
- Dead stock count = reports.answerKey.deadStockProducts (purchased products with zero net sales in period).

- For supplier/vendor questions ("supplier names", "vendors", "kon se supplier hain"), check topics.vendors (vendors / supplierNames) and product catalog supplier fields. List supplier names directly. NEVER say supplier info is unavailable if vendors or product catalog exists.
- For write-off / damaged / zaya product questions ("write off", "write of", "damaged items"), check topics.writeOffs (recentWriteOffs list with productName, quantity, condition, reason, lineValue). List the written-off products directly.
- For return / exchange questions ("return", "returns", "eturn", "wapsi"), check topics.returnExchanges (returnedProductsList or recentRecords returnedItems with productName, quantity, reason). List the returned products and details directly.
- Store data includes "matchedProducts", "productCatalog", "allProductNames", or "products" lists containing real product names and details. When asked for product names or available products, list them directly from allProductNames / productCatalog / topics.products. NEVER invent a claim that remaining names are unavailable when allProductNames (or products list) is present.
- Never output internal reasoning, thinking tags, or "here's my analysis" preamble — answer like ChatGPT.`;

const buildUserMessage = (question, inventoryBlock, webBlock) => {
  const parts = [];
  if (inventoryBlock) parts.push(`Store data you know:\n${inventoryBlock}`);
  if (webBlock) parts.push(`General/market info you know:\n${webBlock}`);
  if (!inventoryBlock && !webBlock) {
    parts.push(
      `(You don't have specific store or web data for this question — answer from general knowledge if you can, or say briefly that you don't have this info.)`
    );
  }

  return `${parts.join('\n\n')}

Question:
${question}

Answer directly and naturally, in one voice — do not label or mention which part of your answer came from which source. If this continues an earlier turn in this chat, use that conversation memory:`;
};

const buildChatMessages = ({
  question,
  contextText,
  webContextText = '',
  history = [],
  storeChars = MAX_STORE_CONTEXT_CHARS,
  webChars = MAX_WEB_CONTEXT_CHARS,
  historyTurns = MAX_HISTORY_TURNS,
  historyMsgChars = MAX_HISTORY_MSG_CHARS,
}) => {
  const inventoryBlock = contextText?.trim()
    ? truncateText(contextText.trim(), storeChars)
    : '';
  const webBlock = webContextText?.trim()
    ? truncateText(webContextText.trim(), webChars)
    : '';

  const messages = [{ role: 'system', content: SYSTEM_PROMPT }];

  const prior = Array.isArray(history) ? history.slice(-historyTurns) : [];
  prior.forEach((turn) => {
    if (turn?.question) {
      messages.push({
        role: 'user',
        content: truncateText(turn.question, historyMsgChars),
      });
    }
    if (turn?.response) {
      messages.push({
        role: 'assistant',
        content: truncateText(turn.response, historyMsgChars),
      });
    }
  });

  messages.push({
    role: 'user',
    content: buildUserMessage(question, inventoryBlock, webBlock),
  });

  // Final safety: if still over budget, drop history then shrink store context
  const totalChars = messages.reduce((sum, m) => sum + String(m.content || '').length, 0);
  if (totalChars > GROQ_SAFE_INPUT_CHARS && historyTurns > 0) {
    return buildChatMessages({
      question,
      contextText,
      webContextText,
      history: [],
      storeChars,
      webChars,
      historyTurns: 0,
      historyMsgChars,
    });
  }
  if (totalChars > GROQ_SAFE_INPUT_CHARS && storeChars > 2000) {
    return buildChatMessages({
      question,
      contextText,
      webContextText: '',
      history: [],
      storeChars: Math.floor(storeChars * 0.6),
      webChars: 0,
      historyTurns: 0,
      historyMsgChars,
    });
  }

  return messages;
};

/**
 * @param {string} question
 * @param {string} contextText
 * @param {string} [webContextText]
 * @param {Array<{question: string, response: string}>} [history] prior turns in this chat (oldest → newest)
 */
const generateAnswer = async (question, contextText, webContextText = '', history = []) => {
  const client = getGroqClient();

  const payloadTiers = [
    {
      storeChars: GROQ_SAFE_INPUT_CHARS,
      webChars: MAX_WEB_CONTEXT_CHARS,
      historyTurns: MAX_HISTORY_TURNS,
      historyMsgChars: MAX_HISTORY_MSG_CHARS,
    },
    {
      storeChars: 5000,
      webChars: 600,
      historyTurns: 2,
      historyMsgChars: 250,
    },
    {
      storeChars: 3500,
      webChars: 0,
      historyTurns: 1,
      historyMsgChars: 200,
    },
  ];

  let lastError;

  for (const model of CHAT_MODELS) {
    for (let tierIdx = 0; tierIdx < payloadTiers.length; tierIdx += 1) {
      const tier = payloadTiers[tierIdx];
      const messages = buildChatMessages({
        question,
        contextText,
        webContextText: tier.webChars > 0 ? webContextText : '',
        history: tier.historyTurns > 0 ? history : [],
        ...tier,
      });

      const approxTokens = messages.reduce((sum, m) => sum + estimateTokens(m.content), 0)
        + MAX_OUTPUT_TOKENS;
      console.log(
        `RAG Groq request ~${approxTokens} tokens (model=${model}, tier=${tierIdx + 1})`
      );

      let modelDailyLimitHit = false;
      for (let attempt = 1; attempt <= 2; attempt += 1) {
        try {
          const completion = await client.chat.completions.create(
            groqCreateOptions(model, {
              messages,
              temperature: 0.2,
              max_tokens: MAX_OUTPUT_TOKENS,
            })
          );

          const text = sanitizeAssistantText(extractMessageText(completion));
          if (text) return text;
        } catch (err) {
          lastError = err;
          const detail = err?.cause?.code || err?.cause?.message || '';
          console.warn(
            `RAG Groq model ${model} failed (attempt ${attempt}):`,
            err.message,
            detail ? `[${detail}]` : ''
          );

          if (isModelNotFoundError(err)) {
            break;
          }

          if (isTokenLimitError(err)) {
            const isDailyLimit = /tokens per day|tpd|daily/i.test(err.message || '');
            if (isDailyLimit) {
              console.warn(`[RAG Groq] Model ${model} hit TPD daily limit, switching model...`);
              modelDailyLimitHit = true;
              break;
            }
            // Shrink payload and/or wait for TPM window
            if (tierIdx < payloadTiers.length - 1) {
              await sleep(1200);
              break; // next smaller tier
            }
            await sleep(2000 * attempt);
            if (attempt < 2) continue;
            break;
          }

          if (isTransientGroqError(err) && attempt < 2) {
            await sleep(700 * attempt);
            continue;
          }
          break;
        }
      }

      if (modelDailyLimitHit) break;
      if (lastError && isModelNotFoundError(lastError)) break;

      // Only escalate to smaller tiers on token errors; otherwise try next model
      if (lastError && !isTokenLimitError(lastError)) break;
    }
  }

  throw lastError || new Error('Failed to generate AI response');
};

const INSIGHTS_SYSTEM_PROMPT = `You are StockInsight AI — a professional store inventory analyst for a retail/wholesale shop in Pakistan.

Your job is NOT to dump reports or repeat raw tables. Reports already show KPIs, charts, and lists.
Your job is to ANALYZE the live store database snapshot and write a short AI briefing a store manager can act on today.

CRITICAL FORMATTING INSTRUCTIONS:
- You MUST ALWAYS output valid JSON matching the exact schema below.
- DO NOT include any thinking process, reasoning tags (<think>), conversational preamble ("I am ready to...", "Here are the insights..."), questions, chatter, or markdown text outside the JSON.
- Start your response directly with { and end with }.
- Even if the data provided is minimal or summary-level, synthesize actionable insights from whatever data is available into the requested JSON schema. NEVER decline to respond or ask for more data.

STRICT RULES:
- Use ONLY numbers, product names, SKUs, and facts from the provided data. Never invent data.
- Currency is Pakistani Rupees (Rs).
- Write like a smart analyst: clear, specific, and practical — not like a dashboard dump.
- Generate exactly 4 to 6 insights. Each must be UNIQUE and decision-focused.
- Prefer the most important risks/opportunities only (stockouts, cash tied in dead stock, expiry waste, return problems, sales momentum, reorder urgency).
- Do NOT restate obvious report labels like "Inventory Value is X" unless you explain WHY it matters and WHAT to do.
- Every insight MUST include:
  - summary: one sharp finding with real numbers
  - explanation: why this matters for THIS store
  - recommendation: one concrete next action (product names + qty when possible)
  - dataPoints: 3-5 supporting facts from the data
- Also return:
  - executiveSummary: 2-3 sentence AI overview of store health
  - recommendations: 3-5 priority actions (not duplicates of insight titles if avoidable)

Respond with ONLY valid JSON matching this schema:
{
  "executiveSummary": "2-3 sentences on overall store inventory health",
  "insights": [
    {
      "id": "kebab-case-id",
      "title": "Short decision-focused title",
      "type": "sales|inventory|batch|analysis|forecast|returns|supplier|anomaly",
      "category": "stock_risk|sales_momentum|expiry|returns|reorder|dead_stock|supplier|anomaly",
      "summary": "One sentence finding with real numbers",
      "confidence": 85,
      "impact": "high|medium|low",
      "explanation": "2-3 sentences: why this matters for the store",
      "recommendation": "One concrete next step with names/quantities when possible",
      "dataPoints": [{ "label": "Label", "value": "Value from data" }]
    }
  ],
  "recommendations": [
    {
      "id": "rec-1",
      "title": "Short action title",
      "action": "Specific actionable step",
      "priority": "high|medium|low",
      "category": "reorder|stock|sales|returns|expiry|supplier"
    }
  ]
}`;

const VALID_TYPES = new Set([
  'sales', 'inventory', 'batch', 'analysis', 'forecast', 'returns', 'supplier', 'anomaly'
]);
const VALID_IMPACTS = new Set(['high', 'medium', 'low']);
const VALID_PRIORITIES = new Set(['high', 'medium', 'low']);

const parseInsightsResponse = (text) => {
  let cleaned = stripModelReasoning(String(text || '')).trim();
  cleaned = cleaned
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();

  // Extract JSON object if embedded in prose or reasoning
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    cleaned = jsonMatch[0];
  }

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch (err) {
    console.warn('Failed to parse JSON in parseInsightsResponse:', err.message);
    return { insights: [], recommendations: [], executiveSummary: '' };
  }

  const list = Array.isArray(parsed.insights) ? parsed.insights : Array.isArray(parsed) ? parsed : [];

  const insights = list.map((item, index) => {
    const confidence = Math.min(99, Math.max(40, Number(item.confidence) || 70));
    const type = VALID_TYPES.has(item.type) ? item.type : 'analysis';
    const impact = VALID_IMPACTS.has(item.impact) ? item.impact : 'medium';

    const dataPoints = Array.isArray(item.dataPoints)
      ? item.dataPoints
          .filter((p) => p && p.label && p.value !== undefined)
          .map((p) => ({
            label: String(p.label),
            value: typeof p.value === 'number' ? p.value : String(p.value)
          }))
      : [];

    const recommendation = String(
      item.recommendation || item.action || item.nextStep || ''
    ).trim();

    return {
      id: item.id || `insight-${index + 1}`,
      title: item.title || 'Inventory Insight',
      type,
      category: item.category || type,
      summary: item.summary || '',
      confidence,
      impact,
      explanation: item.explanation || item.summary || '',
      recommendation,
      dataPoints,
      timestamp: new Date()
    };
  }).filter((item) => item.summary && item.dataPoints.length > 0);

  const recommendations = Array.isArray(parsed.recommendations)
    ? parsed.recommendations
        .filter((r) => r && (r.action || r.title))
        .map((r, index) => ({
          id: r.id || `rec-${index + 1}`,
          title: r.title || `Recommendation ${index + 1}`,
          action: r.action || r.title,
          priority: VALID_PRIORITIES.has(r.priority) ? r.priority : 'medium',
          category: r.category || 'stock'
        }))
    : insights
        .filter((i) => i.recommendation)
        .slice(0, 5)
        .map((i, index) => ({
          id: `rec-${index + 1}`,
          title: i.title,
          action: i.recommendation,
          priority: i.impact,
          category: i.category || i.type
        }));

  const executiveSummary = String(parsed.executiveSummary || '').trim();

  return { insights, recommendations, executiveSummary };
};

const trimInsightsContext = (contextText) => {
  const text = String(contextText || '');
  if (text.length <= MAX_INSIGHTS_CONTEXT_CHARS) return text;
  return `${text.slice(0, MAX_INSIGHTS_CONTEXT_CHARS)}...[truncated]`;
};

const buildFallbackInsights = (contextText = '') => {
  let lowStockCount = 0;
  let expiredCount = 0;
  let outOfStockCount = 0;

  try {
    const data = JSON.parse(contextText);
    const key = data.reports?.answerKey || {};
    lowStockCount = key.lowStockProducts || 0;
    expiredCount = key.expiredProducts || 0;
    outOfStockCount = key.outOfStockProducts || 0;
  } catch (_) {
    // Ignore JSON parse errors for raw string context
  }

  const insights = [
    {
      id: 'insight-stock-status',
      title: 'Store Inventory Status Summary',
      type: 'inventory',
      category: 'stock_risk',
      summary: `Store inventory shows ${lowStockCount} low stock items and ${outOfStockCount} out of stock items.`,
      confidence: 90,
      impact: outOfStockCount > 0 || lowStockCount > 0 ? 'high' : 'medium',
      explanation: 'Maintaining adequate stock levels ensures uninterrupted operations and customer satisfaction.',
      recommendation: 'Review inventory levels and initiate reorders for critically low or out-of-stock items.',
      dataPoints: [
        { label: 'Low Stock Products', value: lowStockCount },
        { label: 'Out of Stock Products', value: outOfStockCount },
        { label: 'Expired Products', value: expiredCount }
      ],
      timestamp: new Date()
    }
  ];

  const recommendations = [
    {
      id: 'rec-1',
      title: 'Reorder Low Stock Items',
      action: 'Check items at or below reorder levels and issue purchase orders to suppliers.',
      priority: 'high',
      category: 'reorder'
    }
  ];

  return {
    executiveSummary: 'AI analysis briefing for store operations and stock management.',
    insights,
    recommendations
  };
};

const generateInsights = async (contextText) => {
  const client = getGroqClient();
  const contextTiers = [MAX_INSIGHTS_CONTEXT_CHARS, 2200, 1400];

  let lastError;

  for (const model of INSIGHTS_MODELS) {
    for (const maxChars of contextTiers) {
      const trimmedContext = truncateText(String(contextText || ''), maxChars);
      const userMessage = `LIVE STORE DATABASE SNAPSHOT (analyzed metrics — do not repeat as a report):
${trimmedContext}

Synthesize a decision briefing for the store manager. Output ONLY raw JSON strictly adhering to the schema. Do not write preamble or conversation.`;

      // Try with response_format first
      try {
        const completion = await client.chat.completions.create(
          groqCreateOptions(model, {
            messages: [
              { role: 'system', content: INSIGHTS_SYSTEM_PROMPT },
              { role: 'user', content: userMessage }
            ],
            temperature: 0.15,
            max_tokens: MAX_INSIGHTS_OUTPUT_TOKENS,
            response_format: { type: 'json_object' }
          })
        );

        const text = extractMessageText(completion);
        if (text) {
          const parsed = parseInsightsResponse(text);
          if (parsed.insights.length > 0) return parsed;
        }
      } catch (err) {
        lastError = err;
        console.warn(`RAG Groq insights model ${model} (json_object) failed:`, err.message);

        if (isModelNotFoundError(err)) break;

        if (isTokenLimitError(err)) {
          await sleep(1200);
          continue; // smaller context tier
        }
      }

      // Retry without strict response_format if json_validate_failed or 400 occurred
      try {
        const completion = await client.chat.completions.create(
          groqCreateOptions(model, {
            messages: [
              { role: 'system', content: INSIGHTS_SYSTEM_PROMPT },
              { role: 'user', content: userMessage }
            ],
            temperature: 0.15,
            max_tokens: MAX_INSIGHTS_OUTPUT_TOKENS
          })
        );

        const text = extractMessageText(completion);
        if (text) {
          const parsed = parseInsightsResponse(text);
          if (parsed.insights.length > 0) return parsed;
        }
      } catch (retryErr) {
        lastError = retryErr;
        console.warn(`RAG Groq insights model ${model} (plain retry) failed:`, retryErr.message);

        if (isModelNotFoundError(retryErr)) break;
        if (isTokenLimitError(retryErr)) {
          await sleep(1200);
          continue;
        }
      }
    }
  }

  // If all models/attempts fail, return clean fallback insights rather than crashing
  console.warn('All Groq insight model attempts failed; returning fallback insights briefing.', lastError?.message);
  return buildFallbackInsights(contextText);
};

const generateChatTitle = async (firstMessage) => {
  const ruleFallback = buildRuleBasedTitle(firstMessage);

  let client;
  try {
    client = getGroqClient();
  } catch {
    return ruleFallback;
  }

  const prompt = `You are naming a chat in an inventory management app (like ChatGPT auto-titles).

Read the user's first message and write a short, clear chat title (3–6 words).
- Use the SAME language as the message (English, Urdu script, or Roman Urdu).
- Describe the topic, not a full sentence. No quotes, no punctuation at the end.
- Reply with ONLY the title — no explanation, no thinking, no tags.

Message: ${truncateText(firstMessage, 300)}`;

  for (const model of TITLE_MODELS) {
    for (let attempt = 1; attempt <= 2; attempt += 1) {
      try {
        const completion = await client.chat.completions.create(
          groqCreateOptions(model, {
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.2,
            max_tokens: 24,
          })
        );

        const title = stripModelReasoning(extractMessageText(completion))
          .replace(/^["']|["']$/g, '')
          .replace(/[.!?]+$/g, '')
          .trim()
          .slice(0, 80);

        if (isValidTitle(title)) return title;
      } catch (err) {
        console.warn(`RAG Groq title model ${model} failed (attempt ${attempt}):`, err.message);
        if (isModelNotFoundError(err)) break;
        if ((isTransientGroqError(err) || isTokenLimitError(err)) && attempt < 2) {
          await sleep(500 * attempt);
          continue;
        }
        break;
      }
    }
  }

  return ruleFallback;
};

module.exports = { generateAnswer, generateInsights, generateChatTitle, isTokenLimitError };

