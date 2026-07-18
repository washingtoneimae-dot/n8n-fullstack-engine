// n8n Fullstack Engine — App Runtime
// Phase 2+: HTTP server that wraps n8n executor with routing, auth, and page rendering

import express from 'express';
import cookieParser from 'cookie-parser';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', version: '0.0.1' });
});

// Placeholder: route handler will dispatch to n8n workflows
app.get('/api/status', (_req, res) => {
  res.json({
    n8nUrl: process.env.N8N_URL || 'http://localhost:5678',
    status: 'runtime ready',
  });
});

app.listen(PORT, () => {
  console.log(`[runtime] n8n Fullstack Engine running on port ${PORT}`);
  console.log(`[runtime] n8n URL: ${process.env.N8N_URL || 'http://localhost:5678'}`);
});
