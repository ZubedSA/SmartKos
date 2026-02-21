-- ============================================
-- Update: Add WhatsApp API Settings to Users
-- ============================================

-- Tambahkan kolom wa_api_key dan wa_auto_reminder_enabled ke tabel users
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS wa_api_key TEXT,
ADD COLUMN IF NOT EXISTS wa_auto_reminder_enabled BOOLEAN DEFAULT FALSE;

-- Berikan komentar pada kolom untuk dokumentasi
COMMENT ON COLUMN users.wa_api_key IS 'Token API untuk layanan WhatsApp Gateway (misal: Fonnte)';
COMMENT ON COLUMN users.wa_auto_reminder_enabled IS 'Status apakah pengingat otomatis diaktifkan';
