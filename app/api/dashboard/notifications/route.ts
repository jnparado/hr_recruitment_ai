import { requireRecruiter } from "@/lib/auth";
import {
  listRecruiterNotifications,
  markAllRecruiterNotificationsRead,
  markRecruiterNotificationRead,
} from "@/lib/db";

export async function GET() {
  const auth = await requireRecruiter();
  if (auth.error) return auth.error;

  try {
    const notifications = await listRecruiterNotifications(40);
    const unread = notifications.filter((n) => !n.read_at).length;
    return Response.json({ notifications, unread });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Failed to load notifications." },
      { status: 502 }
    );
  }
}

export async function PATCH(request: Request) {
  const auth = await requireRecruiter();
  if (auth.error) return auth.error;

  const body = (await request.json().catch(() => null)) as {
    id?: string;
    all?: boolean;
  } | null;

  try {
    if (body?.all) {
      await markAllRecruiterNotificationsRead();
    } else if (body?.id) {
      await markRecruiterNotificationRead(body.id);
    } else {
      return Response.json({ error: "id or all is required." }, { status: 400 });
    }
    return Response.json({ ok: true });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Failed to update notifications." },
      { status: 502 }
    );
  }
}
