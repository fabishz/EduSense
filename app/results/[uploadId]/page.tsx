import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Button from '../../components/ui/Button';

interface Analysis {
  summary: string;
  keyIdeas: string;
  strengths: string;
  weaknesses: string;
  grade: number;
}

interface Upload {
  id: string;
  studentName: string;
  fileUrl: string;
  extractedText: string;
  analysis?: Analysis;
}

export default function ResultsPage() {
  const router = useRouter();
  const { uploadId } = router.query;

  const [upload, setUpload] = useState<Upload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!uploadId || typeof uploadId !== 'string') return;

    async function fetchResults() {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`/api/history/${uploadId}`);
        const data = await res.json();
        if (res.ok) {
          setUpload(data.upload);
        } else {
          setError(data.error || 'Failed to load results');
        }
      } catch {
        setError('Network error');
      } finally {
        setLoading(false);
      }
    }

    fetchResults();
  }, [uploadId]);

  if (loading) return <p>Loading results...</p>;
  if (error) return <p className="text-red-600">{error}</p>;
  if (!upload) return <p>No results found.</p>;

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-3xl font-semibold mb-6 text-indigo-900">Results for {upload.studentName}</h1>
      <div className="card mb-4">
        <h2 className="text-xl font-semibold mb-2">Extracted Text</h2>
        <pre className="max-h-48 overflow-auto bg-gray-100 p-2 rounded">{upload.extractedText}</pre>
      </div>
      {upload.analysis ? (
        <div className="card">
          <h2 className="text-xl font-semibold mb-2">Analysis</h2>
          <p><strong>Summary:</strong> {upload.analysis.summary}</p>
          <p><strong>Key Ideas:</strong> {upload.analysis.keyIdeas}</p>
          <p><strong>Strengths:</strong> {upload.analysis.strengths}</p>
          <p><strong>Weaknesses:</strong> {upload.analysis.weaknesses}</p>
          <p><strong>Grade:</strong> <span className="grade-green font-bold">{upload.analysis.grade}</span></p>
          <Button onClick={() => router.push(`/quiz/${upload.id}`)}>Generate Quiz</Button>
        </div>
      ) : (
        <p>No analysis available.</p>
      )}
    </div>
  );
}
