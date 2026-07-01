"use client";

import React, { useMemo, useState } from "react";
import { Box, Stack, useMediaQuery, useTheme } from "@mui/material";
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
import {
  LAND_PERMIT_INCOME_SECTOR_EXPORT_COLUMNS,
  LAND_PERMIT_INCOME_SECTOR_RECAP_SCROLL_WIDTH,
  buildLandPermitIncomeSectorTotalRow,
  buildLandPermitIncomeSectorExportRows,
  createLandPermitIncomeSectorColumns,
  filterLandPermitIncomeSectorRows,
} from "./LandPermitIncomeSectorColumns";
import {
  LAND_PERMIT_INCOME_PAGE_SIZE_OPTIONS,
  LAND_PERMIT_INCOME_ROOT_BREADCRUMB,
  LandPermitIncomeFilterFields,
  landPermitIncomePageSx,
  useLandPermitIncomeReport,
} from "@/app/components/reports/LandPermitIncomeReportShared";

const PAGE_BREADCRUMBS = [
  LAND_PERMIT_INCOME_ROOT_BREADCRUMB,
  {
    label: "Pendapatan per Sektor",
    value: "land-permit-income-sector-report",
    path: "/land-permit-income-sector-report",
    icon: "solar:chart-2-bold-duotone",
  },
];

export default function LandPermitIncomeSectorReportPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const report = useLandPermitIncomeReport();
  const [sectorSearch, setSectorSearch] = useState("");
  const [sectorPageSize, setSectorPageSize] = useState(10);

  const filteredSectorRows = useMemo(
    () => filterLandPermitIncomeSectorRows(report.sectorRecapRows, sectorSearch),
    [report.sectorRecapRows, sectorSearch],
  );

  const sectorSummaryRow = useMemo(
    () =>
      filteredSectorRows.length
        ? buildLandPermitIncomeSectorTotalRow(filteredSectorRows)
        : null,
    [filteredSectorRows],
  );

  const sectorColumns = useMemo(
    () => createLandPermitIncomeSectorColumns({ isMobile }),
    [isMobile],
  );

  const handleResetFilter = async () => {
    setSectorSearch("");
    await report.handleResetFilter();
  };

  const handleExport = async (type) => {
    if (!report.hasSearched || !filteredSectorRows.length) {
      report.setSnackbar({
        open: true,
        message: "Cari data pendapatan per sektor terlebih dahulu sebelum export.",
        severity: "warning",
      });
      return;
    }

    const sectorTotal = buildLandPermitIncomeSectorTotalRow(filteredSectorRows);
    const fileName = (extension) =>
      buildReportFileName({
        prefix: "laporan-pendapatan-per-sektor-izin-lahan",
        startDate: report.range.startDate,
        endDate: report.range.endDate,
        filterName: `${report.selectedLocationLabel}-${report.selectedSectorLabel}`,
        extension,
      });

    const exportPayload = {
      title: "Laporan Pendapatan per Sektor Izin Lahan",
      subtitle: "Rekap pendapatan izin lahan berdasarkan lokasi dan sektor.",
      filterInfo: report.exportFilterInfo,
      fileName: fileName(type === "excel" ? "xlsx" : "pdf"),
      rows: buildLandPermitIncomeSectorExportRows(filteredSectorRows),
      columns: LAND_PERMIT_INCOME_SECTOR_EXPORT_COLUMNS,
      totalsRow: {
        no: "TOTAL",
        trader_count: sectorTotal.trader_count,
        total_income: sectorTotal.total_income,
      },
    };

    await report.runWithLoading("Menyiapkan export pendapatan per sektor...", async () => {
      if (type === "excel") {
        await exportReportToExcel({
          ...exportPayload,
          sheetName: "Pendapatan per Sektor",
        });
        return;
      }

      await exportReportToPDF(exportPayload);
    });
  };

  return (
    <Box sx={landPermitIncomePageSx(theme)}>
      <Stack spacing={{ xs: 1.5, sm: 2 }}>
        <PageHeader
          title="Pendapatan per Sektor"
          description="Pantau ringkasan pendapatan izin lahan berdasarkan sektor di setiap lokasi."
          breadcrumbs={PAGE_BREADCRUMBS}
          icon="solar:chart-2-bold-duotone"
        />

        <ReportFilterPanel
          range={report.range}
          selectedPreset={report.selectedPreset}
          onPresetChange={report.handlePresetChange}
          onRangeChange={report.handleRangeChange}
          onApply={report.fetchReport}
          onReset={handleResetFilter}
          isSubmitting={report.loading}
          resetPickerToTodayOnOpen
          primaryFilters={
            <LandPermitIncomeFilterFields
              theme={theme}
              locations={report.locations}
              sectors={report.sectors}
              selectedLocationId={report.selectedLocationId}
              selectedSectorId={report.selectedSectorId}
              onLocationChange={report.handleLocationChange}
              onSectorChange={report.setSelectedSectorId}
            />
          }
        />

        <DataTableShell
          title="Pendapatan per Sektor"
          description={
            report.hasSearched
              ? `${filteredSectorRows.length} sektor ditampilkan`
              : "Klik Cari Data untuk menampilkan pendapatan per sektor."
          }
          searchValue={sectorSearch}
          searchPlaceholder="Cari lokasi atau sektor"
          onSearchChange={setSectorSearch}
          headerAction={
            <TableExportButton
              disabled={!report.hasSearched || !filteredSectorRows.length}
              items={[
                {
                  label: "Export Excel",
                  icon: "vscode-icons:file-type-excel",
                  onClick: () => handleExport("excel"),
                },
                {
                  label: "Export PDF",
                  icon: "vscode-icons:file-type-pdf2",
                  onClick: () => handleExport("pdf"),
                },
              ]}
            />
          }
        >
          <ReusableAntTable
            rowKey="key"
            columns={sectorColumns}
            dataSource={filteredSectorRows}
            pageSize={sectorPageSize}
            onPageSizeChange={setSectorPageSize}
            pageSizeOptions={LAND_PERMIT_INCOME_PAGE_SIZE_OPTIONS}
            scroll={{ x: LAND_PERMIT_INCOME_SECTOR_RECAP_SCROLL_WIDTH }}
            summaryRow={sectorSummaryRow}
          />
        </DataTableShell>
      </Stack>

      <LoadingBackdrop open={report.loading} message={report.loadingMessage} />
      <Notification
        open={report.snackbar.open}
        message={report.snackbar.message}
        severity={report.snackbar.severity}
        onClose={() =>
          report.setSnackbar((prev) => ({ ...prev, open: false }))
        }
      />
    </Box>
  );
}
