import React, { useState } from "react";
import "../styles/SearchBar.css";

export default function SearchBar({ onSearch }) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSearch) onSearch(query);
    setActive(false); // Close search after submit
  };

  return (
    <>
      {/* Icon button */}
      {!active && (
        <button
          className="search-icon-btn"
          onClick={() => setActive(true)}
        >
          <i className="bx bx-search"></i>
        </button>
      )}

      {/* Full-screen search overlay */}
      {active && (
        <div className="search-overlay">
          <form className="search-bar-overlay" onSubmit={handleSubmit}>
            <input
              type="text"
              placeholder="Search..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
            <button type="submit">
              <i className="bx bx-search"></i>
            </button>
            <button
              type="button"
              className="close-btn"
              onClick={() => setActive(false)}
            >
              <i className="bx bx-x"></i>
            </button>
          </form>
        </div>
      )}
    </>
  );
}
