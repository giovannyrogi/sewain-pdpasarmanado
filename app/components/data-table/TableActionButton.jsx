"use client";

import React, { useState } from "react";
import {
  Button,
  Menu,
  MenuItem,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { Icon } from "@iconify/react";

/**
 * Tombol aksi standar untuk header DataTableShell.
 * Komponen ini dipakai untuk aksi tabel yang butuh perilaku responsif sama:
 * label tampil di layar lebar, lalu disembunyikan di mobile agar toolbar rapi.
 */
export default function TableActionButton({
  disabled,
  ariaLabel = "Aksi tabel",
  label,
  title,
  color = "primary",
  icon = "solar:menu-dots-bold-duotone",
  keepLabelOnMobile = false,
  fullWidthOnMobile = false,
  items = [],
  onClick,
}) {
  const theme = useTheme();
  const compact = useMediaQuery(theme.breakpoints.down("sm"));
  const [anchorEl, setAnchorEl] = useState(null);
  const openMenu = Boolean(anchorEl);
  const hasMenu = items.length > 0;
  const iconOnly = !label;
  const hideLabelOnMobile = Boolean(label) && compact && !keepLabelOnMobile;
  const actionColor =
    theme.palette[color]?.main || theme.palette.primary.main;

  const closeMenu = () => setAnchorEl(null);

  const handleSelect = (item) => {
    closeMenu();
    item?.onClick?.();
  };

  const handleClick = (event) => {
    if (hasMenu) {
      setAnchorEl(event.currentTarget);
      return;
    }

    onClick?.();
  };

  return (
    <>
      <Button
        variant={iconOnly ? "outlined" : theme.palette.mode === "dark" ? "outlined" : "contained"}
        color={color}
        disabled={disabled}
        onClick={handleClick}
        startIcon={<Icon icon={icon} />}
        title={title}
        aria-label={title || ariaLabel}
        sx={{
          minHeight: iconOnly ? 34 : 40,
          minWidth: iconOnly
            ? 34
            : fullWidthOnMobile
              ? { xs: "100%", sm: 128 }
              : { xs: hideLabelOnMobile ? 44 : 128, sm: 128 },
          width: iconOnly
            ? 34
            : fullWidthOnMobile
              ? { xs: "100%", sm: "auto" }
              : { xs: hideLabelOnMobile ? 44 : "auto", sm: "auto" },
          borderRadius: 2,
          px: iconOnly ? 0 : { xs: hideLabelOnMobile ? 1.25 : 2, sm: 2 },
          fontFamily: "Poppins",
          fontWeight: 700,
          textTransform: "none",
          flex: "0 0 auto",
          ...(iconOnly && {
            color: actionColor,
            borderColor: alpha(actionColor, theme.palette.mode === "dark" ? 0.55 : 0.42),
            bgcolor: alpha(actionColor, theme.palette.mode === "dark" ? 0.12 : 0.08),
            boxShadow:
              theme.palette.mode === "dark"
                ? `0 4px 12px ${alpha(actionColor, 0.08)}`
                : `0 4px 12px ${alpha(actionColor, 0.12)}`,
            "&:hover": {
              color: actionColor,
              borderColor: alpha(actionColor, 0.75),
              bgcolor: alpha(actionColor, theme.palette.mode === "dark" ? 0.2 : 0.14),
              boxShadow: `0 6px 16px ${alpha(actionColor, 0.2)}`,
              transform: "translateY(-1px)",
            },
            "&:active": {
              transform: "translateY(0)",
              boxShadow: `0 2px 8px ${alpha(actionColor, 0.16)}`,
            },
            "&.Mui-disabled": {
              color: theme.palette.action.disabled,
              borderColor: theme.palette.action.disabledBackground,
              bgcolor: alpha(theme.palette.action.disabled, 0.05),
              boxShadow: "none",
            },
          }),
          "& .MuiButton-startIcon": {
            m: iconOnly ? 0 : undefined,
            mr: iconOnly ? 0 : { xs: hideLabelOnMobile ? 0 : 1, sm: 1 },
          },
        }}
      >
        {label ? (
          <Typography
            component="span"
            sx={{
              display: { xs: hideLabelOnMobile ? "none" : "inline", sm: "inline" },
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            {label}
          </Typography>
        ) : null}
      </Button>

      {hasMenu && (
        <Menu
          anchorEl={anchorEl}
          open={openMenu}
          onClose={closeMenu}
          PaperProps={{
            sx: {
              mt: 1,
              minWidth: 190,
              borderRadius: 2,
              bgcolor: theme.ui.menuPaperBg,
              border: `1px solid ${theme.ui.dashboardCardBorder}`,
              boxShadow: 6,
            },
          }}
        >
          {items.map((item) => (
            <MenuItem
              key={item.label}
              disabled={item.disabled}
              onClick={() => handleSelect(item)}
            >
              <Icon icon={item.icon} fontSize={20} />
              <Typography sx={{ ml: 1, fontWeight: 700 }}>
                {item.label}
              </Typography>
            </MenuItem>
          ))}
        </Menu>
      )}
    </>
  );
}
