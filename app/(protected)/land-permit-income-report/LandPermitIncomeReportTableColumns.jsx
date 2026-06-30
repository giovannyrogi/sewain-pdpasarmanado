"use client";

import React from "react";
import { Chip, Stack, Typography } from "@mui/material";
import moment from "moment";
import formatRupiah from "@/app/components/formatrupiah/page";

export const LAND_PERMIT_INCOME_PAGE_SIZE_OPTIONS = [10, 25, 50, 100];
export const LAND_PERMIT_INCOME_RECAP_SCROLL_WIDTH = 760;
export const LAND_PERMIT_INCOME_DETAIL_SCROLL_WIDTH = 1680;

const formatDate = (value) =>
  value ? moment(value).format("DD MMM YYYY") : "-";

const formatNumber = (value, maximumFractionDigits = 2) =>
  Number(value || 0).toLocaleString("id-ID", {
    minimumFractionDigits: 0,
    maximumFractionDigits,
  });

const normalizeSearch = (value) => String(value || "").toLowerCase();

const keepTotalAtBottom = (a, b, compareFn) => {
  if (a.__isTotal) return 1;
  if (b.__isTotal) return -1;
  return compareFn(a, b);
};

export const buildDimensionLabel = (row) => {
  const length = formatNumber(row?.stall_length);
  const width = formatNumber(row?.stall_width);
  const area = formatNumber(row?.stall_area);
  return `${length} x ${width} m (${area} m²)`;
};

const buildPermitPeriodLabel = (row) =>
  `${formatDate(row?.start_date)} s/d ${formatDate(row?.end_date)}`;

export const buildLandPermitIncomeRecapTotalRow = (rows = []) => ({
  key: "land-permit-income-recap-total",
  __isTotal: true,
  location_name: "TOTAL",
  sector_name: "",
  transaction_count: rows.reduce(
    (sum, row) => sum + Number(row.transaction_count || 0),
    0,
  ),
  trader_count: rows.reduce(
    (sum, row) => sum + Number(row.trader_count || 0),
    0,
  ),
  total_income: rows.reduce(
    (sum, row) => sum + Number(row.total_income || 0),
    0,
  ),
});

export const buildLandPermitIncomeDetailTotalRow = (rows = []) => ({
  key: "land-permit-income-detail-total",
  __isTotal: true,
  document_number: "TOTAL",
  total_payment: rows.reduce(
    (sum, row) => sum + Number(row.total_payment || 0),
    0,
  ),
});

export const filterLandPermitIncomeRows = (rows = [], searchText = "") => {
  const keyword = normalizeSearch(searchText);
  if (!keyword) return rows;

  return rows.filter((row) =>
    [
      row.location_name,
      row.sector_name,
      row.stall_number,
      row.trader_name,
      row.trader_nik_masked,
      row.document_number,
      row.commodity_type,
      row.payment_status_label,
    ]
      .map(normalizeSearch)
      .some((value) => value.includes(keyword)),
  );
};

const CellText = ({ children, muted = false, strong = false }) => (
  <Typography
    sx={{
      fontFamily: "Poppins",
      fontSize: 12,
      fontWeight: strong ? 700 : 600,
      color: muted ? "text.secondary" : "text.primary",
      whiteSpace: "normal",
      wordBreak: "break-word",
    }}
  >
    {children}
  </Typography>
);

