import { CommunityIssue } from '../../../packages/shared-types';

export const INITIAL_ISSUES: CommunityIssue[] = [
  // --- ORIGINAL ISSUES ---
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
    images: ['https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=500&auto=format&fit=crop'],
    createdAt: '2026-09-29'
  },

  // --- ADDITIONAL CASES FOR DRAINAGE ---
  {
    id: 'CIV-2026-004283',
    title: 'Collapsed Longkang Concrete Wall',
    category: 'DRAINAGE',
    description: 'Concrete side wall of monsoon drain collapsed near school back gate, obstructing waterflow.',
    location: {
      lat: 3.1250,
      lng: 101.6310,
      address: 'Jalan SS2/24',
      neighborhood: 'SS2 Petaling Jaya'
    },
    affectedCount: 14,
    evidenceCount: 2,
    occurrenceCount: 1,
    isRecurring: false,
    status: 'REPORTED',
    timeline: [{ date: '14 Oct', title: 'Submitted by resident' }],
    images: ['https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=500&auto=format&fit=crop'],
    createdAt: '2026-10-14'
  },

  // --- ADDITIONAL CASES FOR ROADS ---
  {
    id: 'CIV-2026-004284',
    title: 'Damaged Speed Bump & Metal Studs Exposed',
    category: 'ROADS',
    description: 'Rubber speed bump broken into pieces leaving sharp metal bolts sticking out on road surface.',
    location: {
      lat: 3.1140,
      lng: 101.6190,
      address: 'Jalan 17/21',
      neighborhood: 'Section 17'
    },
    affectedCount: 19,
    evidenceCount: 2,
    occurrenceCount: 1,
    isRecurring: false,
    status: 'IN_PROGRESS',
    timeline: [{ date: '13 Oct', title: 'Work order dispatched by MBPJ' }],
    images: ['https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=500&auto=format&fit=crop'],
    createdAt: '2026-10-13'
  },

  // --- WASTE CATEGORY ---
  {
    id: 'CIV-2026-004285',
    title: 'Uncollected Bulk Furniture Dump',
    category: 'WASTE',
    description: 'Old mattresses, sofa frames, and broken cabinets illegally dumped along residential backlane walkway.',
    location: {
      lat: 3.1192,
      lng: 101.6245,
      address: 'Jalan 17/13 Backlane',
      neighborhood: 'Section 17'
    },
    affectedCount: 31,
    evidenceCount: 3,
    occurrenceCount: 1,
    isRecurring: false,
    status: 'REPORTED',
    timeline: [{ date: '12 Oct', title: 'Logged by neighborhood watch' }],
    images: ['https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=500&auto=format&fit=crop'],
    createdAt: '2026-10-12'
  },
  {
    id: 'CIV-2026-004286',
    title: 'Overflowing Commercial Trash Bins',
    category: 'WASTE',
    description: 'Restaurant waste bins overflowing onto sidewalk for 3 consecutive days, creating foul odor.',
    location: {
      lat: 3.1218,
      lng: 101.6225,
      address: 'SS2/67 Commercial Area',
      neighborhood: 'Petaling Jaya'
    },
    affectedCount: 45,
    evidenceCount: 4,
    occurrenceCount: 4,
    isRecurring: true,
    status: 'REPORTED',
    timeline: [{ date: '14 Oct', title: 'Escalated to KDEB Waste Dept' }],
    images: ['https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=500&auto=format&fit=crop'],
    createdAt: '2026-10-14'
  },

  // --- LIGHTING CATEGORY ---
  {
    id: 'CIV-2026-004287',
    title: 'Complete Row Streetlight Blackout',
    category: 'LIGHTING',
    description: 'Row of 5 consecutive streetlights fully out along park perimeter road. Area is dangerously dark at night.',
    location: {
      lat: 3.1170,
      lng: 101.6210,
      address: 'Jalan 17/1',
      neighborhood: 'Section 17'
    },
    affectedCount: 38,
    evidenceCount: 2,
    occurrenceCount: 1,
    isRecurring: false,
    status: 'IN_PROGRESS',
    timeline: [{ date: '09 Oct', title: 'Inspected by TNB Contractors' }],
    images: ['https://images.unsplash.com/photo-1509114397022-ed747cca3f65?w=500&auto=format&fit=crop'],
    createdAt: '2026-10-09'
  },
  {
    id: 'CIV-2026-004288',
    title: 'Flickering LED Lamp Near Junction',
    category: 'LIGHTING',
    description: 'Streetlight pole #PJ-402 constantly flashing, distracting drivers approaching the traffic lights.',
    location: {
      lat: 3.1310,
      lng: 101.6350,
      address: 'Jalan SS2/55',
      neighborhood: 'SS2'
    },
    affectedCount: 12,
    evidenceCount: 1,
    occurrenceCount: 1,
    isRecurring: false,
    status: 'REPORTED',
    timeline: [{ date: '13 Oct', title: 'Reported by motorist' }],
    images: ['https://images.unsplash.com/photo-1509114397022-ed747cca3f65?w=500&auto=format&fit=crop'],
    createdAt: '2026-10-13'
  },

  // --- HAZARD CATEGORY ---
  {
    id: 'CIV-2026-004289',
    title: 'Overhanging Broken Tree Branch',
    category: 'HAZARD',
    description: 'Large storm-damaged branch hanging loosely directly above power cables and roadway.',
    location: {
      lat: 3.1198,
      lng: 101.6260,
      address: 'Jalan 17/2',
      neighborhood: 'Section 17'
    },
    affectedCount: 24,
    evidenceCount: 3,
    occurrenceCount: 1,
    isRecurring: false,
    status: 'IN_PROGRESS',
    timeline: [{ date: '14 Oct', title: 'MBPJ Landscape team notified' }],
    images: ['https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=500&auto=format&fit=crop'],
    createdAt: '2026-10-14'
  },
  {
    id: 'CIV-2026-004290',
    title: 'Exposed Open Manhole Hole',
    category: 'HAZARD',
    description: 'Uncovered telecom manhole hole left exposed on pedestrian pavement without safety barricade or cone.',
    location: {
      lat: 3.1380,
      lng: 101.6420,
      address: 'Jalan Damansara',
      neighborhood: 'TTDI / PJ Border'
    },
    affectedCount: 67,
    evidenceCount: 5,
    occurrenceCount: 1,
    isRecurring: false,
    status: 'REPORTED',
    timeline: [{ date: '15 Oct', title: 'Urgent safety hazard logged' }],
    images: ['https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=500&auto=format&fit=crop'],
    createdAt: '2026-10-15'
  }
];