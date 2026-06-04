"use client";
import React from "react";
import {
  Box,
  Divider,
  Grid,
  Paper,
  Skeleton,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useThemeMode } from "@/app/components/themeprovider/ThemeContext";
import {
  areaElementClasses,
  lineElementClasses,
  LineChart,
  markElementClasses,
} from "@mui/x-charts/LineChart";
import formatRupiah from "@/app/components/formatrupiah/page";

const ViewLineChart = ({ loading, yearlyIncomeData }) => {
  const theme = useTheme();
  const { themeMode } = useThemeMode();
  const isMobile = useMediaQuery("(max-width:750px)");
  const isSmallMobile = useMediaQuery("(max-width:480px)");

  // Pastikan data valid
  const incomeArray = Array.isArray(yearlyIncomeData)
    ? yearlyIncomeData
    : yearlyIncomeData?.data || [];

  const xLabels = incomeArray.map((item) => item.month_name);
  const withTaxData = incomeArray.map((item) =>
    Number(Number(item.total_with_tax || 0).toFixed(0)),
  );
  const withoutTaxData = incomeArray.map((item) =>
    Number(Number(item.total_without_tax || 0).toFixed(0)),
  );
  const axisTextColor =
    themeMode === "dark" ? theme.palette.grey[300] : theme.palette.grey[700];
  const gridColor =
    themeMode === "dark"
      ? "rgba(255,255,255,0.10)"
      : "rgba(15,23,42,0.10)";
  const chartHeight = isSmallMobile ? 300 : isMobile ? 330 : 360;

  return (
    <Paper
      elevation={6}
      sx={{
        backgroundColor: "background.paper",
        p: { xs: 1.5, sm: 2 },
        borderRadius: 2,
        minHeight: isSmallMobile ? 390 : isMobile ? 430 : 450,
        display: "flex",
        flexDirection: "column",
        border: `1px solid ${theme.palette.divider}`,
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
        "&:hover": {
          transform: "translateY(-3px)",
          boxShadow: themeMode === "dark" ? 8 : 6,
        },
      }}
    >
      {/* Header */}
      {loading ? (
        <Skeleton variant="text" width="50%" height={30} animation="wave" />
      ) : (
        <>
          <Typography
            sx={{
              fontSize: "15px",
              fontWeight: "bold",
              fontFamily: "Poppins",
              mb: 0.5,
            }}
          >
            Pendapatan Per Bulan
          </Typography>
          <Divider
            sx={{
              borderColor: theme.palette.primary.main,
              mb: 2,
              width: "100%",
            }}
          />
        </>
      )}

      {/* Chart */}
      {loading ? (
        <Box sx={{ flexGrow: 1 }}>
          <Skeleton
            variant="rounded"
            width="100%"
            height="100%"
            animation="wave"
          />
        </Box>
      ) : (
        <Box
          sx={{
            flexGrow: 1,
            minHeight: 0,
            width: "100%",
            overflow: "hidden",
          }}
        >
          <LineChart
            height={chartHeight}
            xAxis={[
              {
                data: xLabels,
                scaleType: "point",
                tickLabelStyle: {
                  fontFamily: "Poppins",
                  fontSize: isSmallMobile ? 10 : 11,
                  fill: axisTextColor,
                  fontWeight: 600,
                },
              },
            ]}
            yAxis={[
              {
                valueFormatter: (value) => {
                  if (value >= 1_000_000_000)
                    return `${(value / 1_000_000_000).toFixed(1)}M`;
                  if (value >= 1_000_000)
                    return `${(value / 1_000_000).toFixed(1)}JT`;
                  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
                  return value;
                },
                tickLabelStyle: {
                  fontFamily: "Poppins",
                  fontSize: isSmallMobile ? 10 : 11,
                  fill: axisTextColor,
                  fontWeight: 600,
                },
                width: isSmallMobile ? 42 : 56,
              },
            ]}
            series={[
              {
                id: "withoutTax",
                label: "Pendapatan Bersih",
                data: withoutTaxData,
                area: true,
                showMark: true,
                color: "#4CAF50",
                curve: "monotoneX",
                valueFormatter: (v) => formatRupiah(v),
              },
              {
                id: "withTax",
                label: "Pendapatan Dengan PPN (11%)",
                data: withTaxData,
                area: true,
                showMark: true,
                color: "#FFC107",
                curve: "monotoneX",
                valueFormatter: (v) => formatRupiah(v),
              },
            ]}
            grid={{ horizontal: true }}
            slotProps={{
              legend: {
                direction: isMobile ? "column" : "row",
                position: { vertical: "top", horizontal: "middle" },
                itemMarkWidth: 16,
                itemMarkHeight: 3,
                labelStyle: {
                  fontFamily: "Poppins",
                  fontSize: isSmallMobile ? 10 : 12,
                  fill: theme.palette.text.primary,
                  fontWeight: 600,
                },
              },
            }}
            sx={{
              "& .MuiChartsGrid-line": {
                stroke: gridColor,
                strokeDasharray: "5 5",
              },
              "& .MuiChartsAxis-line, & .MuiChartsAxis-tick": {
                stroke: theme.palette.divider,
              },
              [`& .${areaElementClasses.series}-withoutTax`]: {
                fill: "url(#dashboard-income-green-gradient)",
              },
              [`& .${areaElementClasses.series}-withTax`]: {
                fill: "url(#dashboard-income-yellow-gradient)",
              },
              [`& .${lineElementClasses.root}`]: {
                strokeWidth: 3,
                filter:
                  themeMode === "dark"
                    ? "drop-shadow(0 0 4px rgba(255,255,255,0.14))"
                    : "drop-shadow(0 3px 5px rgba(15,23,42,0.12))",
              },
              [`& .${markElementClasses.root}`]: {
                strokeWidth: 2,
                r: isSmallMobile ? 3 : 4,
              },
            }}
            margin={{
              top: isMobile ? 64 : 52,
              right: isSmallMobile ? 8 : 24,
              left: isSmallMobile ? 0 : 8,
              bottom: isMobile ? 28 : 34,
            }}
          >
            <defs>
              <linearGradient
                id="dashboard-income-green-gradient"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor="#4CAF50" stopOpacity="0.34" />
                <stop offset="65%" stopColor="#4CAF50" stopOpacity="0.10" />
                <stop offset="100%" stopColor="#4CAF50" stopOpacity="0" />
              </linearGradient>
              <linearGradient
                id="dashboard-income-yellow-gradient"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor="#FFC107" stopOpacity="0.30" />
                <stop offset="65%" stopColor="#FFC107" stopOpacity="0.09" />
                <stop offset="100%" stopColor="#FFC107" stopOpacity="0" />
              </linearGradient>
            </defs>
          </LineChart>
        </Box>
      )}
    </Paper>
  );
};

export default ViewLineChart;
