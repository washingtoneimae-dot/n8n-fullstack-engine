// server.js — proof-of-concept gateway
//
// Purpose: test ONE thing — can a browser request be forwarded to an
// existing n8n webhook, and can the JSON it returns become a real HTML
// page? Nothing else. No auth, no routing DSL, no custom nodes required.
//
// This is deliberately decoupled from the app-router / page-node /
// data-table custom nodes — it works against any n8n workflow that ends
// in a "Respond to Webhook" node returning JSON.

const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const N8N_URL = process.env.N8N_URL || 'http://localhost:5678';
const PAGES_FILE = process.env.PAGES_FILE || path.join(__dirname, 'pages.json');

let pages;
try {
  pages = JSON.parse(fs.readFileSync(PAGES_FILE, 'utf8'));
} catch (err) {
  console.error(`Could not read ${PAGES_FILE}: ${err.message}`);
  process.exit(1);
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

// Renders whatever JSON the n8n workflow returns. If the workflow already
// returns { html: "..." } (e.g. a future Page node), that's passed through
// untouched. Otherwise falls back to a plain table or pretty JSON — good
// enough to prove the pipe works before any rendering nodes exist.
function renderPage(title, data) {
  if (data && typeof data.html === 'string') {
    return data.html;
  }

  let body;
  if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'object') {
    const cols = Object.keys(data[0]);
    const head = `<tr>${cols.map((c) => `<th>${escapeHtml(c)}</th>`).join('')}</tr>`;
    const rows = data
      .map((row) => `<tr>${cols.map((c) => `<td>${escapeHtml(row[c])}</td>`).join('')}</tr>`)
      .join('');
    body = `<table border="1" cellpadding="6" cellspacing="0">${head}${rows}</table>`;
  } else {
    body = `<pre>${escapeHtml(JSON.stringify(data, null, 2))}</pre>`;
  }

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>${escapeHtml(title)}</title></head>
<body>
<h1>${escapeHtml(title)}</h1>
${body}
</body>
</html>`;
}

for (const [routePath, config] of Object.entries(pages)) {
  app.get(routePath, async (req, res) => {
    const webhookUrl = `${N8N_URL.replace(/\/$/, '')}/webhook/${config.webhook}`;

    let response;
    try {
      response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: routePath,
          method: 'GET',
          query: req.query,
          headers: {},
          session: null,
        }),
      });
    } catch (err) {
      res.status(502).send(
        `<h1>Could not reach n8n</h1><p>${escapeHtml(err.message)}</p>` +
        `<p>Is n8n running at ${escapeHtml(N8N_URL)}?</p>`
      );
      return;
    }

    if (!response.ok) {
      res.status(502).send(
        `<h1>n8n returned an error</h1><p>Webhook <code>${escapeHtml(config.webhook)}</code> responded with ${response.status}</p>`
      );
      return;
    }

    let data;
    try {
      data = await response.json();
    } catch (err) {
      res.status(502).send(`<h1>n8n did not return JSON</h1><p>${escapeHtml(err.message)}</p>`);
      return;
    }

    res.send(renderPage(config.title || routePath, data));
  });
}

app.listen(PORT, () => {
  console.log(`Gateway listening on http://localhost:${PORT}`);
  console.log(`Forwarding to n8n at ${N8N_URL}`);
  console.log(`Configured pages: ${Object.keys(pages).join(', ') || '(none — edit pages.json)'}`);
});
