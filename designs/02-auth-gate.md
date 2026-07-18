# Auth Gate Node

**Purpose:** Handle user registration, login, session management, and route protection.
**Type:** Root node (like an App trigger) + Middleware

## How It Works

The Auth Gate is the **identity layer** of the app. It can function in two modes:

1. **As a trigger** — sits at app entry, handles `/login` and `/signup` routes
2. **As middleware** — placed after the App Router on protected routes, checks session validity

## UI Representation

```
┌─────────────────────────────────────┐
│  Auth Gate                           │
│                                     │
│  Mode: [Trigger / Middleware]        │
│                                     │
│  ── Provider ────────────────────   │
│  Auth Provider: [Built-in ▼]        │
│                                     │
│  ── Session ──────────────────────  │
│  Token expiry:   [24h    ═══●══╤]  │
│  Storage:        [JWT Cookie  ▼]  │
│                                     │
│  ── Registration ────────────────  │
│  Allow signup:   [● Yes / ○ No]    │
│  Email verify:   [○ Yes / ● No]    │
│  Default role:   [user       ▼]   │
│                                     │
│  ── When Unauthenticated ─────────  │
│  Redirect to:  [/login             ]│
└─────────────────────────────────────┘
```

## Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| Mode | Enum | `trigger` (login/signup pages) or `middleware` (guard) |
| Auth Provider | Enum | `built-in`, `google`, `github`, `email-link`, `custom` |
| Token Expiry | Duration | Session duration (15m, 1h, 24h, 7d, 30d) |
| Storage | Enum | `jwt-cookie`, `jwt-header`, `session-only` |
| Allow Signup | Boolean | Show registration page |
| Email Verify | Boolean | Verify email before activation |
| Default Role | String | Role assigned to new users |
| Redirect | String | Where unauthenticated users go |
| User DB | Data Table | Table storing user records |
| Password Policy | Object | Min length, special chars, etc. |

## Auth Table Schema (auto-created)

| Column | Type | Purpose |
|--------|------|---------|
| id | UUID | Primary key |
| email | String | Login identifier |
| password_hash | String | bcrypt hash |
| name | String | Display name |
| role | String | Permission level |
| verified | Boolean | Email verified |
| created_at | DateTime | Registration date |

## Output Data

When middleware mode, passes through to the child workflow:

```json
{
  "authenticated": true,
  "user": {
    "id": "usr_abc123",
    "email": "alice@example.com",
    "name": "Alice",
    "role": "admin"
  }
}
```

## Implementation Notes

- Built-in provider uses bcrypt + JWT — no external deps
- Social providers (Google, GitHub) need OAuth credentials config
- Email verification uses a Send Email node connected downstream
- Session cookie is set on login response
- Middleware mode returns 401 redirect if invalid
- The Auth Gate optionally generates login/signup pages using the Form node internally
