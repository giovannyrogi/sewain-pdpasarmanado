"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Autocomplete,
  Box,
  FormControl,
  Grid,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import { Icon } from "@iconify/react";
import CrudFormModal from "@/app/components/crud/CrudFormModal";
import formatRupiah from "@/app/components/formatrupiah/page";
import { formatNumber } from "@/app/utils/formatNumber";
import {
  calculateAnnualLandRent,
  calculateLandStallArea,
} from "@/app/utils/landPermitCalculations";

const emptyForm = {
  location_id: "",
  sector_id: "",
  stall_number: "",
  stall_length: "",
  stall_width: "",
  price_per_m2: "",
  status: "available",
  notes: "",
};

const toMoneyDigits = (value) => String(value || "").replace(/\D/g, "");

const toDimensionInput = (value) =>
  String(value || "")
    .replace(/[^0-9,.]/g, "")
    .replace(/([,.].*)[,.]/g, "$1");

const parseDimensionNumber = (value) => {
  const rawValue = String(value ?? "").trim();
  if (!rawValue) return 0;

  const normalizedValue = rawValue.includes(",")
    ? rawValue.replace(/\./g, "").replace(",", ".")
    : rawValue;
  const parsedValue = Number(normalizedValue);

  return Number.isFinite(parsedValue) ? parsedValue : 0;
};

const formatDimensionValue = (value) => {
  if (value === null || value === undefined || value === "") return "";

  return formatNumber(parseDimensionNumber(value), {
    defaultValue: "",
    maxFractionDigits: 2,
  });
};

const normalizeDimensionPayload = (value) =>
  Number(parseDimensionNumber(value).toFixed(4));

const statusOptions = [
  { value: "available", label: "Tersedia" },
  { value: "occupied", label: "Sudah Terisi" },
  { value: "maintenance", label: "Dalam Perbaikan" },
  { value: "unavailable", label: "Tidak Layak" },
];

/**
 * Form master lapak izin lahan.
 * Form ini sengaja mengikuti pola form ruangan agar pengelolaan master aset
 * terasa konsisten, sementara kalkulasi final transaksi tetap dilakukan di fase permohonan.
 */
