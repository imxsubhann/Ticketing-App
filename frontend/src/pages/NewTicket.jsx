import { useState } from "react";
import { useNavigate } from "react-router-dom";
import client from "../api/client";

export default function NewTicket() {
  const navigate = useNavigate();
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("general");
  const [priority, setPriority] = useState("medium");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await client.post("/tickets", { subject, category, priority, description });
      navigate(`/tickets/${res.data.ticket.id}`);
    } catch (err) {
      setError(err.response?.data?.error || "Could not submit your ticket.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <p className="page-kicker">new query</p>
          <h1>Submit a ticket</h1>
          <p>Describe what's going on — the more detail, the faster it gets resolved.</p>
        </div>
      </div>

      {error && <div className="form-error">{error}</div>}

      <form onSubmit={handleSubmit} className="stub">
        <div className="stub-top" style={{ display: "block" }}>
          <div className="field">
            <label htmlFor="subject">Subject</label>
            <input
              id="subject"
              className="input"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Short summary of the issue"
              required
              autoFocus
            />
          </div>

          <div className="field-row">
            <div className="field">
              <label htmlFor="category">Category</label>
              <select
                id="category"
                className="select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="general">General</option>
                <option value="account">Account</option>
                <option value="billing">Billing</option>
                <option value="technical">Technical</option>
                <option value="feature_request">Feature request</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="priority">Priority</label>
              <select
                id="priority"
                className="select"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div className="field" style={{ marginBottom: 0 }}>
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              className="textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Steps to reproduce, what you expected, screenshots if relevant…"
              required
            />
          </div>
        </div>

        <div className="stub-perforation" />
        <div className="stub-controls">
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? "Submitting…" : "Submit ticket"}
          </button>
        </div>
      </form>
    </div>
  );
}
