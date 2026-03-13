import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';

interface SectionLayoutProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

export const SectionLayout: React.FC<SectionLayoutProps> = ({ title, subtitle, children }) => {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { label: 'Markets', to: '/markets' },
    { label: 'Trading', to: '/trading' },
    { label: 'Portfolio', to: '/portfolio' },
    { label: 'Research', to: '/research' },
    { label: 'Prediction ✦', to: '/prediction', accent: true },
    { label: 'Docs', to: '/docs' },
  ];

  return (
    <div className="min-h-screen bg-hero-bg text-hero-text">
      {/* Nav */}
      <nav className="px-4 md:px-6 lg:px-8 py-4 border-b border-hero-border">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-hero-text-muted hover:text-hero-text transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm hidden sm:inline">Back to Home</span>
          </Link>
          <Link to="/" className="text-base md:text-lg font-bold text-hero-text">Traders Paradise</Link>

          {/* Desktop nav links */}
          <div className="hidden lg:flex items-center gap-4 xl:gap-6 text-sm text-hero-text-muted">
            {navLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                className={link.accent
                  ? 'text-hero-accent/80 hover:text-hero-accent font-semibold transition-colors'
                  : 'hover:text-hero-text transition-colors'
                }
              >
                {link.label}
              </Link>
            ))}
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

          {/* Hamburger button */}
          <button
            className="lg:hidden text-hero-text-muted hover:text-hero-text transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen
              ? <X className="w-6 h-6" />
              : <Menu className="w-6 h-6" />
            }
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-hero-surface/95 backdrop-blur-md border-b border-hero-border z-50 relative overflow-hidden"
          >
            <div className="flex flex-col items-center gap-4 py-6 text-sm">
              {navLinks.map(link => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={link.accent
                    ? 'text-hero-accent font-semibold hover:text-hero-accent/80 transition-colors'
                    : 'text-hero-text-muted hover:text-hero-text transition-colors'
                  }
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              {user ? (
                <>
                  <span className="text-hero-text-muted text-sm">{user.name}</span>
                  <button
                    onClick={() => { logout(); setMobileOpen(false); }}
                    className="px-4 py-2 rounded-lg border border-hero-border text-hero-text-muted hover:text-hero-text transition-colors"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <Link
                  to="/signup"
                  className="px-6 py-2.5 bg-hero-accent text-hero-bg font-semibold rounded-lg"
                  onClick={() => setMobileOpen(false)}
                >
                  Get Started
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div
        className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 pt-8 md:pt-12 lg:pt-16 pb-6 md:pb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold">{title}</h1>
        <p className="text-hero-text-muted mt-2 md:mt-3 text-sm md:text-base lg:text-lg">{subtitle}</p>
      </motion.div>

      {/* Content */}
      <motion.div
        className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 pb-10 md:pb-16"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        {children}
      </motion.div>
    </div>
  );
};