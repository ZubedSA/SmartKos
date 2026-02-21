-- ============================================
-- Update: Add WhatsApp API Settings to Users
-- ============================================

-- Tambahkan kolom wa_api_key, wa_auto_reminder_enabled, dan auto_generate_billing_enabled ke tabel users
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS wa_api_key TEXT,
ADD COLUMN IF NOT EXISTS wa_auto_reminder_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS auto_generate_billing_enabled BOOLEAN DEFAULT FALSE;

-- Berikan komentar pada kolom untuk dokumentasi
COMMENT ON COLUMN users.wa_api_key IS 'Token API untuk layanan WhatsApp Gateway (misal: Fonnte)';
COMMENT ON COLUMN users.wa_auto_reminder_enabled IS 'Status apakah pengingat otomatis diaktifkan';
COMMENT ON COLUMN users.auto_generate_billing_enabled IS 'Status apakah pembuatan tagihan otomatis diaktifkan';
