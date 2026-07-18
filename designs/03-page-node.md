# Page Node

**Purpose:** Render a full HTML page from a workflow.
**Type:** Action node — combines frontend UI components + backend data

## How It Works

The Page node takes data from upstream nodes and renders it as a complete HTML page. It acts like a **page template** — you place UI component nodes (Form, Table, Card, List, Chart) as sub-nodes inside it, and the Page node assembles them into a layout.

## UI Representation

```
┌────────────────────────────────────────────┐
│  Page  [Title: "Dashboard"]                │
│                                            │
│  ┌─ Layout ──────────────────────────────  │
│  │ Template: [Sidebar + Main      ▼]      │
│  │                                          │
│  ┌─ Header ───────────────────────────┐   │
│  │  [n8n Form: Search Bar]           │   │
│  └────────────────────────────────────┘   │
│  ┌─ Sidebar ─────────────────────────┐   │
│  │  [Card: User Profile]            │   │
│  │  [List: Navigation Links]        │   │
│  └────────────────────────────────────┘   │
│  ┌─ Main ───────────────────────────┐   │
│  │  [Data Table: Recent Orders]     │   │
│  │  [Chart: Revenue Graph]          │   │
│  └────────────────────────────────────┘   │
│  ┌─ Footer ─────────────────────────┐   │
│  │  [List: Footer Links]            │   │
│  └────────────────────────────────────┘   │
│                                            │
│  [+ Add Section]                           │
└────────────────────────────────────────────┘
```

## Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| Title | String | Page title / browser tab text |
| Layout Template | Enum | `blank`, `sidebar-main`, `header-main-footer`, `centered`, `fullscreen` |
| Icon | Icon | Page icon (sidebar nav) |
| Route | String | URL path this page lives at (from App Router) |
| SEO | Object | Meta tags for the page |
| Theme | Enum | Inherit from app or custom per-page |
| Sub-nodes | Array | UI component nodes placed in layout slots |

## Sub-node Slots (Layout Zones)

Each layout template defines slots where sub-nodes render:

| Layout | Slots |
|--------|-------|
| Blank | `body` (full width) |
| Sidebar + Main | `sidebar`, `main` |
| Header + Main + Footer | `header`, `main`, `footer` |
| Centered | `body` (max-width 600px, centered) |
| Fullscreen | `body` (100vh) |

## Input Data

Receives context from the workflow:
- Route params, query string
- Authenticated user (if behind Auth Gate)
- Any data from upstream nodes that run before it

## Output Data

The rendered HTML string — but also emits structured JSON for SPA mode:

```json
{
  "html": "<!DOCTYPE html>...",
  "meta": { "title": "Dashboard", "route": "/" },
  "components": [
    { "type": "table", "data": [...] },
    { "type": "chart", "data": {...} }
  ],
  "state": { "page": 1, "total": 42 }
}
```

The dual output lets the renderer choose:
- **SSR mode**: return full HTML
- **Hydration mode**: return JSON + let the frontend SPA render

## UI Components (Sub-nodes)

These are the nodes that can be placed **inside** a Page node:

| Component Node | Renders As | Description |
|---------------|-----------|-------------|
| Form | Input form | Collects user input |
| Data Table | Table + CRUD | Shows tabular data with edit/delete |
| Card | Card element | Single item display (image, text, action) |
| List | Ordered/unordered list | Repeating items |
| Chart | Chart/graph | Data visualization (line, bar, pie) |
| Markdown/HTML | Rendered content | Static content block |
| Navigation | Nav bar / sidebar | Links to other pages |
| Button | Action button | Triggers another workflow run |

## Implementation Notes

- Page nodes are **lazy**: they only fetch data when the route is hit
- Page output is cacheable (HTML + data)
- Pages can be static (no upstream data) or dynamic (with query/params)
- Sub-nodes are executed in dependency order within the page
- The Page node wraps all sub-node output into the HTML template
