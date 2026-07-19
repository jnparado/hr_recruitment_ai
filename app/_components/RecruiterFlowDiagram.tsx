import {
  FlowDiagram,
  RECRUITER_FLOW_STEPS,
} from "@/app/_components/FlowDiagram";
import { RecruiterDecisionFlow } from "@/app/_components/RecruiterDecisionFlow";
import type { PipelineStage } from "@/lib/types";

/** AI-highlighted stages for the batch pipeline tool */
export const RECRUITER_HIGHLIGHT_STEPS = [
  "AI Extracts",
  "Ranks Candidates",
  "Recruiter Report",
] as const;

const STAGE_TO_STEP: Record<PipelineStage, (typeof RECRUITER_FLOW_STEPS)[number]> = {
  received: "Resume Received",
  extracting: "AI Extracts",
  matching: "Matches Jobs",
  ranking: "Ranks Candidates",
  scheduling: "Schedules Interviews",
  report: "Recruiter Report",
};

export function pipelineStageToStep(
  stage: PipelineStage
): (typeof RECRUITER_FLOW_STEPS)[number] {
  return STAGE_TO_STEP[stage];
}

type RecruiterFlowDiagramProps = {
  activeStep?: string;
  variant?: "default" | "compact" | "minimal";
};

/** Batch pipeline tool flow (used on /pipeline). */
export function RecruiterFlowDiagram({
  activeStep,
  variant = "default",
}: RecruiterFlowDiagramProps) {
  return (
    <FlowDiagram
      title="Recruiter tools"
      steps={[...RECRUITER_FLOW_STEPS]}
      activeStep={activeStep}
      highlightSteps={[...RECRUITER_HIGHLIGHT_STEPS]}
      accent="emerald"
      variant={variant}
    />
  );
}

export { RecruiterDecisionFlow };
