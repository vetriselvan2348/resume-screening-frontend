import { useEffect, useState } from "react";
import api from "../../services/api";
import "./MyResumes.css";

function MyResumes() {
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  const loadResumes = async () => {
    try {
      setLoading(true);
      setMessage("");

      const response = await api.get("/api/resumes/my");

      setResumes(response.data);
    } catch (error) {
      console.error("Failed to load resumes:", error);

      if (error.response?.status === 401) {
        setMessage("Session expired. Please login again.");
      } else {
        setMessage(
          error.response?.data?.message ||
          "Failed to load your resumes."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this resume?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(id);
      setMessage("");

      await api.delete(`/api/resumes/${id}`);

      setResumes((currentResumes) =>
        currentResumes.filter(
          (resume) => resume.id !== id
        )
      );
    } catch (error) {
      console.error("Failed to delete resume:", error);

      if (error.response?.status === 401) {
        setMessage("Session expired. Please login again.");
      } else if (error.response?.status === 403) {
        setMessage(
          "You are not allowed to delete this resume."
        );
      } else if (error.response?.status === 404) {
        setMessage("Resume not found.");
      } else {
        setMessage(
          error.response?.data?.message ||
          "Failed to delete resume."
        );
      }
    } finally {
      setDeletingId(null);
    }
  };

  const getFileType = (resume) => {
    const fileName = resume.fileName || "";
    const extension = fileName
      .split(".")
      .pop()
      .toUpperCase();

    if (["PDF", "DOC", "DOCX"].includes(extension)) {
      return extension;
    }

    if (resume.fileType?.includes("pdf")) {
      return "PDF";
    }

    if (resume.fileType?.includes("word")) {
      return extension === "DOC"
        ? "DOC"
        : "DOCX";
    }

    return "FILE";
  };

  useEffect(() => {
    loadResumes();
  }, []);

  return (
    <section className="my-resumes">

      <div className="resumes-header">

        <div className="resumes-heading">
          <h2>My Resumes</h2>
          <p>Manage your uploaded resumes</p>
        </div>

        <button
          type="button"
          className="resume-refresh-button"
          onClick={loadResumes}
          disabled={loading}
        >
          <span>↻</span>
          {loading ? "Loading" : "Refresh"}
        </button>

      </div>

      {message && (
        <div className="resume-message">
          <span>!</span>
          <p>{message}</p>
        </div>
      )}

      {loading ? (
        <div className="resume-loading">
          <div className="resume-spinner"></div>
          <p>Loading your resumes...</p>
        </div>
      ) : resumes.length === 0 ? (
        <div className="resume-empty">

          <div className="resume-empty-icon">
            📄
          </div>

          <h3>No resumes uploaded</h3>

          <p>
            Upload a resume when applying for a job.
          </p>

        </div>
      ) : (
        <div className="resume-grid">

          {resumes.map((resume) => {

            const fileType = getFileType(resume);

            return (
              <article
                className="resume-card"
                key={resume.id}
              >

                <div className="resume-card-content">

                  <div className={`file-type-icon ${fileType.toLowerCase()}`}>
                    {fileType}
                  </div>

                  <div className="resume-info">

                    <h3 title={resume.fileName}>
                      {resume.fileName}
                    </h3>

                    <span>
                      {fileType} Document
                    </span>

                  </div>

                </div>

                <div className="resume-divider"></div>

                <div className="resume-actions">

                  <button
                    type="button"
                    className="delete-button"
                    onClick={() => handleDelete(resume.id)}
                    disabled={deletingId === resume.id}
                  >
                    {deletingId === resume.id
                      ? "Deleting..."
                      : "Delete"}
                  </button>

                </div>

              </article>
            );
          })}

        </div>
      )}

    </section>
  );
}

export default MyResumes;