import React, { useState } from 'react';
import { Bell, Search, Activity, ArrowRight, UserCircle2, ShieldCheck, RefreshCw } from 'lucide-react';
import DashboardTab from './components/DashboardTab';
import LiveMapTab from './components/LiveMapTab';
import AllIssuesTab from './components/AllIssuesTab';
import AnalyticsTab from './components/AnalyticsTab';
import SignalValidationTab from './components/SignalValidationTab';

function LoginScreen({ onLogin }: { onLogin: (id: string) => void }) {
  const [userId, setUserId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId.trim()) return;
    setIsSubmitting(true);
    setTimeout(() => {
      onLogin(userId.trim().toUpperCase());
    }, 600);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative" style={{ background: '#0a0b10' }}>
      <div className="absolute inset-0 bg-ambient"></div>
      
      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-10 animate-fade-up">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 to-blue-500 flex items-center justify-center mx-auto mb-6 shadow-[0_0_40px_rgba(168,85,247,0.4)]">
            <Activity size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2">CivicPulse</h1>
          <p className="text-gray-400">One Door for Every Civic Issue.</p>
        </div>

        <div className="bg-[#161825]/80 backdrop-blur-xl p-8 rounded-3xl border border-white/5 shadow-2xl animate-fade-up" style={{ animationDelay: '0.1s' }}>
          <h2 className="text-xl font-bold text-white mb-6 text-center">Sign In</h2>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">National ID (IC) or Admin Badge</label>
              <div className="relative">
                <input 
                  type="text" 
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder="e.g. 980101-12-1234 or ADM-001" 
                  className="w-full bg-[#0a0b10] text-white px-5 py-3.5 rounded-xl border border-white/10 focus:outline-none focus:border-purple-500 transition-colors"
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full bg-white hover:bg-gray-200 text-black font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <RefreshCw size={20} className="animate-spin" />
              ) : (
                <>Continue <ArrowRight size={18} /></>
              )}
            </button>
          </form>

          <div className="mt-8 space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-300 text-sm">
              <ShieldCheck size={18} className="shrink-0" />
              <span>Admin Access: Enter <strong>ADM-</strong> followed by any numbers to access the dashboard.</span>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 text-sm">
              <UserCircle2 size={18} className="shrink-0" />
              <span>Citizen Access: Enter any standard IC number to be routed to the user app.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [globalSearch, setGlobalSearch] = useState('');
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const handleLogin = (id: string) => {
    if (id.startsWith('ADM-')) {
      setCurrentUser(id);
      setIsAuthenticated(true);
    } else {
      // Route to user site with IC parameter
      window.location.href = `http://localhost:3000?ic=${encodeURIComponent(id)}`;
    }
  };

  if (!isAuthenticated) {
    return <LoginScreen onLogin={handleLogin} />;
  }

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
            {['Dashboard', 'Live Map', 'Issues', 'Analytics', 'Signals'].map(tab => (
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
            <div className="relative flex items-center bg-[#1d1f30] border border-white/5 rounded-full px-4 h-10 w-[200px] focus-within:border-white/20 transition-all">
              <Search size={16} className="text-gray-400 mr-2 shrink-0" />
              <input 
                type="text" 
                placeholder="Search cases..." 
                value={globalSearch}
                onChange={e => {
                  setGlobalSearch(e.target.value);
                  if (e.target.value && activeTab !== 'Issues') setActiveTab('Issues');
                }}
                className="bg-transparent text-sm text-white focus:outline-none w-full placeholder:text-gray-500" 
              />
            </div>
            
            <button className="w-10 h-10 rounded-full bg-[#1d1f30] border border-white/5 flex items-center justify-center text-gray-400 hover:text-white transition relative shrink-0">
              <Bell size={18} />
              <div className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-[#1d1f30]"></div>
            </button>
            
            <div 
              className="relative shrink-0" 
              onMouseEnter={() => setIsProfileOpen(true)} 
              onMouseLeave={() => setIsProfileOpen(false)}
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-pink-500 to-orange-400 p-0.5 cursor-pointer">
                <img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop" alt="Avatar" className="w-full h-full rounded-full border-2 border-[#121420] object-cover" />
              </div>
              
              {isProfileOpen && (
                <div className="absolute top-full right-0 pt-2 z-50">
                  <div className="w-[240px] bg-[#1d1f30] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-fade-up">
                    <div className="p-4 border-b border-white/5">
                      <p className="font-bold text-white text-sm">{currentUser === 'ADM-001' ? 'Datuk Amirul' : currentUser}</p>
                      <p className="text-[11px] text-gray-400">{currentUser === 'ADM-001' ? 'System Administrator' : 'Local Official'}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
                        <span className="text-[10px] text-green-400 font-bold uppercase tracking-wider">Online</span>
                      </div>
                    </div>
                    <div className="p-2">
                      <button className="w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-white/5 rounded-lg transition">Account Settings</button>
                      <button className="w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-white/5 rounded-lg transition">Audit Logs</button>
                      <div className="h-[1px] bg-white/5 my-1 mx-2"></div>
                      <button 
                        onClick={() => {
                          setCurrentUser(null);
                          setIsAuthenticated(false);
                        }}
                        className="w-full text-left px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 rounded-lg transition"
                      >
                        Sign Out
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {activeTab === 'Dashboard' && <DashboardTab setActiveTab={setActiveTab} />}
        {activeTab === 'Live Map' && <LiveMapTab />}
        {activeTab === 'Issues' && <AllIssuesTab externalSearchQuery={globalSearch} />}
        {activeTab === 'Analytics' && <AnalyticsTab />}
        {activeTab === 'Signals' && <SignalValidationTab />}
        
      </div>
    </div>
  );
}
