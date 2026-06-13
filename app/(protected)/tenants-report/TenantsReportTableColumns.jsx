"use client";

import React from "react";
import { Chip, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { Icon } from "@iconify/react";
import formatRupiah from "@/app/components/formatrupiah/page";
import { formatNumber } from "@/app/utils/formatNumber";

export const TENANT_REPORT_SCROLL_WIDTH = 1960;
export const TENANT_REPORT_PAGE_SIZE_OPTIONS = [5, 10, 20, 50];

const moneyText = (value) => (
  <Typography sx={{ fontSize: 12, fontWeight: 700, textAlign: "right" }}>
    {value === "" || value === null || value === undefined
      ? ""
      : formatRupiah(value)}
  </Typography>
);

const keepTotalAtBottom = (compare) => (a, b) => {
  if (a?.__isTotal) return 1;
  if (b?.__isTotal) return -1;
  return compare(a, b);
};

/**
 * Search laporan tenant mencakup nama penyewa, ruangan, dan status pembayaran
 * agar admin cepat menemukan transaksi tertentu dalam periode laporan.
 */
export const filterTenantReportRows = (rows = [], searchText = "") => {
  const search = searchText.trim().toLowerCase();
  if (!search) return rows;

  return rows.filter((item) =>
    [
      item?.tenant_name,
      item?.room_number,
      item?.masa_berlaku,
      item?.keterangan,
      item?.payment_type,
    ]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(search)),
  );
};

/**
 * Ringkasan KPI untuk Report by Tenants.
 * Jumlah baris merepresentasikan transaksi pembayaran yang masuk periode.
 */
