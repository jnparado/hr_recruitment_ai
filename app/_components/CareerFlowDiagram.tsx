const FLOW_STEPS = [
  "Candidate Applies",
  "AI Calls Candidate",
  "Voice Interview",
  "Speech to Text",
  "Grok AI",
  "Evaluate Answers",
  "Score",
  "Recruiter Dashboard",
];

export function CareerFlowDiagram() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
        Voice screening pipeline
      </h2>
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs">
        {FLOW_STEPS.map((step, i) => (
          <span key={step} className="flex items-center gap-2">
            <span
              className={`rounded-lg px-2.5 py-1.5 font-medium shadow-sm ${
                step === "Voice Interview" || step === "Grok AI"
                  ? "border border-indigo-200 bg-indigo-50 text-indigo-800"
                  : "border border-slate-200 bg-slate-50 text-slate-700"
              }`}
            >
              {step}
            </span>
            {i < FLOW_STEPS.length - 1 && <span className="text-slate-300">↓</span>}
          </span>
        ))}
      </div>
    </div>
  );
}
