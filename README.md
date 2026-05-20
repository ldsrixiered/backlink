# Backlink Desk Web App

Backlink Desk is a local web application for backlink outreach.

## Run

```powershell
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

## CSV Columns

```text
Domain,Prospect URL,Contact Email,Contact Name,Niche,DR,Status,Last Contacted,Next Follow Up,Target URL,Anchor,Live Backlink URL,Link Status,Follow Up Count,Notes,Draft
```
