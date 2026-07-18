# App Router Node

**Purpose:** Define URL routes and map them to workflows/pages.
**Type:** Trigger + Configurator

## How It Works

The App Router is the **entry point** of any n8n fullstack app. It sits at the top of a workflow and defines:

- What routes exist
- Which workflow/page handles each route
- Whether the route needs auth
- Route nesting (layout pages)

## UI Representation

```
┌─────────────────────────────────────┐
│  App Router                          │
│                                     │
│  Routes:                            │
│  ┌──────┬──────────┬───────┬──────┐ │
│  │ Path │ Workflow │ Auth  │ Type │ │
│  ├──────┼──────────┼───────┼──────┤ │
│  │ /    │ home     │ No    │ page │ │
│  │ /todos│ todo-list│ Yes   │ page │ │
│  │ /api  │ api-gw   │ No    │ api  │ │
│  └──────┴──────────┴───────┴──────┘ │
│                                     │
│  [+ Add Route]                      │
└─────────────────────────────────────┘
```

## Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| Routes | Array | List of route definitions |
| Route.Path | String | URL path (e.g. `/`, `/todos`, `/dashboard/*`) |
| Route.Workflow | Workflow selector | Which workflow handles this route |
| Route.Auth | Boolean | Require valid session |
| Route.Type | Enum | `page` (renders UI) or `api` (returns JSON) |
| Route.Layout | Workflow selector | Optional layout wrapper |
| 404 Page | Workflow | Custom 404 handler |
| 500 Page | Workflow | Custom error handler |

## Output Data

Passed to the child workflow/page:

```json
{
  "route": "/todos/123",
  "params": { "id": "123" },
  "query": { "page": "1" },
  "user": { "id": "abc", "email": "..." }  // if authenticated
}
```

## Implementation Notes

- Routes use express-like pattern matching (`/todos/:id`, `/dashboard/*`)
- Matching is first-match wins
- Nested routes inherit parent layout workflows
- API routes skip the UI rendering pipeline and return workflow output as JSON
