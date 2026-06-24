"use client";

import React from "react";
import { Box, Chip, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { Icon } from "@iconify/react";
import moment from "moment";
import ApprovalStatusChip from "@/app/components/status/ApprovalStatusChip";
import CompactInfoChip from "@/app/components/chips/CompactInfoChip";
import TableActionButton from "@/app/components/data-table/TableActionButton";
import formatRupiah from "@/app/components/formatrupiah/page";

export const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];
export const TABLE_SCROLL_WIDTH = 1250;
export const ACTION_COLUMN_WIDTH = 136;

const normalizeText = (value) => String(value || "").toLowerCase();

export const isLandPermitWaitingForUser = (record, user) =>
  record?.approval_status === "proses" &&
  record?.status === "pending" &&
  Number(record?.current_step) === Number(record?.step_order) &&
  Number(record?.role_id) === Number(user?.role_id);

export const filterLandPermitApprovals = (data, searchText) => {
  const keyword = normalizeText(searchText);
  if (!keyword) return data;

  return data.filter((item) =>
    [
      item.tenant_name,
      item.tenant_nik,
      item.location_name,
      item.sector_name,
      item.stall_number,
      item.commodity_type,
      item.approval_status,
      item.role_name,
    ].some((value) => normalizeText(value).includes(keyword)),
  );
};

export const buildLandPermitApprovalStats = (data, theme, user) => [
  {
    label: "Total Approval",
    value: data.length,
    icon: "solar:documents-bold-duotone",
    color: theme.palette.primary.main,
  },
  {
    label: "Menunggu Anda",
    value: data.filter((item) => isLandPermitWaitingForUser(item, user)).length,
    icon: "solar:bell-bing-bold-duotone",
    color: theme.palette.warning.main,
  },
  {
    label: "Sudah Diproses",
    value: data.filter((item) => item.status === "approved").length,
    icon: "solar:verified-check-bold-duotone",
    color: theme.palette.success.main,
  },
  {
    label: "Ditolak",
    value: data.filter(
      (item) =>
        item.status === "rejected" || item.approval_status === "rejected",
    ).length,
    icon: "solar:close-circle-bold-duotone",
    color: theme.palette.error.main,
  },
];

const getStage = (record, user) => {
  if (record.status === "approved") {
    return { label: "Sudah diproses", color: "success" };
  }
  if (
    record.status === "rejected" ||
    record.approval_status === "rejected"
  ) {
    return { label: "Ditolak", color: "error" };
  }
  if (isLandPermitWaitingForUser(record, user)) {
    return { label: "Perlu approval Anda", color: "error" };
  }
  return { label: "Menunggu giliran", color: "warning" };
};

export const createLandPermitApprovalColumns = ({
  user,
  theme,
  isMobile,
  onDetail,
  onProgress,
  onReject,
}) => [
  {
    title: "No",
    width: 64,
    align: "center",
    render: (_, __, index) => index + 1,
  },
  {
    title: "Pemohon & Komoditas",
    dataIndex: "tenant_name",
    width: 310,
    render: (_, record) => (
      <Stack spacing={0.6}>
        <Typography sx={{ fontSize: 13, fontWeight: 700 }}>
          {record.tenant_name || "-"}
        </Typography>
        <Stack
          direction="row"
          alignItems="center"
          flexWrap="wrap"
          gap={0.7}
        >
          <CompactInfoChip
            label={record.commodity_type || "-"}
            color={theme.palette.primary.main}
          />
          <Typography
            sx={{
              color: theme.ui.mutedText,
              fontSize: 11.5,
              fontWeight: 600,
              lineHeight: "23px",
            }}
          >
            NIK {record.tenant_nik || "-"}
          </Typography>
        </Stack>
      </Stack>
    ),
  },
  {
    title: "Lokasi, Sektor & Lahan",
    dataIndex: "location_name",
    width: 330,
    render: (_, record) => (
      <Stack spacing={0.5}>
        <Typography sx={{ fontSize: 13, fontWeight: 700 }}>
          {record.location_name || "-"}
        </Typography>
        <Stack
          direction="row"
          alignItems="center"
          flexWrap="wrap"
          gap={0.7}
        >
          <CompactInfoChip
            label={record.sector_name || "-"}
            color={theme.palette.primary.main}
          />
          <Typography
            sx={{
              color: theme.ui.mutedText,
              fontSize: 11.5,
              fontWeight: 600,
              lineHeight: "23px",
            }}
          >
            Lahan {record.stall_number || "-"}
          </Typography>
        </Stack>
      </Stack>
    ),
  },
  {
    title: "Masa Izin & Biaya",
    dataIndex: "start_date",
    width: 275,
    render: (_, record) => (
      <Stack spacing={0.45}>
        <Typography sx={{ fontSize: 13, fontWeight: 700 }}>
          {formatRupiah(record.total_payment)}
        </Typography>
        <Typography
          sx={{ color: theme.ui.mutedText, fontSize: 11.5, fontWeight: 600 }}
        >
          {record.start_date
            ? moment(record.start_date).format("DD MMM YYYY")
            : "-"}{" "}
          s/d{" "}
          {record.end_date
            ? moment(record.end_date).format("DD MMM YYYY")
            : "-"}
        </Typography>
      </Stack>
    ),
  },
  {
    title: "Status Persetujuan",
    dataIndex: "approval_status",
    width: 245,
    render: (_, record) => {
      const showStage = isLandPermitWaitingForUser(record, user);
      const stage = showStage ? getStage(record, user) : null;
      const color = stage ? theme.palette[stage.color].main : null;
      return (
        <Stack spacing={0.7} alignItems="flex-start">
          <ApprovalStatusChip
            status={record.approval_status}
            step={record.current_step}
            totalStep={5}
            onClick={() => onProgress(record)}
            theme={theme}
          />
          {showStage && (
            <Chip
              size="small"
              icon={<Icon icon="solar:danger-triangle-bold-duotone" />}
              label={stage.label}
              sx={{
                height: 23,
                color,
                bgcolor: alpha(color, 0.12),
                border: `1px solid ${alpha(color, 0.28)}`,
                "& .MuiChip-icon": { color },
                "& .MuiChip-label": { fontWeight: 700 },
              }}
            />
          )}
        </Stack>
      );
    },
  },
  {
    title: "Diajukan",
    dataIndex: "created_at",
    width: 175,
    render: (value) => (
      <Typography sx={{ fontSize: 12, fontWeight: 600 }}>
        {value ? moment(value).format("DD MMM YYYY, HH:mm") : "-"}
      </Typography>
    ),
  },
  {
    title: "Aksi",
    key: "actions",
    width: ACTION_COLUMN_WIDTH,
    fixed: isMobile ? false : "right",
    align: "center",
    className: "land-permit-approval-action-column",
    onHeaderCell: () => ({
      className: "land-permit-approval-action-column",
    }),
    onCell: () => ({ className: "land-permit-approval-action-column" }),
    render: (_, record) => {
      const canReject = isLandPermitWaitingForUser(record, user);
      return (
        <Box
          className="land-permit-approval-action-buttons"
          sx={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 0.75,
            minWidth: 82,
            flexWrap: "nowrap",
          }}
        >
          <TableActionButton
            title="Detail permohonan"
            color="info"
            icon="solar:eye-bold-duotone"
            onClick={() => onDetail(record)}
          />
          {canReject && (
            <TableActionButton
              title="Tolak permohonan"
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
