import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="topbar">
      <div className="topbar-inner">
        <NavLink to="/dashboard" className="brand">
          <span className="brand-mark">D</span>
          Deskline
        </NavLink>

        <nav className="nav-links">
          <NavLink to="/dashboard" className={({ isActive }) => (isActive ? "active" : "")}>
            My tickets
          </NavLink>
          <NavLink to="/tickets/new" className={({ isActive }) => (isActive ? "active" : "")}>
            New ticket
          </NavLink>
          {isAdmin && (
            <NavLink to="/admin" className={({ isActive }) => (isActive ? "active" : "")}>
              Admin queue
            </NavLink>
          )}
        </nav>

        <div className="nav-user">
          <span className="nav-user-name">
            <strong>{user.name}</strong> {isAdmin ? "· admin" : ""}
          </span>
          <button className="btn-ghost-ink" onClick={handleLogout}>
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
