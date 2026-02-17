/** @module inventory/explainable-insights/components/DataExplanation */

const DataExplanation = ({ insight }) => {
  return (
    <div data-testid="data-explanation" className="bg-white rounded-xl p-6 shadow-md max-h-[calc(100vh-200px)] overflow-y-auto">
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 m-0">Detailed Explanation</h3>
      </div>
      
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-4">
          <h4 className="text-base font-semibold text-gray-900 m-0">Summary</h4>
          <p className="text-sm text-gray-600 m-0 leading-relaxed">{insight.summary}</p>
        </div>
        
        <div className="flex flex-col gap-4">
          <h4 className="text-base font-semibold text-gray-900 m-0">Explanation</h4>
          <p className="text-sm text-gray-600 m-0 leading-relaxed">{insight.explanation}</p>
        </div>
        
        <div className="flex flex-col gap-4">
          <h4 className="text-base font-semibold text-gray-900 m-0">Key Data Points</h4>
          <div className="flex flex-col gap-2">
            {Object.entries(insight.data).map(([key, value]) => (
              <div key={key} className="flex justify-between py-2 px-4 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600 font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                <span className="text-sm text-gray-900 font-semibold">
                  {Array.isArray(value) ? value.join(', ') : typeof value === 'number' ? value.toLocaleString() : value}
                </span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="flex flex-col gap-4">
          <h4 className="text-base font-semibold text-gray-900 m-0">Confidence & Impact</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1 p-4 bg-gray-50 rounded-lg">
              <span className="text-xs text-gray-400 uppercase tracking-wide">Confidence Level</span>
              <span className="text-lg font-bold text-gray-900">{insight.confidence}%</span>
            </div>
            <div className="flex flex-col gap-1 p-4 bg-gray-50 rounded-lg">
              <span className="text-xs text-gray-400 uppercase tracking-wide">Impact Level</span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                insight.impact === 'high' ? 'bg-red-100 text-red-800' : 
                insight.impact === 'medium' ? 'bg-yellow-100 text-yellow-800' : 
                'bg-blue-100 text-blue-800'
              }`}>
                {insight.impact}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataExplanation;
