# n8n Workflow Setup

When a candidate applies on `/careers`, the app:

1. Uploads the PDF to **Supabase Storage** (`upload_resume` bucket)
2. Saves the application to **Supabase DB** (`applications` table)
3. POSTs to **`N8N_WEBHOOK_URL`** with the application payload

## n8n workflow nodes (recommended order)

```
Webhook (trigger)
  ↓
HTTP Request → POST /api/webhooks/n8n/process
  ↓                          (AI parse + match + score + save)
HTTP Request → POST /api/webhooks/n8n/rank
  ↓                          (rank candidates for job)
HTTP Request → POST /api/webhooks/n8n/notify
  ↓                          (get recruiter email payload)
Gmail / SendGrid             (send email to recruiter)
  ↓
IF score >= 50
  ↓
HTTP Request → POST /api/webhooks/n8n/schedule
  ↓                          (save interview + calendar payload)
Google Calendar              (create event)
  ↓
Wait until 24h before
  ↓
Gmail / SendGrid             (send reminder to candidate)
```

## Webhook authentication

Set `N8N_WEBHOOK_SECRET` in `.env.local` and add header on every HTTP Request node:

```
X-Webhook-Secret: your-shared-webhook-secret
```

## Process endpoint

```http
POST /api/webhooks/n8n/process
Content-Type: application/json

{ "applicationId": "<uuid from apply response>" }
```

Returns: parsed candidate (name, skills, experience, education, certificates) + match score.

## Rank endpoint

```http
POST /api/webhooks/n8n/rank
{ "jobId": "<uuid>", "jobTitle": "Senior Software Engineer" }
```

## Notify endpoint

```http
POST /api/webhooks/n8n/notify
{ "applicationId": "<uuid>", "matchScore": 85, "rank": 1 }
```

Returns email `to`, `subject`, `body` for your email node.

## Schedule endpoint

```http
POST /api/webhooks/n8n/schedule
{
  "applicationId": "<uuid>",
  "scheduledDate": "2026-07-25",
  "scheduledTime": "10:00 AM",
  "format": "video",
  "calendarEventId": "<from Google Calendar node>"
}
```

Returns Google Calendar payload + reminder email content.

## Environment variables

```bash
N8N_WEBHOOK_URL=https://your-n8n.app/webhook/application-received
N8N_WEBHOOK_SECRET=your-secret
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
RECRUITER_EMAIL=recruiter@company.com
```
