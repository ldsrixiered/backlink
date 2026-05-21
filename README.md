# Backlink Desk Web App

Backlink Desk is a local web application for backlink outreach.

## Run

```powershell
node -e "require('fs').existsSync('node_modules') || console.log('Run npm install first')"
npm install
node server.js
```

Then open:

```text
http://localhost:4173
```

## What It Does

- Tracks backlink prospects
- Generates outreach email drafts
- Calculates next follow-up dates
- Stores data in your browser with `localStorage`
- Imports and exports CSV files
- Checks a live backlink URL from the local Node backend
- Detects `dofollow` and `nofollow`
- Sends outreach emails automatically when SMTP is configured

## Automatic Email Setup

Create a `.env` file or set these environment variables in your hosting dashboard:

```text
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM="DC / dr. croley <your-email@gmail.com>"
```

For Gmail, use an app password, not your normal Gmail password.

## CSV Columns

```text
Domain,Prospect URL,Contact Email,Contact Name,Niche,DR,Status,Last Contacted,Next Follow Up,Target URL,Anchor,Live Backlink URL,Link Status,Follow Up Count,Notes,Draft
```
