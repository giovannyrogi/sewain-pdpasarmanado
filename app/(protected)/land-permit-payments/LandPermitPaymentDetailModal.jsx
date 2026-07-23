"use client";

import React, { useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Grid,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { Icon } from "@iconify/react";
import moment from "moment";
import AppModal from "@/app/components/modals/AppModal";
import ImagePreviewModal from "@/app/components/modals/ImagePreviewModal";
import formatRupiah from "@/app/components/formatrupiah/page";
import { getUploadApiUrl } from "@/app/utils/uploadPath";
import { formatNumber } from "@/app/utils/formatNumber";

function DetailCard({ label, value, icon }) {
  const theme = useTheme();

  return (
    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
      <Stack
        direction="row"
        spacing={1.15}
        sx={{
          height: "100%",
          p: 1.4,
          borderRadius: 2,
          border: `1px solid ${theme.ui.dashboardCardBorder}`,
          bgcolor:
            theme.palette.mode === "dark"
              ? "rgba(255,255,255,0.035)"
              : "rgba(17,24,39,0.025)",
        }}
      >
        <Box
          sx={{
            width: 34,
            height: 34,
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
          <Typography
            sx={{ color: theme.ui.mutedText, fontSize: 11, fontWeight: 700 }}
          >
            {label}
          </Typography>
          <Typography
            sx={{ fontSize: 12.5, fontWeight: 700, overflowWrap: "anywhere" }}
          >
            {value || "-"}
          </Typography>
        </Box>
      </Stack>
    </Grid>
  );
}

export default function LandPermitPaymentDetailModal({
  open,
  onClose,
  data,
  canApprove = false,
  approving = false,
  onApprove,
}) {
  const theme = useTheme();
  const [preview, setPreview] = useState({ open: false, url: "", alt: "" });
  const proofUrl = getUploadApiUrl(data?.proof_file_path);
  const ktpUrl = getUploadApiUrl(data?.ktp_file_path);
  const profilePhotoUrl = getUploadApiUrl(data?.profile_photo_file_path);

  const openDocument = (url, alt) => {
    if (!url) return;
    if (url.toLowerCase().includes(".pdf")) {
      window.open(url, "_blank", "noopener,noreferrer");
      return;
    }
    setPreview({ open: true, url, alt });
  };

  return (
    <>
      <AppModal
        open={open}
        onClose={onClose}
        title="Detail Pembayaran Izin Lahan"
        titleDescription="Informasi pemohon, lahan, masa izin, biaya, dan bukti pembayaran."
        icon="solar:wallet-money-bold-duotone"
        width={960}
      >
        <Stack spacing={2}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            justifyContent="space-between"
            sx={{
              p: 2,
              borderRadius: 2.5,
              border: `1px solid ${theme.ui.dashboardCardBorder}`,
              bgcolor: "transparent",
            }}
          >
            <Box sx={{ minWidth: 0 }}>
              <Typography
                sx={{ fontSize: { xs: 21, sm: 25 }, fontWeight: 700 }}
              >
                {data?.tenant_name || "-"}
              </Typography>
              <Typography
                sx={{
                  color: theme.ui.mutedText,
                  mt: 0.5,
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                NIK {data?.tenant_nik || "-"}
              </Typography>
            </Box>

            <Stack
              direction="row"
              spacing={1}
              sx={{ width: { xs: "100%", sm: 360 }, flex: "0 0 auto" }}
            >
              <Box
                onClick={() => openDocument(ktpUrl, "Foto KTP pemohon")}
                sx={{
                  width: "68%",
                  height: 138,
                  borderRadius: 2,
                  overflow: "hidden",
                  border: `1px solid ${theme.ui.dashboardCardBorder}`,
                  cursor: ktpUrl ? "zoom-in" : "default",
                  display: "grid",
                  placeItems: "center",
                  bgcolor:
                    theme.palette.mode === "dark"
                      ? "rgba(255,255,255,0.025)"
                      : "rgba(17,24,39,0.02)",
                }}
              >
                {ktpUrl ? (
                  <Box
                    component="img"
                    src={ktpUrl}
                    alt="Foto KTP pemohon"
                    sx={{
                      width: "100%",
                      height: "100%",
                      p: 0.75,
                      objectFit: "contain",
                    }}
                  />
                ) : (
                  <Stack
                    alignItems="center"
                    spacing={0.5}
                    sx={{ color: theme.ui.mutedText }}
                  >
                    <Icon
                      icon="solar:gallery-remove-bold-duotone"
                      fontSize={27}
                    />
                    <Typography sx={{ fontSize: 10.5, fontWeight: 700 }}>
                      Foto KTP kosong
                    </Typography>
                  </Stack>
                )}
              </Box>

              <Box
                onClick={() =>
                  openDocument(profilePhotoUrl, "Pas foto pemohon izin lahan")
                }
                sx={{
                  width: "32%",
                  height: 138,
                  borderRadius: 2,
                  overflow: "hidden",
                  border: `1px solid ${theme.ui.dashboardCardBorder}`,
                  cursor: profilePhotoUrl ? "zoom-in" : "default",
                  display: "grid",
                  placeItems: "center",
                  bgcolor:
                    theme.palette.mode === "dark"
                      ? "rgba(255,255,255,0.025)"
                      : "rgba(17,24,39,0.02)",
                }}
              >
                {profilePhotoUrl ? (
                  <Box
                    component="img"
                    src={profilePhotoUrl}
                    alt="Pas foto pemohon"
                    sx={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  <Stack
                    alignItems="center"
                    spacing={0.5}
                    sx={{ color: theme.ui.mutedText }}
                  >
                    <Icon icon="solar:user-cross-bold-duotone" fontSize={27} />
                    <Typography sx={{ fontSize: 10.5, fontWeight: 700 }}>
                      Pas foto kosong
                    </Typography>
                  </Stack>
                )}
              </Box>
            </Stack>
          </Stack>

          <Grid container spacing={1.25}>
            <DetailCard
              icon="solar:phone-bold-duotone"
              label="Nomor Telepon"
              value={data?.tenant_phone}
            />
            <DetailCard
              icon="solar:case-bold-duotone"
              label="Pekerjaan"
              value={data?.occupation}
            />
            <DetailCard
              icon="solar:box-bold-duotone"
              label="Jenis Dagangan"
              value={data?.commodity_type}
            />
            <DetailCard
              icon="solar:map-point-bold-duotone"
              label="Lokasi"
              value={data?.location_name}
            />
            <DetailCard
              icon="solar:map-arrow-square-bold-duotone"
              label="Sektor"
              value={`${data?.sector_name || "-"}`}
              // value={`${data?.sector_name || "-"}${data?.sector_code ? ` (${data.sector_code})` : ""}`}
            />
            <DetailCard
              icon="solar:shop-bold-duotone"
              label="Lahan"
              value={`Lahan ${data?.stall_number || "-"} (${formatNumber(
                data?.stall_length,
              )} x ${formatNumber(data?.stall_width)} m²)`}
            />
            <DetailCard
              icon="solar:calendar-bold-duotone"
              label="Masa Berlaku"
              value={`${moment(data?.start_date).format("D MMMM YYYY")} s/d ${moment(data?.end_date).format("D MMMM YYYY")}`}
            />
            <DetailCard
              icon="solar:calendar-date-bold-duotone"
              label="Tanggal Pembayaran"
              value={
                data?.payment_date
                  ? moment(data.payment_date).format("D MMMM YYYY")
                  : "-"
              }
            />
            <DetailCard
              icon="solar:bill-list-bold-duotone"
              label="Biaya Administrasi SIL"
              value={formatRupiah(data?.annual_land_rent)}
            />
            <DetailCard
              icon="solar:tag-price-bold-duotone"
              label={
                data?.administration_type === "kip"
                  ? "Biaya Administrasi KIP"
                  : "Biaya Administrasi KKIP"
              }
              value={formatRupiah(data?.admin_fee)}
            />
            <DetailCard
              icon="solar:wallet-bold-duotone"
              label="Total Pembayaran"
              value={formatRupiah(data?.payment_amount || data?.total_payment)}
            />
          </Grid>

          <Box
            sx={{
              p: 1.5,
              borderRadius: 2,
              border: `1px solid ${theme.ui.dashboardCardBorder}`,
              bgcolor:
                theme.palette.mode === "dark"
                  ? "rgba(255,255,255,0.035)"
                  : "rgba(17,24,39,0.025)",
            }}
          >
            <Stack
              direction={{ xs: "column", sm: "row" }}
              alignItems={{ xs: "stretch", sm: "center" }}
              justifyContent="space-between"
              spacing={1.25}
            >
              <Stack direction="row" spacing={1.1} alignItems="center">
                <Icon
                  icon="solar:document-add-bold-duotone"
                  fontSize={25}
                  color={theme.palette.primary.main}
                />
                <Box>
                  <Typography sx={{ fontSize: 13, fontWeight: 700 }}>
                    Bukti Pembayaran
                  </Typography>
                  <Typography
                    sx={{
                      color: theme.ui.mutedText,
                      fontSize: 11.5,
                      fontWeight: 600,
                    }}
                  >
                    {proofUrl
                      ? "Dokumen bukti pembayaran tersedia."
                      : "Dokumen tidak tersedia."}
                  </Typography>
                </Box>
              </Stack>
              <Button
                variant="outlined"
                color="primary"
                disabled={!proofUrl}
                onClick={() =>
                  openDocument(proofUrl, "Bukti pembayaran izin lahan")
                }
                startIcon={<Icon icon="solar:eye-bold-duotone" />}
                sx={{
                  borderRadius: 2,
                  fontWeight: 700,
                  textTransform: "none",
                  color: theme.palette.primary.main,
                  borderColor: alpha(theme.palette.primary.main, 0.55),
                  bgcolor: alpha(theme.palette.primary.main, 0.08),
                  "&:hover": {
                    borderColor: theme.palette.primary.main,
                    bgcolor: alpha(theme.palette.primary.main, 0.14),
                  },
                }}
              >
                Lihat Bukti
              </Button>
            </Stack>
          </Box>

          <Stack
            direction={{ xs: "column-reverse", sm: "row" }}
            justifyContent="flex-end"
            spacing={1.25}
          >
            <Button
              variant="contained"
              onClick={onClose}
              disabled={approving}
              sx={{
                borderRadius: 2,
                fontWeight: 700,
                textTransform: "none",
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
            {canApprove && (
              <Button
                variant="contained"
                color="success"
                onClick={onApprove}
                disabled={approving}
                startIcon={
                  approving ? (
                    <CircularProgress size={17} color="inherit" />
                  ) : null
                }
                sx={{ borderRadius: 2, px: 3, fontWeight: 700, color: "#fff" }}
              >
                {approving ? "Memproses..." : "Setujui Pembayaran"}
              </Button>
            )}
          </Stack>
        </Stack>
      </AppModal>

      <ImagePreviewModal
        open={preview.open}
        onClose={() => setPreview({ open: false, url: "", alt: "" })}
        imageUrl={preview.url}
        alt={preview.alt}
      />
    </>
  );
}
