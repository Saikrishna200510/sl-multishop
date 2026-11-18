import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { BarChart3, FileSpreadsheet, PieChart, TrendingUp, Calendar } from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const [gstReport, setGstReport] = useState<any[]>([]);
  const [pnlReport, setPnlReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadReports() {
      setLoading(true);
      try {
        const [gstRes, pnlRes] = await Promise.all([
          api.get<any>('/reports/gst-tax'),
          api.get<any>('/reports/profit-loss')
        ]);

        if (gstRes.data?.taxBreakdown) setGstReport(gstRes.data.taxBreakdown);
        if (pnlRes.data) setPnlReport(pnlRes.data);
      } catch (err) {
        console.error('Failed to load reports:', err);
      } finally {
        setLoading(false);
      }
    }
    loadReports();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Financial Reports & GST Filing</h1>
        <p className="text-xs text-slate-500">Tax compliance statements, profit & loss analysis, and sales metrics</p>
      </div>

      {/* Profit & Loss Card Overview */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center space-x-2">
          <TrendingUp className="w-4 h-4 text-blue-600" />
          <span>Monthly Profit & Loss Summary</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[11px] font-semibold text-slate-500 uppercase">Gross Revenue</span>
            <div className="text-lg font-bold text-slate-900 mt-1">
              ₹{Number(pnlReport?.totalRevenue || 0).toLocaleString('en-IN')}
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[11px] font-semibold text-slate-500 uppercase">Cost of Goods (COGS)</span>
            <div className="text-lg font-bold text-slate-700 mt-1">
              ₹{Number(pnlReport?.totalCostOfGoodsSold || 0).toLocaleString('en-IN')}
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[11px] font-semibold text-slate-500 uppercase">Gross Profit</span>
            <div className="text-lg font-bold text-blue-600 mt-1">
              ₹{Number(pnlReport?.grossProfit || 0).toLocaleString('en-IN')}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              Margin: {pnlReport?.grossMarginPercent || 0}%
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[11px] font-semibold text-slate-500 uppercase">Operating Expenses</span>
            <div className="text-lg font-bold text-rose-600 mt-1">
              ₹{Number(pnlReport?.operatingExpenses || 0).toLocaleString('en-IN')}
            </div>
          </div>

          <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
            <span className="text-[11px] font-semibold text-emerald-800 uppercase">Net Store Profit</span>
            <div className="text-xl font-extrabold text-emerald-700 mt-1">
              ₹{Number(pnlReport?.netProfit || 0).toLocaleString('en-IN')}
            </div>
          </div>
        </div>
      </div>

      {/* GST Tax Breakdown Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">GST Tax Breakdown (GSTR-1 / GSTR-3B Ready)</h3>
            <p className="text-xs text-slate-500">Taxable turnover and CGST / SGST breakdown categorized by rate</p>
          </div>
          <button
            onClick={() => window.print()}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
            <span>Print Report</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Tax Slab Rate</th>
                <th className="py-3 px-4 text-right">Taxable Turnover (₹)</th>
                <th className="py-3 px-4 text-right">CGST (Central Tax)</th>
                <th className="py-3 px-4 text-right">SGST (State Tax)</th>
                <th className="py-3 px-4 text-right">Total GST Amount (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-400">Loading tax breakdown...</td>
                </tr>
              ) : gstReport.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-400">No GST transactions recorded.</td>
                </tr>
              ) : (
                gstReport.map((row) => (
                  <tr key={row.taxRate} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-bold text-slate-900">GST {row.taxRate}%</td>
                    <td className="py-3 px-4 text-right font-medium">₹{Number(row.taxableAmount).toFixed(2)}</td>
                    <td className="py-3 px-4 text-right font-medium text-slate-600">₹{Number(row.cgstAmount).toFixed(2)}</td>
                    <td className="py-3 px-4 text-right font-medium text-slate-600">₹{Number(row.sgstAmount).toFixed(2)}</td>
                    <td className="py-3 px-4 text-right font-bold text-blue-700">₹{Number(row.totalTaxAmount).toFixed(2)}</td>
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
