import React, { useState } from 'react';
import { ADMIN_ISSUES, AdminIssue } from '../mockData';
import { Search, Filter, AlertCircle, Clock, CheckCircle2, AlertTriangle, X, ShieldAlert, FileText, Check, MessageSquare, MapPin, Send, CornerUpRight } from 'lucide-react';

const categoryEmoji: Record<string, string> = {
  ROADS: '🛣️', DRAINAGE: '🌊', WASTE: '🗑️', LIGHTING: '💡', FALLEN_TREES: '🌳',
  OBSTRUCTION: '🚧', FACILITIES: '🏞️', PEDESTRIAN: '🚶', HAZARD: '⚠️', ENVIRONMENT: '🌱', OTHER: '📋',
};

type ColumnInfo = {
  id: string;
  title: string;
  icon: React.ReactNode;
  color: string;
};

const COLUMNS: ColumnInfo[] = [
  { id: 'REPORTED', title: 'New Reports', icon: <AlertCircle size={16} />, color: 'text-blue-400' },
  { id: 'IN_PROGRESS', title: 'In Progress', icon: <Clock size={16} />, color: 'text-orange-400' },
  { id: 'DISPUTED', title: 'Verification / Disputed', icon: <AlertTriangle size={16} />, color: 'text-red-400' },
  { id: 'MARKED_RESOLVED', title: 'Settled', icon: <CheckCircle2 size={16} />, color: 'text-emerald-400' },
];

