import { RecruiterDecisionFlow } from "@/app/_components/RecruiterDecisionFlow";

export default function EmailCenterPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">Email Center</h1>
      <p className="mt-1 text-sm text-slate-600">
        Recruiter notify + candidate interview emails are prepared when you shortlist/schedule.
        Wire n8n Gmail/SendGrid nodes to the payloads from schedule &amp; notify webhooks.
      </p>
      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-700 shadow-sm">
        <p className="font-semibold text-slate-900">Automated emails</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>Notify recruiter — after Career Website scoring/ranking</li>
          <li>Email candidate — when you schedule an interview</li>
          <li>Reminder — day-of reminder payload for n8n</li>
        </ul>
      </div>
      <div className="mt-8">
        <RecruiterDecisionFlow activeStep="Email Candidate" />
      </div>
    </div>
  );
}
