import { useState } from "react";
import api from "../../services/api";
import "./Login.css";

function Login({ onLogin, onRecruiterPortal }) {
  const [isRegistering, setIsRegistering] = useState(false);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [name, setName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

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

      setMessage(
        "Registration successful. Redirecting to login..."
      );

      setName("");
      setRegisterEmail("");
      setRegisterPassword("");
      setConfirmPassword("");

      setTimeout(() => {
        setMessage("");
        setIsRegistering(false);
      }, 1500);

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

  const switchToRegister = () => {
    setMessage("");
    setIsRegistering(true);
  };

  const switchToLogin = () => {
    setMessage("");
    setIsRegistering(false);
  };

  return (
    <div className="login-page">
      <div className="login-card">

        <h1>Resume Screening</h1>

        <p className="subtitle">
          {isRegistering
            ? "Create your candidate account"
            : "Login to your account"}
        </p>

        {isRegistering ? (
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
                onChange={(e) =>
                  setRegisterEmail(e.target.value)
                }
                required
              />
            </div>

            <div className="form-group">
              <label>Password</label>

              <input
                type="password"
                placeholder="Enter your password"
                value={registerPassword}
                onChange={(e) =>
                  setRegisterPassword(e.target.value)
                }
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
                onChange={(e) =>
                  setConfirmPassword(e.target.value)
                }
                minLength={6}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
            >
              {loading
                ? "Creating Account..."
                : "Create Candidate Account"}
            </button>

          </form>
        ) : (
          <form onSubmit={handleLogin}>

            <div className="form-group">
              <label>Email</label>

              <input
                type="email"
                placeholder="Enter your email"
                value={loginEmail}
                onChange={(e) =>
                  setLoginEmail(e.target.value)
                }
                required
              />
            </div>

            <div className="form-group">
              <label>Password</label>

              <input
                type="password"
                placeholder="Enter your password"
                value={loginPassword}
                onChange={(e) =>
                  setLoginPassword(e.target.value)
                }
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
            >
              {loading
                ? "Logging in..."
                : "Login"}
            </button>

          </form>
        )}

        {message && (
          <p className="message">
            {message}
          </p>
        )}

        <button
          type="button"
          className="recruiter-portal-button"
          onClick={onRecruiterPortal}
        >
          Recruiter Portal →
        </button>

        <div className="auth-switch">

          {isRegistering ? (
            <p>
              Already have an account?
              <button
                type="button"
                onClick={switchToLogin}
              >
                Login
              </button>
            </p>
          ) : (
            <p>
              Don't have an account?
              <button
                type="button"
                onClick={switchToRegister}
              >
                Register
              </button>
            </p>
          )}

        </div>

      </div>
    </div>
  );
}

export default Login;