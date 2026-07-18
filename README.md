# n8n Fullstack Engine

**Turn n8n workflows into standalone fullstack apps — visually, by beginners.**

[![GitHub](https://img.shields.io/badge/GitHub-washingtoneimae--dot%2Fn8n--fullstack--engine-blue)](https://github.com/washingtoneimae-dot/n8n-fullstack-engine)

> **Status:** Concept / Design Phase — not yet buildable.

---

## The Idea

n8n today is a workflow automation engine. Every automation is a **background process** — it triggers, runs, finishes.

What if instead, a workflow **is** a running app?

The n8n Fullstack Engine extends n8n's node system so that workflows build, serve, and deploy entire applications — with persistent data, user authentication, auto-generated UI, and one-click deployment.

## Target User

**Beginner builders** — people who can drag and drop but can't write React + Node.js + SQL. They want to build a todo app, blog, SaaS dashboard, customer portal, or internal tool without touching a terminal or writing framework config.

## Proposed Nodes

| Node | What It Does | Generates |
|------|-------------|-----------|
| **App Router** | Define routes → page mapping | Navigation sidebar |
| **Auth Gate** | Login, signup, sessions | Login/signup pages, JWT auth |
| **Page** | Render a page with UI components | Full HTML page |
| **Form** | Collect user input | Input form with validation |
| **Data Table** | Persistent CRUD storage | Table view + CRUD modals |
| **Chart** | Visualize data | Dashboard widgets |
| **Card / List** | Display items | Info cards, list views |
| **State** | Persistent key-value storage | Invisible (backend only) |
| **Deploy** | Package + deploy the app | Docker image / ZIP / binary |

## Example: Todo App

The user drags these nodes onto the canvas:

```
[App Router] ──► [Auth Gate] ──► [Page: Home] ──► [Form: New Todo] ──► [Data Table: Todos]
                                    │
                                    └── [Data Table: Todos (read mode)]
```

Save → click "Deploy" → get a live todo app at `https://my-todo-app.com` with login, CRUD, and persistent storage.

## Repository Structure

```
n8n-fullstack-engine/
├── VISION.md              # The core idea and roadmap
├── ARCHITECTURE.md        # System design and data flow
├── DESIGNS.md             # Design index
├── designs/
│   ├── 01-app-router.md   # App Router node design
│   ├── 02-auth-gate.md    # Auth Gate node design
│   ├── 03-page-node.md    # Page node design
│   ├── 04-data-table.md   # Data Table node design
│   ├── 05-form-node.md    # Form node design
│   ├── 06-state-node.md   # State node design
│   └── 07-deploy-engine.md# Deploy Engine design
├── examples/              # Example app builds (TBD)
└── prototypes/            # Prototype code (TBD)
```

## Phases

- **Phase 1** — Custom n8n node that generates HTML pages + persistent state + auth
- **Phase 2** — Full workflow-to-app compiler with multi-page routing
- **Phase 3** — One-click deploy, plugin system, app marketplace

## License

MIT (concept stage). Implementation will depend on n8n's fair-code license.
