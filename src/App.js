

import { useState } from "react";
import "./App.css";
import ChatPage from "./components/ChatPage";
import OrdersPage from "./components/OrdersPage";
import SupportPage from "./components/SupportPage";
import AgentLoginPage from "./components/AgentLoginPage";

function App() {
  const [page, setPage] = useState("home");
  const [isAgentLoggedIn, setIsAgentLoggedIn] = useState(false);
  const [agentName, setAgentName] = useState("");

  function handleLoginSuccess(username) {
    setIsAgentLoggedIn(true);
    setAgentName(username);
    setPage("home");
  }

  function handleLogout() {
    setIsAgentLoggedIn(false);
    setAgentName("");
    setPage("home");
  }

  return (
    <div className="home">
      <nav className="navbar">
        <h2>
          🤖 AI-powered Customer Support Assistant with Live Response Guidance
        </h2>

        {isAgentLoggedIn ? (
          <div className="agent-session-badge">
            <span>👤 {agentName}</span>

            <button
              className="login"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        ) : (
          <button
            className="login"
            onClick={() => setPage("agentLogin")}
          >
            Agent Login
          </button>
        )}
      </nav>

      <nav className="navbar second-nav">
        <ul className="nav-links">
          <li>
            <a
              href="#"
              className={
                page === "home"
                  ? "active-nav-link"
                  : ""
              }
              onClick={(e) => {
                e.preventDefault();
                setPage("home");
              }}
            >
              Home
            </a>
          </li>

          <li>
            <a
              href="#"
              className={
                page === "chat"
                  ? "active-nav-link"
                  : ""
              }
              onClick={(e) => {
                e.preventDefault();
                setPage("chat");
              }}
            >
              AI Chat
            </a>
          </li>

          <li>
            <a
              href="#"
              className={
                page === "orders"
                  ? "active-nav-link"
                  : ""
              }
              onClick={(e) => {
                e.preventDefault();
                setPage("orders");
              }}
            >
              Orders
            </a>
          </li>

          <li>
            <a
              href="#"
              className={
                page === "support"
                  ? "active-nav-link"
                  : ""
              }
              onClick={(e) => {
                e.preventDefault();
                setPage("support");
              }}
            >
              Support
            </a>
          </li>

          <li>
            <select className="language">
              <option>🌐 English</option>
              <option>Hindi</option>
              <option>Marathi</option>
              <option>Gujarati</option>
              <option>Punjabi</option>
              <option>Tamil</option>
              <option>Telugu</option>
              <option>Kannada</option>
              <option>Malayalam</option>
              <option>Bengali</option>
            </select>
          </li>
        </ul>
      </nav>

      {page === "home" && (
        <>
          {isAgentLoggedIn && (
            <div className="agent-welcome-banner">
              ✅ Logged in as Agent{" "}
              <strong>{agentName}</strong> — you now
              have access to the Agent Dashboard inside AI Chat.
            </div>
          )}

          <section className="hero">
            <h1>AI-Powered Customer Support</h1>

            <p>
              Deliver faster, smarter and more personalized
              customer support with Artificial Intelligence.
            </p>

            <button
              className="start"
              onClick={() => setPage("chat")}
            >
              Start Chat
            </button>
          </section>

          <section className="main-content">
            <div className="features">
              <h2>Our Features</h2>

              <div className="cards">
                <div className="card">
                  <h3>💬 Live Chat</h3>
                  <p>
                    Real-time communication with customers.
                  </p>
                </div>

                <div className="card">
                  <h3>😊 Sentiment Analysis</h3>
                  <p>
                    Detect customer emotions and satisfaction.
                  </p>
                </div>

                <div className="card">
                  <h3>🎯 Intent Detection</h3>
                  <p>
                    Understand customer needs and requests.
                  </p>
                </div>

                <div className="card">
                  <h3>🤖 AI Reply</h3>
                  <p>
                    Generate smart and helpful responses.
                  </p>
                </div>

                <div className="card">
                  <h3>🧠 Agent Coaching</h3>
                  <p>
                    Provide real-time guidance to support agents.
                  </p>
                </div>

                <div className="card">
                  <h3>📎 File Upload</h3>
                  <p>
                    Upload invoices or product images for support.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="about">
            <h2>About the Project</h2>

            <p>
              A Customer Support Assistant is an intelligent
              customer support system designed to analyze
              customer conversations and provide real-time
              assistance to support agents.
            </p>

            <p>
              The system uses Artificial Intelligence to perform
              sentiment analysis, intent detection, urgency
              detection and escalation risk detection while
              providing useful coaching suggestions to agents.
            </p>
          </section>
        </>
      )}

      {page === "chat" && <ChatPage />}

      {page === "orders" && (
        <OrdersPage
          onGoToChat={() => setPage("chat")}
        />
      )}

      {page === "support" && (
        <SupportPage
          onGoToChat={() => setPage("chat")}
        />
      )}

      {page === "agentLogin" && (
        <AgentLoginPage
          onLoginSuccess={handleLoginSuccess}
          onCancel={() => setPage("home")}
        />
      )}

      <footer>
        © 2026 Development of AI-powered Customer Support Assistant with Live Response Guidance
      </footer>
    </div>
  );
}

export default App;