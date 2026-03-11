import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Eye, EyeOff, UserPlus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const SignUp = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();
  const { register } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await register(name, email, password);
      navigate('/portfolio', { replace: true });
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#060d06' }}>
      {/* Nav */}
      <nav className="px-6 py-4 border-b border-white/10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back</span>
          </Link>
          <Link to="/" className="text-lg font-bold text-white">Traders Paradise</Link>
          <div className="w-16" />
        </div>
      </nav>

      {/* Form */}
      <div className="flex-1 flex items-center justify-center px-6">
        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="p-8 rounded-2xl border border-white/10" style={{ background: '#0a1a0a' }}>
            {/* Header */}
            <div className="flex flex-col items-center mb-8">
              <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-4"
                   style={{ background: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.25)' }}>
                <UserPlus className="w-7 h-7" style={{ color: '#4ADE80' }} />
              </div>
              <h1 className="text-3xl font-bold text-white mb-1">Create Account</h1>
              <p className="text-gray-400 text-sm">Start your trading journey today</p>
            </div>

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-3 rounded-lg text-sm text-center text-red-300"
                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}
              >
                {error}
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5 ml-1">Full Name</label>
                <input
                  type="text"
                  placeholder="John Doe"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-white placeholder-gray-500 outline-none transition-colors"
                  style={{ background: '#060d06', border: '1px solid rgba(255,255,255,0.1)' }}
                  onFocus={(e) => e.currentTarget.style.borderColor = 'rgba(74,222,128,0.5)'}
                  onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5 ml-1">Email</label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-white placeholder-gray-500 outline-none transition-colors"
                  style={{ background: '#060d06', border: '1px solid rgba(255,255,255,0.1)' }}
                  onFocus={(e) => e.currentTarget.style.borderColor = 'rgba(74,222,128,0.5)'}
                  onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5 ml-1">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 pr-11 rounded-xl text-white placeholder-gray-500 outline-none transition-colors"
                    style={{ background: '#060d06', border: '1px solid rgba(255,255,255,0.1)' }}
                    onFocus={(e) => e.currentTarget.style.borderColor = 'rgba(74,222,128,0.5)'}
                    onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-50 mt-2"
                style={{
                  background: loading ? 'rgba(74,222,128,0.3)' : '#4ADE80',
                  color: '#060d06',
                }}
                onMouseEnter={(e) => !loading && (e.currentTarget.style.background = '#3ECF72')}
                onMouseLeave={(e) => !loading && (e.currentTarget.style.background = '#4ADE80')}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-[#060d06] border-t-transparent rounded-full animate-spin" />
                    Creating account...
                  </span>
                ) : 'Sign Up'}
              </button>
            </form>

            <p className="text-sm text-gray-400 text-center mt-6">
              Already have an account?{' '}
              <Link to="/signin" className="font-medium hover:underline" style={{ color: '#4ADE80' }}>
                Sign In
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default SignUp;
