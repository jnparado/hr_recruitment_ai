export const CAREER_WEBSITE_FLOW_STEPS = [
  "Candidate Applies",
  "Upload Resume",
  "Supabase Storage",
  "n8n Trigger",
  "AI Resume Parser",
  "Save to Supabase",
  "Match Job Description",
  "Score Candidate",
  "Rank Candidates",
  "Email Recruiter",
  "Schedule Interview",
  "Google Calendar",
  "Reminder",
] as const;

export type CareerWebsiteFlowStep = (typeof CAREER_WEBSITE_FLOW_STEPS)[number];

const PARSER_FIELDS = ["Name", "Skills", "Experience", "Education", "Certificates"] as const;

type CareerWebsiteFlowProps = {
  activeStep?: CareerWebsiteFlowStep;
};

function stepIndex(step: CareerWebsiteFlowStep | undefined) {
  if (!step) return -1;
  return CAREER_WEBSITE_FLOW_STEPS.indexOf(step);
}

/** Vertical Career Website automation flow (apply → parse → rank → calendar). */
export function CareerWebsiteFlow({ activeStep }: CareerWebsiteFlowProps) {
  const activeIdx = stepIndex(activeStep);

  return (
    <section className="rounded-2xl border border-slate-200 bg-gradient-to-b from-white to-slate-50/80 p-6 shadow-sm">
      <h2 className="text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
        Career Website
      </h2>

      <ol className="mx-auto mt-6 max-w-md space-y-0">
        {CAREER_WEBSITE_FLOW_STEPS.map((step, i) => {
          const isActive = activeStep === step;
          const isPast = activeIdx > i;
          const isParser = step === "AI Resume Parser";

          return (
            <li key={step} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                    isActive
                      ? "bg-indigo-600 text-white ring-4 ring-indigo-100"
                      : isPast
                        ? "bg-indigo-500 text-white"
                        : "bg-indigo-100 text-indigo-700"
                  }`}
                >
                  {isPast ? "✓" : i + 1}
                </span>
                {i < CAREER_WEBSITE_FLOW_STEPS.length - 1 && (
                  <span
                    className={`my-1 w-px flex-1 min-h-[14px] ${
                      isPast ? "bg-indigo-300" : "bg-slate-200"
                    }`}
                    aria-hidden
                  />
                )}
              </div>

              <div className={`flex-1 ${i < CAREER_WEBSITE_FLOW_STEPS.length - 1 ? "pb-4" : ""}`}>
                <div
                  className={`rounded-xl border px-3 py-2 text-sm font-medium shadow-sm ${
                    isActive
                      ? "border-indigo-400 bg-indigo-600 text-white"
                      : isPast
                        ? "border-indigo-200 bg-indigo-50 text-indigo-900"
                        : i % 2 === 1
                          ? "border-indigo-100 bg-indigo-50/70 text-indigo-900"
                          : "border-slate-200 bg-white text-slate-700"
                  }`}
                >
                  {step}
                </div>

                {isParser && (
                  <ul className="mt-2 ml-3 space-y-1 border-l border-indigo-200 pl-3">
                    {PARSER_FIELDS.map((field) => (
                      <li key={field} className="text-xs text-slate-600">
                        {field}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
