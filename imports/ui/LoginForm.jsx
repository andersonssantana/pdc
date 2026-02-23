import { useState } from "react";
import { Meteor } from "meteor/meteor";

export const LoginForm = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    Meteor.loginWithPassword(username, password, (err) => {
      setLoading(false);
      if (err) {
        setError(err.reason || "Login failed");
      }
    });
  };

  return (
    <div className="login-container">
      <div className="login-card card">
        <img src="/images/pink_diamond_logo.png" alt="Pink Diamond Collective" className="login-logo" />
        <h1 className="login-title">Pink Diamond Collective</h1>
        <h2 className="login-subtitle">Login</h2>

        <form onSubmit={handleSubmit} className="login-form">
          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label htmlFor="username" className="form-label">Username</label>
            <input
              type="text"
              id="username"
              className="form-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              disabled={loading}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">Password</label>
            <input
              type="password"
              id="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              disabled={loading}
            />
          </div>

          <button type="submit" className="button login-button" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
};
