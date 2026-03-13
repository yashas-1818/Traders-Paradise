import { SectionLayout } from '@/components/SectionLayout';
import { BookOpen, Code, Key, Webhook, Database, HelpCircle } from 'lucide-react';

const sections = [
  { icon: BookOpen, title: 'Getting Started', description: 'Create your account, verify identity, and make your first trade in under 5 minutes.' },
  { icon: Code, title: 'API Reference', description: 'Full REST and WebSocket API documentation for automated trading and data access.' },
  { icon: Key, title: 'Authentication', description: 'OAuth 2.0, API keys, and two-factor authentication setup guides.' },
  { icon: Webhook, title: 'Webhooks', description: 'Set up real-time notifications for order fills, price alerts, and account events.' },
  { icon: Database, title: 'Historical Data', description: 'Access tick-level historical data going back 20+ years for backtesting strategies.' },
  { icon: HelpCircle, title: 'FAQ & Support', description: 'Common questions, troubleshooting guides, and how to reach our 24/7 support team.' },
];

const Docs = () => {
  return (
    <SectionLayout title="Documentation" subtitle="Everything you need to get started and build on our platform.">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {sections.map((s) => (
          <div key={s.title} className="p-4 md:p-6 rounded-xl bg-hero-surface border border-hero-border hover:border-hero-accent/30 transition-colors cursor-pointer group">
            <s.icon className="w-8 h-8 text-hero-accent mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="text-lg font-semibold mb-2 group-hover:text-hero-accent transition-colors">{s.title}</h3>
            <p className="text-sm text-hero-text-muted">{s.description}</p>
          </div>
        ))}
      </div>
    </SectionLayout>
  );
};

export default Docs;
