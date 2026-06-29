"use client";

import React from "react";
import { Box, Button, Stack, Typography } from "@mui/material";
import moment from "moment";
import { Icon } from "@iconify/react";
import CompactInfoChip from "@/app/components/chips/CompactInfoChip";
import formatRupiah from "@/app/components/formatrupiah/page";
import { formatNumber } from "@/app/utils/formatNumber";

export const ROOM_AVAILABILITY_PAGE_SIZE_OPTIONS = [10, 20, 50, 100];
export const ROOM_AVAILABILITY_SCROLL_WIDTH = 1640;

export const STATUS_META = {
  available: {
    label: "Tersedia",
    icon: "solar:check-circle-bold-duotone",
    palette: "success",
  },
  occupied: {
    label: "Terisi",
    icon: "solar:key-minimalistic-square-bold-duotone",
    palette: "warning",
  },
  maintenance: {
    label: "Maintenance",
    icon: "solar:settings-bold-duotone",
    palette: "info",
  },
  unavailable: {
    label: "Tidak Layak",
    icon: "solar:danger-triangle-bold-duotone",
    palette: "error",
  },
};

export const PRICE_TYPE_LABELS = {
  harga_per_meter: "Harga per m²",
  harga_tetap: "Harga Tetap",
};

export const ROOM_AVAILABILITY_EXPORT_COLUMNS = [
  { header: "Lokasi", key: "location_name", width: 26, pdfWidth: 34 },
  { header: "Ruangan", key: "room_number", width: 18, pdfWidth: 24 },
  { header: "Lantai", key: "room_floor", width: 16, pdfWidth: 22 },
  { header: "Status", key: "status_label", width: 18, pdfWidth: 24 },
  { header: "Dipakai Oleh", key: "used_by", width: 28, pdfWidth: 32 },
  { header: "No. Dokumen/Kontrak", key: "usage_number", width: 26, pdfWidth: 28 },
  { header: "Masa Berlaku", key: "usage_period", width: 24, pdfWidth: 28 },
  { header: "Panjang", key: "room_length", width: 14, pdfWidth: 18 },
  { header: "Lebar", key: "room_width", width: 14, pdfWidth: 18 },
  { header: "Luas", key: "room_area", width: 14, pdfWidth: 18 },
  {
    header: "Harga per m2",
    key: "price_per_m2",
    width: 18,
    type: "currency",
    pdfWidth: 28,
  },
  { header: "Tipe Harga", key: "price_type_label", width: 18, pdfWidth: 24 },
  { header: "Catatan", key: "notes", width: 20, pdfWidth: 18 },
  { header: "Terakhir Diperbarui", key: "updated_at", width: 24, pdfWidth: 30 },
];

const normalizeText = (value) => String(value || "").toLowerCase();

export const getStatusLabel = (status) => STATUS_META[status]?.label || "-";

export const getPriceTypeLabel = (priceType) =>
  PRICE_TYPE_LABELS[priceType] || priceType || "-";

export const filterRoomAvailabilityRows = (rows = [], searchText = "") => {
  const keyword = normalizeText(searchText);
  if (!keyword) return rows;

  return rows.filter((row) =>
    [
      row.location_name,
      row.location_code,
      row.room_number,
      row.room_floor,
      row.status,
      getStatusLabel(row.status),
      row.price_type,
      getPriceTypeLabel(row.price_type),
      row.notes,
      row.used_by,
      row.used_document_number,
      row.used_contract_number,
      row.used_start_date,
      row.used_end_date,
      row.room_length,
      row.room_width,
      row.room_area,
      row.price_per_m2,
    ].some((value) => normalizeText(value).includes(keyword)),
  );
};

const formatUsagePeriod = (startDate, endDate) => {
  if (!startDate && !endDate) return "-";
  if (!startDate) return `s/d ${moment(endDate).format("DD MMM YYYY")}`;
  if (!endDate) return `Mulai ${moment(startDate).format("DD MMM YYYY")}`;
  return `${moment(startDate).format("DD MMM YYYY")} s/d ${moment(endDate).format("DD MMM YYYY")}`;
};

