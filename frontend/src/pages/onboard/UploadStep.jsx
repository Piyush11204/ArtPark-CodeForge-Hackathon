import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import {
  UploadCloud, FileText, X, Plus, Pencil, Trash2,
  User, Briefcase, GraduationCap, Wrench, Award, FolderOpen, ArrowRight, RefreshCw,
} from 'lucide-react';
import { resumeService } from '../../services/resumeService';
import { useOnboardStore } from '../../store/onboardStore';
import { Button, Alert, Spinner, Card, Input } from '../../components/ui';

// ─── Tiny helpers ─────────────────────────────────────────────────────────────

function Section({ icon: Icon, title, color = 'indigo', children }) {
  return (
    <Card className="space-y-4">
      <div className={`flex items-center gap-2 text-${color}-400`}>
        <Icon size={16} />
        <h3 className="font-semibold text-white text-sm">{title}</h3>
      </div>
      {children}
    </Card>
  );
}

/** Editable tag list — type + Enter/comma to add, × to remove */
function TagEditor({ tags = [], onChange, placeholder = 'Add skill…' }) {
  const [val, setVal] = useState('');
  const add = () => {
    const t = val.trim();
    if (t && !tags.includes(t)) onChange([...tags, t]);
    setVal('');
  };
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {tags.map((t) => (
          <span key={t} className="flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-indigo-900/50 text-indigo-300 border border-indigo-700">
            {t}
            <button type="button" onClick={() => onChange(tags.filter(x => x !== t))} className="hover:text-white"><X size={11} /></button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={val}
          onChange={e => setVal(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(); } }}
          placeholder={placeholder}
          className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
        />
        <button type="button" onClick={add} className="px-3 py-1 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white text-sm">
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
}

/** Single-field inline edit row */
function EditField({ label, value, onChange, type = 'text' }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-slate-400">{label}</label>
      <input
        type={type}
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
      />
    </div>
  );
}

// ─── Experience / Education entry cards ──────────────────────────────────────

function ExpCard({ exp, onRemove, onSave }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ ...exp });
  const f = (k) => (v) => setDraft(d => ({ ...d, [k]: v }));
  if (editing) {
    return (
      <div className="bg-slate-700/60 border border-slate-600 rounded-lg p-3 space-y-2 text-sm">
        <EditField label="Job Title" value={draft.position} onChange={f('position')} />
        <EditField label="Company" value={draft.company} onChange={f('company')} />
        <EditField label="Duration" value={draft.duration} onChange={f('duration')} />
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-400">Description</label>
          <textarea value={draft.description || ''} onChange={e => setDraft(d => ({ ...d, description: e.target.value }))}
            rows={2} className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 resize-none" />
        </div>
        <div className="flex gap-2 pt-1">
          <Button variant="primary" className="text-xs py-1 px-3 h-auto" onClick={() => { onSave(draft); setEditing(false); }}>Save</Button>
          <Button variant="ghost" className="text-xs py-1 px-3 h-auto" onClick={() => setEditing(false)}>Cancel</Button>
        </div>
      </div>
    );
  }
  return (
    <div className="bg-slate-700/60 border border-slate-600 rounded-lg p-3 flex gap-3 items-start">
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-medium truncate">{exp.position || <span className="text-slate-500 italic">No title</span>}</p>
        <p className="text-slate-400 text-xs">{exp.company}{exp.duration ? ` · ${exp.duration}` : ''}</p>
        {exp.description && <p className="text-slate-500 text-xs mt-1 line-clamp-2">{exp.description}</p>}
      </div>
      <div className="flex gap-1 shrink-0">
        <button onClick={() => setEditing(true)} className="p-1.5 rounded hover:bg-slate-600 text-slate-400 hover:text-white"><Pencil size={13} /></button>
        <button onClick={onRemove} className="p-1.5 rounded hover:bg-red-900/50 text-slate-400 hover:text-red-400"><Trash2 size={13} /></button>
      </div>
    </div>
  );
}

