import { SectionLayout } from '@/components/SectionLayout';
import { FileText, TrendingUp, AlertCircle, Lightbulb } from 'lucide-react';

const reports = [
  { category: 'Macro', title: 'Fed Rate Decision: Impact on Growth Stocks', date: 'Mar 8, 2026', icon: TrendingUp },
  { category: 'Crypto', title: 'Bitcoin Halving Cycle Analysis & Price Targets', date: 'Mar 7, 2026', icon: FileText },
  { category: 'Alert', title: 'NVDA Earnings Preview: What to Watch', date: 'Mar 6, 2026', icon: AlertCircle },
  { category: 'Strategy', title: 'Options Wheel Strategy for Income Generation', date: 'Mar 5, 2026', icon: Lightbulb },
  { category: 'Macro', title: 'Emerging Markets Outlook Q2 2026', date: 'Mar 4, 2026', icon: TrendingUp },
  { category: 'Strategy', title: 'Pairs Trading: Statistical Arbitrage Guide', date: 'Mar 3, 2026', icon: Lightbulb },
];

const Research = () => {
  return (
    <SectionLayout title="Research" subtitle="In-depth analysis and market intelligence from our team.">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {reports.map((r, i) => (
          <div key={i} className="p-4 md:p-6 rounded-xl bg-hero-surface border border-hero-border hover:border-hero-accent/30 transition-colors cursor-pointer group">
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-lg bg-hero-accent/10">
                <r.icon className="w-5 h-5 text-hero-accent" />
              </div>
              <div className="flex-1">
                <span className="text-xs text-hero-accent font-medium uppercase tracking-wider">{r.category}</span>
                <h3 className="text-lg font-semibold mt-1 group-hover:text-hero-accent transition-colors">{r.title}</h3>
                <p className="text-sm text-hero-text-muted mt-2">{r.date}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </SectionLayout>
  );
};

export default Research;
