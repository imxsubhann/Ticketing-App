import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import client from "../api/client";
import TicketRow from "../components/TicketRow";
import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    setLoading(true);
    const params = statusFilter ? { status: statusFilter } : {};
    client
      .get("/tickets", { params })
      .then((res) => setTickets(res.data.tickets))
      .finally(() => setLoading(false));
  }, [statusFilter]);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <p className="page-kicker">queries · {user?.name}</p>
          <h1>My tickets</h1>
          <p>Everything you've submitted, and where it stands.</p>
        </div>
        <Link to="/tickets/new" className="btn btn-primary">
          + New ticket
        </Link>
      </div>

      <div className="filter-bar">
        <select
          className="select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All statuses</option>
          <option value="open">Open</option>
          <option value="in_progress">In progress</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      {loading ? (
        <div className="loading-line">Loading tickets…</div>
      ) : tickets.length === 0 ? (
        <div className="ledger">
          <div className="empty-state">
            <h3>No tickets here yet</h3>
            <p>Raise a query and we'll keep you posted on its status.</p>
            <Link to="/tickets/new" className="btn btn-primary">
              + New ticket
            </Link>
          </div>
        </div>
      ) : (
        <div className="ledger">
          <div className="ledger-head">
            <span>ID</span>
            <span>Subject</span>
            <span>Status</span>
            <span>Priority</span>
            <span>Updated</span>
          </div>
          {tickets.map((t) => (
            <TicketRow key={t.id} ticket={t} />
          ))}
        </div>
      )}
    </div>
  );
}
