"use client";
import {
  Box,
  CircularProgress,
  Grid,
  Modal,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import React, { useState } from "react";
import axios from "axios";
import moment from "moment";

const ExpiredSessionModal = ({ open, onClose, counter = 0 }) => {
  const isMobile = useMediaQuery("(max-width:750px)");

  const theme = useTheme();

  const style = {
    width: isMobile ? "90vw" : 450,
    maxWidth: "98vw",
    bgcolor: "background.paper",
    color: "text.primary",
    borderRadius: "10px",
    boxShadow: 24,
    p: "18px 20px 18px 20px",
    maxHeight: "90vh",
    overflowY: "auto",
    textAlign: "center",
  };

  return (
    <Modal
      open={open}
    //   onClose={onClose}
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: 0, // hilangkan padding default
      }}
      BackdropProps={{
        sx: {
          backgroundColor: "rgba(30,30,30,0.25)",
          backdropFilter: "blur(6px)",
          WebkitBackdropFilter: "blur(6px)",
        },
      }}
    >
      <Box sx={style}>
        <CircularProgress sx={{ mb: 2 }} />
        <Typography
          variant="h6"
          sx={{ mb: 1, fontWeight: "bold", color: theme.palette.primary.main }}
        >
          Sesi Anda Hampir Habis
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Untuk keamanan, Anda akan logout otomatis dalam{" "}
          <span
            style={{
              fontWeight: "bold",
              color: theme.palette.primary.main,
            }}
          >
            {counter} Detik
          </span>{" "}
          .
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Jangan khawatir, Anda bisa login kembali setelah diarahkan ke halaman
          login.
        </Typography>
      </Box>
    </Modal>
  );
};

export default ExpiredSessionModal;
