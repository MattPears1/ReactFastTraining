import React from "react";
import { Mail, Plus, Filter, Search } from "lucide-react";
import { useAuth } from "@contexts/AuthContext";
import { useToast } from "@contexts/ToastContext";
import { cn } from "@utils/cn";

// Components
import { EmailTemplates } from "./emails/components/EmailTemplates";
import { EmailCompose } from "./emails/components/EmailCompose";
import { EmailHistory } from "./emails/components/EmailHistory";

// Hooks and types
import { useEmailData } from "./emails/hooks/useEmailData";
import { TabType, EmailFormData } from "./emails/types";

const AdminEmailsPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  
  const {
    activeTab,
    setActiveTab,
    templates,
    history,
    recipients,
    loading,
    filters,
    setFilters,
    toggleRecipient,
    selectAllRecipients,
    loadData,
  } = useEmailData();

  const handleSendEmail = async (data: EmailFormData, recipientIds: string[]) => {
    try {
      // TODO: Implement email sending
      console.log("Sending email:", data, "to:", recipientIds);
      showToast("Email sent successfully", "success");
      setActiveTab("history");
      loadData();
    } catch (error) {
      showToast("Failed to send email", "error");
    }
  };

  const handleEditTemplate = (template: any) => {
    console.log("Edit template:", template);
    // TODO: Implement template editing
  };

  const handleDuplicateTemplate = (template: any) => {
    console.log("Duplicate template:", template);
    // TODO: Implement template duplication
  };

  const handleDeleteTemplate = (template: any) => {
    console.log("Delete template:", template);
    // TODO: Implement template deletion
  };

  const handleViewEmailDetails = (email: any) => {
    console.log("View email details:", email);
    // TODO: Implement email details view
  };

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: "templates", label: "Templates", icon: <Mail className="w-4 h-4" /> },
    { id: "compose", label: "Compose", icon: <Plus className="w-4 h-4" /> },
    { id: "history", label: "History", icon: <Mail className="w-4 h-4" /> },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Email Management
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Manage email templates and send communications
              </p>
            </div>
            <button className="btn btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" />
              New Template
            </button>
          </div>

          {/* Tabs */}
          <div className="mt-4 border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm",
                    activeTab === tab.id
                      ? "border-primary-500 text-primary-600 dark:text-primary-400"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                  )}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-gray-50 dark:bg-gray-900 px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              placeholder="Search emails..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800"
            />
          </div>
          {activeTab !== "compose" && (
            <button className="btn btn-outline flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filters
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 sm:px-6 lg:px-8 py-6 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
          </div>
        ) : (
          <>
            {activeTab === "templates" && (
              <EmailTemplates
                templates={templates}
                filters={filters}
                onEdit={handleEditTemplate}
                onDuplicate={handleDuplicateTemplate}
                onDelete={handleDeleteTemplate}
              />
            )}

            {activeTab === "compose" && (
              <EmailCompose
                templates={templates}
                recipients={recipients}
                onSend={handleSendEmail}
                onToggleRecipient={toggleRecipient}
                onSelectAllRecipients={selectAllRecipients}
              />
            )}

            {activeTab === "history" && (
              <EmailHistory
                history={history}
                filters={filters}
                onViewDetails={handleViewEmailDetails}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminEmailsPage;