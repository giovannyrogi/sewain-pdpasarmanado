"use client";

import React from "react";
import { Box, Chip, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import CompactInfoChip from "@/app/components/chips/CompactInfoChip";
import TableActionButton from "@/app/components/data-table/TableActionButton";
import { getContractDaysLabel } from "@/app/components/dashboard/dashboardUtils";
import moment from "moment";

export const LAND_PERMIT_EXPIRY_PAGE_SIZE_OPTIONS = [10, 20, 50];
export const LAND_PERMIT_EXPIRY_SCROLL_WIDTH = 1380;

const normalize = (value) => String(value || "").toLowerCase();

const formatDate = (value) =>
  value && moment(value).isValid() ? moment(value).format("DD MMM YYYY") : "-";

const formatDateRange = (startDate, endDate) =>
  `${formatDate(startDate)} s/d ${formatDate(endDate)}`;

const PermitExpiryStatusChip = ({ status, daysRemaining, theme }) => {
  const isExpired = status === "expired";
  const color = isExpired
    ? theme.palette.error.main
    : theme.palette.warning.main;

  return (
    <Chip
      size="small"
      label={getContractDaysLabel(daysRemaining)}
      sx={{
        width: "fit-content",
        height: 25,
        borderRadius: 999,
        color,
        bgcolor: alpha(color, theme.palette.mode === "dark" ? 0.17 : 0.12),
        border: `1px solid ${alpha(color, theme.palette.mode === "dark" ? 0.5 : 0.35)}`,
        fontFamily: "Poppins",
        fontWeight: 700,
        fontSize: 12,
      }}
    />
  );
};

export const filterLandPermitExpiryRows = (rows, searchText) => {
  const keyword = normalize(searchText).trim();
  if (!keyword) return rows;

  return rows.filter((row) =>
    [
      row.tenant_name,
      row.tenant_nik,
      row.permit_document_number,
      row.location_name,
      row.sector_name,
      row.sector_code,
      row.stall_number,
      row.commodity_type,
      row.permit_expiry?.expiry_status,
    ]
      .map(normalize)
      .some((value) => value.includes(keyword)),
  );
};

export const LAND_PERMIT_EXPIRY_EXPORT_COLUMNS = [
  { header: "Nama Pedagang", key: "tenant_name", width: 26, pdfWidth: 34 },
  { header: "NIK", key: "tenant_nik", width: 22, pdfWidth: 25 },
  { header: "Nomor Dokumen Izin", key: "permit_document_number", width: 24, pdfWidth: 34 },
  { header: "Lokasi", key: "location_name", width: 24, pdfWidth: 30 },
  { header: "Sektor", key: "sector_name", width: 20, pdfWidth: 24 },
  { header: "Lahan", key: "stall_number", width: 16, pdfWidth: 16 },
  { header: "Jenis Dagangan", key: "commodity_type", width: 20, pdfWidth: 24 },
  { header: "Mulai Izin", key: "start_date", width: 18, pdfWidth: 22 },
  { header: "Akhir Izin", key: "end_date", width: 18, pdfWidth: 22 },
  { header: "Status", key: "status_label", width: 24, pdfWidth: 28 },
];

export const buildLandPermitExpiryExportRows = (rows = []) =>
  rows.map((row) => ({
    tenant_name: row.tenant_name || "-",
    tenant_nik: row.tenant_nik || "-",
    permit_document_number: row.permit_document_number || "Belum dibuat",
    location_name: row.location_name || "-",
    sector_name: row.sector_name || "-",
    stall_number: row.stall_number || "-",
    commodity_type: row.commodity_type || "-",
    start_date: formatDate(row.start_date),
    end_date: formatDate(row.end_date),
    status_label: getContractDaysLabel(row.permit_expiry?.days_remaining),
  }));

export const createLandPermitExpiryReportColumns = ({
  theme,
  onOpenDetail,
  isMobile,
}) => [
  {
    title: "No",
    dataIndex: "index",
    key: "index",
    width: 72,
    align: "center",
  },
  {
    title: "Pemohon & Dokumen",
    key: "tenant",
    width: 300,
    sorter: (a, b) =>
      String(a.tenant_name || "").localeCompare(String(b.tenant_name || "")),
    render: (_, record) => (
      <Stack spacing={0.55}>
        <Typography sx={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 14 }}>
          {record.tenant_name || "-"}
        </Typography>
        <CompactInfoChip
          label={
            record.permit_document_number
              ? `Dokumen ${record.permit_document_number}`
              : "Dokumen belum dibuat"
          }
          color={
            record.permit_document_number
              ? theme.palette.primary.main
              : theme.palette.warning.main
          }
        />
      </Stack>
    ),
  },
  {
    title: "Lokasi, Sektor & Lahan",
    key: "land",
    width: 330,
    render: (_, record) => (
      <Stack spacing={0.5}>
        <Typography sx={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 12 }}>
          {record.location_name || "-"}
        </Typography>
        <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap", alignItems: "center" }}>
          <CompactInfoChip
            label={record.sector_name || "-"}
            color={theme.palette.primary.main}
          />
          <Typography
            sx={{
              color: theme.ui.mutedText,
              fontFamily: "Poppins",
              fontWeight: 600,
              fontSize: 12,
              lineHeight: "23px",
            }}
          >
            Lahan {record.stall_number || "-"}
          </Typography>
        </Box>
      </Stack>
    ),
  },
  {
    title: "Jenis Dagangan",
    key: "commodity",
    width: 190,
    render: (_, record) => (
      <Typography sx={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 12 }}>
        {record.commodity_type || "-"}
      </Typography>
    ),
  },
  {
    title: "Masa Izin",
    key: "period",
    width: 260,
    sorter: (a, b) =>
      moment(a.end_date || 0).valueOf() - moment(b.end_date || 0).valueOf(),
    render: (_, record) => (
      <Typography sx={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 12 }}>
        {formatDateRange(record.start_date, record.end_date)}
      </Typography>
    ),
  },
  {
    title: "Status Berakhir",
    key: "status",
    width: 230,
    render: (_, record) => (
      <PermitExpiryStatusChip
        theme={theme}
        status={record.permit_expiry?.expiry_status}
        daysRemaining={record.permit_expiry?.days_remaining}
      />
    ),
  },
  {
    title: "Aksi",
    key: "actions",
    width: 112,
    fixed: isMobile ? undefined : "right",
    align: "center",
    className: "land-permit-expiry-action-cell",
    render: (_, record) => (
      <Box
        className="land-permit-expiry-action-buttons"
        sx={{ display: "flex", justifyContent: "center", gap: 0.75 }}
      >
        <TableActionButton
          title="Lihat detail pemohon"
          color="success"
          icon="solar:eye-bold-duotone"
          onClick={() => onOpenDetail(record)}
        />
      </Box>
    ),
  },
];
