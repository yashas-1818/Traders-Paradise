import { useState, useCallback, useRef, useEffect } from 'react';
import { SectionLayout } from '@/components/SectionLayout';
import { TrendingUp, TrendingDown, BarChart3, Globe, RefreshCw, Search, X, Loader2, Clock } from 'lucide-react';
import { useMarketData } from '@/hooks/useMarketData';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const NSE_STOCKS = [
  { symbol: 'RELIANCE', name: 'Reliance Industries' },
  { symbol: 'TCS', name: 'Tata Consultancy Services' },
  { symbol: 'HDFCBANK', name: 'HDFC Bank' },
  { symbol: 'INFY', name: 'Infosys' },
  { symbol: 'ICICIBANK', name: 'ICICI Bank' },
  { symbol: 'HINDUNILVR', name: 'Hindustan Unilever' },
  { symbol: 'SBIN', name: 'State Bank of India' },
  { symbol: 'BHARTIARTL', name: 'Bharti Airtel' },
  { symbol: 'BAJFINANCE', name: 'Bajaj Finance' },
  { symbol: 'KOTAKBANK', name: 'Kotak Mahindra Bank' },
  { symbol: 'WIPRO', name: 'Wipro' },
  { symbol: 'AXISBANK', name: 'Axis Bank' },
  { symbol: 'TATAMOTORS', name: 'Tata Motors' },
  { symbol: 'MARUTI', name: 'Maruti Suzuki' },
  { symbol: 'SUNPHARMA', name: 'Sun Pharmaceutical' },
  { symbol: 'HCLTECH', name: 'HCL Technologies' },
  { symbol: 'ADANIENT', name: 'Adani Enterprises' },
  { symbol: 'ADANIPORTS', name: 'Adani Ports' },
  { symbol: 'ULTRACEMCO', name: 'UltraTech Cement' },
  { symbol: 'TITAN', name: 'Titan Company' },
  { symbol: 'NESTLEIND', name: 'Nestle India' },
  { symbol: 'POWERGRID', name: 'Power Grid Corp' },
  { symbol: 'NTPC', name: 'NTPC' },
  { symbol: 'ONGC', name: 'Oil & Natural Gas Corp' },
  { symbol: 'LTIM', name: 'LTIMindtree' },
  { symbol: 'TECHM', name: 'Tech Mahindra' },
  { symbol: 'BAJAJFINSV', name: 'Bajaj Finserv' },
  { symbol: 'DIVISLAB', name: "Divi's Laboratories" },
  { symbol: 'DRREDDY', name: "Dr. Reddy's Laboratories" },
  { symbol: 'CIPLA', name: 'Cipla' },
  { symbol: 'EICHERMOT', name: 'Eicher Motors' },
  { symbol: 'HEROMOTOCO', name: 'Hero MotoCorp' },
  { symbol: 'JSWSTEEL', name: 'JSW Steel' },
  { symbol: 'TATASTEEL', name: 'Tata Steel' },
  { symbol: 'COALINDIA', name: 'Coal India' },
  { symbol: 'ITC', name: 'ITC' },
  { symbol: 'GRASIM', name: 'Grasim Industries' },
  { symbol: 'INDUSINDBK', name: 'IndusInd Bank' },
  { symbol: 'BPCL', name: 'Bharat Petroleum' },
  { symbol: 'IOC', name: 'Indian Oil Corporation' },
];

const RANGES = [
  { label: '1D', interval: '5m',  range: '1d'  },
  { label: '1W', interval: '30m', range: '5d'  },
  { label: '1M', interval: '1d',  range: '1mo' },
  { label: '3M', interval: '1d',  range: '3mo' },
  { label: '1Y', interval: '1wk', range: '1y'  },
];

interface SearchResult {
  name: string; symbol: string; value: string;
  change: string; up: boolean;
  high: string; low: string; open: string;
}

interface ChartPoint { time: string; price: number; }

// ── Custom tooltip ──────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-hero-surface border border-hero-border rounded-lg px-3 py-2 text-xs shadow-xl">
        <p className="text-hero-text-muted mb-1">{label}</p>
        <p className="text-hero-accent font-bold">₹{payload[0].value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
      </div>
    );
  }
  return null;
};

