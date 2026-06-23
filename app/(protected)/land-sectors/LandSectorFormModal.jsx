"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Autocomplete,
  Grid,
  MenuItem,
  TextField,
} from "@mui/material";
import CrudFormModal from "@/app/components/crud/CrudFormModal";

const emptyForm = {
  location_id: "",
  sector_name: "",
  sector_code: "",
  description: "",
  status: "active",
};

const statusOptions = [
  { value: "active", label: "Aktif" },
  { value: "inactive", label: "Tidak Aktif" },
];

/**
 * Form master sektor izin lahan.
 * Parent tetap menangani request API; komponen ini hanya menyusun input
 * lokasi, nama/kode sektor, deskripsi, dan status agar reusable untuk create/edit.
 */
export default function LandSectorFormModal({
  open,
  mode = "create",
  initialData,
  locations = [],
  loading,
  onClose,
  onSubmit,
}) {
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (!open) return;

    setForm(
      initialData
        ? {
            location_id: initialData.location_id || "",
            sector_name: initialData.sector_name || "",
            sector_code: initialData.sector_code || "",
            description: initialData.description || "",
            status: initialData.status || "active",
          }
        : emptyForm,
    );
  }, [initialData, open]);

  const selectedLocation = useMemo(
    () => locations.find((item) => item.id === form.location_id) || null,
    [form.location_id, locations],
  );

  const updateField = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit?.(form);
  };

  return (
    <CrudFormModal
      open={open}
      title={mode === "edit" ? "Ubah Sektor" : "Tambah Sektor"}
      description="Kelola sektor izin lahan berdasarkan lokasi agar lapak dapat dikelompokkan dengan jelas."
      icon="solar:map-arrow-square-bold-duotone"
      submitLabel={mode === "edit" ? "Simpan Perubahan" : "Tambah Sektor"}
      loadingLabel={mode === "edit" ? "Menyimpan..." : "Menambahkan..."}
      loading={loading}
      onClose={onClose}
      onSubmit={handleSubmit}
    >
      <Grid container spacing={{ xs: 2.8, sm: 2.25 }}>
        <Grid size={{ xs: 12, sm: 6 }}>
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
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            required
            fullWidth
            label="Nama Sektor"
            value={form.sector_name}
            onChange={(event) => updateField("sector_name", event.target.value)}
            disabled={loading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            label="Kode Sektor"
            value={form.sector_code}
            onChange={(event) => updateField("sector_code", event.target.value)}
            disabled={loading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            select
            fullWidth
            label="Status"
            value={form.status}
            onChange={(event) => updateField("status", event.target.value)}
            disabled={loading}
          >
            {statusOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid size={12}>
          <TextField
            fullWidth
            multiline
            minRows={2}
            label="Deskripsi"
            value={form.description}
            onChange={(event) => updateField("description", event.target.value)}
            disabled={loading}
          />
        </Grid>
      </Grid>
    </CrudFormModal>
  );
}
