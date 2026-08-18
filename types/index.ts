import {
  Database,
  LogTypeEnum,
  EvaluationGradeEnum,
  AttendanceStatusEnum,
} from "./database.types";

export type { Database, LogTypeEnum, EvaluationGradeEnum, AttendanceStatusEnum };

export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

export type StudentSummaryRow = Database["public"]["Views"]["students_with_summary"]["Row"];

export type StudentRow = Database["public"]["Tables"]["students"]["Row"] & {
  total_pages_memorized?: number;
  total_recitations_count?: number;
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

export type GroupRow = Database["public"]["Tables"]["groups"]["Row"];
export type GroupInsert = Database["public"]["Tables"]["groups"]["Insert"];
export type GroupUpdate = Database["public"]["Tables"]["groups"]["Update"];

export type GroupMemberRow = Database["public"]["Tables"]["group_members"]["Row"];
export type GroupMemberInsert = Database["public"]["Tables"]["group_members"]["Insert"];
export type GroupMemberUpdate = Database["public"]["Tables"]["group_members"]["Update"];

export interface StudentWithProgress extends StudentRow {
  latest_log?: MemorizationLogRow | null;
  latest_attendance?: AttendanceRecordRow | null;
}

export interface ParentProgressPayload {
  success: boolean;
  error?: string;
  errorCode?: "NO_STUDENT_FOUND" | "DATABASE_QUERY_ERROR" | "INVALID_TOKEN";
  student?: {
    id: string;
    full_name: string;
    parent_phone?: string | null;
    academic_grade?: string | null;
    school_name?: string | null;
    address?: string | null;
    father_job?: string | null;
    avatar_url?: string | null;
    photo_url?: string | null;
    image_url?: string | null;
    avatar?: string | null;
    image?: string | null;
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
