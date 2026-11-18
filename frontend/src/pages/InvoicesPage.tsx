import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { DataTable, Column } from '../components/DataTable.js';
import { ReceiptModal } from '../components/ReceiptModal.js';
import { Printer, Download, XCircle } from 'lucide-react';

export const InvoicesPage: React.FC = () => {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  const loadInvoices = async () => {
    setLoading(true);
    try {
      const res = await api.get<any[]>('/invoices', { limit: 100 });
      if (res.data) setInvoices(res.data);
    } catch (err) {
      console.error('Failed to load invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, []);

  const handlePrintClick = async (invoiceId: string) => {
    try {
      const res = await api.get<any>(`/invoices/${invoiceId}`);
      if (res.data) {
        setSelectedInvoice(res.data);
        setShowReceiptModal(true);
      }
    } catch (err) {
      alert('Could not fetch invoice details');
    }
  };

  const handleCancelClick = async (invoiceId: string) => {
    if (!confirm('Are you sure you want to void this invoice? All items will be restocked.')) return;
    try {
      await api.post(`/invoices/${invoiceId}/cancel`, { reason: 'Voided by manager' });
      alert('Invoice cancelled and items restocked successfully');
      loadInvoices();
    } catch (err: any) {
      alert(err.message || 'Failed to cancel invoice');
    }
  };

  const columns: Column<any>[] = [
    {
      header: 'Invoice #',
      render: (row) => (
        <span className="font-mono font-bold text-blue-600">{row.invoice_number}</span>
      )
    },
    {
      header: 'Date & Time',
      render: (row) => new Date(row.invoice_date).toLocaleString('en-IN')
    },
    {
      header: 'Customer',
      render: (row) => row.customer?.name || 'Walk-in'
    },
    {
      header: 'Branch',
      render: (row) => row.branch?.name
    },
    {
      header: 'Total Amount',
      render: (row) => (
        <span className="font-bold text-slate-900">₹{Number(row.total_amount).toFixed(2)}</span>
      )
    },
    {
      header: 'Paid Amount',
      render: (row) => `₹${Number(row.paid_amount).toFixed(2)}`
    },
    {
      header: 'Status',
      render: (row) => (
        <span
          className={`px-2 py-0.5 rounded text-[11px] font-bold ${
            row.status === 'PAID'
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : row.status === 'CANCELLED'
              ? 'bg-rose-50 text-rose-700 border border-rose-200'
              : 'bg-amber-50 text-amber-700 border border-amber-200'
          }`}
        >
          {row.status}
        </span>
      )
    },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handlePrintClick(row.id)}
            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
            title="Reprint Receipt / View"
          >
            <Printer className="w-4 h-4" />
          </button>
          <a
            href={`/api/v1/invoices/${row.id}/pdf?format=thermal`}
            target="_blank"
            rel="noreferrer"
            className="p-1.5 text-slate-600 hover:bg-slate-100 rounded"
            title="Download PDF"
          >
            <Download className="w-4 h-4" />
          </a>
          {row.status !== 'CANCELLED' && (
            <button
              onClick={() => handleCancelClick(row.id)}
              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded"
              title="Cancel Invoice & Restock"
            >
              <XCircle className="w-4 h-4" />
            </button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Sales Invoices & Receipts</h1>
        <p className="text-xs text-slate-500">View, reprint, download PDF, or void sales bills</p>
      </div>

      <DataTable
        columns={columns}
        data={invoices}
        loading={loading}
        searchPlaceholder="Search invoice #, customer name..."
      />

      <ReceiptModal
        isOpen={showReceiptModal}
        onClose={() => setShowReceiptModal(false)}
        invoice={selectedInvoice}
      />
    </div>
  );
};
