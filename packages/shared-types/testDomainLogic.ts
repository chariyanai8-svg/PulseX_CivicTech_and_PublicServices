import { 
  CommunityIssue, 
  VerificationFeedback, 
  checkPotentialRecurrence, 
  evaluateVerificationResolution, 
  registerAffectedEndorsement 
} from './index';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

console.log('Running CivicPulse Domain Logic Tests...\n');

// ── Test 1: Affected Counts & User Deduplication ──
console.log('Test 1: Affected Counts & User Deduplication');
const testIssue1: CommunityIssue = {
  id: 'CIV-TEST-001',
  title: 'Pothole at SS2',
  category: 'ROADS',
  description: 'Deep road cavity',
  location: { lat: 3.1200, lng: 101.6200, address: 'Jalan SS2/1', neighborhood: 'SS2' },
  reportCount: 1,
  affectedCount: 10,
  evidenceCount: 2,
  occurrenceCount: 1,
  isRecurring: false,
  status: 'REPORTED',
  timeline: [],
  images: [],
  createdAt: '2026-10-01'
};

const userEndorsedSet = new Set<string>();

// User 1 endorses for the first time
const result1 = registerAffectedEndorsement(testIssue1, 'USER_001', userEndorsedSet);
assert(result1.wasIncremented === true, 'First endorsement must increment count');
assert(result1.updatedIssue.affectedCount === 11, 'Affected count must equal 11');

// User 1 tries to endorse again (duplicate click)
const result2 = registerAffectedEndorsement(result1.updatedIssue, 'USER_001', userEndorsedSet);
assert(result2.wasIncremented === false, 'Duplicate endorsement must not increment count');
assert(result2.updatedIssue.affectedCount === 11, 'Affected count must remain 11');

// User 2 endorses (different user)
const result3 = registerAffectedEndorsement(result2.updatedIssue, 'USER_002', userEndorsedSet);
assert(result3.wasIncremented === true, 'Distinct user endorsement must increment count');
assert(result3.updatedIssue.affectedCount === 12, 'Affected count must equal 12');
console.log('  ✓ User deduplication works as expected.\n');

// ── Test 2: Recurrence Detection ──
console.log('Test 2: Recurrence Detection');
const resolvedDrainIssue: CommunityIssue = {
  id: 'CIV-RESOLVED-101',
  title: 'Clogged Drain Cleared',
  category: 'DRAINAGE',
  description: 'Drain cleared by contractor',
  location: { lat: 3.1188, lng: 101.6235, address: 'Jalan 17/5', neighborhood: 'Section 17' },
  affectedCount: 30,
  evidenceCount: 3,
  occurrenceCount: 1,
  isRecurring: false,
  status: 'MARKED_RESOLVED',
  timeline: [],
  images: [],
  createdAt: '2026-09-01'
};

// Case A: New drain report within 50 meters of resolved issue (recurrence)
const newReportNear = {
  lat: 3.1189,
  lng: 101.6236,
  category: 'DRAINAGE',
  submittedAt: '2026-10-15'
};
const recurrenceA = checkPotentialRecurrence(newReportNear, [resolvedDrainIssue], 150, 180);
assert(recurrenceA !== null, 'Should detect recurrence for nearby report with same category');
assert(recurrenceA?.previousIssueId === 'CIV-RESOLVED-101', 'Should link to the previous resolved issue');
assert(recurrenceA!.locationProximityMeters < 50, 'Distance should be under 50m');

// Case B: Different category at same location (e.g. LIGHTING near DRAINAGE)
const differentCategoryReport = {
  lat: 3.1189,
  lng: 101.6236,
  category: 'LIGHTING',
  submittedAt: '2026-10-15'
};
const recurrenceB = checkPotentialRecurrence(differentCategoryReport, [resolvedDrainIssue], 150, 180);
assert(recurrenceB === null, 'Different category must not trigger recurrence link');

// Case C: Far away location (e.g. 5km away)
const farAwayReport = {
  lat: 3.1600,
  lng: 101.6800,
  category: 'DRAINAGE',
  submittedAt: '2026-10-15'
};
const recurrenceC = checkPotentialRecurrence(farAwayReport, [resolvedDrainIssue], 150, 180);
assert(recurrenceC === null, 'Far away report must not trigger recurrence link');
console.log('  ✓ Recurrence spatial-temporal rules verified.\n');

// ── Test 3: Resolution Verification Safeguards & Quorum ──
console.log('Test 3: Resolution Verification Safeguards');

// Case A: 1 negative vote (below quorum of 3) must NOT unilaterally trigger DISPUTED
const singleVote: VerificationFeedback[] = [
  { id: 'v1', issueId: 'CIV-TEST', residentId: 'r1', verdict: 'NOT_FIXED', submittedAt: '2026-10-19' }
];
const evalSingle = evaluateVerificationResolution(singleVote, 3);
assert(evalSingle.hasMetQuorum === false, '1 vote does not meet quorum');
assert(evalSingle.isDisputed === false, 'Single vote must NOT trigger DISPUTED');
assert(evalSingle.statusRecommendation === 'MARKED_RESOLVED', 'Status remains MARKED_RESOLVED below quorum');

