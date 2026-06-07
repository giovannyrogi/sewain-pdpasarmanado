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
import axios from "axios";
import CrudFormModal from "@/app/components/crud/CrudFormModal";
import LoadingBackdrop from "@/app/components/loading/Backdrop";
import formatRupiah from "@/app/components/formatrupiah/page";
import { formatNumber } from "@/app/utils/formatNumber";
import { calculateRoomRent } from "@/app/utils/calculateRoomRent";

const emptyForm = {
  location_id: "",
  floor_id: "",
  room_number: "",
  price_type: "harga_per_meter",
  room_length: "",
  room_width: "",
  room_area: "",
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

const normalizeDimensionPayload = (value) => {
  const parsedValue = parseDimensionNumber(value);
  return Number(parsedValue.toFixed(2));
};

const statusOptions = [
  { value: "available", label: "Tersedia" },
  { value: "occupied", label: "Sudah Terisi" },
  { value: "maintenance", label: "Dalam Perbaikan" },
  { value: "unavailable", label: "Tidak Layak" },
];

/**
 * Form create/update ruangan.
 * Komponen ini fokus pada input dan kalkulasi luas; parent tetap mengontrol
 * request API supaya logic jaringan konsisten dengan halaman master data lain.
 */
export default function RoomFormModal({
  open,
  mode = "create",
  initialData,
  locations = [],
  loading,
  onClose,
  onSubmit,
  onNotify,
}) {
  const theme = useTheme();
  const [form, setForm] = useState(emptyForm);
  const [floors, setFloors] = useState([]);
  const [floorLoading, setFloorLoading] = useState(false);

  const selectedLocation = useMemo(
    () => locations.find((item) => item.id === form.location_id) || null,
    [form.location_id, locations],
  );

  const selectedFloor = useMemo(
    () => floors.find((item) => item.floor_id === form.floor_id) || null,
    [floors, form.floor_id],
  );

  const numericRoomLength = useMemo(
    () => parseDimensionNumber(form.room_length),
    [form.room_length],
  );

  const numericRoomWidth = useMemo(
    () => parseDimensionNumber(form.room_width),
    [form.room_width],
  );

  const numericRoomArea = useMemo(
    () => parseDimensionNumber(form.room_area),
    [form.room_area],
  );

  const numericRoomPrice = useMemo(
    () => Number(form.price_per_m2 || 0),
    [form.price_per_m2],
  );

  const estimatedTotal = useMemo(() => {
    return calculateRoomRent({
      price_type: form.price_type,
      room_length: numericRoomLength,
      room_width: numericRoomWidth,
      price_per_m2: numericRoomPrice,
    });
  }, [form.price_type, numericRoomLength, numericRoomWidth, numericRoomPrice]);

  const loadFloors = async (locationId, selectedFloorId = "") => {
    if (!locationId) {
      setFloors([]);
      return;
    }

    setFloorLoading(true);
    try {
      const response = await axios.get(
        `/api/location-floor-price/floor-by-location-id?location_id=${locationId}`,
      );

      if (response.data?.success) {
        setFloors(response.data.data || []);
        return;
      }

      onNotify?.({
        open: true,
        message: response.data?.message || "Gagal mengambil data lantai.",
        severity: "error",
      });
      setFloors([]);
    } catch (error) {
      onNotify?.({
        open: true,
        message:
          error?.response?.data?.message ||
          "Terjadi error saat mengambil data lantai.",
        severity: "error",
      });
      setFloors([]);
    } finally {
      setFloorLoading(false);
    }
  };

  useEffect(() => {
    if (!open) return;

    if (!initialData) {
      setForm(emptyForm);
      setFloors([]);
      return;
    }

    const nextForm = {
      location_id: initialData.location_id || "",
      floor_id: initialData.floor_id || "",
      room_number: initialData.room_number || "",
      price_type: initialData.price_type || "harga_per_meter",
      room_length: formatDimensionValue(initialData.room_length ?? ""),
      room_width: formatDimensionValue(initialData.room_width ?? ""),
      room_area: formatDimensionValue(initialData.room_area ?? ""),
      price_per_m2: initialData.price_per_m2 || "",
      status: initialData.status || "available",
      notes: initialData.notes || "",
    };

    setForm(nextForm);
    loadFloors(nextForm.location_id, nextForm.floor_id);
  }, [initialData, open]);

  useEffect(() => {
    if (form.price_type !== "harga_per_meter") return;

    const length = parseDimensionNumber(form.room_length);
    const width = parseDimensionNumber(form.room_width);
    const area = length * width;

    setForm((current) => ({
      ...current,
      room_area: area > 0 ? formatDimensionValue(area) : "",
    }));
  }, [form.price_type, form.room_length, form.room_width]);

  const updateField = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleLocationChange = (location) => {
    const locationId = location?.id || "";
    setForm((current) => ({
      ...current,
      location_id: locationId,
      floor_id: "",
    }));
    loadFloors(locationId);
  };

  const handlePriceTypeChange = (value) => {
    const shouldRestoreInitialDimensions =
      mode === "edit" && value === initialData?.price_type;

    setForm((current) => ({
      ...current,
      price_type: value,
      room_length: shouldRestoreInitialDimensions
        ? formatDimensionValue(initialData?.room_length ?? "")
        : value === "harga_per_meter"
          ? current.room_length
          : "",
      room_width: shouldRestoreInitialDimensions
        ? formatDimensionValue(initialData?.room_width ?? "")
        : value === "harga_per_meter"
          ? current.room_width
          : "",
      room_area: shouldRestoreInitialDimensions
        ? formatDimensionValue(initialData?.room_area ?? "")
        : "",
    }));
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
      floor_id: form.floor_id,
      room_number: form.room_number,
      price_type: form.price_type,
      room_length:
        form.price_type === "harga_per_meter"
          ? normalizeDimensionPayload(form.room_length)
          : 0,
      room_width:
        form.price_type === "harga_per_meter"
          ? normalizeDimensionPayload(form.room_width)
          : 0,
      room_area: normalizeDimensionPayload(form.room_area),
      price_per_m2: form.price_per_m2,
      status: form.status,
      notes: form.notes || null,
    });
  };

  return (
    <CrudFormModal
      open={open}
      title={mode === "edit" ? "Ubah Ruangan" : "Tambah Ruangan"}
      description="Kelola lokasi, lantai, nomor ruangan, dimensi, harga sewa, status, dan catatan operasional ruangan."
      icon="solar:home-angle-bold-duotone"
      submitLabel={mode === "edit" ? "Simpan Perubahan" : "Tambah Ruangan"}
      loadingLabel={mode === "edit" ? "Menyimpan..." : "Menambahkan..."}
      loading={loading}
      onClose={onClose}
      onSubmit={handleSubmit}
    >
      <Grid container spacing={{ xs: 2.8, sm: 2.25 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Autocomplete
            options={locations || []}
            getOptionLabel={(option) => option.location_name || ""}
            value={selectedLocation}
            onChange={(_, value) => handleLocationChange(value)}
            disabled={loading}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            renderInput={(params) => (
              <TextField {...params} label="Lokasi *" required />
            )}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Autocomplete
            options={floors || []}
            getOptionLabel={(option) => option.floor || ""}
            value={selectedFloor}
            onChange={(_, value) =>
              updateField("floor_id", value?.floor_id || "")
            }
            disabled={loading || floorLoading || !form.location_id}
            loading={floorLoading}
            isOptionEqualToValue={(option, value) =>
              option.floor_id === value.floor_id
            }
            renderInput={(params) => (
              <TextField {...params} label="Lantai *" required />
            )}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            label="Nomor Ruangan *"
            value={form.room_number}
            onChange={(event) => updateField("room_number", event.target.value)}
            disabled={loading}
            fullWidth
            inputProps={{ maxLength: 50 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Typography
                    sx={{
                      color: theme.ui.mutedText,
                      fontWeight: 500,
                      fontSize: 14,
                    }}
                  >
                    No.
                  </Typography>
                </InputAdornment>
              ),
            }}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <FormControl fullWidth required>
            <InputLabel id="room-price-type-label">Jenis Harga</InputLabel>
            <Select
              labelId="room-price-type-label"
              label="Jenis Harga"
              value={form.price_type}
              onChange={(event) => handlePriceTypeChange(event.target.value)}
              disabled={loading}
            >
              <MenuItem value="harga_per_meter">Harga Per m²</MenuItem>
              <MenuItem value="harga_tetap">Harga Tetap</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        {form.price_type === "harga_per_meter" && (
          <>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Panjang (m) *"
                value={form.room_length}
                onChange={(event) =>
                  updateField("room_length", toDimensionInput(event.target.value))
                }
                disabled={loading}
                fullWidth
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Lebar (m) *"
                value={form.room_width}
                onChange={(event) =>
                  updateField("room_width", toDimensionInput(event.target.value))
                }
                disabled={loading}
                fullWidth
              />
            </Grid>
          </>
        )}

        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            label="Luas (m²) *"
            value={form.room_area}
            onChange={(event) =>
              updateField("room_area", toDimensionInput(event.target.value))
            }
            disabled={loading || form.price_type === "harga_per_meter"}
            fullWidth
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            label={
              form.price_type === "harga_per_meter"
                ? "Harga Per m² (Rp) *"
                : "Harga Tetap (Rp) *"
            }
            value={form.price_per_m2 ? formatRupiah(form.price_per_m2) : ""}
            onChange={(event) =>
              updateField("price_per_m2", toMoneyDigits(event.target.value))
            }
            disabled={loading}
            fullWidth
          />
        </Grid>

        <Grid size={12}>
          <FormControl fullWidth required>
            <InputLabel id="room-status-label">Status Ruangan</InputLabel>
            <Select
              labelId="room-status-label"
              label="Status Ruangan"
              value={form.status}
              onChange={(event) => handleStatusChange(event.target.value)}
              disabled={loading}
            >
              {statusOptions.map((item) => (
                <MenuItem key={item.value} value={item.value}>
                  {item.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {["maintenance", "unavailable"].includes(form.status) && (
          <Grid size={12}>
            <TextField
              label="Catatan Status *"
              placeholder="Tuliskan alasan ruangan belum dapat digunakan..."
              value={form.notes}
              onChange={(event) =>
                updateField("notes", event.target.value.slice(0, 150))
              }
              disabled={loading}
              fullWidth
              multiline
              minRows={3}
              inputProps={{ maxLength: 150 }}
              helperText={`${form.notes.length}/150 karakter`}
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
                  Perhitungan Sewa Ruangan
                </Typography>
                <Typography
                  sx={{
                    color: theme.ui.mutedText,
                    fontWeight: 650,
                    fontSize: 12,
                  }}
                >
                  {form.price_type === "harga_per_meter"
                    ? `${formatNumber(numericRoomArea)} m² x ${formatRupiah(numericRoomPrice)} = ${formatRupiah(
                        estimatedTotal,
                      )}`
                    : `Harga tetap ${formatRupiah(form.price_per_m2)}`}
                </Typography>
              </Box>
            </Stack>
          </Box>
        </Grid>
      </Grid>
      <LoadingBackdrop open={floorLoading} message="Mengambil data lantai..." />
    </CrudFormModal>
  );
}
