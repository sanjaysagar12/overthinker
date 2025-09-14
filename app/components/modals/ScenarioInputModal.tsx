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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-[1000]">
      <div className="bg-white p-8 rounded-xl shadow-2xl max-w-2xl w-[90%]">
        <h3 className="text-xl font-semibold text-gray-800 text-center mb-5">
          🚀 Start Your AI-Powered Decision Flow
        </h3>
        <p className="text-base text-gray-600 text-center mb-5">
          Describe your situation or decision, and I'll help you explore it with questions and outcome predictions
        </p>
        <textarea
          value={scenario}
          onChange={(e) => onScenarioChange(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Describe your scenario, situation, or decision you're facing..."
          className="w-full h-30 p-4 border-2 border-gray-200 rounded-lg text-base resize-y font-inherit focus:border-blue-500 focus:outline-none"
          autoFocus
        />
        <div className="flex justify-end gap-4 mt-5">
          {onClose && (
            <button
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 rounded-lg bg-white text-gray-600 cursor-pointer hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            onClick={handleSubmit}
            disabled={loading || !scenario.trim()}
            className={`px-8 py-3 border-none rounded-lg text-base font-bold transition-colors ${
              loading || !scenario.trim() 
                ? 'bg-gray-400 text-white cursor-not-allowed' 
                : 'bg-blue-600 text-white cursor-pointer hover:bg-blue-700'
            }`}
          >
            {loading ? 'Analyzing...' : 'Start AI Analysis'}
          </button>
        </div>
      </div>
    </div>
  );
}