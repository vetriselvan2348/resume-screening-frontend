import { useState } from "react";
import api from "../../services/api";
import "./RecruiterRegister.css";

function RecruiterRegister({ onBack }) {
  const [mode, setMode] = useState("register");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [adminPassword, setAdminPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showAdminPassword, setShowAdminPassword] = useState(false);

  const [otp, setOtp] = useState("");
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

      setMode("otp");
      setMessage("A verification OTP has been sent to your email.");
      setSuccess(true);
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


  const handleVerifyOtp = async (e) => {
    e.preventDefault();

    setMessage("");
    setSuccess(false);

    if (!/^\d{6}$/.test(otp)) {
      setMessage("OTP must contain exactly 6 digits.");
      return;
    }

    setLoading(true);

    try {
      await api.post("/api/auth/verify-registration", {
        email,
        otp
      });

      setSuccess(true);
      setMessage("Email verified successfully. You can now login.");

      setTimeout(() => {
        onBack();
      }, 1500);
    } catch (error) {
      console.error("Recruiter OTP verification error:", error);

      if (error.response) {
        setMessage(
          error.response.data?.message ||
          "Invalid or expired OTP."
        );
      } else {
        setMessage("Cannot connect to backend.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setMessage("");
    setSuccess(false);
    setLoading(true);

    try {
      await api.post("/api/auth/resend-registration-otp", {
        email
      });

      setSuccess(true);
      setMessage("A new OTP has been sent to your email.");
    } catch (error) {
      console.error("Resend recruiter OTP error:", error);

      if (error.response) {
        setMessage(
          error.response.data?.message ||
          "Failed to resend OTP."
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

        {mode === "register" ? (
          <>
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

                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
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
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    minLength={6}
                    required
                  />

                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() =>
                      setShowConfirmPassword(!showConfirmPassword)
                    }
                  >
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
                    onChange={(e) => setAdminPassword(e.target.value)}
                    required
                  />

                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() =>
                      setShowAdminPassword(!showAdminPassword)
                    }
                  >
                    👁
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading}>
                {loading
                  ? "Creating Account..."
                  : "Register Recruiter"}
              </button>

            </form>
          </>
        ) : (
          <>
            <h1>Verify Email</h1>

            <p className="recruiter-register-subtitle">
              Enter the 6-digit OTP sent to {email}
            </p>

            <form onSubmit={handleVerifyOtp}>

              <div className="recruiter-form-group">
                <label>Verification OTP</label>

                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChange={(e) =>
                    setOtp(e.target.value.replace(/\D/g, ""))
                  }
                  required
                />
              </div>

              <button type="submit" disabled={loading}>
                {loading ? "Verifying..." : "Verify Email"}
              </button>

              <button
                type="button"
                className="back-candidate-button"
                onClick={handleResendOtp}
                disabled={loading}
              >
                Resend OTP
              </button>

            </form>
          </>
        )}

        {message && (
          <p className={`recruiter-message ${success ? "success" : ""}`}>
            {message}
          </p>
        )}

        <button
          type="button"
          className="back-candidate-button"
          onClick={onBack}
          disabled={loading}
        >
          ← Back to Candidate Portal
        </button>

      </div>
    </div>
  );
}

export default RecruiterRegister;
