import React, { useCallback, useState } from "react";
import {
  Drawer,
  Paper,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Box,
  Typography,
  IconButton,
  Divider,
  Button,
  Avatar,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { useThemeMode } from "../themeprovider/ThemeContext";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import { Icon } from "@iconify/react";
import settingsMenu from "../menu/SettingsMenu";
import LoadingBackdrop from "../loading/Backdrop";
import Image from "next/image";
import { redirect, usePathname, useRouter } from "next/navigation";
import axios from "axios";

const MobileLeftNavBar = ({
  menus,
  activeMenu,
  onMenuClick,
  user,
  drawerOpen,
  onCloseDrawer,
  onShowLoading,
  onHideLoading,
  setLoadingMessage
}) => {
  const theme = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const { themeMode, setThemeMode } = useThemeMode();
  const [openDropdown, setOpenDropdown] = useState(null);
  const [loading, setLoading] = useState(false);

  // Cek apakah menu utama aktif (langsung atau salah satu submenunya)
  const isMenuActive = (menu) =>
    (menu.path && pathname === menu.path) ||
    (menu.submenu && menu.submenu.some((sub) => sub.path === pathname));

  // Cek apakah submenu aktif
  const isSubMenuActive = (sub) => sub.path === pathname;

  // Handler untuk menu click
  const handleMenuClick = useCallback(
    async (menu) => {
      setLoadingMessage("Navigating...");
      onShowLoading?.();

      try {
        let path = menu.path;

        // Jika menu punya submenu (tidak punya path langsung)
        if (!path && menu.submenu) {
          setOpenDropdown((prev) => (prev === menu.value ? null : menu.value));

          // Tutup drawer setelah sedikit delay
          setTimeout(() => {
            onHideLoading?.();
            onCloseDrawer();
          }, 300);
          return;
        }

        if (!path) {
          onHideLoading?.();
          return;
        }

        // Simpan path sekarang
        // const currentPath = pathname;

        // Jalankan navigasi
        router.push(path);

        // Tunggu hingga path benar-benar berubah
        const checkRouteChange = setInterval(() => {
          if (window.location.pathname === path) {
            clearInterval(checkRouteChange);
            // halaman sudah berpindah, baru hide loading
            onHideLoading?.();
            onCloseDrawer();
            if (onMenuClick) onMenuClick(menu.value);
          }
        }, 100);
      } catch (err) {
        console.error("Navigation error:", err);
        onHideLoading?.();
      }
    },
    [router, pathname, onMenuClick, onShowLoading, onHideLoading, onCloseDrawer]
  );

  const handleLogout = async () => {
    setLoading(true);
    try {
      await axios.post("/api/logout");
      setTimeout(() => {
        // window.location.href = "/login"; // middleware akan handle redirect
        redirect("/login");
      }, 1000);
    } catch (err) {
      console.log("error logout", err);
      setLoading(false);
    }
  };

  // Sidebar content
  const sidebarContent = (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        width: 260,
        // bgcolor: "background.default",
        minHeight: "100%",
        display: "flex",
        flexDirection: "column",
        zIndex: 99999,
      }}
    >
      <Box
        sx={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}
      >
        {/* Logo & Brand */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <img
            src={
              themeMode === "dark"
                ? "/logo-darkmode.png"
                : "/logo-lightmode.png"
            }
            alt="logo-sewain"
            style={{ height: 50, width: 160 }}
          />
          {/* <Typography
              sx={{
                fontSize: "16px",
                fontWeight: "bold",
              }}
            >
              Parking
            </Typography>
            <Typography
              sx={{
                fontSize: "16px",
                fontWeight: "bolder",
                color: theme.palette.primary.main,
              }}
            >
              Onstreet
            </Typography> */}
          {/* <Typography
              sx={{
                fontSize: "16px",
                fontWeight: "bold",
                // color: theme.palette.primary.main,
              }}
            >
              Pasar
            </Typography> */}

          {/* Show app version */}
          <Box
            sx={{
              display: "flex",
            }}
          >
            <Typography
              sx={{
                fontSize: "10px",
                fontWeight: "bolder",
                color: theme.palette.primary.main,
              }}
            >
              v1.0.0
            </Typography>
          </Box>
        </Box>

        {/* Profile */}
        <Box
          sx={{
            mt: 4,
            mb: 2,
            ml: "3px",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-start",
            gap: 1.5,
            padding: 1,
            border: "1px solid #eee",
            borderRadius: "10px",
            bgcolor:
              themeMode === "dark"
                ? alpha(theme.palette.primary.main, 0.12)
                : alpha(theme.palette.primary.main, 0.12),
          }}
        >
          <Image
            src="/logo-pdpasar.png"
            alt="logo-pdpasar"
            width={45}
            height={45}
          />
          {/* <Avatar
                    src={"/logo-pdpasar.png"}
                    alt="logo-pdpasar"
                    sx={{
                      width: 40,
                      height: 38,
                      bgcolor: "primary.main",
                      border: "2px solid #eee",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                    imgProps={{
                      referrerPolicy: "no-referrer",
                      style: { objectFit: "cover", width: 52, height: 58, },
                    }}
                  /> */}
          <Box sx={{ marginLeft: "-6px" }}>
            <Typography
              sx={{
                fontSize: "13px",
                fontWeight: "bold",
                textTransform: "capitalize",
              }}
            >
              {user ? user.full_name : ""}
            </Typography>
            <Typography
              sx={{
                fontSize: "12px",
                fontWeight: "bold",
                color: theme.palette.primary.main,
                textTransform: "capitalize",
              }}
            >
              {user ? user.role_name : ""}
            </Typography>
          </Box>
        </Box>

        {/* Main Menu */}
        <List>
          {menus.map((menu) =>
            menu.submenu ? (
              <React.Fragment key={menu.value}>
                <ListItem disablePadding>
                  <ListItemButton
                    onClick={() =>
                      setOpenDropdown(
                        openDropdown === menu.value ? null : menu.value
                      )
                    }
                    selected={isMenuActive(menu)}
                    sx={{
                      ml: -1.2,
                      color: isMenuActive(menu)
                        ? theme.palette.primary.main
                        : theme.palette.text.primary,
                      "& .MuiListItemIcon-root": {
                        color: isMenuActive(menu)
                          ? theme.palette.primary.main
                          : theme.palette.text.primary,
                      },
                      bgcolor: "transparent !important",
                      "&.Mui-selected, &.Mui-selected:hover, &:hover": {
                        bgcolor: "transparent !important",
                        color: theme.palette.primary.main,
                        "& .MuiListItemIcon-root": {
                          color: theme.palette.primary.main,
                        },
                      },
                    }}
                  >
                    <ListItemIcon sx={{ mr: -1.6 }}>{menu.icon}</ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography
                          sx={{
                            fontSize: "13px",
                            fontWeight: isMenuActive(menu) ? "bold" : "normal",
                          }}
                        >
                          {menu.label}
                        </Typography>
                      }
                    />
                    {openDropdown === menu.value ? (
                      <ExpandLess sx={{ fontSize: "18px" }} />
                    ) : (
                      <ExpandMore sx={{ fontSize: "18px" }} />
                    )}
                  </ListItemButton>
                </ListItem>
                <Collapse
                  in={openDropdown === menu.value}
                  timeout="auto"
                  unmountOnExit
                >
                  <List component="div" disablePadding>
                    {menu.submenu.map((sub) => (
                      <ListItem disablePadding key={sub.value} sx={{ pl: 2.2 }}>
                        <ListItemButton
                          sx={{
                            ml: -1.2,
                            color: isSubMenuActive(sub)
                              ? theme.palette.primary.main
                              : theme.palette.text.primary,
                            borderLeft: isSubMenuActive(sub)
                              ? `5px solid ${theme.palette.primary.main}`
                              : "none",
                            bgcolor: isSubMenuActive(sub)
                              ? alpha(theme.palette.primary.main, 0.12)
                              : "transparent !important",
                            "& .MuiListItemIcon-root": {
                              color: isSubMenuActive(sub)
                                ? theme.palette.primary.main
                                : theme.palette.text.primary,
                            },
                            "&.Mui-selected, &.Mui-selected:hover, &:hover": {
                              bgcolor: alpha(theme.palette.primary.main, 0.12),
                              color: theme.palette.primary.main,
                              "& .MuiListItemIcon-root": {
                                color: theme.palette.primary.main,
                              },
                            },
                          }}
                          selected={isSubMenuActive(sub)}
                          onClick={() => {
                            handleMenuClick(sub);
                          }}
                        >
                          {sub.showIcon ? (
                            <ListItemIcon sx={{ mr: -2.5, ml: -1 }}>
                              {sub.icon}
                            </ListItemIcon>
                          ) : null}
                          <ListItemText
                            primary={
                              <Typography
                                sx={{
                                  fontSize: "13px",
                                  fontWeight: isSubMenuActive(sub)
                                    ? "bold"
                                    : "normal",
                                }}
                              >
                                {sub.label}
                              </Typography>
                            }
                          />
                        </ListItemButton>
                      </ListItem>
                    ))}
                  </List>
                </Collapse>
              </React.Fragment>
            ) : (
              // Menu tanpa submenu
              <ListItem disablePadding key={menu.value}>
                <ListItemButton
                  selected={pathname === menu.path}
                  onClick={() => {
                    handleMenuClick(menu);
                  }}
                  sx={{
                    ml: -1.2,
                    color:
                      activeMenu === menu.value
                        ? theme.palette.primary.main
                        : theme.palette.text.primary,
                    "& .MuiListItemIcon-root": {
                      color:
                        activeMenu === menu.value
                          ? theme.palette.primary.main
                          : theme.palette.text.primary,
                    },
                    bgcolor: "transparent !important",
                    "&.Mui-selected, &.Mui-selected:hover, &:hover": {
                      color: theme.palette.primary.main,
                      "& .MuiListItemIcon-root": {
                        color: theme.palette.primary.main,
                      },
                    },
                  }}
                >
                  <ListItemIcon sx={{ mr: -1.6 }}>{menu.icon}</ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography
                        sx={{
                          fontSize: "14px",
                          fontWeight: isMenuActive(menu) ? "bold" : "normal",
                        }}
                      >
                        {menu.label}
                      </Typography>
                    }
                  />
                </ListItemButton>
              </ListItem>
            )
          )}
        </List>

        {/* <Divider sx={{ mt: 1 }} /> */}

        {/* Settings Menu */}
        {/* <List sx={{ mt: 1 }}>
          {settingsMenu.map((menu) =>
            menu.submenu ? (
              <React.Fragment key={menu.value}>
                <ListItem disablePadding>
                  <ListItemButton
                    onClick={() =>
                      setOpenDropdown(
                        openDropdown === menu.value ? null : menu.value
                      )
                    }
                    selected={isMenuActive(menu)}
                    sx={{
                      ml: -1.2,
                      color: isMenuActive(menu)
                        ? theme.palette.primary.main
                        : theme.palette.text.primary,
                      "& .MuiListItemIcon-root": {
                        color: isMenuActive(menu)
                          ? theme.palette.primary.main
                          : theme.palette.text.primary,
                      },
                      bgcolor: "transparent !important",
                      "&.Mui-selected, &.Mui-selected:hover, &:hover": {
                        bgcolor: "transparent !important",
                        color: theme.palette.primary.main,
                        "& .MuiListItemIcon-root": {
                          color: theme.palette.primary.main,
                        },
                      },
                    }}
                  >
                    <ListItemIcon sx={{ mr: -1.6 }}>{menu.icon}</ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography
                          sx={{
                            fontSize: "13px",
                            fontWeight: isMenuActive(menu) ? "bold" : "normal",
                          }}
                        >
                          {menu.label}{" "}
                        </Typography>
                      }
                    />
                    {openDropdown === menu.value ? (
                      <ExpandLess sx={{ fontSize: "18px" }} />
                    ) : (
                      <ExpandMore sx={{ fontSize: "18px" }} />
                    )}{" "}
                  </ListItemButton>{" "}
                </ListItem>

                <Collapse
                  in={openDropdown === menu.value}
                  timeout="auto"
                  unmountOnExit
                >
                  <List component="div" disablePadding>
                    {menu.submenu.map((sub) => (
                      <ListItem disablePadding key={sub.value} sx={{ pl: 2.2 }}>
                        <ListItemButton
                          selected={isSubMenuActive(sub)}
                          onClick={() => handleMenuClick(sub)}
                          sx={{
                            ml: -1.2,
                            color: isSubMenuActive(sub)
                              ? theme.palette.primary.main
                              : theme.palette.text.primary,
                            borderLeft: isSubMenuActive(sub)
                              ? `5px solid ${theme.palette.primary.main}`
                              : "none",
                            bgcolor: isSubMenuActive(sub)
                              ? alpha(theme.palette.primary.main, 0.12)
                              : "transparent !important",
                            "& .MuiListItemIcon-root": {
                              color: isSubMenuActive(sub)
                                ? theme.palette.primary.main
                                : theme.palette.text.primary,
                            },
                            "&.Mui-selected, &.Mui-selected:hover, &:hover": {
                              bgcolor: alpha(theme.palette.primary.main, 0.12),
                              color: theme.palette.primary.main,
                              "& .MuiListItemIcon-root": {
                                color: theme.palette.primary.main,
                              },
                            },
                          }}
                        >
                          {sub.showIcon ? (
                            <ListItemIcon sx={{ mr: -2.5, ml: -1 }}>
                              {sub.icon}
                            </ListItemIcon>
                          ) : null}
                          <ListItemText
                            primary={
                              <Typography
                                sx={{
                                  fontSize: "13px",
                                  fontWeight: isSubMenuActive(sub)
                                    ? "bold"
                                    : "normal",
                                }}
                              >
                                {sub.label}
                              </Typography>
                            }
                          />
                        </ListItemButton>
                      </ListItem>
                    ))}
                  </List>
                </Collapse>
              </React.Fragment>
            ) : (
              // Menu tanpa submenu
              <ListItem disablePadding key={menu.value}>
                <ListItemButton
                  selected={pathname === menu.path}
                  onClick={() => handleMenuClick(menu)}
                  sx={{
                    ml: -1.2,
                    color: isMenuActive(menu)
                      ? theme.palette.primary.main
                      : theme.palette.text.primary,
                    "& .MuiListItemIcon-root": {
                      color: isMenuActive(menu)
                        ? theme.palette.primary.main
                        : theme.palette.text.primary,
                    },
                    bgcolor: "transparent !important",
                    "&.Mui-selected, &.Mui-selected:hover, &:hover": {
                      color: theme.palette.primary.main,
                      "& .MuiListItemIcon-root": {
                        color: theme.palette.primary.main,
                      },
                    },
                  }}
                >
                  <ListItemIcon sx={{ mr: -1.6 }}>{menu.icon}</ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography
                        sx={{
                          fontSize: "14px",
                          fontWeight: isMenuActive(menu) ? "bold" : "normal",
                        }}
                      >
                        {menu.label}
                      </Typography>
                    }
                  />
                </ListItemButton>
              </ListItem>
            )
          )}
        </List> */}
      </Box>

      {/* Logout Button - Always at Bottom */}
      {/* <Box sx={{ flexShrink: 0, mt: 2 }}>
        <List>
          <ListItem disablePadding>
            <ListItemButton
              onClick={handleLogout}
              sx={{
                ml: -1.2,
                color: theme.palette.error.main,
                "& .MuiListItemIcon-root": {
                  color: theme.palette.error.main,
                },
                bgcolor: "transparent !important",
                "&:hover": {
                  color: theme.palette.error.dark,
                  "& .MuiListItemIcon-root": {
                    color: theme.palette.error.dark,
                  },
                },
              }}
            >
              <ListItemIcon sx={{ mr: -1.6 }}>
                <Icon icon="icomoon-free:exit" fontSize={20} />
              </ListItemIcon>
              <ListItemText
                primary={
                  <Typography sx={{ fontSize: "14px", fontWeight: "bold" }}>
                    Logout
                  </Typography>
                }
              />
            </ListItemButton>
          </ListItem>
        </List>
      </Box> */}
    </Paper>
  );

  return (
    <Box>
      {/* <Button
        onClick={() => setDrawerOpen(true)}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          color: theme.palette.primary.main,
          fontWeight: "bold",
          fontSize: 16,
        }}
      >
        <Icon icon="line-md:close-to-menu-transition" fontSize={25} />
        <Typography>Menu</Typography>
      </Button> */}
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={onCloseDrawer}
        PaperProps={{
          sx: {
            width: 260,
            bgcolor: "background.default",
          },
        }}
      >
        {sidebarContent}
      </Drawer>
      <LoadingBackdrop open={loading} message="Logging out..." />
    </Box>
  );
};

export default MobileLeftNavBar;
