import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { useAuth } from './AuthContext';

const WishlistContext = createContext();

export function WishlistProvider({ children }) {
  const { user } = useAuth();
  const [wishlistItems, setWishlistItems] = useState([]);

  const loadWishlist = useCallback(async () => {
    if (!user) {
      setWishlistItems([]);
      return;
    }
    try {
      const items = await api.getWishlist();
      setWishlistItems(items);
    } catch {
      // Leave whatever was previously loaded rather than clearing on a transient network error.
    }
  }, [user]);

  useEffect(() => {
    loadWishlist();
  }, [loadWishlist]);

  const isWishlisted = (productId) => wishlistItems.some((item) => item.id === productId);

  const toggleWishlist = async (product) => {
    const wasWishlisted = isWishlisted(product.id);
    setWishlistItems((prev) =>
      wasWishlisted ? prev.filter((item) => item.id !== product.id) : [product, ...prev]
    );
    try {
      await api.toggleWishlist(product.id);
    } catch (e) {
      // Roll back on failure
      setWishlistItems((prev) =>
        wasWishlisted ? [product, ...prev] : prev.filter((item) => item.id !== product.id)
      );
      throw e;
    }
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlistItems,
        wishlistCount: wishlistItems.length,
        isWishlisted,
        toggleWishlist,
        loadWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  return useContext(WishlistContext);
}
