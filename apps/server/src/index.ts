import path from 'path';
import dotenv from 'dotenv';
dotenv.config();
dotenv.config({ path: path.join(__dirname, '..', '.env') });
dotenv.config({ path: path.join(process.cwd(), '.env') });

import express from 'express';
import cors from 'cors';
import fs from 'fs';
import {
  CommunityIssue,
  CitizenReport,
  VerificationFeedback,
  registerAffectedEndorsement,
  evaluateVerificationResolution,
  checkPotentialRecurrence,
  calculateDistanceMeters
} from '../../../packages/shared-types';
import {
  isSupabaseConfigured,
  getSupabaseIssues,
  upsertSupabaseIssue,
  insertSupabaseReport,
  insertSupabaseVerification,
  getSupabaseVerifications,
  addSupabaseEndorsement,
  getSupabaseNotifications,
  addSupabaseNotification,
  markAllSupabaseNotificationsRead,
  getSupabaseSignals,
  deleteSupabaseSignal,
  resetSupabaseSignals,
  seedSupabaseIfEmpty
} from './supabase';
import {
  analyzeCivicText,
  batchTriageSignals,
  generateChatbotResponse,
  NLPAnalysisResult
} from './nlp';
import { getAIChatResponse } from './aiService';

const app = express();
const PORT = process.env.PORT || 3002;
const DB_FILE = path.join(__dirname, '..', 'data.json');

app.use(cors());
app.use(express.json());

interface DatabaseState {
  issues: (CommunityIssue & { internalComments?: any[] })[];
  reports: CitizenReport[];
  verifications: VerificationFeedback[];
  endorsedSet: string[]; // Set serialized as array
  notifications: Array<{ id: string; title: string; message: string; time: string; read: boolean }>;
  signals: Array<{ id: number; platform: string; handle: string; text: string; sentiment: string; aiMatch: string; time: string }>;
}

const INITIAL_SIGNALS = [
  { id: 1, platform: 'X', handle: '@johndoe_pj', text: 'The massive pothole on SS2/24 is going to kill someone. Hit it twice this week! @PBT_Official', sentiment: 'High Danger', aiMatch: 'CIV-2026-004285 (Road Defect)', time: '10m ago' },
  { id: 2, platform: 'Facebook', handle: 'Community Watch', text: 'Water not draining near the morning market. It smells terrible, when is the city council coming?', sentiment: 'Nuisance', aiMatch: 'New Incident', time: '1h ago' },
  { id: 3, platform: 'X', handle: '@sara_tweets', text: 'Traffic light at University intersection is completely out.', sentiment: 'Critical', aiMatch: 'New Incident', time: '5m ago' }
];

const INITIAL_NOTIFICATIONS = [
  { id: '1', title: 'Action Dispatched', message: 'MBPJ Cleansing unit assigned to Jalan 17/5 drain.', time: '10m ago', read: false },
  { id: '2', title: 'Recurrence Flagged', message: 'CIV-2026-004281 flagged as 4x repeat occurrence.', time: '45m ago', read: false },
  { id: '3', title: 'Citizen Consensus', message: 'CIV-2026-003910 verified with 75% approval.', time: '2h ago', read: true }
];

