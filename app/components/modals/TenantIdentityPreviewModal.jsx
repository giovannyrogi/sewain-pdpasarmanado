"use client";

import React, { useState } from "react";
import {
  Box,
  Button,
  Chip,
  Divider,
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
import { getUploadApiUrl } from "@/app/utils/uploadPath";

const emptyValue = "-";

const displayValue = (value) => {
  if (value === 0) return 0;
  return value ? value : emptyValue;
};

const formatDate = (value) =>
  value && moment(value).isValid() ? moment(value).format("D MMMM YYYY") : emptyValue;

const getIdentityName = (data) =>
  data?.full_name || data?.tenant_name || data?.name || emptyValue;

const getIdentityNik = (data) =>
  data?.nik || data?.tenant_nik || data?.identity_number || emptyValue;

const getIdentityPhone = (data) =>
  data?.phone || data?.tenant_phone || data?.phone_number || emptyValue;

const getIdentityStatus = (data) =>
  data?.tenant_identity_status || data?.status;

const getStatusLabel = (status) => {
  if (status === "active") return "Aktif";
  if (status === "inactive") return "Tidak Aktif";
  if (status === "blacklisted") return "Blacklist";
  return displayValue(status);
};

const getStatusColor = (status) => {
  if (status === "active") return "success";
  if (status === "inactive") return "error";
  if (status === "blacklisted") return "warning";
  return "default";
};

/**
 * FieldCard menjaga setiap informasi identitas tampil sebagai kartu kecil yang
 * mudah dipindai dan tidak berantakan ketika nilai panjang atau layar sempit.
 */
function FieldCard({ icon, label, value, fullWidth = false }) {
  const theme = useTheme();

  return (
    <Grid size={{ xs: 12, sm: fullWidth ? 12 : 6 }}>
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
            <Typography
              sx={{
                color: theme.ui?.mutedText || "text.secondary",
                fontSize: 11,
                fontWeight: 750,
                lineHeight: 1.35,
              }}
            >
              {label}
            </Typography>
            <Typography
              sx={{
                fontSize: 13,
                fontWeight: 850,
                lineHeight: 1.45,
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
 * DetailSection memberi struktur visual konsisten untuk kelompok data identitas,
 * alamat, dan dokumen sehingga komponen ini mudah ditambah field di kemudian hari.
 */
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
            bgcolor: alpha(theme.palette.primary.main, 0.12),
          }}
        >
          <Icon icon={icon} fontSize={17} />
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontSize: 15, fontWeight: 900, lineHeight: 1.2 }}>
            {title}
          </Typography>
          {description && (
            <Typography
              sx={{
                color: theme.ui?.mutedText || "text.secondary",
                fontSize: 11,
                fontWeight: 650,
                mt: 0.2,
              }}
            >
              {description}
            </Typography>
          )}
        </Box>
      </Stack>
      <Divider sx={{ borderColor: alpha(theme.palette.primary.main, 0.62), mb: 1.4 }} />
      {children}
    </Box>
  );
}

/**
 * Modal identitas penyewa reusable untuk form permohonan, kontrak, termination,
 * dan daftar identitas. Komponen ini memakai AppModal sebagai shell utama agar
 * gaya modal tetap terpusat dan konsisten di theme dark/light.
 */
