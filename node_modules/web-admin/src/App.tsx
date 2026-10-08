import React, { useState } from 'react';
import { Bell, Search, Activity } from 'lucide-react';
import DashboardTab from './components/DashboardTab';
import LiveMapTab from './components/LiveMapTab';
import AllIssuesTab from './components/AllIssuesTab';
import AnalyticsTab from './components/AnalyticsTab';
import SignalValidationTab from './components/SignalValidationTab';

export default function App() {
  const [activeTab, setActiveTab] = useState('Dashboard');

  return (
    <div className="min-h-screen text-white font-sans overflow-x-hidden" style={{ background: '#121420' }}>
      <div className="bg-ambient"></div>
      
      <div className="max-w-[1300px] mx-auto p-4 md:p-6 lg:p-8 relative z-10">
        
        {/* HEADER */}
        <header className="flex items-center justify-between mb-8 md:mb-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
              <Activity size={20} className="text-[#121420]" />
            </div>
            <span className="text-xl font-bold tracking-tight">CivicPulse</span>
          </div>

          <div className="hidden md:flex bg-[#1d1f30] rounded-full p-1 border border-white/5 overflow-x-auto hide-scrollbar">
            {['Dashboard', 'Live Map', 'All Issues', 'Analytics', 'Signals'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2 rounded-full text-[13px] font-bold transition-all whitespace-nowrap ${
                  activeTab === tab ? 'bg-white text-[#121420]' : 'text-gray-400 hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <button className="w-10 h-10 rounded-full bg-[#1d1f30] border border-white/5 flex items-center justify-center text-gray-400 hover:text-white transition">
              <Search size={18} />
            </button>
            <button className="w-10 h-10 rounded-full bg-[#1d1f30] border border-white/5 flex items-center justify-center text-gray-400 hover:text-white transition">
              <Bell size={18} />
            </button>
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-pink-500 to-orange-400 p-0.5 cursor-pointer">
              <img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop" alt="Avatar" className="w-full h-full rounded-full border-2 border-[#121420] object-cover" />
            </div>
          </div>
        </header>

        {activeTab === 'Dashboard' && <DashboardTab setActiveTab={setActiveTab} />}
        {activeTab === 'Live Map' && <LiveMapTab />}
        {activeTab === 'All Issues' && <AllIssuesTab />}
        {activeTab === 'Analytics' && <AnalyticsTab />}
        {activeTab === 'Signals' && <SignalValidationTab />}
        
      </div>
    </div>
  );
}
