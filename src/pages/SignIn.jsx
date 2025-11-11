import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/SignIn.css";

function SignIn() {
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    fetch(`${API_URL}/auth/user`, {
      credentials: "include",
    })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((user) => {
        if (user) navigate("/market");
      })
      .catch(() => {});
  }, [navigate, API_URL]);

  const handleGoogleSignIn = () => {
    window.location.href = `${API_URL}/auth/google`;
  };

  return (
    <div className="signin-wrapper">
      <div className="signin-card">
        <h1 className="signin-title">Welcome to My Marketplace</h1>
        <p className="signin-subtitle">
          Sign in to access your dashboard and start exploring products
        </p>

        <button className="google-btn" onClick={handleGoogleSignIn}>
          <i className="bx bxl-google google-icon"></i>
          Sign in with Google
        </button>
      </div>
    </div>
  );
}

export default SignIn;