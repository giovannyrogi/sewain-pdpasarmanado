"use client";

import React from "react";
import { Box, Stack, Typography } from "@mui/material";
import moment from "moment";
import CompactInfoChip from "@/app/components/chips/CompactInfoChip";
import TableActionButton from "@/app/components/data-table/TableActionButton";

export const LAND_DOCUMENT_PAGE_SIZE_OPTIONS = [5, 10, 20, 50];
export const LAND_DOCUMENT_TABLE_SCROLL_WIDTH = 1220;
export const LAND_DOCUMENT_ACTION_COLUMN_WIDTH = 170;

const normalize = (value) => String(value || "").toLowerCase();

export const filterLandPermitDocuments = (data, searchText) => {
  const keyword = normalize(searchText);
  if (!keyword) return data;

  return data.filter((item) =>
    [
      item.tenant_name,
      item.tenant_nik,
      item.document_number,
      item.location_name,
      item.sector_name,
      item.stall_number,
      item.commodity_type,
    ].some((value) => normalize(value).includes(keyword)),
  );
};

export const buildLandPermitDocumentStats = (data, theme) => {
  const currentMonth = moment().format("YYYY-MM");
  const thisMonth = data.filter((item) =>
    String(item.document_created_at || "").startsWith(currentMonth),
  ).length;
  const active = data.filter((item) =>
    ["active", "printed"].includes(item.document_status),
  ).length;
  const uniqueLocations = new Set(
    data.map((item) => item.location_name).filter(Boolean),
  ).size;

  return [
    {
      label: "Total Dokumen",
      value: data.length,
      icon: "solar:documents-bold-duotone",
      color: theme.palette.primary.main,
    },
    {
      label: "Dokumen Aktif",
      value: active,
      icon: "solar:verified-check-bold-duotone",
      color: theme.palette.success.main,
    },
    {
      label: "Dibuat Bulan Ini",
      value: thisMonth,
      icon: "solar:calendar-add-bold-duotone",
      color: theme.palette.warning.main,
    },
    {
      label: "Lokasi Tercover",
      value: uniqueLocations,
      icon: "solar:map-point-bold-duotone",
      color: theme.palette.info.main,
    },
  ];
};

export const createLandPermitDocumentColumns = ({
  theme,
  isMobile,
  onDetail,
  onPrintGuide,
  canDelete = false,
  onDelete,
}) => [
  {
    title: "No",
    width: 64,
    align: "center",
    render: (_value, _record, index) => index + 1,
  },
  {
    title: "Nama Penyewa",
    width: 280,
    sorter: (a, b) =>
      normalize(a.tenant_name).localeCompare(normalize(b.tenant_name)),
    render: (_value, record) => (
      <Stack spacing={0.65} sx={{ minWidth: 0 }}>
        <Typography sx={{ fontSize: 13, fontWeight: 700 }}>
          {record.tenant_name || "-"}
        </Typography>
      </Stack>
    ),
  },
  {
    title: "Nomor Dokumen",
    width: 265,
    render: (_value, record) => (
      <CompactInfoChip
        label={`${record.document_number || "-"}`}
        color={theme.palette.primary.main}
      />
    ),
  },
  {
    title: "Lokasi, Sektor & Lahan",
    width: 310,
    render: (_value, record) => (
      <Stack spacing={0.65}>
        <Typography sx={{ fontSize: 13, fontWeight: 700 }}>
          {record.location_name || "-"}
        </Typography>
        <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
          <CompactInfoChip label={record.sector_name || "-"} />
          <CompactInfoChip
            label={`Lahan ${record.stall_number || "-"}`}
            color={theme.palette.success.main}
          />
        </Stack>
      </Stack>
    ),
  },
  {
    title: "Jenis Administrasi",
    width: 310,
    render: (_value, record) => (
      // Capitalize all character administration type
      <Typography sx={{ fontSize: 12, fontWeight: 500, letterSpacing:'0.5px ' }}>
        {record.administration_type === "kip"
          ? "Kartu Identitas Pedagang(KIP)"
          : "Kartu Khusus Identitas Pedagang(KKIP)"}
      </Typography>
    ),
  },
  {
    title: "Masa Berlaku",
    width: 220,
    render: (_value, record) => (
      <Typography sx={{ fontSize: 12.5, fontWeight: 650 }}>
        {record.start_date
          ? moment(record.start_date).format("DD MMM YYYY")
          : "-"}{" "}
        s/d{" "}
        {record.end_date ? moment(record.end_date).format("DD MMM YYYY") : "-"}
      </Typography>
    ),
  },
  {
    title: "Dibuat",
    width: 170,
    render: (_value, record) => (
      <Typography sx={{ fontSize: 12.5, fontWeight: 650 }}>
        {record.document_created_at
          ? moment(record.document_created_at).format("DD MMM YYYY")
          : "-"}
      </Typography>
    ),
  },
  {
    title: "Aksi",
    key: "action",
    align: "center",
    width: LAND_DOCUMENT_ACTION_COLUMN_WIDTH,
    fixed: isMobile ? false : "right",
    className: "land-documents-action-column",
    onHeaderCell: () => ({ className: "land-documents-action-column" }),
    onCell: () => ({ className: "land-documents-action-column" }),
    render: (_value, record) => (
      <Box
        className="land-documents-action-buttons"
        sx={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 0.75,
          minWidth: 82,
        }}
      >
        <TableActionButton
          title="Detail data pemohon"
          color="success"
          icon="solar:eye-bold-duotone"
          onClick={() => onDetail(record)}
        />
        <TableActionButton
          title="Panduan cetak manual"
          color="warning"
          icon="solar:printer-2-bold-duotone"
          onClick={() => onPrintGuide(record)}
        />
        {canDelete && (
          <TableActionButton
            title="Hapus dokumen izin lahan"
            color="error"
            icon="solar:trash-bin-trash-bold-duotone"
            onClick={() => onDelete(record)}
          />
        )}
      </Box>
    ),
  },
];
