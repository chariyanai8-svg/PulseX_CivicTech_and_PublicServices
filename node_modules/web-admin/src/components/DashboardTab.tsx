import React, { useState, useMemo, useEffect } from 'react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { ChevronRight, CheckCircle2, RefreshCw, ArrowUpRight } from 'lucide-react';
import { ADMIN_ISSUES, WEEKLY_TRENDS, CATEGORY_BREAKDOWN, HOTSPOTS } from '../mockData';
import { API_BASE } from '../apiConfig';
import { SupportedLanguage, translateTitle, translateHotspot } from '../../../../packages/shared-types';

const categoryEmoji: Record<string, string> = {
  ROADS: '🛣️', DRAINAGE: '🌊', WASTE: '🗑️', LIGHTING: '💡', FALLEN_TREES: '🌳',
  OBSTRUCTION: '🚧', FACILITIES: '🏞️', PEDESTRIAN: '🚶', HAZARD: '⚠️', ENVIRONMENT: '🌱', OTHER: '📋',
};

const MONTHLY_FLOW = [
  { day: 'Week 1', reports: 312 },
  { day: 'Week 2', reports: 420 },
  { day: 'Week 3', reports: 560 },
  { day: 'Week 4', reports: 480 },
];

function useCountUp(end: number, duration: number = 1000) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let startTime: number | null = null;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(ease * end));
      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        setCount(end);
      }
    };
    window.requestAnimationFrame(step);
  }, [end, duration]);
  return count;
}

interface DashboardTabProps {
  setActiveTab: (tab: string) => void;
  language?: SupportedLanguage;
  onSelectIssue?: (issueId: string) => void;
  onSelectCategory?: (category: string) => void;
}

export default function DashboardTab({ setActiveTab, language = 'EN', onSelectIssue, onSelectCategory }: DashboardTabProps) {
  const [liveIssues, setLiveIssues] = useState(ADMIN_ISSUES);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshToast, setRefreshToast] = useState<string | null>(null);

  const fetchLiveIssues = async () => {
    try {
      const res = await fetch(`${API_BASE}/issues`);
      if (res.ok) {
        const json = await res.json();
        if (json.data && Array.isArray(json.data) && json.data.length > 0) {
          setLiveIssues(prev => {
            return json.data.map((srv: any) => {
              const existing = prev.find(p => p.id === srv.id);
              return {
                ...srv,
                severity: existing?.severity || (srv.isRecurring ? 'HIGH' : 'MEDIUM'),
                leadAgency: existing?.leadAgency || 'MBPJ Engineering',
                relatedReports: srv.reportCount || existing?.relatedReports || 1,
                socialSignals: existing?.socialSignals || 12,
              };
            });
          });
        }
      }
    } catch {
      // offline / mock fallback
    }
  };

  useEffect(() => {
    fetchLiveIssues();
  }, []);

