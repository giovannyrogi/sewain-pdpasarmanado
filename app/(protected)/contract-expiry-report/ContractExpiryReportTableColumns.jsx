"use client";

import React from "react";
import { Box, Chip, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { Icon } from "@iconify/react";
import moment from "moment";
import TableActionButton from "@/app/components/data-table/TableActionButton";
import { getContractDaysLabel } from "../dashboard/dashboardUtils";

export const CONTRACT_EXPIRY_PAGE_SIZE_OPTIONS = [10, 20, 50];
export const CONTRACT_EXPIRY_SCROLL_WIDTH = 1520;

const normalize = (value) => String(value || "").toLowerCase();

const formatDate = (value) =>
  value && moment(value).isValid() ? moment(value).format("DD MMM YYYY") : "-";

const formatDateRange = (startDate, endDate) =>
  `${formatDate(startDate)} s/d ${formatDate(endDate)}`;

const normalizeContractNumber = (contractNumber) =>
  contractNumber ? String(contractNumber).replace(/\s+/g, "").trim() : "";

const ContractStatusChip = ({ status, daysRemaining, theme }) => {
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
        "& .MuiChip-icon": { color },
      }}
    />
  );
};

export const filterContractExpiryRows = (rows, searchText) => {
  const keyword = normalize(searchText).trim();
  if (!keyword) return rows;

  return rows.filter((row) =>
    [
      row.tenant_name,
      row.tenant_nik,
      row.document_number,
      normalizeContractNumber(row.contract_number),
      row.location_name,
      row.room_number,
      row.floor,
      row.contract_expiry?.contract_status,
    ]
      .map(normalize)
      .some((value) => value.includes(keyword)),
  );
};

export const CONTRACT_EXPIRY_EXPORT_COLUMNS = [
  { header: "Nama Penyewa", key: "tenant_name", width: 26 },
  { header: "NIK", key: "tenant_nik", width: 22 },
  { header: "Nomor Dokumen", key: "document_number", width: 18 },
  { header: "Nomor Kontrak", key: "contract_number", width: 24 },
  { header: "Lokasi", key: "location_name", width: 24 },
  { header: "Ruangan", key: "room_number", width: 16 },
  { header: "Lantai", key: "floor", width: 14 },
  { header: "Mulai Kontrak", key: "start_date", width: 18 },
  { header: "Akhir Kontrak", key: "end_date", width: 18 },
  { header: "Status", key: "status_label", width: 24 },
];

export const buildContractExpiryExportRows = (rows = []) =>
  rows.map((row) => ({
    tenant_name: row.tenant_name || "-",
    tenant_nik: row.tenant_nik || "-",
    document_number: row.document_number || "-",
    contract_number:
      normalizeContractNumber(row.contract_number) || "Belum tersedia",
    contract_date: row.contract_number ? formatDate(row.contract_date) : "-",
    location_name: row.location_name || "-",
    room_number: row.room_number || "-",
    floor: row.floor || "-",
    start_date: formatDate(row.start_date),
    end_date: formatDate(row.end_date),
    status_label: getContractDaysLabel(row.contract_expiry?.days_remaining),
  }));

/**
 * Kolom laporan kontrak berakhir dibuat ringkas seperti laporan jatuh tempo:
 * informasi inti tampil di tabel, detail lengkap dibuka melalui modal shared.
 */
