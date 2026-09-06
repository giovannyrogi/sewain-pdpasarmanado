"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  Divider,
  Grid,
  InputAdornment,
  Stack,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { Icon } from "@iconify/react";
import AppModal from "@/app/components/modals/AppModal";
import CompactInfoChip from "@/app/components/chips/CompactInfoChip";
import { landDocumentPrefix } from "@/app/utils/traderCardPrinting";
import LandPermitApplicantDetailModal from "@/app/(protected)/land-permit-applications/LandPermitApplicantDetailModal";

const getDocumentNumberOnly = (value) =>
  String(value || "-").split("/")[0].trim();

export default function LandPermitDocumentFormModal({
  open,
  applications,
  loading,
  onClose,
  onSubmit,
}) {
  const theme = useTheme();
  const [applicationId, setApplicationId] = useState(null);
  const [documentNumber, setDocumentNumber] = useState("");
  const [detailOpen, setDetailOpen] = useState(false);

  const selectedApplication = useMemo(
    () =>
      applications.find(
        (item) => Number(item.land_permit_application_id) === Number(applicationId),
      ) || null,
    [applicationId, applications],
  );

  const documentSuffix = useMemo(() => {
    if (!selectedApplication) return "/PM/...-.../.../....";
    return `/PM/${landDocumentPrefix(selectedApplication.administration_type)}-${selectedApplication.location_code || "-"}/${
      selectedApplication.fully_paid_month_roman || "-"
    }/${selectedApplication.fully_paid_year || "-"}`;
  }, [selectedApplication]);

  useEffect(() => {
    if (!open) return;
    setApplicationId(null);
    setDocumentNumber("");
    setDetailOpen(false);
  }, [open]);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!applicationId || !documentNumber) return;
    onSubmit?.({
      land_permit_application_id: applicationId,
      document_number: documentNumber,
    });
  };

  return (
    <>
      <AppModal
        open={open}
        onClose={() => !loading && onClose?.()}
        title="Buat Dokumen Izin Lahan"
        titleDescription="Pilih pemohon yang pembayarannya sudah disetujui, lalu isi nomor dokumen."
        icon="solar:document-add-bold-duotone"
        width={760}
        contentSx={{ p: 0 }}
      >
        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={{ xs: 2, sm: 2.25 }} sx={{ p: { xs: 2, sm: 2.75 } }}>
            <Grid size={12}>
              <Autocomplete
                options={applications}
                value={selectedApplication}
                loading={loading}
                disabled={loading}
                isOptionEqualToValue={(option, value) =>
                  Number(option.land_permit_application_id) ===
                  Number(value.land_permit_application_id)
                }
                getOptionLabel={(option) =>
                  [
                    option?.tenant_name,
                    option?.location_name,
                    option?.sector_name,
                    `Lahan ${option?.stall_number || "-"}`,
                  ]
                    .filter(Boolean)
                    .join(" - ")
                }
                onChange={(_event, value) =>
                  setApplicationId(value?.land_permit_application_id || null)
                }
                noOptionsText="Belum ada pembayaran lunas yang siap dibuatkan dokumen"
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Pilih Data Penyewa"
                    placeholder="Cari nama, lokasi, sektor, atau lahan"
                    required
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {loading ? <CircularProgress color="inherit" size={18} /> : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
              />
            </Grid>

            {selectedApplication && (
              <Grid size={12}>
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
                    spacing={1.5}
                  >
                    <Box sx={{ minWidth: 0 }}>
                      <Typography sx={{ fontWeight: 700, fontSize: 14 }}>
                        {selectedApplication.tenant_name || "-"}
                      </Typography>
                      <Stack
                        direction="row"
                        spacing={0.75}
                        flexWrap="wrap"
                        useFlexGap
                        sx={{ mt: 0.75 }}
                      >
                        <CompactInfoChip
                          label={selectedApplication.location_name || "-"}
                        />
                        <CompactInfoChip
                          label={selectedApplication.sector_name || "-"}
                          color={theme.palette.info.main}
                        />
                        <CompactInfoChip
                          label={`Lahan ${selectedApplication.stall_number || "-"}`}
                          color={theme.palette.success.main}
                        />
                      </Stack>
                    </Box>
                    <Button
                      variant="outlined"
                      onClick={() => setDetailOpen(true)}
                      sx={{
                        borderRadius: 2,
                        fontWeight: 700,
                        textTransform: "none",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Lihat Detail Pemohon
                    </Button>
                  </Stack>
                </Box>
              </Grid>
            )}

            <Grid size={12}>
              <TextField
                fullWidth
                required
                label="Nomor Dokumen"
                placeholder="Contoh: 086"
                value={documentNumber}
                disabled={loading}
                onChange={(event) =>
                  setDocumentNumber(event.target.value.replace(/[^0-9]/g, ""))
                }
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <Typography
                        sx={{
                          color: theme.palette.primary.main,
                          fontSize: { xs: 10.5, sm: 12 },
                          fontWeight: 700,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {documentSuffix}
                      </Typography>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            {selectedApplication?.latest_document_number && (
              <Grid size={12}>
                <Box
                  sx={{
                    p: 1.4,
                    borderRadius: 2,
                    color: theme.palette.primary.main,
                    bgcolor: alpha(theme.palette.primary.main, 0.09),
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.22)}`,
                  }}
                >
                  <Typography sx={{ fontSize: 13, fontWeight: 700 }}>
                    Nomor dokumen terakhir:{" "}
                    {getDocumentNumberOnly(selectedApplication.latest_document_number)}
                  </Typography>
                </Box>
              </Grid>
            )}
          </Grid>

          <Divider sx={{ borderColor: theme.ui.dashboardCardBorder }} />
          <Stack
            direction={{ xs: "column-reverse", sm: "row" }}
            justifyContent="flex-end"
            spacing={1.25}
            sx={{ p: { xs: 2, sm: 2.75 }, pt: 2 }}
          >
            <Button
              variant="contained"
              color="inherit"
              disabled={loading}
              onClick={onClose}
              sx={{ borderRadius: 2, fontWeight: 700, textTransform: "none" }}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={loading || !applicationId || !documentNumber}
              startIcon={
                loading ? (
                  <CircularProgress color="inherit" size={18} />
                ) : (
                  <Icon icon="solar:document-add-bold-duotone" />
                )
              }
              sx={{ borderRadius: 2, fontWeight: 700, textTransform: "none" }}
            >
              {loading ? "Menyimpan..." : "Simpan Dokumen"}
            </Button>
          </Stack>
        </Box>
      </AppModal>

      <LandPermitApplicantDetailModal
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        selectedData={selectedApplication}
      />
    </>
  );
}
