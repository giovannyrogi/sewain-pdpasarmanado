# SewaIN Project Agent Guidelines

## Purpose

This file contains project-specific instructions for AI agents working on SewaIN.
Global Codex instructions still apply, but this file is the source of truth for
SewaIN architecture, UI patterns, business flows, security expectations, and
maintenance rules.

SewaIN is a production-grade Next.js application for room rental management,
land permit management, tenant applications, approvals, payments, contracts,
terminations, notifications, and reports.

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
- Protected application pages must use a consistent responsive wrapper with
  theme-aware background, safe padding, and spacing so content never sticks to
  the sidebar, navbar, or topbar on mobile, tablet, or desktop.

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

Every frontend UI creation, redesign, or adjustment must be planned and checked
for mobile, tablet, and desktop layouts. Responsive behavior is not optional,
even for small styling fixes.

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
- Land permit QR document URLs may use `NEXT_PUBLIC_APP_BASE_URL` because the
  value is a public browser URL, not a secret. In local network testing this can
  point to a LAN address such as `http://192.168.1.4:3000`; in production it
  must point to the real public application domain.
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

## Public Route Rules

Most SewaIN pages are protected and must require login. Public pages are
exceptions and must be explicitly designed for unauthenticated access.

Current public route:

- `/verify/izin-lahan/[token]` for QR validation of land permit documents.

Rules:

- Put public pages under `app/(public)` so the folder structure clearly
  separates public pages from protected pages. Route groups do not appear in the
  URL, so `app/(public)/verify/izin-lahan/[token]/page.jsx` still serves
  `/verify/izin-lahan/[token]`.
- Do not assume a route is public just because it is inside `(public)`.
  `middleware.js` must explicitly whitelist public paths or prefixes.
- Keep the public whitelist narrow. At the moment, only `/login` and
  `/verify/izin-lahan` should bypass the login redirect.
- `AppProviders.jsx` must treat public pages like login pages for session
  expiry behavior: do not show expired-session modals and do not redirect public
  verification pages to `/login`.
- Public verification pages should include `noindex, nofollow` metadata so they
  are not indexed by search engines.
- Public route UI should be split cleanly when it needs interactive behavior:
  keep `page.jsx` as the server component for fetching/metadata, and move MUI
  styling callbacks, image preview, state, and other browser behavior into a
  dedicated client component such as `LandPermitVerificationClient.jsx`.
- Public pages must still be theme-aware, mobile-first, and responsive on
  mobile, tablet, and desktop.
- Public APIs must remain read-only unless a future requirement explicitly says
  otherwise.

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

## Land Permit Module Rules

The Izin Lahan feature is a separate module inside SewaIN. Keep it isolated from
room rental transaction tables while reusing truly shared master data.

Shared tables allowed for both modules:

- `locations`
- `users`
- `roles`
- `tenant_identities`
- `notifications`

Land permit-specific data must use land permit tables:

- `land_sectors`
- `land_stalls`
- `land_permit_applications`
- `land_permit_approval`
- `land_permit_payments`
- `land_permit_payment_approval`
- `land_permit_terminations`
- `land_permit_termination_approval`
- `land_permit_documents`

Rules:

- `Admin Izin Lahan` is role ID `9`.
- Do not store land permit applications in `tenant_application`.
- Do not store land permit payments in `payments`.
- Do not store land permit terminations in `tenant_early_terminations`.
- Use `tenant_identities` as the shared identity master for room rental and
  land permit flows. Do not duplicate KTP, NIK, name, address, or KTP file
  fields in land permit tables.
- Optional identity photos for land permit documents/cards belong on
  `tenant_identities.profile_photo_file_path`. Room rental flows must not
  require this field.
- Keep land permit identity eligibility separate from room rental identity
  status by using `tenant_identities.land_permit_status`,
  `tenant_identities.land_permit_status_notes`, and
  `tenant_identities.land_permit_status_updated_at`.
- Do not create a separate trader profile table unless a future requirement
  introduces trader-specific attributes that cannot belong to one permit
  application. Commodity/trade type for land permits belongs to the land permit
  application because it can differ between permit requests.
- Land permit pricing is simpler than room rental pricing:
  `stall_length * stall_width * price_per_m2 * lease_duration_years`.
- Land permit payments do not use PPN, PPH, admin fee, down payment, or
  installments unless the business flow is explicitly changed later.
- Land permit approval uses separate approval tables and pages, even when it
  reuses the same UI components and approval role sequence.
- Land permit QR validation must use opaque tokens. Do not place full NIK,
  private identity data, or complete payment details directly in QR payloads.

### Land Permit QR Verification Rules

Land permit documents use QR codes for field validation by officers. The QR code
must open a public, read-only validation page without requiring login, but only
safe information may be shown.

Architecture:

- The public page lives at `/verify/izin-lahan/[token]`.
- The source file should live under
  `app/(public)/verify/izin-lahan/[token]/page.jsx`.
- Keep server-only fetching and metadata in `page.jsx`.
- Put interactive UI in a client component such as
  `LandPermitVerificationClient.jsx`.
