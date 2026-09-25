import React, { useState } from 'react';
import { ExecutionLog } from '../types';
import { Terminal, Image, Maximize2, Cpu } from 'lucide-react';

interface ExecutionConsoleProps {
  logs?: ExecutionLog[];
  screenshotUrl?: string;
  submittedAt?: string;
  status: string;
}

export const ExecutionConsole: React.FC<ExecutionConsoleProps> = ({
  logs = [],
  screenshotUrl,
  submittedAt: _submittedAt,
  status
}) => {
  const [isScreenshotExpanded, setIsScreenshotExpanded] = useState(false);

  return (
    <div className="bg-slate-950/90 rounded-2xl border border-slate-800 p-6 space-y-5 font-mono shadow-2xl relative overflow-hidden">
      
      {/* Terminal Window Header Chrome */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
            <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
            <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
          </div>
          <div className="h-4 w-px bg-slate-800 mx-1" />
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold text-slate-200 tracking-wide font-sans">Playwright Worker Console</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-sans">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-emerald-400 font-extrabold text-[11px] uppercase tracking-wider">{status}</span>
        </div>
      </div>

      {/* Execution Step Logs */}
      <div className="space-y-2 max-h-72 overflow-y-auto pr-2 text-xs custom-scrollbar">
        {logs.length === 0 ? (
          <div className="py-8 text-center space-y-2 font-sans">
            <Cpu className="w-8 h-8 text-slate-600 mx-auto animate-pulse" />
            <p className="text-slate-400 text-xs">No execution logs generated yet.</p>
            <p className="text-slate-500 text-[11px]">Click "Approve & Execute Playwright" to launch live browser automation.</p>
          </div>
        ) : (
          logs.map((log, i) => (
            <div 
              key={i} 
              className="flex items-start gap-2.5 text-slate-300 hover:bg-slate-900/80 p-2 rounded-xl transition-all border border-transparent hover:border-slate-800"
            >
              <span className="text-slate-500 text-[10px] shrink-0 pt-0.5">{new Date(log.timestamp).toLocaleTimeString()}</span>
              <span className={`shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded ${
                log.status === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                log.status === 'failed' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                log.status === 'simulated' ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20' : 
                'bg-amber-500/10 text-amber-400 border border-amber-500/20'
              }`}>
                {log.status.toUpperCase()}
              </span>
              <div className="flex-1 min-w-0">
                <span className="text-slate-200 font-bold mr-2">{log.step}:</span>
                <span className="text-slate-400 font-sans text-xs">{log.details}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Screenshot Verification */}
      {screenshotUrl && (
        <div className="pt-4 border-t border-slate-800/80 space-y-3 font-sans">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-slate-300 font-semibold">
              <Image className="w-4 h-4 text-sky-400" /> Playwright Verification Capture
            </div>
            <button
              onClick={() => setIsScreenshotExpanded(!isScreenshotExpanded)}
              className="text-[11px] text-sky-400 hover:text-sky-300 flex items-center gap-1 font-semibold"
            >
              <Maximize2 className="w-3 h-3" /> {isScreenshotExpanded ? 'Collapse' : 'Expand'}
            </button>
          </div>

          <div className={`rounded-xl overflow-hidden border border-slate-800 bg-slate-900 relative transition-all duration-300 ${
            isScreenshotExpanded ? 'max-h-none' : 'max-h-56'
          }`}>
            <img
              src={screenshotUrl}
              alt="Playwright form submission screenshot"
              className="w-full object-cover"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
        </div>
      )}

    </div>
  );
};

