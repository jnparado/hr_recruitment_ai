import { supabaseAdmin } from "@/lib/supabase";
import type { ChatMessage, DashboardCandidate, DbApplication, DbJob, EducationEntry, InterviewEvaluation, ParsedCandidate } from "@/lib/types";

export type { DbJob, DbApplication, EducationEntry };

export async function listJobs(): Promise<DbJob[]> {
  const { data, error } = await supabaseAdmin()
    .from("jobs")
    .select("*")
    .eq("active", true)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as DbJob[];
}

/** All jobs for recruiter admin (open, closed, archived). */
export async function listAllJobs(): Promise<DbJob[]> {
  const { data, error } = await supabaseAdmin()
    .from("jobs")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as DbJob[];
}

export async function getJob(id: string): Promise<DbJob | null> {
  const { data, error } = await supabaseAdmin()
    .from("jobs")
    .select("*")
    .eq("id", id)
    .single();
  if (error) return null;
  return data as DbJob;
}

export async function createJob(input: {
  title: string;
  department: string;
  location: string;
  type: string;
  description: string;
  requirements: string;
}): Promise<DbJob> {
  const base = {
    title: input.title,
    department: input.department,
    location: input.location,
    type: input.type,
    description: input.description,
    requirements: input.requirements,
    active: true,
  };

  let { data, error } = await supabaseAdmin()
    .from("jobs")
    .insert({ ...base, status: "open" })
    .select()
    .single();

  if (error && /status/i.test(error.message)) {
    ({ data, error } = await supabaseAdmin().from("jobs").insert(base).select().single());
  }
  if (error) throw new Error(error.message);
  return data as DbJob;
}

export async function updateJob(
  id: string,
  input: Partial<{
    title: string;
    department: string;
    location: string;
    type: string;
    description: string;
    requirements: string;
    active: boolean;
    status: "open" | "closed" | "archived";
  }>
): Promise<DbJob> {
  const patch: Record<string, unknown> = { ...input };
  if (input.status === "open") patch.active = true;
  if (input.status === "closed" || input.status === "archived") patch.active = false;
  if (input.active === true) patch.status = "open";
  if (input.active === false && !input.status) patch.status = "closed";
  patch.updated_at = new Date().toISOString();

  let { data, error } = await supabaseAdmin()
    .from("jobs")
    .update(patch)
    .eq("id", id)
    .select()
    .single();

  if (error && /(status|updated_at)/i.test(error.message)) {
    const fallback: Record<string, unknown> = { ...input };
    delete fallback.status;
    delete fallback.updated_at;
    if (input.status === "open") fallback.active = true;
    if (input.status === "closed" || input.status === "archived") fallback.active = false;
    ({ data, error } = await supabaseAdmin()
      .from("jobs")
      .update(fallback)
      .eq("id", id)
      .select()
      .single());
  }
  if (error) throw new Error(error.message);
  return data as DbJob;
}

export async function updateApplicationNotesTags(
  id: string,
  input: { notes?: string; tags?: string[] }
): Promise<void> {
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (input.notes !== undefined) patch.notes = input.notes;
  if (input.tags !== undefined) patch.tags = input.tags;
  const { error } = await supabaseAdmin().from("applications").update(patch).eq("id", id);
  if (error) {
    if (/(notes|tags)/i.test(error.message)) {
      throw new Error(
        "Notes/tags columns missing. Run supabase/migrations/20260719000000_ai_interview_and_jobs.sql"
      );
    }
    throw new Error(error.message);
  }
}

export async function createApplication(input: {
  jobId: string | null;
  jobTitle: string;
  applicantName: string;
  applicantEmail: string;
  resumePath: string;
  resumeUrl: string;
}): Promise<DbApplication> {
  const { data, error } = await supabaseAdmin()
    .from("applications")
    .insert({
      job_id: input.jobId,
      job_title: input.jobTitle,
      applicant_name: input.applicantName,
      applicant_email: input.applicantEmail,
      resume_path: input.resumePath,
      resume_url: input.resumeUrl,
      status: "received",
    })
    .select()
    .single();
  if (error) throw new Error(error.message);

  const app = data as DbApplication;
  // Stub candidate row immediately; AI parsing enriches it later.
  await ensureCandidateStub(app);
  return app;
}

