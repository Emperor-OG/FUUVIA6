import React, { useState, useEffect } from "react";
import "../styles/StoreInfo.css";

export default function StoreInfo({ store, onClose }) {
  const [tab, setTab] = useState("delivery");
  const [delivery, setDelivery] = useState([]);
  const [dropoff, setDropoff] = useState([]);
  const [schedule, setSchedule] = useState({});
  
  const API_BASE = import.meta.env.VITE_API_URL;

  useEffect(() => {
    if (!store?.id) return;

    if (tab === "delivery") loadDelivery();
    if (tab === "dropoff") loadDropoff();
    if (tab === "schedule") loadSchedule();
  }, [store, tab]);

  /* ---------------- Delivery ---------------- */
  async function loadDelivery() {
    try {
      const res = await fetch(`${API_BASE}/api/delivery_locations?store_id=${store.id}`);
      const data = await res.json();
      setDelivery(data.locations || []);
    } catch (err) {
      console.error("Error fetching delivery:", err);
    }
  }

  /* ---------------- Drop-off ---------------- */
  async function loadDropoff() {
    try {
      const res = await fetch(`${API_BASE}/api/dropoff_locations?store_id=${store.id}`);
      const data = await res.json();
      setDropoff(data.locations || []);
    } catch (err) {
      console.error("Error loading drop-off:", err);
    }
  }

  /* ---------------- Schedule ---------------- */
  const days = [
    { key: "monday", label: "Monday" },
    { key: "tuesday", label: "Tuesday" },
    { key: "wednesday", label: "Wednesday" },
    { key: "thursday", label: "Thursday" },
    { key: "friday", label: "Friday" },
    { key: "saturday", label: "Saturday" },
    { key: "sunday", label: "Sunday" },
  ];

  async function loadSchedule() {
    try {
      const res = await fetch(`${API_BASE}/api/stores/storefront/${store.id}`);
      const data = await res.json();
      const s = data.store;

      const formatted = {};
      days.forEach(({ key, label }) => {
        const open = s[`${key}_open`];
        const close = s[`${key}_close`];

        formatted[label] = {
          open: open ? open.slice(0,5) : "Closed",
          close: close ? close.slice(0,5) : ""
        };
      });

      setSchedule(formatted);
    } catch (err) {
      console.error("Error loading schedule:", err);
    }
  }

  return (
    <div className="storeinfo-wrapper">
      <div className="header-bar">
        <h2><i className="bx bx-store"></i> {store?.store_name} — Info</h2>
      </div>

      {/* Tabs */}
      <div className="storeinfo-tabs">
        <button className={tab === "delivery" ? "active" : ""} onClick={() => setTab("delivery")}>
          <i className="bx bx-package"></i> Delivery
        </button>

        <button className={tab === "dropoff" ? "active" : ""} onClick={() => setTab("dropoff")}>
          <i className="bx bx-map-pin"></i> Drop-off/Pick-up
        </button>

        <button className={tab === "schedule" ? "active" : ""} onClick={() => setTab("schedule")}>
          <i className="bx bx-time-five"></i> Schedule
        </button>
      </div>

      {/* Delivery Table */}
      {tab === "delivery" && (
        <table className="storeinfo-table">
          <thead>
            <tr>
              <th>Province</th><th>City</th><th>Suburb</th>
              <th>Postal Code</th><th>Price</th><th>ETA</th>
            </tr>
          </thead>
          <tbody>
            {delivery.map(loc => (
              <tr key={loc.id}>
                <td>{loc.province}</td>
                <td>{loc.city}</td>
                <td>{loc.suburb}</td>
                <td>{loc.postal_code}</td>
                <td>R{loc.price}</td>
                <td>{loc.estimated_time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Drop-off Table */}
      {tab === "dropoff" && (
        <table className="storeinfo-table">
          <thead>
            <tr>
              <th>Province</th><th>City</th><th>Suburb</th><th>Postal Code</th>
              <th>Street</th><th>Price</th><th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {dropoff.length > 0 ? (
              dropoff.map(loc => (
                <tr key={loc.id}>
                  <td>{loc.province}</td><td>{loc.city}</td><td>{loc.suburb}</td>
                  <td>{loc.postal_code}</td><td>{loc.street_address}</td>
                  <td>R{loc.price}</td>
                  <td>{loc.notes || "-"}</td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="7" style={{ textAlign: "center" }}>No drop-off locations</td></tr>
            )}
          </tbody>
        </table>
      )}

      {/* Schedule Table */}
      {tab === "schedule" && (
        <table className="storeinfo-table">
          <thead>
            <tr><th>Day</th><th>Opening</th><th>Closing</th></tr>
          </thead>
          <tbody>
            {days.map(({ key, label }) => (
              <tr key={key}>
                <td>{label}</td>
                <td>{schedule[label]?.open}</td>
                <td>{schedule[label]?.close}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
