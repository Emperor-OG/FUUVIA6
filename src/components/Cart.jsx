// components/Cart.jsx
import React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import "../styles/Cart.css";

export default function Cart({
  cartItems,
  showCart,
  onCloseCart,
  onRemoveItem,
  onUpdateQuantity,
  storeId: propStoreId, // optional prop
}) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Use storeId from prop first, fallback to URL query
  const storeId = propStoreId || searchParams.get("id");

  if (!showCart) return null;

  // Normalize cart items
  const normalizedItems = cartItems.map((item) => ({
    variant_id: item.variant_id ?? item.id,
    name: item.name,
    variant: item.variant ?? "",
    price: Number(item.price) || 0,
    quantity: Number(item.quantity) || Number(item.qty) || 1,
    image: item.image ?? "",
  }));

  const total = normalizedItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const handleCheckout = () => {
    if (!storeId) return alert("Store ID missing!");
    onCloseCart();
    navigate(`/checkout?id=${storeId}`, {
      state: { cartItems: normalizedItems },
    });
  };

  return (
    <div className="cart-overlay" onClick={onCloseCart}>
      <div className="cart-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="cart-header">
          <h2>Your Cart</h2>
          <i className="bx bx-x cart-close" onClick={onCloseCart}></i>
        </div>

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

        {normalizedItems.length > 0 && (
          <div className="cart-footer">
            <h3>Total: R{total.toFixed(2)}</h3>
            <button className="checkout-btn" onClick={handleCheckout}>
              Checkout
            </button>
          </div>
        )}
      </div>
    </div>
  );
}