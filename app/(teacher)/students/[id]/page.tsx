import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getStudentLogsCached } from "@/lib/actions/log";
import { getStudentAttendanceCached } from "@/lib/actions/attendance";
import { StudentDetailClient } from "@/components/teacher/StudentDetailClient";

export const dynamic = "force-dynamic";
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

  // Fetch Student details, Memorization Logs, and Attendance Records concurrently in parallel
  const [studentRes, logsRes, attendanceRes] = await Promise.all([
    supabase.from("students").select("*").eq("id", id).single(),
    getStudentLogsCached(id, 100),
    getStudentAttendanceCached(id, 100),
  ]);

  const student = studentRes.data;
  if (studentRes.error || !student) {
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

  const logs = logsRes.success && logsRes.data ? logsRes.data : [];
  const attendance = attendanceRes.success && attendanceRes.data ? attendanceRes.data : [];

  return (
    <StudentDetailClient
      student={student}
      initialLogs={logs}
      initialAttendance={attendance}
    />
  );
}
