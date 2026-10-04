-- ============================================================
-- Update: Tambah Kolom Pengaturan Tahap Pengingat (H-3, Hari-H, Menunggak)
-- Jalankan query ini di Supabase SQL Editor jika diperlukan
-- ============================================================

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS wa_reminder_h3 BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS wa_reminder_hari_h BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS wa_reminder_overdue BOOLEAN DEFAULT TRUE;

COMMENT ON COLUMN users.wa_reminder_h3 IS 'Status aktif pengingat H-3 sebelum jatuh tempo';
COMMENT ON COLUMN users.wa_reminder_hari_h IS 'Status aktif pengingat hari-H jatuh tempo';
COMMENT ON COLUMN users.wa_reminder_overdue IS 'Status aktif pengingat tagihan menunggak (lewat jatuh tempo)';
