import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Header from "../components/Header.jsx";
import Sidenav from "../components/Sidenav.jsx";
import Footer from "../components/Footer.jsx";
import StorePanel from "../components/StorePanel.jsx";
import ProductLibrary from "../components/ProductLibrary.jsx";
import AddProductModal from "../components/AddProducts.jsx";
import EditProductModal from "../components/EditProduct.jsx";
import EditStore from "../components/EditStore.jsx";
import AddDeliveryModal from "../components/AddDeliveryModal.jsx";
import AddDropoffModal from "../components/AddDropoffModal.jsx";
import Loading from "../components/Loading.jsx";
import "../styles/StoreDashboard.css";

export default function StoreDashboard() {
  const [searchParams] = useSearchParams();
  const storeId = searchParams.get("id");

  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);

  // Modal states
  const [modalStoreId, setModalStoreId] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingStore, setEditingStore] = useState(false);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [showDropoffModal, setShowDropoffModal] = useState(false);

  const API_BASE = import.meta.env.VITE_API_URL;

  useEffect(() => {
    const fetchStoreAndProducts = async () => {
      if (!storeId) {
        setError("No store ID provided");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Fetch store info
        const storeRes = await fetch(`${API_BASE}/api/stores/storefront/${storeId}`, {
          credentials: "include",
        });
        if (!storeRes.ok) throw new Error(`Store fetch failed: ${storeRes.status}`);
        const storeData = await storeRes.json();
        if (!storeData.store) throw new Error("Store not found");
        setStore(storeData.store);

        // Fetch store products
        const productsRes = await fetch(`${API_BASE}/api/stores/${storeId}/products`, {
          credentials: "include",
        });
        if (!productsRes.ok) throw new Error(`Products fetch failed: ${productsRes.status}`);
        const productsData = await productsRes.json();
        setProducts(productsData.products || []);
      } catch (err) {
        console.error("Error fetching store or products:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStoreAndProducts();
  }, [storeId]);

  // Modal controls
  const handleOpenAddModal = () => setModalStoreId(storeId);
  const handleCloseAddModal = () => setModalStoreId(null);

  const handleEditProduct = (product) => setEditingProduct(product);
  const handleCloseEditModal = () => setEditingProduct(null);

  const handleOpenEditStore = () => setEditingStore(true);
  const handleCloseEditStore = () => setEditingStore(false);

  const handleOpenDeliveryModal = () => setShowDeliveryModal(true);
  const handleCloseDeliveryModal = () => setShowDeliveryModal(false);

  const handleOpenDropoffModal = () => setShowDropoffModal(true);
  const handleCloseDropoffModal = () => setShowDropoffModal(false);

  // Product updates
  const handleProductAdded = (newProduct) =>
    setProducts((prev) => [...prev, newProduct]);

  const handleProductUpdated = (updatedProduct) => {
    if (!updatedProduct) {
      // Deleted product
      setProducts((prev) => prev.filter((p) => p.id !== editingProduct.id));
    } else {
      // Updated product
      setProducts((prev) =>
        prev.map((p) => (p.id === updatedProduct.id ? updatedProduct : p))
      );
    }
  };

  // Handle button clicks from StorePanel
  const handleActionClick = (action) => {
    switch (action) {
      case "addProduct":
        handleOpenAddModal();
        break;
      case "editStore":
        handleOpenEditStore();
        break;
      case "deliveryLocations":
        handleOpenDeliveryModal();
        break;
      case "dropoffLocations": // ✅ new button action
        handleOpenDropoffModal();
        break;
      default:
        console.log(`Unknown action: ${action}`);
    }
  };

  if (loading)
    return (
      <div className="store-dashboard-page">
        <Header />
        <main className="store-dashboard-loading">Loading store details...</main>
        <Footer />
      </div>
    );

  if (error)
    return (
      <div className="store-dashboard-page">
        <Header />
        <main className="store-dashboard-error">{error}</main>
        <Footer />
      </div>
    );

  return (
    <div className="store-dashboard-page">
      <Header />
      <div className="store-dashboard-layout">
        <Sidenav />
        <main className="store-dashboard-main">
          <StorePanel store={store} onActionClick={handleActionClick} />
          <ProductLibrary products={products} onEditProduct={handleEditProduct} />
        </main>
      </div>

      {/* Add Product Modal */}
      {modalStoreId && (
        <AddProductModal
          storeId={modalStoreId}
          isOpen={!!modalStoreId}
          onClose={handleCloseAddModal}
          onProductAdded={handleProductAdded}
          setLoading={setProcessing}
        />
      )}

      {/* Edit Product Modal */}
      {editingProduct && (
        <EditProductModal
          product={editingProduct}
          storeId={storeId}
          isOpen={!!editingProduct}
          onClose={handleCloseEditModal}
          onProductUpdated={handleProductUpdated}
          setLoading={setProcessing}
        />
      )}

      {/* Edit Store Modal */}
      {editingStore && (
        <EditStore storeId={storeId} onClose={handleCloseEditStore} />
      )}

      {/* Delivery Locations Modal */}
      {showDeliveryModal && (
        <AddDeliveryModal
          storeId={storeId}
          isOpen={showDeliveryModal}
          onClose={handleCloseDeliveryModal}
        />
      )}

      {/* Dropoff Locations Modal */}
      {showDropoffModal && (
        <AddDropoffModal
          storeId={storeId}
          isOpen={showDropoffModal}
          onClose={handleCloseDropoffModal}
        />
      )}

      {/* Global processing overlay */}
      {processing && <Loading message="Processing..." />}

      <Footer />
    </div>
  );
}