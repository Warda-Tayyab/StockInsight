const { retrieveInsightsContext } = require('./ragDataRetriever');
const { generateInsights: generateInsightsWithAI } = require('./ragGroqService');

const inferQueryType = (question, sources = []) => {
  const q = (question || '').toLowerCase();
  if (sources.includes('sales_db') || /sales|revenue|sold|farokht/.test(q)) return 'sales';
  if (sources.includes('batches') || /batch|expir/.test(q)) return 'batch';
  if (sources.includes('stock_levels') || /stock|reorder|kam/.test(q)) return 'stock';
  if (sources.includes('categories') || /category|compare/.test(q)) return 'analysis';
  return 'analysis';
};

/**
 * AI Insights for a store: report-aligned snapshot + advanced analytics → Groq briefing.
 */
const generateInsights = async (tenantId) => {
  const { contextText } = await retrieveInsightsContext(tenantId);

  const aiResult = await generateInsightsWithAI(contextText);
  let insights = aiResult.insights || [];
  let recommendations = aiResult.recommendations || [];
  const executiveSummary = aiResult.executiveSummary || '';

  if (!recommendations.length) {
    recommendations = insights
      .filter((i) => i.recommendation)
      .slice(0, 5)
      .map((i, index) => ({
        id: `ai-rec-${index + 1}`,
        title: i.title,
        action: i.recommendation,
        priority: i.impact || 'medium',
        category: i.category || i.type
      }));
  }

  insights = insights.map((insight) => ({
    ...insight,
    recommendation:
      insight.recommendation ||
      'Review this finding in inventory and take corrective action today.'
  }));

  return {
    executiveSummary,
    insights,
    recommendations,
    aiGenerated: true
  };
};

module.exports = {
  generateInsights,
  inferQueryType
};
