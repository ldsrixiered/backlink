# Backlink Prospect Manager

A local Node.js + Express + React app for importing SEMrush backlink exports, filtering good SEO outreach prospects, deduplicating domains, and saving them to both Google Sheets and a Notion database.

## Features

- Upload SEMrush CSV exports
- Parse domain, URL, authority, backlink, anchor, country, and date fields
- Filter weak or spammy backlink opportunities
- Deduplicate by domain
- Auto-tag niche categories with OpenAI when configured, with a local fallback
- Detect local SEO opportunities
- Save qualified prospects to Google Sheets
- Save the same prospects to Notion
- Track outreach status: New, Contacted, Replied, Won, Rejected
- Search, status filter, CSV export, and dark/light mode
- Optional Hunter.io email finding service

## Project Structure

```text
backend/
  src/
    config/
    data/
    middleware/
    routes/
    services/
    utils/
frontend/
  src/
    components/
    lib/
```

## Install

```powershell
npm run install:all
```

## Configure

Copy `.env.example` to `.env` in the project root or to `backend/.env`.

```powershell
copy .env.example .env
```

Fill in only the integrations you want to use. The app still imports and filters CSV files without Google, Notion, Hunter, or OpenAI keys.

## Google Sheets API Setup

1. Go to Google Cloud Console.
2. Create or select a project.
3. Enable **Google Sheets API**.
4. Create a **Service Account**.
5. Create a JSON key for that service account.
6. Put these values into `.env`:

```env
GOOGLE_SHEETS_SPREADSHEET_ID=your-sheet-id
GOOGLE_SERVICE_ACCOUNT_EMAIL=service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_SHEETS_RANGE=Prospects!A:H
```

7. Share the Google Sheet with the service account email as an editor.
8. Add this header row to the sheet:

```text
Domain,URL,Authority Score,Category,Outreach Status,Contacted,Notes,Date Added
```

## Notion API Setup

1. Create a Notion integration at `https://www.notion.so/my-integrations`.
2. Copy the internal integration token into:

```env
NOTION_TOKEN=secret_xxx
```

3. Create a Notion database with these properties:

```text
Domain            title
URL               url
Authority Score   number
Category          select
Outreach Status   select
Contacted         checkbox
Notes             rich_text
Date Added        date
```

4. Share the database with your integration.
5. Copy the database ID into:

```env
NOTION_DATABASE_ID=your-database-id
```

## Optional OpenAI Setup

Add:

```env
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4.1-mini
```

When configured, OpenAI is used to assign categories such as `medspa`, `skincare`, `beauty`, `health`, and `wellness`.

## Optional Hunter.io Setup

Add:

```env
HUNTER_API_KEY=your-hunter-key
```

The backend includes a Hunter service and endpoint for later UI expansion.

## Run

Start the backend:

```powershell
npm run dev
```

Start the frontend in a second terminal:

```powershell
npm run dev:frontend
```

Open:

```text
http://localhost:5173
```

## Run As One Web App

For a production-style local run, build the React app and let Express serve it:

```powershell
npm run build
npm start
```

Open:

```text
http://localhost:4173
```

In this mode the frontend and backend use the same domain. That is the same setup you want for hosting online.

## Push To GitHub

From the project folder:

```powershell
git init
git add .
git commit -m "Build backlink prospect manager"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO.git
git push -u origin main
```

Do not commit `.env`. It is already ignored by `.gitignore`.

## Deploy Online

The easiest single-service deployment is Render, Railway, or Fly.io because this app has a Node backend and a React frontend.

GitHub is where the code lives. The live public URL comes from a Node host such as Render. GitHub Pages will not work for this full app because it cannot run the Express API.

### Render

This repo includes `render.yaml`, `.nvmrc`, and `Procfile`.

Use these settings if creating the service manually:

```text
Build Command: npm install --include=dev && npm run build
Start Command: npm start
```

Add your environment variables in the Render dashboard:

```env
NODE_ENV=production
GOOGLE_SHEETS_SPREADSHEET_ID=...
GOOGLE_SHEETS_RANGE=Prospects!A:H
GOOGLE_SERVICE_ACCOUNT_EMAIL=...
GOOGLE_PRIVATE_KEY=...
NOTION_TOKEN=...
NOTION_DATABASE_ID=...
OPENAI_API_KEY=...
HUNTER_API_KEY=...
```

For `GOOGLE_PRIVATE_KEY`, keep the `\n` line breaks exactly as shown in your service account key.

More detailed deployment steps are in `DEPLOYMENT.md`.

### Important Hosting Note

The app currently stores imported prospects in `backend/data/prospects.json`. That is fine locally, but many free hosting services can reset local files after redeploys. Google Sheets and Notion will still receive synced rows when configured. For long-term online storage inside the app dashboard, add a database such as Supabase, Postgres, or Firebase.

## SEMrush CSV Columns Supported

- Domain
- URL
- Authority Score
- Backlinks
- Referring Domains
- Anchor Text
- Country
- First Seen
- Last Seen
- Spam Score, if available

## Filtering Rules

Prospects are kept when:

- Authority Score is at least 20
- Spam score is low when present
- Domain is not duplicated
- Domain does not use blocked TLDs like `.xyz` or `.ru`
- Domain and URL do not match adult, casino, or crypto spam terms
- Country/language signal is English-friendly when available

## Production Notes

This is built as a local app. For production, add authentication, rate limiting, persistent database storage, and a proper secret manager.
