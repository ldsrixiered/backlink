import { Client } from '@notionhq/client';
import { config } from '../config/env.js';

export async function createNotionPages(prospects) {
  if (!prospects.length) return { enabled: false, saved: 0, message: 'No new prospects.' };
  if (!config.notion.token || !config.notion.databaseId) {
    return { enabled: false, saved: 0, message: 'Notion is not configured.' };
  }

  const notion = new Client({ auth: config.notion.token });

  for (const item of prospects) {
    await notion.pages.create({
      parent: { database_id: config.notion.databaseId },
      properties: toProperties(item)
    });
  }

  return { enabled: true, saved: prospects.length };
}

function toProperties(item) {
  return {
    Domain: {
      title: [{ text: { content: item.domain } }]
    },
    URL: {
      url: item.url || null
    },
    'Authority Score': {
      number: item.authorityScore || 0
    },
    Category: {
      select: { name: item.category || 'other' }
    },
    'Outreach Status': {
      select: { name: item.outreachStatus || 'New' }
    },
    Contacted: {
      checkbox: Boolean(item.contacted)
    },
    Notes: {
      rich_text: [{ text: { content: item.notes || '' } }]
    },
    'Date Added': {
      date: { start: item.dateAdded }
    }
  };
}
