import {
  CANDIDATE_FLOW_STEPS,
  FlowDiagram,
} from "@/app/_components/FlowDiagram";

/** Highlighted stages match the light-blue pills in the Candidate Application Flow diagram */
export const CANDIDATE_HIGHLIGHT_STEPS = [
  "Voice Interview",
  "Speech to Text",
  "Recruiter Dashboard",
] as const;

type CandidateFlowDiagramProps = {
  /** Current step label from CANDIDATE_FLOW_STEPS */
  activeStep?: string;
  variant?: "default" | "compact" | "minimal";
};

/** Candidate-only application flow — Applies → … → Recruiter Dashboard */
export function CandidateFlowDiagram({
  activeStep,
  variant = "default",
}: CandidateFlowDiagramProps) {
  return (
    <FlowDiagram
      title="Candidate application flow"
      steps={[...CANDIDATE_FLOW_STEPS]}
      activeStep={activeStep}
      highlightSteps={[...CANDIDATE_HIGHLIGHT_STEPS]}
      accent="indigo"
      variant={variant}
    />
  );
}

/** @deprecated Use CandidateFlowDiagram */
export function CareerFlowDiagram(props: CandidateFlowDiagramProps) {
  return <CandidateFlowDiagram {...props} />;
}
