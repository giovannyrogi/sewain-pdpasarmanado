"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Autocomplete,
  Box,
  Button,
  TextField,
  useMediaQuery,
  useTheme,
} from "@mui/material";
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
import LandStallNotesModal from "../land-stalls/LandStallNotesModal";
import {
  buildReportFileName,
  exportReportToExcel,
  exportReportToPDF,
} from "@/app/utils/reportExportUtils";
import {
  LAND_AVAILABILITY_EXPORT_COLUMNS,
  LAND_AVAILABILITY_PAGE_SIZE_OPTIONS,
  LAND_AVAILABILITY_SCROLL_WIDTH,
  STATUS_META,
  buildLandAvailabilityExportRows,
  createLandAvailabilityReportColumns,
  filterLandAvailabilityRows,
} from "./LandAvailabilityReportTableColumns";

const DEFAULT_LOADING_MESSAGE = "Loading...";
const ALL_LOCATION = { id: "all", location_name: "Semua Lokasi" };
const ALL_SECTOR = { id: "all", sector_name: "Semua Sektor" };
const ALL_STATUS = { value: "all", label: "Semua Status" };

const PAGE_BREADCRUMBS = [
  {
    label: "Laporan Izin Lahan",
    value: "land-permit-reports",
    path: "#",
    icon: "solar:chart-2-bold-duotone",
  },
  {
    label: "Ketersediaan Lahan",
    value: "land-availability-report",
    path: "/land-availability-report",
    icon: "healthicons:market-stall",
  },
];

const STATUS_OPTIONS = [
  ALL_STATUS,
  ...Object.entries(STATUS_META).map(([value, meta]) => ({
    value,
    label: meta.label,
  })),
];

const normalizeOptionId = (value) => String(value ?? "");

const sortByLabel = (a, b, key) =>
  String(a?.[key] || "").localeCompare(String(b?.[key] || ""));

const getInitialSnackbar = () => ({
  open: false,
  message: "",
  severity: "success",
});

const buildSummary = (rows = []) => ({
  total: rows.length,
  available: rows.filter((row) => row.status === "available").length,
  occupied: rows.filter((row) => row.status === "occupied").length,
  maintenance: rows.filter((row) => row.status === "maintenance").length,
  unavailable: rows.filter((row) => row.status === "unavailable").length,
});

const getFilterInfo = ({ location, sector, status, total }) => [
  { label: "Lokasi", value: location?.location_name || "Semua Lokasi" },
  { label: "Sektor", value: sector?.sector_name || "Semua Sektor" },
  { label: "Status", value: status?.label || "Semua Status" },
  { label: "Total Data", value: `${total} lahan` },
];

const getExportSummaryInfo = (summary) => [
  { label: "Tersedia", value: `${summary.available} lahan` },
  { label: "Terisi", value: `${summary.occupied} lahan` },
  { label: "Maintenance", value: `${summary.maintenance} lahan` },
  { label: "Tidak Layak", value: `${summary.unavailable} lahan` },
];

const getExportFilterName = ({ location, sector, status }) =>
  [location?.location_name, sector?.sector_name, status?.label]
    .filter(Boolean)
    .join("_");

function FilterPanel({
  locationOptions,
  draftLocation,
  onLocationChange,
  sectorOptions,
  draftSector,
  onSectorChange,
  draftStatus,
  onStatusChange,
  onApply,
  onReset,
  isLoading,
}) {
  return (
    <ReportFilterPanel
      title="Filter Ketersediaan Lahan"
      description="Pilih lokasi, sektor, dan status untuk melihat kondisi lahan saat ini."
      icon="solar:filter-bold-duotone"
      showDateRangeFilters={false}
      onApply={onApply}
      onReset={onReset}
      isSubmitting={isLoading}
      resetLabel="Reset Filter"
      applyLabel="Cari Data"
    >
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            md: "minmax(0, 1.25fr) minmax(0, 1fr) minmax(0, 1fr)",
          },
          columnGap: { xs: 0, md: 2 },
          rowGap: { xs: 2.4, sm: 2.2, md: 2 },
          alignItems: "center",
        }}
      >
        <Autocomplete
          size="small"
          options={locationOptions}
          value={draftLocation}
          disableClearable
          getOptionLabel={(option) => option?.location_name || ""}
          isOptionEqualToValue={(option, value) =>
            normalizeOptionId(option?.id) === normalizeOptionId(value?.id)
          }
          onChange={(_, value) => onLocationChange(value || ALL_LOCATION)}
          renderInput={(params) => (
            <TextField {...params} label="Pilih Lokasi" placeholder="Semua Lokasi" />
          )}
        />

        <Autocomplete
          size="small"
          options={sectorOptions}
          value={draftSector}
          disableClearable
          getOptionLabel={(option) => option?.sector_name || ""}
          isOptionEqualToValue={(option, value) =>
            normalizeOptionId(option?.id) === normalizeOptionId(value?.id)
          }
          onChange={(_, value) => onSectorChange(value || ALL_SECTOR)}
          renderInput={(params) => (
            <TextField {...params} label="Sektor" placeholder="Semua Sektor" />
          )}
        />

        <Autocomplete
          size="small"
          options={STATUS_OPTIONS}
          value={draftStatus}
          disableClearable
          getOptionLabel={(option) => option?.label || ""}
          isOptionEqualToValue={(option, value) => option?.value === value?.value}
          onChange={(_, value) => onStatusChange(value || ALL_STATUS)}
          renderInput={(params) => (
            <TextField {...params} label="Status Lahan" placeholder="Semua Status" />
          )}
        />
      </Box>
    </ReportFilterPanel>
  );
}

