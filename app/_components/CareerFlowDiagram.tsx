import {
  CANDIDATE_FLOW_STEPS,
  FlowDiagram,
} from "@/app/_components/FlowDiagram";

/** Highlighted stages for the voice screening flow */
export const CANDIDATE_HIGHLIGHT_STEPS = [
  "Voice Interview",
  "Speech to Text",
  "Recruiter Dashboard",
] as const;

type CandidateFlowDiagramProps = {
  activeStep?: string;
  variant?: "default" | "compact" | "minimal";
};

/** Voice screening flow — Applies → AI call → Score → Recruiter Dashboard */
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
