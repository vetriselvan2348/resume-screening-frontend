import { useState } from "react";
import api from "../../services/api";
import "./RecruiterRegister.css";

function RecruiterRegister({ onBack }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [adminPassword, setAdminPassword] = useState("");

  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();

    setMessage("");
    setSuccess(false);

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setMessage("Password must contain at least 6 characters.");
      return;
    }

    if (!adminPassword.trim()) {
      setMessage("Admin password is required.");
      return;
    }

    setLoading(true);

    try {
      await api.post("/api/users/recruiter/register", {
        name,
        email,
        password,
        adminPassword
      });

      setSuccess(true);
      setMessage(
        "Recruiter registration successful. Redirecting to login..."
      );

      setName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setAdminPassword("");

      setTimeout(() => {
        onBack();
      }, 1500);

    } catch (error) {
      console.error("Recruiter registration error:", error);

      if (error.response) {
        setMessage(
          error.response.data?.message ||
          "Recruiter registration failed."
        );
      } else {
        setMessage("Cannot connect to backend.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="recruiter-register-page">
      <div className="recruiter-register-card">

        <h1>Recruiter Portal</h1>

        <p className="recruiter-register-subtitle">
          Create a recruiter account
        </p>

        <form onSubmit={handleRegister}>

          <div className="recruiter-form-group">
            <label>Name</label>

            <input
              type="text"
              placeholder="Enter recruiter name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="recruiter-form-group">
            <label>Email</label>

            <input
              type="email"
              placeholder="Enter recruiter email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="recruiter-form-group">
            <label>Password</label>

            <div className="password-field">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Create recruiter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                required
              />
              <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                👁
              </button>
            </div>
          </div>

          <div className="recruiter-form-group">
            <label>Confirm Password</label>

            <div className="password-field">
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm recruiter password"
                value={confirmPassword}
                onChange={(e) =>
                  setConfirmPassword(e.target.value)
                }
                minLength={6}
                required
              />
              <button type="button" className="password-toggle" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                👁
              </button>
            </div>
          </div>

          <div className="recruiter-form-group">
            <label>Admin Password</label>

            <div className="password-field">
              <input
                type={showAdminPassword ? "text" : "password"}
                placeholder="Enter admin authorization password"
                value={adminPassword}
                onChange={(e) =>
                  setAdminPassword(e.target.value)
                }
                required
              />
              <button type="button" className="password-toggle" onClick={() => setShowAdminPassword(!showAdminPassword)}>
                👁
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Creating Account..."
              : "Register Recruiter"}
          </button>

        </form>

        {message && (
          <p className={`recruiter-message ${success ? "success" : ""}`}>
            {message}
          </p>
        )}

        <button
          type="button"
          className="back-candidate-button"
          onClick={onBack}
        >
          ← Back to Candidate Portal
        </button>

      </div>
    </div>
  );
}

export default RecruiterRegister;
