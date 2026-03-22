import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { authService } from '../services/authService';
import { Brain, LayoutDashboard, Briefcase, LogOut, Menu, X, UserCircle, Info, Mail, ShieldCheck } from 'lucide-react';
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

  const navLink = (to, label, Icon) => {
    const isActive = to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);
    return (
      <Link
        to={to}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors
          ${isActive
            ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
            : 'text-slate-400 hover:text-white hover:bg-white/6'}`}
        onClick={() => setMobileOpen(false)}
      >
        <Icon size={15} />
        {label}
      </Link>
    );
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-white/6 bg-[#050811]/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 font-bold text-white">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
            <Brain className="text-white" size={18} />
          </div>
          <span className="text-white font-extrabold tracking-tight">AdaptLearn</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {/* Public links always visible */}
          {navLink('/about', 'About', Info)}
          {navLink('/contact', 'Contact', Mail)}
          {user ? (
            <>
              <div className="w-px h-5 bg-white/10 mx-1" />
              {navLink('/dashboard', 'Dashboard', LayoutDashboard)}
              {navLink('/jobs', 'Jobs', Briefcase)}
              {navLink('/onboard', 'Get Started', Brain)}
              {navLink('/profile', 'Profile', UserCircle)}
              {user?.role === 'admin' && navLink('/admin', 'Admin', ShieldCheck)}
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-white/10 transition-colors ml-1"
              >
                <LogOut size={16} />
                Logout
              </button>
              <div className="ml-2 w-8 h-8 rounded-full bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold shadow-[0_0_12px_rgba(99,102,241,0.4)]">
                {user.name?.[0]?.toUpperCase()}
              </div>
            </>
          ) : (
            <>
              <div className="w-px h-5 bg-white/10 mx-1" />
              <Link to="/login" className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors">Login</Link>
              <Link to="/register" className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors font-medium shadow-[0_0_16px_rgba(99,102,241,0.3)]">Sign Up</Link>
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
        <div className="md:hidden border-t border-white/6 bg-[#050811]/95 backdrop-blur-md px-4 py-3 flex flex-col gap-1">
          {navLink('/about', 'About', Info)}
          {navLink('/contact', 'Contact', Mail)}
          {user ? (
            <>
              <div className="my-1 border-t border-white/6" />
              {navLink('/dashboard', 'Dashboard', LayoutDashboard)}
              {navLink('/jobs', 'Jobs', Briefcase)}
              {navLink('/onboard', 'Get Started', Brain)}
              {navLink('/profile', 'Profile', UserCircle)}
              {user?.role === 'admin' && navLink('/admin', 'Admin', ShieldCheck)}
              <button onClick={handleLogout} className="flex items-center gap-2 px-3 py-2 text-sm text-slate-400 hover:text-white transition-colors">
                <LogOut size={16} /> Logout
              </button>
            </>
          ) : (
            <>
              <div className="my-1 border-t border-white/6" />
              <Link to="/login" onClick={() => setMobileOpen(false)} className="px-3 py-2 text-sm text-slate-400 hover:text-white transition-colors">Login</Link>
              <Link to="/register" onClick={() => setMobileOpen(false)} className="px-3 py-2 text-sm bg-indigo-600 text-white rounded-lg font-medium">Sign Up</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
