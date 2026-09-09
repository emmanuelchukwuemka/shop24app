import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CartContext = createContext();
const CART_STORAGE_KEY = 'shop24_cart_items';

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const [promoCode, setPromoCode] = useState(null);
  const [promoLabel, setPromoLabel] = useState('');
  const [promoDiscount, setPromoDiscount] = useState(0);
  const hasLoadedFromStorage = useRef(false);

  // Restore the cart on app start so it survives a restart, same as the login session does.
  useEffect(() => {
    AsyncStorage.getItem(CART_STORAGE_KEY)
      .then((raw) => {
        if (raw) setCartItems(JSON.parse(raw));
      })
      .catch(() => {})
      .finally(() => { hasLoadedFromStorage.current = true; });
  }, []);

  // Persist on every change, but not before the initial load — otherwise the empty
  // starting state would overwrite whatever was saved from the previous session.
  useEffect(() => {
    if (!hasLoadedFromStorage.current) return;
    AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems)).catch(() => {});
  }, [cartItems]);

  // Two cart lines are "the same" only if both the product and the selected variant match —
  // otherwise picking a different size/color would silently merge into the wrong line.
  const sameLine = (item, productId, variantId) =>
    item.id === productId && (item.variant_id || null) === (variantId || null);

  const addToCart = (product, quantity = 1) => {
    const variantId = product.variant_id || null;
    setCartItems(prevItems => {
      const existing = prevItems.find(item => sameLine(item, product.id, variantId));
      if (existing) {
        return prevItems.map(item =>
          sameLine(item, product.id, variantId)
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prevItems, { ...product, variant_id: variantId, quantity }];
    });
  };

  const removeFromCart = (productId, variantId = null) => {
    setCartItems(prevItems => prevItems.filter(item => !sameLine(item, productId, variantId)));
  };

  const updateQuantity = (productId, quantity, variantId = null) => {
    if (quantity <= 0) {
      removeFromCart(productId, variantId);
      return;
    }
    setCartItems(prevItems =>
      prevItems.map(item =>
        sameLine(item, productId, variantId) ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setCartItems([]);
    clearPromo();
  };

  const applyPromo = (code, discount, label) => {
    setPromoCode(code);
    setPromoDiscount(discount);
    setPromoLabel(label);
  };

  const clearPromo = () => {
    setPromoCode(null);
    setPromoDiscount(0);
    setPromoLabel('');
  };

  // Laravel serializes decimal-cast fields (price, discount_rate) as STRINGS in
  // JSON, not numbers — confirmed directly against the live API. `*` and `/`
  // coerce strings to numbers automatically, so the discounted branch below has
  // always produced a real number, but the plain `return item.price` branch
  // (no discount) was handing back the raw string untouched. `.toLocaleString()`
  // on a string just returns the string as-is (no comma grouping, no rounding),
  // so every non-discounted price/variant rendered malformed — and if two
  // variants happened to differ only in ways masked by that, it could look like
  // the price "wasn't updating" when picking a different one.
  const getDiscountedPrice = (item) => {
    const price = Number(item.price) || 0;
    const discountRate = Number(item.discount_rate) || 0;
    if (discountRate > 0) {
      return price * (1 - discountRate / 100);
    }
    return price;
  };

  const cartTotal = cartItems.reduce(
    (sum, item) => sum + getDiscountedPrice(item) * item.quantity,
    0
  );

  const cartShipping = cartItems.reduce(
    (sum, item) => sum + (item.shipping_cost || 0) * item.quantity,
    0
  );

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  // What the checkout endpoints need — the backend recomputes prices itself from these ids.
  const getCheckoutItems = () =>
    cartItems.map(item => ({ product_id: item.id, variant_id: item.variant_id || null, quantity: item.quantity }));

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartTotal,
        cartShipping,
        cartCount,
        getDiscountedPrice,
        getCheckoutItems,
        promoCode,
        promoLabel,
        promoDiscount,
        applyPromo,
        clearPromo,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
