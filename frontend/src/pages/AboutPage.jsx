import { Link } from 'react-router-dom';
import { Brain, Target, Sparkles, ArrowRight, Users, Zap, Shield, BookOpen, Award, Github, Linkedin, Twitter } from 'lucide-react';

const TEAM = [
  {
    name: 'Aditya Nair',
    role: 'Lead Engineer & Architect',
    bio: 'Full-stack engineer obsessed with developer tooling. Built the core AI pipeline and resume parser.',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face',
    github: '#',
    linkedin: '#',
  },
  {
    name: 'Riya Patel',
    role: 'ML & NLP Engineer',
    bio: 'Specializes in large language models and information extraction. Designed the skill gap analysis engine.',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face',
    github: '#',
    linkedin: '#',
  },
  {
    name: 'Karan Singh',
    role: 'Frontend & UX Engineer',
    bio: 'Crafts interfaces that feel as good as they look. Responsible for the entire learner experience.',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face',
    github: '#',
    linkedin: '#',
  },
  {
    name: 'Meghna Das',
    role: 'Data & Backend Engineer',
    bio: 'Curated the 1,369-job dataset and built the high-performance matching and indexing backend.',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face',
    github: '#',
    linkedin: '#',
  },
];

const VALUES = [
  { Icon: Target, title: 'Precision Over Volume', desc: 'We believe one hour of targeted learning beats ten hours of scattered studying. Everything we build optimizes for signal, not noise.' },
  { Icon: Shield, title: 'Honest, Not Hyped', desc: 'No inflated metrics, no fake progress. We show you where you actually stand and what it genuinely takes to get where you want to go.' },
  { Icon: Zap, title: 'Speed Without Sacrifice', desc: 'A great roadmap in 60 seconds. We move fast but never cut corners on quality or accuracy of the AI output.' },
  { Icon: Users, title: 'Built for Real People', desc: 'Every feature is designed around the frustrations of actual job seekers — not theoretical users. We listened, then we built.' },
  { Icon: BookOpen, title: 'Learning as Leverage', desc: 'Skills are the highest-ROI investment a developer can make. We treat your time as irreplaceable and every course recommendation as a serious commitment.' },
  { Icon: Award, title: 'Hackathon Spirit', desc: 'Born at ARTPARK CodeForge 2026, we carry the hacker ethos: ship fast, iterate relentlessly, and always leave the user better off than you found them.' },
];

