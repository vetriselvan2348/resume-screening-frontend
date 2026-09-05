import { useState } from "react";
import api from "../../services/api";
import "./ResumeUpload.css";

function ResumeUpload({ job, onUploaded, onCancel }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  const validateFile = (selectedFile) => {
    if (!selectedFile) {
      setMessage("Please select a resume.");
      return false;
    }

    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (!allowedTypes.includes(selectedFile.type)) {
      setMessage("Only PDF, DOC, and DOCX files are allowed.");
      return false;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      setMessage("Resume must not exceed 5 MB.");
      return false;
    }

    setMessage("");
    return true;
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0] || null;

    if (validateFile(selectedFile)) {
      setFile(selectedFile);
    } else {
      setFile(null);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0] || null;

    if (validateFile(droppedFile)) {
      setFile(droppedFile);
    } else {
      setFile(null);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();

    if (!validateFile(file)) {
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      setLoading(true);
      setMessage("");

      const response = await api.post(
        `/api/resumes/upload/${job.id}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setMessage("Application submitted successfully.");
      setFile(null);

      if (onUploaded) {
        onUploaded(response.data);
      }
    } catch (error) {
      console.error("Resume upload error:", error);

      if (error.response?.status === 401) {
        setMessage("Session expired. Please login again.");
      } else if (error.response?.status === 400) {
        setMessage(
          error.response?.data?.message ||
            "Unable to submit your application."
        );
      } else {
        setMessage("Failed to submit your application.");
      }
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) {
      return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <section className="resume-upload-page">
      <div className="resume-upload-card">

        <div className="resume-upload-header">
          <button
            type="button"
            className="back-button"
            onClick={onCancel}
            disabled={loading}
          >
            ← Back to Jobs
          </button>

          <div className="application-icon">
            📄
          </div>

          <h2>Apply for {job.title}</h2>

          <p>
            Submit your resume to apply for this position.
          </p>
        </div>

        <div className="job-summary">
          <div className="summary-item">
            <span className="summary-icon">💼</span>
            <div>
              <span className="summary-label">Position</span>
              <strong>{job.title}</strong>
            </div>
          </div>

          <div className="summary-item">
            <span className="summary-icon">🛠</span>
            <div>
              <span className="summary-label">Skills</span>
              <strong>{job.requiredSkills}</strong>
            </div>
          </div>

          <div className="summary-item">
            <span className="summary-icon">🎓</span>
            <div>
              <span className="summary-label">Experience</span>
              <strong>{job.minimumExperience} years</strong>
            </div>
          </div>
        </div>

        <form onSubmit={handleUpload}>

          <div className="upload-section">

            <div className="upload-section-heading">
              <div>
                <h3>Upload your resume</h3>
                <p>
                  Your resume will be used to evaluate your application.
                </p>
              </div>
            </div>

            <label
              className={`upload-area ${
                isDragging ? "dragging" : ""
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
            >
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileChange}
                disabled={loading}
              />

              {!file ? (
                <>
                  <div className="upload-icon">
                    ↑
                  </div>

                  <h4>Drop your resume here</h4>

                  <p>
                    or <span>browse files</span> from your computer
                  </p>

                  <small>
                    PDF, DOC or DOCX • Maximum 5 MB
                  </small>
                </>
              ) : (
                <div className="selected-file">
                  <div className="file-icon">
                    PDF
                  </div>

                  <div className="file-details">
                    <strong>{file.name}</strong>

                    <span>
                      {formatFileSize(file.size)}
                    </span>
                  </div>

                  <div className="file-check">
                    ✓
                  </div>
                </div>
              )}
            </label>

            {message && (
              <div
                className={`upload-message ${
                  message.includes("successfully")
                    ? "success"
                    : "error"
                }`}
              >
                <span>
                  {message.includes("successfully") ? "✓" : "!"}
                </span>

                <p>{message}</p>
              </div>
            )}

          </div>

          <div className="upload-footer">
            <div className="upload-info">
              <span>🔒</span>
              <p>
                Your resume is securely stored with your application.
              </p>
            </div>

            <div className="upload-actions">
              <button
                type="button"
                className="cancel-button"
                onClick={onCancel}
                disabled={loading}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="submit-application-button"
                disabled={loading || !file}
              >
                {loading ? (
                  <>
                    <span className="button-spinner"></span>
                    Submitting...
                  </>
                ) : (
                  <>
                    Submit Application
                    <span>→</span>
                  </>
                )}
              </button>
            </div>
          </div>

        </form>
      </div>
    </section>
  );
}

export default ResumeUpload;