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
    setTimeout(() => setToastMsg(null), 3500);
  };

  const fetchSignals = () => {
    fetch(`${API_BASE}/signals`)
      .then(res => res.json())
      .then(json => {
        if (json.data && Array.isArray(json.data) && json.data.length > 0) {
          setSignals(json.data);
        } else if (json.data && Array.isArray(json.data) && json.data.length === 0) {
          setSignals([]);
        }
      })
      .catch(() => {});
  };

  React.useEffect(() => {
    fetchSignals();
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
    showToast(`Validated ${highDanger.length} urgent signal${highDanger.length === 1 ? '' : 's'} into priority workorders.`);
    try {
      const res = await fetch(`${API_BASE}/signals/batch-validate-danger`, { method: 'POST' });
      const json = await res.json();
      if (json.remainingSignals && Array.isArray(json.remainingSignals)) {
        setSignals(json.remainingSignals);
      }
    } catch (e) {
      console.warn('Failed to batch validate signals on server:', e);
    }
  };

  const handleResetSignals = async () => {
    setSignals(INITIAL_SIGNALS);
    showToast('Signals sandbox refreshed with incoming social media telemetry.');
    try {
      const res = await fetch(`${API_BASE}/signals/reset`, { method: 'POST' });
      const json = await res.json();
      if (json.data && Array.isArray(json.data)) {
        setSignals(json.data);
      }
    } catch (e) {
      console.warn('Failed to reset signals on server:', e);
    }
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
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Signal Validation Sandbox</h2>
          <p className="text-slate-500 dark:text-gray-400 text-sm mt-1">AI-flagged social media complaints requiring verification & conversion.</p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleSimulateNewSignal}
            className="px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-800 dark:bg-[#1d1f30] dark:hover:bg-white/10 dark:text-white rounded-full text-xs font-bold border border-slate-200 dark:border-white/10 flex items-center gap-1.5 transition active:scale-95 shadow-sm"
            title="Simulate incoming social signal"
          >
            <Plus size={14} className="text-purple-600 dark:text-purple-400" />
            <span>Simulate Signal</span>
          </button>
          <button
            onClick={handleValidateAllHighDanger}
            className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 dark:text-emerald-300 rounded-full text-xs font-bold border border-emerald-200 dark:border-emerald-500/30 flex items-center gap-1.5 transition active:scale-95 shadow-sm"
            title="Batch validate all critical danger signals"
          >
            <Zap size={13} className="text-emerald-600 dark:text-emerald-400" />
            <span>Validate High Danger</span>
          </button>
          <button
            onClick={handleResetSignals}
            className="px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 dark:bg-[#1d1f30] dark:hover:bg-white/10 dark:text-gray-300 dark:hover:text-white rounded-full text-xs font-bold border border-slate-200 dark:border-white/5 flex items-center gap-1.5 transition active:scale-95 shadow-sm"
            title="Reset sandbox signals"
          >
            <RotateCcw size={13} />
            <span>Reset Demo</span>
          </button>
          <span className="bg-white dark:bg-[#1d1f30] px-3.5 py-1.5 rounded-full text-xs text-slate-700 dark:text-gray-300 border border-slate-200 dark:border-white/5 font-bold shadow-sm">
            <span className="text-blue-600 dark:text-blue-400 font-extrabold">{signals.length}</span> {signals.length === 1 ? 'Active Signal' : 'Active Signals'}
          </span>
        </div>
      </div>

      {signals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-[#161825] border border-slate-200 dark:border-white/10 rounded-2xl shadow-sm text-center">
          <Check size={48} className="mb-4 text-emerald-500/60" />
          <p className="text-lg font-bold text-slate-900 dark:text-gray-200">All caught up!</p>
          <p className="text-sm text-slate-500 dark:text-gray-400 mb-5">No pending social signals require council validation.</p>
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
            <div key={signal.id} className="bg-white dark:bg-[#161825] p-6 flex flex-col rounded-2xl border border-slate-200 dark:border-white/10 hover:border-purple-300 dark:hover:border-purple-500/30 transition-all shadow-md dark:shadow-xl relative overflow-hidden group">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                  {signal.platform === 'X' ? <Twitter size={18} className="text-blue-400" /> : <MessageSquare size={18} className="text-blue-600" />}
                  <span className="text-sm font-bold text-slate-900 dark:text-gray-200">{signal.handle}</span>
                </div>
                <span className="text-xs text-slate-500 dark:text-gray-400 font-mono">{signal.time}</span>
              </div>

              <p className="text-sm text-slate-800 dark:text-gray-300 mb-6 flex-1 italic leading-relaxed">"{signal.text}"</p>

              <div className="space-y-3 mb-6 bg-slate-50 dark:bg-[#0f111a]/70 p-3.5 rounded-xl border border-slate-200/80 dark:border-white/5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-600 dark:text-gray-400 font-semibold">AI Sentiment</span>
                  <span className={`font-bold px-2 py-0.5 rounded-md text-xs border ${
                    signal.sentiment === 'Critical' || signal.sentiment === 'High Danger' 
                      ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900/40' 
                      : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/40'
                  }`}>
                    {signal.sentiment}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-600 dark:text-gray-400 font-semibold">Cross-Reference</span>
                  <span className="text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/40 px-2 py-0.5 rounded-md font-mono text-[11px] font-semibold truncate max-w-[180px]">
                    {signal.aiMatch}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-auto">
                <button 
                  onClick={() => handleDismiss(signal.id)} 
                  className="flex items-center justify-center gap-2 py-2.5 bg-slate-100 hover:bg-rose-50 text-rose-600 dark:bg-[#121420] dark:text-red-400 dark:hover:bg-red-500/20 dark:hover:text-red-300 border border-slate-200 dark:border-white/5 rounded-xl text-xs font-bold transition active:scale-95"
                >
                  <X size={14} /> Dismiss
                </button>
                <button 
                  onClick={() => handleValidate(signal.id)} 
                  className="flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20 dark:hover:text-emerald-300 border border-emerald-600 dark:border-emerald-500/20 rounded-xl text-xs font-bold transition active:scale-95 shadow-sm"
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
        <div className="fixed bottom-24 right-6 z-[9999] bg-slate-900 text-white dark:bg-[#161825] px-5 py-3 rounded-2xl border border-purple-500/40 shadow-2xl flex items-center gap-3 text-xs animate-in fade-in slide-in-from-bottom-2 duration-200">
          <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          <span className="font-semibold">{toastMsg}</span>
        </div>
      )}
    </div>
  );
}
