-- ============================================
-- Migration: Add Feeling Columns for ML Training
-- Run this in your Supabase SQL Editor
-- ============================================

-- Add feeling columns to expenses table
-- feeling: User's emotional state at transaction time (1-5 scale)
-- feeling_review: Retrospective review value (for future feature)

ALTER TABLE expenses 
  ADD COLUMN IF NOT EXISTS feeling INTEGER CHECK (feeling >= 1 AND feeling <= 5),
  ADD COLUMN IF NOT EXISTS feeling_review INTEGER CHECK (feeling_review >= 1 AND feeling_review <= 5);

-- Verify columns were added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'expenses' 
  AND column_name IN ('feeling', 'feeling_review');
