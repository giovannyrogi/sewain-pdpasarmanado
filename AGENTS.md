# SewaIN Project Agent Guidelines

## Purpose

This file contains project-specific instructions for AI agents working on SewaIN.
Global Codex instructions still apply, but this file is the source of truth for
SewaIN architecture, UI patterns, business flows, security expectations, and
maintenance rules.

SewaIN is a production-grade Next.js application for room rental management,
tenant applications, approvals, payments, contracts, terminations, notifications,
and reports.

## Task Classification

Before starting work, classify the request.

### Type A - Discussion / Review / Analysis

Examples:

- Asking questions
- Requesting explanations
- Requesting suggestions
- Requesting opinions
- Requesting recommendations
- Reviewing code
- Reviewing architecture
- Reviewing AGENTS.md
- Brainstorming
- Planning features
- Security reviews
- Performance reviews
- UI/UX reviews

For these tasks:

- Do not scan the entire repository.
- Do not inspect unrelated files.
- Only review files explicitly provided by the user.
- Analyze the requested topic directly.
- Provide recommendations first.
- Do not modify code unless explicitly requested.

### Type B - Implementation / Bug Fix / Refactor

Examples:

- Adding features
- Fixing bugs
- Refactoring code
- Modifying UI
- Modifying APIs
- Modifying database logic
- Updating business logic

For these tasks:

- Inspect relevant files before making changes.
- Analyze existing architecture.
- Identify reusable components.
- Identify impacted files.
- Verify related business flows before implementation.

## AGENTS.md Maintenance Exception

When updating or reviewing AGENTS.md:

- Treat the task as documentation work.
- Do not scan the entire repository.
- Do not inspect unrelated source files.
- Only inspect project files when necessary to validate a project-specific rule.
- Focus on improving the guidance itself unless repository-wide validation is explicitly requested.

## Project Documentation

Additional project documentation exists under `docs/`.

Consult these documents only when they are relevant to the current task:

- `docs/DATABASE_SCHEMA.md` for database tables, columns, data types, relations, constraints, triggers, indexes, and schema rules.

Do not load all documentation automatically.

For UI-only, styling-only, copywriting, documentation review, or AGENTS.md review tasks, do not read database documentation unless explicitly requested.

## First Rule For Implementation Tasks

For Type B tasks, inspect the relevant existing files and understand:

- Current user flow
- Existing component patterns
- Existing API route behavior
- Existing database fields
- Existing utilities
- Related approval, payment, contract, termination, and notification flows

Do not assume implementation details from memory. Read the code first.

## Scope Control

Only change files required by the user's request.

Do not:

- Refactor unrelated pages.
- Rename files unrelated to the task.
- Change database behavior without being asked.
- Change business logic during UI-only redesign unless the user explicitly requests it.
- Revert user changes.
- Remove files unless imports/references have been checked.

When a page is being migrated or redesigned, keep the output and business flow
the same unless the user asks for a functional change.

## File Size Rules

Keep files maintainable.

Guidelines:

- Prefer files under 800 lines.
- Extract reusable logic when files become too large.
- Extract table columns into separate files when appropriate.
- Extract complex modal logic into dedicated components.
- Keep page files focused on state, data flow, and orchestration.

Do not split files unnecessarily. Split only when it improves readability,
maintainability, or reuse.

## Project Stack And Conventions

SewaIN currently uses:

- Next.js App Router.
- JavaScript, not TypeScript.
- MUI for layout, theme-aware styling, and most UI primitives.
- Ant Design table through a reusable wrapper.
- Iconify icons.
- Axios for frontend calls to internal `/api/...` routes.
- PostgreSQL through parameterized queries.
- Session/auth helpers from `app/utils/auth`.

Follow existing file and folder conventions. Do not introduce a new architecture
unless there is a strong reason and the user approves it.

## Reusable Components Must Be Checked First

Before creating a new UI component, search for an existing reusable component.

Prefer using or extending:

- `app/components/page-header/PageHeader.jsx`
- `app/components/data-table/DataTableShell.jsx`
- `app/components/data-table/ReusableAntTable.jsx`
- `app/components/stats/SummaryStatCard.jsx`
- `app/components/crud/CrudFormModal.jsx`
- `app/components/crud/CrudConfirmModal.jsx`
- `app/components/modals/AppModal.jsx`
- `app/components/modals/TenantLeaseDetailModal.jsx`
- `app/components/modals/ApprovalTrackingModal.jsx`
- `app/components/modals/RejectReasonModal.jsx`
- `app/components/status/ApprovalStatusChip.jsx`
- `app/components/loading/Backdrop.jsx`
- `app/components/Notification.jsx`

