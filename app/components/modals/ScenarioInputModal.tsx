interface ScenarioInputModalProps {
  isOpen: boolean;
  scenario: string;
  loading: boolean;
  onScenarioChange: (scenario: string) => void;
  onSubmit: () => void;
  onClose?: () => void;
}

export default function ScenarioInputModal({
  isOpen,
  scenario,
  loading,
  onScenarioChange,
  onSubmit,
  onClose
}: ScenarioInputModalProps) {
  if (!isOpen) return null;

  const handleSubmit = () => {
    if (scenario.trim()) {
      onSubmit();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleSubmit();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-[1000]">
      <div className="bg-white p-10 rounded-2xl shadow-2xl max-w-3xl w-[95%] border border-gray-100">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-4">
            <span className="text-2xl">🚀</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">
            Start Your AI-Powered Decision Flow
          </h3>
          <p className="text-gray-600 leading-relaxed max-w-xl mx-auto">
            Describe your situation or decision, and I'll help you explore it with intelligent questions and outcome predictions
          </p>
        </div>
        
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Your Scenario
          </label>
          <textarea
            value={scenario}
            onChange={(e) => onScenarioChange(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Describe your scenario, situation, or decision you're facing..."
            className="w-full h-32 p-4 border-2 border-gray-300 rounded-xl text-black text-base resize-none font-medium placeholder-gray-500 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 focus:outline-none transition-all duration-200"
            autoFocus
          />
          <p className="text-xs text-gray-500 mt-2">
            Press Ctrl+Enter to submit
          </p>
        </div>
        
        <div className="flex justify-end gap-4">
          {onClose && (
            <button
              onClick={onClose}
              className="px-6 py-3 border-2 border-gray-300 rounded-xl bg-white text-gray-700 font-medium cursor-pointer hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
            >
              Cancel
            </button>
          )}
          <button
            onClick={handleSubmit}
            disabled={loading || !scenario.trim()}
            className={`px-8 py-3 rounded-xl text-base font-bold transition-all duration-200 ${
              loading || !scenario.trim() 
                ? 'bg-gray-400 text-white cursor-not-allowed shadow-none' 
                : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white cursor-pointer hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
            }`}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 0 1 4 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
                Analyzing...
              </span>
            ) : 'Start AI Analysis'}
          </button>
        </div>
      </div>
    </div>
  );
}