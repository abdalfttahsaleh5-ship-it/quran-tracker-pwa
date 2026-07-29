-- Migration: 20260729_initial_schema.sql
-- Description: Schema migration for "متابع الحفظ" (Quran Memorization Tracker PWA)
-- Includes Enums, Tables, Foreign Keys, Indexes, Triggers, RLS Security Policies, and Parent Progress RPC.

-- ==========================================
-- 1. Custom Enums
-- ==========================================
CREATE TYPE public.log_type_enum AS ENUM ('جديد', 'مراجعة_صغرى', 'مراجعة_كبرى');
CREATE TYPE public.evaluation_grade_enum AS ENUM ('ممتاز', 'جيد_جدا', 'جيد', 'يحتاج_تحسين');
CREATE TYPE public.attendance_status_enum AS ENUM ('حاضر', 'غائب', 'مستأذن', 'متأخر');

-- ==========================================
-- 2. Tables & Fields
-- ==========================================

-- a. Profiles Table (Teachers)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- b. Students Table
CREATE TABLE public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  parent_phone TEXT,
  parent_token UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- c. Memorization Logs Table
CREATE TABLE public.memorization_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  log_type public.log_type_enum NOT NULL,
  surah_start TEXT NOT NULL,
  aya_start INTEGER NOT NULL,
  surah_end TEXT NOT NULL,
  aya_end INTEGER NOT NULL,
  grade public.evaluation_grade_enum NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- d. Attendance Records Table
CREATE TABLE public.attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  status public.attendance_status_enum NOT NULL DEFAULT 'حاضر',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_student_daily_attendance UNIQUE (student_id, date)
);

-- ==========================================
-- 3. Performance Indexes
-- ==========================================
CREATE INDEX idx_students_teacher_id ON public.students(teacher_id);
CREATE INDEX idx_students_parent_token ON public.students(parent_token);
CREATE INDEX idx_memorization_logs_student_created ON public.memorization_logs(student_id, created_at DESC);
CREATE INDEX idx_attendance_records_student_date ON public.attendance_records(student_id, date DESC);

-- ==========================================
-- 4. Triggers & Functions
-- ==========================================

-- Automatic updated_at timestamp trigger for students table
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_students_updated_at
  BEFORE UPDATE ON public.students
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Automatic profiles creation trigger upon auth.users signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email, 'معلم جديد'),
    NEW.raw_user_meta_data->>'phone'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ==========================================
-- 5. Row Level Security (RLS) & Security Policies
-- ==========================================

-- Enable RLS on ALL tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memorization_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Teachers can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Teachers can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Students Policies
CREATE POLICY "Teachers can view their students"
  ON public.students FOR SELECT
  USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers can insert students"
  ON public.students FOR INSERT
  WITH CHECK (auth.uid() = teacher_id);

CREATE POLICY "Teachers can update their students"
  ON public.students FOR UPDATE
  USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers can delete their students"
  ON public.students FOR DELETE
  USING (auth.uid() = teacher_id);

-- Read-only policy for parent token lookup
CREATE POLICY "Public read student by parent token"
  ON public.students FOR SELECT
  USING (true);

-- Memorization Logs Policies
CREATE POLICY "Teachers can manage memorization logs for their students"
  ON public.memorization_logs FOR ALL
  USING (auth.uid() = teacher_id)
  WITH CHECK (auth.uid() = teacher_id);

CREATE POLICY "Public read memorization logs by parent token"
  ON public.memorization_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.students
      WHERE students.id = memorization_logs.student_id
    )
  );

-- Attendance Records Policies
CREATE POLICY "Teachers can manage attendance records for their students"
  ON public.attendance_records FOR ALL
  USING (auth.uid() = teacher_id)
  WITH CHECK (auth.uid() = teacher_id);

CREATE POLICY "Public read attendance records by parent token"
  ON public.attendance_records FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.students
      WHERE students.id = attendance_records.student_id
    )
  );

-- ==========================================
-- 6. Secure RPC Function for Parent Portal Progress
-- ==========================================
CREATE OR REPLACE FUNCTION public.get_student_progress_by_token(p_token UUID)
RETURNS JSONB AS $$
DECLARE
  v_student_id UUID;
  v_result JSONB;
BEGIN
  -- Search for student ID matching token
  SELECT id INTO v_student_id
  FROM public.students
  WHERE parent_token = p_token;

  IF v_student_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'الرمز غير صحيح أو غير موجود');
  END IF;

  SELECT jsonb_build_object(
    'success', true,
    'student', (
      SELECT jsonb_build_object(
        'id', s.id,
        'full_name', s.full_name,
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
          ml.created_at
        FROM public.memorization_logs ml
        WHERE ml.student_id = v_student_id
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

-- Grant execution permissions
GRANT EXECUTE ON FUNCTION public.get_student_progress_by_token(UUID) TO anon, authenticated;
