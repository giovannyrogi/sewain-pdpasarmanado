"use client";

import React, { useEffect, useState } from "react";
import {
  Grid,
  InputAdornment,
  TextField,
  Typography,
  Box,
  useTheme,
} from "@mui/material";
import CrudFormModal from "@/app/components/crud/CrudFormModal";
import {
  normalizeIndonesianPhoneInput,
  validateIndonesianPhoneLocal,
} from "@/app/utils/phoneNumber";
import { initialProfileForm, mapUserToProfileForm } from "./accountUtils";

/**
 * Modal pembaruan profil akun.
 * Nomor HP disimpan ke database dalam format +628xxx, sedangkan user cukup
 * mengisi angka lokal 8xxx karena prefix +62 sudah ditampilkan di field.
 */
export default function AccountProfileModal({
  open,
  loading,
  data,
  onClose,
  onSubmit,
}) {
  const theme = useTheme();
  const [form, setForm] = useState(initialProfileForm);
  const phoneValidation = form.phone
    ? validateIndonesianPhoneLocal(form.phone)
    : { error: null };

  useEffect(() => {
    if (!open) return;
    setForm(mapUserToProfileForm(data));
  }, [data, open]);

  const updateField = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  return (
    <CrudFormModal
      open={open}
      title="Ubah Informasi Akun"
      description="Perbarui nama, username, email, dan nomor HP yang dipakai untuk identitas akun."
      icon="solar:user-id-bold-duotone"
      submitLabel="Simpan Perubahan"
      loadingLabel="Menyimpan perubahan..."
      loading={loading}
      width={720}
      onClose={onClose}
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit?.(form);
      }}
    >
      <Grid container spacing={{ xs: 2.8, sm: 2.25 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            label="Nama Lengkap *"
            value={form.fullName}
            onChange={(event) => updateField("fullName", event.target.value)}
            disabled={loading}
            fullWidth
            inputProps={{ maxLength: 100 }}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            label="Username *"
            value={form.username}
            onChange={(event) =>
              updateField("username", event.target.value.replace(/\s/g, ""))
            }
            disabled={loading}
            fullWidth
            inputProps={{ maxLength: 100 }}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            label="Email *"
            value={form.email}
            onChange={(event) => updateField("email", event.target.value)}
            disabled={loading}
            fullWidth
            inputProps={{ maxLength: 100 }}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            label="Nomor HP *"
            placeholder="8213xxxxxx"
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
            inputProps={{ maxLength: 13, inputMode: "numeric" }}
            sx={{
              ".MuiFormHelperText-root": { m: "5px 0 0" },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Box
                    component="span"
                    sx={{
                      color: theme.palette.primary.main,
                      fontFamily: "Poppins",
                      fontWeight: 700,
                      fontSize: 13,
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
          <Typography
            sx={{
              color: theme.ui.mutedText,
              fontFamily: "Poppins",
              fontWeight: 600,
              fontSize: 12,
              lineHeight: 1.7,
            }}
          >
            Nomor HP akan tersimpan sebagai format internasional, misalnya
            +628123456789, agar siap dipakai untuk integrasi WhatsApp.
          </Typography>
        </Grid>
      </Grid>
    </CrudFormModal>
  );
}
