import { useState } from "react";
import { Meteor } from "meteor/meteor";
import { useSubscribe, useFind, useTracker } from "meteor/react-meteor-data";
import { UserForm } from "./UserForm";
import { ROLES } from "../api/users";

export const AdminPanel = () => {
  const [showForm, setShowForm] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentUserId = useTracker(() => Meteor.userId());
  const isLoading = useSubscribe("users.all");
  const users = useFind(() =>
    Meteor.users.find({}, { sort: { createdAt: -1 } })
  );

  const handleEditPassword = (user) => {
    setSelectedUser(user);
    setNewPassword("");
    setConfirmPassword("");
    setError("");
    setShowPasswordModal(true);
  };

  const handleDeleteClick = (user) => {
    setSelectedUser(user);
    setShowDeleteConfirm(true);
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsSubmitting(true);
    Meteor.call("users.setPassword", selectedUser._id, newPassword, (err) => {
      setIsSubmitting(false);
      if (err) {
        setError(err.reason || "Failed to update password");
      } else {
        setShowPasswordModal(false);
        setSelectedUser(null);
      }
    });
  };

  const handleDeleteConfirm = () => {
    setIsSubmitting(true);
    Meteor.call("users.remove", selectedUser._id, (err) => {
      setIsSubmitting(false);
      if (err) {
        setError(err.reason || "Failed to delete user");
      } else {
        setShowDeleteConfirm(false);
        setSelectedUser(null);
      }
    });
  };

  const closePasswordModal = () => {
    setShowPasswordModal(false);
    setSelectedUser(null);
    setNewPassword("");
    setConfirmPassword("");
    setError("");
  };

  const closeDeleteConfirm = () => {
    setShowDeleteConfirm(false);
    setSelectedUser(null);
    setError("");
  };

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
              <div className="user-card-right">
                <div className="user-role">
                  <span className={`role-badge ${user.profile?.role === ROLES.ADMIN ? 'role-admin' : 'role-user'}`}>
                    {user.profile?.role || 'user'}
                  </span>
                </div>
                <div className="user-actions">
                  <button
                    className="button-text"
                    onClick={() => handleEditPassword(user)}
                  >
                    Edit Password
                  </button>
                  {user._id !== currentUserId && (
                    <button
                      className="button-text"
                      onClick={() => handleDeleteClick(user)}
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <UserForm onClose={() => setShowForm(false)} />
      )}

      {showPasswordModal && selectedUser && (
        <div className="modal-overlay" onClick={closePasswordModal}>
          <div className="modal card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                Reset Password for {selectedUser.profile?.name || selectedUser.username}
              </h3>
              <button className="modal-close" onClick={closePasswordModal}>
                &times;
              </button>
            </div>
            <form className="modal-form" onSubmit={handlePasswordSubmit}>
              {error && <div className="error-message">{error}</div>}
              <div className="form-group">
                <label className="form-label">New Password</label>
                <input
                  type="password"
                  className="form-input"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  required
                  minLength={6}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Confirm Password</label>
                <input
                  type="password"
                  className="form-input"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  required
                  minLength={6}
                />
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={closePasswordModal}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="button"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Saving..." : "Save Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteConfirm && selectedUser && (
        <div className="modal-overlay" onClick={closeDeleteConfirm}>
          <div className="modal card confirm-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Delete User</h3>
            <p>
              Are you sure you want to delete{" "}
              <strong>{selectedUser.profile?.name || selectedUser.username}</strong>?
              This action cannot be undone.
            </p>
            {error && <div className="error-message">{error}</div>}
            <div className="modal-actions">
              <button
                className="button button-secondary"
                onClick={closeDeleteConfirm}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                className="button button-danger"
                onClick={handleDeleteConfirm}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
