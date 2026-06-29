"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Box, Button, useMediaQuery, useTheme } from "@mui/material";
import { Icon } from "@iconify/react";
import axios from "axios";
import moment from "moment";
import PageHeader from "@/app/components/page-header/PageHeader";
import DataTableShell from "@/app/components/data-table/DataTableShell";
import ReusableAntTable from "@/app/components/data-table/ReusableAntTable";
import TableExportButton from "@/app/components/data-table/TableExportButton";
import SummaryStatCard from "@/app/components/stats/SummaryStatCard";
import LoadingBackdrop from "@/app/components/loading/Backdrop";
import Notification from "@/app/components/Notification";
import ReportFilterPanel from "@/app/components/reports/ReportFilterPanel";
import { useUser } from "@/app/utils/useUser";
import { getWhatsAppPhone } from "@/app/utils/phoneNumber";
import formatRupiah from "@/app/components/formatrupiah/page";
import { getDaysLabel } from "@/app/components/dashboard/dashboardUtils";
import {
  buildReportFileName,
  exportReportToExcel,
  exportReportToPDF,
} from "@/app/utils/reportExportUtils";
import LandPermitApplicantDetailModal from "@/app/(protected)/land-permit-applications/LandPermitApplicantDetailModal";
import {
  LAND_PAYMENT_DUE_EXPORT_COLUMNS,
  LAND_PAYMENT_DUE_PAGE_SIZE_OPTIONS,
  LAND_PAYMENT_DUE_SCROLL_WIDTH,
  buildLandPaymentDueExportRows,
  createLandPaymentDueReportColumns,
  filterLandPaymentDueRows,
} from "./LandPermitPaymentDueReportTableColumns";

const DEFAULT_LOADING_MESSAGE = "Loading...";
const DEFAULT_STATUS_FILTER = "all";

const PAGE_BREADCRUMBS = [
  {
    label: "Laporan Izin Lahan",
    value: "land-permit-reports",
    path: "#",
    icon: "solar:chart-square-bold-duotone",
  },
  {
    label: "Jatuh Tempo",
    value: "land-permit-payment-due-report",
    path: "/land-permit-payment-due-report",
    icon: "solar:alarm-bold-duotone",
  },
];

const FILTERS = [
  { value: "all", label: "Semua" },
  { value: "dueSoon", label: "30 Hari Lagi" },
  { value: "overdue", label: "Terlambat" },
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
  return rows.filter((row) => row.payment_due?.due_status === status);
};

