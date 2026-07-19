"use client";

import { useState } from "react";

const TEMPLATES = [
  {
    id: "invite",
    label: "Interview invitation",
    subject: "You're invited to interview — {{jobTitle}}",
    body: "Hi {{name}},\n\nPlease use your secure AI Interview link to complete the first-stage interview by {{deadline}}.\n\n{{interviewUrl}}\n\n— Recruiting",
  },
  {
    id: "offer",
    label: "Offer letter",
    subject: "Offer — {{jobTitle}}",
    body: "Hi {{name}},\n\nWe're pleased to offer you the {{jobTitle}} role. Reply to this email to proceed.\n\n— Recruiting",
  },
  {
    id: "reject",
    label: "Rejection email",
    subject: "Update on your application — {{jobTitle}}",
    body: "Hi {{name}},\n\nThank you for applying. We've decided not to move forward at this time.\n\n— Recruiting",
  },
  {
    id: "followup",
    label: "Follow-up email",
    subject: "Following up — {{jobTitle}}",
    body: "Hi {{name}},\n\nJust checking in on your application for {{jobTitle}}. Let us know if you have questions.\n\n— Recruiting",
  },
  {
    id: "bulk",
    label: "Bulk campaign",
    subject: "Open roles at our company",
    body: "Hi {{name}},\n\nWe have open roles that may interest you. Visit our Career Website to apply.\n\n— Recruiting",
  },
] as const;

export default function EmailCenterPage() {
  const [selected, setSelected] = useState<(typeof TEMPLATES)[number]>(TEMPLATES[0]);
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState<string>(TEMPLATES[0].subject);
  const [body, setBody] = useState<string>(TEMPLATES[0].body);
  const [queued, setQueued] = useState<string | null>(null);

  function pick(t: (typeof TEMPLATES)[number]) {
    setSelected(t);
    setSubject(t.subject);
    setBody(t.body);
    setQueued(null);
  }

  function queueSend(e: React.FormEvent) {
    e.preventDefault();
    const payload = { to, subject, body, template: selected.id };
    console.info("[email-center] queued", payload);
    setQueued(`Email payload queued for ${to || "(no recipient)"} — wire to n8n / SES to deliver.`);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">Email Center</h1>
      <p className="mt-1 text-sm text-slate-600">
        Interview invitations, offers, rejections, follow-ups, and bulk campaigns.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        {TEMPLATES.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => pick(t)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
              selected.id === t.id
                ? "bg-emerald-600 text-white"
                : "border border-slate-200 bg-white text-slate-600"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <form
        onSubmit={queueSend}
        className="mt-6 space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <input
          type="email"
          required
          placeholder="Recipient email"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="w-full rounded-xl border border-slate-300 p-2.5 text-sm"
        />
        <input
          required
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="w-full rounded-xl border border-slate-300 p-2.5 text-sm"
        />
        <textarea
          required
          rows={10}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="w-full rounded-xl border border-slate-300 p-2.5 font-mono text-sm"
        />
        <button
          type="submit"
          className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
        >
          Queue email
        </button>
        {queued && (
          <p className="text-sm text-emerald-800">{queued}</p>
        )}
      </form>
    </div>
  );
}