// Initial seed data if database file does not exist
const INITIAL_ISSUES: (CommunityIssue & { internalComments?: any[] })[] = [
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
      lng: 101.625,
      address: 'Jalan Universiti, Section 17',
      neighborhood: 'Petaling Jaya'
    },
    affectedCount: 18,
    evidenceCount: 3,
    occurrenceCount: 1,
    isRecurring: false,
    status: 'REPORTED',
    timeline: [
      { date: '29 Sep', title: 'Reported by resident' },
      { date: '30 Sep', title: 'Under preliminary review' }
    ],
    images: ['https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=500&auto=format&fit=crop'],
    createdAt: '2026-09-29'
  },
  {
    id: 'CIV-2026-003910',
    title: 'Damaged Guardrail & Broken Kerb',
    category: 'ROADS',
    description: 'Guardrail hit by lorry last night. Sharp metal protruding towards pedestrian walkway.',
    location: {
      lat: 3.1165,
      lng: 101.621,
      address: 'Jalan 17/1, Section 17',
      neighborhood: 'Petaling Jaya'
    },
    affectedCount: 8,
    evidenceCount: 2,
    occurrenceCount: 1,
    isRecurring: false,
    status: 'MARKED_RESOLVED',
    timeline: [
      { date: '20 Sep', title: 'Reported' },
      { date: '22 Sep', title: 'Repaired by contractor' },
      { date: '24 Sep', title: 'Marked resolved by council' }
    ],
    images: ['https://images.unsplash.com/photo-1590496793929-36417d3117de?w=500&auto=format&fit=crop'],
    communityVerificationRate: 75,
    verificationCounts: { fixed: 3, partial: 1, notFixed: 0 },
    createdAt: '2026-09-20'
  },
  {
    id: 'CIV-2026-004285',
    title: 'Illegal Waste Dumping at Alley',
    category: 'WASTE',
    description: 'Bulk construction debris and broken furniture dumped behind shoplots.',
    location: {
      lat: 3.1198,
      lng: 101.622,
      address: 'Lorong 17/10A, Section 17',
      neighborhood: 'Petaling Jaya'
    },
    affectedCount: 22,
    evidenceCount: 5,
    occurrenceCount: 2,
    isRecurring: true,
    status: 'DISPUTED',
    timeline: [
      { date: '15 Sep', title: 'Reported by merchants' },
      { date: '20 Sep', title: 'Contractor claimed site cleared' },
      { date: '22 Sep', title: 'Community voted 68% NOT FIXED' }
    ],
    images: ['https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=500&auto=format&fit=crop'],
    communityVerificationRate: 32,
    verificationCounts: { fixed: 1, partial: 1, notFixed: 4 },
    createdAt: '2026-09-15'
  },
  {
    id: 'CIV-2026-003880',
    title: 'Fallen Tree Branch Obstructing Street',
    category: 'FALLEN_TREES',
    description: 'Large bough snapped during storm, blocking one lane of Jalan 17/21.',
    location: {
      lat: 3.1172,
      lng: 101.6245,
      address: 'Jalan 17/21, Section 17',
      neighborhood: 'Petaling Jaya'
    },
    affectedCount: 42,
    evidenceCount: 6,
    occurrenceCount: 1,
    isRecurring: false,
    status: 'COMMUNITY_VERIFIED',
    timeline: [
      { date: '18 Sep', title: 'Reported' },
      { date: '19 Sep', title: 'Cleared by Bomba & MBPJ Squad' },
      { date: '21 Sep', title: 'Community verified fixed (100%)' }
    ],
    images: ['https://images.unsplash.com/photo-1509114397022-ed747cca3f65?w=500&auto=format&fit=crop'],
    createdAt: '2026-09-18'
  }
];

function loadDb(): DatabaseState {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (!parsed.notifications) parsed.notifications = INITIAL_NOTIFICATIONS;
      if (!parsed.signals) parsed.signals = INITIAL_SIGNALS;
      return parsed;
    }
  } catch (err) {
    console.error('Error reading db file, re-initializing:', err);
  }
  const defaultState: DatabaseState = {
    issues: INITIAL_ISSUES,
    reports: [],
    verifications: [],
    endorsedSet: [],
    notifications: INITIAL_NOTIFICATIONS,
    signals: INITIAL_SIGNALS
  };
  saveDb(defaultState);
  return defaultState;
}

function saveDb(data: DatabaseState) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving db file:', err);
  }
}

// ── ROUTES ──

// Root redirect to frontend app
app.get('/', (req, res) => {
  if (req.accepts('html')) {
    return res.redirect('http://localhost:3000');
  }
  res.json({
    status: 'online',
    service: 'CivicPulse API Backend',
    database: isSupabaseConfigured() ? 'Supabase Cloud PostgreSQL' : 'Local File DB (data.json)'
  });
});

// GET all community issues
app.get('/api/issues', async (req, res) => {
  if (isSupabaseConfigured()) {
    const cloudIssues = await getSupabaseIssues();
    if (cloudIssues.length > 0) {
      return res.json({ success: true, data: cloudIssues, source: 'supabase' });
    }
  }
  const db = loadDb();
  res.json({ success: true, data: db.issues, source: 'local' });
});

