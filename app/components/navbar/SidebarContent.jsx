import React from "react";
import {
  Avatar,
  Box,
  Collapse,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  useTheme,
} from "@mui/material";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import Image from "next/image";

const APP_VERSION = "v1.0.0";

// Initials keep the profile card readable without depending on an external logo.
const getInitials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();

/**
 * Builds one source of truth for menu item states.
 * Desktop and mobile both use this helper so hover, active, nested, and icon
 * colors stay consistent when the design tokens change.
 */
const createMenuButtonSx = ({ theme, active, nested = false }) => ({
  minHeight: nested ? 44 : 48,
  mx: 0,
  my: nested ? 0.3 : 0.5,
  px: nested ? 1.35 : 1.5,
  borderRadius: nested ? 2.25 : 2.5,
  color: active ? theme.palette.primary.main : theme.palette.text.primary,
  bgcolor: active ? theme.ui.navItemActive : "transparent",
  border: `1px solid ${active ? theme.ui.navUserBorder : "transparent"}`,
  transition:
    "background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease, transform 0.2s ease",
  "& .MuiListItemIcon-root": {
    minWidth: nested ? 42 : 44,
    color: active ? theme.palette.primary.main : theme.ui.navIconColor,
  },
  "& .sidebar-icon-badge": {
    width: nested ? 34 : 36,
    height: nested ? 34 : 36,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 2,
    bgcolor: active ? theme.ui.iconButtonBg : theme.ui.navIconBg,
    color: active ? theme.palette.primary.main : theme.ui.navIconColor,
  },
  "&:hover": {
    bgcolor: theme.ui.navItemHover,
    borderColor: theme.ui.navUserBorder,
    color: theme.palette.primary.main,
    transform: "translateX(2px)",
    "& .MuiListItemIcon-root": {
      color: theme.palette.primary.main,
    },
    "& .sidebar-icon-badge": {
      bgcolor: theme.ui.iconButtonHover,
      color: theme.palette.primary.main,
    },
  },
  "&.Mui-selected, &.Mui-selected:hover": {
    bgcolor: theme.ui.navItemActive,
    borderColor: theme.ui.navUserBorder,
    color: theme.palette.primary.main,
    "& .MuiListItemIcon-root": {
      color: theme.palette.primary.main,
    },
    "& .sidebar-icon-badge": {
      color: theme.palette.primary.main,
    },
  },
});

/**
 * Shared sidebar renderer for desktop and mobile drawers.
 * Keeping logo, profile card, menu state, and active styling here prevents
 * desktop/mobile navigation from drifting apart during future menu changes.
 */
