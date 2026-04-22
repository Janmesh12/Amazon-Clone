 import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const [isOpen, setIsOpen]       = useState(false);
  const { token, user, setIsAuthModalOpen } = useAuth();

  // Fetch cart from DB
  const fetchCart = useCallback(async () => {
    if (!token || !user) {
      setCartItems([]);
      return;
    }
    try {
      const res = await api.get('/api/cart');
      setCartItems(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to fetch cart:', err);
    }
  }, [token, user]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  // Add to cart
  const addToCart = async (productId) => {
    if (!token) return setIsAuthModalOpen(true);
    try {
      await api.post('/api/cart', { product_id: productId });
      await fetchCart();
      setIsOpen(true);
    } catch (err) {
      console.error('Failed to add to cart:', err);
    }
  };

  // Update quantity
  const updateQty = async (productId, quantity) => {
    if (!token) return setIsAuthModalOpen(true);
    try {
      await api.put(`/api/cart/${productId}`, { quantity });
      await fetchCart();
    } catch (err) {
      console.error('Failed to update qty:', err);
    }
  };

  // Remove item
  const removeItem = async (productId) => {
    if (!token) return setIsAuthModalOpen(true);
    try {
      await api.delete(`/api/cart/${productId}`);
      await fetchCart();
    } catch (err) {
      console.error('Failed to remove item:', err);
    }
  };

  // Clear entire cart
  const clearCart = async () => {
    if (!token) return setIsAuthModalOpen(true);
    try {
      await api.delete(`/api/cart`);
      setCartItems([]);
    } catch (err) {
      console.error('Failed to clear cart:', err);
    }
  };

  const totalItems = cartItems.reduce((s, i) => s + i.quantity, 0);
  const totalPrice = cartItems.reduce(
    (s, i) => s + parseFloat(i.product?.price || 0) * i.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        cartItems,
        isOpen,
        setIsOpen,
        addToCart,
        updateQty,
        removeItem,
        clearCart,
        totalItems,
        totalPrice,
        fetchCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
