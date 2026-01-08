"use client";
import {
  Box,
  Button,
  Divider,
  Grid,
  Paper,
  Skeleton,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
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
import { useUser } from "@/app/utils/useUser";
import MENU_CONFIG from "@/app/components/menu/MenuConfig";
import EditPassword from "./EditPassword";
import EditUser from "./EditUser";

const Account = () => {
  const { user, setUser } = useUser();

  const isMobile = useMediaQuery("(max-width: 750px)");
  const [dataUsers, setDataUsers] = useState({});
  const { themeMode } = useThemeMode();
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [loadingMessage, setLoadingMessage] = useState("Loading...");
  const [openEditPasswordModal, setOpenEditPasswordModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);

  const getUsersData = async () => {
    try {
      const response = await axios.get(
        `/api/account/get-current-user-data?user_id=${user.id}`
      );
      // console.log("Users data", response);
      if (response.data.success) {
        setDataUsers(response.data.data);
      } else {
        setDataUsers({});
      }
    } catch (error) {
      console.log("error", error);
    }
  };

  const getAllData = async () => {
    setLoading(true);
    try {
      await getUsersData();
    } catch (error) {
      console.log("error", error);
    } finally {
      setTimeout(() => {
        setLoading(false);
      }, 1000);
    }
  };

  useEffect(() => {
    if (user) {
      getAllData();
    }
  }, [user]);

  return (
    <Box sx={{ width: "100%", height: "100%", minHeight: "100%", p: 2 }}>
      {/* Component Breadcrumbs disini */}
      <BreadcrumbPage menuList={MENU_CONFIG} />
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
          <Grid container>
            <Grid size={12}>
              <Typography
                sx={{
                  fontSize: "14px",
                  fontWeight: "bold",
                  fontFamily: "poppins, sans-serif",
                }}
              >
                Informasi Akun
              </Typography>
            </Grid>

            <Divider
              sx={{
                mt: 0.5,
                mb: 4,
                width: "100%",
                borderColor: theme.palette.primary.main,
              }}
            />

            {/* Informasi Akun */}
            <Grid size={12} mb={6}>
              {[
                { label: "Nama", value: dataUsers?.full_name },
                { label: "Username", value: dataUsers?.username },
                {
                  label: "Email",
                  value: dataUsers?.email,
                  // capitalize: true,
                },
                { label: "No. Telp", value: dataUsers?.phone },
                // { label: "Email", value: dataUsers?.email },
              ].map((item, index, arr) => (
                <Grid container size={12} key={index}>
                  {/* Label */}
                  <Grid size={isMobile ? 3.5 : 2}>
                    {loading ? (
                      <Skeleton
                        width={isMobile ? 60 : 80}
                        height={20}
                        sx={{ borderRadius: "4px" }}
                      />
                    ) : (
                      <Typography
                        sx={{
                          fontSize: "14px",
                          fontWeight: "bold",
                          // color: theme.palette.text.disabled,
                          fontFamily: "poppins, sans-serif",
                        }}
                      >
                        {item.label}
                      </Typography>
                    )}
                  </Grid>

                  {/* Value */}
                  <Grid size={isMobile ? 8.5 : 10}>
                    {loading ? (
                      <Skeleton
                        width={isMobile ? "70%" : "40%"}
                        height={20}
                        variant="rounded"
                        animation="wave"
                      />
                    ) : (
                      <Typography
                        sx={{
                          fontSize: "14px",
                          fontWeight: "500",
                          // color: theme.palette.text.disabled,
                          fontFamily: "poppins, sans-serif",
                          textTransform: item.capitalize
                            ? "capitalize"
                            : "none",
                        }}
                      >
                        : {item.value || "-"}
                      </Typography>
                    )}
                  </Grid>

                  {/* Divider — hide on last item */}
                  {!loading && index !== arr.length - 1 && (
                    <Grid size={12}>
                      <Divider
                        sx={{
                          my: 1,
                          width: "100%",
                          opacity: 0.5,
                          bgcolor: theme.palette.text.disabled,
                        }}
                      />
                    </Grid>
                  )}

                  {/* Divider skeleton when loading */}
                  {loading && index !== arr.length - 1 && (
                    <Grid size={12}>
                      <Skeleton
                        variant="rectangular"
                        height={1}
                        sx={{ my: 1, opacity: 0.3 }}
                      />
                    </Grid>
                  )}
                </Grid>
              ))}
            </Grid>

            <Grid
              size={12}
              align={isMobile ? "center" : "end"}
              mb={isMobile ? 1 : 0}
            >
              <Button
                variant="contained"
                color="primary"
                size="small"
                // fullWidth
                sx={{
                  width: isMobile ? "100%" : "auto",
                  mr: isMobile ? 0 : 4,
                  mb: isMobile ? 3 : 0,
                  fontWeight: "bold",
                  fontSize: 14,
                  textTransform: "none",
                }}
                onClick={() => setOpenEditPasswordModal(true)}
                disabled={loading}
              >
                Ubah Password
              </Button>
              <Button
                variant="contained"
                color="primary"
                size="small"
                // fullWidth
                sx={{
                  width: isMobile ? "100%" : "auto",
                  fontWeight: "bold",
                  fontSize: 14,
                  textTransform: "none",
                }}
                disabled={loading}
                onClick={() => setOpenEditModal(true)}
              >
                Ubah Informasi Akun
              </Button>
            </Grid>
          </Grid>
        </Paper>
      </ConfigProvider>

      <EditUser
        open={openEditModal}
        onClose={() => setOpenEditModal(false)}
        loadingTrue={() => setLoading(true)}
        loadingFalse={() => setLoading(false)}
        loading={loading}
        getUsersData={getUsersData}
        selectedData={dataUsers}
        onNotify={(notif) => setSnackbar(notif)}
        user={user}
        setUser={setUser}
      />

      <EditPassword
        open={openEditPasswordModal}
        onClose={() => setOpenEditPasswordModal(false)}
        loadingTrue={() => setLoading(true)}
        loadingFalse={() => setLoading(false)}
        loading={loading}
        getUsersData={getUsersData}
        onNotify={(notif) => setSnackbar(notif)}
        selectedData={dataUsers}
        user={user}
      />

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
