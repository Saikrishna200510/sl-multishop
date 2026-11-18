import React, { useState, useRef, useEffect } from 'react';
import { Search, Barcode, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export interface ProductItem {
  id: string;
  name: string;
  sku: string;
  barcode?: string;
  unit: { code: string };
  selling_price: number;
  tax_rate: number;
  category?: { id: string; name: string };
  stock_balances?: Array<{ quantity: number }>;
}

interface POSProductGridProps {
  products: ProductItem[];
  categories: Array<{ id: string; name: string }>;
  onSelectProduct: (product: ProductItem) => void;
  onBarcodeScan: (barcode: string) => void;
}

export const POSProductGrid: React.FC<POSProductGridProps> = ({
  products,
  categories,
  onSelectProduct,
  onBarcodeScan
}) => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [barcodeInput, setBarcodeInput] = useState('');
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Auto focus barcode input on load
  useEffect(() => {
    barcodeInputRef.current?.focus();
  }, []);

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (barcodeInput.trim()) {
      onBarcodeScan(barcodeInput.trim());
      setBarcodeInput('');
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategory === 'ALL' || p.category?.id === selectedCategory;
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.barcode && p.barcode.includes(searchTerm));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="flex flex-col h-full space-y-3">
      {/* Search and Barcode Header */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-2">
        {/* Barcode scanner dedicated input */}
        <form onSubmit={handleBarcodeSubmit} className="relative sm:w-1/3">
          <Barcode className="w-4 h-4 text-blue-600 absolute left-3 top-3" />
          <input
            ref={barcodeInputRef}
            type="text"
            value={barcodeInput}
            onChange={(e) => setBarcodeInput(e.target.value)}
            placeholder="Scan Barcode [Enter]..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-blue-50/50 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono font-medium"
          />
        </form>

        {/* Text search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('pos.searchPlaceholder')}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Category filter pills */}
      <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setSelectedCategory('ALL')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
            selectedCategory === 'ALL'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
          }`}
        >
          All Items ({products.length})
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelectedCategory(c.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
              selectedCategory === c.id
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {/* Product Cards Grid */}
      <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 pr-1">
        {filteredProducts.map((p) => {
          const totalStock = p.stock_balances?.reduce((sum, b) => sum + Number(b.quantity), 0) ?? 0;
          return (
            <div
              key={p.id}
              onClick={() => onSelectProduct(p)}
              className="bg-white border border-slate-200 hover:border-blue-400 rounded-xl p-3 shadow-sm hover:shadow-md cursor-pointer transition flex flex-col justify-between group relative overflow-hidden"
            >
              <div>
                <span className="text-[10px] text-slate-400 font-mono uppercase block">{p.sku}</span>
                <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition line-clamp-2 mt-0.5">
                  {p.name}
                </h4>
              </div>

              <div className="mt-3 flex items-end justify-between border-t border-slate-100 pt-2">
                <div>
                  <div className="text-xs font-extrabold text-slate-900">
                    Rs. {Number(p.selling_price).toFixed(2)}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Stock: <span className={totalStock <= 5 ? 'text-rose-600 font-bold' : ''}>{totalStock} {p.unit?.code}</span>
                  </div>
                </div>
                <div className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition">
                  <Plus className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
