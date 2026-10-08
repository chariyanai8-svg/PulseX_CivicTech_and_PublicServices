import { CommunityIssue } from '../../../packages/shared-types';

// ── Extended types for admin dashboard ──
export interface AdminIssue extends CommunityIssue {
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  leadAgency: string;
  supportingAgency?: string;
  officialCaseRef?: string;
  relatedReports: number;
  nearbyFacilities?: string[];
  socialSignals: number;
  locationConfidence: 'HIGH' | 'MEDIUM' | 'LOW';
  resolutionEvidence?: {
    afterPhoto?: string;
    actionTaken: string;
    completedAt: string;
    responsibleTeam: string;
  };
  recurrenceData?: {
    totalIncidents: number;
    previousInterventions: number;
    avgRecurrenceDays: number;
    monthlyTrend: number; // percentage
  };
}

export interface HotspotData {
  id: string;
  name: string;
  lat: number;
  lng: number;
  intensity: number;
  issueCount: number;
  topCategory: string;
  trend: 'rising' | 'stable' | 'declining';
}

export interface AgencyPerformance {
  name: string;
  resolved: number;
  pending: number;
  avgResolutionDays: number;
  communityScore: number;
}

export interface WeeklyTrend {
  day: string;
  reports: number;
  resolved: number;
  hotspots: number;
}

export interface CategoryBreakdown {
  category: string;
  emoji: string;
  count: number;
  color: string;
  percentage: number;
}

// ── Mock Data ──

