import { useEffect, useMemo, useState } from "react";
import "./DashboardPage.css";

const HISTORY_KEY = "aiCustomerSupportChatHistory";
const API = "http://127.0.0.1:5000";
const DEMO_INTENTS = ["Order Tracking", "Refund", "Complaint", "Product Query", "Other"];
const COLORS = ["#6ea8ff", "#f5b84b", "#ff6b6b", "#4fd1c5", "#8aa3bd", "#a78bfa", "#5ad19a"];
const ORDER_COLORS = { Shipped: "#6ea8ff", Delivered: "#5ad19a", Delayed: "#f5b84b", Cancelled: "#ff6b6b", Placed: "#a78bfa" };

/* SYNTHETIC DEMO DATA: 6 months of daily records (used for trend charts and demo mode) */
function buildDays() {
  let seed = 11;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const out = [];
  for (let i = 0; i < 183; i++) {
    const d = new Date(Date.UTC(2026, 3, 17) + i * 864e5);
    const dow = d.getUTCDay();
    const sale = [1, 15].includes(d.getUTCDate()) ? 1.55 : 1;
    const conv = Math.round((120 + i * 0.28) * (dow % 6 ? 1 : 0.68) * sale * (0.9 + rnd() * 0.2));
    const neg = Math.round(conv * (0.17 + (sale > 1 ? 0.08 : 0) + rnd() * 0.06));
    const pos = Math.round(conv * (0.36 + rnd() * 0.07));
    const w = [0.34, 0.17 + (sale > 1 ? 0.08 : 0), 0.2, 0.18, 0.11];
    out.push({
      date: d.toISOString().slice(0, 10), conv, neg, pos, neu: conv - neg - pos,
      rt: Math.round(150 - i * 0.18 + (sale > 1 ? 30 : 0) + rnd() * 25 + (dow % 6 ? 0 : -12)),
      it: w.map((x) => Math.round(conv * x * (0.9 + rnd() * 0.2))),
    });
  }
  return out;
}
const DAYS = buildDays();

const DEMO_CONVOS = [
  ["2041", "Order Tracking", "Negative", "High", "New"],
  ["2038", "Refund", "Negative", "High", "In Progress"],
  ["2036", "Complaint", "Negative", "High", "Escalated"],
  ["2035", "Product Query", "Neutral", "Medium", "New"],
  ["2033", "Order Tracking", "Neutral", "Medium", "In Progress"],
  ["2029", "Refund", "Positive", "Low", "Resolved"],
].map((c) => ({ title: "Cust-" + c[0], intent: c[1], sentiment: c[2], priority: c[3], status: c[4], risk: c[2] === "Negative" ? 80 : 20 }));

const sum = (arr, f) => arr.reduce((a, x) => a + f(x), 0);
const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : "");