export const buildRoomAvailabilityExportRows = (rows = []) =>
  rows.map((row) => ({
    location_name: row.location_name || "-",
    room_number: row.room_number ? `Ruangan ${row.room_number}` : "-",
    room_floor: row.room_floor || "-",
    status_label: getStatusLabel(row.status),
    used_by: row.used_by || "-",
    usage_number: row.used_by ? getUsageNumberLabel(row) : "-",
    usage_period: formatUsagePeriod(row.used_start_date, row.used_end_date),
    room_length: formatNumber(row.room_length),
    room_width: formatNumber(row.room_width),
    room_area: `${formatNumber(row.room_area)} m²`,
    price_per_m2: Number(row.price_per_m2 || 0),
    price_type_label: getPriceTypeLabel(row.price_type),
    notes: row.notes || "-",
    updated_at: row.updated_at
      ? moment(row.updated_at).format("DD MMMM YYYY HH:mm")
      : "-",
  }));

const compareText = (a, b) => String(a || "").localeCompare(String(b || ""));

const formatDateTime = (value) =>
  value ? moment(value).format("DD MMM YYYY, HH:mm") : "-";

function getUsageNumberLabel(record) {
  if (record.used_contract_number) {
    return `No. Kontrak: ${record.used_contract_number}`;
  }

  if (record.used_document_number) {
    return `No. Dokumen: ${record.used_document_number}`;
  }

  return "Kontrak aktif";
}

const compactChipSx = {
  width: "fit-content",
  maxWidth: "100%",
  alignSelf: "flex-start",
  "& .MuiChip-label": {
    fontSize: 11,
    fontWeight: 600,
  },
};

