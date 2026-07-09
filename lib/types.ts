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
  storagePath?: string;
  storageUrl?: string;
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

// --- Recruitment pipeline ---

export interface ExperienceEntry {
  role: string;
  company: string;
  duration: string;
  highlights: string[];
}

export interface CertificateEntry {
  name: string;
  issuer: string;
  year: string;
}

export interface ExtractedResume {
  fileName: string;
  candidateName: string;
  email: string;
  phone: string;
  currentRole: string;
  yearsOfExperience: number;
  skills: string[];
  experience: ExperienceEntry[];
  certificates: CertificateEntry[];
  storagePath?: string;
  storageUrl?: string;
  error?: string;
}

export interface StoredResumeRecord {
  fileName: string;
  storagePath: string;
  storageUrl: string;
  error?: string;
}

export interface JobOpening {
  id: string;
  title: string;
  description: string;
}

export interface CandidateJobMatch {
  jobId: string;
  jobTitle: string;
  matchScore: number;
  matchedSkills: string[];
  skillGaps: SkillGap[];
  fitSummary: string;
}

export interface RankedCandidate extends ExtractedResume {
  rank: number;
  bestMatch: CandidateJobMatch;
  allMatches: CandidateJobMatch[];
}

export interface InterviewSchedule {
  candidateName: string;
  candidateEmail: string;
  jobTitle: string;
  proposedDate: string;
  proposedTime: string;
  format: "video" | "phone" | "in-person";
  durationMinutes: number;
  notes: string;
}

export interface RecruiterReport {
  generatedAt: string;
  primaryJobTitle: string;
  totalResumes: number;
  qualifiedCount: number;
  executiveSummary: string;
  topCandidates: {
    name: string;
    rank: number;
    score: number;
    recommendation: string;
    keyStrength: string;
  }[];
  interviewSchedule: InterviewSchedule[];
  actionItems: string[];
  riskFlags: string[];
}

export type PipelineStage =
  | "received"
  | "extracting"
  | "matching"
  | "ranking"
  | "scheduling"
  | "report";

export interface PipelineResult {
  stage: "complete";
  stored: StoredResumeRecord[];
  extractions: ExtractedResume[];
  ranked: RankedCandidate[];
  schedule: InterviewSchedule[];
  report: RecruiterReport;
}
