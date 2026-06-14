"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  alpha,
  Box,
  Button,
  Chip,
  Divider,
  Grid,
  Paper,
  Skeleton,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import { Icon } from "@iconify/react";
import axios from "axios";
import Notification from "@/app/components/Notification";
import LoadingBackdrop from "@/app/components/loading/Backdrop";
import PageHeader from "@/app/components/page-header/PageHeader";
import SummaryStatCard from "@/app/components/stats/SummaryStatCard";
import { updateUserCookie } from "@/app/utils/updateUserCookie";
import { useUser } from "@/app/utils/useUser";
import AccountProfileModal from "./AccountProfileModal";
import AccountPasswordModal from "./AccountPasswordModal";
import {
  displayValue,
  formatAccountDate,
  getInitialSnackbar,
  normalizeProfilePayload,
  validatePasswordPayload,
} from "./accountUtils";

const accountFields = [
  {
    label: "Nama Lengkap",
    key: "full_name",
    icon: "solar:user-bold-duotone",
  },
  {
    label: "Username",
    key: "username",
    icon: "solar:mention-circle-bold-duotone",
  },
  {
    label: "Email",
    key: "email",
    icon: "solar:letter-bold-duotone",
  },
  {
    label: "Nomor HP",
    key: "phone",
    icon: "solar:phone-bold-duotone",
  },
  {
    label: "Peran",
    key: "role_name",
    icon: "solar:shield-user-bold-duotone",
  },
  {
    label: "Diperbarui",
    key: "updated_at",
    icon: "solar:calendar-mark-bold-duotone",
    formatter: formatAccountDate,
  },
];

/**
 * Halaman pengaturan akun pribadi.
 * Page ini hanya mengatur fetch, state modal, dan sinkronisasi cookie user;
 * form profil serta form password dipisah agar lebih mudah dirawat.
 */
