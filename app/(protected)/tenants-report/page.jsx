"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Box, useMediaQuery, useTheme } from "@mui/material";
import axios from "axios";
import moment from "moment";
import "moment/locale/id";
import PageHeader from "@/app/components/page-header/PageHeader";
import DataTableShell from "@/app/components/data-table/DataTableShell";
import ReusableAntTable from "@/app/components/data-table/ReusableAntTable";
import TableExportButton from "@/app/components/data-table/TableExportButton";
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
  TENANT_EXPORT_COLUMNS,
  TENANT_REPORT_PAGE_SIZE_OPTIONS,
  TENANT_REPORT_SCROLL_WIDTH,
  createTenantReportColumns,
  filterTenantReportRows,
} from "./TenantsReportTableColumns";

moment.locale("id");

const DEFAULT_LOADING_MESSAGE = "Loading...";

const PAGE_BREADCRUMBS = [
  {
    label: "Laporan",
    value: "reports",
    path: "#",
    icon: "solar:chart-square-bold-duotone",
  },
  {
    label: "Laporan per Penyewa",
    value: "tenants-report",
    path: "/tenants-report",
    icon: "solar:users-group-rounded-bold-duotone",
  },
];

const getPresetRange = (preset) => {
  const today = moment();

  if (preset === "week") {
    return {
      startDate: today.clone().startOf("week").format("YYYY-MM-DD"),
      endDate: today.format("YYYY-MM-DD"),
    };
  }

  if (preset === "two_week") {
    return {
      startDate: today
        .clone()
        .subtract(1, "week")
        .startOf("week")
        .format("YYYY-MM-DD"),
      endDate: today.format("YYYY-MM-DD"),
    };
  }

  if (preset === "two_month") {
    return {
      startDate: today
        .clone()
        .subtract(1, "month")
        .startOf("month")
        .format("YYYY-MM-DD"),
      endDate: today.format("YYYY-MM-DD"),
    };
  }

  if (preset === "month") {
    return {
      startDate: today.clone().startOf("month").format("YYYY-MM-DD"),
      endDate: today.format("YYYY-MM-DD"),
    };
  }

  return {
    startDate: today.format("YYYY-MM-DD"),
    endDate: today.format("YYYY-MM-DD"),
  };
};

/**
 * Report by Tenants menampilkan rincian pendapatan per transaksi pembayaran.
 * Detail table dipisah agar page tetap fokus pada data flow dan export laporan.
 */
