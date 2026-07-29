import {
  Database,
  LogTypeEnum,
  EvaluationGradeEnum,
  AttendanceStatusEnum,
} from "./database";

export type { Database, LogTypeEnum, EvaluationGradeEnum, AttendanceStatusEnum };

export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
export type StudentRow = Database["public"]["Tables"]["students"]["Row"];
export type StudentInsert = Database["public"]["Tables"]["students"]["Insert"];
export type StudentUpdate = Database["public"]["Tables"]["students"]["Update"];

export type MemorizationLogRow = Database["public"]["Tables"]["memorization_logs"]["Row"] & {
  assistant_name?: string | null;
};
export type MemorizationLogInsert = Database["public"]["Tables"]["memorization_logs"]["Insert"] & {
  assistant_name?: string | null;
};

export type AttendanceRecordRow = Database["public"]["Tables"]["attendance_records"]["Row"];
export type AttendanceRecordInsert = Database["public"]["Tables"]["attendance_records"]["Insert"];

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
    created_at: string;
  }>;
  attendance?: Array<{
    id: string;
    date: string;
    status: AttendanceStatusEnum;
    notes: string | null;
  }>;
}
