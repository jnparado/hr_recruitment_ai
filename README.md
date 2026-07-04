# HR Process — AI Recruitment Suite

An HR/recruitment web app powered by [Grok](https://x.ai) (xAI). Built with Next.js and Tailwind CSS.

## Features

### AI Resume Screening (`/screening`)

- Reads resumes in **PDF, DOCX, and TXT** formats (up to 10 per batch)
- Matches each resume against a pasted **job description**
- **Ranks candidates** with a 0–100 match score and a recommendation tier
- **Detects skill gaps** (critical / important / nice-to-have) plus matched skills and strengths

### AI Interview Assistant (`/interview`)

- Grok conducts a first screening interview, one question at a time, covering:
  - Experience
  - Skills
  - Salary expectations
  - Availability
- Ends with a **candidate score + recommendation** (advance / maybe / reject), sub-scores for experience, skills, communication, and role fit, plus highlights, concerns, and the full transcript

## Getting started

1. Install dependencies:

```bash
npm install
```

2. Configure your xAI API key (get one at [console.x.ai](https://console.x.ai)):

```bash
cp .env.example .env.local
# then edit .env.local and set XAI_API_KEY
```

3. Run the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Configuration

| Variable      | Required | Description                                  |
| ------------- | -------- | -------------------------------------------- |
| `XAI_API_KEY` | Yes      | Your xAI API key                              |
| `GROK_MODEL`  | No       | Grok model to use (defaults to `grok-4.3`)    |

## Tech stack

- **Next.js 16** (App Router, Route Handlers)
- **Tailwind CSS 4**
- **Grok via the xAI API** (OpenAI-compatible endpoint, JSON mode for structured output)
- **unpdf** for PDF text extraction, **mammoth** for DOCX
