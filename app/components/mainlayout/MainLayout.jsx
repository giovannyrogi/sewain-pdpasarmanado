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
import LoadingBackdrop from "../loading/Backdrop";

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
  const isMobile = useMediaQuery("(max-width:1300px)");
  const user = useUser();
  const menus = roleMenus[user?.role_id] ?? [];

  // Pusatkan kontrol Drawer di MainLayout
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loadingBackdropOpen, setLoadingBackdropOpen] = useState(false);

  // Contoh: aktifkan backdrop saat logout dipanggil dari TopMenu
  const handleShowLoading = () => setLoadingBackdropOpen(true);
  const handleHideLoading = () => setLoadingBackdropOpen(false);

  return (
    <>
      {/* === GLOBAL BACKDROP === */}
      <LoadingBackdrop open={loadingBackdropOpen} message="Loading..." />
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
            <Grid
              size={2.2}
              sx={{
                zIndex: 10,
                position: "sticky",
                top: 0,
                alignSelf: "flex-start",
                height: "100vh",
                overflowY: "auto",
              }}
            >
              <LeftNavBar menus={menus} user={user} />
            </Grid>
          )}

          {/* Konten utama */}
          <Grid size={isMobile ? 12 : 9.8}>
            <Grid
              size={12}
              sx={{
                position: "sticky",
                top: 0,
                zIndex: 9,
                backgroundColor: "background.default",
              }}
            >
              {/* Kirim kontrol Drawer ke TopMenu */}
              <TopMenu
                user={user}
                onBurgerClick={() => setDrawerOpen(true)}
                onShowLoading={handleShowLoading}
                onHideLoading={handleHideLoading}
              />
            </Grid>

            {/* Drawer mobile */}
            {isMobile && (
              <MobileLeftNavBar
                menus={menus}
                user={user}
                drawerOpen={drawerOpen}
                onCloseDrawer={() => setDrawerOpen(false)}
              />
            )}

            <Grid
              size={12}
              // sx={{
              //   overflowY: "auto",
              //   height: "calc(100vh - 55px)", // tinggi layar dikurangi tinggi TopMenu
              //   p: 2,
              // }}
            >
              {children}
            </Grid>
          </Grid>
        </Grid>
      </Box>
    </>
  );
};

export default MainLayout;
