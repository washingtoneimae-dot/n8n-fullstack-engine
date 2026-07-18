import express from 'express';
import cookieParser from 'cookie-parser';
import fs from 'fs';
import path from 'path';

const app = express();
const PORT = process.env.PORT || 3000;
const N8N_URL = process.env.N8N_URL || 'http://localhost:5678';
const ROUTES_FILE = process.env.ROUTES_FILE || path.join(process.cwd(), 'routes.json');
const PUBLIC_DIR = process.env.PUBLIC_DIR || path.join(process.cwd(), 'public');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(PUBLIC_DIR));

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', version: '0.0.1', n8nUrl: N8N_URL });
});

app.use((_req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cookie');
  if (_req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  next();
});

interface RouteConfig {
  path: string;
  webhookUrl: string;
  method: string;
}

function loadRoutes(): RouteConfig[] {
  try {
    const data = fs.readFileSync(ROUTES_FILE, 'utf-8');
    const parsed = JSON.parse(data);
    return parsed.routes || [];
  } catch {
    return [];
  }
}

function matchRouteConfig(routes: RouteConfig[], reqPath: string, method: string): RouteConfig | null {
  const normalizedPath = reqPath.replace(/\/+$/, '') || '/';
  for (const route of routes) {
    if (route.method !== method && route.method !== 'ALL') continue;
    const routePath = route.path.replace(/\/+$/, '') || '/';
    if (routePath === normalizedPath) return route;
  }
  return null;
}

app.all('*', async (req, res) => {
  if (req.path.startsWith('/health') || req.path.startsWith('/api/status')) {
    return;
  }

  if (req.path === '/') {
    return;
  }

  const routes = loadRoutes();
  const routeConfig = matchRouteConfig(routes, req.path, req.method);

  if (!routeConfig) {
    res.status(404).json({ error: 'No matching route', path: req.path });
    return;
  }

  const requestContext = {
    path: req.path,
    method: req.method,
    query: req.query,
    body: req.body,
    headers: req.headers,
    cookies: req.cookies,
    session: (req as any).session || null,
  };

  try {
    const response = await fetch(routeConfig.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestContext),
    });

    const contentType = response.headers.get('content-type') || '';
    const text = await response.text();

    if (contentType.includes('application/json')) {
      try {
        const json = JSON.parse(text);
        if (json.html) {
          res.send(json.html);
        } else {
          res.json(json);
        }
      } catch {
        res.type('text/html').send(text);
      }
    } else {
      res.type('text/html').send(text);
    }
  } catch (error) {
    console.error(`[runtime] Error proxying to n8n:`, error);
    res.status(502).json({ error: 'Failed to reach n8n workflow', path: req.path });
  }
});

app.listen(Number(PORT), () => {
  console.log(`[runtime] n8n Fullstack Engine running on port ${PORT}`);
  console.log(`[runtime] n8n URL: ${N8N_URL}`);
  console.log(`[runtime] Routes file: ${ROUTES_FILE}`);
  console.log(`[runtime] Public dir: ${PUBLIC_DIR}`);
});
