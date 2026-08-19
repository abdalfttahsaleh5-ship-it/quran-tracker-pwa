-- Migration: Add last_contacted_at to students table for tracking parent follow-up communication
ALTER TABLE public.students
ADD COLUMN IF NOT EXISTS last_contacted_at TIMESTAMPTZ;