function EduCard({ edu, onRemove, onSave }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ ...edu });
  const f = (k) => (v) => setDraft(d => ({ ...d, [k]: v }));
  if (editing) {
    return (
      <div className="bg-slate-700/60 border border-slate-600 rounded-lg p-3 space-y-2 text-sm">
        <EditField label="Degree" value={draft.degree} onChange={f('degree')} />
        <EditField label="Institution" value={draft.institution} onChange={f('institution')} />
        <EditField label="Year" value={draft.year} onChange={f('year')} />
        <EditField label="Field of Study" value={draft.field_of_study} onChange={f('field_of_study')} />
        <div className="flex gap-2 pt-1">
          <Button variant="primary" className="text-xs py-1 px-3 h-auto" onClick={() => { onSave(draft); setEditing(false); }}>Save</Button>
          <Button variant="ghost" className="text-xs py-1 px-3 h-auto" onClick={() => setEditing(false)}>Cancel</Button>
        </div>
      </div>
    );
  }
  return (
    <div className="bg-slate-700/60 border border-slate-600 rounded-lg p-3 flex gap-3 items-start">
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-medium truncate">{edu.degree || <span className="text-slate-500 italic">No degree</span>}</p>
        <p className="text-slate-400 text-xs">{edu.institution}{edu.year ? ` · ${edu.year}` : ''}</p>
        {edu.field_of_study && <p className="text-slate-500 text-xs">{edu.field_of_study}</p>}
      </div>
      <div className="flex gap-1 shrink-0">
        <button onClick={() => setEditing(true)} className="p-1.5 rounded hover:bg-slate-600 text-slate-400 hover:text-white"><Pencil size={13} /></button>
        <button onClick={onRemove} className="p-1.5 rounded hover:bg-red-900/50 text-slate-400 hover:text-red-400"><Trash2 size={13} /></button>
      </div>
    </div>
  );
}

// ─── Add-entry blank forms ────────────────────────────────────────────────────

