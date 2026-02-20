/** @module inventory/rag-query/pages/AIQuery */

import { useState } from 'react';
import QueryHistory from '../components/QueryHistory';

const AIQuery = () => {
  const [query, setQuery] = useState('');
  const [queries, setQueries] = useState([
    {
      id: 1,
      query: 'What products are running low on stock?',
      response: 'Based on current inventory levels, the following products are running low:\n\n1. Widget A - 12 units remaining (reorder point: 20)\n2. Gadget B - 8 units remaining (reorder point: 15)\n3. Component D - 5 units remaining (reorder point: 10)\n\nThese items should be reordered soon to avoid stockouts.',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      sources: ['inventory_db', 'stock_levels'],
    },
    {
      id: 2,
      query: 'Show me sales trends for last quarter',
      response: 'Sales trends for Q1 2024:\n\n- January: $45,000\n- February: $52,000 (+15.6%)\n- March: $48,000 (-7.7%)\n\nOverall growth: +6.7% compared to previous quarter. Electronics category showed the strongest performance.',
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
      sources: ['sales_db', 'reports'],
    },
  ]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    const userQuery = query;
    setQuery('');

    // Simulate API call
    setTimeout(() => {
      const newQuery = {
        id: queries.length + 1,
        query: userQuery,
        response: `Based on your query "${userQuery}", here's what I found:\n\nThis is a simulated response. In a real implementation, this would use RAG (Retrieval-Augmented Generation) to query your inventory database and provide accurate, explainable answers with source citations.\n\nThe system would:\n1. Analyze your question\n2. Retrieve relevant data from inventory systems\n3. Generate an explainable answer\n4. Provide source references`,
        timestamp: new Date(),
        sources: ['inventory_db', 'products', 'analytics'],
      };
      setQueries([newQuery, ...queries]);
      setLoading(false);
    }, 1500);
  };

  return (
    <div data-testid="ai-query-page" className="flex flex-col gap-6 h-[calc(100vh-200px)]">
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">AI Query Assistant</h1>
          <p className="text-gray-600 text-sm m-0">Ask questions about your inventory using natural language</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        <div className="lg:col-span-2 flex flex-col min-h-0">
          <div className="bg-white rounded-xl shadow-md flex flex-col h-full min-h-[600px]">
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
              {queries.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center text-gray-600">
                  <div className="text-6xl mb-6">🤖</div>
                  <h3 className="mb-4 text-gray-900">Ask me anything about your inventory</h3>
                  <p className="mb-6">Try questions like:</p>
                  <ul className="list-none p-0 m-0 text-left">
                    <li className="py-2 text-gray-600">"What products are running low on stock?"</li>
                    <li className="py-2 text-gray-600">"Show me sales trends for last quarter"</li>
                    <li className="py-2 text-gray-600">"Which batch has the highest turnover rate?"</li>
                    <li className="py-2 text-gray-600">"Compare inventory levels across categories"</li>
                  </ul>
                </div>
              ) : (
                queries.map((item) => (
                  <div key={item.id} className="flex flex-col gap-4">
                    <div className="flex gap-4 items-start flex-row-reverse">
                      <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-xl flex-shrink-0">👤</div>
                      <div className="max-w-[70%] px-4 py-3 rounded-xl shadow-sm bg-blue-600 text-white rounded-br-sm">
                        <p className="m-0 leading-relaxed whitespace-pre-line">{item.query}</p>
                      </div>
                    </div>
                    <div className="flex gap-4 items-start">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-xl flex-shrink-0">🤖</div>
                      <div className="max-w-[70%] px-4 py-3 rounded-xl shadow-sm bg-gray-100 text-gray-900 rounded-bl-sm">
                        <div className="flex flex-col gap-4">
                          <p className="m-0 leading-relaxed whitespace-pre-line">{item.response}</p>
                          <div className="flex items-center gap-2 flex-wrap pt-4 border-t border-gray-200">
                            <span className="text-xs text-gray-500 font-medium">Sources:</span>
                            {item.sources.map((source, idx) => (
                              <span key={idx} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">{source}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
              {loading && (
                <div className="flex gap-4 items-start">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-xl flex-shrink-0">🤖</div>
                  <div className="max-w-[70%] px-4 py-3 rounded-xl shadow-sm bg-gray-100 text-gray-900 rounded-bl-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <span className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></span>
                      <span>Thinking...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit} className="p-6 border-t border-gray-200">
              <div className="flex gap-4">
                <input
                  type="text"
                  className="flex-1 px-4 py-3 border border-gray-200 rounded-lg text-sm transition-all focus:outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-100"
                  placeholder="Ask a question about your inventory..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  disabled={loading}
                />
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading || !query.trim()}
                >
                  Send
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="min-w-0">
          <QueryHistory queries={queries} />
        </div>
      </div>
    </div>
  );
};

export default AIQuery;
