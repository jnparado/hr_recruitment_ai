export const RECRUITMENT_FLOW_STEPS = [
  "Career Website",
  "Candidate Applies",
  "Upload Resume",
  "AI Resume Parser",
  "AI Job Matching",
  "Candidate Score",
  "Recruiter Reviews Candidate",
  "Invite to AI Interview",
  "AI Interview Room",
  "AI Interview Evaluation",
  "Generate Interview Report",
  "Recruiter Admin Dashboard",
  "Shortlist / Reject / Human Interview",
] as const;

const ROOM_BRANCH = [
  "Identity Verification",
  "Camera and Microphone Test",
  "Interview Instructions",
  "AI-Generated Questions",
  "Voice or Video Answers",
  "Follow-up Questions",
  "Coding or Technical Test",
] as const;

const EVAL_BRANCH = [
  "Technical Knowledge",
  "Communication Skills",
  "Relevant Experience",
  "Problem-Solving Ability",
  "Confidence",
  "Job Compatibility",
] as const;

/** Updated end-to-end recruitment flow including AI Interview Room. */
export function RecruitmentFlow() {
  return (
    <section className="rounded-2xl border border-emerald-200 bg-gradient-to-b from-emerald-50/40 to-white p-6 shadow-sm">
      <h2 className="text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
        Updated recruitment flow
      </h2>
      <ol className="mx-auto mt-6 max-w-md space-y-0">
        {RECRUITMENT_FLOW_STEPS.map((step, i) => (
          <li key={step} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[11px] font-bold text-emerald-800">
                {i + 1}
              </span>
              {i < RECRUITMENT_FLOW_STEPS.length - 1 && (
                <span className="my-1 w-px min-h-[12px] flex-1 bg-slate-200" aria-hidden />
              )}
            </div>
            <div className={`flex-1 ${i < RECRUITMENT_FLOW_STEPS.length - 1 ? "pb-3" : ""}`}>
              <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 shadow-sm">
                {step}
              </div>
              {step === "AI Interview Room" && (
                <ul className="mt-2 ml-1 grid gap-1 sm:grid-cols-2">
                  {ROOM_BRANCH.map((b) => (
                    <li
                      key={b}
                      className="rounded-lg border border-indigo-100 bg-indigo-50/50 px-2 py-1.5 text-[11px] font-medium text-indigo-900"
                    >
                      {b}
                    </li>
                  ))}
                </ul>
              )}
              {step === "AI Interview Evaluation" && (
                <ul className="mt-2 ml-1 grid gap-1 sm:grid-cols-2">
                  {EVAL_BRANCH.map((b) => (
                    <li
                      key={b}
                      className="rounded-lg border border-emerald-100 bg-emerald-50/60 px-2 py-1.5 text-[11px] font-medium text-emerald-900"
                    >
                      {b}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
