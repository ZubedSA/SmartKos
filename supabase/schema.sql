-- ============================================
-- SmartKos - Database Schema
-- Run this SQL in Supabase SQL Editor
-- ============================================

-- 1. Table: users (profil user, terhubung dengan auth.users)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'owner' CHECK (role IN ('admin', 'owner')),
  subscription_status TEXT NOT NULL DEFAULT 'active' CHECK (subscription_status IN ('active', 'inactive')),
  subscription_expired_at DATE DEFAULT (CURRENT_DATE + INTERVAL '30 days'),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Table: kos
CREATE TABLE IF NOT EXISTS kos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  nama_kos TEXT NOT NULL,
  alamat TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Table: kamar
CREATE TABLE IF NOT EXISTS kamar (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kos_id UUID NOT NULL REFERENCES kos(id) ON DELETE CASCADE,
  nomor TEXT NOT NULL,
  harga BIGINT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'kosong' CHECK (status IN ('kosong', 'isi')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Table: penyewa
CREATE TABLE IF NOT EXISTS penyewa (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kamar_id UUID NOT NULL REFERENCES kamar(id) ON DELETE CASCADE,
  nama TEXT NOT NULL,
  no_hp TEXT,
  tanggal_masuk DATE DEFAULT CURRENT_DATE,
  jatuh_tempo INTEGER DEFAULT 1 CHECK (jatuh_tempo BETWEEN 1 AND 31),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Table: tagihan
CREATE TABLE IF NOT EXISTS tagihan (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  penyewa_id UUID NOT NULL REFERENCES penyewa(id) ON DELETE CASCADE,
  bulan TEXT NOT NULL,
  jumlah BIGINT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'belum' CHECK (status IN ('lunas', 'belum')),
  tanggal_kirim_wa TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Table: wa_templates
CREATE TABLE IF NOT EXISTS wa_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  isi_template TEXT NOT NULL DEFAULT 'Halo {nama}, ini adalah tagihan kos kamar {kamar} untuk bulan {bulan} sebesar Rp{jumlah}. Jatuh tempo tanggal {jatuh_tempo}. Terima kasih.',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Row Level Security (RLS)
-- ============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE kos ENABLE ROW LEVEL SECURITY;
ALTER TABLE kamar ENABLE ROW LEVEL SECURITY;
ALTER TABLE penyewa ENABLE ROW LEVEL SECURITY;
ALTER TABLE tagihan ENABLE ROW LEVEL SECURITY;
ALTER TABLE wa_templates ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can read own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admin can read all users" ON users
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admin can update all users" ON users
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Anyone can insert own user profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Kos policies
CREATE POLICY "Owner can CRUD own kos" ON kos
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admin can read all kos" ON kos
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Kamar policies
CREATE POLICY "Owner can CRUD own kamar" ON kamar
  FOR ALL USING (
    EXISTS (SELECT 1 FROM kos WHERE kos.id = kamar.kos_id AND kos.user_id = auth.uid())
  );

CREATE POLICY "Admin can read all kamar" ON kamar
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Penyewa policies
CREATE POLICY "Owner can CRUD own penyewa" ON penyewa
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM kamar
      JOIN kos ON kos.id = kamar.kos_id
      WHERE kamar.id = penyewa.kamar_id AND kos.user_id = auth.uid()
    )
  );

-- Tagihan policies
CREATE POLICY "Owner can CRUD own tagihan" ON tagihan
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM penyewa
      JOIN kamar ON kamar.id = penyewa.kamar_id
      JOIN kos ON kos.id = kamar.kos_id
      WHERE penyewa.id = tagihan.penyewa_id AND kos.user_id = auth.uid()
    )
  );

-- WA Templates policies
CREATE POLICY "Owner can CRUD own wa_templates" ON wa_templates
  FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- Seed Admin (GANTI email dan id sesuai kebutuhan)
-- Jalankan setelah admin register via Auth
-- ============================================
-- UPDATE users SET role = 'admin' WHERE email = 'admin@smartkos.com';