export const ADMIN_ISSUES: AdminIssue[] = [
  {
    id: 'CIV-2026-004281',
    title: 'Flash Flooding & Blocked Drain',
    category: 'DRAINAGE',
    description: 'Longkang tersumbat teruk dekat belakang kedai. Heavy rain causes water to overflow into Jalan 17/5. Multiple residents affected across 3 streets.',
    location: { lat: 3.1186, lng: 101.6231, address: 'Jalan 17/5, Section 17', neighborhood: 'Petaling Jaya' },
    affectedCount: 420,
    evidenceCount: 12,
    occurrenceCount: 4,
    isRecurring: true,
    status: 'IN_PROGRESS',
    timeline: [
      { date: '27 Sep', title: 'First reported by community' },
      { date: '28 Sep', title: '120 residents confirmed affected' },
      { date: '29 Sep', title: 'PBT Verified issue' },
      { date: '1 Oct', title: 'Contractor assigned' },
      { date: '3 Oct', title: 'Drain clearing started' },
    ],
    images: ['https://images.unsplash.com/photo-1547683905-f686c993aae5?w=400&auto=format&fit=crop'],
    createdAt: '2026-09-27',
    severity: 'CRITICAL',
    leadAgency: 'MBPJ',
    supportingAgency: 'JPS Selangor',
    officialCaseRef: 'PBTCare #48291',
    relatedReports: 17,
    nearbyFacilities: ['SK Taman SEA', 'Pasar Seksyen 17'],
    socialSignals: 23,
    locationConfidence: 'HIGH',
    communityVerificationRate: 67,
    recurrenceData: {
      totalIncidents: 11,
      previousInterventions: 4,
      avgRecurrenceDays: 19,
      monthlyTrend: 43,
    },
  },
  {
    id: 'CIV-2026-004282',
    title: 'Deep Pothole Hazard',
    category: 'ROADS',
    description: 'Dangerous pothole near the traffic light. Multiple motorbikes almost crashed. Road surface deteriorating rapidly.',
    location: { lat: 3.1205, lng: 101.6260, address: 'Jalan Universiti', neighborhood: 'Petaling Jaya' },
    affectedCount: 156,
    evidenceCount: 8,
    occurrenceCount: 2,
    isRecurring: false,
    status: 'VERIFIED',
    timeline: [
      { date: '29 Sep', title: 'Reported by Citizen' },
      { date: '30 Sep', title: 'Verified by local council' },
      { date: '2 Oct', title: 'JKR inspection scheduled' },
    ],
    images: ['https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=400&auto=format&fit=crop'],
    createdAt: '2026-09-29',
    severity: 'HIGH',
    leadAgency: 'MBPJ',
    supportingAgency: 'JKR Petaling',
    officialCaseRef: 'PBTCare #48310',
    relatedReports: 8,
    nearbyFacilities: ['Universiti Malaya Gate'],
    socialSignals: 12,
    locationConfidence: 'HIGH',
    communityVerificationRate: undefined,
  },
  {
    id: 'CIV-2026-004283',
    title: 'Streetlight Cluster Failure',
    category: 'LIGHTING',
    description: 'Multiple streetlights along Jalan SS2/75 not functioning. Area is dangerously dark at night, especially near the playground.',
    location: { lat: 3.1210, lng: 101.6250, address: 'Jalan SS2/75', neighborhood: 'SS2, Petaling Jaya' },
    affectedCount: 89,
    evidenceCount: 5,
    occurrenceCount: 1,
    isRecurring: false,
    status: 'AGENCY_IDENTIFIED',
    timeline: [
      { date: '1 Oct', title: 'Reported by 3 residents' },
      { date: '2 Oct', title: 'PBT confirmed and routed to TNB' },
    ],
    images: [],
    createdAt: '2026-10-01',
    severity: 'MEDIUM',
    leadAgency: 'MBPJ',
    supportingAgency: 'TNB',
    relatedReports: 5,
    socialSignals: 3,
    locationConfidence: 'MEDIUM',
  },
  {
    id: 'CIV-2026-004284',
    title: 'Illegal Dumping Behind Market',
    category: 'WASTE',
    description: 'Construction waste and household rubbish piling up behind Pasar Malam area. Smell is unbearable and rats spotted.',
    location: { lat: 3.1170, lng: 101.6215, address: 'Lorong 17/1, Section 17', neighborhood: 'Petaling Jaya' },
    affectedCount: 210,
    evidenceCount: 14,
    occurrenceCount: 6,
    isRecurring: true,
    status: 'IN_PROGRESS',
    timeline: [
      { date: '25 Sep', title: 'First report' },
      { date: '26 Sep', title: '45 residents confirmed' },
      { date: '28 Sep', title: 'PBT verified — SWCorp notified' },
      { date: '30 Sep', title: 'Partial cleanup done' },
      { date: '5 Oct', title: 'New dumping detected' },
    ],
    images: ['https://images.unsplash.com/photo-1605600659908-0ef719419d41?w=400&auto=format&fit=crop'],
    createdAt: '2026-09-25',
    severity: 'HIGH',
    leadAgency: 'MBPJ',
    supportingAgency: 'SWCorp',
    officialCaseRef: 'PBTCare #48205',
    relatedReports: 12,
    nearbyFacilities: ['Pasar Malam Seksyen 17'],
    socialSignals: 18,
    locationConfidence: 'HIGH',
    communityVerificationRate: 34,
    recurrenceData: {
      totalIncidents: 6,
      previousInterventions: 3,
      avgRecurrenceDays: 14,
      monthlyTrend: 67,
    },
  },
  {
    id: 'CIV-2026-004285',
    title: 'Fallen Tree Blocking Road',
    category: 'FALLEN_TREES',
    description: 'Large tree fell during storm blocking half of Jalan 17/10. Traffic congestion severe during morning rush.',
    location: { lat: 3.1195, lng: 101.6242, address: 'Jalan 17/10, Section 17', neighborhood: 'Petaling Jaya' },
    affectedCount: 340,
    evidenceCount: 9,
    occurrenceCount: 1,
    isRecurring: false,
    status: 'REPORTED',
    timeline: [
      { date: '7 Oct', title: 'Emergency reports from 8 citizens' },
      { date: '7 Oct', title: 'Traffic police notified by community' },
    ],
    images: ['https://images.unsplash.com/photo-1508193638397-1c4234db14d8?w=400&auto=format&fit=crop'],
    createdAt: '2026-10-07',
    severity: 'CRITICAL',
    leadAgency: 'MBPJ',
    supportingAgency: 'Bomba PJ',
    relatedReports: 8,
    nearbyFacilities: ['SK Taman SEA'],
    socialSignals: 31,
    locationConfidence: 'HIGH',
  },
  {
    id: 'CIV-2026-003910',
    title: 'Drain Clearing at Jalan 17/5',
    category: 'DRAINAGE',
    description: 'PBT contractor cleared sediment and unblocked underground drain segment. Community monitoring.',
    location: { lat: 3.1188, lng: 101.6235, address: 'Jalan 17/5, Section 17', neighborhood: 'Petaling Jaya' },
    affectedCount: 42,
    evidenceCount: 4,
    occurrenceCount: 2,
    isRecurring: false,
    status: 'MARKED_RESOLVED',
    communityVerificationRate: 71,
    timeline: [
      { date: '25 Sep', title: 'Reported by community' },
      { date: '28 Sep', title: 'PBT completed cleaning' },
      { date: '30 Sep', title: 'Marked resolved by local council' },
    ],
    images: ['https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=400&auto=format&fit=crop'],
    createdAt: '2026-09-25',
    severity: 'MEDIUM',
    leadAgency: 'MBPJ',
    officialCaseRef: 'PBTCare #47990',
    relatedReports: 4,
    socialSignals: 2,
    locationConfidence: 'HIGH',
    resolutionEvidence: {
      afterPhoto: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=400&auto=format&fit=crop',
      actionTaken: 'Drain cleared of sediment and debris',
      completedAt: '28 Sep, 4:32 PM',
      responsibleTeam: 'PBT Maintenance Unit A',
    },
  },
  {
    id: 'CIV-2026-003915',
    title: 'Pothole Patching Failed',
    category: 'ROADS',
    description: 'Contractor patched the hole but heavy rain washed it away the next day. Now it is deeper than before.',
    location: { lat: 3.1250, lng: 101.6210, address: 'Jalan 19/1', neighborhood: 'Petaling Jaya' },
    affectedCount: 89,
    evidenceCount: 6,
    occurrenceCount: 2,
    isRecurring: true,
    status: 'DISPUTED',
    communityVerificationRate: 15,
    timeline: [
      { date: '1 Oct', title: 'Reported by community' },
      { date: '3 Oct', title: 'Pothole patched by contractor' },
      { date: '4 Oct', title: 'Marked resolved by contractor' },
      { date: '5 Oct', title: 'Community contested: 85% say still broken' },
    ],
    images: ['https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=400&auto=format&fit=crop'],
    createdAt: '2026-10-01',
    severity: 'HIGH',
    leadAgency: 'MBPJ',
    officialCaseRef: 'PBTCare #48112',
    relatedReports: 7,
    socialSignals: 14,
    locationConfidence: 'HIGH',
    resolutionEvidence: {
      afterPhoto: 'https://images.unsplash.com/photo-1584286595398-a59f21d313f5?w=400&auto=format&fit=crop',
      actionTaken: 'Cold mix asphalt applied to pothole.',
      completedAt: '3 Oct, 11:30 AM',
      responsibleTeam: 'Subcontractor RoadWorks Sdn Bhd',
    },
  },
  {
    id: 'CIV-2026-003882',
    title: 'Streetlight Bulb Replacement',
    category: 'LIGHTING',
    description: 'Replaced malfunctioning LED streetlight lamp near traffic junction.',
    location: { lat: 3.1215, lng: 101.6270, address: 'SS2 Junction, Petaling Jaya', neighborhood: 'SS2, Petaling Jaya' },
    affectedCount: 15,
    evidenceCount: 2,
    occurrenceCount: 1,
    isRecurring: false,
    status: 'COMMUNITY_VERIFIED',
    communityVerificationRate: 92,
    timeline: [
      { date: '20 Sep', title: 'Reported by Citizen' },
      { date: '22 Sep', title: 'PBT maintenance completed' },
      { date: '23 Sep', title: 'Community verified ✅' },
    ],
    images: ['https://images.unsplash.com/photo-1509114397022-ed747cca3f65?w=400&auto=format&fit=crop'],
    createdAt: '2026-09-20',
    severity: 'LOW',
    leadAgency: 'MBPJ',
    officialCaseRef: 'PBTCare #47860',
    relatedReports: 2,
    socialSignals: 0,
    locationConfidence: 'HIGH',
    resolutionEvidence: {
      afterPhoto: 'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?w=400&auto=format&fit=crop',
      actionTaken: 'LED bulb replaced',
      completedAt: '22 Sep, 2:15 PM',
      responsibleTeam: 'PBT Electrical Unit',
    },
  },
  {
    id: 'CIV-2026-004286',
    title: 'Broken Pedestrian Railing',
    category: 'PEDESTRIAN',
    description: 'Metal railing near pedestrian bridge is broken and rusting. Sharp edges exposed — dangerous for school children.',
    location: { lat: 3.1178, lng: 101.6220, address: 'Jalan 17/3, Section 17', neighborhood: 'Petaling Jaya' },
    affectedCount: 67,
    evidenceCount: 3,
    occurrenceCount: 1,
    isRecurring: false,
    status: 'VERIFIED',
    timeline: [
      { date: '4 Oct', title: 'Reported by parent' },
      { date: '5 Oct', title: 'PBT verified — hazardous' },
    ],
    images: [],
    createdAt: '2026-10-04',
    severity: 'HIGH',
    leadAgency: 'MBPJ',
    relatedReports: 3,
    nearbyFacilities: ['SK Taman SEA'],
    socialSignals: 5,
    locationConfidence: 'MEDIUM',
  },
];

