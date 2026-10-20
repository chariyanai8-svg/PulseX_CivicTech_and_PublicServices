import path from 'path';
import dotenv from 'dotenv';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { CommunityIssue, CitizenReport, VerificationFeedback } from '../../../packages/shared-types';

let supabaseClient: SupabaseClient | null = null;

export function initSupabase(): SupabaseClient | null {
  if (!process.env.SUPABASE_URL) {
    dotenv.config({ path: path.join(__dirname, '..', '.env') });
    dotenv.config({ path: path.join(process.cwd(), '.env') });
  }

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (url && key && url.startsWith('http')) {
    try {
      supabaseClient = createClient(url, key);
      return supabaseClient;
    } catch (err) {
      console.error('[Supabase] Failed to initialize client:', err);
    }
  }
  return null;
}

export function isSupabaseConfigured(): boolean {
  if (!supabaseClient) {
    initSupabase();
  }
  return Boolean(supabaseClient);
}

// ── TRANSFORMERS ──
function toDbIssue(issue: CommunityIssue & { internalComments?: any[] }) {
  return {
    id: issue.id,
    title: issue.title,
    category: issue.category,
    description: issue.description || '',
    location: issue.location,
    report_count: issue.reportCount || 1,
    affected_count: issue.affectedCount || 1,
    evidence_count: issue.evidenceCount || 0,
    occurrence_count: issue.occurrenceCount || 1,
    is_recurring: Boolean(issue.isRecurring),
    status: issue.status,
    timeline: issue.timeline || [],
    images: issue.images || [],
    community_verification_rate: issue.communityVerificationRate ?? null,
    verification_counts: issue.verificationCounts || { fixed: 0, partial: 0, notFixed: 0 },
    internal_comments: issue.internalComments || [],
    created_at: issue.createdAt || new Date().toISOString(),
    last_updated_at: new Date().toISOString()
  };
}

function fromDbIssue(row: any): CommunityIssue & { internalComments?: any[] } {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    description: row.description || '',
    location: row.location || { lat: 3.1186, lng: 101.6231, address: 'Petaling Jaya', neighborhood: 'Petaling Jaya' },
    reportCount: row.report_count || 1,
    affectedCount: row.affected_count || 1,
    evidenceCount: row.evidence_count || 0,
    occurrenceCount: row.occurrence_count || 1,
    isRecurring: Boolean(row.is_recurring),
    status: row.status,
    timeline: row.timeline || [],
    images: row.images || [],
    communityVerificationRate: row.community_verification_rate ? Number(row.community_verification_rate) : undefined,
    verificationCounts: row.verification_counts || { fixed: 0, partial: 0, notFixed: 0 },
    internalComments: row.internal_comments || [],
    createdAt: typeof row.created_at === 'string' ? row.created_at.split('T')[0] : '2026-10-20'
  };
}

// ── CLOUD OPERATIONS ──

export async function getSupabaseIssues(): Promise<CommunityIssue[]> {
  if (!supabaseClient) return [];
  const { data, error } = await supabaseClient
    .from('issues')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[Supabase] Error fetching issues:', error.message);
    return [];
  }
  return (data || []).map(fromDbIssue);
}

export async function upsertSupabaseIssue(issue: CommunityIssue & { internalComments?: any[] }): Promise<boolean> {
  if (!supabaseClient) return false;
  const dbRecord = toDbIssue(issue);
  const { error } = await supabaseClient
    .from('issues')
    .upsert(dbRecord);

  if (error) {
    console.error('[Supabase] Error upserting issue:', error.message);
    return false;
  }
  return true;
}

export async function insertSupabaseReport(report: CitizenReport): Promise<boolean> {
  if (!supabaseClient) return false;
  const { error } = await supabaseClient
    .from('reports')
    .insert({
      id: report.id,
      issue_id: report.issueId || null,
      title: report.title,
      category: report.category,
      description: report.description || '',
      location: report.location,
      photos: report.photos || [],
      reporter_identifier: report.reporterIdentifier || 'ANON',
      submitted_at: report.submittedAt || new Date().toISOString()
    });

  if (error) {
    console.error('[Supabase] Error inserting report:', error.message);
    return false;
  }
  return true;
}

export async function insertSupabaseVerification(feedback: VerificationFeedback): Promise<boolean> {
  if (!supabaseClient) return false;
  const { error } = await supabaseClient
    .from('verifications')
    .upsert({
      id: feedback.id,
      issue_id: feedback.issueId,
      resident_id: feedback.residentId,
      verdict: feedback.verdict,
      feedback_notes: feedback.feedbackNotes || null,
      evidence_photo: feedback.evidencePhoto || null,
      submitted_at: feedback.submittedAt || new Date().toISOString()
    });

  if (error) {
    console.error('[Supabase] Error inserting verification:', error.message);
    return false;
  }
  return true;
}

export async function getSupabaseVerifications(issueId: string): Promise<VerificationFeedback[]> {
  if (!supabaseClient) return [];
  const { data, error } = await supabaseClient
    .from('verifications')
    .select('*')
    .eq('issue_id', issueId);

  if (error) {
    console.error('[Supabase] Error fetching verifications:', error.message);
    return [];
  }
  return (data || []).map((row: any) => ({
    id: row.id,
    issueId: row.issue_id,
    residentId: row.resident_id,
    verdict: row.verdict,
    feedbackNotes: row.feedback_notes,
    evidencePhoto: row.evidence_photo,
    submittedAt: row.submitted_at
  }));
}

export async function addSupabaseEndorsement(issueId: string, residentId: string): Promise<boolean> {
  if (!supabaseClient) return false;
  const { error } = await supabaseClient
    .from('endorsements')
    .insert({ issue_id: issueId, resident_id: residentId });

  if (error) {
    // Unique constraint violation means already endorsed
    return false;
  }
  return true;
}

export async function getSupabaseNotifications(): Promise<any[]> {
  if (!supabaseClient) return [];
  const { data, error } = await supabaseClient
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(30);

  if (error) {
    console.error('[Supabase] Error fetching notifications:', error.message);
    return [];
  }
  return (data || []).map((r: any) => ({
    id: r.id,
    title: r.title,
    message: r.message,
    time: r.time,
    read: r.read
  }));
}

export async function addSupabaseNotification(notif: { id: string; title: string; message: string; time: string; read: boolean }) {
  if (!supabaseClient) return;
  await supabaseClient.from('notifications').insert(notif);
}

export async function markAllSupabaseNotificationsRead() {
  if (!supabaseClient) return;
  await supabaseClient.from('notifications').update({ read: true }).eq('read', false);
}

export async function getSupabaseSignals(): Promise<any[]> {
  if (!supabaseClient) return [];
  const { data, error } = await supabaseClient
    .from('signals')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return [];
  return data || [];
}

export async function deleteSupabaseSignal(id: number) {
  if (!supabaseClient) return;
  await supabaseClient.from('signals').delete().eq('id', id);
}

export async function seedSupabaseIfEmpty(initialIssues: any[], initialSignals: any[], initialNotifs: any[]) {
  if (!supabaseClient) return;
  const { count } = await supabaseClient.from('issues').select('*', { count: 'exact', head: true });
  if (count === 0 || count === null) {
    console.log('[Supabase] Seeding initial data to empty cloud tables...');
    for (const issue of initialIssues) {
      await upsertSupabaseIssue(issue);
    }
    for (const signal of initialSignals) {
      await supabaseClient.from('signals').insert(signal);
    }
    for (const notif of initialNotifs) {
      await supabaseClient.from('notifications').insert(notif);
    }
    console.log('[Supabase] Seeding complete! Cloud database is ready.');
  }
}
