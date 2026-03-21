import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Brain, Zap, Eye, EyeOff, LogIn } from 'lucide-react';
import { authService } from '../services/authService';
import { useAuthStore } from '../store/authStore';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const from = location.state?.from?.pathname || '/dashboard';
  const set = (f) => (e) => setForm({ ...form, [f]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await authService.login(form.email, form.password);
      setAuth(data.user, data.accessToken, data.refreshToken);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 p-12 border-r border-slate-800">
        <div className="flex items-center gap-2 text-white font-bold text-xl">
          <Brain className="text-indigo-400" size={28} />
          AdaptLearn
        </div>
        <div>
          <div className="inline-flex items-center gap-2 bg-indigo-900/40 border border-indigo-700 rounded-full px-3 py-1 text-xs text-indigo-300 mb-6">
            <Zap size={12} /> ARTPARK CodeForge Hackathon 2026
          </div>
          <h2 className="text-4xl font-extrabold text-white leading-tight mb-4">
            Close skill gaps.<br />
            <span className="text-indigo-400">Land the role.</span>
          </h2>
          <p className="text-slate-400 text-lg leading-relaxed">
            Upload your resume, pick a job from 1,369 real positions, and get a
            personalized AI-powered learning roadmap in under 60 seconds.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[['1,369', 'Real Jobs'], ['24+', 'Curated Courses'], ['<60s', 'To Roadmap']].map(([v, l]) => (
            <div key={l} className="bg-slate-800/60 rounded-xl p-4 text-center border border-slate-700">
              <div className="text-2xl font-bold text-indigo-400">{v}</div>
              <div className="text-xs text-slate-400 mt-0.5">{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 text-white font-bold text-xl mb-8 lg:hidden">
            <Brain className="text-indigo-400" size={24} />
            AdaptLearn
          </div>

          <h1 className="text-3xl font-bold text-white mb-2">Welcome back</h1>
          <p className="text-slate-400 mb-8">Sign in to continue your learning journey.</p>

          {error && (
            <div className="flex items-center gap-2 bg-red-900/30 border border-red-700 text-red-300 text-sm rounded-xl px-4 py-3 mb-6">
              <span>⚠</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={set('email')}
                placeholder="you@example.com"
                required
                autoComplete="email"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={form.password}
                  onChange={set('password')}
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 pr-11 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <><LogIn size={18} /> Sign In</>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-slate-400 mt-8">
            Don't have an account?{' '}
            <Link to="/register" className="text-indigo-400 hover:text-indigo-300 font-medium">
              Create one free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
