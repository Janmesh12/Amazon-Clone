import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { useAuth } from './AuthContext';

const WishlistContext = createContext();

export const useWishlist = () => useContext(WishlistContext);

export function WishlistProvider({ children }) {
  const [wishlistItems, setWishlistItems] = useState([]);
  const [isOpen, setIsOpen]               = useState(false);
  const [loading, setLoading]             = useState(false);
  const { token, user, setIsAuthModalOpen } = useAuth();

  const fetchWishlist = useCallback(async () => {
    if (!token || !user) {
      setWishlistItems([]);
      return;
    }
    try {
      setLoading(true);
      const res = await api.get('/api/wishlist');
      setWishlistItems(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to fetch wishlist', err);
    } finally {
      setLoading(false);
    }
  }, [token, user]);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  const toggleWishlist = async (productId) => {
    if (!token) {
      setIsAuthModalOpen(true);
      return;
    }
    try {
      const res = await api.post('/api/wishlist/toggle', { product_id: productId });
      await fetchWishlist();
      return res.data.action;
    } catch (err) {
      console.error('Failed to toggle wishlist', err);
    }
  };

  const isInWishlist = (productId) => {
    return wishlistItems.some(item => item.product_id === productId);
  };

  return (
    <WishlistContext.Provider value={{ 
      wishlistItems, 
      isOpen, 
      setIsOpen, 
      toggleWishlist, 
      isInWishlist, 
      fetchWishlist, 
      loading 
    }}>
      {children}
    </WishlistContext.Provider>
  );
}
