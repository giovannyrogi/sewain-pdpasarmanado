import React from "react";
import {
  Backdrop,
  CircularProgress,
  Typography,
  Box,
  useTheme,
} from "@mui/material";
import { useThemeMode } from "../themeprovider/ThemeContext";

const LoadingBackdrop = ({
  open = false,
  message = "Loading...",
  color = "#fff",
  zIndex = (theme) => theme.zIndex.drawer + 999999,
  ...props
}) => {
  const { themeMode } = useThemeMode();
  const theme = useTheme();

  return (
    <Backdrop
      open={open}
      sx={{ color, zIndex, flexDirection: "column" }}
      {...props}
    >
      <Box
        display="flex"
        alignItems="center"
        justifyContent={"center"}
        flexDirection={"column"}
        gap={2}
      >
        <CircularProgress
          sx={{
            color:
              themeMode === "dark"
                ? theme.palette.primary.main
                : '#fff',
          }}
        />
        {message && (
          <Typography
            sx={{
              ml: 2,
              fontWeight: "bold",
              color:
                themeMode === "dark"
                  ? theme.palette.primary.main
                  : '#fff',
            }}
          >
            {message}
          </Typography>
        )}
      </Box>
    </Backdrop>
  );
};

export default LoadingBackdrop;
