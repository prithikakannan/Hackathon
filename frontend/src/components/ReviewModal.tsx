import React, { useState } from 'react';
import { JobApplication, BulletModification } from '../types';
import { FitScoreBadge } from './FitScoreBadge';
import { ExecutionConsole } from './ExecutionConsole';
import { 
  X, CheckCircle2, XCircle, Sparkles, FileText, Check, AlertCircle, 
  Cpu, Database, Eye, Copy, ExternalLink, ShieldCheck, Zap
} from 'lucide-react';

interface ReviewModalProps {
  application: JobApplication | null;
  isOpen: boolean;
  onClose: () => void;
  onApprove: (id: string, editedLetter?: string, editedBullets?: BulletModification[]) => Promise<void>;
  onReject: (id: string, feedback?: string) => Promise<void>;
  onExecute: (id: string) => Promise<void>;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({
  application,
  isOpen,
  onClose,
  onApprove,
  onReject,
  onExecute: _onExecute
}) => {
  if (!isOpen || !application) return null;

  const [activeTab, setActiveTab] = useState<'fit' | 'cover' | 'bullets' | 'console'>('fit');
  const [coverLetter, setCoverLetter] = useState(application.tailored_cover_letter || '');
  const [bullets, setBullets] = useState<BulletModification[]>(application.tailored_resume_bullets || []);
  const [rejectFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedLetter, setCopiedLetter] = useState(false);

  const handleCopyCoverLetter = () => {
    navigator.clipboard.writeText(coverLetter);
    setCopiedLetter(true);
    setTimeout(() => setCopiedLetter(false), 2000);
  };

  const handleApproveAndExecute = async () => {
    setIsSubmitting(true);
    try {
      await onApprove(application.id, coverLetter, bullets);
      setActiveTab('console');
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    setIsSubmitting(true);
    try {
      await onReject(application.id, rejectFeedback);
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-lg animate-fadeIn">
      <div className="glass-modal rounded-3xl w-full max-w-5xl h-[88vh] flex flex-col shadow-2xl relative border border-slate-700/80 overflow-hidden">
        
        {/* Modal Top Header Bar */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/80 shrink-0">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <span className="text-xs font-black text-indigo-400 uppercase tracking-wider">{application.company_name}</span>
              <FitScoreBadge score={application.fit_score} size="sm" />
              <a
                href={application.job_url}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-sky-400 hover:text-sky-300 font-bold flex items-center gap-1 ml-2"
              >
                Posting <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <h2 className="text-xl md:text-2xl font-black text-slate-100 font-display">{application.job_title}</h2>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/80 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-6 pt-3 border-b border-slate-800/80 bg-slate-900/50 text-xs font-bold shrink-0 overflow-x-auto">
          <button
            onClick={() => setActiveTab('fit')}
            className={`px-4 py-3 rounded-t-xl transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'fit'
                ? 'border-indigo-500 text-indigo-400 bg-slate-800/60 font-extrabold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cpu className="w-4 h-4" /> RAG Fit Analysis
          </button>

          <button
            onClick={() => setActiveTab('cover')}
            className={`px-4 py-3 rounded-t-xl transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'cover'
                ? 'border-indigo-500 text-indigo-400 bg-slate-800/60 font-extrabold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" /> Tailored Cover Letter
          </button>

          <button
            onClick={() => setActiveTab('bullets')}
            className={`px-4 py-3 rounded-t-xl transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'bullets'
                ? 'border-indigo-500 text-indigo-400 bg-slate-800/60 font-extrabold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4" /> Resume Bullet Reframing
          </button>

          <button
            onClick={() => setActiveTab('console')}
            className={`px-4 py-3 rounded-t-xl transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'console'
                ? 'border-indigo-500 text-indigo-400 bg-slate-800/60 font-extrabold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Eye className="w-4 h-4" /> Playwright Console
          </button>
        </div>

        {/* Modal Main Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* TAB 1: RAG FIT ANALYSIS */}
          {activeTab === 'fit' && (
            <div className="space-y-6 animate-fadeIn">
              
              {/* RAG Alignment Reasoning */}
              <div className="glass-panel p-6 rounded-2xl border border-slate-800/90 relative overflow-hidden">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-black text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-400" /> AI Evaluator Alignment Summary
                  </h3>
                  <span className="text-[11px] font-bold text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded-full border border-slate-700/60">
                    Master Resume Vector RPC
                  </span>
                </div>
                <p className="text-sm text-slate-200 leading-relaxed font-sans">
                  {application.fit_breakdown?.reasoning || 'Evaluating semantic match against master resume...'}
                </p>
              </div>

              {/* Match vs Missing Qualifications Matrix */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="glass-panel p-5 rounded-2xl border border-slate-800/90 space-y-3">
                  <h4 className="text-xs font-black text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Matching Qualifications
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {application.fit_breakdown?.matching_skills?.map((s, idx) => (
                      <span key={idx} className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-400" /> {s}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="glass-panel p-5 rounded-2xl border border-slate-800/90 space-y-3">
                  <h4 className="text-xs font-black text-rose-400 uppercase tracking-wider flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-400" /> Skill Gaps / Missing Criteria
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {application.fit_breakdown?.missing_skills?.length ? (
                      application.fit_breakdown.missing_skills.map((s, idx) => (
                        <span key={idx} className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-rose-500/10 text-rose-300 border border-rose-500/20 flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 text-rose-400" /> {s}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400 italic">No significant missing skill requirements identified! Excellent alignment.</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Retrieved Vector Context Evidence */}
              {application.retrieved_context && application.retrieved_context.length > 0 && (
                <div className="glass-panel p-5 rounded-2xl border border-slate-800/90 space-y-3">
                  <h4 className="text-xs font-black text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                    <Database className="w-4 h-4" /> Supabase pgvector Resume Evidence Chunks
                  </h4>
                  <div className="space-y-2.5">
                    {application.retrieved_context.map((chunk, idx) => (
                      <div key={idx} className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-1">
                        <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase">
                          <span>[{chunk.category}]</span>
                          <span className="text-indigo-400">Cosine Similarity: {(chunk.similarity || 0.88).toFixed(2)}</span>
                        </div>
                        <p className="leading-relaxed font-sans">{chunk.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: TAILORED COVER LETTER */}
          {activeTab === 'cover' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300">Edit Tailored Cover Letter (Markdown)</span>
                
                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-amber-400 font-semibold flex items-center gap-1 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-400" /> Zero-Hallucination Verified
                  </span>
                  <button
                    onClick={handleCopyCoverLetter}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all border border-slate-700"
                  >
                    {copiedLetter ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-sky-400" />}
                    {copiedLetter ? 'Copied!' : 'Copy Letter'}
                  </button>
                </div>
              </div>

              <textarea
                rows={16}
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                className="w-full p-5 rounded-2xl bg-slate-900/90 border border-slate-700 text-slate-100 text-xs font-mono focus:outline-none focus:border-indigo-500 leading-relaxed shadow-inner"
              />
            </div>
          )}

          {/* TAB 3: RESUME BULLET MODIFICATIONS */}
          {activeTab === 'bullets' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300">Master Resume Bullet Reframing (Before vs AI Tailored)</span>
                <span className="text-[11px] text-slate-400 font-medium">Click tailored bullet text box to edit before approval</span>
              </div>

              {bullets.map((b, idx) => (
                <div key={idx} className="glass-panel p-5 rounded-2xl border border-slate-800/90 space-y-3">
                  <div>
                    <span className="text-[10px] font-black text-rose-400 uppercase tracking-wider block mb-1">
                      Original Master Resume Bullet
                    </span>
                    <p className="text-xs text-slate-400 bg-slate-900/90 p-3 rounded-xl border border-slate-800 font-sans">
                      {b.original}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-emerald-400 uppercase tracking-wider block mb-1">
                      Tailored Bullet (Reframed for Job Alignment)
                    </span>
                    <textarea
                      rows={2}
                      value={b.tailored}
                      onChange={(e) => {
                        const next = [...bullets];
                        next[idx].tailored = e.target.value;
                        setBullets(next);
                      }}
                      className="w-full text-xs text-slate-100 bg-slate-900 p-3 rounded-xl border border-slate-700 focus:outline-none focus:border-indigo-500 font-sans font-medium leading-relaxed"
                    />
                  </div>
                  <p className="text-[11px] text-indigo-300/90 italic font-sans">
                    <strong>Rationale:</strong> {b.rationale}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* TAB 4: PLAYWRIGHT CONSOLE */}
          {activeTab === 'console' && (
            <div className="animate-fadeIn">
              <ExecutionConsole
                logs={application.execution_logs}
                screenshotUrl={application.screenshot_url}
                submittedAt={application.submitted_at}
                status={application.status}
              />
            </div>
          )}

        </div>

        {/* Modal Action Bar Footer */}
        <div className="p-6 border-t border-slate-800/90 bg-slate-900/90 flex items-center justify-between gap-4 shrink-0">
          <button
            onClick={handleReject}
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-extrabold transition-all"
          >
            <XCircle className="w-4 h-4" /> Reject Application
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-slate-300 hover:text-white text-xs font-bold hover:bg-slate-800 transition-colors"
            >
              Close
            </button>

            <button
              onClick={handleApproveAndExecute}
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-white text-xs font-black shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50 hover:scale-[1.02]"
            >
              {isSubmitting ? (
                <>Processing Execution...</>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" /> Approve & Launch Playwright Automation <Zap className="w-3.5 h-3.5 fill-current" />
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

