import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { DataTable, Column } from '../components/DataTable.js';
import { Modal } from '../components/Modal.js';
import { Plus, BookOpen, User } from 'lucide-react';

export const CustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Add Customer Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    gstin: '',
    creditLimit: 0,
    addressLine1: '',
    city: '',
    state: ''
  });

  // Ledger Modal
  const [showLedgerModal, setShowLedgerModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [ledgerEntries, setLedgerEntries] = useState<any[]>([]);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const res = await api.get<any[]>('/customers', { limit: 100 });
      if (res.data) setCustomers(res.data);
    } catch (err) {
      console.error('Failed to load customers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/customers', {
        ...formData,
        creditLimit: Number(formData.creditLimit)
      });
      setShowAddModal(false);
      setFormData({
        name: '',
        phone: '',
        email: '',
        gstin: '',
        creditLimit: 0,
        addressLine1: '',
        city: '',
        state: ''
      });
      loadCustomers();
    } catch (err: any) {
      alert(err.message || 'Failed to create customer');
    }
  };

  const handleViewLedger = async (customer: any) => {
    setSelectedCustomer(customer);
    try {
      const res = await api.get<any[]>(`/customers/${customer.id}/ledger`);
      if (res.data) setLedgerEntries(res.data);
      setShowLedgerModal(true);
    } catch (err) {
      alert('Failed to load ledger records');
    }
  };

  const columns: Column<any>[] = [
    {
      header: 'Customer Name',
      render: (row) => (
        <div>
          <div className="font-bold text-slate-900">{row.name}</div>
          <div className="text-[11px] text-slate-500">{row.email || 'No email'}</div>
        </div>
      )
    },
    {
      header: 'Mobile Phone',
      render: (row) => row.phone || '-'
    },
    {
      header: 'GSTIN',
      render: (row) => row.gstin || '-'
    },
    {
      header: 'Credit Limit',
      render: (row) => `₹${Number(row.credit_limit).toFixed(2)}`
    },
    {
      header: 'Current Debt / Balance',
      render: (row) => {
        const bal = Number(row.current_balance);
        return (
          <span className={`font-bold ${bal > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
            ₹{bal.toFixed(2)}
          </span>
        );
      }
    },
    {
      header: 'Loyalty Points',
      render: (row) => (
        <span className="font-semibold text-blue-600">{row.loyalty_points || 0} pts</span>
      )
    },
    {
      header: 'Actions',
      render: (row) => (
        <button
          onClick={() => handleViewLedger(row)}
          className="flex items-center space-x-1 px-2.5 py-1 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition"
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Ledger</span>
        </button>
      )
    }
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Customers & Credit Accounts</h1>
          <p className="text-xs text-slate-500">Manage client directory, credit limits, and ledger balances</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          <span>Add Customer</span>
        </button>
      </div>

      <DataTable
        columns={columns}
        data={customers}
        loading={loading}
        searchPlaceholder="Search customer name or phone..."
      />

      {/* Add Customer Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add Customer" maxWidth="md">
        <form onSubmit={handleCreateCustomer} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Customer Full Name
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Anji Reddy"
              className="mt-1 w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Phone Number
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91 9848012345"
                className="mt-1 w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Credit Limit (₹)
              </label>
              <input
                type="number"
                value={formData.creditLimit}
                onChange={(e) => setFormData({ ...formData, creditLimit: Number(e.target.value) })}
                className="mt-1 w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Email Address
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="customer@domain.com"
                className="mt-1 w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                GSTIN (Optional)
              </label>
              <input
                type="text"
                value={formData.gstin}
                onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
                placeholder="37AAAAA0000A1Z5"
                className="mt-1 w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase font-mono"
              />
            </div>
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
              Save Customer
            </button>
          </div>
        </form>
      </Modal>

      {/* Customer Ledger Modal */}
      <Modal
        isOpen={showLedgerModal}
        onClose={() => setShowLedgerModal(false)}
        title={`Ledger Statement - ${selectedCustomer?.name || ''}`}
        maxWidth="lg"
      >
        <div className="space-y-4">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-500">Credit Limit:</span>{' '}
              <span className="font-bold text-slate-800">₹{Number(selectedCustomer?.credit_limit || 0).toFixed(2)}</span>
            </div>
            <div>
              <span className="text-slate-500">Current Outstanding Balance:</span>{' '}
              <span className="font-bold text-rose-600">₹{Number(selectedCustomer?.current_balance || 0).toFixed(2)}</span>
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2 px-3">Date</th>
                  <th className="py-2 px-3">Type</th>
                  <th className="py-2 px-3">Ref #</th>
                  <th className="py-2 px-3 text-right">Debit (+)</th>
                  <th className="py-2 px-3 text-right">Credit (-)</th>
                  <th className="py-2 px-3 text-right">Running Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ledgerEntries.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-400">
                      No ledger transactions found.
                    </td>
                  </tr>
                ) : (
                  ledgerEntries.map((row: any) => (
                    <tr key={row.id} className="hover:bg-slate-50">
                      <td className="py-2 px-3">{new Date(row.created_at).toLocaleDateString()}</td>
                      <td className="py-2 px-3 font-semibold text-slate-700">{row.transaction_type}</td>
                      <td className="py-2 px-3 font-mono text-slate-600">{row.reference_id || '-'}</td>
                      <td className="py-2 px-3 text-right font-medium text-rose-600">
                        {Number(row.debit) > 0 ? `₹${Number(row.debit).toFixed(2)}` : '-'}
                      </td>
                      <td className="py-2 px-3 text-right font-medium text-emerald-600">
                        {Number(row.credit) > 0 ? `₹${Number(row.credit).toFixed(2)}` : '-'}
                      </td>
                      <td className="py-2 px-3 text-right font-bold text-slate-900">
                        ₹{Number(row.running_balance).toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Modal>
    </div>
  );
};
