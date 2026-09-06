import { useState } from "react";
import api from "../../services/api";
import "./Login.css";

function Login({ onLogin, onRecruiterPortal }) {
  const [mode, setMode] = useState("login");

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [name, setName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [otp, setOtp] = useState("");
  const [resetPassword, setResetPassword] = useState("");
  const [confirmResetPassword, setConfirmResetPassword] = useState("");

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const response = await api.post("/api/auth/login", {
        email: loginEmail,
        password: loginPassword
      });

      const token = response.data.token;

      localStorage.setItem("token", token);
      localStorage.setItem("role", response.data.role);

      onLogin(token);
    } catch (error) {
      console.error("Login error:", error);

      if (error.response) {
        setMessage(
          error.response.data?.message ||
          "Invalid email or password"
        );
      } else {
        setMessage("Cannot connect to backend");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setMessage("");

    if (registerPassword !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    if (registerPassword.length < 6) {
      setMessage("Password must contain at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      await api.post("/api/users", {
        name,
        email: registerEmail,
        password: registerPassword,
        role: "CANDIDATE"
      });

      setOtp("");
      setMessage("Registration successful. Check your email for the OTP.");
      setMode("registration-otp");
    } catch (error) {
      console.error("Registration error:", error);

      if (error.response) {
        setMessage(
          error.response.data?.message ||
          "Registration failed."
        );
      } else {
        setMessage("Cannot connect to backend");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegistrationOtp = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!/^\d{6}$/.test(otp)) {
      setMessage("OTP must contain exactly 6 digits.");
      return;
    }

    setLoading(true);

    try {
      await api.post("/api/auth/verify-registration", {
        email: registerEmail,
        otp
      });

      setMessage("Email verified successfully. You can now login.");

      setTimeout(() => {
        setMode("login");
        setLoginEmail(registerEmail);
        setName("");
        setRegisterEmail("");
        setRegisterPassword("");
        setConfirmPassword("");
        setOtp("");
        setMessage("");
      }, 1500);
    } catch (error) {
      console.error("OTP verification error:", error);

      if (error.response) {
        setMessage(
          error.response.data?.message ||
          "Invalid or expired OTP."
        );
      } else {
        setMessage("Cannot connect to backend");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendRegistrationOtp = async () => {
    setMessage("");
    setLoading(true);

    try {
      await api.post("/api/auth/resend-registration-otp", {
        email: registerEmail
      });

      setMessage("A new OTP has been sent to your email.");
    } catch (error) {
      console.error("Resend OTP error:", error);

      if (error.response) {
        setMessage(
          error.response.data?.message ||
          "Failed to resend OTP."
        );
      } else {
        setMessage("Cannot connect to backend");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!loginEmail.trim()) {
      setMessage("Enter your email address.");
      return;
    }

    setLoading(true);

    try {
      await api.post("/api/auth/forgot-password", {
        email: loginEmail
      });

      setMessage(
        "If an account exists with this email, a password reset OTP has been sent."
      );
      setOtp("");
      setMode("reset-password");
    } catch (error) {
      console.error("Forgot password error:", error);

      if (error.response) {
        setMessage(
          error.response.data?.message ||
          "Unable to process password reset."
        );
      } else {
        setMessage("Cannot connect to backend");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!/^\d{6}$/.test(otp)) {
      setMessage("OTP must contain exactly 6 digits.");
      return;
    }

    if (resetPassword.length < 6) {
      setMessage("Password must contain at least 6 characters.");
      return;
    }

    if (resetPassword !== confirmResetPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      await api.post("/api/auth/reset-password", {
        email: loginEmail,
        otp,
        newPassword: resetPassword
      });

      setMessage("Password reset successfully. You can now login.");

      setTimeout(() => {
        setMode("login");
        setLoginPassword("");
        setOtp("");
        setResetPassword("");
        setConfirmResetPassword("");
        setMessage("");
      }, 1500);
    } catch (error) {
      console.error("Reset password error:", error);

      if (error.response) {
        setMessage(
          error.response.data?.message ||
          "Invalid or expired OTP."
        );
      } else {
        setMessage("Cannot connect to backend");
      }
    } finally {
      setLoading(false);
    }
  };

  const switchToRegister = () => {
    setMessage("");
    setMode("register");
  };

  const switchToLogin = () => {
    setMessage("");
    setMode("login");
  };

  const switchToForgotPassword = () => {
    setMessage("");
    setOtp("");
    setMode("forgot-password");
  };

  return (
    <div className="login-page">
      <div className="login-card">

        <h1>Vemora</h1>

        <p className="subtitle">
          {mode === "register"
            ? "Create your candidate account"
            : mode === "registration-otp"
            ? "Verify your email address"
            : mode === "forgot-password"
            ? "Reset your password"
            : mode === "reset-password"
            ? "Enter your reset OTP"
            : "Login to your account"}
        </p>

        {mode === "register" && (
          <form onSubmit={handleRegister}>

            <div className="form-group">
              <label>Name</label>
              <input
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                placeholder="Enter your email"
                value={registerEmail}
                onChange={(e) => setRegisterEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                placeholder="Enter your password"
                value={registerPassword}
                onChange={(e) => setRegisterPassword(e.target.value)}
                minLength={6}
                required
              />
            </div>

            <div className="form-group">
              <label>Confirm Password</label>
              <input
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                minLength={6}
                required
              />
            </div>

            <button type="submit" disabled={loading}>
              {loading ? "Creating Account..." : "Create Candidate Account"}
            </button>

          </form>
        )}

        {mode === "registration-otp" && (
          <form onSubmit={handleRegistrationOtp}>

            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={registerEmail}
                disabled
                readOnly
              />
            </div>

            <div className="form-group">
              <label>OTP</label>
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
              className="secondary-button"
              onClick={handleResendRegistrationOtp}
              disabled={loading}
            >
              Resend OTP
            </button>

            <button
              type="button"
              className="secondary-button"
              onClick={switchToLogin}
              disabled={loading}
            >
              Back to Login
            </button>

          </form>
        )}

        {mode === "forgot-password" && (
          <form onSubmit={handleForgotPassword}>

            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                placeholder="Enter your registered email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required
              />
            </div>

            <button type="submit" disabled={loading}>
              {loading ? "Sending OTP..." : "Send Reset OTP"}
            </button>

            <button
              type="button"
              className="secondary-button"
              onClick={switchToLogin}
              disabled={loading}
            >
              Back to Login
            </button>

          </form>
        )}

        {mode === "reset-password" && (
          <form onSubmit={handleResetPassword}>

            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={loginEmail}
                disabled
                readOnly
              />
            </div>

            <div className="form-group">
              <label>OTP</label>
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

            <div className="form-group">
              <label>New Password</label>
              <input
                type="password"
                placeholder="Enter new password"
                value={resetPassword}
                onChange={(e) => setResetPassword(e.target.value)}
                minLength={6}
                required
              />
            </div>

            <div className="form-group">
              <label>Confirm New Password</label>
              <input
                type="password"
                placeholder="Confirm new password"
                value={confirmResetPassword}
                onChange={(e) =>
                  setConfirmResetPassword(e.target.value)
                }
                minLength={6}
                required
              />
            </div>

            <button type="submit" disabled={loading}>
              {loading ? "Resetting..." : "Reset Password"}
            </button>

            <button
              type="button"
              className="secondary-button"
              onClick={switchToLogin}
              disabled={loading}
            >
              Back to Login
            </button>

          </form>
        )}

        {mode === "login" && (
          <form onSubmit={handleLogin}>

            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                placeholder="Enter your email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                placeholder="Enter your password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </button>

            <button
              type="button"
              className="forgot-password-button"
              onClick={switchToForgotPassword}
              disabled={loading}
            >
              Forgot Password?
            </button>

          </form>
        )}

        {message && (
          <p className="message">
            {message}
          </p>
        )}

        {mode === "login" && (
          <>
            <button
              type="button"
              className="recruiter-portal-button"
              onClick={onRecruiterPortal}
            >
              Recruiter Portal →
            </button>

            <div className="auth-switch">
              <p>
                Don't have an account?
                <button
                  type="button"
                  onClick={switchToRegister}
                >
                  Register
                </button>
              </p>
            </div>
          </>
        )}

        {mode === "register" && (
          <div className="auth-switch">
            <p>
              Already have an account?
              <button
                type="button"
                onClick={switchToLogin}
              >
                Login
              </button>
            </p>
          </div>
        )}

      </div>
    </div>
  );
}

export default Login;
