import React, { useState } from 'react';
import { X, User, Mail, Phone, Linkedin, FileText, Database, Sparkles, Check, RefreshCw } from 'lucide-react';
import { CandidateProfile } from '../types';

interface CandidateProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CandidateProfileModal: React.FC<CandidateProfileModalProps> = ({ isOpen, onClose }) => {
  const [profile, setProfile] = useState<CandidateProfile>({
    full_name: 'Jane Doe',
    email: 'jane.doe@example.com',
    phone: '+1 (555) 019-2831',
    linkedin_url: 'https://linkedin.com/in/janedoe-ai',
    github_url: 'https://github.com/janedoe-ai',
    portfolio_url: 'https://janedoe.dev',
    location: 'San Francisco, CA (Remote)',
    master_resume_text: `Principal AI Systems & Full-Stack Engineer with 7+ years of experience architecting LLM agent workflows, RAG pipelines, and high-throughput microservices.

Core Technical Skills:
- Languages & Frameworks: Python (FastAPI, PyTorch, LangChain, LangGraph), TypeScript (React, Next.js, Vite), Node.js, SQL, C++
- Agentic Workflows & RAG: LangGraph, Supabase pgvector, OpenAI API, Gemini API, ChromaDB, Cosine Similarity RPCs, Zero-Hallucination Guardrails
- Web Automation & Scraping: Playwright (Async Python), Selenium, Puppeteer, BeautifulSoup4
- Cloud & Database Infrastructure: PostgreSQL, Supabase, Redis, Docker, Kubernetes, AWS (Lambda, ECS, S3)`
  });

  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSaveAndIndex = async () => {
    setSaving(true);
    try {
      // Divide master resume into RAG chunks
      const lines = profile.master_resume_text.split('\n\n');
      const chunks = lines.map((content, idx) => ({
        chunk_index: idx,
        category: idx === 0 ? 'summary' : idx === 1 ? 'skills' : 'experience',
        content: content.trim(),
        metadata: { source: 'master_resume.txt' }
      }));

      const res = await fetch('/api/resume/seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chunks, master_text: profile.master_resume_text })
      });

      if (res.ok) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 2500);
      }
    } catch (err) {
      console.error('Failed to index master resume:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
      <div className="glass-modal rounded-3xl w-full max-w-2xl h-[85vh] flex flex-col shadow-2xl relative border border-slate-200 overflow-hidden bg-white">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 font-display">Candidate Profile & RAG Index</h2>
              <p className="text-xs text-slate-500">Master resume facts & pgvector embeddings used for fit scoring</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700 rounded-full bg-slate-200/60 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-slate-50/30">
          
          {/* Personal Metadata */}
          <div className="grid grid-cols-2 gap-3.5 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1 flex items-center gap-1">
                <User className="w-3 h-3 text-indigo-600" /> Full Name
              </label>
              <input
                type="text"
                value={profile.full_name}
                onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                className="w-full px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1 flex items-center gap-1">
                <Mail className="w-3 h-3 text-indigo-600" /> Email
              </label>
              <input
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                className="w-full px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1 flex items-center gap-1">
                <Phone className="w-3 h-3 text-indigo-600" /> Phone
              </label>
              <input
                type="text"
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                className="w-full px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1 flex items-center gap-1">
                <Linkedin className="w-3 h-3 text-indigo-600" /> LinkedIn URL
              </label>
              <input
                type="text"
                value={profile.linkedin_url || ''}
                onChange={(e) => setProfile({ ...profile, linkedin_url: e.target.value })}
                className="w-full px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900"
              />
            </div>
          </div>

          {/* Master Resume Text & RAG Vector Indexer */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-indigo-600" /> Master Verifiable Resume (Source of Truth)
              </label>
              <span className="text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                <Database className="w-3 h-3 text-emerald-600" /> 1536-dim Vector Embeddings
              </span>
            </div>
            <textarea
              rows={10}
              value={profile.master_resume_text}
              onChange={(e) => setProfile({ ...profile, master_resume_text: e.target.value })}
              className="w-full p-4 rounded-2xl bg-white border border-slate-300 text-xs font-mono text-slate-900 focus:outline-none focus:border-indigo-500 leading-relaxed shadow-2xs"
            />
          </div>

        </div>

        {/* Action Bar */}
        <div className="p-5 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 text-xs font-bold">
            Close
          </button>

          <button
            onClick={handleSaveAndIndex}
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white text-xs font-black shadow-md shadow-indigo-500/20 transition-all disabled:opacity-50"
          >
            {saving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" /> Embedding Chunks...
              </>
            ) : savedSuccess ? (
              <>
                <Check className="w-4 h-4 text-white" /> Re-indexed in pgvector!
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" /> Save Profile & Re-index RAG Vectors
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
