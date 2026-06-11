"use client";

import React from "react";
import {
  Box,
  Chip,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { Tag } from "antd";
import { Icon } from "@iconify/react";
import formatRupiah from "@/app/components/formatrupiah/page";

/**
 * Filter dinamis AntD berdasarkan data yang sedang aktif di halaman.
 * Ditempatkan di file kolom agar page utama tidak penuh utility table.
 */
const generateFilters = (data, key) =>
  [...new Set(data.map((item) => item[key]))]
    .filter((value) => value !== undefined && value !== null)
    .map((value) => ({ text: value, value }));

const createOnFilter = (key) => (value, record) => record[key] === value;

export const buildTenantApplicationStats = (data, theme) => {
  const approved = data.filter(
    (item) => item.approval_status === "approved",
  ).length;
  const process = data.filter(
    (item) => item.approval_status === "proses",
  ).length;
  const rejected = data.filter(
    (item) => item.approval_status === "rejected",
  ).length;

  return [
    {
      label: "Total Permohonan",
      value: data.length,
      icon: "solar:document-text-bold-duotone",
      color: theme.palette.primary.main,
    },
    {
      label: "Dalam Proses",
      value: process,
      icon: "solar:hourglass-line-bold-duotone",
      color: theme.palette.warning.main,
    },
    {
      label: "Disetujui",
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

export const filterTenantApplications = (data, searchText) => {
  const keyword = String(searchText || "").toLowerCase();
  if (!keyword) return data;

  return data.filter((item) =>
    [
      item.tenant_name,
      item.location_name,
      item.payment_type,
      item.room_number,
      item.down_payment,
      item.total_payment,
      item.remaining_payment,
      item.document_number,
    ].some((value) =>
      String(value || "")
        .toLowerCase()
        .includes(keyword),
    ),
  );
};

export const getTenantApplicationColumns = ({
  data,
  isMobile,
  theme,
  themeMode,
  actionColumnWidth,
  onEdit,
  onDelete,
  onApproval,
  onDetail,
  onPrint,
}) => {
  const tenantNameFilters = generateFilters(data, "tenant_name");
  const locationFilters = generateFilters(data, "location_name");
  const paymentTypeFilters = generateFilters(data, "payment_type");
  const approvalStatusFilters = [
    { text: "Dalam Proses", value: "proses" },
    { text: "Ditolak", value: "rejected" },
    { text: "Disetujui", value: "approved" },
  ];

  return [
    {
      title: "No",
      dataIndex: "index",
      render: (_, __, index) => index + 1,
      width: 64,
      align: "center",
    },
    {
      title: "Pemohon & Dokumen",
      dataIndex: "tenant_name",
      filters: tenantNameFilters,
      onFilter: createOnFilter("tenant_name"),
      filterSearch: true,
      sorter: (a, b) => a.tenant_name.localeCompare(b.tenant_name),
      sortDirections: ["ascend", "descend"],
      width: 320,
      render: (_, record) => {
        const documentNumberOnly = String(record?.document_number || "-")
          .split("/")[0]
          .trim();

        return (
          <Stack spacing={0.65}>
            <Typography
              sx={{ fontWeight: 600, fontSize: 13, letterSpacing: 0.5 }}
            >
              {record.tenant_name || "-"}
            </Typography>
            <Stack
              direction="row"
              spacing={0.75}
              alignItems="center"
              flexWrap="wrap"
            >
              <Chip
                size="small"
                label={`Dokumen ${documentNumberOnly}`}
                sx={{
                  height: 22,
                  borderRadius: 1.2,
                  fontWeight: 600,
                  color: theme.palette.primary.main,
                  bgcolor:
                    theme.palette.mode === "dark"
                      ? "rgba(255,152,0,0.13)"
                      : "rgba(230,9,9,0.10)",
                }}
              />
              <Typography
                sx={{
                  color: theme.ui.mutedText,
                  fontSize: 12,
                  fontWeight: 500,
                }}
              >
                {record.document_number || "-"}
              </Typography>
            </Stack>
          </Stack>
        );
      },
    },
    {
      title: "Lokasi & Ruangan",
      dataIndex: "location_name",
      filters: locationFilters,
      onFilter: createOnFilter("location_name"),
      filterSearch: true,
      sorter: (a, b) => a.location_name.localeCompare(b.location_name),
      sortDirections: ["ascend", "descend"],
      width: 330,
      render: (_, record) => (
        <Stack spacing={0.55}>
          <Typography sx={{ fontWeight: 700, fontSize: 13 }}>
            {record.location_name || "-"}
          </Typography>
          <Stack
            direction="row"
            spacing={0.75}
            alignItems="center"
            flexWrap="wrap"
          >
            <Tag
              color={theme.palette.mode === "dark" ? "orange" : "red"}
              style={{ borderRadius: 8, fontWeight: 600, marginInlineEnd: 0 }}
            >
              Ruangan No. {record.room_number || "-"}
            </Tag>
            <Typography
              sx={{ color: theme.ui.mutedText, fontSize: 12, fontWeight: 650 }}
            >
              {record.floor || "-"}
            </Typography>
          </Stack>
        </Stack>
      ),
    },
    {
      title: "Pembayaran",
      dataIndex: "payment_type",
      filters: paymentTypeFilters,
      onFilter: createOnFilter("payment_type"),
      filterSearch: true,
      width: 320,
      render: (_, record) => (
        <Stack spacing={0.65}>
          <Stack
            direction="row"
            spacing={0.75}
            alignItems="center"
            flexWrap="wrap"
          >
            <Tag
              color={record.payment_type === "cicilan" ? "blue" : "green"}
              style={{ borderRadius: 8, fontWeight: 700, marginInlineEnd: 0 }}
            >
              {record.payment_type === "cicilan" ? "Cicilan" : "Lunas"}{" "}
              {record?.lease_duration_years || "-"} Tahun
            </Tag>
            <Typography
              sx={{ fontWeight: 600, fontSize: 13, letterSpacing: 0.5 }}
            >
              {formatRupiah(Number(record.total_payment))}
            </Typography>
          </Stack>
          <Typography
            sx={{ color: theme.ui.mutedText, fontSize: 12, fontWeight: 500 }}
          >
            DP {formatRupiah(record.down_payment)} | Sisa{" "}
            {formatRupiah(record.remaining_payment)}
          </Typography>
        </Stack>
      ),
    },
    {
      title: "Status Persetujuan",
      dataIndex: "approval_status",
      filters: approvalStatusFilters,
      onFilter: createOnFilter("approval_status"),
      filterSearch: true,
      width: 210,
      render: (_, record) => (
        <Tag
          color={
            record.approval_status === "proses"
              ? "yellow"
              : record.approval_status === "approved"
                ? "green"
                : "red"
          }
          key={record.tenant_application_id}
          style={{
            borderRadius: 8,
            fontWeight: "bold",
            cursor: "pointer",
            padding: "3px 9px",
          }}
          onClick={() => onApproval(record)}
        >
          {record.approval_status === "proses"
            ? `Dalam Proses ${record.current_step}/5`
            : record.approval_status === "approved"
              ? "Disetujui"
              : record.approval_status === "rejected"
                ? "Tidak Disetujui"
                : "Dibatalkan"}
        </Tag>
      ),
    },
    {
      title: "Aksi",
      key: "action",
      align: "center",
      width: actionColumnWidth,
      fixed: isMobile ? false : "right",
      className: "tenant-application-action-column",
      onHeaderCell: () => ({ className: "tenant-application-action-column" }),
      onCell: () => ({ className: "tenant-application-action-column" }),
      render: (_, record) => (
        <Box
          className="tenant-application-action-buttons"
          sx={{ display: "inline-flex", gap: 0.75, justifyContent: "center" }}
        >
          {record.approval_status !== "approved" && (
            <Tooltip title="Edit Data">
              <IconButton
                size="small"
                color="info"
                onClick={() => onEdit(record)}
                sx={{
                  width: 34,
                  height: 34,
                  borderRadius: 1.5,
                  border: `1px solid ${theme.palette.info.main}66`,
                  bgcolor:
                    theme.palette.mode === "dark"
                      ? "rgba(33,150,243,0.10)"
                      : "rgba(33,150,243,0.12)",
                }}
              >
                <Icon icon="line-md:edit" fontSize={18} />
              </IconButton>
            </Tooltip>
          )}

          <Tooltip title="Detail Data Pemohon">
            <IconButton
              size="small"
              color={themeMode === "dark" ? "inherit" : "success"}
              onClick={() => onDetail(record)}
              sx={{
                width: 34,
                height: 34,
                borderRadius: 1.5,
                border: `1px solid ${theme.palette.success.main}66`,
                bgcolor:
                  theme.palette.mode === "dark"
                    ? "rgba(76,175,80,0.10)"
                    : "rgba(76,175,80,0.12)",
              }}
            >
              <Icon
                icon="mdi:smart-card-outline"
                color={theme.palette.success.main}
                fontSize={18}
              />
            </IconButton>
          </Tooltip>

          {record.approval_status !== "approved" && (
            <>
              <Tooltip title="Print Dokumen">
                <IconButton
                  size="small"
                  color="primary"
                  onClick={() => onPrint(record)}
                  sx={{
                    width: 34,
                    height: 34,
                    borderRadius: 1.5,
                    border: `1px solid ${theme.palette.primary.main}66`,
                    bgcolor:
                      theme.palette.mode === "dark"
                        ? "rgba(255,152,0,0.10)"
                        : "rgba(230,9,9,0.10)",
                  }}
                >
                  <Icon icon="streamline-ultimate:print-text" fontSize={18} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Hapus Data">
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => onDelete(record)}
                  sx={{
                    width: 34,
                    height: 34,
                    borderRadius: 1.5,
                    border: `1px solid ${theme.palette.error.main}66`,
                    bgcolor:
                      theme.palette.mode === "dark"
                        ? "rgba(244,67,54,0.10)"
                        : "rgba(244,67,54,0.12)",
                  }}
                >
                  <Icon icon="line-md:close-circle" fontSize={18} />
                </IconButton>
              </Tooltip>
            </>
          )}
        </Box>
      ),
    },
  ];
};
