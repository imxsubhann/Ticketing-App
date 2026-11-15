const LABELS = {
  open: "Open",
  in_progress: "In progress",
  resolved: "Resolved",
  closed: "Closed",
};

export default function StatusStamp({ status }) {
  return <span className={`stamp stamp-${status}`}>{LABELS[status] || status}</span>;
}
