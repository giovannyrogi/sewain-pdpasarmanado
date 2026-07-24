"use client";

import React from "react";
import {
  Box,
  Button,
  Divider,
  Grid,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import AppModal from "@/app/components/modals/AppModal";
import formatRupiah from "@/app/components/formatrupiah/page";
import { formatNumber } from "@/app/utils/formatNumber";
import { calculateLandPermitCost } from "./landPermitApplicationUtils";

function DetailRow({ label, value }) {
  const theme = useTheme();

  return (
    <Stack
      direction="row"
      justifyContent="space-between"
      spacing={2}
      sx={{
        py: 0.9,
        borderBottom: `1px dashed ${theme.ui.dashboardCardBorder}`,
      }}
    >
      <Typography
        sx={{ color: theme.ui.mutedText, fontSize: 12.5, fontWeight: 650 }}
      >
        {label}
      </Typography>
      <Typography sx={{ fontSize: 12.5, fontWeight: 700, textAlign: "right" }}>
        {value || "-"}
      </Typography>
    </Stack>
  );
}

export default function LandPermitCostDetailModal({
  open,
  onClose,
  location,
  sector,
  stall,
  durationYears = 1,
  startDate,
  endDate,
  administrationType,
}) {
  const theme = useTheme();
  const cost = calculateLandPermitCost(stall, durationYears, administrationType);

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title="Rincian Izin Lahan"
      titleDescription="Detail lokasi, sektor, lahan, masa izin, dan total pembayaran izin lahan."
      icon="solar:wallet-money-bold-duotone"
      width={760}
    >
      <Stack spacing={2}>
        <Grid container spacing={1.25}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Box
              sx={{
                p: 1.6,
                borderRadius: 2.4,
                border: `1px solid ${theme.ui.dashboardCardBorder}`,
              }}
            >
              <Typography sx={{ fontWeight: 700, fontSize: 15, mb: 1 }}>
                Detail Lokasi & Lahan
              </Typography>
              <DetailRow
                label="Lokasi"
                value={location?.location_name || stall?.location_name}
              />
              <DetailRow
                label="Sektor"
                value={sector?.sector_name || stall?.sector_name}
              />
              <DetailRow
                label="Lahan"
                value={
                  stall?.stall_number ? `Lahan ${stall.stall_number}` : "-"
                }
              />
              <DetailRow
                label="Ukuran"
                value={`${formatNumber(stall?.stall_length)} m x ${formatNumber(stall?.stall_width)} m`}
              />
              <DetailRow
                label="Luas"
                value={`${formatNumber(cost.area, { useGrouping: true })} m²`}
              />
            </Box>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Box
              sx={{
                p: 1.6,
                borderRadius: 2.4,
                border: `1px solid ${theme.ui.dashboardCardBorder}`,
              }}
            >
              <Typography sx={{ fontWeight: 700, fontSize: 15, mb: 1 }}>
                Detail Biaya
              </Typography>
              <DetailRow
                label="Harga per m²"
                value={formatRupiah(stall?.price_per_m2)}
              />
              <DetailRow
                label="Biaya Administrasi SIL"
                value={formatRupiah(cost.annualRent)}
              />
              <DetailRow
                label={
                  administrationType === "kip"
                    ? "Biaya Administrasi KIP"
                    : "Biaya Administrasi KKIP"
                }
                value={
                  administrationType === "kip"
                    ? formatRupiah(100000 * durationYears)
                    : formatRupiah(150000 * durationYears)
                }
              />
              <DetailRow
                label="Durasi Sewa"
                value={`${durationYears || 1} Tahun`}
              />
              <DetailRow label="Tanggal Mulai" value={startDate || "-"} />
              <DetailRow label="Tanggal Berakhir" value={endDate || "-"} />
              <DetailRow
                label="Total Pembayaran"
                value={formatRupiah(cost.totalPayment)}
              />
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ borderColor: theme.ui.dashboardCardBorder }} />

        <Stack
          direction={{ xs: "column-reverse", sm: "row" }}
          justifyContent="flex-end"
        >
          <Button
            variant="contained"
            onClick={onClose}
            sx={{
              borderRadius: 2,
              fontWeight: 700,
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
}
