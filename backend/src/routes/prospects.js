import express from 'express';
import multer from 'multer';
import { parseSemrushCsv } from '../services/csvParser.js';
import { enrichProspects } from '../services/enrichment.js';
import { filterProspects } from '../services/filter.js';
import { dedupeProspects } from '../services/dedupe.js';
import { appendRowsToSheet } from '../services/googleSheets.js';
import { createNotionPages } from '../services/notion.js';
import { createDraft } from '../services/outreachDrafts.js';
import { loadProspects, saveProspects, updateProspectStatus } from '../data/store.js';
import { toCsv } from '../utils/csv.js';

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

router.get('/', async (request, response, next) => {
  try {
    response.json({ prospects: await loadProspects() });
  } catch (error) {
    next(error);
  }
});

router.post('/upload', upload.single('file'), async (request, response, next) => {
  try {
    if (!request.file) {
      response.status(400).json({ error: 'CSV file is required.' });
      return;
    }

    const rows = await parseSemrushCsv(request.file.buffer);
    const existing = await loadProspects();
    const filtered = filterProspects(rows);
    const deduped = dedupeProspects(filtered, existing);
    const enriched = await enrichProspects(deduped);
    const allProspects = [...enriched, ...existing];

    await saveProspects(allProspects);

    const sync = {
      googleSheets: await appendRowsToSheet(enriched),
      notion: await createNotionPages(enriched)
    };

    response.json({
      imported: rows.length,
      kept: enriched.length,
      removed: rows.length - enriched.length,
      prospects: allProspects,
      sync
    });
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/status', async (request, response, next) => {
  try {
    const prospect = await updateProspectStatus(request.params.id, request.body.status);
    response.json({ prospect });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/draft', async (request, response, next) => {
  try {
    const prospects = await loadProspects();
    const prospect = prospects.find((item) => item.id === request.params.id);
    if (!prospect) {
      response.status(404).json({ error: 'Prospect not found.' });
      return;
    }
    response.json({ draft: await createDraft(prospect) });
  } catch (error) {
    next(error);
  }
});

router.get('/export.csv', async (request, response, next) => {
  try {
    const prospects = await loadProspects();
    response.setHeader('Content-Type', 'text/csv; charset=utf-8');
    response.setHeader('Content-Disposition', 'attachment; filename="backlink-prospects.csv"');
    response.send(toCsv(prospects));
  } catch (error) {
    next(error);
  }
});

export default router;
