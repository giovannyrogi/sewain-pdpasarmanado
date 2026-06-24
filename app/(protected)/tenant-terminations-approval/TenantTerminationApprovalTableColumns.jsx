"use client";

import React from "react";
import { Box, Chip, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { Icon } from "@iconify/react";
import moment from "moment";
import ApprovalStatusChip from "@/app/components/status/ApprovalStatusChip";
import TableActionButton from "@/app/components/data-table/TableActionButton";

export const TERMINATION_APPROVAL_PAGE_SIZE_OPTIONS = [5, 10, 20, 50];
export const TERMINATION_APPROVAL_TABLE_SCROLL_WIDTH = 1460;
export const TERMINATION_APPROVAL_ACTION_COLUMN_WIDTH = 136;

const normalizeText = (value) => String(value || "").toLowerCase();

const createColumnFilters = (data, key) =>
  [...new Set(data.map((item) => item?.[key]).filter(Boolean))].map(
    (value) => ({
      text: value,
      value,
    }),
  );

const createExactFilter = (key) => (value, record) => record?.[key] === value;

const formatDateTime = (value) =>
  value ? moment(value).format("DD MMM YYYY, HH:mm") : "-";

const formatDateRange = (startDate, endDate) =>
  `${startDate ? moment(startDate).format("DD MMM YYYY") : "-"} s/d ${
    endDate ? moment(endDate).format("DD MMM YYYY") : "-"
  }`;

export const isTerminationApprovalActionable = (record, user) => {
  const requestStatus = String(
    record?.termination_approval_status || "",
  ).toLowerCase();
  const rowStatus = String(record?.status || "").toLowerCase();

  return (
    requestStatus === "proses" &&
    !["approved", "rejected"].includes(rowStatus) &&
    Number(record?.termination_current_step) === Number(record?.step_order) &&
    Number(record?.role_id) === Number(user?.role_id)
  );
};

const getStageMeta = (record, user) => {
  const requestStatus = String(
    record?.termination_approval_status || "",
  ).toLowerCase();
  const rowStatus = String(record?.status || "").toLowerCase();

  if (rowStatus === "approved") {
    return {
      label: "Sudah diproses",
      icon: "solar:verified-check-bold-duotone",
      color: "success",
    };
  }

  if (rowStatus === "rejected" || requestStatus === "rejected") {
    return {
      label: "Ditolak",
      icon: "solar:close-circle-bold-duotone",
      color: "error",
    };
  }

  if (requestStatus === "approved") {
    return {
      label: "Terminasi selesai",
      icon: "solar:lock-keyhole-minimalistic-bold-duotone",
      color: "success",
    };
  }

  if (isTerminationApprovalActionable(record, user)) {
    return {
      label: "Perlu keputusan Anda",
      icon: "solar:danger-triangle-bold-duotone",
      color: "error",
      attention: true,
    };
  }

  return {
    label: "Menunggu giliran",
    icon: "solar:clock-circle-bold-duotone",
    color: "warning",
  };
};

function StagePill({ record, user, theme }) {
  const stage = getStageMeta(record, user);
  const color = theme.palette[stage.color]?.main || theme.palette.warning.main;

  return (
    <Chip
      size="small"
      icon={<Icon icon={stage.icon} fontSize={14} />}
      label={stage.label}
      sx={{
        width: "fit-content",
        height: 24,
        borderRadius: 999,
        color,
        fontFamily: "Poppins",
        fontWeight: 750,
        bgcolor: alpha(color, theme.palette.mode === "dark" ? 0.16 : 0.09),
        border: `1px solid ${alpha(color, stage.attention ? 0.55 : 0.24)}`,
        boxShadow: stage.attention
          ? `0 0 0 3px ${alpha(color, theme.palette.mode === "dark" ? 0.13 : 0.08)}`
          : "none",
        "& .MuiChip-icon": { color },
      }}
    />
  );
}

/**
 * Filter pencarian dipusatkan agar page tetap fokus pada flow data dan modal.
 * Kolom yang dicari mengikuti informasi yang paling sering dipakai approver:
 * nama tenant, NIK, lokasi, ruangan, alasan, status, dan pembuat permintaan.
 */
export const filterTerminationApprovals = (data, searchText) => {
  const keyword = normalizeText(searchText);
  if (!keyword) return data;

  return data.filter((item) =>
    [
      item?.tenant_name,
      item?.tenant_nik,
      item?.tenant_phone,
      item?.location_name,
      item?.room_number,
      item?.floor,
      item?.reason,
      item?.termination_approval_status,
      item?.termination_processed_by_full_name,
    ].some((value) => normalizeText(value).includes(keyword)),
  );
};

/**
 * Statistik ringkas untuk approval terminasi berdasarkan role login.
 * "Menunggu Anda" memakai current_step agar angka prioritas tidak tercampur
 * dengan data yang belum menjadi giliran role tersebut.
 */
export const buildTerminationApprovalStats = (data, theme, user) => {
  const waitingForUser = data.filter((item) =>
    isTerminationApprovalActionable(item, user),
  ).length;
  const approved = data.filter((item) => item?.status === "approved").length;
  const rejected = data.filter(
    (item) =>
      item?.status === "rejected" ||
      item?.termination_approval_status === "rejected",
  ).length;

  return [
    {
      label: "Total Approval",
      value: data.length,
      icon: "solar:documents-bold-duotone",
      color: theme.palette.primary.main,
    },
    {
      label: "Menunggu Anda",
      value: waitingForUser,
      icon: "solar:bell-bing-bold-duotone",
      color: theme.palette.warning.main,
    },
    {
      label: "Sudah Diproses",
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
 * Definisi kolom approval terminasi dibuat modular agar mudah dirawat.
 * Semua action dikirim lewat callback dari page, sehingga file ini murni
 * mengatur presentasi table dan tidak memanggil API langsung.
 */
export const createTerminationApprovalColumns = ({
  data,
  user,
  theme,
  isMobile,
  onDetail,
  onReason,
  onProgress,
  onReject,
}) => [
  {
    title: "No",
    dataIndex: "index",
    width: 64,
    align: "center",
    render: (_text, _record, index) => index + 1,
  },
  {
    title: "Pemohon",
    dataIndex: "tenant_name",
    filters: createColumnFilters(data, "tenant_name"),
    onFilter: createExactFilter("tenant_name"),
    filterSearch: true,
    sorter: (a, b) =>
      normalizeText(a?.tenant_name).localeCompare(
        normalizeText(b?.tenant_name),
      ),
    width: 280,
    render: (_text, record) => (
      <Stack spacing={0.65} sx={{ minWidth: 0 }}>
        <Typography
          sx={{
            fontFamily: "Poppins",
            fontWeight: 750,
            fontSize: 13,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {record?.tenant_name || "-"}
        </Typography>
        <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
          <Chip
            size="small"
            label={`NIK ${record?.tenant_nik || "-"}`}
            sx={{
              height: 23,
              fontFamily: "Poppins",
              fontWeight: 750,
              color: theme.palette.primary.main,
              bgcolor: alpha(
                theme.palette.primary.main,
                theme.palette.mode === "dark" ? 0.16 : 0.09,
              ),
            }}
          />
        </Stack>
      </Stack>
    ),
  },
  {
    title: "Lokasi & Ruangan",
    dataIndex: "location_name",
    filters: createColumnFilters(data, "location_name"),
    onFilter: createExactFilter("location_name"),
    filterSearch: true,
    sorter: (a, b) =>
      normalizeText(a?.location_name).localeCompare(
        normalizeText(b?.location_name),
      ),
    width: 310,
    render: (_text, record) => (
      <Stack spacing={0.65} sx={{ minWidth: 0 }}>
        <Typography
          sx={{
            fontFamily: "Poppins",
            fontWeight: 750,
            fontSize: 13,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {record?.location_name || "-"}
        </Typography>
        <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
          <Chip
            size="small"
            label={`Ruangan ${record?.room_number || "-"}`}
            sx={{
              height: 24,
              fontFamily: "Poppins",
              fontWeight: 750,
              color: theme.palette.primary.main,
              bgcolor: alpha(
                theme.palette.primary.main,
                theme.palette.mode === "dark" ? 0.16 : 0.09,
              ),
            }}
          />
          <Chip
            size="small"
            label={record?.floor || "-"}
            sx={{
              height: 24,
              fontFamily: "Poppins",
              fontWeight: 750,
              color: theme.palette.info.main,
              bgcolor: alpha(
                theme.palette.info.main,
                theme.palette.mode === "dark" ? 0.15 : 0.08,
              ),
            }}
          />
        </Stack>
      </Stack>
    ),
  },
  {
    title: "Masa Berlaku",
    dataIndex: "start_date",
    width: 220,
    sorter: (a, b) =>
      normalizeText(a?.start_date).localeCompare(normalizeText(b?.start_date)),
    render: (_text, record) => (
      <Typography
        sx={{
          fontFamily: "Poppins",
          fontWeight: 750,
          fontSize: 12.5,
          lineHeight: 1.5,
        }}
      >
        {formatDateRange(record?.start_date, record?.end_date)}
      </Typography>
    ),
  },
  {
    title: "Status",
    dataIndex: "termination_approval_status",
    filters: [
      { text: "Dalam Proses", value: "proses" },
      { text: "Disetujui", value: "approved" },
      { text: "Ditolak", value: "rejected" },
    ],
    onFilter: createExactFilter("termination_approval_status"),
    filterSearch: true,
    width: 230,
    render: (_text, record) => {
      const isInProgress =
        String(record?.termination_approval_status || "").toLowerCase() ===
        "proses";

      return (
        <Stack spacing={0.75} alignItems="flex-start">
          <ApprovalStatusChip
            status={record?.termination_approval_status}
            step={record?.termination_current_step}
            totalStep={5}
            onClick={() => onProgress(record)}
            theme={theme}
          />
          {isInProgress ? (
            <StagePill record={record} user={user} theme={theme} />
          ) : null}
        </Stack>
      );
    },
  },
  {
    title: "Diajukan",
    dataIndex: "termination_created_at",
    width: 230,
    sorter: (a, b) =>
      normalizeText(a?.termination_created_at).localeCompare(
        normalizeText(b?.termination_created_at),
      ),
    render: (_value, record) => (
      <Box>
        <Typography
          sx={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 12.5 }}
        >
          {formatDateTime(record?.termination_created_at)}
        </Typography>
        <Typography
          sx={{
            color: theme.ui.mutedText,
            fontSize: 12,
            fontWeight: 650,
            mt: 0.25,
          }}
        >
          Oleh {record?.termination_processed_by_full_name || "-"}
        </Typography>
      </Box>
    ),
  },
  {
    title: "Aksi",
    key: "action",
    align: "center",
    width: TERMINATION_APPROVAL_ACTION_COLUMN_WIDTH,
    fixed: isMobile ? false : "right",
    className: "termination-approval-action-column",
    onHeaderCell: () => ({ className: "termination-approval-action-column" }),
    onCell: () => ({ className: "termination-approval-action-column" }),
    render: (_text, record) => {
      const canReject = isTerminationApprovalActionable(record, user);

      return (
        <Box
          className="termination-approval-action-buttons"
          sx={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 0.75,
            minWidth: 118,
            flexWrap: "nowrap",
          }}
        >
          <TableActionButton
            title="Detail data pemohon"
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
          {canReject ? (
            <TableActionButton
              title="Tolak permintaan"
              color="error"
              icon="solar:close-circle-bold-duotone"
              onClick={() => onReject(record)}
            />
          ) : null}
        </Box>
      );
    },
  },
];
