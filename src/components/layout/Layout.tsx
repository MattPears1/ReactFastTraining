import React from "react";
import Header from "./Header";
import Footer from "./Footer";
import SkipLinks from "@components/common/SkipLinks";
import { motion } from "framer-motion";
import { SystemAlert } from "@components/ui/AlertBanner";
import { useNotifications } from "@contexts/NotificationContext";
import { SessionTimeoutWarning } from "@components/auth/SessionTimeoutWarning";
import { useAuth } from "@contexts/AuthContext";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { systemAlert, dismissSystemAlert } = useNotifications();
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900">
      <SkipLinks />
      {systemAlert && (
        <SystemAlert
          show={true}
          type={systemAlert.type}
          title={systemAlert.title}
          message={systemAlert.message}
          persistent={systemAlert.persistent}
          actions={systemAlert.actions}
          onDismiss={systemAlert.persistent ? undefined : dismissSystemAlert}
        />
      )}
      {isAuthenticated && <SessionTimeoutWarning />}
      <Header />
      <motion.main
        id="main-content"
        className="flex-1 pt-16 sm:pt-18 md:pt-20 lg:pt-24"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        role="main"
        aria-label="Main content"
      >
        {children}
      </motion.main>
      <Footer />
    </div>
  );
};

export default Layout;
