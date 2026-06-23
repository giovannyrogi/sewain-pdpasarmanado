"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Autocomplete,
  Box,
  Button,
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { Icon } from "@iconify/react";
import moment from "moment";
import wilayah from "daftar-wilayah-indonesia";
import CrudFormModal from "@/app/components/crud/CrudFormModal";
import ImagePreviewModal from "@/app/components/modals/ImagePreviewModal";
import {
  getUploadApiUrl,
  normalizeStoredUploadPath,
} from "@/app/utils/uploadPath";
import {
  getIndonesianPhoneLocalValue,
  normalizeIndonesianPhone,
  normalizeIndonesianPhoneInput,
  validateIndonesianPhoneLocal,
} from "@/app/utils/phoneNumber";

const emptyForm = {
  nomorIndukKependudukan: "",
  namaLengkap: "",
  tempatLahir: "",
  tanggalLahir: null,
  agama: "",
  pekerjaan: "",
  wargaNegara: "WNI",
  phone: "",
  alamatJalan: "",
  rt: "",
  rw: "",
  provinsi: "",
  kabupaten: "",
  kecamatan: "",
  kelurahan: "",
  status: "active",
  notes: "",
  landPermitStatus: "active",
  landPermitStatusNotes: "",
  ktpFile: null,
  ktpFilePath: "",
  profilePhotoFile: null,
  profilePhotoFilePath: "",
};

const getProvinceOptions = () =>
  typeof wilayah.provinsi === "function"
    ? wilayah.provinsi()
    : wilayah.provinsi || [];

const getCityOptions = (provinceCode) =>
  provinceCode ? wilayah.kabupaten(provinceCode) : [];
const getDistrictOptions = (cityCode) =>
  cityCode ? wilayah.kecamatan(cityCode) : [];
const getVillageOptions = (districtCode) =>
  districtCode ? wilayah.desa(districtCode) : [];

const toDigits = (value, maxLength) =>
  String(value || "")
    .replace(/[^0-9]/g, "")
    .slice(0, maxLength);

const uploadActionTextSx = {
  display: { xs: "inline", sm: "none" },
  fontSize: 13,
  fontWeight: 850,
  lineHeight: 1,
};

const getUploadActionButtonSx = (options = {}) => ({
  width: { xs: "100%", sm: "auto" },
  minWidth: { xs: "100%", sm: 40 },
  height: { sm: 40 },
  px: { xs: 2, sm: 0 },
  ...(options.minWidth ? { minWidth: { xs: "100%", sm: options.minWidth } } : {}),
  "& .MuiButton-startIcon": {
    ml: 0,
    mr: { xs: 1, sm: 0 },
  },
  ...(options.sx || {}),
});

/**
 * Modal form identitas penyewa.
 * Parent mengatur request API, sedangkan komponen ini hanya mengelola field,
 * pilihan wilayah berjenjang, preview KTP, dan payload FormData.
 */