export const HOTSPOTS: HotspotData[] = [
  { id: 'HS-001', name: 'Section 17 Drainage Corridor', lat: 3.1186, lng: 101.6231, intensity: 92, issueCount: 14, topCategory: 'DRAINAGE', trend: 'rising' },
  { id: 'HS-002', name: 'Jalan Universiti Road Belt', lat: 3.1205, lng: 101.6260, intensity: 74, issueCount: 8, topCategory: 'ROADS', trend: 'stable' },
  { id: 'HS-003', name: 'SS2 Waste Accumulation Zone', lat: 3.1170, lng: 101.6215, intensity: 81, issueCount: 11, topCategory: 'WASTE', trend: 'rising' },
  { id: 'HS-004', name: 'Section 17 School Zone', lat: 3.1195, lng: 101.6242, intensity: 56, issueCount: 5, topCategory: 'HAZARD', trend: 'declining' },
];

export const WEEKLY_TRENDS: WeeklyTrend[] = [
  { day: 'Mon', reports: 12, resolved: 4, hotspots: 2 },
  { day: 'Tue', reports: 18, resolved: 6, hotspots: 2 },
  { day: 'Wed', reports: 24, resolved: 8, hotspots: 3 },
  { day: 'Thu', reports: 31, resolved: 11, hotspots: 4 },
  { day: 'Fri', reports: 22, resolved: 14, hotspots: 4 },
  { day: 'Sat', reports: 16, resolved: 10, hotspots: 3 },
  { day: 'Sun', reports: 9, resolved: 7, hotspots: 2 },
];

