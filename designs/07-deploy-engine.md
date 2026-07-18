# Deploy Node

**Purpose:** Package the entire app (workflows + data + UI) into a deployable artifact.
**Type:** Output node — the last node in the app builder workflow

## How It Works

The Deploy node takes all the definitions from the app (App Router, Pages, Data Tables, Auth Gate, etc.) and compiles them into a standalone runtime that can be deployed.

## UI Representation

```
┌────────────────────────────────────────────┐
│  Deploy Engine                              │
│                                            │
│  ┌─ App Info ────────────────────────────  │
│  │  App Name: [My Todo App              ]  │
│  │  Version:  1.0.0                        │
│  │  Description: [A simple todo app     ]  │
│  │                                         │
│  ┌─ Build Target ───────────────────────  │
│  │  ○ Standalone Binary                     │
│  │  ● Docker Image                          │
│  │  ○ Static Site (SSG)                     │
│  │  ○ n8n Export (workflow only)            │
│  │                                         │
│  ┌─ Deploy Target ──────────────────────  │
│  │  ○ Export to ZIP                         │
│  │  ○ Push to Docker Hub                    │
│  │  ○ Deploy to Vercel                      │
│  │  ○ Deploy to Railway                     │
│  │  ● Custom Docker Host                    │
│  │    Host: [ 192.168.1.100:2375       ]    │
│  │                                         │
│  ┌─ Environment ────────────────────────  │
│  │  ┌──────────┬────────────────────────┐  │
│  │  │ Key      │ Value                  │  │
│  │  ├──────────┼────────────────────────┤  │
│  │  │ APP_URL  │ https://myapp.com      │  │
│  │  │ SECRET   │ ***                    │  │
│  │  └──────────┴────────────────────────┘  │
│  │                                         │
│  ┌─ Actions ────────────────────────────  │
│  │  [  Build & Export  ]  [  Deploy  ]    │
│  │                                         │
│  │  ── Output ──────────────────────────   │
│  │  Build status: ✓ Ready                   │
│  │  Artifact: n8n-fullstack-app-v1.zip     │
│  │  Size: 12.4 MB                           │
│  │  Deployed at: https://myapp.com         │
└────────────────────────────────────────────┘
```

## What It Compiles

The Deploy node collects:

1. **Workflow definitions** — all nodes and connections
2. **Data schemas** — Data Table definitions as SQLite schema
3. **Auth config** — Auth Gate settings
4. **Route config** — App Router definitions
5. **UI component tree** — Pages and their sub-node layout
6. **Static assets** — Uploaded images, files, themes

## Output Formats

| Format | Contains | Target |
|--------|----------|--------|
| Standalone Binary | n8n runtime + app config | Single executable |
| Docker Image | Dockerfile + n8n + app | Docker host |
| Static Site | HTML/CSS/JS (SSG) | Vercel, Netlify, any static host |
| ZIP Export | All files bundled | Manual deployment |
| n8n Workflow | JSON export | Import into any n8n instance |

## Runtime Architecture (Deployed)

When deployed, the app runs as:

```
[nginx/caddy reverse proxy]
         │
    ┌────┴────┐
    │  n8n    │  ← core engine (node.js)
    │  runtime│
    └────┬────┘
         │
    ┌────┴────┐
    │ SQLite  │  ← Data Tables + State + Auth
    │         │
    └─────────┘
```

The deployed app:
- Starts n8n in headless mode
- Loads the pre-configured workflows
- Serves HTTP on a single port
- Handles routing, auth, sessions, and UI rendering
- All from a single `docker run` or binary

## Implementation Notes

- Phase 1: Export as n8n workflow JSON + companion config
- Phase 2: Package as Docker image with embedded n8n config
- Phase 3: One-click deploy to Vercel/Railway
- No framework dependency — the runtime is n8n itself
- Env vars allow per-deployment configuration (DB path, secret key, etc.)
