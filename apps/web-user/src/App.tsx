import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import { 
  MapPin, Bell, Plus, Home, Map as MapIcon, 
  Activity, User, Clock, ShieldCheck, ThumbsUp, X, Image as ImageIcon,
  CheckCircle2, HelpCircle, ChevronRight
} from 'lucide-react';
import { INITIAL_ISSUES } from './mockData';
import { CommunityIssue, IssueCategory } from '../../../packages/shared-types';

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
  const [userVerifications, setUserVerifications] = useState<Record<string, 'FIXED' | 'PARTIAL' | 'NOT_FIXED'>>({});
  const [activeTab, setActiveTab] = useState<'home' | 'map' | 'activity'>('home');
  const [showReportModal, setShowReportModal] = useState(false);

  // Form State
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<IssueCategory>('DRAINAGE');
  const [newDescription, setNewDescription] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<[number, number]>([3.1186, 101.6231]);
  const [autoAddress, setAutoAddress] = useState('Jalan 17/5, Section 17, Petaling Jaya');
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);

  // Filter lists
  const activeIssues = issues.filter(i => i.status !== 'MARKED_RESOLVED' && i.status !== 'COMMUNITY_VERIFIED');
  const pbtResolvedIssues = issues.filter(i => i.status === 'MARKED_RESOLVED' || i.status === 'COMMUNITY_VERIFIED');

  // Calculate Ring Color based on percentage
  const getRingColor = (percentage: number) => {
    if (percentage >= 80) return { stroke: '#10B981', bg: 'bg-emerald-100', text: 'text-emerald-700' };
    if (percentage >= 40) return { stroke: '#F59E0B', bg: 'bg-amber-100', text: 'text-amber-700' };
    return { stroke: '#EF4444', bg: 'bg-rose-100', text: 'text-rose-700' };
  };

  const handleAffectedClick = (issueId: string) => {
    setIssues(prev => prev.map(issue => {
      if (issue.id === issueId) {
        return { ...issue, affectedCount: issue.affectedCount + 1 };
      }
      return issue;
    }));
    if (selectedIssue && selectedIssue.id === issueId) {
      setSelectedIssue(prev => prev ? { ...prev, affectedCount: prev.affectedCount + 1 } : null);
    }
  };

  const handleVerifyVote = (issueId: string, vote: 'FIXED' | 'PARTIAL' | 'NOT_FIXED') => {
    setUserVerifications(prev => ({ ...prev, [issueId]: vote }));
    
    setIssues(prev => prev.map(issue => {
      if (issue.id === issueId) {
        const currentRate = issue.communityVerificationRate ?? 70;
        let delta = 0;
        if (vote === 'FIXED') delta = 5;
        if (vote === 'PARTIAL') delta = 0;
        if (vote === 'NOT_FIXED') delta = -10;
        const newRate = Math.min(100, Math.max(0, currentRate + delta));
        return { ...issue, communityVerificationRate: newRate };
      }
      return issue;
    }));

    if (selectedIssue && selectedIssue.id === issueId) {
      const currentRate = selectedIssue.communityVerificationRate ?? 70;
      let delta = 0;
      if (vote === 'FIXED') delta = 5;
      if (vote === 'PARTIAL') delta = 0;
      if (vote === 'NOT_FIXED') delta = -10;
      const newRate = Math.min(100, Math.max(0, currentRate + delta));
      setSelectedIssue({ ...selectedIssue, communityVerificationRate: newRate });
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

  const handleCreateReport = (e: React.FormEvent) => {
    e.preventDefault();
    
    const finalImages = uploadedImages.length > 0 
      ? uploadedImages 
      : ['https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=500&auto=format&fit=crop'];

    const newIssue: CommunityIssue = {
      id: `CIV-2026-00${Math.floor(1000 + Math.random() * 9000)}`,
      title: newTitle,
      category: newCategory,
      description: newDescription,
      location: {
        lat: selectedLocation[0],
        lng: selectedLocation[1],
        address: autoAddress,
        neighborhood: 'Petaling Jaya'
      },
      affectedCount: 1,
      evidenceCount: finalImages.length,
      occurrenceCount: 1,
      isRecurring: false,
      status: 'REPORTED',
      timeline: [{ date: 'Today', title: 'Submitted by you' }],
      images: finalImages,
      createdAt: new Date().toISOString().split('T')[0]
    };

    setIssues([newIssue, ...issues]);
    setSelectedIssue(newIssue);
    setShowReportModal(false);
    
    setNewTitle('');
    setNewDescription('');
    setUploadedImages([]);
  };

  const activeVerificationRate = selectedIssue?.communityVerificationRate ?? 75;
  const ringStyle = getRingColor(activeVerificationRate);
  const isSelectedResolved = selectedIssue?.status === 'MARKED_RESOLVED' || selectedIssue?.status === 'COMMUNITY_VERIFIED';
  const userVoteForSelected = selectedIssue ? userVerifications[selectedIssue.id] : undefined;

  return (
    <div className="max-w-md mx-auto min-h-screen bg-slate-100 flex flex-col justify-between shadow-2xl relative font-sans">
      
      {/* SCROLLABLE MAIN BODY */}
      <div className="flex-1 overflow-y-auto pb-28">

        {/* TOP HERO BLUE GRADIENT HEADER CARD */}
        <div className="bg-gradient-to-b from-blue-700 via-blue-600 to-blue-500 text-white p-5 rounded-b-[2rem] shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center space-x-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full border border-white/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-xs font-semibold">Taman ABC, PJ</span>
            </div>
            <div className="flex items-center space-x-2">
              <button className="p-2 rounded-full bg-white/20 backdrop-blur-md hover:bg-white/30 transition">
                <Bell size={16} />
              </button>
              <div className="w-8 h-8 rounded-full bg-blue-200 border-2 border-white overflow-hidden flex items-center justify-center text-blue-800 font-bold text-xs">
                CA
              </div>
            </div>
          </div>

          <div className="mb-4">
            <p className="text-xs text-blue-100">Welcome back,</p>
            <h1 className="text-2xl font-black tracking-tight">Hi Chariya 👋</h1>
            <p className="text-xs text-blue-100 mt-0.5">Here is your local civic activity summary</p>
          </div>

         {/* FULL-LINE HIGH CONTRAST REPORT ISSUE BUTTON (EXTRA BOLD & BIG) */}
          <div className="w-full mb-2">
            <button 
              onClick={() => setShowReportModal(true)}
              className="w-full bg-amber-400 hover:bg-amber-300 text-slate-950 py-4 px-6 rounded-2xl text-lg font-black tracking-wider shadow-xl hover:scale-[1.02] active:scale-98 transition flex items-center justify-center space-x-2 border-2 border-amber-300 uppercase ring-4 ring-amber-400/20"
            >
              <Plus size={24} className="stroke-[3.5]" />
              <span className="font-extrabold text-lg">REPORT YOUR ISSUE HERE</span>
            </button>
          </div>

          {/* DYNAMIC ACTIVE AREA WIDGET */}
          <div className="bg-white text-slate-800 rounded-2xl p-4 shadow-xl mt-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <span className={`${ringStyle.bg} ${ringStyle.text} text-[10px] font-bold px-2 py-0.5 rounded-full uppercase`}>
                  Active Area
                </span>
                <h3 className="font-extrabold text-sm text-slate-900">{selectedIssue?.title || 'Drainage Issue'}</h3>
                <p className="text-xs text-slate-500">{selectedIssue?.location.address}</p>
                <p className="text-[11px] text-blue-600 font-semibold pt-1">{selectedIssue?.affectedCount} Residents Affected</p>
              </div>

              <div className="relative w-16 h-16 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-slate-100"
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
                  <span className="text-xs font-black text-slate-800">{activeVerificationRate}%</span>
                  <span className="block text-[8px] text-slate-400">Fixed</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* MAIN BODY CONTENT */}
        <div className="px-4 mt-5 space-y-6">

          {activeTab === 'home' && (
            <>
              {/* SECTION 1: ACTIVE COMMUNITY ISSUES (RED TYPE CATEGORY BADGES) */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h2 className="font-extrabold text-slate-900 text-base">Active Community Issues</h2>
                  <button onClick={() => setActiveTab('map')} className="text-xs text-blue-600 font-bold hover:underline">
                    See Map
                  </button>
                </div>

                <div className="flex space-x-3 overflow-x-auto pb-2 scrollbar-none">
                  {activeIssues.map(issue => (
                    <div 
                      key={issue.id}
                      onClick={() => setSelectedIssue(issue)}
                      className={`min-w-[210px] bg-white rounded-2xl p-3.5 shadow-sm border transition cursor-pointer flex flex-col justify-between ${selectedIssue?.id === issue.id ? 'border-red-500 ring-2 ring-red-100' : 'border-slate-200'}`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          {/* RED CATEGORY BADGE */}
                          <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full uppercase border border-red-100">
                            {issue.category}
                          </span>
                          {issue.isRecurring && (
                            <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">Recurring</span>
                          )}
                        </div>
                        <h4 className="font-bold text-xs text-slate-800 line-clamp-1">{issue.title}</h4>
                        <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{issue.location.address}</p>
                      </div>

                      <div className="mt-4 pt-2 border-t border-slate-100 flex justify-between items-center text-[11px]">
                        <span className="font-bold text-slate-700">{issue.affectedCount} Affected</span>
                        <span className="text-red-600 font-bold">{issue.images.length} Photos</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* SELECTED ACTIVE ISSUE DETAIL CARD */}
              {selectedIssue && !isSelectedResolved && (
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] text-slate-400 font-mono">{selectedIssue.id}</span>
                      <h3 className="font-bold text-slate-900 text-base">{selectedIssue.title}</h3>
                    </div>
                    <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase">
                      {selectedIssue.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600">{selectedIssue.description}</p>

                  {selectedIssue.images && selectedIssue.images.length > 0 && (
                    <div>
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center">
                        <ImageIcon size={12} className="mr-1" /> Submitted Evidence ({selectedIssue.images.length})
                      </h4>
                      <div className="flex space-x-2 overflow-x-auto pb-1">
                        {selectedIssue.images.map((img, idx) => (
                          <div key={idx} className="w-24 h-24 rounded-xl overflow-hidden border border-slate-200 flex-shrink-0 shadow-sm">
                            <img src={img} alt={`Evidence ${idx + 1}`} className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex justify-between items-center">
                    <div>
                      <p className="text-xs font-bold text-blue-900">{selectedIssue.affectedCount} Residents Affected</p>
                      <p className="text-[10px] text-blue-600">Tap to corroborate community impact</p>
                    </div>
                    <button 
                      onClick={() => handleAffectedClick(selectedIssue.id)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition shadow"
                    >
                      I'm Affected Too
                    </button>
                  </div>

                  <div>
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Lifecycle Timeline</h4>
                    <div className="space-y-2 border-l-2 border-slate-200 pl-3 ml-1">
                      {selectedIssue.timeline.map((event, idx) => (
                        <div key={idx} className="relative">
                          <span className="text-[11px] font-bold text-slate-800">{event.date}</span>
                          <p className="text-[11px] text-slate-500">{event.title}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION 2: GRADIENT GREEN SEGMENT (RESOLVED ISSUES & OFFICIAL STATUS VERIFICATION) */}
              <div className="bg-gradient-to-b from-emerald-50 via-teal-50 to-emerald-100/60 rounded-3xl p-4 border border-emerald-200/80 shadow-sm space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-1.5">
                    <CheckCircle2 size={18} className="text-emerald-700" />
                    <h2 className="font-extrabold text-emerald-950 text-base">PBT Resolved Issues</h2>
                  </div>
                  <span className="text-[10px] text-emerald-800 font-bold bg-white/80 px-2 py-0.5 rounded-full border border-emerald-200">
                    Verify Work
                  </span>
                </div>
                <p className="text-xs text-emerald-800/80">Browse Council-completed work orders below and verify if the repair fixed the problem.</p>

                {/* HORIZONTAL RESOLVED CAROUSEL */}
                <div className="flex space-x-3 overflow-x-auto pb-2 scrollbar-none">
                  {pbtResolvedIssues.map(issue => (
                    <div 
                      key={issue.id}
                      onClick={() => setSelectedIssue(issue)}
                      className={`min-w-[220px] bg-white rounded-2xl p-3.5 shadow-sm border transition cursor-pointer flex flex-col justify-between ${selectedIssue?.id === issue.id ? 'border-emerald-600 ring-2 ring-emerald-200' : 'border-emerald-100'}`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full uppercase">
                            RESOLVED
                          </span>
                          <span className="text-[10px] font-bold text-slate-500">
                            {issue.communityVerificationRate}% Confirmed
                          </span>
                        </div>
                        <h4 className="font-bold text-xs text-slate-800 line-clamp-1">{issue.title}</h4>
                        <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{issue.location.address}</p>
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-100 flex justify-between items-center text-[11px]">
                        <span className="text-emerald-700 font-bold">Review & Vote</span>
                        <ChevronRight size={14} className="text-emerald-700" />
                      </div>
                    </div>
                  ))}
                </div>

                {/* OFFICIAL STATUS VERIFICATION CARD MOVED HERE */}
                {selectedIssue && isSelectedResolved && (
                  <div className="bg-white rounded-2xl p-4 shadow-md border border-emerald-200 space-y-3">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase flex items-center">
                        <CheckCircle2 size={12} className="mr-1" /> Official Status: Marked Resolved
                      </span>
                      <span className="text-[10px] font-bold text-slate-400">PBT Verified 🛠️</span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 font-mono">{selectedIssue.id}</span>
                      <h3 className="font-extrabold text-sm text-slate-900">{selectedIssue.title}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">{selectedIssue.description}</p>
                    </div>

                    {selectedIssue.images && selectedIssue.images.length > 0 && (
                      <div>
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center">
                          <ImageIcon size={12} className="mr-1" /> Repair Proof / After Photo
                        </h4>
                        <div className="flex space-x-2 overflow-x-auto pb-1">
                          {selectedIssue.images.map((img, idx) => (
                            <div key={idx} className="w-20 h-20 rounded-xl overflow-hidden border border-slate-200 flex-shrink-0 shadow-sm">
                              <img src={img} alt={`Proof ${idx + 1}`} className="w-full h-full object-cover" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Community Verification Action Box */}
                    <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200/80">
                      <p className="text-xs font-bold text-emerald-950 mb-2 flex items-center">
                        <HelpCircle size={14} className="text-emerald-700 mr-1" /> Has this actually been fixed in your area?
                      </p>
                      
                      <div className="grid grid-cols-3 gap-1.5">
                        <button 
                          onClick={() => handleVerifyVote(selectedIssue.id, 'FIXED')}
                          className={`py-1.5 rounded-lg text-[11px] font-bold transition flex items-center justify-center ${userVoteForSelected === 'FIXED' ? 'bg-emerald-600 text-white ring-2 ring-emerald-300' : 'bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-100'}`}
                        >
                          🟢 Fixed
                        </button>
                        <button 
                          onClick={() => handleVerifyVote(selectedIssue.id, 'PARTIAL')}
                          className={`py-1.5 rounded-lg text-[11px] font-bold transition flex items-center justify-center ${userVoteForSelected === 'PARTIAL' ? 'bg-amber-600 text-white ring-2 ring-amber-300' : 'bg-white text-amber-700 border border-amber-200 hover:bg-amber-100'}`}
                        >
                          🟡 Partial
                        </button>
                        <button 
                          onClick={() => handleVerifyVote(selectedIssue.id, 'NOT_FIXED')}
                          className={`py-1.5 rounded-lg text-[11px] font-bold transition flex items-center justify-center ${userVoteForSelected === 'NOT_FIXED' ? 'bg-rose-600 text-white ring-2 ring-rose-300' : 'bg-white text-rose-700 border border-rose-200 hover:bg-rose-100'}`}
                        >
                          🔴 Not Fixed
                        </button>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-[10px] text-slate-500 pt-1">
                      <span>Community Score: <strong className={ringStyle.text}>{activeVerificationRate}% Confirmed</strong></span>
                      <span>{selectedIssue.affectedCount} Residents Verified</span>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === 'map' && (
            <div className="space-y-3">
              <h2 className="font-extrabold text-slate-900 text-base">Shared Civic Map</h2>
              <div className="h-[420px] w-full rounded-2xl overflow-hidden shadow-inner border border-slate-200">
                <MapContainer center={[3.1186, 101.6231]} zoom={14} scrollWheelZoom={false}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  {issues.map(issue => (
                    <Marker key={issue.id} position={[issue.location.lat, issue.location.lng]}>
                      <Popup>
                        <div className="p-1">
                          <h4 className="font-bold text-sm">{issue.title}</h4>
                          <p className="text-xs text-slate-600">{issue.affectedCount} residents affected</p>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              </div>
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="font-extrabold text-slate-900 text-base">Your Civic History</h2>
                <span className="text-xs text-slate-400 font-semibold">{issues.length} Submissions</span>
              </div>

              <div className="space-y-3">
                {issues.map((record) => (
                  <div key={record.id} className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-2">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
                          <Clock size={16} />
                        </div>
                        <div>
                          <h4 className="font-bold text-xs text-slate-900">{record.title}</h4>
                          <p className="text-[10px] text-slate-400">{record.createdAt} • {record.location.address}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center">
                        <ShieldCheck size={12} className="mr-1" /> Logged
                      </span>
                    </div>

                    {record.images && record.images.length > 0 && (
                      <div className="flex space-x-1.5 pt-1">
                        {record.images.map((img, i) => (
                          <img key={i} src={img} alt="Evidence" className="w-12 h-12 rounded-lg object-cover border border-slate-200" />
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                      <span className="text-slate-500 font-medium">Status: <strong className="text-slate-800">{record.status}</strong></span>
                      <span className="text-blue-600 font-bold flex items-center">
                        <ThumbsUp size={12} className="mr-1" /> {record.affectedCount} Backed
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* FLOATING NAVIGATION */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/90 backdrop-blur-md border-t border-slate-200 py-3 px-8 flex justify-between items-center z-40 rounded-t-2xl shadow-xl">
        <button 
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center space-y-0.5 ${activeTab === 'home' ? 'text-blue-600' : 'text-slate-400'}`}
        >
          <Home size={20} />
          <span className="text-[10px] font-semibold">Home</span>
        </button>

        <button 
          onClick={() => setActiveTab('map')}
          className={`flex flex-col items-center space-y-0.5 ${activeTab === 'map' ? 'text-blue-600' : 'text-slate-400'}`}
        >
          <MapIcon size={20} />
          <span className="text-[10px] font-semibold">Map</span>
        </button>

        <button 
          onClick={() => setActiveTab('activity')}
          className={`flex flex-col items-center space-y-0.5 ${activeTab === 'activity' ? 'text-blue-600' : 'text-slate-400'}`}
        >
          <Activity size={20} />
          <span className="text-[10px] font-semibold">Activity</span>
        </button>

        <button 
          className="flex flex-col items-center space-y-0.5 text-slate-400 hover:text-slate-600"
        >
          <User size={20} />
          <span className="text-[10px] font-semibold">Profile</span>
        </button>
      </nav>

      {/* REPORT MODAL SHEET */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl p-5 w-full max-w-md max-h-[95vh] overflow-y-auto animate-in slide-in-from-bottom">
            <div className="flex justify-between items-center mb-1">
              <h2 className="text-base font-extrabold text-slate-900">Report Community Issue</h2>
              <button 
                type="button"
                onClick={() => setShowReportModal(false)} 
                className="p-1 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
              >
                <X size={16} />
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-4">CivicPulse links nearby duplicate complaints automatically.</p>

            <form onSubmit={handleCreateReport} className="space-y-4">
              
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                <select 
                  value={newCategory} 
                  onChange={(e) => setNewCategory(e.target.value as IssueCategory)}
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-xl bg-slate-50 font-medium"
                >
                  <option value="DRAINAGE">🌊 Drainage / Flooding</option>
                  <option value="ROADS">🛣️️ Roads / Potholes</option>
                  <option value="WASTE">🗑️ Waste / Trash</option>
                  <option value="LIGHTING">💡 Streetlights</option>
                  <option value="HAZARD">⚠️ Public Hazard</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Title</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Blocked Drain on Jalan 17/5" 
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Pin Affected Location</span>
                  <span className="text-[10px] text-blue-600 font-normal">Tap map to set pin</span>
                </label>
                <div className="h-[150px] w-full rounded-xl overflow-hidden border border-slate-300 mb-1.5">
                  <MapContainer center={selectedLocation} zoom={15} scrollWheelZoom={false}>
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
                  className="w-full p-2 text-[11px] bg-slate-100 text-slate-700 border border-slate-200 rounded-lg font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description (BM / English)</label>
                <textarea 
                  required
                  rows={2}
                  placeholder="e.g. Longkang tersumbat teruk, everytime hujan confirm banjir" 
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Attach Photos / Evidence</label>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <label className="flex items-center justify-center space-x-1.5 p-2.5 bg-slate-50 border border-slate-300 border-dashed rounded-xl cursor-pointer hover:bg-slate-100 transition text-slate-700 text-xs font-bold">
                    <ImageIcon size={16} className="text-blue-600" />
                    <span>Upload Gallery</span>
                    <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
                  </label>

                  <label className="flex items-center justify-center space-x-1.5 p-2.5 bg-blue-50 border border-blue-200 border-dashed rounded-xl cursor-pointer hover:bg-blue-100 transition text-blue-700 text-xs font-bold">
                    <ImageIcon size={16} className="text-blue-600" />
                    <span>Take Photo</span>
                    <input type="file" accept="image/*" capture="environment" onChange={handleImageUpload} className="hidden" />
                  </label>
                </div>

                {uploadedImages.length > 0 && (
                  <div className="flex space-x-2 overflow-x-auto pt-1">
                    {uploadedImages.map((imgUrl, index) => (
                      <div key={index} className="relative w-14 h-14 rounded-lg overflow-hidden border border-slate-200 flex-shrink-0">
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
                  className="flex-1 py-2.5 text-xs font-bold text-slate-600 bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow transition"
                >
                  Submit Issue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}