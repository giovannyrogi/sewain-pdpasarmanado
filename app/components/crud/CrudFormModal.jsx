"use client";

import React from "react";
import {
  Box,
  Button,
  Divider,
  Stack,
  useTheme,
} from "@mui/material";
import LoadingBackdrop from "@/app/components/loading/Backdrop";
import AppModal from "@/app/components/modals/AppModal";

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

  return (
    <>
      <AppModal
        open={open}
        title={title}
        description={description}
        icon={icon}
        width={width}
        onClose={loading ? undefined : onClose}
        contentSx={{ p: 0 }}
      >
        <Box
          component={onSubmit ? "form" : "div"}
          onSubmit={onSubmit}
          sx={{
            color: "text.primary",
          }}
        >
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
      </AppModal>

      <LoadingBackdrop open={open && loading} message={loadingLabel} />
    </>
  );
}
