"use client";

import React, { useEffect, useState } from "react";
import {
  Autocomplete,
  Box,
  Button,
  Grid,
  Stack,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { Icon } from "@iconify/react";
import axios from "axios";
import CrudFormModal from "@/app/components/crud/CrudFormModal";
import LandPermitApplicantDetailModal from "@/app/(protected)/land-permit-applications/LandPermitApplicantDetailModal";

const MAX_STATEMENT_FILE_SIZE = 5 * 1024 * 1024;

const getPermitLabel = (option) =>
  option?.tenant_name
    ? `${option.tenant_name} - ${option.location_name || "-"} - ${option.sector_name || "-"} - Lahan ${option.stall_number || "-"}`
    : "";

const getFileSizeLabel = (file) => {
  if (!file?.size) return "PDF/DOC/DOCX, maksimal 5MB";
  return `${(file.size / 1024 / 1024).toFixed(2).replace(".", ",")} MB`;
};

/**
 * Form pengajuan non-aktif izin lahan.
 * Data izin aktif diambil ulang saat modal dibuka agar pilihan selalu segar dan
 * tidak menampilkan izin yang sudah punya proses non-aktif berjalan.
 */
export default function LandPermitTerminationFormModal({
  open,
  loading = false,
  onClose,
  onSubmitSuccess,
  onLoadingChange,
  onLoadingMessageChange,
  onNotify,
}) {
  const theme = useTheme();
  const [eligibleApplications, setEligibleApplications] = useState([]);
  const [selectedPermit, setSelectedPermit] = useState(null);
  const [reason, setReason] = useState("");
  const [statementFile, setStatementFile] = useState(null);
  const [statementPreviewPath, setStatementPreviewPath] = useState("");
  const [detailOpen, setDetailOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const notify = (message, severity = "success") => {
    onNotify?.({ open: true, message, severity });
  };

  const clearForm = () => {
    setEligibleApplications([]);
    setSelectedPermit(null);
    setReason("");
    setStatementFile(null);
    setStatementPreviewPath("");
  };

  const setPageLoading = (isLoading, message = "Loading...") => {
    onLoadingMessageChange?.(message);
    onLoadingChange?.(isLoading);
  };

  const fetchEligiblePermits = async () => {
    setPageLoading(true, "Memuat izin lahan aktif...");
    try {
      const response = await axios.get("/api/land-permit-terminations", {
        params: { eligible: 1 },
      });
      setEligibleApplications(response.data?.data || []);
    } catch (error) {
      console.error("Error fetch eligible land permits:", error);
      notify(
        error?.response?.data?.message ||
          "Gagal mengambil daftar izin lahan aktif.",
        "error",
      );
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => {
    if (open) fetchEligiblePermits();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleClose = () => {
    if (submitting || loading) return;
    clearForm();
    onClose?.();
  };

  const handleStatementChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_STATEMENT_FILE_SIZE) {
      notify("Ukuran surat pernyataan maksimal 5MB.", "error");
      event.target.value = "";
      return;
    }

    setStatementFile(file);
    setStatementPreviewPath(URL.createObjectURL(file));
  };

  const clearStatementFile = () => {
    setStatementFile(null);
    setStatementPreviewPath("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!selectedPermit?.land_permit_application_id) {
      notify("Silakan pilih izin lahan yang akan dinonaktifkan.", "error");
      return;
    }

    if (!reason.trim()) {
      notify("Silakan isi alasan non-aktif izin lahan.", "error");
      return;
    }

    if (!statementFile) {
      notify("Silakan upload surat pernyataan.", "error");
      return;
    }

    const formData = new FormData();
    formData.append(
      "land_permit_application_id",
      selectedPermit.land_permit_application_id,
    );
    formData.append("reason", reason.trim());
    formData.append("statement_file", statementFile);

    setSubmitting(true);
    setPageLoading(true, "Mengajukan non-aktif izin lahan...");
    try {
      const response = await axios.post(
        "/api/land-permit-terminations",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      );

      if (response.data?.success) {
        notify(
          response.data.message ||
            "Pengajuan non-aktif izin lahan berhasil dibuat.",
        );
        clearForm();
        onClose?.();
        await onSubmitSuccess?.();
      }
    } catch (error) {
      console.error("Error submit land permit termination:", error);
      notify(
        error?.response?.data?.message ||
          "Gagal membuat pengajuan non-aktif izin lahan.",
        "error",
      );
    } finally {
      setSubmitting(false);
      setPageLoading(false);
    }
  };

  return (
    <>
      <CrudFormModal
        open={open}
        title="Non-Aktifkan Izin Lahan"
        description="Pilih izin lahan aktif, isi alasan, dan lampirkan surat pernyataan sebagai dokumen pendukung."
        icon="solar:lock-keyhole-minimalistic-bold-duotone"
        width={820}
        submitLabel="Ajukan Nonaktif"
        loadingLabel="Mengajukan non-aktif izin lahan..."
        loading={submitting}
        onClose={handleClose}
        onSubmit={handleSubmit}
      >
        <Grid container spacing={{ xs: 2.4, sm: 2.6 }}>
          <Grid size={12}>
            <Autocomplete
              options={eligibleApplications}
              getOptionLabel={getPermitLabel}
              value={selectedPermit}
              onChange={(_event, newValue) => setSelectedPermit(newValue)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Pilih Izin Lahan Aktif"
                  placeholder="Cari pemohon, lokasi, sektor, atau lahan"
                  required
                />
              )}
            />
          </Grid>

          {selectedPermit && (
            <Grid size={12}>
              <Box
                sx={{
                  p: { xs: 1.4, sm: 1.6 },
                  borderRadius: 2,
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                  bgcolor:
                    theme.palette.mode === "dark"
                      ? alpha(theme.palette.primary.main, 0.08)
                      : alpha(theme.palette.primary.main, 0.05),
                }}
              >
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  alignItems={{ xs: "stretch", sm: "center" }}
                  justifyContent="space-between"
                  spacing={1.5}
                >
                  <Stack direction="row" spacing={1.25} sx={{ minWidth: 0 }}>
                    <Box
                      sx={{
                        width: 42,
                        height: 42,
                        flex: "0 0 auto",
                        borderRadius: 2,
                        display: "grid",
                        placeItems: "center",
                        color: theme.palette.primary.main,
                        bgcolor: alpha(theme.palette.primary.main, 0.16),
                      }}
                    >
                      <Icon icon="solar:shop-bold-duotone" fontSize={22} />
                    </Box>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography sx={{ fontWeight: 700, fontSize: 13.5 }}>
                        {selectedPermit.tenant_name || "-"}
                      </Typography>
                      <Typography
                        sx={{
                          color: theme.ui.mutedText,
                          fontSize: 12,
                          fontWeight: 650,
                          mt: 0.25,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {selectedPermit.location_name || "-"} |{" "}
                        {selectedPermit.sector_name || "-"} | Lahan{" "}
                        {selectedPermit.stall_number || "-"} |{" "}
                        {selectedPermit.commodity_type || "-"}
                      </Typography>
                    </Box>
                  </Stack>
                  <Button
                    variant="contained"
                    startIcon={<Icon icon="solar:eye-bold-duotone" />}
                    onClick={() => setDetailOpen(true)}
                    sx={{
                      borderRadius: 2,
                      fontWeight: 700,
                      textTransform: "none",
                    }}
                  >
                    Lihat Detail
                  </Button>
                </Stack>
              </Box>
            </Grid>
          )}

          <Grid size={12}>
            <TextField
              label="Alasan Non-Aktif"
              placeholder="Tuliskan alasan izin lahan perlu dinonaktifkan"
              multiline
              minRows={4}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              inputProps={{ maxLength: 300 }}
              helperText={`${reason.length}/300`}
              required
              fullWidth
            />
          </Grid>

          <Grid size={12}>
            <Box
              sx={{
                p: { xs: 1.5, sm: 1.75 },
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
                <Stack direction="row" spacing={1.25} alignItems="center">
                  <Box
                    sx={{
                      width: 42,
                      height: 42,
                      borderRadius: 2,
                      display: "grid",
                      placeItems: "center",
                      color: theme.palette.primary.main,
                      bgcolor: alpha(theme.palette.primary.main, 0.14),
                    }}
                  >
                    <Icon icon="solar:document-bold-duotone" fontSize={22} />
                  </Box>
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography sx={{ fontWeight: 700, fontSize: 13 }}>
                      Surat Pernyataan
                    </Typography>
                    <Typography
                      sx={{
                        color: theme.ui.mutedText,
                        fontSize: 11.5,
                        fontWeight: 650,
                        maxWidth: "100%",
                        overflow: "hidden",
                        overflowWrap: "anywhere",
                        wordBreak: "break-word",
                        display: "-webkit-box",
                        WebkitBoxOrient: "vertical",
                        WebkitLineClamp: { xs: 3, sm: 2 },
                      }}
                    >
                      {statementFile?.name || getFileSizeLabel(statementFile)}
                    </Typography>
                  </Box>
                </Stack>

                <Stack
                  direction="row"
                  spacing={1}
                  justifyContent={{ xs: "stretch", sm: "flex-end" }}
                  sx={{
                    flexShrink: 0,
                    "& .MuiButton-root": {
                      minWidth: { xs: 0, sm: 42 },
                      flex: { xs: 1, sm: "0 0 auto" },
                    },
                  }}
                >
                  {statementPreviewPath && (
                    <Button
                      variant="outlined"
                      onClick={() => window.open(statementPreviewPath, "_blank")}
                      sx={{
                        borderRadius: 2,
                        color: theme.palette.primary.main,
                        borderColor: alpha(theme.palette.primary.main, 0.45),
                        "&:hover": {
                          borderColor: theme.palette.primary.main,
                          bgcolor: alpha(theme.palette.primary.main, 0.08),
                        },
                      }}
                    >
                      <Icon icon="solar:eye-bold-duotone" fontSize={19} />
                    </Button>
                  )}
                  <Button
                    component="label"
                    variant="contained"
                    sx={{ borderRadius: 2, minWidth: 42 }}
                  >
                    <Icon icon="solar:upload-bold-duotone" fontSize={19} />
                    <input
                      hidden
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={handleStatementChange}
                    />
                  </Button>
                  {statementFile && (
                    <Button
                      variant="contained"
                      color="error"
                      onClick={clearStatementFile}
                      sx={{ borderRadius: 2 }}
                    >
                      <Icon
                        icon="solar:trash-bin-trash-bold-duotone"
                        fontSize={19}
                      />
                    </Button>
                  )}
                </Stack>
              </Stack>
            </Box>
          </Grid>
        </Grid>
      </CrudFormModal>

      <LandPermitApplicantDetailModal
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        selectedData={selectedPermit}
      />
    </>
  );
}
