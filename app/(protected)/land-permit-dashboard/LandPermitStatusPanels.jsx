"use client";

import React from "react";
import {
  Box,
  Button,
  Grid,
  LinearProgress,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import { Icon } from "@iconify/react";
import Link from "next/link";
import DashboardPanel from "@/app/components/dashboard/DashboardPanel";
import { getDashboardListItemSx } from "@/app/components/dashboard/dashboardStyles";
import { fromNow } from "@/app/components/dashboard/dashboardUtils";

const statusColors = {
  active: "success",
  expired: "warning",
  terminated: "error",
  available: "success",
  occupied: "warning",
  maintenance: "info",
  unavailable: "error",
  approved: "success",
  process: "warning",
  rejected: "error",
};

function StatusRow({ label, value, total, colorKey }) {
  const theme = useTheme();
  const color = theme.palette[statusColors[colorKey] || "primary"].main;
  const percent = total > 0 ? Math.min(100, (Number(value || 0) / total) * 100) : 0;

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1, mb: 0.75 }}>
        <Typography sx={{ fontWeight: 600, fontSize: 12 }}>{label}</Typography>
        <Typography sx={{ fontWeight: 600, fontSize: 12 }}>{value || 0}</Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={percent}
        sx={{
          height: 8,
          borderRadius: 99,
          bgcolor: theme.palette.mode === "dark" ? "rgba(255,255,255,0.07)" : "rgba(15,23,42,0.08)",
          "& .MuiLinearProgress-bar": {
            borderRadius: 99,
            bgcolor: color,
          },
        }}
      />
    </Box>
  );
}

function StatusPanel({ title, caption, rows, loading }) {
  const total = rows.reduce((sum, item) => sum + Number(item.value || 0), 0);

  return (
    <DashboardPanel title={title} caption={caption} loading={loading} empty={!rows.length}>
      <Stack spacing={1.4}>
        {rows.map((row) => (
          <StatusRow key={row.label} total={total} {...row} />
        ))}
      </Stack>
    </DashboardPanel>
  );
}

export function LandPermitStatusOverviewPanels({ overview, loading }) {
  const summary = overview?.summary || {};
  const permits = summary.permits || {};
  const stalls = summary.stalls || {};
  const applications = summary.applications || {};
  const terminations = summary.terminations || {};

  return (
    <Grid container spacing={{ xs: 1.5, lg: 2 }}>
      <Grid size={{ xs: 12, md: 6, xl: 3 }}>
        <StatusPanel
          loading={loading}
          title="Kesehatan Izin Lahan"
          caption="Aktif, berakhir, dan nonaktif"
          rows={[
            { label: "Aktif", value: permits.active, colorKey: "active" },
            { label: "Kedaluwarsa", value: permits.expired, colorKey: "expired" },
            { label: "Non-Aktif", value: permits.terminated, colorKey: "terminated" },
          ]}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6, xl: 3 }}>
        <StatusPanel
          loading={loading}
          title="Status Lahan"
          caption="Ketersediaan lahan izin"
          rows={[
            { label: "Tersedia", value: stalls.available, colorKey: "available" },
            { label: "Terisi", value: stalls.occupied, colorKey: "occupied" },
            { label: "Maintenance", value: stalls.maintenance, colorKey: "maintenance" },
            { label: "Tidak Layak", value: stalls.unavailable, colorKey: "unavailable" },
          ]}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6, xl: 3 }}>
        <StatusPanel
          loading={loading}
          title="Status Permohonan"
          caption="Distribusi approval izin lahan"
          rows={[
            { label: "Disetujui", value: applications.approved, colorKey: "approved" },
            { label: "Dalam Proses", value: applications.process, colorKey: "process" },
            { label: "Ditolak", value: applications.rejected, colorKey: "rejected" },
          ]}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6, xl: 3 }}>
        <StatusPanel
          loading={loading}
          title="Status Terminasi"
          caption="Monitoring nonaktif izin lahan"
          rows={[
            { label: "Selesai", value: terminations.approved, colorKey: "approved" },
            { label: "Dalam Proses", value: terminations.process, colorKey: "process" },
            { label: "Ditolak", value: terminations.rejected, colorKey: "rejected" },
          ]}
        />
      </Grid>
    </Grid>
  );
}

