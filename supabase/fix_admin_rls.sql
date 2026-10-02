-- ==========================================================
-- SmartKos - Fix Admin RLS and CRUD Permissions
-- Skrip aman: Menghapus kebijakan lama sebelum membuat yang baru
-- ==========================================================

-- Pastikan tabel users memiliki RLS aktif
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 1. Drop semua kemungkinan kebijakan lama pada tabel users untuk mencegah error 42710
DROP POLICY IF EXISTS "Users can read own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Admin can read all users" ON users;
DROP POLICY IF EXISTS "Admin can update all users" ON users;
DROP POLICY IF EXISTS "Anyone can insert own user profile" ON users;
DROP POLICY IF EXISTS "Authenticated users can read users" ON users;
DROP POLICY IF EXISTS "Admin can delete all users" ON users;
DROP POLICY IF EXISTS "Admin can delete users" ON users;
DROP POLICY IF EXISTS "Admin can insert users" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Users and Admin can update profiles" ON users;

-- 2. Kebijakan SELECT (Baca data profil)
CREATE POLICY "Authenticated users can read users" ON users
  FOR SELECT TO authenticated
  USING (true);

-- 3. Kebijakan INSERT (User register profil mereka sendiri & Admin)
CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = id OR 
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  );

-- 4. Kebijakan UPDATE (User edit profil sendiri atau Admin update semua user)
CREATE POLICY "Users and Admin can update profiles" ON users
  FOR UPDATE TO authenticated
  USING (
    auth.uid() = id OR 
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  );

-- 5. Kebijakan DELETE (Admin bisa hapus user)
CREATE POLICY "Admin can delete users" ON users
  FOR DELETE TO authenticated
  USING (
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  );
