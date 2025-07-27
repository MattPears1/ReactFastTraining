import React, { useState, useEffect } from 'react';
import {
  Mail,
  Send,
  FileText,
  Users,
  Clock,
  Plus,
  Edit2,
  Trash2,
  Eye,
  Copy,
  Search,
  Filter,
  CheckCircle,
  AlertCircle,
  Info,
  X,
  MoreVertical
} from 'lucide-react';
import { useAuth } from '@contexts/AuthContext';
import { useToast } from '@contexts/ToastContext';
import { adminDashboardApi } from '@services/api/admin-dashboard.service';
import { cn } from '@utils/cn';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  category: 'booking' | 'reminder' | 'marketing' | 'system';
  lastModified: string;
  timesUsed: number;
  status: 'active' | 'draft';
}

interface EmailHistory {
  id: string;
  template: string;
  recipients: number;
  subject: string;
  sentAt: string;
  status: 'delivered' | 'failed' | 'pending';
  openRate?: number;
}

const AdminEmailsPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  
  // State
  const [activeTab, setActiveTab] = useState<'templates' | 'compose' | 'history'>('templates');
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [emailHistory, setEmailHistory] = useState<EmailHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  
  // Compose email state
  const [composeData, setComposeData] = useState({
    recipients: 'all',
    template: '',
    subject: '',
    content: '',
    scheduledFor: ''
  });

  // Load data
  useEffect(() => {
    loadEmailData();
  }, []);

  const loadEmailData = async () => {
    try {
      setLoading(true);
      
      // Mock data - replace with actual API calls
      const mockTemplates: EmailTemplate[] = [
        {
          id: '1',
          name: 'Booking Confirmation',
          subject: 'Your First Aid Training is Confirmed',
          category: 'booking',
          lastModified: '2025-01-25T10:00:00Z',
          timesUsed: 145,
          status: 'active'
        },
        {
          id: '2',
          name: 'Course Reminder - 24 Hours',
          subject: 'Your Training is Tomorrow',
          category: 'reminder',
          lastModified: '2025-01-20T14:30:00Z',
          timesUsed: 89,
          status: 'active'
        },
        {
          id: '3',
          name: 'Certificate Ready',
          subject: 'Your First Aid Certificate is Ready',
          category: 'system',
          lastModified: '2025-01-18T09:00:00Z',
          timesUsed: 234,
          status: 'active'
        },
        {
          id: '4',
          name: 'Spring Training Offer',
          subject: 'Special Offer: 20% Off Spring Courses',
          category: 'marketing',
          lastModified: '2025-01-22T16:00:00Z',
          timesUsed: 2,
          status: 'draft'
        }
      ];
      
      const mockHistory: EmailHistory[] = [
        {
          id: '1',
          template: 'Booking Confirmation',
          recipients: 12,
          subject: 'Your First Aid Training is Confirmed',
          sentAt: '2025-01-26T14:00:00Z',
          status: 'delivered',
          openRate: 92
        },
        {
          id: '2',
          template: 'Course Reminder - 24 Hours',
          recipients: 8,
          subject: 'Your Training is Tomorrow',
          sentAt: '2025-01-26T09:00:00Z',
          status: 'delivered',
          openRate: 87
        },
        {
          id: '3',
          template: 'Custom Email',
          recipients: 45,
          subject: 'Important: Course Rescheduled',
          sentAt: '2025-01-25T16:30:00Z',
          status: 'delivered',
          openRate: 95
        }
      ];
      
      setTemplates(mockTemplates);
      setEmailHistory(mockHistory);
    } catch (error) {
      showToast('Failed to load email data', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Filter templates
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = searchTerm === '' || 
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.subject.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = filterCategory === 'all' || template.category === filterCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Send email
  const handleSendEmail = async () => {
    try {
      // Validate
      if (!composeData.subject || !composeData.content) {
        showToast('Please fill in all required fields', 'error');
        return;
      }
      
      showToast('Sending emails...', 'info');
      
      // API call to send email
      setTimeout(() => {
        showToast('Emails sent successfully', 'success');
        setShowComposeModal(false);
        setComposeData({
          recipients: 'all',
          template: '',
          subject: '',
          content: '',
          scheduledFor: ''
        });
        loadEmailData();
      }, 1500);
    } catch (error) {
      showToast('Failed to send emails', 'error');
    }
  };

  // Delete template
  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template?')) {
      return;
    }
    
    try {
      showToast('Deleting template...', 'info');
      setTemplates(templates.filter(t => t.id !== templateId));
      showToast('Template deleted successfully', 'success');
    } catch (error) {
      showToast('Failed to delete template', 'error');
    }
  };

  // Category badge
  const CategoryBadge: React.FC<{ category: EmailTemplate['category'] }> = ({ category }) => {
    const styles = {
      booking: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      reminder: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      marketing: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      system: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
    };
    
    return (
      <span className={cn(
        'inline-flex items-center px-2 py-1 text-xs font-medium rounded-full capitalize',
        styles[category]
      )}>
        {category}
      </span>
    );
  };

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Email Communications
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage email templates and send communications
            </p>
          </div>
          
          <button
            onClick={() => setShowComposeModal(true)}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            Compose Email
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Sent</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">1,847</p>
            </div>
            <Mail className="w-8 h-8 text-primary-600" />
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Avg. Open Rate</p>
              <p className="text-2xl font-bold text-green-600">89.3%</p>
            </div>
            <Eye className="w-8 h-8 text-green-600" />
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Templates</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{templates.length}</p>
            </div>
            <FileText className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Scheduled</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">3</p>
            </div>
            <Clock className="w-8 h-8 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('templates')}
              className={cn(
                "px-6 py-3 text-sm font-medium border-b-2 transition-colors",
                activeTab === 'templates'
                  ? "text-primary-600 border-primary-600"
                  : "text-gray-500 border-transparent hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              )}
            >
              Email Templates
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={cn(
                "px-6 py-3 text-sm font-medium border-b-2 transition-colors",
                activeTab === 'history'
                  ? "text-primary-600 border-primary-600"
                  : "text-gray-500 border-transparent hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              )}
            >
              Email History
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'templates' && (
            <div>
              {/* Filters */}
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search templates..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
                
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="all">All Categories</option>
                  <option value="booking">Booking</option>
                  <option value="reminder">Reminder</option>
                  <option value="marketing">Marketing</option>
                  <option value="system">System</option>
                </select>
                
                <button
                  onClick={() => setShowTemplateModal(true)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  New Template
                </button>
              </div>

              {/* Templates Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTemplates.map((template) => (
                  <div
                    key={template.id}
                    className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {template.name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {template.subject}
                        </p>
                      </div>
                      <div className="relative">
                        <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                          <MoreVertical className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mb-3">
                      <CategoryBadge category={template.category} />
                      <span className={cn(
                        "text-xs font-medium",
                        template.status === 'active' ? "text-green-600" : "text-gray-500"
                      )}>
                        {template.status === 'active' ? 'Active' : 'Draft'}
                      </span>
                    </div>
                    
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                      Used {template.timesUsed} times • Modified {new Date(template.lastModified).toLocaleDateString()}
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedTemplate(template);
                          setComposeData({
                            ...composeData,
                            template: template.id,
                            subject: template.subject,
                            content: 'Template content would be loaded here...'
                          });
                          setShowComposeModal(true);
                        }}
                        className="flex-1 px-3 py-1 text-sm bg-primary-600 text-white rounded hover:bg-primary-700"
                      >
                        Use Template
                      </button>
                      <button className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700">
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button 
                        onClick={() => handleDeleteTemplate(template.id)}
                        className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 text-red-600"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div>
              {/* History Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Email Details
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Recipients
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Sent Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Open Rate
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {emailHistory.map((email) => (
                      <tr key={email.id}>
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {email.subject}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Template: {email.template}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-900 dark:text-white">
                              {email.recipients}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                          {new Date(email.sentAt).toLocaleString()}
                        </td>
                        <td className="px-6 py-4">
                          <span className={cn(
                            "inline-flex items-center px-2 py-1 text-xs font-medium rounded-full",
                            email.status === 'delivered' && "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
                            email.status === 'pending' && "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
                            email.status === 'failed' && "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                          )}>
                            {email.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {email.openRate && (
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {email.openRate}%
                              </span>
                              <div className="w-16 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                                <div 
                                  className="bg-green-500 h-2 rounded-full" 
                                  style={{ width: `${email.openRate}%` }}
                                />
                              </div>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <button className="text-sm text-primary-600 hover:text-primary-700">
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Compose Email Modal */}
      {showComposeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Compose Email
              </h2>
              <button
                onClick={() => setShowComposeModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                {/* Recipients */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Recipients
                  </label>
                  <select
                    value={composeData.recipients}
                    onChange={(e) => setComposeData({ ...composeData, recipients: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="all">All Active Clients</option>
                    <option value="upcoming">Clients with Upcoming Bookings</option>
                    <option value="past">Past Attendees</option>
                    <option value="custom">Custom Selection</option>
                  </select>
                </div>

                {/* Template */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email Template
                  </label>
                  <select
                    value={composeData.template}
                    onChange={(e) => {
                      const template = templates.find(t => t.id === e.target.value);
                      if (template) {
                        setComposeData({
                          ...composeData,
                          template: e.target.value,
                          subject: template.subject,
                          content: 'Template content would be loaded here...'
                        });
                      }
                    }}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Select a template (optional)</option>
                    {templates.filter(t => t.status === 'active').map(template => (
                      <option key={template.id} value={template.id}>{template.name}</option>
                    ))}
                  </select>
                </div>

                {/* Subject */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Subject
                  </label>
                  <input
                    type="text"
                    value={composeData.subject}
                    onChange={(e) => setComposeData({ ...composeData, subject: e.target.value })}
                    placeholder="Enter email subject"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                {/* Content */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email Content
                  </label>
                  <textarea
                    value={composeData.content}
                    onChange={(e) => setComposeData({ ...composeData, content: e.target.value })}
                    placeholder="Write your email content here..."
                    rows={10}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                  />
                </div>

                {/* Schedule */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Schedule (optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={composeData.scheduledFor}
                    onChange={(e) => setComposeData({ ...composeData, scheduledFor: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                {/* Info Box */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                    <div className="text-sm text-blue-700 dark:text-blue-300">
                      <p className="font-medium mb-1">Email Variables</p>
                      <p>You can use the following variables in your email:</p>
                      <ul className="mt-2 space-y-1">
                        <li>• {'{'}first_name{'}'} - Recipient's first name</li>
                        <li>• {'{'}course_name{'}'} - Course name</li>
                        <li>• {'{'}course_date{'}'} - Course date</li>
                        <li>• {'{'}course_time{'}'} - Course time</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setShowComposeModal(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                Cancel
              </button>
              
              <div className="flex gap-2">
                <button
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Save as Draft
                </button>
                <button
                  onClick={handleSendEmail}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  {composeData.scheduledFor ? 'Schedule Email' : 'Send Email'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminEmailsPage;