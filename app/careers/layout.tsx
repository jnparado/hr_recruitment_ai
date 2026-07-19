import type { Metadata } from "next";
import { COMPANY } from "@/lib/career-site";

export const metadata: Metadata = {
  title: `Careers — ${COMPANY.name}`,
  description: `${COMPANY.tagline} Browse open roles, apply with your resume, and track your application.`,
};

/** Candidate-only Career Website shell (header handled by SiteHeader public mode). */
export default function CareersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-[radial-gradient(ellipse_at_top,_#eef2ff_0%,_#ffffff_45%,_#f8fafc_100%)]">
      {children}
    </div>
  );
}
