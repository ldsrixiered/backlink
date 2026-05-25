import express from 'express';
import { findEmailsForDomain } from '../services/hunter.js';

const router = express.Router();

router.get('/hunter/:domain', async (request, response, next) => {
  try {
    const emails = await findEmailsForDomain(request.params.domain);
    response.json({ emails });
  } catch (error) {
    next(error);
  }
});

export default router;
