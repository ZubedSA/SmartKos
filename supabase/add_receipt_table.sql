-- ============================================
-- SmartKos - Add Receipt Templates Table
-- ============================================

CREATE TABLE IF NOT EXISTS receipt_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  nama_bisnis TEXT,
  alamat_bisnis TEXT,
  kontak_bisnis TEXT,
  pesan_tambahan TEXT DEFAULT 'Terima kasih telah melakukan pembayaran tepat waktu.',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE receipt_templates ENABLE ROW LEVEL SECURITY;

-- Policy: Owner can CRUD own receipt_templates
CREATE POLICY "Owner can CRUD own receipt_templates" ON receipt_templates
  FOR ALL USING (auth.uid() = user_id);
