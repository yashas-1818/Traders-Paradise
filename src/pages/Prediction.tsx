import { useState, useEffect } from 'react';
import { SectionLayout } from '@/components/SectionLayout';
import { Search, Loader2, TrendingUp, TrendingDown, Minus, Brain, BarChart2, AlertTriangle, Zap } from 'lucide-react';
import { usePrediction } from '@/hooks/usePrediction';
import { ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { ServerStatusBanner } from '@/components/ServerStatusBanner';

const AnimatedBar = ({ score, color, delay = 0, started }: { score: number; color: string; delay?: number; started: boolean }) => {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    if (!started) { setWidth(0); return; }
    const t = setTimeout(() => setWidth(score), delay);
    return () => clearTimeout(t);
  }, [started, score, delay]);
  return (
    <div style={{ height: 5, borderRadius: 999, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${width}%`, background: color, borderRadius: 999, transition: 'width 1s cubic-bezier(0.4,0,0.2,1)', boxShadow: `0 0 8px ${color}80` }} />
    </div>
  );
};

const ScoreCard = ({ label, score, color, delay, started }: { label: string; score: number; color: string; delay: number; started: boolean }) => {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!started) { setVal(0); return; }
    let start: number | null = null;
    const step = (ts: number) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / 1000, 1);
      setVal(Math.floor(p * score));
      if (p < 1) requestAnimationFrame(step);
    };
    const t = setTimeout(() => requestAnimationFrame(step), delay);
    return () => clearTimeout(t);
  }, [started, score, delay]);
  return (
    <div style={{ padding: '14px 16px', borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(12px)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{label}</span>
        <span style={{ fontSize: 20, fontWeight: 800, color }}>{val}</span>
      </div>
      <AnimatedBar score={score} color={color} delay={delay} started={started} />
    </div>
  );
};

const IndicatorCard = ({ name, value, signal, detail, index, started }: { name: string; value: string; signal: 'BUY' | 'SELL' | 'HOLD'; detail: string; index: number; started: boolean }) => {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!started) { setVisible(false); return; }
    const t = setTimeout(() => setVisible(true), index * 120 + 300);
    return () => clearTimeout(t);
  }, [started, index]);
  const cfg = {
    BUY:  { color: '#4ADE80', bg: 'rgba(74,222,128,0.06)',  glow: 'rgba(74,222,128,0.12)' },
    SELL: { color: '#F87171', bg: 'rgba(248,113,113,0.06)', glow: 'rgba(248,113,113,0.12)' },
    HOLD: { color: '#FCD34D', bg: 'rgba(252,211,77,0.06)',  glow: 'rgba(252,211,77,0.12)' },
  }[signal];
  return (
    <div style={{ padding: '18px 16px', borderRadius: 16, background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)', boxShadow: visible ? '0 8px 32px rgba(0,0,0,0.3)' : 'none', opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(16px)', transition: 'all 0.5s cubic-bezier(0.4,0,0.2,1)', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, right: 0, width: 60, height: 60, background: cfg.glow, borderRadius: '0 16px 0 60px', filter: 'blur(20px)' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{name}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 999, background: cfg.bg, border: `1px solid ${cfg.color}30` }}>
          <div style={{ width: 5, height: 5, borderRadius: 999, background: cfg.color, boxShadow: `0 0 6px ${cfg.color}` }} />
          <span style={{ fontSize: 10, fontWeight: 700, color: cfg.color }}>{signal}</span>
        </div>
      </div>
      <p style={{ fontSize: 20, fontWeight: 800, color: '#F9FAFB', marginBottom: 6 }}>{value}</p>
      <p style={{ fontSize: 11, color: cfg.color, opacity: 0.85 }}>{detail}</p>
    </div>
  );
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'rgba(5,12,5,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '10px 14px', fontSize: 11, backdropFilter: 'blur(20px)' }}>
      <p style={{ color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>{label}</p>
      {payload.map((p: any) => p.value && (
        <p key={p.name} style={{ color: p.color, fontWeight: 700, marginBottom: 2 }}>
          {p.name}: ₹{Number(p.value).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
        </p>
      ))}
    </div>
  );
};

const Prediction = () => {
  const [query, setQuery] = useState('');
  const [animStarted, setAnimStarted] = useState(false);
  const { result, loading, error, analyze } = usePrediction();

  useEffect(() => {
    if (!loading && result) setTimeout(() => setAnimStarted(true), 100);
    if (loading) setAnimStarted(false);
  }, [loading, result]);

  const handleAnalyze = (sym?: string) => {
    const s = (sym ?? query).trim();
    if (!s) return;
    setAnimStarted(false);
    analyze(s);
  };

  const signalColor = result?.signal === 'BUY' ? '#4ADE80' : result?.signal === 'SELL' ? '#F87171' : '#FCD34D';
  const minPrice = result?.chartData.length ? Math.min(...result.chartData.map(d => d.price)) * 0.997 : 0;
  const maxPrice = result?.chartData.length ? Math.max(...result.chartData.map(d => d.price)) * 1.003 : 0;
  const fmt = (n: number) => '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 2 });

  return (
    <SectionLayout title="Stock Prediction" subtitle="AI-powered technical analysis + Claude sentiment scoring for Indian markets.">
      <ServerStatusBanner />

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5 max-w-xl">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-hero-text-muted" />
          <input
            type="text" value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAnalyze()}
            placeholder="Enter NSE symbol e.g. TATAMOTORS"
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-hero-surface border border-hero-border text-hero-text text-sm placeholder:text-hero-text-muted focus:outline-none focus:border-hero-accent/50 transition-colors"
          />
        </div>
        <button onClick={() => handleAnalyze()} disabled={!query.trim() || loading}
          className="w-full sm:w-auto px-5 py-3 bg-hero-accent text-hero-bg text-sm font-bold rounded-xl hover:bg-hero-accent/80 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
          {loading ? 'Analyzing...' : 'Analyze'}
        </button>
      </div>

      {/* Quick picks */}
      <div className="flex flex-wrap gap-2 mb-8 items-center">
        <span className="text-xs text-hero-text-muted">Try:</span>
        {['RELIANCE','TCS','HDFCBANK','INFY','TATAMOTORS','SBIN','WIPRO','BAJFINANCE'].map(s => (
          <button key={s} onClick={() => { setQuery(s); handleAnalyze(s); }}
            className="text-xs px-3 py-1.5 rounded-lg border border-hero-border text-hero-text-muted hover:border-hero-accent/40 hover:text-hero-accent transition-colors">
            {s}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-red-400 text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="text-center py-20">
          <div className="w-14 h-14 rounded-full border-2 border-hero-accent/20 border-t-hero-accent mx-auto mb-5 animate-spin" />
          <p className="text-hero-text-muted text-sm mb-4">Fetching market data & running AI analysis...</p>
          <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-6">
            {['Fetching prices','Calculating indicators','Running AI sentiment'].map(s => (
              <span key={s} className="text-xs text-hero-text-muted flex items-center gap-1">
                <span className="text-hero-accent">✓</span> {s}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {result && !loading && (
        <div style={{ opacity: animStarted ? 1 : 0, transform: animStarted ? 'translateY(0)' : 'translateY(20px)', transition: 'all 0.6s cubic-bezier(0.4,0,0.2,1)' }}>

          {/* Main signal card */}
          <div style={{ padding: '20px 16px', borderRadius: 20, marginBottom: 16, background: `linear-gradient(135deg, ${signalColor}08 0%, rgba(255,255,255,0.01) 100%)`, border: `1px solid ${signalColor}25`, boxShadow: '0 20px 60px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)' }} className="px-4 md:px-7">
            <div className="flex flex-col lg:flex-row justify-between items-start gap-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs text-hero-text-muted uppercase tracking-widest">{result.symbol} · NSE</span>
                  <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 999, background: 'rgba(74,222,128,0.1)', color: '#4ADE80', border: '1px solid rgba(74,222,128,0.2)' }}>LIVE</span>
                </div>
                <p className="text-sm text-hero-text-muted mb-2">{result.name}</p>
                <p className="text-2xl sm:text-3xl md:text-4xl" style={{ fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 14, color: '#F9FAFB' }}>{fmt(result.currentPrice)}</p>
                <div className="flex flex-wrap items-center gap-3">
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 20px', borderRadius: 999, background: `${signalColor}15`, border: `1px solid ${signalColor}30`, boxShadow: `0 0 20px ${signalColor}15` }}>
                    <div style={{ width: 8, height: 8, borderRadius: 999, background: signalColor, boxShadow: `0 0 10px ${signalColor}` }} />
                    <span style={{ fontSize: 16, fontWeight: 800, color: signalColor, letterSpacing: '0.04em' }}>{result.signal}</span>
                  </div>
                  <div style={{ height: 24, width: 1, background: 'rgba(255,255,255,0.08)' }} />
                  <span className="text-sm text-hero-text-muted">Confidence <span className="text-hero-text font-bold">{result.confidence}%</span></span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full lg:w-auto lg:min-w-[320px]">
                <ScoreCard label="Technical" score={result.technicalScore} color="#4ADE80" delay={0}   started={animStarted} />
                <ScoreCard label="Sentiment" score={result.sentimentScore} color="#60A5FA" delay={150} started={animStarted} />
                <ScoreCard label="Combined"  score={result.finalScore}     color="#A78BFA" delay={300} started={animStarted} />
              </div>
            </div>

            {/* Stats bar */}
            <div className="flex flex-wrap gap-4 sm:gap-6 md:gap-8" style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              {[['Open', fmt(result.open)], ['High', fmt(result.high)], ['Low', fmt(result.low)], ['Prev Close', fmt(result.prevClose)]].map(([l, v]) => (
                <div key={l}>
                  <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginBottom: 3, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{l}</p>
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>{v}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Chart */}
          <div className="p-4 md:p-6 rounded-2xl bg-hero-surface border border-hero-border mb-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-5">
              <p className="text-sm font-semibold text-hero-text flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-hero-accent" /> Price Chart · 3 Months · MA50 Overlay
              </p>
              <div className="flex gap-1 flex-wrap">
                {['1D','1W','1M','3M','1Y'].map((r, i) => (
                  <span key={r} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 8, background: i === 2 ? 'rgba(74,222,128,0.15)' : 'transparent', color: i === 2 ? '#4ADE80' : 'rgba(255,255,255,0.3)', border: `1px solid ${i === 2 ? 'rgba(74,222,128,0.3)' : 'rgba(255,255,255,0.06)'}`, cursor: 'pointer', fontWeight: i === 2 ? 700 : 400 }}>{r}</span>
                ))}
              </div>
            </div>
            <div className="h-48 md:h-56 lg:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={result.chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="predGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={signalColor} stopOpacity={0.25} />
                      <stop offset="95%" stopColor={signalColor} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                  <XAxis dataKey="time" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.25)' }} tickLine={false} axisLine={false} interval={Math.floor(result.chartData.length / 5)} />
                  <YAxis domain={[minPrice, maxPrice]} tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.25)' }} tickLine={false} axisLine={false} tickFormatter={v => '₹' + v.toLocaleString('en-IN', { maximumFractionDigits: 0 })} width={70} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }} />
                  <Area type="monotone" dataKey="price" name="Price" stroke={signalColor} strokeWidth={2} fill="url(#predGrad)" dot={false} activeDot={{ r: 5, fill: signalColor, stroke: `${signalColor}40`, strokeWidth: 6 }} />
                  <Line type="monotone" dataKey="ma50" name="MA50" stroke="#60A5FA" strokeWidth={1.5} dot={false} strokeDasharray="5 3" connectNulls />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Technical indicators */}
          <p style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>Technical Indicators</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            {result.indicators.map((ind, i) => (
              <IndicatorCard key={ind.name} {...ind} index={i} started={animStarted} />
            ))}
          </div>

          {/* AI Sentiment */}
            <div className="flex flex-col lg:flex-row justify-between items-start gap-4" style={{ padding: 24, borderRadius: 20, marginBottom: 14, background: 'linear-gradient(135deg, rgba(96,165,250,0.05) 0%, rgba(255,255,255,0.01) 100%)', border: '1px solid rgba(96,165,250,0.12)', backdropFilter: 'blur(20px)' }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Brain className="w-3 h-3" /> Claude AI Sentiment
                </p>
                <div className="flex items-baseline gap-3 mb-3">
                  <span className="text-xl sm:text-2xl md:text-3xl" style={{ fontWeight: 800, color: result.sentimentLabel === 'Bullish' ? '#4ADE80' : result.sentimentLabel === 'Bearish' ? '#F87171' : '#FCD34D', letterSpacing: '-0.02em' }}>
                    {result.sentimentLabel}
                  </span>
                  <span className="text-sm text-hero-text-muted">{result.sentimentScore} / 100</span>
                </div>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.7, maxWidth: 500 }}>{result.sentimentSummary}</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 180 }}>
                {result.sentimentFactors.map(({ label, status }) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{label}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: status === 'Positive' ? '#4ADE80' : status === 'Negative' ? '#F87171' : status === 'Stable' ? '#60A5FA' : '#FCD34D' }}>{status}</span>
                  </div>
                ))}
              </div>
            </div>

          {/* Disclaimer */}
          <div style={{ padding: '12px 16px', borderRadius: 12, border: '1px solid rgba(252,211,77,0.12)', background: 'rgba(252,211,77,0.03)', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <AlertTriangle className="w-4 h-4 text-yellow-400/60 flex-shrink-0 mt-0.5" />
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', lineHeight: 1.6, margin: 0 }}>
              <strong style={{ color: 'rgba(252,211,77,0.5)' }}>Disclaimer:</strong> For educational purposes only. Not financial advice. Consult a SEBI-registered advisor before investing.
            </p>
          </div>

        </div>
      )}

      {/* Empty state */}
      {!result && !loading && !error && (
        <div className="text-center py-24">
          <Zap className="w-12 h-12 text-hero-accent/20 mx-auto mb-4" />
          <p className="text-hero-text-muted text-sm">Enter any NSE stock symbol above to get started</p>
        </div>
      )}

    </SectionLayout>
  );
};

export default Prediction;