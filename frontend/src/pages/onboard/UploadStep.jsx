import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, FileText, X, CheckCircle } from 'lucide-react';
import { resumeService } from '../../services/resumeService';
import { useOnboardStore } from '../../store/onboardStore';
import { Button, Alert, Spinner } from '../../components/ui';

export default function UploadStep() {
  const navigate = useNavigate();
  const setResume = useOnboardStore((s) => s.setResume);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const onDrop = useCallback((accepted) => {
    if (accepted.length > 0) {
      setFile(accepted[0]);
      setError('');
    }
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
    onDropRejected: () => setError('File must be PDF, DOCX, or TXT and under 5MB.'),
  });

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('resume', file);
      const response = await resumeService.upload(formData);
      const resume = response.data;
      setResume(resume._id, resume.parsedData);
      setDone(true);
      setTimeout(() => navigate('/onboard/job'), 800);
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto">
      <h2 className="text-2xl font-bold text-white mb-2">Upload Your Resume</h2>
      <p className="text-slate-400 mb-6">Our AI will extract your skills and experience automatically.</p>

      {error && <Alert type="error" message={error} />}

      {done ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4 text-emerald-400">
          <CheckCircle size={48} />
          <p className="font-semibold text-lg text-white">Resume parsed successfully!</p>
        </div>
      ) : (
        <>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors mb-4
              ${isDragActive ? 'border-indigo-500 bg-indigo-900/20' : 'border-slate-600 hover:border-indigo-600 bg-slate-800/50'}`}
          >
            <input {...getInputProps()} />
            <UploadCloud size={40} className="mx-auto mb-3 text-slate-400" />
            {file ? (
              <div className="flex items-center justify-center gap-2 text-white">
                <FileText size={16} className="text-indigo-400" />
                <span className="font-medium">{file.name}</span>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setFile(null); }}
                  className="text-slate-400 hover:text-white"
                >
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

          <Button
            onClick={handleUpload}
            disabled={!file}
            loading={uploading}
            className="w-full"
          >
            {uploading ? 'Parsing resume…' : 'Upload & Parse'}
          </Button>
        </>
      )}
    </div>
  );
}
