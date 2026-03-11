import { SectionLayout } from '@/components/SectionLayout';
import { Zap, Shield, Clock, LineChart } from 'lucide-react';

const features = [
  {
    icon: Zap,
    title: 'Lightning-Fast Execution',
    description: 'Execute trades in under 10ms with our proprietary matching engine. Never miss a market opportunity.',
  },
  {
    icon: Shield,
    title: 'Advanced Risk Management',
    description: 'Set stop-losses, take-profits, and trailing stops with precision. Protect your capital automatically.',
  },
  {
    icon: Clock,
    title: '24/7 Trading',
    description: 'Trade crypto markets around the clock and access pre/post-market sessions for equities.',
  },
  {
    icon: LineChart,
    title: 'Smart Order Routing',
    description: 'Our algorithms find the best price across multiple venues and dark pools for optimal fills.',
  },
];

const orderTypes = [
  { name: 'Market Order', desc: 'Instant execution at current price' },
  { name: 'Limit Order', desc: 'Set your desired entry/exit price' },
  { name: 'Stop Order', desc: 'Trigger orders at specific levels' },
  { name: 'OCO Order', desc: 'One-cancels-other paired orders' },
  { name: 'Trailing Stop', desc: 'Dynamic stops that follow price' },
  { name: 'Iceberg Order', desc: 'Hide large order volumes' },
];

const Trading = () => {
  return (
    <SectionLayout title="Trading" subtitle="Professional-grade tools for every trading style.">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        {features.map((f) => (
          <div key={f.title} className="p-6 rounded-xl bg-hero-surface border border-hero-border hover:border-hero-accent/30 transition-colors">
            <f.icon className="w-8 h-8 text-hero-accent mb-4" />
            <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
            <p className="text-sm text-hero-text-muted">{f.description}</p>
          </div>
        ))}
      </div>

      <h2 className="text-2xl font-bold mb-6">Supported Order Types</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {orderTypes.map((o) => (
          <div key={o.name} className="p-4 rounded-lg bg-hero-surface/50 border border-hero-border">
            <h4 className="font-semibold text-hero-accent">{o.name}</h4>
            <p className="text-sm text-hero-text-muted mt-1">{o.desc}</p>
          </div>
        ))}
      </div>
    </SectionLayout>
  );
};

export default Trading;
