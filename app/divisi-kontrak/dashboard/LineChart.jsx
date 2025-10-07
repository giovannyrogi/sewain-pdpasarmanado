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
import { LineChart } from "@mui/x-charts/LineChart";
import formatRupiah from "@/app/components/formatrupiah/page";

const ViewLineChart = ({ loading, yearlyIncomeData }) => {
  const theme = useTheme();
  const { themeMode } = useThemeMode();
  const isMobile = useMediaQuery("(max-width:600px)");

  // Pastikan data valid
  const incomeArray = Array.isArray(yearlyIncomeData)
    ? yearlyIncomeData
    : yearlyIncomeData?.data || [];

  const xLabels = incomeArray.map((item) => item.month_name);
  const withTaxData = incomeArray.map((item) => item.total_with_tax || 0);
  const withoutTaxData = incomeArray.map((item) => item.total_without_tax || 0);

  return (
    <Paper
      elevation={6}
      sx={{
        backgroundColor: "background.default",
        p: 2,
        borderRadius: "15px",
        height: isMobile ? "400px" : "380px",
        display: "flex",
        flexDirection: "column",
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
        <Box sx={{ flexGrow: 1 }}>
          <LineChart
            height={310}
            xAxis={[
              {
                data: xLabels,
                scaleType: "point",
                // label: "Bulan",
              },
            ]}
            yAxis={[
              {
                // Hilangkan label & garis sumbu Y
                tickLabelStyle: { display: "none" }, // sembunyikan angka
                // tickSize: 0, // sembunyikan tanda kecil
                // label: "", // tidak ada label sumbu
                // axisLine: true, // sembunyikan garis sumbu
              },
            ]}
            series={[
              {
                label: "Pendapatan Dengan PPN (11%)",
                data: withTaxData,
                // area: true,
                showMark: true,
                color: "#FFC107",
                fillOpacity: 0.1,
                strokeWidth: 2.5,
                valueFormatter: (v) => formatRupiah(v),
              },
              {
                label: "Pendapatan Bersih",
                data: withoutTaxData,
                // area: true,
                showMark: true,
                color: "#4CAF50",
                fillOpacity: 0.1,
                strokeWidth: 2.5,
                valueFormatter: (v) => formatRupiah(v),
              },
            ]}
            // sx={{
            //   "& .MuiChartsAxis-label": {
            //     fontSize: "0.8rem",
            //     fill:
            //       themeMode === "dark"
            //         ? theme.palette.grey[300]
            //         : theme.palette.text.primary,
            //   },
            //   "& .MuiChartsLegend-root": {
            //     mt: 2,
            //   },
            // }}
            margin={{
              top: 10,
              right: 20,
              left: 10,
              bottom: 40,
            }}
          />
        </Box>
      )}
    </Paper>
  );
};

export default ViewLineChart;
