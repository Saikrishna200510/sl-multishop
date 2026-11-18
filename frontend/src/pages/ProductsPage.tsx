import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { DataTable, Column } from '../components/DataTable.js';
import { Modal } from '../components/Modal.js';
import { Plus, Package, Barcode, Sparkles } from 'lucide-react';

export const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Client-side fallback EAN-13 generator (GS1 Modulo-10 checksum)
  const generateClientEan13 = (prefix = '890'): string => {
    const randomNine = Math.floor(100000000 + Math.random() * 900000000).toString();
    const code12 = `${prefix.slice(0, 3)}${randomNine}`;
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      const digit = parseInt(code12[i], 10);
      sum += i % 2 === 0 ? digit * 1 : digit * 3;
    }
    const checkDigit = (10 - (sum % 10)) % 10;
    return `${code12}${checkDigit}`;
  };

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    barcode: '',
    categoryId: '',
    unitId: '',
    purchasePrice: 0,
    sellingPrice: 0,
    mrp: 0,
    taxRate: 18,
    minStockLevel: 5,
    isWeightBased: false,
    isBatchTracked: false,
    isExpiryTracked: false,
    initialQuantity: 0,
    branchId: ''
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [prodRes, catRes, unitRes, branchRes] = await Promise.all([
        api.get<any[]>('/products', { limit: 100 }),
        api.get<any[]>('/products/categories'),
        api.get<any[]>('/products/units'),
        api.get<any[]>('/branches')
      ]);

      if (prodRes.data) setProducts(prodRes.data);
      if (catRes.data) setCategories(catRes.data);
      if (unitRes.data) setUnits(unitRes.data);
      if (branchRes.data && branchRes.data.length > 0) {
        setBranches(branchRes.data);
        const firstBranch = branchRes.data[0];
        setFormData((f) => ({ ...f, branchId: firstBranch.id }));
      }
      if (unitRes.data && unitRes.data.length > 0) {
        setUnits(unitRes.data);
        const firstUnit = unitRes.data[0];
        setFormData((f) => ({ ...f, unitId: firstUnit.id }));
      }
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleGenerateBarcode = async () => {
    try {
      const res = await api.get<{ barcode: string }>('/products/generate-barcode');
      if (res.data?.barcode) {
        setFormData((f) => ({ ...f, barcode: res.data!.barcode }));
        return;
      }
    } catch (err) {
      console.warn('Backend barcode generator fallback to client:', err);
    }
    setFormData((f) => ({ ...f, barcode: generateClientEan13() }));
  };

  const handleOpenAddModal = async () => {
    let newBarcode = '';
    try {
      const res = await api.get<{ barcode: string }>('/products/generate-barcode');
      if (res.data?.barcode) {
        newBarcode = res.data.barcode;
      }
    } catch {
      newBarcode = generateClientEan13();
    }
    if (!newBarcode) newBarcode = generateClientEan13();

    setFormData((f) => ({
      ...f,
      barcode: newBarcode,
      sku: f.sku || `SKU-${Date.now().toString().slice(-6)}`
    }));
    setShowAddModal(true);
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = {
        name: formData.name,
        sku: formData.sku,
        barcode: formData.barcode || undefined,
        categoryId: formData.categoryId || undefined,
        unitId: formData.unitId,
        purchasePrice: Number(formData.purchasePrice),
        sellingPrice: Number(formData.sellingPrice),
        mrp: formData.mrp ? Number(formData.mrp) : undefined,
        taxRate: Number(formData.taxRate),
        minStockLevel: Number(formData.minStockLevel),
        isWeightBased: formData.isWeightBased,
        isBatchTracked: formData.isBatchTracked,
        isExpiryTracked: formData.isExpiryTracked
      };

      if (formData.initialQuantity > 0 && formData.branchId) {
        payload.initialStock = {
          branchId: formData.branchId,
          quantity: Number(formData.initialQuantity)
        };
      }

      await api.post('/products', payload);
      setShowAddModal(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to create product');
    }
  };

  const columns: Column<any>[] = [
    {
      header: 'Product Details',
      render: (row) => (
        <div>
          <div className="font-bold text-slate-900">{row.name}</div>
          <div className="text-[11px] text-slate-500 font-mono">
            SKU: {row.sku} {row.barcode ? `| EAN/Barcode: ${row.barcode}` : ''}
          </div>
        </div>
      )
    },
    {
      header: 'Category',
      render: (row) => (
        <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
          {row.category?.name || 'Uncategorized'}
        </span>
      )
    },
    {
      header: 'Purchase Cost',
      render: (row) => `₹${Number(row.purchase_price).toFixed(2)}`
    },
    {
      header: 'Selling Price',
      render: (row) => (
        <span className="font-bold text-slate-900">
          ₹${Number(row.selling_price).toFixed(2)}
        </span>
      )
    },
    {
      header: 'GST Rate',
      render: (row) => `${Number(row.tax_rate)}%`
    },
    {
      header: 'Total Stock',
      render: (row) => {
        const total = row.stock_balances?.reduce((sum: number, b: any) => sum + Number(b.quantity), 0) ?? 0;
        const isLow = total <= Number(row.min_stock_level);
        return (
          <span className={`font-semibold ${isLow ? 'text-rose-600' : 'text-slate-800'}`}>
            {total} {row.unit?.code}
            {isLow && <span className="ml-1 text-[10px] bg-rose-50 text-rose-600 px-1 rounded">Low</span>}
          </span>
        );
      }
    }
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Products & Catalog</h1>
          <p className="text-xs text-slate-500">Manage items, pricing, EAN barcodes, and tax rates</p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          <span>Add Product</span>
        </button>
      </div>

      <DataTable
        columns={columns}
        data={products}
        loading={loading}
        searchPlaceholder="Search product name, SKU or barcode..."
      />

      {/* Add Product Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New Product"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateProduct} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Product Name
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Sona Masoori Rice (25kg)"
                className="mt-1 w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                SKU (Stock Keeping Unit)
              </label>
              <input
                type="text"
                required
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                placeholder="RICE-SONA-25"
                className="mt-1 w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase font-mono"
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Barcode / EAN-13
                </label>
                <button
                  type="button"
                  onClick={handleGenerateBarcode}
                  className="text-[10px] font-bold text-blue-600 hover:text-blue-800 flex items-center space-x-0.5"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Generate New</span>
                </button>
              </div>
              <div className="mt-1 relative flex rounded-lg shadow-sm">
                <input
                  type="text"
                  value={formData.barcode}
                  onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                  placeholder="Auto-generated EAN-13"
                  className="w-full pl-3 pr-24 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono tracking-wider font-semibold text-slate-800"
                />
                <button
                  type="button"
                  onClick={handleGenerateBarcode}
                  className="absolute right-1 top-1 bottom-1 px-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-md text-[10px] font-bold flex items-center space-x-1 transition"
                  title="Generate standard EAN-13 barcode"
                >
                  <Barcode className="w-3.5 h-3.5" />
                  <span>Auto EAN</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Category
              </label>
              <select
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                className="mt-1 w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Measurement Unit
              </label>
              <select
                required
                value={formData.unitId}
                onChange={(e) => setFormData({ ...formData, unitId: e.target.value })}
                className="mt-1 w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {units.map((u) => (
                  <option key={u.id} value={u.id}>{u.name} ({u.code})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Purchase Price (₹)
              </label>
              <input
                type="number"
                required
                step="0.01"
                value={formData.purchasePrice}
                onChange={(e) => setFormData({ ...formData, purchasePrice: Number(e.target.value) })}
                className="mt-1 w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Selling Price (₹)
              </label>
              <input
                type="number"
                required
                step="0.01"
                value={formData.sellingPrice}
                onChange={(e) => setFormData({ ...formData, sellingPrice: Number(e.target.value) })}
                className="mt-1 w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                GST Rate (%)
              </label>
              <select
                value={formData.taxRate}
                onChange={(e) => setFormData({ ...formData, taxRate: Number(e.target.value) })}
                className="mt-1 w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={0}>GST 0%</option>
                <option value={5}>GST 5%</option>
                <option value={12}>GST 12%</option>
                <option value={18}>GST 18%</option>
                <option value={28}>GST 28%</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Initial Stock Quantity
              </label>
              <input
                type="number"
                value={formData.initialQuantity}
                onChange={(e) => setFormData({ ...formData, initialQuantity: Number(e.target.value) })}
                className="mt-1 w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Target Branch
              </label>
              <select
                value={formData.branchId}
                onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                className="mt-1 w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm"
            >
              Save Product
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
