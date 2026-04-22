import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function RoleEdit() {
    const { roleId } = useParams();
    const navigate = useNavigate();
    const { token } = useAuth();
    const [role, setRole] = useState(null);
    const [modules, setModules] = useState([]);
    const [permissions, setPermissions] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchData();
    }, [roleId]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [roleRes, modulesRes] = await Promise.all([
                api.get(`/api/roles/${roleId}`),
                api.get('/api/modules')
            ]);

            setRole(roleRes.data.data);
            setModules(modulesRes.data.data);

            // Map existing permissions to state
            const permMap = {};
            roleRes.data.data.permissions.forEach(p => {
                permMap[p.moduleId] = {
                    view: p.view || false,
                    create: p.create || false,
                    update: p.update || false,
                    delete: p.delete || false
                };
            });
            setPermissions(permMap);
        } catch (err) {
            toast.error('Failed to load role data');
            navigate('/roles');
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = (moduleId, action) => {
        setPermissions(prev => {
            const current = prev[moduleId] || { view: false, create: false, update: false, delete: false };
            const next = { ...current, [action]: !current[action] };

            // Logic: No one should be able to create, update, or delete unless they have view access
            if (action === 'view' && !next.view) {
                // If view is turned off, turn off everything
                next.create = false;
                next.update = false;
                next.delete = false;
            } else if (action !== 'view' && next[action]) {
                // If any action is turned on, ensure view is ON
                next.view = true;
            }   

            return { ...prev, [moduleId]: next };
        });
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            // Transform permissions for API
            const permissionList = modules.map(m => ({
                moduleId: m.id,
                ...permissions[m.id] || { view: false, create: false, update: false, delete: false }
            }));

            await api.put(`/api/roles/${roleId}/permissions`, permissionList);
            toast.success('Permissions updated successfully!');
            navigate('/roles');
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to save permissions');
        } finally {
            setSaving(false);
        }
    };

    const filteredModules = modules.filter(m => 
        m.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return (
        <div className="min-h-screen bg-amazon-gray-bg flex flex-col items-center justify-center gap-4">
            <div className="w-10 h-10 border-4 border-gray-200 border-top-amazon-orange rounded-full animate-spin"></div>
            <p className="text-amazon-text-muted font-black tracking-widest uppercase text-xs">Loading System Modules...</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-amazon-gray-bg p-4 md:p-8 font-sans">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
                <div className="flex items-start gap-6">
                    <button 
                        className="bg-white border border-gray-300 text-amazon-text-muted px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-50 transition-all shadow-sm" 
                        onClick={() => navigate('/roles')}
                    >
                        ← Roles
                    </button>
                    <div className="flex items-center gap-5">
                        <div className="w-16 h-16 bg-amazon-orange text-amazon-dark text-2xl font-black rounded-2xl flex items-center justify-center shadow-lg shrink-0">
                            {role?.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-black text-amazon-dark leading-none tracking-tight uppercase">{role?.name}</h1>
                            <p className="text-sm text-amazon-text-muted mt-2 font-medium max-w-md line-clamp-2">
                                {role?.description || 'Configure access levels and granular module permissions for this role.'}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button 
                        className="flex-1 lg:flex-none px-6 py-3 rounded-xl text-sm font-bold text-amazon-text-muted hover:bg-gray-100 transition-all" 
                        onClick={() => navigate('/roles')}
                    >
                        Cancel
                    </button>
                    <button 
                        className="flex-1 lg:flex-none bg-amazon-dark text-white px-8 py-3 rounded-xl text-sm font-black shadow-xl hover:bg-amazon-navy transition-all disabled:opacity-50 flex items-center justify-center gap-2" 
                        onClick={handleSave} 
                        disabled={saving}
                    >
                        {saving ? 'Saving...' : '💾 Save Permissions'}
                    </button>
                </div>
            </div>

            {/* Warning Banner */}
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 mb-8 flex items-start gap-4">
                <span className="text-xl">💡</span>
                <p className="text-sm text-blue-900 leading-relaxed">
                    <strong className="font-black uppercase tracking-wider text-xs block mb-1">Important Rule</strong>
                    A user must have <strong>View</strong> access before they can Create, Edit, or Delete in any module. 
                    Unchecking View will automatically disable all other actions for that module to maintain system integrity.
                </p>
            </div>

            {/* Module Filter */}
            <div className="mb-6 relative">
                <input 
                    type="text" 
                    placeholder="Search modules..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-white border-2 border-gray-100 rounded-2xl p-4 pl-12 text-sm font-medium focus:border-amazon-orange outline-none transition-all shadow-sm"
                />
                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            </div>

            {/* Permission Table */}
            <div className="bg-white border border-gray-200 rounded-3xl shadow-xl overflow-hidden mb-12">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="px-8 py-5 text-[10px] font-black text-amazon-text-muted uppercase tracking-widest">Module</th>
                                <th className="px-4 py-5 text-[10px] font-black text-amazon-text-muted uppercase tracking-widest text-center">👁️ View</th>
                                <th className="px-4 py-5 text-[10px] font-black text-amazon-text-muted uppercase tracking-widest text-center">➕ Create</th>
                                <th className="px-4 py-5 text-[10px] font-black text-amazon-text-muted uppercase tracking-widest text-center">✏️ Edit</th>
                                <th className="px-4 py-5 text-[10px] font-black text-amazon-text-muted uppercase tracking-widest text-center">🗑️ Delete</th>
                                <th className="px-8 py-5 text-[10px] font-black text-amazon-text-muted uppercase tracking-widest text-center">Quick Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredModules.map(module => {
                                const p = permissions[module.id] || { view: false, create: false, update: false, delete: false };
                                const allChecked = p.view && p.create && p.update && p.delete;

                                return (
                                    <tr key={module.id} className={`transition-colors ${p.view ? 'bg-orange-50/30' : 'opacity-60 hover:opacity-100'}`}>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm ${p.view ? 'bg-amazon-orange text-amazon-dark' : 'bg-gray-100 text-gray-400'}`}>
                                                    {module.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-black text-amazon-dark tracking-tight leading-none mb-1.5 uppercase">{module.name}</div>
                                                    <div className={`text-[9px] font-black px-1.5 py-0.5 rounded inline-block ${p.view ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>
                                                        {p.view ? 'ACTIVE' : 'DISABLED'}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-6 text-center">
                                            <input type="checkbox" checked={p.view} onChange={() => handleToggle(module.id, 'view')} className="w-5 h-5 accent-amazon-orange cursor-pointer" />
                                        </td>
                                        <td className="px-4 py-6 text-center">
                                            <input type="checkbox" checked={p.create} onChange={() => handleToggle(module.id, 'create')} className="w-5 h-5 accent-amazon-orange cursor-pointer" />
                                        </td>
                                        <td className="px-4 py-6 text-center">
                                            <input type="checkbox" checked={p.update} onChange={() => handleToggle(module.id, 'update')} className="w-5 h-5 accent-amazon-orange cursor-pointer" />
                                        </td>
                                        <td className="px-4 py-6 text-center">
                                            <input type="checkbox" checked={p.delete} onChange={() => handleToggle(module.id, 'delete')} className="w-5 h-5 accent-amazon-orange cursor-pointer" />
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <button 
                                                className={`text-[10px] font-black px-4 py-1.5 rounded-full transition-all border-2 ${allChecked ? 'bg-amazon-dark text-white border-amazon-dark' : 'bg-white text-amazon-text-muted border-gray-200 hover:border-amazon-orange hover:text-amazon-orange'}`}
                                                onClick={() => {
                                                    const target = !allChecked;
                                                    setPermissions(prev => ({
                                                        ...prev,
                                                        [module.id]: { view: target, create: target, update: target, delete: target }
                                                    }));
                                                }}
                                            >
                                                {allChecked ? 'Recall' : '+ All'}
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
