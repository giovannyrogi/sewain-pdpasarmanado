"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  MenuItem,
  Stack,
  TextField,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import axios from "axios";
import moment from "moment";
import PageHeader from "@/app/components/page-header/PageHeader";
import DataTableShell from "@/app/components/data-table/DataTableShell";
import ReusableAntTable from "@/app/components/data-table/ReusableAntTable";
import TableExportButton from "@/app/components/data-table/TableExportButton";
import LoadingBackdrop from "@/app/components/loading/Backdrop";
import Notification from "@/app/components/Notification";
import ReportFilterPanel from "@/app/components/reports/ReportFilterPanel";
import {
  buildReportFileName,
  exportReportToExcel,
  exportReportToPDF,
} from "@/app/utils/reportExportUtils";
import formatRupiah from "@/app/components/formatrupiah/page";
import {
  LAND_PERMIT_INCOME_DETAIL_EXPORT_COLUMNS,
  LAND_PERMIT_INCOME_DETAIL_SCROLL_WIDTH,
  LAND_PERMIT_INCOME_PAGE_SIZE_OPTIONS,
  LAND_PERMIT_INCOME_RECAP_EXPORT_COLUMNS,
  LAND_PERMIT_INCOME_RECAP_SCROLL_WIDTH,
  buildLandPermitIncomeDetailExportRows,
  buildLandPermitIncomeDetailTotalRow,
  buildLandPermitIncomeRecapExportRows,
  buildLandPermitIncomeRecapTotalRow,
  createLandPermitIncomeDetailColumns,
  createLandPermitIncomeRecapColumns,
  filterLandPermitIncomeRows,
} from "./LandPermitIncomeReportTableColumns";

const DEFAULT_LOADING_MESSAGE = "Loading...";

const PAGE_BREADCRUMBS = [
  {
    label: "Laporan Izin Lahan",
    value: "land-permit-reports",
    path: "#",
    icon: "solar:chart-square-bold-duotone",
  },
  {
    label: "Pendapatan Izin Lahan",
    value: "land-permit-income-report",
    path: "/land-permit-income-report",
    icon: "solar:wallet-money-bold-duotone",
  },
];

const getDefaultRange = () => ({
  startDate: moment().format("YYYY-MM-DD"),
  endDate: moment().format("YYYY-MM-DD"),
});

const getPresetRange = (preset) => {
  const today = moment();

  if (preset === "month") {
    return {
      startDate: today.clone().startOf("month").format("YYYY-MM-DD"),
      endDate: today.format("YYYY-MM-DD"),
    };
  }

  if (preset === "two_month") {
    return {
      startDate: today.clone().subtract(2, "months").startOf("day").format("YYYY-MM-DD"),
      endDate: today.format("YYYY-MM-DD"),
    };
  }

  if (preset === "week") {
    return {
      startDate: today.clone().subtract(1, "week").startOf("day").format("YYYY-MM-DD"),
      endDate: today.format("YYYY-MM-DD"),
    };
  }

  if (preset === "two_week") {
    return {
      startDate: today.clone().subtract(2, "weeks").startOf("day").format("YYYY-MM-DD"),
      endDate: today.format("YYYY-MM-DD"),
    };
  }

  return getDefaultRange();
};

const formatRangeLabel = (range) =>
  `${moment(range.startDate).format("DD MMMM YYYY")} - ${moment(
    range.endDate,
  ).format("DD MMMM YYYY")}`;

const selectFieldSx = (theme) => ({
  minWidth: { xs: "100%", md: 240 },
  "& .MuiOutlinedInput-root": {
    borderRadius: 2,
    fontFamily: "Poppins",
    bgcolor:
      theme.palette.mode === "dark"
        ? "rgba(255,255,255,0.04)"
        : "rgba(17,24,39,0.03)",
  },
  "& .MuiInputLabel-root": {
    fontFamily: "Poppins",
    fontWeight: 600,
  },
});

