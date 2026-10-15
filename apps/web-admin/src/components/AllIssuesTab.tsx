import React, { useState, useMemo } from 'react';
import { ADMIN_ISSUES, AdminIssue } from '../mockData';
import { Search, Filter, AlertCircle, Clock, CheckCircle2, AlertTriangle, X, ShieldAlert, FileText, Check, MessageSquare, MapPin, Send, CornerUpRight, ArrowRight, Grid3X3, List, Upload, Eye, Users, Calendar, Image, MoreVertical, ChevronDown } from 'lucide-react';

const categoryEmoji: Record<string, string> = {
  ROADS: '🛣️', DRAINAGE: '🌊', WASTE: '🗑️', LIGHTING: '💡', FALLEN_TREES: '🌳',
  OBSTRUCTION: '🚧', FACILITIES: '🏞️', PEDESTRIAN: '🚶', HAZARD: '⚠️', ENVIRONMENT: '🌱', OTHER: '📋',
};

const categoryLabels: Record<string, string> = {
  ROADS: 'Roads', DRAINAGE: 'Drainage', WASTE: 'Waste', LIGHTING: 'Lighting', FALLEN_TREES: 'Fallen Trees',
  OBSTRUCTION: 'Obstruction', FACILITIES: 'Facilities', PEDESTRIAN: 'Pedestrian', HAZARD: 'Hazard', ENVIRONMENT: 'Environment', OTHER: 'Other',
};

const categoryColors: Record<string, string> = {
  ROADS: '#F59E0B', DRAINAGE: '#3B82F6', WASTE: '#10B981', LIGHTING: '#A855F7', FALLEN_TREES: '#65A30D',
  OBSTRUCTION: '#EF4444', FACILITIES: '#06B6D4', PEDESTRIAN: '#EC4899', HAZARD: '#EF4444', ENVIRONMENT: '#22C55E', OTHER: '#64748B',
};

const statusConfig: Record<string, { label: string; color: string; bg: string; borderColor: string }> = {
  ALL: { label: 'All', color: 'text-gray-300', bg: 'bg-transparent', borderColor: 'border-white/10' },
  REPORTED: { label: 'New Reports', color: 'text-blue-400', bg: 'bg-blue-500/10', borderColor: 'border-blue-500/20' },
  IN_PROGRESS: { label: 'In Progress', color: 'text-orange-400', bg: 'bg-orange-500/10', borderColor: 'border-orange-500/20' },
  DISPUTED: { label: 'Disputed', color: 'text-red-400', bg: 'bg-red-500/10', borderColor: 'border-red-500/20' },
  MARKED_RESOLVED: { label: 'Settled', color: 'text-emerald-400', bg: 'bg-emerald-500/10', borderColor: 'border-emerald-500/20' },
};

const statusIconMap: Record<string, React.ReactNode> = {
  REPORTED: <AlertCircle size={14} />,
  IN_PROGRESS: <Clock size={14} />,
  DISPUTED: <AlertTriangle size={14} />,
  MARKED_RESOLVED: <CheckCircle2 size={14} />,
};

