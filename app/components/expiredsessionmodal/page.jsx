"use client";
import {
  CircularProgress,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import React from "react";
import AppModal from "@/app/components/modals/AppModal";

const ExpiredSessionModal = ({ open, onClose, counter = 0 }) => {
  const theme = useTheme();

  return (
    <AppModal
      open={open}
      title="Sesi Anda Hampir Habis"
      description="Untuk keamanan, aplikasi akan mengakhiri sesi secara otomatis."
      icon="solar:shield-warning-bold-duotone"
      width={460}
      showCloseButton={false}
    >
      <Stack alignItems="center" spacing={1.5} sx={{ textAlign: "center", py: 1 }}>
        <CircularProgress sx={{ mb: 2 }} />
        <Typography variant="body2" color="text.secondary">
          Untuk keamanan, Anda akan logout otomatis dalam{" "}
          <Typography
            component="span"
            sx={{ fontWeight: 900, color: theme.palette.primary.main }}
          >
            {counter} Detik
          </Typography>{" "}
          .
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Jangan khawatir, Anda bisa login kembali setelah diarahkan ke halaman
          login.
        </Typography>
      </Stack>
    </AppModal>
  );
};

export default ExpiredSessionModal;
