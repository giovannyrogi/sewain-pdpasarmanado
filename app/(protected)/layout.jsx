"use client";
import React, { useEffect, useState } from "react";
import { Box, Grid, useMediaQuery } from "@mui/material";
import { useUser } from "../utils/useUser";
import { getMenusByRole } from "../components/menu/getMenuByRole";
import MENU_CONFIG from "../components/menu/MenuConfig";
import LoadingBackdrop from "../components/loading/Backdrop";
import LeftNavBar from "../components/navbar/LeftNavBar";
import TopMenu from "../components/navbar/TopMenu";
import MobileLeftNavBar from "../components/navbar/MobileLeftNavBar";

const MainLayout = ({ children }) => {
  const isMobile = useMediaQuery("(max-width:1300px)");
  const { user } = useUser();
  const menus = getMenusByRole(MENU_CONFIG, user?.role_id);

  // Pusatkan kontrol Drawer di MainLayout
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loadingBackdropOpen, setLoadingBackdropOpen] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Loading...");

  // aktifkan backdrop
  const handleShowLoading = () => setLoadingBackdropOpen(true);
  const handleHideLoading = () => setLoadingBackdropOpen(false);

  useEffect(() => {
    const handleGlobalShowLoading = (event) => {
      if (event.detail?.message) {
        setLoadingMessage(event.detail.message);
      }
      setLoadingBackdropOpen(true);
    };

    const handleGlobalHideLoading = () => {
      setLoadingBackdropOpen(false);
      setLoadingMessage("Loading...");
    };

    /**
     * Event global ini menjaga loading tetap hidup lintas navigasi.
     * Dipakai saat klik notifikasi karena router.push tidak memberi sinyal
     * kapan halaman tujuan sudah selesai membuka modal/detail.
     */
    window.addEventListener("sewain:global-loading-show", handleGlobalShowLoading);
    window.addEventListener("sewain:global-loading-hide", handleGlobalHideLoading);

    return () => {
      window.removeEventListener(
        "sewain:global-loading-show",
        handleGlobalShowLoading,
      );
      window.removeEventListener(
        "sewain:global-loading-hide",
        handleGlobalHideLoading,
      );
    };
  }, []);

  return (
    <>
      {/* === GLOBAL BACKDROP === */}
      <LoadingBackdrop open={loadingBackdropOpen} message={loadingMessage} />
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
              <LeftNavBar
                menus={menus}
                user={user}
                onShowLoading={handleShowLoading}
                onHideLoading={handleHideLoading}
                setLoadingMessage={(message) => setLoadingMessage(message)}
              />
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
                setLoadingMessage={(message) => setLoadingMessage(message)}
              />
            </Grid>

            {/* Drawer mobile */}
            {isMobile && (
              <MobileLeftNavBar
                menus={menus}
                user={user}
                drawerOpen={drawerOpen}
                onCloseDrawer={() => setDrawerOpen(false)}
                onShowLoading={handleShowLoading}
                onHideLoading={handleHideLoading}
                setLoadingMessage={(message) => setLoadingMessage(message)}
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
