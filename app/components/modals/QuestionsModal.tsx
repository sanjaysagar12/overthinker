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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-[1000]">
      <div className="bg-white p-8 rounded-xl shadow-2xl max-w-3xl w-[90%]">
        <h3 className="text-xl font-semibold text-gray-800 mb-5">
          🤔 Question {currentQuestionIndex + 1} of {questions.length}
        </h3>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(progress / total) * 100}%` }}
          />
        </div>

        <div className="bg-gray-50 p-5 rounded-lg mb-5 border border-gray-200">
          <p className="text-base text-gray-800 leading-relaxed m-0">
            {questions[currentQuestionIndex]}
          </p>
        </div>
        
        <textarea
          value={currentAnswer}
          onChange={(e) => onAnswerChange(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Share your thoughts and insights..."
          className="w-full h-30 p-4 border-2 border-gray-200 rounded-lg text-sm resize-y font-inherit focus:border-blue-500 focus:outline-none"
          autoFocus
        />
        
        <div className="flex justify-between items-center mt-5">
          <div className="text-gray-600 text-sm">
            Progress: {progress}/{total} answered
          </div>
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="px-5 py-2 border border-gray-300 rounded bg-white text-gray-600 cursor-pointer hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!currentAnswer.trim() || loading}
              className={`px-6 py-2 border-none rounded font-bold transition-colors ${
                !currentAnswer.trim() || loading
                  ? 'bg-gray-400 text-white cursor-not-allowed'
                  : 'bg-blue-600 text-white cursor-pointer hover:bg-blue-700'
              }`}
            >
              {loading ? 'Processing...' : (isLastQuestion ? 'Predict Outcomes' : 'Next Question')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}