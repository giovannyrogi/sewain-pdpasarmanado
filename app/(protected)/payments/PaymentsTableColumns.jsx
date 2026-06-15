"use client";

import React from "react";
import { Box, Chip, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import moment from "moment";
import formatRupiah from "@/app/components/formatrupiah/page";
import ApprovalStatusChip from "@/app/components/status/ApprovalStatusChip";
import TableActionButton from "@/app/components/data-table/TableActionButton";

export const PAYMENT_PAGE_SIZE_OPTIONS = [5, 10, 20, 50];
export const PAYMENT_TABLE_SCROLL_WIDTH = 1320;
export const PAYMENT_ACTION_COLUMN_WIDTH = 238;
export const RECEIPT_PRINT_ROLES = [2, 3, 4, 5];

const normalizeText = (value) => String(value || "").toLowerCase();

const getValueByPath = (object, path) =>
  path.reduce((current, key) => current?.[key], object);

const createColumnFilters = (data, path, map = null) =>
  [...new Set(data.map((item) => getValueByPath(item, path)).filter(Boolean))]
    .map((value) => ({ text: map?.[value] || value, value }));

const createExactFilter = (path) => (value, record) =>
  getValueByPath(record, path) === value;

export const getPaymentLabel = (record) => {
  const paymentType = record?.tenant_application?.payment_type;
  const paymentNumber = Number(record?.payments?.payment_number || 1);

  if (paymentType === "lunas") return "Pelunasan";
  if (paymentNumber === 1) return "Uang Muka (DP)";
  return `Cicilan ${paymentNumber - 1}`;
};

export const filterPayments = (data, searchText) => {
  const keyword = normalizeText(searchText);
  if (!keyword) return data;

  return data.filter((item) =>
    [
      item?.tenant_application?.tenant_name,
      item?.tenant_application?.tenant_nik,
      item?.tenant_application?.payment_type,
      item?.location?.location_name,
      item?.room?.room_number,
      getPaymentLabel(item),
      item?.payments?.approval_status,
      item?.payments?.payment_amount,
    ].some((value) => normalizeText(value).includes(keyword)),
  );
};

export const buildPaymentStats = (data, theme) => {
  const inProgress = data.filter(
    (item) => item?.payments?.approval_status === "proses",
  ).length;
  const approved = data.filter(
    (item) => item?.payments?.approval_status === "approved",
  ).length;
  const rejected = data.filter(
    (item) => item?.payments?.approval_status === "rejected",
  ).length;

  return [
    {
      label: "Total Pembayaran",
      value: data.length,
      icon: "solar:wallet-money-bold-duotone",
      color: theme.palette.primary.main,
    },
    {
      label: "Dalam Proses",
      value: inProgress,
      icon: "solar:hourglass-line-bold-duotone",
      color: theme.palette.warning.main,
    },
    {
      label: "Disetujui",
      value: approved,
      icon: "solar:verified-check-bold-duotone",
      color: theme.palette.success.main,
    },
    {
      label: "Ditolak",
      value: rejected,
      icon: "solar:close-circle-bold-duotone",
      color: theme.palette.error.main,
    },
  ];
};

/**
 * Definisi kolom payments dibuat terpisah agar page hanya berisi state dan alur
 * bisnis. Kolom ini mengatur tampilan data pembayaran, status, dan tombol aksi.
 */
export function createPaymentColumns({
  data,
  user,
  theme,
  onDetail,
  onProgress,
  onPrintProof,
  onPrintReceiptBundle,
  onEdit,
  onDelete,
  onReject,
  isMobile,
}) {
  const paymentTypeMap = { cicilan: "Cicilan", lunas: "Lunas" };
  const statusFilters = [
    { text: "Dalam Proses", value: "proses" },
    { text: "Disetujui", value: "approved" },
    { text: "Ditolak", value: "rejected" },
  ];
  const canPrintReceipt = RECEIPT_PRINT_ROLES.includes(Number(user?.role_id));

  return [
    {
      title: "No",
      dataIndex: "index",
      render: (_text, _record, index) => index + 1,
      width: 64,
      align: "center",
    },
    {
      title: "Pemohon & Pembayaran",
      dataIndex: ["tenant_application", "tenant_name"],
      filters: createColumnFilters(data, ["tenant_application", "tenant_name"]),
      onFilter: createExactFilter(["tenant_application", "tenant_name"]),
      filterSearch: true,
      sorter: (a, b) =>
        normalizeText(a?.tenant_application?.tenant_name).localeCompare(
          normalizeText(b?.tenant_application?.tenant_name),
        ),
      width: 320,
      render: (_text, record) => (
        <Stack spacing={0.65} sx={{ minWidth: 0 }}>
          <Typography
            sx={{
              fontFamily: "Poppins",
              fontWeight: 700,
              fontSize: 13,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {record?.tenant_application?.tenant_name || "-"}
          </Typography>
          <Stack
            direction="row"
            spacing={0.75}
            flexWrap="wrap"
            useFlexGap
            alignItems="center"
          >
            <Chip
              size="small"
              label={getPaymentLabel(record)}
              sx={{
                height: 23,
                color: theme.palette.primary.main,
                fontFamily: "Poppins",
                fontWeight: 700,
                bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.16 : 0.09),
              }}
            />
            <Typography
              sx={{
                color: theme.ui.mutedText,
                fontSize: 12,
                fontWeight: 600,
                lineHeight: "23px",
              }}
            >
              NIK {record?.tenant_application?.tenant_nik || "-"}
            </Typography>
          </Stack>
        </Stack>
      ),
    },
    {
      title: "Lokasi & Ruangan",
      dataIndex: ["location", "location_name"],
      width: 280,
      render: (_text, record) => (
        <Stack spacing={0.65}>
          <Typography sx={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 13 }}>
            {record?.location?.location_name || "-"}
          </Typography>
          <Typography sx={{ color: theme.ui.mutedText, fontSize: 12, fontWeight: 600 }}>
            Ruangan {record?.room?.room_number || "-"} | {record?.room?.floor || "-"}
          </Typography>
        </Stack>
      ),
    },
    {
      title: "Tipe & Nominal",
      dataIndex: ["tenant_application", "payment_type"],
      filters: createColumnFilters(data, ["tenant_application", "payment_type"], paymentTypeMap),
      onFilter: createExactFilter(["tenant_application", "payment_type"]),
      width: 260,
      render: (_text, record) => (
        <Stack spacing={0.65}>
          <Chip
            size="small"
            label={paymentTypeMap[record?.tenant_application?.payment_type] || "-"}
            sx={{
              width: "fit-content",
              height: 23,
              color:
                record?.tenant_application?.payment_type === "cicilan"
                  ? theme.palette.info.main
                  : theme.palette.success.main,
              fontFamily: "Poppins",
              fontWeight: 700,
              bgcolor:
                record?.tenant_application?.payment_type === "cicilan"
                  ? alpha(theme.palette.info.main, theme.palette.mode === "dark" ? 0.15 : 0.09)
                  : alpha(theme.palette.success.main, theme.palette.mode === "dark" ? 0.15 : 0.09),
            }}
          />
          <Typography sx={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 13 }}>
            {formatRupiah(Number(record?.payments?.payment_amount || 0))}
          </Typography>
        </Stack>
      ),
    },
    {
      title: "Status Verifikasi",
      dataIndex: ["payments", "approval_status"],
      filters: statusFilters,
      onFilter: createExactFilter(["payments", "approval_status"]),
      width: 190,
      render: (_text, record) => (
        <ApprovalStatusChip
          status={record?.payments?.approval_status}
          totalStep={1}
          label={
            record?.payments?.approval_status === "proses"
              ? "Dalam Proses"
              : undefined
          }
          onClick={() => onProgress(record)}
          theme={theme}
        />
      ),
    },
    {
      title: "Tanggal",
      dataIndex: ["payments", "payment_date"],
      width: 165,
      render: (_text, record) => (
        <Typography sx={{ fontFamily: "Poppins", fontWeight: 600, fontSize: 12.5 }}>
          {record?.payments?.payment_date
            ? moment(record.payments.payment_date).format("D MMMM YYYY")
            : "-"}
        </Typography>
      ),
    },
    {
      title: "Aksi",
      key: "action",
      align: "center",
      width: PAYMENT_ACTION_COLUMN_WIDTH,
      fixed: isMobile ? false : "right",
      className: "payments-action-column",
      onHeaderCell: () => ({ className: "payments-action-column" }),
      onCell: () => ({ className: "payments-action-column" }),
      render: (_text, record) => (
        <Box
          className="payments-action-buttons"
          sx={{ display: "inline-flex", gap: 0.75, justifyContent: "center" }}
        >
          {Number(user?.role_id) !== 8 &&
            ["rejected", "proses"].includes(record.payments?.approval_status) && (
              <TableActionButton
                title="Edit pembayaran"
                color="info"
                icon="solar:pen-new-square-bold-duotone"
                onClick={() => onEdit(record)}
              />
            )}
          <TableActionButton
            title="Detail pembayaran"
            color="success"
            icon="solar:bill-check-bold-duotone"
            onClick={() => onDetail(record)}
          />
          {record.payments?.approval_status === "approved" && (
            <TableActionButton
              title="Print bukti bayar"
              color="primary"
              icon="streamline-ultimate:print-text"
              onClick={() => onPrintProof(record)}
            />
          )}
          {canPrintReceipt && (
            <TableActionButton
              title="Cetak kwitansi penerimaan dan PPH"
              color="warning"
              icon="mdi:receipt-text-check-outline"
              onClick={() => onPrintReceiptBundle(record)}
            />
          )}
          {Number(user?.role_id) !== 8 &&
            ["rejected", "proses"].includes(record.payments?.approval_status) && (
              <TableActionButton
                title="Hapus pembayaran"
                color="error"
                icon="solar:trash-bin-trash-bold-duotone"
                onClick={() => onDelete(record)}
              />
            )}
          {Number(user?.role_id) === 8 &&
            record.payments?.approval_status === "proses" && (
              <TableActionButton
                title="Tolak pembayaran"
                color="error"
                icon="line-md:close-circle"
                onClick={() => onReject(record)}
              />
            )}
        </Box>
      ),
    },
  ];
}
