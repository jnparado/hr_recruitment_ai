import { RESUME_BUCKET, supabaseAdmin } from "@/lib/supabase";

export interface StoredResume {
  fileName: string;
  storagePath: string;
  storageUrl: string;
  error?: string;
}

function sanitizeFileName(name: string) {
  return name.replace(/[^\w.\-() ]/g, "_");
}

/** Uploads a resume file to the Supabase storage bucket. */
export async function uploadResume(file: File): Promise<StoredResume> {
  const supabase = supabaseAdmin();
  const storagePath = `resumes/${Date.now()}-${sanitizeFileName(file.name)}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await supabase.storage.from(RESUME_BUCKET).upload(storagePath, buffer, {
    contentType: file.type || "application/octet-stream",
    upsert: false,
  });

  if (error) {
    throw new Error(`Failed to upload "${file.name}" to storage: ${error.message}`);
  }

  const { data } = supabase.storage.from(RESUME_BUCKET).getPublicUrl(storagePath);

  return {
    fileName: file.name,
    storagePath,
    storageUrl: data.publicUrl,
  };
}

/** Uploads multiple resumes in parallel. Failures are captured per file. */
export async function uploadResumes(files: File[]): Promise<StoredResume[]> {
  return Promise.all(
    files.map(async (file): Promise<StoredResume> => {
      try {
        return await uploadResume(file);
      } catch (err) {
        return {
          fileName: file.name,
          storagePath: "",
          storageUrl: "",
          error: err instanceof Error ? err.message : "Upload failed.",
        };
      }
    })
  );
}

/** Looks up the stored resume for a file name. */
export function storageForFile(
  stored: StoredResume[],
  fileName: string
): Pick<StoredResume, "storagePath" | "storageUrl"> {
  const match = stored.find((s) => s.fileName === fileName && s.storageUrl);
  return {
    storagePath: match?.storagePath ?? "",
    storageUrl: match?.storageUrl ?? "",
  };
}
