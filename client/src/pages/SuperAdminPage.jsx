import React, { useState, useEffect } from 'react';
import axios from 'axios';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const ROLE_LEVELS = { 'USER': 1, 'SELLER': 2, 'ADMIN': 3, 'SUPER_ADMIN': 4 };
const ROLE_COLORS = {
  'SUPER_ADMIN': 'bg-red-50 text-red-600 ring-red-100',
  'ADMIN': 'bg-blue-50 text-blue-600 ring-blue-100',
  'SELLER': 'bg-green-50 text-green-600 ring-green-100',
  'USER': 'bg-gray-50 text-gray-600 ring-gray-100',
};

export default function SuperAdminPage() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [stats, setStats] = useState({ users: 0, sellers: 0, products: 0, orders: 0, revenue: 0 });
  const [dynamicRoles, setDynamicRoles] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [ticketResponses, setTicketResponses] = useState({});

  const myLevel = ROLE_LEVELS[user?.role] || 0;

  useEffect(() => {
    if (!token || myLevel < 4) {
      toast.error('Super Admin access required');
      navigate('/');
      return;
    }
    fetchAll();
  }, [user, token]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [statsR, usersR, ordersR, productsR, sellersR, auditLogsR, ticketsR] = await Promise.all([
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
        api.get('/api/admin/audit-logs').catch(() => ({ data: [] })),
        api.get('/api/admin/support').catch(() => ({ data: [] })),
      ]);
      setStats(statsR.data);
      setUsers(usersR.data.users || []);
      setRoles(usersR.data.roles || []);
      setDynamicRoles(usersR.data.dynamicRoles || []);
      setOrders(ordersR.data);
      setProducts(productsR.data);
      setSellers(sellersR.data);
      setAuditLogs(auditLogsR?.data || []);
      setTickets(ticketsR?.data || []);
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

  const handleDynamicRoleChange = async (id, roleId) => {
    try {
      await api.patch(`/api/admin/users/${id}/role`, {
        roleId: roleId ? Number(roleId) : null
      });
      toast.success('Dynamic role updated!');
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed');
    }
  };

  const handleBanUser = async (id) => {
    if (!window.confirm('Ban and delete this user permanently?')) return;
    try {
      await api.delete(`/api/admin/users/${id}`);
      toast.success('User banned');
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed');
    }
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

  if (loading && !stats.users) return <div className="p-20 text-center text-gray-400 animate-pulse">Loading Super Admin Panel...</div>;

  return (
    <div className="bg-gray-100 min-h-screen">
      <div className="max-w-7xl mx-auto p-4 md:p-8">

        {/* Header */}
        <header className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-black flex items-center gap-2">
              <span className="bg-red-600 text-white px-2 py-0.5 rounded text-sm"> SUPER ADMIN PANEL </span> 
            </h1>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">
              {user?.role?.replace('_', ' ')} • {user?.name}
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={fetchAll} className="p-2 hover:bg-gray-100 rounded-full">🔄</button>
            <button onClick={() => navigate('/')} className="bg-gray-900 text-white px-5 py-2 rounded-full text-sm font-bold hover:bg-black">← Store</button>
          </div>
        </header>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Users', val: stats.users, color: 'text-gray-900' },
            { label: 'Sellers', val: stats.sellers, color: 'text-green-600' },
            { label: 'Products', val: stats.products, color: 'text-blue-600' },
            { label: 'Orders', val: stats.orders, color: 'text-orange-600' },
          ].map(s => (
            <div key={s.label} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{s.label}</p>
              <p className={`text-2xl font-black mt-1 ${s.color}`}>{s.val}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <nav className="flex gap-1 bg-white p-1 rounded-xl shadow-sm border border-gray-200 mb-6 w-fit overflow-x-auto">
        {['dashboard', 'users', 'orders', 'products', 'sellers', 'support', 'audit'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-lg font-bold text-sm capitalize transition-all ${
                activeTab === tab ? 'bg-amazon-orange text-white shadow' : 'text-gray-500 hover:bg-gray-50'
              }`}>
              {tab === 'support' ? '🎧 Support' : tab === 'audit' ? '📋 Audit' : tab}
            </button>
          ))}
          <button
            onClick={() => navigate('/roles')}
            className="px-5 py-2 rounded-lg font-bold text-sm capitalize transition-all text-purple-600 hover:bg-purple-50 border border-purple-200"
          >
            🔐 Roles
          </button>
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
            <h2 className="text-lg font-black mb-6 border-b pb-4">👥 ALL USERS <span className="bg-red-600 text-white text-[10px] px-2 py-0.5 rounded-full ml-2">{users.length}</span></h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead><tr className="text-[10px] uppercase text-gray-400 font-black tracking-widest border-b">
                  <th className="pb-3">User</th><th className="pb-3">Email</th><th className="pb-3">Base Role</th><th className="pb-3">Dynamic Role</th><th className="pb-3">Change Base</th><th className="pb-3 text-right">Ban</th>
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
                        {u.dynamicRole ? (
                          <span className="bg-purple-50 text-purple-600 ring-purple-100 text-[10px] font-black px-2 py-1 rounded-full ring-1">
                            🔐 {u.dynamicRole.name}
                          </span>
                        ) : <span className="text-[10px] text-gray-300">None</span>}
                      </td>
                      <td className="py-3">
                        {u.id !== user?.id ? (
                          <div className="flex flex-col gap-1">
                            <select className="bg-gray-100 text-[10px] font-black uppercase px-2 py-1.5 rounded-lg outline-none" value={u.role} onChange={e => handleRoleChange(u.id, e.target.value)}>
                              {roles.filter(r => r !== 'SUPER_ADMIN').map(r => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
                            </select>
                            <select className="bg-purple-50 text-[10px] font-black px-2 py-1.5 rounded-lg outline-none text-purple-700" value={u.dynamicRole?.id || ''} onChange={e => handleDynamicRoleChange(u.id, e.target.value)}>
                              <option value="">No Dynamic Role</option>
                              {dynamicRoles.map(dr => <option key={dr.id} value={dr.id}>{dr.name}</option>)}
                            </select>
                          </div>
                        ) : <span className="text-[10px] text-gray-300 font-bold italic">YOUR ACCOUNT</span>}
                      </td>
                      <td className="py-3 text-right">
                        {u.role !== 'SUPER_ADMIN' && u.id !== user?.id && (
                          <button onClick={() => handleBanUser(u.id)} className="bg-red-50 text-red-500 hover:bg-red-500 hover:text-white px-3 py-1 rounded-lg text-[10px] font-black">BAN</button>
                        )}
                        {u.role === 'SUPER_ADMIN' && u.id !== user?.id && (
                          <span className="text-[10px] text-gray-400 font-bold">Protected</span>
                        )}
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
                  <th className="pb-3">Product</th><th className="pb-3">Category</th><th className="pb-3">Price</th><th className="pb-3">Seller</th><th className="pb-3 text-center">Action</th>
                </tr></thead>
                <tbody className="text-sm">
                  {products.map(p => (
                    <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-3 flex items-center gap-3">
                        <img 
                          src={p.image_url} 
                          alt={p.name}
                          className="w-10 h-10 rounded-lg object-cover bg-gray-100 border"
                          onError={(e) => e.target.src = 'https://via.placeholder.com/40?text=NoImg'}
                        />
                        <div><div className="font-bold">{p.name}</div><div className="text-[10px] text-gray-400">#{p.id}</div></div>
                      </td>
                      <td className="py-3"><span className="bg-blue-50 text-blue-600 text-[10px] font-black px-2 py-0.5 rounded">{p.category}</span></td>
                      <td className="py-3 font-black">₹{p.price}</td>
                      <td className="py-3 text-xs text-gray-500">{p.seller?.name || 'System'}</td>
                      <td className="py-3 text-center">
                        <button
                          onClick={() => handleDeleteProduct(p.id, p.name)}
                          className="bg-red-50 hover:bg-red-100 text-red-600 text-xs font-black px-3 py-1.5 rounded-lg ring-1 ring-red-200 transition-all active:scale-95"
                          title="Delete product"
                        >
                          🗑️ Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                  {products.length === 0 && <tr><td colSpan="5" className="py-12 text-center text-gray-400 text-xs uppercase font-bold">No products</td></tr>}
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
        {/* SUPPORT TICKETS TAB */}
        {activeTab === 'support' && (
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <h2 className="text-lg font-black mb-6 border-b pb-4">🎧 SUPPORT TICKETS <span className="bg-amazon-orange text-white text-[10px] px-2 py-0.5 rounded-full ml-2">{tickets.filter(t => t.status === 'OPEN').length} OPEN</span></h2>
            <div className="space-y-4">
              {tickets.length === 0 ? (
                <div className="py-16 text-center text-gray-400 text-xs uppercase font-bold">No support tickets</div>
              ) : tickets.map(t => (
                <div key={t.id} className={`p-5 rounded-xl border ${t.status === 'OPEN' ? 'border-orange-200 bg-orange-50/30' : 'border-gray-100 bg-gray-50/50'}`}>
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase ${t.status === 'OPEN' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>{t.status}</span>
                        <span className="text-[10px] font-bold text-gray-400">#{t.id} · {new Date(t.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <h4 className="font-black text-sm">{t.type}</h4>
                      <p className="text-xs text-amazon-orange font-bold mt-0.5">From: {t.user?.name} ({t.user?.email})</p>
                      <p className="text-sm text-gray-600 mt-2 italic">"{t.message}"</p>
                      {t.response && <p className="text-xs text-green-700 mt-2 font-bold">✅ Reply: "{t.response}"</p>}
                    </div>
                    {t.status === 'OPEN' && (
                      <div className="flex flex-col gap-2 min-w-[200px]">
                        <textarea
                          placeholder="Type reply..."
                          rows={2}
                          className="w-full border border-gray-200 rounded-lg p-2 text-xs resize-none outline-none focus:border-amazon-orange"
                          value={ticketResponses[t.id] || ''}
                          onChange={e => setTicketResponses(prev => ({...prev, [t.id]: e.target.value}))}
                        />
                        <button
                          onClick={async () => {
                            try {
                              await api.patch(`/api/support/${t.id}`, { status: 'RESOLVED', response: ticketResponses[t.id] || '' });
                              toast.success('Ticket resolved!');
                              setTicketResponses(prev => { const n={...prev}; delete n[t.id]; return n; });
                              fetchAll();
                            } catch { toast.error('Failed to resolve ticket'); }
                          }}
                          className="bg-amazon-orange text-white text-xs font-black py-2 px-4 rounded-lg hover:bg-amber-500 transition-all"
                        >Send Reply & Resolve</button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* AUDIT LOGS TAB */}
        {activeTab === 'audit' && (
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <h2 className="text-lg font-black mb-6 border-b pb-4">📋 AUDIT LOGS <span className="bg-gray-800 text-white text-[10px] px-2 py-0.5 rounded-full ml-2">{auditLogs.length}</span></h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead><tr className="text-[10px] uppercase text-gray-400 font-black tracking-widest border-b">
                  <th className="pb-3">Time</th>
                  <th className="pb-3">User</th>
                  <th className="pb-3">Action</th>
                  <th className="pb-3">Details</th>
                </tr></thead>
                <tbody className="text-xs">
                  {auditLogs.length === 0 && (
                    <tr><td colSpan="4" className="py-12 text-center text-gray-400 uppercase font-bold">No audit logs yet</td></tr>
                  )}
                  {auditLogs.map(log => (
                    <tr key={log.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-3 text-gray-400 whitespace-nowrap">{new Date(log.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
                      <td className="py-3">
                        <div className="font-bold">{log.user?.name || 'System'}</div>
                        <div className="text-[10px] text-gray-400">{log.user?.role}</div>
                      </td>
                      <td className="py-3">
                        <span className={`text-[9px] font-black px-2 py-1 rounded uppercase ${
                          log.action.includes('DELETE') ? 'bg-red-50 text-red-600' :
                          log.action.includes('RESOLVED') ? 'bg-green-50 text-green-600' :
                          log.action.includes('ROLE') ? 'bg-purple-50 text-purple-600' :
                          'bg-gray-100 text-gray-600'
                        }`}>{log.action.replace(/_/g, ' ')}</span>
                      </td>
                      <td className="py-3 text-gray-500 max-w-[350px] truncate">{log.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
