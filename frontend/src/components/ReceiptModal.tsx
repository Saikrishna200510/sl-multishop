import React, { useState } from 'react';
import { Modal } from './Modal.js';
import { Printer, Download, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: any;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ isOpen, onClose, invoice }) => {
  const { t } = useTranslation();
  const [format, setFormat] = useState<'thermal' | 'a4'>('thermal');
  const [lang, setLang] = useState<'en' | 'te'>('en');

  if (!invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    window.open(`/api/v1/invoices/${invoice.id}/pdf?format=${format}&lang=${lang}`, '_blank');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Invoice & Receipt Preview" maxWidth="lg">
      <div className="space-y-4">
        {/* Format & Language bar */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setFormat('thermal')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg border ${
                format === 'thermal'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-slate-700 border-slate-200'
              }`}
            >
              80mm Thermal
            </button>
            <button
              onClick={() => setFormat('a4')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg border ${
                format === 'a4'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-slate-700 border-slate-200'
              }`}
            >
              A4 Standard GST
            </button>
          </div>

          <button
            onClick={() => setLang(lang === 'en' ? 'te' : 'en')}
            className="flex items-center space-x-1.5 px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{lang === 'en' ? 'తెలుగు రసీదు' : 'English Receipt'}</span>
          </button>
        </div>

        {/* Receipt Container Preview */}
        <div className="bg-slate-100 p-4 rounded-xl flex justify-center max-h-[460px] overflow-y-auto">
          <div
            className={`bg-white p-6 shadow-md border border-slate-300 font-mono text-xs text-slate-800 ${
              format === 'thermal' ? 'w-[300px]' : 'w-full max-w-[500px]'
            }`}
          >
            {/* Header */}
            <div className="text-center space-y-0.5 mb-3">
              <h2 className="font-bold text-sm tracking-tight">SL MULTISHOP</h2>
              <div className="text-[11px] text-slate-600">A Product of SL IT SOLUTIONS</div>
              <div className="text-[10px] text-slate-500">GSTIN: 37AAAAA0000A1Z5</div>
              <div className="text-[11px] font-bold border-t border-b border-dashed border-slate-400 py-1 my-2">
                {lang === 'te' ? 'టాక్స్ ఇన్వాయిస్ / TAX INVOICE' : 'TAX INVOICE'}
              </div>
            </div>

            {/* Bill Details */}
            <div className="text-[11px] space-y-0.5 mb-2">
              <div>Invoice: #{invoice.invoice_number}</div>
              <div>Date: {new Date(invoice.invoice_date || invoice.created_at).toLocaleString()}</div>
              <div>Customer: {invoice.customer?.name || 'Walk-in'}</div>
            </div>

            {/* Item Table */}
            <div className="border-t border-b border-dashed border-slate-400 py-2 my-2 space-y-1">
              <div className="flex justify-between font-bold text-[10px]">
                <span>ITEM</span>
                <span>QTY x RATE</span>
                <span>TOTAL</span>
              </div>
              {(invoice.invoice_items || []).map((item: any, idx: number) => (
                <div key={idx} className="flex justify-between text-[11px]">
                  <span className="truncate max-w-[120px]">{item.product_name}</span>
                  <span>{item.quantity} x {Number(item.unit_price).toFixed(2)}</span>
                  <span className="font-semibold">{Number(item.total_price).toFixed(2)}</span>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="space-y-1 text-[11px] text-right">
              <div>Subtotal: Rs. {Number(invoice.subtotal).toFixed(2)}</div>
              <div>GST Tax: Rs. {Number(invoice.tax_amount).toFixed(2)}</div>
              {Number(invoice.round_off) !== 0 && (
                <div>Round off: Rs. {Number(invoice.round_off).toFixed(2)}</div>
              )}
              <div className="text-sm font-bold border-t border-slate-800 pt-1 mt-1 text-slate-900">
                GRAND TOTAL: Rs. {Number(invoice.total_amount).toFixed(2)}
              </div>
              <div className="text-[10px] text-slate-600">
                Paid: Rs. {Number(invoice.paid_amount).toFixed(2)}
              </div>
            </div>

            {/* Telugu / English Greeting */}
            <div className="text-center text-[10px] text-slate-600 border-t border-dashed border-slate-400 pt-3 mt-4">
              {lang === 'te' ? (
                <>
                  <p className="font-semibold">ధన్యవాదాలు! మరల సందర్శించండి.</p>
                  <p>SL IT SOLUTIONS ద్వారా అందించబడింది</p>
                </>
              ) : (
                <>
                  <p className="font-semibold">Thank you! Visit again.</p>
                  <p>Powered by SL IT SOLUTIONS</p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-3 pt-2">
          <button
            onClick={handleDownloadPdf}
            className="flex items-center space-x-1.5 px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Download PDF</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow transition"
          >
            <Printer className="w-4 h-4" />
            <span>{t('pos.printReceipt')}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
