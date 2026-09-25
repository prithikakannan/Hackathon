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
        return <span className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1.5"><Cpu className="w-3 h-3 animate-spin text-blue-600" /> 1. Scouting Job</span>;
      case 'evaluated':
        return <span className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1.5"><Sparkles className="w-3 h-3 text-indigo-600" /> 2. RAG Evaluated</span>;
      case 'tailored':
      case 'pending_approval':
        return <span className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-amber-50 text-amber-800 border border-amber-200 glow-amber animate-pulse flex items-center gap-1.5"><Clock className="w-3 h-3 text-amber-600" /> 3. Pending Review</span>;
      case 'approved':
        return <span className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 glow-emerald flex items-center gap-1.5"><ShieldCheck className="w-3 h-3 text-emerald-600" /> 4. Approved & Ready</span>;
      case 'applying':
        return <span className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-purple-50 text-purple-700 border border-purple-200 glow-purple animate-pulse flex items-center gap-1.5"><Play className="w-3 h-3 animate-spin text-purple-600" /> 5. Playwright Active</span>;
      case 'applied':
        return <span className="px-2.5 py-1 text-[11px] font-black rounded-lg bg-emerald-600 text-white shadow-xs flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3 text-white" /> Submitted</span>;
      case 'rejected':
        return <span className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-slate-100 text-slate-500 border border-slate-200">Rejected</span>;
      case 'failed':
        return <span className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-rose-50 text-rose-700 border border-rose-200 glow-rose flex items-center gap-1.5"><AlertCircle className="w-3 h-3 text-rose-600" /> Failed</span>;
      default:
        return <span className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-slate-100 text-slate-600 border border-slate-200">{status}</span>;
    }
  };

  // Generate background tint for company avatar
  const getAvatarGradient = (name: string) => {
    const charCode = (name || 'JO').charCodeAt(0);
    const gradients = [
      'from-indigo-600 to-sky-600',
      'from-emerald-600 to-teal-600',
      'from-purple-600 to-indigo-600',
      'from-amber-500 to-orange-600',
      'from-blue-600 to-cyan-600'
    ];
    return gradients[charCode % gradients.length];
  };

  return (
    <div className="glass-card rounded-2xl p-5.5 flex flex-col justify-between h-full group relative border border-slate-200/90 hover:border-indigo-300 transition-all duration-300">
      
      {/* Top Header Row */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-3.5">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`h-11 w-11 rounded-xl bg-gradient-to-br ${getAvatarGradient(application.company_name)} flex items-center justify-center text-white font-black text-sm shrink-0 shadow-md shadow-indigo-500/10 border border-white/20`}>
              {application.company_name ? application.company_name.substring(0, 2).toUpperCase() : 'JO'}
            </div>
            <div className="min-w-0">
              <span className="text-[11px] font-extrabold text-indigo-600 tracking-wider uppercase block truncate">
                {application.company_name}
              </span>
              <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors truncate font-display" title={application.job_title}>
                {application.job_title}
              </h3>
            </div>
          </div>
          <div className="shrink-0">
            <FitScoreBadge score={application.fit_score} size="md" />
          </div>
        </div>

        {/* Location & Metadata Row */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 mb-4 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <span className="flex items-center gap-1 font-medium text-slate-600">
              <MapPin className="w-3.5 h-3.5 text-sky-600" />
              {application.location || 'Remote'}
            </span>
            <span className="text-slate-300">•</span>
            <span className="flex items-center gap-1 text-slate-500">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              {new Date(application.created_at).toLocaleDateString()}
            </span>
          </div>

          <a
            href={application.job_url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-[11px] text-sky-600 hover:text-sky-700 transition-colors font-bold px-2 py-0.5 rounded-md hover:bg-sky-50"
            onClick={(e) => e.stopPropagation()}
            title="Open job posting"
          >
            Posting <ArrowUpRight className="w-3 h-3" />
          </a>
        </div>

        {/* Agent Mini Pipeline Stepper */}
        <div className="mb-4 bg-slate-50 rounded-xl p-3 border border-slate-200/80 space-y-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-extrabold text-slate-500 uppercase tracking-wider text-[10px]">Pipeline Stage</span>
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
                      ? 'bg-gradient-to-r from-indigo-600 to-sky-500 glow-sky animate-pulse' 
                      : isPast 
                      ? 'bg-indigo-600' 
                      : 'bg-slate-200'
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
            <p className="text-xs text-slate-700 bg-slate-50 rounded-xl p-3 border border-slate-200/80 line-clamp-2 leading-relaxed italic font-sans">
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
                className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                {skill}
              </span>
            ))}
            {application.fit_breakdown.matching_skills.length > 3 && (
              <span className="px-2 py-1 text-[10px] font-semibold rounded-lg bg-slate-100 text-slate-600 border border-slate-200">
                +{application.fit_breakdown.matching_skills.length - 3} more
              </span>
            )}
          </div>
        )}
      </div>

      {/* Aligned Action Footer */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2.5 mt-2">
        <button
          onClick={() => onSelect(application)}
          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all border border-slate-200/80"
        >
          <FileText className="w-3.5 h-3.5 text-indigo-600" />
          Review & Edit
        </button>

        {application.status === 'pending_approval' || application.status === 'tailored' || application.status === 'evaluated' ? (
          <button
            onClick={() => onSelect(application)}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-extrabold shadow-md shadow-amber-500/20 transition-all hover:scale-[1.02]"
          >
            HITL Review <ArrowRight className="w-3.5 h-3.5" />
          </button>
        ) : application.status === 'approved' && onQuickExecute ? (
          <button
            onClick={() => onQuickExecute(application)}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white text-xs font-extrabold shadow-md shadow-indigo-500/20 transition-all hover:scale-[1.02]"
          >
            <Play className="w-3.5 h-3.5" /> Apply Live
          </button>
        ) : null}
      </div>

    </div>
  );
};
