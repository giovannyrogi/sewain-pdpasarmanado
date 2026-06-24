"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Autocomplete,
  Box,
  Button,
  Chip,
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
import axios from "axios";
import AppModal from "@/app/components/modals/AppModal";
import TenantIdentityPreviewModal from "@/app/components/modals/TenantIdentityPreviewModal";

const emptyList = [];

const getContractNumberOnly = (contractNumber) =>
  String(contractNumber || "-").split("/")[0].trim();

/**
 * Modal pembuatan kontrak untuk tenant yang sudah approved dan lunas.
 * Fetch daftar tenant dilakukan saat modal dibuka agar data pilihan selalu
 * terbaru, sementara submit hanya mengirim id permohonan dan nomor kontrak.
 */
export default function AddContract({
  open,
  onClose,
  loadingTrue,
  loadingFalse,
  getDataContract,
  onNotify,
  setLoadingMessage,
}) {
  const theme = useTheme();
  const [documentNumber, setDocumentNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingTenants, setIsLoadingTenants] = useState(false);
  const [listAvailableTenant, setListAvailableTenant] = useState(emptyList);
  const [selectedTenantId, setSelectedTenantId] = useState(null);
  const [selectedTenantData, setSelectedTenantData] = useState(null);
  const [openPreviewModal, setOpenPreviewModal] = useState(false);

  const contractSuffix = useMemo(() => {
    const monthRoman = selectedTenantData?.fully_paid_month_roman || "-";
    const year = selectedTenantData?.fully_paid_year || "-";
    const locationCode = selectedTenantData?.location_code || "-";

    return `/ PM / SK / - ${locationCode} / ${monthRoman} / ${year}`;
  }, [selectedTenantData]);

  const clearForm = () => {
    setDocumentNumber("");
    setSelectedTenantData(null);
    setSelectedTenantId(null);
    setListAvailableTenant(emptyList);
  };

  const handleClose = () => {
    if (isSubmitting) return;
    clearForm();
    onClose?.();
  };

  const getListTenantFullyPaid = async () => {
    setIsLoadingTenants(true);
    setLoadingMessage?.("Mengambil daftar tenant lunas...");
    loadingTrue?.();

    try {
      const response = await axios.get("/api/contracts/tenants-fully-paid");

      if (response.data?.success) {
        const mapped = (response.data.data || []).map((item) => ({
          tenant_application_id: item.tenant_application.id,
          full_name: item.tenant_identities.full_name,
          nik: item.tenant_identities.nik,
          phone: item.tenant_identities.phone,
          ktp_file_path: item.tenant_identities.ktp_file_path,
          id: item.tenant_identities.id,
          birth_place: item.tenant_identities.birth_place,
          birth_date: item.tenant_identities.birth_date,
          occupation: item.tenant_identities.occupation,
          religion: item.tenant_identities.religion,
          nationality: item.tenant_identities.nationality,
          street_address: item.tenant_identities.street_address,
          rt: item.tenant_identities.rt,
          rw: item.tenant_identities.rw,
          kelurahan: item.tenant_identities.kelurahan,
          district: item.tenant_identities.district,
          city: item.tenant_identities.city,
          province: item.tenant_identities.province,
          location_code: item.locations.location_code,
          latest_contract_number: item.contracts.latest_contract_number,
          latest_contract_number_only: item.contracts.latest_contract_number_only,
          status: item.tenant_identities.status,
          notes: item.tenant_identities.notes,
          land_permit_status: item.tenant_identities.land_permit_status,
          is_room_rental_registered:
            item.tenant_identities.is_room_rental_registered,
          is_land_permit_registered:
            item.tenant_identities.is_land_permit_registered,
          room_number: item.rooms.room_number,
          location_name: item.locations.location_name,
          fully_paid_date: item.payments?.fully_paid_date,
          fully_paid_month_roman: item.payments?.fully_paid_month_roman,
          fully_paid_year: item.payments?.fully_paid_year,
        }));

        setListAvailableTenant(mapped);
        return;
      }

      onNotify?.({
        open: true,
        message: response.data?.message || "Gagal mengambil daftar tenant.",
        severity: "error",
      });
    } catch (error) {
      console.error("Error fetch fully paid tenants:", error);
      onNotify?.({
        open: true,
        message:
          error?.response?.data?.message || "Gagal mengambil daftar tenant.",
        severity: "error",
      });
    } finally {
      setIsLoadingTenants(false);
      loadingFalse?.();
      setLoadingMessage?.("Loading...");
    }
  };

  useEffect(() => {
    if (open) {
      getListTenantFullyPaid();
    }
  }, [open]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!selectedTenantId || !documentNumber) return;

    setIsSubmitting(true);
    setLoadingMessage?.("Membuat data kontrak...");
    loadingTrue?.();

    try {
      const response = await axios.post("/api/contracts", {
        tenant_application_id: selectedTenantId,
        document_number: documentNumber,
      });

      if (response.data?.success) {
        await getDataContract?.();
        onNotify?.({
          open: true,
          message: response.data.message || "Kontrak berhasil dibuat.",
          severity: "success",
        });
        clearForm();
        onClose?.();
        return;
      }

      onNotify?.({
        open: true,
        message: response.data?.message || "Gagal membuat kontrak.",
        severity: "error",
      });
    } catch (error) {
      console.error("Error create contract:", error);
      onNotify?.({
        open: true,
        message: error?.response?.data?.message || "Gagal membuat kontrak.",
        severity: "error",
      });
    } finally {
      setIsSubmitting(false);
      loadingFalse?.();
      setLoadingMessage?.("Loading...");
    }
  };

  return (
    <>
      <AppModal
        open={open}
        onClose={handleClose}
        title="Buat Kontrak Baru"
        titleDescription="Pilih tenant yang sudah lunas, isi nomor kontrak, lalu sistem akan membentuk format nomor kontrak otomatis."
        icon="solar:document-add-bold-duotone"
        width={720}
        contentSx={{ p: 0 }}
      >
        <Box component="form" onSubmit={handleSubmit}>
          <Box sx={{ p: { xs: 2.4, sm: 2.75 } }}>
            <Grid container spacing={2}>
              <Grid size={12}>
                <Autocomplete
                  options={listAvailableTenant || emptyList}
                  loading={isLoadingTenants}
                  getOptionLabel={(option) =>
                    option
                      ? `${option.full_name || "-"} - ${option.location_name || "-"} - ${option.room_number || "-"}`
                      : ""
                  }
                  value={
                    listAvailableTenant.find(
                      (item) => item.tenant_application_id === selectedTenantId,
                    ) || null
                  }
                  onChange={(_event, newValue) => {
                    setSelectedTenantId(newValue?.tenant_application_id || null);
                    setSelectedTenantData(newValue || null);
                  }}
                  noOptionsText={
                    isLoadingTenants
                      ? "Memuat data..."
                      : "Belum ada tenant lunas yang siap dibuat kontrak"
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Pilih Data Penyewa"
                      placeholder="Cari nama tenant, lokasi, atau ruangan"
                      required
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {isLoadingTenants ? (
                              <CircularProgress color="inherit" size={18} />
                            ) : null}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
                />
              </Grid>

              {selectedTenantData && (
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
                      alignItems={{ xs: "flex-start", sm: "center" }}
                      justifyContent="space-between"
                      spacing={1.5}
                    >
                      <Box sx={{ minWidth: 0 }}>
                        <Typography
                          sx={{
                            fontFamily: "Poppins",
                            fontWeight: 850,
                            fontSize: 14,
                            textTransform: "capitalize",
                          }}
                        >
                          {selectedTenantData.full_name}
                        </Typography>
                        <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mt: 0.75 }}>
                          <Chip
                            size="small"
                            label={selectedTenantData.location_name || "-"}
                            sx={{
                              fontWeight: 750,
                              color: theme.palette.primary.main,
                              bgcolor: alpha(theme.palette.primary.main, 0.1),
                            }}
                          />
                          <Chip
                            size="small"
                            label={`Ruangan ${selectedTenantData.room_number || "-"}`}
                            sx={{
                              fontWeight: 750,
                              color: theme.palette.info.main,
                              bgcolor: alpha(theme.palette.info.main, 0.1),
                            }}
                          />
                        </Stack>
                      </Box>

                      <Button
                        variant="outlined"
                        startIcon={<Icon icon="solar:user-id-bold-duotone" />}
                        onClick={() => setOpenPreviewModal(true)}
                        sx={{
                          borderRadius: 2,
                          fontWeight: 800,
                          textTransform: "none",
                          whiteSpace: "nowrap",
                        }}
                      >
                        Lihat Penyewa
                      </Button>
                    </Stack>
                  </Box>
                </Grid>
              )}

              <Grid size={12}>
                <TextField
                  label="Nomor Kontrak"
                  placeholder="Contoh: 001"
                  fullWidth
                  value={documentNumber}
                  onChange={(event) => {
                    setDocumentNumber(event.target.value.replace(/[^0-9]/g, ""));
                  }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <Typography
                          sx={{
                            color: theme.palette.primary.main,
                            fontWeight: 850,
                            fontSize: { xs: 11, sm: 12 },
                            whiteSpace: "nowrap",
                          }}
                        >
                          {contractSuffix}
                        </Typography>
                      </InputAdornment>
                    ),
                  }}
                  required
                />
              </Grid>

              {selectedTenantData?.latest_contract_number && (
                <Grid size={12}>
                  <Box
                    sx={{
                      p: 1.4,
                      borderRadius: 2,
                      color: theme.palette.primary.main,
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.22)}`,
                    }}
                  >
                    <Typography sx={{ fontSize: 13, fontWeight: 800 }}>
                      Nomor kontrak terakhir:{" "}
                      {getContractNumberOnly(selectedTenantData.latest_contract_number)}
                    </Typography>
                  </Box>
                </Grid>
              )}
            </Grid>
          </Box>

          <Divider sx={{ borderColor: theme.ui.dashboardCardBorder }} />

          <Stack
            direction={{ xs: "column-reverse", sm: "row" }}
            justifyContent="flex-end"
            spacing={1.25}
            sx={{ p: { xs: 2.4, sm: 2.75 }, pt: 2 }}
          >
            <Button
              variant="contained"
              onClick={handleClose}
              disabled={isSubmitting}
              sx={{
                borderRadius: 2,
                fontWeight: 800,
                textTransform: "none",
                color: theme.palette.text.primary,
                bgcolor:
                  theme.palette.mode === "dark"
                    ? "rgba(255,255,255,0.10)"
                    : "rgba(17,24,39,0.08)",
                boxShadow: "none",
              }}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={isSubmitting || !selectedTenantId || !documentNumber}
              startIcon={
                isSubmitting ? (
                  <CircularProgress color="inherit" size={18} />
                ) : (
                  <Icon icon="solar:document-add-bold-duotone" />
                )
              }
              sx={{
                borderRadius: 2,
                fontWeight: 850,
                textTransform: "none",
                boxShadow: theme.ui.buttonShadow,
              }}
            >
              {isSubmitting ? "Menyimpan..." : "Simpan Kontrak"}
            </Button>
          </Stack>
        </Box>
      </AppModal>

      <TenantIdentityPreviewModal
        open={openPreviewModal}
        onClose={() => setOpenPreviewModal(false)}
        selectedData={selectedTenantData}
      />
    </>
  );
}
