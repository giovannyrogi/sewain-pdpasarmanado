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
import TenantLeaseDetailModal from "@/app/components/modals/TenantLeaseDetailModal";

const MAX_STATEMENT_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_STATEMENT_TYPES = ".pdf,.doc,.docx";

const getContractLabel = (option) =>
  option?.tenant_name
    ? `${option.tenant_name} - ${option.location_name || "-"} - ${option.room_number || "-"}`
    : "";

const getFileSizeLabel = (file) => {
  if (!file?.size) return "Maksimal 5MB";
  return `${(file.size / 1024 / 1024).toFixed(2).replace(".", ",")} MB`;
};

export default function TenantTerminationsModal({
  open,
  onClose,
  loadingTrue,
  loadingFalse,
  onNotify,
  getDataTenantTerminations,
}) {
  const theme = useTheme();
  const [notes, setNotes] = useState("");
  const [statementFilePath, setStatementFilePath] = useState("");
  const [statementFile, setStatementFile] = useState(null);
  const [tenantApplications, setTenantApplications] = useState([]);
  const [tenantApplicationId, setTenantApplicationId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openDetailTenant, setOpenDetailTenant] = useState(false);
  const [selectedData, setSelectedData] = useState(null);

  const selectedContract =
    tenantApplications.find(
      (item) => item.tenant_application_id === tenantApplicationId,
    ) || null;

  const notify = (message, severity = "success") => {
    onNotify?.({ open: true, message, severity });
  };

  const clearForm = () => {
    setNotes("");
    setStatementFilePath("");
    setStatementFile(null);
    setTenantApplicationId("");
    setTenantApplications([]);
    setSelectedData(null);
  };

  const handleClose = () => {
    if (isSubmitting) return;
    clearForm();
    onClose();
  };

  const getDataTenantApplication = async () => {
    loadingTrue();
    try {
      const response = await axios.get("/api/tenant-application/without-terminations");
      setTenantApplications(response.data?.data || []);
    } catch (error) {
      console.error("Error fetch tenant application for termination:", error);
      notify("Gagal mengambil daftar kontrak aktif.", "error");
    } finally {
      setTimeout(() => loadingFalse(), 500);
    }
  };

  useEffect(() => {
    if (open) {
      getDataTenantApplication();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleDocumentChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_STATEMENT_FILE_SIZE) {
      notify("Ukuran surat pernyataan maksimal 5MB.", "error");
      event.target.value = "";
      return;
    }

    /**
     * Object URL hanya dipakai untuk preview cepat di browser.
     * File asli tetap dikirim sebagai FormData ketika submit.
     */
    setStatementFile(file);
    setStatementFilePath(URL.createObjectURL(file));
  };

  const clearStatementFile = () => {
    setStatementFile(null);
    setStatementFilePath("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!tenantApplicationId) {
      notify("Silakan pilih kontrak yang akan dinonaktifkan.", "error");
      return;
    }

    if (!notes.trim()) {
      notify("Silakan isi alasan menonaktifkan tenant.", "error");
      return;
    }

    if (!statementFile) {
      notify("Silakan upload surat pernyataan.", "error");
      return;
    }

    const formData = new FormData();
    formData.append("tenant_application_id", tenantApplicationId);
    formData.append("reason", notes.trim());
    formData.append("statement_file", statementFile);

    loadingTrue();
    setIsSubmitting(true);

    try {
      const response = await axios.post("/api/tenant-terminations", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.data?.success) {
        notify(response.data.message || "Pengajuan nonaktif tenant berhasil dibuat.");
        await getDataTenantTerminations();
        clearForm();
        onClose();
      }
    } catch (error) {
      console.error("Error submit tenant termination:", error);
      notify(
        error?.response?.data?.message || "Gagal membuat pengajuan nonaktif tenant.",
        "error",
      );
    } finally {
      setTimeout(() => {
        loadingFalse();
        setIsSubmitting(false);
      }, 500);
    }
  };

  return (
    <>
      <CrudFormModal
        open={open}
        title="Non-Aktifkan Tenant"
        description="Pilih kontrak aktif, isi alasan termination, dan upload surat pernyataan sebagai dokumen pendukung."
        icon="solar:lock-keyhole-minimalistic-bold-duotone"
        width={760}
        submitLabel="Ajukan Nonaktif"
        loadingLabel="Mengajukan nonaktif tenant..."
        loading={isSubmitting}
        onClose={handleClose}
        onSubmit={handleSubmit}
      >
        <Grid container spacing={{ xs: 2.6, sm: 2.4 }}>
          <Grid size={12}>
            <Autocomplete
              options={tenantApplications}
              getOptionLabel={getContractLabel}
              value={selectedContract}
              onChange={(_event, newValue) => {
                setSelectedData(newValue || null);
                setTenantApplicationId(newValue?.tenant_application_id || "");
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Pilih Kontrak"
                  placeholder="Cari penyewa, lokasi, atau ruangan"
                  required
                />
              )}
            />
          </Grid>

          {selectedContract && (
            <Grid size={12}>
              <Box
                sx={{
                  p: { xs: 1.25, sm: 1.5 },
                  borderRadius: 2,
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.32)}`,
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
                  <Stack direction="row" spacing={1.25} alignItems="center" sx={{ minWidth: 0 }}>
                    <Box
                      sx={{
                        width: 42,
                        height: 42,
                        flex: "0 0 auto",
                        borderRadius: 2,
                        display: "grid",
                        placeItems: "center",
                        color: theme.palette.primary.main,
                        bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.16 : 0.1),
                      }}
                    >
                      <Icon icon="solar:user-id-bold-duotone" fontSize={22} />
                    </Box>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography sx={{ fontFamily: "Poppins", fontWeight: 900, fontSize: 13.5 }}>
                        {selectedContract.tenant_name || "-"}
                      </Typography>
                      <Typography
                        sx={{
                          color: theme.ui.mutedText,
                          fontFamily: "Poppins",
                          fontWeight: 650,
                          fontSize: 12,
                          mt: 0.2,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        Ruangan {selectedContract.room_number || "-"} | {selectedContract.location_name || "-"} | {selectedContract.floor || "-"}
                      </Typography>
                    </Box>
                  </Stack>

                  <Button
                    variant="contained"
                    startIcon={<Icon icon="solar:eye-bold-duotone" />}
                    onClick={() => setOpenDetailTenant(true)}
                    sx={{
                      minHeight: 40,
                      borderRadius: 2,
                      fontFamily: "Poppins",
                      fontWeight: 850,
                      textTransform: "none",
                      boxShadow: "none",
                    }}
                  >
                    Lihat Detail Tenant
                  </Button>
                </Stack>
              </Box>
            </Grid>
          )}

          <Grid size={12}>
            <TextField
              label="Alasan Menonaktifkan"
              placeholder="Tuliskan alasan singkat dan jelas..."
              fullWidth
              multiline
              minRows={4}
              value={notes}
              onChange={(event) => setNotes(event.target.value.slice(0, 150))}
              inputProps={{ maxLength: 150 }}
              required
              helperText={`${notes.length}/150 karakter`}
              FormHelperTextProps={{
                sx: {
                  ml: 0,
                  textAlign: "left",
                  fontFamily: "Poppins",
                  fontWeight: 650,
                },
              }}
            />
          </Grid>

          <Grid size={12}>
            <Box
              sx={{
                p: { xs: 1.25, sm: 1.5 },
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
                <Stack direction="row" spacing={1.25} alignItems="center" sx={{ minWidth: 0 }}>
                  <Box
                    sx={{
                      width: 42,
                      height: 42,
                      borderRadius: 2,
                      display: "grid",
                      placeItems: "center",
                      flex: "0 0 auto",
                      color: theme.palette.primary.main,
                      bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.16 : 0.09),
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                    }}
                  >
                    <Icon icon="solar:document-add-bold-duotone" fontSize={22} />
                  </Box>
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography sx={{ fontFamily: "Poppins", fontWeight: 850, fontSize: 13 }}>
                      Surat Pernyataan
                    </Typography>
                    <Typography
                      sx={{
                        color: theme.ui.mutedText,
                        fontFamily: "Poppins",
                        fontWeight: 650,
                        fontSize: 12,
                        maxWidth: "100%",
                        overflow: "hidden",
                        overflowWrap: "anywhere",
                        wordBreak: "break-word",
                        display: "-webkit-box",
                        WebkitBoxOrient: "vertical",
                        WebkitLineClamp: { xs: 3, sm: 2 },
                      }}
                    >
                      {statementFile ? `${statementFile.name} (${getFileSizeLabel(statementFile)})` : "PDF/DOC/DOCX, maksimal 5MB."}
                    </Typography>
                  </Box>
                </Stack>

                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={1}
                  sx={{
                    flexShrink: 0,
                    width: { xs: "100%", sm: "auto" },
                    "& .MuiButton-root": {
                      minWidth: { xs: "100%", sm: "auto" },
                    },
                  }}
                >
                  {statementFilePath && (
                    <Button
                      variant="outlined"
                      aria-label="Lihat surat pernyataan"
                      onClick={() => window.open(statementFilePath, "_blank")}
                      sx={{
                        borderRadius: 2,
                        color: theme.palette.primary.main,
                        borderColor: alpha(theme.palette.primary.main, 0.45),
                        fontWeight: 850,
                        textTransform: "none",
                        minWidth: { xs: "100%", sm: 44 },
                        width: { xs: "100%", sm: 44 },
                        height: 40,
                        px: { xs: 1.5, sm: 0 },
                        display: "inline-flex",
                        gap: { xs: 1, sm: 0 },
                        "&:hover": {
                          borderColor: theme.palette.primary.main,
                          bgcolor: alpha(theme.palette.primary.main, 0.08),
                        },
                      }}
                    >
                      <Icon icon="solar:eye-bold-duotone" fontSize={18} />
                      <Box
                        component="span"
                        sx={{
                          display: { xs: "inline", sm: "none" },
                          whiteSpace: "nowrap",
                        }}
                      >
                        Lihat
                      </Box>
                    </Button>
                  )}
                  <Button
                    variant="contained"
                    component="label"
                    aria-label={statementFile ? "Ganti file surat pernyataan" : "Upload surat pernyataan"}
                    sx={{
                      borderRadius: 2,
                      fontWeight: 850,
                      textTransform: "none",
                      minWidth: { xs: "100%", sm: 44 },
                      width: { xs: "100%", sm: 44 },
                      height: 40,
                      px: { xs: 1.5, sm: 0 },
                      display: "inline-flex",
                      gap: { xs: 1, sm: 0 },
                    }}
                    disabled={isSubmitting}
                  >
                    <Icon icon="solar:upload-bold-duotone" fontSize={18} />
                    <Box
                      component="span"
                      sx={{
                        display: { xs: "inline", sm: "none" },
                        whiteSpace: "nowrap",
                      }}
                    >
                      {statementFile ? "Ganti File" : "Upload"}
                    </Box>
                    <input
                      type="file"
                      accept={ALLOWED_STATEMENT_TYPES}
                      hidden
                      onChange={handleDocumentChange}
                      disabled={isSubmitting}
                    />
                  </Button>
                  {statementFile && (
                    <Button
                      variant="contained"
                      color="error"
                      aria-label="Hapus surat pernyataan"
                      onClick={clearStatementFile}
                      sx={{
                        borderRadius: 2,
                        fontWeight: 850,
                        textTransform: "none",
                        minWidth: { xs: "100%", sm: 44 },
                        width: { xs: "100%", sm: 44 },
                        height: 40,
                        px: { xs: 1.5, sm: 0 },
                        display: "inline-flex",
                        gap: { xs: 1, sm: 0 },
                      }}
                    >
                      <Icon icon="solar:trash-bin-trash-bold-duotone" fontSize={18} />
                      <Box
                        component="span"
                        sx={{
                          display: { xs: "inline", sm: "none" },
                          whiteSpace: "nowrap",
                        }}
                      >
                        Hapus
                      </Box>
                    </Button>
                  )}
                </Stack>
              </Stack>
            </Box>
          </Grid>
        </Grid>
      </CrudFormModal>

      <TenantLeaseDetailModal
        open={openDetailTenant}
        onClose={() => setOpenDetailTenant(false)}
        selectedData={selectedData}
      />
    </>
  );
}
