import moment from "moment";
import { NextResponse } from "next/server";
import pool from "@/lib/dbConfig";
import { requireRole } from "@/app/utils/auth";

const REPORT_ACCESS_ROLES = [1, 3, 4, 5, 6, 7, 9];

const parseOptionalId = (value, label) => {
  if (!value || value === "all") return null;

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${label} tidak valid.`);
  }

  return parsed;
};

const toNumber = (value) => Number(value || 0);

const buildRecapRows = (detailRows, groupBy = "location") => {
  const grouped = new Map();

  detailRows.forEach((row) => {
    const key =
      groupBy === "sector"
        ? `${row.location_id || "unknown"}-${row.sector_id || "unknown"}`
        : `${row.location_id || "unknown"}`;
    const current =
      grouped.get(key) ||
      {
        key,
        location_id: row.location_id,
        location_name: row.location_name || "-",
        sector_id: groupBy === "sector" ? row.sector_id : null,
        sector_name: groupBy === "sector" ? row.sector_name || "-" : "",
        transaction_count: 0,
        traderKeys: new Set(),
        total_income: 0,
      };

    current.transaction_count += 1;
    current.traderKeys.add(row.tenant_identity_id || row.trader_nik || row.trader_name);
    current.total_income += toNumber(row.total_payment);
    grouped.set(key, current);
  });

  return Array.from(grouped.values())
    .map(({ traderKeys, ...item }) => ({
      ...item,
      trader_count: traderKeys.size,
      total_income: Math.round(item.total_income * 100) / 100,
    }))
    .sort((a, b) => {
      const locationCompare = String(a.location_name).localeCompare(String(b.location_name));
      if (locationCompare !== 0) return locationCompare;
      return String(a.sector_name || "").localeCompare(String(b.sector_name || ""));
    });
};

export async function GET(request) {
  try {
    const { response } = await requireRole(REPORT_ACCESS_ROLES);
    if (response) return response;

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");

    if (
      !moment(startDate, "YYYY-MM-DD", true).isValid() ||
      !moment(endDate, "YYYY-MM-DD", true).isValid()
    ) {
      return NextResponse.json(
        { message: "Rentang tanggal laporan tidak valid." },
        { status: 400 }
      );
    }

    if (moment(startDate).isAfter(moment(endDate))) {
      return NextResponse.json(
        { message: "Tanggal mulai tidak boleh lebih besar dari tanggal selesai." },
        { status: 400 }
      );
    }

    const locationId = parseOptionalId(searchParams.get("location_id"), "Lokasi");
    const sectorId = parseOptionalId(searchParams.get("sector_id"), "Sektor");

    if (sectorId) {
      const sectorCheck = await pool.query(
        `
          SELECT id, location_id
          FROM land_sectors
          WHERE id = $1
          LIMIT 1
        `,
        [sectorId]
      );

      if (sectorCheck.rowCount === 0) {
        return NextResponse.json(
          { message: "Sektor tidak ditemukan." },
          { status: 404 }
        );
      }

      if (locationId && Number(sectorCheck.rows[0].location_id) !== locationId) {
        return NextResponse.json(
          { message: "Sektor tidak sesuai dengan lokasi yang dipilih." },
          { status: 400 }
        );
      }
    }

    const result = await pool.query(
      `
        SELECT
          payment.id AS payment_id,
          payment.land_permit_application_id,
          payment.payment_number,
          payment.amount AS total_payment,
          payment.payment_date,
          payment.accounting_date,
          COALESCE(payment.accounting_date, payment.payment_date) AS report_date,
          payment.approval_status AS payment_approval_status,
          approval.approved_at AS payment_approved_at,
          application.id AS application_id,
          application.application_type,
          application.document_number AS application_document_number,
          application.commodity_type,
          application.administration_type,
          application.admin_fee,
          application.start_date,
          application.end_date,
          application.lease_duration_years,
          application.annual_land_rent,
          application.total_payment_land,
          application.payment_status,
          application.permit_status,
          identity.id AS tenant_identity_id,
          identity.full_name AS trader_name,
          identity.nik AS trader_nik,
          location.id AS location_id,
          location.location_name,
          sector.id AS sector_id,
          sector.sector_name,
          sector.sector_code,
          stall.id AS stall_id,
          stall.stall_number,
          stall.stall_length,
          stall.stall_width,
          stall.stall_area,
          stall.price_per_m2,
          stall.fixed_annual_fee,
          permit_document.document_number AS permit_document_number
        FROM land_permit_payments payment
        JOIN land_permit_payment_approval approval
          ON approval.land_permit_payment_id = payment.id
          AND approval.role_id = 8
          AND approval.status = 'approved'
        JOIN land_permit_applications application
          ON application.id = payment.land_permit_application_id
        JOIN tenant_identities identity
          ON identity.id = application.tenant_identity_id
        JOIN locations location
          ON location.id = application.location_id
        JOIN land_sectors sector
          ON sector.id = application.sector_id
        JOIN land_stalls stall
          ON stall.id = application.stall_id
        LEFT JOIN LATERAL (
          SELECT document_number
          FROM land_permit_documents document
          WHERE document.land_permit_application_id = application.id
            AND document.document_type = 'permit_document'
            AND document.status <> 'void'
          ORDER BY document.created_at DESC, document.id DESC
          LIMIT 1
        ) permit_document ON TRUE
        WHERE payment.approval_status = 'approved'
          AND application.approval_status = 'approved'
          AND COALESCE(payment.accounting_date, payment.payment_date)
            BETWEEN $1::date AND $2::date
          AND ($3::integer IS NULL OR application.location_id = $3::integer)
          AND ($4::integer IS NULL OR application.sector_id = $4::integer)
        ORDER BY report_date DESC, payment.id DESC
      `,
      [startDate, endDate, locationId, sectorId]
    );

    const detailRows = result.rows.map((row) => ({
      key: `land-permit-income-${row.payment_id}`,
      payment_id: row.payment_id,
      land_permit_application_id: row.land_permit_application_id,
      application_id: row.application_id,
      application_type: row.application_type,
      document_number:
        row.permit_document_number || row.application_document_number || "-",
      application_document_number: row.application_document_number,
      permit_document_number: row.permit_document_number,
      report_date: row.report_date,
      payment_date: row.payment_date,
      payment_approved_at: row.payment_approved_at,
      payment_number: row.payment_number,
      tenant_identity_id: row.tenant_identity_id,
      trader_name: row.trader_name || "-",
      trader_nik: row.trader_nik || "-",
      location_id: row.location_id,
      location_name: row.location_name || "-",
      sector_id: row.sector_id,
      sector_name: row.sector_name || "-",
      sector_code: row.sector_code,
      stall_id: row.stall_id,
      stall_number: row.stall_number || "-",
      commodity_type: row.commodity_type || "-",
      administration_type: row.administration_type || "kip",
      admin_fee: toNumber(row.admin_fee),
      stall_length: toNumber(row.stall_length),
      stall_width: toNumber(row.stall_width),
      stall_area: toNumber(row.stall_area),
      price_per_m2: toNumber(row.price_per_m2),
      fixed_annual_fee: toNumber(row.fixed_annual_fee),
      annual_land_rent: toNumber(row.annual_land_rent),
      total_payment_land: toNumber(row.total_payment_land),
      total_payment: toNumber(row.total_payment),
      start_date: row.start_date,
      end_date: row.end_date,
      lease_duration_years: toNumber(row.lease_duration_years),
      payment_status: row.payment_status,
      payment_status_label: "Tervalidasi",
      permit_status: row.permit_status,
    }));

    const recapByLocationRows = buildRecapRows(detailRows, "location");
    const recapBySectorRows = buildRecapRows(detailRows, "sector");
    const uniqueTraders = new Set(detailRows.map((row) => row.tenant_identity_id));

    return NextResponse.json({
      data: {
        recap: recapByLocationRows,
        recap_by_location: recapByLocationRows,
        recap_by_sector: recapBySectorRows,
        detail: detailRows,
        summary: {
          total_transactions: detailRows.length,
          total_traders: uniqueTraders.size,
          total_income: detailRows.reduce(
            (sum, row) => sum + toNumber(row.total_payment),
            0
          ),
          total_locations: new Set(detailRows.map((row) => row.location_id)).size,
          total_sectors: new Set(detailRows.map((row) => row.sector_id)).size,
        },
        filters: {
          start_date: startDate,
          end_date: endDate,
          location_id: locationId,
          sector_id: sectorId,
        },
      },
    });
  } catch (error) {
    if (error.message?.includes("tidak valid")) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    console.error("GET /api/report/land-permit-income error:", error);
    return NextResponse.json(
      { message: "Gagal memuat laporan pendapatan izin lahan." },
      { status: 500 }
    );
  }
}
