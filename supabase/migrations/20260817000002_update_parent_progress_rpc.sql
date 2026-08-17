-- Migration: 20260817000002_update_parent_progress_rpc.sql
-- Description: Update get_student_progress_by_token to return complete student metadata and full recitation log fields.

CREATE OR REPLACE FUNCTION public.get_student_progress_by_token(p_token UUID)
RETURNS JSONB AS $$
DECLARE
  v_student_id UUID;
  v_result JSONB;
BEGIN
  -- Search for student ID matching token
  SELECT id INTO v_student_id
  FROM public.students
  WHERE parent_token = p_token
    AND (is_archived IS FALSE OR is_archived IS NULL)
    AND (deleted_at IS NULL);

  IF v_student_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'الرمز غير صحيح أو غير موجود');
  END IF;

  SELECT jsonb_build_object(
    'success', true,
    'student', (
      SELECT jsonb_build_object(
        'id', s.id,
        'full_name', s.full_name,
        'parent_phone', s.parent_phone,
        'academic_grade', s.academic_grade,
        'school_name', s.school_name,
        'address', s.address,
        'father_job', s.father_job,
        'avatar_url', s.avatar_url,
        'created_at', s.created_at
      )
      FROM public.students s
      WHERE s.id = v_student_id
    ),
    'logs', (
      SELECT COALESCE(jsonb_agg(l_obj), '[]'::jsonb)
      FROM (
        SELECT 
          ml.id,
          ml.log_type,
          ml.surah_start,
          ml.aya_start,
          ml.surah_end,
          ml.aya_end,
          ml.grade,
          ml.notes,
          ml.assistant_name,
          ml.page_count,
          ml.surahs,
          ml.audio_url,
          ml.rating,
          ml.date,
          ml.created_at
        FROM public.memorization_logs ml
        WHERE ml.student_id = v_student_id
          AND (ml.deleted_at IS NULL)
        ORDER BY ml.created_at DESC
        LIMIT 50
      ) l_obj
    ),
    'attendance', (
      SELECT COALESCE(jsonb_agg(a_obj), '[]'::jsonb)
      FROM (
        SELECT 
          ar.id,
          ar.date,
          ar.status,
          ar.notes
        FROM public.attendance_records ar
        WHERE ar.student_id = v_student_id
        ORDER BY ar.date DESC
        LIMIT 30
      ) a_obj
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.get_student_progress_by_token(UUID) TO anon, authenticated;
