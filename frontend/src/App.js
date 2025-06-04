import React, { useState, useEffect } from 'react';
import './App.css';

// Resume Summary Component
function ResumeSummary({ resumeData, onResumeUpdate }) {
  const [text, setText] = useState(resumeData?.raw_text || '');
  const [selectedText, setSelectedText] = useState('');

  if (!resumeData || !resumeData.raw_text) {
    return <div>No resume data available</div>;
  }

  const handleContextMenu = (e) => {
    e.preventDefault(); // Prevent default context menu
    const selection = window.getSelection();
    const selectedText = selection.toString();
    
    if (selectedText) {
      // Replace the selected text with [REDACTED]
      const newText = text.replace(selectedText, '[REDACTED]');
      setText(newText);
      
      // Update the parent's resumeData with the redacted text
      const updatedResumeData = {
        ...resumeData,
        raw_text: newText
      };
      onResumeUpdate(updatedResumeData);
      
      setSelectedText(''); // Clear selection
    }
  };

  // Format the text by replacing newlines with line breaks
  const formattedText = text
    .split('\n')
    .map((line, index) => (
      <React.Fragment key={index}>
        {line}
        <br />
      </React.Fragment>
    ));

  return (
    <div style={{
      background: '#f0f0f0',
      padding: '1rem',
      marginTop: '2rem',
      borderRadius: '4px',
      whiteSpace: 'pre-wrap',
      wordWrap: 'break-word'
    }}>
      <h2>Resume Summary</h2>
      
      <div style={{ 
        marginBottom: '1rem',
        padding: '1rem',
        background: '#f0f0f0',
        borderRadius: '4px',
        border: '1px solid #dee2e6'
      }}>
        <p style={{ margin: 0 }}>
          If you don't want to send personally identifiable information to OpenAI during the analysis of your resume, 
          you can select the text and right-click to redact it.
        </p>
      </div>

      <div 
        style={{
          fontFamily: 'sans-serif',
          lineHeight: '1.5',
          padding: '0.5rem 0',
          userSelect: 'text',
          cursor: 'text'
        }}
        onContextMenu={handleContextMenu}
      >
        {formattedText}
      </div>
    </div>
  );
}

function App() {
  const [file, setFile] = useState(null);
  const [resumeData, setResumeData] = useState(null);
  const [questions, setQuestions] = useState({});
  const [qaAnswers, setQaAnswers] = useState({});
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);

  // Load questions on mount
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const res = await fetch(`${process.env.REACT_APP_API_URL}/questions`);
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

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setReport(null);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      console.time('Resume Upload');
      const res = await fetch(`${process.env.REACT_APP_API_URL}/upload_resume`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
      const data = await res.json();
      console.timeEnd('Resume Upload');
      console.log('Upload response:', data);
      setResumeData(data);
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    setReport(null);

    try {
      console.time('Analysis');
      const res = await fetch(`${process.env.REACT_APP_API_URL}/analyze`, {
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
      console.timeEnd('Analysis');
      setReport(data.report);
    } catch (err) {
      console.error('Analysis error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResumeUpdate = (updatedResumeData) => {
    setResumeData(updatedResumeData);
  };

  return (
    <div style={{ maxWidth: '800px', margin: '2rem auto', fontFamily: 'sans-serif' }}>
      <h1>🧠 Career Coach</h1>
      <p style={{ marginBottom: '1.5rem' }}>
        This tool analyzes your resume and career reflections using GPT to provide tailored advice on your career direction,
        strengths, skill gaps, and potential next steps. Upload your resume (PDF format only) and answer a few guided questions to receive a personalized coaching report.
      </p>

      {/* Resume Upload */}
      <div style={{ marginBottom: '1rem' }}>
        <input type="file" accept=".pdf" onChange={e => setFile(e.target.files[0])} />
        <button onClick={handleUpload} disabled={!file || loading} style={{ marginLeft: '1rem' }}>
          Upload Resume
        </button>
      </div>

      {/* Resume Summary */}
      {resumeData && (
        <ResumeSummary 
          resumeData={resumeData} 
          onResumeUpdate={handleResumeUpdate}
        />
      )}

      {/* Q&A */}
      {resumeData && (
        <div>
          <h2>Career Reflection Questions</h2>
          <p style={{ marginBottom: '1rem' }}>
            These questions help uncover your motivations, preferences, and openness to change.
            Be honest and specific — the more thoughtful your answers, the more accurate and useful your career coaching summary will be.
          </p>
          {Object.entries(questions).map(([key, question]) => (
            <div key={key} style={{ marginBottom: '1rem' }}>
              <label><strong>{question}</strong></label><br />
              <textarea
                rows={3}
                style={{ width: '100%' }}
                value={qaAnswers[key]}
                onChange={e => setQaAnswers({ ...qaAnswers, [key]: e.target.value })}
              />
            </div>
          ))}
          <p style={{ fontStyle: 'italic', marginTop: '1rem' }}>
            When you press the button below, your resume and reflections will be analyzed using GPT to generate a personalized coaching report.
          </p>
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
          <h2>Career Coaching Summary</h2>

          <p><strong>Profile Type:</strong> {report.profile_type}</p>
          <p><strong>Summary:</strong> {report.summary}</p>

          <hr style={{ margin: '1rem 0' }} />

          <h3>Strengths</h3>
          <ul>
            {report.strengths?.map((item, i) => <li key={`strength-${i}`}>{item}</li>)}
          </ul>

          <h3>Gaps</h3>
          <ul>
            {report.gaps?.map((item, i) => <li key={`gap-${i}`}>{item}</li>)}
          </ul>

          <h3>Recommendations</h3>
          <ul>
            {report.recommendations?.map((item, i) => <li key={`rec-${i}`}>{item}</li>)}
          </ul>

          <h3>Suggested Roles</h3>
          <ul>
            {report.suggested_jobs?.map((item, i) => <li key={`job-${i}`}>{item}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}

export default App;
