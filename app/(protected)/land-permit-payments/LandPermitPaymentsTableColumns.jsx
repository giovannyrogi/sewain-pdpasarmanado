"use client";

import React from "react";
import { Box, Chip, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import moment from "moment";
import formatRupiah from "@/app/components/formatrupiah/page";
import ApprovalStatusChip from "@/app/components/status/ApprovalStatusChip";
import TableActionButton from "@/app/components/data-table/TableActionButton";

export const LAND_PAYMENT_PAGE_SIZE_OPTIONS = [5, 10, 20, 50];
export const LAND_PAYMENT_TABLE_SCROLL_WIDTH = 1380;
export const LAND_PAYMENT_ACTION_COLUMN_WIDTH = 238;

const normalize = (value) => String(value || "").toLowerCase();

export function filterLandPermitPayments(data, keyword) {
  const search = normalize(keyword);
  if (!search) return data;

  return data.filter((item) =>
    [
      item.tenant_name,
      item.tenant_nik,
      item.location_name,
      item.sector_name,
      item.sector_code,
      item.stall_number,
      item.commodity_type,
      item.payment_approval_status,
    ].some((value) => normalize(value).includes(search)),
  );
}

export function buildLandPermitPaymentStats(data, theme) {
  return [
    {
      label: "Total Pembayaran",
      value: data.length,
      icon: "solar:wallet-money-bold-duotone",
      color: theme.palette.primary.main,
    },
    {
      label: "Dalam Proses",
      value: data.filter((item) => item.payment_approval_status === "proses")
        .length,
      icon: "solar:hourglass-line-bold-duotone",
      color: theme.palette.warning.main,
    },
    {
      label: "Disetujui",
      value: data.filter((item) => item.payment_approval_status === "approved")
        .length,
      icon: "solar:verified-check-bold-duotone",
      color: theme.palette.success.main,
    },
    {
      label: "Ditolak",
      value: data.filter((item) => item.payment_approval_status === "rejected")
        .length,
      icon: "solar:close-circle-bold-duotone",
      color: theme.palette.error.main,
    },
  ];
}

export function createLandPermitPaymentColumns({
  theme,
  user,
  isMobile,
  onDetail,
  onProgress,
  onEdit,
  onPrint,
  onDelete,
  onReject,
}) {
  const isFinance = Number(user?.role_id) === 8;
  const canPrint = [1, 8, 9].includes(Number(user?.role_id));

  return [
    {
      title: "No",
      width: 64,
      align: "center",
      render: (_value, _record, index) => index + 1,
    },
    {
      title: "Pemohon & Komoditas",
      width: 290,
      sorter: (a, b) => normalize(a.tenant_name).localeCompare(normalize(b.tenant_name)),
      render: (_value, record) => (
        <Stack spacing={0.65} sx={{ minWidth: 0 }}>
          <Typography sx={{ fontSize: 13, fontWeight: 700 }}>
            {record.tenant_name || "-"}
          </Typography>
          <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap>
            <Chip
              size="small"
              label={record.commodity_type || "-"}
              sx={{
                height: 23,
                width: "fit-content",
                color: theme.palette.primary.main,
                bgcolor: alpha(theme.palette.primary.main, 0.12),
                fontWeight: 700,
              }}
            />
            <Typography sx={{ color: theme.ui.mutedText, fontSize: 11.5, fontWeight: 600, lineHeight: "23px" }}>
              NIK {record.tenant_nik || "-"}
            </Typography>
          </Stack>
        </Stack>
      ),
    },
    {
      title: "Lokasi, Sektor & Lahan",
      width: 300,
      render: (_value, record) => (
        <Stack spacing={0.65}>
          <Typography sx={{ fontSize: 13, fontWeight: 700 }}>
            {record.location_name || "-"}
          </Typography>
          <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap>
            <Chip
              size="small"
              label={record.sector_name || "-"}
              sx={{
                height: 23,
                width: "fit-content",
                color: theme.palette.primary.main,
                bgcolor: alpha(theme.palette.primary.main, 0.12),
                fontWeight: 700,
              }}
            />
            <Typography sx={{ color: theme.ui.mutedText, fontSize: 11.5, fontWeight: 600, lineHeight: "23px" }}>
              Lahan {record.stall_number || "-"}
            </Typography>
          </Stack>
        </Stack>
      ),
    },
    {
      title: "Pembayaran",
      width: 230,
      sorter: (a, b) => Number(a.payment_amount || 0) - Number(b.payment_amount || 0),
      render: (_value, record) => (
        <Stack spacing={0.45}>
          <Typography sx={{ fontSize: 13, fontWeight: 700 }}>
            {formatRupiah(record.payment_amount)}
          </Typography>
          <Typography sx={{ color: theme.ui.mutedText, fontSize: 11.5, fontWeight: 600 }}>
            Lunas | {record.payment_date ? moment(record.payment_date).format("D MMMM YYYY") : "-"}
          </Typography>
        </Stack>
      ),
    },
    {
      title: "Masa Izin",
      width: 230,
      render: (_value, record) => (
        <Stack spacing={0.35}>
          <Typography sx={{ fontSize: 12.5, fontWeight: 700 }}>
            {record.lease_duration_years || 1} Tahun
          </Typography>
          <Typography sx={{ color: theme.ui.mutedText, fontSize: 11.5, fontWeight: 600 }}>
            {record.start_date ? moment(record.start_date).format("D MMM YYYY") : "-"} s/d{" "}
            {record.end_date ? moment(record.end_date).format("D MMM YYYY") : "-"}
          </Typography>
        </Stack>
      ),
    },
    {
      title: "Status Verifikasi",
      width: 250,
      render: (_value, record) => (
        <ApprovalStatusChip
          status={record.payment_approval_status}
          totalStep={1}
          label={
            record.payment_approval_status === "proses"
              ? "Menunggu Keuangan"
              : undefined
          }
          onClick={() => onProgress(record)}
          theme={theme}
        />
      ),
    },
    {
      title: "Aksi",
      key: "action",
      align: "center",
      width: LAND_PAYMENT_ACTION_COLUMN_WIDTH,
      fixed: isMobile ? false : "right",
      className: "land-payments-action-column",
      onHeaderCell: () => ({ className: "land-payments-action-column" }),
      onCell: () => ({ className: "land-payments-action-column" }),
      render: (_value, record) => {
        const editable = !isFinance &&
          ["proses", "rejected"].includes(record.payment_approval_status);
        const financePending =
          isFinance &&
          record.payment_approval_status === "proses" &&
          record.payment_approval_record_status === "pending";

        return (
          <Box
            className="land-payments-action-buttons"
            sx={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 0.75,
              minWidth: 202,
              flexWrap: "nowrap",
            }}
          >
            {editable && (
              <TableActionButton
                title="Edit pembayaran"
                color="info"
                icon="solar:pen-new-square-bold-duotone"
                onClick={() => onEdit(record)}
              />
            )}
            <TableActionButton
              title="Lihat detail pembayaran izin lahan"
              color="success"
              icon="solar:eye-bold-duotone"
              onClick={() => onDetail(record)}
            />
            {canPrint && (
              <TableActionButton
                title="Cetak kwitansi penerimaan"
                color="warning"
                icon="solar:printer-2-bold-duotone"
                onClick={() => onPrint(record)}
              />
            )}
            {editable && (
              <TableActionButton
                title="Hapus pembayaran"
                color="error"
                icon="solar:trash-bin-trash-bold-duotone"
                onClick={() => onDelete(record)}
              />
            )}
            {financePending && (
              <TableActionButton
                title="Tolak pembayaran"
                color="error"
                icon="solar:close-circle-bold-duotone"
                onClick={() => onReject(record)}
              />
            )}
          </Box>
        );
      },
    },
  ];
}
