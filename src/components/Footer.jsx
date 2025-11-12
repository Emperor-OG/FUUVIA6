// src/components/Footer.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Footer.css";
import "boxicons/css/boxicons.min.css";

export default function Footer() {
  const navigate = useNavigate();

  const footerItems = [
    { id: "footerHome", icon: "bx bx-home", label: "Home", link: "/home" },
    { id: "footerExplore", icon: "bx bx-compass", label: "Explore", link: "/explore" },
    { id: "footerMarket", icon: "bx bx-store", label: "Market", link: "/market" },
    { id: "footerVideos", icon: "bx bx-video", label: "Videos", link: "/videos" },
    { id: "footerProfile", icon: "bx bx-user", label: "Profile", link: "/profile" },
  ];

  return (
    <footer id="footerCon" className="footerCon">
      {footerItems.map((item) => (
        <button
          key={item.id}
          id={item.id}
          className={`footerButton ${
            item.id === "footerMarket" ? "marketBtn" : ""
          }`}
          onClick={() => navigate(item.link)} //client-side route
        >
          <i className={item.icon}></i>
          <span className="footerLabel">{item.label}</span>
        </button>
      ))}
    </footer>
  );
}
