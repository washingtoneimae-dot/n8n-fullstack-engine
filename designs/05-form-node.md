# Form Node

**Purpose:** Collect user input with validation, submit it to the workflow backend.
**Type:** Action node — generates input form + handles submission

## How It Works

The Form node takes a schema of input fields and renders an interactive form. When submitted, the form data flows downstream to the next node for processing (e.g., create a Data Table row, send an email, call an API).

## UI Representation

```
┌────────────────────────────────────────────┐
│  Form  [Title: "New Todo"]                 │
│                                            │
│  ┌─ Fields ──────────────────────────────  │
│  │  ┌────────┬─────────┬──────┬────────┐  │
│  │  │ Label  │ Type    │ Req  │ Place- │  │
│  │  │        │         │      │ holder │  │
│  │  ├────────┼─────────┼──────┼────────┤  │
│  │  │ Title  │ text    │ Yes  │ Buy... │  │
│  │  │ Due    │ date    │ No   │        │  │
│  │  │ Prio   │ select  │ No   │ Select │  │
│  │  │ Notes  │ textarea │ No  │        │  │
│  │  └────────┴─────────┴──────┴────────┘  │
│  │  [+ Add Field]                          │
│  │                                         │
│  ┌─ Submit ──────────────────────────────  │
│  │  Button text: [Create Todo           ] │
│  │  After submit: [Show success / Redirect│ │
│  │                 to page ▼]             │
│  │  Redirect to: [/todos                ] │
└────────────────────────────────────────────┘
```

## Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| Title | String | Form heading |
| Description | String | Subtitle / help text |
| Fields | Array | Input field definitions |
| Field.Label | String | Field display label |
| Field.Name | String | Field key in output data |
| Field.Type | Enum | `text`, `email`, `password`, `number`, `textarea`, `select`, `multiselect`, `checkbox`, `radio`, `date`, `datetime`, `file`, `image`, `toggle`, `color`, `rich-text` |
| Field.Required | Boolean | Validation |
| Field.Placeholder | String | Placeholder hint |
| Field.Default | Any | Default value |
| Field.Options | String[] | Options for select/multiselect/radio |
| Field.Validation | Object | Pattern, min, max, custom regex |
| Submit Button | String | Submit button label |
| After Submit | Enum | `stay`, `redirect`, `show-message`, `clear` |
| Success Message | String | Message shown after submit |

## Rendered UI

```
┌──────────────────────────────┐
│  New Todo                    │
│                              │
│  Title *                     │
│  ┌──────────────────────────┐│
│  │ Buy groceries            ││
│  └──────────────────────────┘│
│                              │
│  Due Date                    │
│  ┌──────────────────────────┐│
│  │ 2026-07-20        [📅]  ││
│  └──────────────────────────┘│
│                              │
│  Priority                    │
│  ┌──────────────────────────┐│
│  │ Select...           [▼] ││
│  │ ○ Low                    ││
│  │ ● Medium                 ││
│  │ ○ High                   ││
│  └──────────────────────────┘│
│                              │
│  Notes                       │
│  ┌──────────────────────────┐│
│  │                          ││
│  │ (textarea)               ││
│  └──────────────────────────┘│
│                              │
│  ┌──────────────────────────┐│
│  │    Create Todo           ││
│  └──────────────────────────┘│
└──────────────────────────────┘
```

## Output Data (downstream)

```json
{
  "title": "Buy groceries",
  "due_date": "2026-07-20",
  "priority": "medium",
  "notes": "Milk, eggs, bread",
  "_submitted_at": "2026-07-18T16:30:00Z",
  "_user": { "id": "usr_abc", "email": "alice@example.com" }
}
```

## Validation Rules

- Required fields show inline error on blur
- Email fields validate format
- Pattern fields use regex validation
- File fields validate type and size
- Min/max length for text fields
- Min/max for number fields
- Custom validation via expression (e.g., `={{ $json.password == $json.confirm_password }}`)

## Relationships with other nodes

| Connected to | Behavior |
|-------------|----------|
| Data Table | Form submit → creates a new row (auto-map fields) |
| Auth Gate | Login/signup forms auto-mapped to user table |
| HTTP Request | Submit data to external API |
| Send Email | Send confirmation email on submit |
| Form → Data Table | "Save to table" mode — creates a row with form fields as columns |

## Implementation Notes

- Client-side validation first, server-side validation on submit
- File uploads stream to n8n binary data store
- Forms can be pre-filled with default values from upstream nodes
- Multi-step forms possible by chaining Form nodes
- Forms are responsive by default (mobile-first)
