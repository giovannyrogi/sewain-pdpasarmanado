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

    if (!startMoment.isValid() || !endMoment.isValid()) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Invalid date format. Use DD-MM-YYYY or YYYY-MM-DD",
        }),
        { status: 400 }
      );
    }

    const startDate = startMoment.format("YYYY-MM-DD");
    const endDate = endMoment.format("YYYY-MM-DD");

    const sql = `
      WITH payments_filtered AS (
        SELECT
          p.id,
          p.tenant_application_id,
          p.contract_amount::numeric AS contract_amount,
          p.ppn_amount::numeric AS ppn_amount,
          p.payment_date
        FROM payments p
        WHERE p.payment_date BETWEEN $1 AND $2
          AND EXISTS (
            SELECT 1 FROM payment_approval pa
            WHERE pa.payment_id = p.id AND pa.status = 'approved'
          )
      ),
      income_per_location AS (
        SELECT
          ta.location_id,
          SUM(pf.contract_amount)::numeric AS income_contracts,
          SUM(pf.ppn_amount)::numeric AS total_ppn
        FROM payments_filtered pf
        JOIN tenant_application ta ON ta.id = pf.tenant_application_id
        GROUP BY ta.location_id
      ),
      jtu_per_location AS (
        SELECT ta.location_id, SUM(ta.admin_fee::numeric) AS jtu
        FROM tenant_application ta
        WHERE ta.id IN (SELECT DISTINCT tenant_application_id FROM payments_filtered)
        GROUP BY ta.location_id
      )
      SELECT
        l.id AS location_id,
        l.location_name,
        ROUND(COALESCE(ip.income_contracts, 0) - COALESCE(j.jtu, 0), 2) AS income_contracts,
        ROUND(COALESCE(j.jtu, 0), 2) AS jtu,
        ROUND(COALESCE(ip.income_contracts, 0), 2) AS income_contract_without_ppn,
        ROUND(COALESCE(ip.total_ppn, 0), 2) AS total_ppn,
        ROUND(COALESCE(ip.income_contracts, 0) + COALESCE(ip.total_ppn, 0), 2) AS income_contract_with_ppn,
        ROUND((COALESCE(ip.income_contracts, 0) * 0.10), 2) AS total_pph,
        (
          ROUND(COALESCE(ip.income_contracts, 0) + COALESCE(ip.total_ppn, 0), 2)
          - ROUND(COALESCE(ip.total_ppn, 0), 2)
          - ROUND((COALESCE(ip.income_contracts, 0) * 0.10), 2)
        )::numeric(15,2) AS total_without_ppn_pph
      FROM locations l
      LEFT JOIN income_per_location ip ON ip.location_id = l.id
      LEFT JOIN jtu_per_location j ON j.location_id = l.id
      WHERE COALESCE(ip.income_contracts,0) <> 0 OR COALESCE(j.jtu,0) <> 0
      ORDER BY l.location_name;
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

    // Bulatkan hasil akhir agar rapi
    Object.keys(totals).forEach((key) => {
      totals[key] = parseFloat(totals[key].toFixed(2));
    });

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
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in income-by-location:", error);
    return new Response(
      JSON.stringify({ success: false, message: "Server error" }),
      { status: 500 }
    );
  }
}
