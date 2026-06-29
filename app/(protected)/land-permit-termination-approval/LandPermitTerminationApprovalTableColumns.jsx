"use client";

import React from "react";
import { Box, Chip, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { Icon } from "@iconify/react";
import moment from "moment";
import ApprovalStatusChip from "@/app/components/status/ApprovalStatusChip";
import TableActionButton from "@/app/components/data-table/TableActionButton";

export const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];
export const TABLE_SCROLL_WIDTH = 1420;
export const ACTION_COLUMN_WIDTH = 142;

const normalize = (value) => String(value || "").toLowerCase();

const formatDate = (value) =>
  value && moment(value).isValid() ? moment(value).format("D MMM YYYY") : "-";

export const isLandPermitTerminationWaitingForUser = (record, user) =>
  record?.termination_approval_status === "proses" &&
  record?.status === "pending" &&
  Number(record?.termination_current_step) === Number(record?.step_order) &&
  Number(record?.role_id) === Number(user?.role_id);

export const filterLandPermitTerminationApprovals = (data, searchText) => {
  const keyword = normalize(searchText);
  if (!keyword) return data;

  return data.filter((item) =>
    [
      item.tenant_name,
      item.tenant_nik,
      item.location_name,
      item.sector_name,
      item.stall_number,
      item.commodity_type,
      item.termination_reason,
      item.termination_approval_status,
      item.role_name,
    ].some((value) => normalize(value).includes(keyword)),
  );
};

export const buildLandPermitTerminationApprovalStats = (data, theme, user) => [
  {
    label: "Total Approval",
    value: data.length,
    icon: "solar:documents-bold-duotone",
    color: theme.palette.primary.main,
  },
  {
    label: "Menunggu Anda",
    value: data.filter((item) =>
      isLandPermitTerminationWaitingForUser(item, user),
    ).length,
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
        item.status === "rejected" ||
        item.termination_approval_status === "rejected",
    ).length,
    icon: "solar:close-circle-bold-duotone",
    color: theme.palette.error.main,
  },
];

const getStageChip = (record, user, theme) => {
  if (!isLandPermitTerminationWaitingForUser(record, user)) return null;

  return (
    <Chip
      size="small"
      icon={<Icon icon="solar:danger-triangle-bold-duotone" />}
      label="Perlu keputusan Anda"
      sx={{
        height: 23,
        color: theme.palette.error.main,
        bgcolor: alpha(theme.palette.error.main, 0.12),
        border: `1px solid ${alpha(theme.palette.error.main, 0.28)}`,
        "& .MuiChip-icon": { color: theme.palette.error.main },
        "& .MuiChip-label": { fontWeight: 700 },
      }}
    />
  );
};

export const createLandPermitTerminationApprovalColumns = ({
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
    title: "Pemohon",
    dataIndex: "tenant_name",
    width: 280,
    sorter: (a, b) => normalize(a.tenant_name).localeCompare(normalize(b.tenant_name)),
    render: (_, record) => (
      <Stack spacing={0.55}>
        <Typography sx={{ fontSize: 13, fontWeight: 700 }}>
          {record.tenant_name || "-"}
        </Typography>
        <Typography
          sx={{ color: theme.ui.mutedText, fontSize: 11.5, fontWeight: 650 }}
        >
          NIK {record.tenant_nik || "-"}
        </Typography>
      </Stack>
    ),
  },
  {
    title: "Lokasi & Lahan",
    dataIndex: "location_name",
    width: 330,
    sorter: (a, b) => normalize(a.location_name).localeCompare(normalize(b.location_name)),
    render: (_, record) => (
      <Stack spacing={0.65}>
        <Typography sx={{ fontSize: 13, fontWeight: 700 }}>
          {record.location_name || "-"}
        </Typography>
        <Stack direction="row" spacing={0.7} flexWrap="wrap" useFlexGap>
          <Chip
            size="small"
            label={record.sector_name || "-"}
            sx={{
              height: 23,
              color: theme.palette.primary.main,
              bgcolor: alpha(theme.palette.primary.main, 0.12),
              fontWeight: 700,
            }}
          />
          <Chip
            size="small"
            label={`Lahan ${record.stall_number || "-"}`}
            sx={{
              height: 23,
              color: theme.palette.info.main,
              bgcolor: alpha(theme.palette.info.main, 0.12),
              fontWeight: 700,
            }}
          />
          <Chip
            size="small"
            label={record.commodity_type || "-"}
            sx={{
              height: 23,
              color: theme.palette.success.main,
              bgcolor: alpha(theme.palette.success.main, 0.12),
              fontWeight: 700,
            }}
          />
        </Stack>
      </Stack>
    ),
  },
  {
    title: "Masa Izin",
    dataIndex: "start_date",
    width: 235,
    render: (_, record) => (
      <Stack spacing={0.35}>
        <Typography sx={{ fontSize: 12.5, fontWeight: 700 }}>
          {record.lease_duration_years || 1} Tahun
        </Typography>
        <Typography
          sx={{ color: theme.ui.mutedText, fontSize: 11.5, fontWeight: 650 }}
        >
          {formatDate(record.start_date)} s/d {formatDate(record.end_date)}
        </Typography>
      </Stack>
    ),
  },
  {
    title: "Status Tahapan",
    dataIndex: "termination_approval_status",
    width: 245,
    render: (_, record) => (
      <Stack spacing={0.7} alignItems="flex-start">
        <ApprovalStatusChip
          status={record.termination_approval_status}
          step={record.termination_current_step}
          totalStep={5}
          onClick={() => onProgress(record)}
          theme={theme}
        />
        {getStageChip(record, user, theme)}
      </Stack>
    ),
  },
  {
    title: "Diajukan",
    dataIndex: "termination_created_at",
    width: 225,
    render: (_, record) => (
      <Stack spacing={0.35}>
        <Typography sx={{ fontSize: 12.5, fontWeight: 700 }}>
          {record.termination_created_at
            ? moment(record.termination_created_at).format("D MMM YYYY, HH:mm")
            : "-"}
        </Typography>
        <Typography
          sx={{ color: theme.ui.mutedText, fontSize: 11.5, fontWeight: 650 }}
        >
          Oleh {record.termination_processed_by_full_name || "-"}
        </Typography>
      </Stack>
    ),
  },
  {
    title: "Aksi",
    key: "actions",
    width: ACTION_COLUMN_WIDTH,
    fixed: isMobile ? false : "right",
    align: "center",
    className: "land-permit-termination-approval-action-column",
    onHeaderCell: () => ({
      className: "land-permit-termination-approval-action-column",
    }),
    onCell: () => ({
      className: "land-permit-termination-approval-action-column",
    }),
    render: (_, record) => {
      const canReject = isLandPermitTerminationWaitingForUser(record, user);

      return (
        <Box
          className="land-permit-termination-approval-action-buttons"
          sx={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 0.75,
            minWidth: 92,
            flexWrap: "nowrap",
          }}
        >
          <TableActionButton
            title="Detail non-aktif izin lahan"
            color="info"
            icon="solar:eye-bold-duotone"
            onClick={() => onDetail(record)}
          />
          <TableActionButton
            title="Progress approval"
            color="success"
            icon="solar:checklist-minimalistic-bold-duotone"
            onClick={() => onProgress(record)}
          />
          {canReject && (
            <TableActionButton
              title="Tolak pengajuan"
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