/** Minimal candidates row from application form data (before resume parse). */
export async function ensureCandidateStub(application: {
  id: string;
  applicant_name: string;
  applicant_email: string;
}): Promise<void> {
  const { data: existing } = await supabaseAdmin()
    .from("candidates")
    .select("id")
    .eq("application_id", application.id)
    .maybeSingle();
  if (existing) return;

  const { error } = await supabaseAdmin().from("candidates").insert({
    application_id: application.id,
    name: application.applicant_name,
    email: application.applicant_email,
    phone: "",
    current_role: "",
    years_of_experience: 0,
    skills: [],
    experience: [],
    education: [],
    certificates: [],
  });
  if (error && !/duplicate|unique/i.test(error.message)) {
    throw new Error(error.message);
  }
}

/** Backfill stubs for applications that never got a candidates row (parse failed / old applies). */
export async function backfillCandidateStubs(): Promise<number> {
  const { data: apps, error } = await supabaseAdmin()
    .from("applications")
    .select("id, applicant_name, applicant_email");
  if (error) throw new Error(error.message);

  const { data: cands } = await supabaseAdmin().from("candidates").select("application_id");
  const have = new Set((cands ?? []).map((c) => c.application_id as string));

  let created = 0;
  for (const app of apps ?? []) {
    if (have.has(app.id as string)) continue;
    await ensureCandidateStub({
      id: app.id as string,
      applicant_name: app.applicant_name as string,
      applicant_email: app.applicant_email as string,
    });
    created += 1;
  }
  return created;
}

export async function getApplication(id: string): Promise<DbApplication | null> {
  const { data, error } = await supabaseAdmin()
    .from("applications")
    .select("*")
    .eq("id", id)
    .single();
  if (error) return null;
  return data as DbApplication;
}

export async function saveParsedCandidate(
  applicationId: string,
  parsed: ParsedCandidate
): Promise<void> {
  const { error: candError } = await supabaseAdmin().from("candidates").upsert(
    {
      application_id: applicationId,
      name: parsed.name,
      email: parsed.email,
      phone: parsed.phone,
      current_role: parsed.currentRole,
      years_of_experience: parsed.yearsOfExperience,
      skills: parsed.skills,
      experience: parsed.experience,
      education: parsed.education,
      certificates: parsed.certificates,
      parsed_at: new Date().toISOString(),
    },
    { onConflict: "application_id" }
  );
  if (candError) throw new Error(candError.message);
}