function loadHistory() {
  try {
    const parsed = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

/* Convert one saved chat into a dashboard row (same rules as the old DashboardStats) */
function toRow(chat, i) {
  const a = chat.analysis || {};
  const s = String(a.sentiment || "").toLowerCase();
  const sentiment = s.includes("positive") ? "Positive" : s.includes("negative") ? "Negative" : "Neutral";
  const risk = Number(a.escalation_percentage || 0);
  const high = String(a.escalation || "").toLowerCase().includes("high") || risk >= 70;
  const hasAgent = Array.isArray(chat.messages) && chat.messages.some((m) => m.type === "agent");
  return {
    title: chat.title || `Chat ${i + 1}`,
    intent: a.intent || "Unknown",
    sentiment,
    priority: cap(a.urgency) || (sentiment === "Negative" ? "High" : sentiment === "Neutral" ? "Medium" : "Low"),
    status: hasAgent ? "Resolved" : high ? "Escalated" : "New",
    risk, issue: a.key_issue || "Not available",
  };
}

function Chart({ series, colors, labels, name, zero }) {
  const W = 520, H = 170, L = 34, R = 8, T = 10, B = 20;
  const n = series[0].length, all = series.flat(), mx = Math.max(...all);
  const mn = zero ? 0 : Math.min(...all) * 0.92, r = (mx - mn) * 1.08 || 1;
  const X = (i) => L + (n < 2 ? 0 : (i * (W - L - R)) / (n - 1));
  const Y = (v) => T + (H - T - B) * (1 - (v - mn) / r);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={name}>
      {[0, 1, 2, 3].map((k) => {
        const v = mn + (r * k) / 3;
        return (<g key={k}><line x1={L} x2={W - R} y1={Y(v)} y2={Y(v)} stroke="rgba(120,190,255,.14)" /><text x={L - 5} y={Y(v) + 3} textAnchor="end">{Math.round(v)}</text></g>);
      })}
      {series.map((s, j) => {
        const d = s.map((v, i) => `${i ? "L" : "M"}${X(i).toFixed(1)} ${Y(v).toFixed(1)}`).join("");
        return (<g key={j}>{series.length === 1 && <path d={`${d}L${X(n - 1)} ${H - B}L${X(0)} ${H - B}Z`} fill={colors[0]} opacity=".15" />}<path d={d} fill="none" stroke={colors[j]} strokeWidth="2" strokeLinejoin="round" /></g>);
      })}
      <text x={L} y={H - 4}>{labels[0]}</text><text x={W - R} y={H - 4} textAnchor="end">{labels[1]}</text>
    </svg>
  );
}

function Bars({ rows, colorFor }) {
  const max = Math.max(...rows.map((r) => r[1]), 1), total = sum(rows, (r) => r[1]) || 1;
  return rows.map(([label, v], i) => (
    <div className="sp-bar" key={label}>
      <span>{label}</span>
      <div><div style={{ width: `${(v / max) * 100}%`, background: colorFor(label, i) }} /></div>
      <span>{v} ({Math.round((v / total) * 100)}%)</span>
    </div>
  ));
}

function DashboardPage({ onGoToChat }) {
  const [history, setHistory] = useState(loadHistory);
  const [source, setSource] = useState(() => (loadHistory().length ? "live" : "demo"));
  const [range, setRange] = useState(183);
  const [fSent, setFSent] = useState("All");
  const [fIntent, setFIntent] = useState("All");
  const [orders, setOrders] = useState(null);
  const [orderError, setOrderError] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setHistory(loadHistory()), 5000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    fetch(`${API}/api/orders/summary`)
      .then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then((d) => setOrders(Object.entries(d).filter(([, v]) => typeof v === "number")))
      .catch(() => setOrderError(true));
  }, []);

  const D = useMemo(() => DAYS.slice(-range), [range]);
  const g = Math.ceil(range / 30);
  const bucket = (f) => { const o = []; for (let i = 0; i < D.length; i += g) { const c = D.slice(i, i + g); o.push(sum(c, f) / c.length); } return o; };
  const labels = [D[0].date.slice(5), D[D.length - 1].date.slice(5)];

  const live = source === "live";
  const rows = live ? history.map(toRow) : DEMO_CONVOS;
  const total = live ? rows.length : sum(D, (d) => d.conv);
  const neg = live ? rows.filter((r) => r.sentiment === "Negative").length : sum(D, (d) => d.neg);
  const pending = rows.filter((r) => r.status === "Escalated").length;
  const rt = Math.round(sum(D, (d) => d.rt) / D.length);
  const ordersTracked = orders ? sum(orders, (r) => r[1]) : "-";

  const sentRows = ["Positive", "Neutral", "Negative"].map((s) => [s, live ? rows.filter((r) => r.sentiment === s).length : sum(D, (d) => ({ Positive: d.pos, Neutral: d.neu, Negative: d.neg }[s]))]);
  const intentRows = live
    ? Object.entries(rows.reduce((m, r) => ({ ...m, [r.intent]: (m[r.intent] || 0) + 1 }), {})).sort((a, b) => b[1] - a[1])
    : DEMO_INTENTS.map((x, i) => [x, sum(D, (d) => d.it[i])]);
  const intentOptions = ["All", ...new Set([...DEMO_INTENTS, ...rows.map((r) => r.intent)])];

  const rank = { Negative: 0, Neutral: 1, Positive: 2 };
  const queue = rows
    .filter((r) => (fSent === "All" || r.sentiment === fSent) && (fIntent === "All" || r.intent === fIntent))
    .sort((a, b) => rank[a.sentiment] - rank[b.sentiment] || b.risk - a.risk);
  const alerts = rows.filter((r) => r.status === "Escalated").sort((a, b) => b.risk - a.risk).slice(0, 4);
  const rNow = sum(DAYS.slice(-7), (d) => d.it[1]), rPrev = sum(DAYS.slice(-14, -7), (d) => d.it[1]);
  const rChange = Math.round((rNow / rPrev - 1) * 100);

  const kpis = [
    ["Total conversations", total.toLocaleString(), live ? "saved chats" : `last ${range} days`],
    ["Negative sentiment chats", neg.toLocaleString(), total ? `${Math.round((neg / total) * 100)}% of chats` : "no chats yet"],
    live ? ["High-risk pending", pending, "escalation risk 70% or more"] : ["Avg response time", `${Math.floor(rt / 60)}m ${rt % 60}s`, "per first reply"],
    ["Orders tracked", ordersTracked, "from MongoDB Atlas"],
    ["Customer satisfaction", total ? `${(4.7 - (neg / total) * 3).toFixed(1)} / 5` : "-", "modeled score"],
  ];

  return (
    <div className="sp-wrap">
      <div className="sp-top">
        <div><h1>SUPPORT-PULSE</h1><p className="sp-sub">Command center for the AI-powered customer support assistant</p></div>
        <span className="sp-tag">{live ? "LIVE: saved chats and orders · trends are demo" : "SYNTHETIC DEMO DATA (orders are live)"}</span>
      </div>

      <section className="sp-card sp-filters">
        <label>Data source
          <select value={source} onChange={(e) => setSource(e.target.value)}>
            <option value="live">Live (saved chats)</option>
            <option value="demo">Demo (synthetic)</option>
          </select>
        </label>
        <label>Trend range
          <select value={range} onChange={(e) => setRange(+e.target.value)}>
            <option value={7}>Last 7 days</option><option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option><option value={183}>Last 6 months</option>
          </select>
        </label>
        <label>Sentiment
          <select value={fSent} onChange={(e) => setFSent(e.target.value)}>
            {["All", "Negative", "Neutral", "Positive"].map((x) => <option key={x}>{x}</option>)}
          </select>
        </label>
        <label>Intent
          <select value={fIntent} onChange={(e) => setFIntent(e.target.value)}>
            {intentOptions.map((x) => <option key={x}>{x}</option>)}
          </select>
        </label>
        <button className="sp-btn" onClick={onGoToChat}>Open live chat</button>
      </section>

      <section className="sp-kpis">
        {kpis.map((k) => (
          <div className="sp-card" key={k[0]}><span className="sp-sub">{k[0]}</span><div className="sp-kv">{k[1]}</div><i>{k[2]}</i></div>
        ))}
      </section>

      <div className="sp-two">
        <section className="sp-card">
          <h2>Conversation queue <span className="sp-sub">most urgent first</span></h2>
          <div className="sp-scroll">
            <table>
              <thead><tr><th>Conversation</th><th>Intent</th><th>Sentiment</th><th>Priority</th><th>Status</th></tr></thead>
              <tbody>
                {queue.length === 0 && (
                  <tr><td colSpan="5" className="sp-sub">{live && !rows.length ? "No saved chats yet. Open live chat and send a message." : "No conversations match these filters."}</td></tr>
                )}
                {queue.map((c, i) => (
                  <tr key={i}><td>{c.title}</td><td>{c.intent}</td><td><span className={`sp-pill ${c.sentiment}`}>{c.sentiment}</span></td><td><span className={`sp-pr ${c.priority}`}>{c.priority}</span></td><td><span className={`sp-st ${c.status.replace(/\s/g, "")}`}>{c.status}</span></td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="sp-card">
          <h2>Alerts</h2>
          {alerts.length === 0 && <p className="sp-sub">No high-risk conversations right now.</p>}
          {alerts.map((a, i) => (
            <div className="sp-al high" key={i}><b>HIGH · {a.risk}%</b><p>{a.title}: {a.issue}. Escalation suggested.</p><em>AI suggestion. Agent judgment required.</em></div>
          ))}
          <div className="sp-al med"><b>MEDIUM (demo trend)</b><p>Refund requests are {rChange >= 0 ? "up" : "down"} {Math.abs(rChange)}% versus the previous 7 days.</p><em>AI suggestion. Agent judgment required.</em></div>
        </section>
      </div>

      <section className="sp-grid2">
        <div className="sp-card"><h2>Sentiment breakdown</h2><Bars rows={sentRows} colorFor={(l) => ({ Positive: "#5ad19a", Neutral: "#f5b84b", Negative: "#ff6b6b" }[l])} /></div>
        <div className="sp-card"><h2>Intent distribution</h2>{intentRows.length ? <Bars rows={intentRows} colorFor={(l, i) => COLORS[i % COLORS.length]} /> : <p className="sp-sub">No chats yet.</p>}</div>
        <div className="sp-card"><h2>Conversations over time <span className="sp-sub">demo trend</span></h2><Chart series={[bucket((d) => d.conv)]} colors={["#4fd1c5"]} labels={labels} name="Conversations per day" zero /></div>
        <div className="sp-card">
          <h2>Sentiment trend <span className="sp-sub">demo trend</span></h2>
          <Chart series={[bucket((d) => d.neg), bucket((d) => d.neu), bucket((d) => d.pos)]} colors={["#ff6b6b", "#f5b84b", "#5ad19a"]} labels={labels} name="Sentiment trend" zero />
          <div className="sp-leg"><span><i style={{ background: "#ff6b6b" }} />Negative</span><span><i style={{ background: "#f5b84b" }} />Neutral</span><span><i style={{ background: "#5ad19a" }} />Positive</span></div>
        </div>
        <div className="sp-card"><h2>Average response time (seconds) <span className="sp-sub">demo trend</span></h2><Chart series={[bucket((d) => d.rt)]} colors={["#6ea8ff"]} labels={labels} name="Average response time" /></div>
        <div className="sp-card">
          <h2>Orders by status <span className="sp-sub">live from MongoDB Atlas</span></h2>
          {orderError && <p className="sp-sub">Could not load order data. Is app.py running?</p>}
          {!orderError && !orders && <p className="sp-sub">Loading orders…</p>}
          {orders && <Bars rows={orders} colorFor={(l) => ORDER_COLORS[l] || "#4fd1c5"} />}
        </div>
      </section>

      <section className="sp-card">
        <h2>Model insights</h2>
        <p><b>Sentiment:</b> DistilBERT (Positive, Neutral, Negative). <b>Intent:</b> DistilBART zero-shot classification.</p>
        <p className="sp-sub">NLP reads customer messages to detect sentiment and intent so agents get real-time suggestions.</p>
        <div className="sp-resp">AI suggestions are decision support only. The final reply and any action are the responsibility of the human agent.</div>
      </section>
    </div>
  );
}

export default DashboardPage;
