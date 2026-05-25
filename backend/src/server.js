import express from 'express';
import helmet from 'helmet';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from './config/env.js';
import prospectRoutes from './routes/prospects.js';
import integrationRoutes from './routes/integrations.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendDist = path.resolve(__dirname, '../../frontend/dist');

app.use(helmet());
app.use(express.json({ limit: '2mb' }));
app.use((request, response, next) => {
  const origin = request.headers.origin;
  if (!origin || config.allowedOrigins.includes(origin)) {
    response.setHeader('Access-Control-Allow-Origin', origin || config.frontendUrl);
  }
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  response.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,OPTIONS');
  if (request.method === 'OPTIONS') {
    response.sendStatus(204);
    return;
  }
  next();
});

app.get('/api/health', (request, response) => {
  response.json({ ok: true, service: 'backlink-prospect-manager' });
});

app.use('/api/prospects', prospectRoutes);
app.use('/api/integrations', integrationRoutes);

app.use(express.static(frontendDist));
app.get('*', (request, response, next) => {
  if (request.path.startsWith('/api')) {
    next();
    return;
  }
  response.sendFile(path.join(frontendDist, 'index.html'), (error) => {
    if (error) next();
  });
});

app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`Backend running at http://localhost:${config.port}`);
});