// GET single community issue
app.get('/api/issues/:id', async (req, res) => {
  const issueId = req.params.id;
  if (isSupabaseConfigured()) {
    const cloudIssues = await getSupabaseIssues();
    const found = cloudIssues.find(i => i.id === issueId);
    if (found) return res.json({ success: true, data: found });
  }
  const db = loadDb();
  const issue = db.issues.find(i => i.id === issueId);
  if (!issue) return res.status(404).json({ success: false, error: 'Issue not found' });
  res.json({ success: true, data: issue });
});

// POST new citizen report & group/recurrence checking
app.post('/api/reports', async (req, res) => {
  const db = loadDb();
  const { title, category, description, location, images, reporterId } = req.body;

  if (!title || !category || !location) {
    return res.status(400).json({ success: false, error: 'Missing required report fields' });
  }

  const newReportId = `REP-${Date.now().toString().slice(-6)}`;
  const submittedAt = new Date().toISOString().split('T')[0];

  const newReport: CitizenReport = {
    id: newReportId,
    title,
    category,
    description: description || '',
    location: {
      lat: Number(location.lat) || 3.1186,
      lng: Number(location.lng) || 101.6231,
      address: location.address || 'Petaling Jaya',
      neighborhood: location.neighborhood || 'Petaling Jaya'
    },
    photos: images || [],
    submittedAt,
    reporterIdentifier: reporterId || 'RESIDENT-CA-01'
  };

  // Get current active issues for spatial matching
  const currentIssues = isSupabaseConfigured() ? (await getSupabaseIssues()) : db.issues;

  // 1. Check if report can be grouped into an active existing issue (same category within 150m)
  let matchedGroupIssue: CommunityIssue | undefined;
  for (const existing of currentIssues) {
    if (existing.status !== 'COMMUNITY_VERIFIED' && existing.status !== 'MARKED_RESOLVED') {
      if (existing.category === newReport.category) {
        const dist = calculateDistanceMeters(
          newReport.location.lat,
          newReport.location.lng,
          existing.location.lat,
          existing.location.lng
        );
        if (dist <= 150) {
          matchedGroupIssue = existing;
          break;
        }
      }
    }
  }

  if (matchedGroupIssue) {
    // Group into existing issue
    newReport.issueId = matchedGroupIssue.id;
    matchedGroupIssue.reportCount = (matchedGroupIssue.reportCount || 1) + 1;
    matchedGroupIssue.affectedCount += 1;
    matchedGroupIssue.evidenceCount += (images?.length || 0);
    if (images && images.length > 0) {
      matchedGroupIssue.images = [...(matchedGroupIssue.images || []), ...images];
    }
    matchedGroupIssue.timeline.push({
      date: 'Today',
      title: `Corroborating report submitted (${newReport.title})`
    });

    if (isSupabaseConfigured()) {
      await insertSupabaseReport(newReport);
      await upsertSupabaseIssue(matchedGroupIssue);
    }
    db.reports.push(newReport);
    saveDb(db);

    return res.json({
      success: true,
      action: 'GROUPED',
      issue: matchedGroupIssue,
      report: newReport
    });
  }

  // 2. Check for recurrence against past resolved issues
  const resolvedIssues = currentIssues.filter(i => i.status === 'COMMUNITY_VERIFIED' || i.status === 'MARKED_RESOLVED');
  const recurrenceMatch = checkPotentialRecurrence(
    {
      lat: newReport.location.lat,
      lng: newReport.location.lng,
      category: newReport.category,
      submittedAt: newReport.submittedAt
    },
    resolvedIssues,
    200,
    90
  );

  const isRecurring = Boolean(recurrenceMatch);
  const newIssueId = `CIV-2026-${Date.now().toString().slice(-6)}`;

  const createdIssue: CommunityIssue & { internalComments?: any[] } = {
    id: newIssueId,
    title,
    category,
    description: description || '',
    location: newReport.location,
    reportCount: 1,
    affectedCount: 1,
    evidenceCount: images?.length || 0,
    occurrenceCount: isRecurring ? 2 : 1,
    isRecurring,
    status: 'REPORTED',
    timeline: [
      { date: 'Today', title: 'Submitted by citizen' },
      ...(isRecurring ? [{ date: 'Today', title: 'Flagged as potential recurrence near past resolved incident' }] : [])
    ],
    images: images || [],
    createdAt: submittedAt
  };

  newReport.issueId = newIssueId;

  if (isSupabaseConfigured()) {
    await insertSupabaseReport(newReport);
    await upsertSupabaseIssue(createdIssue);
  }
  db.reports.push(newReport);
  db.issues.unshift(createdIssue);
  saveDb(db);

  res.json({
    success: true,
    action: 'CREATED',
    issue: createdIssue,
    report: newReport
  });
});

