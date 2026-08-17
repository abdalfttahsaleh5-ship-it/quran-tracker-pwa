-- Migration: 20260817000001_create_students_with_summary_view.sql
-- Description: Create students_with_summary view to pre-aggregate memorization page totals and recitation counts.

CREATE OR REPLACE VIEW public.students_with_summary AS
SELECT 
  s.id,
  s.teacher_id,
  s.full_name,
  s.parent_phone,
  s.parent_token,
  s.academic_grade,
  s.school_name,
  s.address,
  s.father_job,
  s.avatar_url,
  s.is_archived,
  s.deleted_at,
  s.created_at,
  s.updated_at,
  COALESCE(SUM(l.page_count), 0)::numeric(10,2) AS total_pages_memorized,
  COUNT(l.id)::bigint AS total_recitations_count
FROM public.students s
LEFT JOIN public.memorization_logs l 
  ON l.student_id = s.id 
  AND (l.deleted_at IS NULL)
GROUP BY s.id;
