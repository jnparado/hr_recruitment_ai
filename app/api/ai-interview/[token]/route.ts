import {
  getAiInterviewInviteByToken,
  isInviteUsable,
  publicInvitePayload,
  updateAiInterviewInvite,
} from "@/lib/ai-interview-invites";

export async function GET(
  _request: Request,
  ctx: { params: Promise<{ token: string }> }
) {
  const { token } = await ctx.params;
  try {
    const invite = await getAiInterviewInviteByToken(token);
    if (!invite) {
      return Response.json({ error: "Interview link not found." }, { status: 404 });
    }
    return Response.json(publicInvitePayload(invite));
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Failed to load invite." },
      { status: 502 }
    );
  }
}

export async function POST(
  request: Request,
  ctx: { params: Promise<{ token: string }> }
) {
  const { token } = await ctx.params;
  const body = (await request.json().catch(() => null)) as {
    action?: "consent" | "devices" | "identity" | "verify" | "start";
    name?: string;
    email?: string;
  } | null;

  if (!body?.action) {
    return Response.json({ error: "action is required." }, { status: 400 });
  }

  try {
    const invite = await getAiInterviewInviteByToken(token);
    if (!invite) {
      return Response.json({ error: "Interview link not found." }, { status: 404 });
    }
    if (!isInviteUsable(invite)) {
      return Response.json(
        { error: "This interview link has expired or is no longer valid." },
        { status: 410 }
      );
    }

    const now = new Date().toISOString();

    if (body.action === "consent") {
      const updated = await updateAiInterviewInvite(token, {
        consent_at: now,
        status: "consented",
      });
      return Response.json({ ok: true, ...publicInvitePayload(updated) });
    }

    if (body.action === "devices") {
      if (!invite.consent_at) {
        return Response.json({ error: "Consent required first." }, { status: 400 });
      }
      const updated = await updateAiInterviewInvite(token, {
        devices_ok_at: now,
        status: "devices_ok",
      });
      return Response.json({ ok: true, ...publicInvitePayload(updated) });
    }

    if (body.action === "identity") {
      const updated = await updateAiInterviewInvite(token, {
        identity_ok_at: now,
        status: "identity_ok",
      });
      return Response.json({ ok: true, ...publicInvitePayload(updated) });
    }

    if (body.action === "verify") {
      const name = String(body.name || "").trim().toLowerCase();
      const email = String(body.email || "").trim().toLowerCase();
      if (!name || !email) {
        return Response.json({ error: "Name and email are required." }, { status: 400 });
      }

      const expectedName = invite.candidate_name.trim().toLowerCase();
      const expectedEmail = invite.candidate_email.trim().toLowerCase();

      // Allow first+last or full name match; email must match exactly
      const nameOk =
        name === expectedName ||
        expectedName.includes(name) ||
        name.includes(expectedName.split(" ")[0] || expectedName);

      if (!nameOk || email !== expectedEmail) {
        return Response.json(
          {
            error:
              "Name or email does not match the invited candidate. Check your invitation email.",
          },
          { status: 403 }
        );
      }

      const updated = await updateAiInterviewInvite(token, {
        verified_at: now,
        status: "verified",
      });
      return Response.json({
        ok: true,
        applicationId: invite.application_id,
        ...publicInvitePayload(updated),
      });
    }

    if (body.action === "start") {
      if (!invite.verified_at) {
        return Response.json(
          { error: "Verify your name and email before starting." },
          { status: 400 }
        );
      }
      const updated = await updateAiInterviewInvite(token, {
        started_at: now,
        status: "in_progress",
      });
      return Response.json({
        ok: true,
        applicationId: invite.application_id,
        ...publicInvitePayload(updated),
      });
    }

    return Response.json({ error: "Unknown action." }, { status: 400 });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Action failed." },
      { status: 502 }
    );
  }
}
