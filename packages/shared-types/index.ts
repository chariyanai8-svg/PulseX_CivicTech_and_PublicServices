export type IssueCategory = 
  | 'ROADS' | 'DRAINAGE' | 'WASTE' | 'LIGHTING' 
  | 'FALLEN_TREES' | 'OBSTRUCTION' | 'FACILITIES' 
  | 'PEDESTRIAN' | 'HAZARD' | 'ENVIRONMENT' | 'OTHER';

export type IssueSeverity = 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';

export type IssueStatus = 
  | 'REPORTED' | 'VERIFIED' | 'AGENCY_IDENTIFIED' 
  | 'IN_PROGRESS' | 'DISPUTED' | 'MARKED_RESOLVED' | 'COMMUNITY_VERIFIED';

export interface TimelineEvent {
  date: string;
  title: string;
  description?: string;
  actor?: string;
}

/** 1. Individual resident submissions and evidence */
export interface CitizenReport {
  id: string;
  issueId?: string; // Associated community issue if grouped
  title: string;
  category: IssueCategory;
  description: string;
  location: {
    lat: number;
    lng: number;
    address: string;
    neighborhood: string;
  };
  photos: string[];
  submittedAt: string;
  reporterIdentifier?: string; // Anonymized or hashed resident ID
  aiExtraction?: {
    suggestedCategory: IssueCategory;
    categoryConfidence: number; // 0.0 - 1.0
    extractedLocationClues: string[];
    summary: string;
    isReviewedByUserOrAdmin: boolean;
  };
}

/** 2. Recorded administrator / contractor action and history */
export interface IssueActionRecord {
  id: string;
  issueId: string;
  actionType: 'STATUS_CHANGE' | 'TEAM_ASSIGNMENT' | 'NOTE_ADDED' | 'RESOLUTION_SUBMITTED' | 'ADMIN_OVERRIDE';
  performedBy: string;
  performedByRole: 'COUNCIL_ADMIN' | 'CONTRACTOR_LEAD' | 'OPERATIONS_STAFF';
  timestamp: string;
  notes?: string;
  assignedTeam?: string;
  resolutionEvidence?: {
    actionTaken: string;
    afterPhotos: string[];
    completedAt: string;
  };
}

/** 3. Resident verification feedback on a claimed resolution */
export interface VerificationFeedback {
  id: string;
  issueId: string;
  residentId: string;
  verdict: 'FIXED' | 'PARTIAL' | 'NOT_FIXED';
  feedbackNotes?: string;
  evidencePhoto?: string;
  submittedAt: string;
}

/** 4. Recurrence link between incidents at the same location */
export interface RecurrenceLink {
  currentIssueId: string;
  previousIssueId: string;
  locationProximityMeters: number;
  timeSinceLastResolutionDays: number;
  recurrenceReasonFlag?: 'INCOMPLETE_REPAIR' | 'SEASONAL_WEATHER' | 'STRUCTURAL_DEFECT' | 'UNSPECIFIED';
}

/** 5. Grouped community incident representing the underlying local problem */
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
  reportCount?: number; // Number of grouped individual reports
  affectedCount: number; // Number of distinct residents who indicated "I'm affected too"
  evidenceCount: number;
  occurrenceCount: number;
  isRecurring: boolean;
  status: IssueStatus;
  timeline: TimelineEvent[];
  images: string[];
  communityVerificationRate?: number; // Calculated across all resident verification feedbacks
  verificationCounts?: {
    fixed: number;
    partial: number;
    notFixed: number;
  };
  recurrenceLinks?: RecurrenceLink[];
  internalComments?: Array<{ id: string; author: string; agency: string; text: string; timestamp: string; isSystemAction?: boolean }>;
  createdAt: string;
  lastUpdatedAt?: string;
}

export * from './domainLogic';
export * from './i18n';