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
        <CircularProgress sx={{ color: theme.palette.primary.main }} />
        {message && (
          <Typography
            sx={{
              ml: 2,
              fontWeight: "bold",
              color: theme.palette.primary.main,
              //shadow
              textShadow: "1px 1px 2px rgba(0, 0, 0, 0.50)",
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
