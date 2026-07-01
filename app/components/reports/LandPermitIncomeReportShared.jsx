"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { MenuItem, Stack, TextField, Typography } from "@mui/material";
import axios from "axios";
import moment from "moment";
import formatRupiah from "@/app/components/formatrupiah/page";

const DEFAULT_LOADING_MESSAGE = "Loading...";

export const LAND_PERMIT_INCOME_PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

export const formatLandPermitIncomeDate = (value) =>
  value ? moment(value).format("DD MMM YYYY") : "-";

export const formatLandPermitIncomeNumber = (
  value,
  maximumFractionDigits = 2,
) =>
  Number(value || 0).toLocaleString("id-ID", {
    minimumFractionDigits: 0,
    maximumFractionDigits,
  });

export const normalizeLandPermitIncomeSearch = (value) =>
  String(value || "").toLowerCase();

export const keepLandPermitIncomeTotalAtBottom = (a, b, compareFn) => {
  if (a.__isTotal) return 1;
  if (b.__isTotal) return -1;
  return compareFn(a, b);
};

export const buildLandPermitIncomeDimensionLabel = (row) => {
  const length = formatLandPermitIncomeNumber(row?.stall_length);
  const width = formatLandPermitIncomeNumber(row?.stall_width);
  const area = formatLandPermitIncomeNumber(row?.stall_area);
  return `${length} x ${width} m (${area} m²)`;
};

export const buildLandPermitIncomePeriodLabel = (row) =>
  `${formatLandPermitIncomeDate(row?.start_date)} s/d ${formatLandPermitIncomeDate(
    row?.end_date,
  )}`;

export const LandPermitIncomeCellText = ({
  children,
  muted = false,
  strong = false,
}) => (
  <Typography
    sx={{
      fontFamily: "Poppins",
      fontSize: 12,
      fontWeight: strong ? 700 : 600,
      color: muted ? "text.secondary" : "text.primary",
      whiteSpace: "normal",
      wordBreak: "break-word",
    }}
  >
    {children}
  </Typography>
);

export const LAND_PERMIT_INCOME_ROOT_BREADCRUMB = {
  label: "Laporan Izin Lahan",
  value: "land-permit-reports",
  path: "#",
  icon: "solar:chart-square-bold-duotone",
};

export const landPermitIncomePageSx = (theme) => ({
  minHeight: "calc(100vh - 64px)",
  width: "100%",
  bgcolor: theme.ui.dashboardBg,
  px: { xs: 1, sm: 2, lg: 2.5 },
  py: { xs: 1.25, sm: 2, lg: 2.5 },
});

export const getDefaultRange = () => ({
  startDate: moment().format("YYYY-MM-DD"),
  endDate: moment().format("YYYY-MM-DD"),
});

export const getPresetRange = (preset) => {
  const today = moment();

  if (preset === "month") {
    return {
      startDate: today.clone().startOf("month").format("YYYY-MM-DD"),
      endDate: today.format("YYYY-MM-DD"),
    };
  }

  if (preset === "two_month") {
    return {
      startDate: today
        .clone()
        .subtract(2, "months")
        .startOf("day")
        .format("YYYY-MM-DD"),
      endDate: today.format("YYYY-MM-DD"),
    };
  }

  if (preset === "week") {
    return {
      startDate: today
        .clone()
        .subtract(1, "week")
        .startOf("day")
        .format("YYYY-MM-DD"),
      endDate: today.format("YYYY-MM-DD"),
    };
  }

  if (preset === "two_week") {
    return {
      startDate: today
        .clone()
        .subtract(2, "weeks")
        .startOf("day")
        .format("YYYY-MM-DD"),
      endDate: today.format("YYYY-MM-DD"),
    };
  }

  return getDefaultRange();
};

export const formatRangeLabel = (range) =>
  `${moment(range.startDate).format("DD MMMM YYYY")} - ${moment(
    range.endDate,
  ).format("DD MMMM YYYY")}`;

