"use client";

import React, { useState } from "react";
import {
  Grid,
  IconButton,
  InputAdornment,
  TextField,
  useTheme,
} from "@mui/material";
import { Icon } from "@iconify/react";
import CrudFormModal from "@/app/components/crud/CrudFormModal";
import { initialPasswordForm } from "./accountUtils";

const passwordFields = [
  { key: "oldPassword", label: "Password Lama" },
  { key: "newPassword", label: "Password Baru" },
  { key: "confirmNewPassword", label: "Konfirmasi Password Baru" },
];

/**
 * Modal pembaruan password akun.
 * Validasi utama tetap dilakukan API, tetapi field tetap dipisah agar UX lebih
 * jelas dan tidak memakai modal lama yang styling-nya berbeda dari halaman lain.
 */
export default function AccountPasswordModal({
  open,
  loading,
  onClose,
  onSubmit,
}) {
  const theme = useTheme();
  const [form, setForm] = useState(initialPasswordForm);
  const [visibleFields, setVisibleFields] = useState({});

  const updateField = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const resetAndClose = () => {
    setForm(initialPasswordForm);
    setVisibleFields({});
    onClose?.();
  };

  return (
    <CrudFormModal
      open={open}
      title="Ubah Password"
      description="Gunakan password lama untuk mengonfirmasi perubahan password akun Anda."
      icon="solar:lock-password-bold-duotone"
      submitLabel="Simpan Password"
      loadingLabel="Menyimpan password..."
      loading={loading}
      width={560}
      onClose={resetAndClose}
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit?.(form, () => setForm(initialPasswordForm));
      }}
    >
      <Grid container spacing={{ xs: 2.8, sm: 2.25 }}>
        {passwordFields.map((field) => {
          const isVisible = Boolean(visibleFields[field.key]);

          return (
            <Grid size={12} key={field.key}>
              <TextField
                label={`${field.label} *`}
                value={form[field.key]}
                type={isVisible ? "text" : "password"}
                onChange={(event) => updateField(field.key, event.target.value)}
                disabled={loading}
                fullWidth
                inputProps={{ maxLength: 255 }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label={`toggle ${field.label}`}
                        edge="end"
                        disabled={loading}
                        onClick={() =>
                          setVisibleFields((current) => ({
                            ...current,
                            [field.key]: !current[field.key],
                          }))
                        }
                      >
                        <Icon
                          icon={
                            isVisible
                              ? "solar:eye-bold-duotone"
                              : "solar:eye-closed-bold-duotone"
                          }
                          color={theme.palette.primary.main}
                          fontSize={22}
                        />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
          );
        })}
      </Grid>
    </CrudFormModal>
  );
}
