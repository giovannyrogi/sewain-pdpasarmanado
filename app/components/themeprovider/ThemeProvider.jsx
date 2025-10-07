import React from "react";
import { ThemeProvider, createTheme } from "@mui/material/styles";

export const lightTheme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#E60909" },
    secondary: { main: "#CB3CFF" },
    inactiveColor: { main: "#BDBDBD" },
    background: { default: "#ffffff", paper: "#fff" },
    text: { primary: "#232323", secondary: "#BDBDBD" },
    error: { main: "#f44336" },
    success: { main: "#4CAF50" },
    info: { main: "#2196F3" },
    warning: { main: "#FFC107" },
  },
});

export const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#FF9800" },
    secondary: { main: "#CB3CFF" },
    inactiveColor: { main: "#BDBDBD" },
    background: { default: "#000000" },
    text: { primary: "#fff", secondary: "#BDBDBD" },
    error: { main: "#f44336" },
    success: { main: "#4CAF50" },
    info: { main: "#2196F3" },
    warning: { main: "#FFC107" },
  },
});

export default function AppThemeProvider({ themeMode, children }) {
  const theme = themeMode === "dark" ? darkTheme : lightTheme;
  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
}
