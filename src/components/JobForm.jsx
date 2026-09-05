import { useState } from "react";
import api from "../services/api";

function JobForm({ onJobCreated }) {
  const [job, setJob] = useState({
    title: "",
    description: "",
    requiredSkills: "",
    minimumExperience: 0,
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;

    setJob((previousJob) => ({
      ...previousJob,
      [name]:
        name === "minimumExperience"
          ? Number(value)
          : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setMessage("");

    try {
      const response = await api.post("/api/jobs", job);

      console.log("Created job:", response.data);

      onJobCreated(response.data);

      setJob({
        title: "",
        description: "",
        requiredSkills: "",
        minimumExperience: 0,
      });

      setMessage("Job created successfully!");

    } catch (error) {
      console.error("Create job error:", error);

      if (error.response?.status === 401) {
        setMessage("Your session has expired. Please login again.");
      } else {
        setMessage(
          error.response?.data?.message ||
            "Failed to create job."
        );
      }

    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="dashboard-card">

      <h2>Create Job</h2>

      <form onSubmit={handleSubmit}>

        <div className="form-group">
          <label>Job Title</label>

          <input
            type="text"
            name="title"
            placeholder="Java Backend Developer"
            value={job.title}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Description</label>

          <textarea
            name="description"
            placeholder="Describe the job..."
            value={job.description}
            onChange={handleChange}
            rows="5"
            required
          />
        </div>

        <div className="form-group">
          <label>Required Skills</label>

          <input
            type="text"
            name="requiredSkills"
            placeholder="Java, Spring Boot, MySQL, REST API"
            value={job.requiredSkills}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Minimum Experience (years)</label>

          <input
            type="number"
            name="minimumExperience"
            min="0"
            value={job.minimumExperience}
            onChange={handleChange}
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
        >
          {loading ? "Creating..." : "Create Job"}
        </button>

      </form>

      {message && (
        <p className="message">
          {message}
        </p>
      )}

    </section>
  );
}

export default JobForm;