import React, { useState, useEffect } from 'react';
import axios from 'axios';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { usePermission } from '../context/PermissionContext';

// Resolve product image URL: Cloudinary/external URLs pass through; local paths get /images/ prefix
function getImageUrl(imageUrl) {
  if (!imageUrl) return 'https://placehold.co/300x300?text=Product+Image';
  if (imageUrl.startsWith('http')) return imageUrl;
  const filename = imageUrl.replace(/^\/+/, ''); // strip leading slashes
  return `/images/${filename}`;
}

export default function SellerPage() {
  const { user, token } = useAuth();
  const { canCreate, canDelete } = usePermission();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('products');
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [stats, setStats] = useState({ products: 0, revenue: 0, itemsSold: 0 });

  // Add product form
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState({ name: '', price: '', category: '', description: '', features: '' });
  const [image, setImage] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token || (user?.role !== 'SELLER' && user?.role !== 'ADMIN' && user?.role !== 'SUPER_ADMIN')) {
      toast.error('Seller access required');
      navigate('/');
      return;
    }
    fetchData();
  }, [user, token]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [prodRes, salesRes, statsRes] = await Promise.all([
        api.get('/api/seller/products'),
        api.get('/api/seller/sales'),
        api.get('/api/seller/stats'),
      ]);
      setProducts(prodRes.data);
      setSales(salesRes.data);
      setStats(statsRes.data);
    } catch (err) {
      toast.error('Failed to load seller data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!image) return toast.error('Please upload an image');
    const formData = new FormData();
    formData.append('name', form.name);
    formData.append('price', form.price);
    formData.append('category', form.category);
    formData.append('description', form.description);
    formData.append('features', form.features);
    formData.append('image', image);
    try {
      setSubmitting(true);
      await api.post('/api/seller/products', formData);
      toast.success('Product listed!');
      setForm({ name: '', price: '', category: '', description: '', features: '' });
      setImage(null);
      setShowAddForm(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add product');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    try {
      await api.delete(`/api/seller/products/${id}`);
      toast.success('Product removed');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed');
    }
  };

  if (loading) return <div className="p-20 text-center text-gray-400 animate-pulse">Loading Seller Dashboard...</div>;

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto p-4 md:p-8">

        {/* Header */}
        <header className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
              <span className="bg-green-500 text-white px-2 py-0.5 rounded text-sm">🏪</span> SELLER DASHBOARD
            </h1>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">
              Welcome, <span className="text-green-600">{user?.name}</span>
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={fetchData} className="p-2 hover:bg-gray-100 rounded-full">🔄</button>
            <button onClick={() => navigate('/')} className="bg-gray-900 text-white px-5 py-2 rounded-full text-sm font-bold hover:bg-black">← Back to Store</button>
          </div>
        </header>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">My Products</p>
            <p className="text-3xl font-black text-gray-900 mt-1">{stats.products}</p>
          </div>
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Revenue</p>
            <p className="text-3xl font-black text-green-600 mt-1">₹{Number(stats.revenue).toLocaleString('en-IN')}</p>
          </div>
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Items Sold</p>
            <p className="text-3xl font-black text-blue-600 mt-1">{stats.itemsSold}</p>
          </div>
        </div>

        {/* Tabs */}
        <nav className="flex gap-1 bg-white p-1 rounded-xl shadow-sm border border-gray-200 mb-6 w-fit">
          <button onClick={() => setActiveTab('products')} className={`px-5 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === 'products' ? 'bg-green-500 text-white shadow' : 'text-gray-500 hover:bg-gray-50'}`}>
            My Products
          </button>
          <button onClick={() => setActiveTab('sales')} className={`px-5 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === 'sales' ? 'bg-green-500 text-white shadow' : 'text-gray-500 hover:bg-gray-50'}`}>
            Sales & Orders
          </button>
        </nav>

        {/* PRODUCTS TAB */}
        {activeTab === 'products' && (
          <div className="flex flex-col gap-6">
            {/* Add Product Collapsible */}
            {canCreate('Products') && (
              <section className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <button type="button" onClick={() => setShowAddForm(!showAddForm)} className="w-full flex items-center justify-between p-5 hover:bg-gray-50">
                  <h2 className="text-lg font-black flex items-center gap-2"><span>➕</span> LIST NEW PRODUCT</h2>
                  <span className={`text-gray-400 transition-transform duration-300 ${showAddForm ? 'rotate-180' : ''}`}>▼</span>
                </button>
                {showAddForm && (
                  <form onSubmit={handleAddProduct} className="px-5 pb-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 border-t border-gray-100 pt-5">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase">Product Name</label>
                      <input type="text" className="w-full border-2 border-gray-100 p-2.5 rounded-xl text-sm focus:border-green-400 outline-none" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase">Price (₹)</label>
                      <input type="number" className="w-full border-2 border-gray-100 p-2.5 rounded-xl text-sm focus:border-green-400 outline-none" value={form.price} onChange={e => setForm({...form, price: e.target.value})} required />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase">Category</label>
                      <select className="w-full border-2 border-gray-100 p-2.5 rounded-xl text-sm bg-white outline-none" value={form.category} onChange={e => setForm({...form, category: e.target.value})} required>
                        <option value="">Select</option>
                        <option value="Electronics">Electronics</option>
                        <option value="Fashion">Fashion</option>
                        <option value="Home">Home</option>
                        <option value="Beauty">Beauty</option>
                        <option value="Health">Health</option>
                        <option value="Kids">Kids</option>
                        <option value="Lifestyle">Lifestyle</option>
                      </select>
                    </div>
                    <div className="space-y-1 md:col-span-2 lg:col-span-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase">Description</label>
                      <input type="text" className="w-full border-2 border-gray-100 p-2.5 rounded-xl text-sm outline-none" value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Main description" />
                    </div>
                    {/* NEW DYNAMIC FIELD: Features */}
                    <div className="space-y-1 md:col-span-2 lg:col-span-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase">Key Features (Bullet Points)</label>
                      <input type="text" className="w-full border-2 border-gray-100 p-2.5 rounded-xl text-sm outline-none" value={form.features} onChange={e => setForm({...form, features: e.target.value})} placeholder="e.g. 4K HDR, WiFi 6, 2 Year Warranty" />
                    </div>
                    <div className="md:col-span-2 lg:col-span-4 flex items-center gap-4">
                      <div className="flex-1 border-2 border-dashed border-gray-200 p-3 rounded-xl text-center bg-gray-50 relative overflow-hidden cursor-pointer hover:bg-gray-100">
                        <input type="file" className="opacity-0 absolute inset-0 cursor-pointer" onChange={e => setImage(e.target.files[0])} accept="image/*" />
                        <p className="text-[10px] font-bold text-gray-400 uppercase">{image ? `✅ ${image.name}` : '🖼️ Upload Photo'}</p>
                      </div>
                      <button type="submit" disabled={submitting} className="bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-xl font-black text-xs uppercase shadow-lg disabled:opacity-50 whitespace-nowrap">
                        {submitting ? 'Listing...' : 'List Product'}
                      </button>
                    </div>
                  </form>
                )}
              </section>
            )}

            {/* Products Table */}
            <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
              <h2 className="text-lg font-black mb-4 flex items-center gap-2 border-b pb-4 border-gray-100">
                📦 MY LISTINGS <span className="bg-gray-100 px-2 py-0.5 rounded text-[10px] text-gray-500 font-bold ml-2">{products.length}</span>
              </h2>
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] uppercase text-gray-400 font-black tracking-widest border-b">
                    <th className="pb-3">Product</th><th className="pb-3">Category</th><th className="pb-3">Price</th><th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {products.map(p => (
                    <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50 group">
                      <td className="py-3 flex items-center gap-3">
                        <img src={getImageUrl(p.image_url)} className="w-10 h-10 rounded-lg object-contain bg-gray-50 border" />
                        <div>
                          <div className="font-bold text-gray-800">{p.name}</div>
                          <div className="text-[10px] text-gray-400">ID: #{p.id}</div>
                        </div>
                      </td>
                      <td className="py-3"><span className="bg-blue-50 text-blue-600 text-[10px] font-black px-2 py-0.5 rounded">{p.category}</span></td>
                      <td className="py-3 font-black">₹{p.price}</td>
                      <td className="py-3 text-right">
                        {canDelete('Products') && (
                          <button 
                            onClick={() => handleDelete(p.id)} 
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100 active:scale-90"
                            title="Delete product"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {products.length === 0 && <tr><td colSpan="4" className="py-12 text-center text-gray-400 text-xs uppercase font-bold">No products listed yet. Start selling!</td></tr>}
                </tbody>
              </table>
            </section>
          </div>
        )}

        {/* SALES TAB */}
        {activeTab === 'sales' && (
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <h2 className="text-lg font-black mb-6 flex items-center gap-2 border-b pb-4 border-gray-100">
              📊 SALES HISTORY <span className="bg-green-500 text-white text-[10px] px-2 py-0.5 rounded-full font-black ml-2">{sales.length}</span>
            </h2>
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] uppercase text-gray-400 font-black tracking-widest border-b">
                  <th className="pb-3">Product</th><th className="pb-3">Customer</th><th className="pb-3">Qty</th><th className="pb-3">Amount</th><th className="pb-3">Date</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {sales.map((s, i) => (
                  <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 font-bold">{s.product?.name}</td>
                    <td className="py-3 text-gray-500 text-xs">{s.order?.user?.name}</td>
                    <td className="py-3">{s.quantity}</td>
                    <td className="py-3 font-black text-green-600">₹{(parseFloat(s.price) * s.quantity).toLocaleString('en-IN')}</td>
                    <td className="py-3 text-xs text-gray-400">{new Date(s.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
                {sales.length === 0 && <tr><td colSpan="5" className="py-12 text-center text-gray-400 text-xs uppercase font-bold">No sales yet</td></tr>}
              </tbody>
            </table>
          </section>
        )}
      </div>
    </div>
  );
}
