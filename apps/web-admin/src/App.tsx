import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Bell, Search, Activity, ArrowRight, UserCircle2, ShieldCheck, RefreshCw, Sun, Moon, Check, CheckCheck, Trash2, X, Sliders, FileText, Download, Shield, Clock, CheckCircle2, Globe } from 'lucide-react';
import DashboardTab from './components/DashboardTab';
import LiveMapTab from './components/LiveMapTab';
import AllIssuesTab from './components/AllIssuesTab';
import AnalyticsTab from './components/AnalyticsTab';
import SignalValidationTab from './components/SignalValidationTab';
import CitizenView from './components/CitizenView';
import CivicChatbot from './components/CivicChatbot';
import { API_BASE } from './apiConfig';
import { SupportedLanguage, t } from '../../../packages/shared-types';

function LoginScreen({
  onLogin,
  theme,
  onToggleTheme
}: {
  onLogin: (id: string, role?: 'ADMIN' | 'CITIZEN') => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}) {
  const [userId, setUserId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId.trim()) return;
    setIsSubmitting(true);
    setTimeout(() => {
      onLogin(userId.trim().toUpperCase());
    }, 400);
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 relative transition-colors duration-300 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`} style={{ background: theme === 'dark' ? '#0a0b10' : '#f8fafc' }}>
      <div className="absolute inset-0 bg-ambient"></div>

      {/* Floating Theme Switcher */}
      <div className="absolute top-5 right-5 z-20">
        <button
          type="button"
          onClick={onToggleTheme}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className={`w-10 h-10 rounded-full border flex items-center justify-center transition shadow-sm ${
            theme === 'dark'
              ? 'bg-[#1d1f30] border-white/10 text-amber-400 hover:text-white'
              : 'bg-white border-slate-300 text-indigo-600 hover:text-slate-900 shadow-sm'
          }`}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8 animate-fade-up">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 to-blue-500 flex items-center justify-center mx-auto mb-5 shadow-[0_0_40px_rgba(168,85,247,0.35)]">
            <Activity size={32} className="text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-2">CivicPulse</h1>
          <p className="text-slate-600 dark:text-gray-400 font-medium text-sm">One Door for Every Civic Issue.</p>
        </div>

        <div className="bg-white/95 dark:bg-[#161825]/90 backdrop-blur-2xl p-8 rounded-3xl border border-slate-200 dark:border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.08)] dark:shadow-2xl animate-fade-up" style={{ animationDelay: '0.1s' }}>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mb-6 text-center">Sign In</h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-gray-400 uppercase tracking-wider block mb-2">National ID (IC) or Admin Badge</label>
              <div className="relative">
                <input
                  type="text"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder="e.g. 980101-12-1234 or ADM-001"
                  className="w-full bg-slate-50 dark:bg-[#0a0b10] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-gray-500 px-5 py-3.5 rounded-xl border border-slate-300 dark:border-white/10 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all font-medium text-sm"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-gray-100 dark:text-black font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm active:scale-98"
            >
              {isSubmitting ? (
                <RefreshCw size={20} className="animate-spin" />
              ) : (
                <>Continue <ArrowRight size={18} /></>
              )}
            </button>
          </form>

          <div className="mt-8 space-y-3">
            <div 
              onClick={() => onLogin('ADM-001', 'ADMIN')}
              className="flex items-center gap-3 p-3.5 rounded-xl bg-purple-50 hover:bg-purple-100/90 dark:bg-purple-500/10 dark:hover:bg-purple-500/20 border border-purple-200 dark:border-purple-500/20 text-purple-950 dark:text-purple-300 text-xs sm:text-sm cursor-pointer transition group"
              title="Click to quickly launch Admin Dashboard"
            >
              <ShieldCheck size={20} className="shrink-0 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition" />
              <span className="leading-snug">Admin Access: Click to enter as <strong className="font-extrabold text-purple-900 dark:text-white">ADM-001</strong> (Council Dashboard).</span>
            </div>
            <div 
              onClick={() => onLogin('980101-12-1234', 'CITIZEN')}
              className="flex items-center gap-3 p-3.5 rounded-xl bg-blue-50 hover:bg-blue-100/90 dark:bg-blue-500/10 dark:hover:bg-blue-500/20 border border-blue-200 dark:border-blue-500/20 text-blue-950 dark:text-blue-300 text-xs sm:text-sm cursor-pointer transition group"
              title="Click to quickly launch Citizen App"
            >
              <UserCircle2 size={20} className="shrink-0 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition" />
              <span className="leading-snug">Citizen Access: Click to enter as <strong className="font-extrabold text-blue-900 dark:text-white">Citizen</strong> (Resident App).</span>
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
  const [userRole, setUserRole] = useState<'ADMIN' | 'CITIZEN'>('ADMIN');
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [globalSearch, setGlobalSearch] = useState('');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAccountSettingsOpen, setIsAccountSettingsOpen] = useState(false);
  const [isAuditLogsOpen, setIsAuditLogsOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Settings state
  const [adminProfile, setAdminProfile] = useState({
    name: 'Datuk Amirul',
    title: 'Executive Director of Enforcement',
    agency: 'Majlis Bandaraya Petaling Jaya (MBPJ)',
    email: 'amirul.council@mbpj.gov.my',
    alertDigest: 'INSTANT',
    autoEscalations: true,
  });

  const [language, setLanguage] = useState<SupportedLanguage>(() => {
    return (localStorage.getItem('civicpulse_language') as SupportedLanguage) || 'EN';
  });

  const toggleLanguage = () => {
    const next: SupportedLanguage = language === 'EN' ? 'BM' : 'EN';
    setLanguage(next);
    localStorage.setItem('civicpulse_language', next);
    showToast(next === 'BM' ? 'Bahasa papan pemuka ditukar ke Bahasa Melayu 🇲🇾' : 'Dashboard language set to English 🇬🇧');
  };

  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('civicpulse_theme') as 'dark' | 'light') || 'dark';
  });
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: '1', title: 'Action Dispatched', message: 'MBPJ Cleansing unit assigned to Jalan 17/5 drain.', time: '10m ago', read: false, issueId: 'CIV-2026-003891' },
    { id: '2', title: 'Recurrence Flagged', message: 'CIV-2026-004281 flagged as 4x repeat occurrence.', time: '45m ago', read: false, issueId: 'CIV-2026-004281' },
    { id: '3', title: 'Citizen Consensus', message: 'CIV-2026-003910 verified with 75% approval.', time: '2h ago', read: true, issueId: 'CIV-2026-003910' },
  ]);

  const auditLogEntries = [
    { id: 'LOG-8812', timestamp: 'Today, 00:46', user: 'ADM-001', action: 'Administrative Override', details: 'Case CIV-2026-004285 force-closed with budget endorsement note.' },
    { id: 'LOG-8809', timestamp: 'Today, 00:32', user: 'ADM-001', action: 'Auditor Dispatched', details: 'Site inspection order issued for Section 17 Market drainage.' },
    { id: 'LOG-8798', timestamp: 'Today, 00:15', user: 'ADM-001', action: 'Jurisdiction Handover', details: 'Culvert structural issue routed to JKR Federal Road works.' },
    { id: 'LOG-8774', timestamp: 'Yesterday, 23:55', user: 'SYS-AI', action: 'Social Signal Clustered', details: 'Ingested 14 social posts and verified geolocation confidence: HIGH.' },
    { id: 'LOG-8761', timestamp: 'Yesterday, 22:10', user: 'ADM-001', action: 'Status Update', details: 'CIV-2026-003910 moved to IN_PROGRESS.' },
  ];

  const [auditFilter, setAuditFilter] = useState<'ALL' | 'Override' | 'Dispatched' | 'Handover'>('ALL');

  const filteredLogs = auditLogEntries.filter(log => {
    if (auditFilter === 'ALL') return true;
    return log.action.toLowerCase().includes(auditFilter.toLowerCase());
  });

  const unreadNotifsCount = notifications.filter(n => !n.read).length;

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  useEffect(() => {
    fetch(`${API_BASE}/notifications`)
      .then(res => res.json())
      .then(json => {
        if (json.data && Array.isArray(json.data)) setNotifications(json.data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    localStorage.setItem('civicpulse_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
    }
  }, [theme]);

  const handleLogin = (id: string, explicitRole?: 'ADMIN' | 'CITIZEN') => {
    const role = explicitRole || (id.startsWith('ADM-') ? 'ADMIN' : 'CITIZEN');
    if (role === 'CITIZEN') {
      setCurrentUser(id.startsWith('ADM-') ? '980101-12-1234' : id);
    } else {
      setCurrentUser(id.startsWith('ADM-') ? id : 'ADM-001');
    }
    setUserRole(role);
    setIsAuthenticated(true);
  };

  if (!isAuthenticated) {
    return (
      <LoginScreen
        onLogin={handleLogin}
        theme={theme}
        onToggleTheme={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
      />
    );
  }

  // Render Citizen View if logged in as citizen
  if (userRole === 'CITIZEN') {
    const citizenIc = (currentUser && !currentUser.startsWith('ADM-')) ? currentUser : '980101-12-1234';
    return (
      <CitizenView
        userIc={citizenIc}
        language={language}
        onToggleLanguage={(next) => setLanguage(next)}
        onLogout={() => {
          setIsAuthenticated(false);
          setCurrentUser(null);
        }}
      />
    );
  }

  return (
    <div className={`min-h-screen font-sans overflow-x-hidden admin-shell transition-colors duration-300 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`} style={{ background: theme === 'dark' ? '#121420' : '#f8fafc' }}>
      <div className="bg-ambient"></div>

      {/* Global Toast */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-[9999] bg-[#161825] text-white px-5 py-3 rounded-2xl border border-purple-500/40 shadow-2xl flex items-center gap-3 text-xs animate-in fade-in slide-in-from-bottom-2 duration-200">
          <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          <span className="font-semibold">{toastMsg}</span>
        </div>
      )}

      <div className="max-w-[1300px] mx-auto p-4 md:p-6 lg:p-8 relative z-10">

        {/* HEADER */}
        <header className="flex items-center justify-between mb-8 md:mb-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white logo-icon flex items-center justify-center">
              <Activity size={20} className="text-[#121420]" />
            </div>
            <span className="text-xl font-bold tracking-tight">CivicPulse</span>
            <span className="ml-2 px-3 py-1 rounded-full bg-purple-600/15 text-purple-400 border border-purple-500/30 text-[11px] font-bold flex items-center gap-1.5 shadow-sm">
              <ShieldCheck size={13} className="text-purple-400" />
              {t('app.portal.council', language)}
            </span>
          </div>

          <div className={`hidden md:flex rounded-full p-1 border overflow-x-auto hide-scrollbar transition-all ${
            theme === 'dark' ? 'bg-[#1d1f30] border-white/5' : 'bg-slate-200/90 border-slate-300 shadow-inner'
          }`}>
            {[
              { id: 'Dashboard', labelKey: 'nav.dashboard' },
              { id: 'Live Map', labelKey: 'nav.live_map' },
              { id: 'Issues', labelKey: 'nav.issues' },
              { id: 'Analytics', labelKey: 'nav.analytics' },
              { id: 'Signals', labelKey: 'nav.signals' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-5 py-2 rounded-full text-[13px] font-bold transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? (theme === 'dark' ? 'bg-white text-[#121420] shadow-md' : 'bg-slate-900 text-white shadow-md')
                    : (theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-slate-600 hover:text-slate-950')
                }`}
              >
                {t(tab.labelKey, language)}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <div className={`relative flex items-center border rounded-full px-4 h-10 w-[200px] transition-all ${
              theme === 'dark'
                ? 'bg-[#1d1f30] border-white/5 focus-within:border-white/20'
                : 'bg-white border-slate-300 shadow-sm focus-within:border-slate-500'
            }`}>
              <Search size={16} className={`${theme === 'dark' ? 'text-gray-400' : 'text-slate-500'} mr-2 shrink-0`} />
              <input
                type="text"
                placeholder={t('app.search_placeholder', language)}
                value={globalSearch}
                onChange={e => {
                  setGlobalSearch(e.target.value);
                  if (e.target.value && activeTab !== 'Issues') setActiveTab('Issues');
                }}
                className={`bg-transparent text-sm focus:outline-none w-full ${
                  theme === 'dark' ? 'text-white placeholder:text-gray-500' : 'text-slate-900 placeholder:text-slate-400'
                }`}
              />
            </div>

            {/* Language Switcher */}
            <button
              onClick={toggleLanguage}
              title={language === 'EN' ? 'Tukar ke Bahasa Melayu' : 'Switch to English'}
              className={`px-3.5 h-10 rounded-full border flex items-center gap-1.5 font-bold text-xs transition shrink-0 active:scale-95 shadow-sm ${
                theme === 'dark'
                  ? 'bg-[#1d1f30] border-white/5 text-gray-300 hover:text-white'
                  : 'bg-white border-slate-300 text-slate-700 hover:text-slate-900'
              }`}
            >
              <Globe size={15} className="text-amber-500" />
              <span>{language}</span>
            </button>

            <button
              onClick={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className={`w-10 h-10 rounded-full border flex items-center justify-center transition shrink-0 ${
                theme === 'dark'
                  ? 'bg-[#1d1f30] border-white/5 text-gray-400 hover:text-white'
                  : 'bg-white border-slate-300 text-slate-700 hover:text-slate-900 shadow-sm'
              }`}
            >
              {theme === 'dark' ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} className="text-indigo-600" />}
            </button>

            {/* Notification Bell with Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsNotifOpen(prev => !prev)}
                title="Notifications"
                className={`w-10 h-10 rounded-full border flex items-center justify-center transition relative shrink-0 active:scale-95 ${
                  theme === 'dark'
                    ? 'bg-[#1d1f30] border-white/5 text-gray-400 hover:text-white'
                    : 'bg-white border-slate-300 text-slate-700 hover:text-slate-900 shadow-sm'
                }`}
              >
                <Bell size={18} />
                {unreadNotifsCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-[10px] font-black flex items-center justify-center shadow-[0_0_8px_rgba(239,68,68,0.7)] animate-pulse">
                    {unreadNotifsCount}
                  </span>
                )}
              </button>

              {isNotifOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsNotifOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 w-[340px] sm:w-[380px] bg-[#1d1f30] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-4 border-b border-white/10 flex items-center justify-between bg-[#161825]">
                      <div className="flex items-center gap-2">
                        <Bell size={16} className="text-purple-400" />
                        <h4 className="font-bold text-sm text-white">{language === 'BM' ? 'Pemberitahuan' : 'Notifications'}</h4>
                        {unreadNotifsCount > 0 && (
                          <span className="text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full">
                            {unreadNotifsCount} {language === 'BM' ? 'baru' : 'new'}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
                            showToast(language === 'BM' ? 'Semua pemberitahuan ditandakan sebagai telah dibaca.' : 'All notifications marked as read.');
                          }}
                          className="text-[11px] text-gray-400 hover:text-purple-300 transition flex items-center gap-1 font-medium"
                          title="Mark all as read"
                        >
                          <CheckCheck size={13} /> {language === 'BM' ? 'Tanda semua dibaca' : 'Read all'}
                        </button>
                        <button
                          onClick={() => {
                            setNotifications([]);
                            showToast(language === 'BM' ? 'Pusat pemberitahuan dikosongkan.' : 'Notification center cleared.');
                          }}
                          className="text-[11px] text-gray-500 hover:text-red-400 transition p-1"
                          title="Clear all"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    <div className="max-h-[360px] overflow-y-auto divide-y divide-white/5 custom-scrollbar">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center text-gray-500 text-xs">
                          <Check size={28} className="mx-auto mb-2 text-emerald-500/60" />
                          <p className="font-medium text-gray-400">{language === 'BM' ? 'Semua telah selesai!' : 'All caught up!'}</p>
                          <p className="mt-1">{language === 'BM' ? 'Tiada pemberitahuan belum selesai.' : 'No pending notifications.'}</p>
                        </div>
                      ) : (
                        notifications.map(notif => (
                          <div
                            key={notif.id}
                            onClick={() => {
                              setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n));
                              if (notif.issueId) {
                                setGlobalSearch(notif.issueId);
                                setActiveTab('Issues');
                                setIsNotifOpen(false);
                              }
                            }}
                            className={`p-3.5 hover:bg-white/5 transition cursor-pointer flex gap-3 items-start ${
                              notif.read ? 'opacity-65' : 'bg-purple-500/5'
                            }`}
                          >
                            <div className="mt-0.5 w-2 h-2 rounded-full shrink-0">
                              {!notif.read && <div className="w-2 h-2 bg-purple-400 rounded-full shadow-[0_0_6px_rgba(168,85,247,0.8)]" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-0.5">
                                <p className="text-xs font-bold text-white truncate">{notif.title}</p>
                                <span className="text-[10px] text-gray-500 font-mono shrink-0 ml-2">{notif.time}</span>
                              </div>
                              <p className="text-[11px] text-gray-300 leading-snug line-clamp-2">{notif.message}</p>
                              {notif.issueId && (
                                <span className="inline-block mt-1.5 text-[9px] font-mono text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/20">
                                  Jump to {notif.issueId} →
                                </span>
                              )}
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setNotifications(prev => prev.filter(n => n.id !== notif.id));
                              }}
                              className="text-gray-500 hover:text-white p-1 rounded-md opacity-0 group-hover:opacity-100 transition"
                              title="Dismiss"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Profile Dropdown */}
            <div
              className="relative shrink-0"
              onMouseEnter={() => setIsProfileOpen(true)}
              onMouseLeave={() => setIsProfileOpen(false)}
            >
              <div
                onClick={() => setIsProfileOpen(prev => !prev)}
                className="w-10 h-10 rounded-full bg-gradient-to-tr from-pink-500 to-orange-400 p-0.5 cursor-pointer hover:scale-105 transition-transform"
              >
                <img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop" alt="Avatar" className="w-full h-full rounded-full border-2 border-[#121420] object-cover" />
              </div>

              {isProfileOpen && (
                <div className="absolute top-full right-0 pt-2 z-50">
                  <div className="w-[240px] bg-[#1d1f30] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-fade-up">
                    <div className="p-4 border-b border-white/5">
                      <p className="font-bold text-white text-sm">{currentUser === 'ADM-001' ? adminProfile.name : currentUser}</p>
                      <p className="text-[11px] text-gray-400">{currentUser === 'ADM-001' ? adminProfile.title : 'Local Official'}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
                        <span className="text-[10px] text-green-400 font-bold uppercase tracking-wider">Online</span>
                      </div>
                    </div>
                    <div className="p-2 space-y-0.5">
                      <button
                        onClick={() => {
                          setIsAccountSettingsOpen(true);
                          setIsProfileOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-white/5 rounded-lg transition flex items-center justify-between"
                      >
                        <span>{language === 'BM' ? 'Tetapan Akaun' : 'Account Settings'}</span>
                        <Sliders size={13} className="text-gray-500" />
                      </button>
                      <button
                        onClick={() => {
                          setIsAuditLogsOpen(true);
                          setIsProfileOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-white/5 rounded-lg transition flex items-center justify-between"
                      >
                        <span>{language === 'BM' ? 'Log Audit' : 'Audit Logs'}</span>
                        <FileText size={13} className="text-gray-500" />
                      </button>
                      <div className="h-[1px] bg-white/5 my-1 mx-2"></div>
                      <button
                        onClick={() => {
                          setCurrentUser(null);
                          setIsAuthenticated(false);
                        }}
                        className="w-full text-left px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 rounded-lg transition"
                      >
                        {language === 'BM' ? 'Log Keluar' : 'Sign Out'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {activeTab === 'Dashboard' && (
          <DashboardTab
            setActiveTab={setActiveTab}
            language={language}
            onSelectIssue={(id) => {
              setGlobalSearch(id);
              setActiveTab('Issues');
            }}
            onSelectCategory={(cat) => {
              setGlobalSearch(cat);
              setActiveTab('Issues');
            }}
          />
        )}
        {activeTab === 'Live Map' && <LiveMapTab />}
        {activeTab === 'Issues' && <AllIssuesTab externalSearchQuery={globalSearch} language={language} />}
        {activeTab === 'Analytics' && <AnalyticsTab />}
        {activeTab === 'Signals' && <SignalValidationTab />}

      </div>

      {/* ── ACCOUNT SETTINGS MODAL ── */}
      {isAccountSettingsOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setIsAccountSettingsOpen(false)} />
          <div className="relative w-full max-w-lg bg-white dark:bg-[#161825] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl p-6 text-slate-900 dark:text-white z-10 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-white/10 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400">
                  <Sliders size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white">{language === 'BM' ? 'Tetapan Akaun Majlis' : 'Council Account Settings'}</h3>
                  <p className="text-xs text-slate-500 dark:text-gray-400">{language === 'BM' ? 'Urus kredensial pegawai dan peraturan amaran' : 'Manage officer credentials and alert rules'}</p>
                </div>
              </div>
              <button onClick={() => setIsAccountSettingsOpen(false)} className="text-slate-400 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white p-1 rounded-lg">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="text-slate-700 dark:text-gray-400 font-semibold block mb-1.5">Official Name</label>
                <input
                  type="text"
                  value={adminProfile.name}
                  onChange={e => setAdminProfile(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-slate-50 dark:bg-[#0f111a] border border-slate-300 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-slate-700 dark:text-gray-400 font-semibold block mb-1.5">Official Title & Appointment</label>
                <input
                  type="text"
                  value={adminProfile.title}
                  onChange={e => setAdminProfile(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full bg-slate-50 dark:bg-[#0f111a] border border-slate-300 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-slate-700 dark:text-gray-400 font-semibold block mb-1.5">Governing Authority</label>
                <input
                  type="text"
                  value={adminProfile.agency}
                  onChange={e => setAdminProfile(prev => ({ ...prev, agency: e.target.value }))}
                  className="w-full bg-slate-50 dark:bg-[#0f111a] border border-slate-300 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-slate-700 dark:text-gray-400 font-semibold block mb-1.5">Government Email</label>
                <input
                  type="email"
                  value={adminProfile.email}
                  onChange={e => setAdminProfile(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full bg-slate-50 dark:bg-[#0f111a] border border-slate-300 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="p-3 bg-slate-100 dark:bg-[#1d1f30] rounded-xl border border-slate-200 dark:border-white/5 space-y-2">
                <p className="font-bold text-slate-800 dark:text-gray-300">Council Notification Policy</p>
                <div className="flex gap-2">
                  {(['INSTANT', 'HOURLY_DIGEST', 'CRITICAL_ONLY'] as const).map(mode => (
                    <button
                      key={mode}
                      onClick={() => setAdminProfile(prev => ({ ...prev, alertDigest: mode }))}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition ${
                        adminProfile.alertDigest === mode
                          ? 'bg-purple-600 text-white border-purple-500 shadow-xs'
                          : 'bg-white dark:bg-[#121420] text-slate-600 dark:text-gray-400 border-slate-300 dark:border-white/5 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {mode.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 mt-6 pt-4 border-t border-slate-200 dark:border-white/10">
              <button
                onClick={() => setIsAccountSettingsOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition"
              >
                {language === 'BM' ? 'Batal' : 'Cancel'}
              </button>
              <button
                onClick={() => {
                  setIsAccountSettingsOpen(false);
                  showToast(language === 'BM' ? 'Pilihan akaun berjaya dikemas kini.' : 'Account preferences updated successfully.');
                }}
                className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition shadow-md active:scale-95"
              >
                {language === 'BM' ? 'Simpan Pilihan' : 'Save Preferences'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── AUDIT LOGS MODAL ── */}
      {isAuditLogsOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setIsAuditLogsOpen(false)} />
          <div className="relative w-full max-w-2xl bg-white dark:bg-[#161825] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl p-6 text-slate-900 dark:text-white z-10 animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-white/10 mb-4 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <Shield size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white">Executive Audit Trail</h3>
                  <p className="text-xs text-slate-500 dark:text-gray-400">Immutable ledger of council actions & dispatch authorizations</p>
                </div>
              </div>
              <button onClick={() => setIsAuditLogsOpen(false)} className="text-slate-400 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white p-1 rounded-lg">
                <X size={18} />
              </button>
            </div>

            <div className="flex items-center justify-between mb-4 shrink-0">
              <div className="flex gap-1.5 bg-slate-100 dark:bg-[#0f111a] p-1 rounded-xl border border-slate-200 dark:border-white/5 text-[11px]">
                {(['ALL', 'Override', 'Dispatched', 'Handover'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setAuditFilter(f)}
                    className={`px-3 py-1 rounded-lg font-medium transition ${
                      auditFilter === f ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-gray-400 hover:text-slate-950 dark:hover:text-white'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>

              <button
                onClick={() => {
                  const csvContent = "data:text/csv;charset=utf-8," + ["Log ID,Timestamp,User,Action,Details", ...auditLogEntries.map(e => `${e.id},${e.timestamp},${e.user},${e.action},"${e.details}"`)].join("\n");
                  const encodedUri = encodeURI(csvContent);
                  const link = document.createElement("a");
                  link.setAttribute("href", encodedUri);
                  link.setAttribute("download", `civicpulse_audit_log_${Date.now()}.csv`);
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  showToast('Audit log CSV exported.');
                }}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-[#1d1f30] dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition active:scale-95"
              >
                <Download size={13} /> Export CSV
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5 custom-scrollbar pr-1">
              {filteredLogs.map(log => (
                <div key={log.id} className="p-3.5 bg-slate-50 dark:bg-[#1d1f30]/70 rounded-xl border border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10 transition">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-500/20 font-bold">
                        {log.id}
                      </span>
                      <span className="text-xs font-bold text-slate-900 dark:text-white">{log.action}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-gray-500 font-mono">
                      <Clock size={11} /> {log.timestamp}
                    </div>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-gray-300 leading-relaxed">{log.details}</p>
                  <p className="text-[10px] text-slate-500 dark:text-gray-500 mt-2 font-mono">Authorized by: <strong className="text-slate-800 dark:text-gray-400">{log.user}</strong></p>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-white/10 flex justify-end mt-4 shrink-0">
              <button
                onClick={() => setIsAuditLogsOpen(false)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-black dark:hover:bg-gray-200 rounded-xl text-xs font-bold transition"
              >
                Close Audit Trail
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* FLOATING AI CHATBOT (COUNCIL CO-PILOT) */}
      <CivicChatbot
        role="ADMIN"
        language={language}
        onToggleLanguage={toggleLanguage}
        onNavigateTab={(tab) => {
          if (['Dashboard', 'Live Map', 'Issues', 'Analytics', 'Signals'].includes(tab)) {
            setActiveTab(tab);
          }
        }}
      />
    </div>
  );
}
