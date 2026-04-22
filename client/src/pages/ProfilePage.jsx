import React, { useState, useEffect } from 'react';
import axios from 'axios';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';
import { usePermission } from '../context/PermissionContext';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export default function ProfilePage() {
  const { user, logout, fetchUser, token } = useAuth();
  const { hasPermission } = usePermission();
  const { setShowOrdersModal } = useUI();
  const [isEditing, setIsEditing] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [supportMessage, setSupportMessage] = useState({ type: 'General Inquiry', message: '' });

  const handleSendSupportRequest = async () => {
    try {
        const response = await fetch('/api/support', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.id, ...supportMessage })
        });
        if (!response.ok) throw new Error('Failed to send');
        toast.success('Your message has been sent to our staff!');
        setShowSupportModal(false);
        setSupportMessage({ type: 'General Inquiry', message: '' });
    } catch (err) {
        toast.error('Failed to send message');
    }
  };
  const [uploading, setUploading] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [editingMobile, setEditingMobile] = useState(false);
  const [newName, setNewName] = useState('');
  const [newMobile, setNewMobile] = useState('');
  const [requests, setRequests] = useState([]);
  const [requesting, setRequesting] = useState(false);
  const [requestForm, setRequestForm] = useState({ role: '', reason: '' });
  const navigate = useNavigate();
  const [openTickets, setOpenTickets] = useState(0);
  const [sellerStats, setSellerStats] = useState({ products: 0, itemsSold: 0 });

  const fetchStats = async () => {
    try {
      if (user?.dynamicRole || user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') {
        const res = await api.get('/api/support/stats');
        setOpenTickets(res.data.openTickets || 0);
      }
      if (user?.role === 'SELLER') {
        const res = await api.get('/api/seller/stats');
        setSellerStats(res.data);
      }
    } catch (err) {}
  };

  useEffect(() => {
    if (user) {
      fetchStats();
    }
  }, [user]);

  useEffect(() => {
    if (!token && !user) {
        navigate('/');
    }
    if (user) {
      setNewName(user.name || '');
      setNewMobile(user.mobile || '');
      fetchRequests();
    }
  }, [user, token, navigate]);

  const fetchRequests = async () => {
    try {
      const res = await api.get('/api/requests/my');
      setRequests(res.data);
    } catch (err) { console.error(err); }
  };

  const submitRequest = async (e) => {
    e.preventDefault();
    if (!requestForm.role) return toast.error('Please select a role');
    try {
      setRequesting(true);
      await api.post('/api/requests', { requestedRole: requestForm.role, reason: requestForm.reason });
      toast.success('Request submitted to Super Admin!');
      setRequestForm({ role: '', reason: '' });
      fetchRequests();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Request failed');
    } finally {
      setRequesting(false);
    }
  };

  if (!user) return null;

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      setUploading(true);
      await api.put('/api/auth/profile', formData);
      await fetchUser();
      toast.success('Profile picture updated!');
    } catch (err) {
      toast.error('Failed to upload picture');
    } finally {
      setUploading(false);
    }
  };

  const handleUpdateProfile = async (e, type) => {
    e.preventDefault();
    const data = type === 'name' ? { name: newName } : { mobile: newMobile };
    try {
      await api.put('/api/auth/profile', data);
      await fetchUser();
      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} updated successfully!`);
      type === 'name' ? setEditingName(false) : setEditingMobile(false);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Profile update failed');
    }
  };

  const avatarSrc = user.avatarUrl 
    ? (user.avatarUrl.startsWith('http') ? user.avatarUrl : `http://localhost:5000${user.avatarUrl}`)
    : 'https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png';

  const accountOptions = [
    { 
        title: 'Your Orders', 
        desc: 'Track, return, or buy things again', 
        icon: '📦',
        id: 'orders',
        onClick: () => setShowOrdersModal(true)
    },
    { 
        title: 'Login & Security', 
        desc: 'Edit login, name, and mobile number', 
        icon: '🔐',
        id: 'security',
        onClick: () => { setEditingName(true); setEditingMobile(true); }
    },
    { 
        title: 'Prime', 
        desc: 'View benefits and payment settings', 
        icon: '💎',
        id: 'prime'
    },
    { 
        title: 'Your Addresses', 
        desc: 'Edit addresses for orders and gifts', 
        icon: '📍',
        id: 'addresses'
    },
    { 
        title: 'Payment Options', 
        desc: 'Edit or add payment methods', 
        icon: '💳',
        id: 'payments'
    },
    { 
        title: 'Gift Cards', 
        desc: 'View balance or redeem a card', 
        icon: '🎁',
        id: 'gifts'
    },
    { 
        title: 'Contact Us', 
        desc: 'Get help with your orders or account', 
        icon: '🎧',
        id: 'contact'
    },
  ];

  if (user.role === 'SELLER') {
    accountOptions.push({
      title: 'Seller Dashboard',
      desc: 'Manage your products, view sales and revenue',
      icon: '🏪',
      id: 'seller',
      onClick: () => navigate('/seller')
    });
  }

  if (user.role === 'ADMIN') {
    accountOptions.push({
      title: 'Admin Dashboard',
      desc: 'Manage users, orders, products and the entire platform',
      icon: '🛡️',
      id: 'admin',
      onClick: () => navigate('/admin')
    });
    accountOptions.push({
      title: 'Role Management',
      desc: 'Create roles, assign module permissions dynamically',
      icon: '🔐',
      id: 'roles',
      onClick: () => navigate('/roles')
    });
  }

  if (user.role === 'SUPER_ADMIN') {
    accountOptions.push({
      title: 'Super Admin Panel',
      desc: 'Full platform control — users, roles, analytics, orders',
      icon: '👑',
      id: 'superadmin',
      onClick: () => navigate('/super-admin')
    });
    accountOptions.push({
      title: 'Role Management',
      desc: 'Create roles, assign module permissions dynamically',
      icon: '🔐',
      id: 'roles',
      onClick: () => navigate('/roles')
    });
  }

  // Support Staff with a dynamic role (e.g. Support Staff, Manager, Analyst)
  if (user.role === 'USER' && user.dynamicRole) {
    if (hasPermission('ContactManagement', 'view')) {
      accountOptions.push({
        title: 'Staff Dashboard',
        desc: `Access your ${user.dynamicRole.name} workspace and manage tickets`,
        icon: '🎧',
        id: 'staff',
        onClick: () => navigate('/support')
      });
    }
  }



  return (
    <div className="bg-white min-h-screen pb-20">
      <div className="max-w-[1000px] mx-auto pt-8 px-4 md:px-0">
        <h1 className="text-3xl font-light mb-6 text-amazon-dark">Your Account</h1>
        
        {/* Profile Card Section */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr,2fr] gap-8 border rounded-lg p-8 mb-10 shadow-sm border-gray-200">
          <div className="flex flex-col items-center">
            <div className="relative group w-[180px] h-[180px] rounded-full overflow-hidden border-4 border-gray-100 shadow-lg cursor-pointer">
                <img 
                  src={avatarSrc} 
                  alt="User Profile" 
                  className="w-full h-full object-cover"
                />
                <label className="absolute inset-0 bg-black/40 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                  <span className="text-xl mb-1 mt-2">📷</span>
                  <span className="text-[12px] font-bold uppercase tracking-wider">{uploading ? 'Processing...' : 'Upload Image'}</span>
                  <input type="file" className="hidden" onChange={handleFileChange} accept="image/*" disabled={uploading}/>
                </label>
            </div>
            <p className="mt-4 text-[12px] text-gray-500 font-medium">Click image to change profile photo</p>
          </div>

          <div className="flex flex-col justify-center">
            <div className="flex flex-col gap-4">
              {/* Name Section */}
              {editingName ? (
                <form onSubmit={(e) => handleUpdateProfile(e, 'name')} className="flex flex-col gap-2">
                  <label className="text-[13px] font-bold">Full Name</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={newName} 
                      onChange={(e) => setNewName(e.target.value)} 
                      className="border border-amazon-orange rounded px-4 py-1.5 focus:ring-2 focus:ring-amazon-orange/20 outline-none flex-1"
                      placeholder="Full Name"
                    />
                    <button type="submit" className="bg-amazon-orange px-4 rounded text-sm font-bold">Save</button>
                    <button type="button" onClick={() => setEditingName(false)} className="px-4 py-1.5 rounded text-sm font-bold bg-gray-100">Cancel</button>
                  </div>
                </form>
              ) : (
                <div className="flex items-center gap-3">
                  <h2 className="text-[28px] font-bold text-amazon-dark">{user.name}</h2>
                  <button onClick={() => setEditingName(true)} className="text-amazon-link hover:underline text-sm">Edit</button>
                </div>
              )}

              {/* Info Box */}
              <div className="bg-gray-50 p-5 rounded-lg border border-gray-100 flex flex-col gap-3">
                <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Account Status</span>
                    <span className={`text-[11px] font-black uppercase px-2 py-0.5 rounded w-fit mt-1 ${
                      user.role === 'SUPER_ADMIN' ? 'bg-red-50 text-red-600' :
                      user.role === 'ADMIN' ? 'bg-blue-50 text-blue-600' :
                      user.role === 'SELLER' ? 'bg-green-50 text-green-600' :
                      user.dynamicRole ? 'bg-amazon-orange/10 text-amazon-orange' :
                      'bg-gray-100 text-gray-500'
                    }`}>
                      {user.dynamicRole?.name || user.role.replace('_', ' ')}
                    </span>
                  </div>
                  <span className="text-[11px] text-gray-400 bg-gray-200 px-2 rounded font-bold">🔒 Secure</span>
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Mobile Phone</span>
                    {editingMobile ? (
                      <form onSubmit={(e) => handleUpdateProfile(e, 'mobile')} className="flex gap-2 mt-1">
                        <input 
                          type="text" 
                          value={newMobile} 
                          onChange={(e) => setNewMobile(e.target.value)} 
                          className="border border-amazon-orange rounded px-3 py-1 text-sm outline-none"
                          placeholder="Phone number"
                        />
                        <button type="submit" className="text-xs font-bold text-amazon-link">Save</button>
                        <button type="button" onClick={() => setEditingMobile(false)} className="text-xs font-bold text-gray-500">Close</button>
                      </form>
                    ) : (
                      <span className={user.mobile ? "text-gray-700" : "text-gray-400 italic"}>
                        {user.mobile || 'Not linked yet'}
                      </span>
                    )}
                  </div>
                  {!editingMobile && (
                    <button onClick={() => setEditingMobile(true)} className="text-amazon-link font-bold text-xs hover:underline">
                      {user.mobile ? 'Edit' : 'Link Now'}
                    </button>
                  )}
                </div>
              </div>
            </div>
            
            <button 
                onClick={() => logout()} 
                className="mt-6 text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 py-2 px-6 rounded font-bold text-[13px] transition-all border border-red-100 w-fit"
            >
                Sign out of all sessions
            </button>
          </div>
        </div>

        {/* Action Grid Section - Real Amazon Dashboard Style */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {accountOptions.map((opt) => (
                <div 
                    key={opt.id}
                    onClick={opt.onClick}
                    className="flex border border-gray-200 rounded-[10px] p-5 hover:bg-gray-50 cursor-pointer transition-all duration-200 group"
                >
                    <div className="text-[40px] mr-5 bg-gray-50 group-hover:bg-white p-3 rounded-lg flex items-center justify-center h-fit transition-shadow group-hover:shadow-sm">
                        {opt.icon}
                    </div>
                    <div>
                        <h4 className="text-[17px] font-bold text-amazon-dark mb-0.5">{opt.title}</h4>
                        <p className="text-[14px] text-[#565959] leading-tight">{opt.desc}</p>
                    </div>
                </div>
            ))}
        </div>

        {/* Role Access Request Section */}
        {user.role === 'USER' && (
          <div className="mt-12 border-t pt-10 border-dashed border-gray-200">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">🚀 Upgrade Your Account</h3>
            <div className="grid grid-cols-1 md:grid-cols-[2fr,3fr] gap-8">
              <form onSubmit={submitRequest} className="bg-gray-50 p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-4">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Apply for Seller or Admin Access</p>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase">Requested Role</label>
                  <select 
                    value={requestForm.role}
                    onChange={e => setRequestForm({...requestForm, role: e.target.value})}
                    className="w-full mt-1 bg-white border-2 border-gray-100 p-2 text-sm rounded-xl outline-none focus:border-amazon-orange"
                  >
                    <option value="">Select Role</option>
                    <option value="SELLER">Become a Seller (List & Sell Products)</option>
                    <option value="ADMIN">System Administrator (Manage Store)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase">Reason / Justification</label>
                  <textarea 
                    value={requestForm.reason}
                    onChange={e => setRequestForm({...requestForm, reason: e.target.value})}
                    placeholder="Why do you need this access?"
                    className="w-full mt-1 bg-white border-2 border-gray-100 p-2 text-sm rounded-xl outline-none focus:border-amazon-orange h-24 resize-none"
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={requesting}
                  className="bg-amazon-orange hover:bg-amazon-orange-hover text-white py-3 rounded-xl font-black text-xs uppercase shadow-lg transition-all active:scale-95 disabled:opacity-50"
                >
                  {requesting ? 'Sending...' : 'Submit Request to Super Admin'}
                </button>
              </form>

              <div className="bg-white border-2 border-gray-50 rounded-2xl p-6">
                <h4 className="text-[13px] font-bold text-gray-400 mb-4 uppercase tracking-widest">Recent Requests</h4>
                <div className="flex flex-col gap-3">
                   {requests.map(r => (
                     <div key={r.id} className="p-4 rounded-xl border border-gray-50 bg-gray-50/50 flex flex-col gap-1">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-black uppercase text-blue-600 bg-blue-50 px-2 py-0.5 rounded ring-1 ring-blue-100">{r.requestedRole}</span>
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                            r.status === 'PENDING' ? 'bg-yellow-50 text-yellow-600 ring-1 ring-yellow-100' :
                            r.status === 'APPROVED' ? 'bg-green-50 text-green-600 ring-1 ring-green-100' :
                            'bg-red-50 text-red-600 ring-1 ring-red-100'
                          }`}>
                            {r.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-500 mt-1 line-clamp-1 italic">{r.reason || 'No reason'}</p>
                        <span className="text-[9px] text-gray-400 mt-1 font-medium">{new Date(r.createdAt).toLocaleDateString()}</span>
                     </div>
                   ))}
                   {requests.length === 0 && (
                     <div className="py-10 text-center text-gray-300 italic text-sm">No requests submitted yet.</div>
                   )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ROLE & MANAGEMENT CENTER */}
        <section className="mt-12 mb-16">
            <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-xl font-black text-gray-900 tracking-tight">Platform Roles</h3>
                  <p className="text-xs text-gray-400 font-medium mt-1 uppercase tracking-widest">Manage your different account responsibilities</p>
                </div>
                {user?.role === 'SUPER_ADMIN' && (
                  <button onClick={() => navigate('/super-admin')} className="bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase shadow-lg shadow-red-200 transition-all flex items-center gap-2">
                    <span className="text-sm">🛡️</span> Super Admin Panel
                  </button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                
                {user?.role === 'SELLER' && (
                  <div onClick={() => navigate('/seller')} className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm hover:shadow-xl hover:border-gray-200 transition-all cursor-pointer group relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-green-50 rounded-full -mr-16 -mt-16 opacity-50 group-hover:scale-110 transition-transform" />
                    <div className="relative">
                      <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center text-xl mb-4 group-hover:bg-green-500 group-hover:text-white transition-all">🏪</div>
                      <h4 className="font-black text-sm uppercase tracking-tight text-gray-900">Merchant Portal</h4>
                      <p className="text-[11px] text-gray-400 mt-1 font-medium leading-relaxed">Manage your listings, track inventory, and view sales performance.</p>
                      
                      <div className="mt-6 flex flex-wrap gap-2">
                        <span className="text-[9px] font-black text-green-600 bg-green-50 px-2 py-0.5 rounded uppercase">{sellerStats.products} Active Listings</span>
                        <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase">{sellerStats.itemsSold} Items Sold</span>
                      </div>

                      <div className="mt-5 flex items-center justify-between">
                        <span className="text-[10px] font-black text-green-600 uppercase">Seller Dashboard</span>
                        <span className="text-gray-900 text-[10px] font-black uppercase flex items-center gap-1 group-hover:gap-2 transition-all">Launch →</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* STAFF OPERATIONS (DYNAMIC ROLES) */}
                {(user?.role === 'ADMIN' || user?.dynamicRole) && user?.role !== 'SUPER_ADMIN' && (
                  <div 
                    onClick={() => {
                        if (hasPermission('ContactManagement', 'view')) {
                            navigate('/support');
                        } else {
                            // Anyone with a staff role (dynamicRole) should be able to see their specific modules in the Admin Dashboard
                            navigate('/admin');
                        }
                    }}
                    className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm hover:shadow-xl hover:border-amazon-orange transition-all cursor-pointer group relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amazon-orange/5 rounded-full -mr-16 -mt-16 opacity-50 group-hover:scale-110 transition-transform" />
                    <div className="relative">
                      <div className="w-12 h-12 bg-amazon-orange/10 rounded-2xl flex items-center justify-center text-xl mb-4 group-hover:bg-amazon-orange group-hover:text-white transition-all">🎧</div>
                      <h4 className="font-black text-sm uppercase tracking-tight text-gray-900">Staff Operations</h4>
                      <p className="text-[11px] text-gray-400 mt-1 font-medium leading-relaxed">Assigned Role: <span className="text-amazon-orange font-bold uppercase">{user?.dynamicRole?.name || user?.role}</span></p>
                      
                      <div className="mt-6 flex items-center justify-between">
                         <div className="flex items-center gap-2">
                            {hasPermission('ContactManagement', 'view') && openTickets > 0 ? (
                              <span className="bg-amazon-orange text-white px-3 py-1 rounded-lg font-black text-[10px] animate-pulse">{openTickets} NEW INQUIRY</span>
                            ) : (
                               <span className="text-[10px] font-black text-gray-400 bg-gray-50 px-3 py-1 rounded-lg uppercase">System Access: Active</span>
                            )}
                         </div>
                        <span className="text-gray-900 text-[10px] font-black uppercase flex items-center gap-1 group-hover:gap-2 transition-all">Launch Hub →</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* CUSTOMER SUPPORT CARD (USER ONLY) */}
                {!user?.dynamicRole && user?.role === 'USER' && (
                  <div onClick={() => setShowSupportModal(true)} className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm hover:shadow-xl transition-all cursor-pointer group">
                      <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-xl mb-4 group-hover:bg-amazon-orange group-hover:text-white transition-all">📦</div>
                      <h4 className="font-black text-sm uppercase text-gray-800">Need Help?</h4>
                      <p className="text-[11px] text-gray-500 mt-1 font-medium">Contact our staff for help with orders, refunds or account issues.</p>
                      <div className="mt-6 text-amazon-orange text-[10px] font-black uppercase flex items-center gap-1 group-hover:gap-2 transition-all">Message Us →</div>
                  </div>
                )}

            </div>
        </section>

        {/* SUPPORT MODAL */}
        {showSupportModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <div className="bg-white rounded-[20px] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-200">
                  <div className="p-6 border-b bg-gray-50 flex justify-between items-center">
                      <h3 className="font-black text-xs uppercase tracking-widest text-gray-800">Support Request</h3>
                      <button onClick={() => setShowSupportModal(false)} className="text-gray-400 hover:text-red-500 font-bold text-2xl">×</button>
                  </div>
                  <div className="p-6 space-y-6">
                      <div>
                          <label className="text-[10px] font-black uppercase text-gray-400">Issue Type</label>
                          <select 
                              className="w-full mt-1 bg-gray-100 p-3 rounded-xl outline-none text-sm font-bold border-transparent focus:border-amazon-orange"
                              value={supportMessage.type}
                              onChange={e => setSupportMessage({...supportMessage, type: e.target.value})}
                          >
                              <option>General Inquiry</option>
                              <option>Order Missing</option>
                              <option>Refund Request</option>
                              <option>Payments Issue</option>
                              <option>Account Security</option>
                          </select>
                      </div>
                      <div>
                          <label className="text-[10px] font-black uppercase text-gray-400">Message</label>
                          <textarea 
                              placeholder="Describe your problem clearly..."
                              rows={4}
                              className="w-full mt-1 bg-gray-100 p-3 rounded-xl outline-none text-sm font-bold border-transparent focus:border-amazon-orange resize-none"
                              value={supportMessage.message}
                              onChange={e => setSupportMessage({...supportMessage, message: e.target.value})}
                          ></textarea>
                      </div>
                      <button 
                          onClick={handleSendSupportRequest}
                          className="w-full bg-amazon-orange hover:bg-amazon-orange-hover text-white py-4 rounded-2xl font-black text-xs uppercase shadow-xl shadow-amazon-orange/10"
                      >
                          Send Request
                      </button>
                  </div>
              </div>
          </div>
        )}
      </div>
    </div>
  );
}
