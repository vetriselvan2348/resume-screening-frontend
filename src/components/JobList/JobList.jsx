import { useState } from "react";

import api from "../../services/api";

import "./JobList.css";

function JobList({

  jobs,

  loading,

  message,

  onRefresh,

  applicantCounts = {}

}) {

  const [selectedJob, setSelectedJob] = useState(null);

  const [applicants, setApplicants] = useState([]);

  const [screeningResults, setScreeningResults] = useState([]);

  const [loadingApplicants, setLoadingApplicants] = useState(false);

  const [applicantMessage, setApplicantMessage] = useState("");

  const [selectedApplicant, setSelectedApplicant] = useState(null);

  const [loadingResume, setLoadingResume] = useState(null);

  const [screeningResume, setScreeningResume] = useState(null);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");

  const [deletingJob, setDeletingJob] = useState(null);

  const [jobSearchTerm, setJobSearchTerm] = useState("");

  const loadApplicants = async (job) => {

    try {

      setSelectedJob(job);

      setSelectedApplicant(null);

      setLoadingApplicants(true);

      setApplicantMessage("");

      setSearchTerm("");

      const [applicantsResponse, screeningResponse] =

        await Promise.all([

          api.get(`/api/resumes/job/${job.id}/applicants`),

          api.get(`/api/screening/job/${job.id}`)

        ]);

      setApplicants(applicantsResponse.data || []);

      setScreeningResults(screeningResponse.data || []);

    } catch (error) {

      console.error("Failed to load applicants:", error);

      if (error.response?.status === 401) {

        setApplicantMessage("Session expired. Please login again.");

      } else if (error.response?.status === 403) {

        setApplicantMessage(

          "You are not allowed to view applicants for this job."

        );

      } else {

        setApplicantMessage(

          error.response?.data?.message ||

          "Failed to load applicants."

        );

      }

    } finally {

      setLoadingApplicants(false);

    }

  };

  const filteredJobs = jobs.filter((job) => {

  const searchText = [

    job.title,

    job.description,

    job.requiredSkills,

    job.minimumExperience

  ]

    .filter(Boolean)

    .join(" ")

    .toLowerCase();

  return searchText.includes(

    jobSearchTerm.trim().toLowerCase()

  );

});

  const deleteJob = async (job) => {

    const confirmed = window.confirm(

      `Are you sure you want to delete "${job.title}"?\n\nThis will permanently delete the job and all applications and screening results associated with it.`

    );

    if (!confirmed) {

      return;

    }

    try {

      setDeletingJob(job.id);

      if (selectedJob?.id === job.id) {

        closeApplicants();

      }

      await api.delete(`/api/jobs/${job.id}`);

      onRefresh();

    } catch (error) {

      console.error("Failed to delete job:", error);

      if (error.response?.status === 401) {

        window.alert("Session expired. Please login again.");

      } else if (error.response?.status === 403) {

        window.alert("You are not allowed to delete this job.");

      } else {

        window.alert(

          error.response?.data?.message ||

          "Failed to delete the job."

        );

      }

    } finally {

      setDeletingJob(null);

    }

  };

  const closeApplicants = () => {

    setSelectedJob(null);

    setApplicants([]);

    setScreeningResults([]);

    setSelectedApplicant(null);

    setApplicantMessage("");

    setScreeningResume(null);

    setSearchTerm("");

  };

  const getScreeningResult = (resumeId) => {

    return screeningResults.find(

      (result) => result.resumeId === resumeId

    );

  };

  const screenResume = async (applicant) => {

    if (!selectedJob || screeningResume !== null) {

      return;

    }

    try {

      setScreeningResume(applicant.resumeId);

      setApplicantMessage("");

      await api.post("/api/screening", {

        jobId: selectedJob.id,

        resumeId: applicant.resumeId

      });

      const response = await api.get(

        `/api/screening/job/${selectedJob.id}`

      );

      setScreeningResults(response.data || []);

    } catch (error) {

      console.error("Failed to screen resume:", error);

      if (error.response?.status === 401) {

        setApplicantMessage("Session expired. Please login again.");

      } else if (error.response?.status === 403) {

        setApplicantMessage(

          "You are not allowed to screen this resume."

        );

      } else {

        setApplicantMessage(

          error.response?.data?.message ||

          "Failed to analyze the candidate resume."

        );

      }

    } finally {

      setScreeningResume(null);

    }

  };

  const analyzeWithAI = async (applicant) => {
    if (!selectedJob || aiLoading) {
      return;
    }

    try {
      setAiLoading(true);
      setAiError("");
      setAiAnalysis(null);

      const response = await api.post(
        `/api/screening/ai/${selectedJob.id}/${applicant.resumeId}`
      );

      setAiAnalysis(response.data);
      setSelectedApplicant(applicant);
    } catch (error) {
      console.error("Failed to analyze resume with AI:", error);
      if (error.response?.status === 401) {
        setAiError("Session expired. Please login again.");
      } else if (error.response?.status === 403) {
        setAiError("You are not allowed to analyze this resume.");
      } else {
        setAiError(
          error.response?.data?.message ||
          "Failed to get AI analysis. Please try again."
        );
      }
    } finally {
      setAiLoading(false);
    }
  };

  const openResume = async (resumeId) => {

    try {

      setLoadingResume(resumeId);

      const response = await api.get(

        `/api/resumes/${resumeId}/download`,

        {

          responseType: "blob"

        }

      );

      const blob = new Blob(

        [response.data],

        {

          type:

            response.headers["content-type"] ||

            "application/octet-stream"

        }

      );

      const url = window.URL.createObjectURL(blob);

      window.open(

        url,

        "_blank",

        "noopener,noreferrer"

      );

      setTimeout(() => {

        window.URL.revokeObjectURL(url);

      }, 60000);

    } catch (error) {

      console.error("Failed to open resume:", error);

      if (error.response?.status === 401) {

        setApplicantMessage("Session expired. Please login again.");

      } else if (error.response?.status === 403) {

        setApplicantMessage(

          "You are not allowed to access this resume."

        );

      } else {

        setApplicantMessage(

          "Failed to open the candidate resume."

        );

      }

    } finally {

      setLoadingResume(null);

    }

  };

  const sortedApplicants = applicants

    .map((applicant) => ({

      ...applicant,

      screening: getScreeningResult(applicant.resumeId)

    }))

    .sort((a, b) => {

      const scoreA = a.screening?.score ?? -1;

      const scoreB = b.screening?.score ?? -1;

      return scoreB - scoreA;

    });

  const filteredApplicants = sortedApplicants.filter((applicant) => {

    const screening = applicant.screening;

    const searchText = [

      applicant.candidateName,

      applicant.candidateEmail,

      applicant.fileName,

      applicant.fileType,

      screening?.matchedSkills,

      screening?.missingSkills

    ]

      .filter(Boolean)

      .join(" ")

      .toLowerCase();

    return searchText.includes(

      searchTerm.trim().toLowerCase()

    );

  });

  const topMatch =

    sortedApplicants.length > 0 &&

    sortedApplicants[0].screening

      ? sortedApplicants[0]

      : null;

  const getMatchLabel = (score) => {

    if (score === null || score === undefined) {

      return "Analysis Pending";

    }

    if (score >= 85) {

      return "Excellent Match";

    }

    if (score >= 70) {

      return "Strong Match";

    }

    if (score >= 55) {

      return "Good Match";

    }

    return "Low Match";

  };

  const getMatchClass = (score) => {

    if (score === null || score === undefined) {

      return "pending";

    }

    if (score >= 85) {

      return "excellent";

    }

    if (score >= 70) {

      return "strong";

    }

    if (score >= 55) {

      return "good";

    }

    return "low";

  };

  return (

    <>

      <section className="dashboard-card job-list-section">

        <div className="section-header">

          <div>

            <span className="job-list-label">

              MANAGEMENT

            </span>

            <h2>Your Job Listings</h2>

            <p className="job-list-subtitle">

              Manage positions and review candidate applications

            </p>

          </div>

          <button

            type="button"

            className="job-list-refresh"

            onClick={onRefresh}

            disabled={loading}

          >

            <span>↻</span>

            {loading ? "Loading" : "Refresh"}

          </button>

        </div>

        <div className="job-search-wrapper">

  <span className="job-search-icon">🔍</span>

  <input

    type="text"

    className="job-search-input"

    placeholder="Search your jobs..."

    value={jobSearchTerm}

    onChange={(e) =>

      setJobSearchTerm(e.target.value)

    }

  />

  {jobSearchTerm && (

    <button

      type="button"

      className="job-search-clear"

      onClick={() => setJobSearchTerm("")}

    >

      ×

    </button>

  )}

</div>

        {message && (

          <div className="job-list-message">

            <span>!</span>

            {message}

          </div>

        )}

        {loading ? (

          <div className="job-list-loading">

            <div className="job-loading-spinner"></div>

            <p>Loading your jobs...</p>

          </div>

        ) : jobs.length === 0 ? (

          <div className="job-list-empty">

            <div className="job-list-empty-icon">

              💼

            </div>

            <h3>No jobs posted yet</h3>

            <p>

              Create your first job opening to start receiving applications.

            </p>

          </div>

        ) : (

          <div className="jobs-list">

            {filteredJobs.length === 0 ? (

              <div className="job-list-empty">

                <div className="job-list-empty-icon">

                  🔍

                </div>

                <h3>No jobs found</h3>

                <p>

                  No jobs match "{jobSearchTerm}".

                </p>

                <button

                  type="button"

                  onClick={() => setJobSearchTerm("")}

                >

                  Clear Search

                </button>

              </div>

            ) : (

            filteredJobs.map((job) => {

              const count = applicantCounts[job.id] || 0;

              return (

                <article

                  className="recruiter-job-card"

                  key={job.id}

                >

                  <div className="recruiter-job-header">

                    <div className="recruiter-job-identity">

                      <div className="recruiter-job-icon">

                        💼

                      </div>

                      <div>

                        <div className="recruiter-job-meta">

                          <span className="job-open-dot"></span>

                          <span>OPEN</span>

                        </div>

                        <h3>{job.title}</h3>

                      </div>

                    </div>

                    <div className="applicant-count-badge">

                      <strong>{count}</strong>

                      <span>

                        {count === 1

                          ? "Applicant"

                          : "Applicants"}

                      </span>

                    </div>

                  </div>

                  <p className="recruiter-job-description">

                    {job.description}

                  </p>

                  <div className="recruiter-job-information">

                    <div className="job-information-item">

                      <span className="job-information-label">

                        REQUIRED SKILLS

                      </span>

                      <p>

                        {job.requiredSkills ||

                          "Not specified"}

                      </p>

                    </div>

                    <div className="job-information-item experience">

                      <span className="job-information-label">

                        EXPERIENCE

                      </span>

                      <p>

                        {job.minimumExperience} years

                      </p>

                    </div>

                  </div>

                  <div className="recruiter-job-footer">

                    <span>

                      Review candidates and screening results

                    </span>

                    <div className="job-card-actions">

                      <button

                        type="button"

                        className="delete-job-button"

                        onClick={() => deleteJob(job)}

                        disabled={deletingJob === job.id}

                      >

                        {deletingJob === job.id

                          ? "Deleting..."

                          : "Delete"}

                      </button>

                      <button

                        type="button"

                        className="view-applicants-button"

                        onClick={() => loadApplicants(job)}

                      >

                        View Applicants

                        <span>→</span>

                      </button>

                    </div>

                  </div>

                </article>

              );

            })

            )}

          </div>

        )}

      </section>

      {selectedJob && (

        <div

          className="applicant-modal-overlay"

          onClick={closeApplicants}

        >

          <div

            className="applicant-modal"

            onClick={(e) => e.stopPropagation()}

          >

            <div className="applicant-modal-header">

              <div>

                <span className="applicant-modal-eyebrow">

                  CANDIDATE REVIEW

                </span>

                <h2>{selectedJob.title}</h2>

                <p>

                  Review applicants, analyze resumes, and identify the strongest match

                </p>

              </div>

              <button

                type="button"

                className="close-applicant-modal"

                onClick={closeApplicants}

              >

                ×

              </button>

            </div>

            {loadingApplicants ? (

              <div className="applicant-loading">

                <div className="applicant-spinner"></div>

                <h3>Loading applicants</h3>

                <p>

                  Fetching candidate resumes and screening results...

                </p>

              </div>

            ) : applicantMessage ? (

              <div className="applicant-error">

                <span>!</span>

                <p>{applicantMessage}</p>

              </div>

            ) : applicants.length === 0 ? (

              <div className="applicant-empty">

                <div className="applicant-empty-icon">

                  👥

                </div>

                <h3>No applicants yet</h3>

                <p>

                  Candidates who apply for this position will appear here.

                </p>

              </div>

            ) : (

              <div className="applicant-content">

                <div className="applicant-summary">

                  <div className="summary-item">

                    <span>Applicants</span>

                    <strong>{applicants.length}</strong>

                  </div>

                  <div className="summary-item">

                    <span>Screened</span>

                    <strong>{screeningResults.length}</strong>

                  </div>

                  <div className="summary-item">

                    <span>Top Score</span>

                    <strong>

                      {topMatch

                        ? `${topMatch.screening.score.toFixed(1)}%`

                        : "—"}

                    </strong>

                  </div>

                </div>

                {topMatch && (

                  <section className="top-match-card">

                    <div className="top-match-header">

                      <div className="top-match-title">

                        <span className="trophy-icon">

                          🏆

                        </span>

                        <div>

                          <span>TOP MATCH</span>

                          <p>

                            Highest screening score for this position

                          </p>

                        </div>

                      </div>

                      <div className="top-match-score">

                        <strong>

                          {topMatch.screening.score.toFixed(1)}

                        </strong>

                        <span>/100</span>

                      </div>

                    </div>

                    <div className="top-match-candidate">

                      <div className="candidate-avatar large">

                        {(topMatch.candidateName || "C")

                          .charAt(0)

                          .toUpperCase()}

                      </div>

                      <div className="top-match-candidate-info">

                        <h3>{topMatch.candidateName}</h3>

                        <p>{topMatch.candidateEmail}</p>

                        <span

                          className={`match-label ${getMatchClass(

                            topMatch.screening.score

                          )}`}

                        >

                          {getMatchLabel(

                            topMatch.screening.score

                          )}

                        </span>

                      </div>

                    </div>

                    <div className="top-match-analysis">

                      <div className="analysis-column">

                        <span>MATCHED SKILLS</span>

                        <p>

                          {topMatch.screening.matchedSkills ||

                            "None identified"}

                        </p>

                      </div>

                      <div className="analysis-column">

                        <span>MISSING SKILLS</span>

                        <p>

                          {topMatch.screening.missingSkills ||

                            "None identified"}

                        </p>

                      </div>

                    </div>

                    <div className="top-match-actions">

                      <button

                        type="button"

                        onClick={() =>

                          openResume(topMatch.resumeId)

                        }

                        disabled={

                          loadingResume ===

                          topMatch.resumeId

                        }

                      >

                        {loadingResume ===

                        topMatch.resumeId

                          ? "Opening..."

                          : "View Resume"}

                      </button>

                      <button

                        type="button"

                        className="secondary-analysis-button"

                        onClick={() =>

                          setSelectedApplicant(topMatch)

                        }

                      >

                        Full Analysis

                      </button>

                    </div>

                  </section>

                )}

                <div className="applicant-list-heading">

                  <div>

                    <h3>All Applicants</h3>

                    <p>

                      Ranked by screening score

                    </p>

                  </div>

                  <div className="applicant-search-wrapper">

                    <span className="applicant-search-icon">

                      🔍

                    </span>

                    <input

                      type="text"

                      className="applicant-search-input"

                      placeholder="Search applicants..."

                      value={searchTerm}

                      onChange={(e) =>

                        setSearchTerm(e.target.value)

                      }

                    />

                    {searchTerm && (

                      <button

                        type="button"

                        className="applicant-search-clear"

                        onClick={() =>

                          setSearchTerm("")

                        }

                      >

                        ×

                      </button>

                    )}

                  </div>

                </div>

                <div className="applicant-list">

                  {filteredApplicants.length === 0 ? (

                    <div className="applicant-search-empty">

                      <div className="applicant-search-empty-icon">

                        🔍

                      </div>

                      <h3>No applicants found</h3>

                      <p>

                        No applicants match "{searchTerm}".

                      </p>

                      <button

                        type="button"

                        onClick={() => setSearchTerm("")}

                      >

                        Clear Search

                      </button>

                    </div>

                  ) : (

                    filteredApplicants.map(

                      (applicant, index) => {

                        const screening =

                          applicant.screening;

                        const isTop =

                          topMatch &&

                          applicant.resumeId ===

                            topMatch.resumeId;

                        const isScreening =

                          screeningResume ===

                          applicant.resumeId;

                        return (

                          <article

                            className={`applicant-card ${

                              isTop

                                ? "top-applicant"

                                : ""

                            }`}

                            key={applicant.resumeId}

                          >

                            <div className="applicant-rank">

                              {isTop ? (

                                <span className="rank-trophy">

                                  🏆

                                </span>

                              ) : (

                                <span>

                                  \#{index + 1}

                                </span>

                              )}

                            </div>

                            <div className="candidate-avatar">

                              {(applicant.candidateName || "C")

                                .charAt(0)

                                .toUpperCase()}

                            </div>

                            <div className="applicant-info">

                              <h4>

                                {applicant.candidateName}

                              </h4>

                              <p>

                                {applicant.candidateEmail}

                              </p>

                              <span className="applicant-file">

                                📄 {applicant.fileName}

                              </span>

                            </div>

                            <div className="applicant-score">
                              {screening ? (
                                <>
                                  <button
                                    type="button"
                                    className="analysis-button"
                                    onClick={() => {
                                      setSelectedApplicant(applicant);
                                      setAiAnalysis(null);
                                      setAiError("");
                                    }}
                                  >
                                    Analysis
                                  </button>

                                </>
                              ) : (
                                <button
                                  type="button"
                                  className="screen-button"
                                  onClick={() =>
                                    screenResume(applicant)
                                  }
                                  disabled={
                                    screeningResume !== null
                                  }
                                >
                                  {isScreening
                                    ? "Analyzing..."
                                    : "Screen Resume"}
                                </button>
                              )}

                            </div>

                          </article>

                        );

                      }

                    )

                  )}

                </div>

              </div>

            )}

          </div>

        </div>

      )}

      {selectedApplicant && selectedApplicant.screening && (

        <div

          className="analysis-modal-overlay"

          onClick={() =>

            setSelectedApplicant(null)

          }

        >

          <div

            className="analysis-modal"

            onClick={(e) =>

              e.stopPropagation()

            }

          >

            <div className="analysis-modal-header">

              <div>

                <span>{aiAnalysis ? "AI + SCREENING ANALYSIS" : "SCREENING ANALYSIS"}</span>

                <h2>

                  {selectedApplicant.candidateName}

                </h2>

                <p>

                  {selectedApplicant.candidateEmail}

                </p>

              </div>

              <button

                type="button"

                className="analysis-close-button"

                onClick={() =>

                  setSelectedApplicant(null)

                }

              >

                ×

              </button>

            </div>

            <div className="analysis-main-score">

              <div

                className="analysis-score-circle"

                style={{

                  "--score": `${Math.max(

                    0,

                    Math.min(

                      100,

                      selectedApplicant.screening.score

                    )

                  )}%`

                }}

              >

                <div className="analysis-score-inner">

                  <strong>

                    {selectedApplicant.screening.score.toFixed(1)}

                  </strong>

                  <span>/100</span>

                </div>

              </div>

              <div>

                <span className="analysis-score-title">

                  Overall Match

                </span>

                <strong

                  className={`analysis-result-label ${getMatchClass(

                    selectedApplicant.screening.score

                  )}`}

                >

                  {getMatchLabel(

                    selectedApplicant.screening.score

                  )}

                </strong>

              </div>

            </div>

            <div className="analysis-info-grid">

              <div className="analysis-info-card">

                <span>RESUME</span>

                <strong>

                  {selectedApplicant.fileName}

                </strong>

              </div>

              <div className="analysis-info-card">

                <span>CANDIDATE EMAIL</span>

                <strong>

                  {selectedApplicant.candidateEmail}

                </strong>

              </div>

            </div>

            <div className="analysis-skills-grid">

              <div className="analysis-skills-card matched">

                <div className="analysis-skills-heading">

                  <span className="skills-check">

                    ✓

                  </span>

                  <div>

                    <h3>Matched Skills</h3>

                    <p>

                      Skills found in the resume

                    </p>

                  </div>

                </div>

                <div className="skills-content">

                  {selectedApplicant.screening.matchedSkills ||

                    "No matched skills identified."}

                </div>

              </div>

              <div className="analysis-skills-card missing">

                <div className="analysis-skills-heading">

                  <span className="skills-cross">

                    ×

                  </span>

                  <div>

                    <h3>Missing Skills</h3>

                    <p>

                      Required skills not found

                    </p>

                  </div>

                </div>

                <div className="skills-content">

                  {selectedApplicant.screening.missingSkills ||

                    "No missing skills identified."}

                </div>

              </div>

            </div>

            <div className="ai-analysis-panel">
              <div className="ai-analysis-heading">
                <div>
                  <span>GEMINI AI</span>
                  <h3>AI Resume Evaluation</h3>
                  <p>AI-assisted assessment against the job requirements</p>
                </div>
                <button
                  type="button"
                  className="ai-run-button"
                  onClick={() => analyzeWithAI(selectedApplicant)}
                  disabled={aiLoading}
                >
                  {aiLoading ? "Analyzing..." : aiAnalysis ? "Run Again" : "Analyze with AI"}
                </button>
              </div>

              {aiError && (
                <div className="ai-analysis-error">
                  <span>!</span>
                  <p>{aiError}</p>
                </div>
              )}

              {aiLoading && (
                <div className="ai-analysis-loading">
                  <div className="applicant-spinner"></div>
                  <p>Gemini is evaluating the resume against this job...</p>
                </div>
              )}

              {aiAnalysis && !aiLoading && (
                <>
                  <div className="ai-score-grid">
                    <div className="ai-score-card">
                      <span>OVERALL</span>
                      <strong>{Number(aiAnalysis.overallScore || 0).toFixed(1)}</strong>
                      <small>/100</small>
                    </div>
                    <div className="ai-score-card">
                      <span>SKILLS</span>
                      <strong>{Number(aiAnalysis.skillsScore || 0).toFixed(1)}</strong>
                      <small>/100</small>
                    </div>
                    <div className="ai-score-card">
                      <span>EXPERIENCE</span>
                      <strong>{Number(aiAnalysis.experienceScore || 0).toFixed(1)}</strong>
                      <small>/100</small>
                    </div>
                    <div className="ai-score-card">
                      <span>EDUCATION</span>
                      <strong>{Number(aiAnalysis.educationScore || 0).toFixed(1)}</strong>
                      <small>/100</small>
                    </div>
                    <div className="ai-score-card">
                      <span>RESUME QUALITY</span>
                      <strong>{Number(aiAnalysis.resumeQualityScore || 0).toFixed(1)}</strong>
                      <small>/100</small>
                    </div>
                  </div>

                  <div className="ai-recommendation-row">
                    <div>
                      <span>RECOMMENDATION</span>
                      <strong>{aiAnalysis.recommendation || "—"}</strong>
                    </div>
                    <div>
                      <span>INTERVIEW</span>
                      <strong>{aiAnalysis.interviewRecommendation || "—"}</strong>
                    </div>
                  </div>

                  <div className="ai-summary-card">
                    <span>SUMMARY</span>
                    <p>{aiAnalysis.summary || "No summary provided."}</p>
                  </div>

                  <div className="ai-details-grid">
                    <div className="ai-detail-card strengths">
                      <h4>Strengths</h4>
                      {aiAnalysis.strengths?.length ? (
                        <ul>
                          {aiAnalysis.strengths.map((item, index) => (
                            <li key={index}>{item}</li>
                          ))}
                        </ul>
                      ) : (
                        <p>No strengths identified.</p>
                      )}
                    </div>
                    <div className="ai-detail-card weaknesses">
                      <h4>Weaknesses</h4>
                      {aiAnalysis.weaknesses?.length ? (
                        <ul>
                          {aiAnalysis.weaknesses.map((item, index) => (
                            <li key={index}>{item}</li>
                          ))}
                        </ul>
                      ) : (
                        <p>No weaknesses identified.</p>
                      )}
                    </div>
                    <div className="ai-detail-card missing">
                      <h4>Missing Skills</h4>
                      {aiAnalysis.missingSkills?.length ? (
                        <ul>
                          {aiAnalysis.missingSkills.map((item, index) => (
                            <li key={index}>{item}</li>
                          ))}
                        </ul>
                      ) : (
                        <p>No missing skills identified.</p>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="analysis-modal-actions">

              <button

                type="button"

                onClick={() =>

                  openResume(

                    selectedApplicant.resumeId

                  )

                }

                disabled={

                  loadingResume ===

                  selectedApplicant.resumeId

                }

              >

                {loadingResume ===

                selectedApplicant.resumeId

                  ? "Opening Resume..."

                  : "View Candidate Resume"}

                <span>→</span>

              </button>

            </div>

          </div>

        </div>

      )}

    </>

  );

}

export default JobList;