// POST endorsement: "Affects Me Too" (Prevents duplicate counting)
app.post('/api/issues/:id/endorse', async (req, res) => {
  const db = loadDb();
  const issueId = req.params.id;
  const residentId = req.body.residentId || 'RESIDENT-CA-01';

  let issue = isSupabaseConfigured()
    ? (await getSupabaseIssues()).find(i => i.id === issueId)
    : db.issues.find(i => i.id === issueId);

  if (!issue) {
    issue = db.issues.find(i => i.id === issueId);
  }
  if (!issue) return res.status(404).json({ success: false, error: 'Issue not found' });

  if (isSupabaseConfigured()) {
    const inserted = await addSupabaseEndorsement(issueId, residentId);
    if (!inserted) {
      return res.json({ success: true, message: 'Already endorsed by this resident', issue });
    }
    issue.affectedCount += 1;
    await upsertSupabaseIssue(issue);
  } else {
    const endorsedSet = new Set(db.endorsedSet);
    const result = registerAffectedEndorsement(issue, residentId, endorsedSet);
    if (!result.wasIncremented) {
      return res.json({ success: true, message: 'Already endorsed by this resident', issue });
    }
    db.endorsedSet = Array.from(endorsedSet);
    Object.assign(issue, result.updatedIssue);
    saveDb(db);
  }

  res.json({ success: true, message: 'Endorsement registered', issue });
});

// POST verification vote: FIXED | PARTIAL | NOT_FIXED
app.post('/api/issues/:id/verify', async (req, res) => {
  const db = loadDb();
  const issueId = req.params.id;
  const { verdict, residentId } = req.body;
  const currentResident = residentId || 'RESIDENT-CA-01';

  if (!['FIXED', 'PARTIAL', 'NOT_FIXED'].includes(verdict)) {
    return res.status(400).json({ success: false, error: 'Invalid verification verdict' });
  }

  let issue = isSupabaseConfigured()
    ? (await getSupabaseIssues()).find(i => i.id === issueId)
    : db.issues.find(i => i.id === issueId);

  if (!issue) issue = db.issues.find(i => i.id === issueId);
  if (!issue) return res.status(404).json({ success: false, error: 'Issue not found' });

  const feedbackRecord: VerificationFeedback = {
    id: `VF-${Date.now()}`,
    issueId,
    residentId: currentResident,
    verdict,
    submittedAt: new Date().toISOString()
  };

  let issueFeedbacks: VerificationFeedback[] = [];

  if (isSupabaseConfigured()) {
    await insertSupabaseVerification(feedbackRecord);
    issueFeedbacks = await getSupabaseVerifications(issueId);
  } else {
    const existingIdx = db.verifications.findIndex(v => v.issueId === issueId && v.residentId === currentResident);
    if (existingIdx >= 0) db.verifications[existingIdx] = feedbackRecord;
    else db.verifications.push(feedbackRecord);
    issueFeedbacks = db.verifications.filter(v => v.issueId === issueId);
  }

  // Evaluate with multi-vote quorum safeguards (threshold = 3)
  const evaluation = evaluateVerificationResolution(issueFeedbacks, 3);
  issue.communityVerificationRate = evaluation.verificationRate;
  issue.status = evaluation.statusRecommendation;
  issue.verificationCounts = {
    fixed: evaluation.fixedCount,
    partial: evaluation.partialCount,
    notFixed: evaluation.notFixedCount
  };

  if (isSupabaseConfigured()) {
    await upsertSupabaseIssue(issue);
  }
  saveDb(db);

  res.json({
    success: true,
    issue,
    data: issue,
    evaluation,
    feedbacks: issueFeedbacks
  });
});

