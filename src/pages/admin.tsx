import { useEffect, useState } from 'react';
import { Users, TrendingUp, Briefcase, DollarSign, Shield, RefreshCw } from 'lucide-react';

const ADMIN_KEY = 'tradersparadise_admin_2026';

interface UserData {
  _id: string;
  name: string;
  email: string;
  profession: string;
  annualIncome: string;
  createdAt: string;
}

interface Stats {
  totalUsers: number;
  users: UserData[];
  professionBreakdown: Record<string, number>;
  incomeBreakdown: Record<string, number>;
}

const Admin = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [password, setPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [search, setSearch] = useState('');

  const fetchStats = async () => {
    setLoading(true);
    try {
     const res = await fetch('https://traders-paradise-3.onrender.com/api/admin/stats', {
        headers: { 'x-admin-key': ADMIN_KEY },
      });
      if (!res.ok) throw new Error('Unauthorized');
      const data = await res.json();
      setStats(data);
    } catch {
      setError('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'traders2026') {
      setAuthenticated(true);
      fetchStats();
    } else {
      setError('Wrong admin password');
    }
  };

  const filteredUsers = stats?.users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.profession?.toLowerCase().includes(search.toLowerCase())
  ) ?? [];

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-hero-bg flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <Shield className="w-12 h-12 text-hero-accent mx-auto mb-3" />
            <h1 className="text-2xl font-bold text-hero-text">Admin Panel</h1>
            <p className="text-hero-text-muted text-sm mt-1">Traders Paradise</p>
          </div>
          <div className="bg-hero-surface border border-hero-border rounded-2xl p-8">
            {error && <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>}
            <form onSubmit={handleLogin} className="space-y-4">
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="Admin password" required
                className="w-full px-4 py-3 rounded-xl bg-hero-bg border border-hero-border text-hero-text focus:outline-none focus:border-hero-accent/50" />
              <button type="submit"
                className="w-full py-3 rounded-xl bg-hero-accent text-hero-bg font-semibold hover:bg-hero-accent/80 transition-colors">
                Enter Admin Panel
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-hero-bg text-hero-text">
      {/* Header */}
      <div className="border-b border-hero-border bg-hero-surface px-4 md:px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Shield className="w-5 h-5 text-hero-accent" />
          <span className="font-bold text-lg">Traders Paradise — Admin</span>
        </div>
        <button onClick={fetchStats} className="flex items-center gap-2 text-sm text-hero-text-muted hover:text-hero-accent transition-colors">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="w-8 h-8 animate-spin text-hero-accent" />
          </div>
        ) : stats ? (
          <>
            {/* ── Summary Cards ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="p-5 rounded-xl bg-hero-surface border border-hero-border">
                <Users className="w-5 h-5 text-hero-accent mb-2" />
                <p className="text-sm text-hero-text-muted">Total Users</p>
                <p className="text-3xl font-bold">{stats.totalUsers}</p>
              </div>
              <div className="p-5 rounded-xl bg-hero-surface border border-hero-border">
                <Briefcase className="w-5 h-5 text-hero-accent mb-2" />
                <p className="text-sm text-hero-text-muted">Top Profession</p>
                <p className="text-xl font-bold truncate">
                  {Object.entries(stats.professionBreakdown).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—'}
                </p>
              </div>
              <div className="p-5 rounded-xl bg-hero-surface border border-hero-border">
                <DollarSign className="w-5 h-5 text-hero-accent mb-2" />
                <p className="text-sm text-hero-text-muted">Top Income Range</p>
                <p className="text-xl font-bold truncate">
                  {Object.entries(stats.incomeBreakdown).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—'}
                </p>
              </div>
              <div className="p-5 rounded-xl bg-hero-surface border border-hero-border">
                <TrendingUp className="w-5 h-5 text-hero-accent mb-2" />
                <p className="text-sm text-hero-text-muted">New Today</p>
                <p className="text-3xl font-bold">
                  {stats.users.filter(u => new Date(u.createdAt).toDateString() === new Date().toDateString()).length}
                </p>
              </div>
            </div>

            {/* ── Breakdown Charts ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Profession */}
              <div className="p-4 md:p-6 rounded-xl bg-hero-surface border border-hero-border">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-hero-accent" /> Profession Breakdown
                </h3>
                <div className="space-y-3">
                  {Object.entries(stats.professionBreakdown).sort((a, b) => b[1] - a[1]).map(([prof, count]) => (
                    <div key={prof}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-hero-text">{prof}</span>
                        <span className="text-hero-accent font-semibold">{count} ({Math.round((count / stats.totalUsers) * 100)}%)</span>
                      </div>
                      <div className="h-2 bg-hero-border rounded-full overflow-hidden">
                        <div className="h-full bg-hero-accent rounded-full transition-all"
                          style={{ width: `${(count / stats.totalUsers) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Income */}
              <div className="p-4 md:p-6 rounded-xl bg-hero-surface border border-hero-border">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-hero-accent" /> Annual Income Breakdown
                </h3>
                <div className="space-y-3">
                  {Object.entries(stats.incomeBreakdown).sort((a, b) => b[1] - a[1]).map(([income, count]) => (
                    <div key={income}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-hero-text">{income}</span>
                        <span className="text-hero-accent font-semibold">{count} ({Math.round((count / stats.totalUsers) * 100)}%)</span>
                      </div>
                      <div className="h-2 bg-hero-border rounded-full overflow-hidden">
                        <div className="h-full bg-green-400 rounded-full transition-all"
                          style={{ width: `${(count / stats.totalUsers) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Users Table ── */}
            <div className="rounded-xl bg-hero-surface border border-hero-border overflow-hidden">
              <div className="px-4 md:px-6 py-4 border-b border-hero-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <Users className="w-4 h-4 text-hero-accent" /> All Users ({stats.totalUsers})
                </h3>
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search by name, email, profession..."
                  className="w-full sm:w-64 px-4 py-2 rounded-lg bg-hero-bg border border-hero-border text-sm text-hero-text focus:outline-none focus:border-hero-accent/50" />
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-sm text-hero-text-muted border-b border-hero-border">
                      <th className="px-6 py-3">#</th>
                      <th className="px-6 py-3">Name</th>
                      <th className="px-6 py-3">Email</th>
                      <th className="px-6 py-3">Profession</th>
                      <th className="px-6 py-3">Annual Income</th>
                      <th className="px-6 py-3">Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u, i) => (
                      <tr key={u._id} className="border-t border-hero-border hover:bg-hero-bg/50 transition-colors text-sm">
                        <td className="px-6 py-4 text-hero-text-muted">{i + 1}</td>
                        <td className="px-6 py-4 font-semibold text-hero-text">{u.name}</td>
                        <td className="px-6 py-4 text-hero-text-muted">{u.email}</td>
                        <td className="px-6 py-4">
                          <span className="px-2.5 py-1 rounded-full bg-hero-accent/10 text-hero-accent text-xs font-semibold">
                            {u.profession || 'Not specified'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-hero-text">{u.annualIncome || '—'}</td>
                        <td className="px-6 py-4 text-hero-text-muted">
                          {new Date(u.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center text-hero-text-muted py-16">{error}</div>
        )}
      </div>
    </div>
  );
};

export default Admin;