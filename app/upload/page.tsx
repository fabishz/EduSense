import React, { useState } from 'react';
import Button from '../components/ui/Button';

export default function UploadPage() {
  const [studentName, setStudentName] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  async function handleUpload() {
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentName, fileUrl }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult(data.upload);
      } else {
        setError(data.error || 'Upload failed');
      }
    } catch (e) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-3xl font-semibold mb-6 text-indigo-900">Upload Student Assignment</h1>
      <div className="mb-4">
        <label className="block text-indigo-700 font-medium mb-1">Student Name</label>
        <input
          type="text"
          className="w-full rounded-md border border-gray-300 p-2"
          value={studentName}
          onChange={(e) => setStudentName(e.target.value)}
          placeholder="Enter student name"
        />
      </div>
      <div className="mb-4">
        <label className="block text-indigo-700 font-medium mb-1">File URL (S3)</label>
        <input
          type="text"
          className="w-full rounded-md border border-gray-300 p-2"
          value={fileUrl}
          onChange={(e) => setFileUrl(e.target.value)}
          placeholder="Enter S3 file URL"
        />
      </div>
      <Button onClick={handleUpload} disabled={loading || !studentName || !fileUrl}>
        {loading ? 'Uploading...' : 'Upload'}
      </Button>
      {error && <p className="text-red-600 mt-4">{error}</p>}
      {result && (
        <div className="mt-6 p-4 bg-white rounded-md shadow">
          <h2 className="text-xl font-semibold mb-2">Upload Successful</h2>
          <p><strong>Student:</strong> {result.studentName}</p>
          <p><strong>File URL:</strong> {result.fileUrl}</p>
          <pre className="mt-2 max-h-48 overflow-auto bg-gray-100 p-2 rounded">{result.extractedText}</pre>
        </div>
      )}
    </div>
  );
}