function AddExpForm({ onAdd, onCancel }) {
  const [d, setD] = useState({ position: '', company: '', duration: '', description: '' });
  const f = (k) => (e) => setD(p => ({ ...p, [k]: e.target.value }));
  return (
    <div className="bg-slate-700/40 border border-dashed border-indigo-600/50 rounded-lg p-3 space-y-2 text-sm">
      <input placeholder="Job Title *" value={d.position} onChange={f('position')} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500" />
      <input placeholder="Company" value={d.company} onChange={f('company')} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500" />
      <input placeholder="Duration (e.g. Jan 2022 – Present)" value={d.duration} onChange={f('duration')} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500" />
      <textarea placeholder="Description" value={d.description} onChange={f('description')} rows={2} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 resize-none" />
      <div className="flex gap-2 pt-1">
        <Button variant="primary" className="text-xs py-1 px-3 h-auto" onClick={() => { if (d.position) { onAdd(d); } }}>Add</Button>
        <Button variant="ghost" className="text-xs py-1 px-3 h-auto" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}

function AddEduForm({ onAdd, onCancel }) {
  const [d, setD] = useState({ degree: '', institution: '', year: '', field_of_study: '' });
  const f = (k) => (e) => setD(p => ({ ...p, [k]: e.target.value }));
  return (
    <div className="bg-slate-700/40 border border-dashed border-indigo-600/50 rounded-lg p-3 space-y-2 text-sm">
      <input placeholder="Degree (e.g. B.Tech in CS)" value={d.degree} onChange={f('degree')} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500" />
      <input placeholder="Institution" value={d.institution} onChange={f('institution')} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500" />
      <input placeholder="Year (e.g. 2022)" value={d.year} onChange={f('year')} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500" />
      <div className="flex gap-2 pt-1">
        <Button variant="primary" className="text-xs py-1 px-3 h-auto" onClick={() => { if (d.degree || d.institution) onAdd(d); }}>Add</Button>
        <Button variant="ghost" className="text-xs py-1 px-3 h-auto" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function UploadStep() {
  const navigate = useNavigate();
  const { setResume } = useOnboardStore();

  // Upload phase state
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  // Preview/edit phase state
  const [resumeId, setResumeId] = useState(null);
  const [parsed, setParsed] = useState(null); // local editable copy
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [addingExp, setAddingExp] = useState(false);
  const [addingEdu, setAddingEdu] = useState(false);

  // ── helpers ─────────────────────────────────────────────────────────────────
  const update = (path, value) => {
    setDirty(true);
    setParsed(prev => {
      const next = structuredClone(prev);
      const keys = path.split('.');
      let obj = next;
      for (let i = 0; i < keys.length - 1; i++) obj = obj[keys[i]];
      obj[keys[keys.length - 1]] = value;
      return next;
    });
  };

  // ── dropzone ─────────────────────────────────────────────────────────────────
  const onDrop = useCallback((accepted) => {
    if (accepted.length > 0) { setFile(accepted[0]); setError(''); }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
    },
    multiple: false,
    maxSize: 5 * 1024 * 1024,
    onDropRejected: () => setError('File must be PDF, DOCX, or TXT and under 5 MB.'),
  });

  // ── upload ────────────────────────────────────────────────────────────────────
  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const data = await resumeService.upload(formData);
      // data = { resumeId, normalizedSkills, parsedData }
      setResumeId(data.resumeId);
      setParsed(data.parsedData);
      setDirty(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  // ── confirm & continue ────────────────────────────────────────────────────────
  const handleConfirm = async () => {
    setSaving(true);
    try {
      let finalParsed = parsed;
      if (dirty) {
        const updated = await resumeService.update(resumeId, parsed);
        finalParsed = updated.parsedData;
      }
      setResume(resumeId, finalParsed);
      navigate('/onboard/job');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // ════════════════════════════════════════════════════════════════════════════
  // PHASE 1 — Upload
  // ════════════════════════════════════════════════════════════════════════════
  if (!parsed) {
    return (
      <div className="max-w-xl mx-auto">
        <h2 className="text-2xl font-bold text-white mb-2">Upload Your Resume</h2>
        <p className="text-slate-400 mb-6">Our AI will extract your skills and experience automatically.</p>

        {error && <Alert type="error" message={error} className="mb-4" />}

        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors mb-4
            ${isDragActive ? 'border-indigo-500 bg-indigo-900/20' : 'border-slate-600 hover:border-indigo-600 bg-slate-800/50'}`}
        >
          <input {...getInputProps()} />
          <UploadCloud size={44} className="mx-auto mb-3 text-slate-400" />
          {file ? (
            <div className="flex items-center justify-center gap-2 text-white">
              <FileText size={16} className="text-indigo-400" />
              <span className="font-medium">{file.name}</span>
              <button type="button" onClick={(e) => { e.stopPropagation(); setFile(null); }} className="text-slate-400 hover:text-white ml-1">
                <X size={16} />
              </button>
            </div>
          ) : isDragActive ? (
            <p className="text-indigo-300 font-medium">Drop your file here…</p>
          ) : (
            <>
              <p className="text-white font-medium mb-1">Drag & drop your resume</p>
              <p className="text-slate-400 text-sm">or click to browse</p>
              <p className="text-slate-500 text-xs mt-2">PDF, DOCX, TXT · Max 5 MB</p>
            </>
          )}
        </div>

        <Button onClick={handleUpload} disabled={!file} loading={uploading} className="w-full">
          {uploading ? 'Parsing resume…' : 'Upload & Parse'}
        </Button>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // PHASE 2 — Preview + Edit
  // ════════════════════════════════════════════════════════════════════════════
  const info = parsed.personal_information ?? {};
  const skills = parsed.skills ?? {};
  const allTechSkills = [
    ...(skills.technical_skills ?? []),
    ...(skills.frameworks ?? []),
    ...(skills.databases ?? []),
    ...(skills.languages ?? []),
    ...(skills.tools_and_technologies ?? []),
  ].filter((v, i, a) => a.indexOf(v) === i);

  return (
    <div className="w-full space-y-5">

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FileText size={16} className="text-emerald-400" />
            <span className="text-emerald-400 text-sm font-medium">Parsed: {file?.name}</span>
            {dirty && <span className="text-xs text-amber-400 bg-amber-900/30 border border-amber-700/50 px-2 py-0.5 rounded-full">Unsaved edits</span>}
          </div>
          <h2 className="text-2xl font-bold text-white">Review & Edit Parsed Data</h2>
          <p className="text-slate-400 text-sm mt-0.5">Correct anything that looks wrong before continuing.</p>
        </div>
        <button
          onClick={() => { setParsed(null); setFile(null); setDirty(false); }}
          className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-700 transition-colors"
        >
          <RefreshCw size={14} /> Re-upload
        </button>
      </div>

      {error && <Alert type="error" message={error} />}

      {/* Personal Info */}
      <Section icon={User} title="Personal Information" color="indigo">
        <div className="grid sm:grid-cols-2 gap-3">
          <EditField label="Full Name" value={info.full_name} onChange={v => update('personal_information.full_name', v)} />
          <EditField label="Email" value={info.email} onChange={v => update('personal_information.email', v)} />
          <EditField label="Phone" value={info.phone} onChange={v => update('personal_information.phone', v)} />
          <EditField label="Location" value={typeof info.location === 'string' ? info.location : ''} onChange={v => update('personal_information.location', v)} />
          <EditField label="LinkedIn" value={info.linkedin} onChange={v => update('personal_information.linkedin', v)} />
          <EditField label="GitHub" value={info.github} onChange={v => update('personal_information.github', v)} />
        </div>
      </Section>

      {/* Summary */}
      {(parsed.professional_summary !== undefined) && (
        <Section icon={Briefcase} title="Professional Summary" color="blue">
          <textarea
            value={parsed.professional_summary || ''}
            onChange={e => update('professional_summary', e.target.value)}
            rows={3}
            placeholder="Add a brief professional summary…"
            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 resize-none"
          />
        </Section>
      )}

      {/* Skills */}
      <Section icon={Wrench} title="Technical Skills" color="violet">
        <div className="space-y-3">
          <div>
            <p className="text-xs text-slate-400 mb-1.5">All Skills (type + Enter to add)</p>
            <TagEditor
              tags={allTechSkills}
              onChange={(newTags) => {
                setDirty(true);
                setParsed(prev => ({
                  ...prev,
                  skills: { ...prev.skills, technical_skills: newTags, frameworks: [], databases: [], languages: [], tools_and_technologies: [] }
                }));
              }}
              placeholder="Add skill and press Enter…"
            />
          </div>
          {(skills.soft_skills?.length > 0 || true) && (
            <div>
              <p className="text-xs text-slate-400 mb-1.5">Soft Skills</p>
              <TagEditor
                tags={skills.soft_skills ?? []}
                onChange={v => update('skills.soft_skills', v)}
                placeholder="Add soft skill…"
              />
            </div>
          )}
        </div>
      </Section>

      {/* Work Experience */}
      <Section icon={Briefcase} title="Work Experience" color="emerald">
        <div className="space-y-2">
          {(parsed.work_experience ?? []).length === 0 && !addingExp && (
            <p className="text-slate-500 text-sm italic">No experience detected. Add one below.</p>
          )}
          {(parsed.work_experience ?? []).map((exp, i) => (
            <ExpCard
              key={i}
              exp={exp}
              onRemove={() => { setDirty(true); setParsed(p => ({ ...p, work_experience: p.work_experience.filter((_, j) => j !== i) })); }}
              onSave={(updated) => { setDirty(true); setParsed(p => { const arr = [...p.work_experience]; arr[i] = updated; return { ...p, work_experience: arr }; }); }}
            />
          ))}
          {addingExp
            ? <AddExpForm
                onAdd={(e) => { setDirty(true); setParsed(p => ({ ...p, work_experience: [...(p.work_experience ?? []), e] })); setAddingExp(false); }}
                onCancel={() => setAddingExp(false)}
              />
            : <button onClick={() => setAddingExp(true)} className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 mt-1">
                <Plus size={13} /> Add experience
              </button>
          }
        </div>
      </Section>

      {/* Education */}
      <Section icon={GraduationCap} title="Education" color="amber">
        <div className="space-y-2">
          {(parsed.education ?? []).length === 0 && !addingEdu && (
            <p className="text-slate-500 text-sm italic">No education detected. Add one below.</p>
          )}
          {(parsed.education ?? []).map((edu, i) => (
            <EduCard
              key={i}
              edu={edu}
              onRemove={() => { setDirty(true); setParsed(p => ({ ...p, education: p.education.filter((_, j) => j !== i) })); }}
              onSave={(updated) => { setDirty(true); setParsed(p => { const arr = [...p.education]; arr[i] = updated; return { ...p, education: arr }; }); }}
            />
          ))}
          {addingEdu
            ? <AddEduForm
                onAdd={(e) => { setDirty(true); setParsed(p => ({ ...p, education: [...(p.education ?? []), e] })); setAddingEdu(false); }}
                onCancel={() => setAddingEdu(false)}
              />
            : <button onClick={() => setAddingEdu(true)} className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 mt-1">
                <Plus size={13} /> Add education
              </button>
          }
        </div>
      </Section>

      {/* Certifications */}
      {(parsed.certifications !== undefined) && (
        <Section icon={Award} title="Certifications" color="rose">
          <TagEditor
            tags={(parsed.certifications ?? []).map(c => c.name || c)}
            onChange={v => { setDirty(true); setParsed(p => ({ ...p, certifications: v.map(name => ({ name })) })); }}
            placeholder="Add certification…"
          />
        </Section>
      )}

      {/* Bottom CTA */}
      <div className="flex gap-3 pt-2 pb-4">
        <button
          onClick={() => { setParsed(null); setFile(null); setDirty(false); }}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
        >
          <RefreshCw size={14} /> Re-upload
        </button>
        <Button onClick={handleConfirm} loading={saving} className="flex-1">
          {dirty ? 'Save & Continue →' : 'Looks Good — Continue'}
          {!saving && <ArrowRight size={16} />}
        </Button>
      </div>
    </div>
  );
}

