import React, { useState } from "react";
import { createPortal } from "react-dom";
import "../styles/AddProducts.css";

const AddProductModal = ({ storeId, onProductAdded, isOpen, onClose, setLoading }) => {
  const [productName, setProductName] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [baseVariation, setBaseVariation] = useState({
    name: "",
    price: "",
    markupPrice: "0.00",
    stock: "",
    image: null,
    preview: null,
  });
  const [variants, setVariants] = useState([]);

  const API_BASE = import.meta.env.VITE_API_URL;
  const MARKUP_PERCENT = parseFloat(import.meta.env.VITE_MARKUP_PERCENTAGE || 11.25);

  // Calculate final selling price
  const calculateMarkup = (price) => {
    const num = parseFloat(price) || 0;
    const markupMultiplier = 1 + MARKUP_PERCENT / 100;
    return (num * markupMultiplier).toFixed(2);
  };

  const handleBaseChange = (field, value) => {
    const updated = { ...baseVariation, [field]: value };
    if (field === "price") updated.markupPrice = calculateMarkup(value);
    setBaseVariation(updated);
  };

  const handleBaseImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setBaseVariation({
      ...baseVariation,
      image: file,
      preview: URL.createObjectURL(file),
    });
  };

  const addVariant = () => {
    setVariants((prev) => [
      ...prev,
      { name: "", price: "", markupPrice: "0.00", stock: "", image: null, preview: null },
    ]);
  };

  const removeVariant = (i) => setVariants((prev) => prev.filter((_, idx) => idx !== i));

  const handleVariantChange = (i, field, value) => {
    setVariants((prev) => {
      const updated = [...prev];
      updated[i][field] = value;
      if (field === "price") updated[i].markupPrice = calculateMarkup(value);
      return updated;
    });
  };

  const handleVariantImageChange = (i, file) => {
    setVariants((prev) => {
      const updated = [...prev];
      updated[i].image = file;
      updated[i].preview = URL.createObjectURL(file);
      return updated;
    });
  };

  const resetForm = () => {
    setProductName("");
    setCategory("");
    setDescription("");
    setBaseVariation({
      name: "",
      price: "",
      markupPrice: "0.00",
      stock: "",
      image: null,
      preview: null,
    });
    setVariants([]);
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!baseVariation.image) return alert("Please upload a base product image.");

    const formData = new FormData();

    // Basic product info
    formData.append("name", productName);
    formData.append("category", category);
    formData.append("description", description);

    // Base variation
    formData.append("variant1_name", baseVariation.name || productName);
    formData.append("base_price", baseVariation.price);
    formData.append("stock", baseVariation.stock || 0);

    // Upload base image
    formData.append("images", baseVariation.image);

    // Variants arrays
    const variantNames = variants.map((v) => v.name);
    const variantBasePrices = variants.map((v) => v.price);
    const variantMarkupPrices = variants.map((v) => v.markupPrice);
    const variantsStock = variants.map((v) => v.stock || "0");

    // Append variant images
    variants.forEach((v) => {
      if (v.image) formData.append("variant_images", v.image);
    });

    // ✅ Send as JSON for backend to parse
    formData.append("variant_names", JSON.stringify(variantNames));
    formData.append("variant_base_prices", JSON.stringify(variantBasePrices));
    formData.append("variant_markup_prices", JSON.stringify(variantMarkupPrices));
    formData.append("variants_stock", JSON.stringify(variantsStock));

    try {
      if (setLoading) setLoading(true);
      const res = await fetch(`${API_BASE}/api/stores/${storeId}/products`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save product.");

      onProductAdded(data.product);
      resetForm();
    } catch (err) {
      console.error("❌ Error saving product:", err);
      alert("Failed to save product.");
    } finally {
      if (setLoading) setLoading(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="add-product-modal-overlay">
      <div className="add-product-modal">
        <button className="modal-close-btn" onClick={resetForm}>
          &times;
        </button>
        <h2>Add New Product</h2>

        <form onSubmit={handleSubmit}>
          <label>Product Name:</label>
          <input
            type="text"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            required
          />

          <label>Category:</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)} required>
            <option value="">Select Category</option>
            <option value="clothing">Clothing</option>
            <option value="electronics">Electronics</option>
            <option value="accessories">Accessories</option>
            <option value="beauty">Beauty</option>
            <option value="home">Home & Living</option>
            <option value="footwear">Footwear</option>
            <option value="sports">Sports</option>
            <option value="other">Other</option>
          </select>

          <label>Description:</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            required
          />

          {/* Base Variation */}
          <div className="variation-block">
            <h3>Base Variation</h3>
            <input type="file" accept="image/*" onChange={handleBaseImageChange} required />
            {baseVariation.preview && (
              <img src={baseVariation.preview} alt="preview" className="preview" />
            )}

            <input
              type="text"
              placeholder="Variation Name"
              value={baseVariation.name}
              onChange={(e) => handleBaseChange("name", e.target.value)}
            />

            <input
              type="number"
              placeholder="Base Price (R)"
              value={baseVariation.price}
              onChange={(e) => handleBaseChange("price", e.target.value)}
              min="0"
              required
            />

            {/* Final Selling Price Display */}
            <div className="variant-markup-display">
              <label>Final Price ({MARKUP_PERCENT}% markup):</label>
              <span>R {baseVariation.markupPrice}</span>
            </div>

            <input
              type="number"
              placeholder="Stock"
              value={baseVariation.stock}
              onChange={(e) => handleBaseChange("stock", e.target.value)}
              min="0"
              required
            />
          </div>

          {/* Additional Variants */}
          <div className="variant-section">
            <h3>Additional Variations</h3>
            {variants.map((v, i) => (
              <div key={i} className="variant-block">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleVariantImageChange(i, e.target.files[0])}
                />
                {v.preview && <img src={v.preview} alt="variant" className="variant-preview" />}

                <input
                  type="text"
                  placeholder="Variant Name"
                  value={v.name}
                  onChange={(e) => handleVariantChange(i, "name", e.target.value)}
                  required
                />
                <input
                  type="number"
                  placeholder="Base Price (R)"
                  value={v.price}
                  onChange={(e) => handleVariantChange(i, "price", e.target.value)}
                  min="0"
                  required
                />

                {/* Final Selling Price Display */}
                <div className="variant-markup-display">
                  <label>Final Price ({MARKUP_PERCENT}% markup):</label>
                  <span>R {v.markupPrice}</span>
                </div>

                <input
                  type="number"
                  placeholder="Stock"
                  value={v.stock}
                  onChange={(e) => handleVariantChange(i, "stock", e.target.value)}
                  min="0"
                  required
                />

                <button type="button" onClick={() => removeVariant(i)}>
                  Remove
                </button>
              </div>
            ))}
            <button type="button" className="add-variant-btn" onClick={addVariant}>
              + Add Variation
            </button>
          </div>

          <button type="submit" className="save-btn">
            Save Product
          </button>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default AddProductModal;
