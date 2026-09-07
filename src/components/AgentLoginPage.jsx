import { useState } from "react";

// Demo-only credentials for this project.
// No real authentication/backend is involved.
const DEMO_USERNAME = "agent";
const DEMO_PASSWORD = "agent123";

function AgentLoginPage({ onLoginSuccess, onCancel }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e) {
    e.preventDefault();

    const cleanUsername = username.trim();
    const cleanPassword = password.trim();

    if (!cleanUsername || !cleanPassword) {
      setError("Please enter both username and password.");
      return;
    }

    if (
      cleanUsername === DEMO_USERNAME &&
      cleanPassword === DEMO_PASSWORD
    ) {
      setError("");
      onLoginSuccess(cleanUsername);
    } else {
      setError("Invalid username or password. Try the demo credentials below.");
    }
  }

  return (
    <section className="agent-login-page">
      <div className="agent-login-container">
        <h1>👨‍💼 Agent Login</h1>
        <p className="agent-login-subtitle">
          Sign in to access the Agent Dashboard.
        </p>

        <form className="agent-login-form" onSubmit={handleSubmit}>
          <label>
            Username
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              autoFocus
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
            />
          </label>

          {error && <div className="agent-login-error">{error}</div>}

          <button type="submit" className="agent-login-submit">
            Log In
          </button>

          <button
            type="button"
            className="agent-login-cancel"
            onClick={onCancel}
          >
            Cancel
          </button>
        </form>

        <div className="agent-login-demo-hint">
          <strong>Demo credentials:</strong> username <code>agent</code>,
          password <code>agent123</code>
        </div>
      </div>
    </section>
  );
}

export default AgentLoginPage;