Do not create duplicate table, modal, confirmation dialog, loading backdrop,
status chip, snackbar, formatter, or detail modal behavior.

## Reusable Logic Must Be Checked First

Before creating any new:

- Utility
- Helper
- Hook
- Formatter
- Mapper
- Validation function
- Export function
- API helper
- Query helper
- Calculation helper

Search for an existing implementation first.

Prefer extending existing reusable logic instead of creating new files.

Do not create duplicate:

- Currency formatters
- Date formatters
- Number formatters
- Validation functions
- API helpers
- Data mappers
- Export helpers
- Calculation logic
- Permission helpers
- Status mapping helpers

Only create a new implementation when no suitable reusable solution exists.

## Page Refactor And Redesign Rules

When redesigning a page:

- Use `PageHeader` for page identity and breadcrumbs.
- Use `SummaryStatCard` for reusable summary cards.
- Use `DataTableShell` and `ReusableAntTable` for table pages.
- Put table column definitions in a separate file when the page is complex.
- Keep page files manageable. Prefer extracting table columns, mappers, exports,
  and form modal logic instead of letting one `page.jsx` grow too large.
- Use existing modal components for CRUD and detail flows.
- Fully migrate old modals/components when requested. Avoid half-migration.
- Delete legacy files only after confirming they are no longer imported.

For tables:

- Use `ReusableAntTable` for centralized AntD styling.
- Use the fixed action column support when the action column is sticky.
- Keep fixed action columns opaque in dark and light themes.
- Horizontal scroll is acceptable for wide operational tables, but it must be
  responsive and visually clean.

## UI And UX Standards

All UI changes must support:

- Dark theme.
- Light theme.
- Mobile.
- Tablet.
- Desktop.

Use theme values instead of hardcoded colors whenever possible.

Follow these UI principles:

- Modern, clean, professional, and compact where data density matters.
- No duplicate information.
- No duplicate actions.
- Clear hierarchy.
- Clear labels.
- Clear empty, loading, success, and error states.
- Important information should be easy to scan.
- Use icons where they improve action recognition.
- Use max font weight 700 unless an existing component intentionally uses more.

For form modals:

- Use clear spacing between fields and actions.
- Use contained red/error style for destructive or cancel actions when appropriate.
- Keep primary submit actions visually distinct from cancel/delete actions.
- Keep upload controls readable and accessible on mobile.

## Backend And API Security

Backend security is mandatory.

Always:

- Use `requireAuthenticatedUser()` or `getAuthenticatedUser()` for protected APIs.
- Validate IDs from URL/search params before querying.
- Validate and normalize request body values.
- Use parameterized SQL queries.
- Use transactions for critical multi-step writes.
- Return safe error messages to the frontend.
- Log detailed server errors on the server only.
- Check role/authorization before returning or mutating protected data.

Never trust these values from the frontend as the actor:

- `user_id`
- `approver_id`
- `processed_by`
- `created_by`
- `updated_by`

The actor must come from the authenticated session.

For approval/reject APIs:

- Verify the logged-in role matches the approval step.
- Verify the entity ID belongs to the approval record.
- Verify previous approval steps before allowing current approval.
- Do not let finance role enter tenant approval or termination approval flows
  unless a feature explicitly requires it.

## Environment Variable Rules

Never hardcode:

- API keys.
- Secrets.
- JWT secrets.
- SMTP credentials.
- Database credentials.
- Payment gateway credentials.
- Third-party service credentials.

Always:

- Use environment variables.
- Keep `.env` files ignored by Git.
- Maintain `.env.example` when new environment keys are required.
- Never expose backend-only values through `NEXT_PUBLIC_*`.
- Never commit real credentials into the repository.
- Keep server-only configuration inside API routes, server utilities, or backend
  helpers. Only use `NEXT_PUBLIC_*` for values that are intentionally safe for
  the browser.
- When adding a new required environment variable, document the key in
  `.env.example` and make missing configuration fail with a safe, clear server
  error.

## Frontend Security

Frontend permissions are for user experience only. Backend APIs must enforce the
real permissions.

Do not expose:

- Secrets.
- Backend-only tokens.
- Stack traces.
- Raw database errors.
- Internal implementation details.

Do not put private backend configuration into `NEXT_PUBLIC_*`.

## API Call Rules

Follow existing API call patterns.

- Use relative internal Next.js API routes under `/api/...`, following the
  existing route pattern for the feature being changed.
