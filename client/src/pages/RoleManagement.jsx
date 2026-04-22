import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";

export default function RoleManagement() {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDescription, setNewRoleDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    if (user && user.role !== "SUPER_ADMIN" && user.role !== "ADMIN") {
      toast.error("Access denied: Admin only");
      navigate("/");
    }
  }, [user, navigate]);

  useEffect(() => {
    if (user?.role === "SUPER_ADMIN" || user?.role === "ADMIN") {
      fetchRoles();
    }
  }, [user]);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/roles", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRoles(res.data.data || []);
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to fetch roles");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRole = async () => {
    if (!newRoleName.trim()) {
      toast.error("Role name is required");
      return;
    }
    try {
      setCreating(true);
      const res = await api.post(
        "/api/roles",
        { name: newRoleName, description: newRoleDescription },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRoles([...roles, res.data.data]);
      setNewRoleName("");
      setNewRoleDescription("");
      setShowCreateModal(false);
      toast.success("Role created successfully");
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to create role");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteRole = async (roleId) => {
    if (!confirm("Are you sure you want to delete this role?")) return;
    try {
      setDeletingId(roleId);
      await api.delete(`/api/roles/${roleId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRoles(roles.filter((r) => r.id !== roleId));
      toast.success("Role deleted successfully");
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to delete role");
    } finally {
      setDeletingId(null);
    }
  };

  const getPermissionSummary = (permissions) => {
    if (!permissions || permissions.length === 0) return "No permissions set";
    const withView = permissions.filter((p) => p.view).length;
    return `${withView} module${withView !== 1 ? "s" : ""} accessible`;
  };

  const getPermissionBadges = (permissions) => {
    if (!permissions) return [];
    return permissions
      .filter((p) => p.view)
      .slice(0, 4)
      .map((p) => p.module?.name || "");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-amazon-gray-bg p-8 flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-4 border-gray-200 border-top-amazon-orange rounded-full animate-spin"></div>
        <p className="text-amazon-text-muted font-bold">Loading roles...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-amazon-gray-bg p-4 md:p-8 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-5">
          <button 
            className="bg-white border border-gray-300 text-amazon-text-muted px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-50 transition-all shadow-sm" 
            onClick={() => navigate("/profile")}
          >
            ← Back
          </button>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-amazon-dark tracking-tight">🔐 Role Management</h1>
            <p className="text-sm text-amazon-text-muted font-medium mt-1">
              Create and configure roles with granular module permissions
            </p>
          </div>
        </div>
        {user?.role === "SUPER_ADMIN" && (
          <button
            className="bg-amazon-orange hover:bg-amazon-orange-hover text-amazon-dark px-6 py-3 rounded-xl text-sm font-black transition-all shadow-lg hover:-translate-y-0.5 flex items-center gap-2"
            onClick={() => setShowCreateModal(true)}
          >
            <span className="text-lg">+</span> New Role
          </button>
        )}
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col shadow-sm">
          <span className="text-3xl font-black text-amazon-dark leading-none">{roles.length}</span>
          <span className="text-[10px] uppercase font-black tracking-widest text-amazon-text-muted mt-2">Total Roles</span>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col shadow-sm">
          <span className="text-3xl font-black text-amazon-dark leading-none">
            {roles.reduce((sum, r) => sum + (r.userCount || 0), 0)}
          </span>
          <span className="text-[10px] uppercase font-black tracking-widest text-amazon-text-muted mt-2">Assigned Users</span>
        </div>
        <div className="hidden lg:flex bg-white border border-gray-200 rounded-xl p-4 flex flex-col shadow-sm">
          <span className="text-3xl font-black text-amazon-dark leading-none">
            {roles.filter((r) => r.permissions?.some((p) => p.view)).length}
          </span>
          <span className="text-[10px] uppercase font-black tracking-widest text-amazon-text-muted mt-2">Active Roles</span>
        </div>
      </div>

      {/* Roles Grid */}
      {roles.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-gray-300 rounded-3xl p-20 text-center flex flex-col items-center gap-4">
          <div className="text-6xl">🔐</div>
          <h3 className="text-xl font-black text-amazon-dark leading-none">No roles yet</h3>
          <p className="text-sm text-amazon-text-muted font-medium mb-4">Create your first dynamic role to get started</p>
          {user?.role === "SUPER_ADMIN" && (
            <button
              className="bg-amazon-orange hover:bg-amazon-orange-hover text-amazon-dark px-8 py-3 rounded-xl text-sm font-black shadow-lg"
              onClick={() => setShowCreateModal(true)}
            >
              + Create First Role
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {roles.map((role) => (
            <div key={role.id} className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col gap-4 transition-all hover:border-amazon-orange hover:shadow-xl hover:-translate-y-1">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-amazon-orange text-amazon-dark text-xl font-black rounded-xl flex items-center justify-center shadow-md shrink-0">
                  {role.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-lg font-black text-amazon-dark truncate leading-tight uppercase tracking-tight">{role.name}</h3>
                  <p className="text-xs text-amazon-text-muted mt-1 line-clamp-2 leading-relaxed">
                    {role.description || "No description provided."}
                  </p>
                </div>
              </div>

              <div className="flex justify-between items-center px-4 py-3 bg-gray-50 rounded-xl border border-gray-100">
                <span className="text-[11px] font-black text-amazon-text-muted">
                  👥 {role.userCount || 0} user{role.userCount !== 1 ? "s" : ""}
                </span>
                <span className="text-[10px] font-bold text-gray-400">
                  {new Date(role.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-black text-amazon-text-muted uppercase tracking-widest">
                  {getPermissionSummary(role.permissions)}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {getPermissionBadges(role.permissions).map((mod) => (
                    <span key={mod} className="bg-blue-50 text-blue-600 text-[9px] font-black px-2 py-1 rounded-md uppercase tracking-wider border border-blue-100">
                      {mod}
                    </span>
                  ))}
                  {role.permissions?.filter((p) => p.view).length > 4 && (
                    <span className="bg-gray-100 text-gray-500 text-[9px] font-black px-2 py-1 rounded-md">
                      +{role.permissions.filter((p) => p.view).length - 4}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t border-gray-50">
                <button
                  className="flex-1 bg-amazon-gray-bg border border-gray-300 text-amazon-text-muted text-[13px] font-black py-2.5 rounded-lg hover:border-amazon-orange hover:text-amazon-orange transition-all"
                  onClick={() => navigate(`/roles/${role.id}/edit`)}
                >
                  ✏️ Edit Permissions
                </button>
                {user?.role === "SUPER_ADMIN" && (
                  <button
                    className="bg-red-50 text-red-600 border border-red-100 p-2.5 rounded-lg hover:bg-red-600 hover:text-white transition-all disabled:opacity-50"
                    onClick={() => handleDeleteRole(role.id)}
                    disabled={deletingId === role.id}
                  >
                    {deletingId === role.id ? "..." : "🗑️"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Role Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-200" onClick={() => setShowCreateModal(false)}>
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in slide-in-from-bottom-5 duration-300" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-black text-amazon-dark tracking-tight">Create New Role</h2>
              <button
                className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-xl text-gray-400 hover:bg-red-50 hover:text-red-500 transition-all font-light"
                onClick={() => setShowCreateModal(false)}
              >
                ×
              </button>
            </div>
            <div className="p-6 flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-amazon-text-muted uppercase tracking-widest">Role Name *</label>
                <input
                  className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl p-3 text-sm focus:bg-white focus:border-amazon-orange outline-none transition-all"
                  type="text"
                  placeholder="e.g. Sales Manager, Content Editor"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreateRole()}
                  autoFocus
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-amazon-text-muted uppercase tracking-widest">Description</label>
                <textarea
                  className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl p-3 text-sm focus:bg-white focus:border-amazon-orange outline-none transition-all resize-none"
                  placeholder="What can this role do? (optional)"
                  value={newRoleDescription}
                  onChange={(e) => setNewRoleDescription(e.target.value)}
                  rows="3"
                />
              </div>
              <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-3">
                <p className="text-[11px] text-yellow-800 leading-normal font-medium">
                  💡 After creating the role, click <strong>Edit Permissions</strong> to assign module access.
                </p>
              </div>
            </div>
            <div className="p-6 bg-gray-50 border-t border-gray-100 flex gap-3">
              <button
                className="flex-1 bg-white border border-gray-200 text-amazon-text-muted py-3 rounded-xl text-sm font-bold hover:bg-gray-100 transition-all"
                onClick={() => setShowCreateModal(false)}
              >
                Cancel
              </button>
              <button
                className="flex-2 bg-amazon-orange text-amazon-dark py-3 px-6 rounded-xl text-sm font-black shadow-lg hover:shadow-amazon-orange/20 transition-all disabled:opacity-50"
                onClick={handleCreateRole}
                disabled={creating}
              >
                {creating ? "Creating..." : "Create Role"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
