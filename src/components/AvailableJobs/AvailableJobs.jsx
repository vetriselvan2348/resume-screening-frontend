import { useEffect, useMemo, useState } from "react";
import api from "../../services/api";
import "./AvailableJobs.css";

function AvailableJobs({ onSelectJob }) {
  const [jobs, setJobs] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadJobs = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const response = await api.get("/api/jobs");

      setJobs(response.data || []);
    } catch (err) {
      console.error("Failed to load jobs:", err);

      if (err.response?.status === 401) {
        setError("Your session has expired.");
      } else {
        setError(
          err.response?.data?.message ||
          "Unable to load available jobs."
        );
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, []);

  const filteredJobs = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return jobs;
    }

    return jobs.filter((job) => {
      const title =
        job.title?.toLowerCase() || "";

      const description =
        job.description?.toLowerCase() || "";

      const skills =
        job.requiredSkills?.toLowerCase() || "";

      return (
        title.includes(query) ||
        description.includes(query) ||
        skills.includes(query)
      );
    });
  }, [jobs, search]);

  const getSkills = (requiredSkills) => {
    if (!requiredSkills) {
      return [];
    }

    const normalized = requiredSkills
      .replace(/\r/g, "\n")
      .split(/[,;\n|]+/)
      .map((skill) => skill.trim())
      .filter(Boolean);

    if (normalized.length > 1) {
      return normalized.slice(0, 8);
    }

    const value = normalized[0];

    if (!value) {
      return [];
    }

    if (value.length > 80) {
      return [value.slice(0, 80).trim() + "..."];
    }

    return [value];
  };
  const getDescription = (description) => {
    if (!description) {
      return "No detailed description has been provided for this position.";
    }

    return description.trim();
  };

  if (loading) {
    return (
      <section className="available-jobs">
        <div className="jobs-heading">
          <div>
            <span className="jobs-label">
              OPPORTUNITIES
            </span>

            <h2>Available Jobs</h2>

            <p>
              Explore roles that match your skills
              and career goals.
            </p>
          </div>
        </div>

        <div className="jobs-loading-grid">
          <div className="job-skeleton"></div>
          <div className="job-skeleton"></div>
          <div className="job-skeleton"></div>
        </div>
      </section>
    );
  }

  return (
    <section className="available-jobs">

      <div className="jobs-heading">

        <div className="jobs-heading-content">
          <span className="jobs-label">
            OPPORTUNITIES
          </span>

          <h2>Available Jobs</h2>

          <p>
            Explore roles that match your skills
            and career goals.
          </p>
        </div>

        <button
          type="button"
          className="refresh-button"
          onClick={() => loadJobs(true)}
          disabled={refreshing}
        >
          <span className="refresh-icon">
            ↻
          </span>

          {refreshing
            ? "Refreshing..."
            : "Refresh"}
        </button>

      </div>

      <div className="job-search-container">

        <div className="job-search-box">

          <span className="search-icon">
            ⌕
          </span>

          <input
            type="text"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search by job title, skill or keyword..."
            aria-label="Search jobs"
          />

          {search && (
            <button
              type="button"
              className="clear-search-button"
              onClick={() => setSearch("")}
              aria-label="Clear search"
            >
              ×
            </button>
          )}

        </div>

      </div>

      {error && (
        <div className="jobs-message error">
          {error}
        </div>
      )}

      <div className="search-results-info">
        <span>
          {filteredJobs.length}{" "}
          {filteredJobs.length === 1
            ? "position"
            : "positions"}
        </span>

        {search && (
          <span className="search-active">
            Results for "{search}"
          </span>
        )}
      </div>

      {filteredJobs.length === 0 ? (

        <div className="empty-jobs">

          <div className="empty-icon">
            {search ? "⌕" : "💼"}
          </div>

          <h3>
            {search
              ? "No matching jobs"
              : "No jobs available"}
          </h3>

          <p>
            {search
              ? "Try a different job title, skill or keyword."
              : "There are currently no open positions."}
          </p>

          {search && (
            <button
              type="button"
              className="empty-clear-button"
              onClick={() => setSearch("")}
            >
              Clear Search
            </button>
          )}

        </div>

      ) : (

        <div className="jobs-grid">

          {filteredJobs.map((job) => {

            const skills = getSkills(
              job.requiredSkills
            );

            const visibleSkills =
              skills.slice(0, 4);

            const remainingSkills =
              Math.max(
                skills.length - visibleSkills.length,
                0
              );

            return (
              <article
                className="job-card"
                key={job.id}
                onClick={() => onSelectJob(job)}
              >

                <div className="job-card-top">

                  <div className="company-icon">
                    💼
                  </div>

                  <div className="job-status-row">

                    <span className="job-status-dot"></span>

                    <span className="job-status">
                      OPEN
                    </span>

                  </div>

                </div>

                <div className="job-card-title-area">

                  <h3>
                    {job.title}
                  </h3>

                </div>

                <div className="job-description-wrap">

                  <p className="job-description">
                    {getDescription(
                      job.description
                    )}
                  </p>

                </div>

                <div className="job-card-meta">

                  <div className="job-meta-item">

                    <span className="meta-icon">
                      ◷
                    </span>

                    <div>
                      <span className="meta-label">
                        EXPERIENCE
                      </span>

                      <strong>
                        {job.minimumExperience || 0}{" "}
                        {job.minimumExperience === 1
                          ? "Year"
                          : "Years"}
                      </strong>
                    </div>

                  </div>

                  <div className="job-meta-item">

                    <span className="meta-icon">
                      ✓
                    </span>

                    <div>
                      <span className="meta-label">
                        STATUS
                      </span>

                      <strong
                        className={
                          job.alreadyApplied
                            ? "status-applied"
                            : "status-open"
                        }
                      >
                        {job.alreadyApplied
                          ? "Applied"
                          : "Not Applied"}
                      </strong>
                    </div>

                  </div>

                </div>

                <div className="job-skills-section">

                  <span className="skills-label">
                    REQUIRED SKILLS
                  </span>

                  {visibleSkills.length > 0 ? (

                    <div className="skills-list">

                      {visibleSkills.map(
                        (skill, index) => (
                          <span
                            className="skill-chip"
                            key={`${skill}-${index}`}
                          >
                            {skill}
                          </span>
                        )
                      )}

                      {remainingSkills > 0 && (
                        <span className="skill-chip skill-more">
                          +{remainingSkills}
                        </span>
                      )}

                    </div>

                  ) : (

                    <span className="skills-not-specified">
                      Skills not specified
                    </span>

                  )}

                </div>

                <div className="job-card-footer">

                  <button
                    type="button"
                    className={
                      job.alreadyApplied
                        ? "apply-button already-applied-button"
                        : "apply-button"
                    }
                    onClick={(event) => {
                      event.stopPropagation();
                      onSelectJob(job);
                    }}
                  >

                    {job.alreadyApplied ? (
                      <>
                        <span>✓</span>
                        Application Submitted
                      </>
                    ) : (
                      <>
                        <span>View & Apply</span>
                        <strong>→</strong>
                      </>
                    )}

                  </button>

                </div>

              </article>
            );
          })}

        </div>

      )}

    </section>
  );
}

export default AvailableJobs;
