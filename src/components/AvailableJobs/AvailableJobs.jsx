import { useEffect, useMemo, useState } from "react";
import api from "../../services/api";
import "./AvailableJobs.css";

function AvailableJobs({ onSelectJob }) {
  const [jobs, setJobs] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const loadJobs = async () => {
    try {
      setLoading(true);
      setMessage("");

      const response = await api.get("/api/jobs");

      setJobs(response.data);
    } catch (error) {
      console.error("Failed to load jobs:", error);

      if (error.response?.status === 401) {
        setMessage("Session expired. Please login again.");
      } else {
        setMessage("Failed to load available jobs.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, []);

  const filteredJobs = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    if (!searchValue) {
      return jobs;
    }

    return jobs.filter((job) => {
      const title = job.title || "";
      const description = job.description || "";
      const skills = job.requiredSkills || "";

      return (
        title.toLowerCase().includes(searchValue) ||
        description.toLowerCase().includes(searchValue) ||
        skills.toLowerCase().includes(searchValue)
      );
    });
  }, [jobs, search]);

  if (loading) {
    return (
      <section className="available-jobs">
        <div className="jobs-heading">
          <div>
            <h2>Available Jobs</h2>
            <p>Find opportunities that match your skills and experience</p>
          </div>
        </div>

        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading available jobs...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="available-jobs">

      <div className="jobs-heading">

        <div>
          <span className="jobs-label">
            OPPORTUNITIES
          </span>

          <h2>Available Jobs</h2>

          <p>
            Find opportunities that match your skills and experience
          </p>
        </div>

        <button
          type="button"
          className="refresh-button"
          onClick={loadJobs}
          disabled={loading}
        >
          <span>↻</span>
          Refresh
        </button>

      </div>

      {message && (
        <div className="jobs-message">
          <span>!</span>
          <p>{message}</p>
        </div>
      )}

      {!message && jobs.length > 0 && (
        <div className="job-search-container">

          <div className="job-search-box">

            <span className="search-icon">
              ⌕
            </span>

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search jobs by title, skills or description..."
            />

            {search && (
              <button
                type="button"
                className="clear-search-button"
                onClick={() => setSearch("")}
              >
                ×
              </button>
            )}

          </div>

          <div className="search-results-info">
            <span>
              {filteredJobs.length}{" "}
              {filteredJobs.length === 1 ? "job" : "jobs"} found
            </span>

            {search && (
              <span>
                Searching for "<strong>{search}</strong>"
              </span>
            )}
          </div>

        </div>
      )}

      {!message && jobs.length === 0 ? (
        <div className="empty-jobs">

          <div className="empty-icon">
            💼
          </div>

          <h3>No jobs available</h3>

          <p>
            There are currently no open positions.
            Please check again later.
          </p>

          <button
            type="button"
            onClick={loadJobs}
          >
            Check Again
          </button>

        </div>
      ) : !message && filteredJobs.length === 0 ? (
        <div className="empty-jobs">

          <div className="empty-icon">
            🔍
          </div>

          <h3>No matching jobs</h3>

          <p>
            Try searching with a different job title,
            skill, or keyword.
          </p>

          <button
            type="button"
            onClick={() => setSearch("")}
          >
            Clear Search
          </button>

        </div>
      ) : (
        <div className="jobs-grid">

          {filteredJobs.map((job) => (

            <article
              className="job-card"
              key={job.id}
            >

              <div className="job-card-header">

                <div className="company-icon">
                  💼
                </div>

                <div className="job-title">

                  <h3>{job.title}</h3>

                  <span className="job-status">
                    Open
                  </span>

                </div>

              </div>

              <p className="job-description">
                {job.description}
              </p>

              <div className="job-details">

                <div className="job-detail">

                  <span className="detail-icon">
                    🛠
                  </span>

                  <div>
                    <span className="detail-label">
                      Required Skills
                    </span>

                    <span className="detail-value">
                      {job.requiredSkills || "Not specified"}
                    </span>
                  </div>

                </div>

                <div className="job-detail">

                  <span className="detail-icon">
                    💼
                  </span>

                  <div>
                    <span className="detail-label">
                      Experience
                    </span>

                    <span className="detail-value">
                      {job.minimumExperience} years
                    </span>
                  </div>

                </div>

              </div>

              {job.alreadyApplied ? (

                <button
                  type="button"
                  className="apply-button already-applied-button"
                  disabled
                >
                  Already Applied
                  <span>✓</span>
                </button>

              ) : (

                <button
                  type="button"
                  className="apply-button"
                  onClick={() => onSelectJob(job)}
                >
                  Apply Now
                  <span>→</span>
                </button>

              )}

            </article>

          ))}

        </div>
      )}

    </section>
  );
}

export default AvailableJobs;