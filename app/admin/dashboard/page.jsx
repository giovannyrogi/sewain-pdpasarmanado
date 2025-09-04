"use client";
import React, { useEffect, useState } from "react";
import { useThemeMode } from "@/app/components/themeprovider/ThemeContext";
import { Icon } from "@iconify/react";
import { Box, Paper, Typography, useTheme } from "@mui/material";

const DashboardAdmin = () => {
  const theme = useTheme();
  const { themeMode, setThemeMode } = useThemeMode();
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
        width: "100%",
        height: "100vh",
        p: 2,
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "flex-start",
          transition: "all 0.3s",
        }}
      >
        <Typography sx={{ mr: "10px", fontSize: "18px", fontWeight: "bold" }}>
          Welcome back, {user && user.name ? user.name : "User"}
        </Typography>
        <Icon
          icon="mdi:hand-wave"
          fontSize={25}
          color={theme.palette.primary.main}
        />
      </Box>
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "flex-start",
          transition: "all 0.3s",
        }}
      >
        <Typography
          sx={{
            mr: "3px",
            fontSize: "14px",
            color: theme.palette.primary.main,
            fontWeight: "bold",
          }}
        >
          {user && user.location_name ? user.location_name : ""}
        </Typography>
        <Icon
          icon="line-md:map-marker-twotone-loop"
          fontSize={23}
          color={theme.palette.primary.main}
        />
      </Box>
      <Paper
        elevation={6}
        sx={{
          backgroundColor: "background.default",
          p: 2,
          mt: 3,
          borderRadius: "15px",
          minHeight: "60vh",
        }}
      >
        Dashboard Content Admin
      </Paper>
    </Box>
  );
};

export default DashboardAdmin;
