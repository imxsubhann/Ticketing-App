import { useEffect, useState } from "react";
import client from "../api/client";
import TicketRow from "../components/TicketRow";

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In progress" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];

export default function AdminDashboard() {
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [search, setSearch] = useState("");

  const loadStats = () => {
    client.get("/admin/stats").then((res) => setStats(res.data.stats));
  };

  const loadTickets = () => {
    setLoading(true);
    const params = {};
    if (status) params.status = status;
    if (priority) params.priority = priority;
    if (search) params.search = search;
    client
      .get("/admin/tickets", { params })
      .then((res) => setTickets(res.data.tickets))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadStats();
  }, []);

  useEffect(() => {
    const t = setTimeout(loadTickets, 250); // debounce search typing
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, priority, search]);

  return (
    <div className="page page--wide">
      <div className="page-header">
        <div>
          <p className="page-kicker">admin</p>
          <h1>Ticket queue</h1>
          <p>Every query raised across the desk, in one place.</p>
        </div>
      </div>

      {stats && (
        <div className="stat-row">
          <button
            className={`stat-card ${status === "" ? "is-active" : ""}`}
            onClick={() => setStatus("")}
          >
            <div className="num">{stats.total}</div>
            <div className="lbl">total</div>
          </button>
          <button
            className={`stat-card ${status === "open" ? "is-active" : ""}`}
            onClick={() => setStatus("open")}
          >
            <div className="num">{stats.open}</div>
            <div className="lbl">open</div>
          </button>
          <button
            className={`stat-card ${status === "in_progress" ? "is-active" : ""}`}
            onClick={() => setStatus("in_progress")}
          >
            <div className="num">{stats.in_progress}</div>
            <div className="lbl">in progress</div>
          </button>
          <button
            className={`stat-card ${status === "resolved" ? "is-active" : ""}`}
            onClick={() => setStatus("resolved")}
          >
            <div className="num">{stats.resolved}</div>
            <div className="lbl">resolved</div>
          </button>
          <button
            className={`stat-card ${status === "closed" ? "is-active" : ""}`}
            onClick={() => setStatus("closed")}
          >
            <div className="num">{stats.closed}</div>
            <div className="lbl">closed</div>
          </button>
        </div>
      )}

      <div className="filter-bar">
        <input
          className="input"
          placeholder="Search by subject, ticket #, name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="select" value={status} onChange={(e) => setStatus(e.target.value)}>
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <select className="select" value={priority} onChange={(e) => setPriority(e.target.value)}>
          <option value="">All priorities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>
      </div>

      {loading ? (
        <div className="loading-line">Loading queue…</div>
      ) : tickets.length === 0 ? (
        <div className="ledger">
          <div className="empty-state">
            <h3>Nothing matches those filters</h3>
            <p>Try clearing the search or status filter.</p>
          </div>
        </div>
      ) : (
        <div className="ledger">
          <div className="ledger-head">
            <span>ID</span>
            <span>Subject / requester</span>
            <span>Status</span>
            <span>Priority</span>
            <span>Updated</span>
          </div>
          {tickets.map((t) => (
            <TicketRow key={t.id} ticket={t} showRequester />
          ))}
        </div>
      )}
    </div>
  );
}
