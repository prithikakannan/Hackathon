import React from 'react';

interface FitScoreBadgeProps {
  score?: number;
  size?: 'sm' | 'md' | 'lg';
}

export const FitScoreBadge: React.FC<FitScoreBadgeProps> = ({ score, size = 'md' }) => {
  if (score === undefined || score === null) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-500 border border-slate-200">
        <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-ping" />
        Evaluating...
      </span>
    );
  }

  let colorClasses = 'bg-rose-50 text-rose-700 border-rose-200 shadow-2xs shadow-rose-100';
  let dotColor = 'bg-rose-500';
  let pingColor = 'bg-rose-400';

  if (score >= 80) {
    colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-2xs shadow-emerald-100';
    dotColor = 'bg-emerald-600';
    pingColor = 'bg-emerald-400';
  } else if (score >= 60) {
    colorClasses = 'bg-amber-50 text-amber-700 border-amber-200 shadow-2xs shadow-amber-100';
    dotColor = 'bg-amber-500';
    pingColor = 'bg-amber-400';
  }

  const sizeClasses = {
    sm: 'px-2.5 py-0.5 text-[11px] font-bold tracking-tight',
    md: 'px-3 py-1 text-xs font-extrabold tracking-tight',
    lg: 'px-4 py-1.5 text-sm font-black tracking-tight'
  }[size];

  return (
    <div className={`inline-flex items-center gap-1.5 rounded-full border transition-all ${colorClasses} ${sizeClasses}`}>
      <span className="relative flex h-2 w-2 shrink-0">
        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${pingColor}`} />
        <span className={`relative inline-flex rounded-full h-2 w-2 ${dotColor}`} />
      </span>
      <span>{score}% Match</span>
    </div>
  );
};
