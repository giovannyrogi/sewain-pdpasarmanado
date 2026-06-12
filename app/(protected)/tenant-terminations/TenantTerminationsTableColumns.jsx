"use client";

import React from "react";
import { Box, Chip, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import ApprovalStatusChip from "@/app/components/status/ApprovalStatusChip";
import TableActionButton from "@/app/components/data-table/TableActionButton";

const normalizeText = (value) => String(value || "").toLowerCase();

const createColumnFilters = (data, key) =>
  [...new Set(data.map((item) => item?.[key]).filter(Boolean))].map((value) => ({
    text: value,
    value,
  }));

const createExactFilter = (key) => (value, record) => record?.[key] === value;

/**
 * Definisi kolom termination dipisahkan dari page agar page fokus ke state,
 * request API, dan modal. Kolom ini tetap presentasional dan semua aksi bisnis
 * dikirim dari parent melalui handler.
 */
export function createTenantTerminationColumns({
  data,
  theme,
  onViewIdentity,
  onViewDetail,
  onViewProgress,
  onCancel,
}) {
  return [
    {
      title: "No",
      dataIndex: "index",
      render: (_text, _record, index) => index + 1,
      width: 72,
      align: "center",
    },
    {
      title: "Pemohon",
      dataIndex: "tenant_name",
      filters: createColumnFilters(data, "tenant_name"),
      onFilter: createExactFilter("tenant_name"),
      filterSearch: true,
      sorter: (a, b) => normalizeText(a.tenant_name).localeCompare(normalizeText(b.tenant_name)),
      width: 260,
      render: (_text, record) => (
        <Box sx={{ minWidth: 0 }}>
          <Typography
            onClick={() => onViewIdentity(record)}
            sx={{
              width: "fit-content",
              maxWidth: "100%",
              color: "text.primary",
              fontFamily: "Poppins",
              fontWeight: 600,
              fontSize: 13,
              textTransform: "capitalize",
              cursor: "pointer",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              "&:hover": {
                color: theme.palette.primary.main,
                textDecoration: "underline",
              },
            }}
          >
            {record.tenant_name || "-"}
          </Typography>
          <Typography
            sx={{
              color: theme.ui.mutedText,
              fontFamily: "Poppins",
              fontWeight: 600,
              fontSize: 12,
              mt: 0.25,
            }}
          >
            NIK {record.tenant_nik || "-"}
          </Typography>
        </Box>
      ),
    },
    {
      title: "Lokasi & Ruangan",
      dataIndex: "location_name",
      filters: createColumnFilters(data, "location_name"),
      onFilter: createExactFilter("location_name"),
      filterSearch: true,
      sorter: (a, b) => normalizeText(a.location_name).localeCompare(normalizeText(b.location_name)),
      width: 270,
      render: (_text, record) => (
        <Stack spacing={0.75} sx={{ minWidth: 0 }}>
          <Typography
            sx={{
              fontFamily: "Poppins",
              fontWeight: 600,
              fontSize: 13,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {record.location_name || "-"}
          </Typography>
          <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
            <Chip
              size="small"
              label={`Ruangan ${record.room_number || "-"}`}
              sx={{
                height: 24,
                fontFamily: "Poppins",
                fontWeight: 600,
                color: theme.palette.primary.main,
                bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.16 : 0.09),
              }}
            />
            <Chip
              size="small"
              label={record.floor || "-"}
              sx={{
                height: 24,
                fontFamily: "Poppins",
                fontWeight: 600,
                color: theme.palette.info.main,
                bgcolor: alpha(theme.palette.info.main, theme.palette.mode === "dark" ? 0.15 : 0.08),
              }}
            />
          </Stack>
        </Stack>
      ),
    },
    {
      title: "Kontrak",
      dataIndex: "start_date",
      width: 250,
      render: (_text, record) => (
        <Box>
          <Typography sx={{ fontFamily: "Poppins", fontWeight: 600, fontSize: 13 }}>
            {record.start_date ? String(record.start_date).slice(0, 10) : "-"} s/d{" "}
            {record.end_date ? String(record.end_date).slice(0, 10) : "-"}
          </Typography>
          <Typography
            sx={{
              color: theme.ui.mutedText,
              fontFamily: "Poppins",
              fontWeight: 600,
              fontSize: 12,
              mt: 0.25,
            }}
          >
            Diproses oleh {record.termination_processed_by_full_name || "-"}
          </Typography>
        </Box>
      ),
    },
    {
      title: "Status",
      dataIndex: "termination_approval_status",
      filters: [
        { text: "Dalam Proses", value: "proses" },
        { text: "Disetujui", value: "approved" },
        { text: "Ditolak", value: "rejected" },
        { text: "Dibatalkan", value: "cancelled" },
      ],
      onFilter: createExactFilter("termination_approval_status"),
      width: 170,
      render: (_text, record) => (
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
      title: "Dibuat",
      dataIndex: "termination_created_at",
      width: 170,
      render: (value) => (
        <Typography sx={{ fontFamily: "Poppins", fontWeight: 750, fontSize: 12.5 }}>
          {value || "-"}
        </Typography>
      ),
    },
    {
      title: "Aksi",
      key: "action",
      align: "center",
      width: 150,
      fixed: "right",
      className: "tenant-terminations-action-column",
      render: (_text, record) => (
        <Stack
          className="tenant-terminations-action-buttons"
          direction="row"
          alignItems="center"
          justifyContent="center"
          spacing={0.8}
          sx={{ width: "max-content" }}
        >
          <TableActionButton
            title="Detail data pemohon"
            color="info"
            icon="mdi:smart-card-outline"
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
              icon="line-md:close-circle"
              onClick={() => onCancel(record)}
            />
          )}
        </Stack>
      ),
    },
  ];
}
