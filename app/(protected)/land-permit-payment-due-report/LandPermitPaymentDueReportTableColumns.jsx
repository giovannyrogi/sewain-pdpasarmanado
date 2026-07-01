"use client";

import React from "react";
import { Box, Chip, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { Icon } from "@iconify/react";
import moment from "moment";
import CompactInfoChip from "@/app/components/chips/CompactInfoChip";
import TableActionButton from "@/app/components/data-table/TableActionButton";
import formatRupiah from "@/app/components/formatrupiah/page";
import { getDaysLabel } from "@/app/components/dashboard/dashboardUtils";

export const LAND_PAYMENT_DUE_PAGE_SIZE_OPTIONS = [10, 20, 50];
export const LAND_PAYMENT_DUE_SCROLL_WIDTH = 1280;

const normalize = (value) => String(value || "").toLowerCase();

const formatDate = (value) =>
  value && moment(value).isValid() ? moment(value).format("DD MMM YYYY") : "-";

const DueStatusChip = ({ status, daysRemaining, theme }) => {
  const isOverdue = status === "overdue";
  const color = isOverdue
    ? theme.palette.error.main
    : theme.palette.warning.main;

  return (
    <Chip
      size="small"
      icon={
        <Icon
          icon={
            isOverdue
              ? "solar:alarm-bold-duotone"
              : "solar:clock-circle-bold-duotone"
          }
          fontSize={15}
        />
      }
      label={getDaysLabel(daysRemaining)}
      sx={{
        width: "fit-content",
        height: 25,
        borderRadius: 999,
        color,
        bgcolor: alpha(color, theme.palette.mode === "dark" ? 0.17 : 0.12),
        border: `1px solid ${alpha(color, theme.palette.mode === "dark" ? 0.5 : 0.35)}`,
        fontFamily: "Poppins",
        fontWeight: 700,
        fontSize: 12,
        "& .MuiChip-icon": { color },
      }}
    />
  );
};

export const filterLandPaymentDueRows = (rows, searchText) => {
  const keyword = normalize(searchText).trim();
  if (!keyword) return rows;

  return rows.filter((row) =>
    [
      row.tenant_name,
      row.tenant_nik,
      row.tenant_phone,
      row.location_name,
      row.sector_name,
      row.sector_code,
      row.stall_number,
      row.commodity_type,
      row.payment_due?.due_status,
    ]
      .map(normalize)
      .some((value) => value.includes(keyword)),
  );
};

export const LAND_PAYMENT_DUE_EXPORT_COLUMNS = [
  { header: "Nama Pedagang", key: "tenant_name", width: 26, pdfWidth: 34 },
  { header: "NIK", key: "tenant_nik", width: 22, pdfWidth: 25 },
  { header: "No. Telepon", key: "tenant_phone", width: 18, pdfWidth: 22 },
  { header: "Lokasi", key: "location_name", width: 24, pdfWidth: 30 },
  { header: "Sektor", key: "sector_name", width: 20, pdfWidth: 24 },
  { header: "Lahan", key: "stall_number", width: 16, pdfWidth: 16 },
  { header: "Jenis Dagangan", key: "commodity_type", width: 20, pdfWidth: 24 },
  { header: "Total Pembayaran", key: "due_amount", type: "currency", width: 20, pdfWidth: 28 },
  { header: "Tanggal Mulai Izin", key: "due_date", width: 22, pdfWidth: 26 },
  { header: "Status", key: "due_status_label", width: 22, pdfWidth: 26 },
];

export const buildLandPaymentDueExportRows = (rows = []) =>
  rows.map((row) => ({
    tenant_name: row.tenant_name || "-",
    tenant_nik: row.tenant_nik || "-",
    tenant_phone: row.tenant_phone || "-",
    location_name: row.location_name || "-",
    sector_name: row.sector_name || "-",
    stall_number: row.stall_number || "-",
    commodity_type: row.commodity_type || "-",
    due_amount: Number(row.payment_due?.due_amount || row.total_payment || 0),
    due_date: formatDate(row.payment_due?.due_date || row.start_date),
    due_status_label: getDaysLabel(row.payment_due?.days_remaining),
  }));

export const createLandPaymentDueReportColumns = ({
  theme,
  onOpenDetail,
  onPhoneAction,
  isMobile,
}) => [
  {
    title: "No",
    dataIndex: "index",
    key: "index",
    width: 72,
    align: "center",
  },
  {
    title: "Pemohon",
    key: "tenant",
    width: 270,
    sorter: (a, b) =>
      String(a.tenant_name || "").localeCompare(String(b.tenant_name || "")),
    render: (_, record) => (
      <Stack spacing={0.45}>
        <Typography sx={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 14 }}>
          {record.tenant_name || "-"}
        </Typography>
        <Typography
          sx={{
            color: theme.ui.mutedText,
            fontFamily: "Poppins",
            fontWeight: 600,
            fontSize: 12,
          }}
        >
          NIK {record.tenant_nik || "-"}
        </Typography>
      </Stack>
    ),
  },
  {
    title: "Lokasi, Sektor & Lahan",
    key: "land",
    width: 320,
    render: (_, record) => (
      <Stack spacing={0.5}>
        <Typography sx={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 12 }}>
          {record.location_name || "-"}
        </Typography>
        <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap", alignItems: "center" }}>
          <CompactInfoChip
            label={record.sector_name || "-"}
            color={theme.palette.primary.main}
          />
          <Typography
            sx={{
              color: theme.ui.mutedText,
              fontFamily: "Poppins",
              fontWeight: 600,
              fontSize: 12,
              lineHeight: "23px",
            }}
          >
            Lahan {record.stall_number || "-"}
          </Typography>
        </Box>
      </Stack>
    ),
  },
  {
    title: "Pembayaran",
    key: "payment",
    width: 230,
    sorter: (a, b) =>
      Number(a.payment_due?.due_amount || 0) -
      Number(b.payment_due?.due_amount || 0),
    render: (_, record) => (
      <Stack spacing={0.45}>
        <Typography sx={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 13 }}>
          {formatRupiah(Number(record.payment_due?.due_amount || record.total_payment || 0))}
        </Typography>
        <Typography sx={{ color: theme.ui.mutedText, fontWeight: 600, fontSize: 12 }}>
          {record.commodity_type || "-"}
        </Typography>
      </Stack>
    ),
  },
  {
    title: "Jatuh Tempo",
    key: "due_date",
    width: 245,
    sorter: (a, b) =>
      moment(a.payment_due?.due_date || 0).valueOf() -
      moment(b.payment_due?.due_date || 0).valueOf(),
    render: (_, record) => (
      <Stack spacing={0.65}>
        <Typography sx={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 12 }}>
          {formatDate(record.payment_due?.due_date || record.start_date)}
        </Typography>
        <DueStatusChip
          theme={theme}
          status={record.payment_due?.due_status}
          daysRemaining={record.payment_due?.days_remaining}
        />
      </Stack>
    ),
  },
  {
    title: "Aksi",
    key: "actions",
    width: 152,
    fixed: isMobile ? undefined : "right",
    align: "center",
    className: "land-payment-due-action-cell",
    render: (_, record) => (
      <Box
        className="land-payment-due-action-buttons"
        sx={{ display: "flex", justifyContent: "center", gap: 0.75 }}
      >
        <TableActionButton
          title="Lihat detail pemohon"
          color="success"
          icon="solar:eye-bold-duotone"
          onClick={() => onOpenDetail(record)}
        />
        <TableActionButton
          title="Kirim pengingat WhatsApp"
          color="success"
          icon="ic:baseline-whatsapp"
          onClick={() => onPhoneAction(record)}
        />
      </Box>
    ),
  },
];
