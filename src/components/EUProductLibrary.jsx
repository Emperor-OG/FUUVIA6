import React, { useEffect, useState, useRef } from "react";
import "../styles/EUProductLibrary.css";

export default function EUProductLibrary({ products, onProductClick, onAddToCart }) {
  return (
    <div className="eu-product-library">
      {products.length === 0 ? (
        <p className="no-products">No products available at this store.</p>
      ) : (
        <div className="eu-product-grid">
          {products.map((product) => (
            <EUProductCard
              key={product.id}
              product={product}
              onProductClick={onProductClick}
              onAddToCart={onAddToCart}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function EUProductCard({ product, onProductClick, onAddToCart }) {
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

  useEffect(() => {
    if (allImages.length <= 1 || isPaused) return;

    intervalRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % allImages.length);
    }, 3000);

    return () => clearInterval(intervalRef.current);
  }, [allImages, isPaused]);

  const basePrice = parseFloat(product.base_price) || 0;
  const markupPrice =
    parseFloat(product.markup_price) ||
    basePrice + basePrice * ((product.markup_percentage || 10) / 100);

  const finalMarkup = markupPrice.toFixed(2);

  return (
    <div
      className="eu-product-card"
      onClick={() => onProductClick?.(product)}  // ✅ OPEN MODAL
    >
      {allImages.length > 0 && (
        <div
          className="eu-image-slideshow"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <img
            src={allImages[currentIndex]}
            alt={`${product.name} image ${currentIndex + 1}`}
            className="eu-slide-image"
          />

          {allImages.length > 1 && (
            <div className="eu-slide-dots">
              {allImages.map((_, i) => (
                <span
                  key={i}
                  className={`eu-dot ${i === currentIndex ? "active" : ""}`}
                  onClick={(e) => {
                    e.stopPropagation(); // ✅ Don't trigger modal click
                    setCurrentIndex(i);
                  }}
                ></span>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="eu-product-info">
        <h3 className="eu-product-name">{product.name}</h3>
        <p><strong>Price:</strong> R{finalMarkup}</p>
        <p><strong>Stock:</strong> {product.stock ? `${product.stock} left` : "Not specified"}</p>
      </div>

      {/* ✅ Add to Cart button only adds to cart 
      <button
        id="Add-to-cart-btn"
        onClick={(e) => {
          e.stopPropagation(); // ✅ Prevent opening modal
          onAddToCart?.(product);
        }}
        title="Add to cart"
      >
        <i className="bx bx-cart-add"></i>
      </button> */}
    </div>
  );
}
