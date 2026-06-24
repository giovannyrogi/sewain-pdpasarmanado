"use client";

import React from "react";
import { Box, Chip, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { Icon } from "@iconify/react";
import moment from "moment";
import ApprovalStatusChip from "@/app/components/status/ApprovalStatusChip";
import TableActionButton from "@/app/components/data-table/TableActionButton";
import CompactInfoChip from "@/app/components/chips/CompactInfoChip";

export const TENANT_APPROVAL_PAGE_SIZE_OPTIONS = [5, 10, 20, 50];
export const TENANT_APPROVAL_TABLE_SCROLL_WIDTH = 1240;
export const TENANT_APPROVAL_ACTION_COLUMN_WIDTH = 136;

const normalizeText = (value) => String(value || "").toLowerCase();

const getDocumentNumberOnly = (documentNumber) =>
  String(documentNumber || "-").split("/")[0].trim();

const createColumnFilters = (data, key) =>
  [...new Set(data.map((item) => item?.[key]).filter(Boolean))].map((value) => ({
    text: value,
    value,
  }));

const createExactFilter = (key) => (value, record) => record?.[key] === value;

export const isApprovalWaitingForUser = (record, user) =>
  String(record?.approval_status || "").toLowerCase() === "proses" &&
  String(record?.status || "").toLowerCase() !== "approved" &&
  String(record?.status || "").toLowerCase() !== "rejected" &&
  Number(record?.current_step) === Number(user?.step_order) &&
  Number(record?.role_id) === Number(user?.role_id);

const getRowStage = (record, user) => {
  const approvalStatus = String(record?.approval_status || "").toLowerCase();
  const rowStatus = String(record?.status || "").toLowerCase();

  if (rowStatus === "approved") {
    return {
      label: "Sudah diproses",
      icon: "solar:verified-check-bold-duotone",
      color: "success",
    };
  }

  if (rowStatus === "rejected" || approvalStatus === "rejected") {
    return {
      label: "Ditolak",
      icon: "solar:close-circle-bold-duotone",
      color: "error",
    };
  }

  if (isApprovalWaitingForUser(record, user)) {
    return {
      label: "Perlu approval Anda",
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
  const stage = getRowStage(record, user);
  const color = theme.palette[stage.color]?.main || theme.palette.warning.main;
  const attentionColor = theme.palette.error.main;
  const attentionBg =
    theme.palette.mode === "dark"
      ? `linear-gradient(135deg, ${alpha(attentionColor, 0.26)}, ${alpha(attentionColor, 0.13)})`
      : `linear-gradient(135deg, ${alpha(attentionColor, 0.16)}, ${alpha(attentionColor, 0.08)})`;

  return (
    <Chip
      size="small"
      icon={<Icon icon={stage.icon} fontSize={14} />}
      label={stage.label}
      sx={{
        width: "fit-content",
        height: 23,
        borderRadius: 999,
        color,
        fontFamily: "Poppins",
        fontWeight: 700,
        bgcolor: stage.attention
          ? "transparent"
          : alpha(color, theme.palette.mode === "dark" ? 0.16 : 0.1),
        background: stage.attention ? attentionBg : undefined,
        border: `1px solid ${alpha(
          stage.attention ? attentionColor : color,
          stage.attention ? 0.75 : 0.25,
        )}`,
        boxShadow: stage.attention
          ? `0 0 0 3px ${alpha(attentionColor, theme.palette.mode === "dark" ? 0.12 : 0.08)}`
          : "none",
        "& .MuiChip-icon": {
          color: stage.attention ? attentionColor : color,
        },
      }}
    />
  );
}

/**
 * Summary khusus role approval. Angka "Menunggu Anda" dihitung dari step aktif
 * user supaya halaman langsung memberi prioritas kerja tanpa membuka tabel.
 */
export const buildTenantApprovalStats = (data, theme, user) => {
  const waitingForUser = data.filter(
    (item) =>
      item?.approval_status === "proses" &&
      String(item?.status || "").toLowerCase() !== "approved" &&
      String(item?.status || "").toLowerCase() !== "rejected" &&
      Number(item?.current_step) === Number(user?.step_order),
  ).length;
  const approved = data.filter((item) => item?.status === "approved").length;
  const rejected = data.filter(
    (item) => item?.status === "rejected" || item?.approval_status === "rejected",
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

export const filterTenantApprovals = (data, searchText) => {
  const keyword = normalizeText(searchText);
  if (!keyword) return data;

  return data.filter((item) =>
    [
      item?.tenant_name,
      item?.tenant_nik,
      item?.document_number,
      item?.location_name,
      item?.room_number,
      item?.floor,
      item?.approval_status,
      item?.role_name,
    ].some((value) => normalizeText(value).includes(keyword)),
  );
};

/**
 * Definisi kolom dipisahkan dari page agar halaman fokus pada state dan flow
 * approve/reject. Semua styling fixed action column ikut ReusableAntTable.
 */
export const createTenantApprovalColumns = ({
  data,
  user,
  theme,
  isMobile,
  onDetail,
  onProgress,
  onReject,
}) => {
  const approvalStatusFilters = [
    { text: "Dalam Proses", value: "proses" },
    { text: "Disetujui", value: "approved" },
    { text: "Ditolak", value: "rejected" },
  ];

  return [
    {
      title: "No",
      dataIndex: "index",
      render: (_text, _record, index) => index + 1,
      width: 64,
      align: "center",
    },
    {
      title: "Pemohon & Dokumen",
      dataIndex: "tenant_name",
      filters: createColumnFilters(data, "tenant_name"),
      onFilter: createExactFilter("tenant_name"),
      filterSearch: true,
      sorter: (a, b) => normalizeText(a?.tenant_name).localeCompare(normalizeText(b?.tenant_name)),
      width: 330,
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
            {record?.tenant_name || "-"}
          </Typography>
          <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap alignItems="center">
            <CompactInfoChip
              label={`Dokumen ${getDocumentNumberOnly(record?.document_number)}`}
            />
            <Typography sx={{ color: theme.ui.mutedText, fontSize: 12, fontWeight: 600 }}>
              NIK {record?.tenant_nik || "-"}
            </Typography>
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
      sorter: (a, b) => normalizeText(a?.location_name).localeCompare(normalizeText(b?.location_name)),
      width: 310,
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
            {record?.location_name || "-"}
          </Typography>
          <Typography sx={{ color: theme.ui.mutedText, fontSize: 12, fontWeight: 600 }}>
            Ruangan {record?.room_number || "-"} | {record?.floor || "-"}
          </Typography>
        </Stack>
      ),
    },
    {
      title: "Status Persetujuan",
      dataIndex: "approval_status",
      filters: approvalStatusFilters,
      onFilter: createExactFilter("approval_status"),
      filterSearch: true,
      width: 250,
      render: (_text, record) => (
        <Stack spacing={0.75} alignItems="flex-start">
          <ApprovalStatusChip
            status={record?.approval_status}
            step={record?.current_step}
            totalStep={5}
            onClick={() => onProgress(record)}
            theme={theme}
          />
          {isApprovalWaitingForUser(record, user) && (
            <StagePill record={record} user={user} theme={theme} />
          )}
        </Stack>
      ),
    },
    {
      title: "Diajukan",
      dataIndex: "created_at",
      sorter: (a, b) => normalizeText(a?.created_at).localeCompare(normalizeText(b?.created_at)),
      sortDirections: ["ascend", "descend"],
      width: 190,
      render: (_text, record) => (
        <Typography sx={{ fontFamily: "Poppins", fontWeight: 600, fontSize: 12.5 }}>
          {record?.created_at ? moment(record.created_at).format("DD MMM YYYY, HH:mm") : "-"}
        </Typography>
      ),
    },
    {
      title: "Aksi",
      key: "action",
      align: "center",
      width: TENANT_APPROVAL_ACTION_COLUMN_WIDTH,
      fixed: isMobile ? false : "right",
      className: "tenant-approval-action-column",
      onHeaderCell: () => ({ className: "tenant-approval-action-column" }),
      onCell: () => ({ className: "tenant-approval-action-column" }),
      render: (_text, record) => {
        const approvalStatus = String(record?.approval_status || "").toLowerCase();
        const rowStatus = String(record?.status || "").toLowerCase();

        /**
         * Tombol tolak hanya boleh tampil saat benar-benar giliran role login.
         * Jika role ini sudah approve/reject atau step sudah berpindah, tombol
         * disembunyikan agar user tidak mengira masih bisa memproses data lama.
         */
        const canReject =
          approvalStatus === "proses" &&
          rowStatus !== "approved" &&
          rowStatus !== "rejected" &&
          isApprovalWaitingForUser(record, user);

        return (
          <Box
            className="tenant-approval-action-buttons"
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
              title="Detail data pemohon"
              color="info"
              icon="solar:eye-bold-duotone"
              onClick={() => onDetail(record)}
            />
            {canReject ? (
              <TableActionButton
                title="Tolak permohonan"
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
};
