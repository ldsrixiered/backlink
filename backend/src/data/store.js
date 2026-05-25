import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(__dirname, '../../data');
const dataFile = path.join(dataDir, 'prospects.json');
const statuses = new Set(['New', 'Contacted', 'Replied', 'Won', 'Rejected']);

export async function loadProspects() {
  try {
    const text = await fs.readFile(dataFile, 'utf8');
    return JSON.parse(text);
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
}

export async function saveProspects(prospects) {
  await fs.mkdir(dataDir, { recursive: true });
  await fs.writeFile(dataFile, JSON.stringify(prospects, null, 2));
}

export async function updateProspectStatus(id, status) {
  if (!statuses.has(status)) {
    const error = new Error('Invalid outreach status.');
    error.status = 400;
    throw error;
  }

  const prospects = await loadProspects();
  const prospect = prospects.find((item) => item.id === id);
  if (!prospect) {
    const error = new Error('Prospect not found.');
    error.status = 404;
    throw error;
  }

  prospect.outreachStatus = status;
  prospect.contacted = ['Contacted', 'Replied', 'Won'].includes(status);
  await saveProspects(prospects);
  return prospect;
}
