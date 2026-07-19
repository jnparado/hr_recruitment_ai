import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Interview Room",
  description: "Secure first-stage AI interview for invited candidates.",
};

export default function AiInterviewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-[70vh] bg-[radial-gradient(ellipse_at_top,_#eef2ff_0%,_#ffffff_50%)]">
      {children}
    </div>
  );
}
