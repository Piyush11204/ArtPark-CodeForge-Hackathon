import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Brain, Zap, Eye, EyeOff, UserPlus, CheckCircle2 } from 'lucide-react';
import { authService } from '../services/authService';
import { useAuthStore } from '../store/authStore';

const RULES = [
  { label: 'At least 8 characters', test: (v) => v.length >= 8 },
  { label: 'One uppercase letter', test: (v) => /[A-Z]/.test(v) },
  { label: 'One number', test: (v) => /[0-9]/.test(v) },
];

export default function RegisterPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (f) => (e) => setForm({ ...form, [f]: e.target.value });

  const pwValid = RULES.every((r) => r.test(form.password));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!pwValid) {
      setError('Password does not meet the requirements below.');
      return;
    }
    setLoading(true);
    try {
      const data = await authService.register(form.name, form.email, form.password);
      setAuth(data.user, data.accessToken, data.refreshToken);
      navigate('/onboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Try a different email.');
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
            <Zap size={12} /> Free — No credit card required
          </div>
          <h2 className="text-4xl font-extrabold text-white leading-tight mb-4">
            Your personalized<br />
            <span className="text-indigo-400">learning roadmap</span><br />
            starts here.
          </h2>
          <p className="text-slate-400 text-lg leading-relaxed">
            Join thousands of developers using AI-powered gap analysis to prepare
            faster and more precisely for their next role.
          </p>
        </div>
        <div className="space-y-3">
          {[
            'AI parses your resume in seconds',
            'Matches you to 1,369 real tech jobs',
            'Generates dependency-ordered learning path',
            'Track progress, mark modules complete',
          ].map((item) => (
            <div key={item} className="flex items-center gap-2 text-sm text-slate-300">
              <CheckCircle2 size={16} className="text-indigo-400 shrink-0" />
              {item}
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-2 text-white font-bold text-xl mb-8 lg:hidden">
            <Brain className="text-indigo-400" size={24} />
            AdaptLearn
          </div>

          <h1 className="text-3xl font-bold text-white mb-2">Create account</h1>
          <p className="text-slate-400 mb-8">Get your personalized roadmap in 60 seconds.</p>

          {error && (
            <div className="flex items-center gap-2 bg-red-900/30 border border-red-700 text-red-300 text-sm rounded-xl px-4 py-3 mb-6">
              <span>⚠</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Full Name</label>
              <input
                type="text"
                value={form.name}
                onChange={set('name')}
                placeholder="Piyush Yadav"
                required
                autoComplete="name"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
              />
            </div>

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
                  placeholder="Create a strong password"
                  required
                  autoComplete="new-password"
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
              {/* Password strength checklist */}
              {form.password && (
                <div className="mt-2 space-y-1">
                  {RULES.map((r) => (
                    <div key={r.label} className={`flex items-center gap-1.5 text-xs ${r.test(form.password) ? 'text-emerald-400' : 'text-slate-500'}`}>
                      <CheckCircle2 size={12} className={r.test(form.password) ? 'text-emerald-400' : 'text-slate-600'} />
                      {r.label}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <><UserPlus size={18} /> Create Account</>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-slate-400 mt-8">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
