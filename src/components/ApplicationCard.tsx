import React from 'react';
import { JobApplication } from '../types';
import { FitScoreBadge } from './FitScoreBadge';
import { 
  Clock, Play, FileText, ArrowRight, MapPin, 
  CheckCircle2, Sparkles, AlertCircle, ShieldCheck, Cpu, ArrowUpRight
} from 'lucide-react';

interface ApplicationCardProps {
  application: JobApplication;
  onSelect: (app: JobApplication) => void;
  onQuickExecute?: (app: JobApplication) => void;
}

export const ApplicationCard: React.FC<ApplicationCardProps> = ({
  application,
  onSelect,
  onQuickExecute
}) => {

  // Helper to map status into pipeline stage index (1-5)
  const getPipelineStage = (status: string) => {
    switch (status) {
      case 'scouting': return 1;
      case 'evaluated': return 2;
      case 'tailored':
      case 'pending_approval': return 3;
      case 'approved': return 4;
      case 'applying':
      case 'applied': return 5;
      case 'failed':
      case 'rejected': return -1;
      default: return 1;
    }
  };

  const currentStage = getPipelineStage(application.status);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scouting':
        return <span className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center gap-1.5"><Cpu className="w-3 h-3 animate-spin" /> 1. Scouting Job</span>;
      case 'evaluated':
        return <span className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center gap-1.5"><Sparkles className="w-3 h-3" /> 2. RAG Evaluated</span>;
      case 'tailored':
      case 'pending_approval':
        return <span className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/30 glow-amber animate-pulse flex items-center gap-1.5"><Clock className="w-3 h-3" /> 3. Pending Review</span>;
      case 'approved':
        return <span className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 glow-emerald flex items-center gap-1.5"><ShieldCheck className="w-3 h-3" /> 4. Approved & Ready</span>;
      case 'applying':
        return <span className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/30 glow-purple animate-pulse flex items-center gap-1.5"><Play className="w-3 h-3 animate-spin" /> 5. Playwright Active</span>;
      case 'applied':
        return <span className="px-2.5 py-1 text-[11px] font-black rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/40 glow-emerald flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3 text-emerald-400" /> Submitted</span>;
      case 'rejected':
        return <span className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-slate-900 text-slate-400 border border-slate-800">Rejected</span>;
      case 'failed':
        return <span className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/30 glow-rose flex items-center gap-1.5"><AlertCircle className="w-3 h-3" /> Failed</span>;
      default:
        return <span className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-slate-900 text-slate-400">{status}</span>;
    }
  };

  // Generate background tint from company name
  const getAvatarGradient = (name: string) => {
    const charCode = (name || 'JO').charCodeAt(0);
    const gradients = [
      'from-indigo-600 to-sky-600',
      'from-emerald-600 to-teal-600',
      'from-purple-600 to-pink-600',
      'from-amber-600 to-orange-600',
      'from-blue-600 to-cyan-600'
    ];
    return gradients[charCode % gradients.length];
  };

  return (
    <div className="glass-card rounded-2xl p-5.5 flex flex-col justify-between h-full group relative border border-slate-800/90 transition-all duration-300">
      
      {/* Top Header Row */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-3.5">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`h-11 w-11 rounded-xl bg-gradient-to-br ${getAvatarGradient(application.company_name)} flex items-center justify-center text-white font-black text-sm shrink-0 shadow-md shadow-indigo-500/10 border border-white/10`}>
              {application.company_name ? application.company_name.substring(0, 2).toUpperCase() : 'JO'}
            </div>
            <div className="min-w-0">
              <span className="text-[11px] font-extrabold text-indigo-400 tracking-wider uppercase block truncate">
                {application.company_name}
              </span>
              <h3 className="text-base font-bold text-slate-100 group-hover:text-sky-300 transition-colors truncate font-display" title={application.job_title}>
                {application.job_title}
              </h3>
            </div>
          </div>
          <div className="shrink-0">
            <FitScoreBadge score={application.fit_score} size="md" />
          </div>
        </div>

        {/* Location & Metadata Row */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 mb-4 pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <span className="flex items-center gap-1 font-medium text-slate-300">
              <MapPin className="w-3.5 h-3.5 text-sky-400" />
              {application.location || 'Remote'}
            </span>
            <span className="text-slate-600">•</span>
            <span className="flex items-center gap-1 text-slate-400">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              {new Date(application.created_at).toLocaleDateString()}
            </span>
          </div>

          <a
            href={application.job_url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-[11px] text-sky-400 hover:text-sky-300 transition-colors font-bold px-2 py-0.5 rounded-md hover:bg-sky-500/10"
            onClick={(e) => e.stopPropagation()}
            title="Open job posting"
          >
            Posting <ArrowUpRight className="w-3 h-3" />
          </a>
        </div>

        {/* Agent Mini Pipeline Stepper */}
        <div className="mb-4 bg-slate-950/60 rounded-xl p-3 border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-extrabold text-slate-400 uppercase tracking-wider text-[10px]">Pipeline Stage</span>
            {getStatusBadge(application.status)}
          </div>

          {/* Stepper bar visualization */}
          <div className="grid grid-cols-5 gap-1 pt-1">
            {[1, 2, 3, 4, 5].map((step) => {
              const isPast = currentStage > step || currentStage === 5;
              const isCurrent = currentStage === step;
              return (
                <div 
                  key={step} 
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                    isCurrent 
                      ? 'bg-gradient-to-r from-indigo-500 to-sky-400 glow-sky animate-pulse' 
                      : isPast 
                      ? 'bg-indigo-500/80' 
                      : 'bg-slate-800'
                  }`}
                  title={`Stage ${step}: ${
                    step === 1 ? 'Scout' : 
                    step === 2 ? 'RAG Eval' : 
                    step === 3 ? 'HITL Review' : 
                    step === 4 ? 'Approved' : 'Submitted'
                  }`}
                />
              );
            })}
          </div>
        </div>

        {/* AI RAG Match Reasoning Snippet */}
        {application.fit_breakdown?.reasoning && (
          <div className="mb-4">
            <p className="text-xs text-slate-300 bg-slate-900/90 rounded-xl p-3 border border-slate-800/80 line-clamp-2 leading-relaxed italic text-slate-300/90 font-sans">
              "{application.fit_breakdown.reasoning}"
            </p>
          </div>
        )}

        {/* Matching Skills Matrix */}
        {application.fit_breakdown?.matching_skills && application.fit_breakdown.matching_skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {application.fit_breakdown.matching_skills.slice(0, 3).map((skill, idx) => (
              <span 
                key={idx} 
                className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 flex items-center gap-1"
              >
                <span className="w-1 h-1 rounded-full bg-emerald-400" />
                {skill}
              </span>
            ))}
            {application.fit_breakdown.matching_skills.length > 3 && (
              <span className="px-2 py-1 text-[10px] font-semibold rounded-lg bg-slate-800 text-slate-400 border border-slate-700/60">
                +{application.fit_breakdown.matching_skills.length - 3} more
              </span>
            )}
          </div>
        )}
      </div>

      {/* Aligned Action Footer */}
      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2.5 mt-2">
        <button
          onClick={() => onSelect(application)}
          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white text-xs font-bold transition-all border border-slate-800 hover:border-slate-700"
        >
          <FileText className="w-3.5 h-3.5 text-indigo-400" />
          Review & Edit
        </button>

        {application.status === 'pending_approval' || application.status === 'tailored' || application.status === 'evaluated' ? (
          <button
            onClick={() => onSelect(application)}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-extrabold shadow-md shadow-amber-500/20 transition-all hover:scale-[1.02]"
          >
            HITL Review <ArrowRight className="w-3.5 h-3.5" />
          </button>
        ) : application.status === 'approved' && onQuickExecute ? (
          <button
            onClick={() => onQuickExecute(application)}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-sky-500 hover:from-indigo-400 hover:to-sky-400 text-white text-xs font-extrabold shadow-md shadow-indigo-500/20 transition-all hover:scale-[1.02]"
          >
            <Play className="w-3.5 h-3.5" /> Apply Live
          </button>
        ) : null}
      </div>

    </div>
  );
};

