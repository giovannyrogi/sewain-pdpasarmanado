"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Box, Grid, Stack, useTheme } from "@mui/material";
import axios from "axios";
import LoadingBackdrop from "@/app/components/loading/Backdrop";
import Notification from "@/app/components/Notification";
import PageHeader from "@/app/components/page-header/PageHeader";
import SummaryStatCard from "@/app/components/stats/SummaryStatCard";
import formatRupiah from "@/app/components/formatrupiah/page";

const getInitialSnackbar = () => ({
  open: false,
  message: "",
  severity: "success",
});

/**
 * Dashboard fondasi Izin Lahan.
 * Halaman ini hanya menampilkan ringkasan data master yang berguna untuk user,
 * sedangkan roadmap pengembangan disimpan sebagai dokumentasi internal.
 */
export default function LandPermitDashboardPage() {
  const theme = useTheme();
  const [locations, setLocations] = useState([]);
  const [sectors, setSectors] = useState([]);
  const [stalls, setStalls] = useState([]);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState(getInitialSnackbar);

  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const [locationResponse, sectorResponse, stallResponse] =
        await Promise.all([
          axios.get("/api/locations"),
          axios.get("/api/land-sectors"),
          axios.get("/api/land-stalls"),
        ]);

      if (
        !locationResponse.data?.success ||
        !sectorResponse.data?.success ||
        !stallResponse.data?.success
      ) {
        showSnackbar("Gagal mengambil ringkasan data izin lahan.", "error");
        return;
      }

      setLocations(locationResponse.data.data || []);
      setSectors(sectorResponse.data.data || []);
      setStalls(stallResponse.data.data || []);
    } catch (error) {
      showSnackbar(
        error?.response?.data?.message ||
          "Terjadi kesalahan saat mengambil dashboard izin lahan.",
        "error",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const summary = useMemo(() => {
    const availableStalls = stalls.filter((item) => item.status === "available").length;
    const occupiedStalls = stalls.filter((item) => item.status === "occupied").length;
    const availableAnnualEstimate = stalls
      .filter((item) => item.status === "available")
      .reduce((total, item) => total + Number(item.annual_land_rent || 0), 0);

    return [
      {
        label: "Lokasi Bersama",
        value: locations.length,
        icon: "solar:map-point-bold-duotone",
        color: theme.palette.primary.main,
      },
      {
        label: "Sektor",
        value: sectors.length,
        icon: "solar:map-arrow-square-bold-duotone",
        color: theme.palette.info.main,
      },
      {
        label: "Lapak Tersedia",
        value: availableStalls,
        icon: "solar:shop-bold-duotone",
        color: theme.palette.success.main,
      },
      {
        label: "Lapak Terisi",
        value: occupiedStalls,
        icon: "solar:lock-keyhole-bold-duotone",
        color: theme.palette.warning.main,
      },
      {
        label: "Estimasi Lapak Tersedia",
        value: formatRupiah(availableAnnualEstimate),
        icon: "solar:wallet-money-bold-duotone",
        color: theme.palette.info.main,
        valueSx: { fontSize: { xs: 19, sm: 22 }, lineHeight: 1.2 },
      },
    ];
  }, [locations.length, sectors.length, stalls, theme]);

  return (
    <Box
      sx={{
        width: "100%",
        minHeight: "calc(100vh - 64px)",
        bgcolor: theme.ui.pageBg,
        p: { xs: 1.25, sm: 2, lg: 2.25 },
        transition: "background-color 0.2s ease",
      }}
    >
      <Stack spacing={{ xs: 1.5, lg: 2 }}>
        <PageHeader
          eyebrow="Modul Izin Lahan"
          icon="solar:shop-2-bold-duotone"
          title="Dashboard"
          description="Ringkasan kesiapan data master izin lahan sebelum masuk ke proses permohonan, approval, pembayaran, dan dokumen izin."
        />

        <Grid container spacing={{ xs: 1.25, md: 1.5 }}>
          {summary.map((item) => (
            <Grid key={item.label} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
              <SummaryStatCard {...item} />
            </Grid>
          ))}
        </Grid>
      </Stack>

      <LoadingBackdrop open={loading} message="Memuat dashboard izin lahan..." />

      <Notification
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={() => setSnackbar(getInitialSnackbar())}
      />
    </Box>
  );
}