export default function TenantIdentityPreviewModal({ open, onClose, selectedData }) {
  const theme = useTheme();
  const [openPreview, setOpenPreview] = useState(false);
  const ktpImageUrl = getUploadApiUrl(selectedData?.ktp_file_path);
  const identityName = getIdentityName(selectedData);
  const identityNik = getIdentityNik(selectedData);
  const identityPhone = getIdentityPhone(selectedData);
  const identityStatus = getIdentityStatus(selectedData);

  return (
    <>
      <AppModal
        open={open}
        onClose={onClose}
        title="Informasi Identitas Penyewa"
        description="Data utama penyewa, alamat domisili, status, dan dokumen KTP."
        icon="solar:user-id-bold-duotone"
        width={760}
      >
        <Stack spacing={2.25}>
          <Box
            sx={{
              p: { xs: 1.5, sm: 2 },
              borderRadius: 2.5,
              border: `1px solid ${theme.ui?.dashboardCardBorder || theme.palette.divider}`,
              bgcolor:
                theme.palette.mode === "dark"
                  ? "linear-gradient(135deg, rgba(255,152,0,0.08), rgba(255,255,255,0.035))"
                  : "linear-gradient(135deg, rgba(230,9,9,0.07), rgba(255,255,255,0.94))",
            }}
          >
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={2}
              justifyContent="space-between"
              alignItems={{ xs: "stretch", md: "center" }}
            >
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontSize: { xs: 20, sm: 24 }, fontWeight: 950 }}>
                  {identityName}
                </Typography>
                <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mt: 1 }}>
                  <Chip size="small" label={`NIK: ${identityNik}`} sx={{ fontWeight: 800 }} />
                  <Chip size="small" label={`Telp: ${identityPhone}`} sx={{ fontWeight: 800 }} />
                  {identityStatus && (
                    <Chip
                      size="small"
                      color={getStatusColor(identityStatus)}
                      label={getStatusLabel(identityStatus)}
                      sx={{ fontWeight: 850 }}
                    />
                  )}
                </Stack>
              </Box>

              <Box
                sx={{
                  width: { xs: "100%", md: 260 },
                  height: { xs: 164, md: 146 },
                  borderRadius: 2,
                  overflow: "hidden",
                  border: `1px solid ${theme.ui?.dashboardCardBorder || theme.palette.divider}`,
                  bgcolor:
                    theme.palette.mode === "dark"
                      ? "rgba(0,0,0,0.25)"
                      : "rgba(255,255,255,0.74)",
                  cursor: selectedData?.ktp_file_path ? "zoom-in" : "default",
                }}
                onClick={() => selectedData?.ktp_file_path && setOpenPreview(true)}
              >
                {selectedData?.ktp_file_path ? (
                  <Box
                    component="img"
                    src={ktpImageUrl}
                    alt="Foto KTP penyewa"
                    sx={{
                      width: "100%",
                      height: "100%",
                      p: 1,
                      objectFit: "contain",
                      display: "block",
                    }}
                  />
                ) : (
                  <Stack
                    alignItems="center"
                    justifyContent="center"
                    spacing={0.8}
                    sx={{ height: "100%", color: theme.ui?.mutedText }}
                  >
                    <Icon icon="solar:gallery-remove-bold-duotone" fontSize={28} />
                    <Typography sx={{ fontSize: 12, fontWeight: 700 }}>
                      Tidak ada foto KTP
                    </Typography>
                  </Stack>
                )}
              </Box>
            </Stack>
          </Box>

          <DetailSection
            icon="solar:user-bold-duotone"
            title="Data Pribadi"
            description="Identitas dasar penyewa yang terhubung dengan permohonan."
          >
            <Grid container spacing={1.25}>
              <FieldCard icon="solar:user-bold-duotone" label="Nama Lengkap" value={identityName} />
              <FieldCard icon="solar:card-2-bold-duotone" label="NIK" value={identityNik} />
              <FieldCard
                icon="solar:calendar-mark-bold-duotone"
                label="Tempat, Tanggal Lahir"
                value={`${displayValue(selectedData?.birth_place)}, ${formatDate(selectedData?.birth_date)}`}
              />
              <FieldCard icon="solar:case-bold-duotone" label="Pekerjaan" value={displayValue(selectedData?.occupation)} />
              <FieldCard icon="solar:global-bold-duotone" label="Kewarganegaraan" value={displayValue(selectedData?.nationality)} />
              <FieldCard icon="solar:moon-stars-bold-duotone" label="Agama" value={displayValue(selectedData?.religion)} />
              <FieldCard icon="solar:phone-bold-duotone" label="Nomor Telepon" value={identityPhone} />
              <FieldCard icon="solar:shield-check-bold-duotone" label="Status" value={getStatusLabel(identityStatus)} />
              {identityStatus === "blacklisted" && (
                <FieldCard
                  icon="solar:notes-bold-duotone"
                  label="Catatan"
                  value={displayValue(selectedData?.notes || selectedData?.tenant_identity_notes)}
                  fullWidth
                />
              )}
            </Grid>
          </DetailSection>

          <DetailSection
            icon="solar:map-point-wave-bold-duotone"
            title="Detail Alamat"
            description="Alamat domisili penyewa sesuai data identitas."
          >
            <Grid container spacing={1.25}>
              <FieldCard icon="solar:map-bold-duotone" label="Provinsi" value={displayValue(selectedData?.province)} />
              <FieldCard icon="solar:city-bold-duotone" label="Kabupaten/Kota" value={displayValue(selectedData?.city)} />
              <FieldCard icon="solar:streets-map-point-bold-duotone" label="Kecamatan" value={displayValue(selectedData?.district)} />
              <FieldCard icon="solar:home-2-bold-duotone" label="Kelurahan/Desa" value={displayValue(selectedData?.kelurahan)} />
              <FieldCard icon="solar:route-bold-duotone" label="Nama Jalan" value={displayValue(selectedData?.street_address)} />
              <FieldCard
                icon="solar:hashtag-bold-duotone"
                label="RT/RW"
                value={`${selectedData?.rt || "000"} / ${selectedData?.rw || "000"}`}
              />
              <FieldCard icon="solar:mailbox-bold-duotone" label="Kode Pos" value={displayValue(selectedData?.postal_code)} />
            </Grid>
          </DetailSection>

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
                "&:hover": {
                  bgcolor:
                    theme.palette.mode === "dark"
                      ? "rgba(255,255,255,0.16)"
                      : "rgba(17,24,39,0.13)",
                  boxShadow: "none",
                },
              }}
            >
              Kembali
            </Button>
          </Stack>
        </Stack>
      </AppModal>

      <ImagePreviewModal
        open={openPreview}
        onClose={() => setOpenPreview(false)}
        imageUrl={ktpImageUrl}
        alt="Preview KTP"
      />
    </>
  );
}
