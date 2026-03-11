import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';

interface SectionLayoutProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

export const SectionLayout: React.FC<SectionLayoutProps> = ({ title, subtitle, children }) => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-hero-bg text-hero-text">
      {/* Nav */}
      <nav className="px-6 py-4 border-b border-hero-border">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-hero-text-muted hover:text-hero-text transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back to Home</span>
          </Link>
          <Link to="/" className="text-lg font-bold text-hero-text">Traders Paradise</Link>
          <div className="hidden md:flex items-center gap-6 text-sm text-hero-text-muted">
            <Link to="/markets" className="hover:text-hero-text transition-colors">Markets</Link>
            <Link to="/trading" className="hover:text-hero-text transition-colors">Trading</Link>
            <Link to="/portfolio" className="hover:text-hero-text transition-colors">Portfolio</Link>
            <Link to="/research" className="hover:text-hero-text transition-colors">Research</Link>
            <Link to="/prediction" className="text-hero-accent/80 hover:text-hero-accent font-semibold transition-colors">
              Prediction ✦
            </Link>
            <Link to="/docs" className="hover:text-hero-text transition-colors">Docs</Link>
            {user ? (
              <div className="flex items-center gap-3 ml-2">
                <span className="text-hero-text">{user.name}</span>
                <button
                  onClick={logout}
                  className="px-3 py-1.5 rounded-lg border border-hero-border hover:border-hero-accent/40 hover:text-hero-text transition-colors"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link
                to="/signup"
                className="ml-2 px-4 py-1.5 bg-hero-accent text-hero-bg font-semibold rounded-lg hover:bg-hero-accent/80 transition-colors"
              >
                Get Started
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Header */}
      <motion.div
        className="max-w-7xl mx-auto px-6 pt-16 pb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-4xl md:text-5xl font-bold">{title}</h1>
        <p className="text-hero-text-muted mt-3 text-lg">{subtitle}</p>
      </motion.div>

      {/* Content */}
      <motion.div
        className="max-w-7xl mx-auto px-6 pb-16"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        {children}
      </motion.div>
    </div>
  );
};