import { useState, useCallback } from 'react';

export interface Indicator {
  name: string;
  value: string;
  signal: 'BUY' | 'SELL' | 'HOLD';
  detail: string;
}

export interface PredictionResult {
  symbol: string;
  name: string;
  currentPrice: number;
  open: number;
  high: number;
  low: number;
  prevClose: number;
  technicalScore: number;
  sentimentScore: number;
  finalScore: number;
  signal: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  indicators: Indicator[];
  sentimentLabel: string;
  sentimentSummary: string;
  sentimentFactors: { label: string; status: string }[];
  chartData: { time: string; price: number; ma50: number | null }[];
}

const calcRSI = (closes: number[], period = 14): number => {
  if (closes.length < period + 1) return 50;
  let gains = 0, losses = 0;
  for (let i = closes.length - period; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff > 0) gains += diff; else losses -= diff;
  }
  const rs = gains / (losses || 1);
  return 100 - 100 / (1 + rs);
};

const calcMA = (closes: number[], period: number): number | null => {
  if (closes.length < period) return null;
  return closes.slice(-period).reduce((a, b) => a + b, 0) / period;
};

const calcMACD = (closes: number[]): { macd: number; signal: number } => {
  const ema = (data: number[], period: number) => {
    const k = 2 / (period + 1);
    return data.reduce((prev, curr, i) => i === 0 ? curr : prev * (1 - k) + curr * k, data[0]);
  };
  if (closes.length < 26) return { macd: 0, signal: 0 };
  const ema12 = ema(closes.slice(-12), 12);
  const ema26 = ema(closes.slice(-26), 26);
  const macd = ema12 - ema26;
  const signalLine = ema(closes.slice(-9).map((_, i) =>
    ema(closes.slice(-26 + i), 12) - ema(closes.slice(-26 + i), 26)), 9);
  return { macd, signal: signalLine };
};

const calcBollinger = (closes: number[], period = 20) => {
  if (closes.length < period) return { upper: 0, lower: 0, mid: 0 };
  const slice = closes.slice(-period);
  const mid = slice.reduce((a, b) => a + b, 0) / period;
  const std = Math.sqrt(slice.reduce((a, b) => a + Math.pow(b - mid, 2), 0) / period);
  return { upper: mid + 2 * std, lower: mid - 2 * std, mid };
};

