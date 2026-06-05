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
import DashboardPanel from "./DashboardPanel";
import { getDashboardListItemSx } from "./dashboardStyles";
import { fromNow } from "./dashboardUtils";

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
        <Typography sx={{ fontWeight: 800, fontSize: 12 }}>{label}</Typography>
        <Typography sx={{ fontWeight: 900, fontSize: 12 }}>{value || 0}</Typography>
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

/**
 * Ringkasan status inti: kontrak, ruangan, approval, dan terminasi.
 * Panel ini menggantikan beberapa kartu lama agar data lebih mudah dibandingkan.
 */
export function StatusOverviewPanels({ overview, loading }) {
  const summary = overview?.summary || {};
  const contracts = summary.contracts || {};
  const rooms = summary.rooms || {};
  const applications = summary.applications || {};
  const terminations = summary.terminations || {};

  return (
    <Grid container spacing={{ xs: 1.5, lg: 2 }}>
      <Grid size={{ xs: 12, md: 6, xl: 3 }}>
        <StatusPanel
          loading={loading}
          title="Kesehatan Kontrak"
          caption="Aktif, berakhir, dan nonaktif"
          rows={[
            { label: "Aktif", value: contracts.active, colorKey: "active" },
            { label: "Kadaluwarsa", value: contracts.expired, colorKey: "expired" },
            { label: "Terminasi", value: contracts.terminated, colorKey: "terminated" },
          ]}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6, xl: 3 }}>
        <StatusPanel
          loading={loading}
          title="Status Ruangan"
          caption="Ketersediaan ruang sewa"
          rows={[
            { label: "Tersedia", value: rooms.available, colorKey: "available" },
            { label: "Terisi", value: rooms.occupied, colorKey: "occupied" },
            { label: "Maintenance", value: rooms.maintenance, colorKey: "maintenance" },
            { label: "Tidak Layak", value: rooms.unavailable, colorKey: "unavailable" },
          ]}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6, xl: 3 }}>
        <StatusPanel
          loading={loading}
          title="Status Permohonan"
          caption="Distribusi approval sewa"
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
          caption="Monitoring nonaktif kontrak"
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

/**
 * Breakdown ketersediaan per lokasi untuk admin kontrak.
 * Informasi ini membantu cepat melihat lokasi yang masih bisa ditawarkan.
 */
export function LocationOccupancyPanel({ data = [], loading }) {
  const theme = useTheme();

  return (
    <DashboardPanel
      title="Ketersediaan Ruangan per Lokasi"
      caption="Ringkasan kondisi ruangan berdasarkan lokasi pasar/gedung"
      action={
        <Button
          LinkComponent={Link}
          href="/locations-report"
          size="small"
          endIcon={<Icon icon="solar:arrow-right-linear" />}
          sx={{
            minWidth: 0,
            px: 1.25,
            borderRadius: 1.5,
            fontWeight: 900,
            color: theme.palette.primary.main,
            bgcolor:
              theme.palette.mode === "dark"
                ? "rgba(255, 152, 0, 0.10)"
                : "rgba(230, 9, 9, 0.08)",
          }}
        >
          Buka Report
        </Button>
      }
      loading={loading}
      empty={!data.length}
      emptyText="Belum ada data ruangan per lokasi."
    >
      <Stack spacing={1.25}>
        {data.map((item) => {
          const total = Number(item.total_rooms || 0);
          const available = Number(item.available || 0);
          const occupied = Number(item.occupied || 0);
          const maintenance = Number(item.maintenance || 0);
          const unavailable = Number(item.unavailable || 0);
          const percent = total ? (available / total) * 100 : 0;
          return (
            <Box
              key={item.location_id}
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
                <Typography noWrap sx={{ fontWeight: 900, fontSize: 13 }}>
                  {item.location_name}
                </Typography>
                <Typography sx={{ fontWeight: 950, fontSize: 13, color: "success.main" }}>
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
                  ["Terisi", occupied, "warning.main"],
                  ["Maintenance", maintenance, "info.main"],
                  ["Tidak layak", unavailable, "error.main"],
                ].map(([label, value, color]) => (
                  <Box key={label}>
                    <Typography sx={{ color: theme.ui.mutedText, fontWeight: 750, fontSize: 10 }}>
                      {label}
                    </Typography>
                    <Typography sx={{ color, fontWeight: 950, fontSize: 13 }}>
                      {value}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          );
        })}
      </Stack>
    </DashboardPanel>
  );
}

/**
 * Aktivitas terbaru mengambil notifikasi user login.
 * Ini menjaga dashboard tetap personal dan tidak membuka aktivitas user lain.
 */
export function RecentActivityPanel({ data = [], loading }) {
  const theme = useTheme();

  return (
    <DashboardPanel
      title="Aktivitas Terbaru"
      caption="Notifikasi terbaru untuk akun Anda"
      loading={loading}
      empty={!data.length}
      emptyText="Belum ada aktivitas terbaru."
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
              <Typography noWrap sx={{ fontWeight: 900, fontSize: 13 }}>
                {item.title}
              </Typography>
              <Typography noWrap sx={{ color: theme.ui.mutedText, fontWeight: 650, fontSize: 12 }}>
                {item.message}
              </Typography>
            </Box>
            <Typography sx={{ color: theme.ui.mutedText, fontWeight: 800, fontSize: 11 }}>
              {fromNow(item.created_at)}
            </Typography>
          </Box>
        ))}
      </Stack>
    </DashboardPanel>
  );
}
