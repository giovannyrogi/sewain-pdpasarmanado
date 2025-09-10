import {
  Box,
  Button,
  CircularProgress,
  Modal,
  Typography,
  useMediaQuery,
  useTheme,
  Fade,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import axios from "axios";

const DeleteFloor = ({
  open,
  onClose,
  loadingTrue,
  loadingFalse,
  loading,
  onNotify,
  selectedData,
  getFloorData,
}) => {
  const isMobile = useMediaQuery("(max-width:600px)");
  const theme = useTheme();

  const handleSubmit = async (e) => {
    e.preventDefault();
    loadingTrue();
    try {
      const response = await axios.delete(
        `/api/location-floor-price/${selectedData.id}`
      );

      if (response?.data.success) {
        onNotify &&
          onNotify({
            open: true,
            message: response.data.message || "Lantai berhasil dihapus!",
            severity: "success",
          });
        getFloorData();
        setTimeout(() => {
          onClose();
          loadingFalse();
        }, 1000);
      } else {
        onNotify &&
          onNotify({
            open: true,
            message: response?.data.message || "Gagal menghapus Lantai.",
            severity: "error",
          });
      }
    } catch (error) {
      console.error("Error deleting Lantai:", error);
      onNotify &&
        onNotify({
          open: true,
          message:
            error.response.data.message ||
            "Terjadi error saat menghapus Lantai.",
          severity: "error",
        });
    }
    setTimeout(() => {
      loadingFalse();
    }, 1000);
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
          WebkitBackdropFilter: "blur(6px)",
        },
      }}
    >
      <Fade in={open}>
        <Box sx={style}>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              mb: 2,
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
                icon="mi:delete"
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
              Hapus Data Lantai
            </Typography>
            <Typography
              sx={{
                fontSize: 16,
                color: theme.palette.text.secondary,
                textAlign: "center",
                mb: 1,
              }}
            >
              Tindakan ini tidak dapat di batalkan, Anda yakin ingin menghapus data{" "}
              <span
                style={{
                  fontWeight: "bolder",
                  color: theme.palette.primary.main,
                  //   border: `1px solid ${theme.palette.primary.main}`,
                  //   borderRadius: 4,
                  fontSize: 14,
                }}
              >
                {selectedData && selectedData.floor
                  ? selectedData.floor
                  : ""}
              </span>{" "}
              dari lokasi{" "}
              <span
                style={{
                  fontWeight: "bolder",
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
              ?
            </Typography>
          </Box>
          <Button
            onClick={handleSubmit}
            variant="contained"
            fullWidth
            size="large"
            sx={{
              mt: 1,
              fontWeight: 700,
              fontSize: 17,
              textTransform: "none",
              color: "#fff",
              bgcolor: "error.main",
              boxShadow: "0 2px 8px rgba(255,0,0,0.10)",
              borderRadius: 2,
              transition: "background 0.2s, box-shadow 0.2s",
              "&:hover": {
                bgcolor: "error.dark",
                boxShadow: "0 4px 16px rgba(255,0,0,0.18)",
              },
            }}
            disabled={loading}
            startIcon={
              loading ? <CircularProgress size={22} color="inherit" /> : null
            }
          >
            {loading ? "Menghapus..." : "Hapus"}
          </Button>
        </Box>
      </Fade>
    </Modal>
  );
};

export default DeleteFloor;
