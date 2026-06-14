"use client";

import React from "react";
import { Box, Chip, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { Icon } from "@iconify/react";
import moment from "moment";
import TableActionButton from "@/app/components/data-table/TableActionButton";

const statusConfig = {
  completed: {
    label: "Selesai",
    color: "success",
    palette: "success",
    icon: "solar:check-circle-bold-duotone",
  },
  running: {
    label: "Berjalan",
    color: "warning",
    palette: "warning",
    icon: "solar:refresh-circle-bold-duotone",
  },
  skipped: {
    label: "Dilewati",
    color: "warning",
    palette: "warning",
    icon: "solar:pause-circle-bold-duotone",
  },
  failed: {
    label: "Gagal",
    color: "error",
    palette: "error",
    icon: "solar:close-circle-bold-duotone",
  },
};

const sourceConfig = {
  cron: {
    label: "Cron VPS",
    caption: "Otomatis",
    icon: "solar:server-square-cloud-bold-duotone",
  },
  manual: {
    label: "Manual",
    caption: "Superadmin",
    icon: "solar:user-check-rounded-bold-duotone",
  },
};

const metricConfig = {
  checked: {
    label: "Dicek",
    icon: "solar:clipboard-check-bold-duotone",
    palette: "info",
  },
  released: {
    label: "Tersedia",
    icon: "solar:check-circle-bold-duotone",
    palette: "success",
  },
  skipped: {
    label: "Dilewati",
    icon: "solar:pause-circle-bold-duotone",
    palette: "warning",
  },
};

export const formatSyncDateTime = (value) =>
  value ? moment(value).format("DD MMM YYYY, HH:mm") : "-";

export const getRunStatusLabel = (status) =>
  statusConfig[status]?.label || status || "-";

export const getRunSourceLabel = (source) =>
  sourceConfig[source]?.label || source || "-";

const getRunNumber = (value) => Number(value || 0);

const getPaletteColor = (theme, palette) =>
  theme.palette[palette]?.main || theme.palette.primary.main;

/**
 * Pill audit dibuat custom agar label status dan sumber sync tetap jelas
 * pada dark/light theme, tidak terlalu kecil seperti chip default.
 */
const AuditPill = ({ icon, label, caption, palette = "primary", sx }) => (
  <Box
    sx={(theme) => {
      const color = getPaletteColor(theme, palette);
      return {
        display: "inline-flex",
        alignItems: "center",
        gap: 0.85,
        minHeight: 34,
        px: 1,
        py: 0.55,
        borderRadius: 1.75,
        border: `1px solid ${alpha(color, theme.palette.mode === "dark" ? 0.42 : 0.32)}`,
        bgcolor: alpha(color, theme.palette.mode === "dark" ? 0.18 : 0.11),
        color,
        ...sx,
      };
    }}
  >
    <Box
      sx={(theme) => {
        const color = getPaletteColor(theme, palette);
        return {
          width: 24,
          height: 24,
          borderRadius: 1.2,
          display: "grid",
          placeItems: "center",
          flexShrink: 0,
          color,
          bgcolor: alpha(color, theme.palette.mode === "dark" ? 0.18 : 0.14),
        };
      }}
    >
      <Icon icon={icon} fontSize={16} />
    </Box>
    <Stack spacing={0} sx={{ minWidth: 0 }}>
      <Typography
        sx={{
          fontFamily: "Poppins",
          fontSize: 12.5,
          fontWeight: 700,
          lineHeight: 1.15,
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </Typography>
      {caption && (
        <Typography
          sx={(theme) => ({
            fontFamily: "Poppins",
            fontSize: 10.5,
            fontWeight: 600,
            lineHeight: 1.15,
            color: theme.ui.mutedText,
            whiteSpace: "nowrap",
          })}
        >
          {caption}
        </Typography>
      )}
    </Stack>
  </Box>
);

const StatusChip = ({ status }) => {
  const config = statusConfig[status] || statusConfig.skipped;

  return (
    <AuditPill
      icon={config.icon}
      label={config.label}
      palette={config.palette}
    />
  );
};

const SourceChip = ({ source }) => {
  const config = sourceConfig[source] || sourceConfig.manual;

  return (
    <AuditPill
      icon={config.icon}
      label={config.label}
      caption={config.caption}
      palette="primary"
    />
  );
};

const ItemActionChip = ({ action }) => {
  if (action === "released") {
    return (
      <AuditPill
        icon="solar:home-smile-bold-duotone"
        label="Tersedia"
        caption="Status diperbarui"
        palette="success"
        sx={{ minWidth: 166 }}
      />
    );
  }

  return (
    <AuditPill
      icon="solar:pause-circle-bold-duotone"
      label="Dilewati"
      caption="Tidak diubah"
      palette="warning"
      sx={{ minWidth: 146 }}
    />
  );
};

const SyncInfo = ({ record }) => {
  const released = getRunNumber(record.total_released);

  if (record.status === "failed") {
    return (
      <AuditPill
        icon="solar:danger-triangle-bold-duotone"
        label="Sync gagal"
        caption="Periksa catatan error"
        palette="error"
      />
    );
  }

  if (released > 0) {
    return (
      <AuditPill
        icon="solar:home-smile-bold-duotone"
        label={`${released} ruangan tersedia kembali`}
        caption="Status ruangan diperbarui"
        palette="success"
      />
    );
  }

  return (
    <AuditPill
      icon="solar:info-circle-bold-duotone"
      label="Tidak ada ruangan diperbarui"
      caption="Semua data sudah sesuai"
      palette="info"
    />
  );
};

export const createRoomSyncLogColumns = ({ onViewDetail, onDelete }) => [
  {
    title: "No",
    dataIndex: "index",
    width: 72,
    align: "center",
    fixed: "left",
  },
  {
    title: "Waktu Sinkron",
    dataIndex: "started_at",
    width: 230,
    sorter: (a, b) => new Date(a.started_at) - new Date(b.started_at),
    render: (_, record) => (
      <Stack spacing={0.4}>
        <Typography
          sx={{ fontWeight: 700, fontFamily: "Poppins", fontSize: 12 }}
        >
          {formatSyncDateTime(record.started_at)}
        </Typography>
        <Typography
          sx={{ fontSize: 12, color: "text.secondary", fontWeight: 600 }}
        >
          Selesai: {formatSyncDateTime(record.finished_at)}
        </Typography>
      </Stack>
    ),
  },
  {
    title: "Sumber & Status",
    dataIndex: "trigger_source",
    width: 290,
    render: (_, record) => (
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        <SourceChip source={record.trigger_source} />
        <StatusChip status={record.status} />
      </Stack>
    ),
  },
  {
    title: "Informasi Sync",
    dataIndex: "total_released",
    width: 320,
    render: (_, record) => <SyncInfo record={record} />,
  },
  {
    title: "Eksekutor",
    dataIndex: "executed_by_name",
    width: 190,
    render: (_, record) => (
      <Typography sx={{ fontWeight: 700, fontFamily: "Poppins", fontSize: 12 }}>
        {record.trigger_source === "cron"
          ? "Sistem Cron"
          : record.executed_by_name || "-"}
      </Typography>
    ),
  },
  {
    title: "Catatan",
    dataIndex: "error_message",
    width: 260,
    ellipsis: true,
    render: (value) => (
      <Typography
        sx={{
          color: value ? "error.main" : "text.secondary",
          fontWeight: 600,
          fontSize: 12,
        }}
      >
        {value || "Tidak ada error"}
      </Typography>
    ),
  },
  {
    title: "Aksi",
    dataIndex: "actions",
    width: 300,
    fixed: "right",
    align: "center",
    className: "room-sync-actions-cell",
    render: (_, record) => (
      <Box
        className="room-sync-actions"
        sx={{ display: "flex", justifyContent: "center", gap: 0.75 }}
      >
        <TableActionButton
          title="Lihat detail sinkronisasi"
          icon="solar:document-text-bold-duotone"
          color="primary"
          onClick={() => onViewDetail(record)}
        />
        <TableActionButton
          title={
            record.status === "running"
              ? "Log berjalan belum dapat dihapus"
              : "Hapus log sinkronisasi"
          }
          icon="solar:trash-bin-trash-bold-duotone"
          color="error"
          disabled={record.status === "running"}
          onClick={() => onDelete(record)}
        />
      </Box>
    ),
  },
];

export const createRoomSyncItemColumns = () => [
  {
    title: "Aksi",
    dataIndex: "action",
    width: 210,
    render: (value) => <ItemActionChip action={value} />,
  },
  {
    title: "Penyewa",
    dataIndex: "tenant_name",
    width: 220,
    render: (value, record) => (
      <Stack spacing={0.4}>
        <Typography
          sx={{ fontWeight: 700, fontFamily: "Poppins", fontSize: 12 }}
        >
          {value || "-"}
        </Typography>
        <Typography
          sx={{ fontSize: 12, color: "text.secondary", fontWeight: 600 }}
        >
          Dokumen {record.document_number || "-"}
        </Typography>
      </Stack>
    ),
  },
  {
    title: "Lokasi & Ruangan",
    dataIndex: "location_name",
    width: 220,
    render: (value, record) => (
      <Stack spacing={0.4}>
        <Typography
          sx={{ fontWeight: 700, fontFamily: "Poppins", fontSize: 12 }}
        >
          {value || "-"}
        </Typography>
        <Typography
          sx={{ fontSize: 12, color: "text.secondary", fontWeight: 600 }}
        >
          Ruangan {record.room_number || "-"}
        </Typography>
      </Stack>
    ),
  },
  {
    title: "Kontrak",
    dataIndex: "contract_number",
    width: 220,
    render: (value) => (
      <Chip
        size="small"
        label={value || "Kontrak belum dibuat"}
        sx={(theme) => ({
          fontFamily: "Poppins",
          fontWeight: 700,
          fontSize: 12,
          color: value
            ? theme.palette.primary.main
            : theme.palette.text.secondary,
          bgcolor: value
            ? alpha(theme.palette.primary.main, 0.14)
            : alpha(theme.palette.text.primary, 0.08),
        })}
      />
    ),
  },
  {
    title: "Masa Berlaku",
    dataIndex: "lease_end_date",
    width: 230,
    render: (_, record) => (
      <Typography sx={{ fontWeight: 700, fontFamily: "Poppins", fontSize: 12 }}>
        {record.lease_start_date
          ? moment(record.lease_start_date).format("DD MMM YYYY")
          : "-"}{" "}
        s/d{" "}
        {record.lease_end_date
          ? moment(record.lease_end_date).format("DD MMM YYYY")
          : "-"}
      </Typography>
    ),
  },
  {
    title: "Status",
    dataIndex: "previous_status",
    width: 180,
    render: (_, record) => (
      <Typography sx={{ fontWeight: 700, fontFamily: "Poppins", fontSize: 12 }}>
        {record.previous_status || "-"} → {record.new_status || "-"}
      </Typography>
    ),
  },
  {
    title: "Alasan",
    dataIndex: "reason",
    width: 360,
    render: (value) => (
      <Typography
        sx={{
          color: "text.secondary",
          fontWeight: 600,
          lineHeight: 1.6,
          fontSize: 12,
        }}
      >
        {value || "-"}
      </Typography>
    ),
  },
];
