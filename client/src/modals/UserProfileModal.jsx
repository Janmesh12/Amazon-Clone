import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';
import toast from 'react-hot-toast';

/**
 * USER PROFILE MODAL COMPONENT
 * Handles profile viewing, name editing, avatar uploads, and sign-out.
 */
export default function UserProfileModal() {
  // SESSION CONTEXT: Access user data and auth functions
  const { user, logout, isProfileModalOpen, setIsProfileModalOpen, fetchUser } = useAuth();
  const { setShowOrdersModal } = useUI();
  
  // UI LOGIC STATE: Tracks uploading status and editing mode
  const [uploading, setUploading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');

  // EFFECT: Keeps the local 'name' state in sync with the current logged-in user
  useEffect(() => {
    if (user) {
      setName(user.name || '');
    }
  }, [user]);

  // Return null if modal is closed or user is not found
  if (!isProfileModalOpen || !user) return null;

  /**
   * AVATAR UPLOAD HANDLER:
   * Uses FormData to send a binary file to the backend via a multipart request.
   */
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('avatar', file); // 'avatar' key must match server-side upload naming

    try {
      setUploading(true);
      await api.put('/api/auth/profile', formData);
      await fetchUser(); // Refresh user data to show new avatar immediately
      toast.success('Profile picture updated!');
    } catch (err) {
      toast.error('Failed to upload picture');
    } finally {
      setUploading(false);
    }
  };

  /**
   * PROFILE UPDATE HANDLER:
   * Updates only the display name in the database.
   */
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      await api.put('/api/auth/profile', { name });
      await fetchUser();
      toast.success('Profile updated successfully!');
      setEditing(false); // Switch back to 'View' mode after saving
    } catch (err) {
      toast.error(err.response?.data?.error || 'Profile update failed');
    }
  };

  /**
   * NAVIGATION HELPER:
   * Bridges the profile modal to the orders sidebar.
   */
  const handleViewOrders = () => {
    setIsProfileModalOpen(false);
    setShowOrdersModal(true);
  };

  const handleLogout = () => {
    logout();
    setIsProfileModalOpen(false);
  };

  // AVATAR RESOLVER: Checks for external (http) or internal (absolute) image paths
  const avatarSrc = user.avatarUrl 
    ? (user.avatarUrl.startsWith('http') ? user.avatarUrl : `http://localhost:5000${user.avatarUrl}`)
    : 'https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png';

  return (
    // FULL-SCREEN BACKDROP
    <div className="fixed inset-0 z-[2000] bg-black/60 flex items-center justify-center p-4">
      {/* MODAL CARD */}
      <div className="bg-white rounded w-full max-w-[500px] overflow-hidden shadow-2xl relative">
        {/* MODAL HEADER */}
        <div className="bg-amazon-gray-bg border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-[24px] font-semibold text-amazon-dark">Your Profile</h2>
          <button 
            onClick={() => setIsProfileModalOpen(false)}
            className="text-gray-500 hover:text-black font-bold text-xl"
          >
            ✕
          </button>
        </div>
        
        <div className="p-6">
          {/* TOP SECTION: Avatar and Identity */}
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6 border-b border-gray-200 pb-6 mb-6">
            {/* AVATAR WITH OVERLAY */}
            <div className="relative group w-[120px] h-[120px] shrink-0 rounded-full overflow-hidden border-2 border-gray-300">
              <img 
                src={avatarSrc} 
                alt="Profile" 
                className="w-full h-full object-cover"
              />
              {/* HIDDEN FILE INPUT: Triggered when user clicks the avatar */}
              <label className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-sm font-medium text-center px-2">
                {uploading ? 'Uploading...' : 'Change Picture'}
                <input type="file" disabled={uploading} className="hidden" accept="image/*" onChange={handleFileChange} />
              </label>
            </div>
            
            {/* IDENTITY AREA: Shows Info or Editor */}
            <div className="w-full">
              {!editing ? (
                // VIEW MODE
                <>
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="text-2xl font-bold">{user.name}</h3>
                    <button onClick={() => setEditing(true)} className="text-[13px] text-amazon-link hover:underline font-medium">Edit</button>
                  </div>
                  <div className="text-[14px] text-gray-700 bg-gray-50 p-3 rounded border border-gray-200">
                    <div className="flex justify-between border-b border-gray-200 pb-2 mb-2">
                      <span className="font-semibold">Email</span>
                      <span className="text-gray-500">{user.email}</span>
                    </div>
                    {user.mobile && (
                      <div className="flex justify-between border-b border-gray-200 pb-2 mb-2">
                        <span className="font-semibold">Mobile</span>
                        <span className="text-gray-500">{user.mobile}</span>
                      </div>
                    )}
                    <div className="flex justify-between pt-1 text-[13px] text-gray-500 italic">
                      Note: Email and Mobile cannot be changed.
                    </div>
                  </div>
                </>
              ) : (
                // EDIT MODE (Form)
                <form onSubmit={handleProfileUpdate} className="flex flex-col gap-3">
                  <div className="flex flex-col">
                    <label className="text-[13px] font-bold mb-1">Name</label>
                    <input 
                      type="text" 
                      value={name} 
                      onChange={(e) => setName(e.target.value)}
                      required
                      maxLength="50"
                      pattern="^[a-zA-Z\s]+$"
                      className="border border-gray-400 rounded px-3 py-1.5 focus:border-amazon-orange focus:ring-1 focus:outline-none"
                    />
                  </div>
                  <div className="flex gap-2 mt-2">
                    <button type="submit" className="bg-[#f0c14b] text-[#111] hover:bg-[#e2b541] rounded px-4 py-1.5 font-medium border border-[#a88734] text-sm">Save</button>
                    <button type="button" onClick={() => { setEditing(false); setName(user.name); }} className="bg-gray-100 hover:bg-gray-200 text-[#111] rounded px-4 py-1.5 font-medium border border-gray-300 text-sm">Cancel</button>
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* ACTION BUTTONS: Navigation and Session Management */}
          <div className="flex flex-col gap-4 mt-4">
            {/* LINK TO ORDERS */}
            <button 
              onClick={handleViewOrders}
              className="w-full flex items-center justify-between p-4 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">📦</span>
                <div className="text-left">
                  <div className="font-bold text-amazon-dark">Your Orders</div>
                  <div className="text-sm text-gray-500">Track, return, or buy things again</div>
                </div>
              </div>
              <span className="text-gray-400">❯</span>
            </button>
            
            {/* SIGN OUT */}
            <button 
              onClick={handleLogout}
              className="w-full flex items-center justify-center p-3 border border-red-300 text-red-600 rounded hover:bg-red-50 transition-colors font-medium mt-4"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
