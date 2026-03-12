import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, CheckCircle2, XCircle } from 'lucide-react';

const PROFESSIONS = [
  'Student', 'Software Engineer', 'Doctor', 'Business Owner',
  'Teacher', 'Accountant', 'Lawyer', 'Government Employee',
  'Freelancer', 'Investor', 'Other',
];

const INCOME_RANGES = [
  'Below ₹2 LPA', '₹2–5 LPA', '₹5–10 LPA',
  '₹10–20 LPA', '₹20–50 LPA', 'Above ₹50 LPA',
  'Prefer not to say',
];

const VALID_EMAIL_DOMAINS = [
  'gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com',
  'icloud.com', 'protonmail.com', 'rediffmail.com', 'live.com',
];

interface PasswordCheck {
  label: string;
  passed: boolean;
}

const getPasswordChecks = (password: string): PasswordCheck[] => [
  { label: 'At least 8 characters', passed: password.length >= 8 },
  { label: 'One uppercase letter (A-Z)', passed: /[A-Z]/.test(password) },
  { label: 'One lowercase letter (a-z)', passed: /[a-z]/.test(password) },
  { label: 'One number (0-9)', passed: /[0-9]/.test(password) },
  { label: 'One special character (!@#$...)', passed: /[^A-Za-z0-9]/.test(password) },
];

const getStrengthLabel = (passed: number) => {
  if (passed <= 1) return { label: 'Very Weak', color: 'bg-red-500' };
  if (passed === 2) return { label: 'Weak', color: 'bg-orange-500' };
  if (passed === 3) return { label: 'Fair', color: 'bg-yellow-500' };
  if (passed === 4) return { label: 'Strong', color: 'bg-blue-400' };
  return { label: 'Very Strong', color: 'bg-hero-accent' };
};

const SignUp = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [profession, setProfession] = useState('');
  const [annualIncome, setAnnualIncome] = useState('');
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [loading, setLoading] = useState(false);

  const passwordChecks = getPasswordChecks(password);
  const passedCount = passwordChecks.filter(c => c.passed).length;
  const strength = getStrengthLabel(passedCount);
  const isPasswordStrong = passedCount === 5;

  const validateEmail = (val: string) => {
    const trimmed = val.trim().toLowerCase();
    if (!trimmed.includes('@')) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    const domain = trimmed.split('@')[1];
    if (!domain) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    if (!VALID_EMAIL_DOMAINS.includes(domain)) {
      setEmailError('Please use a valid email provider (e.g. gmail.com, yahoo.com)');
      return false;
    }
    const emailRegex = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(trimmed)) {
      setEmailError('Invalid email format');
      return false;
    }
    setEmailError('');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!validateEmail(email)) return;
    if (!isPasswordStrong) {
      setError('Please make sure your password meets all requirements');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email: email.trim().toLowerCase(),
          password,
          profession,
          annualIncome,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Registration failed');
      localStorage.setItem('tp_token', data.token);
      window.location.href = '/';
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-hero-bg flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-hero-text">Create Account</h1>
          <p className="text-hero-text-muted mt-2">Join Traders Paradise today</p>
        </div>

        <div className="bg-hero-surface border border-hero-border rounded-2xl p-8">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Name */}
            <div>
              <label className="block text-sm text-hero-text-muted mb-1">Full Name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} required
                className="w-full px-4 py-3 rounded-xl bg-hero-bg border border-hero-border text-hero-text focus:outline-none focus:border-hero-accent/50"
                placeholder="Your full name" />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm text-hero-text-muted mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); if (emailError) validateEmail(e.target.value); }}
                onBlur={() => validateEmail(email)}
                required
                className={`w-full px-4 py-3 rounded-xl bg-hero-bg border text-hero-text focus:outline-none transition-colors ${emailError ? 'border-red-500/50 focus:border-red-500' : 'border-hero-border focus:border-hero-accent/50'}`}
                placeholder="you@gmail.com" />
              {emailError && (
                <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
                  <XCircle className="w-3 h-3" /> {emailError}
                </p>
              )}
              {!emailError && email && email.includes('@') && (
                <p className="mt-1 text-xs text-hero-accent flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Valid email
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm text-hero-text-muted mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 pr-12 rounded-xl bg-hero-bg border border-hero-border text-hero-text focus:outline-none focus:border-hero-accent/50"
                  placeholder="Create a strong password" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-hero-text-muted hover:text-hero-text">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Strength bar + checklist */}
              {password && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1, 2, 3, 4, 5].map(i => (
                      <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${i <= passedCount ? strength.color : 'bg-hero-border'}`} />
                    ))}
                  </div>
                  <p className="text-xs text-hero-text-muted mb-2">
                    Strength: <span className={`font-semibold ${passedCount >= 4 ? 'text-hero-accent' : passedCount >= 3 ? 'text-yellow-400' : 'text-red-400'}`}>{strength.label}</span>
                  </p>
                  <div className="space-y-1">
                    {passwordChecks.map((check) => (
                      <p key={check.label} className={`text-xs flex items-center gap-1.5 ${check.passed ? 'text-hero-accent' : 'text-hero-text-muted'}`}>
                        {check.passed
                          ? <CheckCircle2 className="w-3 h-3 flex-shrink-0" />
                          : <XCircle className="w-3 h-3 flex-shrink-0" />}
                        {check.label}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Profession */}
            <div>
              <label className="block text-sm text-hero-text-muted mb-1">Profession</label>
              <select value={profession} onChange={e => setProfession(e.target.value)} required
                className="w-full px-4 py-3 rounded-xl bg-hero-bg border border-hero-border text-hero-text focus:outline-none focus:border-hero-accent/50">
                <option value="">Select your profession</option>
                {PROFESSIONS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            {/* Annual Income */}
            <div>
              <label className="block text-sm text-hero-text-muted mb-1">Annual Income</label>
              <select value={annualIncome} onChange={e => setAnnualIncome(e.target.value)} required
                className="w-full px-4 py-3 rounded-xl bg-hero-bg border border-hero-border text-hero-text focus:outline-none focus:border-hero-accent/50">
                <option value="">Select income range</option>
                {INCOME_RANGES.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>

            <button type="submit" disabled={loading || !isPasswordStrong || !!emailError}
              className="w-full py-3 rounded-xl bg-hero-accent text-hero-bg font-semibold hover:bg-hero-accent/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2">
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-hero-text-muted mt-6">
            Already have an account?{' '}
            <Link to="/signin" className="text-hero-accent hover:underline">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUp;