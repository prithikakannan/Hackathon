import React, { useState, useEffect } from 'react';
import { JobApplication, BulletModification } from './types';
import { ApplicationCard } from './components/ApplicationCard';
import { NewJobModal } from './components/NewJobModal';
import { ReviewModal } from './components/ReviewModal';
import { 
  Sparkles, Plus, Search, RefreshCw, Briefcase, CheckCircle2, Clock, 
  Database, SlidersHorizontal, Send, ArrowUpRight, AlertCircle, FileCheck, Layers, Menu, X, Filter
} from 'lucide-react';

const API_BASE_URL = '/api';

export default function App() {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [backendConnected, setBackendConnected] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'fit' | 'date'>('fit');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  
  // Quick Ingestion Input inside Sidebar
  const [quickUrl, setQuickUrl] = useState<string>('');
  const [quickLoading, setQuickLoading] = useState<boolean>(false);

  const [isNewJobModalOpen, setIsNewJobModalOpen] = useState<boolean>(false);
  const [selectedApplication, setSelectedApplication] = useState<JobApplication | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState<boolean>(false);

  // Fetch all applications from FastAPI backend
  const fetchApplications = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/applications`);
      if (res.ok) {
        const data = await res.json();
        setApplications(data);
        setBackendConnected(true);
      } else {
        setBackendConnected(false);
      }
    } catch (err) {
      console.error("Failed to connect to Austral AI backend:", err);
      setBackendConnected(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
    const interval = setInterval(fetchApplications, 3000);
    return () => clearInterval(interval);
  }, []);

  // Quick Ingestion Handler
  const handleQuickIngest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickUrl.trim()) return;
    setQuickLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/jobs/scout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_url: quickUrl })
      });
      if (res.ok) {
        setQuickUrl('');
        await fetchApplications();
      }
    } catch (err) {
      console.error("Quick ingest error:", err);
    } finally {
      setQuickLoading(false);
    }
  };

  const handleScoutJob = async (jobUrl: string, title?: string, company?: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/jobs/scout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_url: jobUrl, title, company })
      });
      if (res.ok) {
        await fetchApplications();
      }
    } catch (err) {
      console.error("Error launching scout agent:", err);
    }
  };

  const handleApproveApplication = async (
    appId: string,
    editedLetter?: string,
    editedBullets?: BulletModification[]
  ) => {
    try {
      const res = await fetch(`${API_BASE_URL}/applications/${appId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          approved: true,
          edited_cover_letter: editedLetter,
          edited_bullets: editedBullets
        })
      });
      if (res.ok) {
        await fetchApplications();
        const updated = await (await fetch(`${API_BASE_URL}/applications/${appId}`)).json();
        setSelectedApplication(updated);
      }
    } catch (err) {
      console.error("Error approving application:", err);
    }
  };

  const handleRejectApplication = async (appId: string, feedback?: string) => {
    try {
      await fetch(`${API_BASE_URL}/applications/${appId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved: false, feedback })
      });
      await fetchApplications();
    } catch (err) {
      console.error("Error rejecting application:", err);
    }
  };

  const handleExecuteApplication = async (appId: string) => {
    try {
      await fetch(`${API_BASE_URL}/applications/${appId}/execute`, {
        method: 'POST'
      });
      await fetchApplications();
    } catch (err) {
      console.error("Error triggering Playwright execution:", err);
    }
  };

  // Metrics
  const totalScouted = applications.length;
  const highMatches = applications.filter(a => (a.fit_score || 0) >= 80).length;
  const pendingReview = applications.filter(a => a.status === 'pending_approval' || a.status === 'tailored' || a.status === 'evaluated').length;
  const appliedCount = applications.filter(a => a.status === 'applied').length;
  const approvedCount = applications.filter(a => a.status === 'approved').length;
  const failedCount = applications.filter(a => a.status === 'failed').length;

  // Filtered & Sorted List
  const filteredApplications = applications
    .filter(app => {
      const matchesSearch = app.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            app.job_title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || 
                            (statusFilter === 'pending' && (app.status === 'pending_approval' || app.status === 'tailored' || app.status === 'evaluated')) ||
                            app.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'fit') {
        return (b.fit_score || 0) - (a.fit_score || 0);
      } else {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white relative">
      
      {/* Global Command Bar Header */}
      <header className="glass-header sticky top-0 z-40 px-4 md:px-6 h-16 flex items-center justify-between gap-4">
        
        {/* Left Brand Identity */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white lg:hidden"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="h-9.5 w-9.5 rounded-xl bg-gradient-to-tr from-indigo-600 via-sky-400 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 border border-white/10 shrink-0">
            <Sparkles className="w-5 h-5 text-white" />
          </div>

          <div className="flex items-center gap-2.5">
            <h1 className="text-lg font-black tracking-tight text-slate-100 font-display">Austral AI</h1>
            <span className="hidden sm:inline-flex px-2.5 py-0.5 text-[10px] font-black rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase tracking-wider">
              v2.4 Agentic
            </span>
          </div>
        </div>

        {/* Global Search Bar */}
        <div className="hidden md:flex items-center relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5" />
          <input
            type="text"
            placeholder="Search jobs by title, company, or tech stack..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-9 py-2 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all shadow-inner"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3 text-slate-500 hover:text-slate-300 text-xs"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Right Action Controls */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Connection Status */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-xs">
            {backendConnected ? (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-emerald-400 font-bold text-[11px]">API Active</span>
              </>
            ) : (
              <>
                <span className="h-2 w-2 rounded-full bg-rose-500"></span>
                <span className="text-rose-400 font-bold text-[11px]">API Offline</span>
              </>
            )}
          </div>

          <button
            onClick={() => fetchApplications()}
            className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors"
            title="Refresh agent state"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
          </button>

          <button
            onClick={() => setIsNewJobModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 via-sky-500 to-indigo-600 hover:from-indigo-400 hover:to-sky-400 text-white text-xs font-black shadow-lg shadow-indigo-500/20 transition-all hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Scout Job</span>
          </button>
        </div>
      </header>

      {/* Main Container Layout */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Sidebar Desktop Navigation */}
        <aside className="w-72 glass-sidebar shrink-0 p-5 hidden lg:flex flex-col justify-between space-y-6 overflow-y-auto">
          <div className="space-y-6">
            
            {/* Embedded Quick Ingestion Box */}
            <div className="bg-slate-900/90 rounded-2xl p-4 border border-slate-800 space-y-3 shadow-xl">
              <span className="text-xs font-black text-slate-100 flex items-center gap-2 font-display">
                <Send className="w-3.5 h-3.5 text-sky-400" /> Quick Ingest Scout
              </span>
              <form onSubmit={handleQuickIngest} className="space-y-2.5">
                <input
                  type="url"
                  required
                  placeholder="Paste job posting URL..."
                  value={quickUrl}
                  onChange={(e) => setQuickUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="submit"
                  disabled={quickLoading || !quickUrl.trim()}
                  className="w-full py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white text-xs font-black transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-md shadow-indigo-500/20"
                >
                  {quickLoading ? 'Scouting...' : 'Launch Agents'} <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>

            {/* Application Pipeline Navigation Categories */}
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 px-3 block mb-2 font-display">
                Pipeline Lifecycle
              </span>
              
              <button
                onClick={() => setStatusFilter('all')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  statusFilter === 'all'
                    ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/30 glow-indigo'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Layers className="w-4 h-4 text-indigo-400" /> All Positions
                </span>
                <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-md bg-slate-800 text-slate-300 border border-slate-700">{totalScouted}</span>
              </button>

              <button
                onClick={() => setStatusFilter('pending')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  statusFilter === 'pending'
                    ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 glow-amber'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Clock className="w-4 h-4 text-amber-400" /> Pending Review
                </span>
                <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">{pendingReview}</span>
              </button>

              <button
                onClick={() => setStatusFilter('approved')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  statusFilter === 'approved'
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 glow-emerald'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <FileCheck className="w-4 h-4 text-emerald-400" /> Approved & Ready
                </span>
                <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {approvedCount}
                </span>
              </button>

              <button
                onClick={() => setStatusFilter('applied')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  statusFilter === 'applied'
                    ? 'bg-purple-500/15 text-purple-400 border border-purple-500/30 glow-purple'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-purple-400" /> Submitted
                </span>
                <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30">{appliedCount}</span>
              </button>

              {failedCount > 0 && (
                <button
                  onClick={() => setStatusFilter('failed')}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    statusFilter === 'failed'
                      ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30 glow-rose'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <AlertCircle className="w-4 h-4 text-rose-400" /> Failures
                  </span>
                  <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/30">{failedCount}</span>
                </button>
              )}
            </div>
          </div>

          {/* Supabase & Playwright Architecture Box */}
          <div className="bg-slate-900/90 rounded-2xl p-4 border border-slate-800 text-xs space-y-2">
            <div className="flex items-center justify-between text-emerald-400 font-extrabold text-[11px] uppercase tracking-wider">
              <span className="flex items-center gap-1.5"><Database className="w-3.5 h-3.5" /> Supabase RAG</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
              Master resume vector chunks indexed with cosine similarity RPC matching.
            </p>
          </div>
        </aside>

        {/* Mobile Sidebar Navigation Drawer Overlay */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-30 bg-slate-950/80 backdrop-blur-md lg:hidden flex">
            <div className="w-80 bg-slate-900 p-6 flex flex-col justify-between border-r border-slate-800 animate-slideUp">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-black text-slate-100">Navigation</h2>
                  <button onClick={() => setMobileMenuOpen(false)} className="p-1 text-slate-400 hover:text-white">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-2">
                  <button
                    onClick={() => { setStatusFilter('all'); setMobileMenuOpen(false); }}
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-800/80 text-xs font-bold text-slate-200"
                  >
                    <span>All Applications</span>
                    <span className="px-2 py-0.5 text-[10px] rounded bg-slate-700">{totalScouted}</span>
                  </button>
                  <button
                    onClick={() => { setStatusFilter('pending'); setMobileMenuOpen(false); }}
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-amber-500/10 text-xs font-bold text-amber-400"
                  >
                    <span>Pending Review</span>
                    <span className="px-2 py-0.5 text-[10px] rounded bg-amber-500/20">{pendingReview}</span>
                  </button>
                  <button
                    onClick={() => { setStatusFilter('approved'); setMobileMenuOpen(false); }}
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-emerald-500/10 text-xs font-bold text-emerald-400"
                  >
                    <span>Approved & Ready</span>
                    <span className="px-2 py-0.5 text-[10px] rounded bg-emerald-500/20">{approvedCount}</span>
                  </button>
                  <button
                    onClick={() => { setStatusFilter('applied'); setMobileMenuOpen(false); }}
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-purple-500/10 text-xs font-bold text-purple-400"
                  >
                    <span>Submitted</span>
                    <span className="px-2 py-0.5 text-[10px] rounded bg-purple-500/20">{appliedCount}</span>
                  </button>
                </div>
              </div>
            </div>
            <div className="flex-1" onClick={() => setMobileMenuOpen(false)} />
          </div>
        )}

        {/* Main Dashboard Workspace */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8">
          
          {/* Top Metric Cards Summary Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
            
            <div className="glass-card p-5 rounded-2xl border border-slate-800/90 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1 font-display">Total Scouted</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-slate-100 font-display">{totalScouted}</span>
                  <span className="text-[11px] font-bold text-slate-400">Positions</span>
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 glow-indigo">
                <Briefcase className="w-6 h-6" />
              </div>
            </div>

            <div className="glass-card p-5 rounded-2xl border border-slate-800/90 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1 font-display">Strong Match (&gt;80%)</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-emerald-400 font-display">{highMatches}</span>
                  <span className="text-[11px] font-bold text-emerald-400/80">High Fit</span>
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 glow-emerald">
                <Sparkles className="w-6 h-6" />
              </div>
            </div>

            <div className="glass-card p-5 rounded-2xl border border-slate-800/90 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1 font-display">Pending HITL Review</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-amber-400 font-display">{pendingReview}</span>
                  <span className="text-[11px] font-bold text-amber-400/80">Action Req.</span>
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 glow-amber">
                <Clock className="w-6 h-6" />
              </div>
            </div>

            <div className="glass-card p-5 rounded-2xl border border-slate-800/90 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1 font-display">Submitted Applications</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-purple-400 font-display">{appliedCount}</span>
                  <span className="text-[11px] font-bold text-purple-400/80">Playwright Live</span>
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/20 glow-purple">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            </div>

          </div>

          {/* Interactive Pipeline Horizontal Funnel Chips Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-bold no-scrollbar">
            <span className="text-slate-500 text-[11px] uppercase tracking-wider font-black mr-2 flex items-center gap-1 shrink-0 font-display">
              <Filter className="w-3.5 h-3.5" /> Stage Filter:
            </span>

            {[
              { id: 'all', label: 'All Jobs', count: totalScouted, color: 'indigo' },
              { id: 'pending', label: 'Pending Review', count: pendingReview, color: 'amber' },
              { id: 'approved', label: 'Approved & Ready', count: approvedCount, color: 'emerald' },
              { id: 'applied', label: 'Submitted', count: appliedCount, color: 'purple' },
              ...(failedCount > 0 ? [{ id: 'failed', label: 'Failures', count: failedCount, color: 'rose' }] : [])
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3.5 py-1.5 rounded-full border transition-all flex items-center gap-2 whitespace-nowrap shrink-0 ${
                  statusFilter === tab.id
                    ? 'bg-slate-800 text-white border-indigo-500/60 shadow-md shadow-indigo-500/10 font-extrabold'
                    : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                <span>{tab.label}</span>
                <span className="px-2 py-0.2 text-[10px] rounded-full bg-slate-950 text-slate-300 font-mono">{tab.count}</span>
              </button>
            ))}
          </div>

          {/* Header Controls & Sorting Toolbar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-black text-slate-100 font-display">Job Pipeline</h2>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-900 text-xs text-slate-400 font-semibold border border-slate-800">
                {filteredApplications.length} positions
              </span>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <span className="text-xs text-slate-400 font-semibold flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" /> Sort By:
              </span>
              <button
                onClick={() => setSortBy(sortBy === 'fit' ? 'date' : 'fit')}
                className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-slate-200 hover:text-white transition-colors hover:border-slate-700"
              >
                {sortBy === 'fit' ? '🔥 Highest Match Score' : '⏱️ Newest First'}
              </button>
            </div>
          </div>

          {/* Grid Layout of Job Applications */}
          {loading && applications.length === 0 ? (
            <div className="py-24 text-center space-y-4">
              <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin mx-auto" />
              <p className="text-sm font-semibold text-slate-400">Loading agent workflow pipeline...</p>
            </div>
          ) : filteredApplications.length === 0 ? (
            <div className="glass-panel rounded-3xl p-12 text-center max-w-md mx-auto space-y-5 border border-slate-800/80">
              <div className="p-4 rounded-2xl bg-indigo-500/10 text-indigo-400 w-16 h-16 mx-auto flex items-center justify-center border border-indigo-500/20 glow-indigo">
                <Briefcase className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-100 mb-2 font-display">No Positions Match Criteria</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Use <strong className="text-indigo-400">Quick Scout Ingest</strong> or click <strong className="text-indigo-400">"Scout Job"</strong> to parse a new URL.
                </p>
              </div>
              <button
                onClick={() => setIsNewJobModalOpen(true)}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black shadow-lg shadow-indigo-600/20 transition-all hover:scale-[1.02]"
              >
                <Plus className="w-4 h-4" /> Scout Job Posting
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-fadeIn">
              {filteredApplications.map((app) => (
                <ApplicationCard
                  key={app.id}
                  application={app}
                  onSelect={(selected) => {
                    setSelectedApplication(selected);
                    setIsReviewModalOpen(true);
                  }}
                  onQuickExecute={(selected) => handleExecuteApplication(selected.id)}
                />
              ))}
            </div>
          )}

        </main>
      </div>

      {/* Modals */}
      <NewJobModal
        isOpen={isNewJobModalOpen}
        onClose={() => setIsNewJobModalOpen(false)}
        onSubmit={handleScoutJob}
      />

      <ReviewModal
        application={selectedApplication}
        isOpen={isReviewModalOpen}
        onClose={() => {
          setIsReviewModalOpen(false);
          setSelectedApplication(null);
        }}
        onApprove={handleApproveApplication}
        onReject={handleRejectApplication}
        onExecute={handleExecuteApplication}
      />

    </div>
  );
}

