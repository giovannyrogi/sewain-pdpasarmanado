"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Box, Grid, Typography, useTheme } from "@mui/material";
import { Icon } from "@iconify/react";
import axios from "axios";
import LoadingBackdrop from "@/app/components/loading/Backdrop";
import { useUser } from "@/app/utils/useUser";
import PageHeader from "@/app/components/page-header/PageHeader";
import DashboardMetricGrid from "./DashboardMetricGrid";
import DashboardQueues from "./DashboardQueues";
import IncomeTrendPanel from "./IncomeTrendPanel";
import {
  LocationOccupancyPanel,
  RecentActivityPanel,
  StatusOverviewPanels,
} from "./StatusOverviewPanels";

const DASHBOARD_REFRESH_SECONDS = 180;

const isUnauthorizedRequest = (error) =>
  axios.isAxiosError(error) && error.response?.status === 401;

/**
 * Menahan error 401 yang wajar muncul ketika user logout saat request dashboard
 * masih berjalan. Error lain tetap dicatat agar debugging tidak hilang.
 */
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

/**
 * Dashboard utama sistem SewaIN.
 * Seluruh data operasional berasal dari satu endpoint role-aware agar UI ringan,
 * aman, dan mudah dirawat saat jumlah modul dashboard bertambah.
 */
export default function Dashboard() {
  const theme = useTheme();
  const { user } = useUser();
  const [overview, setOverview] = useState(null);
  const [filters, setFilters] = useState(createInitialFilters);
  const [loading, setLoading] = useState(true);
  const [refreshCountdown, setRefreshCountdown] = useState(
    DASHBOARD_REFRESH_SECONDS,
  );

  const queryString = useMemo(() => {
    const params = new URLSearchParams({
      period: filters.period,
      year: String(filters.year),
      month: String(filters.month),
    });
    return params.toString();
  }, [filters]);

  /**
   * Mengambil data dashboard dengan AbortController.
   * Ini mencegah state update setelah component unmount atau user logout cepat.
   */
  const fetchDashboard = useCallback(
    async (signal, options = {}) => {
      try {
        if (!options.silent) {
          setLoading(true);
        }
        const requestParams = new URLSearchParams(queryString);
        requestParams.set("_ts", String(Date.now()));

        const response = await axios.get(
          `/api/dashboard/overview?${requestParams}`,
          {
            signal,
          },
        );

        if (response.data.success) {
          setOverview(response.data.data);
          setRefreshCountdown(DASHBOARD_REFRESH_SECONDS);
        }
      } catch (error) {
        logDashboardError("Error fetching dashboard overview:", error);
      } finally {
        if (!signal?.aborted) {
          if (!options.silent) {
            setLoading(false);
          }
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

  /**
   * Auto-refresh dashboard setiap 3 menit.
   * Fetch dilakukan silent agar dashboard tidak berkedip, tetapi data tetap
   * diperbarui berkala untuk monitoring operasional.
   */
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
        open={loading && !overview}
        message="Memuat dashboard..."
      />

      <Grid container spacing={{ xs: 1.5, lg: 2 }}>
        <Grid size={12}>
          <PageHeader
            breadcrumbs={[
              {
                label: "Dashboard",
                icon: "solar:chart-2-bold-duotone",
                path: "/dashboard",
              },
            ]}
            title="Dashboard"
            description="Pantau kondisi kontrak, ruangan, pembayaran, persetujuan, terminasi, dan aktivitas terbaru dalam satu halaman."
            icon="solar:chart-2-bold-duotone"
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
          <DashboardMetricGrid
            overview={overview}
            loading={loading && !overview}
          />
        </Grid>

        <Grid size={12}>
          <IncomeTrendPanel
            data={overview?.incomeChart || []}
            filters={filters}
            onFilterChange={handleFilterChange}
            loading={loading}
          />
        </Grid>

        <Grid size={12}>
          <DashboardQueues overview={overview} loading={loading && !overview} />
        </Grid>

        <Grid size={12}>
          <StatusOverviewPanels
            overview={overview}
            loading={loading && !overview}
          />
        </Grid>

        {overview?.access?.canSeeRoomOperations && (
          <Grid size={{ xs: 12, lg: 7 }}>
            <LocationOccupancyPanel
              data={overview?.roomsByLocation || []}
              loading={loading && !overview}
            />
          </Grid>
        )}

        <Grid
          size={{ xs: 12, lg: overview?.access?.canSeeRoomOperations ? 5 : 12 }}
        >
          <RecentActivityPanel
            data={overview?.recentActivity || []}
            loading={loading && !overview}
          />
        </Grid>
      </Grid>
    </Box>
  );
}
