"use client";

import React from "react";
import { Stack } from "@mui/material";
import formatRupiah from "@/app/components/formatrupiah/page";
import {
  LandPermitIncomeCellText,
  buildLandPermitIncomeDimensionLabel,
  buildLandPermitIncomePeriodLabel,
  formatLandPermitIncomeDate,
  keepLandPermitIncomeTotalAtBottom,
  normalizeLandPermitIncomeSearch,
} from "@/app/components/reports/LandPermitIncomeReportShared";

export const LAND_PERMIT_INCOME_DETAIL_SCROLL_WIDTH = 1860;

const calculateTotalLandPrice = (row = {}) =>
  row.administration_type === "kkip"
    ? Number(row.fixed_annual_fee || 0)
    : Number(row.stall_length || 0) * Number(row.stall_width || 0) * Number(row.price_per_m2 || 0);

export const buildLandPermitIncomeDetailTotalRow = (rows = []) => ({
  key: "land-permit-income-detail-total",
  __isTotal: true,
  summary_label: "TOTAL",
  total_land_price: rows.reduce(
    (sum, row) => sum + calculateTotalLandPrice(row),
    0,
  ),
  total_payment: rows.reduce(
    (sum, row) => sum + Number(row.total_payment || 0),
    0,
  ),
});

export const filterLandPermitIncomeDetailRows = (rows = [], searchText = "") => {
  const keyword = normalizeLandPermitIncomeSearch(searchText);
  if (!keyword) return rows;

  return rows.filter((row) =>
    [
      row.location_name,
      row.sector_name,
      row.stall_number,
      row.trader_name,
      row.trader_nik,
      row.document_number,
      row.commodity_type,
    ]
      .map(normalizeLandPermitIncomeSearch)
      .some((value) => value.includes(keyword)),
  );
};

export const createLandPermitIncomeDetailColumns = ({ isMobile } = {}) => [
  {
    title: "No",
    dataIndex: "index",
    width: 72,
    align: "center",
  },
  {
    title: "Tanggal Pembayaran",
    dataIndex: "payment_date",
    width: 160,
    render: (value, record) => (
      <LandPermitIncomeCellText strong={record.__isTotal}>
        {record.__isTotal ? "" : formatLandPermitIncomeDate(value)}
      </LandPermitIncomeCellText>
    ),
  },
  {
    title: "Nomor Dokumen",
    dataIndex: "document_number",
    width: 190,
    sorter: (a, b) =>
      keepLandPermitIncomeTotalAtBottom(a, b, () =>
        String(a.document_number || "").localeCompare(
          String(b.document_number || ""),
        ),
      ),
    render: (value, record) => (
      <LandPermitIncomeCellText strong={record.__isTotal}>
        {record.__isTotal ? "" : value || "-"}
      </LandPermitIncomeCellText>
    ),
  },
  {
    title: "Nama Pedagang",
    dataIndex: "trader_name",
    width: 210,
    render: (value, record) =>
      record.__isTotal ? (
        ""
      ) : (
        <Stack spacing={0.35}>
          <LandPermitIncomeCellText strong>{value || "-"}</LandPermitIncomeCellText>
          <LandPermitIncomeCellText muted>
            NIK {record.trader_nik || "-"}
          </LandPermitIncomeCellText>
        </Stack>
      ),
  },
  {
    title: "Lokasi",
    dataIndex: "location_name",
    width: 170,
    responsive: isMobile ? ["lg"] : undefined,
    render: (value, record) => (
      <LandPermitIncomeCellText>
        {record.__isTotal ? "" : value || "-"}
      </LandPermitIncomeCellText>
    ),
  },
  {
    title: "Sektor",
    dataIndex: "sector_name",
    width: 150,
    responsive: isMobile ? ["lg"] : undefined,
    render: (value, record) => (
      <LandPermitIncomeCellText>
        {record.__isTotal ? "" : value || "-"}
      </LandPermitIncomeCellText>
    ),
  },
  {
    title: "Jenis Dagangan",
    dataIndex: "commodity_type",
    width: 160,
    render: (value, record) => (
      <LandPermitIncomeCellText>
        {record.__isTotal ? "" : value || "-"}
      </LandPermitIncomeCellText>
    ),
  },
  {
    title: "Lahan / Area KKIP",
    dataIndex: "stall_number",
    width: 120,
    render: (value, record) => (
      <LandPermitIncomeCellText>
        {record.__isTotal ? "" : `${record.administration_type === "kkip" ? "Area " : "Lahan "}${value || "-"}`}
      </LandPermitIncomeCellText>
    ),
  },
  {
    title: "Ukuran Lahan",
    dataIndex: "stall_area",
    width: 170,
    render: (_, record) => (
      <LandPermitIncomeCellText>
        {record.__isTotal ? "" : record.administration_type === "kkip" ? "Tanpa ukuran lapak" : buildLandPermitIncomeDimensionLabel(record)}
      </LandPermitIncomeCellText>
    ),
  },
  {
    title: "Masa Berlaku",
    dataIndex: "start_date",
    width: 190,
    render: (_, record) => (
      <LandPermitIncomeCellText>
        {record.__isTotal ? "" : buildLandPermitIncomePeriodLabel(record)}
      </LandPermitIncomeCellText>
    ),
  },
  {
    title: "Durasi",
    dataIndex: "lease_duration_years",
    width: 110,
    align: "right",
    render: (value, record) => (
      <LandPermitIncomeCellText>
        {record.__isTotal ? "" : `${value || 1} Tahun`}
      </LandPermitIncomeCellText>
    ),
  },
  {
    title: "Tarif Dasar",
    dataIndex: "price_per_m2",
    width: 150,
    // align: "right",
    render: (value, record) => (
      <LandPermitIncomeCellText>
        {record.__isTotal ? "" : formatRupiah(Number(record.administration_type === "kkip" ? record.fixed_annual_fee : value || 0))}
      </LandPermitIncomeCellText>
    ),
  },
  {
    title: "Biaya / Tahun",
    dataIndex: "total_land_price",
    width: 180,
    render: (_, record) => (
      <LandPermitIncomeCellText strong={record.__isTotal}>
        {formatRupiah(
          Number(record.total_land_price || calculateTotalLandPrice(record)),
        )}
      </LandPermitIncomeCellText>
    ),
  },
  {
    title: "Total Pembayaran",
    dataIndex: "total_payment",
    width: 170,
    // align: "left",
    sorter: (a, b) =>
      keepLandPermitIncomeTotalAtBottom(
        a,
        b,
        () => Number(a.total_payment || 0) - Number(b.total_payment || 0),
      ),
    render: (value, record) => (
      <LandPermitIncomeCellText strong={record.__isTotal}>
        {formatRupiah(Number(value || 0))}
      </LandPermitIncomeCellText>
    ),
  },
];

