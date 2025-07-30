import React from "react";
import { AdminDashboard } from "@components/admin";
import { useAuth } from "@contexts/AuthContext";
import { Navigate } from "react-router-dom";
import LoadingScreen from "@components/common/LoadingScreen";

const AdminPage: React.FC = () => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  // Check if user is authenticated and has admin role
  if (!isAuthenticated || user?.role !== "admin") {
    return <Navigate to="/login" replace />;
  }

  return <AdminDashboard />;
};

export default AdminPage;
