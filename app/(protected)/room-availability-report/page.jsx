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
import RoomNotesModal from "../rooms/RoomNotesModal";
import {
  buildReportFileName,
  exportReportToExcel,
  exportReportToPDF,
} from "@/app/utils/reportExportUtils";
import {
  ROOM_AVAILABILITY_EXPORT_COLUMNS,
  ROOM_AVAILABILITY_PAGE_SIZE_OPTIONS,
  ROOM_AVAILABILITY_SCROLL_WIDTH,
  STATUS_META,
  buildRoomAvailabilityExportRows,
  createRoomAvailabilityReportColumns,
  filterRoomAvailabilityRows,
  getStatusLabel,
} from "./RoomAvailabilityReportTableColumns";

const DEFAULT_LOADING_MESSAGE = "Loading...";
const ALL_LOCATION = { id: "all", location_name: "Semua Lokasi" };
const ALL_FLOOR = { id: "all", room_floor: "Semua Lantai" };
const ALL_STATUS = { value: "all", label: "Semua Status" };

const PAGE_BREADCRUMBS = [
  {
    label: "Laporan Sewa Ruangan",
    value: "reports",
    path: "#",
    icon: "fluent:chart-multiple-16-filled",
  },
  {
    label: "Ketersediaan Ruangan",
    value: "room-availability-report",
    path: "/room-availability-report",
    icon: "solar:home-angle-bold-duotone",
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

const getFilterInfo = ({ location, status, floor, total }) => [
  { label: "Lokasi", value: location?.location_name || "Semua Lokasi" },
  { label: "Status", value: status?.label || "Semua Status" },
  { label: "Lantai", value: floor?.room_floor || "Semua Lantai" },
  { label: "Total Data", value: `${total} ruangan` },
];

const getExportFilterName = ({ location, status, floor }) =>
  [location?.location_name, status?.label, floor?.room_floor]
    .filter(Boolean)
    .join("_");

function FilterPanel({
  locationOptions,
  draftLocation,
  onLocationChange,
  draftStatus,
  onStatusChange,
  floorOptions,
  draftFloor,
  onFloorChange,
  onApply,
  onReset,
  isLoading,
}) {
  return (
    <ReportFilterPanel
      title="Filter Ketersediaan Ruangan"
      description="Pilih lokasi, status, dan lantai untuk melihat kondisi ruangan saat ini."
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
          options={STATUS_OPTIONS}
          value={draftStatus}
          disableClearable
          getOptionLabel={(option) => option?.label || ""}
          isOptionEqualToValue={(option, value) => option?.value === value?.value}
          onChange={(_, value) => onStatusChange(value || ALL_STATUS)}
          renderInput={(params) => (
            <TextField {...params} label="Status Ruangan" placeholder="Semua Status" />
          )}
        />

        <Autocomplete
          size="small"
          options={floorOptions}
          value={draftFloor}
          disableClearable
          getOptionLabel={(option) => option?.room_floor || ""}
          isOptionEqualToValue={(option, value) =>
            normalizeOptionId(option?.id) === normalizeOptionId(value?.id)
          }
          onChange={(_, value) => onFloorChange(value || ALL_FLOOR)}
          renderInput={(params) => (
            <TextField {...params} label="Lantai" placeholder="Semua Lantai" />
          )}
        />
      </Box>
    </ReportFilterPanel>
  );
}

export default function RoomAvailabilityReportPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const { user } = useUser();
  const [rows, setRows] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [selectedLocation, setSelectedLocation] = useState(ALL_LOCATION);
  const [selectedStatus, setSelectedStatus] = useState(ALL_STATUS);
  const [selectedFloor, setSelectedFloor] = useState(ALL_FLOOR);
  const [draftLocation, setDraftLocation] = useState(ALL_LOCATION);
  const [draftStatus, setDraftStatus] = useState(ALL_STATUS);
  const [draftFloor, setDraftFloor] = useState(ALL_FLOOR);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [filterLoading, setFilterLoading] = useState(false);
  const [selectedNotesRoom, setSelectedNotesRoom] = useState(null);
  const [loadingMessage, setLoadingMessage] = useState(DEFAULT_LOADING_MESSAGE);
  const [snackbar, setSnackbar] = useState(getInitialSnackbar);

  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const fetchReport = useCallback(
    async ({
      showLoading = true,
      message = "Mengambil laporan ketersediaan ruangan...",
      notifySuccess = false,
    } = {}) => {
      if (!user) return;

      if (showLoading) {
        setLoadingMessage(message);
        setLoading(true);
      }

      try {
        const response = await axios.get("/api/report/room-availability");
        const nextRows = response.data?.data || [];
        setRows(nextRows);

        if (!nextRows.length) {
          showSnackbar("Belum ada data ruangan yang bisa ditampilkan.", "warning");
        } else if (notifySuccess) {
          showSnackbar(
            `Laporan ketersediaan ruangan berhasil diperbarui (${nextRows.length} data).`,
          );
        }
      } catch (error) {
        console.error("Error fetch room availability report:", error);
        showSnackbar(
          error?.response?.data?.message ||
            "Gagal mengambil laporan ketersediaan ruangan.",
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

    return [ALL_LOCATION, ...Array.from(map.values()).sort((a, b) => sortByLabel(a, b, "location_name"))];
  }, [rows]);

  const floorOptions = useMemo(() => {
    const map = new Map();
    rows
      .filter(
        (row) =>
          draftLocation.id === "all" ||
          normalizeOptionId(row.location_id) === normalizeOptionId(draftLocation.id),
      )
      .forEach((row) => {
        if (!row.room_floor) return;
        const key = row.room_floor;
        map.set(key, {
          id: key,
          room_floor: row.room_floor || "-",
        });
      });

    return [ALL_FLOOR, ...Array.from(map.values()).sort((a, b) => sortByLabel(a, b, "room_floor"))];
  }, [rows, draftLocation]);

  const filteredRows = useMemo(() => {
    const baseRows = rows.filter((row) => {
      const locationMatches =
        selectedLocation.id === "all" ||
        normalizeOptionId(row.location_id) === normalizeOptionId(selectedLocation.id);
      const statusMatches =
        selectedStatus.value === "all" || row.status === selectedStatus.value;
      const floorMatches =
        selectedFloor.id === "all" ||
        normalizeOptionId(row.room_floor) === normalizeOptionId(selectedFloor.id);

      return locationMatches && statusMatches && floorMatches;
    });

    return filterRoomAvailabilityRows(baseRows, searchText);
  }, [rows, searchText, selectedLocation, selectedStatus, selectedFloor]);

  const summary = useMemo(() => buildSummary(filteredRows), [filteredRows]);

  const columns = useMemo(
    () =>
      createRoomAvailabilityReportColumns({
        theme,
        isMobile,
        onOpenNotes: setSelectedNotesRoom,
      }),
    [theme, isMobile],
  );

  const exportRows = useMemo(
    () => buildRoomAvailabilityExportRows(filteredRows),
    [filteredRows],
  );

  const handleDraftLocationChange = (value) => {
    setDraftLocation(value);
    setDraftFloor(ALL_FLOOR);
  };

  const handleApplyFilter = async () => {
    setLoadingMessage("Menerapkan filter laporan ketersediaan ruangan...");
    setFilterLoading(true);
    setSelectedLocation(draftLocation);
    setSelectedStatus(draftStatus);
    setSelectedFloor(draftFloor);
    await new Promise((resolve) => setTimeout(resolve, 220));
    setFilterLoading(false);
    setLoadingMessage(DEFAULT_LOADING_MESSAGE);
  };

  const handleResetFilter = () => {
    setDraftLocation(ALL_LOCATION);
    setDraftStatus(ALL_STATUS);
    setDraftFloor(ALL_FLOOR);
    setSelectedLocation(ALL_LOCATION);
    setSelectedStatus(ALL_STATUS);
    setSelectedFloor(ALL_FLOOR);
    setSearchText("");
  };

  const reportTitle = "Laporan Ketersediaan Ruangan";
  const reportSubtitle =
    "Daftar kondisi ruangan per lokasi, lantai, status, dimensi, harga, dan catatan master data.";
  const filterInfo = getFilterInfo({
    location: selectedLocation,
    status: selectedStatus,
    floor: selectedFloor,
    total: filteredRows.length,
  });
  const today = moment().format("YYYY-MM-DD");
  const exportFilterName = getExportFilterName({
    location: selectedLocation,
    status: selectedStatus,
    floor: selectedFloor,
  });

  const handleExportExcel = () => {
    exportReportToExcel({
      title: reportTitle,
      subtitle: reportSubtitle,
      filterInfo,
      sheetName: "Ketersediaan Ruangan",
      fileName: buildReportFileName({
        prefix: "Laporan_Ketersediaan_Ruangan",
        filterName: exportFilterName,
        startDate: today,
        endDate: today,
        extension: "xlsx",
      }),
      rows: exportRows,
      columns: ROOM_AVAILABILITY_EXPORT_COLUMNS,
    });
  };

  const handleExportPDF = async () => {
    await exportReportToPDF({
      title: reportTitle,
      subtitle: reportSubtitle,
      filterInfo,
      fileName: buildReportFileName({
        prefix: "Laporan_Ketersediaan_Ruangan",
        filterName: exportFilterName,
        startDate: today,
        endDate: today,
        extension: "pdf",
      }),
      rows: exportRows,
      columns: ROOM_AVAILABILITY_EXPORT_COLUMNS,
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
        title="Ketersediaan Ruangan"
        description="Pantau kondisi ruangan per lokasi, lantai, status, dimensi, harga, dan catatan master data ruangan."
        icon="solar:home-angle-bold-duotone"
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
          label="Total Ruangan"
          value={summary.total}
          icon="solar:home-angle-bold-duotone"
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
        draftStatus={draftStatus}
        onStatusChange={setDraftStatus}
        floorOptions={floorOptions}
        draftFloor={draftFloor}
        onFloorChange={setDraftFloor}
        onApply={handleApplyFilter}
        onReset={handleResetFilter}
        isLoading={loading}
      />

      <DataTableShell
        title="Daftar Ketersediaan Ruangan"
        description={`${filteredRows.length} dari ${rows.length} ruangan ditampilkan`}
        searchValue={searchText}
        searchPlaceholder="Cari lokasi, ruangan, lantai, status, harga, atau catatan"
        onSearchChange={setSearchText}
        headerAction={
          <TableExportButton
            disabled={!filteredRows.length}
            ariaLabel="Export laporan ketersediaan ruangan"
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
          pageSizeOptions={ROOM_AVAILABILITY_PAGE_SIZE_OPTIONS}
          onPageSizeChange={setPageSize}
          scroll={{ x: ROOM_AVAILABILITY_SCROLL_WIDTH, y: 560 }}
          pagination={{ total: filteredRows.length }}
        />
      </DataTableShell>

      <RoomNotesModal
        open={Boolean(selectedNotesRoom)}
        onClose={() => setSelectedNotesRoom(null)}
        selectedData={selectedNotesRoom}
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
