export default function SettingsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">Settings</h1>
      <p className="mt-1 text-sm text-slate-600">
        Recruiter account and automation configuration.
      </p>
      <div className="mt-6 space-y-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="font-semibold text-slate-900">Login</p>
          <p className="mt-1 text-sm text-slate-600">
            Static recruiter credentials are set via{" "}
            <code className="rounded bg-slate-100 px-1">RECRUITER_LOGIN_EMAIL</code> /{" "}
            <code className="rounded bg-slate-100 px-1">RECRUITER_LOGIN_PASSWORD</code> in
            environment variables.
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="font-semibold text-slate-900">Notifications</p>
          <p className="mt-1 text-sm text-slate-600">
            Recruiter notify email uses{" "}
            <code className="rounded bg-slate-100 px-1">RECRUITER_EMAIL</code>. Connect n8n
            for Gmail / Google Calendar delivery.
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="font-semibold text-slate-900">AI provider</p>
          <p className="mt-1 text-sm text-slate-600">
            Default is Cursor (`AI_PROVIDER=cursor`). Set `AI_PROVIDER=openai` only when you
            have OpenAI quota.
          </p>
        </div>
      </div>
    </div>
  );
}
