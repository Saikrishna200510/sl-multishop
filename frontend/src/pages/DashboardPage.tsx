import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.js';
import { DashboardCard } from '../components/DashboardCard.js';
import {
  IndianRupee,
  ShoppingBag,
  AlertTriangle,
  Users,
  ShoppingCart,
  TrendingUp,
  Receipt,
  ArrowRight
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';

export const DashboardPage: React.FC = () => {
  const { activeShop } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await api.get<any>('/reports/dashboard');
        setData(res.data);
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  // Demo trend chart data
  const trendData = [
    { day: 'Mon', sales: 12400 },
    { day: 'Tue', sales: 18200 },
    { day: 'Wed', sales: 15600 },
    { day: 'Thu', sales: 21300 },
    { day: 'Fri', sales: 28900 },
    { day: 'Sat', sales: 36400 },
    { day: 'Sun', sales: 42100 }
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner with Quick POS Action */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded text-white">
            {activeShop?.businessType || 'RETAIL'} STORE
          </span>
          <h1 className="text-xl md:text-2xl font-bold mt-1">
            Welcome, {activeShop?.name || 'SL Store'}!
          </h1>
          <p className="text-xs text-blue-100 mt-0.5">
            Store operations are active. Manage billing, stock balances, and daily retail invoices.
          </p>
        </div>

        <Link
          to="/pos"
          className="px-5 py-3 bg-white text-blue-700 hover:bg-blue-50 font-bold rounded-xl shadow-sm text-sm flex items-center space-x-2 transition shrink-0"
        >
          <ShoppingCart className="w-4 h-4 text-blue-600" />
          <span>Launch POS Terminal</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardCard
          title="Today's Sales"
          value={`₹${Number(data?.today?.salesTotal || 0).toLocaleString('en-IN')}`}
          subtitle={`${data?.today?.invoiceCount || 0} bills generated today`}
          icon={IndianRupee}
          color="emerald"
        />
        <DashboardCard
          title="Month Total Sales"
          value={`₹${Number(data?.month?.salesTotal || 0).toLocaleString('en-IN')}`}
          subtitle={`${data?.month?.invoiceCount || 0} monthly invoices`}
          icon={TrendingUp}
          color="blue"
        />
        <DashboardCard
          title="Active Customers"
          value={data?.counts?.customers || 0}
          subtitle="Registered accounts"
          icon={Users}
          color="purple"
        />
        <DashboardCard
          title="Low Stock Alerts"
          value={data?.counts?.lowStockItems || 0}
          subtitle="Items at or below reorder level"
          icon={AlertTriangle}
          trend={data?.counts?.lowStockItems > 0 ? 'Restock Required' : 'Optimal'}
          trendPositive={data?.counts?.lowStockItems === 0}
          color="rose"
        />
      </div>

      {/* Charts & Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Revenue Trend Chart */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Weekly Revenue Flow</h3>
              <p className="text-xs text-slate-500">Gross sales performance over the past 7 days</p>
            </div>
            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded">
              Current Week
            </span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="sales"
                  stroke="#2563eb"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorSales)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Methods Breakdown */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Payment Collections</h3>
            <p className="text-xs text-slate-500 mb-4">Breakdown by cash, UPI, cards & credit</p>

            <div className="space-y-3">
              {(data?.paymentsByMethod || []).length === 0 ? (
                <div className="text-xs text-slate-400 py-8 text-center">
                  No payment transactions logged yet this month.
                </div>
              ) : (
                data.paymentsByMethod.map((pm: any) => (
                  <div key={pm.method} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                        {pm.method.charAt(0)}
                      </div>
                      <span className="text-xs font-bold text-slate-800">{pm.method}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-slate-900">₹{Number(pm.total).toLocaleString('en-IN')}</div>
                      <div className="text-[10px] text-slate-500">{pm.count} txns</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-500 flex justify-between">
            <span>Month GST Collected:</span>
            <span className="font-bold text-slate-900">
              ₹{Number(data?.month?.taxTotal || 0).toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </div>

      {/* Recent Invoices Table */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Recent Store Invoices</h3>
            <p className="text-xs text-slate-500">Latest completed point-of-sale transactions</p>
          </div>
          <Link to="/invoices" className="text-xs font-semibold text-blue-600 hover:text-blue-700">
            View All Invoices &rarr;
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Invoice #</th>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Customer</th>
                <th className="py-2.5 px-3">Total Amount</th>
                <th className="py-2.5 px-3">Paid Amount</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(data?.recentInvoices || []).length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-400">
                    No invoices recorded yet. Start billing via the POS screen!
                  </td>
                </tr>
              ) : (
                data.recentInvoices.map((inv: any) => (
                  <tr key={inv.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-mono font-bold text-blue-600">
                      {inv.invoice_number}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">
                      {new Date(inv.invoice_date).toLocaleDateString('en-IN')}
                    </td>
                    <td className="py-2.5 px-3 text-slate-800 font-medium">
                      {inv.customer?.name || 'Walk-in'}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">
                      ₹{Number(inv.total_amount).toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-emerald-600">
                      ₹{Number(inv.paid_amount).toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {inv.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