const getCategoryLabel = (category: string, lang: SupportedLanguage = 'EN') => {
  if (lang !== 'BM') return category;
  const map: Record<string, string> = {
    'Drainage': 'Saliran',
    'Roads': 'Jalan Raya',
    'Waste': 'Sisa & Sampah',
    'Lighting': 'Lampu Jalan',
    'DRAINAGE': 'Saliran',
    'ROADS': 'Jalan Raya',
    'WASTE': 'Sisa & Sampah',
    'LIGHTING': 'Lampu Jalan',
    'FALLEN_TREES': 'Pokok Tumbang',
    'OBSTRUCTION': 'Halangan',
    'FACILITIES': 'Kemudahan',
    'OTHER': 'Lain-lain'
  };
  return map[category] || category;
};

  const handleRefreshMetrics = async () => {
    setIsRefreshing(true);
    await fetchLiveIssues();
    setTimeout(() => {
      setIsRefreshing(false);
      setRefreshToast(language === 'BM' ? 'Metrik majlis berjaya dikemas kini dengan pangkalan data langsung.' : 'Council metrics successfully updated with live database.');
      setTimeout(() => setRefreshToast(null), 3000);
    }, 600);
  };

  const stats = useMemo(() => {
    const active = liveIssues.filter(i => !['MARKED_RESOLVED', 'COMMUNITY_VERIFIED'].includes(i.status));
    const critical = active.filter(i => i.severity === 'CRITICAL' || i.severity === 'HIGH');
    const recurring = liveIssues.filter(i => i.isRecurring);
    return { active: active.length, critical: critical.length, recurring: recurring.length };
  }, [liveIssues]);

  const topCases = useMemo(() => liveIssues.filter(i => i.images && i.images.length > 0), [liveIssues]);
  const recentReports = useMemo(() => [...liveIssues].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 4), [liveIssues]);

  // Flip book state
  const [topCardIndex, setTopCardIndex] = useState(0);

  const handleFlipCard = () => {
    setTopCardIndex((prev) => (prev + 1) % Math.max(1, topCases.length));
  };

  const rotatedCases = [
    ...topCases.slice(topCardIndex),
    ...topCases.slice(0, topCardIndex)
  ];

  // Report Flow & Category Split state
  const [flowTimeframe, setFlowTimeframe] = useState<'Weekly' | 'Monthly'>('Monthly');
  const [categoryPeriod, setCategoryPeriod] = useState<'Aug' | 'Q3' | 'All'>('Aug');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateReport = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      window.print();
    }, 1500);
  };

  const animatedActive = useCountUp(stats.active, 1500);
  const animatedCritical = useCountUp(stats.critical, 1500);
  const animatedResolved = useCountUp(2456, 1500);
  const animatedEscalated = useCountUp(1124, 1500);

  const flowData = flowTimeframe === 'Weekly' ? WEEKLY_TRENDS : MONTHLY_FLOW;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-up">
      {/* Toast Feedback */}
      {refreshToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#161825] text-white px-4 py-3 rounded-2xl border border-purple-500/40 shadow-2xl flex items-center gap-2.5 text-xs animate-in fade-in slide-in-from-bottom-2 duration-300">
          <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          <span className="font-medium">{refreshToast}</span>
        </div>
      )}

      {/* Generating Overlay */}
      {isGenerating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f111a]/90 backdrop-blur-md">
          <div className="text-center">
            <RefreshCw size={48} className="animate-spin text-purple-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white">{language === 'BM' ? 'Menjana Laporan Eksekutif...' : 'Generating Executive Report...'}</h2>
            <p className="text-gray-400 mt-2">{language === 'BM' ? 'Menyusun SLA, kawasan panas, dan metrik penyelesaian.' : 'Compiling SLAs, hotspots, and resolution metrics.'}</p>
          </div>
        </div>
      )}

      {/* LEFT CONTENT (2/3) */}
      <div className="lg:col-span-2 space-y-6">

        {/* TOP CARDS ROW */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* VIBRANT HERO CARD */}
          <div className="hero-gradient p-8 flex flex-col justify-between h-[310px] !rounded-[28px] shadow-lg">
            <div>
              <p className="text-[#064e3b]/70 font-medium mb-1 text-[17px] tracking-tight">
                {language === 'BM' ? 'Jumlah kes aktif semasa' : 'Total active issues'}
              </p>
              <div className="flex items-baseline mt-2">
                <h2 className="text-[56px] leading-none font-extrabold text-[#064e3b] tracking-tight">{animatedActive},450</h2>
                <span className="text-[22px] text-[#064e3b] font-extrabold ml-2">
                  {language === 'BM' ? 'kes' : 'cases'}
                </span>
              </div>
              <p className="text-[15px] text-[#064e3b]/80 mt-3 font-medium">
                +{animatedCritical} {language === 'BM' ? 'kes berisiko tinggi dari bulan lalu' : 'critical cases from last month'}
              </p>
            </div>
            <div className="flex items-center gap-2 mt-4 bg-white/20 backdrop-blur-md w-fit p-1.5 rounded-full shadow-sm">
              <button
                onClick={() => setActiveTab('Live Map')}
                className="px-6 py-2.5 bg-[#0f111a] text-white rounded-full text-sm font-medium hover:bg-black transition active:scale-95 shadow-sm"
              >
                {language === 'BM' ? 'Paparan Peta' : 'Map View'}
              </button>
              <button
                onClick={handleGenerateReport}
                className="px-6 py-2.5 bg-white text-gray-900 rounded-full text-sm font-medium hover:bg-gray-100 transition shadow-sm active:scale-95"
              >
                {language === 'BM' ? 'Jana Laporan' : 'Generate'}
              </button>
              <button
                onClick={handleRefreshMetrics}
                title="Refresh live metrics"
                className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-gray-900 hover:bg-gray-100 transition shadow-sm active:scale-90"
              >
                <RefreshCw size={16} strokeWidth={2.5} className={isRefreshing ? 'animate-spin text-purple-600' : ''} />
              </button>
            </div>
          </div>

          {/* TWO SMALLER CARDS */}
          <div className="flex flex-col gap-4 h-[310px]">
            <div className="bg-[#171822] border border-white/5 rounded-[28px] p-7 flex-1 flex flex-col shadow-lg relative overflow-hidden">
              <p className="text-[#a1a1aa] text-[15px] font-medium">{language === 'BM' ? 'Selesai' : 'Resolved'}</p>
              <div className="flex items-baseline mt-2 mb-1">
                <h3 className="text-[42px] leading-none font-extrabold tracking-tight text-white">+{animatedResolved.toLocaleString()}</h3>
                <span className="text-[16px] ml-2 text-[#71717a] font-medium">{language === 'BM' ? 'kes' : 'cases'}</span>
              </div>
              <div className="flex items-center justify-between mt-auto">
                <p className="text-[13px] text-[#71717a] font-medium">{language === 'BM' ? 'Diselesaikan minggu ini' : "This week's resolved"}</p>
                <span className="bg-[#1b3824] text-[#4ade80] text-[12px] font-bold px-3 py-1 rounded-full tracking-wide">+15.7%</span>
              </div>
            </div>

            <div className="bg-[#171822] border border-white/5 rounded-[28px] p-7 flex-1 flex flex-col shadow-lg relative overflow-hidden">
              <p className="text-[#a1a1aa] text-[15px] font-medium">{language === 'BM' ? 'Dieskalasi' : 'Escalated'}</p>
              <div className="flex items-baseline mt-2 mb-1">
                <h3 className="text-[42px] leading-none font-extrabold tracking-tight text-white">-{animatedEscalated.toLocaleString()}</h3>
                <span className="text-[16px] ml-2 text-[#71717a] font-medium">{language === 'BM' ? 'kes' : 'cases'}</span>
              </div>
              <div className="flex items-center justify-between mt-auto">
                <p className="text-[13px] text-[#71717a] font-medium">{language === 'BM' ? 'Dieskalasi minggu ini' : "This week's escalated"}</p>
                <span className="bg-[#381b1b] text-[#f87171] text-[12px] font-bold px-3 py-1 rounded-full tracking-wide">-10.7%</span>
              </div>
            </div>
          </div>
        </div>

        {/* CHARTS ROW */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass-card-light p-6 flex flex-col h-[280px]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-200 text-lg font-medium">{language === 'BM' ? 'Aliran Laporan' : 'Report flow'}</h3>
              <div className="flex items-center gap-2">
                <div className="flex bg-[#1d1f30] rounded-full p-0.5 border border-white/5 text-[11px]">
                  {(['Weekly', 'Monthly'] as const).map(tf => (
                    <button
                      key={tf}
                      onClick={() => setFlowTimeframe(tf)}
                      className={`px-3 py-1 rounded-full font-medium transition ${
                        flowTimeframe === tf ? 'bg-white text-black shadow-xs' : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      {tf === 'Weekly' ? (language === 'BM' ? 'Mingguan' : 'Weekly') : (language === 'BM' ? 'Bulanan' : 'Monthly')}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setActiveTab('Analytics')}
                  title="View full analytics"
                  className="w-8 h-8 bg-white text-black rounded-full flex items-center justify-center hover:bg-gray-200 transition shadow-lg active:scale-90"
                >
                  <ArrowUpRight size={18} strokeWidth={2.5} />
                </button>
              </div>
            </div>
            <div className="flex-1 w-full relative mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={flowData} margin={{ top: 20, right: 0, left: 0, bottom: 0 }} barSize={flowTimeframe === 'Weekly' ? 42 : 54}>
                  <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ background: '#1d1f30', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff', fontSize: '12px' }} />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 500 }} dy={10} />
                  <Bar dataKey="reports" radius={[8, 8, 8, 8]}>
                    {flowData.map((entry, index) => {
                      const isLast = index === flowData.length - 1;
                      return <Cell key={`cell-${index}`} fill={isLast ? '#d946ef' : '#7c3aed'} fillOpacity={isLast ? 1 : 0.8} />
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              {/* Custom Labels on top of bars */}
              <div className="absolute bottom-9 left-0 right-0 flex justify-around px-1 pointer-events-none">
                {flowData.map((entry, i) => (
                  <span key={i} className="text-white text-[11px] font-bold z-10 w-[42px] text-center tracking-tight">+{entry.reports}</span>
                ))}
              </div>
            </div>
          </div>

          <div className="glass-card-light p-6 flex flex-col h-[280px]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-200 text-lg font-medium">{language === 'BM' ? 'Pecahan Kategori' : 'Category split'}</h3>
              <div className="flex bg-[#1d1f30] rounded-full p-0.5 border border-white/5 text-[11px]">
                {(['Aug', 'Q3', 'All'] as const).map(p => (
                  <button
                    key={p}
                    onClick={() => setCategoryPeriod(p)}
                    className={`px-2.5 py-1 rounded-full font-medium transition ${
                      categoryPeriod === p ? 'bg-purple-600 text-white shadow-xs' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {p === 'Aug' ? (language === 'BM' ? 'Ogos' : 'Aug') : p === 'All' ? (language === 'BM' ? 'Semua' : 'All') : p}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1 flex items-center justify-between mt-2">
              <div className="w-[150px] h-[150px] relative shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={CATEGORY_BREAKDOWN.slice(0, 4)} innerRadius={58} outerRadius={75} paddingAngle={4} dataKey="count" stroke="none">
                      {CATEGORY_BREAKDOWN.slice(0, 4).map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#1d1f30', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff', fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-1">
                  <span className="text-gray-400 text-xs mb-0.5">{language === 'BM' ? 'Jumlah' : 'Total'}</span>
                  <span className="text-[26px] font-bold text-white leading-none">{stats.active}</span>
                </div>
              </div>

              <div className="flex-1 grid grid-cols-2 gap-y-7 gap-x-2 pl-8">
                {CATEGORY_BREAKDOWN.slice(0, 4).map(cat => (
                  <div
                    key={cat.category}
                    onClick={() => {
                      if (onSelectCategory) onSelectCategory(cat.category);
                      else setActiveTab('Issues');
                    }}
                    title={`Filter by ${cat.category}`}
                    className="flex flex-col cursor-pointer group/cat hover:translate-x-1 transition-transform"
                  >
                    <span className="text-[11px] text-gray-400 group-hover/cat:text-white mb-1.5 truncate pr-2 font-medium transition-colors">
                      {getCategoryLabel(cat.category, language)}
                    </span>
                    <div className="flex items-center gap-2.5">
                      <div className="w-[3px] h-4 rounded-full" style={{ background: cat.color }}></div>
                      <span className="text-[15px] font-bold text-white leading-none">{cat.percentage}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* RECENT LIST */}
        <div className="glass-card-light p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-200 font-medium">
              {language === 'BM' ? 'Aduan Terkini' : 'Recent Reports'} <span className="text-gray-500 text-sm ml-1">{liveIssues.length}</span>
            </h3>
            <button
              onClick={() => setActiveTab('Issues')}
              className="text-[11px] text-gray-400 hover:text-white flex items-center gap-1 transition group"
            >
              {language === 'BM' ? 'Lihat Semua' : 'See All'} <ChevronRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
          <div className="space-y-2">
            {recentReports.map(report => (
              <div
                key={report.id}
                onClick={() => {
                  if (onSelectIssue) onSelectIssue(report.id);
                  else setActiveTab('Issues');
                }}
                title="Click to inspect this issue"
                className="flex items-center justify-between p-2 hover:bg-white/5 rounded-xl transition cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#1d1f30] flex items-center justify-center text-sm shadow-inner group-hover:scale-105 transition-transform">
                    {categoryEmoji[report.category] || '📋'}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-200 group-hover:text-purple-300 transition line-clamp-1">{translateTitle(report.title, language)}</p>
                    <p className="text-[10px] text-gray-500 line-clamp-1">{report.location.address}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-medium ${report.status === 'REPORTED' ? 'bg-[#3b82f6]/10 text-[#3b82f6]' :
                      report.status === 'IN_PROGRESS' ? 'bg-[#f59e0b]/10 text-[#f59e0b]' :
                        'bg-[#10b981]/10 text-[#10b981]'
                    }`}>
                    {report.status === 'REPORTED' ? (language === 'BM' ? 'Dilaporkan' : 'Reported') : report.status === 'IN_PROGRESS' ? (language === 'BM' ? 'Dalam Tindakan' : 'In Progress') : (language === 'BM' ? 'Selesai' : 'Resolved')}
                  </span>
                  <ChevronRight size={14} className="text-gray-600 group-hover:text-gray-300 transition-colors" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT CONTENT (1/3) */}
      <div className="space-y-6">

        {/* FLIP BOOK STACKED CARDS */}
        <div className="glass-card-light p-5 pb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-gray-200 font-medium">
              {language === 'BM' ? 'Kes Kritikal' : 'Critical Cases'} <span className="text-gray-500 text-sm ml-1">{topCases.length}</span>
            </h3>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleFlipCard();
              }}
              className="bg-white text-black text-[10px] font-semibold px-3 py-1.5 rounded-full flex items-center gap-1 hover:bg-gray-200 transition active:scale-95 shadow-sm"
            >
              {language === 'BM' ? 'Selak Kad' : 'Click to Flip'} <span className="text-sm leading-none">↺</span>
            </button>
          </div>

          <div
            className="relative h-[220px] case-card-stack flex items-end justify-center w-full cursor-pointer group"
            onClick={handleFlipCard}
            title="Click to flip through cards"
          >
            {rotatedCases.slice(0, 3).map((caseItem, idx) => {
              const isTop = idx === 0;
              const isMiddle = idx === 1;
              const isBottom = idx === 2;

              let transform = '';
              let zIndex = 0;
              let gradient = '';
              let textColor = 'text-white';
              let subTextColor = 'text-white/70';

              if (isBottom) {
                transform = 'translateY(-60px) scale(0.85)';
                zIndex = 10;
                gradient = 'from-[#f97316] to-[#f59e0b]';
                textColor = 'text-gray-900';
                subTextColor = 'text-gray-800';
              } else if (isMiddle) {
                transform = 'translateY(-30px) scale(0.92)';
                zIndex = 20;
                gradient = 'from-[#34d399] to-[#a7f3d0]';
                textColor = 'text-gray-900';
                subTextColor = 'text-gray-800';
              } else {
                transform = 'translateY(0) scale(1)';
                zIndex = 30;
                gradient = 'from-[#a855f7] to-[#8b5cf6]';
              }

              return (
                <div
                  key={caseItem.id}
                  className={`absolute bottom-0 w-full rounded-2xl p-4 shadow-2xl case-card overflow-hidden bg-gradient-to-r ${gradient} ${isTop ? 'group-hover:translate-y-[-10px]' : ''}`}
                  style={{ transform, zIndex, transformOrigin: 'bottom center', height: '160px', transition: 'all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}
                >
                  {caseItem.images?.[0] && (
                    <>
                      <div className="absolute inset-0 z-0">
                        <img src={caseItem.images[0]} alt="Case" className="w-full h-full object-cover mix-blend-overlay opacity-30" />
                      </div>
                      {isTop && <div className="absolute inset-0 bg-gradient-to-t from-[#121420]/90 via-[#121420]/20 to-transparent z-0"></div>}
                    </>
                  )}
                  <div className="relative z-10 h-full flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                      <span className={`text-xs font-bold ${textColor}`}>{getCategoryLabel(caseItem.category, language)}</span>
                      <span className={`text-[10px] font-mono ${subTextColor}`}>ID: {caseItem.id.slice(-4)}</span>
                    </div>
                    <div>
                      <p className={`text-[15px] font-bold leading-tight mb-1 line-clamp-2 ${textColor}`}>{translateTitle(caseItem.title, language)}</p>
                      <div className={`flex justify-between items-end text-[10px] ${subTextColor} mt-2`}>
                        <span className="truncate pr-2">{caseItem.location.neighborhood}</span>
                        <div className="flex items-center gap-2">
                          <span className="shrink-0 font-medium">{caseItem.affectedCount} {language === 'BM' ? 'Terjejas' : 'Affected'}</span>
                          {isTop && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onSelectIssue) onSelectIssue(caseItem.id);
                                else setActiveTab('Issues');
                              }}
                              className="px-2 py-0.5 bg-black/40 hover:bg-black/70 text-white rounded font-bold transition flex items-center gap-0.5 text-[9px]"
                            >
                              {language === 'BM' ? 'Periksa' : 'Inspect'} <ChevronRight size={10} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* HOTSPOTS LIST */}
        <div className="glass-card-light p-5">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-gray-200 font-medium">
              {language === 'BM' ? 'Titik Panas Komuniti' : 'Emerging Hotspots'} <span className="text-gray-500 text-sm ml-1">{HOTSPOTS.length}</span>
            </h3>
            <button
              onClick={() => setActiveTab('Live Map')}
              className="text-[11px] text-gray-400 hover:text-white flex items-center gap-1 transition group"
            >
              {language === 'BM' ? 'Urus' : 'Manage'} <ChevronRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
          <div className="flex gap-2 mb-6">
            {HOTSPOTS.map((hs, i) => (
              <div
                key={i}
                title={`Open ${hs.name} in Live Map`}
                onClick={() => setActiveTab('Live Map')}
                className="w-10 h-10 rounded-full bg-[#1d1f30] border border-white/10 flex items-center justify-center text-lg shadow-lg relative group cursor-pointer hover:border-purple-400 hover:scale-110 transition"
              >
                {categoryEmoji[hs.topCategory]}
                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-[#1a1c29]"></div>
              </div>
            ))}
          </div>
          <div className="space-y-2">
            {HOTSPOTS.slice(0, 4).map((hs) => (
              <div
                key={hs.id}
                onClick={() => setActiveTab('Live Map')}
                title={`Focus ${hs.name} on Live Map`}
                className="bg-[#1d1f30]/60 rounded-xl p-3 flex items-center justify-between border border-white/5 hover:border-purple-500/30 hover:bg-[#1d1f30] transition cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="text-lg w-6 text-center group-hover:scale-110 transition-transform">{categoryEmoji[hs.topCategory]}</div>
                  <div>
                    <p className="text-xs text-gray-200 font-medium line-clamp-1 group-hover:text-purple-300 transition-colors">{translateHotspot(hs.name, language)}</p>
                    <p className="text-[10px] text-gray-500">{language === 'BM' ? 'Keamatan' : 'Intensity'} {hs.intensity}%</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <p className="text-sm font-medium text-white">{hs.issueCount}</p>
                    <p className="text-[9px] text-gray-500">{language === 'BM' ? 'kes' : 'cases'}</p>
                  </div>
                  <ChevronRight size={14} className="text-gray-600 group-hover:text-gray-300 transition-colors" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
