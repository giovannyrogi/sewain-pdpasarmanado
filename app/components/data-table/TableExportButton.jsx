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
import { Icon } from "@iconify/react";

/**
 * Tombol export standar untuk header DataTableShell.
 * Label otomatis disembunyikan di layar kecil agar tombol tetap rapi di samping
 * judul tabel, sementara menu export tetap sama di semua halaman.
 */
export default function TableExportButton({
  disabled,
  ariaLabel = "Export data",
  items = [],
}) {
  const theme = useTheme();
  const compact = useMediaQuery(theme.breakpoints.down("sm"));
  const [anchorEl, setAnchorEl] = useState(null);
  const openMenu = Boolean(anchorEl);

  const closeMenu = () => setAnchorEl(null);

  const handleSelect = (item) => {
    closeMenu();
    item?.onClick?.();
  };

  return (
    <>
      <Button
        variant={theme.palette.mode === "dark" ? "outlined" : "contained"}
        disabled={disabled}
        onClick={(event) => setAnchorEl(event.currentTarget)}
        startIcon={<Icon icon="solar:export-bold-duotone" />}
        aria-label={ariaLabel}
        sx={{
          minHeight: 40,
          minWidth: { xs: compact ? 44 : 128, sm: 128 },
          width: { xs: compact ? 44 : "auto", sm: "auto" },
          borderRadius: 2,
          px: { xs: compact ? 1.25 : 2, sm: 2 },
          fontFamily: "Poppins",
          fontWeight: 700,
          textTransform: "none",
          flex: "0 0 auto",
          "& .MuiButton-startIcon": {
            mr: { xs: compact ? 0 : 1, sm: 1 },
          },
        }}
      >
        <Typography
          component="span"
          sx={{
            display: { xs: compact ? "none" : "inline", sm: "inline" },
            fontSize: 13,
            fontWeight: 700,
          }}
        >
          Export
        </Typography>
      </Button>

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
          <MenuItem key={item.label} disabled={item.disabled} onClick={() => handleSelect(item)}>
            <Icon icon={item.icon} fontSize={20} />
            <Typography sx={{ ml: 1, fontWeight: 700 }}>{item.label}</Typography>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
