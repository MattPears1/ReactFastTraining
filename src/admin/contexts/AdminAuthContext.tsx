import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import { useNavigate } from "react-router-dom";
import { adminAuthService } from "../services/admin-auth.service";

interface AdminUser {
  id: number;
  email: string;
  name: string;
  role: string;
  lastLogin: Date;
  permissions: string[];
}

interface AdminAuthContextType {
  user: AdminUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  checkPermission: (permission: string) => boolean;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(
  undefined,
);

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error("useAdminAuth must be used within AdminAuthProvider");
  }
  return context;
};

interface AdminAuthProviderProps {
  children: React.ReactNode;
}

export const AdminAuthProvider: React.FC<AdminAuthProviderProps> = ({
  children,
}) => {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = localStorage.getItem("adminAccessToken");
        if (token) {
          const currentUser = await adminAuthService.getCurrentUser();
          setUser(currentUser);
        }
      } catch (error) {
        console.error("Failed to initialize auth:", error);
        localStorage.removeItem("adminAccessToken");
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  // Set up token refresh
  useEffect(() => {
    if (!user) return;

    // Refresh token 5 minutes before expiry
    const refreshInterval = setInterval(
      async () => {
        try {
          await refreshToken();
        } catch (error) {
          console.error("Token refresh failed:", error);
          await logout();
        }
      },
      10 * 60 * 1000,
    ); // 10 minutes

    return () => clearInterval(refreshInterval);
  }, [user]);

  const login = useCallback(
    async (email: string, password: string) => {
      setIsLoading(true);
      try {
        const response = await adminAuthService.login(email, password);
        localStorage.setItem("adminAccessToken", response.accessToken);
        setUser(response.user);
        navigate("/admin/dashboard");
      } catch (error) {
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [navigate],
  );

  const logout = useCallback(async () => {
    try {
      await adminAuthService.logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      localStorage.removeItem("adminAccessToken");
      setUser(null);
      navigate("/admin/login");
    }
  }, [navigate]);

  const refreshToken = useCallback(async () => {
    try {
      const response = await adminAuthService.refreshToken();
      localStorage.setItem("adminAccessToken", response.accessToken);
    } catch (error) {
      console.error("Token refresh failed:", error);
      throw error;
    }
  }, []);

  const checkPermission = useCallback(
    (permission: string): boolean => {
      if (!user) return false;
      if (user.role === "admin") return true; // Admin has all permissions
      return user.permissions.includes(permission);
    },
    [user],
  );

  const value: AdminAuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    refreshToken,
    checkPermission,
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
};
