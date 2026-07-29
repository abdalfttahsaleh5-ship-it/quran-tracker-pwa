import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getStudentLogs } from "@/lib/actions/log";
import { getStudentAttendance } from "@/lib/actions/attendance";
import { StudentDetailClient } from "@/components/teacher/StudentDetailClient";

export const revalidate = 0;

interface StudentDetailPageProps {
  params: {
    id: string;
  };
}

export default async function StudentDetailPage({ params }: StudentDetailPageProps) {
  const { id } = params;
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    notFound();
  }

  // Fetch Student details
  const { data: student, error: studentError } = await supabase
    .from("students")
    .select("*")
    .eq("id", id)
    .eq("teacher_id", user.id)
    .single();

  if (studentError || !student) {
    notFound();
  }

  // Fetch Student Memorization Logs
  const logsRes = await getStudentLogs(id, 100);
  const logs = logsRes.success && logsRes.data ? logsRes.data : [];

  // Fetch Student Attendance Records
  const attendanceRes = await getStudentAttendance(id, 100);
  const attendance = attendanceRes.success && attendanceRes.data ? attendanceRes.data : [];

  return (
    <StudentDetailClient
      student={student}
      initialLogs={logs}
      initialAttendance={attendance}
    />
  );
}
