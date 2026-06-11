"use client";

import React from "react";
import { Box, Button, Grid, Stack, Typography, useTheme } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { Icon } from "@iconify/react";
import AppModal from "@/app/components/modals/AppModal";
import formatRupiah from "@/app/components/formatrupiah/page";
import { formatNumber } from "@/app/utils/formatNumber";

const emptyValue = "-";

const displayValue = (value) => {
  if (value === 0) return 0;
  return value ? value : emptyValue;
};

/**
 * Kartu informasi ringkas untuk detail ruangan.
 * Dipakai agar label, icon, dan nilai ruangan tetap konsisten serta responsif.
 */
function RoomInfoCard({ icon, label, value }) {
  const theme = useTheme();

  return (
    <Grid size={{ xs: 12, sm: 6 }}>
      <Box
        sx={{
          height: "100%",
          p: 1.5,
          borderRadius: 2,
          border: `1px solid ${theme.ui?.dashboardCardBorder || theme.palette.divider}`,
          bgcolor:
            theme.palette.mode === "dark"
              ? "rgba(255,255,255,0.035)"
              : "rgba(17,24,39,0.025)",
        }}
      >
        <Stack direction="row" spacing={1.2} alignItems="flex-start">
          <Box
            sx={{
              width: 32,
              height: 32,
              flex: "0 0 auto",
              borderRadius: 1.5,
              display: "grid",
              placeItems: "center",
              color: theme.palette.primary.main,
              bgcolor: alpha(theme.palette.primary.main, 0.12),
            }}
          >
            <Icon icon={icon} fontSize={18} />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ color: theme.ui?.mutedText, fontSize: 11, fontWeight: 750 }}>
              {label}
            </Typography>
            <Typography
              sx={{
                fontSize: 13,
                fontWeight: 850,
                mt: 0.25,
                wordBreak: "break-word",
                overflowWrap: "anywhere",
              }}
            >
              {value}
            </Typography>
          </Box>
        </Stack>
      </Box>
    </Grid>
  );
}

/**
 * Modal detail ruangan reusable untuk form permohonan.
 * Props lama tetap dipertahankan agar pemanggil existing tidak perlu berubah.
 */
const DetailRoomsModal = ({ open, onClose, selectedDataRooms }) => {
  const theme = useTheme();
  const totalAnnualRent =
    Number(selectedDataRooms?.room_width || 0) *
    Number(selectedDataRooms?.room_length || 0) *
    Number(selectedDataRooms?.price_per_m2 || 0);

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title="Detail Informasi Ruangan"
      description="Nomor, ukuran, lantai, dan estimasi harga sewa ruangan per tahun."
      icon="cil:room"
      width={620}
    >
      <Stack spacing={2.25}>
        <Grid container spacing={1.25}>
          <RoomInfoCard
            icon="cil:room"
            label="Nomor Ruangan"
            value={selectedDataRooms?.room_number ? `No. ${selectedDataRooms.room_number}` : emptyValue}
          />
          <RoomInfoCard icon="solar:layers-bold-duotone" label="Lantai" value={displayValue(selectedDataRooms?.floor)} />
          <RoomInfoCard
            icon="solar:ruler-bold-duotone"
            label="Panjang Ruangan"
            value={selectedDataRooms?.room_length ? `${formatNumber(selectedDataRooms.room_length)} m` : emptyValue}
          />
          <RoomInfoCard
            icon="solar:ruler-cross-pen-bold-duotone"
            label="Lebar Ruangan"
            value={selectedDataRooms?.room_width ? `${formatNumber(selectedDataRooms.room_width)} m` : emptyValue}
          />
          <RoomInfoCard
            icon="solar:widget-5-bold-duotone"
            label="Luas Ruangan"
            value={selectedDataRooms?.room_area ? `${formatNumber(selectedDataRooms.room_area)} m²` : emptyValue}
          />
          <RoomInfoCard
            icon="solar:tag-price-bold-duotone"
            label="Harga Sewa / m²"
            value={selectedDataRooms?.price_per_m2 ? formatRupiah(selectedDataRooms.price_per_m2) : emptyValue}
          />
          {selectedDataRooms?.price_type === "harga_per_meter" && (
            <Grid size={12}>
              <Box
                sx={{
                  p: 1.6,
                  borderRadius: 2,
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.35)}`,
                  bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.08 : 0.06),
                }}
              >
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  justifyContent="space-between"
                  alignItems={{ xs: "flex-start", sm: "center" }}
                  spacing={0.75}
                >
                  <Box>
                    <Typography sx={{ fontSize: 12, fontWeight: 750, color: theme.ui?.mutedText }}>
                      Total Harga Sewa per Tahun
                    </Typography>
                    <Typography sx={{ fontSize: 13, fontWeight: 650, color: theme.ui?.mutedText }}>
                      Panjang x lebar x harga per m²
                    </Typography>
                  </Box>
                  <Typography sx={{ fontSize: 18, fontWeight: 950 }}>
                    {totalAnnualRent > 0 ? formatRupiah(totalAnnualRent) : emptyValue}
                  </Typography>
                </Stack>
              </Box>
            </Grid>
          )}
        </Grid>

        <Stack direction={{ xs: "column-reverse", sm: "row" }} justifyContent="flex-end">
          <Button
            variant="contained"
            onClick={onClose}
            sx={{
              borderRadius: 2,
              fontWeight: 850,
              px: 3,
              color: theme.palette.text.primary,
              bgcolor:
                theme.palette.mode === "dark"
                  ? "rgba(255,255,255,0.10)"
                  : "rgba(17,24,39,0.08)",
              boxShadow: "none",
            }}
          >
            Kembali
          </Button>
        </Stack>
      </Stack>
    </AppModal>
  );
};

export default DetailRoomsModal;
