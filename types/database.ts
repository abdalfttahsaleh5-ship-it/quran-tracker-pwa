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
      profiles: {
        Row: {
          created_at: string;
          full_name: string;
          id: string;
          phone: string | null;
          [key: string]: unknown;
        };
        Insert: {
          created_at?: string;
          full_name: string;
          id: string;
          phone?: string | null;
          [key: string]: unknown;
        };
        Update: {
          created_at?: string;
          full_name?: string;
          id?: string;
          phone?: string | null;
          [key: string]: unknown;
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
      students: {
        Row: {
          created_at: string;
          full_name: string;
          id: string;
          parent_phone: string | null;
          parent_token: string;
          teacher_id: string;
          updated_at: string;
          [key: string]: unknown;
        };
        Insert: {
          created_at?: string;
          full_name: string;
          id?: string;
          parent_phone?: string | null;
          parent_token?: string;
          teacher_id: string;
          updated_at?: string;
          [key: string]: unknown;
        };
        Update: {
          created_at?: string;
          full_name?: string;
          id?: string;
          parent_phone?: string | null;
          parent_token?: string;
          teacher_id?: string;
          updated_at?: string;
          [key: string]: unknown;
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
          aya_end: number;
          aya_start: number;
          created_at: string;
          grade: Database["public"]["Enums"]["evaluation_grade_enum"];
          id: string;
          log_type: Database["public"]["Enums"]["log_type_enum"];
          notes: string | null;
          student_id: string;
          surah_end: string;
          surah_start: string;
          teacher_id: string;
          [key: string]: unknown;
        };
        Insert: {
          aya_end: number;
          aya_start: number;
          created_at?: string;
          grade: Database["public"]["Enums"]["evaluation_grade_enum"];
          id?: string;
          log_type: Database["public"]["Enums"]["log_type_enum"];
          notes?: string | null;
          student_id: string;
          surah_end: string;
          surah_start: string;
          teacher_id: string;
          [key: string]: unknown;
        };
        Update: {
          aya_end?: number;
          aya_start?: number;
          created_at?: string;
          grade?: Database["public"]["Enums"]["evaluation_grade_enum"];
          id?: string;
          log_type?: Database["public"]["Enums"]["log_type_enum"];
          notes?: string | null;
          student_id?: string;
          surah_end?: string;
          surah_start?: string;
          teacher_id?: string;
          [key: string]: unknown;
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
      attendance_records: {
        Row: {
          created_at: string;
          date: string;
          id: string;
          notes: string | null;
          status: Database["public"]["Enums"]["attendance_status_enum"];
          student_id: string;
          teacher_id: string;
          [key: string]: unknown;
        };
        Insert: {
          created_at?: string;
          date?: string;
          id?: string;
          notes?: string | null;
          status?: Database["public"]["Enums"]["attendance_status_enum"];
          student_id: string;
          teacher_id: string;
          [key: string]: unknown;
        };
        Update: {
          created_at?: string;
          date?: string;
          id?: string;
          notes?: string | null;
          status?: Database["public"]["Enums"]["attendance_status_enum"];
          student_id?: string;
          teacher_id?: string;
          [key: string]: unknown;
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
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_student_progress_by_token: {
        Args: {
          p_token: string;
          [key: string]: unknown;
        };
        Returns: Json;
      };
    };
    Enums: {
      attendance_status_enum: "حاضر" | "غائب" | "مستأذن" | "متأخر";
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