// PATCH issue status (Admin dispatch or resolution action)
app.patch('/api/issues/:id/status', async (req, res) => {
  const db = loadDb();
  const issueId = req.params.id;
  let issue = isSupabaseConfigured()
    ? (await getSupabaseIssues()).find(i => i.id === issueId)
    : db.issues.find(i => i.id === issueId);

  if (!issue) issue = db.issues.find(i => i.id === issueId);
  if (!issue) return res.status(404).json({ success: false, error: 'Issue not found' });

  const { status, title, note } = req.body;
  if (status) issue.status = status;
  if (title || note) {
    issue.timeline.push({
      date: 'Today',
      title: title || `Status updated to ${status}`,
      description: note
    });
  }

  if (isSupabaseConfigured()) {
    await upsertSupabaseIssue(issue);
  }
  saveDb(db);
  res.json({ success: true, data: issue });
});

// POST internal comment for case discussion
app.post('/api/issues/:id/comments', async (req, res) => {
  const db = loadDb();
  const issueId = req.params.id;
  let issue = isSupabaseConfigured()
    ? (await getSupabaseIssues()).find(i => i.id === issueId)
    : db.issues.find(i => i.id === issueId);

  if (!issue) issue = db.issues.find(i => i.id === issueId);
  if (!issue) return res.status(404).json({ success: false, error: 'Issue not found' });

  const { author, agency, text } = req.body;
  if (!text) return res.status(400).json({ success: false, error: 'Comment text is required' });

  if (!issue.internalComments) issue.internalComments = [];
  const newComment = {
    id: `C-${Date.now()}`,
    author: author || 'Council Officer',
    agency: agency || 'MBPJ',
    text,
    timestamp: 'Just now'
  };

  issue.internalComments.push(newComment);

  if (isSupabaseConfigured()) {
    await upsertSupabaseIssue(issue);
  }
  saveDb(db);
  res.json({ success: true, data: newComment, comments: issue.internalComments });
});

// POST dispatch field auditor for disputed case
app.post('/api/issues/:id/audit-dispatch', async (req, res) => {
  const db = loadDb();
  const issueId = req.params.id;
  let issue = isSupabaseConfigured()
    ? (await getSupabaseIssues()).find(i => i.id === issueId)
    : db.issues.find(i => i.id === issueId);

  if (!issue) issue = db.issues.find(i => i.id === issueId);
  if (!issue) return res.status(404).json({ success: false, error: 'Issue not found' });

  issue.status = 'IN_PROGRESS';
  issue.timeline.push({
    date: 'Today',
    title: 'Field Auditor Dispatched',
    description: 'MBPJ Quality Assurance Inspector assigned to perform on-site measurement and re-audit.'
  });

  const notif = {
    id: `N-${Date.now()}`,
    title: 'Auditor Dispatched',
    message: `Quality inspector assigned to site audit for ${issue.id}.`,
    time: 'Just now',
    read: false
  };

  if (isSupabaseConfigured()) {
    await upsertSupabaseIssue(issue);
    await addSupabaseNotification(notif);
  }
  db.notifications.unshift(notif);
  saveDb(db);
  res.json({ success: true, data: issue });
});

