import React, { useState } from "react";
import {
  Box,
  IconButton,
  Typography,
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon,
  Divider,
  Tooltip,
  useTheme,
  alpha,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu"; // <-- Tambahkan ini
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LogoutIcon from "@mui/icons-material/Logout";
import PersonIcon from "@mui/icons-material/Person";
import BusinessIcon from "@mui/icons-material/Business";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import { Icon } from "@iconify/react";

const TopMenu = ({
  themeMode,
  setThemeMode,
  onProfile = () => {},
  onMenuIconClick = () => {}, // <-- Tambahkan prop ini
}) => {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleAvatarClick = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const onLogout = () => {
    handleMenuClose();
    localStorage.removeItem("user");
    window.location.href = "/";
  };

  return (
    <Box
      sx={{
        p: 2,
        width: "100%",
        height: "70px",
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        transition: "all 0.3s",
        // marginBottom: "20px",
      }}
    >
      {/* Left: Burger Icon + Logo + Main Office */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        {/* <IconButton
          onClick={onMenuIconClick}
          edge="start"
          color="inherit"
          aria-label="open drawer"
          sx={{ mr: 1 }}
        >
          <MenuIcon />
        </IconButton> */}
        {/* <LocationOnIcon sx={{ fontSize: 32, color: "primary.main" }} /> */}
        <Typography variant="h6" fontWeight="bold">
          Main Office
        </Typography>
      </Box>

      {/* Right: Theme Toggle + Avatar */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        {/* <Tooltip title={themeMode === "dark" ? "Light Mode" : "Dark Mode"}>
          <IconButton
            onClick={() =>
              setThemeMode(themeMode === "dark" ? "light" : "dark")
            }
            aria-label="toggle theme"
            sx={{
              color: themeMode === "dark" ? "#fff" : "#222",
              transition: "background-color 0.3s, color 0.3s",
            }}
          >
            {themeMode === "dark" ? <LightModeIcon /> : <DarkModeIcon />}
          </IconButton>
        </Tooltip> */}
        {/* <Tooltip title="Profile">
          <IconButton onClick={handleAvatarClick} size="small" sx={{ ml: 1 }}>
            <Avatar
              src={"/avatar-women2.png"}
              alt="Super Admin"
              sx={{
                width: 36,
                height: 36,
                bgcolor: "primary.main",
                border: "2px solid #eee",
              }}
              imgProps={{
                referrerPolicy: "no-referrer",
                style: { objectFit: "cover" },
              }}
            />
          </IconButton>
        </Tooltip> */}
        <Tooltip title="Setting">
          <IconButton
            onClick={handleAvatarClick}
            size="small"
            sx={{
              color: theme.palette.primary.main,
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              "&:hover": {
                bgcolor: alpha(theme.palette.primary.main, 0.2),
              },
            }}
          >
            <Icon
              icon="line-md:cog-filled-loop"
              color={theme.palette.primary.main}
              fontSize="36px"
            />
          </IconButton>
        </Tooltip>
        <Menu
          anchorEl={anchorEl}
          open={open}
          onClose={handleMenuClose}
          onClick={handleMenuClose}
          PaperProps={{
            elevation: 3,
            sx: { mt: 1.5, minWidth: 180 },
          }}
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "right",
          }}
          transformOrigin={{
            vertical: "top",
            horizontal: "right",
          }}
        >
          <MenuItem onClick={onProfile}>
            <ListItemIcon>
              <PersonIcon fontSize="small" />
            </ListItemIcon>
            Profil
          </MenuItem>
          <Divider />
          <MenuItem onClick={onLogout}>
            <ListItemIcon>
              <LogoutIcon fontSize="small" />
            </ListItemIcon>
            Logout
          </MenuItem>
        </Menu>
      </Box>
    </Box>
  );
};

export default TopMenu;
