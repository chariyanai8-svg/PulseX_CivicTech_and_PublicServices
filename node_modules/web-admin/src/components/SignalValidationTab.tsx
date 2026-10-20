import React, { useState } from 'react';
import { Twitter, MessageSquare, Check, X, AlertTriangle, CheckCircle2, RotateCcw, Plus, Zap } from 'lucide-react';
import { API_BASE } from '../apiConfig';

const INITIAL_SIGNALS = [
  { id: 1, platform: 'X', handle: '@johndoe_pj', text: 'The massive pothole on SS2/24 is going to kill someone. Hit it twice this week! @PBT_Official', sentiment: 'High Danger', aiMatch: 'CIV-2026-004285 (Road Defect)', time: '10m ago' },
  { id: 2, platform: 'Facebook', handle: 'Community Watch', text: 'Water not draining near the morning market. It smells terrible, when is the city council coming?', sentiment: 'Nuisance', aiMatch: 'New Incident', time: '1h ago' },
  { id: 3, platform: 'X', handle: '@sara_tweets', text: 'Traffic light at University intersection is completely out.', sentiment: 'Critical', aiMatch: 'New Incident', time: '5m ago' }
];

export default function SignalValidationTab() {
  const [signals, setSignals] = useState(INITIAL_SIGNALS);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  React.useEffect(() => {
    fetch(`${API_BASE}/signals`)
      .then(res => res.json())
      .then(json => {
        if (json.data && Array.isArray(json.data) && json.data.length > 0) {
          setSignals(json.data);
        }
      })
      .catch(() => {});
  }, []);

  const handleDismiss = async (id: number) => {
    setSignals(prev => prev.filter(s => s.id !== id));
    showToast('Signal dismissed as nuisance/spam.');
    try {
      await fetch(`${API_BASE}/signals/${id}/dismiss`, { method: 'POST' });
    } catch (e) {
      console.warn('Failed to dismiss signal on server:', e);
    }
  };

  const handleValidate = async (id: number) => {
    const s = signals.find(item => item.id === id);
    setSignals(prev => prev.filter(item => item.id !== id));
    showToast(`Signal validated! Converted into active council case.`);
    try {
      await fetch(`${API_BASE}/signals/convert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signalId: id })
      });
    } catch (e) {
      console.warn('Failed to convert signal on server:', e);
    }
  };

  const handleValidateAllHighDanger = async () => {
    const highDanger = signals.filter(s => s.sentiment === 'Critical' || s.sentiment === 'High Danger');
    if (highDanger.length === 0) {
      showToast('No High Danger signals pending validation.');
      return;
    }
    setSignals(prev => prev.filter(s => s.sentiment !== 'Critical' && s.sentiment !== 'High Danger'));
    showToast(`Validated ${highDanger.length} urgent signals into priority workorders.`);
  };

  const handleResetSignals = () => {
    setSignals(INITIAL_SIGNALS);
    showToast('Signals sandbox refreshed with incoming social media telemetry.');
  };

  const handleSimulateNewSignal = () => {
    const randomId = Date.now();
    const newSignal = {
      id: randomId,
      platform: Math.random() > 0.5 ? 'X' : 'Facebook',
      handle: `@citizen_${Math.floor(100 + Math.random() * 900)}`,
      text: 'Flash flood pooling near Section 14 bus stop after afternoon rain. Pedestrians stranded!',
      sentiment: 'Critical',
      aiMatch: 'New Incident (Flood Hazard)',
      time: 'Just now'
    };
    setSignals(prev => [newSignal, ...prev]);
    showToast('New simulated citizen social signal ingested.');
  };

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Signal Validation Sandbox</h2>
          <p className="text-gray-400 text-sm mt-1">AI-flagged social media complaints requiring verification & conversion.</p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleSimulateNewSignal}
            className="px-3.5 py-1.5 bg-[#1d1f30] hover:bg-white/10 text-white rounded-full text-xs font-bold border border-white/10 flex items-center gap-1.5 transition active:scale-95 shadow-sm"
            title="Simulate incoming social signal"
          >
            <Plus size={14} className="text-purple-400" />
            <span>Simulate Signal</span>
          </button>
          <button
            onClick={handleValidateAllHighDanger}
            className="px-3.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 rounded-full text-xs font-bold border border-emerald-500/30 flex items-center gap-1.5 transition active:scale-95"
            title="Batch validate all critical danger signals"
          >
            <Zap size={13} className="text-emerald-400" />
            <span>Validate High Danger</span>
          </button>
          <button
            onClick={handleResetSignals}
            className="px-3.5 py-1.5 bg-[#1d1f30] hover:bg-white/10 text-gray-300 hover:text-white rounded-full text-xs font-bold border border-white/5 flex items-center gap-1.5 transition active:scale-95"
            title="Reset sandbox signals"
          >
            <RotateCcw size={13} />
            <span>Reset Demo</span>
          </button>
          <span className="bg-[#1d1f30] px-3.5 py-1.5 rounded-full text-xs text-gray-300 border border-white/5 font-bold">
            <span className="text-blue-400">{signals.length}</span> Active Signals
          </span>
        </div>
      </div>

      {signals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-500 glass-card-light rounded-2xl">
          <Check size={48} className="mb-4 text-emerald-500/50" />
          <p className="text-lg font-bold text-gray-300">All caught up!</p>
          <p className="text-sm text-gray-400 mb-4">No pending social signals require council validation.</p>
          <button
            onClick={handleResetSignals}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm active:scale-95"
          >
            <RotateCcw size={14} />
            <span>Restore Demo Signals</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
          {signals.map(signal => (
            <div key={signal.id} className="glass-card-light p-6 flex flex-col relative overflow-hidden group border border-white/10 hover:border-white/20 transition-all shadow-lg">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                  {signal.platform === 'X' ? <Twitter size={18} className="text-blue-400" /> : <MessageSquare size={18} className="text-blue-600" />}
                  <span className="text-sm font-bold text-gray-200">{signal.handle}</span>
                </div>
                <span className="text-xs text-gray-500 font-mono">{signal.time}</span>
              </div>

              <p className="text-sm text-gray-300 mb-6 flex-1 italic leading-relaxed">"{signal.text}"</p>

              <div className="space-y-3 mb-6 bg-[#0f111a]/60 p-3 rounded-xl border border-white/5">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">AI Sentiment</span>
                  <span className={`font-bold ${signal.sentiment === 'Critical' || signal.sentiment === 'High Danger' ? 'text-red-400' : 'text-orange-400'}`}>{signal.sentiment}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Cross-Reference</span>
                  <span className="text-blue-300 font-mono text-[11px] truncate max-w-[180px]">{signal.aiMatch}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-auto">
                <button 
                  onClick={() => handleDismiss(signal.id)} 
                  className="flex items-center justify-center gap-2 py-2.5 bg-[#121420] text-red-400 hover:bg-red-500/20 hover:text-red-300 border border-white/5 rounded-xl text-xs font-bold transition active:scale-95"
                >
                  <X size={14} /> Dismiss
                </button>
                <button 
                  onClick={() => handleValidate(signal.id)} 
                  className="flex items-center justify-center gap-2 py-2.5 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-300 border border-emerald-500/20 rounded-xl text-xs font-bold transition active:scale-95 shadow-sm"
                >
                  <Check size={14} /> Validate
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Global Toast */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-[9999] bg-[#161825] text-white px-5 py-3 rounded-2xl border border-purple-500/40 shadow-2xl flex items-center gap-3 text-xs animate-in fade-in slide-in-from-bottom-2 duration-200">
          <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          <span className="font-semibold">{toastMsg}</span>
        </div>
      )}
    </div>
  );
}