// POST withhold sign-off / reject contractor resolution
app.post('/api/issues/:id/reject-resolution', async (req, res) => {
  const db = loadDb();
  const issueId = req.params.id;
  let issue = isSupabaseConfigured()
    ? (await getSupabaseIssues()).find(i => i.id === issueId)
    : db.issues.find(i => i.id === issueId);

  if (!issue) issue = db.issues.find(i => i.id === issueId);
  if (!issue) return res.status(404).json({ success: false, error: 'Issue not found' });

  issue.status = 'IN_PROGRESS';
  issue.timeline.push({
    date: 'Today',
    title: 'Resolution Withheld / Rejected',
    description: 'Council withheld sign-off following community vote and evidence audit.'
  });

  const notif = {
    id: `N-${Date.now()}`,
    title: 'Resolution Withheld',
    message: `Contractor sign-off withheld on ${issue.id}; re-work mandated.`,
    time: 'Just now',
    read: false
  };

  if (isSupabaseConfigured()) {
    await upsertSupabaseIssue(issue);
    await addSupabaseNotification(notif);
  }
  db.notifications.unshift(notif);
  saveDb(db);
  res.json({ success: true, data: issue });
});

// POST force close with admin justification
app.post('/api/issues/:id/force-close', async (req, res) => {
  const db = loadDb();
  const issueId = req.params.id;
  let issue = isSupabaseConfigured()
    ? (await getSupabaseIssues()).find(i => i.id === issueId)
    : db.issues.find(i => i.id === issueId);

  if (!issue) issue = db.issues.find(i => i.id === issueId);
  if (!issue) return res.status(404).json({ success: false, error: 'Issue not found' });

  const { reason } = req.body;
  issue.status = 'MARKED_RESOLVED';
  issue.timeline.push({
    date: 'Today',
    title: 'Council Administrative Override (Closed)',
    description: reason || 'Executive force-close authorization applied.'
  });

  const notif = {
    id: `N-${Date.now()}`,
    title: 'Admin Override Applied',
    message: `Case ${issue.id} force-closed with justification: ${reason || 'Executive sign-off'}.`,
    time: 'Just now',
    read: false
  };

  if (isSupabaseConfigured()) {
    await upsertSupabaseIssue(issue);
    await addSupabaseNotification(notif);
  }
  db.notifications.unshift(notif);
  saveDb(db);
  res.json({ success: true, data: issue });
});

// GET notifications
app.get('/api/notifications', async (req, res) => {
  if (isSupabaseConfigured()) {
    const cloudNotifs = await getSupabaseNotifications();
    if (cloudNotifs.length > 0) return res.json({ success: true, data: cloudNotifs });
  }
  const db = loadDb();
  res.json({ success: true, data: db.notifications || [] });
});

// POST mark notifications read
app.post('/api/notifications/read-all', async (req, res) => {
  if (isSupabaseConfigured()) {
    await markAllSupabaseNotificationsRead();
  }
  const db = loadDb();
  if (db.notifications) {
    db.notifications.forEach(n => { n.read = true; });
  }
  saveDb(db);
  res.json({ success: true });
});

// GET social signals
app.get('/api/signals', async (req, res) => {
  if (isSupabaseConfigured()) {
    const cloudSignals = await getSupabaseSignals();
    if (cloudSignals.length > 0) return res.json({ success: true, data: cloudSignals });
  }
  const db = loadDb();
  res.json({ success: true, data: db.signals || [] });
});

