import { createClient } from "@/lib/supabase/client";

/**
 * Uploads a student recitation audio recording to Supabase Storage bucket 'recitation-audio'
 * and returns the public URL.
 */
export async function uploadRecitationAudio(
  studentId: string,
  audioBlob: Blob
): Promise<string | null> {
  if (!studentId || !audioBlob || audioBlob.size === 0) {
    return null;
  }

  try {
    const supabase = createClient();
    const isMp4 = audioBlob.type.includes("mp4");
    const isOgg = audioBlob.type.includes("ogg");
    const ext = isMp4 ? "mp4" : isOgg ? "ogg" : "webm";
    const contentType = audioBlob.type || `audio/${ext}`;
    const fileName = `${studentId}/${Date.now()}.${ext}`;

    const { data, error } = await supabase.storage
      .from("recitation-audio")
      .upload(fileName, audioBlob, {
        contentType,
        cacheControl: "3600",
        upsert: true,
      });

    if (error) {
      console.error("Storage upload error in recitation-audio:", error.message);
      return null;
    }

    const { data: publicData } = supabase.storage
      .from("recitation-audio")
      .getPublicUrl(data.path || fileName);

    return publicData?.publicUrl || null;
  } catch (err) {
    console.error("Error in uploadRecitationAudio:", err);
    return null;
  }
}
