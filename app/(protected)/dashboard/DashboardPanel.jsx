"use client";

import React from "react";
import { Box, Button, Divider, Skeleton, Stack, Typography, useTheme } from "@mui/material";
import { Icon } from "@iconify/react";
import Link from "next/link";
import { getDashboardDividerSx, getDashboardPanelSx } from "./dashboardStyles";

/**
 * Wrapper panel dashboard dengan header, action opsional, loading, dan empty state.
 * Komponen ini dipakai ulang agar section dashboard tidak menduplikasi style.
 */
export default function DashboardPanel({
  title,
  caption,
  actionHref,
  actionLabel = "Buka",
  action,
  loading,
  empty,
  emptyText = "Belum ada data.",
  children,
  sx,
}) {
  const theme = useTheme();

  return (
    <Box sx={getDashboardPanelSx(theme, { p: { xs: 1.5, sm: 2 }, minHeight: 260, ...sx })}>
      <Stack spacing={1.5} sx={{ height: "100%" }}>
        <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1 }}>
          <Box>
            <Typography sx={{ fontWeight: 900, fontSize: 16 }}>{title}</Typography>
            {caption && (
              <Typography sx={{ color: theme.ui.mutedText, fontWeight: 600, fontSize: 12, mt: 0.25 }}>
                {caption}
              </Typography>
            )}
          </Box>
          {action ||
            (actionHref && (
            <Button
              LinkComponent={Link}
              href={actionHref}
              size="small"
              endIcon={<Icon icon="solar:arrow-right-linear" />}
              sx={{ minWidth: 0, fontWeight: 900, color: theme.palette.primary.main }}
            >
              {actionLabel}
            </Button>
          ))}
        </Box>

        <Divider sx={getDashboardDividerSx(theme)} />

        {loading ? (
          <Stack spacing={1.1}>
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} variant="rounded" height={56} />
            ))}
          </Stack>
        ) : empty ? (
          <Box
            sx={{
              minHeight: 160,
              display: "grid",
              placeItems: "center",
              textAlign: "center",
              color: theme.ui.mutedText,
            }}
          >
            <Stack alignItems="center" spacing={1}>
              <Icon icon="solar:check-circle-bold-duotone" fontSize={34} />
              <Typography sx={{ fontWeight: 800, fontSize: 13 }}>{emptyText}</Typography>
            </Stack>
          </Box>
        ) : (
          children
        )}
      </Stack>
    </Box>
  );
}
