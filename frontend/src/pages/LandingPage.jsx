import { Link } from 'react-router-dom';
import { Brain, Zap, Target, TrendingUp, ArrowRight, CheckCircle, Sparkles, BookOpen, Users, Star, ChevronRight } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

const TESTIMONIALS = [
  {
    name: 'Priya Sharma',
    role: 'Software Engineer @ Google',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=face',
    text: 'AdaptLearn showed me exactly which skills I was missing for my dream role. Got the offer in 3 months.',
    rating: 5,
  },
  {
    name: 'Arjun Mehta',
    role: 'ML Engineer @ Flipkart',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face',
    text: 'The gap analysis was frighteningly accurate. Saved me months of studying the wrong things.',
    rating: 5,
  },
  {
    name: 'Sneha Kapoor',
    role: 'Product Manager @ Razorpay',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&crop=face',
    text: 'I love how the roadmap adapts to what I already know. No filler, just pure signal.',
    rating: 5,
  },
];

export default function LandingPage() {
  const { user } = useAuthStore();
  return (
    <div className="min-h-screen bg-[#050811] text-white overflow-x-hidden">

      {/* ── HERO ────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden px-4 pt-20 pb-12">
        <video className="absolute inset-0 w-full h-full object-cover opacity-20" src="/hero.mp4" autoPlay loop muted playsInline />
        {/* Gradient orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -left-40 w-150 h-150 rounded-full bg-indigo-600/20 blur-[120px]" />
          <div className="absolute top-20 -right-40 w-125 h-125 rounded-full bg-purple-600/20 blur-[120px]" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-200 h-75 rounded-full bg-indigo-900/30 blur-[100px]" />
        </div>
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'linear-gradient(rgb(255 255 255/1) 1px,transparent 1px),linear-gradient(90deg,rgb(255 255 255/1) 1px,transparent 1px)', backgroundSize: '60px 60px' }}
        />
        <div className="relative z-10 max-w-6xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          {/* LEFT: copy */}
          <div>
            <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/30 rounded-full px-4 py-1.5 text-sm text-indigo-300 mb-8 backdrop-blur-sm">
              <Zap size={13} className="text-indigo-400" /><span>ARTPARK CodeForge Hackathon 2026</span>
            </div>
            <h1 className="text-5xl lg:text-6xl xl:text-7xl font-extrabold leading-[1.08] tracking-tight mb-6">
              Bridge Your<br />
              <span className="bg-linear-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">Skill Gaps</span>
              <br /><span className="text-slate-300">with AI Precision</span>
            </h1>
            <p className="text-lg text-slate-400 leading-relaxed mb-10 max-w-xl">
              Upload your resume, pick a target role, and get a laser-focused learning roadmap
              that covers <em className="text-white not-italic font-medium">exactly</em> what
              you're missing — nothing more.
            </p>
            <div className="flex flex-wrap gap-4 mb-10">
              <Link
                to={user ? '/onboard' : '/register'}
                className="group inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-7 py-3.5 rounded-xl font-semibold text-base transition-all shadow-[0_0_30px_rgba(99,102,241,0.4)] hover:shadow-[0_0_50px_rgba(99,102,241,0.6)]"
              >
                Get Your Roadmap <ArrowRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link to="/jobs" className="inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white px-7 py-3.5 rounded-xl font-semibold text-base border border-white/10 transition-all backdrop-blur-sm">
                Browse 1,369 Jobs
              </Link>
            </div>
            <div className="flex items-center gap-6 text-sm text-slate-500">
              {[['1,369', 'Real Jobs'], ['24+', 'Courses'], ['< 60s', 'Setup']].map(([v, l]) => (
                <div key={l} className="flex items-center gap-1.5">
                  <span className="font-bold text-white text-base">{v}</span> {l}
                </div>
              ))}
            </div>
          </div>
          {/* RIGHT: dashboard mockup */}
          <div className="hidden lg:block relative">
            <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-[0_30px_80px_rgba(0,0,0,0.6)]">
              <img
                src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=85&auto=format&fit=crop"
                alt="Dashboard preview"
                className="w-full object-cover"
              />
              <div className="absolute inset-0 bg-linear-to-t from-[#050811]/80 via-transparent to-transparent" />
              <div className="absolute top-6 left-6 flex items-center gap-2 bg-green-500/20 border border-green-400/30 backdrop-blur-md rounded-full px-3 py-1.5 text-xs text-green-300">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" /> Roadmap Generated
              </div>
              <div className="absolute bottom-6 right-6 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-4 py-2.5 text-sm">
                <div className="text-slate-400 text-xs mb-1">Skill match</div>
                <div className="text-2xl font-extrabold text-indigo-400">87%</div>
              </div>
            </div>
            <div className="absolute inset-0 -z-10 blur-3xl opacity-40 bg-linear-to-br from-indigo-600 to-purple-600 rounded-3xl" />
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-linear-to-t from-[#050811] to-transparent" />
      </section>

      {/* ── SOCIAL PROOF ────────────────────────────────── */}
      <section className="py-10 px-4 border-y border-white/5 bg-white/2">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-xs uppercase tracking-[0.25em] text-slate-600 mb-6">Trusted by engineers from</p>
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
            {['Google', 'Amazon', 'Flipkart', 'Razorpay', 'Swiggy', 'Zepto', 'CRED', 'Infosys'].map(co => (
              <span key={co} className="text-slate-500 font-semibold text-sm tracking-wide hover:text-slate-300 transition-colors">{co}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ────────────────────────────────── */}
      <section className="py-28 px-4 relative">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/2 left-0 w-100 h-100 rounded-full bg-purple-900/10 blur-[100px]" />
        </div>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-widest text-indigo-400 uppercase mb-4">
              <Sparkles size={12} /> The Process
            </div>
            <h2 className="text-4xl lg:text-5xl font-extrabold mb-4">
              Four steps to your<br />
              <span className="bg-linear-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">dream role</span>
            </h2>
            <p className="text-slate-500 max-w-xl mx-auto">From resume upload to a fully personalized training pathway in under a minute.</p>
          </div>
          <div className="space-y-5">
            {[
              { step: '01', title: 'Upload Your Resume', desc: 'Drop your PDF or DOCX. Our LLM-powered parser strips every skill, technology, project, and experience into structured data in seconds.', img: 'https://www.foundit.id/career-advice/wp-content/uploads/2021/10/Professional-Resume-Templates.jpg', reverse: false },
              { step: '02', title: 'Pick a Target Job', desc: 'Browse 1,369 curated real-world roles from top tech companies. Filter by domain, stack, or seniority to find the role that excites you.', img: 'https://substackcdn.com/image/fetch/$s_!yzkv!,w_1200,h_675,c_fill,f_jpg,q_auto:good,fl_progressive:steep,g_auto/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2Ffa474d79-e96e-49d2-ac07-0c8a6f487b94_1200x800.png', reverse: true },
              { step: '03', title: 'Discover Your Skill Gaps', desc: 'We run a precision comparison between your profile and the job requirements, surfacing only the skills you are actually missing.', img: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=700&q=80&auto=format&fit=crop', reverse: false },
              { step: '04', title: 'Get Your Learning Roadmap', desc: 'Receive a dependency-aware, ordered pathway with curated courses and resources. Track your progress toward full role-readiness.', img: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=700&q=80&auto=format&fit=crop', reverse: true },
            ].map(({ step, title, desc, img, reverse }) => (
              <div
                key={step}
                className={`flex flex-col ${reverse ? 'lg:flex-row-reverse' : 'lg:flex-row'} items-stretch bg-white/3 border border-white/7 rounded-2xl overflow-hidden hover:border-white/12 transition-all`}
              >
                <div className="w-full lg:w-[45%] relative overflow-hidden" style={{ minHeight: 260 }}>
                  <img src={img} alt={title} className="absolute inset-0 w-full h-full object-cover" />
                  <div className={`absolute inset-0 bg-gradient-to-${reverse ? 'l' : 'r'} from-transparent to-[#050811]/70`} />
                </div>
                <div className="flex-1 px-8 py-10 lg:flex lg:flex-col lg:justify-center" style={{ minHeight: 260 }}>
                  <div className="text-8xl font-extrabold text-white/[0.035] leading-none select-none -mt-2 mb-1">{step}</div>
                  <div className="text-xs font-bold text-indigo-400 tracking-widest uppercase mb-3">Step {step}</div>
                  <h3 className="text-2xl font-bold text-white mb-4">{title}</h3>
                  <p className="text-slate-400 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ────────────────────────────────────── */}
      <section className="py-24 px-4 bg-white/2 border-y border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-widest text-purple-400 uppercase mb-4">
              <Target size={12} /> Why AdaptLearn
            </div>
            <h2 className="text-4xl lg:text-5xl font-extrabold mb-4">
              Built for <span className="bg-linear-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">serious learners</span>
            </h2>
            <p className="text-slate-500 max-w-xl mx-auto">Every feature is designed to eliminate wasted effort and accelerate your career growth.</p>
          </div>
          <div className="grid lg:grid-cols-3 gap-6">
            {[
              {
                Icon: Target, accentColor: '#6366f1',
                glowClass: 'bg-indigo-600/10', borderClass: 'border-indigo-900/40',
                iconClass: 'bg-indigo-500/10 border border-indigo-500/20 text-indigo-400',
                badgeClass: 'text-indigo-400 bg-indigo-500/10 border border-indigo-500/20',
                title: 'Zero Redundancy',
                desc: 'We compare your existing skills against role requirements. You only study what you are missing — no wasted time on what you already know.',
                detail: 'Precision-mapped to JD requirements',
              },
              {
                Icon: Brain, accentColor: '#a855f7',
                glowClass: 'bg-purple-600/10', borderClass: 'border-purple-900/40',
                iconClass: 'bg-purple-500/10 border border-purple-500/20 text-purple-400',
                badgeClass: 'text-purple-400 bg-purple-500/10 border border-purple-500/20',
                title: 'LLM-Powered Parsing',
                desc: 'Our AI reads your resume like a human recruiter — extracting implicit skills, inferring experience levels, and understanding context deeply.',
                detail: 'Powered by state-of-the-art LLMs',
              },
              {
                Icon: TrendingUp, accentColor: '#ec4899',
                glowClass: 'bg-pink-600/10', borderClass: 'border-pink-900/40',
                iconClass: 'bg-pink-500/10 border border-pink-500/20 text-pink-400',
                badgeClass: 'text-pink-400 bg-pink-500/10 border border-pink-500/20',
                title: 'Adaptive Progress',
                desc: 'Mark modules complete, track training hours, and watch your readiness score climb toward 100% for your chosen role.',
                detail: 'Real-time readiness scoring',
              },
            ].map(({ Icon: FeatureIcon, glowClass, borderClass, iconClass, badgeClass, title, desc, detail }) => (
              <div key={title} className={`relative bg-white/3 border ${borderClass} rounded-2xl p-8 overflow-hidden hover:bg-white/5 hover:border-white/20 transition-all`}>
                <div className={`absolute top-0 right-0 w-40 h-40 rounded-full ${glowClass} blur-3xl pointer-events-none`} />
                <div className={`w-12 h-12 rounded-2xl ${iconClass} flex items-center justify-center mb-6`}>
                  <FeatureIcon size={22} />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
                <p className="text-slate-400 leading-relaxed mb-6">{desc}</p>
                <div className={`inline-flex items-center gap-1.5 text-xs font-medium ${badgeClass} rounded-full px-3 py-1`}>
                  <CheckCircle size={11} /> {detail}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BIG IMAGE FEATURE ───────────────────────────── */}
      <section className="py-28 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="relative rounded-3xl overflow-hidden border border-white/10 shadow-[0_40px_100px_rgba(0,0,0,0.7)]">
            <img
              src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1400&q=85&auto=format&fit=crop"
              alt="Team learning together"
              className="w-full h-120 object-cover"
            />
            <div className="absolute inset-0 bg-linear-to-r from-[#050811]/92 via-[#050811]/60 to-transparent" />
            <div className="absolute inset-0 flex items-center px-10 lg:px-20">
              <div className="max-w-lg">
                <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-widest text-indigo-400 uppercase mb-6">
                  <BookOpen size={12} /> Learning, Reimagined
                </div>
                <h2 className="text-4xl lg:text-5xl font-extrabold text-white mb-6 leading-tight">
                  Stop learning<br />the wrong things
                </h2>
                <p className="text-slate-300 text-lg leading-relaxed mb-8">
                  Most developers waste 80% of study time on skills they already have.
                  AdaptLearn focuses you on the 20% that will actually get you hired.
                </p>
                <Link
                  to={user ? '/onboard' : '/register'}
                  className="group inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-semibold transition-all"
                >
                  Start Your Journey <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ───────────────────────────────────────── */}
      <section className="py-24 px-4 bg-white/2 border-y border-white/5">
        <div className="max-w-5xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { val: '1,369', label: 'Real Job Listings', sub: 'From top tech companies' },
            { val: '24+', label: 'Curated Courses', sub: 'Handpicked resources' },
            { val: '< 60s', label: 'To Your Roadmap', sub: 'Lightning-fast AI' },
            { val: '100%', label: 'Personalized', sub: 'No two paths are the same' },
          ].map(({ val, label, sub }) => (
            <div key={label} className="text-center">
              <div className="text-5xl font-extrabold bg-linear-to-br from-indigo-400 to-purple-400 bg-clip-text text-transparent mb-2">{val}</div>
              <div className="font-semibold text-white mb-1">{label}</div>
              <div className="text-xs text-slate-600">{sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── TESTIMONIALS ────────────────────────────────── */}
      <section className="py-28 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-widest text-indigo-400 uppercase mb-4">
              <Users size={12} /> What Learners Say
            </div>
            <h2 className="text-4xl font-extrabold text-white mb-3">
              Loved by ambitious{' '}
              <span className="bg-linear-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">engineers</span>
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map(({ name, role, avatar, text, rating }) => (
              <div key={name} className="bg-white/4 border border-white/8 rounded-2xl p-7 flex flex-col gap-5 hover:border-indigo-700/50 transition-all hover:bg-white/6">
                <div className="flex gap-0.5">
                  {Array.from({ length: rating }).map((_, i) => (
                    <Star key={i} size={14} className="text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-slate-300 leading-relaxed flex-1">&ldquo;{text}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <img src={avatar} alt={name} className="w-10 h-10 rounded-full object-cover ring-2 ring-indigo-500/30" />
                  <div>
                    <div className="font-semibold text-white text-sm">{name}</div>
                    <div className="text-xs text-slate-500">{role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ──────────────────────────────────── */}
      <section className="py-10 px-4 pb-24">
        <div className="max-w-5xl mx-auto">
          <div className="relative rounded-3xl overflow-hidden bg-linear-to-br from-indigo-600 via-indigo-700 to-purple-800 p-14 text-center">
            <div className="absolute -top-10 -left-10 w-64 h-64 rounded-full bg-white/10 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-10 -right-10 w-64 h-64 rounded-full bg-purple-400/20 blur-3xl pointer-events-none" />
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 text-sm text-white/80 mb-6">
                <Zap size={13} className="text-yellow-300" /> Free to get started — no card required
              </div>
              <h2 className="text-4xl lg:text-5xl font-extrabold text-white mb-5">
                Your roadmap is<br />waiting for you
              </h2>
              <p className="text-indigo-200 text-lg max-w-xl mx-auto mb-10">
                Join thousands of engineers who have used AdaptLearn to land their target roles faster.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link
                  to={user ? '/onboard' : '/register'}
                  className="inline-flex items-center gap-2 bg-white text-indigo-700 hover:bg-indigo-50 px-8 py-4 rounded-xl font-bold text-base transition-all shadow-xl"
                >
                  <CheckCircle size={20} /> Start Free Today
                </Link>
                <Link
                  to="/about"
                  className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white px-8 py-4 rounded-xl font-semibold text-base transition-all"
                >
                  Learn About Us
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