export default function LandAvailabilityReportPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const { user } = useUser();
  const [rows, setRows] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [selectedLocation, setSelectedLocation] = useState(ALL_LOCATION);
  const [selectedSector, setSelectedSector] = useState(ALL_SECTOR);
  const [selectedStatus, setSelectedStatus] = useState(ALL_STATUS);
  const [draftLocation, setDraftLocation] = useState(ALL_LOCATION);
  const [draftSector, setDraftSector] = useState(ALL_SECTOR);
  const [draftStatus, setDraftStatus] = useState(ALL_STATUS);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [filterLoading, setFilterLoading] = useState(false);
  const [selectedNotesStall, setSelectedNotesStall] = useState(null);
  const [loadingMessage, setLoadingMessage] = useState(DEFAULT_LOADING_MESSAGE);
  const [snackbar, setSnackbar] = useState(getInitialSnackbar);

  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const fetchReport = useCallback(
    async ({
      showLoading = true,
      message = "Mengambil laporan ketersediaan lahan...",
      notifySuccess = false,
    } = {}) => {
      if (!user) return;

      if (showLoading) {
        setLoadingMessage(message);
        setLoading(true);
      }

      try {
        const response = await axios.get("/api/report/land-availability");
        const nextRows = response.data?.data || [];
        setRows(nextRows);

        if (!nextRows.length) {
          showSnackbar("Belum ada data lahan yang bisa ditampilkan.", "warning");
        } else if (notifySuccess) {
          showSnackbar(
            `Laporan ketersediaan lahan berhasil diperbarui (${nextRows.length} data).`,
          );
        }
      } catch (error) {
        console.error("Error fetch land availability report:", error);
        showSnackbar(
          error?.response?.data?.message ||
            "Gagal mengambil laporan ketersediaan lahan.",
          "error",
        );
      } finally {
        if (showLoading) {
          setLoading(false);
          setLoadingMessage(DEFAULT_LOADING_MESSAGE);
        }
      }
    },
    [user],
  );

  useEffect(() => {
    if (user) fetchReport();
  }, [user, fetchReport]);

  const locationOptions = useMemo(() => {
    const map = new Map();
    rows.forEach((row) => {
      if (!row.location_id) return;
      map.set(row.location_id, {
        id: row.location_id,
        location_name: row.location_name || "-",
      });
    });

    return [
      ALL_LOCATION,
      ...Array.from(map.values()).sort((a, b) =>
        sortByLabel(a, b, "location_name"),
      ),
    ];
  }, [rows]);

  const sectorOptions = useMemo(() => {
    const map = new Map();
    rows
      .filter(
        (row) =>
          draftLocation.id === "all" ||
          normalizeOptionId(row.location_id) === normalizeOptionId(draftLocation.id),
      )
      .forEach((row) => {
        if (!row.sector_id) return;
        map.set(row.sector_id, {
          id: row.sector_id,
          sector_name: row.sector_name || "-",
        });
      });

    return [
      ALL_SECTOR,
      ...Array.from(map.values()).sort((a, b) =>
        sortByLabel(a, b, "sector_name"),
      ),
    ];
  }, [rows, draftLocation]);

  const filteredRows = useMemo(() => {
    const baseRows = rows.filter((row) => {
      const locationMatches =
        selectedLocation.id === "all" ||
        normalizeOptionId(row.location_id) === normalizeOptionId(selectedLocation.id);
      const sectorMatches =
        selectedSector.id === "all" ||
        normalizeOptionId(row.sector_id) === normalizeOptionId(selectedSector.id);
      const statusMatches =
        selectedStatus.value === "all" || row.status === selectedStatus.value;

      return locationMatches && sectorMatches && statusMatches;
    });

    return filterLandAvailabilityRows(baseRows, searchText);
  }, [rows, searchText, selectedLocation, selectedSector, selectedStatus]);

  const summary = useMemo(() => buildSummary(filteredRows), [filteredRows]);

  const columns = useMemo(
    () =>
      createLandAvailabilityReportColumns({
        theme,
        isMobile,
        onOpenNotes: setSelectedNotesStall,
      }),
    [theme, isMobile],
  );

  const exportRows = useMemo(
    () => buildLandAvailabilityExportRows(filteredRows),
    [filteredRows],
  );

  const handleDraftLocationChange = (value) => {
    setDraftLocation(value);
    setDraftSector(ALL_SECTOR);
  };

  const handleApplyFilter = async () => {
    setLoadingMessage("Menerapkan filter laporan ketersediaan lahan...");
    setFilterLoading(true);
    setSelectedLocation(draftLocation);
    setSelectedSector(draftSector);
    setSelectedStatus(draftStatus);
    await new Promise((resolve) => setTimeout(resolve, 220));
    setFilterLoading(false);
    setLoadingMessage(DEFAULT_LOADING_MESSAGE);
  };

  const handleResetFilter = () => {
    setDraftLocation(ALL_LOCATION);
    setDraftSector(ALL_SECTOR);
    setDraftStatus(ALL_STATUS);
    setSelectedLocation(ALL_LOCATION);
    setSelectedSector(ALL_SECTOR);
    setSelectedStatus(ALL_STATUS);
    setSearchText("");
  };

  const reportTitle = "Laporan Ketersediaan Lahan";
  const reportSubtitle =
    "Daftar kondisi lahan per lokasi, sektor, status, ukuran, harga, dan catatan master data.";
  const filterInfo = getFilterInfo({
    location: selectedLocation,
    sector: selectedSector,
    status: selectedStatus,
    total: filteredRows.length,
  });
  const summaryInfo = getExportSummaryInfo(summary);
  const today = moment().format("YYYY-MM-DD");
  const exportFilterName = getExportFilterName({
    location: selectedLocation,
    sector: selectedSector,
    status: selectedStatus,
  });

  const handleExportExcel = () => {
    exportReportToExcel({
      title: reportTitle,
      subtitle: reportSubtitle,
      filterInfo,
      summaryInfo,
      sheetName: "Ketersediaan Lahan",
      fileName: buildReportFileName({
        prefix: "Laporan_Ketersediaan_Lahan",
        filterName: exportFilterName,
        startDate: today,
        endDate: today,
        extension: "xlsx",
      }),
      rows: exportRows,
      columns: LAND_AVAILABILITY_EXPORT_COLUMNS,
    });
  };

  const handleExportPDF = async () => {
    await exportReportToPDF({
      title: reportTitle,
      subtitle: reportSubtitle,
      filterInfo,
      summaryInfo,
      fileName: buildReportFileName({
        prefix: "Laporan_Ketersediaan_Lahan",
        filterName: exportFilterName,
        startDate: today,
        endDate: today,
        extension: "pdf",
      }),
      rows: exportRows,
      columns: LAND_AVAILABILITY_EXPORT_COLUMNS,
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
        title="Ketersediaan Lahan"
        description="Pantau kondisi lahan izin per lokasi, sektor, status, ukuran, harga, dan catatan master data lahan."
        icon="healthicons:market-stall"
        action={
          <Button
            variant="contained"
            onClick={() => fetchReport({ notifySuccess: true })}
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
            md: "repeat(5, minmax(0, 1fr))",
          },
          gap: 1.5,
        }}
      >
        <SummaryStatCard
          label="Total Lahan"
          value={summary.total}
          icon="healthicons:market-stall"
          color={theme.palette.primary.main}
        />
        <SummaryStatCard
          label="Tersedia"
          value={summary.available}
          icon={STATUS_META.available.icon}
          color={theme.palette.success.main}
        />
        <SummaryStatCard
          label="Terisi"
          value={summary.occupied}
          icon={STATUS_META.occupied.icon}
          color={theme.palette.warning.main}
        />
        <SummaryStatCard
          label="Maintenance"
          value={summary.maintenance}
          icon={STATUS_META.maintenance.icon}
          color={theme.palette.info.main}
        />
        <SummaryStatCard
          label="Tidak Layak"
          value={summary.unavailable}
          icon={STATUS_META.unavailable.icon}
          color={theme.palette.error.main}
        />
      </Box>

      <FilterPanel
        locationOptions={locationOptions}
        draftLocation={draftLocation}
        onLocationChange={handleDraftLocationChange}
        sectorOptions={sectorOptions}
        draftSector={draftSector}
        onSectorChange={setDraftSector}
        draftStatus={draftStatus}
        onStatusChange={setDraftStatus}
        onApply={handleApplyFilter}
        onReset={handleResetFilter}
        isLoading={loading}
      />

      <DataTableShell
        title="Daftar Ketersediaan Lahan"
        description={`${filteredRows.length} dari ${rows.length} lahan ditampilkan`}
        searchValue={searchText}
        searchPlaceholder="Cari lokasi, sektor, lahan, status, harga, atau catatan"
        onSearchChange={setSearchText}
        headerAction={
          <TableExportButton
            disabled={!filteredRows.length}
            ariaLabel="Export laporan ketersediaan lahan"
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
          pageSizeOptions={LAND_AVAILABILITY_PAGE_SIZE_OPTIONS}
          onPageSizeChange={setPageSize}
          scroll={{ x: LAND_AVAILABILITY_SCROLL_WIDTH, y: 560 }}
          pagination={{ total: filteredRows.length }}
        />
      </DataTableShell>

      <LandStallNotesModal
        open={Boolean(selectedNotesStall)}
        onClose={() => setSelectedNotesStall(null)}
        selectedData={selectedNotesStall}
      />

      <LoadingBackdrop message={loadingMessage} open={loading || filterLoading} />
      <Notification
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
      />
    </Box>
  );
}
