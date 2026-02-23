import { Meteor } from "meteor/meteor";
import { useTracker } from "meteor/react-meteor-data";
import MeteorLogo from "./meteor-logo.svg";

export const Header = ({ currentView, onNavigate, isAdmin }) => {
  const user = useTracker(() => Meteor.user());

  const handleLogout = () => {
    Meteor.logout();
  };

  return (
    <div className="header">
      <nav className="nav container">
        <div className="logo-container">
          <MeteorLogo className="logo" />
          <h1 className="page-title">Pink Diamond CRM</h1>
        </div>

        <div className="nav-center">
          <button
            className={`nav-button ${currentView === "customers" ? "active" : ""}`}
            onClick={() => onNavigate("customers")}
          >
            Customers
          </button>
          {isAdmin && (
            <button
              className={`nav-button ${currentView === "admin" ? "active" : ""}`}
              onClick={() => onNavigate("admin")}
            >
              Admin
            </button>
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
  );
};
