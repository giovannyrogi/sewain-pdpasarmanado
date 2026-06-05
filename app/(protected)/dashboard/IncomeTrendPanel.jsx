"use client";

import React from "react";
import {
  Box,
  FormControl,
  MenuItem,
  Select,
  Skeleton,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  areaElementClasses,
  lineElementClasses,
  LineChart,
  markElementClasses,
} from "@mui/x-charts/LineChart";
import formatRupiah from "@/app/components/formatrupiah/page";
import DashboardPanel from "./DashboardPanel";
import { MONTH_OPTIONS, getYearOptions } from "./dashboardUtils";

/**
 * Kontrol filter chart pendapatan.
 * Dibuat controlled dari page agar perubahan filter langsung melakukan fetch ulang.
 */
function IncomeFilters({ filters, onChange }) {
  const theme = useTheme();
  const fieldSx = {
    height: 36,
    color: theme.palette.text.primary,
    ".MuiOutlinedInput-notchedOutline": { borderColor: theme.ui.dashboardCardBorder },
    "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: theme.palette.primary.main },
  };

  return (
    <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ xs: "stretch", sm: "center" }}>
      <ToggleButtonGroup
        exclusive
        size="small"
        value={filters.period}
        onChange={(_, value) => value && onChange({ period: value })}
        sx={{
          "& .MuiToggleButton-root": {
            height: 36,
            px: 1.5,
            fontWeight: 900,
            borderColor: theme.ui.dashboardCardBorder,
            color: theme.ui.mutedText,
            "&.Mui-selected": {
              color: theme.palette.primary.main,
              bgcolor:
                theme.palette.mode === "dark"
                  ? "rgba(255, 152, 0, 0.14)"
                  : "rgba(230, 9, 9, 0.10)",
            },
          },
        }}
      >
        <ToggleButton value="year">Tahunan</ToggleButton>
        <ToggleButton value="month">Bulanan</ToggleButton>
      </ToggleButtonGroup>

      <FormControl size="small">
        <Select
          value={filters.year}
          onChange={(event) => onChange({ year: Number(event.target.value) })}
          sx={fieldSx}
        >
          {getYearOptions().map((year) => (
            <MenuItem key={year} value={year}>
              {year}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {filters.period === "month" && (
        <FormControl size="small">
          <Select
            value={filters.month}
            onChange={(event) => onChange({ month: Number(event.target.value) })}
            sx={fieldSx}
          >
            {MONTH_OPTIONS.map((month) => (
              <MenuItem key={month.value} value={month.value}>
                {month.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}
    </Stack>
  );
}

/**
 * Chart pendapatan utama dashboard.
 * Mendukung filter tahunan dan bulanan; data tetap berasal dari backend agar aman dan konsisten.
 */
export default function IncomeTrendPanel({ data, filters, onFilterChange, loading }) {
  const theme = useTheme();
  const isMobile = useMediaQuery("(max-width:700px)");
  const chartRows = Array.isArray(data) ? data : [];
  const xLabels = chartRows.map((item) => item.label);
  const withTaxData = chartRows.map((item) => Number(item.total_with_tax || 0));
  const withoutTaxData = chartRows.map((item) => Number(item.total_without_tax || 0));
  const hasData = withTaxData.some(Boolean) || withoutTaxData.some(Boolean);

  return (
    <DashboardPanel
      title="Tren Pendapatan"
      caption="Bandingkan pendapatan bersih dan pendapatan termasuk PPN"
      loading={false}
      sx={{ minHeight: { xs: 430, md: 500 } }}
    >
      <Stack spacing={1.5} sx={{ flex: 1, minHeight: 0 }}>
        <IncomeFilters filters={filters} onChange={onFilterChange} />

        {loading ? (
          <Skeleton variant="rounded" height={360} />
        ) : !hasData ? (
          <Box
            sx={{
              minHeight: 330,
              display: "grid",
              placeItems: "center",
              color: theme.ui.mutedText,
              textAlign: "center",
            }}
          >
            <Typography sx={{ fontWeight: 800 }}>Belum ada pendapatan pada periode ini.</Typography>
          </Box>
        ) : (
          <Box sx={{ width: "100%", overflow: "hidden" }}>
            <LineChart
              height={isMobile ? 330 : 380}
              xAxis={[
                {
                  data: xLabels,
                  scaleType: "point",
                  tickLabelStyle: {
                    fill: theme.palette.text.secondary,
                    fontSize: isMobile ? 10 : 11,
                    fontWeight: 700,
                    fontFamily: "Poppins",
                  },
                },
              ]}
              yAxis={[
                {
                  width: isMobile ? 44 : 62,
                  valueFormatter: (value) => {
                    if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}M`;
                    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}JT`;
                    if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
                    return value;
                  },
                  tickLabelStyle: {
                    fill: theme.palette.text.secondary,
                    fontSize: isMobile ? 10 : 11,
                    fontWeight: 700,
                    fontFamily: "Poppins",
                  },
                },
              ]}
              series={[
                {
                  id: "withoutTax",
                  label: "Pendapatan Bersih",
                  data: withoutTaxData,
                  area: true,
                  showMark: true,
                  color: theme.palette.success.main,
                  curve: "monotoneX",
                  valueFormatter: (value) => formatRupiah(value),
                },
                {
                  id: "withTax",
                  label: "Dengan PPN",
                  data: withTaxData,
                  area: true,
                  showMark: true,
                  color: theme.palette.warning.main,
                  curve: "monotoneX",
                  valueFormatter: (value) => formatRupiah(value),
                },
              ]}
              grid={{ horizontal: true }}
              margin={{ top: isMobile ? 72 : 58, right: 18, bottom: 34, left: 4 }}
              slotProps={{
                legend: {
                  direction: isMobile ? "column" : "row",
                  position: { vertical: "top", horizontal: "middle" },
                },
              }}
              sx={{
                "& .MuiChartsLegend-label": {
                  fill: theme.palette.text.primary,
                  color: theme.palette.text.primary,
                  fontFamily: "Poppins",
                  fontSize: 12,
                  fontWeight: 800,
                },
                "& .MuiChartsLegend-mark": { width: 16, height: 3, rx: 2 },
                "& .MuiChartsGrid-line": {
                  stroke:
                    theme.palette.mode === "dark"
                      ? "rgba(255,255,255,0.10)"
                      : "rgba(15,23,42,0.10)",
                  strokeDasharray: "5 5",
                },
                "& .MuiChartsAxis-line, & .MuiChartsAxis-tick": {
                  stroke: theme.ui.dashboardCardBorder,
                },
                [`& .${areaElementClasses.series}-withoutTax`]: {
                  fill: "url(#income-green-gradient)",
                },
                [`& .${areaElementClasses.series}-withTax`]: {
                  fill: "url(#income-yellow-gradient)",
                },
                [`& .${lineElementClasses.root}`]: { strokeWidth: 3 },
                [`& .${markElementClasses.root}`]: { strokeWidth: 2, r: 4 },
              }}
            >
              <defs>
                <linearGradient id="income-green-gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={theme.palette.success.main} stopOpacity="0.34" />
                  <stop offset="100%" stopColor={theme.palette.success.main} stopOpacity="0" />
                </linearGradient>
                <linearGradient id="income-yellow-gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={theme.palette.warning.main} stopOpacity="0.30" />
                  <stop offset="100%" stopColor={theme.palette.warning.main} stopOpacity="0" />
                </linearGradient>
              </defs>
            </LineChart>
          </Box>
        )}
      </Stack>
    </DashboardPanel>
  );
}
