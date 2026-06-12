"use client";

import React from "react";
import { Box, Stack, Typography, useTheme } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { Icon } from "@iconify/react";

/**
 * Card statistik ringkas yang reusable untuk halaman data master dan dashboard.
 * Parent cukup mengirim label, value, icon, dan color; komponen ini yang menjaga
 * spacing, warna dark/light, serta ukuran font agar konsisten di semua halaman.
 */
export default function SummaryStatCard({ label, value, icon, color }) {
  const theme = useTheme();
  const accentColor = color || theme.palette.primary.main;

  return (
    <Box
      sx={{
        width: "100%",
        height: "100%",
        p: { xs: 1.45, sm: 1.65 },
        minHeight: { xs: 104, sm: 116 },
        borderRadius: 2.5,
        border: `1px solid ${theme.ui.dashboardCardBorder}`,
        bgcolor: theme.ui.dashboardCardBg,
        boxShadow: theme.ui.dashboardCardShadow,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        transition: "transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease",
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: theme.ui.dashboardCardHoverShadow,
          borderColor: alpha(accentColor, theme.palette.mode === "dark" ? 0.34 : 0.28),
        },
      }}
    >
      <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
        <Typography
          sx={{
            color: theme.ui.mutedText,
            fontFamily: "Poppins",
            fontWeight: 700,
            fontSize: { xs: 11.5, sm: 12 },
            lineHeight: 1.4,
          }}
        >
          {label}
        </Typography>

        <Box
          sx={{
            width: { xs: 34, sm: 38 },
            height: { xs: 34, sm: 38 },
            borderRadius: 2,
            display: "grid",
            placeItems: "center",
            color: accentColor,
            bgcolor: alpha(accentColor, theme.palette.mode === "dark" ? 0.18 : 0.1),
            border: `1px solid ${alpha(accentColor, theme.palette.mode === "dark" ? 0.26 : 0.16)}`,
          }}
        >
          <Icon icon={icon} fontSize={21} />
        </Box>
      </Stack>

      <Typography
        sx={{
          fontFamily: "Poppins",
          fontWeight: 700,
          fontSize: { xs: 25, sm: 30 },
          lineHeight: 1,
          letterSpacing: 0,
        }}
      >
        {value}
      </Typography>
    </Box>
  );
}
