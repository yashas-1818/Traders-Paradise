import { useEffect, useState } from 'react';
import { SectionLayout } from '@/components/SectionLayout';
import { PieChart, Wallet, ArrowUpRight, BarChart2, Plus, Trash2, RefreshCw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import axios from 'axios';

interface Holding {
  _id: string;
  symbol: string;
  shares: number;
  avgBuyPrice: number;
}

interface EnrichedHolding extends Holding {
  currentPrice: number | null;
  pnl: number | null;
  currentValue: number | null;
  changePct: number | null;
}

const API = 'http://localhost:5000/api';

async function fetchLivePrice(symbol: string): Promise<{ price: number; changePct: number } | null> {
  try {
    const res = await fetch(`/yahoo-finance/v8/finance/chart/${symbol}`);
    const data = await res.json();
    const meta = data?.chart?.result?.[0]?.meta;
    if (!meta) return null;
    const price: number = meta.regularMarketPrice;
    const prev: number = meta.chartPreviousClose ?? meta.previousClose;
    const changePct = ((price - prev) / prev) * 100;
    return { price, changePct };
  } catch {
    return null;
  }
}

const Portfolio = () => {
  const { token } = useAuth();
  const [holdings, setHoldings] = useState<EnrichedHolding[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Add holding form
  const [showForm, setShowForm] = useState(false);
  const [formSymbol, setFormSymbol] = useState('');
  const [formShares, setFormShares] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const headers = { Authorization: `Bearer ${token}` };

  const fetchHoldings = async () => {
    try {
      const res = await axios.get<Holding[]>(`${API}/holdings`, { headers });
      const rawHoldings = res.data;

      // Fetch live prices in parallel
      const enriched: EnrichedHolding[] = await Promise.all(
        rawHoldings.map(async (h) => {
          const live = await fetchLivePrice(h.symbol);
          const currentPrice = live?.price ?? null;
          const currentValue = currentPrice != null ? currentPrice * h.shares : null;
          const pnl = currentPrice != null ? (currentPrice - h.avgBuyPrice) * h.shares : null;
          const changePct = live?.changePct ?? null;
          return { ...h, currentPrice, currentValue, pnl, changePct };
        })
      );

      setHoldings(enriched);
    } catch (err) {
      console.error('Failed to fetch holdings', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHoldings();
    const interval = setInterval(() => {
      setRefreshing(true);
      fetchHoldings();
    }, 15000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const totalValue = holdings.reduce((sum, h) => sum + (h.currentValue ?? 0), 0);
  const totalCost = holdings.reduce((sum, h) => sum + h.avgBuyPrice * h.shares, 0);
  const totalPnl = holdings.reduce((sum, h) => sum + (h.pnl ?? 0), 0);
  const totalReturnPct = totalCost > 0 ? ((totalValue - totalCost) / totalCost) * 100 : 0;

  const handleAddHolding = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);
    try {
      await axios.post(`${API}/holdings`, {
        symbol: formSymbol.toUpperCase().trim(),
        shares: parseFloat(formShares),
        avgBuyPrice: parseFloat(formPrice),
      }, { headers });
      setFormSymbol('');
      setFormShares('');
      setFormPrice('');
      setShowForm(false);
      setLoading(true);
      fetchHoldings();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to add holding');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`${API}/holdings/${id}`, { headers });
      setHoldings((prev) => prev.filter((h) => h._id !== id));
    } catch (err) {
      console.error('Failed to delete holding', err);
    }
  };

  return (
    <SectionLayout title="Portfolio" subtitle="Track and manage your investments in one place.">
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <div className="p-5 rounded-xl bg-hero-surface border border-hero-border">
          <Wallet className="w-5 h-5 text-hero-accent mb-2" />
          <p className="text-sm text-hero-text-muted">Total Value</p>
          <p className="text-2xl font-bold">
            {loading ? '—' : '₹' + totalValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </p>
        </div>
        <div className="p-5 rounded-xl bg-hero-surface border border-hero-border">
          <ArrowUpRight className="w-5 h-5 text-hero-accent mb-2" />
          <p className="text-sm text-hero-text-muted">Total P&L</p>
          <p className={`text-2xl font-bold ${totalPnl >= 0 ? 'text-hero-accent' : 'text-red-400'}`}>
            {loading ? '—' : (totalPnl >= 0 ? '+' : '') + '₹' + totalPnl.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </p>
        </div>
        <div className="p-5 rounded-xl bg-hero-surface border border-hero-border">
          <PieChart className="w-5 h-5 text-hero-accent mb-2" />
          <p className="text-sm text-hero-text-muted">Assets</p>
          <p className="text-2xl font-bold">{loading ? '—' : holdings.length}</p>
        </div>
        <div className="p-5 rounded-xl bg-hero-surface border border-hero-border">
          <BarChart2 className="w-5 h-5 text-hero-accent mb-2" />
          <p className="text-sm text-hero-text-muted">Overall Return</p>
          <p className={`text-2xl font-bold ${totalReturnPct >= 0 ? 'text-hero-accent' : 'text-red-400'}`}>
            {loading ? '—' : (totalReturnPct >= 0 ? '+' : '') + totalReturnPct.toFixed(2) + '%'}
          </p>
        </div>
      </div>

      {/* Holdings header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold">Holdings</h2>
          {refreshing && <RefreshCw className="w-4 h-4 text-hero-text-muted animate-spin" />}
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-hero-accent text-hero-bg font-semibold text-sm hover:bg-hero-accent/80 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Holding
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="mb-6 p-6 rounded-xl bg-hero-surface border border-hero-border">
          <h3 className="text-lg font-semibold mb-4">Add New Holding</h3>
          {formError && (
            <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
              {formError}
            </div>
          )}
          <form onSubmit={handleAddHolding} className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <input
              type="text"
              placeholder="Symbol (e.g. RELIANCE.NS)"
              value={formSymbol}
              onChange={(e) => setFormSymbol(e.target.value)}
              required
              className="px-4 py-3 rounded-xl bg-hero-bg border border-hero-border text-hero-text focus:outline-none focus:border-hero-accent/40"
            />
            <input
              type="number"
              placeholder="Shares"
              value={formShares}
              onChange={(e) => setFormShares(e.target.value)}
              required
              step="any"
              min="0"
              className="px-4 py-3 rounded-xl bg-hero-bg border border-hero-border text-hero-text focus:outline-none focus:border-hero-accent/40"
            />
            <input
              type="number"
              placeholder="Avg Buy Price (₹)"
              value={formPrice}
              onChange={(e) => setFormPrice(e.target.value)}
              required
              step="any"
              min="0"
              className="px-4 py-3 rounded-xl bg-hero-bg border border-hero-border text-hero-text focus:outline-none focus:border-hero-accent/40"
            />
            <button
              type="submit"
              disabled={formLoading}
              className="py-3 rounded-xl bg-hero-accent text-hero-bg font-semibold hover:bg-hero-accent/80 transition-colors disabled:opacity-50"
            >
              {formLoading ? 'Adding...' : 'Add'}
            </button>
          </form>
        </div>
      )}

      {/* Loading skeleton */}
      {loading ? (
        <div className="rounded-xl border border-hero-border overflow-hidden">
          <div className="bg-hero-surface p-4">
            <div className="h-4 bg-hero-border rounded w-full animate-pulse" />
          </div>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="p-4 border-t border-hero-border flex gap-8">
              <div className="h-4 bg-hero-border rounded w-24 animate-pulse" />
              <div className="h-4 bg-hero-border rounded w-16 animate-pulse" />
              <div className="h-4 bg-hero-border rounded w-24 animate-pulse" />
              <div className="h-4 bg-hero-border rounded w-20 animate-pulse" />
              <div className="h-4 bg-hero-border rounded w-20 animate-pulse" />
            </div>
          ))}
        </div>
      ) : holdings.length === 0 ? (
        /* Empty state */
        <div className="text-center py-16 rounded-xl border border-hero-border bg-hero-surface/30">
          <Wallet className="w-12 h-12 text-hero-text-muted mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-hero-text mb-2">No Holdings Yet</h3>
          <p className="text-hero-text-muted mb-6">Add your first stock holding to start tracking your portfolio.</p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-hero-accent text-hero-bg font-semibold hover:bg-hero-accent/80 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Your First Holding
          </button>
        </div>
      ) : (
        /* Holdings table */
        <div className="rounded-xl border border-hero-border overflow-hidden">
          <table className="w-full">
            <thead className="bg-hero-surface">
              <tr className="text-left text-sm text-hero-text-muted">
                <th className="p-4">Symbol</th>
                <th className="p-4">Shares</th>
                <th className="p-4">Avg Buy</th>
                <th className="p-4">LTP</th>
                <th className="p-4">Current Value</th>
                <th className="p-4">P&L</th>
                <th className="p-4">Day %</th>
                <th className="p-4"></th>
              </tr>
            </thead>
            <tbody>
              {holdings.map((h) => {
                const pnlPositive = (h.pnl ?? 0) >= 0;
                const dayPositive = (h.changePct ?? 0) >= 0;
                return (
                  <tr key={h._id} className="border-t border-hero-border hover:bg-hero-surface/50 transition-colors">
                    <td className="p-4 font-semibold">{h.symbol}</td>
                    <td className="p-4 text-hero-text-muted">{h.shares}</td>
                    <td className="p-4 text-hero-text-muted">₹{h.avgBuyPrice.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                    <td className="p-4">
                      {h.currentPrice != null
                        ? '₹' + h.currentPrice.toLocaleString('en-IN', { maximumFractionDigits: 2 })
                        : '—'}
                    </td>
                    <td className="p-4">
                      {h.currentValue != null
                        ? '₹' + h.currentValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })
                        : '—'}
                    </td>
                    <td className={`p-4 font-semibold ${pnlPositive ? 'text-hero-accent' : 'text-red-400'}`}>
                      {h.pnl != null
                        ? (pnlPositive ? '+' : '') + '₹' + h.pnl.toLocaleString('en-IN', { maximumFractionDigits: 2 })
                        : '—'}
                    </td>
                    <td className={`p-4 ${dayPositive ? 'text-hero-accent' : 'text-red-400'}`}>
                      {h.changePct != null
                        ? (dayPositive ? '+' : '') + h.changePct.toFixed(2) + '%'
                        : '—'}
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => handleDelete(h._id)}
                        className="text-hero-text-muted hover:text-red-400 transition-colors"
                        title="Delete holding"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </SectionLayout>
  );
};

export default Portfolio;
