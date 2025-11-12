// components/Cart.jsx
import React from "react";
import "../styles/Cart.css";

export default function Cart({
  cartItems,
  showCart,
  onCloseCart,
  onRemoveItem,
  onUpdateQuantity,
}) {
  if (!showCart) return null;

  // Normalize cart items: ensure numbers and proper ids
  const normalizedItems = cartItems.map((item) => ({
    variant_id: item.variant_id ?? item.id,
    name: item.name,
    variant: item.variant ?? "",
    price: Number(item.price) || 0,
    quantity: Number(item.quantity) || Number(item.qty) || 1,
    image: item.image ?? "",
  }));

  // Total price
  const total = normalizedItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return (
    <div className="cart-overlay" onClick={onCloseCart}>
      <div className="cart-drawer" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="cart-header">
          <h2>Your Cart</h2>
          <i className="bx bx-x cart-close" onClick={onCloseCart}></i>
        </div>

        {/* Items */}
        <div className="cart-items">
          {normalizedItems.length === 0 ? (
            <p className="empty-cart-text">Your cart is empty</p>
          ) : (
            normalizedItems.map((item) => (
              <div className="cart-item" key={item.variant_id}>
                <img src={item.image} alt={item.name} className="cart-img" />
                <div className="cart-item-info">
                  <h4>{item.name}</h4>
                  {item.variant && <p>Variant: {item.variant}</p>}
                  <p>R{item.price.toFixed(2)}</p>

                  <div className="qty-controls">
                    <button
                      className="qty-btn"
                      onClick={() =>
                        onUpdateQuantity(item.variant_id, item.quantity - 1)
                      }
                    >
                      −
                    </button>
                    <span className="qty-text">{item.quantity}</span>
                    <button
                      className="qty-btn"
                      onClick={() =>
                        onUpdateQuantity(item.variant_id, item.quantity + 1)
                      }
                    >
                      +
                    </button>
                  </div>
                </div>

                <i
                  className="bx bx-trash trash-btn"
                  onClick={() => onRemoveItem(item.variant_id)}
                ></i>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {normalizedItems.length > 0 && (
          <div className="cart-footer">
            <h3>Total: R{total.toFixed(2)}</h3>
            <button className="checkout-btn">Checkout</button>
          </div>
        )}
      </div>
    </div>
  );
}
