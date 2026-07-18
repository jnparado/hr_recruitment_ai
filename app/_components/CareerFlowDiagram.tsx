import {
  CANDIDATE_FLOW_STEPS,
  FlowDiagram,
} from "@/app/_components/FlowDiagram";

export function CareerFlowDiagram() {
  return (
    <FlowDiagram
      title="Voice screening pipeline"
      steps={[...CANDIDATE_FLOW_STEPS]}
      highlightSteps={["Voice Interview", "Cursor AI", "Recruiter Dashboard"]}
      accent="indigo"
    />
  );
}
