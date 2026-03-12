import { useState, useCallback, useRef, useEffect } from 'react';
import { SectionLayout } from '@/components/SectionLayout';
import { TrendingUp, TrendingDown, BarChart3, Globe, RefreshCw, Search, X, Loader2, Clock } from 'lucide-react';
import { useMarketData } from '@/hooks/useMarketData';
import { createChart, ColorType, CandlestickSeries, HistogramSeries } from 'lightweight-charts';

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

const PRO_RANGES = [
  { label: '1D', interval: '5m',  range: '1d'  },
  { label: '1W', interval: '15m', range: '5d'  },
  { label: '1M', interval: '1d',  range: '1mo' },
  { label: '3M', interval: '1d',  range: '3mo' },
  { label: '6M', interval: '1wk', range: '6mo' },
  { label: '1Y', interval: '1wk', range: '1y'  },
];

interface SearchResult {
  name: string; symbol: string; value: string;
  change: string; up: boolean;
  high: string; low: string; open: string;
}

interface CandlePoint {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

const ProChart = ({ symbol }: { symbol: string }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const candleRef = useRef<any>(null);
  const volumeRef = useRef<any>(null);
  const [activeRange, setActiveRange] = useState('1M');
  const [loading, setLoading] = useState(false);
  const [chartType, setChartType] = useState<'candle' | 'line'>('candle');
  const [ohlc, setOhlc] = useState({ o: 0, h: 0, l: 0, c: 0, v: 0 });

  const fetchCandles = useCallback(async (sym: string, range: string) => {
    setLoading(true);
    const r = PRO_RANGES.find(r => r.label === range) || PRO_RANGES[2];
    const nsSymbol = `${sym}.NS`;
    try {
      const res = await fetch(`/yahoo-finance/v8/finance/chart/${nsSymbol}?interval=${r.interval}&range=${r.range}`);
      const data = await res.json();
      const result = data?.chart?.result?.[0];
      if (!result) return;
      const timestamps: number[] = result.timestamp ?? [];
      const quote = result.indicators?.quote?.[0] ?? {};
      const opens: number[] = quote.open ?? [];
      const highs: number[] = quote.high ?? [];
      const lows: number[] = quote.low ?? [];
      const closes: number[] = quote.close ?? [];
      const volumes: number[] = quote.volume ?? [];
      const candles: CandlePoint[] = timestamps
        .map((ts, i) => ({ time: ts, open: opens[i], high: highs[i], low: lows[i], close: closes[i], volume: volumes[i] }))
        .filter(c => c.open && c.high && c.low && c.close)
        .sort((a, b) => a.time - b.time);
      if (candles.length > 0) {
        const last = candles[candles.length - 1];
        setOhlc({ o: last.open, h: last.high, l: last.low, c: last.close, v: last.volume ?? 0 });
      }
      return candles;
    } catch { return []; }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;
    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: 'rgba(255,255,255,0.35)',
        fontSize: 11,
      },
      grid: {
        vertLines: { color: 'rgba(255,255,255,0.04)' },
        horzLines: { color: 'rgba(255,255,255,0.04)' },
      },
      crosshair: {
        mode: 1,
        vertLine: { color: 'rgba(74,222,128,0.3)', width: 1, style: 3 },
        horzLine: { color: 'rgba(74,222,128,0.3)', width: 1, style: 3 },
      },
      rightPriceScale: {
        borderColor: 'rgba(255,255,255,0.06)',
        scaleMargins: { top: 0.1, bottom: 0.25 },
      },
      timeScale: { borderColor: 'rgba(255,255,255,0.06)', timeVisible: true, secondsVisible: false },
      handleScroll: true,
      handleScale: true,
    });
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#4ADE80',
      downColor: '#F87171',
      borderUpColor: '#4ADE80',
      borderDownColor: '#F87171',
      wickUpColor: '#4ADE80',
      wickDownColor: '#F87171',
    });
    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume',
    });
    chart.priceScale('volume').applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } });
    chartRef.current = chart;
    candleRef.current = candleSeries;
    volumeRef.current = volumeSeries;
    const ro = new ResizeObserver(() => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth, height: containerRef.current.clientHeight });
      }
    });
    ro.observe(containerRef.current);
    chart.subscribeCrosshairMove((param) => {
      if (param.seriesData && candleSeries) {
        const d = param.seriesData.get(candleSeries) as any;
        if (d) setOhlc({ o: d.open, h: d.high, l: d.low, c: d.close, v: 0 });
      }
    });
    return () => { ro.disconnect(); chart.remove(); };
  }, []);

  useEffect(() => {
    if (!candleRef.current || !volumeRef.current) return;
    fetchCandles(symbol, activeRange).then(candles => {
      if (!candles || !candleRef.current) return;
      candleRef.current.setData(candles.map(c => ({ time: c.time, open: c.open, high: c.high, low: c.low, close: c.close })));
      volumeRef.current.setData(candles.map(c => ({ time: c.time, value: c.volume ?? 0, color: c.close >= c.open ? 'rgba(74,222,128,0.4)' : 'rgba(248,113,113,0.4)' })));
      chartRef.current?.timeScale().fitContent();
    });
  }, [symbol, activeRange, fetchCandles]);

  const fmt = (n: number) => n ? '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 2 }) : '-';

  return (
    <div className="rounded-xl bg-hero-surface border border-hero-border overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-hero-border flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-4 h-4 text-hero-accent" />
          <span className="text-sm font-bold text-hero-text">{symbol}</span>
          <span className="text-xs text-hero-text-muted">Candlestick Chart · NSE</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex gap-1 border border-hero-border rounded-lg p-0.5">
            <button onClick={() => setChartType('candle')}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${chartType === 'candle' ? 'bg-hero-accent text-hero-bg' : 'text-hero-text-muted hover:text-hero-text'}`}>
              Candle
            </button>
            <button onClick={() => setChartType('line')}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${chartType === 'line' ? 'bg-hero-accent text-hero-bg' : 'text-hero-text-muted hover:text-hero-text'}`}>
              Line
            </button>
          </div>
          <div className="flex gap-1">
            {PRO_RANGES.map(r => (
              <button key={r.label} onClick={() => setActiveRange(r.label)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${activeRange === r.label ? 'bg-hero-accent text-hero-bg' : 'text-hero-text-muted hover:text-hero-text hover:bg-hero-accent/10'}`}>
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="flex gap-6 px-5 py-2 border-b border-hero-border/50 flex-wrap">
        {[['O', ohlc.o], ['H', ohlc.h], ['L', ohlc.l], ['C', ohlc.c]].map(([l, v]) => (
          <div key={l as string} className="flex items-center gap-1.5">
            <span className="text-xs text-hero-text-muted">{l}</span>
            <span className="text-xs font-semibold text-hero-text">{fmt(v as number)}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-hero-text-muted">Vol</span>
          <span className="text-xs font-semibold text-hero-text">
            {ohlc.v > 1e7 ? (ohlc.v / 1e7).toFixed(2) + 'Cr' : ohlc.v > 1e5 ? (ohlc.v / 1e5).toFixed(2) + 'L' : ohlc.v.toLocaleString('en-IN')}
          </span>
        </div>
      </div>
      <div className="relative" style={{ height: 460 }}>
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center z-10 bg-hero-bg/40">
            <Loader2 className="w-6 h-6 animate-spin text-hero-accent" />
          </div>
        )}
        <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      </div>
      <div className="flex gap-2 px-5 py-3 border-t border-hero-border flex-wrap">
        <span className="text-xs text-hero-text-muted self-center">Switch:</span>
        {['RELIANCE','TCS','HDFCBANK','INFY','SBIN','TATAMOTORS','WIPRO','BAJFINANCE'].map(s => (
          <button key={s} onClick={() => {
            if (candleRef.current) candleRef.current.setData([]);
            fetchCandles(s, activeRange).then(candles => {
              if (!candles || !candleRef.current) return;
              candleRef.current.setData(candles.map(c => ({ time: c.time, open: c.open, high: c.high, low: c.low, close: c.close })));
              volumeRef.current?.setData(candles.map(c => ({ time: c.time, value: c.volume ?? 0, color: c.close >= c.open ? 'rgba(74,222,128,0.4)' : 'rgba(248,113,113,0.4)' })));
              chartRef.current?.timeScale().fitContent();
            });
          }}
            className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${symbol === s ? 'border-hero-accent text-hero-accent bg-hero-accent/10' : 'border-hero-border text-hero-text-muted hover:border-hero-accent/40 hover:text-hero-accent'}`}>
            {s}
          </button>
        ))}
      </div>
    </div>
  );
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
  const [chartLoading, setChartLoading] = useState(false);
  const [activeRange, setActiveRange] = useState('1D');
  const [chartSymbol, setChartSymbol] = useState('');
  const [proSymbol, setProSymbol] = useState('RELIANCE');
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const simpleChartRef = useRef<HTMLDivElement>(null);
  const simpleChartInstance = useRef<any>(null);
  const simpleSeriesRef = useRef<any>(null);

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

  useEffect(() => {
    if (!simpleChartRef.current) return;
    const chart = createChart(simpleChartRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: 'rgba(255,255,255,0.35)',
        fontSize: 10,
      },
      grid: {
        vertLines: { color: 'rgba(255,255,255,0.04)' },
        horzLines: { color: 'rgba(255,255,255,0.04)' },
      },
      rightPriceScale: { borderColor: 'rgba(255,255,255,0.06)' },
      timeScale: { borderColor: 'rgba(255,255,255,0.06)', timeVisible: true },
      handleScroll: true,
      handleScale: true,
    });
    const { LineSeries } = require('lightweight-charts');
    const series = chart.addSeries(LineSeries, { color: '#4ADE80', lineWidth: 2, priceLineVisible: false });
    simpleChartInstance.current = chart;
    simpleSeriesRef.current = series;
    const ro = new ResizeObserver(() => {
      if (simpleChartRef.current) {
        chart.applyOptions({ width: simpleChartRef.current.clientWidth, height: simpleChartRef.current.clientHeight });
      }
    });
    ro.observe(simpleChartRef.current);
    return () => { ro.disconnect(); chart.remove(); };
  }, []);

  const fetchSimpleChart = useCallback(async (symbol: string, range: string) => {
    setChartLoading(true);
    const r = RANGES.find(r => r.label === range) || RANGES[0];
    const nsSymbol = `${symbol}.NS`;
    try {
      const res = await fetch(`/yahoo-finance/v8/finance/chart/${nsSymbol}?interval=${r.interval}&range=${r.range}`);
      const data = await res.json();
      const result = data?.chart?.result?.[0];
      if (!result || !simpleSeriesRef.current) return;
      const timestamps: number[] = result.timestamp ?? [];
      const closes: number[] = result.indicators?.quote?.[0]?.close ?? [];
      const points = timestamps
        .map((ts, i) => ({ time: ts, value: closes[i] }))
        .filter(p => p.value != null && !isNaN(p.value))
        .sort((a, b) => a.time - b.time);
      simpleSeriesRef.current.setData(points);
      simpleChartInstance.current?.timeScale().fitContent();
    } catch { }
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
        const cleanSymbol = (meta.symbol ?? symbol).replace('.NS', '').replace('.BO', '');
        setChartSymbol(cleanSymbol);
        setProSymbol(cleanSymbol);
        setActiveRange('1D');
        fetchSimpleChart(cleanSymbol, '1D');
        setSearching(false);
        return;
      } catch { continue; }
    }
    setSearchError(`No results for "${input}". Try TATAMOTORS, ADANIENT, BAJFINANCE.`);
    setSearching(false);
  }, [recentSearches, fetchSimpleChart]);

  const handleRangeChange = (range: string) => {
    setActiveRange(range);
    if (chartSymbol) fetchSimpleChart(chartSymbol, range);
  };

  const clearSearch = () => {
    setQuery(''); setSearchResult(null); setSearchError('');
    setShowSuggestions(false); setSelectedIndex(-1);
    setChartSymbol('');
    if (simpleSeriesRef.current) simpleSeriesRef.current.setData([]);
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

  return (
    <SectionLayout title="Markets" subtitle="Real-time Indian market data — NSE & BSE indices and top stocks.">

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

      {searchError && (
        <div className="mb-6 p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-red-400 text-sm">{searchError}</div>
      )}

      {searchResult && (
        <div className="mb-8 rounded-xl bg-hero-surface border border-hero-accent/30 overflow-hidden">
          <div className="p-5 flex items-start justify-between flex-wrap gap-4">
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
          <div className="flex gap-1 px-5 mb-3">
            {RANGES.map(r => (
              <button key={r.label} onClick={() => handleRangeChange(r.label)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${activeRange === r.label ? 'bg-hero-accent text-hero-bg' : 'text-hero-text-muted hover:text-hero-text hover:bg-hero-accent/10'}`}>
                {r.label}
              </button>
            ))}
          </div>
          <div className="relative h-48 px-2 pb-4">
            {chartLoading && (
              <div className="absolute inset-0 flex items-center justify-center z-10">
                <Loader2 className="w-5 h-5 animate-spin text-hero-accent" />
              </div>
            )}
            <div ref={simpleChartRef} style={{ width: '100%', height: '100%' }} />
          </div>
        </div>
      )}

      <div className="mb-8">
        <ProChart symbol={proSymbol} />
      </div>

      <div className="flex items-center gap-2 mb-4 text-xs text-hero-text-muted">
        <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
        {lastUpdated ? `Last updated: ${lastUpdated.toLocaleTimeString()}` : 'Fetching live data...'}
      </div>

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