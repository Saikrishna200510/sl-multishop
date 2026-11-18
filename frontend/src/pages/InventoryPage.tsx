import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { DataTable, Column } from '../components/DataTable.js';
import { Modal } from '../components/Modal.js';
import { Layers, ArrowLeftRight, Sliders, AlertTriangle } from 'lucide-react';

export const InventoryPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'balances' | 'movements'>('balances');
  const [balances, setBalances] = useState<any[]>([]);
  const [movements, setMovements] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Stock Adjustment Modal
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustData, setAdjustData] = useState({
    branchId: '',
    productId: '',
    type: 'ADJUSTMENT_UP',
    quantity: 1,
    reason: ''
  });

  // Inter-branch Transfer Modal
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferData, setTransferData] = useState({
    sourceBranchId: '',
    destinationBranchId: '',
    productId: '',
    quantity: 1,
    notes: ''
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [balRes, movRes, branchRes, prodRes] = await Promise.all([
        api.get<any[]>('/inventory/balances'),
        api.get<any[]>('/inventory/movements'),
        api.get<any[]>('/branches'),
        api.get<any[]>('/products', { limit: 100 })
      ]);

      if (balRes.data) setBalances(balRes.data);
      if (movRes.data) setMovements(movRes.data);
      if (branchRes.data) {
        setBranches(branchRes.data);
        if (branchRes.data.length > 0) {
          const firstBr = branchRes.data[0];
          const secondBr = branchRes.data.length > 1 ? branchRes.data[1] : firstBr;
          setAdjustData((d) => ({ ...d, branchId: firstBr.id }));
          setTransferData((d) => ({
            ...d,
            sourceBranchId: firstBr.id,
            destinationBranchId: secondBr.id
          }));
        }
      }
      if (prodRes.data) {
        setProducts(prodRes.data);
        if (prodRes.data.length > 0) {
          const firstProd = prodRes.data[0];
          setAdjustData((d) => ({ ...d, productId: firstProd.id }));
          setTransferData((d) => ({ ...d, productId: firstProd.id }));
        }
      }
    } catch (err) {
      console.error('Failed to load inventory data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/inventory/adjust', {
        branchId: adjustData.branchId,
        productId: adjustData.productId,
        type: adjustData.type,
        quantity: Number(adjustData.quantity),
        reason: adjustData.reason
      });
      setShowAdjustModal(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Stock adjustment failed');
    }
  };

  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const prod = products.find((p) => p.id === transferData.productId);
      await api.post('/inventory/transfers', {
        sourceBranchId: transferData.sourceBranchId,
        destinationBranchId: transferData.destinationBranchId,
        items: [
          {
            productId: transferData.productId,
            productName: prod?.name || 'Item',
            quantity: Number(transferData.quantity)
          }
        ],
        notes: transferData.notes
      });
      setShowTransferModal(false);
      alert('Stock transfer dispatched to destination branch');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Transfer failed');
    }
  };

  const balanceColumns: Column<any>[] = [
    {
      header: 'Product',
      render: (row) => (
        <div>
          <div className="font-bold text-slate-900">{row.product.name}</div>
          <div className="text-[11px] text-slate-500 font-mono">SKU: {row.product.sku}</div>
        </div>
      )
    },
    {
      header: 'Branch',
      render: (row) => row.branch.name
    },
    {
      header: 'Cost Price',
      render: (row) => `₹${Number(row.cost_price).toFixed(2)}`
    },
    {
      header: 'Available Stock',
      render: (row) => {
        const isLow = Number(row.quantity) <= Number(row.product.min_stock_level);
        return (
          <span className={`font-bold ${isLow ? 'text-rose-600' : 'text-slate-900'}`}>
            {Number(row.quantity)} {row.product.unit?.code}
            {isLow && (
              <span className="ml-2 text-[10px] bg-rose-50 text-rose-600 px-1.5 py-0.5 rounded border border-rose-200">
                Low
              </span>
            )}
          </span>
        );
      }
    }
  ];

  const movementColumns: Column<any>[] = [
    {
      header: 'Date & Time',
      render: (row) => new Date(row.created_at).toLocaleString()
    },
    {
      header: 'Product',
      render: (row) => row.product.name
    },
    {
      header: 'Type',
      render: (row) => (
        <span
          className={`px-2 py-0.5 rounded text-[11px] font-bold ${
            row.movement_type === 'SALE'
              ? 'bg-amber-50 text-amber-700'
              : row.movement_type === 'PURCHASE'
              ? 'bg-emerald-50 text-emerald-700'
              : 'bg-blue-50 text-blue-700'
          }`}
        >
          {row.movement_type}
        </span>
      )
    },
    {
      header: 'Qty Change',
      render: (row) => `${Number(row.quantity)}`
    },
    {
      header: 'Old &rarr; New',
      render: (row) => `${Number(row.previous_stock)} &rarr; ${Number(row.new_stock)}`
    },
    {
      header: 'Reference',
      render: (row) => row.reference_id || '-'
    }
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Inventory & Stock Operations</h1>
          <p className="text-xs text-slate-500">Monitor warehouse balances, adjustments, and branch transfers</p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowAdjustModal(true)}
            className="flex items-center space-x-1.5 px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold shadow-sm transition"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Stock Adjustment</span>
          </button>
          <button
            onClick={() => setShowTransferModal(true)}
            className="flex items-center space-x-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            <span>Branch Transfer</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('balances')}
          className={`px-4 py-2 text-xs font-bold border-b-2 transition ${
            activeTab === 'balances'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Stock Balances
        </button>
        <button
          onClick={() => setActiveTab('movements')}
          className={`px-4 py-2 text-xs font-bold border-b-2 transition ${
            activeTab === 'movements'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Movement Audit Logs
        </button>
      </div>

      {activeTab === 'balances' ? (
        <DataTable columns={balanceColumns} data={balances} loading={loading} />
      ) : (
        <DataTable columns={movementColumns} data={movements} loading={loading} />
      )}

      {/* Adjustment Modal */}
      <Modal isOpen={showAdjustModal} onClose={() => setShowAdjustModal(false)} title="Stock Adjustment" maxWidth="md">
        <form onSubmit={handleAdjustSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">Branch</label>
            <select
              value={adjustData.branchId}
              onChange={(e) => setAdjustData({ ...adjustData, branchId: e.target.value })}
              className="mt-1 w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {branches.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">Product</label>
            <select
              value={adjustData.productId}
              onChange={(e) => setAdjustData({ ...adjustData, productId: e.target.value })}
              className="mt-1 w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">Type</label>
              <select
                value={adjustData.type}
                onChange={(e) => setAdjustData({ ...adjustData, type: e.target.value as any })}
                className="mt-1 w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ADJUSTMENT_UP">Adjustment Up (+)</option>
                <option value="ADJUSTMENT_DOWN">Adjustment Down (-)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">Quantity</label>
              <input
                type="number"
                min={1}
                required
                value={adjustData.quantity}
                onChange={(e) => setAdjustData({ ...adjustData, quantity: Number(e.target.value) })}
                className="mt-1 w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">Reason</label>
            <input
              type="text"
              required
              placeholder="e.g. Physical inventory audit / Damage / Wastage"
              value={adjustData.reason}
              onChange={(e) => setAdjustData({ ...adjustData, reason: e.target.value })}
              className="mt-1 w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="pt-2 flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setShowAdjustModal(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm"
            >
              Submit Adjustment
            </button>
          </div>
        </form>
      </Modal>

      {/* Transfer Modal */}
      <Modal isOpen={showTransferModal} onClose={() => setShowTransferModal(false)} title="Inter-Branch Stock Transfer" maxWidth="md">
        <form onSubmit={handleTransferSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">Source Branch</label>
            <select
              value={transferData.sourceBranchId}
              onChange={(e) => setTransferData({ ...transferData, sourceBranchId: e.target.value })}
              className="mt-1 w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {branches.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">Destination Branch</label>
            <select
              value={transferData.destinationBranchId}
              onChange={(e) => setTransferData({ ...transferData, destinationBranchId: e.target.value })}
              className="mt-1 w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {branches.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">Product</label>
              <select
                value={transferData.productId}
                onChange={(e) => setTransferData({ ...transferData, productId: e.target.value })}
                className="mt-1 w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">Quantity</label>
              <input
                type="number"
                min={1}
                required
                value={transferData.quantity}
                onChange={(e) => setTransferData({ ...transferData, quantity: Number(e.target.value) })}
                className="mt-1 w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">Transfer Notes</label>
            <input
              type="text"
              placeholder="e.g. Stock replenishment"
              value={transferData.notes}
              onChange={(e) => setTransferData({ ...transferData, notes: e.target.value })}
              className="mt-1 w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="pt-2 flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setShowTransferModal(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm"
            >
              Dispatch Transfer
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
