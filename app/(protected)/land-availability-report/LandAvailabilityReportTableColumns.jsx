"use client";

import React from "react";
import { Box, Button, Stack, Typography } from "@mui/material";
import moment from "moment";
import { Icon } from "@iconify/react";
import CompactInfoChip from "@/app/components/chips/CompactInfoChip";
import formatRupiah from "@/app/components/formatrupiah/page";
import { formatNumber } from "@/app/utils/formatNumber";

export const LAND_AVAILABILITY_PAGE_SIZE_OPTIONS = [10, 20, 50, 100];
export const LAND_AVAILABILITY_SCROLL_WIDTH = 1460;

export const STATUS_META = {
  available: {
    label: "Tersedia",
    icon: "solar:check-circle-bold-duotone",
    palette: "success",
  },
  occupied: {
    label: "Terisi",
    icon: "solar:lock-keyhole-bold-duotone",
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

export const LAND_AVAILABILITY_EXPORT_COLUMNS = [
  { header: "Lokasi", key: "location_name", width: 26, pdfWidth: 24 },
  { header: "Sektor", key: "sector_name", width: 22, pdfWidth: 22 },
  { header: "Lahan", key: "stall_number", width: 18, pdfWidth: 18 },
  { header: "Status", key: "status_label", width: 18, pdfWidth: 17 },
  { header: "Dipakai Oleh", key: "used_by", width: 28, pdfWidth: 27 },
  { header: "Nomor Dokumen", key: "document_number", width: 26, pdfWidth: 27 },
  { header: "Masa Berlaku", key: "usage_period", width: 24, pdfWidth: 24 },
  { header: "Jenis Dagangan", key: "commodity_type", width: 20, pdfWidth: 22 },
  { header: "Panjang", key: "stall_length", width: 14, pdfWidth: 12 },
  { header: "Lebar", key: "stall_width", width: 14, pdfWidth: 11 },
  { header: "Luas", key: "stall_area", width: 14, pdfWidth: 12 },
  {
    header: "Harga per m²",
    key: "price_per_m2",
    width: 18,
    type: "currency",
    pdfWidth: 22,
  },
  { header: "Catatan", key: "notes", width: 30, pdfWidth: 41 },
].map((column) => ({
  pdfFontSize: 6.4,
  pdfCellPadding: 1.2,
  ...column,
}));

const normalizeText = (value) => String(value || "").toLowerCase();

const compareText = (a, b) => String(a || "").localeCompare(String(b || ""));

export const getStatusLabel = (status) => STATUS_META[status]?.label || "-";

export const filterLandAvailabilityRows = (rows = [], searchText = "") => {
  const keyword = normalizeText(searchText);
  if (!keyword) return rows;

  return rows.filter((row) =>
    [
      row.location_name,
      row.location_code,
      row.sector_name,
      row.sector_code,
      row.stall_number,
      row.status,
      getStatusLabel(row.status),
      row.notes,
      row.used_by,
      row.used_document_number,
      row.used_start_date,
      row.used_end_date,
      row.commodity_type,
      row.stall_length,
      row.stall_width,
      row.stall_area,
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

const getDocumentNumberLabel = (record) => {
  if (record.used_document_number) {
    return `No. Dokumen: ${record.used_document_number}`;
  }

  return "Dokumen belum dibuat";
};

export const buildLandAvailabilityExportRows = (rows = []) =>
  rows.map((row) => ({
    location_name: row.location_name || "-",
    sector_name: row.sector_name || "-",
    stall_number: row.stall_number ? `Lahan ${row.stall_number}` : "-",
    status_label: getStatusLabel(row.status),
    used_by: row.used_by || "-",
    document_number: row.used_by ? getDocumentNumberLabel(row) : "-",
    usage_period: formatUsagePeriod(row.used_start_date, row.used_end_date),
    commodity_type: row.commodity_type || "-",
    stall_length: formatNumber(row.stall_length),
    stall_width: formatNumber(row.stall_width),
    stall_area: `${formatNumber(row.stall_area)} m²`,
    price_per_m2: Number(row.price_per_m2 || 0),
    notes: row.notes || "-",
  }));

const compactChipSx = {
  width: "fit-content",
  maxWidth: "100%",
  alignSelf: "flex-start",
  "& .MuiChip-label": {
    fontSize: 11,
    fontWeight: 600,
  },
};

export const createLandAvailabilityReportColumns = ({ theme, onOpenNotes }) => [
  {
    title: "No",
    width: 72,
    align: "center",
  },
  {
    title: "Lokasi, Sektor & Lahan",
    dataIndex: "location_name",
    width: 330,
    sorter: (a, b) =>
      compareText(
        `${a.location_name || ""} ${a.sector_name || ""} ${a.stall_number || ""}`,
        `${b.location_name || ""} ${b.sector_name || ""} ${b.stall_number || ""}`,
      ),
    render: (_, record) => (
      <Stack spacing={0.65} sx={{ minWidth: 0 }}>
        <Typography sx={{ fontWeight: 700, fontSize: 13 }} noWrap>
          {record.location_name || "-"}
        </Typography>
        <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap">
          <CompactInfoChip
            label={record.sector_name || "-"}
            color={theme.palette.primary.main}
          />
          <CompactInfoChip
            label={`Lahan ${record.stall_number || "-"}`}
            color={theme.palette.info.main}
          />
        </Stack>
      </Stack>
    ),
  },
  {
    title: "Ukuran Lahan",
    dataIndex: "stall_area",
    width: 210,
    sorter: (a, b) => Number(a.stall_area || 0) - Number(b.stall_area || 0),
    render: (_, record) => (
      <Stack spacing={0.35}>
        <Typography sx={{ fontWeight: 700, fontSize: 12.5 }}>
          {formatNumber(record.stall_length)} m x {formatNumber(record.stall_width)} m
        </Typography>
        <Typography sx={{ color: theme.ui.mutedText, fontWeight: 600, fontSize: 11.5 }}>
          Luas {formatNumber(record.stall_area)} m²
        </Typography>
      </Stack>
    ),
  },
  {
    title: "Harga",
    dataIndex: "price_per_m2",
    width: 190,
    align: "right",
    sorter: (a, b) => Number(a.price_per_m2 || 0) - Number(b.price_per_m2 || 0),
    render: (_, record) => (
      <Stack spacing={0.35} alignItems="flex-end">
        <Typography sx={{ fontWeight: 700, fontSize: 12.5 }}>
          {formatRupiah(record.price_per_m2)}
        </Typography>
        <Typography sx={{ color: theme.ui.mutedText, fontWeight: 600, fontSize: 11.5 }}>
          Harga per m²
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
    width: 285,
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
            label={getDocumentNumberLabel(record)}
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
    width: 205,
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
          <CompactInfoChip
            label="Izin aktif"
            color={theme.palette.success.main}
            sx={compactChipSx}
          />
        )}
      </Stack>
    ),
  },
  {
    title: "Catatan",
    dataIndex: "notes",
    width: 220,
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
];
