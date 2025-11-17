import React, { useEffect, useState } from 'react';
import Button from '../components/ui/Button';

interface Upload {
  id: string;
  studentName: string;
  fileUrl: string;
  createdAt: string;
  analysis?: {
    grade: number;
  };
}

export default function DashboardPage() {
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchUploads() {
      setLoading(true);
      setError('');
      try {
        const res = await fetch('/api/history');
        const data = await res.json();
        if (res.ok) {
          setUploads(data.uploads);
        } else {
          setError(data.error || 'Failed to load uploads');
        }
      } catch {
        setError('Network error');
      } finally {
        setLoading(false);
      }
    }
    fetchUploads();
  }, []);

  return (
    <div className="max-w-5xl mx-auto p-4">
      <h1 className="text-3xl font-semibold mb-6 text-indigo-900">Teacher Dashboard</h1>
      {loading && <p>Loading uploads...</p>}
      {error && <p className="text-red-600">{error}</p>}
      <div className="grid-container">
        {uploads.map((upload) => (
          <div key={upload.id} className="card">
            <h2 className="text-xl font-semibold mb-2">{upload.studentName}</h2>
            <p className="text-sm text-gray-600 mb-1">Uploaded: {new Date(upload.createdAt).toLocaleString()}</p>
            <p className="mb-2">
              Grade: {' '}
              {upload.analysis ? (
                <span className="grade-green font-bold">{upload.analysis.grade}</span>
              ) : (
                <span className="text-yellow-500">Not graded</span>
              )}
            </p>
            <Button
              onClick={() => {
                window.location.href = `/results/${upload.id}`;
              }}
            >
              View Details
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
