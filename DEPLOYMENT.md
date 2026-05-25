# Deploy As A Live Website

This app must be deployed to a Node.js web host because it has an Express backend. GitHub Pages will not work for the full app because GitHub Pages can only host static frontend files.

## Recommended: Render

1. Push this project to GitHub.
2. Go to Render and create a new **Blueprint** from this repository, or create a new **Web Service** manually.
3. Use these settings:

```text
Environment: Node
Build Command: npm install --include=dev && npm run build
Start Command: npm start
```

4. Add environment variables in Render:

```env
NODE_ENV=production
GOOGLE_SHEETS_SPREADSHEET_ID=...
GOOGLE_SHEETS_RANGE=Prospects!A:H
GOOGLE_SERVICE_ACCOUNT_EMAIL=...
GOOGLE_PRIVATE_KEY=...
NOTION_TOKEN=...
NOTION_DATABASE_ID=...
OPENAI_API_KEY=...
OPENAI_MODEL=gpt-4.1-mini
HUNTER_API_KEY=...
```

5. Deploy. Render will give you a public URL like:

```text
https://backlink-prospect-manager.onrender.com
```

That URL serves both the dashboard and the backend API.

## How The Live Site Works

The deployed app uses one domain:

```text
https://your-live-url.com
https://your-live-url.com/api/health
https://your-live-url.com/api/prospects
```

The React frontend calls `/api`, so it works correctly on the public URL without pointing to `localhost`.

## Not For GitHub Pages

Do not deploy this full app to GitHub Pages. GitHub Pages cannot run:

- Express
- CSV upload API
- Google Sheets API calls
- Notion API calls
- OpenAI or Hunter.io server-side keys

Use Render, Railway, Fly.io, or another Node.js host.
