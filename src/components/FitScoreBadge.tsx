import React from 'react';

interface FitScoreBadgeProps {
  score?: number;
  size?: 'sm' | 'md' | 'lg';
}

export const FitScoreBadge: React.FC<FitScoreBadgeProps> = ({ score, size = 'md' }) => {
  if (score === undefined || score === null) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-900/80 text-slate-400 border border-slate-800">
        <span className="h-1.5 w-1.5 rounded-full bg-slate-500 animate-ping" />
        Evaluating...
      </span>
    );
  }

  let colorClasses = 'bg-rose-500/10 text-rose-400 border-rose-500/30 glow-rose';
  let dotColor = 'bg-rose-500';
  let pingColor = 'bg-rose-400';

  if (score >= 80) {
    colorClasses = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 glow-emerald';
    dotColor = 'bg-emerald-500';
    pingColor = 'bg-emerald-400';
  } else if (score >= 60) {
    colorClasses = 'bg-amber-500/10 text-amber-400 border-amber-500/30 glow-amber';
    dotColor = 'bg-amber-500';
    pingColor = 'bg-amber-400';
  }

  const sizeClasses = {
    sm: 'px-2.5 py-0.5 text-[11px] font-bold tracking-tight',
    md: 'px-3 py-1 text-xs font-extrabold tracking-tight',
    lg: 'px-4 py-1.5 text-sm font-black tracking-tight'
  }[size];

  return (
    <div className={`inline-flex items-center gap-1.5 rounded-full border backdrop-blur-md transition-all ${colorClasses} ${sizeClasses}`}>
      <span className="relative flex h-2 w-2 shrink-0">
        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${pingColor}`} />
        <span className={`relative inline-flex rounded-full h-2 w-2 ${dotColor}`} />
      </span>
      <span>{score}% Match</span>
    </div>
  );
};

