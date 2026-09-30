import { CommunityIssue } from '../../../packages/shared-types';

export const INITIAL_ISSUES: CommunityIssue[] = [
  {
    id: 'CIV-2026-004281',
    title: 'Flash Flooding & Blocked Drain',
    category: 'DRAINAGE',
    description: 'Longkang tersumbat teruk dekat belakang kedai. Heavy rain causes water to overflow into Jalan 17/5.',
    location: {
      lat: 3.1186,
      lng: 101.6231,
      address: 'Jalan 17/5, Section 17',
      neighborhood: 'Petaling Jaya'
    },
    affectedCount: 34,
    evidenceCount: 8,
    occurrenceCount: 4,
    isRecurring: true,
    status: 'IN_PROGRESS',
    timeline: [
      { date: '27 Sep', title: 'First reported by community' },
      { date: '28 Sep', title: '12 residents confirmed affected' },
      { date: '29 Sep', title: 'PBT Verified issue' },
      { date: '30 Sep', title: 'Repair work scheduled' }
    ],
    images: ['https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=500&auto=format&fit=crop'],
    createdAt: '2026-09-27'
  },
  {
    id: 'CIV-2026-004282',
    title: 'Deep Pothole Hazard',
    category: 'ROADS',
    description: 'Dangerous pothole near the traffic light. Multiple motorbikes almost crashed.',
    location: {
      lat: 3.1205,
      lng: 101.6260,
      address: 'Jalan Universiti',
      neighborhood: 'Petaling Jaya'
    },
    affectedCount: 18,
    evidenceCount: 3,
    occurrenceCount: 1,
    isRecurring: false,
    status: 'VERIFIED',
    timeline: [
      { date: '29 Sep', title: 'Reported by Citizen' },
      { date: '30 Sep', title: 'Verified by local council' }
    ],
    images: [],
    createdAt: '2026-09-29'
  }
];