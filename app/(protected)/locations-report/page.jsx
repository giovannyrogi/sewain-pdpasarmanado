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
  LOCATION_EXPORT_COLUMNS,
  LOCATION_REPORT_PAGE_SIZE_OPTIONS,
  LOCATION_REPORT_SCROLL_WIDTH,
  createLocationReportColumns,
  filterLocationReportRows,
} from "./LocationsReportTableColumns";

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
    label: "Laporan per Lokasi",
    value: "locations-report",
    path: "/locations-report",
    icon: "solar:map-point-wave-bold-duotone",
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
      startDate: today.clone().subtract(1, "week").startOf("week").format("YYYY-MM-DD"),
      endDate: today.format("YYYY-MM-DD"),
    };
  }

  if (preset === "two_month") {
    return {
      startDate: today.clone().subtract(1, "month").startOf("month").format("YYYY-MM-DD"),
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
 * Report by Locations menampilkan agregasi pendapatan per lokasi.
 * Page ini hanya mengatur state, request API, export, dan orchestration UI.
 */
export default function LocationsReportPage() {
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
      showSnackbar("Tanggal mulai tidak boleh melewati tanggal selesai.", "error");
      return false;
    }

    return true;
  };

  const fetchReport = async ({
    showLoading = true,
    overrideRange = range,
    message = "Mengambil laporan pendapatan lokasi...",
    notifySuccess = false,
  } = {}) => {
    if (!user || !validateRange(overrideRange)) return;

    if (showLoading) {
      setLoadingMessage(message);
      setLoading(true);
    }

    try {
      const locationResponse = await axios.get("/api/report/income-by-locations", {
        params: {
          start_date: overrideRange.startDate,
          end_date: overrideRange.endDate,
        },
      });

      const nextRows = locationResponse.data?.data || [];
      setRows(nextRows);
      setTotals(locationResponse.data?.totals || {});

      if (!nextRows.length) {
        showSnackbar("Tidak ada pendapatan lokasi pada periode ini.", "warning");
      } else if (notifySuccess) {
        showSnackbar(
          `Laporan pendapatan lokasi berhasil ditampilkan (${nextRows.length} data).`,
          "success",
        );
      }
    } catch (error) {
      console.error("Error fetch location report:", error);
      showSnackbar(
        error?.response?.data?.message || "Gagal mengambil laporan lokasi.",
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
      message: "Mereset filter laporan lokasi...",
    });
  };

  const filteredRows = useMemo(
    () => filterLocationReportRows(rows, searchText),
    [rows, searchText],
  );

  const columns = useMemo(
    () => createLocationReportColumns({ theme, isMobile }),
    [theme, isMobile],
  );

  const totalsRow = useMemo(
    () => ({
      location_id: "__total",
      __isTotal: true,
      location_name: "TOTAL",
      income_contracts: totals?.total_contract || 0,
      JTU: totals?.total_JTU || 0,
      income_contract_without_ppn: totals?.total_without_ppn || 0,
      total_ppn: totals?.total_ppn || 0,
      other_amount: totals?.total_other || 0,
      income_contract_with_ppn: totals?.total_with_ppn || 0,
      total_pph: totals?.total_pph || 0,
      total_without_ppn_pph: totals?.total_net || 0,
    }),
    [totals],
  );

  const reportTitle = `Laporan Pendapatan per Lokasi (${moment(range.startDate).format(
    "DD-MM-YYYY",
  )} s/d ${moment(range.endDate).format("DD-MM-YYYY")})`;

  const exportFilterInfo = [
    {
      label: "Periode",
      value: `${moment(range.startDate).format("DD MMMM YYYY")} - ${moment(
        range.endDate,
      ).format("DD MMMM YYYY")}`,
    },
    { label: "Total Data", value: `${filteredRows.length} lokasi` },
  ];

  const handleExportExcel = () => {
    exportReportToExcel({
      title: reportTitle,
      sheetName: "Laporan Lokasi",
      fileName: buildReportFileName({
        prefix: "Laporan_Pendapatan_Lokasi",
        startDate: range.startDate,
        endDate: range.endDate,
        extension: "xlsx",
      }),
      rows: filteredRows,
      columns: LOCATION_EXPORT_COLUMNS,
      printedAtFooter: true,
      showLogoMark: true,
      totalsRow,
    });
  };

  const handleExportPDF = () => {
    exportReportToPDF({
      title: reportTitle,
      fileName: buildReportFileName({
        prefix: "Laporan_Pendapatan_Lokasi",
        startDate: range.startDate,
        endDate: range.endDate,
        extension: "pdf",
      }),
      filterInfo: exportFilterInfo,
      rows: filteredRows,
      columns: LOCATION_EXPORT_COLUMNS,
      totalsRow,
      totalRowMode: "full",
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
        title="Laporan per Lokasi"
        description="Pantau pendapatan sewa berdasarkan lokasi, termasuk kontrak murni, JTU, PPN, PPH, dan total bersih dalam periode laporan."
        icon="solar:map-point-wave-bold-duotone"
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
        title="Daftar Pendapatan per Lokasi"
        description={`${filteredRows.length} dari ${rows.length} lokasi ditampilkan`}
        searchValue={searchText}
        searchPlaceholder="Cari nama lokasi"
        onSearchChange={setSearchText}
        headerAction={
          <TableExportButton
            disabled={!filteredRows.length}
            ariaLabel="Export laporan lokasi"
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
          rowKey="location_id"
          columns={columns}
          dataSource={filteredRows}
          pageSize={pageSize}
          pageSizeOptions={LOCATION_REPORT_PAGE_SIZE_OPTIONS}
          onPageSizeChange={setPageSize}
          scroll={{ x: LOCATION_REPORT_SCROLL_WIDTH, y: 520 }}
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
