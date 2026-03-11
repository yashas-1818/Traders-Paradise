import { useState, useEffect } from 'react';

const SYMBOLS = [
  { name: 'NIFTY 50',      symbol: '%5ENSEI',       isIndex: true  },
  { name: 'SENSEX',        symbol: '%5EBSESN',      isIndex: true  },
  { name: 'BANK NIFTY',    symbol: '%5ENSEBANK',    isIndex: true  },
  { name: 'NIFTY IT',      symbol: '%5ECNXIT',      isIndex: true  },
  { name: 'RELIANCE',      symbol: 'RELIANCE.NS',   isIndex: false },
  { name: 'TCS',           symbol: 'TCS.NS',        isIndex: false },
  { name: 'INFOSYS',       symbol: 'INFY.NS',       isIndex: false },
  { name: 'HDFC BANK',     symbol: 'HDFCBANK.NS',   isIndex: false },
  { name: 'ICICI BANK',    symbol: 'ICICIBANK.NS',  isIndex: false },
  { name: 'WIPRO',         symbol: 'WIPRO.NS',      isIndex: false },
  { name: 'BHARTI AIRTEL', symbol: 'BHARTIARTL.NS', isIndex: false },
  { name: 'ITC',           symbol: 'ITC.NS',        isIndex: false },
];

export interface MarketItem {
  name: string;
  value: string;
  change: string;
  up: boolean;
}

async function fetchSymbol(symbol: string, name: string, isIndex: boolean): Promise<MarketItem | null> {
  try {
    const res = await fetch(`/yahoo-finance/v8/finance/chart/${symbol}`);
    const data = await res.json();
    const meta = data?.chart?.result?.[0]?.meta;
    if (!meta) return null;

    const price: number = meta.regularMarketPrice;
    const prev: number = meta.chartPreviousClose ?? meta.previousClose;
    const changePct = ((price - prev) / prev) * 100;
    const up = changePct >= 0;

    const formatted = isIndex
      ? price.toLocaleString('en-IN', { maximumFractionDigits: 2 })
      : '₹' + price.toLocaleString('en-IN', { maximumFractionDigits: 2 });

    return { name, value: formatted, change: (up ? '+' : '') + changePct.toFixed(2) + '%', up };
  } catch {
    return null;
  }
}

export function useMarketData() {
  const [marketData, setMarketData] = useState<MarketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  async function fetchAll() {
    const results = await Promise.all(
      SYMBOLS.map(({ symbol, name, isIndex }) => fetchSymbol(symbol, name, isIndex))
    );
    const valid = results.filter(Boolean) as MarketItem[];
    if (valid.length > 0) {
      setMarketData(valid);
      setLastUpdated(new Date());
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 10000);
    return () => clearInterval(interval);
  }, []);

  return { marketData, loading, lastUpdated };
}