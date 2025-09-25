"use client";
import React from "react";
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

const NavbarWrapper = ({ isMobile, menus, user }) =>
  isMobile ? (
    <MobileLeftNavBar menus={menus} user={user} />
  ) : (
    <LeftNavBar menus={menus} user={user} />
  );

const MainLayout = ({ children }) => {
  const isMobile = useMediaQuery("(max-width:1200px)");
  const user = useUser();
  const menus = roleMenus[user?.role_id] ?? [];

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "background.default",
        color: "text.primary",
        transition: "all 0.3s",
        p: isMobile ? 2 : 0,
      }}
    >
      <Grid container columnGap={5} rowGap={1}>
        <Grid size={2.3}>
          <NavbarWrapper isMobile={isMobile} menus={menus} user={user} />
        </Grid>
        <Grid size={isMobile ? 12 : 9.2}>{children}</Grid>
      </Grid>
    </Box>
  );
};

export default MainLayout;