// POST convert social signal to verified issue
app.post('/api/signals/convert', async (req, res) => {
  const db = loadDb();
  const { signalId } = req.body;
  const signals = isSupabaseConfigured() ? (await getSupabaseSignals()) : (db.signals || []);
  const signal = signals.find((s: any) => s.id === Number(signalId));

  if (!signal) {
    return res.status(404).json({ success: false, error: 'Signal not found' });
  }

  const nlpAnalysis = analyzeCivicText(signal.text);
  const newIssueId = `CIV-2026-SIG${Date.now().toString().slice(-4)}`;

  const newIssue: CommunityIssue = {
    id: newIssueId,
    title: nlpAnalysis.suggestedTitle,
    category: nlpAnalysis.category,
    description: `[NLP Analyzed (${nlpAnalysis.detectedLanguage})] Social Signal from ${signal.handle} (${signal.platform}): "${signal.text}"\n\nIdentified urgency: ${nlpAnalysis.urgency} (Frustration Index: ${nlpAnalysis.sentiment.frustrationIndex}%). Suggested Agency: ${nlpAnalysis.recommendedAgency.name}.`,
    location: {
      lat: 3.1186 + (Math.random() - 0.5) * 0.02,
      lng: 101.6231 + (Math.random() - 0.5) * 0.02,
      address: nlpAnalysis.detectedLandmarks[0] ? `${nlpAnalysis.detectedLandmarks[0]}, Petaling Jaya` : 'Petaling Jaya Municipal Area',
      neighborhood: 'Petaling Jaya'
    },
    reportCount: 1,
    affectedCount: nlpAnalysis.urgency === 'CRITICAL' ? 28 : 12,
    evidenceCount: 1,
    occurrenceCount: 1,
    isRecurring: false,
    status: 'REPORTED',
    timeline: [
      { date: 'Today', title: `Ingested from ${signal.platform} by AI Signal Monitor (${signal.handle})` },
      { date: 'Today', title: `NLP Triaged (${nlpAnalysis.category} / ${nlpAnalysis.urgency}) and validated by Council Admin` }
    ],
    images: ['https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=500&auto=format&fit=crop'],
    createdAt: new Date().toISOString().split('T')[0]
  };

  const notif = {
    id: `N-${Date.now()}`,
    title: 'Social Signal Converted',
    message: `AI complaint from ${signal.handle} converted into new case ${newIssueId}.`,
    time: 'Just now',
    read: false
  };

  if (isSupabaseConfigured()) {
    await upsertSupabaseIssue(newIssue);
    await deleteSupabaseSignal(Number(signalId));
    await addSupabaseNotification(notif);
  }

  const signalIdx = db.signals.findIndex(s => s.id === Number(signalId));
  if (signalIdx >= 0) db.signals.splice(signalIdx, 1);
  db.issues.unshift(newIssue);
  db.notifications.unshift(notif);
  saveDb(db);

  res.json({ success: true, issue: newIssue, remainingSignals: db.signals });
});

// POST dismiss social signal
app.post('/api/signals/:id/dismiss', async (req, res) => {
  const signalId = Number(req.params.id);
  if (isSupabaseConfigured()) {
    await deleteSupabaseSignal(signalId);
  }
  const db = loadDb();
  db.signals = (db.signals || []).filter(s => s.id !== signalId);
  saveDb(db);
  res.json({ success: true, remainingSignals: db.signals });
});

// POST reset demo signals to initial 3 records
app.post('/api/signals/reset', async (req, res) => {
  const db = loadDb();
  db.signals = [...INITIAL_SIGNALS];
  saveDb(db);
  if (isSupabaseConfigured()) {
    await resetSupabaseSignals(INITIAL_SIGNALS);
  }
  res.json({ success: true, data: db.signals });
});

// POST batch validate all high danger / critical signals into issues
app.post('/api/signals/batch-validate-danger', async (req, res) => {
  const db = loadDb();
  const currentSignals = isSupabaseConfigured() ? (await getSupabaseSignals()) : (db.signals || []);
  const highDangerSignals = currentSignals.filter((s: any) => s.sentiment === 'Critical' || s.sentiment === 'High Danger');

  if (highDangerSignals.length === 0) {
    return res.json({ success: true, count: 0, remainingSignals: db.signals, createdIssues: [] });
  }

  const createdIssues: CommunityIssue[] = [];

  for (const signal of highDangerSignals) {
    const nlpAnalysis = analyzeCivicText(signal.text);
    const newIssueId = `CIV-2026-SIG${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 10)}`;

    const newIssue: CommunityIssue = {
      id: newIssueId,
      title: nlpAnalysis.suggestedTitle,
      category: nlpAnalysis.category,
      description: `[NLP Analyzed (${nlpAnalysis.detectedLanguage})] Social Signal from ${signal.handle} (${signal.platform}): "${signal.text}"\n\nIdentified urgency: ${nlpAnalysis.urgency} (Frustration Index: ${nlpAnalysis.sentiment.frustrationIndex}%). Suggested Agency: ${nlpAnalysis.recommendedAgency.name}.`,
      location: {
        lat: 3.1186 + (Math.random() - 0.5) * 0.02,
        lng: 101.6231 + (Math.random() - 0.5) * 0.02,
        address: nlpAnalysis.detectedLandmarks[0] ? `${nlpAnalysis.detectedLandmarks[0]}, Petaling Jaya` : 'Petaling Jaya Municipal Area',
        neighborhood: 'Petaling Jaya'
      },
      reportCount: 1,
      affectedCount: nlpAnalysis.urgency === 'CRITICAL' ? 32 : 18,
      evidenceCount: 1,
      occurrenceCount: 1,
      isRecurring: false,
      status: 'REPORTED',
      timeline: [
        { date: 'Today', title: `Ingested from ${signal.platform} by AI Signal Monitor (${signal.handle})` },
        { date: 'Today', title: `Urgent hazard validated into Council Priority Workorder` }
      ],
      images: ['https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=500&auto=format&fit=crop'],
      createdAt: new Date().toISOString().split('T')[0]
    };

    if (isSupabaseConfigured()) {
      await upsertSupabaseIssue(newIssue);
      await deleteSupabaseSignal(Number(signal.id));
    }

    const signalIdx = db.signals.findIndex(s => s.id === Number(signal.id));
    if (signalIdx >= 0) db.signals.splice(signalIdx, 1);
    db.issues.unshift(newIssue);
    createdIssues.push(newIssue);
  }

  saveDb(db);
  res.json({ success: true, count: createdIssues.length, remainingSignals: db.signals, createdIssues });
});

