import pool from "@/lib/dbConfig";

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const startDate = url.searchParams.get("start_date"); // format YYYY-MM-DD
    const endDate = url.searchParams.get("end_date");     // format YYYY-MM-DD

    if (!startDate || !endDate) {
      return new Response(
        JSON.stringify({ success: false, message: "Parameter start_date dan end_date wajib dikirim." }),
        { status: 400 }
      );
    }

    const sql = `
    /*
      Perhitungan:
      - contract_net := ta.total_payment_room (nilai murni kontrak, tanpa ppn & tanpa admin_fee)
      - payments_agg: agregasi pembayaran per tenant yang approval_status='approved'
        -- sums untuk pembayaran sampai endDate (untuk piutang) dan sums dalam periode (untuk received_in_advance/ppn)
      - received_in_advance: jumlah pembayaran yang dibukukan di periode laporan dan accounting_date < start_date (dibayar sebelum mulai)
      - recognized_revenue: pro-rata berdasarkan hari (overlap days / total contract days) * contract_net
      - contractual receivable: contract_net - paid_up_to_end (batas minimum 0)
      - jtu_total: admin_fee dihitung sekali per kontrak sesuai rule
      - ppn_total: sum(ppn_amount) dari payments approved pada periode
    */

    WITH tenants AS (
      SELECT
        ta.id,
        ta.location_id,
        ta.start_date,
        ta.end_date,
        ta.total_payment_room::numeric AS contract_net,
        ta.admin_fee::numeric AS admin_fee,
        ta.payment_type
      FROM tenant_application ta
      WHERE ta.start_date IS NOT NULL
    ),

    -- agregasi payment per tenant: semua pembayaran yang sudah approved
    payments_agg_all AS (
      SELECT
        p.tenant_application_id,
        SUM(p.contract_amount)::numeric AS sum_contract_paid_all,
        SUM(p.ppn_amount)::numeric AS sum_ppn_all,
        SUM(p.amount)::numeric AS sum_amount_all,
        MAX(CASE WHEN p.remaining_balance = 0 THEN 1 ELSE 0 END) AS has_zero_remaining,
        MAX(p.accounting_date) AS last_accounting_date
      FROM payments p
      WHERE p.approval_status = 'approved'
        AND p.accounting_date <= $2::date    -- pembayaran yang sudah dibukukan sampai akhir periode
      GROUP BY p.tenant_application_id
    ),

    -- agregasi payment per tenant *di dalam periode laporan* (startDate..endDate)
    payments_agg_period AS (
      SELECT
        p.tenant_application_id,
        SUM(p.contract_amount)::numeric AS sum_contract_paid_period,
        SUM(p.ppn_amount)::numeric AS sum_ppn_period,
        SUM(p.amount)::numeric AS sum_amount_period
      FROM payments p
      WHERE p.approval_status = 'approved'
        AND p.accounting_date BETWEEN $1::date AND $2::date
      GROUP BY p.tenant_application_id
    ),

    -- received_before_start: jumlah pembayaran (contract_amount) yang dibukukan di periode laporan,
    -- namun accounting_date < start_date (dibayar sebelum start). Kita cap per tenant supaya tidak melebihi contract_net.
    received_before_start_per_tenant AS (
      SELECT
        t.id AS tenant_application_id,
        LEAST(COALESCE(pa.sum_contract_paid_period,0), t.contract_net) AS paid_in_period_capped
      FROM tenants t
      LEFT JOIN payments_agg_period pa ON pa.tenant_application_id = t.id
      -- But we only want the portion that was booked before start_date:
      -- We'll get that by summing payments with accounting_date BETWEEN period and accounting_date < start_date,
      -- but since payments_agg_period includes all in period, we filter with a join to raw payments below.
    ),

    -- To get the EXACT sum of contract_amount per tenant for payments in the period AND accounting_date < start_date,
    -- compute it from payments table directly:
    received_before_start_exact AS (
      SELECT
        p.tenant_application_id,
        SUM(p.contract_amount)::numeric AS sum_contract_paid_before_start
      FROM payments p
      WHERE p.approval_status = 'approved'
        AND p.accounting_date BETWEEN $1::date AND $2::date
        AND p.accounting_date < (SELECT start_date FROM tenant_application ta WHERE ta.id = p.tenant_application_id)
      GROUP BY p.tenant_application_id
    ),

    -- payments up to endDate (for piutang calculation)
    payments_paid_up_to_end AS (
      SELECT
        p.tenant_application_id,
        SUM(p.contract_amount)::numeric AS sum_contract_paid_up_to_end
      FROM payments p
      WHERE p.approval_status = 'approved'
        AND p.accounting_date <= $2::date
      GROUP BY p.tenant_application_id
    ),

    -- recognized revenue per tenant: pro-rata hari
    recognized_per_tenant AS (
      SELECT
        t.id AS tenant_application_id,
        t.contract_net,
        -- calculate total days of contract (inclusive)
        ( (t.end_date::date - t.start_date::date) + 1 )::numeric AS total_contract_days,
        -- calculate overlap days between [startDate..endDate] and [start_date..end_date]
        GREATEST(
          (LEAST($2::date, t.end_date::date) - GREATEST($1::date, t.start_date::date) + 1),
          0
        )::numeric AS overlap_days
      FROM tenants t
      WHERE t.start_date <= $2::date AND t.end_date >= $1::date
    ),

    recognized_revenue_calc AS (
      SELECT
        r.tenant_application_id,
        (r.contract_net * (r.overlap_days / NULLIF(r.total_contract_days, 0)))::numeric AS recognized_amount
      FROM recognized_per_tenant r
    ),

    -- contractual receivable per tenant (bounded >= 0)
    contractual_per_tenant AS (
      SELECT
        t.id AS tenant_application_id,
        t.contract_net,
        COALESCE(pu.sum_contract_paid_up_to_end, 0)::numeric AS paid_up_to_end,
        GREATEST(t.contract_net - COALESCE(pu.sum_contract_paid_up_to_end, 0), 0)::numeric AS remaining_receivable
      FROM tenants t
      LEFT JOIN payments_paid_up_to_end pu ON pu.tenant_application_id = t.id
      WHERE t.start_date <= $2::date
    ),

    -- total JTU: admin_fee counted once per tenant according to rules:
    --  - payment_type = 'lunas' -> add admin_fee if there's approved payment in period
    --  - payment_type = 'cicilan' -> add admin_fee only if exist approved payment with remaining_balance = 0 by endDate
    jtu_candidates AS (
      SELECT
        t.id,
        t.admin_fee,
        t.payment_type,
        COALESCE(pa.sum_contract_paid_up_to_end, 0) AS paid_up_to_end,
        COALESCE(pg.has_zero_remaining, 0) AS has_zero_remaining
      FROM tenants t
      LEFT JOIN payments_paid_up_to_end pa ON pa.tenant_application_id = t.id
      LEFT JOIN payments_agg_all pg ON pg.tenant_application_id = t.id
      -- We will ensure only counting those which have approved payments within period via final WHERE
    ),

    jtu_total_calc AS (
      SELECT
        SUM(
          CASE
            WHEN jc.payment_type = 'lunas' AND jc.paid_up_to_end > 0 THEN jc.admin_fee
            WHEN jc.payment_type = 'cicilan' AND jc.has_zero_remaining = 1 THEN jc.admin_fee
            ELSE 0
          END
        )::numeric AS total_jtu
      FROM jtu_candidates jc
    ),

    -- total ppn in period
    ppn_total_calc AS (
      SELECT SUM(p.ppn_amount)::numeric AS total_ppn
      FROM payments p
      WHERE p.approval_status = 'approved'
        AND p.accounting_date BETWEEN $1::date AND $2::date
    ),

    -- final aggregations (summing across tenants)
    received_total AS (
      SELECT COALESCE(SUM(LEAST(COALESCE(rbss.sum_contract_paid_before_start,0), t.contract_net)), 0)::numeric AS total_received_before_start
      FROM tenants t
      LEFT JOIN received_before_start_exact rbss ON rbss.tenant_application_id = t.id
    ),

    recognized_total AS (
      SELECT COALESCE(SUM(r.recognized_amount),0)::numeric AS total_recognized
      FROM recognized_revenue_calc r
    ),

    contractual_total AS (
      SELECT COALESCE(SUM(cr.remaining_receivable),0)::numeric AS total_piutang
      FROM contractual_per_tenant cr
    )

    SELECT
      (SELECT total_piutang FROM contractual_total) AS piutang_kontraktual,
      (SELECT total_received_before_start FROM received_total) AS pendapatan_diterima_dimuka,
      (SELECT total_recognized FROM recognized_total) AS pengakuan_kontrak_diterima_dimuka,
      COALESCE((SELECT total_jtu FROM jtu_total_calc),0) AS total_jtu,
      COALESCE((SELECT total_ppn FROM ppn_total_calc),0) AS total_ppn,
      (
        (SELECT total_piutang FROM contractual_total)
        + (SELECT total_received_before_start FROM received_total)
        - (SELECT total_recognized FROM recognized_total)
        + COALESCE((SELECT total_jtu FROM jtu_total_calc),0)
        + COALESCE((SELECT total_ppn FROM ppn_total_calc),0)
      )::numeric AS total_keseluruhan;
    `;

    const { rows } = await pool.query(sql, [startDate, endDate]);
    const result = rows[0] || {};

    const data = {
      pendapatan_diterima_dimuka: Number(result.pendapatan_diterima_dimuka || 0),
      pengakuan_kontrak_diterima_dimuka: Number(result.pengakuan_kontrak_diterima_dimuka || 0),
      piutang_kontraktual: Number(result.piutang_kontraktual || 0),
      total_jtu: Number(result.total_jtu || 0),
      total_ppn: Number(result.total_ppn || 0),
      total_keseluruhan: Number(result.total_keseluruhan || 0)
    };

    return new Response(JSON.stringify({ success: true, period: { startDate, endDate }, data }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error in accounting-summary:", err);
    return new Response(JSON.stringify({ success: false, message: err.message }), { status: 500 });
  }
}
