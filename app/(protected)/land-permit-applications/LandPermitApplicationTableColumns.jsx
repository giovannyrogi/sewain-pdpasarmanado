"use client";

import React from "react";
import { Box, Stack, Typography } from "@mui/material";
import CompactInfoChip from "@/app/components/chips/CompactInfoChip";
import ApprovalStatusChip from "@/app/components/status/ApprovalStatusChip";
import TableActionButton from "@/app/components/data-table/TableActionButton";
import formatRupiah from "@/app/components/formatrupiah/page";
import {
  APPLICATION_TYPE_LABEL,
  formatDateDisplay,
} from "./landPermitApplicationUtils";

const generateFilters = (data, key) =>
  [...new Set(data.map((item) => item[key]))]
    .filter((value) => value !== undefined && value !== null && value !== "")
    .map((value) => ({ text: value, value }));

const createOnFilter = (key) => (value, record) => record[key] === value;

export const getLandPermitApplicationColumns = ({
  data,
  theme,
  actionColumnWidth,
  isMobile,
  onEdit,
  onDelete,
  onApproval,
  onDetail,
  onPrint,
}) => [
  {
    title: "No",
    width: 64,
    align: "center",
    render: (_, __, index) => index + 1,
  },
  {
    title: "Pemohon & Jenis",
    dataIndex: "tenant_name",
    width: 310,
    filters: generateFilters(data, "tenant_name"),
    onFilter: createOnFilter("tenant_name"),
    filterSearch: true,
    sorter: (a, b) => String(a.tenant_name || "").localeCompare(String(b.tenant_name || "")),
    render: (_, record) => (
      <Stack spacing={0.65}>
        <Typography sx={{ fontWeight: 700, fontSize: 13 }}>
          {record.tenant_name || "-"}
        </Typography>
        <Stack
          direction="row"
          spacing={0.75}
          alignItems="center"
          flexWrap="wrap"
          useFlexGap
        >
          <CompactInfoChip
            label={APPLICATION_TYPE_LABEL[record.application_type] || "-"}
            color={theme.palette.primary.main}
          />
          <Typography
            sx={{
              color: theme.ui.mutedText,
              fontSize: 12,
              fontWeight: 600,
              lineHeight: "23px",
            }}
          >
            NIK {record.tenant_nik || "-"}
          </Typography>
        </Stack>
      </Stack>
    ),
  },
  {
    title: "Lokasi, Sektor & Lahan",
    dataIndex: "location_name",
    width: 350,
    filters: generateFilters(data, "location_name"),
    onFilter: createOnFilter("location_name"),
    filterSearch: true,
    render: (_, record) => (
      <Stack spacing={0.6}>
        <Typography sx={{ fontWeight: 700, fontSize: 13 }}>
          {record.location_name || "-"}
        </Typography>
        <Stack
          direction="row"
          spacing={0.75}
          alignItems="center"
          flexWrap="wrap"
          useFlexGap
        >
          <CompactInfoChip
            label={record.sector_name || "-"}
            color={theme.palette.primary.main}
          />
          <Typography
            sx={{
              color: theme.ui.mutedText,
              fontSize: 12,
              fontWeight: 600,
              lineHeight: "23px",
            }}
          >
            Lahan {record.stall_number || "-"}
          </Typography>
        </Stack>
      </Stack>
    ),
  },
  {
    title: "Masa Izin",
    dataIndex: "start_date",
    width: 260,
    render: (_, record) => (
      <Stack spacing={0.35}>
        <Typography sx={{ fontWeight: 700, fontSize: 13 }}>
          {record.lease_duration_years || 1} Tahun
        </Typography>
        <Typography sx={{ color: theme.ui.mutedText, fontSize: 12, fontWeight: 600 }}>
          {formatDateDisplay(record.start_date)} s/d {formatDateDisplay(record.end_date)}
        </Typography>
      </Stack>
    ),
  },
  {
    title: "Biaya",
    dataIndex: "total_payment",
    width: 230,
    sorter: (a, b) => Number(a.total_payment || 0) - Number(b.total_payment || 0),
    render: (_, record) => (
      <Stack spacing={0.4}>
        <Typography sx={{ fontWeight: 700, fontSize: 13 }}>
          {formatRupiah(record.total_payment)}
        </Typography>
        <Typography sx={{ color: theme.ui.mutedText, fontSize: 12, fontWeight: 600 }}>
          {record.commodity_type || "-"}
        </Typography>
      </Stack>
    ),
  },
  {
    title: "Status Persetujuan",
    dataIndex: "approval_status",
    width: 210,
    filters: [
      { text: "Dalam Proses", value: "proses" },
      { text: "Ditolak", value: "rejected" },
      { text: "Disetujui", value: "approved" },
    ],
    onFilter: createOnFilter("approval_status"),
    render: (_, record) => (
      <ApprovalStatusChip
        status={record.approval_status}
        step={record.current_step}
        totalStep={5}
        onClick={() => onApproval(record)}
        theme={theme}
      />
    ),
  },
  {
    title: "Aksi",
    key: "actions",
    width: actionColumnWidth,
    fixed: isMobile ? false : "right",
    align: "center",
    className: "land-permit-action-column",
    onHeaderCell: () => ({ className: "land-permit-action-column" }),
    onCell: () => ({ className: "land-permit-action-column" }),
    render: (_, record) => (
      <Box
        className="land-permit-action-buttons"
        sx={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 0.75,
          minWidth: 154,
          flexWrap: "nowrap",
        }}
      >
        {record.approval_status !== "approved" && (
          <TableActionButton
            title="Edit Data"
            color="info"
            icon="solar:pen-bold-duotone"
            onClick={() => onEdit(record)}
          />
        )}
        <TableActionButton
          title="Detail Data Pemohon"
          color="success"
          icon="solar:eye-bold-duotone"
          onClick={() => onDetail(record)}
        />
        <TableActionButton
          title="Print Dokumen"
          color="warning"
          icon="solar:printer-2-bold-duotone"
          onClick={() => onPrint(record)}
        />
        {record.approval_status !== "approved" && (
          <TableActionButton
            title="Hapus Data"
            color="error"
            icon="solar:trash-bin-trash-bold-duotone"
            onClick={() => onDelete(record)}
          />
        )}
      </Box>
    ),
  },
];
