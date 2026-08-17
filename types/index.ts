import {
  Database,
  LogTypeEnum,
  EvaluationGradeEnum,
  AttendanceStatusEnum,
} from "./database.types";

export type { Database, LogTypeEnum, EvaluationGradeEnum, AttendanceStatusEnum };

export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

export type StudentRow = Database["public"]["Tables"]["students"]["Row"] & {
  total_pages_count?: number;
};

export type StudentInsert = Database["public"]["Tables"]["students"]["Insert"];
export type StudentUpdate = Database["public"]["Tables"]["students"]["Update"];

export type MemorizationLogRow = Database["public"]["Tables"]["memorization_logs"]["Row"];
export type MemorizationLogInsert = Database["public"]["Tables"]["memorization_logs"]["Insert"];
export type MemorizationLogUpdate = Database["public"]["Tables"]["memorization_logs"]["Update"];

export type AttendanceRow = Database["public"]["Tables"]["attendance"]["Row"];
export type AttendanceInsert = Database["public"]["Tables"]["attendance"]["Insert"];
export type AttendanceUpdate = Database["public"]["Tables"]["attendance"]["Update"];

export type AttendanceRecordRow = Database["public"]["Tables"]["attendance_records"]["Row"];
export type AttendanceRecordInsert = Database["public"]["Tables"]["attendance_records"]["Insert"];
export type AttendanceRecordUpdate = Database["public"]["Tables"]["attendance_records"]["Update"];

export interface StudentWithProgress extends StudentRow {
  latest_log?: MemorizationLogRow | null;
  latest_attendance?: AttendanceRecordRow | null;
}

export interface ParentProgressPayload {
  success: boolean;
  error?: string;
  student?: {
    id: string;
    full_name: string;
    parent_phone?: string | null;
    academic_grade?: string | null;
    school_name?: string | null;
    address?: string | null;
    father_job?: string | null;
    avatar_url?: string | null;
    created_at: string;
  };
  logs?: Array<{
    id: string;
    log_type: LogTypeEnum;
    surah_start: string;
    aya_start: number;
    surah_end: string;
    aya_end: number;
    grade: EvaluationGradeEnum;
    notes: string | null;
    assistant_name?: string | null;
    page_count?: number | null;
    surahs?: string[] | null;
    audio_url?: string | null;
    created_at: string;
  }>;
  attendance?: Array<{
    id: string;
    date: string;
    status: AttendanceStatusEnum;
    notes: string | null;
  }>;
}
