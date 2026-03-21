import { Link } from 'react-router-dom';
import { Brain, Zap, Target, TrendingUp, ArrowRight, CheckCircle } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export default function LandingPage() {
  const { user } = useAuthStore();

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Hero */}
      <section className="relative overflow-hidden py-24 px-4">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/20 via-slate-950 to-slate-950" />
        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-indigo-900/40 border border-indigo-700 rounded-full px-4 py-1.5 text-sm text-indigo-300 mb-6">
            <Zap size={14} /> ARTPARK CodeForge Hackathon 2026
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight">
            Your
            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent"> Personalized</span>
            <br />Learning Roadmap
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Upload your resume, pick a job, and get an AI-generated adaptive training pathway
            that bridges exactly the skills you're missing — nothing more, nothing less.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to={user ? '/onboard' : '/register'}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3.5 rounded-xl font-semibold text-lg transition-colors"
            >
              Get Started <ArrowRight size={20} />
            </Link>
            <Link
              to="/jobs"
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-8 py-3.5 rounded-xl font-semibold text-lg border border-slate-700 transition-colors"
            >
              Browse 1300+ Jobs
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4 bg-slate-900/50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-3">How It Works</h2>
          <p className="text-center text-slate-400 mb-12">Four steps from resume to personalized roadmap</p>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { icon: '📄', step: '01', title: 'Upload Resume', desc: 'Drop your PDF or DOCX. Our AI parser extracts every skill and experience.' },
              { icon: '🎯', step: '02', title: 'Pick a Job', desc: 'Search 1,369 curated real jobs from top tech companies.' },
              { icon: '🔍', step: '03', title: 'Skill Gap Analysis', desc: 'We compare your profile to the job requirements and find the exact gaps.' },
              { icon: '🗺️', step: '04', title: 'Learning Roadmap', desc: 'Get an ordered, dependency-aware training pathway with curated courses.' },
            ].map((item) => (
              <div key={item.step} className="relative bg-slate-800 rounded-xl p-6 border border-slate-700">
                <div className="text-3xl mb-3">{item.icon}</div>
                <div className="text-xs font-bold text-indigo-400 mb-1">STEP {item.step}</div>
                <h3 className="font-bold text-white mb-2">{item.title}</h3>
                <p className="text-sm text-slate-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-6">
          {[
            { Icon: Target, title: 'Zero Redundancy', desc: 'Only learn what you\'re actually missing. No wasted time on skills you already have.' },
            { Icon: Brain, title: 'AI-Powered Parsing', desc: 'Live LLM-based resume parser extracts structured skill data in seconds.' },
            { Icon: TrendingUp, title: 'Progress Tracking', desc: 'Mark modules complete and track your training hours toward role-readiness.' },
          ].map(({ Icon, title, desc }) => (
            <div key={title} className="bg-slate-800 rounded-xl p-6 border border-slate-700">
              <div className="w-10 h-10 bg-indigo-600/20 rounded-lg flex items-center justify-center mb-4">
                <Icon className="text-indigo-400" size={20} />
              </div>
              <h3 className="font-bold text-white mb-2">{title}</h3>
              <p className="text-sm text-slate-400">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 px-4 bg-slate-900/50">
        <div className="max-w-3xl mx-auto grid grid-cols-3 gap-8 text-center">
          {[['1,369', 'Real Jobs'], ['24+', 'Curated Courses'], ['<60s', 'To Your Roadmap']].map(([val, label]) => (
            <div key={label}>
              <div className="text-4xl font-extrabold text-indigo-400 mb-1">{val}</div>
              <div className="text-sm text-slate-400">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 text-center">
        <h2 className="text-3xl font-bold mb-4">Ready to close your skill gaps?</h2>
        <p className="text-slate-400 mb-8">Create a free account and get your personalized roadmap in under 60 seconds.</p>
        <Link
          to={user ? '/onboard' : '/register'}
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3.5 rounded-xl font-semibold text-lg transition-colors"
        >
          <CheckCircle size={20} /> Start Free
        </Link>
      </section>
    </div>
  );
}
