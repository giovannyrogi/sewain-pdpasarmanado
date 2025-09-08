"use client";
import React, { useEffect, useState } from "react";
import { Box, Grid, useMediaQuery, useTheme } from "@mui/material";
import LeftNavBar from "../components/navbar/LeftNavBar";
import MobileLeftNavBar from "../components/navbar/MobileLeftNavBar";
import menuSuperadmin from "../components/menu/MenuItemSuperadmin";

const SuperadminLayout = ({ children }) => {
  const isMobile = useMediaQuery("(max-width:1200px)");
  const [user, setUser] = useState(null);

  // Helper untuk ambil cookie by name
  const getCookie = (name) => {
    const match = document.cookie.match(
      new RegExp("(^| )" + name + "=([^;]+)")
    );
    return match ? decodeURIComponent(match[2]) : null;
  };

  useEffect(() => {
    const loggedInUser = getCookie("loggedInUser");

    if (loggedInUser) {
      console.log("loggedInUser", loggedInUser);
      try {
        setUser(JSON.parse(loggedInUser));
      } catch (err) {
        console.error("Gagal parsing cookie loggedInUser:", err);
      }
    }
  }, []);

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
          {isMobile ? (
            <MobileLeftNavBar menus={menuSuperadmin} user={user} />
          ) : (
            <LeftNavBar menus={menuSuperadmin} user={user} />
          )}
        </Grid>
        <Grid size={isMobile ? 12 : 9.2}>{children}</Grid>
      </Grid>
    </Box>
  );
};

export default SuperadminLayout;
