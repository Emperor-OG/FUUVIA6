// Header.jsx
import React, { useState } from "react";
import { Link } from "react-router-dom"; // React Router Link
import "boxicons/css/boxicons.min.css";
import SearchBar from "./SearchBar";
import "../styles/Header.css";

export default function Header() {
  const [donationOpen, setDonationOpen] = useState(false);

  const toggleDonations = () => setDonationOpen((prev) => !prev);
  const closeDonations = () => setDonationOpen(false);

  const NAME = "FUUVIA";

  return (
    <>
      {/* === HEADER === */}
      <header className="header">
        {/* Logo link */}
        <Link to="/home" className="LogoCon">
          <h3 className="logo">{NAME}</h3>
        </Link>

        {/* Show search bar only on mobile */}
        <div className="mobile-search">
          <SearchBar />
        </div>

        {/* Donation button */}
        <button className="headerDonationBtn" onClick={toggleDonations}>
          <i className="bx bx-donate-heart"></i>
        </button>
      </header>

      {/* === DONATIONS MODAL === */}
      {donationOpen && (
        <div className="DonationsModal active">
          <p className="DonationsInfo">
            Please donate to promote the growth of our app so it can grow and bring you more joy.
          </p>

          <h3 className="DonationsMethods">
            Bank name: Capitec Bank<br />
            Account holder: Mr. Mabasa<br />
            Account number: 2113102362<br />
            Amount: "Any amount"<br />
            Reference: "Your name"
          </h3>

          <Link to="/donations" className="DonationsPage">
            For more information about our objective and use of funds, click here.
          </Link>
        </div>
      )}

      {/* === OVERLAY === */}
      {donationOpen && (
        <div className="DonationsOverlay active" onClick={closeDonations}></div>
      )}
    </>
  );

}
