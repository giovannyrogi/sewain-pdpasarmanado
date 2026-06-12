"use client";

import React from "react";
import { Chip } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { Icon } from "@iconify/react";

const STATUS_META = {
  proses: {
    label: "Dalam Proses",
    color: "warning",
    icon: "solar:hourglass-line-bold-duotone",
  },
  approved: {
    label: "Disetujui",
    color: "success",
    icon: "solar:verified-check-bold-duotone",
  },
  rejected: {
    label: "Ditolak",
    color: "error",
    icon: "solar:close-circle-bold-duotone",
  },
  cancelled: {
    label: "Dibatalkan",
    color: "error",
    icon: "solar:forbidden-circle-bold-duotone",
  },
};

/**
 * ApprovalStatusChip memusatkan tampilan status approval/verifikasi.
 * Komponen ini dipakai lintas menu agar status tenant application,
 * tenant termination, dan payment tidak punya gaya visual berbeda-beda.
 */
export default function ApprovalStatusChip({
  status,
  step,
  totalStep = 5,
  label,
  onClick,
  theme,
  sx,
}) {
  const normalizedStatus = String(status || "proses").toLowerCase();
  const meta = STATUS_META[normalizedStatus] || STATUS_META.proses;
  const paletteColor = theme?.palette?.[meta.color]?.main || meta.color;
  const resolvedLabel =
    label ||
    (normalizedStatus === "proses" && step
      ? `${meta.label} ${step}/${totalStep}`
      : meta.label);

  return (
    <Chip
      size="small"
      icon={<Icon icon={meta.icon} fontSize={15} />}
      label={resolvedLabel}
      onClick={onClick}
      sx={{
        height: 28,
        borderRadius: 999,
        cursor: onClick ? "pointer" : "default",
        color: paletteColor,
        fontFamily: "Poppins",
        fontWeight: 700,
        bgcolor: alpha(paletteColor, theme?.palette?.mode === "dark" ? 0.16 : 0.1),
        border: `1px solid ${alpha(paletteColor, 0.28)}`,
        "& .MuiChip-icon": { color: paletteColor },
        "& .MuiChip-label": { px: 0.85 },
        ...sx,
      }}
    />
  );
}
