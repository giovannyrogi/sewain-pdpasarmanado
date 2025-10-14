import { Divider, Grid, Typography, useTheme } from "@mui/material";
import React from "react";

const PaymentProof = ({ label, handleSwitchImage }) => {
  const theme = useTheme();

  return (
    <Grid
      size={12}
      sx={{
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-between",
      }}
    >
      <Typography
        sx={{
          fontWeight: "bold",
          fontSize: "13px",
        }}
      >
        {label}
      </Typography>
      <Typography
        sx={{
          fontWeight: "bold",
          fontSize: "13px",
          wordBreak: "break-word", // <-- biar kata panjang pecah
          whiteSpace: "normal", // <-- biar bisa turun baris
          overflowWrap: "anywhere", // <-- tambahan supaya lebih fleksibel
          cursor: "pointer",
          textDecoration: "underline",
          //hover
          "&:hover": {
            color: theme.palette.primary.main,
            textDecoration: "underline",
          },
        }}
        onClick={handleSwitchImage}
      >
        Lihat Bukti
      </Typography>
    </Grid>
  );
};

export default PaymentProof;
