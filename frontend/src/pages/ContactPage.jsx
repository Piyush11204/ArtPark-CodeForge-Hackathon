import { useState } from 'react';
import { Mail, MessageSquare, MapPin, Phone, Send, Github, Linkedin, Twitter, CheckCircle, Sparkles } from 'lucide-react';

const FAQS = [
  { q: 'Is AdaptLearn free to use?', a: 'Yes — creating an account, uploading your resume, and generating a roadmap is completely free.' },
  { q: 'How accurate is the skill gap analysis?', a: 'Very. Our LLM extracts structured skills from both your resume and the job description, then runs a semantic comparison to find true gaps — not just keyword mismatches.' },
  { q: 'Can I generate roadmaps for multiple jobs?', a: 'Absolutely. You can run the onboarding flow for as many target roles as you like.' },
  { q: 'What file formats does the resume parser support?', a: 'We support PDF and DOCX — the two formats hiring managers prefer.' },
];

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    // Simulate send — replace with real API call
    setTimeout(() => { setLoading(false); setSent(true); }, 1200);
  };

  return (
    <div className="min-h-screen bg-[#050811] text-white overflow-x-hidden">

      {/* ── HERO ──────────────────────────────────────────── */}
      <section className="relative pt-28 pb-16 px-4 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-32 left-1/4 w-[500px] h-[500px] rounded-full bg-indigo-700/15 blur-[120px]" />
          <div className="absolute top-10 right-0 w-[400px] h-[400px] rounded-full bg-purple-800/10 blur-[100px]" />
        </div>
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'linear-gradient(rgb(255 255 255/1) 1px,transparent 1px),linear-gradient(90deg,rgb(255 255 255/1) 1px,transparent 1px)', backgroundSize: '60px 60px' }}
        />
        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/30 rounded-full px-4 py-1.5 text-sm text-indigo-300 mb-8">
            <MessageSquare size={13} /> Reach Out
          </div>
          <h1 className="text-5xl lg:text-6xl font-extrabold leading-tight mb-6">
            We'd love to<br />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">hear from you</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">
            Questions, feedback, bug reports, collab ideas — whatever it is, drop us a line.
            We read every message and respond within 24 hours.
          </p>
        </div>
      </section>

      {/* ── CONTACT SPLIT ─────────────────────────────────── */}
      <section className="py-10 px-4 pb-24">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-5 gap-8">

          {/* LEFT: Info panel */}
          <div className="lg:col-span-2 space-y-6">
            {/* Hero image */}
            <div className="relative rounded-2xl overflow-hidden border border-white/10 h-52">
              <img
                src="https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800&q=85&auto=format&fit=crop"
                alt="Office"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#050811]/70 to-transparent" />
              <div className="absolute bottom-4 left-4">
                <div className="text-white font-semibold">Bengaluru, India</div>
                <div className="text-slate-400 text-xs">ARTPARK, IISc Campus</div>
              </div>
            </div>

            {/* Contact info */}
            <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6 space-y-5">
              <h3 className="font-bold text-white text-lg">Contact Info</h3>
              {[
                { Icon: Mail, label: 'Email', value: 'hello@adaptlearn.in', href: 'mailto:hello@adaptlearn.in' },
                { Icon: Phone, label: 'Phone', value: '+91 80 2360 0000', href: 'tel:+918023600000' },
                { Icon: MapPin, label: 'Address', value: 'ARTPARK, IISc, Bengaluru 560012', href: '#' },
              ].map(({ Icon, label, value, href }) => (
                <a key={label} href={href} className="flex items-start gap-4 group">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center flex-shrink-0">
                    <Icon size={16} className="text-indigo-400" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-600 mb-0.5">{label}</div>
                    <div className="text-white text-sm group-hover:text-indigo-300 transition-colors">{value}</div>
                  </div>
                </a>
              ))}
            </div>

            {/* Social */}
            <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6">
              <h3 className="font-bold text-white text-lg mb-4">Follow Us</h3>
              <div className="flex gap-3">
                {[
                  { Icon: Github, href: '#', label: 'GitHub', hover: 'hover:bg-white/10 hover:border-white/30 hover:text-white' },
                  { Icon: Linkedin, href: '#', label: 'LinkedIn', hover: 'hover:bg-blue-500/10 hover:border-blue-400/30 hover:text-blue-400' },
                  { Icon: Twitter, href: '#', label: 'Twitter', hover: 'hover:bg-sky-500/10 hover:border-sky-400/30 hover:text-sky-400' },
                ].map(({ Icon, href, label, hover }) => (
                  <a
                    key={label}
                    href={href}
                    aria-label={label}
                    className={`w-10 h-10 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-slate-500 transition-all ${hover}`}
                  >
                    <Icon size={16} />
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT: Form */}
          <div className="lg:col-span-3">
            <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-8 lg:p-10">
              {sent ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mb-5">
                    <CheckCircle size={28} className="text-green-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">Message Sent!</h3>
                  <p className="text-slate-400 max-w-sm">Thanks for reaching out. We'll get back to you within 24 hours.</p>
                  <button
                    onClick={() => { setSent(false); setForm({ name: '', email: '', subject: '', message: '' }); }}
                    className="mt-8 text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <>
                  <div className="mb-8">
                    <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-widest text-indigo-400 uppercase mb-3">
                      <Sparkles size={11} /> Send a Message
                    </div>
                    <h2 className="text-2xl font-bold text-white">How can we help?</h2>
                  </div>
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm text-slate-400 mb-2">Name</label>
                        <input
                          name="name"
                          value={form.name}
                          onChange={handleChange}
                          required
                          placeholder="Your full name"
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/60 focus:bg-white/[0.07] transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-slate-400 mb-2">Email</label>
                        <input
                          name="email"
                          type="email"
                          value={form.email}
                          onChange={handleChange}
                          required
                          placeholder="you@example.com"
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/60 focus:bg-white/[0.07] transition-all"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm text-slate-400 mb-2">Subject</label>
                      <select
                        name="subject"
                        value={form.subject}
                        onChange={handleChange}
                        required
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500/60 focus:bg-white/[0.07] transition-all appearance-none"
                        style={{ colorScheme: 'dark' }}
                      >
                        <option value="" disabled>Select a subject</option>
                        <option value="general">General Question</option>
                        <option value="feedback">Product Feedback</option>
                        <option value="bug">Bug Report</option>
                        <option value="collab">Collaboration / Partnership</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-slate-400 mb-2">Message</label>
                      <textarea
                        name="message"
                        value={form.message}
                        onChange={handleChange}
                        required
                        rows={6}
                        placeholder="Tell us what's on your mind..."
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/60 focus:bg-white/[0.07] transition-all resize-none"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white py-3.5 rounded-xl font-semibold transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)]"
                    >
                      {loading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <><Send size={16} /> Send Message</>
                      )}
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────── */}
      <section className="py-24 px-4 bg-white/[0.02] border-t border-white/5">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-widest text-indigo-400 uppercase mb-4">
              <MessageSquare size={12} /> Common Questions
            </div>
            <h2 className="text-4xl font-extrabold mb-3">
              Frequently asked <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">questions</span>
            </h2>
          </div>
          <div className="space-y-4">
            {FAQS.map(({ q, a }) => (
              <div key={q} className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-7 hover:border-indigo-800/50 transition-all">
                <h3 className="font-bold text-white mb-3">{q}</h3>
                <p className="text-slate-400 leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
