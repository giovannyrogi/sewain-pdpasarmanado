"use client";

import React from "react";
import { Stack, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import formatRupiah from "@/app/components/formatrupiah/page";

export const LOCATION_REPORT_SCROLL_WIDTH = 1520;
export const LOCATION_REPORT_PAGE_SIZE_OPTIONS = [5, 10, 20, 50];

const moneyText = (value) => (
  <Typography
    sx={{
      fontSize: 12,
      fontWeight: 600,
      textAlign: "right",
      letterSpacing: "1px",
    }}
  >
    {value === "" || value === null || value === undefined
      ? ""
      : formatRupiah(value)}
  </Typography>
);

const otherAmountText = (value, record) => {
  const normalizedValue = Number(value || 0);
  const displayText =
    !record?.__isTotal && normalizedValue === 0
      ? "-"
      : formatRupiah(normalizedValue);

  return (
    <Typography
      sx={{
        fontSize: 12,
        fontWeight: 600,
        textAlign: "right",
        letterSpacing: "1px",
      }}
    >
      {displayText}
    </Typography>
  );
};

const keepTotalAtBottom = (compare) => (a, b) => {
  if (a?.__isTotal) return 1;
  if (b?.__isTotal) return -1;
  return compare(a, b);
};

/**
 * Filter ringan untuk laporan lokasi.
 * Search dibuat mencakup nama lokasi karena laporan ini adalah agregasi per lokasi.
 */
export const filterLocationReportRows = (rows = [], searchText = "") => {
  const search = searchText.trim().toLowerCase();
  if (!search) return rows;

  return rows.filter((item) =>
    item?.location_name?.toLowerCase().includes(search),
  );
};

/**
 * Ringkasan KPI untuk laporan lokasi.
 * Nilai ini berasal dari totals API agar angka summary dan tabel selalu sama.
 */
export const buildLocationReportStats = ({ rows = [], totals = {}, theme }) => [
  {
    label: "Lokasi Berpendapatan",
    value: rows.length,
    icon: "solar:map-point-wave-bold-duotone",
    color: theme.palette.info.main,
  },
  {
    label: "Kontrak Murni",
    value: formatRupiah(totals?.total_contract || 0),
    icon: "solar:document-text-bold-duotone",
    color: theme.palette.success.main,
  },
  {
    label: "PPN 11%",
    value: formatRupiah(totals?.total_ppn || 0),
    icon: "solar:bill-list-bold-duotone",
    color: theme.palette.warning.main,
  },
  {
    label: "Potongan PPH",
    value: formatRupiah(totals?.total_pph || 0),
    icon: "solar:scissors-bold-duotone",
    color: theme.palette.error.main,
  },
  {
    label: "Total Bersih",
    value: formatRupiah(totals?.total_net || 0),
    icon: "solar:wallet-money-bold-duotone",
    color: theme.palette.primary.main,
  },
];

/**
 * Definisi kolom tabel Report by Locations.
 * Table memakai numeric alignment agar laporan keuangan mudah dibandingkan.
 */
export const createLocationReportColumns = ({ theme, isMobile }) => [
  {
    title: "No",
    dataIndex: "index",
    width: 64,
    align: "center",
  },
  {
    title: "Lokasi",
    dataIndex: "location_name",
    fixed: isMobile ? undefined : "left",
    width: 250,
    sorter: keepTotalAtBottom((a, b) =>
      a.location_name.localeCompare(b.location_name),
    ),
    render: (value, record) => (
      <Typography sx={{ fontWeight: 700, fontSize: 14 }}>{value}</Typography>
    ),
  },
  {
    title: "Kontrak Murni",
    dataIndex: "income_contracts",
    width: 170,
    align: "right",
    sorter: keepTotalAtBottom(
      (a, b) => a.income_contracts - b.income_contracts,
    ),
    render: moneyText,
  },
  {
    title: "JTU",
    dataIndex: "JTU",
    width: 150,
    align: "right",
    sorter: keepTotalAtBottom((a, b) => a.JTU - b.JTU),
    render: moneyText,
  },
  {
    title: "Kontrak + JTU",
    dataIndex: "income_contract_without_ppn",
    width: 190,
    align: "right",
    sorter: keepTotalAtBottom(
      (a, b) => a.income_contract_without_ppn - b.income_contract_without_ppn,
    ),
    render: moneyText,
  },
  {
    title: "PPN 11%",
    dataIndex: "total_ppn",
    width: 165,
    align: "right",
    sorter: keepTotalAtBottom((a, b) => a.total_ppn - b.total_ppn),
    render: moneyText,
  },
  {
    title: "Lainnya",
    dataIndex: "other_amount",
    width: 150,
    align: "right",
    sorter: keepTotalAtBottom((a, b) => a.other_amount - b.other_amount),
    render: otherAmountText,
  },
  {
    title: "Total + PPN",
    dataIndex: "income_contract_with_ppn",
    width: 180,
    align: "right",
    sorter: keepTotalAtBottom(
      (a, b) => a.income_contract_with_ppn - b.income_contract_with_ppn,
    ),
    render: moneyText,
  },
  {
    title: "PPH 10%",
    dataIndex: "total_pph",
    width: 165,
    align: "right",
    sorter: keepTotalAtBottom((a, b) => a.total_pph - b.total_pph),
    render: moneyText,
  },
  {
    title: "Total Bersih",
    dataIndex: "total_without_ppn_pph",
    width: 180,
    align: "right",
    sorter: keepTotalAtBottom(
      (a, b) => a.total_without_ppn_pph - b.total_without_ppn_pph,
    ),
    render: moneyText,
  },
];

export const LOCATION_EXPORT_COLUMNS = [
  { header: "Nama Lokasi", key: "location_name", width: 26 },
  { header: "Kontrak Murni", key: "income_contracts", type: "currency" },
  { header: "JTU", key: "JTU", type: "currency" },
  {
    header: "Kontrak + JTU",
    key: "income_contract_without_ppn",
    type: "currency",
    width: 20,
  },
  { header: "PPN 11%", key: "total_ppn", type: "currency" },
  { header: "Lainnya", key: "other_amount", type: "currency", pdfZeroAsDash: true },
  {
    header: "Total + PPN",
    key: "income_contract_with_ppn",
    type: "currency",
    width: 20,
  },
  { header: "PPH 10%", key: "total_pph", type: "currency" },
  {
    header: "Total Bersih",
    key: "total_without_ppn_pph",
    type: "currency",
    width: 20,
  },
];
