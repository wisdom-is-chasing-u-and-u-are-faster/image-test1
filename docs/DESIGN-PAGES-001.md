# Enterprise UI/UX Design System Specifications (DESIGN-PAGES-001)

## 1. Design Token Specifications
- Typography: Inter (-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto)
- Palette: Primary `#1e293b`, Accent `#2563eb`, Success `#16a34a`, Warning `#f59e0b`, Danger `#dc2626`
- Accessibility: Strict WCAG 2.1 AA contrast ratio (>= 4.5:1 for normal text)

## 2. Core Screen Architecture
1. **Requester Intake Form (`/tickets/new`)**: Dynamic cascading dropdowns, markdown editor, drag-and-drop file uploader.
2. **Agent Command Center (`/agent/inbox`)**: Split-view queue, 4 KPI counters ribbon, keyboard navigation shortcuts.
3. **Ticket Detail Workbench (`/agent/tickets/:id`)**: Lifecycle transition bar, resolve modal with mandatory notes, 409 conflict dialog.
4. **Global Search Console (`/agent/search`)**: Facet filter sidebar, highlighted search excerpts, URL sync.
5. **Audit History Drawer**: Slide-over drawer with JSON diff viewer and cryptographic SHA-256 badge.
