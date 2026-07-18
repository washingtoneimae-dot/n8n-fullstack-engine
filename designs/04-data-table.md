# Data Table Node

**Purpose:** Persistent structured data storage with auto-generated CRUD UI.
**Type:** Action node — combines database + frontend table

## How It Works

The Data Table node is n8n's existing `Data Table` node supercharged with an **auto-generated UI**. Define the schema visually → n8n creates the SQLite table + a CRUD interface for it.

## UI Representation

```
┌────────────────────────────────────────────┐
│  Data Table  [Name: "Todos"]               │
│                                            │
│  ┌─ Schema ──────────────────────────────  │
│  │  ┌────────┬────────┬───────┬────────┐  │
│  │  │ Field  │ Type   │ Req   │ Default│  │
│  │  ├────────┼────────┼───────┼────────┤  │
│  │  │ title  │ string │ Yes   │        │  │
│  │  │ done   │ bool   │ No    │ false  │  │
│  │  │ priority│ enum  │ No    │ medium │  │
│  │  │ due_date│ date  │ No    │        │  │
│  │  │ owner  │ ref    │ Yes   │ $user  │  │
│  │  └────────┴────────┴───────┴────────┘  │
│  │  [+ Add Field]                          │
│  │                                         │
│  ┌─ UI Options ──────────────────────────  │
│  │  Allow create: [●]  Edit: [●]          │
│  │  Delete: [●]  Search: [●] Export: [○] │
│  │  View mode: [Table / Cards / Grid ▼]   │
│  │  Row actions: [Click to edit ▼]        │
│  │  Pagination: [20 per page   ═══●══╤]   │
└────────────────────────────────────────────┘
```

## Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| Table Name | String | Internal name (used for SQLite table name) |
| Display Label | String | Human-readable table title |
| Fields | Array | Column definitions |
| Field.Name | String | Column name |
| Field.Type | Enum | `string`, `number`, `boolean`, `date`, `datetime`, `email`, `url`, `enum`, `ref` (relation to another table), `image`, `file`, `json`, `text` (long string) |
| Field.Required | Boolean | Not null constraint |
| Field.Default | Any | Default value |
| Field.Enum Values | String[] | Options for enum type |
| Field.Ref Table | String | Target table for ref type |
| UI Options | Object | Which CRUD actions to expose |
| View Mode | Enum | `table`, `cards`, `grid` |

## Auto-generated UI

When placed inside a Page node, Data Table renders:

```
┌─────────────────────────────────────────────┐
│  Todos                          [+ Add]     │
├─────────────────────────────────────────────┤
│  ┌──────┬───────────────┬──────┬──────────┐│
│  │ Done │ Title          │ Pri  │ Due      ││
│  ├──────┼───────────────┼──────┼──────────┤│
│  │ ☑    │ Buy groceries  │ high │ 2026-07-20││
│  │ ☐    │ Finish project │ med  │ 2026-07-25││
│  │ ☐    │ Call dentist   │ low  │ 2026-08-01││
│  └──────┴───────────────┴──────┴──────────┘│
│                          1-3 of 12  [►]     │
└─────────────────────────────────────────────┘
```

### CRUD Modals (auto-generated)

- **Add**: Modal with form fields for each column
- **Edit**: Modal with pre-filled form
- **Delete**: Confirmation dialog
- **Search**: Text filter across string fields

## Operations (in workflow mode)

When used as an action node (not inside a Page), it operates like n8n's existing Data Table:

| Operation | Description |
|-----------|-------------|
| Get All | Query rows with filters |
| Get | Get single row by ID |
| Create | Insert row |
| Update | Update row by ID |
| Delete | Delete row(s) |
| Upsert | Insert or update |
| Count | Row count with filters |
| Aggregate | SUM, AVG, MIN, MAX, GROUP BY |

## Query Filters

Supports expressions like n8n's existing nodes:
```
{"field": "priority", "operator": "equal", "value": "high"}
{"field": "due_date", "operator": "before", "value": "={{ $now }}"}
{"field": "owner", "operator": "equal", "value": "={{ $user.id }}"}
```

## Row-Level Security

Data Table can enforce per-row permissions:
- **Owner field**: Each row tied to a user
- **Read filter**: Users only see their own rows
- **Write scope**: Only owner or admin can edit/delete

## Implementation Notes

- Backed by SQLite by default (n8n's existing Data Table)
- Schema migrations happen automatically when fields change
- Ref fields create dropdown selects populated from related tables
- File/image fields store binary data in n8n's binary data store
- Export generates CSV/JSON download
- Row-level security is enforced at the query level, not just UI
