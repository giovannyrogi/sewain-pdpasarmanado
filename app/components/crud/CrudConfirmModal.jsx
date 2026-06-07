"use client";

import React from "react";
import {
  Box,
  Button,
  Divider,
  Modal,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import { Icon } from "@iconify/react";
import LoadingBackdrop from "@/app/components/loading/Backdrop";

/**
 * Modal konfirmasi reusable untuk aksi destruktif seperti delete.
 * Data tidak dihapus di komponen ini; parent tetap mengontrol request API agar
 * aturan bisnis tiap halaman tidak tersembunyi di komponen presentasional.
 */
export default function CrudConfirmModal({
  open,
  title = "Konfirmasi Aksi",
  description,
  highlight,
  confirmLabel = "Lanjutkan",
  loadingLabel = "Memproses...",
  severity = "error",
  loading = false,
  onClose,
  onConfirm,
}) {
  const theme = useTheme();
  const color = theme.palette[severity]?.main || theme.palette.error.main;

  return (
    <>
      <Modal
        open={open}
        onClose={loading ? undefined : onClose}
        sx={{ display: "flex", alignItems: "center", justifyContent: "center", p: 2 }}
        slotProps={{
          backdrop: {
            sx: {
              backgroundColor:
                theme.palette.mode === "dark"
                  ? "rgba(0,0,0,0.58)"
                  : "rgba(15,23,42,0.18)",
              backdropFilter: "blur(10px)",
            },
          },
        }}
      >
        <Box
          sx={{
            width: 430,
            maxWidth: "100%",
            bgcolor: theme.ui.menuPaperBg,
            color: "text.primary",
            border: `1px solid ${theme.ui.dashboardCardBorder}`,
            borderRadius: 3,
            boxShadow: theme.ui.shellShadow,
            outline: "none",
            overflow: "hidden",
          }}
        >
          <Stack alignItems="center" spacing={1.5} sx={{ p: { xs: 2.5, sm: 3 } }}>
            <Box
              sx={{
                width: 72,
                height: 72,
                borderRadius: "50%",
                display: "grid",
                placeItems: "center",
                color,
                bgcolor:
                  theme.palette.mode === "dark" ? `${color}24` : `${color}16`,
                border: `1px solid ${color}44`,
              }}
            >
              <Icon icon="ion:trash-outline" fontSize={38} />
            </Box>
            <Box sx={{ textAlign: "center" }}>
              <Typography sx={{ fontFamily: "Poppins", fontWeight: 850, fontSize: 21 }}>
                {title}
              </Typography>
              {description && (
                <Typography
                  sx={{
                    mt: 0.75,
                    color: theme.ui.mutedText,
                    fontFamily: "Poppins",
                    fontWeight: 600,
                    fontSize: 13,
                    lineHeight: 1.7,
                  }}
                >
                  {description}{" "}
                  {highlight && (
                    <Box component="strong" sx={{ color: "text.primary", fontWeight: 850 }}>
                      {highlight}
                    </Box>
                  )}
                </Typography>
              )}
            </Box>
          </Stack>

          <Divider sx={{ borderColor: theme.ui.dashboardCardBorder }} />

          <Stack
            direction={{ xs: "column-reverse", sm: "row" }}
            sx={{
              gap: { xs: 2, sm: 1.5 },
              p: { xs: 2.6, sm: 2.5 },
            }}
          >
            <Button
              fullWidth
              variant="contained"
              onClick={onClose}
              disabled={loading}
              sx={{
                borderRadius: 2,
                fontWeight: 850,
                textTransform: "none",
                color: theme.palette.text.primary,
                bgcolor:
                  theme.palette.mode === "dark"
                    ? "rgba(255,255,255,0.10)"
                    : "rgba(17,24,39,0.08)",
                border: `1px solid ${theme.ui.dashboardCardBorder}`,
                boxShadow: "none",
                "&:hover": {
                  bgcolor:
                    theme.palette.mode === "dark"
                      ? "rgba(255,255,255,0.16)"
                      : "rgba(17,24,39,0.12)",
                  boxShadow: "none",
                },
              }}
            >
              Batal
            </Button>
            <Button
              fullWidth
              variant="contained"
              color={severity}
              onClick={onConfirm}
              disabled={loading}
              sx={{ borderRadius: 2, fontWeight: 900, textTransform: "none" }}
            >
              {confirmLabel}
            </Button>
          </Stack>
        </Box>
      </Modal>

      <LoadingBackdrop open={open && loading} message={loadingLabel} />
    </>
  );
}
