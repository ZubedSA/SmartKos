-- ============================================
-- FIX v2: Jalankan di Supabase SQL Editor
-- Memperbaiki semua RLS policies
-- ============================================

-- Hapus SEMUA policies pada table users
DROP POLICY IF EXISTS "Users can read own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Admin can read all users" ON users;
DROP POLICY IF EXISTS "Admin can update all users" ON users;
DROP POLICY IF EXISTS "Anyone can insert own user profile" ON users;

-- Buat policy yang simpel dan pasti jalan:

-- 1. Semua user yang login bisa baca data users (diperlukan untuk middleware & admin)
CREATE POLICY "Authenticated users can read users" ON users
  FOR SELECT TO authenticated
  USING (true);

-- 2. User bisa update profilenya sendiri
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE TO authenticated
  USING (auth.uid() = id);

-- 3. Admin bisa update semua user
CREATE POLICY "Admin can update all users" ON users
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- 4. User bisa insert profilenya sendiri saat register
CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);
