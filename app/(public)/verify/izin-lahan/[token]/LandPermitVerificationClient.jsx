"use client";

import { useState } from "react";
import moment from "moment";
import "moment/locale/id";
import { Box, Container, Divider, Paper, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { Icon } from "@iconify/react";
import CompactInfoChip from "@/app/components/chips/CompactInfoChip";
import ImagePreviewModal from "@/app/components/modals/ImagePreviewModal";
import { formatNumber } from "@/app/utils/formatNumber";

const formatDate = (value) =>
  value && moment(value).isValid()
    ? moment(value).locale("id").format("D MMMM YYYY")
    : "-";

const getStatusColor = (theme, tone) => {
  if (tone === "success") return theme.palette.success.main;
  if (tone === "warning") return theme.palette.warning.main;
  return theme.palette.error.main;
};

const formatLandPermitIdentityStatus = (value) => {
  if (value === "active") return "Aktif";
  if (value === "inactive") return "Nonaktif";
  if (value === "blacklisted") return "Diblokir";
  return value || "-";
};

const InfoCard = ({ icon, label, value }) => (
  <Paper
    variant="outlined"
    sx={{
      p: { xs: 1.75, sm: 2 },
      borderRadius: 2,
      bgcolor: "background.paper",
      borderColor: "divider",
      minHeight: 82,
      display: "flex",
      alignItems: "center",
      gap: 1.5,
    }}
  >
    <Box
      sx={{
        width: 38,
        height: 38,
        borderRadius: 1.5,
        display: "grid",
        placeItems: "center",
        flexShrink: 0,
        color: "primary.main",
        bgcolor: (theme) => alpha(theme.palette.primary.main, 0.16),
      }}
    >
      <Icon icon={icon} width={20} height={20} />
    </Box>
    <Box sx={{ minWidth: 0 }}>
      <Typography
        sx={{
          color: "text.secondary",
          fontSize: 13,
          fontWeight: 600,
          mb: 0.5,
        }}
      >
        {label}
      </Typography>
      <Typography
        sx={{
          color: "text.primary",
          fontWeight: 600,
          lineHeight: 1.35,
          overflowWrap: "anywhere",
          fontSize: { xs: 14, sm: 15 },
        }}
      >
        {value || "-"}
      </Typography>
    </Box>
  </Paper>
);

const NotFoundView = ({ invalidToken = false }) => (
  <Box
    sx={{
      minHeight: "100dvh",
      display: "grid",
      placeItems: "center",
      px: 2,
      py: 4,
      bgcolor: "background.default",
    }}
  >
    <Paper
      variant="outlined"
      sx={{
        width: "100%",
        maxWidth: 560,
        p: { xs: 3, sm: 4 },
        borderRadius: 3,
        textAlign: "center",
        bgcolor: "background.paper",
        borderColor: "divider",
      }}
    >
      <CompactInfoChip
        label="Data Tidak Ditemukan"
        color="#ef4444"
        sx={{
          mx: "auto",
          mb: 2,
          height: 30,
          borderRadius: 999,
          "& .MuiChip-label": { fontSize: 13 },
          fontWeight: 600,
        }}
      />
      <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
        Data izin lahan tidak ditemukan
      </Typography>
      <Typography sx={{ color: "text.secondary", lineHeight: 1.7 }}>
        {invalidToken
          ? "Kode QR tidak sesuai dengan format sistem."
          : "Data izin lahan tidak ditemukan atau dokumennya sudah tidak tersedia."}
      </Typography>
    </Paper>
  </Box>
);

export default function LandPermitVerificationClient({
  data,
  invalidToken = false,
}) {
  const theme = useTheme();
  const [previewOpen, setPreviewOpen] = useState(false);

  if (!data) {
    return <NotFoundView invalidToken={invalidToken} />;
  }

  const dimensions = `${formatNumber(data.stall_length)} x ${formatNumber(
    data.stall_width,
  )} m (${formatNumber(data.stall_area)} m²)`;
  const statusColor = getStatusColor(theme, data.status?.tone);

  return (
    <Box
      sx={{
        minHeight: "100dvh",
        bgcolor: "background.default",
        color: "text.primary",
        py: { xs: 2, sm: 4, md: 6 },
      }}
    >
      <Container maxWidth="md">
        <Paper
          variant="outlined"
          sx={{
            overflow: "hidden",
            borderRadius: { xs: 2, sm: 3 },
            bgcolor: "background.paper",
            borderColor: "divider",
            boxShadow: (theme) =>
              theme.palette.mode === "dark"
                ? "0 20px 70px rgba(0,0,0,0.35)"
                : "0 20px 70px rgba(15,23,42,0.10)",
          }}
        >
          <Box sx={{ p: { xs: 2.25, sm: 3, md: 4 } }}>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              justifyContent="space-between"
              alignItems={{ xs: "flex-start", sm: "center" }}
            >
              <Box>
                <Typography
                  sx={{
                    color: "text.secondary",
                    fontSize: 12,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: 0.8,
                    mb: 0.75,
                  }}
                >
                  Cek Izin Lahan
                </Typography>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 600,
                    lineHeight: 1.18,
                    fontSize: { xs: 26, sm: 34 },
                  }}
                >
                  {data.tenant_name}
                </Typography>
                 
                  <CompactInfoChip
                    label={`No. Dokumen : ${data?.document_number || "-"}`}
                    color={theme.palette.primary.main}
                    sx={{
                      px: 1,
                      mt: 2,
                      height: 36,
                      borderRadius: 999,
                      letterSpacing: 0.5,
                      "& .MuiChip-label": {
                        px: 1.35,
                        fontSize: 13,
                        fontWeight: 600,
                      },
                    }}
                  />
              </Box>
              <CompactInfoChip
                label={data.status?.label || "Status Tidak Diketahui"}
                color={statusColor}
                sx={{
                  px: 1,
                  height: 36,
                  borderRadius: 999,
                  letterSpacing: 0.5,
                  "& .MuiChip-label": {
                    px: 1.35,
                    fontSize: 13,
                    fontWeight: 600,
                  },
                }}
              />
            </Stack>

            <Paper
              variant="outlined"
              sx={{
                mt: 3,
                p: { xs: 2, sm: 2.5 },
                borderRadius: 2.5,
                bgcolor: (theme) =>
                  theme.palette.mode === "dark"
                    ? "rgba(255,255,255,0.03)"
                    : "rgba(15,23,42,0.02)",
                borderColor: "divider",
              }}
            >
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={2.5}
                alignItems="center"
              >
                <Box
                  component={data.profile_photo_data_url ? "button" : "div"}
                  type={data.profile_photo_data_url ? "button" : undefined}
                  onClick={
                    data.profile_photo_data_url
                      ? () => setPreviewOpen(true)
                      : undefined
                  }
                  sx={{
                    width: { xs: 118, sm: 132 },
                    height: { xs: 158, sm: 176 },
                    borderRadius: 2,
                    border: "1px solid",
                    borderColor: "divider",
                    overflow: "hidden",
                    bgcolor: "background.default",
                    display: "grid",
                    placeItems: "center",
                    flexShrink: 0,
                    mx: { xs: "auto", sm: 0 },
                    p: 0,
                    cursor: data.profile_photo_data_url ? "zoom-in" : "default",
                    position: "relative",
                    transition:
                      "border-color 160ms ease, box-shadow 160ms ease, transform 160ms ease",
                    "&:hover": data.profile_photo_data_url
                      ? {
                          borderColor: "primary.main",
                          boxShadow: (theme) =>
                            `0 0 0 3px ${alpha(
                              theme.palette.primary.main,
                              0.16,
                            )}`,
                          transform: "translateY(-1px)",
                        }
                      : undefined,
                  }}
                >
                  {data.profile_photo_data_url ? (
                    <>
                      <Box
                        component="img"
                        src={data.profile_photo_data_url}
                        alt="Pas foto pedagang"
                        sx={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                      <Box
                        sx={{
                          position: "absolute",
                          right: 8,
                          bottom: 8,
                          width: 30,
                          height: 30,
                          borderRadius: 1.4,
                          display: "grid",
                          placeItems: "center",
                          color: "primary.contrastText",
                          bgcolor: (theme) =>
                            alpha(theme.palette.primary.main, 0.92),
                        }}
                      >
                        <Icon icon="solar:magnifer-zoom-in-bold" width={17} />
                      </Box>
                    </>
                  ) : (
                    <Typography
                      sx={{
                        color: "text.secondary",
                        fontSize: 12,
                        fontWeight: 600,
                        textAlign: "center",
                        px: 1.5,
                      }}
                    >
                      Belum ada pas foto
                    </Typography>
                  )}
                </Box>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography
                      sx={{ color: "text.secondary", fontWeight: 600, }}
                    >
                      Keterangan
                    </Typography>
                  </Stack>
                  <Typography
                    sx={{
                      mt: 1,
                      color: "text.primary",
                      fontWeight: 600,
                      fontSize: { xs: 16, sm: 18 },
                    }}
                  >
                    {data.status?.reason}
                  </Typography>
                  {data.status?.terminated_at && (
                    <Typography sx={{ color: "text.secondary", mt: 1 }}>
                      Dinonaktifkan pada {formatDate(data.status.terminated_at)}
                    </Typography>
                  )}
                </Box>
              </Stack>
            </Paper>
          </Box>

          <Divider />

          <Box sx={{ p: { xs: 2.25, sm: 3, md: 4 } }}>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, minmax(0, 1fr))",
                  md: "repeat(3, minmax(0, 1fr))",
                },
                gap: 1.5,
              }}
            >
              <InfoCard
                icon="solar:card-2-bold"
                label="NIK"
                value={data.tenant_nik_masked}
              />
              <InfoCard
                icon="solar:map-point-bold"
                label="Lokasi"
                value={data.location_name}
              />
              <InfoCard
                icon="solar:signpost-2-bold"
                label="Sektor"
                value={
                  data.sector_code
                    ? `${data.sector_name} (${data.sector_code})`
                    : data.sector_name
                }
              />
              <InfoCard
                icon="solar:widget-5-bold"
                label="Lahan"
                value={`Lahan ${data.stall_number}`}
              />
              <InfoCard
                icon="solar:ruler-pen-bold"
                label="Ukuran"
                value={dimensions}
              />
              <InfoCard
                icon="solar:box-bold"
                label="Jenis Dagangan"
                value={data.commodity_type}
              />
              <InfoCard
                icon="solar:calendar-date-bold"
                label="Masa Berlaku"
                value={`${formatDate(data.start_date)} s/d ${formatDate(
                  data.end_date,
                )}`}
              />
              <InfoCard
                icon="solar:printer-2-bold"
                label="Tanggal Cetak"
                value={formatDate(data.printed_at || data.document_created_at)}
              />
              <InfoCard
                icon="solar:user-check-bold"
                label="Status Pedagang"
                value={formatLandPermitIdentityStatus(data.land_permit_status)}
              />
            </Box>

            <Typography
              sx={{
                color: "text.secondary",
                fontWeight: 500,
                textAlign: "justify",
                fontSize: 12,
                lineHeight: 1.7,
                mt: 3,
              }}
            >
              Halaman ini digunakan untuk kebutuhan verifikasi data izin lahan di
              lapangan.
            </Typography>
          </Box>
        </Paper>
      </Container>

      <ImagePreviewModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        imageUrl={data.profile_photo_data_url}
        alt={`Pas foto ${data.tenant_name}`}
      />
    </Box>
  );
}
