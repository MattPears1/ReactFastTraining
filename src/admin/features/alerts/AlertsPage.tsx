import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  AlertTriangle, 
  Info, 
  AlertCircle, 
  CheckCircle,
  Clock,
  X,
  RefreshCw,
  Filter,
  Search,
  ChevronDown
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { cn } from '@/utils/cn';
import { adminApi } from '@/services/admin.api';
import { toast } from 'react-hot-toast';

interface AdminAlert {
  id: number;
  alertType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  metadata: Record<string, any>;
  status: string;
  createdAt: string;
  acknowledgedAt?: string;
  acknowledgedBy?: number;
  resolvedAt?: string;
  resolvedBy?: number;
  notes?: string;
}

const severityConfig = {
  low: {
    icon: Info,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
  },
  medium: {
    icon: AlertCircle,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
  },
  high: {
    icon: AlertTriangle,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
  },
  critical: {
    icon: AlertTriangle,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
  },
};

const alertTypeLabels: Record<string, string> = {
  duplicate_booking_attempt: 'Duplicate Booking',
  suspicious_booking_pattern: 'Suspicious Pattern',
  large_group_booking: 'Large Group',
  session_nearly_full: 'Session Nearly Full',
  booking_validation_failure: 'Validation Failed',
  payment_mismatch: 'Payment Issue',
  capacity_exceeded: 'Capacity Issue',
};

export function AlertsPage() {
  const [filter, setFilter] = useState<'all' | 'unread' | 'acknowledged' | 'resolved'>('unread');
  const [severityFilter, setSeverityFilter] = useState<'all' | 'low' | 'medium' | 'high' | 'critical'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedAlerts, setExpandedAlerts] = useState<Set<number>>(new Set());
  
  const queryClient = useQueryClient();

  // Fetch alerts
  const { data: alerts = [], isLoading, refetch } = useQuery({
    queryKey: ['admin-alerts', filter, severityFilter],
    queryFn: async () => {
      let url = '/api/admin/alerts';
      const params = new URLSearchParams();
      
      if (filter !== 'all') {
        params.append('status', filter);
      }
      if (severityFilter !== 'all') {
        params.append('severity', severityFilter);
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await adminApi.get(url);
      return response.data as AdminAlert[];
    },
  });

  // Acknowledge alert mutation
  const acknowledgeMutation = useMutation({
    mutationFn: async (alertId: number) => {
      await adminApi.post(`/api/admin/alerts/${alertId}/acknowledge`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-alerts'] });
      toast.success('Alert acknowledged');
    },
  });

  // Resolve alert mutation
  const resolveMutation = useMutation({
    mutationFn: async ({ alertId, notes }: { alertId: number; notes: string }) => {
      await adminApi.post(`/api/admin/alerts/${alertId}/resolve`, { notes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-alerts'] });
      toast.success('Alert resolved');
    },
  });

  const toggleExpanded = (alertId: number) => {
    setExpandedAlerts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(alertId)) {
        newSet.delete(alertId);
      } else {
        newSet.add(alertId);
      }
      return newSet;
    });
  };

  const filteredAlerts = alerts.filter(alert => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        alert.title.toLowerCase().includes(query) ||
        alert.description.toLowerCase().includes(query) ||
        alert.alertType.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const getAlertCounts = () => {
    const counts = {
      all: alerts.length,
      unread: alerts.filter(a => a.status === 'unread').length,
      acknowledged: alerts.filter(a => a.status === 'acknowledged').length,
      resolved: alerts.filter(a => a.status === 'resolved').length,
    };
    return counts;
  };

  const counts = getAlertCounts();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Admin Alerts</h1>
        <button
          onClick={() => refetch()}
          className="btn btn-secondary inline-flex items-center gap-2"
        >
          <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 space-y-4">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-2 border-b">
          {(['all', 'unread', 'acknowledged', 'resolved'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={cn(
                "px-4 py-2 font-medium transition-colors relative",
                filter === status
                  ? "text-primary-600 border-b-2 border-primary-600"
                  : "text-gray-600 hover:text-gray-900"
              )}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
              <span className="ml-2 text-sm text-gray-500">({counts[status]})</span>
            </button>
          ))}
        </div>

        {/* Additional Filters */}
        <div className="flex items-center gap-4">
          {/* Severity Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value as any)}
              className="form-select text-sm"
            >
              <option value="all">All Severities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search alerts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-input pl-10 text-sm w-full"
            />
          </div>
        </div>
      </div>

      {/* Alerts List */}
      {isLoading ? (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading alerts...</p>
        </div>
      ) : filteredAlerts.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No alerts found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAlerts.map((alert) => {
            const config = severityConfig[alert.severity];
            const Icon = config.icon;
            const isExpanded = expandedAlerts.has(alert.id);

            return (
              <div
                key={alert.id}
                className={cn(
                  "bg-white rounded-lg shadow-sm border-l-4 transition-all",
                  config.borderColor
                )}
              >
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={cn("p-2 rounded-lg", config.bgColor)}>
                        <Icon className={cn("w-5 h-5", config.color)} />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{alert.title}</h3>
                          <span className={cn(
                            "px-2 py-0.5 text-xs font-medium rounded-full",
                            config.bgColor,
                            config.color
                          )}>
                            {alert.severity.toUpperCase()}
                          </span>
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                            {alertTypeLabels[alert.alertType] || alert.alertType}
                          </span>
                        </div>
                        
                        <p className="text-gray-600 text-sm mb-2">{alert.description}</p>
                        
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true })}
                          </span>
                          
                          {alert.acknowledgedAt && (
                            <span>
                              Acknowledged {formatDistanceToNow(new Date(alert.acknowledgedAt), { addSuffix: true })}
                            </span>
                          )}
                          
                          {alert.resolvedAt && (
                            <span className="flex items-center gap-1 text-green-600">
                              <CheckCircle className="w-3 h-3" />
                              Resolved {formatDistanceToNow(new Date(alert.resolvedAt), { addSuffix: true })}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {alert.status === 'unread' && (
                        <button
                          onClick={() => acknowledgeMutation.mutate(alert.id)}
                          className="btn btn-sm btn-secondary"
                          disabled={acknowledgeMutation.isPending}
                        >
                          Acknowledge
                        </button>
                      )}
                      
                      {alert.status === 'acknowledged' && (
                        <button
                          onClick={() => resolveMutation.mutate({ alertId: alert.id, notes: '' })}
                          className="btn btn-sm btn-primary"
                          disabled={resolveMutation.isPending}
                        >
                          Resolve
                        </button>
                      )}
                      
                      <button
                        onClick={() => toggleExpanded(alert.id)}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        <ChevronDown className={cn(
                          "w-4 h-4 transition-transform",
                          isExpanded && "rotate-180"
                        )} />
                      </button>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <h4 className="font-medium text-sm mb-2">Additional Details</h4>
                      <div className="bg-gray-50 rounded p-3 text-sm">
                        <pre className="whitespace-pre-wrap text-xs">
                          {JSON.stringify(alert.metadata, null, 2)}
                        </pre>
                      </div>
                      
                      {alert.notes && (
                        <div className="mt-3">
                          <h4 className="font-medium text-sm mb-1">Resolution Notes</h4>
                          <p className="text-sm text-gray-600">{alert.notes}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}