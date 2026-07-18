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
  applicationId?: string;
}

export interface DashboardCandidate {
  applicationId: string;
  candidateName: string;
  email: string;
  jobTitle: string;
  status: string;
  resumeMatchScore: number | null;
  rank: number | null;
  interviewScore: number | null;
  recommendation: string | null;
  appliedAt: string;
  interviewCompletedAt: string | null;
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

export interface EducationEntry {
  degree: string;
  institution: string;
  year: string;
  field: string;
}

export interface ParsedCandidate {
  name: string;
  email: string;
  phone: string;
  currentRole: string;
  yearsOfExperience: number;
  skills: string[];
  experience: ExperienceEntry[];
  education: EducationEntry[];
  certificates: CertificateEntry[];
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
  education: EducationEntry[];
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

export interface DbJob {
  id: string;
  title: string;
  department: string;
  location: string;
  type: string;
  description: string;
  requirements: string;
  active: boolean;
  created_at: string;
}

export interface StoredFileRecord {
  fileName: string;
  storagePath: string;
  storageUrl: string;
}

export interface DbApplication {
  id: string;
  job_id: string | null;
  job_title: string;
  applicant_name: string;
  applicant_email: string;
  resume_path: string;
  resume_url: string;
  certificate_files: StoredFileRecord[];
  status: string;
  match_score: number | null;
  rank: number | null;
  created_at: string;
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
