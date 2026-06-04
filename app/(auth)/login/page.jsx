"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Button,
  CircularProgress,
  IconButton,
  InputAdornment,
  Paper,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { Icon } from "@iconify/react";
import axios from "axios";
import Image from "next/image";
import { useThemeMode } from "@/app/components/themeprovider/ThemeContext";
import Notification from "@/app/components/Notification";
import LoadingBackdrop from "@/app/components/loading/Backdrop";

export default function LoginPage() {
  const isMobile = useMediaQuery("(max-width:600px)");
  const router = useRouter();
  const { themeMode, setThemeMode } = useThemeMode();
  const theme = useTheme();
  const isDark = themeMode === "dark";
  const ui = theme.ui;
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [redirecting] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const handleLogin = async () => {
    setLoading(true);
    try {
      await axios.post("/api/login", { username, password });
      setSnackbar({
        open: true,
        message: "Login berhasil!",
        severity: "success",
      });

      setTimeout(() => {
        router.push("/dashboard");
      }, 800);
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.response?.data?.message || "Login gagal!",
        severity: "error",
      });
      setLoading(false);
    }
  };

  const toggleTheme = () => {
    const nextThemeMode = isDark ? "light" : "dark";
    setThemeMode(nextThemeMode);
    localStorage.setItem(
      "currentTheme",
      JSON.stringify({ currentThemeMode: nextThemeMode })
    );
  };

  const brandLogoSrc = isDark ? "/logo-darkmode.png" : "/logo-lightmode.png";
  const workflowItems = [
    {
      icon: "solar:document-add-linear",
      title: "Permohonan",
      description: "Data tenant dan ruang tercatat rapi sejak awal.",
    },
    {
      icon: "solar:checklist-minimalistic-linear",
      title: "Approval",
      description: "Setiap keputusan mengikuti tahapan yang jelas.",
    },
    {
      icon: "solar:file-download-linear",
      title: "Buku Kontrak",
      description: "Generate dan unduh dokumen kontrak otomatis.",
    },
  ];

  return (
    <Box
      sx={{
        minHeight: "100dvh",
        bgcolor: ui.pageBg,
        color: "text.primary",
        position: "relative",
        overflowX: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        px: { xs: 2, sm: 3, md: 5 },
        pt: { xs: 2, sm: 3, md: 5 },
        pb: { xs: 7, md: 5 },
        transition: "background-color 0.3s ease, color 0.3s ease",
        "&::before": {
          content: '""',
          position: "absolute",
          inset: 0,
          background: ui.pageGradient,
        },
        "&::after": {
          content: '""',
          position: "absolute",
          inset: 0,
          opacity: ui.gridOpacity,
          backgroundImage: `linear-gradient(${ui.gridColor} 1px, transparent 1px), linear-gradient(90deg, ${ui.gridColor} 1px, transparent 1px)`,
          backgroundSize: "48px 48px",
          maskImage:
            "linear-gradient(to bottom, transparent, black 18%, black 82%, transparent)",
          pointerEvents: "none",
        },
      }}
    >
      <LoadingBackdrop
        open={loading || redirecting}
        message={redirecting ? "Redirecting..." : "Memproses login..."}
        color={ui.loadingText}
      />

      <Box
        sx={{
          width: "100%",
          maxWidth: 1080,
          minHeight: { xs: "auto", md: 620 },
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1.05fr 0.95fr" },
          alignItems: "stretch",
          position: "relative",
          zIndex: 1,
          border: `1px solid ${ui.border}`,
          borderRadius: { xs: 3, md: 4 },
          overflow: "hidden",
          bgcolor: ui.shellBg,
          backdropFilter: "blur(22px)",
          boxShadow: ui.shellShadow,
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: { xs: 3, md: 4 },
            minHeight: { xs: "auto", md: 620 },
            p: { xs: 3, sm: 4, md: 5, lg: 6 },
            color: ui.featureText,
            background: ui.featurePanelBg,
            position: "relative",
            overflow: "hidden",
            "&::before": {
              content: '""',
              position: "absolute",
              inset: "auto -80px -120px auto",
              width: 360,
              height: 360,
              border: `36px solid ${ui.featureRingBorder}`,
              borderRadius: "50%",
            },
          }}
        >
          <Box
            sx={{
              position: "relative",
              zIndex: 1,
              display: "flex",
              alignItems: "center",
            }}
          >
            <Box
              sx={{
                width: { xs: 46, md: 58 },
                height: { xs: 46, md: 58 },
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 2.5,
                bgcolor: ui.featureCardBg,
                border: `1px solid ${ui.featureBorder}`,
                flexShrink: 0,
              }}
            >
              <Image
                src="/sewain-s-icon-white.png"
                alt="SewaIN"
                width={34}
                height={34}
                priority
              />
            </Box>
          </Box>

          <Box
            sx={{
              position: "relative",
              zIndex: 1,
              maxWidth: 430,
            }}
          >
            <Typography
              component="h2"
              sx={{
                fontSize: { xs: 28, sm: 34, md: 36, lg: 42 },
                lineHeight: { xs: 1.12, md: 1.1 },
                fontWeight: 900,
                letterSpacing: 0,
                mb: { xs: 1.5, md: 2 },
              }}
            >
              Kelola sewa ruang dengan alur yang tertata
            </Typography>
            <Typography
              sx={{
                color: ui.featureMuted,
                fontSize: { xs: 13.5, md: 15 },
                fontWeight: 500,
                lineHeight: { xs: 1.7, md: 1.8 },
                maxWidth: 390,
              }}
            >
              Dari permohonan, persetujuan, pembayaran, sampai ruang siap
              digunakan kembali.
            </Typography>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)", md: "1fr" },
                gap: { xs: 1, md: 1.5 },
                mt: { xs: 3, md: 5 },
              }}
            >
              {workflowItems.map((item) => (
                <Box
                  key={item.title}
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "36px 1fr", sm: "1fr", md: "42px 1fr" },
                    gap: { xs: 1.25, sm: 1, md: 1.5 },
                    alignItems: "center",
                    p: { xs: 1.25, md: 1.5 },
                    borderRadius: 2,
                    bgcolor: ui.featureCardBg,
                    border: `1px solid ${ui.featureBorder}`,
                  }}
                >
                  <Box
                    sx={{
                      width: { xs: 36, md: 42 },
                      height: { xs: 36, md: 42 },
                      borderRadius: 1.5,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      bgcolor: ui.featureCardBg,
                    }}
                  >
                    <Icon icon={item.icon} fontSize={20} />
                  </Box>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontSize: { xs: 12.5, md: 13 }, fontWeight: 800 }}>
                      {item.title}
                    </Typography>
                    <Typography
                      sx={{
                        mt: 0.25,
                        color: ui.featureMuted,
                        fontSize: { xs: 11.5, md: 12 },
                        fontWeight: 500,
                        lineHeight: 1.5,
                      }}
                    >
                      {item.description}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        </Box>

        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, sm: 5, md: 6 },
            borderRadius: 0,
            bgcolor: ui.surfaceBg,
            boxShadow: "none",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            minHeight: { xs: "auto", md: 620 },
          }}
        >
          <Box
            display="flex"
            justifyContent="flex-end"
            alignItems="center"
            mb={{ xs: 4, md: 5 }}
          >
            <IconButton
              onClick={toggleTheme}
              aria-label="toggle theme"
              sx={{
                width: 42,
                height: 42,
                color: ui.accent,
                bgcolor: ui.fieldBg,
                border: `1px solid ${ui.border}`,
                "&:hover": {
                  bgcolor: ui.featureCardBg,
                },
              }}
            >
              {isDark ? (
                <Icon
                  icon="line-md:sunny-filled-loop-to-moon-filled-loop-transition"
                  fontSize="23px"
                />
              ) : (
                <Icon
                  icon="line-md:moon-filled-alt-to-sunny-filled-loop-transition"
                  fontSize="23px"
                />
              )}
            </IconButton>
          </Box>

          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              flexDirection: "column",
              mb: { xs: 4, md: 5 },
            }}
          >
            <Image
              src={brandLogoSrc}
              alt="SewaIN"
              width={220}
              height={86}
              priority
              sizes="(max-width: 600px) 190px, 220px"
              style={{
                width: isMobile ? "190px" : "220px",
                height: "auto",
              }}
            />
            <Typography
              component="h1"
              sx={{
                mt: 2,
                color: "text.primary",
                fontSize: { xs: 24, sm: 28, md: 30 },
                fontWeight: 800,
                textAlign: "center",
                letterSpacing: 0,
              }}
            >
              Masuk ke Dashboard
            </Typography>
            <Typography
              sx={{
                mt: 1,
                color: ui.mutedText,
                fontSize: { xs: 13, sm: 14 },
                fontWeight: 500,
                textAlign: "center",
              }}
            >
              Gunakan akun terdaftar untuk melanjutkan.
            </Typography>
          </Box>

          <Box
            component="form"
            onSubmit={(e) => {
              e.preventDefault();
              handleLogin();
            }}
          >
            <TextField
              label="Username"
              variant="outlined"
              fullWidth
              margin="normal"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
              required
              disabled={loading || redirecting}
              color="primary"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Icon
                      icon="solar:user-rounded-linear"
                      fontSize={21}
                      color={ui.mutedText}
                    />
                  </InputAdornment>
                ),
              }}
              sx={{
                mt: 0,
                "& .MuiOutlinedInput-root": {
                  minHeight: 56,
                  borderRadius: 2,
                  bgcolor: ui.fieldBg,
                  "& fieldset": {
                    borderColor: ui.border,
                  },
                  "&:hover fieldset": {
                    borderColor: ui.accent,
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: ui.accent,
                    borderWidth: 1.5,
                  },
                },
              }}
            />
            <TextField
              label="Password"
              variant="outlined"
              fullWidth
              margin="normal"
              type={showPass ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading || redirecting}
              color="primary"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Icon
                      icon="solar:lock-password-linear"
                      fontSize={21}
                      color={ui.mutedText}
                    />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={() => setShowPass(!showPass)}
                      edge="end"
                      disabled={loading || redirecting}
                      sx={{ color: ui.accent }}
                    >
                      {showPass ? (
                        <Icon icon="solar:eye-linear" fontSize={23} />
                      ) : (
                        <Icon icon="solar:eye-closed-linear" fontSize={23} />
                      )}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  minHeight: 56,
                  borderRadius: 2,
                  bgcolor: ui.fieldBg,
                  "& fieldset": {
                    borderColor: ui.border,
                  },
                  "&:hover fieldset": {
                    borderColor: ui.accent,
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: ui.accent,
                    borderWidth: 1.5,
                  },
                },
              }}
            />
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              sx={{
                mt: 2.5,
                minHeight: 52,
                borderRadius: 2,
                fontWeight: 800,
                fontSize: 15,
                textTransform: "uppercase",
                boxShadow: ui.buttonShadow,
                "&:hover": {
                  boxShadow: ui.buttonHoverShadow,
                },
              }}
              disabled={loading || redirecting}
              startIcon={
                loading && <CircularProgress size={22} color="inherit" />
              }
            >
              {loading ? "Logging in..." : "Login"}
            </Button>
          </Box>
        </Paper>
      </Box>

      <Box
        sx={{
          position: "fixed",
          bottom: 0,
          left: 0,
          width: "100%",
          py: 1.5,
          px: 2,
          bgcolor: "transparent",
          zIndex: 2,
          textAlign: "center",
        }}
      >
        <Typography
          variant="body2"
          color="text.secondary"
          align="center"
          sx={{ fontSize: { xs: 11, sm: 13 } }}
        >
          Copyright &copy; {new Date().getFullYear()} - Perumda Pasar Manado
        </Typography>
      </Box>

      <Notification
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      />
    </Box>
  );
}
