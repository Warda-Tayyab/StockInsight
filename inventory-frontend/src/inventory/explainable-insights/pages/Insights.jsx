/** @module inventory/explainable-insights/pages/Insights */

import { useState } from 'react';
import InsightCard from '../components/InsightCard';
import DataExplanation from '../components/DataExplanation';

const Insights = () => {
  const [selectedInsight, setSelectedInsight] = useState(null);

  const insights = [
    {
      id: 1,
      title: 'Sales Trend Analysis',
      type: 'sales',
      summary: 'Sales have increased by 18.5% compared to last quarter',
      confidence: 95,
      impact: 'high',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      data: {
        currentQuarter: 176000,
        previousQuarter: 148500,
        growth: 18.5,
        topProducts: ['Widget A', 'Gadget B', 'Tool C'],
      },
      explanation: 'The sales increase is primarily driven by strong performance in the Electronics category, particularly Widget A and Gadget B. Seasonal trends and improved marketing campaigns contributed to this growth.',
    },
    {
      id: 2,
      title: 'Stock Optimization Opportunity',
      type: 'inventory',
      summary: '23 products are below reorder point, requiring immediate attention',
      confidence: 98,
      impact: 'high',
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
      data: {
        lowStockCount: 23,
        criticalCount: 5,
        estimatedLoss: 15000,
        recommendedAction: 'Bulk reorder for Electronics category',
      },
      explanation: 'Analysis of current stock levels reveals that 23 products have fallen below their reorder points. The Electronics category shows the highest concentration of low-stock items. Immediate reordering is recommended to prevent stockouts.',
    },
    {
      id: 3,
      title: 'Batch Expiry Risk',
      type: 'batch',
      summary: '5 batches expiring within 7 days need attention',
      confidence: 100,
      impact: 'medium',
      timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      data: {
        expiringBatches: 5,
        totalValue: 8500,
        daysUntilExpiry: [3, 5, 6, 7, 7],
        recommendedAction: 'Prioritize sales or consider discounting',
      },
      explanation: 'Five product batches are approaching their expiry dates within the next week. These batches represent $8,500 in inventory value. Consider prioritizing these items in sales or applying discounts to move inventory quickly.',
    },
    {
      id: 4,
      title: 'Category Performance Comparison',
      type: 'analysis',
      summary: 'Electronics category outperforming others by 35%',
      confidence: 92,
      impact: 'medium',
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      data: {
        topCategory: 'Electronics',
        performanceGap: 35,
        categories: ['Electronics', 'Hardware', 'Accessories'],
        salesDistribution: [45, 30, 25],
      },
      explanation: 'The Electronics category shows significantly stronger performance compared to Hardware and Accessories. This suggests focusing marketing efforts and inventory investment on Electronics products could yield higher returns.',
    },
  ];

  return (
    <div data-testid="insights-page" className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">Explainable Insights</h1>
          <p className="text-gray-600 text-sm m-0">AI-powered insights with detailed explanations</p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">Generate New Insights</button>
      </div>

      <div className={`grid gap-6 ${selectedInsight ? 'grid-cols-1 lg:grid-cols-[1fr_500px]' : 'grid-cols-1'}`}>
        <div className="flex flex-col gap-6">
          {insights.map((insight) => (
            <InsightCard
              key={insight.id}
              insight={insight}
              isSelected={selectedInsight?.id === insight.id}
              onClick={() => setSelectedInsight(insight)}
            />
          ))}
        </div>

        {selectedInsight && (
          <div className="lg:sticky lg:top-[calc(70px+2rem)] h-fit max-h-[calc(100vh-200px)] overflow-y-auto">
            <DataExplanation insight={selectedInsight} />
          </div>
        )}
      </div>
    </div>
  );
};

export default Insights;
