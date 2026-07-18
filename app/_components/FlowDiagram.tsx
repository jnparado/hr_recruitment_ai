type FlowDiagramProps = {
  title: string;
  steps: string[];
  /** Highlights the current step (bold + accent ring) */
  activeStep?: string;
  /** Extra emphasis on key pipeline stages */
  highlightSteps?: string[];
  /** default = full card · compact = inline bar · minimal = text-only breadcrumb */
  variant?: "default" | "compact" | "minimal";
  /** indigo for candidate flow · slate for recruiter tools */
  accent?: "indigo" | "emerald" | "slate";
};

const accentStyles = {
  indigo: {
    ring: "ring-indigo-200",
    active: "border-indigo-400 bg-indigo-600 text-white shadow-md shadow-indigo-200",
    highlight: "border-indigo-200 bg-indigo-50 text-indigo-900",
    number: "bg-indigo-100 text-indigo-700",
    line: "from-indigo-200 via-slate-200 to-indigo-200",
    arrow: "text-indigo-300",
    dot: "bg-indigo-500",
  },
  emerald: {
    ring: "ring-emerald-200",
    active: "border-emerald-400 bg-emerald-600 text-white shadow-md shadow-emerald-200",
    highlight: "border-emerald-200 bg-emerald-50 text-emerald-900",
    number: "bg-emerald-100 text-emerald-700",
    line: "from-emerald-200 via-slate-200 to-emerald-200",
    arrow: "text-emerald-300",
    dot: "bg-emerald-500",
  },
  slate: {
    ring: "ring-slate-200",
    active: "border-slate-500 bg-slate-800 text-white shadow-md shadow-slate-200",
    highlight: "border-slate-200 bg-slate-50 text-slate-800",
    number: "bg-slate-100 text-slate-600",
    line: "from-slate-200 via-slate-100 to-slate-200",
    arrow: "text-slate-300",
    dot: "bg-slate-400",
  },
};

function stepClass(
  step: string,
  activeStep: string | undefined,
  highlightSteps: string[],
  styles: (typeof accentStyles)["indigo"]
) {
  if (activeStep === step) return styles.active;
  if (highlightSteps.includes(step)) return styles.highlight;
  return "border-slate-200 bg-white text-slate-700";
}

function Arrow({ className }: { className: string }) {
  return (
    <svg
      className={`h-4 w-4 shrink-0 ${className}`}
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden
    >
      <path
        d="M3 8h10M9 4l4 4-4 4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function FlowDiagram({
  title,
  steps,
  activeStep,
  highlightSteps = [],
  variant = "default",
  accent = "indigo",
}: FlowDiagramProps) {
  const styles = accentStyles[accent];
  const isMinimal = variant === "minimal";
  const isCompact = variant === "compact";

  if (isMinimal) {
    return (
      <nav aria-label={title} className="flex flex-wrap items-center justify-center gap-x-1 gap-y-1 text-xs text-slate-500">
        {steps.map((step, i) => (
          <span key={step} className="inline-flex items-center gap-1">
            <span
              className={
                activeStep === step
                  ? "font-semibold text-indigo-600"
                  : highlightSteps.includes(step)
                    ? "font-medium text-slate-700"
                    : ""
              }
            >
              {step}
            </span>
            {i < steps.length - 1 && <Arrow className="text-slate-300" />}
          </span>
        ))}
      </nav>
    );
  }

  const wrapperClass = isCompact
    ? "rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3"
    : "rounded-2xl border border-slate-200 bg-gradient-to-b from-white to-slate-50/80 p-6 shadow-sm";

  return (
    <section className={wrapperClass}>
      <h2
        className={`text-center font-semibold uppercase tracking-wider text-slate-500 ${
          isCompact ? "text-[10px]" : "text-xs"
        }`}
      >
        {title}
      </h2>

      {/* Desktop & tablet — horizontal, no wrap */}
      <div className={`${isCompact ? "mt-2" : "mt-5"} hidden sm:block`}>
        <div className="relative mx-auto max-w-full overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="relative mx-auto flex min-w-max items-center justify-center gap-0 px-2">
            <div
              className={`pointer-events-none absolute left-8 right-8 top-1/2 h-px -translate-y-1/2 bg-gradient-to-r ${styles.line}`}
              aria-hidden
            />
            {steps.map((step, i) => (
              <div key={step} className="relative flex items-center">
                <div
                  className={`relative z-10 flex flex-col items-center gap-1.5 px-1 ${activeStep === step ? `rounded-xl ring-2 ${styles.ring}` : ""}`}
                >
                  {!isCompact && (
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${styles.number}`}
                    >
                      {i + 1}
                    </span>
                  )}
                  <span
                    className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-center font-medium shadow-sm transition ${isCompact ? "text-[11px]" : "text-xs sm:text-sm"} ${stepClass(step, activeStep, highlightSteps, styles)}`}
                  >
                    {step}
                  </span>
                </div>
                {i < steps.length - 1 && (
                  <Arrow className={`mx-0.5 ${styles.arrow}`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile — vertical timeline */}
      <ol className={`${isCompact ? "mt-2" : "mt-5"} space-y-0 sm:hidden`}>
        {steps.map((step, i) => (
          <li key={step} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${styles.number} ${activeStep === step ? `ring-2 ${styles.ring}` : ""}`}
              >
                {i + 1}
              </span>
              {i < steps.length - 1 && (
                <span className="my-1 w-px flex-1 min-h-[12px] bg-slate-200" aria-hidden />
              )}
            </div>
            <div className={`flex-1 ${i < steps.length - 1 ? "pb-3" : ""}`}>
              <span
                className={`inline-flex w-full items-center rounded-xl border px-3 py-2 text-sm font-medium shadow-sm ${stepClass(step, activeStep, highlightSteps, styles)}`}
              >
                {step}
              </span>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

export const CANDIDATE_FLOW_STEPS = [
  "Candidate Applies",
  "AI Calls Candidate",
  "Voice Interview",
  "Speech to Text",
  "Grok AI",
  "Evaluate Answers",
  "Score",
  "Recruiter Dashboard",
] as const;

export const RECRUITER_FLOW_STEPS = [
  "Resume Received",
  "AI Extracts",
  "Matches Jobs",
  "Ranks Candidates",
  "Schedules Interviews",
  "Recruiter Report",
] as const;
