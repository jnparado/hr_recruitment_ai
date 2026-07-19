import { redirect } from "next/navigation";

/** Legacy AI Insights route → AI Features hub */
export default function InsightsRedirect() {
  redirect("/dashboard/ai");
}
