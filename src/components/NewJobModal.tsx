import React, { useState } from 'react';
import { X, Sparkles, Link as LinkIcon, Building, Briefcase, Clipboard, Check, ArrowRight } from 'lucide-react';

interface NewJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (jobUrl: string, title?: string, company?: string) => Promise<void>;
}

export const NewJobModal: React.FC<NewJobModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [jobUrl, setJobUrl] = useState('');
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setJobUrl(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (e) {
      console.error('Clipboard access denied:', e);
    }
  };

  const handleApplyPreset = (presetUrl: string, presetTitle: string, presetCompany: string) => {
    setJobUrl(presetUrl);
    setTitle(presetTitle);
    setCompany(presetCompany);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobUrl.trim()) return;
    setLoading(true);
    try {
      await onSubmit(jobUrl, title || undefined, company || undefined);
      setJobUrl('');
      setTitle('');
      setCompany('');
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="glass-modal rounded-3xl w-full max-w-lg p-7 shadow-2xl relative border border-slate-700/80 overflow-hidden">
        
        {/* Subtle Ambient Glow */}
        <div className="absolute -top-20 -right-20 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/60 hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3.5 mb-6">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-sky-500/20 text-indigo-400 border border-indigo-500/30 glow-indigo">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-100 font-display">Scout New Job Posting</h2>
            <p className="text-xs text-slate-400 mt-0.5">Scout agent parses description, evaluates RAG fit & drafts materials.</p>
          </div>
        </div>

        {/* Preset Sample URLs for Quick Testing */}
        <div className="mb-5 bg-slate-900/60 rounded-2xl p-3.5 border border-slate-800 space-y-2">
          <span className="text-[10px] font-extrabold text-indigo-400 uppercase tracking-wider block">
            Quick Test Presets
          </span>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handleApplyPreset(
                'https://boards.greenhouse.io/stripe/jobs/4812394',
                'Senior Staff AI / Software Engineer',
                'Stripe'
              )}
              className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-slate-800 hover:bg-indigo-600/20 hover:border-indigo-500/40 text-slate-300 hover:text-indigo-300 border border-slate-700 transition-all"
            >
              ⚡ Stripe (Greenhouse)
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset(
                'https://jobs.lever.co/anthropic/8920141',
                'Full-Stack AI Platform Lead',
                'Anthropic'
              )}
              className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-slate-800 hover:bg-sky-600/20 hover:border-sky-500/40 text-slate-300 hover:text-sky-300 border border-slate-700 transition-all"
            >
              🚀 Anthropic (Lever)
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <LinkIcon className="w-3.5 h-3.5 text-sky-400" /> Target Job Posting URL *
              </label>
              <button
                type="button"
                onClick={handlePasteClipboard}
                className="text-[11px] text-sky-400 hover:text-sky-300 flex items-center gap-1 font-semibold"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Clipboard className="w-3 h-3" />}
                {copied ? 'Pasted!' : 'Paste Clipboard'}
              </button>
            </div>
            <input
              type="url"
              required
              placeholder="e.g. https://company.greenhouse.io/jobs/12345"
              value={jobUrl}
              onChange={(e) => setJobUrl(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-900/90 border border-slate-700 text-slate-100 placeholder-slate-500 text-xs font-mono focus:outline-none focus:border-indigo-500 transition-colors shadow-inner"
            />
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-indigo-400" /> Job Title (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. AI Systems Engineer"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-indigo-400" /> Company (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Austral Tech"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-slate-300 hover:text-white text-xs font-bold hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !jobUrl.trim()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 via-sky-500 to-indigo-600 hover:from-indigo-400 hover:to-sky-400 text-white text-xs font-black shadow-lg shadow-indigo-500/25 transition-all disabled:opacity-50 hover:scale-[1.02]"
            >
              {loading ? (
                <>Scouting Job Post...</>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" /> Run Agent Pipeline <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

