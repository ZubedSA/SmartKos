-- Add kos_id column to receipt_templates
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='receipt_templates' AND column_name='kos_id') THEN
        ALTER TABLE receipt_templates ADD COLUMN kos_id UUID REFERENCES kos(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Update unique constraint: allow one template per user per kos, or one global (kos_id IS NULL)
-- First, remove old one if it exists (usually it would be user_id unique)
ALTER TABLE receipt_templates DROP CONSTRAINT IF EXISTS receipt_templates_user_id_key;

-- Add new unique index for (user_id, kos_id)
-- Note: NULL in kos_id is allowed for a global template
CREATE UNIQUE INDEX IF NOT EXISTS receipt_templates_user_kos_idx ON receipt_templates (user_id, kos_id) WHERE kos_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS receipt_templates_user_global_idx ON receipt_templates (user_id) WHERE kos_id IS NULL;

-- Enable RLS
ALTER TABLE receipt_templates ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Owner can CRUD own receipt_templates" ON receipt_templates;
CREATE POLICY "Owner can CRUD own receipt_templates" ON receipt_templates
  FOR ALL USING (auth.uid() = user_id);
