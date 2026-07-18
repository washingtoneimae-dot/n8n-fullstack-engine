# n8n Fullstack Engine

**Turn n8n workflows into standalone fullstack apps — visually, by beginners.**

A concept: extend n8n's node system so that workflows don't just automate — they build, serve, and deploy entire applications with backend logic, persistent state, authentication, and generated frontend UI.

---

## The Core Idea

n8n today is the best open-source workflow automation engine. But every automation is a **background process** — it triggers, runs, finishes. What if instead, a workflow **is** a running app?

| Current n8n | Fullstack Engine |
|---|---|
| Stateless per-execution | Persistent state across runs |
| Webhook responds with JSON | Webhook responds with rendered UI |
| Form trigger collects data | Form trigger = app page |
| No user concept | Built-in auth/sessions |
| Deploy as daemon | Deploy as standalone app |
| No frontend layer | Auto-generated UI from nodes |

## The User

**Beginner builders** — people who can drag and drop but can't write React + Node.js + SQL. They want to build:

- A todo app with login
- A blog with admin panel
- A SaaS dashboard
- A customer portal
- An internal tool

Without touching a terminal or writing framework config.

---

## How It Works (Concept)

Replace:
```
n8n workflow  ──►  automation
```

With:
```
n8n workflow  ──►  live app (frontend + backend + DB + auth)
```

Each node type in the workflow also defines:

- **Backend behavior** (what it does when executed — already exists)
- **Frontend component** (what it renders as UI)
- **State schema** (what data it persists between executions)
- **Auth scope** (who can interact with it)

The engine wraps the workflow in a runtime that:
1. Serves a frontend SPA built from node UI definitions
2. Runs the workflow as the backend logic
3. Manages sessions, routing, and state automatically

---

## Node Types (Proposed)

See [/designs](./designs/) for detailed design documents.

| Node | Function | UI it generates |
|------|----------|----------------|
| App Router | Define routes → page mapping | Navigation sidebar |
| Auth Gate | Login/signup/session | Login/signup pages |
| Page | A route handler | Full page (layout + children) |
| Form | Input collection | Input form |
| Data Table | Persistent CRUD | Table view + CRUD modals |
| Chart/Graph | Data visualization | Dashboard widget |
| Card | Display item | Info card |
| List | Show list of items | List/feed view |
| API Endpoint | REST endpoint for external callers | Swagger docs (auto) |
| State | Persistent variables | State inspector panel |
| Deploy | Output config | Deploy button/build output |
| Auth Middleware | Protect routes behind auth | Access control UI |

---

## Architecture

```
┌──────────────────────────────────────────────────┐
│                   Browser                          │
│  ┌─────────────┐  ┌──────────┐  ┌──────────────┐ │
│  │ n8n Form UI │  │ Dashboard│  │ Auth Pages   │ │
│  │ (rendered)  │  │ (chart)  │  │ (login/signup│ │
│  └──────┬──────┘  └────┬─────┘  └──────┬───────┘ │
└─────────┼──────────────┼───────────────┼──────────┘
          │              │               │
          ▼              ▼               ▼
┌──────────────────────────────────────────────────┐
│              n8n Runtime (the engine)              │
│  ┌──────────┐ ┌────────┐ ┌──────┐ ┌──────────┐  │
│  │ Workflow │ │ Router │ │ Auth │ │ State    │  │
│  │ Executor │ │ Engine │ │ Mgr  │ │ Manager  │  │
│  └──────────┘ └────────┘ └──────┘ └──────────┘  │
│  ┌──────────┐ ┌────────┐ ┌──────────────────┐   │
│  │ UI       │ │ Deploy │ │ Data Table       │   │
│  │ Renderer │ │ Engine │ │ (persistent CRUD)│   │
│  └──────────┘ └────────┘ └──────────────────┘   │
└──────────────────────────────────────────────────┘
          │              │               │
          ▼              ▼               ▼
┌──────────────────────────────────────────────────┐
│         Storage Layer                              │
│  ┌──────────┐  ┌──────────┐  ┌───────────────┐  │
│  │ SQLite   │  │ File     │  │ External APIs │  │
│  │ (builtin)│  │ Storage  │  │ (optional)    │  │
│  └──────────┘  └──────────┘  └───────────────┘  │
└──────────────────────────────────────────────────┘
```

---

## Roadmap

### Phase 1 — Prototype
- [ ] Custom n8n node that generates a basic HTML page from a workflow
- [ ] Persistent state across form submissions (Data Table + state)
- [ ] Auth gate node (basic login)
- [ ] Deploy-as-static-site output

### Phase 2 — App Scaffolder
- [ ] Full workflow-to-app compiler
- [ ] Multi-page routing from nodes
- [ ] UI component library (Form, Table, Card, List, Chart)
- [ ] Session management (JWT-based)

### Phase 3 — Production
- [ ] Plugin system for custom UI components
- [ ] One-click deploy (Vercel, Railway, Docker)
- [ ] App marketplace
- [ ] Beginner tutorial builder

---

## Why This Could Work

- **n8n already has 400+ integrations** — every node is already a backend connector
- **Visual builder eliminates coding barrier** — drag-drop beats boilerplate
- **n8n's fair-code license** — we can build on top without fighting licensing
- **Existing community** — 45k+ GitHub stars, active plugin ecosystem
- **Node system is extensible** — custom nodes are a first-class feature

**The bet:** Make n8n workflows deployable as apps, and you turn the automation tool into a fullstack building platform.
