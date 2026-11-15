import { Link } from "react-router-dom";
import StatusStamp from "./StatusStamp";

function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default function TicketRow({ ticket, showRequester = false }) {
  return (
    <Link to={`/tickets/${ticket.id}`} className="ledger-row">
      <span className="ledger-id">{ticket.ticket_number}</span>
      <span className="ledger-subject">
        {ticket.subject}
        {showRequester && ticket.requester && (
          <span className="req">
            {ticket.requester.name} · {ticket.requester.email}
          </span>
        )}
      </span>
      <span>
        <StatusStamp status={ticket.status} />
      </span>
      <span className={`priority-tag priority-${ticket.priority}`}>{ticket.priority}</span>
      <span className="ledger-date">{formatDate(ticket.updated_at)}</span>
    </Link>
  );
}
