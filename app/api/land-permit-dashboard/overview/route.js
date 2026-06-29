import pool from "@/lib/dbConfig";
import {
  forbiddenResponse,
  requireAuthenticatedUser,
} from "@/app/utils/auth";

const ROLES = {
  SUPERADMIN: 1,
  KEPALA_SEKSI: 3,
  KEPALA_SUBDIVISI: 4,
  KEPALA_DIVISI: 5,
  DIREKTUR_BISNIS: 6,
  DIREKTUR_UTAMA: 7,
  DIVISI_KEUANGAN: 8,
  ADMIN_IZIN_LAHAN: 9,
};

const DASHBOARD_ROLES = new Set([
  ROLES.SUPERADMIN,
  ROLES.KEPALA_SEKSI,
  ROLES.KEPALA_SUBDIVISI,
  ROLES.KEPALA_DIVISI,
  ROLES.DIREKTUR_BISNIS,
  ROLES.DIREKTUR_UTAMA,
  ROLES.DIVISI_KEUANGAN,
  ROLES.ADMIN_IZIN_LAHAN,
]);

const APPROVAL_ROLES = new Set([
  ROLES.KEPALA_SEKSI,
  ROLES.KEPALA_SUBDIVISI,
  ROLES.KEPALA_DIVISI,
  ROLES.DIREKTUR_BISNIS,
  ROLES.DIREKTUR_UTAMA,
]);

const DUE_PAYMENT_DAYS = 30;
const EXPIRING_PERMIT_DAYS = 30;
const LIST_LIMIT = 6;

const toNumber = (value) => Number(value || 0);

const clampYear = (value) => {
  const year = Number(value);
  const currentYear = new Date().getFullYear();
  if (!Number.isInteger(year) || year < 2000 || year > currentYear + 1) {
    return currentYear;
  }
  return year;
};

const clampMonth = (value) => {
  const month = Number(value);
  return Number.isInteger(month) && month >= 1 && month <= 12
    ? month
    : new Date().getMonth() + 1;
};

const resolveDashboardAccess = (roleId) => ({
  canSeeApplicationApprovalQueue:
    roleId === ROLES.SUPERADMIN || APPROVAL_ROLES.has(roleId),
  canSeeTerminationApprovalQueue:
    roleId === ROLES.SUPERADMIN || APPROVAL_ROLES.has(roleId),
  canSeePaymentValidationQueue:
    roleId === ROLES.SUPERADMIN || roleId === ROLES.DIVISI_KEUANGAN,
  canSeePaymentDue: true,
  canSeeExpiringPermits: true,
  canSeeLandOperations: true,
  canSeeFinanceOperations: true,
});

const queryIncomeChart = ({ period, year, month }) => {
  if (period === "month") {
    return {
      text: `
        WITH days AS (
          SELECT generate_series(
            make_date($1::int, $2::int, 1),
            (make_date($1::int, $2::int, 1) + INTERVAL '1 month - 1 day')::date,
            INTERVAL '1 day'
          )::date AS bucket_date
        ),
        payment_totals AS (
          SELECT
            payment_date::date AS bucket_date,
            SUM(amount)::numeric AS total_income
          FROM land_permit_payments
          WHERE approval_status = 'approved'
            AND payment_date >= make_date($1::int, $2::int, 1)
            AND payment_date < make_date($1::int, $2::int, 1) + INTERVAL '1 month'
          GROUP BY payment_date::date
        )
        SELECT
          EXTRACT(DAY FROM d.bucket_date)::int AS bucket_number,
          d.bucket_date::date AS bucket_date,
          TO_CHAR(d.bucket_date, 'DD') AS label,
          TO_CHAR(d.bucket_date, 'FMDay, DD Mon YYYY') AS tooltip_label,
          COALESCE(pt.total_income, 0)::float AS total_income
        FROM days d
        LEFT JOIN payment_totals pt ON pt.bucket_date = d.bucket_date
        ORDER BY d.bucket_date ASC
      `,
      values: [year, month],
    };
  }

  return {
    text: `
      WITH months AS (
        SELECT generate_series(1, 12)::int AS bucket_number
      ),
      payment_totals AS (
        SELECT
          EXTRACT(MONTH FROM payment_date)::int AS bucket_number,
          SUM(amount)::numeric AS total_income
        FROM land_permit_payments
        WHERE approval_status = 'approved'
          AND payment_date >= make_date($1::int, 1, 1)
          AND payment_date < make_date($1::int + 1, 1, 1)
        GROUP BY EXTRACT(MONTH FROM payment_date)::int
      )
      SELECT
        m.bucket_number,
        make_date($1::int, m.bucket_number, 1)::date AS bucket_date,
        TO_CHAR(make_date($1::int, m.bucket_number, 1), 'Mon') AS label,
        TO_CHAR(make_date($1::int, m.bucket_number, 1), 'FMMonth YYYY') AS tooltip_label,
        COALESCE(pt.total_income, 0)::float AS total_income
      FROM months m
      LEFT JOIN payment_totals pt ON pt.bucket_number = m.bucket_number
      ORDER BY m.bucket_number ASC
    `,
    values: [year],
  };
};

