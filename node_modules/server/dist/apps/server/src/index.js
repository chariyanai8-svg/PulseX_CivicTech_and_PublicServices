"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const shared_types_1 = require("../../../packages/shared-types");
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3002;
const DB_FILE = path_1.default.join(__dirname, '..', 'data.json');
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Initial seed data if database file does not exist
const INITIAL_ISSUES = [
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
    },
    {
        id: 'CIV-2026-003910',
        title: 'Drain Clearing at Jalan 17/5',
        category: 'DRAINAGE',
        description: 'PBT contractor cleared sediment and unblocked underground drain segment.',
        location: { lat: 3.1188, lng: 101.6235, address: 'Jalan 17/5, Section 17', neighborhood: 'Petaling Jaya' },
        affectedCount: 42,
        evidenceCount: 4,
        occurrenceCount: 2,
        isRecurring: false,
        status: 'MARKED_RESOLVED',
        communityVerificationRate: 75,
        timeline: [
            { date: '25 Sep', title: 'Reported by community' },
            { date: '28 Sep', title: 'PBT completed cleaning' },
            { date: '30 Sep', title: 'Marked resolved by local council' }
        ],
        images: ['https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=500&auto=format&fit=crop'],
        createdAt: '2026-09-25'
    },
    {
        id: 'CIV-2026-003882',
        title: 'Streetlight Bulb Replacement',
        category: 'LIGHTING',
        description: 'Replaced malfunctioning LED streetlight lamp near traffic junction.',
        location: { lat: 3.1210, lng: 101.6250, address: 'SS2 Junction', neighborhood: 'Petaling Jaya' },
        affectedCount: 15,
        evidenceCount: 2,
        occurrenceCount: 1,
        isRecurring: false,
        status: 'MARKED_RESOLVED',
        communityVerificationRate: 92,
        timeline: [
            { date: '20 Sep', title: 'Reported by Citizen' },
            { date: '22 Sep', title: 'PBT maintenance completed' }
        ],
        images: ['https://images.unsplash.com/photo-1509114397022-ed747cca3f65?w=500&auto=format&fit=crop'],
        createdAt: '2026-09-20'
    }
];
function loadDb() {
    try {
        if (fs_1.default.existsSync(DB_FILE)) {
            const content = fs_1.default.readFileSync(DB_FILE, 'utf-8');
            return JSON.parse(content);
        }
    }
    catch (err) {
        console.error('Error reading db file, re-initializing:', err);
    }
    const defaultState = {
        issues: INITIAL_ISSUES,
        reports: [],
        verifications: [],
        endorsedSet: []
    };
    saveDb(defaultState);
    return defaultState;
}
function saveDb(data) {
    try {
        fs_1.default.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    }
    catch (err) {
        console.error('Error saving db file:', err);
    }
}
// ── ROUTES ──
// GET all community issues
app.get('/api/issues', (req, res) => {
    const db = loadDb();
    res.json({ success: true, data: db.issues });
});
// GET single community issue
app.get('/api/issues/:id', (req, res) => {
    const db = loadDb();
    const issue = db.issues.find(i => i.id === req.params.id);
    if (!issue)
        return res.status(404).json({ success: false, error: 'Issue not found' });
    res.json({ success: true, data: issue });
});
// POST new citizen report & group/recurrence checking
app.post('/api/reports', (req, res) => {
    const db = loadDb();
    const { title, category, description, location, images, reporterId } = req.body;
    if (!title || !category || !location) {
        return res.status(400).json({ success: false, error: 'Missing required report fields' });
    }
    const newReportId = `REP-${Date.now().toString().slice(-6)}`;
    const submittedAt = new Date().toISOString().split('T')[0];
    const newReport = {
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
    db.reports.push(newReport);
    // 1. Check if report can be grouped into an active existing issue (same category within 150m)
    let matchedGroupIssue;
    for (const existing of db.issues) {
        if (existing.status !== 'COMMUNITY_VERIFIED' && existing.status !== 'MARKED_RESOLVED') {
            if (existing.category === newReport.category) {
                const dist = (0, shared_types_1.calculateDistanceMeters)(newReport.location.lat, newReport.location.lng, existing.location.lat, existing.location.lng);
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
        saveDb(db);
        return res.json({
            success: true,
            action: 'GROUPED',
            issue: matchedGroupIssue,
            report: newReport
        });
    }
    // 2. Check for recurrence against past resolved issues
    const resolvedIssues = db.issues.filter(i => i.status === 'COMMUNITY_VERIFIED' || i.status === 'MARKED_RESOLVED');
    const recurrenceMatch = (0, shared_types_1.checkPotentialRecurrence)({
        lat: newReport.location.lat,
        lng: newReport.location.lng,
        category: newReport.category,
        submittedAt: newReport.submittedAt
    }, resolvedIssues, 200, 90);
    const isRecurring = Boolean(recurrenceMatch);
    const newIssueId = `CIV-2026-${Date.now().toString().slice(-6)}`;
    const createdIssue = {
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
app.post('/api/issues/:id/endorse', (req, res) => {
    const db = loadDb();
    const issueId = req.params.id;
    const residentId = req.body.residentId || 'RESIDENT-CA-01';
    const issue = db.issues.find(i => i.id === issueId);
    if (!issue)
        return res.status(404).json({ success: false, error: 'Issue not found' });
    const endorsedSet = new Set(db.endorsedSet);
    const result = (0, shared_types_1.registerAffectedEndorsement)(issue, residentId, endorsedSet);
    if (!result.wasIncremented) {
        return res.json({ success: true, message: 'Already endorsed by this resident', issue });
    }
    db.endorsedSet = Array.from(endorsedSet);
    Object.assign(issue, result.updatedIssue);
    saveDb(db);
    res.json({ success: true, message: 'Endorsement registered', issue });
});
// POST verification vote: FIXED | PARTIAL | NOT_FIXED
app.post('/api/issues/:id/verify', (req, res) => {
    const db = loadDb();
    const issueId = req.params.id;
    const { verdict, residentId } = req.body;
    const currentResident = residentId || 'RESIDENT-CA-01';
    if (!['FIXED', 'PARTIAL', 'NOT_FIXED'].includes(verdict)) {
        return res.status(400).json({ success: false, error: 'Invalid verification verdict' });
    }
    const issue = db.issues.find(i => i.id === issueId);
    if (!issue)
        return res.status(404).json({ success: false, error: 'Issue not found' });
    // Update or add feedback
    const existingIdx = db.verifications.findIndex(v => v.issueId === issueId && v.residentId === currentResident);
    const feedbackRecord = {
        id: `VF-${Date.now()}`,
        issueId,
        residentId: currentResident,
        verdict,
        submittedAt: new Date().toISOString()
    };
    if (existingIdx >= 0) {
        db.verifications[existingIdx] = feedbackRecord;
    }
    else {
        db.verifications.push(feedbackRecord);
    }
    // Evaluate with multi-vote quorum safeguards (threshold = 3)
    const issueFeedbacks = db.verifications.filter(v => v.issueId === issueId);
    const evaluation = (0, shared_types_1.evaluateVerificationResolution)(issueFeedbacks, 3);
    issue.communityVerificationRate = evaluation.verificationRate;
    issue.status = evaluation.statusRecommendation;
    issue.verificationCounts = {
        fixed: evaluation.fixedCount,
        partial: evaluation.partialCount,
        notFixed: evaluation.notFixedCount
    };
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
app.patch('/api/issues/:id/status', (req, res) => {
    const db = loadDb();
    const issue = db.issues.find(i => i.id === req.params.id);
    if (!issue)
        return res.status(404).json({ success: false, error: 'Issue not found' });
    const { status, title, note } = req.body;
    if (status)
        issue.status = status;
    if (title || note) {
        issue.timeline.push({
            date: 'Today',
            title: title || `Status updated to ${status}`,
            description: note
        });
    }
    saveDb(db);
    res.json({ success: true, data: issue });
});
// GET notifications
app.get('/api/notifications', (req, res) => {
    const db = loadDb();
    const notifications = [
        {
            id: 'notif-1',
            title: 'Action Update: Section 17 Drain',
            message: 'MBPJ Engineering dispatched a cleaning crew to Jalan 17/5.',
            time: '15m ago',
            read: false,
            type: 'dispatch'
        },
        {
            id: 'notif-2',
            title: 'Quorum Reached for Road Defect',
            message: 'CIV-2026-004282 reached 18 affected endorsements.',
            time: '1h ago',
            read: false,
            type: 'endorsement'
        },
        {
            id: 'notif-3',
            title: 'Verification Open',
            message: 'CIV-2026-003910 marked resolved. Verification votes are now active.',
            time: '3h ago',
            read: true,
            type: 'verify'
        }
    ];
    res.json({ success: true, data: notifications });
});
// POST inter-agency comment
app.post('/api/issues/:id/comments', (req, res) => {
    const db = loadDb();
    const issue = db.issues.find(i => i.id === req.params.id);
    if (!issue)
        return res.status(404).json({ success: false, error: 'Issue not found' });
    const { author, agency, text } = req.body;
    if (!text)
        return res.status(400).json({ success: false, error: 'Comment text required' });
    if (!issue.internalComments)
        issue.internalComments = [];
    const newComment = {
        id: `comm-${Date.now()}`,
        author: author || 'Admin Officer',
        agency: agency || 'MBPJ',
        text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    issue.internalComments.push(newComment);
    saveDb(db);
    res.json({ success: true, data: newComment, issue });
});
// POST handover jurisdiction
app.post('/api/issues/:id/handover', (req, res) => {
    const db = loadDb();
    const issue = db.issues.find(i => i.id === req.params.id);
    if (!issue)
        return res.status(404).json({ success: false, error: 'Issue not found' });
    const { leadAgency, supportingAgency, notes } = req.body;
    if (!leadAgency)
        return res.status(400).json({ success: false, error: 'Target agency required' });
    const prevAgency = issue.leadAgency || 'MBPJ Engineering';
    issue.leadAgency = leadAgency;
    if (supportingAgency)
        issue.supportingAgency = supportingAgency;
    issue.timeline.push({
        date: 'Today',
        title: `Jurisdiction handed over from ${prevAgency} to ${leadAgency}`,
        description: notes || 'Reassigned in accordance with statutory jurisdiction guidelines.'
    });
    saveDb(db);
    res.json({ success: true, data: issue });
});
// POST dispatch field auditor
app.post('/api/issues/:id/audit-dispatch', (req, res) => {
    const db = loadDb();
    const issue = db.issues.find(i => i.id === req.params.id);
    if (!issue)
        return res.status(404).json({ success: false, error: 'Issue not found' });
    issue.status = 'IN_PROGRESS';
    issue.timeline.push({
        date: 'Today',
        title: 'Field Auditor Dispatched',
        description: 'Senior municipal inspector dispatched to perform on-site physical audit.'
    });
    saveDb(db);
    res.json({ success: true, data: issue, message: 'Field auditor successfully dispatched.' });
});
// POST reject resolution / withhold sign-off
app.post('/api/issues/:id/reject-resolution', (req, res) => {
    const db = loadDb();
    const issue = db.issues.find(i => i.id === req.params.id);
    if (!issue)
        return res.status(404).json({ success: false, error: 'Issue not found' });
    issue.status = 'IN_PROGRESS';
    issue.timeline.push({
        date: 'Today',
        title: 'Resolution Sign-Off Withheld / Rejected',
        description: req.body.reason || 'Contractor resolution rejected due to community dispute or incomplete repair.'
    });
    saveDb(db);
    res.json({ success: true, data: issue, message: 'Sign-off withheld. Case reopened as In-Progress.' });
});
// POST force close with justification
app.post('/api/issues/:id/force-close', (req, res) => {
    const db = loadDb();
    const issue = db.issues.find(i => i.id === req.params.id);
    if (!issue)
        return res.status(404).json({ success: false, error: 'Issue not found' });
    const { reason, adminBadge } = req.body;
    issue.status = 'MARKED_RESOLVED';
    issue.timeline.push({
        date: 'Today',
        title: `Case Force-Closed by Admin (${adminBadge || 'ADM-001'})`,
        description: reason || 'Administrative override applied with formal justification.'
    });
    saveDb(db);
    res.json({ success: true, data: issue, message: 'Issue force-closed and archived.' });
});
// POST convert social signal to new issue
app.post('/api/signals/convert', (req, res) => {
    const db = loadDb();
    const { title, category, description, platform, handle } = req.body;
    const newIssueId = `CIV-2026-${Date.now().toString().slice(-6)}`;
    const submittedAt = new Date().toISOString().split('T')[0];
    const createdIssue = {
        id: newIssueId,
        title: title || 'Social Signal Alert',
        category: category || 'ROADS',
        description: `${description || ''} (Converted from ${platform || 'Social'} by ${handle || 'Citizen'})`,
        location: {
            lat: 3.1205,
            lng: 101.6260,
            address: 'Petaling Jaya Municipal Area',
            neighborhood: 'Petaling Jaya'
        },
        reportCount: 1,
        affectedCount: 5,
        evidenceCount: 1,
        occurrenceCount: 1,
        isRecurring: false,
        status: 'REPORTED',
        timeline: [
            { date: 'Today', title: `Ingested from ${platform || 'Social Media'} signal` }
        ],
        images: ['https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=500&auto=format&fit=crop'],
        createdAt: submittedAt
    };
    db.issues.unshift(createdIssue);
    saveDb(db);
    res.json({ success: true, data: createdIssue });
});
app.listen(PORT, () => {
    console.log(`CivicPulse Backend & Database Server running at http://localhost:${PORT}`);
});
