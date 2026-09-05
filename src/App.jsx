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
      />
    );
  }

  if (role === "CANDIDATE") {
    return (
      <CandidateDashboard
        onLogout={handleLogout}
      />
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