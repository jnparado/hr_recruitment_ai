# n8n Workflow Setup

When a candidate applies on `/careers`, the app:

1. Uploads the PDF to **Supabase Storage** (`upload_resume` bucket)
2. Saves the application + candidate stub to **Supabase DB**
3. POSTs to **`N8N_WEBHOOK_URL`** with the webhook contract below

## Webhook contract (Postman body)

```http
POST {{N8N_WEBHOOK_URL}}
Content-Type: application/json

{
  "application_id": "7097779b-0347-49d8-b469-8ff5ea74b483",
  "candidate_id": "26795ebc-05d4-4302-bccd-518909ddf5ca",
  "job_id": "64460e72-c759-4d7a-b076-d138c85650ae",
  "resume_url": "https://….supabase.co/storage/v1/object/public/upload_resume/applications/…/resume.pdf"
}
```

Import the ready-made collection:

[`n8n/postman/candidate-application.postman_collection.json`](./postman/candidate-application.postman_collection.json)

Example test URL:

```
https://jesonparado.app.n8n.cloud/webhook-test/candidate-application
```

Production webhook (after you flip n8n from Test → Production):

```
https://jesonparado.app.n8n.cloud/webhook/candidate-application
```

Set in `.env.local` / Vercel:

```bash
N8N_WEBHOOK_URL=https://jesonparado.app.n8n.cloud/webhook/candidate-application
# Optional shared secret (also send as X-Webhook-Secret header)
N8N_WEBHOOK_SECRET=your-shared-webhook-secret
```

In n8n **Webhook** node, map:

| Field | Expression |
| --- | --- |
| Application | `{{$json.application_id}}` |
| Candidate | `{{$json.candidate_id}}` |
| Job | `{{$json.job_id}}` |
| Resume PDF | `{{$json.resume_url}}` |

The app also sends camelCase aliases (`applicationId`, `candidateId`, `jobId`, `resumeUrl`) plus `processUrl` so n8n can call back into the app.

## n8n workflow nodes (recommended order)

```
Webhook (candidate-application)
  ↓
HTTP Request → POST /api/webhooks/n8n/process
  ↓                          body: { "applicationId": "{{$json.application_id}}" }
HTTP Request → POST /api/webhooks/n8n/rank
  ↓
HTTP Request → POST /api/webhooks/n8n/notify
  ↓
Gmail / SendGrid / Resend    (recruiter email)
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

{ "applicationId": "<application_id from webhook>" }
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
N8N_WEBHOOK_URL=https://jesonparado.app.n8n.cloud/webhook/candidate-application
N8N_WEBHOOK_SECRET=your-secret
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
RECRUITER_EMAIL=recruiter@company.com
```
