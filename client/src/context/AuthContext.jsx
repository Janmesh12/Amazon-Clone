import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import api from "../api/axios";
import toast from "react-hot-toast";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem("amazon_token"));
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Guard against double-invocation in React StrictMode
  const fetchingRef = useRef(false);

  useEffect(() => {
    if (token) {
      localStorage.setItem("amazon_token", token);
      if (!fetchingRef.current) {
        fetchingRef.current = true;
        fetchUser().finally(() => {
          fetchingRef.current = false;
        });
      }
    } else {
      localStorage.removeItem("amazon_token");
      setUser(null);
      setLoading(false);
    }
  }, [token]); // eslint-disable-line

  // ✅ Exported — used by ProfilePage after avatar/profile update
  const fetchUser = useCallback(async () => {
    try {
      const res = await api.get("/api/auth/me");
      setUser(res.data.user);
    } catch {
      // Token invalid/expired — clear silently
      localStorage.removeItem("amazon_token");
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    try {
      const res = await api.post("/api/auth/login", { email, password });
      const { token: newToken, user: newUser } = res.data;
      localStorage.setItem("amazon_token", newToken);
      setToken(newToken);
      setUser(newUser);
      toast.success(`Welcome back, ${newUser.name.split(" ")[0]}! 👋`);
      return true;
    } catch (err) {
      toast.error(err.response?.data?.error || "Invalid email or password");
      return false;
    }
  };

  const register = async (name, email, password, mobile) => {
    try {
      const res = await api.post("/api/auth/signup", { name, email, password, mobile });
      const { token: newToken, user: newUser } = res.data;
      localStorage.setItem("amazon_token", newToken);
      setToken(newToken);
      setUser(newUser);
      toast.success("Account created successfully! 🎉");
      return true;
    } catch (err) {
      toast.error(err.response?.data?.error || "Registration failed");
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem("amazon_token");
    setToken(null);
    setUser(null);
    toast.success("Logged out successfully");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        register,
        fetchUser,
        isAuthModalOpen,
        setIsAuthModalOpen,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);