const getRequestRange = (filter, range) => {
  const today = moment();

  if (filter === "dueSoon") {
    return {
      startDate: today.format("YYYY-MM-DD"),
      endDate: today.clone().add(30, "days").format("YYYY-MM-DD"),
    };
  }

  if (filter === "overdue") {
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
    dueSoon: "30_Hari_Lagi",
    overdue: "Terlambat",
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

const formatMessageDate = (value) =>
  value ? moment(value).format("DD MMMM YYYY") : "-";

const buildLandPermitPaymentDueWhatsAppMessage = (record) => {
  const dueStatus = getDaysLabel(record?.payment_due?.days_remaining);
  const dueSentence =
    record?.payment_due?.due_status === "overdue"
      ? `telah melewati jatuh tempo (${dueStatus})`
      : `akan jatuh tempo (${dueStatus})`;

  return [
    `Yth. Bapak/Ibu ${record?.tenant_name || "Pedagang"},`,
    "",
    `Kami informasikan bahwa pembayaran izin lahan Anda ${dueSentence}.`,
    "",
    "Detail izin lahan:",
    `- Lokasi: ${record?.location_name || "-"}`,
    `- Sektor: ${record?.sector_name || "-"}`,
    `- Lahan: ${record?.stall_number || "-"}`,
    `- Jenis dagangan: ${record?.commodity_type || "-"}`,
    `- Total pembayaran: ${formatRupiah(Number(record?.payment_due?.due_amount || record?.total_payment || 0))}`,
    `- Tanggal mulai izin: ${formatMessageDate(record?.payment_due?.due_date || record?.start_date)}`,
    `- Status: ${dueStatus}`,
    "",
    "Mohon segera melakukan pembayaran sesuai ketentuan. Jika pembayaran sudah dilakukan, mohon konfirmasi kepada admin dengan mengirimkan bukti pembayaran.",
    "",
    "Terima kasih.",
    "Perumda Pasar Manado",
  ].join("\n");
};

export default function LandPermitPaymentDueReportPage() {
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
      showSnackbar("Tanggal mulai tidak boleh melewati tanggal selesai.", "error");
      return false;
    }

    return true;
  };

  const fetchReport = async ({
    showLoading = true,
    overrideFilter = statusFilter,
    overrideRange = range,
    message = "Mengambil laporan jatuh tempo pembayaran izin lahan...",
    notifySuccess = false,
  } = {}) => {
    if (!user || !validateRange(overrideRange)) return;

    if (showLoading) {
      setLoadingMessage(message);
      setLoading(true);
    }

    try {
      const requestRange = getRequestRange(overrideFilter, overrideRange);
      const response = await axios.get("/api/report/land-permit-payment-due", {
        params: {
          start_date: requestRange.startDate,
          end_date: requestRange.endDate,
        },
      });
      const nextRows = response.data?.data || [];
      setRows(nextRows);

      if (!nextRows.length) {
        showSnackbar(
          "Belum ada pembayaran izin lahan yang jatuh tempo atau terlambat.",
          "warning",
        );
      } else if (notifySuccess) {
        showSnackbar(
          `Laporan jatuh tempo izin lahan berhasil ditampilkan (${nextRows.length} data).`,
          "success",
        );
      }
    } catch (error) {
      console.error("Error fetch land permit payment due report:", error);
      showSnackbar(
        error?.response?.data?.message ||
          "Gagal mengambil laporan jatuh tempo pembayaran izin lahan.",
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
    if (user) fetchReport();
  }, [user]);

  const summary = useMemo(
    () => ({
      total: rows.length,
      dueSoon: rows.filter((item) => item.payment_due?.due_status === "dueSoon")
        .length,
      overdue: rows.filter((item) => item.payment_due?.due_status === "overdue")
        .length,
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
      message: "Mereset filter laporan jatuh tempo izin lahan...",
      notifySuccess: true,
    });
  };

  const filteredRows = useMemo(() => {
    const statusRows = filterByStatus(rows, statusFilter);
    return filterLandPaymentDueRows(statusRows, searchText);
  }, [rows, searchText, statusFilter]);

  const handlePhoneAction = useCallback((record) => {
    const phone = getWhatsAppPhone(record?.tenant_phone);

    if (!phone) {
      setSnackbar({
        open: true,
        message: "Nomor WhatsApp pedagang belum valid atau belum tersedia.",
        severity: "warning",
      });
      return;
    }

    const message = buildLandPermitPaymentDueWhatsAppMessage(record);
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }, []);

  const columns = useMemo(
    () =>
      createLandPaymentDueReportColumns({
        theme,
        onOpenDetail: setSelectedRow,
        onPhoneAction: handlePhoneAction,
        isMobile,
      }),
    [handlePhoneAction, isMobile, theme],
  );

  const exportRows = useMemo(
    () => buildLandPaymentDueExportRows(filteredRows),
    [filteredRows],
  );

  const activeExportRange = getRequestRange(statusFilter, range);
  const filterInfo = [
    {
      label: "Periode",
      value: getReportPeriodLabel(statusFilter, activeExportRange),
    },
    { label: "Filter", value: getFilterLabel(statusFilter) },
    { label: "Total Data", value: `${filteredRows.length} data` },
  ];

  const reportTitle = "Laporan Jatuh Tempo Pembayaran Izin Lahan";
  const reportSubtitle =
    "Daftar izin lahan yang tanggal mulainya dekat atau sudah lewat tetapi belum dibayar.";

  const handleExportExcel = () => {
    exportReportToExcel({
      title: reportTitle,
      subtitle: reportSubtitle,
      filterInfo,
      sheetName: "Jatuh Tempo Izin Lahan",
      fileName: buildReportFileName({
        prefix: "Laporan_Jatuh_Tempo_Pembayaran_Izin_Lahan",
        filterName: getExportFilterName(statusFilter),
        startDate: activeExportRange.startDate,
        endDate: activeExportRange.endDate,
        extension: "xlsx",
      }),
      rows: exportRows,
      columns: LAND_PAYMENT_DUE_EXPORT_COLUMNS,
    });
  };

  const handleExportPDF = async () => {
    await exportReportToPDF({
      title: reportTitle,
      subtitle: reportSubtitle,
      filterInfo,
      fileName: buildReportFileName({
        prefix: "Laporan_Jatuh_Tempo_Pembayaran_Izin_Lahan",
        filterName: getExportFilterName(statusFilter),
        startDate: activeExportRange.startDate,
        endDate: activeExportRange.endDate,
        extension: "pdf",
      }),
      rows: exportRows,
      columns: LAND_PAYMENT_DUE_EXPORT_COLUMNS,
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
        title="Jatuh Tempo"
        description="Pantau pembayaran izin lahan yang tanggal mulai izinnya sudah dekat atau sudah lewat, tetapi belum dibayar."
        icon="solar:alarm-bold-duotone"
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
          value={summary.dueSoon}
          icon="solar:clock-circle-bold-duotone"
          color={theme.palette.warning.main}
        />
        <SummaryStatCard
          label="Terlambat"
          value={summary.overdue}
          icon="solar:alarm-bold-duotone"
          color={theme.palette.error.main}
        />
      </Box>

      <ReportFilterPanel
        title="Filter Jatuh Tempo"
        description="Pilih rentang tanggal mulai izin, lalu gunakan filter cepat untuk melihat semua data, 30 hari lagi, atau yang terlambat."
        icon="solar:filter-bold-duotone"
        range={range}
        selectedPreset={statusFilter}
        quickFilters={FILTERS.map((item) => ({
          key: item.value,
          label: item.label,
          count:
            item.value === "all"
              ? summary.total
              : rows.filter((row) => row.payment_due?.due_status === item.value)
                  .length,
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
        title="Daftar Jatuh Tempo Pembayaran Izin Lahan"
        description={`${filteredRows.length} dari ${rows.length} izin lahan ditampilkan`}
        searchValue={searchText}
        searchPlaceholder="Cari pedagang, NIK, lokasi, sektor, lahan, komoditas"
        onSearchChange={setSearchText}
        headerAction={
          <TableExportButton
            disabled={!filteredRows.length}
            ariaLabel="Export laporan jatuh tempo izin lahan"
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
          pageSizeOptions={LAND_PAYMENT_DUE_PAGE_SIZE_OPTIONS}
          onPageSizeChange={setPageSize}
          scroll={{ x: LAND_PAYMENT_DUE_SCROLL_WIDTH, y: 560 }}
          pagination={{ total: filteredRows.length }}
          fixedActionColumn={{
            className: "land-payment-due-action-cell",
            buttonsClassName: "land-payment-due-action-buttons",
            width: 152,
            paddingX: 14,
          }}
        />
      </DataTableShell>

      <LandPermitApplicantDetailModal
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
