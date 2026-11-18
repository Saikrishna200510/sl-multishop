import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { DataTable, Column } from '../components/DataTable.js';
import { Modal } from '../components/Modal.js';
import { Plus, Receipt } from 'lucide-react';

export const ExpensesPage: React.FC = () => {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Add Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    branchId: '',
    categoryId: '',
    amount: 0,
    paymentMethod: 'CASH',
    referenceNumber: '',
    notes: ''
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [expRes, catRes, branchRes] = await Promise.all([
        api.get<any[]>('/expenses'),
        api.get<any[]>('/expenses/categories'),
        api.get<any[]>('/branches')
      ]);

      if (expRes.data) setExpenses(expRes.data);
      if (catRes.data) {
        setCategories(catRes.data);
        if (catRes.data.length > 0) {
          const firstCat = catRes.data[0];
          setFormData((f) => ({ ...f, categoryId: firstCat.id }));
        }
      }
      if (branchRes.data) {
        setBranches(branchRes.data);
        if (branchRes.data.length > 0) {
          const firstBranch = branchRes.data[0];
          setFormData((f) => ({ ...f, branchId: firstBranch.id }));
        }
      }
    } catch (err) {
      console.error('Failed to load expenses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/expenses', {
        ...formData,
        amount: Number(formData.amount)
      });
      setShowAddModal(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to record expense');
    }
  };

  const columns: Column<any>[] = [
    {
      header: 'Date',
      render: (row) => new Date(row.expense_date).toLocaleDateString('en-IN')
    },
    {
      header: 'Category',
      render: (row) => (
        <span className="font-semibold text-slate-800">{row.category?.name}</span>
      )
    },
    {
      header: 'Branch',
      render: (row) => row.branch?.name
    },
    {
      header: 'Payment Mode',
      render: (row) => row.payment_method
    },
    {
      header: 'Amount',
      render: (row) => (
        <span className="font-bold text-slate-900">₹{Number(row.amount).toFixed(2)}</span>
      )
    },
    {
      header: 'Notes / Ref',
      render: (row) => row.notes || row.reference_number || '-'
    }
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Operating Expenses</h1>
          <p className="text-xs text-slate-500">Record and track store overheads, utilities, and daily payouts</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          <span>Record Expense</span>
        </button>
      </div>

      <DataTable
        columns={columns}
        data={expenses}
        loading={loading}
        searchPlaceholder="Search expense category or notes..."
      />

      {/* Record Expense Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Record Store Expense" maxWidth="md">
        <form onSubmit={handleCreateExpense} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">Branch</label>
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

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">Expense Category</label>
            <select
              value={formData.categoryId}
              onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
              className="mt-1 w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">Amount (₹)</label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                className="mt-1 w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">Payment Mode</label>
              <select
                value={formData.paymentMethod}
                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                className="mt-1 w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="CASH">Cash Drawer</option>
                <option value="UPI">UPI / Bank</option>
                <option value="CARD">Card</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">Notes / Reason</label>
            <input
              type="text"
              placeholder="e.g. Electric bill, shop cleaning, tea / snacks"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="mt-1 w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="pt-2 flex justify-end space-x-2">
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
              Save Expense
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
