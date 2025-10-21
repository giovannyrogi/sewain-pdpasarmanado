// app/api/reports/income-by-location/route.js
import pool from "@/lib/dbConfig";
import moment from "moment";

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const start = url.searchParams.get("start_date");
    const end = url.searchParams.get("end_date");

    const startMoment = start
      ? moment(start, ["DD-MM-YYYY", "YYYY-MM-DD"], true)
      : moment().startOf("month");
    const endMoment = end
      ? moment(end, ["DD-MM-YYYY", "YYYY-MM-DD"], true)
      : moment().endOf("month");

    const startDate = startMoment.format("YYYY-MM-DD");
    const endDate = endMoment.format("YYYY-MM-DD");

    const sql = `
      WITH approved_payments AS (
        SELECT
          p.id,
          p.tenant_application_id,
          p.contract_amount,
          p.ppn_amount,
          p.remaining_balance,
          p.amount,
          ta.location_id,
          ta.payment_type,
          ta.admin_fee,
          ta.total_payment_room,
          ta.total_ppn AS ta_ppn
        FROM payments p
        JOIN tenant_application ta ON ta.id = p.tenant_application_id
        WHERE p.payment_date BETWEEN $1 AND $2
          AND EXISTS (
            SELECT 1 FROM payment_approval pa
            WHERE pa.payment_id = p.id AND pa.status = 'approved'
          )
      ),
      cicilan_summary AS (
      SELECT
        location_id,
        SUM(contract_amount_sum - admin_fee) AS kontrak,
        SUM(ppn_sum) AS ppn,
        SUM(admin_fee) AS jtu
      FROM (
        SELECT
          ta.id AS tenant_application_id,
          ta.location_id,
          ta.admin_fee,
          SUM(p.contract_amount) AS contract_amount_sum,
          SUM(p.ppn_amount) AS ppn_sum
        FROM payments p
        JOIN tenant_application ta ON ta.id = p.tenant_application_id
        WHERE ta.payment_type = 'cicilan'
        GROUP BY ta.id, ta.location_id, ta.admin_fee
      ) sub
      GROUP BY location_id
    ),
      lunas_summary AS (
        SELECT
          location_id,
          SUM(total_payment_room) AS kontrak,
          SUM(admin_fee) AS jtu,
          SUM(ta_ppn) AS ppn
        FROM approved_payments
        WHERE payment_type = 'lunas'
        GROUP BY location_id
      ),
      combined AS (
        SELECT
          COALESCE(c.location_id, l.location_id) AS location_id,
          COALESCE(c.kontrak, 0) + COALESCE(l.kontrak, 0) AS kontrak,
          COALESCE(c.ppn, 0) + COALESCE(l.ppn, 0) AS ppn,
          COALESCE(c.jtu, 0) + COALESCE(l.jtu, 0) AS jtu
        FROM cicilan_summary c
        FULL JOIN lunas_summary l ON c.location_id = l.location_id
      )
      SELECT
        loc.id AS location_id,
        loc.location_name,
        ROUND(cb.kontrak, 2) AS income_contracts,
        ROUND(cb.jtu, 2) AS jtu,
        ROUND(cb.kontrak + cb.jtu, 2) AS income_contract_without_ppn,
        ROUND(cb.ppn, 2) AS total_ppn,
        ROUND(cb.kontrak + cb.jtu + cb.ppn, 2) AS income_contract_with_ppn,
        ROUND(cb.kontrak * 0.10, 10) AS total_pph,
        ROUND((cb.kontrak + cb.jtu) - (cb.kontrak * 0.10), 10) AS total_without_ppn_pph
      FROM locations loc
      LEFT JOIN combined cb ON cb.location_id = loc.id
      WHERE COALESCE(cb.kontrak,0) <> 0 OR COALESCE(cb.jtu,0) <> 0
      ORDER BY loc.location_name;
    `;

    const { rows } = await pool.query(sql, [startDate, endDate]);

    const data = rows.map((r) => ({
      location_id: r.location_id,
      location_name: r.location_name,
      income_contracts: Number(r.income_contracts),
      JTU: Number(r.jtu),
      income_contract_without_ppn: Number(r.income_contract_without_ppn),
      total_ppn: Number(r.total_ppn),
      income_contract_with_ppn: Number(r.income_contract_with_ppn),
      total_pph: Number(r.total_pph),
      total_without_ppn_pph: Number(r.total_without_ppn_pph),
    }));

    // === Hitung total keseluruhan ===
    const totals = data.reduce(
      (acc, item) => {
        acc.total_JTU += item.JTU || 0;
        acc.total_contract += item.income_contracts || 0;
        acc.total_without_ppn += item.income_contract_without_ppn || 0;
        acc.total_ppn += item.total_ppn || 0;
        acc.total_with_ppn += item.income_contract_with_ppn || 0;
        acc.total_pph += item.total_pph || 0;
        acc.total_net += item.total_without_ppn_pph || 0;
        return acc;
      },
      {
        total_JTU: 0,
        total_contract: 0,
        total_without_ppn: 0,
        total_ppn: 0,
        total_with_ppn: 0,
        total_pph: 0,
        total_net: 0,
      }
    );

    return new Response(
      JSON.stringify({
        success: true,
        data,
        totals,
        period: {
          start_date: startMoment.format("DD-MM-YYYY"),
          end_date: endMoment.format("DD-MM-YYYY"),
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in income-by-location:", error);
    return new Response(
      JSON.stringify({ success: false, message: "Server error" }),
      { status: 500 }
    );
  }
}