const selectFieldSx = (theme) => ({
  minWidth: { xs: "100%", md: 220 },
  "& .MuiOutlinedInput-root": {
    borderRadius: 2,
    fontFamily: "Poppins",
    minHeight: 40,
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

export function LandPermitIncomeFilterFields({
  theme,
  locations,
  sectors,
  selectedLocationId,
  selectedSectorId,
  onLocationChange,
  onSectorChange,
  showSector = true,
}) {
  return (
    <Stack
      direction={{ xs: "column", md: "row" }}
      spacing={{ xs: 1.5, md: 1.25 }}
      sx={{ width: "100%" }}
    >
      <TextField
        select
        size="small"
        label="Lokasi"
        value={selectedLocationId}
        onChange={onLocationChange}
        sx={selectFieldSx(theme)}
      >
        <MenuItem value="all">Semua Lokasi</MenuItem>
        {locations.map((location) => (
          <MenuItem key={location.id} value={String(location.id)}>
            {location.location_name}
          </MenuItem>
        ))}
      </TextField>

      {showSector && (
        <TextField
          select
          size="small"
          label="Sektor"
          value={selectedSectorId}
          onChange={(event) => onSectorChange(event.target.value)}
          sx={selectFieldSx(theme)}
        >
          <MenuItem value="all">Semua Sektor</MenuItem>
          {sectors.map((sector) => (
            <MenuItem key={sector.id} value={String(sector.id)}>
              {sector.sector_name}
            </MenuItem>
          ))}
        </TextField>
      )}
    </Stack>
  );
}

export function useLandPermitIncomeReport({ enableSectorFilter = true } = {}) {
  const [range, setRange] = useState(getDefaultRange);
  const [selectedPreset, setSelectedPreset] = useState("custom");
  const [selectedLocationId, setSelectedLocationId] = useState("all");
  const [selectedSectorId, setSelectedSectorId] = useState("all");
  const [locations, setLocations] = useState([]);
  const [sectors, setSectors] = useState([]);
  const [recapRows, setRecapRows] = useState([]);
  const [sectorRecapRows, setSectorRecapRows] = useState([]);
  const [detailRows, setDetailRows] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState(DEFAULT_LOADING_MESSAGE);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const showSnackbar = useCallback((message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  }, []);

  const runWithLoading = useCallback(async (message, task) => {
    setLoadingMessage(message || DEFAULT_LOADING_MESSAGE);
    setLoading(true);

    try {
      return await task();
    } finally {
      setLoading(false);
      setLoadingMessage(DEFAULT_LOADING_MESSAGE);
    }
  }, []);

  const fetchSectors = useCallback(async (locationId = "all") => {
    const response = await axios.get("/api/land-sectors", {
      params: locationId !== "all" ? { location_id: locationId } : undefined,
    });
    setSectors(response.data?.data || []);
  }, []);

  const fetchFilterOptions = useCallback(async () => {
    await runWithLoading(
      enableSectorFilter
        ? "Memuat pilihan lokasi dan sektor..."
        : "Memuat pilihan lokasi...",
      async () => {
        try {
          const requests = [axios.get("/api/locations")];
          if (enableSectorFilter) {
            requests.push(fetchSectors("all"));
          }

          const [locationsResponse] = await Promise.all(requests);
          setLocations(locationsResponse.data?.data || []);

          if (!enableSectorFilter) {
            setSectors([]);
          }
        } catch (error) {
          console.error("Error fetching land permit income report filters:", error);
          showSnackbar(
            error?.response?.data?.message ||
              "Gagal memuat filter laporan izin lahan.",
            "error",
          );
        }
      },
    );
  }, [enableSectorFilter, fetchSectors, runWithLoading, showSnackbar]);

  useEffect(() => {
    fetchFilterOptions();
  }, [fetchFilterOptions]);

  const validateRange = useCallback(
    (targetRange = range) => {
      if (!targetRange.startDate || !targetRange.endDate) {
        showSnackbar("Tanggal mulai dan selesai wajib diisi.", "error");
        return false;
      }

      if (moment(targetRange.startDate).isAfter(targetRange.endDate)) {
        showSnackbar("Tanggal mulai tidak boleh melewati tanggal selesai.", "error");
        return false;
      }

      return true;
    },
    [range, showSnackbar],
  );

  const handleLocationChange = useCallback(
    async (event) => {
      const nextLocationId = event.target.value;
      setSelectedLocationId(nextLocationId);
      setSelectedSectorId("all");

      if (!enableSectorFilter) return;

      try {
        await runWithLoading("Memuat sektor sesuai lokasi...", () =>
          fetchSectors(nextLocationId),
        );
      } catch (error) {
        console.error("Error fetching sectors by location:", error);
        showSnackbar(
          error?.response?.data?.message || "Gagal memuat sektor sesuai lokasi.",
          "error",
        );
      }
    },
    [enableSectorFilter, fetchSectors, runWithLoading, showSnackbar],
  );

  const handlePresetChange = useCallback((preset) => {
    setSelectedPreset(preset);
    setRange(getPresetRange(preset));
  }, []);

  const handleRangeChange = useCallback((nextRange) => {
    setRange(nextRange);
    setSelectedPreset("custom");
  }, []);

  const handleResetFilter = useCallback(async () => {
    setRange(getDefaultRange());
    setSelectedPreset("custom");
    setSelectedLocationId("all");
    setSelectedSectorId("all");
    setRecapRows([]);
    setSectorRecapRows([]);
    setDetailRows([]);
    setHasSearched(false);

    if (!enableSectorFilter) return;

    try {
      await runWithLoading("Mereset filter laporan...", () => fetchSectors("all"));
    } catch (error) {
      console.error("Error resetting sector filter:", error);
    }
  }, [enableSectorFilter, fetchSectors, runWithLoading]);

  const fetchReport = useCallback(async () => {
    if (!validateRange()) return;

    await runWithLoading("Mengambil laporan pendapatan izin lahan...", async () => {
      try {
        const response = await axios.get("/api/report/land-permit-income", {
          params: {
            start_date: range.startDate,
            end_date: range.endDate,
            location_id: selectedLocationId,
            sector_id: enableSectorFilter ? selectedSectorId : "all",
          },
        });

        const reportData = response.data?.data || {};
        const nextRecapRows = reportData.recap_by_location || reportData.recap || [];
        const nextSectorRecapRows = reportData.recap_by_sector || [];
        const nextDetailRows = reportData.detail || [];

        setRecapRows(nextRecapRows);
        setSectorRecapRows(nextSectorRecapRows);
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
      }
    });
  }, [
    enableSectorFilter,
    range,
    selectedLocationId,
    selectedSectorId,
    runWithLoading,
    showSnackbar,
    validateRange,
  ]);

  const selectedLocationLabel = useMemo(() => {
    if (selectedLocationId === "all") return "Semua Lokasi";
    return (
      locations.find(
        (location) => String(location.id) === String(selectedLocationId),
      )?.location_name || "Lokasi Terpilih"
    );
  }, [locations, selectedLocationId]);

  const selectedSectorLabel = useMemo(() => {
    if (selectedSectorId === "all") return "Semua Sektor";
    return (
      sectors.find((sector) => String(sector.id) === String(selectedSectorId))
        ?.sector_name || "Sektor Terpilih"
    );
  }, [sectors, selectedSectorId]);

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

  return {
    range,
    selectedPreset,
    selectedLocationId,
    selectedSectorId,
    locations,
    sectors,
    recapRows,
    sectorRecapRows,
    detailRows,
    hasSearched,
    loading,
    loadingMessage,
    snackbar,
    selectedLocationLabel,
    selectedSectorLabel,
    exportFilterInfo,
    setSelectedSectorId,
    setSnackbar,
    runWithLoading,
    handleLocationChange,
    handlePresetChange,
    handleRangeChange,
    handleResetFilter,
    fetchReport,
  };
}
