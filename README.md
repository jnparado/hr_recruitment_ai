# HR Process — AI Recruitment Suite

An HR/recruitment web app powered by [Cursor](https://cursor.com). Built with Next.js and Tailwind CSS.

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

- Cursor conducts a first screening interview, one question at a time, covering:
  - Experience
  - Skills
  - Salary expectations
  - Availability
- **Voice interviews**: browser speech synthesis + speech recognition (Chrome/Edge recommended)
- Ends with a **candidate score + recommendation** (advance / maybe / reject)

## Getting started

1. Install dependencies:

```bash
npm install
```

2. Configure your Cursor API key ([cursor.com/dashboard/integrations](https://cursor.com/dashboard/integrations)):

```bash
cp .env.example .env.local
# then edit .env.local and set CURSOR_API_KEY
```

3. Run the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Configuration

| Variable          | Required | Description                              |
| ----------------- | -------- | ---------------------------------------- |
| `CURSOR_API_KEY`  | Yes      | Your Cursor API key                      |
| `CURSOR_MODEL`    | No       | Cursor model (defaults to `composer-2.5`) |

## Tech stack

- **Next.js 16** (App Router, Route Handlers)
- **Tailwind CSS 4**
- **Cursor Cloud Agents API** for AI screening, parsing, and interviews
- **Browser Web Speech API** for voice interviews
- **unpdf** for PDF text extraction, **mammoth** for DOCX