export function LandAvailabilityPanel({ data = [], loading }) {
  const theme = useTheme();

  return (
    <DashboardPanel
      title="Ketersediaan Lahan per Lokasi"
      caption="Ringkasan kondisi lahan berdasarkan lokasi dan sektor"
      loading={loading}
      empty={!data.length}
      emptyText="Belum ada data lahan per lokasi."
      sx={{ minHeight: 360 }}
    >
      <Stack spacing={1.25}>
        {data.map((location) => {
          const total = Number(location.total_stalls || 0);
          const available = Number(location.available || 0);
          const percent = total ? (available / total) * 100 : 0;

          return (
            <Box
              key={location.location_id}
              sx={{
                p: 1.25,
                borderRadius: 2,
                border: `1px solid ${theme.ui.dashboardCardBorder}`,
                bgcolor:
                  theme.palette.mode === "dark"
                    ? "rgba(255,255,255,0.035)"
                    : "rgba(17,24,39,0.025)",
              }}
            >
              <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1, mb: 1 }}>
                <Typography noWrap sx={{ fontWeight: 600, fontSize: 13 }}>
                  {location.location_name}
                </Typography>
                <Typography sx={{ fontWeight: 600, fontSize: 13, color: "success.main" }}>
                  {available} tersedia
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={percent}
                sx={{
                  height: 9,
                  borderRadius: 99,
                  bgcolor: "rgba(128,128,128,0.14)",
                  "& .MuiLinearProgress-bar": {
                    borderRadius: 99,
                    bgcolor: "success.main",
                  },
                }}
              />
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "repeat(2, minmax(0, 1fr))",
                    sm: "repeat(4, minmax(0, 1fr))",
                  },
                  gap: 0.8,
                  mt: 1,
                }}
              >
                {[
                  ["Total", total, "text.primary"],
                  ["Terisi", location.occupied, "warning.main"],
                  ["Maintenance", location.maintenance, "info.main"],
                  ["Tidak layak", location.unavailable, "error.main"],
                ].map(([label, value, color]) => (
                  <Box key={label}>
                    <Typography sx={{ color: theme.ui.mutedText, fontWeight: 600, fontSize: 10 }}>
                      {label}
                    </Typography>
                    <Typography sx={{ color, fontWeight: 600, fontSize: 13 }}>
                      {value || 0}
                    </Typography>
                  </Box>
                ))}
              </Box>

              <Stack spacing={0.75} sx={{ mt: 1.1 }}>
                {(location.sectors || []).map((sector) => {
                  const sectorTotal = Number(sector.total_stalls || 0);
                  const sectorAvailable = Number(sector.available || 0);
                  const sectorPercent = sectorTotal
                    ? (sectorAvailable / sectorTotal) * 100
                    : 0;
                  const sectorLabel = sector.sector_code
                    ? `${sector.sector_name} (${sector.sector_code})`
                    : sector.sector_name;

                  return (
                    <Box
                      key={sector.sector_id}
                      sx={{
                        p: 1,
                        borderRadius: 1.5,
                        bgcolor:
                          theme.palette.mode === "dark"
                            ? "rgba(255,255,255,0.025)"
                            : "rgba(17,24,39,0.025)",
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 1,
                          mb: 0.75,
                        }}
                      >
                        <Typography noWrap sx={{ fontWeight: 600, fontSize: 12 }}>
                          {sectorLabel}
                        </Typography>
                        <Typography sx={{ color: "success.main", fontWeight: 600, fontSize: 12 }}>
                          {sectorAvailable}/{sectorTotal} tersedia
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={sectorPercent}
                        sx={{
                          height: 6,
                          borderRadius: 99,
                          bgcolor: "rgba(128,128,128,0.12)",
                          "& .MuiLinearProgress-bar": {
                            borderRadius: 99,
                            bgcolor: "success.main",
                          },
                        }}
                      />
                    </Box>
                  );
                })}
              </Stack>
            </Box>
          );
        })}
      </Stack>
    </DashboardPanel>
  );
}

export function LandPermitRecentActivityPanel({ data = [], loading }) {
  const theme = useTheme();

  return (
    <DashboardPanel
      title="Aktivitas Terbaru"
      caption="Notifikasi izin lahan terbaru untuk akun Anda"
      loading={loading}
      empty={!data.length}
      emptyText="Belum ada aktivitas izin lahan."
      sx={{ minHeight: 360 }}
    >
      <Stack spacing={1}>
        {data.map((item) => (
          <Box key={item.id} sx={getDashboardListItemSx(theme)}>
            <Box
              sx={{
                width: 38,
                height: 38,
                borderRadius: 2,
                display: "grid",
                placeItems: "center",
                color: theme.palette.primary.main,
                bgcolor:
                  theme.palette.mode === "dark"
                    ? "rgba(255, 152, 0, 0.12)"
                    : "rgba(230, 9, 9, 0.10)",
              }}
            >
              <Icon icon="solar:bell-bing-bold-duotone" fontSize={20} />
            </Box>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography noWrap sx={{ fontWeight: 600, fontSize: 13 }}>
                {item.title}
              </Typography>
              <Typography noWrap sx={{ color: theme.ui.mutedText, fontWeight: 600, fontSize: 12 }}>
                {item.message}
              </Typography>
            </Box>
            <Typography sx={{ color: theme.ui.mutedText, fontWeight: 600, fontSize: 11 }}>
              {fromNow(item.created_at)}
            </Typography>
          </Box>
        ))}
      </Stack>
    </DashboardPanel>
  );
}

export function LandPermitReportAction() {
  const theme = useTheme();

  return (
    <Button
      LinkComponent={Link}
      href="/land-stalls"
      size="small"
      endIcon={<Icon icon="solar:arrow-right-linear" />}
      sx={{
        minWidth: 0,
        px: 1.25,
        borderRadius: 1.5,
        fontWeight: 600,
        color: theme.palette.primary.main,
        bgcolor:
          theme.palette.mode === "dark"
            ? "rgba(255, 152, 0, 0.10)"
            : "rgba(230, 9, 9, 0.08)",
      }}
    >
      Buka Lahan
    </Button>
  );
}
