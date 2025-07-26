import React from 'react'
import Header from './Header'
import Footer from './Footer'
import SkipLinks from '@components/common/SkipLinks'
import SEOChecklist from '@components/common/SEOChecklist'
import { motion } from 'framer-motion'
import { SystemAlert } from '@components/ui/AlertBanner'
import { useNotifications } from '@contexts/NotificationContext'
import PageLogo from '@components/common/PageLogo'

interface LayoutProps {
  children: React.ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { systemAlert, dismissSystemAlert } = useNotifications()

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
      <Header />
      <PageLogo />
      <motion.main
        id="main-content"
        className="flex-1"
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
      <SEOChecklist />
    </div>
  )
}

export default Layout