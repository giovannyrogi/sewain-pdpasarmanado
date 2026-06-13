"use client";

import React from "react";
import { Box, Chip, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { Icon } from "@iconify/react";
import moment from "moment";
import formatRupiah from "@/app/components/formatrupiah/page";
import TableActionButton from "@/app/components/data-table/TableActionButton";
import { getDaysLabel } from "../dashboard/dashboardUtils";

export const PAYMENT_DUE_PAGE_SIZE_OPTIONS = [10, 20, 50];
export const PAYMENT_DUE_SCROLL_WIDTH = 1220;

const normalize = (value) => String(value || "").toLowerCase();

const getPaymentStepLabel = (record) => {
  const paymentType = record?.tenant_application?.payment_type;
  const paymentNumber = Number(record?.payments?.payment_number || 1);

  if (paymentType === "lunas") return "Pelunasan";
  if (paymentNumber === 1) return "Uang Muka";
  return `Cicilan ${paymentNumber - 1}`;
};

const formatDate = (value) =>
  value ? moment(value).format("DD MMM YYYY") : "-";

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
        fontSize: 11,
        "& .MuiChip-icon": {
          color,
        },
      }}
    />
  );
};

export const filterPaymentDueRows = (rows, searchText) => {
  const keyword = normalize(searchText).trim();
  if (!keyword) return rows;

  return rows.filter((row) => {
    const tenant = row.tenant_application || {};
    const location = row.location || {};
    const room = row.room || {};
    const due = row.payment_due || {};

    return [
      tenant.tenant_name,
      tenant.tenant_nik,
      tenant.document_number,
      location.location_name,
      room.room_number,
      room.floor,
      due.payment_step_label,
      due.due_status,
    ]
      .map(normalize)
      .some((value) => value.includes(keyword));
  });
};

export const PAYMENT_DUE_EXPORT_COLUMNS = [
  { header: "Nama Penyewa", key: "tenant_name", width: 26 },
  { header: "NIK", key: "tenant_nik", width: 22 },
  { header: "No. Telepon", key: "tenant_phone", width: 18 },
  { header: "Lokasi", key: "location_name", width: 24 },
  { header: "Ruangan", key: "room_number", width: 16 },
  { header: "Lantai", key: "floor", width: 14 },
  { header: "Jenis Pembayaran", key: "payment_type", width: 18 },
  { header: "Tahap Pembayaran", key: "payment_step_label", width: 20 },
  { header: "Nominal", key: "due_amount", type: "currency", width: 18 },
  { header: "Tanggal Jatuh Tempo", key: "due_date", width: 22 },
  { header: "Status", key: "due_status_label", width: 22 },
];

export const buildPaymentDueExportRows = (rows = []) =>
  rows.map((row) => {
    const tenant = row.tenant_application || {};
    const location = row.location || {};
    const room = row.room || {};
    const due = row.payment_due || {};

    return {
      tenant_name: tenant.tenant_name || "-",
      tenant_nik: tenant.tenant_nik || "-",
      tenant_phone: tenant.tenant_phone || "-",
      location_name: location.location_name || "-",
      room_number: room.room_number || "-",
      floor: room.floor || "-",
      payment_type: tenant.payment_type === "lunas" ? "Lunas" : "Cicilan",
      payment_step_label: due.payment_step_label || getPaymentStepLabel(row),
      due_amount: Number(due.due_amount || 0),
      due_date: formatDate(due.due_date),
      due_status_label: getDaysLabel(due.days_remaining),
    };
  });

/**
 * Kolom laporan jatuh tempo dibuat ringkas agar data operasional utama tetap
 * mudah dipindai, sementara detail lengkap tetap tersedia melalui modal.
 */
export const createPaymentDueReportColumns = ({
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
    width: 260,
    sorter: (a, b) =>
      String(a.tenant_application?.tenant_name || "").localeCompare(
        String(b.tenant_application?.tenant_name || ""),
      ),
    render: (_, record) => (
      <Stack spacing={0.45}>
        <Typography
          sx={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 12.5 }}
        >
          {record.tenant_application?.tenant_name || "-"}
        </Typography>
        <Typography
          sx={{
            color: theme.ui.mutedText,
            fontFamily: "Poppins",
            fontWeight: 600,
            fontSize: 11,
          }}
        >
          NIK {record.tenant_application?.tenant_nik || "-"}
        </Typography>
      </Stack>
    ),
  },
  {
    title: "Lokasi & Ruangan",
    key: "room",
    width: 260,
    render: (_, record) => (
      <Stack spacing={0.45}>
        <Typography
          sx={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 12 }}
        >
          {record.location?.location_name || "-"}
        </Typography>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.75,
            flexWrap: "wrap",
          }}
        >
          <Chip
            size="small"
            label={`Ruangan ${record.room?.room_number || "-"}`}
            sx={{
              height: 23,
              borderRadius: 999,
              bgcolor:
                theme.palette.mode === "dark"
                  ? "rgba(255,152,0,0.14)"
                  : "rgba(230,9,9,0.08)",
              color: theme.palette.primary.main,
              fontFamily: "Poppins",
              fontWeight: 700,
              fontSize: 10.5,
            }}
          />
          <Typography
            sx={{
              color: theme.ui.mutedText,
              fontFamily: "Poppins",
              fontWeight: 600,
              fontSize: 11,
            }}
          >
            {record.room?.floor || "-"}
          </Typography>
        </Box>
      </Stack>
    ),
  },
  {
    title: "Pembayaran",
    key: "payment",
    width: 220,
    sorter: (a, b) =>
      Number(a.payment_due?.due_amount || 0) -
      Number(b.payment_due?.due_amount || 0),
    render: (_, record) => (
      <Stack spacing={0.5}>
        <Typography
          sx={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 12 }}
        >
          {record.payment_due?.payment_step_label ||
            getPaymentStepLabel(record)}
        </Typography>
        <Typography
          sx={{
            color: theme.palette.primary.main,
            fontFamily: "Poppins",
            fontWeight: 700,
            fontSize: 12,
          }}
        >
          {formatRupiah(Number(record.payment_due?.due_amount || 0))}
        </Typography>
      </Stack>
    ),
  },
  {
    title: "Jatuh Tempo",
    key: "due_date",
    width: 240,
    sorter: (a, b) =>
      moment(a.payment_due?.due_date || 0).valueOf() -
      moment(b.payment_due?.due_date || 0).valueOf(),
    render: (_, record) => (
      <Stack spacing={0.65}>
        <Typography
          sx={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 12 }}
        >
          {formatDate(record.payment_due?.due_date)}
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
    className: "payment-due-action-cell",
    render: (_, record) => (
      <Box
        className="payment-due-action-buttons"
        sx={{ display: "flex", justifyContent: "center", gap: 0.75 }}
      >
        <TableActionButton
          title="Lihat detail pembayaran"
          color="info"
          icon="solar:document-text-bold-duotone"
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
