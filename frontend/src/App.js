import React, { useState, useEffect } from 'react';

function App() {
  const [file, setFile] = useState(null);
  const [resumeData, setResumeData] = useState(null);
  const [questions, setQuestions] = useState({});
  const [qaAnswers, setQaAnswers] = useState({});
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);

  // Load questions from backend on mount
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const res = await fetch('/questions');
        const data = await res.json();
        setQuestions(data);
        const emptyAnswers = Object.fromEntries(Object.keys(data).map(key => [key, '']));
        setQaAnswers(emptyAnswers);
      } catch (err) {
        setError('Failed to load questions');
      }
    };
    fetchQuestions();
  }, []);

  // Upload PDF resume
  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setSummary(null);
    setReport(null);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/upload_resume', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
      const data = await res.json();
      setResumeData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Submit answers for analysis
  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    setSummary(null);
    setReport(null);

    try {
      const res = await fetch('/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resume: resumeData,
          qa: qaAnswers,
          session_name: 'web_session'
        })
      });

      if (!res.ok) throw new Error(`Analyze failed: ${res.status}`);
      const data = await res.json();
      setSummary(data.summary);
      setReport(data.report);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '2rem auto', fontFamily: 'sans-serif' }}>
      <h1>🧠 Career Coach</h1>

      {/* Resume Upload */}
      <div style={{ marginBottom: '1rem' }}>
        <input type="file" accept=".pdf" onChange={e => setFile(e.target.files[0])} />
        <button onClick={handleUpload} disabled={!file || loading} style={{ marginLeft: '1rem' }}>
          Upload Resume
        </button>
      </div>

      {/* Q&A */}
      {resumeData && (
        <div>
          <h2>📝 Career Reflection Questions</h2>
          {Object.entries(questions).map(([key, question]) => (
            <div key={key} style={{ marginBottom: '1rem' }}>
              <label><strong>{question}</strong></label><br />
              <textarea
                rows={2}
                style={{ width: '100%' }}
                value={qaAnswers[key]}
                onChange={e => setQaAnswers({ ...qaAnswers, [key]: e.target.value })}
              />
            </div>
          ))}
          <button onClick={handleAnalyze} disabled={loading}>
            Submit Answers & Analyze
          </button>
        </div>
      )}

      {/* Output */}
      {loading && <p>⏳ Working...</p>}
      {error && <p style={{ color: 'red' }}>❌ {error}</p>}

      {/* Report Summary */}
      {report && (
        <div style={{
          background: '#f0f0f0',
          padding: '1rem',
          marginTop: '2rem',
          borderRadius: '4px',
          whiteSpace: 'pre-wrap',
          wordWrap: 'break-word'
        }}>
          <h2>🧾 Career Coaching Summary</h2>

          <p><strong>Profile Type:</strong> {report.profile_type}</p>
          <p><strong>Summary:</strong> {report.summary}</p>

          <hr style={{ margin: '1rem 0' }} />

          <h3>💪 Strengths</h3>
          <ul>
            {report.strengths?.map((item, i) => <li key={`strength-${i}`}>{item}</li>)}
          </ul>

          <h3>🛠 Gaps</h3>
          <ul>
            {report.gaps?.map((item, i) => <li key={`gap-${i}`}>{item}</li>)}
          </ul>

          <h3>🧭 Recommendations</h3>
          <ul>
            {report.recommendations?.map((item, i) => <li key={`rec-${i}`}>{item}</li>)}
          </ul>

          <h3>🎯 Suggested Roles</h3>
          <ul>
            {report.suggested_jobs?.map((item, i) => <li key={`job-${i}`}>{item}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}

export default App;
