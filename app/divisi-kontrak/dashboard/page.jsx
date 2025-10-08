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
import CardViewContract from "./CardViewContract";
import ViewPieChart from "./PieChart";
import ViewLineChart from "./LineChart";
import CardViewStatusRooms from "./CardViewStatusRooms";

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
  const [currentContractStatus, setCurrentContractStatus] = useState({});
  const [contractApprovalStatus, setContractApprovalStatus] = useState({});
  const [yearlyIncomeData, setYearlyIncomeData] = useState({});
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

      // console.log("response", response);

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

  const getCurrentContractStatus = async () => {
    try {
      const response = await axios.get(
        "/api/dashboard/current-contracts-status"
      );

      // console.log("response contracts", response);

      if (response.data.success) {
        setCurrentContractStatus(response?.data?.data);
      } else {
        console.error("Error fetching current contracts:", response);
      }
    } catch (error) {
      console.error("Error fetching  current contracts:", error);
    }
  };

  const getContractApprovalStatus = async () => {
    try {
      const response = await axios.get(
        "/api/dashboard/contracts-approval-status"
      );

      // console.log("response approval", response);

      if (response.data.success) {
        setContractApprovalStatus(response.data.data);
      } else {
        console.error("Error fetching approval status:", response);
      }
    } catch (error) {
      console.error("Error fetching approval status:", error);
    }
  };

  const getYearlyIncomeData = async () => {
    try {
      const response = await axios.get("/api/dashboard/yearly-income"); // Ganti dengan URL API yang sesuai

      console.log("response yearly income", response);

      if (response.data.success) {
        setYearlyIncomeData(response.data.data);
      } else {
        console.error("Error fetching yearly income data:", response);
      }
    } catch (error) {
      console.error("Error fetching yearly income data:", error);
    }
  };

  const getAllData = async () => {
    try {
      setLoading(true);
      await getCurrentMonthIncome();
      await getCurrentContractStatus();
      await getContractApprovalStatus();
      await getYearlyIncomeData();
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
          <CardViewContract loading={loading} data={currentContractStatus} />
        </Grid>

        <Grid size={isMobile ? 12 : isTablet ? 6 : 4}>
          <CardViewStatusRooms loading={loading} />
        </Grid>

        <Grid size={isMobile ? 12 : isTablet ? 12 : 8}>
          <ViewLineChart
            loading={loading}
            yearlyIncomeData={yearlyIncomeData}
          />
        </Grid>

        <Grid size={isMobile ? 12 : isTablet ? 12 : 4}>
          <ViewPieChart
            loading={loading}
            contractApprovalStatus={contractApprovalStatus}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
