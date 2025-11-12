// components/ProductModal.jsx
import React, { useState, useEffect, useRef } from "react";
import "../styles/ProductModal.css";

export default function ProductModal({ product, onClose, onAddToCart }) {
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [currentImage, setCurrentImage] = useState(0);
  const [quantity, setQuantity] = useState(1);

  const sliderRef = useRef(null);
  const touchStart = useRef(null);

  // Convert DB structure into usable variant objects
  const formatVariants = (product) => {
    const variants = [];

    // Main variant first
    variants.push({
      id: "main",
      name: product.variant1_name,
      price: product.markup_price,
      stock: product.stock,
      image: product.images?.[0] || null,
    });

    // Sub variants from arrays
    const names = product.variant_names || [];
    const imgs = product.variant_images || [];
    const prices = product.variant_markup_price || [];
    const stocks = product.variants_stock || [];

    for (let i = 0; i < names.length; i++) {
      variants.push({
        id: i,
        name: names[i],
        price: prices[i],
        stock: stocks[i],
        image: imgs[i] || null,
      });
    }

    return variants;
  };

  const variants = formatVariants(product);

  // All images for slider, remove duplicates
  const baseImages = product.images || [];
  const variantImages = variants.map((v) => v.image).filter(Boolean);
  const allImages = [...new Set([...baseImages, ...variantImages])];

  // --- Mobile swipe handling ---
  const handleTouchStart = (e) => (touchStart.current = e.touches[0].clientX);
  const handleTouchEnd = (e) => {
    if (!touchStart.current) return;
    const diff = touchStart.current - e.changedTouches[0].clientX;
    diff > 50 ? nextImage() : diff < -50 && prevImage();
    touchStart.current = null;
  };

  const nextImage = () =>
    setCurrentImage((p) => (p < allImages.length - 1 ? p + 1 : 0));

  const prevImage = () =>
    setCurrentImage((p) => (p > 0 ? p - 1 : allImages.length - 1));

  // Auto-select main variant on open
  useEffect(() => {
    if (!selectedVariant && variants.length > 0) {
      setSelectedVariant(variants[0]);
    }
  }, [variants]);

  // When variant changes → move slider
  useEffect(() => {
    if (selectedVariant?.image) {
      const index = allImages.indexOf(selectedVariant.image);
      if (index !== -1) setCurrentImage(index);
    }
  }, [selectedVariant]);

  // When slider changes → activate correct variant
  useEffect(() => {
    const img = allImages[currentImage];
    const match = variants.find((v) => v.image === img);

    if (match && selectedVariant?.id !== match.id) {
      setSelectedVariant(match);
    }

    // If slider image is NOT a variant but variant isn't main → go to main
    if (!match && variants[0] && selectedVariant?.id !== variants[0].id) {
      setSelectedVariant(variants[0]);
    }
  }, [currentImage]);

  // Add to cart handler
  const handleAdd = () => {
    if (!selectedVariant) return alert("Please choose a variant first");

    onAddToCart({
      product_id: product.id,
      variant_id: selectedVariant.id,
      name: product.name,
      variant: selectedVariant.name,
      price: selectedVariant.price,
      image: selectedVariant.image || baseImages[0],
      quantity,
    });

    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        {/* Header */}
        <div className="modal-header">
          <h2>{product.name}</h2>
          <button className="close-btn" onClick={onClose}>
            <i className="bx bx-x"></i>
          </button>
        </div>

        <div className="modal-content">
          {/* Image Slider */}
          <div
            className="slider"
            ref={sliderRef}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <button className="slide-btn left" onClick={prevImage}>
              <i className="bx bx-chevron-left"></i>
            </button>

            <img src={allImages[currentImage]} alt="" className="slider-img" />

            <button className="slide-btn right" onClick={nextImage}>
              <i className="bx bx-chevron-right"></i>
            </button>
          </div>

          {/* Thumbnails */}
          {allImages.length > 1 && (
            <div className="thumbnail-row">
              {allImages.map((img, i) => (
                <img
                  key={i}
                  src={img}
                  className={`thumbnail ${i === currentImage ? "active" : ""}`}
                  onClick={() => setCurrentImage(i)}
                  alt=""
                />
              ))}
            </div>
          )}

          {/* Variant Selection */}
          <div className="variant-box">
            <h4>Choose a variant:</h4>

            {variants.map((variant) => (
              <label key={variant.id} className="variant-option">
                <input
                  type="radio"
                  name="variant"
                  value={variant.id}
                  checked={selectedVariant?.id === variant.id}
                  onChange={() => setSelectedVariant(variant)}
                />
                <span>
                  {variant.name} - R{variant.price}
                  {variant.stock !== null && ` | Stock: ${variant.stock}`}
                </span>
              </label>
            ))}
          </div>

          {/* Description */}
          <p className="description">{product.description}</p>

          {/* Quantity Selector */}
          <div className="qty-box">
            <button onClick={() => setQuantity((q) => Math.max(1, q - 1))}>
              <i className="bx bx-minus"></i>
            </button>
            <span>{quantity}</span>
            <button onClick={() => setQuantity((q) => q + 1)}>
              <i className="bx bx-plus"></i>
            </button>
          </div>
        </div>

        {/* Add to Cart */}
        <button className="add-btn" onClick={handleAdd}>
          <i className="bx bx-cart"></i> Add {quantity} to Cart
        </button>
      </div>
    </div>
  );
}
