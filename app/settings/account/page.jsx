"use client";
import { Box, Button, Paper, Typography, useTheme } from "@mui/material";
import React, { useEffect, useState } from "react";
import { Table, ConfigProvider, theme as antdTheme, Input, Tag } from "antd";
import moment from "moment";
import { Icon } from "@iconify/react";
import axios from "axios";
import settingsMenu from "@/app/components/menu/SettingsMenu";
import { useThemeMode } from "@/app/components/themeprovider/ThemeContext";
import Notification from "@/app/components/Notification";
import LoadingBackdrop from "@/app/components/loading/Backdrop";
import BreadcrumbPage from "@/app/components/breadcrumb/page";

const Account = () => {
  const { themeMode } = useThemeMode();
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [loadingMessage, setLoadingMessage] = useState("Loading...");

  const getRoomsData = async () => {
    // setLoading(true);
    // try {
    //   const response = await axios.get("/api/rooms");
    //   console.log("rooms", response);
    //   setDataRooms(response.data.data);
    //   setTimeout(() => {
    //     setLoading(false);
    //   }, 1000);
    // } catch (error) {
    //   console.log("error", error);
    //   setTimeout(() => {
    //     setLoading(false);
    //   }, 1000);
    // }
  };

  //   useEffect(() => {
  //     getRoomsData();
  //   }, []);

  return (
    <Box sx={{ width: "100%", height: "100%", minHeight: "100%", p: 2 }}>
      {/* Component Breadcrumbs disini */}
      {/* <BreadcrumbPage menuList={settingsMenu} /> */}
      <ConfigProvider
        theme={{
          algorithm:
            themeMode === "dark"
              ? antdTheme.darkAlgorithm
              : antdTheme.defaultAlgorithm,
          token: {
            colorPrimary: theme.palette.primary.main, // warna utama (angka aktif, outline, dsb)
            // colorText: theme.palette.text.primary, // warna teks default
            // colorBgContainer: theme.palette.background.default, // background tabel
          },
        }}
      >
        <Paper
          elevation={6}
          sx={{
            p: 2,
            width: "100%",
            bgcolor: "background.default",
            overflowX: "auto",
          }}
        >
          Account Page
        </Paper>
      </ConfigProvider>

      <LoadingBackdrop message={loadingMessage} open={loading} />
      {/* Snackbar notification */}
      <Notification
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      />
    </Box>
  );
};

export default Account;
