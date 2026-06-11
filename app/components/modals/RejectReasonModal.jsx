"use client";

import React, { useEffect, useState } from "react";
import { Box, Button, CircularProgress, Stack, TextField, Typography, useTheme } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { Icon } from "@iconify/react";
import AppModal from "@/app/components/modals/AppModal";

/**
 * RejectReasonModal adalah modal presentasional reusable untuk semua proses
 * penolakan. Parent tetap mengatur endpoint/API agar aturan bisnis tiap menu
 * tidak tersembunyi di komponen UI.
 */
export default function RejectReasonModal({
  open,
  onClose,
  title = "Tolak Data",
  description = "Berikan alasan penolakan agar riwayat keputusan tercatat jelas.",
  confirmLabel = "Tolak",
  loading = false,
  maxLength = 100,
  placeholder = "Tuliskan alasan penolakan...",
  onSubmit,
}) {
  const theme = useTheme();
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!open) setNotes("");
  }, [open]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    await onSubmit?.(notes);
  };

  return (
    <AppModal
      open={open}
      onClose={loading ? undefined : onClose}
      title={title}
      description={description}
      icon="solar:close-circle-bold-duotone"
      width={520}
      showCloseButton={!loading}
    >
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{
          p: { xs: 1.25, sm: 1.5 },
          borderRadius: 2.25,
          border: `1px solid ${theme.ui?.dashboardCardBorder || theme.palette.divider}`,
          bgcolor:
            theme.palette.mode === "dark"
              ? "rgba(255,255,255,0.035)"
              : "rgba(17,24,39,0.025)",
        }}
      >
        <Stack spacing={1.5}>
          <TextField
            label="Alasan Penolakan"
            placeholder={placeholder}
            fullWidth
            variant="filled"
            multiline
            rows={4}
            value={notes}
            onChange={(event) => setNotes(event.target.value.slice(0, maxLength))}
            inputProps={{ maxLength }}
            required
          />

          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Stack direction="row" spacing={0.75} alignItems="center">
              <Icon icon="solar:info-circle-bold-duotone" fontSize={17} color={theme.ui?.mutedText} />
              <Typography sx={{ fontSize: 12, fontWeight: 650, color: theme.ui?.mutedText }}>
                Alasan akan tersimpan pada riwayat approval.
              </Typography>
            </Stack>
            <Typography
              sx={{
                fontSize: 12,
                fontWeight: 850,
                color:
                  notes.length >= maxLength
                    ? theme.palette.warning.main
                    : theme.ui?.mutedText,
              }}
            >
              {notes.length}/{maxLength}
            </Typography>
          </Stack>

          <Stack direction={{ xs: "column-reverse", sm: "row" }} spacing={1.25} sx={{ mt: 0.5 }}>
            <Button
              variant="contained"
              fullWidth
              size="large"
              disabled={loading}
              onClick={onClose}
              sx={{
                borderRadius: 2,
                fontWeight: 850,
                textTransform: "none",
                color: theme.palette.text.primary,
                bgcolor:
                  theme.palette.mode === "dark"
                    ? "rgba(255,255,255,0.10)"
                    : "rgba(17,24,39,0.08)",
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
              variant="contained"
              color="error"
              fullWidth
              size="large"
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
              sx={{
                borderRadius: 2,
                fontWeight: 900,
                textTransform: "none",
                boxShadow: `0 14px 28px ${alpha(theme.palette.error.main, 0.22)}`,
              }}
            >
              {loading ? "Memproses..." : confirmLabel}
            </Button>
          </Stack>
        </Stack>
      </Box>
    </AppModal>
  );
}
