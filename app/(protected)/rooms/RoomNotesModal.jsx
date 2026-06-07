"use client";

import React from "react";
import { Box, Button, Divider, Modal, Stack, Typography, useTheme } from "@mui/material";
import { Icon } from "@iconify/react";

/**
 * Modal kecil untuk membaca catatan ruangan.
 * Dipisahkan dari table agar cell tetap ringkas, tetapi informasi penting
 * seperti lokasi dan nomor ruangan tetap terlihat saat catatan dibuka.
 */
export default function RoomNotesModal({ open, onClose, selectedData }) {
  const theme = useTheme();

  return (
    <Modal
      open={open}
      onClose={onClose}
      sx={{ display: "flex", alignItems: "center", justifyContent: "center", p: 2 }}
      slotProps={{
        backdrop: {
          sx: {
            backgroundColor:
              theme.palette.mode === "dark" ? "rgba(0,0,0,0.58)" : "rgba(15,23,42,0.18)",
            backdropFilter: "blur(10px)",
          },
        },
      }}
    >
      <Box
        sx={{
          width: 480,
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
        <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ p: 2.5 }}>
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
            <Icon icon="solar:notes-bold-duotone" fontSize={23} />
          </Box>

          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontWeight: 850, fontSize: 20 }}>Catatan Ruangan</Typography>
            <Typography sx={{ color: theme.ui.mutedText, fontWeight: 650, fontSize: 12 }}>
              Ruangan {selectedData?.room_number || "-"} | {selectedData?.location_name || "-"}
            </Typography>
          </Box>
        </Stack>

        <Divider sx={{ borderColor: theme.ui.dashboardCardBorder }} />

        <Box sx={{ p: 2.5 }}>
          <Typography
            sx={{
              color: selectedData?.notes ? "text.primary" : theme.ui.mutedText,
              fontWeight: 650,
              fontSize: 13,
              lineHeight: 1.75,
              whiteSpace: "pre-wrap",
              overflowWrap: "anywhere",
            }}
          >
            {selectedData?.notes || "Tidak ada catatan untuk ruangan ini."}
          </Typography>
        </Box>

        <Divider sx={{ borderColor: theme.ui.dashboardCardBorder }} />

        <Box sx={{ p: 2.5, display: "flex", justifyContent: "flex-end" }}>
          <Button
            variant="contained"
            color="error"
            onClick={onClose}
            sx={{ borderRadius: 2, fontWeight: 800, textTransform: "none" }}
          >
            Kembali
          </Button>
        </Box>
      </Box>
    </Modal>
  );
}
