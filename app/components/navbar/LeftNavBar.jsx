import React, { useCallback, useState } from "react";
import {
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
  useMediaQuery,
  Avatar,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { useThemeMode } from "../themeprovider/ThemeContext";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import { Icon } from "@iconify/react";
import settingsMenu from "../menu/SettingsMenu";
import LoadingBackdrop from "../loading/Backdrop";
import { redirect, usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import axios from "axios";

const LeftNavBar = ({ menus, activeMenu, onMenuClick, user }) => {
  const theme = useTheme();
  const { themeMode, setThemeMode } = useThemeMode();
  const [openDropdown, setOpenDropdown] = useState(null);
  const [loading, setLoading] = useState(false);
  const isMobile = useMediaQuery("(max-width:600px)");
  const router = useRouter();
  const pathname = usePathname();

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

  // Cek apakah menu utama aktif (langsung atau salah satu submenunya)
  const isMenuActive = (menu) =>
    (menu.path && pathname === menu.path) ||
    (menu.submenu && menu.submenu.some((sub) => sub.path === pathname));

  // Cek apakah submenu aktif
  const isSubMenuActive = (sub) => sub.path === pathname;

  // Handler untuk menu click
  const handleMenuClick = useCallback(
    (menu) => {
      let path = menu.path;
      if (!path && menu.submenu) {
        setOpenDropdown((prev) => (prev === menu.value ? null : menu.value));
        return;
      }
      if (!path) return;
      router.push(path);
      if (onMenuClick) onMenuClick(menu.value);
    },
    [router, onMenuClick]
  );

  return (
    <Paper
      elevation={6}
      sx={{
        p: 2,
        width: "100%",
        bgcolor: "background.default",
        boxShadow: 4,
        height: "100%",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Area Menu & Settings */}
      <Box
        sx={{
          flex: "1 1 auto",
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Logo & Brand */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 1,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: "2px" }}>
            <img
              src={
                themeMode === "dark"
                  ? "/logo-darkmode.png"
                  : "/logo-lightmode.png"
              }
              alt="logo-sewain"
              style={{ height: 60, width: 180 }}
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
          </Box>

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

          {/* Show/Hide Sidebar */}
          {/* <Box sx={{ display: "flex", alignItems: "center" }}>
            <IconButton
              sx={{
                p: 0,
                m: 0,
              }}
            >
              <KeyboardArrowLeftIcon
                sx={{
                  mr: -1,
                  fontSize: "18px",
                }}
              />{" "}
              <KeyboardArrowRightIcon
                sx={{
                  fontSize: "18px",
                }}
              />
            </IconButton>
          </Box> */}
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

        {/* Menu */}
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
                      <ExpandLess
                        sx={{
                          fontSize: "18px",
                        }}
                      />
                    ) : (
                      <ExpandMore
                        sx={{
                          fontSize: "18px",
                        }}
                      />
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
                          onClick={() => handleMenuClick(sub)}
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

        {/* <Divider
          sx={{
            mt: 2,
          }}
        /> */}

        {/* Settings Menu*/}
        {/* <List sx={{ mt: 2 }}>
          <ListItem disablePadding>
            <ListItemButton
              onClick={() =>
                setOpenDropdown(openDropdown === "settings" ? null : "settings")
              }
              selected={
                openDropdown === "settings" ||
                settingsMenu.submenu.some((sub) => activeMenu === sub.value)
              }
              sx={{
                ml: -1.2,
                color:
                  openDropdown === "settings" ||
                  settingsMenu.submenu.some((sub) => activeMenu === sub.value)
                    ? theme.palette.primary.main
                    : theme.palette.text.primary,
                "& .MuiListItemIcon-root": {
                  color:
                    openDropdown === "settings" ||
                    settingsMenu.submenu.some((sub) => activeMenu === sub.value)
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
              <ListItemIcon sx={{ mr: -2 }}>{settingsMenu.icon}</ListItemIcon>
              <ListItemText
                primary={
                  <Typography sx={{ fontSize: "14px" }}>
                    {settingsMenu.label}
                  </Typography>
                }
              />
              {openDropdown === "settings" ? (
                <ExpandLess sx={{ fontSize: "18px" }} />
              ) : (
                <ExpandMore sx={{ fontSize: "18px" }} />
              )}
            </ListItemButton>
          </ListItem>
          <Collapse
            in={openDropdown === "settings"}
            timeout="auto"
            unmountOnExit
          >
            <List component="div" disablePadding>
              {settingsMenu.submenu.map((sub) => (
                <ListItem disablePadding key={sub.value} sx={{ pl: 2.2 }}>
                  <ListItemButton
                    sx={{
                      ml: -1.2,
                      color:
                        activeMenu === sub.value && sub.value !== "theme"
                          ? theme.palette.primary.main
                          : theme.palette.text.primary,
                      borderLeft:
                        activeMenu === sub.value && sub.value !== "theme"
                          ? `5px solid ${theme.palette.primary.main}`
                          : "none",
                      bgcolor:
                        activeMenu === sub.value && sub.value !== "theme"
                          ? alpha(theme.palette.primary.main, 0.12)
                          : "transparent !important",
                      "& .MuiListItemIcon-root": {
                        color:
                          activeMenu === sub.value && sub.value !== "theme"
                            ? theme.palette.primary.main
                            : theme.palette.text.primary,
                      },
                      "&.Mui-selected, &.Mui-selected:hover, &:hover": {
                        bgcolor:
                          activeMenu === sub.value && sub.value !== "theme"
                            ? alpha(theme.palette.primary.main, 0.12)
                            : "transparent !important",
                        color:
                          activeMenu === sub.value && sub.value !== "theme"
                            ? theme.palette.primary.main
                            : theme.palette.text.primary,
                        "& .MuiListItemIcon-root": {
                          color:
                            activeMenu === sub.value && sub.value !== "theme"
                              ? theme.palette.primary.main
                              : theme.palette.text.primary,
                        },
                      },
                      "&:hover": {
                        bgcolor:
                          activeMenu === sub.value && sub.value !== "theme"
                            ? alpha(theme.palette.primary.main, 0.12)
                            : "transparent !important",
                        color:
                          activeMenu === sub.value && sub.value !== "theme"
                            ? theme.palette.primary.main
                            : theme.palette.text.primary,
                      },
                    }}
                    selected={pathname === sub.value}
                    onClick={() => {
                      if (sub.value !== "theme") {
                        // onMenuClick(sub.value);
                        handleMenuClick(sub);
                      }
                      // setOpenDropdown(null);
                    }}
                  >
                    {sub.showIcon ? (
                      <ListItemIcon sx={{ mr: -2.5, ml: -1 }}>
                        {sub.icon}
                      </ListItemIcon>
                    ) : null}
                    {sub.label !== "Theme" ? (
                      <ListItemText
                        primary={
                          <Typography sx={{ fontSize: "13px" }}>
                            {sub.label}
                          </Typography>
                        }
                      />
                    ) : (
                      // Theme Tonggle Light/Dark
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "space-between",
                          width: "100%",
                        }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "flex-start",
                            width: "50%",
                          }}
                        >
                          <ListItemText
                            primary={
                              themeMode === "light" ? (
                                <Typography sx={{ fontSize: "14px" }}>
                                  {sub.label} Light
                                </Typography>
                              ) : (
                                <Typography sx={{ fontSize: "14px" }}>
                                  {sub.label} Dark
                                </Typography>
                              )
                            }
                          />
                        </Box>
                        <Box
                          sx={{
                            display: "flex",
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "space-between",
                            bgcolor: themeMode === "dark" ? "black" : "#F9F3EE",
                            // border: `1px solid ${theme.palette.primary.main}`,
                            borderRadius: 2,
                            // boxShadow: "0px 4px 4px rgba(0, 0, 0, 0.25)",
                            width: "50%",
                            overflow: "hidden",
                          }}
                        >
                          <Button
                            sx={{
                              flex: 1,
                              minWidth: 0,
                              color:
                                themeMode === "light"
                                  ? theme.palette.primary.main
                                  : "unset",
                              textTransform: "none",
                              borderRadius: 0,
                              bgcolor:
                                themeMode === "light"
                                  ? alpha(theme.palette.primary.main, 0.2)
                                  : "transparent",
                              "&:hover": {
                                bgcolor: alpha(theme.palette.primary.main, 0.1),
                              },
                              transition: "background-color 0.2s",
                            }}
                            onClick={() => {
                              setThemeMode("light");
                              localStorage.setItem(
                                "currentTheme",
                                JSON.stringify({
                                  currentThemeMode: "light",
                                })
                              );
                            }}
                          >
                            <Icon
                              icon="line-md:moon-filled-alt-to-sunny-filled-loop-transition"
                              fontSize="20px"
                            />
                          </Button>
                          <Button
                            sx={{
                              flex: 1,
                              minWidth: 0,
                              color:
                                themeMode === "dark"
                                  ? theme.palette.primary.main
                                  : "unset",
                              textTransform: "none",
                              borderRadius: 0,
                              bgcolor:
                                themeMode === "dark"
                                  ? alpha(theme.palette.primary.main, 0.2)
                                  : "transparent",
                              "&:hover": {
                                bgcolor: alpha(theme.palette.primary.main, 0.1),
                              },
                              transition: "background-color 0.2s",
                            }}
                            onClick={() => {
                              setThemeMode("dark");
                              localStorage.setItem(
                                "currentTheme",
                                JSON.stringify({
                                  currentThemeMode: "dark",
                                })
                              );
                            }}
                          >
                            <Icon
                              icon="line-md:moon-rising-filled-loop"
                              fontSize="20px"
                            />
                          </Button>
                        </Box>
                      </Box>
                    )}
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Collapse>
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
      {/* Spinner full screen saat redirect */}
      <LoadingBackdrop open={loading} message="Logging out..." />
    </Paper>
  );
};

export default LeftNavBar;
