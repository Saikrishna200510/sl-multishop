import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.js';
import { Modal } from '../components/Modal.js';
import { Store, ShieldCheck, CreditCard, Users, Printer, CheckCircle } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { activeShop } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [profileForm, setProfileForm] = useState({
    name: '',
    phone: '',
    email: '',
    gstin: ''
  });

  const [settingsForm, setSettingsForm] = useState({
    receipt_printer_type: 'THERMAL_80MM',
    invoice_prefix: 'INV-',
    invoice_footer_note: '',
    telugu_invoice_enabled: true
  });

  // Renewal Modal
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [renewPlan, setRenewPlan] = useState('business');
  const [renewCycle, setRenewCycle] = useState<'MONTHLY' | 'ANNUAL'>('MONTHLY');
  const [upiRef, setUpiRef] = useState('');

  const loadSettings = async () => {
    setLoading(true);
    try {
      const [profRes, subRes, staffRes] = await Promise.all([
        api.get<any>('/shops/profile'),
        api.get<any>('/subscriptions/my'),
        api.get<any[]>('/shops/staff')
      ]);

      if (profRes.data) {
        setProfile(profRes.data);
        setProfileForm({
          name: profRes.data.name || '',
          phone: profRes.data.phone || '',
          email: profRes.data.email || '',
          gstin: profRes.data.gstin || ''
        });
        if (profRes.data.shop_settings) {
          setSettingsForm({
            receipt_printer_type: profRes.data.shop_settings.receipt_printer_type || 'THERMAL_80MM',
            invoice_prefix: profRes.data.shop_settings.invoice_prefix || 'INV-',
            invoice_footer_note: profRes.data.shop_settings.invoice_footer_note || '',
            telugu_invoice_enabled: profRes.data.shop_settings.telugu_invoice_enabled ?? true
          });
        }
      }

      if (subRes.data) setSubscription(subRes.data);
      if (staffRes.data) setStaff(staffRes.data);
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.patch('/shops/profile', profileForm);
      alert('Shop profile updated successfully');
      loadSettings();
    } catch (err: any) {
      alert(err.message || 'Failed to update profile');
    }
  };

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.patch('/shops/settings', settingsForm);
      alert('Invoice and printer preferences saved');
      loadSettings();
    } catch (err: any) {
      alert(err.message || 'Failed to update settings');
    }
  };

  const handleSubmitRenewal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/subscriptions/pay', {
        planSlug: renewPlan,
        billingCycle: renewCycle,
        paymentMethod: 'UPI',
        transactionReference: upiRef
      });
      setShowRenewModal(false);
      setUpiRef('');
      alert('Payment reference submitted! Platform administrators will verify and activate your subscription shortly.');
      loadSettings();
    } catch (err: any) {
      alert(err.message || 'Payment submission failed');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Shop Settings & Subscription</h1>
        <p className="text-xs text-slate-500">Configure business identity, print templates, team members, and billing tier</p>
      </div>

      {/* Subscription Card */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-6 text-white shadow-md">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold uppercase tracking-wider bg-blue-500/20 text-blue-300 px-2.5 py-0.5 rounded border border-blue-500/30">
                {subscription?.subscription?.status || 'ACTIVE'} PLAN
              </span>
              <span className="text-xs text-slate-400">
                Expires in <span className="font-bold text-emerald-400">{subscription?.daysLeft || 0} days</span>
              </span>
            </div>
            <h2 className="text-2xl font-bold mt-2">
              {subscription?.subscription?.plan?.name || 'Business Plan'}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Current billing cycle: {subscription?.subscription?.billing_cycle}
            </p>
          </div>

          <button
            onClick={() => setShowRenewModal(true)}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow transition"
          >
            Renew / Upgrade Plan
          </button>
        </div>

        {/* Usage Limits Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-700/60 text-xs">
          <div>
            <span className="text-slate-400">Branches</span>
            <div className="text-base font-bold text-white mt-0.5">
              {subscription?.usage?.branches?.current || 1} / {subscription?.usage?.branches?.max || 3}
            </div>
          </div>
          <div>
            <span className="text-slate-400">Billing Counters</span>
            <div className="text-base font-bold text-white mt-0.5">
              {subscription?.usage?.counters?.current || 1} / {subscription?.usage?.counters?.max || 5}
            </div>
          </div>
          <div>
            <span className="text-slate-400">Staff Members</span>
            <div className="text-base font-bold text-white mt-0.5">
              {subscription?.usage?.users?.current || 1} / {subscription?.usage?.users?.max || 10}
            </div>
          </div>
          <div>
            <span className="text-slate-400">Products Catalog</span>
            <div className="text-base font-bold text-white mt-0.5">
              {subscription?.usage?.products?.current || 0} / {subscription?.usage?.products?.max || 15000}
            </div>
          </div>
        </div>
      </div>

      {/* Two-Column Profile & Print Preferences Form */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Business Profile */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center space-x-2">
            <Store className="w-4 h-4 text-blue-600" />
            <span>Store Profile & Tax Identity</span>
          </h3>

          <form onSubmit={handleUpdateProfile} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Shop Legal Name
              </label>
              <input
                type="text"
                required
                value={profileForm.name}
                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                className="mt-1 w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Store Contact Phone
              </label>
              <input
                type="tel"
                value={profileForm.phone}
                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                className="mt-1 w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Email Address
              </label>
              <input
                type="email"
                value={profileForm.email}
                onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                className="mt-1 w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                GSTIN
              </label>
              <input
                type="text"
                value={profileForm.gstin}
                onChange={(e) => setProfileForm({ ...profileForm, gstin: e.target.value })}
                placeholder="37AAAAA0000A1Z5"
                className="mt-1 w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase font-mono"
              />
            </div>

            <button
              type="submit"
              className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition"
            >
              Save Profile Changes
            </button>
          </form>
        </div>

        {/* Invoice & Printer Configuration */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center space-x-2">
            <Printer className="w-4 h-4 text-blue-600" />
            <span>POS Printing & Language</span>
          </h3>

          <form onSubmit={handleUpdateSettings} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Default Receipt Printer
              </label>
              <select
                value={settingsForm.receipt_printer_type}
                onChange={(e) => setSettingsForm({ ...settingsForm, receipt_printer_type: e.target.value })}
                className="mt-1 w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="THERMAL_80MM">80mm Thermal Receipt (Standard Retail)</option>
                <option value="THERMAL_58MM">58mm Thermal Receipt (Small)</option>
                <option value="A4">A4 Full Sheet GST Tax Invoice</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Invoice Prefix
              </label>
              <input
                type="text"
                value={settingsForm.invoice_prefix}
                onChange={(e) => setSettingsForm({ ...settingsForm, invoice_prefix: e.target.value })}
                className="mt-1 w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Receipt Footer Greeting Note
              </label>
              <input
                type="text"
                value={settingsForm.invoice_footer_note}
                onChange={(e) => setSettingsForm({ ...settingsForm, invoice_footer_note: e.target.value })}
                placeholder="Thank you! Please visit again."
                className="mt-1 w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="pt-2">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settingsForm.telugu_invoice_enabled}
                  onChange={(e) => setSettingsForm({ ...settingsForm, telugu_invoice_enabled: e.target.checked })}
                  className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                />
                <span className="text-xs font-semibold text-slate-800">
                  Enable Telugu Bilingual Invoices (తెలుగు రసీదులు)
                </span>
              </label>
            </div>

            <button
              type="submit"
              className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition"
            >
              Save Printer Preferences
            </button>
          </form>
        </div>
      </div>

      {/* Staff Members Table */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center space-x-2">
          <Users className="w-4 h-4 text-blue-600" />
          <span>Staff Accounts & User Roles</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Name</th>
                <th className="py-2.5 px-3">Email</th>
                <th className="py-2.5 px-3">Role</th>
                <th className="py-2.5 px-3">Branch</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {staff.map((s) => (
                <tr key={s.membershipId} className="hover:bg-slate-50">
                  <td className="py-2.5 px-3 font-semibold text-slate-800">
                    {s.user.first_name} {s.user.last_name}
                  </td>
                  <td className="py-2.5 px-3 text-slate-600">{s.user.email}</td>
                  <td className="py-2.5 px-3 font-bold text-blue-600">{s.role}</td>
                  <td className="py-2.5 px-3 text-slate-600">{s.branch?.name || 'All Branches'}</td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700">
                      {s.user.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Renewal / Upgrade Modal */}
      <Modal isOpen={showRenewModal} onClose={() => setShowRenewModal(false)} title="Renew or Upgrade Subscription" maxWidth="md">
        <form onSubmit={handleSubmitRenewal} className="space-y-4">
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800">
            <p className="font-semibold">UPI Payment Instructions:</p>
            <p className="mt-1">
              Transfer subscription fees to UPI ID: <span className="font-mono font-bold">slit@okaxis</span>
            </p>
            <p className="text-[11px] text-blue-600 mt-0.5">
              Account Name: SL IT SOLUTIONS
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">Target Plan</label>
            <select
              value={renewPlan}
              onChange={(e) => setRenewPlan(e.target.value)}
              className="mt-1 w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="starter">Starter Plan (₹999/mo / ₹9,990/yr)</option>
              <option value="business">Business Plan (₹2,499/mo / ₹24,990/yr)</option>
              <option value="enterprise">Enterprise Plan (₹4,999/mo / ₹49,990/yr)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">Billing Cycle</label>
            <select
              value={renewCycle}
              onChange={(e) => setRenewCycle(e.target.value as any)}
              className="mt-1 w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="MONTHLY">Monthly</option>
              <option value="ANNUAL">Annual (2 Months Free!)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
              UPI Transaction Reference / UTR Number
            </label>
            <input
              type="text"
              required
              placeholder="e.g. 432109876543"
              value={upiRef}
              onChange={(e) => setUpiRef(e.target.value)}
              className="mt-1 w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            />
          </div>

          <div className="pt-2 flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setShowRenewModal(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm"
            >
              Submit Payment Reference
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
