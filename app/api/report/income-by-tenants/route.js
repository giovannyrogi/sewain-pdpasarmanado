import pool from "@/lib/dbConfig";
import moment from "moment";
import { requireAuthenticatedUser } from "@/app/utils/auth";
import { formatNumber } from "@/app/utils/formatNumber";
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

    if (!startDate) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Start date are required",
        }),
        { status: 400 },
      );
    }

    if (!endDate) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "End date are required",
        }),
        { status: 400 },
      );
    }

    if (!isValidDate(startDate) || !isValidDate(endDate)) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Format tanggal harus YYYY-MM-DD.",
        }),
        { status: 400 },
      );
    }

    const startDateFormatted = moment(startDate).format("YYYY-MM-DD");
    const endDateFormatted = moment(endDate).format("YYYY-MM-DD");

    // validasi range tanggal
    if (moment(startDate).isAfter(endDate)) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Start date must be before end date",
        }),
        { status: 400 },
      );
    }

    const sql = `
    WITH approved_payments AS (
      SELECT
        p.id AS payment_id,
        p.payment_date,
        p.payment_number,
        p.amount,
        p.contract_amount,
        p.ppn_amount,
        p.remaining_balance,
        ta.id AS tenant_application_id,
        ta.payment_type,
        ta.admin_fee,
        ta.total_payment_room,
        ta.total_ppn AS ta_total_ppn,
        ta.start_date,
        ta.end_date,
        ta.tenant_identity_id,
        ta.room_id,
        ti.full_name AS tenant_name,
        r.room_number,
        r.room_length,
        r.room_width
      FROM payments p
      JOIN tenant_application ta ON ta.id = p.tenant_application_id
      JOIN tenant_identities ti ON ti.id = ta.tenant_identity_id
      JOIN rooms r ON r.id = ta.room_id
      WHERE p.payment_date BETWEEN $1 AND $2
        AND p.approval_status = 'approved'
        AND EXISTS (
          SELECT 1
          FROM payment_approval pa
          WHERE pa.payment_id = p.id
            AND pa.role_id = 8
            AND pa.status = 'approved'
        )
    ),
    per_tenant_final AS (
      SELECT
        ap.payment_id,
        ap.amount,
        ap.payment_date,
        ap.tenant_application_id,
        ap.tenant_name,
        ap.room_number,
        ap.start_date,
        ap.end_date,
        ap.room_length,
        ap.room_width,
        ap.total_payment_room,
        ap.contract_amount,
        ap.ppn_amount,
        ap.remaining_balance,
        ap.payment_number,
        ap.payment_type,
        ap.admin_fee,
        ap.ta_total_ppn,

        -- KONTRAK MURNI (sesuai kondisi baru)
        ROUND(
          CASE
            WHEN ap.payment_type = 'lunas'
              THEN COALESCE(ap.total_payment_room, 0)
            WHEN ap.payment_type = 'cicilan'
              THEN CASE 
                     WHEN ap.remaining_balance = 0 
                       THEN COALESCE(ap.contract_amount, 0) - COALESCE(ap.admin_fee, 0)
                     ELSE COALESCE(ap.contract_amount, 0)
                   END
            ELSE 0
          END, 2
        ) AS kontrak_murni,

        -- PPN TOTAL
        ROUND(COALESCE(ap.ppn_amount, 0), 2) AS ppn_total,

        -- JTU (admin_fee hanya saat cicilan terakhir / lunas)
        ROUND(
          CASE
            WHEN ap.payment_type = 'lunas' THEN COALESCE(ap.admin_fee, 0)
            WHEN ap.payment_type = 'cicilan' AND ap.remaining_balance = 0 THEN COALESCE(ap.admin_fee, 0)
            ELSE 0
          END, 2
        ) AS jtu_amount
      FROM approved_payments ap
    )
    SELECT
      pf.payment_id,
      pf.amount AS payment_amount_raw,
      pf.payment_date,
      pf.tenant_application_id,
      pf.tenant_name,
      pf.room_number,
      pf.start_date,
      pf.end_date,
      pf.room_length,
      pf.room_width,
      pf.total_payment_room AS harga_m2,
      pf.kontrak_murni,
      pf.ppn_total,
      pf.jtu_amount,

      -- JTU hanya tampil saat lunas (display)
      CASE WHEN pf.remaining_balance = 0 THEN ROUND(pf.jtu_amount, 2) ELSE 0 END AS jtu_display,

      -- Kontrak Tanpa PPN = kontrak + jtu (jika lunas)
      ROUND((pf.kontrak_murni + CASE WHEN pf.remaining_balance = 0 THEN pf.jtu_amount ELSE 0 END), 2) AS contract_without_ppn,

      -- Total PPN 11%
      ROUND(pf.ppn_total, 2) AS total_ppn,

      -- Total + PPN 11%
      ROUND((pf.kontrak_murni + CASE WHEN pf.remaining_balance = 0 THEN pf.jtu_amount ELSE 0 END + pf.ppn_total), 2) AS contract_with_ppn,

      -- Potongan PPH 10%
      ROUND((pf.kontrak_murni * 0.10), 2) AS total_pph,

      -- Total tanpa PPN & PPH
      ROUND(((pf.kontrak_murni + CASE WHEN pf.remaining_balance = 0 THEN pf.jtu_amount ELSE 0 END) - (pf.kontrak_murni * 0.10)), 2) AS total_after_pph_and_no_ppn,

      COALESCE(pf.contract_amount,0) AS payment_contract_amount,
      COALESCE(pf.ppn_amount,0) AS payment_ppn_amount,
      pf.payment_number,
      pf.remaining_balance,
      pf.payment_type,

      CASE
        WHEN pf.payment_type = 'lunas' THEN 'LUNAS'
        WHEN pf.payment_type = 'cicilan' THEN
          CASE
            WHEN pf.payment_number = 1 AND pf.remaining_balance = 0 THEN 'Uang Muka (LUNAS)'
            WHEN pf.payment_number = 1 THEN 'Uang Muka'
            WHEN pf.payment_number = 2 AND pf.remaining_balance = 0 THEN 'Cicilan 1 (LUNAS)'
            WHEN pf.payment_number = 2 THEN 'Cicilan 1'
            WHEN pf.payment_number = 3 AND pf.remaining_balance = 0 THEN 'Cicilan 2 (LUNAS)'
            WHEN pf.payment_number = 3 THEN 'Cicilan 2'
            WHEN pf.payment_number = 4 AND pf.remaining_balance = 0 THEN 'Cicilan 3 (LUNAS)'
            WHEN pf.payment_number = 4 THEN 'Cicilan 3'
            ELSE
              CASE WHEN pf.remaining_balance = 0 THEN 'Pelunasan (LUNAS)'
                   ELSE 'Pelunasan'
              END
          END
        ELSE '-'
      END AS keterangan
    FROM per_tenant_final pf
    ORDER BY pf.tenant_name, pf.payment_date;
    `;

    const { rows } = await pool.query(sql, [
      startDateFormatted,
      endDateFormatted,
    ]);

    const data = rows.map((r) => {
      const breakdown = buildReconciledPaymentBreakdown({
        paymentType: r.payment_type,
        paymentAmount: r.payment_amount_raw,
        contractAmount: r.kontrak_murni,
        ppnAmount: r.total_ppn,
        jtuAmount: r.jtu_display,
      });

      return {
      payment_id: r.payment_id,
      payment_date: r.payment_date
        ? moment(r.payment_date).format("DD-MM-YYYY")
        : null,
      tenant_application_id: r.tenant_application_id,
      tenant_name: r.tenant_name,
      room_number: r.room_number,
      masa_berlaku: `${moment(r.start_date).format("DD-MM-YYYY")} s/d ${moment(
        r.end_date,
      ).format("DD-MM-YYYY")}`,
      ukuran_m2: `${formatNumber(r.room_length)} x ${formatNumber(
        r.room_width,
      )} m²`,
      harga_m2: Number(r.harga_m2 || 0),
      kontrak: breakdown.contractAmount,
      jtu: breakdown.jtuAmount,
      total_kontrak_tanpa_ppn:
        breakdown.contractAmount + breakdown.jtuAmount,
      total_ppn: breakdown.ppnAmount,
      other_amount: breakdown.otherAmount,
      total_plus_ppn: breakdown.totalPlusPpn,
      total_pph: breakdown.totalPph,
      total_after_pph_and_no_ppn: breakdown.totalNet,
      payment_contract_amount: Number(r.payment_contract_amount || 0),
      payment_ppn_amount: Number(r.payment_ppn_amount || 0),
      payment_number: r.payment_number,
      remaining_balance: Number(r.remaining_balance || 0),
      payment_type: r.payment_type,
      keterangan: r.keterangan,
      };
    });

    const totals = data.reduce(
      (acc, item) => {
        acc.total_JTU += item.jtu || 0;
        acc.total_contract += item.kontrak || 0;
        acc.total_without_ppn += item.total_kontrak_tanpa_ppn || 0;
        acc.total_ppn += item.total_ppn || 0;
        acc.total_other += item.other_amount || 0;
        acc.total_with_ppn += item.total_plus_ppn || 0;
        acc.total_pph += item.total_pph || 0;
        acc.total_net += item.total_after_pph_and_no_ppn || 0;
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
      },
    );

    Object.keys(totals).forEach((k) => {
      totals[k] = parseFloat(totals[k].toFixed(2));
    });

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
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Error in income-by-tenant:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: "Server error",
      }),
      { status: 500 },
    );
  }
}
