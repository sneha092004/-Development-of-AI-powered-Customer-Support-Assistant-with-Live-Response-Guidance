

import { useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const mockOrders = {
  ORD12345: {
    status: "Shipped",
    date: "2026-08-28",
    items: "Wireless Headphones x1",
    expected: "2026-09-06",
    location: "Indore Delivery Hub",
    lat: 22.7196,
    lng: 75.8577
  },

  ORD98765: {
    status: "Delayed",
    date: "2026-09-02",
    items: "Running Shoes x1",
    expected: "2026-09-07",
    location: "Bhopal Sorting Center",
    lat: 23.2599,
    lng: 77.4126
  },

  ORD55555: {
    status: "Delivered",
    date: "2026-08-15",
    items: "Coffee Maker x1",
    expected: "2026-08-20",
    location: "Indore",
    lat: 22.7196,
    lng: 75.8577
  }
};

const markerIcon = new L.Icon({
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

function OrdersPage({ onGoToChat }) {
  const [orderId, setOrderId] = useState("");
  const [result, setResult] = useState(null);
  const [searched, setSearched] = useState(false);

  function handleTrack() {
    const cleanId = orderId.trim().toUpperCase();

    if (!cleanId) {
      return;
    }

    setSearched(true);
    setResult(mockOrders[cleanId] || null);
  }

  function handleAskAI() {
    if (!result) {
      return;
    }

    localStorage.setItem(
      "orderSupportMessage",
      `Why is my order ${orderId.trim().toUpperCase()} ${result.status.toLowerCase()}?`
    );

    if (onGoToChat) {
      onGoToChat();
    }
  }

  function handleAgentSupport() {
    if (!result) {
      return;
    }

    localStorage.setItem(
      "orderSupportMessage",
      `I need help with my order ${orderId
        .trim()
        .toUpperCase()}. It is currently ${result.status.toLowerCase()} and the current location is ${result.location}.`
    );

    if (onGoToChat) {
      onGoToChat();
    }
  }

  function getStatusClass(status) {
    if (status === "Delivered") {
      return "delivered";
    }

    if (status === "Delayed") {
      return "delayed";
    }

    if (status === "Shipped") {
      return "shipped";
    }

    return "processing";
  }

  function getStepClass(step) {
    if (!result) {
      return "";
    }

    const status = result.status;

    if (status === "Delivered") {
      return "completed";
    }

    if (status === "Delayed") {
      if (step <= 3) {
        return "completed";
      }

      return "";
    }

    if (status === "Shipped") {
      if (step <= 3) {
        return "completed";
      }

      return "";
    }

    if (status === "Processing") {
      if (step <= 2) {
        return "completed";
      }

      return "";
    }

    return "";
  }

  return (
    <section className="orders-page">
      <div className="orders-container">
        <h1>📦 Track Your Order</h1>

        <p className="orders-subtitle">
          Enter your order number below to check its current status.
        </p>

        <div className="orders-search">
          <input
            type="text"
            placeholder="e.g. ORD12345"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleTrack();
              }
            }}
          />

          <button
            type="button"
            onClick={handleTrack}
          >
            Track
          </button>
        </div>

        <p className="orders-hint">
          Try one of these sample orders:
          {" "}
          <strong>ORD12345</strong>,
          {" "}
          <strong>ORD98765</strong>,
          {" "}
          <strong>ORD55555</strong>
        </p>

        {searched && result && (
          <div className="order-result">
            <div className="order-header">
              <div>
                <h3>
                  Order {orderId.trim().toUpperCase()}
                </h3>

                <p>{result.items}</p>
              </div>

              <span
                className={`order-status-badge ${getStatusClass(
                  result.status
                )}`}
              >
                {result.status === "Delayed" && "⚠️ "}
                {result.status === "Shipped" && "🚚 "}
                {result.status === "Delivered" && "✅ "}
                {result.status}
              </span>
            </div>

            <div className="order-details-grid">
              <div className="order-detail">
                <span>Order Date</span>
                <strong>{result.date}</strong>
              </div>

              <div className="order-detail">
                <span>Items</span>
                <strong>{result.items}</strong>
              </div>

              <div className="order-detail">
                <span>Expected Delivery</span>
                <strong>{result.expected}</strong>
              </div>

              <div className="order-detail">
                <span>Current Location</span>
                <strong>{result.location}</strong>
              </div>
            </div>

            <div className="order-timeline">
              <h3>📦 Order Status</h3>

              <div className="timeline">
                <div className={`timeline-step ${getStepClass(1)}`}>
                  <div className="timeline-circle">✓</div>
                  <span>Order Placed</span>
                </div>

                <div className="timeline-line"></div>

                <div className={`timeline-step ${getStepClass(2)}`}>
                  <div className="timeline-circle">✓</div>
                  <span>Confirmed</span>
                </div>

                <div className="timeline-line"></div>

                <div className={`timeline-step ${getStepClass(3)}`}>
                  <div className="timeline-circle">✓</div>
                  <span>Shipped</span>
                </div>

                <div className="timeline-line"></div>

                <div className={`timeline-step ${getStepClass(4)}`}>
                  <div className="timeline-circle">4</div>
                  <span>Out for Delivery</span>
                </div>

                <div className="timeline-line"></div>

                <div className={`timeline-step ${getStepClass(5)}`}>
                  <div className="timeline-circle">5</div>
                  <span>Delivered</span>
                </div>
              </div>
            </div>

            {result.status === "Delayed" && (
              <div className="delayed-warning">
                <div>
                  <h3>⚠️ Your order may be delayed</h3>

                  <p>
                    Your order is currently at{" "}
                    <strong>{result.location}</strong>.
                  </p>

                  <p>
                    Updated expected delivery:{" "}
                    <strong>{result.expected}</strong>
                  </p>
                </div>

                <div className="order-action-buttons">
                  <button
                    type="button"
                    className="ask-ai-button"
                    onClick={handleAskAI}
                  >
                    🤖 Ask AI Why My Order Is Delayed
                  </button>

                  <button
                    type="button"
                    className="agent-button"
                    onClick={handleAgentSupport}
                  >
                    👨‍💼 Talk to Support Agent
                  </button>
                </div>
              </div>
            )}

            {result.status !== "Delayed" && (
              <div className="order-actions">
                <button
                  type="button"
                  className="ask-ai-button"
                  onClick={handleAskAI}
                >
                  🤖 Ask AI About My Order
                </button>

                <button
                  type="button"
                  className="agent-button"
                  onClick={handleAgentSupport}
                >
                  👨‍💼 Talk to Support Agent
                </button>
              </div>
            )}

            <div className="live-location">
              <div className="location-header">
                <div>
                  <h3>📍 Live Order Location</h3>

                  <p>Current delivery location</p>
                </div>

                <span className="live-badge">
                  ● Live
                </span>
              </div>

              <div className="map-container">
                <MapContainer
                  center={[
                    result.lat,
                    result.lng
                  ]}
                  zoom={12}
                  scrollWheelZoom={false}
                  style={{
                    height: "300px",
                    width: "100%"
                  }}
                >
                  <TileLayer
                    attribution='&copy; OpenStreetMap contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />

                  <Marker
                    position={[
                      result.lat,
                      result.lng
                    ]}
                    icon={markerIcon}
                  >
                    <Popup>
                      <strong>
                        {result.location}
                      </strong>
                      <br />
                      Order:{" "}
                      {orderId
                        .trim()
                        .toUpperCase()}
                      <br />
                      Status: {result.status}
                    </Popup>
                  </Marker>
                </MapContainer>
              </div>

              <div className="location-info-grid">
                <div>
                  <span>📍 Current Location</span>
                  <strong>{result.location}</strong>
                </div>

                <div>
                  <span>🚚 Status</span>
                  <strong>{result.status}</strong>
                </div>

                <div>
                  <span>📅 Expected Delivery</span>
                  <strong>{result.expected}</strong>
                </div>
              </div>

              <p className="last-updated">
                Last updated: Just now
              </p>
            </div>
          </div>
        )}

        {searched && !result && (
          <div className="order-not-found">
            ❌ No order found with that number.
            Please check the order number and try again.
          </div>
        )}
      </div>
    </section>
  );
}

export default OrdersPage;

