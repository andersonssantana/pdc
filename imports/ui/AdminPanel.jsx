import { useState } from "react";
import { Meteor } from "meteor/meteor";
import { useSubscribe, useFind } from "meteor/react-meteor-data";
import { UserForm } from "./UserForm";
import { ROLES } from "../api/users";

export const AdminPanel = () => {
  const [showForm, setShowForm] = useState(false);

  const isLoading = useSubscribe("users.all");
  const users = useFind(() =>
    Meteor.users.find({}, { sort: { createdAt: -1 } })
  );

  if (isLoading()) {
    return <div className="loading">Loading users...</div>;
  }

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <h2 className="section-title">User Management</h2>
        <button
          className="button"
          onClick={() => setShowForm(true)}
        >
          Add User
        </button>
      </div>

      {users.length === 0 ? (
        <div className="empty-state card">
          <p>No users found.</p>
        </div>
      ) : (
        <div className="users-list">
          {users.map((user) => (
            <div key={user._id} className="user-card card">
              <div className="user-info">
                <h3 className="user-name">
                  {user.profile?.name || user.username}
                </h3>
                <p className="user-username">@{user.username}</p>
              </div>
              <div className="user-role">
                <span className={`role-badge ${user.profile?.role === ROLES.ADMIN ? 'role-admin' : 'role-user'}`}>
                  {user.profile?.role || 'user'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <UserForm onClose={() => setShowForm(false)} />
      )}
    </div>
  );
};