export default function SidebarContent({
  menus,
  user,
  pathname,
  openDropdown,
  setOpenDropdown,
  onMenuClick,
  logoSrc,
  compact = false,
}) {
  const theme = useTheme();

  const isMenuActive = (menu) =>
    (menu.path && pathname === menu.path) ||
    (menu.submenu && menu.submenu.some((sub) => sub.path === pathname));

  const isSubMenuActive = (sub) => sub.path === pathname;

  const handleParentMenuClick = (menu) => {
    // Parent menus expand locally; top-level leaf menus close any open group
    // before delegating navigation upward.
    if (menu.submenu) {
      setOpenDropdown(openDropdown === menu.value ? null : menu.value);
      return;
    }

    setOpenDropdown(null);
    onMenuClick(menu);
  };

  return (
    <Box
      sx={{
        height: "100%",
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: compact ? "flex-start" : "center",
          gap: 1,
          px: compact ? 0.5 : 1,
          pt: 0.25,
          pb: 2.5,
        }}
      >
        <Image
          src={logoSrc}
          alt="SewaIN"
          width={158}
          height={58}
          priority
          style={{ width: compact ? 144 : 158, height: "auto" }}
        />
        <Typography
          sx={{
            alignSelf: "center",
            mt: 0.25,
            color: theme.palette.primary.main,
            fontSize: 10,
            fontWeight: 800,
          }}
        >
          {APP_VERSION}
        </Typography>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "42px 1fr",
          gap: 1.25,
          alignItems: "center",
          p: 1.25,
          mb: 2,
          borderRadius: 2.5,
          bgcolor: theme.ui.navUserBg,
          border: `1px solid ${theme.ui.navUserBorder}`,
          boxShadow: theme.ui.navUserShadow,
        }}
      >
        <Avatar
          sx={{
            width: 42,
            height: 42,
            color: theme.palette.primary.main,
            bgcolor: theme.ui.iconButtonBg,
            fontSize: 14,
            fontWeight: 800,
          }}
        >
          {getInitials(user?.full_name) || "U"}
        </Avatar>
        <Box sx={{ minWidth: 0 }}>
          <Typography
            noWrap
            title={user?.full_name || ""}
            sx={{ fontSize: 13, fontWeight: 800, lineHeight: 1.3 }}
          >
            {user?.full_name || "-"}
          </Typography>
          <Typography
            noWrap
            title={user?.role_name || ""}
            sx={{
              mt: 0.25,
              color: theme.palette.primary.main,
              fontSize: 11.5,
              fontWeight: 700,
              textTransform: "capitalize",
            }}
          >
            {user?.role_name || "-"}
          </Typography>
        </Box>
      </Box>

      <Divider
        sx={{
          mx: 0.25,
          mb: 2.25,
          borderColor: theme.ui.navDivider,
          opacity: 1,
        }}
      />

      <Typography
        sx={{
          px: 0.5,
          mb: 1.25,
          color: theme.palette.text.secondary,
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: 1.2,
          textTransform: "uppercase",
        }}
      >
        Navigasi
      </Typography>

      <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto", pr: 0.5 }}>
        <List disablePadding>
          {menus
            .filter((menu) => !menu.hidden)
            .map((menu) => {
              const active = isMenuActive(menu);

              return (
                <React.Fragment key={menu.value}>
                  <ListItem disablePadding>
                    <ListItemButton
                      selected={active}
                      onClick={() => handleParentMenuClick(menu)}
                      sx={createMenuButtonSx({ theme, active })}
                    >
                      <ListItemIcon>
                        <Box className="sidebar-icon-badge">{menu.icon}</Box>
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Typography
                            noWrap
                            sx={{
                              fontSize: 13,
                              fontWeight: active ? 800 : 600,
                            }}
                          >
                            {menu.label}
                          </Typography>
                        }
                      />
                      {menu.submenu ? (
                        openDropdown === menu.value ? (
                          <ExpandLess sx={{ fontSize: 18 }} />
                        ) : (
                          <ExpandMore sx={{ fontSize: 18 }} />
                        )
                      ) : null}
                    </ListItemButton>
                  </ListItem>

                  {menu.submenu ? (
                    <Collapse
                      in={openDropdown === menu.value}
                      timeout="auto"
                      unmountOnExit
                    >
                      <List
                        disablePadding
                        sx={{
                          position: "relative",
                          ml: 1.75,
                          pl: 2,
                          py: 0.25,
                          "&::before": {
                            content: '""',
                            position: "absolute",
                            left: 9,
                            top: 6,
                            bottom: 8,
                            width: "1px",
                            borderRadius: 999,
                            bgcolor: theme.ui.navSubmenuLine,
                          },
                        }}
                      >
                        {menu.submenu.map((sub) => {
                          const subActive = isSubMenuActive(sub);

                          return (
                            <ListItem disablePadding key={sub.value}>
                              <ListItemButton
                                selected={subActive}
                                onClick={() => onMenuClick(sub)}
                                sx={createMenuButtonSx({
                                  theme,
                                  active: subActive,
                                  nested: true,
                                })}
                              >
                                {sub.showIcon ? (
                                  <ListItemIcon>
                                    <Box className="sidebar-icon-badge">
                                      {sub.icon}
                                    </Box>
                                  </ListItemIcon>
                                ) : null}
                                <ListItemText
                                  primary={
                                    <Typography
                                      noWrap
                                      sx={{
                                        fontSize: 12.5,
                                        fontWeight: subActive ? 800 : 600,
                                      }}
                                    >
                                      {sub.label}
                                    </Typography>
                                  }
                                />
                              </ListItemButton>
                            </ListItem>
                          );
                        })}
                      </List>
                    </Collapse>
                  ) : null}
                </React.Fragment>
              );
            })}
        </List>
      </Box>
    </Box>
  );
}
