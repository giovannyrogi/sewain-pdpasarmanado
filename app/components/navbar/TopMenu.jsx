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
  Paper,
  useMediaQuery,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu"; // <-- Tambahkan ini
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LogoutIcon from "@mui/icons-material/Logout";
import PersonIcon from "@mui/icons-material/Person";
import BusinessIcon from "@mui/icons-material/Business";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import { Icon } from "@iconify/react";
import { useThemeMode } from "../themeprovider/ThemeContext";
import LoadingBackdrop from "../loading/Backdrop";
import axios from "axios";
import { redirect } from "next/navigation";

const TopMenu = ({ user, onBurgerClick, onShowLoading, onHideLoading }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery("(max-width:1200px)");
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const { themeMode, setThemeMode } = useThemeMode();

  const handleAvatarClick = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const handleLogout = async () => {
    onShowLoading?.();
    try {
      await axios.post("/api/logout");
      setTimeout(() => {
        // window.location.href = "/login"; // middleware akan handle redirect
        redirect("/login");
      }, 1000);
    } catch (err) {
      console.log("error logout", err);
      onHideLoading?.();
    }
  };

  return (
    <Paper
      sx={{
        p: 2,
        height: "55px",
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: isMobile ? "space-between" : "flex-end",
        transition: "all 0.3s",
        borderRadius: "0px",
        // marginBottom: "20px",
        // background: themeMode === "dark" ? "#1C1C1C" : "#fff",
      }}
    >
      {/* Left: Burger Icon */}
      {isMobile && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <IconButton
            onClick={onBurgerClick}
            edge="start"
            aria-label="open drawer"
            sx={{
              mr: 1,
              color: theme.palette.primary.main,
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <MenuIcon />
            <Typography sx={{ fontFamily: "poppins", fontWeight: "bold" }}>
              Menu
            </Typography>
          </IconButton>
        </Box>
      )}

      {/* Right: Theme Toggle + Avatar */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <Tooltip title={themeMode === "dark" ? "Light Mode" : "Dark Mode"}>
          <IconButton
            onClick={() => {
              setThemeMode(themeMode === "dark" ? "light" : "dark");
              localStorage.setItem(
                "currentTheme",
                JSON.stringify({
                  currentThemeMode: themeMode === "dark" ? "light" : "dark",
                })
              );
            }}
            aria-label="toggle theme"
            sx={{
              color: themeMode === "dark" ? "#fff" : "#222",
              transition: "background-color 0.3s, color 0.3s",
              color: theme.palette.primary.main,
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              "&:hover": {
                bgcolor: alpha(theme.palette.primary.main, 0.2),
              },
            }}
          >
            {themeMode === "dark" ? (
              <Icon icon="line-md:moon-rising-filled-loop" fontSize="22px" />
            ) : (
              <Icon
                icon="line-md:moon-filled-alt-to-sunny-filled-loop-transition"
                fontSize="22px"
              />
            )}
          </IconButton>
        </Tooltip>
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
              fontSize="25px"
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
          <MenuItem>
            <ListItemIcon>
              <PersonIcon fontSize="small" />
            </ListItemIcon>
            Profil
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleLogout}>
            <ListItemIcon>
              <LogoutIcon fontSize="small" />
            </ListItemIcon>
            Logout
          </MenuItem>
        </Menu>
      </Box>
    </Paper>
  );
};

export default TopMenu;
