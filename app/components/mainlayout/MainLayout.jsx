"use client";
import React, { useState } from "react";
import { Box, Grid, useMediaQuery } from "@mui/material";
import MobileLeftNavBar from "../navbar/MobileLeftNavBar";
import LeftNavBar from "../navbar/LeftNavBar";
import { useUser } from "@/app/utils/useUser";
import menuSuperadmin from "../menu/MenuItemSuperadmin";
import menuKepalaSeksi from "../menu/MenuItemKepalaSeksi";
import menuDevisiKontrak from "../menu/MenuItemDivisiKontrak";
import menuKepalaDivisi from "../menu/MenuItemKepalaDivisi";
import menuDirekturBisnis from "../menu/MenuItemDirekturBisnis";
import menuItemDirekturUtama from "../menu/MenuItemDirekturUtama";
import menuKepalaSubdivisi from "../menu/MenuItemKepalaSubdivisi";
import menuDivisiKeuangan from "../menu/MenuItemDivisiKeuangan";
import TopMenu from "../navbar/TopMenu";

// mapping role_id → menu
const roleMenus = {
  1: menuSuperadmin,
  2: menuDevisiKontrak,
  3: menuKepalaSeksi,
  4: menuKepalaSubdivisi,
  5: menuKepalaDivisi,
  6: menuDirekturBisnis,
  7: menuItemDirekturUtama,
  8: menuDivisiKeuangan,
};

const MainLayout = ({ children }) => {
  const isMobile = useMediaQuery("(max-width:1200px)");
  const user = useUser();
  const menus = roleMenus[user?.role_id] ?? [];

  // Pusatkan kontrol Drawer di MainLayout
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "background.default",
        color: "text.primary",
        transition: "all 0.3s",
        // p: isMobile ? 2 : 0,
      }}
    >
      <Grid container rowGap={1}>
        {/* Sidebar hanya muncul di desktop */}
        {!isMobile && (
          <Grid size={2.3} sx={{ zIndex: 1 }}>
            <LeftNavBar menus={menus} user={user} />
          </Grid>
        )}

        {/* Konten utama */}
        <Grid size={isMobile ? 12 : 9.7}>
          <Grid size={12}>
            {/* 🔹 Kirim kontrol Drawer ke TopMenu */}
            <TopMenu user={user} onBurgerClick={() => setDrawerOpen(true)} />
          </Grid>

          {/* 🔹 Drawer mobile muncul di bawah TopMenu */}
          {isMobile && (
            <MobileLeftNavBar
              menus={menus}
              user={user}
              drawerOpen={drawerOpen}
              onCloseDrawer={() => setDrawerOpen(false)}
            />
          )}

          <Grid size={12}>{children}</Grid>
        </Grid>
      </Grid>
    </Box>
  );
};

export default MainLayout;
