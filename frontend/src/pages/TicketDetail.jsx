import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import client from "../api/client";
import StatusStamp from "../components/StatusStamp";
import { useAuth } from "../context/AuthContext";

function formatDateTime(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function TicketDetail() {
  const { id } = useParams();
  const { isAdmin, user } = useAuth();

  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);

  const [statusDraft, setStatusDraft] = useState("");
  const [priorityDraft, setPriorityDraft] = useState("");
  const [savingAdmin, setSavingAdmin] = useState(false);

  const load = () => {
    setLoading(true);
    client
      .get(`/tickets/${id}`)
      .then((res) => {
        setTicket(res.data.ticket);
        setStatusDraft(res.data.ticket.status);
        setPriorityDraft(res.data.ticket.priority);
      })
      .catch((err) => setError(err.response?.data?.error || "Could not load this ticket."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleReply = async (e) => {
    e.preventDefault();
    if (!reply.trim()) return;
    setSending(true);
    try {
      const res = await client.post(`/tickets/${id}/comments`, { body: reply });
      setTicket(res.data.ticket);
      setStatusDraft(res.data.ticket.status);
      setReply("");
    } finally {
      setSending(false);
    }
  };

  const handleAdminSave = async () => {
    setSavingAdmin(true);
    try {
      const res = await client.patch(`/admin/tickets/${id}`, {
        status: statusDraft,
        priority: priorityDraft,
      });
      setTicket(res.data.ticket);
    } finally {
      setSavingAdmin(false);
    }
  };

  if (loading) return <div className="page loading-line">Loading ticket…</div>;
  if (error)
    return (
      <div className="page">
        <div className="form-error">{error}</div>
        <Link to="/dashboard" className="btn btn-outline">
          Back to my tickets
        </Link>
      </div>
    );
  if (!ticket) return null;

  const dirty = statusDraft !== ticket.status || priorityDraft !== ticket.priority;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <p className="page-kicker">
            <Link to={isAdmin ? "/admin" : "/dashboard"}>
              &larr; {isAdmin ? "Admin queue" : "My tickets"}
            </Link>
          </p>
          <h1>Ticket detail</h1>
        </div>
      </div>

      <div className="stub">
        <div className="stub-top">
          <div>
            <p className="stub-id">{ticket.ticket_number}</p>
            <h1>{ticket.subject}</h1>
            <div className="stub-meta">
              <span>
                Requested by <strong>{ticket.requester?.name}</strong>
              </span>
              <span>
                Category <strong>{ticket.category}</strong>
              </span>
              <span>
                Opened <strong>{formatDateTime(ticket.created_at)}</strong>
              </span>
              {ticket.assigned_admin && (
                <span>
                  Assigned to <strong>{ticket.assigned_admin.name}</strong>
                </span>
              )}
            </div>
          </div>
          <div className="stub-badges">
            <StatusStamp status={ticket.status} />
            <span className={`priority-tag priority-${ticket.priority}`}>
              {ticket.priority} priority
            </span>
          </div>
        </div>

        <div className="stub-perforation" />
        <div className="stub-body">{ticket.description}</div>

        {isAdmin && (
          <>
            <div className="stub-perforation" />
            <div className="stub-controls">
              <div className="field">
                <label htmlFor="status">Status</label>
                <select
                  id="status"
                  className="select"
                  value={statusDraft}
                  onChange={(e) => setStatusDraft(e.target.value)}
                >
                  <option value="open">Open</option>
                  <option value="in_progress">In progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="priority">Priority</label>
                <select
                  id="priority"
                  className="select"
                  value={priorityDraft}
                  onChange={(e) => setPriorityDraft(e.target.value)}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <button
                className="btn btn-primary"
                onClick={handleAdminSave}
                disabled={!dirty || savingAdmin}
              >
                {savingAdmin ? "Saving…" : "Save changes"}
              </button>
            </div>
          </>
        )}
      </div>

      <p className="timeline-heading">timeline · {ticket.comments.length} entries</p>
      <div className="timeline">
        {ticket.comments.map((c) =>
          c.is_status_change ? (
            <div key={c.id} className="timeline-item is-system">
              {c.body} — {formatDateTime(c.created_at)}
            </div>
          ) : (
            <div key={c.id} className="timeline-item">
              <div className="timeline-head">
                <span>
                  <span className="who">{c.author?.name}</span>
                  {c.author?.role === "admin" && <span className="role-admin">support</span>}
                </span>
                <span>{formatDateTime(c.created_at)}</span>
              </div>
              <div>{c.body}</div>
            </div>
          )
        )}
      </div>

      <form className="reply-box" onSubmit={handleReply}>
        <h3>{isAdmin ? "Reply to requester" : "Add a reply"}</h3>
        <div className="field">
          <textarea
            className="textarea"
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder={
              isAdmin
                ? "Let them know what you found or what happens next…"
                : "Add more detail, or ask about progress…"
            }
            style={{ minHeight: 90 }}
          />
        </div>
        <div className="reply-actions">
          <button className="btn btn-primary" type="submit" disabled={sending || !reply.trim()}>
            {sending ? "Sending…" : "Send reply"}
          </button>
        </div>
      </form>
    </div>
  );
}
