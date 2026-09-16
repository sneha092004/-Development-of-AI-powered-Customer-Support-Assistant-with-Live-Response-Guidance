
import { useState } from "react";
import "./App.css";
import ChatPage from "./components/ChatPage";
import OrdersPage from "./components/OrdersPage";
import SupportPage from "./components/SupportPage";
import AgentLoginPage from "./components/AgentLoginPage";
import translations from "./translations";

function App() {
  const [page, setPage] = useState("home");
  const [isAgentLoggedIn, setIsAgentLoggedIn] = useState(false);
  const [agentName, setAgentName] = useState("");
  const [language, setLanguage] = useState("English");

  const t = translations[language] || translations.English;

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
              {t.logout}
            </button>
          </div>
        ) : (
          <button
            className="login"
            onClick={() => setPage("agentLogin")}
          >
            {t.agentLogin}
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
              {t.navHome}
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
              {t.navChat}
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
              {t.navOrders}
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
              {t.navSupport}
            </a>
          </li>

          <li>
            <select
              className="language"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              <option value="English">🌐 English</option>
              <option value="Hindi">Hindi</option>
              <option value="Marathi">Marathi</option>
              <option value="Gujarati">Gujarati</option>
              <option value="Punjabi">Punjabi</option>
              <option value="Tamil">Tamil</option>
              <option value="Telugu">Telugu</option>
              <option value="Kannada">Kannada</option>
              <option value="Malayalam">Malayalam</option>
              <option value="Bengali">Bengali</option>
            </select>
          </li>
        </ul>
      </nav>

      {page === "home" && (
        <>
          {isAgentLoggedIn && (
            <div className="agent-welcome-banner">
              {t.agentWelcomePrefix}{" "}
              <strong>{agentName}</strong> {t.agentWelcomeSuffix}
            </div>
          )}

          <section className="hero">
            <h1>{t.heroTitle}</h1>

            <p>{t.heroSubtitle}</p>

            <button
              className="start"
              onClick={() => setPage("chat")}
            >
              {t.startChat}
            </button>
          </section>

          <section className="main-content">
            <div className="features">
              <h2>{t.featuresTitle}</h2>

              <div className="cards">
                <div className="card">
                  <h3>{t.feature1Title}</h3>
                  <p>{t.feature1Desc}</p>
                </div>

                <div className="card">
                  <h3>{t.feature2Title}</h3>
                  <p>{t.feature2Desc}</p>
                </div>

                <div className="card">
                  <h3>{t.feature3Title}</h3>
                  <p>{t.feature3Desc}</p>
                </div>

                <div className="card">
                  <h3>{t.feature4Title}</h3>
                  <p>{t.feature4Desc}</p>
                </div>

                <div className="card">
                  <h3>{t.feature5Title}</h3>
                  <p>{t.feature5Desc}</p>
                </div>

                <div className="card">
                  <h3>{t.feature6Title}</h3>
                  <p>{t.feature6Desc}</p>
                </div>
              </div>
            </div>
          </section>

          <section className="about">
            <h2>{t.aboutTitle}</h2>

            <p>{t.aboutText1}</p>

            <p>{t.aboutText2}</p>
          </section>
        </>
      )}

      {page === "chat" && <ChatPage language={language} />}

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

      <footer>{t.footerText}</footer>
    </div>
  );
}

export default App;