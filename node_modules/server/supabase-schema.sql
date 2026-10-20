-- =========================================================================
-- CivicPulse Supabase Cloud Database Schema
-- Run this script in your Supabase project's SQL Editor (Dashboard > SQL Editor)
-- =========================================================================

-- 1. COMMUNITY ISSUES TABLE
CREATE TABLE IF NOT EXISTS public.issues (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT DEFAULT '',
  location JSONB NOT NULL,
  report_count INT DEFAULT 1,
  affected_count INT DEFAULT 1,
  evidence_count INT DEFAULT 0,
  occurrence_count INT DEFAULT 1,
  is_recurring BOOLEAN DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'REPORTED',
  timeline JSONB DEFAULT '[]'::jsonb,
  images JSONB DEFAULT '[]'::jsonb,
  community_verification_rate NUMERIC DEFAULT NULL,
  verification_counts JSONB DEFAULT '{"fixed": 0, "partial": 0, "notFixed": 0}'::jsonb,
  internal_comments JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. CITIZEN INDIVIDUAL REPORTS TABLE
CREATE TABLE IF NOT EXISTS public.reports (
  id TEXT PRIMARY KEY,
  issue_id TEXT REFERENCES public.issues(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT DEFAULT '',
  location JSONB NOT NULL,
  photos JSONB DEFAULT '[]'::jsonb,
  reporter_identifier TEXT DEFAULT 'ANON',
  submitted_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CITIZEN VERIFICATION VOTES TABLE
CREATE TABLE IF NOT EXISTS public.verifications (
  id TEXT PRIMARY KEY,
  issue_id TEXT NOT NULL,
  resident_id TEXT NOT NULL,
  verdict TEXT NOT NULL CHECK (verdict IN ('FIXED', 'PARTIAL', 'NOT_FIXED')),
  feedback_notes TEXT,
  evidence_photo TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. ENDORSEMENTS ("I'm Affected Too") TABLE (Anti-duplicate tracking)
CREATE TABLE IF NOT EXISTS public.endorsements (
  id SERIAL PRIMARY KEY,
  issue_id TEXT NOT NULL,
  resident_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(issue_id, resident_id)
);

-- 5. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  time TEXT DEFAULT 'Just now',
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. AI SOCIAL SIGNALS TABLE
CREATE TABLE IF NOT EXISTS public.signals (
  id SERIAL PRIMARY KEY,
  platform TEXT NOT NULL,
  handle TEXT NOT NULL,
  text TEXT NOT NULL,
  sentiment TEXT NOT NULL,
  ai_match TEXT NOT NULL,
  time TEXT DEFAULT 'Just now',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS) on all tables and grant public access for demo
ALTER TABLE public.issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.endorsements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to issues" ON public.issues FOR SELECT USING (true);
CREATE POLICY "Allow public insert/update to issues" ON public.issues FOR ALL USING (true);

CREATE POLICY "Allow public read access to reports" ON public.reports FOR SELECT USING (true);
CREATE POLICY "Allow public insert to reports" ON public.reports FOR ALL USING (true);

CREATE POLICY "Allow public read access to verifications" ON public.verifications FOR SELECT USING (true);
CREATE POLICY "Allow public insert to verifications" ON public.verifications FOR ALL USING (true);

CREATE POLICY "Allow public read access to endorsements" ON public.endorsements FOR SELECT USING (true);
CREATE POLICY "Allow public insert to endorsements" ON public.endorsements FOR ALL USING (true);

CREATE POLICY "Allow public read access to notifications" ON public.notifications FOR SELECT USING (true);
CREATE POLICY "Allow public insert/update to notifications" ON public.notifications FOR ALL USING (true);

CREATE POLICY "Allow public read access to signals" ON public.signals FOR SELECT USING (true);
CREATE POLICY "Allow public insert/delete to signals" ON public.signals FOR ALL USING (true);
