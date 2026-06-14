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
import TenantLeaseDetailModal from "@/app/components/modals/TenantLeaseDetailModal";
import LoadingBackdrop from "@/app/components/loading/Backdrop";
import Notification from "@/app/components/Notification";
import ReportFilterPanel from "@/app/components/reports/ReportFilterPanel";
import { useUser } from "@/app/utils/useUser";
import formatRupiah from "@/app/components/formatrupiah/page";
import { getWhatsAppPhone } from "@/app/utils/phoneNumber";
import {
  buildReportFileName,
  exportReportToExcel,
  exportReportToPDF,
} from "@/app/utils/reportExportUtils";
import { getDaysLabel } from "../dashboard/dashboardUtils";
import {
  buildPaymentContext,
  normalizePaymentForLeaseDetail,
} from "../payments/paymentDetailMapper";
import {
  PAYMENT_DUE_EXPORT_COLUMNS,
  PAYMENT_DUE_PAGE_SIZE_OPTIONS,
  PAYMENT_DUE_SCROLL_WIDTH,
  buildPaymentDueExportRows,
  createPaymentDueReportColumns,
  filterPaymentDueRows,
} from "./PaymentDueReportTableColumns";

const DEFAULT_LOADING_MESSAGE = "Loading...";
const DEFAULT_STATUS_FILTER = "all";

