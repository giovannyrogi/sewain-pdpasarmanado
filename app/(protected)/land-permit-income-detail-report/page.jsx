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
  LAND_PERMIT_INCOME_DETAIL_EXPORT_COLUMNS,
  LAND_PERMIT_INCOME_DETAIL_SCROLL_WIDTH,
  buildLandPermitIncomeDetailExportRows,
  buildLandPermitIncomeDetailTotalRow,
  createLandPermitIncomeDetailColumns,
  filterLandPermitIncomeDetailRows,
} from "./LandPermitIncomeDetailColumns";
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
    label: "Detail Pendapatan",
    value: "land-permit-income-detail-report",
    path: "/land-permit-income-detail-report",
    icon: "solar:document-text-bold-duotone",
  },
];

export default function LandPermitIncomeDetailReportPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const report = useLandPermitIncomeReport();
  const [detailSearch, setDetailSearch] = useState("");
  const [detailPageSize, setDetailPageSize] = useState(10);

  const filteredDetailRows = useMemo(
    () => filterLandPermitIncomeDetailRows(report.detailRows, detailSearch),
    [report.detailRows, detailSearch],
  );

  const detailSummaryRow = useMemo(
    () =>
      filteredDetailRows.length
        ? buildLandPermitIncomeDetailTotalRow(filteredDetailRows)
        : null,
    [filteredDetailRows],
  );

  const detailColumns = useMemo(
    () => createLandPermitIncomeDetailColumns({ isMobile }),
    [isMobile],
  );

  const handleResetFilter = async () => {
    setDetailSearch("");
    await report.handleResetFilter();
  };

  const handleExport = async (type) => {
    if (!report.hasSearched || !filteredDetailRows.length) {
      report.setSnackbar({
        open: true,
        message: "Cari data detail pendapatan terlebih dahulu sebelum export.",
        severity: "warning",
      });
      return;
    }

    const detailTotal = buildLandPermitIncomeDetailTotalRow(filteredDetailRows);
    const fileName = (extension) =>
      buildReportFileName({
        prefix: "laporan-detail-pendapatan-izin-lahan",
        startDate: report.range.startDate,
        endDate: report.range.endDate,
        filterName: `${report.selectedLocationLabel}-${report.selectedSectorLabel}`,
        extension,
      });

    const exportPayload = {
      title: "Laporan Detail Pendapatan Izin Lahan",
      subtitle: "Detail transaksi pembayaran izin lahan yang sudah divalidasi.",
      filterInfo: report.exportFilterInfo,
      fileName: fileName(type === "excel" ? "xlsx" : "pdf"),
      rows: buildLandPermitIncomeDetailExportRows(filteredDetailRows),
      columns: LAND_PERMIT_INCOME_DETAIL_EXPORT_COLUMNS,
      totalsRow: {
        no: "TOTAL",
        total_land_price: detailTotal.total_land_price,
        total_payment: detailTotal.total_payment,
      },
    };

    await report.runWithLoading("Menyiapkan export detail pendapatan...", async () => {
      if (type === "excel") {
        await exportReportToExcel({
          ...exportPayload,
          sheetName: "Detail Pendapatan",
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
          title="Detail Pendapatan"
          description="Pantau transaksi pendapatan izin lahan yang sudah divalidasi Divisi Keuangan."
          breadcrumbs={PAGE_BREADCRUMBS}
          icon="solar:document-text-bold-duotone"
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
          title="Detail Pendapatan"
          description={
            report.hasSearched
              ? `${filteredDetailRows.length} transaksi ditampilkan`
              : "Klik Cari Data untuk menampilkan detail pendapatan."
          }
          searchValue={detailSearch}
          searchPlaceholder="Cari pedagang, NIK, dokumen, lokasi, sektor, atau lahan"
          onSearchChange={setDetailSearch}
          headerAction={
            <TableExportButton
              disabled={!report.hasSearched || !filteredDetailRows.length}
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
