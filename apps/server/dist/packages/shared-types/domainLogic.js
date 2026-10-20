"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateDistanceMeters = calculateDistanceMeters;
exports.checkPotentialRecurrence = checkPotentialRecurrence;
exports.evaluateVerificationResolution = evaluateVerificationResolution;
exports.registerAffectedEndorsement = registerAffectedEndorsement;
/**
 * Calculates straight-line distance in meters between two lat/lng coordinates (Haversine formula).
 */
function calculateDistanceMeters(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Earth radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;
    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
}
/**
 * Recurrence detection: Checks if a newly reported issue is in close physical proximity
 * to a past resolved/closed issue of the same category, returning a RecurrenceLink if flagged.
 *
 * Thresholds: Default 150m radius, within 180 days of resolution.
 */
function checkPotentialRecurrence(newReport, pastResolvedIssues, maxDistanceMeters = 150, maxDays = 180) {
    for (const past of pastResolvedIssues) {
        if (past.category !== newReport.category)
            continue;
        // Only compare against previously resolved or community-verified issues
        if (past.status !== 'MARKED_RESOLVED' && past.status !== 'COMMUNITY_VERIFIED')
            continue;
        const distance = calculateDistanceMeters(newReport.lat, newReport.lng, past.location.lat, past.location.lng);
        if (distance <= maxDistanceMeters) {
            const pastTime = new Date(past.createdAt).getTime();
            const newTime = new Date(newReport.submittedAt).getTime();
            const daysDiff = Math.max(0, Math.round((newTime - pastTime) / (1000 * 60 * 60 * 24)));
            if (daysDiff <= maxDays) {
                return {
                    currentIssueId: '', // To be filled on creation
                    previousIssueId: past.id,
                    locationProximityMeters: distance,
                    timeSinceLastResolutionDays: daysDiff,
                    recurrenceReasonFlag: 'INCOMPLETE_REPAIR'
                };
            }
        }
    }
    return null;
}
/**
 * Evaluates resolution verification votes with safeguards:
 * - Minimum quorum of votes required before an automatic transition to DISPUTED (default 3 votes).
 * - A single voter cannot unilaterally overturn an issue into DISPUTED.
 * - Score is calculated: fixed=100%, partial=50%, notFixed=0%.
 * - If total verified votes >= minQuorum and score < 50%, transitions to DISPUTED.
 */
function evaluateVerificationResolution(feedbacks, minQuorum = 3) {
    const total = feedbacks.length;
    if (total === 0) {
        return {
            verificationRate: 0,
            fixedCount: 0,
            partialCount: 0,
            notFixedCount: 0,
            isDisputed: false,
            statusRecommendation: 'MARKED_RESOLVED',
            hasMetQuorum: false,
        };
    }
    let fixedCount = 0;
    let partialCount = 0;
    let notFixedCount = 0;
    for (const fb of feedbacks) {
        if (fb.verdict === 'FIXED')
            fixedCount++;
        else if (fb.verdict === 'PARTIAL')
            partialCount++;
        else if (fb.verdict === 'NOT_FIXED')
            notFixedCount++;
    }
    const score = Math.round(((fixedCount * 1.0 + partialCount * 0.5) / total) * 100);
    const hasMetQuorum = total >= minQuorum;
    // Safeguard: Single vote or small vote counts below quorum cannot force DISPUTED
    const isDisputed = hasMetQuorum && score < 50;
    const isVerified = hasMetQuorum && score >= 75;
    let statusRecommendation = 'MARKED_RESOLVED';
    if (isDisputed) {
        statusRecommendation = 'DISPUTED';
    }
    else if (isVerified) {
        statusRecommendation = 'COMMUNITY_VERIFIED';
    }
    return {
        verificationRate: score,
        fixedCount,
        partialCount,
        notFixedCount,
        isDisputed,
        statusRecommendation,
        hasMetQuorum,
    };
}
/**
 * Handles "I'm Affected Too" endorsement tracking per resident:
 * Prevents double-counting by the same user.
 */
function registerAffectedEndorsement(issue, residentId, userAffectedSet) {
    const endorsementKey = `${issue.id}::${residentId}`;
    if (userAffectedSet.has(endorsementKey)) {
        return { updatedIssue: issue, wasIncremented: false };
    }
    userAffectedSet.add(endorsementKey);
    const updatedIssue = {
        ...issue,
        affectedCount: issue.affectedCount + 1,
    };
    return { updatedIssue, wasIncremented: true };
}
