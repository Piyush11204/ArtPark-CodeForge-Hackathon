export function SkillBadge({ skill, variant = 'neutral' }) {
  const colors = {
    satisfied: 'bg-green-900/50 text-green-300 border border-green-700',
    missing:   'bg-red-900/50 text-red-300 border border-red-700',
    partial:   'bg-yellow-900/50 text-yellow-300 border border-yellow-700',
    neutral:   'bg-slate-700 text-slate-300',
    brand:     'bg-indigo-900/50 text-indigo-300 border border-indigo-700',
  };
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${colors[variant]}`}>
      {skill}
    </span>
  );
}

export function Spinner({ size = 'md' }) {
  const s = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' }[size];
  return (
    <div className={`${s} border-2 border-indigo-500 border-t-transparent rounded-full animate-spin`} />
  );
}

export function Card({ children, className = '' }) {
  return (
    <div className={`bg-slate-800 border border-slate-700 rounded-xl p-5 ${className}`}>
      {children}
    </div>
  );
}

export function Button({ children, variant = 'primary', className = '', loading = false, ...props }) {
  const variants = {
    primary: 'bg-indigo-600 hover:bg-indigo-500 text-white',
    secondary: 'bg-slate-700 hover:bg-slate-600 text-white',
    danger: 'bg-red-600 hover:bg-red-500 text-white',
    ghost: 'bg-transparent hover:bg-slate-700 text-slate-300',
  };
  return (
    <button
      className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && <Spinner size="sm" />}
      {children}
    </button>
  );
}

export function Input({ label, error, className = '', ...props }) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm font-medium text-slate-300">{label}</label>}
      <input
        className={`bg-slate-700 border ${error ? 'border-red-500' : 'border-slate-600'} rounded-lg px-3 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition-colors ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

export function Alert({ type = 'error', message }) {
  if (!message) return null;
  const styles = {
    error: 'bg-red-900/40 border-red-700 text-red-300',
    success: 'bg-green-900/40 border-green-700 text-green-300',
    info: 'bg-indigo-900/40 border-indigo-700 text-indigo-300',
    warning: 'bg-yellow-900/40 border-yellow-700 text-yellow-300',
  };
  return (
    <div className={`border rounded-lg px-4 py-3 text-sm ${styles[type]}`}>{message}</div>
  );
}

export function StepIndicator({ steps, current }) {
  return (
    <div className="flex items-center gap-2">
      {steps.map((label, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors
            ${i < current ? 'bg-indigo-600 border-indigo-600 text-white'
            : i === current ? 'border-indigo-400 text-indigo-400 bg-slate-800'
            : 'border-slate-600 text-slate-500 bg-slate-800'}`}>
            {i < current ? '✓' : i + 1}
          </div>
          <span className={`text-xs hidden sm:inline ${i === current ? 'text-indigo-400 font-semibold' : i < current ? 'text-slate-400' : 'text-slate-600'}`}>{label}</span>
          {i < steps.length - 1 && <div className={`w-6 h-0.5 ${i < current ? 'bg-indigo-600' : 'bg-slate-700'}`} />}
        </div>
      ))}
    </div>
  );
}
