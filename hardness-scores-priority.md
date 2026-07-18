# Hardness Scores & Priority

**Overall Hardness Rating: 8/10**

## Breakdown

| Aspect | Difficulty | Reasoning |
|--------|-----------|-----------|
| Custom node class (TypeScript) | 3/10 | n8n's node API is well-documented |
| Generating HTML from a node | 4/10 | Template strings or HTML templating library |
| n8n Data Table for persistent storage | 3/10 | n8n already has a Data Table node |
| Auth / sessions / JWT | 5/10 | Web server auth inside n8n's workflow engine |
| Page rendering with sub-node assembly | 7/10 | Cluster Node system not designed for dynamic UI composition |
| Multi-page routing (App Router) | 7/10 | Coordinating across workflows means building a custom runner |
| Deploy node / packaging | 6/10 | Dockerizing n8n with baked config |
| Frontend SPA rendering | 8/10 | Turning node JSON into interactive SPA without React/Next.js |
| Overall integration | 8.5/10 | All pieces working within n8n's execution cycle |
| Production polish | 9/10 | Load times, error states, responsive, a11y, mobile |

## P80 Estimate: 2-3 months solo

- 2 weeks: functional custom node that renders HTML
- 1 month: basic Page node with sub-node assembly
- 2 months: Auth + Data Table CRUD
- 3 months: App Router with multi-page navigation + end-to-end Todo app
- Remaining: Deploy node, SSG/SSR split, polish, edge cases

**Counterfactual:** Building the same thing in Python with FastAPI directly would be simpler and faster, BUT you lose the visual drag-drop UI and the 400+ n8n integrations. The hardness lives in the constraint: all inside n8n.
