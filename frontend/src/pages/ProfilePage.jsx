import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, Mail, Phone, MapPin, Linkedin, Briefcase, GraduationCap,
  Code2, Wrench, Database, Layers, Award, FolderOpen,
  FileText, RefreshCw, Calendar, ChevronDown, ChevronUp,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { resumeService } from '../services/resumeService';
import { authService } from '../services/authService';
import { SkillBadge, Spinner, Card, Button, Alert } from '../components/ui';

/* ── helpers ──────────────────────────────────────────────────────────────── */
function Section({ icon: Icon, title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Card className="mb-4">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-2 font-semibold text-white">
          <Icon size={17} className="text-indigo-400 shrink-0" />
          {title}
        </div>
        {open ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
      </button>
      {open && <div className="mt-4">{children}</div>}
    </Card>
  );
}

function InfoRow({ label, value }) {
  if (!value) return null;
  const display = value && typeof value === 'object'
    ? [value.city, value.state, value.country].filter(Boolean).join(', ') || value.address || ''
    : value;
  if (!display) return null;
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-1 py-2 border-b border-slate-700/50 last:border-0">
      <span className="text-xs text-slate-500 w-28 shrink-0">{label}</span>
      <span className="text-sm text-slate-200 break-all">{display}</span>
    </div>
  );
}

function SkillGroup({ label, skills }) {
  if (!skills?.length) return null;
  return (
    <div className="mb-4">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {skills.map((s) => (
          <SkillBadge key={s} skill={s} variant="brand" />
        ))}
      </div>
    </div>
  );
}

