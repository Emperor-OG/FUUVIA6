import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import "../styles/AddProducts.css";

export default function EditProductModal({
  product,
  storeId,
  isOpen,
  onClose,
  onProductUpdated,
  setLoading,
}) {
  const [productName, setProductName] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");

  const API_BASE = import.meta.env.VITE_API_URL;

  const [baseVariation, setBaseVariation] = useState({
    name: "",
    price: "",
    markupPrice: "0.00",
    stock: "",
    image: null,
    preview: null,
  });

  const [variants, setVariants] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [newMainFiles, setNewMainFiles] = useState([]);

  useEffect(() => {
    if (!product) return;

    setProductName(product.name || "");
    setCategory(product.category || "");
    setDescription(product.description || "");

    setExistingImages(product.images || []);
    setNewMainFiles([]);

    setBaseVariation({
      name: product.variant1_name || product.name || "",
      price: product.base_price ?? "",
      markupPrice: product.markup_price ?? "0.00",
      stock: product.stock ?? "",
      image: null,
      preview: null,
    });

    const parsedVariants =
      (product.variant_names || []).map((vn, i) => ({
        name: vn ?? "",
        price: product.variant_base_prices?.[i] ?? "",
        markupPrice: product.variant_markup_price?.[i] ?? "",
        stock: product.variants_stock?.[i] ?? "",
        image: null,
        preview: null,
        existingImage: product.variant_images?.[i] ?? "",
      })) || [];

    setVariants(parsedVariants);
  }, [product]);

  const calculateMarkup = (price) => {
    const num = parseFloat(price) || 0;
    return (num + num * 0.1).toFixed(2);
  };

  const handleBaseChange = (field, value) => {
    const updated = { ...baseVariation, [field]: value };
    if (field === "price") updated.markupPrice = calculateMarkup(value);
    setBaseVariation(updated);
  };

  const handleBaseImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setBaseVariation((prev) => ({
      ...prev,
      image: file,
      preview: URL.createObjectURL(file),
    }));
  };

  const handleNewMainFiles = (e) => {
    const files = Array.from(e.target.files || []);
    setNewMainFiles(files);
  };

  const removeExistingImage = (url) => {
    setExistingImages((prev) => prev.filter((u) => u !== url));
  };

  const addVariant = () => {
    setVariants((prev) => [
      ...prev,
      { name: "", price: "", markupPrice: "0.00", stock: "", image: null, preview: null, existingImage: "" },
    ]);
  };

  const removeVariant = (index) => {
    setVariants((prev) => prev.filter((_, i) => i !== index));
  };

  const handleVariantChange = (index, field, value) => {
    setVariants((prev) =>
      prev.map((v, i) => {
        if (i !== index) return v;
        const copy = { ...v, [field]: value };
        if (field === "price") copy.markupPrice = calculateMarkup(value);
        return copy;
      })
    );
  };

  const handleVariantImageChange = (index, file) => {
    setVariants((prev) =>
      prev.map((v, i) =>
        i === index
          ? { ...v, image: file, preview: file ? URL.createObjectURL(file) : null }
          : v
      )
    );
  };

  const removeExistingVariantImage = (index) => {
    setVariants((prev) =>
      prev.map((v, i) => (i === index ? { ...v, existingImage: "" } : v))
    );
  };

  const toPgArrayLiteral = (arr) => {
    if (!Array.isArray(arr) || arr.length === 0) return "{}";
    return `{${arr.map((v) => `"${String(v).replace(/"/g, '\\"')}"`).join(",")}}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!product) return;

    try {
      if (setLoading) setLoading(true);
      const formData = new FormData();

      formData.append("name", productName);
      formData.append("category", category);
      formData.append("description", description);
      formData.append("variant1_name", baseVariation.name || productName);
      formData.append("base_price", baseVariation.price ?? "");
      formData.append("stock", baseVariation.stock ?? "");

      if (baseVariation.image) formData.append("images", baseVariation.image);
      newMainFiles.forEach((f) => formData.append("images", f));

      const deletedImages = (product.images || []).filter(
        (url) => !existingImages.includes(url)
      );
      formData.append("deletedImages", JSON.stringify(deletedImages));

      const variantNames = variants.map((v) => v.name ?? "");
      const variantBasePrices = variants.map((v) => v.price ?? "");
      const variantMarkupPrices = variants.map((v) => v.markupPrice ?? "");
      const variantStocks = variants.map((v) => v.stock ?? "");

      formData.append("variant_names", toPgArrayLiteral(variantNames));
      formData.append("variant_base_prices", toPgArrayLiteral(variantBasePrices));
      formData.append("variant_markup_prices", toPgArrayLiteral(variantMarkupPrices));
      formData.append("variants_stock", toPgArrayLiteral(variantStocks));

      const deletedVariantImages = [];
      variants.forEach((v, i) => {
        if (v.image) formData.append("variant_images", v.image);
        const originalVariantImg = product.variant_images?.[i];
        if (originalVariantImg && !v.existingImage)
          deletedVariantImages.push(originalVariantImg);
      });
      formData.append("deletedVariantImages", JSON.stringify(deletedVariantImages));

      const variantImageNames = variants.map((v, i) => {
        if (v.image && v.image.name) return v.image.name;
        return v.existingImage || "";
      });
      formData.append("variant_images", toPgArrayLiteral(variantImageNames));

      const res = await fetch(
        `${API_BASE}/api/stores/${storeId}/products/${product.id}`,
        { method: "PUT", body: formData }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update product");
      onProductUpdated(data.product);
      onClose();
    } catch (err) {
      console.error("❌ Error updating product:", err);
      alert("Failed to update product");
    } finally {
      if (setLoading) setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!product) return;
    if (!window.confirm("Are you sure you want to delete this product?")) return;

    try {
      if (setLoading) setLoading(true);
      const res = await fetch(
        `${API_BASE}/api/stores/${storeId}/products/${product.id}`,
        { method: "DELETE" }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete product");

      onProductUpdated(null);
      onClose();
    } catch (err) {
      console.error("❌ Error deleting product:", err);
      alert("Failed to delete product");
    } finally {
      if (setLoading) setLoading(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="add-product-modal-overlay">
      <div className="add-product-modal">
        <button className="modal-close-btn" onClick={onClose}>
          &times;
        </button>
        <h2>Edit Product</h2>

        <form onSubmit={handleSubmit}>
          <label>Product Name:</label>
          <input type="text" value={productName} onChange={(e) => setProductName(e.target.value)} required />

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
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />

          <h3>Base Variation</h3>

          <label>Existing Main Images</label>
          <div className="preview-container">
            {existingImages.map((url, idx) => (
              <div key={idx} className="image-preview-wrapper">
                <img src={url} alt={`main-${idx}`} className="image-preview" />
                <button type="button" className="remove-img-btn" onClick={() => removeExistingImage(url)}>
                  &times;
                </button>
              </div>
            ))}
          </div>

          <label>Base Variation Image (replace)</label>
          <input type="file" accept="image/*" onChange={handleBaseImageChange} />
          {baseVariation.preview && <img className="variant-preview" src={baseVariation.preview} alt="base preview" />}

          <label>Variation Name:</label>
          <input type="text" value={baseVariation.name} onChange={(e) => handleBaseChange("name", e.target.value)} />

          <label>Price (R):</label>
          <input type="number" value={baseVariation.price} onChange={(e) => handleBaseChange("price", e.target.value)} />
          <div className="variant-markup-display">
            <label>Final Price (10% markup):</label>
            <span>R {baseVariation.markupPrice}</span>
          </div>

          <label>Stock:</label>
          <input type="number" value={baseVariation.stock} onChange={(e) => handleBaseChange("stock", e.target.value)} />

          <h3>Variants</h3>
          {variants.map((v, i) => (
            <div key={i} className="variant-block">
              <label>Variant Image</label>
              <input type="file" accept="image/*" onChange={(e) => handleVariantImageChange(i, e.target.files[0])} />
              {v.preview && <img src={v.preview} alt={`variant-${i}`} className="variant-preview" />}

              {v.existingImage && (
                <div className="existing-variant-img">
                  <img src={v.existingImage} alt={`existing-variant-${i}`} />
                  <button type="button" onClick={() => removeExistingVariantImage(i)}>&times;</button>
                </div>
              )}

              <input type="text" placeholder="Variant name" value={v.name} onChange={(e) => handleVariantChange(i, "name", e.target.value)} />
              <input type="number" placeholder="Price (R)" value={v.price} onChange={(e) => handleVariantChange(i, "price", e.target.value)} />
              
              <div className="variant-markup-display">
                <label>Final Price (10% markup):</label>
                <span>R {v.markupPrice}</span>
              </div>

              <input type="number" placeholder="Stock" value={v.stock} onChange={(e) => handleVariantChange(i, "stock", e.target.value)} />

              <button type="button" className="remove-variant-btn" onClick={() => removeVariant(i)}>Remove</button>
            </div>
          ))}

          <button type="button" className="add-variant-btn" onClick={addVariant}>+ Add Variant</button>

          <div className="edit-product-buttons">
            <button type="submit">Update Product</button>
            <button type="button" className="delete-prod" onClick={handleDelete}>Delete Product</button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}