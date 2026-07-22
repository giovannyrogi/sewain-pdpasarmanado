"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Autocomplete,
  Box,
  Button,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import moment from "moment";
import CrudFormModal from "@/app/components/crud/CrudFormModal";
import TenantIdentityPreviewModal from "@/app/components/modals/TenantIdentityPreviewModal";
import { calculateLeaseEndDate } from "@/app/utils/calculateRoomRent";
import formatRupiah from "@/app/components/formatrupiah/page";
import { LAND_PERMIT_COMMODITY_OPTIONS } from "@/app/utils/landPermitCommodityOptions";
import LandPermitCostDetailModal from "./LandPermitCostDetailModal";
import { calculateLandPermitCost } from "./landPermitApplicationUtils";

const emptyForm = {
  application_type: "baru",
  renewal_of: "",
  tenant_identity_id: "",
  commodity_type: "",
  location_id: "",
  sector_id: "",
  stall_id: "",
  start_date: moment(),
  lease_duration_years: 1,
  administration_type: "kip",
};

export default function LandPermitApplicationFormModal({
  open,
  mode = "create",
  initialData,
  identities = [],
  locations = [],
  sectors = [],
  stalls = [],
  applications,
  loading,
  onClose,
  onSubmit,
}) {
  const theme = useTheme();
  const [form, setForm] = useState(emptyForm);
  const [identityPreviewOpen, setIdentityPreviewOpen] = useState(false);
  const [costOpen, setCostOpen] = useState(false);

  const activeIdentities = useMemo(
    () => identities.filter((item) => item.land_permit_status === "active"),
    [identities],
  );
  const activeSectors = useMemo(
    () =>
      sectors.filter(
        (item) =>
          item.status === "active" &&
          (!form.location_id ||
            Number(item.location_id) === Number(form.location_id)),
      ),
    [form.location_id, sectors],
  );
  const availableStalls = useMemo(
    () =>
      stalls.filter((item) => {
        const sameCurrent =
          mode === "edit" && Number(item.id) === Number(initialData?.stall_id);
        const selectedFromRenewal = Number(item.id) === Number(form.stall_id);
        return (
          Number(item.location_id) === Number(form.location_id) &&
          Number(item.sector_id) === Number(form.sector_id) &&
          (item.status === "available" || sameCurrent || selectedFromRenewal)
        );
      }),
    [form.location_id, form.sector_id, initialData?.stall_id, mode, stalls],
  );
  const renewalOptions = useMemo(
    () =>
      applications.filter(
        (item) =>
          item.approval_status === "approved" &&
          item.land_permit_status === "active" &&
          item.land_permit_application_id !==
            initialData?.land_permit_application_id,
      ),
    [applications, initialData?.land_permit_application_id],
  );

  const selectedIdentity = activeIdentities.find(
    (item) => Number(item.id) === Number(form.tenant_identity_id),
  );
  const selectedLocation = locations.find(
    (item) => Number(item.id) === Number(form.location_id),
  );
  const selectedSector = sectors.find(
    (item) => Number(item.id) === Number(form.sector_id),
  );
  const selectedStall = stalls.find(
    (item) => Number(item.id) === Number(form.stall_id),
  );

  const endDate = useMemo(() => {
    const value = calculateLeaseEndDate(
      form.start_date?.toDate ? form.start_date.toDate() : form.start_date,
      form.lease_duration_years,
    );
    return value ? moment(value.toDate ? value.toDate() : value) : null;
  }, [form.lease_duration_years, form.start_date]);
  const cost = calculateLandPermitCost(
    selectedStall,
    form.lease_duration_years,
    form.administration_type,
  );

  useEffect(() => {
    if (!open) return;

    if (mode === "edit" && initialData) {
      setForm({
        application_type: initialData.application_type || "baru",
        renewal_of: initialData.renewal_of || "",
        tenant_identity_id: initialData.tenant_identity_id || "",
        commodity_type: initialData.commodity_type || "",
        location_id: initialData.location_id || "",
        sector_id: initialData.sector_id || "",
        stall_id: initialData.stall_id || "",
        admin_fee: initialData.admin_fee || 0,
        administration_type: initialData.administration_type || "kip",
        start_date: initialData.start_date
          ? moment(initialData.start_date)
          : moment(),
        lease_duration_years: Number(initialData.lease_duration_years || 1),
      });
      return;
    }

    setForm(emptyForm);
  }, [initialData, mode, open]);

  const updateField = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const applyRenewalData = (application) => {
    if (!application) {
      setForm((current) => ({ ...current, renewal_of: "" }));
      return;
    }

    setForm((current) => ({
      ...current,
      renewal_of: application.land_permit_application_id,
      tenant_identity_id: application.tenant_identity_id,
      commodity_type: application.commodity_type || "",
      location_id: application.location_id,
      sector_id: application.sector_id,
      stall_id: application.stall_id,
      start_date: application.end_date
        ? moment(application.end_date).add(1, "day")
        : current.start_date,
      lease_duration_years: Number(application.lease_duration_years || 1),
    }));
  };

  const handleApplicationTypeChange = (value) => {
    if (value === "baru") {
      setForm((current) => ({
        ...current,
        application_type: value,
        renewal_of: "",
      }));
      return;
    }

    setForm((current) => ({ ...current, application_type: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit?.({
      application_type: form.application_type,
      renewal_of:
        form.application_type === "perpanjangan" ? form.renewal_of : null,
      tenant_identity_id: form.tenant_identity_id,
      commodity_type: form.commodity_type,
      location_id: form.location_id,
      sector_id: form.sector_id,
      administration_type: form.administration_type,
      stall_id: form.stall_id,
      start_date: form.start_date
        ? moment(form.start_date).format("YYYY-MM-DD")
        : "",
      end_date: endDate ? endDate.format("YYYY-MM-DD") : "",
      lease_duration_years: form.lease_duration_years,
    });
  };

  const linkButtonSx = {
    alignSelf: "flex-start",
    mt: 0.35,
    minWidth: 0,
    minHeight: "auto",
    p: 0,
    lineHeight: 1.1,
    color: "primary.main",
    fontWeight: 700,
    textTransform: "none",
    "&:hover": {
      bgcolor: "transparent",
      textDecoration: "underline",
    },
  };

  return (
    <>
      <CrudFormModal
        open={open}
        title={
          mode === "edit"
            ? "Ubah Permohonan Izin Lahan"
            : "Tambah Permohonan Izin Lahan"
        }
        description="Lengkapi identitas, lokasi, sektor, lahan, masa izin, dan rincian biaya izin lahan."
        icon="solar:document-add-bold-duotone"
        submitLabel={mode === "edit" ? "Simpan Perubahan" : "Simpan"}
        loadingLabel="Menyimpan..."
        loading={loading}
        onClose={onClose}
        onSubmit={handleSubmit}
      >
        <Grid
          container
          rowSpacing={{ xs: 2.75, sm: 3, md: 3.25 }}
          columnSpacing={{ xs: 2, sm: 2.25, md: 2.5 }}
        >
          <Grid size={12}>
            <TextField
              select
              fullWidth
              label="Pilih Jenis Permohonan *"
              value={form.application_type}
              onChange={(event) =>
                handleApplicationTypeChange(event.target.value)
              }
              disabled={loading || mode === "edit"}
            >
              <MenuItem value="baru">Permohonan Baru</MenuItem>
              <MenuItem value="perpanjangan">Perpanjang</MenuItem>
            </TextField>
          </Grid>

          {form.application_type === "perpanjangan" && mode === "create" && (
            <Grid size={12}>
              <Autocomplete
                options={renewalOptions}
                getOptionLabel={(option) =>
                  `${option.tenant_name || "-"} | Lahan ${option.stall_number || "-"} | ${option.end_date || "-"}`
                }
                value={
                  renewalOptions.find(
                    (item) =>
                      Number(item.land_permit_application_id) ===
                      Number(form.renewal_of),
                  ) || null
                }
                onChange={(_, value) => applyRenewalData(value)}
                disabled={loading}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Pilih Permohonan Lama *"
                    required
                  />
                )}
              />
            </Grid>
          )}

          <Grid size={12}>
            <Autocomplete
              options={activeIdentities}
              getOptionLabel={(option) =>
                `${option.full_name || "-"} | NIK ${option.nik || "-"}`
              }
              value={selectedIdentity || null}
              onChange={(_, value) =>
                updateField("tenant_identity_id", value?.id || "")
              }
              disabled={
                loading ||
                mode === "edit" ||
                form.application_type === "perpanjangan"
              }
              renderInput={(params) => (
                <TextField {...params} label="Pilih Data Penyewa *" required />
              )}
            />
            {selectedIdentity && (
              <Button
                size="small"
                onClick={() => setIdentityPreviewOpen(true)}
                sx={{
                  ...linkButtonSx,
                  mt: { xs: 0.85, sm: 1 },
                }}
              >
                Lihat Data Penyewa
              </Button>
            )}
          </Grid>

          <Grid size={12}>
            <Autocomplete
              options={LAND_PERMIT_COMMODITY_OPTIONS}
              value={form.commodity_type || null}
              onChange={(_, value) =>
                updateField("commodity_type", value || "")
              }
              disabled={loading}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Jenis Dagangan / Komoditas *"
                  required
                />
              )}
            />
          </Grid>

          <Grid size={12}>
            <FormControl fullWidth>
              <InputLabel id="administration-type-select-label">
                Jenis Administrasi
              </InputLabel>
              <Select
                labelId="administration-type-select-label"
                id="administration-type-select"
                value={form.administration_type}
                label="Pilih Jenis Administrasi"
                onChange={(event) =>
                  updateField("administration_type", event.target.value)
                }
              >
                <MenuItem value={"kip"}>Kartu Identitas Pedagang(KIP)</MenuItem>
                <MenuItem value={"kkip"}>
                  Kartu Khusus Identitas Pedagang(KKIP)
                </MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Autocomplete
              options={locations}
              getOptionLabel={(option) => option.location_name || ""}
              value={selectedLocation || null}
              onChange={(_, value) =>
                setForm((current) => ({
                  ...current,
                  location_id: value?.id || "",
                  sector_id: "",
                  stall_id: "",
                }))
              }
              disabled={loading}
              renderInput={(params) => (
                <TextField {...params} label="Pilih Lokasi *" required />
              )}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Autocomplete
              options={activeSectors}
              getOptionLabel={(option) => option.sector_name || ""}
              value={selectedSector || null}
              onChange={(_, value) =>
                setForm((current) => ({
                  ...current,
                  sector_id: value?.id || "",
                  stall_id: "",
                }))
              }
              disabled={loading || !form.location_id}
              renderInput={(params) => (
                <TextField {...params} label="Pilih Sektor *" required />
              )}
            />
          </Grid>

          <Grid size={12}>
            <Autocomplete
              options={availableStalls}
              getOptionLabel={(option) =>
                `Lahan ${option.stall_number || "-"} | ${formatRupiah(option.price_per_m2)}/m²`
              }
              value={selectedStall || null}
              onChange={(_, value) => updateField("stall_id", value?.id || "")}
              disabled={loading || !form.sector_id}
              renderInput={(params) => (
                <TextField {...params} label="Pilih Lahan *" required />
              )}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <DatePicker
              label="Tanggal Mulai *"
              value={form.start_date}
              onChange={(value) => updateField("start_date", value)}
              disabled={loading}
              slotProps={{ textField: { fullWidth: true, required: true } }}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              type="number"
              label="Durasi Izin (Tahun) *"
              value={form.lease_duration_years}
              onChange={(event) =>
                updateField(
                  "lease_duration_years",
                  Math.max(Number(event.target.value || 1), 1),
                )
              }
              disabled={loading}
              inputProps={{ min: 1 }}
            />
            <Typography
              sx={{
                mt: 0.5,
                color: "primary.main",
                fontSize: 11.5,
                fontWeight: 700,
              }}
            >
              Durasi izin dalam tahun
            </Typography>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              label="Tanggal Berakhir *"
              value={endDate ? endDate.format("DD/MM/YYYY") : ""}
              disabled
            />
          </Grid>

          {selectedStall && (
            <Grid size={12}>
              <Box
                sx={{
                  p: { xs: 1.35, sm: 1.5 },
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
                  justifyContent="space-between"
                  alignItems={{ xs: "flex-start", sm: "center" }}
                  spacing={1}
                >
                  <Box>
                    <Typography
                      sx={{
                        color: theme.ui.mutedText,
                        fontWeight: 650,
                        fontSize: 12,
                      }}
                    >
                      Total pembayaran izin lahan
                    </Typography>
                    <Typography
                      sx={{ fontWeight: 700, fontSize: { xs: 18, sm: 20 } }}
                    >
                      {formatRupiah(cost.totalPayment)}
                    </Typography>
                  </Box>
                  <Button
                    size="small"
                    variant="outlined"
                    color="primary"
                    onClick={() => setCostOpen(true)}
                    sx={{
                      borderRadius: 1.5,
                      minHeight: 32,
                      px: 1.35,
                      fontWeight: 700,
                      textTransform: "none",
                    }}
                  >
                    Lihat Rincian
                  </Button>
                </Stack>
              </Box>
            </Grid>
          )}
        </Grid>
      </CrudFormModal>

      <TenantIdentityPreviewModal
        open={identityPreviewOpen}
        onClose={() => setIdentityPreviewOpen(false)}
        selectedData={selectedIdentity}
        showLandPermitFields
      />

      <LandPermitCostDetailModal
        open={costOpen}
        onClose={() => setCostOpen(false)}
        location={selectedLocation}
        sector={selectedSector}
        stall={selectedStall}
        application={applications}
        administrationType={form.administration_type}
        durationYears={form.lease_duration_years}
        startDate={
          form.start_date ? moment(form.start_date).format("DD/MM/YYYY") : ""
        }
        endDate={endDate ? endDate.format("DD/MM/YYYY") : ""}
      />
    </>
  );
}
