-- ============================================
-- Nyabihu Christian Academy (NCA)
-- Online Admission Portal — Complete Database Schema
-- Run this entire script in Supabase SQL Editor
-- ============================================

-- ====== 1. ADMISSIONS TABLE ======
CREATE TABLE IF NOT EXISTS admissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  app_number TEXT,
  child_full_name TEXT NOT NULL,
  gender TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  applying_class TEXT NOT NULL DEFAULT 'Nursery One (Baby Class)',
  father_full_name TEXT,
  father_national_id TEXT,
  father_phone TEXT,
  mother_full_name TEXT,
  mother_national_id TEXT,
  mother_phone TEXT,
  province TEXT,
  district TEXT,
  sector TEXT,
  cell TEXT,
  village TEXT,
  birth_certificate_name TEXT,
  birth_certificate_data TEXT,
  status TEXT NOT NULL DEFAULT 'Pending',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ====== 2. COMMUNICATION TABLES ======
CREATE TABLE IF NOT EXISTS announcements (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  category TEXT DEFAULT 'General',
  priority TEXT DEFAULT 'Medium',
  target_audience TEXT DEFAULT 'All',
  publish_date TIMESTAMPTZ,
  expiry_date TIMESTAMPTZ,
  status TEXT DEFAULT 'Draft',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  application_id UUID REFERENCES admissions(id) ON DELETE CASCADE,
  sender TEXT NOT NULL CHECK (sender IN ('admin', 'parent')),
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS status_history (
  id TEXT PRIMARY KEY,
  application_id UUID,
  old_status TEXT,
  new_status TEXT,
  changed_by TEXT DEFAULT 'Administrator',
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ====== 3. AUTO-GENERATE APPLICATION NUMBER ======
-- Generates formatted numbers like NCA-2026-0001
CREATE SEQUENCE IF NOT EXISTS app_number_seq START 1;

CREATE OR REPLACE FUNCTION generate_app_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.app_number IS NULL THEN
    NEW.app_number := 'NCA-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(NEXTVAL('app_number_seq')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_generate_app_number ON admissions;
CREATE TRIGGER trg_generate_app_number
  BEFORE INSERT ON admissions
  FOR EACH ROW
  EXECUTE FUNCTION generate_app_number();

-- ====== 4. ROW LEVEL SECURITY ======
ALTER TABLE admissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE status_history ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid duplicates
DROP POLICY IF EXISTS "admissions_insert" ON admissions;
DROP POLICY IF EXISTS "admissions_select" ON admissions;
DROP POLICY IF EXISTS "admissions_update" ON admissions;
DROP POLICY IF EXISTS "admissions_delete" ON admissions;

DROP POLICY IF EXISTS "announcements_insert" ON announcements;
DROP POLICY IF EXISTS "announcements_select" ON announcements;
DROP POLICY IF EXISTS "announcements_update" ON announcements;
DROP POLICY IF EXISTS "announcements_delete" ON announcements;

DROP POLICY IF EXISTS "messages_insert" ON messages;
DROP POLICY IF EXISTS "messages_select" ON messages;
DROP POLICY IF EXISTS "messages_update" ON messages;
DROP POLICY IF EXISTS "messages_delete" ON messages;

DROP POLICY IF EXISTS "status_history_insert" ON status_history;
DROP POLICY IF EXISTS "status_history_select" ON status_history;
DROP POLICY IF EXISTS "status_history_update" ON status_history;
DROP POLICY IF EXISTS "status_history_delete" ON status_history;

-- Admissions policies
CREATE POLICY "admissions_insert" ON admissions FOR INSERT WITH CHECK (true);
CREATE POLICY "admissions_select" ON admissions FOR SELECT USING (true);
CREATE POLICY "admissions_update" ON admissions FOR UPDATE USING (true);
CREATE POLICY "admissions_delete" ON admissions FOR DELETE USING (true);

-- Announcements policies
CREATE POLICY "announcements_insert" ON announcements FOR INSERT WITH CHECK (true);
CREATE POLICY "announcements_select" ON announcements FOR SELECT USING (true);
CREATE POLICY "announcements_update" ON announcements FOR UPDATE USING (true);
CREATE POLICY "announcements_delete" ON announcements FOR DELETE USING (true);

-- Messages policies
CREATE POLICY "messages_insert" ON messages FOR INSERT WITH CHECK (true);
CREATE POLICY "messages_select" ON messages FOR SELECT USING (true);
CREATE POLICY "messages_update" ON messages FOR UPDATE USING (true);
CREATE POLICY "messages_delete" ON messages FOR DELETE USING (true);

-- Status history policies
CREATE POLICY "status_history_insert" ON status_history FOR INSERT WITH CHECK (true);
CREATE POLICY "status_history_select" ON status_history FOR SELECT USING (true);
CREATE POLICY "status_history_update" ON status_history FOR UPDATE USING (true);
CREATE POLICY "status_history_delete" ON status_history FOR DELETE USING (true);
