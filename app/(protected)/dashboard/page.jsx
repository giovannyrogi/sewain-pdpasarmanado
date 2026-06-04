"use client";
import React, { useEffect, useState } from "react";
import { Box, Grid, useMediaQuery, useTheme } from "@mui/material";
import CardViewIncome from "./CardViewIncome";
import axios from "axios";
import CardViewContract from "./CardViewContract";
import ViewPieChart from "./PieChart";
import ViewLineChart from "./LineChart";
import CardViewStatusRooms from "./CardViewStatusRooms";
import WelcomeCard from "./WelcomeCard";
import { useUser } from "@/app/utils/useUser";
import LoadingBackdrop from "@/app/components/loading/Backdrop";

const isUnauthorizedRequest = (error) => axios.isAxiosError(error) && error.response?.status === 401;

/**
 * Dashboard requests can be interrupted when a user logs out or the session
 * expires while initial data is still loading. A 401 in that moment is expected,
 * so only unexpected errors are printed to the console.
 */
const logDashboardError = (label, error) => {
  if (isUnauthorizedRequest(error) || axios.isCancel(error)) return;

  console.error(label, error);
};

const Dashboard = () => {
  const theme = useTheme();
  const { user } = useUser();
  const isTablet = useMediaQuery("(max-width:1300px)");
  const isMobile = useMediaQuery("(max-width:750px)");
  const [dataUser, setDataUser] = useState(null);
  const [currentMonthIncomeWithoutTax, setCurrentMonthIncomeWithoutTax] =
    useState({});
  const [currentMonthIncomeWithTax, setCurrentMonthIncomeWithTax] = useState(
    {},
  );
  const [currentContractStatus, setCurrentContractStatus] = useState([]);
  const [contractApprovalStatus, setContractApprovalStatus] = useState([]);
  const [yearlyIncomeData, setYearlyIncomeData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dataRoomStatus, setDataRoomStatus] = useState([]);

  // const testWhatsappAPI = async () => {
  //   try {
  //     const response = await axios({
  //       url: "https://graph.facebook.com/v25.0/993679387172475/messages",
  //       method: "POST",
  //       headers: {
  //         Authorization: `Bearer EAAVcOit4N1oBRMXiXOT3PttnT9JO7k9lYpGL4N1NNH9K0wJTwMAYw9iZAq9eLafIFycZCEtmoOA0kLS1urzybgjTQvZBRYYygXIMEtrB8cddoK4Df1MPaucTvZBORuubuY1kda4hohBSbXpTqo94GHLvV1VKit0neUK6nGflS34mazBy202ZBAAIP9AP0RmQacoB6eecyJCUOZBDRwcvrlV8vxRV4bInfPPXY8ZBGNw2dZCEFGi7xjn7sUTtmOTNdcAkwRpJU17yv0JhZASNaG5UoWQZDZD`,
  //         "Content-Type": "application/json",
  //       },
  //       data: JSON.stringify({
  //         messaging_product: "whatsapp",
  //         to: "6282187708266",
  //         type: "template",
  //         template: {
  //           name: "hello_world",
  //           language: {
  //             code: "en_US",
  //           },
  //         },
  //       }),
  //     });

  //     console.log("whatsapp response", response);
  //   } catch (error) {
  //     console.error("Error fetching whatsapp api:", error);
  //   }
  // };

  const getCurrentMonthIncome = async () => {
    try {
      const response = await axios.get("/api/dashboard/current-month-income");

      // console.log("response monthly income", response);

      if (response.data.success) {
        const data = response.data.data;

        setCurrentMonthIncomeWithTax(response?.data?.data?.with_tax);
        setCurrentMonthIncomeWithoutTax(response?.data?.data?.without_tax);
      } else {
        console.error("Error fetching income:", response);
      }
    } catch (error) {
      logDashboardError("Error fetching income:", error);
    }
  };

  const getCurrentContractStatus = async () => {
    try {
      const response = await axios.get(
        "/api/dashboard/current-contracts-status",
      );

      // console.log("response contracts", response);

      if (response.data.success) {
        setCurrentContractStatus(response?.data?.data);
      } else {
        console.error("Error fetching current contracts:", response);
      }
    } catch (error) {
      logDashboardError("Error fetching current contracts:", error);
    }
  };

  const getContractApprovalStatus = async () => {
    try {
      const response = await axios.get(
        "/api/dashboard/contracts-approval-status",
      );

      // console.log("response approval", response);

      if (response.data.success) {
        setContractApprovalStatus(response.data.data);
      } else {
        console.error("Error fetching approval status:", response);
      }
    } catch (error) {
      logDashboardError("Error fetching approval status:", error);
    }
  };

  const getYearlyIncomeData = async () => {
    try {
      const response = await axios.get("/api/dashboard/yearly-income");

      // console.log("response yearly income", response);

      if (response.data.success) {
        setYearlyIncomeData(response.data.data);
      } else {
        console.error("Error fetching yearly income data:", response);
      }
    } catch (error) {
      logDashboardError("Error fetching yearly income data:", error);
    }
  };

  const getDataRoomStatus = async () => {
    try {
      const response = await axios.get("/api/dashboard/current-rooms-status");

      // console.log("response room status", response);

      if (response.data.success) {
        setDataRoomStatus(response.data.data);
      } else {
        console.error("Error fetching room status data:", response);
      }
    } catch (error) {
      logDashboardError("Error fetching room status data:", error);
    }
  };

  const getUserData = async () => {
    try {
      if (user) {
        setDataUser(user);
      }
    } catch (error) {
      logDashboardError("Error fetching user data:", error);
    }
  };

  const getAllData = async () => {
    try {
      setLoading(true);
      // await testWhatsappAPI();
      await getUserData();
      await getCurrentMonthIncome();
      await getCurrentContractStatus();
      await getContractApprovalStatus();
      await getYearlyIncomeData();
      await getDataRoomStatus();
    } catch (error) {
      logDashboardError("Error fetching dashboard data:", error);
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
        minHeight: "calc(100vh - 64px)",
        bgcolor: theme.ui.pageBg,
        p: { xs: 1.25, sm: 2 },
        mt: { xs: 0.5, sm: 1 },
        transition: "background-color 0.2s ease",
      }}
    >
      <LoadingBackdrop open={loading} message="Memuat data dashboard..." />

      <Grid container size={12}>
        <Grid size={12}>
          <WelcomeCard
            user={user}
            loading={loading}
            isMobile={isMobile}
            isTablet={isTablet}
          />
        </Grid>
      </Grid>

      <Grid container spacing={{ xs: 1.5, sm: 2 }} mt={2} alignItems="flex-start">
        {/* === KOLOM 1 (KIRI) === */}
        <Grid
          container
          size={isMobile || isTablet ? 12 : 8}
          direction="column"
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
            alignSelf: "flex-start",
          }}
        >
          <Grid container spacing={2}>
            <Grid size={isMobile ? 12 : 6}>
              <CardViewIncome
                currentMonthIncomeWithTax={currentMonthIncomeWithTax}
                currentMonthIncomeWithoutTax={currentMonthIncomeWithoutTax}
                loading={loading}
              />
            </Grid>

            <Grid size={isMobile ? 12 : 6}>
              <CardViewContract
                loading={loading}
                data={currentContractStatus}
              />
            </Grid>
          </Grid>

          <Grid size={12}>
            <ViewLineChart
              loading={loading}
              yearlyIncomeData={yearlyIncomeData}
            />
          </Grid>
        </Grid>

        {/* === KOLOM 2 (KANAN) === */}
        <Grid
          container
          size={isMobile || isTablet ? 12 : 4}
          sx={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            gap: 2,
            alignSelf: "flex-start",
          }}
        >
          <Grid size={isMobile ? 12 : isTablet ? 6 : 12}>
            <CardViewStatusRooms loading={loading} data={dataRoomStatus} />
          </Grid>

          <Grid size={isMobile ? 12 : isTablet ? 6 : 12}>
            <ViewPieChart
              loading={loading}
              contractApprovalStatus={contractApprovalStatus}
            />
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
