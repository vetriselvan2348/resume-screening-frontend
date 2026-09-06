import { useEffect, useMemo, useState } from "react";
import api from "../../services/api";
import JobForm from "../../components/JobForm";
import JobList from "../../components/JobList/JobList";
import "./RecruiterDashboard.css";

function RecruiterDashboard({ onLogout }) {
  const [jobs, setJobs] = useState([]);
  const [applicantCounts, setApplicantCounts] = useState({});
  const [topMatchCounts, setTopMatchCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [showJobForm, setShowJobForm] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [showProfileEditor, setShowProfileEditor] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");
  const [profileError, setProfileError] = useState("");
  const [showProfilePassword, setShowProfilePassword] = useState(false);
  const [showProfileConfirmPassword, setShowProfileConfirmPassword] = useState(false);

  const [profileForm, setProfileForm] = useState({
    name: "",
    password: "",
    confirmPassword: ""
  });

  const [profile, setProfile] = useState({
    name: "",
    email: ""
  });

  const loadJobs = async () => {
    try {
      setLoading(true);
      setMessage("");

      const response = await api.get("/api/jobs");

      setJobs(response.data || []);
    } catch (error) {
      console.error("Failed to load jobs:", error);

      if (error.response?.status === 401) {
        onLogout();
        return;
      }

      setMessage(
        error.response?.data?.message ||
        "Failed to load your job listings."
      );
    } finally {
      setLoading(false);
    }
  };

  const loadApplicantStats = async (jobList) => {
    if (!jobList.length) {
      setApplicantCounts({});
      setTopMatchCounts({});
      setStatsLoading(false);
      return;
    }

    try {
      setStatsLoading(true);

      const results = await Promise.all(
        jobList.map(async (job) => {
          try {
            const [applicantsResponse, screeningResponse] =
              await Promise.all([
                api.get(
                  `/api/resumes/job/${job.id}/applicants`
                ),
                api.get(
                  `/api/screening/job/${job.id}`
                )
              ]);

            const screeningResults =
              screeningResponse.data || [];

            return {
              jobId: job.id,
              applicants:
                (applicantsResponse.data || []).length,
              hasTopMatch:
                screeningResults.length > 0
            };
          } catch (error) {
            if (error.response?.status === 401) {
              onLogout();
            }

            return {
              jobId: job.id,
              applicants: 0,
              hasTopMatch: false
            };
          }
        })
      );

      const applicantMap = {};
      const topMatchMap = {};

      results.forEach((result) => {
        applicantMap[result.jobId] =
          result.applicants;

        topMatchMap[result.jobId] =
          result.hasTopMatch ? 1 : 0;
      });

      setApplicantCounts(applicantMap);
      setTopMatchCounts(topMatchMap);
    } finally {
      setStatsLoading(false);
    }
  };

  const loadProfile = async () => {
    try {
      setProfileLoading(true);

      const response =
        await api.get("/api/users/me");

      const name = response.data.name || "";
      const email = response.data.email || "";

      setProfile({ name, email });
      setProfileForm({
        name,
        password: "",
        confirmPassword: ""
      });
    } catch (error) {
      console.error(
        "Failed to load recruiter profile:",
        error
      );

      if (error.response?.status === 401) {
        onLogout();
      }
    } finally {
      setProfileLoading(false);
    }
  };

  const handleProfileChange = (event) => {
    const { name, value } = event.target;
    setProfileForm((previous) => ({
      ...previous,
      [name]: value
    }));
  };

  const openProfileEditor = () => {
    setProfileError("");
    setProfileMessage("");
    setProfileForm({
      name: profile.name,
      password: "",
      confirmPassword: ""
    });
    setShowProfileEditor(true);
  };

  const closeProfileEditor = () => {
    if (savingProfile) return;
    setShowProfileEditor(false);
    setProfileError("");
    setProfileMessage("");
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    setProfileError("");
    setProfileMessage("");

    const name = profileForm.name.trim();

    if (!name) {
      setProfileError("Name cannot be empty.");
      return;
    }

    if (profileForm.password && profileForm.password !== profileForm.confirmPassword) {
      setProfileError("Passwords do not match.");
      return;
    }

    try {
      setSavingProfile(true);

      const payload = { name };

      if (profileForm.password.trim()) {
        payload.password = profileForm.password;
      }

      const response = await api.put("/api/users/me", payload);
      const updatedName = response.data.name || name;
      const updatedEmail = response.data.email || profile.email;

      setProfile({
        name: updatedName,
        email: updatedEmail
      });
      setProfileForm({
        name: updatedName,
        password: "",
        confirmPassword: ""
      });
      setProfileMessage("Profile updated successfully.");
    } catch (error) {
      if (error.response?.status === 401) {
        onLogout();
        return;
      }
      setProfileError(
        error.response?.data?.message ||
        "Failed to update your profile."
      );
    } finally {
      setSavingProfile(false);
    }
  };

  useEffect(() => {
    loadJobs();
    loadProfile();
  }, []);

  useEffect(() => {
    if (!loading) {
      loadApplicantStats(jobs);
    }
  }, [jobs, loading]);

  const handleJobCreated = (newJob) => {
    setJobs((previousJobs) => [
      ...previousJobs,
      newJob
    ]);

    setShowJobForm(false);
  };

  const totalApplicants = useMemo(() => {
    return Object.values(applicantCounts)
      .reduce(
        (total, count) => total + count,
        0
      );
  }, [applicantCounts]);

  const totalTopMatches = useMemo(() => {
    return Object.values(topMatchCounts)
      .reduce(
        (total, count) => total + count,
        0
      );
  }, [topMatchCounts]);

  const recruiterName =
    profile.name || "Recruiter";

  const initial =
    recruiterName
      .charAt(0)
      .toUpperCase();

  return (
    <div className="recruiter-dashboard">

      <header className="recruiter-header">

        <div className="recruiter-brand">

          <div className="recruiter-logo">
            RS
          </div>

          <div className="recruiter-brand-text">
            <h1>Resume Screening</h1>
            <span>Recruiter Portal</span>
          </div>

        </div>

        <div className="recruiter-header-actions">

          <button
            type="button"
            className="recruiter-profile-button"
            onClick={() =>
              setShowProfile(
                (previous) => !previous
              )
            }
          >
            <span className="recruiter-avatar">
              {initial}
            </span>

            <span className="recruiter-profile-name">
              {recruiterName}
            </span>

            <span className="profile-arrow">
              {showProfile ? "▲" : "▼"}
            </span>
          </button>

          <button
            type="button"
            className="recruiter-logout-button"
            onClick={onLogout}
          >
            Logout
          </button>

        </div>

      </header>

      {showProfile && (
        <div className="recruiter-profile-panel">
          <div className="profile-panel-avatar">
            {initial}
          </div>

          <div className="profile-panel-info">
            {profileLoading ? (
              <p>Loading profile...</p>
            ) : (
              <>
                <h3>{profile.name}</h3>
                <p>{profile.email}</p>
                <span>Recruiter Account</span>
                <button
                  type="button"
                  className="profile-edit-button"
                  onClick={openProfileEditor}
                >
                  Edit Profile
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {showProfileEditor && (
        <div className="profile-modal-backdrop" onMouseDown={closeProfileEditor}>
          <section
            className="profile-edit-modal"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="profile-edit-header">
              <div>
                <span className="section-eyebrow">ACCOUNT SETTINGS</span>
                <h2>Edit Profile</h2>
                <p>Update your recruiter name or password.</p>
              </div>
              <button
                type="button"
                className="profile-modal-close"
                onClick={closeProfileEditor}
                disabled={savingProfile}
              >
                ×
              </button>
            </div>

            <form className="profile-edit-form" onSubmit={saveProfile}>
              <div className="profile-form-field">
                <label htmlFor="recruiter-name">Name</label>
                <input
                  id="recruiter-name"
                  name="name"
                  type="text"
                  value={profileForm.name}
                  onChange={handleProfileChange}
                  disabled={savingProfile}
                  required
                />
              </div>

              <div className="profile-form-field">
                <label htmlFor="recruiter-email">Email</label>
                <div className="profile-locked-field">
                  <input
                    id="recruiter-email"
                    type="email"
                    value={profile.email}
                    readOnly
                    disabled
                  />
                  <span>Locked</span>
                </div>
              </div>

              <div className="profile-form-field">
                <label htmlFor="recruiter-role">Role</label>
                <div className="profile-locked-field">
                  <input
                    id="recruiter-role"
                    type="text"
                    value="RECRUITER"
                    readOnly
                    disabled
                  />
                  <span>Locked</span>
                </div>
              </div>

              <div className="profile-form-divider"></div>

              <div className="profile-form-field">
                <label htmlFor="recruiter-password">New Password</label>
                <div className="password-field">
                  <input
                    id="recruiter-password"
                    name="password"
                    type={showProfilePassword ? "text" : "password"}
                    value={profileForm.password}
                    onChange={handleProfileChange}
                    disabled={savingProfile}
                    minLength={6}
                    placeholder="Leave blank to keep current password"
                  />
                  <button type="button" className="password-toggle" onClick={() => setShowProfilePassword(!showProfilePassword)}>
                    👁
                  </button>
                </div>
              </div>

              <div className="profile-form-field">
                <label htmlFor="recruiter-confirm-password">Confirm Password</label>
                <div className="password-field">
                  <input
                    id="recruiter-confirm-password"
                    name="confirmPassword"
                    type={showProfileConfirmPassword ? "text" : "password"}
                    value={profileForm.confirmPassword}
                    onChange={handleProfileChange}
                    disabled={savingProfile}
                    minLength={6}
                    placeholder="Re-enter new password"
                  />
                  <button type="button" className="password-toggle" onClick={() => setShowProfileConfirmPassword(!showProfileConfirmPassword)}>
                    👁
                  </button>
                </div>
              </div>

              {profileError && (
                <div className="profile-form-error">{profileError}</div>
              )}

              {profileMessage && (
                <div className="profile-form-success">{profileMessage}</div>
              )}

              <div className="profile-edit-actions">
                <button
                  type="button"
                  className="profile-cancel-button"
                  onClick={closeProfileEditor}
                  disabled={savingProfile}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="profile-save-button"
                  disabled={savingProfile}
                >
                  {savingProfile ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      <main className="recruiter-main">

        <section className="recruiter-hero">

          <div className="hero-content">

            <span className="hero-eyebrow">
              RECRUITER WORKSPACE
            </span>

            <h2>
              Find the right talent faster.
            </h2>

            <p>
              Manage your job openings, review candidates,
              and identify your strongest applicants from one place.
            </p>

            <button
              type="button"
              className="hero-post-button"
              onClick={() =>
                setShowJobForm(true)
              }
            >
              <span>+</span>
              Post a New Job
            </button>

          </div>

          <div className="hero-visual">

            <div className="hero-ring hero-ring-one"></div>
            <div className="hero-ring hero-ring-two"></div>

            <div className="hero-center">
              <span>RS</span>
            </div>

          </div>

        </section>

        <section className="recruiter-stats">

          <div className="stat-card">

            <div className="stat-icon stat-icon-jobs">
              💼
            </div>

            <div className="stat-text">

              <span>Active Jobs</span>

              <strong>
                {jobs.length}
              </strong>

              <small>
                Current openings
              </small>

            </div>

          </div>

          <div className="stat-card">

            <div className="stat-icon stat-icon-applicants">
              👥
            </div>

            <div className="stat-text">

              <span>Total Applicants</span>

              <strong>
                {statsLoading
                  ? "—"
                  : totalApplicants}
              </strong>

              <small>
                Across all jobs
              </small>

            </div>

          </div>

          <div className="stat-card">

            <div className="stat-icon stat-icon-matches">
              ★
            </div>

            <div className="stat-text">

              <span>Jobs With Matches</span>

              <strong>
                {statsLoading
                  ? "—"
                  : totalTopMatches}
              </strong>

              <small>
                Ready for review
              </small>

            </div>

          </div>

        </section>

        <section className="create-job-card">

          <div className="create-job-content">

            <div className="create-job-icon">
              +
            </div>

            <div>
              <span className="section-eyebrow">
                RECRUITMENT
              </span>

              <h2>
                Create a new opportunity
              </h2>

              <p>
                Post a job and start discovering qualified candidates.
              </p>
            </div>

          </div>

          <button
            type="button"
            className="create-job-button"
            onClick={() =>
              setShowJobForm(
                (previous) => !previous
              )
            }
          >
            {showJobForm
              ? "Close Form"
              : "Create Job"}
          </button>

        </section>

        {showJobForm && (
          <section className="job-form-card">

            <div className="job-form-card-header">

              <div>
                <span className="section-eyebrow">
                  NEW POSITION
                </span>

                <h2>
                  Post a New Job
                </h2>

                <p>
                  Enter the position details below.
                </p>
              </div>

              <button
                type="button"
                className="close-form-button"
                onClick={() =>
                  setShowJobForm(false)
                }
              >
                ×
              </button>

            </div>

            <div className="job-form-inner">
              <JobForm
                onJobCreated={
                  handleJobCreated
                }
              />
            </div>

          </section>
        )}

        <JobList
          jobs={jobs}
          loading={loading}
          message={message}
          onRefresh={loadJobs}
          applicantCounts={applicantCounts}
        />

      </main>

      <footer className="recruiter-footer">

        <span>
          Resume Screening System
        </span>

        <span>
          Recruiter Portal
        </span>

      </footer>

    </div>
  );
}

export default RecruiterDashboard;