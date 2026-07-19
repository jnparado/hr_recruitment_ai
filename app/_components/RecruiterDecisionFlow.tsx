export const RECRUITER_DECISION_STEPS = [
  "Select Candidate",
  "Shortlist",
  "Schedule Interview",
  "Google Calendar",
  "Email Candidate",
  "Reminder",
] as const;

export type RecruiterDecisionStep = (typeof RECRUITER_DECISION_STEPS)[number];

type RecruiterDecisionFlowProps = {
  activeStep?: RecruiterDecisionStep | "Reject";
};

/** Recruiter decision flow after login — Select → Shortlist/Reject → Schedule → … */
export function RecruiterDecisionFlow({
  activeStep = "Select Candidate",
}: RecruiterDecisionFlowProps) {
  const activeIdx =
    activeStep === "Reject"
      ? 1
      : RECRUITER_DECISION_STEPS.indexOf(activeStep as RecruiterDecisionStep);

  return (
    <section className="rounded-2xl border border-emerald-200 bg-gradient-to-b from-emerald-50/50 to-white p-6 shadow-sm">
      <div className="text-center">
        <span className="inline-flex rounded-full border border-emerald-200 bg-white px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-700">
          Recruiter only
        </span>
        <h2 className="mt-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
          Recruiter Login → Dashboard
        </h2>
      </div>

      <div className="mx-auto mt-5 max-w-sm rounded-xl border border-emerald-100 bg-white p-3">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
          Dashboard modules
        </p>
        <ul className="mt-2 grid grid-cols-2 gap-1.5 text-xs text-slate-700">
          {[
            "Job Posts",
            "Applicants",
            "Candidate Ranking",
            "Interview Schedule",
            "Analytics",
            "Email Center",
            "AI Insights",
            "Settings",
          ].map((m) => (
            <li
              key={m}
              className="rounded-lg border border-slate-100 bg-slate-50 px-2 py-1.5 font-medium"
            >
              {m}
            </li>
          ))}
        </ul>
      </div>

      <ol className="mx-auto mt-6 max-w-sm space-y-0">
        {RECRUITER_DECISION_STEPS.map((step, i) => {
          const isActive = activeStep === step;
          const isPast = activeIdx > i;
          const showRejectBranch = step === "Select Candidate";

          return (
            <li key={step} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                    isActive
                      ? "bg-emerald-600 text-white ring-4 ring-emerald-100"
                      : isPast
                        ? "bg-emerald-500 text-white"
                        : "bg-emerald-100 text-emerald-800"
                  }`}
                >
                  {isPast ? "✓" : i + 1}
                </span>
                {i < RECRUITER_DECISION_STEPS.length - 1 && (
                  <span
                    className={`my-1 w-px flex-1 min-h-[14px] ${
                      isPast ? "bg-emerald-300" : "bg-slate-200"
                    }`}
                    aria-hidden
                  />
                )}
              </div>
              <div
                className={`flex-1 ${i < RECRUITER_DECISION_STEPS.length - 1 ? "pb-4" : ""}`}
              >
                <div
                  className={`rounded-xl border px-3 py-2 text-sm font-medium shadow-sm ${
                    isActive
                      ? "border-emerald-400 bg-emerald-600 text-white"
                      : isPast
                        ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                        : "border-slate-200 bg-white text-slate-700"
                  }`}
                >
                  {step}
                </div>
                {showRejectBranch && (
                  <div className="mt-2 ml-1 grid grid-cols-2 gap-2">
                    <div
                      className={`rounded-lg border px-2.5 py-2 text-xs font-semibold ${
                        activeStep === "Shortlist" || activeIdx > 1
                          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                          : "border-emerald-100 bg-white text-emerald-800"
                      }`}
                    >
                      Shortlist
                    </div>
                    <div
                      className={`rounded-lg border px-2.5 py-2 text-xs font-semibold ${
                        activeStep === "Reject"
                          ? "border-rose-300 bg-rose-50 text-rose-800"
                          : "border-slate-200 bg-slate-50 text-slate-600"
                      }`}
                    >
                      Reject
                    </div>
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
