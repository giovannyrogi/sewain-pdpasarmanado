"use client";

import { Chip, Stack, useTheme } from "@mui/material";
import { alpha } from "@mui/material/styles";

const STATUS_LABELS = {
  active: "Aktif",
  inactive: "Nonaktif",
  blacklisted: "Blacklist",
};

const getModuleConfig = (theme, module, status) => {
  const isBlacklisted = status === "blacklisted";
  const isInactive = status === "inactive";
  const baseColor =
    module === "room"
      ? theme.palette.info.main
      : theme.palette.warning.main;
  const color = isBlacklisted
    ? theme.palette.error.main
    : isInactive
      ? theme.palette.text.secondary
      : baseColor;

  return {
    color,
    label: module === "room" ? "Sewa Ruangan" : "Izin Lahan",
  };
};

export default function IdentityModuleBadges({ identity, compact = false }) {
  const theme = useTheme();
  const hasApplicationScope =
    typeof identity?.has_room_rental_application === "boolean" ||
    typeof identity?.has_land_permit_application === "boolean";
  const hasRoomRental = hasApplicationScope
    ? Boolean(identity?.has_room_rental_application)
    : Boolean(identity?.is_room_rental_registered);
  const hasLandPermit = hasApplicationScope
    ? Boolean(identity?.has_land_permit_application)
    : Boolean(identity?.is_land_permit_registered);
  const modules = [
    hasRoomRental && {
      key: "room",
      status: identity?.status || "active",
    },
    hasLandPermit && {
      key: "land",
      status: identity?.land_permit_status || "active",
    },
  ].filter(Boolean);

  if (modules.length === 0) return null;

  return (
    <Stack direction="row" flexWrap="wrap" gap={0.65} sx={{ minWidth: 0 }}>
      {modules.map(({ key, status }) => {
        const config = getModuleConfig(theme, key, status);
        const statusLabel = STATUS_LABELS[status] || status;

        return (
          <Chip
            key={key}
            size="small"
            label={`${config.label} - ${statusLabel}`}
            variant="outlined"
            sx={{
              height: compact ? 23 : 26,
              maxWidth: "100%",
              color: config.color,
              bgcolor: alpha(
                config.color,
                theme.palette.mode === "dark" ? 0.13 : 0.08,
              ),
              borderColor: alpha(config.color, 0.45),
              "& .MuiChip-label": {
                px: compact ? 0.85 : 1.1,
                overflow: "hidden",
                textOverflow: "ellipsis",
                fontSize: compact ? 9.5 : 10.5,
                fontWeight: 700,
              },
            }}
          />
        );
      })}
    </Stack>
  );
}
