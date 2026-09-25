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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
      <div className="glass-modal rounded-3xl w-full max-w-lg p-7 shadow-2xl relative border border-slate-200 overflow-hidden bg-white">
        
        {/* Subtle Ambient Accent */}
        <div className="absolute -top-20 -right-20 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-700 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3.5 mb-6">
          <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-200 glow-indigo">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 font-display">Scout New Job Posting</h2>
            <p className="text-xs text-slate-500 mt-0.5">Scout agent parses description, evaluates RAG fit & drafts materials.</p>
          </div>
        </div>

        {/* Preset Sample URLs for Quick Testing */}
        <div className="mb-5 bg-slate-50 rounded-2xl p-3.5 border border-slate-200/80 space-y-2">
          <span className="text-[10px] font-extrabold text-indigo-600 uppercase tracking-wider block">
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
              className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-white hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200 hover:border-indigo-200 transition-all shadow-2xs"
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
              className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-white hover:bg-sky-50 text-slate-700 hover:text-sky-700 border border-slate-200 hover:border-sky-200 transition-all shadow-2xs"
            >
              🚀 Anthropic (Lever)
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <LinkIcon className="w-3.5 h-3.5 text-indigo-600" /> Target Job Posting URL *
              </label>
              <button
                type="button"
                onClick={handlePasteClipboard}
                className="text-[11px] text-indigo-600 hover:text-indigo-700 flex items-center gap-1 font-semibold"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Clipboard className="w-3 h-3" />}
                {copied ? 'Pasted!' : 'Paste Clipboard'}
              </button>
            </div>
            <input
              type="url"
              required
              placeholder="e.g. https://company.greenhouse.io/jobs/12345"
              value={jobUrl}
              onChange={(e) => setJobUrl(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 text-xs font-mono focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-indigo-600" /> Job Title (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. AI Systems Engineer"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 text-xs focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-indigo-600" /> Company (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Austral Tech"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 text-xs focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all"
              />
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-slate-600 hover:text-slate-900 text-xs font-bold hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !jobUrl.trim()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-sky-600 to-indigo-700 hover:from-indigo-500 hover:to-sky-500 text-white text-xs font-black shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50 hover:scale-[1.02]"
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
