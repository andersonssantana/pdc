import { Meteor } from "meteor/meteor";
import { useTracker } from "meteor/react-meteor-data";
import { NavLink, useNavigate } from "react-router-dom";

export const Header = ({ isAdmin }) => {
  const user = useTracker(() => Meteor.user());
  const navigate = useNavigate();

  const handleLogout = () => {
    Meteor.logout(() => {
      navigate("/");
    });
  };

  return (
    <>
      <div className="header">
        <nav className="nav container">
          <div className="logo-container">
            <img src="/images/pink_diamond_logo.png" alt="Pink Diamond Collective" className="logo" />
            <h1 className="page-title">Pink Diamond Collective</h1>
          </div>

          <div className="nav-center">
            <NavLink
              to="/customers"
              className={({ isActive }) => `nav-button ${isActive ? "active" : ""}`}
            >
              Customers
            </NavLink>
            {isAdmin && (
              <NavLink
                to="/admin"
                className={({ isActive }) => `nav-button ${isActive ? "active" : ""}`}
              >
                Admin
              </NavLink>
            )}
          </div>

          <div className="nav-right">
            <div className="user-info">
              <span className="user-display-name">
                {user?.profile?.name || user?.username}
              </span>
              {isAdmin && <span className="admin-badge">Admin</span>}
            </div>
            <button className="button button-secondary" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </nav>
      </div>

      <nav className="bottom-nav" aria-label="Main navigation">
        <NavLink
          to="/customers"
          className={({ isActive }) => `bottom-nav-item ${isActive ? "active" : ""}`}
        >
          <span className="bottom-nav-icon" aria-hidden="true">👥</span>
          <span className="bottom-nav-label">Customers</span>
        </NavLink>
        {isAdmin && (
          <NavLink
            to="/admin"
            className={({ isActive }) => `bottom-nav-item ${isActive ? "active" : ""}`}
          >
            <span className="bottom-nav-icon" aria-hidden="true">⚙️</span>
            <span className="bottom-nav-label">Admin</span>
          </NavLink>
        )}
        <button
          className="bottom-nav-item"
          onClick={handleLogout}
        >
          <span className="bottom-nav-icon" aria-hidden="true">🚪</span>
          <span className="bottom-nav-label">Logout</span>
        </button>
      </nav>
    </>
  );
};
