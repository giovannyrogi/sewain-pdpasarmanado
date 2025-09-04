"use client";
import {
  Box,
  Button,
  CircularProgress,
  Divider,
  Paper,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import { Table, ConfigProvider, theme as antdTheme, Input } from "antd";
import { useThemeMode } from "../../components/themeprovider/ThemeContext";
import { Icon } from "@iconify/react";
import LoadingBackdrop from "../../components/loading/Backdrop";
import Notification from "../../components/Notification";
import axios from "axios";
import BreadcrumbPage from "@/app/components/breadcrumb/page";
import menuAdmin from "@/app/components/menu/MenuItemAdmin";

const Locations = () => {
  const isMobile = useMediaQuery("(max-width:1200px)");
  const [dataLocations, setDataLocations] = useState([]);
  const { themeMode } = useThemeMode();
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [submittingLoading, setSubmittingLoading] = useState(false);
  const [selectedData, setSelectedData] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [locatioName, setLocatioName] = useState("");
  const [address, setAddress] = useState("");
  const [activeUntil, setActiveUntil] = useState(null);
  const [enableEdit, setEnableEdit] = useState(false);
  const [activeMenu, setActiveMenu] = useState("locations");
  const getLocationsData = async () => {
    setLoading(true);
    const currentUserData = localStorage.getItem("loggedInUser");
    if (!currentUserData) {
      setLoading(false);
      return;
    }
    const { location_id } = JSON.parse(currentUserData);

    try {
      const response = await axios.get(
        `/api/locations/searchbylocationid?location_id=${location_id}`
      );
      console.log("locations", response);
      const data = response.data.data[0] || {};
      setLocatioName(data.location_name || "");
      setAddress(data.address || "");
      setActiveUntil(data.active_until || null);
    } catch (error) {
      console.log("error", error);
    } finally {
      setLoading(false)
    }
  };

  useEffect(() => {
    getLocationsData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Mengambil location id dari localStorage
    const currentUserData = localStorage.getItem("loggedInUser");
    const { location_id } = JSON.parse(currentUserData);

    setSubmittingLoading(true);
    setLoading(true);
    try {
      const response = await axios.put(`/api/locations/${location_id}`, {
        location_name: locatioName,
        address,
        active_until: activeUntil,
      });
      console.log("response update", response);

      if (response.data.success) {
        setSnackbar({
          open: true,
          message: response.data.message || "Lokasi berhasil diubah!",
          severity: "success",
        });
      } else {
        setSnackbar({
          open: true,
          message: response.data.message || "Gagal mengubah lokasi.",
          severity: "error",
        });
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.message || "Terjadi error saat mengubah lokasi.",
        severity: "error",
      });
    } finally {
      getLocationsData();
      setTimeout(() => {
        setSubmittingLoading(false);
        setEnableEdit(false);
        setLoading(false);
      }, 1000);
    }
  };

  const handleEdit = () => {
    setLoading(true);
    setTimeout(() => {
      setEnableEdit(!enableEdit);
      setLoading(false);
    }, 500);
  };

  return (
    <Box sx={{ width: "100%", height: "100%", minHeight: "100%", p: 2 }}>
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
        {/* Component Breadcrumbs disini */}
        <BreadcrumbPage menuList={menuAdmin} />

        {/* Form */}
        <form onSubmit={(e) => handleSubmit(e)}>
          <Paper
            elevation={6}
            sx={{
              p: "10px 15px 10px 15px",
              width: "100%",
              bgcolor: "background.default",
              overflowX: "auto",
              mt: 4,
            }}
          >
            <Box
              sx={{
                mt: 1,
                display: "flex",
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Typography sx={{ fontWeight: "bold" }}>
                INFORMASI LOKASI
              </Typography>
              <Button
                size="small"
                variant="outlined"
                color="primary"
                onClick={() => handleEdit()}
                sx={{ minWidth: 0, px: 1 }}
              >
                <Icon icon="line-md:edit" fontSize={20} />
              </Button>
            </Box>
            <Divider
              sx={{
                mt: 1,
                mb: 1,
              }}
            />
            <Box sx={{}}>
              <TextField
                label="Nama Lokasi"
                variant="filled"
                fullWidth
                margin="normal"
                value={locatioName}
                onChange={(e) => setLocatioName(e.target.value)}
                autoFocus
                required
                disabled={enableEdit ? false : true}
                color="primary"
              />
              <TextField
                label="Alamat Lokasi"
                variant="filled"
                fullWidth
                margin="normal"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                autoFocus
                required
                disabled={enableEdit ? false : true}
                color="primary"
              />
            </Box>
            <Box
              sx={{
                display: "flex",
                flexDirection: "row",
                justifyContent: isMobile ? "center" : "flex-end",
                mb: 1,
              }}
            >
              <Button
                type="submit"
                variant="contained"
                color="primary"
                // size="small"
                sx={{
                  mt: 2,
                  fontWeight: "bold",
                  fontSize: 15,
                  textTransform: "none",
                  width: isMobile ? "100%" : "auto",
                }}
                disabled={loading || enableEdit ? false : true}
                startIcon={
                  submittingLoading && (
                    <CircularProgress size={22} color="inherit" />
                  )
                }
              >
                {submittingLoading ? "Mengirim..." : "Ubah Data"}
              </Button>
            </Box>
          </Paper>
        </form>
      </ConfigProvider>
      <LoadingBackdrop message="Loading..." open={loading} />
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

export default Locations;
