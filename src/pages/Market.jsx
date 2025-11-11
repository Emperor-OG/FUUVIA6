import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header.jsx";
import Sidenav from "../components/Sidenav.jsx";
import Footer from "../components/Footer.jsx";
import StoreCard from "../components/StoreCard.jsx";
import FavouriteCard from "../components/FavouriteCard.jsx";
import StoreModal from "../components/StoreModal.jsx";
import Loading from "../components/Loading.jsx";
import "../styles/Market.css";

export default function Market() {
  const navigate = useNavigate();

  const [stores, setStores] = useState([]);
  const [filteredStores, setFilteredStores] = useState([]);
  const [userEmail, setUserEmail] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [favourites, setFavourites] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStore, setSelectedStore] = useState("");

  const API_BASE = import.meta.env.VITE_API_URL;

  useEffect(() => {
    const fetchUserAndStores = async () => {
      try {
        const userRes = await fetch(`${API_BASE}/api/user/email`, {
          credentials: "include",
        });
        if (!userRes.ok) throw new Error("Failed to fetch user email");
        const userData = await userRes.json();
        setUserEmail(userData?.email || "");

        const storesRes = await fetch(`${API_BASE}/api/stores`, {
          credentials: "include",
        });
        const storesData = await storesRes.json();
        if (storesData.success && Array.isArray(storesData.stores)) {
          const formattedStores = storesData.stores.map((store) => {
            store.admin_emails = [];
            for (let i = 1; i <= 10; i++) {
              if (store[`admin${i}`]) store.admin_emails.push(store[`admin${i}`]);
            }
            return store;
          });
          setStores(formattedStores);
          setFilteredStores(formattedStores);
        }
      } catch (err) {
        console.error("❌ Error fetching user or stores:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndStores();

    const favs = JSON.parse(localStorage.getItem("favourites") || "[]");
    setFavourites(favs);
  }, []);

  useEffect(() => {
    localStorage.setItem("favourites", JSON.stringify(favourites));
  }, [favourites]);

  const toggleFavourite = (store) => {
    setFavourites((prev) => {
      const exists = prev.find((s) => s.id === store.id);
      if (exists) return prev.filter((s) => s.id !== store.id);
      else return [...prev, store];
    });
  };

  const handleSearch = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (!query) {
      setFilteredStores(stores);
      return;
    }
    const lowerQuery = query.toLowerCase();
    setFilteredStores(
      stores.filter(
        (store) =>
          (store.store_name && store.store_name.toLowerCase().includes(lowerQuery)) ||
          (store.id && store.id.toString().includes(lowerQuery)) ||
          (store.province && store.province.toLowerCase().includes(lowerQuery)) ||
          (store.city && store.city.toLowerCase().includes(lowerQuery)) ||
          (store.description && store.description.toLowerCase().includes(lowerQuery))
      )
    );
  };

  const userStores = stores.filter((store) => {
    const admins = Array.isArray(store.admin_emails)
      ? store.admin_emails
      : Array.from({ length: 10 }, (_, i) => store[`admin${i + 1}`]).filter(Boolean);
    return admins.includes(userEmail);
  });

  const handleSelectChange = (e) => {
    const storeId = e.target.value;
    setSelectedStore(storeId);
    if (storeId) navigate(`/store-dashboard?id=${storeId}`);
  };

  const hasStores = stores.length > 0;

  return (
    <div className="market-page">
      <Header />
      <div className="market-layout">
        <Sidenav />
        <main className="market-container">
          {loading && <Loading message="Processing..." />}

          {/* Store Header with Search (desktop inline) */}
          {hasStores && (
            <div className="store-header">
              <div className="header-left">
                <div className="market-search-bar desktop-search">
                  <input
                    type="text"
                    placeholder="Search stores..."
                    value={searchQuery}
                    onChange={handleSearch}
                  />
                </div>
              </div>

              <div className="header-right">
                {userStores.length > 0 ? (
                  <select
                    value={selectedStore}
                    onChange={handleSelectChange}
                    className="store-dropdown"
                  >
                    <option value="">Select your store...</option>
                    {userStores.map((store) => (
                      <option key={store.id} value={store.id}>
                        {store.store_name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="no-store-text">You have no stores yet.</span>
                )}
                <button className="add-store-btn" onClick={() => setModalOpen(true)}>
                  + Add Store
                </button>
              </div>
            </div>
          )}

          {/* Mobile Searchbar (separate below header) */}
          <div className="market-search-bar mobile-search">
            <input
              type="text"
              placeholder="Search stores..."
              value={searchQuery}
              onChange={handleSearch}
            />
          </div>

          {/* Favourites Section */}
          {favourites.length > 0 && (
            <div className="favourites-section">
              <h3>Your Favourites</h3>
              <div className="favourites-row">
                {favourites.map((store) => (
                  <FavouriteCard
                    key={store.id}
                    store={store}
                    onHeartClick={() => toggleFavourite(store)}
                    onClick={() => navigate(`/store?id=${store.id}`)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* All Stores */}
          {hasStores ? (
            <>
              <h3 className="all-stores-label">All Stores</h3>
              <div className="stores-grid">
                {filteredStores.map((store) => (
                  <StoreCard
                    key={store.id}
                    store={store}
                    isFavourite={favourites.some((s) => s.id === store.id)}
                    onHeartClick={() => toggleFavourite(store)}
                    onClick={() => navigate(`/store?id=${store.id}`)}
                  />
                ))}
              </div>
            </>
          ) : (
            <div className="no-store-section">
              <div className="add-store-card" onClick={() => setModalOpen(true)}>
                + Add Store
              </div>
            </div>
          )}
        </main>
      </div>

      <Footer />

      {modalOpen && (
        <>
          <div className="overlay" onClick={() => setModalOpen(false)}></div>
          <StoreModal
            isOpen={modalOpen}
            onClose={() => setModalOpen(false)}
            onSubmit={() => setModalOpen(false)}
            userEmail={userEmail}
          />
        </>
      )}
    </div>
  );
}