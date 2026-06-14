"use client";

import React from "react";
import {
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import { Icon } from "@iconify/react";
import CrudFormModal from "@/app/components/crud/CrudFormModal";
import {
  MAX_EMAIL_LENGTH,
  MAX_FULL_NAME_LENGTH,
  MAX_PASSWORD_LENGTH,
  MAX_USERNAME_LENGTH,
  MIN_PASSWORD_LENGTH,
} from "./userUtils";

/**
 * Form create/edit pengguna.
 * Password pada mode edit bersifat opsional agar admin dapat mengubah data
 * profil tanpa perlu mengetahui atau mengisi ulang password lama.
 */
export default function UserFormModal({
  open,
  mode,
  form,
  errors,
  roles,
  loading,
  showPassword,
  onTogglePassword,
  onChange,
  onClose,
  onSubmit,
}) {
  const isEditMode = mode === "edit";

  return (
    <CrudFormModal
      open={open}
      title={isEditMode ? "Ubah Pengguna" : "Tambah Pengguna"}
      description={
        isEditMode
          ? "Perbarui profil pengguna, peran akses, atau isi password baru jika ingin mengganti password."
          : "Lengkapi akun pengguna baru beserta peran akses yang akan digunakan di aplikasi."
      }
      icon="solar:users-group-rounded-bold-duotone"
      submitLabel={isEditMode ? "Simpan Perubahan" : "Tambah Pengguna"}
      loadingLabel={
        isEditMode ? "Menyimpan perubahan..." : "Menambah pengguna..."
      }
      loading={loading}
      width={760}
      onClose={onClose}
      onSubmit={onSubmit}
    >
      <Grid container spacing={{ xs: 2.25, sm: 2 }}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            label="Nama Lengkap *"
            value={form.fullName}
            onChange={onChange("fullName")}
            error={Boolean(errors.fullName)}
            helperText={errors.fullName}
            autoFocus
            disabled={loading}
            inputProps={{ maxLength: MAX_FULL_NAME_LENGTH }}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            label="Email *"
            value={form.email}
            onChange={onChange("email")}
            error={Boolean(errors.email)}
            helperText={errors.email}
            sx={{
              "& .MuiFormHelperText-root": {
                m: "5px 0 0 0",
                p: 0,
              },
            }}
            disabled={loading}
            inputProps={{ maxLength: MAX_EMAIL_LENGTH }}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            label="Username *"
            value={form.username}
            onChange={onChange("username")}
            error={Boolean(errors.username)}
            helperText={errors.username || "Tanpa spasi, dipakai untuk login."}
            disabled={loading}
            inputProps={{ maxLength: MAX_USERNAME_LENGTH }}
            // helpertext padding dan margin 0
            sx={{
              "& .MuiFormHelperText-root": {
                m: "5px 0 0 0",
                p: 0,
              },
            }}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            label={isEditMode ? "Password Baru" : "Password *"}
            type={showPassword ? "text" : "password"}
            value={form.password}
            onChange={onChange("password")}
            error={Boolean(errors.password)}
            helperText={
              errors.password ||
              (isEditMode
                ? "Kosongkan jika password tidak diubah."
                : `Minimal ${MIN_PASSWORD_LENGTH} karakter.`)
            }
            sx={{
              "& .MuiFormHelperText-root": {
                m: "5px 0 0 0",
                p: 0,
              },
            }}
            disabled={loading}
            inputProps={{ maxLength: MAX_PASSWORD_LENGTH }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="Tampilkan atau sembunyikan password"
                    edge="end"
                    onClick={onTogglePassword}
                    disabled={loading}
                  >
                    <Icon
                      icon={
                        showPassword
                          ? "solar:eye-bold-duotone"
                          : "solar:eye-closed-bold"
                      }
                      fontSize={21}
                    />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </Grid>

        <Grid size={12}>
          <FormControl
            fullWidth
            error={Boolean(errors.roleId)}
            disabled={loading}
          >
            <InputLabel id="user-role-label">Peran *</InputLabel>
            <Select
              labelId="user-role-label"
              label="Peran *"
              value={form.roleId}
              onChange={onChange("roleId")}
            >
              {roles.map((role) => (
                <MenuItem key={role.id} value={role.id}>
                  {role.role_name}
                </MenuItem>
              ))}
            </Select>
            {errors.roleId && (
              <Typography
                sx={{
                  mt: 0.5,
                  ml: 1.75,
                  fontFamily: "Poppins",
                  fontWeight: 600,
                  fontSize: 12,
                  color: "error.main",
                }}
              >
                {errors.roleId}
              </Typography>
            )}
          </FormControl>
        </Grid>
      </Grid>
    </CrudFormModal>
  );
}
