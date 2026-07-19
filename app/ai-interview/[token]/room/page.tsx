"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

/**
 * After pre-checks, enter the voice Interview Room (no AI avatar).
 */
export default function InterviewRoomPage() {
  const params = useParams();
  const router = useRouter();
  const token = String(params.token || "");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const info = await fetch(`/api/ai-interview/${token}`).then((r) => r.json());
        if (info.error) throw new Error(info.error);
        if (!info.verifiedAt) {
          router.replace(`/ai-interview/${token}/verify`);
          return;
        }
        if (!info.usable && info.status !== "in_progress" && info.status !== "verified") {
          throw new Error("This interview link is no longer valid.");
        }

        const start = await fetch(`/api/ai-interview/${token}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "start" }),
        }).then((r) => r.json());

        if (start.error && !start.applicationId) {
          throw new Error(start.error);
        }

        if (!cancelled && start.applicationId) {
          router.replace(`/call/${start.applicationId}`);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not open Interview Room.");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, router]);

  if (error) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="text-xl font-bold text-slate-900">Interview Room unavailable</h1>
        <p className="mt-2 text-sm text-rose-700">{error}</p>
        <Link href={`/ai-interview/${token}`} className="mt-6 inline-block text-sm text-indigo-700">
          ← Back to invitation
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center text-sm text-slate-500">
      Opening voice Interview Room…
    </div>
  );
}
