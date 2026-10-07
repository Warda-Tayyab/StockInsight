/**
 * Tavily web search — external knowledge for RAG answers.
 * Docs: POST https://api.tavily.com/search
 *
 * Policy: store/inventory questions stay INTERNAL-ONLY.
 * Web search only when the question clearly needs outside knowledge.
 */
require('../config/env');

const TAVILY_URL = 'https://api.tavily.com/search';

const isInventoryQuestion = (question = '') => {
  const q = String(question).toLowerCase();

  const inventoryHints = [
    /\b(stock|inventory|product|products|sku|barcode|warehouse|warehouses|batch|batches|sale|sales|revenue|invoice|pos|reorder|low stock|out of stock|return|exchange|write-?off|category|categories|supplier|godown|mal|samaan)\b/i,
    /\b(mera|meri|mere|hamara|hamari|apna|apni|my|our|store|shop)\b/i,
    /\b(kitna|kitni|kitne|kaun|kon|dikhao|dikha|batao|list|show|total|available)\b/i,
    /\b(expir|expiry|expire|damaged|defective)\b/i,
  ];

  return inventoryHints.some((re) => re.test(q));
};

/**
 * Web search ONLY for clearly external / general knowledge questions.
 * Default is OFF so inventory RAG does not get polluted by web noise.
 */
const needsExternalSearch = (question = '') => {
  const q = String(question).toLowerCase().trim();
  if (!q) return false;

  // Store questions never need Tavily
  if (isInventoryQuestion(q)) return false;

  const externalHints = [
    /\b(market trend|industry trend|competitor|competition|best practice|best practices|case study)\b/i,
    /\b(news|headline|inflation|recession|supply chain|ecommerce strategy)\b/i,
    /\b(what is|define|definition|meaning of|explain the concept)\b/i,
    /\b(how to (improve|optimize|reduce|increase|manage)(?!.*(my|our|store|stock|inventory|product)))\b/i,
    /\b(world|global|pakistan economy|dollar rate|pkr rate|forex)\b/i,
    /\b(tutorial|guide|research|benchmark)\b/i,
  ];

  return externalHints.some((re) => re.test(q));
};

/**
 * Search the web via Tavily.
 * @returns {{ contextText: string, sources: string[], results: object[], answer: string|null }}
 */
const searchWeb = async (query, options = {}) => {
  const apiKey = process.env.TAVILY_API_KEY;

  if (!apiKey) {
    return {
      contextText: '',
      sources: [],
      results: [],
      answer: null,
      skipped: true,
      reason: 'TAVILY_API_KEY not configured',
    };
  }

  const maxResults = Math.min(Number(options.maxResults) || 4, 8);

  try {
    const response = await fetch(TAVILY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        query: String(query).slice(0, 400),
        search_depth: options.searchDepth || 'basic',
        max_results: maxResults,
        include_answer: true,
        topic: options.topic || 'general',
      }),
    });

    if (!response.ok) {
      const errBody = await response.text().catch(() => '');
      throw new Error(`Tavily HTTP ${response.status}: ${errBody.slice(0, 200)}`);
    }

    const data = await response.json();
    const results = Array.isArray(data.results) ? data.results : [];

    const lines = [];
    if (data.answer) {
      lines.push(`Summary: ${data.answer}`);
    }

    results.forEach((r, i) => {
      lines.push(
        `[${i + 1}] ${r.title || 'Untitled'}\n` +
          `URL: ${r.url || 'n/a'}\n` +
          `Content: ${(r.content || '').slice(0, 280)}`
      );
    });

    const sources = results
      .map((r) => r.url)
      .filter(Boolean)
      .slice(0, maxResults);

    return {
      contextText: lines.join('\n\n') || '',
      sources: sources.length ? ['web_search', ...sources] : results.length ? ['web_search'] : [],
      results,
      answer: data.answer || null,
      skipped: false,
    };
  } catch (err) {
    console.warn('Tavily search failed:', err.message);
    return {
      contextText: '',
      sources: [],
      results: [],
      answer: null,
      skipped: true,
      reason: err.message,
    };
  }
};

module.exports = {
  searchWeb,
  needsExternalSearch,
  isInventoryQuestion,
};