const groupStallsByLocation = (rows) => {
  const locationMap = new Map();

  rows.forEach((row) => {
    if (!locationMap.has(row.location_id)) {
      locationMap.set(row.location_id, {
        location_id: row.location_id,
        location_name: row.location_name,
        total_stalls: 0,
        available: 0,
        occupied: 0,
        maintenance: 0,
        unavailable: 0,
        sectors: [],
      });
    }

    const location = locationMap.get(row.location_id);
    const sector = {
      sector_id: row.sector_id,
      sector_name: row.sector_name,
      sector_code: row.sector_code,
      total_stalls: toNumber(row.total_stalls),
      available: toNumber(row.available),
      occupied: toNumber(row.occupied),
      maintenance: toNumber(row.maintenance),
      unavailable: toNumber(row.unavailable),
    };

    location.total_stalls += sector.total_stalls;
    location.available += sector.available;
    location.occupied += sector.occupied;
    location.maintenance += sector.maintenance;
    location.unavailable += sector.unavailable;
    location.sectors.push(sector);
  });

  return Array.from(locationMap.values()).sort((a, b) => {
    if (b.available !== a.available) return b.available - a.available;
    if (b.total_stalls !== a.total_stalls) return b.total_stalls - a.total_stalls;
    return String(a.location_name).localeCompare(String(b.location_name));
  });
};

