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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-[1000]">
      <div className="bg-white p-10 rounded-2xl shadow-2xl max-w-6xl w-[95%] max-h-[90vh] overflow-auto border border-gray-100">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full mb-4">
            <span className="text-2xl">🔮</span>
          </div>
          <h3 className="text-3xl font-bold text-gray-900 mb-3">
            Predicted Outcomes
          </h3>
          <p className="text-gray-600 max-w-2xl mx-auto">
            AI-powered analysis of your scenario with detailed predictions and recommendations
          </p>
        </div>
        
        {analysis.analysis_summary && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl mb-8 border border-blue-200">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-bold text-sm">📊</span>
              </div>
              <div>
                <h4 className="text-blue-900 font-semibold mb-2">Analysis Summary</h4>
                <p className="text-blue-800 leading-relaxed">
                  {analysis.analysis_summary}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid gap-6 mb-8">
          {/* Outcomes Section */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <h4 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                📋 Predicted Outcomes
              </h4>
            </div>
            <div className="p-6 space-y-4">
              {/* Positive outcomes */}
              {analysis.positive_outcomes?.map((outcome: string, index: number) => (
                <div 
                  key={`positive-${index}`} 
                  className="positive-outcome flex items-start gap-4 p-4 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 hover:from-green-100 hover:to-emerald-100 transition-all duration-300 shadow-sm"
                >
                  <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 font-bold text-lg">✨</span>
                  </div>
                  <div>
                    <span className="text-green-900 font-semibold block mb-1">Positive Outcome</span>
                    <span className="text-green-800 leading-relaxed">
                      {outcome}
                    </span>
                  </div>
                </div>
              ))}
              
              {/* Negative outcomes */}
              {analysis.negative_outcomes?.map((outcome: string, index: number) => (
                <div 
                  key={`negative-${index}`} 
                  className="flex items-start gap-4 p-4 rounded-xl bg-gradient-to-r from-red-50 to-rose-50 border-l-4 border-red-500 hover:from-red-100 hover:to-rose-100 transition-all duration-300 shadow-sm"
                >
                  <div className="flex-shrink-0 w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                    <span className="text-red-600 font-bold text-lg">⚠️</span>
                  </div>
                  <div>
                    <span className="text-red-900 font-semibold block mb-1">Risk Factor</span>
                    <span className="text-red-800 leading-relaxed">
                      {outcome}
                    </span>
                  </div>
                </div>
              ))}

              {/* Neutral/Mixed outcomes */}
              {analysis.neutral_mixed_outcomes?.map((outcome: string, index: number) => (
                <div 
                  key={`neutral-${index}`} 
                  className="flex items-start gap-4 p-4 rounded-xl bg-gradient-to-r from-yellow-50 to-amber-50 border-l-4 border-yellow-500 hover:from-yellow-100 hover:to-amber-100 transition-all duration-300 shadow-sm"
                >
                  <div className="flex-shrink-0 w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                    <span className="text-yellow-600 font-bold text-lg">🔄</span>
                  </div>
                  <div>
                    <span className="text-yellow-900 font-semibold block mb-1">Mixed Outcome</span>
                    <span className="text-yellow-800 leading-relaxed">
                      {outcome}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Key Considerations */}
          {analysis.key_considerations && analysis.key_considerations.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="bg-purple-50 px-6 py-4 border-b border-purple-200">
                <h4 className="text-xl font-bold text-purple-900 flex items-center gap-2">
                  🎯 Key Considerations
                </h4>
              </div>
              <div className="p-6">
                <div className="grid gap-3">
                  {analysis.key_considerations.map((consideration: string, index: number) => (
                    <div key={index} className="flex items-start gap-3 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-200">
                      <div className="flex-shrink-0 w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                        <span className="text-purple-600 font-bold text-sm">•</span>
                      </div>
                      <span className="text-purple-900 leading-relaxed font-medium">{consideration}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Recommendations */}
          {analysis.recommendations && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="bg-indigo-50 px-6 py-4 border-b border-indigo-200">
                <h4 className="text-xl font-bold text-indigo-900 flex items-center gap-2">
                  💡 Recommendations
                </h4>
              </div>
              <div className="p-6">
                <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-6 rounded-xl border border-indigo-200">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                      <span className="text-indigo-600 font-bold">💡</span>
                    </div>
                    <p className="text-indigo-900 leading-relaxed font-medium text-lg">
                      {analysis.recommendations}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-center gap-4 pt-6 border-t border-gray-200">
          <button
            onClick={onStartOver}
            className="px-8 py-4 border-2 border-gray-300 rounded-xl bg-white text-gray-700 font-bold cursor-pointer hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
          >
            Start Over
          </button>
          <button
            onClick={onCreateFlowChart}
            className="px-10 py-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold cursor-pointer hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
          >
            Create Flow Chart
          </button>
        </div>
      </div>
    </div>
  );
}