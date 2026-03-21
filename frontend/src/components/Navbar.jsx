import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { authService } from '../services/authService';
import { Brain, LayoutDashboard, Briefcase, LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    try { await authService.logout(); } catch { /* ignore */ }
    logout();
    navigate('/');
  };

  const navLink = (to, label, Icon) => (
    <Link
      to={to}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors
        ${location.pathname.startsWith(to)
          ? 'bg-indigo-600 text-white'
          : 'text-slate-300 hover:text-white hover:bg-slate-700'}`}
      onClick={() => setMobileOpen(false)}
    >
      <Icon size={16} />
      {label}
    </Link>
  );

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-700 bg-slate-900/80 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-14">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 font-bold text-white">
          <Brain className="text-indigo-400" size={22} />
          <span className="text-indigo-400">AdaptLearn</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {user ? (
            <>
              {navLink('/dashboard', 'Dashboard', LayoutDashboard)}
              {navLink('/jobs', 'Jobs', Briefcase)}
              {navLink('/onboard', 'Get Started', Brain)}
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-700 transition-colors ml-2"
              >
                <LogOut size={16} />
                Logout
              </button>
              <div className="ml-3 w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-bold">
                {user.name?.[0]?.toUpperCase()}
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="px-4 py-2 text-sm text-slate-300 hover:text-white transition-colors">Login</Link>
              <Link to="/register" className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors">Sign Up</Link>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden text-slate-300 hover:text-white" onClick={() => setMobileOpen(o => !o)}>
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-slate-700 bg-slate-900 px-4 py-3 flex flex-col gap-1">
          {user ? (
            <>
              {navLink('/dashboard', 'Dashboard', LayoutDashboard)}
              {navLink('/jobs', 'Jobs', Briefcase)}
              {navLink('/onboard', 'Get Started', Brain)}
              <button onClick={handleLogout} className="flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:text-white">
                <LogOut size={16} /> Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={() => setMobileOpen(false)} className="px-3 py-2 text-sm text-slate-300">Login</Link>
              <Link to="/register" onClick={() => setMobileOpen(false)} className="px-3 py-2 text-sm bg-indigo-600 text-white rounded-lg">Sign Up</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
