import { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import './index.css';
import Navbar       from './components/Navbar';
import Hero         from './components/Hero';
import ProductGrid  from './components/ProductGrid';
import Footer       from './components/Footer';
import CartSidebar  from './components/CartSidebar';
import OrdersModal  from './modals/OrdersModal';
import WishlistModal from './modals/WishlistModal';
import { useUI }    from './context/UIContext';
import ProductDetailsModal from './modals/ProductDetailsModal'; 
import AuthModal from './modals/AuthModal';
import ProfilePage from './pages/ProfilePage';
import AdminPage from './pages/AdminPage';
import SuperAdminPage from './pages/SuperAdminPage';
import SupportPage from './pages/SupportPage';
import SellerPage from './pages/SellerPage';
import RoleManagement from './pages/RoleManagement';
import RoleEdit from './pages/RoleEdit';
import { useAuth } from './context/AuthContext';

// ── PROTECTED ROUTE GATE ────────
const ProtectedRoute = ({ isAllowed, children }) => {
  if (!isAllowed) return <div className="min-h-screen flex items-center justify-center font-black text-xl text-gray-300 uppercase tracking-widest bg-white">Unauthorized Access</div>;
  return children;
};

export default function App() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const { searchQuery, selectedCategory } = useUI();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    let url = '/api/products?';
    if (searchQuery.trim()) {
      url += `search=${encodeURIComponent(searchQuery)}&`;
    }
    if (selectedCategory !== 'All') {
      url += `category=${encodeURIComponent(selectedCategory)}&`;
    }

    fetch(url)
      .then((r) => { if (!r.ok) throw new Error('Failed to fetch products'); return r.json(); })
      .then((data) => { setProducts(data); setLoading(false); })
      .catch((err) => { setError(err.message); setLoading(false); });
  }, [searchQuery, selectedCategory]); 

  if (authLoading) return <div className="min-h-screen bg-amazon-gray-bg flex items-center justify-center font-black text-[10px] uppercase tracking-widest text-amazon-orange">Booting Amazon Engine...</div>;

  return (
    <div className="bg-amazon-gray-bg min-h-screen">
      <Navbar />
      
      <Routes>
        <Route path="/" element={
          <>
            <Hero />
            <main className="relative z-20 mt-0 md:mt-[-100px] px-4 pb-12 overflow-hidden">
               {/* Floating Info Banner (Amazon Style) - Always visible */}
              <div className="w-full max-w-[1430px] mx-auto bg-white p-3 md:p-4 text-center text-[12px] md:text-[13.5px] shadow-sm rounded-sm mb-6 md:mb-12 border border-gray-100 block">
                You are on <strong className="font-bold">amazon.in</strong>. You can also shop on Amazon.com for millions of products with fast local delivery. 
                <a href="#" className="text-amazon-link ml-1 hover:underline font-medium">Click here to go to amazon.com</a>
              </div>
              <ProductGrid products={products} loading={loading} error={error} />
            </main>
          </>
        } />
        <Route path="/profile" element={<ProfilePage />} />
        
        {/* DYNAMICALLY PROTECTED ADMIN ROUTES */}
        <Route path="/admin" element={
          <ProtectedRoute isAllowed={!!user && (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' || !!user.roleId)}>
            <AdminPage />
          </ProtectedRoute>
        } />
        <Route path="/super-admin" element={
          <ProtectedRoute isAllowed={!!user && (user.role === 'SUPER_ADMIN' || !!user.roleId)}>
            <SuperAdminPage />
          </ProtectedRoute>
        } />
        <Route path="/seller" element={
          <ProtectedRoute isAllowed={!!user && (user.role === 'SELLER' || !!user.roleId)}>
            <SellerPage />
          </ProtectedRoute>
        } />
        <Route path="/support" element={
          <ProtectedRoute isAllowed={!!user && (!!user.roleId || user.role === 'ADMIN' || user.role === 'SUPER_ADMIN')}>
            <SupportPage />
          </ProtectedRoute>
        } />

        {/* ── ROLE MANAGEMENT ROUTES ── */}
        <Route path="/roles" element={
          <ProtectedRoute isAllowed={!!user && (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN')}>
            <RoleManagement />
          </ProtectedRoute>
        } />
        <Route path="/roles/:roleId/edit" element={
          <ProtectedRoute isAllowed={!!user && (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN')}>
            <RoleEdit />
          </ProtectedRoute>
        } />
      </Routes>

      <Footer />
      <CartSidebar />
      <OrdersModal />
      <WishlistModal />
      <ProductDetailsModal />
      <AuthModal />
    </div>
  );
}
