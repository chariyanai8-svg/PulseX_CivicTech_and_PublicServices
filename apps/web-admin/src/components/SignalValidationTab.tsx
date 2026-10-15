import React, { useState } from 'react';
import { Twitter, MessageSquare, Check, X, AlertTriangle } from 'lucide-react';

const INITIAL_SIGNALS = [
  { id: 1, platform: 'X', handle: '@johndoe_pj', text: 'The massive pothole on SS2/24 is going to kill someone. Hit it twice this week! @PBT_Official', sentiment: 'High Danger', aiMatch: 'CIV-2026-004285 (Road Defect)', time: '10m ago' },
  { id: 2, platform: 'Facebook', handle: 'Community Watch', text: 'Water not draining near the morning market. It smells terrible, when is the city council coming?', sentiment: 'Nuisance', aiMatch: 'New Incident', time: '1h ago' },
  { id: 3, platform: 'X', handle: '@sara_tweets', text: 'Traffic light at University intersection is completely completely out.', sentiment: 'Critical', aiMatch: 'New Incident', time: '5m ago' }
];

export default function SignalValidationTab() {
  const [signals, setSignals] = useState(INITIAL_SIGNALS);

  const handleDismiss = (id: number) => {
    setSignals(prev => prev.filter(s => s.id !== id));
  };

  const handleValidate = (id: number) => {
    setSignals(prev => prev.filter(s => s.id !== id));
    // In a real app, this would convert the signal to a new issue ticket
  };

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Signal Validation Sandbox</h2>
          <p className="text-gray-400 text-sm mt-1">AI-flagged social media complaints requiring verification.</p>
        </div>
        <div className="flex gap-2">
          <span className="bg-[#1d1f30] px-4 py-2 rounded-full text-xs text-gray-300 border border-white/5 font-bold">
            <span className="text-blue-400">{signals.length + 39}</span> Pending Signals
          </span>
        </div>
      </div>

      {signals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-500">
          <Check size={48} className="mb-4 text-emerald-500/50" />
          <p className="text-lg">All caught up!</p>
          <p className="text-sm">No pending signals require validation.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
          {signals.map(signal => (
            <div key={signal.id} className="glass-card-light p-6 flex flex-col relative overflow-hidden group border border-white/10 hover:border-white/20 transition-all">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                  {signal.platform === 'X' ? <Twitter size={18} className="text-blue-400" /> : <MessageSquare size={18} className="text-blue-600" />}
                  <span className="text-sm font-bold text-gray-200">{signal.handle}</span>
                </div>
                <span className="text-xs text-gray-500">{signal.time}</span>
              </div>
              
              <p className="text-sm text-gray-300 mb-6 flex-1 italic">"{signal.text}"</p>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">AI Sentiment</span>
                  <span className={`font-bold ${signal.sentiment === 'Critical' || signal.sentiment === 'High Danger' ? 'text-red-400' : 'text-orange-400'}`}>{signal.sentiment}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Cross-Reference</span>
                  <span className="text-blue-300 font-mono">{signal.aiMatch}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-auto">
                <button onClick={() => handleDismiss(signal.id)} className="flex items-center justify-center gap-2 py-2.5 bg-[#121420] text-red-400 hover:bg-red-500/20 hover:text-red-300 border border-white/5 rounded-xl text-xs font-bold transition">
                  <X size={14} /> Dismiss
                </button>
                <button onClick={() => handleValidate(signal.id)} className="flex items-center justify-center gap-2 py-2.5 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-300 border border-emerald-500/20 rounded-xl text-xs font-bold transition">
                  <Check size={14} /> Validate
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
