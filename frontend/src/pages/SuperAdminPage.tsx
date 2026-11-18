import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { DataTable, Column } from '../components/DataTable.js';
import { DashboardCard } from '../components/DashboardCard.js';
import { Modal } from '../components/Modal.js';
import {
  ShieldAlert,
  Store,
  CreditCard,
  IndianRupee,
  FileText,
  CheckCircle,
  XCircle,
  Layers,
  Activity
} from 'lucide-react';

export const SuperAdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'shops' | 'payments' | 'plans' | 'audit'>('shops');
  const [metrics, setMetrics] = useState<any>(null);
  const [shops, setShops] = useState<any[]>([]);
  const [pendingPayments, setPendingPayments] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [dashRes, shopsRes, payRes, plansRes, auditRes] = await Promise.all([
        api.get<any>('/admin/dashboard'),
        api.get<any[]>('/admin/shops'),
        api.get<any[]>('/admin/payments'),
        api.get<any[]>('/admin/plans'),
        api.get<any[]>('/admin/audit-logs')
      ]);

      if (dashRes.data?.metrics) setMetrics(dashRes.data.metrics);
      if (shopsRes.data) setShops(shopsRes.data);
      if (payRes.data) setPendingPayments(payRes.data);
      if (plansRes.data) setPlans(plansRes.data);
      if (auditRes.data) setAuditLogs(auditRes.data);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleShopStatus = async (shopId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    if (!confirm(`Are you sure you want to change shop status to ${newStatus}?`)) return;

    try {
      await api.patch(`/admin/shops/${shopId}/status`, { status: newStatus });
      alert(`Shop status updated to ${newStatus}`);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to update shop status');
    }
  };

  const handleVerifyPayment = async (paymentId: string, status: 'VERIFIED' | 'REJECTED') => {
    if (!confirm(`Confirm mark payment as ${status}?`)) return;
    try {
      await api.patch(`/admin/payments/${paymentId}/verify`, { status });
      alert(`Payment marked as ${status} and subscription activated.`);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Payment verification failed');
    }
  };

  const shopColumns: Column<any>[] = [
    {
      header: 'Store Name',
      render: (row) => (
        <div>
          <div className="font-bold text-slate-900">{row.name}</div>
          <div className="text-[11px] text-slate-500 font-mono">slug: {row.slug}</div>
        </div>
      )
    },
    {
      header: 'Industry Type',
      render: (row) => (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
          {row.business_type}
        </span>
      )
    },
    {
      header: 'Current Plan',
      render: (row) => row.subscriptions?.[0]?.plan?.name || 'No Plan'
    },
    {
      header: 'Counters / Staff',
      render: (row) => `${row._count?.counters || 0} ctrs / ${row._count?.user_roles || 0} staff`
    },
    {
      header: 'Total Bills',
      render: (row) => `${row._count?.invoices || 0} invoices`
    },
    {
      header: 'Status',
      render: (row) => (
        <span
          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
            row.status === 'ACTIVE'
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-rose-50 text-rose-700 border border-rose-200'
          }`}
        >
          {row.status}
        </span>
      )
    },
    {
      header: 'Actions',
      render: (row) => (
        <button
          onClick={() => handleToggleShopStatus(row.id, row.status)}
          className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition ${
            row.status === 'ACTIVE'
              ? 'text-rose-600 bg-rose-50 hover:bg-rose-100'
              : 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100'
          }`}
        >
          {row.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
        </button>
      )
    }
  ];

  const paymentColumns: Column<any>[] = [
    {
      header: 'Shop Name',
      render: (row) => row.shop?.name
    },
    {
      header: 'Amount',
      render: (row) => `₹${Number(row.amount).toFixed(2)}`
    },
    {
      header: 'Payment Mode',
      render: (row) => row.payment_method
    },
    {
      header: 'Ref / UTR Number',
      render: (row) => (
        <span className="font-mono font-bold text-slate-900">{row.transaction_reference}</span>
      )
    },
    {
      header: 'Status',
      render: (row) => (
        <span
          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
            row.status === 'VERIFIED'
              ? 'bg-emerald-50 text-emerald-700'
              : row.status === 'REJECTED'
              ? 'bg-rose-50 text-rose-700'
              : 'bg-amber-50 text-amber-700'
          }`}
        >
          {row.status}
        </span>
      )
    },
    {
      header: 'Verification',
      render: (row) => (
        <div className="flex items-center space-x-1.5">
          {row.status === 'PENDING' ? (
            <>
              <button
                onClick={() => handleVerifyPayment(row.id, 'VERIFIED')}
                className="px-2 py-1 bg-emerald-600 text-white rounded text-xs font-bold hover:bg-emerald-700"
              >
                Approve
              </button>
              <button
                onClick={() => handleVerifyPayment(row.id, 'REJECTED')}
                className="px-2 py-1 bg-rose-600 text-white rounded text-xs font-bold hover:bg-rose-700"
              >
                Reject
              </button>
            </>
          ) : (
            <span className="text-[11px] text-slate-500">Processed</span>
          )}
        </div>
      )
    }
  ];

  const planColumns: Column<any>[] = [
    {
      header: 'Plan Name',
      render: (row) => <span className="font-bold text-slate-900">{row.name}</span>
    },
    {
      header: 'Monthly Price',
      render: (row) => `₹${Number(row.monthly_price).toFixed(2)}`
    },
    {
      header: 'Annual Price',
      render: (row) => `₹${Number(row.annual_price).toFixed(2)}`
    },
    {
      header: 'Max Branches',
      render: (row) => row.max_branches
    },
    {
      header: 'Max Counters',
      render: (row) => row.max_counters
    },
    {
      header: 'Max Users',
      render: (row) => row.max_users
    },
    {
      header: 'Max Products',
      render: (row) => row.max_products.toLocaleString()
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center space-x-2">
          <ShieldAlert className="w-5 h-5 text-purple-600" />
          <h1 className="text-xl font-bold text-slate-900">Platform Super Administrator</h1>
        </div>
        <p className="text-xs text-slate-500">
          Multi-tenant tenant controls, subscription payment verification, pricing plans, and audit oversight
        </p>
      </div>

      {/* Admin Metrics Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <DashboardCard
          title="Total Registered Shops"
          value={metrics?.totalShops || 0}
          icon={Store}
          color="blue"
        />
        <DashboardCard
          title="Active Shops"
          value={metrics?.activeShops || 0}
          icon={CheckCircle}
          color="emerald"
        />
        <DashboardCard
          title="Suspended Shops"
          value={metrics?.suspendedShops || 0}
          icon={XCircle}
          color="rose"
        />
        <DashboardCard
          title="Total Invoices Billed"
          value={metrics?.totalInvoices || 0}
          icon={FileText}
          color="amber"
        />
        <DashboardCard
          title="Platform Revenue"
          value={`₹${Number(metrics?.totalPlatformRevenue || 0).toLocaleString('en-IN')}`}
          icon={IndianRupee}
          color="purple"
        />
      </div>

      {/* Admin Tabs */}
      <div className="flex space-x-1 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('shops')}
          className={`px-4 py-2 text-xs font-bold border-b-2 transition ${
            activeTab === 'shops'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          All Shops Directory ({shops.length})
        </button>
        <button
          onClick={() => setActiveTab('payments')}
          className={`px-4 py-2 text-xs font-bold border-b-2 transition ${
            activeTab === 'payments'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Payment Verifications ({pendingPayments.filter((p) => p.status === 'PENDING').length} Pending)
        </button>
        <button
          onClick={() => setActiveTab('plans')}
          className={`px-4 py-2 text-xs font-bold border-b-2 transition ${
            activeTab === 'plans'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Subscription Plans
        </button>
      </div>

      {activeTab === 'shops' && (
        <DataTable
          columns={shopColumns}
          data={shops}
          loading={loading}
          searchPlaceholder="Search store name, slug, phone..."
        />
      )}

      {activeTab === 'payments' && (
        <DataTable
          columns={paymentColumns}
          data={pendingPayments}
          loading={loading}
          searchPlaceholder="Search payment UTR / reference..."
        />
      )}

      {activeTab === 'plans' && (
        <DataTable
          columns={planColumns}
          data={plans}
          loading={loading}
          searchable={false}
        />
      )}
    </div>
  );
};
