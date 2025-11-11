import React, { useState, useEffect } from "react";
import "../styles/AddDeliveryModal.css";

const AddDeliveryModal = ({ storeId, isOpen, onClose }) => {
  const [locations, setLocations] = useState([]);
  const [form, setForm] = useState({
    province: "",
    city: "",
    suburb: "",
    postal_code: "",
    price: "",
    estimated_time: "",
  });

  const API_BASE = import.meta.env.VITE_API_URL;

  // Load delivery locations when modal opens
  useEffect(() => {
    if (isOpen && storeId) loadLocations();
  }, [isOpen, storeId]);

  async function loadLocations() {
    try {
      const res = await fetch(`${API_BASE}/api/delivery_locations?store_id=${storeId}`);
      if (!res.ok) throw new Error("Failed to fetch delivery locations");
      const data = await res.json();
      setLocations(data.locations || []);
    } catch (err) {
      console.error("Error loading delivery locations:", err);
    }
  }

  async function handleAdd(e) {
    e.preventDefault();
    const { province, city, price, estimated_time } = form;
    if (!province || !city || !price || !estimated_time) {
      return alert("Province, City, Price, and Estimated Time are required");
    }

    try {
      const res = await fetch(`${API_BASE}/api/${storeId}/delivery`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add location");
      setLocations((prev) => [...prev, data.location]);
      setForm({
        province: "",
        city: "",
        suburb: "",
        postal_code: "",
        price: "",
        estimated_time: "",
      });
    } catch (err) {
      console.error("Error adding delivery location:", err);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this delivery location?")) return;
    try {
      const res = await fetch(`${API_BASE}/api/${storeId}/delivery/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to delete");
      setLocations((prev) => prev.filter((loc) => loc.id !== id));
    } catch (err) {
      console.error("Failed to delete location:", err);
    }
  }

  async function handleUpdate(id, key, value) {
    try {
      const res = await fetch(`${API_BASE}/api/${storeId}/delivery/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: value }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update location");
      setLocations((prev) =>
        prev.map((loc) => (loc.id === id ? { ...loc, [key]: value } : loc))
      );
    } catch (err) {
      console.error("Error updating delivery location:", err);
    }
  }

  if (!isOpen) return null;

  return (
    <div className={`modal-overlay ${isOpen ? "show" : ""}`} onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <span className="close-btn" onClick={onClose}>
          &times;
        </span>
        <h2>Delivery Locations</h2>

        <table className="delivery-table">
          <thead>
            <tr>
              <th>Province</th>
              <th>City</th>
              <th>Suburb/Town</th>
              <th>Postal Code</th>
              <th>Price</th>
              <th>Estimated Time</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {locations.map((loc) => (
              <tr key={loc.id}>
                {["province", "city", "suburb", "postal_code", "price", "estimated_time"].map(
                  (key) => (
                    <td
                      key={key}
                      contentEditable
                      suppressContentEditableWarning
                      onBlur={(e) => handleUpdate(loc.id, key, e.target.innerText)}
                    >
                      {key === "price" ? `R${loc[key] ?? ""}` : loc[key] || ""}
                    </td>
                  )
                )}
                <td>
                  <button
                    type="button"
                    className="delete-loc"
                    onClick={() => handleDelete(loc.id)}
                    title="Delete"
                  >
                    <i className="bx bx-trash"></i>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <form className="delivery-form" onSubmit={handleAdd}>
          <input
            type="text"
            placeholder="Province"
            value={form.province}
            onChange={(e) => setForm({ ...form, province: e.target.value })}
            required
          />
          <input
            type="text"
            placeholder="City"
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
            required
          />
          <input
            type="text"
            placeholder="Suburb/Town (optional)"
            value={form.suburb}
            onChange={(e) => setForm({ ...form, suburb: e.target.value })}
          />
          <input
            type="text"
            placeholder="Postal Code (optional)"
            value={form.postal_code}
            onChange={(e) => setForm({ ...form, postal_code: e.target.value })}
          />
          <input
            type="number"
            placeholder="Price"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            required
          />
          <input
            type="text"
            placeholder="Estimated Time (e.g. 2–3 days)"
            value={form.estimated_time}
            onChange={(e) => setForm({ ...form, estimated_time: e.target.value })}
            required
          />
          <button type="submit">+ Add Location</button>
        </form>
      </div>
    </div>
  );
};

export default AddDeliveryModal;