"use client";

import React from "react";
import { Box, InputAdornment, Stack, TextField, Typography, useTheme } from "@mui/material";
import { Icon } from "@iconify/react";

/**
 * Shell reusable untuk halaman list data.
 * Fungsinya menyatukan toolbar, search, table container, dan empty hint agar
 * halaman master data berikutnya bisa memakai bahasa visual yang sama.
 */
export default function DataTableShell({
  title,
  description,
  searchValue,
  searchPlaceholder = "Cari data...",
  onSearchChange,
  action,
  children,
}) {
  const theme = useTheme();

  return (
    <Box
      sx={{
        bgcolor: theme.ui.dashboardCardBg,
        border: `1px solid ${theme.ui.dashboardCardBorder}`,
        borderRadius: 3,
        boxShadow: theme.ui.dashboardCardShadow,
        overflow: "hidden",
      }}
    >
      <Stack
        direction={{ xs: "column", md: "row" }}
        alignItems={{ xs: "stretch", md: "center" }}
        justifyContent="space-between"
        spacing={1.5}
        sx={{ p: { xs: 1.5, sm: 2 } }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontFamily: "Poppins", fontWeight: 850, fontSize: 18 }}>
            {title}
          </Typography>
          {description && (
            <Typography
              sx={{
                color: theme.ui.mutedText,
                fontFamily: "Poppins",
                fontWeight: 600,
                fontSize: 12,
                mt: 0.25,
              }}
            >
              {description}
            </Typography>
          )}
        </Box>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ xs: "stretch", sm: "center" }}>
          <TextField
            size="small"
            value={searchValue}
            onChange={(event) => onSearchChange?.(event.target.value)}
            placeholder={searchPlaceholder}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Icon icon="solar:magnifer-linear" fontSize={18} />
                </InputAdornment>
              ),
            }}
            sx={{
              minWidth: { xs: "100%", sm: 260 },
              "& .MuiOutlinedInput-root": {
                fontFamily: "Poppins",
                borderRadius: 2,
                bgcolor:
                  theme.palette.mode === "dark"
                    ? "rgba(255,255,255,0.04)"
                    : "rgba(17,24,39,0.03)",
              },
            }}
          />
          {action}
        </Stack>
      </Stack>

      <Box sx={{ px: { xs: 1, sm: 2 }, pb: { xs: 1, sm: 2 } }}>{children}</Box>
    </Box>
  );
}
