import React from "react";
import { Backdrop, CircularProgress, Typography, Box } from "@mui/material";

const LoadingBackdrop = ({
  open = false,
  message = "Loading...",
  color = "#fff",
  zIndex = (theme) => theme.zIndex.drawer + 1,
  ...props
}) => (
  <Backdrop
    open={open}
    sx={{ color, zIndex, flexDirection: "column" }}
    {...props}
  >
    <Box display="flex" alignItems="center">
      <CircularProgress color="inherit" />
      {message && (
        <Typography sx={{ ml: 2, fontWeight: "bold" }}>{message}</Typography>
      )}
    </Box>
  </Backdrop>
);

export default LoadingBackdrop;
