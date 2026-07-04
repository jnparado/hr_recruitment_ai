import { extractText } from "unpdf";
import mammoth from "mammoth";

const MAX_CHARS = 24_000;

/** Extracts plain text from an uploaded resume file (PDF, DOCX, or plain text). */
export async function extractResumeText(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  const buffer = Buffer.from(await file.arrayBuffer());

  let text: string;
  if (name.endsWith(".pdf")) {
    const result = await extractText(new Uint8Array(buffer), {
      mergePages: true,
    });
    text = result.text;
  } else if (name.endsWith(".docx")) {
    const result = await mammoth.extractRawText({ buffer });
    text = result.value;
  } else {
    text = buffer.toString("utf-8");
  }

  const cleaned = text.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
  if (!cleaned) {
    throw new Error(`Could not extract any text from "${file.name}".`);
  }
  return cleaned.slice(0, MAX_CHARS);
}
