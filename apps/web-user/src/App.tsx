import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, Tooltip as LeafletTooltip } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  MapPin, Bell, Plus, Home, Map as MapIcon,
  Activity, User, Clock, ShieldCheck, ThumbsUp, X, Image as ImageIcon,
  CheckCircle2, HelpCircle, ChevronRight, Settings, LogOut, Globe, Sun, Moon, Info,
  Check, CheckCheck, Bot, Trash2
} from 'lucide-react';
import { INITIAL_ISSUES } from './mockData';
import {
  CommunityIssue,
  IssueCategory,
  CitizenReport,
  VerificationFeedback,
  registerAffectedEndorsement,
  evaluateVerificationResolution,
  checkPotentialRecurrence,
  SupportedLanguage,
  translateTitle,
  translateDescription,
  translateTimeline,
  translateNotification,
  translateTimeAgo
} from '../../../packages/shared-types';
import { CivicChatbot } from './components/CivicChatbot';
import { API_BASE } from './apiConfig';

const categoryEmoji: Record<string, string> = {
  ROADS: '🛣️', DRAINAGE: '🌊', WASTE: '🗑️', LIGHTING: '💡', FALLEN_TREES: '🌳',
  OBSTRUCTION: '🚧', FACILITIES: '🏞️', PEDESTRIAN: '🚶', HAZARD: '⚠️', ENVIRONMENT: '🌱', OTHER: '📋',
};

const getCategoryText = (cat: string, lang: SupportedLanguage = 'EN') => {
  if (lang !== 'BM') return cat;
  const map: Record<string, string> = {
    DRAINAGE: 'Saliran',
    ROADS: 'Jalan Raya',
    WASTE: 'Sisa/Sampah',
    LIGHTING: 'Lampu Jalan',
    FALLEN_TREES: 'Pokok Tumbang',
    OBSTRUCTION: 'Halangan',
    FACILITIES: 'Kemudahan',
    HAZARD: 'Bahaya Awam',
    ENVIRONMENT: 'Alam Sekitar',
    PEDESTRIAN: 'Pejalan Kaki',
    OTHER: 'Lain-lain',
  };
  return map[cat] || cat;
};

const getStatusText = (status: string, lang: SupportedLanguage = 'EN') => {
  if (lang !== 'BM') return status.replace(/_/g, ' ');
  const map: Record<string, string> = {
    REPORTED: 'Baru Dilapor',
    IN_PROGRESS: 'Dalam Tindakan',
    MARKED_RESOLVED: 'Ditandai Selesai',
    COMMUNITY_VERIFIED: 'Disahkan Komuniti',
    DISPUTED: 'Dipertikaikan',
    VERIFIED: 'Disahkan',
  };
  return map[status] || status.replace(/_/g, ' ');
};

// Create custom circular badge icons matching admin dashboard
const createCustomUserIcon = (issue: CommunityIssue) => {
  const isHighImpact = (issue.affectedCount && issue.affectedCount >= 25) || issue.isRecurring;
  const isResolved = issue.status === 'COMMUNITY_VERIFIED' || issue.status === 'MARKED_RESOLVED';
  const color = isResolved ? '#10b981' : isHighImpact ? '#ef4444' : '#3b82f6';

  return L.divIcon({
    className: 'custom-leaflet-icon',
    html: `
      <div style="
        background: ${color}; 
        width: 34px; 
        height: 34px; 
        border-radius: 50%; 
        border: 2.5px solid white;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 14px rgba(0,0,0,0.35);
        font-size: 16px;
        position: relative;
        transition: transform 0.2s ease;
      ">
        ${categoryEmoji[issue.category] || '📋'}
      </div>
      ${isHighImpact ? `<div style="position: absolute; top: -3px; right: -3px; width: 12px; height: 12px; background: white; border-radius: 50%; display: flex; align-items: center; justify-content: center;"><div style="width: 8px; height: 8px; background: #ef4444; border-radius: 50%; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div></div>` : ''}
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -18]
  });
};

// Helper component for tapping location on the modal map
function LocationPickerMarker({ position, setPosition, setAddress }: {
  position: [number, number];
  setPosition: (pos: [number, number]) => void;
  setAddress: (addr: string) => void;
}) {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      setPosition([lat, lng]);
      setAddress(`Pin: ${lat.toFixed(4)}, ${lng.toFixed(4)} (Jalan 17/5, Section 17)`);
    },
  });

  return <Marker position={position} />;
}

// Mock resolved issues for verification
const MOCK_RESOLVED_ISSUES: CommunityIssue[] = [
  {
    id: 'CIV-2026-003910',
    title: 'Drain Clearing at Jalan 17/5',
    category: 'DRAINAGE',
    description: 'PBT contractor cleared sediment and unblocked underground drain segment.',
    location: { lat: 3.1188, lng: 101.6235, address: 'Jalan 17/5, Section 17', neighborhood: 'Petaling Jaya' },
    affectedCount: 42,
    evidenceCount: 4,
    occurrenceCount: 2,
    isRecurring: false,
    status: 'MARKED_RESOLVED',
    communityVerificationRate: 75,
    timeline: [
      { date: '25 Sep', title: 'Reported by community' },
      { date: '28 Sep', title: 'PBT completed cleaning' },
      { date: '30 Sep', title: 'Marked resolved by local council' }
    ],
    images: ['https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=500&auto=format&fit=crop'],
    createdAt: '2026-09-25'
  },
  {
    id: 'CIV-2026-003882',
    title: 'Streetlight Bulb Replacement',
    category: 'LIGHTING',
    description: 'Replaced malfunctioning LED streetlight lamp near traffic junction.',
    location: { lat: 3.1210, lng: 101.6250, address: 'SS2 Junction', neighborhood: 'Petaling Jaya' },
    affectedCount: 15,
    evidenceCount: 2,
    occurrenceCount: 1,
    isRecurring: false,
    status: 'MARKED_RESOLVED',
    communityVerificationRate: 92,
    timeline: [
      { date: '20 Sep', title: 'Reported by Citizen' },
      { date: '22 Sep', title: 'PBT maintenance completed' }
    ],
    images: ['https://images.unsplash.com/photo-1509114397022-ed747cca3f65?w=500&auto=format&fit=crop'],
    createdAt: '2026-09-20'
  }
];