export const buildTenantReportStats = ({ rows = [], totals = {}, theme }) => [
  {
    label: "Transaksi Pembayaran",
    value: rows.length,
    icon: "solar:card-recive-bold-duotone",
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
    label: "PPH 10%",
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

const renderPaymentStatus = (value, record, theme) => {
  if (record?.__isTotal) return null;

  const isPaid = Number(record?.remaining_balance || 0) === 0;
  const color = isPaid
    ? theme.palette.success.main
    : theme.palette.warning.main;

  return (
    <Chip
      size="small"
      label={value || "-"}
      icon={
        <Icon
          icon={isPaid ? "solar:check-circle-bold" : "solar:clock-circle-bold"}
        />
      }
      sx={{
        height: 28,
        borderRadius: 999,
        color,
        bgcolor: alpha(color, theme.palette.mode === "dark" ? 0.16 : 0.1),
        border: `1px solid ${alpha(color, 0.32)}`,
        fontWeight: 700,
        "& .MuiChip-icon": { color },
      }}
    />
  );
};

/**
 * Definisi kolom Report by Tenants.
 * Detail kontrak dan pembayaran dipisah agar laporan mudah diaudit baris per baris.
 */
export const createTenantReportColumns = ({ theme, isMobile }) => [
  {
    title: "No",
    dataIndex: "index",
    width: 64,
    align: "center",
  },
  {
    title: "Penyewa",
    dataIndex: "tenant_name",
    fixed: isMobile ? undefined : "left",
    width: 240,
    sorter: keepTotalAtBottom((a, b) =>
      a.tenant_name.localeCompare(b.tenant_name),
    ),
    render: (value, record) => (
      <Stack spacing={0.4}>
        <Typography sx={{ fontWeight: 700, fontSize: 13 }}>{value}</Typography>
        {!record?.__isTotal && (
          <Typography
            sx={{ color: theme.ui.mutedText, fontWeight: 700, fontSize: 11 }}
          >
            {record?.payment_type === "lunas" ? "Lunas" : "Cicilan"} -
            Pembayaran {record?.payment_number || "-"}
          </Typography>
        )}
      </Stack>
    ),
  },
  {
    title: "Tanggal Bayar",
    dataIndex: "payment_date",
    width: 180,
    sorter: keepTotalAtBottom((a, b) =>
      String(a.payment_date).localeCompare(String(b.payment_date)),
    ),
  },
  {
    title: "Ruangan",
    dataIndex: "room_number",
    width: 150,
    render: (value, record) =>
      record?.__isTotal ? null : (
        <Chip
          size="small"
          label={`Ruang ${value || "-"}`}
          icon={<Icon icon="solar:door-bold-duotone" />}
          sx={{
            borderRadius: 1.2,
            fontWeight: 700,
            color: theme.palette.primary.main,
            bgcolor:
              theme.palette.mode === "dark"
                ? "rgba(255,152,0,0.13)"
                : "rgba(230,9,9,0.10)",
          }}
        />
      ),
  },
  {
    title: "Masa Berlaku",
    dataIndex: "masa_berlaku",
    width: 250,
  },
  {
    title: "Ukuran",
    dataIndex: "ukuran_m2",
    width: 150,
    render: (value) => (
      <Typography sx={{ fontSize: 12, fontWeight: 700 }}>
        {value || "-"} 
      </Typography>
    ),
  },
  {
    title: "Harga Sewa",
    dataIndex: "harga_m2",
    width: 160,
    align: "right",
    sorter: keepTotalAtBottom((a, b) => a.harga_m2 - b.harga_m2),
    render: moneyText,
  },
  {
    title: "Kontrak Murni",
    dataIndex: "kontrak",
    width: 170,
    align: "right",
    sorter: keepTotalAtBottom((a, b) => a.kontrak - b.kontrak),
    render: moneyText,
  },
  {
    title: "JTU",
    dataIndex: "jtu",
    width: 140,
    align: "right",
    sorter: keepTotalAtBottom((a, b) => a.jtu - b.jtu),
    render: moneyText,
  },
  {
    title: "Kontrak + JTU",
    dataIndex: "total_kontrak_tanpa_ppn",
    width: 180,
    align: "right",
    sorter: keepTotalAtBottom(
      (a, b) => a.total_kontrak_tanpa_ppn - b.total_kontrak_tanpa_ppn,
    ),
    render: moneyText,
  },
  {
    title: "PPN 11%",
    dataIndex: "total_ppn",
    width: 160,
    align: "right",
    sorter: keepTotalAtBottom((a, b) => a.total_ppn - b.total_ppn),
    render: moneyText,
  },
  {
    title: "Total + PPN",
    dataIndex: "total_plus_ppn",
    width: 170,
    align: "right",
    sorter: keepTotalAtBottom((a, b) => a.total_plus_ppn - b.total_plus_ppn),
    render: moneyText,
  },
  {
    title: "PPH 10%",
    dataIndex: "total_pph",
    width: 160,
    align: "right",
    sorter: keepTotalAtBottom((a, b) => a.total_pph - b.total_pph),
    render: moneyText,
  },
  {
    title: "Total Bersih",
    dataIndex: "total_after_pph_and_no_ppn",
    width: 170,
    align: "right",
    sorter: keepTotalAtBottom(
      (a, b) => a.total_after_pph_and_no_ppn - b.total_after_pph_and_no_ppn,
    ),
    render: moneyText,
  },
  {
    title: "Status",
    dataIndex: "keterangan",
    fixed: isMobile ? undefined : "right",
    width: 180,
    render: (value, record) => renderPaymentStatus(value, record, theme),
  },
];

export const TENANT_EXPORT_COLUMNS = [
  { header: "Nama Penyewa", key: "tenant_name", width: 26 },
  { header: "Tanggal Pembayaran", key: "payment_date", width: 18 },
  { header: "Ruangan", key: "room_number", width: 14 },
  { header: "Masa Berlaku", key: "masa_berlaku", width: 24 },
  { header: "Ukuran", key: "ukuran_m2", width: 16 },
  { header: "Harga Sewa", key: "harga_m2", type: "currency" },
  { header: "Kontrak Murni", key: "kontrak", type: "currency" },
  { header: "JTU", key: "jtu", type: "currency" },
  {
    header: "Kontrak + JTU",
    key: "total_kontrak_tanpa_ppn",
    type: "currency",
    width: 20,
  },
  { header: "PPN 11%", key: "total_ppn", type: "currency" },
  { header: "Total + PPN", key: "total_plus_ppn", type: "currency" },
  { header: "PPH 10%", key: "total_pph", type: "currency" },
  {
    header: "Total Bersih",
    key: "total_after_pph_and_no_ppn",
    type: "currency",
  },
  { header: "Status", key: "keterangan", width: 18 },
];