export default function AllIssuesTab({ externalSearchQuery = '' }: { externalSearchQuery?: string }) {
  const [issues, setIssues] = useState<AdminIssue[]>(ADMIN_ISSUES);
  const [localSearchQuery, setLocalSearchQuery] = useState('');
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [selectedDisputedIssue, setSelectedDisputedIssue] = useState<AdminIssue | null>(null);
  const [selectedRegularIssue, setSelectedRegularIssue] = useState<AdminIssue | null>(null);
  const [overrideReason, setOverrideReason] = useState('');
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'DISPUTED'>('ALL');
  const [activeModalTab, setActiveModalTab] = useState<'details' | 'comms'>('details');
  const [chatInput, setChatInput] = useState('');

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    // Required for Firefox
    e.dataTransfer.setData('text/plain', id);
    // Subtle effect to make it look like we picked it up
    setTimeout(() => {
      e.target.style.opacity = '0.5';
    }, 0);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    e.target.style.opacity = '1';
    setDraggedId(null);
    setDragOverColumn(null);
  };

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault(); // Necessary to allow dropping
    if (dragOverColumn !== columnId) {
      setDragOverColumn(columnId);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverColumn(null);
  };

  const handleDrop = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    setDragOverColumn(null);
    if (!draggedId) return;

    setIssues(prev => prev.map(issue => 
      issue.id === draggedId ? { ...issue, status: columnId as any } : issue
    ));
    setDraggedId(null);
  };

  const handleForceClose = () => {
    if (!selectedDisputedIssue) return;
    setIssues(prev => prev.map(issue => 
      issue.id === selectedDisputedIssue.id ? { ...issue, status: 'MARKED_RESOLVED' } : issue
    ));
    setSelectedDisputedIssue(null);
    setOverrideReason('');
  };

  const getSeverityColor = (severity: string) => {
    if (severity === 'CRITICAL') return 'bg-red-500';
    if (severity === 'HIGH') return 'bg-orange-500';
    return 'bg-purple-500';
  };

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Issue Kanban</h2>
        <div className="flex gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
            <input 
              type="text" 
              placeholder="Search issues..." 
              value={localSearchQuery || externalSearchQuery}
              onChange={(e) => setLocalSearchQuery(e.target.value)}
              className="bg-[#1d1f30] text-sm text-white pl-10 pr-4 py-2.5 rounded-full border border-white/5 focus:outline-none focus:border-white/20 w-[240px]"
            />
          </div>
          <button 
            onClick={() => setActiveFilter(prev => prev === 'DISPUTED' ? 'ALL' : 'DISPUTED')}
            className={`px-4 py-2.5 rounded-full text-sm font-bold border transition flex items-center gap-2 ${activeFilter === 'DISPUTED' ? 'bg-red-500 text-white border-red-400 shadow-[0_0_20px_rgba(239,68,68,0.4)]' : 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.15)]'}`}
          >
            <AlertCircle size={14} /> Disputed Resolutions
          </button>
          <button className="bg-[#1d1f30] px-4 py-2.5 rounded-full text-sm text-gray-300 border border-white/5 flex items-center gap-2 hover:text-white transition">
            <Filter size={16} /> Filter
          </button>
        </div>
      </div>

      {/* Kanban Board Container */}
      <div className="flex gap-6 h-[calc(100vh-220px)] min-h-[600px] overflow-x-auto pb-4">
        {COLUMNS.map(col => {
          const query = (localSearchQuery || externalSearchQuery).toLowerCase();
          const columnIssues = issues.filter(i => {
            const matchesStatus = i.status === col.id || (col.id === 'MARKED_RESOLVED' && i.status === 'COMMUNITY_VERIFIED');
            const matchesFilter = activeFilter === 'ALL' || (activeFilter === 'DISPUTED' && i.status === 'DISPUTED');
            const matchesSearch = !query || i.title.toLowerCase().includes(query) || i.id.toLowerCase().includes(query) || i.category.toLowerCase().includes(query) || i.location.neighborhood.toLowerCase().includes(query);
            return matchesStatus && matchesFilter && matchesSearch;
          });
          const isOver = dragOverColumn === col.id;

          return (
            <div 
              key={col.id}
              className={`flex-1 min-w-[320px] flex flex-col bg-[#161825]/60 rounded-[1.25rem] border-2 transition-all duration-300 ${isOver ? 'border-white/30 bg-[#1d1f30]/80 shadow-[0_0_30px_rgba(255,255,255,0.05)]' : 'border-white/5'}`}
              onDragOver={(e) => handleDragOver(e, col.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, col.id)}
            >
              {/* Column Header */}
              <div className="p-5 flex items-center justify-between border-b border-white/5 bg-[#1d1f30]/40 rounded-t-[1.25rem]">
                <div className={`flex items-center gap-2 font-bold ${col.color}`}>
                  {col.icon}
                  <span className="tracking-wide">{col.title}</span>
                </div>
                <span className="bg-[#121420] text-gray-300 text-xs font-bold px-3 py-1 rounded-full border border-white/10 shadow-inner">
                  {columnIssues.length}
                </span>
              </div>

              {/* Cards Container */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {columnIssues.map(issue => {
                  const isDragging = draggedId === issue.id;
                  const isCritical = issue.severity === 'CRITICAL';
                  const isHigh = issue.severity === 'HIGH';
                  
                  // Default styling (Ethereal glass card)
                  let cardStyle = "bg-[#1d1f30]/80 backdrop-blur-md border-white/5 hover:bg-[#1d1f30]";
                  let titleColor = "text-gray-200";
                  let subTextColor = "text-gray-400";
                  let badgeBg = "bg-[#121420]";
                  let badgeText = "text-gray-300";

                  // When actively dragged or critical, we apply the solid vibrant colors seen in the reference
                  if (isDragging) {
                     cardStyle = "bg-gradient-to-br from-blue-500 to-blue-600 border-blue-400 opacity-90 scale-105 rotate-2 shadow-2xl z-50 relative";
                     titleColor = "text-white";
                     subTextColor = "text-blue-100";
                     badgeBg = "bg-black/20";
                     badgeText = "text-white";
                  } else if (isCritical) {
                     cardStyle = "bg-gradient-to-r from-red-500/10 to-orange-500/10 border-red-500/30 hover:border-red-500/50 shadow-[0_4px_20px_rgba(239,68,68,0.1)]";
                  }

                  return (
                    <div 
                      key={issue.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, issue.id)}
                      onDragEnd={handleDragEnd}
                      onClick={() => {
                        if (issue.status === 'DISPUTED') {
                          setSelectedDisputedIssue(issue);
                        } else {
                          setSelectedRegularIssue(issue);
                        }
                      }}
                      className={`relative p-5 rounded-2xl border cursor-grab active:cursor-grabbing transition-all duration-200 shadow-lg ${cardStyle} hover:ring-2 hover:ring-white/20`}
                    >
                      {/* SLA Timer (Feature 5) */}
                      {(isCritical || isHigh) && col.id !== 'MARKED_RESOLVED' && (
                        <div className={`absolute -top-3 -right-3 px-3 py-1 rounded-full text-[10px] font-black border ${isCritical ? 'bg-red-500 text-white border-red-400 shadow-[0_0_15px_rgba(239,68,68,0.6)] animate-pulse' : 'bg-orange-500 text-white border-orange-400 shadow-lg'}`}>
                          ⏱ SLA: {isCritical ? '2h 14m' : '12h 30m'}
                        </div>
                      )}

                      <div className="flex justify-between items-start mb-3">
                        <div className="w-10 h-10 rounded-full bg-[#121420] flex items-center justify-center text-xl shadow-inner border border-white/10 shrink-0">
                          {categoryEmoji[issue.category] || '📋'}
                        </div>
                        {/* Severity Dot */}
                        <div className={`w-3 h-3 rounded-full ${getSeverityColor(issue.severity)} shadow-[0_0_10px_currentColor]`}></div>
                      </div>

                      <h4 className={`font-bold text-[15px] mb-1 line-clamp-2 leading-snug ${titleColor}`}>{issue.title}</h4>
                      <p className={`text-xs font-mono mb-4 ${subTextColor}`}>ID: {issue.id}</p>

                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${badgeBg} ${badgeText} border border-white/5`}>
                          {issue.category}
                        </span>
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${badgeBg} ${badgeText} border border-white/5`}>
                          {issue.location.neighborhood}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Split-Screen Visual Comparison Modal */}
      {selectedDisputedIssue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in">
          <div className="absolute inset-0 bg-[#0f111a]/90 backdrop-blur-md" onClick={() => setSelectedDisputedIssue(null)}></div>
          <div className="relative w-full max-w-6xl max-h-[90vh] bg-[#1d1f30] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-white/10 bg-[#161825]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 border border-red-500/20">
                  <ShieldAlert size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    Disputed Resolution Audit
                    <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">Requires Action</span>
                  </h3>
                  <p className="text-sm text-gray-400">ID: {selectedDisputedIssue.id} • {selectedDisputedIssue.title}</p>
                </div>
              </div>
              <button onClick={() => setSelectedDisputedIssue(null)} className="text-gray-400 hover:text-white p-2 bg-white/5 rounded-full transition">
                <X size={20} />
              </button>
            </div>

            {/* Modal Body: Split Screen */}
            <div className="flex flex-col lg:flex-row flex-1 overflow-y-auto custom-scrollbar">
              {/* Left Side: Contractor Proof */}
              <div className="flex-1 flex flex-col border-r border-white/10 bg-[#121420]">
                <div className="p-4 border-b border-white/5 flex items-center justify-between shrink-0">
                  <h4 className="font-bold text-gray-200 flex items-center gap-2"><FileText size={16} className="text-blue-400"/> Contractor Submission</h4>
                  <span className="text-xs text-gray-500 font-mono">{selectedDisputedIssue.resolutionEvidence?.completedAt || 'N/A'}</span>
                </div>
                <div className="p-6 flex-1 flex flex-col">
                  <div className="w-full h-48 bg-black rounded-xl overflow-hidden mb-4 border border-white/10 relative group shrink-0">
                     {selectedDisputedIssue.resolutionEvidence?.afterPhoto ? (
                       <img src={selectedDisputedIssue.resolutionEvidence.afterPhoto} alt="Contractor Fix" className="w-full h-full object-cover" />
                     ) : (
                       <div className="w-full h-full flex items-center justify-center text-gray-600">No Photo Provided</div>
                     )}
                     <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-4">
                        <span className="text-white font-bold drop-shadow-md">Verified Upload Location: Valid Match</span>
                     </div>
                  </div>
                  <div className="space-y-4 flex-1">
                    <div>
                      <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Action Taken</label>
                      <p className="text-sm text-gray-200 mt-1 bg-[#1d1f30] p-3 rounded-lg border border-white/5">{selectedDisputedIssue.resolutionEvidence?.actionTaken || 'No notes provided.'}</p>
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Responsible Team</label>
                      <p className="text-sm text-gray-300 mt-1">{selectedDisputedIssue.resolutionEvidence?.responsibleTeam || 'Unknown'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Side: Community Truth */}
              <div className="flex-1 flex flex-col bg-[#161825]">
                <div className="p-4 border-b border-white/5 flex items-center justify-between shrink-0">
                  <h4 className="font-bold text-red-400 flex items-center gap-2"><AlertTriangle size={16}/> Community Verification</h4>
                  <span className="text-xs font-bold text-red-400 bg-red-500/10 px-2 py-1 rounded-full">{selectedDisputedIssue.communityVerificationRate || 0}% Say Still Broken</span>
                </div>
                <div className="p-6 flex-1 flex flex-col">
                  <div className="w-full h-48 bg-black rounded-xl overflow-hidden mb-4 border border-red-500/30 relative shrink-0">
                     {selectedDisputedIssue.images && selectedDisputedIssue.images[0] ? (
                       <img src={selectedDisputedIssue.images[0]} alt="Community Truth" className="w-full h-full object-cover" />
                     ) : (
                       <div className="w-full h-full flex items-center justify-center text-gray-600">No Photo Provided</div>
                     )}
                     <div className="absolute inset-0 bg-gradient-to-t from-red-900/80 to-transparent flex items-end p-4">
                        <span className="text-red-100 font-bold drop-shadow-md">Multiple new reports matching coordinates</span>
                     </div>
                  </div>
                  <div className="space-y-4 flex-1">
                    <div>
                      <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Community Notes</label>
                      <p className="text-sm text-red-200 mt-1 bg-red-500/10 p-3 rounded-lg border border-red-500/20 italic">{selectedDisputedIssue.description}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer: Actions */}
            <div className="p-5 border-t border-white/10 bg-[#1d1f30] flex flex-col gap-4 shrink-0">
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-gray-200">Admin Actions</h4>
                <div className="flex gap-3">
                  <button onClick={() => setSelectedDisputedIssue(null)} className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-lg transition flex items-center gap-2 shadow-[0_0_15px_rgba(249,115,22,0.3)]">
                    <Check size={16} /> Dispatch Field Auditor
                  </button>
                  <button onClick={() => setSelectedDisputedIssue(null)} className="px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white font-bold rounded-lg transition flex items-center gap-2 shadow-[0_0_15px_rgba(239,68,68,0.3)]">
                    <X size={16} /> Withhold Sign-Off (Reject)
                  </button>
                </div>
              </div>
              
              <div className="flex gap-3 items-end">
                <div className="flex-1">
                  <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider block mb-1">Admin Override (Justification)</label>
                  <input 
                    type="text" 
                    value={overrideReason}
                    onChange={(e) => setOverrideReason(e.target.value)}
                    placeholder="e.g. Surface repair completed; structural culvert widening scheduled under Belanjawan 2027" 
                    className="w-full bg-[#121420] text-sm text-white px-4 py-2.5 rounded-lg border border-white/10 focus:outline-none focus:border-purple-500"
                  />
                </div>
                <button 
                  disabled={!overrideReason}
                  onClick={handleForceClose}
                  className={`px-5 py-2.5 rounded-lg font-bold transition flex items-center gap-2 ${overrideReason ? 'bg-purple-600 text-white hover:bg-purple-500' : 'bg-gray-800 text-gray-500 cursor-not-allowed'}`}
                >
                   Force Close Case
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Regular Issue Details Modal */}
      {selectedRegularIssue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in">
          <div className="absolute inset-0 bg-[#0f111a]/90 backdrop-blur-md" onClick={() => setSelectedRegularIssue(null)}></div>
          <div className="relative w-full max-w-4xl bg-[#1d1f30] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="flex flex-col border-b border-white/10 bg-[#161825]">
              <div className="flex items-start justify-between p-5 pb-4">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500 border border-purple-500/20 text-2xl shrink-0">
                    {categoryEmoji[selectedRegularIssue.category] || '📋'}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-1">
                      {selectedRegularIssue.title}
                      <span className="bg-[#121420] border border-white/10 text-gray-300 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">{selectedRegularIssue.status.replace('_', ' ')}</span>
                    </h3>
                    
                    {/* Unified Reference ID Hub */}
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-purple-400 font-mono bg-purple-400/10 px-2 py-0.5 rounded border border-purple-400/20">
                        {selectedRegularIssue.id}
                      </span>
                      {selectedRegularIssue.externalRefs?.pbtCare && (
                        <span className="text-gray-400 font-mono border-l border-white/10 pl-3">
                          PBTCare: <span className="text-gray-300">{selectedRegularIssue.externalRefs.pbtCare}</span>
                        </span>
                      )}
                      {selectedRegularIssue.externalRefs?.sispaa && (
                        <span className="text-gray-400 font-mono border-l border-white/10 pl-3">
                          SISPAA: <span className="text-gray-300">{selectedRegularIssue.externalRefs.sispaa}</span>
                        </span>
                      )}
                      {selectedRegularIssue.externalRefs?.myJalan && (
                        <span className="text-gray-400 font-mono border-l border-white/10 pl-3">
                          MyJalan: <span className="text-gray-300">{selectedRegularIssue.externalRefs.myJalan}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button onClick={() => setSelectedRegularIssue(null)} className="text-gray-400 hover:text-white p-2 bg-white/5 rounded-full transition">
                  <X size={20} />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex px-5 gap-6 border-t border-white/5">
                <button 
                  onClick={() => setActiveModalTab('details')}
                  className={`py-3 text-sm font-bold border-b-2 transition-colors ${activeModalTab === 'details' ? 'border-purple-500 text-purple-400' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
                >
                  <div className="flex items-center gap-2"><FileText size={16} /> Overview & Logistics</div>
                </button>
                <button 
                  onClick={() => setActiveModalTab('comms')}
                  className={`py-3 text-sm font-bold border-b-2 transition-colors ${activeModalTab === 'comms' ? 'border-purple-500 text-purple-400' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
                >
                  <div className="flex items-center gap-2"><MessageSquare size={16} /> Inter-Agency Comms</div>
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#0f111a]">
              {activeModalTab === 'details' ? (
                <div className="p-6 flex flex-col md:flex-row gap-6">
                  {/* Left Column */}
                  <div className="flex-1 space-y-6">
                    <div className="w-full h-64 bg-black rounded-xl overflow-hidden border border-white/10 relative">
                      {selectedRegularIssue.images && selectedRegularIssue.images[0] ? (
                        <img src={selectedRegularIssue.images[0]} alt="Issue" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-600">No Photo Provided</div>
                      )}
                    </div>
                    
                    <div>
                      <h4 className="font-bold text-gray-200 mb-2">Citizen Description</h4>
                      <p className="text-sm text-gray-300 bg-[#1d1f30] p-4 rounded-xl border border-white/5 leading-relaxed">{selectedRegularIssue.description}</p>
                    </div>
                  </div>
                  
                  {/* Right Column */}
                  <div className="w-full md:w-[320px] space-y-4 shrink-0">
                    <div className="bg-[#1d1f30] p-5 rounded-xl border border-white/5">
                      <h4 className="font-bold text-xs text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2"><ShieldAlert size={14}/> Authorities Responsible</h4>
                      <div className="space-y-4">
                        <div className="bg-[#161825] p-3 rounded-lg border border-white/5">
                          <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Lead Agency</p>
                          <p className="text-sm font-bold text-white flex items-center gap-2">
                            {selectedRegularIssue.leadAgency || 'Pending Assignment'}
                            <span className="bg-green-500/10 text-green-400 text-[10px] px-2 py-0.5 rounded border border-green-500/20">Primary</span>
                          </p>
                        </div>
                        {selectedRegularIssue.supportingAgency && (
                          <div className="bg-[#161825] p-3 rounded-lg border border-white/5">
                            <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Supporting Agency</p>
                            <p className="text-sm font-bold text-gray-300">{selectedRegularIssue.supportingAgency}</p>
                          </div>
                        )}
                        
                        <div className="pt-2 border-t border-white/5">
                          <button className="w-full py-2.5 bg-[#161825] hover:bg-[#23263b] border border-white/10 rounded-lg text-sm font-bold text-gray-300 transition flex items-center justify-center gap-2 group">
                            <CornerUpRight size={14} className="text-gray-500 group-hover:text-purple-400 transition" />
                            Handover Jurisdiction
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="bg-[#1d1f30] p-5 rounded-xl border border-white/5">
                      <h4 className="font-bold text-xs text-gray-400 uppercase tracking-wider mb-4">Case Metrics</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-[#161825] p-3 rounded-lg border border-white/5">
                          <p className="text-[10px] text-gray-500 uppercase font-bold">Affected</p>
                          <p className="text-lg font-bold text-white">{selectedRegularIssue.affectedCount}</p>
                        </div>
                        <div className="bg-[#161825] p-3 rounded-lg border border-white/5">
                          <p className="text-[10px] text-gray-500 uppercase font-bold">Severity</p>
                          <p className={`text-sm font-bold mt-1 ${getSeverityColor(selectedRegularIssue.severity).replace('bg-', 'text-')}`}>
                            {selectedRegularIssue.severity}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col h-full min-h-[400px]">
                  <div className="flex-1 p-6 space-y-6">
                    {selectedRegularIssue.internalComments && selectedRegularIssue.internalComments.length > 0 ? (
                      selectedRegularIssue.internalComments.map((comment) => (
                        <div key={comment.id} className={`flex ${comment.isSystemAction ? 'justify-center' : 'flex-col'} gap-1`}>
                          {comment.isSystemAction ? (
                            <div className="bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs px-4 py-2 rounded-full font-mono flex items-center gap-2">
                              <CheckCircle2 size={12} /> {comment.text}
                            </div>
                          ) : (
                            <>
                              <div className="flex items-center gap-2 px-2">
                                <span className="font-bold text-sm text-gray-200">{comment.author}</span>
                                <span className="text-[10px] font-black uppercase tracking-wider text-gray-500 bg-white/5 px-2 py-0.5 rounded">{comment.agency}</span>
                                <span className="text-xs text-gray-600 font-mono">{comment.timestamp}</span>
                              </div>
                              <div className="bg-[#1d1f30] p-4 rounded-xl rounded-tl-sm border border-white/5 text-sm text-gray-300 leading-relaxed shadow-sm">
                                {comment.text.includes('@') ? (
                                  <>
                                    <span className="text-blue-400 font-bold bg-blue-500/10 px-1.5 py-0.5 rounded mr-1">
                                      {comment.text.split(':')[0]}
                                    </span>
                                    {comment.text.substring(comment.text.indexOf(':') + 1)}
                                  </>
                                ) : (
                                  comment.text
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-gray-500">
                        <MessageSquare size={32} className="mb-3 opacity-20" />
                        <p>No internal discussion yet.</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="p-4 border-t border-white/10 bg-[#161825]">
                    <div className="flex items-end gap-3 bg-[#0f111a] p-2 rounded-xl border border-white/10 focus-within:border-purple-500/50 transition">
                      <textarea 
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        placeholder="Tag an agency (@JKR) or write a note..."
                        className="w-full bg-transparent border-none focus:outline-none text-sm text-white resize-none max-h-32 min-h-[44px] p-3 custom-scrollbar"
                        rows={1}
                      />
                      <button 
                        className={`p-3 rounded-lg flex items-center justify-center transition shrink-0 ${chatInput.trim() ? 'bg-purple-600 text-white hover:bg-purple-500' : 'bg-white/5 text-gray-600'}`}
                      >
                        <Send size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