export default function IdentityFormModal({
  open,
  mode = "create",
  initialData,
  isLandPermitContext = false,
  loading,
  onClose,
  onSubmit,
  onNotify,
}) {
  const theme = useTheme();
  const [form, setForm] = useState(emptyForm);
  const [provinceCode, setProvinceCode] = useState("");
  const [cityCode, setCityCode] = useState("");
  const [districtCode, setDistrictCode] = useState("");
  const [villageCode, setVillageCode] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState({
    url: "",
    alt: "Preview dokumen",
  });

  const provinces = useMemo(() => getProvinceOptions(), []);
  const cities = useMemo(() => getCityOptions(provinceCode), [provinceCode]);
  const districts = useMemo(() => getDistrictOptions(cityCode), [cityCode]);
  const villages = useMemo(
    () => getVillageOptions(districtCode),
    [districtCode],
  );
  const ktpPreviewUrl = form.ktpFilePath?.startsWith("blob:")
    ? form.ktpFilePath
    : getUploadApiUrl(form.ktpFilePath);
  const profilePhotoPreviewUrl = form.profilePhotoFilePath?.startsWith("blob:")
    ? form.profilePhotoFilePath
    : getUploadApiUrl(form.profilePhotoFilePath);
  const remainingNikDigits = Math.max(
    16 - form.nomorIndukKependudukan.length,
    0,
  );
  const phoneValidation = form.phone
    ? validateIndonesianPhoneLocal(form.phone)
    : { error: null };

  useEffect(() => {
    if (!open) return;

    if (!initialData) {
      setForm(emptyForm);
      setProvinceCode("");
      setCityCode("");
      setDistrictCode("");
      setVillageCode("");
      return;
    }

    const selectedProvince = provinces.find(
      (item) => item.nama === initialData.province,
    );
    const cityOptions = getCityOptions(selectedProvince?.kode);
    const selectedCity = cityOptions.find(
      (item) => item.nama === initialData.city,
    );
    const districtOptions = getDistrictOptions(selectedCity?.kode);
    const selectedDistrict = districtOptions.find(
      (item) => item.nama === initialData.district,
    );
    const villageOptions = getVillageOptions(selectedDistrict?.kode);
    const selectedVillage = villageOptions.find(
      (item) => item.nama === initialData.kelurahan,
    );

    setProvinceCode(selectedProvince?.kode || "");
    setCityCode(selectedCity?.kode || "");
    setDistrictCode(selectedDistrict?.kode || "");
    setVillageCode(selectedVillage?.kode || "");
    setForm({
      nomorIndukKependudukan: initialData.nik || "",
      namaLengkap: initialData.full_name || "",
      tempatLahir: initialData.birth_place || "",
      tanggalLahir: initialData.birth_date
        ? moment(initialData.birth_date)
        : null,
      agama: initialData.religion || "",
      pekerjaan: initialData.occupation || "",
      wargaNegara: initialData.nationality || "WNI",
      phone: getIndonesianPhoneLocalValue(initialData.phone),
      alamatJalan: initialData.street_address || "",
      rt: initialData.rt || "",
      rw: initialData.rw || "",
      provinsi: initialData.province || "",
      kabupaten: initialData.city || "",
      kecamatan: initialData.district || "",
      kelurahan: initialData.kelurahan || "",
      status: initialData.status || "active",
      notes: initialData.notes || "",
      landPermitStatus: initialData.land_permit_status || "active",
      landPermitStatusNotes: initialData.land_permit_status_notes || "",
      ktpFile: null,
      ktpFilePath: initialData.ktp_file_path || "",
      profilePhotoFile: null,
      profilePhotoFilePath: initialData.profile_photo_file_path || "",
    });
  }, [initialData, open, provinces]);

  const updateField = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleProvinceChange = (newValue) => {
    setProvinceCode(newValue?.kode || "");
    setCityCode("");
    setDistrictCode("");
    setVillageCode("");
    setForm((current) => ({
      ...current,
      provinsi: newValue?.nama || "",
      kabupaten: "",
      kecamatan: "",
      kelurahan: "",
    }));
  };

  const handleCityChange = (newValue) => {
    setCityCode(newValue?.kode || "");
    setDistrictCode("");
    setVillageCode("");
    setForm((current) => ({
      ...current,
      kabupaten: newValue?.nama || "",
      kecamatan: "",
      kelurahan: "",
    }));
  };

  const handleDistrictChange = (newValue) => {
    setDistrictCode(newValue?.kode || "");
    setVillageCode("");
    setForm((current) => ({
      ...current,
      kecamatan: newValue?.nama || "",
      kelurahan: "",
    }));
  };

  const handleVillageChange = (newValue) => {
    setVillageCode(newValue?.kode || "");
    updateField("kelurahan", newValue?.nama || "");
  };

  const handleKtpChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png"];
    if (!allowedTypes.includes(file.type)) {
      onNotify?.({
        open: true,
        message: "Format foto KTP harus JPG atau PNG.",
        severity: "error",
      });
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      onNotify?.({
        open: true,
        message: "Ukuran foto KTP maksimal 5MB.",
        severity: "error",
      });
      event.target.value = "";
      return;
    }

    setForm((current) => ({
      ...current,
      ktpFile: file,
      ktpFilePath: URL.createObjectURL(file),
    }));
    event.target.value = "";
  };

  const handleProfilePhotoChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png"];
    if (!allowedTypes.includes(file.type)) {
      onNotify?.({
        open: true,
        message: "Format pas foto harus JPG atau PNG.",
        severity: "error",
      });
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      onNotify?.({
        open: true,
        message: "Ukuran pas foto maksimal 5MB.",
        severity: "error",
      });
      event.target.value = "";
      return;
    }

    setForm((current) => ({
      ...current,
      profilePhotoFile: file,
      profilePhotoFilePath: URL.createObjectURL(file),
    }));
    event.target.value = "";
  };

  const clearKtpFile = () => {
    setForm((current) => ({
      ...current,
      ktpFile: null,
      ktpFilePath: "",
    }));
  };

  const clearProfilePhotoFile = () => {
    setForm((current) => ({
      ...current,
      profilePhotoFile: null,
      profilePhotoFilePath: "",
    }));
  };

  const openImagePreview = (url, alt) => {
    setPreviewImage({ url, alt });
    setPreviewOpen(true);
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!form.ktpFilePath) {
      onNotify?.({
        open: true,
        message: "Silakan upload foto KTP.",
        severity: "error",
      });
      return;
    }

    if (isLandPermitContext && !form.profilePhotoFilePath) {
      onNotify?.({
        open: true,
        message: "Pas foto wajib diupload untuk Admin Izin Lahan.",
        severity: "error",
      });
      return;
    }

    const formData = new FormData();
    if (mode === "edit" && initialData?.id) {
      formData.append("id", initialData.id);
      formData.append(
        "oldKtpPath",
        normalizeStoredUploadPath(initialData.ktp_file_path),
      );
      if (isLandPermitContext) {
        formData.append(
          "oldProfilePhotoPath",
          normalizeStoredUploadPath(initialData.profile_photo_file_path),
        );
      }
    }

    formData.append("nomorIndukKependudukan", form.nomorIndukKependudukan);
    formData.append("namaLengkap", form.namaLengkap);
    formData.append("tempatLahir", form.tempatLahir);
    formData.append(
      "tanggalLahir",
      form.tanggalLahir ? moment(form.tanggalLahir).format("YYYY-MM-DD") : "",
    );
    formData.append("agama", form.agama);
    formData.append("pekerjaan", form.pekerjaan);
    formData.append("wargaNegara", form.wargaNegara);
    const normalizedPhone = normalizeIndonesianPhone(form.phone);
    if (normalizedPhone.error) {
      onNotify?.({
        open: true,
        message: normalizedPhone.error,
        severity: "error",
      });
      return;
    }

    formData.append("phone", normalizedPhone.value);
    formData.append("alamatJalan", form.alamatJalan);
    formData.append("rt", form.rt);
    formData.append("rw", form.rw);
    formData.append("provinsi", form.provinsi);
    formData.append("kabupaten", form.kabupaten);
    formData.append("kecamatan", form.kecamatan);
    formData.append("kelurahan", form.kelurahan);
    formData.append("status", form.status);
    formData.append("notes", form.status === "blacklisted" ? form.notes : "");

    if (isLandPermitContext) {
      formData.append("landPermitStatus", form.landPermitStatus);
      formData.append(
        "landPermitStatusNotes",
        form.landPermitStatus === "blacklisted" ? form.landPermitStatusNotes : "",
      );
    }

    if (form.ktpFile) {
      formData.append("ktpFile", form.ktpFile);
    }
    if (isLandPermitContext && form.profilePhotoFile) {
      formData.append("profilePhotoFile", form.profilePhotoFile);
    }

    onSubmit?.(formData);
  };

  return (
    <>
      <CrudFormModal
        open={open}
        title={mode === "edit" ? "Ubah Identitas" : "Tambah Identitas"}
        description={
          isLandPermitContext
            ? "Lengkapi identitas, alamat, status izin lahan, foto KTP, dan pas foto untuk kebutuhan izin lahan."
            : "Lengkapi data pribadi, alamat, status, dan foto KTP penyewa untuk kebutuhan transaksi sewa."
        }
        icon="qlementine-icons:id-card-16"
        submitLabel={mode === "edit" ? "Simpan Perubahan" : "Tambah Identitas"}
        loadingLabel={mode === "edit" ? "Menyimpan..." : "Menambahkan..."}
        loading={loading}
        onClose={onClose}
        onSubmit={handleSubmit}
      >
        <Grid container spacing={{ xs: 2.8, sm: 2.25 }}>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              label="Nama Lengkap *"
              value={form.namaLengkap}
              onChange={(event) =>
                updateField("namaLengkap", event.target.value)
              }
              disabled={loading}
              fullWidth
              inputProps={{ maxLength: 120 }}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              label="NIK *"
              value={form.nomorIndukKependudukan}
              onChange={(event) =>
                updateField(
                  "nomorIndukKependudukan",
                  toDigits(event.target.value, 16),
                )
              }
              disabled={loading}
              fullWidth
              inputProps={{ maxLength: 16 }}
              error={
                Boolean(form.nomorIndukKependudukan) &&
                form.nomorIndukKependudukan.length !== 16
              }
              InputProps={{
                endAdornment: form.nomorIndukKependudukan && (
                  <InputAdornment position="end">
                    {remainingNikDigits === 0 ? (
                      <Icon
                        icon="solar:check-circle-bold-duotone"
                        color={theme.palette.success.main}
                      />
                    ) : (
                      <Typography
                        sx={{
                          color: "error.main",
                          fontWeight: 800,
                          fontSize: 12,
                        }}
                      >
                        {remainingNikDigits}
                      </Typography>
                    )}
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              label="Tempat Lahir *"
              value={form.tempatLahir}
              onChange={(event) =>
                updateField("tempatLahir", event.target.value)
              }
              disabled={loading}
              fullWidth
              inputProps={{ maxLength: 80 }}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <DatePicker
              label="Tanggal Lahir *"
              value={form.tanggalLahir}
              onChange={(value) => updateField("tanggalLahir", value)}
              disabled={loading}
              slotProps={{ textField: { fullWidth: true, required: true } }}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              label="Agama *"
              value={form.agama}
              onChange={(event) => updateField("agama", event.target.value)}
              disabled={loading}
              fullWidth
              inputProps={{ maxLength: 40 }}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              label="Pekerjaan *"
              value={form.pekerjaan}
              onChange={(event) => updateField("pekerjaan", event.target.value)}
              disabled={loading}
              fullWidth
              inputProps={{ maxLength: 100 }}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <FormControl fullWidth required>
              <InputLabel id="identity-nationality-label">
                Kewarganegaraan
              </InputLabel>
              <Select
                labelId="identity-nationality-label"
                label="Kewarganegaraan"
                value={form.wargaNegara}
                onChange={(event) =>
                  updateField("wargaNegara", event.target.value)
                }
                disabled={loading}
              >
                <MenuItem value="WNI">WNI</MenuItem>
                <MenuItem value="WNA">WNA</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              label="Nomor HP *"
              placeholder=" 8213xxxxxx"
              value={form.phone}
              onChange={(event) =>
                updateField(
                  "phone",
                  normalizeIndonesianPhoneInput(event.target.value),
                )
              }
              disabled={loading}
              fullWidth
              error={Boolean(phoneValidation.error)}
              helperText={
                phoneValidation.error ||
                "Masukkan nomor tanpa 0, contoh: 8213xxxxx."
              }
              // Helpertext padding & margin = 0
              sx={{
                ".MuiFormHelperText-root": { padding: 0, margin: "5px 0 0 0" },
              }}
              inputProps={{
                maxLength: 13,
                inputMode: "numeric",
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Box
                      component="span"
                      sx={{
                        color: theme.palette.primary.disabled,
                        // bgcolor:
                        //   theme.palette.mode === "dark"
                        //     ? "rgba(255,152,0,0.13)"
                        //     : "rgba(230,9,9,0.08)",
                        // border: `1px solid ${theme.palette.primary.main}33`,
                        fontFamily: "Poppins",
                        fontWeight: 600,
                        fontSize: 13,
                        lineHeight: 1,
                      }}
                    >
                      +62
                    </Box>
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          <Grid size={12}>
            <Box
              sx={{
                p: { xs: 1.35, sm: 1.45 },
                borderRadius: 2.2,
                border: `1px solid ${theme.ui.dashboardCardBorder}`,
                bgcolor:
                  theme.palette.mode === "dark"
                    ? "rgba(255,255,255,0.035)"
                    : "rgba(17,24,39,0.025)",
                transition:
                  "border-color 0.18s ease, background-color 0.18s ease",
                "&:hover": {
                  borderColor:
                    theme.palette.mode === "dark"
                      ? "rgba(255,152,0,0.28)"
                      : "rgba(33,150,243,0.24)",
                  bgcolor:
                    theme.palette.mode === "dark"
                      ? "rgba(255,255,255,0.045)"
                      : "rgba(33,150,243,0.035)",
                },
              }}
            >
              <Stack
                direction={{ xs: "column", md: "row" }}
                alignItems={{ xs: "stretch", md: "center" }}
                justifyContent="space-between"
                spacing={{ xs: 1.6, md: 1.5 }}
              >
                <Stack
                  direction="row"
                  spacing={1.25}
                  alignItems="center"
                  sx={{ minWidth: 0 }}
                >
                  <Box
                    sx={{
                      width: { xs: 44, sm: 48 },
                      height: { xs: 44, sm: 48 },
                      borderRadius: 2,
                      display: "grid",
                      placeItems: "center",
                      flex: "0 0 auto",
                      color: theme.palette.primary.main,
                      bgcolor:
                        theme.palette.mode === "dark"
                          ? "rgba(255,152,0,0.13)"
                          : "rgba(230,9,9,0.09)",
                      border: `1px solid ${
                        theme.palette.mode === "dark"
                          ? "rgba(255,152,0,0.24)"
                          : "rgba(230,9,9,0.16)"
                      }`,
                    }}
                  >
                    <Icon icon="qlementine-icons:id-card-16" fontSize={22} />
                  </Box>

                  <Box sx={{ minWidth: 0 }}>
                    <Stack
                      direction="row"
                      alignItems="center"
                      spacing={0.8}
                      sx={{ flexWrap: "wrap", rowGap: 0.5 }}
                    >
                      <Typography sx={{ fontWeight: 850, fontSize: 13 }}>
                        Foto KTP
                      </Typography>
                      {form.ktpFilePath && (
                        <Box
                          component="span"
                          sx={{
                            px: 0.75,
                            py: 0.15,
                            borderRadius: 999,
                            fontSize: 10,
                            fontWeight: 850,
                            lineHeight: 1.4,
                            color: theme.palette.success.main,
                            bgcolor:
                              theme.palette.mode === "dark"
                                ? "rgba(76,175,80,0.14)"
                                : "rgba(76,175,80,0.10)",
                            border: `1px solid ${theme.palette.success.main}33`,
                          }}
                        >
                          Terpilih
                        </Box>
                      )}
                    </Stack>
                    <Typography
                      sx={{
                        color: theme.ui.mutedText,
                        fontWeight: 600,
                        fontSize: 11.5,
                        lineHeight: 1.45,
                      }}
                    >
                      {form.ktpFilePath
                        ? "Dokumen KTP sudah dipilih. JPG/PNG, maksimal 5MB."
                        : "JPG/PNG, maksimal 5MB."}
                    </Typography>
                  </Box>
                </Stack>

                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={1}
                  sx={{
                    width: { xs: "100%", md: "auto" },
                    "& .MuiButton-root": {
                      minHeight: 38,
                      borderRadius: 2,
                      fontWeight: 850,
                      textTransform: "none",
                      whiteSpace: "nowrap",
                    },
                  }}
                >
                  {form.ktpFilePath && (
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() =>
                        openImagePreview(ktpPreviewUrl, "Preview KTP")
                      }
                      startIcon={<Icon icon="solar:eye-bold-duotone" />}
                      title="Lihat KTP"
                      sx={{
                        ...getUploadActionButtonSx(),
                        color: theme.palette.text.primary,
                        borderColor: theme.ui.dashboardCardBorder,
                        bgcolor:
                          theme.palette.mode === "dark"
                            ? "rgba(255,255,255,0.08)"
                            : "rgba(17,24,39,0.055)",
                        "&:hover": {
                          borderColor: theme.ui.dashboardCardBorder,
                          bgcolor:
                            theme.palette.mode === "dark"
                              ? "rgba(255,255,255,0.12)"
                              : "rgba(17,24,39,0.08)",
                        },
                      }}
                    >
                      <Box component="span" sx={uploadActionTextSx}>
                        Lihat KTP
                      </Box>
                    </Button>
                  )}
                  <Button
                    size="small"
                    variant={form.ktpFilePath ? "outlined" : "contained"}
                    color="primary"
                    component="label"
                    disabled={loading}
                    startIcon={<Icon icon="solar:upload-bold-duotone" />}
                    title={form.ktpFilePath ? "Ganti KTP" : "Upload KTP"}
                    sx={{
                      ...getUploadActionButtonSx(),
                      ...(form.ktpFilePath && {
                        borderColor:
                          theme.palette.mode === "dark"
                            ? `${theme.palette.primary.main}99`
                            : `${theme.palette.info.main}99`,
                        color:
                          theme.palette.mode === "dark"
                            ? theme.palette.primary.main
                            : theme.palette.info.main,
                        bgcolor:
                          theme.palette.mode === "dark"
                            ? "rgba(255,152,0,0.12)"
                            : "rgba(33,150,243,0.08)",
                        "&:hover": {
                          bgcolor:
                            theme.palette.mode === "dark"
                              ? "rgba(255,152,0,0.20)"
                              : "rgba(33,150,243,0.14)",
                        },
                      }),
                    }}
                  >
                    <Box component="span" sx={uploadActionTextSx}>
                      {form.ktpFilePath ? "Ganti KTP" : "Upload KTP"}
                    </Box>
                    <input
                      type="file"
                      accept="image/jpeg,image/png"
                      hidden
                      onChange={handleKtpChange}
                    />
                  </Button>
                  {form.ktpFilePath && (
                    <Button
                      size="small"
                      disabled={loading}
                      color="error"
                      variant="contained"
                      onClick={clearKtpFile}
                      startIcon={
                        <Icon icon="solar:trash-bin-trash-bold-duotone" />
                      }
                      title="Hapus KTP"
                      sx={{
                        ...getUploadActionButtonSx(),
                        bgcolor: theme.palette.error.main,
                        boxShadow: "none",
                        "&:hover": {
                          bgcolor:
                            theme.palette.error.dark ||
                            theme.palette.error.main,
                          boxShadow: "none",
                        },
                      }}
                    >
                      <Box component="span" sx={uploadActionTextSx}>
                        Hapus
                      </Box>
                    </Button>
                  )}
                </Stack>
              </Stack>
            </Box>
          </Grid>

          {isLandPermitContext && (
            <Grid size={12}>
              <Box
                sx={{
                  p: { xs: 1.35, sm: 1.45 },
                  borderRadius: 2.2,
                  border: `1px solid ${theme.ui.dashboardCardBorder}`,
                  bgcolor:
                    theme.palette.mode === "dark"
                      ? "rgba(255,255,255,0.035)"
                      : "rgba(17,24,39,0.025)",
                }}
              >
                <Stack
                  direction={{ xs: "column", md: "row" }}
                  alignItems={{ xs: "stretch", md: "center" }}
                  justifyContent="space-between"
                  spacing={{ xs: 1.6, md: 1.5 }}
                >
                  <Stack direction="row" spacing={1.25} alignItems="center">
                    <Box
                      sx={{
                        width: { xs: 44, sm: 48 },
                        height: { xs: 44, sm: 48 },
                        borderRadius: 2,
                        display: "grid",
                        placeItems: "center",
                        flex: "0 0 auto",
                        color: theme.palette.primary.main,
                        bgcolor:
                          theme.palette.mode === "dark"
                            ? "rgba(255,152,0,0.13)"
                            : "rgba(230,9,9,0.09)",
                        border: `1px solid ${
                          theme.palette.mode === "dark"
                            ? "rgba(255,152,0,0.24)"
                            : "rgba(230,9,9,0.16)"
                        }`,
                      }}
                    >
                      <Icon icon="solar:user-id-bold-duotone" fontSize={22} />
                    </Box>

                    <Box sx={{ minWidth: 0 }}>
                      <Stack
                        direction="row"
                        alignItems="center"
                        spacing={0.8}
                        sx={{ flexWrap: "wrap", rowGap: 0.5 }}
                      >
                        <Typography sx={{ fontWeight: 850, fontSize: 13 }}>
                          Pas Foto Izin Lahan
                        </Typography>
                        {form.profilePhotoFilePath && (
                          <Box
                            component="span"
                            sx={{
                              px: 0.75,
                              py: 0.15,
                              borderRadius: 999,
                              fontSize: 10,
                              fontWeight: 850,
                              lineHeight: 1.4,
                              color: theme.palette.success.main,
                              bgcolor:
                                theme.palette.mode === "dark"
                                  ? "rgba(76,175,80,0.14)"
                                  : "rgba(76,175,80,0.10)",
                              border: `1px solid ${theme.palette.success.main}33`,
                            }}
                          >
                            Terpilih
                          </Box>
                        )}
                      </Stack>
                      <Typography
                        sx={{
                          color: theme.ui.mutedText,
                          fontWeight: 600,
                          fontSize: 11.5,
                          lineHeight: 1.45,
                        }}
                      >
                        Wajib untuk Admin Izin Lahan. JPG/PNG, maksimal 5MB.
                      </Typography>
                    </Box>
                  </Stack>

                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={1}
                    sx={{
                      width: { xs: "100%", md: "auto" },
                      "& .MuiButton-root": {
                        minHeight: 38,
                        borderRadius: 2,
                        fontWeight: 850,
                        textTransform: "none",
                        whiteSpace: "nowrap",
                      },
                    }}
                  >
                    {form.profilePhotoFilePath && (
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() =>
                          openImagePreview(
                            profilePhotoPreviewUrl,
                            "Preview pas foto izin lahan",
                          )
                        }
                        startIcon={<Icon icon="solar:eye-bold-duotone" />}
                        title="Lihat Foto"
                        sx={{
                          ...getUploadActionButtonSx(),
                          color: theme.palette.text.primary,
                          borderColor: theme.ui.dashboardCardBorder,
                          bgcolor:
                            theme.palette.mode === "dark"
                              ? "rgba(255,255,255,0.08)"
                            : "rgba(17,24,39,0.055)",
                        }}
                      >
                        <Box component="span" sx={uploadActionTextSx}>
                          Lihat Foto
                        </Box>
                      </Button>
                    )}
                    <Button
                      size="small"
                      variant={form.profilePhotoFilePath ? "outlined" : "contained"}
                      color="primary"
                      component="label"
                      disabled={loading}
                      startIcon={<Icon icon="solar:upload-bold-duotone" />}
                      title={
                        form.profilePhotoFilePath
                          ? "Ganti Foto"
                          : "Upload Pas Foto"
                      }
                      sx={{
                        ...getUploadActionButtonSx(),
                      }}
                    >
                      <Box component="span" sx={uploadActionTextSx}>
                        {form.profilePhotoFilePath ? "Ganti Foto" : "Upload Pas Foto"}
                      </Box>
                      <input
                        type="file"
                        accept="image/jpeg,image/png"
                        hidden
                        onChange={handleProfilePhotoChange}
                      />
                    </Button>
                    {form.profilePhotoFilePath && (
                      <Button
                        size="small"
                        disabled={loading}
                        color="error"
                        variant="contained"
                        onClick={clearProfilePhotoFile}
                        startIcon={
                          <Icon icon="solar:trash-bin-trash-bold-duotone" />
                        }
                        title="Hapus Foto"
                        sx={{
                          ...getUploadActionButtonSx(),
                          bgcolor: theme.palette.error.main,
                          boxShadow: "none",
                          "&:hover": {
                            bgcolor:
                              theme.palette.error.dark ||
                              theme.palette.error.main,
                            boxShadow: "none",
                          },
                        }}
                      >
                        <Box component="span" sx={uploadActionTextSx}>
                          Hapus
                        </Box>
                      </Button>
                    )}
                  </Stack>
                </Stack>
              </Box>
            </Grid>
          )}

          <Grid size={{ xs: 12, md: 6 }}>
            <Autocomplete
              options={provinces}
              getOptionLabel={(option) => option.nama || ""}
              value={
                provinces.find((item) => item.kode === provinceCode) || null
              }
              onChange={(_, value) => handleProvinceChange(value)}
              disabled={loading}
              isOptionEqualToValue={(option, value) =>
                option.kode === value.kode
              }
              renderInput={(params) => (
                <TextField {...params} label="Provinsi *" required />
              )}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Autocomplete
              options={cities}
              getOptionLabel={(option) => option.nama || ""}
              value={cities.find((item) => item.kode === cityCode) || null}
              onChange={(_, value) => handleCityChange(value)}
              disabled={loading || !provinceCode}
              isOptionEqualToValue={(option, value) =>
                option.kode === value.kode
              }
              renderInput={(params) => (
                <TextField {...params} label="Kabupaten/Kota *" required />
              )}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Autocomplete
              options={districts}
              getOptionLabel={(option) => option.nama || ""}
              value={
                districts.find((item) => item.kode === districtCode) || null
              }
              onChange={(_, value) => handleDistrictChange(value)}
              disabled={loading || !cityCode}
              isOptionEqualToValue={(option, value) =>
                option.kode === value.kode
              }
              renderInput={(params) => (
                <TextField {...params} label="Kecamatan *" required />
              )}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Autocomplete
              options={villages}
              getOptionLabel={(option) => option.nama || ""}
              value={villages.find((item) => item.kode === villageCode) || null}
              onChange={(_, value) => handleVillageChange(value)}
              disabled={loading || !districtCode}
              isOptionEqualToValue={(option, value) =>
                option.kode === value.kode
              }
              renderInput={(params) => (
                <TextField {...params} label="Kelurahan/Desa *" required />
              )}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              label="Nama Jalan / Alamat *"
              value={form.alamatJalan}
              onChange={(event) =>
                updateField("alamatJalan", event.target.value)
              }
              disabled={loading}
              fullWidth
              inputProps={{ maxLength: 180 }}
            />
          </Grid>

          <Grid size={{ xs: 6, md: 3 }}>
            <TextField
              label="RT *"
              value={form.rt}
              onChange={(event) =>
                updateField("rt", toDigits(event.target.value, 3))
              }
              disabled={loading}
              fullWidth
              inputProps={{ maxLength: 3 }}
            />
          </Grid>

          <Grid size={{ xs: 6, md: 3 }}>
            <TextField
              label="RW *"
              value={form.rw}
              onChange={(event) =>
                updateField("rw", toDigits(event.target.value, 3))
              }
              disabled={loading}
              fullWidth
              inputProps={{ maxLength: 3 }}
            />
          </Grid>

          <Grid size={12}>
            <FormControl fullWidth required>
              <InputLabel id="identity-status-label">
                {isLandPermitContext ? "Status Izin Lahan" : "Status"}
              </InputLabel>
              <Select
                labelId="identity-status-label"
                label={isLandPermitContext ? "Status Izin Lahan" : "Status"}
                value={
                  isLandPermitContext ? form.landPermitStatus : form.status
                }
                onChange={(event) => {
                  const nextStatus = event.target.value;
                  setForm((current) => {
                    if (isLandPermitContext) {
                      return {
                        ...current,
                        landPermitStatus: nextStatus,
                        landPermitStatusNotes:
                          nextStatus === "blacklisted"
                            ? current.landPermitStatusNotes
                            : "",
                      };
                    }

                    return {
                      ...current,
                      status: nextStatus,
                      notes: nextStatus === "blacklisted" ? current.notes : "",
                    };
                  });
                }}
                disabled={loading}
              >
                <MenuItem value="active">Aktif</MenuItem>
                <MenuItem value="inactive">Tidak Aktif</MenuItem>
                <MenuItem value="blacklisted">Blacklist</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {(isLandPermitContext
            ? form.landPermitStatus
            : form.status) === "blacklisted" && (
            <Grid size={12}>
              <TextField
                label={
                  isLandPermitContext
                    ? "Alasan Blacklist Izin Lahan *"
                    : "Alasan Blacklist *"
                }
                value={
                  isLandPermitContext
                    ? form.landPermitStatusNotes
                    : form.notes
                }
                onChange={(event) => {
                  const nextValue = event.target.value.slice(0, 150);
                  updateField(
                    isLandPermitContext
                      ? "landPermitStatusNotes"
                      : "notes",
                    nextValue,
                  );
                }}
                disabled={loading}
                fullWidth
                multiline
                minRows={3}
                inputProps={{ maxLength: 150 }}
                helperText={`${
                  isLandPermitContext
                    ? form.landPermitStatusNotes.length
                    : form.notes.length
                }/150 karakter`}
              />
            </Grid>
          )}
        </Grid>
      </CrudFormModal>

      <ImagePreviewModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        imageUrl={previewImage.url}
        alt={previewImage.alt}
      />
    </>
  );
}