const Markets = () => {
  const { marketData, loading, lastUpdated } = useMarketData();

  const [query, setQuery] = useState('');
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('tp_recent_searches') || '[]'); }
    catch { return []; }
  });

  // Chart state
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [chartLoading, setChartLoading] = useState(false);
  const [activeRange, setActiveRange] = useState('1D');
  const [chartSymbol, setChartSymbol] = useState('');

  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const suggestions = query.length > 0
    ? NSE_STOCKS.filter(s =>
        s.symbol.startsWith(query.toUpperCase()) ||
        s.name.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 6)
    : [];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!suggestionsRef.current?.contains(e.target as Node) &&
          !inputRef.current?.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fetchChart = useCallback(async (symbol: string, range: string) => {
    setChartLoading(true);
    const r = RANGES.find(r => r.label === range) || RANGES[0];
    const nsSymbol = symbol.includes('.') ? symbol : `${symbol}.NS`;
    try {
      const res = await fetch(
        `/yahoo-finance/v8/finance/chart/${nsSymbol}?interval=${r.interval}&range=${r.range}`
      );
      const data = await res.json();
      const result = data?.chart?.result?.[0];
      if (!result) return;

      const timestamps: number[] = result.timestamp ?? [];
      const closes: number[] = result.indicators?.quote?.[0]?.close ?? [];

      const points: ChartPoint[] = timestamps
        .map((ts, i) => ({
          time: new Date(ts * 1000).toLocaleTimeString('en-IN', {
            hour: '2-digit', minute: '2-digit',
            ...(range !== '1D' ? { month: 'short', day: 'numeric' } : {}),
          }),
          price: closes[i],
        }))
        .filter(p => p.price != null && !isNaN(p.price));

      setChartData(points);
    } catch { /* silent */ }
    finally { setChartLoading(false); }
  }, []);

  const saveRecentSearch = (symbol: string) => {
    const updated = [symbol, ...recentSearches.filter(s => s !== symbol)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('tp_recent_searches', JSON.stringify(updated));
  };

  const handleSearch = useCallback(async (raw: string) => {
    const input = raw.trim().toUpperCase();
    if (!input) return;

    setShowSuggestions(false);
    setSearching(true);
    setSearchError('');
    setSearchResult(null);
    setChartData([]);
    saveRecentSearch(input);

    const attempts = [`${input}.NS`, `${input}.BO`, input];
    for (const symbol of attempts) {
      try {
        const res = await fetch(`/yahoo-finance/v8/finance/chart/${symbol}`);
        const data = await res.json();
        const meta = data?.chart?.result?.[0]?.meta;
        if (!meta || !meta.regularMarketPrice) continue;

        const price: number = meta.regularMarketPrice;
        const prev: number = meta.chartPreviousClose ?? meta.previousClose;
        const changePct = ((price - prev) / prev) * 100;
        const up = changePct >= 0;
        const fmt = (n: number) => '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 2 });

        setSearchResult({
          name: meta.shortName ?? meta.symbol ?? input,
          symbol: meta.symbol ?? symbol,
          value: fmt(price),
          change: (up ? '+' : '') + changePct.toFixed(2) + '%',
          up,
          high: fmt(meta.regularMarketDayHigh ?? price),
          low: fmt(meta.regularMarketDayLow ?? price),
          open: fmt(meta.regularMarketOpen ?? price),
        });

        // Load chart
        const cleanSymbol = (meta.symbol ?? symbol).replace('.NS', '').replace('.BO', '');
        setChartSymbol(cleanSymbol);
        setActiveRange('1D');
        fetchChart(cleanSymbol, '1D');

        setSearching(false);
        return;
      } catch { continue; }
    }

    setSearchError(`No results for "${input}". Try TATAMOTORS, ADANIENT, BAJFINANCE.`);
    setSearching(false);
  }, [recentSearches, fetchChart]);

  const handleRangeChange = (range: string) => {
    setActiveRange(range);
    if (chartSymbol) fetchChart(chartSymbol, range);
  };

  const clearSearch = () => {
    setQuery(''); setSearchResult(null); setSearchError('');
    setShowSuggestions(false); setSelectedIndex(-1);
    setChartData([]); setChartSymbol('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex(i => Math.min(i + 1, suggestions.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIndex(i => Math.max(i - 1, -1)); }
    else if (e.key === 'Enter') {
      if (selectedIndex >= 0 && suggestions[selectedIndex]) {
        const s = suggestions[selectedIndex].symbol;
        setQuery(s); handleSearch(s);
      } else handleSearch(query);
    } else if (e.key === 'Escape') setShowSuggestions(false);
  };

  const isUp = searchResult?.up ?? true;
  const chartColor = isUp ? '#4ADE80' : '#EF4444';
  const minPrice = chartData.length ? Math.min(...chartData.map(d => d.price)) * 0.999 : 0;
  const maxPrice = chartData.length ? Math.max(...chartData.map(d => d.price)) * 1.001 : 0;

  return (
    <SectionLayout title="Markets" subtitle="Real-time Indian market data — NSE & BSE indices and top stocks.">

      {/* ── Search ── */}
      <div className="mb-8 relative">
        <div className="flex gap-3 items-center">
          <div className="relative flex-1 max-w-lg">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-hero-text-muted" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => { setQuery(e.target.value); setShowSuggestions(true); setSelectedIndex(-1); }}
              onFocus={() => setShowSuggestions(true)}
              onKeyDown={handleKeyDown}
              placeholder="Search any NSE/BSE stock..."
              className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-hero-surface border border-hero-border text-hero-text text-sm placeholder:text-hero-text-muted focus:outline-none focus:border-hero-accent/50 transition-colors"
            />
            {query && (
              <button onClick={clearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 text-hero-text-muted hover:text-hero-text">
                <X className="w-4 h-4" />
              </button>
            )}

            {/* Suggestions dropdown */}
            {showSuggestions && (suggestions.length > 0 || (query === '' && recentSearches.length > 0)) && (
              <div ref={suggestionsRef} className="absolute top-full left-0 right-0 mt-1 rounded-xl bg-hero-surface border border-hero-border shadow-xl z-50 overflow-hidden">
                {query === '' && recentSearches.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between px-4 py-2 border-b border-hero-border">
                      <span className="text-xs text-hero-text-muted flex items-center gap-1"><Clock className="w-3 h-3" /> Recent</span>
                      <button onClick={() => { setRecentSearches([]); localStorage.removeItem('tp_recent_searches'); }} className="text-xs text-hero-text-muted hover:text-hero-accent">Clear</button>
                    </div>
                    {recentSearches.map((s, i) => (
                      <button key={i} onClick={() => { setQuery(s); handleSearch(s); }}
                        className="w-full text-left px-4 py-2.5 hover:bg-hero-accent/5 text-sm text-hero-text-muted hover:text-hero-text transition-colors flex items-center gap-2">
                        <Clock className="w-3 h-3" /> {s}
                      </button>
                    ))}
                  </div>
                )}
                {suggestions.length > 0 && (
                  <div>
                    {query !== '' && <div className="px-4 py-2 border-b border-hero-border"><span className="text-xs text-hero-text-muted">Suggestions</span></div>}
                    {suggestions.map((s, i) => (
                      <button key={s.symbol} onClick={() => { setQuery(s.symbol); handleSearch(s.symbol); }}
                        className={`w-full text-left px-4 py-2.5 transition-colors flex items-center justify-between group ${selectedIndex === i ? 'bg-hero-accent/10' : 'hover:bg-hero-accent/5'}`}>
                        <div>
                          <span className="text-sm font-semibold text-hero-text">{s.symbol}</span>
                          <span className="text-xs text-hero-text-muted ml-2">{s.name}</span>
                        </div>
                        <span className="text-xs text-hero-accent opacity-0 group-hover:opacity-100 transition-opacity">Search →</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <button onClick={() => handleSearch(query)} disabled={!query || searching}
            className="px-4 py-2.5 bg-hero-accent text-hero-bg text-sm font-semibold rounded-xl hover:bg-hero-accent/80 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-2">
            {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            {searching ? 'Searching...' : 'Search'}
          </button>
        </div>

        {/* Quick chips */}
        <div className="flex flex-wrap gap-2 mt-3">
          <span className="text-xs text-hero-text-muted self-center">Quick:</span>
          {['TATAMOTORS','BAJFINANCE','ADANIENT','HCLTECH','MARUTI','SUNPHARMA','SBIN','TITAN'].map(s => (
            <button key={s} onClick={() => { setQuery(s); handleSearch(s); }}
              className="text-xs px-2.5 py-1 rounded-lg border border-hero-border text-hero-text-muted hover:border-hero-accent/40 hover:text-hero-accent transition-colors">
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* ── Error ── */}
      {searchError && (
        <div className="mb-6 p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-red-400 text-sm">{searchError}</div>
      )}

      {/* ── Search result + Chart ── */}
      {searchResult && (
        <div className="mb-8 rounded-xl bg-hero-surface border border-hero-accent/30 overflow-hidden">
          {/* Header */}
          <div className="p-5 flex items-start justify-between">
            <div>
              <p className="text-xs text-hero-text-muted mb-1">{searchResult.symbol}</p>
              <h3 className="text-xl font-bold text-hero-text">{searchResult.name}</h3>
              <p className={`text-sm font-semibold flex items-center gap-1 mt-1 ${isUp ? 'text-hero-accent' : 'text-red-400'}`}>
                {isUp ? <TrendingUp className="w-3 h-3"/> : <TrendingDown className="w-3 h-3"/>}
                {searchResult.change}
              </p>
            </div>
            <div className="flex items-start gap-4">
              <div className="text-right">
                <p className="text-3xl font-bold text-hero-text">{searchResult.value}</p>
                <div className="flex gap-4 mt-2">
                  {[['O', searchResult.open], ['H', searchResult.high], ['L', searchResult.low]].map(([l, v]) => (
                    <div key={l} className="text-right">
                      <p className="text-xs text-hero-text-muted">{l}</p>
                      <p className="text-xs font-semibold text-hero-text">{v}</p>
                    </div>
                  ))}
                </div>
              </div>
              <button onClick={clearSearch} className="text-hero-text-muted hover:text-hero-text mt-1">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Range selector */}
          <div className="flex gap-1 px-5 mb-3">
            {RANGES.map(r => (
              <button key={r.label} onClick={() => handleRangeChange(r.label)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${activeRange === r.label ? 'bg-hero-accent text-hero-bg' : 'text-hero-text-muted hover:text-hero-text hover:bg-hero-accent/10'}`}>
                {r.label}
              </button>
            ))}
          </div>

          {/* Chart */}
          <div className="h-56 px-2 pb-4">
            {chartLoading ? (
              <div className="h-full flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-hero-accent" />
              </div>
            ) : chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={chartColor} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={chartColor} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#6B7280' }} tickLine={false} axisLine={false}
                    interval={Math.floor(chartData.length / 5)} />
                  <YAxis domain={[minPrice, maxPrice]} tick={{ fontSize: 10, fill: '#6B7280' }} tickLine={false}
                    axisLine={false} tickFormatter={v => '₹' + v.toLocaleString('en-IN', { maximumFractionDigits: 0 })} width={70} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="price" stroke={chartColor} strokeWidth={2}
                    fill="url(#chartGrad)" dot={false} activeDot={{ r: 4, fill: chartColor }} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-hero-text-muted text-sm">
                No chart data available
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Refresh ── */}
      <div className="flex items-center gap-2 mb-4 text-xs text-hero-text-muted">
        <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
        {lastUpdated ? `Last updated: ${lastUpdated.toLocaleTimeString()}` : 'Fetching live data...'}
      </div>

      {/* ── Market cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading
          ? Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="p-5 rounded-xl bg-hero-surface border border-hero-border animate-pulse">
                <div className="h-4 bg-hero-border rounded w-24 mb-3" />
                <div className="h-8 bg-hero-border rounded w-32 mb-2" />
                <div className="h-4 bg-hero-border rounded w-16" />
              </div>
            ))
          : marketData.map((item) => (
              <div key={item.name} onClick={() => { setQuery(item.name); handleSearch(item.name); }}
                className="p-5 rounded-xl bg-hero-surface border border-hero-border hover:border-hero-accent/30 transition-colors cursor-pointer">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-hero-text-muted">{item.name}</span>
                  {item.up ? <TrendingUp className="w-4 h-4 text-hero-accent" /> : <TrendingDown className="w-4 h-4 text-destructive" />}
                </div>
                <p className="text-2xl font-bold text-hero-text">{item.value}</p>
                <p className={`text-sm mt-1 ${item.up ? 'text-hero-accent' : 'text-destructive'}`}>{item.change}</p>
              </div>
            ))}
      </div>

      {/* ── Bottom cards ── */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-xl bg-hero-surface border border-hero-border">
          <BarChart3 className="w-8 h-8 text-hero-accent mb-4" />
          <h3 className="text-lg font-semibold mb-2">NSE & BSE Analytics</h3>
          <p className="text-sm text-hero-text-muted">Advanced charting with 100+ technical indicators for Indian equities, F&O, and commodity markets.</p>
        </div>
        <div className="p-6 rounded-xl bg-hero-surface border border-hero-border">
          <Globe className="w-8 h-8 text-hero-accent mb-4" />
          <h3 className="text-lg font-semibold mb-2">Pan-India Coverage</h3>
          <p className="text-sm text-hero-text-muted">Track all NSE & BSE listed stocks, mutual funds, ETFs, and government bonds in one place.</p>
        </div>
        <div className="p-6 rounded-xl bg-hero-surface border border-hero-border">
          <TrendingUp className="w-8 h-8 text-hero-accent mb-4" />
          <h3 className="text-lg font-semibold mb-2">Live Market Feeds</h3>
          <p className="text-sm text-hero-text-muted">Real-time tick data from NSE and BSE with Level 2 order book depth for professional traders.</p>
        </div>
      </div>

    </SectionLayout>
  );
};

export default Markets;