export const createRoomAvailabilityReportColumns = ({ theme, onOpenNotes }) => [
  {
    title: "No",
    width: 72,
    align: "center",
  },
  {
    title: "Lokasi & Ruangan",
    dataIndex: "location_name",
    width: 300,
    sorter: (a, b) =>
      compareText(
        `${a.location_name || ""} ${a.room_number || ""}`,
        `${b.location_name || ""} ${b.room_number || ""}`,
      ),
    render: (_, record) => (
      <Stack spacing={0.65} sx={{ minWidth: 0 }}>
        <Typography sx={{ fontWeight: 700, fontSize: 13 }} noWrap>
          {record.location_name || "-"}
        </Typography>
        <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap">
          <CompactInfoChip
            label={`Ruangan ${record.room_number || "-"}`}
            color={theme.palette.primary.main}
          />
          <CompactInfoChip
            label={record.room_floor || "Tanpa Lantai"}
            color={theme.palette.info.main}
          />
        </Stack>
      </Stack>
    ),
  },
  {
    title: "Ukuran Ruangan",
    dataIndex: "room_area",
    width: 210,
    sorter: (a, b) => Number(a.room_area || 0) - Number(b.room_area || 0),
    render: (_, record) => (
      <Stack spacing={0.35}>
        <Typography sx={{ fontWeight: 700, fontSize: 12.5 }}>
          {formatNumber(record.room_length)} m x{" "}
          {formatNumber(record.room_width)} m
        </Typography>
        <Typography sx={{ color: theme.ui.mutedText, fontWeight: 600, fontSize: 11.5 }}>
          Luas {formatNumber(record.room_area)} m²
        </Typography>
      </Stack>
    ),
  },
  {
    title: "Harga",
    dataIndex: "price_per_m2",
    width: 210,
    align: "right",
    sorter: (a, b) => Number(a.price_per_m2 || 0) - Number(b.price_per_m2 || 0),
    render: (_, record) => (
      <Stack spacing={0.35} alignItems="flex-end">
        <Typography sx={{ fontWeight: 700, fontSize: 12.5 }}>
          {formatRupiah(record.price_per_m2)}
        </Typography>
        <Typography sx={{ color: theme.ui.mutedText, fontWeight: 600, fontSize: 11.5 }}>
          {getPriceTypeLabel(record.price_type)}
        </Typography>
      </Stack>
    ),
  },
  {
    title: "Status",
    dataIndex: "status",
    width: 180,
    filters: Object.entries(STATUS_META).map(([value, meta]) => ({
      text: meta.label,
      value,
    })),
    onFilter: (value, record) => record.status === value,
    render: (value) => {
      const meta = STATUS_META[value];
      const color = theme.palette[meta?.palette || "primary"].main;
      return (
        <CompactInfoChip
          label={meta?.label || "-"}
          color={color}
          sx={{
            "& .MuiChip-label": {
              fontSize: 12,
              fontWeight: 600,
            },
          }}
        />
      );
    },
  },
  {
    title: "Dipakai Oleh",
    dataIndex: "used_by",
    width: 270,
    sorter: (a, b) => compareText(a.used_by, b.used_by),
    render: (_, record) => (
      <Stack spacing={0.35}>
        <Typography
          sx={{
            color: record.used_by ? "text.primary" : theme.ui.mutedText,
            fontWeight: 700,
            fontSize: 12.5,
          }}
        >
          {record.used_by || "Belum terpakai"}
        </Typography>
        {record.used_by && (
          <CompactInfoChip
            label={getUsageNumberLabel(record)}
            color={theme.palette.primary.main}
            sx={compactChipSx}
            />
        )}
      </Stack>
    ),
  },
  {
    title: "Masa Berlaku",
    dataIndex: "used_start_date",
    width: 190,
    sorter: (a, b) =>
      moment(a.used_start_date || 0).valueOf() -
      moment(b.used_start_date || 0).valueOf(),
    render: (_, record) => (
      <Stack spacing={0.3}>
        <Typography
          sx={{
            color: record.used_by ? "text.primary" : theme.ui.mutedText,
            fontWeight: 700,
            fontSize: 12.2,
          }}
        >
          {formatUsagePeriod(record.used_start_date, record.used_end_date)}
        </Typography>
        {record.used_by && (
          <Typography
            sx={{ color: theme.ui.mutedText, fontWeight: 600, fontSize: 11 }}
          >
            Kontrak aktif
          </Typography>
        )}
      </Stack>
    ),
  },
  {
    title: "Catatan",
    dataIndex: "notes",
    width: 150,
    render: (_, record) => {
      const hasNotes = Boolean(String(record.notes || "").trim());

      return (
        <Button
          size="small"
          variant={hasNotes ? "outlined" : "contained"}
          color={hasNotes ? "warning" : "inherit"}
          disabled={!hasNotes}
          onClick={() => onOpenNotes?.(record)}
          startIcon={<Icon icon="solar:notes-bold-duotone" />}
          sx={{
            borderRadius: 2,
            fontWeight: 800,
            textTransform: "none",
            whiteSpace: "nowrap",
            ...(hasNotes
              ? {}
              : {
                  color: theme.ui.mutedText,
                  bgcolor:
                    theme.palette.mode === "dark"
                      ? "rgba(255,255,255,0.08)"
                      : "rgba(17,24,39,0.06)",
                  boxShadow: "none",
                  "&.Mui-disabled": {
                    color: theme.ui.mutedText,
                    bgcolor:
                      theme.palette.mode === "dark"
                        ? "rgba(255,255,255,0.08)"
                        : "rgba(17,24,39,0.06)",
                  },
                }),
          }}
        >
          Lihat
        </Button>
      );
    },
  },
  {
    title: "Diperbarui",
    dataIndex: "updated_at",
    width: 180,
    sorter: (a, b) =>
      moment(a.updated_at || 0).valueOf() - moment(b.updated_at || 0).valueOf(),
    render: (value) => (
      <Box>
        <Typography sx={{ fontWeight: 650, fontSize: 12 }}>
          {formatDateTime(value)}
        </Typography>
      </Box>
    ),
  },
];
