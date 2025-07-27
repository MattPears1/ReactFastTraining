import React, { useState, useEffect } from 'react';
import { DollarSign, Clock, Check, X, AlertCircle, RefreshCw, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { refundApi } from '@/services/api/refunds';

interface RefundRequest {
  id: string;
  bookingReference: string;
  customerName: string;
  customerEmail: string;
  amount: string;
  reason: string;
  status: string;
  requestedAt: string;
  approvedAt?: string;
  processedAt?: string;
  approvedBy?: string;
  notes?: string;
  stripeRefundId?: string;
}

interface RefundStats {
  total: number;
  pending: number;
  approved: number;
  processed: number;
  rejected: number;
  failed: number;
  totalAmount: number;
  pendingAmount: number;
}

export const RefundDashboard: React.FC = () => {
  const [refunds, setRefunds] = useState<RefundRequest[]>([]);
  const [stats, setStats] = useState<RefundStats | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'processed' | 'rejected'>('pending');
  const [loading, setLoading] = useState(true);
  const [selectedRefund, setSelectedRefund] = useState<RefundRequest | null>(null);

  useEffect(() => {
    loadData();
  }, [filter]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [refundsData, statsData] = await Promise.all([
        refundApi.listRefunds(filter === 'all' ? undefined : filter),
        refundApi.getRefundStats(),
      ]);
      setRefunds(refundsData.refunds);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load refund data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-blue-100 text-blue-800',
      processing: 'bg-purple-100 text-purple-800',
      processed: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      failed: 'bg-gray-100 text-gray-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'processed':
        return <Check className="w-4 h-4" />;
      case 'rejected':
        return <X className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Refund Management</h1>
        <button
          onClick={loadData}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          title="Refresh"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Refunds</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Amount</p>
                <p className="text-2xl font-bold text-gray-900">£{stats.pendingAmount.toFixed(2)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-red-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Processed This Month</p>
                <p className="text-2xl font-bold text-gray-900">{stats.processed}</p>
              </div>
              <Check className="w-8 h-8 text-green-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Refunded</p>
                <p className="text-2xl font-bold text-gray-900">£{stats.totalAmount.toFixed(2)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-blue-500" />
            </div>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b">
          <nav className="flex -mb-px">
            {(['pending', 'all', 'processed', 'rejected'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  filter === tab
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>
        </div>

        {/* Refund List */}
        <div className="p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            </div>
          ) : refunds.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No {filter === 'all' ? '' : filter} refunds found
            </div>
          ) : (
            <div className="space-y-4">
              {refunds.map(refund => (
                <RefundCard 
                  key={refund.id} 
                  refund={refund} 
                  onAction={loadData}
                  onSelect={() => setSelectedRefund(refund)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Refund Details Modal */}
      {selectedRefund && (
        <RefundDetailsModal
          refund={selectedRefund}
          onClose={() => setSelectedRefund(null)}
          onAction={loadData}
        />
      )}
    </div>
  );
};

const RefundCard: React.FC<{
  refund: RefundRequest;
  onAction: () => void;
  onSelect: () => void;
}> = ({ refund, onAction, onSelect }) => {
  const [processing, setProcessing] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState('');

  const handleApprove = async () => {
    setProcessing(true);
    try {
      await refundApi.approveRefund(refund.id, { notes });
      onAction();
    } catch (error) {
      console.error('Failed to approve refund:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!notes.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }
    
    setProcessing(true);
    try {
      await refundApi.rejectRefund(refund.id, { reason: notes });
      onAction();
    } catch (error) {
      console.error('Failed to reject refund:', error);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h4 className="font-semibold">{refund.bookingReference}</h4>
            <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(refund.status)}`}>
              {getStatusIcon(refund.status)}
              {refund.status}
            </span>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
            <div>
              <p className="font-medium">Customer</p>
              <p>{refund.customerName}</p>
              <p className="text-xs">{refund.customerEmail}</p>
            </div>
            <div>
              <p className="font-medium">Amount</p>
              <p className="text-lg font-semibold text-gray-900">£{refund.amount}</p>
            </div>
            <div>
              <p className="font-medium">Reason</p>
              <p>{refund.reason}</p>
            </div>
            <div>
              <p className="font-medium">Requested</p>
              <p>{format(new Date(refund.requestedAt), 'dd/MM/yyyy HH:mm')}</p>
            </div>
          </div>

          {refund.notes && (
            <div className="mt-3 p-3 bg-gray-50 rounded text-sm">
              <p className="font-medium text-gray-700">Notes:</p>
              <p className="text-gray-600">{refund.notes}</p>
            </div>
          )}
        </div>

        <div className="ml-4 space-y-2">
          <button
            onClick={onSelect}
            className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
          >
            <FileText className="w-4 h-4" />
          </button>
          
          {refund.status === 'pending' && (
            <button
              onClick={() => setShowNotes(!showNotes)}
              className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
            >
              Process
            </button>
          )}
        </div>
      </div>

      {showNotes && refund.status === 'pending' && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-3">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add internal notes (optional for approval, required for rejection)..."
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
          <div className="flex gap-2">
            <button
              onClick={handleApprove}
              disabled={processing}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 
                       disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <span className="flex items-center justify-center gap-2">
                <Check className="w-4 h-4" />
                Approve Refund
              </span>
            </button>
            <button
              onClick={handleReject}
              disabled={processing}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 
                       disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <span className="flex items-center justify-center gap-2">
                <X className="w-4 h-4" />
                Reject
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const RefundDetailsModal: React.FC<{
  refund: RefundRequest;
  onClose: () => void;
  onAction: () => void;
}> = ({ refund, onClose, onAction }) => {
  const [details, setDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDetails();
  }, [refund.id]);

  const loadDetails = async () => {
    try {
      const data = await refundApi.getRefundDetails(refund.id);
      setDetails(data);
    } catch (error) {
      console.error('Failed to load refund details:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Refund Details</h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            </div>
          ) : details ? (
            <div className="space-y-6">
              {/* Add detailed refund information here */}
              <pre className="text-xs">{JSON.stringify(details, null, 2)}</pre>
            </div>
          ) : (
            <p className="text-center text-gray-500">Failed to load details</p>
          )}
        </div>
      </div>
    </div>
  );
};