// Case B: 3 negative votes (quorum met) transitions to DISPUTED
const quorumDispute: VerificationFeedback[] = [
  { id: 'v1', issueId: 'CIV-TEST', residentId: 'r1', verdict: 'NOT_FIXED', submittedAt: '2026-10-19' },
  { id: 'v2', issueId: 'CIV-TEST', residentId: 'r2', verdict: 'NOT_FIXED', submittedAt: '2026-10-19' },
  { id: 'v3', issueId: 'CIV-TEST', residentId: 'r3', verdict: 'PARTIAL', submittedAt: '2026-10-19' }
];
const evalDispute = evaluateVerificationResolution(quorumDispute, 3);
assert(evalDispute.hasMetQuorum === true, '3 votes meets quorum');
assert(evalDispute.isDisputed === true, 'Low score with quorum triggers DISPUTED');
assert(evalDispute.statusRecommendation === 'DISPUTED', 'Status recommendation must be DISPUTED');

// Case C: 3 positive votes (quorum met) transitions to COMMUNITY_VERIFIED
const quorumApproved: VerificationFeedback[] = [
  { id: 'v1', issueId: 'CIV-TEST', residentId: 'r1', verdict: 'FIXED', submittedAt: '2026-10-19' },
  { id: 'v2', issueId: 'CIV-TEST', residentId: 'r2', verdict: 'FIXED', submittedAt: '2026-10-19' },
  { id: 'v3', issueId: 'CIV-TEST', residentId: 'r3', verdict: 'FIXED', submittedAt: '2026-10-19' }
];
const evalApproved = evaluateVerificationResolution(quorumApproved, 3);
assert(evalApproved.hasMetQuorum === true, 'Quorum met');
assert(evalApproved.verificationRate === 100, 'Verification rate should be 100%');
assert(evalApproved.statusRecommendation === 'COMMUNITY_VERIFIED', 'Status should be COMMUNITY_VERIFIED');
console.log('  ✓ Verification quorum and anti-unilateral dispute rules verified.\n');

// ── Test 4: Extended Edge Cases ──
console.log('Test 4: Extended Edge Cases');

// Edge Case A: Recurrence outside time window (e.g. 250 days ago)
const oldResolvedIssue: CommunityIssue = {
  ...resolvedDrainIssue,
  id: 'CIV-OLD-999',
  createdAt: '2025-01-01'
};
const recurrenceOld = checkPotentialRecurrence(newReportNear, [oldResolvedIssue], 150, 180);
assert(recurrenceOld === null, 'Issues older than 180 days must not trigger automatic recurrence');

// Edge Case B: Recurrence boundary distance (e.g. 151m vs 149m)
// 0.00135 degrees lat is approximately 150 meters
const justOutsideBoundary = {
  lat: resolvedDrainIssue.location.lat + 0.0018, // ~200m
  lng: resolvedDrainIssue.location.lng,
  category: 'DRAINAGE',
  submittedAt: '2026-10-15'
};
const recurrenceOutside = checkPotentialRecurrence(justOutsideBoundary, [resolvedDrainIssue], 150, 180);
assert(recurrenceOutside === null, 'Report outside 150m radius must not trigger recurrence');

// Edge Case C: Zero verification votes
const emptyVotes: VerificationFeedback[] = [];
const evalEmpty = evaluateVerificationResolution(emptyVotes, 3);
assert(evalEmpty.verificationRate === 0, 'Zero votes must yield 0 rate');
assert(evalEmpty.hasMetQuorum === false, 'Zero votes does not meet quorum');
assert(evalEmpty.statusRecommendation === 'MARKED_RESOLVED', 'Status remains unchanged when no votes cast');

// Edge Case D: Repeated endorsement by multiple residents
const multiEndorseIssue: CommunityIssue = { ...testIssue1, affectedCount: 5 };
const tracker = new Set<string>();
registerAffectedEndorsement(multiEndorseIssue, 'R1', tracker);
registerAffectedEndorsement(multiEndorseIssue, 'R1', tracker); // dupe
registerAffectedEndorsement(multiEndorseIssue, 'R2', tracker);
registerAffectedEndorsement(multiEndorseIssue, 'R2', tracker); // dupe
registerAffectedEndorsement(multiEndorseIssue, 'R3', tracker);
assert(tracker.size === 3, 'Tracker must contain exactly 3 unique resident endorsements');
console.log('  ✓ Edge cases (time window, distance threshold, zero votes, multi-resident dupe) verified.\n');

console.log('All tests passed successfully!');

