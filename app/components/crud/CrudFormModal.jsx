"use client";

import React from "react";
import {
  Box,
  Button,
  Divider,
  IconButton,
  Modal,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { Icon } from "@iconify/react";
import LoadingBackdrop from "@/app/components/loading/Backdrop";

/**
 * Modal form reusable untuk operasi create/update.
 * Komponen ini sengaja hanya mengatur shell, header, footer, dan responsivitas;
 * isi field tetap dikirim sebagai children agar bisa dipakai banyak halaman CRUD.
 */
export default function CrudFormModal({
  open,
  title,
  description,
  icon = "solar:pen-new-square-bold-duotone",
  submitLabel = "Simpan",
  loadingLabel = "Menyimpan...",
  loading = false,
  hideFooter = false,
  width = 720,
  contentSx,
  onClose,
  onSubmit,
  children,
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery("(max-width:700px)");

  return (
    <>
      <Modal
        open={open}
        // onClose={loading ? undefined : onClose}
        sx={{
          display: "flex",
          alignItems: { xs: "flex-start", sm: "center" },
          justifyContent: "center",
          p: { xs: 1.5, sm: 2 },
          py: { xs: 2.25, sm: 2 },
        }}
        slotProps={{
          backdrop: {
            sx: {
              backgroundColor:
                theme.palette.mode === "dark"
                  ? "rgba(0,0,0,0.56)"
                  : "rgba(15,23,42,0.18)",
              backdropFilter: "blur(10px)",
            },
          },
        }}
      >
        <Box
          component={onSubmit ? "form" : "div"}
          onSubmit={onSubmit}
          sx={{
            width: isMobile ? "100%" : width,
            maxWidth: "100%",
            maxHeight: "92vh",
            overflowY: "auto",
            bgcolor: theme.ui.menuPaperBg,
            color: "text.primary",
            border: `1px solid ${theme.ui.dashboardCardBorder}`,
            borderRadius: 3,
            boxShadow: theme.ui.shellShadow,
            outline: "none",
            scrollbarColor:
              theme.palette.mode === "dark"
                ? "#ff9800 rgba(255, 152, 0, 0.14)"
                : "#d1d5db rgba(17, 24, 39, 0.07)",
            scrollbarWidth: "thin",
            "&::-webkit-scrollbar": {
              width: 9,
              height: 9,
            },
            "&::-webkit-scrollbar-track": {
              bgcolor:
                theme.palette.mode === "dark"
                  ? "rgba(255,152,0,0.08)"
                  : "rgba(17,24,39,0.06)",
              borderRadius: 999,
            },
            "&::-webkit-scrollbar-thumb": {
              borderRadius: 999,
              border:
                theme.palette.mode === "dark"
                  ? "2px solid rgba(20,20,20,0.85)"
                  : "2px solid rgba(255,255,255,0.96)",
              background:
                theme.palette.mode === "dark"
                  ? "linear-gradient(180deg, #ffb74d, #ff9800)"
                  : "linear-gradient(180deg, #d1d5db, #9ca3af)",
            },
            "&::-webkit-scrollbar-thumb:hover": {
              background:
                theme.palette.mode === "dark"
                  ? "linear-gradient(180deg, #ffc46b, #fb8c00)"
                  : "linear-gradient(180deg, #cbd5e1, #6b7280)",
            },
          }}
        >
          <Box sx={{ p: { xs: 2, sm: 2.5 }, pb: 1.5 }}>
            <Stack direction="row" alignItems="flex-start" spacing={1.5}>
              <Box
                sx={{
                  width: 42,
                  height: 42,
                  borderRadius: 2,
                  display: "grid",
                  placeItems: "center",
                  color: theme.palette.primary.main,
                  bgcolor:
                    theme.palette.mode === "dark"
                      ? "rgba(255,152,0,0.14)"
                      : "rgba(230,9,9,0.10)",
                }}
              >
                <Icon icon={icon} fontSize={23} />
              </Box>

              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography
                  sx={{
                    fontFamily: "Poppins",
                    fontWeight: 850,
                    fontSize: { xs: 18, sm: 21 },
                  }}
                >
                  {title}
                </Typography>
                {description && (
                  <Typography
                    sx={{
                      color: theme.ui.mutedText,
                      fontFamily: "Poppins",
                      fontWeight: 600,
                      fontSize: 12,
                      lineHeight: 1.6,
                      mt: 0.35,
                    }}
                  >
                    {description}
                  </Typography>
                )}
              </Box>

              <IconButton
                onClick={onClose}
                disabled={loading}
                sx={{ color: theme.ui.mutedText }}
              >
                <Icon icon="line-md:close" fontSize={22} />
              </IconButton>
            </Stack>
          </Box>

          <Divider sx={{ borderColor: theme.ui.dashboardCardBorder }} />

          <Box sx={{ p: { xs: 2.6, sm: 2.75 }, ...contentSx }}>{children}</Box>

          {!hideFooter && <Divider sx={{ borderColor: theme.ui.dashboardCardBorder }} />}

          {!hideFooter && (
            <Stack
              direction={{ xs: "column-reverse", sm: "row" }}
              justifyContent="flex-end"
              sx={{
                gap: { xs: 2, sm: 1.5 },
                p: { xs: 2.6, sm: 2.75 },
                pt: { xs: 2.25, sm: 2 },
              }}
            >
              <Button
                onClick={onClose}
                disabled={loading}
                variant="contained"
                sx={{
                  borderRadius: 2,
                  fontWeight: 750,
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
                        : "rgba(17,24,39,0.13)",
                    boxShadow: "none",
                  },
                }}
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={loading}
                variant="contained"
                sx={{ borderRadius: 2, fontWeight: 600, textTransform: "none" }}
              >
                {submitLabel}
              </Button>
            </Stack>
          )}
        </Box>
      </Modal>

      <LoadingBackdrop open={open && loading} message={loadingLabel} />
    </>
  );
}
