/** @module inventory/rag-query/pages/AIQuery */

import { useState } from 'react';
import QueryHistory from '../components/QueryHistory';
import './AIQuery.css';

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
    <div data-testid="ai-query-page" className="ai-query-page">
      <div className="page-header">
        <div>
          <h1>AI Query Assistant</h1>
          <p className="page-subtitle">Ask questions about your inventory using natural language</p>
        </div>
      </div>

      <div className="ai-query-content">
        <div className="query-chat-section">
          <div className="chat-container card">
            <div className="chat-messages">
              {queries.length === 0 ? (
                <div className="chat-empty">
                  <div className="chat-empty-icon">🤖</div>
                  <h3>Ask me anything about your inventory</h3>
                  <p>Try questions like:</p>
                  <ul className="chat-examples">
                    <li>"What products are running low on stock?"</li>
                    <li>"Show me sales trends for last quarter"</li>
                    <li>"Which batch has the highest turnover rate?"</li>
                    <li>"Compare inventory levels across categories"</li>
                  </ul>
                </div>
              ) : (
                queries.map((item) => (
                  <div key={item.id} className="chat-message-group">
                    <div className="chat-message chat-message-user">
                      <div className="chat-avatar chat-avatar-user">👤</div>
                      <div className="chat-bubble chat-bubble-user">
                        <p>{item.query}</p>
                      </div>
                    </div>
                    <div className="chat-message chat-message-assistant">
                      <div className="chat-avatar chat-avatar-assistant">🤖</div>
                      <div className="chat-bubble chat-bubble-assistant">
                        <div className="response-content">
                          <p style={{ whiteSpace: 'pre-line' }}>{item.response}</p>
                          <div className="response-sources">
                            <span className="response-sources-label">Sources:</span>
                            {item.sources.map((source, idx) => (
                              <span key={idx} className="badge badge-info">{source}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
              {loading && (
                <div className="chat-message chat-message-assistant">
                  <div className="chat-avatar chat-avatar-assistant">🤖</div>
                  <div className="chat-bubble chat-bubble-assistant">
                    <div className="chat-loading">
                      <span className="spinner"></span>
                      <span>Thinking...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit} className="chat-input-form">
              <div className="chat-input-wrapper">
                <input
                  type="text"
                  className="chat-input"
                  placeholder="Ask a question about your inventory..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  disabled={loading}
                />
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading || !query.trim()}
                >
                  Send
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="query-history-section">
          <QueryHistory queries={queries} />
        </div>
      </div>
    </div>
  );
};

export default AIQuery;
