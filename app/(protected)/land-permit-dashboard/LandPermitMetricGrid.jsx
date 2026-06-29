"use client";

import React from "react";
import { Box, Skeleton, Stack, Typography, useTheme } from "@mui/material";
import { Icon } from "@iconify/react";
import { getDashboardCardSx } from "@/app/components/dashboard/dashboardStyles";
import formatRupiah from "@/app/components/formatrupiah/page";

const getMetricTone = (theme, color) => {
  const map = {
    success: theme.palette.success.main,
    info: theme.palette.info.main,
    warning: theme.palette.warning.main,
    error: theme.palette.error.main,
    primary: theme.palette.primary.main,
  };
  return map[color] || theme.palette.primary.main;
};

const buildMetrics = (overview) => {
  const access = overview?.access || {};
  const summary = overview?.summary || {};
  const queues = overview?.queues || {};
  const metrics = [];
  const actionTotal =
    Number(queues.applicationApproval?.total || 0) +
    Number(queues.terminationApproval?.total || 0);
  const paymentDueTotal =
    Number(summary.payments?.due_soon || 0) +
    Number(summary.payments?.overdue || 0);

  if (access.canSeeFinanceOperations) {
    metrics.push({
      label: "Pendapatan Bulan Ini",
      value: summary.income?.total || 0,
      caption: "Pendapatan bersih izin lahan bulan berjalan",
      icon: "solar:chart-square-bold-duotone",
      color: "primary",
      variant: "currency",
    });
  }

  if (
    access.canSeeApplicationApprovalQueue ||
    access.canSeeTerminationApprovalQueue
  ) {
    metrics.push({
      label: "Butuh Tindakan",
      value: actionTotal,
      caption: "Permohonan dan non-aktif menunggu role Anda",
      icon: "solar:clipboard-check-bold-duotone",
      color: "info",
    });
  }

  if (access.canSeePaymentDue) {
    metrics.push({
      label: "Pembayaran Jatuh Tempo",
      value: paymentDueTotal,
      caption: "Izin yang sudah/dekat mulai tetapi belum dibayar",
      icon: "solar:alarm-bold-duotone",
      color: "warning",
    });
  }

  metrics.push({
    label: "Dokumen Izin",
    value: summary.documentsCreated || 0,
    caption: "Total dokumen izin lahan yang sudah dibuat",
    icon: "solar:document-text-bold-duotone",
    color: "primary",
  });

  return metrics;
};

export default function LandPermitMetricGrid({ overview, loading }) {
  const theme = useTheme();
  const metrics = buildMetrics(overview);

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "1fr",
          sm: "repeat(auto-fit, minmax(220px, 1fr))",
          xl: "repeat(auto-fit, minmax(210px, 1fr))",
        },
        gap: { xs: 1.25, sm: 1.5 },
        alignItems: "stretch",
      }}
    >
      {(loading ? Array.from({ length: 4 }) : metrics).map((metric, index) => {
        const color = loading
          ? theme.palette.primary.main
          : getMetricTone(theme, metric.color);

        return (
          <Box
            key={metric?.label || index}
            sx={getDashboardCardSx(theme, {
              p: 1.5,
              minHeight: 136,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            })}
          >
            {loading ? (
              <Stack spacing={1}>
                <Skeleton width="70%" />
                <Skeleton width="45%" height={42} />
                <Skeleton width="85%" />
              </Stack>
            ) : (
              <>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: 1,
                  }}
                >
                  <Typography
                    sx={{
                      color: theme.ui.mutedText,
                      fontWeight: 800,
                      fontSize: 12,
                    }}
                  >
                    {metric.label}
                  </Typography>
                  <Box
                    sx={{
                      width: 38,
                      height: 38,
                      borderRadius: 2,
                      display: "grid",
                      placeItems: "center",
                      color,
                      bgcolor:
                        theme.palette.mode === "dark"
                          ? `${color}22`
                          : `${color}18`,
                    }}
                  >
                    <Icon icon={metric.icon} fontSize={22} />
                  </Box>
                </Box>
                <Box>
                  <Typography
                    sx={{
                      fontWeight: 950,
                      fontSize: 28,
                      lineHeight: 1.1,
                    }}
                  >
                    {metric.variant === "currency"
                      ? formatRupiah(metric.value)
                      : metric.value}
                  </Typography>
                  <Typography
                    sx={{
                      color: theme.ui.mutedText,
                      fontWeight: 700,
                      fontSize: 12,
                      mt: 0.75,
                    }}
                  >
                    {metric.caption}
                  </Typography>
                </Box>
              </>
            )}
          </Box>
        );
      })}
    </Box>
  );
}
