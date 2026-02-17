-- ============================================
-- MIGRATION: Multi-Tenant Kamar Support
-- Jalankan di Supabase SQL Editor
-- ============================================

-- 1. Drop existing CHECK constraint on kamar.status
ALTER TABLE kamar DROP CONSTRAINT IF EXISTS kamar_status_check;

-- 2. Set default value to 'Kosong' (text, not restricted)
ALTER TABLE kamar ALTER COLUMN status SET DEFAULT 'Kosong';

-- 3. Update existing data to format 'Kosong' / '1 Orang'
UPDATE kamar SET status = 'Kosong' WHERE status = 'kosong';
UPDATE kamar SET status = '1 Orang' WHERE status = 'isi';