const PAGE_BREADCRUMBS = [
  {
    label: "Reports",
    value: "reports",
    path: "#",
    icon: "solar:chart-square-bold-duotone",
  },
  {
    label: "Jatuh Tempo Pembayaran",
    value: "payment-due-report",
    path: "/payment-due-report",
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

const buildPaymentDueWhatsAppMessage = (record) => {
  const tenant = record?.tenant_application || {};
  const location = record?.location || {};
  const room = record?.room || {};
  const due = record?.payment_due || {};
  const dueStatus = getDaysLabel(due.days_remaining);
  const dueSentence =
    due.due_status === "overdue"
      ? `telah melewati jatuh tempo (${dueStatus})`
      : `akan jatuh tempo (${dueStatus})`;

  return [
    `Yth. Bapak/Ibu ${tenant.tenant_name || "Penyewa"},`,
    "",
    `Kami informasikan bahwa pembayaran sewa ruangan Anda ${dueSentence}.`,
    "",
    "Detail pembayaran:",
    `- Lokasi: ${location.location_name || "-"}`,
    `- Ruangan: ${room.room_number || "-"}${room.floor ? `, ${room.floor}` : ""}`,
    `- Tahap pembayaran: ${due.payment_step_label || "-"}`,
    `- Nominal: ${formatRupiah(Number(due.due_amount || 0))}`,
    `- Tanggal jatuh tempo: ${formatMessageDate(due.due_date)}`,
    `- Status: ${dueStatus}`,
    "",
    "Mohon segera melakukan pembayaran sesuai ketentuan. Jika pembayaran sudah dilakukan, mohon konfirmasi kepada admin dengan mengirimkan bukti pembayaran.",
    "",
    "Terima kasih.",
    "Perumda Pasar Manado",
  ].join("\n");
};

/**
 * Laporan jatuh tempo pembayaran memperluas kartu dashboard menjadi halaman
 * operasional penuh. Detail tetap memakai modal lease shared supaya identitas,
 * ruangan, biaya, dan riwayat bukti pembayaran konsisten dengan menu Payments.
 */
export default function PaymentDueReportPage() {
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
    message = "Mengambil laporan jatuh tempo pembayaran...",
    notifySuccess = false,
  } = {}) => {
    if (!user || !validateRange(overrideRange)) return;

    if (showLoading) {
      setLoadingMessage(message);
      setLoading(true);
    }

    try {
      const requestRange = getRequestRange(overrideFilter, overrideRange);
      const response = await axios.get("/api/report/payment-due", {
        params: {
          start_date: requestRange.startDate,
          end_date: requestRange.endDate,
        },
      });
      const nextRows = response.data?.data || [];
      setRows(nextRows);

      if (!nextRows.length) {
        showSnackbar(
          "Belum ada pembayaran yang jatuh tempo atau terlambat.",
          "warning",
        );
      } else if (notifySuccess) {
        showSnackbar(
          `Laporan jatuh tempo berhasil ditampilkan (${nextRows.length} data).`,
          "success",
        );
      }
    } catch (error) {
      console.error("Error fetch payment due report:", error);
      showSnackbar(
        error?.response?.data?.message ||
          "Gagal mengambil laporan jatuh tempo pembayaran.",
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
      dueSoon: rows.filter((item) => item.payment_due?.due_status === "dueSoon")
        .length,
      overdue: rows.filter((item) => item.payment_due?.due_status === "overdue")
        .length,
    }),
    [rows],
  );

  const handleFilterChange = (filterValue) => setStatusFilter(filterValue);

  const handleResetFilter = async () => {
    const defaultRange = getDefaultRange();
    setSearchText("");
    setStatusFilter(DEFAULT_STATUS_FILTER);
    setRange(defaultRange);
    await fetchReport({
      overrideFilter: DEFAULT_STATUS_FILTER,
      overrideRange: defaultRange,
      message: "Mereset filter laporan jatuh tempo pembayaran...",
      notifySuccess: true,
    });
  };

  const filteredRows = useMemo(() => {
    const statusRows = filterByStatus(rows, statusFilter);
    return filterPaymentDueRows(statusRows, searchText);
  }, [rows, searchText, statusFilter]);

  const handlePhoneAction = useCallback((record) => {
    const phone = getWhatsAppPhone(record?.tenant_application?.tenant_phone);

    if (!phone) {
      setSnackbar({
        open: true,
        message: "Nomor WhatsApp penyewa belum valid atau belum tersedia.",
        severity: "warning",
      });
      return;
    }

    const message = buildPaymentDueWhatsAppMessage(record);
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }, []);

  const columns = useMemo(
    () =>
      createPaymentDueReportColumns({
        theme,
        onOpenDetail: setSelectedRow,
        onPhoneAction: handlePhoneAction,
        isMobile,
      }),
    [handlePhoneAction, isMobile, theme],
  );

  const exportRows = useMemo(
    () => buildPaymentDueExportRows(filteredRows),
    [filteredRows],
  );

  const activeExportRange = getRequestRange(statusFilter, range);
  const activeFilterLabel = getFilterLabel(statusFilter);
  const filterInfo = [
    { label: "Periode", value: getReportPeriodLabel(statusFilter, activeExportRange) },
    { label: "Filter", value: activeFilterLabel },
    { label: "Total Data", value: `${filteredRows.length} data` },
  ];

  const reportTitle = "Laporan Jatuh Tempo Pembayaran";
  const reportSubtitle =
    "Daftar pembayaran yang akan jatuh tempo dalam 30 hari ke depan atau sudah melewati jatuh tempo.";

  const handleExportExcel = () => {
    exportReportToExcel({
      title: reportTitle,
      subtitle: reportSubtitle,
      filterInfo,
      sheetName: "Jatuh Tempo Pembayaran",
      fileName: buildReportFileName({
        prefix: "Laporan_Jatuh_Tempo_Pembayaran",
        filterName: getExportFilterName(statusFilter),
        startDate: activeExportRange.startDate,
        endDate: activeExportRange.endDate,
        extension: "xlsx",
      }),
      rows: exportRows,
      columns: PAYMENT_DUE_EXPORT_COLUMNS,
    });
  };

  const handleExportPDF = async () => {
    await exportReportToPDF({
      title: reportTitle,
      subtitle: reportSubtitle,
      filterInfo,
      fileName: buildReportFileName({
        prefix: "Laporan_Jatuh_Tempo_Pembayaran",
        filterName: getExportFilterName(statusFilter),
        startDate: activeExportRange.startDate,
        endDate: activeExportRange.endDate,
        extension: "pdf",
      }),
      rows: exportRows,
      columns: PAYMENT_DUE_EXPORT_COLUMNS,
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
        title="Jatuh Tempo Pembayaran"
        description="Pantau pembayaran cicilan yang akan jatuh tempo dalam 30 hari ke depan dan seluruh pembayaran yang sudah melewati jatuh tempo."
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
        description="Pilih rentang tanggal jatuh tempo, lalu gunakan filter cepat untuk melihat semua data, 30 hari lagi, atau yang terlambat."
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
        onPresetChange={handleFilterChange}
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
        title="Daftar Jatuh Tempo Pembayaran"
        description={`${filteredRows.length} dari ${rows.length} pembayaran ditampilkan`}
        searchValue={searchText}
        searchPlaceholder="Cari penyewa, NIK, lokasi, ruangan, pembayaran"
        onSearchChange={setSearchText}
        headerAction={
          <TableExportButton
            disabled={!filteredRows.length}
            ariaLabel="Export laporan jatuh tempo pembayaran"
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
          pageSizeOptions={PAYMENT_DUE_PAGE_SIZE_OPTIONS}
          onPageSizeChange={setPageSize}
          scroll={{ x: PAYMENT_DUE_SCROLL_WIDTH, y: 560 }}
          pagination={{ total: filteredRows.length }}
          fixedActionColumn={{
            className: "payment-due-action-cell",
            buttonsClassName: "payment-due-action-buttons",
            width: 152,
            paddingX: 14,
          }}
        />
      </DataTableShell>

      <TenantLeaseDetailModal
        open={Boolean(selectedRow)}
        onClose={() => setSelectedRow(null)}
        selectedData={normalizePaymentForLeaseDetail(selectedRow)}
        paymentContext={buildPaymentContext(selectedRow)}
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
