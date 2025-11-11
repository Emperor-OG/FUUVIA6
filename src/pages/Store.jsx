import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Header from "../components/Header.jsx";
import Sidenav from "../components/Sidenav.jsx";
import Footer from "../components/Footer.jsx";
import EUStorePanel from "../components/EUStorePanel.jsx";
import EUProductLibrary from "../components/EUProductLibrary.jsx";
import Loading from "../components/Loading.jsx";
import StoreInfo from "../components/StoreInfo.jsx";
import ProductModal from "../components/ProductModal.jsx";
import Cart from "../components/Cart.jsx";
import "../styles/Store.css";

export default function Store() {
  const [searchParams] = useSearchParams();
  const storeId = searchParams.get("id");

  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showInfoModal, setShowInfoModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const [cartItems, setCartItems] = useState([]);
  const [showCart, setShowCart] = useState(false);

  const API_BASE = import.meta.env.VITE_API_URL;

  // ✅ Load + normalize cart from localStorage on page load
  useEffect(() => {
    const savedCart = localStorage.getItem(`cart_${storeId}`);
    if (!savedCart) return;

    try {
      const parsed = JSON.parse(savedCart);

      const normalized = parsed.map((item) => ({
        product_id: item.product_id,
        variant_id: item.variant_id ?? item.id, // fallback for old cart version
        name: item.name,
        variant: item.variant,
        price: item.price,
        quantity: item.quantity ?? item.qty ?? 1,
        image: item.image,
      }));

      setCartItems(normalized);
    } catch (err) {
      console.error("Error parsing saved cart:", err);
    }
  }, [storeId]);

  // ✅ Save cart to localStorage whenever updated
  useEffect(() => {
    localStorage.setItem(`cart_${storeId}`, JSON.stringify(cartItems));
  }, [cartItems, storeId]);

  useEffect(() => {
    const fetchStoreAndProducts = async () => {
      if (!storeId) {
        setError("No store ID provided");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const storeRes = await fetch(`${API_BASE}/api/stores/storefront/${storeId}`, {
          credentials: "include",
        });
        if (!storeRes.ok) throw new Error(`Store fetch failed: ${storeRes.status}`);
        const storeData = await storeRes.json();
        if (!storeData.store) throw new Error("Store not found");
        setStore(storeData.store);

        const productRes = await fetch(`${API_BASE}/api/stores/${storeId}/products`, {
          credentials: "include",
        });
        if (!productRes.ok) throw new Error(`Product fetch failed: ${productRes.status}`);
        const productData = await productRes.json();
        setProducts(productData.products || productData || []);
      } catch (err) {
        console.error("❌ Error fetching store or products:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStoreAndProducts();
  }, [storeId]);

  /* ✅ UI Button Actions */
  const handleActionClick = (action) => {
    if (action === "storeInfo") {
      setShowInfoModal(true);
    }
  };

  /* ✅ Add to Cart */
  const handleAddToCart = (item) => {
    setCartItems((prev) => {
      const existing = prev.find(
        (i) => i.product_id === item.product_id && i.variant_id === item.variant_id
      );

      if (existing) {
        return prev.map((i) =>
          i.variant_id === item.variant_id
            ? { ...i, quantity: i.quantity + item.quantity }
            : i
        );
      }

      return [
        ...prev,
        {
          product_id: item.product_id,
          variant_id: item.variant_id,
          name: item.name,
          variant: item.variant,
          price: item.price,
          quantity: item.quantity,
          image: item.image,
        },
      ];
    });

    setShowCart(true);
  };

  /* ✅ Remove item */
  const handleRemoveFromCart = (variantId) => {
    setCartItems((prev) => prev.filter((item) => item.variant_id !== variantId));
  };

  /* ✅ Update quantity */
  const handleUpdateCartQuantity = (variantId, qty) => {
    if (qty < 1) return handleRemoveFromCart(variantId);

    setCartItems((prev) =>
      prev.map((item) =>
        item.variant_id === variantId ? { ...item, quantity: qty } : item
      )
    );
  };

  return (
    <div className="store-page">
      <Header />

      <div className="store-layout">
        <Sidenav />

        <main className="store-container">
          {loading && <Loading message="Loading Store..." />}
          {error && <p style={{ color: "red" }}>{error}</p>}

          {!loading && store && (
            <>
              <EUStorePanel store={store} onActionClick={handleActionClick} />
              <section className="store-products-section">
                <EUProductLibrary
                  products={products}
                  onProductClick={(product) => setSelectedProduct(product)}
                />
              </section>
            </>
          )}
        </main>

        {/* ✅ Cart Drawer */}
        <Cart
          cartItems={cartItems.map((item) => ({
            id: item.variant_id,
            name: item.name,
            variant: item.variant,
            price: item.price,
            qty: item.quantity,
            image: item.image,
          }))}
          showCart={showCart}
          onCloseCart={() => setShowCart(false)}
          onRemoveItem={handleRemoveFromCart}
          onUpdateQuantity={handleUpdateCartQuantity}
        />
      </div>

      {/* ✅ Store Info Modal */}
      {showInfoModal && (
        <div className="storeinfo-modal-overlay" onClick={() => setShowInfoModal(false)}>
          <div className="storeinfo-modal" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal-btn" onClick={() => setShowInfoModal(false)}>
              <i className="bx bx-x"></i>
            </button>
            <StoreInfo store={store} />
          </div>
        </div>
      )}

      {/* ✅ Product Variant Modal */}
      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={handleAddToCart}
        />
      )}

      {/* ✅ Floating Cart Button */}
      <button className="cart-float-btn" onClick={() => setShowCart(true)}>
        <i className="bx bx-cart"></i>
        {cartItems.length > 0 && <span className="cart-count">{cartItems.length}</span>}
      </button>

      <Footer />
    </div>
  );
}