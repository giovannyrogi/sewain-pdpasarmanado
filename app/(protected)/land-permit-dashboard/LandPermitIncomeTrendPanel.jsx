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
import DashboardPanel from "@/app/components/dashboard/DashboardPanel";
import {
  MONTH_OPTIONS,
  getYearOptions,
} from "@/app/components/dashboard/dashboardUtils";
import formatRupiah from "@/app/components/formatrupiah/page";

const parseBucketDate = (value) => {
  if (!value) return null;
  const rawValue = String(value);
  const date = /^\d{4}-\d{2}-\d{2}$/.test(rawValue)
    ? new Date(`${rawValue}T00:00:00`)
    : new Date(rawValue);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatTooltipLabel = (row, period) => {
  const date = parseBucketDate(row?.bucket_date);
  if (!date) return row?.tooltip_label || row?.label || "";

  return new Intl.DateTimeFormat("id-ID", {
    weekday: period === "month" ? "long" : undefined,
    day: period === "month" ? "2-digit" : undefined,
    month: "long",
    year: "numeric",
  }).format(date);
};

function IncomeFilters({ filters, onChange }) {
  const theme = useTheme();
  const fieldSx = {
    height: 36,
    color: theme.palette.text.primary,
    ".MuiOutlinedInput-notchedOutline": {
      borderColor: theme.ui.dashboardCardBorder,
    },
    "&:hover .MuiOutlinedInput-notchedOutline": {
      borderColor: theme.palette.primary.main,
    },
  };

  return (
    <Stack
      direction={{ xs: "column", sm: "row" }}
      spacing={1}
      alignItems={{ xs: "stretch", sm: "center" }}
    >
      <ToggleButtonGroup
        exclusive
        size="small"
        value={filters.period}
        onChange={(_, value) => value && onChange({ period: value })}
        sx={{
          "& .MuiToggleButton-root": {
            height: 36,
            px: 1.5,
            fontWeight: 600,
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

export default function LandPermitIncomeTrendPanel({
  data,
  filters,
  onFilterChange,
  loading,
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery("(max-width:700px)");
  const chartRows = Array.isArray(data) ? data : [];
  const xLabels = chartRows.map((item) => item.label);
  const tooltipLabelByTick = new Map(
    chartRows.map((item) => [
      item.label,
      formatTooltipLabel(item, filters.period),
    ]),
  );
  const incomeData = chartRows.map((item) => Number(item.total_income || 0));
  const hasData = incomeData.some(Boolean);

  return (
    <DashboardPanel
      title="Tren Pendapatan Izin Lahan"
      caption="Pendapatan bersih izin lahan berdasarkan pembayaran yang sudah disetujui"
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
            <Typography sx={{ fontWeight: 600 }}>
              Belum ada pendapatan izin lahan pada periode ini.
            </Typography>
          </Box>
        ) : (
          <Box sx={{ width: "100%", overflow: "hidden" }}>
            <LineChart
              height={isMobile ? 330 : 380}
              xAxis={[
                {
                  data: xLabels,
                  scaleType: "point",
                  valueFormatter: (value, context) =>
                    context?.location === "tick"
                      ? value
                      : tooltipLabelByTick.get(value) || value,
                  tickLabelStyle: {
                    fill: theme.palette.text.secondary,
                    fontSize: isMobile ? 10 : 11,
                    fontWeight: 600,
                    fontFamily: "Poppins",
                  },
                },
              ]}
              yAxis={[
                {
                  width: isMobile ? 44 : 62,
                  valueFormatter: (value) => {
                    if (value >= 1_000_000_000) {
                      return `${(value / 1_000_000_000).toFixed(1)}M`;
                    }
                    if (value >= 1_000_000) {
                      return `${(value / 1_000_000).toFixed(1)}JT`;
                    }
                    if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
                    return value;
                  },
                  tickLabelStyle: {
                    fill: theme.palette.text.secondary,
                    fontSize: isMobile ? 10 : 11,
                    fontWeight: 600,
                    fontFamily: "Poppins",
                  },
                },
              ]}
              series={[
                {
                  id: "landPermitIncome",
                  label: "Pendapatan Bersih",
                  data: incomeData,
                  area: true,
                  showMark: true,
                  color: theme.palette.success.main,
                  curve: "monotoneX",
                  valueFormatter: (value) => formatRupiah(value),
                },
              ]}
              grid={{ horizontal: true }}
              margin={{ top: isMobile ? 72 : 58, right: 18, bottom: 34, left: 4 }}
              slotProps={{
                legend: {
                  direction: "row",
                  position: { vertical: "top", horizontal: "middle" },
                },
              }}
              sx={{
                "& .MuiChartsLegend-label": {
                  fill: theme.palette.text.primary,
                  color: theme.palette.text.primary,
                  fontFamily: "Poppins",
                  fontSize: 12,
                  fontWeight: 600,
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
                [`& .${areaElementClasses.series}-landPermitIncome`]: {
                  fill: "url(#land-permit-income-gradient)",
                },
                [`& .${lineElementClasses.root}`]: { strokeWidth: 3 },
                [`& .${markElementClasses.root}`]: { strokeWidth: 2, r: 4 },
              }}
            >
              <defs>
                <linearGradient
                  id="land-permit-income-gradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    stopColor={theme.palette.success.main}
                    stopOpacity="0.34"
                  />
                  <stop
                    offset="100%"
                    stopColor={theme.palette.success.main}
                    stopOpacity="0"
                  />
                </linearGradient>
              </defs>
            </LineChart>
          </Box>
        )}
      </Stack>
    </DashboardPanel>
  );
}
