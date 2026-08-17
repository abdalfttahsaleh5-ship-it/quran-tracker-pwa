-- 1. Sync students table
ALTER TABLE public.students 
  ADD COLUMN IF NOT EXISTS academic_grade text,
  ADD COLUMN IF NOT EXISTS school_name text,
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS father_job text,
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS is_archived boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- 2. Sync memorization_logs table
ALTER TABLE public.memorization_logs 
  ADD COLUMN IF NOT EXISTS assistant_name text,
  ADD COLUMN IF NOT EXISTS page_count numeric(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS surahs text[],
  ADD COLUMN IF NOT EXISTS audio_url text,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS rating text,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- 3. Sync attendance table
ALTER TABLE public.attendance
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'حاضر',
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT timezone('utc'::text, now());

-- 4. Create Indexes
CREATE INDEX IF NOT EXISTS idx_students_teacher_id ON public.students(teacher_id);
CREATE INDEX IF NOT EXISTS idx_memorization_logs_student_id ON public.memorization_logs(student_id);
CREATE INDEX IF NOT EXISTS idx_memorization_logs_date ON public.memorization_logs(date);
CREATE INDEX IF NOT EXISTS idx_attendance_student_date ON public.attendance(student_id, date);
