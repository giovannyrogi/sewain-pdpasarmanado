"use client";
import React, { useEffect, useState } from "react";
import { useThemeMode } from "@/app/components/themeprovider/ThemeContext";
import { Icon } from "@iconify/react";
import {
  Box,
  Grid,
  Paper,
  Skeleton,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  LineChart,
  lineElementClasses,
  pieArcClasses,
  PieChart,
  pieClasses,
} from "@mui/x-charts";
import CardViewIncome from "./CardViewIncome";
import axios from "axios";

const Dashboard = () => {
  const isTablet = useMediaQuery("(max-width:1200px)");
  const isMobile = useMediaQuery("(max-width:600px)");
  const { themeMode, setThemeMode } = useThemeMode();
  const theme = useTheme();
  const [user, setUser] = useState(null);
  const [currentMonthIncomeWithoutTax, setCurrentMonthIncomeWithoutTax] =
    useState({});
  const [currentMonthIncomeWithTax, setCurrentMonthIncomeWithTax] = useState(
    {}
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("loggedInUser");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const getCurrentMonthIncome = async () => {
    try {
      const response = await axios.get("/api/dashboard/current-month-income");

      console.log("response", response);

      if (response.data.success) {
        const data = response.data.data;

        setCurrentMonthIncomeWithTax(response?.data?.data?.with_tax);
        setCurrentMonthIncomeWithoutTax(response?.data?.data?.without_tax);
      } else {
        console.error("Error fetching income:", response);
      }
    } catch (error) {
      console.error("Error fetching income:", error);
    }
  };

  const getAllData = async () => {
    try {
      setLoading(true);
      await getCurrentMonthIncome();
    } catch (error) {
      console.error(error);
    } finally {
      setTimeout(() => {
        setLoading(false);
      }, 1000);
    }
  };

  useEffect(() => {
    getAllData();
  }, []);

  const margin = { right: 24 };
  const uData = [4000, 3000, 2000, 2780, 1890, 2390, 3490];
  const xLabels = [
    "Page A",
    "Page B",
    "Page C",
    "Page D",
    "Page E",
    "Page F",
    "Page G",
  ];

  return (
    <Box
      sx={{
        width: "100%",
        height: "100%",
        p: 2,
      }}
    >
      <Grid container spacing={2} mt={3}>
        <Grid size={isMobile ? 12 : isTablet ? 6 : 4}>
          <CardViewIncome
            currentMonthIncomeWithTax={currentMonthIncomeWithTax}
            currentMonthIncomeWithoutTax={currentMonthIncomeWithoutTax}
            loading={loading}
          />
        </Grid>

        <Grid size={isMobile ? 12 : isTablet ? 6 : 4}>
          <Paper
            elevation={6}
            sx={{
              backgroundColor: "background.default",
              p: 2,
              height: "170px",
              borderRadius: "15px",
              // onhover drop shadow
              "&:hover": {
                boxShadow: 15,
                transition: "all 0.3s",
                border: `solid 1px ${theme.palette.primary.main}`,
              },
            }}
          >
            Dashboard Content
          </Paper>
        </Grid>
        <Grid size={isMobile ? 12 : isTablet ? 6 : 4}>
          <Paper
            elevation={6}
            sx={{
              backgroundColor: "background.default",
              p: 2,
              height: "170px",
              borderRadius: "15px",
              // onhover drop shadow
              "&:hover": {
                boxShadow: 15,
                transition: "all 0.3s",
                border: `solid 1px ${theme.palette.primary.main}`,
              },
            }}
          >
            Dashboard Content
          </Paper>
        </Grid>

        <Grid size={isMobile ? 12 : isTablet ? 12 : 8}>
          <Paper
            elevation={6}
            sx={{
              backgroundColor: "background.default",
              p: 1,
              borderRadius: "15px",
              height: "400px",
            }}
          >
            <LineChart
              series={[
                {
                  data: uData,
                  label: "Pendapatan",
                  area: true,
                  showMark: false,
                  color: theme.palette.primary.main,
                },
              ]}
              xAxis={[{ scaleType: "point", data: xLabels }]}
              sx={{
                [`& .${lineElementClasses.root}`]: {
                  display: "none",
                },
              }}
              margin={margin}
            />
          </Paper>
        </Grid>
        <Grid size={isMobile ? 12 : isTablet ? 12 : 4}>
          <Paper
            elevation={6}
            sx={{
              backgroundColor: "background.default",
              p: 2,
              borderRadius: "15px",
            }}
          >
            <PieChart
              series={[
                {
                  data: [
                    {
                      value: 10,
                      label: "Disetujui",
                      labelMarkType: (
                        <Icon icon="duo-icons:approved" fontSize="20px" />
                      ),
                      highlightScope: { fade: "global", highlight: "item" },
                    },
                    {
                      value: 15,
                      label: "Dalam Proses",
                      labelMarkType: "sadasd",
                    },
                    { value: 20, label: "Ditolak", labelMarkType: "" },
                  ],
                },
              ]}
              width={200}
              sx={{
                [`.${pieClasses.series}[data-series="outer"] .${pieArcClasses.root}`]:
                  {
                    opacity: 0.6,
                  },
              }}
              height={200}
            />
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
