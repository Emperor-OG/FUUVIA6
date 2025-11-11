  import React from "react";
  import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
  import SignIn from "./pages/SignIn";
  import Market from "./pages/Market";
  import StoreDashboard from "./pages/StoreDashboard.jsx";
  import Store from "./pages/Store.jsx";
  import Checkout from "./pages/Checkout.jsx";
  import Settings from "./pages/Settings.jsx";
  import AboutUs from "./pages/AboutUs.jsx";

  function App() {
    return (
      <Router>
        <Routes>
          <Route path="/" element={<SignIn />} />       {/* Landing / SignIn page */}
          <Route path="/market" element={<Market />} /> {/* Market page */}
          <Route path="/store-dashboard" element={<StoreDashboard />} />
          <Route path="/store" element={<Store />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/about-us" element={<AboutUs />} />
        </Routes>
      </Router>
    );
  }

  export default App;