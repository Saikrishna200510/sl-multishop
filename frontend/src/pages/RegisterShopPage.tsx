import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../services/api.js';
import { Store, ArrowRight, AlertCircle, CheckCircle } from 'lucide-react';

export const RegisterShopPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    shopName: '',
    businessType: 'GENERAL_RETAIL',
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
    planSlug: 'starter'
  });

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.post<any>('/auth/register', formData);
      if (res.data?.tokens) {
        login(res.data.tokens, res.data.user, res.data.shop, [
          {
            id: res.data.shop.id,
            name: res.data.shop.name,
            businessType: res.data.shop.businessType,
            roleName: 'Shop Owner'
          }
        ]);
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please check form values.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-xl text-center">
        <div className="inline-flex w-12 h-12 bg-blue-600 rounded-xl items-center justify-center text-white font-extrabold text-2xl shadow-md mb-2">
          SL
        </div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
          Register New Store Account
        </h2>
        <p className="mt-1 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          SL MultiShop – A Product of SL IT SOLUTIONS
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200 rounded-2xl sm:px-10">
          <form className="space-y-4" onSubmit={handleSubmit}>
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Shop Name
                </label>
                <input
                  type="text"
                  name="shopName"
                  required
                  value={formData.shopName}
                  onChange={handleChange}
                  placeholder="e.g. Sri Krishna Supermarket"
                  className="mt-1 w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Industry / Business Type
                </label>
                <select
                  name="businessType"
                  value={formData.businessType}
                  onChange={handleChange}
                  className="mt-1 w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="GENERAL_RETAIL">General Retail Store</option>
                  <option value="GROCERY">Grocery & Supermarket (Weight/Expiry)</option>
                  <option value="CLOTHING">Clothing & Apparel (Sizes/Colors)</option>
                  <option value="ELECTRONICS">Electronics (Serial No/Warranty)</option>
                  <option value="PHARMACY">Pharmacy (Batch/Expiry/Rx)</option>
                  <option value="RESTAURANT">Restaurant & Cafe (Tables/KOT)</option>
                  <option value="HARDWARE">Hardware & Building Supplies</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  First Name
                </label>
                <input
                  type="text"
                  name="firstName"
                  required
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="Suresh"
                  className="mt-1 w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Last Name
                </label>
                <input
                  type="text"
                  name="lastName"
                  required
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Reddy"
                  className="mt-1 w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="owner@store.com"
                  className="mt-1 w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Mobile Phone
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+91 9876543210"
                  className="mt-1 w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Create Password
              </label>
              <input
                type="password"
                name="password"
                required
                minLength={8}
                value={formData.password}
                onChange={handleChange}
                placeholder="Minimum 8 characters"
                className="mt-1 w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Subscription Plan Choice */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Select Starting Plan (Includes 14-day Free Trial)
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { slug: 'starter', name: 'Starter', price: '₹999/mo', desc: '1 Counter, 1000 items' },
                  { slug: 'business', name: 'Business', price: '₹2,499/mo', desc: '3 Branches, 5 Counters' },
                  { slug: 'enterprise', name: 'Enterprise', price: '₹4,999/mo', desc: 'Unlimited Scale' }
                ].map((p) => (
                  <div
                    key={p.slug}
                    onClick={() => setFormData({ ...formData, planSlug: p.slug })}
                    className={`p-3 rounded-xl border cursor-pointer text-center transition ${
                      formData.planSlug === p.slug
                        ? 'border-blue-600 bg-blue-50/50 ring-1 ring-blue-500'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="text-xs font-bold text-slate-900">{p.name}</div>
                    <div className="text-xs font-extrabold text-blue-600 mt-0.5">{p.price}</div>
                    <div className="text-[10px] text-slate-500 mt-1">{p.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white text-sm font-bold rounded-xl shadow transition flex items-center justify-center space-x-2"
            >
              {loading ? (
                <span>Provisioning Account & Tenant Database...</span>
              ) : (
                <>
                  <span>Create Account & Launch Store</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-blue-600 hover:text-blue-700">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
