export interface SkillGap {
  skill: string;
  importance: "critical" | "important" | "nice-to-have";
  note: string;
}

export interface ScreeningResult {
  fileName: string;
  candidateName: string;
  email: string;
  currentRole: string;
  yearsOfExperience: number;
  matchScore: number;
  recommendation: "strong_match" | "good_match" | "possible_match" | "not_a_match";
  summary: string;
  matchedSkills: string[];
  skillGaps: SkillGap[];
  strengths: string[];
  error?: string;
}

export interface ChatMessage {
  role: "assistant" | "user";
  content: string;
}

export interface InterviewSetup {
  candidateName: string;
  jobTitle: string;
  jobDescription: string;
}

export interface InterviewEvaluation {
  overallScore: number;
  recommendation: "advance" | "maybe" | "reject";
  recommendationReason: string;
  scores: {
    experience: number;
    skills: number;
    communication: number;
    roleFit: number;
  };
  salaryExpectation: string;
  availability: string;
  keyHighlights: string[];
  concerns: string[];
}