export const createLandPermitIncomeRecapColumns = ({ isMobile } = {}) => [
  {
    title: "No",
    dataIndex: "index",
    width: 72,
    align: "center",
    render: (_, record, index) => (record.__isTotal ? "" : index + 1),
  },
  {
    title: "Lokasi",
    dataIndex: "location_name",
    sorter: (a, b) =>
      keepTotalAtBottom(a, b, () =>
        String(a.location_name || "").localeCompare(
          String(b.location_name || ""),
        ),
      ),
    render: (value, record) => (
      <CellText strong={record.__isTotal}>{value || "-"}</CellText>
    ),
  },
  {
    title: "Sektor",
    dataIndex: "sector_name",
    responsive: isMobile ? ["lg"] : undefined,
    sorter: (a, b) =>
      keepTotalAtBottom(a, b, () =>
        String(a.sector_name || "").localeCompare(String(b.sector_name || "")),
      ),
    render: (value, record) => (
      <CellText strong={record.__isTotal}>
        {record.__isTotal ? "" : value || "-"}
      </CellText>
    ),
  },
  {
    title: "Jumlah Transaksi",
    dataIndex: "transaction_count",
    align: "right",
    sorter: (a, b) =>
      keepTotalAtBottom(
        a,
        b,
        () =>
          Number(a.transaction_count || 0) - Number(b.transaction_count || 0),
      ),
    render: (value, record) => (
      <CellText strong={record.__isTotal}>{value || 0}</CellText>
    ),
  },
  {
    title: "Jumlah Pedagang",
    dataIndex: "trader_count",
    align: "right",
    sorter: (a, b) =>
      keepTotalAtBottom(
        a,
        b,
        () => Number(a.trader_count || 0) - Number(b.trader_count || 0),
      ),
    render: (value, record) => (
      <CellText strong={record.__isTotal}>{value || 0}</CellText>
    ),
  },
  {
    title: "Total Pendapatan",
    dataIndex: "total_income",
    align: "right",
    sorter: (a, b) =>
      keepTotalAtBottom(
        a,
        b,
        () => Number(a.total_income || 0) - Number(b.total_income || 0),
      ),
    render: (value, record) => (
      <CellText strong={record.__isTotal}>
        {formatRupiah(Number(value || 0))}
      </CellText>
    ),
  },
];

export const createLandPermitIncomeDetailColumns = ({ isMobile } = {}) => [
  {
    title: "No",
    dataIndex: "index",
    width: 72,
    align: "center",
    render: (_, record, index) => (record.__isTotal ? "" : index + 1),
  },
  {
    title: "Tanggal Pembayaran",
    dataIndex: "payment_date",
    width: 160,
    render: (value, record) => (
      <CellText strong={record.__isTotal}>
        {record.__isTotal ? "" : formatDate(value)}
      </CellText>
    ),
  },
  {
    title: "Nomor Dokumen",
    dataIndex: "document_number",
    width: 190,
    sorter: (a, b) =>
      keepTotalAtBottom(a, b, () =>
        String(a.document_number || "").localeCompare(
          String(b.document_number || ""),
        ),
      ),
    render: (value, record) => (
      <CellText strong={record.__isTotal}>{value || "-"}</CellText>
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
          <CellText strong>{value || "-"}</CellText>
          <CellText muted>NIK {record.trader_nik_masked || "-"}</CellText>
        </Stack>
      ),
  },
  {
    title: "Lokasi",
    dataIndex: "location_name",
    width: 170,
    responsive: isMobile ? ["lg"] : undefined,
    render: (value, record) => (
      <CellText>{record.__isTotal ? "" : value || "-"}</CellText>
    ),
  },
  {
    title: "Sektor",
    dataIndex: "sector_name",
    width: 150,
    responsive: isMobile ? ["lg"] : undefined,
    render: (value, record) => (
      <CellText>{record.__isTotal ? "" : value || "-"}</CellText>
    ),
  },
  {
    title: "Lapak",
    dataIndex: "stall_number",
    width: 120,
    render: (value, record) => (
      <CellText>{record.__isTotal ? "" : value || "-"}</CellText>
    ),
  },
  {
    title: "Jenis Dagangan",
    dataIndex: "commodity_type",
    width: 160,
    render: (value, record) => (
      <CellText>{record.__isTotal ? "" : value || "-"}</CellText>
    ),
  },
  {
    title: "Ukuran Lahan",
    dataIndex: "stall_area",
    width: 170,
    render: (_, record) => (
      <CellText>{record.__isTotal ? "" : buildDimensionLabel(record)}</CellText>
    ),
  },
  {
    title: "Masa Berlaku",
    dataIndex: "start_date",
    width: 190,
    render: (_, record) => (
      <CellText>
        {record.__isTotal ? "" : buildPermitPeriodLabel(record)}
      </CellText>
    ),
  },
  {
    title: "Durasi",
    dataIndex: "lease_duration_years",
    width: 110,
    align: "right",
    render: (value, record) => (
      <CellText>{record.__isTotal ? "" : `${value || 1} Tahun`}</CellText>
    ),
  },
  {
    title: "Harga per m²",
    dataIndex: "price_per_m2",
    width: 150,
    align: "right",
    render: (value, record) => (
      <CellText>
        {record.__isTotal ? "" : formatRupiah(Number(value || 0))}
      </CellText>
    ),
  },
  {
    title: "Sewa per Tahun",
    dataIndex: "annual_land_rent",
    width: 160,
    align: "right",
    render: (value, record) => (
      <CellText>
        {record.__isTotal ? "" : formatRupiah(Number(value || 0))}
      </CellText>
    ),
  },
  {
    title: "Total Pembayaran",
    dataIndex: "total_payment",
    width: 170,
    align: "right",
    sorter: (a, b) =>
      keepTotalAtBottom(
        a,
        b,
        () => Number(a.total_payment || 0) - Number(b.total_payment || 0),
      ),
    render: (value, record) => (
      <CellText strong={record.__isTotal}>
        {formatRupiah(Number(value || 0))}
      </CellText>
    ),
  },
];

