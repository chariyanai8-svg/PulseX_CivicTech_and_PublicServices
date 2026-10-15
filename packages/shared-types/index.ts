export type IssueCategory = 
  | 'ROADS' | 'DRAINAGE' | 'WASTE' | 'LIGHTING' 
  | 'FALLEN_TREES' | 'OBSTRUCTION' | 'FACILITIES' 
  | 'PEDESTRIAN' | 'HAZARD' | 'ENVIRONMENT' | 'OTHER';

export type IssueStatus = 
  | 'REPORTED' | 'VERIFIED' | 'AGENCY_IDENTIFIED' 
  | 'IN_PROGRESS' | 'DISPUTED' | 'MARKED_RESOLVED' | 'COMMUNITY_VERIFIED';

export interface TimelineEvent {
  date: string;
  title: string;
  description?: string;
}

export interface CommunityIssue {
  id: string;
  title: string;
  category: IssueCategory;
  description: string;
  location: {
    lat: number;
    lng: number;
    address: string;
    neighborhood: string;
  };
  affectedCount: number;
  evidenceCount: number;
  occurrenceCount: number;
  isRecurring: boolean;
  status: IssueStatus;
  timeline: TimelineEvent[];
  images: string[];
  communityVerificationRate?: number;
  createdAt: string;
}