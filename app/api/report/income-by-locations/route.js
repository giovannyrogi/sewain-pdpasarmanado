// app/api/reports/income-by-location/route.js
import pool from "@/lib/dbConfig";
import moment from "moment";
import { requireAuthenticatedUser } from "@/app/utils/auth";
import { buildReconciledPaymentBreakdown } from "@/app/utils/paymentRoundingReconciliation";

function isValidDate(value) {
  return moment(value, "YYYY-MM-DD", true).isValid();
}

export async function GET(request) {
  try {
    const { response } = await requireAuthenticatedUser();
    if (response) return response;

    const url = new URL(request.url);
    const startDate = url.searchParams.get("start_date");
    const endDate = url.searchParams.get("end_date");

    if (!startDate || !endDate) {
      return new Response(
        JSON.stringify({ success: false, message: "Parameter start_date dan end_date wajib dikirim." }),
        { status: 400 }
      );
    }

    if (!isValidDate(startDate) || !isValidDate(endDate)) {
      return new Response(
        JSON.stringify({ success: false, message: "Format tanggal harus YYYY-MM-DD." }),
        { status: 400 }
      );
    }

    if (moment(startDate).isAfter(endDate)) {
      return new Response(
        JSON.stringify({ success: false, message: "Start date must be before end date" }),
        { status: 400 }
      );
    }

    const sql = `
      SELECT
        p.id AS payment_id,
        p.amount AS payment_amount,
        p.contract_amount,
        p.ppn_amount,
        p.remaining_balance,
        ta.id AS tenant_application_id,
        ta.payment_type,
        ta.admin_fee,
        ta.total_payment_room,
        ta.total_ppn,
        loc.id AS location_id,
        loc.location_name
      FROM payments p
      JOIN tenant_application ta ON ta.id = p.tenant_application_id
      JOIN locations loc ON loc.id = ta.location_id
      WHERE p.payment_date BETWEEN $1 AND $2
        AND p.approval_status = 'approved'
        AND EXISTS (
          SELECT 1
          FROM payment_approval pa
          WHERE pa.payment_id = p.id
            AND pa.role_id = 8
            AND pa.status = 'approved'
        )
      ORDER BY loc.location_name;
    `;

    const { rows } = await pool.query(sql, [startDate, endDate]);

    const grouped = new Map();

    rows.forEach((row) => {
      const paymentType = row.payment_type;
      const isInstallment = paymentType === "cicilan";
      const isFinalInstallment =
        isInstallment && Number(row.remaining_balance || 0) === 0;
      const contractAmount =
        paymentType === "lunas"
          ? Number(row.total_payment_room || 0)
          : Number(row.contract_amount || 0) -
            (isFinalInstallment ? Number(row.admin_fee || 0) : 0);
      const jtuAmount =
        paymentType === "lunas" || isFinalInstallment
          ? Number(row.admin_fee || 0)
          : 0;
      const ppnAmount =
        paymentType === "lunas"
          ? Number(row.total_ppn || row.ppn_amount || 0)
          : Number(row.ppn_amount || 0);
      const breakdown = buildReconciledPaymentBreakdown({
        paymentType,
        paymentAmount: row.payment_amount,
        contractAmount,
        ppnAmount,
        jtuAmount,
      });
      const current =
        grouped.get(row.location_id) || {
          location_id: row.location_id,
          location_name: row.location_name,
          income_contracts: 0,
          JTU: 0,
          income_contract_without_ppn: 0,
          total_ppn: 0,
          other_amount: 0,
          income_contract_with_ppn: 0,
          total_pph: 0,
          total_without_ppn_pph: 0,
        };

      current.income_contracts += breakdown.contractAmount;
      current.JTU += breakdown.jtuAmount;
      current.income_contract_without_ppn +=
        breakdown.contractAmount + breakdown.jtuAmount;
      current.total_ppn += breakdown.ppnAmount;
      current.other_amount += breakdown.otherAmount;
      current.income_contract_with_ppn += breakdown.totalPlusPpn;
      current.total_pph += breakdown.totalPph;
      current.total_without_ppn_pph += breakdown.totalNet;
      grouped.set(row.location_id, current);
    });

    const data = Array.from(grouped.values()).sort((a, b) =>
      String(a.location_name).localeCompare(String(b.location_name)),
    );

    // === Hitung total keseluruhan ===
    const totals = data.reduce(
      (acc, item) => {
        acc.total_JTU += item.JTU || 0;
        acc.total_contract += item.income_contracts || 0;
        acc.total_without_ppn += item.income_contract_without_ppn || 0;
        acc.total_ppn += item.total_ppn || 0;
        acc.total_other += item.other_amount || 0;
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
        total_other: 0,
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
          start_date: startDate,
          end_date: endDate,
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