export default function Account() {
  const theme = useTheme();
  const { user, setUser } = useUser();
  const [account, setAccount] = useState({});
  const [loading, setLoading] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [snackbar, setSnackbar] = useState(getInitialSnackbar);

  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const fetchAccount = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get("/api/account/get-current-user-data");
      if (response.data?.success) {
        setAccount(response.data.data || {});
        return response.data.data || {};
      }

      showSnackbar(
        response.data?.message || "Gagal mengambil data akun.",
        "error",
      );
      setAccount({});
      return {};
    } catch (error) {
      showSnackbar(
        error?.response?.data?.message ||
          "Terjadi error saat mengambil data akun.",
        "error",
      );
      setAccount({});
      return {};
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.id) fetchAccount();
  }, [fetchAccount, user?.id]);

  const accountStats = useMemo(
    () => [
      {
        label: "Status Akun",
        value: "Aktif",
        icon: "solar:verified-check-bold-duotone",
        color: theme.palette.success.main,
      },
      {
        label: "Peran Pengguna",
        value: displayValue(account?.role_name),
        icon: "solar:shield-user-bold-duotone",
        color: theme.palette.primary.main,
      },
      {
        label: "Update Terakhir",
        value: formatAccountDate(account?.updated_at),
        icon: "solar:calendar-date-bold-duotone",
        color: theme.palette.info.main,
      },
    ],
    [account, theme],
  );

  const handleUpdateProfile = async (form) => {
    const normalized = normalizeProfilePayload(form);
    if (normalized.error) {
      showSnackbar(normalized.error, "error");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.put(
        `/api/account/update-user/${account.id}`,
        normalized.values,
      );

      if (!response.data?.success) {
        showSnackbar(
          response.data?.message || "Gagal mengubah informasi akun.",
          "error",
        );
        return;
      }

      const updatedAccount = response.data.data || {};
      setAccount(updatedAccount);

      const updatedUser = updateUserCookie({
        full_name: updatedAccount.full_name,
        username: updatedAccount.username,
        email: updatedAccount.email,
        phone: updatedAccount.phone,
      });

      if (updatedUser) setUser(updatedUser);

      setProfileOpen(false);
      showSnackbar(
        response.data.message || "Informasi akun berhasil diperbarui.",
      );
      await fetchAccount();
    } catch (error) {
      showSnackbar(
        error?.response?.data?.message ||
          "Terjadi error saat mengubah informasi akun.",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (form, resetForm) => {
    const normalized = validatePasswordPayload(form);
    if (normalized.error) {
      showSnackbar(normalized.error, "error");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.put(
        `/api/account/update-password/${account.id}`,
        normalized.values,
      );

      if (!response.data?.success) {
        showSnackbar(
          response.data?.message || "Gagal mengubah password.",
          "error",
        );
        return;
      }

      resetForm?.();
      setPasswordOpen(false);
      showSnackbar(response.data.message || "Password berhasil diperbarui.");
    } catch (error) {
      showSnackbar(
        error?.response?.data?.message ||
          "Terjadi error saat mengubah password.",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        width: "100%",
        minHeight: "100%",
        p: { xs: 1.5, sm: 2.25, lg: 3 },
      }}
    >
      <Stack spacing={{ xs: 2, sm: 2.25 }}>
        <PageHeader
          title="Akun"
          description="Kelola informasi profil dan keamanan password akun yang sedang digunakan."
          icon="solar:user-id-bold-duotone"
          breadcrumbs={[
            {
              label: "Pengaturan",
              icon: "solar:settings-bold-duotone",
            },
            {
              label: "Akun",
              icon: "solar:user-id-bold-duotone",
            },
          ]}
          action={
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1.25}
              sx={{ width: { xs: "100%", sm: "auto" } }}
            >
              <Button
                variant="contained"
                onClick={() => setPasswordOpen(true)}
                disabled={loading || !account?.id}
                startIcon={<Icon icon="solar:lock-password-bold-duotone" />}
                sx={{
                  borderRadius: 2,
                  fontWeight: 600,
                  fontSize: 12,
                  textTransform: "none",
                  width: { xs: "100%", sm: "auto" },
                  bgcolor:
                    theme.palette.mode === "dark"
                      ? "rgba(255,255,255,0.10)"
                      : "rgba(17,24,39,0.08)",
                  color: "text.primary",
                  border: `1px solid ${theme.ui.dashboardCardBorder}`,
                  boxShadow: "none",
                  "&:hover": {
                    bgcolor:
                      theme.palette.mode === "dark"
                        ? "rgba(255,255,255,0.16)"
                        : "rgba(17,24,39,0.13)",
                    boxShadow: "none",
                  },
                }}
              >
                Ubah Password
              </Button>
              <Button
                variant="contained"
                onClick={() => setProfileOpen(true)}
                disabled={loading || !account?.id}
                startIcon={<Icon icon="solar:pen-new-square-bold-duotone" />}
                sx={{
                  borderRadius: 2,
                  fontWeight: 600,
                  fontSize: 12,
                  textTransform: "none",
                  width: { xs: "100%", sm: "auto" },
                }}
              >
                Ubah Informasi
              </Button>
            </Stack>
          }
          actionSx={{ width: { xs: "100%", sm: "auto" } }}
        />

        {/* <Grid container spacing={{ xs: 1.5, sm: 1.75 }}>
          {accountStats.map((item) => (
            <Grid size={{ xs: 12, md: 4 }} key={item.label}>
              <SummaryStatCard
                {...item}
                valueSx={{ fontSize: { xs: 21, sm: 24 } }}
              />
            </Grid>
          ))}
        </Grid> */}

        <Paper
          elevation={0}
          sx={{
            p: { xs: 2, sm: 2.5 },
            borderRadius: 3,
            border: `1px solid ${theme.ui.dashboardCardBorder}`,
            bgcolor: theme.ui.dashboardCardBg,
            boxShadow: theme.ui.dashboardCardShadow,
          }}
        >
          <Stack
            direction={{ xs: "column", md: "row" }}
            alignItems={{ xs: "flex-start", md: "center" }}
            justifyContent="space-between"
            spacing={2}
            sx={{ mb: 2 }}
          >
            <Box>
              <Typography
                sx={{
                  fontFamily: "Poppins",
                  fontWeight: 700,
                  fontSize: { xs: 18, sm: 20 },
                }}
              >
                Informasi Akun
              </Typography>
              <Typography
                sx={{
                  color: theme.ui.mutedText,
                  fontFamily: "Poppins",
                  fontWeight: 600,
                  fontSize: 12,
                  lineHeight: 1.7,
                  mt: 0.25,
                }}
              >
                Data dasar akun yang tampil di sistem dan top menu aplikasi.
              </Typography>
            </Box>

            <Chip
              label={displayValue(account?.role_name)}
              sx={{
                color: theme.palette.primary.main,
                bgcolor: alpha(theme.palette.primary.main, 0.12),
                border: `1px solid ${alpha(theme.palette.primary.main, 0.26)}`,
                fontFamily: "Poppins",
                fontWeight: 600,
                fontSize: 12,
              }}
            />
          </Stack>

          <Divider sx={{ borderColor: theme.palette.primary.main, mb: 2.25 }} />

          <Grid container spacing={{ xs: 1.5, sm: 1.75 }}>
            {accountFields.map((field) => {
              const rawValue = account?.[field.key];
              const value = field.formatter
                ? field.formatter(rawValue)
                : displayValue(rawValue);

              return (
                <Grid size={{ xs: 12, md: 6 }} key={field.key}>
                  <Box
                    sx={{
                      p: { xs: 1.45, sm: 1.65 },
                      minHeight: 78,
                      borderRadius: 2.5,
                      border: `1px solid ${theme.ui.dashboardCardBorder}`,
                      bgcolor:
                        theme.palette.mode === "dark"
                          ? "rgba(255,255,255,0.035)"
                          : "rgba(17,24,39,0.025)",
                      display: "flex",
                      gap: 1.25,
                      alignItems: "center",
                    }}
                  >
                    <Box
                      sx={{
                        width: 38,
                        height: 38,
                        flex: "0 0 auto",
                        borderRadius: 2,
                        display: "grid",
                        placeItems: "center",
                        color: theme.palette.primary.main,
                        bgcolor: alpha(theme.palette.primary.main, 0.13),
                      }}
                    >
                      <Icon icon={field.icon} fontSize={21} />
                    </Box>

                    <Box sx={{ minWidth: 0 }}>
                      <Typography
                        sx={{
                          color: theme.ui.mutedText,
                          fontFamily: "Poppins",
                          fontWeight: 700,
                          fontSize: 12,
                          lineHeight: 1.4,
                          fontSize: 12,
                        }}
                      >
                        {field.label}
                      </Typography>
                      {loading ? (
                        <Skeleton width={180} height={22} />
                      ) : (
                        <Typography
                          sx={{
                            fontFamily: "Poppins",
                            fontWeight: 700,
                            fontSize: { xs: 14, sm: 15 },
                            lineHeight: 1.45,
                            wordBreak: "break-word",
                            fontSize: 12,
                          }}
                        >
                          {value}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </Grid>
              );
            })}
          </Grid>
        </Paper>
      </Stack>

      <AccountProfileModal
        open={profileOpen}
        loading={loading}
        data={account}
        onClose={() => setProfileOpen(false)}
        onSubmit={handleUpdateProfile}
      />

      <AccountPasswordModal
        open={passwordOpen}
        loading={loading}
        onClose={() => setPasswordOpen(false)}
        onSubmit={handleUpdatePassword}
      />

      <LoadingBackdrop
        open={loading && !profileOpen && !passwordOpen}
        message="Memuat data akun..."
      />
      <Notification
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={() => setSnackbar((current) => ({ ...current, open: false }))}
      />
    </Box>
  );
}
