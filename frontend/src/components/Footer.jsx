import { Link } from 'react-router-dom';
import { Brain, Github, Linkedin, Twitter, ArrowRight } from 'lucide-react';

const NAV_GROUPS = [
  {
    label: 'Product',
    links: [
      { to: '/', label: 'Home' },
      { to: '/jobs', label: 'Browse Jobs' },
      { to: '/onboard', label: 'Get Started' },
    ],
  },
  {
    label: 'Company',
    links: [
      { to: '/about', label: 'About Us' },
      { to: '/contact', label: 'Contact' },
    ],
  },
  {
    label: 'Account',
    links: [
      { to: '/login', label: 'Log In' },
      { to: '/register', label: 'Sign Up' },
      { to: '/dashboard', label: 'Dashboard' },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="relative border-t border-white/6 bg-[#050811] overflow-hidden">
      {/* Glow orbs */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-175 h-50 rounded-full bg-indigo-900/20 blur-[100px] pointer-events-none" />

      <div className="relative z-10 max-w-6xl mx-auto px-4 pt-16 pb-8">
        {/* Top row */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-10 mb-14">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link to="/" className="inline-flex items-center gap-2 mb-5">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                <Brain size={17} className="text-white" />
              </div>
              <span className="font-extrabold text-white tracking-tight">AdaptLearn</span>
            </Link>
            <p className="text-slate-500 text-sm leading-relaxed max-w-xs mb-6">
              AI-powered skill gap analysis and personalized learning roadmaps for
              ambitious engineers. Built at ARTPARK CodeForge 2026.
            </p>
            {/* Newsletter mini CTA */}
            <div className="flex gap-2 max-w-xs">
              <input
                type="email"
                placeholder="your@email.com"
                className="flex-1 text-sm bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 transition-colors"
              />
              <button
                className="w-10 h-10 shrink-0 bg-indigo-600 hover:bg-indigo-500 rounded-xl flex items-center justify-center transition-colors"
                aria-label="Subscribe"
              >
                <ArrowRight size={15} className="text-white" />
              </button>
            </div>
            <p className="text-xs text-slate-700 mt-2">Get updates on new features</p>
          </div>

          {/* Nav groups */}
          {NAV_GROUPS.map(({ label, links }) => (
            <div key={label}>
              <div className="text-xs font-bold tracking-widest text-slate-600 uppercase mb-4">{label}</div>
              <ul className="space-y-3">
                {links.map(({ to, label: linkLabel }) => (
                  <li key={to}>
                    <Link
                      to={to}
                      className="text-sm text-slate-500 hover:text-white transition-colors"
                    >
                      {linkLabel}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="border-t border-white/5 pt-7 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-700">
            © {new Date().getFullYear()} AdaptLearn · Built at ARTPARK CodeForge Hackathon 2026
          </p>
          <div className="flex items-center gap-3">
            {[
              { icon: Github, href: '#', label: 'GitHub' },
              { icon: Linkedin, href: '#', label: 'LinkedIn' },
              { icon: Twitter, href: '#', label: 'Twitter' },
            ].map(({ icon: SocialIcon, href, label }) => (
              <a
                key={label}
                href={href}
                aria-label={label}
                className="w-8 h-8 rounded-lg bg-white/4 border border-white/8 flex items-center justify-center text-slate-600 hover:text-white hover:border-white/20 transition-all"
              >
                <SocialIcon size={14} />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
