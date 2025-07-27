import React, { useState, useEffect } from 'react';
import { X, Download, Mail, Printer, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { invoiceApi } from '@/services/api/invoices';

interface InvoicePreviewProps {
  invoiceId: string;
  isOpen: boolean;
  onClose: () => void;
}

interface InvoiceDetails {
  id: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate?: string;
  subtotal: string;
  taxAmount: string;
  totalAmount: string;
  status: string;
  pdfUrl?: string;
  booking: {
    reference: string;
    courseType: string;
    sessionDate: string;
    numberOfAttendees: number;
  };
  customer: {
    name: string;
    email: string;
  };
  attendees?: Array<{
    name: string;
    email: string;
  }>;
}

export const InvoicePreview: React.FC<InvoicePreviewProps> = ({
  invoiceId,
  isOpen,
  onClose,
}) => {
  const [invoice, setInvoice] = useState<InvoiceDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [resending, setResending] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && invoiceId) {
      loadInvoice();
    }
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [invoiceId, isOpen]);

  const loadInvoice = async () => {
    try {
      setLoading(true);
      const data = await invoiceApi.getInvoice(invoiceId);
      setInvoice(data);
      
      // Load PDF preview
      const pdfBlob = await invoiceApi.downloadInvoice(invoiceId);
      const url = URL.createObjectURL(pdfBlob);
      setPdfUrl(url);
    } catch (error) {
      console.error('Failed to load invoice:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!invoice) return;
    
    try {
      setDownloading(true);
      const blob = await invoiceApi.downloadInvoice(invoiceId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${invoice.invoiceNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to download invoice:', error);
      alert('Failed to download invoice. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  const handleResend = async () => {
    try {
      setResending(true);
      await invoiceApi.resendInvoice(invoiceId);
      alert('Invoice has been sent to your email address.');
    } catch (error) {
      console.error('Failed to resend invoice:', error);
      alert('Failed to resend invoice. Please try again.');
    } finally {
      setResending(false);
    }
  };

  const handlePrint = () => {
    if (pdfUrl) {
      const printWindow = window.open(pdfUrl, '_blank');
      if (printWindow) {
        printWindow.addEventListener('load', () => {
          printWindow.print();
        });
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-6xl w-full h-[90vh] flex">
        {/* Left Panel - Invoice Details */}
        <div className="w-1/3 border-r p-6 overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Invoice Details</h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {loading ? (
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="space-y-2">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-3 bg-gray-100 rounded"></div>
                ))}
              </div>
            </div>
          ) : invoice ? (
            <div className="space-y-6">
              {/* Invoice Header */}
              <div>
                <h3 className="font-semibold text-lg mb-2">{invoice.invoiceNumber}</h3>
                <p className="text-sm text-gray-600">
                  Issued: {format(new Date(invoice.issueDate), 'dd MMM yyyy')}
                </p>
                <span className={`inline-block mt-2 px-2 py-1 text-xs font-medium rounded-full ${
                  invoice.status === 'paid' ? 'bg-green-100 text-green-800' :
                  invoice.status === 'void' ? 'bg-gray-100 text-gray-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {invoice.status.toUpperCase()}
                </span>
              </div>

              {/* Customer Details */}
              <div>
                <h4 className="font-medium mb-2">Customer</h4>
                <p className="text-sm">{invoice.customer.name}</p>
                <p className="text-sm text-gray-600">{invoice.customer.email}</p>
              </div>

              {/* Booking Details */}
              <div>
                <h4 className="font-medium mb-2">Booking Details</h4>
                <div className="text-sm space-y-1">
                  <p><span className="text-gray-600">Reference:</span> {invoice.booking.reference}</p>
                  <p><span className="text-gray-600">Course:</span> {invoice.booking.courseType}</p>
                  <p><span className="text-gray-600">Date:</span> {format(new Date(invoice.booking.sessionDate), 'dd/MM/yyyy')}</p>
                  <p><span className="text-gray-600">Attendees:</span> {invoice.booking.numberOfAttendees}</p>
                </div>
              </div>

              {/* Attendee List */}
              {invoice.attendees && invoice.attendees.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Attendees</h4>
                  <ul className="text-sm space-y-1">
                    {invoice.attendees.map((attendee, index) => (
                      <li key={index} className="text-gray-600">
                        • {attendee.name}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Financial Summary */}
              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Payment Summary</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span>£{invoice.subtotal}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">VAT (0%)</span>
                    <span>£{invoice.taxAmount}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-base pt-2 border-t">
                    <span>Total</span>
                    <span>£{invoice.totalAmount}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-4">
                <button
                  onClick={handleDownload}
                  disabled={downloading}
                  className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 
                           disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {downloading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                      Downloading...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      Download PDF
                    </>
                  )}
                </button>

                <button
                  onClick={handleResend}
                  disabled={resending}
                  className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg 
                           hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed 
                           transition-colors flex items-center justify-center gap-2"
                >
                  {resending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4" />
                      Email Invoice
                    </>
                  )}
                </button>

                <button
                  onClick={handlePrint}
                  className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg 
                           hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  Print Invoice
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">Failed to load invoice</p>
            </div>
          )}
        </div>

        {/* Right Panel - PDF Preview */}
        <div className="flex-1 bg-gray-100 p-4">
          <div className="h-full bg-white rounded-lg shadow-inner overflow-hidden">
            {loading ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
                  <p className="text-gray-500">Loading invoice...</p>
                </div>
              </div>
            ) : pdfUrl ? (
              <iframe
                src={pdfUrl}
                className="w-full h-full"
                title="Invoice PDF Preview"
              />
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Unable to load PDF preview</p>
                  <button
                    onClick={handleDownload}
                    className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    Download PDF Instead
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};