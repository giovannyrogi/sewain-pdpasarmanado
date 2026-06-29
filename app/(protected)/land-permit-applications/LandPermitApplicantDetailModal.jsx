"use client";

import React, { useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Divider,
  Grid,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import { Icon } from "@iconify/react";
import AppModal from "@/app/components/modals/AppModal";
import ImagePreviewModal from "@/app/components/modals/ImagePreviewModal";
import { getUploadApiUrl } from "@/app/utils/uploadPath";
import formatRupiah from "@/app/components/formatrupiah/page";
import { formatNumber } from "@/app/utils/formatNumber";
import { APPLICATION_TYPE_LABEL, formatDateDisplay } from "./landPermitApplicationUtils";

function FieldCard({ icon, label, value, fullWidth = false }) {
  const theme = useTheme();
  const renderedValue = React.isValidElement(value) ? (
    value
  ) : (
    <Typography sx={{ fontSize: 13, fontWeight: 700, overflowWrap: "anywhere" }}>
      {value || "-"}
    </Typography>
  );

  return (
    <Grid size={{ xs: 12, md: fullWidth ? 12 : 4 }}>
      <Box
        sx={{
          height: "100%",
          p: 1.5,
          borderRadius: 2,
          border: `1px solid ${theme.ui.dashboardCardBorder}`,
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
              bgcolor:
                theme.palette.mode === "dark"
                  ? "rgba(255,152,0,0.14)"
                  : "rgba(230,9,9,0.10)",
            }}
          >
            <Icon icon={icon} fontSize={18} />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ color: theme.ui.mutedText, fontSize: 11, fontWeight: 700 }}>
              {label}
            </Typography>
            {renderedValue}
          </Box>
        </Stack>
      </Box>
    </Grid>
  );
}

function DetailSection({ icon, title, description, children }) {
  const theme = useTheme();

  return (
    <Box sx={{ mt: 2.25 }}>
      <Stack direction="row" spacing={1.2} alignItems="center" sx={{ mb: 1 }}>
        <Box
          sx={{
            width: 30,
            height: 30,
            borderRadius: 1.4,
            display: "grid",
            placeItems: "center",
            color: theme.palette.primary.main,
            bgcolor:
              theme.palette.mode === "dark"
                ? "rgba(255,152,0,0.14)"
                : "rgba(230,9,9,0.10)",
          }}
        >
          <Icon icon={icon} fontSize={17} />
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontSize: 15, fontWeight: 700 }}>{title}</Typography>
          {description && (
            <Typography sx={{ color: theme.ui.mutedText, fontSize: 11, fontWeight: 650 }}>
              {description}
            </Typography>
          )}
        </Box>
      </Stack>
      <Divider sx={{ borderColor: theme.palette.primary.main, opacity: 0.7, mb: 1.4 }} />
      {children}
    </Box>
  );
}

