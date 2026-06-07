"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Autocomplete, Grid, TextField } from "@mui/material";
import wilayah from "daftar-wilayah-indonesia";
import CrudFormModal from "@/app/components/crud/CrudFormModal";

const emptyForm = {
  location_name: "",
  location_code: "",
  province: "",
  city: "",
  district: "",
  kelurahan: "",
  street_address: "",
};

const findByName = (items, name) =>
  items.find((item) => item.nama === name) || null;

/**
 * Form lokasi reusable untuk create dan update.
 * Pilihan provinsi -> kabupaten -> kecamatan -> kelurahan dihitung dari kode
 * wilayah aktif supaya user tidak bisa memilih kombinasi administrasi yang
 * tidak saling berhubungan.
 */
export default function LocationFormModal({
  open,
  mode = "create",
  initialData,
  loading,
  onClose,
  onSubmit,
}) {
  const [form, setForm] = useState(emptyForm);
  const [provinceOption, setProvinceOption] = useState(null);
  const [cityOption, setCityOption] = useState(null);
  const [districtOption, setDistrictOption] = useState(null);
  const [villageOption, setVillageOption] = useState(null);

  const provinceOptions = useMemo(() => wilayah.provinsi(), []);
  const cityOptions = useMemo(
    () => (provinceOption?.kode ? wilayah.kabupaten(provinceOption.kode) : []),
    [provinceOption],
  );
  const districtOptions = useMemo(
    () => (cityOption?.kode ? wilayah.kecamatan(cityOption.kode) : []),
    [cityOption],
  );
  const villageOptions = useMemo(
    () => (districtOption?.kode ? wilayah.desa(districtOption.kode) : []),
    [districtOption],
  );

  useEffect(() => {
    if (!open) return;

    const nextForm = initialData
      ? {
          location_name: initialData.location_name || "",
          location_code: initialData.location_code || "",
          province: initialData.province || "",
          city: initialData.city || "",
          district: initialData.district || "",
          kelurahan: initialData.kelurahan || "",
          street_address: initialData.street_address || "",
        }
      : emptyForm;

    setForm(nextForm);

    const selectedProvince = findByName(provinceOptions, nextForm.province);
    setProvinceOption(selectedProvince);

    const nextCities = selectedProvince?.kode
      ? wilayah.kabupaten(selectedProvince.kode)
      : [];
    const selectedCity = findByName(nextCities, nextForm.city);
    setCityOption(selectedCity);

    const nextDistricts = selectedCity?.kode
      ? wilayah.kecamatan(selectedCity.kode)
      : [];
    const selectedDistrict = findByName(nextDistricts, nextForm.district);
    setDistrictOption(selectedDistrict);

    const nextVillages = selectedDistrict?.kode
      ? wilayah.desa(selectedDistrict.kode)
      : [];
    setVillageOption(findByName(nextVillages, nextForm.kelurahan));
  }, [initialData, open, provinceOptions]);

  const updateField = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleProvinceChange = (_, option) => {
    setProvinceOption(option);
    setCityOption(null);
    setDistrictOption(null);
    setVillageOption(null);
    setForm((current) => ({
      ...current,
      province: option?.nama || "",
      city: "",
      district: "",
      kelurahan: "",
    }));
  };

  const handleCityChange = (_, option) => {
    setCityOption(option);
    setDistrictOption(null);
    setVillageOption(null);
    setForm((current) => ({
      ...current,
      city: option?.nama || "",
      district: "",
      kelurahan: "",
    }));
  };

  const handleDistrictChange = (_, option) => {
    setDistrictOption(option);
    setVillageOption(null);
    setForm((current) => ({
      ...current,
      district: option?.nama || "",
      kelurahan: "",
    }));
  };

  const handleVillageChange = (_, option) => {
    setVillageOption(option);
    updateField("kelurahan", option?.nama || "");
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit?.(form);
  };

  return (
    <CrudFormModal
      open={open}
      title={mode === "edit" ? "Ubah Lokasi" : "Tambah Lokasi"}
      description="Lengkapi identitas lokasi, kode, wilayah administratif, dan alamat jalan untuk data master lokasi."
      icon="solar:map-point-add-bold-duotone"
      submitLabel={mode === "edit" ? "Simpan Perubahan" : "Tambah Lokasi"}
      loadingLabel={mode === "edit" ? "Menyimpan..." : "Menambahkan..."}
      loading={loading}
      onClose={onClose}
      onSubmit={handleSubmit}
    >
      <Grid container spacing={{ xs: 2.8, sm: 2.25 }}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            required
            fullWidth
            label="Nama Lokasi"
            value={form.location_name}
            onChange={(event) =>
              updateField("location_name", event.target.value)
            }
            disabled={loading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            required
            fullWidth
            label="Kode Lokasi"
            value={form.location_code}
            onChange={(event) =>
              updateField("location_code", event.target.value)
            }
            disabled={loading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Autocomplete
            options={provinceOptions}
            value={provinceOption}
            getOptionLabel={(option) => option?.nama || ""}
            isOptionEqualToValue={(option, value) =>
              option?.kode === value?.kode
            }
            onChange={handleProvinceChange}
            disabled={loading}
            renderInput={(params) => (
              <TextField {...params} required label="Provinsi" />
            )}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Autocomplete
            options={cityOptions}
            value={cityOption}
            getOptionLabel={(option) => option?.nama || ""}
            isOptionEqualToValue={(option, value) =>
              option?.kode === value?.kode
            }
            onChange={handleCityChange}
            disabled={loading || !provinceOption}
            renderInput={(params) => (
              <TextField {...params} required label="Kabupaten/Kota" />
            )}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Autocomplete
            options={districtOptions}
            value={districtOption}
            getOptionLabel={(option) => option?.nama || ""}
            isOptionEqualToValue={(option, value) =>
              option?.kode === value?.kode
            }
            onChange={handleDistrictChange}
            disabled={loading || !cityOption}
            renderInput={(params) => (
              <TextField {...params} required label="Kecamatan" />
            )}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Autocomplete
            options={villageOptions}
            value={villageOption}
            getOptionLabel={(option) => option?.nama || ""}
            isOptionEqualToValue={(option, value) =>
              option?.kode === value?.kode
            }
            onChange={handleVillageChange}
            disabled={loading || !districtOption}
            renderInput={(params) => (
              <TextField {...params} required label="Kelurahan/Desa" />
            )}
          />
        </Grid>
        <Grid size={12}>
          <TextField
            required
            fullWidth
            multiline
            minRows={2}
            label="Nama Jalan / Alamat"
            value={form.street_address}
            onChange={(event) =>
              updateField("street_address", event.target.value)
            }
            disabled={loading}
          />
        </Grid>
      </Grid>
    </CrudFormModal>
  );
}
