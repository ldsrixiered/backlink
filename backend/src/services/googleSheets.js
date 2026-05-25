import { google } from 'googleapis';
import { config } from '../config/env.js';

export async function appendRowsToSheet(prospects) {
  if (!prospects.length) return { enabled: false, saved: 0, message: 'No new prospects.' };
  if (!config.google.spreadsheetId || !config.google.clientEmail || !config.google.privateKey) {
    return { enabled: false, saved: 0, message: 'Google Sheets is not configured.' };
  }

  const sheets = await getSheetsClient();
  const values = prospects.map((item) => [
    item.domain,
    item.url,
    item.authorityScore,
    item.category,
    item.outreachStatus,
    item.contacted ? 'Yes' : 'No',
    item.notes,
    item.dateAdded
  ]);

  await sheets.spreadsheets.values.append({
    spreadsheetId: config.google.spreadsheetId,
    range: config.google.range,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values }
  });

  return { enabled: true, saved: prospects.length };
}

async function getSheetsClient() {
  const auth = new google.auth.JWT({
    email: config.google.clientEmail,
    key: config.google.privateKey,
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
  });

  return google.sheets({ version: 'v4', auth });
}
