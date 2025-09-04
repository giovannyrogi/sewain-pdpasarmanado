import React, { useRef, useState, useEffect } from "react";
import {
  BottomNavigation,
  BottomNavigationAction,
  Box,
  Paper,
  Slide,
} from "@mui/material";
import { activeColor } from "../colors";

const BottomNavBar = ({
  menus = [],
  activeMenu,
  onMenuClick,
  showSubmenu,
  onSubmenuClick,
}) => {
  // Array of ref untuk setiap menu utama
  const menuRefs = useRef([]);

  // console.log("activeMenu", activeMenu);
  // console.log("showSubmenu", showSubmenu);
  // console.log("menus", menus);
  // console.log("menuRefs", menuRefs);
  // console.log("onMenuClick", onMenuClick);
  // console.log("onSubmenuClick", onSubmenuClick);

  // Cari index menu utama yang sedang aktif (punya submenu)
  const activeMainMenuIndex = menus.findIndex(
    (menu) =>
      menu.submenu &&
      (menu.value === activeMenu ||
        menu.submenu.some((sub) => sub.value === activeMenu))
  );

  const activeMainMenu = menus[activeMainMenuIndex];

  // posisi popup submenu
  const [submenuPosition, setSubmenuPosition] = useState({ left: 0, width: 0 });

  useEffect(() => {
    if (
      showSubmenu &&
      activeMainMenuIndex !== -1 &&
      menuRefs.current[activeMainMenuIndex]
    ) {
      const rect =
        menuRefs.current[activeMainMenuIndex].getBoundingClientRect();
      setSubmenuPosition({
        left: rect.left + rect.width / 2,
        width: rect.width * (activeMainMenu?.submenu?.length || 1),
      });
    }
  }, [showSubmenu, activeMainMenuIndex, activeMainMenu]);

  // Value pada BottomNavigation harus menu utama jika submenu sedang aktif
  const navValue =
    activeMainMenu && showSubmenu ? activeMainMenu.value : activeMenu;
  return (
    <Box
      sx={{
        width: "100%",
        position: "fixed",
        bottom: 0,
        left: 0,
        zIndex: 1201,
        bgcolor: "background.paper",
        borderTop: "1px solid",
        borderColor: "divider",
      }}
    >
      <BottomNavigation
        showLabels
        value={navValue}
        onChange={(event, newValue) => {
          const menuIdx = menus.findIndex((m) => m.value === newValue);
          const menu = menus[menuIdx];
          if (menu?.submenu) {
            onMenuClick(newValue, true); // buka submenu
          } else {
            onMenuClick(newValue, false);
          }
        }}
      >
        {menus.map((menu, idx) => (
          <BottomNavigationAction
            key={menu.value}
            ref={(el) => (menuRefs.current[idx] = el)}
            value={menu.value}
            label={menu.label}
            icon={menu.icon}
            sx={{
              color:
                activeMenu === menu.value ||
                (menu.submenu &&
                  menu.submenu.some((sub) => sub.value === activeMenu))
                  ? activeColor
                  : undefined,
              "&.Mui-selected": {
                color: activeColor,
              },
            }}
          />
        ))}
      </BottomNavigation>

      {/* Submenu Popup */}
      {activeMainMenu && (
        <Slide direction="up" in={showSubmenu} mountOnEnter unmountOnExit>
          <Paper
            elevation={3}
            sx={{
              position: "fixed",
              left: submenuPosition.left - submenuPosition.width / 2,
              bottom: 56,
              minWidth: 120,
              width: submenuPosition.width || 160,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-evenly",
              bgcolor: "background.paper",
              borderRadius: 2,
              border: "1px solid",
              borderColor: "divider",
              zIndex: 1300,
              py: 1,
              boxShadow: 4,
              transition: "left 0.2s",
            }}
          >
            {activeMainMenu.submenu.map((submenu) => (
              <Box
                key={submenu.value}
                onClick={() => onSubmenuClick(submenu.value)}
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  cursor: "pointer",
                  color:
                    activeMenu === submenu.value
                      ? activeColor
                      : "text.secondary",
                  px: 2,
                  minWidth: 60,
                }}
              >
                {submenu.icon}
                <span style={{ fontSize: 12 }}>{submenu.label}</span>
              </Box>
            ))}
          </Paper>
        </Slide>
      )}
    </Box>
  );
};

export default BottomNavBar;
