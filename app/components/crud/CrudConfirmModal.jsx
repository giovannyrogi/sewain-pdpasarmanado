"use client";

import React from "react";
import {
  Box,
  Button,
  Divider,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import { Icon } from "@iconify/react";
import LoadingBackdrop from "@/app/components/loading/Backdrop";
import AppModal from "@/app/components/modals/AppModal";

/**
 * Modal konfirmasi reusable untuk aksi destruktif seperti delete.
 * Data tidak dihapus di komponen ini; parent tetap mengontrol request API agar
 * aturan bisnis tiap halaman tidak tersembunyi di komponen presentasional.
 */
export default function CrudConfirmModal({
  open,
  title = "Konfirmasi Aksi",
  description,
  confirmDescription,
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
      <AppModal
        open={open}
        onClose={loading ? undefined : onClose}
        title={title}
        description={description}
        icon="ion:trash-outline"
        width={430}
        showCloseButton={!loading}
      >
        <Stack spacing={{ xs: 1.5, sm: 1.75 }}>
          <Stack alignItems="center" spacing={1.15}>
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
                <Typography sx={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 21 }}>
                  {title}
                </Typography>
                {(confirmDescription || description) && (
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
                    {confirmDescription || description}{" "}
                    {highlight && (
                      <Box component="strong" sx={{ color: "text.primary", fontWeight: 700 }}>
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
              gap: { xs: 1.25, sm: 1.25 },
              pt: { xs: 0.25, sm: 0.5 },
            }}
          >
            <Button
              fullWidth
              variant="contained"
              onClick={onClose}
              disabled={loading}
              sx={{
                borderRadius: 2,
                fontWeight: 700,
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
              sx={{ borderRadius: 2, fontWeight: 700, textTransform: "none" }}
            >
              {confirmLabel}
            </Button>
          </Stack>
        </Stack>
      </AppModal>

      <LoadingBackdrop open={open && loading} message={loadingLabel} />
    </>
  );
}
