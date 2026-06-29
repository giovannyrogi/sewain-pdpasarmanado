"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Box, Grid, Typography, useTheme } from "@mui/material";
import { Icon } from "@iconify/react";
import axios from "axios";
import LoadingBackdrop from "@/app/components/loading/Backdrop";
import Notification from "@/app/components/Notification";
import PageHeader from "@/app/components/page-header/PageHeader";
import LandPermitMetricGrid from "./LandPermitMetricGrid";
import LandPermitIncomeTrendPanel from "./LandPermitIncomeTrendPanel";
import LandPermitQueues from "./LandPermitQueues";
import {
  LandAvailabilityPanel,
  LandPermitRecentActivityPanel,
  LandPermitStatusOverviewPanels,
} from "./LandPermitStatusPanels";

const DASHBOARD_REFRESH_SECONDS = 180;

const getInitialSnackbar = () => ({
  open: false,
  message: "",
  severity: "success",
});

const isUnauthorizedRequest = (error) =>
  axios.isAxiosError(error) && error.response?.status === 401;

const logDashboardError = (label, error) => {
  if (isUnauthorizedRequest(error) || axios.isCancel(error)) return;
  console.error(label, error);
};

const createInitialFilters = () => {
  const now = new Date();
  return {
    period: "year",
    year: now.getFullYear(),
    month: now.getMonth() + 1,
  };
};

export default function LandPermitDashboardPage() {
  const theme = useTheme();
  const [overview, setOverview] = useState(null);
  const [filters, setFilters] = useState(createInitialFilters);
  const [loading, setLoading] = useState(true);
  const [refreshCountdown, setRefreshCountdown] = useState(
    DASHBOARD_REFRESH_SECONDS,
  );
  const [snackbar, setSnackbar] = useState(getInitialSnackbar);

  const queryString = useMemo(() => {
    const params = new URLSearchParams({
      period: filters.period,
      year: String(filters.year),
      month: String(filters.month),
    });
    return params.toString();
  }, [filters]);

  const fetchDashboard = useCallback(
    async (signal, options = {}) => {
      try {
        if (!options.silent) {
          setLoading(true);
        }

        const requestParams = new URLSearchParams(queryString);
        requestParams.set("_ts", String(Date.now()));

        const response = await axios.get(
          `/api/land-permit-dashboard/overview?${requestParams}`,
          { signal },
        );

        if (response.data.success) {
          setOverview(response.data.data);
          setRefreshCountdown(DASHBOARD_REFRESH_SECONDS);
        } else {
          setSnackbar({
            open: true,
            message: response.data.message || "Gagal mengambil dashboard izin lahan.",
            severity: "error",
          });
        }
      } catch (error) {
        logDashboardError(
          "Error fetching land permit dashboard overview:",
          error,
        );
        if (!isUnauthorizedRequest(error) && !axios.isCancel(error)) {
          setSnackbar({
            open: true,
            message:
              error?.response?.data?.message ||
              "Terjadi kesalahan saat mengambil dashboard izin lahan.",
            severity: "error",
          });
        }
      } finally {
        if (!signal?.aborted && !options.silent) {
          setLoading(false);
        }
      }
    },
    [queryString],
  );

  useEffect(() => {
    const controller = new AbortController();
    fetchDashboard(controller.signal);
    return () => controller.abort();
  }, [fetchDashboard]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setRefreshCountdown((current) => {
        if (current <= 1) {
          const controller = new AbortController();
          fetchDashboard(controller.signal, { silent: true });
          return DASHBOARD_REFRESH_SECONDS;
        }
        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [fetchDashboard]);

  const handleFilterChange = (nextFilters) => {
    setFilters((current) => ({ ...current, ...nextFilters }));
  };

  const minutes = String(Math.floor(refreshCountdown / 60)).padStart(2, "0");
  const seconds = String(refreshCountdown % 60).padStart(2, "0");
  const isInitialLoading = loading && !overview;

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
      <LoadingBackdrop
        open={isInitialLoading}
        message="Memuat dashboard izin lahan..."
      />

      <Grid container spacing={{ xs: 1.5, lg: 2 }}>
        <Grid size={12}>
          <PageHeader
            breadcrumbs={[
              {
                label: "Dashboard",
                icon: "healthicons:market-stall",
                path: "/land-permit-dashboard",
              },
            ]}
            title="Dashboard Izin Lahan"
            description="Pantau permohonan, approval, pembayaran, non-aktif, ketersediaan lahan, dan aktivitas izin lahan dalam satu halaman."
            icon="healthicons:market-stall"
            actionSx={{
              width: { xs: "100%", md: "auto" },
              display: "flex",
              justifyContent: { xs: "center", md: "flex-end" },
            }}
            action={
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 0.75,
                  justifyContent: "center",
                  minHeight: 44,
                  borderRadius: 2,
                  px: { xs: 1.75, sm: 1.9 },
                  py: { xs: 1.05, sm: 1 },
                  fontWeight: 900,
                  border: `1px solid ${theme.palette.primary.main}`,
                  color: theme.palette.primary.main,
                  bgcolor:
                    theme.palette.mode === "dark"
                      ? "rgba(255, 152, 0, 0.08)"
                      : "rgba(230, 9, 9, 0.06)",
                  userSelect: "none",
                }}
              >
                <Box
                  component="span"
                  sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: { xs: 20, sm: 18 },
                    height: { xs: 20, sm: 18 },
                    flex: "0 0 auto",
                    lineHeight: 0,
                  }}
                >
                  <Icon
                    icon="solar:refresh-circle-bold-duotone"
                    fontSize="100%"
                  />
                </Box>
                <Typography
                  component="span"
                  sx={{
                    fontWeight: 950,
                    fontSize: { xs: 12.5, sm: 12 },
                    lineHeight: { xs: "20px", sm: "18px" },
                    whiteSpace: "nowrap",
                  }}
                >
                  Auto Refresh berikutnya {minutes}:{seconds}
                </Typography>
              </Box>
            }
          />
        </Grid>

        <Grid size={12}>
          <LandPermitMetricGrid
            overview={overview}
            loading={isInitialLoading}
          />
        </Grid>

        <Grid size={12}>
          <LandPermitIncomeTrendPanel
            data={overview?.incomeChart || []}
            filters={filters}
            onFilterChange={handleFilterChange}
            loading={loading}
          />
        </Grid>

        <Grid size={12}>
          <LandPermitQueues
            overview={overview}
            loading={isInitialLoading}
          />
        </Grid>

        <Grid size={12}>
          <LandPermitStatusOverviewPanels
            overview={overview}
            loading={isInitialLoading}
          />
        </Grid>

        <Grid size={{ xs: 12, lg: 7 }}>
          <LandAvailabilityPanel
            data={overview?.stallsByLocation || []}
            loading={isInitialLoading}
          />
        </Grid>

        <Grid size={{ xs: 12, lg: 5 }}>
          <LandPermitRecentActivityPanel
            data={overview?.recentActivity || []}
            loading={isInitialLoading}
          />
        </Grid>
      </Grid>

      <Notification
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={() => setSnackbar(getInitialSnackbar())}
      />
    </Box>
  );
}
