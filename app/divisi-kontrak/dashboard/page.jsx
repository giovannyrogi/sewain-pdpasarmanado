"use client";
import React, { useEffect, useState } from "react";
import { useThemeMode } from "@/app/components/themeprovider/ThemeContext";
import { Icon } from "@iconify/react";
import { Box, Paper, Typography, useTheme } from "@mui/material";

const Dashboard = () => {
  const { themeMode, setThemeMode } = useThemeMode();
  const theme = useTheme();
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
      <Paper
        elevation={6}
        sx={{
          backgroundColor: "background.default",
          p: 2,
          mt: 3,
          borderRadius: "15px",
        }}
      >
        Dashboard Content
      </Paper>
    </Box>
  );
};

export default Dashboard;
