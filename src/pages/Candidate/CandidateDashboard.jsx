import { useEffect, useState } from "react";
import AvailableJobs from "../../components/AvailableJobs/AvailableJobs";
import ResumeUpload from "../../components/ResumeUpload/ResumeUpload";
import MyResumes from "../../components/MyResumes/MyResumes";
import api from "../../services/api";
import "./CandidateDashboard.css";

function CandidateDashboard({ onLogout, theme, toggleTheme }) {
  const [selectedJob, setSelectedJob] = useState(null);
  const [showProfile, setShowProfile] = useState(false);

  const [profile, setProfile] = useState({
    name: "",
    email: ""
  });

  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");
  const [profileError, setProfileError] = useState("");

  const handleUploaded = () => {
    setSelectedJob(null);
  };

  const loadProfile = async () => {
    try {
      setProfileLoading(true);
      setProfileError("");

      const response = await api.get("/api/users/me");

      setProfile({
        name: response.data.name || "",
        email: response.data.email || ""
      });

      setProfileForm({
        name: response.data.name || "",
        email: response.data.email || "",
        password: "",
        confirmPassword: ""
      });
    } catch (error) {
      console.error("Failed to load profile:", error);
      setProfileError("Failed to load profile.");
    } finally {
      setProfileLoading(false);
    }
  };

  const handleProfileOpen = () => {
    const nextState = !showProfile;

    setShowProfile(nextState);

    if (nextState) {
      setProfileMessage("");
      setProfileError("");
      loadProfile();
    }
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;

    setProfileForm((previous) => ({
      ...previous,
      [name]: value
    }));
  };

  const handleSaveProfile = async () => {
    setProfileMessage("");
    setProfileError("");

    if (!profileForm.name.trim()) {
      setProfileError("Name is required.");
      return;
    }

    if (
      profileForm.password &&
      profileForm.password !== profileForm.confirmPassword
    ) {
      setProfileError("Passwords do not match.");
      return;
    }

    try {
      setProfileSaving(true);

      const requestData = {
        name: profileForm.name.trim()
      };

      if (profileForm.password.trim()) {
        requestData.password = profileForm.password;
      }

      const response = await api.put(
        "/api/users/me",
        requestData
      );

      setProfile({
        name: response.data.name || "",
        email: response.data.email || ""
      });

      setProfileForm((previous) => ({
        ...previous,
        name: response.data.name || "",
        email: response.data.email || "",
        password: "",
        confirmPassword: ""
      }));

      setProfileMessage("Profile updated successfully.");
    } catch (error) {
      console.error("Failed to update profile:", error);

      if (error.response?.status === 401) {
        setProfileError("Session expired. Please login again.");
      } else if (error.response?.data?.message) {
        setProfileError(error.response.data.message);
      } else {
        setProfileError("Failed to update profile.");
      }
    } finally {
      setProfileSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to delete your account? This will permanently delete your profile, resumes, and screening results."
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingAccount(true);
      setProfileError("");

      await api.delete("/api/users/me");

      localStorage.removeItem("token");
      localStorage.removeItem("role");
      localStorage.removeItem("user");

      onLogout();
    } catch (error) {
      console.error("Failed to delete account:", error);

      if (error.response?.data?.message) {
        setProfileError(error.response.data.message);
      } else {
        setProfileError("Failed to delete account.");
      }
    } finally {
      setDeletingAccount(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  return (
    <div className="candidate-dashboard">

      <header className="candidate-header">

        <div className="brand-section">
          <div className="brand-icon">
            RS
          </div>

          <div className="brand-text">
            <h1>Vemora</h1>
            <span>Career Portal</span>
          </div>
        </div>

        <div className="header-right">

          <button
            type="button"
            className="profile-button"
            onClick={handleProfileOpen}
          >
            <div className="profile-avatar">
              {profile.name
                ? profile.name.charAt(0).toUpperCase()
                : "C"}
            </div>

            <div className="profile-info">
              <span className="profile-name">
                {profile.name || "Candidate"}
              </span>

              <span className="profile-role">
                Job Seeker
              </span>
            </div>

            <span className="profile-arrow">
              {showProfile ? "⌃" : "⌄"}
            </span>
          </button>

          <button
            type="button"
            className="theme-toggle candidate-theme-toggle"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            title={
              theme === "dark"
                ? "Switch to light mode"
                : "Switch to dark mode"
            }
          >
            {theme === "dark" ? "☀" : "☾"}
          </button>

          <button
            type="button"
            className="logout-button"
            onClick={onLogout}
          >
            <span>↪</span>
            Logout
          </button>

        </div>

      </header>

      {showProfile && (
        <div className="profile-panel">

          <div className="profile-panel-header">

            <div>
              <h2>My Profile</h2>
              <p>Manage your account information</p>
            </div>

            <button
              type="button"
              className="profile-close-button"
              onClick={() => setShowProfile(false)}
            >
              ×
            </button>

          </div>

          <div className="profile-avatar-large">
            {profileForm.name
              ? profileForm.name.charAt(0).toUpperCase()
              : "C"}
          </div>

          {profileLoading ? (
            <div className="profile-loading">
              Loading profile...
            </div>
          ) : (
            <div className="profile-form">

              <div className="profile-form-group">
                <label>Name</label>

                <input
                  type="text"
                  name="name"
                  value={profileForm.name}
                  onChange={handleProfileChange}
                  placeholder="Enter your name"
                />
              </div>

              <div className="profile-form-group">
                <label>Email</label>

                <input
                  type="email"
                  name="email"
                  value={profileForm.email}
                  disabled
                  readOnly
                />
              </div>

              <div className="profile-form-group">
                <label>Role</label>

                <input
                  type="text"
                  value="Candidate"
                  disabled
                  readOnly
                />
              </div>

              <div className="profile-form-divider"></div>

              <h3>Change Password</h3>

              <div className="profile-form-group">
                <label>New Password</label>

                <input
                  type="password"
                  name="password"
                  value={profileForm.password}
                  onChange={handleProfileChange}
                  placeholder="Enter new password"
                />
              </div>

              <div className="profile-form-group">
                <label>Confirm Password</label>

                <input
                  type="password"
                  name="confirmPassword"
                  value={profileForm.confirmPassword}
                  onChange={handleProfileChange}
                  placeholder="Confirm new password"
                />
              </div>

              {profileError && (
                <div className="profile-error">
                  {profileError}
                </div>
              )}

              {profileMessage && (
                <div className="profile-success">
                  {profileMessage}
                </div>
              )}

              <div className="profile-actions">

                <button
                  type="button"
                  className="profile-delete-button"
                  onClick={handleDeleteAccount}
                  disabled={profileSaving || deletingAccount}
                >
                  {deletingAccount ? "Deleting..." : "Delete Account"}
                </button>

                <button
                  type="button"
                  className="profile-cancel-button"
                  onClick={() => setShowProfile(false)}
                  disabled={profileSaving}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="profile-save-button"
                  onClick={handleSaveProfile}
                  disabled={profileSaving}
                >
                  {profileSaving
                    ? "Saving..."
                    : "Save Changes"}
                </button>

              </div>

            </div>
          )}

        </div>
      )}

      <main className="candidate-main">

        <section className="welcome-section">

          <div>
            <span className="welcome-label">
              CANDIDATE DASHBOARD
            </span>

            <h2>
              Find your next opportunity
            </h2>

            <p>
              Explore available jobs, submit your resume,
              and track your applications from one place.
            </p>
          </div>

        </section>

        <div className="candidate-content">

          <section className="primary-section">

            {selectedJob ? (
              <ResumeUpload
                job={selectedJob}
                onUploaded={handleUploaded}
                onCancel={() => setSelectedJob(null)}
              />
            ) : (
              <AvailableJobs
                onSelectJob={setSelectedJob}
              />
            )}

          </section>

          <section className="resume-section">

            <div className="section-title">

              <div>
                <h2>My Resumes</h2>

                <p>
                  Manage your uploaded resumes
                </p>
              </div>

            </div>

            <MyResumes />

          </section>

        </div>

      </main>

    </div>
  );
}

export default CandidateDashboard;