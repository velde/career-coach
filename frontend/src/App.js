import React, { useState, useEffect } from 'react';
import './App.css';

// Resume Summary Component
function ResumeSummary({ resumeData }) {
  console.log('Resume Data received:', resumeData); // Debug log

  // Early return if no data
  if (!resumeData) {
    return <div>No resume data available</div>;
  }

  return (
    <div style={{
      background: '#f8f9fa',
      padding: '1.5rem',
      marginBottom: '2rem',
      borderRadius: '8px',
      border: '1px solid #dee2e6'
    }}>
      <h2>Resume Summary</h2>
      
      <div style={{ whiteSpace: 'pre-wrap' }}>
        {/* Contact Information */}
        {resumeData.contact && (
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ color: '#2c3e50', borderBottom: '2px solid #3498db', paddingBottom: '0.5rem' }}>
              Contact Information
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '0.5rem 1rem' }}>
              {resumeData.contact.email && (
                <>
                  <span style={{ fontWeight: 'bold' }}>Email:</span>
                  <span>{resumeData.contact.email}</span>
                </>
              )}
              {resumeData.contact.phone && (
                <>
                  <span style={{ fontWeight: 'bold' }}>Phone:</span>
                  <span>{resumeData.contact.phone}</span>
                </>
              )}
              {resumeData.contact.address && (
                <>
                  <span style={{ fontWeight: 'bold' }}>Location:</span>
                  <span>{resumeData.contact.address}</span>
                </>
              )}
            </div>
          </div>
        )}

        {/* Experience */}
        {resumeData.experience && resumeData.experience.length > 0 && (
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ color: '#2c3e50', borderBottom: '2px solid #3498db', paddingBottom: '0.5rem' }}>
              Experience
            </h3>
            {resumeData.experience.map((exp, index) => (
              <div key={index} style={{ marginBottom: '1rem', padding: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: 'bold', fontSize: '1.1em' }}>{exp.title}</span>
                  <span style={{ color: '#666' }}>{exp.duration}</span>
                </div>
                <div style={{ color: '#2c3e50', marginBottom: '0.5rem' }}>{exp.company}</div>
                {exp.highlights && exp.highlights.length > 0 && (
                  <ul style={{ margin: '0.5rem 0', paddingLeft: '1.5rem' }}>
                    {exp.highlights.map((highlight, i) => (
                      <li key={i} style={{ marginBottom: '0.25rem' }}>{highlight}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Education */}
        {resumeData.education && resumeData.education.length > 0 && (
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ color: '#2c3e50', borderBottom: '2px solid #3498db', paddingBottom: '0.5rem' }}>
              Education
            </h3>
            {resumeData.education.map((edu, index) => (
              <div key={index} style={{ marginBottom: '1rem', padding: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: 'bold' }}>{edu.degree}</span>
                  <span style={{ color: '#666' }}>{edu.duration}</span>
                </div>
                <div style={{ color: '#2c3e50' }}>{edu.institution}</div>
              </div>
            ))}
          </div>
        )}

        {/* Skills */}
        {resumeData.skills && resumeData.skills.length > 0 && (
          <div>
            <h3 style={{ color: '#2c3e50', borderBottom: '2px solid #3498db', paddingBottom: '0.5rem' }}>
              Skills
            </h3>
            <div style={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: '0.5rem',
              padding: '0.5rem'
            }}>
              {resumeData.skills.map((skill, index) => (
                <span 
                  key={index}
                  style={{
                    background: '#e9ecef',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '15px',
                    fontSize: '0.9em',
                    color: '#495057'
                  }}
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Debug Information */}
        <div style={{ marginTop: '2rem', padding: '1rem', background: '#f0f0f0', borderRadius: '4px' }}>
          <h4>Debug Information</h4>
          <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
            {JSON.stringify(resumeData, null, 2)}
          </pre>
        </div>
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
      const res = await fetch(`${process.env.REACT_APP_API_URL}/upload_resume`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
      const data = await res.json();
      console.log('Upload response:', data); // Debug log
      setResumeData(data);
    } catch (err) {
      console.error('Upload error:', err); // Debug log
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
        <ResumeSummary resumeData={resumeData} />
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
