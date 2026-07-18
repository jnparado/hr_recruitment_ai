import { RESUME_BUCKET, supabaseAdmin } from "@/lib/supabase";
import { extractResumeTextFromBuffer } from "@/lib/extract";

export interface StoredFile {
  fileName: string;
  storagePath: string;
  storageUrl: string;
  error?: string;
}

/** @deprecated use StoredFile */
export type StoredResume = StoredFile;

function sanitizeFileName(name: string) {
  return name.replace(/[^\w.\-() ]/g, "_");
}

export async function uploadToBucket(
  bucket: string,
  file: File,
  folder: string
): Promise<StoredFile> {
  const supabase = supabaseAdmin();
  const storagePath = `${folder}/${Date.now()}-${sanitizeFileName(file.name)}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await supabase.storage.from(bucket).upload(storagePath, buffer, {
    contentType: file.type || "application/octet-stream",
    upsert: false,
  });

  if (error) {
    throw new Error(`Failed to upload "${file.name}" to ${bucket}: ${error.message}`);
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(storagePath);

  return {
    fileName: file.name,
    storagePath,
    storageUrl: data.publicUrl,
  };
}

/** Uploads a resume to the upload_resume bucket. */
export async function uploadResume(file: File, folder = "resumes"): Promise<StoredFile> {
  return uploadToBucket(RESUME_BUCKET, file, folder);
}

/** Uploads multiple files in parallel. Failures are captured per file. */
export async function uploadFiles(
  files: File[],
  uploader: (file: File) => Promise<StoredFile>
): Promise<StoredFile[]> {
  return Promise.all(
    files.map(async (file): Promise<StoredFile> => {
      try {
        return await uploader(file);
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

/** @deprecated use uploadFiles */
export async function uploadResumes(files: File[]): Promise<StoredFile[]> {
  return uploadFiles(files, (file) => uploadResume(file));
}

/** Downloads a stored resume and extracts plain text for AI interview context. */
export async function downloadResumeText(storagePath: string): Promise<string> {
  const supabase = supabaseAdmin();
  const { data, error } = await supabase.storage.from(RESUME_BUCKET).download(storagePath);
  if (error || !data) {
    throw new Error(`Failed to download resume: ${error?.message ?? "file not found"}`);
  }

  const buffer = Buffer.from(await data.arrayBuffer());
  const fileName = storagePath.split("/").pop() || "resume.pdf";
  return extractResumeTextFromBuffer(buffer, fileName);
}

export function storageForFile(
  stored: StoredFile[],
  fileName: string
): Pick<StoredFile, "storagePath" | "storageUrl"> {
  const match = stored.find((s) => s.fileName === fileName && s.storageUrl);
  return {
    storagePath: match?.storagePath ?? "",
    storageUrl: match?.storageUrl ?? "",
  };
}
