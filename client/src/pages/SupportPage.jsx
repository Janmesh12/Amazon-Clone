import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { usePermission } from '../context/PermissionContext';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export default function SupportPage() {
  const { user, token } = useAuth();
  const { hasPermission } = usePermission();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [filter, setFilter] = useState('OPEN'); // Default to OPEN now
  const [activeCounts, setActiveCounts] = useState({ open: 0, resolved: 0, all: 0 });

  const fetchTickets = async () => {
    setLoading(true);
    try {
        const res = await api.get('/api/support');
        setTickets(res.data);
        
        // Calculate counts
        setActiveCounts({
            open: res.data.filter(t => t.status === 'OPEN').length,
            resolved: res.data.filter(t => t.status === 'RESOLVED').length,
            all: res.data.length
        });

        // Auto-select first ticket if none selected based on filter
        const initialList = res.data.filter(t => filter === 'ALL' ? true : t.status === filter);
        if (initialList.length > 0 && !selectedTicket) {
            setSelectedTicket(initialList[0]);
        } else if (selectedTicket) {
            // Refresh selected ticket data
            const updated = res.data.find(t => t.id === selectedTicket.id);
            if (updated) setSelectedTicket(updated);
        }
    } catch (err) { 
        toast.error('Failed to load tickets'); 
    } finally {
        setLoading(false);
    }
  };

  const handleUpdateTicketStatus = async (id, status) => {
    try {
      await api.patch(`/api/support/${id}`, { status, response: replyText });
      toast.success(`Ticket marked as ${status}`);
      setReplyText('');
      
      // If we are in OPEN view and just resolved one, we should select the next available or clear selection
      if (filter === 'OPEN' && status === 'RESOLVED') {
          setSelectedTicket(null); 
      }
      
      fetchTickets();
    } catch (err) { toast.error('Error updating ticket'); }
  };

  useEffect(() => {
    fetchTickets();
  }, [token]);

  const filteredTickets = tickets.filter(t => {
      if (filter === 'ALL') return true;
      return t.status === filter;
  });

  return (
    <div className="bg-white min-h-screen flex flex-col h-screen overflow-hidden">
      
      {/* COMPACT TOP NAVIGATION */}
      <nav className="h-16 border-b border-gray-100 flex items-center justify-between px-6 shrink-0 bg-white">
        <div className="flex items-center gap-4">
            <div className="bg-amazon-orange/10 p-2 rounded-lg">🎧</div>
            <h1 className="font-black text-sm tracking-tighter uppercase">Support Hub</h1>
            <div className="h-4 w-px bg-gray-200 mx-2" />
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">
                Logged in as <span className="text-amazon-orange">{user?.name}</span>
            </div>
        </div>
        <div className="flex items-center gap-6">
            {hasPermission('Orders', 'view') && (
                <button 
                    onClick={() => navigate('/admin')} 
                    className="text-[10px] font-bold uppercase text-gray-400 hover:text-amazon-orange transition-all flex items-center gap-1"
                >
                    ⚙️ Master Operations
                </button>
            )}
            <button 
                onClick={() => navigate('/profile')} 
                className="text-[10px] font-black uppercase text-gray-400 hover:text-amazon-orange transition-all p-2"
            >
                ← Back to Dashboard
            </button>
        </div>
      </nav>

      <div className="flex-1 flex overflow-hidden">
        
        {/* LEFT SIDEBAR: TICKET LIST */}
        <aside className="w-80 md:w-96 border-r border-gray-100 flex flex-col shrink-0 bg-gray-50/30">
            <div className="p-4 border-b border-gray-100 bg-white shadow-sm z-10">
                <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
                    {[
                        { id: 'ALL', label: 'All', count: activeCounts.all },
                        { id: 'OPEN', label: 'Open', count: activeCounts.open },
                        { id: 'RESOLVED', label: 'Archive', count: activeCounts.resolved }
                    ].map(f => (
                        <button 
                            key={f.id}
                            onClick={() => {
                                setFilter(f.id);
                                const filtered = tickets.filter(t => f.id === 'ALL' ? true : t.status === f.id);
                                if (filtered.length > 0) setSelectedTicket(filtered[0]);
                            }}
                            className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase transition-all flex flex-col items-center gap-0.5 ${filter === f.id ? 'bg-white text-amazon-orange shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            <span>{f.label}</span>
                            <span className={`text-[8px] opacity-70 ${filter === f.id ? 'text-amazon-orange' : 'text-gray-400'}`}>{f.count}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {loading ? (
                    <div className="p-10 text-center animate-pulse text-[10px] font-black uppercase text-gray-300">Loading inbox...</div>
                ) : filteredTickets.length === 0 ? (
                    <div className="p-10 text-center text-[10px] font-black uppercase text-gray-300">No {filter.toLowerCase()} tickets</div>
                ) : (
                    filteredTickets.map(t => (
                        <div 
                            key={t.id}
                            onClick={() => setSelectedTicket(t)}
                            className={`p-5 border-b border-gray-100 cursor-pointer transition-all relative ${selectedTicket?.id === t.id ? 'bg-white shadow-inner border-l-4 border-l-amazon-orange' : 'hover:bg-white'}`}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <span className={`text-[8px] font-black px-2 py-0.5 rounded uppercase ${t.status === 'OPEN' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>
                                    {t.status}
                                </span>
                                <span className="text-[8px] font-bold text-gray-400">
                                    {new Date(t.createdAt).toLocaleDateString()}
                                </span>
                            </div>
                            <h3 className={`text-xs font-black truncate ${selectedTicket?.id === t.id ? 'text-amazon-orange' : 'text-gray-900'}`}>{t.type}</h3>
                            <p className="text-[10px] text-gray-400 font-medium truncate mt-1">{t.user?.name} · {t.user?.email}</p>
                            <p className="text-[10px] text-gray-500 line-clamp-2 mt-2 leading-relaxed italic border-l-2 border-gray-100 pl-2">"{t.message}"</p>
                        </div>
                    ))
                )}
            </div>
        </aside>

        {/* MAIN PANEL: TICKET DETAILS */}
        <main className="flex-1 flex flex-col bg-white overflow-hidden relative">
            {selectedTicket ? (
                <>
                    {/* INFO HEADER */}
                    <div className="p-8 border-b border-gray-50 bg-gray-50/10 shrink-0">
                        <div className="flex justify-between items-start">
                            <div>
                                <div className="flex items-center gap-3 mb-3">
                                    <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase ${selectedTicket.status === 'OPEN' ? 'bg-green-50 text-green-600 ring-1 ring-green-100' : 'bg-gray-100 text-gray-400'}`}>
                                        Ticket #{selectedTicket.id} · {selectedTicket.status}
                                    </span>
                                </div>
                                <h2 className="text-2xl font-black text-gray-900 tracking-tight">{selectedTicket.type}</h2>
                                <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mt-2 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amazon-orange" />
                                    {selectedTicket.user?.name} ({selectedTicket.user?.email})
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest mb-1">Time Created</p>
                                <p className="text-xs font-black text-gray-400">{new Date(selectedTicket.createdAt).toLocaleString()}</p>
                            </div>
                        </div>
                    </div>

                    {/* CONVERSATION AREA */}
                    <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-white custom-scrollbar">
                        {/* THE CUSTOMER MESSAGE */}
                        <div className="flex flex-col gap-3 group">
                            <span className="text-[9px] font-black uppercase text-gray-300 tracking-[0.2em]">Customer Inquiry</span>
                            <div className="bg-gray-50 p-6 rounded-2xl rounded-tl-none border border-gray-100 max-w-2xl shadow-sm">
                                <p className="text-sm text-gray-700 leading-relaxed font-medium">"{selectedTicket.message}"</p>
                            </div>
                        </div>

                        {/* OUR RESPONSE IF EXISTS */}
                        {(selectedTicket.response || selectedTicket.status === 'RESOLVED') && (
                            <div className="flex flex-col items-end gap-3 animate-in fade-in slide-in-from-right-4 duration-500">
                                <div className="flex items-center gap-2">
                                    <span className="text-[8px] font-bold text-gray-300 uppercase tracking-widest italic">Solved {new Date(selectedTicket.updatedAt).toLocaleDateString()}</span>
                                    <span className="text-[9px] font-black uppercase text-amazon-orange tracking-[0.2em]">Our Solution</span>
                                </div>
                                <div className="bg-amazon-orange/10 p-6 rounded-2xl rounded-tr-none border border-amazon-orange/20 max-w-2xl shadow-sm">
                                    <p className="text-sm text-amazon-orange font-bold leading-relaxed italic">
                                        "{selectedTicket.response || 'No reply text recorded'}"
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ACTION FOOTER */}
                    <div className="p-8 border-t border-gray-100 bg-white shrink-0 shadow-2xl shadow-gray-200">
                        {selectedTicket.status === 'OPEN' ? (
                            <div className="flex flex-col gap-4">
                                {hasPermission('ContactManagement', 'update') ? (
                                    <>
                                        <textarea 
                                            className="w-full bg-gray-50/50 border border-gray-100 p-5 rounded-2xl text-sm font-bold placeholder:text-gray-300 outline-none focus:border-amazon-orange focus:bg-white transition-all shadow-inner h-24 resize-none"
                                            placeholder="Type your official response..."
                                            value={replyText}
                                            onChange={e => setReplyText(e.target.value)}
                                        />
                                        <div className="flex justify-between items-center">
                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest italic">User will be notified via email once resolved</p>
                                            <button 
                                                onClick={() => handleUpdateTicketStatus(selectedTicket.id, 'RESOLVED')}
                                                disabled={!replyText.trim()}
                                                className="bg-amazon-orange hover:bg-amazon-orange-hover text-white px-10 py-3 rounded-xl font-black text-xs uppercase shadow-xl shadow-amazon-orange/20 transition-all active:scale-95 disabled:opacity-50"
                                            >
                                                Send & Resolve Ticket
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 flex items-center justify-between">
                                        <div className="flex items-center gap-3 text-gray-400">
                                            <span className="text-xl">👁️</span>
                                            <p className="text-[10px] font-black uppercase tracking-widest">You have read-only access to this inquiry</p>
                                        </div>
                                        <span className="text-[9px] font-black text-gray-300 uppercase italic">Reply Disabled</span>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3 text-green-600">
                                    <span className="text-xl">✅</span>
                                    <p className="text-[10px] font-black uppercase tracking-widest">Inquiry marked as solved</p>
                                </div>
                                {hasPermission('ContactManagement', 'update') && (
                                    <button 
                                        onClick={() => handleUpdateTicketStatus(selectedTicket.id, 'OPEN')}
                                        className="text-[10px] font-black uppercase text-gray-400 hover:text-amazon-orange border border-gray-100 px-6 py-2 rounded-lg transition-all"
                                    >
                                        Re-open for Review
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-200 bg-gray-50/20">
                    <div className="text-6xl mb-4">📧</div>
                    <p className="text-sm font-black uppercase tracking-[0.3em]">Select a ticket from the inbox</p>
                </div>
            )}
        </main>

      </div>
    
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #ff9900; }
      `}</style>
    </div>
  );
}
