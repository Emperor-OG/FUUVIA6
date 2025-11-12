import React, { useEffect, useState, useRef } from "react";
import "../styles/ProductLibrary.css";

export default function ProductLibrary({ products, onEditProduct }) {
  return (
    <div className="product-library">
      {products.length === 0 ? (
        <p>No products available.</p>
      ) : (
        <div className="product-grid">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onEditProduct={onEditProduct}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ProductCard({ product, onEditProduct }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef(null);

  const mainImages = Array.isArray(product.images)
    ? product.images
    : product.images
    ? [product.images]
    : [];
  const variantImages = Array.isArray(product.variant_images)
    ? product.variant_images
    : product.variant_images
    ? [product.variant_images]
    : [];

  const allImages = [...mainImages, ...variantImages];

  // Auto slide logic
  useEffect(() => {
    if (allImages.length <= 1) return;
    if (isPaused) return;

    intervalRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % allImages.length);
    }, 3000);

    return () => clearInterval(intervalRef.current);
  }, [allImages, isPaused]);

  const basePrice = parseFloat(product.base_price) || 0;
  const markupPrice =
    parseFloat(product.markup_price) ||
    basePrice + basePrice * ((product.markup_percentage || 10) / 100);
  const finalBase = basePrice.toFixed(2);
  const finalMarkup = markupPrice.toFixed(2);

  return (
    <div className="product-card">
      {allImages.length > 0 && (
        <div
          className="image-slideshow"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <img
            src={allImages[currentIndex]}
            alt={`${product.name} - ${currentIndex + 1}`}
            className="slide-image"
          />
          {allImages.length > 1 && (
            <div className="slide-dots">
              {allImages.map((_, i) => (
                <span
                  key={i}
                  className={`dot ${i === currentIndex ? "active" : ""}`}
                  onClick={() => setCurrentIndex(i)}
                ></span>
              ))}
            </div>
          )}
        </div>
      )}

      <h3>{product.name}</h3>
      <p>
        Final Selling Price: <strong>R{finalMarkup}</strong>
      </p>
      <p>
        Seller's asking Price: <strong>R{finalBase}</strong>
      </p>
      <p>
        Availability: <strong>{product.stock ?? "Not specified"}</strong>
      </p>

      {onEditProduct && (
        <button className="edit-product-btn" onClick={() => onEditProduct(product)}>
          Edit
        </button>
      )}
    </div>
  );
}