export default function TenantsReportPage() {
  const { user } = useUser();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [rows, setRows] = useState([]);
  const [totals, setTotals] = useState({});
  const [range, setRange] = useState(getPresetRange("month"));
  const [selectedPreset, setSelectedPreset] = useState("month");
  const [searchText, setSearchText] = useState("");
  const [pageSize, setPageSize] = useState(10);
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
    overrideRange = range,
    message = "Mengambil laporan pendapatan tenant...",
    notifySuccess = false,
  } = {}) => {
    if (!user || !validateRange(overrideRange)) return;

    if (showLoading) {
      setLoadingMessage(message);
      setLoading(true);
    }

    try {
      const response = await axios.get("/api/report/income-by-tenants", {
        params: {
          start_date: overrideRange.startDate,
          end_date: overrideRange.endDate,
        },
      });

      const nextRows = response.data?.data || [];
      setRows(nextRows);
      setTotals(response.data?.totals || {});

      if (!nextRows.length) {
        showSnackbar(
          "Tidak ada pendapatan tenant pada periode ini.",
          "warning",
        );
      } else if (notifySuccess) {
        showSnackbar(
          `Laporan pendapatan tenant berhasil ditampilkan (${nextRows.length} data).`,
          "success",
        );
      }
    } catch (error) {
      console.error("Error fetch tenant report:", error);
      showSnackbar(
        error?.response?.data?.message || "Gagal mengambil laporan tenant.",
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

  const handlePresetChange = (preset) => {
    setSelectedPreset(preset);
    if (preset !== "custom") {
      setRange(getPresetRange(preset));
    }
  };

  const handleResetFilter = async () => {
    const defaultRange = getPresetRange("month");
    setSearchText("");
    setSelectedPreset("month");
    setRange(defaultRange);
    await fetchReport({
      overrideRange: defaultRange,
      message: "Mereset filter laporan tenant...",
    });
  };

  const filteredRows = useMemo(
    () => filterTenantReportRows(rows, searchText),
    [rows, searchText],
  );

  const columns = useMemo(
    () => createTenantReportColumns({ theme, isMobile }),
    [theme, isMobile],
  );

  const totalsRow = useMemo(
    () => ({
      payment_id: "__total",
      __isTotal: true,
      no: "TOTAL",
      tenant_name: "TOTAL",
      payment_date: "",
      keterangan: "",
      room_number: "",
      masa_berlaku: "",
      ukuran_m2: "",
      harga_m2: "",
      kontrak: totals?.total_contract || 0,
      jtu: totals?.total_JTU || 0,
      total_kontrak_tanpa_ppn: totals?.total_without_ppn || 0,
      total_ppn: totals?.total_ppn || 0,
      other_amount: totals?.total_other || 0,
      total_plus_ppn: totals?.total_with_ppn || 0,
      total_pph: totals?.total_pph || 0,
      total_after_pph_and_no_ppn: totals?.total_net || 0,
    }),
    [totals],
  );

  const reportTitle = `Laporan Pendapatan Per Penyewa`;

  const exportFilterInfo = [
    {
      label: "Periode",
      value: `${moment(range.startDate).format("DD MMMM YYYY")} - ${moment(
        range.endDate,
      ).format("DD MMMM YYYY")}`,
    },
    { label: "Total Data", value: `${filteredRows.length} transaksi` },
  ];

  const handleExportExcel = () => {
    const exportRows = filteredRows.map((row, index) => ({
      ...row,
      no: index + 1,
    }));

    exportReportToExcel({
      title: reportTitle,
      sheetName: "Laporan Tenant",
      fileName: buildReportFileName({
        prefix: "Laporan_Pendapatan_Tenant",
        startDate: range.startDate,
        endDate: range.endDate,
        extension: "xlsx",
      }),
      rows: exportRows,
      columns: TENANT_EXPORT_COLUMNS,
      totalsRow,
    });
  };

  const handleExportPDF = () => {
    const exportRows = filteredRows.map((row, index) => ({
      ...row,
      no: index + 1,
    }));

    exportReportToPDF({
      title: reportTitle,
      subtitle:
        "Laporan ini menyajikan rekapitulasi pendapatan sewa ruangan per penyewa berdasarkan transaksi pembayaran pada periode terpilih.",
      fileName: buildReportFileName({
        prefix: "Laporan_Pendapatan_Tenant",
        startDate: range.startDate,
        endDate: range.endDate,
        extension: "pdf",
      }),
      filterInfo: exportFilterInfo,
      rows: exportRows,
      columns: TENANT_EXPORT_COLUMNS,
      totalsRow,
      showLogoMark: true,
      printedAtFooter: true,
      totalRowMode: "mergedLeading",
      totalMergeUntilKey: "harga_m2",
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
        title="Laporan per Penyewa"
        description="Lihat rincian pendapatan setiap penyewa berdasarkan transaksi pembayaran, status cicilan/lunas, PPN, PPH, dan total bersih."
        icon="solar:users-group-rounded-bold-duotone"
      />

      <ReportFilterPanel
        range={range}
        selectedPreset={selectedPreset}
        onPresetChange={handlePresetChange}
        onRangeChange={(nextRange) => {
          setSelectedPreset("custom");
          setRange(nextRange);
        }}
        onApply={() => fetchReport({ notifySuccess: true })}
        onReset={handleResetFilter}
        isSubmitting={loading}
        isResetting={loadingMessage.includes("Mereset")}
      />

      <DataTableShell
        title="Daftar Pendapatan per Tenant"
        description={`${filteredRows.length} dari ${rows.length} transaksi ditampilkan`}
        searchValue={searchText}
        searchPlaceholder="Cari penyewa, ruangan, masa berlaku, status"
        onSearchChange={setSearchText}
        headerAction={
          <TableExportButton
            disabled={!filteredRows.length}
            ariaLabel="Export laporan tenant"
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
          rowKey="payment_id"
          columns={columns}
          dataSource={filteredRows}
          pageSize={pageSize}
          pageSizeOptions={TENANT_REPORT_PAGE_SIZE_OPTIONS}
          onPageSizeChange={setPageSize}
          scroll={{ x: TENANT_REPORT_SCROLL_WIDTH, y: 560 }}
          pagination={{ total: filteredRows.length }}
          summaryRow={filteredRows.length ? totalsRow : null}
        />
      </DataTableShell>

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