export const createContractExpiryReportColumns = ({
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
    width: 285,
    sorter: (a, b) =>
      String(a.tenant_name || "").localeCompare(String(b.tenant_name || "")),
    render: (_, record) => (
      <Stack spacing={0.5}>
        <Typography
          sx={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 14 }}
        >
          {record.tenant_name || "-"}
        </Typography>
        <Chip
          size="small"
          label={`Dokumen ${record.document_number || "-"}`}
          sx={{
            width: "fit-content",
            maxWidth: "100%",
            height: 23,
            borderRadius: 999,
            color: theme.palette.primary.main,
            bgcolor: alpha(theme.palette.primary.main, 0.14),
            fontFamily: "Poppins",
            fontWeight: 700,
            fontSize: 12,
            "& .MuiChip-label": {
              maxWidth: "100%",
              overflow: "hidden",
              textOverflow: "ellipsis",
            },
          }}
        />
      </Stack>
    ),
  },
  {
    title: "Nomor Kontrak & Tanggal Dibuat",
    key: "contractNumber",
    width: 285,
    render: (_, record) => {
      const contractNumber = normalizeContractNumber(record.contract_number);
      const hasContractNumber = Boolean(contractNumber);
      const color = hasContractNumber
        ? theme.palette.primary.main
        : theme.palette.warning.main;

      return (
        <Stack spacing={0.5}>
          <Chip
            size="small"
            label={
              hasContractNumber
                ? `Kontrak ${contractNumber}`
                : "Kontrak belum dibuat"
            }
            sx={{
              width: "fit-content",
              maxWidth: "100%",
              minHeight: 25,
              height: "auto",
              borderRadius: 999,
              color,
              bgcolor: alpha(color, theme.palette.mode === "dark" ? 0.16 : 0.1),
              border: `1px solid ${alpha(color, theme.palette.mode === "dark" ? 0.46 : 0.26)}`,
              fontFamily: "Poppins",
              fontWeight: 700,
              fontSize: 12,
              "& .MuiChip-icon": { color },
              "& .MuiChip-label": {
                whiteSpace: "normal",
                wordBreak: "break-word",
                lineHeight: 1.35,
                py: 0.25,
              },
            }}
          />
          {contractNumber && (
            <Typography
              sx={{
                color: theme.ui.mutedText,
                fontFamily: "Poppins",
                fontWeight: 700,
                fontSize: 12,
              }}
            >
              {record.contract_number
                ? `Kontrak Dibuat ${formatDate(record.contract_date)}`
                : "-"}
            </Typography>
          )}
        </Stack>
      );
    },
  },
  {
    title: "Lokasi & Ruangan",
    key: "room",
    width: 280,
    render: (_, record) => (
      <Stack spacing={0.5}>
        <Typography
          sx={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 12 }}
        >
          {record.location_name || "-"}
        </Typography>
        <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap" }}>
          <Chip
            size="small"
            label={`Ruangan ${record.room_number || "-"}`}
            sx={{
              height: 23,
              borderRadius: 999,
              bgcolor: alpha(theme.palette.primary.main, 0.14),
              color: theme.palette.primary.main,
              fontFamily: "Poppins",
              fontWeight: 700,
              fontSize: 12,
            }}
          />
          <Typography
            sx={{
              color: theme.ui.mutedText,
              fontFamily: "Poppins",
              fontWeight: 600,
              fontSize: 12,
              alignSelf: "center",
            }}
          >
            {record.floor || "-"}
          </Typography>
        </Box>
      </Stack>
    ),
  },
  {
    title: "Masa Berlaku",
    key: "period",
    width: 250,
    sorter: (a, b) =>
      moment(a.end_date || 0).valueOf() - moment(b.end_date || 0).valueOf(),
    render: (_, record) => (
      <Stack spacing={0.5}>
        <Typography
          sx={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 12 }}
        >
          {formatDateRange(record.start_date, record.end_date)}
        </Typography>
      </Stack>
    ),
  },
  {
    title: "Status Berakhir",
    key: "status",
    width: 230,
    render: (_, record) => (
      <ContractStatusChip
        theme={theme}
        status={record.contract_expiry?.contract_status}
        daysRemaining={record.contract_expiry?.days_remaining}
      />
    ),
  },
  {
    title: "Aksi",
    key: "actions",
    width: 112,
    fixed: isMobile ? undefined : "right",
    align: "center",
    className: "contract-expiry-action-cell",
    render: (_, record) => (
      <Box
        className="contract-expiry-action-buttons"
        sx={{ display: "flex", justifyContent: "center", gap: 0.75 }}
      >
        <TableActionButton
          title="Lihat detail kontrak"
          color="info"
          icon="solar:document-text-bold-duotone"
          onClick={() => onOpenDetail(record)}
        />
      </Box>
    ),
  },
];
