import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom"; 
import "../styles/Sidenav.css"; 
import "boxicons/css/boxicons.min.css"; 

export default function Sidenav() {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState([]);
    const [menuOpen, setMenuOpen] = useState(false);
    const [darkMode, setDarkMode] = useState(false);
    const navigate = useNavigate(); 

    const API_BASE = import.meta.env.VITE_API_URL;

    // 🔍 Fetch users
    useEffect(() => {
        const fetchUsers = async () => {
        if (query.trim().length === 0) {
            setResults([]);
            return;
        }
        try {
            const res = await fetch(`/api/search-users?q=${encodeURIComponent(query)}`);
            const users = await res.json();
            setResults(users);
        } catch (err) {
            console.error("Search failed:", err);
        }
        };
        fetchUsers();
    }, [query]);

    // 🌙 Toggle theme
    useEffect(() => {
        if (darkMode) {
        document.body.classList.add("dark");
        } else {
        document.body.classList.remove("dark");
        }
    }, [darkMode]);

    // 🔘 Nav items (React Router paths, no .html)
    const navItems = [
        { id: "home", icon: "bx bx-home", text: "Home", link: "/home" },
        { id: "explore", icon: "bx bx-compass", text: "Explore", link: "/explore" },
        { id: "reels", icon: "bx bx-video", text: "Videos", link: "/videos" },
        { id: "market", icon: "bx bx-store", text: "Market", link: "/market" }, // ✅ Market route
        { id: "profile", icon: "bx bx-user", text: "Profile", link: "/profile" },
    ];

    //Logout
    const handleLogout = async () => {
    try {
        await fetch(`${API_BASE}/auth/logout`, {
        method: "GET",
        credentials: "include", // ✅ include cookies to log out
        });

        // Redirect to SignIn page after logout
        navigate("/"); 
    } catch (err) {
        console.error("Logout failed:", err);
    }
    };

  return (
    <>
      {/* === SIDENAV CONTAINER === */}
      <div className="Sidenav" id="Sidenav">
        {/* 🔍 Search */}
        <div className="search-wrapper">
          <i className="bx bx-search search-icon"></i>
          <input
            type="search"
            placeholder="Search users..."
            id="searchBar"
            className="search-bar"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {/* 📋 Nav Buttons */}
        <div className="nav-buttons">
          {navItems.map((item) => (
            <Link key={item.id} to={item.link} className="nav-button">
              <i className={item.icon}></i>
              <span>{item.text}</span>
            </Link>
          ))}

          <button
            className="nav-button"
            onClick={() => setMenuOpen((prev) => !prev)}
          >
            <i className="bx bx-menu"></i>
            <span>Menu</span>
          </button>
        </div>

        {/* 📜 About Us link */}
        <p id="c" onClick={() => navigate("/about-us")}>
          About Us
        </p>
      </div>

      {/* === SEARCH RESULTS PANEL === */}
      {query && (
        <div id="searchPanel" className="active">
          <ul id="searchResults">
            {results.length === 0 ? (
              <li className="empty-result">No users found</li>
            ) : (
              results.map((user) => (
                <li
                  key={user.google_id || user.id}
                  className="search-item"
                  onClick={() => {
                    if (user.google_id) {
                      navigate(`/profile/${user.google_id}`);
                    }
                  }}
                >
                  <img
                    src={user.profile_pic || "/default-avatar.jpg"}
                    alt={user.display_name}
                    className="search-avatar"
                  />
                  <span className="search-name">{user.display_name}</span>
                </li>
              ))
            )}
          </ul>
        </div>
      )}

      {/* === SIDE MENU === */}
      {menuOpen && (
        <>
          <div
            id="menuOverlay"
            className="show"
            onClick={() => setMenuOpen(false)}
          ></div>
          <div id="sideMenu" className="open">
            <button onClick={() => navigate("/donations")}>
              <i className="bx bx-donate-heart"></i> Donate
            </button>
            <button disabled>
              <i className="bx bx-tv"></i> Advertising (Coming soon)
            </button>
            <button onClick={() => navigate("/settings")}>
              <i className="bx bx-cog"></i> Settings
            </button>
            <button onClick={handleLogout}>
              <i className="bx bx-log-out"></i> Logout
            </button>

            <div className="theme-toggle">
              <span>Dark Mode</span>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={darkMode}
                  onChange={(e) => setDarkMode(e.target.checked)}
                />
                <span className="slider"></span>
              </label>
            </div>
          </div>
        </>
      )}
    </>
  );

}
