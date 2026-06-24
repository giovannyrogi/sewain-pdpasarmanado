"use client";

import React from "react";
import { Chip, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import moment from "moment";
import TableActionButton from "@/app/components/data-table/TableActionButton";

export const CONTRACTS_PAGE_SIZE_OPTIONS = [5, 10, 20, 50];
export const CONTRACTS_TABLE_SCROLL_WIDTH = 1240;
export const CONTRACTS_ACTION_COLUMN_WIDTH = 112;

const normalizeText = (value) => String(value || "").toLowerCase();

const getContractNumberOnly = (contractNumber) =>
  String(contractNumber || "-").split("/")[0].trim();

const createColumnFilters = (data, getter) =>
  [...new Set(data.map(getter).filter(Boolean))].map((value) => ({
    text: value,
    value,
  }));

const formatDate = (value) =>
  value && moment(value).isValid() ? moment(value).format("DD MMM YYYY") : "-";

const formatDateRange = (startDate, endDate) =>
  `${formatDate(startDate)} s/d ${formatDate(endDate)}`;

/**
 * Filter pencarian kontrak dipusatkan agar page tetap tipis dan mudah dirawat.
 * Field yang dicari mengikuti kebutuhan operasional: tenant, nomor kontrak,
 * lokasi, nomor ruangan, dan lantai.
 */
export const filterContracts = (data, searchText) => {
  const keyword = normalizeText(searchText);
  if (!keyword) return data;

  return data.filter((item) =>
    [
      item?.tenant_identities?.full_name,
      item?.tenant_identities?.nik,
      item?.contracts?.contract_number,
      item?.locations?.location_name,
      item?.rooms?.room_number,
      item?.rooms?.floor,
    ].some((value) => normalizeText(value).includes(keyword)),
  );
};

/**
 * Statistik ringkas untuk halaman kontrak. Angka dibuat dari data yang sudah
 * tampil di table sehingga tidak perlu request tambahan hanya untuk summary.
 */
export const buildContractStats = (data, theme) => {
  const currentMonth = moment().format("YYYY-MM");
  const thisMonth = data.filter((item) =>
    String(item?.contracts?.created_at || "").startsWith(currentMonth),
  ).length;
  const uniqueLocations = new Set(
    data.map((item) => item?.locations?.location_name).filter(Boolean),
  ).size;
  const activeContracts = data.filter(
    (item) =>
      item?.tenant_application?.end_date &&
      moment(item.tenant_application.end_date).isSameOrAfter(moment(), "day"),
  ).length;

  return [
    {
      label: "Total Kontrak",
      value: data.length,
      icon: "solar:document-text-bold-duotone",
      color: theme.palette.primary.main,
    },
    {
      label: "Kontrak Aktif",
      value: activeContracts,
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

/**
 * Definisi kolom contracts sengaja dipisahkan dari page agar UI table,
 * filter, dan action download bisa dirawat tanpa menyentuh flow fetch data.
 */
export const createContractColumns = ({ data, theme, isMobile, onDownload }) => [
  {
    title: "No",
    dataIndex: "index",
    width: 64,
    align: "center",
    render: (_text, _record, index) => index + 1,
  },
  {
    title: "Penyewa",
    dataIndex: ["tenant_identities", "full_name"],
    filters: createColumnFilters(data, (item) => item?.tenant_identities?.full_name),
    onFilter: (value, record) => record?.tenant_identities?.full_name === value,
    filterSearch: true,
    sorter: (a, b) =>
      normalizeText(a?.tenant_identities?.full_name).localeCompare(
        normalizeText(b?.tenant_identities?.full_name),
      ),
    width: 280,
    render: (_text, record) => (
      <Stack spacing={0.65} sx={{ minWidth: 0 }}>
        <Typography
          sx={{
            fontFamily: "Poppins",
            fontWeight: 750,
            fontSize: 13,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            textTransform: "capitalize",
          }}
        >
          {record?.tenant_identities?.full_name || "-"}
        </Typography>
        <Chip
          size="small"
          label={`NIK ${record?.tenant_identities?.nik || "-"}`}
          sx={{
            width: "fit-content",
            height: 23,
            fontFamily: "Poppins",
            fontWeight: 750,
            color: theme.palette.primary.main,
            bgcolor: alpha(
              theme.palette.primary.main,
              theme.palette.mode === "dark" ? 0.16 : 0.09,
            ),
          }}
        />
      </Stack>
    ),
  },
  {
    title: "Nomor Kontrak",
    dataIndex: ["contracts", "contract_number"],
    filters: createColumnFilters(data, (item) => item?.contracts?.contract_number),
    onFilter: (value, record) => record?.contracts?.contract_number === value,
    filterSearch: true,
    width: 210,
    render: (_text, record) => (
      <Stack spacing={0.55} sx={{ minWidth: 0 }}>
        <Typography sx={{ fontFamily: "Poppins", fontWeight: 850, fontSize: 13 }}>
          {getContractNumberOnly(record?.contracts?.contract_number)}
        </Typography>
        <Typography
          sx={{
            color: theme.ui.mutedText,
            fontFamily: "Poppins",
            fontWeight: 650,
            fontSize: 11.5,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {record?.contracts?.contract_number || "-"}
        </Typography>
      </Stack>
    ),
  },
  {
    title: "Lokasi & Ruangan",
    dataIndex: ["locations", "location_name"],
    filters: createColumnFilters(data, (item) => item?.locations?.location_name),
    onFilter: (value, record) => record?.locations?.location_name === value,
    filterSearch: true,
    sorter: (a, b) =>
      normalizeText(a?.locations?.location_name).localeCompare(
        normalizeText(b?.locations?.location_name),
      ),
    width: 300,
    render: (_text, record) => (
      <Stack spacing={0.65} sx={{ minWidth: 0 }}>
        <Typography
          sx={{
            fontFamily: "Poppins",
            fontWeight: 750,
            fontSize: 13,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {record?.locations?.location_name || "-"}
        </Typography>
        <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
          <Chip
            size="small"
            label={`Ruangan ${record?.rooms?.room_number || "-"}`}
            sx={{
              height: 24,
              fontFamily: "Poppins",
              fontWeight: 750,
              color: theme.palette.primary.main,
              bgcolor: alpha(
                theme.palette.primary.main,
                theme.palette.mode === "dark" ? 0.16 : 0.09,
              ),
            }}
          />
          <Chip
            size="small"
            label={record?.rooms?.floor || "-"}
            sx={{
              height: 24,
              fontFamily: "Poppins",
              fontWeight: 750,
              color: theme.palette.info.main,
              bgcolor: alpha(
                theme.palette.info.main,
                theme.palette.mode === "dark" ? 0.15 : 0.08,
              ),
            }}
          />
        </Stack>
      </Stack>
    ),
  },
  {
    title: "Masa Berlaku",
    dataIndex: ["tenant_application", "start_date"],
    width: 220,
    sorter: (a, b) =>
      normalizeText(a?.tenant_application?.start_date).localeCompare(
        normalizeText(b?.tenant_application?.start_date),
      ),
    render: (_text, record) => (
      <Typography sx={{ fontFamily: "Poppins", fontWeight: 750, fontSize: 12.5 }}>
        {formatDateRange(
          record?.tenant_application?.start_date,
          record?.tenant_application?.end_date,
        )}
      </Typography>
    ),
  },
  {
    title: "Tanggal Kontrak",
    dataIndex: ["contracts", "contract_date"],
    width: 180,
    sorter: (a, b) =>
      normalizeText(a?.contracts?.contract_date).localeCompare(
        normalizeText(b?.contracts?.contract_date),
      ),
    render: (_text, record) => (
      <Typography sx={{ fontFamily: "Poppins", fontWeight: 750, fontSize: 12.5 }}>
        {formatDate(record?.contracts?.contract_date)}
      </Typography>
    ),
  },
  {
    title: "Aksi",
    key: "actions",
    align: "center",
    width: CONTRACTS_ACTION_COLUMN_WIDTH,
    fixed: isMobile ? false : "right",
    className: "contracts-action-column",
    onHeaderCell: () => ({ className: "contracts-action-column" }),
    onCell: () => ({ className: "contracts-action-column" }),
    render: (_text, record) => (
      <Stack
        className="contracts-action-buttons"
        direction="row"
        alignItems="center"
        justifyContent="center"
        spacing={0.75}
        sx={{ minWidth: 42, flexWrap: "nowrap" }}
      >
        <TableActionButton
          title="Download kontrak"
          color="primary"
          icon="solar:download-minimalistic-bold-duotone"
          onClick={() => onDownload(record)}
        />
      </Stack>
    ),
  },
];
