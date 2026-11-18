import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Trash2, Plus, Minus, UserPlus, CreditCard, Banknote, Smartphone, Split, BookOpen, Check } from 'lucide-react';

export interface CartItem {
  productId: string;
  variantId?: string;
  productName: string;
  sku: string;
  hsnCode?: string;
  unitCode: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  taxRate: number;
}

export interface CustomerOption {
  id: string;
  name: string;
  phone?: string;
  credit_limit: number;
  current_balance: number;
}

interface POSCartProps {
  items: CartItem[];
  customers: CustomerOption[];
  selectedCustomer: CustomerOption | null;
  onSelectCustomer: (cust: CustomerOption | null) => void;
  onOpenCustomerModal: () => void;
  onUpdateQuantity: (index: number, qty: number) => void;
  onRemoveItem: (index: number) => void;
  onClearCart: () => void;
  onCheckout: (data: {
    paymentMethod: 'CASH' | 'UPI' | 'CARD' | 'SPLIT' | 'CREDIT';
    payments: Array<{ method: any; amount: number; referenceNumber?: string }>;
    invoiceDiscount: number;
  }) => void;
  isProcessing: boolean;
}

export const POSCart: React.FC<POSCartProps> = ({
  items,
  customers,
  selectedCustomer,
  onSelectCustomer,
  onOpenCustomerModal,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onCheckout,
  isProcessing
}) => {
  const { t } = useTranslation();
  const [invoiceDiscount, setInvoiceDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'UPI' | 'CARD' | 'SPLIT' | 'CREDIT'>('CASH');
  const [cashTendered, setCashTendered] = useState<number | ''>('');
  const [upiReference, setUpiReference] = useState('');

  // Computations
  let grossSubtotal = 0;
  let itemDiscountsTotal = 0;
  let totalTax = 0;

  items.forEach((item) => {
    const gross = item.quantity * item.unitPrice;
    const discount = (gross * item.discountPercent) / 100;
    const taxable = gross - discount;
    const tax = (taxable * item.taxRate) / 100;

    grossSubtotal += gross;
    itemDiscountsTotal += discount;
    totalTax += tax;
  });

  const unroundedTotal = Math.max(0, grossSubtotal - itemDiscountsTotal - invoiceDiscount + totalTax);
  const grandTotal = Math.round(unroundedTotal);
  const roundOff = Number((grandTotal - unroundedTotal).toFixed(2));

  const changeDue = typeof cashTendered === 'number' && cashTendered > grandTotal
    ? Number((cashTendered - grandTotal).toFixed(2))
    : 0;

  const handleCheckoutClick = () => {
    if (items.length === 0) return;

    let payments = [];
    if (paymentMethod === 'CASH') {
      payments.push({ method: 'CASH', amount: grandTotal });
    } else if (paymentMethod === 'UPI') {
      payments.push({ method: 'UPI', amount: grandTotal, referenceNumber: upiReference });
    } else if (paymentMethod === 'CARD') {
      payments.push({ method: 'CARD', amount: grandTotal });
    } else if (paymentMethod === 'CREDIT') {
      payments.push({ method: 'CREDIT', amount: grandTotal });
    } else {
      // Split default 50/50
      const half = Math.floor(grandTotal / 2);
      payments.push({ method: 'CASH', amount: half });
      payments.push({ method: 'UPI', amount: grandTotal - half, referenceNumber: upiReference });
    }

    onCheckout({
      paymentMethod,
      payments,
      invoiceDiscount
    });
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl flex flex-col h-full overflow-hidden shadow-sm">
      {/* Cart Header & Customer Selector */}
      <div className="p-4 border-b border-slate-200 bg-slate-50 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-800 text-sm">{t('pos.cart')}</span>
            <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-0.5 rounded-full">
              {items.length} items
            </span>
          </div>
          {items.length > 0 && (
            <button
              onClick={onClearCart}
              className="text-xs text-rose-600 hover:text-rose-700 font-medium"
            >
              Clear Cart
            </button>
          )}
        </div>

        {/* Customer Select / Add */}
        <div className="flex items-center space-x-2">
          <select
            className="flex-1 text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
            value={selectedCustomer?.id || ''}
            onChange={(e) => {
              const cust = customers.find((c) => c.id === e.target.value) || null;
              onSelectCustomer(cust);
            }}
          >
            <option value="">Walk-in Customer (Cash/UPI)</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} {c.phone ? `(${c.phone})` : ''} - Bal: Rs.{c.current_balance}
              </option>
            ))}
          </select>
          <button
            onClick={onOpenCustomerModal}
            className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200 rounded-lg"
            title="Add New Customer"
          >
            <UserPlus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Cart Items List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2">
        {items.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center text-slate-400">
            <p className="text-xs">{t('pos.emptyCart')}</p>
          </div>
        ) : (
          items.map((item, idx) => {
            const lineTotal = item.quantity * item.unitPrice * (1 - item.discountPercent / 100);
            return (
              <div key={idx} className="p-2.5 flex items-center justify-between hover:bg-slate-50 rounded-lg transition">
                <div className="flex-1 pr-2">
                  <div className="text-xs font-semibold text-slate-900 leading-tight">
                    {item.productName}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Rs. {item.unitPrice.toFixed(2)} / {item.unitCode} | GST {item.taxRate}%
                  </div>
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={() => onUpdateQuantity(idx, Math.max(1, item.quantity - 1))}
                    className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-8 text-center text-xs font-bold text-slate-800">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => onUpdateQuantity(idx, item.quantity + 1)}
                    className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                {/* Line Total & Remove */}
                <div className="w-20 text-right pl-2">
                  <div className="text-xs font-bold text-slate-900">
                    Rs. {lineTotal.toFixed(2)}
                  </div>
                  <button
                    onClick={() => onRemoveItem(idx)}
                    className="text-slate-400 hover:text-rose-600 mt-1 inline-block"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Bill Summary & Payment Controls */}
      <div className="border-t border-slate-200 bg-slate-50 p-4 space-y-3">
        {/* Subtotals & Taxes */}
        <div className="space-y-1.5 text-xs text-slate-600">
          <div className="flex justify-between">
            <span>{t('pos.subtotal')}:</span>
            <span className="font-semibold text-slate-800">Rs. {grossSubtotal.toFixed(2)}</span>
          </div>
          {itemDiscountsTotal > 0 && (
            <div className="flex justify-between text-emerald-600">
              <span>Item Discounts:</span>
              <span>-Rs. {itemDiscountsTotal.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>{t('pos.tax')}:</span>
            <span>Rs. {totalTax.toFixed(2)}</span>
          </div>
          {roundOff !== 0 && (
            <div className="flex justify-between text-slate-500">
              <span>{t('pos.roundOff')}:</span>
              <span>Rs. {roundOff.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-base font-bold text-slate-900 pt-1.5 border-t border-slate-200">
            <span>{t('pos.total')}:</span>
            <span className="text-blue-600">Rs. {grandTotal.toFixed(2)}</span>
          </div>
        </div>

        {/* Payment Mode Selector */}
        <div className="grid grid-cols-5 gap-1 pt-1">
          {[
            { id: 'CASH', label: t('pos.cash'), icon: Banknote },
            { id: 'UPI', label: t('pos.upi'), icon: Smartphone },
            { id: 'CARD', label: t('pos.card'), icon: CreditCard },
            { id: 'SPLIT', label: t('pos.split'), icon: Split },
            { id: 'CREDIT', label: t('pos.credit'), icon: BookOpen }
          ].map((mode) => {
            const Icon = mode.icon;
            const isSelected = paymentMethod === mode.id;
            return (
              <button
                key={mode.id}
                onClick={() => setPaymentMethod(mode.id as any)}
                className={`py-2 flex flex-col items-center justify-center rounded-lg border text-[11px] font-medium transition ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-3.5 h-3.5 mb-0.5" />
                {mode.label}
              </button>
            );
          })}
        </div>

        {/* Cash Tendered & Change Return helper */}
        {paymentMethod === 'CASH' && (
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-slate-500 shrink-0">Cash Tendered:</span>
            <input
              type="number"
              value={cashTendered}
              onChange={(e) => setCashTendered(e.target.value ? Number(e.target.value) : '')}
              placeholder={`Rs. ${grandTotal}`}
              className="w-24 px-2 py-1 bg-white border border-slate-300 rounded text-right font-bold focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            {changeDue > 0 && (
              <span className="text-emerald-700 font-bold ml-auto">
                Change: Rs. {changeDue.toFixed(2)}
              </span>
            )}
          </div>
        )}

        {paymentMethod === 'UPI' && (
          <input
            type="text"
            value={upiReference}
            onChange={(e) => setUpiReference(e.target.value)}
            placeholder="UPI Ref ID / UTR number (Optional)"
            className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        )}

        {/* Primary Pay Button */}
        <button
          onClick={handleCheckoutClick}
          disabled={items.length === 0 || isProcessing}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold rounded-xl shadow transition flex items-center justify-center space-x-2 text-sm"
        >
          {isProcessing ? (
            <span>Processing Invoice...</span>
          ) : (
            <>
              <Check className="w-4 h-4" />
              <span>{t('pos.payNow')} - Rs. {grandTotal.toFixed(2)}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
