import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.js';
import { POSProductGrid, ProductItem } from '../components/POSProductGrid.js';
import { POSCart, CartItem, CustomerOption } from '../components/POSCart.js';
import { ReceiptModal } from '../components/ReceiptModal.js';
import { Modal } from '../components/Modal.js';
import { AlertCircle, UserCheck } from 'lucide-react';

export const POSPage: React.FC = () => {
  const { activeShop, language } = useAuth();

  const [products, setProducts] = useState<ProductItem[]>([]);
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerOption | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [lastInvoice, setLastInvoice] = useState<any>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  // New Customer Modal State
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustCreditLimit, setNewCustCreditLimit] = useState(0);

  // Load store data
  useEffect(() => {
    async function loadPOSData() {
      try {
        const [prodRes, catRes, custRes] = await Promise.all([
          api.get<any[]>('/products', { limit: 100 }),
          api.get<any[]>('/products/categories'),
          api.get<any[]>('/customers', { limit: 100 })
        ]);

        if (prodRes.data) setProducts(prodRes.data);
        if (catRes.data) setCategories(catRes.data);
        if (custRes.data) setCustomers(custRes.data);
      } catch (err) {
        console.error('Failed to load POS data:', err);
      }
    }
    loadPOSData();
  }, []);

  // Hotkeys: F2 for barcode focus, F9 for checkout
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F9' && cartItems.length > 0 && !isProcessing) {
        e.preventDefault();
        // Trigger default cash checkout
        handleCheckout({
          paymentMethod: 'CASH',
          payments: [{ method: 'CASH', amount: 0 }],
          invoiceDiscount: 0
        });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cartItems, isProcessing]);

  // Add Product to Cart
  const handleSelectProduct = (product: ProductItem) => {
    setCartItems((prev) => {
      const existingIdx = prev.findIndex((i) => i.productId === product.id);
      if (existingIdx > -1) {
        const updated = [...prev];
        updated[existingIdx].quantity += 1;
        return updated;
      }
      return [
        ...prev,
        {
          productId: product.id,
          productName: product.name,
          sku: product.sku,
          unitCode: product.unit?.code || 'PCS',
          quantity: 1,
          unitPrice: Number(product.selling_price),
          discountPercent: 0,
          taxRate: Number(product.tax_rate)
        }
      ];
    });
  };

  // Barcode Scanner handler
  const handleBarcodeScan = async (barcode: string) => {
    try {
      const res = await api.get<any>(`/products/barcode/${barcode}`);
      if (res.data) {
        handleSelectProduct(res.data);
      }
    } catch (err: any) {
      alert(`Barcode not found: ${barcode}`);
    }
  };

  const handleUpdateQuantity = (idx: number, qty: number) => {
    setCartItems((prev) => {
      const updated = [...prev];
      updated[idx].quantity = qty;
      return updated;
    });
  };

  const handleRemoveItem = (idx: number) => {
    setCartItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  // Checkout Handler
  const handleCheckout = async (checkoutData: {
    paymentMethod: 'CASH' | 'UPI' | 'CARD' | 'SPLIT' | 'CREDIT';
    payments: Array<{ method: any; amount: number; referenceNumber?: string }>;
    invoiceDiscount: number;
  }) => {
    if (cartItems.length === 0) return;
    setIsProcessing(true);

    try {
      // Generate idempotency key for financial safety
      const idempotencyKey = `POS-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

      // Fetch active branch or use default
      const branchRes = await api.get<any[]>('/branches');
      const activeBranchId = branchRes.data?.[0]?.id;

      if (!activeBranchId) {
        throw new Error('No active store branch found.');
      }

      const payload = {
        branchId: activeBranchId,
        customerId: selectedCustomer?.id,
        items: cartItems.map((item) => ({
          productId: item.productId,
          variantId: item.variantId,
          productName: item.productName,
          sku: item.sku,
          unitCode: item.unitCode,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discountPercent: item.discountPercent,
          taxRate: item.taxRate
        })),
        invoiceDiscountAmount: checkoutData.invoiceDiscount,
        paymentMethod: checkoutData.paymentMethod,
        payments: checkoutData.payments,
        language: language === 'te' ? 'te' : 'en'
      };

      const res = await api.post<any>('/pos/checkout', payload, {
        'idempotency-key': idempotencyKey
      });

      if (res.data) {
        setLastInvoice(res.data);
        setShowReceiptModal(true);
        setCartItems([]);
      }
    } catch (err: any) {
      alert(err.message || 'Billing checkout failed. Please check inputs.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Create Quick Customer
  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post<any>('/customers', {
        name: newCustName,
        phone: newCustPhone || undefined,
        creditLimit: newCustCreditLimit
      });

      if (res.data) {
        setCustomers((prev) => [res.data, ...prev]);
        setSelectedCustomer(res.data);
        setShowCustomerModal(false);
        setNewCustName('');
        setNewCustPhone('');
        setNewCustCreditLimit(0);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to create customer');
    }
  };

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col lg:flex-row gap-4">
      {/* Left 65%: Product Catalog & Fast Barcode Grid */}
      <div className="flex-1 h-full min-w-0">
        <POSProductGrid
          products={products}
          categories={categories}
          onSelectProduct={handleSelectProduct}
          onBarcodeScan={handleBarcodeScan}
        />
      </div>

      {/* Right 35%: Interactive Shopping Cart & Payment Panel */}
      <div className="w-full lg:w-[420px] h-full shrink-0">
        <POSCart
          items={cartItems}
          customers={customers}
          selectedCustomer={selectedCustomer}
          onSelectCustomer={setSelectedCustomer}
          onOpenCustomerModal={() => setShowCustomerModal(true)}
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveItem={handleRemoveItem}
          onClearCart={handleClearCart}
          onCheckout={handleCheckout}
          isProcessing={isProcessing}
        />
      </div>

      {/* Bill & Receipt Modal */}
      <ReceiptModal
        isOpen={showReceiptModal}
        onClose={() => setShowReceiptModal(false)}
        invoice={lastInvoice}
      />

      {/* Quick Customer Add Modal */}
      <Modal
        isOpen={showCustomerModal}
        onClose={() => setShowCustomerModal(false)}
        title="Quick Add Customer"
        maxWidth="sm"
      >
        <form onSubmit={handleCreateCustomer} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Customer Full Name
            </label>
            <input
              type="text"
              required
              value={newCustName}
              onChange={(e) => setNewCustName(e.target.value)}
              placeholder="e.g. Ramesh Naidu"
              className="mt-1 w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Mobile Phone
            </label>
            <input
              type="tel"
              value={newCustPhone}
              onChange={(e) => setNewCustPhone(e.target.value)}
              placeholder="+91 9876543210"
              className="mt-1 w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Credit Limit (₹)
            </label>
            <input
              type="number"
              value={newCustCreditLimit}
              onChange={(e) => setNewCustCreditLimit(Number(e.target.value))}
              placeholder="0"
              className="mt-1 w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="pt-2 flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setShowCustomerModal(false)}
              className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
            >
              Save Customer
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
