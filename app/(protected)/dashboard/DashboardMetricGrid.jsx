"use client";

import React, { useState } from "react";
import {
  Box,
  Button,
  Skeleton,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import { Icon } from "@iconify/react";
import { getDashboardCardSx } from "./dashboardStyles";
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

/**
 * Menentukan kartu metrik berdasarkan hak akses dashboard dari backend.
 * Data yang tidak relevan dengan role tidak dibuat di frontend.
 */
const buildMetrics = (overview) => {
  const access = overview?.access || {};
  const summary = overview?.summary || {};
  const queues = overview?.queues || {};
  const metrics = [];

  if (access.canSeeFinanceOperations) {
    metrics.push({
      label: "Pendapatan Bulan Ini",
      value: summary.income?.without_tax || 0,
      secondaryValue: summary.income?.with_tax || 0,
      caption: "Pendapatan bersih bulan berjalan",
      icon: "solar:chart-square-bold-duotone",
      color: "primary",
      variant: "income",
    });
  }

  if (access.canSeeTenantApprovalQueue) {
    metrics.push({
      label: "Approval Permohonan",
      value: queues.tenantApproval?.total || 0,
      caption: "Menunggu keputusan role Anda",
      icon: "solar:clipboard-check-bold-duotone",
      color: "info",
    });
  }

  if (access.canSeeContractBookMetric) {
    metrics.push({
      label: "Buku Kontrak",
      value: summary.contractsCreated || 0,
      caption: "Total dokumen kontrak yang sudah dibuat",
      icon: "solar:document-text-bold-duotone",
      color: "primary",
    });
  }

  return metrics;
};

/**
 * Grid kartu prioritas dashboard.
 * Kartu dibuat ringkas agar user langsung tahu angka yang perlu ditindaklanjuti.
 */
export default function DashboardMetricGrid({ overview, loading }) {
  const theme = useTheme();
  const metrics = buildMetrics(overview);
  const [incomeMode, setIncomeMode] = useState("withoutTax");

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
      {(loading ? Array.from({ length: 6 }) : metrics).map((metric, index) => {
        const color = loading
          ? theme.palette.primary.main
          : getMetricTone(theme, metric.color);

        return (
          <Box
            key={metric?.label || index}
            sx={getDashboardCardSx(theme, {
              p: 1.5,
              minHeight: metric?.secondaryValue ? 156 : 136,
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
                  {metric.variant === "income" ? (
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 1,
                      }}
                    >
                      <Box
                        sx={{
                          display: "inline-flex",
                          width: "fit-content",
                          p: 0.35,
                          borderRadius: 1.5,
                          bgcolor:
                            theme.palette.mode === "dark"
                              ? "rgba(255,255,255,0.05)"
                              : "rgba(17,24,39,0.05)",
                        }}
                      >
                        {[
                          { key: "withoutTax", label: "Tanpa PPN" },
                          { key: "withTax", label: "Dengan PPN" },
                        ].map((item) => (
                          <Button
                            key={item.key}
                            size="small"
                            onClick={() => setIncomeMode(item.key)}
                            sx={{
                              minWidth: 0,
                              px: 1,
                              py: 0.35,
                              borderRadius: 1.2,
                              fontWeight: 900,
                              fontSize: 11,
                              color:
                                incomeMode === item.key
                                  ? theme.palette.primary.main
                                  : theme.ui.mutedText,
                              bgcolor:
                                incomeMode === item.key
                                  ? theme.palette.mode === "dark"
                                    ? "rgba(255,152,0,0.14)"
                                    : "rgba(230,9,9,0.10)"
                                  : "transparent",
                            }}
                          >
                            {item.label}
                          </Button>
                        ))}
                      </Box>
                      <Typography
                        sx={{ fontWeight: 950, fontSize: 25, lineHeight: 1.1 }}
                      >
                        {formatRupiah(
                          incomeMode === "withoutTax"
                            ? metric.value
                            : metric.secondaryValue,
                        )}
                      </Typography>
                      <Typography
                        sx={{
                          color: theme.ui.mutedText,
                          fontWeight: 700,
                          fontSize: 11,
                        }}
                      >
                        {incomeMode === "withoutTax"
                          ? "Nilai bersih tanpa PPN"
                          : "Nilai termasuk PPN"}
                      </Typography>
                    </Box>
                  ) : (
                    <>
                      <Typography
                        sx={{
                          fontWeight: 950,
                          fontSize:
                            typeof metric.value === "string" &&
                            metric.value.length > 12
                              ? 20
                              : 28,
                          lineHeight: 1.1,
                        }}
                      >
                        {metric.value}
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
                    </>
                  )}
                </Box>
              </>
            )}
          </Box>
        );
      })}
    </Box>
  );
}
