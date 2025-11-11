// pages/Checkout.jsx
import React, { useState, useEffect } from "react";
import { useSearchParams, useLocation } from "react-router-dom";
import "../styles/Checkout.css";

export default function Checkout() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const storeId = searchParams.get("id");

  const [cartItems, setCartItems] = useState([]);
  const [delivery, setDelivery] = useState([]);
  const [dropoff, setDropoff] = useState([]);
  const [tab, setTab] = useState("delivery");
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [address, setAddress] = useState({
    street: "",
    unit: "",
    building: "",
    notes: "",
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_BASE = import.meta.env.VITE_API_URL;

  // Total order calculation
  const total = cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

  // Load cart from navigation state first, fallback to localStorage
  useEffect(() => {
    let initialCart = [];
    if (location.state?.cartItems) {
      initialCart = location.state.cartItems;
    } else if (storeId) {
      const savedCart = localStorage.getItem(`cart_${storeId}`);
      if (savedCart) {
        try { initialCart = JSON.parse(savedCart); } 
        catch (err) { console.error(err); }
      }
    }
    setCartItems(initialCart);
  }, [storeId, location.state]);

  // Save cart to localStorage
  useEffect(() => {
    if (!storeId) return;
    localStorage.setItem(`cart_${storeId}`, JSON.stringify(cartItems));
  }, [cartItems, storeId]);

  // Fetch delivery and dropoff locations
  useEffect(() => {
    if (!storeId) return;

    const fetchLocations = async () => {
      setLoading(true);
      try {
        const [delRes, dropRes] = await Promise.all([
          fetch(`${API_BASE}/api/delivery_locations?store_id=${storeId}`),
          fetch(`${API_BASE}/api/dropoff_locations?store_id=${storeId}`)
        ]);

        if (!delRes.ok || !dropRes.ok) throw new Error("Failed fetching locations");

        const delData = await delRes.json();
        const dropData = await dropRes.json();

        setDelivery(delData.locations || []);
        setDropoff(dropData.locations || []);
      } catch (err) {
        console.error(err);
        setError("Failed to load locations");
      } finally {
        setLoading(false);
      }
    };

    fetchLocations();
  }, [storeId]);

  const handlePay = async () => {
    if (!selectedLocation) return alert("Select a location first");
    if (tab === "delivery" && !address.street) return alert("Enter street address");

    const payload = {
      items: cartItems,
      total,
      type: tab,
      locationId: selectedLocation.id,
      address,
      customerEmail: "customer@example.com", // optional: replace with real email
    };

    try {
      const res = await fetch(`${API_BASE}/api/payments/initiate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      if (!res.ok) {
        console.error("Payment error response:", text);
        throw new Error("Payment request failed");
      }

      let data;
      try { data = JSON.parse(text); } 
      catch (err) { 
        console.error("Failed to parse JSON from payment response:", text);
        throw new Error("Invalid JSON response from payment endpoint"); 
      }

      if (data.authorization_url) {
        window.location.href = data.authorization_url;
      } else {
        console.error("Payment endpoint missing authorization_url:", data);
        alert("Payment initialization failed");
      }
    } catch (err) {
      console.error("Payment error:", err);
      alert("Error initializing payment. Check console for details.");
    }
  };

  return (
    <div className="checkout-page">
      <h2>Checkout</h2>

      {loading && <p>Loading locations...</p>}
      {error && <p style={{color:"red"}}>{error}</p>}

      {!loading && !error && cartItems.length > 0 && (
        <>
          {/* Tabs */}
          <div className="checkout-tabs">
            <button className={tab==="delivery"?"active":""} onClick={()=>setTab("delivery")}>Delivery</button>
            <button className={tab==="pickup"?"active":""} onClick={()=>setTab("pickup")}>Pickup</button>
          </div>

          {/* Locations */}
          <div className="location-list">
            {(tab==="delivery"?delivery:dropoff).map(loc=>(
              <div 
                key={loc.id} 
                className={`location-item ${selectedLocation?.id===loc.id?"selected":""}`} 
                onClick={()=>setSelectedLocation(loc)}
              >
                <p>{loc.city}, {loc.suburb || loc.town}</p>
                <small>{loc.street_address || `${loc.province} - ${loc.postal_code}`}</small>
                {loc.price && <p className="price">R{loc.price}</p>}
              </div>
            ))}
          </div>

          {/* Delivery inputs */}
          {tab==="delivery" && selectedLocation && (
            <div className="address-form">
              <input type="text" placeholder="Street" value={address.street} onChange={e=>setAddress({...address, street:e.target.value})} />
              <input type="text" placeholder="Unit / Complex / Building Number" value={address.unit} onChange={e=>setAddress({...address, unit:e.target.value})} />
              <input type="text" placeholder="Building Name (optional)" value={address.building} onChange={e=>setAddress({...address, building:e.target.value})} />
              <input type="text" placeholder="Delivery Notes (optional)" value={address.notes} onChange={e=>setAddress({...address, notes:e.target.value})} />
            </div>
          )}

          {/* Summary */}
          <div className="summary">
            <h3>Order Total: R{total.toFixed(2)}</h3>
            <button onClick={handlePay}>Pay</button>
          </div>
        </>
      )}

      {!loading && cartItems.length === 0 && (
        <p>Your cart is empty.</p>
      )}
    </div>
  );
}