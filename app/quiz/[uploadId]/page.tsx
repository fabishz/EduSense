import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Button from '../../components/ui/Button';

interface Quiz {
  questions: string;
}

interface Upload {
  id: string;
  studentName: string;
  quiz?: Quiz;
}

export default function QuizPage() {
  const router = useRouter();
  const { uploadId } = router.query;

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!uploadId || typeof uploadId !== 'string') return;

    async function fetchQuiz() {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`/api/quiz`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ uploadId }),
        });
        const data = await res.json();
        if (res.ok) {
          setQuiz(data.quiz);
        } else {
          setError(data.error || 'Failed to load quiz');
        }
      } catch {
        setError('Network error');
      } finally {
        setLoading(false);
      }
    }

    fetchQuiz();
  }, [uploadId]);

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-3xl font-semibold mb-6 text-indigo-900">Quiz</h1>
      {loading && <p>Loading quiz...</p>}
      {error && <p className="text-red-600">{error}</p>}
      {quiz ? (
        <div className="card">
          <h2 className="text-xl font-semibold mb-2">Questions</h2>
          <pre className="max-h-48 overflow-auto bg-gray-100 p-2 rounded">
            {quiz.questions}
          </pre>
        </div>
      ) : (
        !loading && <p>No quiz available.</p>
      )}
      <Button onClick={() => router.push('/dashboard')}>Back to Dashboard</Button>
    </div>
  );
}
