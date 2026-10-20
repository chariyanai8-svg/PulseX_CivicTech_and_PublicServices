import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { ADMIN_ISSUES, AdminIssue } from '../mockData';
import { API_BASE } from '../apiConfig';
import { SupportedLanguage, translateTitle, translateDescription } from '../../../../packages/shared-types';
import { Search, Filter, AlertCircle, Clock, CheckCircle2, AlertTriangle, X, ShieldAlert, FileText, Check, MessageSquare, MapPin, Send, CornerUpRight, ArrowRight, Grid3X3, List, Upload, Eye, Users, Calendar, Image, MoreVertical, ChevronDown, Download, RotateCcw } from 'lucide-react';

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

export default function AllIssuesTab({ externalSearchQuery = '', language = 'EN' }: { externalSearchQuery?: string; language?: SupportedLanguage }) {
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

  // Advanced Filter state
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');
  const [filterAgency, setFilterAgency] = useState<string>('ALL');
  const [filterRecurringOnly, setFilterRecurringOnly] = useState(false);

  // Handover state
  const [isHandoverOpen, setIsHandoverOpen] = useState(false);
  const [targetAgency, setTargetAgency] = useState('JKR Federal Road Maintenance');
  const [handoverReason, setHandoverReason] = useState('');
  const [handoverSuccess, setHandoverSuccess] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const activeFilterCount = (filterSeverity !== 'ALL' ? 1 : 0) + (filterAgency !== 'ALL' ? 1 : 0) + (filterRecurringOnly ? 1 : 0);

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
        if (activeStatusFilter === 'REPORTED' && !isReported) return false;
        if (activeStatusFilter !== 'REPORTED' && normalizedStatus !== activeStatusFilter) return false;
      }

      // Category filter
      if (activeCategoryFilter && issue.category !== activeCategoryFilter) return false;

      // Severity filter
      if (filterSeverity !== 'ALL' && issue.severity !== filterSeverity) return false;

      // Agency filter
      if (filterAgency !== 'ALL' && !issue.leadAgency?.toLowerCase().includes(filterAgency.toLowerCase())) return false;

      // Recurring filter
      if (filterRecurringOnly && !issue.isRecurring) return false;

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
  }, [issues, activeStatusFilter, activeCategoryFilter, filterSeverity, filterAgency, filterRecurringOnly, query]);

  const handleDispatchAuditor = async (issueId: string) => {
    try {
      await fetch(`${API_BASE}/issues/${issueId}/audit-dispatch`, { method: 'POST' });
    } catch (e) {
      console.warn('Failed to dispatch auditor on server:', e);
    }
    setIssues(prev => prev.map(issue =>
      issue.id === issueId ? {
        ...issue,
        status: 'IN_PROGRESS',
        timeline: [...issue.timeline, { date: 'Today', title: 'Field Auditor Dispatched', description: 'MBPJ Auditor dispatched to conduct site verification.' }]
      } : issue
    ));
    setSelectedDisputedIssue(null);
    showToast(`Site auditor dispatched for case ${issueId}.`);
  };

  const handleRejectResolution = async (issueId: string) => {
    try {
      await fetch(`${API_BASE}/issues/${issueId}/reject-resolution`, { method: 'POST' });
    } catch (e) {
      console.warn('Failed to reject resolution on server:', e);
    }
    setIssues(prev => prev.map(issue =>
      issue.id === issueId ? {
        ...issue,
        status: 'IN_PROGRESS',
        timeline: [...issue.timeline, { date: 'Today', title: 'Resolution Withheld / Rejected', description: 'Council withheld contractor sign-off following community vote.' }]
      } : issue
    ));
    setSelectedDisputedIssue(null);
    showToast(`Contractor sign-off withheld for case ${issueId}.`);
  };

  const handleForceClose = async () => {
    if (!selectedDisputedIssue) return;
    const issueId = selectedDisputedIssue.id;
    const reason = overrideReason;
    try {
      await fetch(`${API_BASE}/issues/${issueId}/force-close`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      });
    } catch (e) {
      console.warn('Failed to force close on server:', e);
    }
    setIssues(prev => prev.map(issue =>
      issue.id === issueId ? {
        ...issue,
        status: 'MARKED_RESOLVED',
        timeline: [...issue.timeline, { date: 'Today', title: 'Council Administrative Override (Closed)', description: reason }]
      } : issue
    ));
    setSelectedDisputedIssue(null);
    setOverrideReason('');
    showToast(`Case ${issueId} closed via executive override.`);
  };

  const handleExportCSV = () => {
    const headers = ['Issue ID', 'Title', 'Category', 'Status', 'Severity', 'Lead Agency', 'Affected Count', 'Neighborhood', 'Address', 'Created Date'];
    const rows = filteredIssues.map(i => [
      i.id,
      `"${(i.title || '').replace(/"/g, '""')}"`,
      i.category,
      i.status,
      i.severity,
      `"${(i.leadAgency || '').replace(/"/g, '""')}"`,
      i.affectedCount || 1,
      `"${(i.location?.neighborhood || '').replace(/"/g, '""')}"`,
      `"${(i.location?.address || '').replace(/"/g, '""')}"`,
      i.createdAt || ''
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `civicpulse_issues_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Exported ${filteredIssues.length} issues to CSV.`);
  };

  const handleResetAllFilters = () => {
    setActiveStatusFilter('ALL');
    setActiveCategoryFilter(null);
    setFilterSeverity('ALL');
    setFilterAgency('ALL');
    setFilterRecurringOnly(false);
    setLocalSearchQuery('');
    showToast('All search and category filters reset.');
  };

  const handleSendComment = async () => {
    if (!selectedRegularIssue || !chatInput.trim()) return;
    const text = chatInput.trim();
    setChatInput('');
    try {
      const res = await fetch(`${API_BASE}/issues/${selectedRegularIssue.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          author: 'Datuk Amirul',
          agency: 'MBPJ Executive',
          text
        })
      });
      if (res.ok) {
        const json = await res.json();
        if (json.comments) {
          setSelectedRegularIssue(prev => prev ? { ...prev, internalComments: json.comments } : null);
          setIssues(prev => prev.map(i => i.id === selectedRegularIssue.id ? { ...i, internalComments: json.comments } : i));
          return;
        }
      }
    } catch (e) {
      console.warn('Failed to post comment to server:', e);
    }
    const newComment = {
      id: `C-${Date.now()}`,
      author: 'Datuk Amirul',
      agency: 'MBPJ Executive',
      text,
      timestamp: 'Just now'
    };
    setSelectedRegularIssue(prev => prev ? {
      ...prev,
      internalComments: [...(prev.internalComments || []), newComment]
    } : null);
  };

  // ── Status Change Handler ──
  const STATUS_OPTIONS = [
    { value: 'REPORTED', label: 'New Report', icon: <AlertCircle size={14} />, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
    { value: 'IN_PROGRESS', label: 'In Progress', icon: <Clock size={14} />, color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
    { value: 'DISPUTED', label: 'Disputed', icon: <AlertTriangle size={14} />, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
    { value: 'MARKED_RESOLVED', label: 'Settled', icon: <CheckCircle2 size={14} />, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  ];


  // Fetch live issues from database
  React.useEffect(() => {
    const fetchAdminIssues = async () => {
      try {
        const res = await fetch(`${API_BASE}/issues`);
        if (res.ok) {
          const json = await res.json();
          if (json.data && Array.isArray(json.data)) {
            setIssues(prev => {
              // Merge live server attributes with existing UI admin attributes
              return json.data.map((srv: any) => {
                const existing = prev.find(p => p.id === srv.id);
                return {
                  ...(existing || {}),
                  ...srv,
                  severity: existing?.severity || (srv.isRecurring ? 'HIGH' : 'MEDIUM'),
                  leadAgency: existing?.leadAgency || 'MBPJ Engineering',
                  locationConfidence: existing?.locationConfidence || 'HIGH',
                  relatedReports: srv.reportCount || existing?.relatedReports || 1,
                  socialSignals: existing?.socialSignals || 12,
                };
              });
            });
          }
        }
      } catch (e) {
        console.warn('Admin API sync unreachable, using local data:', e);
      }
    };

    fetchAdminIssues();
    const interval = setInterval(fetchAdminIssues, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleStatusChange = async (issueId: string, newStatus: string) => {
    // Optimistic UI update
    setIssues(prev => prev.map(issue =>
      issue.id === issueId ? { ...issue, status: newStatus as any } : issue
    ));
    if (selectedRegularIssue?.id === issueId) {
      setSelectedRegularIssue(prev => prev ? { ...prev, status: newStatus as any } : null);
    }
    setStatusDropdownId(null);
    setModalStatusDropdown(false);
    showToast(`Case ${issueId} updated to ${newStatus.replace('_', ' ')}.`);

    try {
      await fetch(`${API_BASE}/issues/${issueId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          title: `Council changed status to ${newStatus}`
        })
      });
    } catch (e) {
      console.warn('Failed to persist status change to server:', e);
    }
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
              className="bg-[#1d1f30] text-sm text-white pl-10 pr-9 py-2.5 rounded-xl border border-white/5 focus:outline-none focus:border-purple-500/50 w-[260px] transition"
            />
            {(localSearchQuery || externalSearchQuery) && (
              <button
                onClick={() => setLocalSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white p-1 rounded-full transition"
                title="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>
          <div className="flex bg-[#1d1f30] rounded-xl border border-white/5 overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2.5 transition ${viewMode === 'grid' ? 'bg-purple-500/20 text-purple-400' : 'text-gray-500 hover:text-gray-300'}`}
              title="Grid view"
            >
              <Grid3X3 size={16} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2.5 transition ${viewMode === 'list' ? 'bg-purple-500/20 text-purple-400' : 'text-gray-500 hover:text-gray-300'}`}
              title="List view"
            >
              <List size={16} />
            </button>
          </div>
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2.5 rounded-xl text-sm border bg-[#1d1f30] text-gray-300 border-white/5 hover:text-white hover:border-white/10 flex items-center gap-1.5 transition active:scale-95"
            title="Export filtered issues to CSV"
          >
            <Download size={15} />
            <span className="hidden sm:inline font-medium">Export</span>
          </button>
          <div className="relative">
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`px-4 py-2.5 rounded-xl text-sm border flex items-center gap-2 transition active:scale-95 ${
                activeFilterCount > 0
                  ? 'bg-purple-600/20 text-purple-300 border-purple-500/40 shadow-xs'
                  : 'bg-[#1d1f30] text-gray-300 border-white/5 hover:text-white hover:border-white/10'
              }`}
            >
              <Filter size={16} className={activeFilterCount > 0 ? 'text-purple-400' : ''} />
              <span>Filter</span>
              {activeFilterCount > 0 && (
                <span className="w-5 h-5 bg-purple-600 text-white rounded-full text-[11px] font-black flex items-center justify-center ml-0.5">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* Filter Dropdown Popover */}
            {isFilterOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setIsFilterOpen(false)} />
                <div className="absolute right-0 top-full mt-2 w-[320px] bg-[#1d1f30] border border-white/10 rounded-2xl shadow-2xl p-4 z-40 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
                    <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Filter size={13} className="text-purple-400" /> Filter Options
                    </span>
                    {activeFilterCount > 0 && (
                      <button
                        onClick={() => {
                          setFilterSeverity('ALL');
                          setFilterAgency('ALL');
                          setFilterRecurringOnly(false);
                        }}
                        className="text-[11px] text-purple-400 hover:text-purple-300 transition font-medium"
                      >
                        Reset All
                      </button>
                    )}
                  </div>

                  {/* Severity */}
                  <div className="mb-3">
                    <label className="text-[11px] font-semibold text-gray-400 block mb-1.5">Severity</label>
                    <div className="grid grid-cols-3 gap-1.5 text-xs">
                      {(['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const).map(sev => (
                        <button
                          key={sev}
                          onClick={() => setFilterSeverity(sev)}
                          className={`py-1.5 px-2 rounded-lg text-[10px] font-bold border transition ${
                            filterSeverity === sev
                              ? 'bg-purple-600 text-white border-purple-500 shadow-xs'
                              : 'bg-[#121420] text-gray-400 border-white/5 hover:text-white'
                          }`}
                        >
                          {sev}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Lead Agency */}
                  <div className="mb-3">
                    <label className="text-[11px] font-semibold text-gray-400 block mb-1.5">Lead Agency</label>
                    <div className="space-y-1">
                      {[
                        { label: 'All Agencies', value: 'ALL' },
                        { label: 'MBPJ Engineering', value: 'MBPJ' },
                        { label: 'JKR Federal Road', value: 'JKR' },
                        { label: 'Alam Flora Waste', value: 'Alam' },
                        { label: 'Tenaga Nasional (TNB)', value: 'Tenaga' },
                      ].map(ag => (
                        <button
                          key={ag.value}
                          onClick={() => setFilterAgency(ag.value)}
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] font-medium border transition flex items-center justify-between ${
                            filterAgency === ag.value
                              ? 'bg-purple-600/20 text-purple-300 border-purple-500/40'
                              : 'bg-[#121420] text-gray-400 border-white/5 hover:text-white'
                          }`}
                        >
                          <span>{ag.label}</span>
                          {filterAgency === ag.value && <Check size={12} className="text-purple-400" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Recurring Checkbox */}
                  <div className="mb-4 pt-2 border-t border-white/5">
                    <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-300">
                      <input
                        type="checkbox"
                        checked={filterRecurringOnly}
                        onChange={e => setFilterRecurringOnly(e.target.checked)}
                        className="rounded bg-[#121420] border-white/20 text-purple-600 focus:ring-0"
                      />
                      <span>Only Show Recurring Cases</span>
                    </label>
                  </div>

                  <button
                    onClick={() => setIsFilterOpen(false)}
                    className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition shadow-sm"
                  >
                    Apply Filters ({filteredIssues.length} matches)
                  </button>
                </div>
              </>
            )}
          </div>
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
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border transition-all duration-200 group ${isActive
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
              className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-colors ${isActive
                  ? `${config.color} border-current`
                  : 'text-gray-500 border-transparent hover:text-gray-300'
                }`}
            >
              {key !== 'ALL' && statusIconMap[key]}
              {config.label}
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ml-1 ${isActive ? `${config.bg} ${config.color} border ${config.borderColor}` : 'bg-[#1d1f30] text-gray-500 border border-white/5'
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
                    <h4 className="font-bold text-sm text-gray-200 truncate">{translateTitle(issue.title, language)}</h4>
                    {getStatusTag(issue.status)}
                  </div>
                  <p className="text-xs text-gray-500 truncate">{translateDescription(issue.description, language)}</p>
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
                      <h4 className="font-bold text-[15px] text-gray-200 leading-snug line-clamp-2 group-hover:text-white transition">{translateTitle(issue.title, language)}</h4>
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
                <p className="text-xs text-gray-400 leading-relaxed line-clamp-2 mb-4">{translateDescription(issue.description, language)}</p>

                {/* Metadata row */}
                <div className="flex items-center gap-3 text-[11px] text-gray-500 mb-4 flex-wrap">
                  <span className="flex items-center gap-1" style={{ color: catColor }}>
                    {categoryEmoji[issue.category]} {categoryLabels[issue.category] || issue.category}
                  </span>
                  <span className="text-gray-700">·</span>
                  <span className="flex items-center gap-1"><Users size={11} /> {issue.affectedCount} {language === 'BM' ? 'terjejas' : 'affected'}</span>
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
          <p className="text-sm mb-4">Try adjusting your filters or search query.</p>
          <button
            onClick={handleResetAllFilters}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm active:scale-95"
          >
            <RotateCcw size={14} />
            <span>Reset All Filters</span>
          </button>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════ */}
      {/* Split-Screen Visual Comparison Modal (Disputed)       */}
      {/* ═══════════════════════════════════════════════════════ */}
      {/* ═══════════════════════════════════════════════════════ */}
      {/* Split-Screen Visual Comparison Modal (Disputed)       */}
      {/* ═══════════════════════════════════════════════════════ */}
      {selectedDisputedIssue && createPortal(
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          {/* Full-Screen Frosted Backdrop - true viewport coverage, smooth focus */}
          <div 
            className="fixed inset-0 bg-slate-950/45 dark:bg-black/70 backdrop-blur-sm transition-opacity" 
            onClick={() => setSelectedDisputedIssue(null)}
          />

          <div className="relative w-full max-w-4xl max-h-[92vh] bg-white dark:bg-[#181a27] border border-slate-200/90 dark:border-white/10 rounded-2xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.3)] flex flex-col overflow-hidden text-slate-900 dark:text-white my-auto animate-in fade-in zoom-in-95 duration-200">

            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-white/10 bg-slate-50/80 dark:bg-[#141622] shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 dark:bg-red-500/20 flex items-center justify-center text-red-600 dark:text-red-400 border border-red-500/20 shadow-xs">
                  <ShieldAlert size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                      Disputed Resolution Audit
                    </h3>
                    <span className="bg-red-500/10 dark:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/20 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      Requires Action
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">
                    Case <span className="font-mono font-bold text-slate-700 dark:text-gray-300">{selectedDisputedIssue.id}</span> • {translateTitle(selectedDisputedIssue.title, language)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedDisputedIssue(null)}
                className="text-slate-400 hover:text-slate-700 dark:text-gray-400 dark:hover:text-white p-2 rounded-xl hover:bg-slate-200/60 dark:hover:bg-white/10 transition"
                title="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body: Split Screen */}
            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100 dark:divide-white/10 flex-1 min-h-0 overflow-y-auto custom-scrollbar">
              {/* Left Side: Contractor Proof */}
              <div className="flex flex-col p-5 space-y-3.5 bg-white dark:bg-transparent">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-white/5 shrink-0">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                      <FileText size={14} />
                    </div>
                    <h4 className="font-bold text-slate-800 dark:text-gray-200 text-xs sm:text-sm">Contractor Submission</h4>
                  </div>
                  <span className="text-[10px] text-slate-500 dark:text-gray-400 font-mono bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded-md border border-slate-200/60 dark:border-white/5">
                    {selectedDisputedIssue.resolutionEvidence?.completedAt || 'Date N/A'}
                  </span>
                </div>

                {/* Evidence Image Container (Clean slate, subtle tag) */}
                <div className="w-full h-40 bg-slate-100/90 dark:bg-[#12131e] rounded-xl overflow-hidden border border-slate-200/80 dark:border-white/10 relative group shadow-xs shrink-0 flex items-center justify-center">
                  {selectedDisputedIssue.resolutionEvidence?.afterPhoto ? (
                    <img
                      src={selectedDisputedIssue.resolutionEvidence.afterPhoto}
                      alt="Contractor Fix Proof"
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-400 dark:text-gray-500">
                      <Image size={32} className="mb-1.5 opacity-40 text-slate-400" />
                      <span className="text-xs font-semibold text-slate-500 dark:text-gray-400">No Contractor Photo Attached</span>
                    </div>
                  )}
                  <div className="absolute bottom-2.5 left-2.5 bg-white/95 dark:bg-black/85 backdrop-blur-sm text-slate-700 dark:text-slate-200 px-2.5 py-1 rounded-lg text-[11px] font-medium border border-slate-200/70 dark:border-white/10 flex items-center gap-1.5 shadow-xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span>GPS Radius Validated</span>
                  </div>
                </div>

                {/* Quick Info Grid */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="bg-slate-50 dark:bg-[#141624] p-2.5 rounded-xl border border-slate-100 dark:border-white/5">
                    <label className="text-[9px] uppercase font-bold text-slate-400 dark:text-gray-400 tracking-wider block">
                      Responsible Team
                    </label>
                    <p className="text-xs font-bold text-slate-800 dark:text-gray-100 truncate mt-0.5">
                      {selectedDisputedIssue.resolutionEvidence?.responsibleTeam || 'MBPJ Engineering'}
                    </p>
                  </div>
                  <div className="bg-slate-50 dark:bg-[#141624] p-2.5 rounded-xl border border-slate-100 dark:border-white/5">
                    <label className="text-[9px] uppercase font-bold text-slate-400 dark:text-gray-400 tracking-wider block">
                      Claimed Status
                    </label>
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                      <Check size={12} /> Marked Resolved
                    </span>
                  </div>
                </div>

                {/* Action Notes Box */}
                <div className="bg-slate-50 dark:bg-[#141624] p-3 rounded-xl border border-slate-100 dark:border-white/5 flex-1">
                  <label className="text-[9px] uppercase font-bold text-slate-400 dark:text-gray-400 tracking-wider block mb-1">
                    Action Taken & Notes
                  </label>
                  <p className="text-xs text-slate-600 dark:text-gray-300 leading-relaxed">
                    {selectedDisputedIssue.resolutionEvidence?.actionTaken || 'Contractor marked site clear without additional notes.'}
                  </p>
                </div>
              </div>

              {/* Right Side: Community Ground Truth */}
              <div className="flex flex-col p-5 space-y-3.5 bg-white dark:bg-transparent">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-white/5 shrink-0">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center">
                      <AlertTriangle size={14} />
                    </div>
                    <h4 className="font-bold text-red-600 dark:text-red-400 text-xs sm:text-sm">Community Verification</h4>
                  </div>
                  <span className="text-[10px] font-black text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/15 border border-red-200 dark:border-red-500/30 px-2 py-0.5 rounded-md flex items-center gap-1.5 shadow-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"></span>
                    {selectedDisputedIssue.communityVerificationRate || 32}% Say Still Broken
                  </span>
                </div>

                {/* Community Photo Container */}
                <div className="w-full h-40 bg-slate-100/90 dark:bg-[#12131e] rounded-xl overflow-hidden border border-red-200/80 dark:border-red-500/30 relative group shadow-xs shrink-0 flex items-center justify-center">
                  {selectedDisputedIssue.images && selectedDisputedIssue.images[0] ? (
                    <img
                      src={selectedDisputedIssue.images[0]}
                      alt="Community Ground Truth"
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-400 dark:text-gray-500">
                      <Image size={32} className="mb-1.5 opacity-40 text-slate-400" />
                      <span className="text-xs font-semibold text-slate-500 dark:text-gray-400">No Ground Photo Provided</span>
                    </div>
                  )}
                  <div className="absolute bottom-2.5 left-2.5 bg-slate-900/85 dark:bg-black/85 backdrop-blur-sm text-white px-2.5 py-1 rounded-lg text-[11px] font-medium border border-white/10 flex items-center gap-1.5 shadow-xs">
                    <AlertCircle size={12} className="text-red-400 shrink-0" />
                    <span>22 Citizen Reports Match Coordinates</span>
                  </div>
                </div>

                {/* Quick Info Grid */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="bg-red-50/50 dark:bg-red-500/5 p-2.5 rounded-xl border border-red-100 dark:border-red-500/15">
                    <label className="text-[9px] uppercase font-bold text-red-500 dark:text-red-400/80 tracking-wider block">
                      Citizen Consensus
                    </label>
                    <p className="text-xs font-bold text-slate-800 dark:text-red-300 mt-0.5">
                      Dispute Active (Unresolved)
                    </p>
                  </div>
                  <div className="bg-red-50/50 dark:bg-red-500/5 p-2.5 rounded-xl border border-red-100 dark:border-red-500/15">
                    <label className="text-[9px] uppercase font-bold text-red-500 dark:text-red-400/80 tracking-wider block">
                      Affected Residents
                    </label>
                    <p className="text-xs font-bold text-slate-800 dark:text-red-300 mt-0.5">
                      {selectedDisputedIssue.affectedCount || 18} Affected Households
                    </p>
                  </div>
                </div>

                {/* Community Notes Box */}
                <div className="bg-red-50/50 dark:bg-red-500/5 p-3 rounded-xl border border-red-100 dark:border-red-500/15 flex-1">
                  <label className="text-[9px] uppercase font-bold text-red-500 dark:text-red-400/80 tracking-wider block mb-1">
                    Community Notes & Feedback
                  </label>
                  <p className="text-xs text-slate-700 dark:text-red-200/90 italic font-medium leading-relaxed">
                    "{selectedDisputedIssue.description || 'Bulk construction debris and broken furniture dumped behind shoplots.'}"
                  </p>
                </div>
              </div>
            </div>

            {/* Single-Row Ergonomic Action Footer */}
            <div className="px-6 py-3.5 border-t border-slate-100 dark:border-white/10 bg-slate-50/90 dark:bg-[#141622] flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
              {/* Override input on the left */}
              <div className="flex items-center gap-2 w-full sm:w-auto flex-1 max-w-md">
                <input
                  type="text"
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  placeholder="Override justification (e.g. Budgeted under Belanjawan 2027)..."
                  className="flex-1 bg-white dark:bg-[#0f111a] text-xs text-slate-800 dark:text-white placeholder:text-slate-400 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-white/10 focus:outline-none focus:border-purple-500 shadow-xs"
                />
                <button
                  disabled={!overrideReason}
                  onClick={handleForceClose}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                    overrideReason
                      ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-sm cursor-pointer active:scale-95'
                      : 'bg-slate-200/70 dark:bg-white/5 text-slate-400 dark:text-gray-500 border border-slate-200/60 dark:border-white/5 cursor-not-allowed'
                  }`}
                >
                  Force Close
                </button>
              </div>

              {/* Primary Adjudication Buttons on the right */}
              <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                <button 
                  onClick={() => handleDispatchAuditor(selectedDisputedIssue.id)} 
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold rounded-xl transition flex items-center gap-1.5 shadow-sm text-xs active:scale-95 whitespace-nowrap"
                >
                  <Check size={14} /> Dispatch Auditor
                </button>
                <button 
                  onClick={() => handleRejectResolution(selectedDisputedIssue.id)} 
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition flex items-center gap-1.5 shadow-sm text-xs active:scale-95 whitespace-nowrap"
                >
                  <X size={14} /> Withhold Sign-Off (Reject)
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ═══════════════════════════════════════════════════════ */}
      {/* Regular Issue Details Modal                            */}
      {/* ═══════════════════════════════════════════════════════ */}
      {selectedRegularIssue && createPortal(
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="fixed inset-0 bg-slate-950/45 dark:bg-black/70 backdrop-blur-sm transition-opacity" onClick={() => setSelectedRegularIssue(null)}></div>
          <div className="relative w-full max-w-4xl bg-white dark:bg-[#1d1f30] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh] text-slate-900 dark:text-white my-auto animate-in fade-in zoom-in-95 duration-200">

            {/* Modal Header */}
            <div className="flex flex-col border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#161825]">
              <div className="flex items-start justify-between p-5 pb-4">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400 border border-purple-500/20 text-2xl shrink-0">
                    {categoryEmoji[selectedRegularIssue.category] || '📋'}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-1">
                      {translateTitle(selectedRegularIssue.title, language)}
                      {/* Clickable status dropdown */}
                      <div className="relative">
                        <button
                          onClick={() => setModalStatusDropdown(!modalStatusDropdown)}
                          className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 dark:bg-[#121420] border border-slate-300 dark:border-white/10 dark:hover:border-white/20 text-slate-800 dark:text-gray-300 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider transition group/status shadow-xs"
                        >
                          {(() => {
                            const opt = STATUS_OPTIONS.find(o => o.value === selectedRegularIssue.status) || STATUS_OPTIONS.find(o => o.value === 'REPORTED');
                            return opt ? <span className={`flex items-center gap-1 ${opt.color}`}>{opt.icon} {opt.label}</span> : selectedRegularIssue.status.replace('_', ' ');
                          })()}
                          <ChevronDown size={12} className="text-slate-500 dark:text-gray-500 group-hover/status:text-slate-900 dark:group-hover/status:text-white transition" />
                        </button>
                        {modalStatusDropdown && (
                          <>
                            <div className="fixed inset-0 z-30" onClick={() => setModalStatusDropdown(false)} />
                            <div className="absolute left-0 top-full mt-2 z-40 w-56 bg-white dark:bg-[#1d1f30] border border-slate-200 dark:border-white/10 rounded-xl shadow-2xl overflow-hidden py-1 animate-fade-up text-slate-900 dark:text-white">
                              <p className="px-4 py-2 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-gray-500">Change Status</p>
                              {STATUS_OPTIONS.map(opt => (
                                <button
                                  key={opt.value}
                                  onClick={() => handleStatusChange(selectedRegularIssue.id, opt.value)}
                                  className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-bold transition hover:bg-slate-100 dark:hover:bg-white/5 ${selectedRegularIssue.status === opt.value ? `${opt.color} ${opt.bg}` : 'text-slate-700 dark:text-gray-300'}`}
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
                    <div className="flex items-center gap-3 text-xs flex-wrap">
                      <span className="text-purple-600 dark:text-purple-400 font-mono bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20 font-bold">
                        {selectedRegularIssue.id}
                      </span>
                      {selectedRegularIssue.externalRefs?.pbtCare && (
                        <span className="text-slate-500 dark:text-gray-400 font-mono border-l border-slate-300 dark:border-white/10 pl-3">
                          PBTCare: <span className="text-slate-800 dark:text-gray-300 font-semibold">{selectedRegularIssue.externalRefs.pbtCare}</span>
                        </span>
                      )}
                      {selectedRegularIssue.externalRefs?.sispaa && (
                        <span className="text-slate-500 dark:text-gray-400 font-mono border-l border-slate-300 dark:border-white/10 pl-3">
                          SISPAA: <span className="text-slate-800 dark:text-gray-300 font-semibold">{selectedRegularIssue.externalRefs.sispaa}</span>
                        </span>
                      )}
                      {selectedRegularIssue.externalRefs?.myJalan && (
                        <span className="text-slate-500 dark:text-gray-400 font-mono border-l border-slate-300 dark:border-white/10 pl-3">
                          MyJalan: <span className="text-slate-800 dark:text-gray-300 font-semibold">{selectedRegularIssue.externalRefs.myJalan}</span>
                        </span>
                      )}
                      <span className="text-[10px] text-slate-400 dark:text-gray-500 italic border-l border-slate-300 dark:border-white/10 pl-2">
                        (Simulated Mapping)
                      </span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedRegularIssue(null)} 
                  className="text-slate-400 hover:text-slate-700 dark:text-gray-400 dark:hover:text-white p-2 bg-slate-200/60 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 rounded-full transition"
                  title="Close modal"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex px-5 gap-6 border-t border-slate-200 dark:border-white/5">
                <button
                  onClick={() => setActiveModalTab('details')}
                  className={`py-3 text-sm font-bold border-b-2 transition-colors ${activeModalTab === 'details' ? 'border-purple-600 text-purple-600 dark:border-purple-500 dark:text-purple-400' : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-gray-500 dark:hover:text-gray-300'}`}
                >
                  <div className="flex items-center gap-2"><FileText size={16} /> Overview & Logistics</div>
                </button>
                <button
                  onClick={() => setActiveModalTab('comms')}
                  className={`py-3 text-sm font-bold border-b-2 transition-colors ${activeModalTab === 'comms' ? 'border-purple-600 text-purple-600 dark:border-purple-500 dark:text-purple-400' : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-gray-500 dark:hover:text-gray-300'}`}
                >
                  <div className="flex items-center gap-2"><MessageSquare size={16} /> Inter-Agency Comms</div>
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-100/70 dark:bg-[#0f111a]">
              {activeModalTab === 'details' ? (
                <div className="p-6 flex flex-col md:flex-row gap-6">
                  {/* Left Column */}
                  <div className="flex-1 space-y-6">
                    <div className="w-full h-64 bg-slate-200 dark:bg-black rounded-xl overflow-hidden border border-slate-200 dark:border-white/10 relative shadow-xs">
                      {selectedRegularIssue.images && selectedRegularIssue.images[0] ? (
                        <img src={selectedRegularIssue.images[0]} alt="Issue" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400 dark:text-gray-600">No Photo Provided</div>
                      )}
                    </div>

                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-gray-200 mb-2">Citizen Description</h4>
                      <p className="text-sm text-slate-700 dark:text-gray-300 bg-white dark:bg-[#1d1f30] p-4 rounded-xl border border-slate-200 dark:border-white/5 leading-relaxed shadow-xs">{selectedRegularIssue.description}</p>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="w-full md:w-[320px] space-y-4 shrink-0">
                    <div className="bg-white dark:bg-[#1d1f30] p-5 rounded-xl border border-slate-200 dark:border-white/5 shadow-xs">
                      <h4 className="font-bold text-xs text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <ShieldAlert size={14} className="text-purple-600 dark:text-purple-400" /> Authorities Responsible
                      </h4>
                      <div className="space-y-4">
                        <div className="bg-slate-50 dark:bg-[#161825] p-3 rounded-lg border border-slate-200 dark:border-white/5">
                          <p className="text-[10px] text-slate-500 dark:text-gray-500 uppercase font-bold mb-1">Lead Agency</p>
                          <p className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            {selectedRegularIssue.leadAgency || 'Pending Assignment'}
                            <span className="bg-emerald-500/10 text-emerald-600 dark:text-green-400 text-[10px] px-2 py-0.5 rounded border border-emerald-500/20 font-bold">Primary</span>
                          </p>
                        </div>
                        {selectedRegularIssue.supportingAgency && (
                          <div className="bg-slate-50 dark:bg-[#161825] p-3 rounded-lg border border-slate-200 dark:border-white/5">
                            <p className="text-[10px] text-slate-500 dark:text-gray-500 uppercase font-bold mb-1">Supporting Agency</p>
                            <p className="text-sm font-bold text-slate-700 dark:text-gray-300">{selectedRegularIssue.supportingAgency}</p>
                          </div>
                        )}

                        <div className="pt-2 border-t border-slate-200 dark:border-white/5">
                          <button
                            onClick={() => {
                              setIsHandoverOpen(!isHandoverOpen);
                              setHandoverSuccess(false);
                            }}
                            className={`w-full py-2.5 border rounded-lg text-sm font-bold transition flex items-center justify-center gap-2 group ${
                              isHandoverOpen
                                ? 'bg-purple-600/10 text-purple-600 border-purple-500/30 dark:bg-purple-600/20 dark:text-purple-300 dark:border-purple-500/40'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300 dark:bg-[#161825] dark:hover:bg-[#23263b] dark:border-white/10 dark:text-gray-300'
                            }`}
                          >
                            <CornerUpRight size={14} className="text-slate-500 dark:text-gray-500 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition" />
                            {isHandoverOpen ? 'Cancel Handover' : 'Handover Jurisdiction'}
                          </button>

                          {/* Handover Jurisdiction Drawer */}
                          {isHandoverOpen && (
                            <div className="mt-3 p-3.5 bg-slate-50 dark:bg-[#121420] rounded-xl border border-slate-200 dark:border-white/10 text-xs space-y-3 animate-in fade-in duration-200">
                              <p className="font-bold text-slate-900 dark:text-white text-[11px] uppercase tracking-wider">Transfer Responsible Authority</p>
                              
                              <div>
                                <label className="text-[10px] text-slate-500 dark:text-gray-400 block mb-1">Target Authority / Agency</label>
                                <select
                                  value={targetAgency}
                                  onChange={e => setTargetAgency(e.target.value)}
                                  className="w-full bg-white dark:bg-[#1d1f30] border border-slate-300 dark:border-white/10 rounded-lg p-2 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-purple-500"
                                >
                                  <option value="JKR Federal Road Maintenance">JKR Federal Road Maintenance</option>
                                  <option value="Alam Flora Solid Waste Management">Alam Flora Solid Waste Management</option>
                                  <option value="Tenaga Nasional Berhad (TNB)">Tenaga Nasional Berhad (TNB)</option>
                                  <option value="Air Selangor / Syabas Water Mains">Air Selangor / Syabas Water Mains</option>
                                  <option value="MBPJ Health & Sanitation Department">MBPJ Health & Sanitation Department</option>
                                  <option value="MBPJ Engineering Department">MBPJ Engineering Department</option>
                                </select>
                              </div>

                              <div>
                                <label className="text-[10px] text-slate-500 dark:text-gray-400 block mb-1">Jurisdiction Reference / Notes</label>
                                <input
                                  type="text"
                                  value={handoverReason}
                                  onChange={e => setHandoverReason(e.target.value)}
                                  placeholder="e.g. Culvert line falls under federal trunk asset..."
                                  className="w-full bg-white dark:bg-[#1d1f30] border border-slate-300 dark:border-white/10 rounded-lg p-2 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-purple-500"
                                />
                              </div>

                              {handoverSuccess && (
                                <p className="text-emerald-600 dark:text-emerald-400 text-[11px] font-bold flex items-center gap-1">
                                  <Check size={13} /> Jurisdiction transfer confirmed!
                                </p>
                              )}

                              <button
                                onClick={async () => {
                                  if (!selectedRegularIssue) return;
                                  const issueId = selectedRegularIssue.id;
                                  const prevAgency = selectedRegularIssue.leadAgency;
                                  const note = handoverReason.trim() || 'Jurisdiction transferred by council director.';
                                  
                                  const handoverComment = {
                                    id: `C-${Date.now()}`,
                                    author: 'Datuk Amirul',
                                    agency: 'MBPJ Executive',
                                    text: `@${targetAgency}: Formal jurisdiction transfer from ${prevAgency}. Reason: ${note}`,
                                    timestamp: 'Just now'
                                  };

                                  const updated = {
                                    ...selectedRegularIssue,
                                    leadAgency: targetAgency,
                                    supportingAgency: prevAgency,
                                    internalComments: [...(selectedRegularIssue.internalComments || []), handoverComment]
                                  };

                                  setSelectedRegularIssue(updated);
                                  setIssues(prev => prev.map(i => i.id === issueId ? updated : i));
                                  setHandoverSuccess(true);
                                  setTimeout(() => {
                                    setIsHandoverOpen(false);
                                    setHandoverSuccess(false);
                                    setHandoverReason('');
                                  }, 1200);

                                  try {
                                    await fetch(`${API_BASE}/issues/${issueId}/comments`, {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({
                                        author: 'Datuk Amirul',
                                        agency: 'MBPJ Executive',
                                        text: `@${targetAgency}: Formal jurisdiction transfer. Note: ${note}`
                                      })
                                    });
                                  } catch {}
                                }}
                                className="w-full py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-lg font-bold text-xs transition shadow-sm active:scale-95"
                              >
                                Confirm Transfer
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-[#1d1f30] p-5 rounded-xl border border-slate-200 dark:border-white/5 shadow-xs">
                      <h4 className="font-bold text-xs text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-4">Case Metrics</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-50 dark:bg-[#161825] p-3 rounded-lg border border-slate-200 dark:border-white/5">
                          <p className="text-[10px] text-slate-500 dark:text-gray-500 uppercase font-bold">Affected</p>
                          <p className="text-lg font-bold text-slate-900 dark:text-white">{selectedRegularIssue.affectedCount}</p>
                        </div>
                        <div className="bg-slate-50 dark:bg-[#161825] p-3 rounded-lg border border-slate-200 dark:border-white/5">
                          <p className="text-[10px] text-slate-500 dark:text-gray-500 uppercase font-bold">Severity</p>
                          <div className="mt-1">
                            {(() => {
                              const sev = (selectedRegularIssue.severity || 'NORMAL').toUpperCase();
                              if (sev === 'CRITICAL') return <span className="text-sm font-extrabold text-red-600 dark:text-red-400">CRITICAL</span>;
                              if (sev === 'HIGH') return <span className="text-sm font-extrabold text-orange-600 dark:text-orange-400">HIGH</span>;
                              if (sev === 'MEDIUM') return <span className="text-sm font-extrabold text-purple-600 dark:text-purple-400">MEDIUM</span>;
                              return <span className="text-sm font-extrabold text-blue-600 dark:text-blue-400">{sev}</span>;
                            })()}
                          </div>
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
                            <div className="bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 text-xs px-4 py-2 rounded-full font-mono flex items-center gap-2">
                              <CheckCircle2 size={12} /> {comment.text}
                            </div>
                          ) : (
                            <>
                              <div className="flex items-center gap-2 px-2">
                                <span className="font-bold text-sm text-slate-900 dark:text-gray-200">{comment.author}</span>
                                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-gray-400 bg-slate-200/60 dark:bg-white/5 px-2 py-0.5 rounded">{comment.agency}</span>
                                <span className="text-xs text-slate-400 dark:text-gray-600 font-mono">{comment.timestamp}</span>
                              </div>
                              <div className="bg-white dark:bg-[#1d1f30] p-4 rounded-xl rounded-tl-sm border border-slate-200 dark:border-white/5 text-sm text-slate-700 dark:text-gray-300 leading-relaxed shadow-xs">
                                {comment.text.includes('@') ? (
                                  <>
                                    <span className="text-blue-600 dark:text-blue-400 font-bold bg-blue-500/10 px-1.5 py-0.5 rounded mr-1">
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
                      <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-gray-500">
                        <MessageSquare size={32} className="mb-3 opacity-20" />
                        <p>No internal discussion yet.</p>
                      </div>
                    )}
                  </div>

                  <div className="p-4 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#161825] space-y-2">
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
                      <span className="text-[10px] text-slate-400 dark:text-gray-500 font-bold uppercase tracking-wider shrink-0 mr-1">Quick Tag:</span>
                      {['@JKR', '@AlamFlora', '@TNB', '@AirSelangor', '@MBPJ'].map(agency => (
                        <button
                          key={agency}
                          type="button"
                          onClick={() => {
                            setChatInput(prev => prev.includes(agency) ? prev : `${agency}: ${prev}`.trim());
                          }}
                          className="px-2 py-0.5 rounded-md bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-300 border border-purple-500/30 text-[10px] font-bold transition shrink-0 active:scale-95"
                        >
                          {agency}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-end gap-3 bg-white dark:bg-[#0f111a] p-2 rounded-xl border border-slate-300 dark:border-white/10 focus-within:border-purple-500/50 transition">
                      <textarea
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendComment();
                          }
                        }}
                        placeholder="Tag an agency (@JKR) or write a note..."
                        className="w-full bg-transparent border-none focus:outline-none text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-gray-500 resize-none max-h-32 min-h-[44px] p-3 custom-scrollbar"
                        rows={1}
                      />
                      <button
                        onClick={handleSendComment}
                        className={`p-3 rounded-lg flex items-center justify-center transition shrink-0 ${chatInput.trim() ? 'bg-purple-600 text-white hover:bg-purple-500 shadow-sm' : 'bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-gray-600'}`}
                      >
                        <Send size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

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
