-- Migration: 20260818000000_add_students_soft_delete_index.sql
-- Description: Add soft delete index on public.students for Group RBAC foundation

-- 1. Ensure deleted_at column exists on public.students
ALTER TABLE public.students 
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ NULL DEFAULT NULL;

-- 2. Create partial index for fast active student resolution per group
CREATE INDEX IF NOT EXISTS idx_students_active
  ON public.students(group_id)
  WHERE deleted_at IS NULL;

-- 3. Create partial index for archived/deleted student lookups
CREATE INDEX IF NOT EXISTS idx_students_deleted
  ON public.students(group_id, deleted_at DESC)
  WHERE deleted_at IS NOT NULL;
