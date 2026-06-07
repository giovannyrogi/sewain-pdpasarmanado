"use client";

import React, { useEffect, useState } from "react";
import {
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
} from "@mui/material";
import CrudFormModal from "@/app/components/crud/CrudFormModal";

const emptyForm = {
  location_id: "",
  floor: "",
};

const FLOOR_OPTIONS = [
  "Basement",
  ...Array.from({ length: 10 }, (_, index) => `Lt. ${index + 1}`),
];

/**
 * Form lantai reusable untuk create dan update.
 * Parent hanya mengatur request API, sedangkan komponen ini fokus pada input
 * lokasi dan lantai agar bisa dipakai ulang tanpa membawa logic jaringan.
 */
export default function FloorFormModal({
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
            floor: initialData.floor || "",
          }
        : emptyForm,
    );
  }, [initialData, open]);

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
      title={mode === "edit" ? "Ubah Lantai" : "Tambah Lantai"}
      description="Pilih lokasi dan lantai operasional agar data ruangan dapat dikelompokkan dengan rapi."
      icon="solar:tag-bold-duotone"
      submitLabel={mode === "edit" ? "Simpan Perubahan" : "Tambah Lantai"}
      loadingLabel={mode === "edit" ? "Menyimpan..." : "Menambahkan..."}
      loading={loading}
      onClose={onClose}
      onSubmit={handleSubmit}
    >
      <Grid container spacing={{ xs: 2.8, sm: 2.25 }}>
        <Grid size={12}>
          <FormControl fullWidth required>
            <InputLabel id="floor-location-label">Pilih Lokasi</InputLabel>
            <Select
              labelId="floor-location-label"
              label="Pilih Lokasi"
              value={form.location_id}
              onChange={(event) => updateField("location_id", event.target.value)}
              disabled={loading}
            >
              {locations.map((item) => (
                <MenuItem key={item.id} value={item.id}>
                  {item.location_name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid size={12}>
          <FormControl fullWidth required>
            <InputLabel id="floor-name-label">Pilih Lantai</InputLabel>
            <Select
              labelId="floor-name-label"
              label="Pilih Lantai"
              value={form.floor}
              onChange={(event) => updateField("floor", event.target.value)}
              disabled={loading}
            >
              {FLOOR_OPTIONS.map((item) => (
                <MenuItem key={item} value={item}>
                  {item}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      </Grid>
    </CrudFormModal>
  );
}
