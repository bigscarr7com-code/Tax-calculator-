import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calculator, 
  Info, 
  RefreshCw, 
  TrendingUp, 
  Wallet, 
  ShieldCheck, 
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { 
  calculateTax, 
  fetchLatestTaxRates, 
  DEFAULT_GHANA_TAX_RATES, 
  type TaxRates 
} from './services/taxService';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const [income, setIncome] = useState<string>('');
  const [isAnnual, setIsAnnual] = useState(false);
  const [rates, setRates] = useState<TaxRates>(DEFAULT_GHANA_TAX_RATES);
  const [isLoadingRates, setIsLoadingRates] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);

  useEffect(() => {
    const loadRates = async () => {
      setIsLoadingRates(true);
      const latest = await fetchLatestTaxRates();
      setRates(latest);
      setIsLoadingRates(false);
    };
    loadRates();
  }, []);

  const results = useMemo(() => {
    const numIncome = parseFloat(income) || 0;
    const monthlyIncome = isAnnual ? numIncome / 12 : numIncome;
    return calculateTax(monthlyIncome, rates);
  }, [income, isAnnual, rates]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
    }).format(val);
  };

  const handleRefreshRates = async () => {
    setIsLoadingRates(true);
    const latest = await fetchLatestTaxRates();
    setRates(latest);
    setIsLoadingRates(false);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1A1A1A] font-sans selection:bg-emerald-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white">
              <Calculator size={18} />
            </div>
            <h1 className="font-bold text-lg tracking-tight">TaxGH</h1>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={handleRefreshRates}
              disabled={isLoadingRates}
              className="flex items-center gap-2 text-xs font-medium text-gray-500 hover:text-emerald-600 transition-colors disabled:opacity-50"
            >
              <RefreshCw size={14} className={cn(isLoadingRates && "animate-spin")} />
              {isLoadingRates ? 'Updating Rates...' : `Rates: ${rates.year}`}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Input Section */}
          <div className="lg:col-span-5 space-y-6">
            <section className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-6 flex items-center gap-2">
                <Wallet size={16} />
                Income Details
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="income" className="block text-sm font-medium text-gray-700 mb-2">
                    Gross Income (GHS)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">₵</span>
                    <input
                      id="income"
                      type="number"
                      value={income}
                      onChange={(e) => setIncome(e.target.value)}
                      placeholder="e.g. 5000"
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-lg font-medium"
                    />
                  </div>
                </div>

                <div className="flex p-1 bg-gray-100 rounded-xl">
                  <button
                    onClick={() => setIsAnnual(false)}
                    className={cn(
                      "flex-1 py-2 text-sm font-medium rounded-lg transition-all",
                      !isAnnual ? "bg-white shadow-sm text-emerald-700" : "text-gray-500 hover:text-gray-700"
                    )}
                  >
                    Monthly
                  </button>
                  <button
                    onClick={() => setIsAnnual(true)}
                    className={cn(
                      "flex-1 py-2 text-sm font-medium rounded-lg transition-all",
                      isAnnual ? "bg-white shadow-sm text-emerald-700" : "text-gray-500 hover:text-gray-700"
                    )}
                  >
                    Annual
                  </button>
                </div>
              </div>
            </section>

            <section className="bg-emerald-50 rounded-2xl border border-emerald-100 p-6">
              <div className="flex gap-4">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-emerald-600 shrink-0 shadow-sm">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h3 className="font-semibold text-emerald-900">SSNIT Contribution</h3>
                  <p className="text-sm text-emerald-700 mt-1">
                    Your mandatory 5.5% contribution is automatically deducted from your gross income before tax.
                  </p>
                </div>
              </div>
            </section>

            <div className="text-xs text-gray-400 leading-relaxed">
              <p className="flex items-start gap-2">
                <Info size={14} className="shrink-0 mt-0.5" />
                This calculator uses the standard PAYE graduated tax rates provided by the Ghana Revenue Authority (GRA). Rates are verified live using AI search.
              </p>
            </div>
          </div>

          {/* Results Section */}
          <div className="lg:col-span-7">
            <motion.div 
              layout
              className="bg-white rounded-3xl border border-gray-200 shadow-xl overflow-hidden"
            >
              <div className="p-8 md:p-10 space-y-8">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-1">Estimated Net Pay</h2>
                    <p className="text-xs text-gray-500 italic">Take-home income after all deductions</p>
                  </div>
                  <div className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-bold uppercase tracking-widest">
                    Monthly
                  </div>
                </div>

                <div className="py-4">
                  <motion.div 
                    key={results.netIncome}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-5xl md:text-6xl font-bold tracking-tighter text-emerald-600"
                  >
                    {formatCurrency(results.netIncome)}
                  </motion.div>
                </div>

                <div className="space-y-4 pt-4 border-t border-gray-100">
                  <div className="flex justify-between items-center group">
                    <span className="text-gray-500 flex items-center gap-2">
                      Gross Income
                    </span>
                    <span className="font-semibold">{formatCurrency(results.grossIncome)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 flex items-center gap-2">
                      SSNIT (5.5%)
                    </span>
                    <span className="font-semibold text-red-500">-{formatCurrency(results.ssnit)}</span>
                  </div>

                  <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-600">Taxable Income</span>
                    <span className="text-sm font-bold">{formatCurrency(results.taxableIncome)}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 flex items-center gap-2">
                      Total Income Tax (PAYE)
                    </span>
                    <span className="font-semibold text-red-500">-{formatCurrency(results.totalTax)}</span>
                  </div>
                </div>

                <button 
                  onClick={() => setShowBreakdown(!showBreakdown)}
                  className="w-full py-4 flex items-center justify-center gap-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 rounded-2xl transition-all border border-dashed border-gray-200"
                >
                  {showBreakdown ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  {showBreakdown ? 'Hide' : 'Show'} Tax Bracket Breakdown
                </button>

                <AnimatePresence>
                  {showBreakdown && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-3 pt-4">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Graduated Tax Brackets</h4>
                        {results.breakdown.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center text-sm">
                            <div className="flex flex-col">
                              <span className="text-gray-600 font-medium">{item.bracket}</span>
                              <span className="text-[10px] text-gray-400">at {(rates.brackets[idx].rate * 100).toFixed(1)}%</span>
                            </div>
                            <div className="text-right">
                              <div className="font-mono text-xs text-gray-400">{formatCurrency(item.amount)} taxed</div>
                              <div className="font-semibold">{formatCurrency(item.tax)}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="bg-gray-900 p-8 text-white">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold">Annual Summary</h3>
                  <TrendingUp className="text-emerald-400" size={20} />
                </div>
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <p className="text-xs text-gray-400 uppercase font-bold tracking-widest mb-1">Annual Take-home</p>
                    <p className="text-2xl font-bold">{formatCurrency(results.netIncome * 12)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase font-bold tracking-widest mb-1">Annual Total Tax</p>
                    <p className="text-2xl font-bold text-red-400">{formatCurrency(results.totalTax * 12)}</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {rates.source && (
              <div className="mt-6 flex items-center gap-2 justify-center text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                Live Data Verified by Gemini AI
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-5xl mx-auto px-4 py-12 border-t border-gray-200 mt-12">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 opacity-50">
            <Calculator size={16} />
            <span className="text-sm font-bold tracking-tighter">TaxGH</span>
          </div>
          <div className="flex gap-8">
            <a href="https://gra.gov.gh" target="_blank" rel="noreferrer" className="text-xs font-semibold text-gray-400 hover:text-emerald-600 transition-colors">GRA Website</a>
            <a href="https://ssnit.org.gh" target="_blank" rel="noreferrer" className="text-xs font-semibold text-gray-400 hover:text-emerald-600 transition-colors">SSNIT Portal</a>
          </div>
          <p className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">
            © 2025 Ghana Tax Calculator
          </p>
        </div>
      </footer>
    </div>
  );
}
