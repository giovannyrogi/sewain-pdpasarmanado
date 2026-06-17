"use client";

import { Box, Typography, useTheme } from "@mui/material";

/**
 * Footer copyright ringan yang bisa dipakai di halaman auth maupun halaman lain.
 * Komponen ini sengaja hanya mengatur teks copyright dan spacing aman agar
 * posisinya konsisten, theme-aware, serta tidak menutupi konten di mobile.
 */
export default function AppCopyrightFooter({
  companyName = "Perumda Pasar Manado",
  year = "2026",
  sx = {},
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  return (
    <Box
      component="footer"
      sx={{
        width: "100%",
        flexShrink: 0,
        pt: { xs: 1, sm: 1.25 },
        pb: {
          xs: "calc(16px + env(safe-area-inset-bottom))",
          sm: 2,
          md: 2.5,
        },
        px: { xs: 2, sm: 3 },
        bgcolor: "transparent",
        position: "relative",
        zIndex: 1,
        textAlign: "center",
        ...sx,
      }}
    >
      <Typography
        variant="body2"
        align="center"
        sx={{
          color: isDark
            ? "rgba(255, 255, 255, 0.62)"
            : "rgba(17, 24, 39, 0.52)",
          fontSize: { xs: 11, sm: 12.5 },
          fontWeight: 400,
          lineHeight: 1.5,
          letterSpacing: 0,
        }}
      >
        Copyright &copy; {year} - {companyName}
      </Typography>
    </Box>
  );
}