export const usePrediction = () => {
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const analyze = useCallback(async (input: string) => {
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const symbol = input.trim().toUpperCase();
      const nsSymbol = symbol.includes('.') ? symbol : `${symbol}.NS`;

      const res = await fetch(`/yahoo-finance/v8/finance/chart/${nsSymbol}?interval=1d&range=3mo`);
      const data = await res.json();
      const chartResult = data?.chart?.result?.[0];
      if (!chartResult) throw new Error(`Stock "${symbol}" not found. Try adding .NS or .BO`);

      const meta = chartResult.meta;
      const timestamps: number[] = chartResult.timestamp ?? [];
      const closes: number[] = chartResult.indicators?.quote?.[0]?.close ?? [];
      const validCloses = closes.filter((c): c is number => c != null && !isNaN(c));
      if (validCloses.length < 20) throw new Error('Not enough historical data for analysis');

      const currentPrice: number = meta.regularMarketPrice;
      const fmt = (n: number) => n.toLocaleString('en-IN', { maximumFractionDigits: 2 });

      // Calculate indicators
      const rsi = calcRSI(validCloses);
      const ma50 = calcMA(validCloses, 50);
      const { macd, signal: macdSignal } = calcMACD(validCloses);
      const boll = calcBollinger(validCloses);

      const rsiSig: 'BUY' | 'SELL' | 'HOLD' = rsi < 35 ? 'BUY' : rsi > 65 ? 'SELL' : 'HOLD';
      const macdSig: 'BUY' | 'SELL' | 'HOLD' = macd > macdSignal ? 'BUY' : macd < macdSignal ? 'SELL' : 'HOLD';
      const ma50Sig: 'BUY' | 'SELL' | 'HOLD' = ma50 ? (currentPrice > ma50 ? 'BUY' : 'SELL') : 'HOLD';
      const bollSig: 'BUY' | 'SELL' | 'HOLD' = currentPrice < boll.lower ? 'BUY' : currentPrice > boll.upper ? 'SELL' : 'HOLD';

      const indicators: Indicator[] = [
        { name: 'RSI (14)', value: rsi.toFixed(1), signal: rsiSig,
          detail: rsi < 35 ? 'Oversold — potential bounce' : rsi > 65 ? 'Overbought — caution' : 'Neutral momentum' },
        { name: 'MACD', value: macd.toFixed(2), signal: macdSig,
          detail: macd > macdSignal ? 'Bullish crossover detected' : 'Bearish crossover detected' },
        { name: 'MA 50', value: ma50 ? '₹' + fmt(ma50) : 'N/A', signal: ma50Sig,
          detail: ma50 ? (currentPrice > ma50 ? 'Price above MA50 — uptrend' : 'Price below MA50 — downtrend') : 'Insufficient data' },
        { name: 'Bollinger', value: '₹' + fmt(boll.mid), signal: bollSig,
          detail: currentPrice < boll.lower ? 'Below lower band — oversold' : currentPrice > boll.upper ? 'Above upper band — overbought' : 'Within bands — stable' },
      ];

      const sigScore = (s: 'BUY' | 'SELL' | 'HOLD') => s === 'BUY' ? 100 : s === 'SELL' ? 0 : 50;
      const technicalScore = Math.round(
        (sigScore(rsiSig) + sigScore(macdSig) + sigScore(ma50Sig) + sigScore(bollSig)) / 4
      );

      // Chart data
      const chartData = timestamps.map((ts, i) => {
        const slice = validCloses.slice(0, i + 1);
        return {
          time: new Date(ts * 1000).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
          price: closes[i] ?? null,
          ma50: slice.length >= 50 ? calcMA(slice, 50) : null,
        };
      }).filter(p => p.price != null) as { time: string; price: number; ma50: number | null }[];

      // AI Sentiment
      let sentimentScore = 50;
      let sentimentLabel = 'Neutral';
      let sentimentSummary = 'AI sentiment analysis unavailable at this time.';
      let sentimentFactors = [
        { label: 'Technical Trend', status: technicalScore > 60 ? 'Positive' : technicalScore < 40 ? 'Negative' : 'Neutral' },
        { label: 'Momentum',        status: rsiSig === 'BUY' ? 'Positive' : rsiSig === 'SELL' ? 'Negative' : 'Neutral' },
        { label: 'Trend Strength',  status: ma50Sig === 'BUY' ? 'Positive' : 'Caution' },
        { label: 'Volatility',      status: bollSig === 'HOLD' ? 'Stable' : 'Caution' },
      ];

      try {
        const sentRes = await fetch('https://traders-paradise-3.onrender.com/api/predict/sentiment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            symbol,
            headlines: [
              `${symbol} latest quarterly earnings report`,
              `${symbol} stock analysis and future outlook`,
              `${symbol} expansion and growth plans`,
              `${symbol} market performance review`,
              `${symbol} analyst price target revision`,
            ],
          }),
        });
        const sentData = await sentRes.json();
        if (sentData.score != null) {
          sentimentScore = sentData.score;
          sentimentLabel = sentData.label ?? 'Neutral';
          sentimentSummary = sentData.summary ?? sentimentSummary;
        }
      } catch { /* use defaults */ }

      const finalScore = Math.round(technicalScore * 0.6 + sentimentScore * 0.4);
      const signal: 'BUY' | 'SELL' | 'HOLD' =
        finalScore >= 62 ? 'BUY' : finalScore <= 38 ? 'SELL' : 'HOLD';
      const confidence = signal === 'BUY' ? finalScore :
        signal === 'SELL' ? 100 - finalScore : 100 - Math.abs(finalScore - 50) * 2;

      setResult({
        symbol,
        name: meta.shortName ?? meta.longName ?? symbol,
        currentPrice,
        open: meta.regularMarketOpen ?? currentPrice,
        high: meta.regularMarketDayHigh ?? currentPrice,
        low: meta.regularMarketDayLow ?? currentPrice,
        prevClose: meta.chartPreviousClose ?? meta.previousClose ?? currentPrice,
        technicalScore,
        sentimentScore,
        finalScore,
        signal,
        confidence: Math.round(confidence),
        indicators,
        sentimentLabel,
        sentimentSummary,
        sentimentFactors,
        chartData,
      });
    } catch (err: any) {
      setError(err.message || 'Analysis failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  return { result, loading, error, analyze };
};