export async function updateApplicationStatus(
  id: string,
  status: string,
  matchScore?: number,
  rank?: number
): Promise<void> {
  const patch: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  };
  if (matchScore !== undefined) patch.match_score = matchScore;
  if (rank !== undefined) patch.rank = rank;

  const { error } = await supabaseAdmin()
    .from("applications")
    .update(patch)
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function listApplicationsForJob(jobId: string): Promise<DbApplication[]> {
  const { data, error } = await supabaseAdmin()
    .from("applications")
    .select("*")
    .eq("job_id", jobId)
    .order("match_score", { ascending: false, nullsFirst: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as DbApplication[];
}

export async function listApplicationsByTitle(jobTitle: string): Promise<DbApplication[]> {
  const { data, error } = await supabaseAdmin()
    .from("applications")
    .select("*")
    .eq("job_title", jobTitle)
    .order("match_score", { ascending: false, nullsFirst: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as DbApplication[];
}

export async function rankApplicationsForJob(jobId: string): Promise<DbApplication[]> {
  const apps = await listApplicationsForJob(jobId);
  return rankApplicationList(apps);
}

export async function rankApplicationsByTitle(jobTitle: string): Promise<DbApplication[]> {
  const apps = await listApplicationsByTitle(jobTitle);
  return rankApplicationList(apps);
}

async function rankApplicationList(apps: DbApplication[]): Promise<DbApplication[]> {
  const scored = apps.filter((a) => a.match_score != null);
  scored.sort((a, b) => (b.match_score ?? 0) - (a.match_score ?? 0));

  for (let i = 0; i < scored.length; i++) {
    await updateApplicationStatus(scored[i].id, scored[i].status || "scored", scored[i].match_score!, i + 1);
    scored[i].rank = i + 1;
  }
  return scored;
}

export async function saveInterview(input: {
  applicationId: string;
  jobTitle: string;
  candidateName: string;
  candidateEmail: string;
  scheduledDate: string;
  scheduledTime: string;
  format: string;
  durationMinutes: number;
  calendarEventId?: string;
  notes?: string;
}): Promise<{ id: string }> {
  const { data, error } = await supabaseAdmin()
    .from("interviews")
    .insert({
      application_id: input.applicationId,
      job_title: input.jobTitle,
      candidate_name: input.candidateName,
      candidate_email: input.candidateEmail,
      scheduled_date: input.scheduledDate,
      scheduled_time: input.scheduledTime,
      format: input.format,
      duration_minutes: input.durationMinutes,
      calendar_event_id: input.calendarEventId ?? null,
      notes: input.notes ?? "",
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  await updateApplicationStatus(input.applicationId, "interview_scheduled");
  return { id: data.id as string };
}

export async function listScheduledInterviews() {
  const { data, error } = await supabaseAdmin()
    .from("interviews")
    .select("*")
    .order("scheduled_date", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function markReminderSent(interviewId: string): Promise<void> {
  const { error } = await supabaseAdmin()
    .from("interviews")
    .update({ reminder_sent: true })
    .eq("id", interviewId);
  if (error) throw new Error(error.message);
}

export async function saveVoiceInterviewTranscript(input: {
  applicationId: string;
  transcript: ChatMessage[];
}): Promise<void> {
  const { error: viError } = await supabaseAdmin().from("voice_interviews").upsert(
    {
      application_id: input.applicationId,
      transcript: input.transcript,
      evaluation: {},
      overall_score: 0,
      recommendation: "",
      completed_at: new Date().toISOString(),
    },
    { onConflict: "application_id" }
  );
  if (viError) throw new Error(viError.message);

  const { error: statusError } = await supabaseAdmin()
    .from("applications")
    .update({
      status: "interview_transcribed",
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.applicationId);
  if (statusError) throw new Error(statusError.message);
}

export async function saveVoiceInterview(input: {
  applicationId: string;
  transcript: ChatMessage[];
  evaluation: InterviewEvaluation;
  recordingUrl?: string;
}): Promise<void> {
  const evaluation = {
    ...input.evaluation,
    ...(input.recordingUrl ? { recordingUrl: input.recordingUrl } : {}),
  };

  const { error: viError } = await supabaseAdmin().from("voice_interviews").upsert(
    {
      application_id: input.applicationId,
      transcript: input.transcript,
      evaluation,
      overall_score: input.evaluation.overallScore,
      recommendation: input.evaluation.recommendation,
      completed_at: new Date().toISOString(),
    },
    { onConflict: "application_id" }
  );
  if (viError) throw new Error(viError.message);

  const { error: statusError } = await supabaseAdmin()
    .from("applications")
    .update({
      status: "interview_completed",
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.applicationId);
  if (statusError) throw new Error(statusError.message);
}

export async function getVoiceInterview(applicationId: string) {
  const { data, error } = await supabaseAdmin()
    .from("voice_interviews")
    .select("*")
    .eq("application_id", applicationId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function listDashboardCandidates(): Promise<DashboardCandidate[]> {
  const { data: apps, error } = await supabaseAdmin()
    .from("applications")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);

  const rows = (apps ?? []) as DbApplication[];
  if (rows.length === 0) return [];

  const ids = rows.map((a) => a.id);
  const { data: interviews } = await supabaseAdmin()
    .from("voice_interviews")
    .select("application_id, overall_score, recommendation, completed_at")
    .in("application_id", ids);

  const interviewMap = new Map(
    (interviews ?? []).map((v) => [
      v.application_id as string,
      v as { overall_score: number; recommendation: string; completed_at: string },
    ])
  );

  return rows.map((a) => {
    const vi = interviewMap.get(a.id);
    return {
      applicationId: a.id,
      candidateName: a.applicant_name,
      email: a.applicant_email,
      jobTitle: a.job_title,
      status: a.status,
      resumeMatchScore: a.match_score,
      rank: a.rank,
      interviewScore: vi?.overall_score ?? null,
      recommendation: vi?.recommendation ?? null,
      appliedAt: a.created_at,
      interviewCompletedAt: vi?.completed_at ?? null,
    };
  });
}
