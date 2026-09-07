import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AvailableJobs from "../../components/AvailableJobs/AvailableJobs";
import api from "../../services/api";
import "./CandidateDashboard.css";

function CandidateDashboard({ onLogout, theme, toggleTheme }) {
  const navigate = useNavigate();

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

      if (error.response?.status === 401) {
        onLogout();
        return;
      }

      setProfileError("Failed to load profile.");
    } finally {
      setProfileLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleProfileChange = (event) => {
    const { name, value } = event.target;

    setProfileForm((current) => ({
      ...current,
      [name]: value
    }));
  };

  const handleProfileSave = async (event) => {
    event.preventDefault();

    setProfileMessage("");
    setProfileError("");

    if (
      profileForm.password &&
      profileForm.password !== profileForm.confirmPassword
    ) {
      setProfileError("Passwords do not match.");
      return;
    }

    try {
      setProfileSaving(true);

      const payload = {
        name: profileForm.name,
        email: profileForm.email
      };

      if (profileForm.password) {
        payload.password = profileForm.password;
      }

      const response = await api.put(
        "/api/users/me",
        payload
      );

      setProfile({
        name: response.data.name || profileForm.name,
        email: response.data.email || profileForm.email
      });

      const storedUser = JSON.parse(
        localStorage.getItem("user") || "{}"
      );

      localStorage.setItem(
        "user",
        JSON.stringify({
          ...storedUser,
          name: response.data.name || profileForm.name,
          email: response.data.email || profileForm.email
        })
      );

      setProfileForm((current) => ({
        ...current,
        password: "",
        confirmPassword: ""
      }));

      setProfileMessage("Profile updated successfully.");
    } catch (error) {
      console.error("Failed to update profile:", error);

      if (error.response?.status === 401) {
        onLogout();
        return;
      }

      setProfileError(
        error.response?.data?.message ||
        "Failed to update profile."
      );
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

      if (error.response?.status === 401) {
        onLogout();
        return;
      }

      setProfileError(
        error.response?.data?.message ||
        "Failed to delete account."
      );
    } finally {
      setDeletingAccount(false);
    }
  };

  const openProfile = () => {
    setShowProfile(true);
    setProfileMessage("");
    setProfileError("");
  };

  const closeProfile = () => {
    setShowProfile(false);
    setProfileMessage("");
    setProfileError("");

    setProfileForm({
      name: profile.name,
      email: profile.email,
      password: "",
      confirmPassword: ""
    });
  };

  const handleSelectJob = (job) => {
    navigate(`/candidate/job/${job.id}`, {
      state: {
        job
      }
    });
  };

  const recruiterName = profile.name || "Candidate";

  const initial = recruiterName
    .trim()
    .charAt(0)
    .toUpperCase();

  return (
    <div className="candidate-dashboard">

      <header className="candidate-header">

        <div className="candidate-brand">
          <div className="candidate-brand-mark">
            V
          </div>

          <div>
            <h1>VEMORA</h1>
            <span>Candidate Portal</span>
          </div>
        </div>

        <div className="candidate-header-actions">

          <button
            type="button"
            className="candidate-profile-button"
            onClick={openProfile}
          >
            <span className="candidate-avatar">
              {initial}
            </span>

            <span className="candidate-profile-name">
              {recruiterName}
            </span>

            <span className="candidate-profile-arrow">
              ▼
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
            className="candidate-logout-button"
            onClick={onLogout}
          >
            Logout
          </button>

        </div>

      </header>

      <main className="candidate-main">

        <section className="welcome-section">

          <div>
            <span className="welcome-label">
              CANDIDATE PORTAL
            </span>

            <h2>
              Find your next opportunity
            </h2>

            <p>
              Explore available positions and apply
              with your resume.
            </p>
          </div>

        </section>

        <div className="candidate-content">

          <section className="primary-section">

            <AvailableJobs
              onSelectJob={handleSelectJob}
            />

          </section>

        </div>

      </main>

      {showProfile && (
        <div
          className="profile-modal-overlay"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !profileSaving &&
              !deletingAccount
            ) {
              closeProfile();
            }
          }}
        >

          <div className="profile-modal">

            <div className="profile-modal-header">

              <div>
                <span className="profile-modal-label">
                  ACCOUNT
                </span>

                <h2>Edit Profile</h2>
              </div>

              <button
                type="button"
                className="profile-modal-close"
                onClick={closeProfile}
                disabled={
                  profileSaving ||
                  deletingAccount
                }
              >
                ×
              </button>

            </div>

            {profileLoading ? (
              <div className="profile-loading">
                Loading profile...
              </div>
            ) : (
              <form
                onSubmit={handleProfileSave}
                className="profile-form"
              >

                <div className="profile-form-field">
                  <label htmlFor="candidate-name">
                    Name
                  </label>

                  <input
                    id="candidate-name"
                    name="name"
                    type="text"
                    value={profileForm.name}
                    onChange={handleProfileChange}
                    disabled={
                      profileSaving ||
                      deletingAccount
                    }
                    required
                  />
                </div>

                <div className="profile-form-field">
                  <label htmlFor="candidate-email">
                    Email
                  </label>

                  <input
                    id="candidate-email"
                    name="email"
                    type="email"
                    value={profileForm.email}
                    onChange={handleProfileChange}
                    disabled={
                      profileSaving ||
                      deletingAccount
                    }
                    required
                  />
                </div>

                <div className="profile-form-field">
                  <label htmlFor="candidate-password">
                    New Password
                  </label>

                  <input
                    id="candidate-password"
                    name="password"
                    type="password"
                    value={profileForm.password}
                    onChange={handleProfileChange}
                    disabled={
                      profileSaving ||
                      deletingAccount
                    }
                    placeholder="Leave blank to keep current password"
                  />
                </div>

                <div className="profile-form-field">
                  <label htmlFor="candidate-confirm-password">
                    Confirm Password
                  </label>

                  <input
                    id="candidate-confirm-password"
                    name="confirmPassword"
                    type="password"
                    value={profileForm.confirmPassword}
                    onChange={handleProfileChange}
                    disabled={
                      profileSaving ||
                      deletingAccount
                    }
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

                <div className="profile-edit-actions">

                  <button
                    type="button"
                    className="profile-delete-account-button"
                    onClick={handleDeleteAccount}
                    disabled={
                      profileSaving ||
                      deletingAccount
                    }
                  >
                    {deletingAccount
                      ? "Deleting..."
                      : "Delete Account"}
                  </button>

                  <div className="profile-edit-actions-right">

                    <button
                      type="button"
                      className="profile-cancel-button"
                      onClick={closeProfile}
                      disabled={
                        profileSaving ||
                        deletingAccount
                      }
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      className="profile-save-button"
                      disabled={
                        profileSaving ||
                        deletingAccount
                      }
                    >
                      {profileSaving
                        ? "Saving..."
                        : "Save Changes"}
                    </button>

                  </div>

                </div>

              </form>
            )}

          </div>

        </div>
      )}

    </div>
  );
}

export default CandidateDashboard;