export default function App() {
  const [issues, setIssues] = useState<CommunityIssue[]>([...INITIAL_ISSUES, ...MOCK_RESOLVED_ISSUES]);
  const [selectedIssue, setSelectedIssue] = useState<CommunityIssue | null>(issues[0]);
  const [selectedMapIssue, setSelectedMapIssue] = useState<CommunityIssue | null>(null);
  const [userVerifications, setUserVerifications] = useState<Record<string, 'FIXED' | 'PARTIAL' | 'NOT_FIXED'>>({});
  const [activeTab, setActiveTab] = useState<'home' | 'map' | 'activity' | 'profile'>('home');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [activityFilter, setActivityFilter] = useState<'all' | 'reported' | 'backed' | 'verified'>('all');
  const [showReportModal, setShowReportModal] = useState(false);

  // Form State
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<IssueCategory>('DRAINAGE');
  const [newDescription, setNewDescription] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<[number, number]>([3.1186, 101.6231]);
  const [autoAddress, setAutoAddress] = useState('Jalan 17/5, Section 17, Petaling Jaya');
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [nlpAnalysis, setNlpAnalysis] = useState<any | null>(null);
  const [isNlpAnalyzing, setIsNlpAnalyzing] = useState(false);

  // Filter lists
  const activeIssues = issues.filter(i => i.status !== 'MARKED_RESOLVED' && i.status !== 'COMMUNITY_VERIFIED');
  const pbtResolvedIssues = issues.filter(i => i.status === 'MARKED_RESOLVED' || i.status === 'COMMUNITY_VERIFIED');

  // Notifications & In-App Alerts State
  const [showNotifSheet, setShowNotifSheet] = useState(false);
  const [notifications, setNotifications] = useState<Array<{ id: string; title: string; message: string; time: string; unread: boolean; issueId?: string }>>([
    { id: '1', title: 'Work Dispatched', message: 'MBPJ Cleansing unit assigned to Jalan 17/5 drain.', time: '10m ago', unread: true },
    { id: '2', title: 'Recurrence Flagged', message: 'CIV-2026-004281 flagged as repeat occurrence.', time: '45m ago', unread: true, issueId: 'CIV-2026-004281' },
    { id: '3', title: 'Flood Risk Warning', message: 'Heavy evening downpour anticipated near Section 17.', time: '3h ago', unread: false }
  ]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [mapFilter, setMapFilter] = useState<'all' | 'critical' | 'active' | 'resolved'>('all');
  const [pushNotifsEnabled, setPushNotifsEnabled] = useState(true);
  const [language, setLanguage] = useState<SupportedLanguage>(() => {
    return (localStorage.getItem('civicpulse_language') as SupportedLanguage) || 'EN';
  });

  const toggleLanguage = () => {
    const next: SupportedLanguage = language === 'EN' ? 'BM' : 'EN';
    setLanguage(next);
    localStorage.setItem('civicpulse_language', next);
    setToastMessage(next === 'BM' ? 'Bahasa permohonan ditukar ke Bahasa Melayu 🇲🇾' : 'Application language set to English 🇬🇧');
  };

  const filteredMapIssues = issues.filter(issue => {
    if (mapFilter === 'critical') return issue.isRecurring || (issue.affectedCount && issue.affectedCount >= 20);
    if (mapFilter === 'active') return issue.status !== 'MARKED_RESOLVED' && issue.status !== 'COMMUNITY_VERIFIED';
    if (mapFilter === 'resolved') return issue.status === 'MARKED_RESOLVED' || issue.status === 'COMMUNITY_VERIFIED';
    return true;
  });

  // Calculate Ring Color based on percentage
  const getRingColor = (percentage: number) => {
    if (percentage >= 80) return { stroke: '#10B981', bg: 'bg-emerald-100', text: 'text-emerald-700' };
    if (percentage >= 40) return { stroke: '#F59E0B', bg: 'bg-amber-100', text: 'text-amber-700' };
    return { stroke: '#EF4444', bg: 'bg-rose-100', text: 'text-rose-700' };
  };

  // Dark / Light Theme State synchronized with localStorage
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('civicpulse_theme') as 'dark' | 'light') || 'light';
  });

  useEffect(() => {
    localStorage.setItem('civicpulse_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Read IC from URL parameter if directed from the Admin login gate
  const [userIc] = useState<string>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('ic') || '';
  });

  // Track user-affected endorsements to prevent double-counting per resident (CA)
  const [userEndorsedSet] = useState<Set<string>>(() => new Set());
  // Store individual verification records
  const [verificationFeedbackMap, setVerificationFeedbackMap] = useState<Record<string, VerificationFeedback[]>>({});


  // Fetch live issues from database on load and refresh
  const fetchLiveIssues = async () => {
    try {
      const res = await fetch(`${API_BASE}/issues`);
      if (res.ok) {
        const json = await res.json();
        if (json.data && Array.isArray(json.data) && json.data.length > 0) {
          setIssues(json.data);
          if (!selectedIssue || !json.data.some((i: CommunityIssue) => i.id === selectedIssue.id)) {
            setSelectedIssue(json.data[0]);
          }
        }
      }
    } catch (e) {
      console.warn('Backend server not reachable, using localized state:', e);
    }
  };

  useEffect(() => {
    fetchLiveIssues();
    const interval = setInterval(fetchLiveIssues, 10000);

    fetch(`${API_BASE}/notifications`)
      .then(res => res.json())
      .then(json => {
        if (json.data && Array.isArray(json.data) && json.data.length > 0) {
          setNotifications(json.data.map((n: any) => ({
            id: n.id,
            title: n.title,
            message: n.message,
            time: n.time || 'Today',
            unread: !n.read
          })));
        }
      })
      .catch(() => {});

    return () => clearInterval(interval);
  }, []);

  const handleAffectedClick = async (issueId: string) => {
    const currentUserId = 'RESIDENT-CA-01'; // Current logged-in resident (Chariya)

    // Optimistic UI update
    setIssues(prev => prev.map(issue => {
      if (issue.id === issueId) {
        const { updatedIssue } = registerAffectedEndorsement(issue, currentUserId, userEndorsedSet);
        return updatedIssue;
      }
      return issue;
    }));
    if (selectedIssue && selectedIssue.id === issueId) {
      const { updatedIssue } = registerAffectedEndorsement(selectedIssue, currentUserId, userEndorsedSet);
      setSelectedIssue(updatedIssue);
    }

    try {
      await fetch(`${API_BASE}/issues/${issueId}/endorse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ residentId: currentUserId })
      });
      fetchLiveIssues();
    } catch (err) {
      console.warn('API endorse sync failed, retained in client state:', err);
    }
  };

  const handleVerifyVote = async (issueId: string, vote: 'FIXED' | 'PARTIAL' | 'NOT_FIXED') => {
    setUserVerifications(prev => ({ ...prev, [issueId]: vote }));

    const feedbackRecord: VerificationFeedback = {
      id: `VF-${Date.now()}`,
      issueId,
      residentId: 'RESIDENT-CA-01',
      verdict: vote,
      submittedAt: new Date().toISOString(),
    };

    const existingFeedbacks = verificationFeedbackMap[issueId] || [];
    const updatedFeedbacks = [
      ...existingFeedbacks.filter(f => f.residentId !== 'RESIDENT-CA-01'),
      feedbackRecord
    ];
    setVerificationFeedbackMap(prev => ({ ...prev, [issueId]: updatedFeedbacks }));

    // Evaluate verification with multi-vote quorum safeguards
    const evaluation = evaluateVerificationResolution(updatedFeedbacks, 3);

    setIssues(prev => prev.map(issue => {
      if (issue.id === issueId) {
        return {
          ...issue,
          communityVerificationRate: evaluation.verificationRate,
          status: evaluation.statusRecommendation,
          verificationCounts: {
            fixed: evaluation.fixedCount,
            partial: evaluation.partialCount,
            notFixed: evaluation.notFixedCount,
          }
        };
      }
      return issue;
    }));

    if (selectedIssue && selectedIssue.id === issueId) {
      setSelectedIssue(prev => prev ? {
        ...prev,
        communityVerificationRate: evaluation.verificationRate,
        status: evaluation.statusRecommendation,
        verificationCounts: {
          fixed: evaluation.fixedCount,
          partial: evaluation.partialCount,
          notFixed: evaluation.notFixedCount,
        }
      } : null);
    }

    try {
      await fetch(`${API_BASE}/issues/${issueId}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verdict: vote, residentId: 'RESIDENT-CA-01' })
      });
      fetchLiveIssues();
    } catch (err) {
      console.warn('API verify sync failed, retained in client state:', err);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newImageUrls = Array.from(files).map(file => URL.createObjectURL(file));
      setUploadedImages(prev => [...prev, ...newImageUrls]);
    }
  };

  const removeImage = (indexToRemove: number) => {
    setUploadedImages(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleCreateReport = async (e: React.FormEvent) => {
    e.preventDefault();

    const finalImages = uploadedImages.length > 0
      ? uploadedImages
      : ['https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=500&auto=format&fit=crop'];

    const todayStr = new Date().toISOString().split('T')[0];

    try {
      const res = await fetch(`${API_BASE}/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle,
          category: newCategory,
          description: newDescription,
          location: {
            lat: selectedLocation[0],
            lng: selectedLocation[1],
            address: autoAddress,
            neighborhood: 'Petaling Jaya'
          },
          images: finalImages,
          reporterId: userIc || 'RESIDENT-CA-01'
        })
      });

      if (res.ok) {
        const json = await res.json();
        if (json.issue) {
          setIssues(prev => [json.issue, ...prev.filter(i => i.id !== json.issue.id)]);
          setSelectedIssue(json.issue);
        }
      } else {
        throw new Error('API returned non-200');
      }
    } catch (err) {
      console.warn('API submission failed, falling back to local domain handler:', err);
      // Fallback local logic
      const recurrenceMatch = checkPotentialRecurrence(
        {
          lat: selectedLocation[0],
          lng: selectedLocation[1],
          category: newCategory,
          submittedAt: todayStr,
        },
        pbtResolvedIssues
      );

      const newIssueId = `CIV-2026-00${Math.floor(1000 + Math.random() * 9000)}`;
      const isRecurring = recurrenceMatch !== null;

      const newIssue: CommunityIssue = {
        id: newIssueId,
        title: newTitle,
        category: newCategory,
        description: newDescription,
        location: {
          lat: selectedLocation[0],
          lng: selectedLocation[1],
          address: autoAddress,
          neighborhood: 'Petaling Jaya'
        },
        reportCount: 1,
        affectedCount: 1,
        evidenceCount: finalImages.length,
        occurrenceCount: isRecurring ? 2 : 1,
        isRecurring,
        recurrenceLinks: recurrenceMatch ? [{ ...recurrenceMatch, currentIssueId: newIssueId }] : undefined,
        status: 'REPORTED',
        timeline: [
          { date: 'Today', title: 'Submitted by you' },
          ...(isRecurring ? [{ date: 'Today', title: 'Flagged as potential recurrence near past resolved incident' }] : [])
        ],
        images: finalImages,
        createdAt: todayStr
      };

      setIssues([newIssue, ...issues]);
      setSelectedIssue(newIssue);
    }

    setShowReportModal(false);
    setNewTitle('');
    setNewDescription('');
    setUploadedImages([]);
    fetchLiveIssues();
  };

  const activeVerificationRate = selectedIssue?.communityVerificationRate ?? 75;
  const ringStyle = getRingColor(activeVerificationRate);
  const isSelectedResolved = selectedIssue?.status === 'MARKED_RESOLVED' || selectedIssue?.status === 'COMMUNITY_VERIFIED';
  const userVoteForSelected = selectedIssue ? userVerifications[selectedIssue.id] : undefined;

  return (
    <div className={`max-w-md mx-auto min-h-screen flex flex-col justify-between shadow-2xl relative font-sans transition-colors duration-300 ${theme === 'dark' ? 'bg-[#0f111a] text-slate-100' : 'bg-slate-100 text-slate-900'
      }`}>

      {/* SCROLLABLE MAIN BODY */}
      <div className="flex-1 overflow-y-auto pb-28">

        {/* COMPACT PERSISTENT TOP APP BAR (Consistent across all pages) */}
        <div className="bg-white text-slate-800 dark:bg-[#121420] dark:text-white px-5 py-4 flex justify-between items-center border-b border-slate-200 dark:border-white/10 sticky top-0 z-[9100] backdrop-blur-xl shadow-sm transition-colors relative">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center shadow-md">
              <Activity size={18} className="text-white" />
            </div>
            <div>
              <span className="text-sm font-bold tracking-tight block text-slate-900 dark:text-white">CivicPulse</span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">Taman ABC, PJ</span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={toggleLanguage}
              title={`Switch to ${language === 'EN' ? 'Bahasa Melayu' : 'English'}`}
              className="px-2.5 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-white/10 dark:hover:bg-white/20 dark:text-white transition flex items-center justify-center border border-slate-200 dark:border-white/5 font-bold text-xs gap-1"
            >
              <Globe size={13} className="text-blue-500" />
              <span>{language}</span>
            </button>
            <button
              onClick={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-white/10 dark:hover:bg-white/20 dark:text-white transition flex items-center justify-center border border-slate-200 dark:border-white/5"
            >
              {theme === 'dark' ? <Sun size={15} className="text-amber-300" /> : <Moon size={15} className="text-indigo-600" />}
            </button>
            <button
              onClick={() => setShowNotifSheet(prev => !prev)}
              title="Notifications"
              className={`w-8 h-8 rounded-full transition flex items-center justify-center relative border ${
                showNotifSheet 
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm' 
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-white/10 dark:hover:bg-white/20 dark:text-white border-slate-200 dark:border-white/5'
              }`}
            >
              <Bell size={15} />
              {notifications.some(n => n.unread) && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white dark:ring-[#121420]"></span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              title="View Profile"
              className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-500/20 border border-indigo-200 dark:border-indigo-400/40 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold text-xs hover:scale-105 transition"
            >
              CA
            </button>
          </div>

          {/* IN-APP NOTIFICATION DROPDOWN (Inside phone layout, no full screen blur, matching admin) */}
          {showNotifSheet && (
            <>
              {/* Transparent backdrop for outside clicks - no blur, no blackout */}
              <div 
                className="fixed inset-0 z-40 cursor-default" 
                onClick={() => setShowNotifSheet(false)} 
              />
              
              <div 
                onClick={e => e.stopPropagation()}
                className="absolute right-3 left-3 sm:left-auto top-full mt-2 sm:w-[380px] bg-white dark:bg-[#161825] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200 text-left"
              >
                <div className="p-3.5 border-b border-slate-100 dark:border-white/10 flex items-center justify-between bg-slate-50/80 dark:bg-[#121420]/80">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400">
                      <Bell size={15} />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-extrabold text-xs text-slate-900 dark:text-white">
                          {language === 'BM' ? 'Pemberitahuan Komuniti' : 'Community Alerts'}
                        </h4>
                        {notifications.filter(n => n.unread).length > 0 && (
                          <span className="text-[9px] font-bold bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 border border-indigo-500/30 px-1.5 py-0.5 rounded-full">
                            {notifications.filter(n => n.unread).length} {language === 'BM' ? 'baru' : 'new'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {notifications.some(n => n.unread) && (
                      <button 
                        onClick={async () => {
                          setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
                          try {
                            await fetch(`${API_BASE}/notifications/read-all`, { method: 'POST' });
                          } catch (e) {}
                        }}
                        className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded-lg transition flex items-center gap-1 border border-indigo-100 dark:border-indigo-800/40"
                        title="Mark all as read"
                      >
                        <CheckCheck size={12} />
                        <span>{language === 'BM' ? 'Dibaca' : 'Read all'}</span>
                      </button>
                    )}
                    <button
                      onClick={() => setShowNotifSheet(false)}
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-white/10 transition"
                      title="Close"
                    >
                      <X size={15} />
                    </button>
                  </div>
                </div>

                <div className="max-h-[350px] overflow-y-auto divide-y divide-slate-100 dark:divide-white/5 custom-scrollbar">
                  {notifications.length === 0 ? (
                    <div className="p-7 text-center text-slate-400">
                      <Check size={26} className="mx-auto mb-2 text-emerald-500/80" />
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        {language === 'BM' ? 'Semua telah selesai!' : 'All caught up!'}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {language === 'BM' ? 'Tiada pemberitahuan baharu.' : 'No new notifications.'}
                      </p>
                    </div>
                  ) : (
                    notifications.map(n => (
                      <div 
                        key={n.id} 
                        onClick={() => {
                          if (n.unread) {
                            setNotifications(prev => prev.map(item => item.id === n.id ? { ...item, unread: false } : item));
                          }
                          if (n.issueId) {
                            const found = issues.find(i => i.id === n.issueId);
                            if (found) {
                              setSelectedIssue(found);
                              setActiveTab('activity');
                              setShowNotifSheet(false);
                            }
                          }
                        }}
                        className={`p-3.5 transition cursor-pointer flex gap-2.5 items-start ${
                          n.unread 
                            ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-l-4 border-l-indigo-600' 
                            : 'hover:bg-slate-50 dark:hover:bg-white/5 opacity-80'
                        }`}
                      >
                        <div className="mt-1 w-2 h-2 rounded-full shrink-0">
                          {n.unread ? (
                            <span className="w-2 h-2 block rounded-full bg-indigo-600 shadow-[0_0_6px_rgba(79,70,229,0.8)]" />
                          ) : (
                            <Check size={11} className="text-slate-400 shrink-0" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1 mb-0.5">
                            <p className={`text-xs font-bold truncate ${n.unread ? 'text-indigo-950 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                              {translateNotification(n.title, language)}
                            </p>
                            <span className="text-[10px] text-slate-400 font-mono shrink-0 ml-1">
                              {translateTimeAgo(n.time, language)}
                            </span>
                          </div>
                          <p className={`text-[11px] leading-snug line-clamp-2 ${n.unread ? 'text-slate-800 dark:text-slate-200' : 'text-slate-500 dark:text-slate-400'}`}>
                            {translateNotification(n.message, language)}
                          </p>
                          {n.issueId && (
                            <span className="inline-block mt-1 text-[9px] font-mono text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-1.5 py-0.5 rounded border border-indigo-200 dark:border-indigo-800/40">
                              View {n.issueId} →
                            </span>
                          )}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setNotifications(prev => prev.filter(item => item.id !== n.id));
                          }}
                          className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded transition opacity-50 hover:opacity-100 shrink-0"
                          title="Dismiss"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                {notifications.length > 0 && (
                  <div className="p-2.5 bg-slate-50 dark:bg-[#121420]/60 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
                    <button 
                      onClick={() => {
                        setNotifications([]);
                        setToastMessage(language === 'BM' ? 'Pusat pemberitahuan dikosongkan.' : 'Notification center cleared.');
                      }}
                      className="text-[11px] text-slate-400 hover:text-rose-500 transition px-2 py-1 flex items-center gap-1 font-medium"
                    >
                      <Trash2 size={12} /> {language === 'BM' ? 'Kosongkan' : 'Clear all'}
                    </button>
                    <button 
                      onClick={() => setShowNotifSheet(false)}
                      className="px-3 py-1 bg-white dark:bg-[#1f2233] hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-lg border border-slate-200 dark:border-white/10 transition"
                    >
                      {language === 'BM' ? 'Tutup' : 'Close'}
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* HOME PAGE EXCLUSIVE HERO & QUICK ACTION (Only shown on 'home' tab) */}
        {activeTab === 'home' && (
          <div className="bg-gradient-to-b from-indigo-900 via-indigo-800 to-indigo-700 text-white p-5 rounded-b-[2rem] shadow-lg space-y-4">
            <div>
              <p className="text-xs text-indigo-200">{language === 'BM' ? 'Selamat kembali,' : 'Welcome back,'}</p>
              <h1 className="text-2xl font-black tracking-tight">
                {userIc ? (language === 'BM' ? `Hai Penduduk (${userIc.slice(0, 6)}...) 👋` : `Hi Resident (${userIc.slice(0, 6)}...) 👋`) : (language === 'BM' ? 'Hai Chariya 👋' : 'Hi Chariya 👋')}
              </h1>
              <p className="text-xs text-indigo-200 mt-0.5">
                {userIc ? (language === 'BM' ? `Disahkan melalui MyKad: ${userIc}` : `Verified via MyKad: ${userIc}`) : (language === 'BM' ? 'Kawasan Majlis Bandaraya Petaling Jaya' : 'Petaling Jaya Municipal Area')}
              </p>
            </div>

            {/* FULL-LINE HIGH CONTRAST REPORT ISSUE BUTTON */}
            <button
              onClick={() => setShowReportModal(true)}
              className="w-full bg-amber-400 hover:bg-amber-300 text-slate-950 py-3.5 px-6 rounded-2xl text-base font-black tracking-wider shadow-xl hover:scale-[1.02] active:scale-98 transition flex items-center justify-center space-x-2 border-2 border-amber-300 uppercase ring-4 ring-amber-400/20"
            >
              <Plus size={20} className="stroke-[3.5]" />
              <span>{language === 'BM' ? 'HANTAR ADUAN ANDA DI SINI' : 'REPORT YOUR ISSUE HERE'}</span>
            </button>

            {/* DYNAMIC ACTIVE AREA WIDGET */}
            <div className="bg-white dark:bg-[#161825] text-slate-800 dark:text-slate-100 rounded-2xl p-4 shadow-xl border border-slate-200 dark:border-white/10 transition-colors">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <span className={`${ringStyle.bg} ${ringStyle.text} text-[10px] font-bold px-2 py-0.5 rounded-full uppercase`}>
                    {language === 'BM' ? 'Kawasan Aktif' : 'Active Area'}
                  </span>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">{translateTitle(selectedIssue?.title, language) || (language === 'BM' ? 'Masalah Saliran & Longkang' : 'Drainage Issue')}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{selectedIssue?.location.address}</p>
                  <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold pt-1">{selectedIssue?.affectedCount} {language === 'BM' ? 'Penduduk Terjejas' : 'Residents Affected'}</p>
                </div>

                <div className="relative w-14 h-14 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-slate-100 dark:text-slate-800"
                      strokeWidth="4"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      strokeWidth="4"
                      strokeDasharray={`${activeVerificationRate}, 100`}
                      strokeLinecap="round"
                      stroke={ringStyle.stroke}
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <div className="absolute text-center">
                    <span className="text-xs font-black text-slate-800 dark:text-white">{activeVerificationRate}%</span>
                    <span className="block text-[8px] text-slate-400">{language === 'BM' ? 'Selesai' : 'Fixed'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MAIN BODY CONTENT */}
        <div className="px-4 mt-5 space-y-6">

          {activeTab === 'home' && (
            <>
              {/* SECTION 1: ACTIVE COMMUNITY ISSUES (INSPECTION & ACTION) */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <h2 className="font-extrabold text-slate-900 dark:text-white text-base">
                      {language === 'BM' ? 'Aduan Komuniti Aktif' : 'Active Community Issues'}
                    </h2>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {language === 'BM' ? 'Ketik isu untuk semak kemajuan & sokong' : 'Tap any issue to inspect progress & endorse'}
                    </p>
                  </div>
                  <button onClick={() => setActiveTab('map')} className="text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline flex items-center gap-1">
                    <MapIcon size={13} />
                    <span>{language === 'BM' ? 'Lihat Peta' : 'View Map'}</span>
                  </button>
                </div>

                <div className="flex space-x-3 overflow-x-auto pb-2 scrollbar-none">
                  {activeIssues.map(issue => {
                    const isSelected = selectedIssue?.id === issue.id;
                    return (
                      <div
                        key={issue.id}
                        onClick={() => setSelectedIssue(issue)}
                        className={`min-w-[220px] max-w-[240px] bg-white dark:bg-[#161825] rounded-2xl p-3.5 shadow-sm border transition-all cursor-pointer flex flex-col justify-between ${isSelected
                            ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-md'
                            : 'border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20'
                          }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-full uppercase border border-blue-100 dark:border-blue-900/30">
                              {getCategoryText(issue.category, language)}
                            </span>
                            {issue.isRecurring && (
                              <span className="text-[9px] font-black text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-1.5 py-0.5 rounded border border-rose-200 dark:border-rose-800/40">
                                {language === 'BM' ? `Berulang (${issue.occurrenceCount || 2}x)` : `Recurring (${issue.occurrenceCount || 2}x)`}
                              </span>
                            )}
                          </div>
                          <h4 className="font-bold text-xs text-slate-800 dark:text-white line-clamp-1">{translateTitle(issue.title, language)}</h4>
                          <p className="text-[11px] text-slate-400 dark:text-slate-400 mt-0.5 line-clamp-1">{issue.location.address}</p>
                        </div>

                        <div className="mt-3 pt-2 border-t border-slate-100 dark:border-white/5 flex justify-between items-center text-[11px]">
                          <span className="font-bold text-slate-700 dark:text-slate-200">👥 {issue.affectedCount} {language === 'BM' ? 'Terjejas' : 'Affected'}</span>
                          <span className="text-blue-600 dark:text-blue-400 font-semibold flex items-center">
                            {isSelected ? (language === 'BM' ? 'Sedang Disemak' : 'Inspecting') : (language === 'BM' ? 'Ketik Butiran' : 'Tap to View')}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* SELECTED ACTIVE ISSUE DETAIL CARD (Dedicated Inspection Container) */}
              {selectedIssue && !isSelectedResolved && (
                <div className="bg-white dark:bg-[#161825] rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-white/10 space-y-4 transition-colors">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">{selectedIssue.id}</span>
                        {selectedIssue.isRecurring && (
                          <span className="text-[9px] font-bold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-1.5 py-0.2 rounded border border-rose-200 dark:border-rose-800/40">
                            {language === 'BM' ? 'Corak Berulang Dikesan' : 'Recurring Pattern Detected'}
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-base mt-0.5">{translateTitle(selectedIssue.title, language)}</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{selectedIssue.location.address}</p>
                    </div>
                    <span className="bg-blue-100 dark:bg-blue-500/20 text-blue-800 dark:text-blue-300 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase border border-blue-200 dark:border-blue-500/30">
                      {getStatusText(selectedIssue.status, language)}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-white/5 leading-relaxed">
                    {translateDescription(selectedIssue.description, language)}
                  </p>

                  {selectedIssue.images && selectedIssue.images.length > 0 && (
                    <div>
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center">
                        <ImageIcon size={12} className="mr-1" /> {language === 'BM' ? 'Bukti Penduduk' : 'Citizen Evidence'} ({selectedIssue.images.length})
                      </h4>
                      <div className="flex space-x-2 overflow-x-auto pb-1">
                        {selectedIssue.images.map((img, idx) => (
                          <div key={idx} className="w-24 h-24 rounded-xl overflow-hidden border border-slate-200 dark:border-white/10 flex-shrink-0 shadow-sm">
                            <img src={img} alt={`Evidence ${idx + 1}`} className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/40 rounded-xl p-3 flex justify-between items-center">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-bold text-blue-900 dark:text-blue-200">{selectedIssue.affectedCount} {language === 'BM' ? 'Penduduk Terjejas' : 'Residents Affected'}</p>
                        {selectedIssue.reportCount && (
                          <span className="text-[10px] text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/60 px-2 py-0.5 rounded-full font-bold">
                            {selectedIssue.reportCount} {language === 'BM' ? 'Aduan' : 'Reports'}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-blue-600 dark:text-blue-300/80">
                        {userEndorsedSet.has(`${selectedIssue.id}::RESIDENT-CA-01`)
                          ? (language === 'BM' ? '✓ Anda telah menyokong isu ini' : '✓ You have endorsed this issue')
                          : (language === 'BM' ? 'Ketik untuk sahkan kesan komuniti' : 'Tap to corroborate community impact')}
                      </p>
                    </div>
                    <button
                      onClick={() => handleAffectedClick(selectedIssue.id)}
                      disabled={userEndorsedSet.has(`${selectedIssue.id}::RESIDENT-CA-01`)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition shadow ${userEndorsedSet.has(`${selectedIssue.id}::RESIDENT-CA-01`)
                          ? 'bg-emerald-600 text-white cursor-default'
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                    >
                      {userEndorsedSet.has(`${selectedIssue.id}::RESIDENT-CA-01`) ? (language === 'BM' ? '✓ Disokong' : '✓ Backed') : (language === 'BM' ? 'Saya Terjejas Juga' : "I'm Affected Too")}
                    </button>
                  </div>

                  <div>
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">{language === 'BM' ? 'Kemajuan Kitaran Hayat' : 'Lifecycle Progress'}</h4>
                    <div className="space-y-2 border-l-2 border-slate-200 dark:border-slate-800 pl-3 ml-1">
                      {selectedIssue.timeline.map((event, idx) => (
                        <div key={idx} className="relative">
                          <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200">{event.date}</span>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">{translateTimeline(event.title, language)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION 2: VERIFICATION REQUIRED SEGMENT (COMMUNITY RESOLUTION VOTING) */}
              <div className="bg-gradient-to-b from-emerald-50 via-teal-50 to-emerald-100/60 dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-slate-900 rounded-3xl p-4 border border-emerald-200/80 dark:border-emerald-900/40 shadow-sm space-y-4 transition-colors">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-1.5">
                    <CheckCircle2 size={18} className="text-emerald-700 dark:text-emerald-400" />
                    <h2 className="font-extrabold text-emerald-950 dark:text-emerald-200 text-base">
                      {language === 'BM' ? 'Pengesahan Komuniti' : 'Community Verification'}
                    </h2>
                  </div>
                  <span className="text-[10px] text-emerald-800 dark:text-emerald-300 font-bold bg-white/80 dark:bg-emerald-900/50 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-700/50">
                    {pbtResolvedIssues.length} {language === 'BM' ? 'Menunggu Audit' : 'Awaiting Audit'}
                  </span>
                </div>
                <p className="text-xs text-emerald-800/80 dark:text-emerald-300/80">
                  {language === 'BM' 
                    ? 'Majlis telah menandakan kerja selesai. Sahkan kualiti pembaikan fizikal di lokasi.'
                    : 'Council has marked these completed. Confirm physical repair quality to close or dispute.'}
                </p>

                {/* HORIZONTAL RESOLVED CAROUSEL */}
                <div className="flex space-x-3 overflow-x-auto pb-2 scrollbar-none">
                  {pbtResolvedIssues.map(issue => {
                    const isSelected = selectedIssue?.id === issue.id;
                    return (
                      <div
                        key={issue.id}
                        onClick={() => setSelectedIssue(issue)}
                        className={`min-w-[220px] max-w-[240px] bg-white dark:bg-[#161825] rounded-2xl p-3.5 shadow-sm border transition cursor-pointer flex flex-col justify-between ${isSelected
                            ? 'border-emerald-600 ring-2 ring-emerald-200 dark:ring-emerald-900/40 shadow-md'
                            : 'border-emerald-100 dark:border-white/10 hover:border-emerald-300'
                          }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full uppercase border border-emerald-100 dark:border-emerald-900/30">
                              {getStatusText(issue.status, language)}
                            </span>
                            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                              {issue.communityVerificationRate}% {language === 'BM' ? 'Disahkan' : 'Confirmed'}
                            </span>
                          </div>
                          <h4 className="font-bold text-xs text-slate-800 dark:text-white line-clamp-1">{translateTitle(issue.title, language)}</h4>
                          <p className="text-[11px] text-slate-400 dark:text-slate-400 mt-0.5 line-clamp-1">{issue.location.address}</p>
                        </div>

                        <div className="mt-3 pt-2 border-t border-slate-100 dark:border-white/5 flex justify-between items-center text-[11px]">
                          <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                            {isSelected ? (language === 'BM' ? 'Sedang Disahkan' : 'Verifying Now') : (language === 'BM' ? 'Semak & Undi' : 'Review & Vote')}
                          </span>
                          <ChevronRight size={14} className="text-emerald-700 dark:text-emerald-400" />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* OFFICIAL STATUS VERIFICATION CARD */}
                {selectedIssue && isSelectedResolved && (
                  <div className="bg-white dark:bg-[#161825] rounded-2xl p-4 shadow-md border border-emerald-200 dark:border-white/10 space-y-3 transition-colors">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-white/5">
                      <span className="bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase flex items-center border border-emerald-200 dark:border-emerald-800/40">
                        <CheckCircle2 size={12} className="mr-1" /> {language === 'BM' ? 'Tuntutan Majlis: Kerja Selesai' : 'Council Claim: Work Completed'}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400">{language === 'BM' ? 'PBT Disahkan 🛠️' : 'PBT Verified 🛠️'}</span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">{selectedIssue.id}</span>
                      <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">{translateTitle(selectedIssue.title, language)}</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{translateDescription(selectedIssue.description, language)}</p>
                    </div>

                    {selectedIssue.images && selectedIssue.images.length > 0 && (
                      <div>
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center">
                          <ImageIcon size={12} className="mr-1" /> {language === 'BM' ? 'Bukti Pembaikan Kontraktor' : 'Contractor Repair Evidence'}
                        </h4>
                        <div className="flex space-x-2 overflow-x-auto pb-1">
                          {selectedIssue.images.map((img, idx) => (
                            <div key={idx} className="w-20 h-20 rounded-xl overflow-hidden border border-slate-200 dark:border-white/10 flex-shrink-0 shadow-sm">
                              <img src={img} alt={`Proof ${idx + 1}`} className="w-full h-full object-cover" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Community Verification Action Box */}
                    <div className="p-3 bg-emerald-50/70 dark:bg-emerald-950/40 rounded-xl border border-emerald-200/80 dark:border-emerald-900/40">
                      <p className="text-xs font-bold text-emerald-950 dark:text-emerald-200 mb-2 flex items-center">
                        <HelpCircle size={14} className="text-emerald-700 dark:text-emerald-400 mr-1" /> {language === 'BM' ? 'Adakah masalah ini benar-benar telah dibaiki di lokasi fizikal?' : 'Has this actually been fixed at the physical site?'}
                      </p>

                      <div className="grid grid-cols-3 gap-1.5">
                        <button
                          onClick={() => handleVerifyVote(selectedIssue.id, 'FIXED')}
                          className={`py-1.5 rounded-lg text-[11px] font-bold transition flex items-center justify-center ${userVoteForSelected === 'FIXED' ? 'bg-emerald-600 text-white ring-2 ring-emerald-300' : 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40 hover:bg-emerald-100 dark:hover:bg-slate-700'}`}
                        >
                          🟢 {language === 'BM' ? 'Selesai' : 'Fixed'}
                        </button>
                        <button
                          onClick={() => handleVerifyVote(selectedIssue.id, 'PARTIAL')}
                          className={`py-1.5 rounded-lg text-[11px] font-bold transition flex items-center justify-center ${userVoteForSelected === 'PARTIAL' ? 'bg-amber-600 text-white ring-2 ring-amber-300' : 'bg-white dark:bg-slate-800 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40 hover:bg-amber-100 dark:hover:bg-slate-700'}`}
                        >
                          🟡 {language === 'BM' ? 'Separa' : 'Partial'}
                        </button>
                        <button
                          onClick={() => handleVerifyVote(selectedIssue.id, 'NOT_FIXED')}
                          className={`py-1.5 rounded-lg text-[11px] font-bold transition flex items-center justify-center ${userVoteForSelected === 'NOT_FIXED' ? 'bg-rose-600 text-white ring-2 ring-rose-300' : 'bg-white dark:bg-slate-800 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/40 hover:bg-rose-100 dark:hover:bg-slate-700'}`}
                        >
                          🔴 {language === 'BM' ? 'Belum Selesai' : 'Not Fixed'}
                        </button>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-[10px] text-slate-500 dark:text-slate-400 pt-1">
                      <span>{language === 'BM' ? 'Konsensus Komuniti:' : 'Community Consensus:'} <strong className={ringStyle.text}>{activeVerificationRate}% {language === 'BM' ? 'Disahkan' : 'Confirmed'}</strong></span>
                      <span>
                        {selectedIssue.verificationCounts
                          ? (language === 'BM' ? `${selectedIssue.verificationCounts.fixed} Selesai · ${selectedIssue.verificationCounts.partial} Separa · ${selectedIssue.verificationCounts.notFixed} Dipertikai` : `${selectedIssue.verificationCounts.fixed} Fixed · ${selectedIssue.verificationCounts.partial} Partial · ${selectedIssue.verificationCounts.notFixed} Disputed`)
                          : (language === 'BM' ? `${selectedIssue.affectedCount} Penduduk Sahkan` : `${selectedIssue.affectedCount} Residents Verified`)}
                      </span>
                    </div>
                    {selectedIssue.verificationCounts && (selectedIssue.verificationCounts.fixed + selectedIssue.verificationCounts.partial + selectedIssue.verificationCounts.notFixed) < 3 && (
                      <p className="text-[9px] text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 p-1.5 rounded-lg border border-amber-200 dark:border-amber-800/40">
                        {language === 'BM' ? '⚖️ Perlindungan aktif: 3 undian penduduk diperlukan untuk membentuk konsensus komuniti.' : '⚖️ Safeguard active: 3 resident votes required to establish community consensus.'}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === 'map' && (
            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="font-extrabold text-slate-900 dark:text-white text-base">
                      {language === 'BM' ? 'Peta Komuniti Bersama' : 'Shared Community Map'}
                    </h2>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {language === 'BM' ? 'Insiden & titik panas komuniti terkini' : 'Live neighborhood incidents & hotspots'}
                    </p>
                  </div>
                  <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2.5 py-1 rounded-full border border-indigo-200 dark:border-indigo-500/30">
                    {issues.length} {language === 'BM' ? 'Pin Aktif' : 'Active Pins'}
                  </span>
                </div>

                {/* Filter and Legend Pills */}
                <div className="flex gap-1.5 overflow-x-auto pb-1 text-[10px] font-bold">
                  <button
                    onClick={() => setMapFilter('all')}
                    className={`px-3 py-1 rounded-full transition ${
                      mapFilter === 'all'
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-black shadow-xs'
                        : 'bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    {language === 'BM' ? 'Semua' : 'All'} ({issues.length})
                  </button>
                  <button
                    onClick={() => setMapFilter(prev => prev === 'critical' ? 'all' : 'critical')}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-full border transition active:scale-95 shrink-0 ${
                      mapFilter === 'critical'
                        ? 'bg-red-600 text-white border-red-500 shadow-xs'
                        : 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400 border-red-200 dark:border-red-500/30 hover:bg-red-200/70'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span> {language === 'BM' ? 'Kritikal / Impak Tinggi' : 'Critical / High Impact'}
                  </button>
                  <button
                    onClick={() => setMapFilter(prev => prev === 'active' ? 'all' : 'active')}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-full border transition active:scale-95 shrink-0 ${
                      mapFilter === 'active'
                        ? 'bg-blue-600 text-white border-blue-500 shadow-xs'
                        : 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 border-blue-200 dark:border-blue-500/30 hover:bg-blue-200/70'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span> {language === 'BM' ? 'Aduan Aktif' : 'Active Reports'}
                  </button>
                  <button
                    onClick={() => setMapFilter(prev => prev === 'resolved' ? 'all' : 'resolved')}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-full border transition active:scale-95 shrink-0 ${
                      mapFilter === 'resolved'
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow-xs'
                        : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30 hover:bg-emerald-200/70'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span> {language === 'BM' ? 'Selesai / Disahkan' : 'Resolved / Verified'}
                  </button>
                </div>
              </div>

              {/* MAP CANVAS WITH FLOATING MODAL OVERLAY MATCHING ADMIN DASHBOARD */}
              <div className="relative h-[480px] w-full rounded-2xl overflow-hidden shadow-lg border border-slate-200 dark:border-white/10 z-0">
                <MapContainer center={[3.1205, 101.6240]} zoom={14} scrollWheelZoom={true} className="h-full w-full z-0">
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  {filteredMapIssues.map(issue => (
                    <Marker
                      key={issue.id}
                      position={[issue.location.lat, issue.location.lng]}
                      icon={createCustomUserIcon(issue)}
                      eventHandlers={{
                        click: () => {
                          setSelectedIssue(issue);
                          setSelectedMapIssue(issue);
                        }
                      }}
                    >
                      <LeafletTooltip direction="top" offset={[0, -18]} opacity={1} className="custom-tooltip">
                        <div className="text-xs font-bold flex items-center gap-1 text-white">
                          <span>{categoryEmoji[issue.category] || '📋'}</span>
                          <span>{translateTitle(issue.title, language)}</span>
                        </div>
                        <div className="text-[10px] text-slate-300">{issue.location.address}</div>
                        <div className="text-[10px] text-amber-300 font-semibold">{issue.affectedCount} {language === 'BM' ? 'penduduk terjejas' : 'residents affected'}</div>
                      </LeafletTooltip>
                    </Marker>
                  ))}
                </MapContainer>

                {/* FLOATING DETAIL CARD MODAL (Directly on top of map like Admin dashboard) */}
                {selectedMapIssue && (
                  <div className="absolute top-4 left-4 right-4 bg-white/95 dark:bg-[#121420]/95 backdrop-blur-xl border border-slate-200 dark:border-white/15 rounded-2xl shadow-2xl z-[1000] overflow-hidden animate-in fade-in slide-in-from-top-3 flex flex-col max-h-[380px]">
                    {/* Hero Image or Category Gradient Banner */}
                    <div className="relative h-28 shrink-0">
                      {selectedMapIssue.images && selectedMapIssue.images.length > 0 ? (
                        <img src={selectedMapIssue.images[0]} alt="Evidence" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-indigo-600 to-blue-500 flex items-center justify-center">
                          <span className="text-4xl">{categoryEmoji[selectedMapIssue.category]}</span>
                        </div>
                      )}

                      {/* Close 'X' Button */}
                      <button
                        onClick={() => setSelectedMapIssue(null)}
                        className="absolute top-2.5 right-2.5 bg-black/60 hover:bg-black p-1.5 rounded-full text-white backdrop-blur-md transition shadow"
                      >
                        <X size={15} />
                      </button>

                      {/* Floating Badges */}
                      <div className="absolute bottom-2.5 left-2.5 flex gap-1.5 flex-wrap">
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full backdrop-blur-md text-white border border-white/20 ${selectedMapIssue.isRecurring ? 'bg-red-500/90' : 'bg-blue-600/90'
                          }`}>
                          {selectedMapIssue.isRecurring ? (language === 'BM' ? `Berulang (${selectedMapIssue.occurrenceCount || 2}x)` : `Recurring (${selectedMapIssue.occurrenceCount || 2}x)`) : getCategoryText(selectedMapIssue.category, language)}
                        </span>
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-black/60 backdrop-blur-md text-white border border-white/20">
                          {getStatusText(selectedMapIssue.status, language)}
                        </span>
                      </div>
                    </div>

                    {/* Card Content & Action Rows */}
                    <div className="p-4 overflow-y-auto space-y-3 custom-scrollbar">
                      <div>
                        <h3 className="text-sm font-black text-slate-900 dark:text-white leading-tight">
                          {translateTitle(selectedMapIssue.title, language)}
                        </h3>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {selectedMapIssue.location.address}
                        </p>
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-100 dark:border-white/5 line-clamp-2">
                        {translateDescription(selectedMapIssue.description, language)}
                      </p>

                      {/* Stats row */}
                      <div className="grid grid-cols-2 gap-2 text-[11px] pb-1">
                        <div className="bg-slate-50 dark:bg-slate-900/40 p-2 rounded-xl border border-slate-100 dark:border-white/5">
                          <span className="text-slate-400 block text-[9px] uppercase font-bold">{language === 'BM' ? 'Impak Komuniti' : 'Community Impact'}</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">👥 {selectedMapIssue.affectedCount} {language === 'BM' ? 'Terjejas' : 'Affected'}</span>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-900/40 p-2 rounded-xl border border-slate-100 dark:border-white/5">
                          <span className="text-slate-400 block text-[9px] uppercase font-bold">{language === 'BM' ? 'Kadar Penyelesaian' : 'Resolution Rate'}</span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">
                            {selectedMapIssue.communityVerificationRate || 75}% {language === 'BM' ? 'Konsensus' : 'Consensus'}
                          </span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() => {
                            setSelectedMapIssue(null);
                            setActiveTab('home');
                          }}
                          className="flex-1 py-2 px-3 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md transition flex items-center justify-center gap-1"
                        >
                          <span>{language === 'BM' ? 'Sejarah Penuh & Undi' : 'Full History & Vote'}</span>
                          <ChevronRight size={14} />
                        </button>
                        <button
                          onClick={() => handleAffectedClick(selectedMapIssue.id)}
                          disabled={userEndorsedSet.has(`${selectedMapIssue.id}::RESIDENT-CA-01`)}
                          className={`py-2 px-3 text-xs font-bold rounded-xl border transition flex items-center justify-center gap-1 ${userEndorsedSet.has(`${selectedMapIssue.id}::RESIDENT-CA-01`)
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40'
                              : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-white/10'
                            }`}
                        >
                          <ThumbsUp size={13} />
                          <span>{userEndorsedSet.has(`${selectedMapIssue.id}::RESIDENT-CA-01`) ? (language === 'BM' ? 'Disokong' : 'Backed') : (language === 'BM' ? 'Saya Terjejas' : 'Affects Me')}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="font-extrabold text-slate-900 dark:text-white text-base">
                    {language === 'BM' ? 'Penyertaan Sivik Anda' : 'Your Civic Participation'}
                  </h2>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {language === 'BM' ? 'Jejak aduan yang dilaporkan, disokong, dan disahkan oleh anda' : 'Track your reported, backed, and verified community cases'}
                  </p>
                </div>
                <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2.5 py-1 rounded-full border border-indigo-200 dark:border-indigo-500/30">
                  {issues.length} {language === 'BM' ? 'Aduan Aktif' : 'Issues Active'}
                </span>
              </div>

              {/* FILTER PILLS */}
              <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs font-bold">
                <button
                  onClick={() => setActivityFilter('all')}
                  className={`px-3 py-1.5 rounded-full transition text-[11px] ${activityFilter === 'all'
                      ? 'bg-blue-600 text-white shadow'
                      : 'bg-white dark:bg-[#161825] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10'
                    }`}
                >
                  {language === 'BM' ? 'Semua' : 'All'} ({issues.length})
                </button>
                <button
                  onClick={() => setActivityFilter('reported')}
                  className={`px-3 py-1.5 rounded-full transition text-[11px] ${activityFilter === 'reported'
                      ? 'bg-blue-600 text-white shadow'
                      : 'bg-white dark:bg-[#161825] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10'
                    }`}
                >
                  {language === 'BM' ? 'Dihantar oleh Anda' : 'Submitted by You'}
                </button>
                <button
                  onClick={() => setActivityFilter('backed')}
                  className={`px-3 py-1.5 rounded-full transition text-[11px] ${activityFilter === 'backed'
                      ? 'bg-blue-600 text-white shadow'
                      : 'bg-white dark:bg-[#161825] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10'
                    }`}
                >
                  {language === 'BM' ? 'Impak Disokong' : 'Impact Backed'} ({userEndorsedSet.size})
                </button>
                <button
                  onClick={() => setActivityFilter('verified')}
                  className={`px-3 py-1.5 rounded-full transition text-[11px] ${activityFilter === 'verified'
                      ? 'bg-blue-600 text-white shadow'
                      : 'bg-white dark:bg-[#161825] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10'
                    }`}
                >
                  {language === 'BM' ? 'Disahkan' : 'Verified'} ({Object.keys(userVerifications).length})
                </button>
              </div>

              {/* TIMELINE-STYLED ACTIVITY LIST */}
              <div className="space-y-3">
                {issues
                  .filter(record => {
                    if (activityFilter === 'backed') return userEndorsedSet.has(`${record.id}::RESIDENT-CA-01`);
                    if (activityFilter === 'verified') return Boolean(userVerifications[record.id]);
                    return true;
                  })
                  .map((record) => {
                    const hasEndorsed = userEndorsedSet.has(`${record.id}::RESIDENT-CA-01`);
                    const userVote = userVerifications[record.id];
                    return (
                      <div
                        key={record.id}
                        onClick={() => {
                          setSelectedIssue(record);
                          setActiveTab('home');
                        }}
                        className="bg-white dark:bg-[#161825] rounded-2xl p-4 border border-slate-200 dark:border-white/10 shadow-sm space-y-3 hover:border-indigo-400 dark:hover:border-indigo-500/50 transition cursor-pointer"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex items-center space-x-2.5">
                            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-base shrink-0 border border-indigo-200/50 dark:border-indigo-800/40">
                              {categoryEmoji[record.category] || '📋'}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <h4 className="font-bold text-xs text-slate-900 dark:text-white line-clamp-1">{translateTitle(record.title, language)}</h4>
                                {record.isRecurring && (
                                  <span className="text-[9px] font-bold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-1.5 py-0.2 rounded border border-rose-200 dark:border-rose-800/40">
                                    {language === 'BM' ? 'Berulang' : 'Recurring'}
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-slate-400">{record.createdAt} • {record.location.address}</p>
                            </div>
                          </div>

                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${record.status === 'COMMUNITY_VERIFIED' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300' :
                              record.status === 'MARKED_RESOLVED' ? 'bg-purple-100 text-purple-800 dark:bg-purple-500/20 dark:text-purple-300' :
                                'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300'
                            }`}>
                            {getStatusText(record.status, language)}
                          </span>
                        </div>

                        {/* Recent Status & User Participation Pills */}
                        <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
                          {hasEndorsed && (
                            <span className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-md font-bold flex items-center gap-1 border border-emerald-200/60 dark:border-emerald-800/40">
                              <ThumbsUp size={11} /> {language === 'BM' ? 'Anda Sokong Impak' : 'You Backed Impact'}
                            </span>
                          )}
                          {userVote && (
                            <span className="bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-md font-bold flex items-center gap-1 border border-purple-200/60 dark:border-purple-800/40">
                              <CheckCircle2 size={11} /> {language === 'BM' ? `Undian: ${userVote === 'FIXED' ? 'Selesai' : userVote === 'PARTIAL' ? 'Separa' : 'Belum Selesai'}` : `Voted ${userVote}`}
                            </span>
                          )}
                          <span className="text-slate-400 dark:text-slate-500 font-medium ml-auto">
                            👥 {record.affectedCount} {language === 'BM' ? 'Penduduk Terjejas' : 'Residents Affected'}
                          </span>
                        </div>

                        {record.images && record.images.length > 0 && (
                          <div className="flex space-x-1.5 pt-1 overflow-x-auto pb-1">
                            {record.images.map((img, i) => (
                              <img key={i} src={img} alt="Evidence" className="w-12 h-12 rounded-lg object-cover border border-slate-200 dark:border-white/10 shrink-0" />
                            ))}
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-white/5 text-[11px]">
                          <span className="text-slate-500 dark:text-slate-400">
                            {record.timeline.length > 0 ? (language === 'BM' ? `Terkini: ${translateTimeline(record.timeline[record.timeline.length - 1].title, language)}` : `Latest: ${record.timeline[record.timeline.length - 1].title}`) : (language === 'BM' ? 'Status sedang diproses' : 'Status pending')}
                          </span>
                          <span className="text-blue-600 dark:text-blue-400 font-bold flex items-center gap-0.5">
                            <span>{language === 'BM' ? 'Buka Butiran' : 'Open Details'}</span>
                            <ChevronRight size={13} />
                          </span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* PROFILE PAGE VIEW BLOCK */}
          {activeTab === 'profile' && (
            <div className="space-y-5">
              {/* Profile Card */}
              <div className="bg-white dark:bg-[#161825] rounded-2xl p-5 border border-slate-200 dark:border-white/10 shadow-sm text-center space-y-3 transition-colors">
                <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-tr from-indigo-600 to-blue-500 border-4 border-white dark:border-[#1d1f30] shadow-md flex items-center justify-center text-white font-black text-2xl">
                  CA
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
                    {userIc ? (language === 'BM' ? `Penduduk (${userIc})` : `Resident (${userIc})`) : 'Chariya'}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">chariya@civicpulse.my</p>
                </div>
                <div className="inline-flex items-center px-3 py-1 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 rounded-full text-xs font-bold border border-indigo-200/50 dark:border-indigo-800/40">
                  <MapPin size={12} className="mr-1" /> {language === 'BM' ? 'Penduduk Taman ABC, PJ' : 'Resident of Taman ABC, PJ'}
                </div>
              </div>

              {/* Civic Impact Stats */}
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-white dark:bg-[#161825] p-3 rounded-2xl border border-slate-200 dark:border-white/10 text-center shadow-sm">
                  <p className="text-lg font-black text-indigo-600 dark:text-indigo-400">{issues.length}</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold mt-0.5">{language === 'BM' ? 'Dilaporkan' : 'Reported'}</p>
                </div>
                <div className="bg-white dark:bg-[#161825] p-3 rounded-2xl border border-slate-200 dark:border-white/10 text-center shadow-sm">
                  <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">34</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold mt-0.5">{language === 'BM' ? 'Disokong' : 'Backed'}</p>
                </div>
                <div className="bg-white dark:bg-[#161825] p-3 rounded-2xl border border-slate-200 dark:border-white/10 text-center shadow-sm">
                  <p className="text-lg font-black text-amber-600 dark:text-amber-400">{Object.keys(userVerifications).length}</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold mt-0.5">{language === 'BM' ? 'Disahkan' : 'Verified'}</p>
                </div>
              </div>

              {/* Settings List */}
              <div className="bg-white dark:bg-[#161825] rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm divide-y divide-slate-100 dark:divide-white/5 transition-colors">
                <div
                  onClick={() => setToastMessage(language === 'BM' ? 'Talian Terus Majlis MBPJ: 03-7956 3544 · WhatsApp Aduan: 019-338 1234 · Waktu Operasi: 8:00 PG - 5:30 PTG' : 'MBPJ Council Direct Hotline: 03-7956 3544 · WhatsApp Aduan: 019-338 1234 · Operating Hours: 8:00 AM - 5:30 PM')}
                  className="p-3.5 flex justify-between items-center cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5 transition"
                  title="Click to view council contact hotlines"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                      <MapPin size={16} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{language === 'BM' ? 'Kawasan Tempatan / Majlis' : 'Local Area / Council'}</p>
                      <p className="text-[10px] text-slate-400">Majlis Bandaraya Petaling Jaya (MBPJ)</p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-slate-400" />
                </div>

                <div
                  onClick={() => {
                    const next = !pushNotifsEnabled;
                    setPushNotifsEnabled(next);
                    setToastMessage(next ? (language === 'BM' ? 'Pemberitahuan tolak diaktifkan untuk kerja kecemasan & amaran banjir.' : 'Push notifications activated for emergency roadworks & flood alerts.') : (language === 'BM' ? 'Pemberitahuan tolak dijeda.' : 'Push notifications paused.'));
                  }}
                  className="p-3.5 flex justify-between items-center cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5 transition"
                  title="Click to toggle push notifications"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                      <Bell size={16} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{language === 'BM' ? 'Pemberitahuan Tolak' : 'Push Notifications'}</p>
                      <p className="text-[10px] text-slate-400">{language === 'BM' ? 'Makluman pembaikan & pengesahan berdekatan' : 'Alerts on nearby repairs and verifications'}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition ${pushNotifsEnabled ? 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400' : 'text-slate-500 bg-slate-100 dark:bg-white/10 dark:text-slate-400'}`}>
                    {pushNotifsEnabled ? (language === 'BM' ? 'Aktif' : 'Active') : (language === 'BM' ? 'Dijeda' : 'Paused')}
                  </span>
                </div>

                <div
                  onClick={toggleLanguage}
                  className="p-3.5 flex justify-between items-center cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5 transition"
                  title="Click to toggle language (EN / BM)"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
                      <Globe size={16} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{language === 'BM' ? 'Bahasa Aplikasi' : 'Language'}</p>
                      <p className="text-[10px] text-slate-400">English / Bahasa Melayu</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-white/10 px-2 py-0.5 rounded-md">{language}</span>
                </div>
              </div>

              {/* Hackathon Prototype Transparency Notice */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-[10px] text-slate-500 space-y-1">
                <p className="font-bold text-slate-700">{language === 'BM' ? 'ℹ️ Mod Demonstrasi Hackathon' : 'ℹ️ Hackathon Demonstration Mode'}</p>
                <p>
                  {language === 'BM' ? 'Identiti penduduk aktif disimulasikan sebagai Chariya (RESIDENT-CA-01). Penghantaran aduan, sokongan impak, dan undian pengesahan diproses secara dalam memori untuk tujuan demonstrasi langsung.' : 'Active resident identity is simulated as Chariya (RESIDENT-CA-01). Submissions, endorsements, and verification votes are processed locally in-memory for live demo purposes.'}
                </p>
              </div>


              {/* Logout Button */}
              <button
                onClick={() => {
                  window.location.href = 'http://localhost:3001/';
                }}
                className="w-full bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 py-3 rounded-2xl text-xs font-bold transition flex items-center justify-center space-x-2"
              >
                <LogOut size={16} />
                <span>{language === 'BM' ? 'Log Keluar & Kembali ke Log Masuk' : 'Log Out & Return to Sign In'}</span>
              </button>
            </div>
          )}

        </div>
      </div>

      {/* FLOATING NAVIGATION */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/90 dark:bg-[#161825]/90 backdrop-blur-md border-t border-slate-200 dark:border-white/10 py-3 px-6 flex justify-between items-center z-[9000] rounded-t-2xl shadow-xl transition-colors">
        <button
          onClick={() => {
            setIsChatOpen(false);
            setActiveTab('home');
          }}
          className={`flex flex-col items-center space-y-0.5 ${activeTab === 'home' && !isChatOpen ? 'text-blue-600' : 'text-slate-400'}`}
        >
          <Home size={20} />
          <span className="text-[10px] font-semibold">{language === 'BM' ? 'Utama' : 'Home'}</span>
        </button>

        <button
          onClick={() => {
            setIsChatOpen(false);
            setActiveTab('map');
          }}
          className={`flex flex-col items-center space-y-0.5 ${activeTab === 'map' && !isChatOpen ? 'text-blue-600' : 'text-slate-400'}`}
        >
          <MapIcon size={20} />
          <span className="text-[10px] font-semibold">{language === 'BM' ? 'Peta' : 'Map'}</span>
        </button>

        <button
          onClick={() => setIsChatOpen(prev => !prev)}
          className={`flex flex-col items-center space-y-0.5 relative transition-colors ${isChatOpen ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 hover:text-indigo-500'}`}
          title="Resident AI Aduan"
        >
          <div className="relative">
            <Bot size={20} className={isChatOpen ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'} />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-400 rounded-full animate-ping" />
          </div>
          <span className="text-[10px] font-semibold">{language === 'BM' ? 'AI Aduan' : 'AI Chat'}</span>
        </button>

        <button
          onClick={() => {
            setIsChatOpen(false);
            setActiveTab('activity');
          }}
          className={`flex flex-col items-center space-y-0.5 ${activeTab === 'activity' && !isChatOpen ? 'text-blue-600' : 'text-slate-400'}`}
        >
          <Activity size={20} />
          <span className="text-[10px] font-semibold">{language === 'BM' ? 'Aktiviti' : 'Activity'}</span>
        </button>

        <button
          onClick={() => {
            setIsChatOpen(false);
            setActiveTab('profile');
          }}
          className={`flex flex-col items-center space-y-0.5 ${activeTab === 'profile' && !isChatOpen ? 'text-blue-600' : 'text-slate-400'}`}
        >
          <User size={20} />
          <span className="text-[10px] font-semibold">{language === 'BM' ? 'Profil' : 'Profile'}</span>
        </button>
      </nav>

      {/* REPORT MODAL SHEET (Elevated z-[9999] and z-[10000] to cover Leaflet popups/map) */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white dark:bg-[#161825] text-slate-900 dark:text-slate-100 rounded-t-3xl sm:rounded-3xl p-5 w-full max-w-md max-h-[95vh] overflow-y-auto animate-in slide-in-from-bottom relative z-[10000] border border-slate-200 dark:border-white/10 shadow-2xl">
            <div className="flex justify-between items-center mb-1">
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                {language === 'BM' ? 'Laporkan Aduan Komuniti' : 'Report Community Issue'}
              </h2>
              <button
                type="button"
                onClick={() => setShowReportModal(false)}
                className="p-1 rounded-full bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/20 transition"
              >
                <X size={16} />
              </button>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              {language === 'BM' ? 'CivicPulse memautkan aduan pendua berdekatan secara automatik.' : 'CivicPulse links nearby duplicate complaints automatically.'}
            </p>

            <form onSubmit={handleCreateReport} className="space-y-4">

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">{language === 'BM' ? 'Kategori' : 'Category'}</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as IssueCategory)}
                  className="w-full p-2.5 text-xs border border-slate-300 dark:border-white/15 rounded-xl bg-slate-50 dark:bg-[#1a1d2e] text-slate-900 dark:text-white font-medium focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="DRAINAGE" className="bg-white dark:bg-[#1a1d2e] text-slate-900 dark:text-white">🌊 {language === 'BM' ? 'Saliran / Banjir' : 'Drainage / Flooding'}</option>
                  <option value="ROADS" className="bg-white dark:bg-[#1a1d2e] text-slate-900 dark:text-white">🛣 {language === 'BM' ? 'Jalan Raya / Lubang' : 'Roads / Potholes'}</option>
                  <option value="WASTE" className="bg-white dark:bg-[#1a1d2e] text-slate-900 dark:text-white">🗑️ {language === 'BM' ? 'Sisa / Sampah' : 'Waste / Trash'}</option>
                  <option value="LIGHTING" className="bg-white dark:bg-[#1a1d2e] text-slate-900 dark:text-white">💡 {language === 'BM' ? 'Lampu Jalan' : 'Streetlights'}</option>
                  <option value="HAZARD" className="bg-white dark:bg-[#1a1d2e] text-slate-900 dark:text-white">⚠️ {language === 'BM' ? 'Bahaya Awam' : 'Public Hazard'}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">{language === 'BM' ? 'Tajuk Aduan' : 'Title'}</label>
                <input
                  type="text"
                  required
                  placeholder={language === 'BM' ? 'cth. Longkang Tersumbat di Jalan 17/5' : 'e.g. Blocked Drain on Jalan 17/5'}
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full p-2.5 text-xs border border-slate-300 dark:border-white/15 rounded-xl bg-white dark:bg-[#1a1d2e] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 font-medium focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                  <span>{language === 'BM' ? 'Pin Lokasi Terjejas' : 'Pin Affected Location'}</span>
                  <span className="text-[10px] text-blue-600 dark:text-blue-400 font-normal">{language === 'BM' ? 'Ketik peta untuk tetap pin' : 'Tap map to set pin'}</span>
                </label>
                <div className="h-[150px] w-full rounded-xl overflow-hidden border border-slate-300 dark:border-white/15 mb-1.5 relative z-0">
                  <MapContainer center={selectedLocation} zoom={15} scrollWheelZoom={false} className="h-full w-full z-0">
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <LocationPickerMarker
                      position={selectedLocation}
                      setPosition={setSelectedLocation}
                      setAddress={setAutoAddress}
                    />
                  </MapContainer>
                </div>
                <input
                  type="text"
                  readOnly
                  value={autoAddress}
                  className="w-full p-2 text-[11px] bg-slate-100 dark:bg-white/5 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-white/10 rounded-lg font-medium"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">{language === 'BM' ? 'Penerangan (BM / Bahasa Inggeris / Manglish)' : 'Description (BM / English / Manglish)'}</label>
                  <button
                    type="button"
                    onClick={async () => {
                      if (!newDescription.trim()) return;
                      setIsNlpAnalyzing(true);
                      try {
                        const res = await fetch(`${API_BASE}/nlp/analyze`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ text: newDescription })
                        });
                        if (res.ok) {
                          const json = await res.json();
                          if (json.data) {
                            setNlpAnalysis(json.data);
                            setNewCategory(json.data.category);
                            setNewTitle(json.data.suggestedTitle);
                            setToastMessage(`🤖 NLP Triage: ${json.data.category} (${json.data.urgency}) detected (${json.data.detectedLanguage})`);
                          }
                        }
                      } catch (e) {
                        console.warn('NLP API call failed, using fallback:', e);
                        const lower = newDescription.toLowerCase();
                        if (lower.includes('longkang') || lower.includes('drain')) {
                          setNewCategory('DRAINAGE');
                          if (!newTitle) setNewTitle('Blocked Drain & Overflow Risk');
                        } else if (lower.includes('jalan') || lower.includes('pothole')) {
                          setNewCategory('ROADS');
                          if (!newTitle) setNewTitle('Road Surface Defect');
                        }
                      } finally {
                        setIsNlpAnalyzing(false);
                      }
                    }}
                    className="text-[10px] font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 dark:hover:bg-purple-900/50 px-2.5 py-1 rounded-lg border border-purple-200 dark:border-purple-800/50 transition flex items-center gap-1 active:scale-95 shadow-xs"
                    title="Run Malaysian NLP parser to classify category, extract landmarks, and generate official title"
                  >
                    <span>{isNlpAnalyzing ? (language === 'BM' ? '⏳ Menganalisis Teks...' : '⏳ Analyzing Text...') : (language === 'BM' ? '✨ NLP Auto-Klasifikasi (BM/EN)' : '✨ NLP Auto-Triage (BM/EN)')}</span>
                  </button>
                </div>
                <textarea
                  required
                  rows={2}
                  placeholder={language === 'BM' ? 'cth. Longkang tersumbat teruk dekat SS2 air bertakung bau busuk bila hujan confirm banjir' : 'e.g. Blocked drain on Jalan 17/5 causing bad odor and potential flash flood'}
                  value={newDescription}
                  onChange={(e) => {
                    setNewDescription(e.target.value);
                  }}
                  className="w-full p-2.5 text-xs border border-slate-300 dark:border-white/15 rounded-xl bg-white dark:bg-[#1a1d2e] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 font-medium focus:border-purple-500 dark:focus:border-purple-400 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />

                {/* NLP Analysis Feedback Badge */}
                {nlpAnalysis && (
                  <div className="mt-2 p-2.5 bg-purple-50/80 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/40 rounded-xl space-y-1.5 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between text-[10px] font-bold">
                      <span className="flex items-center gap-1 text-purple-800 dark:text-purple-200">
                        <span>🤖 {language === 'BM' ? 'Klasifikasi NLP:' : 'NLP Triage:'}</span>
                        <span className="bg-purple-200/60 dark:bg-purple-800/60 text-purple-900 dark:text-purple-100 px-1.5 py-0.5 rounded uppercase">{nlpAnalysis.category}</span>
                        <span className="text-purple-600 dark:text-purple-300">({(nlpAnalysis.categoryConfidence * 100).toFixed(0)}% conf)</span>
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold ${nlpAnalysis.urgency === 'CRITICAL' ? 'bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800/50' : nlpAnalysis.urgency === 'HIGH' ? 'bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800/50' : 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'}`}>
                        {nlpAnalysis.urgency} {language === 'BM' ? 'KECEMASAN' : 'URGENCY'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[10px] text-slate-600 dark:text-slate-300 flex-wrap">
                      <span>{language === 'BM' ? 'Bahasa:' : 'Lang:'} <strong>{nlpAnalysis.detectedLanguage}</strong></span>
                      <span>•</span>
                      <span>{language === 'BM' ? 'Kekecewaan:' : 'Frustration:'} <strong className="text-purple-800 dark:text-purple-300">{nlpAnalysis.sentiment.frustrationIndex}%</strong></span>
                      <span>•</span>
                      <span>{language === 'BM' ? 'Agensi:' : 'Agency:'} <strong className="text-slate-800 dark:text-slate-200">{nlpAnalysis.recommendedAgency.name}</strong></span>
                    </div>

                    {nlpAnalysis.detectedLandmarks.length > 0 && (
                      <div className="flex items-center gap-1 text-[9px] text-slate-500 dark:text-slate-400 flex-wrap pt-0.5">
                        <span className="font-semibold text-slate-600 dark:text-slate-300">{language === 'BM' ? 'Mercu Tanda Dikesan:' : 'Extracted Landmarks:'}</span>
                        {nlpAnalysis.detectedLandmarks.map((lm: string, idx: number) => (
                          <span key={idx} className="bg-white dark:bg-[#1a1d2e] border border-purple-100 dark:border-purple-800/40 text-purple-700 dark:text-purple-300 px-1.5 py-0.2 rounded font-mono">
                            {lm}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 italic">
                  {language === 'BM' ? 'Nota: NLP pelayan menganalisis teks berbilang bahasa penduduk untuk mengkategorikan isu, tajuk rasmi, keutamaan, dan agensi berkaitan secara automatik.' : 'Note: Backend NLP analyzes multilingual citizen text to auto-assign category, formal title, priority, and routing agency.'}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">{language === 'BM' ? 'Lampirkan Foto / Bukti' : 'Attach Photos / Evidence'}</label>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <label className="flex items-center justify-center space-x-1.5 p-2.5 bg-slate-50 dark:bg-white/5 border border-slate-300 dark:border-white/10 border-dashed rounded-xl cursor-pointer hover:bg-slate-100 dark:hover:bg-white/10 transition text-slate-700 dark:text-slate-300 text-xs font-bold">
                    <ImageIcon size={16} className="text-blue-600 dark:text-blue-400" />
                    <span>{language === 'BM' ? 'Muat Naik Galeri' : 'Upload Gallery'}</span>
                    <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
                  </label>

                  <label className="flex items-center justify-center space-x-1.5 p-2.5 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/40 border-dashed rounded-xl cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/40 transition text-blue-700 dark:text-blue-300 text-xs font-bold">
                    <ImageIcon size={16} className="text-blue-600 dark:text-blue-400" />
                    <span>{language === 'BM' ? 'Ambil Foto' : 'Take Photo'}</span>
                    <input type="file" accept="image/*" capture="environment" onChange={handleImageUpload} className="hidden" />
                  </label>
                </div>

                {uploadedImages.length > 0 && (
                  <div className="flex space-x-2 overflow-x-auto pt-1">
                    {uploadedImages.map((imgUrl, index) => (
                      <div key={index} className="relative w-14 h-14 rounded-lg overflow-hidden border border-slate-200 dark:border-white/10 flex-shrink-0">
                        <img src={imgUrl} alt="Uploaded evidence" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-0.5 right-0.5 bg-black/70 text-white rounded-full p-0.5"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="flex-1 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 rounded-xl transition"
                >
                  {language === 'BM' ? 'Batal' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow transition"
                >
                  {language === 'BM' ? 'Hantar Aduan' : 'Submit Issue'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}



      {/* MODERN IN-APP TOAST */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 w-full max-w-md px-4 pointer-events-none z-[10000] flex justify-center">
          <div className="pointer-events-auto w-full bg-slate-900/95 dark:bg-white/95 text-white dark:text-slate-900 px-4 py-3 rounded-2xl shadow-2xl flex items-center justify-between gap-3 border border-white/10 animate-fade-up">
            <div className="flex items-center gap-2.5 min-w-0">
              <Info size={16} className="text-indigo-400 dark:text-indigo-600 shrink-0" />
              <p className="text-xs font-semibold leading-snug">{toastMessage}</p>
            </div>
            <button onClick={() => setToastMessage(null)} className="p-1 hover:opacity-70 transition shrink-0">
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* IN-PHONE AI CHATBOT (RESIDENT ASSISTANT) */}
      <CivicChatbot
        role="CITIZEN"
        language={language}
        onToggleLanguage={toggleLanguage}
        onNavigateTab={(tab) => {
          setIsChatOpen(false);
          const lower = tab.toLowerCase();
          if (lower.includes('map') || lower.includes('peta')) setActiveTab('map');
          else if (lower.includes('activity') || lower.includes('aktiviti')) setActiveTab('activity');
          else if (lower.includes('profile') || lower.includes('profil')) setActiveTab('profile');
          else setActiveTab('home');
        }}
        onOpenReportModal={(prefillTitle?: string, prefillDesc?: string) => {
          setIsChatOpen(false);
          if (prefillTitle) setNewTitle(prefillTitle);
          if (prefillDesc) setNewDescription(prefillDesc);
          setShowReportModal(true);
        }}
        onEndorseIssue={(issueId) => {
          handleAffectedClick(issueId);
        }}
        isOpenControlled={isChatOpen}
        onOpenControlled={() => setIsChatOpen(true)}
        onCloseControlled={() => setIsChatOpen(false)}
        layoutMode="phone"
      />
    </div>
  );
}