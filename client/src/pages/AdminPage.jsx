import React, { useState, useEffect } from 'react';
import axios from 'axios';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { usePermission } from '../context/PermissionContext';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const ROLE_LEVELS = { 'USER': 1, 'SELLER': 2, 'ADMIN': 3, 'SUPER_ADMIN': 4 };
const ROLE_COLORS = {
  'SUPER_ADMIN': 'bg-red-50 text-red-600 ring-red-100',
  'ADMIN': 'bg-blue-50 text-blue-600 ring-blue-100',
  'SELLER': 'bg-green-50 text-green-600 ring-green-100',
  'USER': 'bg-gray-50 text-gray-600 ring-gray-100',
};

const resolveImg = (url) => url?.startsWith('http') ? url : `http://localhost:5000/images${url}`;

export default function AdminPage() {
  const { user, token } = useAuth();
  const { hasPermission } = usePermission();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ users: 0, orders: 0, products: 0, sellers: 0, revenue: 0 });
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [roles, setRoles] = useState([]);

  const myLevel = ROLE_LEVELS[user?.role] || 0;
  const isStaff = !!user?.roleId;

  useEffect(() => {
    // Access is granted if you are a hard-coded ADMIN/SUPER_ADMIN OR have a dynamic staff role (roleId)
    if (!token || (myLevel < 3 && !isStaff)) {
      toast.error('Admin access required');
      navigate('/');
      return;
    }
    // Redirect SUPER_ADMIN to their dedicated panel
    if (myLevel === 4) {
      navigate('/super-admin');
      return;
    }
    fetchAll();
  }, [user, token]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [statsR, usersR, ordersR, productsR, sellersR] = await Promise.all([
        api.get('/api/admin/stats').catch((err) => {
          console.error('Stats error:', err.response?.data || err.message);
          return { data: {} };
        }),
        api.get('/api/admin/users').catch((err) => {
          console.error('Users error:', err.response?.data || err.message);
          return { data: { users: [], roles: [] } };
        }),
        api.get('/api/admin/orders').catch((err) => {
          console.error('Orders error:', err.response?.data || err.message);
          return { data: [] };
        }),
        api.get('/api/admin/products').catch((err) => {
          console.error('Products error:', err.response?.data || err.message);
          return { data: [] };
        }),
        api.get('/api/admin/sellers').catch((err) => {
          console.error('Sellers error:', err.response?.data || err.message);
          return { data: [] };
        }),
      ]);
      setStats(statsR.data);
      setUsers(usersR.data.users || []);
      setRoles(usersR.data.roles || []);
      setOrders(ordersR.data);
      setProducts(productsR.data);
      setSellers(sellersR.data);
    } catch { }
    finally { setLoading(false); }
  };

  const handleRoleChange = async (id, newRole) => {
    try {
      await api.patch(`/api/admin/users/${id}/role`, { role: newRole });
      toast.success('Role updated!');
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed');
    }
  };

  const handleBanUser = async (id) => {
    // Ban feature moved to Super Admin Panel
    toast.error('Only Super Admin can ban users');
  };

  const handleDeleteProduct = async (id, name) => {
    if (!window.confirm(`Delete "${name}" permanently?`)) return;
    try {
      await api.delete(`/api/products/${id}`);
      toast.success('Product deleted successfully');
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete product');
    }
  };

  if (loading && !stats.users) return <div className="p-20 text-center text-gray-400 animate-pulse">Loading Admin Panel...</div>;

  return (
    <div className="bg-gray-100 min-h-screen">
      <div className="max-w-7xl mx-auto p-4 md:p-8">

        {/* Header */}
        <header className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-black flex items-center gap-2">
              <span className="bg-amazon-orange text-white px-2 py-0.5 rounded text-sm">AMZ</span> ADMIN PANEL
            </h1>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">
              {user?.role?.replace('_', ' ')} • {user?.name}
            </p>
          </div>
          <div className="flex gap-2">
            {hasPermission('ContactManagement', 'view') && (
              <button onClick={() => navigate('/support')} className="bg-amazon-orange text-white px-5 py-2 rounded-full text-[10px] font-black uppercase shadow-lg shadow-amazon-orange/20 mr-2">🎧 Support Hub</button>
            )}
            <button onClick={fetchAll} className="p-2 hover:bg-gray-100 rounded-full">🔄</button>
            <button onClick={() => navigate('/profile')} className="bg-gray-900 text-white px-5 py-2 rounded-full text-sm font-bold hover:bg-black">← Back to Dashboard</button>
          </div>
        </header>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          {[
            { label: 'Users', val: stats.users, color: 'text-gray-900', mod: 'Users' },
            { label: 'Sellers', val: stats.sellers, color: 'text-green-600', mod: 'Users' },
            { label: 'Products', val: stats.products, color: 'text-blue-600', mod: 'Products' },
            { label: 'Orders', val: stats.orders, color: 'text-orange-600', mod: 'Orders' },
            { label: 'Revenue', val: `₹${Number(stats.revenue).toLocaleString('en-IN')}`, color: 'text-emerald-600', mod: 'Sales' },
          ].map(s => {
            if (s.mod && !hasPermission(s.mod, 'view')) return null;
            return (
              <div key={s.label} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{s.label}</p>
                <p className={`text-2xl font-black mt-1 ${s.color}`}>{s.val}</p>
              </div>
            );
          })}
        </div>

        {/* Tabs */}
        <nav className="flex gap-1 bg-white p-1 rounded-xl shadow-sm border border-gray-200 mb-6 w-fit overflow-x-auto">
          {['dashboard', 'users', 'orders', 'products', 'sellers'].map(tab => {
            // Permission check for each tab
            const moduleMap = { users: 'Users', orders: 'Orders', products: 'Products', sellers: 'Users' }; // Sellers are often under Users or Products
            if (tab !== 'dashboard' && moduleMap[tab] && !hasPermission(moduleMap[tab], 'view')) return null;

            return (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-5 py-2 rounded-lg font-bold text-sm capitalize transition-all ${activeTab === tab ? 'bg-amazon-orange text-white shadow' : 'text-gray-500 hover:bg-gray-50'}`}>
                {tab}
              </button>
            );
          })}
        </nav>

        {/* DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 text-center">
            <h2 className="text-xl font-black mb-2">Welcome back, {user?.name}! 👋</h2>
            <p className="text-gray-400 text-sm">Use the tabs above to manage the platform. You have <strong className="text-amazon-orange">{user?.role?.replace('_', ' ')}</strong> access.</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 text-left">
              <div className="p-4 bg-gray-50 rounded-xl"><p className="text-[10px] text-gray-400 font-black uppercase">Recent Users</p><p className="font-black text-lg mt-1">{users.slice(0, 3).map(u => u.name).join(', ') || 'None'}</p></div>
              <div className="p-4 bg-gray-50 rounded-xl"><p className="text-[10px] text-gray-400 font-black uppercase">Latest Order</p><p className="font-black text-lg mt-1">{orders[0] ? `#${orders[0].id} - ₹${parseFloat(orders[0].total).toLocaleString()}` : 'None'}</p></div>
              <div className="p-4 bg-gray-50 rounded-xl"><p className="text-[10px] text-gray-400 font-black uppercase">Active Sellers</p><p className="font-black text-lg mt-1">{stats.sellers}</p></div>
              <div className="p-4 bg-gray-50 rounded-xl"><p className="text-[10px] text-gray-400 font-black uppercase">Product Catalog</p><p className="font-black text-lg mt-1">{stats.products} items</p></div>
            </div>
          </div>
        )}

        {/* USERS TAB */}
        {activeTab === 'users' && (
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <h2 className="text-lg font-black mb-6 border-b pb-4">👥 ALL USERS <span className="bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded-full ml-2">{users.length}</span></h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead><tr className="text-[10px] uppercase text-gray-400 font-black tracking-widest border-b">
                  <th className="pb-3">User</th><th className="pb-3">Email</th><th className="pb-3">Role</th><th className="pb-3">Change Role</th>{myLevel >= 4 && <th className="pb-3 text-right">Ban</th>}
                </tr></thead>
                <tbody className="text-sm">
                  {users.map(u => (
                    <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center font-black text-gray-500 text-xs">{u.name[0]}</div>
                          <div><div className="font-bold">{u.name}</div><div className="text-[10px] text-gray-400">{new Date(u.createdAt).toLocaleDateString()}</div></div>
                        </div>
                      </td>
                      <td className="py-3 text-xs text-gray-500">{u.email}</td>
                      <td className="py-3"><span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase ring-1 ${ROLE_COLORS[u.role]}`}>{u.role.replace('_', ' ')}</span></td>
                      <td className="py-3">
                        {hasPermission('Users', 'update') && myLevel > ROLE_LEVELS[u.role] && u.id !== user?.id ? (
                          <select className="bg-gray-100 text-[10px] font-black uppercase px-2 py-1.5 rounded-lg outline-none" value={u.role} onChange={e => handleRoleChange(u.id, e.target.value)}>
                            {roles.filter(r => ROLE_LEVELS[r] < myLevel).map(r => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
                          </select>
                        ) : <span className="text-[10px] text-gray-300 font-bold italic">{u.id === user?.id ? 'YOU' : 'READ ONLY'}</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* ORDERS TAB */}
        {activeTab === 'orders' && (
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <h2 className="text-lg font-black mb-6 border-b pb-4">📦 ALL ORDERS <span className="bg-orange-500 text-white text-[10px] px-2 py-0.5 rounded-full ml-2">{orders.length}</span></h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead><tr className="text-[10px] uppercase text-gray-400 font-black tracking-widest border-b">
                  <th className="pb-3">Order</th><th className="pb-3">Customer</th><th className="pb-3">Total</th><th className="pb-3">Items</th><th className="pb-3">Status</th><th className="pb-3 text-right">Date</th>
                </tr></thead>
                <tbody className="text-sm">
                  {orders.map(o => (
                    <tr key={o.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-3 font-black text-xs">#ORD-{o.id}</td>
                      <td className="py-3"><div className="font-bold">{o.user?.name}</div><div className="text-[10px] text-gray-400">{o.user?.email}</div></td>
                      <td className="py-3 font-black text-green-700">₹{parseFloat(o.total).toLocaleString('en-IN')}</td>
                      <td className="py-3 text-xs">{o.items?.length} items</td>
                      <td className="py-3"><span className="bg-green-50 text-green-600 text-[10px] font-black px-3 py-1 rounded-full ring-1 ring-green-100">{o.status}</span></td>
                      <td className="py-3 text-right text-xs text-gray-400">{new Date(o.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                  {orders.length === 0 && <tr><td colSpan="6" className="py-12 text-center text-gray-400 text-xs uppercase font-bold">No orders yet</td></tr>}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* PRODUCTS TAB */}
        {activeTab === 'products' && (
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <h2 className="text-lg font-black mb-6 border-b pb-4">🛍️ ALL PRODUCTS <span className="bg-blue-500 text-white text-[10px] px-2 py-0.5 rounded-full ml-2">{products.length}</span></h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead><tr className="text-[10px] uppercase text-gray-400 font-black tracking-widest border-b">
                  <th className="pb-3">Product</th><th className="pb-3">Category</th><th className="pb-3">Price</th><th className="pb-3">Seller</th><th className="pb-3 text-right">Actions</th>
                </tr></thead>
                <tbody className="text-sm">
                  {products.map(p => (
                    <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50 group">
                      <td className="py-3 flex items-center gap-3">
                        <img src={resolveImg(p.image_url)} className="w-10 h-10 rounded-lg object-contain bg-gray-50 border" alt="" />
                        <div><div className="font-bold">{p.name}</div><div className="text-[10px] text-gray-400">#{p.id}</div></div>
                      </td>
                      <td className="py-3"><span className="bg-blue-50 text-blue-600 text-[10px] font-black px-2 py-0.5 rounded">{p.category}</span></td>
                      <td className="py-3 font-black">₹{p.price}</td>
                      <td className="py-3 text-xs text-gray-500">{p.seller?.name || 'System'}</td>
                      <td className="py-3 text-right">
                        {hasPermission('Products', 'delete') ? (
                          <button onClick={() => handleDeleteProduct(p.id, p.name)} className="bg-red-50 text-red-600 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-all text-xs font-bold ring-1 ring-red-200 active:scale-95">🗑️ Delete</button>
                        ) : (
                          <span className="text-[10px] text-gray-400 font-black uppercase bg-gray-50 px-3 py-1.5 rounded-lg">Read Only</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* SELLERS TAB */}
        {activeTab === 'sellers' && (
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <h2 className="text-lg font-black mb-6 border-b pb-4">🏪 ALL SELLERS <span className="bg-green-500 text-white text-[10px] px-2 py-0.5 rounded-full ml-2">{sellers.length}</span></h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead><tr className="text-[10px] uppercase text-gray-400 font-black tracking-widest border-b">
                  <th className="pb-3">Seller</th><th className="pb-3">Email</th><th className="pb-3">Products</th><th className="pb-3">Joined</th>
                </tr></thead>
                <tbody className="text-sm">
                  {sellers.map(s => (
                    <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-3 font-bold">{s.name}</td>
                      <td className="py-3 text-xs text-gray-500">{s.email}</td>
                      <td className="py-3"><span className="bg-green-50 text-green-600 font-black text-xs px-2 py-0.5 rounded">{s.productCount} listed</span></td>
                      <td className="py-3 text-xs text-gray-400">{new Date(s.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                  {sellers.length === 0 && <tr><td colSpan="4" className="py-12 text-center text-gray-400 text-xs uppercase font-bold">No sellers registered</td></tr>}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
