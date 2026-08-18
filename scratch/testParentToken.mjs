import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

console.log("Supabase URL exists:", Boolean(supabaseUrl));
console.log("Supabase Key exists:", Boolean(supabaseKey));

async function testParentLookup() {
  if (!supabaseUrl || !supabaseKey) {
    console.log("Missing Supabase credentials in env");
    return;
  }
  const supabase = createClient(supabaseUrl, supabaseKey);

  // 1. Check if students exist and get a parent_token
  const { data: students, error: stErr } = await supabase
    .from("students")
    .select("id, full_name, parent_token")
    .limit(5);

  console.log("Students lookup error:", stErr);
  console.log("Students sample:", students);

  if (students && students.length > 0) {
    const testToken = students[0].parent_token;
    console.log("\nTesting with token:", testToken);

    // Test RPC
    const { data: rpcData, error: rpcErr } = await supabase.rpc("get_student_progress_by_token", {
      p_token: testToken,
    });
    console.log("RPC Error:", rpcErr);
    console.log("RPC Data:", JSON.stringify(rpcData, null, 2));

    // Test Direct Query
    const { data: directStudent, error: directErr } = await supabase
      .from("students")
      .select("id, full_name, parent_phone, academic_grade, school_name, address, father_job, avatar_url, created_at")
      .eq("parent_token", testToken)
      .maybeSingle();

    console.log("\nDirect Query Error:", directErr);
    console.log("Direct Student:", directStudent);
  }
}

testParentLookup().catch(console.error);
