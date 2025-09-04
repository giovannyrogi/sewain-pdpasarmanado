"use client";
import React, { useEffect, useState } from "react";
import { Box, Grid, useMediaQuery, useTheme } from "@mui/material";
import LeftNavBar from "../components/navbar/LeftNavBar";
import { useThemeMode } from "../components/themeprovider/ThemeContext";
import menuAdmin from "../components/menu/MenuItemAdmin";
import MobileLeftNavBar from "../components/navbar/MobileLeftNavBar";

const AdminLayout = ({ children }) => {
  const isMobile = useMediaQuery("(max-width:1200px)");
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("loggedInUser");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
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
            <MobileLeftNavBar menus={menuAdmin} user={user} />
          ) : (
            <LeftNavBar menus={menuAdmin} user={user} />
          )}
        </Grid>
        <Grid size={isMobile ? 12 : 9.2}>{children}</Grid>
      </Grid>
    </Box>
  );
}

export default AdminLayout