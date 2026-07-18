# Example: Todo App

A complete walkthrough of building a todo app with the n8n Fullstack Engine.

## The Goal

Build a todo app where users can:
- Sign up / log in
- Create todos (title, description, priority, due date)
- View their todos in a table
- Mark todos as complete
- Delete todos

## The Canvas

The user drags and connects these nodes:

```
┌──────────────┐
│  App Router   │
│  Routes:      │
│  / → Home     │
│  /login → Auth│
│  /todos → List│
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Auth Gate    │
│  (middleware)  │
│  Provider:    │
│  built-in     │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Page: Home   │
│  Title:       │
│  "My App"     │
│  Layout:      │
│  sidebar-main │
└──────┬───────┘
       │
       ├──────────────────────────────┐
       ▼                              ▼
┌──────────────┐              ┌──────────────┐
│  Form         │              │  Data Table   │
│  Fields:      │              │  (read mode)  │
│  title (text) │              │  Table: todos │
│  description  │              │  Filter:      │
│  priority     │              │  owner=$user  │
│  due_date     │              └──────────────┘
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Data Table   │
│  (insert mode)│
│  Table: todos │
└──────────────┘
```

## Step-by-Step

### 1. Define Routes (App Router)

```
Route: /       → Workflow: "Home Page"     → Auth: No
Route: /login  → Workflow: "Login"         → Auth: No
Route: /todos  → Workflow: "Todo List"     → Auth: Yes
Route: /api/todos → Workflow: "Todo API"   → Auth: Yes (API mode)
```

### 2. Setup Auth (Auth Gate)

- Mode: Trigger + Middleware
- Provider: built-in (email + password)
- Token expiry: 24h
- Allow signup: Yes
- Auto-creates `users` table with id, email, password_hash, name

### 3. Build Home Page (Page node)

```
Page: Home
  ├── Card: Welcome message with user name
  ├── List: Quick links to /todos, /login
  └── Button: "Go to My Todos" → /todos
```

### 4. Build Todo Input (Form → Data Table)

```
Form: "New Todo"
  ├── text field: "Title" (required)
  ├── textarea: "Description"
  ├── select: "Priority" (low/medium/high)
  └── date: "Due Date"

→ Output connects to:
Data Table (insert mode):
  └── Table: todos
  └── Auto-map: title→title, priority→priority, etc.
  └── Owner: $user.id (auto-set)
```

### 5. Build Todo List (Data Table inside Page)

```
Page: "My Todos"
  ├── Title: "My Todos"
  │
  ├── Data Table: (read mode)
  │   ├── Table: todos
  │   ├── Filters: owner = $user.id
  │   ├── Sort: due_date ASC
  │   ├── Columns: checkbox(done), title, priority, due_date
  │   ├── Row actions: Edit, Delete
  │   └── View mode: Table
  │
  └── Button: "Add Todo" → opens Form modal
```

### 6. Deploy

```
Deploy Engine
  ├── App name: "My Todo App"
  ├── Build: Docker Image
  └── Deploy to: Docker Host
```

Output: `docker run -p 5678:5678 my-todo-app:latest`

## What the User Gets

A live app at `http://localhost:5678` or `https://my-todo-app.com`:

```
┌─────────────────────────────────────┐
│  My App                     [Alice] │
├──────────┬──────────────────────────┤
│  Home    │  My Todos                 │
│  My Todos│                          │
│          │  ┌───┬────────┬────┬───┐  │
│          │  │ ☐ │ Buy... │high│ Jul│  │
│          │  │ ☑ │ Finish │med │ Jul│  │
│          │  │ ☐ │ Call.. │low │ Aug│  │
│          │  └───┴────────┴────┴───┘  │
│          │                    [+ Add]│
│          │                          │
│          │  [Logout]                 │
└──────────┴──────────────────────────┘
```

No code. No terminal. No framework. Just nodes.
