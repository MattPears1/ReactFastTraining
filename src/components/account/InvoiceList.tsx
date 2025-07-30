import React, { useState, useEffect } from "react";
import {
  FileText,
  Download,
  Mail,
  Eye,
  Calendar,
  RefreshCw,
} from "lucide-react";
import { format } from "date-fns";
import { invoiceApi } from "@/services/api/invoices";
import { InvoicePreview } from "./InvoicePreview";

interface Invoice {
  id: string;
  invoiceNumber: string;
  bookingReference: string;
  amount: string;
  status: string;
  issueDate: string;
  pdfUrl?: string;
  sentAt?: string;
}

interface InvoiceListProps {
  className?: string;
}

export const InvoiceList: React.FC<InvoiceListProps> = ({ className = "" }) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [resending, setResending] = useState<string | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await invoiceApi.getUserInvoices();
      setInvoices(data.invoices);
    } catch (err) {
      console.error("Failed to load invoices:", err);
      setError("Failed to load invoices. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const downloadInvoice = async (invoiceId: string, invoiceNumber: string) => {
    try {
      setDownloading(invoiceId);
      const blob = await invoiceApi.downloadInvoice(invoiceId);

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-${invoiceNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error("Failed to download invoice:", err);
      alert("Failed to download invoice. Please try again.");
    } finally {
      setDownloading(null);
    }
  };

  const resendInvoice = async (invoiceId: string) => {
    try {
      setResending(invoiceId);
      await invoiceApi.resendInvoice(invoiceId);
      alert("Invoice has been sent to your email address.");
    } catch (err) {
      console.error("Failed to resend invoice:", err);
      alert("Failed to resend invoice. Please try again.");
    } finally {
      setResending(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusStyles = {
      paid: "bg-green-100 text-green-800",
      void: "bg-gray-100 text-gray-800",
      refunded: "bg-red-100 text-red-800",
      draft: "bg-yellow-100 text-yellow-800",
    };

    return (
      <span
        className={`px-2 py-1 text-xs font-medium rounded-full ${statusStyles[status as keyof typeof statusStyles] || "bg-gray-100 text-gray-800"}`}
      >
        {status.toUpperCase()}
      </span>
    );
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow ${className}`}>
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-gray-100 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={`bg-white rounded-lg shadow ${className}`}>
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Invoices</h3>
            <button
              onClick={loadInvoices}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {error ? (
            <div className="text-center py-8">
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={loadInvoices}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : invoices.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No invoices found</p>
              <p className="text-sm text-gray-400 mt-1">
                Invoices will appear here after you make a booking
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {invoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        <FileText className="w-6 h-6 text-gray-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h4 className="font-medium">
                            {invoice.invoiceNumber}
                          </h4>
                          {getStatusBadge(invoice.status)}
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p>Booking: {invoice.bookingReference}</p>
                          <p className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {format(new Date(invoice.issueDate), "dd MMM yyyy")}
                          </p>
                        </div>
                        <p className="text-lg font-semibold mt-2">
                          £{invoice.amount}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedInvoice(invoice.id)}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title="View Invoice"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() =>
                          downloadInvoice(invoice.id, invoice.invoiceNumber)
                        }
                        disabled={downloading === invoice.id}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors 
                                 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Download PDF"
                      >
                        {downloading === invoice.id ? (
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-600" />
                        ) : (
                          <Download className="w-5 h-5" />
                        )}
                      </button>
                      <button
                        onClick={() => resendInvoice(invoice.id)}
                        disabled={resending === invoice.id}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors
                                 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Resend Email"
                      >
                        {resending === invoice.id ? (
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-600" />
                        ) : (
                          <Mail className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {invoice.sentAt && (
                    <div className="mt-3 pt-3 border-t text-xs text-gray-500">
                      Last sent:{" "}
                      {format(new Date(invoice.sentAt), "dd/MM/yyyy HH:mm")}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Invoice Preview Modal */}
      {selectedInvoice && (
        <InvoicePreview
          invoiceId={selectedInvoice}
          isOpen={true}
          onClose={() => setSelectedInvoice(null)}
        />
      )}
    </>
  );
};
