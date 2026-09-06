import { useEffect, useState } from "react";
import Login from "./components/Login/Login";
import RecruiterRegister from "./components/RecruiterRegister/RecruiterRegister";
import RecruiterDashboard from "./pages/RecruiterDashboard/RecruiterDashboard";
import CandidateDashboard from "./pages/Candidate/CandidateDashboard";
import "./App.css";

function App() {
  const [token, setToken] = useState(
    localStorage.getItem("token")
  );

  const [role, setRole] = useState(
    localStorage.getItem("role")
  );

  const [showRecruiterRegister, setShowRecruiterRegister] =
    useState(false);

  const [darkMode, setDarkMode] = useState(
    localStorage.getItem("theme") === "dark"
  );

  useEffect(() => {
    document.documentElement.setAttribute(
      "data-theme",
      darkMode ? "dark" : "light"
    );

    localStorage.setItem(
      "theme",
      darkMode ? "dark" : "light"
    );
  }, [darkMode]);

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

  const toggleTheme = () => {
    setDarkMode((previous) => !previous);
  };

  const themeButton = (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label="Toggle theme"
    >
      {darkMode ? "☀️ Light" : "🌙 Dark"}
    </button>
  );

  if (!token) {
    if (showRecruiterRegister) {
      return (
        <>
          {themeButton}
          <RecruiterRegister
            onBack={backToCandidatePortal}
          />
        </>
      );
    }

    return (
      <>
        {themeButton}
        <Login
          onLogin={handleLogin}
          onRecruiterPortal={openRecruiterRegister}
        />
      </>
    );
  }

  if (role === "RECRUITER") {
    return (
      <>
        {themeButton}
        <RecruiterDashboard
          onLogout={handleLogout}
        />
      </>
    );
  }

  if (role === "CANDIDATE") {
    return (
      <>
        {themeButton}
        <CandidateDashboard
          onLogout={handleLogout}
        />
      </>
    );
  }

  return (
    <>
      {themeButton}
      <div>
        <h2>Unknown user role</h2>

        <button onClick={handleLogout}>
          Logout
        </button>
      </div>
    </>
  );
}

export default App;
