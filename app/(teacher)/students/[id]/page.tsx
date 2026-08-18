import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getStudentLogsCached } from "@/lib/actions/log";
import { getStudentAttendanceCached } from "@/lib/actions/attendance";
import { StudentDetailClient } from "@/components/teacher/StudentDetailClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

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
    .single();

  if (studentError || !student) {
    notFound();
  }

  // Auto-heal missing parent_token for legacy student records
  if (!student.parent_token) {
    const newToken = crypto.randomUUID();
    await supabase
      .from("students")
      .update({ parent_token: newToken })
      .eq("id", id);
    student.parent_token = newToken;
  }

  // Fetch Student Memorization Logs
  const logsRes = await getStudentLogsCached(id, 100);
  const logs = logsRes.success && logsRes.data ? logsRes.data : [];

  // Fetch Student Attendance Records
  const attendanceRes = await getStudentAttendanceCached(id, 100);
  const attendance = attendanceRes.success && attendanceRes.data ? attendanceRes.data : [];

  return (
    <StudentDetailClient
      student={student}
      initialLogs={logs}
      initialAttendance={attendance}
    />
  );
}