export async function GET(request) {
  try {
    const { user, response } = await requireAuthenticatedUser();
    if (response) return response;

    const roleId = Number(user.role_id);
    if (!DASHBOARD_ROLES.has(roleId)) {
      return forbiddenResponse();
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") === "month" ? "month" : "year";
    const year = clampYear(searchParams.get("year"));
    const month = clampMonth(searchParams.get("month"));
    const access = resolveDashboardAccess(roleId);
    const incomeChart = queryIncomeChart({ period, year, month });

    const roleFilterValue = roleId === ROLES.SUPERADMIN ? null : roleId;

    const summaryQuery = `
      WITH final_terminations AS (
        SELECT land_permit_application_id
        FROM land_permit_terminations
        WHERE approval_status = 'approved'
          AND is_terminated = true
      ),
      permit_status AS (
        SELECT
          COUNT(*) FILTER (
            WHERE app.approval_status = 'approved'
              AND app.payment_status = 'paid'
              AND COALESCE(app.is_fully_paid, false) = true
              AND app.permit_status = 'active'
              AND app.end_date::date >= CURRENT_DATE
              AND ft.land_permit_application_id IS NULL
          )::int AS active,
          COUNT(*) FILTER (
            WHERE app.approval_status = 'approved'
              AND app.permit_status <> 'terminated'
              AND app.end_date::date < CURRENT_DATE
              AND ft.land_permit_application_id IS NULL
          )::int AS expired,
          COUNT(*) FILTER (
            WHERE app.permit_status = 'terminated'
              OR ft.land_permit_application_id IS NOT NULL
          )::int AS terminated
        FROM land_permit_applications app
        LEFT JOIN final_terminations ft ON ft.land_permit_application_id = app.id
      ),
      stalls_status AS (
        SELECT
          COUNT(*) FILTER (WHERE status = 'available')::int AS available,
          COUNT(*) FILTER (WHERE status = 'occupied')::int AS occupied,
          COUNT(*) FILTER (WHERE status = 'maintenance')::int AS maintenance,
          COUNT(*) FILTER (WHERE status = 'unavailable')::int AS unavailable,
          COUNT(*)::int AS total
        FROM land_stalls
      ),
      application_status AS (
        SELECT
          COUNT(*) FILTER (WHERE approval_status = 'proses')::int AS process,
          COUNT(*) FILTER (WHERE approval_status = 'approved')::int AS approved,
          COUNT(*) FILTER (WHERE approval_status = 'rejected')::int AS rejected
        FROM land_permit_applications
      ),
      termination_status AS (
        SELECT
          COUNT(*) FILTER (WHERE approval_status = 'proses')::int AS process,
          COUNT(*) FILTER (WHERE approval_status = 'approved' AND is_terminated = true)::int AS approved,
          COUNT(*) FILTER (WHERE approval_status = 'rejected')::int AS rejected
        FROM land_permit_terminations
      ),
      current_income AS (
        SELECT COALESCE(SUM(amount), 0)::float AS total
        FROM land_permit_payments
        WHERE approval_status = 'approved'
          AND payment_date >= date_trunc('month', CURRENT_DATE)
          AND payment_date < date_trunc('month', CURRENT_DATE) + INTERVAL '1 month'
      ),
      payment_due AS (
        SELECT
          COUNT(*) FILTER (WHERE app.start_date::date < CURRENT_DATE)::int AS overdue,
          COUNT(*) FILTER (
            WHERE app.start_date::date >= CURRENT_DATE
              AND app.start_date::date <= CURRENT_DATE + ($1::int * INTERVAL '1 day')
          )::int AS due_soon
        FROM land_permit_applications app
        WHERE app.approval_status = 'approved'
          AND app.permit_status <> 'terminated'
          AND (
            app.payment_status <> 'paid'
            OR COALESCE(app.is_fully_paid, false) = false
          )
          AND NOT EXISTS (
            SELECT 1
            FROM land_permit_payments payment
            WHERE payment.land_permit_application_id = app.id
              AND payment.approval_status IN ('proses', 'approved')
          )
      ),
      expiring_permits AS (
        SELECT COUNT(*)::int AS total
        FROM land_permit_applications app
        LEFT JOIN final_terminations ft ON ft.land_permit_application_id = app.id
        WHERE app.approval_status = 'approved'
          AND app.payment_status = 'paid'
          AND COALESCE(app.is_fully_paid, false) = true
          AND app.permit_status = 'active'
          AND ft.land_permit_application_id IS NULL
          AND app.end_date::date BETWEEN CURRENT_DATE AND CURRENT_DATE + ($2::int * INTERVAL '1 day')
      ),
      documents_created AS (
        SELECT COUNT(*)::int AS total
        FROM land_permit_documents
        WHERE document_type = 'permit_document'
          AND status <> 'void'
      )
      SELECT json_build_object(
        'permits', row_to_json(permit_status),
        'stalls', row_to_json(stalls_status),
        'applications', row_to_json(application_status),
        'terminations', row_to_json(termination_status),
        'income', row_to_json(current_income),
        'payments', row_to_json(payment_due),
        'expiringPermits', (SELECT total FROM expiring_permits),
        'documentsCreated', (SELECT total FROM documents_created)
      ) AS data
      FROM permit_status, stalls_status, application_status, termination_status, current_income, payment_due
    `;

    const applicationApprovalQueueQuery = `
      WITH pending AS (
        SELECT
          app.id AS land_permit_application_id,
          approval.id AS approval_id,
          identity.full_name AS tenant_name,
          identity.nik AS tenant_nik,
          app.commodity_type,
          location.location_name,
          sector.sector_name,
          sector.sector_code,
          stall.stall_number,
          app.created_at
        FROM land_permit_approval approval
        JOIN land_permit_applications app
          ON app.id = approval.land_permit_application_id
        JOIN tenant_identities identity ON identity.id = app.tenant_identity_id
        JOIN locations location ON location.id = app.location_id
        JOIN land_sectors sector ON sector.id = app.sector_id
        JOIN land_stalls stall ON stall.id = app.stall_id
        WHERE approval.status = 'pending'
          AND app.approval_status = 'proses'
          AND app.current_step = approval.step_order
          AND ($2::int IS NULL OR approval.role_id = $2::int)
      )
      SELECT
        (SELECT COUNT(*)::int FROM pending) AS total,
        COALESCE((
          SELECT json_agg(row_to_json(limited) ORDER BY created_at DESC)
          FROM (SELECT * FROM pending ORDER BY created_at DESC LIMIT $1) limited
        ), '[]'::json) AS items
    `;

    const terminationApprovalQueueQuery = `
      WITH pending AS (
        SELECT
          termination.id AS land_permit_termination_id,
          approval.id AS approval_id,
          app.id AS land_permit_application_id,
          identity.full_name AS tenant_name,
          app.commodity_type,
          location.location_name,
          sector.sector_name,
          sector.sector_code,
          stall.stall_number,
          termination.reason,
          termination.created_at
        FROM land_permit_termination_approval approval
        JOIN land_permit_terminations termination
          ON termination.id = approval.land_permit_termination_id
        JOIN land_permit_applications app
          ON app.id = termination.land_permit_application_id
        JOIN tenant_identities identity ON identity.id = app.tenant_identity_id
        JOIN locations location ON location.id = app.location_id
        JOIN land_sectors sector ON sector.id = app.sector_id
        JOIN land_stalls stall ON stall.id = app.stall_id
        WHERE approval.status = 'pending'
          AND termination.approval_status = 'proses'
          AND termination.current_step = approval.step_order
          AND ($2::int IS NULL OR approval.role_id = $2::int)
      )
      SELECT
        (SELECT COUNT(*)::int FROM pending) AS total,
        COALESCE((
          SELECT json_agg(row_to_json(limited) ORDER BY created_at DESC)
          FROM (SELECT * FROM pending ORDER BY created_at DESC LIMIT $1) limited
        ), '[]'::json) AS items
    `;

    const paymentValidationQueueQuery = `
      WITH pending AS (
        SELECT
          payment.id AS payment_id,
          approval.id AS approval_id,
          app.id AS land_permit_application_id,
          identity.full_name AS tenant_name,
          payment.amount,
          payment.payment_date,
          location.location_name,
          sector.sector_name,
          stall.stall_number,
          payment.created_at
        FROM land_permit_payment_approval approval
        JOIN land_permit_payments payment
          ON payment.id = approval.land_permit_payment_id
        JOIN land_permit_applications app
          ON app.id = payment.land_permit_application_id
        JOIN tenant_identities identity ON identity.id = app.tenant_identity_id
        JOIN locations location ON location.id = app.location_id
        JOIN land_sectors sector ON sector.id = app.sector_id
        JOIN land_stalls stall ON stall.id = app.stall_id
        WHERE approval.status = 'pending'
          AND payment.approval_status = 'proses'
          AND ($2::int IS NULL OR approval.role_id = $2::int)
      )
      SELECT
        (SELECT COUNT(*)::int FROM pending) AS total,
        COALESCE((
          SELECT json_agg(row_to_json(limited) ORDER BY created_at DESC)
          FROM (SELECT * FROM pending ORDER BY created_at DESC LIMIT $1) limited
        ), '[]'::json) AS items
    `;

    const duePaymentsQuery = `
      WITH classified AS (
        SELECT
          app.id AS land_permit_application_id,
          identity.full_name AS tenant_name,
          app.commodity_type,
          app.start_date,
          app.total_payment,
          location.location_name,
          sector.sector_name,
          sector.sector_code,
          stall.stall_number,
          (app.start_date::date - CURRENT_DATE)::int AS days_remaining,
          CASE
            WHEN app.start_date::date < CURRENT_DATE THEN 'overdue'
            ELSE 'dueSoon'
          END AS due_status
        FROM land_permit_applications app
        JOIN tenant_identities identity ON identity.id = app.tenant_identity_id
        JOIN locations location ON location.id = app.location_id
        JOIN land_sectors sector ON sector.id = app.sector_id
        JOIN land_stalls stall ON stall.id = app.stall_id
        WHERE app.approval_status = 'approved'
          AND app.permit_status <> 'terminated'
          AND (
            app.payment_status <> 'paid'
            OR COALESCE(app.is_fully_paid, false) = false
          )
          AND NOT EXISTS (
            SELECT 1
            FROM land_permit_payments payment
            WHERE payment.land_permit_application_id = app.id
              AND payment.approval_status IN ('proses', 'approved')
          )
          AND app.start_date::date <= CURRENT_DATE + ($1::int * INTERVAL '1 day')
      ),
      ranked AS (
        SELECT
          *,
          ROW_NUMBER() OVER (
            PARTITION BY due_status
            ORDER BY
              CASE WHEN due_status = 'overdue' THEN start_date END DESC,
              CASE WHEN due_status = 'dueSoon' THEN start_date END ASC,
              land_permit_application_id DESC
          ) AS category_rank
        FROM classified
      )
      SELECT
        *,
        COUNT(*) OVER (PARTITION BY due_status)::int AS category_total
      FROM ranked
      WHERE category_rank <= $2
      ORDER BY
        CASE WHEN due_status = 'dueSoon' THEN 0 ELSE 1 END,
        CASE WHEN due_status = 'dueSoon' THEN start_date END ASC,
        CASE WHEN due_status = 'overdue' THEN start_date END DESC
    `;

    const expiringPermitsQuery = `
      WITH final_terminations AS (
        SELECT land_permit_application_id
        FROM land_permit_terminations
        WHERE approval_status = 'approved'
          AND is_terminated = true
      ),
      classified AS (
        SELECT
          app.id AS land_permit_application_id,
          identity.full_name AS tenant_name,
          app.commodity_type,
          app.start_date,
          app.end_date,
          location.location_name,
          sector.sector_name,
          sector.sector_code,
          stall.stall_number,
          (app.end_date::date - CURRENT_DATE)::int AS days_remaining,
          CASE
            WHEN app.end_date::date < CURRENT_DATE THEN 'expired'
            ELSE 'expiringSoon'
          END AS permit_expiry_status
        FROM land_permit_applications app
        JOIN tenant_identities identity ON identity.id = app.tenant_identity_id
        JOIN locations location ON location.id = app.location_id
        JOIN land_sectors sector ON sector.id = app.sector_id
        JOIN land_stalls stall ON stall.id = app.stall_id
        LEFT JOIN final_terminations ft ON ft.land_permit_application_id = app.id
        WHERE app.approval_status = 'approved'
          AND app.payment_status = 'paid'
          AND COALESCE(app.is_fully_paid, false) = true
          AND app.permit_status = 'active'
          AND ft.land_permit_application_id IS NULL
          AND (
            app.end_date::date < CURRENT_DATE
            OR app.end_date::date BETWEEN CURRENT_DATE AND CURRENT_DATE + ($1::int * INTERVAL '1 day')
          )
      ),
      ranked AS (
        SELECT
          *,
          ROW_NUMBER() OVER (
            PARTITION BY permit_expiry_status
            ORDER BY
              CASE WHEN permit_expiry_status = 'expired' THEN end_date END DESC,
              CASE WHEN permit_expiry_status = 'expiringSoon' THEN end_date END ASC,
              land_permit_application_id DESC
          ) AS category_rank
        FROM classified
      )
      SELECT
        *,
        COUNT(*) OVER (PARTITION BY permit_expiry_status)::int AS category_total
      FROM ranked
      WHERE category_rank <= $2
      ORDER BY
        CASE WHEN permit_expiry_status = 'expiringSoon' THEN 0 ELSE 1 END,
        CASE WHEN permit_expiry_status = 'expiringSoon' THEN end_date END ASC,
        CASE WHEN permit_expiry_status = 'expired' THEN end_date END DESC
    `;

    const stallsByLocationQuery = `
      SELECT
        location.id AS location_id,
        location.location_name,
        sector.id AS sector_id,
        sector.sector_name,
        sector.sector_code,
        COUNT(stall.id)::int AS total_stalls,
        COUNT(*) FILTER (WHERE stall.status = 'available')::int AS available,
        COUNT(*) FILTER (WHERE stall.status = 'occupied')::int AS occupied,
        COUNT(*) FILTER (WHERE stall.status = 'maintenance')::int AS maintenance,
        COUNT(*) FILTER (WHERE stall.status = 'unavailable')::int AS unavailable
      FROM locations location
      JOIN land_sectors sector ON sector.location_id = location.id
      LEFT JOIN land_stalls stall ON stall.sector_id = sector.id
      GROUP BY
        location.id,
        location.location_name,
        sector.id,
        sector.sector_name,
        sector.sector_code
      HAVING COUNT(stall.id) > 0
      ORDER BY location.location_name ASC, sector.sector_name ASC
    `;

    const recentActivityQuery = `
      SELECT
        notification.id,
        notification.type,
        notification.title,
        notification.message,
        notification.entity_type,
        notification.entity_id,
        notification.action_url,
        notification.priority,
        notification.created_at
      FROM notifications notification
      JOIN notification_recipients recipient
        ON recipient.notification_id = notification.id
      WHERE recipient.user_id = $1
        AND recipient.archived_at IS NULL
        AND (
          notification.metadata->>'module' = 'land_permit'
          OR notification.entity_type ILIKE 'land_permit%'
          OR notification.type ILIKE '%land_permit%'
        )
      ORDER BY notification.created_at DESC
      LIMIT $2
    `;

    const [
      summary,
      chart,
      applicationApproval,
      terminationApproval,
      paymentValidation,
      duePayments,
      expiringPermits,
      stallsByLocation,
      recentActivity,
    ] = await Promise.all([
      pool.query(summaryQuery, [DUE_PAYMENT_DAYS, EXPIRING_PERMIT_DAYS]),
      pool.query(incomeChart.text, incomeChart.values),
      access.canSeeApplicationApprovalQueue
        ? pool.query(applicationApprovalQueueQuery, [LIST_LIMIT, roleFilterValue])
        : Promise.resolve({ rows: [{ total: 0, items: [] }] }),
      access.canSeeTerminationApprovalQueue
        ? pool.query(terminationApprovalQueueQuery, [LIST_LIMIT, roleFilterValue])
        : Promise.resolve({ rows: [{ total: 0, items: [] }] }),
      access.canSeePaymentValidationQueue
        ? pool.query(paymentValidationQueueQuery, [
            LIST_LIMIT,
            roleId === ROLES.SUPERADMIN ? null : ROLES.DIVISI_KEUANGAN,
          ])
        : Promise.resolve({ rows: [{ total: 0, items: [] }] }),
      access.canSeePaymentDue
        ? pool.query(duePaymentsQuery, [DUE_PAYMENT_DAYS, LIST_LIMIT])
        : Promise.resolve({ rows: [] }),
      access.canSeeExpiringPermits
        ? pool.query(expiringPermitsQuery, [EXPIRING_PERMIT_DAYS, LIST_LIMIT])
        : Promise.resolve({ rows: [] }),
      access.canSeeLandOperations
        ? pool.query(stallsByLocationQuery)
        : Promise.resolve({ rows: [] }),
      pool.query(recentActivityQuery, [user.id, LIST_LIMIT]),
    ]);

    const applicationApprovalRow = applicationApproval.rows[0] || {};
    const terminationApprovalRow = terminationApproval.rows[0] || {};
    const paymentValidationRow = paymentValidation.rows[0] || {};

    return Response.json(
      {
        success: true,
        data: {
          userRole: {
            id: roleId,
            name: user.role_name,
          },
          access,
          filters: { period, year, month },
          summary: summary.rows[0]?.data || {},
          incomeChart: chart.rows,
          queues: {
            applicationApproval: {
              total: toNumber(applicationApprovalRow.total),
              items: applicationApprovalRow.items || [],
            },
            terminationApproval: {
              total: toNumber(terminationApprovalRow.total),
              items: terminationApprovalRow.items || [],
            },
            paymentValidation: {
              total: toNumber(paymentValidationRow.total),
              items: paymentValidationRow.items || [],
            },
            duePayments: duePayments.rows,
            expiringPermits: expiringPermits.rows,
          },
          stallsByLocation: groupStallsByLocation(stallsByLocation.rows),
          recentActivity: recentActivity.rows,
        },
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      },
    );
  } catch (error) {
    console.error("Error fetching land permit dashboard overview:", error);
    return Response.json(
      { success: false, message: "Gagal mengambil data dashboard izin lahan." },
      { status: 500 },
    );
  }
}
