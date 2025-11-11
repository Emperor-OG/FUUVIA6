import React from "react";
import "../styles/AboutUs.css";

export default function AboutUs() {
  return (
    <div className="about-us-page">
      <h1>About Us</h1>

      <section className="about-section">
        <p>
          Welcome to MyMarketplace! We are dedicated to providing a seamless online shopping
          experience for both buyers and sellers.
        </p>
        <p>
          Our mission is to connect people with products they love, while giving sellers
          a platform to grow their businesses.
        </p>
        <p>
          Contact us at <a href="mailto:support@mymarketplace.com">support@mymarketplace.com</a>
        </p>
      </section>

      <section className="about-section">
        <h2>Our Team</h2>
        <ul>
          <li>Onge Mabasa - Founder & CEO</li>
          <li>Jane Doe - CTO</li>
          <li>John Smith - Marketing Lead</li>
        </ul>
      </section>
    </div>
  );
}