/* ── main component ───────────────────────────────────────────────────────── */
export default function ProfilePage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [resumes, setResumes] = useState([]);
  const [activeResume, setActiveResume] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    resumeService
      .getMyResumes()
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setResumes(list);
        if (list.length > 0) setActiveResume(list[0]);
      })
      .catch(() => setError('Failed to load resume data.'))
      .finally(() => setLoading(false));
  }, []);

  const parsed = activeResume?.parsedData;
  const info = parsed?.personal_information ?? {};
  const skills = parsed?.skills ?? {};
  const exp = parsed?.work_experience ?? [];
  const edu = parsed?.education ?? [];
  const certs = parsed?.certifications ?? [];
  const projects = parsed?.projects ?? [];
  const summary = parsed?.professional_summary;

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Profile</h1>
          <p className="text-slate-400 mt-1">Your account & parsed resume data</p>
        </div>
        <Button onClick={() => navigate('/onboard')} variant="secondary">
          <RefreshCw size={15} /> Upload New Resume
        </Button>
      </div>

      {/* Account card */}
      <Card className="mb-6 flex items-center gap-5">
        <div className="w-14 h-14 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xl font-bold shrink-0">
          {user?.name?.charAt(0)?.toUpperCase() ?? 'U'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-white text-lg truncate">{user?.name}</p>
          <p className="text-slate-400 text-sm">{user?.email}</p>
          <span className="inline-flex items-center gap-1 text-xs text-indigo-300 bg-indigo-900/40 border border-indigo-800 px-2 py-0.5 rounded-full mt-1 capitalize">
            {user?.role ?? 'candidate'}
          </span>
        </div>
      </Card>

      {error && <Alert type="error" message={error} />}

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : resumes.length === 0 ? (
        <Card className="text-center py-12">
          <FileText size={40} className="mx-auto text-slate-600 mb-3" />
          <p className="text-slate-400 mb-1">No resume uploaded yet.</p>
          <p className="text-slate-500 text-sm mb-6">Upload your resume to see parsed skills and experience here.</p>
          <Button onClick={() => navigate('/onboard')}>Upload Resume →</Button>
        </Card>
      ) : (
        <>
          {/* Resume selector (if multiple) */}
          {resumes.length > 1 && (
            <Card className="mb-4">
              <p className="text-xs text-slate-400 mb-2 font-medium">Select Resume</p>
              <div className="flex flex-wrap gap-2">
                {resumes.map((r) => (
                  <button
                    key={r._id}
                    onClick={() => setActiveResume(r)}
                    className={`text-sm px-3 py-1.5 rounded-lg border transition-colors ${
                      activeResume?._id === r._id
                        ? 'border-indigo-600 bg-indigo-900/40 text-indigo-300'
                        : 'border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-500'
                    }`}
                  >
                    {r.originalFilename ?? `Resume ${r._id.slice(-4)}`}
                  </button>
                ))}
              </div>
            </Card>
          )}

          {/* Resume metadata */}
          <Card className="mb-4 flex flex-wrap items-center gap-4 bg-indigo-950/30 border-indigo-800">
            <FileText size={18} className="text-indigo-400" />
            <span className="text-sm text-white font-medium">
              {activeResume?.originalFilename ?? 'Resume'}
            </span>
            {activeResume?.parsedAt && (
              <span className="flex items-center gap-1 text-xs text-slate-400">
                <Calendar size={12} />
                Parsed {new Date(activeResume.parsedAt).toLocaleDateString()}
              </span>
            )}
            {activeResume?.normalizedSkills?.length > 0 && (
              <span className="text-xs text-indigo-300">
                {activeResume.normalizedSkills.length} skills extracted
              </span>
            )}
          </Card>

          {/* Personal Information */}
          <Section icon={User} title="Personal Information">
            <InfoRow label="Full Name" value={info.full_name} />
            <InfoRow label="Email" value={info.email} />
            <InfoRow label="Phone" value={info.phone} />
            <InfoRow label="Location" value={info.location} />
            {info.linkedin && (
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 py-2">
                <span className="text-xs text-slate-500 w-28 shrink-0">LinkedIn</span>
                <a
                  href={info.linkedin.startsWith('http') ? info.linkedin : `https://${info.linkedin}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1 break-all"
                >
                  <Linkedin size={13} /> {info.linkedin}
                </a>
              </div>
            )}
          </Section>

          {/* Summary */}
          {summary && (
            <Section icon={FileText} title="Professional Summary">
              <p className="text-sm text-slate-300 leading-relaxed">{summary}</p>
            </Section>
          )}

          {/* Skills */}
          {(skills.technical_skills?.length > 0 || skills.frameworks?.length > 0 ||
            skills.databases?.length > 0 || skills.tools_and_technologies?.length > 0 ||
            skills.soft_skills?.length > 0) && (
            <Section icon={Code2} title="Skills">
              <SkillGroup label="Technical Skills" skills={skills.technical_skills} />
              <SkillGroup label="Frameworks & Libraries" skills={skills.frameworks} />
              <SkillGroup label="Databases" skills={skills.databases} />
              <SkillGroup label="Tools & Technologies" skills={skills.tools_and_technologies} />
              <SkillGroup label="Languages" skills={skills.languages} />
              <SkillGroup label="Soft Skills" skills={skills.soft_skills} />

              {/* Normalized skills (flat deduped list) */}
              {activeResume?.normalizedSkills?.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-700">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                    Normalized Skill Set (used for gap analysis)
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {activeResume.normalizedSkills.map((s) => (
                      <SkillBadge key={s} skill={s} variant="neutral" />
                    ))}
                  </div>
                </div>
              )}
            </Section>
          )}

          {/* Work Experience */}
          {exp.length > 0 && (
            <Section icon={Briefcase} title={`Work Experience (${exp.length})`}>
              <div className="space-y-5">
                {exp.map((e, i) => (
                  <div key={i} className="relative pl-4 border-l-2 border-indigo-800">
                    <div className="flex flex-wrap items-start justify-between gap-1 mb-1">
                      <div>
                        <p className="font-semibold text-white">{e.position ?? e.title}</p>
                        <p className="text-indigo-300 text-sm">{e.company}</p>
                      </div>
                      {e.duration && (
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Calendar size={11} /> {e.duration}
                        </span>
                      )}
                    </div>
                    {e.description && (
                      <p className="text-sm text-slate-400 leading-relaxed mt-1">{e.description}</p>
                    )}
                    {e.technologies_used?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {e.technologies_used.map((t) => (
                          <SkillBadge key={t} skill={t} variant="brand" />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Education */}
          {edu.length > 0 && (
            <Section icon={GraduationCap} title={`Education (${edu.length})`}>
              <div className="space-y-4">
                {edu.map((e, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-900/50 border border-indigo-800 flex items-center justify-center shrink-0">
                      <GraduationCap size={14} className="text-indigo-400" />
                    </div>
                    <div>
                      <p className="font-medium text-white">{e.degree}</p>
                      <p className="text-sm text-slate-400">{e.institution}</p>
                      <div className="flex gap-3 mt-0.5">
                        {e.year && <span className="text-xs text-slate-500">{e.year}</span>}
                        {e.gpa && <span className="text-xs text-slate-500">GPA: {e.gpa}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Projects */}
          {projects.length > 0 && (
            <Section icon={FolderOpen} title={`Projects (${projects.length})`} defaultOpen={false}>
              <div className="space-y-5">
                {projects.map((p, i) => (
                  <div key={i} className="relative pl-4 border-l-2 border-slate-700">
                    <p className="font-semibold text-white mb-1">{p.project_name ?? p.name}</p>
                    {p.description && (
                      <p className="text-sm text-slate-400 leading-relaxed">{p.description}</p>
                    )}
                    {p.technologies_used?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {p.technologies_used.map((t) => (
                          <SkillBadge key={t} skill={t} variant="brand" />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Certifications */}
          {certs.length > 0 && (
            <Section icon={Award} title={`Certifications (${certs.length})`} defaultOpen={false}>
              <div className="space-y-3">
                {certs.map((c, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <Award size={16} className="text-yellow-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-white">{c.name}</p>
                      {c.issuing_organization && (
                        <p className="text-xs text-slate-400">{c.issuing_organization}</p>
                      )}
                      {c.issue_date && (
                        <p className="text-xs text-slate-500">{c.issue_date}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}
        </>
      )}
    </div>
  );
}