export default function LandPermitApplicantDetailModal({
  open,
  onClose,
  selectedData,
  canApprove = false,
  approving = false,
  onApprove,
}) {
  const theme = useTheme();
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState({
    url: "",
    alt: "Preview dokumen pemohon",
  });
  const ktpUrl = getUploadApiUrl(selectedData?.ktp_file_path);
  const profilePhotoUrl = getUploadApiUrl(
    selectedData?.profile_photo_file_path,
  );
  const statementUrl = getUploadApiUrl(selectedData?.statement_file_path);
  const paymentStatusLabel =
    selectedData?.is_fully_paid || selectedData?.payment_status === "paid"
      ? "Sudah Dibayar"
      : selectedData?.payment_status === "proses"
        ? "Menunggu Validasi Keuangan"
        : selectedData?.payment_status === "rejected"
          ? "Ditolak Keuangan"
          : "Belum Dibayar";

  const openPreview = (url, alt) => {
    if (!url) return;
    setPreviewImage({ url, alt });
    setPreviewOpen(true);
  };

  return (
    <>
      <AppModal
        open={open}
        onClose={onClose}
        title="Detail Data Pemohon"
        titleDescription="Informasi pemohon, lokasi izin lahan, masa izin, dan rincian pembayaran."
        icon="solar:user-id-bold-duotone"
        width={980}
      >
        <Stack spacing={2}>
          <Box
            sx={{
              p: 2,
              borderRadius: 2.5,
              border: `1px solid ${theme.ui.dashboardCardBorder}`,
              bgcolor:
                theme.palette.mode === "dark"
                  ? "linear-gradient(135deg, rgba(255,152,0,0.08), rgba(255,255,255,0.035))"
                  : "linear-gradient(135deg, rgba(230,9,9,0.07), rgba(255,255,255,0.94))",
            }}
          >
            <Stack direction={{ xs: "column", md: "row" }} spacing={2} justifyContent="space-between">
              <Box>
                <Typography sx={{ fontSize: { xs: 22, sm: 26 }, fontWeight: 700 }}>
                  {selectedData?.tenant_name || "-"}
                </Typography>
                <Typography sx={{ mt: 0.6, color: theme.ui.mutedText, fontSize: 12, fontWeight: 650 }}>
                  NIK: {selectedData?.tenant_nik || "-"} | Telp: {selectedData?.tenant_phone || "-"}
                </Typography>
              </Box>
              <Stack
                direction="row"
                spacing={1}
                sx={{ width: { xs: "100%", md: 360 }, flex: "0 0 auto" }}
              >
                <Box
                  sx={{
                    width: "68%",
                    height: 138,
                    borderRadius: 2,
                    border: `1px solid ${theme.ui.dashboardCardBorder}`,
                    overflow: "hidden",
                    cursor: selectedData?.ktp_file_path ? "zoom-in" : "default",
                  }}
                  onClick={() =>
                    openPreview(ktpUrl, "Preview KTP penyewa")
                  }
                >
                  {selectedData?.ktp_file_path ? (
                    <Box
                      component="img"
                      src={ktpUrl}
                      alt="Foto KTP penyewa"
                      sx={{
                        width: "100%",
                        height: "100%",
                        objectFit: "contain",
                        p: 1,
                      }}
                    />
                  ) : (
                    <Stack
                      alignItems="center"
                      justifyContent="center"
                      sx={{ height: "100%", color: theme.ui.mutedText }}
                    >
                      <Icon icon="solar:gallery-remove-bold-duotone" fontSize={28} />
                      <Typography sx={{ fontSize: 11, fontWeight: 700 }}>
                        KTP kosong
                      </Typography>
                    </Stack>
                  )}
                </Box>

                <Box
                  sx={{
                    width: "32%",
                    height: 138,
                    borderRadius: 2,
                    border: `1px solid ${theme.ui.dashboardCardBorder}`,
                    overflow: "hidden",
                    cursor: profilePhotoUrl ? "zoom-in" : "default",
                  }}
                  onClick={() =>
                    openPreview(profilePhotoUrl, "Preview pas foto izin lahan")
                  }
                >
                  {profilePhotoUrl ? (
                    <Box
                      component="img"
                      src={profilePhotoUrl}
                      alt="Pas foto pemohon izin lahan"
                      sx={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    <Stack
                      alignItems="center"
                      justifyContent="center"
                      sx={{ height: "100%", color: theme.ui.mutedText }}
                    >
                      <Icon icon="solar:user-cross-bold-duotone" fontSize={26} />
                      <Typography sx={{ fontSize: 10, fontWeight: 700 }}>
                        Pas foto kosong
                      </Typography>
                    </Stack>
                  )}
                </Box>
              </Stack>
            </Stack>
          </Box>

          <DetailSection
            icon="solar:shop-bold-duotone"
            title="Detail Lokasi & Lahan"
            description="Lokasi, sektor, ukuran lahan, harga dasar, dan masa berlaku izin."
          >
            <Grid container spacing={1.25}>
              <FieldCard icon="solar:map-point-bold-duotone" label="Nama Lokasi" value={selectedData?.location_name} />
              <FieldCard icon="solar:map-arrow-square-bold-duotone" label="Sektor" value={selectedData?.sector_name} />
              <FieldCard icon="solar:shop-bold-duotone" label="Lahan" value={`Lahan ${selectedData?.stall_number || "-"}`} />
              <FieldCard icon="solar:ruler-bold-duotone" label="Panjang" value={`${formatNumber(selectedData?.stall_length)} M`} />
              <FieldCard icon="solar:ruler-pen-bold-duotone" label="Lebar" value={`${formatNumber(selectedData?.stall_width)} M`} />
              <FieldCard icon="solar:widget-5-bold-duotone" label="Luas" value={`${formatNumber(selectedData?.stall_area)} m²`} />
              <FieldCard icon="solar:tag-price-bold-duotone" label="Harga / m²" value={formatRupiah(selectedData?.price_per_m2)} />
              <FieldCard icon="solar:calendar-bold-duotone" label="Masa Izin" value={`${formatDateDisplay(selectedData?.start_date)} s/d ${formatDateDisplay(selectedData?.end_date)}`} fullWidth />
            </Grid>
          </DetailSection>

          <DetailSection
            icon="solar:document-text-bold-duotone"
            title="Informasi Permohonan"
            description="Jenis permohonan, komoditas, dan status pembayaran awal."
          >
            <Grid container spacing={1.25}>
              <FieldCard icon="solar:file-text-bold-duotone" label="Jenis Permohonan" value={APPLICATION_TYPE_LABEL[selectedData?.application_type]} />
              <FieldCard icon="solar:box-bold-duotone" label="Jenis Dagangan" value={selectedData?.commodity_type} />
              <FieldCard icon="solar:hourglass-bold-duotone" label="Durasi" value={`${selectedData?.lease_duration_years || 1} Tahun`} />
              <FieldCard icon="solar:wallet-money-bold-duotone" label="Status Pembayaran" value={paymentStatusLabel} />
            </Grid>
          </DetailSection>

          <DetailSection
            icon="solar:wallet-money-bold-duotone"
            title="Detail Biaya"
            description="Rincian sewa tahunan, durasi izin, dan total pembayaran lahan."
          >
            <Grid container spacing={1.25}>
              <FieldCard icon="solar:bill-list-bold-duotone" label="Sewa per Tahun" value={formatRupiah(selectedData?.annual_land_rent)} />
              <FieldCard icon="solar:calendar-bold-duotone" label="Durasi" value={`${selectedData?.lease_duration_years || 1} Tahun`} />
              <FieldCard icon="solar:wallet-bold-duotone" label="Total Pembayaran" value={formatRupiah(selectedData?.total_payment)} />
            </Grid>
          </DetailSection>

          {selectedData?.termination_reason && (
            <DetailSection
              icon="solar:lock-keyhole-minimalistic-bold-duotone"
              title="Detail Permintaan Non-Aktif"
              description="Alasan pengajuan non-aktif dan dokumen pendukung."
            >
              <Grid container spacing={1.25}>
                <FieldCard
                  icon="solar:document-text-bold-duotone"
                  label="Alasan Non-Aktif"
                  value={selectedData?.termination_reason}
                  fullWidth
                />
                <FieldCard
                  icon="solar:user-rounded-bold-duotone"
                  label="Diajukan Oleh"
                  value={selectedData?.termination_processed_by_full_name}
                />
                <FieldCard
                  icon="solar:file-check-bold-duotone"
                  label="Surat Pernyataan"
                  value={
                    statementUrl ? (
                      <Button
                        onClick={() => window.open(statementUrl, "_blank", "noopener,noreferrer")}
                        sx={{
                          minWidth: 0,
                          p: 0,
                          justifyContent: "flex-start",
                          color: theme.palette.primary.main,
                          fontSize: 13,
                          fontWeight: 800,
                          textTransform: "none",
                          "&:hover": {
                            bgcolor: "transparent",
                            textDecoration: "underline",
                          },
                        }}
                      >
                        Lihat Surat
                      </Button>
                    ) : (
                      "-"
                    )
                  }
                />
              </Grid>
            </DetailSection>
          )}

          <Stack
            direction={{ xs: "column-reverse", sm: "row" }}
            justifyContent="flex-end"
            spacing={1.25}
            sx={{ pt: { xs: 1.5, sm: 2, md: 2.25 } }}
          >
            <Button
              variant="contained"
              onClick={onClose}
              disabled={approving}
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
            {canApprove && (
              <Button
                variant="contained"
                color="success"
                onClick={onApprove}
                disabled={approving}
                startIcon={
                  approving ? (
                    <CircularProgress size={18} color="inherit" />
                  ) : null
                }
                sx={{
                  borderRadius: 2,
                  px: 3,
                  fontWeight: 700,
                  color: "#fff",
                }}
              >
                {approving ? "Memproses..." : "Setujui Permohonan"}
              </Button>
            )}
          </Stack>
        </Stack>
      </AppModal>

      <ImagePreviewModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        imageUrl={previewImage.url}
        alt={previewImage.alt}
      />
    </>
  );
}
