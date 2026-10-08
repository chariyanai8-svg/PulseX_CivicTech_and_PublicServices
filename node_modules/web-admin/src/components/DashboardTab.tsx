import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { ChevronRight, TrendingUp, Activity, CheckCircle2, RefreshCw, ArrowUpRight } from 'lucide-react';
import { ADMIN_ISSUES, WEEKLY_TRENDS, CATEGORY_BREAKDOWN, HOTSPOTS } from '../mockData';

const categoryEmoji: Record<string, string> = {
  ROADS: '🛣️', DRAINAGE: '🌊', WASTE: '🗑️', LIGHTING: '💡', FALLEN_TREES: '🌳',
  OBSTRUCTION: '🚧', FACILITIES: '🏞️', PEDESTRIAN: '🚶', HAZARD: '⚠️', ENVIRONMENT: '🌱', OTHER: '📋',
};

export default function DashboardTab({ setActiveTab }: { setActiveTab: (tab: string) => void }) {
  const stats = useMemo(() => {
    const active = ADMIN_ISSUES.filter(i => !['MARKED_RESOLVED', 'COMMUNITY_VERIFIED'].includes(i.status));
    const critical = active.filter(i => i.severity === 'CRITICAL' || i.severity === 'HIGH');
    const recurring = ADMIN_ISSUES.filter(i => i.isRecurring);
    return { active: active.length, critical: critical.length, recurring: recurring.length };
  }, []);

  const topCases = ADMIN_ISSUES.filter(i => i.images && i.images.length > 0);
  const recentReports = [...ADMIN_ISSUES].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 4);

  // Flip book state
  const [topCardIndex, setTopCardIndex] = useState(0);

  const handleFlipCard = () => {
    setTopCardIndex((prev) => (prev + 1) % Math.max(1, topCases.length));
  };

  const rotatedCases = [
    ...topCases.slice(topCardIndex),
    ...topCases.slice(0, topCardIndex)
  ];

  // Map modal and Report state
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateReport = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      window.print();
    }, 1500);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-up">
      {/* Generating Overlay */}
      {isGenerating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f111a]/90 backdrop-blur-md">
          <div className="text-center">
            <RefreshCw size={48} className="animate-spin text-purple-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white">Generating Executive Report...</h2>
            <p className="text-gray-400 mt-2">Compiling SLAs, hotspots, and resolution metrics.</p>
          </div>
        </div>
      )}

      {/* LEFT CONTENT (2/3) */}
      <div className="lg:col-span-2 space-y-6">
        
        {/* TOP CARDS ROW */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* VIBRANT HERO CARD */}
          <div className="hero-gradient p-8 flex flex-col justify-between h-[310px] !rounded-[28px]">
            <div>
              <p className="text-[#064e3b]/70 font-medium mb-1 text-[17px] tracking-tight">Total active issues</p>
              <div className="flex items-baseline mt-2">
                <h2 className="text-[56px] leading-none font-extrabold text-[#064e3b] tracking-tight">{stats.active},450</h2>
                <span className="text-[22px] text-[#064e3b] font-extrabold ml-2">cases</span>
              </div>
              <p className="text-[15px] text-[#064e3b]/80 mt-3 font-medium">+{stats.critical} critical cases from last month</p>
            </div>
            <div className="flex items-center gap-2 mt-4 bg-white/20 backdrop-blur-md w-fit p-1.5 rounded-full shadow-sm">
              <button onClick={() => setActiveTab('Live Map')} className="px-6 py-2.5 bg-[#0f111a] text-white rounded-full text-sm font-medium hover:bg-black transition">
                Map View
              </button>
              <button onClick={handleGenerateReport} className="px-6 py-2.5 bg-white text-gray-900 rounded-full text-sm font-medium hover:bg-gray-100 transition shadow-sm">
                Generate
              </button>
              <button onClick={handleGenerateReport} className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-gray-900 hover:bg-gray-100 transition shadow-sm">
                 <RefreshCw size={16} strokeWidth={2.5} />
              </button>
            </div>
          </div>

          {/* TWO SMALLER CARDS */}
          <div className="flex flex-col gap-4 h-[310px]">
            <div className="bg-[#171822] border border-white/5 rounded-[28px] p-7 flex-1 flex flex-col shadow-lg relative overflow-hidden">
              <p className="text-[#a1a1aa] text-[15px] font-medium">Resolved</p>
              <div className="flex items-baseline mt-2 mb-1">
                <h3 className="text-[42px] leading-none font-extrabold tracking-tight text-white">+2,456</h3>
                <span className="text-[16px] ml-2 text-[#71717a] font-medium">cases</span>
              </div>
              <div className="flex items-center justify-between mt-auto">
                <p className="text-[13px] text-[#71717a] font-medium">This week's resolved</p>
                <span className="bg-[#1b3824] text-[#4ade80] text-[12px] font-bold px-3 py-1 rounded-full tracking-wide">+15.7%</span>
              </div>
            </div>

            <div className="bg-[#171822] border border-white/5 rounded-[28px] p-7 flex-1 flex flex-col shadow-lg relative overflow-hidden">
              <p className="text-[#a1a1aa] text-[15px] font-medium">Escalated</p>
              <div className="flex items-baseline mt-2 mb-1">
                <h3 className="text-[42px] leading-none font-extrabold tracking-tight text-white">-1,124</h3>
                <span className="text-[16px] ml-2 text-[#71717a] font-medium">cases</span>
              </div>
              <div className="flex items-center justify-between mt-auto">
                <p className="text-[13px] text-[#71717a] font-medium">This week's escalated</p>
                <span className="bg-[#381b1b] text-[#f87171] text-[12px] font-bold px-3 py-1 rounded-full tracking-wide">-10.7%</span>
              </div>
            </div>
          </div>
        </div>

        {/* CHARTS ROW */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass-card-light p-6 flex flex-col h-[280px]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-200 text-lg font-medium">Report flow</h3>
              <div className="flex items-center gap-3">
                <span className="text-[11px] bg-[#1d1f30] px-4 py-1.5 rounded-full text-gray-300 border border-white/5 font-medium">Monthly</span>
                <button className="w-8 h-8 bg-white text-black rounded-full flex items-center justify-center hover:bg-gray-200 transition shadow-lg">
                  <ArrowUpRight size={18} strokeWidth={2.5} />
                </button>
              </div>
            </div>
            <div className="flex-1 w-full relative mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={WEEKLY_TRENDS} margin={{ top: 20, right: 0, left: 0, bottom: 0 }} barSize={42}>
                  <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{ background: '#1d1f30', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff', fontSize: '12px' }} />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 500}} dy={10} />
                  <Bar dataKey="reports" radius={[8, 8, 8, 8]}>
                    {WEEKLY_TRENDS.map((entry, index) => {
                      const isLast = index === WEEKLY_TRENDS.length - 1;
                      return <Cell key={`cell-${index}`} fill={isLast ? '#d946ef' : '#7c3aed'} fillOpacity={isLast ? 1 : 0.8} />
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              {/* Custom Labels on top of bars */}
              <div className="absolute bottom-9 left-0 right-0 flex justify-around px-1 pointer-events-none">
                {WEEKLY_TRENDS.map((entry, i) => (
                  <span key={i} className="text-white text-[11px] font-bold z-10 w-[42px] text-center tracking-tight">+{entry.reports}</span>
                ))}
              </div>
              {/* Fake circle indicator on last bar */}
              <div className="absolute top-[35%] right-[7%] w-[18px] h-[18px] rounded-full border-[3px] border-white pointer-events-none opacity-90 shadow-md"></div>
            </div>
          </div>

          <div className="glass-card-light p-6 flex flex-col h-[280px]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-200 text-lg font-medium">Category split</h3>
              <span className="text-[11px] bg-[#1d1f30] px-4 py-1.5 rounded-full text-gray-300 border border-white/5 font-medium">Aug</span>
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
                  <span className="text-gray-400 text-xs mb-0.5">Total</span>
                  <span className="text-[26px] font-bold text-white leading-none">{stats.active}</span>
                </div>
              </div>
              
              <div className="flex-1 grid grid-cols-2 gap-y-7 gap-x-2 pl-8">
                {CATEGORY_BREAKDOWN.slice(0, 4).map(cat => (
                  <div key={cat.category} className="flex flex-col">
                    <span className="text-[11px] text-gray-400 mb-1.5 truncate pr-2 font-medium">{cat.category}</span>
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
            <h3 className="text-gray-200 font-medium">Recent Reports <span className="text-gray-500 text-sm ml-1">234</span></h3>
            <button className="text-[11px] text-gray-400 hover:text-white flex items-center gap-1 transition">
              See All <ChevronRight size={12} />
            </button>
          </div>
          <div className="space-y-2">
            {recentReports.map(report => (
              <div key={report.id} className="flex items-center justify-between p-2 hover:bg-white/5 rounded-xl transition cursor-pointer group">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#1d1f30] flex items-center justify-center text-sm shadow-inner">
                    {categoryEmoji[report.category] || '📋'}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-200 group-hover:text-white transition line-clamp-1">{report.title}</p>
                    <p className="text-[10px] text-gray-500 line-clamp-1">{report.location.address}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-medium ${
                    report.status === 'REPORTED' ? 'bg-[#3b82f6]/10 text-[#3b82f6]' :
                    report.status === 'IN_PROGRESS' ? 'bg-[#f59e0b]/10 text-[#f59e0b]' :
                    'bg-[#10b981]/10 text-[#10b981]'
                  }`}>
                    {report.status.replace('_', ' ')}
                  </span>
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
            <h3 className="text-gray-200 font-medium">Critical Cases <span className="text-gray-500 text-sm ml-1">{topCases.length}</span></h3>
            <button className="bg-white text-black text-[10px] font-semibold px-3 py-1.5 rounded-full flex items-center gap-1 hover:bg-gray-200 transition">
              Click to Flip <span className="text-sm leading-none">↺</span>
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
                      <span className={`text-xs font-bold ${textColor}`}>{caseItem.category}</span>
                      <span className={`text-[10px] font-mono ${subTextColor}`}>ID: {caseItem.id.slice(-4)}</span>
                    </div>
                    <div>
                      <p className={`text-[15px] font-bold leading-tight mb-1 line-clamp-2 ${textColor}`}>{caseItem.title}</p>
                      <div className={`flex justify-between items-end text-[10px] ${subTextColor} mt-2`}>
                        <span className="truncate pr-2">{caseItem.location.neighborhood}</span>
                        <span className="shrink-0 font-medium">{caseItem.affectedCount} Affected</span>
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
            <h3 className="text-gray-200 font-medium">Emerging Hotspots <span className="text-gray-500 text-sm ml-1">{HOTSPOTS.length}</span></h3>
            <button className="text-[11px] text-gray-400 hover:text-white flex items-center gap-1 transition">
              Manage <ChevronRight size={12} />
            </button>
          </div>
          <div className="flex gap-2 mb-6">
             {HOTSPOTS.map((hs, i) => (
               <div key={i} title={hs.name} className="w-10 h-10 rounded-full bg-[#1d1f30] border border-white/10 flex items-center justify-center text-lg shadow-lg relative group cursor-pointer hover:border-white/30 transition">
                 {categoryEmoji[hs.topCategory]}
                 <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-[#1a1c29]"></div>
               </div>
             ))}
          </div>
          <div className="space-y-2">
            {HOTSPOTS.slice(0, 4).map((hs) => (
              <div key={hs.id} className="bg-[#1d1f30]/60 rounded-xl p-3 flex items-center justify-between border border-white/5 hover:border-white/10 transition cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="text-lg w-6 text-center">{categoryEmoji[hs.topCategory]}</div>
                  <div>
                    <p className="text-xs text-gray-200 font-medium line-clamp-1">{hs.name}</p>
                    <p className="text-[10px] text-gray-500">Intensity {hs.intensity}%</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <p className="text-sm font-medium text-white">{hs.issueCount}</p>
                    <p className="text-[9px] text-gray-500">cases</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
