-- ============================================
-- SmartKos - Add Operasional Table
-- ============================================

CREATE TABLE IF NOT EXISTS operasional (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kos_id UUID REFERENCES kos(id) ON DELETE CASCADE,
  keterangan TEXT NOT NULL,
  jumlah BIGINT NOT NULL DEFAULT 0,
  tanggal DATE DEFAULT CURRENT_DATE,
  kategori TEXT NOT NULL DEFAULT 'Lainnya',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE operasional ENABLE ROW LEVEL SECURITY;

-- Policy: Owner can CRUD own operasional
DROP POLICY IF EXISTS "Owner can CRUD own operasional" ON operasional;
CREATE POLICY "Owner can CRUD own operasional" ON operasional
  FOR ALL USING (
    auth.uid() = user_id OR
    EXISTS (SELECT 1 FROM kos WHERE kos.id = operasional.kos_id AND kos.user_id = auth.uid())
  );

-- Policy: Admin can read all operasional
DROP POLICY IF EXISTS "Admin can read all operasional" ON operasional;
CREATE POLICY "Admin can read all operasional" ON operasional
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );
