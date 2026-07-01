"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Box, Button, useMediaQuery, useTheme } from "@mui/material";
import { Icon } from "@iconify/react";
import axios from "axios";
import moment from "moment";
import PageHeader from "@/app/components/page-header/PageHeader";
import DataTableShell from "@/app/components/data-table/DataTableShell";
import ReusableAntTable from "@/app/components/data-table/ReusableAntTable";
import TableExportButton from "@/app/components/data-table/TableExportButton";
import SummaryStatCard from "@/app/components/stats/SummaryStatCard";
import TenantLeaseDetailModal from "@/app/components/modals/TenantLeaseDetailModal";
import LoadingBackdrop from "@/app/components/loading/Backdrop";
import Notification from "@/app/components/Notification";
import ReportFilterPanel from "@/app/components/reports/ReportFilterPanel";
import { useUser } from "@/app/utils/useUser";
import {
  buildReportFileName,
  exportReportToExcel,
  exportReportToPDF,
} from "@/app/utils/reportExportUtils";
import {
  CONTRACT_EXPIRY_EXPORT_COLUMNS,
  CONTRACT_EXPIRY_PAGE_SIZE_OPTIONS,
  CONTRACT_EXPIRY_SCROLL_WIDTH,
  buildContractExpiryExportRows,
  createContractExpiryReportColumns,
  filterContractExpiryRows,
} from "./ContractExpiryReportTableColumns";

const DEFAULT_LOADING_MESSAGE = "Loading...";
const DEFAULT_STATUS_FILTER = "all";

const PAGE_BREADCRUMBS = [
  {
    label: "Laporan",
    value: "reports",
    path: "#",
    icon: "solar:chart-square-bold-duotone",
  },
  {
    label: "Kontrak Segera Berakhir",
    value: "contract-expiry-report",
    path: "/contract-expiry-report",
    icon: "solar:calendar-mark-bold-duotone",
  },
];

const FILTERS = [
  { value: "all", label: "Semua" },
  { value: "expiringSoon", label: "30 Hari Lagi" },
  { value: "expired", label: "Sudah Berakhir" },
];

const FILTER_LABELS = FILTERS.reduce(
  (acc, item) => ({ ...acc, [item.value]: item.label }),
  { custom: "Custom Range" },
);

const getDefaultRange = () => ({
  startDate: moment().format("YYYY-MM-DD"),
  endDate: moment().format("YYYY-MM-DD"),
});

const filterByStatus = (rows, status) => {
  if (status === "all" || status === "custom") return rows;
  return rows.filter(
    (row) => row.contract_expiry?.contract_status === status,
  );
};

const getRequestRange = (filter, range) => {
  const today = moment();

  if (filter === "expiringSoon") {
    return {
      startDate: today.format("YYYY-MM-DD"),
      endDate: today.clone().add(30, "days").format("YYYY-MM-DD"),
    };
  }

  if (filter === "expired") {
    return {
      startDate: "2000-01-01",
      endDate: today.clone().subtract(1, "day").format("YYYY-MM-DD"),
    };
  }

  if (filter === "all") {
    return {
      startDate: "2000-01-01",
      endDate: today.clone().add(30, "days").format("YYYY-MM-DD"),
    };
  }

  return range;
};

const getFilterLabel = (filter) => FILTER_LABELS[filter] || "Semua";

const getExportFilterName = (filter) =>
  ({
    all: "Semua",
    expiringSoon: "30_Hari_Lagi",
    expired: "Sudah_Berakhir",
    custom: "Custom_Range",
  })[filter] || "Semua";

const formatReportRange = (targetRange) =>
  `${moment(targetRange.startDate).format("DD MMMM YYYY")} - ${moment(
    targetRange.endDate,
  ).format("DD MMMM YYYY")}`;

const getReportPeriodLabel = (filter, targetRange) => {
  if (filter === "all") return "Semua";
  return formatReportRange(targetRange);
};

/**
 * Laporan kontrak segera berakhir memakai pola yang sama dengan laporan jatuh
 * tempo pembayaran, tetapi sumber datanya buku kontrak dan tanggal akhir sewa.
 */
export default function ContractExpiryReportPage() {
  const isMobile = useMediaQuery("(max-width:600px)");
  const { user } = useUser();
  const theme = useTheme();
  const [rows, setRows] = useState([]);
  const [range, setRange] = useState(getDefaultRange);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState(DEFAULT_STATUS_FILTER);
  const [pageSize, setPageSize] = useState(10);
  const [selectedRow, setSelectedRow] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState(DEFAULT_LOADING_MESSAGE);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const validateRange = (targetRange = range) => {
    if (!targetRange.startDate || !targetRange.endDate) {
      showSnackbar("Tanggal mulai dan selesai wajib diisi.", "error");
      return false;
    }

    if (moment(targetRange.startDate).isAfter(targetRange.endDate)) {
      showSnackbar(
        "Tanggal mulai tidak boleh melewati tanggal selesai.",
        "error",
      );
      return false;
    }

    return true;
  };

  const fetchReport = async ({
    showLoading = true,
    overrideFilter = statusFilter,
    overrideRange = range,
    message = "Mengambil laporan kontrak segera berakhir...",
    notifySuccess = false,
  } = {}) => {
    if (!user || !validateRange(overrideRange)) return;

    if (showLoading) {
      setLoadingMessage(message);
      setLoading(true);
    }

    try {
      const requestRange = getRequestRange(overrideFilter, overrideRange);
      const response = await axios.get("/api/report/contract-expiry", {
        params: {
          start_date: requestRange.startDate,
          end_date: requestRange.endDate,
        },
      });
      const nextRows = response.data?.data || [];
      setRows(nextRows);

      if (!nextRows.length) {
        showSnackbar(
          "Belum ada kontrak yang akan berakhir atau sudah berakhir.",
          "warning",
        );
      } else if (notifySuccess) {
        showSnackbar(
          `Laporan kontrak berhasil ditampilkan (${nextRows.length} data).`,
          "success",
        );
      }
    } catch (error) {
      console.error("Error fetch contract expiry report:", error);
      showSnackbar(
        error?.response?.data?.message ||
          "Gagal mengambil laporan kontrak segera berakhir.",
        "error",
      );
    } finally {
      if (showLoading) {
        setLoading(false);
        setLoadingMessage(DEFAULT_LOADING_MESSAGE);
      }
    }
  };

  useEffect(() => {
    if (user) {
      fetchReport();
    }
  }, [user]);

  const summary = useMemo(
    () => ({
      total: rows.length,
      expiringSoon: rows.filter(
        (item) => item.contract_expiry?.contract_status === "expiringSoon",
      ).length,
      expired: rows.filter(
        (item) => item.contract_expiry?.contract_status === "expired",
      ).length,
    }),
    [rows],
  );

  const handleResetFilter = async () => {
    const defaultRange = getDefaultRange();
    setSearchText("");
    setStatusFilter(DEFAULT_STATUS_FILTER);
    setRange(defaultRange);
    await fetchReport({
      overrideFilter: DEFAULT_STATUS_FILTER,
      overrideRange: defaultRange,
      message: "Mereset filter laporan kontrak...",
      notifySuccess: true,
    });
  };

  const filteredRows = useMemo(() => {
    const statusRows = filterByStatus(rows, statusFilter);
    return filterContractExpiryRows(statusRows, searchText);
  }, [rows, searchText, statusFilter]);

  const columns = useMemo(
    () =>
      createContractExpiryReportColumns({
        theme,
        onOpenDetail: setSelectedRow,
        isMobile,
      }),
    [theme, isMobile],
  );

  const exportRows = useMemo(
    () => buildContractExpiryExportRows(filteredRows),
    [filteredRows],
  );

  const activeExportRange = getRequestRange(statusFilter, range);
  const activeFilterLabel = getFilterLabel(statusFilter);
  const filterInfo = [
    {
      label: "Periode",
      value: getReportPeriodLabel(statusFilter, activeExportRange),
    },
    { label: "Filter", value: activeFilterLabel },
    { label: "Total Data", value: `${filteredRows.length} data` },
  ];

  const reportTitle = "Laporan Kontrak Segera Berakhir";
  const reportSubtitle =
    "Daftar buku kontrak yang akan berakhir dalam 30 hari ke depan atau sudah melewati masa berlaku.";

  const handleExportExcel = () => {
    exportReportToExcel({
      title: reportTitle,
      subtitle: reportSubtitle,
      filterInfo,
      sheetName: "Kontrak Berakhir",
      fileName: buildReportFileName({
        prefix: "Laporan_Kontrak_Segera_Berakhir",
        filterName: getExportFilterName(statusFilter),
        startDate: activeExportRange.startDate,
        endDate: activeExportRange.endDate,
        extension: "xlsx",
      }),
      rows: exportRows,
      columns: CONTRACT_EXPIRY_EXPORT_COLUMNS,
    });
  };

  const handleExportPDF = async () => {
    await exportReportToPDF({
      title: reportTitle,
      subtitle: reportSubtitle,
      filterInfo,
      fileName: buildReportFileName({
        prefix: "Laporan_Kontrak_Segera_Berakhir",
        filterName: getExportFilterName(statusFilter),
        startDate: activeExportRange.startDate,
        endDate: activeExportRange.endDate,
        extension: "pdf",
      }),
      rows: exportRows,
      columns: CONTRACT_EXPIRY_EXPORT_COLUMNS,
      printedAtFooter: true,
      showLogoMark: true,
    });
  };

  return (
    <Box
      sx={{
        width: "100%",
        minHeight: "100%",
        p: { xs: 1.5, sm: 2 },
        display: "flex",
        flexDirection: "column",
        gap: 2,
      }}
    >
      <PageHeader
        breadcrumbs={PAGE_BREADCRUMBS}
        title="Kontrak Segera Berakhir"
        description="Pantau buku kontrak yang akan selesai dalam 30 hari ke depan dan kontrak yang sudah melewati masa berlaku."
        icon="solar:calendar-mark-bold-duotone"
        action={
          <Button
            variant="contained"
            onClick={() => fetchReport()}
            startIcon={<Icon icon="solar:refresh-bold-duotone" />}
            sx={{
              minHeight: 44,
              borderRadius: 2,
              px: 2.25,
              fontFamily: "Poppins",
              fontWeight: 700,
            }}
          >
            Refresh
          </Button>
        }
      />

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "repeat(2, minmax(0, 1fr))",
            md: "repeat(3, minmax(0, 1fr))",
          },
          gap: 1.5,
        }}
      >
        <SummaryStatCard
          label="Total Data"
          value={summary.total}
          icon="solar:documents-bold-duotone"
          color={theme.palette.primary.main}
        />
        <SummaryStatCard
          label="30 Hari Lagi"
          value={summary.expiringSoon}
          icon="solar:clock-circle-bold-duotone"
          color={theme.palette.warning.main}
        />
        <SummaryStatCard
          label="Sudah Berakhir"
          value={summary.expired}
          icon="solar:close-circle-bold-duotone"
          color={theme.palette.error.main}
        />
      </Box>

      <ReportFilterPanel
        title="Filter Kontrak"
        description="Pilih rentang tanggal akhir kontrak, lalu gunakan filter cepat untuk melihat semua data, 30 hari lagi, atau yang sudah berakhir."
        icon="solar:filter-bold-duotone"
        range={range}
        selectedPreset={statusFilter}
        quickFilters={FILTERS.map((item) => ({
          key: item.value,
          label: item.label,
          count:
            item.value === "all"
              ? summary.total
              : rows.filter(
                  (row) => row.contract_expiry?.contract_status === item.value,
                ).length,
        }))}
        onPresetChange={setStatusFilter}
        onRangeChange={setRange}
        onApply={() => fetchReport({ notifySuccess: true })}
        onReset={handleResetFilter}
        isSubmitting={loading}
        isResetting={loadingMessage.includes("Mereset")}
        applyLabel="Cari Data"
        resetPickerToTodayOnOpen
        maxDate={moment().add(30, "days").toDate()}
      />

      <DataTableShell
        title="Daftar Kontrak Segera Berakhir"
        description={`${filteredRows.length} dari ${rows.length} kontrak ditampilkan`}
        searchValue={searchText}
        searchPlaceholder="Cari penyewa, NIK, dokumen, kontrak, lokasi, ruangan"
        onSearchChange={setSearchText}
        headerAction={
          <TableExportButton
            disabled={!filteredRows.length}
            ariaLabel="Export laporan kontrak segera berakhir"
            items={[
              {
                label: "Export Excel",
                icon: "vscode-icons:file-type-excel",
                onClick: handleExportExcel,
              },
              {
                label: "Export PDF",
                icon: "vscode-icons:file-type-pdf2",
                onClick: handleExportPDF,
              },
            ]}
          />
        }
      >
        <ReusableAntTable
          rowKey="id"
          columns={columns}
          dataSource={filteredRows}
          pageSize={pageSize}
          pageSizeOptions={CONTRACT_EXPIRY_PAGE_SIZE_OPTIONS}
          onPageSizeChange={setPageSize}
          scroll={{ x: CONTRACT_EXPIRY_SCROLL_WIDTH, y: 560 }}
          pagination={{ total: filteredRows.length }}
          fixedActionColumn={{
            className: "contract-expiry-action-cell",
            buttonsClassName: "contract-expiry-action-buttons",
            width: 112,
            paddingX: 14,
          }}
        />
      </DataTableShell>

      <TenantLeaseDetailModal
        open={Boolean(selectedRow)}
        onClose={() => setSelectedRow(null)}
        selectedData={selectedRow}
      />

      <LoadingBackdrop message={loadingMessage} open={loading} />
      <Notification
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
      />
    </Box>
  );
}
