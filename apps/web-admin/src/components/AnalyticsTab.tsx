import React, { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { WEEKLY_TRENDS } from '../mockData';
import { Activity, Users, Clock, AlertTriangle, Download, CheckCircle2 } from 'lucide-react';

const MONTHLY_TRENDS = [
  { day: 'Week 1', reports: 312, resolved: 280 },
  { day: 'Week 2', reports: 420, resolved: 395 },
  { day: 'Week 3', reports: 560, resolved: 510 },
  { day: 'Week 4', reports: 480, resolved: 460 },
];

const YEARLY_TRENDS = [
  { day: 'Jan', reports: 1250, resolved: 1180 },
  { day: 'Feb', reports: 1420, resolved: 1390 },
  { day: 'Mar', reports: 1680, resolved: 1540 },
  { day: 'Apr', reports: 1890, resolved: 1810 },
  { day: 'May', reports: 2150, resolved: 2020 },
  { day: 'Jun', reports: 1980, resolved: 1920 },
  { day: 'Jul', reports: 2340, resolved: 2210 },
  { day: 'Aug', reports: 2510, resolved: 2450 },
];

export default function AnalyticsTab() {
  const [timeframe, setTimeframe] = useState<'Weekly' | 'Monthly' | 'Yearly'>('Weekly');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const chartData = timeframe === 'Weekly' ? WEEKLY_TRENDS : timeframe === 'Monthly' ? MONTHLY_TRENDS : YEARLY_TRENDS;

  const stats = {
    Weekly: {
      reports: '1,284',
      reportsDelta: '+12.5% from last week',
      resolution: '4.2',
      resolutionUnit: 'days',
      resolutionDelta: '-0.8 days from last week',
      backing: '8,402',
      backingDelta: '+24% from last week',
      escalations: '42',
      escalationsDelta: '+5 from last week',
    },
    Monthly: {
      reports: '5,820',
      reportsDelta: '+18.3% from last month',
      resolution: '3.8',
      resolutionUnit: 'days',
      resolutionDelta: '-1.2 days from last month',
      backing: '34,190',
      backingDelta: '+31% from last month',
      escalations: '168',
      escalationsDelta: '-14 from last month',
    },
    Yearly: {
      reports: '64,250',
      reportsDelta: '+26.8% year-over-year',
      resolution: '3.4',
      resolutionUnit: 'days',
      resolutionDelta: '-2.1 days year-over-year',
      backing: '412,800',
      backingDelta: '+45% year-over-year',
      escalations: '1,420',
      escalationsDelta: '-18% year-over-year',
    },
  }[timeframe];

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Performance Analytics</h2>
          <p className="text-sm text-gray-400 mt-0.5">Real-time council efficiency and resolution velocity.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-[#1d1f30] rounded-full p-1 border border-white/5 flex text-xs">
            {(['Weekly', 'Monthly', 'Yearly'] as const).map(tf => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-4 py-1.5 rounded-full font-medium transition ${
                  timeframe === tf
                    ? 'bg-white text-black shadow-md'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
          <button
            onClick={() => {
              window.print();
              showToast('Opened printable executive analytics report.');
            }}
            className="px-4 py-2 bg-[#1d1f30] hover:bg-white/10 text-white rounded-full text-xs font-bold border border-white/10 flex items-center gap-1.5 transition active:scale-95 shadow-sm"
            title="Export or print performance analytics report"
          >
            <Download size={14} />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div
          onClick={() => showToast(`Total Reports: ${stats.reports} complaints logged. Trend: ${stats.reportsDelta}`)}
          className="glass-card-light p-5 border-l-4 border-l-purple-500 cursor-pointer hover:scale-[1.02] transition shadow-md group"
          title="Click to view total reports insight"
        >
          <div className="flex items-center justify-between mb-4 text-gray-400 group-hover:text-purple-400 transition">
            <span className="text-sm font-semibold">Total Reports</span>
            <Activity size={18} />
          </div>
          <h3 className="text-3xl font-bold text-white mb-1">{stats.reports}</h3>
          <p className="text-[10px] text-emerald-400 font-bold">{stats.reportsDelta}</p>
        </div>
        <div
          onClick={() => showToast(`Resolution Velocity: Current average is ${stats.resolution} ${stats.resolutionUnit}. Outperforming 7-day charter.`)}
          className="glass-card-light p-5 border-l-4 border-l-blue-500 cursor-pointer hover:scale-[1.02] transition shadow-md group"
          title="Click to view average resolution speed"
        >
          <div className="flex items-center justify-between mb-4 text-gray-400 group-hover:text-blue-400 transition">
            <span className="text-sm font-semibold">Avg Resolution</span>
            <Clock size={18} />
          </div>
          <h3 className="text-3xl font-bold text-white mb-1">
            {stats.resolution} <span className="text-xl text-gray-500">{stats.resolutionUnit}</span>
          </h3>
          <p className="text-[10px] text-emerald-400 font-bold">{stats.resolutionDelta}</p>
        </div>
        <div
          onClick={() => showToast(`Community Backing: ${stats.backing} total endorsements registered from verified MyKad citizens.`)}
          className="glass-card-light p-5 border-l-4 border-l-orange-500 cursor-pointer hover:scale-[1.02] transition shadow-md group"
          title="Click to view citizen backing stats"
        >
          <div className="flex items-center justify-between mb-4 text-gray-400 group-hover:text-orange-400 transition">
            <span className="text-sm font-semibold">Community Backing</span>
            <Users size={18} />
          </div>
          <h3 className="text-3xl font-bold text-white mb-1">{stats.backing}</h3>
          <p className="text-[10px] text-emerald-400 font-bold">{stats.backingDelta}</p>
        </div>
        <div
          onClick={() => showToast(`Escalations: ${stats.escalations} repeat or high-impact bottlenecks flagged for director audit.`)}
          className="glass-card-light p-5 border-l-4 border-l-red-500 cursor-pointer hover:scale-[1.02] transition shadow-md group"
          title="Click to view escalations breakdown"
        >
          <div className="flex items-center justify-between mb-4 text-gray-400 group-hover:text-red-400 transition">
            <span className="text-sm font-semibold">Escalations</span>
            <AlertTriangle size={18} />
          </div>
          <h3 className="text-3xl font-bold text-white mb-1">{stats.escalations}</h3>
          <p className="text-[10px] text-emerald-400 font-bold">{stats.escalationsDelta}</p>
        </div>
      </div>

      <div className="glass-card-light p-6 h-[400px]">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-white">Report Volume vs Resolution</h3>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-purple-400">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span> New Reports
            </span>
            <span className="flex items-center gap-1.5 text-blue-400">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Resolved
            </span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height="85%">
          <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorReports" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} dy={10} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} dx={-10} />
            <Tooltip contentStyle={{ background: '#1d1f30', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }} />
            <Area type="monotone" dataKey="reports" stroke="#a855f7" strokeWidth={3} fillOpacity={1} fill="url(#colorReports)" />
            <Area type="monotone" dataKey="resolved" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorResolved)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

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
