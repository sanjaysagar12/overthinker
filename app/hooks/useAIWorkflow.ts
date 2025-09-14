import { useState, useCallback } from 'react';

interface OutcomeAnalysis {
  analysis_summary?: string;
  positive_outcomes?: string[];
  negative_outcomes?: string[];
  neutral_mixed_outcomes?: string[];
  key_considerations?: string[];
  recommendations?: string;
}

export function useAIWorkflow() {
  const [scenario, setScenario] = useState('');
  const [aiQuestions, setAiQuestions] = useState<string[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questionAnswers, setQuestionAnswers] = useState<string[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [outcomeAnalysis, setOutcomeAnalysis] = useState<OutcomeAnalysis | null>(null);
  const [loading, setLoading] = useState(false);

  // Modal visibility states
  const [showScenarioInput, setShowScenarioInput] = useState(false);
  const [showQuestions, setShowQuestions] = useState(false);
  const [showOutcome, setShowOutcome] = useState(false);

  const startScenarioInput = useCallback(() => {
    setShowScenarioInput(true);
  }, []);

  const generateQuestions = useCallback(async (scenarioText: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/ai/question', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ scenario: scenarioText }),
      });

      const data = await response.json();
      if (data.success) {
        setAiQuestions(data.questions);
        setCurrentQuestionIndex(0);
        setQuestionAnswers([]);
        setCurrentAnswer('');
        setShowScenarioInput(false);
        setShowQuestions(true);
        return true;
      } else {
        console.error('Failed to generate questions:', data.error);
        return false;
      }
    } catch (error) {
      console.error('Error calling AI:', error);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const submitAnswer = useCallback(() => {
    if (!currentAnswer.trim()) return;

    const updatedAnswers = [...questionAnswers, currentAnswer.trim()];
    setQuestionAnswers(updatedAnswers);
    setCurrentAnswer('');

    if (currentQuestionIndex < aiQuestions.length - 1) {
      // Move to next question
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // All questions answered, get outcome prediction
      predictOutcomes(updatedAnswers);
    }
  }, [currentAnswer, questionAnswers, currentQuestionIndex, aiQuestions]);

  const predictOutcomes = useCallback(async (answers: string[]) => {
    setLoading(true);
    try {
      const fullPrompt = `${scenario}. Additional context: ${answers.join(' ')}`;

      const response = await fetch('/api/ai/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: fullPrompt }),
      });

      const data = await response.json();
      if (data.success) {
        setOutcomeAnalysis(data.analysis);
        setShowQuestions(false);
        setShowOutcome(true);
      } else {
        console.error('Failed to predict outcomes:', data.error);
      }
    } catch (error) {
      console.error('Error predicting outcomes:', error);
    } finally {
      setLoading(false);
    }
  }, [scenario]);

  const resetWorkflow = useCallback(() => {
    setShowScenarioInput(false);
    setShowQuestions(false);
    setShowOutcome(false);
    setScenario('');
    setAiQuestions([]);
    setCurrentQuestionIndex(0);
    setQuestionAnswers([]);
    setCurrentAnswer('');
    setOutcomeAnalysis(null);
    setLoading(false);
  }, []);

  return {
    // State
    scenario,
    aiQuestions,
    currentQuestionIndex,
    questionAnswers,
    currentAnswer,
    outcomeAnalysis,
    loading,
    showScenarioInput,
    showQuestions,
    showOutcome,

    // Actions
    setScenario,
    setCurrentAnswer,
    startScenarioInput,
    generateQuestions,
    submitAnswer,
    resetWorkflow,
  };
}