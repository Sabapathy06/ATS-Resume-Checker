import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UploadCloud, FileCheck2, X, Loader2, Sparkles, Target, ClipboardPaste,
  AlertCircle, FileSearch, ChevronDown, ChevronUp, Info, ArrowRight, History,
} from 'lucide-react';
import { extractTextFromFile, validateFile, type ExtractionResult } from '../lib/extract';
import { api } from '../lib/api';
import { ROLE_OPTIONS } from '../lib/roles';
import LoadingStages from '../components/LoadingStages';

export default function Analyzer() {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [extraction, setExtraction] = useState<ExtractionResult | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [mode, setMode] = useState<'upload' | 'paste'>('upload');

  const [manualText, setManualText] = useState('');
  const [targetRole, setTargetRole] = useState('software_engineer');
  const [jobDescription, setJobDescription] = useState('');

  useEffect(() => {
    api.getProfile().then((p) => {
      if (p?.target_role && p.target_role !== 'generic') {
        setTargetRole(p.target_role);
      }
    }).catch(() => {});
  }, []);

  const [analyzing, setAnalyzing] = useState(false);
  const [stage, setStage] = useState(0);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const resumeText = useMemo(
    () => (mode === 'upload' ? extraction?.text ?? '' : manualText),
    [mode, extraction, manualText]
  );
  const words = resumeText.trim() ? resumeText.trim().split(/\s+/).length : 0;

  const handleFile = useCallback(async (f: File) => {
    setExtractError(null);
    setExtraction(null);
    setFile(f);
    const problem = validateFile(f);
    if (problem) {
      setExtractError(problem);
      setFile(null);
      return;
    }
    setExtracting(true);
    try {
      const result = await extractTextFromFile(f);
      setExtraction(result);
      setMode('upload');
    } catch (err) {
      setExtractError(err instanceof Error ? err.message : 'Could not read this file.');
      setFile(null);
    } finally {
      setExtracting(false);
    }
  }, []);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  };

  const clearFile = () => {
    setFile(null);
    setExtraction(null);
    setExtractError(null);
    setShowPreview(false);
    if (inputRef.current) inputRef.current.value = '';
  };

  const startAnalysis = async () => {
    setAnalysisError(null);

    if (resumeText.trim().length < 40) {
      setAnalysisError(
        mode === 'upload'
          ? 'Upload a resume with readable text first (or switch to "Paste text").'
          : 'Please paste at least a few lines of your resume text.'
      );
      return;
    }
    if (words < 30) {
      setAnalysisError(`That is only ${words} words - a real resume has 200+. Add more content for an accurate score.`);
      return;
    }
    if (jobDescription.trim() && jobDescription.trim().length < 60) {
      setAnalysisError('The job description looks too short to compare against. Paste the full posting, or clear the field.');
      return;
    }

    setAnalyzing(true);
    setStage(0);

    const timers: number[] = [];
    for (let i = 1; i < 5; i++) timers.push(window.setTimeout(() => setStage(i), 620 * i));

    try {
      const res = await api.analyze({
        resumeText: resumeText.trim(),
        jobDescription: jobDescription.trim() || '',
        targetRole,
        fileName: mode === 'upload' && file ? file.name : 'pasted-resume.txt',
        fileType: mode === 'upload' && file ? file.name.split('.').pop()?.toLowerCase() ?? '' : 'txt',
      });
      setStage(4);
      timers.push(window.setTimeout(() => navigate(`/report/${res.id}`), 700));
    } catch (err) {
      timers.forEach(clearTimeout);
      setAnalyzing(false);
      setAnalysisError(err instanceof Error ? err.message : 'Analysis failed. Please try again.');
    }
  };

  const jdWords = jobDescription.trim() ? jobDescription.trim().split(/\s+/).length : 0;

  return (
    <div className="relative min-h-screen bg-ink-950 pb-20 pt-28">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] grid-bg" />
      <div className="pointer-events-none absolute -top-24 left-1/2 h-[380px] w-[720px] -translate-x-1/2 rounded-full bg-iris-600/15 blur-[120px]" />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="chip border-iris-400/25 bg-iris-500/10 text-iris-200">
              <Sparkles className="h-3 w-3" /> Resume Analyzer
            </span>
            <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Analyze your resume
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-400 sm:text-base">
              Upload a PDF or DOCX (text is extracted in your browser), or paste the text. Add the job
              description to unlock exact role matching.
            </p>
          </div>
          <Link to="/dashboard" className="btn-ghost !py-2 !text-sm">
            <History className="h-4 w-4" />
            Analysis history
          </Link>
        </div>

        <AnimatePresence mode="wait">
          {analyzing ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mx-auto mt-10 max-w-2xl">
              <LoadingStages current={stage} error={analysisError} />
              {analysisError && (
                <button onClick={() => setAnalyzing(false)} className="btn-ghost mt-5 w-full">
                  Back to the analyzer
                </button>
              )}
            </motion.div>
          ) : (
            <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-8 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
              <div className="glass-strong rounded-3xl p-6 sm:p-7">
                <div className="mb-5 flex items-center gap-1 rounded-xl border border-white/10 bg-white/[0.02] p-1">
                  <button onClick={() => setMode('upload')} className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${mode === 'upload' ? 'bg-iris-500/20 text-white' : 'text-slate-400 hover:text-white'}`}>
                    <UploadCloud className="h-4 w-4" />
                    Upload file
                  </button>
                  <button onClick={() => setMode('paste')} className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${mode === 'paste' ? 'bg-iris-500/20 text-white' : 'text-slate-400 hover:text-white'}`}>
                    <ClipboardPaste className="h-4 w-4" />
                    Paste text
                  </button>
                </div>

                {mode === 'upload' ? (
                  <div>
                    <div
                      onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                      onDragLeave={() => setDragActive(false)}
                      onDrop={onDrop}
                      onClick={() => inputRef.current?.click()}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
                      className={`group relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-12 text-center transition-all ${dragActive ? 'border-iris-400 bg-iris-500/10' : 'border-white/10 bg-white/[0.02] hover:border-iris-400/50 hover:bg-iris-500/[0.05]'}`}
                    >
                      <input ref={inputRef} type="file" accept=".pdf,.docx,.txt" className="hidden"
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
                      <motion.div animate={dragActive ? { scale: 1.08, y: -6 } : { scale: 1, y: 0 }}
                        className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-electric-500/20 to-iris-600/25 text-iris-300 ring-1 ring-inset ring-white/10">
                        {extracting ? <Loader2 className="h-7 w-7 animate-spin" /> : <UploadCloud className="h-7 w-7" />}
                      </motion.div>
                      <p className="mt-5 font-display text-base font-semibold text-white">
                        {extracting ? 'Extracting text…' : 'Drag & drop your resume'}
                      </p>
                      <p className="mt-1.5 text-sm text-slate-500">
                        or <span className="text-iris-300">browse files</span> — PDF, DOCX or TXT, up to 8 MB
                      </p>
                    </div>

                    {(extractError || file) && (
                      <div className="mt-5 space-y-3">
                        {extractError && (
                          <div className="flex items-start gap-2.5 rounded-xl border border-rose-400/30 bg-rose-500/10 p-3.5 text-[13px] text-rose-200">
                            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                            <div><p className="font-medium">Extraction failed</p><p className="mt-0.5 text-rose-200/80">{extractError}</p></div>
                          </div>
                        )}

                        {file && (
                          <div className="glass rounded-2xl p-4">
                            <div className="flex items-center gap-3">
                              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-electric-500/25 to-iris-600/25 text-iris-300">
                                {extraction ? <FileCheck2 className="h-5 w-5" /> : <Loader2 className="h-5 w-5 animate-spin" />}
                              </span>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-semibold text-white">{file.name}</p>
                                <p className="mt-0.5 text-xs text-slate-500">
                                  {(file.size / 1024).toFixed(0)} KB · {file.name.split('.').pop()?.toUpperCase()}
                                  {extraction ? ` · ${extraction.pages} page(s) · ${extraction.characters.toLocaleString()} chars extracted` : ' · reading…'}
                                </p>
                              </div>
                              {extraction && (
                                <button onClick={() => setShowPreview((s) => !s)} className="flex items-center gap-1 rounded-lg border border-white/10 px-2.5 py-1.5 text-xs text-slate-400 transition-colors hover:border-iris-400/40 hover:text-iris-200">
                                  Preview{showPreview ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                                </button>
                              )}
                              <button onClick={clearFile} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-white/5 hover:text-rose-300" aria-label="Remove file">
                                <X className="h-4 w-4" />
                              </button>
                            </div>

                            {extraction && (
                              <div className="mt-3 grid grid-cols-3 gap-2 border-t border-white/5 pt-3 text-center">
                                <div>
                                  <p className="font-display text-lg font-bold text-white">{extraction.text.trim().split(/\s+/).length.toLocaleString()}</p>
                                  <p className="text-[10px] uppercase tracking-wider text-slate-600">words</p>
                                </div>
                                <div>
                                  <p className="font-display text-lg font-bold text-white">{extraction.pages}</p>
                                  <p className="text-[10px] uppercase tracking-wider text-slate-600">pages</p>
                                </div>
                                <div>
                                  <p className="font-display text-lg font-bold text-emerald-300">{extraction.characters > 120 ? 'Ready' : 'Low'}</p>
                                  <p className="text-[10px] uppercase tracking-wider text-slate-600">status</p>
                                </div>
                              </div>
                            )}

                            {showPreview && extraction && (
                              <pre className="mt-3 max-h-56 overflow-auto whitespace-pre-wrap rounded-xl border border-white/5 bg-ink-950/80 p-3 font-mono text-[11px] leading-relaxed text-slate-400">
                                {extraction.text.slice(0, 1600)}
                                {extraction.text.length > 1600 ? '\n\n… preview truncated' : ''}
                              </pre>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <label htmlFor="resume-text" className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-400">Resume text</label>
                    <textarea id="resume-text" value={manualText} onChange={(e) => setManualText(e.target.value)} rows={14}
                      placeholder="Paste the full text of your resume here, including your contact block, summary, skills, experience bullets, education and projects."
                      className="field resize-y font-mono !text-[12.5px] leading-relaxed" />
                    <div className="mt-2.5 flex items-center justify-between text-xs">
                      <span className="text-slate-600">{words.toLocaleString()} words · {manualText.length.toLocaleString()} characters</span>
                      {manualText && <button onClick={() => setManualText('')} className="text-slate-500 hover:text-rose-300">Clear</button>}
                    </div>
                    <div className="mt-4 flex items-start gap-2 rounded-xl border border-white/5 bg-white/[0.02] p-3 text-xs text-slate-500">
                      <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-iris-300" />
                      Pasting text gives identical scoring accuracy to a file upload — the engine analyses raw text either way.
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-6">
                <div className="glass-strong rounded-3xl p-6 sm:p-7">
                  <div className="flex items-center gap-2.5">
                    <Target className="h-5 w-5 text-iris-300" />
                    <h2 className="font-display text-lg font-semibold text-white">Target job</h2>
                  </div>

                  <div className="mt-5">
                    <label htmlFor="role" className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-400">Role you are applying for</label>
                    <select id="role" value={targetRole} onChange={(e) => setTargetRole(e.target.value)} className="field cursor-pointer">
                      {ROLE_OPTIONS.map((r) => (<option key={r.value} value={r.value} className="bg-ink-850">{r.label}</option>))}
                    </select>
                    <p className="mt-1.5 text-xs text-slate-600">The role decides which skills, keywords and section expectations are scored against.</p>
                  </div>

                  <div className="mt-5">
                    <div className="mb-1.5 flex items-baseline justify-between">
                      <label htmlFor="jd" className="text-xs font-medium uppercase tracking-wider text-slate-400">
                        Job description <span className="text-slate-600">(optional)</span>
                      </label>
                      {jdWords > 0 && <span className="text-[11px] text-slate-600">{jdWords} words</span>}
                    </div>
                    <textarea id="jd" value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} rows={8}
                      placeholder="Paste the full job posting to unlock exact keyword matching, required-skill detection and a compatibility score."
                      className="field resize-y !text-[12.5px] leading-relaxed" />
                    {jobDescription.trim() && jdWords < 40 && (
                      <p className="mt-1.5 text-xs text-amber-300/80">Add the complete posting for a reliable match score.</p>
                    )}
                  </div>
                </div>

                <div className="glass-strong rounded-3xl p-6 sm:p-7">
                  <h2 className="font-display text-lg font-semibold text-white">Ready to analyze</h2>
                  <div className="mt-4 space-y-2.5">
                    {[
                      { ok: resumeText.trim().length >= 40, label: resumeText.trim().length >= 40 ? `Resume loaded (${words.toLocaleString()} words)` : 'Resume text loaded' },
                      { ok: true, label: `Target role: ${ROLE_OPTIONS.find((r) => r.value === targetRole)?.label}` },
                      { ok: jobDescription.trim().length >= 60, label: jobDescription.trim().length >= 60 ? 'Job description attached' : 'Job description (optional, unlocks JD matching)' },
                    ].map((c) => (
                      <div key={c.label} className="flex items-center gap-2.5 text-[13px]">
                        <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${c.ok ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300' : 'border-white/15 bg-white/[0.03] text-slate-600'}`}>
                          <FileSearch className="h-3 w-3" />
                        </span>
                        <span className={c.ok ? 'text-slate-300' : 'text-slate-600'}>{c.label}</span>
                      </div>
                    ))}
                  </div>

                  {analysisError && (
                    <div className="mt-4 flex items-start gap-2 rounded-xl border border-rose-400/30 bg-rose-500/10 p-3 text-[13px] text-rose-200">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                      {analysisError}
                    </div>
                  )}

                  <button onClick={startAnalysis} disabled={analyzing} className="btn-primary mt-6 w-full !py-3.5 !text-base">
                    <Sparkles className="h-4 w-4" />
                    Analyze Resume
                    <ArrowRight className="h-4 w-4" />
                  </button>
                  <p className="mt-3 text-center text-[11px] text-slate-600">
                    Deterministic scoring — every point traces back to a rule applied to your text.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
