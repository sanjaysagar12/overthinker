interface QuestionsModalProps {
  isOpen: boolean;
  questions: string[];
  currentQuestionIndex: number;
  currentAnswer: string;
  questionAnswers: string[];
  loading: boolean;
  onAnswerChange: (answer: string) => void;
  onSubmitAnswer: () => void;
  onCancel: () => void;
}

export default function QuestionsModal({
  isOpen,
  questions,
  currentQuestionIndex,
  currentAnswer,
  questionAnswers,
  loading,
  onAnswerChange,
  onSubmitAnswer,
  onCancel
}: QuestionsModalProps) {
  if (!isOpen || questions.length === 0) return null;

  const handleSubmit = () => {
    if (currentAnswer.trim()) {
      onSubmitAnswer();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleSubmit();
    }
  };

  const isLastQuestion = currentQuestionIndex >= questions.length - 1;
  const progress = questionAnswers.length;
  const total = questions.length;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-[1000]">
      <div className="bg-white p-10 rounded-2xl shadow-2xl max-w-4xl w-[95%] border border-gray-100">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full mb-4">
            <span className="text-2xl">🤔</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            Question {currentQuestionIndex + 1} of {questions.length}
          </h3>
          <p className="text-gray-600">
            Help me understand your situation better
          </p>
        </div>
        
        {/* Enhanced Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Progress</span>
            <span className="text-sm font-medium text-indigo-600">{progress}/{total} completed</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-indigo-500 to-purple-600 h-3 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${(progress / total) * 100}%` }}
            />
          </div>
        </div>

        <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-6 rounded-xl mb-6 border border-gray-200">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
              <span className="text-indigo-600 font-bold text-sm">Q</span>
            </div>
            <p className="text-lg text-gray-800 leading-relaxed font-medium">
              {questions[currentQuestionIndex]}
            </p>
          </div>
        </div>
        
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Your Response
          </label>
          <textarea
            value={currentAnswer}
            onChange={(e) => onAnswerChange(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Share your thoughts and insights..."
            className="w-full h-32 p-4 border-2 border-gray-300 rounded-xl text-black text-base resize-none font-medium placeholder-gray-500 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 focus:outline-none transition-all duration-200"
            autoFocus
          />
          <p className="text-xs text-gray-500 mt-2">
            Press Ctrl+Enter to continue
          </p>
        </div>
        
        <div className="flex justify-between items-center">
          <div className="text-gray-600 text-sm font-medium">
            {progress > 0 && (
              <span className="inline-flex items-center gap-2 text-green-600">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                </svg>
                {progress} question{progress !== 1 ? 's' : ''} answered
              </span>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="px-6 py-3 border-2 border-gray-300 rounded-xl bg-white text-gray-700 font-medium cursor-pointer hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!currentAnswer.trim() || loading}
              className={`px-8 py-3 rounded-xl font-bold transition-all duration-200 ${
                !currentAnswer.trim() || loading
                  ? 'bg-gray-400 text-white cursor-not-allowed shadow-none'
                  : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white cursor-pointer hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
              }`}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 0 1 4 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  Processing...
                </span>
              ) : (isLastQuestion ? 'Generate Predictions' : 'Next Question')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}