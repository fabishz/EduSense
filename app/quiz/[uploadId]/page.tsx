'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { useToast } from '../../contexts/ToastContext';

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
}

export default function QuizPage() {
  const { uploadId } = useParams();
  const router = useRouter();
  const { addToast } = useToast();
  const [quiz, setQuiz] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(1800); // 30 minutes in seconds
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Load saved progress on mount
  useEffect(() => {
    const savedProgress = localStorage.getItem(`quiz_progress_${uploadId}`);
    if (savedProgress) {
      const { answers: savedAnswers, timeLeft: savedTime } = JSON.parse(savedProgress);
      setAnswers(savedAnswers);
      setTimeLeft(savedTime);
    }
  }, [uploadId]);

  // Timer effect
  useEffect(() => {
    if (!submitted && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          // Save progress every minute
          if (prev % 60 === 0) {
            saveProgress(prev - 1, false);
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    } else if (timeLeft === 0 && !submitted) {
      handleSubmit();
    }
  }, [timeLeft, submitted]);

  const fetchQuiz = async () => {
    try {
      const res = await fetch(`/api/quiz?uploadId=${uploadId}`);
      const data = await res.json();
      if (res.ok) {
        setQuiz(data.quiz);
      } else {
        setError(data.error || 'Failed to load quiz');
        addToast(data.error || 'Failed to load quiz', 'error');
      }
    } catch (err) {
      setError('Network error');
      addToast('Network error', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (uploadId) {
      fetchQuiz();
    }
  }, [uploadId]);

  const handleAnswerSelect = (questionId: string, answer: string) => {
    const newAnswers = {
      ...answers,
      [questionId]: answer
    };
    setAnswers(newAnswers);
    // Auto-save progress on answer selection
    saveProgress(timeLeft, false, newAnswers);
  };

  const saveProgress = async (currentTimeLeft: number, showToast = true, currentAnswers = answers) => {
    try {
      localStorage.setItem(`quiz_progress_${uploadId}`, JSON.stringify({
        answers: currentAnswers,
        timeLeft: currentTimeLeft
      }));
      if (showToast) {
        addToast('Progress saved successfully', 'success');
      }
    } catch (error) {
      if (showToast) {
        addToast('Failed to save progress', 'error');
      }
    }
  };

  const handleSubmit = () => {
    if (!submitted) {
      setShowConfirmDialog(true);
      return;
    }
    submitQuiz();
  };

  const submitQuiz = async () => {
    try {
      setIsSubmitting(true);
      const correctAnswers = quiz.filter(
        q => answers[q.id] === q.correctAnswer
      ).length;
      const calculatedScore = Math.round((correctAnswers / quiz.length) * 100);
      setScore(calculatedScore);
      setSubmitted(true);
      
      // Clear saved progress on successful submission
      localStorage.removeItem(`quiz_progress_${uploadId}`);
      
      addToast(`Quiz submitted! Your score: ${calculatedScore}%`, 'success');
    } catch (error) {
      addToast('Failed to submit quiz', 'error');
    } finally {
      setIsSubmitting(false);
      setShowConfirmDialog(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="mb-6">{error}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
          <Link href="/dashboard" className="ml-4">
            <Button variant="secondary" onClick={() => router.push('/dashboard')}>
              Back to Dashboard
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  if (showConfirmDialog) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <Card className="max-w-md w-full p-6">
          <h3 className="text-xl font-semibold mb-4">Submit Quiz?</h3>
          <p className="mb-6">Are you sure you want to submit your answers? You won't be able to make changes after submission.</p>
          <div className="flex justify-end space-x-4">
            <Button 
              variant="secondary" 
              onClick={() => setShowConfirmDialog(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              onClick={submitQuiz} 
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Quiz'}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold text-indigo-900">Quiz</h1>
        <div className="flex items-center space-x-4">
          {!submitted && (
            <div className="text-lg font-medium text-gray-700">
              Time Left: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
            </div>
          )}
          {!submitted && (
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                onClick={() => saveProgress(timeLeft, true)}
                disabled={isSubmitting}
              >
                Save Progress
              </Button>
              <Button 
                onClick={handleSubmit} 
                disabled={isSubmitting}
              >
                Submit Quiz
              </Button>
            </div>
          )}
        </div>
      </div>

      {!submitted && (
        <div className="mb-6">
          <div className="text-gray-600 mb-2">
            {Object.keys(answers).length} of {quiz.length} questions answered
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-blue-600 h-2.5 rounded-full" 
              style={{ 
                width: `${(Object.keys(answers).length / quiz.length) * 100}%`,
                transition: 'width 0.3s ease'
              }}
            ></div>
          </div>
        </div>
      )}

      {submitted && score !== null && (
        <Card className="mb-8 text-center">
          <h2 className="text-2xl font-semibold mb-2">Quiz Results</h2>
          <p className="text-4xl font-bold text-green-600 mb-4">{score}%</p>
          <p className="text-gray-600">
            You answered {Math.round((score / 100) * quiz.length)} out of {quiz.length} questions correctly.
          </p>
        </Card>
      )}

      <div className="space-y-6">
        {quiz.map((question, index) => (
          <Card key={question.id} className="p-6">
            <h3 className="text-xl font-semibold mb-4">
              Question {index + 1}: {question.question}
            </h3>
            
            <div className="space-y-3">
              {question.options.map((option, optionIndex) => {
                const isSelected = answers[question.id] === option;
                const isCorrect = option === question.correctAnswer;
                const showFeedback = submitted && (isSelected || isCorrect);

                let optionClasses = "p-4 border rounded-lg transition-colors ";
                optionClasses += showFeedback
                  ? isCorrect 
                    ? "bg-green-50 border-green-400" 
                    : isSelected 
                      ? "bg-red-50 border-red-400" 
                      : "hover:bg-gray-50 border-gray-200"
                  : isSelected 
                    ? "bg-blue-50 border-blue-400 cursor-pointer" 
                    : "hover:bg-gray-50 border-gray-200 cursor-pointer";

                return (
                  <div
                    key={optionIndex}
                    className={optionClasses}
                    onClick={() => !submitted && handleAnswerSelect(question.id, option)}
                    onKeyDown={(e) => {
                      if ((e.key === 'Enter' || e.key === ' ') && !submitted) {
                        e.preventDefault();
                        handleAnswerSelect(question.id, option);
                      }
                    }}
                    tabIndex={0}
                    role="radio"
                    aria-checked={isSelected}
                    aria-label={`Option ${optionIndex + 1}: ${option}`}
                  >
                    <div className="flex items-center">
                      <div className={`w-5 h-5 rounded-full border mr-3 flex-shrink-0 flex items-center justify-center ${
                        isSelected ? 'border-blue-500' : 'border-gray-300'
                      }`}>
                        {isSelected && <div className="w-3 h-3 rounded-full bg-blue-500"></div>}
                      </div>
                      <span>{option}</span>
                      {showFeedback && (
                        <span className="ml-2 text-sm font-medium">
                          {isCorrect ? '✓' : isSelected ? '✗' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {submitted && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700">
                  <span className="font-medium">Explanation:</span> {question.correctAnswer} is the correct answer.
                </p>
              </div>
            )}
          </Card>
        ))}
      </div>

      <div className="mt-8 flex justify-between">
        <Link href={`/results/${uploadId}`}>
          <Button variant="secondary">Back to Results</Button>
        </Link>
        {!submitted && (
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting}
            className="ml-auto"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Quiz'}
          </Button>
        )}
      </div>
    </div>
  );
}