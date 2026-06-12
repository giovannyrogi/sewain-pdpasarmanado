"use client";

import React from "react";
import { IconButton, Tooltip } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { Icon } from "@iconify/react";

/**
 * Tombol aksi standar untuk kolom "Aksi" pada table.
 *
 * Light mode dibuat seperti contained button agar kontras dan mudah dikenali,
 * sementara dark mode memakai surface transparan dengan border tipis agar tetap
 * menyatu dengan theme gelap aplikasi.
 */
export default function TableActionButton({
  title,
  color = "primary",
  icon,
  onClick,
  disabled = false,
  sx,
}) {
  return (
    <Tooltip title={title}>
      <span>
        <IconButton
          size="small"
          color={color}
          onClick={onClick}
          disabled={disabled}
          sx={(theme) => {
            const paletteColor =
              theme.palette[color]?.main || theme.palette.primary.main;
            const isDark = theme.palette.mode === "dark";

            return {
              flex: "0 0 auto",
              width: 34,
              height: 34,
              borderRadius: 1.5,
              color: isDark ? paletteColor : theme.palette.getContrastText(paletteColor),
              border: isDark ? `1px solid ${alpha(paletteColor, 0.46)}` : "none",
              bgcolor: isDark ? alpha(paletteColor, 0.13) : paletteColor,
              boxShadow: isDark
                ? `0 8px 18px ${alpha(paletteColor, 0.12)}`
                : `0 8px 16px ${alpha(paletteColor, 0.2)}`,
              transition:
                "transform 0.18s ease, box-shadow 0.18s ease, background-color 0.18s ease, border-color 0.18s ease",
              "&:hover": {
                bgcolor: isDark ? alpha(paletteColor, 0.22) : paletteColor,
                borderColor: isDark ? alpha(paletteColor, 0.66) : "transparent",
                transform: "translateY(-1px)",
                boxShadow: isDark
                  ? `0 10px 22px ${alpha(paletteColor, 0.18)}`
                  : `0 10px 22px ${alpha(paletteColor, 0.28)}`,
              },
              "&:active": {
                transform: "translateY(0)",
              },
              "&.Mui-disabled": {
                color: alpha(theme.palette.text.primary, 0.28),
                bgcolor: alpha(theme.palette.text.primary, 0.08),
                borderColor: alpha(theme.palette.text.primary, 0.12),
                boxShadow: "none",
              },
              ...sx,
            };
          }}
        >
          <Icon icon={icon} fontSize={18} />
        </IconButton>
      </span>
    </Tooltip>
  );
}
