import React, { useState, useEffect, useCallback } from 'react';
import './App.css';

// Resume Summary Component
function ResumeSummary({ resumeData, onResumeUpdate }) {
  const [text, setText] = useState(resumeData?.raw_text || '');

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
        border: '2px solid #dee2e6'
      }}>
        <p style={{ margin: 0, fontWeight: '500' }}>
          <strong>NOTE:</strong> If you don't want to send personally identifiable information to OpenAI during the analysis of your resume, 
          you can select the text and right-click to redact it.
        </p>
      </div>

      <div 
        style={{
          fontFamily: 'sans-serif',
          lineHeight: '1.5',
          userSelect: 'text',
          cursor: 'text',
          maxHeight: '15em',
          overflowY: 'auto',
          border: '1px solid #dee2e6',
          borderRadius: '4px',
          padding: '1rem'
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
  const [matchingJobs, setMatchingJobs] = useState(null);
  const [loadingJobs, setLoadingJobs] = useState(false);

  const handleUpload = useCallback(async () => {
    if (!file) return;
    setLoading(true);
    setReport(null);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      console.time('Resume Upload');
      console.log('Starting resume upload...');
      const res = await fetch(`${process.env.REACT_APP_API_URL}/upload_resume`, {
        method: 'POST',
        body: formData,
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error('Upload failed with status:', res.status, 'Response:', errorText);
        throw new Error(`Upload failed: ${res.status} - ${errorText}`);
      }
      
      const data = await res.json();
      console.timeEnd('Resume Upload');
      console.log('Upload response:', data);
      setResumeData(data);
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to upload resume. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [file]);

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

  // Automatically parse resume when file is selected
  useEffect(() => {
    if (file) {
      console.log('File selected:', file.name);
      handleUpload();
    }
  }, [file, handleUpload]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      console.log('New file selected:', selectedFile.name);
      setFile(selectedFile);
    }
  };

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    setReport(null);
    setMatchingJobs(null);

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
      console.log('Analysis response:', data);
      setReport(data.report);

      // After getting the coaching summary, find matching jobs
      setLoadingJobs(true);
      try {
        console.log('Fetching matching jobs...');
        const jobsRes = await fetch(`${process.env.REACT_APP_API_URL}/find_jobs`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            coaching_summary: data.report,
            num_jobs: 5
          })
        });

        if (!jobsRes.ok) {
          console.error('Job search failed:', jobsRes.status);
          throw new Error(`Job search failed: ${jobsRes.status}`);
        }
        const jobsData = await jobsRes.json();
        console.log('Jobs response:', jobsData);
        setMatchingJobs(jobsData.jobs);
      } catch (err) {
        console.error('Job search error:', err);
        // Don't set error state here to avoid hiding the coaching summary
      } finally {
        setLoadingJobs(false);
      }
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
      <h1>Career Coach</h1>
      <p style={{ marginBottom: '1.5rem' }}>
        This tool helps you explore your career path by analyzing your resume and career reflections. 
        It provides personalized coaching advice and matches you with relevant job opportunities that align with your skills, 
        experience, and career goals.
      </p>

      <p style={{ marginBottom: '1.5rem' }}>
        Start by uploading your resume (PDF format only). You can redact any sensitive information before proceeding. 
        Then, answer a few guided questions to help us understand your career aspirations better.
      </p>

      {/* Resume Upload */}
      <div style={{ marginBottom: '2rem' }}>
        <input
          type="file"
          accept=".pdf"
          onChange={handleFileChange}
          style={{ display: 'none' }}
          id="resume-upload"
        />
        <label
          htmlFor="resume-upload"
          style={{
            display: 'inline-block',
            padding: '0.5rem 1rem',
            background: loading ? '#6c757d' : '#007bff',
            color: 'white',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            marginRight: '1rem',
            opacity: loading ? 0.8 : 1
          }}
        >
          {loading ? 'Processing...' : 'Browse'}
        </label>
        {file && <span>Selected: {file.name}</span>}
      </div>

      {/* Resume Summary */}
      {resumeData && (
        <>
          <ResumeSummary 
            resumeData={resumeData} 
            onResumeUpdate={handleResumeUpdate}
          />
          
          {/* Q&A */}
          <div>
            <h2>Career Reflection Questions</h2>
            <p style={{ marginBottom: '1rem' }}>
              These questions help us understand your motivations, preferences, and career goals.
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
              When you're ready, click the button below to analyze your resume and reflections. 
              You'll receive a personalized coaching summary and matching job opportunities.
            </p>
            <button 
              onClick={handleAnalyze} 
              disabled={loading}
              style={{
                display: 'inline-block',
                padding: '0.5rem 1rem',
                background: loading ? '#6c757d' : '#007bff',
                color: 'white',
                borderRadius: '4px',
                cursor: loading ? 'not-allowed' : 'pointer',
                border: 'none',
                fontSize: '1rem',
                opacity: loading ? 0.8 : 1
              }}
            >
              {loading ? 'Analyzing...' : 'Submit & Analyze'}
            </button>
          </div>
        </>
      )}

      {/* Output */}
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

          {/* Job Matching Section */}
          <div style={{ marginTop: '2rem' }}>
            <h2>Matching Job Opportunities</h2>
            {loadingJobs ? (
              <p>Finding matching jobs...</p>
            ) : matchingJobs ? (
              <div style={{ marginTop: '1rem' }}>
                {matchingJobs.map((job, index) => (
                  <div 
                    key={index}
                    style={{
                      background: 'white',
                      padding: '1rem',
                      marginBottom: '1rem',
                      borderRadius: '4px',
                      border: '1px solid #dee2e6'
                    }}
                  >
                    <h3 style={{ margin: '0 0 0.5rem 0' }}>{job['Job Title']}</h3>
                    <p style={{ margin: '0 0 0.5rem 0' }}>{job['Job Description']}</p>
                    
                    <div style={{ marginTop: '0.5rem' }}>
                      <strong>Why This Job Matches:</strong>
                      <p style={{ margin: '0.5rem 0' }}>{job['Match Reasons']}</p>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                      <div style={{ flex: 1 }}>
                        <strong>Your Matching Skills:</strong>
                        <ul style={{ margin: '0.5rem 0' }}>
                          {Array.isArray(job['Matching Skills']) ? job['Matching Skills'].map((skill, i) => (
                            <li key={i}>{skill}</li>
                          )) : <li>No matching skills listed</li>}
                        </ul>
                      </div>
                      <div style={{ flex: 1 }}>
                        <strong>Skills to Develop:</strong>
                        <ul style={{ margin: '0.5rem 0' }}>
                          {Array.isArray(job['Skills to Develop']) ? job['Skills to Develop'].map((skill, i) => (
                            <li key={i}>{skill}</li>
                          )) : <li>No skills to develop listed</li>}
                        </ul>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
