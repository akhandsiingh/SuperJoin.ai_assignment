import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import sheetWebhookRouter from './routes/sheetWebhook.js';
import dbWebhookRouter from './routes/dbWebhook.js';
import syncRouter from './routes/sync.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

// Routes
app.use('/sheet/webhook', sheetWebhookRouter);
app.use('/db/webhook', dbWebhookRouter);
app.use('/sync', syncRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('[ERROR]', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
  });
});

app.listen(PORT, () => {
  console.log(`[SERVER] Running on http://localhost:${PORT}`);
  console.log(`[WEBHOOK] Sheet events: POST /sheet/webhook`);
  console.log(`[WEBHOOK] DB events: POST /db/webhook`);
});
