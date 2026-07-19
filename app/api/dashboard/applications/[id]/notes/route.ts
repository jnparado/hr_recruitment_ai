import { requireRecruiter } from "@/lib/auth";
import { updateApplicationNotesTags } from "@/lib/db";

export async function POST(
  request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const auth = await requireRecruiter();
  if (auth.error) return auth.error;

  const { id } = await ctx.params;
  const body = (await request.json().catch(() => null)) as {
    notes?: string;
    tags?: string[];
  } | null;

  try {
    await updateApplicationNotesTags(id, {
      notes: body?.notes,
      tags: body?.tags,
    });
    return Response.json({ ok: true });
  } catch (err) {
    return Response.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Failed to save notes. Run the applications notes/tags migration.",
      },
      { status: 502 }
    );
  }
}
