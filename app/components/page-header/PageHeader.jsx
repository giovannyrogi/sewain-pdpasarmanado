"use client";

import React from "react";
import { Box, Chip, Stack, Typography, useTheme } from "@mui/material";
import { Icon } from "@iconify/react";

/**
 * Header halaman reusable untuk semua menu.
 * Komponen ini hanya berfungsi sebagai identitas halaman, bukan tempat summary
 * angka operasional, sehingga aman dipakai ulang di dashboard, report, dan list.
 */
export default function PageHeader({
  eyebrow,
  title,
  description,
  icon = "solar:chart-2-bold-duotone",
  action,
}) {
  const theme = useTheme();

  return (
    <Box
      sx={{
        position: "relative",
        overflow: "hidden",
        borderRadius: 3,
        border: `1px solid ${theme.ui.dashboardCardBorder}`,
        background:
          theme.palette.mode === "dark"
            ? "linear-gradient(135deg, rgba(18,18,18,0.98), rgba(8,8,8,0.98))"
            : "linear-gradient(135deg, rgba(255,255,255,0.98), rgba(255,245,245,0.98))",
        boxShadow: theme.ui.dashboardCardShadow,
        p: { xs: 2, sm: 2.5, lg: 3 },
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          alignItems: { xs: "flex-start", md: "center" },
          justifyContent: "space-between",
          gap: 2,
        }}
      >
        <Stack spacing={1} sx={{ minWidth: 0, maxWidth: 860 }}>
          {eyebrow && (
            <Chip
              icon={<Icon icon={icon} />}
              label={eyebrow}
              size="small"
              sx={{
                width: "fit-content",
                height: 30,
                px: 0.5,
                borderRadius: 999,
                fontWeight: 900,
                color: theme.palette.primary.main,
                bgcolor:
                  theme.palette.mode === "dark"
                    ? "rgba(255, 152, 0, 0.13)"
                    : "rgba(230, 9, 9, 0.10)",
              }}
            />
          )}

          <Typography
            component="h1"
            sx={{
              fontFamily: "Poppins",
              fontWeight: 950,
              fontSize: { xs: 25, sm: 32, lg: 38 },
              lineHeight: 1.14,
              letterSpacing: 0,
            }}
          >
            {title}
          </Typography>

          {description && (
            <Typography
              sx={{
                color: theme.ui.mutedText,
                fontWeight: 650,
                fontSize: { xs: 13, sm: 14 },
                lineHeight: 1.7,
              }}
            >
              {description}
            </Typography>
          )}
        </Stack>

        {action && <Box sx={{ flex: "0 0 auto" }}>{action}</Box>}
      </Box>
    </Box>
  );
}
