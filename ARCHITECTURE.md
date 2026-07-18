# Architecture

## High-Level System Design

```
┌──────────────────────────────────────────────────────────┐
│                   n8n Fullstack Engine                      │
├──────────────────────────────────────────────────────────┤
│                                                            │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────┐  │
│  │  Designer UI  │  │  Runtime      │  │  Deploy Engine  │  │
│  │  (n8n Editor) │  │  (Node.js)   │  │  (Packager)     │  │
│  └──────┬───────┘  └──────┬───────┘  └───────┬────────┘  │
│         │                 │                   │            │
│         ▼                 ▼                   ▼            │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────┐  │
│  │ App Nodes    │  │ App Runtime  │  │ Build Pipeline  │  │
│  │ (custom)     │  │ (executor)   │  │ (compiler)      │  │
│  └──────────────┘  └──────┬───────┘  └────────────────┘  │
│                           │                                │
│                    ┌──────┴──────┐                        │
│                    │  Storage    │                         │
│                    │  (SQLite)   │                         │
│                    └─────────────┘                        │
└──────────────────────────────────────────────────────────┘
```

## Layer Breakdown

### 1. Designer UI Layer (n8n Editor + Custom Nodes)

This is the existing n8n editor, extended with new node types:

```
App Router Node ──► Auth Gate Node ──► Page Node
                                          │
                             ┌────────────┼────────────┐
                             ▼            ▼            ▼
                         Form Node  Data Table   Chart/Card/List
```

The user builds the app visually by connecting these nodes, just like building any n8n workflow. But the output isn't an automation — it's an **app definition**.

### 2. App Runtime Layer

The runtime wraps the n8n executor with an HTTP server:

```
HTTP Request
     │
     ▼
┌────────────────┐
│  Router        │  ← matches URL to workflow
│  (App Router)  │
└────┬───────────┘
     │
     ▼
┌────────────────┐
│  Auth Guard    │  ← checks session (if behind Auth Gate)
│  (Auth Node)   │
└────┬───────────┘
     │
     ▼
┌────────────────┐
│  Workflow      │  ← executes the workflow
│  Executor      │     (n8n engine)
└────┬───────────┘
     │
     ▼
┌────────────────┐
│  Page Renderer │  ← assembles Page node output
│  (UI Engine)   │     into HTML + JSON
└────┬───────────┘
     │
     ▼
  HTML Response (browser gets full page)
```

### 3. Storage Layer

| Store | Used By | Tech |
|-------|---------|------|
| User Data | Auth Gate | SQLite (Data Table) |
| App Data | Data Table nodes | SQLite (Data Table) |
| State | State node | SQLite (key-value) |
| Sessions | Auth Gate | JWT (cookie) |
| Files | Form uploads | n8n binary store |
| App Config | Deploy Engine | JSON config file |

## Data Flow: User Request to Page Render

```
1. Browser navigates to  /todos

2. n8n HTTP server receives request on port 5678

3. App Router node matches /todos → routes to "Todo List" workflow

4. Auth Guard (connected upstream of page) checks JWT cookie
   → Valid session → continues
   → Invalid → redirects to /login

5. Workflow executes:
   a. Data Table: "Get All" todos for this user
   b. Page node receives todo data
   c. Page assembles: header + table(todos) + footer
   d. Page outputs HTML + state JSON

6. HTTP server returns full HTML page to browser

7. Browser renders the page
```

## n8n Extension Points Used

| Extension | Purpose |
|-----------|---------|
| Custom Node (INodeType) | New app nodes (Auth Gate, Page, Form, Deploy) |
| Cluster Nodes | Page → sub-node (Form, Table, Card, Chart, List) |
| Credential Type | OAuth for social auth providers |
| Webhook Route | Runtime HTTP endpoint for serving pages |
| Database | Data Table schema creation |
| Binary Data | File uploads from forms |

## Frontend Rendering Strategy

Phase 1: **SSR (Server-Side Rendering)**
- Page nodes generate complete HTML server-side
- Forms submit via POST → full page reload
- Simple, works everywhere, no JS framework needed
- n8n adds Tailwind CSS classes automatically

Phase 2: **Hydration**
- Page nodes output HTML + embedded JSON state
- Browser loads Preact/alpine.js on first visit
- Subsequent navigations fetch JSON only
- Form submissions use fetch API instead of page reload

Phase 3: **Full SPA**
- Page nodes output JSON only
- Frontend SPA (Preact/Svelte) handles routing
- n8n serves as pure API backend
- Optional: export as Vite project for custom frontend

## Security Model

```
┌─────────────────────────────┐
│  Every request              │
│  ┌───────────────────────┐  │
│  │ 1. Auth Gate check    │  │
│  │ 2. CSRF token verify  │  │
│  │ 3. Rate limit check   │  │
│  │ 4. Row-level security │  │
│  │    (Data Table)       │  │
│  └───────────────────────┘  │
└─────────────────────────────┘
```

- Sessions: JWT stored in httpOnly cookie
- CSRF: Double-submit cookie pattern
- Passwords: bcrypt (cost 12)
- Data isolation: users only see their own rows (by default)
- Admin users: can see all data (configurable)
