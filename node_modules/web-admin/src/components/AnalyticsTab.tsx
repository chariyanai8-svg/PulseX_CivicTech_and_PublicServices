import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { WEEKLY_TRENDS } from '../mockData';
import { Activity, Users, Clock, AlertTriangle } from 'lucide-react';

export default function AnalyticsTab() {
  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Performance Analytics</h2>
        <div className="bg-[#1d1f30] rounded-full p-1 border border-white/5 flex text-xs">
          <button className="px-4 py-1.5 rounded-full bg-white text-black font-medium">Weekly</button>
          <button className="px-4 py-1.5 rounded-full text-gray-400 hover:text-white">Monthly</button>
          <button className="px-4 py-1.5 rounded-full text-gray-400 hover:text-white">Yearly</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="glass-card-light p-5 border-l-4 border-l-purple-500">
          <div className="flex items-center justify-between mb-4 text-gray-400">
            <span className="text-sm">Total Reports</span>
            <Activity size={18} />
          </div>
          <h3 className="text-3xl font-bold text-white mb-1">1,284</h3>
          <p className="text-[10px] text-emerald-400 font-bold">+12.5% from last week</p>
        </div>
        <div className="glass-card-light p-5 border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between mb-4 text-gray-400">
            <span className="text-sm">Avg Resolution</span>
            <Clock size={18} />
          </div>
          <h3 className="text-3xl font-bold text-white mb-1">4.2 <span className="text-xl text-gray-500">days</span></h3>
          <p className="text-[10px] text-emerald-400 font-bold">-0.8 days from last week</p>
        </div>
        <div className="glass-card-light p-5 border-l-4 border-l-orange-500">
          <div className="flex items-center justify-between mb-4 text-gray-400">
            <span className="text-sm">Community Backing</span>
            <Users size={18} />
          </div>
          <h3 className="text-3xl font-bold text-white mb-1">8,402</h3>
          <p className="text-[10px] text-emerald-400 font-bold">+24% from last week</p>
        </div>
        <div className="glass-card-light p-5 border-l-4 border-l-red-500">
          <div className="flex items-center justify-between mb-4 text-gray-400">
            <span className="text-sm">Escalations</span>
            <AlertTriangle size={18} />
          </div>
          <h3 className="text-3xl font-bold text-white mb-1">42</h3>
          <p className="text-[10px] text-red-400 font-bold">+5 from last week</p>
        </div>
      </div>

      <div className="glass-card-light p-6 h-[400px]">
        <h3 className="text-lg font-bold text-white mb-6">Report Volume vs Resolution</h3>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={WEEKLY_TRENDS} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorReports" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} dy={10} />
            <YAxis axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} dx={-10} />
            <Tooltip contentStyle={{ background: '#1d1f30', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }} />
            <Area type="monotone" dataKey="reports" stroke="#a855f7" strokeWidth={3} fillOpacity={1} fill="url(#colorReports)" />
            <Area type="monotone" dataKey="resolved" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorResolved)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
