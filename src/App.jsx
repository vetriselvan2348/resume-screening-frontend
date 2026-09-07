import { useEffect, useState } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import Login from "./components/Login/Login";
import RecruiterRegister from "./components/RecruiterRegister/RecruiterRegister";
import RecruiterDashboard from "./pages/RecruiterDashboard/RecruiterDashboard";
import CandidateDashboard from "./pages/Candidate/CandidateDashboard";
import JobDetails from "./pages/JobDetails/JobDetails";
import "./App.css";

function App() {
  const [theme, setTheme] = useState(
    localStorage.getItem("theme") || "light"
  );

  const [token, setToken] = useState(
    localStorage.getItem("token")
  );

  const [role, setRole] = useState(
    localStorage.getItem("role")
  );

  const [showRecruiterRegister, setShowRecruiterRegister] =
    useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((current) =>
      current === "dark" ? "light" : "dark"
    );
  };

  const handleLogin = (newToken) => {
    setToken(newToken);
    setRole(localStorage.getItem("role"));
    setShowRecruiterRegister(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("user");

    setToken(null);
    setRole(null);
    setShowRecruiterRegister(false);

    navigate("/");
  };

  useEffect(() => {
    const handleJwtExpired = () => {
      handleLogout();
    };

    window.addEventListener(
      "jwt-expired",
      handleJwtExpired
    );

    return () => {
      window.removeEventListener(
        "jwt-expired",
        handleJwtExpired
      );
    };
  }, []);

  const openRecruiterRegister = () => {
    setShowRecruiterRegister(true);
  };

  const backToCandidatePortal = () => {
    setShowRecruiterRegister(false);
  };

  if (!token) {
    if (showRecruiterRegister) {
      return (
        <RecruiterRegister
          onBack={backToCandidatePortal}
        />
      );
    }

    return (
      <Login
        onLogin={handleLogin}
        onRecruiterPortal={openRecruiterRegister}
      />
    );
  }

  if (role === "RECRUITER") {
    return (
      <RecruiterDashboard
        onLogout={handleLogout}
        theme={theme}
        toggleTheme={toggleTheme}
      />
    );
  }

  if (role === "CANDIDATE") {
    return (
      <Routes>
        <Route
          path="/candidate"
          element={
            <CandidateDashboard
              onLogout={handleLogout}
              theme={theme}
              toggleTheme={toggleTheme}
            />
          }
        />

        <Route
          path="/candidate/job/:jobId"
          element={<JobDetails />}
        />

        <Route
          path="*"
          element={<Navigate to="/candidate" replace />}
        />
      </Routes>
    );
  }

  return (
    <div>
      <h2>Unknown user role</h2>

      <button onClick={handleLogout}>
        Logout
      </button>
    </div>
  );
}

export default App;