export const LAND_PERMIT_INCOME_DETAIL_EXPORT_COLUMNS = [
  { key: "no", header: "No", width: 8, pdfWidth: 8, pdfHalign: "center" },
  { key: "payment_date", header: "Tanggal Bayar", width: 18, pdfWidth: 18 },
  { key: "document_number", header: "Nomor Dokumen", width: 24, pdfWidth: 27 },
  { key: "trader_identity", header: "Nama Pedagang", width: 32, pdfWidth: 27 },
  { key: "location_name", header: "Lokasi", width: 22, pdfWidth: 17 },
  { key: "sector_name", header: "Sektor", width: 18, pdfWidth: 15 },
  { key: "commodity_type", header: "Jenis Dagangan", width: 18, pdfWidth: 16 },
  { key: "stall_number", header: "Lahan / Area", width: 14, pdfWidth: 11 },
  { key: "dimension_label", header: "Ukuran", width: 22, pdfWidth: 16 },
  { key: "permit_period", header: "Masa Berlaku", width: 26, pdfWidth: 21 },
  { key: "duration_label", header: "Durasi", width: 14, pdfWidth: 11 },
  {
    key: "price_per_m2",
    header: "Tarif Dasar",
    type: "currency",
    width: 18,
    pdfWidth: 18,
  },
  {
    key: "total_land_price",
    header: "Biaya / Tahun",
    type: "currency",
    width: 22,
    pdfWidth: 23,
  },
  {
    key: "total_payment",
    header: "Total",
    type: "currency",
    width: 22,
    pdfWidth: 22,
  },
].map((column) => ({
  pdfFontSize: 6.2,
  pdfCellPadding: 1.15,
  ...column,
}));

export const buildLandPermitIncomeDetailExportRows = (rows = []) =>
  rows.map((row, index) => ({
    no: index + 1,
    payment_date: formatLandPermitIncomeDate(row.payment_date),
    document_number: row.document_number || "-",
    trader_identity: `${row.trader_name || "-"}\nNIK ${row.trader_nik || "-"}`,
    location_name: row.location_name || "-",
    sector_name: row.sector_name || "-",
    stall_number: `${row.administration_type === "kkip" ? "Area " : "Lahan "}${row.stall_number || "-"}`,
    commodity_type: row.commodity_type || "-",
    dimension_label: row.administration_type === "kkip" ? "Tanpa ukuran lapak" : buildLandPermitIncomeDimensionLabel(row),
    permit_period: buildLandPermitIncomePeriodLabel(row),
    duration_label: `${row.lease_duration_years || 1} Tahun`,
    price_per_m2: Number(row.administration_type === "kkip" ? row.fixed_annual_fee : row.price_per_m2 || 0),
    total_land_price: calculateTotalLandPrice(row),
    total_payment: Number(row.total_payment || 0),
  }));
