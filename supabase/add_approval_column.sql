-- Migrasi untuk menambah status persetujuan ke tabel users
-- Tambahkan kolom is_approved dengan default FALSE
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT FALSE;

-- Setujui semua user yang sudah ada saat ini
UPDATE users SET is_approved = TRUE WHERE is_approved IS FALSE;

-- Tambahkan policy agar admin tetap bisa melihat semua data (sudah ada di schema.sql tapi untuk memastikan)
-- DROP POLICY IF EXISTS "Admin can read all users" ON users;
-- CREATE POLICY "Admin can read all users" ON users
--   FOR SELECT USING (
--     EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
--   );
