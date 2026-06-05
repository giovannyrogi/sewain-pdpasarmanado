import pool from "@/lib/dbConfig";
import { requireAuthenticatedUser } from "@/app/utils/auth";

const ROLES = {
  SUPERADMIN: 1,
  DIVISI_KONTRAK: 2,
  KEPALA_SEKSI: 3,
  KEPALA_SUBDIVISI: 4,
  KEPALA_DIVISI: 5,
  DIREKTUR_BISNIS: 6,
  DIREKTUR_UTAMA: 7,
  DIVISI_KEUANGAN: 8,
};

const APPROVAL_ROLES = new Set([
  ROLES.KEPALA_SEKSI,
  ROLES.KEPALA_SUBDIVISI,
  ROLES.KEPALA_DIVISI,
  ROLES.DIREKTUR_BISNIS,
  ROLES.DIREKTUR_UTAMA,
]);

const EXPIRING_CONTRACT_DAYS = 30;
const DUE_PAYMENT_DAYS = 30;
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
  /**
   * Mapping role dashboard mengikuti kebutuhan operasional:
   * approval hanya untuk role berjenjang, buku kontrak tidak untuk keuangan,
   * sedangkan status umum tetap terbuka untuk semua role dashboard.
   */
  canSeeTenantApprovalQueue: APPROVAL_ROLES.has(roleId),
  canSeePaymentValidationQueue: roleId === ROLES.DIVISI_KEUANGAN,
  canSeeTerminationApprovalQueue: APPROVAL_ROLES.has(roleId),
  canSeeContractBookMetric: roleId !== ROLES.DIVISI_KEUANGAN,
  canSeeDuePayments: true,
  canSeeExpiringContracts: true,
  canSeeRoomOperations: true,
  canSeeFinanceOperations: true,
  canSeeLatestPaymentOnly: roleId === ROLES.DIVISI_KEUANGAN,
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
            SUM(amount)::numeric AS total_with_tax,
            SUM(amount - COALESCE(ppn_amount, 0))::numeric AS total_without_tax
          FROM payments
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
          COALESCE(pt.total_with_tax, 0)::float AS total_with_tax,
          COALESCE(pt.total_without_tax, 0)::float AS total_without_tax
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
          SUM(amount)::numeric AS total_with_tax,
          SUM(amount - COALESCE(ppn_amount, 0))::numeric AS total_without_tax
        FROM payments
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
        COALESCE(pt.total_with_tax, 0)::float AS total_with_tax,
        COALESCE(pt.total_without_tax, 0)::float AS total_without_tax
      FROM months m
      LEFT JOIN payment_totals pt ON pt.bucket_number = m.bucket_number
      ORDER BY m.bucket_number ASC
    `,
    values: [year],
  };
};

export async function GET(request) {
  try {
    const { user, response } = await requireAuthenticatedUser();
    if (response) return response;

    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") === "month" ? "month" : "year";
    const year = clampYear(searchParams.get("year"));
    const month = clampMonth(searchParams.get("month"));
    const roleId = Number(user.role_id);
    const access = resolveDashboardAccess(roleId);
    const incomeChart = queryIncomeChart({ period, year, month });

    const summaryQuery = `
      WITH terminated AS (
        SELECT tenant_application_id
        FROM tenant_early_terminations
        WHERE approval_status = 'approved' AND is_terminated = true
      ),
      contract_status AS (
        SELECT
          COUNT(*) FILTER (
            WHERE ta.approval_status = 'approved'
              AND ta.document_number IS NOT NULL
              AND t.tenant_application_id IS NULL
              AND NOT EXISTS (
                SELECT 1
                FROM tenant_application child
                WHERE child.renewal_of = ta.id
              )
              AND ta.end_date::date >= CURRENT_DATE
          )::int AS active,
          COUNT(*) FILTER (
            WHERE ta.approval_status = 'approved'
              AND ta.document_number IS NOT NULL
              AND t.tenant_application_id IS NULL
              AND NOT EXISTS (
                SELECT 1
                FROM tenant_application child
                WHERE child.renewal_of = ta.id
              )
              AND ta.end_date::date < CURRENT_DATE
          )::int AS expired,
          COUNT(t.tenant_application_id)::int AS terminated
        FROM tenant_application ta
        LEFT JOIN terminated t ON t.tenant_application_id = ta.id
      ),
      rooms_status AS (
        SELECT
          COUNT(*) FILTER (WHERE status = 'available')::int AS available,
          COUNT(*) FILTER (WHERE status = 'occupied')::int AS occupied,
          COUNT(*) FILTER (WHERE status = 'maintenance')::int AS maintenance,
          COUNT(*) FILTER (WHERE status = 'unavailable')::int AS unavailable,
          COUNT(*)::int AS total
        FROM rooms
      ),
      application_status AS (
        SELECT
          COUNT(*) FILTER (WHERE approval_status = 'proses')::int AS process,
          COUNT(*) FILTER (WHERE approval_status = 'approved')::int AS approved,
          COUNT(*) FILTER (WHERE approval_status = 'rejected')::int AS rejected
        FROM tenant_application
      ),
      termination_status AS (
        SELECT
          COUNT(*) FILTER (WHERE approval_status = 'proses')::int AS process,
          COUNT(*) FILTER (WHERE approval_status = 'approved' AND is_terminated = true)::int AS approved,
          COUNT(*) FILTER (WHERE approval_status = 'rejected')::int AS rejected
        FROM tenant_early_terminations
      ),
      current_income AS (
        SELECT
          COALESCE(SUM(amount), 0)::float AS with_tax,
          COALESCE(SUM(amount - COALESCE(ppn_amount, 0)), 0)::float AS without_tax
        FROM payments
        WHERE approval_status = 'approved'
          AND payment_date >= date_trunc('month', CURRENT_DATE)
          AND payment_date < date_trunc('month', CURRENT_DATE) + INTERVAL '1 month'
      ),
      due_candidates AS (
        SELECT
          next_payment.next_payment_number,
          CASE
            WHEN ta.payment_type = 'cicilan' AND next_payment.next_payment_number <= 2 THEN ta.estimated_installment_1_date
            WHEN ta.payment_type = 'cicilan' AND next_payment.next_payment_number = 3 THEN ta.estimated_installment_2_date
            WHEN ta.payment_type = 'cicilan' AND next_payment.next_payment_number = 4 THEN ta.estimated_installment_3_date
            ELSE NULL
          END AS due_date
        FROM tenant_application ta
        LEFT JOIN terminated t ON t.tenant_application_id = ta.id
        LEFT JOIN LATERAL (
          SELECT COALESCE(MAX(p.payment_number), 0) + 1 AS next_payment_number
          FROM payments p
          WHERE p.tenant_application_id = ta.id
            AND p.approval_status = 'approved'
        ) next_payment ON TRUE
        WHERE ta.approval_status = 'approved'
          AND ta.payment_type = 'cicilan'
          AND COALESCE(ta.is_fully_paid, false) = false
          AND t.tenant_application_id IS NULL
          AND next_payment.next_payment_number <= 4
          AND NOT EXISTS (
            SELECT 1
            FROM tenant_application child
            WHERE child.renewal_of = ta.id
              AND child.approval_status = 'approved'
          )
          AND NOT EXISTS (
            SELECT 1
            FROM payments pending_payment
            WHERE pending_payment.tenant_application_id = ta.id
              AND pending_payment.approval_status IN ('proses', 'rejected')
          )
      ),
      payment_due AS (
        SELECT
          COUNT(*) FILTER (WHERE due_date::date < CURRENT_DATE)::int AS overdue,
          COUNT(*) FILTER (
            WHERE due_date::date >= CURRENT_DATE
              AND due_date::date <= CURRENT_DATE + ($1::int * INTERVAL '1 day')
          )::int AS due_soon
        FROM due_candidates
        WHERE due_date IS NOT NULL
      ),
      expiring_contracts AS (
        SELECT COUNT(*)::int AS total
        FROM tenant_application ta
        LEFT JOIN terminated t ON t.tenant_application_id = ta.id
        WHERE ta.approval_status = 'approved'
          AND ta.document_number IS NOT NULL
          AND t.tenant_application_id IS NULL
          AND NOT EXISTS (
            SELECT 1
            FROM tenant_application child
            WHERE child.renewal_of = ta.id
          )
          AND ta.end_date::date BETWEEN CURRENT_DATE AND CURRENT_DATE + ($2::int * INTERVAL '1 day')
      ),
      contracts_created AS (
        SELECT COUNT(*)::int AS total
        FROM contracts
      )
      SELECT json_build_object(
        'contracts', row_to_json(contract_status),
        'rooms', row_to_json(rooms_status),
        'applications', row_to_json(application_status),
        'terminations', row_to_json(termination_status),
        'income', row_to_json(current_income),
        'payments', row_to_json(payment_due),
        'expiringContracts', (SELECT total FROM expiring_contracts),
        'contractsCreated', (SELECT total FROM contracts_created)
      ) AS data
      FROM contract_status, rooms_status, application_status, termination_status, current_income, payment_due
    `;

    const tenantApprovalQueueQuery = `
      WITH pending AS (
        SELECT
          ta.id AS tenant_application_id,
          tap.id AS approval_id,
          ti.full_name AS tenant_name,
          ta.document_number,
          l.location_name,
          r.room_number,
          ta.created_at
        FROM tenant_approval tap
        JOIN tenant_application ta ON ta.id = tap.tenant_application_id
        JOIN tenant_identities ti ON ti.id = ta.tenant_identity_id
        JOIN locations l ON l.id = ta.location_id
        JOIN rooms r ON r.id = ta.room_id
        WHERE tap.status = 'pending'
          AND ta.approval_status = 'proses'
          AND ta.current_step = tap.step_order
          AND tap.role_id = $2
      )
      SELECT
        (SELECT COUNT(*)::int FROM pending) AS total,
        COALESCE((
          SELECT json_agg(row_to_json(limited) ORDER BY created_at DESC)
          FROM (SELECT * FROM pending ORDER BY created_at DESC LIMIT $1) limited
        ), '[]'::json) AS items
    `;

    const paymentApprovalQueueQuery = `
      WITH pending AS (
        SELECT
          p.id AS payment_id,
          pa.id AS approval_id,
          ta.id AS tenant_application_id,
          ti.full_name AS tenant_name,
          ta.document_number,
          p.amount,
          p.payment_date,
          p.created_at
        FROM payment_approval pa
        JOIN payments p ON p.id = pa.payment_id
        JOIN tenant_application ta ON ta.id = p.tenant_application_id
        JOIN tenant_identities ti ON ti.id = ta.tenant_identity_id
        WHERE pa.status = 'pending'
          AND p.approval_status = 'proses'
          AND pa.role_id = $2
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
          tet.id AS termination_id,
          tta.id AS approval_id,
          ta.id AS tenant_application_id,
          ti.full_name AS tenant_name,
          ta.document_number,
          tet.reason,
          tet.created_at
        FROM tenant_termination_approval tta
        JOIN tenant_early_terminations tet ON tet.id = tta.tenant_early_termination_id
        JOIN tenant_application ta ON ta.id = tet.tenant_application_id
        JOIN tenant_identities ti ON ti.id = ta.tenant_identity_id
        WHERE tta.status = 'pending'
          AND tet.approval_status = 'proses'
          AND tet.current_step = tta.step_order
          AND tta.role_id = $2
      )
      SELECT
        (SELECT COUNT(*)::int FROM pending) AS total,
        COALESCE((
          SELECT json_agg(row_to_json(limited) ORDER BY created_at DESC)
          FROM (SELECT * FROM pending ORDER BY created_at DESC LIMIT $1) limited
        ), '[]'::json) AS items
    `;

    const duePaymentsQuery = `
      WITH terminated AS (
        SELECT tenant_application_id
        FROM tenant_early_terminations
        WHERE approval_status = 'approved' AND is_terminated = true
      ),
      due_candidates AS (
        SELECT
          ta.id AS tenant_application_id,
          ta.document_number,
          ta.current_payment_step,
          ta.remaining_payment,
          ta.payment_type,
          next_payment.next_payment_number,
          CASE
            WHEN next_payment.next_payment_number <= 1 THEN 'Uang Muka'
            ELSE CONCAT('Cicilan ', next_payment.next_payment_number - 1)
          END AS payment_step_label,
          ti.full_name AS tenant_name,
          l.location_name,
          r.room_number,
          CASE
            WHEN ta.payment_type = 'cicilan' AND next_payment.next_payment_number <= 2 THEN ta.estimated_installment_1_date
            WHEN ta.payment_type = 'cicilan' AND next_payment.next_payment_number = 3 THEN ta.estimated_installment_2_date
            WHEN ta.payment_type = 'cicilan' AND next_payment.next_payment_number = 4 THEN ta.estimated_installment_3_date
            ELSE NULL
          END AS due_date
        FROM tenant_application ta
        JOIN tenant_identities ti ON ti.id = ta.tenant_identity_id
        JOIN locations l ON l.id = ta.location_id
        JOIN rooms r ON r.id = ta.room_id
        LEFT JOIN terminated t ON t.tenant_application_id = ta.id
        LEFT JOIN LATERAL (
          SELECT COALESCE(MAX(p.payment_number), 0) + 1 AS next_payment_number
          FROM payments p
          WHERE p.tenant_application_id = ta.id
            AND p.approval_status = 'approved'
        ) next_payment ON TRUE
        WHERE ta.approval_status = 'approved'
          AND ta.payment_type = 'cicilan'
          AND COALESCE(ta.is_fully_paid, false) = false
          AND t.tenant_application_id IS NULL
          AND next_payment.next_payment_number <= 4
          AND NOT EXISTS (
            SELECT 1
            FROM tenant_application child
            WHERE child.renewal_of = ta.id
              AND child.approval_status = 'approved'
          )
          AND NOT EXISTS (
            SELECT 1
            FROM payments pending_payment
            WHERE pending_payment.tenant_application_id = ta.id
              AND pending_payment.approval_status IN ('proses', 'rejected')
          )
      )
      , classified AS (
        SELECT
          *,
          (due_date::date - CURRENT_DATE)::int AS days_remaining,
          CASE
            WHEN due_date::date < CURRENT_DATE THEN 'overdue'
            ELSE 'dueSoon'
          END AS due_status
        FROM due_candidates
        WHERE due_date IS NOT NULL
          AND due_date::date <= CURRENT_DATE + ($1::int * INTERVAL '1 day')
      ),
      ranked AS (
        SELECT
          *,
          ROW_NUMBER() OVER (
            PARTITION BY due_status
            ORDER BY
              CASE WHEN due_status = 'overdue' THEN due_date END DESC,
              CASE WHEN due_status = 'dueSoon' THEN due_date END ASC,
              tenant_application_id DESC
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
        CASE WHEN due_status = 'dueSoon' THEN due_date END ASC,
        CASE WHEN due_status = 'overdue' THEN due_date END DESC
    `;

    const expiringContractsQuery = `
      WITH terminated AS (
        SELECT tenant_application_id
        FROM tenant_early_terminations
        WHERE approval_status = 'approved' AND is_terminated = true
      )
      , classified AS (
        SELECT
          ta.id AS tenant_application_id,
          ta.document_number,
          ta.end_date,
          ti.full_name AS tenant_name,
          l.location_name,
          r.room_number,
          (ta.end_date::date - CURRENT_DATE)::int AS days_remaining,
          CASE
            WHEN ta.end_date::date < CURRENT_DATE THEN 'expired'
            ELSE 'expiringSoon'
          END AS contract_status
        FROM tenant_application ta
        JOIN tenant_identities ti ON ti.id = ta.tenant_identity_id
        JOIN locations l ON l.id = ta.location_id
        JOIN rooms r ON r.id = ta.room_id
        LEFT JOIN terminated t ON t.tenant_application_id = ta.id
        WHERE ta.approval_status = 'approved'
          AND ta.document_number IS NOT NULL
          AND t.tenant_application_id IS NULL
          AND NOT EXISTS (
            SELECT 1
            FROM tenant_application child
            WHERE child.renewal_of = ta.id
          )
          AND (
            ta.end_date::date < CURRENT_DATE
            OR ta.end_date::date BETWEEN CURRENT_DATE AND CURRENT_DATE + ($1::int * INTERVAL '1 day')
          )
      ),
      ranked AS (
        SELECT
          *,
          ROW_NUMBER() OVER (
            PARTITION BY contract_status
            ORDER BY
              CASE WHEN contract_status = 'expired' THEN end_date END DESC,
              CASE WHEN contract_status = 'expiringSoon' THEN end_date END ASC,
              tenant_application_id DESC
          ) AS category_rank
        FROM classified
      )
      SELECT
        *,
        COUNT(*) OVER (PARTITION BY contract_status)::int AS category_total
      FROM ranked
      WHERE category_rank <= $2
      ORDER BY
        CASE WHEN contract_status = 'expiringSoon' THEN 0 ELSE 1 END,
        CASE WHEN contract_status = 'expiringSoon' THEN end_date END ASC,
        CASE WHEN contract_status = 'expired' THEN end_date END DESC
    `;

    const latestContractsQuery = `
      SELECT
        c.id AS contract_id,
        c.contract_number,
        c.contract_date,
        ta.id AS tenant_application_id,
        ta.document_number,
        ti.full_name AS tenant_name,
        l.location_name,
        r.room_number,
        c.created_at
      FROM contracts c
      JOIN tenant_application ta ON ta.id = c.tenant_application_id
      JOIN tenant_identities ti ON ti.id = ta.tenant_identity_id
      JOIN locations l ON l.id = ta.location_id
      JOIN rooms r ON r.id = ta.room_id
      ORDER BY c.created_at DESC
      LIMIT $1
    `;

    const roomsByLocationQuery = `
      SELECT
        l.id AS location_id,
        l.location_name,
        COUNT(r.id)::int AS total_rooms,
        COUNT(*) FILTER (WHERE r.status = 'available')::int AS available,
        COUNT(*) FILTER (WHERE r.status = 'occupied')::int AS occupied,
        COUNT(*) FILTER (WHERE r.status = 'maintenance')::int AS maintenance,
        COUNT(*) FILTER (WHERE r.status = 'unavailable')::int AS unavailable
      FROM locations l
      LEFT JOIN rooms r ON r.location_id = l.id
      GROUP BY l.id, l.location_name
      HAVING COUNT(r.id) > 0
      ORDER BY available DESC, total_rooms DESC, l.location_name ASC
      LIMIT 8
    `;

    const recentActivityQuery = `
      SELECT
        n.id,
        n.type,
        n.title,
        n.message,
        n.entity_type,
        n.entity_id,
        n.action_url,
        n.priority,
        n.created_at
      FROM notifications n
      JOIN notification_recipients nr ON nr.notification_id = n.id
      WHERE nr.user_id = $1
        AND nr.archived_at IS NULL
        AND (
          $3::boolean = false
          OR n.entity_type = 'payment'
          OR n.type ILIKE 'payment%'
        )
      ORDER BY n.created_at DESC
      LIMIT $2
    `;

    const [
      summary,
      chart,
      tenantApproval,
      paymentApproval,
      terminationApproval,
      duePayments,
      expiringContracts,
      latestContracts,
      roomsByLocation,
      recentActivity,
    ] = await Promise.all([
      pool.query(summaryQuery, [DUE_PAYMENT_DAYS, EXPIRING_CONTRACT_DAYS]),
      pool.query(incomeChart.text, incomeChart.values),
      access.canSeeTenantApprovalQueue
        ? pool.query(tenantApprovalQueueQuery, [LIST_LIMIT, roleId])
        : Promise.resolve({ rows: [{ total: 0, items: [] }] }),
      access.canSeePaymentValidationQueue
        ? pool.query(paymentApprovalQueueQuery, [LIST_LIMIT, roleId])
        : Promise.resolve({ rows: [{ total: 0, items: [] }] }),
      access.canSeeTerminationApprovalQueue
        ? pool.query(terminationApprovalQueueQuery, [LIST_LIMIT, roleId])
        : Promise.resolve({ rows: [{ total: 0, items: [] }] }),
      access.canSeeDuePayments
        ? pool.query(duePaymentsQuery, [DUE_PAYMENT_DAYS, LIST_LIMIT])
        : Promise.resolve({ rows: [] }),
      access.canSeeExpiringContracts
        ? pool.query(expiringContractsQuery, [EXPIRING_CONTRACT_DAYS, LIST_LIMIT])
        : Promise.resolve({ rows: [] }),
      access.canSeeContractBookMetric
        ? pool.query(latestContractsQuery, [LIST_LIMIT])
        : Promise.resolve({ rows: [] }),
      access.canSeeRoomOperations
        ? pool.query(roomsByLocationQuery)
        : Promise.resolve({ rows: [] }),
      pool.query(recentActivityQuery, [
        user.id,
        LIST_LIMIT,
        access.canSeeLatestPaymentOnly,
      ]),
    ]);

    const tenantApprovalRow = tenantApproval.rows[0] || {};
    const paymentApprovalRow = paymentApproval.rows[0] || {};
    const terminationApprovalRow = terminationApproval.rows[0] || {};

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
            tenantApproval: {
              total: toNumber(tenantApprovalRow.total),
              items: tenantApprovalRow.items || [],
            },
            paymentApproval: {
              total: toNumber(paymentApprovalRow.total),
              items: paymentApprovalRow.items || [],
            },
            terminationApproval: {
              total: toNumber(terminationApprovalRow.total),
              items: terminationApprovalRow.items || [],
            },
            duePayments: duePayments.rows,
            expiringContracts: expiringContracts.rows,
            latestContracts: latestContracts.rows,
          },
          roomsByLocation: roomsByLocation.rows,
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
    console.error("Error fetching dashboard overview:", error);
    return Response.json(
      { success: false, message: "Gagal mengambil data dashboard." },
      { status: 500 },
    );
  }
}
