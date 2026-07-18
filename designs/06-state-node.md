# State Node

**Purpose:** Persistent variables that survive across workflow executions — user sessions, app config, counters, cache.
**Type:** Action node

## How It Works

Unlike Data Table (row-based, schema-driven), State is **key-value** storage. Set a value in one execution, read it in another.

## UI Representation

```
┌────────────────────────────────────────────┐
│  State Node                                 │
│                                            │
│  ┌─ State Variables ─────────────────────  │
│  │  ┌──────────┬────────┬───────────────┐  │
│  │  │ Key      │ Type   │ Initial Value │  │
│  │  ├──────────┼────────┼───────────────┤  │
│  │  │ app_name │ string │ "My App"      │  │
│  │  │ counter  │ number │ 0             │  │
│  │  │ theme    │ string │ "dark"        │  │
│  │  └──────────┴────────┴───────────────┘  │
│  │  [+ Add Variable]                       │
│                                            │
│  Mode: [Set / Get / Increment / Delete]    │
│                                            │
│  Scope: [Global / User / Session / Page]   │
└────────────────────────────────────────────┘
```

## Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| Mode | Enum | `set`, `get`, `increment`, `decrement`, `delete`, `exists` |
| Scope | Enum | `global` (everyone), `user` (per-user), `session` (per-visit), `page` (per-page-load) |
| Key | String | Variable name (supports dot-notation: `user.settings.theme`) |
| Value | Any | Value to set (expressions supported) |
| Default | Any | Default if key doesn't exist |

## Example Workflow

```
Form: "Click Counter"  ──►  State (increment "page_views")
                           │
                           ▼
                        Page: "Views: {{ $state.page_views }}"
```

## Backend

- `global` scope → SQLite (n8n Data Table "state" table)
- `user` scope → SQLite keyed by user ID
- `session` scope → In-memory or JWT-embedded
- `page` scope → Single request (not persisted)

## Use Cases

| Use Case | Scope | How |
|----------|-------|-----|
| App config (name, logo) | global | Set once, read on every page |
| Theme preference | user | Set in settings page, read in layout |
| Cart contents | session | Add items, read on checkout page |
| Page load counter | page | Reset on every request |
| Rate limiter | global | Increment, check threshold |
| Feature flags | global | Set via admin page, check in middleware |
