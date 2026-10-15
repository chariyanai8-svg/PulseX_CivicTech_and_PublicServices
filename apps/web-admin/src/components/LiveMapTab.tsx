import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Tooltip as LeafletTooltip } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ADMIN_ISSUES, AdminIssue } from '../mockData';
import { X, Truck, MessageSquare, Paperclip, Send } from 'lucide-react';

const categoryEmoji: Record<string, string> = {
  ROADS: '🛣️', DRAINAGE: '🌊', WASTE: '🗑️', LIGHTING: '💡', FALLEN_TREES: '🌳',
  OBSTRUCTION: '🚧', FACILITIES: '🏞️', PEDESTRIAN: '🚶', HAZARD: '⚠️', ENVIRONMENT: '🌱', OTHER: '📋',
};

// Custom icons based on severity
const createCustomIcon = (issue: AdminIssue) => {
  const isCritical = issue.severity === 'CRITICAL';
  const color = isCritical ? '#ef4444' : (issue.severity === 'HIGH' ? '#f97316' : '#8b5cf6');
  
  return L.divIcon({
    className: 'custom-leaflet-icon',
    html: `
      <div style="
        background: ${color}; 
        width: 32px; 
        height: 32px; 
        border-radius: 50%; 
        border: 2px solid white;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 12px rgba(0,0,0,0.5);
        font-size: 16px;
      ">
        ${categoryEmoji[issue.category] || '📋'}
      </div>
      ${isCritical ? `<div style="position: absolute; top: -4px; right: -4px; width: 12px; height: 12px; background: white; border-radius: 50%; display: flex; align-items: center; justify-content: center;"><div style="width: 8px; height: 8px; background: red; border-radius: 50%; animation: pulse 1s infinite;"></div></div>` : ''}
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

const createTruckIcon = () => {
  return L.divIcon({
    className: 'custom-leaflet-icon',
    html: `
      <div style="
        background: #eab308; 
        width: 28px; 
        height: 28px; 
        border-radius: 8px; 
        border: 2px solid white;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 12px rgba(0,0,0,0.5);
        font-size: 14px;
      ">
        🚚
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
};

// Mock fleet locations
const FLEET_DATA = [
  { id: 'T1', lat: 3.12, lng: 101.62, type: 'Drainage Crew' },
  { id: 'T2', lat: 3.13, lng: 101.64, type: 'Road Maintenance' },
];

export default function LiveMapTab() {
  const [selectedIssue, setSelectedIssue] = useState<AdminIssue | null>(null);
  const [showFleet, setShowFleet] = useState(false);
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState('Details');
  const [dispatchedIssues, setDispatchedIssues] = useState<Set<string>>(new Set());
  
  const [chatMessage, setChatMessage] = useState('');
  const [chatMessages, setChatMessages] = useState([
    { sender: 'PBT Dispatcher', color: 'purple-400', align: 'left', text: 'We cleared the surface blockage, but it looks like the main underground culvert collapsed. Looping in JKR.', time: '09:41 AM' },
    { sender: 'JKR Engineer', color: 'blue-400', align: 'right', text: 'Received. We have a crew in Section 17, redirecting them to assess the culvert now.', time: '10:05 AM' }
  ]);

  const handleDispatch = () => {
    if (selectedIssue) {
      setDispatchedIssues(prev => {
        const newSet = new Set(prev);
        newSet.add(selectedIssue.id);
        return newSet;
      });
    }
  };

  const handleSendMessage = () => {
    if (!chatMessage.trim()) return;
    setChatMessages(prev => [...prev, {
      sender: 'You',
      color: 'emerald-400',
      align: 'right',
      text: chatMessage,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]);
    setChatMessage('');
  };

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Live Operations Map</h2>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowFleet(!showFleet)}
            className={`px-4 py-2 rounded-full text-xs font-bold border flex items-center gap-2 transition ${showFleet ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50' : 'bg-[#1d1f30] text-gray-400 border-white/5 hover:text-white'}`}
          >
            <Truck size={14} /> Toggle Contractor Fleet
          </button>
          <span className="bg-[#1d1f30] px-4 py-2 rounded-full text-xs text-gray-300 border border-white/5 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span> Critical
          </span>
          <span className="bg-[#1d1f30] px-4 py-2 rounded-full text-xs text-gray-300 border border-white/5 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-orange-500"></span> High
          </span>
          <span className="bg-[#1d1f30] px-4 py-2 rounded-full text-xs text-gray-300 border border-white/5 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-purple-500"></span> Normal
          </span>
        </div>
      </div>

      <div className="relative h-[650px] w-full rounded-[2rem] overflow-hidden shadow-2xl border border-white/10 glass-card-light z-0">
        <MapContainer center={[3.125, 101.63]} zoom={13} scrollWheelZoom={true} className="h-full w-full z-0">
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          
          {ADMIN_ISSUES.map(issue => (
            <Marker 
              key={issue.id} 
              position={[issue.location.lat, issue.location.lng]}
              icon={createCustomIcon(issue)}
              eventHandlers={{
                click: () => {
                  setSelectedIssue(issue);
                  setActiveWorkspaceTab('Details');
                }
              }}
            >
              <LeafletTooltip direction="top" offset={[0, -20]} opacity={1} className="custom-tooltip">
                <div className="text-xs font-bold">{issue.title}</div>
                <div className="text-[10px] opacity-80">{issue.location.neighborhood}</div>
              </LeafletTooltip>
            </Marker>
          ))}

          {showFleet && FLEET_DATA.map(fleet => (
            <Marker key={fleet.id} position={[fleet.lat, fleet.lng]} icon={createTruckIcon()}>
              <LeafletTooltip direction="top" offset={[0, -15]} opacity={1} className="custom-tooltip">
                <div className="text-xs font-bold text-yellow-400">{fleet.id}</div>
                <div className="text-[10px]">{fleet.type}</div>
              </LeafletTooltip>
            </Marker>
          ))}
        </MapContainer>

        {/* Floating Detail Card Modal (Inside the map area) */}
        {selectedIssue && (
          <div className="absolute top-6 left-6 w-[400px] bg-[#121420]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl z-[1000] overflow-hidden animate-in fade-in slide-in-from-left-4 flex flex-col max-h-[600px]">
            <div className="relative h-32 shrink-0">
              {selectedIssue.images && selectedIssue.images.length > 0 ? (
                <img src={selectedIssue.images[0]} alt="Issue" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#a855f7] to-[#8b5cf6] flex items-center justify-center">
                  <span className="text-5xl">{categoryEmoji[selectedIssue.category]}</span>
                </div>
              )}
              <button 
                onClick={() => setSelectedIssue(null)}
                className="absolute top-3 right-3 bg-black/50 hover:bg-black p-1.5 rounded-full text-white backdrop-blur-md transition"
              >
                <X size={16} />
              </button>
              <div className="absolute bottom-3 left-3 flex gap-2">
                <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full backdrop-blur-md text-white border border-white/20 ${selectedIssue.severity === 'CRITICAL' ? 'bg-red-500/80' : 'bg-orange-500/80'}`}>
                  {selectedIssue.severity}
                </span>
                <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-black/60 backdrop-blur-md text-white border border-white/20">
                  {selectedIssue.category}
                </span>
              </div>
            </div>
            
            <div className="flex border-b border-white/5 shrink-0">
              <button onClick={() => setActiveWorkspaceTab('Details')} className={`flex-1 py-3 text-xs font-bold ${activeWorkspaceTab === 'Details' ? 'text-white border-b-2 border-purple-500' : 'text-gray-500 hover:text-gray-300'}`}>Details</button>
              <button onClick={() => setActiveWorkspaceTab('Workspace')} className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-1.5 ${activeWorkspaceTab === 'Workspace' ? 'text-white border-b-2 border-purple-500' : 'text-gray-500 hover:text-gray-300'}`}>
                <MessageSquare size={14}/> Agency Workspace
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex-1 custom-scrollbar">
              {activeWorkspaceTab === 'Details' ? (
                <>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-bold text-white leading-tight">{selectedIssue.title}</h3>
                  </div>
                  <p className="text-xs text-gray-400 mb-4">{selectedIssue.description}</p>
                  
                  <div className="space-y-3 mb-5">
                    <div className="flex items-center justify-between text-xs pb-2 border-b border-white/5">
                      <span className="text-gray-500">Location</span>
                      <span className="text-gray-200 font-medium truncate max-w-[200px] text-right" title={selectedIssue.location.address}>{selectedIssue.location.address}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs pb-2 border-b border-white/5">
                      <span className="text-gray-500">Affected Citizens</span>
                      <span className="text-gray-200 font-medium">{selectedIssue.affectedCount}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs pb-2 border-b border-white/5">
                      <span className="text-gray-500">Status</span>
                      <span className={`font-medium ${selectedIssue.status === 'REPORTED' ? 'text-blue-400' : 'text-emerald-400'}`}>
                        {selectedIssue.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  <button 
                    onClick={handleDispatch}
                    disabled={dispatchedIssues.has(selectedIssue.id)}
                    className={`w-full py-3 text-sm font-bold rounded-xl transition shadow-lg flex items-center justify-center gap-2 ${dispatchedIssues.has(selectedIssue.id) ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 cursor-not-allowed' : 'bg-white text-black hover:bg-gray-200'}`}
                  >
                    {dispatchedIssues.has(selectedIssue.id) ? <><Check size={16}/> Crew Dispatched</> : <><Truck size={16}/> Dispatch Crew Now</>}
                  </button>
                </>
              ) : (
                <div className="flex flex-col h-full min-h-[200px]">
                  <div className="flex-1 space-y-4 mb-4">
                    {chatMessages.map((msg, idx) => (
                      <div key={idx} className={`flex flex-col gap-1 ${msg.align === 'right' ? 'items-end' : ''}`}>
                        <span className={`text-[10px] font-bold text-${msg.color}`}>{msg.sender}</span>
                        <div className={`p-3 rounded-xl border text-xs text-white ${msg.align === 'right' ? 'bg-blue-500/20 border-blue-500/30 rounded-tr-none' : 'bg-[#1d1f30] border-white/5 rounded-tl-none'}`}>
                          {msg.text}
                        </div>
                        <span className="text-[9px] text-gray-600">Today, {msg.time}</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-auto relative shrink-0">
                    <input 
                      type="text" 
                      value={chatMessage}
                      onChange={e => setChatMessage(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                      placeholder="Type message to internal agencies..." 
                      className="w-full bg-[#1d1f30] border border-white/10 rounded-xl py-3 pl-10 pr-10 text-xs text-white focus:outline-none focus:border-purple-500" 
                    />
                    <Paperclip size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <button onClick={handleSendMessage} className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-500 hover:text-purple-400 transition">
                      <Send size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
