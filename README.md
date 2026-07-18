# HR Process — AI Recruitment Suite

An HR/recruitment web app powered by [OpenAI](https://openai.com). Built with Next.js and Tailwind CSS.

## Features

### Recruitment Pipeline (`/pipeline`) — **recommended**

End-to-end hiring automation in a single run:

1. **Resume Received** — upload up to 10 resumes (PDF, DOCX, TXT)
2. **AI Extracts** — skills, work experience, and certificates from each resume
3. **Matches Jobs** — scores fit against one or more job openings
4. **Ranks Candidates** — orders the pool by best match score
5. **Schedules Interviews** — proposes interview slots for qualified candidates (≥50 score)
6. **Recruiter Report** — executive summary, top candidates, action items, and risk flags

### AI Resume Screening (`/screening`)

- Reads resumes in **PDF, DOCX, and TXT** formats (up to 10 per batch)
- Matches each resume against a pasted **job description**
- **Ranks candidates** with a 0–100 match score and a recommendation tier
- **Detects skill gaps** (critical / important / nice-to-have) plus matched skills and strengths

### AI Interview Assistant (`/interview`)

- OpenAI conducts a first screening interview, one question at a time, covering:
  - Experience
  - Skills
  - Salary expectations
  - Availability
- **Voice interviews**: OpenAI speaks each question aloud (TTS) and transcribes the candidate's spoken answers (Whisper) — with typed answers always available as a fallback
- Ends with a **candidate score + recommendation** (advance / maybe / reject), sub-scores for experience, skills, communication, and role fit, plus highlights, concerns, and the full transcript

## Getting started

1. Install dependencies:

```bash
npm install
```

2. Configure your OpenAI API key (get one at [platform.openai.com](https://platform.openai.com/api-keys)):

```bash
cp .env.example .env.local
# then edit .env.local and set OPENAI_API_KEY
```

3. Run the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Configuration

| Variable            | Required | Description                                              |
| ------------------- | -------- | -------------------------------------------------------- |
| `OPENAI_API_KEY`    | Yes      | Your OpenAI API key                                      |
| `OPENAI_MODEL`      | No       | Chat model (defaults to `gpt-4o`)                        |
| `OPENAI_TTS_VOICE`  | No       | TTS voice (defaults to `nova`)                           |
| `OPENAI_TTS_MODEL`  | No       | TTS model (defaults to `tts-1`)                          |
| `OPENAI_STT_MODEL`  | No       | Transcription model (defaults to `whisper-1`)            |

## Tech stack

- **Next.js 16** (App Router, Route Handlers)
- **Tailwind CSS 4**
- **OpenAI API** — chat completions with JSON mode for structured output
- **OpenAI TTS & Whisper** for voice interviews, proxied through Next.js route handlers
- **unpdf** for PDF text extraction, **mammoth** for DOCX
