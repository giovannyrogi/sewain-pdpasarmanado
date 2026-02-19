"use client";
import {
  Box,
  Typography,
  Divider,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Grid,
} from "@mui/material";
import moment from "moment";
import React, { forwardRef } from "react";
import formatRupiah from "../formatrupiah/page";
import Image from "next/image";

const FotoKTP = forwardRef(({ data }, ref) => {
  if (!data) return null;

  return (
    <Box
      ref={ref}
      sx={{
        padding: "10px 30px 0px 30px",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Box
        sx={{
          width: "100%",
          maxWidth: 450,
          aspectRatio: "16/9",
          position: "relative",
          mt: 10,
        }}
      >
        <Image
          src={`/api${data?.ktp_file_path}`}
          alt={`foto-ktp-${data?.tenant_name}`}
          fill
          style={{ objectFit: "contain", borderRadius: "8px" }}
          priority
        />
      </Box>
    </Box>
  );
});

export default FotoKTP;