export default function AllIssuesTab({ externalSearchQuery = '' }: { externalSearchQuery?: string }) {
  const [issues, setIssues] = useState<AdminIssue[]>(ADMIN_ISSUES);
  const [localSearchQuery, setLocalSearchQuery] = useState('');
  const [selectedDisputedIssue, setSelectedDisputedIssue] = useState<AdminIssue | null>(null);
  const [selectedRegularIssue, setSelectedRegularIssue] = useState<AdminIssue | null>(null);
  const [overrideReason, setOverrideReason] = useState('');
  const [activeStatusFilter, setActiveStatusFilter] = useState<string>('ALL');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string | null>(null);
  const [activeModalTab, setActiveModalTab] = useState<'details' | 'comms'>('details');
  const [chatInput, setChatInput] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [statusDropdownId, setStatusDropdownId] = useState<string | null>(null);
  const [modalStatusDropdown, setModalStatusDropdown] = useState(false);

  const query = (localSearchQuery || externalSearchQuery).toLowerCase();

  // Category counts for the browse section
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    issues.forEach(issue => {
      counts[issue.category] = (counts[issue.category] || 0) + 1;
    });
    return counts;
  }, [issues]);

  // Unique categories present in the data
  const activeCategories = useMemo(() => {
    return Object.keys(categoryCounts).sort();
  }, [categoryCounts]);

  // Status counts
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: issues.length, REPORTED: 0, IN_PROGRESS: 0, DISPUTED: 0, MARKED_RESOLVED: 0 };
    issues.forEach(issue => {
      const normalizedStatus = (issue.status === 'COMMUNITY_VERIFIED' || issue.status === 'MARKED_RESOLVED') ? 'MARKED_RESOLVED' : issue.status;
      if (normalizedStatus === 'VERIFIED' || normalizedStatus === 'AGENCY_IDENTIFIED') {
        counts['REPORTED'] = (counts['REPORTED'] || 0) + 1;
      } else if (counts[normalizedStatus] !== undefined) {
        counts[normalizedStatus]++;
      }
    });
    return counts;
  }, [issues]);

  // Filtered issues
  const filteredIssues = useMemo(() => {
    return issues.filter(issue => {
      // Status filter
      if (activeStatusFilter !== 'ALL') {
        const normalizedStatus = (issue.status === 'COMMUNITY_VERIFIED' || issue.status === 'MARKED_RESOLVED') ? 'MARKED_RESOLVED' : issue.status;
        const isReported = normalizedStatus === 'VERIFIED' || normalizedStatus === 'AGENCY_IDENTIFIED' || normalizedStatus === 'REPORTED';
        if (activeStatusFilter === 'REPORTED' && !isReported && normalizedStatus !== 'REPORTED') return false;
        if (activeStatusFilter !== 'REPORTED' && normalizedStatus !== activeStatusFilter) return false;
      }

      // Category filter
      if (activeCategoryFilter && issue.category !== activeCategoryFilter) return false;

      // Search filter
      if (query) {
        const matchesSearch = issue.title.toLowerCase().includes(query) ||
          issue.id.toLowerCase().includes(query) ||
          issue.category.toLowerCase().includes(query) ||
          issue.location.neighborhood.toLowerCase().includes(query) ||
          issue.description.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      return true;
    });
  }, [issues, activeStatusFilter, activeCategoryFilter, query]);

  const handleForceClose = () => {
    if (!selectedDisputedIssue) return;
    setIssues(prev => prev.map(issue =>
      issue.id === selectedDisputedIssue.id ? { ...issue, status: 'MARKED_RESOLVED' } : issue
    ));
    setSelectedDisputedIssue(null);
    setOverrideReason('');
  };

  // ── Status Change Handler ──
  const STATUS_OPTIONS = [
    { value: 'REPORTED', label: 'New Report', icon: <AlertCircle size={14} />, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
    { value: 'IN_PROGRESS', label: 'In Progress', icon: <Clock size={14} />, color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
    { value: 'DISPUTED', label: 'Disputed', icon: <AlertTriangle size={14} />, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
    { value: 'MARKED_RESOLVED', label: 'Settled', icon: <CheckCircle2 size={14} />, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  ];

  const handleStatusChange = (issueId: string, newStatus: string) => {
    setIssues(prev => prev.map(issue =>
      issue.id === issueId ? { ...issue, status: newStatus as any } : issue
    ));
    // Also update the selected issue in modal if open
    if (selectedRegularIssue?.id === issueId) {
      setSelectedRegularIssue(prev => prev ? { ...prev, status: newStatus as any } : null);
    }
    setStatusDropdownId(null);
    setModalStatusDropdown(false);
  };

  const getSeverityColor = (severity: string) => {
    if (severity === 'CRITICAL') return 'bg-red-500';
    if (severity === 'HIGH') return 'bg-orange-500';
    if (severity === 'MEDIUM') return 'bg-purple-500';
    return 'bg-gray-500';
  };

  const getSeverityTextColor = (severity: string) => {
    if (severity === 'CRITICAL') return 'text-red-400';
    if (severity === 'HIGH') return 'text-orange-400';
    if (severity === 'MEDIUM') return 'text-purple-400';
    return 'text-gray-400';
  };

  const getStatusTag = (status: string) => {
    const normalized = (status === 'COMMUNITY_VERIFIED' || status === 'MARKED_RESOLVED') ? 'MARKED_RESOLVED' :
      (status === 'VERIFIED' || status === 'AGENCY_IDENTIFIED') ? 'REPORTED' : status;
    const config = statusConfig[normalized] || statusConfig.ALL;
    return (
      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${config.color} ${config.bg} border ${config.borderColor}`}>
        {config.label}
      </span>
    );
  };

  const getSLALabel = (issue: AdminIssue) => {
    if (issue.severity === 'CRITICAL') return { text: '⏱ SLA: 2h 14m', urgent: true };
    if (issue.severity === 'HIGH') return { text: '⏱ SLA: 12h 30m', urgent: false };
    return null;
  };

  const openIssue = (issue: AdminIssue) => {
    if (issue.status === 'DISPUTED') {
      setSelectedDisputedIssue(issue);
    } else {
      setSelectedRegularIssue(issue);
    }
  };

  const totalAffected = useMemo(() => filteredIssues.reduce((sum, i) => sum + i.affectedCount, 0), [filteredIssues]);

  return (
    <div className="space-y-6 animate-fade-up">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">All Issues</h2>
          <p className="text-sm text-gray-400 mt-1">
            {filteredIssues.length} issues · {totalAffected.toLocaleString()} citizens affected
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
            <input
              type="text"
              placeholder="Search issues..."
              value={localSearchQuery || externalSearchQuery}
              onChange={(e) => setLocalSearchQuery(e.target.value)}
              className="bg-[#1d1f30] text-sm text-white pl-10 pr-4 py-2.5 rounded-xl border border-white/5 focus:outline-none focus:border-purple-500/50 w-[260px] transition"
            />
          </div>
          <div className="flex bg-[#1d1f30] rounded-xl border border-white/5 overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2.5 transition ${viewMode === 'grid' ? 'bg-purple-500/20 text-purple-400' : 'text-gray-500 hover:text-gray-300'}`}
            >
              <Grid3X3 size={16} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2.5 transition ${viewMode === 'list' ? 'bg-purple-500/20 text-purple-400' : 'text-gray-500 hover:text-gray-300'}`}
            >
              <List size={16} />
            </button>
          </div>
          <button className="bg-[#1d1f30] px-4 py-2.5 rounded-xl text-sm text-gray-300 border border-white/5 flex items-center gap-2 hover:text-white hover:border-white/10 transition">
            <Filter size={16} /> Filter
          </button>
        </div>
      </div>

      {/* ── Browse by Category ── */}
      <div className="bg-[#161825]/60 rounded-2xl border border-white/5 p-5">
        <h3 className="text-sm font-bold text-gray-300 mb-1">Browse by category</h3>
        <p className="text-xs text-gray-500 mb-4">Quick access to issues by type</p>
        <div className="flex gap-3 flex-wrap">
          {activeCategories.map(cat => {
            const isActive = activeCategoryFilter === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategoryFilter(isActive ? null : cat)}
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border transition-all duration-200 group ${
                  isActive
                    ? 'bg-purple-500/15 border-purple-500/30 shadow-[0_0_20px_rgba(168,85,247,0.15)]'
                    : 'bg-[#1d1f30]/60 border-white/5 hover:bg-[#1d1f30] hover:border-white/10'
                }`}
              >
                <span className="text-xl">{categoryEmoji[cat] || '📋'}</span>
                <div className="text-left">
                  <p className={`text-xs font-bold ${isActive ? 'text-purple-300' : 'text-gray-300 group-hover:text-white'} transition`}>
                    {categoryLabels[cat] || cat}
                  </p>
                  <p className={`text-[10px] ${isActive ? 'text-purple-400/70' : 'text-gray-500'}`}>
                    {categoryCounts[cat]} issues
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Status Tab Filters ── */}
      <div className="flex items-center gap-1 border-b border-white/5 pb-0">
        {Object.entries(statusConfig).map(([key, config]) => {
          const isActive = activeStatusFilter === key;
          return (
            <button
              key={key}
              onClick={() => setActiveStatusFilter(key)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-colors ${
                isActive
                  ? `${config.color} border-current`
                  : 'text-gray-500 border-transparent hover:text-gray-300'
              }`}
            >
              {key !== 'ALL' && statusIconMap[key]}
              {config.label}
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ml-1 ${
                isActive ? `${config.bg} ${config.color} border ${config.borderColor}` : 'bg-[#1d1f30] text-gray-500 border border-white/5'
              }`}>
                {statusCounts[key] || 0}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Card Grid ── */}
      <div className={viewMode === 'grid'
        ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5'
        : 'flex flex-col gap-3'
      }>
        {filteredIssues.map((issue, index) => {
          const catColor = categoryColors[issue.category] || '#64748B';
          const sla = getSLALabel(issue);
          const hasPhoto = issue.images && issue.images.length > 0 && issue.images[0];

          if (viewMode === 'list') {
            return (
              <div
                key={issue.id}
                className="group relative flex items-center gap-4 px-5 py-4 bg-[#161825]/60 rounded-2xl border border-white/5 hover:bg-[#1d1f30]/80 hover:border-white/10 cursor-pointer transition-all duration-200 animate-fade-up"
                style={{ animationDelay: `${index * 0.03}s` }}
              >
                {/* Left accent */}
                <div className="w-1 h-12 rounded-full shrink-0" style={{ backgroundColor: catColor }} />

                {/* Emoji */}
                <div className="w-10 h-10 rounded-xl bg-[#121420] flex items-center justify-center text-lg border border-white/5 shrink-0">
                  {categoryEmoji[issue.category] || '📋'}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0" onClick={() => openIssue(issue)}>
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-bold text-sm text-gray-200 truncate">{issue.title}</h4>
                    {getStatusTag(issue.status)}
                  </div>
                  <p className="text-xs text-gray-500 truncate">{issue.description}</p>
                </div>

                {/* Meta */}
                <div className="flex items-center gap-4 shrink-0 text-xs text-gray-500">
                  {sla && (
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black border ${sla.urgent ? 'bg-red-500/10 text-red-400 border-red-500/20 animate-pulse' : 'bg-orange-500/10 text-orange-400 border-orange-500/20'}`}>
                      {sla.text}
                    </span>
                  )}
                  <span className="flex items-center gap-1"><Users size={12} /> {issue.affectedCount}</span>
                  <span className="flex items-center gap-1"><MapPin size={12} /> {issue.location.neighborhood}</span>

                  {/* Quick status change */}
                  <div className="relative">
                    <button
                      onClick={(e) => { e.stopPropagation(); setStatusDropdownId(statusDropdownId === issue.id ? null : issue.id); }}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-500 hover:text-white transition opacity-0 group-hover:opacity-100"
                    >
                      <MoreVertical size={14} />
                    </button>
                    {statusDropdownId === issue.id && (
                      <>
                        <div className="fixed inset-0 z-30" onClick={(e) => { e.stopPropagation(); setStatusDropdownId(null); }} />
                        <div className="absolute right-0 top-full mt-2 z-40 w-52 bg-[#1d1f30] border border-white/10 rounded-xl shadow-2xl overflow-hidden py-1 animate-fade-up">
                          <p className="px-4 py-2 text-[10px] font-black uppercase tracking-wider text-gray-500">Change Status</p>
                          {STATUS_OPTIONS.map(opt => (
                            <button
                              key={opt.value}
                              onClick={(e) => { e.stopPropagation(); handleStatusChange(issue.id, opt.value); }}
                              className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-bold transition hover:bg-white/5 ${issue.status === opt.value ? `${opt.color} ${opt.bg}` : 'text-gray-300'}`}
                            >
                              {opt.icon}
                              {opt.label}
                              {issue.status === opt.value && <Check size={14} className="ml-auto" />}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>

                  <ArrowRight size={14} className="text-gray-600 group-hover:text-purple-400 transition cursor-pointer" onClick={() => openIssue(issue)} />
                </div>
              </div>
            );
          }

          // ── Grid Card ──
          return (
            <div
              key={issue.id}
              onClick={() => openIssue(issue)}
              className="group relative flex flex-col bg-[#161825]/60 rounded-2xl border border-white/5 hover:bg-[#1d1f30]/80 hover:border-white/10 cursor-pointer transition-all duration-300 hover:shadow-[0_8px_32px_rgba(0,0,0,0.3)] animate-fade-up overflow-hidden"
              style={{ animationDelay: `${index * 0.04}s` }}
            >
              {/* Color accent bar */}
              <div className="absolute top-0 left-0 w-full h-[3px] rounded-t-2xl" style={{ backgroundColor: catColor }} />

              {/* SLA Badge */}
              {sla && issue.status !== 'MARKED_RESOLVED' && issue.status !== 'COMMUNITY_VERIFIED' && (
                <div className={`absolute top-4 right-4 z-10 px-2.5 py-1 rounded-lg text-[10px] font-black border ${sla.urgent ? 'bg-red-500 text-white border-red-400 shadow-[0_0_15px_rgba(239,68,68,0.5)] animate-pulse' : 'bg-orange-500/15 text-orange-400 border-orange-500/20'}`}>
                  {sla.text}
                </div>
              )}

              {/* Photo thumbnail */}
              {hasPhoto && (
                <div className="relative w-full h-36 overflow-hidden">
                  <img
                    src={issue.images![0]}
                    alt={issue.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#161825] via-transparent to-transparent" />
                  <div className="absolute bottom-2 left-3 flex items-center gap-1.5 text-[10px] text-white/70 bg-black/40 backdrop-blur-sm px-2 py-1 rounded-md">
                    <Image size={10} /> {issue.evidenceCount} evidence
                  </div>
                </div>
              )}

              {/* Card Body */}
              <div className="flex-1 p-5 pt-4 flex flex-col">
                {/* Top row: emoji + title + status */}
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-[#121420] flex items-center justify-center text-lg border border-white/5 shrink-0 shadow-inner">
                    {categoryEmoji[issue.category] || '📋'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-bold text-[15px] text-gray-200 leading-snug line-clamp-2 group-hover:text-white transition">{issue.title}</h4>
                    </div>
                    <div className="flex items-center gap-2 mt-1.5">
                      {getStatusTag(issue.status)}
                      {/* Severity dot */}
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold ${getSeverityTextColor(issue.severity)}`}>
                        <span className={`w-2 h-2 rounded-full ${getSeverityColor(issue.severity)} shadow-[0_0_6px_currentColor]`} />
                        {issue.severity}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-gray-400 leading-relaxed line-clamp-2 mb-4">{issue.description}</p>

                {/* Metadata row */}
                <div className="flex items-center gap-3 text-[11px] text-gray-500 mb-4 flex-wrap">
                  <span className="flex items-center gap-1" style={{ color: catColor }}>
                    {categoryEmoji[issue.category]} {categoryLabels[issue.category] || issue.category}
                  </span>
                  <span className="text-gray-700">·</span>
                  <span className="flex items-center gap-1"><Users size={11} /> {issue.affectedCount} affected</span>
                  <span className="text-gray-700">·</span>
                  <span className="flex items-center gap-1"><MapPin size={11} /> {issue.location.neighborhood}</span>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-white/5 mt-auto">
                  <div className="flex items-center gap-3 text-[11px] text-gray-500">
                    <span className="font-mono text-gray-600">{issue.id}</span>
                    <span className="text-gray-700">·</span>
                    <span className="flex items-center gap-1"><Calendar size={11} /> {issue.createdAt}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Quick status change button */}
                    <div className="relative">
                      <button
                        onClick={(e) => { e.stopPropagation(); setStatusDropdownId(statusDropdownId === issue.id ? null : issue.id); }}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-500 hover:text-white transition opacity-0 group-hover:opacity-100"
                        title="Change status"
                      >
                        <MoreVertical size={14} />
                      </button>
                      {statusDropdownId === issue.id && (
                        <>
                          <div className="fixed inset-0 z-30" onClick={(e) => { e.stopPropagation(); setStatusDropdownId(null); }} />
                          <div className="absolute right-0 bottom-full mb-2 z-40 w-52 bg-[#1d1f30] border border-white/10 rounded-xl shadow-2xl overflow-hidden py-1 animate-fade-up">
                            <p className="px-4 py-2 text-[10px] font-black uppercase tracking-wider text-gray-500">Change Status</p>
                            {STATUS_OPTIONS.map(opt => (
                              <button
                                key={opt.value}
                                onClick={(e) => { e.stopPropagation(); handleStatusChange(issue.id, opt.value); }}
                                className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-bold transition hover:bg-white/5 ${issue.status === opt.value ? `${opt.color} ${opt.bg}` : 'text-gray-300'}`}
                              >
                                {opt.icon}
                                {opt.label}
                                {issue.status === opt.value && <Check size={14} className="ml-auto" />}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                    <button onClick={() => openIssue(issue)} className="flex items-center gap-1.5 text-xs font-bold text-gray-500 group-hover:text-purple-400 transition">
                      Open <ArrowRight size={13} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty state */}
      {filteredIssues.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-gray-500">
          <Search size={40} className="mb-4 opacity-20" />
          <p className="text-lg font-bold text-gray-400 mb-1">No issues found</p>
          <p className="text-sm">Try adjusting your filters or search query.</p>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════ */}
      {/* Split-Screen Visual Comparison Modal (Disputed)       */}
      {/* ═══════════════════════════════════════════════════════ */}
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

      {/* ═══════════════════════════════════════════════════════ */}
      {/* Regular Issue Details Modal                            */}
      {/* ═══════════════════════════════════════════════════════ */}
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
                      {/* Clickable status dropdown */}
                      <div className="relative">
                        <button
                          onClick={() => setModalStatusDropdown(!modalStatusDropdown)}
                          className="flex items-center gap-1 bg-[#121420] border border-white/10 hover:border-white/20 text-gray-300 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider transition group/status"
                        >
                          {(() => {
                            const opt = STATUS_OPTIONS.find(o => o.value === selectedRegularIssue.status) || STATUS_OPTIONS.find(o => o.value === 'REPORTED');
                            return opt ? <span className={`flex items-center gap-1 ${opt.color}`}>{opt.icon} {opt.label}</span> : selectedRegularIssue.status.replace('_', ' ');
                          })()}
                          <ChevronDown size={12} className="text-gray-500 group-hover/status:text-white transition" />
                        </button>
                        {modalStatusDropdown && (
                          <>
                            <div className="fixed inset-0 z-30" onClick={() => setModalStatusDropdown(false)} />
                            <div className="absolute left-0 top-full mt-2 z-40 w-56 bg-[#1d1f30] border border-white/10 rounded-xl shadow-2xl overflow-hidden py-1 animate-fade-up">
                              <p className="px-4 py-2 text-[10px] font-black uppercase tracking-wider text-gray-500">Change Status</p>
                              {STATUS_OPTIONS.map(opt => (
                                <button
                                  key={opt.value}
                                  onClick={() => handleStatusChange(selectedRegularIssue.id, opt.value)}
                                  className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-bold transition hover:bg-white/5 ${selectedRegularIssue.status === opt.value ? `${opt.color} ${opt.bg}` : 'text-gray-300'}`}
                                >
                                  {opt.icon}
                                  {opt.label}
                                  {selectedRegularIssue.status === opt.value && <Check size={14} className="ml-auto" />}
                                </button>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
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