export const CATEGORY_BREAKDOWN: CategoryBreakdown[] = [
  { category: 'Drainage', emoji: '🌊', count: 28, color: '#3B82F6', percentage: 32 },
  { category: 'Roads', emoji: '🛣️', count: 19, color: '#F59E0B', percentage: 22 },
  { category: 'Waste', emoji: '🗑️', count: 15, color: '#10B981', percentage: 17 },
  { category: 'Lighting', emoji: '💡', count: 11, color: '#A855F7', percentage: 13 },
  { category: 'Hazards', emoji: '⚠️', count: 8, color: '#EF4444', percentage: 9 },
  { category: 'Others', emoji: '📋', count: 6, color: '#64748B', percentage: 7 },
];

export const AGENCY_PERFORMANCE: AgencyPerformance[] = [
  { name: 'MBPJ', resolved: 42, pending: 18, avgResolutionDays: 4.2, communityScore: 78 },
  { name: 'JKR Petaling', resolved: 12, pending: 8, avgResolutionDays: 8.5, communityScore: 64 },
  { name: 'JPS Selangor', resolved: 6, pending: 5, avgResolutionDays: 12.3, communityScore: 55 },
  { name: 'SWCorp', resolved: 18, pending: 7, avgResolutionDays: 3.1, communityScore: 82 },
  { name: 'TNB', resolved: 8, pending: 3, avgResolutionDays: 2.8, communityScore: 91 },
];

// Monthly reports data for area chart
export const MONTHLY_REPORTS = [
  { month: 'Apr', total: 42, resolved: 28, recurring: 6 },
  { month: 'May', total: 56, resolved: 38, recurring: 8 },
  { month: 'Jun', total: 48, resolved: 35, recurring: 7 },
  { month: 'Jul', total: 72, resolved: 48, recurring: 12 },
  { month: 'Aug', total: 65, resolved: 52, recurring: 9 },
  { month: 'Sep', total: 87, resolved: 58, recurring: 15 },
  { month: 'Oct', total: 34, resolved: 18, recurring: 6 },
];