// ─────────────────────────────────────────────────────────────
// NLP Intelligence Endpoints
// ─────────────────────────────────────────────────────────────

// POST /api/nlp/analyze - Analyze any citizen report or social complaint
app.post('/api/nlp/analyze', (req, res) => {
  const { text } = req.body;
  if (!text || typeof text !== 'string') {
    return res.status(400).json({ success: false, error: 'Text string is required for NLP analysis' });
  }

  const analysis: NLPAnalysisResult = analyzeCivicText(text);
  res.json({ success: true, data: analysis });
});

// POST /api/nlp/batch-triage - Analyze and rank queue of signals/complaints
app.post('/api/nlp/batch-triage', (req, res) => {
  const { signals } = req.body;
  if (!Array.isArray(signals)) {
    return res.status(400).json({ success: false, error: 'Signals array is required' });
  }

  const triaged = batchTriageSignals(signals);
  res.json({ success: true, count: triaged.length, data: triaged });
});

// POST /api/chat - AI Civic Chatbot for Admin and Citizen powered by Groq & Gemini
app.post('/api/chat', async (req, res) => {
  const { message, role, language, provider, history } = req.body;
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ success: false, error: 'Message string is required' });
  }

  const db = loadDb();
  const currentIssues = isSupabaseConfigured() ? (await getSupabaseIssues()) : (db.issues || []);
  
  try {
    const aiResult = await getAIChatResponse({
      message,
      role: role === 'ADMIN' ? 'ADMIN' : 'CITIZEN',
      language: language === 'BM' ? 'BM' : 'EN',
      provider: provider || 'auto',
      currentIssues,
      history: Array.isArray(history) ? history : []
    });

    res.json({ success: true, data: aiResult });
  } catch (err: any) {
    console.error('[Chat Error]:', err);
    // Absolute fallback
    const fallback = generateChatbotResponse(
      message,
      role === 'ADMIN' ? 'ADMIN' : 'CITIZEN',
      language === 'BM' ? 'BM' : 'EN',
      currentIssues
    );
    res.json({ success: true, data: { ...fallback, provider: 'local_nlp', model: 'Emergency Fallback' } });
  }
});

if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, async () => {
    console.log(`CivicPulse Backend Server running at http://localhost:${PORT}`);
    if (isSupabaseConfigured()) {
      console.log('⚡ Connected to Supabase Cloud PostgreSQL database');
      await seedSupabaseIfEmpty(INITIAL_ISSUES, INITIAL_SIGNALS, INITIAL_NOTIFICATIONS);
    } else {
      console.log('📁 Running with local JSON database fallback (apps/server/data.json).');
      console.log('👉 To enable Supabase Cloud: Add SUPABASE_URL and SUPABASE_ANON_KEY to apps/server/.env');
    }
  });
}

export default app;
