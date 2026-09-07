import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import api from "../../services/api";
import ResumeUpload from "../../components/ResumeUpload/ResumeUpload";
import "./JobDetails.css";

function JobDetails() {
  const navigate = useNavigate();
  const location = useLocation();
  const { jobId } = useParams();

  const [job, setJob] = useState(
    location.state?.job || null
  );

  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [applicationResume, setApplicationResume] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadJob = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(
        `/api/jobs/${jobId}`
      );

      setJob(response.data);

      if (response.data.alreadyApplied) {
        const resumesResponse = await api.get(
          "/api/resumes/my"
        );

        const application =
          (resumesResponse.data || []).find(
            (resume) =>
              Number(resume.jobId) === Number(jobId)
          );

        setApplicationResume(
          application || null
        );
      } else {
        setApplicationResume(null);
      }
    } catch (err) {
      console.error(
        "Failed to load job:",
        err
      );

      if (err.response?.status === 401) {
        setError(
          "Session expired. Please login again."
        );
      } else {
        setError(
          err.response?.data?.message ||
          "Failed to load job details."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJob();
  }, [jobId]);

  const handleUploaded = async () => {
    setShowUpload(false);
    setMessage(
      "Application submitted successfully."
    );
    setError("");

    await loadJob();
  };

  const handleUnapply = async () => {
    if (!applicationResume) {
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to withdraw this application?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setMessage("");

      await api.delete(
        `/api/resumes/${applicationResume.id}`
      );

      setApplicationResume(null);

      setJob((current) => ({
        ...current,
        alreadyApplied: false
      }));

      setMessage(
        "Application withdrawn successfully."
      );
    } catch (err) {
      console.error(
        "Failed to withdraw application:",
        err
      );

      setError(
        err.response?.data?.message ||
        "Failed to withdraw application."
      );
    }
  };

  const previewResume = async () => {
    if (!applicationResume) {
      return;
    }

    try {
      setError("");

      const response = await api.get(
        `/api/resumes/${applicationResume.id}/download`,
        {
          responseType: "blob"
        }
      );

      const blob = new Blob(
        [response.data],
        {
          type:
            response.headers["content-type"] ||
            applicationResume.fileType ||
            "application/pdf"
        }
      );

      const url =
        window.URL.createObjectURL(blob);

      window.open(url, "_blank");
    } catch (err) {
      console.error(
        "Failed to preview resume:",
        err
      );

      setError(
        "Failed to preview your resume."
      );
    }
  };

  if (loading && !job) {
    return (
      <div className="job-details-page">
        <div className="job-details-loading">
          Loading job details...
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="job-details-page">
        <div className="job-details-container">
          <div className="job-details-message error">
            Job not found.
          </div>

          <button
            type="button"
            className="job-details-back"
            onClick={() =>
              navigate("/candidate")
            }
          >
            ← Back to Jobs
          </button>
        </div>
      </div>
    );
  }

  const skills = (job.requiredSkills || "")
    .split(",")
    .map((skill) => skill.trim())
    .filter(Boolean);

  return (
    <div className="job-details-page">
      <div className="job-details-container">

        <button
          type="button"
          className="job-details-back"
          onClick={() =>
            navigate("/candidate")
          }
        >
          ← Back to Jobs
        </button>

        <article className="job-details-card">

          <header className="job-details-header">

            <div className="job-details-icon">
              💼
            </div>

            <div className="job-details-title">

              <span className="job-details-status">
                OPEN POSITION
              </span>

              <h1>{job.title}</h1>

              <p>
                Review the complete role details
                before submitting your application.
              </p>

            </div>

          </header>

          <div className="job-details-meta">

            <div className="job-details-meta-item">
              <span>EXPERIENCE</span>
              <strong>
                {job.minimumExperience || 0}{" "}
                {job.minimumExperience === 1
                  ? "Year"
                  : "Years"}
              </strong>
            </div>

            <div className="job-details-meta-item">
              <span>APPLICATION</span>

              <strong
                className={
                  job.alreadyApplied
                    ? "application-status-applied"
                    : ""
                }
              >
                {job.alreadyApplied
                  ? "Submitted"
                  : "Not Applied"}
              </strong>
            </div>

            <div className="job-details-meta-item">
              <span>POSITION</span>
              <strong>{job.title}</strong>
            </div>

          </div>

          <section className="job-details-section">

            <h2>Job Description</h2>

            <p>
              {job.description ||
                "No job description provided."}
            </p>

          </section>

          <section className="job-details-section">

            <h2>Required Skills</h2>

            {skills.length > 0 ? (
              <div className="job-details-skills">

                {skills.map((skill, index) => (
                  <span
                    className="job-details-skill"
                    key={`${skill}-${index}`}
                  >
                    {skill}
                  </span>
                ))}

              </div>
            ) : (
              <p>
                No specific skills listed.
              </p>
            )}

          </section>

          {error && (
            <div className="job-details-message error">
              {error}
            </div>
          )}

          {message && (
            <div className="job-details-message success">
              {message}
            </div>
          )}

          {job.alreadyApplied &&
          applicationResume ? (

            <section className="job-application-panel applied">

              <div className="application-panel-content">

                <span className="application-badge">
                  ✓ APPLICATION SUBMITTED
                </span>

                <h2>
                  Your application is active
                </h2>

                <p>
                  Your resume has been submitted
                  for this position.
                </p>

                <div className="application-resume-name">
                  <span>Resume</span>

                  <strong>
                    {applicationResume.fileName}
                  </strong>
                </div>

              </div>

              <div className="job-details-actions">

                <button
                  type="button"
                  className="preview-resume-button"
                  onClick={previewResume}
                >
                  Preview Resume
                </button>

                <button
                  type="button"
                  className="unapply-button"
                  onClick={handleUnapply}
                >
                  Unapply
                </button>

              </div>

            </section>

          ) : job.alreadyApplied ? (

            <section className="job-application-panel applied">

              <div className="application-panel-content">

                <span className="application-badge">
                  ✓ APPLICATION SUBMITTED
                </span>

                <h2>
                  Your application is active
                </h2>

                <p>
                  Your application has been
                  submitted for this position.
                </p>

              </div>

            </section>

          ) : !showUpload ? (

            <section className="job-application-panel">

              <div className="application-panel-content">

                <span className="application-label">
                  READY TO APPLY?
                </span>

                <h2>
                  Submit your application
                </h2>

                <p>
                  Upload your resume for this
                  position and submit your
                  application.
                </p>

              </div>

              <button
                type="button"
                className="submit-application-button"
                onClick={() =>
                  setShowUpload(true)
                }
              >
                Apply Now →
              </button>

            </section>

          ) : (

            <section className="job-application-panel">

              <div className="application-panel-content">

                <span className="application-label">
                  APPLICATION
                </span>

                <h2>
                  Upload your resume
                </h2>

                <p>
                  Upload the resume you want
                  to use for this application.
                </p>

              </div>

              <ResumeUpload
                job={job}
                onUploaded={handleUploaded}
                onCancel={() =>
                  setShowUpload(false)
                }
              />

            </section>

          )}

        </article>

      </div>
    </div>
  );
}

export default JobDetails;
