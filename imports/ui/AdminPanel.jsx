import { useState, useEffect } from "react";
import { Meteor } from "meteor/meteor";
import { useSubscribe, useFind, useTracker } from "meteor/react-meteor-data";
import { UserForm } from "./UserForm";
import { ROLES } from "../api/users";

export const AdminPanel = () => {
  const [showForm, setShowForm] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showStressConfirm, setShowStressConfirm] = useState(false);
  const [stressResult, setStressResult] = useState(null);
  const [stressDurationMinutes, setStressDurationMinutes] = useState(5);
  const [showLogFloodModal, setShowLogFloodModal] = useState(false);
  const [logFloodMbPerSec, setLogFloodMbPerSec] = useState(5);
  const [logFloodMinutes, setLogFloodMinutes] = useState(2);
  const [logFloodStatus, setLogFloodStatus] = useState(null);
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

  const handleStressClick = () => {
    setStressResult(null);
    setError("");
    setStressDurationMinutes(5);
    setShowStressConfirm(true);
  };

  const handleStressConfirm = () => {
    if (!Number.isFinite(stressDurationMinutes) || stressDurationMinutes < 1 || stressDurationMinutes > 10) {
      setError("Duration must be between 1 and 10 minutes");
      return;
    }
    setIsSubmitting(true);
    setError("");
    Meteor.call(
      "system.stressTest",
      { cpu: true, memory: true, durationSeconds: stressDurationMinutes * 60 },
      (err, res) => {
        setIsSubmitting(false);
        if (err) {
          setError(err.reason || "Stress test failed");
        } else {
          setStressResult(res);
        }
      }
    );
  };

  // Poll the server while the log flood modal is open so the admin can watch
  // the volume climb and stop it early once it is big enough.
  useEffect(() => {
    if (!showLogFloodModal) return;
    const poll = () => {
      Meteor.call("system.logFlood.status", (err, res) => {
        if (!err) setLogFloodStatus(res);
      });
    };
    poll();
    const id = setInterval(poll, 1000);
    return () => clearInterval(id);
  }, [showLogFloodModal]);

  const handleLogFloodClick = () => {
    setError("");
    setLogFloodStatus(null);
    setShowLogFloodModal(true);
  };

  const handleLogFloodStart = () => {
    if (!Number.isFinite(logFloodMbPerSec) || logFloodMbPerSec < 0.1 || logFloodMbPerSec > 50) {
      setError("Rate must be between 0.1 and 50 MB/s");
      return;
    }
    if (!Number.isFinite(logFloodMinutes) || logFloodMinutes < 1 || logFloodMinutes > 60) {
      setError("Duration must be between 1 and 60 minutes");
      return;
    }
    setIsSubmitting(true);
    setError("");
    Meteor.call(
      "system.logFlood.start",
      { mbPerSec: logFloodMbPerSec, durationSeconds: logFloodMinutes * 60 },
      (err) => {
        setIsSubmitting(false);
        if (err) setError(err.reason || "Failed to start log flood");
      }
    );
  };

  const handleLogFloodStop = () => {
    setIsSubmitting(true);
    Meteor.call("system.logFlood.stop", (err) => {
      setIsSubmitting(false);
      if (err) setError(err.reason || "Failed to stop log flood");
    });
  };

  const closeLogFloodModal = () => {
    setShowLogFloodModal(false);
    setLogFloodStatus(null);
    setError("");
  };

  const closeStressConfirm = () => {
    setShowStressConfirm(false);
    setStressResult(null);
    setError("");
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
        <div className="admin-header-actions">
          <button
            className="button button-secondary"
            onClick={handleStressClick}
          >
            Stress Test
          </button>
          <button
            className="button button-secondary"
            onClick={handleLogFloodClick}
          >
            Log Flood
          </button>
          <button
            className="button"
            onClick={() => setShowForm(true)}
          >
            Add User
          </button>
        </div>
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
        <div className="modal-overlay modal-overlay--confirm" onClick={closeDeleteConfirm}>
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

      {showStressConfirm && (
        <div className="modal-overlay modal-overlay--confirm" onClick={closeStressConfirm}>
          <div className="modal card confirm-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Run Server Stress Test</h3>
            <p>
              This will intentionally spike this server's CPU and memory to
              test monitoring and autoscaling. The app stays responsive, but
              expect elevated load for the duration below.
            </p>
            {!stressResult && (
              <div className="form-group">
                <label className="form-label">Duration (minutes)</label>
                <input
                  type="number"
                  className="form-input"
                  min={1}
                  max={10}
                  value={stressDurationMinutes}
                  onChange={(e) => setStressDurationMinutes(Number(e.target.value))}
                  disabled={isSubmitting}
                />
              </div>
            )}
            {error && <div className="error-message">{error}</div>}
            {stressResult && (
              <div className="error-message">
                Done. RSS {stressResult.rssBeforeMb}MB &rarr; {stressResult.rssAfterMb}MB,{" "}
                {stressResult.workers} CPU worker(s), {stressResult.memoryMb}MB held.
              </div>
            )}
            <div className="modal-actions">
              <button
                className="button button-secondary"
                onClick={closeStressConfirm}
                disabled={isSubmitting}
              >
                {stressResult ? "Close" : "Cancel"}
              </button>
              {!stressResult && (
                <button
                  className="button button-danger"
                  onClick={handleStressConfirm}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Running..." : "Run Stress Test"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {showLogFloodModal && (
        <div className="modal-overlay modal-overlay--confirm" onClick={closeLogFloodModal}>
          <div className="modal card confirm-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Generate Log Volume</h3>
            <p>
              Writes a steady stream of synthetic log lines to this server's
              stdout so the log pipeline and log download can be tested with a
              large bundle. Closing this dialog does not stop the run.
            </p>
            {!logFloodStatus?.running && (
              <>
                <div className="form-group">
                  <label className="form-label">Rate (MB/s)</label>
                  <input
                    type="number"
                    className="form-input"
                    min={0.1}
                    max={50}
                    step={0.5}
                    value={logFloodMbPerSec}
                    onChange={(e) => setLogFloodMbPerSec(Number(e.target.value))}
                    disabled={isSubmitting}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Duration (minutes)</label>
                  <input
                    type="number"
                    className="form-input"
                    min={1}
                    max={60}
                    value={logFloodMinutes}
                    onChange={(e) => setLogFloodMinutes(Number(e.target.value))}
                    disabled={isSubmitting}
                  />
                </div>
                <p>
                  Estimated total:{" "}
                  <strong>{Math.round(logFloodMbPerSec * logFloodMinutes * 60)} MB</strong>
                </p>
              </>
            )}
            {logFloodStatus?.running && (
              <div className="error-message">
                Running &mdash; {logFloodStatus.megabytes} MB written{" "}
                ({logFloodStatus.lines.toLocaleString()} lines),{" "}
                {logFloodStatus.secondsRemaining}s remaining at{" "}
                {logFloodStatus.targetMbPerSec} MB/s.
              </div>
            )}
            {error && <div className="error-message">{error}</div>}
            <div className="modal-actions">
              <button
                className="button button-secondary"
                onClick={closeLogFloodModal}
                disabled={isSubmitting}
              >
                Close
              </button>
              {logFloodStatus?.running ? (
                <button
                  className="button button-danger"
                  onClick={handleLogFloodStop}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Stopping..." : "Stop"}
                </button>
              ) : (
                <button
                  className="button button-danger"
                  onClick={handleLogFloodStart}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Starting..." : "Start"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
