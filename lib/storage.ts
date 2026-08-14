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
    const fileName = `${studentId}/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.webm`;

    const { data, error } = await supabase.storage
      .from("recitation-audio")
      .upload(fileName, audioBlob, {
        contentType: audioBlob.type || "audio/webm",
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("Storage upload warning (recitation-audio bucket may need to be created):", error.message);
      }
      return null;
    }

    const { data: publicData } = supabase.storage
      .from("recitation-audio")
      .getPublicUrl(data.path);

    return publicData.publicUrl;
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("Error in uploadRecitationAudio:", err);
    }
    return null;
  }
}
