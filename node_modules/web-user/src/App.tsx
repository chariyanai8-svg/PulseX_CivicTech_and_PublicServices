import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { MapPin, Users, Camera, RefreshCw, PlusCircle } from 'lucide-react';
import { INITIAL_ISSUES } from './mockData';
import { CommunityIssue, IssueCategory } from '../../../packages/shared-types';

export default function App() {
  const [issues, setIssues] = useState<CommunityIssue[]>(INITIAL_ISSUES);
  const [selectedIssue, setSelectedIssue] = useState<CommunityIssue | null>(issues[0]);
  const [activeTab, setActiveTab] = useState<'feed' | 'map'>('feed');
  const [showReportModal, setShowReportModal] = useState(false);

  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<IssueCategory>('DRAINAGE');
  const [newDescription, setNewDescription] = useState('');

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

  const handleCreateReport = (e: React.FormEvent) => {
    e.preventDefault();
    const newIssue: CommunityIssue = {
      id: `CIV-2026-00${Math.floor(1000 + Math.random() * 9000)}`,
      title: newTitle,
      category: newCategory,
      description: newDescription,
      location: {
        lat: 3.1190,
        lng: 101.6240,
        address: 'Current Location (Detected)',
        neighborhood: 'Petaling Jaya'
      },
      affectedCount: 1,
      evidenceCount: 1,
      occurrenceCount: 1,
      isRecurring: false,
      status: 'REPORTED',
      timeline: [{ date: 'Today', title: 'Submitted by you' }],
      images: [],
      createdAt: new Date().toISOString().split('T')[0]
    };

    setIssues([newIssue, ...issues]);
    setSelectedIssue(newIssue);
    setShowReportModal(false);
    setNewTitle('');
    setNewDescription('');
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-slate-100 flex flex-col shadow-xl">
      <header className="bg-slate-900 text-white p-4 sticky top-0 z-30 flex justify-between items-center shadow-md">
        <div>
          <div className="flex items-center space-x-1">
            <span className="text-xl font-black tracking-tight text-blue-400">CivicPulse</span>
            <span className="bg-blue-600 text-[10px] px-1.5 py-0.5 rounded font-bold uppercase">🇲🇾 MY</span>
          </div>
          <p className="text-xs text-slate-400 flex items-center mt-0.5">
            <MapPin size={12} className="mr-1 text-red-400" /> Taman ABC, Petaling Jaya
          </p>
        </div>
        <button 
          onClick={() => setShowReportModal(true)}
          className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium flex items-center space-x-1 transition shadow"
        >
          <PlusCircle size={16} />
          <span>Report</span>
        </button>
      </header>

      <div className="flex bg-white border-b border-slate-200">
        <button 
          onClick={() => setActiveTab('feed')}
          className={`flex-1 py-2.5 text-sm font-semibold text-center ${activeTab === 'feed' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500'}`}
        >
          Community Feed
        </button>
        <button 
          onClick={() => setActiveTab('map')}
          className={`flex-1 py-2.5 text-sm font-semibold text-center ${activeTab === 'map' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500'}`}
        >
          Civic Map
        </button>
      </div>

      <main className="flex-1 p-4 overflow-y-auto space-y-4 mb-16">
        {activeTab === 'feed' ? (
          <>
            {issues.map(issue => (
              <div 
                key={issue.id} 
                onClick={() => setSelectedIssue(issue)}
                className={`bg-white rounded-xl p-4 shadow-sm border transition cursor-pointer ${selectedIssue?.id === issue.id ? 'border-blue-500 ring-2 ring-blue-100' : 'border-slate-200'}`}
              >
                <div className="flex justify-between items-start">
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 uppercase tracking-wide">
                    {issue.category}
                  </span>
                  {issue.isRecurring && (
                    <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded flex items-center">
                      <RefreshCw size={10} className="mr-1" /> Recurring ({issue.occurrenceCount}x)
                    </span>
                  )}
                </div>

                <h3 className="font-bold text-slate-800 mt-2">{issue.title}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{issue.location.address}</p>

                <div className="flex items-center space-x-4 mt-3 pt-3 border-t border-slate-100 text-xs text-slate-600">
                  <span className="flex items-center font-semibold text-slate-700">
                    <Users size={14} className="mr-1 text-blue-600" /> {issue.affectedCount} Affected
                  </span>
                  <span className="flex items-center">
                    <Camera size={14} className="mr-1 text-slate-400" /> {issue.evidenceCount} Photos
                  </span>
                  <span className="ml-auto font-medium text-blue-600">{issue.status}</span>
                </div>
              </div>
            ))}
          </>
        ) : (
          <div className="h-[400px] w-full rounded-xl overflow-hidden shadow-inner border border-slate-300">
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
        )}

        {selectedIssue && (
          <div className="bg-white rounded-xl p-5 shadow-md border border-slate-200 mt-6">
            <div className="flex justify-between items-center pb-3 border-b">
              <div>
                <span className="text-xs text-slate-400 font-mono">{selectedIssue.id}</span>
                <h2 className="text-lg font-bold text-slate-900">{selectedIssue.title}</h2>
              </div>
              <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2.5 py-1 rounded-full">
                {selectedIssue.status}
              </span>
            </div>

            <p className="text-sm text-slate-600 mt-3">{selectedIssue.description}</p>

            <div className="mt-5 p-3 bg-blue-50 rounded-xl border border-blue-100 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-blue-900">{selectedIssue.affectedCount} Residents Confirmed</p>
                <p className="text-[11px] text-blue-700">Confirming adds community priority weight</p>
              </div>
              <button 
                onClick={() => handleAffectedClick(selectedIssue.id)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-xs font-bold transition shadow"
              >
                I'm Affected Too
              </button>
            </div>

            <div className="mt-5">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Issue Lifecycle</h4>
              <div className="space-y-2 border-l-2 border-slate-200 pl-3 ml-1">
                {selectedIssue.timeline.map((event, idx) => (
                  <div key={idx} className="relative">
                    <span className="text-xs font-bold text-slate-700">{event.date}</span>
                    <p className="text-xs text-slate-500">{event.title}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {showReportModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end justify-center">
          <div className="bg-white rounded-t-2xl p-5 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-slate-900">Report Community Issue</h2>
            <p className="text-xs text-slate-500 mb-4">CivicPulse automatically aggregates nearby duplicate complaints.</p>

            <form onSubmit={handleCreateReport} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Issue Category</label>
                <select 
                  value={newCategory} 
                  onChange={(e) => setNewCategory(e.target.value as IssueCategory)}
                  className="w-full p-2.5 text-sm border border-slate-300 rounded-lg bg-slate-50"
                >
                  <option value="DRAINAGE">🌊 Drainage / Flooding</option>
                  <option value="ROADS">🛣️ Roads / Potholes</option>
                  <option value="WASTE">🗑️️ Waste / Trash</option>
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
                  className="w-full p-2.5 text-sm border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description (BM / English)</label>
                <textarea 
                  required
                  rows={3}
                  placeholder="Describe the issue... (e.g. Longkang tersumbat teruk, everytime hujan confirm banjir)" 
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full p-2.5 text-sm border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex space-x-2 pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowReportModal(false)}
                  className="flex-1 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-lg shadow"
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