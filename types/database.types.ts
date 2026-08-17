export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      students: {
        Row: {
          id: string;
          teacher_id: string;
          full_name: string;
          parent_phone: string | null;
          parent_token: string;
          academic_grade: string | null;
          school_name: string | null;
          address: string | null;
          father_job: string | null;
          avatar_url: string | null;
          is_archived: boolean;
          deleted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          teacher_id: string;
          full_name: string;
          parent_phone?: string | null;
          parent_token?: string;
          academic_grade?: string | null;
          school_name?: string | null;
          address?: string | null;
          father_job?: string | null;
          avatar_url?: string | null;
          is_archived?: boolean;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          teacher_id?: string;
          full_name?: string;
          parent_phone?: string | null;
          parent_token?: string;
          academic_grade?: string | null;
          school_name?: string | null;
          address?: string | null;
          father_job?: string | null;
          avatar_url?: string | null;
          is_archived?: boolean;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "students_teacher_id_fkey";
            columns: ["teacher_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      memorization_logs: {
        Row: {
          id: string;
          student_id: string;
          teacher_id: string;
          log_type: Database["public"]["Enums"]["log_type_enum"];
          surah_start: string;
          aya_start: number;
          surah_end: string;
          aya_end: number;
          grade: Database["public"]["Enums"]["evaluation_grade_enum"];
          date: string;
          surahs: string[] | null;
          page_count: number | null;
          assistant_name: string | null;
          audio_url: string | null;
          notes: string | null;
          rating: string | null;
          deleted_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          teacher_id: string;
          log_type?: Database["public"]["Enums"]["log_type_enum"];
          surah_start?: string;
          aya_start?: number;
          surah_end?: string;
          aya_end?: number;
          grade?: Database["public"]["Enums"]["evaluation_grade_enum"];
          date?: string;
          surahs?: string[] | null;
          page_count?: number | null;
          assistant_name?: string | null;
          audio_url?: string | null;
          notes?: string | null;
          rating?: string | null;
          deleted_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          teacher_id?: string;
          log_type?: Database["public"]["Enums"]["log_type_enum"];
          surah_start?: string;
          aya_start?: number;
          surah_end?: string;
          aya_end?: number;
          grade?: Database["public"]["Enums"]["evaluation_grade_enum"];
          date?: string;
          surahs?: string[] | null;
          page_count?: number | null;
          assistant_name?: string | null;
          audio_url?: string | null;
          notes?: string | null;
          rating?: string | null;
          deleted_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "memorization_logs_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "students";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "memorization_logs_teacher_id_fkey";
            columns: ["teacher_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      attendance: {
        Row: {
          id: string;
          student_id: string;
          teacher_id: string;
          date: string;
          status: Database["public"]["Enums"]["attendance_status_enum"];
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          teacher_id: string;
          date: string;
          status?: Database["public"]["Enums"]["attendance_status_enum"];
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          teacher_id?: string;
          date?: string;
          status?: Database["public"]["Enums"]["attendance_status_enum"];
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "attendance_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "students";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "attendance_teacher_id_fkey";
            columns: ["teacher_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      attendance_records: {
        Row: {
          id: string;
          student_id: string;
          teacher_id: string;
          date: string;
          status: Database["public"]["Enums"]["attendance_status_enum"];
          notes: string | null;
          created_at: string;
          updated_at?: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          teacher_id: string;
          date: string;
          status?: Database["public"]["Enums"]["attendance_status_enum"];
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          teacher_id?: string;
          date?: string;
          status?: Database["public"]["Enums"]["attendance_status_enum"];
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "attendance_records_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "students";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "attendance_records_teacher_id_fkey";
            columns: ["teacher_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      profiles: {
        Row: {
          id: string;
          full_name: string;
          phone: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          phone?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          phone?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey";
            columns: ["id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      attendance_status_enum: "حاضر" | "غائب" | "متأخر" | "لم يرصد" | "مستأذن";
      evaluation_grade_enum: "ممتاز" | "جيد_جدا" | "جيد" | "يحتاج_تحسين";
      log_type_enum: "جديد" | "مراجعة_صغرى" | "مراجعة_كبرى";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

export type LogTypeEnum = Database["public"]["Enums"]["log_type_enum"];
export type EvaluationGradeEnum = Database["public"]["Enums"]["evaluation_grade_enum"];
export type AttendanceStatusEnum = Database["public"]["Enums"]["attendance_status_enum"];

export type StudentTable = Database["public"]["Tables"]["students"];
export type MemorizationLogTable = Database["public"]["Tables"]["memorization_logs"];
export type AttendanceTable = Database["public"]["Tables"]["attendance"];
export type AttendanceRecordsTable = Database["public"]["Tables"]["attendance_records"];
export type ProfileTable = Database["public"]["Tables"]["profiles"];
