"use client";

import React from "react";
import { Box, Chip, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import moment from "moment";
import ApprovalStatusChip from "@/app/components/status/ApprovalStatusChip";
import TableActionButton from "@/app/components/data-table/TableActionButton";

export const LAND_TERMINATION_PAGE_SIZE_OPTIONS = [5, 10, 20, 50];
export const LAND_TERMINATION_TABLE_SCROLL_WIDTH = 1480;
export const LAND_TERMINATION_ACTION_COLUMN_WIDTH = 150;

const normalize = (value) => String(value || "").toLowerCase();

const formatDate = (value) =>
  value && moment(value).isValid() ? moment(value).format("D MMM YYYY") : "-";

export function filterLandPermitTerminations(data, keyword) {
  const search = normalize(keyword);
  if (!search) return data;

  return data.filter((item) =>
    [
      item.tenant_name,
      item.tenant_nik,
      item.location_name,
      item.sector_name,
      item.stall_number,
      item.commodity_type,
      item.termination_approval_status,
      item.termination_processed_by_full_name,
    ].some((value) => normalize(value).includes(search)),
  );
}

export function buildLandPermitTerminationStats(data, theme) {
  return [
    {
      label: "Total Pengajuan",
      value: data.length,
      icon: "solar:document-text-bold-duotone",
      color: theme.palette.primary.main,
    },
    {
      label: "Dalam Proses",
      value: data.filter((item) => item.termination_approval_status === "proses")
        .length,
      icon: "solar:hourglass-line-bold-duotone",
      color: theme.palette.warning.main,
    },
    {
      label: "Disetujui",
      value: data.filter(
        (item) => item.termination_approval_status === "approved",
      ).length,
      icon: "solar:verified-check-bold-duotone",
      color: theme.palette.success.main,
    },
    {
      label: "Ditolak",
      value: data.filter(
        (item) => item.termination_approval_status === "rejected",
      ).length,
      icon: "solar:close-circle-bold-duotone",
      color: theme.palette.error.main,
    },
  ];
}

export function createLandPermitTerminationColumns({
  theme,
  isMobile,
  onViewDetail,
  onViewProgress,
  onCancel,
}) {
  return [
    {
      title: "No",
      width: 68,
      align: "center",
      render: (_value, _record, index) => index + 1,
    },
    {
      title: "Pemohon",
      width: 270,
      sorter: (a, b) => normalize(a.tenant_name).localeCompare(normalize(b.tenant_name)),
      render: (_value, record) => (
        <Stack spacing={0.45} sx={{ minWidth: 0 }}>
          <Typography sx={{ fontSize: 13, fontWeight: 700 }}>
            {record.tenant_name || "-"}
          </Typography>
          <Typography sx={{ color: theme.ui.mutedText, fontSize: 11.5, fontWeight: 650 }}>
            NIK {record.tenant_nik || "-"}
          </Typography>
        </Stack>
      ),
    },
    {
      title: "Lokasi & Lahan",
      width: 320,
      sorter: (a, b) => normalize(a.location_name).localeCompare(normalize(b.location_name)),
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
            <Chip
              size="small"
              label={`Lahan ${record.stall_number || "-"}`}
              sx={{
                height: 23,
                width: "fit-content",
                color: theme.palette.info.main,
                bgcolor: alpha(theme.palette.info.main, 0.12),
                fontWeight: 700,
              }}
            />
          </Stack>
        </Stack>
      ),
    },
    {
      title: "Jenis Dagangan",
      width: 210,
      render: (_value, record) => (
        <Chip
          size="small"
          label={record.commodity_type || "-"}
          sx={{
            height: 25,
            width: "fit-content",
            color: theme.palette.success.main,
            bgcolor: alpha(theme.palette.success.main, 0.12),
            fontWeight: 700,
          }}
        />
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
          <Typography sx={{ color: theme.ui.mutedText, fontSize: 11.5, fontWeight: 650 }}>
            {formatDate(record.start_date)} s/d {formatDate(record.end_date)}
          </Typography>
        </Stack>
      ),
    },
    {
      title: "Status",
      width: 235,
      render: (_value, record) => (
        <ApprovalStatusChip
          status={record.termination_approval_status}
          step={record.termination_current_step}
          totalStep={5}
          onClick={() => onViewProgress(record)}
          theme={theme}
        />
      ),
    },
    {
      title: "Diajukan",
      width: 230,
      render: (_value, record) => (
        <Stack spacing={0.35}>
          <Typography sx={{ fontSize: 12.5, fontWeight: 700 }}>
            {record.termination_created_at
              ? moment(record.termination_created_at).format("D MMM YYYY, HH:mm")
              : "-"}
          </Typography>
          <Typography sx={{ color: theme.ui.mutedText, fontSize: 11.5, fontWeight: 650 }}>
            Oleh {record.termination_processed_by_full_name || "-"}
          </Typography>
        </Stack>
      ),
    },
    {
      title: "Aksi",
      key: "action",
      align: "center",
      width: LAND_TERMINATION_ACTION_COLUMN_WIDTH,
      fixed: isMobile ? false : "right",
      className: "land-terminations-action-column",
      onHeaderCell: () => ({ className: "land-terminations-action-column" }),
      onCell: () => ({ className: "land-terminations-action-column" }),
      render: (_value, record) => (
        <Box
          className="land-terminations-action-buttons"
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
            title="Detail data izin lahan"
            color="info"
            icon="solar:eye-bold-duotone"
            onClick={() => onViewDetail(record)}
          />
          <TableActionButton
            title="Progress approval"
            color="success"
            icon="solar:checklist-minimalistic-bold-duotone"
            onClick={() => onViewProgress(record)}
          />
          {record.termination_approval_status === "rejected" && (
            <TableActionButton
              title="Batalkan non-aktif"
              color="error"
              icon="solar:close-circle-bold-duotone"
              onClick={() => onCancel(record)}
            />
          )}
        </Box>
      ),
    },
  ];
}
