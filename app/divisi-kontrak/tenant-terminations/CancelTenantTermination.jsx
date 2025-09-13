"use client";

import {
  Box,
  Button,
  CircularProgress,
  Modal,
  Typography,
  useMediaQuery,
  useTheme,
  Fade,
  Grid,
  TextField,
} from "@mui/material";
import React, { useState } from "react";
import { Icon } from "@iconify/react";
import axios from "axios";

const CancelTenantTermination = ({
  open,
  onClose,
  selectedData,
  loadingTrue,
  loadingFalse,
  loading,
  setLoadingMessage,
  getDataTenantTerminations,
  user,
  onNotify,
}) => {
  const isMobile = useMediaQuery("(max-width:600px)");
  const theme = useTheme();
  const [notes, setNotes] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    loadingTrue();
    try {
      const response = await axios.delete(
        `/api/tenant-terminations/${selectedData.termination_id}`
      );

      if (response?.data.success) {
        onNotify?.({
          open: true,
          message: response.data.message || "Berhasil menghapus data!",
          severity: "success",
        });

        getDataTenantTerminations();
        setTimeout(() => {
          clearForm();
          onClose();
          loadingFalse();
        }, 1000);
      } else {
        onNotify?.({
          open: true,
          message: response?.data.message || "Gagal menghapus data.",
          severity: "error",
        });
        setTimeout(() => loadingFalse(), 1000);
      }
    } catch (error) {
      console.error("Error deleting Tenant Early Termination:", error);
      onNotify?.({
        open: true,
        message:
          error.response?.data?.message || "Terjadi error saat menghapus data.",
        severity: "error",
      });
      setTimeout(() => loadingFalse(), 1000);
    }
  };

  const clearForm = () => {
    setNotes("");
  };

  const style = {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: isMobile ? "90vw" : 400,
    maxWidth: "95vw",
    bgcolor: "background.paper",
    color: "text.primary",
    borderRadius: "16px",
    boxShadow: 24,
    p: isMobile ? 2 : "24px 32px 24px 32px",
    outline: "none",
    transition: "box-shadow 0.3s",
    //hide scrollbar
    "&::-webkit-scrollbar": {
      display: "none",
    },
  };
  return (
    <Modal
      open={open}
      onClose={onClose}
      closeAfterTransition
      BackdropProps={{
        sx: {
          backgroundColor: "rgba(30,30,30,0.25)",
          backdropFilter: "blur(6px)",
        },
      }}
    >
      <Fade in={open}>
        <Box sx={style}>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  mb: 1,
                }}
              >
                <Box
                  sx={{
                    background: theme.palette.error.main,
                    borderRadius: "50%",
                    width: 90,
                    height: 90,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    mb: 1,
                    boxShadow: `0 4px 16px ${theme.palette.error.main}55`,
                  }}
                >
                  <Icon
                    icon="lucide:unlock"
                    fontSize="60px"
                    color={theme.palette.error.contrastText}
                  />
                </Box>
                <Typography
                  sx={{
                    fontSize: 20,
                    fontWeight: 700,
                    color: theme.palette.error.main,
                    mb: 2,
                    letterSpacing: 0.5,
                  }}
                >
                  Batal Menonaktifkan Tenant
                </Typography>
                <Typography
                  sx={{
                    fontSize: 16,
                    color: theme.palette.text.secondary,
                    textAlign: "center",
                    mb: 1,
                  }}
                >
                  Tindakan ini tidak dapat di batalkan, Anda yakin ingin
                  membatalkan proses non-aktif Data Penyewa atas nama{" "}
                  <span
                    style={{
                      fontWeight: "bold",
                      color: theme.palette.primary.main,
                      //   border: `1px solid ${theme.palette.primary.main}`,
                      //   borderRadius: 4,
                      fontSize: 14,
                    }}
                  >
                    {selectedData && selectedData.tenant_name
                      ? selectedData.tenant_name
                      : ""}
                  </span>
                  , Lokasi{" "}
                  <span
                    style={{
                      fontWeight: "bold",
                      color: theme.palette.primary.main,
                      //   border: `1px solid ${theme.palette.primary.main}`,
                      //   borderRadius: 4,
                      fontSize: 14,
                    }}
                  >
                    {selectedData && selectedData.location_name
                      ? selectedData.location_name
                      : ""}
                  </span>{" "}
                  dari{" "}
                  <span
                    style={{
                      fontWeight: "bold",
                      color: theme.palette.primary.main,
                      //   border: `1px solid ${theme.palette.primary.main}`,
                      //   borderRadius: 4,
                      fontSize: 14,
                    }}
                  >
                    Ruangan{" "}
                    {selectedData && selectedData.room_number
                      ? selectedData.room_number
                      : ""}
                  </span>{" "}
                  ?
                </Typography>
              </Box>

              <Grid size={12} mt={1}>
                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  size="large"
                  sx={{
                    fontWeight: 700,
                    fontSize: 17,
                    textTransform: "none",
                    color: "#fff",
                    bgcolor: "error.main",
                    boxShadow: "0 2px 8px rgba(255,0,0,0.15)",
                    borderRadius: 2,
                    "&:hover": {
                      bgcolor: "error.dark",
                      boxShadow: "0 4px 16px rgba(255,0,0,0.25)",
                    },
                  }}
                  disabled={loading}
                  startIcon={
                    loading ? (
                      <CircularProgress size={22} color="inherit" />
                    ) : null
                  }
                >
                  {loading ? "Memproses..." : "Batal Non-Aktif"}
                </Button>
              </Grid>
            </Grid>
          </form>
        </Box>
      </Fade>
    </Modal>
  );
};

export default CancelTenantTermination;