- Examples include feature routes such as `/api/locations`, `/api/floors`,
  `/api/rooms`, `/api/tenant-applications`, `/api/tenant-approval`,
  `/api/payments`, `/api/contracts`, and `/api/tenant-terminations`. Treat these
  as examples, not as the only allowed routes.
- Handle loading, success, error, and empty states.
- Avoid duplicate API calls.
- Keep API-related mapping logic reusable when data shapes are shared between pages.

Do not force a separate centralized API client unless the project already has one
or the user asks for that refactor.

## Database Rules

When working with database-related code:

- Avoid `SELECT *` in new code.
- Fetch only required fields.
- Use pagination or scoped queries for large datasets.
- Avoid N+1 queries.
- Use transactions for multi-table writes.
- Validate data before insert/update.
- Preserve current schema assumptions unless the user asks for schema changes.

## Database Migration Rules

Do not modify database schema unless explicitly requested.

Before suggesting schema changes:

- Explain the reason.
- Explain backward compatibility impact.
- Provide PostgreSQL migration SQL.
- Identify affected pages, APIs, and reports.

Never silently change database structure.
Keep schema migrations separate from UI-only refactors unless the user explicitly
asks for database work in the same task.

## Business Logic And Calculation Rules

Do not duplicate payment, rent, PPN, installment, or lease calculation logic.

Search and reuse existing helpers, including:

- `calculateAllPayments`
- `calculateRoomRent`
- `buildPaymentDetail`
- `formatNumber`
- `formatRupiah`

When changing tenant application, payment, contract, or room pricing logic:

- Verify the current formula first.
- Preserve existing output unless the user asks for a change.
- Update all detail displays consistently.
- Ensure create, edit, detail, print, and approval views agree.

## Notification Flow Rules

SewaIN notification data is user-specific through recipients/read/archive state.

Do not permanently delete notification records for "clear" actions. Use archive
or per-recipient state.

Notification behavior must remain informative and compact:

- Highlight important details such as document number, tenant name, room, location,
  actor, and next approver.
- Do not include long rejection reasons in notification list text.
- Use detail/progress modals for full information.
- Do not notify the actor with their own tracking notification unless it is a
  personal confirmation such as "approval berhasil diproses".
- Finance role should only receive payment-related notifications unless explicitly
  required otherwise.

Clicking notifications must:

- Route to the correct page based on role/access.
- Open the intended detail or progress modal.
- Fetch fresh data before opening the modal when stale browser state is possible.
- Show clear error feedback when the target data no longer exists.

## Approval Flow Rules

Tenant application approval and tenant termination approval are role-based,
step-based flows.

Do not break:

- Step order.
- Current step checks.
- Role checks.
- Approved/rejected final states.
- Notification tracking.
- Progress modal behavior.

For role approval pages, keep action flow focused:

- Detail modal for reviewing data.
- Approval action when allowed by role and step.
- Reject reason modal for rejection.
- Progress tracking modal for status history.

## Payments Flow Rules

Payment verification is separate from tenant approval.

Finance role handles payment validation. Tenant approval roles should not be
mixed into payment verification unless the existing feature explicitly supports it.

Payment detail views should use shared lease/detail components where possible.
If payment-specific fields are needed, normalize/mapping helpers should prepare
data for the shared modal instead of duplicating a separate full detail modal.

Receipt/print behavior must be changed carefully. Preserve existing layout unless
the user asks for redesign.

## File Cleanup Rules

After migration:

- Search with `rg` before deleting old files.
- Delete only files that are no longer imported or used.
- Do not delete a folder just because it looks old; confirm references first.
- Keep compatibility with existing routes and imports.

## Comments And Documentation

Use comments where they help future maintenance.

Prefer comments for:

- Complex business logic.
- Approval/notification side effects.
- Data mapping between API shape and UI shape.
- Security-sensitive decisions.
- Non-obvious UI behavior.

Avoid comments that simply restate obvious code.

## Testing And Verification

Before finalizing code changes, run the relevant checks when possible:

- `npm.cmd run lint`
- `npm.cmd run build`

For significant UI changes, verify in the browser when a logged-in session is
available. If browser verification is blocked by login/session, state that clearly.

Also check:

- Dark theme.
- Light theme.
- Mobile layout.
- Desktop layout.
- Modals.
- Tables.
- Fixed action columns.
- Loading, empty, success, and error states.

## Final Response Expectations

When reporting completed work:

- Mention changed areas briefly.
- Mention verification commands run.
- Mention anything not verified and why.
- Do not over-explain unrelated implementation details.

The goal of every change is to make SewaIN more maintainable, secure, consistent,
and easier for future developers to understand.
