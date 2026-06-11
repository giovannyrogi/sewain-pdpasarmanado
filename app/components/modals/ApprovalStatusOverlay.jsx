"use client";

import React from "react";
import { Box, Typography, useTheme } from "@mui/material";

/**
 * Overlay status approval reusable untuk menandai data yang sudah selesai.
 * Status dapat dikirim langsung lewat prop `status`, atau diambil dari object
 * data memakai beberapa kemungkinan key agar tetap kompatibel dengan modul lama.
 */
export default function ApprovalStatusOverlay({
  data,
  status,
  statusKeys = ["status", "approval_status", "termination_approval_status"],
}) {
  const theme = useTheme();
  const resolvedStatus =
    status || statusKeys.map((key) => data?.[key]).find(Boolean) || "";
  const normalizedStatus = String(resolvedStatus).toLowerCase();
  const isVisible = ["approved", "rejected"].includes(normalizedStatus);

  if (!isVisible) return null;

  const isApproved = normalizedStatus === "approved";
  const color = isApproved ? theme.palette.success.main : theme.palette.error.main;
  const label = isApproved ? "Approved" : "Rejected";

  return (
    <Box
      sx={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%) rotate(-14deg)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "none",
        zIndex: 2,
        px: { xs: 3, sm: 5 },
        py: { xs: 1.4, sm: 1.8 },
        border: `4px solid ${color}`,
        borderRadius: 2,
        opacity: 0.34,
        backgroundColor:
          theme.palette.mode === "dark"
            ? "rgba(0,0,0,0.18)"
            : "rgba(255,255,255,0.18)",
      }}
    >
      <Typography
        sx={{
          fontWeight: 900,
          color,
          textTransform: "uppercase",
          letterSpacing: { xs: 3, sm: 5 },
          fontStyle: "italic",
          fontSize: { xs: 30, sm: 42 },
          lineHeight: 1,
          textShadow:
            theme.palette.mode === "dark"
              ? "0 2px 8px rgba(0,0,0,0.5)"
              : "0 2px 8px rgba(255,255,255,0.7)",
        }}
      >
        {label}
      </Typography>
    </Box>
  );
}
