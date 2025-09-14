interface OutcomeAnalysis {
  analysis_summary?: string;
  positive_outcomes?: string[];
  negative_outcomes?: string[];
  neutral_mixed_outcomes?: string[];
  key_considerations?: string[];
  recommendations?: string;
}

interface OutcomeModalProps {
  isOpen: boolean;
  analysis: OutcomeAnalysis | null;
  onCreateFlowChart: () => void;
  onStartOver: () => void;
}

export default function OutcomeModal({
  isOpen,
  analysis,
  onCreateFlowChart,
  onStartOver
}: OutcomeModalProps) {
  if (!isOpen || !analysis) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-[1000]">
      <div className="bg-white p-8 rounded-xl shadow-2xl max-w-4xl w-[90%] max-h-[80vh] overflow-auto">
        <h3 className="text-xl font-semibold text-gray-800 text-center mb-5">
          🔮 Predicted Outcomes
        </h3>
        
        {analysis.analysis_summary && (
          <div className="bg-blue-50 p-4 rounded-lg mb-5 border border-blue-200">
            <p className="text-blue-800 text-sm m-0">
              {analysis.analysis_summary}
            </p>
          </div>
        )}

        <div className="space-y-3 mb-5">
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h4 className="text-gray-800 font-semibold mb-3 m-0">📋 All Outcomes</h4>
            <div className="space-y-2">
              {/* Positive outcomes with animation */}
              {analysis.positive_outcomes?.map((outcome: string, index: number) => (
                <div 
                  key={`positive-${index}`} 
                  className="positive-outcome flex items-start gap-2 p-3 rounded-lg bg-green-50 border-l-4 border-green-500 hover:bg-green-100 transition-all duration-300"
                >
                  <span className="text-green-600 font-bold text-base">✨</span>
                  <span className="text-green-800 text-sm flex-1 font-medium">
                    {outcome}
                  </span>
                </div>
              ))}
              
              {/* Negative outcomes without animation */}
              {analysis.negative_outcomes?.map((outcome: string, index: number) => (
                <div 
                  key={`negative-${index}`} 
                  className="flex items-start gap-2 p-2 rounded bg-red-50 border-l-4 border-red-500 hover:bg-red-100 transition-colors duration-200"
                >
                  <span className="text-red-600 font-bold text-sm">⚠️</span>
                  <span className="text-red-800 text-sm flex-1">
                    {outcome}
                  </span>
                </div>
              ))}

              {/* Neutral/Mixed outcomes */}
              {analysis.neutral_mixed_outcomes?.map((outcome: string, index: number) => (
                <div 
                  key={`neutral-${index}`} 
                  className="flex items-start gap-2 p-2 rounded bg-yellow-50 border-l-4 border-yellow-500 hover:bg-yellow-100 transition-colors duration-200"
                >
                  <span className="text-yellow-600 font-bold text-sm">🔄</span>
                  <span className="text-yellow-800 text-sm flex-1">
                    {outcome}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Key Considerations */}
          {analysis.key_considerations && analysis.key_considerations.length > 0 && (
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <h4 className="text-purple-800 font-semibold mb-3 m-0">🎯 Key Considerations</h4>
              <ul className="space-y-1">
                {analysis.key_considerations.map((consideration: string, index: number) => (
                  <li key={index} className="text-purple-800 text-sm flex items-start gap-2">
                    <span className="text-purple-600 font-bold">•</span>
                    <span className="flex-1">{consideration}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommendations */}
          {analysis.recommendations && (
            <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
              <h4 className="text-indigo-800 font-semibold mb-2 m-0">💡 Recommendations</h4>
              <p className="text-indigo-800 text-sm m-0">
                {analysis.recommendations}
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-center gap-4 mt-6">
          <button
            onClick={onStartOver}
            className="px-6 py-3 border border-gray-300 rounded-lg bg-white text-gray-600 cursor-pointer hover:bg-gray-50 transition-colors"
          >
            Start Over
          </button>
          <button
            onClick={onCreateFlowChart}
            className="px-8 py-3 border-none rounded-lg bg-blue-600 text-white font-bold cursor-pointer hover:bg-blue-700 transition-colors"
          >
            Create Flow Chart
          </button>
        </div>
      </div>
    </div>
  );
}