const TIMELINE = [
  { year: 'Jan 2026', title: 'The Idea', desc: 'Our team noticed that most career advice is generic noise. We asked: what if AI could give you a truly personalized learning plan?' },
  { year: 'Feb 2026', title: 'Building the Core', desc: 'We spent 4 weeks building the LLM-powered resume parser, job matching engine, and gap analysis pipeline from scratch.' },
  { year: 'Mar 2026', title: 'Dataset Curation', desc: 'Hand-curated 1,369 real job descriptions from top tech companies, tagging required skills at granular resolution.' },
  { year: 'Mar 2026', title: 'AdaptLearn Launches', desc: 'Launched at ARTPARK CodeForge Hackathon 2026. From idea to deployed product in under 90 days.' },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#050811] text-white overflow-x-hidden">

      {/* ── HERO ──────────────────────────────────────────── */}
      <section className="relative py-32 px-4 overflow-hidden">
        {/* Orbs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-32 -right-32 w-150 h-150 rounded-full bg-indigo-700/15 blur-[120px]" />
          <div className="absolute bottom-0 left-0 w-125 h-100 rounded-full bg-purple-800/10 blur-[100px]" />
        </div>
        {/* Grid */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'linear-gradient(rgb(255 255 255/1) 1px,transparent 1px),linear-gradient(90deg,rgb(255 255 255/1) 1px,transparent 1px)', backgroundSize: '60px 60px' }}
        />
        <div className="relative z-10 max-w-5xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/30 rounded-full px-4 py-1.5 text-sm text-indigo-300 mb-8">
            <Sparkles size={13} /> Our Story
          </div>
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h1 className="text-5xl lg:text-6xl font-extrabold leading-tight mb-6">
                We're on a mission to<br />
                <span className="bg-linear-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">end skill-gap guessing</span>
              </h1>
              <p className="text-slate-400 text-lg leading-relaxed mb-8">
                AdaptLearn was built by engineers who grew tired of watching talented people fail
                interviews not because they lacked ability, but because they studied the wrong things.
                We built the tool we wish had existed.
              </p>
              <div className="flex gap-4">
                <Link to="/contact" className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-semibold transition-all">
                  Get in Touch <ArrowRight size={16} />
                </Link>
                <Link to="/" className="inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white px-6 py-3 rounded-xl font-semibold transition-all">
                  Try AdaptLearn
                </Link>
              </div>
            </div>
            <div className="relative">
              <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-[0_30px_80px_rgba(0,0,0,0.5)]">
                <img
                  src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=85&auto=format&fit=crop"
                  alt="Team collaborating"
                  className="w-full h-80 object-cover"
                />
                <div className="absolute inset-0 bg-linear-to-t from-[#050811]/60 to-transparent" />
                <div className="absolute bottom-5 left-5 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-4 py-3">
                  <div className="text-white font-semibold text-sm">ARTPARK CodeForge 2026</div>
                  <div className="text-slate-400 text-xs mt-0.5">Built in 90 days</div>
                </div>
              </div>
              <div className="absolute inset-0 -z-10 blur-3xl opacity-30 bg-linear-to-br from-indigo-600 to-purple-600 rounded-3xl" />
            </div>
          </div>
        </div>
      </section>

      {/* ── MISSION STATEMENT ─────────────────────────────── */}
      <section className="py-20 px-4 border-y border-white/5 bg-white/2">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-widest text-purple-400 uppercase mb-6">
            <Brain size={12} /> Our Mission
          </div>
          <blockquote className="text-3xl lg:text-4xl font-bold text-white leading-relaxed mb-6">
            "Make every hour of learning <span className="bg-linear-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">count</span> — by showing developers exactly what to learn, not drowning them in a sea of irrelevant tutorials."
          </blockquote>
          <p className="text-slate-500 text-lg">— The AdaptLearn Team</p>
        </div>
      </section>

      {/* ── TIMELINE ──────────────────────────────────────── */}
      <section className="py-28 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-widest text-indigo-400 uppercase mb-4">
              <Sparkles size={12} /> Timeline
            </div>
            <h2 className="text-4xl font-extrabold mb-3">From idea to <span className="bg-linear-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">product</span></h2>
            <p className="text-slate-500">The story of AdaptLearn, in milestones</p>
          </div>
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-8 top-0 bottom-0 w-px bg-linear-to-b from-indigo-700/80 via-purple-700/50 to-transparent hidden md:block" />
            <div className="space-y-8">
              {TIMELINE.map(({ year, title, desc }, idx) => (
                <div key={idx} className="flex gap-8 items-start">
                  {/* Dot + line */}
                  <div className="hidden md:flex flex-col items-center gap-0" style={{ width: 64, flexShrink: 0 }}>
                    <div className="w-4 h-4 rounded-full bg-indigo-500 border-2 border-indigo-300 shadow-[0_0_12px_rgba(99,102,241,0.6)] mt-5" />
                  </div>
                  <div className="flex-1 bg-white/3 border border-white/7 rounded-2xl p-7 hover:border-indigo-800/50 transition-all">
                    <div className="text-xs font-bold text-indigo-400 tracking-widest uppercase mb-2">{year}</div>
                    <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
                    <p className="text-slate-400">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── TEAM ──────────────────────────────────────────── */}
      <section className="py-24 px-4 bg-white/2 border-y border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-widest text-purple-400 uppercase mb-4">
              <Users size={12} /> The Team
            </div>
            <h2 className="text-4xl font-extrabold mb-3">
              Built by <span className="bg-linear-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">passionate engineers</span>
            </h2>
            <p className="text-slate-500 max-w-xl mx-auto">Four people, one shared frustration, and 90 days to build something better.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {TEAM.map(({ name, role, bio, avatar, github, linkedin }) => (
              <div key={name} className="group relative bg-white/4 border border-white/8 rounded-2xl overflow-hidden hover:border-indigo-700/50 transition-all hover:bg-white/7">
                <div className="relative overflow-hidden">
                  <img src={avatar} alt={name} className="w-full h-52 object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-linear-to-t from-[#050811] via-[#050811]/20 to-transparent" />
                </div>
                <div className="p-6">
                  <h3 className="font-bold text-white text-lg mb-0.5">{name}</h3>
                  <div className="text-indigo-400 text-xs font-semibold mb-3">{role}</div>
                  <p className="text-slate-500 text-sm leading-relaxed mb-4">{bio}</p>
                  <div className="flex gap-3">
                    <a href={github} className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:border-white/30 transition-all">
                      <Github size={14} />
                    </a>
                    <a href={linkedin} className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-blue-400 hover:border-blue-500/30 transition-all">
                      <Linkedin size={14} />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── VALUES ────────────────────────────────────────── */}
      <section className="py-28 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-widest text-indigo-400 uppercase mb-4">
              <Award size={12} /> Our Values
            </div>
            <h2 className="text-4xl font-extrabold mb-3">
              What we stand for
            </h2>
            <p className="text-slate-500 max-w-xl mx-auto">The principles that guide every decision we make.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {VALUES.map(({ Icon: ValIcon, title, desc }) => (
              <div key={title} className="flex gap-5 p-6 bg-white/3 border border-white/7 rounded-2xl hover:bg-white/5 hover:border-white/12 transition-all">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0 mt-0.5">
                  <ValIcon size={18} className="text-indigo-400" />
                </div>
                <div>
                  <h3 className="font-bold text-white mb-2">{title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FULL-WIDTH IMAGE ──────────────────────────────── */}
      <section className="px-4 pb-28">
        <div className="max-w-6xl mx-auto">
          <div className="relative rounded-3xl overflow-hidden border border-white/10">
            <img
              src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1400&q=85&auto=format&fit=crop"
              alt="Team working"
              className="w-full h-95 object-cover"
            />
            <div className="absolute inset-0 bg-linear-to-r from-[#050811]/80 via-[#050811]/50 to-transparent" />
            <div className="absolute inset-0 flex items-center px-12 lg:px-20">
              <div>
                <h2 className="text-3xl lg:text-4xl font-extrabold text-white mb-4">Want to work with us?</h2>
                <p className="text-slate-400 text-lg mb-7 max-w-md">We're always looking for passionate engineers and designers to join our mission.</p>
                <Link to="/contact" className="inline-flex items-center gap-2 bg-white text-slate-900 hover:bg-indigo-50 px-6 py-3 rounded-xl font-bold transition-all">
                  Say Hello <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