export default function LandPermitIncomeReportPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [range, setRange] = useState(getDefaultRange);
  const [selectedPreset, setSelectedPreset] = useState("custom");
  const [selectedLocationId, setSelectedLocationId] = useState("all");
  const [selectedSectorId, setSelectedSectorId] = useState("all");
  const [locations, setLocations] = useState([]);
  const [sectors, setSectors] = useState([]);
  const [recapRows, setRecapRows] = useState([]);
  const [detailRows, setDetailRows] = useState([]);
  const [recapSearch, setRecapSearch] = useState("");
  const [detailSearch, setDetailSearch] = useState("");
  const [recapPageSize, setRecapPageSize] = useState(10);
  const [detailPageSize, setDetailPageSize] = useState(10);
  const [hasSearched, setHasSearched] = useState(false);
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

  const fetchSectors = useCallback(async (locationId = "all") => {
    const response = await axios.get("/api/land-sectors", {
      params: locationId !== "all" ? { location_id: locationId } : undefined,
    });
    setSectors(response.data?.data || []);
  }, []);

  const fetchFilterOptions = useCallback(async () => {
    try {
      const [locationsResponse] = await Promise.all([
        axios.get("/api/locations"),
        fetchSectors("all"),
      ]);
      setLocations(locationsResponse.data?.data || []);
    } catch (error) {
      console.error("Error fetching land permit income report filters:", error);
      showSnackbar(
        error?.response?.data?.message || "Gagal memuat filter laporan izin lahan.",
        "error",
      );
    }
  }, [fetchSectors]);

  useEffect(() => {
    fetchFilterOptions();
  }, [fetchFilterOptions]);

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

  const handleLocationChange = async (event) => {
    const nextLocationId = event.target.value;
    setSelectedLocationId(nextLocationId);
    setSelectedSectorId("all");

    try {
      await fetchSectors(nextLocationId);
    } catch (error) {
      console.error("Error fetching sectors by location:", error);
      showSnackbar(
        error?.response?.data?.message || "Gagal memuat sektor sesuai lokasi.",
        "error",
      );
    }
  };

  const handlePresetChange = (preset) => {
    setSelectedPreset(preset);
    setRange(getPresetRange(preset));
  };

  const handleRangeChange = (nextRange) => {
    setRange(nextRange);
    setSelectedPreset("custom");
  };

  const handleResetFilter = async () => {
    setRange(getDefaultRange());
    setSelectedPreset("custom");
    setSelectedLocationId("all");
    setSelectedSectorId("all");
    setRecapSearch("");
    setDetailSearch("");
    setRecapRows([]);
    setDetailRows([]);
    setHasSearched(false);

    try {
      await fetchSectors("all");
    } catch (error) {
      console.error("Error resetting sector filter:", error);
    }
  };

  const fetchReport = async () => {
    if (!validateRange()) return;

    setLoadingMessage("Mengambil laporan pendapatan izin lahan...");
    setLoading(true);

    try {
      const response = await axios.get("/api/report/land-permit-income", {
        params: {
          start_date: range.startDate,
          end_date: range.endDate,
          location_id: selectedLocationId,
          sector_id: selectedSectorId,
        },
      });

      const reportData = response.data?.data || {};
      const nextRecapRows = reportData.recap || [];
      const nextDetailRows = reportData.detail || [];

      setRecapRows(nextRecapRows);
      setDetailRows(nextDetailRows);
      setHasSearched(true);

      if (!nextDetailRows.length) {
        showSnackbar("Tidak ada pendapatan izin lahan pada filter ini.", "warning");
      } else {
        showSnackbar(
          `Laporan pendapatan izin lahan berhasil ditampilkan (${nextDetailRows.length} transaksi).`,
          "success",
        );
      }
    } catch (error) {
      console.error("Error fetching land permit income report:", error);
      showSnackbar(
        error?.response?.data?.message ||
          "Gagal mengambil laporan pendapatan izin lahan.",
        "error",
      );
    } finally {
      setLoading(false);
      setLoadingMessage(DEFAULT_LOADING_MESSAGE);
    }
  };

  const selectedLocationLabel = useMemo(() => {
    if (selectedLocationId === "all") return "Semua Lokasi";
    return (
      locations.find((location) => String(location.id) === String(selectedLocationId))
        ?.location_name || "Lokasi Terpilih"
    );
  }, [locations, selectedLocationId]);

  const selectedSectorLabel = useMemo(() => {
    if (selectedSectorId === "all") return "Semua Sektor";
    return (
      sectors.find((sector) => String(sector.id) === String(selectedSectorId))
        ?.sector_name || "Sektor Terpilih"
    );
  }, [sectors, selectedSectorId]);

  const filteredRecapRows = useMemo(
    () => filterLandPermitIncomeRows(recapRows, recapSearch),
    [recapRows, recapSearch],
  );

  const filteredDetailRows = useMemo(
    () => filterLandPermitIncomeRows(detailRows, detailSearch),
    [detailRows, detailSearch],
  );

  const recapSummaryRow = useMemo(
    () =>
      filteredRecapRows.length
        ? buildLandPermitIncomeRecapTotalRow(filteredRecapRows)
        : null,
    [filteredRecapRows],
  );

  const detailSummaryRow = useMemo(
    () =>
      filteredDetailRows.length
        ? buildLandPermitIncomeDetailTotalRow(filteredDetailRows)
        : null,
    [filteredDetailRows],
  );

  const recapColumns = useMemo(
    () => createLandPermitIncomeRecapColumns({ isMobile }),
    [isMobile],
  );

  const detailColumns = useMemo(
    () => createLandPermitIncomeDetailColumns({ isMobile }),
    [isMobile],
  );

  const exportFilterInfo = useMemo(
    () => [
      { label: "Periode", value: formatRangeLabel(range) },
      { label: "Lokasi", value: selectedLocationLabel },
      { label: "Sektor", value: selectedSectorLabel },
      { label: "Total Transaksi", value: `${detailRows.length} transaksi` },
      {
        label: "Total Pendapatan",
        value: formatRupiah(
          detailRows.reduce((sum, row) => sum + Number(row.total_payment || 0), 0),
        ),
      },
    ],
    [detailRows, range, selectedLocationLabel, selectedSectorLabel],
  );

  const handleExport = async (type) => {
    if (!hasSearched || !detailRows.length) {
      showSnackbar("Cari data laporan terlebih dahulu sebelum export.", "warning");
      return;
    }

    const fileName = (extension) =>
      buildReportFileName({
        prefix: "laporan-pendapatan-izin-lahan",
        startDate: range.startDate,
        endDate: range.endDate,
        filterName: `${selectedLocationLabel}-${selectedSectorLabel}`,
        extension,
      });

    const recapExportRows = buildLandPermitIncomeRecapExportRows(recapRows);
    const detailExportRows = buildLandPermitIncomeDetailExportRows(detailRows);
    const recapTotal = buildLandPermitIncomeRecapTotalRow(recapRows);
    const detailTotal = buildLandPermitIncomeDetailTotalRow(detailRows);

    const sections = [
      {
        title: "Rekap Pendapatan",
        sheetName: "Rekap",
        rows: recapExportRows,
        columns: LAND_PERMIT_INCOME_RECAP_EXPORT_COLUMNS,
        totalsRow: {
          no: "TOTAL",
          transaction_count: recapTotal.transaction_count,
          trader_count: recapTotal.trader_count,
          total_income: recapTotal.total_income,
        },
      },
      {
        title: "Detail Pendapatan",
        sheetName: "Detail",
        rows: detailExportRows,
        columns: LAND_PERMIT_INCOME_DETAIL_EXPORT_COLUMNS,
        totalsRow: {
          no: "TOTAL",
          total_payment: detailTotal.total_payment,
        },
      },
    ];

    if (type === "excel") {
      await exportReportToExcel({
        title: "Laporan Pendapatan Izin Lahan",
        subtitle: "Pendapatan berdasarkan pembayaran izin lahan yang sudah divalidasi.",
        filterInfo: exportFilterInfo,
        fileName: fileName("xlsx"),
        sections,
      });
      return;
    }

    await exportReportToPDF({
      title: "Laporan Pendapatan Izin Lahan",
      subtitle: "Pendapatan berdasarkan pembayaran izin lahan yang sudah divalidasi.",
      filterInfo: exportFilterInfo,
      fileName: fileName("pdf"),
      sections,
    });
  };

  return (
    <Box
      sx={{
        minHeight: "calc(100vh - 64px)",
        width: "100%",
        bgcolor: theme.ui.dashboardBg,
        px: { xs: 1, sm: 2, lg: 2.5 },
        py: { xs: 1.25, sm: 2, lg: 2.5 },
      }}
    >
      <Stack spacing={{ xs: 1.5, sm: 2 }}>
        <PageHeader
          title="Pendapatan Izin Lahan"
          description="Pantau pendapatan izin lahan berdasarkan pembayaran yang sudah divalidasi Divisi Keuangan."
          breadcrumbs={PAGE_BREADCRUMBS}
          icon="solar:wallet-money-bold-duotone"
        />

        <ReportFilterPanel
          range={range}
          selectedPreset={selectedPreset}
          onPresetChange={handlePresetChange}
          onRangeChange={handleRangeChange}
          onApply={fetchReport}
          onReset={handleResetFilter}
          resetPickerToTodayOnOpen
        >
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={1.25}
            sx={{ width: "100%" }}
          >
            <TextField
              select
              size="small"
              label="Lokasi"
              value={selectedLocationId}
              onChange={handleLocationChange}
              sx={selectFieldSx(theme)}
            >
              <MenuItem value="all">Semua Lokasi</MenuItem>
              {locations.map((location) => (
                <MenuItem key={location.id} value={String(location.id)}>
                  {location.location_name}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              size="small"
              label="Sektor"
              value={selectedSectorId}
              onChange={(event) => setSelectedSectorId(event.target.value)}
              sx={selectFieldSx(theme)}
            >
              <MenuItem value="all">Semua Sektor</MenuItem>
              {sectors.map((sector) => (
                <MenuItem key={sector.id} value={String(sector.id)}>
                  {sector.sector_name}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        </ReportFilterPanel>

        <DataTableShell
          title="Rekap Pendapatan"
          description={
            hasSearched
              ? `${filteredRecapRows.length} rekap ditampilkan`
              : "Klik Cari Data untuk menampilkan rekap pendapatan."
          }
          searchValue={recapSearch}
          searchPlaceholder="Cari lokasi atau sektor"
          onSearchChange={setRecapSearch}
          headerAction={
            <TableExportButton
              disabled={!hasSearched || !detailRows.length}
              items={[
                {
                  label: "Export Excel",
                  icon: "solar:file-text-bold-duotone",
                  onClick: () => handleExport("excel"),
                },
                {
                  label: "Export PDF",
                  icon: "solar:file-download-bold-duotone",
                  onClick: () => handleExport("pdf"),
                },
              ]}
            />
          }
        >
          <ReusableAntTable
            rowKey="key"
            columns={recapColumns}
            dataSource={filteredRecapRows}
            pageSize={recapPageSize}
            onPageSizeChange={setRecapPageSize}
            pageSizeOptions={LAND_PERMIT_INCOME_PAGE_SIZE_OPTIONS}
            scroll={{ x: LAND_PERMIT_INCOME_RECAP_SCROLL_WIDTH }}
            summaryRow={recapSummaryRow}
          />
        </DataTableShell>

        <DataTableShell
          title="Detail Pendapatan"
          description={
            hasSearched
              ? `${filteredDetailRows.length} transaksi ditampilkan`
              : "Klik Cari Data untuk menampilkan detail pendapatan."
          }
          searchValue={detailSearch}
          searchPlaceholder="Cari pedagang, NIK, dokumen, lokasi, sektor, atau lapak"
          onSearchChange={setDetailSearch}
        >
          <ReusableAntTable
            rowKey="key"
            columns={detailColumns}
            dataSource={filteredDetailRows}
            pageSize={detailPageSize}
            onPageSizeChange={setDetailPageSize}
            pageSizeOptions={LAND_PERMIT_INCOME_PAGE_SIZE_OPTIONS}
            scroll={{ x: LAND_PERMIT_INCOME_DETAIL_SCROLL_WIDTH }}
            summaryRow={detailSummaryRow}
          />
        </DataTableShell>
      </Stack>

      <LoadingBackdrop open={loading} message={loadingMessage} />
      <Notification
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
      />
    </Box>
  );
}