- Use shared service/query logic such as
  `app/utils/landPermitVerificationService.js` for both server page loading and
  public API response mapping when possible.
- The public API endpoint is
  `/api/public/land-permit-verification/[token]`.

Token behavior:

- Use `land_permit_documents.qr_token` as the only value in the QR URL.
- The QR token is an opaque random token, not a NIK, application ID, document
  number, database ID, or encoded private data.
- Generate the token once when a land permit document is created.
- Backfill old documents that do not yet have a token.
- The token should not change every scan. It stays stable for that document so
  the printed QR remains usable.
- The token only changes if a future explicit regenerate/revoke feature is
  implemented, or if the document is deleted and recreated.
- Anyone who has the URL containing the token can open the public verification
  page. Treat the token as a public bearer validation link and therefore expose
  only safe, whitelisted fields.
- Validate token format before querying, and use parameterized SQL.

QR URL rules:

- Printed QR codes should use `NEXT_PUBLIC_APP_BASE_URL` when available.
- Fallback to `window.location.origin` only when a configured base URL is not
  available.
- For local testing from another device, use a LAN base URL such as
  `http://192.168.1.4:3000` instead of `localhost`, because `localhost` on a
  phone points to the phone itself.
- Production QR codes must use the real deployed domain, not a LAN or localhost
  URL.

Allowed public data:

- Validation status label and clear reason in simple Indonesian.
- Document number.
- Tenant/trader name.
- Masked NIK only.
- Profile photo/pass photo, because it is needed for field matching.
- Location, sector, land/stall number.
- Commodity/trade type.
- Land/stall dimensions.
- Permit validity dates.
- Document created/printed date when available.
- Land permit identity status using safe labels.

Never expose on the public QR page or public API:

- Full NIK.
- Phone number.
- Full home address.
- KTP photo/file.
- Payment nominal or detailed payment history.
- Approval history.
- Internal database IDs.
- Raw database errors or stack traces.

Validation statuses should be written in simple Indonesian for non-technical
users:

- `Izin Aktif`: the permit is registered and currently valid.
- `Belum Mulai`: the permit exists but the validity period has not started yet.
- `Masa Izin Habis`: the permit validity period has expired.
- `Izin Dinonaktifkan`: the permit was terminated, cancelled, or disabled and
  must not be treated as active.
- `Pedagang Nonaktif`: the identity is no longer active for the land permit
  module.
- `Pedagang Diblokir`: the identity is blacklisted for the land permit module.
- `Izin Belum Aktif`: the document/application/payment state is not complete
  enough to be considered active.
- `Data Tidak Ditemukan`: the token is invalid, unknown, or the document is no
  longer available.

Nonactive and terminated permits:

- A terminated or nonactive permit must still be viewable from its QR page as
  historical validation data.
- If `land_permit_applications.permit_status = 'terminated'`, show the status as
  `Izin Dinonaktifkan`.
- For final approved terminations, read the reason from
  `land_permit_terminations.reason` where `approval_status = 'approved'` and
  `is_terminated = true`.
- If the identity is inactive or blacklisted for the land permit module, show
  the safe status and reason from
  `tenant_identities.land_permit_status_notes` when available.
- Do not hide the record just because it is inactive; make the inactive status
  clear so field officers can understand why the permit is no longer valid.

Security expectations:

- Public verification APIs are read-only and must return a whitelist object,
  never raw table rows.
- Add light rate limiting when practical.
- Keep protected detail pages as the only place for full identity, payment,
  approval, and internal workflow information.
- Do not widen middleware public access to all `(public)` routes automatically.
  Public access must be explicit and intentional.
- If a future QR revoke/regenerate feature is added, preserve old document audit
  history and clearly define whether old printed QR codes should stop working.

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
- Room rental and land permit notifications must be separated. Use
  `metadata.module = "room_rental"` for room rental notifications and
  `metadata.module = "land_permit"` for land permit notifications.
- Land permit notifications should use land permit entity types such as
  `land_permit_application`, `land_permit_payment`, and
  `land_permit_termination`.
- Admin Kontrak must not receive land permit workflow notifications, and Admin
  Izin Lahan must not receive room rental workflow notifications.

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

Land permit approval and land permit termination approval are also role-based,
step-based flows, but they must remain in their own tables, API routes, pages,
and notifications. Reuse generic approval UI components where possible without
mixing room rental and land permit data sources.

## Payments Flow Rules

Payment verification is separate from tenant approval.

Finance role handles payment validation. Tenant approval roles should not be
mixed into payment verification unless the existing feature explicitly supports it.

Payment detail views should use shared lease/detail components where possible.
If payment-specific fields are needed, normalize/mapping helpers should prepare
data for the shared modal instead of duplicating a separate full detail modal.

Receipt/print behavior must be changed carefully. Preserve existing layout unless
the user asks for redesign.

Land permit payment validation is separate from room rental payment validation.
It should use land permit payment tables and should not inherit room rental-only
fields such as PPN, PPH, admin fee, down payment, or installment calculations.

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