export const LAND_PERMIT_INCOME_RECAP_EXPORT_COLUMNS = [
  { key: "no", header: "No", width: 8 },
  { key: "location_name", header: "Lokasi", width: 24 },
  { key: "sector_name", header: "Sektor", width: 24 },
  { key: "transaction_count", header: "Jumlah Transaksi", width: 18 },
  { key: "trader_count", header: "Jumlah Pedagang", width: 18 },
  {
    key: "total_income",
    header: "Total Pendapatan",
    type: "currency",
    width: 22,
  },
];

export const LAND_PERMIT_INCOME_DETAIL_EXPORT_COLUMNS = [
  { key: "no", header: "No", width: 8 },
  { key: "report_date", header: "Tanggal Validasi", width: 18 },
  { key: "payment_date", header: "Tanggal Pembayaran", width: 18 },
  { key: "document_number", header: "Nomor Dokumen Izin", width: 24 },
  { key: "trader_name", header: "Nama Pedagang", width: 26 },
  { key: "trader_nik_masked", header: "NIK Tersamarkan", width: 18 },
  { key: "location_name", header: "Lokasi", width: 22 },
  { key: "sector_name", header: "Sektor", width: 18 },
  { key: "stall_number", header: "Lapak", width: 14 },
  { key: "commodity_type", header: "Jenis Dagangan", width: 18 },
  { key: "dimension_label", header: "Ukuran/Luas", width: 22 },
  { key: "permit_period", header: "Masa Izin", width: 26 },
  { key: "duration_label", header: "Durasi", width: 14 },
  { key: "price_per_m2", header: "Harga per m²", type: "currency", width: 18 },
  {
    key: "annual_land_rent",
    header: "Sewa per Tahun",
    type: "currency",
    width: 20,
  },
  {
    key: "total_payment",
    header: "Total Pembayaran",
    type: "currency",
    width: 22,
  },
  { key: "payment_status_label", header: "Status Pembayaran", width: 18 },
];

export const buildLandPermitIncomeRecapExportRows = (rows = []) =>
  rows.map((row, index) => ({
    no: index + 1,
    location_name: row.location_name || "-",
    sector_name: row.sector_name || "-",
    transaction_count: Number(row.transaction_count || 0),
    trader_count: Number(row.trader_count || 0),
    total_income: Number(row.total_income || 0),
  }));

export const buildLandPermitIncomeDetailExportRows = (rows = []) =>
  rows.map((row, index) => ({
    no: index + 1,
    report_date: formatDate(row.report_date),
    payment_date: formatDate(row.payment_date),
    document_number: row.document_number || "-",
    trader_name: row.trader_name || "-",
    trader_nik_masked: row.trader_nik_masked || "-",
    location_name: row.location_name || "-",
    sector_name: row.sector_name || "-",
    stall_number: row.stall_number || "-",
    commodity_type: row.commodity_type || "-",
    dimension_label: buildDimensionLabel(row),
    permit_period: buildPermitPeriodLabel(row),
    duration_label: `${row.lease_duration_years || 1} Tahun`,
    price_per_m2: Number(row.price_per_m2 || 0),
    annual_land_rent: Number(row.annual_land_rent || 0),
    total_payment: Number(row.total_payment || 0),
    payment_status_label: row.payment_status_label || "Tervalidasi",
  }));