export default function LandStallFormModal({
  open,
  mode = "create",
  initialData,
  locations = [],
  sectors = [],
  loading,
  onClose,
  onSubmit,
}) {
  const theme = useTheme();
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (!open) return;

    setForm(
      initialData
        ? {
            location_id: initialData.location_id || "",
            sector_id: initialData.sector_id || "",
            stall_number: initialData.stall_number || "",
            stall_length: formatDimensionValue(initialData.stall_length ?? ""),
            stall_width: formatDimensionValue(initialData.stall_width ?? ""),
            price_per_m2: initialData.price_per_m2 || "",
            status: initialData.status || "available",
            notes: initialData.notes || "",
          }
        : emptyForm,
    );
  }, [initialData, open]);

  const selectedLocation = useMemo(
    () => locations.find((item) => item.id === form.location_id) || null,
    [form.location_id, locations],
  );

  const filteredSectors = useMemo(
    () =>
      sectors.filter(
        (item) =>
          !form.location_id || Number(item.location_id) === Number(form.location_id),
      ),
    [form.location_id, sectors],
  );

  const selectedSector = useMemo(
    () => filteredSectors.find((item) => item.id === form.sector_id) || null,
    [filteredSectors, form.sector_id],
  );

  const preview = useMemo(() => {
    const stall_area = calculateLandStallArea(form.stall_length, form.stall_width);
    const annualRent = calculateAnnualLandRent({
      stall_length: form.stall_length,
      stall_width: form.stall_width,
      price_per_m2: form.price_per_m2,
    });

    return { stall_area, annualRent };
  }, [form.price_per_m2, form.stall_length, form.stall_width]);

  const updateField = (key, value) => {
    setForm((current) => {
      const next = { ...current, [key]: value };

      /**
       * Sektor selalu mengikuti lokasi. Saat lokasi berubah, sector_id yang
       * sudah tidak berada pada lokasi tersebut dibersihkan untuk mencegah data silang.
       */
      if (key === "location_id") {
        const sectorStillValid = sectors.some(
          (item) =>
            item.id === current.sector_id && Number(item.location_id) === Number(value),
        );
        if (!sectorStillValid) next.sector_id = "";
      }

      return next;
    });
  };

  const handleStatusChange = (value) => {
    setForm((current) => ({
      ...current,
      status: value,
      notes: ["maintenance", "unavailable"].includes(value)
        ? current.notes
        : "",
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit?.({
      location_id: form.location_id,
      sector_id: form.sector_id,
      stall_number: form.stall_number,
      stall_length: normalizeDimensionPayload(form.stall_length),
      stall_width: normalizeDimensionPayload(form.stall_width),
      price_per_m2: form.price_per_m2,
      status: form.status,
      notes: ["maintenance", "unavailable"].includes(form.status)
        ? form.notes || null
        : null,
    });
  };

  return (
    <CrudFormModal
      open={open}
      title={mode === "edit" ? "Ubah Lapak" : "Tambah Lapak"}
      description="Daftarkan lapak berdasarkan lokasi dan sektor, lengkap dengan ukuran serta harga per meter."
      icon="solar:shop-bold-duotone"
      submitLabel={mode === "edit" ? "Simpan Perubahan" : "Tambah Lapak"}
      loadingLabel={mode === "edit" ? "Menyimpan..." : "Menambahkan..."}
      loading={loading}
      width={820}
      onClose={onClose}
      onSubmit={handleSubmit}
    >
      <Grid container spacing={{ xs: 2.8, sm: 2.25 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Autocomplete
            options={locations}
            value={selectedLocation}
            getOptionLabel={(option) => option?.location_name || ""}
            isOptionEqualToValue={(option, value) => option?.id === value?.id}
            onChange={(_, option) => updateField("location_id", option?.id || "")}
            disabled={loading}
            renderInput={(params) => (
              <TextField {...params} required label="Lokasi" />
            )}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Autocomplete
            options={filteredSectors}
            value={selectedSector}
            getOptionLabel={(option) => option?.sector_name || ""}
            isOptionEqualToValue={(option, value) => option?.id === value?.id}
            onChange={(_, option) => updateField("sector_id", option?.id || "")}
            disabled={loading || !form.location_id}
            renderInput={(params) => (
              <TextField
                {...params}
                required
                label="Sektor"
                helperText={!form.location_id ? "Pilih lokasi terlebih dahulu." : ""}
              />
            )}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            required
            fullWidth
            label="Nomor/Nama Lapak"
            value={form.stall_number}
            onChange={(event) => updateField("stall_number", event.target.value)}
            disabled={loading}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <FormControl fullWidth required>
            <InputLabel id="land-stall-status-label">Status Lapak</InputLabel>
            <Select
              labelId="land-stall-status-label"
              label="Status Lapak"
              value={form.status}
              onChange={(event) => handleStatusChange(event.target.value)}
              disabled={loading}
            >
              {statusOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            required
            fullWidth
            label="Panjang (m)"
            value={form.stall_length}
            onChange={(event) =>
              updateField("stall_length", toDimensionInput(event.target.value))
            }
            disabled={loading}
            InputProps={{
              endAdornment: <InputAdornment position="end">m</InputAdornment>,
            }}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            required
            fullWidth
            label="Lebar (m)"
            value={form.stall_width}
            onChange={(event) =>
              updateField("stall_width", toDimensionInput(event.target.value))
            }
            disabled={loading}
            InputProps={{
              endAdornment: <InputAdornment position="end">m</InputAdornment>,
            }}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            required
            fullWidth
            label="Luas (m²)"
            value={formatDimensionValue(preview.stall_area)}
            disabled
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            required
            fullWidth
            label="Harga Per m² (Rp)"
            value={form.price_per_m2 ? formatRupiah(form.price_per_m2, "hideRp") : ""}
            onChange={(event) =>
              updateField("price_per_m2", toMoneyDigits(event.target.value))
            }
            disabled={loading}
            InputProps={{
              startAdornment: <InputAdornment position="start">Rp.</InputAdornment>,
            }}
          />
        </Grid>

        {["maintenance", "unavailable"].includes(form.status) && (
          <Grid size={12}>
            <TextField
              label="Catatan Status *"
              placeholder="Tuliskan alasan lapak belum dapat digunakan..."
              value={form.notes}
              onChange={(event) =>
                updateField("notes", event.target.value.slice(0, 180))
              }
              disabled={loading}
              fullWidth
              multiline
              minRows={3}
              inputProps={{ maxLength: 180 }}
              helperText={`${form.notes.length}/180 karakter`}
            />
          </Grid>
        )}

        <Grid size={12}>
          <Box
            sx={{
              p: 1.4,
              borderRadius: 2,
              border: `1px solid ${theme.ui.dashboardCardBorder}`,
              bgcolor:
                theme.palette.mode === "dark"
                  ? "rgba(255,255,255,0.035)"
                  : "rgba(17,24,39,0.025)",
            }}
          >
            <Stack direction="row" spacing={1.2} alignItems="center">
              <Box
                sx={{
                  width: 38,
                  height: 38,
                  borderRadius: 2,
                  display: "grid",
                  placeItems: "center",
                  color: theme.palette.primary.main,
                  bgcolor:
                    theme.palette.mode === "dark"
                      ? "rgba(255,152,0,0.13)"
                      : "rgba(230,9,9,0.08)",
                }}
              >
                <Icon
                  icon="solar:calculator-minimalistic-bold-duotone"
                  fontSize={20}
                />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontWeight: 850, fontSize: 12.5 }}>
                  Perhitungan Sewa Lapak
                </Typography>
                <Typography
                  sx={{
                    color: theme.ui.mutedText,
                    fontWeight: 650,
                    fontSize: 12,
                  }}
                >
                  {`${formatNumber(preview.stall_area)} m² x ${formatRupiah(
                    form.price_per_m2,
                  )} = ${formatRupiah(preview.annualRent)}`}
                </Typography>
              </Box>
            </Stack>
          </Box>
        </Grid>
      </Grid>
    </CrudFormModal>
  );
}
