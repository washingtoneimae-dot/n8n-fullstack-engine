# Gateway prototype

Tests one question, on its own, with nothing else in the way: can a browser
request be forwarded to an n8n webhook and come back as a real HTML page?

This does not use App Router, Page, or Data Table. Those still have the bugs
found earlier. This proves or disproves the pivot without depending on them.

## 1. Start n8n (you already have this)

```
docker compose up n8n-dev
```

## 2. Build a throwaway test workflow in the n8n editor (2 minutes)

Two nodes:

1. **Webhook** — HTTP Method: `POST`, Path: `test-page`, Respond: "Using
   'Respond to Webhook' Node".
2. **Edit Fields (Set)** — return something fake, e.g. an array:
   ```json
   [
     { "name": "Ada Lovelace", "role": "Engineer" },
     { "name": "Grace Hopper", "role": "Engineer" }
   ]
   ```
3. **Respond to Webhook** — Response Body: the Set node's output.

Activate the workflow.

## 3. Run the gateway

```
npm install
N8N_URL=http://localhost:5678 npm start
```

## 4. Open a real browser

```
http://localhost:3000/test
```

If you see an HTML table with Ada and Grace in it, the mechanism works:
browser → gateway → n8n webhook → JSON → HTML, no custom nodes involved.

## What this does and doesn't prove

**Proves:** the technical pipe is real — you can turn an *existing* n8n
workflow into a browsable page with a small, generic gateway. That's the
core of the pivot from last time.

**Doesn't prove:** that anyone wants this. That's the 5–10 conversations
with actual n8n users, not more code. Do that before extending this
prototype.

## Extending it later (only after the market conversations)

- `pages.json` can point at any number of existing webhooks — try wiring
  a real workflow you already run, not just the test one.
- Auth, sessions, and the routing DSL from `AppRouterNode` are deliberately
  left out here. Add them only once the wedge is validated — not before.
