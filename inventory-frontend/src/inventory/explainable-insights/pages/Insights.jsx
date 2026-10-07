/** @module inventory/explainable-insights/pages/Insights */

import { useState, useEffect } from 'react';
import { HiOutlineLightBulb, HiOutlineRefresh, HiOutlineSparkles } from 'react-icons/hi';
import InsightCard from '../components/InsightCard';
import DataExplanation from '../components/DataExplanation';
import RecommendationPanel from '../components/RecommendationPanel';
import ragService from '../../../shared/services/ragService';

const Insights = () => {
  const [selectedInsight, setSelectedInsight] = useState(null);
  const [insights, setInsights] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [executiveSummary, setExecutiveSummary] = useState('');
  const [generatedAt, setGeneratedAt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchInsights = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await ragService.getInsights();
      const items = (res.data.insights || []).map((item) => ({
        ...item,
        timestamp: new Date(item.timestamp || res.data.generatedAt || Date.now())
      }));
      setInsights(items);
      setRecommendations(res.data.recommendations || []);
      setExecutiveSummary(res.data.executiveSummary || '');
      setGeneratedAt(res.data.generatedAt ? new Date(res.data.generatedAt) : new Date());
      setSelectedInsight(items[0] || null);
    } catch (err) {
      console.error('Insights fetch error:', err);
      setError(
        err.response?.data?.message || 'Failed to generate AI insights. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  return (
  <div
    data-testid="insights-page"
    className="min-h-screen w-full bg-[#F8FAFC] p-6"
  >
    {/* Header */}
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
      <div>
        <h1 className="text-4xl font-bold text-slate-900">
          AI Insights
        </h1>

        <p className="mt-2 text-slate-500">
          Live inventory intelligence with AI-powered recommendations
          {generatedAt && (
            <span className="ml-2 text-slate-400">
              • Updated{" "}
              {generatedAt.toLocaleString(undefined, {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </span>
          )}
        </p>
      </div>

      <button
        onClick={fetchInsights}
        disabled={loading}
        className="flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 font-medium shadow-sm transition-all duration-200 disabled:opacity-50"
      >
        <HiOutlineRefresh
          className={`w-5 h-5 ${loading ? "animate-spin" : ""}`}
        />
        {loading ? "Analyzing..." : "Regenerate Insights"}
      </button>
    </div>

    {error && (
      <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-red-700">
        {error}
      </div>
    )}

    {loading ? (
      <div className="flex h-[65vh] flex-col items-center justify-center">
        <div className="h-14 w-14 rounded-full border-4 border-slate-200 border-t-indigo-500 animate-spin"></div>

        <h3 className="mt-6 text-xl font-semibold text-slate-800">
          AI is analyzing your inventory...
        </h3>

        <p className="mt-2 text-slate-500">
          Generating intelligent insights.
        </p>
      </div>
    ) : insights.length === 0 ? (
      <div className="rounded-3xl border border-slate-200 bg-white p-20 text-center shadow-sm">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-indigo-100">
          <HiOutlineLightBulb className="h-10 w-10 text-indigo-600" />
        </div>

        <h2 className="text-2xl font-bold text-slate-900">
          No AI Insights Yet
        </h2>

        <p className="mx-auto mt-3 max-w-lg text-slate-500">
          Add inventory and sales data, then regenerate insights to receive
          AI-powered recommendations.
        </p>
      </div>
    ) : (
      <div className="space-y-6">

        {/* Executive Summary */}

        {executiveSummary && (
          <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">

            <div className="mb-5 flex items-center gap-4">

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100">
                <HiOutlineSparkles className="h-6 w-6 text-indigo-600" />
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">
                  Executive Summary
                </p>

                <h3 className="text-xl font-bold text-slate-900">
                  Store Briefing
                </h3>
              </div>

            </div>

            <p className="leading-8 text-slate-600">
              {executiveSummary}
            </p>

          </div>
        )}

        {/* Main Grid */}

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">

          {/* Left Panel */}

          <div className="xl:col-span-4">

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">

              <div className="mb-6 flex items-center justify-between">

                <div>
                  <p className="text-xs uppercase tracking-widest text-slate-500">
                    Key Insights
                  </p>

                  <h3 className="text-2xl font-bold text-slate-900">
                    Insights
                  </h3>
                </div>

                <span className="rounded-full bg-indigo-100 px-4 py-2 text-sm font-semibold text-indigo-700">
                  {insights.length}
                </span>

              </div>

              <div className="max-h-[700px] space-y-4 overflow-y-auto pr-2">
                {insights.map((insight) => (
                  <InsightCard
                    key={insight.id}
                    insight={insight}
                    isSelected={selectedInsight?.id === insight.id}
                    onClick={() => setSelectedInsight(insight)}
                  />
                ))}
              </div>

            </div>

          </div>

          {/* Right Panel */}

          <div className="xl:col-span-8 space-y-6 sticky top-24 self-start">

            <div className="rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
              <DataExplanation insight={selectedInsight} />
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
              <RecommendationPanel
                recommendations={recommendations}
              />
            </div>

          </div>

        </div>

      </div>
    )}
  </div>
);
};

export default Insights;
